import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { validateMigrationSql } from '../db/sql-guard.mjs';
import { loadMigrations, applyMigrations } from '../db/migrate.mjs';
void test('migration lexical guard distinguishes real function bodies, strings, comments and transaction control', () => {
  for (const sql of [
    'CREATE FUNCTION f() RETURNS void LANGUAGE plpgsql AS $$ BEGIN NULL; END; $$;',
    "CREATE FUNCTION f() RETURNS void LANGUAGE plpgsql AS $body$ BEGIN RAISE NOTICE 'it''s COMMIT'; END; $body$;",
    "SELECT 'COMMIT', 'a''BEGIN', '\\$v=1\\$'; -- ROLLBACK\n /* COMMIT /* BEGIN */ END */ SELECT 1;",
    'SELECT "COMMIT", "doubled""BEGIN";',
    "SELECT E'escaped\\' COMMIT';",
  ])
    assert.doesNotThrow(() => validateMigrationSql(sql), sql);
  for (const sql of [
    "SELECT '$x$'; COMMIT; SELECT '$x$';",
    "SELECT '--'; COMMIT;",
    "SELECT E'escaped\\''; COMMIT;",
    "SELECT 'unterminated",
    'SELECT "unterminated',
    'SELECT $tag$unterminated',
    '/* outer /* inner */',
    "SELECT '\\'; COMMIT;", // ambiguous ordinary-string backslash must never conceal a boundary
    ...[
      'BEGIN',
      'COMMIT',
      'ROLLBACK',
      'END',
      'ABORT',
      'START TRANSACTION',
      'PREPARE TRANSACTION',
      'VACUUM',
      'CREATE INDEX CONCURRENTLY',
      '-- comment\rCOMMIT',
    ].map((command) => `DO $$ BEGIN NULL; END; $$; ${command};`),
  ])
    assert.throws(() => validateMigrationSql(sql), /Invalid migration content/, sql);
});
void test('unsafe migration rejection happens before ANY client query or partial file application', async () => {
  const entries = await loadMigrations();
  for (const sql of [
    "SELECT '$x$'; COMMIT; SELECT '$x$';",
    "SELECT '--'; COMMIT;",
    'BEGIN;',
    'END;',
    'ABORT;',
    'START TRANSACTION;',
    "PREPARE TRANSACTION 'synthetic';",
    'SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;',
    '-- comment\rCOMMIT;',
    '/* incomplete',
  ]) {
    let queries = 0;
    const modified = entries.map((entry, index) =>
      index === entries.length - 1
        ? { ...entry, sql, sha256: createHash('sha256').update(sql, 'utf8').digest('hex') }
        : entry,
    );
    await assert.rejects(
      applyMigrations(
        {
          query: () => {
            queries++;
            throw new Error('Unexpected query');
          },
        },
        modified,
      ),
      /Invalid migration content/,
    );
    assert.equal(queries, 0);
  }
});
