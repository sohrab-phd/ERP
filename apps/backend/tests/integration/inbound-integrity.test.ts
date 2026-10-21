import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import type { PoolClient } from 'pg';
import { withDatabase } from '../support/database-fixture.js';
import {
  assertInboundText,
  assertDimension,
  assertUnitInteger,
  normalizeOrderReference,
  parseJalaliDate,
} from '../../src/modules/procurement/index.js';

type Sql = Pick<PoolClient, 'query'>;
const installation = '00000000-0000-4000-8000-000000000001';
const metadata = () => ['{}', 'fixture', 'fixture-person', 'ACT-PROC', randomUUID(), randomUUID()];
function code(expected: string, constraint?: string) {
  return (error: unknown) =>
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === expected &&
    (constraint === undefined || ('constraint' in error && error.constraint === constraint));
}
async function option(
  c: Sql,
  id = randomUUID(),
  label = 'material',
  kind = 'MATERIAL_TYPE',
  scope = installation,
) {
  await c.query(
    'INSERT INTO procurement.inbound_catalogue_option(installation_id,authority_scope,option_id,label,catalogue_kind,binding,issuer,subject,actor_role,request_id,idempotency_key) VALUES($1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [scope, id, label, kind, ...metadata()],
  );
  return id;
}
async function header(c: Sql, id: string, reference: string, count = 1, date = [1403, 12, 30]) {
  await c.query(
    'INSERT INTO procurement.operational_purchase_order(installation_id,authority_scope,order_id,order_reference,line_count,registration_jy,registration_jm,registration_jd,binding,issuer,subject,actor_role,request_id,idempotency_key) VALUES($1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',
    [installation, id, reference, count, ...date, ...metadata()],
  );
}
async function line(c: Sql, order: string, material: string, position = 1, count = 1) {
  await c.query(
    'INSERT INTO procurement.operational_purchase_order_line(installation_id,authority_scope,order_id,line_id,declared_line_count,position,material_type_option_id,width_m_text,thickness_mm_text,unit_weight_kg_text,ordered_unit_count_text) VALUES($1,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [installation, order, randomUUID(), count, position, material, '1.200', '0.35', '2000', '5'],
  );
}

void test('I1 PostgreSQL finite R1 mappings agree with application without expanding equivalence', async () => {
  await withDatabase(async (db) => {
    const vectors = [
      ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩يك',
      ' PO-۱۲ ',
      'Po-١٢',
      'كالا-ي۱۲',
      'PO-012',
      'PO12',
      'PO_12',
      'PO-1 2',
      '\u00a0PO-12\u00a0',
      '\u200bPO-12',
      'ＰＯ-１２',
      'é',
      'e\u0301',
      ' PO-۱۲\u200c ',
    ];
    const result = await db.runtime.query<{ raw: string; key: string }>(
      'SELECT raw,procurement.po_reference_key_r1_v1(raw) AS key FROM unnest($1::text[]) AS x(raw)',
      [vectors],
    );
    assert.equal(result.rows.length, vectors.length);
    for (const row of result.rows) assert.equal(row.key, normalizeOrderReference(row.raw));
    assert.equal(result.rows.find((r) => r.raw === ' PO-۱۲ ')?.key, 'po-12');
    assert.notEqual(normalizeOrderReference('PO-012'), normalizeOrderReference('PO-12'));
    assert.notEqual(normalizeOrderReference('\u00a0PO-12'), normalizeOrderReference('PO-12'));
    const helper = await db.owner.query(
      "SELECT provolatile,proisstrict,proparallel,prosecdef,proconfig FROM pg_proc WHERE oid='procurement.po_reference_key_r1_v1(text)'::regprocedure",
    );
    assert.deepEqual(helper.rows[0], {
      provolatile: 'i',
      proisstrict: true,
      proparallel: 's',
      prosecdef: false,
      proconfig: ['search_path=pg_catalog'],
    });
  });
});

void test('I1 generated key preserves raw source, rejects forgery and transactionally rejects equivalent sources', async () => {
  await withDatabase(async (db) => {
    const material = await option(db.runtime);
    const c = await db.runtime.connect();
    const id = randomUUID();
    try {
      await c.query('BEGIN');
      await header(c, id, ' PO-۱۲ ');
      await line(c, id, material);
      await c.query('COMMIT');
      const stored = await c.query(
        'SELECT order_reference,order_reference_key FROM procurement.operational_purchase_order WHERE installation_id=$1 AND authority_scope=$1 AND order_id=$2',
        [installation, id],
      );
      assert.deepEqual(stored.rows[0], {
        order_reference: ' PO-۱۲ ',
        order_reference_key: 'po-12',
      });
      await assert.rejects(header(c, randomUUID(), 'po-١٢'), code('23505', 'i1_po_reference_uq'));
      await assert.rejects(
        c.query(
          'INSERT INTO procurement.operational_purchase_order(installation_id,authority_scope,order_id,order_reference,order_reference_key,line_count,registration_jy,registration_jm,registration_jd,binding,issuer,subject,actor_role,request_id,idempotency_key) VALUES($1,$1,$2,$3,$4,1,1403,1,1,$5,$6,$7,$8,$9,$10)',
          [installation, randomUUID(), 'unique', 'forged', ...metadata()],
        ),
        code('428C9'),
      );
      assert.equal(
        (
          await c.query<{ n: number }>(
            'SELECT count(*)::integer AS n FROM procurement.operational_purchase_order',
          )
        ).rows[0]?.n,
        1,
      );
    } finally {
      await c.query('ROLLBACK');
      c.release();
    }
  });
});

