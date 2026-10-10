import { BusinessRejection, validUuid } from '@navard/shared-kernel';
import type {
  ProductionStore,
  ProductionTraceContext,
  ProductionTraceFact,
  ProductionTraceSourcePort,
  ProductionContext,
  ProductionOrder,
  ProductionOperation as Operation,
  MaterialAllocation as Allocation,
  ProductionFact,
} from '../../modules/production/index.js';
import { transactionClient } from './transaction.js';
const scope = (c: ProductionContext) => [
  c.actor.installationId,
  c.actor.authorityScopeId,
  c.actor.customerScope,
];
export class PostgresProductionStore implements ProductionStore, ProductionTraceSourcePort {
  async traceSources(
    c: ProductionTraceContext,
    kind: 'UNIT' | 'FACT' | 'OPERATION' | 'ORDER' | 'BATCH' | 'SALES_ORDER',
    id: string,
  ): Promise<readonly ProductionTraceFact[]> {
    if (!validUuid(c.customerId))
      throw new BusinessRejection({ family: 'GUARD_ACTOR', message: 'Trace customer required' });
    const response = await transactionClient(c.transaction).query<ProductionTraceFact>(
      `SELECT f.fact_id AS id,f.kind,f.data,f.operation_id AS "operationId",f.order_id AS "productionOrderId",p.sales_order_id AS "salesOrderId",f.occurred_at AS "occurredAt"
       FROM production.source_fact f JOIN production.production_order p USING(installation_id,authority_scope,customer_id,order_id)
       WHERE f.installation_id=$1 AND f.authority_scope=$2 AND f.customer_id=$3::uuid
       AND (f.kind IN('CONSUMPTION','OUTPUT','RESIDUAL','SCRAP','FINALIZED') OR ($5<>'UNIT' AND f.kind IN('ENTRY','REFERRAL','DECLARATION')))
       AND (($5='UNIT' AND (f.data->>'unitId'=$4 OR f.data->>'sourceUnitId'=$4 OR f.data->'sourceUnitIds' @> jsonb_build_array($4::text)))
         OR ($5='FACT' AND f.fact_id=$4::uuid) OR ($5='OPERATION' AND f.operation_id=$4::uuid)
         OR ($5='ORDER' AND f.order_id=$4::uuid) OR ($5='BATCH' AND f.data->>'productBatchId'=$4)
         OR ($5='SALES_ORDER' AND p.sales_order_id=$4::uuid))
       ORDER BY f.occurred_at,f.fact_id LIMIT 257`,
      [c.actor.installationId, c.actor.authorityScopeId, c.customerId, id, kind],
    );
    return response.rows.map((row) => ({
      ...row,
      occurredAt: new Date(row.occurredAt).toISOString(),
    }));
  }

  async batch(c: ProductionContext, id: string, orderId: string, operationId: string) {
    await transactionClient(c.transaction).query(
      'INSERT INTO production.product_batch(installation_id,authority_scope,customer_id,batch_id,order_id,operation_id) VALUES($1,$2,$3,$4,$5,$6)',
      [...scope(c), id, orderId, operationId],
    );
  }

