import type { IncomingMessage, ServerResponse } from 'node:http';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { parseBoundedJson } from '@navard/shared-kernel';
import { IdentityError, type IdentityService, type HumanRole } from '../modules/identity/index.js';

export { token as sessionToken, body as requestJson };

function reply(response: ServerResponse, status: number, value: unknown) {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  response.end(JSON.stringify(value));
}
function token(request: IncomingMessage): string {
  const count = request.rawHeaders.filter(
    (_, i) => i % 2 === 0 && request.rawHeaders[i]?.toLowerCase() === 'authorization',
  ).length;
  const value = request.headers.authorization;
  if (count !== 1 || !value || !/^Bearer [A-Za-z0-9_-]{43}$/u.test(value))
    throw new IdentityError('unauthenticated');
  return value.slice(7);
}
async function body(request: IncomingMessage): Promise<Record<string, unknown>> {
  const length = Number(request.headers['content-length']);
  if (
    request.headers['transfer-encoding'] ||
    !Number.isInteger(length) ||
    length < 2 ||
    length > 4096 ||
    !/^application\/json(?:;\s*charset=utf-8)?$/iu.test(request.headers['content-type'] ?? '')
  )
    throw new IdentityError('invalid');
  const bytes = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const fail = () => {
      cleanup();
      request.pause();
      reject(new IdentityError('invalid'));
    };
    const data = (chunk: Buffer) => {
      size += chunk.length;
      if (size > 4096 || size > length) fail();
      else chunks.push(chunk);
    };
    const end = () => {
      cleanup();
      if (size !== length) reject(new IdentityError('invalid'));
      else resolve(Buffer.concat(chunks));
    };
    const timer = setTimeout(fail, 5000);
    const cleanup = () => {
      clearTimeout(timer);
      request.off('data', data);
      request.off('end', end);
      request.off('error', fail);
      request.off('aborted', fail);
    };
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
function fields(value: Record<string, unknown>, required: string[], optional: string[] = []) {
  if (
    required.some((k) => !Object.hasOwn(value, k)) ||
    Object.keys(value).some((k) => !required.includes(k) && !optional.includes(k))
  )
    throw new IdentityError('invalid');
}
function text(value: unknown): string {
  if (typeof value !== 'string') throw new IdentityError('invalid');
  return value;
}
/** No cookie authentication, caller-supplied role claims, or arbitrary business routes. */
export function createIdentityHandler(
  identity: IdentityService,
  clock: () => number = () => performance.now(),
) {
  let active = 0;
  const failures = new Map<string, { count: number; at: number }>();
  let windowStart = clock(),
    failed = 0;
  const loginKey = (username: string) => createHash('sha256').update(username).digest('hex');
  const prune = () => {
    const now = clock();
    if (now - windowStart >= 60_000) {
      windowStart = now;
      failed = 0;
    }
    for (const [key, value] of failures) if (now - value.at >= 60_000) failures.delete(key);
  };
  return async (request: IncomingMessage, response: ServerResponse): Promise<void> => {
    if (active >= 16) {
      response.setHeader('connection', 'close');
      reply(response, 503, { error: 'unavailable' });
      request.resume();
      return;
    }
    active++;
    try {
      if (request.headers.origin) throw new IdentityError('forbidden');
      const route = request.url;
      const routes = [
        '/identity/login',
        '/identity/logout',
        '/identity/session',
        '/identity/accounts',
        '/identity/account-query',
        '/identity/grants',
        '/identity/disable',
        '/identity/revoke',
        '/identity/password',
      ];
      if (!route || !routes.includes(route)) {
        reply(response, 404, { error: 'not-found' });
        request.resume();
        return;
      }
      const method = route === '/identity/session' ? 'GET' : 'POST';
      if (request.method !== method) {
        response.setHeader('allow', method);
        reply(response, 405, { error: 'method-not-allowed' });
        request.resume();
        return;
      }
      if (route === '/identity/session') {
        if (
          request.headers['transfer-encoding'] ||
          Number(request.headers['content-length'] ?? 0) !== 0
        )
          throw new IdentityError('invalid');
        reply(response, 200, await identity.session(token(request)));
        return;
      }
      // Authenticate framing/header before any expensive credential operation.
      const bearer = route === '/identity/login' ? undefined : token(request);
      const value = await body(request);
      if (route === '/identity/login') {
        fields(value, ['username', 'password']);
        const username = text(value.username),
          password = text(value.password),
          key = loginKey(username);
        prune();
        if (failed >= 60 || (failures.get(key)?.count ?? 0) >= 5) {
          response.setHeader('retry-after', '60');
          throw new IdentityError('busy');
        }
        try {
          const result = await identity.login(username, password);
          failures.delete(key);
          reply(response, 200, result);
        } catch (error) {
          if (error instanceof IdentityError && error.kind === 'unauthenticated') {
            failed++;
            const previous = failures.get(key);
            if (failures.size < 1024 || previous)
              failures.set(key, { count: (previous?.count ?? 0) + 1, at: previous?.at ?? clock() });
          }
          throw error;
        }
        return;
      }
      const credential = bearer!;
      if (route === '/identity/logout') {
        fields(value, []);
        await identity.logout(credential);
      } else if (route === '/identity/accounts') {
        fields(value, ['username', 'personId', 'password']);
        reply(
          response,
          201,
          await identity.createAccount(credential, {
            username: text(value.username),
            personId: text(value.personId),
            password: text(value.password),
          }),
        );
        return;
      } else if (route === '/identity/account-query') {
        fields(value, ['username']);
        reply(response, 200, {
          account: (await identity.lookupAccount(credential, text(value.username))) ?? null,
        });
        return;
      } else if (route === '/identity/grants') {
        fields(
          value,
          ['accountId', 'actorRole', 'enabled'],
          ['customerScope', 'productionDisposition'],
        );
        if (
          value.productionDisposition !== undefined &&
          typeof value.productionDisposition !== 'boolean'
        )
          throw new IdentityError('invalid');
        if (typeof value.enabled !== 'boolean') throw new IdentityError('invalid');
        await identity.setGrant(credential, {
          accountId: text(value.accountId),
          actorRole: text(value.actorRole) as HumanRole,
          enabled: value.enabled,
          ...(value.productionDisposition === undefined
            ? {}
            : { productionDisposition: value.productionDisposition }),
          ...(value.customerScope === undefined
            ? {}
            : { customerScope: text(value.customerScope) }),
        });
      } else if (route === '/identity/disable') {
        fields(value, ['accountId']);
        await identity.disableAccount(credential, text(value.accountId));
      } else if (route === '/identity/revoke') {
        fields(value, ['accountId']);
        await identity.revokeSessions(credential, text(value.accountId));
      } else {
        fields(value, ['currentPassword', 'newPassword']);
        await identity.changePassword(credential, {
          currentPassword: text(value.currentPassword),
          newPassword: text(value.newPassword),
        });
      }
      reply(response, 200, { status: 'completed' });
    } catch (error) {
      const kind = error instanceof IdentityError ? error.kind : 'busy';
      const status = {
        unauthenticated: 401,
        forbidden: 403,
        invalid: 400,
        conflict: 409,
        busy: 503,
      }[kind];
      response.setHeader('connection', 'close');
      reply(response, status, { error: kind === 'busy' ? 'unavailable' : kind });
      request.resume();
    } finally {
      active--;
    }
  };
}
