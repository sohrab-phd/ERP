import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { PoolClient } from 'pg';
import { withDatabase } from '../support/database-fixture.js';

const scope = '00000000-0000-4000-8000-000000000001';
const actor = { issuer: 'receiving-integrity', subject: 'warehouse-individual' };
interface Bundle {
  arrival: string;
  waybill: string;
  receipt: string;
  source: string;
  option: string;
  unit: string;
  lot: string;
  material: string;
  effect: string;
  location: string;
  request: string;
  key: string;
  code: string;
}
function ids(): Bundle {
  return {
    arrival: randomUUID(),
    waybill: randomUUID(),
    receipt: randomUUID(),
    source: randomUUID(),
    option: randomUUID(),
    unit: randomUUID(),
    lot: randomUUID(),
    material: randomUUID(),
    effect: randomUUID(),
    location: randomUUID(),
    request: randomUUID(),
    key: randomUUID(),
    code: `physical-${randomUUID()}`,
  };
}
async function source(c: PoolClient, b: Bundle) {
  await c.query(
    `INSERT INTO procurement.inbound_catalogue_option(installation_id,authority_scope,option_id,catalogue_kind,label,binding,issuer,subject,actor_role,request_id,idempotency_key) VALUES($1,$1,$2,'MATERIAL_TYPE',$3,'{}',$4,$5,'ACT-WH',$6,$7)`,
    [scope, b.option, `Coil-${b.option}`, actor.issuer, actor.subject, b.request, b.key],
  );
  await c.query(
    `INSERT INTO procurement.inbound_arrival(installation_id,authority_scope,arrival_id,arrival_jy,arrival_jm,arrival_jd,unit_count,waybill_count,receipt_count,origin_net_kg_text,destination_net_kg_text,weight_source_waybill_id,binding,issuer,subject,actor_role,request_id,idempotency_key) VALUES($1,$1,$2,1405,8,2,1,1,1,'002000.00100','1999.9900',$3,'{}',$4,$5,'ACT-WH',$6,$7)`,
    [scope, b.arrival, b.waybill, actor.issuer, actor.subject, b.request, b.key],
  );
  await c.query(
    `INSERT INTO procurement.inbound_waybill(installation_id,authority_scope,waybill_id,arrival_id,position,declared_waybill_count,reference) VALUES($1,$1,$2,$3,1,1,$4)`,
    [scope, b.waybill, b.arrival, `waybill-${b.waybill}`],
  );
  await c.query(
    `INSERT INTO procurement.inbound_warehouse_receipt(installation_id,authority_scope,receipt_id,arrival_id,position,declared_receipt_count,reference) VALUES($1,$1,$2,$3,1,1,$4)`,
    [scope, b.receipt, b.arrival, `receipt-${b.receipt}`],
  );
  await c.query(
    `INSERT INTO procurement.inbound_received_unit(installation_id,authority_scope,received_unit_id,arrival_id,position,declared_unit_count,waybill_id,receipt_id,internal_system_code,product_number,association_kind,actual,comparison,acceptance,material_type_option_id,technical_type,accepted_unit_weight_kg_text,location_id,binding,issuer,subject,actor_role,request_id,idempotency_key) VALUES($1,$1,$2,$3,1,1,$4,$5,$6,'opaque-product','UNLINKED',$7,'{}','{"confirmed":true,"unordered":true}',$8,'COIL','2000',$9,'{}',$10,$11,'ACT-WH',$12,$13)`,
    [
      scope,
      b.source,
      b.arrival,
      b.waybill,
      b.receipt,
      b.code,
      JSON.stringify({
        materialType: { optionId: b.option, label: `Coil-${b.option}` },
        widthM: '1',
        thicknessMm: '2',
        unitWeightKg: '2000',
      }),
      b.option,
      b.location,
      actor.issuer,
      actor.subject,
      b.request,
      b.key,
    ],
  );
}
async function stock(
  c: PoolClient,
  b: Bundle,
  weight = '2000',
  bindingKg = weight,
  bindingCustomer = '',
) {
  await c.query(
    `INSERT INTO inventory.unit(installation_id,authority_scope,unit_id,lot_id,kind,location_id,customer_scope,state) VALUES($1,$1,$2,$3,'COIL',$4,'','AVAILABLE')`,
    [scope, b.unit, b.lot, b.location],
  );
  const binding = JSON.stringify({
    command: 'ConfirmPurchaseReceiving',
    version: 1,
    effect: {
      type: 'STOCK_IN',
      unitId: b.unit,
      kg: bindingKg,
      source: { factId: b.source, effectId: b.effect },
      create: {
        lotId: b.lot,
        kind: 'COIL',
        locationId: b.location,
        customerScope: bindingCustomer,
      },
    },
  });
  await c.query(
    `INSERT INTO inventory.ledger(installation_id,authority_scope,ledger_id,unit_id,source_fact_id,effect_id,binding,on_hand_delta,reserved_delta,issuer,subject,actor_role,request_id,command_id,command_version,idempotency_key) VALUES($1,$1,$2,$3,$4,$5,$6,$7,0,$8,$9,'ACT-WH',$10,'ConfirmPurchaseReceiving',1,$11)`,
    [
      scope,
      randomUUID(),
      b.unit,
      b.source,
      b.effect,
      binding,
      weight,
      actor.issuer,
      actor.subject,
      b.request,
      b.key,
    ],
  );
  await c.query(
    `INSERT INTO inventory.inbound_unit_origin(installation_id,authority_scope,unit_id,received_unit_id,arrival_id,lot_id,material_id,effect_id,internal_system_code,product_number,material_type_option_id,accepted_unit_weight_kg_text,type,location_id,weight_basis,classification_profile,issuer,subject,actor_role,request_id,idempotency_key) VALUES($1,$1,$2,$3,$4,$5,$6,$7,$8,'opaque-product',$9,'2000','COIL',$10,'WH_ACCEPTED_DECLARED_UNIT_WEIGHT','FACTORY_MATERIAL_V1',$11,$12,'ACT-WH',$13,$14)`,
    [
      scope,
      b.unit,
      b.source,
      b.arrival,
      b.lot,
      b.material,
      b.effect,
      b.code,
      b.option,
      b.location,
      actor.issuer,
      actor.subject,
      b.request,
      b.key,
    ],
  );
}
void test('I2 deferred source completeness rejects a source without its exact Inventory origin', async () =>
  withDatabase(async (f) => {
    const c = await f.runtime.connect();
    try {
      await c.query('BEGIN');
      await source(c, ids());
      await assert.rejects(
        c.query('SET CONSTRAINTS procurement.i2_arrival_complete_ck IMMEDIATE'),
        (e: unknown) => (e as { constraint?: string }).constraint === 'i2_arrival_complete_ck',
      );
      await c.query('ROLLBACK');
      assert.equal(
        (await f.owner.query<{ count: string }>('SELECT count(*) FROM procurement.inbound_arrival'))
          .rows[0]!.count,
        '0',
      );
    } finally {
      await c.query('ROLLBACK');
      c.release();
    }
  }));
