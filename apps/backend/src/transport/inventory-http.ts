import { createHash } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { parseBoundedJson, type ExecutionContext } from '@navard/shared-kernel';
import { IdentityError, type IdentityService } from '../modules/identity/index.js';
import {
  InventoryReadError,
  type InventoryReadBinding,
  type InventoryReadQuery,
} from '../modules/inventory/index.js';
import { browserRequest, uniqueHeader } from './browser-session.js';
import { sessionToken } from './identity-http.js';
import { respond } from './http-errors.js';

const routes = new Map<string, InventoryReadQuery>([
  ['/inventory/v1/units/query', 'DiscoverInventoryUnits'],
  ['/inventory/v1/units/detail', 'GetInventoryUnitDetail'],
  ['/inventory/v1/lots/units/query', 'ListInventoryLotUnits'],
]);
async function body(request: IncomingMessage, signal: AbortSignal): Promise<unknown> {
  const length = Number(request.headers['content-length']);
  if (Number.isInteger(length) && length > 8192) throw new InventoryReadError(413, 'too-large');
  if (
    request.headers['transfer-encoding'] !== undefined ||
    request.headers['content-encoding'] !== undefined ||
    !Number.isInteger(length) ||
    length < 2 ||
    !uniqueHeader(request, 'content-type') ||
    !/^application\/json(?:;\s*charset=utf-8)?$/iu.test(request.headers['content-type'] ?? '')
  )
    throw new InventoryReadError(400, 'invalid');
  const bytes = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const cleanup = () => {
      request.off('data', data);
      request.off('end', end);
      request.off('error', fail);
      request.off('aborted', fail);
      signal.removeEventListener('abort', aborted);
    };
    const fail = () => {
      cleanup();
      request.pause();
      reject(new InventoryReadError(400, 'invalid'));
    };
    const aborted = () => {
      cleanup();
      request.pause();
      reject(new InventoryReadError(503, 'unavailable'));
    };
    const data = (chunk: Buffer) => {
      size += chunk.length;
      if (size > length || size > 8192) fail();
      else chunks.push(chunk);
    };
    const end = () => {
      cleanup();
      if (size !== length) reject(new InventoryReadError(400, 'invalid'));
      else resolve(Buffer.concat(chunks));
    };
    request.on('data', data);
    request.once('end', end);
    request.once('error', fail);
    request.once('aborted', fail);
    signal.addEventListener('abort', aborted, { once: true });
    if (signal.aborted) aborted();
  });
  try {
    const value = parseBoundedJson(bytes);
    const checkDepth = (v: unknown, depth: number): void => {
      if (depth > 4) throw new Error('depth');
      if (v && typeof v === 'object')
        for (const child of Object.values(v)) checkDepth(child, depth + 1);
    };
    checkDepth(value, 1);
    return value;
  } catch {
    throw new InventoryReadError(400, 'invalid');
  }
}

/** Browser-only, closed read surface; never a command/bearer forwarding adapter. */
export function createInventoryReadHandler(ports: {
  identity: IdentityService;
  query(
    query: InventoryReadQuery,
    input: unknown,
    actor: ExecutionContext,
    binding: InventoryReadBinding,
    signal: AbortSignal,
  ): Promise<unknown>;
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
      // Reserve 200ms of the approved 8s envelope for cancellation/error response
      // serialization. The read transaction also retains its 8s backstop.
      timer = setTimeout(() => {
        controller.abort();
        reject(new InventoryReadError(503, 'unavailable'));
      }, 7800);
      timer.unref();
    });
    let credential: string | undefined;
    const work = async () => {
      if (!browserRequest(request)) throw new IdentityError('forbidden');
      const query = routes.get(request.url ?? '');
      if (!query) throw new InventoryReadError(404, 'not-found');
      if (request.method !== 'POST') {
        response.setHeader('allow', 'POST');
        respond(response, 405, { error: 'method-not-allowed' });
        return;
      }
      if (!uniqueHeader(request, 'x-erp-role') || request.headers['x-erp-role'] !== 'ACT-WH')
        throw new IdentityError('forbidden');
      credential = sessionToken(request);
      const { actor, self } = await ports.identity.contextAndSession(credential, 'ACT-WH');
      controller.signal.throwIfAborted();
      const input = await body(request, controller.signal);
      const data = await ports.query(
        query,
        input,
        actor,
        {
          accountId: self.accountId,
          personId: self.personId,
          sessionDigest: createHash('sha256').update(credential).digest('hex'),
        },
        controller.signal,
      );
      controller.signal.throwIfAborted();
      const envelope = { data };
      if (Buffer.byteLength(JSON.stringify(envelope)) > 131072)
        throw new InventoryReadError(422, 'query-limit');
      respond(response, 200, envelope);
    };
    try {
      await Promise.race([work(), deadline]);
    } catch (error) {
      // Recheck even failed private reads; session expiry must not reveal a prior 404/422.
      if (credential && !controller.signal.aborted) {
        try {
          await Promise.race([ports.identity.context(credential, 'ACT-WH'), deadline]);
        } catch (authorityError) {
          error = authorityError;
        }
      }
      const status =
        error instanceof IdentityError
          ? error.kind === 'unauthenticated'
            ? 401
            : error.kind === 'forbidden'
              ? 403
              : 400
          : error instanceof InventoryReadError
            ? error.status
            : 503;
      const name =
        error instanceof InventoryReadError
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
