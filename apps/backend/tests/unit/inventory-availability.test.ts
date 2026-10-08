import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { BusinessRejection, TechnicalError, createTransactionContext } from '@navard/shared-kernel';
import {
  InventoryPostingService,
  type InventoryStore,
  type LedgerRow,
  type PostingContext,
  type PostingPolicy,
  type Quantities,
  type Reservation,
  type Unit,
} from '../../src/modules/inventory/index.js';

class ReadStore implements InventoryStore {
  readonly units = new Map<string, Unit>();
  readonly totalsByUnit = new Map<string, Quantities>();
  readonly balances = new Map<string, Quantities>();
  readonly claims = new Map<string, Reservation>();
  readonly lockCalls: { unitIds: readonly string[]; effectIds: readonly string[] }[] = [];
  writes = 0;
  constructor() {
    for (let index = 0; index < 2; index++) {
      const id = randomUUID();
      this.units.set(id, {
        id,
        lotId: randomUUID(),
        kind: 'SHEET',
        locationId: randomUUID(),
        customerScope: '',
        state: 'AVAILABLE',
      });
      this.totalsByUnit.set(id, { onHand: '20.000000000000000001', reserved: '0' });
      this.balances.set(id, { onHand: '20.000000000000000001', reserved: '0' });
    }
  }
  lock(_context: PostingContext, unitIds: readonly string[], effectIds: readonly string[]) {
    this.lockCalls.push({ unitIds: [...unitIds], effectIds: [...effectIds] });
    return Promise.resolve();
  }
  unit(_context: PostingContext, id: string) {
    return Promise.resolve(this.units.get(id));
  }
  totals(_context: PostingContext, id: string) {
    return Promise.resolve(this.totalsByUnit.get(id)!);
  }
  balance(_context: PostingContext, id: string) {
    return Promise.resolve(this.balances.get(id));
  }
  activeReservation(_context: PostingContext, id: string) {
    return Promise.resolve(this.claims.get(id));
  }
  private mutation(): never {
    this.writes++;
    throw new Error('Availability must not mutate Inventory');
  }
  createUnit(): Promise<void> {
    return this.mutation();
  }
  changeState(): Promise<void> {
    return this.mutation();
  }
  project(): Promise<void> {
    return this.mutation();
  }
  findEffect(): Promise<LedgerRow | undefined> {
    throw new Error('Availability must not query posting effects');
  }
  ledger(): Promise<LedgerRow | undefined> {
    throw new Error('Availability must not query posting effects');
  }
  append(): Promise<void> {
    return this.mutation();
  }
  reservation(): Promise<Reservation | undefined> {
    throw new Error('Availability must not query reservation identities');
  }
  insertReservation(): Promise<void> {
    return this.mutation();
  }
  closeReservation(): Promise<void> {
    return this.mutation();
  }
}
function context(): PostingContext {
  return {
    actor: Object.freeze({
      installationId: randomUUID(),
      authorityScopeId: randomUUID(),
      requestId: randomUUID(),
      principal: Object.freeze({ issuer: 'identity', subject: randomUUID() }),
      actorRole: 'ACT-SALES',
      customerScope: randomUUID(),
    }),
    request: {
      command: 'RecordFulfillmentStock',
      contract_version: 1,
      idempotency_key: randomUUID(),
      target: { kind: 'fulfillment-assessment', id: randomUUID() },
      payload: {},
      preconditions: {},
    },
    transaction: createTransactionContext(),
  };
}
function policy(availability?: PostingPolicy['availability']): PostingPolicy {
  return {
    authorize: () => Promise.resolve(false),
    validate: () => Promise.resolve(undefined),
    maintain: () => Promise.resolve(false),
    ...(availability ? { availability } : {}),
  };
}
function guard(family: string) {
  return (error: unknown) =>
    error instanceof BusinessRejection && error.rejection.family === family;
}

void test('availability reads exact kg without writes, with global sorted locks and branded context', async () => {
  const store = new ReadStore();
  const suppliedContext = context();
  const ids = [...store.units.keys()].sort().reverse();
  const checks: (string | undefined)[] = [];
  const service = new InventoryPostingService(
    store,
    policy((received, unit) => {
      assert.equal(received.actor, suppliedContext.actor);
      assert.equal(received.transaction, suppliedContext.transaction);
      checks.push(unit?.id);
      return Promise.resolve(true);
    }),
  );
  const result = await service.availability(suppliedContext, ids);
  assert.deepEqual(
    result.map((row) => row.unitId),
    ids,
  );
  assert.deepEqual(
    result.map((row) => row.availableKg),
    ['20.000000000000000001', '20.000000000000000001'],
  );
  assert.deepEqual(Object.keys(result[0]!).sort(), ['availableKg', 'kind', 'state', 'unitId']);
  assert.deepEqual(store.lockCalls, [{ unitIds: [...ids].sort(), effectIds: [] }]);
  assert.deepEqual(checks, [undefined, undefined, ...ids]);
  assert.equal(store.writes, 0);
  assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result[0]));
});

void test('availability has no implicit posting/maintenance permission fallback', async () => {
  const store = new ReadStore();
  const service = new InventoryPostingService(store, {
    ...policy(),
    authorize: () => Promise.resolve(true),
    maintain: () => Promise.resolve(true),
  });
  await assert.rejects(
    service.availability(context(), [...store.units.keys()]),
    guard('GUARD_ACTOR'),
  );
  assert.equal(store.lockCalls.length, 0);
});

