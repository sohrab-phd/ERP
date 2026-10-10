import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import type { ExecutionResult } from '@navard/shared-kernel';
import { compose } from '../../src/composition-root.js';
import { withDatabase } from '../support/database-fixture.js';
import {
  operators,
  installation,
  bundleCounts,
  receiptCommand,
} from '../support/receipt-harness.js';
import { request } from '../support/synthetic-command.js';

const purchase = () =>
  request({
    command: 'RecordCompletedPurchase',
    target: { kind: 'purchase-record', id: randomUUID() },
    payload: {
      purchaseDocumentReference: 'SYNTHETIC-PURCHASE',
      supplierReference: 'Synthetic supplier',
      purchaseDate: '2026-10-10',
      materialDescription: 'Standalone sheets',
    },
    preconditions: {},
  });

void test('composed purchasing HTTP records/replays purchase and optional proforma with current personal org authority and safe reads', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db);
    await db.owner.query(
      'UPDATE identity.role_grant SET authority_scope_id=$1 WHERE installation_id=$1',
      [installation],
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
      const token = people.tokens.get('ACT-PROC')!;
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
      const command = purchase();
      const first = await call('/purchasing/purchases', command);
      assert.equal(first.status, 200);
      const accepted = (await first.json()) as ExecutionResult;
      assert.equal(accepted.status, 'completed');
      if (accepted.status !== 'completed') throw new Error('Expected complete');
      assert.equal(accepted.result.event, 'CompletedPurchaseRecorded');
      const replay = await call('/purchasing/purchases', command);
      assert.equal(replay.status, 200);
      assert.equal(((await replay.json()) as { replayed: boolean }).replayed, true);
      assert.equal(
        (
          await call('/purchasing/purchases', {
            ...command,
            payload: { ...command.payload, supplierReference: 'Changed' },
          })
        ).status,
        409,
      );
      const proforma = request({
        command: 'RecordPurchaseProformaSent',
        target: { kind: 'purchase-proforma', id: randomUUID() },
        payload: {
          purchaseId: command.target.id,
          proformaReference: 'Synthetic proforma',
          sentDate: '2026-10-09',
        },
        preconditions: {},
      });
      assert.equal((await call('/purchasing/proformas', proforma)).status, 200);
      const proformaReplay = await call('/purchasing/proformas', proforma);
      assert.equal(proformaReplay.status, 200);
      assert.equal(((await proformaReplay.json()) as { replayed: boolean }).replayed, true);
      for (const path of [
        `/purchasing/purchases/${command.target.id}`,
        `/purchasing/proformas/${proforma.target.id}`,
      ]) {
        const result = await call(path);
        assert.equal(result.status, 200);
        assert.equal(result.headers.get('cache-control'), 'no-store');
        const text = await result.text();
        assert.ok(!text.includes('binding') && !text.includes(token) && !text.includes('password'));
        const data = (JSON.parse(text) as { data: Record<string, string> }).data;
        assert.ok(data.subject && data.issuer && data.recordedAt);
        for (const role of ['ACT-WH', 'ACT-SEC', 'ACT-CUST'] as const)
          assert.equal(
            (await call(path, undefined, { authorization: `Bearer ${people.tokens.get(role)!}` }))
              .status,
            403,
          );
        assert.equal((await call(path, undefined, { 'x-erp-role': 'ACT-SEC' })).status, 403);
      }
      assert.equal((await call('/purchasing/purchases/' + randomUUID())).status, 404);
      assert.equal((await call('/purchasing/purchases', receiptCommand())).status, 400);
      assert.equal((await call('/purchasing/purchases', proforma)).status, 400);
      assert.equal((await call('/purchasing/proformas', command)).status, 400);
      for (const role of ['ACT-WH', 'ACT-SEC'] as const)
        assert.equal(
          (
            await call('/purchasing/purchases', purchase(), {
              authorization: `Bearer ${people.tokens.get(role)!}`,
            })
          ).status,
          403,
        );
      assert.equal((await call('/receipts/post', receiptCommand())).status, 403);
      assert.equal(
        (await call('/purchasing/purchases', purchase(), { origin: 'https://example.invalid' }))
          .status,
        403,
      );
      assert.equal(
        (await call('/purchasing/purchases', purchase(), { authorization: 'Bearer invalid' }))
          .status,
        401,
      );
      assert.equal(
        (
          await call(
            '/purchasing/purchases',
            '{"command":"RecordCompletedPurchase","command":"RecordCompletedPurchase"}',
          )
        ).status,
        400,
      );
      assert.equal((await call('/purchasing/purchases', 'x'.repeat(4097))).status, 400);
      const valid = purchase();
      const invalid = { ...valid, payload: { ...valid.payload, purchaseDate: '2026-02-30' } };
      const rejection = await call('/purchasing/purchases', invalid);
      assert.equal(rejection.status, 422);
      const rejectedReplay = await call('/purchasing/purchases', invalid);
      assert.equal(rejectedReplay.status, 422);
      assert.equal(((await rejectedReplay.json()) as { replayed: boolean }).replayed, true);
      const baseExtra = purchase();
      const extra = { ...baseExtra, payload: { ...baseExtra.payload, price: '100' } };
      assert.equal((await call('/purchasing/purchases', extra)).status, 403);
      await app.identity.logout(token);
      assert.equal((await call('/purchasing/purchases/' + command.target.id)).status, 401);
      assert.equal((await call('/purchasing/purchases', command)).status, 401);
      const counts = await bundleCounts(db);
      assert.equal(counts.receipts + counts.lots + counts.units + counts.movements, 0);
      assert.equal(
        (await db.owner.query('SELECT * FROM procurement.completed_purchase')).rowCount,
        1,
      );
      assert.equal(
        (await db.owner.query('SELECT * FROM procurement.purchase_proforma_sent')).rowCount,
        1,
      );
    } finally {
      await app.stop();
    }
  });
});

