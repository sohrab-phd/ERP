import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { withDatabase } from '../support/database-fixture.js';
import { completed } from '../support/receipt-harness.js';
import { salesCommand, follow } from '../support/sales-harness.js';
import { balance } from '../support/reservation-harness.js';
import {
  productionApp,
  productionCommand,
  productionCounts,
} from '../support/production-harness.js';
void test('own allocated kg bounds cumulative consumption even when the whole physically issued Unit has more kg; WIP and remainder cannot be selected as saleable stock', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const source = await h.stock('110'),
        p = await h.prepare({ source, kg: '70', steps: 2 }),
        before = await productionCounts(db);
      completed(
        await h.run(h.complete(p.ops[0]!, source, '71', '71').input),
        'rejected',
        'GUARD_INVARIANT',
      );
      assert.equal((await productionCounts(db)).facts, before.facts);
      assert.equal((await productionCounts(db)).ledger, before.ledger);
      const first = h.complete(p.ops[0]!, source, '70', '70');
      completed(await h.run(first.input), 'accepted');
      assert.deepEqual(await balance(db, source), { on_hand: '40', reserved: '0' });
      for (const [unitId, type] of [
        [source, 'COIL'],
        [first.outId, 'SHEET'],
      ] as const) {
        const itemId = randomUUID(),
          base = salesCommand(h.people.customerId),
          draft = {
            ...base,
            payload: {
              ...base.payload,
              items: [
                {
                  id: itemId,
                  type,
                  description: 'Must not expose physically restricted material',
                  demandedKg: '1',
                  allowPartialShipment: true,
                },
              ],
            },
          };
        completed(await h.salesRun(draft), 'accepted');
        completed(await h.salesRun(follow(draft, 'SubmitSalesOrder')), 'accepted');
        const assessment = {
          ...follow(draft, 'DraftFulfillmentAssessment', { orderId: draft.target.id }),
          target: { kind: 'fulfillment-assessment', id: randomUUID() },
        };
        completed(await h.salesRun(assessment), 'accepted');
        completed(
          await h.salesRun(
            follow(assessment, 'RecordFulfillmentStock', {
              selections: [{ itemId, unitIds: [unitId] }],
            }),
          ),
          'rejected',
          'GUARD_ACTOR',
        );
      }
      completed(await h.run(productionCommand('StartProductionOperation', p.ops[1]!)), 'accepted');
      completed(
        await h.run(h.complete(p.ops[1]!, source, '1', '1').input),
        'rejected',
        'GUARD_INVARIANT',
      );
      assert.deepEqual(await balance(db, source), { on_hand: '40', reserved: '0' });
      const final = h.complete(p.ops[1]!, first.outId, '70', '70');
      completed(await h.run(final.input), 'accepted');
      assert.deepEqual(await balance(db, first.outId), { on_hand: '0', reserved: '0' });
      assert.deepEqual(await balance(db, final.outId), { on_hand: '70', reserved: '0' });
    } finally {
      await h.app.stop();
    }
  }));
