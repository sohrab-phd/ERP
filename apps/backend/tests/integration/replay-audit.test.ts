import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { executeCommand, type AuditStore } from '@navard/shared-kernel';
import { withDatabase } from '../support/database-fixture.js';
import { context, harness, request } from '../support/synthetic-command.js';

void test('accepted and rejected terminal outcomes replay durably without handler reexecution', async () => {
  await withDatabase(async (db) => {
    for (const reject of [false, true]) {
      const input = request({ payload: { material: 'safe', reject } });
      const first = await harness(db).run(input);
      assert.equal(first.status, 'completed');
      // Simulate changed guard/state after restart: a fresh execution would accept.
      const restarted = harness(db, { handler: () => Promise.resolve({ outcome: 'accepted' }) });
      const replay = await restarted.run(input);
      assert.equal(replay.status, 'completed');
      if (first.status !== 'completed' || replay.status !== 'completed')
        throw new Error('Missing terminal result');
      assert.deepEqual(replay.result, first.result);
      assert.equal(replay.executionId, first.executionId);
      assert.equal(replay.replayed, true);
      assert.notEqual(replay.attemptId, first.attemptId);
      assert.equal(restarted.executions(), 0);
    }
    assert.deepEqual(await db.counts(), { facts: 1, outcomes: 2, audits: 4 });
    const original = await db.owner.query(
      'SELECT event_kind, actor_role FROM kernel.audit_event ORDER BY occurred_at',
    );
    assert.equal(
      original.rows.filter((row: { event_kind: string }) => row.event_kind === 'AUD-CMD-ACCEPTED')
        .length,
      1,
    );
    assert.equal(
      original.rows.filter((row: { event_kind: string }) => row.event_kind === 'AUD-CMD-REJECTED')
        .length,
      1,
    );
    assert.equal(
      original.rows.filter((row: { event_kind: string }) => row.event_kind === 'AUD-CMD-REPLAYED')
        .length,
      2,
    );
    assert.ok(
      original.rows.every((row: { actor_role: string }) => row.actor_role === 'ACT-FIXTURE'),
    );
  });
});

void test('every bound intent dimension conflicts while canonical equivalent object order replays', async () => {
  await withDatabase(async (db) => {
    const h = harness(db);
    const input = request();
    assert.equal((await h.run(input)).status, 'completed');
    const changed = [
      request({ ...input, command: 'TEST-Other' }),
      request({ ...input, contract_version: 2 }),
      request({ ...input, target: { ...input.target, kind: 'other' } }),
      request({ ...input, target: { ...input.target, id: randomUUID() } }),
      request({ ...input, payload: { material: 'changed', reject: false } }),
      request({ ...input, payload: { material: 'safe material', reject: null } }),
      request({ ...input, payload: { material: 'safe material' } }),
      request({ ...input, preconditions: { expected: 2 } }),
    ];
    for (const next of changed) assert.equal((await h.run(next)).status, 'conflict');
    const foreign = await h.run(
      input,
      context({ principal: { issuer: 'fixture', subject: 'bob' } }),
    );
    assert.equal(foreign.status, 'conflict');
    assert.ok(!JSON.stringify(foreign).includes('alice'));
    assert.ok(!JSON.stringify(foreign).includes('safe material'));
    const reordered = JSON.stringify({
      preconditions: { expected: 1 },
      payload: { reject: false, material: 'safe material' },
      target: { id: input.target.id, kind: 'fixture' },
      idempotency_key: input.idempotency_key,
      contract_version: 1,
      command: input.command,
    });
    const replay = await executeCommand(reordered, context(), h.ports);
    assert.equal(replay.status, 'completed');
    if (replay.status === 'completed') assert.equal(replay.replayed, true);
    assert.equal(h.executions(), 1);
    const details = await db.owner.query(
      'SELECT safe_details::text AS details FROM kernel.audit_event',
    );
    assert.ok(
      details.rows.every((row: { details: string }) => !row.details.includes('safe material')),
    );
  });
});

void test('audit failure rolls back facts/outcome; failed replay audit preserves the original', async () => {
  await withDatabase(async (db) => {
    const failure: AuditStore = {
      append: () => Promise.reject(new Error('synthetic audit outage')),
    };
    const input = request();
    assert.equal(
      (await harness(db, { ports: { audits: failure } }).run(input)).status,
      'technical',
    );
    assert.deepEqual(await db.counts(), { facts: 0, outcomes: 0, audits: 0 });
    assert.equal((await harness(db).run(input)).status, 'completed');
    assert.equal(
      (await harness(db, { ports: { audits: failure } }).run(input)).status,
      'technical',
    );
    assert.deepEqual(await db.counts(), { facts: 1, outcomes: 1, audits: 1 });
    const denied = harness(db, {
      ports: {
        authorization: {
          canExecute: () => Promise.resolve(false),
          canReplay: () => Promise.resolve(false),
        },
      },
    });
    assert.equal((await denied.run(input)).status, 'admission-denied');
    assert.equal(denied.executions(), 0);
  });
});

