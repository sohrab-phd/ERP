import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import { withDatabase } from '../support/database-fixture.js';
import { completed, installation } from '../support/receipt-harness.js';
import { follow } from '../support/sales-harness.js';
import {
  reservationApp,
  reservationCommand,
  activate,
  balance,
  reservationCounts,
} from '../support/reservation-harness.js';

async function http(h: Awaited<ReturnType<typeof reservationApp>>) {
  await h.app.start();
  const address = h.app.server.address();
  assert.ok(address && typeof address !== 'string');
  const base = 'http://127.0.0.1:' + address.port;
  const call = (path: string, body?: unknown, headers: Record<string, string> = {}) =>
    fetch(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        authorization: 'Bearer ' + h.people.tokens.get('first')!,
        'x-customer-id': h.people.customerId,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        ...headers,
      },
      ...(body === undefined
        ? {}
        : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
    });
  return { base, call };
}
void test('reservation HTTP requests, scoped queries and Sales activation preserve durable replay and one quantity effect', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const { call } = await http(h),
        unit = await h.stock(),
        order = await h.order([unit]),
        input = reservationCommand(order.orderId, order.itemId, unit);
      assert.equal((await call('/reservations/commands', input)).status, 200);
      const replay = await call('/reservations/commands', input);
      assert.equal(replay.status, 200);
      assert.equal(((await replay.json()) as { replayed: boolean }).replayed, true);
      const read = await call('/reservations/' + input.target.id);
      assert.equal(read.status, 200);
      const data = ((await read.json()) as { data: Record<string, unknown> }).data;
      assert.equal(data.state, 'REQUESTED');
      assert.ok(!('binding' in data) && !('orderBinding' in data));
      const activation = activate(input);
      assert.equal((await call('/reservations/commands', activation)).status, 200);
      assert.equal((await call('/reservations/commands', activation)).status, 200);
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '5' });
      assert.equal((await reservationCounts(db)).active, 1);
    } finally {
      await h.app.stop();
    }
  });
});
void test('Warehouse HTTP may activate organization stock but not read commercial reservations but cannot request or forge a customer selector', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const { base } = await http(h),
        unit = await h.stock(),
        order = await h.order([unit]),
        input = reservationCommand(order.orderId, order.itemId, unit);
      completed(await h.run(input), 'accepted');
      const headers = {
        authorization: 'Bearer ' + h.warehouse.tokens.get('ACT-WH')!,
        'x-erp-role': 'ACT-WH',
        'content-type': 'application/json',
      };
      const call = (body: unknown, extra: Record<string, string> = {}) =>
        fetch(base + '/reservations/commands', {
          method: 'POST',
          headers: { ...headers, ...extra },
          body: JSON.stringify(body),
        });
      assert.equal((await call(reservationCommand(order.orderId, order.itemId, unit))).status, 403);
      assert.equal(
        (await call(activate(input), { 'x-customer-id': h.people.customerId })).status,
        403,
      );
      assert.equal((await call(activate(input))).status, 200);
      assert.equal(
        (await fetch(base + '/reservations/' + input.target.id, { headers })).status,
        403,
      );
    } finally {
      await h.app.stop();
    }
  });
});
void test('reservation HTTP rejects foreign object reads, customer-switch replay, invented roles and customer writes', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const { call } = await http(h),
        unit = await h.stock(),
        order = await h.order([unit]),
        input = reservationCommand(order.orderId, order.itemId, unit);
      completed(await h.run(input), 'accepted');
      const foreign = {
        authorization: 'Bearer ' + h.people.tokens.get('foreign')!,
        'x-customer-id': h.people.otherCustomerId,
      };
      assert.equal(
        (await call('/reservations/' + input.target.id, undefined, foreign)).status,
        404,
      );
      assert.equal((await call('/reservations/' + randomUUID(), undefined, foreign)).status, 404);
      assert.equal((await call('/reservations/commands', activate(input), foreign)).status, 403);
      assert.equal((await call('/reservations/commands', input, foreign)).status, 409);
      assert.equal(
        (await call('/reservations/commands', input, { 'x-erp-role': 'ACT-SEC' })).status,
        403,
      );
      assert.equal(
        (await call('/reservations/commands', input, { origin: 'https://untrusted.invalid' }))
          .status,
        403,
      );
      assert.equal(
        (await call('/reservations/commands', { ...input, command: 'ReleaseReservation' })).status,
        400,
      );
      const count = await reservationCounts(db);
      assert.equal(count.requests, 1);
      assert.equal(count.active, 0);
    } finally {
      await h.app.stop();
    }
  });
});
void test('reservation transport is bounded, duplicate-safe and cannot override server-derived identity', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const { base, call } = await http(h),
        unit = await h.stock(),
        order = await h.order([unit]),
        input = reservationCommand(order.orderId, order.itemId, unit);
      assert.equal(
        (
          await call(
            '/reservations/commands',
            JSON.stringify(input).replace('"kg":"5"', '"kg":"5","kg":"4"'),
          )
        ).status,
        400,
      );
      assert.equal((await call('/reservations/commands', 'x'.repeat(4097))).status, 400);
      assert.equal(
        (await call('/reservations/commands', input, { authorization: 'Bearer invalid' })).status,
        401,
      );
      const status = await new Promise<number>((resolve, reject) => {
        const req = httpRequest(
          base + '/reservations/commands',
          {
            method: 'POST',
            headers: [
              'host',
              new URL(base).host,
              'authorization',
              'Bearer ' + h.people.tokens.get('first')!,
              'x-customer-id',
              h.people.customerId,
              'x-customer-id',
              h.people.customerId,
              'content-type',
              'application/json',
              'content-length',
              String(Buffer.byteLength(JSON.stringify(input))),
            ],
          },
          (response) => {
            response.resume();
            response.on('end', () => resolve(response.statusCode!));
          },
        );
        req.on('error', reject);
        req.end(JSON.stringify(input));
      });
      assert.equal(status, 403);
      assert.equal((await reservationCounts(db)).requests, 0);
    } finally {
      await h.app.stop();
    }
  });
});
void test('current revoked Sales grant cannot read or replay a previous reservation HTTP result', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const { call } = await http(h),
        unit = await h.stock(),
        order = await h.order([unit]),
        input = reservationCommand(order.orderId, order.itemId, unit);
      completed(await h.run(input), 'accepted');
      const before = await reservationCounts(db);
      await db.owner.query(
        "DELETE FROM identity.role_grant WHERE account_id=(SELECT account_id FROM identity.account WHERE username='sales.first')",
      );
      assert.equal((await call('/reservations/' + input.target.id)).status, 403);
      assert.equal((await call('/reservations/commands', input)).status, 403);
      assert.deepEqual(await reservationCounts(db), before);
    } finally {
      await h.app.stop();
    }
  });
});

