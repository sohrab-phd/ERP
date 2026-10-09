import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { BusinessRejection, isJsonObject, type ExecutionContext } from '@navard/shared-kernel';
import { withDatabase } from '../support/database-fixture.js';
import { completed } from '../support/receipt-harness.js';
import { balance } from '../support/reservation-harness.js';
import { salesCommand, follow } from '../support/sales-harness.js';
import {
  productionApp,
  productionCommand,
  productionCounts,
} from '../support/production-harness.js';
const actorDenied = (error: unknown) =>
  error instanceof BusinessRejection && error.rejection.family === 'GUARD_ACTOR';

void test('Production rejects copied or caller-fabricated contexts before command/query/replay disclosure', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare(),
        c = h.complete(p.ops[0]!, p.source),
        before = await productionCounts(db);
      for (const actor of [
        Object.freeze({ ...h.operator }),
        Object.freeze({
          ...h.operator,
          principal: Object.freeze({ ...h.operator.principal, subject: randomUUID() }),
        }),
        Object.freeze({ ...h.foreign, customerScope: h.people.customerId }),
      ] as ExecutionContext[]) {
        assert.equal((await h.run(c.input, actor)).status, 'admission-denied');
        await assert.rejects(
          h.app.productionQuery('GetProductionOrder', p.orderId, actor),
          actorDenied,
        );
      }
      assert.deepEqual(await productionCounts(db), { ...before, audits: before.audits + 3 });
      assert.deepEqual(await balance(db, p.source), { on_hand: '110', reserved: '0' });
      completed(await h.run(c.input), 'accepted');
      const accepted = await productionCounts(db);
      assert.equal(
        (await h.run(c.input, Object.freeze({ ...h.operator }))).status,
        'admission-denied',
      );
      assert.deepEqual(await productionCounts(db), { ...accepted, audits: accepted.audits + 1 });
    } finally {
      await h.app.stop();
    }
  }));

void test('current individual cannot directly post IPS effects or start MAKE outside the private owner release/completion admission', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare(),
        c = h.complete(p.ops[0]!, p.source),
        before = await productionCounts(db);
      const tx = await db.transactions.begin();
      try {
        await assert.rejects(
          h.app.inventory.post({ actor: h.operator, request: c.input, transaction: tx.context }, [
            {
              type: 'STOCK_OUT',
              unitId: p.source,
              kg: '110',
              nextState: 'CONSUMED',
              source: { factId: randomUUID(), effectId: randomUUID() },
            },
          ]),
          actorDenied,
        );
      } finally {
        await tx.rollback();
        await tx.release();
      }
      assert.deepEqual(await productionCounts(db), before);
      assert.deepEqual(await balance(db, p.source), { on_hand: '110', reserved: '0' });
      const demand = await h.demand(),
        orderId = randomUUID(),
        release = productionCommand('ReleaseProductionOrder', orderId);
      const salesTx = await db.transactions.begin();
      try {
        await assert.rejects(
          h.app.sales.startMake(
            { actor: h.planner, request: release, transaction: salesTx.context },
            demand.salesOrderId,
            orderId,
            demand.itemId,
          ),
          actorDenied,
        );
      } finally {
        await salesTx.rollback();
        await salesTx.release();
      }
      assert.equal(
        (
          await db.owner.query<{ state: string }>(
            'SELECT state FROM sales.sales_order WHERE order_id=$1',
            [demand.salesOrderId],
          )
        ).rows[0]?.state,
        'CONFIRMED',
      );
      assert.equal(
        (
          await db.owner.query('SELECT 1 FROM sales.make_reference WHERE production_order_id=$1', [
            orderId,
          ])
        ).rowCount,
        0,
      );
    } finally {
      await h.app.stop();
    }
  }));

