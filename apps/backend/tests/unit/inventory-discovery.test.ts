import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { createTransactionContext, type ExecutionContext } from '@navard/shared-kernel';
import {
  InventoryDiscoveryService,
  InventoryReadCursors,
  InventoryReadError,
  parseInventoryReadInput,
  type InventoryCandidate,
  type InventoryDiscoveryStore,
  type InventoryReadBinding,
  type InventoryReadContext,
  type InventoryReadLedger,
  type InventoryReadLinks,
} from '../../src/modules/inventory/index.js';

const ids = {
  installation: '11111111-1111-4111-8111-111111111111',
  unit: '22222222-2222-4222-8222-222222222222',
  lot: '33333333-3333-4333-8333-333333333333',
  location: '44444444-4444-4444-8444-444444444444',
  material: '55555555-5555-4555-8555-555555555555',
  receipt: '66666666-6666-4666-8666-666666666666',
  person: '77777777-7777-4777-8777-777777777777',
  account: '88888888-8888-4888-8888-888888888888',
  second: '99999999-9999-4999-8999-999999999999',
  customer: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
};
const actor: ExecutionContext = {
  installationId: ids.installation,
  authorityScopeId: ids.installation,
  actorRole: 'ACT-WH',
  principal: { issuer: 'local:' + ids.installation, subject: ids.person },
  requestId: ids.receipt,
};
const context: InventoryReadContext = { actor, transaction: createTransactionContext() };
const binding: InventoryReadBinding = {
  accountId: ids.account,
  personId: ids.person,
  sessionDigest: createHash('sha256').update('test-session').digest('hex'),
};
const secret = 'unit-test-cursor-secret';
function candidate(overrides: Partial<InventoryCandidate> = {}): InventoryCandidate {
  return {
    unitId: ids.unit,
    lotId: ids.lot,
    kind: 'COIL',
    locationId: ids.location,
    customerScope: '',
    state: 'AVAILABLE',
    legacyUnitId: ids.unit,
    legacyLotId: ids.lot,
    legacyMaterialId: ids.material,
    legacyInternalCode: 'قطعه-کد',
    legacyProductCode: null,
    legacyReceiptId: ids.receipt,
    legacyInitialKg: '100',
    legacyCount: '3',
    legacyType: 'COIL',
    legacyLocationId: ids.location,
    i2UnitId: null,
    i2LotId: null,
    i2MaterialId: null,
    i2InternalCode: null,
    i2ProductNumber: null,
    i2ReceivedUnitId: null,
    i2ArrivalId: null,
    i2InitialKg: null,
    i2MaterialTypeOptionId: null,
    i2ClassificationProfile: null,
    i2WeightBasis: null,
    i2Type: null,
    i2LocationId: null,
    productionUnitId: null,
    productionBatchId: null,
    productionCustomerId: null,
    productionInitialKg: null,
    productionDisposition: null,
    ...overrides,
  };
}
function harness(
  options: {
    rows?: InventoryCandidate[];
    ledger?: InventoryReadLedger[];
    links?: InventoryReadLinks[];
    authorized?: boolean;
  } = {},
) {
  const rows = options.rows ?? [candidate()];
  const ledger =
    options.ledger ??
    rows.map((r) => ({ unitId: r.unitId, onHandDelta: '100', reservedDelta: '0' }));
  const links =
    options.links ??
    rows.map((r) => ({
      unitId: r.unitId,
      balanceOnHand: '100',
      balanceReserved: '0',
      claimKg: null,
      issueKg: null,
      issueCustomerId: null,
    }));
  let calls = 0;
  const store: InventoryDiscoveryStore = {
    candidates() {
      calls++;
      return Promise.resolve(rows);
    },
    ledger() {
      calls++;
      return Promise.resolve(ledger);
    },
    links() {
      calls++;
      return Promise.resolve(links);
    },
  };
  const service = new InventoryDiscoveryService(
    store,
    new InventoryReadCursors(secret, 'https://test.local'),
    () => options.authorized !== false,
  );
  return { service, calls: () => calls };
}
const error = (status: number, name: string) => (e: unknown) =>
  e instanceof InventoryReadError && e.status === status && e.error === name;

