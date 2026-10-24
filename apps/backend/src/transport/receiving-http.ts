import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  BusinessRejection,
  type ExecutionContext,
  type ExecutionResult,
} from '@navard/shared-kernel';
import { IdentityError, type IdentityService } from '../modules/identity/index.js';
import type { ReceivingQueryName } from '../modules/procurement/index.js';
import { inboundRequestJson } from './inbound-http.js';
import { sessionToken } from './identity-http.js';
import { respond } from './http-errors.js';
export function createReceivingHandler(ports: {
  identity: IdentityService;
  command(input: string, actor: ExecutionContext): Promise<ExecutionResult>;
  query(
    kind: ReceivingQueryName,
    input: Record<string, unknown>,
    actor: ExecutionContext,
  ): Promise<unknown>;
}) {
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
      if (request.headers.origin !== undefined) throw new IdentityError('forbidden');
      const confirm = request.url === '/purchasing/receiving/confirm';
      const arrival = request.url === '/purchasing/receiving/arrivals/query';
      const order = request.url === '/purchasing/receiving/orders/query';
      if (!confirm && !arrival && !order) {
        respond(response, 404, { error: 'not-found' });
        return;
      }
      if (request.method !== 'POST') {
        response.setHeader('allow', 'POST');
        respond(response, 405, { error: 'method-not-allowed' });
        return;
      }
      const role = request.headers['x-erp-role'];
      const count = request.rawHeaders.filter(
        (_, i) => i % 2 === 0 && request.rawHeaders[i]?.toLowerCase() === 'x-erp-role',
      ).length;
      if (
        count !== 1 ||
        !['ACT-WH', 'ACT-PROC'].includes(role as string) ||
        ((confirm || arrival) && role !== 'ACT-WH')
      )
        throw new IdentityError('forbidden');
      const actor = await ports.identity.context(
        sessionToken(request),
        role as 'ACT-WH' | 'ACT-PROC',
      );
      if (
        request.headers['content-encoding'] !== undefined ||
        request.headers['transfer-encoding'] !== undefined
      )
        throw new IdentityError('invalid');
      const input = await inboundRequestJson(request);
      let body: unknown, status: number;
      if (confirm) {
        if (input.command !== 'ConfirmPurchaseReceiving') throw new IdentityError('invalid');
        const result = await ports.command(JSON.stringify(input), actor);
        body = result;
        status =
          result.status === 'completed'
            ? result.result.outcome === 'accepted'
              ? 200
              : 422
            : result.status === 'conflict'
              ? 409
              : result.status === 'admission-denied'
                ? 403
                : 503;
      } else {
        const data = await ports.query(
          arrival ? 'GetReceivingArrival' : 'GetPurchaseOrderReceiving',
          input,
          actor,
        );
        body = data === undefined ? { error: 'not-found' } : { data };
        status = data === undefined ? 404 : 200;
      }
      if (Buffer.byteLength(JSON.stringify(body), 'utf8') > 262144)
        respond(response, 503, { error: 'unavailable' });
      else respond(response, status, body);
    } catch (e) {
      const status =
        e instanceof IdentityError
          ? e.kind === 'unauthenticated'
            ? 401
            : e.kind === 'forbidden'
              ? 403
              : 400
          : e instanceof BusinessRejection
            ? e.rejection.family === 'GUARD_ACTOR'
              ? 403
              : 400
            : 503;
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
