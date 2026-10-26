import assert from 'node:assert/strict';
import test from 'node:test';
import { randomBytes } from 'node:crypto';
import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import { admitBrowser, browserLogin, browserLogout } from '../../src/transport/browser-session.js';
import {
  commandBody,
  linePayload,
  openIntent,
  sealIntent,
  type Intent,
} from '../../src/operator/intent.js';

void test('P2 receiving recovery accepts only its exact Warehouse intent and retains envelope bytes', async () => {
  const secret = randomBytes(32).toString('base64url');
  const intent: Intent = {
    accountId: 'warehouse-personal-account',
    personId: 'warehouse-person',
    role: 'ACT-WH',
    path: '/purchasing/receiving/confirm',
    body: commandBody('ConfirmPurchaseReceiving', 'inbound-arrival', {
      originNetKg: '06000.12500',
      units: [],
    }),
  };
  const saved = await sealIntent(intent, secret);
  assert.deepEqual(await openIntent(saved, secret), intent);
  await assert.rejects(
    openIntent(await sealIntent({ ...intent, role: 'ACT-PROC' }, secret), secret),
  );
  await assert.rejects(
    openIntent(
      await sealIntent({ ...intent, path: '/purchasing/receiving/arbitrary' }, secret),
      secret,
    ),
  );
});

void test('P1 exact line values and optional absence survive command creation without numeric/date conversion', () => {
  const values = {
    materialTypeOptionId: '11111111-1111-4111-8111-111111111111',
    widthM: '99999999999999999999.123456789012345678',
    thicknessMm: '0.000000000000000001',
    unitWeightKg: '99999999999999999999',
    orderedUnitCount: '99999999999999999999',
    itemNumber: '',
    colorOptionId: '',
    ralColorNumber: '  RAL-۱۲  ',
    lengthM: '1.200',
    qualityGradeOptionId: '',
  };
  const line = linePayload(values);
  assert.equal(Object.hasOwn(line, 'itemNumber'), false);
  assert.equal(Object.hasOwn(line, 'colorOptionId'), false);
  assert.equal(line.widthM, values.widthM);
  assert.equal(line.ralColorNumber, values.ralColorNumber);
  const body = commandBody('RegisterOperationalPurchaseOrder', 'operational-purchase-order', {
    orderReference: ' PO-۱۲ ',
    registrationDateJalali: '1403-12-30',
    lines: [line, line],
  });
  const parsed = JSON.parse(body) as {
    payload: { registrationDateJalali: string; lines: (typeof line)[] };
    idempotency_key: string;
    target: { id: string };
  };
  assert.equal(parsed.payload.registrationDateJalali, '1403-12-30');
  assert.deepEqual(parsed.payload.lines, [line, line]);
  assert.match(parsed.idempotency_key, /^[0-9a-f-]{36}$/u);
  assert.notEqual(parsed.idempotency_key, parsed.target.id);
});
void test('P1 recovery ciphertext preserves immutable complete intent; wrong actor key and tampering fail closed', async () => {
  const secret = randomBytes(32).toString('base64url');
  const intent: Intent = {
    accountId: 'account-A',
    personId: 'person-A',
    role: 'ACT-PROC',
    path: '/purchasing/operational-orders',
    body: commandBody('RegisterOperationalPurchaseOrder', 'operational-purchase-order', {
      orderReference: 'private-order',
      registrationDateJalali: '1403-12-30',
      lines: [],
    }),
  };
  const encrypted = await sealIntent(intent, secret);
  assert.ok(!encrypted.includes('private-order'));
  assert.ok(!encrypted.includes('account-A'));
  assert.ok(!encrypted.includes(secret));
  assert.deepEqual(await openIntent(encrypted, secret), intent);
  assert.notEqual(await sealIntent(intent, secret), encrypted);
  await assert.rejects(openIntent(encrypted, randomBytes(32).toString('base64url')));
  const tampered = JSON.parse(encrypted) as { ciphertext: string };
  tampered.ciphertext = 'AAAA' + tampered.ciphertext.slice(4);
  await assert.rejects(openIntent(JSON.stringify(tampered), secret));
  await assert.rejects(openIntent('null', secret));
  await assert.rejects(openIntent('x'.repeat(800001), secret));
});
void test('P1 HTTPS browser cookies use host prefix, Secure, HttpOnly, strict same-site and no Domain', () => {
  const request = new IncomingMessage(new Socket());
  request.method = 'POST';
  request.headers = {
    host: 'erp.example',
    origin: 'https://erp.example',
    'x-erp-browser': '1',
    'sec-fetch-site': 'same-origin',
  };
  request.rawHeaders = Object.entries(request.headers).flatMap(([name, value]) => [
    name,
    String(value),
  ]);
  const response = new ServerResponse(request);
  admitBrowser(
    request,
    {
      origin: 'https://erp.example',
      secret: randomBytes(32).toString('base64url'),
      installationId: '11111111-1111-4111-8111-111111111111',
    },
    true,
    false,
  );
  assert.equal(
    browserLogin(request, response, {
      token: randomBytes(32).toString('base64url'),
      expiresAt: new Date('2026-10-26T00:00:00Z'),
    }),
    true,
  );
  const cookie = String(response.getHeader('set-cookie'));
  assert.match(cookie, /^__Host-navard-session=/u);
  for (const attribute of ['Path=/', 'HttpOnly', 'SameSite=Strict', 'Secure', 'Expires='])
    assert.ok(cookie.includes(attribute));
  assert.ok(!cookie.includes('Domain='));
  browserLogout(request, response);
  assert.match(String(response.getHeader('set-cookie')), /Max-Age=0/u);
  request.socket.destroy();
});
