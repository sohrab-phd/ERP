import { compose } from '../../src/composition-root.js';
import { installation } from '../support/receipt-harness.js';
import { fork } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';
import { Pool } from 'pg';
import { executeCommand, CommandRegistry } from '@navard/shared-kernel';
import { IdentityAuthorization } from '../../src/modules/identity/index.js';
import { PostgresTransactions } from '../../src/infrastructure/postgresql/transaction.js';
import { withDatabase } from '../support/database-fixture.js';
import { completed } from '../support/receipt-harness.js';
import { balance } from '../support/reservation-harness.js';
import { lostCommitProxy } from '../support/crash-child.js';
import { productionApp, productionCounts } from '../support/production-harness.js';
void test('failures after tentative owner writes restore the entire Production/IPS/audit/outcome bundle', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare(),
        c = h.complete(p.ops[0]!, p.source, '110', '70', { residual: '20', scrap: '20' }),
        before = await productionCounts(db);
      for (const [table, timing, condition] of [
        ['production.source_fact', 'INSERT', "NEW.kind='OUTPUT'"],
        ['production.product_batch', 'INSERT', 'true'],
        ['inventory.unit', 'INSERT', `NEW.unit_id='${c.outId}'::uuid`],
        ['inventory.ledger', 'INSERT', 'NEW.on_hand_delta>0'],
        ['inventory.production_origin', 'INSERT', 'true'],
        ['inventory.production_issue', 'UPDATE', "NEW.state='COMPLETED'"],
        ['production.operation', 'UPDATE', "NEW.state='COMPLETED'"],
        ['kernel.command_outcome', 'INSERT', 'true'],
        ['kernel.audit_event', 'INSERT', 'true'],
      ] as const) {
        await db.owner.query(
          `CREATE FUNCTION production.test_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF ${condition} THEN RAISE EXCEPTION 'Synthetic production outage' USING ERRCODE='XX000'; END IF; RETURN NEW; END $$`,
        );
        await db.owner.query(
          `CREATE TRIGGER test_failure BEFORE ${timing} ON ${table} FOR EACH ROW EXECUTE FUNCTION production.test_failure()`,
        );
        try {
          assert.equal((await h.run(c.input, h.manager)).status, 'technical', table);
          assert.deepEqual(await productionCounts(db), before, table);
          assert.deepEqual(await balance(db, p.source), { on_hand: '110', reserved: '0' });
          assert.equal(
            (
              await db.owner.query<{ state: string }>(
                'SELECT state FROM production.operation WHERE operation_id=$1',
                [p.ops[0]],
              )
            ).rows[0]?.state,
            'IN_PROGRESS',
          );
          assert.equal(
            (
              await db.owner.query<{ n: number }>(
                'SELECT count(*)::int n FROM inventory.unit WHERE unit_id=ANY($1::uuid[])',
                [[c.outId, c.residualId]],
              )
            ).rows[0]?.n,
            0,
          );
          assert.equal(
            (
              await db.owner.query<{ n: number }>(
                'SELECT count(*)::int n FROM production.product_batch',
              )
            ).rows[0]?.n,
            0,
          );
          assert.equal(
            (
              await db.owner.query<{ n: number }>(
                'SELECT count(*)::int n FROM inventory.production_origin',
              )
            ).rows[0]?.n,
            0,
          );
          assert.equal(
            (
              await db.owner.query<{ state: string }>(
                'SELECT state FROM inventory.production_issue WHERE unit_id=$1',
                [p.source],
              )
            ).rows[0]?.state,
            'ACTIVE',
          );
        } finally {
          await db.owner.query(`DROP TRIGGER test_failure ON ${table}`);
          await db.owner.query('DROP FUNCTION production.test_failure()');
        }
      }
      completed(await h.run(c.input, h.manager), 'accepted');
      assert.deepEqual(await balance(db, p.source), { on_hand: '0', reserved: '0' });
    } finally {
      await h.app.stop();
    }
  }));
