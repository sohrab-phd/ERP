import { rmSync } from 'node:fs';
import { resolve, sep } from 'node:path';
const root = resolve(process.cwd());
for (const p of [
  'apps/backend/dist',
  'packages/shared-kernel/dist',
  'apps/backend/.tsbuildinfo',
  'packages/shared-kernel/.tsbuildinfo',
]) {
  const target = resolve(root, p);
  if (!target.startsWith(root + sep)) throw new Error('Clean target outside workspace');
  rmSync(target, { recursive: true, force: true });
}