void test('P4a filters preserve exact source text and reject broadened/unknown input', () => {
  const result = parseInventoryReadInput('DiscoverInventoryUnits', {
    filters: {
      internalCode: '  کد%_A ',
      kind: 'BEAM',
      locationId: ids.location,
      state: 'PACKED',
      origin: 'PRODUCTION',
      unitId: ids.unit,
      lotId: ids.lot,
      materialId: ids.material,
    },
    limit: 50,
  });
  assert.equal(result.filters.internalCode, '  کد%_A ');
  assert.equal(Object.keys(result.filters).length, 8);
  for (const input of [
    null,
    [],
    { filters: null },
    { filters: { customerId: ids.customer } },
    { filters: { state: 'CONSUMED' } },
    { filters: { origin: 'OTHER' } },
    { filters: { internalCode: ' ' } },
    { filters: { kind: 'X\n' } },
    { filters: { unitId: ids.unit + '\n' } },
    { filters: { locationId: ids.customer.toUpperCase() } },
    { limit: '25' },
    { limit: 0 },
    { limit: 51 },
    { sort: 'unitId' },
  ]) {
    assert.throws(
      () => parseInventoryReadInput('DiscoverInventoryUnits', input),
      error(400, 'invalid'),
    );
  }
  assert.throws(
    () => parseInventoryReadInput('GetInventoryUnitDetail', { unitId: ids.unit, filters: {} }),
    error(400, 'invalid'),
  );
  assert.throws(
    () => parseInventoryReadInput('ListInventoryLotUnits', { lotId: ids.lot, filters: {} }),
    error(400, 'invalid'),
  );
});

void test('P4a cursor binds exact filters/route/size/session/actor and retains original expiry', () => {
  let now = 1000000;
  const cursors = new InventoryReadCursors(secret, 'https://test.local', () => now);
  const input = parseInventoryReadInput('DiscoverInventoryUnits', {
    filters: { internalCode: 'کد' },
    limit: 1,
  });
  const start = cursors.position('DiscoverInventoryUnits', input, actor, binding);
  const token = cursors.next(start, ids.unit);
  assert.ok(token.length <= 2048);
  now += 300000;
  const admitted = cursors.position(
    'DiscoverInventoryUnits',
    { ...input, cursor: token },
    actor,
    binding,
  );
  const descendant = cursors.next(admitted, ids.second);
  assert.equal(admitted.expiresAt, start.expiresAt);
  for (const [query, changedInput, changedActor, changedBinding] of [
    ['DiscoverInventoryUnits', { ...input, limit: 2 }, actor, binding],
    ['DiscoverInventoryUnits', { ...input, filters: { internalCode: 'كد' } }, actor, binding],
    ['ListInventoryLotUnits', { filters: { lotId: ids.lot }, limit: 1 }, actor, binding],
    ['DiscoverInventoryUnits', input, { ...actor, authorityScopeId: ids.customer }, binding],
    ['DiscoverInventoryUnits', input, actor, { ...binding, sessionDigest: 'f'.repeat(64) }],
  ] as const) {
    assert.throws(
      () =>
        cursors.position(query, { ...changedInput, cursor: token }, changedActor, changedBinding),
      error(400, 'invalid-cursor'),
    );
  }
  assert.throws(
    () =>
      new InventoryReadCursors('different', 'https://test.local', () => now).position(
        'DiscoverInventoryUnits',
        { ...input, cursor: token },
        actor,
        binding,
      ),
    error(400, 'invalid-cursor'),
  );
  for (const malformed of [token + '=', token.slice(0, -1), 'x.y', 'A'.repeat(2049)])
    assert.throws(
      () =>
        cursors.position('DiscoverInventoryUnits', { ...input, cursor: malformed }, actor, binding),
      error(400, 'invalid-cursor'),
    );
  now = 1600000;
  assert.throws(
    () =>
      cursors.position('DiscoverInventoryUnits', { ...input, cursor: descendant }, actor, binding),
    error(400, 'invalid-cursor'),
  );
});

