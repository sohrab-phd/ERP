import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  executeCommand,
  CommandRegistry,
  createTransactionContext,
  TechnicalError,
  BusinessRejection,
} from '../../src/index.js';
import type {
  AuditEvent,
  AuditKind,
  CommandContract,
  CommandDecision,
  ExecutionContext,
  ExecutionPorts,
  OutcomeKey,
  StoredOutcome,
  TransactionContext,
  TransactionSession,
} from '../../src/index.js';

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
  preconditions: { expected: 1 },
};
const input = JSON.stringify(request);
interface State {
  facts: number;
  rows: Map<string, StoredOutcome>;
  audits: AuditEvent[];
}
interface Work {
  state: State;
  savepointFacts: number;
  released: boolean;
}
function copy(state: State): State {
  return { facts: state.facts, rows: new Map(state.rows), audits: [...state.audits] };
}
class MemoryFixture {
  state: State = { facts: 0, rows: new Map(), audits: [] };
  readonly work = new WeakMap<TransactionContext, Work>();
  readonly steps: string[] = [];
  handlerCalls = 0;
  failAudit: AuditKind | undefined;
  failCommit: 'before' | 'after' | undefined;
  allowed = true;
  replayAllowed = true;
  fenced = false;
  revokeOnLock = false;
  handler: (tx: TransactionContext) => Promise<CommandDecision> = async (tx) => {
    await Promise.resolve();
    this.write(tx);
    return {
      outcome: 'accepted',
      factIdentity: 'fact-one',
      sourceState: 'new',
      targetState: 'recorded',
    };
  };
  contract(overrides: Partial<CommandContract> = {}): CommandContract {
    return {
      command: 'Synthetic',
      version: 1,
      active: true,
      payloadShape: { value: { type: 'scalar' } },
      preconditionsShape: { expected: { type: 'scalar' } },
      execute: async (_request, _context, tx) => {
        await Promise.resolve();
        this.handlerCalls++;
        return this.handler(tx);
      },
      ...overrides,
    };
  }
  get(tx: TransactionContext): Work {
    const work = this.work.get(tx);
    if (work === undefined || work.released) throw new Error('Invalid transaction capability');
    return work;
  }
  write(tx: TransactionContext): void {
    this.get(tx).state.facts++;
  }
  key(key: OutcomeKey): string {
    return JSON.stringify(key);
  }
  async begin(): Promise<TransactionSession> {
    await Promise.resolve();
    this.steps.push('begin');
    const tx = createTransactionContext(),
      work: Work = { state: copy(this.state), savepointFacts: 0, released: false };
    this.work.set(tx, work);
    return {
      context: tx,
      decisionTime: () => Promise.resolve(new Date()),
      lock: async () => {
        await Promise.resolve();
        this.steps.push('lock');
        if (this.revokeOnLock) this.allowed = false;
      },
      savepoint: async () => {
        await Promise.resolve();
        this.steps.push('savepoint');
        work.savepointFacts = work.state.facts;
      },
      rollbackToSavepoint: async () => {
        await Promise.resolve();
        this.steps.push('rollback-savepoint');
        work.state.facts = work.savepointFacts;
      },
      commit: async () => {
        await Promise.resolve();
        this.steps.push('commit');
        if (this.failCommit === 'before') throw new TechnicalError('uncertain');
        this.state = copy(work.state);
        if (this.failCommit === 'after') throw new TechnicalError('uncertain');
      },
      rollback: async () => {
        await Promise.resolve();
        this.steps.push('rollback');
      },
      release: async (discard) => {
        await Promise.resolve();
        this.steps.push(discard === true ? 'discard' : 'release');
        work.released = true;
      },
    };
  }
  ports(contracts: readonly CommandContract[] = [this.contract()]): ExecutionPorts {
    return {
      registry: new CommandRegistry(contracts),
      transactions: { begin: () => this.begin() },
      outcomes: {
        find: async (tx, key) => {
          await Promise.resolve();
          this.steps.push('find');
          return this.get(tx).state.rows.get(this.key(key));
        },
        insert: async (tx, outcome) => {
          await Promise.resolve();
          this.steps.push('insert');
          this.get(tx).state.rows.set(this.key(outcome.key), outcome);
        },
      },
      audits: {
        append: async (tx, event) => {
          await Promise.resolve();
          this.steps.push('audit:' + event.eventKind);
          if (this.failAudit === event.eventKind) throw new Error('Unsafe SQL details');
          this.get(tx).state.audits.push(event);
        },
      },
      authorization: {
        canExecute: async () => Promise.resolve(this.allowed),
        canReplay: async () => Promise.resolve(this.replayAllowed),
      },
      recoveryFence: { permitsAdmission: async () => Promise.resolve(!this.fenced) },
    };
  }
  async run(body = input, ctx: ExecutionContext = context, ports = this.ports()) {
    await Promise.resolve();
    return executeCommand(body, ctx, ports);
  }
}

