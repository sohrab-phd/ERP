import test from 'node:test';
import assert from 'node:assert/strict';
import { request } from 'node:http';
import { EventEmitter } from 'node:events';
import { pingDatabase } from '../../src/composition-root.js';
import { createHttpHost, closeHttpHost } from '../../src/transport/http-host.js';
// Native HTTP tests the host on any OS-assigned port; Fetch blocks some valid local ports.
async function readHttp(url: string, options: { method?: string } = {}) {
  return new Promise<{ status: number; text(): Promise<string> }>((resolve, reject) => {
    const req = request(url, options, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk: string) => {
        body += chunk;
      });
      response.on('error', reject);
      response.on('end', () =>
        resolve({ status: response.statusCode!, text: () => Promise.resolve(body) }),
      );
    });
    req.on('error', reject);
    req.end();
  });
}
async function withHost(ping: () => Promise<void>, body: (base: string) => Promise<void>) {
  const server = createHttpHost({ ping, probeTimeoutMs: 30 });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const a = server.address();
  assert.ok(a && typeof a !== 'string');
  try {
    await body('http://127.0.0.1:' + a.port);
  } finally {
    await closeHttpHost(server);
  }
}
void test('host is health-only, no command/fixture/auth route, GET only, safe responses', async () => {
  await withHost(
    () => Promise.resolve(),
    async (base) => {
      assert.equal((await readHttp(base + '/health/live')).status, 200);
      assert.equal((await readHttp(base + '/health/ready')).status, 200);
      assert.equal((await readHttp(base + '/commands', { method: 'POST' })).status, 404);
      assert.equal((await readHttp(base + '/health/live', { method: 'POST' })).status, 405);
      assert.equal((await readHttp(base + '/fixtures')).status, 404);
      assert.equal((await readHttp(base + '/health/live?role=admin')).status, 404);
    },
  );
});
void test('readiness failure and timeout disclose no database details', async () => {
  for (const ping of [
    () => Promise.reject(new Error('SECRET CONNECTION')),
    () => new Promise<void>(() => undefined),
  ])
    await withHost(ping, async (base) => {
      const response = await readHttp(base + '/health/ready');
      assert.equal(response.status, 503);
      assert.doesNotMatch(await response.text(), /SECRET/);
    });
});
void test('health requests reject a body', async () => {
  await withHost(
    () => Promise.resolve(),
    async (base) => {
      await new Promise<void>((resolve, reject) => {
        const r = request(
          base + '/health/live',
          { method: 'GET', headers: { 'content-length': '1' } },
          (response) => {
            assert.equal(response.statusCode, 400);
            response.resume();
            response.on('end', resolve);
          },
        );
        r.on('error', reject);
        r.end('x');
      });
    },
  );
});
void test('checked-out readiness socket error is owned, discarded once and leaves liveness available', async () => {
  let releases = 0;
  const client = Object.assign(new EventEmitter(), {
    query: () =>
      new Promise<never>((_resolve, reject) => {
        setImmediate(() => {
          const error = new Error('SECRET DRIVER CONNECTION');
          client.emit('error', error);
          reject(error);
        });
      }),
    release: (discard: boolean) => {
      assert.equal(discard, true);
      releases++;
    },
  });
  const pool = { connect: () => Promise.resolve(client) } as unknown as Parameters<
    typeof pingDatabase
  >[0];
  await withHost(
    () => pingDatabase(pool),
    async (base) => {
      const response = await readHttp(base + '/health/ready');
      assert.equal(response.status, 503);
      assert.doesNotMatch(await response.text(), /SECRET|DRIVER|CONNECTION/);
      assert.equal((await readHttp(base + '/health/live')).status, 200);
    },
  );
  assert.equal(releases, 1);
  assert.equal(client.listenerCount('error'), 0);
});
