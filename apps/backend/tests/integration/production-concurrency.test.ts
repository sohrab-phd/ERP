import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { withDatabase, type DatabaseFixture } from '../support/database-fixture.js';
import { completed } from '../support/receipt-harness.js';
import { balance, reservationCommand, activate } from '../support/reservation-harness.js';
import {
  productionApp,
  productionCommand,
  productionCounts,
} from '../support/production-harness.js';

async function lockedCompetition<T>(
  db: DatabaseFixture,
  unitId: string,
  launch: () => readonly Promise<T>[],
): Promise<T[]> {
  const blocker = await db.owner.connect();
  let pending: readonly Promise<T>[] = [];
  try {
    await blocker.query('BEGIN');
    const pid = (await blocker.query<{ pid: number }>('SELECT pg_backend_pid() pid')).rows[0]
      ?.pid as number;
    await blocker.query('SELECT unit_id FROM inventory.unit WHERE unit_id=$1 FOR UPDATE', [unitId]);
    pending = launch();
    let waiters = 0;
    for (let i = 0; i < 80; i++) {
      waiters = Number(
        (
          await db.owner.query<{ n: number }>(
            'WITH RECURSIVE blocked(pid) AS (SELECT pid FROM pg_stat_activity WHERE $1::int=ANY(pg_blocking_pids(pid)) UNION SELECT a.pid FROM pg_stat_activity a JOIN blocked b ON b.pid=ANY(pg_blocking_pids(a.pid))) SELECT count(*)::int n FROM blocked',
            [pid],
          )
        ).rows[0]?.n,
      );
      if (waiters >= 2) break;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    assert.ok(
      waiters >= 2,
      'both competing requests must be live in the actual PostgreSQL lock graph',
    );
    await blocker.query('COMMIT');
    return await Promise.all(pending);
  } finally {
    await blocker.query('ROLLBACK');
    await Promise.allSettled(pending);
    blocker.release();
  }
}

void test('same-key concurrent completions replay once; different keys/principals cannot consume operation twice', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare(),
        c = h.complete(p.ops[0]!, p.source);
      const results = await Promise.all([h.run(c.input), h.run(c.input)]);
      results.forEach((r) => completed(r, 'accepted'));
      assert.equal(results.filter((r) => r.status === 'completed' && r.replayed).length, 1);
      assert.equal((await h.run(c.input, h.other)).status, 'conflict');
      const q = await h.prepare(),
        d = h.complete(q.ops[0]!, q.source);
      const race = await lockedCompetition(db, q.source, () => [
        h.run(d.input),
        h.run({ ...d.input, idempotency_key: randomUUID() }, h.other),
      ]);
      assert.equal(
        race.filter((r) => r.status === 'completed' && r.result.outcome === 'accepted').length,
        1,
      );
      assert.equal(
        race.filter((r) => r.status === 'completed' && r.result.family === 'GUARD_CONFLICT').length,
        1,
      );
      assert.equal(
        (
          await db.owner.query<{ n: number }>(
            "SELECT count(*)::int n FROM production.source_fact WHERE kind='CONSUMPTION' AND operation_id=$1",
            [q.ops[0]],
          )
        ).rows[0]?.n,
        1,
      );
      assert.deepEqual(await balance(db, q.source), { on_hand: '0', reserved: '0' });
    } finally {
      await h.app.stop();
    }
  }));
void test('overlapping Production allocations may plan but only one order may physically issue a source', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const source = await h.stock('110'),
        a = await h.prepare({ source, issue: false }),
        b = await h.prepare({ source, issue: false });
      const race = await lockedCompetition(db, source, () => [h.run(a.issue), h.run(b.issue)]);
      assert.equal(
        race.filter((r) => r.status === 'completed' && r.result.outcome === 'accepted').length,
        1,
      );
      assert.equal(
        race.filter(
          (r) =>
            r.status === 'completed' &&
            r.result.outcome === 'rejected' &&
            ['GUARD_CONFLICT', 'GUARD_STATE'].includes(r.result.family ?? ''),
        ).length,
        1,
      );
      assert.equal(
        (
          await db.owner.query<{ n: number }>(
            "SELECT count(*)::int n FROM inventory.production_issue WHERE unit_id=$1 AND state='ACTIVE'",
            [source],
          )
        ).rows[0]?.n,
        1,
      );
      assert.deepEqual(await balance(db, source), { on_hand: '110', reserved: '0' });
    } finally {
      await h.app.stop();
    }
  }));
