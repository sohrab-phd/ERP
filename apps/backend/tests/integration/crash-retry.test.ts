import assert from 'node:assert/strict';
import { fork } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { createServer } from 'node:net';
import { PostgresTransactions } from '../../src/infrastructure/postgresql/transaction.js';
import { withDatabase } from '../support/database-fixture.js';
import { harness, request } from '../support/synthetic-command.js';
import { lostCommitProxy } from '../support/crash-child.js';

void test('real process crashes across all precommit windows leave no partial durable facts', async () => {
  for (const stage of [
    'before-handler',
    'after-facts',
    'before-audit',
    'before-outcome',
    'before-commit',
    'after-commit',
  ]) {
    await withDatabase(async (db) => {
      const input = request();
      const child = fork(
        fileURLToPath(new URL('../support/crash-child.js', import.meta.url)),
        ['--crash-child', stage, Buffer.from(JSON.stringify(input)).toString('base64')],
        { stdio: ['ignore', 'pipe', 'pipe', 'ipc'] },
      );
      const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()));
      try {
        const reached = await new Promise<unknown>((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error(`Crash child did not reach ${stage}`)),
            8_000,
          );
          child.once('message', (message) => {
            clearTimeout(timer);
            resolve(message);
          });
          child.once('error', (error) => {
            clearTimeout(timer);
            reject(error);
          });
        });
        assert.deepEqual(reached, { stage });
      } finally {
        child.kill('SIGKILL');
        await exited;
      }
      assert.deepEqual(
        await db.counts(),
        stage === 'after-commit'
          ? { facts: 1, outcomes: 1, audits: 1 }
          : { facts: 0, outcomes: 0, audits: 0 },
      );
      const retried = await harness(db).run(input);
      assert.equal(retried.status, 'completed');
      if (retried.status === 'completed') assert.equal(retried.replayed, stage === 'after-commit');
      assert.equal((await db.counts()).facts, 1);
      assert.equal((await db.counts()).outcomes, 1);
    });
  }
});

void test('actual lost COMMIT acknowledgment reports uncertainty and same-key primary retry recovers winner', async () => {
  await withDatabase(async (db) => {
    const proxy = await lostCommitProxy(process.env.TEST_DATABASE_URL ?? '');
    const pool = new Pool({ connectionString: proxy.url });
    pool.on('error', () => undefined);
    try {
      const input = request();
      const unconfirmed = await harness(db, {
        ports: { transactions: new PostgresTransactions(pool) },
      }).run(input);
      assert.equal(unconfirmed.status, 'technical');
      if (unconfirmed.status === 'technical') assert.equal(unconfirmed.kind, 'uncertain');
      assert.equal(proxy.commitConfirmed(), true);
      assert.deepEqual(await db.counts(), { facts: 1, outcomes: 1, audits: 1 });
      const resolved = await harness(db).run(input);
      assert.equal(resolved.status, 'completed');
      if (resolved.status === 'completed') assert.equal(resolved.replayed, true);
      assert.deepEqual(await db.counts(), { facts: 1, outcomes: 1, audits: 2 });
      const replayWithLostAck = harness(db, {
        ports: { transactions: new PostgresTransactions(pool) },
      });
      const replayUncertain = await replayWithLostAck.run(input);
      assert.equal(replayUncertain.status, 'technical');
      if (replayUncertain.status === 'technical') assert.equal(replayUncertain.kind, 'uncertain');
      assert.equal(replayWithLostAck.executions(), 0);
      assert.deepEqual(await db.counts(), { facts: 1, outcomes: 1, audits: 3 });
      const replayResolved = await harness(db).run(input);
      assert.equal(replayResolved.status, 'completed');
      if (replayResolved.status === 'completed') assert.equal(replayResolved.replayed, true);
      assert.deepEqual(await db.counts(), { facts: 1, outcomes: 1, audits: 4 });
    } finally {
      await pool.end();
      await proxy.close();
    }
  });
});

void test('unavailable primary connection does not infer absence or repeat a durable intent', async () => {
  await withDatabase(async (db) => {
    const input = request();
    assert.equal((await harness(db).run(input)).status, 'completed');
    const endpoint = createServer((socket) => socket.destroy());
    await new Promise<void>((resolve, reject) => {
      endpoint.once('error', reject);
      endpoint.listen(0, '127.0.0.1', resolve);
    });
    const address = endpoint.address();
    assert.ok(address && typeof address !== 'string');
    const unreachable = new URL(process.env.TEST_DATABASE_URL ?? '');
    unreachable.hostname = '127.0.0.1';
    unreachable.port = String(address.port);
    const pool = new Pool({
      connectionString: unreachable.toString(),
      connectionTimeoutMillis: 100,
    });
    pool.on('error', () => undefined);
    try {
      const h = harness(db, { ports: { transactions: new PostgresTransactions(pool) } });
      assert.equal((await h.run(input)).status, 'technical');
      assert.equal(h.executions(), 0);
      assert.deepEqual(await db.counts(), { facts: 1, outcomes: 1, audits: 1 });
      const retry = await harness(db).run(input);
      assert.equal(retry.status, 'completed');
      if (retry.status === 'completed') assert.equal(retry.replayed, true);
      assert.deepEqual(await db.counts(), { facts: 1, outcomes: 1, audits: 2 });
    } finally {
      await pool.end();
      await new Promise<void>((resolve, reject) =>
        endpoint.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
