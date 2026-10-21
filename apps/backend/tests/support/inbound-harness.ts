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
import {
  InboundService,
  type InboundStore,
  type InboundQueryName,
} from '../../src/modules/procurement/index.js';
import { PostgresInboundStore } from '../../src/infrastructure/postgresql/inbound-store.js';
import { PostgresIdentityStore } from '../../src/infrastructure/postgresql/identity-store.js';
import type { DatabaseFixture } from './database-fixture.js';
import { request } from './synthetic-command.js';
export { completed, guard } from './receipt-harness.js';
export { pgCode } from './purchase-harness.js';
export const inboundFactory = '44444444-4444-4444-8444-444444444444';
const password = 'synthetic inbound individual password';
let hash: Promise<string> | undefined;
export async function inboundPeople(db: DatabaseFixture, factory = inboundFactory) {
  hash ??= hashPassword(password);
  const identity = new IdentityService(
    new PostgresIdentityStore(db.runtime),
    db.transactions,
    factory,
    factory,
  );
  async function person(role: HumanRole) {
    const id = randomUUID();
    const username = 'inbound.' + id;
    await db.owner.query(
      'INSERT INTO identity.account(installation_id,account_id,person_id,username,password_hash) VALUES($1,$2,$3,$4,$5)',
      [factory, id, randomUUID(), username, await hash],
    );
    await db.owner.query(
      'INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) VALUES($1,$2,$1,$3,$4)',
      [factory, id, role, role === 'ACT-CUST' ? 'unrelated-customer' : ''],
    );
    const token = (await identity.login(username, password)).token;
    return {
      id,
      token,
      actor: () =>
        identity.context(token, role, role === 'ACT-CUST' ? 'unrelated-customer' : undefined),
    };
  }
  return {
    identity,
    factory,
    person,
    proc: await person('ACT-PROC'),
    proc2: await person('ACT-PROC'),
    wh: await person('ACT-WH'),
    sec: await person('ACT-SEC'),
  };
}
export function optionCommand(
  catalogue = 'MATERIAL_TYPE',
  label = 'کلاف آزمایشی',
  overrides: Partial<CommandRequest> = {},
): CommandRequest {
  return request({
    command: 'AddInboundCatalogueOption',
    target: { kind: 'inbound-catalogue-option', id: randomUUID() },
    payload: { catalogue, label },
    preconditions: {},
    ...overrides,
  });
}
export function orderCommand(
  materialTypeOptionId: string,
  overrides: Partial<CommandRequest> = {},
): CommandRequest {
  return request({
    command: 'RegisterOperationalPurchaseOrder',
    target: { kind: 'operational-purchase-order', id: randomUUID() },
    payload: {
      orderReference: ' PO-۱۲ ',
      registrationDateJalali: '1403-12-30',
      lines: [
        {
          materialTypeOptionId,
          widthM: '1.200',
          thicknessMm: '0.35',
          unitWeightKg: '2000',
          orderedUnitCount: '5',
        },
      ],
    },
    preconditions: {},
    ...overrides,
  });
}
export function inboundHarness(
  db: DatabaseFixture,
  identity: IdentityService,
  options: { store?: InboundStore; ports?: Partial<Omit<ExecutionPorts, 'registry'>> } = {},
) {
  const service = new InboundService(options.store ?? new PostgresInboundStore(), {
    current: (ctx) => identity.isCurrent(ctx.actor, ctx.transaction),
  });
  const authorization = new IdentityAuthorization(
    identity,
    service.contracts().map((c) => ({
      command: c.command,
      version: 1,
      roles:
        c.command === 'RegisterOperationalPurchaseOrder' ? ['ACT-PROC'] : ['ACT-PROC', 'ACT-WH'],
      canTarget: (actor, r) =>
        Promise.resolve(
          actor.customerScope === undefined &&
            actor.installationId === actor.authorityScopeId &&
            r.target.kind ===
              (c.command === 'RegisterOperationalPurchaseOrder'
                ? 'operational-purchase-order'
                : 'inbound-catalogue-option'),
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
    ports,
    run: (r: CommandRequest, actor: ExecutionContext) =>
      executeCommand(JSON.stringify(r), actor, ports),
    async query(kind: InboundQueryName, input: Record<string, unknown>, actor: ExecutionContext) {
      const tx = await db.transactions.begin();
      try {
        const result = await service.query(
          { actor, transaction: tx.context, request: request({ command: kind }) },
          kind,
          input,
        );
        await tx.commit();
        return result;
      } catch (e) {
        await tx.rollback();
        throw e;
      } finally {
        await tx.release();
      }
    },
  };
}
export async function inboundCounts(db: DatabaseFixture) {
  return (
    await db.owner.query<{
      orders: number;
      lines: number;
      options: number;
      outcomes: number;
      audits: number;
      foreign: number;
    }>(
      `SELECT (SELECT count(*)::int FROM procurement.operational_purchase_order) AS orders,(SELECT count(*)::int FROM procurement.operational_purchase_order_line) AS lines,(SELECT count(*)::int FROM procurement.inbound_catalogue_option) AS options,(SELECT count(*)::int FROM kernel.command_outcome) AS outcomes,(SELECT count(*)::int FROM kernel.audit_event) AS audits,((SELECT count(*) FROM procurement.goods_receipt)+(SELECT count(*) FROM inventory.material_lot)+(SELECT count(*) FROM inventory.unit)+(SELECT count(*) FROM inventory.ledger)+(SELECT count(*) FROM inventory.balance)+(SELECT count(*) FROM inventory.reservation)+(SELECT count(*) FROM sales.sales_order)+(SELECT count(*) FROM shipping.shipment)+(SELECT count(*) FROM production.production_order)+(SELECT count(*) FROM finance.invoice_evidence)+(SELECT count(*) FROM procurement.completed_purchase)+(SELECT count(*) FROM procurement.purchase_proforma_sent))::int AS foreign`,
    )
  ).rows[0]!;
}
