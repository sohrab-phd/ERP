import type {
  CompletedPurchase,
  CompletedPurchaseInput,
  PurchaseContext,
  PurchaseProforma,
  PurchaseProformaInput,
  PurchaseStore,
} from '../../modules/procurement/index.js';
import { transactionClient } from './transaction.js';

const scope = (ctx: PurchaseContext) => [ctx.actor.installationId, ctx.actor.authorityScopeId];
const attribution = 'issuer,subject,recorded_at::text AS "recordedAt"';
const evidence = (ctx: PurchaseContext) => [
  ctx.actor.principal.issuer,
  ctx.actor.principal.subject,
  ctx.actor.actorRole,
  ctx.actor.requestId,
  ctx.request.idempotency_key,
];
/** Procurement immutable evidence; no SQL access to any other owner's tables. */
export class PostgresPurchaseStore implements PurchaseStore {
  async lock(ctx: PurchaseContext, kind: 'purchase-record' | 'purchase-proforma', id: string) {
    await transactionClient(ctx.transaction).query(
      'SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
      [JSON.stringify([kind, ...scope(ctx), id])],
    );
  }
  async purchase(ctx: PurchaseContext, id: string) {
    return (
      await transactionClient(ctx.transaction).query<CompletedPurchase>(
        'SELECT purchase_id AS id,binding,purchase_document_reference AS "purchaseDocumentReference",supplier_reference AS "supplierReference",purchase_date::text AS "purchaseDate",material_description AS "materialDescription",' +
          attribution +
          ' FROM procurement.completed_purchase WHERE installation_id=$1 AND authority_scope=$2 AND purchase_id=$3',
        [...scope(ctx), id],
      )
    ).rows[0];
  }
  async proforma(ctx: PurchaseContext, id: string) {
    return (
      await transactionClient(ctx.transaction).query<PurchaseProforma>(
        'SELECT proforma_id AS id,binding,purchase_id AS "purchaseId",proforma_reference AS "proformaReference",sent_date::text AS "sentDate",' +
          attribution +
          ' FROM procurement.purchase_proforma_sent WHERE installation_id=$1 AND authority_scope=$2 AND proforma_id=$3',
        [...scope(ctx), id],
      )
    ).rows[0];
  }
  async recordPurchase(
    ctx: PurchaseContext,
    id: string,
    binding: string,
    input: CompletedPurchaseInput,
  ) {
    await transactionClient(ctx.transaction).query(
      'INSERT INTO procurement.completed_purchase(installation_id,authority_scope,purchase_id,binding,purchase_document_reference,supplier_reference,purchase_date,material_description,issuer,subject,actor_role,request_id,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [
        ...scope(ctx),
        id,
        binding,
        input.purchaseDocumentReference,
        input.supplierReference,
        input.purchaseDate,
        input.materialDescription,
        ...evidence(ctx),
      ],
    );
  }
  async recordProforma(
    ctx: PurchaseContext,
    id: string,
    binding: string,
    input: PurchaseProformaInput,
  ) {
    await transactionClient(ctx.transaction).query(
      'INSERT INTO procurement.purchase_proforma_sent(installation_id,authority_scope,proforma_id,binding,purchase_id,proforma_reference,sent_date,issuer,subject,actor_role,request_id,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
      [
        ...scope(ctx),
        id,
        binding,
        input.purchaseId,
        input.proformaReference,
        input.sentDate,
        ...evidence(ctx),
      ],
    );
  }
}
