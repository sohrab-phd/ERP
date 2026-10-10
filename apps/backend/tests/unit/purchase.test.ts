import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import {
  AdmissionError,
  BusinessRejection,
  TechnicalError,
  createTransactionContext,
  type CommandRequest,
  type ExecutionContext,
  type GuardFamily,
  type JsonValue,
} from '@navard/shared-kernel';
import {
  PurchaseService,
  parseCompletedPurchase,
  parsePurchaseProforma,
} from '../../src/modules/procurement/index.js';
import type {
  CompletedPurchase,
  CompletedPurchaseInput,
  PurchaseContext,
  PurchasePolicy,
  PurchaseProforma,
  PurchaseStore,
} from '../../src/modules/procurement/index.js';

const input: CompletedPurchaseInput = {
  purchaseDocumentReference: 'خرید-17',
  supplierReference: 'Supplier name / documentary reference',
  purchaseDate: '2026-10-10',
  materialDescription: 'Coil and sheets as documented',
};
function rejected(family: GuardFamily) {
  return (error: unknown) =>
    error instanceof BusinessRejection && error.rejection.family === family;
}
function forbiddenActor(error: unknown) {
  return (
    rejected('GUARD_ACTOR')(error) ||
    (error instanceof AdmissionError && error.family === 'GUARD_ACTOR')
  );
}
function setup() {
  const actor: ExecutionContext = {
    installationId: randomUUID(),
    authorityScopeId: randomUUID(),
    principal: { issuer: 'identity', subject: randomUUID() },
    actorRole: 'ACT-PROC',
    requestId: randomUUID(),
  };
  const request: CommandRequest = {
    command: 'RecordCompletedPurchase',
    contract_version: 1,
    idempotency_key: randomUUID(),
    target: { kind: 'purchase-record', id: randomUUID() },
    payload: { ...input },
    preconditions: {},
  };
  const transaction = createTransactionContext();
  const purchases = new Map<string, CompletedPurchase>();
  const proformas = new Map<string, PurchaseProforma>();
  const calls: string[] = [];
  const contexts: PurchaseContext[] = [];
  function observe(ctx: PurchaseContext, call: string) {
    contexts.push(ctx);
    calls.push(call);
  }
  const store: PurchaseStore = {
    lock: (ctx, kind, id) => {
      observe(ctx, `lock:${kind}:${id}`);
      return Promise.resolve();
    },
    purchase: (ctx, id) => {
      observe(ctx, `purchase:${id}`);
      return Promise.resolve(purchases.get(id));
    },
    proforma: (ctx, id) => {
      observe(ctx, `proforma:${id}`);
      return Promise.resolve(proformas.get(id));
    },
    recordPurchase: (ctx, id, binding, supplied) => {
      observe(ctx, `recordPurchase:${id}`);
      purchases.set(id, {
        ...supplied,
        id,
        binding,
        ...ctx.actor.principal,
        recordedAt: '2026-10-10T12:00:00.000Z',
      });
      return Promise.resolve();
    },
    recordProforma: (ctx, id, binding, supplied) => {
      observe(ctx, `recordProforma:${id}`);
      proformas.set(id, {
        ...supplied,
        id,
        binding,
        ...ctx.actor.principal,
        recordedAt: '2026-10-10T12:00:00.000Z',
      });
      return Promise.resolve();
    },
  };
  const policy: PurchasePolicy = {
    current: (ctx) => {
      observe(ctx, 'authorize');
      return Promise.resolve(true);
    },
  };
  return {
    actor,
    request,
    transaction,
    purchases,
    proformas,
    calls,
    contexts,
    store,
    policy,
    service: new PurchaseService(store, policy),
  };
}
function proformaRequest(purchaseId: string): CommandRequest {
  return {
    command: 'RecordPurchaseProformaSent',
    contract_version: 1,
    idempotency_key: randomUUID(),
    target: { kind: 'purchase-proforma', id: randomUUID() },
    payload: { purchaseId, proformaReference: 'PROFORMA-17', sentDate: '2026-10-09' },
    preconditions: {},
  };
}

void test('purchasing parsers preserve descriptive evidence, byte boundaries and valid calendar dates', () => {
  const parsed = parseCompletedPurchase({ ...input });
  assert.deepEqual(parsed, input);
  assert.ok(Object.isFrozen(parsed));
  const maximum = parseCompletedPurchase({
    ...input,
    purchaseDocumentReference: '😀'.repeat(32),
    supplierReference: 'x'.repeat(128),
    materialDescription: '😀'.repeat(128),
  });
  assert.equal(maximum.materialDescription, '😀'.repeat(128));
  for (const purchaseDate of ['0001-01-01', '2000-02-29', '2024-02-29', '9999-12-31'])
    assert.equal(parseCompletedPurchase({ ...input, purchaseDate }).purchaseDate, purchaseDate);
  const proforma = parsePurchaseProforma(proformaRequest(randomUUID()).payload);
  assert.ok(Object.isFrozen(proforma));
  assert.equal(proforma.sentDate, '2026-10-09');
});

