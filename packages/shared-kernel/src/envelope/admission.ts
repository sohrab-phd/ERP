import { Buffer } from 'node:buffer';
import type { CommandContract, CommandRequest, FieldShape } from './command.js';
import type { CommandRegistry } from './command.js';
import { isJsonObject, parseBoundedJson, validUnicode, freezeJson } from './canonical-json.js';
import type { JsonObject, JsonValue } from './canonical-json.js';
import type { ExecutionContext } from '../security/execution-context.js';
export class AdmissionError extends Error {
  constructor(readonly family: 'GUARD_ACTOR' | 'GUARD_INVARIANT' = 'GUARD_INVARIANT') {
    super('Command admission denied');
    this.name = 'AdmissionError';
  }
}
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
export function validUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value);
}
export function validIdempotencyKey(value: unknown): value is string {
  return typeof value === 'string' && UUID_V4.test(value);
}
function text(value: unknown, maximum: number): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    validUnicode(value) &&
    Buffer.byteLength(value, 'utf8') <= maximum
  );
}
function exactNames(object: JsonObject, names: readonly string[]): void {
  if (Object.keys(object).some((key) => !names.includes(key))) throw new AdmissionError();
}
const credentials =
  /^(?:password|passwd|secret|token|authorization|credential|api[_-]?key|connection[_-]?string)$/iu;
function fields(value: JsonObject, allowed: Readonly<Record<string, FieldShape>>): void {
  for (const [key, child] of Object.entries(value)) {
    const shape = Object.prototype.hasOwnProperty.call(allowed, key) ? allowed[key] : undefined;
    if (shape === undefined || credentials.test(key)) throw new AdmissionError();
    checkShape(child, shape);
  }
}
function checkShape(value: JsonValue, shape: FieldShape): void {
  if (shape.type === 'scalar') {
    if (typeof value === 'object' && value !== null) throw new AdmissionError();
  } else if (shape.type === 'object') {
    if (!isJsonObject(value)) throw new AdmissionError();
    fields(value, shape.fields);
  } else {
    if (!Array.isArray(value)) throw new AdmissionError();
    for (const child of value as readonly JsonValue[]) checkShape(child, shape.element);
  }
}
export function validateContext(context: ExecutionContext): void {
  if (
    !validUuid(context.installationId) ||
    !validUuid(context.authorityScopeId) ||
    !validUuid(context.requestId) ||
    !text(context.principal.issuer, 256) ||
    !text(context.principal.subject, 256) ||
    !text(context.actorRole, 128) ||
    !/^ACT-[A-Z0-9-]+$/u.test(context.actorRole) ||
    context.temporary === true ||
    (context.customerScope !== undefined && !text(context.customerScope, 256))
  )
    throw new AdmissionError('GUARD_ACTOR');
}
export interface AdmittedCommand {
  readonly request: CommandRequest;
  readonly contract: CommandContract;
}
export function admitCommand(
  input: string | Uint8Array,
  context: ExecutionContext,
  registry: CommandRegistry,
): AdmittedCommand {
  validateContext(context);
  let parsed: JsonValue;
  try {
    parsed = parseBoundedJson(input);
  } catch {
    throw new AdmissionError();
  }
  if (!isJsonObject(parsed)) throw new AdmissionError();
  exactNames(parsed, [
    'command',
    'contract_version',
    'idempotency_key',
    'target',
    'payload',
    'preconditions',
  ]);
  const {
    command,
    contract_version: version,
    idempotency_key: key,
    target,
    payload,
    preconditions,
  } = parsed;
  if (
    !text(command, 128) ||
    typeof version !== 'number' ||
    !Number.isInteger(version) ||
    version < 1 ||
    version > 2147483647 ||
    !validIdempotencyKey(key) ||
    target === undefined ||
    !isJsonObject(target) ||
    payload === undefined ||
    !isJsonObject(payload) ||
    preconditions === undefined ||
    !isJsonObject(preconditions)
  )
    throw new AdmissionError();
  exactNames(target, ['kind', 'id']);
  if (!text(target.kind, 64) || !text(target.id, 256)) throw new AdmissionError();
  const contract = registry.find(command, version);
  if (contract === undefined) throw new AdmissionError();
  fields(payload, contract.payloadShape);
  fields(preconditions, contract.preconditionsShape);
  freezeJson(parsed);
  return {
    request: Object.freeze({
      command,
      contract_version: version,
      idempotency_key: key,
      target: Object.freeze({ kind: target.kind, id: target.id }),
      payload,
      preconditions,
    }),
    contract,
  };
}
