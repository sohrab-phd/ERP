import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import {
  BusinessRejection,
  TechnicalError,
  createTransactionContext,
  type CommandRequest,
  type ExecutionContext,
  type GuardFamily,
  type JsonObject,
} from '@navard/shared-kernel';
import {
  SalesService,
  parseSalesOrderInput,
  parseStockSelections,
  type SalesContext,
  type SalesOrder,
  type FulfillmentAssessment,
  type SalesStore,
  type SalesPolicy,
  type InventorySalesPort,
  type SalesItem,
  type StockView,
} from '../../src/modules/sales/index.js';

const timestamp = '2026-10-08T10:00:00.000Z';
function guard(family: GuardFamily): (error: unknown) => boolean {
  return (error) => error instanceof BusinessRejection && error.rejection.family === family;
}
function fixture() {
  const customerId = randomUUID();
  const actor: ExecutionContext = Object.freeze({
    installationId: randomUUID(),
    authorityScopeId: randomUUID(),
    principal: Object.freeze({ issuer: 'identity', subject: randomUUID() }),
    actorRole: 'ACT-SALES',
    requestId: randomUUID(),
    customerScope: customerId,
  });
  const transaction = createTransactionContext();
  const orderId = randomUUID();
  const assessmentId = randomUUID();
  const unitId = randomUUID();
  const item: SalesItem = {
    id: randomUUID(),
    type: 'SHEET',
    description: 'ورق سفارش مشتری',
    demandedKg: '9007199254740993',
    allowPartialShipment: false,
  };
  const orders = new Map<string, SalesOrder>();
  const assessments = new Map<string, FulfillmentAssessment>();
  const contexts: SalesContext[] = [];
  const calls: string[] = [];
  let permitted = true;
  let lockHook: (() => void) | undefined;
  let stock: readonly StockView[] = [
    { unitId, kind: 'SHEET', state: 'AVAILABLE', availableKg: '9007199254740993' },
  ];
  const store: SalesStore = {
    lockOrder: (context) => {
      contexts.push(context);
      calls.push('order-lock');
      lockHook?.();
      return Promise.resolve();
    },
    lockAssessment: (context) => {
      contexts.push(context);
      calls.push('assessment-lock');
      return Promise.resolve();
    },
    customer: (context, id) => {
      contexts.push(context);
      return Promise.resolve(id === customerId ? { id, displayName: 'مشتری ثبت‌شده' } : undefined);
    },
    order: (context, id) => {
      contexts.push(context);
      const record = orders.get(id);
      return Promise.resolve(
        record?.customerId === context.actor.customerScope ? record : undefined,
      );
    },
    createOrder: (context, order) => {
      contexts.push(context);
      orders.set(order.id, order);
      return Promise.resolve();
    },
    submitOrder: (context, id) => {
      contexts.push(context);
      const order = orders.get(id);
      if (!order || order.state !== 'DRAFT') return Promise.resolve(false);
      orders.set(id, { ...order, state: 'SUBMITTED' });
      return Promise.resolve(true);
    },
    confirmOrder: (context, id, selected) => {
      contexts.push(context);
      const order = orders.get(id);
      if (!order || order.state !== 'SUBMITTED') return Promise.resolve(undefined);
      const confirmed: SalesOrder = {
        ...order,
        state: 'CONFIRMED',
        confirmedAt: timestamp,
        confirmedAssessmentId: selected,
      };
      orders.set(id, confirmed);
      return Promise.resolve(confirmed);
    },
    assessment: (context, id) => {
      contexts.push(context);
      const record = assessments.get(id);
      return Promise.resolve(
        record?.customerId === context.actor.customerScope ? record : undefined,
      );
    },
    createAssessment: (context, assessment) => {
      contexts.push(context);
      assessments.set(assessment.id, assessment);
      return Promise.resolve();
    },
    recordMakeAssessment: (context, id) => {
      contexts.push(context);
      const old = assessments.get(id);
      if (!old || old.state !== 'DRAFT') return Promise.resolve(undefined);
      const value: FulfillmentAssessment = {
        ...old,
        state: 'RECORDED',
        mode: 'MAKE',
        observedAt: timestamp,
      };
      assessments.set(id, value);
      return Promise.resolve(value);
    },
    productionOrder: (context, id, customer) => {
      contexts.push(context);
      const value = orders.get(id);
      return Promise.resolve(value?.customerId === customer ? value : undefined);
    },
    reservationAssessment: (context, id, customer) => {
      contexts.push(context);
      const value = assessments.get(id);
      return Promise.resolve(value?.customerId === customer ? value : undefined);
    },
    reservationOrder: (context, id, customer) => {
      contexts.push(context);
      const value = orders.get(id);
      return Promise.resolve(value?.customerId === customer ? value : undefined);
    },
    startMake: (context, id) => {
      contexts.push(context);
      calls.push('make-reference');
      const value = orders.get(id);
      if (!value) return Promise.resolve(false);
      orders.set(id, { ...value, state: 'IN_PRODUCTION' });
      return Promise.resolve(true);
    },
    recordAssessment: (context, id, selections, evidence) => {
      contexts.push(context);
      const previous = assessments.get(id);
      if (!previous || previous.state !== 'DRAFT') return Promise.resolve(undefined);
      const recorded: FulfillmentAssessment = {
        ...previous,
        state: 'RECORDED',
        selections,
        stock: evidence,
        observedAt: timestamp,
      };
      assessments.set(id, recorded);
      return Promise.resolve(recorded);
    },
  };
  const inventory: InventorySalesPort = {
    readStock: (context) => {
      contexts.push(context);
      calls.push('availability-read');
      return Promise.resolve(stock);
    },
  };
  const policy: SalesPolicy = {
    canProduce: () => Promise.resolve(permitted),
    canReserve: () => Promise.resolve(permitted),
    canShip: () => Promise.resolve(permitted),
    canAccess: () => {
      calls.push('authorize');
      return Promise.resolve(permitted);
    },
  };
  const service = new SalesService(store, inventory, policy);
  function request(command: string, payload: JsonObject = {}, id?: string): CommandRequest {
    const assessment =
      command === 'DraftFulfillmentAssessment' ||
      command === 'RecordFulfillmentStock' ||
      command === 'RecordFulfillmentMake';
    return {
      command,
      contract_version: 1,
      idempotency_key: randomUUID(),
      target: {
        kind: assessment ? 'fulfillment-assessment' : 'sales-order',
        id: id ?? (assessment ? assessmentId : orderId),
      },
      payload,
      preconditions: {},
    };
  }
  function execute(command: string, payload: JsonObject = {}, id?: string) {
    return service.execute(request(command, payload, id), actor, transaction);
  }
  const draftPayload = () => ({ customerId, items: [{ ...item }] });
  const selections = () => ({ selections: [{ itemId: item.id, unitIds: [unitId] }] });
  async function ready() {
    await execute('DraftSalesOrder', draftPayload());
    await execute('SubmitSalesOrder');
    await execute('DraftFulfillmentAssessment', { orderId });
    await execute('RecordFulfillmentStock', selections());
  }
  return {
    customerId,
    actor,
    transaction,
    orderId,
    assessmentId,
    unitId,
    item,
    orders,
    assessments,
    contexts,
    calls,
    store,
    policy,
    inventory,
    service,
    request,
    execute,
    draftPayload,
    selections,
    ready,
    permit(value: boolean) {
      permitted = value;
    },
    onLock(hook: () => void) {
      lockHook = hook;
    },
    setStock(rows: readonly StockView[]) {
      stock = rows;
    },
  };
}

