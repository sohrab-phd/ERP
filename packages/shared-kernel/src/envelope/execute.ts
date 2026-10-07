import { randomUUID } from 'node:crypto';
import { AdmissionError, admitCommand, validUuid, validateContext } from './admission.js';
import { advisoryLockWords, bindCommand, outcomeKey, sameBinding } from './binding.js';
import { canonicalJson, freezeJson, JSON_LIMITS } from './canonical-json.js';
import type { CommandContract, CommandDecision, CommandRequest } from './command.js';
import type { CommandRegistry } from './command.js';
import {
  BusinessRejection,
  GUARD_FAMILIES,
  isTechnicalDatabaseError,
  TechnicalError,
} from './guards.js';
import type { GuardRejection } from './guards.js';
import type {
  AuditStore,
  AuthorizationPort,
  OutcomeStore,
  RecoveryFence,
  TransactionPort,
  TransactionSession,
  StoredOutcome,
} from './ports.js';
import type { ExecutionResult, StableResult } from './result.js';
import type { ExecutionContext } from '../security/execution-context.js';
import type { AuditEvent, AuditKind } from '../audit/audit-event.js';

export interface ExecutionPorts {
  readonly admissionDeadlineMs?: number;
  readonly registry: CommandRegistry;
  readonly transactions: TransactionPort;
  readonly outcomes: OutcomeStore;
  readonly audits: AuditStore;
  readonly authorization: AuthorizationPort;
  readonly recoveryFence: RecoveryFence;
}