void test('purchasing dates reject invalid days, coercion and noncanonical representations', () => {
  for (const value of [
    null,
    20261010,
    '',
    '0000-01-01',
    '1900-02-29',
    '2026-02-29',
    '2026-04-31',
    '2026-00-10',
    '2026-13-01',
    '2026-10-00',
    '2026-10-32',
    '2026-1-1',
    ' 2026-10-10',
    '2026-10-10\n',
    '2026-10-10T00:00:00Z',
  ]) {
    assert.throws(
      () => parseCompletedPurchase({ ...input, purchaseDate: value }),
      rejected('GUARD_INVARIANT'),
    );
    assert.throws(
      () => parsePurchaseProforma({ ...proformaRequest(randomUUID()).payload, sentDate: value }),
      rejected('GUARD_INVARIANT'),
    );
  }
});

void test('purchasing text is bounded UTF8 and closed schemas reject missing and speculative fields', () => {
  for (const field of ['purchaseDocumentReference', 'supplierReference', 'materialDescription']) {
    const limit = field === 'materialDescription' ? 512 : 128;
    for (const value of [
      null,
      17,
      '',
      '  ',
      'x'.repeat(limit + 1),
      '😀'.repeat(limit / 4 + 1),
      '\ud800',
      'a\n',
      'supplier\u0085reference',
      'a\t',
      'a\u007f',
    ])
      assert.throws(
        () => parseCompletedPurchase({ ...input, [field]: value }),
        rejected('GUARD_INVARIANT'),
      );
    const missing: Record<string, JsonValue> = { ...input };
    delete missing[field];
    assert.throws(() => parseCompletedPurchase(missing), rejected('GUARD_INVARIANT'));
  }
  for (const field of [
    'supplierId',
    'purchaseOrderId',
    'price',
    'currency',
    'measuredKg',
    'approvedBy',
    'proformaReference',
    'customerScope',
  ])
    assert.throws(
      () => parseCompletedPurchase({ ...input, [field]: 'invented' }),
      rejected('GUARD_INVARIANT'),
    );
  const proforma = proformaRequest(randomUUID()).payload;
  for (const purchaseId of [
    null,
    'unknown',
    '00000000-0000-0000-0000-000000000000',
    (proforma.purchaseId as string).toUpperCase(),
  ])
    assert.throws(
      () => parsePurchaseProforma({ ...proforma, purchaseId }),
      rejected('GUARD_INVARIANT'),
    );
  for (const proformaReference of ['', '\ud800', 'x'.repeat(129), 'a\r', 'proforma\u009freference'])
    assert.throws(
      () => parsePurchaseProforma({ ...proforma, proformaReference }),
      rejected('GUARD_INVARIANT'),
    );
  assert.throws(
    () => parsePurchaseProforma({ ...proforma, recipient: 'supplier' }),
    rejected('GUARD_INVARIANT'),
  );
});

void test('completed purchase needs no proforma and uses only its own evidence store on the supplied transaction', async () => {
  const f = setup();
  const decision = await f.service.record(f.request, f.actor, f.transaction);
  assert.deepEqual(decision, {
    outcome: 'accepted',
    factIdentity: f.request.target.id,
    event: 'CompletedPurchaseRecorded',
    data: { purchaseId: f.request.target.id },
  });
  assert.equal(f.purchases.size, 1);
  assert.equal(f.proformas.size, 0);
  assert.deepEqual(f.calls, [
    'authorize',
    `lock:purchase-record:${f.request.target.id}`,
    'authorize',
    `purchase:${f.request.target.id}`,
    `recordPurchase:${f.request.target.id}`,
  ]);
  assert.ok(f.contexts.every((ctx) => ctx.transaction === f.transaction));
  assert.ok(f.contexts.every((ctx) => Object.isFrozen(ctx.request.payload)));
});

