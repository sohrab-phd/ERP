import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Read-only verification. This never installs, updates or executes the vendor code.
const root = resolve(process.argv[2] ?? join(dirname(fileURLToPath(import.meta.url)), '../..'));
assert.ok(process.argv.length <= 3, 'Expected at most one repository root');
const skillPath = '.agents/skills/ui-ux-pro-max';
const lock = JSON.parse(readFileSync(join(root, 'skills-lock.json'), 'utf8'));
assert.equal(lock.version, 1);
const skill = lock.skills?.['ui-ux-pro-max'];
assert.equal(skill?.source, 'nextlevelbuilder/ui-ux-pro-max-skill');
assert.equal(skill.sourceType, 'github');
assert.equal(skill.skillPath, '.claude/skills/ui-ux-pro-max/SKILL.md');
assert.equal(skill.installPath, skillPath);
assert.equal(skill.distribution, 'vendored');
assert.match(skill.revision, /^[0-9a-f]{40}$/u);
assert.match(skill.upstreamVersion, /^\d+\.\d+\.\d+$/u);
assert.equal(skill.license, 'MIT');
assert.match(skill.computedHash, /^[0-9a-f]{64}$/u);
assert.ok(skill.files && typeof skill.files === 'object' && !Array.isArray(skill.files));

for (const directory of ['.agents', '.agents/skills', skillPath]) {
  const stat = lstatSync(join(root, directory));
  assert.ok(stat.isDirectory() && !stat.isSymbolicLink(), 'Unexpected linked skill directory');
}

const found = [];
function collect(directory, prefix = '') {
  for (const name of readdirSync(directory)) {
    const path = prefix + name;
    const absolute = join(directory, name);
    const stat = lstatSync(absolute);
    assert.ok(!stat.isSymbolicLink(), `Unexpected linked path ${path}`);
    if (stat.isDirectory()) collect(absolute, path + '/');
    else {
      assert.ok(stat.isFile(), `Unexpected special file ${path}`);
      found.push(path);
    }
  }
}
collect(join(root, skillPath));
found.sort((a, b) => a.localeCompare(b));
assert.deepEqual(
  found,
  Object.keys(skill.files).sort((a, b) => a.localeCompare(b)),
  'File inventory differs',
);
const combined = createHash('sha256');
let bytes = 0;
for (const path of found) {
  assert.ok(!path.split('/').includes('..') && !path.includes('\\'), 'Invalid manifest path');
  const content = readFileSync(join(root, skillPath, path));
  const expected = skill.files[path];
  assert.match(expected, /^[0-9a-f]{64}$/u);
  assert.equal(
    createHash('sha256').update(content).digest('hex'),
    expected,
    `Content differs in ${path}`,
  );
  combined.update(path);
  combined.update(content);
  bytes += content.length;
}
assert.equal(combined.digest('hex'), skill.computedHash, 'Combined package hash differs');
assert.ok(found.includes('LICENSE'), 'Missing upstream license');
assert.match(readFileSync(join(root, skillPath, 'LICENSE'), 'utf8'), /^MIT License\r?\n/u);
assert.match(readFileSync(join(root, skillPath, 'SKILL.md'), 'utf8'), /^name: ui-ux-pro-max\r?$/mu);
for (const path of [
  'references/quick-reference.md',
  'references/pro-rules.md',
  'scripts/search.py',
])
  assert.ok(found.includes(path), `Missing required skill path ${path}`);
assert.ok(
  readFileSync(join(root, 'AGENTS.md'), 'utf8').includes(skillPath + '/SKILL.md'),
  'Missing discovery instruction',
);
console.log(
  JSON.stringify({
    skill: 'ui-ux-pro-max',
    revision: skill.revision,
    upstreamVersion: skill.upstreamVersion,
    files: found.length,
    bytes,
    verified: true,
  }),
);
