import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import { withDatabase } from '../support/database-fixture.js';
import { completed } from '../support/receipt-harness.js';
import { follow } from '../support/sales-harness.js';
import { balance } from '../support/reservation-harness.js';
import { shippingApp, shippingCommand, shippingCounts } from '../support/shipping-harness.js';
async function http(h: Awaited<ReturnType<typeof shippingApp>>) {
  await h.app.start();
  const address = h.app.server.address();
  assert.ok(address && typeof address !== 'string');
  const base = 'http://127.0.0.1:' + address.port;
  const headers = {
    authorization: 'Bearer ' + h.people.tokens.get('ship-first')!,
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
  return { base, call, headers };
}
void test('shipment HTTP lifecycle and scoped evidence query uses individual ACT-SHIP without finance or delivery prerequisites', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const { call } = await http(h),
        unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit);
      const pack = shippingCommand('DraftPackage', 'package', {
        orderId: order.orderId,
        reservationIds: [claim.target.id],
      });
      assert.equal((await call('/shipping/commands', pack)).status, 200);
      const replay = await call('/shipping/commands', pack);
      assert.equal(replay.status, 200);
      assert.equal(((await replay.json()) as { replayed: boolean }).replayed, true);
      assert.equal((await call('/shipping/commands', follow(pack, 'PackPackage'))).status, 200);
      const shipment = shippingCommand('DraftShipment', 'shipment', { orderId: order.orderId });
      assert.equal((await call('/shipping/commands', shipment)).status, 200);
      assert.equal(
        (
          await call(
            '/shipping/commands',
            follow(pack, 'AssignPackageToShipment', { shipmentId: shipment.target.id }),
          )
        ).status,
        200,
      );
      for (const command of ['MarkShipmentReady', 'StartLoading', 'DispatchShipment'])
        assert.equal((await call('/shipping/commands', follow(shipment, command))).status, 200);
      const read = await call('/shipping/shipments/' + shipment.target.id);
      assert.equal(read.status, 200);
      const data = ((await read.json()) as { data: Record<string, unknown> }).data;
      assert.equal(data.state, 'DISPATCHED');
      assert.equal(data.orderId, order.orderId);
      assert.ok(!('binding' in data) && !('orderBinding' in data));
      assert.ok(!('password' in data) && !('token' in data));
      assert.equal(read.headers.get('cache-control'), 'no-store');
      assert.equal(read.headers.get('x-content-type-options'), 'nosniff');
      const p = await call('/shipping/packages/' + pack.target.id);
      assert.equal(p.status, 200);
      assert.equal(
        ((await p.json()) as { data: { state: string } }).data.state,
        'ASSIGNED_TO_SHIPMENT',
      );
      assert.deepEqual(await balance(db, unit), { on_hand: '0', reserved: '0' });
      assert.equal(
        (await call('/shipping/commands', shippingCommand('ConfirmDelivery', 'shipment'))).status,
        400,
      );
      assert.equal(
        (
          await db.owner.query<{ state: string }>(
            'SELECT state FROM sales.sales_order WHERE order_id=$1',
            [order.orderId],
          )
        ).rows[0]?.state,
        'CONFIRMED',
      );
    } finally {
      await h.app.stop();
    }
  });
});
void test('shipment HTTP rejects cross-customer IDOR/replay and wrong Warehouse/Sales roles', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const { call } = await http(h),
        unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit),
        ready = await h.ready(order.orderId, [claim.target.id]);
      const foreign = {
        authorization: 'Bearer ' + h.people.tokens.get('ship-foreign')!,
        'x-customer-id': h.people.otherCustomerId,
      };
      assert.equal(
        (await call('/shipping/packages/' + ready.pack.target.id, undefined, foreign)).status,
        404,
      );
      assert.equal(
        (await call('/shipping/shipments/' + ready.shipment.target.id, undefined, foreign)).status,
        404,
      );
      assert.equal(
        (await call('/shipping/shipments/' + randomUUID(), undefined, foreign)).status,
        404,
      );
      assert.equal((await call('/shipping/commands', ready.dispatch, foreign)).status, 403);
      assert.equal((await call('/shipping/commands', ready.pack, foreign)).status, 409);
      for (const headers of [
        { authorization: 'Bearer ' + h.warehouse.tokens.get('ACT-WH')!, 'x-erp-role': 'ACT-WH' },
        { authorization: 'Bearer ' + h.people.tokens.get('first')!, 'x-erp-role': 'ACT-SALES' },
      ]) {
        assert.equal((await call('/shipping/commands', ready.dispatch, headers)).status, 403);
        assert.equal(
          (await call('/shipping/shipments/' + ready.shipment.target.id, undefined, headers))
            .status,
          403,
        );
      }
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '11' });
    } finally {
      await h.app.stop();
    }
  });
});
void test('shipment HTTP enforces current grant and cannot disclose accepted replay after role revocation', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const { call } = await http(h),
        unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit),
        ready = await h.ready(order.orderId, [claim.target.id]);
      completed(await h.run(ready.dispatch), 'accepted');
      const before = await shippingCounts(db);
      await db.owner.query(
        "DELETE FROM identity.role_grant WHERE account_id=(SELECT account_id FROM identity.account WHERE username='sales.ship-first')",
      );
      assert.equal((await call('/shipping/commands', ready.dispatch)).status, 403);
      assert.equal((await call('/shipping/shipments/' + ready.shipment.target.id)).status, 403);
      const after = await shippingCounts(db);
      assert.equal(after.movements, before.movements);
      assert.equal(after.outcomes, before.outcomes);
    } finally {
      await h.app.stop();
    }
  });
});
void test('shipment transport rejects unknown/duplicate fields, oversized input, unsupported role and browser origin', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const { call } = await http(h),
        unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit),
        input = shippingCommand('DraftPackage', 'package', {
          orderId: order.orderId,
          reservationIds: [claim.target.id],
        }),
        before = await shippingCounts(db);
      assert.equal(
        (
          await call('/shipping/commands', {
            ...input,
            payload: { ...input.payload, override: true },
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await call(
            '/shipping/commands',
            JSON.stringify(input).replace(
              '"orderId":',
              '"orderId":"' + randomUUID() + '","orderId":',
            ),
          )
        ).status,
        400,
      );
      assert.equal((await call('/shipping/commands', 'x'.repeat(4097))).status, 400);
      assert.equal(
        (await call('/shipping/commands', input, { origin: 'https://untrusted.invalid' })).status,
        403,
      );
      assert.equal(
        (await call('/shipping/commands', input, { 'x-erp-role': 'ACT-SEC' })).status,
        403,
      );
      assert.equal(
        (await call('/shipping/commands', input, { authorization: 'Bearer invalid' })).status,
        401,
      );
      const after = await shippingCounts(db);
      assert.equal(after.outcomes, before.outcomes);
      assert.equal(after.movements, before.movements);
    } finally {
      await h.app.stop();
    }
  });
});
void test('shipment HTTP duplicate customer header cannot substitute customer selection', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const { base, headers } = await http(h),
        unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit),
        input = shippingCommand('DraftPackage', 'package', {
          orderId: order.orderId,
          reservationIds: [claim.target.id],
        }),
        body = JSON.stringify(input);
      const status = await new Promise<number>((resolve, reject) => {
        const req = httpRequest(
          base + '/shipping/commands',
          {
            method: 'POST',
            headers: [
              'host',
              new URL(base).host,
              'authorization',
              headers.authorization,
              'x-customer-id',
              h.people.customerId,
              'x-customer-id',
              h.people.otherCustomerId,
              'content-type',
              'application/json',
              'content-length',
              String(Buffer.byteLength(body)),
            ],
          },
          (res) => {
            res.resume();
            res.on('end', () => resolve(res.statusCode!));
          },
        );
        req.on('error', reject);
        req.end(body);
      });
      assert.equal(status, 403);
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '11' });
    } finally {
      await h.app.stop();
    }
  });
});
