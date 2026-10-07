import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hashPassword,
  verifyPassword,
  validatePassword,
  humanRoles,
  IdentityError,
} from '../../src/modules/identity/index.js';

void test('password validation counts Unicode code points and bounds UTF8 bytes without truncation', () => {
  for (const invalid of [
    undefined,
    null,
    42,
    '',
    'a'.repeat(14),
    '😀'.repeat(14),
    'a'.repeat(129),
    '😀'.repeat(33),
    'a'.repeat(15) + '\ud800',
  ]) {
    assert.throws(
      () => validatePassword(invalid),
      (error: unknown) => error instanceof IdentityError && error.kind === 'invalid',
    );
  }
  for (const valid of ['a'.repeat(15), '😀'.repeat(15), 'a'.repeat(128), '😀'.repeat(32)]) {
    assert.doesNotThrow(() => validatePassword(valid));
  }
});

void test('password KDF capacity fails closed rather than queuing unbounded credential work', async () => {
  const results = await Promise.allSettled([
    hashPassword('first synthetic password'),
    hashPassword('second synthetic password'),
    hashPassword('third synthetic password'),
  ]);
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 2);
  const rejected = results.find((result) => result.status === 'rejected');
  assert.ok(rejected?.status === 'rejected' && rejected.reason instanceof IdentityError);
  assert.equal(rejected.reason.kind, 'busy');
});

void test('scrypt credentials use random salts and reject wrong, truncated or malformed credentials', async () => {
  const password = 'synthetic fixture password';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.ok(!first.includes(password));
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword('incorrect fixture password', first), false);
  assert.equal(await verifyPassword(password + 'x', first), false);
  for (const malformed of [
    '',
    'plaintext',
    first.slice(0, -1),
    first + '$extra',
    first.replace('131072', '262144'),
  ]) {
    assert.equal(await verifyPassword(password, malformed), false);
  }
  await assert.rejects(
    hashPassword('short'),
    (error: unknown) => error instanceof IdentityError && error.kind === 'invalid',
  );
});

void test('human role vocabulary excludes shared operator, service inventory and future Quality roles', () => {
  assert.deepEqual(
    [...humanRoles],
    [
      'ACT-SEC',
      'ACT-SALES',
      'ACT-PROC',
      'ACT-WH',
      'ACT-PLAN',
      'ACT-OP',
      'ACT-SHIP',
      'ACT-FIN',
      'ACT-CUST',
    ],
  );
  for (const role of ['ACT-QC', 'ACT-IPS', 'admin', 'operator', 'station'])
    assert.ok(!humanRoles.some((actual) => actual === role));
});