void test('reserved organization-stock queries require owning customer isolation; Warehouse action is not a commercial read grant', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const { base, call } = await http(h),
        unit = await h.stock(),
        order = await h.order([unit]),
        input = reservationCommand(order.orderId, order.itemId, unit);
      completed(await h.run(input), 'accepted');
      completed(await h.run(activate(input), h.wh), 'accepted');
      const headers = { authorization: 'Bearer ' + h.warehouse.tokens.get('ACT-WH')! };
      assert.equal((await fetch(base + '/inventory/units/' + unit, { headers })).status, 403);
      const lot = (
        await db.owner.query<{ lot_id: string }>(
          'SELECT lot_id FROM inventory.unit WHERE unit_id=$1',
          [unit],
        )
      ).rows[0]!.lot_id;
      assert.equal((await fetch(base + '/inventory/lots/' + lot, { headers })).status, 403);
      // Create a real draft/assessment; no fixture bypass of authorization/state is used.
      const draft = {
        command: 'DraftSalesOrder',
        contract_version: 1,
        idempotency_key: randomUUID(),
        target: { kind: 'sales-order', id: randomUUID() },
        payload: {
          customerId: h.people.otherCustomerId,
          items: [
            {
              id: randomUUID(),
              type: 'COIL',
              description: 'Synthetic isolated demand',
              demandedKg: '1',
              allowPartialShipment: false,
            },
          ],
        },
        preconditions: {},
      };
      const foreign = {
        authorization: 'Bearer ' + h.people.tokens.get('foreign')!,
        'x-customer-id': h.people.otherCustomerId,
      };
      assert.equal((await call('/sales/commands', draft, foreign)).status, 200);
      const assessment = {
        ...draft,
        command: 'DraftFulfillmentAssessment',
        idempotency_key: randomUUID(),
        target: { kind: 'fulfillment-assessment', id: randomUUID() },
        payload: { orderId: draft.target.id },
      };
      assert.equal((await call('/sales/commands', assessment, foreign)).status, 200);
      const itemId = draft.payload.items[0]!.id;
      const record = {
        ...assessment,
        command: 'RecordFulfillmentStock',
        idempotency_key: randomUUID(),
        payload: { selections: [{ itemId, unitIds: [unit] }] },
      };
      const denied = await call('/sales/commands', record, foreign);
      assert.equal(denied.status, 422);
      const body = JSON.stringify(await denied.json());
      assert.ok(!body.includes(order.orderId) && !body.includes(h.people.customerId));
    } finally {
      await h.app.stop();
    }
  });
});

