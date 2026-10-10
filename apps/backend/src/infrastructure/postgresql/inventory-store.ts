import { BusinessRejection, TechnicalError, validUuid } from '@navard/shared-kernel';
import type {
  InventoryStore,
  InventoryTraceContext,
  InventoryTraceSourcePort,
  LedgerRow,
  PostingContext,
  Quantities,
  Reservation,
  Source,
  Unit,
  UnitState,
} from '../../modules/inventory/index.js';
import { transactionClient } from './transaction.js';

const unitColumns =
  'unit_id AS id,lot_id AS "lotId",kind,location_id AS "locationId",customer_scope AS "customerScope",state';
const ledgerColumns =
  'ledger_id AS id,source_fact_id AS "factId",effect_id AS "effectId",unit_id AS "unitId",binding,on_hand_delta::text AS "onHandDelta",reserved_delta::text AS "reservedDelta",original_ledger_id AS "originalLedgerId"';
const reservationColumns =
  'reservation_id AS id,unit_id AS "unitId",demand_id AS "demandId",kg::text AS kg,state';

interface StoredLedger {
  id: string;
  factId: string;
  effectId: string;
  unitId: string;
  binding: string;
  onHandDelta: string;
  reservedDelta: string;
  originalLedgerId: string | null;
}

function scope(context: PostingContext): [string, string] {
  return [context.actor.installationId, context.actor.authorityScopeId];
}

function ledgerRow(row: StoredLedger | undefined): LedgerRow | undefined {
  if (row === undefined) return undefined;
  return {
    id: row.id,
    source: { factId: row.factId, effectId: row.effectId },
    unitId: row.unitId,
    binding: row.binding,
    onHandDelta: row.onHandDelta,
    reservedDelta: row.reservedDelta,
    ...(row.originalLedgerId === null ? {} : { originalLedgerId: row.originalLedgerId }),
  };
}

/** Internal ACT-IPS persistence; caller owns the one transaction and its outcome. */
export class PostgresInventoryStore implements InventoryStore, InventoryTraceSourcePort {
  async traceUnit(context: InventoryTraceContext, id: string): Promise<Unit | undefined> {
    if (!validUuid(context.customerId))
      throw new BusinessRejection({ family: 'GUARD_ACTOR', message: 'Trace customer required' });
    return (
      await transactionClient(context.transaction).query<Unit>(
        'SELECT ' +
          unitColumns +
          " FROM inventory.unit WHERE installation_id=$1 AND authority_scope=$2 AND (customer_scope='' OR customer_scope=$3) AND unit_id=$4",
        [context.actor.installationId, context.actor.authorityScopeId, context.customerId, id],
      )
    ).rows[0];
  }

  async lock(
    context: PostingContext,
    unitIds: readonly string[],
    effectIds: readonly string[],
    reservationIds: readonly string[] = [],
  ) {
    const client = transactionClient(context.transaction);
    const namespace = scope(context);
    const names = [
      ...unitIds.map((id) => JSON.stringify(['inventory', ...namespace, 'unit', id])),
      ...effectIds.map((id) => JSON.stringify(['inventory', ...namespace, 'effect', id])),
      ...reservationIds.map((id) => JSON.stringify(['inventory', ...namespace, 'reservation', id])),
    ];
    // Order the actual bigint locks, including hash collisions, rather than their labels.
    const keys = await client.query<{ key: string }>(
      'SELECT DISTINCT hashtextextended(value,0) AS key FROM unnest($1::text[]) AS input(value) ORDER BY key',
      [names],
    );
    for (const { key } of keys.rows) {
      await client.query('SELECT pg_advisory_xact_lock($1::bigint)', [key]);
    }
    await client.query(
      'SELECT unit_id FROM inventory.unit WHERE installation_id=$1 AND authority_scope=$2 AND unit_id=ANY($3::uuid[]) ORDER BY unit_id FOR UPDATE',
      [...namespace, [...new Set(unitIds)]],
    );
  }

  async unit(context: PostingContext, id: string): Promise<Unit | undefined> {
    return (
      await transactionClient(context.transaction).query<Unit>(
        'SELECT ' +
          unitColumns +
          ' FROM inventory.unit WHERE installation_id=$1 AND authority_scope=$2 AND unit_id=$3',
        [...scope(context), id],
      )
    ).rows[0];
  }

  async createUnit(context: PostingContext, unit: Unit) {
    await transactionClient(context.transaction).query(
      'INSERT INTO inventory.unit(installation_id,authority_scope,unit_id,lot_id,kind,location_id,customer_scope,state) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',
      [
        ...scope(context),
        unit.id,
        unit.lotId,
        unit.kind,
        unit.locationId,
        unit.customerScope,
        unit.state,
      ],
    );
  }

  async changeState(context: PostingContext, id: string, state: UnitState) {
    const response = await transactionClient(context.transaction).query(
      'UPDATE inventory.unit SET state=$4 WHERE installation_id=$1 AND authority_scope=$2 AND unit_id=$3',
      [...scope(context), id, state],
    );
    if (response.rowCount !== 1) throw new TechnicalError('retryable');
  }