void test('sent proforma is separately identified and can be added later without changing the completed purchase', async () => {
  const f = setup();
  await f.service.record(f.request, f.actor, f.transaction);
  const purchase = structuredClone(f.purchases.get(f.request.target.id));
  const request = proformaRequest(f.request.target.id);
  const decision = await f.service.record(request, f.actor, f.transaction);
  assert.deepEqual(decision, {
    outcome: 'accepted',
    factIdentity: request.target.id,
    event: 'PurchaseProformaSentRecorded',
    data: { proformaId: request.target.id, purchaseId: f.request.target.id },
  });
  assert.deepEqual(f.purchases.get(f.request.target.id), purchase);
  assert.equal(f.proformas.get(request.target.id)?.purchaseId, f.request.target.id);
  // No business date-order rule or one-proforma-per-purchase rule was confirmed.
  await f.service.record(proformaRequest(f.request.target.id), f.actor, f.transaction);
  assert.equal(f.proformas.size, 2);
  const absent = setup();
  await assert.rejects(
    absent.service.record(proformaRequest(randomUUID()), absent.actor, absent.transaction),
    rejected('GUARD_STATE'),
  );
  assert.equal(absent.proformas.size, 0);
  assert.ok(!absent.calls.some((call) => call.startsWith('record')));
});

void test('different keys on a recorded UUID distinguish identical evidence from conflicting facts for both commands', async () => {
  const f = setup();
  await f.service.record(f.request, f.actor, f.transaction);
  await assert.rejects(
    f.service.record({ ...f.request, idempotency_key: randomUUID() }, f.actor, f.transaction),
    rejected('GUARD_IDEMPOTENT_DUP'),
  );
  await assert.rejects(
    f.service.record(
      {
        ...f.request,
        idempotency_key: randomUUID(),
        payload: { ...input, materialDescription: 'Changed' },
      },
      f.actor,
      f.transaction,
    ),
    rejected('GUARD_CONFLICT'),
  );
  const request = proformaRequest(f.request.target.id);
  await f.service.record(request, f.actor, f.transaction);
  await assert.rejects(
    f.service.record({ ...request, idempotency_key: randomUUID() }, f.actor, f.transaction),
    rejected('GUARD_IDEMPOTENT_DUP'),
  );
  await assert.rejects(
    f.service.record(
      {
        ...request,
        idempotency_key: randomUUID(),
        payload: { ...request.payload, sentDate: '2026-10-10' },
      },
      f.actor,
      f.transaction,
    ),
    rejected('GUARD_CONFLICT'),
  );
  assert.equal(f.purchases.size, 1);
  assert.equal(f.proformas.size, 1);
  await f.service.record(
    {
      ...f.request,
      idempotency_key: randomUUID(),
      target: { ...f.request.target, id: randomUUID() },
    },
    f.actor,
    f.transaction,
  );
  assert.equal(
    f.purchases.size,
    2,
    'matching descriptive facts do not establish physical duplicates',
  );
});

void test('only current organizational ACT-PROC may record and retrieve purchase or proforma evidence', async () => {
  for (const override of [
    { actorRole: 'ACT-WH' },
    { actorRole: 'ACT-SEC' },
    { actorRole: 'ACT-SALES' },
    { actorRole: 'ACT-CUST' },
    { actorRole: 'ACT-IPS' },
    { customerScope: randomUUID() },
    { temporary: true },
  ]) {
    const f = setup();
    const actor = { ...f.actor, ...override };
    await assert.rejects(f.service.record(f.request, actor, f.transaction), forbiddenActor);
    await assert.rejects(
      f.service.record(proformaRequest(randomUUID()), actor, f.transaction),
      forbiddenActor,
    );
    for (const kind of ['GetCompletedPurchase', 'GetPurchaseProforma'] as const)
      await assert.rejects(
        f.service.get(
          { actor, request: f.request, transaction: f.transaction },
          kind,
          f.request.target.id,
        ),
        forbiddenActor,
      );
    assert.deepEqual(f.calls, []);
  }
  const f = setup();
  f.policy.current = () => Promise.resolve(false);
  await assert.rejects(
    f.service.record(f.request, f.actor, f.transaction),
    rejected('GUARD_ACTOR'),
  );
  assert.deepEqual(f.calls, []);
});

void test('revocation while waiting for document lock denies inserts and already-recorded duplicate disclosure', async () => {
  for (const existing of [false, true]) {
    const f = setup();
    if (existing) await f.service.record(f.request, f.actor, f.transaction);
    f.calls.length = 0;
    let current = true;
    f.policy.current = () => Promise.resolve(current);
    f.store.lock = () => {
      current = false;
      return Promise.resolve();
    };
    await assert.rejects(
      f.service.record({ ...f.request, idempotency_key: randomUUID() }, f.actor, f.transaction),
      rejected('GUARD_ACTOR'),
    );
    assert.deepEqual(f.calls, []);
    assert.equal(f.purchases.size, existing ? 1 : 0);
  }
});