void test('Sales registers bounded STOCK and MAKE non-monetary commands', () => {
  const f = fixture();
  assert.deepEqual(
    f.service.contracts().map((value) => value.command),
    [
      'DraftSalesOrder',
      'SubmitSalesOrder',
      'DraftFulfillmentAssessment',
      'RecordFulfillmentStock',
      'RecordFulfillmentMake',
      'ConfirmSalesOrder',
    ],
  );
  assert.ok(f.service.contracts().every((value) => value.active && value.version === 1));
});

void test('Sales item validation preserves exact whole kg and rejects invented commercial fields', () => {
  const f = fixture();
  assert.equal(parseSalesOrderInput(f.draftPayload()).items[0]?.demandedKg, '9007199254740993');
  assert.ok(Object.isFrozen(parseSalesOrderInput(f.draftPayload()).items[0]));
  for (const demandedKg of [0, '0', '-1', '1.5', '01', '1e3', '+1', '1\n', '100000000000000000000'])
    assert.throws(
      () => parseSalesOrderInput({ customerId: f.customerId, items: [{ ...f.item, demandedKg }] }),
      guard('GUARD_INVARIANT'),
    );
  for (const field of ['pricePerKg', 'currency', 'tax', 'orderCode', 'customerScope'])
    assert.throws(
      () => parseSalesOrderInput({ ...f.draftPayload(), [field]: 'invented' }),
      guard('GUARD_INVARIANT'),
    );
  for (const description of ['', ' ', 'a\n', 'a'.repeat(129), '😀'.repeat(33), '\ud800'])
    assert.throws(
      () => parseSalesOrderInput({ customerId: f.customerId, items: [{ ...f.item, description }] }),
      guard('GUARD_INVARIANT'),
    );
  for (const allowPartialShipment of [1, 'true', null])
    assert.throws(
      () =>
        parseSalesOrderInput({
          customerId: f.customerId,
          items: [{ ...f.item, allowPartialShipment }],
        }),
      guard('GUARD_INVARIANT'),
    );
  assert.throws(
    () => parseSalesOrderInput({ customerId: f.customerId, items: [{ ...f.item }, { ...f.item }] }),
    guard('GUARD_INVARIANT'),
  );
  assert.throws(
    () => parseSalesOrderInput({ customerId: f.customerId, items: [] }),
    guard('GUARD_INVARIANT'),
  );
});

