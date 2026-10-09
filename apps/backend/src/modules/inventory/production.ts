import { createHash } from 'node:crypto';
import {
  BusinessRejection,
  TechnicalError,
  canonicalJson,
  freezeJson,
  parseBoundedJson,
  validateContext,
  validUuid,
  validUnicode,
  type GuardRejection,
  type JsonObject,
  type TransactionContext,
} from '@navard/shared-kernel';
import type { InventoryStore, PostingContext, PostingEffect, Unit } from './contracts.js';
import type { InventoryPostingService } from './posting-service.js';
import { Kg } from './quantity.js';

export interface ProductionInput {
  readonly unitId: string;
  readonly kg: string;
  readonly factId: string;
}
export interface ProductionOutput extends ProductionInput {
  readonly lotId: string;
  readonly kind: string;
  readonly locationId: string;
  readonly disposition: 'FINAL' | 'WIP' | 'RESIDUAL';
}
export interface ProductionBatch {
  readonly productionOrderId: string;
  readonly operationId: string;
  readonly inputs: readonly ProductionInput[];
  readonly outputs: readonly ProductionOutput[];
  readonly finalizeUnitIds?: readonly string[];
}
export interface ProductionMaterial {
  readonly unitId: string;
  readonly kg: string;
  readonly kind: string;
  readonly locationId: string;
  readonly state: Unit['state'];
}
export interface ProductionIssue {
  readonly unitId: string;
  readonly productionOrderId: string;
  readonly customerId: string;
  readonly kg: string;
}
export interface ProductionOrigin extends ProductionIssue {
  readonly operationId: string;
  readonly factId: string;
  readonly lotId: string;
  readonly disposition: ProductionOutput['disposition'];
}
export interface InventoryProductionStore {
  activeIssue(context: PostingContext, unitId: string): Promise<ProductionIssue | undefined>;
  recordIssue(context: PostingContext, issue: ProductionIssue): Promise<void>;
  closeIssue(context: PostingContext, unitId: string, productionOrderId: string): Promise<void>;
  origin(context: PostingContext, unitId: string): Promise<ProductionOrigin | undefined>;
  recordOrigin(context: PostingContext, origin: ProductionOrigin): Promise<void>;
}
/** Composition combines current Identity with the Production owner's private exact admission. */
export interface InventoryProductionPolicy {
  canInspect(context: PostingContext, productionOrderId: string): Promise<boolean>;
  canIssue(
    context: PostingContext,
    productionOrderId: string,
    unitIds: readonly string[],
  ): Promise<boolean>;
  canComplete(context: PostingContext, batch: ProductionBatch): Promise<boolean>;
}
interface Admission {
  readonly actor: PostingContext['actor'];
  readonly requestBinding: string;
  readonly batch: ProductionBatch;
  readonly effects: readonly PostingEffect[];
}
function reject(
  family: 'GUARD_ACTOR' | 'GUARD_CONFLICT' | 'GUARD_STATE' | 'GUARD_INVARIANT',
  message: string,
): never {
  throw new BusinessRejection({ family, message });
}
function exact(value: object, names: readonly string[]): void {
  if (Object.keys(value).some((name) => !names.includes(name)))
    reject('GUARD_INVARIANT', 'Unexpected production inventory field');
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
function isArray(value: unknown): boolean {
  return Array.isArray(value);
}
function identifiers(ids: readonly string[], allowEmpty = false): readonly string[] {
  if (
    !isArray(ids) ||
    ids.length > 32 ||
    (!allowEmpty && ids.length === 0) ||
    ids.some((id) => !validUuid(id)) ||
    new Set(ids).size !== ids.length
  )
    reject('GUARD_INVARIANT', 'Invalid production inventory identities');
  return Object.freeze([...ids]);
}
function positive(value: string): string {
  const kg = Kg.parse(value);
  if (kg.compare(Kg.zero()) <= 0) reject('GUARD_INVARIANT', 'Production kg must be positive');
  return kg.toString();
}
function batchSnapshot(supplied: ProductionBatch): ProductionBatch {
  if (
    !supplied ||
    typeof supplied !== 'object' ||
    !isArray(supplied.inputs) ||
    !isArray(supplied.outputs) ||
    supplied.inputs.length > 32 ||
    supplied.outputs.length > 32
  )
    reject('GUARD_INVARIANT', 'Invalid production inventory batch');
  exact(supplied, ['productionOrderId', 'operationId', 'inputs', 'outputs', 'finalizeUnitIds']);
  if (!validUuid(supplied.productionOrderId) || !validUuid(supplied.operationId))
    reject('GUARD_INVARIANT', 'Invalid production inventory owner');
  const inputs = supplied.inputs.map((entry) => {
    if (!entry || typeof entry !== 'object') reject('GUARD_INVARIANT', 'Invalid consumption entry');
    exact(entry, ['unitId', 'kg', 'factId']);
    if (!validUuid(entry.factId)) reject('GUARD_INVARIANT', 'Invalid consumption fact identity');
    return Object.freeze({ unitId: entry.unitId, kg: positive(entry.kg), factId: entry.factId });
  });
  const outputs = supplied.outputs.map((entry) => {
    if (!entry || typeof entry !== 'object') reject('GUARD_INVARIANT', 'Invalid output entry');
    exact(entry, ['unitId', 'kg', 'factId', 'lotId', 'kind', 'locationId', 'disposition']);
    if (
      !validUuid(entry.factId) ||
      !validUuid(entry.lotId) ||
      !validUuid(entry.locationId) ||
      typeof entry.kind !== 'string' ||
      entry.kind.length === 0 ||
      !validUnicode(entry.kind) ||
      /[\u0000-\u001f\u007f]/u.test(entry.kind) ||
      new TextEncoder().encode(entry.kind).length > 128 ||
      !['FINAL', 'WIP', 'RESIDUAL'].includes(entry.disposition)
    )
      reject('GUARD_INVARIANT', 'Invalid production output metadata');
    return Object.freeze({
      unitId: entry.unitId,
      kg: positive(entry.kg),
      factId: entry.factId,
      lotId: entry.lotId,
      kind: entry.kind,
      locationId: entry.locationId,
      disposition: entry.disposition,
    });
  });
  identifiers(
    inputs.map((entry) => entry.unitId),
    true,
  );
  identifiers(
    outputs.map((entry) => entry.unitId),
    true,
  );
  if (outputs.length > 0 && inputs.length === 0)
    reject('GUARD_INVARIANT', 'New production stock requires actual consumption');
  const finalized = identifiers(supplied.finalizeUnitIds ?? [], true);
  const facts = [...inputs, ...outputs].map((entry) => entry.factId);
  if (new Set(facts).size !== facts.length)
    reject('GUARD_INVARIANT', 'Repeated production fact identity');
  const all = [
    ...inputs.map((entry) => entry.unitId),
    ...outputs.map((entry) => entry.unitId),
    ...finalized,
  ];
  if (all.length === 0 || new Set(all).size !== all.length)
    reject('GUARD_INVARIANT', 'Production inventory members must be nonempty and disjoint');
  return Object.freeze({
    productionOrderId: supplied.productionOrderId,
    operationId: supplied.operationId,
    inputs: Object.freeze(inputs),
    outputs: Object.freeze(outputs),
    ...(supplied.finalizeUnitIds !== undefined ? { finalizeUnitIds: finalized } : {}),
  });
}
export function productionEffectId(
  operationId: string,
  unitId: string,
  kind: 'CONSUME' | 'OUTPUT',
): string {
  const bytes = createHash('sha256')
    .update(canonicalJson({ operationId, unitId, kind }))
    .digest()
    .subarray(0, 16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}
/** Inventory's production lifecycle/stock port; Production supplies no alternate stock authority. */
export class InventoryProductionService {
  private readonly admissions = new WeakMap<TransactionContext, Admission>();
  constructor(
    private readonly store: InventoryProductionStore,
    private readonly inventory: InventoryStore,
    private readonly posting: Pick<InventoryPostingService, 'post'>,
    private readonly policy: InventoryProductionPolicy,
  ) {}
  private async authorize(
    context: PostingContext,
    orderId: string,
    operation: 'inspect' | 'issue' | 'complete',
    detail?: readonly string[] | ProductionBatch,
  ): Promise<void> {
    validateContext(context.actor);
    if (
      !validUuid(orderId) ||
      !validUuid(context.actor.customerScope) ||
      context.actor.temporary === true ||
      !(operation === 'issue'
        ? context.actor.actorRole === 'ACT-PLAN'
        : operation === 'complete'
          ? context.actor.actorRole === 'ACT-OP'
          : ['ACT-PLAN', 'ACT-OP'].includes(context.actor.actorRole))
    )
      reject('GUARD_ACTOR', 'Current customer-scoped production authority required');
    const allowed =
      operation === 'inspect'
        ? await this.policy.canInspect(context, orderId)
        : operation === 'issue'
          ? await this.policy.canIssue(context, orderId, detail as readonly string[])
          : await this.policy.canComplete(context, detail as ProductionBatch);
    if (!allowed) reject('GUARD_ACTOR', 'Production owner admission denied');
  }
  private async material(
    context: PostingContext,
    orderId: string,
    id: string,
    requireIssued: boolean,
  ): Promise<ProductionMaterial> {
    const unit = await this.inventory.unit(context, id);
    if (!unit || (unit.customerScope !== '' && unit.customerScope !== context.actor.customerScope))
      reject('GUARD_ACTOR', 'Production material unavailable');
    const issue = await this.store.activeIssue(context, id);
    if (requireIssued || unit.state !== 'AVAILABLE') {
      if (!['ISSUED_TO_PRODUCTION', 'PARTIALLY_CONSUMED'].includes(unit.state))
        reject('GUARD_STATE', 'Production material is not issued');
      if (
        !issue ||
        issue.productionOrderId !== orderId ||
        issue.customerId !== context.actor.customerScope
      )
        reject('GUARD_CONFLICT', 'Material belongs to another production allocation');
    } else if (issue) reject('GUARD_CONFLICT', 'Available material has an active production issue');
    if (await this.inventory.activeReservation(context, id))
      reject('GUARD_CONFLICT', 'Production cannot take an active Sales reservation');
    const totals = await this.inventory.totals(context, id),
      balance = await this.inventory.balance(context, id);
    if (
      !balance ||
      Kg.parse(totals.onHand).compare(Kg.parse(balance.onHand)) !== 0 ||
      Kg.parse(totals.reserved).compare(Kg.parse(balance.reserved)) !== 0
    )
      throw new TechnicalError('incompatible');
    if (
      Kg.parse(totals.reserved).compare(Kg.zero()) !== 0 ||
      Kg.parse(totals.onHand).compare(Kg.zero()) <= 0
    )
      reject('GUARD_INVARIANT', 'Production requires positive unreserved material');
    return Object.freeze({
      unitId: id,
      kg: Kg.parse(totals.onHand).toString(),
      kind: unit.kind,
      locationId: unit.locationId,
      state: unit.state,
    });
  }
  async inspect(
    supplied: PostingContext,
    orderId: string,
    unitIds: readonly string[],
  ): Promise<readonly ProductionMaterial[]> {
    const context = snapshot(supplied),
      ids = identifiers(unitIds);
    await this.authorize(context, orderId, 'inspect');
    const values: ProductionMaterial[] = [];
    for (const id of ids) values.push(await this.material(context, orderId, id, false));
    await this.authorize(context, orderId, 'inspect');
    return Object.freeze(values);
  }
  async issue(
    supplied: PostingContext,
    orderId: string,
    unitIds: readonly string[],
  ): Promise<readonly ProductionMaterial[]> {
    const context = snapshot(supplied),
      ids = identifiers(unitIds);
    if (
      context.request.command !== 'IssueAllocatedMaterial' ||
      context.request.contract_version !== 1 ||
      context.request.target.kind !== 'material-allocation' ||
      !validUuid(context.request.target.id)
    )
      reject('GUARD_INVARIANT', 'Issue requires the allocation owner command');
    await this.authorize(context, orderId, 'issue', ids);
    await this.inventory.lock(context, [...ids].sort(), []);
    await this.authorize(context, orderId, 'issue', ids);
    const materials: ProductionMaterial[] = [];
    for (const id of ids) {
      const value = await this.material(context, orderId, id, false);
      if (value.state !== 'AVAILABLE') reject('GUARD_CONFLICT', 'Material already issued');
      materials.push(value);
    }
    for (const material of materials) {
      await this.inventory.changeState(context, material.unitId, 'ISSUED_TO_PRODUCTION');
      await this.store.recordIssue(context, {
        unitId: material.unitId,
        productionOrderId: orderId,
        customerId: context.actor.customerScope!,
        kg: material.kg,
      });
    }
    return Object.freeze(
      materials.map((value) => Object.freeze({ ...value, state: 'ISSUED_TO_PRODUCTION' as const })),
    );
  }
  async complete(supplied: PostingContext, suppliedBatch: ProductionBatch): Promise<void> {
    const context = snapshot(supplied),
      batch = batchSnapshot(suppliedBatch);
    if (
      context.request.command !== 'CompleteProductionOperation' ||
      context.request.contract_version !== 1 ||
      context.request.target.kind !== 'production-operation' ||
      context.request.target.id !== batch.operationId
    )
      reject('GUARD_INVARIANT', 'Completion requires the exact operation owner command');
    await this.authorize(context, batch.productionOrderId, 'complete', batch);
    const units = [
      ...batch.inputs.map((entry) => entry.unitId),
      ...batch.outputs.map((entry) => entry.unitId),
      ...(batch.finalizeUnitIds ?? []),
    ];
    const effectsIds = [
      ...batch.inputs.map((entry) =>
        productionEffectId(batch.operationId, entry.unitId, 'CONSUME'),
      ),
      ...batch.outputs.map((entry) =>
        productionEffectId(batch.operationId, entry.unitId, 'OUTPUT'),
      ),
    ];
    await this.inventory.lock(context, units.sort(), effectsIds.sort());
    await this.authorize(context, batch.productionOrderId, 'complete', batch);
    const effects: PostingEffect[] = [];
    const fullyConsumed: string[] = [];
    for (const entry of batch.inputs) {
      const value = await this.material(context, batch.productionOrderId, entry.unitId, true);
      const remaining = Kg.parse(value.kg).subtract(Kg.parse(entry.kg));
      if (remaining.compare(Kg.zero()) < 0)
        reject('GUARD_INVARIANT', 'Consumption exceeds current issued kg');
      if (remaining.compare(Kg.zero()) === 0) fullyConsumed.push(entry.unitId);
      effects.push({
        type: 'STOCK_OUT',
        unitId: entry.unitId,
        kg: entry.kg,
        source: {
          factId: entry.factId,
          effectId: productionEffectId(batch.operationId, entry.unitId, 'CONSUME'),
        },
        nextState: remaining.compare(Kg.zero()) === 0 ? 'CONSUMED' : 'PARTIALLY_CONSUMED',
      });
    }
    for (const entry of batch.outputs) {
      if (await this.inventory.unit(context, entry.unitId))
        reject('GUARD_CONFLICT', 'Production output identity already exists');
      effects.push({
        type: 'STOCK_IN',
        unitId: entry.unitId,
        kg: entry.kg,
        source: {
          factId: entry.factId,
          effectId: productionEffectId(batch.operationId, entry.unitId, 'OUTPUT'),
        },
        create: {
          lotId: entry.lotId,
          kind: entry.kind,
          locationId: entry.locationId,
          customerScope: context.actor.customerScope!,
        },
        nextState: entry.disposition === 'WIP' ? 'ISSUED_TO_PRODUCTION' : 'AVAILABLE',
      });
    }
    for (const id of batch.finalizeUnitIds ?? []) {
      const value = await this.material(context, batch.productionOrderId, id, true),
        origin = await this.store.origin(context, id);
      if (
        value.state !== 'ISSUED_TO_PRODUCTION' ||
        !origin ||
        origin.disposition !== 'WIP' ||
        origin.productionOrderId !== batch.productionOrderId ||
        origin.customerId !== context.actor.customerScope
      )
        reject('GUARD_CONFLICT', 'Only intact WIP belonging to this order may be finalized');
    }
    if (this.admissions.has(context.transaction)) throw new TechnicalError('incompatible');
    const frozenEffects = freezeJson(
      parseBoundedJson(canonicalJson(effects as unknown as JsonObject)),
    ) as unknown as readonly PostingEffect[];
    this.admissions.set(
      context.transaction,
      Object.freeze({
        actor: context.actor,
        requestBinding: canonicalJson(context.request as unknown as JsonObject).toString('utf8'),
        batch,
        effects: frozenEffects,
      }),
    );
    try {
      if (effects.length) await this.posting.post(context, frozenEffects);
      for (const id of fullyConsumed)
        await this.store.closeIssue(context, id, batch.productionOrderId);
      for (const entry of batch.outputs) {
        const origin: ProductionOrigin = {
          unitId: entry.unitId,
          productionOrderId: batch.productionOrderId,
          customerId: context.actor.customerScope!,
          kg: entry.kg,
          operationId: batch.operationId,
          factId: entry.factId,
          lotId: entry.lotId,
          disposition: entry.disposition,
        };
        await this.store.recordOrigin(context, origin);
        if (entry.disposition === 'WIP') await this.store.recordIssue(context, origin);
      }
      for (const id of batch.finalizeUnitIds ?? []) {
        await this.authorize(context, batch.productionOrderId, 'complete', batch);
        await this.inventory.changeState(context, id, 'AVAILABLE');
        await this.store.closeIssue(context, id, batch.productionOrderId);
      }
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
      !value.effects.some((member) =>
        canonicalJson(member as unknown as JsonObject).equals(
          canonicalJson(effect as unknown as JsonObject),
        ),
      )
    )
      return undefined;
    return value;
  }
  async visibleForEffect(
    context: PostingContext,
    effect: PostingEffect,
    unit: Unit,
  ): Promise<boolean> {
    const admitted = this.admission(context, effect);
    if (
      !admitted ||
      (unit.customerScope !== '' && unit.customerScope !== context.actor.customerScope)
    )
      return false;
    await this.authorize(context, admitted.batch.productionOrderId, 'complete', admitted.batch);
    return true;
  }
  async validateEffect(
    context: PostingContext,
    effect: PostingEffect,
    unit: Unit | undefined,
  ): Promise<GuardRejection | undefined> {
    const admitted = this.admission(context, effect);
    if (!admitted)
      return {
        family: 'GUARD_CONFLICT',
        message: 'Effect is outside the admitted production completion',
      };
    await this.authorize(context, admitted.batch.productionOrderId, 'complete', admitted.batch);
    if (effect.type === 'STOCK_OUT') {
      const material = await this.material(
        context,
        admitted.batch.productionOrderId,
        effect.unitId,
        true,
      );
      if (!unit || Kg.parse(effect.kg).compare(Kg.parse(material.kg)) > 0)
        return { family: 'GUARD_CONFLICT', message: 'Issued production material changed' };
    } else if (effect.type !== 'STOCK_IN' || unit !== undefined)
      return {
        family: 'GUARD_CONFLICT',
        message: 'Derived production output must have a fresh identity',
      };
    return undefined;
  }
}
