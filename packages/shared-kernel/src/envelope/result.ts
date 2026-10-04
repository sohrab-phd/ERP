import type { JsonObject } from './canonical-json.js';
import type { GuardFamily, TechnicalKind } from './guards.js';
export interface StableAcceptedResult extends JsonObject {
  readonly outcome: 'accepted';
  readonly command: string;
  readonly idempotency_key: string;
  readonly fact_identity?: string;
  readonly source_state?: string;
  readonly target_state?: string;
  readonly event?: string;
  readonly data?: JsonObject;
}
export interface StableRejectedResult extends JsonObject {
  readonly outcome: 'rejected';
  readonly command: string;
  readonly idempotency_key: string;
  readonly family: GuardFamily;
  readonly message: string;
  readonly open_item?: string;
}
export type StableResult = StableAcceptedResult | StableRejectedResult;
export type ExecutionResult =
  | {
      readonly status: 'completed';
      readonly result: StableResult;
      readonly executionId: string;
      readonly attemptId: string;
      readonly replayed: boolean;
    }
  | {
      readonly status: 'conflict';
      readonly family: 'GUARD_CONFLICT';
      readonly attemptId: string;
      readonly message: string;
    }
  | {
      readonly status: 'admission-denied';
      readonly family: 'GUARD_ACTOR' | 'GUARD_INVARIANT';
      readonly attemptId: string;
      readonly message: string;
    }
  | {
      readonly status: 'technical';
      readonly kind: TechnicalKind;
      readonly attemptId: string;
      readonly message: string;
    };
