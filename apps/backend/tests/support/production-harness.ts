import { randomUUID } from 'node:crypto';
import type { CommandRequest, ExecutionContext, JsonObject } from '@navard/shared-kernel';
import { productionRole, productionTarget } from '../../src/modules/production/index.js';
import type { DatabaseFixture } from './database-fixture.js';
import { shippingApp } from './shipping-harness.js';
import { completed, installation } from './receipt-harness.js';
import { salesCommand, follow } from './sales-harness.js';
export function productionCommand(
  command: string,
  id: string,
  payload: JsonObject = {},
): CommandRequest {
  return {
    command,
    contract_version: 1,
    idempotency_key: randomUUID(),
    target: { kind: productionTarget(command), id },
    payload,
    preconditions: {},
  };
}
export async function productionApp(
  db: DatabaseFixture,
  databaseUrl = process.env.TEST_DATABASE_URL!,
) {
  const h = await shippingApp(db, databaseUrl);
  for (const [name, role, customer] of [
    ['plan', 'ACT-PLAN', h.people.customerId],
    ['operator', 'ACT-OP', h.people.customerId],
    ['manager', 'ACT-OP', h.people.customerId],
    ['other-op', 'ACT-OP', h.people.customerId],
    ['foreign-op', 'ACT-OP', h.people.otherCustomerId],
  ] as const)
    await h.people.person(name, role, customer);
  await db.owner.query(
    'UPDATE identity.role_grant SET authority_scope_id=$1 WHERE installation_id=$1',
    [installation],
  );
  await db.owner.query(
    "INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope,production_disposition) SELECT installation_id,account_id,$1,'ACT-PLAN',$2,true FROM identity.account WHERE username='sales.manager'",
    [installation, h.people.customerId],
  );
  const context = (name: string, role: 'ACT-PLAN' | 'ACT-OP') =>
    h.app.identity.context(
      h.people.tokens.get(name)!,
      role,
      name === 'foreign-op' ? h.people.otherCustomerId : h.people.customerId,
    );
  const planner = await context('plan', 'ACT-PLAN'),
    operator = await context('operator', 'ACT-OP'),
    manager = await context('manager', 'ACT-OP'),
    other = await context('other-op', 'ACT-OP'),
    foreign = await context('foreign-op', 'ACT-OP');
  const run = (
    r: CommandRequest,
    actor: ExecutionContext = productionRole(r.command) === 'ACT-PLAN' ? planner : operator,
  ) => h.app.command(JSON.stringify(r), actor);
  async function demand() {
    const baseDraft = salesCommand(h.people.customerId);
    const itemId = randomUUID();
    const draft = {
      ...baseDraft,
      payload: {
        ...baseDraft.payload,
        items: [
          {
            id: itemId,
            type: 'SHEET',
            description: 'Factory production demand',
            demandedKg: '110',
            allowPartialShipment: true,
          },
        ],
      },
    };
    completed(await h.salesRun(draft), 'accepted');
    completed(await h.salesRun(follow(draft, 'SubmitSalesOrder')), 'accepted');
    const assess = {
      ...follow(draft, 'DraftFulfillmentAssessment', { orderId: draft.target.id }),
      target: { kind: 'fulfillment-assessment', id: randomUUID() },
    };
    completed(await h.salesRun(assess), 'accepted');
    completed(await h.salesRun(follow(assess, 'RecordFulfillmentMake')), 'accepted');
    completed(
      await h.salesRun(follow(draft, 'ConfirmSalesOrder', { assessmentId: assess.target.id })),
      'accepted',
    );
    return { salesOrderId: draft.target.id, itemId };
  }
  async function prepare(
    options: { source?: string; kg?: string; steps?: number; issue?: boolean } = {},
  ) {
    const d = await demand();
    const orderId = randomUUID();
    const source = options.source ?? (await h.stock(options.kg ?? '110'));
    const ops = Array.from({ length: options.steps ?? 1 }, () => randomUUID());
    completed(await run(productionCommand('DraftProductionOrder', orderId, d)), 'accepted');
    completed(
      await run(
        productionCommand('PlanProductionOrder', orderId, {
          route: ops.map((id, index) => ({
            id,
            station: index ? 'GUILLOTINE_3M' : 'HEAVY_ROLL_OPENER',
          })),
        }),
      ),
      'accepted',
    );
    const allocationId = randomUUID();
    completed(
      await run(
        productionCommand('PlanMaterialAllocation', allocationId, {
          productionOrderId: orderId,
          kg: options.kg ?? '110',
        }),
      ),
      'accepted',
    );
    completed(
      await run(productionCommand('AssignMaterialAllocation', allocationId, { unitId: source })),
      'accepted',
    );
    completed(await run(productionCommand('ReleaseProductionOrder', orderId)), 'accepted');
    const issue = productionCommand('IssueAllocatedMaterial', allocationId);
    if (options.issue !== false) completed(await run(issue), 'accepted');
    completed(await run(productionCommand('StartProductionOrder', orderId)), 'accepted');
    completed(await run(productionCommand('StartProductionOperation', ops[0]!)), 'accepted');
    return { ...d, orderId, ops, source, allocationId, issue };
  }
  function complete(
    operationId: string,
    source: string,
    consumed = '110',
    output = '110',
    options: { residual?: string; scrap?: string; unitId?: string } = {},
  ) {
    const outId = options.unitId ?? randomUUID(),
      residualId = randomUUID();
    const locationId = randomUUID();
    const input = productionCommand('CompleteProductionOperation', operationId, {
      inputs: [{ unitId: source, kg: consumed }],
      outputs: [{ unitId: outId, kg: output, kind: 'SHEET', locationId, sourceUnitIds: [source] }],
      residuals: options.residual
        ? [
            {
              unitId: residualId,
              kg: options.residual,
              kind: 'COIL',
              locationId,
              sourceUnitId: source,
            },
          ]
        : [],
      scraps: options.scrap ? [{ kg: options.scrap, sourceUnitId: source }] : [],
      finalizeUnitIds: [],
    });
    return { input, outId, residualId };
  }
  return { ...h, run, planner, operator, manager, other, foreign, prepare, demand, complete };
}
export async function productionCounts(db: DatabaseFixture) {
  return (
    await db.owner.query<{ facts: number; ledger: number; outcomes: number; audits: number }>(
      'SELECT (SELECT count(*)::int FROM production.source_fact) AS facts,(SELECT count(*)::int FROM inventory.ledger) AS ledger,(SELECT count(*)::int FROM kernel.command_outcome) AS outcomes,(SELECT count(*)::int FROM kernel.audit_event) AS audits',
    )
  ).rows[0]!;
}
