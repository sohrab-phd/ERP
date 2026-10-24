import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { createTransactionContext } from '@navard/shared-kernel';
import {
  receivingProjectionFits,
  receivingPageFits,
  type ReceivingContext,
  type ReceivingInput,
  type ReceivingUnitFact,
} from '../../src/modules/procurement/index.js';

void test('Receiving response budget accounts for transport wrapper, snapshot, cursor and JSON escaping', () => {
  const snapshotAt = '2026-10-24T12:34:56.000Z';
  const cursor = randomUUID();
  const base = { driverName: 'نام «راننده»', quoted: '"'.repeat(128) };
  const emptyBytes = Buffer.byteLength(
    JSON.stringify({ data: { ...base, items: [{ text: '' }], nextAfterId: cursor, snapshotAt } }),
    'utf8',
  );
  const fitting = '0'.repeat(262144 - emptyBytes);
  assert.equal(receivingPageFits(base, [{ text: fitting }], snapshotAt, cursor), true);
  assert.equal(receivingPageFits(base, [{ text: fitting + '0' }], snapshotAt, cursor), false);
  assert.equal(receivingPageFits(base, [{ text: fitting }], snapshotAt, cursor + '0'), false);
});

void test('Pre-insert receiving projection checks duplicated shared weights and complete trusted metadata at exact single-item boundary', () => {
  const arrivalId = randomUUID(),
    receivedUnitId = randomUUID(),
    waybillId = randomUUID(),
    receiptId = randomUUID();
  const context: ReceivingContext = {
    actor: {
      installationId: randomUUID(),
      authorityScopeId: randomUUID(),
      principal: { issuer: 'local:"quoted"', subject: 'trusted-subject' },
      actorRole: 'ACT-WH',
      requestId: randomUUID(),
    },
    transaction: createTransactionContext(),
    request: {
      command: 'ConfirmPurchaseReceiving',
      contract_version: 1,
      idempotency_key: randomUUID(),
      target: { kind: 'inbound-arrival', id: arrivalId },
      payload: {},
      preconditions: {},
    },
  };
  const input: ReceivingInput = {
    arrivalDateJalali: '1403-12-30',
    originNetKg: '0'.repeat(65536),
    destinationNetKg: '0',
    weightSourceWaybillId: waybillId,
    driverName: 'راننده',
    waybills: [{ waybillId, reference: 'بارنامه' }],
    warehouseReceipts: [{ receiptId, reference: 'رسید' }],
    units: [],
  };
  const fact: ReceivingUnitFact = {
    receivedUnitId,
    arrivalId,
    position: 1,
    waybillId,
    receiptId,
    internalSystemCode: 'واحد',
    productNumber: 'محصول',
    association: { kind: 'UNLINKED' },
    actual: {
      materialType: { optionId: randomUUID(), label: 'ورق' },
      widthM: '1',
      thicknessMm: '1',
      unitWeightKg: '2000',
    },
    acceptance: { confirmed: true, unordered: true },
    locationId: randomUUID(),
    original: null,
    comparison: {},
    technicalType: 'SHEET',
  };
  const fits = (size: number) =>
    receivingProjectionFits(
      context,
      arrivalId,
      { ...input, destinationNetKg: '0'.repeat(size) },
      [fact],
      new Map(),
    );
  let low = 1,
    high = 65536;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (fits(mid)) low = mid;
    else high = mid - 1;
  }
  assert.ok(low > 60000 && low < 65536);
  assert.equal(fits(low), true);
  assert.equal(fits(low + 1), false);
  // Empty optional arrival values do not create a mandatory-field dependency.
  assert.equal(
    receivingProjectionFits(context, arrivalId, { ...input, originNetKg: '0' }, [fact], new Map()),
    true,
  );
});
