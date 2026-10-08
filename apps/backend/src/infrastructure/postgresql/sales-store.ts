import type {
  Customer,
  SalesContext,
  SalesStore,
  SalesOrder,
  FulfillmentAssessment,
  StockSelection,
  StockView,
} from '../../modules/sales/index.js';
import { transactionClient } from './transaction.js';
const scope = (ctx: SalesContext) => [
  ctx.actor.installationId,
  ctx.actor.authorityScopeId,
  ctx.actor.customerScope,
];
const orderColumns = `order_id AS id,customer_id AS "customerId",customer_name AS "customerName",items,commercial_terms AS "commercialTerms",binding,state,confirmed_at AS "confirmedAt",confirmed_assessment_id AS "confirmedAssessmentId"`;
const assessmentColumns = `assessment_id AS id,order_id AS "orderId",customer_id AS "customerId",order_binding AS "orderBinding",binding,state,selections,stock,observed_at AS "observedAt"`;
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