void test('Production issue competes atomically with Sales reservation without double allocation', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare({ issue: false }),
        s = await h.order([p.source], { demandedKg: '110' });
      const request = reservationCommand(s.orderId, s.itemId, p.source, '110');
      completed(await h.salesRun(request), 'accepted');
      const results = await lockedCompetition(db, p.source, () => [
        h.run(p.issue),
        h.salesRun(activate(request)),
      ]);
      assert.equal(
        results.filter((r) => r.status === 'completed' && r.result.outcome === 'accepted').length,
        1,
      );
      assert.equal(
        results.filter((r) => r.status === 'completed' && r.result.outcome === 'rejected').length,
        1,
      );
      const issues = (
        await db.owner.query<{ n: number }>(
          "SELECT count(*)::int n FROM inventory.production_issue WHERE unit_id=$1 AND state='ACTIVE'",
          [p.source],
        )
      ).rows[0]?.n;
      const stock = await balance(db, p.source);
      assert.equal(stock.on_hand, '110');
      assert.equal(stock.reserved, issues === 1 ? '0' : '110');
    } finally {
      await h.app.stop();
    }
  }));
void test('reserved shipment retains ownership against Production issue, including concurrent dispatch', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare({ issue: false }),
        s = await h.order([p.source], { demandedKg: '110' }),
        claim = await h.claim(s.orderId, s.itemId, p.source, '110'),
        ready = await h.ready(s.orderId, [claim.target.id]);
      const [issue, dispatch] = await Promise.all([
        h.run(p.issue),
        h.app.command(JSON.stringify(ready.dispatch), h.ship),
      ]);
      completed(issue, 'rejected');
      completed(dispatch, 'accepted');
      assert.deepEqual(await balance(db, p.source), { on_hand: '0', reserved: '0' });
      assert.equal(
        (
          await db.owner.query<{ n: number }>(
            'SELECT count(*)::int n FROM inventory.production_issue WHERE unit_id=$1',
            [p.source],
          )
        ).rows[0]?.n,
        0,
      );
    } finally {
      await h.app.stop();
    }
  }));
void test('Station activity posts no quantity; route order blocks skipping and intact WIP finalization adds no quantity', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare({ steps: 3 }),
        before = await productionCounts(db);
      for (const command of ['RecordStationEntry', 'DeclareStationCompletion'])
        completed(await h.run(productionCommand(command, p.ops[0]!)), 'accepted');
      completed(
        await h.run(
          productionCommand('RecordStationReferral', p.ops[0]!, { nextOperationId: p.ops[1]! }),
        ),
        'accepted',
      );
      assert.equal((await productionCounts(db)).ledger, before.ledger);
      completed(
        await h.run(productionCommand('StartProductionOperation', p.ops[2]!)),
        'rejected',
        'GUARD_STATE',
      );
      const first = h.complete(p.ops[0]!, p.source);
      completed(await h.run(first.input), 'accepted');
      const after = await productionCounts(db);
      completed(
        await h.run(
          productionCommand('RecordStationReferral', p.ops[0]!, { nextOperationId: p.ops[1]! }),
        ),
        'accepted',
      );
      completed(await h.run(productionCommand('StartProductionOperation', p.ops[1]!)), 'accepted');
      const empty = { inputs: [], outputs: [], residuals: [], scraps: [], finalizeUnitIds: [] };
      completed(
        await h.run(productionCommand('CompleteProductionOperation', p.ops[1]!, empty)),
        'accepted',
      );
      assert.equal((await productionCounts(db)).ledger, after.ledger);
      completed(await h.run(productionCommand('CompleteOperationPartial', p.orderId)), 'accepted');
      completed(await h.run(productionCommand('StartProductionOperation', p.ops[2]!)), 'accepted');
      completed(
        await h.run(
          productionCommand('CompleteProductionOperation', p.ops[2]!, {
            ...empty,
            finalizeUnitIds: [first.outId],
          }),
        ),
        'accepted',
      );
      assert.equal((await productionCounts(db)).ledger, after.ledger);
      assert.deepEqual(await balance(db, first.outId), { on_hand: '110', reserved: '0' });
      assert.equal(
        (
          await db.owner.query<{ state: string }>(
            'SELECT state FROM inventory.unit WHERE unit_id=$1',
            [first.outId],
          )
        ).rows[0]?.state,
        'AVAILABLE',
      );
      assert.equal(
        (
          await db.owner.query<{ n: number }>(
            "SELECT count(*)::int n FROM production.source_fact WHERE kind='FINALIZED'",
          )
        ).rows[0]?.n,
        1,
      );
      completed(await h.run(productionCommand('CompleteProductionOrder', p.orderId)), 'accepted');
    } finally {
      await h.app.stop();
    }
  }));