void test('commercial priority uses exact PostgreSQL microseconds before UUID tie breaking', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const unit = await h.stock(),
        a = await h.order([unit]),
        b = await h.order([unit], { actor: h.second });
      const [late, early] = [a, b].sort((x, y) => (x.orderId < y.orderId ? -1 : 1));
      assert.ok(early && late);
      const owner = await db.owner.connect();
      try {
        await owner.query('BEGIN');
        await owner.query('ALTER TABLE sales.sales_order DISABLE TRIGGER order_transition');
        await owner.query('UPDATE sales.sales_order SET confirmed_at=$2 WHERE order_id=$1', [
          early.orderId,
          '2026-10-08T10:00:00.123456Z',
        ]);
        await owner.query('UPDATE sales.sales_order SET confirmed_at=$2 WHERE order_id=$1', [
          late.orderId,
          '2026-10-08T10:00:00.123457Z',
        ]);
        await owner.query('ALTER TABLE sales.sales_order ENABLE TRIGGER order_transition');
        await owner.query('COMMIT');
      } catch (error) {
        await owner.query('ROLLBACK');
        throw error;
      } finally {
        owner.release();
      }
      const later = reservationCommand(late.orderId, late.itemId, unit),
        earlier = reservationCommand(early.orderId, early.itemId, unit);
      completed(await h.run(later, late.actor), 'accepted');
      completed(await h.run(activate(later), late.actor), 'rejected', 'GUARD_CONFLICT');
      completed(await h.run(earlier, early.actor), 'accepted');
      completed(await h.run(activate(earlier), early.actor), 'accepted');
      assert.equal(
        (await db.owner.query<{ demand_id: string }>('SELECT demand_id FROM inventory.reservation'))
          .rows[0]!.demand_id,
        early.orderId,
      );
    } finally {
      await h.app.stop();
    }
  });
});
void test('confirmation waits for the same Unit resource and cannot validate stale available stock during activation', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    const blocker = await db.owner.connect();
    try {
      const unit = await h.stock(),
        first = await h.order([unit]),
        other = await h.order([unit], { actor: h.second, confirmed: false }),
        input = reservationCommand(first.orderId, first.itemId, unit);
      completed(await h.run(input), 'accepted');
      await blocker.query('BEGIN');
      await blocker.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [
        JSON.stringify(['inventory', installation, installation, 'unit', unit]),
      ]);
      const waiting = async (n: number) => {
        const deadline = Date.now() + 5000;
        while (Date.now() < deadline) {
          const rows = await db.owner.query<{ count: number }>(
            "SELECT count(*)::int AS count FROM pg_locks WHERE locktype='advisory' AND NOT granted AND database=(SELECT oid FROM pg_database WHERE datname=current_database())",
          );
          if (rows.rows[0]!.count >= n) return;
          await new Promise((resolve) => setTimeout(resolve, 20));
        }
        throw new Error('Expected controlled Unit-lock wait');
      };
      const activation = h.run(activate(input));
      await waiting(1);
      const confirmation = h.run(
        follow(other.input, 'ConfirmSalesOrder', { assessmentId: other.assessmentId }),
        h.second,
      );
      await waiting(2);
      await blocker.query('COMMIT');
      completed(await activation, 'accepted');
      completed(await confirmation, 'rejected', 'GUARD_INVARIANT');
      assert.equal(
        (
          await db.owner.query<{ state: string }>(
            'SELECT state FROM sales.sales_order WHERE order_id=$1',
            [other.orderId],
          )
        ).rows[0]!.state,
        'SUBMITTED',
      );
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '5' });
    } finally {
      await blocker.query('ROLLBACK');
      blocker.release();
      await h.app.stop();
    }
  });
});
