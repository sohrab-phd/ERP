import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import type { JsonObject } from '@navard/shared-kernel';
import { withDatabase, type DatabaseFixture } from '../support/database-fixture.js';
import { productionApp, productionCommand } from '../support/production-harness.js';
import { shippingApp } from '../support/shipping-harness.js';
import { completed, guard, receiptCommand } from '../support/receipt-harness.js';
import { balance } from '../support/reservation-harness.js';
import { salesCommand, follow } from '../support/sales-harness.js';
import type { GenealogyTrace } from '../../src/modules/genealogy/index.js';

function has(trace: GenealogyTrace, kind: string, id: string) {
  return trace.nodes.some((n) => n.kind === kind && n.id === id);
}
async function evidence(db: DatabaseFixture) {
  // Exact durable rows, including balances: counts alone would miss accidental updates.
  const result: Record<string, unknown> = {};
  for (const table of [
    'production.source_fact',
    'production.product_batch',
    'inventory.production_origin',
    'inventory.material_lot',
    'inventory.unit',
    'inventory.ledger',
    'inventory.balance',
    'shipping.package',
    'shipping.shipment',
    'procurement.goods_receipt',
    'inventory.reservation',
    'shipping.package_content',
    'shipping.dispatch',
    'kernel.command_outcome',
    'kernel.audit_event',
  ]) {
    result[table] = (
      await db.owner.query<{ rows: unknown }>(
        `SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb) AS rows FROM ${table} t`,
      )
    ).rows[0]?.rows;
  }
  return result;
}
void test('live trace reconstructs partial input, WIP, final, reusable Residual and terminal Scrap without modifying durable facts', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare({ steps: 2 });
      for (const command of ['RecordStationEntry', 'DeclareStationCompletion'])
        completed(await h.run(productionCommand(command, p.ops[0]!)), 'accepted');
      const first = h.complete(p.ops[0]!, p.source, '70', '50', { residual: '10', scrap: '10' });
      completed(await h.run(first.input, h.manager), 'accepted');
      completed(await h.run(productionCommand('StartProductionOperation', p.ops[1]!)), 'accepted');
      const second = h.complete(p.ops[1]!, first.outId, '50', '48', { scrap: '2' });
      completed(await h.run(second.input, h.manager), 'accepted');
      const before = await evidence(db);
      const trace = await h.app.genealogyQuery(
        'TraceForward',
        { kind: 'UNIT', id: p.source },
        h.actor,
      );
      assert.ok(trace);
      assert.ok(
        has(trace, 'UNIT', first.outId) &&
          has(trace, 'UNIT', second.outId) &&
          has(trace, 'UNIT', first.residualId),
      );
      assert.equal(trace.nodes.filter((n) => n.kind === 'SCRAP').length, 2);
      assert.equal(trace.nodes.find((n) => n.id === p.source)?.state, 'PARTIALLY_CONSUMED');
      assert.deepEqual(await balance(db, p.source), { on_hand: '40', reserved: '0' });
      assert.equal(trace.edges.find((e) => e.to === `UNIT:${first.outId}`)?.kg, '50');
      assert.equal(trace.edges.find((e) => e.to === `UNIT:${first.residualId}`)?.kind, 'RESIDUAL');
      const back = await h.app.genealogyQuery(
        'TraceBackward',
        { kind: 'UNIT', id: second.outId },
        h.actor,
      );
      assert.ok(back);
      assert.ok(has(back, 'UNIT', p.source) && has(back, 'UNIT', first.outId));
      assert.ok(!has(back, 'UNIT', first.residualId));
      assert.equal(back.nodes.filter((n) => n.kind === 'RECEIPT').length, 1);
      assert.equal(back.nodes.filter((n) => n.kind === 'LOT').length, 1);
      assert.deepEqual(back.nodes.find((n) => n.id === p.source)?.intake, {
        internalCode: 'FACTORY-INTERNAL',
        type: 'COIL',
        count: '2',
        measuredKg: '110',
      });
      assert.equal(back.nodes.find((n) => n.id === second.outId)?.intake, undefined);
      const rows = (
        await db.owner.query<{ fact_id: string; data: JsonObject }>(
          "SELECT fact_id,data FROM production.source_fact WHERE operation_id=$1 AND kind='OUTPUT'",
          [p.ops[1]],
        )
      ).rows;
      for (const [kind, id] of [
        ['FACT', rows[0]!.fact_id],
        ['OPERATION', p.ops[1]!],
        ['ORDER', p.orderId],
        ['BATCH', rows[0]!.data.productBatchId as string],
        ['SALES_ORDER', p.salesOrderId],
      ] as const) {
        const associated = await h.app.genealogyQuery('TraceBackward', { kind, id }, h.actor);
        assert.ok(associated && has(associated, kind, id) && has(associated, 'UNIT', p.source));
      }
      for (const kind of ['LOT', 'RECEIPT'] as const) {
        const origin = back.nodes.find((n) => n.kind === kind)!;
        const forward = await h.app.genealogyQuery(
          'TraceForward',
          { kind, id: origin.id },
          h.actor,
        );
        assert.ok(forward && has(forward, 'UNIT', second.outId));
      }
      const context = await h.app.genealogyQuery(
        'TraceForward',
        { kind: 'OPERATION', id: p.ops[0]! },
        h.actor,
      );
      assert.ok(
        context?.nodes.find((n) => n.id === p.ops[0])?.events.some((e) => e.kind === 'ENTRY'),
      );
      assert.ok(
        context?.nodes.find((n) => n.id === p.ops[0])?.events.some((e) => e.kind === 'DECLARATION'),
      );
      assert.deepEqual(await evidence(db), before);
      assert.ok(!JSON.stringify(back).includes('orderBinding'));
    } finally {
      await h.app.stop();
    }
  }));
