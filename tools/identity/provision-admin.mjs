import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import { TextDecoder } from 'node:util';
import { hashPassword } from '../../apps/backend/dist/src/modules/identity/index.js';
import { PostgresIdentityStore } from '../../apps/backend/dist/src/infrastructure/postgresql/identity-store.js';
import { PostgresTransactions } from '../../apps/backend/dist/src/infrastructure/postgresql/transaction.js';
import { validUuid } from '../../packages/shared-kernel/dist/src/index.js';

/** Explicit owner-operated initial provisioning, never part of application startup. */
async function main() {
  const args = process.argv.slice(2);
  if (
    args.length !== 6 ||
    args[0] !== '--installation-ack' ||
    args[2] !== '--person-id' ||
    args[4] !== '--username'
  )
    throw new Error('Invalid provisioning arguments');
  const installation = args[1],
    personId = args[3],
    username = args[5];
  if (
    !validUuid(installation) ||
    installation !== process.env.INSTALLATION_ID ||
    !validUuid(personId) ||
    !/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username)
  )
    throw new Error('Explicit person/installation acknowledgement required');
  if (process.stdin.isTTY)
    throw new Error('Supply password through protected stdin, never a command argument');
  const chunks = [];
  let bytes = 0;
  for await (const chunk of process.stdin) {
    bytes += chunk.length;
    if (bytes > 132) throw new Error('Invalid credential input');
    chunks.push(chunk);
  }
  const password = new TextDecoder('utf-8', { fatal: true })
    .decode(Buffer.concat(chunks))
    .replace(/\r?\n$/u, '');
  if (/[\r\n]/u.test(password)) throw new Error('Single credential required');
  const passwordHash = await hashPassword(password);
  const url = process.env.MIGRATION_DATABASE_URL;
  if (!url) throw new Error('Database owner URL required');
  const pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 5000 });
  pool.on('error', () => undefined);
  try {
    const result = await pool.query(
      "SELECT current_user=pg_get_userbyid(datdba) AS owner, current_setting('server_version_num')::integer=180006 AS compatible,current_setting('server_encoding')='UTF8' AS utf8 FROM pg_database WHERE datname=current_database()",
    );
    if (!result.rows[0]?.owner || !result.rows[0].compatible || !result.rows[0].utf8)
      throw new Error('Actual compatible database owner required');
    const store = new PostgresIdentityStore(pool);
    const session = await new PostgresTransactions(pool).begin();
    try {
      const work = async () => {
        await store.adminLock(session.context, installation);
        if ((await store.countAdmins(session.context, installation, installation)) !== 0)
          throw new Error('Initial administrator already exists');
        const accountId = randomUUID();
        await store.insertAccount(session.context, {
          id: accountId,
          installationId: installation,
          personId,
          username,
          passwordHash,
          enabled: true,
        });
        const grant = { actorRole: 'ACT-SEC', authorityScopeId: installation, customerScope: '' };
        await store.setGrant(session.context, installation, accountId, grant, true);
        await store.audit(session.context, installation, 'ACCOUNT_CREATED', personId, personId);
        await store.audit(session.context, installation, 'GRANT_CHANGED', personId, personId, {
          ...grant,
          enabled: true,
        });
        await session.commit();
        await session.release();
      };
      const pending = work();
      await (session.aborted === undefined ? pending : Promise.race([pending, session.aborted]));
    } catch (error) {
      await session.rollback().catch(() => undefined);
      await session.release(true).catch(() => undefined);
      throw error;
    }
    console.log('Explicit initial personal security administrator provisioned');
  } finally {
    await pool.end();
  }
}
try {
  await main();
} catch {
  console.error('Initial administrator provisioning refused or failed');
  process.exitCode = 1;
}
