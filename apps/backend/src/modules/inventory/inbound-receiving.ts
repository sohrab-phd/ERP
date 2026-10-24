import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import {
  BusinessRejection,
  TechnicalError,
  canonicalJson,
  freezeJson,
  parseBoundedJson,
  validateContext,
  validUnicode,
  validUuid,
  type GuardRejection,
  type JsonObject,
  type TransactionContext,
} from '@navard/shared-kernel';
import type { InventoryStore, PostingContext, PostingEffect, Unit } from './contracts.js';
import type { InventoryPostingService } from './posting-service.js';
import type { ReceiptMaterialType } from './receipt.js';
import { Kg } from './quantity.js';

export const INBOUND_CLASSIFICATION_PROFILE = 'FACTORY_MATERIAL_V1';
export const INBOUND_WEIGHT_BASIS = 'WH_ACCEPTED_DECLARED_UNIT_WEIGHT';

/** These are explicit known factory terms, never an unknown-type fallback. */
export function resolveInboundMaterialType(label: string): ReceiptMaterialType {
  const terms: Readonly<Record<string, ReceiptMaterialType>> = {
    COIL: 'COIL',
    Coil: 'COIL',
    coil: 'COIL',
    رول: 'COIL',
    کویل: 'COIL',
    SHEET: 'SHEET',
    Sheet: 'SHEET',
    sheet: 'SHEET',
    ورق: 'SHEET',
    ANGLE: 'ANGLE',
    Angle: 'ANGLE',
    angle: 'ANGLE',
    نبشی: 'ANGLE',
    BEAM: 'BEAM',
    Beam: 'BEAM',
    beam: 'BEAM',
    تیرآهن: 'BEAM',
  };
  const type = Object.hasOwn(terms, label) ? terms[label] : undefined;
  if (!type)
    throw new BusinessRejection({
      family: 'GUARD_INVARIANT',
      message: 'Material Type has no supported Inventory classification',
    });
  return type;
}

