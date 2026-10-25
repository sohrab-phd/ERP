import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { CommandRequest, JsonObject } from '@navard/shared-kernel';
import type { InboundOrderProjection } from '../../src/modules/procurement/index.js';
import { optionCommand, orderCommand } from './inbound-harness.js';
import { request } from './synthetic-command.js';
import type { browserHarness } from './browser-harness.js';

/** Real owner commands only; no direct business-source insertion or test HTTP backdoor. */
export async function seedBrowserScenarios(h: Awaited<ReturnType<typeof browserHarness>>) {
  const proc = await h.app.identity.context(h.people.tokens.get('ACT-PROC')!, 'ACT-PROC');
  const wh = await h.app.identity.context(h.people.tokens.get('ACT-WH')!, 'ACT-WH');
  async function accept(command: CommandRequest, warehouse = false) {
    const result = await h.app.command(JSON.stringify(command), warehouse ? wh : proc);
    assert.equal(result.status, 'completed');
    if (result.status !== 'completed') throw new Error('Fixture command incomplete');
    assert.equal(result.result.outcome, 'accepted');
  }
  const material = optionCommand('MATERIAL_TYPE', 'COIL');
  const quality = optionCommand('QUALITY_GRADE', 'کیفیت نمونه');
  const color = optionCommand('COLOR', 'آبی');
  for (const command of [material, quality, color]) await accept(command);
  const base = {
    materialTypeOptionId: material.target.id,
    widthM: '1.200',
    thicknessMm: '0.35',
    unitWeightKg: '2000',
    orderedUnitCount: '30',
  };
  const command = orderCommand(material.target.id, {
    payload: {
      orderReference: 'P1-READBACK',
      registrationDateJalali: '1403-12-30',
      lines: Array.from({ length: 25 }, (_, i) => ({
        ...base,
        ...(i === 0
          ? {
              itemNumber: 'آیتم نخست',
              colorOptionId: color.target.id,
              qualityGradeOptionId: quality.target.id,
              ralColorNumber: ' RAL-۱۲ ',
              lengthM: '12.000',
            }
          : {}),
      })),
    },
  });
  const sibling = orderCommand(material.target.id, {
    payload: {
      orderReference: 'SIBLING-PRIVATE',
      registrationDateJalali: '1404-01-01',
      lines: [base],
    },
  });
  await accept(command);
  await accept(sibling);
  const order = (await h.app.inboundQuery(
    'GetOperationalPurchaseOrder',
    { orderId: command.target.id },
    proc,
  )) as InboundOrderProjection;
  const other = (await h.app.inboundQuery(
    'GetOperationalPurchaseOrder',
    { orderId: sibling.target.id },
    proc,
  )) as InboundOrderProjection;
  const waybillId = randomUUID(),
    receiptId = randomUUID(),
    siblingWaybill = randomUUID(),
    siblingReceipt = randomUUID();
  const actual = {
    materialTypeOptionId: material.target.id,
    widthM: '1.200',
    thicknessMm: '0.35',
    unitWeightKg: '2000',
  };
  const unit = (association: JsonObject, extra: JsonObject = {}): JsonObject => ({
    receivedUnitId: randomUUID(),
    waybillId,
    receiptId,
    internalSystemCode: 'P1-UNIT-' + randomUUID(),
    productNumber: 'محصول آزمون',
    association,
    actual,
    acceptance: { confirmed: true },
    locationId: randomUUID(),
    ...extra,
  });
  const arrival = request({
    command: 'ConfirmPurchaseReceiving',
    target: { kind: 'inbound-arrival', id: randomUUID() },
    payload: {
      arrivalDateJalali: '1403-12-30',
      originNetKg: '06000.12500',
      destinationNetKg: '6000.1200',
      weightSourceWaybillId: waybillId,
      truckNumber: 'آزمون ۱۲',
      originatingCompany: 'مبدأ نمونه',
      driverName: 'رانندهٔ آزمون',
      waybills: [
        { waybillId, reference: 'P1-WAYBILL', yellowCopyReference: 'برگ زرد نمونه' },
        { waybillId: siblingWaybill, reference: 'SIBLING-DOC-PRIVATE' },
      ],
      warehouseReceipts: [
        { receiptId, reference: 'P1-RECEIPT' },
        { receiptId: siblingReceipt, reference: 'SIBLING-RECEIPT-PRIVATE' },
      ],
      units: [
        ...Array.from({ length: 23 }, (_, i) =>
          unit(
            { kind: 'ORDER_LINE', orderId: order.orderId, lineId: order.lines[0]!.lineId },
            i === 0
              ? {
                  actual: { ...actual, widthM: '1.250', unitWeightKg: '2100', colorOptionId: null },
                  acceptance: { confirmed: true, changedW1: true, specificationMismatch: true },
                  weightEvidenceReference: 'شاهد وزن نمونه',
                }
              : {},
          ),
        ),
        unit(
          { kind: 'ORDER_ONLY', orderId: order.orderId },
          { acceptance: { confirmed: true, unordered: true } },
        ),
        unit(
          { kind: 'ORDER_LINE', orderId: other.orderId, lineId: other.lines[0]!.lineId },
          {
            waybillId: siblingWaybill,
            receiptId: siblingReceipt,
            internalSystemCode: 'SIBLING-CARGO-PRIVATE',
          },
        ),
        unit(
          { kind: 'UNLINKED' },
          {
            internalSystemCode: 'UNLINKED-CARGO-PRIVATE',
            acceptance: { confirmed: true, unordered: true },
          },
        ),
      ],
    },
    preconditions: {
      lineProgress: [
        { orderId: order.orderId, lineId: order.lines[0]!.lineId, expectedAcceptedUnitCount: '0' },
        { orderId: other.orderId, lineId: other.lines[0]!.lineId, expectedAcceptedUnitCount: '0' },
      ],
    },
  });
  await accept(arrival, true);
  return { order, sibling: other, material: material.target.id, arrivalId: arrival.target.id };
}
