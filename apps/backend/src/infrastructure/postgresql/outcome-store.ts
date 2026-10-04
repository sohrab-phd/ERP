import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import {
  TechnicalError,
  type OutcomeKey,
  type OutcomeStore,
  type StoredOutcome,
  type TransactionContext,
} from '@navard/shared-kernel';
import { transactionClient } from './transaction.js';

interface OutcomeRow {
  installation_id: string;
  authority_scope_id: string;
  idempotency_key: string;
  execution_id: string;
  principal_issuer: string;
  principal_subject: string;
  command: string;
  command_version: number;
  target_kind: string;
  target_id: string;
  canonicalization_version: number;
  canonical_bytes: Buffer;
  payload_sha256: string;
  result_schema_version: number;
  outcome_kind: StoredOutcome['outcomeKind'];
  family: StoredOutcome['family'] | null;
  open_item: string | null;
  result: StoredOutcome['result'];
  decision_audit_kind: StoredOutcome['decisionAuditKind'];
  first_request_id: string;
  completed_at: Date;
  original_audit_id: string;
}

export class PostgresOutcomes implements OutcomeStore {
  async find(context: TransactionContext, key: OutcomeKey): Promise<StoredOutcome | undefined> {
    // A distinct statement after lock acquisition is required for READ COMMITTED.
    const result = await transactionClient(context).query<OutcomeRow>(
      'SELECT * FROM kernel.command_outcome WHERE installation_id=$1 AND authority_scope_id=$2 AND idempotency_key=$3',
      [key.installationId, key.authorityScopeId, key.idempotencyKey],
    );
    const row = result.rows[0];
    if (!row) return undefined;
    if (createHash('sha256').update(row.canonical_bytes).digest('hex') !== row.payload_sha256) {
      throw new TechnicalError('incompatible');
    }
    return {
      key: {
        installationId: row.installation_id,
        authorityScopeId: row.authority_scope_id,
        idempotencyKey: row.idempotency_key,
      },
      binding: {
        principal: { issuer: row.principal_issuer, subject: row.principal_subject },
        command: row.command,
        commandVersion: row.command_version,
        targetKind: row.target_kind,
        targetId: row.target_id,
        canonicalizationVersion: row.canonicalization_version,
        canonicalBytes: row.canonical_bytes,
        payloadSha256: row.payload_sha256,
      },
      executionId: row.execution_id,
      resultSchemaVersion: row.result_schema_version,
      outcomeKind: row.outcome_kind,
      ...(row.family ? { family: row.family } : {}),
      ...(row.open_item ? { openItem: row.open_item } : {}),
      result: row.result,
      decisionAuditKind: row.decision_audit_kind,
      firstRequestId: row.first_request_id,
      completedAt: row.completed_at,
      originalAuditId: row.original_audit_id,
    };
  }

  async insert(context: TransactionContext, outcome: StoredOutcome): Promise<void> {
    const binding = outcome.binding;
    if (
      binding.canonicalBytes.byteLength < 1 ||
      binding.canonicalBytes.byteLength > 262_144 ||
      createHash('sha256').update(binding.canonicalBytes).digest('hex') !== binding.payloadSha256 ||
      Buffer.byteLength(JSON.stringify(outcome.result), 'utf8') > 262_144
    ) {
      throw new TechnicalError('incompatible');
    }
    await transactionClient(context).query(
      `INSERT INTO kernel.command_outcome (
        installation_id,authority_scope_id,idempotency_key,execution_id,principal_issuer,principal_subject,
        command,command_version,target_kind,target_id,canonicalization_version,canonical_bytes,payload_sha256,
        result_schema_version,outcome_kind,family,open_item,result,decision_audit_kind,first_request_id,completed_at,original_audit_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
      [
        outcome.key.installationId,
        outcome.key.authorityScopeId,
        outcome.key.idempotencyKey,
        outcome.executionId,
        binding.principal.issuer,
        binding.principal.subject,
        binding.command,
        binding.commandVersion,
        binding.targetKind,
        binding.targetId,
        binding.canonicalizationVersion,
        Buffer.from(binding.canonicalBytes),
        binding.payloadSha256,
        outcome.resultSchemaVersion,
        outcome.outcomeKind,
        outcome.family ?? null,
        outcome.openItem ?? null,
        JSON.stringify(outcome.result),
        outcome.decisionAuditKind,
        outcome.firstRequestId,
        outcome.completedAt,
        outcome.originalAuditId,
      ],
    );
  }
}
