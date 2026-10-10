import type { CommandRequest, ExecutionContext, TransactionContext } from '@navard/shared-kernel';
export interface ShippingContext {
  request: CommandRequest;
  actor: ExecutionContext;
  transaction: TransactionContext;
}
export interface ShippingTraceContext {
  actor: ExecutionContext;
  transaction: TransactionContext;
  customerId: string;
}
export interface ShippingTraceDispatch extends ShippingEntry {
  packageId: string;
}
export interface ShippingTracePackage {
  id: string;
  orderId: string;
  state: ShippingPackage['state'];
  shipmentId?: string;
  entries: readonly ShippingEntry[];
}
export interface ShippingTraceShipment {
  id: string;
  orderId: string;
  state: Shipment['state'];
  dispatch: readonly ShippingTraceDispatch[];
  dispatchedAt?: string;
}
export interface ShippingTraceSources {
  packages: readonly ShippingTracePackage[];
  shipments: readonly ShippingTraceShipment[];
}
export interface ShippingTraceSourcePort {
  traceSources(
    context: ShippingTraceContext,
    kind: 'UNIT' | 'PACKAGE' | 'SHIPMENT' | 'SALES_ORDER',
    id: string,
  ): Promise<ShippingTraceSources>;
}
export interface ShippingEntry {
  reservationId: string;
  unitId: string;
  itemId: string;
  kg: string;
}
export interface ShippingDemand {
  id: string;
  customerId: string;
  binding: string;
  items: readonly { id: string; demandedKg: string; allowPartialShipment: boolean }[];
}
export interface ShippingDemandPort {
  demand(
    context: ShippingContext,
    orderId: string,
    customerId: string,
  ): Promise<ShippingDemand | undefined>;
}
export interface ShippingInventoryPort {
  inspect(
    context: ShippingContext,
    orderId: string,
    reservationIds: readonly string[],
  ): Promise<readonly ShippingEntry[]>;
  pack(context: ShippingContext, orderId: string, entries: readonly ShippingEntry[]): Promise<void>;
  unpack(
    context: ShippingContext,
    orderId: string,
    entries: readonly ShippingEntry[],
  ): Promise<void>;
  dispatch(
    context: ShippingContext,
    orderId: string,
    shipmentId: string,
    entries: readonly ShippingEntry[],
  ): Promise<void>;
}
export interface ShippingPolicy {
  canShip(context: ShippingContext, customerId: string): Promise<boolean>;
}
export interface ShippingPackage {
  id: string;
  orderId: string;
  customerId: string;
  binding: string;
  orderBinding: string;
  state: 'DRAFT' | 'PACKED' | 'ASSIGNED_TO_SHIPMENT' | 'UNPACKED';
  entries: readonly ShippingEntry[];
  shipmentId?: string;
  createdAt?: string;
  updatedAt?: string;
  actorIssuer?: string;
  actorSubject?: string;
}
export interface Shipment {
  id: string;
  orderId: string;
  customerId: string;
  binding: string;
  orderBinding: string;
  state: 'DRAFT' | 'READY' | 'LOADING' | 'DISPATCHED';
  entries: readonly ShippingEntry[];
  createdAt?: string;
  updatedAt?: string;
  dispatchedAt?: string;
  actorIssuer?: string;
  actorSubject?: string;
  dispatchIssuer?: string;
  dispatchSubject?: string;
}
export interface ShippingStore {
  lockOrder(context: ShippingContext, id: string): Promise<void>;
  lockDocuments(context: ShippingContext, ids: readonly string[]): Promise<void>;
  package(context: ShippingContext, id: string): Promise<ShippingPackage | undefined>;
  shipment(context: ShippingContext, id: string): Promise<Shipment | undefined>;
  packages(context: ShippingContext, shipmentId: string): Promise<readonly ShippingPackage[]>;
  shippedKg(context: ShippingContext, orderId: string, itemId: string): Promise<string>;
  createPackage(context: ShippingContext, value: ShippingPackage): Promise<ShippingPackage>;
  createShipment(context: ShippingContext, value: Shipment): Promise<Shipment>;
  packageState(
    context: ShippingContext,
    id: string,
    from: ShippingPackage['state'],
    to: ShippingPackage['state'],
    shipmentId?: string,
  ): Promise<ShippingPackage | undefined>;
  shipmentState(
    context: ShippingContext,
    id: string,
    from: Shipment['state'],
    to: Shipment['state'],
    entries?: readonly ShippingEntry[],
  ): Promise<Shipment | undefined>;
}
