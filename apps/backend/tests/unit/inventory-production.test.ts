import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import {
  BusinessRejection,
  TechnicalError,
  createTransactionContext,
  type CommandRequest,
} from '@navard/shared-kernel';
import {
  InventoryPostingService,
  InventoryProductionService,
  Kg,
  productionEffectId,
  type InventoryStore,
  type InventoryProductionStore,
  type ProductionBatch,
  type ProductionIssue,
  type ProductionOrigin,
  type PostingContext,
  type PostingEffect,
  type LedgerRow,
  type Unit,
  type Quantities,
  type Reservation,
} from '../../src/modules/inventory/index.js';
class MemoryInventory implements InventoryStore, InventoryProductionStore {
  readonly units = new Map<string, Unit>();
  readonly balances = new Map<string, Quantities>();
  readonly rows: LedgerRow[] = [];
  readonly claims = new Map<string, Reservation>();
  readonly issues = new Map<string, ProductionIssue>();
  readonly origins = new Map<string, ProductionOrigin>();
  readonly locks: { units: readonly string[]; effects: readonly string[] }[] = [];
  lockHook: (() => void) | undefined;
  writes = 0;
  seed(customerScope = '') {
    const id = randomUUID();
    this.units.set(id, {
      id,
      lotId: randomUUID(),
      kind: 'COIL',
      locationId: randomUUID(),
      customerScope,
      state: 'AVAILABLE',
    });
    this.rows.push({
      id: randomUUID(),
      source: { factId: randomUUID(), effectId: randomUUID() },
      unitId: id,
      binding: 'origin',
      onHandDelta: '10',
      reservedDelta: '0',
    });
    this.balances.set(id, { onHand: '10', reserved: '0' });
    return id;
  }
  lock(_context: PostingContext, units: readonly string[], effects: readonly string[]) {
    this.locks.push({ units: [...units], effects: [...effects] });
    this.lockHook?.();
    return Promise.resolve();
  }
  unit(_context: PostingContext, id: string) {
    return Promise.resolve(this.units.get(id));
  }
  createUnit(_context: PostingContext, unit: Unit) {
    this.writes++;
    this.units.set(unit.id, { ...unit });
    return Promise.resolve();
  }
  changeState(_context: PostingContext, id: string, state: Unit['state']) {
    this.writes++;
    this.units.get(id)!.state = state;
    return Promise.resolve();
  }
  totals(_context: PostingContext, id: string) {
    let onHand = Kg.zero(),
      reserved = Kg.zero();
    for (const row of this.rows.filter((row) => row.unitId === id)) {
      onHand = onHand.add(Kg.parse(row.onHandDelta));
      reserved = reserved.add(Kg.parse(row.reservedDelta));
    }
    return Promise.resolve({ onHand: onHand.toString(), reserved: reserved.toString() });
  }
  balance(_context: PostingContext, id: string) {
    return Promise.resolve(this.balances.get(id));
  }
  project(_context: PostingContext, id: string, value: Quantities) {
    this.writes++;
    this.balances.set(id, { ...value });
    return Promise.resolve();
  }
  findEffect(_context: PostingContext, source: PostingEffect['source']) {
    return Promise.resolve(this.rows.find((row) => row.source.effectId === source.effectId));
  }
  ledger(_context: PostingContext, id: string) {
    return Promise.resolve(this.rows.find((row) => row.id === id));
  }
  append(_context: PostingContext, row: LedgerRow) {
    this.writes++;
    this.rows.push(row);
    return Promise.resolve();
  }
  activeReservation(_context: PostingContext, id: string) {
    return Promise.resolve(
      [...this.claims.values()].find((claim) => claim.unitId === id && claim.state === 'ACTIVE'),
    );
  }
  reservation(_context: PostingContext, id: string) {
    return Promise.resolve(this.claims.get(id));
  }
  insertReservation(_context: PostingContext, value: Reservation) {
    this.writes++;
    this.claims.set(value.id, { ...value });
    return Promise.resolve();
  }
  closeReservation(_context: PostingContext, id: string, state: 'RELEASED' | 'CONSUMED') {
    this.writes++;
    this.claims.get(id)!.state = state;
    return Promise.resolve();
  }
  activeIssue(_context: PostingContext, id: string) {
    return Promise.resolve(this.issues.get(id));
  }
  recordIssue(_context: PostingContext, value: ProductionIssue) {
    this.writes++;
    this.issues.set(value.unitId, { ...value });
    return Promise.resolve();
  }
  closeIssue(_context: PostingContext, id: string, orderId: string) {
    assert.equal(this.issues.get(id)?.productionOrderId, orderId);
    this.writes++;
    this.issues.delete(id);
    return Promise.resolve();
  }
  origin(_context: PostingContext, id: string) {
    return Promise.resolve(this.origins.get(id));
  }
  recordOrigin(_context: PostingContext, value: ProductionOrigin) {
    this.writes++;
    this.origins.set(value.unitId, { ...value });
    return Promise.resolve();
  }
}
function fixture() {
  const store = new MemoryInventory(),
    customerId = randomUUID(),
    orderId = randomUUID();
  let allowed = true;
  const posting: InventoryPostingService = new InventoryPostingService(store, {
    authorize: () => Promise.resolve(allowed),
    maintain: () => Promise.resolve(false),
    validate: (ctx, effect, unit) => production.validateEffect(ctx, effect, unit),
    visibleForEffect: (ctx, effect, unit) => production.visibleForEffect(ctx, effect, unit),
  });
  const checks: PostingContext[] = [];
  const policy = {
    canInspect: (ctx: PostingContext) => {
      checks.push(ctx);
      return Promise.resolve(allowed);
    },
    canIssue: (ctx: PostingContext) => {
      checks.push(ctx);
      return Promise.resolve(allowed);
    },
    canComplete: (ctx: PostingContext) => {
      checks.push(ctx);
      return Promise.resolve(allowed);
    },
  };
  const production: InventoryProductionService = new InventoryProductionService(
    store,
    store,
    posting,
    policy,
  );
  function context(command = 'IssueAllocatedMaterial', id: string = randomUUID()): PostingContext {
    return {
      actor: Object.freeze({
        installationId: randomUUID(),
        authorityScopeId: randomUUID(),
        requestId: randomUUID(),
        principal: Object.freeze({ issuer: 'identity', subject: randomUUID() }),
        actorRole: command === 'IssueAllocatedMaterial' ? 'ACT-PLAN' : 'ACT-OP',
        customerScope: customerId,
      }),
      transaction: createTransactionContext(),
      request: {
        command,
        contract_version: 1,
        idempotency_key: randomUUID(),
        target: {
          kind:
            command === 'IssueAllocatedMaterial' ? 'material-allocation' : 'production-operation',
          id,
        },
        payload: {},
        preconditions: {},
      },
    };
  }
  function batch(
    unitId: string,
    kg = '6',
    disposition: 'FINAL' | 'WIP' | 'RESIDUAL' = 'WIP',
  ): ProductionBatch {
    return {
      productionOrderId: orderId,
      operationId: randomUUID(),
      inputs: [{ unitId, kg, factId: randomUUID() }],
      outputs: [
        {
          unitId: randomUUID(),
          kg,
          factId: randomUUID(),
          lotId: randomUUID(),
          kind: 'SHEET',
          locationId: randomUUID(),
          disposition,
        },
      ],
    };
  }
  return {
    store,
    posting,
    production,
    context,
    batch,
    checks,
    customerId,
    orderId,
    setAllowed: (value: boolean) => {
      allowed = value;
    },
  };
}
const guard = (family: string) => (error: unknown) =>
  error instanceof BusinessRejection && error.rejection.family === family;
