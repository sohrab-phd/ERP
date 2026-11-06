import assert from 'node:assert/strict';
import test from 'node:test';
import { runTool, withDatabase } from '../support/database-fixture.js';
import {
  completed,
  operators,
  receiptCommand,
  receiptHarness,
} from '../support/receipt-harness.js';

function migrationProbe(operation: string) {
  return runTool('--input-type=module', [
    '-e',
    `
    import {Pool} from 'pg';
    import {createHash} from 'node:crypto';
    import {loadMigrations,applyMigrations} from './tools/db/migrate.mjs';
    const pool=new Pool({connectionString:process.env.MIGRATION_DATABASE_URL});
    const client=await pool.connect();
    try {
      let entries=await loadMigrations();
      ${operation}
    } catch(error) {
      console.error(JSON.stringify({migrationProbeFailure:true,code:error.code??'unknown',message:error.message}));
      process.exitCode=1;
    } finally {client.release();await pool.end();}
  `,
  ]);
}

function hasStderr(...fragments: string[]) {
  return (error: unknown): boolean => {
    if (
      typeof error !== 'object' ||
      error === null ||
      !('stderr' in error) ||
      typeof error.stderr !== 'string'
    )
      return false;
    const stderr = error.stderr;
    return fragments.every((fragment) => stderr.includes(fragment));
  };
}

void test('fresh/second migration and concurrent runners are checksum-bound and serialized', async () => {
  await withDatabase(async (db) => {
    await db.owner.query(
      'DROP SCHEMA IF EXISTS finance CASCADE; DROP SCHEMA IF EXISTS production CASCADE; DROP SCHEMA IF EXISTS shipping CASCADE; DROP SCHEMA IF EXISTS sales CASCADE; DROP SCHEMA IF EXISTS procurement CASCADE; DROP SCHEMA IF EXISTS inventory CASCADE; DROP SCHEMA IF EXISTS identity CASCADE; DROP SCHEMA kernel CASCADE',
    );
    await Promise.all([runTool('tools/db/migrate.mjs'), runTool('tools/db/migrate.mjs')]);
    const ledger = await db.owner.query(
      'SELECT version,sha256 FROM kernel.schema_migrations ORDER BY version',
    );
    assert.equal(ledger.rowCount, 19);
    assert.ok(ledger.rows.every((row: { sha256: string }) => /^[0-9a-f]{64}$/.test(row.sha256)));
    await runTool('tools/db/migrate.mjs');
    assert.deepEqual(
      (await db.owner.query('SELECT version,sha256 FROM kernel.schema_migrations ORDER BY version'))
        .rows,
      ledger.rows,
    );
  });
});

void test('Inventory visibility upgrades a populated 0018 schema with only the five approved indexes', async () => {
  await withDatabase(async (db) => {
    const version = '0019_inventory_visibility_indexes.sql';
    const indexes = [
      ['p4a_legacy_code', 'material_lot', 'internal_code COLLATE "C"'],
      ['p4a_unit_kind', 'unit', 'kind'],
      ['p4a_unit_location', 'unit', 'location_id'],
      ['p4a_unit_lot', 'unit', 'lot_id'],
      ['p4a_unit_state', 'unit', 'state'],
    ] as const;
    // Reproduce the previous schema in the guarded test fixture. 0019 has only index DDL.
    await db.owner.query(
      `DROP INDEX ${indexes.map(([name]) => `inventory.${name}`).join(', ')};
       DELETE FROM kernel.schema_migrations WHERE version = '${version}'`,
    );
    const people = await operators(db);
    completed(
      await receiptHarness(db, people.identity).run(receiptCommand(), await people.actor('ACT-WH')),
      'accepted',
    );
    const ledger = async () =>
      (
        await db.owner.query<{ version: string; sha256: string; applied_at: Date }>(
          'SELECT * FROM kernel.schema_migrations ORDER BY version',
        )
      ).rows;
    const stock = async () =>
      (
        await db.owner.query<{
          units: unknown[];
          lots: unknown[];
          balances: unknown[];
          entries: unknown[];
        }>(`SELECT
          (SELECT jsonb_agg(to_jsonb(u) ORDER BY unit_id) FROM inventory.unit u) AS units,
          (SELECT jsonb_agg(to_jsonb(l) ORDER BY unit_id) FROM inventory.material_lot l) AS lots,
          (SELECT jsonb_agg(to_jsonb(b) ORDER BY unit_id) FROM inventory.balance b) AS balances,
          (SELECT jsonb_agg(to_jsonb(e) ORDER BY unit_id) FROM inventory.ledger e) AS entries`)
      ).rows;
    const beforeLedger = await ledger();
    const beforeStock = await stock();
    assert.equal(beforeLedger.length, 18);
    assert.equal(beforeStock[0]?.units.length, 1);
    assert.equal(beforeStock[0]?.entries.length, 1);
    await assert.rejects(db.runtime.query('CREATE INDEX p4a_unit_lot ON inventory.unit (lot_id)'), {
      code: '42501',
    });
    await runTool('tools/db/migrate.mjs');
    assert.deepEqual(
      (
        await db.owner.query(`SELECT indexname, indexdef FROM pg_indexes
          WHERE schemaname = 'inventory' AND starts_with(indexname, 'p4a_') ORDER BY indexname`)
      ).rows,
      indexes.map(([indexname, table, key]) => ({
        indexname,
        indexdef: `CREATE INDEX ${indexname} ON inventory.${table} USING btree (installation_id, authority_scope, ${key}, unit_id)`,
      })),
    );
    assert.deepEqual(await stock(), beforeStock);
    const afterLedger = await ledger();
    assert.deepEqual(afterLedger.slice(0, -1), beforeLedger);
    assert.equal(afterLedger.at(-1)?.version, version);
    await runTool('tools/db/migrate.mjs');
    assert.deepEqual(await ledger(), afterLedger);
    assert.deepEqual(await stock(), beforeStock);
  });
});

