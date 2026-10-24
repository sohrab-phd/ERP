import type { JsonObject } from '@navard/shared-kernel';
import type { ReceiptContext, ReceiptType } from './contracts.js';
import type { InboundLineProjection, OptionSelection } from './inbound-contracts.js';
export type ReceivingContext = ReceiptContext;
export interface ReceivingActualInput {
  materialTypeOptionId: string;
  widthM: string;
  thicknessMm: string;
  unitWeightKg: string;
  colorOptionId?: string | null;
  qualityGradeOptionId?: string | null;
  ralColorNumber?: string | null;
  lengthM?: string | null;
}
export interface ReceivingActual {
  materialType: OptionSelection;
  widthM: string;
  thicknessMm: string;
  unitWeightKg: string;
  color?: OptionSelection | null;
  qualityGrade?: OptionSelection | null;
  ralColorNumber?: string | null;
  lengthM?: string | null;
}
export type ReceivingAssociation =
  | { kind: 'ORDER_LINE'; orderId: string; lineId: string }
  | { kind: 'ORDER_ONLY'; orderId: string }
  | { kind: 'UNLINKED' };
export interface ReceivingAcceptance {
  confirmed: true;
  changedW1?: boolean;
  specificationMismatch?: boolean;
  excess?: boolean;
  unordered?: boolean;
}
export interface ReceivingUnitInput {
  receivedUnitId: string;
  waybillId: string;
  receiptId: string;
  internalSystemCode: string;
  productNumber: string;
  association: ReceivingAssociation;
  actual: ReceivingActualInput;
  acceptance: ReceivingAcceptance;
  weightEvidenceReference?: string;
  locationId: string;
}
export interface ReceivingInput {
  arrivalDateJalali: string;
  originNetKg: string;
  destinationNetKg?: string;
  weightSourceWaybillId: string;
  truckNumber?: string;
  originatingCompany?: string;
  driverName?: string;
  waybills: readonly { waybillId: string; reference: string; yellowCopyReference?: string }[];
  warehouseReceipts: readonly { receiptId: string; reference: string }[];
  units: readonly ReceivingUnitInput[];
}
export interface ReceivingUnitFact extends Omit<ReceivingUnitInput, 'actual'> {
  arrivalId: string;
  position: number;
  actual: ReceivingActual;
  original: InboundLineProjection | null;
  comparison: JsonObject;
  technicalType: ReceiptType;
}
export interface ReceivingStockSource {
  receivedUnitId: string;
  arrivalId: string;
  internalSystemCode: string;
  productNumber: string;
  acceptedUnitWeightKg: string;
  materialTypeId: string;
  materialTypeLabel: string;
  technicalType: ReceiptType;
  locationId: string;
}
export interface ReceivingInventoryPort {
  identities(
    ctx: ReceivingContext,
    ids: readonly string[],
  ): Promise<
    readonly {
      receivedUnitId: string;
      unitId: string;
      lotId: string;
      materialId: string;
      effectId: string;
    }[]
  >;
  receiveMany(
    ctx: ReceivingContext,
    arrivalId: string,
    sources: readonly ReceivingStockSource[],
  ): Promise<readonly unknown[]>;
}
export interface ReceivingStore {
  lock(ctx: ReceivingContext, resources: readonly string[]): Promise<void>;
  duplicate(ctx: ReceivingContext, input: ReceivingInput, arrivalId: string): Promise<boolean>;
  counts(ctx: ReceivingContext, lineIds: readonly string[]): Promise<Map<string, string>>;
  insert(
    ctx: ReceivingContext,
    arrivalId: string,
    input: ReceivingInput,
    facts: readonly ReceivingUnitFact[],
  ): Promise<void>;
  complete(ctx: ReceivingContext): Promise<void>;
  source(ctx: ReceivingContext, id: string): Promise<ReceivingStockSource | undefined>;
  arrival(ctx: ReceivingContext, id: string): Promise<Record<string, unknown> | undefined>;
  units(
    ctx: ReceivingContext,
    filter: { arrivalId?: string; orderId?: string; afterId?: string; limit: number },
  ): Promise<Record<string, unknown>[]>;
}
export type ReceivingQueryName = 'GetReceivingArrival' | 'GetPurchaseOrderReceiving';
