import { TechnicalError } from '@navard/shared-kernel';
import type {
  ShippingContext,
  ShippingStore,
  ShippingPackage,
  Shipment,
} from '../../modules/shipping/index.js';
import { transactionClient } from './transaction.js';
const scope = (ctx: ShippingContext) => [
  ctx.actor.installationId,
  ctx.actor.authorityScopeId,
  ctx.actor.customerScope,
];
const packageColumns = `p.package_id AS id,p.order_id AS "orderId",p.customer_id AS "customerId",p.binding,p.order_binding AS "orderBinding",p.state,p.shipment_id AS "shipmentId",p.created_at AS "createdAt",p.updated_at AS "updatedAt",p.issuer AS "actorIssuer",p.subject AS "actorSubject",COALESCE((SELECT jsonb_agg(jsonb_build_object('reservationId',c.reservation_id,'unitId',c.unit_id,'itemId',c.item_id,'kg',c.kg::text) ORDER BY c.reservation_id) FROM shipping.package_content c WHERE c.installation_id=p.installation_id AND c.authority_scope=p.authority_scope AND c.package_id=p.package_id),'[]'::jsonb) AS entries`;
const shipmentColumns = `s.shipment_id AS id,s.order_id AS "orderId",s.customer_id AS "customerId",s.binding,s.order_binding AS "orderBinding",s.state,s.created_at AS "createdAt",s.updated_at AS "updatedAt",s.dispatched_at AS "dispatchedAt",s.issuer AS "actorIssuer",s.subject AS "actorSubject",s.dispatch_issuer AS "dispatchIssuer",s.dispatch_subject AS "dispatchSubject",COALESCE((SELECT jsonb_agg(jsonb_build_object('reservationId',d.reservation_id,'unitId',d.unit_id,'itemId',d.item_id,'kg',d.kg::text) ORDER BY d.reservation_id) FROM shipping.dispatch d WHERE d.installation_id=s.installation_id AND d.authority_scope=s.authority_scope AND d.shipment_id=s.shipment_id),'[]'::jsonb) AS entries`;
function record<T>(row: Record<string, unknown> | undefined): T | undefined {
  if (!row) return undefined;
  return Object.fromEntries(
    Object.entries(row)
      .filter(([, v]) => v !== null)
      .map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v]),
  ) as T;
}
/** Shipping SQL only; supplied transaction binds all orchestration and IPS effects. */
export class PostgresShippingStore implements ShippingStore {
  async lockOrder(ctx: ShippingContext, id: string): Promise<void> {
    await transactionClient(ctx.transaction).query(
      'SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
      [JSON.stringify(['sales-order', ctx.actor.installationId, ctx.actor.authorityScopeId, id])],
    );
  }
  async lockDocuments(ctx: ShippingContext, ids: readonly string[]): Promise<void> {
    const client = transactionClient(ctx.transaction);
    const rows = (
      await client.query<{ key: string }>(
        `SELECT DISTINCT hashtextextended(value,0)::text AS key FROM unnest($1::text[]) value`,
        [
          [...new Set(ids)].map((id) =>
            JSON.stringify([
              'shipping-document',
              ctx.actor.installationId,
              ctx.actor.authorityScopeId,
              id,
            ]),
          ),
        ],
      )
    ).rows;
    rows.sort((a, b) =>
      BigInt(a.key) < BigInt(b.key) ? -1 : BigInt(a.key) > BigInt(b.key) ? 1 : 0,
    );
    for (const row of rows)
      await client.query('SELECT pg_advisory_xact_lock($1::bigint)', [row.key]);
  }
  async package(ctx: ShippingContext, id: string): Promise<ShippingPackage | undefined> {
    return record(
      (
        await transactionClient(ctx.transaction).query<Record<string, unknown>>(
          'SELECT ' +
            packageColumns +
            ' FROM shipping.package p WHERE p.installation_id=$1 AND p.authority_scope=$2 AND p.customer_id::text=$3 AND p.package_id=$4',
          [...scope(ctx), id],
        )
      ).rows[0],
    );
  }
  async shipment(ctx: ShippingContext, id: string): Promise<Shipment | undefined> {
    return record(
      (
        await transactionClient(ctx.transaction).query<Record<string, unknown>>(
          'SELECT ' +
            shipmentColumns +
            ' FROM shipping.shipment s WHERE s.installation_id=$1 AND s.authority_scope=$2 AND s.customer_id::text=$3 AND s.shipment_id=$4',
          [...scope(ctx), id],
        )
      ).rows[0],
    );
  }
  async packages(ctx: ShippingContext, shipmentId: string): Promise<readonly ShippingPackage[]> {
    return (
      await transactionClient(ctx.transaction).query<Record<string, unknown>>(
        'SELECT ' +
          packageColumns +
          ' FROM shipping.package p WHERE p.installation_id=$1 AND p.authority_scope=$2 AND p.customer_id::text=$3 AND p.shipment_id=$4 ORDER BY p.package_id',
        [...scope(ctx), shipmentId],
      )
    ).rows.map((row) => record<ShippingPackage>(row)!);
  }
  async shippedKg(ctx: ShippingContext, orderId: string, itemId: string): Promise<string> {
    const row = (
      await transactionClient(ctx.transaction).query<{ kg: string }>(
        "SELECT COALESCE(SUM(d.kg),0)::text AS kg FROM shipping.dispatch d JOIN shipping.shipment s USING(installation_id,authority_scope,shipment_id) WHERE s.installation_id=$1 AND s.authority_scope=$2 AND s.customer_id::text=$3 AND s.order_id=$4 AND d.item_id=$5 AND s.state='DISPATCHED'",
        [...scope(ctx), orderId, itemId],
      )
    ).rows[0];
    if (!row) throw new TechnicalError('incompatible');
    return row.kg;
  }
  async createPackage(ctx: ShippingContext, value: ShippingPackage): Promise<ShippingPackage> {
    const client = transactionClient(ctx.transaction);
    await client.query(
      `INSERT INTO shipping.package(installation_id,authority_scope,package_id,order_id,customer_id,binding,order_binding,state,issuer,subject) VALUES($1,$2,$3,$4,$5,$6,$7,'DRAFT',$8,$9)`,
      [
        ctx.actor.installationId,
        ctx.actor.authorityScopeId,
        value.id,
        value.orderId,
        value.customerId,
        value.binding,
        value.orderBinding,
        ctx.actor.principal.issuer,
        ctx.actor.principal.subject,
      ],
    );
    for (const entry of value.entries)
      await client.query(
        `INSERT INTO shipping.package_content(installation_id,authority_scope,package_id,reservation_id,unit_id,item_id,kg) VALUES($1,$2,$3,$4,$5,$6,$7)`,
        [
          ctx.actor.installationId,
          ctx.actor.authorityScopeId,
          value.id,
          entry.reservationId,
          entry.unitId,
          entry.itemId,
          entry.kg,
        ],
      );
    const result = await this.package(ctx, value.id);
    if (!result) throw new TechnicalError('incompatible');
    return result;
  }
  async createShipment(ctx: ShippingContext, value: Shipment): Promise<Shipment> {
    await transactionClient(ctx.transaction).query(
      `INSERT INTO shipping.shipment(installation_id,authority_scope,shipment_id,order_id,customer_id,binding,order_binding,state,issuer,subject) VALUES($1,$2,$3,$4,$5,$6,$7,'DRAFT',$8,$9)`,
      [
        ctx.actor.installationId,
        ctx.actor.authorityScopeId,
        value.id,
        value.orderId,
        value.customerId,
        value.binding,
        value.orderBinding,
        ctx.actor.principal.issuer,
        ctx.actor.principal.subject,
      ],
    );
    const result = await this.shipment(ctx, value.id);
    if (!result) throw new TechnicalError('incompatible');
    return result;
  }
  async packageState(
    ctx: ShippingContext,
    id: string,
    from: ShippingPackage['state'],
    to: ShippingPackage['state'],
    shipmentId?: string,
  ): Promise<ShippingPackage | undefined> {
    const result = await transactionClient(ctx.transaction).query(
      `UPDATE shipping.package SET state=$6,shipment_id=COALESCE($7::uuid,shipment_id),updated_at=clock_timestamp() WHERE installation_id=$1 AND authority_scope=$2 AND customer_id::text=$3 AND package_id=$4 AND state=$5`,
      [...scope(ctx), id, from, to, shipmentId ?? null],
    );
    return result.rowCount === 1 ? this.package(ctx, id) : undefined;
  }
  async shipmentState(
    ctx: ShippingContext,
    id: string,
    from: Shipment['state'],
    to: Shipment['state'],
  ): Promise<Shipment | undefined> {
    const result = await transactionClient(ctx.transaction).query(
      `UPDATE shipping.shipment SET state=$6,updated_at=clock_timestamp(),dispatched_at=CASE WHEN $6='DISPATCHED' THEN clock_timestamp() ELSE dispatched_at END,dispatch_issuer=CASE WHEN $6='DISPATCHED' THEN $7 ELSE dispatch_issuer END,dispatch_subject=CASE WHEN $6='DISPATCHED' THEN $8 ELSE dispatch_subject END WHERE installation_id=$1 AND authority_scope=$2 AND customer_id::text=$3 AND shipment_id=$4 AND state=$5`,
      [...scope(ctx), id, from, to, ctx.actor.principal.issuer, ctx.actor.principal.subject],
    );
    return result.rowCount === 1 ? this.shipment(ctx, id) : undefined;
  }
}
