import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { BusinessRejection, CommandRegistry, executeCommand } from '@navard/shared-kernel';
import { shipmentEffectId } from '../../src/modules/inventory/index.js';
import { IdentityAuthorization } from '../../src/modules/identity/index.js';
import { PostgresTransactions } from '../../src/infrastructure/postgresql/transaction.js';
import { withDatabase } from '../support/database-fixture.js';
import { completed } from '../support/receipt-harness.js';
import { follow } from '../support/sales-harness.js';
import { activate, balance } from '../support/reservation-harness.js';
import { lostCommitProxy } from '../support/crash-child.js';
import { shippingApp, shippingCommand, shippingCounts } from '../support/shipping-harness.js';

void test('normal shipment consumes complete reserved Units through IPS with durable actor/kg evidence and atomic audit', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit);
      const ready = await h.ready(order.orderId, [claim.target.id]);
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '11' });
      const before = await shippingCounts(db);
      const accepted = completed(await h.run(ready.dispatch), 'accepted');
      assert.deepEqual(await balance(db, unit), { on_hand: '0', reserved: '0' });
      assert.equal(
        (
          await db.owner.query<{ state: string }>(
            'SELECT state FROM inventory.unit WHERE unit_id=$1',
            [unit],
          )
        ).rows[0]?.state,
        'SHIPPED',
      );
      assert.equal(
        (
          await db.owner.query<{ state: string }>(
            'SELECT state FROM inventory.reservation WHERE reservation_id=$1',
            [claim.target.id],
          )
        ).rows[0]?.state,
        'CONSUMED',
      );
      assert.equal(
        (
          await db.owner.query<{ state: string }>(
            'SELECT state FROM inventory.reservation_request WHERE reservation_id=$1',
            [claim.target.id],
          )
        ).rows[0]?.state,
        'CONSUMED',
      );
      const after = await shippingCounts(db);
      assert.equal(after.onHand, '0');
      assert.equal(after.reserved, '0');
      assert.equal(after.active, 0);
      assert.equal(after.outcomes, before.outcomes + 1);
      assert.equal(after.audits, before.audits + 1);
      const ledger = await db.owner.query<{
        on_hand_delta: string;
        reserved_delta: string;
        command: string;
        executor_actor: string;
      }>(
        'SELECT on_hand_delta::text,reserved_delta::text,command_id AS command,executor AS executor_actor FROM inventory.ledger WHERE unit_id=$1',
        [unit],
      );
      assert.equal(
        ledger.rows.reduce((kg, r) => kg + BigInt(r.on_hand_delta), 0n),
        0n,
      );
      assert.equal(
        ledger.rows.reduce((kg, r) => kg + BigInt(r.reserved_delta), 0n),
        0n,
      );
      assert.ok(ledger.rows.every((r) => r.executor_actor === 'ACT-IPS'));
      assert.ok(
        ledger.rows.some((r) => r.command === 'DispatchShipment' && r.on_hand_delta === '-11'),
      );
      const read = await h.app.shippingQuery('GetShipment', ready.shipment.target.id, h.ship);
      assert.ok(read);
      {
        const data = read as unknown as {
          state: string;
          orderId: string;
          customerId: string;
          entries: { unitId: string; kg: string }[];
          dispatchedAt: string;
          dispatchSubject: string;
        };
        assert.equal(data.state, 'DISPATCHED');
        assert.equal(data.orderId, order.orderId);
        assert.equal(data.customerId, h.people.customerId);
        assert.deepEqual(
          data.entries.map((e) => ({ unitId: e.unitId, kg: e.kg })),
          [{ unitId: unit, kg: '11' }],
        );
        assert.ok(data.dispatchedAt);
        assert.equal(data.dispatchSubject, h.ship.principal.subject);
      }
      assert.equal(
        (
          await db.owner.query<{ state: string }>(
            'SELECT state FROM sales.sales_order WHERE order_id=$1',
            [order.orderId],
          )
        ).rows[0]?.state,
        'CONFIRMED',
      );
      assert.equal(accepted.result.outcome, 'accepted');
    } finally {
      await h.app.stop();
    }
  });
});
void test('accepted shipment replay is byte-equivalent and new-key duplicate never posts another stock exit', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit),
        ready = await h.ready(order.orderId, [claim.target.id]);
      const first = completed(await h.run(ready.dispatch), 'accepted'),
        before = await shippingCounts(db);
      const replay = completed(await h.run(ready.dispatch), 'accepted');
      assert.equal(replay.replayed, true);
      assert.deepEqual(replay.result, first.result);
      completed(
        await h.run(follow(ready.dispatch, 'DispatchShipment')),
        'rejected',
        'GUARD_IDEMPOTENT_DUP',
      );
      const after = await shippingCounts(db);
      assert.equal(after.movements, before.movements);
      assert.equal(after.onHand, '0');
      assert.equal(after.active, 0);
      assert.equal(
        (await h.run({ ...ready.dispatch, target: { kind: 'shipment', id: randomUUID() } })).status,
        'admission-denied',
      );
      assert.equal(
        (await h.run({ ...ready.dispatch, payload: { invoiceState: 'PAID' } })).status,
        'admission-denied',
      );
      const secondShipment = shippingCommand('DraftShipment', 'shipment', {
        orderId: order.orderId,
      });
      completed(await h.run(secondShipment), 'accepted');
      assert.equal(
        (await h.run({ ...ready.dispatch, target: secondShipment.target })).status,
        'conflict',
      );
      assert.equal(
        (
          await h.run({
            ...ready.dispatch,
            command: 'DraftShipment',
            payload: { orderId: order.orderId },
          })
        ).status,
        'conflict',
      );
      assert.equal(
        (
          await h.run({
            ...ready.pack,
            payload: { orderId: order.orderId, reservationIds: [randomUUID()] },
          })
        ).status,
        'conflict',
      );
      assert.equal((await h.run(ready.dispatch, h.shipSecond)).status, 'conflict');
      assert.equal(
        (
          await db.owner.query<{ event_kind: string }>(
            "SELECT event_kind FROM kernel.audit_event WHERE event_kind='AUD-CMD-REPLAYED'",
          )
        ).rows.length,
        1,
      );
    } finally {
      await h.app.stop();
    }
  });
});
void test('same-key rejected premature dispatch stays durable after shipment reaches LOADING; new key may proceed', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit);
      const shipment = shippingCommand('DraftShipment', 'shipment', { orderId: order.orderId });
      completed(await h.run(shipment), 'accepted');
      const premature = follow(shipment, 'DispatchShipment'),
        first = completed(await h.run(premature), 'rejected', 'GUARD_STATE');
      const pack = shippingCommand('DraftPackage', 'package', {
        orderId: order.orderId,
        reservationIds: [claim.target.id],
      });
      completed(await h.run(pack), 'accepted');
      completed(await h.run(follow(pack, 'PackPackage')), 'accepted');
      completed(
        await h.run(follow(pack, 'AssignPackageToShipment', { shipmentId: shipment.target.id })),
        'accepted',
      );
      completed(await h.run(follow(shipment, 'MarkShipmentReady')), 'accepted');
      completed(await h.run(follow(shipment, 'StartLoading')), 'accepted');
      const replay = completed(await h.run(premature), 'rejected', 'GUARD_STATE');
      assert.equal(replay.replayed, true);
      assert.deepEqual(replay.result, first.result);
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '11' });
      completed(await h.run(follow(shipment, 'DispatchShipment')), 'accepted');
    } finally {
      await h.app.stop();
    }
  });
});
void test('whole-Unit partial shipments require explicit line permission and preserve valid remainder', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const one = await h.stock('5'),
        two = await h.stock('6'),
        order = await h.order([one, two], { partial: true }),
        a = await h.claim(order.orderId, order.itemId, one, '5'),
        b = await h.claim(order.orderId, order.itemId, two, '6');
      const first = await h.ready(order.orderId, [a.target.id]);
      completed(await h.run(first.dispatch), 'accepted');
      assert.deepEqual(await balance(db, one), { on_hand: '0', reserved: '0' });
      assert.deepEqual(await balance(db, two), { on_hand: '6', reserved: '6' });
      assert.equal((await shippingCounts(db)).active, 1);
      const second = await h.ready(order.orderId, [b.target.id]);
      completed(await h.run(second.dispatch), 'accepted');
      assert.equal((await shippingCounts(db)).onHand, '0');
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
void test('line without partial permission remains DRAFT until all required complete Units are assigned', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const one = await h.stock('5'),
        two = await h.stock('6'),
        order = await h.order([one, two]),
        a = await h.claim(order.orderId, order.itemId, one, '5'),
        b = await h.claim(order.orderId, order.itemId, two, '6');
      const pack = shippingCommand('DraftPackage', 'package', {
        orderId: order.orderId,
        reservationIds: [a.target.id],
      });
      completed(await h.run(pack), 'accepted');
      completed(await h.run(follow(pack, 'PackPackage')), 'accepted');
      const shipment = shippingCommand('DraftShipment', 'shipment', { orderId: order.orderId });
      completed(await h.run(shipment), 'accepted');
      completed(
        await h.run(follow(pack, 'AssignPackageToShipment', { shipmentId: shipment.target.id })),
        'accepted',
      );
      completed(await h.run(follow(shipment, 'MarkShipmentReady')), 'rejected', 'GUARD_INVARIANT');
      const state = await h.app.shippingQuery('GetShipment', shipment.target.id, h.ship);
      assert.equal(state?.state, 'DRAFT');
      assert.deepEqual(await balance(db, one), { on_hand: '5', reserved: '5' });
      assert.deepEqual(await balance(db, two), { on_hand: '6', reserved: '6' });
      const secondPack = shippingCommand('DraftPackage', 'package', {
        orderId: order.orderId,
        reservationIds: [b.target.id],
      });
      completed(await h.run(secondPack), 'accepted');
      completed(await h.run(follow(secondPack, 'PackPackage')), 'accepted');
      completed(
        await h.run(
          follow(secondPack, 'AssignPackageToShipment', { shipmentId: shipment.target.id }),
        ),
        'accepted',
      );
      completed(await h.run(follow(shipment, 'MarkShipmentReady')), 'accepted');
      completed(await h.run(follow(shipment, 'StartLoading')), 'accepted');
      completed(await h.run(follow(shipment, 'DispatchShipment')), 'accepted');
      assert.equal((await shippingCounts(db)).onHand, '0');
    } finally {
      await h.app.stop();
    }
  });
});
void test('Shipping cannot split partially claimed Unit or pack missing/inactive claims', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit, '5');
      const partial = shippingCommand('DraftPackage', 'package', {
        orderId: order.orderId,
        reservationIds: [claim.target.id],
      });
      completed(await h.run(partial), 'rejected', 'GUARD_INVARIANT');
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '5' });
      const other = await h.stock(),
        otherOrder = await h.order([other]),
        request = {
          ...claim,
          idempotency_key: randomUUID(),
          target: { kind: 'reservation', id: randomUUID() },
          payload: {
            orderId: otherOrder.orderId,
            itemId: otherOrder.itemId,
            unitId: other,
            kg: '11',
          },
        };
      completed(await h.salesRun(request), 'accepted');
      completed(
        await h.run(
          shippingCommand('DraftPackage', 'package', {
            orderId: otherOrder.orderId,
            reservationIds: [request.target.id],
          }),
        ),
        'rejected',
        'GUARD_STATE',
      );
      completed(
        await h.run(
          shippingCommand('DraftPackage', 'package', {
            orderId: otherOrder.orderId,
            reservationIds: [randomUUID()],
          }),
        ),
        'rejected',
        'GUARD_ACTOR',
      );
    } finally {
      await h.app.stop();
    }
  });
});
void test('package ownership prevents concurrent duplicate Unit packing and assignment to two shipments', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit);
      const one = shippingCommand('DraftPackage', 'package', {
          orderId: order.orderId,
          reservationIds: [claim.target.id],
        }),
        two = shippingCommand('DraftPackage', 'package', {
          orderId: order.orderId,
          reservationIds: [claim.target.id],
        });
      completed(await h.run(one), 'accepted');
      completed(await h.run(two, h.shipSecond), 'accepted');
      const packs = await Promise.all([
        h.run(follow(one, 'PackPackage')),
        h.run(follow(two, 'PackPackage'), h.shipSecond),
      ]);
      assert.equal(
        packs.filter((r) => r.status === 'completed' && r.result.outcome === 'accepted').length,
        1,
      );
      assert.equal(
        packs.filter(
          (r) =>
            r.status === 'completed' &&
            r.result.outcome === 'rejected' &&
            r.result.family === 'GUARD_STATE',
        ).length,
        1,
      );
      const winner =
        packs[0]?.status === 'completed' && packs[0].result.outcome === 'accepted' ? one : two;
      const s1 = shippingCommand('DraftShipment', 'shipment', { orderId: order.orderId }),
        s2 = shippingCommand('DraftShipment', 'shipment', { orderId: order.orderId });
      completed(await h.run(s1), 'accepted');
      completed(await h.run(s2), 'accepted');
      const assignment = await Promise.all([
        h.run(follow(winner, 'AssignPackageToShipment', { shipmentId: s1.target.id })),
        h.run(
          follow(winner, 'AssignPackageToShipment', { shipmentId: s2.target.id }),
          h.shipSecond,
        ),
      ]);
      assert.equal(
        assignment.filter((r) => r.status === 'completed' && r.result.outcome === 'accepted')
          .length,
        1,
      );
      assert.equal(
        assignment.filter((r) => r.status === 'completed' && r.result.outcome === 'rejected')
          .length,
        1,
      );
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '11' });
    } finally {
      await h.app.stop();
    }
  });
});
void test('concurrent dispatches serialize one shipment and permit precisely one Inventory stock exit', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit),
        ready = await h.ready(order.orderId, [claim.target.id]),
        before = await shippingCounts(db);
      const results = await Promise.all([
        h.run(ready.dispatch),
        h.run(follow(ready.dispatch, 'DispatchShipment'), h.shipSecond),
      ]);
      assert.equal(
        results.filter((r) => r.status === 'completed' && r.result.outcome === 'accepted').length,
        1,
      );
      assert.equal(
        results.filter(
          (r) =>
            r.status === 'completed' &&
            r.result.outcome === 'rejected' &&
            r.result.family === 'GUARD_IDEMPOTENT_DUP',
        ).length,
        1,
      );
      const after = await shippingCounts(db);
      assert.equal(after.onHand, '0');
      assert.equal(after.reserved, '0');
      assert.equal(after.active, 0);
      assert.ok(after.movements > before.movements);
      const exits = await db.owner.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM inventory.ledger WHERE command_id='DispatchShipment' AND on_hand_delta<0",
      );
      assert.equal(exits.rows[0]?.n, 1);
    } finally {
      await h.app.stop();
    }
  });
});
void test('unpack before assignment restores RESERVED without quantity effects; cannot unpack assigned/dispatched package', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit),
        pack = shippingCommand('DraftPackage', 'package', {
          orderId: order.orderId,
          reservationIds: [claim.target.id],
        });
      completed(await h.run(pack), 'accepted');
      completed(await h.run(follow(pack, 'PackPackage')), 'accepted');
      const before = await shippingCounts(db);
      completed(await h.run(follow(pack, 'UnpackPackage')), 'accepted');
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '11' });
      assert.equal(
        (
          await db.owner.query<{ state: string }>(
            'SELECT state FROM inventory.unit WHERE unit_id=$1',
            [unit],
          )
        ).rows[0]?.state,
        'RESERVED',
      );
      assert.equal((await shippingCounts(db)).movements, before.movements);
      const ready = await h.ready(order.orderId, [claim.target.id]);
      completed(await h.run(follow(ready.pack, 'UnpackPackage')), 'rejected', 'GUARD_STATE');
      completed(await h.run(ready.dispatch), 'accepted');
      completed(await h.run(follow(ready.pack, 'UnpackPackage')), 'rejected', 'GUARD_STATE');
    } finally {
      await h.app.stop();
    }
  });
});
void test('foreign customer, Warehouse/Sales roles and revoked individual grant cannot ship or disclose shipping data', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit),
        ready = await h.ready(order.orderId, [claim.target.id]);
      assert.equal((await h.run(ready.dispatch, h.wh)).status, 'admission-denied');
      assert.equal((await h.run(ready.dispatch, h.actor)).status, 'admission-denied');
      assert.equal(
        (await h.run(follow(ready.dispatch, 'DispatchShipment'), h.shipForeign)).status,
        'admission-denied',
      );
      assert.equal(
        await h.app.shippingQuery('GetShipment', ready.shipment.target.id, h.shipForeign),
        undefined,
      );
      assert.equal(
        await h.app.shippingQuery('GetPackage', ready.pack.target.id, h.shipForeign),
        undefined,
      );
      await db.owner.query(
        "DELETE FROM identity.role_grant WHERE account_id=(SELECT account_id FROM identity.account WHERE username='sales.ship-first')",
      );
      assert.equal((await h.run(ready.dispatch)).status, 'admission-denied');
      await assert.rejects(h.app.shippingQuery('GetShipment', ready.shipment.target.id, h.ship));
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '11' });
    } finally {
      await h.app.stop();
    }
  });
});
void test('unknown client fields, duplicate reservation IDs and unimplemented exceptional/delivery commands cannot invent dispatch policy', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit),
        draft = shippingCommand('DraftPackage', 'package', {
          orderId: order.orderId,
          reservationIds: [claim.target.id],
        });
      assert.equal(
        (await h.run({ ...draft, payload: { ...draft.payload, measuredKg: '1' } })).status,
        'admission-denied',
      );
      completed(
        await h.run({
          ...draft,
          payload: { ...draft.payload, reservationIds: [claim.target.id, claim.target.id] },
        }),
        'rejected',
        'GUARD_INVARIANT',
      );
      for (const command of ['ConfirmDelivery', 'CloseShipment', 'ExceptionalShipment'])
        assert.equal(
          (await h.run(shippingCommand(command, 'shipment'))).status,
          'admission-denied',
        );
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '11' });
    } finally {
      await h.app.stop();
    }
  });
});
void test('failed append of accepted shipment audit rolls back Units, claims, evidence, outcome and Ledger effects', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit),
        ready = await h.ready(order.orderId, [claim.target.id]),
        before = await shippingCounts(db);
      const contracts = h.app.shipping.contracts();
      const ports = {
        registry: new CommandRegistry(contracts),
        transactions: db.transactions,
        outcomes: db.outcomes,
        audits: { append: () => Promise.reject(new Error('Synthetic audit outage')) },
        authorization: new IdentityAuthorization(
          h.app.identity,
          contracts.map((c) => ({
            command: c.command,
            version: 1,
            roles: ['ACT-SHIP' as const],
            canTarget: () => Promise.resolve(true),
            canDisclose: () => Promise.resolve(true),
          })),
        ),
        recoveryFence: { permitsAdmission: () => Promise.resolve(true) },
      };
      const result = await executeCommand(JSON.stringify(ready.dispatch), h.ship, ports);
      assert.equal(result.status, 'technical');
      assert.deepEqual(await shippingCounts(db), before);
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '11' });
      const state = await h.app.shippingQuery('GetShipment', ready.shipment.target.id, h.ship);
      assert.ok(state);
      assert.equal(state.state, 'LOADING');
      completed(await h.run(ready.dispatch), 'accepted');
    } finally {
      await h.app.stop();
    }
  });
});
void test('lost confirmed COMMIT reply recovers shipment from durable outcome without another stock exit', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db),
      proxy = await lostCommitProxy(process.env.TEST_DATABASE_URL!),
      pool = new Pool({ connectionString: proxy.url });
    pool.on('error', () => undefined);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit),
        ready = await h.ready(order.orderId, [claim.target.id]),
        contracts = h.app.shipping.contracts();
      const ports = {
        registry: new CommandRegistry(contracts),
        transactions: new PostgresTransactions(pool),
        outcomes: db.outcomes,
        audits: db.audit,
        authorization: new IdentityAuthorization(
          h.app.identity,
          contracts.map((c) => ({
            command: c.command,
            version: 1,
            roles: ['ACT-SHIP' as const],
            canTarget: () => Promise.resolve(true),
            canDisclose: () => Promise.resolve(true),
          })),
        ),
        recoveryFence: { permitsAdmission: () => Promise.resolve(true) },
      };
      const result = await executeCommand(JSON.stringify(ready.dispatch), h.ship, ports);
      assert.equal(result.status, 'technical');
      if (result.status === 'technical') assert.equal(result.kind, 'uncertain');
      assert.equal(proxy.commitConfirmed(), true);
      const replay = completed(await h.run(ready.dispatch), 'accepted');
      assert.equal(replay.replayed, true);
      assert.deepEqual(await balance(db, unit), { on_hand: '0', reserved: '0' });
      assert.equal(
        (
          await db.owner.query<{ n: number }>(
            "SELECT count(*)::int AS n FROM inventory.ledger WHERE command_id='DispatchShipment' AND on_hand_delta<0",
          )
        ).rows[0]?.n,
        1,
      );
    } finally {
      await pool.end();
      await proxy.close();
      await h.app.stop();
    }
  });
});
void test('consumed earlier reservation remains demand coverage so later confirmed order may activate unused selected Unit', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const shipped = await h.stock(),
        available = await h.stock(),
        early = await h.order([shipped, available]),
        late = await h.order([available], { actor: h.second });
      const first = await h.claim(early.orderId, early.itemId, shipped),
        ready = await h.ready(early.orderId, [first.target.id]);
      completed(await h.run(ready.dispatch), 'accepted');
      const later = await h.claim(late.orderId, late.itemId, available, '11', h.second);
      completed(await h.salesRun(activate(later), h.second), 'rejected', 'GUARD_IDEMPOTENT_DUP');
      assert.deepEqual(await balance(db, available), { on_hand: '11', reserved: '11' });
    } finally {
      await h.app.stop();
    }
  });
});
void test('copied or caller-fabricated principals cannot admit Shipping commands or replay previous outcomes', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit),
        ready = await h.ready(order.orderId, [claim.target.id]);
      const before = await shippingCounts(db);
      for (const context of [
        { ...h.ship, principal: { ...h.ship.principal } },
        Object.freeze({ ...h.ship, principal: Object.freeze({ ...h.ship.principal }) }),
        { ...h.actor, actorRole: 'ACT-SHIP' },
      ])
        assert.equal((await h.run(ready.dispatch, context)).status, 'admission-denied');
      const after = await shippingCounts(db);
      assert.equal(after.movements, before.movements);
      assert.equal(after.outcomes, before.outcomes);
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '11' });
      completed(await h.run(ready.dispatch), 'accepted');
      assert.equal(
        (await h.run(ready.dispatch, { ...h.ship, principal: { ...h.ship.principal } })).status,
        'admission-denied',
      );
    } finally {
      await h.app.stop();
    }
  });
});
void test('even current ACT-SHIP cannot directly invoke IPS shipment effects outside the owner-admitted bundle', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit),
        ready = await h.ready(order.orderId, [claim.target.id]),
        before = await shippingCounts(db),
        tx = await db.transactions.begin();
      try {
        await assert.rejects(
          h.app.inventory.post(
            { actor: h.ship, request: ready.dispatch, transaction: tx.context },
            [
              {
                type: 'RELEASE',
                unitId: unit,
                reservationId: claim.target.id,
                terminal: 'CONSUMED',
                source: {
                  factId: ready.shipment.target.id,
                  effectId: shipmentEffectId(ready.shipment.target.id, unit, 'RELEASE'),
                },
              },
              {
                type: 'STOCK_OUT',
                unitId: unit,
                kg: '11',
                nextState: 'SHIPPED',
                source: {
                  factId: ready.shipment.target.id,
                  effectId: shipmentEffectId(ready.shipment.target.id, unit, 'STOCK_OUT'),
                },
              },
            ],
          ),
          (error) => error instanceof BusinessRejection && error.rejection.family === 'GUARD_ACTOR',
        );
      } finally {
        await tx.rollback();
        await tx.release();
      }
      assert.deepEqual(await shippingCounts(db), before);
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '11' });
      completed(await h.run(ready.dispatch), 'accepted');
    } finally {
      await h.app.stop();
    }
  });
});
void test('PostgreSQL immutable shipment binding/content/dispatch evidence and consumed claim provenance resist alteration', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit),
        ready = await h.ready(order.orderId, [claim.target.id]);
      completed(await h.run(ready.dispatch), 'accepted');
      const sqlGuard = (code: string) => (error: unknown) =>
        typeof error === 'object' && error !== null && 'code' in error && error.code === code;
      await assert.rejects(
        db.runtime.query('UPDATE shipping.package SET order_id=$1 WHERE package_id=$2', [
          randomUUID(),
          ready.pack.target.id,
        ]),
        sqlGuard('23514'),
      );
      await assert.rejects(
        db.runtime.query('UPDATE shipping.package_content SET kg=kg+1 WHERE package_id=$1', [
          ready.pack.target.id,
        ]),
        sqlGuard('23514'),
      );
      await assert.rejects(
        db.runtime.query("UPDATE shipping.shipment SET state='DRAFT' WHERE shipment_id=$1", [
          ready.shipment.target.id,
        ]),
        sqlGuard('23514'),
      );
      await assert.rejects(
        db.runtime.query('UPDATE shipping.dispatch SET kg=kg+1 WHERE shipment_id=$1', [
          ready.shipment.target.id,
        ]),
        sqlGuard('42501'),
      );
      await assert.rejects(
        db.runtime.query('DELETE FROM shipping.dispatch WHERE shipment_id=$1', [
          ready.shipment.target.id,
        ]),
        sqlGuard('42501'),
      );
      await assert.rejects(
        db.runtime.query(
          "UPDATE inventory.reservation_request SET state='ACTIVE' WHERE reservation_id=$1",
          [claim.target.id],
        ),
        sqlGuard('23514'),
      );
      await assert.rejects(
        db.runtime.query('ALTER TABLE shipping.shipment DISABLE TRIGGER shipment_transition'),
        sqlGuard('42501'),
      );
      assert.deepEqual(await balance(db, unit), { on_hand: '0', reserved: '0' });
      const evidence = await db.owner.query<{ kg: string; outcome: string; subject: string }>(
        'SELECT kg::text,outcome,subject FROM shipping.dispatch WHERE shipment_id=$1',
        [ready.shipment.target.id],
      );
      assert.deepEqual(evidence.rows, [
        { kg: '11', outcome: 'ACCEPTED', subject: h.ship.principal.subject },
      ]);
    } finally {
      await h.app.stop();
    }
  });
});
