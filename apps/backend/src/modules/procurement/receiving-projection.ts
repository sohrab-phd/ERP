import { Buffer } from 'node:buffer';
import type { InboundOrderProjection } from './inbound-contracts.js';
import { JALALI_CALENDAR_PROFILE } from './inbound-values.js';
import type { ReceivingContext, ReceivingInput, ReceivingUnitFact } from './receiving-contracts.js';

export const RECEIVING_RESPONSE_BYTES = 256 * 1024;
const uuidPlaceholder = '0'.repeat(36);
// PostgreSQL JSON timestamptz (six fractional digits and numeric offset) is <=35 ASCII bytes.
const timestampPlaceholder = '0'.repeat(35);
const snapshotPlaceholder = '0'.repeat(24);

/** Same outer transport wrapper and cursor/snapshot members as the actual read surface. */
export function receivingPageFits(
  base: Record<string, unknown>,
  items: readonly Record<string, unknown>[],
  snapshotAt: string,
  nextAfterId?: string,
): boolean {
  return (
    Buffer.byteLength(
      JSON.stringify({
        data: {
          ...base,
          items,
          ...(nextAfterId === undefined ? {} : { nextAfterId }),
          snapshotAt,
        },
      }),
      'utf8',
    ) <= RECEIVING_RESPONSE_BYTES
  );
}

export function receivingOrderSummary(order: InboundOrderProjection): Record<string, unknown> {
  return {
    orderId: order.orderId,
    orderReference: order.orderReference,
    registrationDateJalali: order.registrationDateJalali,
    calendar: order.calendar,
    units: order.units,
    lineCount: order.lineCount,
  };
}

/** Conservative exact-shape upper bounds are checked before any immutable source insertion. */
export function receivingProjectionFits(
  context: ReceivingContext,
  arrivalId: string,
  input: ReceivingInput,
  facts: readonly ReceivingUnitFact[],
  orders: ReadonlyMap<string, InboundOrderProjection>,
): boolean {
  const receivingActor = {
    issuer: context.actor.principal.issuer,
    subject: context.actor.principal.subject,
    role: context.actor.actorRole,
  };
  const header = {
    arrivalId,
    arrivalDateJalali: input.arrivalDateJalali,
    calendar: 'jalali',
    calendarProfile: JALALI_CALENDAR_PROFILE,
    originNetKg: input.originNetKg,
    ...(input.destinationNetKg === undefined ? {} : { destinationNetKg: input.destinationNetKg }),
    weightSourceWaybillId: input.weightSourceWaybillId,
    ...(input.truckNumber === undefined ? {} : { truckNumber: input.truckNumber }),
    ...(input.originatingCompany === undefined
      ? {}
      : { originatingCompany: input.originatingCompany }),
    ...(input.driverName === undefined ? {} : { driverName: input.driverName }),
    recordedAt: timestampPlaceholder,
    receivingActor,
  };
  for (const fact of facts) {
    const row = {
      receivedUnitId: fact.receivedUnitId,
      arrivalId,
      position: fact.position,
      internalSystemCode: fact.internalSystemCode,
      productNumber: fact.productNumber,
      association: fact.association,
      actual: fact.actual,
      original: fact.original,
      comparison: fact.comparison,
      acceptance: fact.acceptance,
      locationId: fact.locationId,
      weightEvidenceReference: fact.weightEvidenceReference ?? null,
      recordedAt: timestampPlaceholder,
      receivingActor,
      arrival: header,
      waybill: input.waybills.find((value) => value.waybillId === fact.waybillId),
      warehouseReceipt: input.warehouseReceipts.find((value) => value.receiptId === fact.receiptId),
      inventory: {
        receivedUnitId: fact.receivedUnitId,
        unitId: uuidPlaceholder,
        lotId: uuidPlaceholder,
        materialId: uuidPlaceholder,
        effectId: uuidPlaceholder,
      },
    };
    if (!receivingPageFits({ arrival: header }, [row], snapshotPlaceholder, fact.receivedUnitId))
      return false;
    if (fact.association.kind !== 'UNLINKED') {
      const order = orders.get(fact.association.orderId);
      if (
        !order ||
        !receivingPageFits(
          { order: receivingOrderSummary(order) },
          [row],
          snapshotPlaceholder,
          fact.receivedUnitId,
        )
      )
        return false;
    }
  }
  // I1 lines are individually bounded; use maximum count widths rather than a transient count.
  // PostgreSQL COUNT is bigint; an ordered count can have20 digits and signed variance21.
  for (const order of orders.values())
    for (const line of order.lines) {
      const row = {
        ...line,
        acceptedUnitCount: '9'.repeat(20),
        remainingUnitCount: '9'.repeat(20),
        excessUnitCount: '9'.repeat(20),
        variance: '-' + '9'.repeat(20),
      };
      if (
        !receivingPageFits(
          { order: receivingOrderSummary(order) },
          [row],
          snapshotPlaceholder,
          line.lineId,
        )
      )
        return false;
    }
  return true;
}
