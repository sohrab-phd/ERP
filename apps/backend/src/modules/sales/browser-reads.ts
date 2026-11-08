import { validUnicode, validUuid, type TransactionContext } from '@navard/shared-kernel';
import type { SalesContext, SalesStore } from './contracts.js';

export type SalesReadKind =
  | 'customers/query'
  | 'orders/query'
  | 'orders/detail'
  | 'assessments/query'
  | 'assessments/detail'
  | 'stock/query';
export interface SalesReadInput {
  limit: number;
  cursor?: string;
  orderId?: string;
  assessmentId?: string;
  itemId?: string;
  filters: {
    orderId?: string;
    state?: string;
    itemType?: string;
    unitId?: string;
    internalCode?: string;
  };
}
export class SalesReadError extends Error {
  constructor(
    readonly status: 400 | 404 | 503,
    readonly error: 'invalid' | 'invalid-cursor' | 'not-found' | 'unavailable',
  ) {
    super('Sales read denied');
  }
}
const invalid = (): never => {
  throw new SalesReadError(400, 'invalid');
};
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
  return value as Record<string, unknown>;
}
function names(value: Record<string, unknown>, allowed: readonly string[]) {
  if (Object.keys(value).some((key) => !allowed.includes(key))) invalid();
}
export function parseSalesRead(kind: SalesReadKind, value: unknown): SalesReadInput {
  const raw = object(value);
  const lists = ['customers/query', 'orders/query', 'assessments/query', 'stock/query'];
  const allowed =
    kind === 'customers/query'
      ? ['limit', 'cursor']
      : kind === 'orders/query'
        ? ['filters', 'limit', 'cursor']
        : kind === 'orders/detail'
          ? ['orderId']
          : kind === 'assessments/query'
            ? ['orderId', 'limit', 'cursor']
            : kind === 'assessments/detail'
              ? ['assessmentId']
              : ['orderId', 'itemId', 'filters', 'limit', 'cursor'];
  names(raw, allowed);
  const result: SalesReadInput = { limit: 25, filters: {} };
  if (lists.includes(kind)) {
    if (raw.limit !== undefined) {
      if (![10, 25, 50].includes(raw.limit as number)) invalid();
      result.limit = raw.limit as number;
    }
    if (raw.cursor !== undefined) {
      if (typeof raw.cursor !== 'string' || !/^[A-Za-z0-9_.-]{1,2048}$/u.test(raw.cursor))
        throw new SalesReadError(400, 'invalid-cursor');
      result.cursor = raw.cursor;
    }
  }
  for (const key of ['orderId', 'assessmentId', 'itemId'] as const) {
    if (allowed.includes(key)) {
      if (!validUuid(raw[key]) || raw[key].length !== 36) invalid();
      result[key] = raw[key] as string;
    }
  }
  if (Object.hasOwn(raw, 'filters')) {
    const filters = object(raw.filters);
    names(
      filters,
      kind === 'orders/query' ? ['orderId', 'state', 'itemType'] : ['unitId', 'internalCode'],
    );
    for (const [key, value] of Object.entries(filters)) {
      if (key.endsWith('Id')) {
        if (!validUuid(value) || value.length !== 36) invalid();
      } else if (key === 'state') {
        if (!['DRAFT', 'SUBMITTED', 'CONFIRMED', 'IN_PRODUCTION'].includes(value as string))
          invalid();
      } else if (key === 'itemType') {
        if (!['COIL', 'SHEET', 'ANGLE', 'BEAM', 'OTHER'].includes(value as string)) invalid();
      } else if (
        typeof value !== 'string' ||
        !validUnicode(value) ||
        !value.trim() ||
        /[\u0000-\u001f\u007f-\u009f]/u.test(value) ||
        [...value].length > 128 ||
        Buffer.byteLength(value) > 512
      )
        invalid();
      Object.assign(result.filters, { [key]: value });
    }
  }
  return result;
}