void test('I1 deferred completeness prevents header-only and gapped commits; failed sources leave no partial aggregate', async () => {
  await withDatabase(async (db) => {
    const material = await option(db.runtime);
    const c = await db.runtime.connect();
    try {
      for (const positions of [[], [1], [1, 3]]) {
        const id = randomUUID();
        await c.query('BEGIN');
        await header(c, id, randomUUID(), 3);
        for (const position of positions) await line(c, id, material, position, 3);
        await assert.rejects(c.query('COMMIT'), code('23514', 'i1_po_complete_ck'));
        await c.query('ROLLBACK');
        assert.equal(
          (
            await c.query<{ n: number }>(
              'SELECT count(*)::integer AS n FROM procurement.operational_purchase_order WHERE order_id=$1',
              [id],
            )
          ).rows[0]?.n,
          0,
        );
        assert.equal(
          (
            await c.query<{ n: number }>(
              'SELECT count(*)::integer AS n FROM procurement.operational_purchase_order_line WHERE order_id=$1',
              [id],
            )
          ).rows[0]?.n,
          0,
        );
      }
      const id = randomUUID();
      await c.query('BEGIN');
      await header(c, id, 'complete', 3);
      for (const position of [1, 2, 3]) await line(c, id, material, position, 3);
      await c.query('COMMIT');
      await assert.rejects(line(c, id, material, 4, 3), code('23514'));
      await assert.rejects(line(c, id, material, 1, 3), code('23505', 'i1_line_position_uq'));
      await assert.rejects(line(c, id, material, 4, 4), code('23503', 'i1_line_parent_count_fk'));
      assert.equal(
        (
          await c.query<{ n: number }>(
            'SELECT count(*)::integer AS n FROM procurement.operational_purchase_order_line WHERE order_id=$1',
            [id],
          )
        ).rows[0]?.n,
        3,
      );
    } finally {
      await c.query('ROLLBACK');
      c.release();
    }
  });
});

void test('I1 savepoint rollback discards deferred events and a failed later line cannot survive', async () => {
  await withDatabase(async (db) => {
    const material = await option(db.runtime);
    const c = await db.runtime.connect();
    try {
      await c.query('BEGIN');
      await c.query('SAVEPOINT rejected');
      const discarded = randomUUID();
      await header(c, discarded, 'discarded', 2);
      await line(c, discarded, material, 1, 2);
      await assert.rejects(
        line(c, discarded, randomUUID(), 2, 2),
        code('23503', 'i1_line_material_fk'),
      );
      await c.query('ROLLBACK TO SAVEPOINT rejected');
      const accepted = randomUUID();
      await header(c, accepted, 'after-savepoint');
      await line(c, accepted, material);
      await c.query('COMMIT');
      const rows = await c.query('SELECT order_id FROM procurement.operational_purchase_order');
      assert.deepEqual(rows.rows, [{ order_id: accepted }]);
      assert.equal(
        (
          await c.query<{ n: number }>(
            'SELECT count(*)::integer AS n FROM procurement.operational_purchase_order_line WHERE order_id=$1',
            [discarded],
          )
        ).rows[0]?.n,
        0,
      );
    } finally {
      await c.query('ROLLBACK');
      c.release();
    }
  });
});

void test('I1 typed same-scope catalogue FKs and frozen count cannot be bypassed', async () => {
  await withDatabase(async (db) => {
    const color = await option(db.runtime, randomUUID(), 'color', 'COLOR');
    const foreign = await option(
      db.runtime,
      randomUUID(),
      'foreign',
      'MATERIAL_TYPE',
      randomUUID(),
    );
    const c = await db.runtime.connect();
    try {
      await c.query('BEGIN');
      const id = randomUUID();
      await header(c, id, 'wrong-options');
      for (const material of [color, foreign]) {
        await c.query('SAVEPOINT wrong');
        await assert.rejects(line(c, id, material), code('23503', 'i1_line_material_fk'));
        await c.query('ROLLBACK TO SAVEPOINT wrong');
      }
      await c.query('ROLLBACK');
      assert.equal(
        (
          await c.query<{ n: number }>(
            'SELECT count(*)::integer AS n FROM procurement.operational_purchase_order',
          )
        ).rows[0]?.n,
        0,
      );
    } finally {
      await c.query('ROLLBACK');
      c.release();
    }
  });
});

