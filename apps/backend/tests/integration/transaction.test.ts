import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';
import {
  CommandRegistry,
  executeCommand,
  type CommandContract,
  type TransactionContext,
} from '@navard/shared-kernel';
import {
  PostgresTransactions,
  transactionClient,
} from '../../src/infrastructure/postgresql/transaction.js';
import { withDatabase } from '../support/database-fixture.js';
import { context, harness, request } from '../support/synthetic-command.js';

void test('one opaque context owns READ COMMITTED client and savepoint rejection removes tentative effects', async () => {
  await withDatabase(async (db) => {
    const session = await db.transactions.begin();
    const client = transactionClient(session.context);
    assert.equal(
      (await client.query<{ transaction_isolation: string }>('SHOW transaction_isolation')).rows[0]
        ?.transaction_isolation,
      'read committed',
    );
    assert.equal(
      (await client.query<{ transaction_read_only: string }>('SHOW transaction_read_only')).rows[0]
        ?.transaction_read_only,
      'off',
    );
    await session.savepoint();
    await client.query("INSERT INTO envelope_test.fact VALUES('tentative','safe')");
    await session.rollbackToSavepoint();
    await session.commit();
    assert.throws(() => transactionClient(session.context));
    await session.release();
    assert.equal((await db.counts()).facts, 0);
    const rejected = await harness(db).run(
      request({ payload: { material: 'safe', reject: true } }),
    );
    assert.equal(rejected.status, 'completed');
    assert.deepEqual(await db.counts(), { facts: 0, outcomes: 1, audits: 1 });
  });
});

void test('read snapshot uses REPEATABLE READ and server-enforced READ ONLY on one opaque client', async () => {
  await withDatabase(async (db) => {
    const session = await db.transactions.begin('read-snapshot');
    const client = transactionClient(session.context);
    try {
      assert.equal(
        (await client.query<{ transaction_isolation: string }>('SHOW transaction_isolation'))
          .rows[0]?.transaction_isolation,
        'repeatable read',
      );
      assert.equal(
        (await client.query<{ transaction_read_only: string }>('SHOW transaction_read_only'))
          .rows[0]?.transaction_read_only,
        'on',
      );
      assert.equal((await client.query('SELECT * FROM envelope_test.fact')).rowCount, 0);
      await db.owner.query("INSERT INTO envelope_test.fact VALUES('after-snapshot','safe')");
      assert.equal((await client.query('SELECT * FROM envelope_test.fact')).rowCount, 0);
      await assert.rejects(
        client.query("INSERT INTO envelope_test.fact VALUES('read-only-write','safe')"),
        (error: unknown) =>
          typeof error === 'object' && error !== null && 'code' in error && error.code === '25006',
      );
    } finally {
      await session.rollback();
      await session.release();
    }
    assert.throws(() => transactionClient(session.context));
    assert.equal((await db.counts()).facts, 1);
    const next = await db.transactions.begin();
    try {
      assert.equal(
        (
          await transactionClient(next.context).query<{ transaction_read_only: string }>(
            'SHOW transaction_read_only',
          )
        ).rows[0]?.transaction_read_only,
        'off',
      );
      await next.commit();
    } finally {
      await next.rollback();
      await next.release();
    }
  });
});

