import type { JsonObject } from '../envelope/canonical-json.js';
import type { GuardFamily } from '../envelope/guards.js';
export type AuditKind =
  | 'AUD-CMD-ACCEPTED'
  | 'AUD-CMD-REJECTED'
  | 'AUD-CMD-REPLAYED'
  | 'AUD-CMD-CONFLICT'
  | 'AUD-CMD-ADMISSION-DENIED'
  | 'AUD-AUTHN-FAIL'
  | 'AUD-ACTOR-TEMP'
  | 'AUD-ISOLATION-DENY'
  | 'AUD-SOD'
  | 'AUD-REVERSAL'
  | 'AUD-OPEN-POLICY';
export interface AuditEvent {
  readonly eventId: string;
  readonly executionId?: string;
  readonly eventKind: AuditKind;
  readonly installationId: string;
  readonly authorityScopeId?: string;
  readonly idempotencyKey?: string;
  readonly principalIssuer?: string;
  readonly principalSubject?: string;
  readonly actorRole?: string;
  readonly command?: string;
  readonly commandVersion?: number;
  readonly requestId: string;
  readonly occurredAt: Date;
  readonly family?: GuardFamily;
  readonly openItem?: string;
  readonly factIdentity?: string;
  readonly sourceState?: string;
  readonly targetState?: string;
  readonly customerScope?: string;
  readonly safeDetails: JsonObject;
}
