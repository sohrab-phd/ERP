import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import {
  BusinessRejection,
  TechnicalError,
  canonicalJson,
  createTransactionContext,
  type CommandRequest,
  type ExecutionContext,
  type GuardFamily,
  type JsonObject,
} from '@navard/shared-kernel';
import {
  ReceiptService,
  parseReceiptInput,
  type InventoryReceiptPort,
  type ReceiptContext,
  type ReceiptInput,
  type ReceiptPolicy,
  type ReceiptRecord,
  type ReceiptStore,
  type StockIdentity,
} from '../../src/modules/procurement/index.js';

const input: ReceiptInput = {
  internalCode: 'انبار-17',
  count: '0',
  measuredKg: '9007199254740993',
  type: 'SHEET',
  productCode: 'SHEET-17',
  locationId: randomUUID(),
};
function payload(value: ReceiptInput): JsonObject {
  return { ...value };
}
function rejected(family: GuardFamily): (error: unknown) => boolean {
  return (error) => error instanceof BusinessRejection && error.rejection.family === family;
}

function setup() {
  const actor: ExecutionContext = {
    installationId: randomUUID(),
    authorityScopeId: randomUUID(),
    principal: { issuer: 'identity', subject: randomUUID() },
    actorRole: 'ACT-WH',
    requestId: randomUUID(),
  };
  const request: CommandRequest = {
    command: 'PostGoodsReceipt',
    contract_version: 1,
    idempotency_key: randomUUID(),
    target: { kind: 'goods-receipt', id: randomUUID() },
    payload: payload(input),
    preconditions: {},
  };
  const transaction = createTransactionContext();
  const calls: string[] = [];
  const contexts: ReceiptContext[] = [];
  const stock: StockIdentity = {
    lotId: randomUUID(),
    unitId: randomUUID(),
    materialId: randomUUID(),
    effectId: randomUUID(),
  };
  let record: ReceiptRecord | undefined;
  const store: ReceiptStore = {
    lock: (ctx) => {
      contexts.push(ctx);
      calls.push('lock');
      return Promise.resolve();
    },
    find: (ctx) => {
      contexts.push(ctx);
      calls.push('find');
      return Promise.resolve(record);
    },
    create: (ctx, created) => {
      contexts.push(ctx);
      calls.push('DRAFT');
      record = { ...created };
      return Promise.resolve();
    },
    changeState: (ctx, _id, from, to) => {
      contexts.push(ctx);
      calls.push(to);
      if (!record || record.state !== from) return Promise.resolve(false);
      record.state = to;
      return Promise.resolve(true);
    },
    finish: (ctx, _id, identity) => {
      contexts.push(ctx);
      calls.push('POSTED');
      if (!record || record.state !== 'RECEIVED') return Promise.resolve(false);
      record = { ...record, ...identity, state: 'POSTED' };
      return Promise.resolve(true);
    },
  };
  const inventory: InventoryReceiptPort = {
    receive: (ctx, receiptId, intake) => {
      contexts.push(ctx);
      calls.push('inventory');
      assert.equal(receiptId, request.target.id);
      assert.deepEqual(intake, input);
      return Promise.resolve(stock);
    },
  };
  const policy: ReceiptPolicy = {
    canPost: () => {
      calls.push('authorize');
      return Promise.resolve(true);
    },
    canRead: () => Promise.resolve(true),
  };
  return {
    actor,
    request,
    transaction,
    contexts,
    calls,
    store,
    inventory,
    policy,
    stock,
    service: new ReceiptService(store, inventory, policy),
  };
}

void test('receipt strings preserve exact kg and descriptive count with bounded factory metadata', () => {
  const parsed = parseReceiptInput(payload(input));
  assert.deepEqual(parsed, input);
  assert.ok(Object.isFrozen(parsed));
  assert.equal(parsed.measuredKg, '9007199254740993');
  const maximum = parseReceiptInput({
    ...input,
    measuredKg: '99999999999999999999',
    count: '99999999999999999999',
    internalCode: '😀'.repeat(32),
    productCode: 'x'.repeat(128),
  });
  assert.equal(maximum.internalCode, '😀'.repeat(32));
  assert.equal(maximum.count, maximum.measuredKg);
});

