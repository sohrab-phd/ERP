import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import {
  openSalesIntent,
  sealSalesIntent,
  type SalesIntent,
} from '../../src/operator/sales-intent.js';
import { openIntent, sealIntent } from '../../src/operator/intent.js';

const secret = randomBytes(32).toString('base64url');
const intent = (): SalesIntent => ({
  installationId: randomUUID(),
  authorityScopeId: randomUUID(),
  accountId: randomUUID(),
  personId: randomUUID(),
  role: 'ACT-SALES',
  customerId: randomUUID(),
  path: '/sales/v1/commands',
  body: JSON.stringify({
    command: 'SubmitSalesOrder',
    contract_version: 1,
    idempotency_key: randomUUID(),
    target: { kind: 'sales-order', id: randomUUID() },
    payload: {},
    preconditions: {},
  }),
});
void test('Sales encrypted recovery preserves exact target, key and serialized body without plaintext disclosure', async () => {
  const original = intent();
  const encrypted = await sealSalesIntent(original, secret);
  assert.ok(!encrypted.includes(original.body));
  assert.ok(!encrypted.includes(original.customerId));
  assert.deepEqual(await openSalesIntent(encrypted, secret), original);
  assert.notEqual(encrypted, await sealSalesIntent(original, secret));
  await assert.rejects(openSalesIntent(encrypted, randomBytes(32).toString('base64url')));
  const damaged = JSON.parse(encrypted) as { ciphertext: string };
  damaged.ciphertext =
    (damaged.ciphertext.startsWith('A') ? 'B' : 'A') + damaged.ciphertext.slice(1);
  await assert.rejects(openSalesIntent(JSON.stringify(damaged), secret));
});
void test('Sales and accepted PROC/WH recovery namespaces cannot decrypt each other', async () => {
  const original = intent();
  await assert.rejects(openIntent(await sealSalesIntent(original, secret), secret));
  const legacy = await sealIntent(
    {
      accountId: original.accountId,
      personId: original.personId,
      role: 'ACT-PROC',
      path: '/purchasing/operational-orders',
      body: '{}',
    },
    secret,
  );
  await assert.rejects(openSalesIntent(legacy, secret));
});
void test('Sales recovery rejects changed customer draft binding, unknown actions and oversize envelopes before persistence', async () => {
  const original = intent();
  await assert.rejects(
    sealSalesIntent(
      { ...original, body: original.body.replace('SubmitSalesOrder', 'CloseSalesOrder') },
      secret,
    ),
  );
  await assert.rejects(sealSalesIntent({ ...original, body: ' '.repeat(4097) }, secret));
  await assert.rejects(
    sealSalesIntent(
      {
        ...original,
        body: JSON.stringify({
          command: 'DraftSalesOrder',
          contract_version: 1,
          idempotency_key: randomUUID(),
          target: { kind: 'sales-order', id: randomUUID() },
          payload: { customerId: randomUUID() },
          preconditions: {},
        }),
      },
      secret,
    ),
  );
});
