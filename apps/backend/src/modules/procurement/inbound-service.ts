import { randomUUID } from 'node:crypto';
import { Buffer } from 'node:buffer';
import {
  BusinessRejection,
  TechnicalError,
  canonicalJson,
  freezeJson,
  parseBoundedJson,
  validateContext,
  validUuid,
  validIdempotencyKey,
  type CommandContract,
  type CommandRequest,
  type CommandDecision,
  type ExecutionContext,
  type TransactionContext,
  type JsonObject,
  type GuardRejection,
} from '@navard/shared-kernel';
import {
  catalogueKinds,
  type CatalogueKind,
  type CatalogueInput,
  type CatalogueQuery,
  type InboundContext,
  type InboundLineInput,
  type InboundLineProjection,
  type InboundOrderProjection,
  type InboundPolicy,
  type InboundQueryName,
  type InboundStore,
  type OperationalOrderInput,
} from './inbound-contracts.js';
import {
  assertDimension,
  assertInboundText,
  assertUnitInteger,
  normalizeOrderReference,
  parseJalaliDate,
} from './inbound-values.js';

const lineFields = [
  'itemNumber',
  'materialTypeOptionId',
  'widthM',
  'thicknessMm',
  'colorOptionId',
  'ralColorNumber',
  'lengthM',
  'qualityGradeOptionId',
  'unitWeightKg',
  'orderedUnitCount',
];
function invalid(message = 'Invalid inbound value'): never {
  throw new BusinessRejection({ family: 'GUARD_INVARIANT', message });
}
function object(value: unknown): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) invalid();
}
function fields(value: Record<string, unknown>, names: readonly string[]) {
  if (Object.keys(value).some((name) => !names.includes(name))) invalid();
}
function catalogue(value: unknown): asserts value is CatalogueKind {
  if (!catalogueKinds.includes(value as CatalogueKind)) invalid();
}
export function parseOperationalOrder(payload: JsonObject): OperationalOrderInput {
  fields(payload, ['orderReference', 'registrationDateJalali', 'lines']);
  const { orderReference, registrationDateJalali, lines } = payload;
  assertInboundText(orderReference);
  if (!normalizeOrderReference(orderReference)) invalid();
  parseJalaliDate(registrationDateJalali);
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > 128) invalid();
  const parsed = lines.map((value) => {
    object(value);
    fields(value, lineFields);
    if (!validUuid(value.materialTypeOptionId)) invalid();
    assertDimension(value.widthM);
    assertDimension(value.thicknessMm);
    assertUnitInteger(value.unitWeightKg);
    assertUnitInteger(value.orderedUnitCount);
    for (const name of ['itemNumber', 'ralColorNumber'])
      if (Object.hasOwn(value, name)) assertInboundText(value[name]);
    for (const name of ['colorOptionId', 'qualityGradeOptionId'])
      if (Object.hasOwn(value, name) && !validUuid(value[name])) invalid();
    if (Object.hasOwn(value, 'lengthM')) assertDimension(value.lengthM);
    return Object.freeze({ ...value }) as unknown as InboundLineInput;
  });
  return Object.freeze({
    orderReference,
    registrationDateJalali: registrationDateJalali as string,
    lines: Object.freeze(parsed),
  });
}
export function parseCatalogueInput(payload: JsonObject): CatalogueInput {
  fields(payload, ['catalogue', 'label']);
  catalogue(payload.catalogue);
  assertInboundText(payload.label);
  return Object.freeze({ catalogue: payload.catalogue, label: payload.label });
}
function parseCatalogueQuery(input: Record<string, unknown>): CatalogueQuery {
  fields(input, ['catalogue', 'exactLabel', 'afterId', 'limit']);
  catalogue(input.catalogue);
  if (Object.hasOwn(input, 'exactLabel')) assertInboundText(input.exactLabel);
  if (Object.hasOwn(input, 'afterId') && !validUuid(input.afterId)) invalid();
  if (Object.hasOwn(input, 'exactLabel') && Object.hasOwn(input, 'afterId')) invalid();
  const limit = Object.hasOwn(input, 'limit') ? input.limit : 50;
  if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 100) invalid();
  return { ...input, limit } as CatalogueQuery;
}
function snapshot(ctx: InboundContext): InboundContext {
  validateContext(ctx.actor);
  // Preserve the Identity-issued context object: copying its claims cannot convey authority.
  return Object.freeze({
    actor: ctx.actor,
    transaction: ctx.transaction,
    request: Object.freeze({
      ...ctx.request,
      target: Object.freeze({ ...ctx.request.target }),
      payload: freezeJson(parseBoundedJson(canonicalJson(ctx.request.payload))) as JsonObject,
      preconditions: freezeJson(
        parseBoundedJson(canonicalJson(ctx.request.preconditions)),
      ) as JsonObject,
    }),
  });
}
const ownerBinding = (input: OperationalOrderInput | CatalogueInput) =>
  canonicalJson(input as unknown as JsonObject).toString('utf8');
