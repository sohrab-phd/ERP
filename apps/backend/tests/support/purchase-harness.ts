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
  IdentityAuthorization,
  hashPassword,
  type IdentityService,
  type HumanRole,
} from '../../src/modules/identity/index.js';
import {
  PurchaseService,
  type PurchaseStore,
  type PurchasePolicy,
} from '../../src/modules/procurement/index.js';
import { PostgresPurchaseStore } from '../../src/infrastructure/postgresql/purchase-store.js';
import type { DatabaseFixture } from './database-fixture.js';
import { request } from './synthetic-command.js';
import { operators, installation, authority } from './receipt-harness.js';
export { completed, readTransaction, guard, installation, authority } from './receipt-harness.js';

const secondPassword = 'synthetic second purchasing individual';
let secondHash: Promise<string> | undefined;
export async function purchasingPeople(db: DatabaseFixture) {
  const people = await operators(db);
  const accountId = randomUUID();
  secondHash ??= hashPassword(secondPassword);
  await db.owner.query(
    'INSERT INTO identity.account(installation_id,account_id,person_id,username,password_hash) VALUES($1,$2,$3,$4,$5)',
    [installation, accountId, randomUUID(), 'purchase.second.person', await secondHash],
  );
  await db.owner.query(
    'INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) VALUES($1,$2,$3,$4,$5)',
    [installation, accountId, authority, 'ACT-PROC', ''],
  );
  const secondToken = (await people.identity.login('purchase.second.person', secondPassword)).token;
  return {
    ...people,
    actor: (role: HumanRole = 'ACT-PROC') => people.actor(role),
    secondActor: () => people.identity.context(secondToken, 'ACT-PROC'),
  };
}

export function purchaseCommand(overrides: Partial<CommandRequest> = {}): CommandRequest {
  return request({
    command: 'RecordCompletedPurchase',
    target: { kind: 'purchase-record', id: randomUUID() },
    payload: {
      purchaseDocumentReference: 'PURCHASE-DOC-1',
      supplierReference: 'Descriptive factory supplier',
      purchaseDate: '2026-10-10',
      materialDescription: 'Steel coil purchased',
    },
    preconditions: {},
    ...overrides,
  });
}
export function proformaCommand(
  purchaseId: string,
  overrides: Partial<CommandRequest> = {},
): CommandRequest {
  return request({
    command: 'RecordPurchaseProformaSent',
    target: { kind: 'purchase-proforma', id: randomUUID() },
    payload: { purchaseId, proformaReference: 'PROFORMA-DOC-1', sentDate: '2026-10-10' },
    preconditions: {},
    ...overrides,
  });
}
export function purchaseHarness(
  db: DatabaseFixture,
  identity: IdentityService,
  options: {
    store?: PurchaseStore;
    policy?: PurchasePolicy;
    ports?: Partial<Omit<ExecutionPorts, 'registry'>>;
  } = {},
) {
  const service = new PurchaseService(
    options.store ?? new PostgresPurchaseStore(),
    options.policy ?? {
      current: (ctx) =>
        Promise.resolve(
          ctx.actor.actorRole === 'ACT-PROC' &&
            ctx.actor.customerScope === undefined &&
            identity.isCurrent(ctx.actor, ctx.transaction),
        ),
    },
  );
  const authorization = new IdentityAuthorization(
    identity,
    ['RecordCompletedPurchase', 'RecordPurchaseProformaSent'].map((command) => ({
      command,
      version: 1,
      roles: ['ACT-PROC'],
      canTarget: (actor, input) =>
        Promise.resolve(
          actor.customerScope === undefined &&
            input.target.kind ===
              (command === 'RecordCompletedPurchase' ? 'purchase-record' : 'purchase-proforma'),
        ),
      canDisclose: () => Promise.resolve(true),
    })),
  );
  const ports: ExecutionPorts = {
    registry: new CommandRegistry(service.contracts()),
    transactions: db.transactions,
    outcomes: db.outcomes,
    audits: db.audit,
    authorization,
    recoveryFence: { permitsAdmission: () => Promise.resolve(true) },
    ...options.ports,
  };
  return {
    service,
    run: (input: CommandRequest, actor: ExecutionContext) =>
      executeCommand(JSON.stringify(input), actor, ports),
  };
}
export async function purchaseCounts(db: DatabaseFixture) {
  const result = await db.owner.query<{
    purchases: number;
    proformas: number;
    outcomes: number;
    audits: number;
    foreignWrites: number;
  }>(
    'SELECT (SELECT count(*)::int FROM procurement.completed_purchase) AS purchases,(SELECT count(*)::int FROM procurement.purchase_proforma_sent) AS proformas,(SELECT count(*)::int FROM kernel.command_outcome) AS outcomes,(SELECT count(*)::int FROM kernel.audit_event) AS audits,((SELECT count(*) FROM procurement.goods_receipt)+(SELECT count(*) FROM inventory.material_lot)+(SELECT count(*) FROM inventory.unit)+(SELECT count(*) FROM inventory.ledger)+(SELECT count(*) FROM inventory.balance)+(SELECT count(*) FROM inventory.reservation)+(SELECT count(*) FROM sales.sales_order)+(SELECT count(*) FROM sales.fulfillment_assessment)+(SELECT count(*) FROM sales.make_reference))::int AS "foreignWrites"',
  );
  assert.ok(result.rows[0]);
  return result.rows[0];
}
export const pgCode = (code: string) => (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === code;
