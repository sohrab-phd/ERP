import { validateLineageCapacity } from './lineage.js';
import { randomUUID } from 'node:crypto';
import {
  BusinessRejection,
  TechnicalError,
  canonicalJson,
  freezeJson,
  parseBoundedJson,
  isJsonObject,
  validateContext,
  validUuid,
  validIdempotencyKey,
  validUnicode,
  type JsonObject,
  type JsonValue,
  type GuardFamily,
  type CommandContract,
  type CommandDecision,
  type CommandRequest,
  type ExecutionContext,
  type TransactionContext,
  type FieldShape,
} from '@navard/shared-kernel';
import {
  stations,
  type Station,
  type ProductionContext,
  type ProductionOrder,
  type ProductionOperation,
  type MaterialAllocation,
  type ProductionFact,
  type ProductionStore,
  type ProductionInventoryPort,
  type ProductionDemandPort,
  type ProductionPolicy,
  type ProductionBatch,
  type ProductionOutput,
} from './contracts.js';
const orderCommands = [
  'DraftProductionOrder',
  'PlanProductionOrder',
  'ReleaseProductionOrder',
  'StartProductionOrder',
  'CompleteOperationPartial',
  'CompleteProductionOrder',
  'CloseProductionOrder',
];
const allocationCommands = [
  'PlanMaterialAllocation',
  'AssignMaterialAllocation',
  'IssueAllocatedMaterial',
  'ReleaseMaterialAllocation',
];
const operationCommands = [
  'StartProductionOperation',
  'CompleteProductionOperation',
  'RecordStationEntry',
  'RecordStationReferral',
  'DeclareStationCompletion',
];
export const productionCommands = [...orderCommands, ...allocationCommands, ...operationCommands];
const commands = productionCommands;
export function productionTarget(
  command: string,
): 'production-order' | 'production-operation' | 'material-allocation' {
  if (!commands.includes(command)) reject('GUARD_INVARIANT', 'Unknown Production command');
  return allocationCommands.includes(command)
    ? 'material-allocation'
    : operationCommands.includes(command)
      ? 'production-operation'
      : 'production-order';
}
export function productionRole(command: string): 'ACT-PLAN' | 'ACT-OP' {
  if (!commands.includes(command)) reject('GUARD_INVARIANT', 'Unknown Production command');
  return [
    'StartProductionOrder',
    'CompleteOperationPartial',
    'CompleteProductionOrder',
    'StartProductionOperation',
    'CompleteProductionOperation',
    'RecordStationEntry',
    'DeclareStationCompletion',
  ].includes(command)
    ? 'ACT-OP'
    : 'ACT-PLAN';
}
const scale = 10n ** 18n;
function reject(family: GuardFamily, message: string): never {
  throw new BusinessRejection({ family, message });
}
function exact(value: JsonObject, names: readonly string[]): void {
  if (Object.keys(value).some((key) => !names.includes(key)))
    reject('GUARD_INVARIANT', 'Unexpected Production field');
}
function id(value: unknown): asserts value is string {
  if (!validUuid(value)) reject('GUARD_INVARIANT', 'Invalid Production identity');
}
function kg(value: unknown): bigint {
  if (
    typeof value !== 'string' ||
    !/^(0|[1-9][0-9]{0,19})(?:\.([0-9]{1,18}))?$/u.test(value) ||
    value.endsWith('\n')
  )
    reject('GUARD_INVARIANT', 'Invalid exact kg');
  const [whole, fraction = ''] = value.split('.');
  const n = BigInt(whole!) * scale + BigInt(fraction.padEnd(18, '0'));
  if (n <= 0n) reject('GUARD_INVARIANT', 'Production kg must be positive');
  return n;
}
function exactKg(value: unknown): string {
  const amount = kg(value);
  const fraction = (amount % scale).toString().padStart(18, '0').replace(/0+$/u, '');
  return (amount / scale).toString() + (fraction ? '.' + fraction : '');
}
function frozen<T>(value: T): T {
  return freezeJson(parseBoundedJson(canonicalJson(value as JsonObject))) as T;
}
function text(value: unknown): asserts value is string {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    !validUnicode(value) ||
    /[\u0000-\u001f\u007f]/u.test(value) ||
    Buffer.byteLength(value) > 128
  )
    reject('GUARD_INVARIANT', 'Invalid material kind');
}
function list(value: JsonValue | undefined, max = 32): readonly JsonValue[] {
  if (!Array.isArray(value) || value.length > max)
    reject('GUARD_INVARIANT', 'Invalid bounded Production list');
  return value as readonly JsonValue[];
}
function object(value: JsonValue): JsonObject {
  if (!isJsonObject(value)) reject('GUARD_INVARIANT', 'Invalid Production record');
  return value;
}
function ids(value: JsonValue | undefined): readonly string[] {
  const result = list(value).map((value) => {
    id(value);
    return value;
  });
  if (new Set(result).size !== result.length)
    reject('GUARD_INVARIANT', 'Duplicate Production identity');
  return result;
}
function snapshot(supplied: ProductionContext): ProductionContext {
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
    request: frozen(supplied.request),
  });
}
function publicRecord(
  value: ProductionOrder | ProductionOperation | MaterialAllocation,
): JsonObject {
  const record = Object.fromEntries(
    Object.entries(value).filter(([name]) => name !== 'orderBinding'),
  );
  return frozen<JsonObject>(record);
}
interface Admission {
  actor: ExecutionContext;
  request: string;
  orderId: string;
  unitIds?: readonly string[];
  batch?: ProductionBatch;
}
interface ReleaseAdmission {
  readonly actor: ExecutionContext;
  readonly request: string;
  readonly salesOrderId: string;
  readonly productionOrderId: string;
  readonly itemId: string;
}
/** Production source/lifecycle owner. Inventory alone performs identity and quantity mutations. */
export class ProductionService {
  private readonly admissions = new WeakMap<TransactionContext, Admission>();
  private readonly releases = new WeakMap<TransactionContext, ReleaseAdmission>();
  constructor(
    private readonly store: ProductionStore,
    private readonly inventory: ProductionInventoryPort,
    private readonly demand: ProductionDemandPort,
    private readonly policy: ProductionPolicy,
  ) {}
  contracts(): CommandContract[] {
    const scalar = { type: 'scalar' as const };
    const arr = { type: 'array' as const, element: scalar };
    const record = (fields: Record<string, FieldShape>) => ({
      type: 'array' as const,
      element: { type: 'object' as const, fields },
    });
    const shapes: Record<string, Record<string, FieldShape>> = {
      DraftProductionOrder: { salesOrderId: scalar, itemId: scalar },
      PlanProductionOrder: { route: record({ id: scalar, station: scalar }) },
      PlanMaterialAllocation: { productionOrderId: scalar, kg: scalar },
      AssignMaterialAllocation: { unitId: scalar },
      RecordStationReferral: { nextOperationId: scalar },
      CompleteProductionOperation: {
        inputs: record({ unitId: scalar, kg: scalar }),
        outputs: record({
          unitId: scalar,
          kg: scalar,
          kind: scalar,
          locationId: scalar,
          sourceUnitIds: arr,
        }),
        residuals: record({
          unitId: scalar,
          kg: scalar,
          kind: scalar,
          locationId: scalar,
          sourceUnitId: scalar,
        }),
        scraps: record({ kg: scalar, sourceUnitId: scalar }),
        finalizeUnitIds: arr,
      },
    };
    return commands.map((command) => ({
      command,
      version: 1,
      active: true,
      payloadShape: shapes[command] ?? {},
      preconditionsShape: {},
      execute: (r, a, t) => this.execute(r, a, t),
      constraintRejections: {
        production_order_pkey: () =>
          Promise.resolve({
            family: 'GUARD_ACTOR' as const,
            message: 'Production order unavailable',
          }),
        operation_pkey: () =>
          Promise.resolve({
            family: 'GUARD_CONFLICT' as const,
            message: 'Operation identity already exists',
          }),
        allocation_pkey: () =>
          Promise.resolve({
            family: 'GUARD_CONFLICT' as const,
            message: 'Allocation identity already exists',
          }),
      },
    }));
  }
  private async authorize(ctx: ProductionContext, role?: 'ACT-PLAN' | 'ACT-OP'): Promise<void> {
    if (
      ctx.actor.temporary === true ||
      !validUuid(ctx.actor.customerScope) ||
      !['ACT-PLAN', 'ACT-OP'].includes(ctx.actor.actorRole) ||
      (role && ctx.actor.actorRole !== role) ||
      !(await this.policy.current(ctx))
    )
      reject('GUARD_ACTOR', 'Current individual Production permission required');
  }
  private async order(ctx: ProductionContext, idValue: string): Promise<ProductionOrder> {
    const value = await this.store.order(ctx, idValue);
    if (!value || value.customerId !== ctx.actor.customerScope)
      reject('GUARD_ACTOR', 'Production order unavailable');
    await this.authorize(ctx);
    return value;
  }
  private async lock(ctx: ProductionContext, initial: ProductionOrder): Promise<ProductionOrder> {
    await this.store.lockSalesOrder(ctx, initial.salesOrderId);
    await this.store.lockOrder(ctx, initial.id);
    const value = await this.order(ctx, initial.id);
    const demand = await this.demand.demand(ctx, value.salesOrderId, value.customerId);
    if (
      !demand ||
      demand.customerId !== value.customerId ||
      demand.binding !== value.orderBinding ||
      !demand.items.some((item) => item.id === value.itemId)
    )
      reject('GUARD_CONFLICT', 'Confirmed MAKE demand changed');
    return value;
  }
  private result(
    ctx: ProductionContext,
    value: ProductionOrder | ProductionOperation | MaterialAllocation,
    event: string,
    from?: string,
  ): CommandDecision {
    return {
      outcome: 'accepted',
      factIdentity: value.id,
      ...(from ? { sourceState: from } : {}),
      targetState: value.state,
      event,
      data: frozen({ ...publicRecord(value), customerId: ctx.actor.customerScope! }),
    };
  }
  private async writeFact(
    ctx: ProductionContext,
    order: ProductionOrder,
    op: ProductionOperation,
    kind: ProductionFact['kind'],
    data: JsonObject,
  ): Promise<string> {
    const factId = randomUUID();
    await this.store.fact(ctx, {
      id: factId,
      productionOrderId: order.id,
      operationId: op.id,
      kind,
      data: frozen(data),
      actor: { ...ctx.actor.principal, role: ctx.actor.actorRole },
    });
    return factId;
  }
  async execute(
    request: CommandRequest,
    actor: ExecutionContext,
    transaction: TransactionContext,
  ): Promise<CommandDecision> {
    const ctx = snapshot({ request, actor, transaction }),
      r = ctx.request;
    const kind = allocationCommands.includes(r.command)
      ? 'material-allocation'
      : operationCommands.includes(r.command)
        ? 'production-operation'
        : 'production-order';
    if (
      !commands.includes(r.command) ||
      r.contract_version !== 1 ||
      r.target.kind !== kind ||
      !validUuid(r.target.id) ||
      !validIdempotencyKey(r.idempotency_key) ||
      Object.keys(r.preconditions).length
    )
      reject('GUARD_INVARIANT', 'Invalid Production command');
    await this.authorize(ctx);
    if (r.command === 'DraftProductionOrder') return this.draft(ctx);
    if (r.command === 'PlanMaterialAllocation') return this.planAllocation(ctx);
    if (allocationCommands.includes(r.command)) return this.allocation(ctx);
    if (operationCommands.includes(r.command)) return this.operation(ctx);
    return this.advanceOrder(ctx);
  }
  private async draft(ctx: ProductionContext): Promise<CommandDecision> {
    await this.authorize(ctx, 'ACT-PLAN');
    exact(ctx.request.payload, ['salesOrderId', 'itemId']);
    const { salesOrderId, itemId } = ctx.request.payload;
    id(salesOrderId);
    id(itemId);
    await this.store.lockSalesOrder(ctx, salesOrderId);
    await this.store.lockOrder(ctx, ctx.request.target.id);
    await this.authorize(ctx, 'ACT-PLAN');
    const demand = await this.demand.demand(ctx, salesOrderId, ctx.actor.customerScope!);
    if (!demand || !demand.items.some((item) => item.id === itemId))
      reject('GUARD_ACTOR', 'Confirmed MAKE demand unavailable');
    const previous = await this.store.order(ctx, ctx.request.target.id);
    if (previous)
      reject(
        previous.salesOrderId === salesOrderId && previous.itemId === itemId
          ? 'GUARD_IDEMPOTENT_DUP'
          : 'GUARD_CONFLICT',
        'Production identity already exists',
      );
    const value: ProductionOrder = {
      id: ctx.request.target.id,
      salesOrderId,
      itemId,
      customerId: ctx.actor.customerScope!,
      orderBinding: demand.binding,
      state: 'DRAFT',
      routeVersion: 0,
      route: [],
    };
    await this.store.saveOrder(ctx, value, true);
    return this.result(ctx, value, 'ProductionOrderDrafted');
  }
  private async advanceOrder(ctx: ProductionContext): Promise<CommandDecision> {
    const c = ctx.request.command;
    await this.authorize(
      ctx,
      ['StartProductionOrder', 'CompleteOperationPartial'].includes(c)
        ? 'ACT-OP'
        : c === 'CompleteProductionOrder'
          ? undefined
          : 'ACT-PLAN',
    );
    const value = await this.lock(ctx, await this.order(ctx, ctx.request.target.id));
    const from = value.state;
    if (c === 'PlanProductionOrder') {
      exact(ctx.request.payload, ['route']);
      if (!['DRAFT', 'PLANNED'].includes(from))
        reject('GUARD_STATE', 'Only unreleased order can be planned');
      const route = list(ctx.request.payload.route, 16).map((raw) => {
        const row = object(raw);
        exact(row, ['id', 'station']);
        id(row.id);
        if (typeof row.station !== 'string' || !stations.includes(row.station as Station))
          reject('GUARD_INVARIANT', 'Unknown factory Station');
        return { id: row.id, station: row.station as Station };
      });
      if (!route.length || new Set(route.map((row) => row.id)).size !== route.length)
        reject('GUARD_INVARIANT', 'Route requires unique operation identities');
      if (canonicalJson(route).equals(canonicalJson(value.route)))
        reject('GUARD_IDEMPOTENT_DUP', 'Route already planned');
      for (const row of route)
        if (await this.store.operation(ctx, row.id))
          reject('GUARD_CONFLICT', 'Route revision requires fresh operation identities');
      const updated: ProductionOrder = {
        ...value,
        routeVersion: value.routeVersion + 1,
        route,
        state: 'PLANNED',
      };
      await this.store.saveOrder(ctx, updated);
      for (const [index, row] of route.entries())
        await this.store.saveOperation(
          ctx,
          {
            id: row.id,
            productionOrderId: value.id,
            index,
            station: row.station,
            state: 'PLANNED',
          },
          true,
        );
      return this.result(ctx, updated, 'ProductionOrderPlanned', from);
    }
    exact(ctx.request.payload, []);
    const operations = await this.store.operations(ctx, value.id);
    let state: ProductionOrder['state'];
    let event: string;
    if (c === 'ReleaseProductionOrder') {
      if (from === 'RELEASED') reject('GUARD_IDEMPOTENT_DUP', 'Order already released');
      if (from !== 'PLANNED' || !value.route.length)
        reject('GUARD_STATE', 'Planned route required');
      if (this.releases.has(ctx.transaction)) throw new TechnicalError('incompatible');
      this.releases.set(
        ctx.transaction,
        Object.freeze({
          actor: ctx.actor,
          request: canonicalJson(ctx.request as unknown as JsonObject).toString('utf8'),
          salesOrderId: value.salesOrderId,
          productionOrderId: value.id,
          itemId: value.itemId,
        }),
      );
      try {
        await this.demand.start(ctx, value.salesOrderId, value.id, value.itemId);
      } finally {
        this.releases.delete(ctx.transaction);
      }
      await this.authorize(ctx, 'ACT-PLAN');
      state = 'RELEASED';
      event = 'ProductionOrderReleased';
    } else if (c === 'StartProductionOrder') {
      if (from === 'IN_PROGRESS') reject('GUARD_IDEMPOTENT_DUP', 'Order already started');
      if (from !== 'RELEASED') reject('GUARD_STATE', 'Released order required');
      state = 'IN_PROGRESS';
      event = 'ProductionOrderInProgress';
    } else if (c === 'CompleteOperationPartial') {
      if (from === 'PARTIALLY_COMPLETED')
        reject('GUARD_IDEMPOTENT_DUP', 'Order already partially completed');
      if (
        from !== 'IN_PROGRESS' ||
        !operations.some((op) => op.state === 'COMPLETED') ||
        operations.every((op) => op.state === 'COMPLETED')
      )
        reject('GUARD_STATE', 'Completed and remaining operations required');
      state = 'PARTIALLY_COMPLETED';
      event = 'ProductionOrderPartiallyCompleted';
    } else if (c === 'CompleteProductionOrder') {
      if (from === 'COMPLETED') reject('GUARD_IDEMPOTENT_DUP', 'Order already completed');
      if (
        !['IN_PROGRESS', 'PARTIALLY_COMPLETED'].includes(from) ||
        !operations.length ||
        operations.some((op) => op.state !== 'COMPLETED')
      )
        reject('GUARD_STATE', 'All route operations must complete');
      state = 'COMPLETED';
      event = 'ProductionOrderCompleted';
    } else if (c === 'CloseProductionOrder') {
      if (from === 'CLOSED') reject('GUARD_IDEMPOTENT_DUP', 'Order already closed');
      if (from !== 'COMPLETED') reject('GUARD_STATE', 'Completed order required');
      state = 'CLOSED';
      event = 'ProductionOrderClosed';
    } else throw new TechnicalError('incompatible');
    const updated = { ...value, state };
    await this.store.saveOrder(ctx, updated);
    return this.result(ctx, updated, event, from);
  }
  private async planAllocation(ctx: ProductionContext): Promise<CommandDecision> {
    await this.authorize(ctx, 'ACT-PLAN');
    exact(ctx.request.payload, ['productionOrderId', 'kg']);
    const { productionOrderId, kg: amount } = ctx.request.payload;
    id(productionOrderId);
    kg(amount);
    const order = await this.lock(ctx, await this.order(ctx, productionOrderId));
    if (!['PLANNED', 'RELEASED', 'IN_PROGRESS', 'PARTIALLY_COMPLETED'].includes(order.state))
      reject('GUARD_STATE', 'Production plan required');
    const old = await this.store.allocation(ctx, ctx.request.target.id);
    if (old)
      reject(
        old.productionOrderId === order.id && old.kg === amount
          ? 'GUARD_IDEMPOTENT_DUP'
          : 'GUARD_CONFLICT',
        'Allocation identity already exists',
      );
    const value: MaterialAllocation = {
      id: ctx.request.target.id,
      productionOrderId: order.id,
      kg: amount as string,
      state: 'PLANNED',
    };
    await this.store.saveAllocation(ctx, value, true);
    return this.result(ctx, value, 'MaterialAllocationPlanned');
  }
  private async allocation(ctx: ProductionContext): Promise<CommandDecision> {
    await this.authorize(ctx, 'ACT-PLAN');
    const initial = await this.store.allocation(ctx, ctx.request.target.id);
    if (!initial) reject('GUARD_ACTOR', 'Allocation unavailable');
    const order = await this.lock(ctx, await this.order(ctx, initial.productionOrderId));
    const value = await this.store.allocation(ctx, initial.id);
    if (!value) throw new TechnicalError('incompatible');
    const c = ctx.request.command;
    let updated: MaterialAllocation;
    if (c === 'AssignMaterialAllocation') {
      exact(ctx.request.payload, ['unitId']);
      const unitId = ctx.request.payload.unitId;
      id(unitId);
      if (value.state === 'ASSIGNED')
        reject(
          value.unitId === unitId ? 'GUARD_IDEMPOTENT_DUP' : 'GUARD_CONFLICT',
          'Allocation already assigned',
        );
      if (
        value.state !== 'PLANNED' ||
        !['PLANNED', 'RELEASED', 'IN_PROGRESS', 'PARTIALLY_COMPLETED'].includes(order.state)
      )
        reject('GUARD_STATE', 'Unissued planned allocation required');
      const [material] = await this.inventory.inspect(ctx, order.id, [unitId]);
      if (!material || material.state !== 'AVAILABLE' || kg(value.kg) > kg(material.kg))
        reject('GUARD_INVARIANT', 'Allocation exceeds available material');
      updated = { ...value, unitId, state: 'ASSIGNED' };
    } else if (c === 'IssueAllocatedMaterial') {
      exact(ctx.request.payload, []);
      if (value.state === 'ISSUED') reject('GUARD_IDEMPOTENT_DUP', 'Allocation already issued');
      if (
        value.state !== 'ASSIGNED' ||
        !value.unitId ||
        !['RELEASED', 'IN_PROGRESS', 'PARTIALLY_COMPLETED'].includes(order.state)
      )
        reject('GUARD_STATE', 'Released assigned allocation required');
      const entry: Admission = {
        actor: ctx.actor,
        request: canonicalJson(ctx.request as unknown as JsonObject).toString('utf8'),
        orderId: order.id,
        unitIds: [value.unitId],
      };
      this.admissions.set(ctx.transaction, entry);
      try {
        const [material] = await this.inventory.issue(ctx, order.id, [value.unitId]);
        if (!material || kg(value.kg) > kg(material.kg))
          reject('GUARD_INVARIANT', 'Allocation exceeds issued stock');
      } finally {
        this.admissions.delete(ctx.transaction);
      }
      updated = { ...value, state: 'ISSUED' };
    } else {
      exact(ctx.request.payload, []);
      if (value.state === 'RELEASED') reject('GUARD_IDEMPOTENT_DUP', 'Allocation already released');
      if (!['PLANNED', 'ASSIGNED'].includes(value.state))
        reject('GUARD_STATE', 'Issued allocation requires later compensation');
      updated = { ...value, state: 'RELEASED' };
    }
    await this.store.saveAllocation(ctx, updated);
    return this.result(
      ctx,
      updated,
      c === 'AssignMaterialAllocation'
        ? 'MaterialAllocationAssigned'
        : c === 'IssueAllocatedMaterial'
          ? 'MaterialAllocationIssued'
          : 'MaterialAllocationReleased',
      value.state,
    );
  }
  private async operation(ctx: ProductionContext): Promise<CommandDecision> {
    const c = ctx.request.command;
    await this.authorize(ctx, c === 'RecordStationReferral' ? 'ACT-PLAN' : 'ACT-OP');
    const initial = await this.store.operation(ctx, ctx.request.target.id);
    if (!initial) reject('GUARD_ACTOR', 'Operation unavailable');
    const order = await this.lock(ctx, await this.order(ctx, initial.productionOrderId));
    const value = await this.store.operation(ctx, initial.id);
    if (!value || !order.route.some((row) => row.id === value.id))
      reject('GUARD_STATE', 'Operation is not in current route');
    const operations = await this.store.operations(ctx, order.id);
    if (['RecordStationEntry', 'RecordStationReferral', 'DeclareStationCompletion'].includes(c)) {
      if (
        !['RELEASED', 'IN_PROGRESS', 'PARTIALLY_COMPLETED'].includes(order.state) ||
        (value.state === 'COMPLETED' && c !== 'RecordStationReferral')
      )
        reject('GUARD_STATE', 'Live Station activity required');
      if (c === 'RecordStationReferral') {
        exact(ctx.request.payload, ['nextOperationId']);
        const next = ctx.request.payload.nextOperationId;
        id(next);
        if (!operations.some((op) => op.id === next && op.index === value.index + 1))
          reject('GUARD_INVARIANT', 'Referral requires next route Station');
      } else exact(ctx.request.payload, []);
      const kind =
        c === 'RecordStationEntry'
          ? 'ENTRY'
          : c === 'RecordStationReferral'
            ? 'REFERRAL'
            : 'DECLARATION';
      await this.writeFact(ctx, order, value, kind, ctx.request.payload);
      return this.result(
        ctx,
        value,
        c === 'RecordStationEntry'
          ? 'StationEntryRecorded'
          : c === 'RecordStationReferral'
            ? 'StationReferralRecorded'
            : 'StationCompletionDeclared',
      );
    }
    if (c === 'StartProductionOperation') {
      exact(ctx.request.payload, []);
      if (value.state === 'IN_PROGRESS')
        reject('GUARD_IDEMPOTENT_DUP', 'Operation already started');
      if (
        value.state !== 'PLANNED' ||
        !['RELEASED', 'IN_PROGRESS', 'PARTIALLY_COMPLETED'].includes(order.state) ||
        operations.some((op) => op.index < value.index && op.state !== 'COMPLETED')
      )
        reject('GUARD_STATE', 'Prior required route operations must complete');
      const updated = { ...value, state: 'IN_PROGRESS' as const };
      await this.store.saveOperation(ctx, updated);
      return this.result(ctx, updated, 'ProductionOperationStarted', value.state);
    }
    if (value.state === 'COMPLETED')
      reject('GUARD_CONFLICT', 'Production operation already posted');
    if (
      value.state !== 'IN_PROGRESS' ||
      !['RELEASED', 'IN_PROGRESS', 'PARTIALLY_COMPLETED'].includes(order.state)
    )
      reject('GUARD_STATE', 'Started operation required');
    return this.complete(ctx, order, value, operations);
  }
  private async complete(
    ctx: ProductionContext,
    order: ProductionOrder,
    op: ProductionOperation,
    operations: readonly ProductionOperation[],
  ): Promise<CommandDecision> {
    const input = ctx.request.payload;
    exact(input, ['inputs', 'outputs', 'residuals', 'scraps', 'finalizeUnitIds']);
    const consumed = list(input.inputs).map((raw) => {
      const v = object(raw);
      exact(v, ['unitId', 'kg']);
      id(v.unitId);
      kg(v.kg);
      return { unitId: v.unitId, kg: exactKg(v.kg) };
    });
    const inputIds = consumed.map((v) => v.unitId);
    if (new Set(inputIds).size !== inputIds.length)
      reject('GUARD_INVARIANT', 'Duplicate consumed Unit');
    const outputs = list(input.outputs).map((raw) => {
      const v = object(raw);
      exact(v, ['unitId', 'kg', 'kind', 'locationId', 'sourceUnitIds']);
      id(v.unitId);
      id(v.locationId);
      kg(v.kg);
      text(v.kind);
      const parents = ids(v.sourceUnitIds);
      if (!parents.length || parents.some((parent) => !inputIds.includes(parent)))
        reject('GUARD_INVARIANT', 'Output lineage must reference actual consumed Units');
      return {
        unitId: v.unitId,
        kg: exactKg(v.kg),
        kind: v.kind,
        locationId: v.locationId,
        sourceUnitIds: parents,
      };
    });
    const residuals = list(input.residuals).map((raw) => {
      const v = object(raw);
      exact(v, ['unitId', 'kg', 'kind', 'locationId', 'sourceUnitId']);
      id(v.unitId);
      id(v.locationId);
      id(v.sourceUnitId);
      kg(v.kg);
      text(v.kind);
      if (!inputIds.includes(v.sourceUnitId))
        reject('GUARD_INVARIANT', 'Residual source must be consumed');
      return {
        unitId: v.unitId,
        kg: exactKg(v.kg),
        kind: v.kind,
        locationId: v.locationId,
        sourceUnitId: v.sourceUnitId,
      };
    });
    const scraps = list(input.scraps).map((raw) => {
      const v = object(raw);
      exact(v, ['kg', 'sourceUnitId']);
      id(v.sourceUnitId);
      kg(v.kg);
      if (!inputIds.includes(v.sourceUnitId))
        reject('GUARD_INVARIANT', 'Scrap source must be consumed');
      return { kg: exactKg(v.kg), sourceUnitId: v.sourceUnitId };
    });
    const finalized = ids(input.finalizeUnitIds);
    const final = operations.every((other) => other.index <= op.index);
    if (!final && finalized.length)
      reject('GUARD_STATE', 'WIP may finalize only at last required operation');
    const all = [
      ...inputIds,
      ...outputs.map((v) => v.unitId),
      ...residuals.map((v) => v.unitId),
      ...finalized,
    ];
    if (new Set(all).size !== all.length)
      reject('GUARD_INVARIANT', 'Production Units must be disjoint');
    if (outputs.length + residuals.length > 32) reject('GUARD_INVARIANT', 'Too many derived Units');
    // OQ-001 records 1 kg measurements for actual Coil -> Sheet processing only.
    // The general exact storage capacity remains available to other workflows.
    if (outputs.some((output) => output.kind === 'SHEET') && inputIds.length) {
      const materials = await this.inventory.inspect(ctx, order.id, inputIds);
      const coils = new Set(
        materials.filter((material) => material.kind === 'COIL').map((material) => material.unitId),
      );
      const processedCoils = new Set(
        outputs
          .filter((output) => output.kind === 'SHEET')
          .flatMap((output) => output.sourceUnitIds.filter((source) => coils.has(source))),
      );
      const measured = [
        ...consumed.filter((source) => processedCoils.has(source.unitId)),
        ...outputs.filter((output) =>
          output.sourceUnitIds.some((source) => processedCoils.has(source)),
        ),
        ...residuals.filter((residual) => processedCoils.has(residual.sourceUnitId)),
        ...scraps.filter((scrap) => processedCoils.has(scrap.sourceUnitId)),
      ];
      if (measured.some((entry) => kg(entry.kg) % scale !== 0n))
        reject('GUARD_INVARIANT', 'Coil to Sheet measured kg must use whole kilograms');
    }
    const total = consumed.reduce((n, v) => n + kg(v.kg), 0n),
      result = [...outputs, ...residuals, ...scraps].reduce((n, v) => n + kg(v.kg), 0n);
    if (total !== result)
      reject(
        'GUARD_INVARIANT',
        'Production mass balance must equal exactly without unexplained loss',
      );
    if ((residuals.length || scraps.length) && !(await this.policy.canDispose(ctx)))
      reject('GUARD_ACTOR', 'Authenticated current disposition permission required');
    for (const source of consumed) {
      const leftover = [...residuals, ...scraps]
        .filter((v) => v.sourceUnitId === source.unitId)
        .reduce((n, v) => n + kg(v.kg), 0n);
      if (leftover > kg(source.kg))
        reject('GUARD_INVARIANT', 'Leftover exceeds its consumed source');
    }
    for (const source of consumed) {
      if (
        !outputs.some((out) => out.sourceUnitIds.includes(source.unitId)) &&
        !residuals.some((out) => out.sourceUnitId === source.unitId) &&
        !scraps.some((out) => out.sourceUnitId === source.unitId)
      )
        reject('GUARD_INVARIANT', 'Every consumed Unit requires actual result lineage');
      const exclusive = outputs
        .filter((out) => out.sourceUnitIds.length === 1 && out.sourceUnitIds[0] === source.unitId)
        .reduce((n, out) => n + kg(out.kg), 0n);
      const leftover = [...residuals, ...scraps]
        .filter((out) => out.sourceUnitId === source.unitId)
        .reduce((n, out) => n + kg(out.kg), 0n);
      if (exclusive + leftover > kg(source.kg))
        reject('GUARD_INVARIANT', 'Source-specific results exceed consumed kg');
    }
    for (const output of outputs)
      if (
        kg(output.kg) >
        consumed
          .filter((source) => output.sourceUnitIds.includes(source.unitId))
          .reduce((n, source) => n + kg(source.kg), 0n)
      )
        reject('GUARD_INVARIANT', 'Output exceeds its actual source kg');
    validateLineageCapacity(consumed, outputs, [...residuals, ...scraps]);
    const facts = await this.store.facts(ctx, order.id),
      allocations = await this.store.allocations(ctx, order.id);
    for (const source of consumed) {
      const previous = facts
        .filter((f) => f.kind === 'CONSUMPTION' && f.data.unitId === source.unitId)
        .reduce((n, f) => n + kg(f.data.kg), 0n);
      const planned = allocations.filter((a) => a.unitId === source.unitId && a.state === 'ISSUED');
      const wip = facts.find(
        (f) =>
          f.kind === 'OUTPUT' && f.data.unitId === source.unitId && f.data.disposition === 'WIP',
      );
      const limit = planned.length
        ? planned.reduce((n, a) => n + kg(a.kg), 0n)
        : wip
          ? kg(wip.data.kg)
          : 0n;
      if (previous + kg(source.kg) > limit)
        reject('GUARD_INVARIANT', 'Consumption exceeds its own issued allocation');
    }
    for (const unitId of finalized) {
      const origin = facts.find(
        (f) => f.kind === 'OUTPUT' && f.data.unitId === unitId && f.data.disposition === 'WIP',
      );
      if (
        !origin ||
        facts.some(
          (f) => (f.kind === 'CONSUMPTION' || f.kind === 'FINALIZED') && f.data.unitId === unitId,
        )
      )
        reject('GUARD_CONFLICT', 'Finalization requires intact existing own WIP');
    }
    const batchInputs = [];
    for (const source of consumed) {
      const factId = await this.writeFact(ctx, order, op, 'CONSUMPTION', source);
      batchInputs.push({ ...source, factId });
    }
    const productBatchId = randomUUID();
    if (outputs.length || residuals.length)
      await this.store.batch(ctx, productBatchId, order.id, op.id);
    const batchOutputs: ProductionOutput[] = [];
    for (const output of outputs) {
      const disposition = final ? 'FINAL' : 'WIP';
      const factId = await this.writeFact(ctx, order, op, 'OUTPUT', {
        ...output,
        disposition,
        productBatchId,
      });
      batchOutputs.push({
        unitId: output.unitId,
        kg: output.kg,
        kind: output.kind,
        locationId: output.locationId,
        factId,
        lotId: productBatchId,
        disposition,
      });
    }
    for (const residual of residuals) {
      const factId = await this.writeFact(ctx, order, op, 'RESIDUAL', {
        ...residual,
        disposition: 'RESIDUAL',
        productBatchId,
      });
      batchOutputs.push({
        unitId: residual.unitId,
        kg: residual.kg,
        kind: residual.kind,
        locationId: residual.locationId,
        factId,
        lotId: productBatchId,
        disposition: 'RESIDUAL',
      });
    }
    for (const scrap of scraps)
      await this.writeFact(ctx, order, op, 'SCRAP', { ...scrap, disposition: 'SCRAP' });
    for (const unitId of finalized) await this.writeFact(ctx, order, op, 'FINALIZED', { unitId });
    const batch: ProductionBatch = frozen({
      productionOrderId: order.id,
      operationId: op.id,
      inputs: batchInputs,
      outputs: batchOutputs,
      finalizeUnitIds: finalized,
    });
    if (all.length) {
      this.admissions.set(ctx.transaction, {
        actor: ctx.actor,
        request: canonicalJson(ctx.request as unknown as JsonObject).toString('utf8'),
        orderId: order.id,
        batch,
      });
      try {
        await this.inventory.complete(ctx, batch);
      } finally {
        this.admissions.delete(ctx.transaction);
      }
    }
    await this.authorize(ctx, 'ACT-OP');
    if ((residuals.length || scraps.length) && !(await this.policy.canDispose(ctx)))
      reject('GUARD_ACTOR', 'Production disposition permission was revoked');
    const updated = { ...op, state: 'COMPLETED' as const };
    await this.store.saveOperation(ctx, updated);
    return this.result(ctx, updated, 'ProductionOperationCompleted', op.state);
  }
  async accessible(ctx: ProductionContext, orderId: string): Promise<boolean> {
    try {
      await this.authorize(ctx);
      const value = await this.store.order(ctx, orderId);
      return value?.customerId === ctx.actor.customerScope;
    } catch (error) {
      if (error instanceof BusinessRejection) return false;
      throw error;
    }
  }
  admittedRelease(
    ctx: ProductionContext,
    salesOrderId: string,
    productionOrderId: string,
    itemId: string,
  ): Promise<boolean> {
    const admission = this.releases.get(ctx.transaction);
    return Promise.resolve(
      !!admission &&
        admission.actor === ctx.actor &&
        admission.salesOrderId === salesOrderId &&
        admission.productionOrderId === productionOrderId &&
        admission.itemId === itemId &&
        admission.request === canonicalJson(ctx.request as unknown as JsonObject).toString('utf8'),
    );
  }
  admittedIssue(ctx: ProductionContext, orderId: string, ids: readonly string[]): Promise<boolean> {
    const a = this.admissions.get(ctx.transaction);
    return Promise.resolve(
      !!a &&
        !!a.unitIds &&
        a.actor === ctx.actor &&
        a.orderId === orderId &&
        a.request === canonicalJson(ctx.request as unknown as JsonObject).toString('utf8') &&
        canonicalJson(a.unitIds as unknown as JsonObject).equals(
          canonicalJson(ids as unknown as JsonObject),
        ),
    );
  }
  admittedCompletion(ctx: ProductionContext, batch: ProductionBatch): Promise<boolean> {
    const a = this.admissions.get(ctx.transaction);
    return Promise.resolve(
      !!a &&
        !!a.batch &&
        a.actor === ctx.actor &&
        a.request === canonicalJson(ctx.request as unknown as JsonObject).toString('utf8') &&
        canonicalJson(a.batch as unknown as JsonObject).equals(
          canonicalJson(batch as unknown as JsonObject),
        ),
    );
  }
  async query(
    supplied: ProductionContext,
    kind: 'GetProductionOrder' | 'GetOperation' | 'GetAllocation',
    idValue: string,
  ): Promise<JsonObject | undefined> {
    const ctx = snapshot(supplied);
    id(idValue);
    await this.authorize(ctx);
    if (kind === 'GetProductionOrder') {
      const value = await this.store.order(ctx, idValue);
      return value && value.customerId === ctx.actor.customerScope
        ? publicRecord(value)
        : undefined;
    }
    if (kind !== 'GetOperation' && kind !== 'GetAllocation')
      reject('GUARD_INVARIANT', 'Unknown Production query');
    const value =
      kind === 'GetOperation'
        ? await this.store.operation(ctx, idValue)
        : await this.store.allocation(ctx, idValue);
    if (!value) return undefined;
    const order = await this.store.order(ctx, value.productionOrderId);
    return order?.customerId === ctx.actor.customerScope ? publicRecord(value) : undefined;
  }
}
