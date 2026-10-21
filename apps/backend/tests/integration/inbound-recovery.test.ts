import assert from 'node:assert/strict';
import test from 'node:test';
import { fork } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import type { PoolClient } from 'pg';
import type { CommandRequest, TransactionPort } from '@navard/shared-kernel';
import { PostgresInboundStore } from '../../src/infrastructure/postgresql/inbound-store.js';
import {
  PostgresTransactions,
  transactionClient,
} from '../../src/infrastructure/postgresql/transaction.js';
import type { InboundContext, InboundStore } from '../../src/modules/procurement/index.js';
import { withDatabase, type DatabaseFixture } from '../support/database-fixture.js';
import {
  inboundPeople,
  inboundHarness,
  inboundCounts,
  optionCommand,
  orderCommand,
  completed,
} from '../support/inbound-harness.js';

async function prepare(db: DatabaseFixture, kind: 'order' | 'option') {
  const people = await inboundPeople(db),
    actor = await people.proc.actor();
  const h = inboundHarness(db, people.identity),
    material = optionCommand();
  if (kind === 'order') completed(await h.run(material, actor), 'accepted');
  const input =
    kind === 'order'
      ? orderCommand(material.target.id)
      : optionCommand('COLOR', 'recovery-' + randomUUID());
  return { people, actor, h, input };
}
function wrapper(store: PostgresInboundStore, changes: Partial<InboundStore>): InboundStore {
  return {
    lock: changes.lock?.bind(store) ?? store.lock.bind(store),
    order: changes.order?.bind(store) ?? store.order.bind(store),
    orderByReference: changes.orderByReference?.bind(store) ?? store.orderByReference.bind(store),
    options: changes.options?.bind(store) ?? store.options.bind(store),
    listOptions: changes.listOptions?.bind(store) ?? store.listOptions.bind(store),
    insertOption: changes.insertOption?.bind(store) ?? store.insertOption.bind(store),
    insertOrder: changes.insertOrder?.bind(store) ?? store.insertOrder.bind(store),
  };
}
async function waitFor(check: () => Promise<boolean>, message: string, deadlineMs = 8000) {
  const deadline = Date.now() + deadlineMs;
  while (Date.now() < deadline) {
    if (await check()) return;
    await delay(20);
  }
  assert.fail(message);
}
async function advisoryWait(db: DatabaseFixture, pid: number) {
  await waitFor(
    async () =>
      (
        await db.owner.query<{ waiting: boolean }>(
          "SELECT EXISTS(SELECT 1 FROM pg_locks WHERE pid=$1 AND locktype='advisory' AND NOT granted) AS waiting",
          [pid],
        )
      ).rows[0]!.waiting,
    'Did not observe actual PostgreSQL advisory wait',
  );
}
async function ownerBlocker(client: PoolClient, ctx: InboundContext, resources: readonly string[]) {
  const keys = await client.query<{ key: string }>(
    'SELECT DISTINCT hashtextextended(value,0) AS key FROM unnest($1::text[]) AS input(value) ORDER BY key',
    [[...resources]],
  );
  for (const { key } of keys.rows)
    await client.query('SELECT pg_advisory_xact_lock($1::bigint)', [key]);
  return (
    await transactionClient(ctx.transaction).query<{ pid: number }>(
      'SELECT pg_backend_pid() AS pid',
    )
  ).rows[0]!.pid;
}

