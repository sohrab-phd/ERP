export interface Config {
  nodeEnv: 'development' | 'test' | 'production';
  host: string;
  port: number;
  databaseUrl: string;
  installationId: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export function loadConfig(env: NodeJS.ProcessEnv): Readonly<Config> {
  const nodeEnv = env.NODE_ENV;
  if (nodeEnv !== 'development' && nodeEnv !== 'test' && nodeEnv !== 'production')
    throw new Error('NODE_ENV is required');
  const databaseUrl = env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');
  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL is invalid');
  }
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !url.hostname ||
    url.pathname.length < 2 ||
    url.hash
  )
    throw new Error('DATABASE_URL is invalid');
  const installationId = env.INSTALLATION_ID;
  if (!installationId || !uuid.test(installationId))
    throw new Error('INSTALLATION_ID must be a stable UUID');
  const host = env.HOST ?? '127.0.0.1';
  if (!host || host.length > 253 || /[\s/\\]/.test(host)) throw new Error('HOST is invalid');
  const text = env.PORT ?? '3000';
  if (!/^[0-9]+$/.test(text)) throw new Error('PORT is invalid');
  const port = Number(text);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT is invalid');
  const logLevel = env.LOG_LEVEL ?? 'info';
  if (logLevel !== 'debug' && logLevel !== 'info' && logLevel !== 'warn' && logLevel !== 'error')
    throw new Error('LOG_LEVEL is invalid');
  return Object.freeze({ nodeEnv, host, port, databaseUrl, installationId, logLevel });
}
