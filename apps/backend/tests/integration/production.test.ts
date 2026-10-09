import type { JsonObject } from '@navard/shared-kernel';
import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { withDatabase } from '../support/database-fixture.js';
import { completed } from '../support/receipt-harness.js';
import { balance } from '../support/reservation-harness.js';
import {
  productionApp,
  productionCommand,
  productionCounts,
} from '../support/production-harness.js';
void test('full production consumes source once, final and human Residual/Scrap source facts commit with IPS/audit/replay', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare();
      const c = h.complete(p.ops[0]!, p.source, '110', '70', { residual: '20', scrap: '20' });
      const before = await productionCounts(db);
      const accepted = completed(await h.run(c.input, h.manager), 'accepted');
      assert.deepEqual(await balance(db, p.source), { on_hand: '0', reserved: '0' });
      assert.deepEqual(await balance(db, c.outId), { on_hand: '70', reserved: '0' });
      assert.deepEqual(await balance(db, c.residualId), { on_hand: '20', reserved: '0' });
      const facts = (
        await db.owner.query<{
          kind: string;
          data: JsonObject;
          subject: string;
          occurred_at: Date;
        }>(
          'SELECT kind,data,subject,occurred_at FROM production.source_fact WHERE operation_id=$1',
          [p.ops[0]],
        )
      ).rows;
      assert.equal(facts.length, 4);
      assert.ok(facts.every((f) => f.subject === h.manager.principal.subject && f.occurred_at));
      assert.equal(facts.filter((f) => f.kind === 'SCRAP')[0]?.data.kg, '20');
      assert.equal(
        (
          await db.owner.query<{ n: number }>(
            'SELECT count(*)::int AS n FROM inventory.material_lot',
          )
        ).rows[0]?.n,
        1,
      );
      const after = await productionCounts(db);
      assert.equal(after.ledger, before.ledger + 3);
      assert.equal(after.audits, before.audits + 1);
      const replay = completed(await h.run(c.input, h.manager), 'accepted');
      assert.deepEqual(replay.result, accepted.result);
      assert.equal(replay.replayed, true);
      assert.equal((await productionCounts(db)).facts, after.facts);
      completed(
        await h.run({ ...c.input, idempotency_key: randomUUID() }, h.manager),
        'rejected',
        'GUARD_CONFLICT',
      );
      assert.equal(
        (
          await db.owner.query<{ n: number }>(
            "SELECT count(*)::int AS n FROM inventory.ledger WHERE executor<>'ACT-IPS'",
          )
        ).rows[0]?.n,
        0,
      );
      completed(await h.run(productionCommand('CompleteProductionOrder', p.orderId)), 'accepted');
      completed(await h.run(productionCommand('CloseProductionOrder', p.orderId)), 'accepted');
    } finally {
      await h.app.stop();
    }
  }));
void test('partial source remainder stays original and restricted; WIP is consumed by next routed operation without doublecount', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare({ steps: 2 });
      const first = h.complete(p.ops[0]!, p.source, '70', '50', { residual: '10', scrap: '10' });
      completed(await h.run(first.input, h.manager), 'accepted');
      assert.deepEqual(await balance(db, p.source), { on_hand: '40', reserved: '0' });
      assert.equal(
        (
          await db.owner.query<{ state: string }>(
            'SELECT state FROM inventory.unit WHERE unit_id=$1',
            [p.source],
          )
        ).rows[0]?.state,
        'PARTIALLY_CONSUMED',
      );
      assert.equal(
        (
          await db.owner.query<{ state: string }>(
            'SELECT state FROM inventory.unit WHERE unit_id=$1',
            [first.outId],
          )
        ).rows[0]?.state,
        'ISSUED_TO_PRODUCTION',
      );
      completed(await h.run(productionCommand('StartProductionOperation', p.ops[1]!)), 'accepted');
      const second = h.complete(p.ops[1]!, first.outId, '50', '48', { scrap: '2' });
      completed(await h.run(second.input, h.manager), 'accepted');
      assert.deepEqual(await balance(db, first.outId), { on_hand: '0', reserved: '0' });
      assert.deepEqual(await balance(db, second.outId), { on_hand: '48', reserved: '0' });
      assert.equal(
        (
          await db.owner.query<{ state: string }>(
            'SELECT state FROM inventory.unit WHERE unit_id=$1',
            [second.outId],
          )
        ).rows[0]?.state,
        'AVAILABLE',
      );
      assert.equal(
        (
          await db.owner.query<{ data: JsonObject }>(
            "SELECT data FROM production.source_fact WHERE kind='CONSUMPTION' AND operation_id=$1",
            [p.ops[1]],
          )
        ).rows[0]?.data.unitId,
        first.outId,
      );
      assert.equal(
        (
          await db.owner.query<{ n: number }>(
            "SELECT count(*)::int AS n FROM inventory.production_issue WHERE unit_id=$1 AND state='ACTIVE'",
            [p.source],
          )
        ).rows[0]?.n,
        1,
      );
    } finally {
      await h.app.stop();
    }
  }));