for (const kind of ['order', 'option'] as const) {
  for (const replay of [false, true])
    void test(`I1 ${kind}: committed session revocation during real envelope-key wait denies ${replay ? 'saved outcome disclosure' : 'new execution'}`, async () => {
      await withDatabase(async (db) => {
        const { people, actor, h, input } = await prepare(db, kind);
        if (replay) completed(await h.run(input, actor), 'accepted');
        const before = await inboundCounts(db),
          blocker = await db.owner.connect();
        let announce!: (pid: number) => void;
        const reached = new Promise<number>((resolve) => {
          announce = resolve;
        });
        await blocker.query('BEGIN');
        const transactions: TransactionPort = {
          async begin() {
            const session = await db.transactions.begin();
            return {
              ...session,
              async lock(words) {
                await blocker.query('SELECT pg_advisory_xact_lock($1::integer,$2::integer)', [
                  ...words,
                ]);
                announce(
                  (
                    await transactionClient(session.context).query<{ pid: number }>(
                      'SELECT pg_backend_pid() AS pid',
                    )
                  ).rows[0]!.pid,
                );
                await session.lock(words);
              },
            };
          },
        };
        const running = inboundHarness(db, people.identity, { ports: { transactions } }).run(
          input,
          actor,
        );
        void running.catch(() => undefined);
        try {
          const pid = await Promise.race([
            reached,
            delay(8000).then(() => {
              throw new Error('No kernel-key checkpoint');
            }),
          ]);
          await advisoryWait(db, pid);
          await people.identity.logout(people.proc.token);
        } finally {
          await blocker.query('ROLLBACK');
          blocker.release();
        }
        assert.equal((await running).status, 'admission-denied');
        const after = await inboundCounts(db);
        assert.equal(after.orders, before.orders);
        assert.equal(after.lines, before.lines);
        assert.equal(after.options, before.options);
        assert.equal(after.outcomes, before.outcomes);
        assert.equal(after.foreign, before.foreign);
        assert.equal(after.audits, before.audits + 1);
      });
    });

  void test(`I1 ${kind}: session expiry while waiting on actual owner lock is rechecked before writes`, async () => {
    await withDatabase(async (db) => {
      const { people, actor, input } = await prepare(db, kind),
        blocker = await db.owner.connect();
      const before = await inboundCounts(db);
      await db.owner.query(
        "UPDATE identity.session SET expires_at=clock_timestamp()+interval '1500 milliseconds' WHERE installation_id=$1 AND account_id=$2",
        [people.factory, people.proc.id],
      );
      await blocker.query('BEGIN');
      let announce!: (pid: number) => void;
      const reached = new Promise<number>((resolve) => {
        announce = resolve;
      });
      const store = new PostgresInboundStore();
      const running = inboundHarness(db, people.identity, {
        store: wrapper(store, {
          async lock(ctx, resources) {
            announce(await ownerBlocker(blocker, ctx, resources));
            await store.lock(ctx, resources);
          },
        }),
      }).run(input, actor);
      void running.catch(() => undefined);
      try {
        const pid = await Promise.race([
          reached,
          delay(8000).then(() => {
            throw new Error('No owner checkpoint');
          }),
        ]);
        await advisoryWait(db, pid);
        await waitFor(
          async () =>
            (
              await db.owner.query<{ expired: boolean }>(
                'SELECT bool_and(expires_at<=clock_timestamp()) AS expired FROM identity.session WHERE installation_id=$1 AND account_id=$2',
                [people.factory, people.proc.id],
              )
            ).rows[0]!.expired,
          'Database clock did not reach session expiry',
        );
      } finally {
        await blocker.query('ROLLBACK');
        blocker.release();
      }
      completed(await running, 'rejected', 'GUARD_ACTOR');
      const after = await inboundCounts(db);
      assert.equal(after.orders, before.orders);
      assert.equal(after.lines, before.lines);
      assert.equal(after.options, before.options);
      assert.equal(after.outcomes, before.outcomes + 1);
      assert.equal(after.foreign, before.foreign);
    });
  });

  void test(`I1 ${kind}: owner-lock timeout is technical without a durable false rejection and original input retries`, async () => {
    await withDatabase(async (db) => {
      const { people, actor, h, input } = await prepare(db, kind),
        before = await inboundCounts(db),
        blocker = await db.owner.connect();
      await blocker.query('BEGIN');
      const store = new PostgresInboundStore();
      const running = inboundHarness(db, people.identity, {
        store: wrapper(store, {
          async lock(ctx, resources) {
            await ownerBlocker(blocker, ctx, resources);
            await store.lock(ctx, resources);
          },
        }),
        ports: {
          transactions: new PostgresTransactions(db.runtime, {
            lockTimeoutMs: 100,
            statementTimeoutMs: 1000,
            deadlineMs: 2000,
          }),
        },
      }).run(input, actor);
      try {
        const result = await running;
        assert.equal(result.status, 'technical');
        if (result.status === 'technical') assert.equal(result.kind, 'retryable');
      } finally {
        await blocker.query('ROLLBACK');
        blocker.release();
      }
      assert.deepEqual(await inboundCounts(db), before);
      completed(await h.run(input, actor), 'accepted');
    });
  });

  void test(`I1 ${kind}: actual Windows child crashes around owner, audit, outcome and COMMIT preserve all-or-none and original-key recovery`, async () => {
    await withDatabase(async (db) => {
      const { people, actor, h, input } = await prepare(db, kind);
      for (const stage of [
        'after-handler',
        'before-audit',
        'before-outcome',
        'before-commit',
        'after-commit',
      ]) {
        const command: CommandRequest = {
          ...input,
          idempotency_key: randomUUID(),
          target: { ...input.target, id: randomUUID() },
          payload: {
            ...input.payload,
            ...(kind === 'order'
              ? { orderReference: 'CRASH-' + randomUUID() }
              : { label: 'CRASH-' + randomUUID() }),
          },
        };
        const before = await inboundCounts(db);
        const child = fork(
          fileURLToPath(new URL('../support/inbound-crash.js', import.meta.url)),
          ['--inbound-crash', stage, Buffer.from(JSON.stringify(command)).toString('base64')],
          { stdio: ['ignore', 'pipe', 'pipe', 'ipc'] },
        );
        child.stdout?.resume();
        child.stderr?.resume();
        const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()));
        try {
          const reached = new Promise<unknown>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('I1 child checkpoint timeout')), 10000);
            child.once('message', (message) => {
              clearTimeout(timer);
              resolve(message);
            });
            child.once('error', (error) => {
              clearTimeout(timer);
              reject(error);
            });
          });
          child.send({ token: people.proc.token, factory: people.factory });
          assert.deepEqual(await reached, { stage });
        } finally {
          child.kill('SIGKILL');
          await exited;
        }
        const committed = stage === 'after-commit',
          after = await inboundCounts(db);
        assert.equal(after.orders, before.orders + (kind === 'order' && committed ? 1 : 0));
        assert.equal(after.lines, before.lines + (kind === 'order' && committed ? 1 : 0));
        assert.equal(after.options, before.options + (kind === 'option' && committed ? 1 : 0));
        assert.equal(after.outcomes, before.outcomes + (committed ? 1 : 0));
        assert.equal(after.audits, before.audits + (committed ? 1 : 0));
        assert.equal(after.foreign, before.foreign);
        const recovered = completed(await h.run(command, actor), 'accepted');
        assert.equal(recovered.replayed, committed);
        const final = await inboundCounts(db);
        assert.equal(final.outcomes, before.outcomes + 1);
        assert.equal(final.orders, before.orders + (kind === 'order' ? 1 : 0));
        assert.equal(final.options, before.options + (kind === 'option' ? 1 : 0));
        assert.equal(final.foreign, before.foreign);
      }
    });
  });
}

