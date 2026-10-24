import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import {
  GenealogyProjection,
  type GenealogyInboundOrigin,
  type GenealogySourcePorts,
  type GenealogyContext,
} from '../../src/modules/genealogy/index.js';
import {
  BusinessRejection,
  createTransactionContext,
  type JsonObject,
} from '@navard/shared-kernel';
import {
  InventoryInboundReceivingService,
  resolveInboundMaterialType,
  type InboundReceivingSource,
  type InboundReceivingOrigin,
  type InventoryStore,
  type PostingContext,
  type PostingEffect,
} from '../../src/modules/inventory/index.js';

function fixture(count = 1) {
  const arrivalId = randomUUID();
  const context: PostingContext = {
    actor: Object.freeze({
      installationId: randomUUID(),
      authorityScopeId: randomUUID(),
      actorRole: 'ACT-WH',
      principal: Object.freeze({ issuer: 'identity', subject: randomUUID() }),
      requestId: randomUUID(),
    }),
    transaction: createTransactionContext(),
    request: {
      command: 'ConfirmPurchaseReceiving',
      contract_version: 1,
      idempotency_key: randomUUID(),
      target: { kind: 'inbound-arrival', id: arrivalId },
      payload: { original: true },
      preconditions: {},
    },
  };
  const sources: InboundReceivingSource[] = Array.from({ length: count }, (_, i) => ({
    receivedUnitId: randomUUID(),
    arrivalId,
    internalSystemCode: `کد-${i}`,
    productNumber: 'محصول',
    acceptedUnitWeightKg: '2000',
    materialTypeId: randomUUID(),
    materialTypeLabel: 'ورق',
    technicalType: 'SHEET',
    locationId: randomUUID(),
  }));
  let allowed = true,
    mismatch = false;
  const batches: (readonly PostingEffect[])[] = [];
  const saved: InboundReceivingOrigin[] = [];
  const locks: string[][] = [];
  const unused = () => {
    throw new Error('Unexpected stock write outside IPS');
  };
  const inventory: InventoryStore = {
    lock: (_ctx, units, effects) => {
      locks.push([...units, ...effects]);
      return Promise.resolve();
    },
    unit: unused,
    createUnit: unused,
    changeState: unused,
    totals: unused,
    balance: unused,
    project: unused,
    findEffect: unused,
    ledger: unused,
    append: unused,
    activeReservation: unused,
    reservation: unused,
    insertReservation: unused,
    closeReservation: unused,
  };
  const service = new InventoryInboundReceivingService(
    {
      create: (ctx, origin) => {
        assert.equal(ctx.transaction, context.transaction);
        saved.push(origin);
        return Promise.resolve();
      },
    },
    inventory,
    {
      post: async (ctx, effects) => {
        assert.equal(ctx.transaction, context.transaction);
        assert.equal(ctx.actor, context.actor);
        assert.deepEqual(ctx.request, context.request);
        for (const effect of effects) {
          assert.equal(await service.validateEffect(ctx, effect, undefined), undefined);
          assert.equal(
            (await service.validateEffect(ctx, { ...effect, kg: '1' } as PostingEffect, undefined))
              ?.family,
            'GUARD_CONFLICT',
          );
        }
        batches.push(effects);
        return [];
      },
    },
    {
      source: (_ctx, id) =>
        Promise.resolve(mismatch ? undefined : sources.find((s) => s.receivedUnitId === id)),
    },
    { canReceive: () => Promise.resolve(allowed) },
  );
  return {
    service,
    context,
    arrivalId,
    sources,
    batches,
    saved,
    locks,
    deny: () => {
      allowed = false;
    },
    mismatch: () => {
      mismatch = true;
    },
  };
}
void test('Inventory receiving prelocks all actual identities then invokes IPS in one original transaction across 128 boundaries', async () => {
  const f = fixture(257);
  const origins = await f.service.receiveMany(f.context, f.arrivalId, f.sources);
  assert.deepEqual(
    f.batches.map((batch) => batch.length),
    [128, 128, 1],
  );
  assert.equal(f.locks.length, 1);
  assert.equal(f.locks[0]?.length, 514);
  assert.equal(origins.length, 257);
  assert.equal(new Set(origins.map((o) => o.unitId)).size, 257);
  assert.ok(
    origins.every(
      (o) => o.weightBasis === 'WH_ACCEPTED_DECLARED_UNIT_WEIGHT' && o.type === 'SHEET',
    ),
  );
  assert.equal(f.saved.length, 257);
  assert.equal(
    (await f.service.validateEffect(f.context, f.batches[0]![0]!, undefined))?.family,
    'GUARD_CONFLICT',
  );
  assert.ok(!('productCode' in origins[0]!));
});
void test('Inventory receiving rejects missing exact persisted source and current authority before any stock call', async () => {
  const missing = fixture();
  missing.mismatch();
  await assert.rejects(
    missing.service.receiveMany(missing.context, missing.arrivalId, missing.sources),
    BusinessRejection,
  );
  assert.equal(missing.batches.length, 0);
  assert.equal(missing.saved.length, 0);
  const denied = fixture();
  denied.deny();
  await assert.rejects(
    denied.service.receiveMany(denied.context, denied.arrivalId, denied.sources),
    BusinessRejection,
  );
  assert.equal(denied.batches.length, 0);
});
void test('Inventory receiving cannot substitute a receipt command or unsupported material fallback', async () => {
  const f = fixture();
  assert.equal(resolveInboundMaterialType('کویل'), 'COIL');
  assert.equal(resolveInboundMaterialType('ورق'), 'SHEET');
  for (const label of ['new material', 'OTHER', ' ورق', 'ورق '])
    assert.throws(() => resolveInboundMaterialType(label), BusinessRejection);
  const forged = {
    ...f.context,
    request: { ...f.context.request, command: 'PostGoodsReceipt', payload: {} as JsonObject },
  };
  await assert.rejects(f.service.receiveMany(forged, f.arrivalId, f.sources), BusinessRejection);
  await assert.rejects(
    f.service.receiveMany(f.context, f.arrivalId, [
      { ...f.sources[0]!, acceptedUnitWeightKg: '2.5' },
    ]),
    BusinessRejection,
  );
  await assert.rejects(
    f.service.receiveMany(f.context, f.arrivalId, [{ ...f.sources[0]!, technicalType: 'OTHER' }]),
    BusinessRejection,
  );
  assert.equal(f.batches.length, 0);
});