void test('production issue preserves authoritative kg without any Ledger effect and pins its order/customer', async () => {
  const f = fixture(),
    id = f.store.seed(),
    ctx = f.context(),
    before = f.store.rows.length;
  const result = await f.production.issue(ctx, f.orderId, [id]);
  assert.equal(f.store.rows.length, before);
  assert.deepEqual(f.store.balances.get(id), { onHand: '10', reserved: '0' });
  assert.equal(result[0]?.state, 'ISSUED_TO_PRODUCTION');
  assert.equal(f.store.issues.get(id)?.productionOrderId, f.orderId);
  assert.equal(f.store.issues.get(id)?.customerId, f.customerId);
  assert.ok(
    f.checks.every((value) => value.actor === ctx.actor && value.transaction === ctx.transaction),
  );
});
void test('issue refuses active Sales claims, foreign material and permission withdrawn during the lock', async () => {
  for (const scenario of ['claim', 'foreign', 'revoked'] as const) {
    const f = fixture(),
      id = f.store.seed(scenario === 'foreign' ? randomUUID() : '');
    if (scenario === 'claim') {
      const claimId = randomUUID();
      f.store.claims.set(claimId, {
        id: claimId,
        unitId: id,
        demandId: randomUUID(),
        kg: '10',
        state: 'ACTIVE',
      });
    }
    if (scenario === 'revoked') f.store.lockHook = () => f.setAllowed(false);
    await assert.rejects(
      f.production.issue(f.context(), f.orderId, [id]),
      guard(scenario === 'claim' ? 'GUARD_CONFLICT' : 'GUARD_ACTOR'),
    );
    assert.equal(f.store.writes, 0);
    assert.equal(f.store.units.get(id)?.state, 'AVAILABLE');
  }
});
void test('partial production consumption keeps original remainder unavailable and creates WIP with true fact/batch provenance', async () => {
  const f = fixture(),
    id = f.store.seed();
  await f.production.issue(f.context(), f.orderId, [id]);
  const batch = f.batch(id),
    ctx = f.context('CompleteProductionOperation', batch.operationId);
  await f.production.complete(ctx, batch);
  const output = batch.outputs[0]!;
  assert.deepEqual(f.store.balances.get(id), { onHand: '4', reserved: '0' });
  assert.equal(f.store.units.get(id)?.state, 'PARTIALLY_CONSUMED');
  assert.ok(f.store.issues.has(id));
  assert.deepEqual(f.store.balances.get(output.unitId), { onHand: '6', reserved: '0' });
  assert.equal(f.store.units.get(output.unitId)?.state, 'ISSUED_TO_PRODUCTION');
  assert.equal(f.store.units.get(output.unitId)?.lotId, output.lotId);
  assert.equal(f.store.origins.get(output.unitId)?.factId, output.factId);
  assert.equal(f.store.origins.get(output.unitId)?.operationId, batch.operationId);
  assert.deepEqual(
    f.store.rows.slice(1).map((row) => row.source.factId),
    [batch.inputs[0]!.factId, output.factId],
  );
  assert.equal(
    f.store.rows[1]?.source.effectId,
    productionEffectId(batch.operationId, id, 'CONSUME'),
  );
});
void test('full consumption closes issued parent and creates final/residual AVAILABLE without reservation or shipment', async () => {
  for (const disposition of ['FINAL', 'RESIDUAL'] as const) {
    const f = fixture(),
      id = f.store.seed();
    await f.production.issue(f.context(), f.orderId, [id]);
    const batch = f.batch(id, '10', disposition);
    await f.production.complete(f.context('CompleteProductionOperation', batch.operationId), batch);
    assert.equal(f.store.units.get(id)?.state, 'CONSUMED');
    assert.equal(f.store.issues.has(id), false);
    assert.equal(f.store.units.get(batch.outputs[0]!.unitId)?.state, 'AVAILABLE');
    assert.equal(f.store.claims.size, 0);
  }
});
void test('WIP finalization changes only destiny and closes issue without adding or deducting kg', async () => {
  const f = fixture(),
    id = f.store.seed();
  await f.production.issue(f.context(), f.orderId, [id]);
  const first = f.batch(id);
  await f.production.complete(f.context('CompleteProductionOperation', first.operationId), first);
  const wip = first.outputs[0]!.unitId,
    rows = f.store.rows.length,
    origin = { ...f.store.origins.get(wip)! };
  const final: ProductionBatch = {
    productionOrderId: f.orderId,
    operationId: randomUUID(),
    inputs: [],
    outputs: [],
    finalizeUnitIds: [wip],
  };
  await f.production.complete(f.context('CompleteProductionOperation', final.operationId), final);
  assert.equal(f.store.rows.length, rows);
  assert.deepEqual(f.store.balances.get(wip), { onHand: '6', reserved: '0' });
  assert.equal(f.store.units.get(wip)?.state, 'AVAILABLE');
  assert.equal(f.store.issues.has(wip), false);
  assert.deepEqual(f.store.origins.get(wip), origin);
});
void test('later operation consumes only its own WIP and cannot take another production order remainder', async () => {
  const f = fixture(),
    id = f.store.seed();
  await f.production.issue(f.context(), f.orderId, [id]);
  const first = f.batch(id);
  await f.production.complete(f.context('CompleteProductionOperation', first.operationId), first);
  const wip = first.outputs[0]!.unitId,
    second = f.batch(wip, '6', 'FINAL');
  const foreign = { ...second, productionOrderId: randomUUID() };
  await assert.rejects(
    f.production.complete(f.context('CompleteProductionOperation', foreign.operationId), foreign),
    guard('GUARD_CONFLICT'),
  );
  await f.production.complete(f.context('CompleteProductionOperation', second.operationId), second);
  assert.equal(f.store.units.get(wip)?.state, 'CONSUMED');
  assert.equal(f.store.units.get(second.outputs[0]!.unitId)?.state, 'AVAILABLE');
  assert.deepEqual(f.store.balances.get(id), { onHand: '4', reserved: '0' });
});
void test('direct IPS production effects have no alternate admission even for an authorized operator', async () => {
  const f = fixture(),
    id = f.store.seed();
  await f.production.issue(f.context(), f.orderId, [id]);
  const batch = f.batch(id),
    ctx = f.context('CompleteProductionOperation', batch.operationId);
  const effect: PostingEffect = {
    type: 'STOCK_OUT',
    source: {
      factId: batch.inputs[0]!.factId,
      effectId: productionEffectId(batch.operationId, id, 'CONSUME'),
    },
    unitId: id,
    kg: '6',
    nextState: 'PARTIALLY_CONSUMED',
  };
  const before = f.store.rows.length;
  await assert.rejects(f.posting.post(ctx, [effect]), guard('GUARD_ACTOR'));
  assert.equal(f.store.rows.length, before);
  await f.production.complete(ctx, batch);
  const output = batch.outputs[0]!;
  await assert.rejects(
    f.posting.post(ctx, [
      {
        ...effect,
        unitId: output.unitId,
        source: { factId: randomUUID(), effectId: randomUUID() },
      },
    ]),
    guard('GUARD_CONFLICT'),
  );
});
void test('input snapshots and exact frozen effect admission cannot be changed across an asynchronous boundary', async () => {
  const f = fixture(),
    id = f.store.seed();
  await f.production.issue(f.context(), f.orderId, [id]);
  const source = f.batch(id),
    ctx = f.context('CompleteProductionOperation', source.operationId);
  f.store.lockHook = () => {
    (source.inputs[0] as { kg: string }).kg = '100';
  };
  await f.production.complete(ctx, source);
  assert.deepEqual(f.store.balances.get(id), { onHand: '4', reserved: '0' });
});
void test('invalid or excessive consumption and overlapping finalization reject before Inventory writes', async () => {
  const f = fixture(),
    id = f.store.seed();
  await f.production.issue(f.context(), f.orderId, [id]);
  const batch = f.batch(id, '11'),
    before = f.store.writes;
  await assert.rejects(
    f.production.complete(f.context('CompleteProductionOperation', batch.operationId), batch),
    guard('GUARD_INVARIANT'),
  );
  assert.equal(f.store.writes, before);
  const overlap = { ...f.batch(id), finalizeUnitIds: [id] };
  await assert.rejects(
    f.production.complete(f.context('CompleteProductionOperation', overlap.operationId), overlap),
    guard('GUARD_INVARIANT'),
  );
  assert.equal(f.store.writes, before);
  const wrong = {
    ...f.context('CompleteProductionOperation', batch.operationId),
    request: { ...ctxRequest(batch.operationId), command: 'StartProductionOperation' },
  };
  await assert.rejects(f.production.complete(wrong, batch), guard('GUARD_INVARIANT'));
});
function ctxRequest(operationId: string): CommandRequest {
  return {
    command: 'CompleteProductionOperation',
    contract_version: 1,
    idempotency_key: randomUUID(),
    target: { kind: 'production-operation', id: operationId },
    payload: {},
    preconditions: {},
  };
}
void test('technical posting failure clears private admission and never authorizes a later direct effect', async () => {
  const f = fixture(),
    id = f.store.seed();
  await f.production.issue(f.context(), f.orderId, [id]);
  const batch = f.batch(id),
    ctx = f.context('CompleteProductionOperation', batch.operationId);
  const failing = new InventoryProductionService(
    f.store,
    f.store,
    {
      post: (_ctx, effects) => {
        assert.ok(
          Object.isFrozen(effects) &&
            effects.every((effect) => Object.isFrozen(effect) && Object.isFrozen(effect.source)),
        );
        return Promise.reject(new TechnicalError('retryable'));
      },
    },
    {
      canInspect: () => Promise.resolve(true),
      canIssue: () => Promise.resolve(true),
      canComplete: () => Promise.resolve(true),
    },
  );
  await assert.rejects(failing.complete(ctx, batch), TechnicalError);
  const effect: PostingEffect = {
    type: 'STOCK_OUT',
    source: {
      factId: batch.inputs[0]!.factId,
      effectId: productionEffectId(batch.operationId, id, 'CONSUME'),
    },
    unitId: id,
    kg: '6',
    nextState: 'PARTIALLY_CONSUMED',
  };
  assert.equal(await failing.visibleForEffect(ctx, effect, f.store.units.get(id)!), false);
  assert.equal(
    (await failing.validateEffect(ctx, effect, f.store.units.get(id)))?.family,
    'GUARD_CONFLICT',
  );
});

void test('new stock without consumed input and completion permission withdrawn after locks never write', async () => {
  const f = fixture(),
    id = f.store.seed();
  await f.production.issue(f.context(), f.orderId, [id]);
  const batch = f.batch(id),
    before = f.store.writes;
  const noInput = { ...batch, inputs: [] };
  await assert.rejects(
    f.production.complete(f.context('CompleteProductionOperation', batch.operationId), noInput),
    guard('GUARD_INVARIANT'),
  );
  assert.equal(f.store.writes, before);
  f.store.lockHook = () => f.setAllowed(false);
  await assert.rejects(
    f.production.complete(f.context('CompleteProductionOperation', batch.operationId), batch),
    guard('GUARD_ACTOR'),
  );
  assert.equal(f.store.writes, before);
  assert.deepEqual(f.store.balances.get(id), { onHand: '10', reserved: '0' });
});
