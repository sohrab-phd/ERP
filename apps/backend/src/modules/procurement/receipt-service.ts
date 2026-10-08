import { Buffer } from 'node:buffer';
import {
  BusinessRejection,
  TechnicalError,
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
  type GuardFamily,
  type JsonObject,
  type TransactionContext,
} from '@navard/shared-kernel';
import {
  receiptTypes,
  type InventoryReceiptPort,
  type ReceiptContext,
  type ReceiptInput,
  type ReceiptPolicy,
  type ReceiptRecord,
  type ReceiptStore,
  type ReceiptType,
} from './contracts.js';

const inputNames = ['internalCode', 'count', 'measuredKg', 'type', 'locationId', 'productCode'];
function reject(family: GuardFamily, message: string, openItem?: string): never {
  throw new BusinessRejection({ family, message, ...(openItem ? { openItem } : {}) });
}
function text(value: unknown): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    !validUnicode(value) ||
    /[\u0000-\u001f\u007f]/u.test(value) ||
    Buffer.byteLength(value, 'utf8') > 128
  )
    reject('GUARD_INVARIANT', 'Invalid receipt text');
}
/** Exact whole-kg measurement and descriptive count; never coerce either through Number. */
export function parseReceiptInput(payload: JsonObject): ReceiptInput {
  if (Object.keys(payload).some((name) => !inputNames.includes(name)))
    reject('GUARD_INVARIANT', 'Unexpected receipt field');
  const { internalCode, count, measuredKg, type, locationId, productCode } = payload;
  text(internalCode);
  if (typeof count !== 'string' || !/^(?:0|[1-9][0-9]{0,19})$/u.test(count))
    reject('GUARD_INVARIANT', 'Count must be a descriptive nonnegative integer string');
  if (typeof measuredKg !== 'string' || !/^[1-9][0-9]{0,19}$/u.test(measuredKg))
    reject('GUARD_INVARIANT', 'Measured kg must be a positive whole-kg string');
  if (typeof type !== 'string' || !receiptTypes.includes(type as ReceiptType))
    reject('GUARD_INVARIANT', 'Invalid intake type');
  if (!validUuid(locationId)) reject('GUARD_INVARIANT', 'Invalid intake location');
  if (type === 'SHEET' || productCode !== undefined) text(productCode);
  return Object.freeze({
    internalCode,
    count,
    measuredKg,
    type: type as ReceiptType,
    locationId,
    ...(productCode !== undefined ? { productCode } : {}),
  });
}

function snapshot(supplied: ReceiptContext): ReceiptContext {
  validateContext(supplied.actor);
  const actor =
    Object.isFrozen(supplied.actor) && Object.isFrozen(supplied.actor.principal)
      ? supplied.actor
      : Object.freeze({
          ...supplied.actor,
          principal: Object.freeze({ ...supplied.actor.principal }),
        });
  const request = supplied.request;
  return Object.freeze({
    actor,
    transaction: supplied.transaction,
    request: Object.freeze({
      command: request.command,
      contract_version: request.contract_version,
      idempotency_key: request.idempotency_key,
      target: Object.freeze({ ...request.target }),
      payload: freezeJson(parseBoundedJson(canonicalJson(request.payload))) as JsonObject,
      preconditions: freezeJson(
        parseBoundedJson(canonicalJson(request.preconditions)),
      ) as JsonObject,
    }),
  });
}

export class ReceiptService {
  constructor(
    private readonly store: ReceiptStore,
    private readonly inventory: InventoryReceiptPort,
    private readonly policy: ReceiptPolicy,
  ) {}

  contract(): CommandContract {
    return {
      command: 'PostGoodsReceipt',
      version: 1,
      active: true,
      payloadShape: Object.fromEntries(
        inputNames.map((name) => [name, { type: 'scalar' as const }]),
      ),
      preconditionsShape: {},
      execute: (request, actor, transaction) => this.post(request, actor, transaction),
    };
  }

  private async requirePosting(context: ReceiptContext): Promise<void> {
    if (
      context.actor.actorRole !== 'ACT-WH' ||
      context.actor.customerScope !== undefined ||
      context.actor.temporary === true
    )
      reject('GUARD_ACTOR', 'Warehouse receiving permission required');
    if (!this.policy.canPost)
      reject('GUARD_OPEN_POLICY', 'Receiving authority policy unavailable', 'OQ-019');
    if (!(await this.policy.canPost(context)))
      reject('GUARD_ACTOR', 'Current warehouse receiving permission required');
  }

  async post(
    request: CommandRequest,
    actor: ExecutionContext,
    transaction: TransactionContext,
  ): Promise<CommandDecision> {
    const context = snapshot({ actor, request, transaction });
    const admitted = context.request;
    if (
      admitted.command !== 'PostGoodsReceipt' ||
      admitted.contract_version !== 1 ||
      admitted.target.kind !== 'goods-receipt' ||
      !validUuid(admitted.target.id) ||
      !validIdempotencyKey(admitted.idempotency_key) ||
      Object.keys(admitted.preconditions).length !== 0
    )
      reject('GUARD_INVARIANT', 'Invalid receipt command');
    const input = parseReceiptInput(admitted.payload);
    const binding = canonicalJson(input as unknown as JsonObject).toString('utf8');
    await this.requirePosting(context);
    const id = admitted.target.id;
    await this.store.lock(context, id);
    await this.requirePosting(context);
    const previous = await this.store.find(context, id);
    if (previous) {
      if (previous.binding !== binding)
        reject('GUARD_CONFLICT', 'Receipt identity is already bound to different intake');
      if (previous.state !== 'POSTED') throw new TechnicalError('incompatible');
      reject('GUARD_IDEMPOTENT_DUP', 'Receipt has already been posted');
    }
    await this.store.create(context, { ...input, id, binding, state: 'DRAFT' });
    if (!(await this.store.changeState(context, id, 'DRAFT', 'RECEIVED')))
      throw new TechnicalError('incompatible');
    const stock = await this.inventory.receive(context, id, input);
    if (
      !validUuid(stock.lotId) ||
      !validUuid(stock.unitId) ||
      !validUuid(stock.materialId) ||
      !validUuid(stock.effectId)
    )
      throw new TechnicalError('incompatible');
    if (!(await this.store.finish(context, id, stock))) throw new TechnicalError('incompatible');
    return {
      outcome: 'accepted',
      factIdentity: id,
      sourceState: 'DRAFT',
      targetState: 'POSTED',
      event: 'GoodsReceiptPosted',
      data: { receiptId: id, ...stock, measuredKg: input.measuredKg, state: 'POSTED' },
    };
  }

  async get(supplied: ReceiptContext, id: string): Promise<ReceiptRecord | undefined> {
    const context = snapshot(supplied);
    if (!validUuid(id)) reject('GUARD_INVARIANT', 'Invalid receipt identity');
    if (!(await this.policy.canRead(context))) reject('GUARD_ACTOR', 'Receipt read access denied');
    const record = await this.store.find(context, id);
    return record === undefined ? undefined : Object.freeze({ ...record });
  }
}
