import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import {
  BusinessRejection,
  canonicalJson,
  freezeJson,
  parseBoundedJson,
  validateContext,
  validUnicode,
  validUuid,
  type JsonObject,
} from '@navard/shared-kernel';
import type { PostingContext, Quantities } from './contracts.js';
import type { InventoryPostingService } from './posting-service.js';
import { Kg } from './quantity.js';

export type ReceiptMaterialType = 'COIL' | 'SHEET' | 'ANGLE' | 'BEAM' | 'OTHER';
export interface ReceiptInput {
  internalCode: string;
  count: string;
  measuredKg: string;
  type: ReceiptMaterialType;
  locationId: string;
  productCode?: string;
}
export interface ReceiptStockIds {
  lotId: string;
  unitId: string;
  materialId: string;
  effectId: string;
}
export interface ReceiptOrigin extends ReceiptInput, ReceiptStockIds {
  receiptId: string;
}
export interface ReceiptStockView extends ReceiptOrigin {
  quantities: Quantities & { available: string };
}
export interface InventoryReceiptPolicy {
  canRead(context: PostingContext): Promise<boolean>;
  canReceive(context: PostingContext): Promise<boolean>;
}
export interface InventoryReceiptStore {
  lockProductCode(context: PostingContext, code: string): Promise<void>;
  productCodeExists(context: PostingContext, code: string): Promise<boolean>;
  create(context: PostingContext, origin: ReceiptOrigin): Promise<void>;
  byUnit(context: PostingContext, id: string): Promise<ReceiptOrigin | undefined>;
  byLot(context: PostingContext, id: string): Promise<ReceiptOrigin | undefined>;
}

function invalid(message = 'Invalid receipt intake data'): never {
  throw new BusinessRejection({ family: 'GUARD_INVARIANT', message });
}
function identity(value: unknown): asserts value is string {
  if (!validUuid(value)) invalid('Invalid receipt inventory identity');
}
function boundedText(value: unknown): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.trim().length === 0 ||
    !validUnicode(value) ||
    /[\u0000-\u001f\u007f]/u.test(value) ||
    Buffer.byteLength(value, 'utf8') > 128
  )
    invalid();
}
function whole(value: unknown, positive: boolean): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.length > 20 ||
    !/^(?:0|[1-9][0-9]*)$/u.test(value) ||
    value.includes('\n') ||
    (positive && value === '0')
  )
    invalid();
}
function intake(supplied: ReceiptInput): Readonly<ReceiptInput> {
  if (
    !supplied ||
    typeof supplied !== 'object' ||
    Array.isArray(supplied) ||
    Object.keys(supplied).some(
      (key) =>
        !['internalCode', 'count', 'measuredKg', 'type', 'locationId', 'productCode'].includes(key),
    )
  )
    invalid();
  boundedText(supplied.internalCode);
  whole(supplied.count, false);
  whole(supplied.measuredKg, true);
  identity(supplied.locationId);
  if (!['COIL', 'SHEET', 'ANGLE', 'BEAM', 'OTHER'].includes(supplied.type)) invalid();
  if (supplied.type === 'SHEET' || supplied.productCode !== undefined)
    boundedText(supplied.productCode);
  return Object.freeze({
    internalCode: supplied.internalCode,
    count: supplied.count,
    measuredKg: supplied.measuredKg,
    type: supplied.type,
    locationId: supplied.locationId,
    ...(supplied.productCode !== undefined ? { productCode: supplied.productCode } : {}),
  });
}
function snapshotContext(supplied: PostingContext): PostingContext {
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
      target: Object.freeze({ kind: request.target.kind, id: request.target.id }),
      payload: freezeJson(parseBoundedJson(canonicalJson(request.payload))) as JsonObject,
      preconditions: freezeJson(
        parseBoundedJson(canonicalJson(request.preconditions)),
      ) as JsonObject,
    }),
  });
}

/** Inventory owns Lot origins; every quantity change remains an IPS effect. */
export class InventoryReceiptService {
  constructor(
    private readonly store: InventoryReceiptStore,
    private readonly posting: InventoryPostingService,
    private readonly policy: InventoryReceiptPolicy = {
      canRead: () => Promise.resolve(false),
      canReceive: () => Promise.resolve(false),
    },
  ) {}

  private async authorize(
    context: PostingContext,
    operation: 'canRead' | 'canReceive',
  ): Promise<void> {
    if (!(await this.policy[operation](context)))
      throw new BusinessRejection({
        family: 'GUARD_ACTOR',
        message: 'Receipt inventory access denied',
      });
  }

  async receive(
    suppliedContext: PostingContext,
    receiptId: string,
    suppliedInput: ReceiptInput,
  ): Promise<ReceiptStockIds> {
    const context = snapshotContext(suppliedContext);
    if (context.request.command !== 'PostGoodsReceipt')
      invalid('Receipt stock requires its owning command');
    identity(receiptId);
    const input = intake(suppliedInput);
    await this.authorize(context, 'canReceive');
    if (input.type === 'SHEET') {
      await this.store.lockProductCode(context, input.productCode!);
      await this.authorize(context, 'canReceive');
      if (await this.store.productCodeExists(context, input.productCode!))
        throw new BusinessRejection({
          family: 'GUARD_CONFLICT',
          message: 'Standalone Sheet product code already exists',
        });
    }
    const stockIds: ReceiptStockIds = Object.freeze({
      lotId: randomUUID(),
      unitId: randomUUID(),
      materialId: randomUUID(),
      effectId: randomUUID(),
    });
    await this.posting.post(context, [
      {
        type: 'STOCK_IN',
        source: { factId: receiptId, effectId: stockIds.effectId },
        unitId: stockIds.unitId,
        kg: input.measuredKg,
        create: {
          lotId: stockIds.lotId,
          kind: input.type,
          locationId: input.locationId,
          customerScope: '',
        },
      },
    ]);
    await this.store.create(context, { ...input, ...stockIds, receiptId });
    return stockIds;
  }

  async details(
    suppliedContext: PostingContext,
    unitId: string,
  ): Promise<ReceiptStockView | undefined> {
    const context = snapshotContext(suppliedContext);
    identity(unitId);
    await this.authorize(context, 'canRead');
    const origin = await this.store.byUnit(context, unitId);
    await this.authorize(context, 'canRead');
    if (!origin) return undefined;
    return this.view(context, origin);
  }

  async lot(suppliedContext: PostingContext, lotId: string): Promise<ReceiptStockView | undefined> {
    const context = snapshotContext(suppliedContext);
    identity(lotId);
    await this.authorize(context, 'canRead');
    const origin = await this.store.byLot(context, lotId);
    await this.authorize(context, 'canRead');
    if (!origin) return undefined;
    return this.view(context, origin);
  }

  private async view(context: PostingContext, origin: ReceiptOrigin): Promise<ReceiptStockView> {
    const quantities = await this.posting.snapshot(context, origin.unitId);
    await this.authorize(context, 'canRead');
    return {
      ...origin,
      quantities: {
        ...quantities,
        available: Kg.parse(quantities.onHand).subtract(Kg.parse(quantities.reserved)).toString(),
      },
    };
  }
}
