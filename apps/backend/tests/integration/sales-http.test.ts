import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import type { JsonObject } from '@navard/shared-kernel';
import { compose } from '../../src/composition-root.js';
import { withDatabase, runTool } from '../support/database-fixture.js';
import { salesPeople, salesCommand, follow } from '../support/sales-harness.js';
import { operators, installation, receiptCommand, completed } from '../support/receipt-harness.js';

void test('composed Sales HTTP delivers scoped STOCK demand confirmation without reservation or monetary behavior', async () => {
  await withDatabase(async (db) => {
    const people = await salesPeople(db);
    const warehouse = await operators(db);
    await db.owner.query<Record<string, unknown>>(
      'UPDATE identity.role_grant SET authority_scope_id=$1 WHERE installation_id=$1',
      [installation],
    );
    await db.owner.query<Record<string, unknown>>(
      'UPDATE sales.customer SET authority_scope=$1 WHERE installation_id=$1',
      [installation],
    );
    // Same individual legitimately assigned both customers must still select and read one scope at a time.
    await db.owner.query<Record<string, unknown>>(
      "INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) SELECT installation_id,account_id,$1,actor_role,$2 FROM identity.role_grant WHERE installation_id=$1 AND actor_role='ACT-SALES' AND customer_scope=$3 AND account_id=(SELECT account_id FROM identity.account WHERE username='sales.first')",
      [installation, people.otherCustomerId, people.customerId],
    );
    const app = compose({
      nodeEnv: 'production',
      host: '127.0.0.1',
      port: 0,
      databaseUrl: process.env.TEST_DATABASE_URL!,
      installationId: installation,
      logLevel: 'error',
      commandAdmissionReconciled: true,
    });
    try {
      await app.start();
      const address = app.server.address();
      assert.ok(address && typeof address !== 'string');
      const base = `http://127.0.0.1:${address.port}`;
      const call = (path: string, input?: unknown, headers: Record<string, string> = {}) =>
        fetch(base + path, {
          method: input === undefined ? 'GET' : 'POST',
          headers: {
            authorization: `Bearer ${people.tokens.get('first')!}`,
            'x-customer-id': people.customerId,
            ...(input === undefined ? {} : { 'content-type': 'application/json' }),
            ...headers,
          },
          ...(input === undefined
            ? {}
            : { body: typeof input === 'string' ? input : JSON.stringify(input) }),
        });
      const receipt = receiptCommand();
      const wh = await app.identity.context(warehouse.tokens.get('ACT-WH')!, 'ACT-WH');
      const posted = completed(await app.command(JSON.stringify(receipt), wh), 'accepted');
      const unitId = (posted.result.data as JsonObject).unitId as string;
      const order = salesCommand(people.customerId);
      const itemId = (order.payload.items as JsonObject[])[0]!.id as string;
      const draft = await call('/sales/commands', order);
      assert.equal(draft.status, 200);
      assert.equal((await call('/sales/commands', order)).status, 200);
      const submit = follow(order, 'SubmitSalesOrder');
      assert.equal((await call('/sales/commands', submit)).status, 200);
      const assessment = {
        ...follow(order, 'DraftFulfillmentAssessment', { orderId: order.target.id }),
        target: { kind: 'fulfillment-assessment', id: randomUUID() },
      };
      assert.equal((await call('/sales/commands', assessment)).status, 200);
      const record = follow(assessment, 'RecordFulfillmentStock', {
        selections: [{ itemId, unitIds: [unitId] }],
      });
      assert.equal((await call('/sales/commands', record)).status, 200);
      const confirm = follow(order, 'ConfirmSalesOrder', { assessmentId: assessment.target.id });
      assert.equal((await call('/sales/commands', confirm)).status, 200);
      const replay = await call('/sales/commands', confirm);
      assert.equal(replay.status, 200);
      assert.equal(((await replay.json()) as { replayed: boolean }).replayed, true);
      for (const input of [order, submit, assessment, record, confirm]) {
        const response = await call('/sales/commands', input);
        assert.equal(response.status, 200);
        assert.equal(((await response.json()) as { replayed: boolean }).replayed, true);
      }
      for (const input of [order, submit, assessment, record, confirm])
        assert.equal(
          (await call('/sales/commands', input, { 'x-customer-id': people.otherCustomerId }))
            .status,
          403,
        );
      for (const path of [
        `/sales/orders/${order.target.id}`,
        `/sales/assessments/${assessment.target.id}`,
      ]) {
        const read = await call(path);
        assert.equal(read.status, 200);
        const text = await read.text();
        assert.ok(
          !text.includes('binding') &&
            !text.includes('orderBinding') &&
            !text.includes(people.tokens.get('first')!),
        );
        assert.equal(
          (await call(path, undefined, { 'x-customer-id': people.otherCustomerId })).status,
          404,
        );
        assert.equal((await call(path, undefined, { 'x-customer-id': randomUUID() })).status, 403);
      }
      assert.equal(
        (
          await call('/sales/commands', order, {
            authorization: `Bearer ${warehouse.tokens.get('ACT-WH')!}`,
          })
        ).status,
        403,
      );
      assert.equal((await call('/sales/commands', order, { 'x-erp-role': 'ACT-SEC' })).status, 403);
      assert.equal(
        (await call('/sales/commands', order, { origin: 'https://untrusted.example.invalid' }))
          .status,
        403,
      );
      assert.equal(
        (await call('/sales/commands', order, { authorization: 'Bearer invalid' })).status,
        401,
      );
      assert.equal(
        (await call('/sales/commands', { ...order, command: 'PostGoodsReceipt' })).status,
        400,
      );
      assert.equal(
        (
          await call(
            '/sales/commands',
            JSON.stringify(order).replace('"demandedKg":"5"', '"demandedKg":"5","demandedKg":"6"'),
          )
        ).status,
        400,
      );
      assert.equal((await call('/sales/commands', 'x'.repeat(4097))).status, 400);
      const invalid = salesCommand(people.customerId, {
        payload: {
          ...order.payload,
          items: [{ ...(order.payload.items as JsonObject[])[0]!, demandedKg: '0' }],
        },
      });
      assert.equal((await call('/sales/commands', invalid)).status, 422);
      const rejectedReplay = await call('/sales/commands', invalid);
      assert.equal(rejectedReplay.status, 422);
      assert.equal(((await rejectedReplay.json()) as { replayed: boolean }).replayed, true);
      const changed = { ...confirm, payload: { assessmentId: randomUUID() } };
      assert.equal((await call('/sales/commands', changed)).status, 409);
      const duplicateHeaderStatus = await new Promise<number>((resolve, reject) => {
        const req = httpRequest(
          base + `/sales/orders/${order.target.id}`,
          {
            headers: [
              'Host',
              new URL(base).host,
              'Authorization',
              `Bearer ${people.tokens.get('first')!}`,
              'X-Customer-Id',
              people.customerId,
              'X-Customer-Id',
              people.customerId,
            ],
          },
          (res) => {
            res.resume();
            resolve(res.statusCode!);
          },
        );
        req.on('error', reject);
        req.end();
      });
      assert.equal(duplicateHeaderStatus, 403);
      const rows = (
        await db.owner.query<Record<string, unknown>>(
          'SELECT state,commercial_terms,confirmed_at FROM sales.sales_order WHERE order_id=$1',
          [order.target.id],
        )
      ).rows;
      assert.equal(rows[0]?.state, 'CONFIRMED');
      assert.equal(rows[0]?.commercial_terms, 'NOT_SUPPLIED');
      assert.ok(rows[0]?.confirmed_at);
      assert.equal(
        (
          await db.owner.query<Record<string, unknown>>(
            'SELECT count(*)::int AS n FROM inventory.ledger',
          )
        ).rows[0]?.n,
        1,
      );
      assert.equal(
        (
          await db.owner.query<Record<string, unknown>>(
            'SELECT count(*)::int AS n FROM inventory.reservation',
          )
        ).rows[0]?.n,
        0,
      );
      await db.owner.query<Record<string, unknown>>(
        "DELETE FROM identity.role_grant WHERE installation_id=$1 AND actor_role='ACT-SALES' AND customer_scope=$2",
        [installation, people.customerId],
      );
      assert.equal((await call('/sales/commands', confirm)).status, 403);
      assert.equal((await call(`/sales/orders/${order.target.id}`)).status, 403);
    } finally {
      await app.stop();
    }
  });
});