void test('foreign customer cannot read Production resources, change operations, or disclose accepted outcomes by replay', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare(),
        c = h.complete(p.ops[0]!, p.source),
        before = await productionCounts(db);
      for (const [kind, id] of [
        ['GetProductionOrder', p.orderId],
        ['GetOperation', p.ops[0]!],
        ['GetAllocation', p.allocationId],
      ] as const)
        assert.equal(await h.app.productionQuery(kind, id, h.foreign), undefined);
      assert.equal(
        (await h.run({ ...c.input, idempotency_key: randomUUID() }, h.foreign)).status,
        'admission-denied',
      );
      assert.equal((await productionCounts(db)).facts, before.facts);
      assert.equal((await productionCounts(db)).ledger, before.ledger);
      completed(await h.run(c.input), 'accepted');
      const accepted = await productionCounts(db);
      assert.equal((await h.run(c.input, h.foreign)).status, 'admission-denied');
      assert.equal((await h.run(c.input, h.other)).status, 'conflict');
      assert.deepEqual(await productionCounts(db), { ...accepted, audits: accepted.audits + 2 });
    } finally {
      await h.app.stop();
    }
  }));

void test('revoking managerial disposition prevents leftover completion and accepted replay without revoking ordinary operator work', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const first = await h.prepare(),
        accepted = h.complete(first.ops[0]!, first.source, '110', '100', { scrap: '10' });
      completed(await h.run(accepted.input, h.manager), 'accepted');
      await db.owner.query(
        "UPDATE identity.role_grant SET production_disposition=false WHERE actor_role='ACT-PLAN' AND account_id=(SELECT account_id FROM identity.account WHERE username='sales.manager')",
      );
      const before = await productionCounts(db);
      assert.equal((await h.run(accepted.input, h.manager)).status, 'admission-denied');
      assert.deepEqual(await productionCounts(db), { ...before, audits: before.audits + 1 });
      const next = await h.prepare(),
        refused = h.complete(next.ops[0]!, next.source, '110', '100', { scrap: '10' }),
        nextBefore = await productionCounts(db);
      assert.equal((await h.run(refused.input, h.manager)).status, 'admission-denied');
      assert.deepEqual(await productionCounts(db), {
        ...nextBefore,
        audits: nextBefore.audits + 1,
      });
      completed(await h.run(h.complete(next.ops[0]!, next.source).input, h.manager), 'accepted');
      const third = await h.prepare(),
        thirdCommand = h.complete(third.ops[0]!, third.source);
      await db.owner.query(
        "DELETE FROM identity.role_grant WHERE actor_role='ACT-OP' AND account_id=(SELECT account_id FROM identity.account WHERE username='sales.operator')",
      );
      assert.equal((await h.run(thirdCommand.input, h.operator)).status, 'admission-denied');
      await assert.rejects(
        h.app.productionQuery('GetProductionOrder', third.orderId, h.operator),
        actorDenied,
      );
      assert.deepEqual(await balance(db, third.source), { on_hand: '110', reserved: '0' });
    } finally {
      await h.app.stop();
    }
  }));