void test('retired readable contracts replay existing rows but never execute absent keys; restore fence denies admission', async () => {
  await withDatabase(async (db) => {
    const input = request();
    assert.equal((await harness(db).run(input)).status, 'completed');
    const retired = harness(db, { active: false });
    const replay = await retired.run(input);
    assert.equal(replay.status, 'completed');
    if (replay.status === 'completed') assert.equal(replay.replayed, true);
    assert.equal((await retired.run(request())).status, 'admission-denied');
    assert.equal(retired.executions(), 0);
    await db.owner.query('TRUNCATE kernel.command_outcome, kernel.audit_event, envelope_test.fact');
    const restored = harness(db, {
      ports: { recoveryFence: { permitsAdmission: () => Promise.resolve(false) } },
    });
    const fenced = await restored.run(input);
    assert.equal(fenced.status, 'technical');
    if (fenced.status === 'technical') assert.equal(fenced.kind, 'incompatible');
    assert.deepEqual(await db.counts(), { facts: 0, outcomes: 0, audits: 0 });
    assert.equal(restored.executions(), 0);
  });
});

void test('current resulting-resource visibility prevents replay disclosure', async () => {
  await withDatabase(async (db) => {
    const input = request();
    await harness(db).run(input);
    const restricted = harness(db, {
      ports: {
        authorization: {
          canExecute: () => Promise.resolve(true),
          canReplay: () => Promise.resolve(false),
        },
      },
    });
    const result = await restricted.run(input);
    assert.equal(result.status, 'admission-denied');
    assert.ok(!JSON.stringify(result).includes('fact_identity'));
    assert.equal(restricted.executions(), 0);
  });
});

void test('open-policy audit evidence and lifetime retention preserve exact terminal replay', async () => {
  await withDatabase(async (db) => {
    const input = request();
    const h = harness(db, {
      handler: () =>
        Promise.resolve({
          outcome: 'rejected',
          rejection: {
            family: 'GUARD_OPEN_POLICY',
            openItem: 'workshop-commercial-practice',
            message: 'Fixture policy needs evidence',
          },
        }),
    });
    const first = await h.run(input);
    assert.equal(first.status, 'completed');
    const audit = await db.owner.query<{ event_kind: string; family: string; open_item: string }>(
      'SELECT event_kind,family,open_item FROM kernel.audit_event',
    );
    assert.deepEqual(audit.rows.map((row) => row.event_kind).sort(), [
      'AUD-CMD-REJECTED',
      'AUD-OPEN-POLICY',
    ]);
    assert.ok(
      audit.rows.every(
        (row) =>
          row.family === 'GUARD_OPEN_POLICY' && row.open_item === 'workshop-commercial-practice',
      ),
    );
    assert.deepEqual(await db.counts(), { facts: 0, outcomes: 1, audits: 2 });
    await db.owner.query(
      "UPDATE kernel.command_outcome SET completed_at='2000-01-01'::timestamptz",
    );
    const restarted = harness(db);
    const replay = await restarted.run(input);
    assert.equal(replay.status, 'completed');
    if (first.status === 'completed' && replay.status === 'completed')
      assert.deepEqual(replay.result, first.result);
    assert.equal(restarted.executions(), 0);
    assert.deepEqual(await db.counts(), { facts: 0, outcomes: 1, audits: 3 });
    const relatedCount = await db.owner.query<{ count: number }>(
      "SELECT count(*)::integer AS count FROM kernel.audit_event WHERE event_kind='AUD-OPEN-POLICY'",
    );
    assert.equal(relatedCount.rows[0]?.count, 1);
    const failure = harness(db, {
      handler: () =>
        Promise.resolve({
          outcome: 'rejected',
          rejection: {
            family: 'GUARD_OPEN_POLICY',
            openItem: 'workshop-commercial-practice',
            message: 'Fixture policy needs evidence',
          },
        }),
      ports: {
        audits: {
          async append(tx, event) {
            if (event.eventKind === 'AUD-OPEN-POLICY')
              throw new Error('Fixture related audit outage');
            await db.audit.append(tx, event);
          },
        },
      },
    });
    assert.equal((await failure.run(request())).status, 'technical');
    assert.deepEqual(await db.counts(), { facts: 0, outcomes: 1, audits: 3 });
    await db.owner.query('UPDATE kernel.command_outcome SET result_schema_version=2');
    const unsupported = await restarted.run(input);
    assert.equal(unsupported.status, 'technical');
    if (unsupported.status === 'technical') assert.equal(unsupported.kind, 'incompatible');
    assert.equal(restarted.executions(), 0);
  });
});

void test('original outcome and audit share a database decision timestamp', async () => {
  await withDatabase(async (db) => {
    const before = (await db.owner.query<{ time: Date }>('SELECT clock_timestamp() AS time'))
      .rows[0]?.time;
    assert.ok(before);
    assert.equal((await harness(db).run(request())).status, 'completed');
    const after = (await db.owner.query<{ time: Date }>('SELECT clock_timestamp() AS time')).rows[0]
      ?.time;
    assert.ok(after);
    const row = (
      await db.owner.query<{ completed_at: Date; occurred_at: Date }>(
        'SELECT o.completed_at,a.occurred_at FROM kernel.command_outcome o JOIN kernel.audit_event a ON a.event_id=o.original_audit_id',
      )
    ).rows[0];
    assert.ok(row);
    assert.equal(row.completed_at.getTime(), row.occurred_at.getTime());
    assert.ok(row.completed_at >= before && row.completed_at <= after);
  });
});
