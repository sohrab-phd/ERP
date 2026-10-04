import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bindCommand, sameBinding, outcomeKey, advisoryLockWords } from '../../src/index.js';
import type { CommandRequest, ExecutionContext } from '../../src/index.js';
const context: ExecutionContext = {
  installationId: '11111111-1111-4111-8111-111111111111',
  authorityScopeId: '22222222-2222-4222-8222-222222222222',
  principal: { issuer: 'test', subject: 'alice' },
  actorRole: 'ACT-TEST',
  requestId: '33333333-3333-4333-8333-333333333333',
};
const request: CommandRequest = {
  command: 'Synthetic',
  contract_version: 1,
  idempotency_key: '44444444-4444-4444-8444-444444444444',
  target: { kind: 'fixture', id: 'one' },
  payload: { a: 1, b: null },
  preconditions: { expected: 1 },
};
void test('canonical equivalent payload order matches without metadata binding', () => {
  const a = bindCommand(request, context),
    b = bindCommand(
      { ...request, payload: { b: null, a: 1 } },
      { ...context, requestId: '55555555-5555-4555-8555-555555555555', actorRole: 'ACT-OTHER' },
    );
  assert.equal(sameBinding(a, b), true);
});
void test('every effect field and principal identity binds', () => {
  const original = bindCommand(request, context);
  for (const changed of [
    { ...request, command: 'Other' },
    { ...request, contract_version: 2 },
    { ...request, target: { ...request.target, kind: 'other' } },
    { ...request, target: { ...request.target, id: 'two' } },
    { ...request, payload: { a: 2, b: null } },
    { ...request, payload: { a: 1 } },
    { ...request, preconditions: { expected: 2 } },
  ])
    assert.equal(sameBinding(original, bindCommand(changed, context)), false);
  for (const principal of [
    { issuer: 'other', subject: 'alice' },
    { issuer: 'test', subject: 'Alice' },
  ]) {
    assert.equal(sameBinding(original, bindCommand(request, { ...context, principal })), false);
  }
});
void test('canonical bytes compared even with forced equal SHA-256', () => {
  const a = bindCommand(request, context),
    b = bindCommand({ ...request, payload: { a: 2 } }, context);
  assert.equal(sameBinding(a, { ...b, payloadSha256: a.payloadSha256 }), false);
  assert.equal(sameBinding(a, { ...a, canonicalizationVersion: 2 }), false);
});
void test('full tuple namespaces scope while principal stays out of primary key', () => {
  const key = outcomeKey(request, context);
  assert.deepEqual(
    key,
    outcomeKey(request, { ...context, principal: { issuer: 'x', subject: 'y' } }),
  );
  assert.notDeepEqual(
    key,
    outcomeKey(request, { ...context, authorityScopeId: '55555555-5555-4555-8555-555555555555' }),
  );
  assert.notDeepEqual(
    key,
    outcomeKey(request, { ...context, installationId: '55555555-5555-4555-8555-555555555555' }),
  );
});
void test('advisory words deterministic signed int32 and full tuple dependent', () => {
  const key = outcomeKey(request, context),
    words = advisoryLockWords(key);
  assert.deepEqual(words, advisoryLockWords({ ...key }));
  for (const word of words)
    assert.equal(Number.isInteger(word) && word >= -2147483648 && word <= 2147483647, true);
  assert.notDeepEqual(
    words,
    advisoryLockWords({ ...key, authorityScopeId: '55555555-5555-4555-8555-555555555555' }),
  );
});
