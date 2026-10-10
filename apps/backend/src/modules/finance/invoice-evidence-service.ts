import { Buffer } from 'node:buffer';
import {
  BusinessRejection,
  canonicalJson,
  freezeJson,
  parseBoundedJson,
  validateContext,
  validIdempotencyKey,
  validUnicode,
  validUuid,
  type CommandContract,
  type CommandDecision,
  type CommandRequest,
  type ExecutionContext,
  type JsonObject,
  type TransactionContext,
} from '@navard/shared-kernel';
import type {
  InvoiceEvidence,
  InvoiceEvidenceContext,
  InvoiceEvidenceInput,
  InvoiceEvidenceStore,
  InvoiceSalesPort,
  InvoiceEvidencePolicy,
} from './contracts.js';

const fields = ['invoiceDocumentReference', 'issueDate', 'salesOrderId', 'customerId'];
function invalid(message: string): never {
  throw new BusinessRejection({ family: 'GUARD_INVARIANT', message });
}
export function parseInvoiceEvidence(payload: JsonObject): InvoiceEvidenceInput {
  if (Object.keys(payload).some((name) => !fields.includes(name)))
    invalid('Unexpected invoice evidence field');
  const { invoiceDocumentReference, issueDate, salesOrderId, customerId } = payload;
  if (
    typeof invoiceDocumentReference !== 'string' ||
    !invoiceDocumentReference.trim() ||
    !validUnicode(invoiceDocumentReference) ||
    /\p{Cc}/u.test(invoiceDocumentReference) ||
    Buffer.byteLength(invoiceDocumentReference, 'utf8') > 128
  )
    invalid('Invalid invoice reference');
  if (
    typeof issueDate !== 'string' ||
    !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u.test(issueDate) ||
    issueDate.startsWith('0000')
  )
    invalid('Invalid invoice issue date');
  const date = new Date(issueDate + 'T00:00:00.000Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== issueDate)
    invalid('Invalid invoice issue date');
  if (!validUuid(salesOrderId) || !validUuid(customerId)) invalid('Invalid Sales reference');
  return Object.freeze({ invoiceDocumentReference, issueDate, salesOrderId, customerId });
}
function snapshot(supplied: InvoiceEvidenceContext): InvoiceEvidenceContext {
  validateContext(supplied.actor);
  return Object.freeze({
    actor:
      Object.isFrozen(supplied.actor) && Object.isFrozen(supplied.actor.principal)
        ? supplied.actor
        : Object.freeze({
            ...supplied.actor,
            principal: Object.freeze({ ...supplied.actor.principal }),
          }),
    transaction: supplied.transaction,
    request: Object.freeze({
      ...supplied.request,
      target: Object.freeze({ ...supplied.request.target }),
      payload: freezeJson(parseBoundedJson(canonicalJson(supplied.request.payload))) as JsonObject,
      preconditions: freezeJson(
        parseBoundedJson(canonicalJson(supplied.request.preconditions)),
      ) as JsonObject,
    }),
  });
}
/** Immutable documentary evidence; no monetary invoice/payment state or foreign write port. */
export class InvoiceEvidenceService {
  constructor(
    private readonly store: InvoiceEvidenceStore,
    private readonly sales: InvoiceSalesPort,
    private readonly policy: InvoiceEvidencePolicy,
  ) {}
  contracts(): CommandContract[] {
    return [
      {
        command: 'RecordIssuedInvoiceEvidence',
        version: 1,
        active: true,
        payloadShape: Object.fromEntries(fields.map((name) => [name, { type: 'scalar' as const }])),
        preconditionsShape: {},
        execute: (request, actor, tx) => this.record(request, actor, tx),
      },
    ];
  }
  private async requireCurrent(ctx: InvoiceEvidenceContext, write: boolean) {
    if (
      !(write ? ['ACT-SALES'] : ['ACT-SALES', 'ACT-FIN']).includes(ctx.actor.actorRole) ||
      ctx.actor.customerScope !== undefined ||
      ctx.actor.temporary === true ||
      !(await this.policy.current(ctx))
    )
      throw new BusinessRejection({
        family: 'GUARD_ACTOR',
        message: 'Current organizational invoice evidence permission required',
      });
  }
  async record(
    request: CommandRequest,
    actor: ExecutionContext,
    transaction: TransactionContext,
  ): Promise<CommandDecision> {
    const ctx = snapshot({ request, actor, transaction });
    const r = ctx.request;
    if (
      r.command !== 'RecordIssuedInvoiceEvidence' ||
      r.contract_version !== 1 ||
      r.target.kind !== 'invoice-evidence' ||
      !validUuid(r.target.id) ||
      !validIdempotencyKey(r.idempotency_key) ||
      Object.keys(r.preconditions).length
    )
      invalid('Invalid invoice evidence command');
    const input = parseInvoiceEvidence(r.payload);
    const binding = canonicalJson(input as unknown as JsonObject).toString('utf8');
    await this.requireCurrent(ctx, true);
    await this.store.lock(ctx, r.target.id);
    await this.requireCurrent(ctx, true);
    const previous = await this.store.evidence(ctx, r.target.id);
    if (previous)
      throw new BusinessRejection({
        family: previous.binding === binding ? 'GUARD_IDEMPOTENT_DUP' : 'GUARD_CONFLICT',
        message:
          previous.binding === binding
            ? 'Invoice evidence already recorded'
            : 'Invoice evidence identity is bound to different facts',
      });
    const reference = await this.sales.reference(ctx, input.salesOrderId, input.customerId);
    if (
      !reference ||
      reference.id !== input.salesOrderId ||
      reference.customerId !== input.customerId
    )
      throw new BusinessRejection({
        family: 'GUARD_STATE',
        message: 'Matching Sales order and customer required',
      });
    await this.requireCurrent(ctx, true);
    await this.store.record(ctx, r.target.id, binding, input);
    return {
      outcome: 'accepted',
      factIdentity: r.target.id,
      event: 'IssuedInvoiceEvidenceRecorded',
      data: { evidenceId: r.target.id },
    };
  }
  async get(
    supplied: InvoiceEvidenceContext,
    id: string,
  ): Promise<Readonly<Omit<InvoiceEvidence, 'binding'>> | undefined> {
    const ctx = snapshot(supplied);
    if (!validUuid(id)) invalid('Invalid invoice evidence query');
    await this.requireCurrent(ctx, false);
    const value = await this.store.evidence(ctx, id);
    await this.requireCurrent(ctx, false);
    if (!value) return undefined;
    return Object.freeze(
      Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'binding')),
    ) as Readonly<Omit<InvoiceEvidence, 'binding'>>;
  }
}
