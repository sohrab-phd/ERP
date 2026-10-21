import { TechnicalError } from '@navard/shared-kernel';
import {
  normalizeOrderReference,
  parseJalaliDate,
  type CatalogueInput,
  type CatalogueQuery,
  type InboundContext,
  type InboundLineProjection,
  type InboundOption,
  type InboundOrderProjection,
  type InboundOrderRecord,
  type InboundStore,
  type OperationalOrderInput,
} from '../../modules/procurement/index.js';
import { transactionClient } from './transaction.js';

const scope = (ctx: InboundContext) => [ctx.actor.installationId, ctx.actor.authorityScopeId];
const evidence = (ctx: InboundContext) => [
  ctx.actor.principal.issuer,
  ctx.actor.principal.subject,
  ctx.actor.actorRole,
  ctx.actor.requestId,
  ctx.request.idempotency_key,
];
const optionColumns = 'option_id AS "optionId",catalogue_kind AS catalogue,label,binding';
interface Header {
  id: string;
  binding: string;
  orderReference: string;
  orderReferenceKey: string;
  referenceProfile: string;
  year: number;
  month: number;
  day: number;
  calendarProfile: string;
  lineCount: number;
}
interface Line {
  lineId: string;
  position: number;
  itemNumber: string | null;
  materialId: string;
  materialLabel: string;
  colorId: string | null;
  colorLabel: string | null;
  qualityId: string | null;
  qualityLabel: string | null;
  ralColorNumber: string | null;
  widthM: string;
  thicknessMm: string;
  lengthM: string | null;
  unitWeightKg: string;
  orderedUnitCount: string;
}

/** Procurement owns these immutable sources; no Inventory or documentary SQL. */
export class PostgresInboundStore implements InboundStore {
  async lock(ctx: InboundContext, resources: readonly string[]): Promise<void> {
    const client = transactionClient(ctx.transaction);
    const keys = await client.query<{ key: string }>(
      'SELECT DISTINCT hashtextextended(value,0) AS key FROM unnest($1::text[]) AS input(value) ORDER BY key',
      [[...resources]],
    );
    for (const { key } of keys.rows) {
      await client.query('SELECT pg_advisory_xact_lock($1::bigint)', [key]);
    }
  }

  async order(ctx: InboundContext, id: string): Promise<InboundOrderRecord | undefined> {
    const client = transactionClient(ctx.transaction);
    const header = (
      await client.query<Header>(
        'SELECT order_id AS id,binding,order_reference AS "orderReference",order_reference_key AS "orderReferenceKey",reference_key_profile AS "referenceProfile",registration_jy AS year,registration_jm AS month,registration_jd AS day,calendar_profile AS "calendarProfile",line_count AS "lineCount" FROM procurement.operational_purchase_order WHERE installation_id=$1 AND authority_scope=$2 AND order_id=$3',
        [...scope(ctx), id],
      )
    ).rows[0];
    if (!header) return undefined;
    if (
      header.orderReferenceKey !== normalizeOrderReference(header.orderReference) ||
      header.referenceProfile !== 'PO-REF-R1-A-v1' ||
      header.calendarProfile !== 'UT-JALALI-1206-1498-v1'
    )
      throw new TechnicalError('retryable');
    const rows = (
      await client.query<Line>(
        'SELECT l.line_id AS "lineId",l.position,l.item_number AS "itemNumber",l.material_type_option_id AS "materialId",m.label AS "materialLabel",l.color_option_id AS "colorId",c.label AS "colorLabel",l.quality_grade_option_id AS "qualityId",q.label AS "qualityLabel",l.ral_color_number AS "ralColorNumber",l.width_m_text AS "widthM",l.thickness_mm_text AS "thicknessMm",l.length_m_text AS "lengthM",l.unit_weight_kg_text AS "unitWeightKg",l.ordered_unit_count_text AS "orderedUnitCount" FROM procurement.operational_purchase_order_line l JOIN procurement.inbound_catalogue_option m ON m.installation_id=l.installation_id AND m.authority_scope=l.authority_scope AND m.catalogue_kind=l.material_type_kind AND m.option_id=l.material_type_option_id LEFT JOIN procurement.inbound_catalogue_option c ON c.installation_id=l.installation_id AND c.authority_scope=l.authority_scope AND c.catalogue_kind=l.color_kind AND c.option_id=l.color_option_id LEFT JOIN procurement.inbound_catalogue_option q ON q.installation_id=l.installation_id AND q.authority_scope=l.authority_scope AND q.catalogue_kind=l.quality_grade_kind AND q.option_id=l.quality_grade_option_id WHERE l.installation_id=$1 AND l.authority_scope=$2 AND l.order_id=$3 ORDER BY l.position',
        [...scope(ctx), id],
      )
    ).rows;
    if (rows.length !== header.lineCount || rows.some((row, index) => row.position !== index + 1))
      throw new TechnicalError('retryable');
    const lines: InboundLineProjection[] = rows.map((row) => ({
      lineId: row.lineId,
      position: row.position,
      ...(row.itemNumber === null ? {} : { itemNumber: row.itemNumber }),
      materialType: { optionId: row.materialId, label: row.materialLabel },
      widthM: row.widthM,
      thicknessMm: row.thicknessMm,
      ...(row.colorId === null ? {} : { color: { optionId: row.colorId, label: row.colorLabel! } }),
      ...(row.qualityId === null
        ? {}
        : { qualityGrade: { optionId: row.qualityId, label: row.qualityLabel! } }),
      ...(row.ralColorNumber === null ? {} : { ralColorNumber: row.ralColorNumber }),
      ...(row.lengthM === null ? {} : { lengthM: row.lengthM }),
      unitWeightKg: row.unitWeightKg,
      orderedUnitCount: row.orderedUnitCount,
    }));
    return {
      id: header.id,
      binding: header.binding,
      orderReferenceKey: header.orderReferenceKey,
      projection: {
        orderId: header.id,
        orderReference: header.orderReference,
        registrationDateJalali: `${header.year.toString().padStart(4, '0')}-${header.month.toString().padStart(2, '0')}-${header.day.toString().padStart(2, '0')}`,
        calendar: 'jalali',
        lineCount: header.lineCount,
        units: { widthM: 'm', thicknessMm: 'mm', lengthM: 'm', unitWeightKg: 'kg' },
        lines,
      },
    };
  }

