import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import {
  canonicalJson,
  parseBoundedJson,
  validUnicode,
  validUuid,
  type ExecutionContext,
  type JsonObject,
  type TransactionContext,
} from '@navard/shared-kernel';
import { Kg } from './quantity.js';

export const INVENTORY_CURRENT_STATES = [
  'AVAILABLE',
  'RESERVED',
  'PACKED',
  'ISSUED_TO_PRODUCTION',
  'PARTIALLY_CONSUMED',
] as const;
export const INVENTORY_READ_STATES = [...INVENTORY_CURRENT_STATES, 'CONSUMED', 'SHIPPED'] as const;
export type InventoryReadState = (typeof INVENTORY_READ_STATES)[number];
export type InventoryOrigin = 'LEGACY_RECEIPT' | 'I2_RECEIVING' | 'PRODUCTION';
export type InventoryReadQuery =
  'DiscoverInventoryUnits' | 'GetInventoryUnitDetail' | 'ListInventoryLotUnits';
export class InventoryReadError extends Error {
  constructor(
    readonly status: 400 | 403 | 404 | 413 | 422 | 503,
    readonly error: string,
  ) {
    super('Inventory read unavailable');
  }
}
const invalid = (): never => {
  throw new InventoryReadError(400, 'invalid');
};
const incompatible = (): never => {
  throw new InventoryReadError(503, 'unavailable');
};
export interface InventoryFilters {
  unitId?: string;
  lotId?: string;
  materialId?: string;
  internalCode?: string;
  kind?: string;
  locationId?: string;
  state?: (typeof INVENTORY_CURRENT_STATES)[number];
  origin?: InventoryOrigin;
}
export interface InventoryReadInput {
  filters: Readonly<InventoryFilters>;
  limit: number;
  cursor?: string;
}
export interface InventoryReadContext {
  actor: ExecutionContext;
  transaction: TransactionContext;
}
export interface InventoryReadBinding {
  accountId: string;
  personId: string;
  sessionDigest: string;
}
export interface InventorySelection {
  filters: Readonly<InventoryFilters>;
  states: readonly InventoryReadState[];
  afterUnitId?: string;
  take: number;
}
/** Internal typed read evidence, never a transport projection. */
export interface InventoryCandidate {
  unitId: string;
  lotId: string;
  kind: string;
  locationId: string;
  customerScope: string;
  state: InventoryReadState;
  legacyUnitId: string | null;
  legacyLotId: string | null;
  legacyMaterialId: string | null;
  legacyInternalCode: string | null;
  legacyProductCode: string | null;
  legacyReceiptId: string | null;
  legacyInitialKg: string | null;
  legacyCount: string | null;
  legacyType: string | null;
  legacyLocationId: string | null;
  i2UnitId: string | null;
  i2LotId: string | null;
  i2MaterialId: string | null;
  i2InternalCode: string | null;
  i2ProductNumber: string | null;
  i2ReceivedUnitId: string | null;
  i2ArrivalId: string | null;
  i2InitialKg: string | null;
  i2MaterialTypeOptionId: string | null;
  i2ClassificationProfile: string | null;
  i2WeightBasis: string | null;
  i2Type: string | null;
  i2LocationId: string | null;
  productionUnitId: string | null;
  productionBatchId: string | null;
  productionCustomerId: string | null;
  productionInitialKg: string | null;
  productionDisposition: string | null;
}
export interface InventoryReadLedger {
  unitId: string;
  onHandDelta: string;
  reservedDelta: string;
}
export interface InventoryReadLinks {
  unitId: string;
  balanceOnHand: string | null;
  balanceReserved: string | null;
  claimKg: string | null;
  issueKg: string | null;
  issueCustomerId: string | null;
}
export interface InventoryDiscoveryStore {
  candidates(
    context: InventoryReadContext,
    selection: InventorySelection,
  ): Promise<readonly InventoryCandidate[]>;
  ledger(
    context: InventoryReadContext,
    unitIds: readonly string[],
  ): Promise<readonly InventoryReadLedger[]>;
  links(
    context: InventoryReadContext,
    unitIds: readonly string[],
  ): Promise<readonly InventoryReadLinks[]>;
}
export interface InventoryUnitSummary {
  unitId: string;
  lotId: string;
  kind: string;
  locationId: string;
  state: InventoryReadState;
  stockClass: 'CURRENT' | 'HISTORICAL';
  origin: InventoryOrigin;
  internalCode: string | null;
  productCode: string | null;
  productNumber: string | null;
  materialId: string | null;
  quantities: { onHandKg: string; reservedKg: string; unreservedKg: string };
}
export type InventoryUnitSource =
  | {
      family: 'LEGACY_RECEIPT';
      receiptId: string;
      initialKg: string;
      recordedCount: string;
      weightBasis: 'LEGACY_RECEIPT_MEASURED_TOTAL';
    }
  | {
      family: 'I2_RECEIVING';
      receivedUnitId: string;
      arrivalId: string;
      initialKg: string;
      materialTypeOptionId: string;
      classificationProfile: 'FACTORY_MATERIAL_V1';
      weightBasis: 'WH_ACCEPTED_DECLARED_UNIT_WEIGHT';
    }
  | {
      family: 'PRODUCTION';
      productBatchId: string;
      disposition: 'FINAL' | 'WIP' | 'RESIDUAL';
      initialKg: string;
      weightBasis: 'PRODUCTION_POSTED_OUTPUT';
    };
