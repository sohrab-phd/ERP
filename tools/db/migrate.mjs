import { Pool } from 'pg';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { validateMigrationSql } from './sql-guard.mjs';
import { TextDecoder } from 'node:util';
const inventory = [
  '0001_kernel_schema.sql',
  '0002_audit_event.sql',
  '0003_command_outcome.sql',
  '0004_identity_authorization.sql',
  '0005_inventory_posting.sql',
  '0006_goods_receipt.sql',
  '0007_sales_demand.sql',
  '0008_reservation_requests.sql',
  '0009_inventory_dispatch.sql',
  '0010_stock_shipment.sql',
];
export async function loadMigrations(
  directory = fileURLToPath(new URL('../../database/migrations/', import.meta.url)),
) {
  const names = (await readdir(directory)).filter((x) => x.endsWith('.sql')).sort();
  if (JSON.stringify(names) !== JSON.stringify(inventory))
    throw new Error('Migration inventory differs from freeze');
  const entries = [];
  for (const version of names) {
    const bytes = await readFile(resolve(directory, version));
    const sql = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    entries.push({ version, sql, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  return entries;
}
export async function applyMigrations(client, entries, dryRun = false) {
  if (
    !Array.isArray(entries) ||
    JSON.stringify(entries.map((e) => e.version)) !== JSON.stringify(inventory)
  )
    throw new Error('Invalid migration inventory');
  for (const e of entries) {
    if (
      typeof e.sql !== 'string' ||
      createHash('sha256').update(e.sql, 'utf8').digest('hex') !== e.sha256
    )
      throw new Error('Invalid migration content');
    validateMigrationSql(e.sql);
  }
  await client.query('SELECT pg_advisory_lock(1312903757,1)');
  try {
    const probe = await client.query("SELECT to_regclass('kernel.schema_migrations') AS ledger");
    let applied = [];
    if (probe.rows[0].ledger) {
      applied = (
        await client.query('SELECT version,sha256 FROM kernel.schema_migrations ORDER BY version')
      ).rows;
    }
    for (const a of applied) {
      const current = entries.find((e) => e.version === a.version);
      if (!current || current.sha256 !== a.sha256)
        throw new Error('Applied migration missing/checksum drift');
    }
    const pending = entries.filter((e) => !applied.some((a) => a.version === e.version));
    if (dryRun) return pending.map((e) => e.version);
    if (!probe.rows[0].ledger) {
      await client.query('BEGIN');
      try {
        await client.query(
          "CREATE SCHEMA IF NOT EXISTS kernel;CREATE TABLE IF NOT EXISTS kernel.schema_migrations(version text PRIMARY KEY,sha256 char(64) NOT NULL CHECK(sha256 ~ '^[0-9a-f]{64}$'),applied_at timestamptz NOT NULL DEFAULT clock_timestamp())",
        );
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      }
    }
    for (const e of pending) {
      await client.query('BEGIN');
      try {
        await client.query(e.sql);
        await client.query('INSERT INTO kernel.schema_migrations(version,sha256) VALUES($1,$2)', [
          e.version,
          e.sha256,
        ]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    return pending.map((e) => e.version);
  } finally {
    await client.query('SELECT pg_advisory_unlock(1312903757,1)');
  }
}
export async function migrateDatabase(url, { dryRun = false, entries } = {}) {
  if (!url) throw new Error('MIGRATION_DATABASE_URL is required');
  const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5000, max: 1 });
  const onError = () => undefined;
  pool.on('error', onError);
  let client;
  try {
    client = await pool.connect();
    client.on('error', onError);
    return await applyMigrations(client, entries ?? (await loadMigrations()), dryRun);
  } finally {
    if (client) {
      client.removeListener('error', onError);
      client.release();
    }
    await pool.end();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.slice(2).some((x) => x !== '--dry-run') || process.argv.length > 3)
      throw new Error('Invalid migration arguments');
    const versions = await migrateDatabase(process.env.MIGRATION_DATABASE_URL, {
      dryRun: process.argv.includes('--dry-run'),
    });
    console.log(
      JSON.stringify({ migrationVersions: versions, dryRun: process.argv.includes('--dry-run') }),
    );
  } catch {
    console.error('Migration failed; inspect the reviewed inventory and owner connection');
    process.exitCode = 1;
  }
}
