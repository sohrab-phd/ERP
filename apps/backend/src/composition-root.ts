import { randomUUID } from 'node:crypto';
import {
  BusinessRejection,
  CommandRegistry,
  executeCommand,
  validUuid,
} from '@navard/shared-kernel';
import type {
  CommandRequest,
  StableResult,
  ExecutionContext,
  ExecutionPorts,
  TransactionContext,
} from '@navard/shared-kernel';
import type { Config } from './config.js';
import { createPool } from './infrastructure/postgresql/pool.js';
import { PostgresTransactions } from './infrastructure/postgresql/transaction.js';
import { PostgresOutcomes } from './infrastructure/postgresql/outcome-store.js';
import { PostgresAudit } from './infrastructure/postgresql/audit-store.js';
import { createLogger } from './infrastructure/logging/json-logger.js';
import { createHttpHost, closeHttpHost } from './transport/http-host.js';
import { createIdentityHandler } from './transport/identity-http.js';
import { IdentityService, IdentityAuthorization } from './modules/identity/index.js';
import { PostgresIdentityStore } from './infrastructure/postgresql/identity-store.js';
import { InventoryPostingService } from './modules/inventory/index.js';
import type { PostingContext } from './modules/inventory/index.js';
import type { ReceiptContext } from './modules/procurement/index.js';
import { PostgresInventoryStore } from './infrastructure/postgresql/inventory-store.js';
import { ReservationService } from './modules/inventory/index.js';
import { PostgresReservationRequestStore } from './infrastructure/postgresql/inventory-reservation-store.js';
import { createReservationHandler } from './transport/reservation-http.js';
import { InventoryReceiptService } from './modules/inventory/index.js';
import { ReceiptService, parseReceiptInput } from './modules/procurement/index.js';
import { PostgresInventoryReceiptStore } from './infrastructure/postgresql/inventory-receipt-store.js';
import { PostgresReceiptStore } from './infrastructure/postgresql/receipt-store.js';
import { SalesService, type SalesContext } from './modules/sales/index.js';
import { PostgresSalesStore } from './infrastructure/postgresql/sales-store.js';
import { createSalesHandler } from './transport/sales-http.js';
import { createReceiptHandler } from './transport/receipt-http.js';
import { ShippingService, type ShippingContext } from './modules/shipping/index.js';
import { InventoryShippingService } from './modules/inventory/index.js';
import { PostgresShippingStore } from './infrastructure/postgresql/shipping-store.js';
import { createShippingHandler } from './transport/shipping-http.js';
/** Own checked-out error handling: the pool's listener covers only idle clients. */
export async function pingDatabase(pool: ReturnType<typeof createPool>): Promise<void> {
  const client = await pool.connect();
  let released = false;
  const release = (discard = false) => {
    if (released) return;
    released = true;
    client.removeListener('error', onError);
    client.release(discard);
  };
  const onError = () => release(true);
  client.on('error', onError);
  const timer = setTimeout(() => release(true), 2000);
  try {
    const result = await client.query<{ compatible: boolean }>(
      "SELECT current_setting('server_version_num')::integer=180006 AND current_setting('server_encoding')='UTF8' AS compatible",
    );
    if (!result.rows[0]?.compatible) throw new Error('Database compatibility failed');
  } finally {
    clearTimeout(timer);
    release();
  }
}
export function compose(config: Readonly<Config>) {
  const pool = createPool(config.databaseUrl);
  const log = createLogger(config.logLevel);
  const transactions = new PostgresTransactions(pool);
  const identity = new IdentityService(
    new PostgresIdentityStore(pool),
    transactions,
    config.installationId,
    config.installationId,
  );
  const org = (context: ExecutionContext) =>
    context.customerScope === undefined && context.temporary !== true;
  const current = async (context: ExecutionContext, tx?: TransactionContext) =>
    org(context) && (await identity.isCurrent(context, tx));
  const canRead = async (ctx: PostingContext) =>
    ['ACT-WH', 'ACT-SEC'].includes(ctx.actor.actorRole) &&
    (await current(ctx.actor, ctx.transaction));
  const canPost = async (ctx: ReceiptContext) =>
    ctx.actor.actorRole === 'ACT-WH' && (await current(ctx.actor, ctx.transaction));
  const salesStore = new PostgresSalesStore();
  const salesCurrent = (ctx: SalesContext, customerId = ctx.actor.customerScope) =>
    ctx.actor.actorRole === 'ACT-SALES' &&
    validUuid(customerId) &&
    ctx.actor.customerScope === customerId &&
    ctx.actor.temporary !== true &&
    identity.isCurrent(ctx.actor, ctx.transaction);
  const salesResource = async (ctx: SalesContext) => {
    if (!(await salesCurrent(ctx))) return false;
    if (['SubmitSalesOrder', 'ConfirmSalesOrder'].includes(ctx.request.command))
      return (
        ctx.request.target.kind === 'sales-order' &&
        (await salesStore.order(ctx, ctx.request.target.id)) !== undefined
      );
    if (ctx.request.command === 'RecordFulfillmentStock')
      return (
        ctx.request.target.kind === 'fulfillment-assessment' &&
        (await salesStore.assessment(ctx, ctx.request.target.id)) !== undefined
      );
    return false;
  };
  const reservationCurrent = async (ctx: PostingContext, customerId: string, requesting = false) =>
    validUuid(customerId) &&
    ctx.actor.temporary !== true &&
    (ctx.actor.actorRole === 'ACT-SALES'
      ? ctx.actor.customerScope === customerId
      : !requesting && ctx.actor.actorRole === 'ACT-WH' && org(ctx.actor)) &&
    (await identity.isCurrent(ctx.actor, ctx.transaction));
  const shippingCommands = [
    'DraftPackage',
    'PackPackage',
    'UnpackPackage',
    'AssignPackageToShipment',
    'DraftShipment',
    'MarkShipmentReady',
    'StartLoading',
    'DispatchShipment',
  ];
  const shipCurrent = async (ctx: ShippingContext, customerId = ctx.actor.customerScope) =>
    ctx.actor.actorRole === 'ACT-SHIP' &&
    validUuid(customerId) &&
    ctx.actor.customerScope === customerId &&
    ctx.actor.temporary !== true &&
    (await identity.isCurrent(ctx.actor, ctx.transaction));
  const inventoryStore = new PostgresInventoryStore();
  const reservationStore = new PostgresReservationRequestStore();
  const inventory: InventoryPostingService = new InventoryPostingService(inventoryStore, {
    availability: async (ctx, unit) => {
      if (
        !['RecordFulfillmentStock', 'ConfirmSalesOrder'].includes(ctx.request.command) ||
        !(await salesResource(ctx))
      )
        return false;
      if (!unit || unit.state === 'AVAILABLE') return true;
      return (
        unit.state === 'RESERVED' &&
        (await reservationStore.activeCustomer(ctx, unit.id)) === ctx.actor.customerScope
      );
    },
    visibleForEffect: (ctx, effect, unit) => inventoryShipping.visibleForEffect(ctx, effect, unit),
    authorize: (ctx) =>
      ctx.request.command === 'DispatchShipment'
        ? shipCurrent(ctx)
        : ctx.request.command === 'ActivateReservation'
          ? Promise.resolve(
              ctx.actor.temporary !== true &&
                (ctx.actor.actorRole === 'ACT-SALES'
                  ? validUuid(ctx.actor.customerScope)
                  : ctx.actor.actorRole === 'ACT-WH' && org(ctx.actor)) &&
                identity.isCurrent(ctx.actor, ctx.transaction),
            )
          : ctx.request.command === 'PostGoodsReceipt'
            ? canPost(ctx)
            : ['GetInventoryUnit', 'GetLot'].includes(ctx.request.command)
              ? canRead(ctx)
              : Promise.resolve(false),
    validate: (ctx, effect, unit) => {
      if (ctx.request.command === 'DispatchShipment')
        return inventoryShipping.validateEffect(ctx, effect, unit);
      if (ctx.request.command === 'ActivateReservation')
        return reservations.validateEffect(ctx, effect, unit);
      const input = parseReceiptInput(ctx.request.payload);
      return Promise.resolve(
        ctx.request.command === 'PostGoodsReceipt' &&
          ctx.request.target.kind === 'goods-receipt' &&
          effect.type === 'STOCK_IN' &&
          !unit &&
          effect.source.factId === ctx.request.target.id &&
          effect.kg === input.measuredKg &&
          effect.create?.kind === input.type &&
          effect.create.locationId === input.locationId &&
          effect.create.customerScope === ''
          ? undefined
          : {
              family: 'GUARD_INVARIANT' as const,
              message: 'Receipt quantity effect does not match admitted intake',
            },
      );
    },
    reservationPriority: (ctx, effect, unit) => reservations.priorityForEffect(ctx, effect, unit),
    maintain: (ctx, unit) =>
      unit.customerScope === '' && unit.state === 'AVAILABLE'
        ? canRead(ctx)
        : Promise.resolve(false),
  });
  const receiptInventory = new InventoryReceiptService(
    new PostgresInventoryReceiptStore(),
    inventory,
    { canRead, canReceive: canPost },
  );
  const receipts = new ReceiptService(new PostgresReceiptStore(), receiptInventory, {
    canPost,
    canRead,
  });
  const sales = new SalesService(
    salesStore,
    {
      readStock: (ctx, ids) => inventory.availability(ctx, ids),
    },
    {
      canAccess: (ctx, id) => Promise.resolve(salesCurrent(ctx, id)),
      canShip: (ctx, id) =>
        shippingCommands.includes(ctx.request.command)
          ? shipCurrent(ctx, id)
          : Promise.resolve(false),
      canReserve: (ctx, id) =>
        ['RequestReservation', 'ActivateReservation', 'GetReservation'].includes(
          ctx.request.command,
        )
          ? reservationCurrent(ctx, id, ctx.request.command === 'RequestReservation')
          : Promise.resolve(false),
    },
  );
  const reservations: ReservationService = new ReservationService(
    reservationStore,
    inventoryStore,
    inventory,
    {
      demand: (ctx, id, customerId) => sales.reservationDemand(ctx, id, customerId),
      competitors: (ctx, demand, unitId) =>
        sales.reservationCompetitors(ctx, demand.id, demand.customerId, unitId),
    },
    {
      canRequest: (ctx, id) => reservationCurrent(ctx, id, true),
      canActivate: reservationCurrent,
      canRead: (ctx, id) =>
        ctx.actor.actorRole === 'ACT-SALES'
          ? reservationCurrent(ctx, id, true)
          : Promise.resolve(false),
    },
  );
  const inventoryShipping = new InventoryShippingService(
    reservationStore,
    inventoryStore,
    inventory,
    { canShip: shipCurrent },
  );
  const shippingStore = new PostgresShippingStore();
  const shipping = new ShippingService(
    shippingStore,
    inventoryShipping,
    { demand: (ctx, id, customer) => sales.shippingDemand(ctx, id, customer) },
    { canShip: shipCurrent },
  );
  const shippingPolicies = shipping.contracts().map((contract) => ({
    command: contract.command,
    version: 1,
    roles: ['ACT-SHIP' as const],
    canTarget: async (
      actor: ExecutionContext,
      request: CommandRequest,
      tx?: TransactionContext,
    ) => {
      const packageCommand = [
        'DraftPackage',
        'PackPackage',
        'UnpackPackage',
        'AssignPackageToShipment',
      ].includes(request.command);
      if (
        actor.actorRole !== 'ACT-SHIP' ||
        actor.temporary === true ||
        !validUuid(actor.customerScope) ||
        !validUuid(request.target.id) ||
        request.target.kind !== (packageCommand ? 'package' : 'shipment')
      )
        return false;
      if (!tx || request.command === 'DraftPackage' || request.command === 'DraftShipment')
        return true;
      const ctx = { actor, request, transaction: tx };
      return (
        (packageCommand
          ? await shippingStore.package(ctx, request.target.id)
          : await shippingStore.shipment(ctx, request.target.id)) !== undefined
      );
    },
    canDisclose: (actor: ExecutionContext, _request: CommandRequest, result: StableResult) =>
      Promise.resolve(
        result.outcome === 'rejected' || result.data?.customerId === actor.customerScope,
      ),
  }));
  const reservationPolicies = reservations.contracts().map((contract) => ({
    command: contract.command,
    version: 1,
    roles:
      contract.command === 'RequestReservation'
        ? ['ACT-SALES' as const]
        : ['ACT-SALES' as const, 'ACT-WH' as const],
    canTarget: async (
      actor: ExecutionContext,
      request: CommandRequest,
      tx?: TransactionContext,
    ) => {
      if (
        request.target.kind !== 'reservation' ||
        !validUuid(request.target.id) ||
        actor.temporary === true
      )
        return false;
      if (
        actor.actorRole === 'ACT-SALES'
          ? !validUuid(actor.customerScope)
          : request.command !== 'ActivateReservation' || actor.actorRole !== 'ACT-WH' || !org(actor)
      )
        return false;
      if (!tx || request.command === 'RequestReservation') return true;
      return (
        (await reservationStore.get({ actor, request, transaction: tx }, request.target.id)) !==
        undefined
      );
    },
    canDisclose: (actor: ExecutionContext, _request: CommandRequest, result: StableResult) =>
      Promise.resolve(
        result.outcome === 'rejected' ||
          (actor.actorRole === 'ACT-WH' && org(actor)) ||
          result.data?.customerId === actor.customerScope,
      ),
  }));
  const salesPolicies = sales.contracts().map((contract) => ({
    command: contract.command,
    version: 1,
    roles: ['ACT-SALES' as const],
    canTarget: async (
      actor: ExecutionContext,
      request: CommandRequest,
      tx?: TransactionContext,
    ) => {
      if (
        actor.actorRole !== 'ACT-SALES' ||
        actor.temporary === true ||
        !validUuid(actor.customerScope)
      )
        return false;
      if (request.command === 'DraftSalesOrder')
        return (
          request.target.kind === 'sales-order' &&
          request.payload.customerId === actor.customerScope
        );
      if (request.command === 'DraftFulfillmentAssessment') {
        if (request.target.kind !== 'fulfillment-assessment' || !validUuid(request.payload.orderId))
          return false;
        return (
          tx === undefined ||
          (await salesStore.order({ actor, request, transaction: tx }, request.payload.orderId)) !==
            undefined
        );
      }
      if (!tx)
        return (
          request.target.kind ===
          (request.command === 'RecordFulfillmentStock' ? 'fulfillment-assessment' : 'sales-order')
        );
      return salesResource({ actor, request, transaction: tx });
    },
    canDisclose: (actor: ExecutionContext, _request: CommandRequest, result: StableResult) =>
      Promise.resolve(
        result.outcome === 'rejected' || result.data?.customerId === actor.customerScope,
      ),
  }));
  const ports: ExecutionPorts = {
    registry: new CommandRegistry([
      receipts.contract(),
      ...sales.contracts(),
      ...reservations.contracts(),
      ...shipping.contracts(),
    ]),
    transactions,
    outcomes: new PostgresOutcomes(),
    audits: new PostgresAudit(),
    authorization: new IdentityAuthorization(identity, [
      ...salesPolicies,
      ...reservationPolicies,
      ...shippingPolicies,
      {
        command: 'PostGoodsReceipt',
        version: 1,
        roles: ['ACT-WH'],
        canTarget: (ctx, request) =>
          Promise.resolve(
            org(ctx) && request.target.kind === 'goods-receipt' && validUuid(request.target.id),
          ),
        canDisclose: (ctx, request) =>
          Promise.resolve(
            org(ctx) && request.target.kind === 'goods-receipt' && validUuid(request.target.id),
          ),
      },
    ]),
    // Default stays fenced. Operator affirms original/reconciled primary, never an absent restored outcome.
    recoveryFence: {
      permitsAdmission: () => Promise.resolve(config.commandAdmissionReconciled === true),
    },
  };
  const command = (input: string | Uint8Array, context: ExecutionContext) =>
    executeCommand(input, context, ports);
  const query = async (
    kind: 'GetGoodsReceipt' | 'GetInventoryUnit' | 'GetLot',
    id: string,
    actor: ExecutionContext,
  ) => {
    if (!validUuid(id) || !['GetGoodsReceipt', 'GetInventoryUnit', 'GetLot'].includes(kind))
      throw new BusinessRejection({ family: 'GUARD_INVARIANT', message: 'Invalid receipt query' });
    const tx = await transactions.begin();
    try {
      const context = {
        actor,
        transaction: tx.context,
        request: {
          command: kind,
          contract_version: 1,
          idempotency_key: randomUUID(),
          target: { kind: 'query', id },
          payload: {},
          preconditions: {},
        },
      };
      if (!(await canRead(context)))
        throw new BusinessRejection({ family: 'GUARD_ACTOR', message: 'Stock read access denied' });
      const result =
        kind === 'GetGoodsReceipt'
          ? await receipts.get(context, id)
          : kind === 'GetInventoryUnit'
            ? await receiptInventory.details(context, id)
            : await receiptInventory.lot(context, id);
      await tx.commit();
      if (kind === 'GetGoodsReceipt' && result && 'binding' in result) {
        return Object.fromEntries(Object.entries(result).filter(([key]) => key !== 'binding'));
      }
      return result;
    } catch (error) {
      await tx.rollback();
      throw error;
    } finally {
      await tx.release();
    }
  };
  const salesQuery = async (
    kind: 'GetSalesOrder' | 'GetFulfillmentAssessment',
    id: string,
    actor: ExecutionContext,
  ) => {
    if (!validUuid(id) || !['GetSalesOrder', 'GetFulfillmentAssessment'].includes(kind))
      throw new BusinessRejection({ family: 'GUARD_INVARIANT', message: 'Invalid Sales query' });
    const tx = await transactions.begin();
    try {
      const ctx = {
        actor,
        transaction: tx.context,
        request: {
          command: kind,
          contract_version: 1,
          idempotency_key: randomUUID(),
          target: { kind: 'query', id },
          payload: {},
          preconditions: {},
        },
      };
      if (!(await salesCurrent(ctx)))
        throw new BusinessRejection({ family: 'GUARD_ACTOR', message: 'Sales access denied' });
      const result =
        kind === 'GetSalesOrder'
          ? await sales.getOrder(ctx, id)
          : await sales.getAssessment(ctx, id);
      await tx.commit();
      return result
        ? Object.fromEntries(
            Object.entries(result).filter(([key]) => key !== 'binding' && key !== 'orderBinding'),
          )
        : undefined;
    } catch (error) {
      await tx.rollback();
      throw error;
    } finally {
      await tx.release();
    }
  };
  const reservationQuery = async (id: string, actor: ExecutionContext) => {
    if (!validUuid(id))
      throw new BusinessRejection({
        family: 'GUARD_INVARIANT',
        message: 'Invalid reservation query',
      });
    const tx = await transactions.begin();
    try {
      const ctx = {
        actor,
        transaction: tx.context,
        request: {
          command: 'GetReservation',
          contract_version: 1,
          idempotency_key: randomUUID(),
          target: { kind: 'reservation', id },
          payload: {},
          preconditions: {},
        },
      };
      const result = await reservations.get(ctx, id);
      await tx.commit();
      return result
        ? Object.fromEntries(
            Object.entries(result).filter(([key]) => !['binding', 'orderBinding'].includes(key)),
          )
        : undefined;
    } catch (error) {
      await tx.rollback();
      throw error;
    } finally {
      await tx.release();
    }
  };
  const shippingQuery = async (
    kind: 'GetPackage' | 'GetShipment',
    id: string,
    actor: ExecutionContext,
  ) => {
    if (!validUuid(id) || !['GetPackage', 'GetShipment'].includes(kind))
      throw new BusinessRejection({ family: 'GUARD_INVARIANT', message: 'Invalid shipment query' });
    const tx = await transactions.begin();
    try {
      const ctx = {
        actor,
        transaction: tx.context,
        request: {
          command: kind,
          contract_version: 1,
          idempotency_key: randomUUID(),
          target: { kind: 'query', id },
          payload: {},
          preconditions: {},
        },
      };
      if (!(await shipCurrent(ctx)))
        throw new BusinessRejection({ family: 'GUARD_ACTOR', message: 'Shipping access denied' });
      const result =
        kind === 'GetPackage'
          ? await shipping.getPackage(ctx, id)
          : await shipping.getShipment(ctx, id);
      await tx.commit();
      return result
        ? Object.fromEntries(
            Object.entries(result).filter(([key]) => !['binding', 'orderBinding'].includes(key)),
          )
        : undefined;
    } catch (error) {
      await tx.rollback();
      throw error;
    } finally {
      await tx.release();
    }
  };
  const server = createHttpHost({
    ping: () => pingDatabase(pool),
    identity: createIdentityHandler(identity),
    receipt: createReceiptHandler({ identity, command, query }),
    sales: createSalesHandler({ identity, command, query: salesQuery }),
    shipping: createShippingHandler({ identity, command, query: shippingQuery }),
    reservation: createReservationHandler({ identity, command, query: reservationQuery }),
  });
  return {
    server,
    registry: ports.registry,
    identity,
    inventory,
    receipts,
    sales,
    salesQuery,
    shipping,
    shippingQuery,
    reservations,
    reservationQuery,
    command,
    query,
    async start() {
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(config.port, config.host, () => {
          server.off('error', reject);
          resolve();
        });
      });
      log('info', 'host.started');
    },
    async stop() {
      await closeHttpHost(server);
      await pool.end();
      log('info', 'host.stopped');
    },
  };
}
