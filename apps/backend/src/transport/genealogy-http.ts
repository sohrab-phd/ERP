import type { IncomingMessage, ServerResponse } from 'node:http';
import { BusinessRejection, validUuid, type ExecutionContext } from '@navard/shared-kernel';
import { IdentityError, type IdentityService } from '../modules/identity/index.js';
import { sessionToken } from './identity-http.js';
import { respond } from './http-errors.js';

export interface GenealogyHttpPorts {
  identity: IdentityService;
  query(
    direction: 'TraceForward' | 'TraceBackward',
    root: {
      kind:
        | 'UNIT'
        | 'LOT'
        | 'RECEIPT'
        | 'PACKAGE'
        | 'SHIPMENT'
        | 'FACT'
        | 'OPERATION'
        | 'ORDER'
        | 'BATCH'
        | 'SALES_ORDER';
      id: string;
    },
    context: ExecutionContext,
  ): Promise<unknown>;
}

interface Reply {
  status: number;
  body: unknown;
}

/** Exact customer grants only; the query owner rechecks current authority around its snapshot. */
export function createGenealogyHandler(ports: GenealogyHttpPorts, readTimeoutMs = 10_000) {
  let active = 0;
  const read = async (request: IncomingMessage): Promise<Reply> => {
    if (request.headers.origin !== undefined) throw new IdentityError('forbidden');
    const match =
      /^\/genealogy\/(forward|backward)\/(unit|lot|receipt|package|shipment|fact|operation|order|batch|sales_order)\/([0-9a-f-]+)$/u.exec(
        request.url ?? '',
      );
    if (!match || !validUuid(match[3])) return { status: 404, body: { error: 'not-found' } };
    if (request.method !== 'GET') return { status: 405, body: { error: 'method-not-allowed' } };
    const customer = request.headers['x-customer-id'];
    const count = request.rawHeaders.filter(
      (_, i) => i % 2 === 0 && request.rawHeaders[i]?.toLowerCase() === 'x-customer-id',
    ).length;
    if (count !== 1 || !validUuid(customer) || request.headers['x-erp-role'] !== undefined)
      throw new IdentityError('forbidden');
    if (
      request.headers['transfer-encoding'] !== undefined ||
      Number(request.headers['content-length'] ?? 0) !== 0
    )
      throw new IdentityError('invalid');
    const token = sessionToken(request);
    let context: ExecutionContext | undefined;
    for (const role of ['ACT-WH', 'ACT-SALES', 'ACT-SEC'] as const) {
      try {
        context = await ports.identity.context(token, role, customer);
        break;
      } catch (error) {
        if (!(error instanceof IdentityError) || error.kind !== 'forbidden') throw error;
      }
    }
    if (!context) throw new IdentityError('forbidden');
    const data = await ports.query(
      match[1] === 'forward' ? 'TraceForward' : 'TraceBackward',
      {
        kind: match[2]!.toUpperCase() as Parameters<GenealogyHttpPorts['query']>[1]['kind'],
        id: match[3],
      },
      context,
    );
    return {
      status: data === undefined ? 404 : 200,
      body: data === undefined ? { error: 'not-found' } : { data },
    };
  };
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    if (active >= 4) {
      response.setHeader('connection', 'close');
      respond(response, 503, { error: 'unavailable' });
      request.resume();
      return;
    }
    active++;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Keep admission occupied until the underlying read settles, including after an HTTP timeout.
    const pending = read(request).finally(() => active--);
    const deadline = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('read-timeout')), readTimeoutMs);
      timer.unref();
    });
    try {
      const result = await Promise.race([pending, deadline]);
      if (result.status === 405) response.setHeader('allow', 'GET');
      respond(response, result.status, result.body);
    } catch (error) {
      const status =
        error instanceof IdentityError
          ? error.kind === 'unauthenticated'
            ? 401
            : error.kind === 'forbidden'
              ? 403
              : error.kind === 'invalid'
                ? 400
                : 503
          : error instanceof BusinessRejection
            ? error.rejection.family === 'GUARD_ACTOR'
              ? 403
              : 422
            : 503;
      respond(response, status, {
        error:
          status === 401
            ? 'unauthenticated'
            : status === 403
              ? 'forbidden'
              : status === 400 || status === 422
                ? 'invalid'
                : 'unavailable',
      });
    } finally {
      if (timer) clearTimeout(timer);
      request.resume();
    }
  };
}
