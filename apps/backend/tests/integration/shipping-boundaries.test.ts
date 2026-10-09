import assert from 'node:assert/strict';
import test from 'node:test';
import { setTimeout as pause } from 'node:timers/promises';
import { withDatabase, type DatabaseFixture } from '../support/database-fixture.js';
import { completed, installation } from '../support/receipt-harness.js';
import { shippingApp, shippingCommand, shippingCounts } from '../support/shipping-harness.js';
import { follow } from '../support/sales-harness.js';
import { reservationCommand, activate, balance } from '../support/reservation-harness.js';

void test('every dispatch write window rolls back the whole bundle and permits the same-key retry', async () => {
  await withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        claim = await h.claim(order.orderId, order.itemId, unit);
      const ready = await h.ready(order.orderId, [claim.target.id]);
      const before = await shippingCounts(db);
      const windows = [
        {
          table: 'inventory.ledger',
          action: 'INSERT',
          condition: "NEW.command_id='DispatchShipment' AND NEW.reserved_delta<0",
        },
        {
          table: 'inventory.ledger',
          action: 'INSERT',
          condition: "NEW.command_id='DispatchShipment' AND NEW.on_hand_delta<0",
        },
        {
          table: 'inventory.reservation_request',
          action: 'UPDATE',
          condition: "NEW.state='CONSUMED'",
        },
        { table: 'shipping.shipment', action: 'UPDATE', condition: "NEW.state='DISPATCHED'" },
        { table: 'shipping.dispatch', action: 'INSERT', condition: 'true' },
      ];
      for (const window of windows) {
        await db.owner.query(
          `CREATE FUNCTION envelope_test.shipment_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF ${window.condition} THEN RAISE EXCEPTION 'Synthetic dispatch window failure' USING ERRCODE='P0001'; END IF; RETURN NEW; END; $$`,
        );
        await db.owner.query(
          `CREATE TRIGGER shipment_failure BEFORE ${window.action} ON ${window.table} FOR EACH ROW EXECUTE FUNCTION envelope_test.shipment_failure()`,
        );
        try {
          const result = await h.run(ready.dispatch);
          assert.equal(result.status, 'technical', window.table + ':' + window.condition);
          assert.deepEqual(await shippingCounts(db), before);
          assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '11' });
          assert.equal(
            (
              await db.owner.query<{ state: string }>(
                'SELECT state FROM inventory.unit WHERE unit_id=$1',
                [unit],
              )
            ).rows[0]?.state,
            'PACKED',
          );
          assert.equal(
            (
              await db.owner.query<{ state: string }>(
                'SELECT state FROM inventory.reservation_request WHERE reservation_id=$1',
                [claim.target.id],
              )
            ).rows[0]?.state,
            'ACTIVE',
          );
          assert.equal(
            (await h.app.shippingQuery('GetShipment', ready.shipment.target.id, h.ship))?.state,
            'LOADING',
          );
          assert.equal(
            (
              await db.runtime.query<{ n: number }>(
                'SELECT count(*)::int AS n FROM shipping.dispatch',
              )
            ).rows[0]?.n,
            0,
          );
        } finally {
          await db.owner.query(`DROP TRIGGER shipment_failure ON ${window.table}`);
          await db.owner.query('DROP FUNCTION envelope_test.shipment_failure()');
        }
      }
      completed(await h.run(ready.dispatch), 'accepted');
      assert.deepEqual(await balance(db, unit), { on_hand: '0', reserved: '0' });
      const after = await shippingCounts(db);
      assert.equal(after.movements, before.movements + 2);
      assert.equal(after.outcomes, before.outcomes + 1);
      assert.equal(after.audits, before.audits + 1);
      assert.equal(completed(await h.run(ready.dispatch), 'accepted').replayed, true);
    } finally {
      await h.app.stop();
    }
  });
});

async function twoResourceWaiters(db: DatabaseFixture): Promise<void> {
  const until = Date.now() + 2500;
  while (Date.now() < until) {
    const row = (
      await db.runtime.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname=current_database() AND usename=$1 AND state='active' AND wait_event_type='Lock' AND wait_event='advisory'",
        [db.runtimeRole],
      )
    ).rows[0];
    if ((row?.n ?? 0) >= 2) return;
    await pause(15);
  }
  assert.fail('Both real command transactions must reach the blocked inventory resource');
}
for (const command of ['PackPackage', 'UnpackPackage', 'DispatchShipment'] as const) {
  void test(`${command} serializes against competing reservation activation on the same physical Unit`, async () => {
    await withDatabase(async (db) => {
      const h = await shippingApp(db);
      const blocker = await db.owner.connect();
      let pending: ReturnType<typeof h.run>[] = [];
      try {
        const unit = await h.stock(),
          early = await h.order([unit]),
          late = await h.order([unit], { actor: h.second });
        const later = reservationCommand(late.orderId, late.itemId, unit, '11');
        completed(await h.salesRun(later, h.second), 'accepted');
        const first = await h.claim(early.orderId, early.itemId, unit);
        let input;
        if (command === 'DispatchShipment')
          input = (await h.ready(early.orderId, [first.target.id])).dispatch;
        else {
          const draft = shippingCommand('DraftPackage', 'package', {
            orderId: early.orderId,
            reservationIds: [first.target.id],
          });
          completed(await h.run(draft), 'accepted');
          if (command === 'UnpackPackage')
            completed(await h.run(follow(draft, 'PackPackage')), 'accepted');
          input = follow(draft, command);
        }
        await blocker.query('BEGIN');
        await blocker.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [
          JSON.stringify(['inventory', installation, installation, 'unit', unit]),
        ]);
        pending = [h.run(input), h.salesRun(activate(later), h.second)];
        await twoResourceWaiters(db);
        await blocker.query('COMMIT');
        const [shipment, competitor] = await Promise.all(pending);
        completed(shipment!, 'accepted');
        assert.equal(competitor?.status, 'completed');
        if (competitor?.status === 'completed') {
          assert.equal(competitor.result.outcome, 'rejected');
          assert.equal(competitor.result.family, 'GUARD_CONFLICT');
        }
        assert.deepEqual(
          await balance(db, unit),
          command === 'DispatchShipment'
            ? { on_hand: '0', reserved: '0' }
            : { on_hand: '11', reserved: '11' },
        );
        assert.equal(
          (
            await db.owner.query<{ state: string }>(
              'SELECT state FROM inventory.reservation_request WHERE reservation_id=$1',
              [later.target.id],
            )
          ).rows[0]?.state,
          'REQUESTED',
        );
        assert.equal(
          (
            await db.owner.query<{ state: string }>(
              'SELECT state FROM inventory.reservation_request WHERE reservation_id=$1',
              [first.target.id],
            )
          ).rows[0]?.state,
          command === 'DispatchShipment' ? 'CONSUMED' : 'ACTIVE',
        );
      } finally {
        await blocker.query('ROLLBACK');
        blocker.release();
        await Promise.allSettled(pending);
        await h.app.stop();
      }
    });
  });
}
