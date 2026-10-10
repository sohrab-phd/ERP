import { BusinessRejection, validUuid } from '@navard/shared-kernel';
import type {
  InventoryReceiptStore,
  InventoryReceiptTraceSourcePort,
  InventoryTraceContext,
  PostingContext,
  ReceiptOrigin,
} from '../../modules/inventory/index.js';
import { transactionClient } from './transaction.js';

const columns =
  'lot_id AS "lotId",receipt_id AS "receiptId",unit_id AS "unitId",material_id AS "materialId",effect_id AS "effectId",internal_code AS "internalCode",count::text AS count,measured_kg::text AS "measuredKg",type,location_id AS "locationId",product_code AS "productCode"';
type StoredOrigin = Omit<ReceiptOrigin, 'productCode'> & { productCode: string | null };
function scope(context: PostingContext): [string, string] {
  return [context.actor.installationId, context.actor.authorityScopeId];
}
function origin(row: StoredOrigin | undefined): ReceiptOrigin | undefined {
  if (!row) return undefined;
  const { productCode, ...fields } = row;
  return { ...fields, ...(productCode === null ? {} : { productCode }) };
}

/** Receipt origin persistence has no Ledger or Balance write capability. */
export class PostgresInventoryReceiptStore
  implements InventoryReceiptStore, InventoryReceiptTraceSourcePort
{
  async traceSources(
    context: InventoryTraceContext,
    kind: 'UNIT' | 'LOT' | 'RECEIPT',
    id: string,
  ): Promise<readonly ReceiptOrigin[]> {
    if (!validUuid(context.customerId))
      throw new BusinessRejection({ family: 'GUARD_ACTOR', message: 'Trace customer required' });
    // Original receipt origins are organizational facts. The composed trace gates disclosure
    // through customer-scoped source reachability and the public Inventory Unit read port.
    const response = await transactionClient(context.transaction).query<StoredOrigin>(
      `SELECT l.lot_id AS "lotId",l.receipt_id AS "receiptId",l.unit_id AS "unitId",l.material_id AS "materialId",l.effect_id AS "effectId",l.internal_code AS "internalCode",l.count::text AS count,l.measured_kg::text AS "measuredKg",l.type,l.location_id AS "locationId",l.product_code AS "productCode"
       FROM inventory.material_lot l
       WHERE l.installation_id=$1 AND l.authority_scope=$2
       AND (($4='UNIT' AND l.unit_id=$3::uuid) OR ($4='LOT' AND l.lot_id=$3::uuid) OR ($4='RECEIPT' AND l.receipt_id=$3::uuid))
       ORDER BY l.lot_id LIMIT 257`,
      [context.actor.installationId, context.actor.authorityScopeId, id, kind],
    );
    return response.rows.map((row) => origin(row)!);
  }

  async lockProductCode(context: PostingContext, code: string): Promise<void> {
    await transactionClient(context.transaction).query(
      'SELECT pg_advisory_xact_lock(hashtextextended($1,0))',
      [JSON.stringify(['inventory', ...scope(context), 'standalone-sheet-product', code])],
    );
  }

  async productCodeExists(context: PostingContext, code: string): Promise<boolean> {
    const response = await transactionClient(context.transaction).query<{ present: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM inventory.material_lot WHERE installation_id=$1 AND authority_scope=$2 AND type='SHEET' AND product_code=$3) AS present",
      [...scope(context), code],
    );
    return response.rows[0]?.present === true;
  }

  async create(context: PostingContext, value: ReceiptOrigin): Promise<void> {
    await transactionClient(context.transaction).query(
      'INSERT INTO inventory.material_lot(installation_id,authority_scope,lot_id,receipt_id,unit_id,material_id,effect_id,internal_code,count,measured_kg,type,location_id,product_code) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
      [
        ...scope(context),
        value.lotId,
        value.receiptId,
        value.unitId,
        value.materialId,
        value.effectId,
        value.internalCode,
        value.count,
        value.measuredKg,
        value.type,
        value.locationId,
        value.productCode ?? null,
      ],
    );
  }

  async byUnit(context: PostingContext, id: string): Promise<ReceiptOrigin | undefined> {
    return origin(
      (
        await transactionClient(context.transaction).query<StoredOrigin>(
          'SELECT ' +
            columns +
            ' FROM inventory.material_lot WHERE installation_id=$1 AND authority_scope=$2 AND unit_id=$3',
          [...scope(context), id],
        )
      ).rows[0],
    );
  }

  async byLot(context: PostingContext, id: string): Promise<ReceiptOrigin | undefined> {
    return origin(
      (
        await transactionClient(context.transaction).query<StoredOrigin>(
          'SELECT ' +
            columns +
            ' FROM inventory.material_lot WHERE installation_id=$1 AND authority_scope=$2 AND lot_id=$3',
          [...scope(context), id],
        )
      ).rows[0],
    );
  }
}
