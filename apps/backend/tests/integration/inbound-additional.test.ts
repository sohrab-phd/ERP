import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import { CommandRegistry, executeCommand, type CommandRequest } from '@navard/shared-kernel';
import { PostgresInboundStore } from '../../src/infrastructure/postgresql/inbound-store.js';
import { transactionClient } from '../../src/infrastructure/postgresql/transaction.js';
import type { InboundContext } from '../../src/modules/procurement/index.js';
import { withDatabase } from '../support/database-fixture.js';
import {
  completed,
  inboundHarness,
  inboundPeople,
  optionCommand,
  orderCommand,
} from '../support/inbound-harness.js';
import { request } from '../support/synthetic-command.js';
import { compose } from '../../src/composition-root.js';
import { receiptCommand } from '../support/receipt-harness.js';
import { purchaseCommand, proformaCommand } from '../support/purchase-harness.js';

void test('A20: full original array/optional presence binds; controlled admitted alternate version conflicts without executing', async () => {
  await withDatabase(async (db) => {
    const people = await inboundPeople(db),
      actor = await people.proc.actor();
    const h = inboundHarness(db, people.identity),
      material = optionCommand();
    completed(await h.run(material, actor), 'accepted');
    const original = orderCommand(material.target.id);
    const line = (original.payload.lines as readonly Record<string, string>[])[0]!;
    const ordered: CommandRequest = {
      ...original,
      payload: {
        ...original.payload,
        lines: [
          { ...line, itemNumber: 'first' },
          { ...line, itemNumber: 'second' },
        ],
      },
    };
    completed(await h.run(ordered, actor), 'accepted');
    const array = ordered.payload.lines as readonly Record<string, string>[];
    assert.equal(
      (
        await h.run(
          { ...ordered, payload: { ...ordered.payload, lines: [...array].reverse() } },
          actor,
        )
      ).status,
      'conflict',
    );
    assert.equal(
      (
        await h.run(
          {
            ...ordered,
            payload: {
              ...ordered.payload,
              lines: [{ ...array[0]!, ralColorNumber: 'new optional' }, array[1]!],
            },
          },
          actor,
        )
      ).status,
      'conflict',
    );
    assert.equal(
      (await h.run({ ...ordered, contract_version: 2 }, actor)).status,
      'admission-denied',
    );
    let executed = 0;
    const v1 = h.service.contracts().find((c) => c.command === ordered.command)!;
    const registry = new CommandRegistry([
      ...h.service.contracts(),
      {
        ...v1,
        version: 2,
        execute: () => {
          executed++;
          return Promise.reject(new Error('Alternate version must not execute'));
        },
      },
    ]);
    // Test-only admission policy; production remains exactly the accepted active v1 commands.
    const authorization = {
      canExecute: (
        ctx: Parameters<typeof h.ports.authorization.canExecute>[0],
        r: CommandRequest,
        tx?: Parameters<typeof h.ports.authorization.canExecute>[2],
      ) => h.ports.authorization.canExecute(ctx, { ...r, contract_version: 1 }, tx),
      canReplay: h.ports.authorization.canReplay.bind(h.ports.authorization),
    };
    const changed = await executeCommand(
      JSON.stringify({ ...ordered, contract_version: 2 }),
      actor,
      { ...h.ports, registry, authorization },
    );
    assert.equal(changed.status, 'conflict');
    assert.equal(executed, 0);
    assert.equal(
      (
        await db.owner.query<{ n: number }>(
          'SELECT count(*)::int AS n FROM procurement.operational_purchase_order',
        )
      ).rows[0]!.n,
      1,
    );
  });
});