void test('I2 complete source-to-Ledger bundle admits exact stock and preserves document precision', async () =>
  withDatabase(async (f) => {
    const c = await f.runtime.connect();
    const b = ids();
    try {
      await c.query('BEGIN');
      await source(c, b);
      await stock(c, b);
      await c.query('SET CONSTRAINTS ALL IMMEDIATE');
      await c.query('COMMIT');
      const r = await f.owner.query(
        'SELECT origin_net_kg_text,destination_net_kg_text FROM procurement.inbound_arrival',
      );
      assert.deepEqual(r.rows[0], {
        origin_net_kg_text: '002000.00100',
        destination_net_kg_text: '1999.9900',
      });
      assert.equal(
        (
          await f.owner.query<{ matches: boolean }>(
            'SELECT inventory.i2_receiving_stock_matches($1,$1,$2) AS matches',
            [scope, b.source],
          )
        ).rows[0]!.matches,
        true,
      );
    } finally {
      await c.query('ROLLBACK');
      c.release();
    }
  }));
void test('I2 source-to-stock predicate rejects a real Ledger entry with wrong kilograms', async () =>
  withDatabase(async (f) => {
    const c = await f.runtime.connect();
    try {
      await c.query('BEGIN');
      const b = ids();
      await source(c, b);
      await stock(c, b, '1999');
      await assert.rejects(c.query('SET CONSTRAINTS ALL IMMEDIATE'), (e: unknown) =>
        ['i2_arrival_complete_ck', 'i2_origin_complete_ck'].includes(
          (e as { constraint: string }).constraint,
        ),
      );
    } finally {
      await c.query('ROLLBACK');
      c.release();
    }
  }));