void test('dry-run has no DDL; drift and missing applied file fail without modifying ledger', async () => {
  await withDatabase(async (db) => {
    await db.owner.query(
      'DROP SCHEMA IF EXISTS finance CASCADE; DROP SCHEMA IF EXISTS production CASCADE; DROP SCHEMA IF EXISTS shipping CASCADE; DROP SCHEMA IF EXISTS sales CASCADE; DROP SCHEMA IF EXISTS procurement CASCADE; DROP SCHEMA IF EXISTS inventory CASCADE; DROP SCHEMA IF EXISTS identity CASCADE; DROP SCHEMA kernel CASCADE',
    );
    await runTool('tools/db/migrate.mjs', ['--dry-run']);
    assert.equal(
      (
        await db.owner.query<{ schema: string | null }>(
          "SELECT to_regnamespace('kernel') AS schema",
        )
      ).rows[0]?.schema,
      null,
    );
    await runTool('tools/db/migrate.mjs');
    const before = (await db.owner.query('SELECT * FROM kernel.schema_migrations ORDER BY version'))
      .rows;
    await assert.rejects(
      migrationProbe(
        `const suffix=${JSON.stringify('\n-- drift')};entries=entries.map((e,i)=>i===2?{...e,sql:e.sql+suffix,sha256:createHash('sha256').update(e.sql+suffix).digest('hex')}:e);await applyMigrations(client,entries);`,
      ),
      hasStderr('Applied migration missing/checksum drift'),
    );
    await assert.rejects(
      migrationProbe('await applyMigrations(client,entries.slice(0,2));'),
      hasStderr('Invalid migration inventory'),
    );
    assert.deepEqual(
      (await db.owner.query('SELECT * FROM kernel.schema_migrations ORDER BY version')).rows,
      before,
    );
  });
});

void test('failed file SQL and ledger insert rollback together while earlier migrations remain restartable', async () => {
  await withDatabase(async (db) => {
    await db.owner.query(
      'DROP SCHEMA IF EXISTS finance CASCADE; DROP SCHEMA IF EXISTS production CASCADE; DROP SCHEMA IF EXISTS shipping CASCADE; DROP SCHEMA IF EXISTS sales CASCADE; DROP SCHEMA IF EXISTS procurement CASCADE; DROP SCHEMA IF EXISTS inventory CASCADE; DROP SCHEMA IF EXISTS identity CASCADE; DROP SCHEMA kernel CASCADE',
    );
    await assert.rejects(
      migrationProbe(
        `const suffix=${JSON.stringify('\nCREATE TABLE kernel.failure_marker(x integer); SELECT 1/0;')};entries=entries.map((e,i)=>{if(i!==2)return e;const sql=e.sql+suffix;return {...e,sql,sha256:createHash('sha256').update(sql).digest('hex')};});await applyMigrations(client,entries);`,
      ),
      hasStderr('division by zero', '22012'),
    );
    assert.equal(
      (
        await db.owner.query<{ count: number }>(
          'SELECT count(*)::integer AS count FROM kernel.schema_migrations',
        )
      ).rows[0]?.count,
      2,
    );
    assert.equal(
      (
        await db.owner.query<{ marker: string | null; outcome: string | null }>(
          "SELECT to_regclass('kernel.failure_marker') AS marker, to_regclass('kernel.command_outcome') AS outcome",
        )
      ).rows[0]?.marker,
      null,
    );
    assert.equal(
      (
        await db.owner.query<{ outcome: string | null }>(
          "SELECT to_regclass('kernel.command_outcome') AS outcome",
        )
      ).rows[0]?.outcome,
      null,
    );
    await runTool('tools/db/migrate.mjs');
    assert.equal(
      (
        await db.owner.query<{ count: number }>(
          'SELECT count(*)::integer AS count FROM kernel.schema_migrations',
        )
      ).rows[0]?.count,
      19,
    );
  });
});