void test('receipt quantity validation rejects rounding, coercion, malformed numbers and overflow', () => {
  for (const measuredKg of [
    1,
    null,
    '',
    '0',
    '-1',
    '01',
    '1.0',
    '1.5',
    '1e3',
    '+1',
    ' 1',
    '1 ',
    '1\n',
    '100000000000000000000',
  ]) {
    assert.throws(() => parseReceiptInput({ ...input, measuredKg }), rejected('GUARD_INVARIANT'));
  }
  for (const count of [1, null, '', '-1', '01', '1.5', '1\n', '100000000000000000000'])
    assert.throws(() => parseReceiptInput({ ...input, count }), rejected('GUARD_INVARIANT'));
});

void test('receipt intake contract rejects unknown or future fields and invalid UTF8 metadata', () => {
  for (const name of [
    'ticketId',
    'purchaseOrderId',
    'expectedKg',
    'customerScope',
    'coilParentId',
    'qcApproved',
    'unitId',
  ])
    assert.throws(
      () => parseReceiptInput({ ...input, [name]: randomUUID() }),
      rejected('GUARD_INVARIANT'),
    );
  for (const internalCode of ['', '  ', 'x'.repeat(129), '😀'.repeat(33), '\ud800', 'a\n'])
    assert.throws(() => parseReceiptInput({ ...input, internalCode }), rejected('GUARD_INVARIANT'));
  for (const type of ['sheet', 'QC', 'LOSS', '', null])
    assert.throws(() => parseReceiptInput({ ...input, type }), rejected('GUARD_INVARIANT'));
  for (const locationId of ['unknown', input.locationId.toUpperCase(), null])
    assert.throws(() => parseReceiptInput({ ...input, locationId }), rejected('GUARD_INVARIANT'));
});

void test('standalone Sheet requires its product code without requiring Coil ancestry or purchase linkage', () => {
  const withoutProduct: ReceiptInput = { ...input };
  delete withoutProduct.productCode;
  assert.throws(() => parseReceiptInput(payload(withoutProduct)), rejected('GUARD_INVARIANT'));
  for (const type of ['COIL', 'ANGLE', 'BEAM', 'OTHER'] as const) {
    assert.equal(parseReceiptInput({ ...withoutProduct, type }).productCode, undefined);
  }
});

void test('receipt orchestration transitions through the Inventory owner port on the supplied transaction', async () => {
  const f = setup();
  const decision = await f.service.post(f.request, f.actor, f.transaction);
  assert.equal(decision.outcome, 'accepted');
  if (decision.outcome !== 'accepted') assert.fail();
  assert.equal(decision.factIdentity, f.request.target.id);
  assert.equal(decision.event, 'GoodsReceiptPosted');
  assert.equal(decision.targetState, 'POSTED');
  assert.deepEqual(decision.data, {
    receiptId: f.request.target.id,
    ...f.stock,
    measuredKg: input.measuredKg,
    state: 'POSTED',
  });
  assert.deepEqual(f.calls, [
    'authorize',
    'lock',
    'authorize',
    'find',
    'DRAFT',
    'RECEIVED',
    'inventory',
    'POSTED',
  ]);
  assert.ok(f.contexts.every((ctx) => ctx.transaction === f.transaction));
  assert.ok(f.contexts.every((ctx) => Object.isFrozen(ctx.request.payload)));
});