void test('FINALIZED preserves the same WIP identity without adding stock, duplicate output or self ancestry', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare({ steps: 2 });
      const first = h.complete(p.ops[0]!, p.source);
      completed(await h.run(first.input), 'accepted');
      const wip = await h.app.genealogyQuery(
        'TraceForward',
        { kind: 'UNIT', id: p.source },
        h.actor,
      );
      assert.equal(wip?.nodes.find((n) => n.id === first.outId)?.state, 'ISSUED_TO_PRODUCTION');
      completed(await h.run(productionCommand('StartProductionOperation', p.ops[1]!)), 'accepted');
      completed(
        await h.run(
          productionCommand('CompleteProductionOperation', p.ops[1]!, {
            inputs: [],
            outputs: [],
            residuals: [],
            scraps: [],
            finalizeUnitIds: [first.outId],
          }),
        ),
        'accepted',
      );
      const before = await evidence(db);
      const final = await h.app.genealogyQuery(
        'TraceBackward',
        { kind: 'UNIT', id: first.outId },
        h.actor,
      );
      assert.ok(final);
      assert.equal(final.nodes.filter((n) => n.id === first.outId).length, 1);
      const n = final.nodes.find((n) => n.id === first.outId)!;
      assert.equal(n.state, 'AVAILABLE');
      assert.equal(n.events.filter((e) => e.kind === 'FINALIZED').length, 1);
      assert.equal(n.events.find((e) => e.kind === 'FINALIZED')?.kg, undefined);
      assert.ok(final.edges.every((e) => e.from !== e.to));
      assert.equal(final.edges.filter((e) => e.kind === 'OUTPUT').length, 1);
      assert.deepEqual(await balance(db, first.outId), { on_hand: '110', reserved: '0' });
      assert.deepEqual(await evidence(db), before);
    } finally {
      await h.app.stop();
    }
  }));