const duplicate = (same: boolean): GuardRejection => ({
  family: same ? 'GUARD_IDEMPOTENT_DUP' : 'GUARD_CONFLICT',
  message: same ? 'Inbound source already recorded' : 'Inbound source identity conflict',
});
/** Stock-free Procurement originals. No Inventory, receiving or financial port exists here. */
export class InboundService {
  constructor(
    private readonly store: InboundStore,
    private readonly policy: InboundPolicy,
  ) {}

  contracts(): CommandContract[] {
    return ['RegisterOperationalPurchaseOrder', 'AddInboundCatalogueOption'].map((command) => ({
      command,
      version: 1,
      active: true,
      payloadShape:
        command === 'RegisterOperationalPurchaseOrder'
          ? {
              orderReference: { type: 'scalar' as const },
              registrationDateJalali: { type: 'scalar' as const },
              lines: {
                type: 'array' as const,
                element: {
                  type: 'object' as const,
                  fields: Object.fromEntries(
                    lineFields.map((name) => [name, { type: 'scalar' as const }]),
                  ),
                },
              },
            }
          : { catalogue: { type: 'scalar' as const }, label: { type: 'scalar' as const } },
      preconditionsShape: {},
      execute: (r, actor, transaction) => this.record(r, actor, transaction),
      constraintRejections: Object.fromEntries(
        (command === 'RegisterOperationalPurchaseOrder'
          ? ['i1_po_pk', 'i1_po_reference_uq']
          : ['i1_option_pk', 'i1_option_label_uq']
        ).map((name) => [
          name,
          (r: CommandRequest, actor: ExecutionContext, transaction: TransactionContext) =>
            this.constraint(name, snapshot({ request: r, actor, transaction })),
        ]),
      ),
    }));
  }
  private async current(ctx: InboundContext, registering = false): Promise<void> {
    if (
      ctx.actor.customerScope !== undefined ||
      ctx.actor.temporary === true ||
      ctx.actor.installationId !== ctx.actor.authorityScopeId ||
      !(registering
        ? ctx.actor.actorRole === 'ACT-PROC'
        : ['ACT-PROC', 'ACT-WH'].includes(ctx.actor.actorRole)) ||
      !(await this.policy.current(ctx))
    )
      throw new BusinessRejection({
        family: 'GUARD_ACTOR',
        message: 'Current organizational inbound permission required',
      });
  }
  private async constraint(name: string, ctx: InboundContext): Promise<GuardRejection | undefined> {
    const order = ctx.request.command === 'RegisterOperationalPurchaseOrder';
    await this.current(ctx, order);
    const input = order
      ? parseOperationalOrder(ctx.request.payload)
      : parseCatalogueInput(ctx.request.payload);
    const binding = ownerBinding(input);
    if (name === 'i1_po_pk' || name === 'i1_option_pk') {
      const previous = order
        ? await this.store.order(ctx, ctx.request.target.id)
        : (await this.store.options(ctx, [ctx.request.target.id]))[0];
      return previous ? duplicate(previous.binding === binding) : undefined;
    }
    if (name === 'i1_po_reference_uq') {
      const raw = (input as OperationalOrderInput).orderReference;
      return (await this.store.orderByReference(ctx, raw, normalizeOrderReference(raw)))
        ? duplicate(false)
        : undefined;
    }
    if (name === 'i1_option_label_uq') {
      const value = input as CatalogueInput;
      return (
        await this.store.listOptions(ctx, {
          catalogue: value.catalogue,
          exactLabel: value.label,
          limit: 1,
        })
      ).length
        ? duplicate(true)
        : undefined;
    }
    return undefined;
  }
  async record(
    request: CommandRequest,
    actor: ExecutionContext,
    transaction: TransactionContext,
  ): Promise<CommandDecision> {
    const ctx = snapshot({ request, actor, transaction });
    const r = ctx.request;
    const order = r.command === 'RegisterOperationalPurchaseOrder';
    if (
      (!order && r.command !== 'AddInboundCatalogueOption') ||
      r.contract_version !== 1 ||
      r.target.kind !== (order ? 'operational-purchase-order' : 'inbound-catalogue-option') ||
      !validUuid(r.target.id) ||
      !validIdempotencyKey(r.idempotency_key) ||
      Object.keys(r.preconditions).length
    )
      invalid();
    const input = order ? parseOperationalOrder(r.payload) : parseCatalogueInput(r.payload);
    const binding = ownerBinding(input);
    await this.current(ctx, order);
    const factory = ctx.actor.installationId;
    const raw = order ? (input as OperationalOrderInput).orderReference : undefined;
    const key = raw === undefined ? undefined : normalizeOrderReference(raw);
    const resources = order
      ? [
          JSON.stringify(['i1-order-target', factory, ctx.actor.authorityScopeId, r.target.id]),
          JSON.stringify(['i1-order-reference', factory, 'PO-REF-R1-A-v1', key]),
        ]
      : [
          JSON.stringify(['i1-option-target', factory, ctx.actor.authorityScopeId, r.target.id]),
          JSON.stringify([
            'i1-option-label',
            factory,
            (input as CatalogueInput).catalogue,
            (input as CatalogueInput).label,
          ]),
        ];
    await this.store.lock(ctx, resources);
    await this.current(ctx, order);
    const previous = order
      ? await this.store.order(ctx, r.target.id)
      : (await this.store.options(ctx, [r.target.id]))[0];
    if (previous) throw new BusinessRejection(duplicate(previous.binding === binding));
    if (order) {
      const value = input as OperationalOrderInput;
      if (await this.store.orderByReference(ctx, value.orderReference, key!))
        throw new BusinessRejection(duplicate(false));
      const ids = [
        ...new Set(
          value.lines.flatMap((line) => [
            line.materialTypeOptionId,
            ...(line.colorOptionId === undefined ? [] : [line.colorOptionId]),
            ...(line.qualityGradeOptionId === undefined ? [] : [line.qualityGradeOptionId]),
          ]),
        ),
      ];
      const options = new Map((await this.store.options(ctx, ids)).map((x) => [x.optionId, x]));
      const select = (id: string, kind: CatalogueKind) => {
        const option = options.get(id);
        if (!option || option.catalogue !== kind)
          throw new BusinessRejection({
            family: 'GUARD_STATE',
            message: 'Scoped catalogue selection required',
          });
        return { optionId: option.optionId, label: option.label };
      };
      const lines: InboundLineProjection[] = value.lines.map((line, index) => ({
        lineId: randomUUID(),
        position: index + 1,
        ...(line.itemNumber === undefined ? {} : { itemNumber: line.itemNumber }),
        materialType: select(line.materialTypeOptionId, 'MATERIAL_TYPE'),
        widthM: line.widthM,
        thicknessMm: line.thicknessMm,
        ...(line.colorOptionId === undefined ? {} : { color: select(line.colorOptionId, 'COLOR') }),
        ...(line.ralColorNumber === undefined ? {} : { ralColorNumber: line.ralColorNumber }),
        ...(line.lengthM === undefined ? {} : { lengthM: line.lengthM }),
        ...(line.qualityGradeOptionId === undefined
          ? {}
          : { qualityGrade: select(line.qualityGradeOptionId, 'QUALITY_GRADE') }),
        unitWeightKg: line.unitWeightKg,
        orderedUnitCount: line.orderedUnitCount,
      }));
      const projection: InboundOrderProjection = {
        orderId: r.target.id,
        orderReference: value.orderReference,
        registrationDateJalali: value.registrationDateJalali,
        calendar: 'jalali',
        lineCount: lines.length,
        units: { widthM: 'm', thicknessMm: 'mm', lengthM: 'm', unitWeightKg: 'kg' },
        lines,
      };
      if (Buffer.byteLength(JSON.stringify({ data: projection }), 'utf8') > 262144)
        invalid('I1_ORDER_PROJECTION_LIMIT');
      await this.current(ctx, true);
      await this.store.insertOrder(ctx, r.target.id, binding, value, projection);
      await this.current(ctx, true);
      return {
        outcome: 'accepted',
        factIdentity: r.target.id,
        event: 'OperationalPurchaseOrderRegistered',
        data: { orderId: r.target.id, lineCount: lines.length },
      };
    }
    const value = input as CatalogueInput;
    if (
      (
        await this.store.listOptions(ctx, {
          catalogue: value.catalogue,
          exactLabel: value.label,
          limit: 1,
        })
      ).length
    )
      throw new BusinessRejection(duplicate(true));
    await this.current(ctx);
    await this.store.insertOption(ctx, r.target.id, binding, value);
    await this.current(ctx);
    return {
      outcome: 'accepted',
      factIdentity: r.target.id,
      event: 'InboundCatalogueOptionAdded',
      data: { optionId: r.target.id, catalogue: value.catalogue },
    };
  }
  async query(
    supplied: InboundContext,
    kind: InboundQueryName,
    input: Record<string, unknown>,
  ): Promise<unknown> {
    const ctx = snapshot(supplied);
    object(input);
    input = freezeJson(parseBoundedJson(canonicalJson(input as JsonObject))) as JsonObject;
    await this.current(ctx);
    let data: unknown;
    if (
      kind === 'GetOperationalPurchaseOrder' ||
      kind === 'GetOperationalPurchaseOrderByReference'
    ) {
      let record;
      if (kind === 'GetOperationalPurchaseOrder') {
        fields(input, ['orderId']);
        if (!validUuid(input.orderId)) invalid();
        record = await this.store.order(ctx, input.orderId);
      } else {
        fields(input, ['orderReference']);
        assertInboundText(input.orderReference);
        const key = normalizeOrderReference(input.orderReference);
        if (!key) invalid();
        record = await this.store.orderByReference(ctx, input.orderReference, key);
      }
      data = record?.projection;
    } else if (kind === 'ListInboundCatalogueOptions') {
      const query = parseCatalogueQuery(input);
      const options = await this.store.listOptions(ctx, query);
      if (query.exactLabel !== undefined && options.length > 1)
        throw new TechnicalError('retryable');
      const items = options
        .slice(0, query.limit)
        .map(({ optionId, catalogue, label }) => ({ optionId, catalogue, label }));
      data = {
        items,
        ...(options.length > query.limit ? { nextAfterId: items.at(-1)!.optionId } : {}),
      };
    } else invalid();
    await this.current(ctx);
    if (data !== undefined && Buffer.byteLength(JSON.stringify({ data }), 'utf8') > 262144)
      throw new TechnicalError('retryable');
    return data;
  }
}
