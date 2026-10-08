import { Pool } from 'pg';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { loadMigrations, applyMigrations } from './migrate.mjs';
const required = (env, k) => {
  if (!env[k]) throw new Error('Test configuration missing ' + k);
  return env[k];
};
const quote = (x) => '"' + x.replaceAll('"', '""') + '"';
export async function validateTestDatabase(env = process.env) {
  if (env.NODE_ENV !== 'test') throw new Error('Reset/integration requires NODE_ENV=test');
  const runtimeUrl = required(env, 'TEST_DATABASE_URL'),
    ownerUrl = required(env, 'MIGRATION_DATABASE_URL'),
    devUrl = required(env, 'DATABASE_URL'),
    ack = required(env, 'TEST_DATABASE_ACK');
  const r = new URL(runtimeUrl),
    o = new URL(ownerUrl),
    d = new URL(devUrl);
  if (
    !r.pathname.endsWith('_test') ||
    decodeURIComponent(r.pathname.slice(1)) !== ack ||
    r.pathname !== o.pathname ||
    r.host !== o.host ||
    r.pathname === d.pathname ||
    r.username === o.username
  )
    throw new Error('Disposable test identity mismatch');
  const runtime = new Pool({ connectionString: runtimeUrl, max: 1, connectionTimeoutMillis: 5000 }),
    owner = new Pool({ connectionString: ownerUrl, max: 1, connectionTimeoutMillis: 5000 });
  runtime.on('error', () => undefined);
  owner.on('error', () => undefined);
  try {
    const sql =
      "SELECT current_database() AS db,current_user AS role,session_user AS session,current_setting('server_version_num') AS version,rolsuper,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname=current_user";
    const [a, b] = await Promise.all([runtime.query(sql), owner.query(sql)]);
    const ri = a.rows[0],
      oi = b.rows[0];
    if (
      !ri ||
      !oi ||
      ri.db !== ack ||
      oi.db !== ack ||
      ri.role !== decodeURIComponent(r.username) ||
      oi.role !== decodeURIComponent(o.username) ||
      ri.session !== ri.role ||
      oi.session !== oi.role ||
      ri.role === oi.role ||
      ri.rolsuper ||
      ri.rolcreatedb ||
      ri.rolcreaterole ||
      oi.rolsuper ||
      oi.rolcreatedb ||
      oi.rolcreaterole ||
      Number(ri.version) !== 180006 ||
      Number(oi.version) !== 180006
    )
      throw new Error('Actual PostgreSQL identity/version/privileges mismatch');
    const dbOwner = await owner.query(
      'SELECT pg_get_userbyid(datdba) AS owner FROM pg_database WHERE datname=current_database()',
    );
    if (dbOwner.rows[0].owner !== oi.role)
      throw new Error('Reset requires dedicated test database owner');
    return { runtimeUrl, ownerUrl, runtimeRole: ri.role, ownerRole: oi.role, database: ack };
  } finally {
    await Promise.all([runtime.end(), owner.end()]);
  }
}
export async function resetTestDatabase(env = process.env) {
  const identity = await validateTestDatabase(env);
  const pool = new Pool({ connectionString: identity.ownerUrl, max: 1 });
  const onError = () => undefined;
  pool.on('error', onError);
  let client;
  try {
    client = await pool.connect();
    client.on('error', onError);
    await client.query(
      'DROP SCHEMA IF EXISTS envelope_test CASCADE;DROP SCHEMA IF EXISTS sales CASCADE;DROP SCHEMA IF EXISTS procurement CASCADE;DROP SCHEMA IF EXISTS inventory CASCADE;DROP SCHEMA IF EXISTS identity CASCADE;DROP SCHEMA IF EXISTS kernel CASCADE',
    );
    await applyMigrations(client, await loadMigrations());
    await client.query('GRANT USAGE ON SCHEMA kernel TO ' + quote(identity.runtimeRole));
    await client.query(
      'GRANT SELECT,INSERT ON kernel.audit_event,kernel.command_outcome TO ' +
        quote(identity.runtimeRole),
    );
    await client.query('GRANT USAGE ON SCHEMA identity TO ' + quote(identity.runtimeRole));
    await client.query(
      'GRANT SELECT,INSERT,UPDATE ON identity.account,identity.session TO ' +
        quote(identity.runtimeRole),
    );
    await client.query(
      'GRANT SELECT,INSERT,DELETE ON identity.role_grant TO ' + quote(identity.runtimeRole),
    );
    await client.query(
      'GRANT SELECT,INSERT ON identity.security_event TO ' + quote(identity.runtimeRole),
    );
    await client.query('GRANT USAGE ON SCHEMA inventory TO ' + quote(identity.runtimeRole));
    await client.query(
      'GRANT SELECT,INSERT,UPDATE ON inventory.unit,inventory.balance,inventory.reservation TO ' +
        quote(identity.runtimeRole),
    );
    await client.query('GRANT SELECT,INSERT ON inventory.ledger TO ' + quote(identity.runtimeRole));
    await client.query('GRANT USAGE ON SCHEMA sales TO ' + quote(identity.runtimeRole));
    await client.query('GRANT SELECT ON sales.customer TO ' + quote(identity.runtimeRole));
    await client.query(
      'GRANT SELECT,INSERT,UPDATE ON sales.sales_order,sales.fulfillment_assessment TO ' +
        quote(identity.runtimeRole),
    );
    await client.query('GRANT USAGE ON SCHEMA procurement TO ' + quote(identity.runtimeRole));
    await client.query(
      'GRANT SELECT,INSERT,UPDATE ON procurement.goods_receipt TO ' + quote(identity.runtimeRole),
    );
    await client.query(
      'GRANT SELECT,INSERT ON inventory.material_lot TO ' + quote(identity.runtimeRole),
    );
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
    if (process.argv.length !== 2) throw new Error('No reset arguments allowed');
    await resetTestDatabase();
    console.log('Disposable test schemas reset and migrated');
  } catch {
    console.error('Test reset refused or failed');
    process.exitCode = 1;
  }
}
