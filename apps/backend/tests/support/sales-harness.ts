import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  CommandRegistry,
  executeCommand,
  type CommandRequest,
  type ExecutionContext,
  type ExecutionPorts,
} from '@navard/shared-kernel';
import {
  IdentityService,
  IdentityAuthorization,
  hashPassword,
  type HumanRole,
} from '../../src/modules/identity/index.js';
import { InventoryPostingService } from '../../src/modules/inventory/index.js';
import {
  SalesService,
  type SalesContext,
  type SalesStore,
  type InventorySalesPort,
} from '../../src/modules/sales/index.js';
import { PostgresIdentityStore } from '../../src/infrastructure/postgresql/identity-store.js';
import { PostgresInventoryStore } from '../../src/infrastructure/postgresql/inventory-store.js';
import { PostgresSalesStore } from '../../src/infrastructure/postgresql/sales-store.js';
import { transactionClient } from '../../src/infrastructure/postgresql/transaction.js';
import { request } from './synthetic-command.js';
import { installation, authority } from './receipt-harness.js';
import type { DatabaseFixture } from './database-fixture.js';

const password = 'synthetic sales individual password';
let credential: Promise<string> | undefined;
export async function salesPeople(db: DatabaseFixture) {
  credential ??= hashPassword(password);
  const customerId = randomUUID(),
    otherCustomerId = randomUUID();
  for (const [id, name] of [
    [customerId, 'Synthetic factory customer'],
    [otherCustomerId, 'Other synthetic customer'],
  ])
    await db.owner.query(
      'INSERT INTO sales.customer(installation_id,authority_scope,customer_id,display_name) VALUES($1,$2,$3,$4)',
      [installation, authority, id, name],
    );
  const identity = new IdentityService(
    new PostgresIdentityStore(db.runtime),
    db.transactions,
    installation,
    authority,
  );
  const tokens = new Map<string, string>();
  async function person(label: string, role: HumanRole, scope = customerId) {
    const accountId = randomUUID();
    await db.owner.query(
      'INSERT INTO identity.account(installation_id,account_id,person_id,username,password_hash) VALUES($1,$2,$3,$4,$5)',
      [installation, accountId, randomUUID(), `sales.${label}`, await credential],
    );
    await db.owner.query(
      'INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) VALUES($1,$2,$3,$4,$5)',
      [installation, accountId, authority, role, scope],
    );
    const token = (await identity.login(`sales.${label}`, password)).token;
    tokens.set(label, token);
    return identity.context(token, role, scope);
  }
  const actor = await person('first', 'ACT-SALES'),
    second = await person('second', 'ACT-SALES'),
    foreign = await person('foreign', 'ACT-SALES', otherCustomerId);
  return { identity, customerId, otherCustomerId, actor, second, foreign, tokens, person };
}
export function salesCommand(
  customerId: string,
  overrides: Partial<CommandRequest> = {},
): CommandRequest {
  return request({
    command: 'DraftSalesOrder',
    target: { kind: 'sales-order', id: randomUUID() },
    payload: {
      customerId,
      items: [
        {
          id: randomUUID(),
          type: 'COIL',
          description: 'Factory-confirmed coil demand',
          demandedKg: '5',
          allowPartialShipment: false,
        },
      ],
    },
    preconditions: {},
    ...overrides,
  });
}
export function follow(
  input: CommandRequest,
  command: string,
  payload: CommandRequest['payload'] = {},
): CommandRequest {
  return { ...input, command, idempotency_key: randomUUID(), payload };
}
export function salesHarness(
  db: DatabaseFixture,
  identity: IdentityService,
  options: {
    store?: SalesStore;
    inventory?: InventorySalesPort;
    ports?: Partial<Omit<ExecutionPorts, 'registry'>>;
  } = {},
) {
  const current = (ctx: SalesContext) =>
    ctx.actor.actorRole === 'ACT-SALES' &&
    ctx.actor.customerScope !== undefined &&
    identity.isCurrent(ctx.actor, ctx.transaction);
  const inventory = new InventoryPostingService(new PostgresInventoryStore(), {
    authorize: () => Promise.resolve(false),
    validate: () => Promise.resolve({ family: 'GUARD_ACTOR', message: 'Sales cannot post stock' }),
    maintain: () => Promise.resolve(false),
    availability: async (ctx, unit) =>
      Boolean(
        ['RecordFulfillmentStock', 'ConfirmSalesOrder'].includes(ctx.request.command) &&
        (await current(ctx)) &&
        (unit === undefined ||
          unit.customerScope === '' ||
          unit.customerScope === ctx.actor.customerScope),
      ),
  });
  const service = new SalesService(
    options.store ?? new PostgresSalesStore(),
    options.inventory ?? { readStock: (ctx, ids) => inventory.availability(ctx, ids) },
    { canAccess: async (ctx, id) => ctx.actor.customerScope === id && (await current(ctx)) },
  );
  const contracts = service.contracts();
  const authorization = new IdentityAuthorization(
    identity,
    contracts.map((contract) => ({
      command: contract.command,
      version: contract.version,
      roles: ['ACT-SALES'] as const,
      canTarget: (actor, input) =>
        Promise.resolve(
          actor.customerScope !== undefined &&
            ['sales-order', 'fulfillment-assessment'].includes(input.target.kind) &&
            (input.command !== 'DraftSalesOrder' ||
              input.payload.customerId === actor.customerScope),
        ),
      canDisclose: async (actor, input, result, tx) => {
        if (result.outcome === 'accepted') return result.data?.customerId === actor.customerScope;
        const executor = tx ? transactionClient(tx) : db.runtime;
        const table =
          input.target.kind === 'sales-order'
            ? 'sales.sales_order'
            : 'sales.fulfillment_assessment';
        const column = input.target.kind === 'sales-order' ? 'order_id' : 'assessment_id';
        const existing = await executor.query<{ customer_id: string }>(
          `SELECT customer_id FROM ${table} WHERE installation_id=$1 AND authority_scope=$2 AND ${column}=$3`,
          [actor.installationId, actor.authorityScopeId, input.target.id],
        );
        return (
          existing.rows[0] === undefined || existing.rows[0].customer_id === actor.customerScope
        );
      },
    })),
  );
  const ports: ExecutionPorts = {
    registry: new CommandRegistry(contracts),
    transactions: db.transactions,
    outcomes: db.outcomes,
    audits: db.audit,
    authorization,
    recoveryFence: { permitsAdmission: () => Promise.resolve(true) },
    ...options.ports,
  };
  return {
    service,
    inventory,
    run: (input: CommandRequest, actor: ExecutionContext) =>
      executeCommand(JSON.stringify(input), actor, ports),
  };
}
export async function salesRead<T>(
  db: DatabaseFixture,
  actor: ExecutionContext,
  command: CommandRequest,
  body: (ctx: SalesContext) => Promise<T>,
): Promise<T> {
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
export async function salesCounts(db: DatabaseFixture) {
  const result = await db.owner.query<{
    orders: number;
    assessments: number;
    outcomes: number;
    audits: number;
    movements: number;
    reservations: number;
  }>(
    'SELECT (SELECT count(*)::int FROM sales.sales_order) AS orders,(SELECT count(*)::int FROM sales.fulfillment_assessment) AS assessments,(SELECT count(*)::int FROM kernel.command_outcome) AS outcomes,(SELECT count(*)::int FROM kernel.audit_event) AS audits,(SELECT count(*)::int FROM inventory.ledger) AS movements,(SELECT count(*)::int FROM inventory.reservation) AS reservations',
  );
  assert.ok(result.rows[0]);
  return result.rows[0];
}
