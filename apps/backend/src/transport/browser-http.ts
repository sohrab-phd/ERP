import { readFile } from 'node:fs/promises';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { IdentityError } from '../modules/identity/index.js';
import { admitBrowser, type BrowserConfig } from './browser-session.js';
import { respond } from './http-errors.js';

type Handler = (request: IncomingMessage, response: ServerResponse) => Promise<void>;
const assets = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/operator/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/operator/intent.js', ['intent.js', 'text/javascript; charset=utf-8']],
  ['/operator/display.js', ['display.js', 'text/javascript; charset=utf-8']],
  ['/operator/styles.css', ['styles.css', 'text/css; charset=utf-8']],
]);
export function browserHeaders(response: ServerResponse, secure: boolean) {
  response.setHeader('cache-control', 'no-store');
  response.setHeader('x-content-type-options', 'nosniff');
  response.setHeader(
    'content-security-policy',
    "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
  );
  response.setHeader('x-frame-options', 'DENY');
  response.setHeader('referrer-policy', 'no-referrer');
  response.setHeader('cross-origin-opener-policy', 'same-origin');
  response.setHeader('cross-origin-resource-policy', 'same-origin');
  response.setHeader('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  if (secure) response.setHeader('strict-transport-security', 'max-age=31536000');
}
/** No CORS or arbitrary proxy. Legacy routes still reject Origin and cannot use these cookies. */
export function createBrowserHandler(
  config: BrowserConfig,
  handlers: { identity: Handler; inbound: Handler; receiving: Handler },
) {
  return async (request: IncomingMessage, response: ServerResponse): Promise<boolean> => {
    const path = request.url ?? '';
    if (!path.startsWith('/ui-api/') && !assets.has(path) && !path.startsWith('/operator/'))
      return false;
    browserHeaders(response, config.origin.startsWith('https:'));
    try {
      if (request.headers.host !== new URL(config.origin).host)
        throw new IdentityError('forbidden');
      const asset = assets.get(path);
      if (asset) {
        if (
          request.method !== 'GET' ||
          request.headers['transfer-encoding'] ||
          Number(request.headers['content-length'] ?? 0) !== 0
        )
          throw new IdentityError('invalid');
        const bytes = await readFile(new URL('../operator/' + asset[0]!, import.meta.url));
        response.writeHead(200, { 'content-type': asset[1]!, 'content-length': bytes.length });
        response.end(bytes);
        return true;
      }
      const route = path.slice('/ui-api'.length);
      const identity = ['/identity/login', '/identity/logout', '/identity/session'].includes(route);
      const inbound =
        [
          '/purchasing/operational-orders',
          '/purchasing/operational-orders/lookup',
          '/purchasing/inbound-catalogues',
          '/purchasing/inbound-catalogues/query',
        ].includes(route) || /^\/purchasing\/operational-orders\/[0-9a-f-]{36}$/u.test(route);
      const receiving = route === '/purchasing/receiving/orders/query';
      if (!identity && !inbound && !receiving) {
        respond(response, 404, { error: 'not-found' });
        request.resume();
        return true;
      }
      admitBrowser(
        request,
        config,
        route === '/identity/login',
        route === '/identity/session' && request.method === 'GET',
      );
      request.url = route;
      await (identity ? handlers.identity : inbound ? handlers.inbound : handlers.receiving)(
        request,
        response,
      );
    } catch (error) {
      if (!response.headersSent) response.setHeader('connection', 'close');
      const status =
        error instanceof IdentityError
          ? error.kind === 'unauthenticated'
            ? 401
            : error.kind === 'forbidden'
              ? 403
              : 400
          : 503;
      if (!response.headersSent)
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
      else response.destroy();
      request.resume();
    }
    return true;
  };
}
