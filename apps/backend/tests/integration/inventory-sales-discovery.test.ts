import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import type { ExecutionContext } from '@navard/shared-kernel';
import { PostgresInventoryDiscoveryStore } from '../../src/infrastructure/postgresql/inventory-discovery-store.js';
import { transactionClient } from '../../src/infrastructure/postgresql/transaction.js';
import {
  InventoryReadError,
  InventorySalesDiscoveryService,
  type InventorySalesStockContext,
  type InventorySalesStockInput,
} from '../../src/modules/inventory/index.js';
import { withDatabase } from '../support/database-fixture.js';
import { inventoryDiscoveryHarness } from '../support/inventory-discovery-harness.js';
import { completed, installation } from '../support/receipt-harness.js';

void test('P4b real PostgreSQL Sales stock projection enforces owner scope, source evidence and no writes', async (t) =>
  withDatabase(async (db) => {
    const h = await inventoryDiscoveryHarness(db);
    const active = new WeakSet<InventorySalesStockContext>();
    const store = new PostgresInventoryDiscoveryStore();
    const service = new InventorySalesDiscoveryService(store, {
      canRead: (ctx) => Promise.resolve(active.has(ctx)),
    });
    async function query(
      input: InventorySalesStockInput,
      actor: ExecutionContext = h.fixture.actor,
    ) {
      const tx = await db.transactions.begin('read-snapshot');
      const ctx = { actor, transaction: tx.context };
      active.add(ctx);
      try {
        const result = await service.discover(ctx, input);
        await tx.commit();
        return result;
      } catch (error) {
        await tx.rollback();
        throw error;
      } finally {
        active.delete(ctx);
        await tx.release();
      }
    }
    try {
      const secretCode = 'PRIVATE-CUSTOMER-CONTRACT-' + randomUUID();
      const legacy = await h.legacy('9007199254740993', secretCode);
      const inbound = await h.i2();
      const beam = await h.legacy('110', 'P4B-BEAM-' + randomUUID(), 'BEAM');
      const plan = await h.fixture.prepare({ source: beam.unitId });
      const final = h.fixture.complete(plan.ops[0]!, plan.source, '70.5', '70.500');
      completed(await h.fixture.run(final.input), 'accepted');
      const foreignSales = await h.fixture.app.identity.context(
        h.fixture.people.tokens.get('foreign')!,
        'ACT-SALES',
        h.fixture.people.otherCustomerId,
      );

      await t.test(
        'legacy, I2 and same-customer production support the exact public whitelist',
        async () => {
          const before = await h.stockSnapshot();
          const coils = await query({ kind: 'COIL', limit: 50 });
          const sheets = await query({ kind: 'SHEET', limit: 50 });
          assert.ok(
            coils.some(
              (row) => row.unitId === legacy.unitId && row.availableKg === '9007199254740993',
            ),
          );
          for (const origin of inbound.origins)
            assert.ok(coils.some((row) => row.unitId === origin.unit_id));
          assert.equal(sheets.find((row) => row.unitId === final.outId)?.availableKg, '70.5');
          for (const row of [...coils, ...sheets]) {
            assert.deepEqual(
              Object.keys(row).sort(),
              ['unitId', 'internalCode', 'kind', 'state', 'availableKg'].sort(),
            );
            assert.equal(row.internalCode, null);
            assert.equal(row.state, 'AVAILABLE');
          }
          const serialized = JSON.stringify([...coils, ...sheets]);
          assert.ok(!serialized.includes(secretCode));
          assert.ok(inbound.codes.every((code) => !serialized.includes(code)));
          assert.ok(!serialized.includes(h.fixture.people.customerId));
          assert.equal(await h.stockSnapshot(), before);
        },
      );
      await t.test(
        'same customer production is hidden from another customer while organization intake remains visible',
        async () => {
          assert.deepEqual(
            await query({ kind: 'SHEET', unitId: final.outId, limit: 25 }, foreignSales),
            [],
          );
          assert.equal(
            (await query({ kind: 'COIL', unitId: legacy.unitId, limit: 25 }, foreignSales))[0]
              ?.unitId,
            legacy.unitId,
          );
        },
      );
      await t.test(
        'internal-code filters cannot distinguish present confidential codes from absent codes',
        async () => {
          for (const internalCode of [
            secretCode,
            ...inbound.codes,
            'not-present-' + randomUUID(),
          ]) {
            assert.deepEqual(await query({ kind: 'COIL', internalCode, limit: 25 }), []);
          }
        },
      );
      await t.test(
        'actual reserved and production-issued stock are excluded from candidates',
        async () => {
          const reserved = await h.legacy('11');
          const order = await h.fixture.order([reserved.unitId]);
          await h.fixture.claim(order.orderId, order.itemId, reserved.unitId);
          const issued = await h.fixture.prepare();
          assert.deepEqual(await query({ kind: 'COIL', unitId: reserved.unitId, limit: 25 }), []);
          assert.deepEqual(await query({ kind: 'COIL', unitId: issued.source, limit: 25 }), []);
        },
      );
      await t.test(
        'scoped keyset reads are ordered, bounded and do not mutate inventory',
        async () => {
          for (let i = 0; i < 12; i++) await h.legacy('11');
          const before = await h.stockSnapshot();
          const first = await query({ kind: 'COIL', limit: 10 });
          assert.equal(first.length, 11);
          assert.deepEqual(
            first.map((row) => row.unitId),
            first.map((row) => row.unitId).sort(),
          );
          const last = first[9]!.unitId;
          const second = await query({ kind: 'COIL', limit: 10, afterId: last });
          assert.ok(second.every((row) => row.unitId > last));
          assert.equal(
            new Set([...first.slice(0, 10), ...second].map((row) => row.unitId)).size,
            10 + second.length,
          );
          assert.equal(await h.stockSnapshot(), before);
        },
      );
      await t.test(
        'Balance drift fails closed rather than returning stale or zero availability',
        async () => {
          await db.owner.query(
            'UPDATE inventory.balance SET on_hand=on_hand-1 WHERE installation_id=$1 AND authority_scope=$1 AND unit_id=$2',
            [installation, legacy.unitId],
          );
          try {
            await assert.rejects(
              query({ kind: 'COIL', unitId: legacy.unitId, limit: 25 }),
              (error) => error instanceof InventoryReadError && error.status === 503,
            );
          } finally {
            await db.owner.query(
              'UPDATE inventory.balance SET on_hand=on_hand+1 WHERE installation_id=$1 AND authority_scope=$1 AND unit_id=$2',
              [installation, legacy.unitId],
            );
          }
        },
      );
      await t.test(
        'read snapshot is nonlocking while a real Inventory writer holds the Unit row',
        async () => {
          const writer = await db.owner.connect();
          const tx = await db.transactions.begin('read-snapshot');
          const ctx = { actor: h.fixture.actor, transaction: tx.context };
          active.add(ctx);
          try {
            await writer.query('BEGIN');
            await writer.query(
              'UPDATE inventory.unit SET state=state WHERE installation_id=$1 AND authority_scope=$1 AND unit_id=$2',
              [installation, legacy.unitId],
            );
            const client = transactionClient(tx.context);
            await client.query("SET LOCAL statement_timeout='1000ms'");
            const result = await service.discover(ctx, {
              kind: 'COIL',
              unitId: legacy.unitId,
              limit: 25,
            });
            assert.equal(result[0]?.unitId, legacy.unitId);
            const pid = (await client.query<{ pid: number }>('SELECT pg_backend_pid() AS pid'))
              .rows[0]!.pid;
            const locks = await db.owner.query<{ n: string }>(
              "SELECT count(*)::text AS n FROM pg_locks l LEFT JOIN pg_class c ON c.oid=l.relation LEFT JOIN pg_namespace n ON n.oid=c.relnamespace WHERE l.pid=$1 AND (l.locktype IN ('advisory','tuple') OR (n.nspname='inventory' AND l.mode IN ('RowShareLock','RowExclusiveLock','ShareRowExclusiveLock','ExclusiveLock','AccessExclusiveLock')))",
              [pid],
            );
            assert.equal(locks.rows[0]?.n, '0');
            await tx.commit();
          } catch (error) {
            await tx.rollback();
            throw error;
          } finally {
            active.delete(ctx);
            await tx.release();
            await writer.query('ROLLBACK');
            writer.release();
          }
        },
      );
    } finally {
      await h.stop();
    }
  }));