  async totals(context: PostingContext, id: string): Promise<Quantities> {
    const response = await transactionClient(context.transaction).query<Quantities>(
      'SELECT COALESCE(SUM(on_hand_delta),0)::text AS "onHand",COALESCE(SUM(reserved_delta),0)::text AS reserved FROM inventory.ledger WHERE installation_id=$1 AND authority_scope=$2 AND unit_id=$3',
      [...scope(context), id],
    );
    if (response.rows[0] === undefined) throw new TechnicalError('retryable');
    return response.rows[0];
  }

  async balance(context: PostingContext, id: string): Promise<Quantities | undefined> {
    return (
      await transactionClient(context.transaction).query<Quantities>(
        'SELECT on_hand::text AS "onHand",reserved::text AS reserved FROM inventory.balance WHERE installation_id=$1 AND authority_scope=$2 AND unit_id=$3',
        [...scope(context), id],
      )
    ).rows[0];
  }

  async project(context: PostingContext, id: string, quantities: Quantities) {
    await transactionClient(context.transaction).query(
      'INSERT INTO inventory.balance(installation_id,authority_scope,unit_id,on_hand,reserved) VALUES($1,$2,$3,$4,$5) ON CONFLICT(installation_id,authority_scope,unit_id) DO UPDATE SET on_hand=EXCLUDED.on_hand,reserved=EXCLUDED.reserved',
      [...scope(context), id, quantities.onHand, quantities.reserved],
    );
  }

  async findEffect(context: PostingContext, source: Source): Promise<LedgerRow | undefined> {
    return ledgerRow(
      (
        await transactionClient(context.transaction).query<StoredLedger>(
          'SELECT ' +
            ledgerColumns +
            ' FROM inventory.ledger WHERE installation_id=$1 AND authority_scope=$2 AND effect_id=$3',
          [...scope(context), source.effectId],
        )
      ).rows[0],
    );
  }

  async ledger(context: PostingContext, id: string): Promise<LedgerRow | undefined> {
    return ledgerRow(
      (
        await transactionClient(context.transaction).query<StoredLedger>(
          'SELECT ' +
            ledgerColumns +
            ' FROM inventory.ledger WHERE installation_id=$1 AND authority_scope=$2 AND ledger_id=$3',
          [...scope(context), id],
        )
      ).rows[0],
    );
  }

  async append(context: PostingContext, row: LedgerRow) {
    await transactionClient(context.transaction).query(
      'INSERT INTO inventory.ledger(installation_id,authority_scope,ledger_id,source_fact_id,effect_id,unit_id,binding,on_hand_delta,reserved_delta,original_ledger_id,issuer,subject,actor_role,request_id,command_id,command_version,idempotency_key) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)',
      [
        ...scope(context),
        row.id,
        row.source.factId,
        row.source.effectId,
        row.unitId,
        row.binding,
        row.onHandDelta,
        row.reservedDelta,
        row.originalLedgerId ?? null,
        context.actor.principal.issuer,
        context.actor.principal.subject,
        context.actor.actorRole,
        context.actor.requestId,
        context.request.command,
        context.request.contract_version,
        context.request.idempotency_key,
      ],
    );
  }

  async activeReservation(context: PostingContext, id: string): Promise<Reservation | undefined> {
    return (
      await transactionClient(context.transaction).query<Reservation>(
        'SELECT ' +
          reservationColumns +
          " FROM inventory.reservation WHERE installation_id=$1 AND authority_scope=$2 AND unit_id=$3 AND state='ACTIVE'",
        [...scope(context), id],
      )
    ).rows[0];
  }

  async reservation(context: PostingContext, id: string): Promise<Reservation | undefined> {
    return (
      await transactionClient(context.transaction).query<Reservation>(
        'SELECT ' +
          reservationColumns +
          ' FROM inventory.reservation WHERE installation_id=$1 AND authority_scope=$2 AND reservation_id=$3',
        [...scope(context), id],
      )
    ).rows[0];
  }

  async insertReservation(context: PostingContext, reservation: Reservation) {
    await transactionClient(context.transaction).query(
      'INSERT INTO inventory.reservation(installation_id,authority_scope,reservation_id,unit_id,demand_id,kg,state) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [
        ...scope(context),
        reservation.id,
        reservation.unitId,
        reservation.demandId,
        reservation.kg,
        reservation.state,
      ],
    );
  }

  async closeReservation(context: PostingContext, id: string, terminal: 'RELEASED' | 'CONSUMED') {
    const response = await transactionClient(context.transaction).query(
      "UPDATE inventory.reservation SET state=$4 WHERE installation_id=$1 AND authority_scope=$2 AND reservation_id=$3 AND state='ACTIVE'",
      [...scope(context), id, terminal],
    );
    if (response.rowCount !== 1) throw new TechnicalError('retryable');
  }
}
