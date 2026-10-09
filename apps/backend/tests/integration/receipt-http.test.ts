import assert from 'node:assert/strict';
import test from 'node:test';
import { request as httpRequest } from 'node:http';
import { compose } from '../../src/composition-root.js';
import { withDatabase } from '../support/database-fixture.js';
import {
  operators,
  installation,
  receiptCommand,
  bundleCounts,
} from '../support/receipt-harness.js';
import type { ExecutionResult } from '@navard/shared-kernel';

void test('production receipt HTTP uses personal Warehouse grants, scoped stock reads, replay and safe rejection contracts', async () => {
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
      const token = people.tokens.get('ACT-WH')!;
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
      const command = receiptCommand();
      const first = await call('/receipts/post', command);
      assert.equal(first.status, 200);
      const result = (await first.json()) as ExecutionResult;
      assert.equal(result.status, 'completed');
      if (result.status !== 'completed') throw new Error('Expected completed');
      const data = result.result.data as { unitId: string; lotId: string };
      const replay = await call('/receipts/post', command);
      assert.equal(replay.status, 200);
      assert.equal(((await replay.json()) as { replayed: boolean }).replayed, true);
      assert.equal(
        (await call('/receipts/post', { ...command, payload: { ...command.payload, count: '3' } }))
          .status,
        409,
      );
      for (const path of [
        `/receipts/${command.target.id}`,
        `/inventory/units/${data.unitId}`,
        `/inventory/lots/${data.lotId}`,
      ]) {
        const response = await call(path);
        assert.equal(response.status, 200);
        const text = await response.text();
        assert.ok(!text.includes('binding'));
        assert.ok(!text.includes(token));
        assert.equal(
          (
            await call(path, undefined, {
              authorization: `Bearer ${people.tokens.get('ACT-PROC')!}`,
            })
          ).status,
          403,
        );
        assert.equal(
          (
            await call(path, undefined, {
              authorization: `Bearer ${people.tokens.get('ACT-SEC')!}`,
              'x-erp-role': 'ACT-SEC',
            })
          ).status,
          200,
        );
      }
      for (const role of ['ACT-PROC', 'ACT-SEC'] as const)
        assert.equal(
          (
            await call('/receipts/post', receiptCommand(), {
              authorization: `Bearer ${people.tokens.get(role)!}`,
            })
          ).status,
          403,
        );
      assert.equal(
        (await call('/receipts/post', receiptCommand(), { 'x-erp-role': 'ACT-SEC' })).status,
        403,
      );
      assert.equal(
        (
          await call('/receipts/post', receiptCommand(), {
            origin: 'https://untrusted.example.invalid',
          })
        ).status,
        403,
      );
      assert.equal(
        (await call('/receipts/post', receiptCommand(), { authorization: 'Bearer invalid' }))
          .status,
        401,
      );
      assert.equal(
        (
          await call(
            '/receipts/post',
            JSON.stringify(command).replace('"count":"2"', '"count":"2","count":"3"'),
          )
        ).status,
        400,
      );
      assert.equal(
        (
          await call(
            '/receipts/post',
            JSON.stringify(command).replace('"count":"2"', '"count":9007199254740993'),
          )
        ).status,
        400,
      );
      assert.equal((await call('/receipts/post', 'x'.repeat(4097))).status, 400);
      const invalid = receiptCommand({ payload: { ...command.payload, measuredKg: '0' } });
      assert.equal((await call('/receipts/post', invalid)).status, 422);
      const rejectedReplay = await call('/receipts/post', invalid);
      assert.equal(rejectedReplay.status, 422);
      assert.equal(((await rejectedReplay.json()) as { replayed: boolean }).replayed, true);
      assert.equal(
        (await call('/inventory/units/' + data.unitId + '?customerScope=foreign')).status,
        404,
      );
      // Native HTTP raw duplicate-header probes, rather than fetch's merged Headers abstraction.
      for (const duplicates of [
        ['Authorization', `Bearer ${token}`, 'Authorization', `Bearer ${token}`],
        ['Authorization', `Bearer ${token}`, 'X-Erp-Role', 'ACT-WH', 'X-Erp-Role', 'ACT-WH'],
      ]) {
        const status = await new Promise<number>((resolve, reject) => {
          const req = httpRequest(
            base + '/inventory/units/' + data.unitId,
            { headers: [...duplicates, 'Host', new URL(base).host] },
            (res) => {
              res.resume();
              resolve(res.statusCode!);
            },
          );
          req.on('error', reject);
          req.end();
        });
        // Node's HTTP parser may reject duplicate Authorization before the adapter.
        if (duplicates[2] === 'Authorization') assert.ok(status === 400 || status === 401);
        else assert.equal(status, 403);
      }
      assert.equal((await bundleCounts(db)).movements, 1);
      assert.equal((await bundleCounts(db)).receipts, 1);
      // A cached personal context remains insufficient once the persistent grant is gone.
      await db.owner.query(
        "DELETE FROM identity.role_grant WHERE installation_id=$1 AND actor_role='ACT-WH'",
        [installation],
      );
      assert.equal((await call('/receipts/post', command)).status, 403);
      assert.equal((await call('/inventory/units/' + data.unitId)).status, 403);
    } finally {
      await app.stop();
    }
  });
});

void test('default production recovery admission fence prevents new receipts even with valid Warehouse identity', async () => {
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
      const actor = await app.identity.context(people.tokens.get('ACT-WH')!, 'ACT-WH');
      const result = await app.command(JSON.stringify(receiptCommand()), actor);
      assert.equal(result.status, 'technical');
      assert.equal((await bundleCounts(db)).movements, 0);
      assert.equal((await bundleCounts(db)).outcomes, 0);
      assert.ok(app.registry.find('PostGoodsReceipt', 1));
      assert.ok(app.registry.find('CompleteProductionOperation', 1)); // Authorized SLICE-MAKE is registered; the recovery fence remains mandatory.
    } finally {
      await app.stop();
    }
  });
});