void test('I2 runtime cannot mint, delete or alter authoritative physical-code claims', async () =>
  withDatabase(async (f) => {
    for (const sql of [
      "INSERT INTO procurement.inbound_physical_code_claim(installation_id,authority_scope,raw_code,received_unit_id) VALUES($1,$1,'forged',$2)",
      'DELETE FROM procurement.inbound_physical_code_claim WHERE installation_id=$1 AND received_unit_id=$2',
      "UPDATE procurement.inbound_physical_code_claim SET raw_code='forged' WHERE installation_id=$1 AND received_unit_id=$2",
    ]) {
      await assert.rejects(
        f.runtime.query(sql, [scope, randomUUID()]),
        (e: unknown) => (e as { code: string }).code === '42501',
      );
    }
    const role = await f.owner.query<{ allowed: boolean }>(
      `SELECT has_function_privilege($1,'procurement.i2_claim_physical_code()','EXECUTE') AS allowed`,
      [f.runtimeRole],
    );
    assert.equal(role.rows[0]!.allowed, false);
  }));
void test('I2 matching Ledger columns cannot conceal a forged effect weight or customer scope', async () =>
  withDatabase(async (f) => {
    const c = await f.runtime.connect();
    try {
      for (const [bindingKg, bindingCustomer] of [
        ['1', ''],
        ['2000', randomUUID()],
      ]) {
        await c.query('BEGIN');
        const b = ids();
        await source(c, b);
        await stock(c, b, '2000', bindingKg, bindingCustomer);
        await assert.rejects(c.query('SET CONSTRAINTS ALL IMMEDIATE'), (e: unknown) =>
          ['i2_arrival_complete_ck', 'i2_origin_complete_ck'].includes(
            (e as { constraint: string }).constraint,
          ),
        );
        await c.query('ROLLBACK');
      }
      assert.equal(
        (
          await f.owner.query<{ count: string }>(
            'SELECT count(*) FROM inventory.inbound_unit_origin',
          )
        ).rows[0]!.count,
        '0',
      );
    } finally {
      await c.query('ROLLBACK');
      c.release();
    }
  }));
void test('I2 immutable source and bounded original ordinal reject later append and updates', async () =>
  withDatabase(async (f) => {
    const c = await f.runtime.connect();
    const b = ids();
    try {
      await c.query('BEGIN');
      await source(c, b);
      await stock(c, b);
      await c.query('SET CONSTRAINTS ALL IMMEDIATE');
      await c.query('COMMIT');
      await assert.rejects(
        f.runtime.query(
          "UPDATE procurement.inbound_received_unit SET internal_system_code='changed' WHERE received_unit_id=$1",
          [b.source],
        ),
        (e: unknown) => (e as { code: string }).code === '42501',
      );
      await assert.rejects(
        f.owner.query(
          "UPDATE procurement.inbound_received_unit SET internal_system_code='changed' WHERE received_unit_id=$1",
          [b.source],
        ),
        (e: unknown) => (e as { constraint: string }).constraint === 'i2_source_immutable_ck',
      );
      await assert.rejects(
        f.owner.query(
          'INSERT INTO procurement.inbound_waybill(installation_id,authority_scope,waybill_id,arrival_id,position,declared_waybill_count,reference) VALUES($1,$1,$2,$3,2,2,$4)',
          [scope, randomUUID(), b.arrival, `extra-${randomUUID()}`],
        ),
        (e: unknown) => (e as { constraint: string }).constraint === 'i2_waybill_parent_fk',
      );
    } finally {
      await c.query('ROLLBACK');
      c.release();
    }
  }));