void test('P4a exact totals preserve >2^53 and 18-place fractions independent of Ledger row order', async () => {
  const quantity = '99999999999999999999.999999999999999999';
  const h = harness({
    ledger: [
      { unitId: ids.unit, onHandDelta: quantity, reservedDelta: '0' },
      { unitId: ids.unit, onHandDelta: quantity, reservedDelta: '0' },
      { unitId: ids.unit, onHandDelta: '-' + quantity, reservedDelta: '0' },
    ],
    links: [
      {
        unitId: ids.unit,
        balanceOnHand: quantity,
        balanceReserved: '0',
        claimKg: null,
        issueKg: null,
        issueCustomerId: null,
      },
    ],
  });
  const result = await h.service.query(
    context,
    'GetInventoryUnitDetail',
    { unitId: ids.unit },
    binding,
  );
  assert.ok('unit' in result);
  assert.deepEqual(result.unit.quantities, {
    onHandKg: quantity,
    reservedKg: '0',
    unreservedKg: quantity,
  });
  assert.equal(result.unit.source.initialKg, '100');
  assert.equal(h.calls(), 3);
});

void test('P4a whitelist never leaks internal customer or other source-family fields', async () => {
  const h = harness();
  const result = await h.service.query(
    context,
    'GetInventoryUnitDetail',
    { unitId: ids.unit },
    binding,
  );
  assert.ok('unit' in result);
  assert.deepEqual(
    Object.keys(result.unit).sort(),
    [
      'unitId',
      'lotId',
      'kind',
      'locationId',
      'state',
      'stockClass',
      'origin',
      'internalCode',
      'productCode',
      'productNumber',
      'materialId',
      'quantities',
      'source',
    ].sort(),
  );
  assert.deepEqual(
    Object.keys(result.unit.source).sort(),
    ['family', 'receiptId', 'initialKg', 'recordedCount', 'weightBasis'].sort(),
  );
  assert.equal(result.unit.productNumber, null);
  assert.equal(result.unit.source.family, 'LEGACY_RECEIPT');
  if (result.unit.source.family !== 'LEGACY_RECEIPT') throw new Error('Expected legacy source');
  assert.equal(result.unit.source.recordedCount, '3');
  const page = await h.service.query(context, 'DiscoverInventoryUnits', {}, binding);
  assert.ok('items' in page);
  assert.equal('source' in page.items[0]!, false);
  assert.equal(JSON.stringify(page).includes('customer'), false);
});

void test('P4a partial reservation is arithmetic free kg, while PACKED requires complete reservation', async () => {
  const reserved = harness({
    rows: [candidate({ state: 'RESERVED' })],
    ledger: [{ unitId: ids.unit, onHandDelta: '100', reservedDelta: '25.5' }],
    links: [
      {
        unitId: ids.unit,
        balanceOnHand: '100',
        balanceReserved: '25.50',
        claimKg: '25.5',
        issueKg: null,
        issueCustomerId: null,
      },
    ],
  });
  const result = await reserved.service.query(
    context,
    'GetInventoryUnitDetail',
    { unitId: ids.unit },
    binding,
  );
  assert.ok('unit' in result);
  assert.equal(result.unit.quantities.unreservedKg, '74.5');
  const packed = harness({
    rows: [candidate({ state: 'PACKED' })],
    ledger: [{ unitId: ids.unit, onHandDelta: '100', reservedDelta: '25' }],
    links: [
      {
        unitId: ids.unit,
        balanceOnHand: '100',
        balanceReserved: '25',
        claimKg: '25',
        issueKg: null,
        issueCustomerId: null,
      },
    ],
  });
  await assert.rejects(
    packed.service.query(context, 'GetInventoryUnitDetail', { unitId: ids.unit }, binding),
    error(503, 'unavailable'),
  );
});

