import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import {
  BusinessRejection,
  AdmissionError,
  createTransactionContext,
  type CommandRequest,
  type ExecutionContext,
  type GuardFamily,
} from '@navard/shared-kernel';
import {
  ShippingService,
  type ShippingStore,
  type ShippingPackage,
  type Shipment,
  type ShippingContext,
  type ShippingEntry,
  type ShippingDemand,
} from '../../src/modules/shipping/index.js';
import { shippingCommand } from '../support/shipping-harness.js';
import { follow } from '../support/sales-harness.js';
const guard = (family: GuardFamily) => (error: unknown) =>
  error instanceof BusinessRejection && error.rejection.family === family;
function fixture() {
  const orderId = randomUUID(),
    customerId = randomUUID(),
    itemId = randomUUID(),
    reservationId = randomUUID(),
    unitId = randomUUID();
  const actor: ExecutionContext = Object.freeze({
    installationId: randomUUID(),
    authorityScopeId: randomUUID(),
    principal: Object.freeze({ issuer: 'identity', subject: randomUUID() }),
    actorRole: 'ACT-SHIP',
    customerScope: customerId,
    requestId: randomUUID(),
  });
  const transaction = createTransactionContext(),
    packages = new Map<string, ShippingPackage>(),
    shipments = new Map<string, Shipment>(),
    calls: string[] = [],
    contexts: ShippingContext[] = [];
  let allowed = true;
  let entries: readonly ShippingEntry[] = [{ reservationId, unitId, itemId, kg: '11' }];
  let demand: ShippingDemand = {
    id: orderId,
    customerId,
    binding: 'approved-confirmed-order',
    items: [{ id: itemId, demandedKg: '11', allowPartialShipment: false }],
  };
  let shipped = '0';
  const store: ShippingStore = {
    lockOrder: (ctx, id) => {
      contexts.push(ctx);
      assert.equal(id, orderId);
      calls.push('order-lock');
      return Promise.resolve();
    },
    lockDocuments: (ctx, ids) => {
      contexts.push(ctx);
      assert.ok(ids.length);
      calls.push('document-lock');
      return Promise.resolve();
    },
    package: (_ctx, id) => Promise.resolve(packages.get(id)),
    shipment: (_ctx, id) => Promise.resolve(shipments.get(id)),
    packages: (_ctx, id) =>
      Promise.resolve([...packages.values()].filter((p) => p.shipmentId === id)),
    shippedKg: () => Promise.resolve(shipped),
    createPackage: (ctx, value) => {
      contexts.push(ctx);
      calls.push('package-write');
      packages.set(value.id, value);
      return Promise.resolve(value);
    },
    createShipment: (ctx, value) => {
      contexts.push(ctx);
      calls.push('shipment-write');
      shipments.set(value.id, value);
      return Promise.resolve(value);
    },
    packageState: (ctx, id, from, to, shipmentId) => {
      contexts.push(ctx);
      const p = packages.get(id);
      if (!p || p.state !== from) return Promise.resolve(undefined);
      const next = { ...p, state: to, ...(shipmentId ? { shipmentId } : {}) };
      packages.set(id, next);
      calls.push('package-' + to);
      return Promise.resolve(next);
    },
    shipmentState: (ctx, id, from, to, posted) => {
      contexts.push(ctx);
      const s = shipments.get(id);
      if (!s || s.state !== from) return Promise.resolve(undefined);
      const next = { ...s, state: to, ...(posted ? { entries: posted } : {}) };
      shipments.set(id, next);
      calls.push('shipment-' + to);
      return Promise.resolve(next);
    },
  };
  const service = new ShippingService(
    store,
    {
      inspect: (ctx, id, ids) => {
        contexts.push(ctx);
        assert.equal(id, orderId);
        assert.deepEqual(ids, [reservationId]);
        calls.push('inventory-inspect');
        return Promise.resolve(entries);
      },
      pack: (ctx) => {
        contexts.push(ctx);
        calls.push('inventory-pack');
        return Promise.resolve();
      },
      unpack: (ctx) => {
        contexts.push(ctx);
        calls.push('inventory-unpack');
        return Promise.resolve();
      },
      dispatch: (ctx, id, _shipmentId, value) => {
        contexts.push(ctx);
        assert.equal(id, orderId);
        assert.deepEqual(value, entries);
        calls.push('inventory-dispatch');
        return Promise.resolve();
      },
    },
    { demand: () => Promise.resolve(demand) },
    { canShip: (_ctx, id) => Promise.resolve(allowed && id === customerId) },
  );
  const execute = (input: CommandRequest, context = actor) =>
    service.execute(input, context, transaction);
  async function ready() {
    const pack = shippingCommand('DraftPackage', 'package', {
      orderId,
      reservationIds: [reservationId],
    });
    await execute(pack);
    await execute(follow(pack, 'PackPackage'));
    const shipment = shippingCommand('DraftShipment', 'shipment', { orderId });
    await execute(shipment);
    await execute(follow(pack, 'AssignPackageToShipment', { shipmentId: shipment.target.id }));
    await execute(follow(shipment, 'MarkShipmentReady'));
    await execute(follow(shipment, 'StartLoading'));
    return { pack, shipment, dispatch: follow(shipment, 'DispatchShipment') };
  }
  return {
    service,
    actor,
    transaction,
    packages,
    shipments,
    calls,
    contexts,
    orderId,
    customerId,
    itemId,
    reservationId,
    unitId,
    execute,
    ready,
    setAllowed: (value: boolean) => {
      allowed = value;
    },
    setEntries: (value: readonly ShippingEntry[]) => {
      entries = value;
    },
    setDemand: (value: ShippingDemand) => {
      demand = value;
    },
    setShipped: (value: string) => {
      shipped = value;
    },
  };
}
void test('Shipping publishes precisely bounded normal commands, with no finance, delivery or exceptional transition', () => {
  const f = fixture(),
    contracts = f.service.contracts();
  assert.deepEqual(
    contracts.map((c) => c.command),
    [
      'DraftPackage',
      'PackPackage',
      'UnpackPackage',
      'DraftShipment',
      'AssignPackageToShipment',
      'MarkShipmentReady',
      'StartLoading',
      'DispatchShipment',
    ],
  );
  assert.ok(contracts.every((c) => c.version === 1 && c.active));
  assert.deepEqual(contracts.find((c) => c.command === 'DraftShipment')?.payloadShape, {
    orderId: { type: 'scalar' },
  });
  assert.deepEqual(contracts.find((c) => c.command === 'DispatchShipment')?.payloadShape, {});
});
void test('individual ACT-SHIP exact customer authorization is required before writes or owner port calls', async () => {
  const f = fixture(),
    input = shippingCommand('DraftShipment', 'shipment', { orderId: f.orderId });
  for (const actor of [
    { ...f.actor, actorRole: 'ACT-WH' },
    { ...f.actor, actorRole: 'ACT-SALES' },
    { ...f.actor, customerScope: randomUUID() },
  ])
    await assert.rejects(f.execute(input, actor), guard('GUARD_ACTOR'));
  await assert.rejects(f.execute(input, { ...f.actor, temporary: true }), AdmissionError);
  f.setAllowed(false);
  await assert.rejects(f.execute(input), guard('GUARD_ACTOR'));
  assert.deepEqual(f.calls, []);
});
void test('transition payload/precondition and target misuse cannot reach state or Inventory effects', async () => {
  const f = fixture();
  await assert.rejects(
    f.execute(
      shippingCommand('DraftPackage', 'shipment', {
        orderId: f.orderId,
        reservationIds: [f.reservationId],
      }),
    ),
    guard('GUARD_INVARIANT'),
  );
  await assert.rejects(
    f.execute({
      ...shippingCommand('DraftShipment', 'shipment', { orderId: f.orderId }),
      preconditions: { force: true },
    }),
    guard('GUARD_INVARIANT'),
  );
  await assert.rejects(
    f.execute(
      shippingCommand('DraftShipment', 'shipment', { orderId: f.orderId, invoiceRequired: false }),
    ),
    guard('GUARD_INVARIANT'),
  );
  await assert.rejects(
    f.execute(shippingCommand('ConfirmDelivery', 'shipment')),
    guard('GUARD_INVARIANT'),
  );
  assert.deepEqual(f.calls, []);
});
void test('Package input rejects empty/duplicate/nonUUID/excess reservations without assuming a Unit split', async () => {
  const f = fixture();
  for (const ids of [
    [],
    [f.reservationId, f.reservationId],
    ['not-a-reservation'],
    Array.from({ length: 33 }, () => randomUUID()),
  ])
    await assert.rejects(
      f.execute(
        shippingCommand('DraftPackage', 'package', { orderId: f.orderId, reservationIds: ids }),
      ),
      guard('GUARD_INVARIANT'),
    );
  assert.deepEqual(f.calls, []);
});
void test('Package draft pins immutable selected evidence and identical identity reuse differs from changed payload', async () => {
  const f = fixture(),
    input = shippingCommand('DraftPackage', 'package', {
      orderId: f.orderId,
      reservationIds: [f.reservationId],
    });
  const accepted = await f.execute(input);
  assert.equal(accepted.outcome, 'accepted');
  const entry = f.packages.get(input.target.id)?.entries[0];
  assert.ok(entry);
  assert.ok(Object.isFrozen(entry));
  assert.equal(entry.kg, '11');
  await assert.rejects(
    f.execute(follow(input, 'DraftPackage', input.payload)),
    guard('GUARD_IDEMPOTENT_DUP'),
  );
  await assert.rejects(
    f.execute({ ...input, payload: { orderId: f.orderId, reservationIds: [randomUUID()] } }),
    guard('GUARD_CONFLICT'),
  );
  assert.equal(f.calls.filter((x) => x === 'package-write').length, 1);
});
void test('normal state lifecycle uses exact original actor and one shared transaction through Inventory owner port', async () => {
  const f = fixture(),
    ready = await f.ready();
  const result = await f.execute(ready.dispatch);
  assert.equal(result.outcome, 'accepted');
  if (result.outcome === 'accepted') assert.equal(result.targetState, 'DISPATCHED');
  assert.equal(f.calls.filter((c) => c === 'inventory-dispatch').length, 1);
  assert.ok(f.contexts.every((ctx) => ctx.transaction === f.transaction && ctx.actor === f.actor));
  assert.ok(f.calls.indexOf('inventory-pack') < f.calls.indexOf('package-PACKED'));
  assert.ok(f.calls.indexOf('inventory-dispatch') < f.calls.indexOf('shipment-DISPATCHED'));
  await assert.rejects(
    f.execute(follow(ready.dispatch, 'DispatchShipment')),
    guard('GUARD_IDEMPOTENT_DUP'),
  );
  await assert.rejects(f.execute(follow(ready.pack, 'UnpackPackage')), guard('GUARD_STATE'));
});
void test('readiness and dispatch cannot skip normal package/loading transitions', async () => {
  const f = fixture(),
    shipment = shippingCommand('DraftShipment', 'shipment', { orderId: f.orderId });
  await f.execute(shipment);
  await assert.rejects(f.execute(follow(shipment, 'StartLoading')), guard('GUARD_STATE'));
  await assert.rejects(f.execute(follow(shipment, 'DispatchShipment')), guard('GUARD_STATE'));
  await assert.rejects(f.execute(follow(shipment, 'MarkShipmentReady')), guard('GUARD_INVARIANT'));
  assert.ok(!f.calls.includes('inventory-dispatch'));
});
void test('dispatch compares exact integer kg beyond JavaScript precision and refuses excess or unauthorized remainder', async () => {
  const f = fixture();
  f.setEntries([
    { reservationId: f.reservationId, unitId: f.unitId, itemId: f.itemId, kg: '9007199254740993' },
  ]);
  f.setDemand({
    id: f.orderId,
    customerId: f.customerId,
    binding: 'approved-confirmed-order',
    items: [{ id: f.itemId, demandedKg: '9007199254740993', allowPartialShipment: false }],
  });
  const ready = await f.ready();
  f.setDemand({
    id: f.orderId,
    customerId: f.customerId,
    binding: 'approved-confirmed-order',
    items: [{ id: f.itemId, demandedKg: '9007199254740994', allowPartialShipment: false }],
  });
  await assert.rejects(f.execute(ready.dispatch), guard('GUARD_INVARIANT'));
  assert.ok(!f.calls.includes('inventory-dispatch'));
  f.setShipped('1');
  const accepted = await f.execute(ready.dispatch);
  assert.equal(accepted.outcome, 'accepted');
  if (accepted.outcome === 'accepted') assert.equal(accepted.targetState, 'DISPATCHED');
});
void test('partial line permission permits fewer whole selected Units without touching Sales closure', async () => {
  const f = fixture();
  f.setDemand({
    id: f.orderId,
    customerId: f.customerId,
    binding: 'approved-confirmed-order',
    items: [{ id: f.itemId, demandedKg: '12', allowPartialShipment: true }],
  });
  const ready = await f.ready();
  const accepted = await f.execute(ready.dispatch);
  assert.equal(accepted.outcome, 'accepted');
  if (accepted.outcome === 'accepted') assert.equal(accepted.targetState, 'DISPATCHED');
  assert.equal(f.shipments.get(ready.shipment.target.id)?.entries[0]?.kg, '11');
});