void test('I2 historical unclaimed legacy system code is protected without backfill', async () =>
  withDatabase(async (f) => {
    const c = await f.owner.connect();
    const code = `historical-${randomUUID()}`;
    try {
      await c.query('BEGIN');
      await c.query('ALTER TABLE procurement.goods_receipt DISABLE TRIGGER i2_legacy_code_claim');
      await c.query(
        `INSERT INTO procurement.goods_receipt(installation_id,authority_scope,receipt_id,binding,state,internal_code,count,measured_kg,type,location_id,lot_id,unit_id,material_id,effect_id,issuer,subject,actor_role,request_id,idempotency_key) VALUES($1,$1,$2,'{}','POSTED',$3,1,2000,'COIL',$4,$5,$6,$7,$8,$9,$10,'ACT-WH',$11,$12)`,
        [
          scope,
          randomUUID(),
          code,
          randomUUID(),
          randomUUID(),
          randomUUID(),
          randomUUID(),
          randomUUID(),
          actor.issuer,
          actor.subject,
          randomUUID(),
          randomUUID(),
        ],
      );
      await c.query('ALTER TABLE procurement.goods_receipt ENABLE TRIGGER i2_legacy_code_claim');
      await c.query('COMMIT');
      const b = ids();
      b.code = code;
      await c.query('BEGIN');
      await assert.rejects(
        source(c, b),
        (e: unknown) => (e as { constraint: string }).constraint === 'i2_code_claim_pk',
      );
      await c.query('ROLLBACK');
      assert.equal(
        (
          await f.owner.query<{ count: string }>(
            'SELECT count(*) FROM procurement.inbound_physical_code_claim',
          )
        ).rows[0]!.count,
        '0',
      );
    } finally {
      await c.query('ROLLBACK');
      c.release();
    }
  }));
void test('I2 legacy lifecycle reaches POSTED once and cannot detach its claimed physical identity', async () =>
  withDatabase(async (f) => {
    const c = await f.runtime.connect();
    const id = randomUUID();
    try {
      await c.query('BEGIN');
      await c.query(
        `INSERT INTO procurement.goods_receipt(installation_id,authority_scope,receipt_id,binding,state,internal_code,count,measured_kg,type,location_id,issuer,subject,actor_role,request_id,idempotency_key) VALUES($1,$1,$2,'{}','DRAFT',$3,1,2000,'COIL',$4,$5,$6,'ACT-WH',$7,$8)`,
        [
          scope,
          id,
          `legacy-${id}`,
          randomUUID(),
          actor.issuer,
          actor.subject,
          randomUUID(),
          randomUUID(),
        ],
      );
      await c.query(`UPDATE procurement.goods_receipt SET state='RECEIVED' WHERE receipt_id=$1`, [
        id,
      ]);
      await c.query(
        `UPDATE procurement.goods_receipt SET state='POSTED',lot_id=$2,unit_id=$3,material_id=$4,effect_id=$5 WHERE receipt_id=$1`,
        [id, randomUUID(), randomUUID(), randomUUID(), randomUUID()],
      );
      await c.query('COMMIT');
      for (const pool of [f.runtime, f.owner]) {
        for (const sql of [
          "UPDATE procurement.goods_receipt SET state='RECEIVED',lot_id=NULL,unit_id=NULL,material_id=NULL,effect_id=NULL WHERE receipt_id=$1",
          "UPDATE procurement.goods_receipt SET effect_id='00000000-0000-4000-8000-000000000009' WHERE receipt_id=$1",
        ]) {
          await assert.rejects(
            pool.query(sql, [id]),
            (error: unknown) =>
              (error as { constraint: string }).constraint === 'i2_legacy_identity_ck',
          );
        }
      }
      assert.equal(
        (
          await f.owner.query<{ state: string }>(
            'SELECT state FROM procurement.goods_receipt WHERE receipt_id=$1',
            [id],
          )
        ).rows[0]!.state,
        'POSTED',
      );
    } finally {
      await c.query('ROLLBACK');
      c.release();
    }
  }));

