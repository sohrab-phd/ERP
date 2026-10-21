import { Pool } from 'pg';
import { CommandRegistry, executeCommand, type CommandRequest } from '@navard/shared-kernel';
import { compose } from '../../src/composition-root.js';
import { IdentityAuthorization } from '../../src/modules/identity/index.js';
import { PostgresTransactions } from '../../src/infrastructure/postgresql/transaction.js';
import { PostgresOutcomes } from '../../src/infrastructure/postgresql/outcome-store.js';
import { PostgresAudit } from '../../src/infrastructure/postgresql/audit-store.js';

/** Isolated Windows test child: actual I1 services and personal Identity, IPC checkpoints only. */
async function main(stage: string, encoded: string, token: string, factory: string) {
  const app = compose({
    nodeEnv: 'production',
    host: '127.0.0.1',
    port: 0,
    databaseUrl: process.env.TEST_DATABASE_URL!,
    installationId: factory,
    logLevel: 'error',
    commandAdmissionReconciled: true,
  });
  const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  pool.on('error', () => undefined);
  const transactions = new PostgresTransactions(pool),
    outcomes = new PostgresOutcomes(),
    audits = new PostgresAudit();
  const actor = await app.identity.context(token, 'ACT-PROC');
  const input = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as CommandRequest;
  async function checkpoint(name: string) {
    if (name === stage) {
      process.send?.({ stage: name });
      await new Promise<void>(() => undefined);
    }
  }
  const contracts = app.inbound.contracts().map((contract) => ({
    ...contract,
    async execute(...args: Parameters<NonNullable<typeof contract.execute>>) {
      const result = await contract.execute!(...args);
      await checkpoint('after-handler');
      return result;
    },
  }));
  const result = await executeCommand(JSON.stringify(input), actor, {
    registry: new CommandRegistry(contracts),
    transactions: {
      async begin() {
        const session = await transactions.begin();
        return {
          ...session,
          async commit() {
            await checkpoint('before-commit');
            await session.commit();
            await checkpoint('after-commit');
          },
        };
      },
    },
    outcomes: {
      find: (tx, key) => outcomes.find(tx, key),
      async insert(tx, outcome) {
        await checkpoint('before-outcome');
        await outcomes.insert(tx, outcome);
      },
    },
    audits: {
      async append(tx, event) {
        await checkpoint('before-audit');
        await audits.append(tx, event);
      },
    },
    authorization: new IdentityAuthorization(
      app.identity,
      contracts.map((c) => ({
        command: c.command,
        version: 1,
        roles:
          c.command === 'RegisterOperationalPurchaseOrder'
            ? ['ACT-PROC' as const]
            : ['ACT-PROC' as const, 'ACT-WH' as const],
        canTarget: (context, r) =>
          Promise.resolve(
            context.customerScope === undefined &&
              context.installationId === context.authorityScopeId &&
              r.target.kind ===
                (c.command === 'RegisterOperationalPurchaseOrder'
                  ? 'operational-purchase-order'
                  : 'inbound-catalogue-option'),
          ),
        canDisclose: () => Promise.resolve(true),
      })),
    ),
    recoveryFence: { permitsAdmission: () => Promise.resolve(true) },
  });
  process.send?.({ stage: 'unexpected-completion', status: result.status });
  await pool.end();
  await app.stop();
}

if (process.argv[2] === '--inbound-crash')
  process.once('message', (message: unknown) => {
    if (
      typeof message !== 'object' ||
      message === null ||
      !('token' in message) ||
      !('factory' in message) ||
      typeof message.token !== 'string' ||
      typeof message.factory !== 'string'
    )
      throw new Error('Invalid synthetic IPC input');
    void main(process.argv[3]!, process.argv[4]!, message.token, message.factory).catch(() => {
      process.send?.({ stage: 'child-error' });
      process.exitCode = 1;
    });
  });