void test('explicit customer configuration tool is owner-only, local, bounded and does not edit existing snapshots', async () => {
  await withDatabase(async (db) => {
    const id = randomUUID();
    const args = [
      '--installation-ack',
      installation,
      '--authority-scope',
      installation,
      '--customer-id',
      id,
    ];
    // The executable consumes protected stdin; use a local child with no command-line customer data.
    const { spawn } = await import('node:child_process');
    const provision = (body: string, owner = true) =>
      new Promise<{ code: number | null; out: string }>((resolve, reject) => {
        const child = spawn(process.execPath, ['tools/sales/provision-customer.mjs', ...args], {
          cwd: process.cwd(),
          env: {
            ...process.env,
            INSTALLATION_ID: installation,
            ...(owner ? {} : { MIGRATION_DATABASE_URL: process.env.TEST_DATABASE_URL }),
          },
          stdio: ['pipe', 'pipe', 'pipe'],
        });
        let out = '';
        child.stdout.on('data', (c) => (out += String(c)));
        child.stderr.on('data', (c) => (out += String(c)));
        child.on('error', reject);
        child.on('close', (code) => resolve({ code, out }));
        child.stdin.end(body);
      });
    assert.equal(
      (await provision('{"displayName":"Synthetic configured customer"}', false)).code,
      1,
    );
    assert.equal(
      (
        await db.owner.query<Record<string, unknown>>(
          'SELECT count(*)::int AS n FROM sales.customer',
        )
      ).rows[0]?.n,
      0,
    );
    assert.equal((await provision('{"displayName":"Synthetic configured customer"}')).code, 0);
    assert.equal((await provision('{"displayName":"Synthetic configured customer"}')).code, 0);
    assert.equal((await provision('{"displayName":"Changed configuration"}')).code, 1);
    assert.equal((await provision('{"displayName":"one","displayName":"two"}')).code, 1);
    assert.equal(
      (
        await db.owner.query<Record<string, unknown>>(
          'SELECT display_name FROM sales.customer WHERE customer_id=$1',
          [id],
        )
      ).rows[0]?.display_name,
      'Synthetic configured customer',
    );
    await assert.rejects(
      runTool('tools/sales/provision-customer.mjs', [], { INSTALLATION_ID: installation }),
    );
  });
});
