import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import {
  BusinessRejection,
  createTransactionContext,
  type CommandRequest,
  type ExecutionContext,
} from '@navard/shared-kernel';
import {
  ReservationService,
  type ReservationDemand,
  type ReservationRequest,
  type ReservationRequestStore,
  type InventoryStore,
  type ReservationPolicy,
} from '../../src/modules/inventory/index.js';
function guard(family: string) {
  return (error: unknown) =>
    error instanceof BusinessRejection && error.rejection.family === family;
}
function fixture() {
  const customerId = randomUUID(),
    orderId = randomUUID(),
    itemId = randomUUID(),
    unitId = randomUUID();
  const actor: ExecutionContext = Object.freeze({
    installationId: randomUUID(),
    authorityScopeId: randomUUID(),
    requestId: randomUUID(),
    principal: Object.freeze({ issuer: 'identity', subject: randomUUID() }),
    actorRole: 'ACT-SALES',
    customerScope: customerId,
  });
  const transaction = createTransactionContext(),
    records = new Map<string, ReservationRequest>(),
    calls: string[] = [];
  let allowed = true,
    lockHook: (() => void) | undefined,
    demand: ReservationDemand | undefined = {
      id: orderId,
      customerId,
      binding: 'fixed-demand',
      confirmedAt: '2026-10-08T10:00:00.000Z',
      items: [{ id: itemId, type: 'COIL', demandedKg: '9007199254740993' }],
      selections: [{ itemId, unitIds: [unitId] }],
    };
  const timestamp = '2026-10-08T11:00:00.000Z';
  const store: ReservationRequestStore = {
    lockOrder: () => {
      calls.push('order-lock');
      lockHook?.();
      return Promise.resolve();
    },
    lockRequest: () => {
      calls.push('request-lock');
      return Promise.resolve();
    },
    get: (_ctx, id) => Promise.resolve(records.get(id)),
    aggregate: () =>
      Promise.resolve(
        [...records.values()].reduce((sum, record) => sum + BigInt(record.kg), 0n).toString(),
      ),
    activeKg: () =>
      Promise.resolve(
        [...records.values()]
          .filter((record) => record.state === 'ACTIVE')
          .reduce((sum, record) => sum + BigInt(record.kg), 0n)
          .toString(),
      ),
    create: (_ctx, record) => {
      calls.push('intent');
      const stored = { ...record, requestedAt: timestamp };
      records.set(record.id, stored);
      return Promise.resolve(stored);
    },
    activate: (_ctx, id) => {
      calls.push('active-intent');
      const record = records.get(id);
      if (!record) return Promise.resolve(undefined);
      const active = { ...record, state: 'ACTIVE' as const, activatedAt: timestamp };
      records.set(id, active);
      return Promise.resolve(active);
    },
  };
  const unexpected = () =>
    Promise.reject(new Error('Reservation orchestration must not directly write Inventory'));
  const inventory: InventoryStore = {
    lock: (_ctx, units, effects, reservations) => {
      assert.deepEqual(units, [unitId]);
      assert.equal(effects.length, 1);
      assert.deepEqual(effects, reservations);
      calls.push('inventory-lock');
      return Promise.resolve();
    },
    unit: () =>
      Promise.resolve({
        id: unitId,
        lotId: randomUUID(),
        kind: 'COIL',
        locationId: randomUUID(),
        customerScope: '',
        state: 'AVAILABLE',
      }),
    createUnit: unexpected,
    changeState: unexpected,
    totals: unexpected,
    balance: unexpected,
    project: unexpected,
    findEffect: unexpected,
    ledger: unexpected,
    append: unexpected,
    activeReservation: unexpected,
    reservation: unexpected,
    insertReservation: unexpected,
    closeReservation: unexpected,
  };
  const policy: ReservationPolicy = {
    canRequest: () => Promise.resolve(allowed),
    canActivate: () => Promise.resolve(allowed),
    canRead: () => Promise.resolve(allowed),
  };
  const service = new ReservationService(
    store,
    inventory,
    {
      post: (_ctx, effects) => {
        calls.push('IPS');
        assert.equal(effects.length, 1);
        assert.equal(effects[0]?.type, 'RESERVE');
        return Promise.resolve([]);
      },
    },
    { demand: () => Promise.resolve(demand), competitors: () => Promise.resolve([]) },
    policy,
  );
  const input: CommandRequest = {
    command: 'RequestReservation',
    contract_version: 1,
    idempotency_key: randomUUID(),
    target: { kind: 'reservation', id: randomUUID() },
    payload: { orderId, itemId, unitId, kg: '9007199254740993' },
    preconditions: {},
  };
  const run = (request = input, context = actor) => service.execute(request, context, transaction);
  return {
    service,
    input,
    actor,
    run,
    calls,
    records,
    setAllowed: (value: boolean) => {
      allowed = value;
    },
    onLock: (hook: () => void) => {
      lockHook = hook;
    },
    setDemand: (value: ReservationDemand | undefined) => {
      demand = value;
    },
  };
}
void test('reservation request stores exact beyond-safe-integer kg without invoking IPS; Warehouse activation invokes IPS before ACTIVE intent', async () => {
  const f = fixture();
  const requested = await f.run();
  assert.equal(requested.outcome, 'accepted');
  assert.equal(requested.data?.kg, '9007199254740993');
  assert.ok(!f.calls.includes('IPS'));
  const actor = {
    installationId: f.actor.installationId,
    authorityScopeId: f.actor.authorityScopeId,
    requestId: f.actor.requestId,
    principal: f.actor.principal,
    actorRole: 'ACT-WH',
  };
  await f.run(
    { ...f.input, command: 'ActivateReservation', payload: {}, idempotency_key: randomUUID() },
    actor,
  );
  assert.ok(f.calls.indexOf('IPS') < f.calls.indexOf('active-intent'));
  assert.equal(f.records.get(f.input.target.id)?.state, 'ACTIVE');
});
void test('reservation request identity is immutable and new-key exact duplicate differs from changed intent conflict', async () => {
  const f = fixture();
  await f.run();
  await assert.rejects(
    f.run({ ...f.input, idempotency_key: randomUUID() }),
    guard('GUARD_IDEMPOTENT_DUP'),
  );
  await assert.rejects(
    f.run({ ...f.input, idempotency_key: randomUUID(), payload: { ...f.input.payload, kg: '1' } }),
    guard('GUARD_CONFLICT'),
  );
  assert.equal(f.records.size, 1);
});
void test('reservation validates canonical whole kilograms, known payload fields and exact target/preconditions', async () => {
  for (const kg of ['0', '-1', '1.5', '01', '1\n', '100000000000000000000']) {
    const f = fixture();
    await assert.rejects(
      f.run({ ...f.input, payload: { ...f.input.payload, kg } }),
      guard('GUARD_INVARIANT'),
    );
    assert.equal(f.records.size, 0);
  }
  for (const alteration of [
    { payload: { state: 'ACTIVE' } },
    { target: { kind: 'sales-order', id: randomUUID() } },
    { preconditions: { force: true } },
  ]) {
    const f = fixture();
    await assert.rejects(f.run({ ...f.input, ...alteration }), guard('GUARD_INVARIANT'));
    assert.equal(f.records.size, 0);
  }
});
void test('nonconfirmed or unselected demand cannot create intent and role mismatches cannot invoke its owner service', async () => {
  const f = fixture();
  f.setDemand(undefined);
  await assert.rejects(f.run(), guard('GUARD_ACTOR'));
  const g = fixture();
  await assert.rejects(
    g.run({ ...g.input, payload: { ...g.input.payload, itemId: randomUUID() } }),
    guard('GUARD_INVARIANT'),
  );
  const h = fixture();
  await assert.rejects(
    h.run(h.input, {
      installationId: h.actor.installationId,
      authorityScopeId: h.actor.authorityScopeId,
      requestId: h.actor.requestId,
      principal: h.actor.principal,
      actorRole: 'ACT-WH',
    }),
    guard('GUARD_ACTOR'),
  );
  assert.equal(h.records.size, 0);
});
void test('current permission is rechecked after locks and fail-closed before intent or IPS writes', async () => {
  const f = fixture();
  f.onLock(() => f.setAllowed(false));
  await assert.rejects(f.run(), guard('GUARD_ACTOR'));
  assert.equal(f.records.size, 0);
  assert.ok(!f.calls.includes('IPS'));
});
void test('request aggregate arithmetic is exact and cannot exceed demand at integer precision beyond Number safety', async () => {
  const f = fixture();
  await f.run({ ...f.input, payload: { ...f.input.payload, kg: '9007199254740992' } });
  await assert.rejects(
    f.run({
      ...f.input,
      target: { ...f.input.target, id: randomUUID() },
      idempotency_key: randomUUID(),
      payload: { ...f.input.payload, kg: '2' },
    }),
    guard('GUARD_INVARIANT'),
  );
  assert.equal(f.records.size, 1);
});

void test('reservation snapshots request fields before asynchronous locks, preserving original kg binding', async () => {
  const f = fixture();
  f.onLock(() => {
    (f.input.payload as { kg: string }).kg = '1';
  });
  await f.run();
  assert.equal(f.records.get(f.input.target.id)?.kg, '9007199254740993');
});