void test('purchasing stays fenced by default and customer-bound ACT-PROC grants do not grant org evidence access', async () => {
  await withDatabase(async (db) => {
    const people = await operators(db);
    await db.owner.query(
      'UPDATE identity.role_grant SET authority_scope_id=$1 WHERE installation_id=$1',
      [installation],
    );
    const app = compose({
      nodeEnv: 'production',
      host: '127.0.0.1',
      port: 0,
      databaseUrl: process.env.TEST_DATABASE_URL!,
      installationId: installation,
      logLevel: 'error',
    });
    try {
      await app.start();
      const address = app.server.address();
      assert.ok(address && typeof address !== 'string');
      const token = people.tokens.get('ACT-PROC')!;
      const call = () =>
        fetch(`http://127.0.0.1:${address.port}/purchasing/purchases`, {
          method: 'POST',
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: JSON.stringify(purchase()),
        });
      assert.equal((await call()).status, 503);
      await db.owner.query(
        "UPDATE identity.role_grant SET customer_scope=$1 WHERE actor_role='ACT-PROC'",
        [randomUUID()],
      );
      const admitted = compose({
        nodeEnv: 'production',
        host: '127.0.0.1',
        port: 0,
        databaseUrl: process.env.TEST_DATABASE_URL!,
        installationId: installation,
        logLevel: 'error',
        commandAdmissionReconciled: true,
      });
      try {
        await admitted.start();
        const admittedAddress = admitted.server.address();
        assert.ok(admittedAddress && typeof admittedAddress !== 'string');
        const response = await fetch(
          `http://127.0.0.1:${admittedAddress.port}/purchasing/purchases`,
          {
            method: 'POST',
            headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
            body: JSON.stringify(purchase()),
          },
        );
        assert.equal(response.status, 403);
        const read = await fetch(
          `http://127.0.0.1:${admittedAddress.port}/purchasing/purchases/${randomUUID()}`,
          {
            headers: { authorization: `Bearer ${token}` },
          },
        );
        assert.equal(read.status, 403);
        assert.equal((await db.owner.query('SELECT * FROM kernel.command_outcome')).rowCount, 0);
      } finally {
        await admitted.stop();
      }
      assert.equal(
        (await db.owner.query('SELECT * FROM procurement.completed_purchase')).rowCount,
        0,
      );
    } finally {
      await app.stop();
    }
  });
});
