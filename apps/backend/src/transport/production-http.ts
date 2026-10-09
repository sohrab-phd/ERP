import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  BusinessRejection,
  validUuid,
  type ExecutionContext,
  type ExecutionResult,
} from '@navard/shared-kernel';
import { IdentityError, type IdentityService } from '../modules/identity/index.js';
import { sessionToken, requestJson } from './identity-http.js';
import { productionCommands, productionRole } from '../modules/production/index.js';
import { respond } from './http-errors.js';
export interface ProductionHttpPorts {
  identity: IdentityService;
  command(input: string, context: ExecutionContext): Promise<ExecutionResult>;
  query(
    kind: 'GetProductionOrder' | 'GetOperation' | 'GetAllocation',
    id: string,
    context: ExecutionContext,
  ): Promise<unknown>;
}
const commands = productionCommands;
/** Customer selector is checked against current grants; never a caller-supplied identity or wildcard. */
export function createProductionHandler(ports: ProductionHttpPorts) {
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
      const post = route === '/production/commands';
      const match = /^\/production\/(orders|operations|allocations)\/([0-9a-f-]+)$/u.exec(route);
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
      const customer = request.headers['x-customer-id'];
      const count = request.rawHeaders.filter(
        (_, i) => i % 2 === 0 && request.rawHeaders[i]?.toLowerCase() === 'x-customer-id',
      ).length;
      if (count !== 1 || !validUuid(customer) || request.headers['x-erp-role'])
        throw new IdentityError('forbidden');
      let context: ExecutionContext;
      const input = post ? await requestJson(request) : undefined;
      if (post) {
        if (
          typeof input?.command !== 'string' ||
          !(commands as readonly string[]).includes(input.command)
        )
          throw new IdentityError('invalid');
        try {
          context = await ports.identity.context(
            sessionToken(request),
            productionRole(input.command),
            customer,
          );
        } catch (error) {
          if (
            input.command !== 'CompleteProductionOrder' ||
            !(error instanceof IdentityError) ||
            error.kind !== 'forbidden'
          )
            throw error;
          context = await ports.identity.context(sessionToken(request), 'ACT-PLAN', customer);
        }
      } else {
        try {
          context = await ports.identity.context(sessionToken(request), 'ACT-PLAN', customer);
        } catch (error) {
          if (!(error instanceof IdentityError) || error.kind !== 'forbidden') throw error;
          context = await ports.identity.context(sessionToken(request), 'ACT-OP', customer);
        }
      }
      if (post) {
        if (!input) throw new IdentityError('invalid');
        const result = await ports.command(JSON.stringify(input), context);
        const status =
          result.status === 'completed'
            ? result.result.outcome === 'accepted'
              ? 200
              : 422
            : result.status === 'conflict'
              ? 409
              : result.status === 'admission-denied'
                ? result.family === 'GUARD_INVARIANT'
                  ? 400
                  : 403
                : 503;
        respond(response, status, result);
      } else {
        if (
          request.headers['transfer-encoding'] ||
          Number(request.headers['content-length'] ?? 0) !== 0
        )
          throw new IdentityError('invalid');
        const data = await ports.query(
          match![1] === 'orders'
            ? 'GetProductionOrder'
            : match![1] === 'operations'
              ? 'GetOperation'
              : 'GetAllocation',
          match![2]!,
          context,
        );
        respond(
          response,
          data === undefined ? 404 : 200,
          data === undefined ? { error: 'not-found' } : { data },
        );
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
