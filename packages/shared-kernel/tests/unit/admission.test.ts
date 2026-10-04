import { test } from 'node:test';
import assert from 'node:assert/strict';
import { admitCommand, AdmissionError, CommandRegistry, executeQuery } from '../../src/index.js';
import type { ExecutionContext, CommandContract } from '../../src/index.js';
const context: ExecutionContext = {
  installationId: '11111111-1111-4111-8111-111111111111',
  authorityScopeId: '22222222-2222-4222-8222-222222222222',
  principal: { issuer: 'test', subject: 'alice' },
  actorRole: 'ACT-TEST',
  requestId: '33333333-3333-4333-8333-333333333333',
};
const request = {
  command: 'Synthetic',
  contract_version: 1,
  idempotency_key: '44444444-4444-4444-8444-444444444444',
  target: { kind: 'fixture', id: 'one' },
  payload: { value: 1 },
  preconditions: {},
};
const contract: CommandContract = {
  command: 'Synthetic',
  version: 1,
  active: true,
  payloadShape: {
    value: { type: 'scalar' },
    nested: { type: 'object', fields: { value: { type: 'scalar' } } },
    array: { type: 'array', element: { type: 'scalar' } },
  },
  preconditionsShape: { expected: { type: 'scalar' } },
  execute: async () => Promise.resolve({ outcome: 'accepted' }),
};
const registry = new CommandRegistry([contract]);
void test('bounded known material admitted and frozen; missing/domain-invalid material deferred to handler', () => {
  const { request: admitted } = admitCommand(JSON.stringify(request), context, registry);
  assert.equal(Object.isFrozen(admitted), true);
  assert.equal(Object.isFrozen(admitted.payload), true);
  assert.doesNotThrow(() =>
    admitCommand(
      JSON.stringify({ ...request, payload: { value: 'not a domain number' } }),
      context,
      registry,
    ),
  );
  assert.doesNotThrow(() =>
    admitCommand(JSON.stringify({ ...request, payload: {} }), context, registry),
  );
});
void test('unknown envelope claims, nested unknown fields and credentials are never retained', () => {
  for (const changed of [
    { ...request, actor_role: 'ACT-ADMIN' },
    { ...request, installationId: context.installationId },
    { ...request, payload: { unknown: 1 } },
    { ...request, payload: { nested: { password: 'secret' } } },
    { ...request, target: { ...request.target, unknown: 1 } },
    { ...request, preconditions: { unknown: 1 } },
  ])
    assert.throws(() => admitCommand(JSON.stringify(changed), context, registry), AdmissionError);
  const secretRegistry = new CommandRegistry([
    { ...contract, payloadShape: { password: { type: 'scalar' } } },
  ]);
  assert.throws(
    () =>
      admitCommand(
        JSON.stringify({ ...request, payload: { password: 'secret' } }),
        context,
        secretRegistry,
      ),
    AdmissionError,
  );
});
void test('UUID v4 lowercase keys, nonempty targets and positive int32 versions required', () => {
  for (const changed of [
    { ...request, idempotency_key: '44444444-4444-1444-8444-444444444444' },
    { ...request, idempotency_key: '44444444-4444-4444-C444-444444444444' },
    { ...request, target: { kind: '', id: 'one' } },
    { ...request, target: { kind: 'fixture', id: '' } },
    { ...request, contract_version: 0 },
    { ...request, contract_version: 2147483648 },
    { ...request, command: 'Unknown' },
  ])
    assert.throws(() => admitCommand(JSON.stringify(changed), context, registry), AdmissionError);
});
void test('trusted context bounds and temporary actor cannot be bypassed by request claims', () => {
  for (const changed of [
    { ...context, temporary: true },
    { ...context, actorRole: 'Temporary (temporary)' },
    { ...context, principal: { issuer: 'test', subject: 'x'.repeat(257) } },
    { ...context, installationId: '00000000-0000-0000-0000-000000000000' },
  ])
    assert.throws(() => admitCommand(JSON.stringify(request), changed, registry), AdmissionError);
});
void test('identity byte length measured in UTF-8 not code units', () => {
  assert.throws(
    () =>
      admitCommand(
        JSON.stringify(request),
        { ...context, principal: { issuer: 'test', subject: 'é'.repeat(129) } },
        registry,
      ),
    AdmissionError,
  );
  assert.doesNotThrow(() =>
    admitCommand(
      JSON.stringify(request),
      { ...context, principal: { issuer: 'test', subject: 'é'.repeat(128) } },
      registry,
    ),
  );
});
void test('retained replay-only contract admitted without permitting active execution', () => {
  const retained = new CommandRegistry([
    { ...contract, active: false, execute: undefined } as unknown as CommandContract,
  ]);
  assert.equal(admitCommand(JSON.stringify(request), context, retained).contract.active, false);
});
void test('read-only query verifies trusted current scope before snapshot and bounds returned data', async () => {
  await Promise.resolve();
  let read = false;
  await assert.rejects(
    executeQuery(
      { query: 'Snapshot', parameters: {} },
      context,
      { canRead: async () => Promise.resolve(false) },
      {
        read: async () => {
          await Promise.resolve();
          read = true;
          return {};
        },
      },
    ),
  );
  assert.equal(read, false);
  const result = await executeQuery(
    { query: 'Snapshot', parameters: {} },
    context,
    { canRead: async () => Promise.resolve(true) },
    { read: async (_request, ctx) => Promise.resolve({ scope: ctx.authorityScopeId }) },
  );
  assert.deepEqual(result, { scope: context.authorityScopeId });
  assert.equal(Object.isFrozen(result), true);
  await assert.rejects(
    executeQuery(
      { query: 'Snapshot', parameters: {} },
      context,
      { canRead: async () => Promise.resolve(true) },
      { read: async () => Promise.resolve({ invalid: 0.5 }) },
    ),
  );
});
