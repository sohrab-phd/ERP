import { createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import type { CommandRequest } from './command.js';
import { canonicalJson } from './canonical-json.js';
import type { ExecutionContext, Principal } from '../security/execution-context.js';
export interface OutcomeKey {
  readonly installationId: string;
  readonly authorityScopeId: string;
  readonly idempotencyKey: string;
}
export interface CommandBinding {
  readonly principal: Principal;
  readonly command: string;
  readonly commandVersion: number;
  readonly targetKind: string;
  readonly targetId: string;
  readonly canonicalizationVersion: number;
  readonly canonicalBytes: Uint8Array;
  readonly payloadSha256: string;
}
export function outcomeKey(request: CommandRequest, context: ExecutionContext): OutcomeKey {
  return {
    installationId: context.installationId,
    authorityScopeId: context.authorityScopeId,
    idempotencyKey: request.idempotency_key,
  };
}
export function bindCommand(request: CommandRequest, context: ExecutionContext): CommandBinding {
  const canonicalBytes = canonicalJson({
    command: request.command,
    contract_version: request.contract_version,
    target: { kind: request.target.kind, id: request.target.id },
    payload: request.payload,
    preconditions: request.preconditions,
  });
  return {
    principal: { ...context.principal },
    command: request.command,
    commandVersion: request.contract_version,
    targetKind: request.target.kind,
    targetId: request.target.id,
    canonicalizationVersion: 1,
    canonicalBytes,
    payloadSha256: createHash('sha256').update(canonicalBytes).digest('hex'),
  };
}
export function sameBinding(a: CommandBinding, b: CommandBinding): boolean {
  return (
    a.principal.issuer === b.principal.issuer &&
    a.principal.subject === b.principal.subject &&
    a.command === b.command &&
    a.commandVersion === b.commandVersion &&
    a.targetKind === b.targetKind &&
    a.targetId === b.targetId &&
    a.canonicalizationVersion === b.canonicalizationVersion &&
    a.payloadSha256 === b.payloadSha256 &&
    Buffer.from(a.canonicalBytes).equals(Buffer.from(b.canonicalBytes))
  );
}
export function advisoryLockWords(key: OutcomeKey): readonly [number, number] {
  const hash = createHash('sha256');
  hash.update('COMMAND_KEY_LOCK_V1', 'ascii');
  for (const field of [key.installationId, key.authorityScopeId, key.idempotencyKey]) {
    const bytes = Buffer.from(field, 'utf8'),
      length = Buffer.alloc(4);
    length.writeUInt32BE(bytes.length);
    hash.update(length);
    hash.update(bytes);
  }
  const d = hash.digest();
  return [d.readInt32BE(0), d.readInt32BE(4)];
}
