import ts from 'typescript';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, relative, sep } from 'node:path';
const root = process.cwd();
const files = [];
const walk = (p) => {
  for (const e of readdirSync(p, { withFileTypes: true })) {
    if (['dist', 'node_modules'].includes(e.name)) continue;
    const f = resolve(p, e.name);
    if (e.isDirectory()) walk(f);
    else if (f.endsWith('.ts')) files.push(f);
  }
};
walk(resolve('apps/backend'));
walk(resolve('packages/shared-kernel'));
const owner = (f) => (f.startsWith(resolve('packages/shared-kernel') + sep) ? 'kernel' : 'backend');
const edges = new Map();
const issues = [];
for (const file of files) {
  const targets = [];
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const check = (value) => {
    if (!ts.isStringLiteralLike(value)) {
      issues.push(relative(root, file) + ': nonliteral import');
      return;
    }
    const name = value.text;
    if (name.startsWith('.')) {
      const target = resolve(dirname(file), name.replace(/\.js$/, '.ts'));
      if (
        owner(target) !== owner(file) ||
        !target.startsWith(
          resolve(owner(file) === 'kernel' ? 'packages/shared-kernel' : 'apps/backend') + sep,
        )
      ) {
        issues.push(relative(root, file) + ': cross-owner relative import ' + name);
        return;
      }
      if (!existsSync(target)) issues.push(relative(root, file) + ': unresolved import ' + name);
      else targets.push(target);
      const moduleRoot = resolve('apps/backend/src/modules') + sep;
      const moduleName = (f) =>
        f.startsWith(moduleRoot) ? relative(moduleRoot, f).split(sep)[0] : undefined;
      const from = moduleName(file),
        to = moduleName(target);
      if (from && from !== to)
        issues.push(relative(root, file) + ': module imports outside its public ownership ' + name);
      if (to && to !== from && target !== resolve(moduleRoot, to, 'index.ts'))
        issues.push(relative(root, file) + ': private module import ' + name);
    } else if (name.startsWith('@navard/')) {
      if (owner(file) === 'kernel' || name !== '@navard/shared-kernel')
        issues.push(relative(root, file) + ': nonpublic package import ' + name);
    } else if (
      owner(file) === 'kernel' &&
      (!name.startsWith('node:') || /^node:(http|https|http2)$/.test(name))
    )
      issues.push(relative(root, file) + ': forbidden kernel dependency ' + name);
    else if (
      name === 'pg' &&
      owner(file) === 'backend' &&
      !relative(resolve('apps/backend'), file).startsWith(
        ['src', 'infrastructure', 'postgresql', ''].join(sep),
      ) &&
      !relative(resolve('apps/backend'), file).startsWith('tests' + sep)
    )
      issues.push(relative(root, file) + ': pg outside persistence owner');
  };
  const visit = (node) => {
    if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier)
      check(node.moduleSpecifier);
    if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      if (node.arguments.length !== 1 || !node.arguments[0]) issues.push('Invalid dynamic import');
      else check(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  edges.set(file, targets);
}
const active = new Set(),
  done = new Set();
const visit = (f) => {
  if (active.has(f)) {
    issues.push('Dependency cycle: ' + relative(root, f));
    return;
  }
  if (done.has(f)) return;
  active.add(f);
  for (const to of edges.get(f) ?? []) visit(to);
  active.delete(f);
  done.add(f);
};
for (const file of files) visit(file);
const exports = JSON.parse(readFileSync('packages/shared-kernel/package.json', 'utf8')).exports;
if (Object.keys(exports).join() !== '.') issues.push('Kernel has deep exports');
if (issues.length) throw new Error(issues.join('\n'));
console.log('Module ownership/import graph: PASS (' + files.length + ' files)');
