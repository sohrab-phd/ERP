import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import {
  BusinessRejection,
  TechnicalError,
  createTransactionContext,
  type ExecutionContext,
  type JsonObject,
  type GuardFamily,
} from '@navard/shared-kernel';
import {
  ProductionService,
  productionCommands,
  productionTarget,
  type ProductionOrder,
  type ProductionOperation,
  type MaterialAllocation,
  type ProductionFact,
  type ProductionStore,
  type ProductionContext,
  type ProductionInventoryPort,
  type ProductionBatch,
} from '../../src/modules/production/index.js';
function guard(family: GuardFamily) {
  return (error: unknown) =>
    error instanceof BusinessRejection && error.rejection.family === family;
}
function fixture(routeSize = 1) {
  const customerId = randomUUID(),
    salesId = randomUUID(),
    itemId = randomUUID(),
    orderId = randomUUID(),
    allocationId = randomUUID(),
    unitId = randomUUID(),
    locationId = randomUUID();
  const operations = Array.from({ length: routeSize }, () => randomUUID());
  const actor: ExecutionContext = Object.freeze({
    installationId: randomUUID(),
    authorityScopeId: randomUUID(),
    customerScope: customerId,
    principal: Object.freeze({ issuer: 'identity', subject: randomUUID() }),
    actorRole: 'ACT-PLAN',
    requestId: randomUUID(),
  });
  const operator: ExecutionContext = Object.freeze({ ...actor, actorRole: 'ACT-OP' }),
    transaction = createTransactionContext();
  const orders = new Map<string, ProductionOrder>(),
    ops = new Map<string, ProductionOperation>(),
    allocations = new Map<string, MaterialAllocation>(),
    facts: ProductionFact[] = [],
    batches: ProductionBatch[] = [];
  let permission = true,
    disposition = false,
    starts = 0,
    startFailure = false,
    materialKind = 'COIL';
  const store: ProductionStore = {
    batch: () => Promise.resolve(),
    lockSalesOrder: () => Promise.resolve(),
    lockOrder: () => Promise.resolve(),
    order: (_ctx, id) => Promise.resolve(orders.get(id)),
    saveOrder: (_ctx, value) => {
      orders.set(value.id, value);
      return Promise.resolve();
    },
    operation: (_ctx, id) => Promise.resolve(ops.get(id)),
    operations: (_ctx, id) =>
      Promise.resolve(
        [...ops.values()].filter((op) => orders.get(id)?.route.some((step) => step.id === op.id)),
      ),
    saveOperation: (_ctx, value) => {
      ops.set(value.id, value);
      return Promise.resolve();
    },
    allocation: (_ctx, id) => Promise.resolve(allocations.get(id)),
    allocations: (_ctx, id) =>
      Promise.resolve([...allocations.values()].filter((a) => a.productionOrderId === id)),
    saveAllocation: (_ctx, value) => {
      allocations.set(value.id, value);
      return Promise.resolve();
    },
    facts: (_ctx, id) => Promise.resolve(facts.filter((f) => f.productionOrderId === id)),
    fact: (_ctx, value) => {
      facts.push(value);
      return Promise.resolve();
    },
  };
  const inventory: ProductionInventoryPort = {
    inspect: (_ctx, _order, ids) =>
      Promise.resolve(
        ids.map((unitId) => ({
          unitId,
          kg: '110',
          kind: materialKind,
          locationId,
          state: 'AVAILABLE',
        })),
      ),
    issue: async (ctx, id, ids) => {
      assert.equal(await service.admittedIssue(ctx, id, ids), true);
      return ids.map((unitId) => ({
        unitId,
        kg: '110',
        kind: 'COIL',
        locationId,
        state: 'ISSUED_TO_PRODUCTION',
      }));
    },
    complete: async (ctx, batch) => {
      assert.equal(await service.admittedCompletion(ctx, batch), true);
      assert.equal(
        facts.filter((f) => f.kind === 'CONSUMPTION').length >= batch.inputs.length,
        true,
      );
      for (const output of batch.outputs)
        assert.deepEqual(Object.keys(output).sort(), [
          'disposition',
          'factId',
          'kg',
          'kind',
          'locationId',
          'lotId',
          'unitId',
        ]);
      batches.push(batch);
    },
  };
  const service: ProductionService = new ProductionService(
    store,
    inventory,
    {
      demand: () =>
        Promise.resolve({
          id: salesId,
          customerId,
          binding: 'confirmed-MAKE',
          confirmedAt: '2026-10-10T00:00:00.000Z',
          items: [{ id: itemId, type: 'ANGLE', demandedKg: '110', allowPartialShipment: true }],
        }),
      start: async (ctx, sales, order, item) => {
        assert.equal(await service.admittedRelease(ctx, sales, order, item), true);
        assert.equal(await service.admittedRelease(ctx, randomUUID(), order, item), false);
        assert.equal(await service.admittedRelease(ctx, sales, order, randomUUID()), false);
        assert.equal(
          await service.admittedRelease(
            { ...ctx, actor: Object.freeze({ ...ctx.actor }) },
            sales,
            order,
            item,
          ),
          false,
        );
        assert.equal(
          await service.admittedRelease(
            { ...ctx, transaction: createTransactionContext() },
            sales,
            order,
            item,
          ),
          false,
        );
        assert.equal(
          await service.admittedRelease(
            { ...ctx, request: { ...ctx.request, idempotency_key: randomUUID() } },
            sales,
            order,
            item,
          ),
          false,
        );
        if (startFailure) throw new TechnicalError('incompatible');
        starts++;
      },
    },
    { current: () => Promise.resolve(permission), canDispose: () => Promise.resolve(disposition) },
  );
  const request = (command: string, payload: JsonObject = {}, targetId = orderId) => ({
    command,
    contract_version: 1,
    idempotency_key: randomUUID(),
    target: { kind: productionTarget(command), id: targetId },
    payload,
    preconditions: {},
  });
  const run = (command: string, payload: JsonObject = {}, targetId = orderId, user = actor) =>
    service.execute(request(command, payload, targetId), user, transaction);
  const route = operations.map((id, index) => ({
    id,
    station: index === 0 ? 'HEAVY_ROLL_OPENER' : 'PUNCH',
  }));
  async function ready() {
    await run('DraftProductionOrder', { salesOrderId: salesId, itemId });
    await run('PlanProductionOrder', { route });
    await run('PlanMaterialAllocation', { productionOrderId: orderId, kg: '110' }, allocationId);
    await run('AssignMaterialAllocation', { unitId }, allocationId);
    await run('ReleaseProductionOrder');
    await run('IssueAllocatedMaterial', {}, allocationId);
    await run('StartProductionOrder', {}, orderId, operator);
    await run('StartProductionOperation', {}, operations[0], operator);
  }
  const output = (kg: string, source = unitId) => ({
    unitId: randomUUID(),
    kg,
    kind: 'ANGLE',
    locationId,
    sourceUnitIds: [source],
  });
  const completion = (overrides: JsonObject = {}) => ({
    inputs: [{ unitId, kg: '110' }],
    outputs: [output('110')],
    residuals: [],
    scraps: [],
    finalizeUnitIds: [],
    ...overrides,
  });
  return {
    service,
    actor,
    operator,
    transaction,
    request,
    run,
    ready,
    route,
    orders,
    ops,
    allocations,
    facts,
    batches,
    orderId,
    salesId,
    itemId,
    allocationId,
    unitId,
    locationId,
    operations,
    output,
    completion,
    starts: () => starts,
    setStartFailure: (value: boolean) => {
      startFailure = value;
    },
    setMaterialKind: (value: string) => {
      materialKind = value;
    },
    setPermission: (value: boolean) => {
      permission = value;
    },
    setDisposition: (value: boolean) => {
      disposition = value;
    },
  };
}
void test('Production contracts exclude speculative workflows and require explicit result lists', () => {
  const h = fixture();
  assert.equal(h.service.contracts().length, productionCommands.length);
  assert.ok(!productionCommands.some((c) => /QC|Loss|Rework|Abort|Cancel|Ship/.test(c)));
  const contract = h.service.contracts().find((c) => c.command === 'CompleteProductionOperation');
  assert.deepEqual(Object.keys(contract!.payloadShape).sort(), [
    'finalizeUnitIds',
    'inputs',
    'outputs',
    'residuals',
    'scraps',
  ]);
});
void test('Production preserves actual caller and rejects ungranted or wrong-role scope before mutation', async () => {
  const h = fixture();
  h.setPermission(false);
  await assert.rejects(
    h.run('DraftProductionOrder', { salesOrderId: randomUUID(), itemId: randomUUID() }),
    guard('GUARD_ACTOR'),
  );
  assert.equal(h.orders.size, 0);
  h.setPermission(true);
  await assert.rejects(
    h.run(
      'DraftProductionOrder',
      { salesOrderId: randomUUID(), itemId: randomUUID() },
      h.orderId,
      h.operator,
    ),
    guard('GUARD_ACTOR'),
  );
});
void test('full completion creates exact source facts before one privately admitted Inventory bundle', async () => {
  const h = fixture();
  await h.ready();
  const request = h.request('CompleteProductionOperation', h.completion(), h.operations[0]);
  const ctx: ProductionContext = { request, actor: h.operator, transaction: h.transaction };
  assert.equal(
    await h.service.admittedCompletion(ctx, {
      productionOrderId: h.orderId,
      operationId: h.operations[0]!,
      inputs: [],
      outputs: [],
    }),
    false,
  );
  const result = await h.service.execute(request, h.operator, h.transaction);
  assert.equal(result.outcome, 'accepted');
  assert.equal(h.batches.length, 1);
  assert.equal(h.batches[0]!.outputs[0]!.disposition, 'FINAL');
  assert.equal(h.facts.filter((f) => f.kind === 'CONSUMPTION').length, 1);
  assert.equal(h.facts.filter((f) => f.kind === 'OUTPUT').length, 1);
  assert.ok(h.facts.every((f) => f.actor.subject === h.operator.principal.subject));
  assert.equal(await h.service.admittedCompletion(ctx, h.batches[0]!), false);
  await assert.rejects(
    h.run('CompleteProductionOperation', h.completion(), h.operations[0], h.operator),
    guard('GUARD_CONFLICT'),
  );
});
void test('partial consumption excludes original remainder and requires authenticated disposition only for leftovers', async () => {
  const h = fixture();
  await h.ready();
  const payload = h.completion({
    inputs: [{ unitId: h.unitId, kg: '70' }],
    outputs: [h.output('30')],
    residuals: [
      {
        unitId: randomUUID(),
        kg: '20',
        kind: 'COIL',
        locationId: h.locationId,
        sourceUnitId: h.unitId,
      },
    ],
    scraps: [{ kg: '20', sourceUnitId: h.unitId }],
  });
  await assert.rejects(
    h.run('CompleteProductionOperation', payload, h.operations[0], h.operator),
    guard('GUARD_ACTOR'),
  );
  assert.equal(h.facts.length, 0);
  h.setDisposition(true);
  await h.run('CompleteProductionOperation', payload, h.operations[0], h.operator);
  assert.equal(h.batches[0]!.inputs[0]!.kg, '70');
  assert.equal(h.facts.filter((f) => f.kind === 'RESIDUAL').length, 1);
  assert.equal(h.facts.filter((f) => f.kind === 'SCRAP').length, 1);
  assert.equal(h.batches[0]!.outputs.length, 2);
});
void test('mass-balance mismatch, forged manager field and output lineage cannot reach source writes', async () => {
  const h = fixture();
  await h.ready();
  for (const payload of [
    h.completion({ outputs: [h.output('109')] }),
    h.completion({ managerApproved: true }),
    h.completion({ outputs: [h.output('110', randomUUID())] }),
  ])
    await assert.rejects(
      h.run('CompleteProductionOperation', payload, h.operations[0], h.operator),
      guard('GUARD_INVARIANT'),
    );
  assert.equal(h.facts.length, 0);
  assert.equal(h.batches.length, 0);
});
void test('WIP is server-derived until last required step and can then finalize without another quantity post', async () => {
  const h = fixture(2);
  await h.ready();
  await assert.rejects(
    h.run('StartProductionOperation', {}, h.operations[1], h.operator),
    guard('GUARD_STATE'),
  );
  await h.run('CompleteProductionOperation', h.completion(), h.operations[0], h.operator);
  const first = h.batches[0]!;
  assert.equal(first.outputs[0]!.disposition, 'WIP');
  const wip = first.outputs[0]!.unitId;
  await h.run('StartProductionOperation', {}, h.operations[1], h.operator);
  await h.run(
    'CompleteProductionOperation',
    { inputs: [], outputs: [], residuals: [], scraps: [], finalizeUnitIds: [wip] },
    h.operations[1],
    h.operator,
  );
  assert.deepEqual(h.batches[1]!.inputs, []);
  assert.deepEqual(h.batches[1]!.outputs, []);
  assert.deepEqual(h.batches[1]!.finalizeUnitIds, [wip]);
  assert.equal(h.facts.filter((f) => f.kind === 'FINALIZED').length, 1);
});
void test('per-order route revisions retain historical operations and release pins the selected snapshot', async () => {
  const h = fixture();
  await h.run('DraftProductionOrder', { salesOrderId: h.salesId, itemId: h.itemId });
  await h.run('PlanProductionOrder', { route: h.route });
  const old = h.route[0]!.id;
  const current = randomUUID();
  await h.run('PlanProductionOrder', { route: [{ id: current, station: 'PUNCH' }] });
  assert.equal(h.orders.get(h.orderId)!.routeVersion, 2);
  assert.equal(h.ops.get(old)?.state, 'PLANNED');
  await h.run('ReleaseProductionOrder');
  await h.run('StartProductionOrder', {}, h.orderId, h.operator);
  await assert.rejects(
    h.run('StartProductionOperation', {}, old, h.operator),
    guard('GUARD_STATE'),
  );
  await h.run('StartProductionOperation', {}, current, h.operator);
  await assert.rejects(
    h.run('PlanProductionOrder', { route: [{ id: randomUUID(), station: 'PLASMA' }] }),
    guard('GUARD_STATE'),
  );
  assert.equal(h.starts(), 1);
});
void test('Station declaration has no quantity effect and empty official activity never calls Inventory', async () => {
  const h = fixture();
  await h.ready();
  await h.run('RecordStationEntry', {}, h.operations[0], h.operator);
  await h.run('DeclareStationCompletion', {}, h.operations[0], h.operator);
  assert.equal(h.ops.get(h.operations[0]!)!.state, 'IN_PROGRESS');
  assert.equal(h.batches.length, 0);
  await h.run(
    'CompleteProductionOperation',
    { inputs: [], outputs: [], residuals: [], scraps: [], finalizeUnitIds: [] },
    h.operations[0],
    h.operator,
  );
  assert.equal(h.batches.length, 0);
  assert.equal(h.ops.get(h.operations[0]!)!.state, 'COMPLETED');
});