export interface InventoryUnitDetail extends InventoryUnitSummary {
  source: InventoryUnitSource;
}
export interface InventoryFreshness {
  observedAt: string;
  respondedAt: string;
  consistency: 'PAGE_SNAPSHOT';
  quantityBasis: 'LEDGER_VERIFIED_BALANCE';
}
export type InventoryReadPage = {
  items: InventoryUnitSummary[];
  nextCursor: string | null;
  lotId?: string;
};
export type InventoryReadResult = InventoryReadPage | { unit: InventoryUnitDetail };

function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
}
function names(value: Record<string, unknown>, allowed: readonly string[]) {
  if (Object.keys(value).some((key) => !allowed.includes(key))) invalid();
}
const filterKeys = [
  'unitId',
  'lotId',
  'materialId',
  'internalCode',
  'kind',
  'locationId',
  'state',
  'origin',
] as const;
export function parseInventoryReadInput(
  query: InventoryReadQuery,
  supplied: unknown,
): InventoryReadInput {
  if (
    !['DiscoverInventoryUnits', 'GetInventoryUnitDetail', 'ListInventoryLotUnits'].includes(query)
  )
    invalid();
  const value = object(supplied);
  names(
    value,
    query === 'GetInventoryUnitDetail'
      ? ['unitId']
      : query === 'ListInventoryLotUnits'
        ? ['lotId', 'limit', 'cursor']
        : ['filters', 'limit', 'cursor'],
  );
  const filters: InventoryFilters = {};
  if (query === 'GetInventoryUnitDetail' || query === 'ListInventoryLotUnits') {
    const field = query === 'GetInventoryUnitDetail' ? 'unitId' : 'lotId';
    if (!validUuid(value[field]) || value[field].length !== 36) invalid();
    filters[field] = value[field] as string;
  } else if (Object.hasOwn(value, 'filters')) {
    const f = object(value.filters);
    names(f, filterKeys);
    for (const key of filterKeys) {
      if (!Object.hasOwn(f, key)) continue;
      const v = f[key];
      if (key.endsWith('Id')) {
        if (!validUuid(v) || v.length !== 36) invalid();
      } else if (key === 'state') {
        if (!INVENTORY_CURRENT_STATES.includes(v as never)) invalid();
      } else if (key === 'origin') {
        if (!['LEGACY_RECEIPT', 'I2_RECEIVING', 'PRODUCTION'].includes(v as string)) invalid();
      } else if (
        typeof v !== 'string' ||
        !validUnicode(v) ||
        /[\u0000-\u001f\u007f-\u009f]/u.test(v) ||
        !v.length ||
        Buffer.byteLength(v) > (key === 'kind' ? 128 : 512) ||
        (key === 'internalCode' && (!v.trim() || [...v].length > 128))
      )
        invalid();
      Object.assign(filters, { [key]: v });
    }
  }
  const limit = value.limit === undefined ? 25 : value.limit;
  if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 50) invalid();
  if (
    Object.hasOwn(value, 'cursor') &&
    (typeof value.cursor !== 'string' || !value.cursor.length || value.cursor.length > 2048)
  )
    throw new InventoryReadError(400, 'invalid-cursor');
  return Object.freeze({
    filters: Object.freeze(filters),
    limit: limit as number,
    ...(value.cursor === undefined ? {} : { cursor: value.cursor as string }),
  });
}

