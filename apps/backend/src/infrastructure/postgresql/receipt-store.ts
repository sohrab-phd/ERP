import type {
  ReceiptContext,
  ReceiptRecord,
  ReceiptStore,
  StockIdentity,
} from '../../modules/procurement/index.js';
import { transactionClient } from './transaction.js';

const scope = (ctx: ReceiptContext) => [ctx.actor.installationId, ctx.actor.authorityScopeId];
const columns = `receipt_id AS id,binding,state,internal_code AS "internalCode",count::text AS count,
 measured_kg::text AS "measuredKg",type,location_id AS "locationId",product_code AS "productCode",
 lot_id AS "lotId",unit_id AS "unitId",material_id AS "materialId",effect_id AS "effectId"`;
/** Receipt owner only; Inventory is called through its public port on the same transaction. */
export class PostgresReceiptStore implements ReceiptStore {
  async lock(ctx: ReceiptContext, id: string) {
    await transactionClient(ctx.transaction).query(
      'SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
      [JSON.stringify(['goods-receipt', ...scope(ctx), id])],
    );
  }
  async find(ctx: ReceiptContext, id: string): Promise<ReceiptRecord | undefined> {
    const row = (
      await transactionClient(ctx.transaction).query<ReceiptRecord>(
        'SELECT ' +
          columns +
          ' FROM procurement.goods_receipt WHERE installation_id=$1 AND authority_scope=$2 AND receipt_id=$3',
        [...scope(ctx), id],
      )
    ).rows[0];
    if (!row) return undefined;
    return Object.fromEntries(
      Object.entries(row).filter(([, v]) => v !== null),
    ) as unknown as ReceiptRecord;
  }
  async create(ctx: ReceiptContext, r: ReceiptRecord) {
    await transactionClient(ctx.transaction).query(
      `INSERT INTO procurement.goods_receipt
   (installation_id,authority_scope,receipt_id,binding,state,internal_code,count,measured_kg,type,location_id,product_code,issuer,subject,actor_role,request_id,idempotency_key)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        ...scope(ctx),
        r.id,
        r.binding,
        r.state,
        r.internalCode,
        r.count,
        r.measuredKg,
        r.type,
        r.locationId,
        r.productCode ?? null,
        ctx.actor.principal.issuer,
        ctx.actor.principal.subject,
        ctx.actor.actorRole,
        ctx.actor.requestId,
        ctx.request.idempotency_key,
      ],
    );
  }
  async changeState(ctx: ReceiptContext, id: string, from: 'DRAFT', to: 'RECEIVED') {
    return (
      (
        await transactionClient(ctx.transaction).query(
          'UPDATE procurement.goods_receipt SET state=$4 WHERE installation_id=$1 AND authority_scope=$2 AND receipt_id=$3 AND state=$5',
          [...scope(ctx), id, to, from],
        )
      ).rowCount === 1
    );
  }
  async finish(ctx: ReceiptContext, id: string, s: StockIdentity) {
    return (
      (
        await transactionClient(ctx.transaction).query(
          `UPDATE procurement.goods_receipt SET state='POSTED',lot_id=$4,unit_id=$5,material_id=$6,effect_id=$7
   WHERE installation_id=$1 AND authority_scope=$2 AND receipt_id=$3 AND state='RECEIVED'`,
          [...scope(ctx), id, s.lotId, s.unitId, s.materialId, s.effectId],
        )
      ).rowCount === 1
    );
  }
}
