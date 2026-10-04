import { type AuditEvent, type AuditStore, type TransactionContext } from '@navard/shared-kernel';
import { transactionClient } from './transaction.js';

export class PostgresAudit implements AuditStore {
  async append(context: TransactionContext, event: AuditEvent): Promise<void> {
    await transactionClient(context).query(
      `INSERT INTO kernel.audit_event (
        event_id,execution_id,event_kind,installation_id,authority_scope_id,idempotency_key,
        principal_issuer,principal_subject,actor_role,command,command_version,request_id,occurred_at,
        family,open_item,fact_identity,source_state,target_state,customer_scope,safe_details
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
      [
        event.eventId,
        event.executionId ?? null,
        event.eventKind,
        event.installationId,
        event.authorityScopeId ?? null,
        event.idempotencyKey ?? null,
        event.principalIssuer ?? null,
        event.principalSubject ?? null,
        event.actorRole ?? null,
        event.command ?? null,
        event.commandVersion ?? null,
        event.requestId,
        event.occurredAt,
        event.family ?? null,
        event.openItem ?? null,
        event.factIdentity ?? null,
        event.sourceState ?? null,
        event.targetState ?? null,
        event.customerScope ?? null,
        JSON.stringify(event.safeDetails),
      ],
    );
  }
}
