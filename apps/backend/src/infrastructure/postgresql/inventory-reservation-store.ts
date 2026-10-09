import { TechnicalError } from '@navard/shared-kernel';
import type {
  PostingContext,
  ReservationRequest,
  ReservationRequestStore,
} from '../../modules/inventory/index.js';
import { transactionClient } from './transaction.js';
const columns =
  'reservation_id AS id,order_id AS "orderId",item_id AS "itemId",unit_id AS "unitId",customer_id AS "customerId",kg::text AS kg,binding,order_binding AS "orderBinding",confirmed_at AS "confirmedAt",state,requested_at AS "requestedAt",activated_at AS "activatedAt",dispatch_id AS "dispatchId",consumed_at AS "consumedAt"';
const scope = (ctx: PostingContext): [string, string] => [
  ctx.actor.installationId,
  ctx.actor.authorityScopeId,
];
function record(row: Record<string, unknown> | undefined): ReservationRequest | undefined {
  if (!row) return undefined;
  return Object.fromEntries(
    Object.entries(row)
      .filter(([, value]) => value !== null)
      .map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]),
  ) as unknown as ReservationRequest;
}
/** Only requested/active intent documents are written here; quantity remains ACT-IPS. */
export class PostgresReservationRequestStore implements ReservationRequestStore {
  async activeCustomer(ctx: PostingContext, unitId: string): Promise<string | undefined> {
    return (
      await transactionClient(ctx.transaction).query<{ customerId: string }>(
        `SELECT request.customer_id AS "customerId" FROM inventory.reservation_request request JOIN inventory.reservation claim ON claim.installation_id=request.installation_id AND claim.authority_scope=request.authority_scope AND claim.reservation_id=request.reservation_id AND claim.unit_id=request.unit_id AND claim.demand_id=request.order_id AND claim.kg=request.kg WHERE request.installation_id=$1 AND request.authority_scope=$2 AND request.unit_id=$3 AND request.state='ACTIVE' AND claim.state='ACTIVE'`,
        [...scope(ctx), unitId],
      )
    ).rows[0]?.customerId;
  }
  async lockOrder(ctx: PostingContext, id: string): Promise<void> {
    await transactionClient(ctx.transaction).query(
      'SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
      [JSON.stringify(['sales-order', ...scope(ctx), id])],
    );
  }
  async lockRequest(ctx: PostingContext, id: string): Promise<void> {
    await transactionClient(ctx.transaction).query(
      'SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
      [JSON.stringify(['inventory-request', ...scope(ctx), id])],
    );
  }
  async get(ctx: PostingContext, id: string): Promise<ReservationRequest | undefined> {
    return record(
      (
        await transactionClient(ctx.transaction).query<Record<string, unknown>>(
          'SELECT ' +
            columns +
            " FROM inventory.reservation_request WHERE installation_id=$1 AND authority_scope=$2 AND reservation_id=$3 AND (customer_id::text=$4 OR ($4 IS NULL AND $5='ACT-WH'))",
          [...scope(ctx), id, ctx.actor.customerScope ?? null, ctx.actor.actorRole],
        )
      ).rows[0],
    );
  }
  async aggregate(ctx: PostingContext, orderId: string, itemId: string): Promise<string> {
    const row = (
      await transactionClient(ctx.transaction).query<{ kg: string }>(
        'SELECT COALESCE(SUM(kg),0)::text AS kg FROM inventory.reservation_request WHERE installation_id=$1 AND authority_scope=$2 AND order_id=$3 AND item_id=$4',
        [...scope(ctx), orderId, itemId],
      )
    ).rows[0];
    if (!row) throw new TechnicalError('incompatible');
    return row.kg;
  }
  /** Internal monotone demand coverage: live claims plus verified consumed outbound facts. */
  async activeKg(ctx: PostingContext, orderId: string, itemId: string): Promise<string> {
    const row = (
      await transactionClient(ctx.transaction).query<{ kg: string }>(
        "SELECT COALESCE(SUM(r.kg),0)::text AS kg FROM inventory.reservation_request q JOIN inventory.reservation r ON r.installation_id=q.installation_id AND r.authority_scope=q.authority_scope AND r.reservation_id=q.reservation_id AND r.unit_id=q.unit_id AND r.demand_id=q.order_id AND r.kg=q.kg WHERE q.installation_id=$1 AND q.authority_scope=$2 AND q.order_id=$3 AND q.item_id=$4 AND ((q.state='ACTIVE' AND r.state='ACTIVE') OR (q.state='CONSUMED' AND r.state='CONSUMED' AND EXISTS(SELECT 1 FROM inventory.ledger l WHERE l.installation_id=q.installation_id AND l.authority_scope=q.authority_scope AND l.unit_id=q.unit_id AND l.effect_id=q.out_effect_id AND l.source_fact_id=q.dispatch_id AND l.command_id='DispatchShipment' AND l.on_hand_delta=-q.kg AND l.reserved_delta=0) AND EXISTS(SELECT 1 FROM inventory.ledger l WHERE l.installation_id=q.installation_id AND l.authority_scope=q.authority_scope AND l.unit_id=q.unit_id AND l.effect_id=q.consume_effect_id AND l.source_fact_id=q.dispatch_id AND l.command_id='DispatchShipment' AND l.on_hand_delta=0 AND l.reserved_delta=-q.kg)))",
        [...scope(ctx), orderId, itemId],
      )
    ).rows[0];
    if (!row) throw new TechnicalError('incompatible');
    return row.kg;
  }
  async consume(
    ctx: PostingContext,
    id: string,
    shipmentId: string,
    releaseEffectId: string,
    outEffectId: string,
  ): Promise<void> {
    const result = await transactionClient(ctx.transaction).query(
      "UPDATE inventory.reservation_request SET state='CONSUMED',dispatch_id=$4,consume_effect_id=$5,out_effect_id=$6,consumed_at=clock_timestamp() WHERE installation_id=$1 AND authority_scope=$2 AND reservation_id=$3 AND state='ACTIVE' AND customer_id::text=$7",
      [
        ...scope(ctx),
        id,
        shipmentId,
        releaseEffectId,
        outEffectId,
        ctx.actor.customerScope ?? null,
      ],
    );
    if (result.rowCount !== 1) throw new TechnicalError('incompatible');
  }
  async create(ctx: PostingContext, request: ReservationRequest): Promise<ReservationRequest> {
    const created = record(
      (
        await transactionClient(ctx.transaction).query<Record<string, unknown>>(
          "INSERT INTO inventory.reservation_request(installation_id,authority_scope,reservation_id,order_id,item_id,unit_id,customer_id,kg,binding,order_binding,confirmed_at,state,issuer,subject) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'REQUESTED',$12,$13) RETURNING " +
            columns,
          [
            ...scope(ctx),
            request.id,
            request.orderId,
            request.itemId,
            request.unitId,
            request.customerId,
            request.kg,
            request.binding,
            request.orderBinding,
            request.confirmedAt,
            ctx.actor.principal.issuer,
            ctx.actor.principal.subject,
          ],
        )
      ).rows[0],
    );
    if (!created) throw new TechnicalError('incompatible');
    return created;
  }
  async activate(ctx: PostingContext, id: string): Promise<ReservationRequest | undefined> {
    return record(
      (
        await transactionClient(ctx.transaction).query<Record<string, unknown>>(
          "UPDATE inventory.reservation_request SET state='ACTIVE',active_claim_id=reservation_id,activated_at=clock_timestamp() WHERE installation_id=$1 AND authority_scope=$2 AND reservation_id=$3 AND state='REQUESTED' AND (customer_id::text=$4 OR ($4 IS NULL AND $5='ACT-WH')) RETURNING " +
            columns,
          [...scope(ctx), id, ctx.actor.customerScope ?? null, ctx.actor.actorRole],
        )
      ).rows[0],
    );
  }
}
