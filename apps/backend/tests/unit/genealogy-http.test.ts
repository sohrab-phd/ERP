import assert from 'node:assert/strict';
import test from 'node:test';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { setTimeout as sleep } from 'node:timers/promises';
import { BusinessRejection, type ExecutionContext } from '@navard/shared-kernel';
import { IdentityError, type IdentityService } from '../../src/modules/identity/index.js';
import {
  createGenealogyHandler,
  type GenealogyHttpPorts,
} from '../../src/transport/genealogy-http.js';

const customer = '11111111-1111-4111-8111-111111111111';
const rootId = '22222222-2222-4222-8222-222222222222';
const bearer = 'A'.repeat(43);
const actor: ExecutionContext = {
  installationId: '33333333-3333-4333-8333-333333333333',
  authorityScopeId: '44444444-4444-4444-8444-444444444444',
  principal: { issuer: 'transport-fixture', subject: 'individual' },
  actorRole: 'ACT-WH',
  requestId: '55555555-5555-4555-8555-555555555555',
  customerScope: customer,
};

// These fakes verify transport parsing and delegation only; current-grant proof uses real Identity/PG.
function ports(
  context: IdentityService['context'] = () => Promise.resolve(actor),
  query: GenealogyHttpPorts['query'] = () => Promise.resolve({ root: rootId }),
): GenealogyHttpPorts {
  return { identity: { context } as unknown as IdentityService, query };
}
async function call(
  handler: ReturnType<typeof createGenealogyHandler>,
  overrides: Partial<IncomingMessage> = {},
) {
  let status = 0;
  let result: unknown;
  let resumed = false;
  const headers: Record<string, unknown> = {};
  const request = {
    method: 'GET',
    url: `/genealogy/forward/unit/${rootId}`,
    headers: { authorization: `Bearer ${bearer}`, 'x-customer-id': customer },
    rawHeaders: ['Authorization', `Bearer ${bearer}`, 'X-Customer-Id', customer],
    resume: () => {
      resumed = true;
    },
    ...overrides,
  } as unknown as IncomingMessage;
  const response = {
    setHeader(name: string, value: unknown) {
      headers[name] = value;
    },
    writeHead(code: number, values: Record<string, unknown>) {
      status = code;
      Object.assign(headers, values);
    },
    end(value: string) {
      result = JSON.parse(value) as unknown;
    },
  } as unknown as ServerResponse;
  await handler(request, response);
  assert.equal(resumed, true);
  assert.equal(headers['cache-control'], 'no-store');
  assert.equal(headers['x-content-type-options'], 'nosniff');
  return { status, result, headers };
}

void test('Genealogy GET maps both directions and each exact lowercase root to the owner query', async () => {
  const kinds = [
    'unit',
    'lot',
    'receipt',
    'package',
    'shipment',
    'fact',
    'operation',
    'order',
    'batch',
    'sales_order',
  ];
  for (const direction of ['forward', 'backward']) {
    for (const kind of kinds) {
      const handler = createGenealogyHandler(
        ports(
          (token, role, scope) => {
            assert.equal(token, bearer);
            assert.equal(role, 'ACT-WH');
            assert.equal(scope, customer);
            return Promise.resolve(actor);
          },
          (query, root, context) => {
            assert.equal(query, direction === 'forward' ? 'TraceForward' : 'TraceBackward');
            assert.deepEqual(root, { kind: kind.toUpperCase(), id: rootId });
            assert.equal(context, actor);
            return Promise.resolve({ root: rootId });
          },
        ),
      );
      const result = await call(handler, { url: `/genealogy/${direction}/${kind}/${rootId}` });
      assert.equal(result.status, 200);
      assert.deepEqual(result.result, { data: { root: rootId } });
    }
  }
});

void test('Genealogy denies unknown routes and parameters, wrong methods, and absent roots', async () => {
  let queried = 0;
  const handler = createGenealogyHandler(ports(undefined, () => Promise.resolve(queried++)));
  for (const url of [
    `/genealogy/forward/unit/${rootId}?customer=${customer}`,
    `/genealogy/forward/unit/${rootId}?`,
    `/genealogy/forward/UNIT/${rootId}`,
    `/genealogy/forward/%75nit/${rootId}`,
    `/genealogy/edit/unit/${rootId}`,
    '/genealogy/forward/unit/not-a-uuid',
    `/genealogy/forward/unit/${rootId}/`,
  ]) {
    assert.equal((await call(handler, { url })).status, 404);
  }
  const method = await call(handler, { method: 'POST' });
  assert.equal(method.status, 405);
  assert.equal(method.headers.allow, 'GET');
  assert.equal(queried, 0);
  const missing = await call(
    createGenealogyHandler(ports(undefined, () => Promise.resolve(undefined))),
  );
  assert.equal(missing.status, 404);
  assert.deepEqual(missing.result, { error: 'not-found' });
});

