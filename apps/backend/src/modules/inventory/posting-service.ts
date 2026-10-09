import { Buffer } from 'node:buffer';
import { randomUUID } from 'node:crypto';
import {
  BusinessRejection,
  TechnicalError,
  canonicalJson,
  freezeJson,
  parseBoundedJson,
  validateContext,
  validUnicode,
  validUuid,
  type GuardFamily,
  type JsonObject,
} from '@navard/shared-kernel';
import type {
  Availability,
  InventoryStore,
  LedgerRow,
  PostingContext,
  PostingEffect,
  PostingPolicy,
  Quantities,
  Reservation,
  Unit,
  UnitState,
} from './contracts.js';
import { Kg } from './quantity.js';

function reject(family: GuardFamily, message: string, openItem?: string): never {
  throw new BusinessRejection({ family, message, ...(openItem ? { openItem } : {}) });
}

function uuid(value: unknown): asserts value is string {
  if (!validUuid(value)) reject('GUARD_INVARIANT', 'Invalid inventory identity');
}

function text(value: unknown, maximum: number, empty = false): asserts value is string {
  if (
    typeof value !== 'string' ||
    (!empty && value.length === 0) ||
    !validUnicode(value) ||
    /[\u0000-\u001f\u007f]/u.test(value) ||
    Buffer.byteLength(value, 'utf8') > maximum
  )
    reject('GUARD_INVARIANT', 'Invalid inventory metadata');
}

function exactNames(value: object, allowed: readonly string[]): void {
  if (Object.keys(value).some((key) => !allowed.includes(key)))
    reject('GUARD_INVARIANT', 'Unexpected inventory effect field');
}

function snapshotContext(context: PostingContext): PostingContext {
  validateContext(context.actor);
  const actor =
    Object.isFrozen(context.actor) && Object.isFrozen(context.actor.principal)
      ? context.actor
      : Object.freeze({
          ...context.actor,
          principal: Object.freeze({ ...context.actor.principal }),
        });
  const request = context.request;
  const payload = freezeJson(parseBoundedJson(canonicalJson(request.payload))) as JsonObject;
  const preconditions = freezeJson(
    parseBoundedJson(canonicalJson(request.preconditions)),
  ) as JsonObject;
  return Object.freeze({
    actor,
    transaction: context.transaction,
    request: Object.freeze({
      command: request.command,
      contract_version: request.contract_version,
      idempotency_key: request.idempotency_key,
      target: Object.freeze({ kind: request.target.kind, id: request.target.id }),
      payload,
      preconditions,
    }),
  });
}

