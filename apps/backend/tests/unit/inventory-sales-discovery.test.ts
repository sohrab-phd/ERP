import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { createTransactionContext, type ExecutionContext } from '@navard/shared-kernel';
import {
  InventoryReadError,
  InventorySalesDiscoveryService,
  type InventoryCandidate,
  type InventoryReadLedger,
  type InventoryReadLinks,
  type InventorySalesDiscoveryStore,
} from '../../src/modules/inventory/index.js';

const installation = randomUUID(),
  customer = randomUUID(),
  person = randomUUID();
const unit = randomUUID(),
  lot = randomUUID(),
  location = randomUUID();
const actor: ExecutionContext = {
  installationId: installation,
  authorityScopeId: installation,
  actorRole: 'ACT-SALES',
  principal: { issuer: 'local:' + installation, subject: person },
  requestId: randomUUID(),
  customerScope: customer,
};
function source(overrides: Partial<InventoryCandidate> = {}): InventoryCandidate {
  return {
    unitId: unit,
    lotId: lot,
    kind: 'COIL',
    locationId: location,
    customerScope: '',
    state: 'AVAILABLE',
    legacyUnitId: unit,
    legacyLotId: lot,
    legacyMaterialId: randomUUID(),
    legacyInternalCode: 'PRIVATE customer contract رقم ۱۲',
    legacyProductCode: null,
    legacyReceiptId: randomUUID(),
    legacyInitialKg: '100',
    legacyCount: '2',
    legacyType: 'COIL',
    legacyLocationId: location,
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
function fixture(
  options: {
    rows?: InventoryCandidate[];
    ledger?: InventoryReadLedger[];
    links?: InventoryReadLinks[];
    allowed?: boolean;
    actor?: ExecutionContext;
  } = {},
) {
  const rows = options.rows ?? [source()];
  const ledger =
    options.ledger ??
    rows.map((row) => ({ unitId: row.unitId, onHandDelta: '100', reservedDelta: '0' }));
  const links =
    options.links ??
    rows.map((row) => ({
      unitId: row.unitId,
      balanceOnHand: '100',
      balanceReserved: '0',
      claimKg: null,
      issueKg: null,
      issueCustomerId: null,
    }));
  const context = { actor: options.actor ?? actor, transaction: createTransactionContext() };
  let calls = 0;
  const store: InventorySalesDiscoveryStore = {
    salesCandidates(ctx, selection) {
      assert.equal(ctx, context);
      assert.equal(selection.take, 26);
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
  const service = new InventorySalesDiscoveryService(store, {
    canRead: (ctx) => {
      assert.equal(ctx, context);
      return Promise.resolve(options.allowed !== false);
    },
  });
  return { service, context, calls: () => calls };
}
const failure = (status: number) => (error: unknown) =>
  error instanceof InventoryReadError && error.status === status;

void test('P4b Sales stock admits only the exact Sales customer read context', async () => {
  for (const denied of [
    { allowed: false },
    { actor: { ...actor, actorRole: 'ACT-WH' as const } },
    {
      actor: {
        installationId: actor.installationId,
        authorityScopeId: actor.authorityScopeId,
        actorRole: 'ACT-SALES' as const,
        principal: actor.principal,
        requestId: actor.requestId,
      },
    },
    { actor: { ...actor, temporary: true } },
  ]) {
    const f = fixture(denied);
    await assert.rejects(f.service.discover(f.context, { kind: 'COIL', limit: 25 }), failure(403));
    assert.equal(f.calls(), 0);
  }
});
void test('P4b Sales stock rejects broadened or invalid query inputs before SQL', async () => {
  for (const input of [
    { kind: 'COIL', limit: 1 },
    { kind: 'UNKNOWN', limit: 25 },
    { kind: 'COIL', limit: 25, unitId: unit + '\n' },
    { kind: 'COIL', limit: 25, internalCode: ' ' },
    { kind: 'COIL', limit: 25, internalCode: 'x\u0081' },
    { kind: 'COIL', limit: 25, internalCode: 'x'.repeat(129) },
    { kind: 'COIL', limit: 25, customerId: customer },
  ]) {
    const f = fixture();
    await assert.rejects(f.service.discover(f.context, input), failure(400));
    assert.equal(f.calls(), 0);
  }
});
void test('P4b codes are redacted and a code filter never probes confidential code existence', async () => {
  const f = fixture();
  const rows = await f.service.discover(f.context, { kind: 'COIL', limit: 25 });
  assert.deepEqual(rows, [
    { unitId: unit, internalCode: null, kind: 'COIL', state: 'AVAILABLE', availableKg: '100' },
  ]);
  assert.equal(f.calls(), 3);
  for (const internalCode of ['PRIVATE customer contract رقم ۱۲', 'absent-code', customer]) {
    const filtered = fixture();
    assert.deepEqual(
      await filtered.service.discover(filtered.context, { kind: 'COIL', internalCode, limit: 25 }),
      [],
    );
    assert.equal(filtered.calls(), 0);
  }
});
void test('P4b exact fractional and beyond-safe-integer stock quantities remain text', async () => {
  for (const kg of [
    '9007199254740993',
    '9007199254740993.000000000000000001',
    '0.000000000000000001',
  ]) {
    const f = fixture({
      ledger: [{ unitId: unit, onHandDelta: kg, reservedDelta: '0' }],
      links: [
        {
          unitId: unit,
          balanceOnHand: kg,
          balanceReserved: '0',
          claimKg: null,
          issueKg: null,
          issueCustomerId: null,
        },
      ],
    });
    assert.equal(
      (await f.service.discover(f.context, { kind: 'COIL', limit: 25 }))[0]!.availableKg,
      kg,
    );
  }
});
void test('P4b Inventory verifies all three origin families without exposing source fields', async () => {
  const base = source({
    legacyUnitId: null,
    legacyLotId: null,
    legacyMaterialId: null,
    legacyInternalCode: null,
    legacyReceiptId: null,
    legacyInitialKg: null,
    legacyCount: null,
    legacyType: null,
    legacyLocationId: null,
  });
  for (const row of [
    source(),
    {
      ...base,
      i2UnitId: unit,
      i2LotId: lot,
      i2MaterialId: randomUUID(),
      i2InternalCode: 'private contract',
      i2ProductNumber: 'private product',
      i2ReceivedUnitId: randomUUID(),
      i2ArrivalId: randomUUID(),
      i2InitialKg: '100',
      i2MaterialTypeOptionId: randomUUID(),
      i2ClassificationProfile: 'FACTORY_MATERIAL_V1',
      i2WeightBasis: 'WH_ACCEPTED_DECLARED_UNIT_WEIGHT',
      i2Type: 'COIL',
      i2LocationId: location,
    },
    {
      ...base,
      customerScope: customer,
      productionUnitId: unit,
      productionBatchId: lot,
      productionCustomerId: customer,
      productionInitialKg: '100',
      productionDisposition: 'FINAL',
    },
  ]) {
    const f = fixture({ rows: [row] });
    const result = await f.service.discover(f.context, { kind: 'COIL', limit: 25 });
    assert.deepEqual(
      Object.keys(result[0]!).sort(),
      ['unitId', 'internalCode', 'kind', 'state', 'availableKg'].sort(),
    );
    assert.equal(result[0]!.internalCode, null);
  }
});
void test('P4b corrupt or foreign candidate evidence fails the whole page', async () => {
  const goodLink = {
    unitId: unit,
    balanceOnHand: '100',
    balanceReserved: '0',
    claimKg: null,
    issueKg: null,
    issueCustomerId: null,
  };
  for (const options of [
    { rows: [source({ customerScope: randomUUID() })] },
    { rows: [source({ state: 'RESERVED' })] },
    { rows: [source({ kind: 'SHEET' })] },
    { rows: [source({ productionUnitId: unit })] },
    { links: [{ ...goodLink, balanceOnHand: '99' }] },
    { links: [{ ...goodLink, claimKg: '1' }] },
    { links: [{ ...goodLink, issueKg: '1', issueCustomerId: customer }] },
    {
      ledger: [{ unitId: unit, onHandDelta: '0', reservedDelta: '0' }],
      links: [{ ...goodLink, balanceOnHand: '0' }],
    },
    { rows: [source(), source()] },
    { links: [] },
  ]) {
    const f = fixture(options);
    await assert.rejects(f.service.discover(f.context, { kind: 'COIL', limit: 25 }), failure(503));
  }
});
void test('P4b Ledger fanout and page size bounds reject complete results rather than truncating', async () => {
  const f = fixture({
    ledger: Array.from({ length: 10001 }, () => ({
      unitId: unit,
      onHandDelta: '0',
      reservedDelta: '0',
    })),
  });
  await assert.rejects(f.service.discover(f.context, { kind: 'COIL', limit: 25 }), failure(503));
  assert.equal(f.calls(), 2);
  const page = fixture({
    rows: Array.from({ length: 27 }, () => source({ unitId: randomUUID() })),
  });
  await assert.rejects(
    page.service.discover(page.context, { kind: 'COIL', limit: 25 }),
    failure(503),
  );
  assert.equal(page.calls(), 1);
});