void test('A26: shared catalogue default50/max100 keyset pages preserve exact stable identities across both roles', async () => {
  await withDatabase(async (db) => {
    const people = await inboundPeople(db),
      actor = await people.proc.actor();
    const h = inboundHarness(db, people.identity);
    const ids: string[] = [];
    for (let index = 0; index < 101; index++) {
      const command = optionCommand('COLOR', 'paging-' + index);
      completed(await h.run(command, actor), 'accepted');
      ids.push(command.target.id);
    }
    type Page = {
      items: { optionId: string; catalogue: string; label: string }[];
      nextAfterId?: string;
    };
    const first = (await h.query(
      'ListInboundCatalogueOptions',
      { catalogue: 'COLOR' },
      await people.wh.actor(),
    )) as Page;
    assert.equal(first.items.length, 50);
    assert.equal(first.nextAfterId, first.items.at(-1)!.optionId);
    const second = (await h.query(
      'ListInboundCatalogueOptions',
      { catalogue: 'COLOR', afterId: first.nextAfterId },
      actor,
    )) as Page;
    assert.equal(second.items.length, 50);
    const third = (await h.query(
      'ListInboundCatalogueOptions',
      { catalogue: 'COLOR', afterId: second.nextAfterId },
      await people.wh.actor(),
    )) as Page;
    assert.equal(third.items.length, 1);
    assert.equal(third.nextAfterId, undefined);
    assert.deepEqual(
      [...first.items, ...second.items, ...third.items].map((x) => x.optionId),
      [...ids].sort(),
    );
    const maximum = (await h.query(
      'ListInboundCatalogueOptions',
      { catalogue: 'COLOR', limit: 100 },
      actor,
    )) as Page;
    assert.equal(maximum.items.length, 100);
    assert.equal(maximum.nextAfterId, maximum.items.at(-1)!.optionId);
    const tail = (await h.query(
      'ListInboundCatalogueOptions',
      { catalogue: 'COLOR', limit: 100, afterId: maximum.nextAfterId },
      actor,
    )) as Page;
    assert.equal(tail.items.length, 1);
    assert.equal(tail.nextAfterId, undefined);
    const exact = (await h.query(
      'ListInboundCatalogueOptions',
      { catalogue: 'COLOR', exactLabel: 'paging-50' },
      actor,
    )) as Page;
    assert.equal(exact.items.length, 1);
    assert.equal(exact.items[0]!.label, 'paging-50');
    assert.equal(exact.nextAfterId, undefined);
  });
});

void test('A24: production owner locking sorts signed hash keys before waits and safely handles opposed/duplicate resources', async () => {
  await withDatabase(async (db) => {
    const people = await inboundPeople(db),
      actor = await people.proc.actor();
    const resources = Array.from({ length: 32 }, (_, n) => 'i1-ordering-fixture-' + n);
    const keys = (
      await db.owner.query<{ value: string; key: string }>(
        'SELECT value,hashtextextended(value,0) AS key FROM unnest($1::text[]) x(value) ORDER BY key',
        [resources],
      )
    ).rows;
    const low = keys[0]!,
      high = keys.at(-1)!;
    assert.ok(BigInt(low.key) < 0n && BigInt(high.key) > 0n);
    const blocker = await db.owner.connect(),
      one = await db.transactions.begin(),
      two = await db.transactions.begin();
    const context = (tx: typeof one): InboundContext => ({
      actor,
      transaction: tx.context,
      request: request(),
    });
    const firstClient = transactionClient(one.context),
      secondClient = transactionClient(two.context);
    const firstPid = (await firstClient.query<{ pid: number }>('SELECT pg_backend_pid() AS pid'))
      .rows[0]!.pid;
    const secondPid = (await secondClient.query<{ pid: number }>('SELECT pg_backend_pid() AS pid'))
      .rows[0]!.pid;
    const state = async (pid: number, key: string) =>
      (
        await db.owner.query<{ granted: boolean }>(
          "SELECT granted FROM pg_locks WHERE pid=$1 AND locktype='advisory' AND objsubid=1 AND ((classid::bigint<<32)|objid::bigint)=$2::bigint",
          [pid, key],
        )
      ).rows[0]?.granted;
    async function waitFor(check: () => Promise<boolean>) {
      const deadline = Date.now() + 3000;
      while (Date.now() < deadline) {
        if (await check()) return;
        await delay(10);
      }
      assert.fail('Expected real signed advisory-lock wait was not observed');
    }
    let first: Promise<void> | undefined, second: Promise<void> | undefined;
    try {
      await blocker.query('BEGIN');
      await blocker.query('SELECT pg_advisory_xact_lock($1::bigint)', [low.key]);
      first = new PostgresInboundStore().lock(context(one), [high.value, low.value, high.value]);
      void first.catch(() => undefined);
      await waitFor(async () => (await state(firstPid, low.key)) === false);
      assert.equal(
        await state(firstPid, high.key),
        undefined,
        'Numerically higher key must not be taken before the blocked lower key',
      );
      await blocker.query('ROLLBACK');
      await first;
      assert.equal(await state(firstPid, low.key), true);
      assert.equal(await state(firstPid, high.key), true);
      const held = await db.owner.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM pg_locks WHERE pid=$1 AND locktype='advisory' AND objsubid=1 AND granted",
        [firstPid],
      );
      assert.equal(
        held.rows[0]!.n,
        2,
        'Duplicate input hash routes to the same held key, not another identity',
      );
      second = new PostgresInboundStore().lock(context(two), [low.value, high.value, low.value]);
      void second.catch(() => undefined);
      await waitFor(async () => (await state(secondPid, low.key)) === false);
      assert.equal(await state(secondPid, high.key), undefined);
      await one.commit();
      await second;
      await two.commit();
    } finally {
      await blocker.query('ROLLBACK');
      blocker.release();
      await one.rollback();
      await two.rollback();
      await Promise.allSettled([first, second].filter((p): p is Promise<void> => p !== undefined));
      await one.release();
      await two.release();
    }
    assert.equal(
      (
        await db.owner.query<{ n: number }>(
          'SELECT count(*)::int AS n FROM procurement.operational_purchase_order',
        )
      ).rows[0]!.n,
      0,
    );
  });
});

