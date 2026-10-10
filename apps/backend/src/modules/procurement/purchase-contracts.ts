import type { ReceiptContext } from './contracts.js';

export type PurchaseContext = ReceiptContext;
export interface CompletedPurchaseInput {
  purchaseDocumentReference: string;
  supplierReference: string;
  purchaseDate: string;
  materialDescription: string;
}
export interface PurchaseProformaInput {
  purchaseId: string;
  proformaReference: string;
  sentDate: string;
}
export interface EvidenceAttribution {
  issuer: string;
  subject: string;
  recordedAt: string;
}
export interface CompletedPurchase extends CompletedPurchaseInput, EvidenceAttribution {
  id: string;
  binding: string;
}
export interface PurchaseProforma extends PurchaseProformaInput, EvidenceAttribution {
  id: string;
  binding: string;
}
export interface PurchaseStore {
  lock(
    ctx: PurchaseContext,
    kind: 'purchase-record' | 'purchase-proforma',
    id: string,
  ): Promise<void>;
  purchase(ctx: PurchaseContext, id: string): Promise<CompletedPurchase | undefined>;
  proforma(ctx: PurchaseContext, id: string): Promise<PurchaseProforma | undefined>;
  recordPurchase(
    ctx: PurchaseContext,
    id: string,
    binding: string,
    input: CompletedPurchaseInput,
  ): Promise<void>;
  recordProforma(
    ctx: PurchaseContext,
    id: string,
    binding: string,
    input: PurchaseProformaInput,
  ): Promise<void>;
}
export interface PurchasePolicy {
  current(ctx: PurchaseContext): Promise<boolean>;
}
