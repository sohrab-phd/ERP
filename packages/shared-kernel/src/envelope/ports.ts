import type { AuditEvent, AuditKind } from '../audit/audit-event.js';
import type { ExecutionContext, TransactionContext } from '../security/execution-context.js';
import type { CommandBinding, OutcomeKey } from './binding.js';
import type { CommandRequest } from './command.js';
import type { GuardFamily } from './guards.js';
import type { StableResult } from './result.js';
export interface TransactionSession {
  /** Rejects only after the adapter invalidates the capability and aborts its client. */
  readonly aborted?: Promise<never>;
  readonly context: TransactionContext;
  decisionTime(): Promise<Date>;
  lock(words: readonly [number, number]): Promise<void>;
  savepoint(): Promise<void>;
  rollbackToSavepoint(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  release(discard?: boolean): Promise<void>;
}
export interface TransactionPort {
  begin(): Promise<TransactionSession>;
}
export interface StoredOutcome {
  readonly key: OutcomeKey;
  readonly binding: CommandBinding;
  readonly executionId: string;
  readonly resultSchemaVersion: number;
  readonly outcomeKind: 'ACCEPTED' | 'REJECTED';
  readonly family?: GuardFamily;
  readonly openItem?: string;
  readonly result: StableResult;
  readonly decisionAuditKind: Extract<AuditKind, 'AUD-CMD-ACCEPTED' | 'AUD-CMD-REJECTED'>;
  readonly firstRequestId: string;
  readonly completedAt: Date;
  readonly originalAuditId: string;
}
export interface OutcomeStore {
  find(context: TransactionContext, key: OutcomeKey): Promise<StoredOutcome | undefined>;
  insert(context: TransactionContext, outcome: StoredOutcome): Promise<void>;
}
export interface AuditStore {
  append(context: TransactionContext, event: AuditEvent): Promise<void>;
}
export interface AuthorizationPort {
  canExecute(context: ExecutionContext, request: CommandRequest): Promise<boolean>;
  canReplay(
    context: ExecutionContext,
    request: CommandRequest,
    result: StableResult,
  ): Promise<boolean>;
}
export interface RecoveryFence {
  permitsAdmission(context: ExecutionContext): Promise<boolean>;
}
