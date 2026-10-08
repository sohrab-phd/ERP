import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { BusinessRejection, type TransactionPort } from '@navard/shared-kernel';
import { PostgresTransactions } from '../../src/infrastructure/postgresql/transaction.js';
import { PostgresReceiptStore } from '../../src/infrastructure/postgresql/receipt-store.js';
import type { ReceiptContext } from '../../src/modules/procurement/index.js';
import { withDatabase } from '../support/database-fixture.js';
import { lostCommitProxy } from '../support/crash-child.js';
import {
  operators,
  receiptCommand,
  receiptHarness,
  completed,
  readTransaction,
  bundleCounts,
  guard,
} from '../support/receipt-harness.js';

/** Both independent transactions must reach the actual owner lock before either proceeds. */
function twoPartyGate() {
  let arrivals = 0;
  let markReady!: () => void, rejectReady!: (error: Error) => void, release!: () => void;
  const ready = new Promise<void>((resolve, reject) => {
    markReady = resolve;
    rejectReady = reject;
  });
  const released = new Promise<void>((resolve) => {
    release = resolve;
  });
  const timer = setTimeout(() => {
    rejectReady(new Error(`Only ${arrivals} of 2 independent transactions reached the owner lock`));
  }, 8000);
  return {
    ready,
    get arrivals() {
      return arrivals;
    },
    async enter() {
      arrivals += 1;
      assert.ok(arrivals <= 2, 'Unexpected third concurrency participant');
      if (arrivals === 2) markReady();
      await released;
    },
    release() {
      clearTimeout(timer);
      release();
    },
  };
}
async function concurrentlyAtOwnerLock<T>(
  gate: ReturnType<typeof twoPartyGate>,
  first: () => Promise<T>,
  second: () => Promise<T>,
): Promise<T[]> {
  const running = [first(), second()];
  const results = Promise.all(running);
  // Keep early command errors handled while awaiting the bounded arrival assertion.
  void results.catch(() => undefined);
  try {
    await gate.ready;
    assert.equal(gate.arrivals, 2, 'Both transactions reached the owner boundary before release');
    gate.release();
    return await results;
  } finally {
    gate.release();
    await Promise.allSettled(running);
  }
}

void test('manual factory intake creates one atomic received/posted origin and exact available kg without a ticket or purchase order', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db),
      actor = await people.actor(),
      h = receiptHarness(db, people.identity),
      input = receiptCommand();
    const accepted = completed(await h.run(input, actor), 'accepted');
    assert.equal(accepted.result.event, 'GoodsReceiptPosted');
    const receipt = await readTransaction(db, actor, input, (ctx) =>
      h.service.get(ctx, input.target.id),
    );
    assert.ok(receipt?.unitId && receipt.lotId);
    assert.equal(receipt.state, 'POSTED');
    const unit = await readTransaction(db, actor, input, (ctx) =>
      h.stock.details(ctx, receipt.unitId!),
    );
    assert.equal(unit?.receiptId, receipt.id);
    assert.equal(unit?.lotId, receipt.lotId);
    assert.equal(unit?.count, '2');
    assert.equal(unit?.measuredKg, '11');
    assert.deepEqual(unit?.quantities, { onHand: '11', reserved: '0', available: '11' });
    assert.equal(
      (await db.owner.query<{ state: string }>('SELECT state FROM inventory.unit')).rows[0]?.state,
      'AVAILABLE',
    );
    assert.deepEqual(await bundleCounts(db), {
      receipts: 1,
      lots: 1,
      units: 1,
      movements: 1,
      outcomes: 1,
      audits: 1,
    });
  });
});

void test('Internal Code is descriptive and can be reused for distinct receipt identities', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db),
      actor = await people.actor(),
      h = receiptHarness(db, people.identity);
    const first = receiptCommand(),
      second = receiptCommand({ payload: { ...first.payload, count: '0', measuredKg: '3' } });
    completed(await h.run(first, actor), 'accepted');
    completed(await h.run(second, actor), 'accepted');
    assert.equal((await bundleCounts(db)).movements, 2);
    const qty = await db.owner.query<{ kg: string }>(
      'SELECT sum(on_hand_delta)::text AS kg FROM inventory.ledger',
    );
    assert.equal(qty.rows[0]?.kg, '14');
  });
});