void test('Production HTTP uses current individual customer grants and rejects IDOR, browser origin, role claims and unsafe payloads', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare(),
        c = h.complete(p.ops[0]!, p.source),
        before = await productionCounts(db);
      await h.app.start();
      const address = h.app.server.address();
      assert.ok(address && typeof address !== 'string');
      const base = 'http://127.0.0.1:' + address.port;
      const headers = {
        authorization: 'Bearer ' + h.people.tokens.get('operator')!,
        'x-customer-id': h.people.customerId,
      };
      const call = (path: string, body?: unknown, extra: Record<string, string> = {}) =>
        fetch(base + path, {
          method: body === undefined ? 'GET' : 'POST',
          headers: {
            ...headers,
            ...(body === undefined ? {} : { 'content-type': 'application/json' }),
            ...extra,
          },
          ...(body === undefined
            ? {}
            : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
        });
      const read = await call('/production/orders/' + p.orderId);
      assert.equal(read.status, 200);
      const readBody = (await read.json()) as { data: Record<string, unknown> };
      assert.ok(!('orderBinding' in readBody.data));
      assert.equal(read.headers.get('cache-control'), 'no-store');
      assert.equal(read.headers.get('x-content-type-options'), 'nosniff');
      const foreign = {
        authorization: 'Bearer ' + h.people.tokens.get('foreign-op')!,
        'x-customer-id': h.people.otherCustomerId,
      };
      assert.equal((await call('/production/orders/' + p.orderId, undefined, foreign)).status, 404);
      assert.equal(
        (await call('/production/commands', { ...c.input, idempotency_key: randomUUID() }, foreign))
          .status,
        403,
      );
      assert.equal(
        (await call('/production/commands', c.input, { origin: 'https://untrusted.invalid' }))
          .status,
        403,
      );
      assert.equal(
        (await call('/production/commands', c.input, { 'x-erp-role': 'ACT-PLAN' })).status,
        403,
      );
      assert.equal(
        (await call('/production/commands', c.input, { authorization: 'Bearer invalid' })).status,
        401,
      );
      assert.equal((await call('/production/commands', 'x'.repeat(4097))).status, 400);
      assert.equal(
        (
          await call('/production/commands', {
            ...c.input,
            payload: { ...c.input.payload, managerApproved: true },
          })
        ).status,
        400,
      );
      const duplicate = JSON.stringify(c.input).replace('"inputs":', '"inputs":[],"inputs":');
      assert.equal((await call('/production/commands', duplicate)).status, 400);
      assert.equal((await productionCounts(db)).facts, before.facts);
      assert.equal((await productionCounts(db)).ledger, before.ledger);
      assert.equal((await call('/production/commands', c.input)).status, 200);
      const replay = await call('/production/commands', c.input);
      assert.equal(replay.status, 200);
      assert.equal(((await replay.json()) as { replayed: boolean }).replayed, true);
    } finally {
      await h.app.stop();
    }
  }));

void test('public Production order results, queries and replay omit internal Sales binding and unrelated line descriptions', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const itemId = randomUUID(),
        secret = 'Unrelated commercial line must stay within Sales';
      const draft = salesCommand(h.people.customerId);
      const sales = {
        ...draft,
        payload: {
          ...draft.payload,
          items: [
            {
              id: itemId,
              type: 'SHEET',
              description: 'Factory selected line',
              demandedKg: '110',
              allowPartialShipment: true,
            },
            {
              id: randomUUID(),
              type: 'COIL',
              description: secret,
              demandedKg: '7',
              allowPartialShipment: false,
            },
          ],
        },
      };
      completed(await h.salesRun(sales), 'accepted');
      completed(await h.salesRun(follow(sales, 'SubmitSalesOrder')), 'accepted');
      const assessment = {
        ...follow(sales, 'DraftFulfillmentAssessment', { orderId: sales.target.id }),
        target: { kind: 'fulfillment-assessment', id: randomUUID() },
      };
      completed(await h.salesRun(assessment), 'accepted');
      completed(await h.salesRun(follow(assessment, 'RecordFulfillmentMake')), 'accepted');
      completed(
        await h.salesRun(
          follow(sales, 'ConfirmSalesOrder', { assessmentId: assessment.target.id }),
        ),
        'accepted',
      );
      const orderId = randomUUID(),
        input = productionCommand('DraftProductionOrder', orderId, {
          salesOrderId: sales.target.id,
          itemId,
        });
      const accepted = completed(await h.run(input), 'accepted');
      assert.ok(accepted.result.data && isJsonObject(accepted.result.data));
      assert.ok(!('orderBinding' in accepted.result.data));
      assert.ok(!JSON.stringify(accepted.result).includes(secret));
      const stored = (
        await db.owner.query<{ binding: string }>(
          "SELECT record->>'orderBinding' AS binding FROM production.production_order WHERE order_id=$1",
          [orderId],
        )
      ).rows[0];
      assert.ok(stored?.binding.includes(secret));
      const query = await h.app.productionQuery('GetProductionOrder', orderId, h.operator);
      assert.ok(query);
      assert.ok(!('orderBinding' in query));
      assert.ok(!JSON.stringify(query).includes(secret));
      const replay = completed(await h.run(input), 'accepted');
      assert.equal(replay.replayed, true);
      assert.deepEqual(replay.result, accepted.result);
    } finally {
      await h.app.stop();
    }
  }));
