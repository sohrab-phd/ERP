import assert from 'node:assert/strict';
import test from 'node:test';
import { BusinessRejection, createTransactionContext } from '@navard/shared-kernel';
import {
  GenealogyProjection,
  type GenealogyContext,
  type GenealogyProductionFact,
  type GenealogyPackage,
  type GenealogyReceiptOrigin,
  type GenealogyReference,
  type GenealogyShipment,
  type GenealogySourcePorts,
  type GenealogyTrace,
} from '../../src/modules/genealogy/index.js';

const id = (n: number) => `00000000-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
const customerId = id(9000),
  orderId = id(9001),
  operationId = id(9002),
  batchId = id(9003),
  salesOrderId = id(9004);
const context: GenealogyContext = {
  actor: {
    installationId: id(9900),
    authorityScopeId: id(9901),
    principal: { issuer: 'test', subject: 'reader' },
    actorRole: 'ACT-READ',
    requestId: id(9902),
    customerScope: customerId,
  },
  transaction: createTransactionContext(),
  customerId,
};
const unitRef = (n: number): GenealogyReference => ({ kind: 'UNIT', id: id(n) });
function fact(
  n: number,
  kind: GenealogyProductionFact['kind'],
  data: GenealogyProductionFact['data'],
  overrides: Partial<GenealogyProductionFact> = {},
): GenealogyProductionFact {
  return {
    id: id(n),
    kind,
    data,
    operationId,
    productionOrderId: orderId,
    salesOrderId,
    ...overrides,
  };
}
function output(
  n: number,
  child: number,
  parents: number[],
  amount = '40',
  overrides: Partial<GenealogyProductionFact> = {},
): GenealogyProductionFact {
  return fact(
    n,
    'OUTPUT',
    {
      unitId: id(child),
      sourceUnitIds: parents.map(id),
      kg: amount,
      kind: 'SHEET',
      locationId: id(9100),
      disposition: 'WIP',
      productBatchId: batchId,
    },
    overrides,
  );
}
function origin(unit: number, lot = 500, receipt = 600): GenealogyReceiptOrigin {
  return {
    unitId: id(unit),
    lotId: id(lot),
    receiptId: id(receipt),
    materialId: id(700),
    effectId: id(701),
    internalCode: 'receipt',
    count: '1',
    measuredKg: '100',
    type: 'COIL',
    locationId: id(9100),
  };
}
function fixture(
  facts: readonly GenealogyProductionFact[],
  packages: readonly GenealogyPackage[] = [],
  shipments: readonly GenealogyShipment[] = [],
  receipts: readonly GenealogyReceiptOrigin[] = [],
) {
  const calls: string[] = [];
  const units = new Set<string>();
  for (const f of facts) {
    if (typeof f.data.unitId === 'string') units.add(f.data.unitId);
    if (typeof f.data.sourceUnitId === 'string') units.add(f.data.sourceUnitId);
    if (Array.isArray(f.data.sourceUnitIds))
      for (const u of f.data.sourceUnitIds) if (typeof u === 'string') units.add(u);
  }
  for (const p of packages) for (const e of p.entries) units.add(e.unitId);
  const ports: GenealogySourcePorts = {
    inventory: {
      unit: (ctx, unitId) => {
        assert.equal(ctx, context);
        calls.push(`unit:${unitId}`);
        return Promise.resolve(
          units.has(unitId)
            ? {
                id: unitId,
                lotId: receipts.find((o) => o.unitId === unitId)?.lotId ?? batchId,
                kind: 'SHEET',
                state: 'PARTIALLY_CONSUMED',
              }
            : undefined,
        );
      },
      origins: (ctx, ref, rootId) => {
        assert.equal(ctx, context);
        calls.push(`origins:${ref}:${rootId}`);
        return Promise.resolve(
          receipts.filter(
            (o) => (ref === 'UNIT' ? o.unitId : ref === 'LOT' ? o.lotId : o.receiptId) === rootId,
          ),
        );
      },
    },
    production: {
      facts: (ctx, ref, rootId) => {
        assert.equal(ctx, context);
        calls.push(`facts:${ref}:${rootId}`);
        return Promise.resolve(
          facts.filter((f) =>
            ref === 'UNIT'
              ? f.data.unitId === rootId ||
                f.data.sourceUnitId === rootId ||
                (Array.isArray(f.data.sourceUnitIds) && f.data.sourceUnitIds.includes(rootId))
              : (ref === 'FACT'
                  ? f.id
                  : ref === 'OPERATION'
                    ? f.operationId
                    : ref === 'ORDER'
                      ? f.productionOrderId
                      : ref === 'BATCH'
                        ? f.data.productBatchId
                        : f.salesOrderId) === rootId,
          ),
        );
      },
    },
    shipping: {
      sources: (ctx, ref, rootId) => {
        assert.equal(ctx, context);
        calls.push(`shipping:${ref}:${rootId}`);
        return Promise.resolve({
          packages: packages.filter((p) =>
            ref === 'UNIT'
              ? p.entries.some((e) => e.unitId === rootId)
              : ref === 'PACKAGE'
                ? p.id === rootId
                : ref === 'SALES_ORDER'
                  ? p.orderId === rootId
                  : p.shipmentId === rootId ||
                    shipments.some(
                      (s) => s.id === rootId && s.dispatch.some((e) => e.packageId === p.id),
                    ),
          ),
          shipments: shipments.filter((s) =>
            ref === 'UNIT'
              ? s.dispatch.some((e) => e.unitId === rootId)
              : ref === 'PACKAGE'
                ? s.dispatch.some((e) => e.packageId === rootId)
                : ref === 'SHIPMENT'
                  ? s.id === rootId
                  : s.orderId === rootId,
          ),
        });
      },
    },
  };
  return { projection: new GenealogyProjection(ports), ports, calls };
}
const pairs = (trace: GenealogyTrace | undefined) => trace?.edges.map((e) => `${e.from}>${e.to}`);
function overflow(error: unknown): boolean {
  return (
    error instanceof BusinessRejection &&
    error.rejection.family === 'GUARD_INVARIANT' &&
    error.rejection.message === 'Trace exceeds bounded query limits'
  );
}

void test('split and merge use explicit parents, exact result kg, and never operation siblings', async () => {
  const huge = '9007199254740993.000000000000000001';
  const f = fixture([
    output(101, 2, [1], huge),
    output(102, 3, [1]),
    output(103, 4, [2, 3]),
    output(104, 6, [5]),
  ]);
  const trace = await f.projection.trace(context, 'TraceForward', unitRef(1));
  assert.deepEqual(pairs(trace), [
    `${'UNIT:' + id(1)}>${'UNIT:' + id(2)}`,
    `${'UNIT:' + id(1)}>${'UNIT:' + id(3)}`,
    `${'UNIT:' + id(2)}>${'UNIT:' + id(4)}`,
    `${'UNIT:' + id(3)}>${'UNIT:' + id(4)}`,
  ]);
  assert.equal(trace?.edges[0]?.kg, huge);
  assert.ok(trace?.edges.every((e) => e.kgMeaning === 'RESULT_TOTAL'));
  assert.ok(trace?.edges.every((e) => e.operationId === operationId && e.batchId === batchId));
  assert.ok(!trace?.nodes.some((n) => n.id === id(5) || n.id === id(6)));
  const backward = await f.projection.trace(context, 'TraceBackward', unitRef(4));
  assert.deepEqual(backward?.edges, trace?.edges);
});

void test('partial consumption and WIP finalization annotate the existing Unit; Residual and Scrap use their actual parent', async () => {
  const f = fixture([
    fact(101, 'CONSUMPTION', { unitId: id(1), kg: '50' }),
    output(102, 2, [1], '30'),
    fact(103, 'RESIDUAL', {
      unitId: id(3),
      sourceUnitId: id(1),
      kg: '15',
      kind: 'SHEET',
      locationId: id(9100),
      disposition: 'RESIDUAL',
      productBatchId: batchId,
    }),
    fact(104, 'SCRAP', { sourceUnitId: id(1), kg: '5', disposition: 'SCRAP' }),
    fact(105, 'FINALIZED', { unitId: id(2) }),
  ]);
  const trace = await f.projection.trace(context, 'TraceForward', unitRef(1));
  assert.equal(trace?.edges.length, 3);
  assert.ok(trace?.edges.some((e) => e.kind === 'SCRAP' && e.to === `SCRAP:${id(104)}`));
  assert.ok(trace?.nodes.some((n) => n.kind === 'SCRAP' && n.id === id(104)));
  const parent = trace?.nodes.find((n) => n.id === id(1));
  assert.equal(parent?.state, 'PARTIALLY_CONSUMED');
  assert.ok(parent?.events.some((e) => e.kind === 'CONSUMPTION' && e.kg === '50'));
  const child = trace?.nodes.find((n) => n.id === id(2));
  assert.ok(child?.events.some((e) => e.kind === 'FINALIZED' && e.kg === undefined));
  assert.ok(!trace?.edges.some((e) => e.from === e.to || e.factId === id(105)));
});

void test('backward origin traversal and forward lot impact publish only Units with selected-customer relationships', async () => {
  const f = fixture([output(101, 2, [1])], [], [], [origin(1), origin(9)]);
  const backward = await f.projection.trace(context, 'TraceBackward', unitRef(2));
  assert.ok(backward?.nodes.some((n) => n.kind === 'RECEIPT' && n.id === id(600)));
  assert.equal(backward?.nodes.find((n) => n.kind === 'LOT')?.intake?.internalCode, 'receipt');
  assert.equal(backward?.nodes.find((n) => n.id === id(1))?.intake?.measuredKg, '100');
  assert.equal(backward?.nodes.find((n) => n.id === id(2))?.intake, undefined);
  assert.ok(
    backward?.edges.some((e) => e.from === `RECEIPT:${id(600)}` && e.to === `LOT:${id(500)}`),
  );
  const forward = await f.projection.trace(context, 'TraceForward', { kind: 'LOT', id: id(500) });
  assert.ok(forward?.nodes.some((n) => n.id === id(2)));
  assert.ok(!forward?.nodes.some((n) => n.id === id(9)));
  assert.equal(
    await f.projection.trace(context, 'TraceForward', { kind: 'RECEIPT', id: id(601) }),
    undefined,
  );
  const foreign = fixture([], [], [], [origin(9)]);
  assert.equal(
    await foreign.projection.trace(context, 'TraceForward', { kind: 'RECEIPT', id: id(600) }),
    undefined,
  );
  assert.equal(await foreign.projection.trace(context, 'TraceBackward', unitRef(9)), undefined);
  assert.ok(!foreign.calls.some((c) => c.startsWith('unit:')));
});

void test('package history retains UNPACKED content; only DISPATCHED actual rows create package-to-shipment edges', async () => {
  const e = { unitId: id(2), reservationId: id(300), itemId: id(301), kg: '20.125' };
  const historical: GenealogyPackage = {
    id: id(200),
    orderId: salesOrderId,
    state: 'UNPACKED',
    entries: [e],
  };
  const assigned: GenealogyPackage = {
    id: id(201),
    orderId: salesOrderId,
    state: 'ASSIGNED_TO_SHIPMENT',
    shipmentId: id(400),
    entries: [e],
  };
  const sent: GenealogyPackage = {
    id: id(202),
    orderId: salesOrderId,
    state: 'ASSIGNED_TO_SHIPMENT',
    shipmentId: id(401),
    entries: [e],
  };
  const f = fixture(
    [output(101, 2, [1])],
    [historical, assigned, sent],
    [
      { id: id(400), orderId: salesOrderId, state: 'READY', dispatch: [] },
      {
        id: id(401),
        orderId: salesOrderId,
        state: 'DISPATCHED',
        dispatch: [{ ...e, packageId: id(202) }],
        dispatchedAt: '2026-10-10T12:00:00Z',
      },
    ],
  );
  const trace = await f.projection.trace(context, 'TraceForward', unitRef(2));
  assert.equal(trace?.nodes.find((n) => n.id === id(200))?.state, 'UNPACKED');
  assert.equal(trace?.edges.filter((x) => x.kind === 'PACKAGE_CONTENT').length, 3);
  assert.equal(trace?.edges.filter((x) => x.kind === 'DISPATCH').length, 1);
  assert.ok(!trace?.nodes.some((n) => n.kind === 'SHIPMENT' && n.id === id(400)));
  const backward = await f.projection.trace(context, 'TraceBackward', {
    kind: 'SHIPMENT',
    id: id(401),
  });
  assert.ok(backward?.nodes.some((n) => n.id === id(1)));
  assert.ok(!backward?.nodes.some((n) => n.kind === 'PACKAGE' && n.id !== id(202)));
});

void test('typed identities, cycle termination, deduplication, and deterministic source-order results', async () => {
  const facts = [output(101, 2, [1]), output(102, 3, [2]), output(103, 1, [3])];
  const e = { unitId: id(1), reservationId: id(300), itemId: id(301), kg: '1' };
  const packages: GenealogyPackage[] = [
    { id: id(1), orderId: salesOrderId, state: 'PACKED', entries: [e] },
  ];
  const a = await fixture([...facts, facts[0]!], packages).projection.trace(
    context,
    'TraceForward',
    unitRef(1),
  );
  const b = await fixture([...facts].reverse(), packages).projection.trace(
    context,
    'TraceForward',
    unitRef(1),
  );
  assert.deepEqual(a, b);
  assert.equal(a?.edges.length, 4);
  assert.ok(a?.nodes.some((n) => n.key === `UNIT:${id(1)}`));
  assert.ok(a?.nodes.some((n) => n.key === `PACKAGE:${id(1)}`));
});

void test('association roots seed matched Units without inferred order, batch, or operation material edges', async () => {
  const f = fixture([output(101, 2, [1]), output(102, 4, [3])]);
  for (const root of [
    { kind: 'ORDER', id: orderId },
    { kind: 'OPERATION', id: operationId },
    { kind: 'BATCH', id: batchId },
    { kind: 'SALES_ORDER', id: salesOrderId },
  ] as const) {
    const trace = await f.projection.trace(context, 'TraceForward', root);
    assert.equal(trace?.edges.length, 2);
    assert.equal(
      trace?.nodes.find((n) => n.key === `${root.kind}:${root.id}`)?.references?.length,
      4,
    );
    assert.ok(trace?.edges.every((e) => e.from.startsWith('UNIT:') && e.to.startsWith('UNIT:')));
  }
  const trace = await f.projection.trace(context, 'TraceForward', { kind: 'FACT', id: id(101) });
  assert.equal(trace?.edges.length, 1);
  assert.ok(!trace?.nodes.some((n) => n.id === id(3)));
  assert.equal(
    await f.projection.trace(context, 'TraceForward', { kind: 'ORDER', id: id(9090) }),
    undefined,
  );
});

void test('lazy root lookup finds a later Unit without loading the customer prefix', async () => {
  const facts = Array.from({ length: 350 }, (_, i) => output(1000 + i, 2000 + i, [3000 + i]));
  const f = fixture(facts);
  const trace = await f.projection.trace(context, 'TraceForward', unitRef(3349));
  assert.equal(trace?.edges.length, 1);
  assert.ok(f.calls.every((c) => !c.includes(':SALES_ORDER:')));
  assert.ok(f.calls.length < 10);
});

void test('depth and node overflow reject the whole trace with the stable guard', async () => {
  const deep = fixture(Array.from({ length: 33 }, (_, i) => output(1000 + i, i + 2, [i + 1])));
  await assert.rejects(deep.projection.trace(context, 'TraceForward', unitRef(1)), overflow);
  const wide = fixture(Array.from({ length: 256 }, (_, i) => output(1000 + i, i + 2, [1])));
  await assert.rejects(wide.projection.trace(context, 'TraceForward', unitRef(1)), overflow);
  const boundary = fixture(Array.from({ length: 32 }, (_, i) => output(1000 + i, i + 2, [i + 1])));
  assert.equal(
    (await boundary.projection.trace(context, 'TraceForward', unitRef(1)))?.nodes.length,
    33,
  );
});

void test('257 source rows and excess response bytes reject rather than truncate or claim not-found', async () => {
  const f = fixture([]);
  const many = Array.from({ length: 257 }, (_, i) => output(1000 + i, i + 2, [1]));
  const ports: GenealogySourcePorts = {
    ...f.ports,
    production: { facts: () => Promise.resolve(many) },
  };
  await assert.rejects(
    new GenealogyProjection(ports).trace(context, 'TraceForward', unitRef(1)),
    overflow,
  );
  const huge = fixture(
    Array.from({ length: 250 }, (_, i) =>
      output(1000 + i, i + 2, [1], '1', { occurredAt: '2026-10-10T12:00:00.123456Z' }),
    ),
  );
  await assert.rejects(huge.projection.trace(context, 'TraceForward', unitRef(1)), overflow);
});

void test('a material Unit does not inherit co-packaged sibling ancestry or dispatch quantities', async () => {
  const entries = [1, 3].map((n) => ({
    unitId: id(n),
    reservationId: id(300 + n),
    itemId: id(301),
    kg: `${n}0`,
  }));
  const f = fixture(
    [output(101, 1, [2]), output(102, 3, [4])],
    [
      {
        id: id(200),
        orderId: salesOrderId,
        state: 'ASSIGNED_TO_SHIPMENT',
        shipmentId: id(400),
        entries,
      },
    ],
    [
      {
        id: id(400),
        orderId: salesOrderId,
        state: 'DISPATCHED',
        dispatch: entries.map((e) => ({ ...e, packageId: id(200) })),
      },
    ],
  );
  const forward = await f.projection.trace(context, 'TraceForward', unitRef(1));
  assert.deepEqual(
    forward?.edges.filter((e) => e.kind === 'DISPATCH').map((e) => e.unitId),
    [id(1)],
  );
  assert.ok(!forward?.nodes.some((n) => n.id === id(3) || n.id === id(4)));
  const backward = await f.projection.trace(context, 'TraceBackward', unitRef(1));
  assert.equal(backward?.edges.length, 1);
  assert.ok(!backward?.nodes.some((n) => n.kind === 'PACKAGE' || n.id === id(3) || n.id === id(4)));
  const shipment = await f.projection.trace(context, 'TraceBackward', {
    kind: 'SHIPMENT',
    id: id(400),
  });
  assert.ok(shipment?.nodes.some((n) => n.id === id(3)));
  assert.ok(shipment?.nodes.some((n) => n.id === id(4)));
});

void test('nested package and dispatch source sentinels are bounded', async () => {
  const entries = Array.from({ length: 257 }, (_, i) => ({
    unitId: id(1000 + i),
    reservationId: id(2000 + i),
    itemId: id(3000),
    kg: '1',
  }));
  const pkg: GenealogyPackage = { id: id(200), orderId: salesOrderId, state: 'PACKED', entries };
  await assert.rejects(
    fixture([], [pkg]).projection.trace(context, 'TraceBackward', { kind: 'PACKAGE', id: pkg.id }),
    overflow,
  );
  const shipment: GenealogyShipment = {
    id: id(400),
    orderId: salesOrderId,
    state: 'DISPATCHED',
    dispatch: entries.map((e) => ({ ...e, packageId: pkg.id })),
  };
  await assert.rejects(
    fixture([], [], [shipment]).projection.trace(context, 'TraceBackward', {
      kind: 'SHIPMENT',
      id: shipment.id,
    }),
    overflow,
  );
});

void test('origin intake and source dates use bounded recorded values', async () => {
  const valid = { ...origin(1), productCode: 'actual-code' };
  const f = fixture([output(101, 2, [1])], [], [], [valid]);
  assert.equal(
    (await f.projection.trace(context, 'TraceForward', unitRef(1)))?.nodes.find(
      (n) => n.id === id(1),
    )?.intake?.productCode,
    'actual-code',
  );
  for (const invalid of [
    { ...valid, internalCode: 'x'.repeat(129) },
    { ...valid, count: '1e3' },
    { ...valid, count: '1\r' },
  ]) {
    await assert.rejects(
      fixture([output(101, 2, [1])], [], [], [invalid]).projection.trace(
        context,
        'TraceBackward',
        unitRef(2),
      ),
      (error: unknown) =>
        error instanceof BusinessRejection && error.rejection.family === 'GUARD_INVARIANT',
    );
  }
  await assert.rejects(
    fixture([output(101, 2, [1], '1', { occurredAt: 'x'.repeat(1000) })]).projection.trace(
      context,
      'TraceForward',
      unitRef(1),
    ),
    (error: unknown) =>
      error instanceof BusinessRejection &&
      error.rejection.message === 'Invalid genealogy source timestamp',
  );
});

void test('malformed owner material and nonactual shipment content reject safely', async () => {
  const invalid = fixture([output(101, 2, [1], '1e3')]);
  await assert.rejects(
    invalid.projection.trace(context, 'TraceForward', unitRef(1)),
    (error: unknown) =>
      error instanceof BusinessRejection && error.rejection.family === 'GUARD_INVARIANT',
  );
  await assert.rejects(
    fixture([output(101, 2, [1], '1\r')]).projection.trace(context, 'TraceForward', unitRef(1)),
    (error: unknown) =>
      error instanceof BusinessRejection &&
      error.rejection.message === 'Invalid genealogy source kg',
  );
  const e = { unitId: id(1), reservationId: id(300), itemId: id(301), kg: '1', packageId: id(200) };
  const shipment: GenealogyShipment = {
    id: id(400),
    orderId: salesOrderId,
    state: 'READY',
    dispatch: [e],
  };
  await assert.rejects(
    fixture([], [], [shipment]).projection.trace(context, 'TraceBackward', {
      kind: 'SHIPMENT',
      id: id(400),
    }),
    (error: unknown) =>
      error instanceof BusinessRejection &&
      error.rejection.message === 'Invalid genealogy actual dispatch',
  );
});

void test('edge overflow rejects a dense explicit merge graph without inferring or truncating links', async () => {
  const parents = Array.from({ length: 40 }, (_, i) => 1 + i);
  const facts = Array.from({ length: 40 }, (_, i) => output(1000 + i, 100 + i, parents));
  await assert.rejects(
    fixture(facts).projection.trace(context, 'TraceForward', {
      kind: 'OPERATION',
      id: operationId,
    }),
    overflow,
  );
});

void test('total source calls are capped even while checking customer visibility of origin siblings', async () => {
  const receipts = [
    origin(1, 500, 600),
    origin(2, 501, 601),
    ...Array.from({ length: 255 }, (_, i) => origin(1000 + i, 500, 600)),
    ...Array.from({ length: 255 }, (_, i) => origin(2000 + i, 501, 601)),
  ];
  const f = fixture([output(101, 2, [1])], [], [], receipts);
  await assert.rejects(f.projection.trace(context, 'TraceBackward', unitRef(2)), overflow);
  assert.equal(f.calls.length, 1024);
});

void test('terminal scrap at the depth boundary is included in the same depth bound', async () => {
  const facts = [
    ...Array.from({ length: 32 }, (_, i) => output(1000 + i, i + 2, [i + 1])),
    fact(2000, 'SCRAP', { sourceUnitId: id(33), kg: '1', disposition: 'SCRAP' }),
  ];
  await assert.rejects(
    fixture(facts).projection.trace(context, 'TraceForward', unitRef(1)),
    overflow,
  );
});

void test('nonmaterial fact roots preserve recorded operation and order associations without creating material', async () => {
  const f = fixture([fact(101, 'ENTRY', {}, { occurredAt: '2026-10-10T12:00:00Z' })]);
  const trace = await f.projection.trace(context, 'TraceBackward', { kind: 'FACT', id: id(101) });
  assert.equal(trace?.edges.length, 0);
  assert.equal(trace?.nodes.length, 1);
  assert.deepEqual(trace?.nodes[0]?.events, [
    {
      factId: id(101),
      operationId,
      productionOrderId: orderId,
      salesOrderId,
      kind: 'ENTRY',
      occurredAt: '2026-10-10T12:00:00Z',
    },
  ]);
});

void test('shipping source row limits apply independently to each returned collection', async () => {
  const packages: GenealogyPackage[] = Array.from({ length: 130 }, (_, i) => ({
    id: id(1000 + i),
    orderId: salesOrderId,
    state: 'DRAFT',
    entries: [],
  }));
  const shipments: GenealogyShipment[] = Array.from({ length: 130 }, (_, i) => ({
    id: id(2000 + i),
    orderId: salesOrderId,
    state: 'READY',
    dispatch: [],
  }));
  const f = fixture([]);
  const ports: GenealogySourcePorts = {
    ...f.ports,
    shipping: { sources: () => Promise.resolve({ packages, shipments }) },
  };
  const trace = await new GenealogyProjection(ports).trace(context, 'TraceForward', {
    kind: 'PACKAGE',
    id: packages[0]!.id,
  });
  assert.equal(trace?.nodes.length, 1);
  assert.equal(trace?.nodes[0]?.state, 'DRAFT');
});

void test('a later reachable Unit joins an already visited shared package exactly once', async () => {
  const facts = [output(101, 2, [1]), output(102, 3, [2])];
  const entries = [1, 3, 9].map((n) => ({
    unitId: id(n),
    reservationId: id(300 + n),
    itemId: id(301),
    kg: `${n}`,
  }));
  const pkg: GenealogyPackage = {
    id: id(200),
    orderId: salesOrderId,
    state: 'ASSIGNED_TO_SHIPMENT',
    shipmentId: id(400),
    entries,
  };
  const shipment: GenealogyShipment = {
    id: id(400),
    orderId: salesOrderId,
    state: 'DISPATCHED',
    dispatch: entries.map((e) => ({ ...e, packageId: pkg.id })),
  };
  const f = fixture(facts, [pkg], [shipment]);
  const forward = await f.projection.trace(context, 'TraceForward', unitRef(1));
  const packageCall = f.calls.indexOf(`shipping:PACKAGE:${pkg.id}`);
  const laterUnitCall = f.calls.indexOf(`unit:${id(3)}`);
  assert.ok(
    packageCall >= 0 && laterUnitCall > packageCall,
    'the package is visited before the later Unit',
  );
  assert.deepEqual(
    forward?.edges
      .filter((e) => e.kind === 'PACKAGE_CONTENT')
      .map((e) => e.from)
      .sort(),
    [`UNIT:${id(1)}`, `UNIT:${id(3)}`],
  );
  assert.deepEqual(
    forward?.edges
      .filter((e) => e.kind === 'DISPATCH')
      .map((e) => e.unitId)
      .sort(),
    [id(1), id(3)],
  );
  assert.equal(forward?.edges.filter((e) => e.kind === 'PACKAGE_CONTENT').length, 2);
  assert.equal(forward?.edges.filter((e) => e.kind === 'DISPATCH').length, 2);
  assert.ok(!JSON.stringify(forward).includes(id(9)));
  assert.ok(!JSON.stringify(forward).includes(id(309)));
  const reordered = await fixture(
    [...facts].reverse(),
    [{ ...pkg, entries: [...entries].reverse() }],
    [{ ...shipment, dispatch: [...shipment.dispatch].reverse() }],
  ).projection.trace(context, 'TraceForward', unitRef(1));
  assert.deepEqual(reordered, forward);
});