void test('only a current individually authenticated warehouse role may post; procurement, customer, admin and forged contexts cannot', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db),
      h = receiptHarness(db, people.identity);
    for (const role of ['ACT-PROC', 'ACT-CUST', 'ACT-SEC'] as const)
      assert.equal(
        (await h.run(receiptCommand(), await people.actor(role))).status,
        'admission-denied',
      );
    const actor = await people.actor();
    assert.equal(
      (await h.run(receiptCommand(), { ...actor, principal: { ...actor.principal } })).status,
      'admission-denied',
    );
    assert.equal(
      (
        await h.run(
          receiptCommand(),
          Object.freeze({ ...actor, customerScope: 'foreign-customer' }),
        )
      ).status,
      'admission-denied',
    );
    assert.deepEqual(await bundleCounts(db), {
      receipts: 0,
      lots: 0,
      units: 0,
      movements: 0,
      outcomes: 0,
      audits: 5,
    });
    const audits = await db.owner.query<{ event_kind: string }>(
      'SELECT event_kind FROM kernel.audit_event ORDER BY event_kind',
    );
    assert.deepEqual(
      audits.rows.map((event) => event.event_kind),
      Array<string>(5).fill('AUD-ISOLATION-DENY'),
    );
  });
});

void test('missing receiving policy rejects durably and replays without creating a partial receipt', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db),
      actor = await people.actor(),
      input = receiptCommand();
    const h = receiptHarness(db, people.identity, {
      policy: { canRead: () => Promise.resolve(false) },
    });
    const first = completed(await h.run(input, actor), 'rejected', 'GUARD_OPEN_POLICY');
    const replay = completed(await h.run(input, actor), 'rejected', 'GUARD_OPEN_POLICY');
    assert.equal(replay.replayed, true);
    assert.deepEqual(replay.result, first.result);
    assert.deepEqual(await bundleCounts(db), {
      receipts: 0,
      lots: 0,
      units: 0,
      movements: 0,
      outcomes: 1,
      audits: 3,
    });
    const audits = await db.owner.query<{
      event_kind: string;
      family: string | null;
      open_item: string | null;
      execution_id: string;
    }>(
      'SELECT event_kind,family,open_item,execution_id FROM kernel.audit_event ORDER BY event_kind',
    );
    assert.deepEqual(audits.rows, [
      {
        event_kind: 'AUD-CMD-REJECTED',
        family: 'GUARD_OPEN_POLICY',
        open_item: 'OQ-019',
        execution_id: first.executionId,
      },
      {
        event_kind: 'AUD-CMD-REPLAYED',
        family: null,
        open_item: null,
        execution_id: first.executionId,
      },
      {
        event_kind: 'AUD-OPEN-POLICY',
        family: 'GUARD_OPEN_POLICY',
        open_item: 'OQ-019',
        execution_id: first.executionId,
      },
    ]);
  });
});

void test('fractional, zero, negative, exponent and unsafe representations reject; descriptive count never converts stock', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db),
      actor = await people.actor(),
      h = receiptHarness(db, people.identity);
    for (const measuredKg of ['0', '-1', '1.5', '1e3', '01', '1\n', '100000000000000000000']) {
      const base = receiptCommand();
      completed(
        await h.run({ ...base, payload: { ...base.payload, measuredKg } }, actor),
        'rejected',
        'GUARD_INVARIANT',
      );
    }
    for (const count of ['-1', '1.5', '1e3']) {
      const base = receiptCommand();
      completed(
        await h.run({ ...base, payload: { ...base.payload, count } }, actor),
        'rejected',
        'GUARD_INVARIANT',
      );
    }
    const base = receiptCommand();
    completed(
      await h.run(
        {
          ...base,
          payload: {
            ...base.payload,
            count: '99999999999999999999',
            measuredKg: '9007199254740993',
          },
        },
        actor,
      ),
      'accepted',
    );
    assert.equal(
      (await db.owner.query<{ on_hand: string }>('SELECT on_hand::text FROM inventory.balance'))
        .rows[0]?.on_hand,
      '9007199254740993',
    );
    assert.equal((await bundleCounts(db)).movements, 1);
  });
});

void test('same-key accepted replay and changed payload reuse cannot multiply receipt or stock facts', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db),
      actor = await people.actor(),
      h = receiptHarness(db, people.identity),
      input = receiptCommand();
    const first = completed(await h.run(input, actor), 'accepted'),
      replay = completed(await h.run(input, actor), 'accepted');
    assert.equal(replay.replayed, true);
    assert.equal(replay.executionId, first.executionId);
    assert.deepEqual(replay.result, first.result);
    assert.equal(
      (await h.run({ ...input, payload: { ...input.payload, measuredKg: '12' } }, actor)).status,
      'conflict',
    );
    assert.equal((await bundleCounts(db)).movements, 1);
  });
});

