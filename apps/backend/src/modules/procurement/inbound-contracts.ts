import type { PurchaseContext } from './purchase-contracts.js';

export type InboundContext = PurchaseContext;
export const catalogueKinds = ['MATERIAL_TYPE', 'QUALITY_GRADE', 'COLOR'] as const;
export type CatalogueKind = (typeof catalogueKinds)[number];
export interface InboundLineInput {
  itemNumber?: string;
  materialTypeOptionId: string;
  widthM: string;
  thicknessMm: string;
  colorOptionId?: string;
  ralColorNumber?: string;
  lengthM?: string;
  qualityGradeOptionId?: string;
  unitWeightKg: string;
  orderedUnitCount: string;
}
export interface OperationalOrderInput {
  orderReference: string;
  registrationDateJalali: string;
  lines: readonly InboundLineInput[];
}
export interface CatalogueInput {
  catalogue: CatalogueKind;
  label: string;
}
export interface InboundOption extends CatalogueInput {
  optionId: string;
  binding: string;
}
export interface OptionSelection {
  optionId: string;
  label: string;
}
export interface InboundLineProjection {
  lineId: string;
  position: number;
  itemNumber?: string;
  materialType: OptionSelection;
  widthM: string;
  thicknessMm: string;
  color?: OptionSelection;
  ralColorNumber?: string;
  lengthM?: string;
  qualityGrade?: OptionSelection;
  unitWeightKg: string;
  orderedUnitCount: string;
}
export interface InboundOrderProjection {
  orderId: string;
  orderReference: string;
  registrationDateJalali: string;
  calendar: 'jalali';
  lineCount: number;
  units: { widthM: 'm'; thicknessMm: 'mm'; lengthM: 'm'; unitWeightKg: 'kg' };
  lines: readonly InboundLineProjection[];
}
export interface InboundOrderRecord {
  id: string;
  binding: string;
  orderReferenceKey: string;
  projection: InboundOrderProjection;
}
export interface CatalogueQuery {
  catalogue: CatalogueKind;
  exactLabel?: string;
  afterId?: string;
  limit: number;
}
export type InboundQueryName =
  | 'GetOperationalPurchaseOrderByReference'
  | 'GetOperationalPurchaseOrder'
  | 'ListInboundCatalogueOptions';
export interface InboundStore {
  lock(ctx: InboundContext, resources: readonly string[]): Promise<void>;
  order(ctx: InboundContext, id: string): Promise<InboundOrderRecord | undefined>;
  orderByReference(
    ctx: InboundContext,
    rawReference: string,
    expectedKey: string,
  ): Promise<InboundOrderRecord | undefined>;
  options(ctx: InboundContext, ids: readonly string[]): Promise<InboundOption[]>;
  listOptions(ctx: InboundContext, input: CatalogueQuery): Promise<InboundOption[]>;
  insertOption(
    ctx: InboundContext,
    id: string,
    binding: string,
    input: CatalogueInput,
  ): Promise<void>;
  insertOrder(
    ctx: InboundContext,
    id: string,
    binding: string,
    input: OperationalOrderInput,
    projection: InboundOrderProjection,
  ): Promise<void>;
}
export interface InboundPolicy {
  current(ctx: InboundContext): Promise<boolean>;
}