void test('statement, lock and application timeouts abort the whole transaction without cached technical outcomes', async () => {
  await withDatabase(async (db) => {
    const bounded = new PostgresTransactions(db.runtime, {
      statementTimeoutMs: 30,
      lockTimeoutMs: 30,
      deadlineMs: 500,
    });
    const sleepy = harness(db, {
      ports: { transactions: bounded },
      handler: async (_input, _caller, tx) => {
        await transactionClient(tx).query(
          "INSERT INTO envelope_test.fact VALUES('before-timeout','safe')",
        );
        await transactionClient(tx).query('SELECT pg_sleep(1)');
        return { outcome: 'accepted' };
      },
    });
    assert.equal((await sleepy.run(request())).status, 'technical');
    assert.deepEqual(await db.counts(), { facts: 0, outcomes: 0, audits: 0 });
    const holder = await db.transactions.begin();
    await holder.lock([101, 103]);
    const contender = await new PostgresTransactions(db.runtime, {
      lockTimeoutMs: 30,
      statementTimeoutMs: 500,
      deadlineMs: 1000,
    }).begin();
    try {
      await assert.rejects(
        contender.lock([101, 103]),
        (error: unknown) =>
          typeof error === 'object' && error !== null && 'code' in error && error.code === '55P03',
      );
    } finally {
      await contender.rollback();
      await contender.release();
      await holder.rollback();
      await holder.release();
    }
    const deadline = new PostgresTransactions(db.runtime, { deadlineMs: 20 });
    const late = harness(db, {
      ports: { transactions: deadline },
      handler: async (_input, _caller, tx) => {
        await transactionClient(tx).query(
          "INSERT INTO envelope_test.fact VALUES('before-deadline','safe')",
        );
        await sleep(50);
        return { outcome: 'accepted' };
      },
    });
    assert.equal((await late.run(request())).status, 'technical');
    assert.deepEqual(await db.counts(), { facts: 0, outcomes: 0, audits: 0 });
  });
});

void test('real PostgreSQL deadlock and serialization SQLSTATE are whole-abort technical failures', async () => {
  await withDatabase(async (db) => {
    const left = await db.transactions.begin(),
      right = await db.transactions.begin();
    await transactionClient(left.context).query(
      "INSERT INTO envelope_test.fact VALUES('left','safe')",
    );
    await transactionClient(right.context).query(
      "INSERT INTO envelope_test.fact VALUES('right','safe')",
    );
    await left.lock([211, 1]);
    await right.lock([211, 2]);
    const blocked = left.lock([211, 2]);
    const other = right.lock([211, 1]);
    const rejected = await Promise.race([
      blocked.then(
        () => null,
        (error: unknown) => ({ error, session: left }),
      ),
      other.then(
        () => null,
        (error: unknown) => ({ error, session: right }),
      ),
    ]);
    assert.ok(rejected);
    assert.equal((rejected.error as { code: string }).code, '40P01');
    await rejected.session.rollback();
    await Promise.allSettled([blocked, other]);
    await left.rollback();
    await right.rollback();
    await left.release();
    await right.release();
    assert.equal((await db.counts()).facts, 0);
    for (const code of ['40001', '40P01', 'XX000']) {
      const h = harness(db, {
        handler: async (_input, _caller, tx) => {
          await transactionClient(tx).query(
            "INSERT INTO envelope_test.fact VALUES('before-error','safe')",
          );
          await transactionClient(tx).query(
            `DO $$ BEGIN RAISE EXCEPTION USING ERRCODE = '${code}', MESSAGE = 'fixture'; END $$`,
          );
          return { outcome: 'accepted' };
        },
      });
      assert.equal((await h.run(request())).status, 'technical');
      assert.deepEqual(await db.counts(), { facts: 0, outcomes: 0, audits: 0 });
    }
  });
});

void test('server-confirmed COMMIT serialization abort is retryable with no durable partial outcome', async () => {
  await withDatabase(async (db) => {
    await db.owner.query(`
      CREATE FUNCTION envelope_test.reject_commit() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION USING ERRCODE='40001', MESSAGE='fixture commit abort'; END $$;
      CREATE CONSTRAINT TRIGGER fixture_commit_abort AFTER INSERT ON envelope_test.fact
      DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION envelope_test.reject_commit();
    `);
    try {
      const result = await harness(db).run(request());
      assert.equal(result.status, 'technical');
      if (result.status === 'technical') assert.equal(result.kind, 'retryable');
      assert.deepEqual(await db.counts(), { facts: 0, outcomes: 0, audits: 0 });
    } finally {
      await db.owner.query(
        'DROP TRIGGER fixture_commit_abort ON envelope_test.fact; DROP FUNCTION envelope_test.reject_commit()',
      );
    }
  });
});

