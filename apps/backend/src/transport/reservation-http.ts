import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  BusinessRejection,
  validUuid,
  type ExecutionContext,
  type ExecutionResult,
} from '@navard/shared-kernel';
import { IdentityError, type IdentityService } from '../modules/identity/index.js';
import { sessionToken, requestJson } from './identity-http.js';
import { respond } from './http-errors.js';
export interface ReservationHttpPorts {
  identity: IdentityService;
  command(input: string, context: ExecutionContext): Promise<ExecutionResult>;
  query(id: string, context: ExecutionContext): Promise<unknown>;
}
const commands = ['RequestReservation', 'ActivateReservation'];
/** Customer selector is checked against current grants; never a caller-supplied identity or wildcard. */
export function createReservationHandler(ports: ReservationHttpPorts) {
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
      const post = route === '/reservations/commands';
      const match = /^\/reservations\/([0-9a-f-]+)$/u.exec(route);
      if (!post && (!match || !validUuid(match[1]))) {
        respond(response, 404, { error: 'not-found' });
        return;
      }
      const method = post ? 'POST' : 'GET';
      if (request.method !== method) {
        response.setHeader('allow', method);
        respond(response, 405, { error: 'method-not-allowed' });
        return;
      }
      const headerCount = (name: string) =>
        request.rawHeaders.filter(
          (_, i) => i % 2 === 0 && request.rawHeaders[i]?.toLowerCase() === name,
        ).length;
      const role = request.headers['x-erp-role'] ?? 'ACT-SALES';
      if (headerCount('x-erp-role') > 1 || !['ACT-SALES', 'ACT-WH'].includes(role as string))
        throw new IdentityError('forbidden');
      const customer = request.headers['x-customer-id'];
      if (
        role === 'ACT-SALES'
          ? headerCount('x-customer-id') !== 1 || !validUuid(customer)
          : headerCount('x-customer-id') !== 0
      )
        throw new IdentityError('forbidden');
      if (!post && role !== 'ACT-SALES') throw new IdentityError('forbidden');
      const context = await ports.identity.context(
        sessionToken(request),
        role as 'ACT-SALES' | 'ACT-WH',
        role === 'ACT-SALES' ? (customer as string) : undefined,
      );
      if (post) {
        const input = await requestJson(request);
        if (typeof input.command !== 'string' || !commands.includes(input.command))
          throw new IdentityError('invalid');
        if (role === 'ACT-WH' && input.command !== 'ActivateReservation')
          throw new IdentityError('forbidden');
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
        const data = await ports.query(match![1]!, context);
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