void test('I1 exact catalogue identity, UTF8 scalar bounds and immutable restricted privileges are enforced', async () => {
  await withDatabase(async (db) => {
    const valid = [
      'ی',
      'ي',
      'ک',
      'ك',
      ' A ',
      'A',
      'a',
      '۱۲',
      '12',
      '\u200c',
      '😀'.repeat(128),
      'ا'.repeat(128),
    ];
    for (const label of valid) await option(db.runtime, randomUUID(), label);
    await assert.rejects(
      option(db.runtime, randomUUID(), 'A'),
      code('23505', 'i1_option_label_uq'),
    );
    for (const label of [
      '',
      ' ',
      '\u00a0',
      '\ufeff',
      '\n',
      '\u0001x',
      'x\u0085',
      'ا'.repeat(129),
      '😀'.repeat(129),
    ]) {
      await assert.rejects(option(db.runtime, randomUUID(), label), code('23514'));
    }
    for (const table of [
      'inbound_catalogue_option',
      'operational_purchase_order',
      'operational_purchase_order_line',
    ]) {
      for (const sql of [
        `UPDATE procurement.${table} SET installation_id=installation_id`,
        `DELETE FROM procurement.${table}`,
        `TRUNCATE procurement.${table}`,
        `ALTER TABLE procurement.${table} ADD COLUMN unauthorized integer`,
      ]) {
        await assert.rejects(db.runtime.query(sql), code('42501'));
      }
    }
    await assert.rejects(
      db.runtime.query('CREATE TABLE procurement.unauthorized(id integer)'),
      code('42501'),
    );
    await assert.rejects(
      db.runtime.query(
        'ALTER FUNCTION procurement.po_reference_key_r1_v1(text) RENAME TO unauthorized',
      ),
      code('42501'),
    );
    const privileges = await db.owner.query<{ allowed: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM pg_proc p,LATERAL aclexplode(p.proacl) a WHERE p.oid='procurement.po_reference_key_r1_v1(text)'::regprocedure AND a.grantee=0 AND a.privilege_type='EXECUTE') AS allowed",
    );
    assert.equal(privileges.rows[0]?.allowed, false);
  });
});

void test('I1 actual Jalali CHECK agrees with validated application profile for every supported year', async () => {
  await withDatabase(async (db) => {
    const c = await db.runtime.connect();
    try {
      await c.query('BEGIN');
      const dates: number[][] = [];
      for (let year = 1206; year <= 1498; year++) {
        dates.push([year, 12, 29], [year, 12, 30], [year, 12, 31]);
      }
      for (const year of [1206, 1403, 1404, 1498]) {
        for (let month = 1; month <= 12; month++) {
          dates.push([year, month, 0], [year, month, 30], [year, month, 31], [year, month, 32]);
        }
      }
      dates.push([1205, 1, 1], [1499, 1, 1], [1404, 0, 1], [1404, 13, 1]);
      for (const date of dates) {
        const text = date
          .map((v, index) => v.toString().padStart(index === 0 ? 4 : 2, '0'))
          .join('-');
        let valid = true;
        try {
          parseJalaliDate(text);
        } catch {
          valid = false;
        }
        await c.query('SAVEPOINT date_probe');
        if (valid) await header(c, randomUUID(), randomUUID(), 1, date);
        else
          await assert.rejects(
            header(c, randomUUID(), randomUUID(), 1, date),
            code('23514', 'i1_po_jalali_ck'),
            text,
          );
        await c.query('ROLLBACK TO SAVEPOINT date_probe');
      }
      await c.query('COMMIT');
      assert.equal(
        (
          await db.runtime.query<{ n: number }>(
            'SELECT count(*)::integer AS n FROM procurement.operational_purchase_order',
          )
        ).rows[0]?.n,
        0,
      );
    } finally {
      await c.query('ROLLBACK');
      c.release();
    }
  });
});

