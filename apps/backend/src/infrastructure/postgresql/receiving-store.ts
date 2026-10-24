import { canonicalJson, type JsonObject } from '@navard/shared-kernel';
import {
  parseJalaliDate,
  type ReceivingStore,
  type ReceivingContext,
  type ReceivingInput,
  type ReceivingUnitFact,
  type ReceivingStockSource,
} from '../../modules/procurement/index.js';
import { transactionClient } from './transaction.js';
const scope = (c: ReceivingContext) => [c.actor.installationId, c.actor.authorityScopeId];
const evidence = (c: ReceivingContext) => [
  c.actor.principal.issuer,
  c.actor.principal.subject,
  c.actor.actorRole,
  c.actor.requestId,
  c.request.idempotency_key,
];
const serialize = (x: unknown) => canonicalJson(x as JsonObject).toString('utf8');
const headerSql = `jsonb_strip_nulls(jsonb_build_object('arrivalId',a.arrival_id,'arrivalDateJalali',lpad(a.arrival_jy::text,4,'0')||'-'||lpad(a.arrival_jm::text,2,'0')||'-'||lpad(a.arrival_jd::text,2,'0'),'calendar','jalali','calendarProfile',a.calendar_profile,'originNetKg',a.origin_net_kg_text,'destinationNetKg',a.destination_net_kg_text,'weightSourceWaybillId',a.weight_source_waybill_id,'truckNumber',a.truck_number,'originatingCompany',a.originating_company,'driverName',a.driver_name,'recordedAt',a.recorded_at,'receivingActor',jsonb_build_object('issuer',a.issuer,'subject',a.subject,'role',a.actor_role)))`;
/** Procurement source owner only; Inventory identities are supplied through an owner port. */
export class PostgresReceivingStore implements ReceivingStore {
  async lock(ctx: ReceivingContext, resources: readonly string[]) {
    const c = transactionClient(ctx.transaction);
    const rows = await c.query<{ key: string }>(
      'SELECT DISTINCT hashtextextended(value,0) AS key FROM unnest($1::text[]) input(value) ORDER BY key',
      [[...resources]],
    );
    for (const r of rows.rows) await c.query('SELECT pg_advisory_xact_lock($1::bigint)', [r.key]);
  }
  async duplicate(ctx: ReceivingContext, input: ReceivingInput, id: string) {
    const c = transactionClient(ctx.transaction);
    const r = await c.query<{ found: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM procurement.inbound_arrival WHERE installation_id=$1 AND arrival_id=$2) OR EXISTS(SELECT 1 FROM procurement.inbound_waybill WHERE installation_id=$1 AND (waybill_id=ANY($3::uuid[]) OR reference COLLATE "C"=ANY($4::text[]))) OR EXISTS(SELECT 1 FROM procurement.inbound_warehouse_receipt WHERE installation_id=$1 AND (receipt_id=ANY($5::uuid[]) OR reference COLLATE "C"=ANY($6::text[]))) OR EXISTS(SELECT 1 FROM procurement.inbound_received_unit WHERE installation_id=$1 AND received_unit_id=ANY($7::uuid[])) OR EXISTS(SELECT 1 FROM procurement.inbound_physical_code_claim WHERE installation_id=$1 AND raw_code COLLATE "C"=ANY($8::text[])) OR EXISTS(SELECT 1 FROM procurement.goods_receipt WHERE installation_id=$1 AND internal_code COLLATE "C"=ANY($8::text[])) AS found`,
      [
        ctx.actor.installationId,
        id,
        input.waybills.map((x) => x.waybillId),
        input.waybills.map((x) => x.reference),
        input.warehouseReceipts.map((x) => x.receiptId),
        input.warehouseReceipts.map((x) => x.reference),
        input.units.map((x) => x.receivedUnitId),
        input.units.map((x) => x.internalSystemCode),
      ],
    );
    return r.rows[0]!.found;
  }
  async counts(ctx: ReceivingContext, lineIds: readonly string[]) {
    if (!lineIds.length) return new Map<string, string>();
    const r = await transactionClient(ctx.transaction).query<{ lineId: string; count: string }>(
      'SELECT line_id AS "lineId",count(*)::text AS count FROM procurement.inbound_received_unit WHERE installation_id=$1 AND authority_scope=$2 AND line_id=ANY($3::uuid[]) GROUP BY line_id',
      [...scope(ctx), [...lineIds]],
    );
    return new Map(r.rows.map((x) => [x.lineId, x.count]));
  }
  async insert(
    ctx: ReceivingContext,
    id: string,
    input: ReceivingInput,
    facts: readonly ReceivingUnitFact[],
  ) {
    const c = transactionClient(ctx.transaction);
    const d = parseJalaliDate(input.arrivalDateJalali);
    await c.query(
      'INSERT INTO procurement.inbound_arrival(installation_id,authority_scope,arrival_id,arrival_jy,arrival_jm,arrival_jd,unit_count,waybill_count,receipt_count,origin_net_kg_text,destination_net_kg_text,weight_source_waybill_id,truck_number,originating_company,driver_name,binding,issuer,subject,actor_role,request_id,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)',
      [
        ...scope(ctx),
        id,
        d.year,
        d.month,
        d.day,
        facts.length,
        input.waybills.length,
        input.warehouseReceipts.length,
        input.originNetKg,
        input.destinationNetKg ?? null,
        input.weightSourceWaybillId,
        input.truckNumber ?? null,
        input.originatingCompany ?? null,
        input.driverName ?? null,
        serialize(ctx.request),
        ...evidence(ctx),
      ],
    );
    for (const [i, w] of input.waybills.entries())
      await c.query(
        'INSERT INTO procurement.inbound_waybill(installation_id,authority_scope,waybill_id,arrival_id,position,declared_waybill_count,reference,yellow_copy_reference) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
        [
          ...scope(ctx),
          w.waybillId,
          id,
          i + 1,
          input.waybills.length,
          w.reference,
          w.yellowCopyReference ?? null,
        ],
      );
    for (const [i, w] of input.warehouseReceipts.entries())
      await c.query(
        'INSERT INTO procurement.inbound_warehouse_receipt(installation_id,authority_scope,receipt_id,arrival_id,position,declared_receipt_count,reference) VALUES($1,$2,$3,$4,$5,$6,$7)',
        [...scope(ctx), w.receiptId, id, i + 1, input.warehouseReceipts.length, w.reference],
      );
    for (const u of facts) {
      const assoc = u.association;
      await c.query(
        'INSERT INTO procurement.inbound_received_unit(installation_id,authority_scope,received_unit_id,arrival_id,position,declared_unit_count,waybill_id,receipt_id,internal_system_code,product_number,association_kind,order_id,line_id,actual,original,comparison,acceptance,material_type_option_id,technical_type,accepted_unit_weight_kg_text,location_id,weight_evidence_reference,binding,issuer,subject,actor_role,request_id,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15::jsonb,$16::jsonb,$17::jsonb,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)',
        [
          ...scope(ctx),
          u.receivedUnitId,
          id,
          u.position,
          facts.length,
          u.waybillId,
          u.receiptId,
          u.internalSystemCode,
          u.productNumber,
          assoc.kind,
          assoc.kind === 'UNLINKED' ? null : assoc.orderId,
          assoc.kind === 'ORDER_LINE' ? assoc.lineId : null,
          serialize(u.actual),
          u.original ? serialize(u.original) : null,
          serialize(u.comparison),
          serialize(u.acceptance),
          u.actual.materialType.optionId,
          u.technicalType,
          u.actual.unitWeightKg,
          u.locationId,
          u.weightEvidenceReference ?? null,
          serialize(u),
          ...evidence(ctx),
        ],
      );
    }
  }
  async complete(ctx: ReceivingContext) {
    await transactionClient(ctx.transaction).query(
      'SET CONSTRAINTS procurement.i2_arrival_complete_ck,procurement.i2_claim_complete_ck,inventory.i2_origin_complete_ck,procurement.i2_arrival_weight_waybill_fk IMMEDIATE',
    );
  }
  async source(ctx: ReceivingContext, id: string): Promise<ReceivingStockSource | undefined> {
    const r = await transactionClient(ctx.transaction).query<ReceivingStockSource>(
      `SELECT received_unit_id AS "receivedUnitId",arrival_id AS "arrivalId",internal_system_code AS "internalSystemCode",product_number AS "productNumber",accepted_unit_weight_kg_text AS "acceptedUnitWeightKg",material_type_option_id AS "materialTypeId",actual->'materialType'->>'label' AS "materialTypeLabel",technical_type AS "technicalType",location_id AS "locationId" FROM procurement.inbound_received_unit WHERE installation_id=$1 AND authority_scope=$2 AND received_unit_id=$3`,
      [...scope(ctx), id],
    );
    return r.rows[0];
  }
  async arrival(ctx: ReceivingContext, id: string) {
    const r = await transactionClient(ctx.transaction).query<{ data: Record<string, unknown> }>(
      `SELECT ${headerSql} AS data FROM procurement.inbound_arrival a WHERE a.installation_id=$1 AND a.authority_scope=$2 AND a.arrival_id=$3`,
      [...scope(ctx), id],
    );
    return r.rows[0]?.data;
  }
  async units(
    ctx: ReceivingContext,
    filter: { arrivalId?: string; orderId?: string; afterId?: string; limit: number },
  ) {
    const r = await transactionClient(ctx.transaction).query<Record<string, unknown>>(
      `SELECT u.received_unit_id AS "receivedUnitId",u.arrival_id AS "arrivalId",u.position,u.internal_system_code AS "internalSystemCode",u.product_number AS "productNumber",jsonb_strip_nulls(jsonb_build_object('kind',u.association_kind,'orderId',u.order_id,'lineId',u.line_id)) AS association,u.actual,u.original,u.comparison,u.acceptance,u.location_id AS "locationId",u.weight_evidence_reference AS "weightEvidenceReference",u.recorded_at AS "recordedAt",jsonb_build_object('issuer',u.issuer,'subject',u.subject,'role',u.actor_role) AS "receivingActor",${headerSql} AS arrival,jsonb_strip_nulls(jsonb_build_object('waybillId',w.waybill_id,'reference',w.reference,'yellowCopyReference',w.yellow_copy_reference)) AS waybill,jsonb_build_object('receiptId',r.receipt_id,'reference',r.reference) AS "warehouseReceipt" FROM procurement.inbound_received_unit u JOIN procurement.inbound_arrival a ON (a.installation_id,a.authority_scope,a.arrival_id)=(u.installation_id,u.authority_scope,u.arrival_id) JOIN procurement.inbound_waybill w ON (w.installation_id,w.authority_scope,w.waybill_id)=(u.installation_id,u.authority_scope,u.waybill_id) JOIN procurement.inbound_warehouse_receipt r ON (r.installation_id,r.authority_scope,r.receipt_id)=(u.installation_id,u.authority_scope,u.receipt_id) WHERE u.installation_id=$1 AND u.authority_scope=$2 AND ($3::uuid IS NULL OR u.arrival_id=$3) AND ($4::uuid IS NULL OR u.order_id=$4) AND ($5::uuid IS NULL OR u.received_unit_id>$5) ORDER BY u.received_unit_id LIMIT $6`,
      [
        ...scope(ctx),
        filter.arrivalId ?? null,
        filter.orderId ?? null,
        filter.afterId ?? null,
        filter.limit,
      ],
    );
    return r.rows;
  }
}
