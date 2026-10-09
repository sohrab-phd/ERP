import { createHash } from 'node:crypto';
import {
  BusinessRejection,
  TechnicalError,
  canonicalJson,
  validateContext,
  validUuid,
  type GuardRejection,
  type JsonObject,
  type TransactionContext,
} from '@navard/shared-kernel';
import type { InventoryStore, PostingContext, PostingEffect, Unit } from './contracts.js';
import type { InventoryPostingService } from './posting-service.js';
import type { ReservationRequest, ReservationRequestStore } from './reservation.js';
import { Kg } from './quantity.js';

export interface ShipmentInventoryEntry {
  readonly reservationId: string;
  readonly unitId: string;
  readonly itemId: string;
  readonly kg: string;
}
export interface ShippingInventoryPolicy {
  canShip(context: PostingContext, customerId: string): Promise<boolean>;
}
// Keep readonly element types while checking runtime container shape.
function isArray(value: unknown): boolean {
  return Array.isArray(value);
}
interface Admission {
  readonly actor: PostingContext['actor'];
  readonly requestBinding: string;
  readonly orderId: string;
  readonly shipmentId: string;
  readonly entries: readonly ShipmentInventoryEntry[];
}
function reject(
  family: 'GUARD_ACTOR' | 'GUARD_CONFLICT' | 'GUARD_STATE' | 'GUARD_INVARIANT',
  message: string,
): never {
  throw new BusinessRejection({ family, message });
}
/** Distinct stable source-effect identities; a new idempotency key is not a new stock fact. */
export function shipmentEffectId(
  shipmentId: string,
  unitId: string,
  kind: 'RELEASE' | 'STOCK_OUT',
): string {
  const bytes = createHash('sha256')
    .update(canonicalJson({ shipmentId, unitId, kind }))
    .digest()
    .subarray(0, 16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
/** Inventory state/claim ownership port. The Shipping owner keeps package and shipment documents. */
export class InventoryShippingService {
  private readonly admissions = new WeakMap<TransactionContext, Admission>();
  constructor(
    private readonly requests: ReservationRequestStore,
    private readonly inventory: InventoryStore,
    private readonly posting: Pick<InventoryPostingService, 'post'>,
    private readonly policy: ShippingInventoryPolicy,
  ) {}
  private async authorize(context: PostingContext, customerId: string): Promise<void> {
    validateContext(context.actor);
    if (
      context.actor.temporary === true ||
      context.actor.actorRole !== 'ACT-SHIP' ||
      !validUuid(customerId) ||
      context.actor.customerScope !== customerId ||
      !(await this.policy.canShip(context, customerId))
    )
      reject('GUARD_ACTOR', 'Current shipment permission required');
  }
  private identifiers(ids: readonly string[]): readonly string[] {
    if (
      !isArray(ids) ||
      ids.length < 1 ||
      ids.length > 32 ||
      ids.some((id) => !validUuid(id)) ||
      new Set(ids).size !== ids.length
    )
      reject('GUARD_INVARIANT', 'Invalid shipment reservations');
    return Object.freeze([...ids].sort());
  }
  private entrySnapshot(
    entries: readonly ShipmentInventoryEntry[],
  ): readonly ShipmentInventoryEntry[] {
    if (!isArray(entries) || entries.some((entry) => typeof entry !== 'object' || entry === null))
      reject('GUARD_INVARIANT', 'Invalid shipment entries');
    this.identifiers(entries.map((entry) => entry.reservationId));
    if (new Set(entries.map((entry) => entry.unitId)).size !== entries.length)
      reject('GUARD_CONFLICT', 'Repeated shipment unit');
    return Object.freeze(
      entries
        .map((entry) => {
          if (
            !validUuid(entry.unitId) ||
            !validUuid(entry.itemId) ||
            typeof entry.kg !== 'string' ||
            !/^[1-9][0-9]{0,19}$/u.test(entry.kg) ||
            entry.kg.endsWith('\n') ||
            Object.keys(entry).some(
              (key) => !['reservationId', 'unitId', 'itemId', 'kg'].includes(key),
            )
          )
            reject('GUARD_INVARIANT', 'Invalid shipment entry');
          return Object.freeze({
            reservationId: entry.reservationId,
            unitId: entry.unitId,
            itemId: entry.itemId,
            kg: entry.kg,
          });
        })
        .sort((a, b) => a.reservationId.localeCompare(b.reservationId)),
    );
  }
  private async request(
    context: PostingContext,
    orderId: string,
    id: string,
  ): Promise<ReservationRequest> {
    const request = await this.requests.get(context, id);
    if (!request || request.orderId !== orderId)
      reject('GUARD_ACTOR', 'Shipment reservation unavailable');
    await this.authorize(context, request.customerId);
    if (request.state !== 'ACTIVE') reject('GUARD_STATE', 'Shipment requires active reservation');
    return request;
  }
  private async check(
    context: PostingContext,
    orderId: string,
    entry: ShipmentInventoryEntry,
    allowed: readonly Unit['state'][],
  ): Promise<void> {
    const request = await this.request(context, orderId, entry.reservationId);
    if (
      request.unitId !== entry.unitId ||
      request.itemId !== entry.itemId ||
      request.kg !== entry.kg
    )
      reject('GUARD_CONFLICT', 'Shipment reservation binding differs');
    const unit = await this.inventory.unit(context, entry.unitId);
    if (!unit || (unit.customerScope !== '' && unit.customerScope !== request.customerId))
      reject('GUARD_ACTOR', 'Shipment stock unavailable');
    if (!allowed.includes(unit.state)) reject('GUARD_STATE', 'Shipment inventory state differs');
    const claim = await this.inventory.reservation(context, entry.reservationId);
    if (
      !claim ||
      claim.state !== 'ACTIVE' ||
      claim.unitId !== entry.unitId ||
      claim.demandId !== orderId ||
      Kg.parse(claim.kg).compare(Kg.parse(entry.kg)) !== 0
    )
      reject('GUARD_CONFLICT', 'Shipment requires its own active claim');
    const totals = await this.inventory.totals(context, entry.unitId);
    const balance = await this.inventory.balance(context, entry.unitId);
    if (
      !balance ||
      Kg.parse(balance.onHand).compare(Kg.parse(totals.onHand)) !== 0 ||
      Kg.parse(balance.reserved).compare(Kg.parse(totals.reserved)) !== 0
    )
      throw new TechnicalError('incompatible');
    if (
      Kg.parse(totals.onHand).compare(Kg.parse(entry.kg)) !== 0 ||
      Kg.parse(totals.reserved).compare(Kg.parse(entry.kg)) !== 0
    )
      reject('GUARD_INVARIANT', 'Shipment must consume one complete reserved unit');
  }
  private async lock(
    context: PostingContext,
    entries: readonly ShipmentInventoryEntry[],
    shipmentId?: string,
  ): Promise<void> {
    for (const id of this.identifiers(entries.map((entry) => entry.reservationId)))
      await this.requests.lockRequest(context, id);
    await this.inventory.lock(
      context,
      entries.map((entry) => entry.unitId),
      shipmentId === undefined
        ? []
        : entries.flatMap((entry) => [
            shipmentEffectId(shipmentId, entry.unitId, 'RELEASE'),
            shipmentEffectId(shipmentId, entry.unitId, 'STOCK_OUT'),
          ]),
      entries.map((entry) => entry.reservationId),
    );
  }
  async inspect(
    context: PostingContext,
    orderId: string,
    reservationIds: readonly string[],
  ): Promise<readonly ShipmentInventoryEntry[]> {
    const command = context.request.command;
    if (
      ![
        'DraftPackage',
        'PackPackage',
        'UnpackPackage',
        'AssignPackageToShipment',
        'MarkShipmentReady',
        'StartLoading',
        'DispatchShipment',
      ].includes(command) ||
      context.request.contract_version !== 1 ||
      !validUuid(context.request.target.id)
    )
      reject('GUARD_INVARIANT', 'Inventory inspection requires its owning shipping workflow');
    if (!validUuid(orderId)) reject('GUARD_INVARIANT', 'Invalid shipment order');
    await this.authorize(context, context.actor.customerScope ?? '');
    const ids = this.identifiers(reservationIds);
    const entries: ShipmentInventoryEntry[] = [];
    for (const id of ids) {
      const request = await this.request(context, orderId, id);
      entries.push({
        reservationId: id,
        unitId: request.unitId,
        itemId: request.itemId,
        kg: request.kg,
      });
    }
    const frozen = this.entrySnapshot(entries);
    // No unit/effect lock is acquired by inspection. The owner orchestrator already
    // holds its order/document locks, and the mutation rechecks after the full IPS union.
    for (const entry of frozen)
      await this.check(
        context,
        orderId,
        entry,
        ['DraftPackage', 'PackPackage'].includes(command) ? ['RESERVED'] : ['PACKED'],
      );
    return frozen;
  }
  private command(context: PostingContext, command: string, kind: string): void {
    if (
      context.request.command !== command ||
      context.request.contract_version !== 1 ||
      context.request.target.kind !== kind ||
      !validUuid(context.request.target.id)
    )
      reject('GUARD_INVARIANT', 'Inventory shipment operation requires its owner command');
  }
  async pack(
    context: PostingContext,
    orderId: string,
    supplied: readonly ShipmentInventoryEntry[],
  ): Promise<void> {
    this.command(context, 'PackPackage', 'package');
    const entries = this.entrySnapshot(supplied);
    await this.lock(context, entries);
    for (const entry of entries) await this.check(context, orderId, entry, ['RESERVED']);
    for (const entry of entries) await this.inventory.changeState(context, entry.unitId, 'PACKED');
  }
  async unpack(
    context: PostingContext,
    orderId: string,
    supplied: readonly ShipmentInventoryEntry[],
  ): Promise<void> {
    this.command(context, 'UnpackPackage', 'package');
    const entries = this.entrySnapshot(supplied);
    await this.lock(context, entries);
    for (const entry of entries) await this.check(context, orderId, entry, ['PACKED']);
    for (const entry of entries)
      await this.inventory.changeState(context, entry.unitId, 'RESERVED');
  }
  async dispatch(
    context: PostingContext,
    orderId: string,
    shipmentId: string,
    supplied: readonly ShipmentInventoryEntry[],
  ): Promise<void> {
    this.command(context, 'DispatchShipment', 'shipment');
    if (shipmentId !== context.request.target.id || !validUuid(orderId))
      reject('GUARD_CONFLICT', 'Shipment dispatch identity differs');
    const entries = this.entrySnapshot(supplied);
    await this.lock(context, entries, shipmentId);
    for (const entry of entries) await this.check(context, orderId, entry, ['PACKED']);
    if (!this.requests.consume || this.admissions.has(context.transaction))
      throw new TechnicalError('incompatible');
    const admission: Admission = Object.freeze({
      actor: context.actor,
      requestBinding: canonicalJson(context.request as unknown as JsonObject).toString('utf8'),
      orderId,
      shipmentId,
      entries,
    });
    this.admissions.set(context.transaction, admission);
    try {
      const effects: PostingEffect[] = entries.flatMap((entry) => [
        {
          type: 'RELEASE',
          source: {
            factId: shipmentId,
            effectId: shipmentEffectId(shipmentId, entry.unitId, 'RELEASE'),
          },
          unitId: entry.unitId,
          reservationId: entry.reservationId,
          terminal: 'CONSUMED',
        },
        {
          type: 'STOCK_OUT',
          source: {
            factId: shipmentId,
            effectId: shipmentEffectId(shipmentId, entry.unitId, 'STOCK_OUT'),
          },
          unitId: entry.unitId,
          kg: entry.kg,
          nextState: 'SHIPPED',
        },
      ]);
      await this.posting.post(context, effects);
      for (const entry of entries)
        await this.requests.consume(
          context,
          entry.reservationId,
          shipmentId,
          shipmentEffectId(shipmentId, entry.unitId, 'RELEASE'),
          shipmentEffectId(shipmentId, entry.unitId, 'STOCK_OUT'),
        );
    } finally {
      this.admissions.delete(context.transaction);
    }
  }
  private admission(
    context: PostingContext,
    effect: PostingEffect,
    unit: Unit | undefined,
  ): { admitted: Admission; entry: ShipmentInventoryEntry } | undefined {
    const admitted = this.admissions.get(context.transaction);
    if (
      !admitted ||
      admitted.actor !== context.actor ||
      admitted.requestBinding !==
        canonicalJson(context.request as unknown as JsonObject).toString('utf8') ||
      !unit ||
      context.request.command !== 'DispatchShipment' ||
      effect.source.factId !== admitted.shipmentId ||
      effect.unitId !== unit.id
    )
      return undefined;
    const entry = admitted.entries.find((value) => value.unitId === effect.unitId);
    if (
      !entry ||
      effect.source.effectId !==
        shipmentEffectId(
          admitted.shipmentId,
          entry.unitId,
          effect.type === 'RELEASE' ? 'RELEASE' : 'STOCK_OUT',
        )
    )
      return undefined;
    if (
      effect.type === 'RELEASE'
        ? effect.reservationId !== entry.reservationId || effect.terminal !== 'CONSUMED'
        : effect.type !== 'STOCK_OUT' ||
          effect.kg !== entry.kg ||
          effect.nextState !== 'SHIPPED' ||
          effect.originalLedgerId !== undefined
    )
      return undefined;
    return { admitted, entry };
  }
  async visibleForEffect(
    context: PostingContext,
    effect: PostingEffect,
    unit: Unit,
  ): Promise<boolean> {
    const binding = this.admission(context, effect, unit);
    if (
      !binding ||
      (unit.customerScope !== '' && unit.customerScope !== context.actor.customerScope)
    )
      return false;
    await this.authorize(context, context.actor.customerScope ?? '');
    return true;
  }
  async validateEffect(
    context: PostingContext,
    effect: PostingEffect,
    unit: Unit | undefined,
  ): Promise<GuardRejection | undefined> {
    const binding = this.admission(context, effect, unit);
    if (!binding)
      return {
        family: 'GUARD_CONFLICT',
        message: 'Inventory effect is outside the admitted shipment',
      };
    await this.authorize(context, context.actor.customerScope ?? '');
    const { admitted, entry } = binding;
    const request = await this.request(context, admitted.orderId, entry.reservationId);
    const claim = await this.inventory.reservation(context, entry.reservationId);
    if (
      !unit ||
      unit.state !== 'PACKED' ||
      request.unitId !== entry.unitId ||
      request.itemId !== entry.itemId ||
      request.kg !== entry.kg ||
      !claim ||
      claim.unitId !== entry.unitId ||
      claim.demandId !== admitted.orderId ||
      Kg.parse(claim.kg).compare(Kg.parse(entry.kg)) !== 0 ||
      claim.state !== (effect.type === 'RELEASE' ? 'ACTIVE' : 'CONSUMED')
    )
      return { family: 'GUARD_CONFLICT', message: 'Shipment claim or stock changed' };
    return undefined;
  }
}