void test('A24: controlled distinct-resource hash collision serializes real owner locks without merging business identities', async () => {
  await withDatabase(async (db) => {
    const people = await inboundPeople(db);
    const schema = 'inbound_hash_fixture_' + randomUUID().replaceAll('-', '');
    const role = '"' + db.runtimeRole.replaceAll('"', '""') + '"';
    await db.owner.query(`CREATE SCHEMA ${schema}`);
    try {
      await db.owner.query(
        `CREATE FUNCTION ${schema}.hashtextextended(text,bigint) RETURNS bigint LANGUAGE sql IMMUTABLE STRICT AS $$ SELECT 918273645546372819::bigint $$`,
      );
      await db.owner.query(
        `REVOKE ALL ON FUNCTION ${schema}.hashtextextended(text,bigint) FROM PUBLIC`,
      );
      await db.owner.query(`GRANT USAGE ON SCHEMA ${schema} TO ${role}`);
      await db.owner.query(
        `GRANT EXECUTE ON FUNCTION ${schema}.hashtextextended(text,bigint) TO ${role}`,
      );
      const transactions = {
        async begin() {
          const tx = await db.transactions.begin();
          await transactionClient(tx.context).query(`SET LOCAL search_path=${schema},pg_catalog`);
          return tx;
        },
      };
      let arrivals = 0,
        release!: () => void,
        reject!: (error: Error) => void;
      const ready = new Promise<void>((resolve, fail) => {
        release = resolve;
        reject = fail;
      });
      const timer = setTimeout(
        () => reject(new Error('Distinct actors did not reach the collision fixture')),
        8000,
      );
      const store = new PostgresInboundStore();
      const collisionStore = {
        lock: async (ctx: InboundContext, resources: readonly string[]) => {
          const actual = await transactionClient(ctx.transaction).query<{ n: number }>(
            'SELECT count(DISTINCT hashtextextended(value,0))::int AS n FROM unnest($1::text[]) x(value)',
            [[...resources]],
          );
          assert.equal(actual.rows[0]!.n, 1);
          assert.equal(new Set(resources).size, 2);
          if (++arrivals === 2) release();
          await ready;
          await store.lock(ctx, resources);
        },
        order: store.order.bind(store),
        orderByReference: store.orderByReference.bind(store),
        options: store.options.bind(store),
        listOptions: store.listOptions.bind(store),
        insertOption: store.insertOption.bind(store),
        insertOrder: store.insertOrder.bind(store),
      };
      try {
        const h = inboundHarness(db, people.identity, {
          store: collisionStore,
          ports: { transactions },
        });
        const inputs = [
          optionCommand('COLOR', 'collision-source-a'),
          optionCommand('COLOR', 'collision-source-b'),
        ];
        const actors = [await people.proc.actor(), await people.proc2.actor()];
        const results = await Promise.all(inputs.map((r, i) => h.run(r, actors[i]!)));
        for (const result of results) completed(result, 'accepted');
        assert.equal(arrivals, 2);
        const rows = (
          await db.owner.query<{ optionId: string; label: string }>(
            'SELECT option_id AS "optionId",label FROM procurement.inbound_catalogue_option ORDER BY label',
          )
        ).rows;
        assert.deepEqual(
          rows.map((row) => row.label),
          ['collision-source-a', 'collision-source-b'],
        );
        assert.deepEqual(
          rows.map((row) => row.optionId),
          inputs.map((r) => r.target.id),
        );
      } finally {
        clearTimeout(timer);
        release();
      }
    } finally {
      await db.owner.query(`DROP SCHEMA ${schema} CASCADE`);
    }
  });
});

