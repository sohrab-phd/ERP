import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { CommandRequest, ExecutionContext, JsonObject } from '@navard/shared-kernel';
import { compose } from '../../src/composition-root.js';
import type { DatabaseFixture } from './database-fixture.js';
import { salesPeople, salesCommand, follow } from './sales-harness.js';
import { operators, installation, receiptCommand, completed } from './receipt-harness.js';

export async function reservationApp(
  db: DatabaseFixture,
  databaseUrl = process.env.TEST_DATABASE_URL!,
) {
  const people = await salesPeople(db);
  const warehouse = await operators(db);
  await db.owner.query(
    'UPDATE identity.role_grant SET authority_scope_id=$1 WHERE installation_id=$1',
    [installation],
  );
  await db.owner.query('UPDATE sales.customer SET authority_scope=$1 WHERE installation_id=$1', [
    installation,
  ]);
  const app = compose({
    nodeEnv: 'production',
    host: '127.0.0.1',
    port: 0,
    databaseUrl,
    installationId: installation,
    logLevel: 'error',
    commandAdmissionReconciled: true,
  });
  const actor = await app.identity.context(
    people.tokens.get('first')!,
    'ACT-SALES',
    people.customerId,
  );
  const second = await app.identity.context(
    people.tokens.get('second')!,
    'ACT-SALES',
    people.customerId,
  );
  const foreign = await app.identity.context(
    people.tokens.get('foreign')!,
    'ACT-SALES',
    people.otherCustomerId,
  );
  const wh = await app.identity.context(warehouse.tokens.get('ACT-WH')!, 'ACT-WH');
  const run = (input: CommandRequest, context = actor) =>
    app.command(JSON.stringify(input), context);
  async function stock(kg = '11', type = 'COIL') {
    const input = receiptCommand();
    const posted = completed(
      await run({ ...input, payload: { ...input.payload, measuredKg: kg, type } }, wh),
      'accepted',
    );
    const data = posted.result.data as JsonObject;
    assert.equal(typeof data.unitId, 'string');
    return data.unitId as string;
  }
  async function order(
    units: string[],
    options: {
      actor?: ExecutionContext;
      customerId?: string;
      demandedKg?: string;
      confirmed?: boolean;
    } = {},
  ) {
    const customerId = options.customerId ?? people.customerId;
    const context = options.actor ?? actor;
    const input = salesCommand(customerId);
    const items = input.payload.items as JsonObject[];
    const itemId = items[0]!.id as string;
    const draft = {
      ...input,
      payload: {
        ...input.payload,
        items: [{ ...items[0]!, demandedKg: options.demandedKg ?? '5' }],
      },
    };
    completed(await run(draft, context), 'accepted');
    completed(await run(follow(draft, 'SubmitSalesOrder'), context), 'accepted');
    const assessment = {
      ...follow(draft, 'DraftFulfillmentAssessment', { orderId: draft.target.id }),
      target: { kind: 'fulfillment-assessment', id: randomUUID() },
    };
    completed(await run(assessment, context), 'accepted');
    completed(
      await run(
        follow(assessment, 'RecordFulfillmentStock', { selections: [{ itemId, unitIds: units }] }),
        context,
      ),
      'accepted',
    );
    if (options.confirmed !== false)
      completed(
        await run(
          follow(draft, 'ConfirmSalesOrder', { assessmentId: assessment.target.id }),
          context,
        ),
        'accepted',
      );
    return {
      input: draft,
      orderId: draft.target.id,
      itemId,
      assessmentId: assessment.target.id,
      actor: context,
    };
  }
  return { app, people, warehouse, actor, second, foreign, wh, run, stock, order };
}
export function reservationCommand(
  orderId: string,
  itemId: string,
  unitId: string,
  kg = '5',
): CommandRequest {
  return {
    command: 'RequestReservation',
    contract_version: 1,
    idempotency_key: randomUUID(),
    target: { kind: 'reservation', id: randomUUID() },
    payload: { orderId, itemId, unitId, kg },
    preconditions: {},
  };
}
export function activate(input: CommandRequest): CommandRequest {
  return follow(input, 'ActivateReservation');
}
export async function reservationCounts(db: DatabaseFixture) {
  const result = await db.owner.query<{
    requests: number;
    active: number;
    movements: number;
    outcomes: number;
    audits: number;
  }>(
    "SELECT (SELECT count(*)::int FROM inventory.reservation_request) AS requests,(SELECT count(*)::int FROM inventory.reservation WHERE state='ACTIVE') AS active,(SELECT count(*)::int FROM inventory.ledger) AS movements,(SELECT count(*)::int FROM kernel.command_outcome) AS outcomes,(SELECT count(*)::int FROM kernel.audit_event) AS audits",
  );
  assert.ok(result.rows[0]);
  return result.rows[0];
}
export async function balance(db: DatabaseFixture, id: string) {
  const result = await db.owner.query<{ on_hand: string; reserved: string }>(
    'SELECT on_hand::text,reserved::text FROM inventory.balance WHERE unit_id=$1',
    [id],
  );
  assert.ok(result.rows[0]);
  return result.rows[0];
}
