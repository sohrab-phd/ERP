import { BusinessRejection, validUuid } from '@navard/shared-kernel';
import type {
  InboundReceivingOrigin,
  InventoryInboundReceivingStore,
  InventoryTraceContext,
  PostingContext,
} from '../../modules/inventory/index.js';
import type { GenealogyInboundOrigin } from '../../modules/genealogy/index.js';
import { transactionClient } from './transaction.js';

/** Inventory owns typed origins; this adapter never mutates Ledger or Balance. */
export class PostgresInventoryInboundReceivingStore implements InventoryInboundReceivingStore {
  async identities(
    context: PostingContext,
    receivedUnitIds: readonly string[],
  ): Promise<
    readonly {
      receivedUnitId: string;
      unitId: string;
      lotId: string;
      materialId: string;
      effectId: string;
    }[]
  > {
    if (receivedUnitIds.some((id) => !validUuid(id)))
      throw new BusinessRejection({
        family: 'GUARD_INVARIANT',
        message: 'Invalid receiving identity',
      });
    const result = await transactionClient(context.transaction).query<{
      receivedUnitId: string;
      unitId: string;
      lotId: string;
      materialId: string;
      effectId: string;
    }>(
      `SELECT received_unit_id AS "receivedUnitId",unit_id AS "unitId",lot_id AS "lotId",
       material_id AS "materialId",effect_id AS "effectId" FROM inventory.inbound_unit_origin
       WHERE installation_id=$1 AND authority_scope=$2 AND received_unit_id=ANY($3::uuid[])
       ORDER BY received_unit_id`,
      [context.actor.installationId, context.actor.authorityScopeId, receivedUnitIds],
    );
    return result.rows;
  }
  async create(context: PostingContext, origin: InboundReceivingOrigin): Promise<void> {
    await transactionClient(context.transaction).query(
      `INSERT INTO inventory.inbound_unit_origin(installation_id,authority_scope,received_unit_id,arrival_id,
       unit_id,lot_id,material_id,effect_id,internal_system_code,product_number,accepted_unit_weight_kg_text,
       type,location_id,weight_basis,classification_profile,material_type_option_id,issuer,subject,
       actor_role,request_id,idempotency_key)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)`,
      [
        context.actor.installationId,
        context.actor.authorityScopeId,
        origin.receivedUnitId,
        origin.arrivalId,
        origin.unitId,
        origin.lotId,
        origin.materialId,
        origin.effectId,
        origin.internalSystemCode,
        origin.productNumber,
        origin.acceptedUnitWeightKg,
        origin.type,
        origin.locationId,
        origin.weightBasis,
        origin.classificationProfile,
        origin.materialTypeId,
        context.actor.principal.issuer,
        context.actor.principal.subject,
        context.actor.actorRole,
        context.actor.requestId,
        context.request.idempotency_key,
      ],
    );
  }
  /** Composition must first authorize customer-scoped genealogy reachability. */
  async traceSources(
    context: InventoryTraceContext,
    kind: 'UNIT' | 'LOT' | 'RECEIVING_UNIT',
    id: string,
  ): Promise<readonly GenealogyInboundOrigin[]> {
    if (!validUuid(context.customerId))
      throw new BusinessRejection({ family: 'GUARD_ACTOR', message: 'Trace customer required' });
    const result = await transactionClient(context.transaction).query<
      Omit<GenealogyInboundOrigin, 'originKind'>
    >(
      `SELECT received_unit_id AS "receivedUnitId",lot_id AS "lotId",unit_id AS "unitId",
       material_id AS "materialId",effect_id AS "effectId",internal_system_code AS "internalCode",
       accepted_unit_weight_kg_text AS "acceptedUnitWeightKg",type,location_id AS "locationId"
       FROM inventory.inbound_unit_origin WHERE installation_id=$1 AND authority_scope=$2
       AND (($4='UNIT' AND unit_id=$3::uuid) OR ($4='LOT' AND lot_id=$3::uuid)
       OR ($4='RECEIVING_UNIT' AND received_unit_id=$3::uuid)) ORDER BY unit_id LIMIT 257`,
      [context.actor.installationId, context.actor.authorityScopeId, id, kind],
    );
    return result.rows.map((row) => ({ ...row, originKind: 'WH_ACCEPTED_RECEIVING_UNIT' }));
  }
}