interface CursorPayload {
  v: 1;
  query: InventoryReadQuery;
  afterUnitId: string;
  filterDigest: string;
  limit: number;
  bindingDigest: string;
  issuedAt: number;
  expiresAt: number;
}
export class InventoryReadCursors {
  constructor(
    private readonly secret: string,
    private readonly origin: string,
    private readonly now: () => number = Date.now,
  ) {}
  private mac(purpose: string, value: string): string {
    return createHmac('sha256', this.secret)
      .update(JSON.stringify([purpose, this.origin, value]))
      .digest('base64url');
  }
  private expected(
    query: InventoryReadQuery,
    input: InventoryReadInput,
    actor: ExecutionContext,
    binding: InventoryReadBinding,
  ) {
    if (
      !validUuid(binding.accountId) ||
      binding.personId !== actor.principal.subject ||
      !/^[0-9a-f]{64}$/u.test(binding.sessionDigest)
    )
      throw new InventoryReadError(403, 'forbidden');
    return {
      query,
      limit: input.limit,
      filterDigest: createHash('sha256')
        .update(
          canonicalJson({
            filters: input.filters as JsonObject,
            states:
              query === 'DiscoverInventoryUnits' ? INVENTORY_CURRENT_STATES : INVENTORY_READ_STATES,
            version: 1,
          }),
        )
        .digest('base64url'),
      bindingDigest: this.mac(
        'inventory-binding-v1',
        JSON.stringify([
          actor.installationId,
          actor.authorityScopeId,
          binding.accountId,
          binding.personId,
          actor.actorRole,
          binding.sessionDigest,
          'APR-048-INVENTORY-ONLY-v1',
        ]),
      ),
    };
  }
  position(
    query: InventoryReadQuery,
    input: InventoryReadInput,
    actor: ExecutionContext,
    binding: InventoryReadBinding,
  ): CursorPayload {
    const expected = this.expected(query, input, actor, binding);
    const now = Math.floor(this.now() / 1000);
    if (input.cursor === undefined)
      return { v: 1, afterUnitId: '', issuedAt: now, expiresAt: now + 600, ...expected };
    const bad = (): never => {
      throw new InventoryReadError(400, 'invalid-cursor');
    };
    try {
      if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/u.test(input.cursor) || input.cursor.length > 2048)
        return bad();
      const [encoded, signature] = input.cursor.split('.') as [string, string];
      const bytes = Buffer.from(encoded, 'base64url');
      if (bytes.toString('base64url') !== encoded) return bad();
      const actualMac = Buffer.from(signature, 'base64url'),
        expectedMac = Buffer.from(this.mac('inventory-cursor-v1', encoded), 'base64url');
      if (
        actualMac.toString('base64url') !== signature ||
        actualMac.length !== expectedMac.length ||
        !timingSafeEqual(actualMac, expectedMac)
      )
        return bad();
      const payload = object(parseBoundedJson(bytes));
      const keys = [
        'v',
        'query',
        'afterUnitId',
        'filterDigest',
        'limit',
        'bindingDigest',
        'issuedAt',
        'expiresAt',
      ];
      if (
        Object.keys(payload).length !== keys.length ||
        Object.keys(payload).some((key) => !keys.includes(key)) ||
        payload.v !== 1 ||
        !validUuid(payload.afterUnitId) ||
        payload.query !== expected.query ||
        payload.limit !== expected.limit ||
        payload.filterDigest !== expected.filterDigest ||
        payload.bindingDigest !== expected.bindingDigest ||
        !Number.isSafeInteger(payload.issuedAt) ||
        !Number.isSafeInteger(payload.expiresAt)
      )
        return bad();
      const p = payload as unknown as CursorPayload;
      if (
        p.issuedAt < 0 ||
        p.issuedAt > now ||
        p.expiresAt !== p.issuedAt + 600 ||
        now >= p.expiresAt
      )
        return bad();
      // The issued encoding is canonical too; a valid MAC is not a second encoding contract.
      if (!canonicalJson(payload as JsonObject).equals(bytes)) return bad();
      return p;
    } catch {
      return bad();
    }
  }
  next(position: CursorPayload, afterUnitId: string): string {
    const payload = Buffer.from(canonicalJson({ ...position, afterUnitId })).toString('base64url');
    const cursor = payload + '.' + this.mac('inventory-cursor-v1', payload);
    if (cursor.length > 2048) throw new InventoryReadError(422, 'query-limit');
    return cursor;
  }
}

