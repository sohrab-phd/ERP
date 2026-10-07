import { CommandRegistry, executeCommand } from '@navard/shared-kernel';
import type { ExecutionContext, ExecutionPorts } from '@navard/shared-kernel';
import type { Config } from './config.js';
import { createPool } from './infrastructure/postgresql/pool.js';
import { PostgresTransactions } from './infrastructure/postgresql/transaction.js';
import { PostgresOutcomes } from './infrastructure/postgresql/outcome-store.js';
import { PostgresAudit } from './infrastructure/postgresql/audit-store.js';
import { createLogger } from './infrastructure/logging/json-logger.js';
import { createHttpHost, closeHttpHost } from './transport/http-host.js';
import { createIdentityHandler } from './transport/identity-http.js';
import { IdentityService, IdentityAuthorization } from './modules/identity/index.js';
import { PostgresIdentityStore } from './infrastructure/postgresql/identity-store.js';
/** Own checked-out error handling: the pool's listener covers only idle clients. */
export async function pingDatabase(pool: ReturnType<typeof createPool>): Promise<void> {
  const client = await pool.connect();
  let released = false;
  const release = (discard = false) => {
    if (released) return;
    released = true;
    client.removeListener('error', onError);
    client.release(discard);
  };
  const onError = () => release(true);
  client.on('error', onError);
  const timer = setTimeout(() => release(true), 2000);
  try {
    const result = await client.query<{ compatible: boolean }>(
      "SELECT current_setting('server_version_num')::integer=180006 AND current_setting('server_encoding')='UTF8' AS compatible",
    );
    if (!result.rows[0]?.compatible) throw new Error('Database compatibility failed');
  } finally {
    clearTimeout(timer);
    release();
  }
}
export function compose(config: Readonly<Config>) {
  const pool = createPool(config.databaseUrl);
  const log = createLogger(config.logLevel);
  const transactions = new PostgresTransactions(pool);
  const identity = new IdentityService(
    new PostgresIdentityStore(pool),
    transactions,
    config.installationId,
    config.installationId,
  );
  const ports: ExecutionPorts = {
    registry: new CommandRegistry(),
    transactions,
    outcomes: new PostgresOutcomes(),
    audits: new PostgresAudit(),
    authorization: new IdentityAuthorization(identity, []),
    recoveryFence: { permitsAdmission: () => Promise.resolve(false) },
  };
  const server = createHttpHost({
    ping: () => pingDatabase(pool),
    identity: createIdentityHandler(identity),
  });
  return {
    server,
    registry: ports.registry,
    identity,
    command: (input: string | Uint8Array, context: ExecutionContext) =>
      executeCommand(input, context, ports),
    async start() {
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(config.port, config.host, () => {
          server.off('error', reject);
          resolve();
        });
      });
      log('info', 'host.started');
    },
    async stop() {
      await closeHttpHost(server);
      await pool.end();
      log('info', 'host.stopped');
    },
  };
}