void test('same receipt document under a different key is duplicate only if intake binding agrees', async () => {
  const f = setup();
  await f.service.post(f.request, f.actor, f.transaction);
  await assert.rejects(
    f.service.post({ ...f.request, idempotency_key: randomUUID() }, f.actor, f.transaction),
    rejected('GUARD_IDEMPOTENT_DUP'),
  );
  await assert.rejects(
    f.service.post({ ...f.request, payload: { ...input, count: '1' } }, f.actor, f.transaction),
    rejected('GUARD_CONFLICT'),
  );
  assert.equal(f.calls.filter((call) => call === 'inventory').length, 1);
});

void test('Procurement, customers and revoked Warehouse grants cannot post receipt quantities', async () => {
  for (const actorRole of ['ACT-PROC', 'ACT-SEC', 'ACT-CUST', 'ACT-IPS']) {
    const f = setup();
    await assert.rejects(
      f.service.post(f.request, { ...f.actor, actorRole }, f.transaction),
      rejected('GUARD_ACTOR'),
    );
    assert.deepEqual(f.calls, []);
  }
  const f = setup();
  let checks = 0;
  f.policy.canPost = () => Promise.resolve(++checks === 1);
  await assert.rejects(f.service.post(f.request, f.actor, f.transaction), rejected('GUARD_ACTOR'));
  assert.deepEqual(f.calls, ['lock']);
  const g = setup();
  await assert.rejects(
    g.service.post(g.request, { ...g.actor, customerScope: 'customer' }, g.transaction),
    rejected('GUARD_ACTOR'),
  );
});

void test('missing receiving policy fails closed and unregistered contracts cannot bypass receipt validation', async () => {
  const f = setup();
  delete f.policy.canPost;
  await assert.rejects(
    f.service.post(f.request, f.actor, f.transaction),
    rejected('GUARD_OPEN_POLICY'),
  );
  assert.deepEqual(f.calls, []);
  for (const request of [
    { ...f.request, command: 'ReceiveGoods' },
    { ...f.request, contract_version: 2 },
    { ...f.request, target: { ...f.request.target, kind: 'inventory-unit' } },
    { ...f.request, idempotency_key: 'unsafe' },
    { ...f.request, preconditions: { qcApproved: true } },
  ])
    await assert.rejects(
      f.service.post(request, f.actor, f.transaction),
      rejected('GUARD_INVARIANT'),
    );
});

void test('receipt input is copied before awaiting a lock and caller mutation cannot change intake', async () => {
  const f = setup();
  const mutable = { ...input };
  const request = { ...f.request, payload: mutable };
  f.store.lock = () => {
    mutable.measuredKg = '1';
    mutable.internalCode = 'tampered';
    return Promise.resolve();
  };
  await f.service.post(request, f.actor, f.transaction);
  const record = await f.store.find(
    { actor: f.actor, request, transaction: f.transaction },
    request.target.id,
  );
  assert.equal(record?.binding, canonicalJson(payload(input)).toString('utf8'));
  assert.equal(record?.measuredKg, input.measuredKg);
});

void test('failed stock owner port never finishes receipt and malformed owner identities fail closed', async () => {
  const f = setup();
  f.inventory.receive = () => Promise.reject(new TechnicalError('retryable'));
  await assert.rejects(f.service.post(f.request, f.actor, f.transaction), TechnicalError);
  assert.ok(!f.calls.includes('POSTED'));
  const g = setup();
  g.inventory.receive = () => Promise.resolve({ ...g.stock, unitId: 'not-an-id' });
  await assert.rejects(g.service.post(g.request, g.actor, g.transaction), TechnicalError);
  assert.ok(!g.calls.includes('POSTED'));
});

void test('receipt reads enforce current access before disclosing stored intake', async () => {
  const f = setup();
  await f.service.post(f.request, f.actor, f.transaction);
  const context = { actor: f.actor, request: f.request, transaction: f.transaction };
  const receipt = await f.service.get(context, f.request.target.id);
  assert.equal(receipt?.state, 'POSTED');
  assert.ok(Object.isFrozen(receipt));
  f.policy.canRead = () => Promise.resolve(false);
  await assert.rejects(f.service.get(context, f.request.target.id), rejected('GUARD_ACTOR'));
});