void test('real split/merge uses exact output parents, never Cartesian operation siblings or fabricated per-parent kg', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare({ kg: '10' }),
        b = await h.stock('10'),
        c = await h.stock('10');
      for (const unitId of [b, c]) {
        const aid = randomUUID();
        completed(
          await h.run(
            productionCommand('PlanMaterialAllocation', aid, {
              productionOrderId: p.orderId,
              kg: '10',
            }),
          ),
          'accepted',
        );
        completed(
          await h.run(productionCommand('AssignMaterialAllocation', aid, { unitId })),
          'accepted',
        );
        completed(await h.run(productionCommand('IssueAllocatedMaterial', aid)), 'accepted');
      }
      const locationId = randomUUID(),
        ab = randomUUID(),
        cc = randomUUID();
      completed(
        await h.run(
          productionCommand('CompleteProductionOperation', p.ops[0]!, {
            inputs: [
              { unitId: p.source, kg: '10' },
              { unitId: b, kg: '10' },
              { unitId: c, kg: '10' },
            ],
            outputs: [
              { unitId: ab, kg: '20', kind: 'SHEET', locationId, sourceUnitIds: [p.source, b] },
              { unitId: cc, kg: '10', kind: 'SHEET', locationId, sourceUnitIds: [c] },
            ],
            residuals: [],
            scraps: [],
            finalizeUnitIds: [],
          }),
        ),
        'accepted',
      );
      const before = await evidence(db);
      const forward = await h.app.genealogyQuery(
        'TraceForward',
        { kind: 'UNIT', id: p.source },
        h.actor,
      );
      assert.ok(forward && has(forward, 'UNIT', ab));
      assert.ok(!has(forward, 'UNIT', cc) && !has(forward, 'UNIT', b) && !has(forward, 'UNIT', c));
      const back = await h.app.genealogyQuery('TraceBackward', { kind: 'UNIT', id: ab }, h.actor);
      assert.ok(back && has(back, 'UNIT', p.source) && has(back, 'UNIT', b));
      assert.ok(!has(back, 'UNIT', c) && !has(back, 'UNIT', cc));
      const merge = back.edges.filter((e) => e.kind === 'OUTPUT');
      assert.equal(merge.length, 2);
      assert.ok(merge.every((e) => e.kg === '20' && e.kgMeaning === 'RESULT_TOTAL'));
      assert.deepEqual(await evidence(db), before);
    } finally {
      await h.app.stop();
    }
  }));
void test('standalone incoming Sheets trace through actual package dispatch, not loading, delivery or a fabricated Coil', async () =>
  withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const receipt = receiptCommand();
      const posted = completed(
        await h.salesRun(
          {
            ...receipt,
            payload: {
              ...receipt.payload,
              type: 'SHEET',
              productCode: 'SHEET-LOCAL-001',
              measuredKg: '11',
            },
          },
          h.wh,
        ),
        'accepted',
      );
      const unitId = (posted.result.data as JsonObject).unitId as string;
      const base = salesCommand(h.people.customerId),
        itemId = randomUUID();
      const draft = {
        ...base,
        payload: {
          ...base.payload,
          items: [
            {
              id: itemId,
              type: 'SHEET',
              description: 'Standalone Sheet dispatch',
              demandedKg: '11',
              allowPartialShipment: false,
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
        'accepted',
      );
      completed(
        await h.salesRun(
          follow(draft, 'ConfirmSalesOrder', { assessmentId: assessment.target.id }),
        ),
        'accepted',
      );
      const claim = await h.claim(draft.target.id, itemId, unitId);
      const ready = await h.ready(draft.target.id, [claim.target.id]);
      const loading = await h.app.genealogyQuery(
        'TraceForward',
        { kind: 'UNIT', id: unitId },
        h.actor,
      );
      assert.ok(loading && has(loading, 'PACKAGE', ready.pack.target.id));
      assert.equal(loading.edges.filter((e) => e.kind === 'DISPATCH').length, 0);
      assert.ok(!has(loading, 'SHIPMENT', ready.shipment.target.id));
      completed(await h.run(ready.dispatch), 'accepted');
      const before = await evidence(db);
      const back = await h.app.genealogyQuery(
        'TraceBackward',
        { kind: 'SHIPMENT', id: ready.shipment.target.id },
        h.actor,
      );
      assert.ok(back && has(back, 'UNIT', unitId) && has(back, 'RECEIPT', receipt.target.id));
      assert.equal(back.nodes.find((n) => n.id === ready.shipment.target.id)?.state, 'DISPATCHED');
      assert.equal(back.nodes.find((n) => n.id === unitId)?.intake?.productCode, 'SHEET-LOCAL-001');
      assert.ok(back.nodes.every((n) => n.materialKind !== 'COIL' && n.state !== 'DELIVERED'));
      const d = back.edges.find((e) => e.kind === 'DISPATCH')!;
      assert.equal(d.kg, '11');
      assert.equal(d.unitId, unitId);
      assert.equal(d.reservationId, claim.target.id);
      assert.ok(!JSON.stringify(back).includes('supplier'));
      for (const kind of ['UNIT', 'PACKAGE', 'SHIPMENT', 'SALES_ORDER'] as const) {
        const id =
          kind === 'UNIT'
            ? unitId
            : kind === 'PACKAGE'
              ? ready.pack.target.id
              : kind === 'SHIPMENT'
                ? ready.shipment.target.id
                : draft.target.id;
        assert.ok(await h.app.genealogyQuery('TraceForward', { kind, id }, h.actor));
      }
      assert.deepEqual(await evidence(db), before);
    } finally {
      await h.app.stop();
    }
  }));