void test('Genealogy requires exactly one customer UUID and denies caller role, Origin and bodies', async () => {
  let authenticated = 0;
  const handler = createGenealogyHandler(
    ports(() => {
      authenticated++;
      return Promise.resolve(actor);
    }),
  );
  const base = { authorization: `Bearer ${bearer}`, 'x-customer-id': customer };
  for (const overrides of [
    { headers: { authorization: `Bearer ${bearer}` }, rawHeaders: ['Authorization', bearer] },
    { headers: { ...base, 'x-customer-id': '' } },
    { headers: { ...base, 'x-customer-id': 'all' } },
    { headers: { ...base, 'x-customer-id': [customer, customer] } },
    { rawHeaders: ['Authorization', bearer, 'X-Customer-Id', customer, 'x-customer-id', customer] },
    { headers: { ...base, 'x-erp-role': 'ACT-SEC' } },
    { headers: { ...base, 'x-erp-role': '' } },
    { headers: { ...base, origin: 'https://example.invalid' } },
    { headers: { ...base, origin: '' } },
  ]) {
    assert.equal((await call(handler, overrides)).status, 403);
  }
  for (const headers of [
    { ...base, 'content-length': '1' },
    { ...base, 'content-length': 'NaN' },
    { ...base, 'transfer-encoding': 'chunked' },
  ]) {
    assert.equal((await call(handler, { headers })).status, 400);
  }
  assert.equal(authenticated, 0);
  assert.equal((await call(handler, { headers: { 'x-customer-id': customer } })).status, 401);
});

void test('Genealogy falls back only on forbidden, in WH/SALES/SEC order with the exact customer', async () => {
  for (const accepted of ['ACT-WH', 'ACT-SALES', 'ACT-SEC']) {
    const roles: string[] = [];
    const handler = createGenealogyHandler(
      ports((_token, role, scope) => {
        roles.push(role);
        assert.equal(scope, customer);
        if (role !== accepted) return Promise.reject(new IdentityError('forbidden'));
        return Promise.resolve({ ...actor, actorRole: role });
      }),
    );
    assert.equal((await call(handler)).status, 200);
    assert.deepEqual(roles, ['ACT-WH', 'ACT-SALES', 'ACT-SEC'].slice(0, roles.length));
    assert.equal(roles.at(-1), accepted);
  }
  const denied: string[] = [];
  const allForbidden = createGenealogyHandler(
    ports((_token, role) => {
      denied.push(role);
      return Promise.reject(new IdentityError('forbidden'));
    }),
  );
  assert.equal((await call(allForbidden)).status, 403);
  assert.deepEqual(denied, ['ACT-WH', 'ACT-SALES', 'ACT-SEC']);
  for (const [error, expected] of [
    [new IdentityError('unauthenticated'), 401],
    [new IdentityError('busy'), 503],
    [new IdentityError('invalid'), 400],
    [new Error('SECRET identity database'), 503],
  ] as const) {
    let attempts = 0;
    const result = await call(
      createGenealogyHandler(
        ports(() => {
          attempts++;
          return Promise.reject(error);
        }),
      ),
    );
    assert.equal(result.status, expected);
    assert.equal(attempts, 1);
    assert.doesNotMatch(JSON.stringify(result.result), /SECRET|database/u);
  }
});

void test('Genealogy returns guarded errors and sanitizes technical query failure', async () => {
  for (const [error, expected, safe] of [
    [
      new BusinessRejection({ family: 'GUARD_ACTOR', message: 'SECRET foreign root' }),
      403,
      'forbidden',
    ],
    [
      new BusinessRejection({ family: 'GUARD_INVARIANT', message: 'SECRET source' }),
      422,
      'invalid',
    ],
    [new Error('SECRET SQL connection'), 503, 'unavailable'],
  ] as const) {
    const result = await call(
      createGenealogyHandler(ports(undefined, () => Promise.reject(error))),
    );
    assert.equal(result.status, expected);
    assert.deepEqual(result.result, { error: safe });
  }
});

void test('Genealogy caps four reads and retains admission after HTTP timeout until work settles', async () => {
  let finish: (value: unknown) => void = () => undefined;
  const query = new Promise<unknown>((resolve) => {
    finish = resolve;
  });
  let started = 0;
  const handler = createGenealogyHandler(
    ports(undefined, async () => {
      started++;
      return query;
    }),
    10,
  );
  const pending = Array.from({ length: 4 }, () => call(handler));
  const fifth = await call(handler);
  assert.equal(fifth.status, 503);
  assert.equal(fifth.headers.connection, 'close');
  // Referenced timer keeps this transport-only fixture alive while the handler's timer is unref'd.
  const [timedOut] = await Promise.all([Promise.all(pending), sleep(30)]);
  assert.equal(started, 4);
  assert.ok(timedOut.every((result) => result.status === 503));
  assert.equal((await call(handler)).status, 503);
  assert.equal(started, 4);
  finish({ root: rootId });
  await sleep(0);
  assert.equal((await call(handler)).status, 200);
  assert.equal(started, 5);
});