void test('lost confirmed Production COMMIT reply recovers durable outcome and batch without repeating stock', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db),
      proxy = await lostCommitProxy(process.env.TEST_DATABASE_URL!),
      pool = new Pool({ connectionString: proxy.url });
    pool.on('error', () => undefined);
    try {
      const p = await h.prepare(),
        c = h.complete(p.ops[0]!, p.source),
        contracts = h.app.production.contracts();
      const result = await executeCommand(JSON.stringify(c.input), h.operator, {
        registry: new CommandRegistry(contracts),
        transactions: new PostgresTransactions(pool),
        outcomes: db.outcomes,
        audits: db.audit,
        authorization: new IdentityAuthorization(
          h.app.identity,
          contracts.map((contract) => ({
            command: contract.command,
            version: 1,
            roles: ['ACT-OP' as const],
            canTarget: () => Promise.resolve(true),
            canDisclose: () => Promise.resolve(true),
          })),
        ),
        recoveryFence: { permitsAdmission: () => Promise.resolve(true) },
      });
      assert.equal(result.status, 'technical');
      if (result.status === 'technical') assert.equal(result.kind, 'uncertain');
      assert.equal(proxy.commitConfirmed(), true);
      const before = await productionCounts(db),
        retry = completed(await h.run(c.input), 'accepted');
      assert.equal(retry.replayed, true);
      const after = await productionCounts(db);
      assert.equal(after.facts, before.facts);
      assert.equal(after.ledger, before.ledger);
      assert.equal(after.outcomes, before.outcomes);
      assert.equal(after.audits, before.audits + 1);
      assert.deepEqual(await balance(db, p.source), { on_hand: '0', reserved: '0' });
      assert.deepEqual(await balance(db, c.outId), { on_hand: '110', reserved: '0' });
      const batch = (
        await db.owner.query<{ batch_id: string }>('SELECT batch_id FROM production.product_batch')
      ).rows[0]?.batch_id;
      assert.ok(batch);
      assert.notEqual(batch, c.outId);
      assert.equal(
        (
          await db.owner.query<{ lot_id: string }>(
            'SELECT lot_id FROM inventory.unit WHERE unit_id=$1',
            [c.outId],
          )
        ).rows[0]?.lot_id,
        batch,
      );
    } finally {
      await pool.end();
      await proxy.close();
      await h.app.stop();
    }
  }));
void test('actual process crashes at owner/audit/outcome/commit windows leave all or none and recover with same key', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      for (const stage of [
        'after-handler',
        'before-audit',
        'before-outcome',
        'before-commit',
        'after-commit',
      ]) {
        const p = await h.prepare(),
          c = h.complete(p.ops[0]!, p.source),
          before = await productionCounts(db);
        const child = fork(
          fileURLToPath(new URL('../support/production-crash.js', import.meta.url)),
          ['--production-crash', stage, Buffer.from(JSON.stringify(c.input)).toString('base64')],
          { stdio: ['ignore', 'pipe', 'pipe', 'ipc'] },
        );
        child.stdout?.resume();
        child.stderr?.resume();
        const exited = new Promise<void>((resolve) => child.once('exit', () => resolve()));
        try {
          const reached = new Promise<unknown>((resolve, reject) => {
            const timer = setTimeout(
              () => reject(new Error('Production child checkpoint timeout')),
              10000,
            );
            child.once('message', (m) => {
              clearTimeout(timer);
              resolve(m);
            });
            child.once('error', (e) => {
              clearTimeout(timer);
              reject(e);
            });
          });
          child.send({ token: h.people.tokens.get('operator')!, customer: h.people.customerId });
          assert.deepEqual(await reached, { stage });
        } finally {
          child.kill('SIGKILL');
          await exited;
        }
        const after = await productionCounts(db),
          committed = stage === 'after-commit';
        assert.equal(after.facts, before.facts + (committed ? 2 : 0));
        assert.equal(after.ledger, before.ledger + (committed ? 2 : 0));
        assert.equal(after.outcomes, before.outcomes + (committed ? 1 : 0));
        assert.equal(after.audits, before.audits + (committed ? 1 : 0));
        assert.deepEqual(await balance(db, p.source), {
          on_hand: committed ? '0' : '110',
          reserved: '0',
        });
        const recovered = completed(await h.run(c.input), 'accepted');
        assert.equal(recovered.replayed, committed);
        assert.deepEqual(await balance(db, c.outId), { on_hand: '110', reserved: '0' });
        assert.equal(
          (
            await db.owner.query<{ n: number }>(
              'SELECT count(*)::int n FROM inventory.ledger WHERE command_id=$1 AND unit_id=ANY($2::uuid[])',
              ['CompleteProductionOperation', [p.source, c.outId]],
            )
          ).rows[0]?.n,
          2,
        );
      }
    } finally {
      await h.app.stop();
    }
  }));
void test('default unreconciled production recovery fence denies valid completion without stock or source writes', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db),
      fenced = compose({
        nodeEnv: 'production',
        host: '127.0.0.1',
        port: 0,
        databaseUrl: process.env.TEST_DATABASE_URL!,
        installationId: installation,
        logLevel: 'error',
      });
    try {
      const p = await h.prepare(),
        before = await productionCounts(db),
        actor = await fenced.identity.context(
          h.people.tokens.get('operator')!,
          'ACT-OP',
          h.people.customerId,
        );
      assert.equal(
        (await fenced.command(JSON.stringify(h.complete(p.ops[0]!, p.source).input), actor)).status,
        'technical',
      );
      assert.deepEqual(await productionCounts(db), before);
      assert.deepEqual(await balance(db, p.source), { on_hand: '110', reserved: '0' });
    } finally {
      await fenced.stop();
      await h.app.stop();
    }
  }));
