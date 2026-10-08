import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import {
  isJsonObject,
  type CommandRequest,
  type TransactionPort,
  type JsonValue,
  type StableAcceptedResult,
} from '@navard/shared-kernel';
import { InventoryPostingService } from '../../src/modules/inventory/index.js';
import { PostgresInventoryStore } from '../../src/infrastructure/postgresql/inventory-store.js';
import { PostgresSalesStore } from '../../src/infrastructure/postgresql/sales-store.js';
import { PostgresTransactions } from '../../src/infrastructure/postgresql/transaction.js';
import type { SalesContext } from '../../src/modules/sales/index.js';
import { withDatabase, type DatabaseFixture } from '../support/database-fixture.js';
import { lostCommitProxy } from '../support/crash-child.js';
import {
  operators,
  receiptCommand,
  receiptHarness,
  completed,
  readTransaction,
  guard,
} from '../support/receipt-harness.js';
import {
  salesPeople,
  salesHarness,
  salesCommand,
  follow,
  salesRead,
  salesCounts,
} from '../support/sales-harness.js';

function itemId(input: CommandRequest): string {
  assert.ok(Array.isArray(input.payload.items));
  const item = (input.payload.items as readonly JsonValue[])[0];
  assert.ok(item !== undefined && isJsonObject(item) && typeof item.id === 'string');
  return item.id;
}
async function receivedStock(db: DatabaseFixture, kg = '11') {
  const people = await operators(db),
    actor = await people.actor(),
    h = receiptHarness(db, people.identity),
    base = receiptCommand(),
    input = { ...base, payload: { ...base.payload, measuredKg: kg } };
  completed(await h.run(input, actor), 'accepted');
  const receipt = await readTransaction(db, actor, input, (ctx) =>
    h.service.get(ctx, input.target.id),
  );
  assert.ok(receipt?.unitId);
  return { unitId: receipt.unitId, people, actor };
}
async function prepared(db: DatabaseFixture) {
  const people = await salesPeople(db),
    h = salesHarness(db, people.identity),
    input = salesCommand(people.customerId),
    stock = await receivedStock(db);
  completed(await h.run(input, people.actor), 'accepted');
  const submit = follow(input, 'SubmitSalesOrder');
  completed(await h.run(submit, people.actor), 'accepted');
  const assessment = {
    ...follow(input, 'DraftFulfillmentAssessment', { orderId: input.target.id }),
    target: { kind: 'fulfillment-assessment', id: randomUUID() },
  };
  completed(await h.run(assessment, people.actor), 'accepted');
  const record = follow(assessment, 'RecordFulfillmentStock', {
    selections: [{ itemId: itemId(input), unitIds: [stock.unitId] }],
  });
  const confirm = follow(input, 'ConfirmSalesOrder', { assessmentId: assessment.target.id });
  return { people, h, input, stock, submit, assessment, record, confirm };
}
void test('real Sales demand submits, records current stock evidence and confirms without stock/reservation effects', async () => {
  await withDatabase(async (db) => {
    const p = await prepared(db);
    completed(await p.h.run(p.record, p.people.actor), 'accepted');
    const result = completed(await p.h.run(p.confirm, p.people.actor), 'accepted');
    assert.equal(result.result.event, 'SalesOrderConfirmed');
    const order = await salesRead(db, p.people.actor, p.confirm, (ctx) =>
        p.h.service.getOrder(ctx, p.input.target.id),
      ),
      assessment = await salesRead(db, p.people.actor, p.record, (ctx) =>
        p.h.service.getAssessment(ctx, p.assessment.target.id),
      );
    assert.equal(order?.state, 'CONFIRMED');
    assert.equal(order?.commercialTerms, 'NOT_SUPPLIED');
    assert.equal(order?.confirmedAssessmentId, assessment?.id);
    assert.ok(order?.confirmedAt);
    assert.equal(assessment?.state, 'RECORDED');
    assert.equal(assessment?.stock?.[0]?.availableKg, '11');
    assert.ok(assessment?.observedAt);
    assert.deepEqual(await salesCounts(db), {
      orders: 1,
      assessments: 1,
      outcomes: 6,
      audits: 6,
      movements: 1,
      reservations: 0,
    });
    assert.deepEqual(
      (await db.owner.query('SELECT on_hand::text,reserved::text FROM inventory.balance')).rows,
      [{ on_hand: '11', reserved: '0' }],
    );
    const events = await db.owner.query<{ event_kind: string }>(
      'SELECT event_kind FROM kernel.audit_event',
    );
    assert.ok(events.rows.every((row) => row.event_kind === 'AUD-CMD-ACCEPTED'));
  });
});
void test('immutable demand/customer snapshot survives later customer master edits', async () => {
  await withDatabase(async (db) => {
    const p = await salesPeople(db),
      h = salesHarness(db, p.identity),
      input = salesCommand(p.customerId);
    completed(await h.run(input, p.actor), 'accepted');
    const original = await salesRead(db, p.actor, input, (ctx) =>
      h.service.getOrder(ctx, input.target.id),
    );
    assert.ok(original);
    await db.owner.query('UPDATE sales.customer SET display_name=$1 WHERE customer_id=$2', [
      'Renamed customer',
      p.customerId,
    ]);
    const current = await salesRead(db, p.actor, input, (ctx) =>
      h.service.getOrder(ctx, input.target.id),
    );
    assert.deepEqual(current, original);
    assert.equal(current?.customerName, 'Synthetic factory customer');
    assert.equal(current?.items[0]?.allowPartialShipment, false);
  });
});
void test('Sales role and exact customer isolation deny foreign reads/commands and forged or warehouse contexts', async () => {
  await withDatabase(async (db) => {
    const p = await salesPeople(db),
      h = salesHarness(db, p.identity),
      input = salesCommand(p.customerId);
    completed(await h.run(input, p.actor), 'accepted');
    assert.equal(
      await salesRead(db, p.foreign, input, (ctx) => h.service.getOrder(ctx, input.target.id)),
      undefined,
    );
    completed(await h.run(follow(input, 'SubmitSalesOrder'), p.foreign), 'rejected', 'GUARD_ACTOR');
    assert.equal(
      (await h.run(salesCommand(p.otherCustomerId), p.actor)).status,
      'admission-denied',
    );
    assert.equal(
      (await h.run(salesCommand(p.customerId), { ...p.actor, principal: { ...p.actor.principal } }))
        .status,
      'admission-denied',
    );
    const warehouse = await p.person('warehouse', 'ACT-WH');
    assert.equal((await h.run(salesCommand(p.customerId), warehouse)).status, 'admission-denied');
    await assert.rejects(
      salesRead(db, warehouse, input, (ctx) => h.service.getOrder(ctx, input.target.id)),
      guard('GUARD_ACTOR'),
    );
    const customer = await p.person('portal', 'ACT-CUST');
    assert.equal((await h.run(salesCommand(p.customerId), customer)).status, 'admission-denied');
  });
});
void test('a current customer-scoped grant does not fabricate a missing customer master', async () => {
  await withDatabase(async (db) => {
    const p = await salesPeople(db),
      unknown = randomUUID(),
      actor = await p.person('unconfigured', 'ACT-SALES', unknown),
      h = salesHarness(db, p.identity);
    completed(await h.run(salesCommand(unknown), actor), 'rejected', 'GUARD_ACTOR');
    assert.equal((await salesCounts(db)).orders, 0);
  });
});
void test('unknown commercial fields and speculative amounts are rejected before any Sales record', async () => {
  await withDatabase(async (db) => {
    const p = await salesPeople(db),
      h = salesHarness(db, p.identity),
      input = salesCommand(p.customerId);
    const result = await h.run(
      { ...input, payload: { ...input.payload, pricePerKg: '100' } },
      p.actor,
    );
    assert.equal(result.status, 'admission-denied');
    const items = input.payload.items;
    assert.ok(Array.isArray(items));
    const first = (items as readonly JsonValue[])[0];
    assert.ok(first !== undefined && isJsonObject(first));
    assert.equal(
      (
        await h.run(
          {
            ...input,
            idempotency_key: randomUUID(),
            payload: { ...input.payload, items: [{ ...first, amount: '500' }] },
          },
          p.actor,
        )
      ).status,
      'admission-denied',
    );
    assert.equal((await salesCounts(db)).orders, 0);
  });
});
void test('same-key accepted replay and conflicting payload/command/principal cannot duplicate demand', async () => {
  await withDatabase(async (db) => {
    const p = await salesPeople(db),
      h = salesHarness(db, p.identity),
      input = salesCommand(p.customerId);
    const accepted = completed(await h.run(input, p.actor), 'accepted'),
      replay = completed(await h.run(input, p.actor), 'accepted');
    assert.equal(replay.replayed, true);
    assert.deepEqual(replay.result, accepted.result);
    assert.equal(replay.executionId, accepted.executionId);
    assert.equal(
      (await h.run({ ...input, payload: { customerId: p.customerId, items: [] } }, p.actor)).status,
      'conflict',
    );
    assert.equal(
      (await h.run({ ...input, command: 'SubmitSalesOrder', payload: {} }, p.actor)).status,
      'conflict',
    );
    assert.equal((await h.run(input, p.second)).status, 'conflict');
    assert.equal((await salesCounts(db)).orders, 1);
    assert.equal((await salesCounts(db)).outcomes, 1);
    assert.equal(
      (
        await db.owner.query<{ n: number }>(
          "SELECT count(*)::int AS n FROM kernel.audit_event WHERE event_kind='AUD-CMD-REPLAYED'",
        )
      ).rows[0]?.n,
      1,
    );
  });
});
void test('first rejected outcome stays durable across corrected workflow and same-key retry', async () => {
  await withDatabase(async (db) => {
    const p = await prepared(db),
      first = completed(await p.h.run(p.confirm, p.people.actor), 'rejected', 'GUARD_STATE');
    completed(await p.h.run(p.record, p.people.actor), 'accepted');
    const replay = completed(await p.h.run(p.confirm, p.people.actor), 'rejected', 'GUARD_STATE');
    assert.equal(replay.replayed, true);
    assert.deepEqual(replay.result, first.result);
    completed(
      await p.h.run({ ...p.confirm, idempotency_key: randomUUID() }, p.people.actor),
      'accepted',
    );
    assert.equal(
      (
        await salesRead(db, p.people.actor, p.confirm, (ctx) =>
          p.h.service.getOrder(ctx, p.input.target.id),
        )
      )?.state,
      'CONFIRMED',
    );
  });
});
void test('new-key repeats distinguish identical order fact DUP from different material demand CONFLICT', async () => {
  await withDatabase(async (db) => {
    const p = await salesPeople(db),
      h = salesHarness(db, p.identity),
      input = salesCommand(p.customerId);
    completed(await h.run(input, p.actor), 'accepted');
    completed(
      await h.run({ ...input, idempotency_key: randomUUID() }, p.actor),
      'rejected',
      'GUARD_IDEMPOTENT_DUP',
    );
    const items = input.payload.items;
    assert.ok(Array.isArray(items));
    const first = (items as readonly JsonValue[])[0];
    assert.ok(first !== undefined && isJsonObject(first));
    completed(
      await h.run(
        {
          ...input,
          idempotency_key: randomUUID(),
          payload: { ...input.payload, items: [{ ...first, demandedKg: '6' }] },
        },
        p.actor,
      ),
      'rejected',
      'GUARD_CONFLICT',
    );
    assert.equal((await salesCounts(db)).orders, 1);
  });
});
void test('confirmation requires SUBMITTED order and its own recorded assessment', async () => {
  await withDatabase(async (db) => {
    const p = await prepared(db);
    completed(await p.h.run(p.record, p.people.actor), 'accepted');
    const other = salesCommand(p.people.customerId);
    completed(await p.h.run(other, p.people.actor), 'accepted');
    completed(
      await p.h.run(
        follow(other, 'ConfirmSalesOrder', { assessmentId: p.assessment.target.id }),
        p.people.actor,
      ),
      'rejected',
      'GUARD_STATE',
    );
    completed(await p.h.run(follow(other, 'SubmitSalesOrder'), p.people.actor), 'accepted');
    completed(
      await p.h.run(
        follow(other, 'ConfirmSalesOrder', { assessmentId: p.assessment.target.id }),
        p.people.actor,
      ),
      'rejected',
      'GUARD_STATE',
    );
    assert.equal(
      (
        await salesRead(db, p.people.actor, other, (ctx) =>
          p.h.service.getOrder(ctx, other.target.id),
        )
      )?.state,
      'SUBMITTED',
    );
  });
});
void test('insufficient, missing or mismatched selected stock rejects and leaves assessment DRAFT', async () => {
  await withDatabase(async (db) => {
    const p = await prepared(db),
      item = itemId(p.input);
    completed(
      await p.h.run(
        { ...p.record, payload: { selections: [{ itemId: item, unitIds: [randomUUID()] }] } },
        p.people.actor,
      ),
      'rejected',
      'GUARD_STATE',
    );
    await db.owner.query("UPDATE inventory.unit SET kind='SHEET' WHERE unit_id=$1", [
      p.stock.unitId,
    ]);
    completed(
      await p.h.run({ ...p.record, idempotency_key: randomUUID() }, p.people.actor),
      'rejected',
      'GUARD_INVARIANT',
    );
    assert.equal(
      (
        await salesRead(db, p.people.actor, p.record, (ctx) =>
          p.h.service.getAssessment(ctx, p.assessment.target.id),
        )
      )?.state,
      'DRAFT',
    );
    assert.equal((await salesCounts(db)).reservations, 0);
  });
});
void test('selected stock cannot cover more kg than real Ledger-backed availability', async () => {
  await withDatabase(async (db) => {
    const p = await salesPeople(db),
      h = salesHarness(db, p.identity),
      input = salesCommand(p.customerId),
      stock = await receivedStock(db, '3');
    completed(await h.run(input, p.actor), 'accepted');
    const assessment = {
      ...follow(input, 'DraftFulfillmentAssessment', { orderId: input.target.id }),
      target: { kind: 'fulfillment-assessment', id: randomUUID() },
    };
    completed(await h.run(assessment, p.actor), 'accepted');
    completed(
      await h.run(
        follow(assessment, 'RecordFulfillmentStock', {
          selections: [{ itemId: itemId(input), unitIds: [stock.unitId] }],
        }),
        p.actor,
      ),
      'rejected',
      'GUARD_INVARIANT',
    );
    assert.equal((await salesCounts(db)).reservations, 0);
  });
});
void test('confirmation rereads availability and rejects stock reserved after assessment without changing evidence', async () => {
  await withDatabase(async (db) => {
    const p = await prepared(db);
    completed(await p.h.run(p.record, p.people.actor), 'accepted');
    const before = await salesRead(db, p.people.actor, p.record, (ctx) =>
      p.h.service.getAssessment(ctx, p.assessment.target.id),
    );
    const ips = new InventoryPostingService(new PostgresInventoryStore(), {
      authorize: () => Promise.resolve(true),
      validate: () => Promise.resolve(undefined),
      maintain: () => Promise.resolve(true),
      reservationPriority: () => Promise.resolve(true),
    });
    await readTransaction(
      db,
      p.stock.actor,
      receiptCommand({ command: 'ActivateReservation' }),
      (ctx) =>
        ips.post(ctx, [
          {
            type: 'RESERVE',
            source: { factId: randomUUID(), effectId: randomUUID() },
            unitId: p.stock.unitId,
            kg: '10',
            reservationId: randomUUID(),
            demandId: randomUUID(),
          },
        ]),
    );
    completed(await p.h.run(p.confirm, p.people.actor), 'rejected', 'GUARD_INVARIANT');
    assert.equal(
      (
        await salesRead(db, p.people.actor, p.confirm, (ctx) =>
          p.h.service.getOrder(ctx, p.input.target.id),
        )
      )?.state,
      'SUBMITTED',
    );
    assert.deepEqual(
      await salesRead(db, p.people.actor, p.record, (ctx) =>
        p.h.service.getAssessment(ctx, p.assessment.target.id),
      ),
      before,
    );
  });
});
void test('Balance drift cannot be used as an availability source; command fails technically with no recorded assessment', async () => {
  await withDatabase(async (db) => {
    const p = await prepared(db);
    await db.owner.query('UPDATE inventory.balance SET on_hand=12 WHERE unit_id=$1', [
      p.stock.unitId,
    ]);
    const before = await salesCounts(db);
    const result = await p.h.run(p.record, p.people.actor);
    assert.equal(result.status, 'technical');
    if (result.status === 'technical') assert.equal(result.kind, 'incompatible');
    assert.deepEqual(await salesCounts(db), before);
    assert.equal(
      (
        await salesRead(db, p.people.actor, p.record, (ctx) =>
          p.h.service.getAssessment(ctx, p.assessment.target.id),
        )
      )?.state,
      'DRAFT',
    );
  });
});
void test('different individuals concurrently advancing one submitted order yield exactly one confirmation', async () => {
  await withDatabase(async (db) => {
    const p = await prepared(db);
    completed(await p.h.run(p.record, p.people.actor), 'accepted');
    let arrivals = 0,
      ready!: () => void,
      release!: () => void;
    const arrived = new Promise<void>((resolve) => {
        ready = resolve;
      }),
      released = new Promise<void>((resolve) => {
        release = resolve;
      });
    class Store extends PostgresSalesStore {
      override async lockOrder(ctx: SalesContext, id: string) {
        arrivals++;
        if (arrivals === 2) ready();
        await released;
        await super.lockOrder(ctx, id);
      }
    }
    const h = salesHarness(db, p.people.identity, { store: new Store() }),
      running = [
        h.run(p.confirm, p.people.actor),
        h.run({ ...p.confirm, idempotency_key: randomUUID() }, p.people.second),
      ];
    const results = Promise.all(running);
    void results.catch(() => undefined);
    try {
      await Promise.race([
        arrived,
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Both individuals did not reach Sales owner lock')),
            8000,
          ).unref(),
        ),
      ]);
      assert.equal(arrivals, 2);
      release();
      const outcomes = await results;
      assert.equal(
        outcomes.filter((r) => r.status === 'completed' && r.result.outcome === 'accepted').length,
        1,
      );
      const duplicate = outcomes.find(
        (r) => r.status === 'completed' && r.result.outcome === 'rejected',
      );
      assert.ok(duplicate);
      completed(duplicate, 'rejected', 'GUARD_IDEMPOTENT_DUP');
    } finally {
      release();
      await Promise.allSettled(running);
    }
    assert.equal((await salesCounts(db)).orders, 1);
    assert.equal((await salesCounts(db)).reservations, 0);
    assert.equal((await salesCounts(db)).movements, 1);
  });
});
void test('simultaneous same-key requests commit one demand fact and replay the same outcome', async () => {
  await withDatabase(async (db) => {
    const p = await salesPeople(db),
      h = salesHarness(db, p.identity),
      input = salesCommand(p.customerId);
    const results = await Promise.all([h.run(input, p.actor), h.run(input, p.actor)]);
    const completedResults = results.map((result) => completed(result, 'accepted'));
    assert.equal(completedResults.filter((result) => result.replayed).length, 1);
    assert.equal(completedResults[0]?.executionId, completedResults[1]?.executionId);
    assert.deepEqual(await salesCounts(db), {
      orders: 1,
      assessments: 0,
      outcomes: 1,
      audits: 2,
      movements: 0,
      reservations: 0,
    });
  });
});
void test('session revoked during envelope lock wait cannot enter Sales owner transition', async () => {
  await withDatabase(async (db) => {
    const p = await salesPeople(db),
      input = salesCommand(p.customerId);
    let signal!: () => void, resume!: () => void;
    const waiting = new Promise<void>((resolve) => {
        signal = resolve;
      }),
      released = new Promise<void>((resolve) => {
        resume = resolve;
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
    const h = salesHarness(db, p.identity, { ports: { transactions } }),
      running = h.run(input, p.actor);
    await waiting;
    try {
      await p.identity.logout(p.tokens.get('first')!);
    } finally {
      resume();
    }
    assert.equal((await running).status, 'admission-denied');
    assert.equal((await salesCounts(db)).orders, 0);
  });
});
void test('audit failure rolls back confirmation and outcome atomically; same key retry succeeds', async () => {
  await withDatabase(async (db) => {
    const p = await prepared(db);
    completed(await p.h.run(p.record, p.people.actor), 'accepted');
    const before = await salesCounts(db);
    const h = salesHarness(db, p.people.identity, {
      ports: {
        audits: {
          async append(tx, event) {
            await db.audit.append(tx, event);
            throw new Error('Injected post-write audit failure');
          },
        },
      },
    });
    assert.equal((await h.run(p.confirm, p.people.actor)).status, 'technical');
    assert.deepEqual(await salesCounts(db), before);
    assert.equal(
      (
        await salesRead(db, p.people.actor, p.confirm, (ctx) =>
          p.h.service.getOrder(ctx, p.input.target.id),
        )
      )?.state,
      'SUBMITTED',
    );
    completed(await p.h.run(p.confirm, p.people.actor), 'accepted');
  });
});
void test('lost confirmed COMMIT response recovers durable Sales confirmation without repeated state transition', async () => {
  await withDatabase(async (db) => {
    const p = await prepared(db);
    completed(await p.h.run(p.record, p.people.actor), 'accepted');
    const proxy = await lostCommitProxy(process.env.TEST_DATABASE_URL ?? ''),
      pool = new Pool({ connectionString: proxy.url });
    pool.on('error', () => undefined);
    try {
      const result = await salesHarness(db, p.people.identity, {
        ports: { transactions: new PostgresTransactions(pool) },
      }).run(p.confirm, p.people.actor);
      assert.equal(result.status, 'technical');
      if (result.status === 'technical') assert.equal(result.kind, 'uncertain');
      assert.equal(proxy.commitConfirmed(), true);
      const recovered = completed(await p.h.run(p.confirm, p.people.actor), 'accepted');
      assert.equal(recovered.replayed, true);
      assert.equal((await salesCounts(db)).orders, 1);
      assert.equal((await salesCounts(db)).movements, 1);
      assert.equal((await salesCounts(db)).reservations, 0);
    } finally {
      await pool.end();
      await proxy.close();
    }
  });
});
void test('database enforces immutable order/recorded assessment and runtime cannot edit customers, delete facts or alter audit', async () => {
  await withDatabase(async (db) => {
    const p = await prepared(db);
    completed(await p.h.run(p.record, p.people.actor), 'accepted');
    completed(await p.h.run(p.confirm, p.people.actor), 'accepted');
    const check = (code: string) => (error: unknown) =>
      typeof error === 'object' && error !== null && 'code' in error && error.code === code;
    await assert.rejects(
      db.runtime.query("UPDATE sales.customer SET display_name='Tampered' WHERE customer_id=$1", [
        p.people.customerId,
      ]),
      check('42501'),
    );
    await assert.rejects(
      db.runtime.query("UPDATE sales.sales_order SET customer_name='Tampered' WHERE order_id=$1", [
        p.input.target.id,
      ]),
      check('23514'),
    );
    await assert.rejects(
      db.runtime.query(
        "UPDATE sales.sales_order SET state='DRAFT',confirmed_at=NULL,confirmed_assessment_id=NULL WHERE order_id=$1",
        [p.input.target.id],
      ),
      check('23514'),
    );
    await assert.rejects(
      db.runtime.query(
        "UPDATE sales.fulfillment_assessment SET stock='[]'::jsonb WHERE assessment_id=$1",
        [p.assessment.target.id],
      ),
      check('23514'),
    );
    await assert.rejects(
      db.runtime.query('DELETE FROM sales.sales_order WHERE order_id=$1', [p.input.target.id]),
      check('42501'),
    );
    await assert.rejects(
      db.runtime.query("UPDATE kernel.audit_event SET event_kind='AUD-CMD-REPLAYED'"),
      check('42501'),
    );
  });
});

void test('customer-scoped ID collisions cannot create duplicate order or assessment identities or expose their owner', async () => {
  await withDatabase(async (db) => {
    const p = await prepared(db),
      foreignOrder = salesCommand(p.people.otherCustomerId, { target: { ...p.input.target } });
    completed(await p.h.run(foreignOrder, p.people.foreign), 'rejected', 'GUARD_ACTOR');
    const second = salesCommand(p.people.otherCustomerId);
    completed(await p.h.run(second, p.people.foreign), 'accepted');
    const collide = follow(p.assessment, 'DraftFulfillmentAssessment', {
      orderId: second.target.id,
    });
    completed(await p.h.run(collide, p.people.foreign), 'rejected', 'GUARD_ACTOR');
    const counts = await salesCounts(db);
    assert.equal(counts.orders, 2);
    assert.equal(counts.assessments, 1);
    assert.equal(
      await salesRead(db, p.people.foreign, p.input, (ctx) =>
        p.h.service.getOrder(ctx, p.input.target.id),
      ),
      undefined,
    );
  });
});

void test('stock availability cannot cross a foreign customer-owned inventory boundary', async () => {
  await withDatabase(async (db) => {
    const p = await prepared(db);
    await db.owner.query('UPDATE inventory.unit SET customer_scope=$1 WHERE unit_id=$2', [
      p.people.otherCustomerId,
      p.stock.unitId,
    ]);
    completed(await p.h.run(p.record, p.people.actor), 'rejected', 'GUARD_ACTOR');
    assert.equal(
      (
        await salesRead(db, p.people.actor, p.record, (ctx) =>
          p.h.service.getAssessment(ctx, p.assessment.target.id),
        )
      )?.state,
      'DRAFT',
    );
    await db.owner.query('UPDATE inventory.unit SET customer_scope=$1 WHERE unit_id=$2', [
      p.people.customerId,
      p.stock.unitId,
    ]);
    completed(
      await p.h.run({ ...p.record, idempotency_key: randomUUID() }, p.people.actor),
      'accepted',
    );
    assert.equal((await salesCounts(db)).movements, 1);
    assert.equal((await salesCounts(db)).reservations, 0);
  });
});
void test('confirmation records demand without promising stock: distinct orders may observe the same unreserved kg', async () => {
  await withDatabase(async (db) => {
    const p = await prepared(db);
    completed(await p.h.run(p.record, p.people.actor), 'accepted');
    completed(await p.h.run(p.confirm, p.people.actor), 'accepted');
    const second = salesCommand(p.people.customerId);
    completed(await p.h.run(second, p.people.second), 'accepted');
    completed(await p.h.run(follow(second, 'SubmitSalesOrder'), p.people.second), 'accepted');
    const assessment = {
      ...follow(second, 'DraftFulfillmentAssessment', { orderId: second.target.id }),
      target: { kind: 'fulfillment-assessment', id: randomUUID() },
    };
    completed(await p.h.run(assessment, p.people.second), 'accepted');
    completed(
      await p.h.run(
        follow(assessment, 'RecordFulfillmentStock', {
          selections: [{ itemId: itemId(second), unitIds: [p.stock.unitId] }],
        }),
        p.people.second,
      ),
      'accepted',
    );
    completed(
      await p.h.run(
        follow(second, 'ConfirmSalesOrder', { assessmentId: assessment.target.id }),
        p.people.second,
      ),
      'accepted',
    );
    assert.equal((await salesCounts(db)).orders, 2);
    assert.equal((await salesCounts(db)).movements, 1);
    assert.equal((await salesCounts(db)).reservations, 0);
    assert.deepEqual(
      (await db.owner.query('SELECT on_hand::text,reserved::text FROM inventory.balance')).rows,
      [{ on_hand: '11', reserved: '0' }],
    );
  });
});

void test('multi-item stock evidence sums distinct selected Units without writing stock or reserving it', async () => {
  await withDatabase(async (db) => {
    const people = await salesPeople(db),
      h = salesHarness(db, people.identity),
      warehouse = await operators(db),
      wh = await warehouse.actor(),
      receipts = receiptHarness(db, warehouse.identity);
    const units: string[] = [];
    for (const kg of ['2', '3', '7']) {
      const input = receiptCommand();
      const posted = completed(
        await receipts.run({ ...input, payload: { ...input.payload, measuredKg: kg } }, wh),
        'accepted',
      );
      const data = (posted.result as StableAcceptedResult).data;
      assert.ok(data && typeof data.unitId === 'string');
      units.push(data.unitId);
    }
    const first = randomUUID(),
      second = randomUUID();
    const draft = salesCommand(people.customerId, {
      payload: {
        customerId: people.customerId,
        items: [
          {
            id: first,
            type: 'COIL',
            description: 'First specification',
            demandedKg: '5',
            allowPartialShipment: false,
          },
          {
            id: second,
            type: 'COIL',
            description: 'Second specification',
            demandedKg: '7',
            allowPartialShipment: true,
          },
        ],
      },
    });
    completed(await h.run(draft, people.actor), 'accepted');
    completed(await h.run(follow(draft, 'SubmitSalesOrder'), people.actor), 'accepted');
    const assessment = {
      ...follow(draft, 'DraftFulfillmentAssessment', { orderId: draft.target.id }),
      target: { kind: 'fulfillment-assessment', id: randomUUID() },
    };
    completed(await h.run(assessment, people.actor), 'accepted');
    const record = follow(assessment, 'RecordFulfillmentStock', {
      selections: [
        { itemId: second, unitIds: [units[2]!] },
        { itemId: first, unitIds: [units[1]!, units[0]!] },
      ],
    });
    completed(await h.run(record, people.actor), 'accepted');
    completed(
      await h.run(
        follow(draft, 'ConfirmSalesOrder', { assessmentId: assessment.target.id }),
        people.actor,
      ),
      'accepted',
    );
    const saved = await salesRead(db, people.actor, record, (ctx) =>
      h.service.getAssessment(ctx, assessment.target.id),
    );
    assert.equal(saved?.stock?.length, 3);
    assert.equal(saved?.selections?.length, 2);
    assert.equal((await salesCounts(db)).movements, 3);
    assert.equal((await salesCounts(db)).reservations, 0);
    assert.deepEqual(
      (await db.owner.query('SELECT on_hand::text AS kg FROM inventory.balance ORDER BY on_hand'))
        .rows,
      [{ kg: '2' }, { kg: '3' }, { kg: '7' }],
    );
  });
});
