import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';
import { compose } from '../../src/composition-root.js';
import { salesPeople } from './sales-harness.js';
import { operators, installation } from './receipt-harness.js';
import type { DatabaseFixture } from './database-fixture.js';

export async function salesBrowserHarness(db: DatabaseFixture) {
  const people = await salesPeople(db),
    warehouse = await operators(db);
  await db.owner.query(
    'UPDATE identity.role_grant SET authority_scope_id=$1 WHERE installation_id=$1',
    [installation],
  );
  await db.owner.query('UPDATE sales.customer SET authority_scope=$1 WHERE installation_id=$1', [
    installation,
  ]);
  const reservation = createServer();
  await new Promise<void>((resolve) => reservation.listen(0, '127.0.0.1', resolve));
  const address = reservation.address();
  assert.ok(address && typeof address !== 'string');
  const port = address.port;
  await new Promise<void>((resolve) => reservation.close(() => resolve()));
  const origin = `http://127.0.0.1:${port}`;
  const app = compose({
    nodeEnv: 'test',
    host: '127.0.0.1',
    port,
    databaseUrl: process.env.TEST_DATABASE_URL!,
    installationId: installation,
    logLevel: 'error',
    commandAdmissionReconciled: true,
    browser: { origin, secret: randomBytes(32).toString('base64url') },
  });
  await app.start();
  function client(username = 'sales.first', password = 'synthetic sales individual password') {
    let cookie = '',
      csrf = '';
    const call = (
      path: string,
      input?: unknown,
      customer?: string,
      headers: Record<string, string> = {},
    ) =>
      fetch(origin + '/ui-api' + path, {
        method: input === undefined ? 'GET' : 'POST',
        headers: {
          'x-erp-browser': '1',
          'sec-fetch-site': 'same-origin',
          cookie,
          'x-erp-csrf': csrf,
          ...(customer ? { 'x-customer-id': customer } : {}),
          ...(input === undefined ? {} : { origin, 'content-type': 'application/json' }),
          ...headers,
        },
        ...(input === undefined
          ? {}
          : { body: typeof input === 'string' ? input : JSON.stringify(input) }),
      });
    return {
      call,
      get cookie() {
        return cookie;
      },
      get csrf() {
        return csrf;
      },
      async login() {
        const response = await call('/identity/login', { username, password });
        assert.equal(response.status, 200);
        cookie = response.headers.get('set-cookie')!.split(';')[0]!;
        const session = await call('/identity/session');
        assert.equal(session.status, 200);
        const self = (await session.json()) as {
          accountId: string;
          personId: string;
          grants: unknown[];
          browser: {
            csrf: string;
            recoveryKey?: string;
            hasCustomerSales: boolean;
            installationId: string;
            authorityScopeId: string;
          };
        };
        csrf = self.browser.csrf;
        return self;
      },
    };
  }
  return { app, people, warehouse, origin, client };
}
