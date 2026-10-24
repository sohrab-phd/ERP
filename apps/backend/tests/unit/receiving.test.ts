import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import type { JsonValue } from '@navard/shared-kernel';
import { parseReceivingInput } from '../../src/modules/procurement/index.js';

type Mutable = { [key: string]: JsonValue };
function input(): Mutable {
  const waybillId = randomUUID(),
    receiptId = randomUUID();
  return {
    arrivalDateJalali: '1403-12-30',
    originNetKg: '06000.12500',
    weightSourceWaybillId: waybillId,
    waybills: [{ waybillId, reference: 'WB' }],
    warehouseReceipts: [{ receiptId, reference: 'WR' }],
    units: [
      {
        receivedUnitId: randomUUID(),
        waybillId,
        receiptId,
        internalSystemCode: 'دستی-۱',
        productNumber: 'محصول',
        association: { kind: 'UNLINKED' },
        actual: {
          materialTypeOptionId: randomUUID(),
          widthM: '1.200',
          thicknessMm: '0.350',
          unitWeightKg: '2000',
        },
        acceptance: { confirmed: true, unordered: true },
        locationId: randomUUID(),
      },
    ],
  };
}
function unit(p: Mutable) {
  return (p.units as Mutable[])[0]!;
}
function invariant(fn: () => unknown) {
  assert.throws(fn, (error) => typeof error === 'object' && error !== null && 'rejection' in error);
}
void test('I2 parsing preserves raw codes, exact decimal lexemes and all five absent optional receiving fields', () => {
  const p = input();
  const parsed = parseReceivingInput(p);
  assert.equal(parsed.originNetKg, '06000.12500');
  assert.equal(parsed.units[0]!.internalSystemCode, 'دستی-۱');
  assert.equal(parsed.units[0]!.actual.widthM, '1.200');
  assert.equal(parsed.destinationNetKg, undefined);
  assert.equal(parsed.truckNumber, undefined);
  assert.equal(parsed.driverName, undefined);
  assert.equal(parsed.originatingCompany, undefined);
  assert.equal(parsed.waybills[0]!.yellowCopyReference, undefined);
});
void test('I2 per-unit W1 remains positive whole kg while consignment values retain fractional precision', () => {
  for (const w1 of ['0', '1.1', '-1', '01', '1e3', '100000000000000000000']) {
    const p = input();
    (unit(p).actual as Mutable).unitWeightKg = w1;
    invariant(() => parseReceivingInput(p));
  }
  const p = input();
  p.originNetKg = '0.000000000000000000000000001';
  p.destinationNetKg = '0000.0000';
  assert.equal(parseReceivingInput(p).destinationNetKg, '0000.0000');
});
void test('I2 actual optional attribute states distinguish not-recorded, explicit absent and observed values', () => {
  const p = input();
  const actual = unit(p).actual as Mutable;
  actual.colorOptionId = null;
  actual.qualityGradeOptionId = null;
  actual.ralColorNumber = null;
  actual.lengthM = null;
  const parsed = parseReceivingInput(p);
  assert.equal(parsed.units[0]!.actual.colorOptionId, null);
  assert.equal(parsed.units[0]!.actual.lengthM, null);
  delete actual.colorOptionId;
  assert.equal(parseReceivingInput(p).units[0]!.actual.colorOptionId, undefined);
});
void test('I2 identifiers and membership reject duplicated units/codes and cross-document references', () => {
  for (const which of ['receivedUnitId', 'internalSystemCode']) {
    const p = input(),
      first = unit(p),
      second: Mutable = { ...first, receivedUnitId: randomUUID(), internalSystemCode: 'other' };
    second[which] = first[which]!;
    p.units = [first, second];
    invariant(() => parseReceivingInput(p));
  }
  const p = input();
  unit(p).waybillId = randomUUID();
  invariant(() => parseReceivingInput(p));
});
void test('I2 requires explicit manual acceptance and rejects forged actors or stock identities', () => {
  for (const extra of [
    { actorRole: 'ACT-WH' },
    { unitId: randomUUID() },
    { technicalType: 'OTHER' },
  ]) {
    const p = input();
    Object.assign(unit(p), extra);
    invariant(() => parseReceivingInput(p));
  }
  const p = input();
  unit(p).acceptance = { confirmed: false };
  invariant(() => parseReceivingInput(p));
});
void test('I2 uses validated finite Jalali arrival profile and rejects unsupported or invalid calendar days', () => {
  for (const date of ['1205-12-29', '1499-01-01', '1402-12-30', '1403-07-31']) {
    const p = input();
    p.arrivalDateJalali = date;
    invariant(() => parseReceivingInput(p));
  }
  assert.equal(parseReceivingInput(input()).arrivalDateJalali, '1403-12-30');
});
void test('I2 text limit counts Unicode scalars separately from UTF8 bytes and never truncates', () => {
  const p = input();
  p.driverName = '😀'.repeat(128);
  assert.equal(parseReceivingInput(p).driverName, p.driverName);
  p.driverName = '😀'.repeat(129);
  invariant(() => parseReceivingInput(p));
});
void test('I2 parser has no false256unit cap and does not expand a physical-unit count into stock', () => {
  const p = input(),
    template = unit(p);
  p.units = Array.from({ length: 257 }, () => ({
    ...template,
    receivedUnitId: randomUUID(),
    internalSystemCode: randomUUID(),
  }));
  assert.equal(parseReceivingInput(p).units.length, 257);
});
