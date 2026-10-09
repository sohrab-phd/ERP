import { TechnicalError } from '@navard/shared-kernel';
import {
  productionEffectId,
  type InventoryProductionStore,
  type PostingContext,
  type ProductionIssue,
  type ProductionOrigin,
} from '../../modules/inventory/index.js';
import { transactionClient } from './transaction.js';
const scope = (context: PostingContext) => [
  context.actor.installationId,
  context.actor.authorityScopeId,
  context.actor.customerScope,
];
export class PostgresInventoryProductionStore implements InventoryProductionStore {
  async activeIssue(context: PostingContext, unitId: string): Promise<ProductionIssue | undefined> {
    return (
      await transactionClient(context.transaction).query<ProductionIssue>(
        `SELECT unit_id AS "unitId",production_order_id AS "productionOrderId",customer_id AS "customerId",kg::text AS kg FROM inventory.production_issue WHERE installation_id=$1 AND authority_scope=$2 AND customer_id::text=$3 AND unit_id=$4 AND state='ACTIVE'`,
        [...scope(context), unitId],
      )
    ).rows[0];
  }
  async recordIssue(context: PostingContext, issue: ProductionIssue): Promise<void> {
    if (issue.customerId !== context.actor.customerScope) throw new TechnicalError('incompatible');
    await transactionClient(context.transaction).query(
      'INSERT INTO inventory.production_issue(installation_id,authority_scope,customer_id,unit_id,production_order_id,kg,issuer,subject) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      [
        ...scope(context),
        issue.unitId,
        issue.productionOrderId,
        issue.kg,
        context.actor.principal.issuer,
        context.actor.principal.subject,
      ],
    );
  }
  async closeIssue(
    context: PostingContext,
    unitId: string,
    productionOrderId: string,
  ): Promise<void> {
    const result = await transactionClient(context.transaction).query(
      `UPDATE inventory.production_issue SET state='COMPLETED',completed_at=clock_timestamp() WHERE installation_id=$1 AND authority_scope=$2 AND customer_id::text=$3 AND unit_id=$4 AND production_order_id=$5 AND state='ACTIVE'`,
      [...scope(context), unitId, productionOrderId],
    );
    if (result.rowCount !== 1) throw new TechnicalError('incompatible');
  }
  async origin(context: PostingContext, unitId: string): Promise<ProductionOrigin | undefined> {
    return (
      await transactionClient(context.transaction).query<ProductionOrigin>(
        'SELECT unit_id AS "unitId",production_order_id AS "productionOrderId",customer_id AS "customerId",kg::text AS kg,operation_id AS "operationId",source_fact_id AS "factId",product_batch_id AS "lotId",disposition FROM inventory.production_origin WHERE installation_id=$1 AND authority_scope=$2 AND customer_id::text=$3 AND unit_id=$4',
        [...scope(context), unitId],
      )
    ).rows[0];
  }
  async recordOrigin(context: PostingContext, origin: ProductionOrigin): Promise<void> {
    if (origin.customerId !== context.actor.customerScope) throw new TechnicalError('incompatible');
    await transactionClient(context.transaction).query(
      'INSERT INTO inventory.production_origin(installation_id,authority_scope,customer_id,unit_id,production_order_id,operation_id,product_batch_id,source_fact_id,stock_effect_id,kg,disposition,issuer,subject) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [
        ...scope(context),
        origin.unitId,
        origin.productionOrderId,
        origin.operationId,
        origin.lotId,
        origin.factId,
        productionEffectId(origin.operationId, origin.unitId, 'OUTPUT'),
        origin.kg,
        origin.disposition,
        context.actor.principal.issuer,
        context.actor.principal.subject,
      ],
    );
  }
}
