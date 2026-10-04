import { Buffer } from 'node:buffer';
import type { JsonObject, JsonValue } from './canonical-json.js';
import { canonicalJson, freezeJson, validUnicode } from './canonical-json.js';
import { validateContext } from './admission.js';
import type { ExecutionContext } from '../security/execution-context.js';
export interface QueryRequest {
  readonly query: string;
  readonly parameters: JsonObject;
}
export interface QueryPort {
  read(request: QueryRequest, context: ExecutionContext): Promise<JsonValue>;
}
export interface QueryAuthorizationPort {
  canRead(context: ExecutionContext, request: QueryRequest): Promise<boolean>;
}
export async function executeQuery(
  request: QueryRequest,
  context: ExecutionContext,
  authorization: QueryAuthorizationPort,
  port: QueryPort,
): Promise<JsonValue> {
  validateContext(context);
  canonicalJson(request.parameters);
  freezeJson(request.parameters);
  if (
    !validUnicode(request.query) ||
    request.query.length === 0 ||
    Buffer.byteLength(request.query, 'utf8') > 128 ||
    !(await authorization.canRead(context, request))
  )
    throw new Error('Query admission denied');
  const snapshot = await port.read(request, context);
  canonicalJson(snapshot);
  return freezeJson(snapshot);
}