void test('stock selections prohibit duplicate units across lines and enforce bounded complete IDs', () => {
  const f = fixture();
  assert.ok(Object.isFrozen(parseStockSelections(f.selections())[0]?.unitIds));
  assert.throws(
    () =>
      parseStockSelections({ selections: [{ itemId: f.item.id, unitIds: [f.unitId, f.unitId] }] }),
    guard('GUARD_INVARIANT'),
  );
  assert.throws(
    () =>
      parseStockSelections({
        selections: [
          { itemId: f.item.id, unitIds: [f.unitId] },
          { itemId: randomUUID(), unitIds: [f.unitId] },
        ],
      }),
    guard('GUARD_INVARIANT'),
  );
  assert.throws(
    () =>
      parseStockSelections({
        selections: [
          { itemId: f.item.id, unitIds: Array.from({ length: 17 }, () => randomUUID()) },
        ],
      }),
    guard('GUARD_INVARIANT'),
  );
  assert.throws(
    () => parseStockSelections({ selections: [{ itemId: f.item.id, unitIds: ['missing'] }] }),
    guard('GUARD_INVARIANT'),
  );
  assert.throws(
    () => parseStockSelections({ selections: [], reserve: true }),
    guard('GUARD_INVARIANT'),
  );
});

void test('direct demand flow snapshots customer/specification and confirms without quotation or stock mutations', async () => {
  const f = fixture();
  await f.ready();
  const decision = await f.execute('ConfirmSalesOrder', { assessmentId: f.assessmentId });
  assert.equal(decision.outcome, 'accepted');
  if (decision.outcome !== 'accepted') throw new Error('Expected accepted');
  assert.equal(decision.event, 'SalesOrderConfirmed');
  assert.equal(decision.data?.confirmedAt, timestamp);
  const order = f.orders.get(f.orderId)!;
  assert.equal(order.commercialTerms, 'NOT_SUPPLIED');
  assert.equal(order.customerName, 'مشتری ثبت‌شده');
  assert.deepEqual(order.items, [f.item]);
  assert.equal(order.state, 'CONFIRMED');
  assert.equal(order.confirmedAssessmentId, f.assessmentId);
  assert.equal(f.calls.filter((value) => value === 'availability-read').length, 2);
  assert.ok(
    f.contexts.every(
      (context) => context.transaction === f.transaction && context.actor === f.actor,
    ),
  );
  const context = {
    actor: f.actor,
    transaction: f.transaction,
    request: f.request('ConfirmSalesOrder', { assessmentId: f.assessmentId }),
  };
  const read = await f.service.getOrder(context, f.orderId);
  assert.ok(Object.isFrozen(read?.items));
  assert.ok(Object.isFrozen(read?.items[0]));
  assert.ok(Object.isFrozen(await f.service.getAssessment(context, f.assessmentId)));
});

