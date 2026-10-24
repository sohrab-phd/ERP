import { compose } from '../../src/composition-root.js';
import { PostgresReceivingStore } from '../../src/infrastructure/postgresql/receiving-store.js';
import type { CommandRequest } from '@navard/shared-kernel';

/** Real-source crash checkpoint: all SQL is executed unchanged before pausing. */
const originalStore = new PostgresReceivingStore();
const insert = originalStore.insert.bind(originalStore);
PostgresReceivingStore.prototype.insert = async (...args) => {
  await insert(...args);
  process.send?.({ stage: 'uncommitted-source-before-ips' });
  await new Promise<void>(() => undefined);
};
process.once('message', (supplied: unknown) => {
  void (async () => {
    if (!supplied || typeof supplied !== 'object') throw new Error('Invalid crash fixture');
    const input = supplied as { token: string; factory: string; command: CommandRequest };
    const app = compose({
      nodeEnv: 'production',
      host: '127.0.0.1',
      port: 0,
      databaseUrl: process.env.TEST_DATABASE_URL!,
      installationId: input.factory,
      logLevel: 'error',
      commandAdmissionReconciled: true,
    });
    try {
      const actor = await app.identity.context(input.token, 'ACT-WH');
      const result = await app.command(JSON.stringify(input.command), actor);
      process.send?.({ stage: 'unexpected-completion', status: result.status });
    } finally {
      await app.stop();
    }
  })().catch(() => {
    process.send?.({ stage: 'failed' });
    process.exitCode = 1;
  });
});
