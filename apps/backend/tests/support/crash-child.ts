import { createServer, connect, type Socket } from 'node:net';
import { Pool } from 'pg';
import { PostgresTransactions } from '../../src/infrastructure/postgresql/transaction.js';
import { PostgresOutcomes } from '../../src/infrastructure/postgresql/outcome-store.js';
import { PostgresAudit } from '../../src/infrastructure/postgresql/audit-store.js';
import { harness, syntheticHandler } from './synthetic-command.js';
import type { DatabaseFixture } from './database-fixture.js';
import type { CommandRequest, TransactionPort } from '@navard/shared-kernel';

/** Local disposable-test proxy: forwards traffic but drops a confirmed COMMIT reply. */
export async function lostCommitProxy(targetUrl: string) {
  const target = new URL(targetUrl);
  if (target.hostname !== '127.0.0.1' && target.hostname !== 'localhost')
    throw new Error('Proxy requires local test server');
  let confirmed = false;
  const sockets = new Set<Socket>();
  const server = createServer((frontend) => {
    const backend = connect({ host: target.hostname, port: Number(target.port || 5432) });
    sockets.add(frontend);
    sockets.add(backend);
    frontend.on('error', () => backend.destroy());
    backend.on('error', () => frontend.destroy());
    frontend.on('close', () => {
      sockets.delete(frontend);
      backend.destroy();
    });
    backend.on('close', () => {
      sockets.delete(backend);
      frontend.destroy();
    });
    let startup = true,
      pending = false;
    let incoming = Buffer.alloc(0),
      outgoing = Buffer.alloc(0);
    frontend.on('data', (data: Buffer) => {
      incoming = Buffer.concat([incoming, data]);
      if (startup && incoming.length >= 4) {
        const size = incoming.readInt32BE(0);
        if (incoming.length < size) return backend.write(data);
        incoming = incoming.subarray(size);
        startup = false;
      }
      while (!startup && incoming.length >= 5) {
        const size = incoming.readInt32BE(1) + 1;
        if (incoming.length < size) break;
        if (
          incoming[0] === 81 &&
          incoming
            .subarray(5, size - 1)
            .toString('utf8')
            .trim() === 'COMMIT'
        )
          pending = true;
        incoming = incoming.subarray(size);
      }
      backend.write(data);
    });
    backend.on('data', (data: Buffer) => {
      if (!pending) {
        frontend.write(data);
        return;
      }
      outgoing = Buffer.concat([outgoing, data]);
      while (outgoing.length >= 5) {
        const size = outgoing.readInt32BE(1) + 1;
        if (outgoing.length < size) break;
        if (outgoing[0] === 90) {
          confirmed = true;
          frontend.destroy();
          backend.destroy();
          return;
        }
        outgoing = outgoing.subarray(size);
      }
    });
  });
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Proxy failed to bind');
  const url = new URL(targetUrl);
  url.hostname = '127.0.0.1';
  url.port = String(address.port);
  return {
    url: url.toString(),
    commitConfirmed: () => confirmed,
    close: () =>
      new Promise<void>((resolve, reject) => {
        for (const socket of sockets) socket.destroy();
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

async function childMain(stage: string, encoded: string) {
  const runtime = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
  runtime.on('error', () => undefined);
  const transactions = new PostgresTransactions(runtime);
  const outcomes = new PostgresOutcomes(),
    audit = new PostgresAudit();
  const input = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as CommandRequest;
  async function checkpoint(name: string) {
    if (stage === name) {
      process.send?.({ stage: name });
      await new Promise<void>(() => undefined);
    }
  }
  const transactionPort: TransactionPort = {
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
  const fixture = {
    runtime,
    owner: runtime,
    runtimeRole: 'unused',
    transactions,
    outcomes,
    audit,
    counts: () => Promise.resolve({ facts: 0, outcomes: 0, audits: 0 }),
  } satisfies DatabaseFixture;
  const h = harness(fixture, {
    handler: async (...args) => {
      await checkpoint('before-handler');
      const result = await syntheticHandler(...args);
      await checkpoint('after-facts');
      return result;
    },
    ports: {
      transactions: transactionPort,
      audits: {
        async append(tx, event) {
          await checkpoint('before-audit');
          await audit.append(tx, event);
        },
      },
      outcomes: {
        find: (tx, key) => outcomes.find(tx, key),
        async insert(tx, result) {
          await checkpoint('before-outcome');
          await outcomes.insert(tx, result);
        },
      },
    },
  });
  const result = await h.run(input);
  process.send?.({ stage: 'unexpected-completion', status: result.status });
  await runtime.end();
}

if (process.argv[2] === '--crash-child') {
  void childMain(process.argv[3] ?? '', process.argv[4] ?? '').catch(() => {
    process.send?.({ stage: 'failed' });
    process.exitCode = 1;
  });
}