void test('first acceptance commits one fact, original audit and outcome, then exact replay only', async () => {
  await Promise.resolve();
  const fixture = new MemoryFixture();
  const first = await fixture.run();
  assert.equal(first.status, 'completed');
  if (first.status !== 'completed') return;
  assert.equal(first.replayed, false);
  assert.equal(fixture.state.facts, 1);
  assert.equal(fixture.state.rows.size, 1);
  assert.deepEqual(fixture.steps.slice(0, 5), [
    'begin',
    'lock',
    'find',
    'savepoint',
    'audit:AUD-CMD-ACCEPTED',
  ]);
  const second = await fixture.run(input, { ...context, requestId: randomUUID() });
  assert.equal(second.status, 'completed');
  if (second.status !== 'completed') return;
  assert.equal(second.replayed, true);
  assert.equal(second.executionId, first.executionId);
  assert.deepEqual(second.result, first.result);
  assert.equal(fixture.handlerCalls, 1);
  assert.equal(fixture.state.facts, 1);
  assert.deepEqual(
    fixture.state.audits.map((event) => event.eventKind),
    ['AUD-CMD-ACCEPTED', 'AUD-CMD-REPLAYED'],
  );
  assert.equal(fixture.state.audits[1]?.executionId, first.executionId);
  assert.notEqual(fixture.state.audits[1]?.requestId, context.requestId);
});
void test('known rejection rolls back tentative facts; now-passing handler does not reevaluate replay', async () => {
  await Promise.resolve();
  const fixture = new MemoryFixture();
  fixture.handler = async (tx) => {
    await Promise.resolve();
    fixture.write(tx);
    return {
      outcome: 'rejected',
      rejection: { family: 'GUARD_STATE', message: 'State does not allow this intent' },
    };
  };
  const first = await fixture.run();
  assert.equal(first.status, 'completed');
  if (first.status !== 'completed') return;
  assert.equal(first.result.outcome, 'rejected');
  assert.equal(fixture.state.facts, 0);
  assert.equal(fixture.steps.includes('rollback-savepoint'), true);
  fixture.handler = async (tx) => {
    await Promise.resolve();
    fixture.write(tx);
    return { outcome: 'accepted' };
  };
  const second = await fixture.run();
  assert.equal(second.status, 'completed');
  if (second.status !== 'completed') return;
  assert.deepEqual(second.result, first.result);
  assert.equal(second.replayed, true);
  assert.equal(fixture.handlerCalls, 1);
  assert.deepEqual(
    fixture.state.audits.map((event) => event.eventKind),
    ['AUD-CMD-REJECTED', 'AUD-CMD-REPLAYED'],
  );
});
void test('explicit BusinessRejection/open policy survives as safe durable rejection', async () => {
  await Promise.resolve();
  const fixture = new MemoryFixture();
  fixture.handler = async (tx) => {
    await Promise.resolve();
    fixture.write(tx);
    throw new BusinessRejection({
      family: 'GUARD_OPEN_POLICY',
      message: 'Policy is unresolved',
      openItem: 'OQ-011',
    });
  };
  const result = await fixture.run();
  assert.equal(result.status, 'completed');
  if (result.status !== 'completed') return;
  assert.equal(result.result.outcome, 'rejected');
  if (result.result.outcome === 'rejected') assert.equal(result.result.open_item, 'OQ-011');
  assert.equal(fixture.state.audits[0]?.openItem, 'OQ-011');
  assert.equal(fixture.state.facts, 0);
  assert.deepEqual(
    fixture.state.audits.map((event) => event.eventKind),
    ['AUD-CMD-REJECTED', 'AUD-OPEN-POLICY'],
  );
  assert.equal(fixture.state.audits[1]?.executionId, result.executionId);
  await fixture.run();
  assert.deepEqual(
    fixture.state.audits.map((event) => event.eventKind),
    ['AUD-CMD-REJECTED', 'AUD-OPEN-POLICY', 'AUD-CMD-REPLAYED'],
  );
});
void test('same-key material/target/precondition/principal mismatch nondisclosing conflict, original preserved', async () => {
  await Promise.resolve();
  const fixture = new MemoryFixture();
  await fixture.run();
  for (const body of [
    { ...request, payload: { value: 2 } },
    { ...request, target: { kind: 'fixture', id: 'other' } },
    { ...request, preconditions: { expected: 2 } },
  ]) {
    const result = await fixture.run(JSON.stringify(body));
    assert.equal(result.status, 'conflict');
    assert.equal('executionId' in result, false);
    assert.equal('result' in result, false);
  }
  const result = await fixture.run(input, {
    ...context,
    principal: { issuer: 'test', subject: 'bob' },
  });
  assert.equal(result.status, 'conflict');
  assert.equal(fixture.handlerCalls, 1);
  assert.equal(fixture.state.rows.size, 1);
  assert.equal(
    fixture.state.audits
      .filter((event) => event.eventKind === 'AUD-CMD-CONFLICT')
      .every((event) => event.executionId === undefined),
    true,
  );
});
void test('command and version occupied-key conflict without executing their registered handlers', async () => {
  await Promise.resolve();
  const fixture = new MemoryFixture(),
    ports = fixture.ports([
      fixture.contract(),
      fixture.contract({ command: 'Other' }),
      fixture.contract({ version: 2 }),
    ]);
  await fixture.run(input, context, ports);
  for (const body of [
    { ...request, command: 'Other' },
    { ...request, contract_version: 2 },
  ]) {
    assert.equal((await fixture.run(JSON.stringify(body), context, ports)).status, 'conflict');
  }
  assert.equal(fixture.handlerCalls, 1);
});
void test('scope installation isolate identical keys, role/attempt metadata do not alter binding', async () => {
  await Promise.resolve();
  const fixture = new MemoryFixture();
  await fixture.run();
  const replay = await fixture.run(input, {
    ...context,
    actorRole: 'ACT-OTHER',
    requestId: randomUUID(),
  });
  assert.equal(replay.status, 'completed');
  if (replay.status === 'completed') assert.equal(replay.replayed, true);
  await fixture.run(input, { ...context, authorityScopeId: randomUUID() });
  await fixture.run(input, { ...context, installationId: randomUUID() });
  assert.equal(fixture.state.rows.size, 3);
  assert.equal(fixture.handlerCalls, 3);
});
void test('current access before admission and after lock plus resulting resource visibility gate replay', async () => {
  await Promise.resolve();
  const fixture = new MemoryFixture();
  await fixture.run();
  fixture.replayAllowed = false;
  assert.equal((await fixture.run()).status, 'admission-denied');
  assert.equal(fixture.state.audits.at(-1)?.eventKind, 'AUD-ISOLATION-DENY');
  assert.equal(fixture.handlerCalls, 1);
  fixture.replayAllowed = true;
  fixture.revokeOnLock = true;
  assert.equal((await fixture.run()).status, 'admission-denied');
  fixture.allowed = false;
  fixture.steps.length = 0;
  assert.equal((await fixture.run()).status, 'admission-denied');
  assert.equal(fixture.steps.includes('find'), false);
});
void test('malformed/unknown admission records only safe generic audit and consumes no key', async () => {
  await Promise.resolve();
  const fixture = new MemoryFixture();
  const result = await fixture.run('{"secret":"dont-retain"}');
  assert.equal(result.status, 'admission-denied');
  assert.equal(fixture.state.rows.size, 0);
  assert.equal(JSON.stringify(fixture.state.audits).includes('dont-retain'), false);
  assert.equal(fixture.state.audits[0]?.command, undefined);
  fixture.failAudit = 'AUD-CMD-ADMISSION-DENIED';
  assert.equal((await fixture.run('{')).status, 'technical');
});
void test('lossy restore fence denies before any write or absent row automatic execution', async () => {
  await Promise.resolve();
  const fixture = new MemoryFixture();
  fixture.fenced = true;
  const result = await fixture.run();
  assert.equal(result.status, 'technical');
  if (result.status === 'technical') assert.equal(result.kind, 'incompatible');
  assert.equal(fixture.handlerCalls, 0);
  assert.equal(fixture.state.rows.size, 0);
  assert.deepEqual(fixture.steps, []);
});
void test('unbound trusted identity uses safe auth failure audit; invalid installation is technical', async () => {
  const fixture = new MemoryFixture();
  const invalidPrincipal = { ...context, principal: { issuer: '', subject: 'bad' } };
  const result = await fixture.run(input, invalidPrincipal);
  assert.equal(result.status, 'admission-denied');
  assert.equal(fixture.state.audits[0]?.eventKind, 'AUD-AUTHN-FAIL');
  assert.equal(fixture.state.audits[0]?.principalIssuer, undefined);
  assert.equal(fixture.state.rows.size, 0);
  const unavailable = await fixture.run(input, { ...context, installationId: 'invalid' });
  assert.equal(unavailable.status, 'technical');
  assert.equal(fixture.state.audits.length, 1);
});
void test('original audit failure rolls back facts/outcome; replay audit failure preserves winner', async () => {
  await Promise.resolve();
  const fixture = new MemoryFixture();
  fixture.failAudit = 'AUD-CMD-ACCEPTED';
  const failure = await fixture.run();
  assert.equal(failure.status, 'technical');
  assert.equal(JSON.stringify(failure).includes('SQL'), false);
  assert.equal(fixture.state.rows.size, 0);
  assert.equal(fixture.state.facts, 0);
  fixture.failAudit = undefined;
  await fixture.run();
  const before = fixture.state.rows.values().next().value;
  fixture.failAudit = 'AUD-CMD-REPLAYED';
  assert.equal((await fixture.run()).status, 'technical');
  assert.equal(fixture.state.rows.size, 1);
  assert.equal(fixture.state.facts, 1);
  assert.equal(fixture.state.rows.values().next().value, before);
});
void test('deadlock/serialization/timeout/unregistered SQL errors abort; never cached rejection', async () => {
  await Promise.resolve();
  for (const code of ['40P01', '40001', '57014', '55P03', '08006', '23505', 'XX000']) {
    const fixture = new MemoryFixture();
    fixture.handler = async (tx) => {
      await Promise.resolve();
      fixture.write(tx);
      throw Object.assign(new Error('Synthetic SQL failure'), {
        code,
        constraint: 'unknown',
        message: 'credential',
      });
    };
    const result = await fixture.run();
    assert.equal(result.status, 'technical');
    assert.equal(fixture.state.rows.size, 0);
    assert.equal(fixture.state.audits.length, 0);
    assert.equal(fixture.state.facts, 0);
  }
});
void test('registered duplicate recovery rolls back classifier writes; explicit owner family', async () => {
  await Promise.resolve();
  for (const family of ['GUARD_IDEMPOTENT_DUP', 'GUARD_CONFLICT'] as const) {
    const fixture = new MemoryFixture();
    fixture.state.facts = 1;
    fixture.handler = async (tx) => {
      await Promise.resolve();
      fixture.write(tx);
      throw Object.assign(new Error('Synthetic duplicate'), {
        code: '23505',
        constraint: 'synthetic_fact_unique',
      });
    };
    const contract = fixture.contract({
      constraintRejections: {
        synthetic_fact_unique: async (_request, _context, tx) => {
          await Promise.resolve();
          assert.equal(fixture.get(tx).state.facts, 1);
          fixture.write(tx); // Adversarial classifier side effect must not commit.
          return { family, message: 'Owner verified matching fact' };
        },
      },
    });
    const result = await fixture.run(input, context, fixture.ports([contract]));
    assert.equal(result.status, 'completed');
    if (result.status === 'completed' && result.result.outcome === 'rejected')
      assert.equal(result.result.family, family);
    assert.equal(fixture.state.facts, 1);
    assert.equal(fixture.state.rows.size, 1);
  }
});
void test('ambiguous commit before/after persists no false acceptance; explicit same key resolves safely', async () => {
  await Promise.resolve();
  for (const stage of ['before', 'after'] as const) {
    const fixture = new MemoryFixture();
    fixture.failCommit = stage;
    const result = await fixture.run();
    assert.equal(result.status, 'technical');
    if (result.status === 'technical') assert.equal(result.kind, 'uncertain');
    assert.equal(fixture.steps.includes('discard'), true);
    fixture.failCommit = undefined;
    const retry = await fixture.run();
    assert.equal(retry.status, 'completed');
    if (retry.status === 'completed') assert.equal(retry.replayed, stage === 'after');
    assert.equal(fixture.state.facts, 1);
    assert.equal(fixture.state.rows.size, 1);
  }
});
void test('retired contracts can replay existing rows, cannot execute absent key', async () => {
  await Promise.resolve();
  const fixture = new MemoryFixture();
  await fixture.run();
  const { execute: _ignored, ...contract } = fixture.contract();
  void _ignored;
  const ports = fixture.ports([{ ...contract, active: false }]);
  const replay = await fixture.run(input, context, ports);
  assert.equal(replay.status, 'completed');
  if (replay.status === 'completed') assert.equal(replay.replayed, true);
  const absent = await fixture.run(
    JSON.stringify({ ...request, idempotency_key: randomUUID() }),
    context,
    ports,
  );
  assert.equal(absent.status, 'admission-denied');
  assert.equal(fixture.handlerCalls, 1);
  assert.equal(fixture.state.rows.size, 1);
});
void test('unknown stored outcome reader version fails nonexecuting without recycling', async () => {
  await Promise.resolve();
  const fixture = new MemoryFixture();
  await fixture.run();
  const entry = fixture.state.rows.entries().next().value;
  assert.ok(entry);
  fixture.state.rows.set(entry[0], { ...entry[1], resultSchemaVersion: 2 });
  const result = await fixture.run();
  assert.equal(result.status, 'technical');
  if (result.status === 'technical') assert.equal(result.kind, 'incompatible');
  assert.equal(fixture.handlerCalls, 1);
  assert.equal(fixture.state.rows.size, 1);
});
void test('invalid owner guard/result is technical and all tentative effects abort', async () => {
  await Promise.resolve();
  for (const rejection of [
    { family: 'GUARD_OPEN_POLICY' as const, message: 'missing policy' },
    { family: 'GUARD_STATE' as const, message: 'invalid open item', openItem: 'OQ-001' },
  ]) {
    const fixture = new MemoryFixture();
    fixture.handler = async (tx) => {
      await Promise.resolve();
      fixture.write(tx);
      return { outcome: 'rejected', rejection };
    };
    assert.equal((await fixture.run()).status, 'technical');
    assert.equal(fixture.state.rows.size, 0);
    assert.equal(fixture.state.facts, 0);
  }
  const fixture = new MemoryFixture();
  fixture.handler = async (tx) => {
    await Promise.resolve();
    fixture.write(tx);
    return { outcome: 'accepted', data: { invalid: 0.5 } };
  };
  assert.equal((await fixture.run()).status, 'technical');
  assert.equal(fixture.state.facts, 0);
});

void test('hung trusted admission is bounded before opening any write transaction', async () => {
  const fixture = new MemoryFixture();
  const base = fixture.ports();
  const ports: ExecutionPorts = {
    ...base,
    admissionDeadlineMs: 20,
    authorization: {
      ...base.authorization,
      canExecute: () => new Promise<boolean>(() => undefined),
    },
  };
  const result = await fixture.run(input, context, ports);
  assert.equal(result.status, 'technical');
  assert.equal(fixture.steps.includes('begin'), false);
  assert.equal(fixture.state.facts, 0);
  assert.equal(fixture.state.rows.size, 0);
});