async function boundedAdmission(operation: () => Promise<void>, milliseconds = 30_000) {
  if (!Number.isInteger(milliseconds) || milliseconds < 1 || milliseconds > 30_000)
    throw new TechnicalError('retryable');
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new TechnicalError('retryable')), milliseconds);
  });
  try {
    await Promise.race([operation(), deadline]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function technical(error: unknown, attemptId: string): ExecutionResult {
  return {
    status: 'technical',
    kind: error instanceof TechnicalError ? error.kind : 'retryable',
    attemptId,
    message: 'Command infrastructure unavailable; retry the same bound key.',
  };
}
function denied(attemptId: string, family: 'GUARD_ACTOR' | 'GUARD_INVARIANT'): ExecutionResult {
  return { status: 'admission-denied', family, attemptId, message: 'Command admission denied.' };
}
function admissionKind(context: ExecutionContext, error: AdmissionError): AuditKind {
  if (context.temporary === true) return 'AUD-ACTOR-TEMP';
  try {
    validateContext(context);
  } catch {
    return 'AUD-AUTHN-FAIL';
  }
  return error.family === 'GUARD_ACTOR' ? 'AUD-ISOLATION-DENY' : 'AUD-CMD-ADMISSION-DENIED';
}
function audit(
  context: ExecutionContext,
  kind: AuditKind,
  request?: CommandRequest,
  stored?: StoredOutcome,
): AuditEvent {
  return {
    eventId: randomUUID(),
    eventKind: kind,
    installationId: context.installationId,
    authorityScopeId: context.authorityScopeId,
    principalIssuer: context.principal.issuer,
    principalSubject: context.principal.subject,
    actorRole: context.actorRole,
    requestId: context.requestId,
    occurredAt: new Date(),
    safeDetails: {},
    ...(context.customerScope === undefined ? {} : { customerScope: context.customerScope }),
    ...(request === undefined
      ? {}
      : {
          idempotencyKey: request.idempotency_key,
          command: request.command,
          commandVersion: request.contract_version,
        }),
    ...(stored === undefined ? {} : { executionId: stored.executionId }),
  };
}
async function commit(session: TransactionSession): Promise<void> {
  try {
    await session.commit();
  } catch (error) {
    if (error instanceof TechnicalError) throw error;
    if (
      isTechnicalDatabaseError(error) &&
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      ['40001', '40P01', '57014', '55P03'].includes(String(error.code))
    )
      throw new TechnicalError('retryable');
    throw new TechnicalError('uncertain');
  }
}
async function abandon(session: TransactionSession, discard: boolean): Promise<void> {
  try {
    await session.rollback();
  } catch {
    discard = true;
  }
  try {
    await session.release(discard);
  } catch {
    /* A failed cleanup cannot become a business outcome. */
  }
}
async function admissionAudit(
  context: ExecutionContext,
  ports: ExecutionPorts,
  kind: AuditKind,
): Promise<void> {
  if (!validUuid(context.installationId) || !validUuid(context.requestId))
    throw new TechnicalError();
  let event: AuditEvent = {
    eventId: randomUUID(),
    eventKind: kind,
    installationId: context.installationId,
    requestId: context.requestId,
    occurredAt: new Date(),
    safeDetails: {},
  };
  try {
    validateContext({ ...context, temporary: false });
    event = audit(context, kind);
  } catch {
    /* Do not persist invalid/unbound identity fields. */
  }
  const session = await ports.transactions.begin();
  try {
    const persist = async () => {
      await ports.audits.append(session.context, event);
      await commit(session);
      await session.release();
    };
    const pending = persist();
    await (session.aborted === undefined ? pending : Promise.race([pending, session.aborted]));
  } catch (error) {
    await abandon(session, error instanceof TechnicalError && error.kind === 'uncertain');
    throw error;
  }
}
function stableResult(request: CommandRequest, decision: CommandDecision): StableResult {
  const common = { command: request.command, idempotency_key: request.idempotency_key };
  let result: StableResult;
  if (decision.outcome === 'accepted') {
    result = {
      outcome: 'accepted',
      ...common,
      ...(decision.factIdentity === undefined ? {} : { fact_identity: decision.factIdentity }),
      ...(decision.sourceState === undefined ? {} : { source_state: decision.sourceState }),
      ...(decision.targetState === undefined ? {} : { target_state: decision.targetState }),
      ...(decision.event === undefined ? {} : { event: decision.event }),
      ...(decision.data === undefined ? {} : { data: decision.data }),
    };
  } else {
    const rejection = decision.rejection;
    validateRejection(rejection);
    result = {
      outcome: 'rejected',
      ...common,
      family: rejection.family,
      message: rejection.message,
      ...(rejection.openItem === undefined ? {} : { open_item: rejection.openItem }),
    };
  }
  canonicalJson(result, JSON_LIMITS.resultBytes);
  return freezeJson(result);
}
function validateRejection(rejection: GuardRejection): void {
  if (
    !GUARD_FAMILIES.includes(rejection.family) ||
    typeof rejection.message !== 'string' ||
    rejection.message.length === 0 ||
    (rejection.family === 'GUARD_OPEN_POLICY'
      ? typeof rejection.openItem !== 'string' ||
        !/^(?:OQ-[0-9]+|workshop-commercial-practice)$/u.test(rejection.openItem)
      : rejection.openItem !== undefined)
  )
    throw new TechnicalError();
}
async function evaluate(
  contract: CommandContract,
  request: CommandRequest,
  context: ExecutionContext,
  session: TransactionSession,
): Promise<CommandDecision> {
  if (!contract.active || contract.execute === undefined) throw new AdmissionError();
  try {
    return await contract.execute(request, context, session.context);
  } catch (error) {
    if (isTechnicalDatabaseError(error)) throw error;
    if (error instanceof BusinessRejection)
      return { outcome: 'rejected', rejection: error.rejection };
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === '23505' &&
      'constraint' in error &&
      typeof error.constraint === 'string'
    ) {
      const maps = contract.constraintRejections;
      const mapper =
        maps !== undefined && Object.prototype.hasOwnProperty.call(maps, error.constraint)
          ? maps[error.constraint]
          : undefined;
      if (mapper !== undefined) {
        await session.rollbackToSavepoint();
        const rejection = await mapper(request, context, session.context);
        if (rejection !== undefined) return { outcome: 'rejected', rejection };
      }
    }
    throw new TechnicalError();
  }
}

/** No hidden retry loop: uncertainty resolves only via an explicit same-key attempt against the primary. */
export async function executeCommand(
  input: string | Uint8Array,
  suppliedContext: ExecutionContext,
  ports: ExecutionPorts,
): Promise<ExecutionResult> {
  // Preserve an immutable server-issued capability's identity. Mutable callers
  // still receive the foundation defensive snapshot; identity adapters reject
  // copies/forgeries rather than trusting matching claims.
  const context: ExecutionContext =
    Object.isFrozen(suppliedContext) && Object.isFrozen(suppliedContext.principal)
      ? suppliedContext
      : Object.freeze({
          ...suppliedContext,
          principal: Object.freeze({ ...suppliedContext.principal }),
        });
  const attemptId = context.requestId;
  let request: CommandRequest, contract: CommandContract;
  try {
    const admitted = admitCommand(input, context, ports.registry);
    request = admitted.request;
    contract = admitted.contract;
    await boundedAdmission(async () => {
      if (!(await ports.recoveryFence.permitsAdmission(context)))
        throw new TechnicalError('incompatible');
      if (!(await ports.authorization.canExecute(context, request)))
        throw new AdmissionError('GUARD_ACTOR');
    }, ports.admissionDeadlineMs);
  } catch (error) {
    if (!(error instanceof AdmissionError)) return technical(error, attemptId);
    try {
      await admissionAudit(context, ports, admissionKind(context, error));
    } catch (auditError) {
      return technical(auditError, attemptId);
    }
    return denied(attemptId, error.family);
  }
  let binding: ReturnType<typeof bindCommand>;
  try {
    binding = bindCommand(request, context);
  } catch {
    try {
      await admissionAudit(context, ports, 'AUD-CMD-ADMISSION-DENIED');
    } catch (error) {
      return technical(error, attemptId);
    }
    return denied(attemptId, 'GUARD_INVARIANT');
  }
  const key = outcomeKey(request, context);
  let session: TransactionSession | undefined;
  try {
    session = await ports.transactions.begin();
    const activeSession = session;
    const protocol = async (): Promise<ExecutionResult> => {
      await activeSession.lock(advisoryLockWords(key));
      // Separate post-lock lookup must see a committed predecessor's fresh READ COMMITTED snapshot.
      const existing = await ports.outcomes.find(activeSession.context, key);
      if (!(await ports.recoveryFence.permitsAdmission(context)))
        throw new TechnicalError('incompatible');
      if (!(await ports.authorization.canExecute(context, request, activeSession.context))) {
        await ports.audits.append(
          activeSession.context,
          audit(context, 'AUD-ISOLATION-DENY', request),
        );
        await commit(activeSession);
        await activeSession.release();
        return denied(attemptId, 'GUARD_ACTOR');
      }
      if (existing !== undefined) {
        if (
          existing.binding.principal.issuer !== binding.principal.issuer ||
          existing.binding.principal.subject !== binding.principal.subject ||
          existing.binding.command !== binding.command ||
          existing.binding.commandVersion !== binding.commandVersion
        ) {
          await ports.audits.append(
            activeSession.context,
            audit(context, 'AUD-CMD-CONFLICT', request),
          );
          await commit(activeSession);
          await activeSession.release();
          return {
            status: 'conflict',
            family: 'GUARD_CONFLICT',
            attemptId,
            message: 'Idempotency key is bound to another intent.',
          };
        }
        if (existing.binding.canonicalizationVersion !== 1 || existing.resultSchemaVersion !== 1)
          throw new TechnicalError('incompatible');
        if (!sameBinding(existing.binding, binding)) {
          await ports.audits.append(
            activeSession.context,
            audit(context, 'AUD-CMD-CONFLICT', request),
          );
          await commit(activeSession);
          await activeSession.release();
          return {
            status: 'conflict',
            family: 'GUARD_CONFLICT',
            attemptId,
            message: 'Idempotency key is bound to another intent.',
          };
        }
        if (
          !(await ports.authorization.canReplay(
            context,
            request,
            existing.result,
            activeSession.context,
          ))
        ) {
          await ports.audits.append(
            activeSession.context,
            audit(context, 'AUD-ISOLATION-DENY', request),
          );
          await commit(activeSession);
          await activeSession.release();
          return denied(attemptId, 'GUARD_ACTOR');
        }
        canonicalJson(existing.result, JSON_LIMITS.resultBytes);
        await ports.audits.append(
          activeSession.context,
          audit(context, 'AUD-CMD-REPLAYED', request, existing),
        );
        await commit(activeSession);
        await activeSession.release();
        return {
          status: 'completed',
          result: freezeJson(existing.result),
          executionId: existing.executionId,
          attemptId,
          replayed: true,
        };
      }
      if (!contract.active || contract.execute === undefined) {
        await ports.audits.append(
          activeSession.context,
          audit(context, 'AUD-CMD-ADMISSION-DENIED', request),
        );
        await commit(activeSession);
        await activeSession.release();
        return denied(attemptId, 'GUARD_INVARIANT');
      }
      const executionId = randomUUID();
      await activeSession.savepoint();
      const decision = await evaluate(contract, request, context, activeSession);
      // A classifier also sees the owner transaction port. None of its tentative
      // effects may survive a rejected command, even after earlier SQL recovery.
      if (decision.outcome === 'rejected') await activeSession.rollbackToSavepoint();
      const result = stableResult(request, decision);
      const kind = result.outcome === 'accepted' ? 'AUD-CMD-ACCEPTED' : 'AUD-CMD-REJECTED';
      const originalAuditId = randomUUID(),
        completedAt = await activeSession.decisionTime();
      const outcome: StoredOutcome = {
        key,
        binding,
        executionId,
        resultSchemaVersion: 1,
        outcomeKind: result.outcome === 'accepted' ? 'ACCEPTED' : 'REJECTED',
        result,
        decisionAuditKind: kind,
        firstRequestId: context.requestId,
        completedAt,
        originalAuditId,
        ...(result.outcome === 'rejected'
          ? {
              family: result.family,
              ...(result.open_item === undefined ? {} : { openItem: result.open_item }),
            }
          : {}),
      };
      const event: AuditEvent = {
        ...audit(context, kind, request, outcome),
        eventId: originalAuditId,
        occurredAt: completedAt,
        ...(result.outcome === 'rejected'
          ? {
              family: result.family,
              ...(result.open_item === undefined ? {} : { openItem: result.open_item }),
            }
          : {
              ...(result.fact_identity === undefined ? {} : { factIdentity: result.fact_identity }),
              ...(result.source_state === undefined ? {} : { sourceState: result.source_state }),
              ...(result.target_state === undefined ? {} : { targetState: result.target_state }),
            }),
      };
      await ports.audits.append(activeSession.context, event);
      if (result.outcome === 'rejected' && result.family === 'GUARD_OPEN_POLICY') {
        await ports.audits.append(activeSession.context, {
          ...event,
          eventId: randomUUID(),
          eventKind: 'AUD-OPEN-POLICY',
        });
      }
      await ports.outcomes.insert(activeSession.context, outcome);
      await commit(activeSession);
      await activeSession.release();
      return { status: 'completed', result, executionId, attemptId, replayed: false };
    };
    const pending = protocol();
    // The adapter abort promise rejects only after invalidating the capability
    // and destroying the client. Late handler continuations cannot write/commit.
    return await (activeSession.aborted === undefined
      ? pending
      : Promise.race([pending, activeSession.aborted]));
  } catch (error) {
    if (session !== undefined)
      await abandon(session, error instanceof TechnicalError && error.kind === 'uncertain');
    return technical(error, attemptId);
  }
}