void test('availability denies withdrawn authority after lock and denied per-unit authority', async () => {
  for (const mode of ['withdrawn', 'unit-denied']) {
    const store = new ReadStore();
    let calls = 0;
    const service = new InventoryPostingService(
      store,
      policy((_context, unit) => {
        calls++;
        return Promise.resolve(mode === 'withdrawn' ? calls === 1 : unit === undefined);
      }),
    );
    await assert.rejects(
      service.availability(context(), [...store.units.keys()]),
      guard('GUARD_ACTOR'),
    );
    assert.equal(store.writes, 0);
    assert.equal(store.lockCalls.length, 1);
  }
});

void test('availability retains exact customer isolation even when read policy allows', async () => {
  const store = new ReadStore();
  const suppliedContext = context();
  const [first, second] = [...store.units.values()];
  first!.customerScope = suppliedContext.actor.customerScope!;
  second!.customerScope = randomUUID();
  const service = new InventoryPostingService(
    store,
    policy(() => Promise.resolve(true)),
  );
  assert.equal(
    (await service.availability(suppliedContext, [first!.id]))[0]!.availableKg,
    '20.000000000000000001',
  );
  await assert.rejects(service.availability(suppliedContext, [second!.id]), guard('GUARD_ACTOR'));
  assert.equal(store.writes, 0);
});

void test('availability returns zero for coherent reserved or terminal units', async () => {
  const store = new ReadStore();
  const [first, second] = [...store.units.values()];
  first!.state = 'RESERVED';
  store.totalsByUnit.set(first!.id, { onHand: '20', reserved: '5' });
  store.balances.set(first!.id, { onHand: '20', reserved: '5' });
  store.claims.set(first!.id, {
    id: randomUUID(),
    unitId: first!.id,
    demandId: randomUUID(),
    kg: '5',
    state: 'ACTIVE',
  });
  second!.state = 'SHIPPED';
  store.totalsByUnit.set(second!.id, { onHand: '0', reserved: '0' });
  store.balances.set(second!.id, { onHand: '0', reserved: '0' });
  const service = new InventoryPostingService(
    store,
    policy(() => Promise.resolve(true)),
  );
  assert.deepEqual(
    (await service.availability(context(), [first!.id, second!.id])).map((row) => row.availableKg),
    ['0', '0'],
  );
  assert.equal(store.writes, 0);
});

void test('availability fails closed on Ledger/projection/claim corruption without repairing it', async () => {
  for (const mode of ['projection', 'negative', 'malformed', 'missing-claim', 'unexpected-claim']) {
    const store = new ReadStore();
    const unit = [...store.units.values()][0]!;
    if (mode === 'projection') store.balances.delete(unit.id);
    if (mode === 'negative') store.totalsByUnit.set(unit.id, { onHand: '-1', reserved: '0' });
    if (mode === 'malformed') store.totalsByUnit.set(unit.id, { onHand: 'not-kg', reserved: '0' });
    if (mode === 'missing-claim') unit.state = 'RESERVED';
    if (mode === 'unexpected-claim')
      store.claims.set(unit.id, {
        id: randomUUID(),
        unitId: unit.id,
        demandId: randomUUID(),
        kg: '1',
        state: 'ACTIVE',
      });
    const service = new InventoryPostingService(
      store,
      policy(() => Promise.resolve(true)),
    );
    await assert.rejects(service.availability(context(), [unit.id]), TechnicalError);
    assert.equal(store.writes, 0);
  }
});

void test('availability validates bounded unique identities before locking', async () => {
  const store = new ReadStore();
  const id = [...store.units.keys()][0]!;
  const service = new InventoryPostingService(
    store,
    policy(() => Promise.resolve(true)),
  );
  for (const ids of [[], [id, id], ['not-uuid'], Array.from({ length: 17 }, () => randomUUID())])
    await assert.rejects(service.availability(context(), ids), guard('GUARD_INVARIANT'));
  assert.equal(store.lockCalls.length, 0);
  await assert.rejects(service.availability(context(), [randomUUID()]), guard('GUARD_STATE'));
});

void test('availability snapshots admitted unit identities before asynchronous authority check', async () => {
  const store = new ReadStore();
  const id = [...store.units.keys()][0]!;
  let release!: () => void;
  let first = true;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const service = new InventoryPostingService(
    store,
    policy(async () => {
      if (first) {
        first = false;
        await pending;
      }
      return true;
    }),
  );
  const ids = [id];
  const result = service.availability(context(), ids);
  ids[0] = randomUUID();
  release();
  assert.equal((await result)[0]!.unitId, id);
  assert.deepEqual(store.lockCalls[0]!.unitIds, [id]);
});

void test('Sales availability permission does not authorize snapshot, reconstruction or posting', async () => {
  const store = new ReadStore();
  const id = [...store.units.keys()][0]!;
  const service = new InventoryPostingService(
    store,
    policy(() => Promise.resolve(true)),
  );
  const suppliedContext = context();
  await assert.rejects(service.snapshot(suppliedContext, id), guard('GUARD_ACTOR'));
  await assert.rejects(service.rebuild(suppliedContext, [id]), guard('GUARD_ACTOR'));
  await assert.rejects(
    service.post(suppliedContext, [
      {
        type: 'STOCK_IN',
        unitId: id,
        kg: '1',
        source: { factId: randomUUID(), effectId: randomUUID() },
      },
    ]),
    guard('GUARD_ACTOR'),
  );
  assert.equal(store.writes, 0);
});