void test('aggregate multi-parent lineage cannot overclaim a shared input subset; feasible linked results succeed', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare({ kg: '1' }),
        b = await h.stock('1'),
        c = await h.stock('8');
      for (const [unitId, kg] of [
        [b, '1'],
        [c, '8'],
      ] as const) {
        const aid = randomUUID();
        completed(
          await h.run(
            productionCommand('PlanMaterialAllocation', aid, { productionOrderId: p.orderId, kg }),
          ),
          'accepted',
        );
        completed(
          await h.run(productionCommand('AssignMaterialAllocation', aid, { unitId })),
          'accepted',
        );
        completed(await h.run(productionCommand('IssueAllocatedMaterial', aid)), 'accepted');
      }
      const locationId = randomUUID(),
        inputs = [
          { unitId: p.source, kg: '1' },
          { unitId: b, kg: '1' },
          { unitId: c, kg: '8' },
        ];
      const outputs = [
        { unitId: randomUUID(), kg: '2', kind: 'SHEET', locationId, sourceUnitIds: [p.source, b] },
        { unitId: randomUUID(), kg: '2', kind: 'SHEET', locationId, sourceUnitIds: [p.source, b] },
        { unitId: randomUUID(), kg: '6', kind: 'SHEET', locationId, sourceUnitIds: [c] },
      ];
      const command = productionCommand('CompleteProductionOperation', p.ops[0]!, {
          inputs,
          outputs,
          residuals: [],
          scraps: [],
          finalizeUnitIds: [],
        }),
        before = await productionCounts(db);
      completed(await h.run(command), 'rejected', 'GUARD_INVARIANT');
      assert.equal((await productionCounts(db)).facts, before.facts);
      const valid = [
        { ...outputs[0]!, kg: '1' },
        { ...outputs[1]!, kg: '1' },
        { ...outputs[2]!, kg: '8' },
      ];
      completed(
        await h.run({
          ...command,
          idempotency_key: randomUUID(),
          payload: { ...command.payload, outputs: valid },
        }),
        'accepted',
      );
      for (const i of inputs)
        assert.deepEqual(await balance(db, i.unitId), { on_hand: '0', reserved: '0' });
      assert.equal(
        (
          await db.owner.query<{ n: number }>(
            'SELECT count(*)::int n FROM production.product_batch',
          )
        ).rows[0]?.n,
        1,
      );
      assert.equal(
        (
          await db.owner.query<{ n: number }>(
            'SELECT count(DISTINCT lot_id)::int n FROM inventory.unit WHERE unit_id=ANY($1::uuid[])',
            [valid.map((o) => o.unitId)],
          )
        ).rows[0]?.n,
        1,
      );
    } finally {
      await h.app.stop();
    }
  }));
void test('disposition authority revoked during Inventory lock wait cannot publish tentative production facts', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db),
      blocker = await db.owner.connect();
    try {
      const p = await h.prepare(),
        command = h.complete(p.ops[0]!, p.source, '110', '100', { scrap: '10' }),
        before = await productionCounts(db);
      await blocker.query('BEGIN');
      const pid = (await blocker.query<{ pid: number }>('SELECT pg_backend_pid() pid')).rows[0]
        ?.pid as number;
      await blocker.query('SELECT unit_id FROM inventory.unit WHERE unit_id=$1 FOR UPDATE', [
        p.source,
      ]);
      const pending = h.run(command.input, h.manager);
      let waiting = false;
      for (let i = 0; i < 40; i++) {
        waiting = (
          await db.owner.query<{ waiting: boolean }>(
            'SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE $1::int=ANY(pg_blocking_pids(pid))) waiting',
            [pid],
          )
        ).rows[0]?.waiting as boolean;
        if (waiting) break;
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      assert.equal(waiting, true, 'must observe real Inventory lock wait before revocation');
      assert.equal(
        (
          await db.owner.query(
            "UPDATE identity.role_grant SET production_disposition=false WHERE account_id=(SELECT account_id FROM identity.account WHERE person_id=$1::uuid) AND actor_role='ACT-PLAN'",
            [h.manager.principal.subject],
          )
        ).rowCount,
        1,
      );
      await blocker.query('COMMIT');
      completed(await pending, 'rejected', 'GUARD_ACTOR');
      assert.equal((await productionCounts(db)).facts, before.facts);
      assert.equal((await productionCounts(db)).ledger, before.ledger);
      assert.deepEqual(await balance(db, p.source), { on_hand: '110', reserved: '0' });
    } finally {
      await blocker.query('ROLLBACK');
      blocker.release();
      await h.app.stop();
    }
  }));
