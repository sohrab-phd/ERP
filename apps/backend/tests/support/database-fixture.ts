import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { Pool } from 'pg';
import { PostgresTransactions } from '../../src/infrastructure/postgresql/transaction.js';
import { PostgresOutcomes } from '../../src/infrastructure/postgresql/outcome-store.js';
import { PostgresAudit } from '../../src/infrastructure/postgresql/audit-store.js';

export const repositoryRoot = fileURLToPath(new URL('../../../../../', import.meta.url));
const exec = promisify(execFile);

export async function runTool(tool: string, args: string[] = [], extraEnv: NodeJS.ProcessEnv = {}) {
  return exec(process.execPath, [tool, ...args], {
    cwd: repositoryRoot,
    env: { ...process.env, ...extraEnv },
    maxBuffer: 1024 * 1024,
  });
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Integration requires ${name}`);
  return value;
}

export interface DatabaseFixture {
  runtime: Pool;
  owner: Pool;
  transactions: PostgresTransactions;
  outcomes: PostgresOutcomes;
  audit: PostgresAudit;
  runtimeRole: string;
  counts(): Promise<{ facts: number; outcomes: number; audits: number }>;
}

export async function withDatabase<T>(body: (fixture: DatabaseFixture) => Promise<T>): Promise<T> {
  assert.equal(process.env.NODE_ENV, 'test');
  const runtimeUrl = new URL(required('TEST_DATABASE_URL'));
  const ownerUrl = new URL(required('MIGRATION_DATABASE_URL'));
  assert.equal(runtimeUrl.host, ownerUrl.host);
  const runtime = new Pool({ connectionString: required('TEST_DATABASE_URL'), max: 10 });
  const owner = new Pool({ connectionString: required('MIGRATION_DATABASE_URL'), max: 5 });
  runtime.on('error', () => undefined);
  owner.on('error', () => undefined);
  try {
    interface Identity {
      db: string;
      role: string;
      session: string;
      version: string;
      encoding: string;
      rolsuper: boolean;
      rolcreatedb: boolean;
      rolcreaterole: boolean;
    }
    const identitySql =
      "SELECT current_database() AS db,current_user AS role,session_user AS session,current_setting('server_version_num') AS version,current_setting('server_encoding') AS encoding,rolsuper,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname=current_user";
    const identities = await Promise.all([
      runtime.query<Identity>(identitySql),
      owner.query<Identity>(identitySql),
    ]);
    const runtimeIdentity = identities[0].rows[0];
    const ownerIdentity = identities[1].rows[0];
    assert.ok(runtimeIdentity && ownerIdentity);
    assert.match(runtimeIdentity.db, /_test$/);
    assert.equal(runtimeIdentity.db, required('TEST_DATABASE_ACK'));
    assert.equal(runtimeIdentity.db, ownerIdentity.db);
    assert.notEqual(runtimeIdentity.role, ownerIdentity.role);
    assert.equal(runtimeIdentity.role, decodeURIComponent(runtimeUrl.username));
    assert.equal(ownerIdentity.role, decodeURIComponent(ownerUrl.username));
    for (const identity of [runtimeIdentity, ownerIdentity]) {
      assert.equal(identity.role, identity.session);
      assert.equal(Number(identity.version), 180006);
      assert.equal(identity.encoding, 'UTF8');
      assert.equal(identity.rolsuper || identity.rolcreatedb || identity.rolcreaterole, false);
    }
    const actualOwner = await owner.query<{ owner: string }>(
      'SELECT pg_get_userbyid(datdba) AS owner FROM pg_database WHERE datname=current_database()',
    );
    assert.equal(actualOwner.rows[0]?.owner, ownerIdentity.role);
    assert.notEqual(new URL(required('DATABASE_URL')).pathname.slice(1), runtimeIdentity.db);
    await runTool('tools/db/migrate.mjs');
    const quotedRole = `"${runtimeIdentity.role.replaceAll('"', '""')}"`;
    await owner.query(`GRANT USAGE ON SCHEMA kernel TO ${quotedRole}`);
    await owner.query(
      `GRANT SELECT, INSERT ON kernel.audit_event, kernel.command_outcome TO ${quotedRole}`,
    );
    await owner.query('CREATE SCHEMA IF NOT EXISTS envelope_test');
    await owner.query(
      'CREATE TABLE IF NOT EXISTS envelope_test.fact (identity text PRIMARY KEY, material text NOT NULL)',
    );
    await owner.query(`GRANT USAGE ON SCHEMA envelope_test TO ${quotedRole}`);
    await owner.query(`GRANT SELECT, INSERT ON envelope_test.fact TO ${quotedRole}`);
    await owner.query('TRUNCATE kernel.command_outcome, kernel.audit_event, envelope_test.fact');
    const fixture: DatabaseFixture = {
      runtime,
      owner,
      runtimeRole: runtimeIdentity.role,
      transactions: new PostgresTransactions(runtime),
      outcomes: new PostgresOutcomes(),
      audit: new PostgresAudit(),
      async counts() {
        const result = await owner.query(
          'SELECT (SELECT count(*)::integer FROM envelope_test.fact) AS facts, (SELECT count(*)::integer FROM kernel.command_outcome) AS outcomes, (SELECT count(*)::integer FROM kernel.audit_event) AS audits',
        );
        return result.rows[0] as { facts: number; outcomes: number; audits: number };
      },
    };
    return await body(fixture);
  } finally {
    await Promise.all([runtime.end(), owner.end()]);
  }
}
