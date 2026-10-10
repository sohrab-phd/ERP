import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import type { ExecutionResult } from '@navard/shared-kernel';
import { compose } from '../../src/composition-root.js';
import { withDatabase } from '../support/database-fixture.js';
import {
  invoicePeople,
  invoiceCommand,
  installation,
  invoiceCounts,
} from '../support/invoice-evidence-harness.js';
import { receiptCommand } from '../support/receipt-harness.js';

void test('composed invoice evidence HTTP records and replays matched Sales evidence, safely reads with SALES/FIN and rejects excluded roles and fields', async () => {
  await withDatabase(async (db) => {
    const people = await invoicePeople(db, { seedOrder: false });
    await db.owner.query(
      'UPDATE identity.role_grant SET authority_scope_id=$1 WHERE installation_id=$1',
      [installation],
    );
    await db.owner.query('UPDATE sales.customer SET authority_scope=$1 WHERE installation_id=$1', [
      installation,
    ]);
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
      const base = `http://127.0.0.1:${address.port}`,
        token = people.tokens.get('ACT-SALES')!;
      const call = (path: string, input?: unknown, headers: Record<string, string> = {}) =>
        fetch(base + path, {
          method: input === undefined ? 'GET' : 'POST',
          headers: {
            authorization: `Bearer ${token}`,
            ...(input === undefined ? {} : { 'content-type': 'application/json' }),
            ...headers,
          },
          ...(input === undefined
            ? {}
            : { body: typeof input === 'string' ? input : JSON.stringify(input) }),
        });
      assert.equal(
        (await call('/sales/commands', people.draft, { 'x-customer-id': people.customerId }))
          .status,
        200,
      );
      const before = (await db.owner.query('SELECT * FROM sales.sales_order')).rows;
      const input = invoiceCommand(people.orderId, people.customerId),
        path = `/finance/invoice-evidence/${input.target.id}`;
      const first = await call('/finance/invoice-evidence', input);
      assert.equal(first.status, 200);
      const accepted = (await first.json()) as ExecutionResult;
      assert.equal(accepted.status, 'completed');
      if (accepted.status === 'completed')
        assert.equal(accepted.result.event, 'IssuedInvoiceEvidenceRecorded');
      const replay = await call('/finance/invoice-evidence', input);
      assert.equal(replay.status, 200);
      assert.equal(((await replay.json()) as { replayed: boolean }).replayed, true);
      assert.equal(
        (
          await call('/finance/invoice-evidence', {
            ...input,
            payload: { ...input.payload, invoiceDocumentReference: 'Changed' },
          })
        ).status,
        409,
      );
      for (const role of ['ACT-SALES', 'ACT-FIN'] as const) {
        const read = await call(path, undefined, {
          authorization: `Bearer ${people.tokens.get(role)!}`,
          'x-erp-role': role,
        });
        assert.equal(read.status, 200);
        assert.equal(read.headers.get('cache-control'), 'no-store');
        const text = await read.text();
        assert.ok(!text.includes('binding') && !text.includes(token) && !text.includes('password'));
        const data = (JSON.parse(text) as { data: Record<string, string> }).data;
        assert.equal(data.salesOrderId, people.orderId);
        assert.equal(data.customerId, people.customerId);
        assert.ok(data.subject && data.issuer && data.recordedAt);
      }
      for (const role of [
        'ACT-FIN',
        'ACT-SEC',
        'ACT-PROC',
        'ACT-WH',
        'ACT-OP',
        'ACT-PLAN',
        'ACT-CUST',
      ] as const) {
        const headers = { authorization: `Bearer ${people.tokens.get(role)!}`, 'x-erp-role': role };
        assert.equal(
          (
            await call(
              '/finance/invoice-evidence',
              invoiceCommand(people.orderId, people.customerId),
              headers,
            )
          ).status,
          403,
        );
        if (role !== 'ACT-FIN') assert.equal((await call(path, undefined, headers)).status, 403);
      }
      assert.equal(
        (await call(path, undefined, { 'x-erp-role': 'ACT-FIN' })).status,
        403,
        'Role selector does not grant FIN',
      );
      assert.equal(
        (await call(path, undefined, { 'x-customer-id': people.customerId })).status,
        403,
      );
      assert.equal(
        (await call('/finance/invoice-evidence', input, { 'x-customer-id': people.customerId }))
          .status,
        403,
      );
      assert.equal((await call('/finance/invoice-evidence/' + randomUUID())).status, 404);
      assert.equal((await call('/finance/invoice-evidence', receiptCommand())).status, 400);
      assert.equal(
        (await call('/finance/invoice-evidence', input, { origin: 'https://example.invalid' }))
          .status,
        403,
      );
      assert.equal(
        (await call('/finance/invoice-evidence', input, { authorization: 'Bearer invalid' }))
          .status,
        401,
      );
      assert.equal(
        (
          await call(
            '/finance/invoice-evidence',
            '{"command":"RecordIssuedInvoiceEvidence","command":"RecordIssuedInvoiceEvidence"}',
          )
        ).status,
        400,
      );
      assert.equal((await call('/finance/invoice-evidence', 'x'.repeat(4097))).status, 400);
      const invalid = invoiceCommand(people.orderId, people.customerId, {
        payload: { ...input.payload, issueDate: '2026-02-30' },
      });
      assert.equal((await call('/finance/invoice-evidence', invalid)).status, 422);
      const rejectedReplay = await call('/finance/invoice-evidence', invalid);
      assert.equal(rejectedReplay.status, 422);
      assert.equal(((await rejectedReplay.json()) as { replayed: boolean }).replayed, true);
      const missing = invoiceCommand(randomUUID(), people.customerId);
      const missingResponse = await call('/finance/invoice-evidence', missing);
      assert.equal(missingResponse.status, 422);
      assert.equal(
        (await missingResponse.text()).includes('Matching Sales order and customer required'),
        true,
      );
      for (const field of [
        'amount',
        'unitPrice',
        'tax',
        'finalKg',
        'actor',
        'organizationId',
        'paymentStatus',
        'attachment',
        'externalUploadConfirmed',
      ]) {
        const extra = invoiceCommand(people.orderId, people.customerId, {
          payload: { ...input.payload, [field]: 'unapproved' },
        });
        assert.equal((await call('/finance/invoice-evidence', extra)).status, 403);
      }
      assert.deepEqual((await db.owner.query('SELECT * FROM sales.sales_order')).rows, before);
      assert.equal((await invoiceCounts(db)).evidence, 1);
      assert.equal((await invoiceCounts(db)).foreignWrites, 0);
      await app.identity.logout(token);
      assert.equal((await call(path)).status, 401);
      assert.equal((await call('/finance/invoice-evidence', input)).status, 401);
    } finally {
      await app.stop();
    }
  });
});

