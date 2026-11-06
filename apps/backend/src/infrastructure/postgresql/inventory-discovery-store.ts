import type {
  InventoryCandidate,
  InventoryDiscoveryStore,
  InventoryReadContext,
  InventoryReadLedger,
  InventoryReadLinks,
  InventorySelection,
} from '../../modules/inventory/index.js';
import { transactionClient } from './transaction.js';

/** Inventory-owned SELECT projection. The caller supplies one authorized read-only snapshot. */
export class PostgresInventoryDiscoveryStore implements InventoryDiscoveryStore {
  async candidates(
    context: InventoryReadContext,
    selection: InventorySelection,
  ): Promise<readonly InventoryCandidate[]> {
    const values: unknown[] = [
      context.actor.installationId,
      context.actor.authorityScopeId,
      selection.states,
    ];
    // Scope and admitted state set constrain every source before filters/keyset/limit.
    const where = [
      'u.installation_id=$1',
      'u.authority_scope=$2',
      'u.state=ANY($3::text[])',
      '(l.unit_id IS NOT NULL OR i.unit_id IS NOT NULL OR p.unit_id IS NOT NULL)',
    ];
    const parameter = (value: unknown) => {
      values.push(value);
      return '$' + values.length;
    };
    const f = selection.filters;
    if (f.unitId !== undefined) where.push('u.unit_id=' + parameter(f.unitId) + '::uuid');
    if (f.lotId !== undefined) where.push('u.lot_id=' + parameter(f.lotId) + '::uuid');
    if (f.kind !== undefined) where.push('u.kind=' + parameter(f.kind));
    if (f.locationId !== undefined)
      where.push('u.location_id=' + parameter(f.locationId) + '::uuid');
    if (f.state !== undefined) where.push('u.state=' + parameter(f.state));
    if (f.origin !== undefined)
      where.push(
        (f.origin === 'LEGACY_RECEIPT' ? 'l' : f.origin === 'I2_RECEIVING' ? 'i' : 'p') +
          '.unit_id IS NOT NULL',
      );
    if (f.materialId !== undefined) {
      const value = parameter(f.materialId);
      where.push(
        `u.unit_id IN (SELECT unit_id FROM inventory.material_lot WHERE installation_id=$1 AND authority_scope=$2 AND material_id=${value}::uuid UNION ALL SELECT unit_id FROM inventory.inbound_unit_origin WHERE installation_id=$1 AND authority_scope=$2 AND material_id=${value}::uuid)`,
      );
    }
    if (f.internalCode !== undefined) {
      const value = parameter(f.internalCode);
      where.push(
        `u.unit_id IN (SELECT unit_id FROM inventory.material_lot WHERE installation_id=$1 AND authority_scope=$2 AND internal_code COLLATE "C"=${value} COLLATE "C" UNION ALL SELECT unit_id FROM inventory.inbound_unit_origin WHERE installation_id=$1 AND authority_scope=$2 AND internal_system_code COLLATE "C"=${value} COLLATE "C")`,
      );
    }
    if (selection.afterUnitId !== undefined)
      where.push('u.unit_id>' + parameter(selection.afterUnitId) + '::uuid');
    const limit = parameter(selection.take);
    return (
      await transactionClient(context.transaction).query<InventoryCandidate>(
        `
      SELECT u.unit_id AS "unitId",u.lot_id AS "lotId",u.kind,u.location_id AS "locationId",u.customer_scope AS "customerScope",u.state,
      l.unit_id AS "legacyUnitId",l.lot_id AS "legacyLotId",l.material_id AS "legacyMaterialId",l.internal_code AS "legacyInternalCode",l.product_code AS "legacyProductCode",l.receipt_id AS "legacyReceiptId",l.measured_kg::text AS "legacyInitialKg",l.count::text AS "legacyCount",l.type AS "legacyType",l.location_id AS "legacyLocationId",
      i.unit_id AS "i2UnitId",i.lot_id AS "i2LotId",i.material_id AS "i2MaterialId",i.internal_system_code AS "i2InternalCode",i.product_number AS "i2ProductNumber",i.received_unit_id AS "i2ReceivedUnitId",i.arrival_id AS "i2ArrivalId",i.accepted_unit_weight_kg_text AS "i2InitialKg",i.material_type_option_id AS "i2MaterialTypeOptionId",i.classification_profile AS "i2ClassificationProfile",i.weight_basis AS "i2WeightBasis",i.type AS "i2Type",i.location_id AS "i2LocationId",
      p.unit_id AS "productionUnitId",p.product_batch_id AS "productionBatchId",p.customer_id AS "productionCustomerId",p.kg::text AS "productionInitialKg",p.disposition AS "productionDisposition"
      FROM inventory.unit u
      LEFT JOIN inventory.material_lot l ON (l.installation_id,l.authority_scope,l.unit_id)=(u.installation_id,u.authority_scope,u.unit_id)
      LEFT JOIN inventory.inbound_unit_origin i ON (i.installation_id,i.authority_scope,i.unit_id)=(u.installation_id,u.authority_scope,u.unit_id)
      LEFT JOIN inventory.production_origin p ON (p.installation_id,p.authority_scope,p.unit_id)=(u.installation_id,u.authority_scope,u.unit_id)
      WHERE ${where.join(' AND ')} ORDER BY u.unit_id LIMIT ${limit}`,
        values,
      )
    ).rows;
  }
  async ledger(
    context: InventoryReadContext,
    unitIds: readonly string[],
  ): Promise<readonly InventoryReadLedger[]> {
    return (
      await transactionClient(context.transaction).query<InventoryReadLedger>(
        'SELECT unit_id AS "unitId",on_hand_delta::text AS "onHandDelta",reserved_delta::text AS "reservedDelta" FROM inventory.ledger WHERE installation_id=$1 AND authority_scope=$2 AND unit_id=ANY($3::uuid[]) LIMIT 10001',
        [context.actor.installationId, context.actor.authorityScopeId, unitIds],
      )
    ).rows;
  }
  async links(
    context: InventoryReadContext,
    unitIds: readonly string[],
  ): Promise<readonly InventoryReadLinks[]> {
    return (
      await transactionClient(context.transaction).query<InventoryReadLinks>(
        `
      SELECT u.unit_id AS "unitId",b.on_hand::text AS "balanceOnHand",b.reserved::text AS "balanceReserved",r.kg::text AS "claimKg",i.kg::text AS "issueKg",i.customer_id AS "issueCustomerId"
      FROM inventory.unit u
      LEFT JOIN inventory.balance b ON (b.installation_id,b.authority_scope,b.unit_id)=(u.installation_id,u.authority_scope,u.unit_id)
      LEFT JOIN inventory.reservation r ON (r.installation_id,r.authority_scope,r.unit_id)=(u.installation_id,u.authority_scope,u.unit_id) AND r.state='ACTIVE'
      LEFT JOIN inventory.production_issue i ON (i.installation_id,i.authority_scope,i.unit_id)=(u.installation_id,u.authority_scope,u.unit_id) AND i.state='ACTIVE'
      WHERE u.installation_id=$1 AND u.authority_scope=$2 AND u.unit_id=ANY($3::uuid[])`,
        [context.actor.installationId, context.actor.authorityScopeId, unitIds],
      )
    ).rows;
  }
}
