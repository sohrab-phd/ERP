import assert from 'node:assert/strict';
import test from 'node:test';
import { execFile } from 'node:child_process';
import { writeFile, unlink } from 'node:fs/promises';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

void test('import checker rejects inventory store and SQL bypasses from transport', async () => {
  const rootUrl = new URL('../../../../../', import.meta.url);
  const root = fileURLToPath(rootUrl);
  // Derive source path from repository, rather than compiled test output.
  const target = new URL('apps/backend/src/transport/inventory-boundary-probe.ts', rootUrl);
  const run = promisify(execFile);
  const sources = [
    [
      "import { PostgresInventoryStore } from '../infrastructure/postgresql/inventory-store.js';\nexport const bypass = new PostgresInventoryStore();\n",
      'inventory persistence import bypasses sole posting owner',
    ],
    [
      "export const bypass = 'UPDATE inventory.balance SET on_hand=99';\n",
      'inventory SQL outside sole persistence owner',
    ],
  ];
  for (const [source, finding] of sources) {
    await writeFile(target, source!, { flag: 'wx' });
    try {
      await assert.rejects(
        run(process.execPath, ['tools/build/check-boundaries.mjs'], { cwd: root }),
        (error: unknown) =>
          typeof error === 'object' &&
          error !== null &&
          'stderr' in error &&
          typeof error.stderr === 'string' &&
          error.stderr.includes(finding!),
      );
    } finally {
      await unlink(target);
    }
  }
});