void test('A02/A25: existing manual stock and purchase/proforma sources remain byte-equivalent across successful and rejected I1 commands', async () => {
  await withDatabase(async (db) => {
    const people = await inboundPeople(db);
    const app = compose({
      nodeEnv: 'production',
      host: '127.0.0.1',
      port: 0,
      databaseUrl: process.env.TEST_DATABASE_URL!,
      installationId: people.factory,
      logLevel: 'error',
      commandAdmissionReconciled: true,
    });
    try {
      const proc = await app.identity.context(people.proc.token, 'ACT-PROC');
      const wh = await app.identity.context(people.wh.token, 'ACT-WH');
      completed(await app.command(JSON.stringify(receiptCommand()), wh), 'accepted');
      const purchase = purchaseCommand({
        payload: {
          purchaseDocumentReference: ' PO-۱۲ ',
          supplierReference: 'Synthetic independent seller evidence',
          purchaseDate: '2026-10-21',
          materialDescription: 'Synthetic already completed purchase',
        },
      });
      completed(await app.command(JSON.stringify(purchase), proc), 'accepted');
      completed(
        await app.command(JSON.stringify(proformaCommand(purchase.target.id)), proc),
        'accepted',
      );
      const foreignSources = [
        'procurement.goods_receipt',
        'procurement.completed_purchase',
        'procurement.purchase_proforma_sent',
        'inventory.material_lot',
        'inventory.unit',
        'inventory.ledger',
        'inventory.balance',
        'inventory.reservation',
        'inventory.reservation_request',
        'inventory.production_issue',
        'inventory.production_origin',
        'sales.customer',
        'sales.sales_order',
        'sales.fulfillment_assessment',
        'sales.make_reference',
        'shipping.package',
        'shipping.package_content',
        'shipping.shipment',
        'shipping.dispatch',
        'production.production_order',
        'production.operation',
        'production.allocation',
        'production.product_batch',
        'production.source_fact',
        'production.route_snapshot',
        'finance.invoice_evidence',
      ] as const;
      async function snapshot() {
        const result: Record<string, string[]> = {};
        for (const table of foreignSources) {
          // Fixed test-only source whitelist, never an HTTP/caller identifier.
          result[table] = (
            await db.owner.query<{ value: string }>(
              `SELECT row_to_json(source)::text AS value FROM ${table} source ORDER BY row_to_json(source)::text`,
            )
          ).rows.map((row) => row.value);
        }
        return result;
      }
      const before = await snapshot();
      assert.equal(before['inventory.unit']!.length, 1);
      assert.equal(before['procurement.completed_purchase']!.length, 1);
      const material = optionCommand();
      completed(await app.command(JSON.stringify(material), wh), 'accepted');
      const order = orderCommand(material.target.id);
      completed(await app.command(JSON.stringify(order), proc), 'accepted');
      completed(
        await app.command(JSON.stringify(orderCommand(material.target.id)), proc),
        'rejected',
        'GUARD_CONFLICT',
      );
      completed(
        await app.command(
          JSON.stringify(
            orderCommand(material.target.id, {
              payload: {
                ...order.payload,
                orderReference: 'bad field',
                registrationDateJalali: '1404-12-30',
              },
            }),
          ),
          proc,
        ),
        'rejected',
        'GUARD_INVARIANT',
      );
      assert.deepEqual(await snapshot(), before);
      const read = (await app.inboundQuery(
        'GetOperationalPurchaseOrderByReference',
        { orderReference: 'po-١٢' },
        wh,
      )) as { orderId: string };
      assert.equal(read.orderId, order.target.id);
      assert.notEqual(read.orderId, purchase.target.id);
    } finally {
      await app.stop();
    }
  });
});