  async orderByReference(
    ctx: InboundContext,
    rawReference: string,
    expectedKey: string,
  ): Promise<InboundOrderRecord | undefined> {
    const client = transactionClient(ctx.transaction);
    const key = (
      await client.query<{ key: string }>('SELECT procurement.po_reference_key_r1_v1($1) AS key', [
        rawReference,
      ])
    ).rows[0]?.key;
    if (key !== expectedKey) throw new TechnicalError('retryable');
    const found = (
      await client.query<{ id: string }>(
        'SELECT order_id AS id FROM procurement.operational_purchase_order WHERE installation_id=$1 AND authority_scope=$2 AND order_reference_key=$3 COLLATE "C"',
        [...scope(ctx), key],
      )
    ).rows;
    if (found.length > 1) throw new TechnicalError('retryable');
    return found[0] ? this.order(ctx, found[0].id) : undefined;
  }

  async options(ctx: InboundContext, ids: readonly string[]): Promise<InboundOption[]> {
    if (!ids.length) return [];
    return (
      await transactionClient(ctx.transaction).query<InboundOption>(
        `SELECT ${optionColumns} FROM procurement.inbound_catalogue_option WHERE installation_id=$1 AND authority_scope=$2 AND option_id=ANY($3::uuid[])`,
        [...scope(ctx), [...new Set(ids)]],
      )
    ).rows;
  }

  async listOptions(ctx: InboundContext, input: CatalogueQuery): Promise<InboundOption[]> {
    return (
      await transactionClient(ctx.transaction).query<InboundOption>(
        `SELECT ${optionColumns} FROM procurement.inbound_catalogue_option WHERE installation_id=$1 AND authority_scope=$2 AND catalogue_kind=$3 AND ($4::text IS NULL OR label=$4 COLLATE "C") AND ($5::uuid IS NULL OR option_id>$5::uuid) ORDER BY option_id LIMIT $6`,
        [
          ...scope(ctx),
          input.catalogue,
          input.exactLabel ?? null,
          input.afterId ?? null,
          input.limit + 1,
        ],
      )
    ).rows;
  }

  async insertOption(
    ctx: InboundContext,
    id: string,
    binding: string,
    input: CatalogueInput,
  ): Promise<void> {
    await transactionClient(ctx.transaction).query(
      'INSERT INTO procurement.inbound_catalogue_option(installation_id,authority_scope,option_id,binding,catalogue_kind,label,issuer,subject,actor_role,request_id,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)',
      [...scope(ctx), id, binding, input.catalogue, input.label, ...evidence(ctx)],
    );
  }

  async insertOrder(
    ctx: InboundContext,
    id: string,
    binding: string,
    input: OperationalOrderInput,
    projection: InboundOrderProjection,
  ): Promise<void> {
    const client = transactionClient(ctx.transaction);
    const { year, month, day } = parseJalaliDate(input.registrationDateJalali);
    const result = await client.query<{ key: string; profile: string }>(
      'INSERT INTO procurement.operational_purchase_order(installation_id,authority_scope,order_id,binding,order_reference,registration_jy,registration_jm,registration_jd,line_count,issuer,subject,actor_role,request_id,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING order_reference_key AS key,reference_key_profile AS profile',
      [
        ...scope(ctx),
        id,
        binding,
        input.orderReference,
        year,
        month,
        day,
        input.lines.length,
        ...evidence(ctx),
      ],
    );
    if (
      result.rows[0]?.key !== normalizeOrderReference(input.orderReference) ||
      result.rows[0]?.profile !== 'PO-REF-R1-A-v1' ||
      projection.orderId !== id ||
      projection.lines.length !== input.lines.length
    )
      throw new TechnicalError('retryable');
    for (let index = 0; index < input.lines.length; index++) {
      const line = input.lines[index]!;
      const projected = projection.lines[index]!;
      if (projected.position !== index + 1) throw new TechnicalError('retryable');
      await client.query(
        'INSERT INTO procurement.operational_purchase_order_line(installation_id,authority_scope,order_id,line_id,declared_line_count,position,item_number,material_type_option_id,color_option_id,quality_grade_option_id,ral_color_number,width_m_text,thickness_mm_text,length_m_text,unit_weight_kg_text,ordered_unit_count_text) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)',
        [
          ...scope(ctx),
          id,
          projected.lineId,
          input.lines.length,
          projected.position,
          line.itemNumber ?? null,
          line.materialTypeOptionId,
          line.colorOptionId ?? null,
          line.qualityGradeOptionId ?? null,
          line.ralColorNumber ?? null,
          line.widthM,
          line.thicknessMm,
          line.lengthM ?? null,
          line.unitWeightKg,
          line.orderedUnitCount,
        ],
      );
    }
  }
}