void test('I1 named immediate unique violations are mapped only after savepoint rollback and surviving scoped winner verification', async () => {
  await withDatabase(async (db) => {
    const { people, actor, h, input } = await prepare(db, 'order');
    completed(await h.run(input, actor), 'accepted');
    const store = new PostgresInboundStore();
    let lookups = 0;
    const bypass = wrapper(store, {
      async orderByReference(...args) {
        if (++lookups === 1) return undefined;
        return store.orderByReference(...args);
      },
    });
    const other = {
      ...input,
      idempotency_key: randomUUID(),
      target: { ...input.target, id: randomUUID() },
    };
    completed(
      await inboundHarness(db, people.identity, { store: bypass }).run(other, actor),
      'rejected',
      'GUARD_CONFLICT',
    );
    assert.equal(lookups, 2, 'precheck bypass and post-rollback authoritative winner query');
    const original = optionCommand('COLOR', 'exact-duplicate');
    completed(await h.run(original, actor), 'accepted');
    let selections = 0;
    const bypassLabel = wrapper(store, {
      async listOptions(...args) {
        if (++selections === 1) return [];
        return store.listOptions(...args);
      },
    });
    completed(
      await inboundHarness(db, people.identity, { store: bypassLabel }).run(
        optionCommand('COLOR', 'exact-duplicate'),
        await people.wh.actor(),
      ),
      'rejected',
      'GUARD_IDEMPOTENT_DUP',
    );
    assert.equal(selections, 2);
    const counts = await inboundCounts(db);
    assert.equal(counts.orders, 1);
    assert.equal(counts.lines, 1);
    assert.equal(counts.options, 2);
    assert.equal(counts.foreign, 0);
  });
});

void test('I1 unknown unique-constraint failure remains technical and leaves no poisoned outcome', async () => {
  await withDatabase(async (db) => {
    const { actor, h } = await prepare(db, 'option');
    completed(await h.run(optionCommand('COLOR', 'cross-kind-is-allowed'), actor), 'accepted');
    const command = optionCommand('QUALITY_GRADE', 'cross-kind-is-allowed'),
      before = await inboundCounts(db);
    await db.owner.query(
      'CREATE UNIQUE INDEX inbound_test_unknown_unique ON procurement.inbound_catalogue_option(installation_id,label)',
    );
    try {
      assert.equal((await h.run(command, actor)).status, 'technical');
      assert.deepEqual(await inboundCounts(db), before);
    } finally {
      await db.owner.query('DROP INDEX procurement.inbound_test_unknown_unique');
    }
    completed(await h.run(command, actor), 'accepted');
  });
});

