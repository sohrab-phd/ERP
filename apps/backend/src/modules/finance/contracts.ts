import type { CommandRequest, ExecutionContext, TransactionContext } from '@navard/shared-kernel';

export interface InvoiceEvidenceContext {
  actor: ExecutionContext;
  request: CommandRequest;
  transaction: TransactionContext;
}
export interface InvoiceEvidenceInput {
  invoiceDocumentReference: string;
  issueDate: string;
  salesOrderId: string;
  customerId: string;
}
export interface InvoiceEvidence extends InvoiceEvidenceInput {
  id: string;
  binding: string;
  issuer: string;
  subject: string;
  recordedAt: string;
}
export interface InvoiceEvidenceStore {
  lock(ctx: InvoiceEvidenceContext, id: string): Promise<void>;
  evidence(ctx: InvoiceEvidenceContext, id: string): Promise<InvoiceEvidence | undefined>;
  record(
    ctx: InvoiceEvidenceContext,
    id: string,
    binding: string,
    input: InvoiceEvidenceInput,
  ): Promise<void>;
}
/** Sales validates canonical references; Finance never reads or writes Sales tables. */
export interface InvoiceSalesPort {
  reference(
    ctx: InvoiceEvidenceContext,
    orderId: string,
    customerId: string,
  ): Promise<{ id: string; customerId: string } | undefined>;
}
export interface InvoiceEvidencePolicy {
  current(ctx: InvoiceEvidenceContext): Promise<boolean>;
}