const SCALE = 10n ** 18n;
function scaled(value: string): bigint {
  try {
    const normalized = Kg.parse(value).toString();
    const negative = normalized.startsWith('-'),
      [whole, fraction = ''] = normalized.replace('-', '').split('.');
    const n = BigInt(whole!) * SCALE + BigInt(fraction.padEnd(18, '0'));
    return negative ? -n : n;
  } catch {
    return incompatible();
  }
}
function exact(value: bigint): string {
  const negative = value < 0n,
    n = negative ? -value : value;
  const fraction = (n % SCALE).toString().padStart(18, '0').replace(/0+$/u, '');
  const text = `${negative ? '-' : ''}${n / SCALE}${fraction ? '.' + fraction : ''}`;
  try {
    return Kg.parse(text).toString();
  } catch {
    return incompatible();
  }
}
function id(value: string | null): string {
  if (!validUuid(value)) return incompatible();
  return value;
}
function text(value: string | null, maximum: number, nullable = false): string | null {
  if (nullable && value === null) return null;
  if (
    typeof value !== 'string' ||
    !value.length ||
    !validUnicode(value) ||
    Buffer.byteLength(value) > maximum ||
    /[\u0000-\u001f\u007f]/u.test(value)
  )
    return incompatible();
  return value;
}
function positive(value: string | null): string {
  if (typeof value !== 'string' || scaled(value) <= 0n) return incompatible();
  return exact(scaled(value));
}
function project(
  row: InventoryCandidate,
  links: InventoryReadLinks,
  totals: { onHand: bigint; reserved: bigint },
): InventoryUnitDetail {
  const { onHand, reserved } = totals;
  if (
    !INVENTORY_READ_STATES.includes(row.state) ||
    onHand < 0n ||
    reserved < 0n ||
    reserved > onHand ||
    links.balanceOnHand === null ||
    links.balanceReserved === null ||
    scaled(links.balanceOnHand) !== onHand ||
    scaled(links.balanceReserved) !== reserved
  )
    return incompatible();
  const claim = links.claimKg === null ? null : scaled(links.claimKg),
    issue = links.issueKg === null ? null : scaled(links.issueKg);
  if (
    (claim === null ? reserved !== 0n : claim <= 0n || claim !== reserved) ||
    (issue !== null &&
      (issue <= 0n ||
        !validUuid(links.issueCustomerId) ||
        (row.customerScope !== '' && row.customerScope !== links.issueCustomerId)))
  )
    return incompatible();
  const historical = row.state === 'CONSUMED' || row.state === 'SHIPPED';
  if (
    historical ? onHand !== 0n || reserved !== 0n || claim !== null || issue !== null : onHand <= 0n
  )
    return incompatible();
  if (row.state === 'AVAILABLE' && (reserved !== 0n || claim !== null || issue !== null))
    return incompatible();
  if (
    ['RESERVED', 'PACKED'].includes(row.state) &&
    (claim === null || issue !== null || (row.state === 'PACKED' && reserved !== onHand))
  )
    return incompatible();
  if (
    ['ISSUED_TO_PRODUCTION', 'PARTIALLY_CONSUMED'].includes(row.state) &&
    (issue === null || claim !== null || reserved !== 0n)
  )
    return incompatible();
  if ([row.legacyUnitId, row.i2UnitId, row.productionUnitId].filter((v) => v !== null).length !== 1)
    return incompatible();
  let source: InventoryUnitSource,
    internalCode: string | null = null,
    productCode: string | null = null,
    productNumber: string | null = null,
    materialId: string | null = null;
  if (row.legacyUnitId !== null) {
    if (
      row.legacyUnitId !== row.unitId ||
      row.legacyLotId !== row.lotId ||
      row.legacyType !== row.kind ||
      row.legacyLocationId !== row.locationId ||
      typeof row.legacyCount !== 'string' ||
      !/^(?:0|[1-9][0-9]{0,19})$/u.test(row.legacyCount)
    )
      return incompatible();
    internalCode = text(row.legacyInternalCode, 128);
    productCode = text(row.legacyProductCode, 128, true);
    materialId = id(row.legacyMaterialId);
    source = {
      family: 'LEGACY_RECEIPT',
      receiptId: id(row.legacyReceiptId),
      initialKg: positive(row.legacyInitialKg),
      recordedCount: row.legacyCount,
      weightBasis: 'LEGACY_RECEIPT_MEASURED_TOTAL',
    };
  } else if (row.i2UnitId !== null) {
    if (
      row.i2UnitId !== row.unitId ||
      row.i2LotId !== row.lotId ||
      row.i2Type !== row.kind ||
      row.i2LocationId !== row.locationId ||
      row.i2WeightBasis !== 'WH_ACCEPTED_DECLARED_UNIT_WEIGHT' ||
      row.i2ClassificationProfile !== 'FACTORY_MATERIAL_V1'
    )
      return incompatible();
    internalCode = text(row.i2InternalCode, 512);
    productNumber = text(row.i2ProductNumber, 512);
    materialId = id(row.i2MaterialId);
    source = {
      family: 'I2_RECEIVING',
      receivedUnitId: id(row.i2ReceivedUnitId),
      arrivalId: id(row.i2ArrivalId),
      initialKg: positive(row.i2InitialKg),
      materialTypeOptionId: id(row.i2MaterialTypeOptionId),
      classificationProfile: 'FACTORY_MATERIAL_V1',
      weightBasis: 'WH_ACCEPTED_DECLARED_UNIT_WEIGHT',
    };
  } else {
    if (
      row.productionUnitId !== row.unitId ||
      row.productionBatchId !== row.lotId ||
      !validUuid(row.productionCustomerId) ||
      row.productionCustomerId !== row.customerScope ||
      !['FINAL', 'WIP', 'RESIDUAL'].includes(row.productionDisposition as string)
    )
      return incompatible();
    source = {
      family: 'PRODUCTION',
      productBatchId: id(row.productionBatchId),
      disposition: row.productionDisposition as 'FINAL' | 'WIP' | 'RESIDUAL',
      initialKg: positive(row.productionInitialKg),
      weightBasis: 'PRODUCTION_POSTED_OUTPUT',
    };
  }
  return {
    unitId: id(row.unitId),
    lotId: id(row.lotId),
    kind: text(row.kind, 128)!,
    locationId: id(row.locationId),
    state: row.state,
    stockClass: historical ? 'HISTORICAL' : 'CURRENT',
    origin: source.family,
    internalCode,
    productCode,
    productNumber,
    materialId,
    quantities: {
      onHandKg: exact(onHand),
      reservedKg: exact(reserved),
      unreservedKg: exact(onHand - reserved),
    },
    source,
  };
}
/** Shared Inventory evidence verification; callers separately enforce admission and source scope. */
export function verifyInventoryReadEvidence(
  rows: readonly InventoryCandidate[],
  ledger: readonly InventoryReadLedger[],
  links: readonly InventoryReadLinks[],
): InventoryUnitDetail[] {
  const ids = rows.map((row) => row.unitId);
  if (rows.length > 51 || new Set(ids).size !== ids.length) return incompatible();
  if (ledger.length > 10000) throw new InventoryReadError(422, 'query-limit');
  const totals = new Map(ids.map((unitId) => [unitId, { onHand: 0n, reserved: 0n }]));
  for (const row of ledger) {
    const total = totals.get(row.unitId);
    if (!total) return incompatible();
    total.onHand += scaled(row.onHandDelta);
    total.reserved += scaled(row.reservedDelta);
  }
  const linkMap = new Map(links.map((row) => [row.unitId, row]));
  if (links.length !== rows.length || linkMap.size !== rows.length) return incompatible();
  return rows.map((row) =>
    project(row, linkMap.get(row.unitId) ?? incompatible(), totals.get(row.unitId)!),
  );
}