/** Identity-issued private query principal; transport never serializes this object. */
export interface SalesRosterPrincipal {
  readonly installationId: string;
  readonly authorityScopeId: string;
  readonly accountId: string;
  readonly personId: string;
  readonly sessionDigest: string;
}
export interface SalesBrowserReadStore extends Pick<SalesStore, 'order' | 'assessment'> {
  customers(
    principal: SalesRosterPrincipal,
    tx: TransactionContext,
    afterId: string | undefined,
    take: number,
  ): Promise<readonly { customerId: string; displayName: string }[]>;
  orders(
    context: SalesContext,
    input: SalesReadInput,
    afterId?: string,
  ): Promise<
    readonly {
      orderId: string;
      customerId: string;
      customerName: string;
      state: string;
      itemCount: number;
      confirmedAt?: string;
      confirmedAssessmentId?: string;
    }[]
  >;
  assessments(
    context: SalesContext,
    orderId: string,
    limit: number,
    afterId?: string,
  ): Promise<
    readonly {
      assessmentId: string;
      orderId: string;
      customerId: string;
      state: string;
      mode?: string;
      observedAt?: string;
    }[]
  >;
}
export interface SalesStockReadPort {
  discover(
    context: SalesContext,
    input: {
      kind: string;
      unitId?: string;
      internalCode?: string;
      afterId?: string;
      limit: number;
    },
  ): Promise<
    readonly {
      unitId: string;
      internalCode: string | null;
      kind: string;
      state: 'AVAILABLE';
      availableKg: string;
    }[]
  >;
}
export class SalesBrowserReads {
  private readonly stockAdmissions = new WeakSet<object>();
  constructor(
    private readonly store: SalesBrowserReadStore,
    private readonly stock: SalesStockReadPort,
    private readonly admitted: (context: SalesContext) => boolean,
  ) {}
  stockReadAllowed(context: object): boolean {
    return this.stockAdmissions.has(context);
  }
  async query(
    context: SalesContext,
    kind: Exclude<SalesReadKind, 'customers/query'>,
    input: SalesReadInput,
    afterId?: string,
  ): Promise<unknown> {
    if (!this.admitted(context)) throw new SalesReadError(404, 'not-found');
    if (kind === 'orders/query') return this.store.orders(context, input, afterId);
    if (kind === 'orders/detail') {
      const row = await this.store.order(context, input.orderId!);
      if (!row) throw new SalesReadError(404, 'not-found');
      return {
        id: row.id,
        customerId: row.customerId,
        customerName: row.customerName,
        items: row.items.map((item) => ({
          id: item.id,
          type: item.type,
          description: item.description,
          demandedKg: item.demandedKg,
          allowPartialShipment: item.allowPartialShipment,
        })),
        commercialTerms: row.commercialTerms,
        state: row.state,
        ...(row.confirmedAt ? { confirmedAt: row.confirmedAt } : {}),
        ...(row.confirmedAssessmentId ? { confirmedAssessmentId: row.confirmedAssessmentId } : {}),
      };
    }
    if (kind === 'assessments/detail') {
      const row = await this.store.assessment(context, input.assessmentId!);
      if (!row) throw new SalesReadError(404, 'not-found');
      return {
        id: row.id,
        orderId: row.orderId,
        customerId: row.customerId,
        state: row.state,
        ...(row.mode ? { mode: row.mode } : {}),
        ...(row.selections
          ? {
              selections: row.selections.map((item) => ({
                itemId: item.itemId,
                unitIds: [...item.unitIds],
              })),
            }
          : {}),
        ...(row.stock
          ? {
              stock: row.stock.map((item) => ({
                unitId: item.unitId,
                kind: item.kind,
                state: item.state,
                availableKg: item.availableKg,
              })),
            }
          : {}),
        ...(row.observedAt ? { observedAt: row.observedAt } : {}),
      };
    }
    const order = await this.store.order(context, input.orderId!);
    if (!order) throw new SalesReadError(404, 'not-found');
    if (kind === 'assessments/query')
      return this.store.assessments(context, order.id, input.limit, afterId);
    const item = order.items.find((row) => row.id === input.itemId);
    if (!item || !['DRAFT', 'SUBMITTED'].includes(order.state))
      throw new SalesReadError(404, 'not-found');
    this.stockAdmissions.add(context);
    try {
      return await this.stock.discover(context, {
        kind: item.type,
        limit: input.limit,
        ...(input.filters.unitId ? { unitId: input.filters.unitId } : {}),
        ...(input.filters.internalCode ? { internalCode: input.filters.internalCode } : {}),
        ...(afterId ? { afterId } : {}),
      });
    } finally {
      this.stockAdmissions.delete(context);
    }
  }
}