void test('P4a partial production shows current remainder instead of originally issued kg', async () => {
  const h = harness({
    rows: [candidate({ state: 'PARTIALLY_CONSUMED' })],
    ledger: [{ unitId: ids.unit, onHandDelta: '29.5', reservedDelta: '0' }],
    links: [
      {
        unitId: ids.unit,
        balanceOnHand: '29.50',
        balanceReserved: '0',
        claimKg: null,
        issueKg: '100',
        issueCustomerId: ids.customer,
      },
    ],
  });
  const result = await h.service.query(
    context,
    'GetInventoryUnitDetail',
    { unitId: ids.unit },
    binding,
  );
  assert.ok('unit' in result);
  assert.equal(result.unit.quantities.onHandKg, '29.5');
});

void test('P4a fails complete page on missing projection, mismatch, active-link corruption or corrupt lookahead', async () => {
  for (const corrupt of [
    { balanceOnHand: null },
    { balanceOnHand: '99' },
    { claimKg: '1' },
    { issueKg: '100', issueCustomerId: ids.customer },
    { balanceReserved: '1' },
  ]) {
    const h = harness({
      links: [
        {
          unitId: ids.unit,
          balanceOnHand: '100',
          balanceReserved: '0',
          claimKg: null,
          issueKg: null,
          issueCustomerId: null,
          ...corrupt,
        },
      ],
    });
    await assert.rejects(
      h.service.query(context, 'GetInventoryUnitDetail', { unitId: ids.unit }, binding),
      error(503, 'unavailable'),
    );
  }
  const h = harness({
    rows: [
      candidate(),
      candidate({ unitId: ids.second, legacyUnitId: ids.second, productionUnitId: ids.second }),
    ],
  });
  await assert.rejects(
    h.service.query(context, 'DiscoverInventoryUnits', { limit: 1 }, binding),
    error(503, 'unavailable'),
  );
});

void test('P4a historical detail is explicitly zero and positive historical balances reject', async () => {
  for (const state of ['CONSUMED', 'SHIPPED'] as const) {
    const h = harness({
      rows: [candidate({ state })],
      ledger: [{ unitId: ids.unit, onHandDelta: '0', reservedDelta: '0' }],
      links: [
        {
          unitId: ids.unit,
          balanceOnHand: '0',
          balanceReserved: '0',
          claimKg: null,
          issueKg: null,
          issueCustomerId: null,
        },
      ],
    });
    const result = await h.service.query(
      context,
      'GetInventoryUnitDetail',
      { unitId: ids.unit },
      binding,
    );
    assert.ok('unit' in result);
    assert.equal(result.unit.stockClass, 'HISTORICAL');
    assert.equal(result.unit.quantities.onHandKg, '0');
    const corrupt = harness({ rows: [candidate({ state })] });
    await assert.rejects(
      corrupt.service.query(context, 'GetInventoryUnitDetail', { unitId: ids.unit }, binding),
      error(503, 'unavailable'),
    );
  }
});

void test('P4a Ledger work ceiling fails instead of aggregating truncated evidence', async () => {
  const h = harness({
    ledger: Array.from({ length: 10001 }, () => ({
      unitId: ids.unit,
      onHandDelta: '1',
      reservedDelta: '0',
    })),
  });
  await assert.rejects(
    h.service.query(context, 'GetInventoryUnitDetail', { unitId: ids.unit }, binding),
    error(422, 'query-limit'),
  );
  assert.equal(h.calls(), 2);
});

void test('P4a unauthorized owner entry performs no data read and absent roots share not-found', async () => {
  const denied = harness({ authorized: false });
  await assert.rejects(
    denied.service.query(context, 'GetInventoryUnitDetail', { unitId: ids.unit }, binding),
    error(403, 'forbidden'),
  );
  assert.equal(denied.calls(), 0);
  const missing = harness({ rows: [] });
  for (const [query, input] of [
    ['GetInventoryUnitDetail', { unitId: ids.unit }],
    ['ListInventoryLotUnits', { lotId: ids.lot }],
  ] as const)
    await assert.rejects(
      missing.service.query(context, query, input, binding),
      error(404, 'not-found'),
    );
  assert.deepEqual(await missing.service.query(context, 'DiscoverInventoryUnits', {}, binding), {
    items: [],
    nextCursor: null,
  });
});