/** One bounded read projection. Composition privately admits the authentic actor/snapshot. */
export class InventoryDiscoveryService {
  constructor(
    private readonly store: InventoryDiscoveryStore,
    private readonly cursors: InventoryReadCursors,
    private readonly authorized: (context: InventoryReadContext) => boolean,
  ) {}
  async query(
    context: InventoryReadContext,
    query: InventoryReadQuery,
    supplied: unknown,
    binding: InventoryReadBinding,
  ): Promise<InventoryReadResult> {
    if (!this.authorized(context)) throw new InventoryReadError(403, 'forbidden');
    const input = parseInventoryReadInput(query, supplied),
      position = this.cursors.position(query, input, context.actor, binding);
    const rows = await this.store.candidates(context, {
      filters: input.filters,
      states: query === 'DiscoverInventoryUnits' ? INVENTORY_CURRENT_STATES : INVENTORY_READ_STATES,
      ...(position.afterUnitId ? { afterUnitId: position.afterUnitId } : {}),
      take: query === 'GetInventoryUnitDetail' ? 1 : input.limit + 1,
    });
    if (rows.length > (query === 'GetInventoryUnitDetail' ? 1 : input.limit + 1))
      return incompatible();
    if (rows.length === 0) {
      if (query !== 'DiscoverInventoryUnits') throw new InventoryReadError(404, 'not-found');
      return { items: [], nextCursor: null };
    }
    const ids = rows.map((row) => row.unitId),
      selected = new Set(ids);
    if (selected.size !== ids.length) return incompatible();
    const ledger = await this.store.ledger(context, ids);
    if (ledger.length > 10000) throw new InventoryReadError(422, 'query-limit');
    const links = await this.store.links(context, ids);
    const projected = verifyInventoryReadEvidence(rows, ledger, links);
    if (query === 'GetInventoryUnitDetail') return { unit: projected[0]! };
    const items = projected.slice(0, input.limit).map((unit): InventoryUnitSummary => ({
      unitId: unit.unitId,
      lotId: unit.lotId,
      kind: unit.kind,
      locationId: unit.locationId,
      state: unit.state,
      stockClass: unit.stockClass,
      origin: unit.origin,
      internalCode: unit.internalCode,
      productCode: unit.productCode,
      productNumber: unit.productNumber,
      materialId: unit.materialId,
      quantities: unit.quantities,
    }));
    return {
      ...(query === 'ListInventoryLotUnits' ? { lotId: input.filters.lotId! } : {}),
      items,
      nextCursor:
        projected.length > input.limit ? this.cursors.next(position, items.at(-1)!.unitId) : null,
    };
  }
}