void test('new keys on bound document identities distinguish duplicate facts and conflicting reuse', async () => {
  const f = fixture();
  await f.execute('DraftSalesOrder', f.draftPayload());
  await assert.rejects(
    f.execute('DraftSalesOrder', f.draftPayload()),
    guard('GUARD_IDEMPOTENT_DUP'),
  );
  await assert.rejects(
    f.execute('DraftSalesOrder', {
      customerId: f.customerId,
      items: [{ ...f.item, demandedKg: '2' }],
    }),
    guard('GUARD_CONFLICT'),
  );
  await f.execute('SubmitSalesOrder');
  await assert.rejects(f.execute('SubmitSalesOrder'), guard('GUARD_IDEMPOTENT_DUP'));
  await f.execute('DraftFulfillmentAssessment', { orderId: f.orderId });
  await assert.rejects(
    f.execute('DraftFulfillmentAssessment', { orderId: f.orderId }),
    guard('GUARD_IDEMPOTENT_DUP'),
  );
  await f.execute('RecordFulfillmentStock', f.selections());
  await assert.rejects(
    f.execute('RecordFulfillmentStock', f.selections()),
    guard('GUARD_IDEMPOTENT_DUP'),
  );
  await assert.rejects(
    f.execute('RecordFulfillmentStock', {
      selections: [{ itemId: f.item.id, unitIds: [randomUUID()] }],
    }),
    guard('GUARD_CONFLICT'),
  );
  await f.execute('ConfirmSalesOrder', { assessmentId: f.assessmentId });
  await assert.rejects(
    f.execute('ConfirmSalesOrder', { assessmentId: f.assessmentId }),
    guard('GUARD_IDEMPOTENT_DUP'),
  );
  await assert.rejects(
    f.execute('ConfirmSalesOrder', { assessmentId: randomUUID() }),
    guard('GUARD_CONFLICT'),
  );
});

void test('confirmation requires submitted demand and matching recorded assessment', async () => {
  const f = fixture();
  await f.execute('DraftSalesOrder', f.draftPayload());
  await assert.rejects(
    f.execute('ConfirmSalesOrder', { assessmentId: f.assessmentId }),
    guard('GUARD_STATE'),
  );
  await f.execute('SubmitSalesOrder');
  await f.execute('DraftFulfillmentAssessment', { orderId: f.orderId });
  await assert.rejects(
    f.execute('ConfirmSalesOrder', { assessmentId: f.assessmentId }),
    guard('GUARD_STATE'),
  );
  const assessment = f.assessments.get(f.assessmentId)!;
  f.assessments.set(f.assessmentId, {
    ...assessment,
    state: 'RECORDED',
    selections: parseStockSelections(f.selections()),
    stock: [],
    observedAt: timestamp,
    orderBinding: 'stale',
  });
  await assert.rejects(
    f.execute('ConfirmSalesOrder', { assessmentId: f.assessmentId }),
    guard('GUARD_STATE'),
  );
});

void test('recording stock rejects missing coverage, wrong type, unavailable states and insufficient exact kg', async () => {
  const f = fixture();
  await f.execute('DraftSalesOrder', f.draftPayload());
  await f.execute('DraftFulfillmentAssessment', { orderId: f.orderId });
  await assert.rejects(
    f.execute('RecordFulfillmentStock', {
      selections: [{ itemId: randomUUID(), unitIds: [f.unitId] }],
    }),
    guard('GUARD_INVARIANT'),
  );
  for (const row of [
    { unitId: f.unitId, kind: 'COIL', state: 'AVAILABLE', availableKg: f.item.demandedKg },
    { unitId: f.unitId, kind: 'SHEET', state: 'RESERVED', availableKg: f.item.demandedKg },
    {
      unitId: f.unitId,
      kind: 'SHEET',
      state: 'PARTIALLY_CONSUMED',
      availableKg: f.item.demandedKg,
    },
    {
      unitId: f.unitId,
      kind: 'SHEET',
      state: 'AVAILABLE',
      availableKg: '9007199254740992.999999999999999999',
    },
    { unitId: f.unitId, kind: 'SHEET', state: 'AVAILABLE', availableKg: '0' },
  ]) {
    f.setStock([row]);
    await assert.rejects(
      f.execute('RecordFulfillmentStock', f.selections()),
      guard('GUARD_INVARIANT'),
    );
  }
  f.setStock([]);
  await assert.rejects(
    f.execute('RecordFulfillmentStock', f.selections()),
    guard('GUARD_INVARIANT'),
  );
  f.setStock([{ unitId: f.unitId, kind: 'SHEET', state: 'AVAILABLE', availableKg: '-1' }]);
  await assert.rejects(
    f.execute('RecordFulfillmentStock', f.selections()),
    (error) => error instanceof TechnicalError,
  );
});

void test('confirmation rechecks stock instead of promising an earlier availability snapshot', async () => {
  const f = fixture();
  await f.ready();
  f.setStock([{ unitId: f.unitId, kind: 'SHEET', state: 'AVAILABLE', availableKg: '1' }]);
  await assert.rejects(
    f.execute('ConfirmSalesOrder', { assessmentId: f.assessmentId }),
    guard('GUARD_INVARIANT'),
  );
  assert.equal(f.orders.get(f.orderId)?.state, 'SUBMITTED');
});

