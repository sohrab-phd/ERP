import type { ExecutionContext, JsonObject, TransactionContext } from '@navard/shared-kernel';

export const genealogyRootKinds = [
  'UNIT',
  'LOT',
  'RECEIPT',
  'PACKAGE',
  'SHIPMENT',
  'FACT',
  'OPERATION',
  'ORDER',
  'BATCH',
  'SALES_ORDER',
] as const;
export type GenealogyRootKind = (typeof genealogyRootKinds)[number];
export interface GenealogyReference {
  readonly kind: GenealogyRootKind;
  readonly id: string;
}
export type GenealogyQuery = 'TraceForward' | 'TraceBackward';
/** The composition root supplies current authorization and one read-only snapshot. */
export interface GenealogyContext {
  readonly actor: ExecutionContext;
  readonly transaction: TransactionContext;
  readonly customerId: string;
}
export interface GenealogyUnit {
  readonly id: string;
  readonly lotId: string;
  readonly kind: string;
  readonly state: string;
}
export interface GenealogyReceiptOrigin {
  readonly receiptId: string;
  readonly lotId: string;
  readonly unitId: string;
  readonly materialId: string;
  readonly effectId: string;
  readonly internalCode: string;
  readonly count: string;
  readonly measuredKg: string;
  readonly type: string;
  readonly locationId: string;
  readonly productCode?: string;
}
export interface GenealogyProductionFact {
  readonly id: string;
  readonly kind:
    | 'CONSUMPTION'
    | 'OUTPUT'
    | 'RESIDUAL'
    | 'SCRAP'
    | 'FINALIZED'
    | 'ENTRY'
    | 'REFERRAL'
    | 'DECLARATION';
  readonly data: JsonObject;
  readonly operationId: string;
  readonly productionOrderId: string;
  readonly salesOrderId: string;
  readonly occurredAt?: string;
}
export interface GenealogyShippingEntry {
  readonly unitId: string;
  readonly reservationId: string;
  readonly itemId: string;
  readonly kg: string;
}
export interface GenealogyPackage {
  readonly id: string;
  readonly orderId: string;
  readonly state: 'DRAFT' | 'PACKED' | 'ASSIGNED_TO_SHIPMENT' | 'UNPACKED';
  readonly shipmentId?: string;
  readonly entries: readonly GenealogyShippingEntry[];
}
export interface GenealogyShipment {
  readonly id: string;
  readonly orderId: string;
  readonly state: 'DRAFT' | 'READY' | 'LOADING' | 'DISPATCHED';
  readonly dispatch: readonly (GenealogyShippingEntry & { readonly packageId: string })[];
  readonly dispatchedAt?: string;
}
export type GenealogyProductionReference =
  'UNIT' | 'FACT' | 'OPERATION' | 'ORDER' | 'BATCH' | 'SALES_ORDER';
export type GenealogyShippingReference = 'UNIT' | 'PACKAGE' | 'SHIPMENT' | 'SALES_ORDER';
export interface GenealogyShippingSources {
  readonly packages: readonly GenealogyPackage[];
  readonly shipments: readonly GenealogyShipment[];
}
/** Local structural contracts: no imports of another module's internal records. */
export interface GenealogySourcePorts {
  readonly inventory: {
    unit(context: GenealogyContext, id: string): Promise<GenealogyUnit | undefined>;
    origins(
      context: GenealogyContext,
      reference: 'UNIT' | 'LOT' | 'RECEIPT',
      id: string,
    ): Promise<readonly GenealogyReceiptOrigin[]>;
  };
  readonly production: {
    facts(
      context: GenealogyContext,
      reference: GenealogyProductionReference,
      id: string,
    ): Promise<readonly GenealogyProductionFact[]>;
  };
  readonly shipping: {
    sources(
      context: GenealogyContext,
      reference: GenealogyShippingReference,
      id: string,
    ): Promise<GenealogyShippingSources>;
  };
}
export interface GenealogyAssociations {
  readonly factId?: string;
  readonly operationId?: string;
  readonly productionOrderId?: string;
  readonly salesOrderId?: string;
  readonly batchId?: string;
}
export interface GenealogyEvent extends GenealogyAssociations {
  readonly kind: GenealogyProductionFact['kind'];
  readonly kg?: string;
  readonly occurredAt?: string;
}
export interface GenealogyNode {
  readonly key: string;
  readonly kind: GenealogyRootKind | 'SCRAP';
  readonly id: string;
  readonly state?: string;
  readonly materialKind?: string;
  readonly lotId?: string;
  readonly intake?: {
    readonly internalCode: string;
    readonly type: string;
    readonly count: string;
    readonly measuredKg: string;
    readonly productCode?: string;
  };
  readonly dispatchedAt?: string;
  readonly events: readonly GenealogyEvent[];
  /** Association seeds are references, never inferred material ancestry. */
  readonly references?: readonly GenealogyReference[];
}
export interface GenealogyEdge extends GenealogyAssociations {
  readonly key: string;
  readonly from: string;
  readonly to: string;
  readonly kind: 'ORIGIN' | 'OUTPUT' | 'RESIDUAL' | 'SCRAP' | 'PACKAGE_CONTENT' | 'DISPATCH';
  readonly kg: string;
  /** Output kg is the complete result, not the contribution of each parent. */
  readonly kgMeaning:
    'RECEIPT_TOTAL' | 'RESULT_TOTAL' | 'SCRAP_TOTAL' | 'PACKAGE_CONTENT' | 'DISPATCH_CONTENT';
  readonly reservationId?: string;
  readonly itemId?: string;
  readonly unitId?: string;
}
export interface GenealogyTrace {
  readonly query: GenealogyQuery;
  readonly root: GenealogyReference;
  readonly nodes: readonly GenealogyNode[];
  readonly edges: readonly GenealogyEdge[];
}
