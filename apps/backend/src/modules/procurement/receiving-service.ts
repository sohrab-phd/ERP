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
  type JsonObject,
  type CommandRequest,
  type CommandContract,
  type CommandDecision,
  type ExecutionContext,
  type TransactionContext,
} from '@navard/shared-kernel';
import type { InboundStore, InboundLineProjection, CatalogueKind } from './inbound-contracts.js';
import {
  assertInboundText,
  assertDimension,
  assertUnitInteger,
  parseJalaliDate,
} from './inbound-values.js';
import type {
  ReceivingContext,
  ReceivingInput,
  ReceivingUnitFact,
  ReceivingActual,
  ReceivingInventoryPort,
  ReceivingStore,
  ReceivingQueryName,
  ReceivingStockSource,
} from './receiving-contracts.js';
import type { ReceiptType } from './contracts.js';
import {
  receivingProjectionFits,
  receivingPageFits,
  receivingOrderSummary,
} from './receiving-projection.js';
function invalid(message = 'Invalid receiving value'): never {
  throw new BusinessRejection({ family: 'GUARD_INVARIANT', message });
}
function object(x: unknown): asserts x is Record<string, unknown> {
  if (!x || typeof x !== 'object' || Array.isArray(x)) invalid();
}
function keys(x: Record<string, unknown>, allowed: readonly string[]) {
  if (Object.keys(x).some((k) => !allowed.includes(k))) invalid();
}
function uuid(x: unknown): asserts x is string {
  if (!validUuid(x)) invalid('Invalid receiving identity');
}
function array(x: unknown): asserts x is Record<string, unknown>[] {
  if (!Array.isArray(x) || !x.length) invalid();
  for (const y of x) object(y);
}
function decimal(x: unknown): asserts x is string {
  if (
    typeof x !== 'string' ||
    Buffer.byteLength(x, 'utf8') > 65536 ||
    !/^[0-9]+(?:[.][0-9]+)?(?![\s\S])/u.test(x)
  )
    invalid('Invalid consignment kilogram evidence');
}
function date(x: unknown) {
  try {
    return parseJalaliDate(x);
  } catch (e) {
    if (e instanceof BusinessRejection && e.rejection.message === 'I1_DATE_OUTSIDE_PROFILE')
      invalid('I2_DATE_OUTSIDE_PROFILE');
    throw e;
  }
}
const unitKeys = [
  'receivedUnitId',
  'waybillId',
  'receiptId',
  'internalSystemCode',
  'productNumber',
  'association',
  'actual',
  'acceptance',
  'weightEvidenceReference',
  'locationId',
];
const actualKeys = [
  'materialTypeOptionId',
  'widthM',
  'thicknessMm',
  'unitWeightKg',
  'colorOptionId',
  'qualityGradeOptionId',
  'ralColorNumber',
  'lengthM',
];
const headerKeys = [
  'arrivalDateJalali',
  'originNetKg',
  'destinationNetKg',
  'weightSourceWaybillId',
  'truckNumber',
  'originatingCompany',
  'driverName',
  'waybills',
  'warehouseReceipts',
  'units',
];
export function parseReceivingInput(payload: JsonObject): ReceivingInput {
  keys(payload, headerKeys);
  date(payload.arrivalDateJalali);
  decimal(payload.originNetKg);
  uuid(payload.weightSourceWaybillId);
  for (const k of ['destinationNetKg']) if (Object.hasOwn(payload, k)) decimal(payload[k]);
  for (const k of ['truckNumber', 'originatingCompany', 'driverName'])
    if (Object.hasOwn(payload, k)) assertInboundText(payload[k]);
  array(payload.waybills);
  array(payload.warehouseReceipts);
  array(payload.units);
  const ways = new Set<string>(),
    receipts = new Set<string>(),
    unitIds = new Set<string>(),
    codes = new Set<string>(),
    wayRefs = new Set<string>(),
    receiptRefs = new Set<string>();
  for (const w of payload.waybills) {
    keys(w, ['waybillId', 'reference', 'yellowCopyReference']);
    uuid(w.waybillId);
    assertInboundText(w.reference);
    if (Object.hasOwn(w, 'yellowCopyReference')) assertInboundText(w.yellowCopyReference);
    if (ways.has(w.waybillId) || wayRefs.has(w.reference))
      invalid('Duplicate waybill in receiving');
    ways.add(w.waybillId);
    wayRefs.add(w.reference);
  }
  for (const w of payload.warehouseReceipts) {
    keys(w, ['receiptId', 'reference']);
    uuid(w.receiptId);
    assertInboundText(w.reference);
    if (receipts.has(w.receiptId) || receiptRefs.has(w.reference))
      invalid('Duplicate warehouse receipt in receiving');
    receipts.add(w.receiptId);
    receiptRefs.add(w.reference);
  }
  if (!ways.has(payload.weightSourceWaybillId)) invalid('Whole-consignment weight source required');
  const usedWays = new Set<string>(),
    usedReceipts = new Set<string>();
  for (const u of payload.units) {
    keys(u, unitKeys);
    uuid(u.receivedUnitId);
    uuid(u.waybillId);
    uuid(u.receiptId);
    uuid(u.locationId);
    assertInboundText(u.internalSystemCode);
    assertInboundText(u.productNumber);
    if (Object.hasOwn(u, 'weightEvidenceReference')) assertInboundText(u.weightEvidenceReference);
    if (
      unitIds.has(u.receivedUnitId) ||
      codes.has(u.internalSystemCode) ||
      !ways.has(u.waybillId) ||
      !receipts.has(u.receiptId)
    )
      invalid('Duplicate unit or invalid receiving document');
    unitIds.add(u.receivedUnitId);
    codes.add(u.internalSystemCode);
    usedWays.add(u.waybillId);
    usedReceipts.add(u.receiptId);
    object(u.association);
    const a = u.association;
    if (a.kind === 'ORDER_LINE') {
      keys(a, ['kind', 'orderId', 'lineId']);
      uuid(a.orderId);
      uuid(a.lineId);
    } else if (a.kind === 'ORDER_ONLY') {
      keys(a, ['kind', 'orderId']);
      uuid(a.orderId);
    } else if (a.kind === 'UNLINKED') keys(a, ['kind']);
    else invalid();
    object(u.actual);
    keys(u.actual, actualKeys);
    uuid(u.actual.materialTypeOptionId);
    assertDimension(u.actual.widthM);
    assertDimension(u.actual.thicknessMm);
    assertUnitInteger(u.actual.unitWeightKg);
    for (const k of ['colorOptionId', 'qualityGradeOptionId'])
      if (Object.hasOwn(u.actual, k) && u.actual[k] !== null) uuid(u.actual[k]);
    if (Object.hasOwn(u.actual, 'ralColorNumber') && u.actual.ralColorNumber !== null)
      assertInboundText(u.actual.ralColorNumber);
    if (Object.hasOwn(u.actual, 'lengthM') && u.actual.lengthM !== null)
      assertDimension(u.actual.lengthM);
    object(u.acceptance);
    keys(u.acceptance, ['confirmed', 'changedW1', 'specificationMismatch', 'excess', 'unordered']);
    if (
      u.acceptance.confirmed !== true ||
      Object.values(u.acceptance).some((v) => typeof v !== 'boolean')
    )
      invalid('Explicit warehouse acceptance required');
  }
  if (usedWays.size !== ways.size || usedReceipts.size !== receipts.size)
    invalid('Unused receiving document');
  return payload as unknown as ReceivingInput;
}
function snapshot(ctx: ReceivingContext): ReceivingContext {
  validateContext(ctx.actor);
  return Object.freeze({
    actor: ctx.actor,
    transaction: ctx.transaction,
    request: freezeJson(
      parseBoundedJson(canonicalJson(ctx.request as unknown as JsonObject)),
    ) as unknown as CommandRequest,
  });
}
function numericSame(a: string, b: string) {
  const split = (x: string) => {
    const [i, f = ''] = x.split('.');
    return `${i}.${f.replace(/0+$/u, '')}`;
  };
  return split(a) === split(b);
}
function comparison(original: InboundLineProjection | null, actual: ReceivingActual): JsonObject {
  const out: Record<string, JsonObject> = {};
  if (!original) return out;
  for (const k of [
    'materialType',
    'widthM',
    'thicknessMm',
    'unitWeightKg',
    'color',
    'qualityGrade',
    'ralColorNumber',
    'lengthM',
  ] as const) {
    const old = original[k],
      value = actual[k];
    let state: string;
    if (!Object.hasOwn(actual, k)) state = 'NOT_RECORDED';
    else if (value === null) state = old === undefined ? 'SAME' : 'CONFIRMED_ABSENT';
    else if (old === undefined) state = 'CHANGED';
    else if (['widthM', 'thicknessMm', 'lengthM'].includes(k))
      state = numericSame(old as string, value as string) ? 'SAME' : 'CHANGED';
    else state = JSON.stringify(old) === JSON.stringify(value) ? 'SAME' : 'CHANGED';
    out[k] = {
      state,
      ...(old === undefined ? {} : { ordered: old as unknown as JsonObject }),
      ...(value === undefined ? {} : { actual: value as unknown as JsonObject }),
    };
  }
  return out;
}
const bound = (ctx: ReceivingContext) =>
  canonicalJson(ctx.request as unknown as JsonObject).toString('utf8');
