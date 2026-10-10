import type {
  InvoiceEvidence,
  InvoiceEvidenceContext,
  InvoiceEvidenceInput,
  InvoiceEvidenceStore,
} from '../../modules/finance/index.js';
import { transactionClient } from './transaction.js';
const scope = (ctx: InvoiceEvidenceContext) => [
  ctx.actor.installationId,
  ctx.actor.authorityScopeId,
];
/** Finance-owned persistence. Sales reference validation stays behind its owner port. */
export class PostgresInvoiceEvidenceStore implements InvoiceEvidenceStore {
  async lock(ctx: InvoiceEvidenceContext, id: string) {
    await transactionClient(ctx.transaction).query(
      'SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
      [JSON.stringify(['invoice-evidence', ...scope(ctx), id])],
    );
  }
  async evidence(ctx: InvoiceEvidenceContext, id: string) {
    return (
      await transactionClient(ctx.transaction).query<InvoiceEvidence>(
        'SELECT evidence_id AS id,binding,invoice_document_reference AS "invoiceDocumentReference",issue_date::text AS "issueDate",sales_order_id AS "salesOrderId",customer_id AS "customerId",issuer,subject,recorded_at::text AS "recordedAt" FROM finance.invoice_evidence WHERE installation_id=$1 AND authority_scope=$2 AND evidence_id=$3',
        [...scope(ctx), id],
      )
    ).rows[0];
  }
  async record(
    ctx: InvoiceEvidenceContext,
    id: string,
    binding: string,
    input: InvoiceEvidenceInput,
  ) {
    await transactionClient(ctx.transaction).query(
      'INSERT INTO finance.invoice_evidence(installation_id,authority_scope,evidence_id,binding,invoice_document_reference,issue_date,sales_order_id,customer_id,issuer,subject,actor_role,request_id,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [
        ...scope(ctx),
        id,
        binding,
        input.invoiceDocumentReference,
        input.issueDate,
        input.salesOrderId,
        input.customerId,
        ctx.actor.principal.issuer,
        ctx.actor.principal.subject,
        ctx.actor.actorRole,
        ctx.actor.requestId,
        ctx.request.idempotency_key,
      ],
    );
  }
}
