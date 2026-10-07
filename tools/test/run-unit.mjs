import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const files = [
  'packages/shared-kernel/dist/tests/unit/binding.test.js',
  'packages/shared-kernel/dist/tests/unit/canonical-json.test.js',
  'packages/shared-kernel/dist/tests/unit/execute.test.js',
  'packages/shared-kernel/dist/tests/unit/admission.test.js',
  'apps/backend/dist/tests/unit/config.test.js',
  'apps/backend/dist/tests/unit/http-host.test.js',
  'apps/backend/dist/tests/unit/logger.test.js',
  'apps/backend/dist/tests/unit/identity.test.js',
];
for (const f of files) if (!existsSync(f)) throw new Error('Missing compiled test: ' + f);
const r = spawnSync(process.execPath, ['--test', '--test-concurrency=1', ...files], {
  encoding: 'utf8',
});
process.stdout.write(r.stdout ?? '');
process.stderr.write(r.stderr ?? '');
const text = (r.stdout ?? '') + (r.stderr ?? '');
if (r.status !== 0 || !/tests [1-9][0-9]*/.test(text) || /skipped [1-9]/.test(text))
  process.exitCode = 1;
