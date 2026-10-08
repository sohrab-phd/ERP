import type { CommandRequest, ExecutionContext, TransactionContext } from '@navard/shared-kernel';

export const receiptTypes = ['COIL', 'SHEET', 'ANGLE', 'BEAM', 'OTHER'] as const;
export type ReceiptType = (typeof receiptTypes)[number];
export interface ReceiptInput {
  internalCode: string;
  count: string;
  measuredKg: string;
  type: ReceiptType;
  locationId: string;
  productCode?: string;
}
export interface ReceiptContext {
  actor: ExecutionContext;
  request: CommandRequest;
  transaction: TransactionContext;
}
export interface StockIdentity {
  lotId: string;
  unitId: string;
  materialId: string;
  effectId: string;
}
export interface ReceiptRecord extends ReceiptInput, Partial<StockIdentity> {
  id: string;
  binding: string;
  state: 'DRAFT' | 'RECEIVED' | 'POSTED';
}
/** Receipt lifecycle belongs to Procurement; quantity writes belong to the Inventory port. */
export interface ReceiptStore {
  lock(context: ReceiptContext, id: string): Promise<void>;
  find(context: ReceiptContext, id: string): Promise<ReceiptRecord | undefined>;
  create(context: ReceiptContext, record: ReceiptRecord): Promise<void>;
  changeState(context: ReceiptContext, id: string, from: 'DRAFT', to: 'RECEIVED'): Promise<boolean>;
  finish(context: ReceiptContext, id: string, stock: StockIdentity): Promise<boolean>;
}
export interface InventoryReceiptPort {
  receive(context: ReceiptContext, receiptId: string, input: ReceiptInput): Promise<StockIdentity>;
}
export interface ReceiptPolicy {
  canPost?(context: ReceiptContext): Promise<boolean>;
  canRead(context: ReceiptContext): Promise<boolean>;
}