/** Copy only admitted fields before the first asynchronous boundary. */
function snapshotEffect(effect: PostingEffect): PostingEffect {
  if (
    typeof effect !== 'object' ||
    effect === null ||
    !effect.source ||
    typeof effect.source !== 'object'
  )
    reject('GUARD_INVARIANT', 'Invalid inventory effect');
  exactNames(effect.source, ['factId', 'effectId']);
  uuid(effect.source.factId);
  uuid(effect.source.effectId);
  uuid(effect.unitId);
  const source = Object.freeze({ factId: effect.source.factId, effectId: effect.source.effectId });
  const base = { source, unitId: effect.unitId };
  if (effect.type === 'RELEASE') {
    exactNames(effect, ['type', 'source', 'unitId', 'reservationId', 'terminal']);
    uuid(effect.reservationId);
    if (!['RELEASED', 'CONSUMED'].includes(effect.terminal))
      reject('GUARD_INVARIANT', 'Invalid reservation terminal');
    return Object.freeze({
      ...base,
      type: 'RELEASE',
      reservationId: effect.reservationId,
      terminal: effect.terminal,
    });
  }
  const kg = Kg.parse(effect.kg);
  if (kg.compare(Kg.zero()) <= 0) reject('GUARD_INVARIANT', 'Posting quantity must be positive kg');
  if (effect.type === 'STOCK_IN') {
    exactNames(effect, ['type', 'source', 'unitId', 'kg', 'create']);
    if (effect.create !== undefined) {
      const create = effect.create;
      if (typeof create !== 'object' || create === null)
        reject('GUARD_INVARIANT', 'Invalid inventory unit metadata');
      exactNames(create, ['lotId', 'kind', 'locationId', 'customerScope']);
      uuid(create.lotId);
      uuid(create.locationId);
      text(create.kind, 128);
      text(create.customerScope, 256, true);
      return Object.freeze({
        ...base,
        type: 'STOCK_IN',
        kg: kg.toString(),
        create: Object.freeze({
          lotId: create.lotId,
          kind: create.kind,
          locationId: create.locationId,
          customerScope: create.customerScope,
        }),
      });
    }
    return Object.freeze({ ...base, type: 'STOCK_IN', kg: kg.toString() });
  }
  if (effect.type === 'STOCK_OUT') {
    exactNames(effect, ['type', 'source', 'unitId', 'kg', 'nextState', 'originalLedgerId']);
    if (!['PARTIALLY_CONSUMED', 'CONSUMED', 'SHIPPED'].includes(effect.nextState))
      reject('GUARD_INVARIANT', 'Invalid inventory destiny');
    if (effect.originalLedgerId !== undefined) uuid(effect.originalLedgerId);
    return Object.freeze({
      ...base,
      type: 'STOCK_OUT',
      kg: kg.toString(),
      nextState: effect.nextState,
      ...(effect.originalLedgerId !== undefined
        ? { originalLedgerId: effect.originalLedgerId }
        : {}),
    });
  }
  if (effect.type === 'RESERVE') {
    exactNames(effect, ['type', 'source', 'unitId', 'kg', 'reservationId', 'demandId']);
    uuid(effect.reservationId);
    uuid(effect.demandId);
    return Object.freeze({
      ...base,
      type: 'RESERVE',
      kg: kg.toString(),
      reservationId: effect.reservationId,
      demandId: effect.demandId,
    });
  }
  return reject('GUARD_INVARIANT', 'Unknown inventory effect');
}

function parsedStored(value: string): Kg {
  try {
    return Kg.parse(value);
  } catch {
    throw new TechnicalError('incompatible');
  }
}

function quantities(onHand: Kg, reserved: Kg): Quantities {
  return { onHand: onHand.toString(), reserved: reserved.toString() };
}

function validTotals(onHand: Kg, reserved: Kg): boolean {
  return (
    onHand.compare(Kg.zero()) >= 0 &&
    reserved.compare(Kg.zero()) >= 0 &&
    reserved.compare(onHand) <= 0
  );
}

/** The owner orchestrator and command envelope own transaction control and rollback. */
export class InventoryPostingService {
  constructor(
    private readonly store: InventoryStore,
    private readonly policy: PostingPolicy,
  ) {}

  private async authorize(context: PostingContext): Promise<void> {
    validateContext(context.actor);
    if (!(await this.policy.authorize(context)))
      reject('GUARD_ACTOR', 'Inventory posting authority denied');
  }

  private visible(context: PostingContext, unit: Unit): void {
    if (
      context.actor.customerScope !== undefined &&
      context.actor.customerScope !== unit.customerScope
    )
      reject('GUARD_ACTOR', 'Inventory resource access denied');
  }

  private async sourceQuantities(
    context: PostingContext,
    unit: Unit,
    compareProjection: boolean,
  ): Promise<Quantities> {
    const totals = await this.store.totals(context, unit.id);
    const onHand = parsedStored(totals.onHand),
      reserved = parsedStored(totals.reserved);
    if (!validTotals(onHand, reserved)) throw new TechnicalError('incompatible');
    const claim = await this.store.activeReservation(context, unit.id);
    if (
      (claim === undefined
        ? reserved.compare(Kg.zero()) !== 0
        : claim.state !== 'ACTIVE' ||
          claim.unitId !== unit.id ||
          parsedStored(claim.kg).compare(Kg.zero()) <= 0 ||
          parsedStored(claim.kg).compare(reserved) !== 0) ||
      (unit.state === 'RESERVED' && claim === undefined) ||
      (unit.state === 'AVAILABLE' && claim !== undefined)
    )
      throw new TechnicalError('incompatible');
    if (compareProjection) {
      const balance = await this.store.balance(context, unit.id);
      if (
        !balance ||
        parsedStored(balance.onHand).compare(onHand) !== 0 ||
        parsedStored(balance.reserved).compare(reserved) !== 0
      )
        throw new TechnicalError('incompatible');
    }
    return quantities(onHand, reserved);
  }