void test('Sales requires current individual customer-scoped permission before and after locking', async () => {
  const f = fixture();
  const request = f.request('DraftSalesOrder', f.draftPayload());
  for (const actor of [
    { ...f.actor, actorRole: 'ACT-WH' },
    { ...f.actor, actorRole: 'ACT-CUST' },
    { ...f.actor, customerScope: undefined },
    { ...f.actor, customerScope: randomUUID() },
  ])
    await assert.rejects(
      f.service.execute(request, actor as ExecutionContext, f.transaction),
      guard('GUARD_ACTOR'),
    );
  assert.equal(f.orders.size, 0);
  f.onLock(() => f.permit(false));
  await assert.rejects(f.execute('DraftSalesOrder', f.draftPayload()), guard('GUARD_ACTOR'));
  assert.equal(f.orders.size, 0);
});

void test('Sales snapshots inputs before asynchronous authorization without replacing authenticated actor brand', async () => {
  const f = fixture();
  const mutable = f.draftPayload();
  const request = f.request('DraftSalesOrder', mutable);
  f.policy.canAccess = () => {
    mutable.items[0]!.demandedKg = '1';
    return Promise.resolve(true);
  };
  await f.service.execute(request, f.actor, f.transaction);
  assert.equal(f.orders.get(f.orderId)?.items[0]?.demandedKg, '9007199254740993');
  assert.ok(
    f.contexts.every(
      (context) => context.actor === f.actor && Object.isFrozen(context.request.payload),
    ),
  );
});

void test('Sales rejects wrong target kind, unknown fields and unsupported transitions before mutation', async () => {
  const f = fixture();
  const request = f.request('DraftSalesOrder', f.draftPayload());
  await assert.rejects(
    f.service.execute(
      { ...request, target: { kind: 'inventory-unit', id: f.orderId } },
      f.actor,
      f.transaction,
    ),
    guard('GUARD_INVARIANT'),
  );
  await assert.rejects(
    f.service.execute({ ...request, preconditions: { force: true } }, f.actor, f.transaction),
    guard('GUARD_INVARIANT'),
  );
  await assert.rejects(f.execute('SubmitSalesOrder', { force: true }), guard('GUARD_INVARIANT'));
  await assert.rejects(f.execute('RecordInquiry'), guard('GUARD_INVARIANT'));
  assert.equal(f.orders.size, 0);
});

void test('known cross-customer document identity collisions have only a generic actor rejection mapping', async () => {
  const f = fixture();
  const contracts = f.service.contracts();
  for (const [command, constraint] of [
    ['DraftSalesOrder', 'sales_order_pkey'],
    ['DraftFulfillmentAssessment', 'fulfillment_assessment_pkey'],
  ]) {
    const contract = contracts.find((value) => value.command === command)!;
    const mapper = contract.constraintRejections?.[constraint!];
    assert.ok(mapper);
    const result = await mapper(f.request(command!), f.actor, f.transaction);
    assert.deepEqual(result, { family: 'GUARD_ACTOR', message: 'Sales resource unavailable' });
    assert.equal(contract.constraintRejections?.unrelated_constraint, undefined);
  }
});

