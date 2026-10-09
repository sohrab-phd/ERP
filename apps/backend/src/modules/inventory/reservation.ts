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
  type GuardRejection,
} from '@navard/shared-kernel';
import type { PostingContext, PostingEffect, InventoryStore, Unit } from './contracts.js';
import type { InventoryPostingService } from './posting-service.js';
import { Kg } from './quantity.js';

export interface ReservationDemand {
  id: string;
  customerId: string;
  binding: string;
  confirmedAt: string;
  items: readonly { id: string; type: string; demandedKg: string }[];
  selections: readonly { itemId: string; unitIds: readonly string[] }[];
}
export interface ReservationDemandPort {
  demand(
    context: PostingContext,
    orderId: string,
    customerId: string,
  ): Promise<ReservationDemand | undefined>;
  competitors(
    context: PostingContext,
    demand: ReservationDemand,
    unitId: string,
  ): Promise<readonly ReservationCompetitor[]>;
}
export interface ReservationCompetitor {
  orderId: string;
  itemId: string;
  demandedKg: string;
}
export interface ReservationRequest {
  id: string;
  orderId: string;
  itemId: string;
  unitId: string;
  customerId: string;
  kg: string;
  binding: string;
  orderBinding: string;
  confirmedAt: string;
  state: 'REQUESTED' | 'ACTIVE' | 'CONSUMED';
  dispatchId?: string;
  consumedAt?: string;
  requestedAt?: string;
  activatedAt?: string;
}
export interface ReservationRequestStore {
  lockOrder(context: PostingContext, id: string): Promise<void>;
  lockRequest(context: PostingContext, id: string): Promise<void>;
  get(context: PostingContext, id: string): Promise<ReservationRequest | undefined>;
  aggregate(context: PostingContext, orderId: string, itemId: string): Promise<string>;
  activeKg(context: PostingContext, orderId: string, itemId: string): Promise<string>;
  create(context: PostingContext, request: ReservationRequest): Promise<ReservationRequest>;
  activate(context: PostingContext, id: string): Promise<ReservationRequest | undefined>;
  consume?(
    context: PostingContext,
    id: string,
    shipmentId: string,
    releaseEffectId: string,
    outEffectId: string,
  ): Promise<void>;
}
export interface ReservationPolicy {
  canRequest(context: PostingContext, customerId: string): Promise<boolean>;
  canActivate(context: PostingContext, customerId: string): Promise<boolean>;
  canRead(context: PostingContext, customerId: string): Promise<boolean>;
}
const commands = ['RequestReservation', 'ActivateReservation'] as const;
function reject(family: GuardFamily, message: string): never {
  throw new BusinessRejection({ family, message });
}
function snapshot(supplied: PostingContext): PostingContext {
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
      payload: freezeJson(parseBoundedJson(canonicalJson(supplied.request.payload))) as JsonObject,
      preconditions: freezeJson(
        parseBoundedJson(canonicalJson(supplied.request.preconditions)),
      ) as JsonObject,
    }),
  });
}
function whole(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !/^[1-9][0-9]{0,19}$/u.test(value) || value.endsWith('\n'))
    reject('GUARD_INVARIANT', 'Reservation requires positive whole kg');
}
function time(value: string | undefined): boolean {
  return (
    value !== undefined &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}
function bind(value: JsonObject): string {
  return canonicalJson(value).toString('utf8');
}

/** Inventory owns requested intent; only IPS creates the ACTIVE quantity effect. */
export class ReservationService {
  constructor(
    private readonly store: ReservationRequestStore,
    private readonly inventory: InventoryStore,
    private readonly posting: Pick<InventoryPostingService, 'post'>,
    private readonly demand: ReservationDemandPort,
    private readonly policy: ReservationPolicy,
  ) {}
  contracts(): CommandContract[] {
    const scalar = { type: 'scalar' as const };
    return commands.map((command) => ({
      command,
      version: 1,
      active: true,
      payloadShape:
        command === 'RequestReservation'
          ? { orderId: scalar, itemId: scalar, unitId: scalar, kg: scalar }
          : {},
      preconditionsShape: {},
      execute: (request, actor, transaction) => this.execute(request, actor, transaction),
      constraintRejections:
        command === 'RequestReservation'
          ? {
              reservation_request_pkey: () =>
                Promise.resolve({
                  family: 'GUARD_ACTOR' as const,
                  message: 'Reservation unavailable',
                }),
            }
          : {},
    }));
  }
  private async authorize(
    context: PostingContext,
    customerId: string,
    operation: keyof ReservationPolicy,
  ): Promise<void> {
    if (
      !validUuid(customerId) ||
      context.actor.temporary === true ||
      (operation === 'canRequest' &&
        (context.actor.actorRole !== 'ACT-SALES' || context.actor.customerScope !== customerId)) ||
      (operation === 'canActivate' &&
        !(
          (context.actor.actorRole === 'ACT-WH' && context.actor.customerScope === undefined) ||
          (context.actor.actorRole === 'ACT-SALES' && context.actor.customerScope === customerId)
        )) ||
      (operation === 'canRead' &&
        (context.actor.actorRole !== 'ACT-SALES' || context.actor.customerScope !== customerId)) ||
      !(await this.policy[operation](context, customerId))
    )
      reject('GUARD_ACTOR', 'Current reservation permission required');
  }
  private async require(
    context: PostingContext,
    id: string,
    operation: keyof ReservationPolicy,
  ): Promise<ReservationRequest> {
    const request = await this.store.get(context, id);
    if (!request) reject('GUARD_ACTOR', 'Reservation unavailable');
    await this.authorize(context, request.customerId, operation);
    return request;
  }
  private async confirmed(
    context: PostingContext,
    request: Pick<ReservationRequest, 'orderId' | 'itemId' | 'unitId' | 'customerId' | 'kg'>,
  ): Promise<ReservationDemand> {
    const demand = await this.demand.demand(context, request.orderId, request.customerId);
    if (!demand) reject('GUARD_ACTOR', 'Confirmed demand unavailable');
    if (
      demand.id !== request.orderId ||
      demand.customerId !== request.customerId ||
      !time(demand.confirmedAt)
    )
      throw new TechnicalError('incompatible');
    const item = demand.items.find((value) => value.id === request.itemId);
    if (
      !item ||
      !demand.selections.some(
        (value) => value.itemId === request.itemId && value.unitIds.includes(request.unitId),
      )
    )
      reject('GUARD_INVARIANT', 'Reservation must bind confirmed selected demand');
    whole(item.demandedKg);
    if (Kg.parse(request.kg).compare(Kg.parse(item.demandedKg)) > 0)
      reject('GUARD_INVARIANT', 'Reservation exceeds demand');
    return demand;
  }
  private async lock(
    context: PostingContext,
    request: Pick<ReservationRequest, 'id' | 'unitId'>,
  ): Promise<void> {
    // Pre-acquire precisely the full IPS lock set in its actual bigint order. No
    // unit-only prelock followed by earlier effect locks, which could deadlock.
    await this.inventory.lock(context, [request.unitId], [request.id], [request.id]);
  }
  async execute(
    request: CommandRequest,
    actor: ExecutionContext,
    transaction: TransactionContext,
  ): Promise<CommandDecision> {
    const context = snapshot({ request, actor, transaction });
    const admitted = context.request;
    if (
      !commands.includes(admitted.command as (typeof commands)[number]) ||
      admitted.contract_version !== 1 ||
      admitted.target.kind !== 'reservation' ||
      !validUuid(admitted.target.id) ||
      !validIdempotencyKey(admitted.idempotency_key) ||
      Object.keys(admitted.preconditions).length !== 0
    )
      reject('GUARD_INVARIANT', 'Invalid reservation command');
    return admitted.command === 'RequestReservation'
      ? this.request(context)
      : this.activate(context);
  }
  private async request(context: PostingContext): Promise<CommandDecision> {
    const payload = context.request.payload;
    if (
      Object.keys(payload).some((key) => !['orderId', 'itemId', 'unitId', 'kg'].includes(key)) ||
      !validUuid(payload.orderId) ||
      !validUuid(payload.itemId) ||
      !validUuid(payload.unitId)
    )
      reject('GUARD_INVARIANT', 'Invalid reservation request');
    whole(payload.kg);
    const customerId = context.actor.customerScope ?? '';
    await this.authorize(context, customerId, 'canRequest');
    const input = {
      orderId: payload.orderId,
      itemId: payload.itemId,
      unitId: payload.unitId,
      kg: payload.kg,
    };
    const id = context.request.target.id;
    await this.store.lockOrder(context, input.orderId);
    await this.store.lockRequest(context, id);
    await this.authorize(context, customerId, 'canRequest');
    const bound = bind({ ...input, customerId });
    const previous = await this.store.get(context, id);
    if (previous) {
      if (previous.customerId !== customerId) reject('GUARD_ACTOR', 'Reservation unavailable');
      if (previous.binding !== bound)
        reject('GUARD_CONFLICT', 'Reservation identity already binds another request');
      reject('GUARD_IDEMPOTENT_DUP', 'Reservation already requested');
    }
    const demand = await this.confirmed(context, { ...input, customerId });
    await this.lock(context, { id, unitId: input.unitId });
    await this.authorize(context, customerId, 'canRequest');
    const unit = await this.inventory.unit(context, input.unitId);
    if (!unit || (unit.customerScope !== '' && unit.customerScope !== customerId))
      reject('GUARD_ACTOR', 'Reservation stock unavailable');
    const item = demand.items.find((value) => value.id === input.itemId)!;
    if (unit.kind !== item.type)
      reject('GUARD_INVARIANT', 'Reservation stock does not match demand');
    const total = Kg.parse(await this.store.aggregate(context, input.orderId, input.itemId)).add(
      Kg.parse(input.kg),
    );
    if (total.compare(Kg.parse(item.demandedKg)) > 0)
      reject('GUARD_INVARIANT', 'Requested kg exceeds remaining demand');
    const created = await this.store.create(context, {
      id,
      ...input,
      customerId,
      binding: bound,
      orderBinding: demand.binding,
      confirmedAt: demand.confirmedAt,
      state: 'REQUESTED',
    });
    if (created.state !== 'REQUESTED' || !time(created.requestedAt))
      throw new TechnicalError('incompatible');
    return {
      outcome: 'accepted',
      factIdentity: id,
      targetState: 'REQUESTED',
      event: 'ReservationRequested',
      data: {
        reservationId: id,
        customerId,
        orderId: input.orderId,
        itemId: input.itemId,
        unitId: input.unitId,
        kg: input.kg,
        state: 'REQUESTED',
      },
    };
  }
  private async activate(context: PostingContext): Promise<CommandDecision> {
    if (Object.keys(context.request.payload).length !== 0)
      reject('GUARD_INVARIANT', 'Activation has no payload');
    const id = context.request.target.id;
    const initial = await this.require(context, id, 'canActivate');
    await this.store.lockOrder(context, initial.orderId);
    await this.store.lockRequest(context, id);
    const request = await this.require(context, id, 'canActivate');
    if (request.state === 'ACTIVE') reject('GUARD_IDEMPOTENT_DUP', 'Reservation already active');
    if (request.state !== 'REQUESTED') reject('GUARD_STATE', 'Reservation is not requested');
    const demand = await this.confirmed(context, request);
    if (demand.binding !== request.orderBinding || demand.confirmedAt !== request.confirmedAt)
      reject('GUARD_CONFLICT', 'Confirmed demand binding changed');
    await this.lock(context, request);
    await this.authorize(context, request.customerId, 'canActivate');
    await this.posting.post(context, [
      {
        type: 'RESERVE',
        source: { factId: id, effectId: id },
        unitId: request.unitId,
        kg: request.kg,
        reservationId: id,
        demandId: request.orderId,
      },
    ]);
    const activated = await this.store.activate(context, id);
    if (!activated || activated.state !== 'ACTIVE' || !time(activated.activatedAt))
      throw new TechnicalError('incompatible');
    return {
      outcome: 'accepted',
      factIdentity: id,
      sourceState: 'REQUESTED',
      targetState: 'ACTIVE',
      event: 'ReservationActivated',
      data: {
        reservationId: id,
        customerId: request.customerId,
        orderId: request.orderId,
        itemId: request.itemId,
        unitId: request.unitId,
        kg: request.kg,
        state: 'ACTIVE',
      },
    };
  }
  /** The composition root uses these checks for IPS; caller context is never stripped. */
  async validateEffect(
    context: PostingContext,
    effect: PostingEffect,
    unit: Unit | undefined,
  ): Promise<GuardRejection | undefined> {
    if (
      effect.type !== 'RESERVE' ||
      context.request.command !== 'ActivateReservation' ||
      context.request.target.kind !== 'reservation' ||
      context.request.target.id !== effect.reservationId
    )
      return { family: 'GUARD_INVARIANT', message: 'Reservation requires its owning activation' };
    const request = await this.require(context, effect.reservationId, 'canActivate');
    if (
      !unit ||
      request.state !== 'REQUESTED' ||
      request.unitId !== unit.id ||
      (unit.customerScope !== '' && unit.customerScope !== request.customerId) ||
      effect.source.factId !== request.id ||
      effect.source.effectId !== request.id ||
      effect.unitId !== request.unitId ||
      effect.demandId !== request.orderId ||
      effect.kg !== request.kg
    )
      return {
        family: 'GUARD_CONFLICT',
        message: 'Reservation effect does not match requested intent',
      };
    const demand = await this.confirmed(context, request);
    if (
      request.orderBinding !== demand.binding ||
      request.confirmedAt !== demand.confirmedAt ||
      unit.kind !== demand.items.find((item) => item.id === request.itemId)!.type
    )
      return { family: 'GUARD_CONFLICT', message: 'Reservation demand changed' };
    return undefined;
  }
  async priorityForEffect(
    context: PostingContext,
    effect: Extract<PostingEffect, { type: 'RESERVE' }>,
    unit: Unit,
  ): Promise<boolean> {
    if (await this.validateEffect(context, effect, unit)) return false;
    const request = await this.require(context, effect.reservationId, 'canActivate');
    const demand = await this.confirmed(context, request);
    const competitors = await this.demand.competitors(context, demand, unit.id);
    for (const competitor of competitors) {
      if (!validUuid(competitor.orderId) || !validUuid(competitor.itemId))
        throw new TechnicalError('incompatible');
      whole(competitor.demandedKg);
      // Historical assessment is not an allocation. Real ACTIVE claims and
      // verified consumed shipment facts satisfy demand; REQUESTED intent never does.
      const covered = Kg.parse(
        await this.store.activeKg(context, competitor.orderId, competitor.itemId),
      );
      if (covered.compare(Kg.parse(competitor.demandedKg)) < 0)
        reject('GUARD_CONFLICT', 'Earlier confirmed demand has reservation priority');
    }
    return true;
  }
  async get(supplied: PostingContext, id: string): Promise<ReservationRequest | undefined> {
    const context = snapshot(supplied);
    if (!validUuid(id)) reject('GUARD_INVARIANT', 'Invalid reservation identity');
    // A foreign or missing ID has the same query response; do not disclose it.
    const request = await this.store.get(context, id);
    if (!request) return undefined;
    await this.authorize(context, request.customerId, 'canRead');
    return freezeJson(
      parseBoundedJson(canonicalJson(request as unknown as JsonObject)),
    ) as unknown as ReservationRequest;
  }
}
