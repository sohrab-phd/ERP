import { Pool } from 'pg';
import {
  CommandRegistry,
  executeCommand,
  type CommandRequest,
  type TransactionPort,
} from '@navard/shared-kernel';
import { InventoryPostingService, type PostingEffect } from '../../src/modules/inventory/index.js';
import { PostgresInventoryStore } from '../../src/infrastructure/postgresql/inventory-store.js';
import {
  PostgresTransactions,
  transactionClient,
} from '../../src/infrastructure/postgresql/transaction.js';
import { PostgresOutcomes } from '../../src/infrastructure/postgresql/outcome-store.js';
import { PostgresAudit } from '../../src/infrastructure/postgresql/audit-store.js';
import { context } from './synthetic-command.js';

async function childMain(stage: string, encoded: string) {
  const runtime = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  runtime.on('error', () => undefined);
  const transactions = new PostgresTransactions(runtime);
  const service = new InventoryPostingService(new PostgresInventoryStore(), {
    authorize: () => Promise.resolve(true),
    validate: () => Promise.resolve(undefined),
    maintain: () => Promise.resolve(true),
  });
  const input = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as CommandRequest;
  async function checkpoint(name: string) {
    if (stage === name) {
      process.send?.({ stage: name });
      await new Promise<void>(() => undefined);
    }
  }
  const port: TransactionPort = {
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
  };
  const result = await executeCommand(JSON.stringify(input), context({ actorRole: 'ACT-WH' }), {
    registry: new CommandRegistry([
      {
        command: 'PostGoodsReceipt',
        version: 1,
        active: true,
        payloadShape: { effects: { type: 'scalar' } },
        preconditionsShape: {},
        async execute(request, actor, transaction) {
          await transactionClient(transaction).query(
            'INSERT INTO envelope_test.fact(identity,material) VALUES($1,$2)',
            [request.target.id, 'synthetic inventory orchestration'],
          );
          if (typeof request.payload.effects !== 'string')
            throw new Error('Invalid fixture effects');
          const effects = JSON.parse(request.payload.effects) as PostingEffect[];
          const rows = await service.post({ actor, request, transaction }, effects);
          await checkpoint('after-inventory');
          return {
            outcome: 'accepted',
            factIdentity: request.target.id,
            event: 'FixtureInventoryPosted',
            data: { ledgerIds: rows.map((row) => row.id) },
          };
        },
      },
    ]),
    transactions: port,
    outcomes: new PostgresOutcomes(),
    audits: new PostgresAudit(),
    authorization: {
      canExecute: () => Promise.resolve(true),
      canReplay: () => Promise.resolve(true),
    },
    recoveryFence: { permitsAdmission: () => Promise.resolve(true) },
  });
  process.send?.({ stage: 'unexpected-completion', status: result.status });
  await runtime.end();
}

if (process.argv[2] === '--inventory-crash') {
  void childMain(process.argv[3] ?? '', process.argv[4] ?? '').catch(() => {
    process.send?.({ stage: 'failed' });
    process.exitCode = 1;
  });
}
