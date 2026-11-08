import type {
  Customer,
  SalesContext,
  SalesStore,
  SalesOrder,
  FulfillmentAssessment,
  StockSelection,
  StockView,
  ReservationCompetitor,
  SalesRosterPrincipal,
  SalesReadInput,
} from '../../modules/sales/index.js';
import { transactionClient } from './transaction.js';
import type { TransactionContext } from '@navard/shared-kernel';
const scope = (ctx: SalesContext) => [
  ctx.actor.installationId,
  ctx.actor.authorityScopeId,
  ctx.actor.customerScope,
];
const orderColumns = `order_id AS id,customer_id AS "customerId",customer_name AS "customerName",items,commercial_terms AS "commercialTerms",binding,state,confirmed_at AS "confirmedAt",confirmed_assessment_id AS "confirmedAssessmentId"`;
const assessmentColumns = `assessment_id AS id,order_id AS "orderId",customer_id AS "customerId",order_binding AS "orderBinding",binding,state,fulfillment_mode AS mode,selections,stock,observed_at AS "observedAt"`;
function record<T>(row: object | undefined): T | undefined {
  if (!row) return undefined;
  return Object.fromEntries(
    Object.entries(row)
      .filter(([, v]) => v !== null)
      .map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v]),
  ) as T;
}
/** All resource lookups bind installation, authority AND customer; only Sales writes these records. */
export class PostgresSalesStore implements SalesStore {
  /** Same-snapshot read-only intersection. Identity mints the private principal;
   * SQL scopes current exact grants before Sales labels, ordering and LIMIT. */
  async customers(
    p: SalesRosterPrincipal,
    tx: TransactionContext,
    afterId: string | undefined,
    take: number,
  ) {
    return (
      await transactionClient(tx).query<{ customerId: string; displayName: string }>(
        `SELECT c.customer_id AS "customerId",c.display_name AS "displayName" FROM sales.customer c
       WHERE c.installation_id=$1 AND c.authority_scope=$2 AND ($6::uuid IS NULL OR c.customer_id>$6::uuid)
       AND EXISTS(SELECT 1 FROM identity.role_grant g JOIN identity.account a USING(installation_id,account_id)
         JOIN identity.session s USING(installation_id,account_id) WHERE g.installation_id=c.installation_id AND g.authority_scope_id=c.authority_scope
         AND g.account_id=$3 AND a.person_id=$4 AND s.token_digest=$5 AND g.actor_role='ACT-SALES' AND g.customer_scope=c.customer_id::text
         AND a.enabled AND s.revoked_at IS NULL AND s.expires_at>clock_timestamp() AND s.last_seen_at>clock_timestamp()-interval '30 minutes')
       ORDER BY c.customer_id LIMIT $7`,
        [
          p.installationId,
          p.authorityScopeId,
          p.accountId,
          p.personId,
          p.sessionDigest,
          afterId ?? null,
          take,
        ],
      )
    ).rows;
  }
  async orders(ctx: SalesContext, input: SalesReadInput, afterId?: string) {
    const rows = await transactionClient(ctx.transaction).query<{
      orderId: string;
      customerId: string;
      customerName: string;
      state: string;
      itemCount: number;
      confirmedAt?: string;
      confirmedAssessmentId?: string;
    }>(
      `SELECT order_id AS "orderId",customer_id AS "customerId",customer_name AS "customerName",state,jsonb_array_length(items) AS "itemCount",
       confirmed_at AS "confirmedAt",confirmed_assessment_id AS "confirmedAssessmentId" FROM sales.sales_order
       WHERE installation_id=$1 AND authority_scope=$2 AND customer_id=$3
       AND ($4::uuid IS NULL OR order_id>$4::uuid) AND ($5::uuid IS NULL OR order_id=$5::uuid)
       AND ($6::text IS NULL OR state=$6) AND ($7::text IS NULL OR EXISTS(SELECT 1 FROM jsonb_array_elements(items) i WHERE i->>'type'=$7))
       ORDER BY order_id LIMIT $8`,
      [
        ...scope(ctx),
        afterId ?? null,
        input.filters.orderId ?? null,
        input.filters.state ?? null,
        input.filters.itemType ?? null,
        input.limit + 1,
      ],
    );
    return rows.rows.map((row) => record<typeof row>(row)!);
  }
  async assessments(ctx: SalesContext, orderId: string, limit: number, afterId?: string) {
    const rows = await transactionClient(ctx.transaction).query<{
      assessmentId: string;
      orderId: string;
      customerId: string;
      state: string;
      mode?: string;
      observedAt?: string;
    }>(
      `SELECT assessment_id AS "assessmentId",order_id AS "orderId",customer_id AS "customerId",state,
       CASE WHEN state='RECORDED' THEN fulfillment_mode END AS mode,observed_at AS "observedAt"
       FROM sales.fulfillment_assessment WHERE installation_id=$1 AND authority_scope=$2 AND customer_id=$3 AND order_id=$4
       AND ($5::uuid IS NULL OR assessment_id>$5::uuid) ORDER BY assessment_id LIMIT $6`,
      [...scope(ctx), orderId, afterId ?? null, limit + 1],
    );
    return rows.rows.map((row) => record<typeof row>(row)!);
  }
  async reservationOrder(
    ctx: SalesContext,
    id: string,
    customerId: string,
  ): Promise<SalesOrder | undefined> {
    return record(
      (
        await transactionClient(ctx.transaction).query<Record<string, unknown>>(
          'SELECT ' +
            orderColumns +
            ' FROM sales.sales_order WHERE installation_id=$1 AND authority_scope=$2 AND order_id=$3 AND customer_id=$4',
          [ctx.actor.installationId, ctx.actor.authorityScopeId, id, customerId],
        )
      ).rows[0],
    );
  }
  async reservationAssessment(
    ctx: SalesContext,
    id: string,
    customerId: string,
  ): Promise<FulfillmentAssessment | undefined> {
    return record(
      (
        await transactionClient(ctx.transaction).query<Record<string, unknown>>(
          'SELECT ' +
            assessmentColumns +
            ' FROM sales.fulfillment_assessment WHERE installation_id=$1 AND authority_scope=$2 AND assessment_id=$3 AND customer_id=$4',
          [ctx.actor.installationId, ctx.actor.authorityScopeId, id, customerId],
        )
      ).rows[0],
    );
  }
  async reservationCompetitors(
    ctx: SalesContext,
    orderId: string,
    customerId: string,
    unitId: string,
  ): Promise<readonly ReservationCompetitor[]> {
    const result = await transactionClient(ctx.transaction).query<ReservationCompetitor>(
      `SELECT other_order.order_id AS "orderId",item->>'id' AS "itemId",item->>'demandedKg' AS "demandedKg"
      FROM sales.sales_order own JOIN sales.sales_order other_order ON other_order.installation_id=own.installation_id AND other_order.authority_scope=own.authority_scope
      JOIN sales.fulfillment_assessment a ON a.installation_id=other_order.installation_id AND a.authority_scope=other_order.authority_scope AND a.assessment_id=other_order.confirmed_assessment_id
      CROSS JOIN LATERAL jsonb_array_elements(other_order.items) item
      WHERE own.installation_id=$1 AND own.authority_scope=$2 AND own.order_id=$3 AND own.customer_id=$4 AND own.state='CONFIRMED' AND other_order.state='CONFIRMED'
      AND (other_order.confirmed_at,other_order.order_id)<(own.confirmed_at,own.order_id)
      AND EXISTS(SELECT 1 FROM jsonb_array_elements(a.selections) selection WHERE selection->>'itemId'=item->>'id' AND selection->'unitIds' ? $5)
      ORDER BY other_order.confirmed_at,other_order.order_id`,
      [ctx.actor.installationId, ctx.actor.authorityScopeId, orderId, customerId, unitId],
    );
    return result.rows;
  }
  async lockOrder(ctx: SalesContext, id: string) {
    await transactionClient(ctx.transaction).query<Record<string, unknown>>(
      'SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
      [JSON.stringify(['sales-order', ctx.actor.installationId, ctx.actor.authorityScopeId, id])],
    );
  }
  async lockAssessment(ctx: SalesContext, id: string) {
    await transactionClient(ctx.transaction).query<Record<string, unknown>>(
      'SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
      [
        JSON.stringify([
          'sales-assessment',
          ctx.actor.installationId,
          ctx.actor.authorityScopeId,
          id,
        ]),
      ],
    );
  }
  productionOrder(
    ctx: SalesContext,
    id: string,
    customerId: string,
  ): Promise<SalesOrder | undefined> {
    return this.reservationOrder(ctx, id, customerId);
  }
  async recordMakeAssessment(
    ctx: SalesContext,
    id: string,
  ): Promise<FulfillmentAssessment | undefined> {
    return record(
      (
        await transactionClient(ctx.transaction).query<Record<string, unknown>>(
          "UPDATE sales.fulfillment_assessment SET state='RECORDED',fulfillment_mode='MAKE',observed_at=clock_timestamp() WHERE installation_id=$1 AND authority_scope=$2 AND customer_id=$3 AND assessment_id=$4 AND state='DRAFT' RETURNING " +
            assessmentColumns,
          [...scope(ctx), id],
        )
      ).rows[0],
    );
  }
  async startMake(
    ctx: SalesContext,
    orderId: string,
    productionOrderId: string,
    itemId: string,
  ): Promise<boolean> {
    const client = transactionClient(ctx.transaction);
    await client.query(
      'INSERT INTO sales.make_reference(installation_id,authority_scope,order_id,customer_id,production_order_id,item_id,issuer,subject) VALUES($1,$2,$4,$3,$5,$6,$7,$8) ON CONFLICT(installation_id,authority_scope,production_order_id) DO NOTHING',
      [
        ...scope(ctx),
        orderId,
        productionOrderId,
        itemId,
        ctx.actor.principal.issuer,
        ctx.actor.principal.subject,
      ],
    );
    const match = (
      await client.query(
        'SELECT 1 FROM sales.make_reference WHERE installation_id=$1 AND authority_scope=$2 AND customer_id=$3 AND order_id=$4 AND production_order_id=$5 AND item_id=$6',
        [...scope(ctx), orderId, productionOrderId, itemId],
      )
    ).rowCount;
    if (match !== 1) return false;
    await client.query(
      "UPDATE sales.sales_order SET state='IN_PRODUCTION' WHERE installation_id=$1 AND authority_scope=$2 AND customer_id=$3 AND order_id=$4 AND state='CONFIRMED'",
      [...scope(ctx), orderId],
    );
    return true;
  }
  async customer(ctx: SalesContext, id: string): Promise<Customer | undefined> {
    return record(
      (
        await transactionClient(ctx.transaction).query<Record<string, unknown>>(
          'SELECT customer_id AS id,display_name AS "displayName" FROM sales.customer WHERE installation_id=$1 AND authority_scope=$2 AND customer_id=$3 AND customer_id=$4',
          [...scope(ctx), id],
        )
      ).rows[0],
    );
  }
  async order(ctx: SalesContext, id: string): Promise<SalesOrder | undefined> {
    return record(
      (
        await transactionClient(ctx.transaction).query<Record<string, unknown>>(
          'SELECT ' +
            orderColumns +
            ' FROM sales.sales_order WHERE installation_id=$1 AND authority_scope=$2 AND customer_id=$3 AND order_id=$4',
          [...scope(ctx), id],
        )
      ).rows[0],
    );
  }
  async createOrder(ctx: SalesContext, r: SalesOrder) {
    await transactionClient(ctx.transaction).query<Record<string, unknown>>(
      `INSERT INTO sales.sales_order(installation_id,authority_scope,customer_id,order_id,customer_name,items,commercial_terms,binding,state,issuer,subject) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8,'DRAFT',$9,$10)`,
      [
        ...scope(ctx),
        r.id,
        r.customerName,
        JSON.stringify(r.items),
        r.commercialTerms,
        r.binding,
        ctx.actor.principal.issuer,
        ctx.actor.principal.subject,
      ],
    );
  }
  async submitOrder(ctx: SalesContext, id: string) {
    return (
      (
        await transactionClient(ctx.transaction).query<Record<string, unknown>>(
          "UPDATE sales.sales_order SET state='SUBMITTED' WHERE installation_id=$1 AND authority_scope=$2 AND customer_id=$3 AND order_id=$4 AND state='DRAFT'",
          [...scope(ctx), id],
        )
      ).rowCount === 1
    );
  }
  async confirmOrder(
    ctx: SalesContext,
    id: string,
    assessmentId: string,
  ): Promise<SalesOrder | undefined> {
    return record(
      (
        await transactionClient(ctx.transaction).query<Record<string, unknown>>(
          "UPDATE sales.sales_order SET state='CONFIRMED',confirmed_at=clock_timestamp(),confirmed_assessment_id=$5 WHERE installation_id=$1 AND authority_scope=$2 AND customer_id=$3 AND order_id=$4 AND state='SUBMITTED' RETURNING " +
            orderColumns,
          [...scope(ctx), id, assessmentId],
        )
      ).rows[0],
    );
  }
  async assessment(ctx: SalesContext, id: string): Promise<FulfillmentAssessment | undefined> {
    return record(
      (
        await transactionClient(ctx.transaction).query<Record<string, unknown>>(
          'SELECT ' +
            assessmentColumns +
            ' FROM sales.fulfillment_assessment WHERE installation_id=$1 AND authority_scope=$2 AND customer_id=$3 AND assessment_id=$4',
          [...scope(ctx), id],
        )
      ).rows[0],
    );
  }
  async createAssessment(ctx: SalesContext, r: FulfillmentAssessment) {
    await transactionClient(ctx.transaction).query<Record<string, unknown>>(
      "INSERT INTO sales.fulfillment_assessment(installation_id,authority_scope,customer_id,assessment_id,order_id,order_binding,binding,state) VALUES($1,$2,$3,$4,$5,$6,$7,'DRAFT')",
      [...scope(ctx), r.id, r.orderId, r.orderBinding, r.binding],
    );
  }
  async recordAssessment(
    ctx: SalesContext,
    id: string,
    selections: readonly StockSelection[],
    stock: readonly StockView[],
  ): Promise<FulfillmentAssessment | undefined> {
    return record(
      (
        await transactionClient(ctx.transaction).query<Record<string, unknown>>(
          "UPDATE sales.fulfillment_assessment SET state='RECORDED',selections=$5::jsonb,stock=$6::jsonb,observed_at=clock_timestamp() WHERE installation_id=$1 AND authority_scope=$2 AND customer_id=$3 AND assessment_id=$4 AND state='DRAFT' RETURNING " +
            assessmentColumns,
          [...scope(ctx), id, JSON.stringify(selections), JSON.stringify(stock)],
        )
      ).rows[0],
    );
  }
}