void test('caller mutation during async lock cannot change evidence identity, principal, scope or material binding', async () => {
  const f = setup();
  const payload = { ...input };
  const request = { ...f.request, payload, target: { ...f.request.target } };
  const principal = { ...f.actor.principal };
  const actor: { -readonly [K in keyof ExecutionContext]: ExecutionContext[K] } = {
    ...f.actor,
    principal,
  };
  const originalId = f.request.target.id;
  const originalPrincipal = { ...f.actor.principal };
  const originalScope = f.actor.authorityScopeId;
  let release!: () => void;
  let entered!: () => void;
  const locked = new Promise<void>((resolve) => {
    entered = resolve;
  });
  f.store.lock = () => {
    entered();
    return new Promise<void>((resolve) => {
      release = resolve;
    });
  };
  const running = f.service.record(request, actor, f.transaction);
  await locked;
  payload.materialDescription = 'Tampered';
  request.target.id = randomUUID();
  request.command = 'RecordPurchaseProformaSent';
  principal.subject = randomUUID();
  actor.authorityScopeId = randomUUID();
  actor.customerScope = randomUUID();
  release();
  const decision = await running;
  assert.equal(decision.outcome, 'accepted');
  assert.equal(f.purchases.get(originalId)?.materialDescription, input.materialDescription);
  assert.equal(f.purchases.get(originalId)?.subject, originalPrincipal.subject);
  assert.ok(f.contexts.every((ctx) => ctx.actor.authorityScopeId === originalScope));
  assert.ok(
    f.contexts.every(
      (ctx) => Object.isFrozen(ctx.actor.principal) && Object.isFrozen(ctx.request.target),
    ),
  );
  assert.equal(f.purchases.size, 1);
});

void test('closed command contracts reject unsupported command, target, version, key and preconditions before store access', async () => {
  for (const change of [
    { command: 'ApprovePurchaseOrder' },
    { contract_version: 2 },
    { target: { kind: 'goods-receipt', id: randomUUID() } },
    { target: { kind: 'purchase-record', id: 'unsafe' } },
    { idempotency_key: 'unsafe' },
    { preconditions: { approved: true } },
  ]) {
    const f = setup();
    await assert.rejects(
      f.service.record({ ...f.request, ...change }, f.actor, f.transaction),
      rejected('GUARD_INVARIANT'),
    );
    assert.deepEqual(f.calls, []);
  }
  const f = setup();
  const contracts = f.service.contracts();
  assert.deepEqual(
    contracts.map((c) => c.command),
    ['RecordCompletedPurchase', 'RecordPurchaseProformaSent'],
  );
  assert.ok(
    contracts.every(
      (c) => c.version === 1 && c.active && Object.keys(c.preconditionsShape).length === 0,
    ),
  );
  assert.deepEqual(Object.keys(contracts[0]!.payloadShape), Object.keys(input));
  assert.deepEqual(Object.keys(contracts[1]!.payloadShape), [
    'purchaseId',
    'proformaReference',
    'sentDate',
  ]);
});

void test('evidence reads omit binding and retain attribution; technical storage failures are never business rejections', async () => {
  const f = setup();
  await f.service.record(f.request, f.actor, f.transaction);
  const ctx = { actor: f.actor, request: f.request, transaction: f.transaction };
  const result = await f.service.get(ctx, 'GetCompletedPurchase', f.request.target.id);
  assert.equal(result?.issuer, f.actor.principal.issuer);
  assert.equal(result?.subject, f.actor.principal.subject);
  assert.equal(result?.recordedAt, '2026-10-10T12:00:00.000Z');
  assert.ok(Object.isFrozen(result));
  assert.ok(result && !('binding' in result));
  assert.equal(await f.service.get(ctx, 'GetCompletedPurchase', randomUUID()), undefined);
  const proforma = proformaRequest(f.request.target.id);
  await f.service.record(proforma, f.actor, f.transaction);
  const sent = await f.service.get(ctx, 'GetPurchaseProforma', proforma.target.id);
  assert.ok(sent && !('binding' in sent));
  assert.equal(sent && 'purchaseId' in sent ? sent.purchaseId : undefined, f.request.target.id);
  const broken = setup();
  broken.store.recordPurchase = () => Promise.reject(new TechnicalError('retryable'));
  await assert.rejects(
    broken.service.record(broken.request, broken.actor, broken.transaction),
    TechnicalError,
  );
  assert.equal(broken.purchases.size, 0);
});