export class ReceivingService {
  private readonly admissions = new WeakMap<
    TransactionContext,
    { actor: ExecutionContext; binding: string; sources: readonly ReceivingStockSource[] }
  >();
  constructor(
    private readonly store: ReceivingStore,
    private readonly originals: InboundStore,
    private readonly inventory: ReceivingInventoryPort,
    private readonly policy: {
      current(ctx: ReceivingContext): Promise<boolean>;
      materialType(label: string): ReceiptType;
    },
  ) {}
  private async current(ctx: ReceivingContext, write = false) {
    if (
      ctx.actor.customerScope !== undefined ||
      ctx.actor.temporary === true ||
      ctx.actor.installationId !== ctx.actor.authorityScopeId ||
      !(write
        ? ctx.actor.actorRole === 'ACT-WH'
        : ['ACT-WH', 'ACT-PROC'].includes(ctx.actor.actorRole)) ||
      !(await this.policy.current(ctx))
    )
      throw new BusinessRejection({
        family: 'GUARD_ACTOR',
        message: 'Current organizational receiving permission required',
      });
  }
  contract(): CommandContract {
    const scalar = { type: 'scalar' as const };
    const scalars = (names: readonly string[]) => Object.fromEntries(names.map((x) => [x, scalar]));
    return {
      command: 'ConfirmPurchaseReceiving',
      version: 1,
      active: true,
      payloadShape: {
        ...scalars(
          headerKeys.filter((x) => !['units', 'waybills', 'warehouseReceipts'].includes(x)),
        ),
        waybills: {
          type: 'array',
          element: {
            type: 'object',
            fields: scalars(['waybillId', 'reference', 'yellowCopyReference']),
          },
        },
        warehouseReceipts: {
          type: 'array',
          element: { type: 'object', fields: scalars(['receiptId', 'reference']) },
        },
        units: {
          type: 'array',
          element: {
            type: 'object',
            fields: {
              ...scalars(
                unitKeys.filter((x) => !['association', 'actual', 'acceptance'].includes(x)),
              ),
              association: { type: 'object', fields: scalars(['kind', 'orderId', 'lineId']) },
              actual: { type: 'object', fields: scalars(actualKeys) },
              acceptance: {
                type: 'object',
                fields: scalars([
                  'confirmed',
                  'changedW1',
                  'specificationMismatch',
                  'excess',
                  'unordered',
                ]),
              },
            },
          },
        },
      },
      preconditionsShape: {
        lineProgress: {
          type: 'array',
          element: {
            type: 'object',
            fields: scalars(['orderId', 'lineId', 'expectedAcceptedUnitCount']),
          },
        },
      },
      execute: (r, a, t) => this.confirm(r, a, t),
      constraintRejections: Object.fromEntries(
        [
          'i2_arrival_pk',
          'i2_waybill_pk',
          'i2_waybill_reference_uq',
          'i2_receipt_pk',
          'i2_receipt_reference_uq',
          'i2_received_unit_pk',
          'i2_code_claim_pk',
        ].map((n) => [
          n,
          async (r: CommandRequest, a: ExecutionContext, t: TransactionContext) => {
            await this.current({ request: r, actor: a, transaction: t }, true);
            return {
              family: 'GUARD_CONFLICT' as const,
              message: 'Receiving unit code or document already recorded',
            };
          },
        ]),
      ),
    };
  }
  async admitted(
    ctx: ReceivingContext,
    arrivalId: string,
    sources: readonly ReceivingStockSource[],
  ): Promise<boolean> {
    const a = this.admissions.get(ctx.transaction);
    return (
      !!a &&
      a.actor === ctx.actor &&
      a.binding === bound(ctx) &&
      ctx.request.target.id === arrivalId &&
      canonicalJson(a.sources as unknown as JsonObject).equals(
        canonicalJson(sources as unknown as JsonObject),
      ) &&
      (await this.policy.current(ctx))
    );
  }
  async confirm(
    r: CommandRequest,
    a: ExecutionContext,
    t: TransactionContext,
  ): Promise<CommandDecision> {
    const ctx = snapshot({ request: r, actor: a, transaction: t });
    r = ctx.request;
    if (
      r.command !== 'ConfirmPurchaseReceiving' ||
      r.contract_version !== 1 ||
      r.target.kind !== 'inbound-arrival' ||
      !validUuid(r.target.id) ||
      !validIdempotencyKey(r.idempotency_key)
    )
      invalid();
    const input = parseReceivingInput(r.payload);
    keys(r.preconditions, ['lineProgress']);
    if (!Array.isArray(r.preconditions.lineProgress))
      invalid('Line progress preconditions required');
    const expected = new Map<string, string>();
    for (const p of r.preconditions.lineProgress) {
      object(p);
      keys(p, ['orderId', 'lineId', 'expectedAcceptedUnitCount']);
      uuid(p.orderId);
      uuid(p.lineId);
      if (
        typeof p.expectedAcceptedUnitCount !== 'string' ||
        !/^(0|[1-9][0-9]{0,19})(?![\s\S])/u.test(p.expectedAcceptedUnitCount)
      )
        invalid();
      const key = `${p.orderId}/${p.lineId}`;
      if (expected.has(key)) invalid();
      expected.set(key, p.expectedAcceptedUnitCount);
    }
    const linked = new Map<string, { orderId: string; lineId: string }>();
    for (const u of input.units)
      if (u.association.kind === 'ORDER_LINE')
        linked.set(`${u.association.orderId}/${u.association.lineId}`, u.association);
    if (expected.size !== linked.size || [...linked.keys()].some((k) => !expected.has(k)))
      invalid('Exact linked-line progress preconditions required');
    await this.current(ctx, true);
    const inst = a.installationId;
    const resources = [
      `i2-arrival/${inst}/${r.target.id}`,
      ...input.units.map((u) => `procurement-physical-code/${inst}/${u.internalSystemCode}`),
      ...input.waybills.flatMap((w) => [
        `i2-waybill/${inst}/${w.reference}`,
        `i2-waybill-id/${inst}/${w.waybillId}`,
      ]),
      ...input.warehouseReceipts.flatMap((w) => [
        `i2-receipt/${inst}/${w.reference}`,
        `i2-receipt-id/${inst}/${w.receiptId}`,
      ]),
      ...input.units.map((u) => `i2-unit/${inst}/${u.receivedUnitId}`),
      ...[...linked.values()].map((x) => `i2-line/${inst}/${x.lineId}`),
    ];
    await this.store.lock(ctx, resources);
    await this.current(ctx, true);
    if (await this.store.duplicate(ctx, input, r.target.id))
      throw new BusinessRejection({
        family: 'GUARD_CONFLICT',
        message: 'Receiving unit code or document already recorded',
      });
    const counts = await this.store.counts(
      ctx,
      [...linked.values()].map((x) => x.lineId),
    );
    for (const [key, x] of linked)
      if ((counts.get(x.lineId) ?? '0') !== expected.get(key))
        throw new BusinessRejection({
          family: 'GUARD_CONFLICT',
          message: 'Receiving progress changed; review current counts',
        });
    const orders = new Map<string, Awaited<ReturnType<InboundStore['order']>>>();
    for (const u of input.units)
      if (u.association.kind !== 'UNLINKED' && !orders.has(u.association.orderId)) {
        const o = await this.originals.order(ctx, u.association.orderId);
        if (!o) invalid('Scoped original order required');
        orders.set(u.association.orderId, o);
      }
    const ids = [
      ...new Set(
        input.units.flatMap((u) => [
          u.actual.materialTypeOptionId,
          ...(u.actual.colorOptionId ? [u.actual.colorOptionId] : []),
          ...(u.actual.qualityGradeOptionId ? [u.actual.qualityGradeOptionId] : []),
        ]),
      ),
    ];
    const options = new Map((await this.originals.options(ctx, ids)).map((x) => [x.optionId, x]));
    const select = (id: string, kind: CatalogueKind) => {
      const v = options.get(id);
      if (!v || v.catalogue !== kind) invalid('Scoped catalogue selection required');
      return { optionId: v.optionId, label: v.label };
    };
    const batchCounts = new Map<string, bigint>();
    const facts: ReceivingUnitFact[] = input.units.map((u, index) => {
      const assoc = u.association;
      const original =
        assoc.kind === 'ORDER_LINE'
          ? (orders.get(assoc.orderId)!.projection.lines.find((l) => l.lineId === assoc.lineId) ??
            null)
          : null;
      if (assoc.kind === 'ORDER_LINE' && !original) invalid('Scoped original line required');
      const actual: ReceivingActual = {
        materialType: select(u.actual.materialTypeOptionId, 'MATERIAL_TYPE'),
        widthM: u.actual.widthM,
        thicknessMm: u.actual.thicknessMm,
        unitWeightKg: u.actual.unitWeightKg,
        ...(Object.hasOwn(u.actual, 'colorOptionId')
          ? {
              color:
                u.actual.colorOptionId === null ? null : select(u.actual.colorOptionId!, 'COLOR'),
            }
          : {}),
        ...(Object.hasOwn(u.actual, 'qualityGradeOptionId')
          ? {
              qualityGrade:
                u.actual.qualityGradeOptionId === null
                  ? null
                  : select(u.actual.qualityGradeOptionId!, 'QUALITY_GRADE'),
            }
          : {}),
        ...(Object.hasOwn(u.actual, 'lengthM') ? { lengthM: u.actual.lengthM } : {}),
        ...(Object.hasOwn(u.actual, 'ralColorNumber')
          ? { ralColorNumber: u.actual.ralColorNumber }
          : {}),
      };
      const diff = comparison(original, actual);
      const mismatch = Object.entries(diff).some(
        ([k, v]) =>
          k !== 'unitWeightKg' &&
          ['CHANGED', 'CONFIRMED_ABSENT'].includes((v as JsonObject).state as string),
      );
      const changed = !!original && original.unitWeightKg !== actual.unitWeightKg;
      let excess = false;
      if (assoc.kind === 'ORDER_LINE') {
        const b = (batchCounts.get(assoc.lineId) ?? 0n) + 1n;
        batchCounts.set(assoc.lineId, b);
        excess = BigInt(counts.get(assoc.lineId) ?? '0') + b > BigInt(original!.orderedUnitCount);
      }
      for (const [flag, needed] of Object.entries({
        changedW1: changed,
        specificationMismatch: mismatch,
        excess,
        unordered: assoc.kind !== 'ORDER_LINE',
      }))
        if (needed && u.acceptance[flag as keyof typeof u.acceptance] !== true)
          invalid(`Explicit ${flag} acceptance required`);
      let technicalType: ReceiptType;
      try {
        technicalType = this.policy.materialType(actual.materialType.label);
      } catch (error) {
        if (error instanceof BusinessRejection)
          invalid(
            `Unsupported Material Type option ${actual.materialType.optionId} at unit ${index + 1}`,
          );
        throw error;
      }
      return {
        ...u,
        arrivalId: r.target.id,
        position: index + 1,
        actual,
        original,
        comparison: diff,
        technicalType,
      };
    });
    const sources: ReceivingStockSource[] = facts.map((u) => ({
      receivedUnitId: u.receivedUnitId,
      arrivalId: u.arrivalId,
      internalSystemCode: u.internalSystemCode,
      productNumber: u.productNumber,
      acceptedUnitWeightKg: u.actual.unitWeightKg,
      materialTypeId: u.actual.materialType.optionId,
      materialTypeLabel: u.actual.materialType.label,
      technicalType: u.technicalType,
      locationId: u.locationId,
    }));
    // Check complete actual reader shapes, including shared headers, trusted metadata and transport wrapper.
    if (
      !receivingProjectionFits(
        ctx,
        r.target.id,
        input,
        facts,
        new Map([...orders].map(([id, order]) => [id, order!.projection] as const)),
      )
    )
      invalid('I2_PROJECTION_LIMIT');
    await this.current(ctx, true);
    await this.store.insert(ctx, r.target.id, input, facts);
    this.admissions.set(t, { actor: a, binding: bound(ctx), sources });
    try {
      await this.inventory.receiveMany(ctx, r.target.id, sources);
    } finally {
      this.admissions.delete(t);
    }
    await this.store.complete(ctx);
    await this.current(ctx, true);
    return {
      outcome: 'accepted',
      factIdentity: r.target.id,
      event: 'PurchaseReceivingConfirmed',
      data: { arrivalId: r.target.id, acceptedUnitCount: facts.length, state: 'CONFIRMED' },
    };
  }
  async source(ctx: ReceivingContext, id: string) {
    return this.store.source(ctx, id);
  }
  async query(
    supplied: ReceivingContext,
    kind: ReceivingQueryName,
    input: Record<string, unknown>,
  ): Promise<unknown> {
    const ctx = snapshot(supplied);
    object(input);
    input = freezeJson(parseBoundedJson(canonicalJson(input as JsonObject))) as JsonObject;
    await this.current(ctx);
    const limit = input.limit ?? 50;
    if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 100)
      invalid();
    if (input.afterId !== undefined) uuid(input.afterId);
    let header: Record<string, unknown> | undefined;
    let rows: Record<string, unknown>[];
    let order;
    let lineMode = false;
    if (kind === 'GetReceivingArrival') {
      keys(input, ['arrivalId', 'afterId', 'limit']);
      uuid(input.arrivalId);
      await this.current(ctx, true);
      header = await this.store.arrival(ctx, input.arrivalId);
      if (!header) return undefined;
      rows = await this.store.units(ctx, {
        arrivalId: input.arrivalId,
        ...(input.afterId ? { afterId: input.afterId } : {}),
        limit: limit + 1,
      });
    } else if (kind === 'GetPurchaseOrderReceiving') {
      keys(input, ['orderId', 'view', 'afterId', 'limit']);
      uuid(input.orderId);
      if (input.view !== 'LINES' && input.view !== 'RECEIVED_UNITS') invalid();
      order = (await this.originals.order(ctx, input.orderId))?.projection;
      if (!order) return undefined;
      lineMode = input.view === 'LINES';
      if (lineMode) {
        const counts = await this.store.counts(
          ctx,
          order.lines.map((x) => x.lineId),
        );
        rows = order.lines
          .filter((l) => !input.afterId || l.lineId > (input.afterId as string))
          .sort((x, y) => x.lineId.localeCompare(y.lineId))
          .map((l) => {
            const accepted = BigInt(counts.get(l.lineId) ?? '0'),
              ordered = BigInt(l.orderedUnitCount);
            return {
              ...l,
              acceptedUnitCount: accepted.toString(),
              remainingUnitCount: (ordered > accepted ? ordered - accepted : 0n).toString(),
              excessUnitCount: (accepted > ordered ? accepted - ordered : 0n).toString(),
              variance: (accepted - ordered).toString(),
            };
          })
          .slice(0, limit + 1);
      } else
        rows = await this.store.units(ctx, {
          orderId: input.orderId,
          ...(input.afterId ? { afterId: input.afterId } : {}),
          limit: limit + 1,
        });
    } else invalid();
    if (!lineMode) {
      const stock = await this.inventory.identities(
        ctx,
        rows.map((x) => x.receivedUnitId as string),
      );
      const byId = new Map(stock.map((x) => [x.receivedUnitId, x]));
      rows = rows.map((x) => ({ ...x, inventory: byId.get(x.receivedUnitId as string) }));
    }
    const base = {
      ...(header ? { arrival: header } : {}),
      ...(order ? { order: receivingOrderSummary(order) } : {}),
    };
    const snapshotAt = new Date().toISOString();
    const items: Record<string, unknown>[] = [];
    for (const row of rows.slice(0, limit)) {
      const cursor = String(row.receivedUnitId ?? row.lineId);
      if (!receivingPageFits(base, [...items, row], snapshotAt, cursor)) {
        if (!items.length) throw new TechnicalError('incompatible');
        break;
      }
      items.push(row);
    }
    const result = {
      ...base,
      items,
      ...(items.length < rows.length
        ? { nextAfterId: String(items.at(-1)?.[lineMode ? 'lineId' : 'receivedUnitId']) }
        : {}),
      snapshotAt,
    };
    await this.current(ctx, kind === 'GetReceivingArrival');
    return result;
  }
}