void test('same-package forward trace isolates exact dispatched Unit and backward Unit excludes co-shipped siblings', async () =>
  withDatabase(async (db) => {
    const h = await shippingApp(db);
    try {
      const a = await h.stock(),
        b = await h.stock();
      const order = await h.order([a, b], { demandedKg: '22' });
      const ca = await h.claim(order.orderId, order.itemId, a),
        cb = await h.claim(order.orderId, order.itemId, b);
      const ready = await h.ready(order.orderId, [ca.target.id, cb.target.id]);
      completed(await h.run(ready.dispatch), 'accepted');
      const forward = await h.app.genealogyQuery('TraceForward', { kind: 'UNIT', id: a }, h.actor);
      assert.ok(forward && has(forward, 'SHIPMENT', ready.shipment.target.id));
      assert.ok(!JSON.stringify(forward).includes(b));
      assert.ok(!JSON.stringify(forward).includes(cb.target.id));
      assert.equal(forward.edges.filter((e) => e.kind === 'DISPATCH').length, 1);
      const backward = await h.app.genealogyQuery(
        'TraceBackward',
        { kind: 'UNIT', id: a },
        h.actor,
      );
      assert.ok(
        backward && !has(backward, 'UNIT', b) && !has(backward, 'PACKAGE', ready.pack.target.id),
      );
      const whole = await h.app.genealogyQuery(
        'TraceBackward',
        { kind: 'SHIPMENT', id: ready.shipment.target.id },
        h.actor,
      );
      assert.ok(whole && has(whole, 'UNIT', a) && has(whole, 'UNIT', b));
      assert.equal(whole.edges.filter((e) => e.kind === 'DISPATCH').length, 2);
    } finally {
      await h.app.stop();
    }
  }));
void test('owner source overflow rejects explicitly; unrelated source prefix cannot hide an exact known Unit', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare();
      completed(await h.run(productionCommand('RecordStationEntry', p.ops[0]!)), 'accepted');
      // Isolated owner fixtures exercise reader cardinality; not a new production workflow.
      await db.owner.query(
        "INSERT INTO production.source_fact(installation_id,authority_scope,customer_id,fact_id,order_id,operation_id,kind,data,issuer,subject,command_key,actor_role) SELECT installation_id,authority_scope,customer_id,gen_random_uuid(),order_id,operation_id,'DECLARATION','{}'::jsonb,issuer,subject,gen_random_uuid()::text,actor_role FROM production.source_fact CROSS JOIN generate_series(1,257) WHERE operation_id=$1 AND kind='ENTRY'",
        [p.ops[0]],
      );
      completed(await h.run(h.complete(p.ops[0]!, p.source).input), 'accepted');
      const before = await evidence(db);
      assert.ok(
        await h.app.genealogyQuery('TraceForward', { kind: 'UNIT', id: p.source }, h.actor),
      );
      await assert.rejects(
        h.app.genealogyQuery('TraceForward', { kind: 'OPERATION', id: p.ops[0]! }, h.actor),
        (error) =>
          guard('GUARD_INVARIANT')(error) &&
          (error as { rejection: { message: string } }).rejection.message ===
            'Trace exceeds bounded query limits',
      );
      assert.equal(
        await h.app.genealogyQuery('TraceForward', { kind: 'UNIT', id: randomUUID() }, h.actor),
        undefined,
      );
      assert.deepEqual(await evidence(db), before);
    } finally {
      await h.app.stop();
    }
  }));