  async post(
    suppliedContext: PostingContext,
    supplied: readonly PostingEffect[],
  ): Promise<LedgerRow[]> {
    const context = snapshotContext(suppliedContext);
    if (!Array.isArray(supplied) || supplied.length === 0 || supplied.length > 128)
      reject('GUARD_INVARIANT', 'Invalid inventory posting batch');
    const effects = Object.freeze(supplied.map(snapshotEffect));
    const identities = effects.map((effect) => effect.source.effectId);
    if (new Set(identities).size !== effects.length)
      reject('GUARD_CONFLICT', 'Repeated inventory effect in batch');
    await this.authorize(context);
    await this.store.lock(
      context,
      [...new Set(effects.map((effect) => effect.unitId))].sort(),
      [...identities].sort(),
      [
        ...new Set(
          effects.flatMap((effect) =>
            effect.type === 'RESERVE' || effect.type === 'RELEASE' ? [effect.reservationId] : [],
          ),
        ),
      ].sort(),
    );
    await this.authorize(context);
    const rows: LedgerRow[] = [];
    for (const effect of effects) {
      let unit = await this.store.unit(context, effect.unitId);
      if (
        unit &&
        !(
          context.request.command === 'ActivateReservation' &&
          effect.type === 'RESERVE' &&
          unit.customerScope === ''
        ) &&
        !(
          context.request.command === 'DispatchShipment' &&
          unit.customerScope === '' &&
          this.policy.visibleForEffect &&
          (await this.policy.visibleForEffect(context, effect, unit))
        )
      )
        this.visible(context, unit);
      const binding = canonicalJson({
        command: context.request.command,
        version: context.request.contract_version,
        effect: effect as unknown as JsonObject,
      }).toString('utf8');
      const duplicate = await this.store.findEffect(context, effect.source);
      if (duplicate)
        reject(
          // DATA-TX-001 retains CONFLICT for a new-key duplicate production completion.
          context.request.command !== 'CompleteProductionOperation' && duplicate.binding === binding
            ? 'GUARD_IDEMPOTENT_DUP'
            : 'GUARD_CONFLICT',
          'Inventory source effect already posted',
        );
      const eligibility = await this.policy.validate(context, effect, unit);
      if (eligibility) throw new BusinessRejection(eligibility);
      let initial: Quantities;
      if (!unit) {
        if (effect.type !== 'STOCK_IN' || !effect.create)
          reject('GUARD_STATE', 'Inventory unit does not exist');
        unit = { id: effect.unitId, ...effect.create, state: 'AVAILABLE' };
        this.visible(context, unit);
        await this.store.createUnit(context, unit);
        initial = { onHand: '0', reserved: '0' };
      } else {
        initial = await this.sourceQuantities(context, unit, true);
      }
      let onHandDelta = Kg.zero(),
        reservedDelta = Kg.zero();
      let nextState: UnitState = unit.state;
      let newClaim: Reservation | undefined;
      let closedClaim: Extract<PostingEffect, { type: 'RELEASE' }> | undefined;
      if (effect.type === 'STOCK_IN') {
        if (unit.state !== 'AVAILABLE')
          reject('GUARD_STATE', 'Inventory unit is not available for stock-in');
        if (
          effect.create &&
          (effect.create.lotId !== unit.lotId ||
            effect.create.kind !== unit.kind ||
            effect.create.locationId !== unit.locationId ||
            effect.create.customerScope !== unit.customerScope)
        )
          reject('GUARD_CONFLICT', 'Inventory unit metadata differs');
        onHandDelta = Kg.parse(effect.kg);
      } else if (effect.type === 'STOCK_OUT') {
        if (parsedStored(initial.reserved).compare(Kg.zero()) !== 0)
          reject('GUARD_CONFLICT', 'Active claim must be consumed or released before stock exit');
        if (context.request.command === 'CompleteProductionOperation') {
          if (
            !['ISSUED_TO_PRODUCTION', 'PARTIALLY_CONSUMED'].includes(unit.state) ||
            effect.nextState === 'SHIPPED'
          )
            reject('GUARD_STATE', 'Production stock effect requires issued inventory');
        } else if (context.request.command === 'DispatchShipment') {
          if (unit.state !== 'PACKED' || effect.nextState !== 'SHIPPED')
            reject('GUARD_STATE', 'Shipment stock effect requires packed inventory');
        } else reject('GUARD_INVARIANT', 'Stock-out requires its owning atomic workflow');
        if (effect.originalLedgerId !== undefined) {
          const original = await this.store.ledger(context, effect.originalLedgerId);
          if (
            !original ||
            original.unitId !== unit.id ||
            parsedStored(original.onHandDelta).compare(Kg.zero()) === 0
          )
            reject('GUARD_CONFLICT', 'Invalid original inventory movement reference');
        }
        onHandDelta = Kg.zero().subtract(Kg.parse(effect.kg));
        nextState = effect.nextState;
      } else if (effect.type === 'RESERVE') {
        if (context.request.command !== 'ActivateReservation')
          reject('GUARD_INVARIANT', 'Reservation activation requires its owning atomic workflow');
        if (unit.state !== 'AVAILABLE')
          reject('GUARD_CONFLICT', 'Inventory unit cannot be reserved');
        if (
          !this.policy.reservationPriority ||
          !(await this.policy.reservationPriority(context, effect, unit))
        )
          reject(
            'GUARD_OPEN_POLICY',
            'Confirmed demand and reservation priority required',
            'OQ-008',
          );
        if (await this.store.activeReservation(context, unit.id))
          reject('GUARD_CONFLICT', 'Inventory unit already has an active reservation');
        if (await this.store.reservation(context, effect.reservationId))
          reject('GUARD_CONFLICT', 'Reservation identity already exists');
        reservedDelta = Kg.parse(effect.kg);
        newClaim = {
          id: effect.reservationId,
          unitId: unit.id,
          demandId: effect.demandId,
          kg: reservedDelta.toString(),
          state: 'ACTIVE',
        };
        nextState = 'RESERVED';
      } else {
        const claim = await this.store.reservation(context, effect.reservationId);
        if (!claim || claim.unitId !== unit.id || claim.state !== 'ACTIVE')
          reject('GUARD_STATE', 'Reservation is not active on this unit');
        if (
          effect.terminal === 'CONSUMED' &&
          !['IssueAllocatedMaterial', 'DispatchShipment'].includes(context.request.command)
        )
          reject(
            'GUARD_INVARIANT',
            'Reservation consumption requires its owning issue or shipment workflow',
          );
        reservedDelta = Kg.zero().subtract(parsedStored(claim.kg));
        closedClaim = effect;
        if (unit.state === 'RESERVED' && effect.terminal === 'RELEASED') nextState = 'AVAILABLE';
        if (unit.state === 'RESERVED' && effect.terminal === 'CONSUMED')
          reject(
            'GUARD_STATE',
            'Reservation consumption requires an issued or packed inventory destiny',
          );
      }
      const onHand = parsedStored(initial.onHand).add(onHandDelta);
      const reserved = parsedStored(initial.reserved).add(reservedDelta);
      if (!validTotals(onHand, reserved))
        reject('GUARD_INVARIANT', 'Inventory quantity cannot become negative or over-reserved');
      if (
        effect.type === 'STOCK_OUT' &&
        (nextState === 'PARTIALLY_CONSUMED'
          ? onHand.compare(Kg.zero()) <= 0
          : onHand.compare(Kg.zero()) !== 0)
      )
        reject('GUARD_INVARIANT', 'Inventory terminal state does not match remaining kg');
      if (newClaim) await this.store.insertReservation(context, newClaim);
      if (closedClaim)
        await this.store.closeReservation(context, closedClaim.reservationId, closedClaim.terminal);
      const row: LedgerRow = {
        id: randomUUID(),
        source: effect.source,
        unitId: unit.id,
        binding,
        onHandDelta: onHandDelta.toString(),
        reservedDelta: reservedDelta.toString(),
        ...(effect.type === 'STOCK_OUT' && effect.originalLedgerId !== undefined
          ? { originalLedgerId: effect.originalLedgerId }
          : {}),
      };
      await this.store.append(context, row);
      await this.store.project(context, unit.id, quantities(onHand, reserved));
      if (nextState !== unit.state) await this.store.changeState(context, unit.id, nextState);
      rows.push(row);
    }
    return rows;
  }

