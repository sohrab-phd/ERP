import test from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../../src/config.js';
const env = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://runtime@127.0.0.1/navard_erp_dev',
  INSTALLATION_ID: '00000000-0000-4000-8000-000000000001',
};
void test('configuration validates once, default values, stable ID and immutable result', () => {
  const c = loadConfig(env);
  assert.equal(c.port, 3000);
  assert.equal(c.host, '127.0.0.1');
  assert.ok(Object.isFrozen(c));
});
void test('invalid configuration fails without disclosing credentials', () => {
  for (const change of [
    { NODE_ENV: 'wrong' },
    { DATABASE_URL: 'https://secret@invalid' },
    { INSTALLATION_ID: 'no' },
    { PORT: '0' },
    { PORT: '12.5' },
    { HOST: 'bad host' },
    { LOG_LEVEL: 'trace' },
  ])
    assert.throws(() => loadConfig({ ...env, ...change }));
});
void test('production Identity host binds loopback behind TLS termination', () => {
  for (const HOST of ['0.0.0.0', '::', '192.0.2.10', 'public.example.invalid']) {
    assert.throws(
      () => loadConfig({ ...env, NODE_ENV: 'production', HOST }),
      /Production host must bind loopback/u,
    );
  }
  for (const HOST of ['127.0.0.1', '::1'])
    assert.equal(loadConfig({ ...env, NODE_ENV: 'production', HOST }).host, HOST);
});