for (const kind of ['order', 'option'] as const)
  void test(`I1 ${kind}: revocation waiting behind acquired Identity locks linearizes after the accepted command`, async () => {
    await withDatabase(async (db) => {
      const { people, actor, h, input } = await prepare(db, kind);
      const blocker = await db.owner.connect();
      await blocker.query('BEGIN');
      let announce!: (pid: number) => void;
      const reached = new Promise<number>((resolve) => {
        announce = resolve;
      });
      const store = new PostgresInboundStore();
      const running = inboundHarness(db, people.identity, {
        store: wrapper(store, {
          async lock(ctx, resources) {
            announce(await ownerBlocker(blocker, ctx, resources));
            await store.lock(ctx, resources);
          },
        }),
      }).run(input, actor);
      void running.catch(() => undefined);
      let revoking: Promise<void> | undefined;
      try {
        const pid = await Promise.race([
          reached,
          delay(8000).then(() => {
            throw new Error('No owner-lock checkpoint');
          }),
        ]);
        await advisoryWait(db, pid);
        revoking = people.identity.logout(people.proc.token);
        void revoking.catch(() => undefined);
        await waitFor(
          async () =>
            (
              await db.owner.query<{ blocked: boolean }>(
                'SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE $1=ANY(pg_blocking_pids(pid))) AS blocked',
                [pid],
              )
            ).rows[0]!.blocked,
          'Actual Identity revoker did not wait behind command row locks',
        );
      } finally {
        await blocker.query('ROLLBACK');
        blocker.release();
      }
      completed(await running, 'accepted');
      assert.ok(revoking);
      await revoking;
      assert.equal((await h.run(input, actor)).status, 'admission-denied');
      const counts = await inboundCounts(db);
      assert.equal(counts.orders, kind === 'order' ? 1 : 0);
      assert.equal(counts.options, 1);
      assert.equal(counts.foreign, 0);
    });
  });

void test('I1 actual PostgreSQL 40P01 injected lock-cycle fault aborts only the victim and the original key safely retries', async () => {
  await withDatabase(async (db) => {
    const { people, actor, h } = await prepare(db, 'option');
    const second = await people.proc2.actor();
    let arrived = 0,
      release!: () => void,
      deadlocks = 0;
    const ready = new Promise<void>((resolve) => {
      release = resolve;
    });
    const store = new PostgresInboundStore();
    const faulted = wrapper(store, {
      async lock(ctx, resources) {
        const first = ctx.actor.principal.subject === actor.principal.subject ? 1 : 2;
        const client = transactionClient(ctx.transaction);
        // Deliberately faulty infrastructure seam, not the production sorted owner-lock algorithm.
        await client.query('SELECT pg_advisory_xact_lock(77112233,$1::integer)', [first]);
        if (++arrived === 2) release();
        await ready;
        try {
          await client.query('SELECT pg_advisory_xact_lock(77112233,$1::integer)', [
            first === 1 ? 2 : 1,
          ]);
        } catch (error) {
          if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === '40P01'
          )
            deadlocks++;
          throw error;
        }
        await store.lock(ctx, resources);
      },
    });
    const commands = [optionCommand('COLOR', 'deadlock-a'), optionCommand('COLOR', 'deadlock-b')];
    const actors = [actor, second];
    const results = await Promise.all(
      commands.map((command, index) =>
        inboundHarness(db, people.identity, { store: faulted }).run(command, actors[index]!),
      ),
    );
    assert.equal(arrived, 2);
    assert.equal(deadlocks, 1);
    assert.equal(
      results.filter(
        (result) => result.status === 'completed' && result.result.outcome === 'accepted',
      ).length,
      1,
    );
    const victim = results.findIndex((result) => result.status === 'technical');
    assert.notEqual(victim, -1);
    const failed = results[victim]!;
    assert.equal(failed.status, 'technical');
    if (failed.status === 'technical') assert.equal(failed.kind, 'retryable');
    const beforeRetry = await inboundCounts(db);
    assert.equal(beforeRetry.options, 1);
    assert.equal(beforeRetry.outcomes, 1);
    assert.equal(beforeRetry.foreign, 0);
    completed(await h.run(commands[victim]!, actors[victim]!), 'accepted');
    const after = await inboundCounts(db);
    assert.equal(after.options, 2);
    assert.equal(after.outcomes, 2);
    assert.equal(after.foreign, 0);
  });
});
