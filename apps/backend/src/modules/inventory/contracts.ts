import type {
  CommandRequest,
  ExecutionContext,
  GuardRejection,
  TransactionContext,
} from '@navard/shared-kernel';

export type UnitState =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'ISSUED_TO_PRODUCTION'
  | 'PARTIALLY_CONSUMED'
  | 'CONSUMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'SCRAPPED'
  | 'RETURNED'
  | 'CLOSED';
export interface Unit {
  id: string;
  lotId: string;
  kind: string;
  locationId: string;
  customerScope: string;
  state: UnitState;
}
export interface Availability {
  readonly unitId: string;
  readonly kind: string;
  readonly state: UnitState;
  readonly availableKg: string;
}
export interface Quantities {
  onHand: string;
  reserved: string;
}
export interface PostingContext {
  actor: ExecutionContext;
  request: CommandRequest;
  transaction: TransactionContext;
}
export interface Source {
  factId: string;
  effectId: string;
}
export type PostingEffect =
  | {
      type: 'STOCK_IN';
      source: Source;
      unitId: string;
      kg: string;
      create?: Omit<Unit, 'id' | 'state'>;
    }
  | {
      type: 'STOCK_OUT';
      source: Source;
      unitId: string;
      kg: string;
      nextState: 'PARTIALLY_CONSUMED' | 'CONSUMED' | 'SHIPPED';
      originalLedgerId?: string;
    }
  | {
      type: 'RESERVE';
      source: Source;
      unitId: string;
      kg: string;
      reservationId: string;
      demandId: string;
    }
  | {
      type: 'RELEASE';
      source: Source;
      unitId: string;
      reservationId: string;
      terminal: 'RELEASED' | 'CONSUMED';
    };
export interface LedgerRow {
  id: string;
  source: Source;
  unitId: string;
  binding: string;
  onHandDelta: string;
  reservedDelta: string;
  originalLedgerId?: string;
}
export interface Reservation {
  id: string;
  unitId: string;
  demandId: string;
  kg: string;
  state: 'ACTIVE' | 'RELEASED' | 'CONSUMED';
}
export interface InventoryStore {
  lock(
    context: PostingContext,
    unitIds: readonly string[],
    effectIds: readonly string[],
    reservationIds?: readonly string[],
  ): Promise<void>;
  unit(context: PostingContext, id: string): Promise<Unit | undefined>;
  createUnit(context: PostingContext, unit: Unit): Promise<void>;
  changeState(context: PostingContext, id: string, state: UnitState): Promise<void>;
  totals(context: PostingContext, id: string): Promise<Quantities>;
  balance(context: PostingContext, id: string): Promise<Quantities | undefined>;
  project(context: PostingContext, id: string, quantities: Quantities): Promise<void>;
  findEffect(context: PostingContext, source: Source): Promise<LedgerRow | undefined>;
  ledger(context: PostingContext, id: string): Promise<LedgerRow | undefined>;
  append(context: PostingContext, row: LedgerRow): Promise<void>;
  activeReservation(context: PostingContext, id: string): Promise<Reservation | undefined>;
  reservation(context: PostingContext, id: string): Promise<Reservation | undefined>;
  insertReservation(context: PostingContext, reservation: Reservation): Promise<void>;
  closeReservation(
    context: PostingContext,
    id: string,
    terminal: 'RELEASED' | 'CONSUMED',
  ): Promise<void>;
}
/** Owning orchestration supplies business eligibility; unknown production policy stays denied. */
export interface PostingPolicy {
  /** Read authority is separate from stock posting and preserves the branded caller context. */
  availability?(context: PostingContext, unit?: Unit): Promise<boolean>;
  visibleForEffect?(context: PostingContext, effect: PostingEffect, unit: Unit): Promise<boolean>;
  authorize(context: PostingContext): Promise<boolean>;
  validate(
    context: PostingContext,
    effect: PostingEffect,
    unit: Unit | undefined,
  ): Promise<GuardRejection | undefined>;
  reservationPriority?(
    context: PostingContext,
    effect: Extract<PostingEffect, { type: 'RESERVE' }>,
    unit: Unit,
  ): Promise<boolean>;
  maintain(context: PostingContext, unit: Unit): Promise<boolean>;
}