void test('unexplained mass mismatch is durable rejected; no process loss, automatic balancing or forged manager authority', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare();
      const before = await productionCounts(db);
      const wrong = h.complete(p.ops[0]!, p.source, '110', '109');
      const denied = completed(await h.run(wrong.input), 'rejected', 'GUARD_INVARIANT');
      assert.equal(completed(await h.run(wrong.input), 'rejected').replayed, true);
      assert.deepEqual((await productionCounts(db)).facts, before.facts);
      assert.deepEqual(await balance(db, p.source), { on_hand: '110', reserved: '0' });
      const leftover = h.complete(p.ops[0]!, p.source, '110', '100', { scrap: '10' });
      assert.equal((await h.run(leftover.input)).status, 'admission-denied');
      assert.equal(
        (
          await h.run(
            {
              ...leftover.input,
              payload: { ...leftover.input.payload, managerId: h.manager.principal.subject },
            },
            h.manager,
          )
        ).status,
        'admission-denied',
      );
      assert.equal(
        (
          await h.run({
            ...wrong.input,
            payload: {
              ...wrong.input.payload,
              outputs: [
                {
                  unitId: randomUUID(),
                  kg: '110',
                  kind: 'SHEET',
                  locationId: randomUUID(),
                  sourceUnitIds: [p.source],
                },
              ],
            },
          })
        ).status,
        'conflict',
      );
      assert.equal(denied.result.outcome, 'rejected');
      completed(await h.run(h.complete(p.ops[0]!, p.source).input), 'accepted');
    } finally {
      await h.app.stop();
    }
  }));
void test('known Coil to Sheet measured branch rejects fractional observed quantities without rounding and normalizes trailing zeros', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare(),
        before = await productionCounts(db);
      for (const command of [
        h.complete(p.ops[0]!, p.source, '109.5', '109.5').input,
        h.complete(p.ops[0]!, p.source, '110', '109.5', { residual: '0.5' }).input,
        h.complete(p.ops[0]!, p.source, '110', '109.5', { scrap: '0.5' }).input,
      ]) {
        completed(await h.run(command, h.manager), 'rejected', 'GUARD_INVARIANT');
        assert.equal(completed(await h.run(command, h.manager), 'rejected').replayed, true);
      }
      assert.equal((await productionCounts(db)).facts, before.facts);
      assert.deepEqual(await balance(db, p.source), { on_hand: '110', reserved: '0' });
      const valid = h.complete(p.ops[0]!, p.source, '110.0', '110.00');
      completed(await h.run(valid.input), 'accepted');
      const facts = (
        await db.owner.query<{ data: JsonObject }>(
          'SELECT data FROM production.source_fact WHERE operation_id=$1',
          [p.ops[0]],
        )
      ).rows;
      assert.ok(facts.every((f) => f.data.kg === '110'));
    } finally {
      await h.app.stop();
    }
  }));
void test('draft route revisions retain snapshots while release excludes obsolete steps and runtime replanning', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const d = await h.demand(),
        orderId = randomUUID(),
        oldOp = randomUUID(),
        first = randomUUID(),
        last = randomUUID();
      completed(await h.run(productionCommand('DraftProductionOrder', orderId, d)), 'accepted');
      completed(
        await h.run(
          productionCommand('PlanProductionOrder', orderId, {
            route: [{ id: oldOp, station: 'PLASMA' }],
          }),
        ),
        'accepted',
      );
      const route = [
        { id: first, station: 'GUILLOTINE_3M' },
        { id: last, station: 'PUNCH' },
      ];
      completed(
        await h.run(productionCommand('PlanProductionOrder', orderId, { route })),
        'accepted',
      );
      assert.equal(
        (
          await db.owner.query<{ n: number }>(
            'SELECT count(*)::int n FROM production.route_snapshot WHERE order_id=$1',
            [orderId],
          )
        ).rows[0]?.n,
        2,
      );
      completed(await h.run(productionCommand('ReleaseProductionOrder', orderId)), 'accepted');
      completed(await h.run(productionCommand('StartProductionOrder', orderId)), 'accepted');
      completed(
        await h.run(productionCommand('StartProductionOperation', oldOp)),
        'rejected',
        'GUARD_STATE',
      );
      completed(
        await h.run(productionCommand('StartProductionOperation', last)),
        'rejected',
        'GUARD_STATE',
      );
      completed(
        await h.run(
          productionCommand('PlanProductionOrder', orderId, {
            route: [{ id: randomUUID(), station: 'PLASMA' }],
          }),
        ),
        'rejected',
        'GUARD_STATE',
      );
      const empty = { inputs: [], outputs: [], residuals: [], scraps: [], finalizeUnitIds: [] };
      for (const id of [first, last]) {
        completed(await h.run(productionCommand('StartProductionOperation', id)), 'accepted');
        completed(
          await h.run(productionCommand('CompleteProductionOperation', id, empty)),
          'accepted',
        );
      }
      completed(await h.run(productionCommand('CompleteProductionOrder', orderId)), 'accepted');
      assert.equal((await productionCounts(db)).ledger, 0);
      assert.equal(
        (await h.app.productionQuery('GetProductionOrder', orderId, h.operator))?.routeVersion,
        2,
      );
    } finally {
      await h.app.stop();
    }
  }));