  /** Current availability evidence only; this read never allocates or promises stock. */
  async availability(
    suppliedContext: PostingContext,
    supplied: readonly string[],
  ): Promise<readonly Availability[]> {
    const context = snapshotContext(suppliedContext);
    if (!Array.isArray(supplied) || supplied.length === 0 || supplied.length > 16)
      reject('GUARD_INVARIANT', 'Invalid availability batch');
    const unitIds = [...(supplied as readonly string[])];
    unitIds.forEach(uuid);
    if (new Set(unitIds).size !== unitIds.length)
      reject('GUARD_INVARIANT', 'Repeated availability unit');
    const authorize = async (unit?: Unit): Promise<void> => {
      if (!this.policy.availability || !(await this.policy.availability(context, unit)))
        reject('GUARD_ACTOR', 'Inventory availability access denied');
    };
    await authorize();
    await this.store.lock(context, [...unitIds].sort(), []);
    await authorize();
    const results: Availability[] = [];
    for (const unitId of unitIds) {
      const unit = await this.store.unit(context, unitId);
      if (!unit) reject('GUARD_STATE', 'Inventory unit does not exist');
      // Organization stock is visible for an explicitly authorized demand assessment.
      // Customer-owned stock always retains its exact isolation boundary.
      if (unit.customerScope !== '' && unit.customerScope !== context.actor.customerScope)
        reject('GUARD_ACTOR', 'Inventory resource access denied');
      await authorize(unit);
      const totals = await this.sourceQuantities(context, unit, true);
      const availableKg =
        unit.state === 'AVAILABLE'
          ? parsedStored(totals.onHand).subtract(parsedStored(totals.reserved)).toString()
          : '0';
      results.push(Object.freeze({ unitId, kind: unit.kind, state: unit.state, availableKg }));
    }
    return Object.freeze(results);
  }
  async snapshot(suppliedContext: PostingContext, unitId: string): Promise<Quantities> {
    const context = snapshotContext(suppliedContext);
    uuid(unitId);
    await this.authorize(context);
    await this.store.lock(context, [unitId], []);
    await this.authorize(context);
    const unit = await this.store.unit(context, unitId);
    if (!unit) reject('GUARD_STATE', 'Inventory unit does not exist');
    this.visible(context, unit);
    if (!(await this.policy.maintain(context, unit)))
      reject('GUARD_ACTOR', 'Inventory resource access denied');
    return this.sourceQuantities(context, unit, true);
  }

  async rebuild(
    suppliedContext: PostingContext,
    supplied: readonly string[],
  ): Promise<Quantities[]> {
    const context = snapshotContext(suppliedContext);
    if (!Array.isArray(supplied) || supplied.length === 0 || supplied.length > 128)
      reject('GUARD_INVARIANT', 'Invalid inventory reconstruction batch');
    const unitIds = [...(supplied as readonly string[])];
    unitIds.forEach(uuid);
    if (new Set(unitIds).size !== unitIds.length)
      reject('GUARD_INVARIANT', 'Repeated reconstruction unit');
    await this.authorize(context);
    await this.store.lock(context, [...unitIds].sort(), []);
    await this.authorize(context);
    const results: Quantities[] = [];
    for (const unitId of unitIds) {
      const unit = await this.store.unit(context, unitId);
      if (!unit) reject('GUARD_STATE', 'Inventory unit does not exist');
      this.visible(context, unit);
      if (!(await this.policy.maintain(context, unit)))
        reject('GUARD_ACTOR', 'Inventory reconstruction access denied');
      const totals = await this.sourceQuantities(context, unit, false);
      await this.store.project(context, unitId, totals);
      results.push(totals);
    }
    return results;
  }
}