void test('release admission exists only during the exact Sales owner call and clears on failure', async () => {
  const h = fixture();
  await h.run('DraftProductionOrder', { salesOrderId: h.salesId, itemId: h.itemId });
  await h.run('PlanProductionOrder', { route: h.route });
  const request = h.request('ReleaseProductionOrder');
  const ctx = { actor: h.actor, transaction: h.transaction, request };
  assert.equal(await h.service.admittedRelease(ctx, h.salesId, h.orderId, h.itemId), false);
  h.setStartFailure(true);
  await assert.rejects(h.service.execute(request, h.actor, h.transaction), TechnicalError);
  assert.equal(await h.service.admittedRelease(ctx, h.salesId, h.orderId, h.itemId), false);
  assert.equal(h.orders.get(h.orderId)?.state, 'PLANNED');
  h.setStartFailure(false);
  await h.service.execute(request, h.actor, h.transaction);
  assert.equal(await h.service.admittedRelease(ctx, h.salesId, h.orderId, h.itemId), false);
  assert.equal(h.orders.get(h.orderId)?.state, 'RELEASED');
});
void test('Coil to Sheet measurement rejects fractional actual kg before source writes and normalizes whole measurements', async () => {
  const h = fixture();
  await h.ready();
  h.setDisposition(true);
  const sheet = (amount: string) => ({ ...h.output(amount), kind: 'SHEET' });
  for (const payload of [
    h.completion({ inputs: [{ unitId: h.unitId, kg: '70.5' }], outputs: [sheet('70.5')] }),
    h.completion({ outputs: [sheet('109.5')], scraps: [{ sourceUnitId: h.unitId, kg: '0.5' }] }),
    h.completion({
      outputs: [sheet('109')],
      residuals: [
        {
          unitId: randomUUID(),
          kg: '0.5',
          kind: 'COIL',
          locationId: h.locationId,
          sourceUnitId: h.unitId,
        },
      ],
      scraps: [{ sourceUnitId: h.unitId, kg: '0.5' }],
    }),
  ])
    await assert.rejects(
      h.run('CompleteProductionOperation', payload, h.operations[0], h.operator),
      guard('GUARD_INVARIANT'),
    );
  assert.equal(h.facts.length, 0);
  assert.equal(h.batches.length, 0);
  await h.run(
    'CompleteProductionOperation',
    h.completion({
      inputs: [{ unitId: h.unitId, kg: '110.0' }],
      outputs: [sheet('70.00')],
      residuals: [
        {
          unitId: randomUUID(),
          kg: '20.0',
          kind: 'COIL',
          locationId: h.locationId,
          sourceUnitId: h.unitId,
        },
      ],
      scraps: [{ sourceUnitId: h.unitId, kg: '20.00' }],
    }),
    h.operations[0],
    h.operator,
  );
  assert.deepEqual(
    h.facts
      .filter((f) => ['CONSUMPTION', 'OUTPUT', 'RESIDUAL', 'SCRAP'].includes(f.kind))
      .map((f) => f.data.kg),
    ['110', '70', '20', '20'],
  );
  assert.equal(h.batches[0]!.inputs[0]!.kg, '110');
  assert.deepEqual(
    h.batches[0]!.outputs.map((entry) => entry.kg),
    ['70', '20'],
  );
});
void test('measurement applicability uses actual source kind and preserves exact fractional kg for other workflows', async () => {
  const h = fixture();
  await h.ready();
  h.setMaterialKind('PLATE');
  await h.run(
    'CompleteProductionOperation',
    h.completion({
      inputs: [{ unitId: h.unitId, kg: '70.5' }],
      outputs: [{ ...h.output('70.50'), kind: 'SHEET' }],
    }),
    h.operations[0],
    h.operator,
  );
  assert.equal(h.facts.find((f) => f.kind === 'CONSUMPTION')?.data.kg, '70.5');
  assert.equal(h.batches[0]!.outputs[0]!.kg, '70.5');
});
void test('completed prior Station may be referred only to its next current route operation without posting stock', async () => {
  const h = fixture(2);
  await h.ready();
  await h.run(
    'CompleteProductionOperation',
    { inputs: [], outputs: [], residuals: [], scraps: [], finalizeUnitIds: [] },
    h.operations[0],
    h.operator,
  );
  await assert.rejects(
    h.run('RecordStationReferral', { nextOperationId: randomUUID() }, h.operations[0]),
    guard('GUARD_INVARIANT'),
  );
  await h.run('RecordStationReferral', { nextOperationId: h.operations[1]! }, h.operations[0]);
  assert.equal(h.ops.get(h.operations[0]!)?.state, 'COMPLETED');
  assert.equal(h.facts.filter((f) => f.kind === 'REFERRAL').length, 1);
  assert.equal(h.batches.length, 0);
  await assert.rejects(
    h.run('RecordStationEntry', {}, h.operations[0], h.operator),
    guard('GUARD_STATE'),
  );
});
void test('public Production results and queries retain route data without exposing internal Sales binding', async () => {
  const h = fixture();
  const result = await h.run('DraftProductionOrder', { salesOrderId: h.salesId, itemId: h.itemId });
  assert.ok(result.outcome === 'accepted');
  assert.equal(result.data?.orderBinding, undefined);
  assert.equal(h.orders.get(h.orderId)?.orderBinding, 'confirmed-MAKE');
  const queried = await h.service.query(
    {
      actor: h.actor,
      transaction: h.transaction,
      request: {
        ...h.request('DraftProductionOrder'),
        command: 'GetProductionOrder',
        target: { kind: 'query', id: h.orderId },
      },
    },
    'GetProductionOrder',
    h.orderId,
  );
  assert.equal(queried?.orderBinding, undefined);
  assert.equal(queried?.id, h.orderId);
  assert.equal(h.orders.get(h.orderId)?.orderBinding, 'confirmed-MAKE');
});
