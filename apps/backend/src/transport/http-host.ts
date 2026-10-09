import { createServer } from 'node:http';
import type { Server, IncomingMessage, ServerResponse } from 'node:http';
import { respond } from './http-errors.js';
export interface HealthOptions {
  ping: () => Promise<void>;
  probeTimeoutMs?: number;
  identity?: (request: IncomingMessage, response: ServerResponse) => Promise<void>;
  shipping?: (request: IncomingMessage, response: ServerResponse) => Promise<void>;
  reservation?: (request: IncomingMessage, response: ServerResponse) => Promise<void>;
  sales?: (request: IncomingMessage, response: ServerResponse) => Promise<void>;
  receipt?: (request: IncomingMessage, response: ServerResponse) => Promise<void>;
}
export function createHttpHost(options: HealthOptions): Server {
  const server = createServer(
    { maxHeaderSize: 8192, headersTimeout: 5000, requestTimeout: 10000, keepAliveTimeout: 5000 },
    (request, response) => {
      if (options.shipping && request.url?.startsWith('/shipping/')) {
        void options.shipping(request, response).catch(() => {
          if (!response.headersSent) respond(response, 503, { error: 'unavailable' });
          else response.destroy();
        });
        return;
      }
      if (options.reservation && request.url?.startsWith('/reservations/')) {
        void options.reservation(request, response).catch(() => {
          if (!response.headersSent) respond(response, 503, { error: 'unavailable' });
          else response.destroy();
        });
        return;
      }
      if (options.sales && request.url?.startsWith('/sales/')) {
        void options.sales(request, response).catch(() => {
          if (!response.headersSent) respond(response, 503, { error: 'unavailable' });
          else response.destroy();
        });
        return;
      }
      if (
        options.receipt &&
        (request.url?.startsWith('/receipts/') || request.url?.startsWith('/inventory/'))
      ) {
        void options.receipt(request, response).catch(() => {
          if (!response.headersSent) respond(response, 503, { error: 'unavailable' });
          else response.destroy();
        });
        return;
      }
      if (options.identity && request.url?.startsWith('/identity/')) {
        void options.identity(request, response).catch(() => {
          if (!response.headersSent) respond(response, 503, { error: 'unavailable' });
          else response.destroy();
        });
        return;
      }
      if (
        request.headers['transfer-encoding'] ||
        Number(request.headers['content-length'] ?? 0) !== 0
      ) {
        respond(response, 400, { error: 'body-not-allowed' });
        request.resume();
        return;
      }
      if (request.url !== '/health/live' && request.url !== '/health/ready') {
        respond(response, 404, { error: 'not-found' });
        return;
      }
      if (request.method !== 'GET') {
        response.setHeader('allow', 'GET');
        respond(response, 405, { error: 'method-not-allowed' });
        return;
      }
      if (request.url === '/health/live') {
        respond(response, 200, { status: 'live' });
        return;
      }
      let timer: ReturnType<typeof setTimeout>;
      const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error('probe-timeout'));
        }, options.probeTimeoutMs ?? 2000);
        timer.unref();
      });
      void Promise.race([options.ping(), deadline])
        .then(
          () => {
            respond(response, 200, { status: 'ready' });
          },
          () => {
            respond(response, 503, { status: 'unavailable' });
          },
        )
        .finally(() => {
          clearTimeout(timer);
        });
    },
  );
  server.on('clientError', (_error, socket) => {
    socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');
  });
  return server;
}
export async function closeHttpHost(server: Server, timeoutMs = 10000): Promise<void> {
  if (!server.listening) return;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      server.closeAllConnections();
    }, timeoutMs);
    timer.unref();
    server.close((error) => {
      clearTimeout(timer);
      if (error) reject(error);
      else resolve();
    });
    server.closeIdleConnections();
  });
}
