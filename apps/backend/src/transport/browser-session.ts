import { createHmac, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { SelfSession } from '../modules/identity/index.js';
import { IdentityError } from '../modules/identity/index.js';

export interface BrowserConfig {
  origin: string;
  secret: string;
  installationId: string;
  receivingLocation?: { id: string; label: string };
}
interface Admission {
  config: BrowserConfig;
  token?: string;
}
// Only the closed browser adapter marks requests; ordinary bearer routes cannot use cookies.
const admitted = new WeakMap<IncomingMessage, Admission>();
export const browserRequest = (request: IncomingMessage) => admitted.has(request);
export const browserToken = (request: IncomingMessage) => admitted.get(request)?.token;
export function uniqueHeader(request: IncomingMessage, name: string): boolean {
  return (
    request.rawHeaders.filter(
      (_, i) => i % 2 === 0 && request.rawHeaders[i]?.toLowerCase() === name,
    ).length === 1
  );
}
function mac(config: BrowserConfig, purpose: string, value: string): string {
  return createHmac('sha256', config.secret)
    .update(JSON.stringify([purpose, config.origin, value]))
    .digest('base64url');
}
export function cookieName(config: BrowserConfig): string {
  return config.origin.startsWith('https:') ? '__Host-navard-session' : 'navard-dev-session';
}
export function admitBrowser(
  request: IncomingMessage,
  config: BrowserConfig,
  login: boolean,
  bootstrap: boolean,
) {
  const url = new URL(config.origin);
  const origin = request.headers.origin;
  if (
    !uniqueHeader(request, 'host') ||
    request.headers.host !== url.host ||
    !uniqueHeader(request, 'x-erp-browser') ||
    request.headers['x-erp-browser'] !== '1' ||
    request.headers['sec-fetch-site'] !== 'same-origin' ||
    request.headers.authorization !== undefined ||
    (request.method === 'POST' && (!uniqueHeader(request, 'origin') || origin !== config.origin)) ||
    (origin !== undefined && (!uniqueHeader(request, 'origin') || origin !== config.origin))
  )
    throw new IdentityError('forbidden');
  const values = (request.headers.cookie ?? '')
    .split(';')
    .map((x) => x.trim())
    .filter((x) => x.startsWith(cookieName(config) + '='));
  if (values.length > 1) throw new IdentityError('unauthenticated');
  const token = values[0]?.slice(cookieName(config).length + 1);
  if (!login && (!token || !/^[A-Za-z0-9_-]{43}$/u.test(token)))
    throw new IdentityError('unauthenticated');
  if (!login && !bootstrap) {
    const expected = mac(config, 'csrf-v1', token!);
    const supplied = request.headers['x-erp-csrf'];
    if (
      !uniqueHeader(request, 'x-erp-csrf') ||
      typeof supplied !== 'string' ||
      !/^[A-Za-z0-9_-]{43}$/u.test(supplied) ||
      supplied.length !== expected.length ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(supplied))
    )
      throw new IdentityError('forbidden');
  }
  admitted.set(request, { config, ...(token === undefined ? {} : { token }) });
}
function setCookie(
  response: ServerResponse,
  config: BrowserConfig,
  token: string,
  expiresAt?: Date,
) {
  response.setHeader(
    'set-cookie',
    `${cookieName(config)}=${token}; Path=/; HttpOnly; SameSite=Strict${config.origin.startsWith('https:') ? '; Secure' : ''}${expiresAt ? '; Expires=' + expiresAt.toUTCString() : '; Max-Age=0'}`,
  );
}
export function browserLogin(
  request: IncomingMessage,
  response: ServerResponse,
  result: { token: string; expiresAt: Date },
): boolean {
  const admission = admitted.get(request);
  if (!admission) return false;
  setCookie(response, admission.config, result.token, result.expiresAt);
  return true;
}
export function browserLogout(request: IncomingMessage, response: ServerResponse) {
  const admission = admitted.get(request);
  if (admission) setCookie(response, admission.config, '');
}
export function browserSession(request: IncomingMessage, session: SelfSession) {
  const a = admitted.get(request);
  if (!a?.token) return session;
  const grants = session.grants.filter(
    (g) =>
      g.authorityScopeId === a.config.installationId &&
      g.customerScope === '' &&
      ['ACT-PROC', 'ACT-WH'].includes(g.actorRole),
  );
  return {
    ...session,
    grants,
    browser: {
      csrf: mac(a.config, 'csrf-v1', a.token),
      ...(grants.some((g) => g.actorRole === 'ACT-WH') && a.config.receivingLocation
        ? { receivingLocation: a.config.receivingLocation }
        : {}),
      // Encryption only, never an authentication credential. The key is not persisted by the UI.
      ...(grants.length
        ? {
            recoveryKey: mac(
              a.config,
              'pending-intent-encryption-v1',
              JSON.stringify([a.config.installationId, session.accountId, session.personId]),
            ),
          }
        : {}),
    },
  };
}