void test('I2 migration preflight rejects historical nonexact receipt-origin mirrors without rewriting them', async () =>
  withDatabase(async (f) => {
    const c = await f.owner.connect();
    const b = ids();
    const migration = readFileSync('database/migrations/0018_purchase_receiving.sql', 'utf8');
    const preflight = migration.match(
      /DO \$i2_legacy_mirror_preflight\$[\s\S]*?END \$i2_legacy_mirror_preflight\$;/,
    )?.[0];
    assert.ok(preflight, 'Execute the actual migration preflight rather than a test duplicate');
    try {
      await c.query('BEGIN');
      await c.query(
        `INSERT INTO inventory.unit(installation_id,authority_scope,unit_id,lot_id,kind,location_id,customer_scope,state) VALUES($1,$1,$2,$3,'COIL',$4,'','AVAILABLE')`,
        [scope, b.unit, b.lot, b.location],
      );
      await c.query(
        `INSERT INTO procurement.goods_receipt(installation_id,authority_scope,receipt_id,binding,state,internal_code,count,measured_kg,type,location_id,lot_id,unit_id,material_id,effect_id,issuer,subject,actor_role,request_id,idempotency_key) VALUES($1,$1,$2,'{}','POSTED',$3,1,2000,'COIL',$4,$5,$6,$7,$8,$9,$10,'ACT-WH',$11,$12)`,
        [
          scope,
          b.receipt,
          b.code,
          b.location,
          b.lot,
          b.unit,
          b.material,
          b.effect,
          actor.issuer,
          actor.subject,
          b.request,
          b.key,
        ],
      );
      await c.query(
        `INSERT INTO inventory.material_lot(installation_id,authority_scope,lot_id,receipt_id,unit_id,material_id,effect_id,internal_code,count,measured_kg,type,location_id) VALUES($1,$1,$2,$3,$4,$5,$6,$7,1,2000,'COIL',$8)`,
        [scope, b.lot, b.receipt, b.unit, b.material, b.effect, b.code, b.location],
      );
      await c.query(preflight);
      // Reproduce a historical mirror discrepancy which old schemas could admit.
      await c.query('ALTER TABLE inventory.material_lot DROP CONSTRAINT i2_legacy_source_code_fk');
      await c.query('ALTER TABLE inventory.material_lot DISABLE TRIGGER i2_legacy_code_exact');
      const conflictingCode = `${b.code}-different`;
      await c.query('UPDATE inventory.material_lot SET internal_code=$1 WHERE lot_id=$2', [
        conflictingCode,
        b.lot,
      ]);
      await c.query('SAVEPOINT historical_scan');
      await assert.rejects(c.query(preflight), (error: unknown) => {
        const failure = error as { constraint?: string; message?: string };
        return (
          failure.constraint === 'i2_legacy_mirror_preflight_ck' &&
          !failure.message?.includes(b.code)
        );
      });
      await c.query('ROLLBACK TO SAVEPOINT historical_scan');
      assert.equal(
        (
          await c.query<{ internal_code: string }>(
            'SELECT internal_code FROM inventory.material_lot WHERE lot_id=$1',
            [b.lot],
          )
        ).rows[0]!.internal_code,
        conflictingCode,
      );
      await c.query('ROLLBACK');
    } finally {
      await c.query('ROLLBACK');
      c.release();
    }
  }));
