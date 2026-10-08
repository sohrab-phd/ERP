import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  CommandRegistry,
  executeCommand,
  type ExecutionContext,
  type CommandRequest,
  type ExecutionPorts,
  type ExecutionResult,
} from '@navard/shared-kernel';
import {
  IdentityService,
  IdentityAuthorization,
  hashPassword,
  type HumanRole,
} from '../../src/modules/identity/index.js';
import {
  InventoryPostingService,
  InventoryReceiptService,
} from '../../src/modules/inventory/index.js';
import {
  ReceiptService,
  type ReceiptPolicy,
  type InventoryReceiptPort,
  type ReceiptContext,
  type ReceiptStore,
} from '../../src/modules/procurement/index.js';
import { PostgresIdentityStore } from '../../src/infrastructure/postgresql/identity-store.js';
import { PostgresInventoryStore } from '../../src/infrastructure/postgresql/inventory-store.js';
import { PostgresInventoryReceiptStore } from '../../src/infrastructure/postgresql/inventory-receipt-store.js';
import { PostgresReceiptStore } from '../../src/infrastructure/postgresql/receipt-store.js';
import { request } from './synthetic-command.js';
import type { DatabaseFixture } from './database-fixture.js';

export const installation = '11111111-1111-4111-8111-111111111111';
export const authority = '22222222-2222-4222-8222-222222222222';
const password = 'synthetic receipt individual password';
let credential: Promise<string> | undefined;

export async function operators(db: DatabaseFixture) {
  credential ??= hashPassword(password);
  const identity = new IdentityService(
    new PostgresIdentityStore(db.runtime),
    db.transactions,
    installation,
    authority,
  );
  const tokens = new Map<HumanRole, string>();
  async function loginPerson(role: HumanRole, suffix = '') {
    const accountId = randomUUID();
    const username = `receipt.${role.toLowerCase()}${suffix}`;
    await db.owner.query(
      'INSERT INTO identity.account(installation_id,account_id,person_id,username,password_hash) VALUES($1,$2,$3,$4,$5)',
      [installation, accountId, randomUUID(), username, await credential],
    );
    await db.owner.query(
      'INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) VALUES($1,$2,$3,$4,$5)',
      [installation, accountId, authority, role, role === 'ACT-CUST' ? 'customer-a' : ''],
    );
    return (await identity.login(username, password)).token;
  }
  for (const role of ['ACT-WH', 'ACT-PROC', 'ACT-CUST', 'ACT-SEC'] as const)
    tokens.set(role, await loginPerson(role));
  const secondWarehouseToken = await loginPerson('ACT-WH', '.second-person');
  return {
    identity,
    tokens,
    actor: async (role: HumanRole = 'ACT-WH') =>
      identity.context(tokens.get(role)!, role, role === 'ACT-CUST' ? 'customer-a' : undefined),
    secondWarehouseActor: () => identity.context(secondWarehouseToken, 'ACT-WH'),
  };
}

export function receiptCommand(overrides: Partial<CommandRequest> = {}): CommandRequest {
  return request({
    command: 'PostGoodsReceipt',
    target: { kind: 'goods-receipt', id: randomUUID() },
    payload: {
      internalCode: 'FACTORY-INTERNAL',
      count: '2',
      measuredKg: '11',
      type: 'COIL',
      locationId: randomUUID(),
    },
    preconditions: {},
    ...overrides,
  });
}
export function completed(
  result: ExecutionResult,
  outcome: 'accepted' | 'rejected',
  family?: string,
) {
  assert.equal(result.status, 'completed', JSON.stringify(result));
  if (result.status !== 'completed') throw new Error('Expected completed receipt outcome');
  assert.equal(result.result.outcome, outcome, JSON.stringify(result));
  if (family !== undefined) assert.equal(result.result.family, family);
  return result;
}
export function receiptHarness(
  db: DatabaseFixture,
  identity: IdentityService,
  options: {
    policy?: ReceiptPolicy;
    inventory?: InventoryReceiptPort;
    store?: ReceiptStore;
    ports?: Partial<Omit<ExecutionPorts, 'registry'>>;
  } = {},
) {
  const current = (ctx: ReceiptContext) =>
    ctx.actor.actorRole === 'ACT-WH' &&
    ctx.actor.customerScope === undefined &&
    identity.isCurrent(ctx.actor, ctx.transaction);
  const inventory = new InventoryPostingService(new PostgresInventoryStore(), {
    authorize: (ctx) => Promise.resolve(current(ctx)),
    validate: (ctx) =>
      Promise.resolve(
        ctx.request.command === 'PostGoodsReceipt'
          ? undefined
          : { family: 'GUARD_ACTOR' as const, message: 'Receipt owner required' },
      ),
    maintain: (ctx) => Promise.resolve(current(ctx)),
  });
  const stock = new InventoryReceiptService(new PostgresInventoryReceiptStore(), inventory, {
    canReceive: (ctx) => Promise.resolve(current(ctx)),
    canRead: (ctx) => Promise.resolve(current(ctx)),
  });
  const service = new ReceiptService(
    options.store ?? new PostgresReceiptStore(),
    options.inventory ?? stock,
    options.policy ?? {
      canPost: (ctx) => Promise.resolve(current(ctx)),
      canRead: (ctx) => Promise.resolve(current(ctx)),
    },
  );
  const authorization = new IdentityAuthorization(identity, [
    {
      command: 'PostGoodsReceipt',
      version: 1,
      roles: ['ACT-WH'],
      canTarget: (actor, input) =>
        Promise.resolve(actor.customerScope === undefined && input.target.kind === 'goods-receipt'),
      canDisclose: () => Promise.resolve(true),
    },
  ]);
  const ports: ExecutionPorts = {
    registry: new CommandRegistry([service.contract()]),
    transactions: db.transactions,
    outcomes: db.outcomes,
    audits: db.audit,
    authorization,
    recoveryFence: { permitsAdmission: () => Promise.resolve(true) },
    ...options.ports,
  };
  return {
    service,
    stock,
    inventory,
    run: (input: CommandRequest, actor: ExecutionContext) =>
      executeCommand(JSON.stringify(input), actor, ports),
  };
}
export async function readTransaction<T>(
  db: DatabaseFixture,
  actor: ExecutionContext,
  command: CommandRequest,
  body: (ctx: ReceiptContext) => Promise<T>,
) {
  const session = await db.transactions.begin();
  try {
    const result = await body({ actor, request: command, transaction: session.context });
    await session.commit();
    return result;
  } catch (error) {
    await session.rollback();
    throw error;
  } finally {
    await session.release();
  }
}
export async function bundleCounts(db: DatabaseFixture) {
  const result = await db.owner.query<{
    receipts: number;
    lots: number;
    units: number;
    movements: number;
    outcomes: number;
    audits: number;
  }>(
    'SELECT (SELECT count(*)::int FROM procurement.goods_receipt) AS receipts,(SELECT count(*)::int FROM inventory.material_lot) AS lots,(SELECT count(*)::int FROM inventory.unit) AS units,(SELECT count(*)::int FROM inventory.ledger) AS movements,(SELECT count(*)::int FROM kernel.command_outcome) AS outcomes,(SELECT count(*)::int FROM kernel.audit_event) AS audits',
  );
  assert.ok(result.rows[0]);
  return result.rows[0];
}
export const guard = (family: string) => (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'rejection' in error &&
  typeof error.rejection === 'object' &&
  error.rejection !== null &&
  'family' in error.rejection &&
  error.rejection.family === family;
