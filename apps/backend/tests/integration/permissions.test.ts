import assert from 'node:assert/strict';
import test from 'node:test';
import { runTool, withDatabase } from '../support/database-fixture.js';
import { harness, request } from '../support/synthetic-command.js';

void test('runtime may append/read outcomes and audits but cannot mutate history or own DDL', async () => {
  await withDatabase(async (db) => {
    assert.equal((await harness(db).run(request())).status, 'completed');
    const denied = [
      "UPDATE kernel.command_outcome SET family='GUARD_STATE'",
      'DELETE FROM kernel.command_outcome',
      'TRUNCATE kernel.command_outcome',
      "UPDATE kernel.audit_event SET safe_details='{}'",
      'DELETE FROM kernel.audit_event',
      'TRUNCATE kernel.audit_event',
      'CREATE TABLE kernel.not_allowed(id integer)',
      'ALTER TABLE kernel.audit_event ADD COLUMN not_allowed integer',
      'SELECT * FROM kernel.schema_migrations',
    ];
    for (const sql of denied)
      await assert.rejects(
        db.runtime.query(sql),
        (error: unknown) =>
          typeof error === 'object' && error !== null && 'code' in error && error.code === '42501',
      );
    const role = await db.owner.query<{
      rolsuper: boolean;
      rolcreatedb: boolean;
      rolcreaterole: boolean;
    }>('SELECT rolsuper,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname=$1', [
      db.runtimeRole,
    ]);
    assert.deepEqual(role.rows[0], { rolsuper: false, rolcreatedb: false, rolcreaterole: false });
    assert.deepEqual(await db.counts(), { facts: 1, outcomes: 1, audits: 1 });
  });
});

void test('database enforces complete terminal rows, semantic result and composite original audit identity', async () => {
  await withDatabase(async (db) => {
    await harness(db).run(request());
    const violations = [
      ["UPDATE kernel.command_outcome SET result='{}'", '23514'],
      ['UPDATE kernel.command_outcome SET command_version=0', '23514'],
      ["UPDATE kernel.command_outcome SET canonical_bytes=''::bytea", '23514'],
      ["UPDATE kernel.command_outcome SET outcome_kind='PENDING'", '23514'],
      [
        "UPDATE kernel.command_outcome SET idempotency_key='00000000-0000-0000-0000-000000000000'",
        '23514',
      ],
      ["UPDATE kernel.command_outcome SET principal_subject='forged-subject'", '23503'],
      ["UPDATE kernel.command_outcome SET decision_audit_kind='AUD-CMD-REJECTED'", '23514'],
      ["UPDATE kernel.command_outcome SET payload_sha256='not-a-hash'", '23514'],
      ['UPDATE kernel.command_outcome SET result_schema_version=0', '23514'],
      ['UPDATE kernel.command_outcome SET principal_subject=NULL', '23502'],
    ];
    for (const [sql, code] of violations)
      await assert.rejects(
        db.owner.query(sql ?? ''),
        (error: unknown) =>
          typeof error === 'object' && error !== null && 'code' in error && error.code === code,
      );
    assert.equal((await db.counts()).outcomes, 1);
  });
});

void test('reset rejects missing ACK, non-test mode/database and wrong owner before changing tables', async () => {
  await withDatabase(async (db) => {
    await harness(db).run(request());
    const changes = [
      { TEST_DATABASE_ACK: '' },
      { NODE_ENV: 'production' },
      { TEST_DATABASE_ACK: 'unrelated_test' },
      { TEST_DATABASE_URL: process.env.DATABASE_URL },
      { MIGRATION_DATABASE_URL: process.env.TEST_DATABASE_URL },
    ];
    for (const env of changes) {
      await assert.rejects(runTool('tools/db/reset-test.mjs', [], env));
      assert.deepEqual(await db.counts(), { facts: 1, outcomes: 1, audits: 1 });
    }
  });
});
