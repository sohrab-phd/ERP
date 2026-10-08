import { Buffer } from 'node:buffer';
import {
  BusinessRejection,
  TechnicalError,
  canonicalJson,
  freezeJson,
  isJsonObject,
  parseBoundedJson,
  validUnicode,
  validUuid,
  validIdempotencyKey,
  validateContext,
  type CommandContract,
  type CommandDecision,
  type CommandRequest,
  type ExecutionContext,
  type GuardFamily,
  type JsonObject,
  type JsonValue,
  type TransactionContext,
} from '@navard/shared-kernel';
import {
  salesTypes,
  type SalesType,
  type SalesContext,
  type SalesItem,
  type SalesOrder,
  type FulfillmentAssessment,
  type SalesStore,
  type SalesPolicy,
  type InventorySalesPort,
  type StockSelection,
  type StockView,
  type ReservationDemandView,
  type ReservationCompetitor,
} from './contracts.js';

const commands = [
  'DraftSalesOrder',
  'SubmitSalesOrder',
  'DraftFulfillmentAssessment',
  'RecordFulfillmentStock',
  'ConfirmSalesOrder',
] as const;
const itemNames = ['id', 'type', 'description', 'demandedKg', 'allowPartialShipment'];
function reject(family: GuardFamily, message: string): never {
  throw new BusinessRejection({ family, message });
}
function names(object: JsonObject, allowed: readonly string[]): void {
  if (Object.keys(object).some((name) => !allowed.includes(name)))
    reject('GUARD_INVARIANT', 'Unexpected Sales field');
}
function text(value: unknown): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    !validUnicode(value) ||
    /[\u0000-\u001f\u007f]/u.test(value) ||
    Buffer.byteLength(value, 'utf8') > 128
  )
    reject('GUARD_INVARIANT', 'Invalid Sales description');
}
function wholeKg(value: unknown): asserts value is string {
  if (typeof value !== 'string' || !/^[1-9][0-9]{0,19}$/u.test(value) || value.endsWith('\n'))
    reject('GUARD_INVARIANT', 'Demand must be a positive whole-kg string');
}
export function parseSalesOrderInput(payload: JsonObject): {
  customerId: string;
  items: readonly SalesItem[];
} {
  names(payload, ['customerId', 'items']);
  if (
    !validUuid(payload.customerId) ||
    !Array.isArray(payload.items) ||
    payload.items.length === 0 ||
    payload.items.length > 8
  )
    reject('GUARD_INVARIANT', 'Invalid Sales demand');
  const ids = new Set<string>();
  const items: SalesItem[] = [];
  for (const raw of payload.items as readonly JsonValue[]) {
    if (!isJsonObject(raw)) reject('GUARD_INVARIANT', 'Invalid Sales item');
    names(raw, itemNames);
    if (
      !validUuid(raw.id) ||
      ids.has(raw.id) ||
      typeof raw.type !== 'string' ||
      !salesTypes.includes(raw.type as SalesType) ||
      typeof raw.allowPartialShipment !== 'boolean'
    )
      reject('GUARD_INVARIANT', 'Invalid Sales item');
    text(raw.description);
    wholeKg(raw.demandedKg);
    ids.add(raw.id);
    items.push(
      Object.freeze({
        id: raw.id,
        type: raw.type as SalesType,
        description: raw.description,
        demandedKg: raw.demandedKg,
        allowPartialShipment: raw.allowPartialShipment,
      }),
    );
  }
  return Object.freeze({ customerId: payload.customerId, items: Object.freeze(items) });
}
export function parseStockSelections(payload: JsonObject): readonly StockSelection[] {
  names(payload, ['selections']);
  if (
    !Array.isArray(payload.selections) ||
    payload.selections.length === 0 ||
    payload.selections.length > 8
  )
    reject('GUARD_INVARIANT', 'Invalid stock selections');
  const itemIds = new Set<string>();
  const unitIds = new Set<string>();
  const selections: StockSelection[] = [];
  for (const raw of payload.selections as readonly JsonValue[]) {
    if (!isJsonObject(raw)) reject('GUARD_INVARIANT', 'Invalid stock selection');
    names(raw, ['itemId', 'unitIds']);
    if (
      !validUuid(raw.itemId) ||
      itemIds.has(raw.itemId) ||
      !Array.isArray(raw.unitIds) ||
      raw.unitIds.length === 0 ||
      raw.unitIds.length > 16
    )
      reject('GUARD_INVARIANT', 'Invalid stock selection');
    itemIds.add(raw.itemId);
    const selected: string[] = [];
    for (const unitId of raw.unitIds) {
      if (!validUuid(unitId) || unitIds.has(unitId))
        reject('GUARD_INVARIANT', 'Unit cannot cover multiple demand items');
      unitIds.add(unitId);
      selected.push(unitId);
    }
    selections.push(Object.freeze({ itemId: raw.itemId, unitIds: Object.freeze(selected.sort()) }));
  }
  if (unitIds.size > 16) reject('GUARD_INVARIANT', 'Too many selected stock units');
  return Object.freeze(selections.sort((a, b) => a.itemId.localeCompare(b.itemId)));
}
function snapshot(supplied: SalesContext): SalesContext {
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
function binding(value: unknown): string {
  return canonicalJson(value as JsonObject).toString('utf8');
}
function frozen<T>(value: T): T {
  return freezeJson(parseBoundedJson(canonicalJson(value as JsonObject))) as T;
}
function validTime(value: string | undefined): boolean {
  return (
    value !== undefined &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}
/** Compare public Inventory NUMERIC(38,18) quantities exactly; no cross-owner implementation import. */
function scaled(value: string): bigint {
  const match = /^(0|[1-9][0-9]{0,19})(?:\.([0-9]{1,18}))?$/u.exec(value);
  if (!match || match[0] !== value) throw new TechnicalError('incompatible');
  return BigInt(match[1]!) * 10n ** 18n + BigInt((match[2] ?? '').padEnd(18, '0'));
}

export class SalesService {
  constructor(
    private readonly store: SalesStore,
    private readonly inventory: InventorySalesPort,
    private readonly policy: SalesPolicy,
  ) {}
  contracts(): CommandContract[] {
    const scalar = { type: 'scalar' as const };
    const shape: Record<string, CommandContract['payloadShape']> = {
      DraftSalesOrder: {
        customerId: scalar,
        items: {
          type: 'array',
          element: {
            type: 'object',
            fields: Object.fromEntries(itemNames.map((name) => [name, scalar])),
          },
        },
      },
      SubmitSalesOrder: {},
      DraftFulfillmentAssessment: { orderId: scalar },
      RecordFulfillmentStock: {
        selections: {
          type: 'array',
          element: {
            type: 'object',
            fields: { itemId: scalar, unitIds: { type: 'array', element: scalar } },
          },
        },
      },
      ConfirmSalesOrder: { assessmentId: scalar },
    };
    return commands.map((command) => ({
      command,
      version: 1,
      active: true,
      payloadShape: shape[command]!,
      preconditionsShape: {},
      execute: (request, actor, transaction) => this.execute(request, actor, transaction),
      // A foreign customer's document UUID is hidden by owner lookups. Its global
      // identity collision remains a durable, non-disclosing actor rejection.
      constraintRejections:
        command === 'DraftSalesOrder'
          ? {
              sales_order_pkey: () =>
                Promise.resolve({
                  family: 'GUARD_ACTOR' as const,
                  message: 'Sales resource unavailable',
                }),
            }
          : command === 'DraftFulfillmentAssessment'
            ? {
                fulfillment_assessment_pkey: () =>
                  Promise.resolve({
                    family: 'GUARD_ACTOR' as const,
                    message: 'Sales resource unavailable',
                  }),
              }
            : {},
    }));
  }
  private async authorize(context: SalesContext, customerId: string): Promise<void> {
    if (
      context.actor.actorRole !== 'ACT-SALES' ||
      context.actor.temporary === true ||
      !validUuid(context.actor.customerScope) ||
      context.actor.customerScope !== customerId ||
      !(await this.policy.canAccess(context, customerId))
    )
      reject('GUARD_ACTOR', 'Current customer-scoped Sales permission required');
  }
  private async requireOrder(context: SalesContext, id: string): Promise<SalesOrder> {
    const order = await this.store.order(context, id);
    if (!order) reject('GUARD_ACTOR', 'Sales resource unavailable');
    await this.authorize(context, order.customerId);
    return order;
  }
  private async requireAssessment(
    context: SalesContext,
    id: string,
  ): Promise<FulfillmentAssessment> {
    const assessment = await this.store.assessment(context, id);
    if (!assessment) reject('GUARD_ACTOR', 'Sales resource unavailable');
    await this.authorize(context, assessment.customerId);
    return assessment;
  }
  async execute(
    request: CommandRequest,
    actor: ExecutionContext,
    transaction: TransactionContext,
  ): Promise<CommandDecision> {
    const context = snapshot({ request, actor, transaction });
    const admitted = context.request;
    const kind =
      admitted.command === 'DraftFulfillmentAssessment' ||
      admitted.command === 'RecordFulfillmentStock'
        ? 'fulfillment-assessment'
        : 'sales-order';
    if (
      !commands.includes(admitted.command as (typeof commands)[number]) ||
      admitted.contract_version !== 1 ||
      admitted.target.kind !== kind ||
      !validUuid(admitted.target.id) ||
      !validIdempotencyKey(admitted.idempotency_key) ||
      Object.keys(admitted.preconditions).length !== 0
    )
      reject('GUARD_INVARIANT', 'Invalid Sales command');
    await this.authorize(context, context.actor.customerScope ?? '');
    switch (admitted.command) {
      case 'DraftSalesOrder':
        return this.draftOrder(context);
      case 'SubmitSalesOrder':
        return this.submit(context);
      case 'DraftFulfillmentAssessment':
        return this.draftAssessment(context);
      case 'RecordFulfillmentStock':
        return this.recordStock(context);
      case 'ConfirmSalesOrder':
        return this.confirm(context);
      default:
        throw new TechnicalError('incompatible');
    }
  }
  private async draftOrder(context: SalesContext): Promise<CommandDecision> {
    const input = parseSalesOrderInput(context.request.payload);
    await this.authorize(context, input.customerId);
    const id = context.request.target.id;
    const bound = binding({ ...input, commercialTerms: 'NOT_SUPPLIED' });
    await this.store.lockOrder(context, id);
    await this.authorize(context, input.customerId);
    const previous = await this.store.order(context, id);
    if (previous) {
      if (previous.customerId !== input.customerId)
        reject('GUARD_ACTOR', 'Sales resource unavailable');
      if (previous.binding !== bound)
        reject('GUARD_CONFLICT', 'Order identity already binds different demand');
      reject('GUARD_IDEMPOTENT_DUP', 'Sales order already exists');
    }
    const customer = await this.store.customer(context, input.customerId);
    if (!customer || customer.id !== input.customerId)
      reject('GUARD_ACTOR', 'Sales resource unavailable');
    text(customer.displayName);
    await this.store.createOrder(context, {
      id,
      ...input,
      customerName: customer.displayName,
      binding: bound,
      commercialTerms: 'NOT_SUPPLIED',
      state: 'DRAFT',
    });
    return {
      outcome: 'accepted',
      factIdentity: id,
      targetState: 'DRAFT',
      event: 'SalesOrderDrafted',
      data: { orderId: id, customerId: input.customerId, state: 'DRAFT' },
    };
  }
  private async submit(context: SalesContext): Promise<CommandDecision> {
    names(context.request.payload, []);
    const id = context.request.target.id;
    await this.store.lockOrder(context, id);
    await this.authorize(context, context.actor.customerScope!);
    const order = await this.requireOrder(context, id);
    if (order.state === 'SUBMITTED' || order.state === 'CONFIRMED')
      reject('GUARD_IDEMPOTENT_DUP', 'Sales order already submitted');
    if (order.state !== 'DRAFT' || order.items.length === 0)
      reject('GUARD_STATE', 'Order cannot be submitted');
    if (!(await this.store.submitOrder(context, id))) throw new TechnicalError('incompatible');
    return {
      outcome: 'accepted',
      factIdentity: id,
      sourceState: 'DRAFT',
      targetState: 'SUBMITTED',
      event: 'SalesOrderSubmitted',
      data: { orderId: id, customerId: order.customerId, state: 'SUBMITTED' },
    };
  }
  private async draftAssessment(context: SalesContext): Promise<CommandDecision> {
    names(context.request.payload, ['orderId']);
    const orderId = context.request.payload.orderId;
    if (!validUuid(orderId)) reject('GUARD_INVARIANT', 'Invalid assessment order');
    const id = context.request.target.id;
    await this.store.lockOrder(context, orderId);
    await this.store.lockAssessment(context, id);
    await this.authorize(context, context.actor.customerScope!);
    const order = await this.requireOrder(context, orderId);
    const bound = binding({ orderId });
    const previous = await this.store.assessment(context, id);
    if (previous) {
      if (previous.customerId !== order.customerId)
        reject('GUARD_ACTOR', 'Sales resource unavailable');
      if (previous.binding !== bound)
        reject('GUARD_CONFLICT', 'Assessment identity already binds another order');
      reject('GUARD_IDEMPOTENT_DUP', 'Assessment already exists');
    }
    if (order.state !== 'DRAFT' && order.state !== 'SUBMITTED')
      reject('GUARD_STATE', 'Order no longer accepts an assessment');
    await this.store.createAssessment(context, {
      id,
      orderId,
      orderBinding: order.binding,
      customerId: order.customerId,
      binding: bound,
      state: 'DRAFT',
    });
    return {
      outcome: 'accepted',
      factIdentity: id,
      targetState: 'DRAFT',
      event: 'FulfillmentAssessmentDrafted',
      data: { assessmentId: id, orderId, customerId: order.customerId, state: 'DRAFT' },
    };
  }
  private async stockEvidence(
    context: SalesContext,
    order: SalesOrder,
    selections: readonly StockSelection[],
  ): Promise<readonly StockView[]> {
    if (
      selections.length !== order.items.length ||
      selections.some((selection) => !order.items.some((item) => item.id === selection.itemId))
    )
      reject('GUARD_INVARIANT', 'Stock assessment must cover each demand item once');
    const unitIds = selections.flatMap((selection) => [...selection.unitIds]).sort();
    const returned = await this.inventory.readStock(context, unitIds);
    const stock = returned.map((row) =>
      Object.freeze({
        unitId: row.unitId,
        kind: row.kind,
        state: row.state,
        availableKg: row.availableKg,
      }),
    );
    if (
      stock.length !== unitIds.length ||
      new Set(stock.map((row) => row.unitId)).size !== stock.length ||
      stock.some((row) => !unitIds.includes(row.unitId))
    )
      reject('GUARD_INVARIANT', 'Selected stock is unavailable');
    for (const selection of selections) {
      const item = order.items.find((value) => value.id === selection.itemId)!;
      let available = 0n;
      for (const id of selection.unitIds) {
        const row = stock.find((value) => value.unitId === id)!;
        if (row.kind !== item.type || row.state !== 'AVAILABLE')
          reject('GUARD_INVARIANT', 'Selected stock does not match demand');
        const quantity = scaled(row.availableKg);
        if (quantity <= 0n) reject('GUARD_INVARIANT', 'Selected stock has no available kg');
        available += quantity;
      }
      if (available < BigInt(item.demandedKg) * 10n ** 18n)
        reject('GUARD_INVARIANT', 'Insufficient observed stock');
    }
    return Object.freeze(stock.sort((a, b) => a.unitId.localeCompare(b.unitId)));
  }
  private async recordStock(context: SalesContext): Promise<CommandDecision> {
    const selections = parseStockSelections(context.request.payload);
    const id = context.request.target.id;
    const initial = await this.requireAssessment(context, id);
    await this.store.lockOrder(context, initial.orderId);
    await this.store.lockAssessment(context, id);
    await this.authorize(context, initial.customerId);
    const assessment = await this.requireAssessment(context, id);
    const order = await this.requireOrder(context, assessment.orderId);
    if (assessment.state === 'RECORDED') {
      if (binding(assessment.selections) !== binding(selections))
        reject('GUARD_CONFLICT', 'Recorded stock assessment is immutable');
      reject('GUARD_IDEMPOTENT_DUP', 'Stock assessment already recorded');
    }
    if (
      assessment.state !== 'DRAFT' ||
      (order.state !== 'DRAFT' && order.state !== 'SUBMITTED') ||
      assessment.orderBinding !== order.binding
    )
      reject('GUARD_STATE', 'Assessment cannot be recorded');
    const stock = await this.stockEvidence(context, order, selections);
    await this.authorize(context, order.customerId);
    const recorded = await this.store.recordAssessment(context, id, selections, stock);
    if (!recorded || recorded.state !== 'RECORDED' || !validTime(recorded.observedAt))
      throw new TechnicalError('incompatible');
    return {
      outcome: 'accepted',
      factIdentity: id,
      sourceState: 'DRAFT',
      targetState: 'RECORDED',
      event: 'FulfillmentStockRecorded',
      data: {
        assessmentId: id,
        customerId: order.customerId,
        orderId: order.id,
        state: 'RECORDED',
        observedAt: recorded.observedAt!,
      },
    };
  }
  private async confirm(context: SalesContext): Promise<CommandDecision> {
    names(context.request.payload, ['assessmentId']);
    const assessmentId = context.request.payload.assessmentId;
    if (!validUuid(assessmentId)) reject('GUARD_INVARIANT', 'Invalid confirmation assessment');
    const id = context.request.target.id;
    await this.store.lockOrder(context, id);
    await this.store.lockAssessment(context, assessmentId);
    await this.authorize(context, context.actor.customerScope!);
    const order = await this.requireOrder(context, id);
    if (order.state === 'CONFIRMED') {
      if (order.confirmedAssessmentId !== assessmentId)
        reject('GUARD_CONFLICT', 'Order already confirmed against another assessment');
      reject('GUARD_IDEMPOTENT_DUP', 'Order already confirmed');
    }
    if (order.state !== 'SUBMITTED')
      reject('GUARD_STATE', 'Only submitted demand may be confirmed');
    const assessment = await this.requireAssessment(context, assessmentId);
    if (
      assessment.state !== 'RECORDED' ||
      assessment.orderId !== id ||
      assessment.orderBinding !== order.binding ||
      !assessment.selections ||
      !assessment.stock ||
      !validTime(assessment.observedAt)
    )
      reject('GUARD_STATE', 'Matching recorded stock assessment required');
    await this.stockEvidence(context, order, assessment.selections);
    await this.authorize(context, order.customerId);
    const confirmed = await this.store.confirmOrder(context, id, assessmentId);
    if (
      !confirmed ||
      confirmed.state !== 'CONFIRMED' ||
      confirmed.confirmedAssessmentId !== assessmentId ||
      !validTime(confirmed.confirmedAt)
    )
      throw new TechnicalError('incompatible');
    return {
      outcome: 'accepted',
      factIdentity: id,
      sourceState: 'SUBMITTED',
      targetState: 'CONFIRMED',
      event: 'SalesOrderConfirmed',
      data: {
        orderId: id,
        assessmentId,
        customerId: order.customerId,
        state: 'CONFIRMED',
        confirmedAt: confirmed.confirmedAt!,
      },
    };
  }
  /** Inventory calls this read port; no stock mutation or forged customer context. */
  async reservationDemand(
    supplied: SalesContext,
    orderId: string,
    customerId: string,
  ): Promise<ReservationDemandView | undefined> {
    const context = snapshot(supplied);
    if (
      !validUuid(orderId) ||
      !validUuid(customerId) ||
      !this.policy.canReserve ||
      !(await this.policy.canReserve(context, customerId))
    )
      reject('GUARD_ACTOR', 'Reservation demand access denied');
    if (!this.store.reservationOrder || !this.store.reservationAssessment)
      throw new TechnicalError('incompatible');
    const order = await this.store.reservationOrder(context, orderId, customerId);
    if (
      !order ||
      order.state !== 'CONFIRMED' ||
      !order.confirmedAssessmentId ||
      !validTime(order.confirmedAt)
    )
      return undefined;
    const assessment = await this.store.reservationAssessment(
      context,
      order.confirmedAssessmentId,
      customerId,
    );
    if (
      !assessment ||
      assessment.state !== 'RECORDED' ||
      assessment.orderId !== order.id ||
      assessment.orderBinding !== order.binding ||
      !assessment.selections
    )
      throw new TechnicalError('incompatible');
    if (!(await this.policy.canReserve(context, customerId)))
      reject('GUARD_ACTOR', 'Reservation demand access denied');
    return frozen({
      id: order.id,
      customerId: order.customerId,
      binding: order.binding,
      confirmedAt: order.confirmedAt!,
      items: order.items.map(({ id, type, demandedKg }) => ({ id, type, demandedKg })),
      selections: assessment.selections,
    });
  }
  /** Internal minimal contender evidence; never exported through command/query HTTP. Exact PG timestamps remain in SQL. */
  async reservationCompetitors(
    supplied: SalesContext,
    orderId: string,
    customerId: string,
    unitId: string,
  ): Promise<readonly ReservationCompetitor[]> {
    const context = snapshot(supplied);
    if (
      !validUuid(orderId) ||
      !validUuid(customerId) ||
      !validUuid(unitId) ||
      !this.policy.canReserve ||
      !(await this.policy.canReserve(context, customerId))
    )
      reject('GUARD_ACTOR', 'Reservation demand access denied');
    if (!this.store.reservationCompetitors) throw new TechnicalError('incompatible');
    return this.store.reservationCompetitors(context, orderId, customerId, unitId);
  }
  async getOrder(supplied: SalesContext, id: string): Promise<SalesOrder | undefined> {
    const context = snapshot(supplied);
    if (!validUuid(id)) reject('GUARD_INVARIANT', 'Invalid order identity');
    await this.authorize(context, context.actor.customerScope ?? '');
    const order = await this.store.order(context, id);
    if (!order) return undefined;
    await this.authorize(context, order.customerId);
    return frozen(order);
  }
  async getAssessment(
    supplied: SalesContext,
    id: string,
  ): Promise<FulfillmentAssessment | undefined> {
    const context = snapshot(supplied);
    if (!validUuid(id)) reject('GUARD_INVARIANT', 'Invalid assessment identity');
    await this.authorize(context, context.actor.customerScope ?? '');
    const assessment = await this.store.assessment(context, id);
    if (!assessment) return undefined;
    await this.authorize(context, assessment.customerId);
    return frozen(assessment);
  }
}
