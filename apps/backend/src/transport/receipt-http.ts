import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  BusinessRejection,
  type ExecutionContext,
  type ExecutionResult,
  validUuid,
} from '@navard/shared-kernel';
import { IdentityError, type IdentityService } from '../modules/identity/index.js';
import { sessionToken, requestJson } from './identity-http.js';
import { respond } from './http-errors.js';

export interface ReceiptHttpPorts {
  identity: IdentityService;
  command(input: string, context: ExecutionContext): Promise<ExecutionResult>;
  query(
    kind: 'GetGoodsReceipt' | 'GetInventoryUnit' | 'GetLot',
    id: string,
    context: ExecutionContext,
  ): Promise<unknown>;
}
/** Personal bearer sessions only. A role selector is checked against current grants, never trusted as a grant. */
export function createReceiptHandler(ports: ReceiptHttpPorts) {
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
      if (request.headers.origin) throw new IdentityError('forbidden');
      const route = request.url ?? '';
      const post = route === '/receipts/post';
      const match = /^\/(receipts|inventory\/units|inventory\/lots)\/([0-9a-f-]+)$/u.exec(route);
      if (!post && (!match || !validUuid(match[2]))) {
        respond(response, 404, { error: 'not-found' });
        return;
      }
      const method = post ? 'POST' : 'GET';
      if (request.method !== method) {
        response.setHeader('allow', method);
        respond(response, 405, { error: 'method-not-allowed' });
        return;
      }
      const selector = request.headers['x-erp-role'] ?? 'ACT-WH';
      const selectors = request.rawHeaders.filter(
        (_, i) => i % 2 === 0 && request.rawHeaders[i]?.toLowerCase() === 'x-erp-role',
      ).length;
      if (
        selectors > 1 ||
        (selector !== 'ACT-WH' && selector !== 'ACT-SEC') ||
        (post && selector !== 'ACT-WH')
      )
        throw new IdentityError('forbidden');
      const context = await ports.identity.context(sessionToken(request), selector);
      if (post) {
        const input = await requestJson(request);
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
        respond(response, status, result);
      } else {
        if (
          request.headers['transfer-encoding'] ||
          Number(request.headers['content-length'] ?? 0) !== 0
        )
          throw new IdentityError('invalid');
        const kind =
          match![1] === 'receipts'
            ? 'GetGoodsReceipt'
            : match![1] === 'inventory/units'
              ? 'GetInventoryUnit'
              : 'GetLot';
        const data = await ports.query(kind, match![2]!, context);
        if (data === undefined) respond(response, 404, { error: 'not-found' });
        else respond(response, 200, { data });
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
