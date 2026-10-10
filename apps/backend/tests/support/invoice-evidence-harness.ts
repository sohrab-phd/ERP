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
  InvoiceEvidenceService,
  type InvoiceEvidenceStore,
  type InvoiceEvidencePolicy,
} from '../../src/modules/finance/index.js';
import { SalesService } from '../../src/modules/sales/index.js';
import { PostgresInvoiceEvidenceStore } from '../../src/infrastructure/postgresql/invoice-evidence-store.js';
import { PostgresSalesStore } from '../../src/infrastructure/postgresql/sales-store.js';
import type { DatabaseFixture } from './database-fixture.js';
import { salesPeople, salesHarness, salesCommand } from './sales-harness.js';
import { request } from './synthetic-command.js';
import { installation, authority, completed } from './receipt-harness.js';
export { completed, readTransaction, guard, installation, authority } from './receipt-harness.js';
export { pgCode } from './purchase-harness.js';

const password = 'synthetic invoice evidence individual';
let credential: Promise<string> | undefined;
export async function invoicePeople(db: DatabaseFixture, options: { seedOrder?: boolean } = {}) {
  const sales = await salesPeople(db);
  const draft = salesCommand(sales.customerId);
  if (options.seedOrder !== false)
    completed(await salesHarness(db, sales.identity).run(draft, sales.actor), 'accepted');
  for (const label of ['first', 'second']) {
    const self = await sales.identity.session(sales.tokens.get(label)!);
    await db.owner.query(
      'INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) VALUES($1,$2,$3,$4,$5)',
      [installation, self.accountId, authority, 'ACT-SALES', ''],
    );
  }
  const tokens = new Map<HumanRole, string>([['ACT-SALES', sales.tokens.get('first')!]]);
  credential ??= hashPassword(password);
  for (const role of [
    'ACT-FIN',
    'ACT-PROC',
    'ACT-WH',
    'ACT-OP',
    'ACT-PLAN',
    'ACT-SEC',
    'ACT-CUST',
  ] as const) {
    const accountId = randomUUID();
    await db.owner.query(
      'INSERT INTO identity.account(installation_id,account_id,person_id,username,password_hash) VALUES($1,$2,$3,$4,$5)',
      [installation, accountId, randomUUID(), `invoice.${role.toLowerCase()}`, await credential],
    );
    await db.owner.query(
      'INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) VALUES($1,$2,$3,$4,$5)',
      [installation, accountId, authority, role, role === 'ACT-CUST' ? sales.customerId : ''],
    );
    tokens.set(role, (await sales.identity.login(`invoice.${role.toLowerCase()}`, password)).token);
  }
  return {
    ...sales,
    salesTokens: sales.tokens,
    tokens,
    orderId: draft.target.id,
    draft,
    customerActor: sales.actor,
    actor: (role: HumanRole = 'ACT-SALES') =>
      sales.identity.context(
        tokens.get(role)!,
        role,
        role === 'ACT-CUST' ? sales.customerId : undefined,
      ),
    secondActor: () => sales.identity.context(sales.tokens.get('second')!, 'ACT-SALES'),
  };
}
export function invoiceCommand(
  orderId: string,
  customerId: string,
  overrides: Partial<CommandRequest> = {},
): CommandRequest {
  return request({
    command: 'RecordIssuedInvoiceEvidence',
    target: { kind: 'invoice-evidence', id: randomUUID() },
    payload: {
      invoiceDocumentReference: 'ISSUED-INVOICE-1',
      issueDate: '2026-10-10',
      salesOrderId: orderId,
      customerId,
    },
    preconditions: {},
    ...overrides,
  });
}
export function invoiceHarness(
  db: DatabaseFixture,
  identity: IdentityService,
  options: {
    store?: InvoiceEvidenceStore;
    policy?: InvoiceEvidencePolicy;
    ports?: Partial<Omit<ExecutionPorts, 'registry'>>;
  } = {},
) {
  const current = (ctx: {
    actor: ExecutionContext;
    transaction: Parameters<IdentityService['isCurrent']>[1];
  }) =>
    ctx.actor.customerScope === undefined &&
    ['ACT-SALES', 'ACT-FIN'].includes(ctx.actor.actorRole) &&
    identity.isCurrent(ctx.actor, ctx.transaction);
  const sales = new SalesService(
    new PostgresSalesStore(),
    { readStock: () => Promise.resolve([]) },
    {
      canAccess: () => Promise.resolve(false),
      canRecordInvoiceEvidence: async (ctx) =>
        ctx.actor.actorRole === 'ACT-SALES' && Boolean(await current(ctx)),
    },
  );
  const service = new InvoiceEvidenceService(
    options.store ?? new PostgresInvoiceEvidenceStore(),
    {
      reference: (ctx, orderId, customerId) => sales.invoiceReference(ctx, orderId, customerId),
    },
    options.policy ?? { current: async (ctx) => Boolean(await current(ctx)) },
  );
  const ports: ExecutionPorts = {
    registry: new CommandRegistry(service.contracts()),
    transactions: db.transactions,
    outcomes: db.outcomes,
    audits: db.audit,
    authorization: new IdentityAuthorization(identity, [
      {
        command: 'RecordIssuedInvoiceEvidence',
        version: 1,
        roles: ['ACT-SALES'],
        canTarget: (actor, input) =>
          Promise.resolve(
            actor.customerScope === undefined && input.target.kind === 'invoice-evidence',
          ),
        canDisclose: () => Promise.resolve(true),
      },
    ]),
    recoveryFence: { permitsAdmission: () => Promise.resolve(true) },
    ...options.ports,
  };
  return {
    service,
    run: (input: CommandRequest, actor: ExecutionContext) =>
      executeCommand(JSON.stringify(input), actor, ports),
  };
}
export async function invoiceCounts(db: DatabaseFixture) {
  const result = await db.owner.query<{
    evidence: number;
    outcomes: number;
    audits: number;
    foreignWrites: number;
  }>(
    'SELECT (SELECT count(*)::int FROM finance.invoice_evidence) AS evidence,(SELECT count(*)::int FROM kernel.command_outcome) AS outcomes,(SELECT count(*)::int FROM kernel.audit_event) AS audits,((SELECT count(*) FROM inventory.ledger)+(SELECT count(*) FROM inventory.reservation)+(SELECT count(*) FROM procurement.completed_purchase)+(SELECT count(*) FROM procurement.goods_receipt)+(SELECT count(*) FROM production.production_order))::int AS "foreignWrites"',
  );
  assert.ok(result.rows[0]);
  return result.rows[0];
}
