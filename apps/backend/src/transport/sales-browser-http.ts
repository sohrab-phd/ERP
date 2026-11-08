import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  parseBoundedJson,
  validUuid,
  type ExecutionContext,
  type ExecutionResult,
} from '@navard/shared-kernel';
import {
  IdentityError,
  type IdentityService,
  type SalesBrowserPrincipal,
} from '../modules/identity/index.js';
import { SalesReadError, type SalesReadKind } from '../modules/sales/index.js';
import { browserRequest, uniqueHeader } from './browser-session.js';
import { requestJson, sessionToken } from './identity-http.js';
import { respond } from './http-errors.js';

const kinds: readonly SalesReadKind[] = [
  'customers/query',
  'orders/query',
  'orders/detail',
  'assessments/query',
  'assessments/detail',
  'stock/query',
];
const commands = [
  'DraftSalesOrder',
  'SubmitSalesOrder',
  'DraftFulfillmentAssessment',
  'RecordFulfillmentStock',
  'RecordFulfillmentMake',
  'ConfirmSalesOrder',
];
async function body(request: IncomingMessage, signal: AbortSignal): Promise<unknown> {
  const length = Number(request.headers['content-length']);
  if (
    !uniqueHeader(request, 'content-length') ||
    !uniqueHeader(request, 'content-type') ||
    request.headers['transfer-encoding'] ||
    request.headers['content-encoding'] ||
    !Number.isInteger(length) ||
    length < 2 ||
    length > 8192 ||
    !/^application\/json(?:;\s*charset=utf-8)?$/iu.test(request.headers['content-type'] ?? '')
  )
    throw new SalesReadError(400, 'invalid');
  const bytes = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const clean = () => {
      request.off('data', data);
      request.off('end', end);
      request.off('error', fail);
      request.off('aborted', fail);
      signal.removeEventListener('abort', fail);
    };
    const fail = () => {
      clean();
      request.pause();
      reject(new SalesReadError(400, 'invalid'));
    };
    const data = (chunk: Buffer) => {
      size += chunk.length;
      if (size > length || size > 8192) fail();
      else chunks.push(chunk);
    };
    const end = () => {
      clean();
      if (size !== length) reject(new SalesReadError(400, 'invalid'));
      else resolve(Buffer.concat(chunks));
    };
    request.on('data', data);
    request.once('end', end);
    request.once('error', fail);
    request.once('aborted', fail);
    signal.addEventListener('abort', fail, { once: true });
    if (signal.aborted) fail();
  });
  try {
    const value = parseBoundedJson(bytes);
    const depth = (v: unknown, n: number): void => {
      if (n > 4) throw new Error();
      if (v && typeof v === 'object') for (const child of Object.values(v)) depth(child, n + 1);
    };
    depth(value, 1);
    return value;
  } catch {
    throw new SalesReadError(400, 'invalid');
  }
}
export function createSalesBrowserHandler(ports: {
  identity: IdentityService;
  query(
    kind: SalesReadKind,
    input: unknown,
    principal: SalesBrowserPrincipal,
    customerId: string | undefined,
    signal: AbortSignal,
  ): Promise<unknown>;
  command(input: string, actor: ExecutionContext): Promise<ExecutionResult>;
}) {
  let active = 0;
  return async (request: IncomingMessage, response: ServerResponse) => {
    if (active >= 16) {
      respond(response, 503, { error: 'unavailable' });
      request.resume();
      return;
    }
    active++;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => {
          controller.abort();
          reject(new SalesReadError(503, 'unavailable'));
        },
        request.url === '/sales/v1/commands' ? 30000 : 7800,
      );
      timer.unref();
    });
    let principal: SalesBrowserPrincipal | undefined, customer: string | undefined;
    const work = async () => {
      if (!browserRequest(request) || request.headers['x-erp-role'] !== undefined)
        throw new IdentityError('forbidden');
      const kind = (request.url ?? '').replace(/^\/sales\/v1\//u, '');
      if (kind !== 'commands' && !kinds.includes(kind as SalesReadKind))
        throw new SalesReadError(404, 'not-found');
      if (request.method !== 'POST') {
        response.setHeader('allow', 'POST');
        respond(response, 405, { error: 'method-not-allowed' });
        return;
      }
      if (kind === 'customers/query') {
        if (request.headers['x-customer-id'] !== undefined) throw new IdentityError('invalid');
      } else {
        if (!uniqueHeader(request, 'x-customer-id') || !validUuid(request.headers['x-customer-id']))
          throw new IdentityError('forbidden');
        customer = request.headers['x-customer-id'];
      }
      principal = await ports.identity.salesReader(sessionToken(request), controller.signal);
      await ports.identity.authorizeSalesReader(
        principal,
        customer ? [customer] : [],
        undefined,
        controller.signal,
      );
      controller.signal.throwIfAborted();
      if (kind === 'commands') {
        // Original 4096-byte duplicate-safe command admission/depth is unchanged.
        const input = await requestJson(request);
        if (typeof input.command !== 'string' || !commands.includes(input.command))
          throw new IdentityError('invalid');
        const actor = await ports.identity.salesContext(principal, customer!, controller.signal);
        const result = await ports.command(JSON.stringify(input), actor);
        controller.signal.throwIfAborted();
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
        respond(response, status, result);
      } else {
        const input = await body(request, controller.signal);
        const result = await ports.query(
          kind as SalesReadKind,
          input,
          principal,
          customer,
          controller.signal,
        );
        controller.signal.throwIfAborted();
        if (Buffer.byteLength(JSON.stringify(result)) > 131072)
          throw new SalesReadError(503, 'unavailable');
        respond(response, 200, result);
      }
    };
    try {
      await Promise.race([work(), deadline]);
    } catch (error) {
      if (principal && !controller.signal.aborted) {
        try {
          await Promise.race([
            ports.identity.authorizeSalesReader(
              principal,
              customer ? [customer] : [],
              undefined,
              controller.signal,
            ),
            deadline,
          ]);
        } catch (authority) {
          error = authority;
        }
      }
      const status =
        error instanceof IdentityError
          ? error.kind === 'unauthenticated'
            ? 401
            : error.kind === 'forbidden'
              ? 403
              : error.kind === 'busy'
                ? 503
                : 400
          : error instanceof SalesReadError
            ? error.status
            : 503;
      const name =
        error instanceof SalesReadError
          ? error.error
          : status === 401
            ? 'unauthenticated'
            : status === 403
              ? 'forbidden'
              : status === 400
                ? 'invalid'
                : 'unavailable';
      if (!response.headersSent) {
        response.setHeader('connection', 'close');
        respond(response, status, { error: name });
      } else response.destroy();
    } finally {
      if (timer) clearTimeout(timer);
      controller.abort();
      active--;
      request.resume();
    }
  };
}