void test('receipt preserves the accepted UUID-v4 command-key contract by denying non-UUID keys before persistence', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db),
      actor = await people.actor(),
      h = receiptHarness(db, people.identity);
    const input = receiptCommand({
      idempotency_key: 'warehouse-intake:2026-10-07:operator-request-1',
    });
    assert.equal((await h.run(input, actor)).status, 'admission-denied');
    assert.deepEqual(await bundleCounts(db), {
      receipts: 0,
      lots: 0,
      units: 0,
      movements: 0,
      outcomes: 0,
      audits: 1,
    });
    const audits = await db.owner.query<{ event_kind: string }>(
      'SELECT event_kind FROM kernel.audit_event',
    );
    assert.deepEqual(audits.rows, [{ event_kind: 'AUD-CMD-ADMISSION-DENIED' }]);
  });
});

void test('new keys against the same receipt identity distinguish identical DUP from material CONFLICT', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db),
      actor = await people.actor(),
      h = receiptHarness(db, people.identity),
      input = receiptCommand();
    completed(await h.run(input, actor), 'accepted');
    completed(
      await h.run({ ...input, idempotency_key: randomUUID() }, actor),
      'rejected',
      'GUARD_IDEMPOTENT_DUP',
    );
    completed(
      await h.run(
        {
          ...input,
          idempotency_key: randomUUID(),
          payload: { ...input.payload, measuredKg: '12' },
        },
        actor,
      ),
      'rejected',
      'GUARD_CONFLICT',
    );
    assert.deepEqual(await bundleCounts(db), {
      receipts: 1,
      lots: 1,
      units: 1,
      movements: 1,
      outcomes: 3,
      audits: 3,
    });
  });
});

void test('concurrent matching receipt identities under different keys produce exactly one committed receipt and movement', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db),
      actor = await people.actor(),
      secondActor = await people.secondWarehouseActor(),
      input = receiptCommand(),
      gate = twoPartyGate();
    assert.notEqual(actor.principal.subject, secondActor.principal.subject);
    class ConcurrentReceiptStore extends PostgresReceiptStore {
      override async lock(ctx: ReceiptContext, id: string) {
        await gate.enter();
        await super.lock(ctx, id);
      }
    }
    const h = receiptHarness(db, people.identity, { store: new ConcurrentReceiptStore() });
    const results = await concurrentlyAtOwnerLock(
      gate,
      () => h.run(input, actor),
      () => h.run({ ...input, idempotency_key: randomUUID() }, secondActor),
    );
    const accepted = results.filter(
      (r) => r.status === 'completed' && r.result.outcome === 'accepted',
    );
    assert.equal(accepted.length, 1);
    const rejected = results.find(
      (r) => r.status === 'completed' && r.result.outcome === 'rejected',
    );
    assert.ok(rejected);
    completed(rejected, 'rejected', 'GUARD_IDEMPOTENT_DUP');
    assert.deepEqual(await bundleCounts(db), {
      receipts: 1,
      lots: 1,
      units: 1,
      movements: 1,
      outcomes: 2,
      audits: 2,
    });
  });
});

void test('standalone Sheet preserves unique product/material identity without a fabricated Coil ancestor', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db),
      actor = await people.actor(),
      h = receiptHarness(db, people.identity);
    const base = receiptCommand(),
      input = { ...base, payload: { ...base.payload, type: 'SHEET', productCode: 'SHEET-UNIQUE' } };
    completed(await h.run(input, actor), 'accepted');
    const receipt = await readTransaction(db, actor, input, (ctx) =>
      h.service.get(ctx, input.target.id),
    );
    assert.ok(receipt?.unitId && receipt.lotId);
    const origin = await readTransaction(db, actor, input, (ctx) =>
      h.stock.lot(ctx, receipt.lotId!),
    );
    assert.equal(origin?.productCode, 'SHEET-UNIQUE');
    assert.equal(origin?.type, 'SHEET');
    assert.ok(origin?.materialId);
    assert.notEqual(origin.materialId, origin.unitId);
    assert.equal('coilId' in origin, false);
    assert.equal('sourceCoil' in origin, false);
    const duplicate = {
      ...input,
      target: { ...input.target, id: randomUUID() },
      idempotency_key: randomUUID(),
    };
    completed(await h.run(duplicate, actor), 'rejected', 'GUARD_CONFLICT');
    const absent = receiptCommand();
    completed(
      await h.run({ ...absent, payload: { ...absent.payload, type: 'SHEET' } }, actor),
      'rejected',
      'GUARD_INVARIANT',
    );
    assert.equal((await bundleCounts(db)).movements, 1);
  });
});