void test('connection loss while checked out invalidates context without an unhandled socket failure', async () => {
  await withDatabase(async (db) => {
    const session = await db.transactions.begin();
    const client = transactionClient(session.context);
    await client.query("INSERT INTO envelope_test.fact VALUES('connection-cut','safe')");
    const pid = (await client.query<{ pid: number }>('SELECT pg_backend_pid() AS pid')).rows[0]
      ?.pid;
    assert.ok(pid);
    await db.runtime.query('SELECT pg_terminate_backend($1)', [pid]);
    await sleep(100);
    assert.throws(() => transactionClient(session.context));
    await session.rollback();
    await session.release();
    assert.deepEqual(await db.counts(), { facts: 0, outcomes: 0, audits: 0 });
  });
});

void test('named constraint mapper cannot commit its own tentative writes with a rejection', async () => {
  await withDatabase(async (db) => {
    const input = request();
    const h = harness(db);
    assert.equal((await h.run(input)).status, 'completed');
    const contract: CommandContract = {
      command: 'TEST-MapDuplicate',
      version: 1,
      active: true,
      payloadShape: { material: { type: 'scalar' }, reject: { type: 'scalar' } },
      preconditionsShape: { expected: { type: 'scalar' } },
      async execute(req, _caller, tx) {
        await transactionClient(tx).query(
          'INSERT INTO envelope_test.fact(identity,material) VALUES($1,$2)',
          [req.target.id, req.payload.material],
        );
        return { outcome: 'accepted' };
      },
      constraintRejections: {
        async fact_pkey(req, _caller, tx) {
          const fact = await transactionClient(tx).query<{ material: string }>(
            'SELECT material FROM envelope_test.fact WHERE identity=$1',
            [req.target.id],
          );
          assert.equal(fact.rows[0]?.material, req.payload.material);
          await transactionClient(tx).query(
            "INSERT INTO envelope_test.fact VALUES('mapper-tentative-effect','safe')",
          );
          return { family: 'GUARD_IDEMPOTENT_DUP', message: 'Verified fixture duplicate' };
        },
      },
    };
    const attempted = request({
      ...input,
      command: 'TEST-MapDuplicate',
      idempotency_key: request().idempotency_key,
    });
    const result = await executeCommand(JSON.stringify(attempted), context(), {
      ...h.ports,
      registry: new CommandRegistry([contract]),
    });
    assert.equal(result.status, 'completed');
    if (result.status === 'completed' && result.result.outcome === 'rejected')
      assert.equal(result.result.family, 'GUARD_IDEMPOTENT_DUP');
    else assert.fail('Expected mapped durable rejection');
    assert.deepEqual(await db.counts(), { facts: 1, outcomes: 2, audits: 2 });
  });
});

void test('never-resolving handler returns bounded technical failure after capability invalidation', async () => {
  await withDatabase(async (db) => {
    const bounded = new PostgresTransactions(db.runtime, { deadlineMs: 50 });
    let captured: TransactionContext | undefined;
    const h = harness(db, {
      ports: { transactions: bounded },
      handler: async (_input, _caller, tx) => {
        captured = tx;
        await transactionClient(tx).query(
          "INSERT INTO envelope_test.fact VALUES('deadline-aborted','safe')",
        );
        return new Promise(() => undefined);
      },
    });
    const started = Date.now();
    const result = await h.run(request());
    assert.equal(result.status, 'technical');
    if (result.status === 'technical') assert.equal(result.kind, 'retryable');
    assert.ok(Date.now() - started < 2000);
    assert.ok(captured);
    const expiredContext = captured;
    assert.throws(() => transactionClient(expiredContext));
    assert.deepEqual(await db.counts(), { facts: 0, outcomes: 0, audits: 0 });
  });
});