void test('MAKE selection and confirmation need no finished stock and never auto-start Production', async () => {
  const f = fixture();
  f.setStock([]);
  await f.execute('DraftSalesOrder', f.draftPayload());
  await f.execute('SubmitSalesOrder');
  await f.execute('DraftFulfillmentAssessment', { orderId: f.orderId });
  await f.execute('RecordFulfillmentMake');
  await assert.rejects(f.execute('RecordFulfillmentMake'), guard('GUARD_IDEMPOTENT_DUP'));
  await assert.rejects(
    f.execute('RecordFulfillmentStock', f.selections()),
    guard('GUARD_CONFLICT'),
  );
  await f.execute('ConfirmSalesOrder', { assessmentId: f.assessmentId });
  assert.equal(f.orders.get(f.orderId)?.state, 'CONFIRMED');
  assert.equal(f.assessments.get(f.assessmentId)?.mode, 'MAKE');
  assert.ok(!f.calls.includes('availability-read') && !f.calls.includes('make-reference'));
  const ctx = { actor: f.actor, request: f.request('GetReservation'), transaction: f.transaction };
  assert.equal(await f.service.reservationDemand(ctx, f.orderId, f.customerId), undefined);
  assert.equal(await f.service.shippingDemand(ctx, f.orderId, f.customerId), undefined);
});
void test('MAKE owner demand preserves customer binding and release alone records production reference', async () => {
  const f = fixture();
  await f.execute('DraftSalesOrder', f.draftPayload());
  await f.execute('SubmitSalesOrder');
  await f.execute('DraftFulfillmentAssessment', { orderId: f.orderId });
  await f.execute('RecordFulfillmentMake');
  await f.execute('ConfirmSalesOrder', { assessmentId: f.assessmentId });
  const productionId = randomUUID();
  const actor = Object.freeze({ ...f.actor, actorRole: 'ACT-PLAN' });
  const request = {
    ...f.request('ReleaseProductionOrder'),
    target: { kind: 'production-order', id: productionId },
  };
  const context = { actor, request, transaction: f.transaction };
  const demand = await f.service.productionDemand(context, f.orderId, f.customerId);
  assert.equal(demand?.id, f.orderId);
  assert.equal(demand?.items[0]?.demandedKg, f.item.demandedKg);
  await assert.rejects(
    f.service.productionDemand({ ...context, actor: f.actor }, f.orderId, f.customerId),
    guard('GUARD_ACTOR'),
  );
  await assert.rejects(
    f.service.productionDemand(context, f.orderId, randomUUID()),
    guard('GUARD_ACTOR'),
  );
  await assert.rejects(
    f.service.startMake(
      { ...context, actor: Object.freeze({ ...actor, actorRole: 'ACT-OP' }) },
      f.orderId,
      productionId,
      f.item.id,
    ),
    guard('GUARD_ACTOR'),
  );
  await assert.rejects(
    f.service.startMake(
      { ...context, request: { ...request, command: 'DraftSalesOrder' } },
      f.orderId,
      productionId,
      f.item.id,
    ),
    guard('GUARD_ACTOR'),
  );
  // A command label and a current planner grant do not authorize the mutating owner port.
  await assert.rejects(
    f.service.startMake(context, f.orderId, productionId, f.item.id),
    guard('GUARD_ACTOR'),
  );
  assert.equal(f.calls.filter((call) => call === 'make-reference').length, 0);
  let releaseAdmitted = true;
  f.policy.canStartMake = (ctx, sales, production, item) =>
    Promise.resolve(
      releaseAdmitted &&
        ctx.actor === actor &&
        ctx.transaction === f.transaction &&
        ctx.request.idempotency_key === request.idempotency_key &&
        sales === f.orderId &&
        production === productionId &&
        item === f.item.id,
    );
  f.onLock(() => {
    releaseAdmitted = false;
  });
  await assert.rejects(
    f.service.startMake(context, f.orderId, productionId, f.item.id),
    guard('GUARD_ACTOR'),
  );
  assert.equal(f.calls.filter((call) => call === 'make-reference').length, 0);
  assert.equal(f.orders.get(f.orderId)?.state, 'CONFIRMED');
  releaseAdmitted = true;
  f.onLock(() => {});
  await f.service.startMake(context, f.orderId, productionId, f.item.id);
  assert.equal(f.orders.get(f.orderId)?.state, 'IN_PRODUCTION');
  assert.equal(
    (await f.service.productionDemand(context, f.orderId, f.customerId))?.binding,
    demand?.binding,
  );
  assert.equal(f.calls.filter((call) => call === 'make-reference').length, 1);
  f.permit(false);
  await assert.rejects(
    f.service.productionDemand(context, f.orderId, f.customerId),
    guard('GUARD_ACTOR'),
  );
});
void test('MAKE contract cannot insert client-supplied plan/material/manager authority and cannot overwrite STOCK assessment', async () => {
  const f = fixture();
  await f.ready();
  await assert.rejects(f.execute('RecordFulfillmentMake'), guard('GUARD_CONFLICT'));
  const g = fixture();
  await g.execute('DraftSalesOrder', g.draftPayload());
  await g.execute('DraftFulfillmentAssessment', { orderId: g.orderId });
  await assert.rejects(
    g.execute('RecordFulfillmentMake', { manager: 'fake' }),
    guard('GUARD_INVARIANT'),
  );
  const actor = Object.freeze({ ...g.actor, actorRole: 'ACT-PLAN' });
  assert.equal(
    await g.service.productionDemand(
      { actor, request: g.request('GetProductionOrder'), transaction: g.transaction },
      g.orderId,
      g.customerId,
    ),
    undefined,
  );
});