  async lockSalesOrder(c: ProductionContext, id: string) {
    await transactionClient(c.transaction).query(
      'SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
      [JSON.stringify(['sales-order', c.actor.installationId, c.actor.authorityScopeId, id])],
    );
  }
  async lockOrder(c: ProductionContext, id: string) {
    await transactionClient(c.transaction).query(
      'SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
      [JSON.stringify(['production-order', c.actor.installationId, c.actor.authorityScopeId, id])],
    );
  }
  private async read<T>(
    c: ProductionContext,
    table: 'production_order' | 'operation' | 'allocation',
    column: string,
    id: string,
  ): Promise<T | undefined> {
    const r = await transactionClient(c.transaction).query<{ record: T }>(
      'SELECT record FROM production.' +
        table +
        ' WHERE installation_id=$1 AND authority_scope=$2 AND customer_id=$3 AND ' +
        column +
        '=$4',
      [...scope(c), id],
    );
    return r.rows[0]?.record;
  }
  order(c: ProductionContext, id: string) {
    return this.read<ProductionOrder>(c, 'production_order', 'order_id', id);
  }
  operation(c: ProductionContext, id: string) {
    return this.read<Operation>(c, 'operation', 'operation_id', id);
  }
  allocation(c: ProductionContext, id: string) {
    return this.read<Allocation>(c, 'allocation', 'allocation_id', id);
  }
  async operations(c: ProductionContext, id: string) {
    return (
      await transactionClient(c.transaction).query<{ record: Operation }>(
        "SELECT record FROM production.operation WHERE installation_id=$1 AND authority_scope=$2 AND customer_id=$3 AND order_id=$4 AND operation_id IN (SELECT (step->>'id')::uuid FROM production.production_order p CROSS JOIN LATERAL jsonb_array_elements(p.record->'route') step WHERE p.installation_id=$1 AND p.authority_scope=$2 AND p.customer_id=$3 AND p.order_id=$4) ORDER BY (record->>'index')::int",
        [...scope(c), id],
      )
    ).rows.map((r) => r.record);
  }
  async allocations(c: ProductionContext, id: string) {
    return (
      await transactionClient(c.transaction).query<{ record: Allocation }>(
        'SELECT record FROM production.allocation WHERE installation_id=$1 AND authority_scope=$2 AND customer_id=$3 AND order_id=$4 ORDER BY allocation_id',
        [...scope(c), id],
      )
    ).rows.map((r) => r.record);
  }
  async saveOrder(c: ProductionContext, o: ProductionOrder, create = false) {
    const client = transactionClient(c.transaction);
    if (create)
      await client.query(
        'INSERT INTO production.production_order(installation_id,authority_scope,customer_id,order_id,sales_order_id,item_id,record,state) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8)',
        [...scope(c), o.id, o.salesOrderId, o.itemId, JSON.stringify(o), o.state],
      );
    else
      await client.query(
        'UPDATE production.production_order SET record=$5::jsonb,state=$6 WHERE installation_id=$1 AND authority_scope=$2 AND customer_id=$3 AND order_id=$4',
        [...scope(c), o.id, JSON.stringify(o), o.state],
      );
    if (o.state === 'PLANNED')
      await client.query(
        'INSERT INTO production.route_snapshot(installation_id,authority_scope,order_id,version,route) VALUES($1,$2,$3,$4,$5::jsonb) ON CONFLICT DO NOTHING',
        [
          c.actor.installationId,
          c.actor.authorityScopeId,
          o.id,
          o.routeVersion,
          JSON.stringify(o.route),
        ],
      );
  }
  async saveOperation(c: ProductionContext, o: Operation, create = false) {
    const client = transactionClient(c.transaction);
    if (create)
      await client.query(
        'INSERT INTO production.operation(installation_id,authority_scope,customer_id,operation_id,order_id,record,state) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7)',
        [...scope(c), o.id, o.productionOrderId, JSON.stringify(o), o.state],
      );
    else
      await client.query(
        'UPDATE production.operation SET record=$5::jsonb,state=$6 WHERE installation_id=$1 AND authority_scope=$2 AND customer_id=$3 AND operation_id=$4',
        [...scope(c), o.id, JSON.stringify(o), o.state],
      );
  }
  async saveAllocation(c: ProductionContext, a: Allocation, create = false) {
    const client = transactionClient(c.transaction);
    if (create)
      await client.query(
        'INSERT INTO production.allocation(installation_id,authority_scope,customer_id,allocation_id,order_id,record,state) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7)',
        [...scope(c), a.id, a.productionOrderId, JSON.stringify(a), a.state],
      );
    else
      await client.query(
        'UPDATE production.allocation SET record=$5::jsonb,state=$6 WHERE installation_id=$1 AND authority_scope=$2 AND customer_id=$3 AND allocation_id=$4',
        [...scope(c), a.id, JSON.stringify(a), a.state],
      );
  }
  async facts(c: ProductionContext, id: string) {
    const r = await transactionClient(c.transaction).query<ProductionFact>(
      'SELECT fact_id AS id,order_id AS "productionOrderId",operation_id AS "operationId",kind,data,jsonb_build_object(\'issuer\',issuer,\'subject\',subject,\'role\',actor_role) AS actor,occurred_at AS "occurredAt" FROM production.source_fact WHERE installation_id=$1 AND authority_scope=$2 AND customer_id=$3 AND order_id=$4 ORDER BY occurred_at,fact_id',
      [...scope(c), id],
    );
    return r.rows.map((x) => ({ ...x, occurredAt: new Date(x.occurredAt!).toISOString() }));
  }
  async fact(c: ProductionContext, f: ProductionFact) {
    await transactionClient(c.transaction).query(
      'INSERT INTO production.source_fact(installation_id,authority_scope,customer_id,fact_id,order_id,operation_id,kind,data,issuer,subject,command_key,actor_role) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12)',
      [
        ...scope(c),
        f.id,
        f.productionOrderId,
        f.operationId,
        f.kind,
        JSON.stringify(f.data),
        c.actor.principal.issuer,
        f.actor.subject,
        c.request.idempotency_key,
        f.actor.role,
      ],
    );
  }
}
