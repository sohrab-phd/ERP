import {
  validUnicode,
  validUuid,
  type ExecutionContext,
  type TransactionContext,
} from '@navard/shared-kernel';
import {
  InventoryReadError,
  verifyInventoryReadEvidence,
  type InventoryCandidate,
  type InventoryReadContext,
  type InventoryReadLedger,
  type InventoryReadLinks,
} from './discovery.js';

export interface InventorySalesStockContext {
  actor: ExecutionContext;
  transaction: TransactionContext;
}
export interface InventorySalesStockInput {
  kind: string;
  unitId?: string;
  internalCode?: string;
  afterId?: string;
  limit: number;
}
export interface InventorySalesStockSelection {
  kind: string;
  unitId?: string;
  afterId?: string;
  take: number;
}
export interface InventorySalesStockCandidate {
  unitId: string;
  internalCode: null;
  kind: string;
  state: 'AVAILABLE';
  availableKg: string;
}
export interface InventorySalesDiscoveryStore {
  salesCandidates(
    context: InventoryReadContext,
    selection: InventorySalesStockSelection,
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
export interface InventorySalesDiscoveryPolicy {
  /** Composition admits this exact context only during an authorized Sales order/item read. */
  canRead(context: InventorySalesStockContext): Promise<boolean>;
}
const kinds = ['COIL', 'SHEET', 'ANGLE', 'BEAM', 'OTHER'];
const fail = (status: 400 | 403 | 503, error: string): never => {
  throw new InventoryReadError(status, error);
};

/** APR-050 Sales-only projection; it does not inherit Warehouse disclosure authority. */
export class InventorySalesDiscoveryService {
  constructor(
    private readonly store: InventorySalesDiscoveryStore,
    private readonly policy: InventorySalesDiscoveryPolicy,
  ) {}
  async discover(
    context: InventorySalesStockContext,
    input: InventorySalesStockInput,
  ): Promise<readonly InventorySalesStockCandidate[]> {
    // Preserve caller object identity: policy checks the exact admitted Sales read context.
    if (
      context.actor.actorRole !== 'ACT-SALES' ||
      context.actor.temporary === true ||
      !validUuid(context.actor.customerScope) ||
      !(await this.policy.canRead(context))
    )
      return fail(403, 'forbidden');
    if (
      !kinds.includes(input.kind) ||
      ![10, 25, 50].includes(input.limit) ||
      (input.unitId !== undefined && (!validUuid(input.unitId) || input.unitId.length !== 36)) ||
      (input.afterId !== undefined && (!validUuid(input.afterId) || input.afterId.length !== 36)) ||
      Object.keys(input).some(
        (key) => !['kind', 'unitId', 'internalCode', 'afterId', 'limit'].includes(key),
      )
    )
      return fail(400, 'invalid');
    if (input.internalCode !== undefined) {
      const code = input.internalCode;
      if (
        typeof code !== 'string' ||
        !validUnicode(code) ||
        !code.trim() ||
        [...code].length > 128 ||
        Buffer.byteLength(code) > 512 ||
        /[\u0000-\u001f\u007f-\u009f]/u.test(code)
      )
        return fail(400, 'invalid');
      // Legacy and I2 codes are unrestricted user-entered business strings; production has none.
      // No existing origin has a confidentiality-safe code provenance. Match only the empty
      // disclosure-safe code set, without querying existence of any supplied private code.
      return [];
    }
    const rows = await this.store.salesCandidates(context, {
      kind: input.kind,
      ...(input.unitId === undefined ? {} : { unitId: input.unitId }),
      ...(input.afterId === undefined ? {} : { afterId: input.afterId }),
      take: input.limit + 1,
    });
    if (
      rows.length > input.limit + 1 ||
      rows.some(
        (row) =>
          row.kind !== input.kind ||
          row.state !== 'AVAILABLE' ||
          (row.customerScope !== '' && row.customerScope !== context.actor.customerScope) ||
          (input.unitId !== undefined && row.unitId !== input.unitId) ||
          (input.afterId !== undefined && row.unitId <= input.afterId),
      )
    )
      return fail(503, 'unavailable');
    if (rows.length === 0) return [];
    const ids = rows.map((row) => row.unitId);
    const ledger = await this.store.ledger(context, ids);
    if (ledger.length > 10000) return fail(503, 'unavailable');
    const links = await this.store.links(context, ids);
    return verifyInventoryReadEvidence(rows, ledger, links).map((row) => ({
      unitId: row.unitId,
      internalCode: null,
      kind: row.kind,
      state: 'AVAILABLE' as const,
      availableKg: row.quantities.unreservedKg,
    }));
  }
}
