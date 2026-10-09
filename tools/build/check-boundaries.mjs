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
        [
          'inventory-store.ts',
          'inventory-receipt-store.ts',
          'receipt-store.ts',
          'sales-store.ts',
          'inventory-reservation-store.ts',
          'shipping-store.ts',
          'production-store.ts',
          'inventory-production-store.ts',
        ].some((name) => target === resolve('apps/backend/src/infrastructure/postgresql', name)) &&
        file.startsWith(resolve('apps/backend/src') + sep) &&
        file !== resolve('apps/backend/src/composition-root.ts')
      )
        issues.push(
          relative(root, file) + ': inventory persistence import bypasses sole posting owner',
        );
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
    if (
      (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      /\binventory\.(unit|ledger|balance|reservation)\b/i.test(node.text) &&
      file.startsWith(resolve('apps/backend/src') + sep) &&
      file !== resolve('apps/backend/src/infrastructure/postgresql/inventory-store.ts') &&
      !(
        file ===
          resolve('apps/backend/src/infrastructure/postgresql/inventory-reservation-store.ts') &&
        /\bSELECT\b/i.test(node.text) &&
        !/\b(INSERT|UPDATE|DELETE|TRUNCATE|ALTER|DROP|CREATE|GRANT|REVOKE)\b/i.test(node.text)
      )
    )
      issues.push(relative(root, file) + ': inventory SQL outside sole persistence owner');
    if (
      (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      /\binventory\.material_lot\b/i.test(node.text) &&
      file.startsWith(resolve('apps/backend/src') + sep) &&
      file !== resolve('apps/backend/src/infrastructure/postgresql/inventory-receipt-store.ts')
    )
      issues.push(relative(root, file) + ': inventory origin SQL outside persistence owner');
    if (
      (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      /\bprocurement\.goods_receipt\b/i.test(node.text) &&
      file.startsWith(resolve('apps/backend/src') + sep) &&
      file !== resolve('apps/backend/src/infrastructure/postgresql/receipt-store.ts')
    )
      issues.push(relative(root, file) + ': receipt SQL outside persistence owner');
    if (
      (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      /\bsales\.(customer|sales_order|fulfillment_assessment|make_reference)\b/i.test(node.text) &&
      file.startsWith(resolve('apps/backend/src') + sep) &&
      file !== resolve('apps/backend/src/infrastructure/postgresql/sales-store.ts')
    )
      issues.push(relative(root, file) + ': Sales SQL outside persistence owner');
    if (
      (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      /\binventory\.reservation_request\b/i.test(node.text) &&
      file.startsWith(resolve('apps/backend/src') + sep) &&
      file !== resolve('apps/backend/src/infrastructure/postgresql/inventory-reservation-store.ts')
    )
      issues.push(relative(root, file) + ': reservation SQL outside Inventory owner');
    if (
      (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      /\bshipping\.(package|shipment|package_content|dispatch)\b/i.test(node.text) &&
      file.startsWith(resolve('apps/backend/src') + sep) &&
      file !== resolve('apps/backend/src/infrastructure/postgresql/shipping-store.ts')
    )
      issues.push(relative(root, file) + ': Shipping SQL outside persistence owner');
    if (
      (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      /\bproduction\.(production_order|operation|allocation|source_fact|route_snapshot|product_batch)\b/i.test(
        node.text,
      ) &&
      file.startsWith(resolve('apps/backend/src') + sep) &&
      file !== resolve('apps/backend/src/infrastructure/postgresql/production-store.ts')
    )
      issues.push(relative(root, file) + ': Production SQL outside owner');
    if (
      (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      /\binventory\.production_(issue|origin)\b/i.test(node.text) &&
      file.startsWith(resolve('apps/backend/src') + sep) &&
      file !== resolve('apps/backend/src/infrastructure/postgresql/inventory-production-store.ts')
    )
      issues.push(relative(root, file) + ': Production inventory SQL outside Inventory owner');
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
