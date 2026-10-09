import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { CommandRequest, ExecutionContext } from '@navard/shared-kernel';
import type { DatabaseFixture } from './database-fixture.js';
import { reservationApp, reservationCommand, activate } from './reservation-harness.js';
import { completed, installation } from './receipt-harness.js';
import { salesCommand, follow } from './sales-harness.js';

export function shippingCommand(
  command: string,
  kind: 'package' | 'shipment',
  payload: CommandRequest['payload'] = {},
  id = randomUUID(),
): CommandRequest {
  return {
    command,
    contract_version: 1,
    idempotency_key: randomUUID(),
    target: { kind, id },
    payload,
    preconditions: {},
  };
}
export async function shippingApp(
  db: DatabaseFixture,
  databaseUrl = process.env.TEST_DATABASE_URL!,
) {
  const h = await reservationApp(db, databaseUrl);
  await h.people.person('ship-first', 'ACT-SHIP');
  await h.people.person('ship-second', 'ACT-SHIP');
  await h.people.person('ship-foreign', 'ACT-SHIP', h.people.otherCustomerId);
  await db.owner.query(
    'UPDATE identity.role_grant SET authority_scope_id=$1 WHERE installation_id=$1',
    [installation],
  );
  const ship = await h.app.identity.context(
    h.people.tokens.get('ship-first')!,
    'ACT-SHIP',
    h.people.customerId,
  );
  const shipSecond = await h.app.identity.context(
    h.people.tokens.get('ship-second')!,
    'ACT-SHIP',
    h.people.customerId,
  );
  const shipForeign = await h.app.identity.context(
    h.people.tokens.get('ship-foreign')!,
    'ACT-SHIP',
    h.people.otherCustomerId,
  );
  const run = (input: CommandRequest, actor: ExecutionContext = ship) =>
    h.app.command(JSON.stringify(input), actor);
  async function order(
    units: string[],
    options: {
      demandedKg?: string;
      partial?: boolean;
      actor?: ExecutionContext;
      customerId?: string;
    } = {},
  ) {
    const actor = options.actor ?? h.actor;
    const customerId = options.customerId ?? h.people.customerId;
    const baseDraft = salesCommand(customerId);
    const itemId = randomUUID();
    const draft = {
      ...baseDraft,
      payload: {
        ...baseDraft.payload,
        items: [
          {
            id: itemId,
            type: 'COIL',
            description: 'Complete Units for factory dispatch',
            demandedKg: options.demandedKg ?? '11',
            allowPartialShipment: options.partial ?? false,
          },
        ],
      },
    };
    completed(await h.run(draft, actor), 'accepted');
    completed(await h.run(follow(draft, 'SubmitSalesOrder'), actor), 'accepted');
    const assessment = {
      ...follow(draft, 'DraftFulfillmentAssessment', { orderId: draft.target.id }),
      target: { kind: 'fulfillment-assessment', id: randomUUID() },
    };
    completed(await h.run(assessment, actor), 'accepted');
    completed(
      await h.run(
        follow(assessment, 'RecordFulfillmentStock', { selections: [{ itemId, unitIds: units }] }),
        actor,
      ),
      'accepted',
    );
    completed(
      await h.run(
        follow(draft, 'ConfirmSalesOrder', { assessmentId: assessment.target.id }),
        actor,
      ),
      'accepted',
    );
    return { input: draft, orderId: draft.target.id, itemId, actor };
  }
  async function claim(
    orderId: string,
    itemId: string,
    unitId: string,
    kg = '11',
    actor = h.actor,
  ) {
    const input = reservationCommand(orderId, itemId, unitId, kg);
    completed(await h.run(input, actor), 'accepted');
    completed(await h.run(activate(input), actor), 'accepted');
    return input;
  }
  async function ready(orderId: string, reservationIds: string[], actor = ship) {
    const pack = shippingCommand('DraftPackage', 'package', { orderId, reservationIds });
    completed(await run(pack, actor), 'accepted');
    completed(await run(follow(pack, 'PackPackage'), actor), 'accepted');
    const shipment = shippingCommand('DraftShipment', 'shipment', { orderId });
    completed(await run(shipment, actor), 'accepted');
    completed(
      await run(follow(pack, 'AssignPackageToShipment', { shipmentId: shipment.target.id }), actor),
      'accepted',
    );
    completed(await run(follow(shipment, 'MarkShipmentReady'), actor), 'accepted');
    completed(await run(follow(shipment, 'StartLoading'), actor), 'accepted');
    return { pack, shipment, dispatch: follow(shipment, 'DispatchShipment') };
  }
  return { ...h, run, salesRun: h.run, order, claim, ready, ship, shipSecond, shipForeign };
}
export async function shippingCounts(db: DatabaseFixture) {
  const result = await db.owner.query<{
    movements: number;
    onHand: string;
    reserved: string;
    active: number;
    outcomes: number;
    audits: number;
  }>(
    'SELECT (SELECT count(*)::int FROM inventory.ledger) AS movements,(SELECT coalesce(sum(on_hand),0)::text FROM inventory.balance) AS "onHand",(SELECT coalesce(sum(reserved),0)::text FROM inventory.balance) AS reserved,(SELECT count(*)::int FROM inventory.reservation WHERE state=\'ACTIVE\') AS active,(SELECT count(*)::int FROM kernel.command_outcome) AS outcomes,(SELECT count(*)::int FROM kernel.audit_event) AS audits',
  );
  assert.ok(result.rows[0]);
  return result.rows[0];
}
