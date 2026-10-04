import { randomUUID } from 'node:crypto';
import {
  CommandRegistry,
  executeCommand,
  type CommandContract,
  type CommandDecision,
  type CommandRequest,
  type ExecutionContext,
  type ExecutionPorts,
  type TransactionContext,
} from '@navard/shared-kernel';
import { transactionClient } from '../../src/infrastructure/postgresql/transaction.js';
import type { DatabaseFixture } from './database-fixture.js';

export function context(overrides: Partial<ExecutionContext> = {}): ExecutionContext {
  return {
    installationId: '11111111-1111-4111-8111-111111111111',
    authorityScopeId: '22222222-2222-4222-8222-222222222222',
    principal: { issuer: 'fixture', subject: 'alice' },
    actorRole: 'ACT-FIXTURE',
    requestId: randomUUID(),
    ...overrides,
  };
}

export function request(overrides: Partial<CommandRequest> = {}): CommandRequest {
  return {
    command: 'TEST-RecordFact',
    contract_version: 1,
    idempotency_key: randomUUID(),
    target: { kind: 'fixture', id: randomUUID() },
    payload: { material: 'safe material', reject: false },
    preconditions: { expected: 1 },
    ...overrides,
  };
}

export async function syntheticHandler(
  input: CommandRequest,
  _context: ExecutionContext,
  tx: TransactionContext,
): Promise<CommandDecision> {
  const client = transactionClient(tx);
  await client.query('SAVEPOINT synthetic_fact');
  try {
    await client.query('INSERT INTO envelope_test.fact(identity,material) VALUES($1,$2)', [
      input.target.id,
      input.payload.material,
    ]);
  } catch (error) {
    if (
      typeof error !== 'object' ||
      !error ||
      !('code' in error) ||
      error.code !== '23505' ||
      !('constraint' in error) ||
      error.constraint !== 'fact_pkey'
    )
      throw error;
    await client.query('ROLLBACK TO SAVEPOINT synthetic_fact');
    const existing = await client.query<{ material: string }>(
      'SELECT material FROM envelope_test.fact WHERE identity=$1',
      [input.target.id],
    );
    const matched = existing.rows[0]?.material === input.payload.material;
    return {
      outcome: 'rejected',
      rejection: {
        family:
          matched && input.command !== 'TEST-ProductionDuplicateRule'
            ? 'GUARD_IDEMPOTENT_DUP'
            : 'GUARD_CONFLICT',
        message: 'Fixture fact already exists',
      },
    };
  }
  if (input.payload.reject === true) {
    return {
      outcome: 'rejected',
      rejection: { family: 'GUARD_INVARIANT', message: 'Fixture guard rejected' },
    };
  }
  return {
    outcome: 'accepted',
    factIdentity: input.target.id,
    event: 'FixtureRecorded',
    data: { value: 'safe' },
  };
}

export function harness(
  fixture: DatabaseFixture,
  options: {
    handler?: CommandContract['execute'];
    ports?: Partial<Omit<ExecutionPorts, 'registry'>>;
    active?: boolean;
  } = {},
) {
  let executions = 0;
  const handler: NonNullable<CommandContract['execute']> = async (...args) => {
    executions += 1;
    return (options.handler ?? syntheticHandler)(...args);
  };
  const contract = (command: string, version: number): CommandContract => ({
    command,
    version,
    active: options.active ?? true,
    payloadShape: { material: { type: 'scalar' }, reject: { type: 'scalar' } },
    preconditionsShape: { expected: { type: 'scalar' } },
    ...(options.active === false ? {} : { execute: handler }),
  });
  const ports: ExecutionPorts = {
    registry: new CommandRegistry([
      contract('TEST-RecordFact', 1),
      contract('TEST-RecordFact', 2),
      contract('TEST-Other', 1),
      contract('TEST-ProductionDuplicateRule', 1),
    ]),
    transactions: fixture.transactions,
    outcomes: fixture.outcomes,
    audits: fixture.audit,
    authorization: {
      canExecute: () => Promise.resolve(true),
      canReplay: () => Promise.resolve(true),
    },
    recoveryFence: { permitsAdmission: () => Promise.resolve(true) },
    ...options.ports,
  };
  return {
    ports,
    executions: () => executions,
    run: (input: CommandRequest, caller: ExecutionContext = context()) =>
      executeCommand(JSON.stringify(input), caller, ports),
  };
}
