import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { CommandRegistry, executeCommand } from '@navard/shared-kernel';
import { IdentityAuthorization } from '../../src/modules/identity/index.js';
import { PostgresTransactions } from '../../src/infrastructure/postgresql/transaction.js';
import { lostCommitProxy } from '../support/crash-child.js';
import { withDatabase } from '../support/database-fixture.js';
import { completed } from '../support/receipt-harness.js';
import { follow } from '../support/sales-harness.js';
import {
  reservationApp,
  reservationCommand,
  activate,
  balance,
  reservationCounts,
} from '../support/reservation-harness.js';

void test('real reservation REQUESTED has no quantity effect; activation through IPS atomically claims kg without moving stock', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]);
      const input = reservationCommand(order.orderId, order.itemId, unit);
      const before = await reservationCounts(db);
      const requested = completed(await h.run(input), 'accepted');
      assert.equal(
        (requested.result.data as { customerId: string }).customerId,
        h.people.customerId,
      );
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '0' });
      assert.equal((await reservationCounts(db)).movements, before.movements);
      assert.equal((await reservationCounts(db)).active, 0);
      completed(await h.run(activate(input)), 'accepted');
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '5' });
      assert.equal(
        (
          await db.owner.query<Record<string, unknown>>(
            'SELECT state FROM inventory.unit WHERE unit_id=$1',
            [unit],
          )
        ).rows[0]?.state,
        'RESERVED',
      );
      assert.deepEqual(
        (
          await db.owner.query<Record<string, unknown>>(
            'SELECT state,kg::text,demand_id FROM inventory.reservation WHERE reservation_id=$1',
            [input.target.id],
          )
        ).rows,
        [{ state: 'ACTIVE', kg: '5', demand_id: order.orderId }],
      );
      assert.equal(
        (
          await db.owner.query<Record<string, unknown>>(
            'SELECT state FROM inventory.reservation_request WHERE reservation_id=$1',
            [input.target.id],
          )
        ).rows[0]?.state,
        'ACTIVE',
      );
      const counts = await reservationCounts(db);
      assert.equal(counts.movements, before.movements + 1);
      assert.equal(counts.outcomes, before.outcomes + 2);
      assert.equal(counts.audits, before.audits + 2);
      assert.equal(
        (
          await db.owner.query<Record<string, unknown>>(
            'SELECT sum(on_hand_delta)::text AS kg,sum(reserved_delta)::text AS reserved FROM inventory.ledger WHERE unit_id=$1',
            [unit],
          )
        ).rows[0]?.reserved,
        '5',
      );
    } finally {
      await h.app.stop();
    }
  });
});
void test('accepted request and activation replay returns identical outcomes and one IPS effect; changed key binding conflicts', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        input = reservationCommand(order.orderId, order.itemId, unit);
      const requested = completed(await h.run(input), 'accepted');
      const replay = completed(await h.run(input), 'accepted');
      assert.equal(replay.replayed, true);
      assert.deepEqual(replay.result, requested.result);
      completed(
        await h.run(follow(input, 'RequestReservation', input.payload)),
        'rejected',
        'GUARD_IDEMPOTENT_DUP',
      );
      completed(
        await h.run({
          ...input,
          idempotency_key: randomUUID(),
          payload: { ...input.payload, kg: '4' },
        }),
        'rejected',
        'GUARD_CONFLICT',
      );
      assert.equal(
        (await h.run({ ...input, payload: { ...input.payload, kg: '4' } })).status,
        'conflict',
      );
      const activation = activate(input),
        activated = completed(await h.run(activation), 'accepted');
      const activatedReplay = completed(await h.run(activation), 'accepted');
      assert.equal(activatedReplay.replayed, true);
      assert.deepEqual(activatedReplay.result, activated.result);
      completed(await h.run(activate(input)), 'rejected', 'GUARD_IDEMPOTENT_DUP');
      assert.equal((await reservationCounts(db)).movements, 2);
      assert.equal((await reservationCounts(db)).active, 1);
      const audit = await db.owner.query<{ event_kind: string }>(
        'SELECT event_kind FROM kernel.audit_event',
      );
      assert.equal(audit.rows.filter((r) => r.event_kind === 'AUD-CMD-REPLAYED').length, 2);
      assert.ok(audit.rows.some((r) => r.event_kind === 'AUD-CMD-REJECTED'));
    } finally {
      await h.app.stop();
    }
  });
});
void test('reservation authorization preserves individual/current Sales customer scope and permits organization Warehouse activation only', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        input = reservationCommand(order.orderId, order.itemId, unit);
      assert.equal((await h.run(input, h.wh)).status, 'admission-denied');
      completed(
        await h.run({ ...input, idempotency_key: randomUUID() }, h.foreign),
        'rejected',
        'GUARD_ACTOR',
      );
      assert.equal(
        (await h.run(input, { ...h.actor, principal: { ...h.actor.principal } })).status,
        'admission-denied',
      );
      completed(await h.run(input), 'accepted');
      assert.equal((await h.run(input, h.foreign)).status, 'conflict');
      completed(await h.run(activate(input), h.wh), 'accepted');
      const proc = await h.app.identity.context(h.warehouse.tokens.get('ACT-PROC')!, 'ACT-PROC');
      assert.equal((await h.run(activate(input), proc)).status, 'admission-denied');
      const before = await reservationCounts(db);
      await db.owner.query<Record<string, unknown>>(
        "DELETE FROM identity.role_grant WHERE account_id=(SELECT account_id FROM identity.account WHERE username='sales.first')",
      );
      assert.equal((await h.run(input)).status, 'admission-denied');
      assert.deepEqual(await reservationCounts(db), { ...before, audits: before.audits + 1 });
    } finally {
      await h.app.stop();
    }
  });
});
void test('same key from another authorized principal is a conflict and never creates another request', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        input = reservationCommand(order.orderId, order.itemId, unit);
      completed(await h.run(input), 'accepted');
      assert.equal((await h.run(input, h.second)).status, 'conflict');
      assert.equal((await reservationCounts(db)).requests, 1);
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '0' });
    } finally {
      await h.app.stop();
    }
  });
});
void test('nonconfirmed demand, unknown item and unselected Unit cannot create a reservation', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const unit = await h.stock(),
        otherUnit = await h.stock(),
        submitted = await h.order([unit], { confirmed: false });
      const result = await h.run(reservationCommand(submitted.orderId, submitted.itemId, unit));
      completed(result, 'rejected', 'GUARD_ACTOR');
      const order = await h.order([unit]);
      completed(
        await h.run(reservationCommand(order.orderId, randomUUID(), unit)),
        'rejected',
        'GUARD_INVARIANT',
      );
      completed(
        await h.run(reservationCommand(order.orderId, order.itemId, otherUnit)),
        'rejected',
        'GUARD_INVARIANT',
      );
      assert.equal((await reservationCounts(db)).requests, 0);
      assert.equal((await reservationCounts(db)).movements, 2);
    } finally {
      await h.app.stop();
    }
  });
});
void test('requested kg aggregate cannot exceed confirmed line demand even across different selected Units', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const one = await h.stock(),
        two = await h.stock(),
        order = await h.order([one, two]);
      completed(await h.run(reservationCommand(order.orderId, order.itemId, one, '3')), 'accepted');
      const excess = reservationCommand(order.orderId, order.itemId, two, '3');
      const rejected = completed(await h.run(excess), 'rejected', 'GUARD_INVARIANT');
      const retry = completed(await h.run(excess), 'rejected', 'GUARD_INVARIANT');
      assert.equal(retry.replayed, true);
      assert.deepEqual(rejected.result, retry.result);
      completed(await h.run(reservationCommand(order.orderId, order.itemId, two, '2')), 'accepted');
      assert.equal((await reservationCounts(db)).requests, 2);
      assert.equal((await reservationCounts(db)).active, 0);
      assert.deepEqual(await balance(db, one), { on_hand: '11', reserved: '0' });
    } finally {
      await h.app.stop();
    }
  });
});
void test('concurrent requests on different Units serialize line demand and cannot overclaim it', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const one = await h.stock(),
        two = await h.stock(),
        order = await h.order([one, two]);
      const results = await Promise.all([
        h.run(reservationCommand(order.orderId, order.itemId, one, '4')),
        h.run(reservationCommand(order.orderId, order.itemId, two, '4'), h.second),
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
            r.result.family === 'GUARD_INVARIANT',
        ).length,
        1,
      );
      assert.equal((await reservationCounts(db)).requests, 1);
      assert.equal((await reservationCounts(db)).active, 0);
    } finally {
      await h.app.stop();
    }
  });
});
void test('simultaneous same-key activation yields one active claim, one reserve fact and audited replay', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        input = reservationCommand(order.orderId, order.itemId, unit);
      completed(await h.run(input), 'accepted');
      const command = activate(input),
        results = await Promise.all([h.run(command), h.run(command)]);
      for (const result of results) completed(result, 'accepted');
      assert.equal(results.filter((r) => r.status === 'completed' && r.replayed).length, 1);
      assert.equal((await reservationCounts(db)).active, 1);
      assert.equal((await reservationCounts(db)).movements, 2);
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '5' });
    } finally {
      await h.app.stop();
    }
  });
});
void test('earlier confirmation wins selected-Unit contention even when its request arrives later', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const unit = await h.stock(),
        early = await h.order([unit]),
        late = await h.order([unit], { actor: h.second });
      const later = reservationCommand(late.orderId, late.itemId, unit);
      completed(await h.run(later, h.second), 'accepted');
      completed(await h.run(activate(later), h.second), 'rejected', 'GUARD_CONFLICT');
      const earlier = reservationCommand(early.orderId, early.itemId, unit);
      completed(await h.run(earlier), 'accepted');
      completed(await h.run(activate(earlier)), 'accepted');
      completed(await h.run(activate(later), h.second), 'rejected', 'GUARD_CONFLICT');
      assert.equal((await reservationCounts(db)).active, 1);
      assert.equal(
        (
          await db.owner.query<Record<string, unknown>>(
            'SELECT demand_id FROM inventory.reservation',
          )
        ).rows[0]?.demand_id,
        early.orderId,
      );
    } finally {
      await h.app.stop();
    }
  });
});
void test('priority checks all confirmed customers internally but foreign callers cannot read or replace their reservations', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const unit = await h.stock(),
        early = await h.order([unit], { actor: h.foreign, customerId: h.people.otherCustomerId }),
        late = await h.order([unit]);
      const later = reservationCommand(late.orderId, late.itemId, unit);
      completed(await h.run(later), 'accepted');
      const rejection = completed(await h.run(activate(later)), 'rejected', 'GUARD_CONFLICT');
      assert.ok(!JSON.stringify(rejection).includes(early.orderId));
      const earlier = reservationCommand(early.orderId, early.itemId, unit);
      completed(await h.run(earlier, h.foreign), 'accepted');
      assert.equal((await h.run(activate(earlier))).status, 'admission-denied');
      completed(await h.run(activate(earlier), h.wh), 'accepted');
      assert.equal(
        (
          await db.owner.query<Record<string, unknown>>(
            'SELECT demand_id FROM inventory.reservation',
          )
        ).rows[0]?.demand_id,
        early.orderId,
      );
    } finally {
      await h.app.stop();
    }
  });
});
void test('existing ACTIVE claim cannot be stolen or split by a competing reservation despite remaining kg', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const unit = await h.stock(),
        early = await h.order([unit]),
        late = await h.order([unit]);
      const first = reservationCommand(early.orderId, early.itemId, unit, '2'),
        other = reservationCommand(late.orderId, late.itemId, unit, '2');
      completed(await h.run(first), 'accepted');
      completed(await h.run(other), 'accepted');
      completed(await h.run(activate(first)), 'accepted');
      completed(await h.run(activate(other)), 'rejected', 'GUARD_CONFLICT');
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '2' });
      assert.equal((await reservationCounts(db)).active, 1);
      assert.equal((await reservationCounts(db)).movements, 2);
    } finally {
      await h.app.stop();
    }
  });
});
void test('invalid quantities and caller-invented fields never create request or quantity effects', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        base = reservationCommand(order.orderId, order.itemId, unit);
      for (const kg of ['0', '-1', '1.5', '01', '100000000000000000000'])
        completed(
          await h.run({
            ...base,
            idempotency_key: randomUUID(),
            target: { ...base.target, id: randomUUID() },
            payload: { ...base.payload, kg },
          }),
          'rejected',
          'GUARD_INVARIANT',
        );
      const massAssigned = await h.run({ ...base, payload: { ...base.payload, state: 'ACTIVE' } });
      assert.equal(massAssigned.status, 'admission-denied');
      if (massAssigned.status === 'admission-denied')
        assert.equal(massAssigned.family, 'GUARD_INVARIANT');
      assert.equal((await reservationCounts(db)).requests, 0);
      assert.equal((await reservationCounts(db)).movements, 1);
    } finally {
      await h.app.stop();
    }
  });
});
void test('projection drift fails activation technically without writes or outcome; exact-key retry succeeds after evidence repair', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        input = reservationCommand(order.orderId, order.itemId, unit);
      completed(await h.run(input), 'accepted');
      await db.owner.query<Record<string, unknown>>(
        'UPDATE inventory.balance SET on_hand=10 WHERE unit_id=$1',
        [unit],
      );
      const activation = activate(input),
        before = await reservationCounts(db);
      assert.equal((await h.run(activation)).status, 'technical');
      assert.deepEqual(await reservationCounts(db), before);
      assert.equal((await reservationCounts(db)).active, 0);
      assert.equal((await reservationCounts(db)).movements, 1);
      await db.owner.query<Record<string, unknown>>(
        'UPDATE inventory.balance SET on_hand=11 WHERE unit_id=$1',
        [unit],
      );
      const recovered = completed(await h.run(activation), 'accepted');
      assert.equal(recovered.replayed, false);
    } finally {
      await h.app.stop();
    }
  });
});
void test('request SQL identity and state cannot be rewritten; runtime cannot delete requests or change their schema', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        input = reservationCommand(order.orderId, order.itemId, unit);
      completed(await h.run(input), 'accepted');
      for (const sql of [
        'UPDATE inventory.reservation_request SET kg=1 WHERE reservation_id=$1',
        'UPDATE inventory.reservation_request SET customer_id=$2 WHERE reservation_id=$1',
        'DELETE FROM inventory.reservation_request WHERE reservation_id=$1',
      ])
        await assert.rejects(
          db.runtime.query(
            sql,
            sql.includes('$2') ? [input.target.id, h.people.otherCustomerId] : [input.target.id],
          ),
        );
      await assert.rejects(
        db.runtime.query('ALTER TABLE inventory.reservation_request ADD COLUMN fabricated text'),
      );
      await assert.rejects(
        db.runtime.query(
          "UPDATE inventory.reservation_request SET state='ACTIVE',activated_at=clock_timestamp(),active_claim_id=reservation_id WHERE reservation_id=$1",
          [input.target.id],
        ),
        (error: unknown) =>
          typeof error === 'object' && error !== null && 'code' in error && error.code === '23514',
      );
      completed(await h.run(activate(input)), 'accepted');
      await assert.rejects(
        db.runtime.query(
          "UPDATE inventory.reservation_request SET state='REQUESTED',activated_at=NULL WHERE reservation_id=$1",
          [input.target.id],
        ),
      );
      assert.equal((await reservationCounts(db)).active, 1);
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '5' });
    } finally {
      await h.app.stop();
    }
  });
});
void test('audit write failure rolls activation state, IPS fact, projection and outcome back together; fresh retry succeeds', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        input = reservationCommand(order.orderId, order.itemId, unit);
      completed(await h.run(input), 'accepted');
      const command = activate(input),
        before = await reservationCounts(db);
      const role = '"' + db.runtimeRole.replaceAll('"', '""') + '"';
      await db.owner.query<Record<string, unknown>>(
        `REVOKE INSERT ON kernel.audit_event FROM ${role}`,
      );
      try {
        assert.equal((await h.run(command)).status, 'technical');
      } finally {
        await db.owner.query<Record<string, unknown>>(
          `GRANT INSERT ON kernel.audit_event TO ${role}`,
        );
      }
      assert.deepEqual(await reservationCounts(db), before);
      assert.equal(
        (
          await db.owner.query<Record<string, unknown>>(
            'SELECT state FROM inventory.reservation_request WHERE reservation_id=$1',
            [input.target.id],
          )
        ).rows[0]?.state,
        'REQUESTED',
      );
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '0' });
      completed(await h.run(command), 'accepted');
    } finally {
      await h.app.stop();
    }
  });
});
void test('separate Units for one line activate concurrently without exceeding aggregate demand', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const one = await h.stock(),
        two = await h.stock(),
        order = await h.order([one, two]);
      const first = reservationCommand(order.orderId, order.itemId, one, '3'),
        second = reservationCommand(order.orderId, order.itemId, two, '2');
      completed(await h.run(first), 'accepted');
      completed(await h.run(second), 'accepted');
      for (const result of await Promise.all([
        h.run(activate(first)),
        h.run(activate(second), h.wh),
      ]))
        completed(result, 'accepted');
      assert.equal((await reservationCounts(db)).active, 2);
      assert.deepEqual(await balance(db, one), { on_hand: '11', reserved: '3' });
      assert.deepEqual(await balance(db, two), { on_hand: '11', reserved: '2' });
    } finally {
      await h.app.stop();
    }
  });
});
void test('lost confirmed COMMIT response replays durable activation without another IPS claim or reserve fact', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    const proxy = await lostCommitProxy(process.env.TEST_DATABASE_URL!),
      pool = new Pool({ connectionString: proxy.url });
    pool.on('error', () => undefined);
    try {
      const unit = await h.stock(),
        order = await h.order([unit]),
        input = reservationCommand(order.orderId, order.itemId, unit);
      completed(await h.run(input), 'accepted');
      const command = activate(input);
      const contracts = h.app.reservations.contracts();
      const ports = {
        registry: new CommandRegistry(contracts),
        transactions: new PostgresTransactions(pool),
        outcomes: db.outcomes,
        audits: db.audit,
        authorization: new IdentityAuthorization(
          h.app.identity,
          contracts.map((contract) => ({
            command: contract.command,
            version: 1,
            roles: ['ACT-SALES' as const],
            canTarget: () => Promise.resolve(true),
            canDisclose: () => Promise.resolve(true),
          })),
        ),
        recoveryFence: { permitsAdmission: () => Promise.resolve(true) },
      };
      const result = await executeCommand(JSON.stringify(command), h.actor, ports);
      assert.equal(result.status, 'technical');
      if (result.status === 'technical') assert.equal(result.kind, 'uncertain');
      assert.equal(proxy.commitConfirmed(), true);
      const replay = completed(await h.run(command), 'accepted');
      assert.equal(replay.replayed, true);
      assert.equal((await reservationCounts(db)).active, 1);
      assert.equal((await reservationCounts(db)).movements, 2);
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '5' });
    } finally {
      await pool.end();
      await proxy.close();
      await h.app.stop();
    }
  });
});
void test('simultaneous partial activations from different orders cannot split or steal one Unit', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const unit = await h.stock(),
        early = await h.order([unit]),
        late = await h.order([unit], { actor: h.second }),
        first = reservationCommand(early.orderId, early.itemId, unit, '2'),
        second = reservationCommand(late.orderId, late.itemId, unit, '2');
      completed(await h.run(first), 'accepted');
      completed(await h.run(second, h.second), 'accepted');
      const results = await Promise.all([
        h.run(activate(second), h.second),
        h.run(activate(first)),
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
            r.result.family === 'GUARD_CONFLICT',
        ).length,
        1,
      );
      assert.equal(
        (
          await db.owner.query<Record<string, unknown>>(
            'SELECT demand_id FROM inventory.reservation',
          )
        ).rows[0]?.demand_id,
        early.orderId,
      );
      assert.deepEqual(await balance(db, unit), { on_hand: '11', reserved: '2' });
    } finally {
      await h.app.stop();
    }
  });
});
void test('equal database confirmation timestamps use stable order UUID priority, independent of request arrival order', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const unit = await h.stock(),
        a = await h.order([unit]),
        b = await h.order([unit], { actor: h.second });
      // Disposable synthetic fixture only: normal workflow created both CONFIRMED orders;
      // owner narrows timestamps to an exact tie to exercise this rare DB-clock case.
      const client = await db.owner.connect();
      try {
        await client.query('BEGIN');
        await client.query('ALTER TABLE sales.sales_order DISABLE TRIGGER order_transition');
        await client.query(
          'UPDATE sales.sales_order SET confirmed_at=$1 WHERE order_id=ANY($2::uuid[])',
          ['2026-10-08T10:00:00.123456Z', [a.orderId, b.orderId]],
        );
        await client.query('ALTER TABLE sales.sales_order ENABLE TRIGGER order_transition');
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      const [early, late] = [a, b].sort((x, y) => (x.orderId < y.orderId ? -1 : 1));
      assert.ok(early && late);
      const later = reservationCommand(late.orderId, late.itemId, unit),
        earlier = reservationCommand(early.orderId, early.itemId, unit);
      completed(await h.run(later, late.actor), 'accepted');
      completed(await h.run(activate(later), late.actor), 'rejected', 'GUARD_CONFLICT');
      completed(await h.run(earlier, early.actor), 'accepted');
      completed(await h.run(activate(earlier), early.actor), 'accepted');
      assert.equal(
        (
          await db.owner.query<Record<string, unknown>>(
            'SELECT demand_id FROM inventory.reservation',
          )
        ).rows[0]?.demand_id,
        early.orderId,
      );
    } finally {
      await h.app.stop();
    }
  });
});
void test('fully ACTIVE-covered earlier demand releases unused selected Units to later confirmed orders', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const one = await h.stock(),
        two = await h.stock(),
        early = await h.order([one, two]),
        late = await h.order([two], { actor: h.second });
      const first = reservationCommand(early.orderId, early.itemId, one),
        later = reservationCommand(late.orderId, late.itemId, two);
      completed(await h.run(first), 'accepted');
      completed(await h.run(later, h.second), 'accepted');
      completed(await h.run(activate(first)), 'accepted');
      completed(await h.run(activate(later), h.second), 'accepted');
      assert.equal((await reservationCounts(db)).active, 2);
      assert.deepEqual(await balance(db, two), { on_hand: '11', reserved: '5' });
    } finally {
      await h.app.stop();
    }
  });
});
void test('REQUESTED or partially ACTIVE-covered earlier demand retains priority on its other selected Units', async () => {
  await withDatabase(async (db) => {
    const h = await reservationApp(db);
    try {
      const one = await h.stock(),
        two = await h.stock(),
        early = await h.order([one, two]),
        late = await h.order([two], { actor: h.second });
      const first = reservationCommand(early.orderId, early.itemId, one, '3'),
        later = reservationCommand(late.orderId, late.itemId, two);
      completed(await h.run(first), 'accepted');
      completed(await h.run(later, h.second), 'accepted');
      completed(await h.run(activate(later), h.second), 'rejected', 'GUARD_CONFLICT');
      completed(await h.run(activate(first)), 'accepted');
      completed(await h.run(activate(later), h.second), 'rejected', 'GUARD_CONFLICT');
      assert.equal((await reservationCounts(db)).active, 1);
      assert.deepEqual(await balance(db, two), { on_hand: '11', reserved: '0' });
    } finally {
      await h.app.stop();
    }
  });
});
