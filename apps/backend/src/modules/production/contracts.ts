import type {
  CommandRequest,
  ExecutionContext,
  TransactionContext,
  JsonObject,
} from '@navard/shared-kernel';
export const stations = [
  'HEAVY_ROLL_OPENER',
  'LIGHT_ROLL_HOT',
  'LIGHT_ROLL_COLD_GALVANIZED',
  'GUILLOTINE_6M',
  'GUILLOTINE_3M',
  'GUILLOTINE_2M',
  'GUILLOTINE_1M',
  'ANGLE_SHEAR',
  'PUNCH',
  'PLASMA',
] as const;
export type Station = (typeof stations)[number];
export interface ProductionContext {
  request: CommandRequest;
  actor: ExecutionContext;
  transaction: TransactionContext;
}
export interface ProductionTraceContext {
  actor: ExecutionContext;
  transaction: TransactionContext;
  customerId: string;
}
export interface ProductionTraceFact {
  id: string;
  kind:
    | 'CONSUMPTION'
    | 'OUTPUT'
    | 'RESIDUAL'
    | 'SCRAP'
    | 'FINALIZED'
    | 'ENTRY'
    | 'REFERRAL'
    | 'DECLARATION';
  data: JsonObject;
  operationId: string;
  productionOrderId: string;
  salesOrderId: string;
  occurredAt: string;
}
export interface ProductionTraceSourcePort {
  traceSources(
    context: ProductionTraceContext,
    kind: 'UNIT' | 'FACT' | 'OPERATION' | 'ORDER' | 'BATCH' | 'SALES_ORDER',
    id: string,
  ): Promise<readonly ProductionTraceFact[]>;
}
export interface ProductionOrder {
  id: string;
  salesOrderId: string;
  itemId: string;
  customerId: string;
  orderBinding: string;
  state:
    | 'DRAFT'
    | 'PLANNED'
    | 'RELEASED'
    | 'IN_PROGRESS'
    | 'PARTIALLY_COMPLETED'
    | 'COMPLETED'
    | 'CLOSED';
  routeVersion: number;
  route: readonly { id: string; station: Station }[];
}
export interface ProductionOperation {
  id: string;
  productionOrderId: string;
  index: number;
  station: Station;
  state: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
}
export interface MaterialAllocation {
  id: string;
  productionOrderId: string;
  kg: string;
  unitId?: string;
  state: 'PLANNED' | 'ASSIGNED' | 'ISSUED' | 'RELEASED';
}
export interface ProductionFact {
  id: string;
  productionOrderId: string;
  operationId: string;
  kind:
    | 'CONSUMPTION'
    | 'OUTPUT'
    | 'RESIDUAL'
    | 'SCRAP'
    | 'FINALIZED'
    | 'ENTRY'
    | 'REFERRAL'
    | 'DECLARATION';
  data: JsonObject;
  actor: { issuer: string; subject: string; role: string };
  occurredAt?: string;
}
export interface ProductionStore {
  batch(ctx: ProductionContext, id: string, orderId: string, operationId: string): Promise<void>;
  lockSalesOrder(ctx: ProductionContext, id: string): Promise<void>;
  lockOrder(ctx: ProductionContext, id: string): Promise<void>;
  order(ctx: ProductionContext, id: string): Promise<ProductionOrder | undefined>;
  saveOrder(ctx: ProductionContext, value: ProductionOrder, create?: boolean): Promise<void>;
  operation(ctx: ProductionContext, id: string): Promise<ProductionOperation | undefined>;
  operations(ctx: ProductionContext, id: string): Promise<readonly ProductionOperation[]>;
  saveOperation(
    ctx: ProductionContext,
    value: ProductionOperation,
    create?: boolean,
  ): Promise<void>;
  allocation(ctx: ProductionContext, id: string): Promise<MaterialAllocation | undefined>;
  allocations(ctx: ProductionContext, id: string): Promise<readonly MaterialAllocation[]>;
  saveAllocation(
    ctx: ProductionContext,
    value: MaterialAllocation,
    create?: boolean,
  ): Promise<void>;
  facts(ctx: ProductionContext, id: string): Promise<readonly ProductionFact[]>;
  fact(ctx: ProductionContext, value: ProductionFact): Promise<void>;
}
export interface ProductionDemand {
  id: string;
  customerId: string;
  binding: string;
  confirmedAt: string;
  items: readonly { id: string; type: string; demandedKg: string; allowPartialShipment: boolean }[];
}
export interface ProductionDemandPort {
  demand(
    ctx: ProductionContext,
    id: string,
    customerId: string,
  ): Promise<ProductionDemand | undefined>;
  start(
    ctx: ProductionContext,
    salesOrderId: string,
    productionOrderId: string,
    itemId: string,
  ): Promise<void>;
}
export interface ProductionPolicy {
  current(ctx: ProductionContext): Promise<boolean>;
  canDispose(ctx: ProductionContext): Promise<boolean>;
}
export interface ProductionMaterial {
  unitId: string;
  kg: string;
  kind: string;
  locationId: string;
  state: string;
}
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
export interface ProductionInventoryPort {
  inspect(
    ctx: ProductionContext,
    orderId: string,
    ids: readonly string[],
  ): Promise<readonly ProductionMaterial[]>;
  issue(
    ctx: ProductionContext,
    orderId: string,
    ids: readonly string[],
  ): Promise<readonly ProductionMaterial[]>;
  complete(ctx: ProductionContext, batch: ProductionBatch): Promise<void>;
}
