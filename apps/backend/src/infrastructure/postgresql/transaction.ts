import type { Pool, PoolClient } from 'pg';
import {
  createTransactionContext,
  TechnicalError,
  type TransactionContext,
  type TransactionPort,
  type TransactionSession,
} from '@navard/shared-kernel';

interface State {
  client: PoolClient;
  released: boolean;
  finished: boolean;
  timedOut: boolean;
  committing: boolean;
}

const sessions = new WeakMap<TransactionContext, State>();

/** Internal adapter seam: the kernel and handlers see only the opaque context. */
export function transactionClient(context: TransactionContext): PoolClient {
  const state = sessions.get(context);
  if (!state || state.released || state.finished || state.timedOut) {
    throw new TechnicalError('retryable');
  }
  return state.client;
}

export interface TransactionBounds {
  lockTimeoutMs?: number;
  statementTimeoutMs?: number;
  deadlineMs?: number;
}

export class PostgresTransactions implements TransactionPort {
  constructor(
    private readonly pool: Pool,
    private readonly bounds: TransactionBounds = {},
  ) {}

  async begin(): Promise<TransactionSession> {
    let client: PoolClient;
    try {
      client = await this.pool.connect();
    } catch {
      throw new TechnicalError('retryable');
    }
    const context = createTransactionContext();
    const state: State = {
      client,
      released: false,
      finished: false,
      timedOut: false,
      committing: false,
    };
    sessions.set(context, state);
    let rejectAborted: (error: TechnicalError) => void = () => undefined;
    const aborted = new Promise<never>((_resolve, reject) => {
      rejectAborted = reject;
    });
    // begin/lock can fail before the execution service attaches its race observer.
    void aborted.catch(() => undefined);
    const onConnectionError = () => {
      void release(true);
      rejectAborted(new TechnicalError(state.committing ? 'uncertain' : 'retryable'));
    };
    const release = (discard = false): Promise<void> => {
      if (timer) clearTimeout(timer);
      if (!state.released) {
        state.released = true;
        client.removeListener('error', onConnectionError);
        client.release(discard || !state.finished);
      }
      return Promise.resolve();
    };
    client.on('error', onConnectionError);
    const timer = setTimeout(() => {
      state.timedOut = true;
      void release(true);
      rejectAborted(new TechnicalError(state.committing ? 'uncertain' : 'retryable'));
    }, this.bounds.deadlineMs ?? 30_000);
    timer.unref();
    try {
      await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
      await client.query(
        "SELECT set_config('lock_timeout', $1, true), set_config('statement_timeout', $2, true)",
        [
          `${this.bounds.lockTimeoutMs ?? 5_000}ms`,
          `${this.bounds.statementTimeoutMs ?? 15_000}ms`,
        ],
      );
    } catch {
      await release(true);
      throw new TechnicalError('retryable');
    }
    return {
      context,
      aborted,
      async decisionTime() {
        const result = await transactionClient(context).query<{ decision_time: Date }>(
          'SELECT clock_timestamp() AS decision_time',
        );
        const value = result.rows[0]?.decision_time;
        if (!(value instanceof Date) || !Number.isFinite(value.getTime()))
          throw new TechnicalError('retryable');
        return value;
      },
      async lock(words) {
        await transactionClient(context).query(
          'SELECT pg_advisory_xact_lock($1::integer, $2::integer)',
          [...words],
        );
      },
      async savepoint() {
        await transactionClient(context).query('SAVEPOINT handler_work');
      },
      async rollbackToSavepoint() {
        await transactionClient(context).query('ROLLBACK TO SAVEPOINT handler_work');
      },
      async commit() {
        if (state.timedOut || state.released || state.finished)
          throw new TechnicalError('retryable');
        try {
          state.committing = true;
          const response = await client.query('COMMIT');
          if (response.command !== 'COMMIT') {
            state.finished = true;
            throw new TechnicalError('retryable');
          }
          state.finished = true;
        } catch (error) {
          // The server may have committed before the connection disappeared.
          await release(true);
          if (error instanceof TechnicalError) throw error;
          if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            typeof error.code === 'string' &&
            ['40001', '40P01', '57014', '55P03'].includes(error.code)
          ) {
            throw new TechnicalError('retryable');
          }
          throw new TechnicalError('uncertain');
        }
      },
      async rollback() {
        if (state.released || state.finished) return;
        try {
          await client.query('ROLLBACK');
          state.finished = true;
        } catch {
          await release(true);
        }
      },
      release,
    };
  }
}