export interface InboundReceivingSource {
  readonly receivedUnitId: string;
  readonly arrivalId: string;
  readonly internalSystemCode: string;
  readonly productNumber: string;
  readonly acceptedUnitWeightKg: string;
  readonly materialTypeId: string;
  readonly materialTypeLabel: string;
  readonly technicalType: ReceiptMaterialType;
  readonly locationId: string;
}
export interface InboundReceivingOrigin extends InboundReceivingSource {
  readonly lotId: string;
  readonly unitId: string;
  readonly materialId: string;
  readonly effectId: string;
  readonly type: ReceiptMaterialType;
  readonly weightBasis: typeof INBOUND_WEIGHT_BASIS;
  readonly classificationProfile: typeof INBOUND_CLASSIFICATION_PROFILE;
}
/** Procurement publishes exact already-inserted immutable sources on the same transaction. */
export interface InboundReceivingSourcePort {
  source(
    context: PostingContext,
    receivedUnitId: string,
  ): Promise<InboundReceivingSource | undefined>;
}
export interface InventoryInboundReceivingStore {
  create(context: PostingContext, origin: InboundReceivingOrigin): Promise<void>;
}
export interface InventoryInboundReceivingPolicy {
  canReceive(
    context: PostingContext,
    arrivalId: string,
    sources: readonly InboundReceivingSource[],
  ): Promise<boolean>;
}
interface Admission {
  readonly actor: PostingContext['actor'];
  readonly requestBinding: string;
  readonly arrivalId: string;
  readonly sources: readonly InboundReceivingSource[];
  readonly effectBindings: ReadonlyMap<string, string>;
}
function reject(
  family: 'GUARD_ACTOR' | 'GUARD_INVARIANT' | 'GUARD_CONFLICT',
  message: string,
): never {
  throw new BusinessRejection({ family, message });
}
function boundedText(value: unknown): asserts value is string {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    !validUnicode(value) ||
    /[\u0000-\u001f\u007f-\u009f]/u.test(value) ||
    [...value].length > 128 ||
    Buffer.byteLength(value, 'utf8') > 512
  )
    reject('GUARD_INVARIANT', 'Invalid received unit text');
}
function snapshot(context: PostingContext): PostingContext {
  validateContext(context.actor);
  const actor =
    Object.isFrozen(context.actor) && Object.isFrozen(context.actor.principal)
      ? context.actor
      : Object.freeze({
          ...context.actor,
          principal: Object.freeze({ ...context.actor.principal }),
        });
  const request = freezeJson(
    parseBoundedJson(canonicalJson(context.request as unknown as JsonObject)),
  ) as unknown as PostingContext['request'];
  return Object.freeze({ actor, request, transaction: context.transaction });
}
function sourceSnapshot(source: InboundReceivingSource, arrivalId: string): InboundReceivingSource {
  if (
    !source ||
    typeof source !== 'object' ||
    Array.isArray(source) ||
    Object.keys(source).some(
      (k) =>
        ![
          'receivedUnitId',
          'arrivalId',
          'internalSystemCode',
          'productNumber',
          'acceptedUnitWeightKg',
          'materialTypeId',
          'materialTypeLabel',
          'technicalType',
          'locationId',
        ].includes(k),
    )
  )
    reject('GUARD_INVARIANT', 'Invalid Inventory receiving source');
  for (const id of [
    source.receivedUnitId,
    source.arrivalId,
    source.materialTypeId,
    source.locationId,
  ])
    if (!validUuid(id)) reject('GUARD_INVARIANT', 'Invalid Inventory receiving identity');
  if (source.arrivalId !== arrivalId)
    reject('GUARD_INVARIANT', 'Receiving source belongs to another arrival');
  boundedText(source.internalSystemCode);
  boundedText(source.productNumber);
  boundedText(source.materialTypeLabel);
  if (
    typeof source.acceptedUnitWeightKg !== 'string' ||
    !/^[1-9][0-9]{0,19}$/u.test(source.acceptedUnitWeightKg) ||
    Kg.parse(source.acceptedUnitWeightKg).compare(Kg.zero()) <= 0
  )
    reject('GUARD_INVARIANT', 'Received W1 must be positive exact whole kg');
  if (resolveInboundMaterialType(source.materialTypeLabel) !== source.technicalType)
    reject('GUARD_INVARIANT', 'Received material classification does not match its source');
  return Object.freeze({ ...source });
}
/** A sibling owner port, not a synthetic PostGoodsReceipt or alternate stock writer. */
export class InventoryInboundReceivingService {
  private readonly admissions = new WeakMap<TransactionContext, Admission>();
  constructor(
    private readonly store: InventoryInboundReceivingStore,
    private readonly inventory: InventoryStore,
    private readonly posting: Pick<InventoryPostingService, 'post'>,
    private readonly sourcePort: InboundReceivingSourcePort,
    private readonly policy: InventoryInboundReceivingPolicy,
  ) {}
  private async authorize(
    context: PostingContext,
    arrivalId: string,
    sources: readonly InboundReceivingSource[],
  ): Promise<void> {
    validateContext(context.actor);
    if (
      context.actor.actorRole !== 'ACT-WH' ||
      (context.actor.customerScope ?? '') !== '' ||
      context.actor.temporary === true ||
      !(await this.policy.canReceive(context, arrivalId, sources))
    )
      reject('GUARD_ACTOR', 'Current organizational warehouse receiving authority required');
  }
  async receiveMany(
    supplied: PostingContext,
    arrivalId: string,
    values: readonly InboundReceivingSource[],
  ): Promise<readonly InboundReceivingOrigin[]> {
    const context = snapshot(supplied);
    if (
      !validUuid(arrivalId) ||
      context.request.command !== 'ConfirmPurchaseReceiving' ||
      context.request.contract_version !== 1 ||
      context.request.target.kind !== 'inbound-arrival' ||
      context.request.target.id !== arrivalId ||
      !Array.isArray(values) ||
      values.length === 0
    )
      reject('GUARD_INVARIANT', 'Receiving requires the exact original arrival command');
    const sources = Object.freeze(
      (values as readonly InboundReceivingSource[]).map((value) =>
        sourceSnapshot(value, arrivalId),
      ),
    );
    if (
      new Set(sources.map((s) => s.receivedUnitId)).size !== sources.length ||
      new Set(sources.map((s) => s.internalSystemCode)).size !== sources.length
    )
      reject('GUARD_INVARIANT', 'Received physical unit identities must be independent');
    await this.authorize(context, arrivalId, sources);
    for (const source of sources) {
      const persisted = await this.sourcePort.source(context, source.receivedUnitId);
      if (
        !persisted ||
        !canonicalJson(source as unknown as JsonObject).equals(
          canonicalJson(persisted as unknown as JsonObject),
        )
      )
        reject('GUARD_CONFLICT', 'Inventory requires the exact persisted receiving source');
    }
    const origins: readonly InboundReceivingOrigin[] = Object.freeze(
      sources.map((source) =>
        Object.freeze({
          ...source,
          lotId: randomUUID(),
          unitId: randomUUID(),
          materialId: randomUUID(),
          effectId: randomUUID(),
          type: source.technicalType,
          weightBasis: INBOUND_WEIGHT_BASIS,
          classificationProfile: INBOUND_CLASSIFICATION_PROFILE,
        }),
      ),
    );
    const effects: readonly PostingEffect[] = Object.freeze(
      origins.map((origin) =>
        Object.freeze({
          type: 'STOCK_IN' as const,
          unitId: origin.unitId,
          kg: origin.acceptedUnitWeightKg,
          source: Object.freeze({ factId: origin.receivedUnitId, effectId: origin.effectId }),
          create: Object.freeze({
            lotId: origin.lotId,
            kind: origin.type,
            locationId: origin.locationId,
            customerScope: '',
          }),
        }),
      ),
    );
    await this.inventory.lock(
      context,
      origins.map((o) => o.unitId).sort(),
      origins.map((o) => o.effectId).sort(),
    );
    await this.authorize(context, arrivalId, sources);
    if (this.admissions.has(context.transaction)) throw new TechnicalError('incompatible');
    this.admissions.set(
      context.transaction,
      Object.freeze({
        actor: context.actor,
        requestBinding: canonicalJson(context.request as unknown as JsonObject).toString('utf8'),
        arrivalId,
        sources,
        effectBindings: new Map(
          effects.map((effect) => [
            effect.source.effectId,
            canonicalJson(effect as unknown as JsonObject).toString('utf8'),
          ]),
        ),
      }),
    );
    try {
      // All IDs are prelocked; every invocation uses the original caller-owned transaction.
      for (let offset = 0; offset < effects.length; offset += 128)
        await this.posting.post(context, effects.slice(offset, offset + 128));
      for (const origin of origins) await this.store.create(context, origin);
      await this.authorize(context, arrivalId, sources);
      return origins;
    } finally {
      this.admissions.delete(context.transaction);
    }
  }
  private admission(context: PostingContext, effect: PostingEffect): Admission | undefined {
    const value = this.admissions.get(context.transaction);
    if (
      !value ||
      value.actor !== context.actor ||
      value.requestBinding !==
        canonicalJson(context.request as unknown as JsonObject).toString('utf8') ||
      value.effectBindings.get(effect.source.effectId) !==
        canonicalJson(effect as unknown as JsonObject).toString('utf8')
    )
      return undefined;
    return value;
  }
  async validateEffect(
    context: PostingContext,
    effect: PostingEffect,
    unit: Unit | undefined,
  ): Promise<GuardRejection | undefined> {
    const value = this.admission(context, effect);
    if (!value || effect.type !== 'STOCK_IN' || unit !== undefined)
      return {
        family: 'GUARD_CONFLICT',
        message: 'Effect is outside the admitted receiving bundle',
      };
    await this.authorize(context, value.arrivalId, value.sources);
    return undefined;
  }
  async visibleForEffect(
    context: PostingContext,
    effect: PostingEffect,
    unit: Unit,
  ): Promise<boolean> {
    const value = this.admission(context, effect);
    if (!value || unit.customerScope !== '') return false;
    await this.authorize(context, value.arrivalId, value.sources);
    return true;
  }
}