void test('invoice evidence HTTP remains fenced by default and actual customer-bound SALES and FIN grants cannot access organization evidence', async () => {
  await withDatabase(async (db) => {
    const people = await invoicePeople(db, { seedOrder: false });
    await db.owner.query(
      'UPDATE identity.role_grant SET authority_scope_id=$1 WHERE installation_id=$1',
      [installation],
    );
    const config = {
      nodeEnv: 'production' as const,
      host: '127.0.0.1',
      port: 0,
      databaseUrl: process.env.TEST_DATABASE_URL!,
      installationId: installation,
      logLevel: 'error' as const,
    };
    const fenced = compose(config);
    try {
      await fenced.start();
      const address = fenced.server.address();
      assert.ok(address && typeof address !== 'string');
      const response = await fetch(`http://127.0.0.1:${address.port}/finance/invoice-evidence`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${people.tokens.get('ACT-SALES')!}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(invoiceCommand(people.orderId, people.customerId)),
      });
      assert.equal(response.status, 503);
    } finally {
      await fenced.stop();
    }
    // Keep genuine customer grants and remove only their organizational authority.
    await db.owner.query(
      "DELETE FROM identity.role_grant WHERE actor_role='ACT-SALES' AND customer_scope='' ",
    );
    await db.owner.query(
      "UPDATE identity.role_grant SET customer_scope=$1 WHERE actor_role='ACT-FIN'",
      [people.customerId],
    );
    const app = compose({ ...config, commandAdmissionReconciled: true });
    try {
      await app.start();
      const address = app.server.address();
      assert.ok(address && typeof address !== 'string');
      for (const role of ['ACT-SALES', 'ACT-FIN'] as const) {
        const headers = {
          authorization: `Bearer ${people.tokens.get(role)!}`,
          'x-erp-role': role,
          'x-customer-id': people.customerId,
          'content-type': 'application/json',
        };
        assert.equal(
          (
            await fetch(`http://127.0.0.1:${address.port}/finance/invoice-evidence`, {
              method: 'POST',
              headers,
              body: JSON.stringify(invoiceCommand(people.orderId, people.customerId)),
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await fetch(
              `http://127.0.0.1:${address.port}/finance/invoice-evidence/${randomUUID()}`,
              { headers },
            )
          ).status,
          403,
        );
      }
      assert.equal((await db.owner.query('SELECT * FROM finance.invoice_evidence')).rowCount, 0);
      assert.equal((await db.owner.query('SELECT * FROM kernel.command_outcome')).rowCount, 0);
    } finally {
      await app.stop();
    }
  });
});
