import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline';
import type { CommandRequest } from '@navard/shared-kernel';
import { withDatabase } from './database-fixture.js';
import { inventoryDiscoveryHarness } from './inventory-discovery-harness.js';
import { browserReceivingLocation } from './browser-harness.js';
import { completed, installation } from './receipt-harness.js';
import { salesCommand, follow } from './sales-harness.js';

// Isolated test process only. Product code has no test-control route or fake identity.
const realNow = Date.now.bind(Date);
let cursorOffset = 0;
Date.now = () => realNow() + cursorOffset;

await withDatabase(async (db) => {
  const h = await inventoryDiscoveryHarness(db, { receivingLocation: browserReceivingLocation });
  const f = h.fixture;
  const customerA = f.people.customerId,
    customerB = f.people.otherCustomerId;
  try {
    await db.owner.query(
      'UPDATE sales.customer SET display_name=$3 WHERE installation_id=$1 AND authority_scope=$1 AND customer_id=$2',
      [installation, customerA, 'A'.repeat(128)],
    );
    await db.owner.query(
      "INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) SELECT installation_id,account_id,$1,r.role,r.customer FROM identity.account CROSS JOIN (VALUES('ACT-PROC',''),('ACT-WH',''),('ACT-SALES',$2)) r(role,customer) WHERE installation_id=$1 AND username='sales.first' ON CONFLICT DO NOTHING",
      [installation, customerB],
    );
    for (let i = 0; i < 26; i++) {
      const id = randomUUID();
      await db.owner.query(
        'INSERT INTO sales.customer(installation_id,authority_scope,customer_id,display_name) VALUES($1,$1,$2,$3)',
        [installation, id, 'مشتری آزمون ' + String(i)],
      );
      await db.owner.query(
        "INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) SELECT installation_id,account_id,$1,'ACT-SALES',$2 FROM identity.account WHERE installation_id=$1 AND username='sales.first'",
        [installation, id],
      );
    }
    const actor = await f.app.identity.context(
      f.people.tokens.get('first')!,
      'ACT-SALES',
      customerA,
    );
    const other = await f.app.identity.context(
      f.people.tokens.get('foreign')!,
      'ACT-SALES',
      customerB,
    );
    const run = (input: CommandRequest) =>
      f.app.command(JSON.stringify(input), actor).then((result) => completed(result, 'accepted'));
    const order = async (type = 'COIL', kg = '5', description = 'تقاضای آزمون') => {
      const input = {
        ...salesCommand(customerA),
        payload: {
          customerId: customerA,
          items: [
            { id: randomUUID(), type, description, demandedKg: kg, allowPartialShipment: true },
          ],
        },
      };
      await run(input);
      return input;
    };
    const seedOrder = await order('COIL', '5', 'جست‌وجوی سفارش بدون دانستن شناسه');
    const bigOrder = await order('BEAM', '9007199254740993', 'B'.repeat(128));
    for (let i = 0; i < 26; i++) await order('COIL', '5', 'تقاضای صفحه ' + String(i));
    const foreignOrder = salesCommand(customerB);
    completed(await f.app.command(JSON.stringify(foreignOrder), other), 'accepted');
    const multiOrder = await order('COIL', '5', 'ارزیابی‌های مستقل');
    await run(follow(multiOrder, 'SubmitSalesOrder'));
    const assessmentIds: string[] = [];
    for (let i = 0; i < 12; i++) {
      const a = {
        ...follow(multiOrder, 'DraftFulfillmentAssessment', { orderId: multiOrder.target.id }),
        target: { kind: 'fulfillment-assessment', id: randomUUID() },
      };
      await run(a);
      assessmentIds.push(a.target.id);
    }
    const free = await h.legacy('11', 'PRIVATE-CUSTOMER-CONTRACT-' + randomUUID());
    const big = await h.legacy('9007199254740993', 'PRIVATE-BIG-' + randomUUID(), 'BEAM');
    for (let i = 0; i < 13; i++) await h.legacy('11', 'PRIVATE-PAGE-' + randomUUID());
    const beam = await h.legacy('110', 'PRIVATE-FRACTION-SOURCE-' + randomUUID(), 'BEAM');
    const production = await f.prepare({ source: beam.unitId });
    const fraction = f.complete(production.ops[0]!, production.source, '70.5', '70.500');
    completed(await f.run(fraction.input), 'accepted');
    // The reused P4a read-only snapshot also contains kernel audit/outcome counts.
    // P4b commands MUST write those; compare every Inventory table independently.
    const inventorySnapshot = async () => {
      const snapshot = JSON.parse(await h.stockSnapshot()) as Record<string, unknown>;
      assert.deepEqual(
        Object.keys(snapshot).sort(),
        [
          'units',
          'ledger',
          'balance',
          'claims',
          'issues',
          'legacy',
          'i2',
          'production',
          'outcomes',
          'audits',
        ].sort(),
      );
      delete snapshot.outcomes;
      delete snapshot.audits;
      return createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
    };
    const initialStock = await inventorySnapshot();
    const stats = async () =>
      (
        await db.owner.query<{
          orders: number;
          assessments: number;
          outcomes: number;
          ledger: number;
          reservations: number;
        }>(
          'SELECT (SELECT count(*)::int FROM sales.sales_order) AS orders,(SELECT count(*)::int FROM sales.fulfillment_assessment) AS assessments,(SELECT count(*)::int FROM kernel.command_outcome) AS outcomes,(SELECT count(*)::int FROM inventory.ledger) AS ledger,(SELECT count(*)::int FROM inventory.reservation) AS reservations',
        )
      ).rows[0];
    console.log(
      JSON.stringify({
        ready: true,
        origin: h.origin,
        refs: {
          customerA,
          customerB,
          seedOrder: seedOrder.target.id,
          bigOrder: bigOrder.target.id,
          foreignOrder: foreignOrder.target.id,
          multiOrder: multiOrder.target.id,
          assessmentIds,
          free: free.unitId,
          big: big.unitId,
          fraction: fraction.outId,
        },
        initialStock,
      }),
    );
    const commands = createInterface({ input: process.stdin });
    for await (const line of commands) {
      const input = JSON.parse(line) as { id: number; command: string };
      try {
        let result: unknown = true;
        if (input.command === 'snapshot') result = await inventorySnapshot();
        else if (input.command === 'stats') result = await stats();
        else if (input.command === 'cursor-expire') cursorOffset += 601000;
        else if (input.command === 'cursor-reset') cursorOffset = 0;
        else if (input.command === 'revoke-a')
          await db.owner.query(
            "DELETE FROM identity.role_grant WHERE installation_id=$1 AND authority_scope_id=$1 AND actor_role='ACT-SALES' AND customer_scope=$2 AND account_id IN (SELECT account_id FROM identity.account WHERE installation_id=$1 AND username='sales.first')",
            [installation, customerA],
          );
        else if (input.command === 'restore-a')
          await db.owner.query(
            "INSERT INTO identity.role_grant(installation_id,account_id,authority_scope_id,actor_role,customer_scope) SELECT installation_id,account_id,$1,'ACT-SALES',$2 FROM identity.account WHERE installation_id=$1 AND username='sales.first' ON CONFLICT DO NOTHING",
            [installation, customerA],
          );
        else if (input.command === 'expire')
          await db.owner.query(
            "UPDATE identity.session SET created_at=clock_timestamp()-interval '32 minutes',last_seen_at=clock_timestamp()-interval '31 minutes' WHERE installation_id=$1 AND account_id IN (SELECT account_id FROM identity.account WHERE installation_id=$1 AND username='sales.first')",
            [installation],
          );
        else if (input.command === 'stop') {
          console.log(JSON.stringify({ id: input.id, result: true }));
          break;
        } else assert.fail('Unknown fixture control');
        console.log(JSON.stringify({ id: input.id, result }));
      } catch {
        console.log(
          JSON.stringify({ id: input.id, error: 'Fixture control failed: ' + input.command }),
        );
      }
    }
  } finally {
    await h.stop();
  }
});
