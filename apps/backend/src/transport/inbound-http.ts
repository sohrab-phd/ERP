import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  BusinessRejection,
  parseBoundedJson,
  validUuid,
  type ExecutionContext,
  type ExecutionResult,
} from '@navard/shared-kernel';
import { IdentityError, type IdentityService } from '../modules/identity/index.js';
import type { InboundQueryName } from '../modules/procurement/index.js';
import { requestJson, sessionToken } from './identity-http.js';
import { respond } from './http-errors.js';
import { browserRequest } from './browser-session.js';

export interface InboundHttpPorts {
  identity: IdentityService;
  command(input: string, context: ExecutionContext): Promise<ExecutionResult>;
  query(
    kind: InboundQueryName,
    input: Record<string, unknown>,
    context: ExecutionContext,
  ): Promise<unknown>;
}

const responseBudget = 262144;

/** Dedicated order reader: legacy purchasing/Identity body limits remain unchanged. */
export async function inboundRequestJson(
  request: IncomingMessage,
): Promise<Record<string, unknown>> {
  const suppliedLength = request.headers['content-length'];
  const length = Number(suppliedLength);
  if (
    typeof suppliedLength !== 'string' ||
    !/^[0-9]+$/u.test(suppliedLength) ||
    !Number.isInteger(length) ||
    length < 2 ||
    length > 262144 ||
    request.headers['transfer-encoding'] ||
    !/^application\/json(?:;\s*charset=utf-8)?$/iu.test(request.headers['content-type'] ?? '')
  )
    throw new IdentityError('invalid');
  const bytes = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const cleanup = () => {
      clearTimeout(timer);
      request.off('data', data);
      request.off('end', end);
      request.off('error', fail);
      request.off('aborted', fail);
    };
    const fail = () => {
      cleanup();
      request.pause();
      reject(new IdentityError('invalid'));
    };
    const data = (chunk: Buffer) => {
      size += chunk.length;
      if (size > length || size > 262144) fail();
      else chunks.push(chunk);
    };
    const end = () => {
      cleanup();
      if (size !== length) reject(new IdentityError('invalid'));
      else resolve(Buffer.concat(chunks));
    };
    const timer = setTimeout(fail, 5000);
    request.on('data', data);
    request.once('end', end);
    request.once('error', fail);
    request.once('aborted', fail);
  });
  let parsed;
  try {
    parsed = parseBoundedJson(bytes);
  } catch {
    throw new IdentityError('invalid');
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed))
    throw new IdentityError('invalid');
  return parsed as Record<string, unknown>;
}

function queryFields(input: Record<string, unknown>, required: string[], optional: string[] = []) {
  if (
    required.some((name) => !Object.hasOwn(input, name)) ||
    Object.keys(input).some((name) => !required.includes(name) && !optional.includes(name))
  )
    throw new IdentityError('invalid');
}

function boundedReply(response: ServerResponse, status: number, value: unknown) {
  if (Buffer.byteLength(JSON.stringify(value), 'utf8') > responseBudget)
    respond(response, 503, { error: 'unavailable' });
  else respond(response, status, value);
}

/** Closed I1 operations, individually authenticated role selection, and no receiving authority. */
export function createInboundHandler(ports: InboundHttpPorts) {
  let active = 0;
  return async (request: IncomingMessage, response: ServerResponse) => {
    if (active >= 16) {
      response.setHeader('connection', 'close');
      respond(response, 503, { error: 'unavailable' });
      request.resume();
      return;
    }
    active++;
    try {
      if (request.headers.origin !== undefined && !browserRequest(request))
        throw new IdentityError('forbidden');
      const route = request.url ?? '';
      const register = route === '/purchasing/operational-orders';
      const add = route === '/purchasing/inbound-catalogues';
      const lookup = route === '/purchasing/operational-orders/lookup';
      const catalogueQuery = route === '/purchasing/inbound-catalogues/query';
      const match = /^\/purchasing\/operational-orders\/([0-9a-f-]+)$/u.exec(route);
      if (!register && !add && !lookup && !catalogueQuery && (!match || !validUuid(match[1]))) {
        respond(response, 404, { error: 'not-found' });
        return;
      }
      const method = match ? 'GET' : 'POST';
      if (request.method !== method) {
        response.setHeader('allow', method);
        respond(response, 405, { error: 'method-not-allowed' });
        return;
      }
      const selector = request.headers['x-erp-role'];
      const selectors = request.rawHeaders.filter(
        (_, index) => index % 2 === 0 && request.rawHeaders[index]?.toLowerCase() === 'x-erp-role',
      ).length;
      if (
        selectors !== 1 ||
        (selector !== 'ACT-PROC' && selector !== 'ACT-WH') ||
        (register && selector !== 'ACT-PROC')
      )
        throw new IdentityError('forbidden');
      const context = await ports.identity.context(sessionToken(request), selector);
      if (
        request.headers['content-encoding'] !== undefined ||
        request.headers['transfer-encoding'] !== undefined
      )
        throw new IdentityError('invalid');
      if (match) {
        if (Number(request.headers['content-length'] ?? 0) !== 0)
          throw new IdentityError('invalid');
        const data = await ports.query(
          'GetOperationalPurchaseOrder',
          { orderId: match[1] },
          context,
        );
        if (data === undefined) respond(response, 404, { error: 'not-found' });
        else boundedReply(response, 200, { data });
      } else {
        if (request.destroyed || request.aborted) throw new IdentityError('invalid');
        const input = register ? await inboundRequestJson(request) : await requestJson(request);
        if (register || add) {
          if (
            input.command !==
            (register ? 'RegisterOperationalPurchaseOrder' : 'AddInboundCatalogueOption')
          )
            throw new IdentityError('invalid');
          const result = await ports.command(JSON.stringify(input), context);
          const status =
            result.status === 'completed'
              ? result.result.outcome === 'accepted'
                ? 200
                : 422
              : result.status === 'conflict'
                ? 409
                : result.status === 'admission-denied'
                  ? 403
                  : 503;
          boundedReply(response, status, result);
        } else {
          if (lookup) queryFields(input, ['orderReference']);
          else queryFields(input, ['catalogue'], ['exactLabel', 'afterId', 'limit']);
          const data = await ports.query(
            lookup ? 'GetOperationalPurchaseOrderByReference' : 'ListInboundCatalogueOptions',
            input,
            context,
          );
          if (data === undefined) respond(response, 404, { error: 'not-found' });
          else boundedReply(response, 200, { data });
        }
      }
    } catch (error) {
      const status =
        error instanceof IdentityError
          ? error.kind === 'unauthenticated'
            ? 401
            : error.kind === 'forbidden'
              ? 403
              : 400
          : error instanceof BusinessRejection
            ? error.rejection.family === 'GUARD_ACTOR'
              ? 403
              : 400
            : 503;
      // An invalid/unauthorized body must not leave an unbounded drain on a reusable socket.
      response.setHeader('connection', 'close');
      respond(response, status, {
        error:
          status === 401
            ? 'unauthenticated'
            : status === 403
              ? 'forbidden'
              : status === 400
                ? 'invalid'
                : 'unavailable',
      });
    } finally {
      active--;
      request.resume();
    }
  };
}