void test('concurrent different receipt IDs cannot reuse one standalone Sheet product code', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db),
      actor = await people.actor(),
      secondActor = await people.secondWarehouseActor(),
      good = receiptHarness(db, people.identity),
      base = receiptCommand(),
      gate = twoPartyGate();
    assert.notEqual(actor.principal.subject, secondActor.principal.subject);
    const h = receiptHarness(db, people.identity, {
      inventory: {
        async receive(...args) {
          await gate.enter();
          return good.stock.receive(...args);
        },
      },
    });
    const first = {
      ...base,
      payload: { ...base.payload, type: 'SHEET', productCode: 'CONCURRENT-SHEET' },
    };
    const second = {
      ...first,
      target: { ...first.target, id: randomUUID() },
      idempotency_key: randomUUID(),
    };
    const results = await concurrentlyAtOwnerLock(
      gate,
      () => h.run(first, actor),
      () => h.run(second, secondActor),
    );
    assert.equal(
      results.filter((r) => r.status === 'completed' && r.result.outcome === 'accepted').length,
      1,
    );
    const rejected = results.find(
      (r) => r.status === 'completed' && r.result.outcome === 'rejected',
    );
    assert.ok(rejected);
    completed(rejected, 'rejected', 'GUARD_CONFLICT');
    assert.equal((await bundleCounts(db)).lots, 1);
  });
});

void test('foreign authority and customer identities cannot disclose receipt or stock details', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db),
      actor = await people.actor(),
      h = receiptHarness(db, people.identity),
      input = receiptCommand();
    completed(await h.run(input, actor), 'accepted');
    const receipt = await readTransaction(db, actor, input, (ctx) =>
      h.service.get(ctx, input.target.id),
    );
    assert.ok(receipt?.unitId);
    const customer = await people.actor('ACT-CUST');
    await assert.rejects(
      readTransaction(db, customer, input, (ctx) => h.service.get(ctx, input.target.id)),
      guard('GUARD_ACTOR'),
    );
    await assert.rejects(
      readTransaction(db, customer, input, (ctx) => h.stock.details(ctx, receipt.unitId!)),
      guard('GUARD_ACTOR'),
    );
    const foreign = Object.freeze({ ...actor, authorityScopeId: randomUUID() });
    await assert.rejects(
      readTransaction(db, foreign, input, (ctx) => h.service.get(ctx, input.target.id)),
      guard('GUARD_ACTOR'),
    );
    await assert.rejects(
      readTransaction(db, foreign, input, (ctx) => h.stock.details(ctx, receipt.unitId!)),
      guard('GUARD_ACTOR'),
    );
  });
});

void test('business rejection after actual inventory writes rolls back receipt/Lot/Unit/Ledger but durably stores the rejected outcome', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db),
      actor = await people.actor(),
      good = receiptHarness(db, people.identity),
      input = receiptCommand();
    const h = receiptHarness(db, people.identity, {
      inventory: {
        async receive(...args) {
          await good.stock.receive(...args);
          throw new BusinessRejection({
            family: 'GUARD_INVARIANT',
            message: 'Injected later owner guard',
          });
        },
      },
    });
    completed(await h.run(input, actor), 'rejected', 'GUARD_INVARIANT');
    assert.deepEqual(await bundleCounts(db), {
      receipts: 0,
      lots: 0,
      units: 0,
      movements: 0,
      outcomes: 1,
      audits: 1,
    });
    completed(await h.run(input, actor), 'rejected', 'GUARD_INVARIANT');
  });
});

void test('technical failure after real inventory writes aborts receipt, stock origin, outcome and audit together', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db),
      actor = await people.actor(),
      good = receiptHarness(db, people.identity),
      input = receiptCommand();
    const h = receiptHarness(db, people.identity, {
      inventory: {
        async receive(...args) {
          await good.stock.receive(...args);
          throw new Error('Injected broken later owner persistence');
        },
      },
    });
    assert.equal((await h.run(input, actor)).status, 'technical');
    assert.deepEqual(await bundleCounts(db), {
      receipts: 0,
      lots: 0,
      units: 0,
      movements: 0,
      outcomes: 0,
      audits: 0,
    });
    completed(await good.run(input, actor), 'accepted');
    assert.equal((await bundleCounts(db)).movements, 1);
  });
});