void test('New receiving genealogy is source-backed with accepted W1 and cannot expose an unrelated receiving source', async () => {
  const f = fixture();
  const unitId = randomUUID(),
    receivedUnitId = randomUUID(),
    lotId = randomUUID(),
    customerId = randomUUID();
  const origin: GenealogyInboundOrigin = {
    originKind: 'WH_ACCEPTED_RECEIVING_UNIT',
    receivedUnitId,
    unitId,
    lotId,
    materialId: randomUUID(),
    effectId: randomUUID(),
    internalCode: 'ک'.repeat(128),
    acceptedUnitWeightKg: '2000',
    type: 'SHEET',
    locationId: randomUUID(),
  };
  let related = true;
  const ports: GenealogySourcePorts = {
    inventory: {
      unit: () => Promise.resolve({ id: unitId, lotId, kind: 'SHEET', state: 'AVAILABLE' }),
      origins: (_ctx, kind, id) =>
        Promise.resolve(
          (kind === 'UNIT' && id === unitId) ||
            (kind === 'LOT' && id === lotId) ||
            (kind === 'RECEIVING_UNIT' && id === receivedUnitId)
            ? [origin]
            : [],
        ),
    },
    production: {
      facts: (_ctx, kind, id) =>
        Promise.resolve(
          related && kind === 'UNIT' && id === unitId
            ? [
                {
                  id: randomUUID(),
                  kind: 'CONSUMPTION',
                  data: { unitId, kg: '1' },
                  operationId: randomUUID(),
                  productionOrderId: randomUUID(),
                  salesOrderId: randomUUID(),
                },
              ]
            : [],
        ),
    },
    shipping: { sources: () => Promise.resolve({ packages: [], shipments: [] }) },
  };
  const context: GenealogyContext = {
    actor: { ...f.context.actor, customerScope: customerId },
    transaction: f.context.transaction,
    customerId,
  };
  const projection = new GenealogyProjection(ports);
  const result = await projection.trace(context, 'TraceBackward', { kind: 'UNIT', id: unitId });
  assert.ok(
    result?.nodes.some((node) => node.kind === 'RECEIVING_UNIT' && node.id === receivedUnitId),
  );
  assert.ok(
    result?.edges.every((edge) => edge.kgMeaning === 'ACCEPTED_UNIT_WEIGHT' && edge.kg === '2000'),
  );
  assert.ok(!JSON.stringify(result).includes('measuredKg'));
  assert.ok(!JSON.stringify(result).includes('arrivalId'));
  related = false;
  assert.equal(
    await projection.trace(context, 'TraceForward', { kind: 'RECEIVING_UNIT', id: receivedUnitId }),
    undefined,
  );
});
