import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';
import { compose } from '../../src/composition-root.js';
import type { DatabaseFixture } from './database-fixture.js';
import { installation, operators } from './receipt-harness.js';
export const browserTestPassword = 'synthetic receipt individual password';
export type BrowserRole = 'ACT-PROC' | 'ACT-WH' | 'ACT-SEC' | 'ACT-CUST';
export async function browserHarness(db: DatabaseFixture, fixedPort?: number) {
  const people = await operators(db);
  await db.owner.query(
    'UPDATE identity.role_grant SET authority_scope_id=$1 WHERE installation_id=$1',
    [installation],
  );
  const reservation = createServer();
  await new Promise<void>((resolve) => reservation.listen(0, '127.0.0.1', resolve));
  const address = reservation.address();
  assert.ok(address && typeof address !== 'string');
  const port = fixedPort ?? address.port;
  await new Promise<void>((resolve) => reservation.close(() => resolve()));
  const origin = `http://127.0.0.1:${port}`;
  const config = {
    nodeEnv: 'test' as const,
    host: '127.0.0.1',
    port,
    databaseUrl: process.env.TEST_DATABASE_URL!,
    installationId: installation,
    logLevel: 'error' as const,
    commandAdmissionReconciled: true,
    browser: { origin, secret: randomBytes(32).toString('base64url') },
  };
  const app = compose(config);
  let dropNextOrderResponse = false;
  let unavailableSession = false,
    holdLogout = false;
  let releaseResponse: (() => void) | undefined;
  app.server.prependListener('request', (request, response) => {
    if (unavailableSession && request.url === '/ui-api/identity/session') {
      unavailableSession = false;
      const writeHead = response.writeHead.bind(response);
      response.writeHead = () => writeHead(503, { 'content-type': 'application/json' });
    }
    if (holdLogout && request.url === '/ui-api/identity/logout') {
      holdLogout = false;
      const end = response.end.bind(response);
      response.end = (chunk: unknown) => {
        releaseResponse = () => {
          end(typeof chunk === 'string' || Buffer.isBuffer(chunk) ? chunk : undefined);
        };
        return response;
      };
    }
    if (dropNextOrderResponse && request.url === '/ui-api/purchasing/operational-orders') {
      dropNextOrderResponse = false;
      // Deliberately lose the HTTP response AFTER the normal real command/COMMIT.
      response.end = () => {
        response.destroy();
        return response;
      };
    }
  });
  await app.start();
  const legacy = (path: string, body?: unknown, role: BrowserRole = 'ACT-PROC') =>
    fetch(origin + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        authorization: `Bearer ${people.tokens.get(role)!}`,
        'x-erp-role': role,
        ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  function client(role: BrowserRole = 'ACT-PROC') {
    let cookie = '',
      csrf = '';
    const call = (path: string, body?: unknown, headers: Record<string, string> = {}) =>
      fetch(origin + '/ui-api' + path, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          'x-erp-browser': '1',
          'sec-fetch-site': 'same-origin',
          'x-erp-role': role,
          cookie,
          'x-erp-csrf': csrf,
          ...(body === undefined ? {} : { origin, 'content-type': 'application/json' }),
          ...headers,
        },
        ...(body === undefined
          ? {}
          : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
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
        const response = await call('/identity/login', {
          username: `receipt.${role.toLowerCase()}`,
          password: browserTestPassword,
        });
        assert.equal(response.status, 200);
        cookie = response.headers.get('set-cookie')!.split(';')[0]!;
        const login = (await response.json()) as Record<string, unknown>;
        assert.equal(login.token, undefined);
        const session = await call('/identity/session');
        assert.equal(session.status, 200);
        const self = (await session.json()) as {
          accountId: string;
          personId: string;
          grants: unknown[];
          browser: { csrf: string; recoveryKey?: string };
        };
        csrf = self.browser.csrf;
        return { response, self };
      },
    };
  }
  return {
    app,
    people,
    origin,
    legacy,
    client,
    unavailableNextSession: () => {
      unavailableSession = true;
    },
    setCommandAdmission: (enabled: boolean) => {
      config.commandAdmissionReconciled = enabled;
    },
    holdNextLogout: () => {
      holdLogout = true;
    },
    releaseResponse: () => {
      releaseResponse?.();
      releaseResponse = undefined;
    },
    loseNextOrderResponse: () => {
      dropNextOrderResponse = true;
    },
  };
}
