import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import { type TransactionPort } from '@navard/shared-kernel';
import { withDatabase } from '../support/database-fixture.js';
import { context, harness, request, syntheticHandler } from '../support/synthetic-command.js';

void test('matching parallel contenders have one winner and a fresh post-lock replay', async () => {
  await withDatabase(async (db) => {
    const h = harness(db);
    const input = request();
    const results = await Promise.all(Array.from({ length: 8 }, () => h.run(input)));
    assert.ok(results.every((result) => result.status === 'completed'));
    assert.equal(
      results.filter((result) => result.status === 'completed' && !result.replayed).length,
      1,
    );
    assert.equal(h.executions(), 1);
    assert.deepEqual(await db.counts(), { facts: 1, outcomes: 1, audits: 8 });
  });
});

void test('mismatching parallel contenders conflict with exactly one winner', async () => {
  await withDatabase(async (db) => {
    const h = harness(db);
    const input = request();
    const results = await Promise.all([
      h.run(input),
      h.run(request({ ...input, payload: { material: 'other', reject: false } })),
    ]);
    assert.equal(results.filter((result) => result.status === 'completed').length, 1);
    assert.equal(results.filter((result) => result.status === 'conflict').length, 1);
    assert.equal(h.executions(), 1);
    assert.deepEqual(await db.counts(), { facts: 1, outcomes: 1, audits: 2 });
  });
});

void test('rolled-back predecessor releases key; waiter may evaluate after full abort', async () => {
  await withDatabase(async (db) => {
    let announce: () => void = () => undefined;
    let release: () => void = () => undefined;
    const started = new Promise<void>((resolve) => {
      announce = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const input = request();
    const first = harness(db, {
      handler: async (...args) => {
        await syntheticHandler(...args);
        announce();
        await gate;
        throw new Error('technical abort');
      },
    });
    const attempt = first.run(input);
    await started;
    const waiter = harness(db).run(input);
    let blocked = false;
    for (let n = 0; n < 100; n += 1) {
      const status = await db.runtime.query<{ blocked: boolean }>(
        "SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE usename=current_user AND wait_event_type='Lock' AND query LIKE 'SELECT pg_advisory_xact_lock%') AS blocked",
      );
      if (status.rows[0]?.blocked) {
        blocked = true;
        break;
      }
      await sleep(10);
    }
    release();
    assert.equal(blocked, true);
    assert.equal((await attempt).status, 'technical');
    assert.equal((await waiter).status, 'completed');
    assert.deepEqual(await db.counts(), { facts: 1, outcomes: 1, audits: 1 });
  });
});

void test('forced advisory hash collision serializes distinct full keys without false replay', async () => {
  await withDatabase(async (db) => {
    const collision: TransactionPort = {
      async begin() {
        const session = await db.transactions.begin();
        return { ...session, lock: () => session.lock([17, 19]) };
      },
    };
    const h = harness(db, { ports: { transactions: collision } });
    const results = await Promise.all([h.run(request()), h.run(request())]);
    assert.ok(results.every((result) => result.status === 'completed' && !result.replayed));
    assert.equal(h.executions(), 2);
    assert.deepEqual(await db.counts(), { facts: 2, outcomes: 2, audits: 2 });
  });
});

void test('installation/scope namespace isolates keys; natural fact duplicate policy remains owner-specific', async () => {
  await withDatabase(async (db) => {
    const h = harness(db);
    const input = request();
    const results = await Promise.all([
      h.run(input),
      h.run(
        request({ ...input, target: { ...input.target, id: randomUUID() } }),
        context({ authorityScopeId: randomUUID() }),
      ),
      h.run(
        request({ ...input, target: { ...input.target, id: randomUUID() } }),
        context({ installationId: randomUUID() }),
      ),
    ]);
    assert.ok(
      results.every(
        (result) => result.status === 'completed' && result.result.outcome === 'accepted',
      ),
    );
    const duplicate = await h.run(request({ ...input, idempotency_key: randomUUID() }));
    assert.equal(duplicate.status, 'completed');
    if (duplicate.status === 'completed' && duplicate.result.outcome === 'rejected')
      assert.equal(duplicate.result.family, 'GUARD_IDEMPOTENT_DUP');
    else assert.fail('Expected owner duplicate rejection');
    const productionRule = await h.run(
      request({ ...input, command: 'TEST-ProductionDuplicateRule', idempotency_key: randomUUID() }),
    );
    assert.equal(productionRule.status, 'completed');
    if (productionRule.status === 'completed' && productionRule.result.outcome === 'rejected')
      assert.equal(productionRule.result.family, 'GUARD_CONFLICT');
    else assert.fail('Expected explicit conflicting duplicate rule');
    assert.equal((await db.counts()).facts, 3);
  });
});

void test('revocation while waiting denies at the post-lock authorization point', async () => {
  await withDatabase(async (db) => {
    let announce: () => void = () => undefined;
    let release: () => void = () => undefined;
    const started = new Promise<void>((resolve) => {
      announce = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const input = request();
    const first = harness(db, {
      handler: async (...args) => {
        announce();
        await gate;
        return syntheticHandler(...args);
      },
    });
    const original = first.run(input);
    await started;
    let calls = 0;
    const revoked = harness(db, {
      ports: {
        authorization: {
          canExecute: () => Promise.resolve(++calls === 1),
          canReplay: () => Promise.resolve(false),
        },
      },
    });
    const waiting = revoked.run(input);
    let blocked = false;
    for (let n = 0; n < 100; n += 1) {
      const status = await db.runtime.query<{ blocked: boolean }>(
        "SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE usename=current_user AND wait_event_type='Lock' AND query LIKE 'SELECT pg_advisory_xact_lock%') AS blocked",
      );
      if (status.rows[0]?.blocked) {
        blocked = true;
        break;
      }
      await sleep(10);
    }
    release();
    assert.equal(blocked, true);
    assert.equal((await original).status, 'completed');
    assert.equal((await waiting).status, 'admission-denied');
    assert.equal(calls, 2);
    assert.equal(revoked.executions(), 0);
    assert.equal((await db.counts()).outcomes, 1);
  });
});

void test('different keys racing on a natural fact preserve owner uniqueness and durable duplicate rejection', async () => {
  await withDatabase(async (db) => {
    const h = harness(db);
    const input = request();
    const results = await Promise.all([
      h.run(input),
      h.run(request({ ...input, idempotency_key: randomUUID() })),
    ]);
    assert.equal(
      results.filter(
        (result) => result.status === 'completed' && result.result.outcome === 'accepted',
      ).length,
      1,
    );
    assert.equal(
      results.filter(
        (result) =>
          result.status === 'completed' &&
          result.result.outcome === 'rejected' &&
          result.result.family === 'GUARD_IDEMPOTENT_DUP',
      ).length,
      1,
    );
    assert.deepEqual(await db.counts(), { facts: 1, outcomes: 2, audits: 2 });
  });
});
