import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { validateTestDatabase } from '../db/reset-test.mjs';
await validateTestDatabase();
const files = [
  'transaction',
  'outcome-concurrency',
  'replay-audit',
  'crash-retry',
  'migration',
  'permissions',
  'identity',
  'inventory',
  'receipt',
  'receipt-http',
].map((f) => 'apps/backend/dist/tests/integration/' + f + '.test.js');
for (const f of files)
  if (!existsSync(f)) throw new Error('Missing compiled integration test: ' + f);
const r = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...files], {
  encoding: 'utf8',
  maxBuffer: 16 * 1024 * 1024,
});
process.stdout.write(r.stdout ?? '');
process.stderr.write(r.stderr ?? '');
const text = (r.stdout ?? '') + (r.stderr ?? '');
if (r.status !== 0 || !/tests [1-9][0-9]*/.test(text) || /skipped [1-9]/.test(text))
  process.exitCode = 1;
