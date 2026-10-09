import {
  BusinessRejection,
  TechnicalError,
  canonicalJson,
  freezeJson,
  parseBoundedJson,
  validateContext,
  validUuid,
  validIdempotencyKey,
  type CommandContract,
  type CommandDecision,
  type CommandRequest,
  type ExecutionContext,
  type TransactionContext,
  type JsonObject,
  type GuardFamily,
  type FieldShape,
} from '@navard/shared-kernel';
import type {
  ShippingContext,
  ShippingStore,
  ShippingInventoryPort,
  ShippingDemandPort,
  ShippingPolicy,
  ShippingPackage,
  Shipment,
  ShippingEntry,
  ShippingDemand,
} from './contracts.js';
const commands = [
  'DraftPackage',
  'PackPackage',
  'UnpackPackage',
  'DraftShipment',
  'AssignPackageToShipment',
  'MarkShipmentReady',
  'StartLoading',
  'DispatchShipment',
] as const;
function reject(family: GuardFamily, message: string): never {
  throw new BusinessRejection({ family, message });
}
function frozen<T>(value: T): T {
  return freezeJson(parseBoundedJson(canonicalJson(value as JsonObject))) as T;
}
function bind(value: unknown): string {
  return canonicalJson(value as JsonObject).toString('utf8');
}
function quantity(value: string): bigint {
  if (!/^(?:0|[1-9][0-9]{0,19})(?:\.[0-9]{1,6})?$/u.test(value))
    throw new TechnicalError('incompatible');
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole!) * 1000000n + BigInt(fraction.padEnd(6, '0'));
}
function snapshot(supplied: ShippingContext): ShippingContext {
  validateContext(supplied.actor);
  const actor =
    Object.isFrozen(supplied.actor) && Object.isFrozen(supplied.actor.principal)
      ? supplied.actor
      : Object.freeze({
          ...supplied.actor,
          principal: Object.freeze({ ...supplied.actor.principal }),
        });
  return Object.freeze({
    actor,
    transaction: supplied.transaction,
    request: Object.freeze({
      ...supplied.request,
      target: Object.freeze({ ...supplied.request.target }),
      payload: frozen(supplied.request.payload),
      preconditions: frozen(supplied.request.preconditions),
    }),
  });
}
/** Shipping owns orchestration and traceable documents; Inventory alone owns quantity/state effects. */
export class ShippingService {
  constructor(
    private readonly store: ShippingStore,
    private readonly inventory: ShippingInventoryPort,
    private readonly demand: ShippingDemandPort,
    private readonly policy: ShippingPolicy,
  ) {}
  contracts(): CommandContract[] {
    const scalar = { type: 'scalar' as const };
    return commands.map((command) => {
      const payloadShape: Record<string, FieldShape> =
        command === 'DraftPackage'
          ? { orderId: scalar, reservationIds: { type: 'array', element: scalar } }
          : command === 'DraftShipment'
            ? { orderId: scalar }
            : command === 'AssignPackageToShipment'
              ? { shipmentId: scalar }
              : {};
      return {
        command,
        version: 1,
        active: true,
        payloadShape,
        preconditionsShape: {},
        execute: (request, actor, transaction) => this.execute(request, actor, transaction),
        constraintRejections: {
          package_pkey: () =>
            Promise.resolve({ family: 'GUARD_ACTOR' as const, message: 'Package unavailable' }),
          shipment_pkey: () =>
            Promise.resolve({ family: 'GUARD_ACTOR' as const, message: 'Shipment unavailable' }),
          package_active_unit: () =>
            Promise.resolve({
              family: 'GUARD_CONFLICT' as const,
              message: 'Unit already belongs to another packed package',
            }),
        },
      };
    });
  }
  private async authorize(context: ShippingContext, customerId: string): Promise<void> {
    if (
      !validUuid(customerId) ||
      context.actor.temporary === true ||
      context.actor.actorRole !== 'ACT-SHIP' ||
      context.actor.customerScope !== customerId ||
      !(await this.policy.canShip(context, customerId))
    )
      reject('GUARD_ACTOR', 'Current customer-scoped shipment permission required');
  }
  private async confirmed(
    context: ShippingContext,
    orderId: string,
    binding?: string,
  ): Promise<ShippingDemand> {
    const customerId = context.actor.customerScope ?? '';
    await this.authorize(context, customerId);
    const value = await this.demand.demand(context, orderId, customerId);
    if (!value) reject('GUARD_ACTOR', 'Confirmed demand unavailable');
    if (value.id !== orderId || value.customerId !== customerId)
      throw new TechnicalError('incompatible');
    if (binding !== undefined && value.binding !== binding)
      reject('GUARD_CONFLICT', 'Confirmed order binding changed');
    return value;
  }
  private async package(context: ShippingContext, id: string): Promise<ShippingPackage> {
    const value = await this.store.package(context, id);
    if (!value) reject('GUARD_ACTOR', 'Package unavailable');
    await this.authorize(context, value.customerId);
    return value;
  }
  private async shipment(context: ShippingContext, id: string): Promise<Shipment> {
    const value = await this.store.shipment(context, id);
    if (!value) reject('GUARD_ACTOR', 'Shipment unavailable');
    await this.authorize(context, value.customerId);
    return value;
  }
  private publicRecord<T extends ShippingPackage | Shipment>(
    value: T,
  ): Omit<T, 'binding' | 'orderBinding'> {
    const { binding: _binding, orderBinding: _orderBinding, ...visible } = value;
    void _binding;
    void _orderBinding;
    return frozen(visible);
  }
  private decision(
    value: ShippingPackage | Shipment,
    event: string,
    from?: string,
  ): CommandDecision {
    return {
      outcome: 'accepted',
      factIdentity: value.id,
      ...(from ? { sourceState: from } : {}),
      targetState: value.state,
      event,
      data: this.publicRecord(value) as unknown as JsonObject,
    };
  }
  async execute(
    request: CommandRequest,
    actor: ExecutionContext,
    transaction: TransactionContext,
  ): Promise<CommandDecision> {
    const context = snapshot({ request, actor, transaction });
    const input = context.request;
    if (
      !commands.includes(input.command as (typeof commands)[number]) ||
      input.contract_version !== 1 ||
      !validUuid(input.target.id) ||
      !validIdempotencyKey(input.idempotency_key) ||
      Object.keys(input.preconditions).length !== 0
    )
      reject('GUARD_INVARIANT', 'Invalid shipment command');
    const packageCommand = [
      'DraftPackage',
      'PackPackage',
      'UnpackPackage',
      'AssignPackageToShipment',
    ].includes(input.command);
    if (input.target.kind !== (packageCommand ? 'package' : 'shipment'))
      reject('GUARD_INVARIANT', 'Wrong shipment target kind');
    await this.authorize(context, context.actor.customerScope ?? '');
    if (input.command === 'DraftPackage' || input.command === 'DraftShipment')
      return this.draft(context, input.command === 'DraftPackage');
    if (input.command === 'AssignPackageToShipment') return this.assign(context);
    if (Object.keys(input.payload).length !== 0)
      reject('GUARD_INVARIANT', 'Transition has no payload');
    return packageCommand ? this.pack(context) : this.advance(context);
  }
  private async draft(context: ShippingContext, isPackage: boolean): Promise<CommandDecision> {
    const input = context.request.payload;
    const orderId = input.orderId;
    if (
      !validUuid(orderId) ||
      Object.keys(input).some(
        (key) => !['orderId', ...(isPackage ? ['reservationIds'] : [])].includes(key),
      )
    )
      reject('GUARD_INVARIANT', 'Invalid shipment draft');
    let ids: string[] = [];
    if (isPackage) {
      if (
        !Array.isArray(input.reservationIds) ||
        input.reservationIds.length === 0 ||
        input.reservationIds.length > 32 ||
        input.reservationIds.some((value) => !validUuid(value)) ||
        new Set(input.reservationIds).size !== input.reservationIds.length
      )
        reject('GUARD_INVARIANT', 'Package requires 1–32 unique reservations');
      ids = [...(input.reservationIds as string[])];
      ids.sort();
    }
    await this.store.lockOrder(context, orderId);
    await this.store.lockDocuments(context, [context.request.target.id]);
    const demand = await this.confirmed(context, orderId);
    const customerId = demand.customerId;
    const binding = bind({ orderId, customerId, ...(isPackage ? { reservationIds: ids } : {}) });
    const previous = isPackage
      ? await this.store.package(context, context.request.target.id)
      : await this.store.shipment(context, context.request.target.id);
    if (previous) {
      if (previous.binding !== binding)
        reject('GUARD_CONFLICT', 'Identity already binds another draft');
      reject('GUARD_IDEMPOTENT_DUP', 'Draft already exists');
    }
    if (isPackage) {
      const entries = await this.inventory.inspect(context, orderId, ids);
      if (
        entries.length !== ids.length ||
        new Set(entries.map((value) => value.unitId)).size !== entries.length ||
        entries.some((value) => !ids.includes(value.reservationId))
      )
        throw new TechnicalError('incompatible');
      const value = await this.store.createPackage(context, {
        id: context.request.target.id,
        orderId,
        customerId,
        binding,
        orderBinding: demand.binding,
        state: 'DRAFT',
        entries: frozen(
          [...entries].sort((a, b) => a.reservationId.localeCompare(b.reservationId)),
        ),
      });
      return this.decision(value, 'PackageDrafted');
    }
    const value = await this.store.createShipment(context, {
      id: context.request.target.id,
      orderId,
      customerId,
      binding,
      orderBinding: demand.binding,
      state: 'DRAFT',
      entries: [],
    });
    return this.decision(value, 'ShipmentDrafted');
  }
  private async pack(context: ShippingContext): Promise<CommandDecision> {
    const id = context.request.target.id;
    const initial = await this.package(context, id);
    await this.store.lockOrder(context, initial.orderId);
    await this.store.lockDocuments(context, [id]);
    const value = await this.package(context, id);
    await this.confirmed(context, value.orderId, value.orderBinding);
    const packing = context.request.command === 'PackPackage';
    const target = packing ? 'PACKED' : 'UNPACKED';
    if (value.state === target) reject('GUARD_IDEMPOTENT_DUP', 'Package already transitioned');
    if (value.state !== (packing ? 'DRAFT' : 'PACKED'))
      reject('GUARD_STATE', 'Package cannot transition from current state');
    const entries = await this.inventory.inspect(
      context,
      value.orderId,
      value.entries.map((entry) => entry.reservationId),
    );
    if (
      bind([...entries].sort((a, b) => a.reservationId.localeCompare(b.reservationId))) !==
      bind(value.entries)
    )
      reject('GUARD_CONFLICT', 'Package reservation facts changed');
    if (packing) await this.inventory.pack(context, value.orderId, value.entries);
    else await this.inventory.unpack(context, value.orderId, value.entries);
    const updated = await this.store.packageState(context, id, value.state, target);
    if (!updated) throw new TechnicalError('incompatible');
    return this.decision(updated, packing ? 'PackagePacked' : 'PackageUnpacked', value.state);
  }
  private async assign(context: ShippingContext): Promise<CommandDecision> {
    const shipmentId = context.request.payload.shipmentId;
    if (!validUuid(shipmentId) || Object.keys(context.request.payload).length !== 1)
      reject('GUARD_INVARIANT', 'Assignment requires shipment identity');
    const id = context.request.target.id;
    const initial = await this.package(context, id);
    const initialShipment = await this.shipment(context, shipmentId);
    if (initial.orderId !== initialShipment.orderId)
      reject('GUARD_CONFLICT', 'Shipment and package must bind the same order');
    await this.store.lockOrder(context, initial.orderId);
    await this.store.lockDocuments(context, [id, shipmentId]);
    const value = await this.package(context, id);
    const shipment = await this.shipment(context, shipmentId);
    await this.confirmed(context, value.orderId, value.orderBinding);
    if (
      value.orderId !== shipment.orderId ||
      value.customerId !== shipment.customerId ||
      value.orderBinding !== shipment.orderBinding
    )
      reject('GUARD_CONFLICT', 'Shipment order mismatch');
    if (value.state === 'ASSIGNED_TO_SHIPMENT') {
      if (value.shipmentId === shipmentId)
        reject('GUARD_IDEMPOTENT_DUP', 'Package already assigned');
      reject('GUARD_CONFLICT', 'Package belongs to another shipment');
    }
    if (value.state !== 'PACKED' || shipment.state !== 'DRAFT')
      reject('GUARD_STATE', 'Only packed packages can enter draft shipments');
    const updated = await this.store.packageState(
      context,
      id,
      'PACKED',
      'ASSIGNED_TO_SHIPMENT',
      shipmentId,
    );
    if (!updated) throw new TechnicalError('incompatible');
    return this.decision(updated, 'PackageAssigned', 'PACKED');
  }
  private async contents(
    context: ShippingContext,
    value: Shipment,
  ): Promise<readonly ShippingEntry[]> {
    const packages = await this.store.packages(context, value.id);
    if (packages.length === 0 || packages.length > 32)
      reject('GUARD_INVARIANT', 'Shipment requires 1–32 packages');
    const entries = packages.flatMap((item) => [...item.entries]);
    if (
      entries.length === 0 ||
      entries.length > 32 ||
      new Set(entries.map((entry) => entry.unitId)).size !== entries.length
    )
      reject('GUARD_INVARIANT', 'Shipment requires 1–32 distinct complete Units');
    if (
      packages.some(
        (item) =>
          item.state !== 'ASSIGNED_TO_SHIPMENT' ||
          item.orderId !== value.orderId ||
          item.customerId !== value.customerId ||
          item.orderBinding !== value.orderBinding,
      )
    )
      throw new TechnicalError('incompatible');
    return entries.sort((a, b) => a.reservationId.localeCompare(b.reservationId));
  }
  private async advance(context: ShippingContext): Promise<CommandDecision> {
    const id = context.request.target.id;
    const initial = await this.shipment(context, id);
    await this.store.lockOrder(context, initial.orderId);
    const packages = await this.store.packages(context, id);
    await this.store.lockDocuments(context, [id, ...packages.map((value) => value.id)]);
    const value = await this.shipment(context, id);
    const demand = await this.confirmed(context, value.orderId, value.orderBinding);
    const map = {
      MarkShipmentReady: ['DRAFT', 'READY', 'ShipmentReady'],
      StartLoading: ['READY', 'LOADING', 'ShipmentLoading'],
      DispatchShipment: ['LOADING', 'DISPATCHED', 'ShipmentDispatched'],
    } as const;
    const transition = map[context.request.command as keyof typeof map];
    if (!transition) reject('GUARD_INVARIANT', 'Unsupported shipment transition');
    const [from, to, event] = transition;
    if (value.state === to) reject('GUARD_IDEMPOTENT_DUP', 'Shipment already transitioned');
    if (value.state !== from)
      reject('GUARD_STATE', 'Shipment cannot transition from current state');
    const entries = await this.contents(context, value);
    const inspected = await this.inventory.inspect(
      context,
      value.orderId,
      entries.map((entry) => entry.reservationId),
    );
    if (
      bind([...inspected].sort((a, b) => a.reservationId.localeCompare(b.reservationId))) !==
      bind(entries)
    )
      reject('GUARD_CONFLICT', 'Shipment reservation facts changed');
    if (to === 'READY' || to === 'DISPATCHED') {
      for (const itemId of new Set(entries.map((entry) => entry.itemId))) {
        const item = demand.items.find((item) => item.id === itemId);
        if (!item) reject('GUARD_CONFLICT', 'Shipment line is not confirmed demand');
        const total =
          quantity(await this.store.shippedKg(context, value.orderId, itemId)) +
          entries
            .filter((entry) => entry.itemId === itemId)
            .reduce((sum, entry) => sum + quantity(entry.kg), 0n);
        const required = quantity(item.demandedKg);
        if (total > required || (!item.allowPartialShipment && total !== required))
          reject(
            'GUARD_INVARIANT',
            'Shipment must respect remaining demand and line partial permission',
          );
      }
      if (to === 'DISPATCHED') await this.inventory.dispatch(context, value.orderId, id, entries);
    }
    const updated = await this.store.shipmentState(
      context,
      id,
      from,
      to,
      to === 'DISPATCHED' ? entries : undefined,
    );
    if (!updated) throw new TechnicalError('incompatible');
    return this.decision(updated, event, from);
  }
  async getPackage(
    supplied: ShippingContext,
    id: string,
  ): Promise<Omit<ShippingPackage, 'binding' | 'orderBinding'> | undefined> {
    const context = snapshot(supplied);
    if (!validUuid(id)) reject('GUARD_INVARIANT', 'Invalid package identity');
    await this.authorize(context, context.actor.customerScope ?? '');
    const value = await this.store.package(context, id);
    return value ? this.publicRecord(value) : undefined;
  }
  async getShipment(
    supplied: ShippingContext,
    id: string,
  ): Promise<Omit<Shipment, 'binding' | 'orderBinding'> | undefined> {
    const context = snapshot(supplied);
    if (!validUuid(id)) reject('GUARD_INVARIANT', 'Invalid shipment identity');
    await this.authorize(context, context.actor.customerScope ?? '');
    const value = await this.store.shipment(context, id);
    return value ? this.publicRecord(value) : undefined;
  }
}
