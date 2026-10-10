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
  CompletedPurchase,
  CompletedPurchaseInput,
  PurchaseContext,
  PurchasePolicy,
  PurchaseProformaInput,
  PurchaseProforma,
  PurchaseStore,
} from './purchase-contracts.js';

const purchaseFields = [
  'purchaseDocumentReference',
  'supplierReference',
  'purchaseDate',
  'materialDescription',
];
const proformaFields = ['purchaseId', 'proformaReference', 'sentDate'];
function invalid(message: string): never {
  throw new BusinessRejection({ family: 'GUARD_INVARIANT', message });
}
function text(value: unknown, limit = 128): asserts value is string {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    !validUnicode(value) ||
    /\p{Cc}/u.test(value) ||
    Buffer.byteLength(value, 'utf8') > limit
  )
    invalid('Invalid purchasing text');
}
function date(value: unknown): asserts value is string {
  if (
    typeof value !== 'string' ||
    !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u.test(value) ||
    value.startsWith('0000')
  )
    invalid('Invalid purchasing date');
  const parsed = new Date(value + 'T00:00:00.000Z');
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value)
    invalid('Invalid purchasing date');
}
export function parseCompletedPurchase(payload: JsonObject): CompletedPurchaseInput {
  if (Object.keys(payload).some((name) => !purchaseFields.includes(name)))
    invalid('Unexpected purchase field');
  const { purchaseDocumentReference, supplierReference, purchaseDate, materialDescription } =
    payload;
  text(purchaseDocumentReference);
  text(supplierReference);
  date(purchaseDate);
  text(materialDescription, 512);
  return Object.freeze({
    purchaseDocumentReference,
    supplierReference,
    purchaseDate,
    materialDescription,
  });
}
export function parsePurchaseProforma(payload: JsonObject): PurchaseProformaInput {
  if (Object.keys(payload).some((name) => !proformaFields.includes(name)))
    invalid('Unexpected proforma field');
  const { purchaseId, proformaReference, sentDate } = payload;
  if (!validUuid(purchaseId)) invalid('Invalid purchase reference');
  text(proformaReference);
  date(sentDate);
  return Object.freeze({ purchaseId, proformaReference, sentDate });
}
function snapshot(supplied: PurchaseContext): PurchaseContext {
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
/** Documentary evidence only: no supplier approval, payment, transmission or stock port. */
export class PurchaseService {
  constructor(
    private readonly store: PurchaseStore,
    private readonly policy: PurchasePolicy,
  ) {}
  contracts(): CommandContract[] {
    return ['RecordCompletedPurchase', 'RecordPurchaseProformaSent'].map((command) => ({
      command,
      version: 1,
      active: true,
      payloadShape: Object.fromEntries(
        (command === 'RecordCompletedPurchase' ? purchaseFields : proformaFields).map((name) => [
          name,
          { type: 'scalar' as const },
        ]),
      ),
      preconditionsShape: {},
      execute: (request, actor, transaction) => this.record(request, actor, transaction),
    }));
  }
  private async requireCurrent(ctx: PurchaseContext) {
    if (
      ctx.actor.actorRole !== 'ACT-PROC' ||
      ctx.actor.customerScope !== undefined ||
      ctx.actor.temporary === true ||
      !(await this.policy.current(ctx))
    )
      throw new BusinessRejection({
        family: 'GUARD_ACTOR',
        message: 'Current organizational purchasing permission required',
      });
  }
  async record(
    request: CommandRequest,
    actor: ExecutionContext,
    transaction: TransactionContext,
  ): Promise<CommandDecision> {
    const ctx = snapshot({ request, actor, transaction });
    const r = ctx.request;
    const purchase = r.command === 'RecordCompletedPurchase';
    if (
      (!purchase && r.command !== 'RecordPurchaseProformaSent') ||
      r.contract_version !== 1 ||
      r.target.kind !== (purchase ? 'purchase-record' : 'purchase-proforma') ||
      !validUuid(r.target.id) ||
      !validIdempotencyKey(r.idempotency_key) ||
      Object.keys(r.preconditions).length
    )
      invalid('Invalid purchasing command');
    const input = purchase ? parseCompletedPurchase(r.payload) : parsePurchaseProforma(r.payload);
    const binding = canonicalJson(input as unknown as JsonObject).toString('utf8');
    await this.requireCurrent(ctx);
    await this.store.lock(ctx, purchase ? 'purchase-record' : 'purchase-proforma', r.target.id);
    await this.requireCurrent(ctx);
    const previous = purchase
      ? await this.store.purchase(ctx, r.target.id)
      : await this.store.proforma(ctx, r.target.id);
    if (previous)
      throw new BusinessRejection({
        family: previous.binding === binding ? 'GUARD_IDEMPOTENT_DUP' : 'GUARD_CONFLICT',
        message:
          previous.binding === binding
            ? 'Purchasing evidence already recorded'
            : 'Purchasing evidence identity is bound to different facts',
      });
    if (purchase)
      await this.store.recordPurchase(ctx, r.target.id, binding, input as CompletedPurchaseInput);
    else {
      const proforma = input as PurchaseProformaInput;
      if (!(await this.store.purchase(ctx, proforma.purchaseId)))
        throw new BusinessRejection({
          family: 'GUARD_STATE',
          message: 'Recorded purchase required for this proforma evidence',
        });
      await this.store.recordProforma(ctx, r.target.id, binding, proforma);
    }
    return {
      outcome: 'accepted',
      factIdentity: r.target.id,
      event: purchase ? 'CompletedPurchaseRecorded' : 'PurchaseProformaSentRecorded',
      data: purchase
        ? { purchaseId: r.target.id }
        : { proformaId: r.target.id, purchaseId: (input as PurchaseProformaInput).purchaseId },
    };
  }
  async get(
    supplied: PurchaseContext,
    kind: 'GetCompletedPurchase' | 'GetPurchaseProforma',
    id: string,
  ) {
    const ctx = snapshot(supplied);
    if (!validUuid(id) || !['GetCompletedPurchase', 'GetPurchaseProforma'].includes(kind))
      invalid('Invalid purchasing query');
    await this.requireCurrent(ctx);
    const record =
      kind === 'GetCompletedPurchase'
        ? await this.store.purchase(ctx, id)
        : await this.store.proforma(ctx, id);
    if (!record) return undefined;
    return Object.freeze(
      Object.fromEntries(Object.entries(record).filter(([key]) => key !== 'binding')),
    ) as Readonly<Omit<CompletedPurchase, 'binding'> | Omit<PurchaseProforma, 'binding'>>;
  }
}