void test('stock visibility rejects a drifted Balance and rebuilding from Ledger restores the same receipt quantities', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db),
      actor = await people.actor(),
      h = receiptHarness(db, people.identity),
      input = receiptCommand();
    completed(await h.run(input, actor), 'accepted');
    const receipt = await readTransaction(db, actor, input, (ctx) =>
      h.service.get(ctx, input.target.id),
    );
    assert.ok(receipt?.unitId);
    await db.owner.query('UPDATE inventory.balance SET on_hand=12 WHERE unit_id=$1', [
      receipt.unitId,
    ]);
    await assert.rejects(
      readTransaction(db, actor, input, (ctx) => h.stock.details(ctx, receipt.unitId!)),
      (error: unknown) =>
        typeof error === 'object' &&
        error !== null &&
        'kind' in error &&
        error.kind === 'incompatible',
    );
    await readTransaction(db, actor, input, (ctx) => h.inventory.rebuild(ctx, [receipt.unitId!]));
    const restored = await readTransaction(db, actor, input, (ctx) =>
      h.stock.details(ctx, receipt.unitId!),
    );
    assert.deepEqual(restored?.quantities, { onHand: '11', reserved: '0', available: '11' });
    assert.deepEqual(await bundleCounts(db), {
      receipts: 1,
      lots: 1,
      units: 1,
      movements: 1,
      outcomes: 1,
      audits: 1,
    });
  });
});

void test('audit failure aborts the complete receipt transaction and the same key can retry safely', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db),
      actor = await people.actor(),
      input = receiptCommand();
    const h = receiptHarness(db, people.identity, {
      ports: {
        audits: {
          async append(tx, event) {
            await db.audit.append(tx, event);
            throw new Error('Injected audit transport failure');
          },
        },
      },
    });
    assert.equal((await h.run(input, actor)).status, 'technical');
    assert.deepEqual(await bundleCounts(db), {
      receipts: 0,
      lots: 0,
      units: 0,
      movements: 0,
      outcomes: 0,
      audits: 0,
    });
    completed(await receiptHarness(db, people.identity).run(input, actor), 'accepted');
    assert.equal((await bundleCounts(db)).movements, 1);
  });
});

void test('revoking a session after admission while the command waits on its lock prevents receipt posting', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db),
      actor = await people.actor(),
      input = receiptCommand();
    let signal!: () => void, resume!: () => void;
    const waiting = new Promise<void>((r) => {
        signal = r;
      }),
      released = new Promise<void>((r) => {
        resume = r;
      });
    const transactions: TransactionPort = {
      async begin() {
        const session = await db.transactions.begin();
        return {
          ...session,
          async lock(words) {
            signal();
            await released;
            await session.lock(words);
          },
        };
      },
    };
    const h = receiptHarness(db, people.identity, { ports: { transactions } });
    const running = h.run(input, actor);
    await waiting;
    try {
      await people.identity.logout(people.tokens.get('ACT-WH')!);
    } finally {
      resume();
    }
    assert.equal((await running).status, 'admission-denied');
    assert.equal((await bundleCounts(db)).movements, 0);
  });
});

void test('lost server-confirmed COMMIT response replays the committed receipt without duplicating its stock origin', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db),
      actor = await people.actor(),
      input = receiptCommand();
    const proxy = await lostCommitProxy(process.env.TEST_DATABASE_URL ?? ''),
      pool = new Pool({ connectionString: proxy.url });
    pool.on('error', () => undefined);
    try {
      const result = await receiptHarness(db, people.identity, {
        ports: { transactions: new PostgresTransactions(pool) },
      }).run(input, actor);
      assert.equal(result.status, 'technical');
      if (result.status === 'technical') assert.equal(result.kind, 'uncertain');
      assert.equal(proxy.commitConfirmed(), true);
      const recovered = completed(
        await receiptHarness(db, people.identity).run(input, actor),
        'accepted',
      );
      assert.equal(recovered.replayed, true);
      assert.deepEqual(await bundleCounts(db), {
        receipts: 1,
        lots: 1,
        units: 1,
        movements: 1,
        outcomes: 1,
        audits: 2,
      });
    } finally {
      await pool.end();
      await proxy.close();
    }
  });
});
