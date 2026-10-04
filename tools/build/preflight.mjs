import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const read = (p) => JSON.parse(readFileSync(resolve(root, p), 'utf8'));
const p = read('package.json');
const pins = {
  typescript: '6.0.3',
  '@types/pg': '8.23.1',
  '@types/node': '24.19.1',
  eslint: '10.12.0',
  '@eslint/js': '10.0.1',
  'typescript-eslint': '8.71.0',
  prettier: '3.9.9',
};
if (
  process.versions.node !== '24.21.0' ||
  readFileSync('.node-version', 'utf8').trim() !== '24.21.0' ||
  p.packageManager !== 'npm@11.19.0' ||
  p.engines.node !== '24.21.0' ||
  p.engines.npm !== '11.19.0'
)
  throw new Error('Frozen Node/npm baseline mismatch');
if (!process.env.npm_execpath) throw new Error('Run through npm run preflight');
const npm = spawnSync(process.execPath, [process.env.npm_execpath, '--version'], {
  encoding: 'utf8',
});
if (npm.status !== 0 || npm.stdout.trim() !== '11.19.0') throw new Error('Frozen npm mismatch');
for (const [name, version] of Object.entries(pins)) {
  if (
    p.devDependencies[name] !== version ||
    read('node_modules/' + name + '/package.json').version !== version
  )
    throw new Error('Frozen dependency mismatch: ' + name);
}
for (const path of ['apps/backend/package.json', 'packages/shared-kernel/package.json']) {
  const w = read(path);
  if (!w.private || w.type !== 'module' || w.scripts)
    throw new Error('Workspace scripts/visibility differ from freeze');
}
if (
  read('apps/backend/package.json').dependencies.pg !== '8.23.1' ||
  read('node_modules/pg/package.json').version !== '8.23.1'
)
  throw new Error('Frozen pg mismatch');
if (read('package-lock.json').lockfileVersion !== 3) throw new Error('Missing deterministic lock');
console.log('Pinned runtime and package baseline: PASS');
