import type { CommandRequest, ExecutionContext, TransactionContext } from '@navard/shared-kernel';

export const salesTypes = ['COIL', 'SHEET', 'ANGLE', 'BEAM', 'OTHER'] as const;
export type SalesType = (typeof salesTypes)[number];
export interface SalesContext {
  actor: ExecutionContext;
  request: CommandRequest;
  transaction: TransactionContext;
}
export interface Customer {
  id: string;
  displayName: string;
}
export interface SalesItem {
  id: string;
  type: SalesType;
  description: string;
  demandedKg: string;
  allowPartialShipment: boolean;
}
export interface SalesOrder {
  id: string;
  customerId: string;
  customerName: string;
  items: readonly SalesItem[];
  commercialTerms: 'NOT_SUPPLIED';
  binding: string;
  state: 'DRAFT' | 'SUBMITTED' | 'CONFIRMED';
  confirmedAt?: string;
  confirmedAssessmentId?: string;
}
export interface StockSelection {
  itemId: string;
  unitIds: readonly string[];
}
export interface StockView {
  unitId: string;
  kind: string;
  state: string;
  availableKg: string;
}
export interface FulfillmentAssessment {
  id: string;
  orderId: string;
  orderBinding: string;
  customerId: string;
  binding: string;
  state: 'DRAFT' | 'RECORDED';
  selections?: readonly StockSelection[];
  stock?: readonly StockView[];
  observedAt?: string;
}
/** Sales-owned persistence; all lookups are customer-scoped on the supplied transaction. */
export interface SalesStore {
  lockOrder(context: SalesContext, id: string): Promise<void>;
  customer(context: SalesContext, id: string): Promise<Customer | undefined>;
  order(context: SalesContext, id: string): Promise<SalesOrder | undefined>;
  createOrder(context: SalesContext, order: SalesOrder): Promise<void>;
  submitOrder(context: SalesContext, id: string): Promise<boolean>;
  confirmOrder(
    context: SalesContext,
    id: string,
    assessmentId: string,
  ): Promise<SalesOrder | undefined>;
  lockAssessment(context: SalesContext, id: string): Promise<void>;
  assessment(context: SalesContext, id: string): Promise<FulfillmentAssessment | undefined>;
  createAssessment(context: SalesContext, assessment: FulfillmentAssessment): Promise<void>;
  recordAssessment(
    context: SalesContext,
    id: string,
    selections: readonly StockSelection[],
    stock: readonly StockView[],
  ): Promise<FulfillmentAssessment | undefined>;
}
/** Inventory availability is a read; it neither reserves nor guarantees future stock. */
export interface InventorySalesPort {
  readStock(context: SalesContext, unitIds: readonly string[]): Promise<readonly StockView[]>;
}
export interface SalesPolicy {
  canAccess(context: SalesContext, customerId: string): Promise<boolean>;
}
