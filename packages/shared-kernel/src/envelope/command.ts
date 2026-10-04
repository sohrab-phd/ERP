import type { JsonObject } from './canonical-json.js';
import type { GuardRejection } from './guards.js';
import type { ExecutionContext, TransactionContext } from '../security/execution-context.js';
export interface CommandTarget {
  readonly kind: string;
  readonly id: string;
}
export interface CommandRequest {
  readonly command: string;
  readonly contract_version: number;
  readonly idempotency_key: string;
  readonly target: CommandTarget;
  readonly payload: JsonObject;
  readonly preconditions: JsonObject;
}
export type FieldShape =
  | { readonly type: 'scalar' }
  | { readonly type: 'object'; readonly fields: Readonly<Record<string, FieldShape>> }
  | { readonly type: 'array'; readonly element: FieldShape };
export interface AcceptedDecision {
  readonly outcome: 'accepted';
  readonly factIdentity?: string;
  readonly sourceState?: string;
  readonly targetState?: string;
  readonly event?: string;
  readonly data?: JsonObject;
}
export interface RejectedDecision {
  readonly outcome: 'rejected';
  readonly rejection: GuardRejection;
}
export type CommandDecision = AcceptedDecision | RejectedDecision;
export interface CommandContract {
  readonly command: string;
  readonly version: number;
  readonly active: boolean;
  readonly payloadShape: Readonly<Record<string, FieldShape>>;
  readonly preconditionsShape: Readonly<Record<string, FieldShape>>;
  readonly execute?: (
    request: CommandRequest,
    context: ExecutionContext,
    transaction: TransactionContext,
  ) => Promise<CommandDecision>;
  /** Explicit owner mapping only; invoked after recovering the handler savepoint. */
  readonly constraintRejections?: Readonly<
    Record<
      string,
      (
        request: CommandRequest,
        context: ExecutionContext,
        transaction: TransactionContext,
      ) => Promise<GuardRejection | undefined>
    >
  >;
}
export class CommandRegistry {
  private readonly contracts = new Map<string, CommandContract>();
  constructor(contracts: readonly CommandContract[] = []) {
    for (const c of contracts) {
      const k = JSON.stringify([c.command, c.version]);
      if (this.contracts.has(k) || (c.active && c.execute === undefined))
        throw new Error('Invalid command registration');
      this.contracts.set(k, c);
    }
  }
  find(command: string, version: number): CommandContract | undefined {
    return this.contracts.get(JSON.stringify([command, version]));
  }
}