void test('I1 numeric CHECKs preserve exact lexemes and reject malformed input without an unsafe cast', async () => {
  await withDatabase(async (db) => {
    const material = await option(db.runtime);
    const c = await db.runtime.connect();
    try {
      await c.query('BEGIN');
      const id = randomUUID();
      await header(c, id, 'numeric-probe');
      const dimensions = [
        '1.200',
        '0.000000000000000001',
        '99999999999999999999.999999999999999999',
        '0',
        '0.000',
        '-1',
        '+1',
        '01',
        '1e2',
        '1,2',
        'NaN',
        'Infinity',
        '1\n',
        '1\r',
        '1\u2028',
        '1\u2029',
        '1.1234567890123456789',
        '100000000000000000000',
        '1'.repeat(1000),
      ];
      for (const value of dimensions) {
        let valid = true;
        try {
          assertDimension(value);
        } catch {
          valid = false;
        }
        await c.query('SAVEPOINT numeric_probe');
        const insert = () =>
          c.query(
            'INSERT INTO procurement.operational_purchase_order_line(installation_id,authority_scope,order_id,line_id,declared_line_count,position,material_type_option_id,width_m_text,thickness_mm_text,length_m_text,unit_weight_kg_text,ordered_unit_count_text) VALUES($1,$1,$2,$3,1,1,$4,$5,$5,$5,$6,$6) RETURNING width_m_text,thickness_mm_text,length_m_text',
            [installation, id, randomUUID(), material, value, '99999999999999999999'],
          );
        if (valid) {
          const row: unknown = (await insert()).rows[0];
          assert.deepEqual(row, {
            width_m_text: value,
            thickness_mm_text: value,
            length_m_text: value,
          });
        } else await assert.rejects(insert(), code('23514'), value);
        await c.query('ROLLBACK TO SAVEPOINT numeric_probe');
      }
      const integers = [
        '1',
        '99999999999999999999',
        '0',
        '-1',
        '+1',
        '01',
        '1.0',
        '۱',
        '1e3',
        '1\n',
        '1\r',
        '1\u2028',
        '1\u2029',
        '100000000000000000000',
        '1'.repeat(1000),
      ];
      for (const value of integers) {
        let valid = true;
        try {
          assertUnitInteger(value);
        } catch {
          valid = false;
        }
        await c.query('SAVEPOINT integer_probe');
        const insert = () =>
          c.query(
            'INSERT INTO procurement.operational_purchase_order_line(installation_id,authority_scope,order_id,line_id,declared_line_count,position,material_type_option_id,width_m_text,thickness_mm_text,unit_weight_kg_text,ordered_unit_count_text) VALUES($1,$1,$2,$3,1,1,$4,$5,$5,$6,$6) RETURNING unit_weight_kg_text,ordered_unit_count_text',
            [installation, id, randomUUID(), material, '1.000', value],
          );
        if (valid)
          assert.deepEqual((await insert()).rows[0], {
            unit_weight_kg_text: value,
            ordered_unit_count_text: value,
          });
        else await assert.rejects(insert(), code('23514'), value);
        await c.query('ROLLBACK TO SAVEPOINT integer_probe');
      }
      await c.query('ROLLBACK');
    } finally {
      await c.query('ROLLBACK');
      c.release();
    }
  });
});

void test('I1 application/database text predicates agree on every frozen control/blank scalar and preserve Unicode variants', async () => {
  await withDatabase(async (db) => {
    const controls = [
      ...Array.from({ length: 31 }, (_, i) => i + 1),
      ...Array.from({ length: 33 }, (_, i) => i + 127),
    ];
    const blanks = [
      9,
      10,
      11,
      12,
      13,
      32,
      160,
      5760,
      ...Array.from({ length: 11 }, (_, i) => 8192 + i),
      8232,
      8233,
      8239,
      8287,
      12288,
      65279,
    ];
    const cases = [
      ...new Set([
        '',
        ...controls.map((n) => `a${String.fromCodePoint(n)}b`),
        ...blanks.map((n) => String.fromCodePoint(n)),
        ...blanks.filter((n) => !controls.includes(n)).map((n) => `a${String.fromCodePoint(n)}b`),
        '\u200c',
        '\u200b',
        '\u2060',
        'e\u0301',
        'é',
        'ی',
        'ي',
        'ک',
        'ك',
        'A',
        'a',
        ' A ',
        'a'.repeat(128),
        'ا'.repeat(128),
        '😀'.repeat(128),
        'e\u0301'.repeat(64),
        'a'.repeat(129),
        'ا'.repeat(129),
        '😀'.repeat(129),
        'e\u0301'.repeat(65),
      ]),
    ];
    for (const value of cases) {
      let valid = true;
      try {
        assertInboundText(value);
      } catch {
        valid = false;
      }
      if (valid) {
        const id = await option(db.runtime, randomUUID(), value);
        const stored = await db.runtime.query<{ label: string }>(
          'SELECT label FROM procurement.inbound_catalogue_option WHERE installation_id=$1 AND authority_scope=$1 AND option_id=$2',
          [installation, id],
        );
        assert.equal(stored.rows[0]?.label, value);
      } else await assert.rejects(option(db.runtime, randomUUID(), value), code('23514'));
    }
    assert.throws(() => assertInboundText('\u0000'));
    await assert.rejects(option(db.runtime, randomUUID(), '\u0000'), code('22021'));
  });
});
