import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import {
  AdmissionError,
  BusinessRejection,
  createTransactionContext,
  type CommandRequest,
  type ExecutionContext,
  type GuardFamily,
} from '@navard/shared-kernel';
import {
  InvoiceEvidenceService,
  parseInvoiceEvidence,
  type InvoiceEvidence,
  type InvoiceEvidenceInput,
  type InvoiceEvidenceStore,
} from '../../src/modules/finance/index.js';

const input: InvoiceEvidenceInput = {
  invoiceDocumentReference: 'فاکتور-17',
  issueDate: '2026-10-10',
  salesOrderId: randomUUID(),
  customerId: randomUUID(),
};
const guard = (family: GuardFamily) => (error: unknown) =>
  (error instanceof BusinessRejection && error.rejection.family === family) ||
  (family === 'GUARD_ACTOR' && error instanceof AdmissionError && error.family === family);
function setup() {
  const actor: ExecutionContext = {
    installationId: randomUUID(),
    authorityScopeId: randomUUID(),
    principal: { issuer: 'local', subject: randomUUID() },
    actorRole: 'ACT-SALES',
    requestId: randomUUID(),
  };
  const request: CommandRequest = {
    command: 'RecordIssuedInvoiceEvidence',
    contract_version: 1,
    idempotency_key: randomUUID(),
    target: { kind: 'invoice-evidence', id: randomUUID() },
    payload: { ...input },
    preconditions: {},
  };
  const transaction = createTransactionContext();
  const records = new Map<string, InvoiceEvidence>();
  let current = true,
    linked = true;
  const store: InvoiceEvidenceStore = {
    lock: () => Promise.resolve(),
    evidence: (_ctx, id) => Promise.resolve(records.get(id)),
    record: (ctx, id, binding, value) => {
      records.set(id, {
        ...value,
        id,
        binding,
        ...ctx.actor.principal,
        recordedAt: '2026-10-10T12:00:00Z',
      });
      return Promise.resolve();
    },
  };
  const service = new InvoiceEvidenceService(
    store,
    {
      reference: (_ctx, id, customerId) => Promise.resolve(linked ? { id, customerId } : undefined),
    },
    { current: () => Promise.resolve(current) },
  );
  return {
    actor,
    request,
    transaction,
    records,
    store,
    service,
    revoke: () => {
      current = false;
    },
    unlink: () => {
      linked = false;
    },
  };
}
void test('invoice evidence accepts documentary fields, Persian reference and real date boundaries only', () => {
  assert.deepEqual(parseInvoiceEvidence({ ...input }), input);
  for (const issueDate of ['0001-01-01', '2000-02-29', '9999-12-31'])
    assert.equal(parseInvoiceEvidence({ ...input, issueDate }).issueDate, issueDate);
  for (const issueDate of ['0000-01-01', '1900-02-29', '2026-02-30', '2026-1-1', '2026-10-10\n'])
    assert.throws(() => parseInvoiceEvidence({ ...input, issueDate }), guard('GUARD_INVARIANT'));
  for (const invoiceDocumentReference of [
    '',
    ' ',
    'x\u0000',
    'x\u0085',
    'x\ud800',
    'a'.repeat(129),
    'ف'.repeat(65),
  ])
    assert.throws(
      () => parseInvoiceEvidence({ ...input, invoiceDocumentReference }),
      guard('GUARD_INVARIANT'),
    );
  assert.equal(
    parseInvoiceEvidence({ ...input, invoiceDocumentReference: 'ف'.repeat(64) })
      .invoiceDocumentReference.length,
    64,
  );
  for (const field of ['salesOrderId', 'customerId'])
    assert.throws(
      () => parseInvoiceEvidence({ ...input, [field]: 'not-uuid' }),
      guard('GUARD_INVARIANT'),
    );
  for (const field of [
    'amount',
    'finalKg',
    'issuer',
    'subject',
    'organizationId',
    'recordedAt',
    'paymentStatus',
    'uploadConfirmed',
  ])
    assert.throws(
      () => parseInvoiceEvidence({ ...input, [field]: 'override' }),
      guard('GUARD_INVARIANT'),
    );
});
void test('immutable evidence stores trusted recorder attribution; UUID rather than document reference defines identity', async () => {
  const s = setup();
  const result = await s.service.record(s.request, s.actor, s.transaction);
  assert.equal(result.outcome, 'accepted');
  assert.equal(result.event, 'IssuedInvoiceEvidenceRecorded');
  const first = s.records.get(s.request.target.id)!;
  assert.equal(first.subject, s.actor.principal.subject);
  assert.equal(first.issuer, s.actor.principal.issuer);
  const next = {
    ...s.request,
    target: { kind: 'invoice-evidence', id: randomUUID() },
    idempotency_key: randomUUID(),
  };
  await s.service.record(next, s.actor, s.transaction);
  assert.equal(s.records.size, 2);
  await assert.rejects(
    s.service.record({ ...s.request, idempotency_key: randomUUID() }, s.actor, s.transaction),
    guard('GUARD_IDEMPOTENT_DUP'),
  );
  await assert.rejects(
    s.service.record(
      {
        ...s.request,
        payload: { ...input, invoiceDocumentReference: 'changed' },
        idempotency_key: randomUUID(),
      },
      s.actor,
      s.transaction,
    ),
    guard('GUARD_CONFLICT'),
  );
  assert.equal(first.invoiceDocumentReference, input.invoiceDocumentReference);
});
void test('Finance reader may read but never record; unrelated or customer-bound grants cannot read/write evidence', async () => {
  const s = setup();
  await s.service.record(s.request, s.actor, s.transaction);
  const ctx = {
    request: s.request,
    actor: { ...s.actor, actorRole: 'ACT-FIN' },
    transaction: s.transaction,
  };
  const record = await s.service.get(ctx, s.request.target.id);
  assert.equal(record?.customerId, input.customerId);
  assert.ok(record && !('binding' in record));
  await assert.rejects(s.service.record(s.request, ctx.actor, s.transaction), guard('GUARD_ACTOR'));
  for (const actor of [
    { ...s.actor, customerScope: input.customerId },
    { ...ctx.actor, customerScope: input.customerId },
    { ...s.actor, temporary: true },
    ...['ACT-SEC', 'ACT-PROC', 'ACT-WH', 'ACT-PLAN', 'ACT-OP', 'ACT-SHIP', 'ACT-CUST'].map(
      (actorRole) => ({ ...s.actor, actorRole }),
    ),
  ]) {
    await assert.rejects(
      s.service.get({ ...ctx, actor }, s.request.target.id),
      guard('GUARD_ACTOR'),
    );
    await assert.rejects(s.service.record(s.request, actor, s.transaction), guard('GUARD_ACTOR'));
  }
});
void test('missing Sales reference rejects before inserting; mismatching owner result is not trusted', async () => {
  const s = setup();
  s.unlink();
  await assert.rejects(s.service.record(s.request, s.actor, s.transaction), guard('GUARD_STATE'));
  assert.equal(s.records.size, 0);
  const service = new InvoiceEvidenceService(
    s.store,
    { reference: () => Promise.resolve({ id: input.salesOrderId, customerId: randomUUID() }) },
    { current: () => Promise.resolve(true) },
  );
  await assert.rejects(service.record(s.request, s.actor, s.transaction), guard('GUARD_STATE'));
  assert.equal(s.records.size, 0);
});
void test('permission withdrawn at evidence lock wait prevents insert and later read', async () => {
  const s = setup();
  s.store.lock = () => {
    s.revoke();
    return Promise.resolve();
  };
  await assert.rejects(s.service.record(s.request, s.actor, s.transaction), guard('GUARD_ACTOR'));
  assert.equal(s.records.size, 0);
  await assert.rejects(
    s.service.get(
      { actor: s.actor, request: s.request, transaction: s.transaction },
      s.request.target.id,
    ),
    guard('GUARD_ACTOR'),
  );
});
void test('command input is snapshotted before asynchronous locks; caller cannot change target/customer/attribution', async () => {
  const s = setup();
  const originalId = s.request.target.id,
    subject = s.actor.principal.subject;
  s.store.lock = () => {
    (s.request.target as { id: string }).id = randomUUID();
    (s.request.payload as { customerId: string }).customerId = randomUUID();
    (s.actor.principal as { subject: string }).subject = randomUUID();
    return Promise.resolve();
  };
  await s.service.record(s.request, s.actor, s.transaction);
  const stored = s.records.get(originalId)!;
  assert.equal(stored.customerId, input.customerId);
  assert.equal(stored.subject, subject);
});
void test('wrong command/version/target/preconditions cannot reach evidence persistence', async () => {
  for (const changed of [
    { command: 'IssueInvoice' },
    { contract_version: 2 },
    { target: { kind: 'invoice', id: randomUUID() } },
    { preconditions: { state: 'ISSUED' } },
  ]) {
    const s = setup();
    await assert.rejects(
      s.service.record({ ...s.request, ...changed }, s.actor, s.transaction),
      guard('GUARD_INVARIANT'),
    );
    assert.equal(s.records.size, 0);
  }
});
