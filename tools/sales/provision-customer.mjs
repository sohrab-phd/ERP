import { Pool } from 'pg';
import {
  parseBoundedJson,
  validUuid,
  validUnicode,
} from '../../packages/shared-kernel/dist/src/index.js';
/** Explicit DB-owner configuration, not an application customer-management command. No default customer seeds. */
async function main() {
  const args = process.argv.slice(2);
  if (
    args.length !== 6 ||
    args[0] !== '--installation-ack' ||
    args[2] !== '--authority-scope' ||
    args[4] !== '--customer-id'
  )
    throw new Error('Invalid arguments');
  const installation = args[1],
    authority = args[3],
    id = args[5];
  if (
    !validUuid(installation) ||
    installation !== process.env.INSTALLATION_ID ||
    !validUuid(authority) ||
    !validUuid(id) ||
    process.stdin.isTTY
  )
    throw new Error('Explicit configuration acknowledgement required');
  const chunks = [];
  let length = 0;
  for await (const chunk of process.stdin) {
    length += chunk.length;
    if (length > 1024) throw new Error('Input too large');
    chunks.push(chunk);
  }
  const input = parseBoundedJson(Buffer.concat(chunks));
  if (
    !input ||
    typeof input !== 'object' ||
    Array.isArray(input) ||
    Object.keys(input).join() !== 'displayName' ||
    typeof input.displayName !== 'string' ||
    !validUnicode(input.displayName) ||
    !input.displayName.trim() ||
    [...input.displayName].some((c) => c.codePointAt(0) < 32 || c.codePointAt(0) === 127) ||
    Buffer.byteLength(input.displayName, 'utf8') > 128
  )
    throw new Error('Invalid display name');
  if (!process.env.MIGRATION_DATABASE_URL) throw new Error('Database owner URL required');
  const pool = new Pool({
    connectionString: process.env.MIGRATION_DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  pool.on('error', () => undefined);
  const client = await pool.connect();
  client.on('error', () => undefined);
  try {
    const verified = (
      await client.query(
        "SELECT current_user=pg_get_userbyid(datdba) AS owner,current_setting('server_version_num')::integer=180006 AS compatible,current_setting('server_encoding')='UTF8' AS utf8 FROM pg_database WHERE datname=current_database()",
      )
    ).rows[0];
    if (!verified?.owner || !verified.compatible || !verified.utf8)
      throw new Error('Compatible actual database owner required');
    await client.query('BEGIN');
    await client.query(
      'INSERT INTO sales.customer(installation_id,authority_scope,customer_id,display_name) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',
      [installation, authority, id, input.displayName],
    );
    const prior = (
      await client.query(
        'SELECT display_name FROM sales.customer WHERE installation_id=$1 AND authority_scope=$2 AND customer_id=$3',
        [installation, authority, id],
      )
    ).rows[0];
    if (prior?.display_name !== input.displayName)
      throw new Error('Existing customer configuration differs');
    await client.query('COMMIT');
    console.log('Explicit Sales customer reference configured; individual grants remain separate');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
try {
  await main();
} catch {
  console.error('Sales customer configuration refused or failed');
  process.exitCode = 1;
}
