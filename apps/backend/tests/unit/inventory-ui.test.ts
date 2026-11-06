import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createContext, Script } from 'node:vm';
import { formatInventoryKg, inventoryFilterError } from '../../src/operator/inventory.js';

void test('Inventory Persian kg formatting preserves independently specified exact values', () => {
  const cases = [
    ['0', '۰'],
    ['1', '۱'],
    ['999', '۹۹۹'],
    ['1000', '۱٬۰۰۰'],
    ['9007199254740993', '۹٬۰۰۷٬۱۹۹٬۲۵۴٬۷۴۰٬۹۹۳'],
    ['99999999999999999999.999999999999999999', '۹۹٬۹۹۹٬۹۹۹٬۹۹۹٬۹۹۹٬۹۹۹٬۹۹۹٫۹۹۹۹۹۹۹۹۹۹۹۹۹۹۹۹۹۹'],
    ['70.5', '۷۰٫۵'],
    ['0.000000000000000001', '۰٫۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۰۱'],
    ['1000.000000001', '۱٬۰۰۰٫۰۰۰۰۰۰۰۰۱'],
  ];
  for (const [value, expected] of cases) assert.equal(formatInventoryKg(value!), expected);
  for (const value of [
    '-1',
    '-0',
    '01',
    '1.0',
    '1.50',
    '1.',
    '.5',
    '1e2',
    'NaN',
    '100000000000000000000',
    '0.0000000000000000001',
    '1\n',
  ])
    assert.throws(() => formatInventoryKg(value));
});

void test('Inventory exact filters reject invalid scope-free inputs without normalizing codes', () => {
  assert.equal(inventoryFilterError('internalCode', ' کد-ي ۰۰۱ '), undefined);
  assert.equal(inventoryFilterError('internalCode', '%_\\'), undefined);
  assert.equal(inventoryFilterError('kind', 'کالای ثبت‌شده'), undefined);
  assert.equal(inventoryFilterError('internalCode', '😀'.repeat(128)), undefined);
  for (const value of [' ', '\n', '\u0085', '\ud800', 'x'.repeat(129)])
    assert.ok(inventoryFilterError('internalCode', value));
  assert.ok(inventoryFilterError('kind', 'ر'.repeat(65)));
  assert.ok(inventoryFilterError('state', 'SHIPPED'));
  assert.ok(inventoryFilterError('origin', 'UNKNOWN'));
  assert.ok(inventoryFilterError('unitId', 'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA'));
  assert.equal(inventoryFilterError('unitId', '11111111-1111-4111-8111-111111111111'), undefined);
});

type Interaction = { preventDefault(): void };
let focused: Element | undefined;
const setFocused = (value: Element) => {
  focused = value;
};
class Element {
  children: Element[] = [];
  listeners = new Map<string, ((event: Interaction) => void)[]>();
  attributes = new Map<string, string>();
  dataset: Record<string, string> = {};
  text = '';
  id = '';
  name = '';
  value = '';
  className = '';
  hidden = false;
  disabled = false;
  open = false;
  tabIndex = 0;
  dir = '';
  scope = '';
  noValidate = false;
  maxLength = 0;
  type = '';
  htmlFor = '';
  autocomplete = '';
  constructor(readonly tagName: string) {}
  get textContent(): string {
    return this.text + this.children.map((c) => c.textContent).join('');
  }
  set textContent(value: string) {
    this.text = value;
    this.children = [];
  }
  set innerHTML(_value: string) {
    throw new Error('Unsafe HTML rendering');
  }
  append(...values: Element[]) {
    this.children.push(...values);
  }
  replaceChildren(...values: Element[]) {
    this.text = '';
    this.children = [...values];
  }
  insertBefore(value: Element, before: Element) {
    const index = this.children.indexOf(before);
    assert.ok(index >= 0);
    this.children.splice(index, 0, value);
  }
  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }
  removeAttribute(name: string) {
    this.attributes.delete(name);
  }
  addEventListener(name: string, fn: (event: Interaction) => void) {
    const list = this.listeners.get(name) ?? [];
    list.push(fn);
    this.listeners.set(name, list);
  }
  dispatch(name: string) {
    for (const fn of this.listeners.get(name) ?? []) fn({ preventDefault() {} });
  }
  focus() {
    setFocused(this);
  }
  all(): Element[] {
    return [this, ...this.children.flatMap((c) => c.all())];
  }
  querySelector(selector: string) {
    return this.all().find((e) => selector === '#' + e.id);
  }
}
class Input extends Element {}
class Select extends Element {}
const unitId = '11111111-1111-4111-8111-111111111111';
const lotId = '22222222-2222-4222-8222-222222222222';
const sourceId = '33333333-3333-4333-8333-333333333333';
const unit = {
  unitId,
  lotId,
  kind: 'BEAM',
  locationId: sourceId,
  state: 'AVAILABLE',
  stockClass: 'CURRENT',
  origin: 'PRODUCTION',
  internalCode: null,
  productCode: null,
  productNumber: null,
  materialId: null,
  quantities: {
    onHandKg: '9007199254740993.5',
    reservedKg: '0',
    unreservedKg: '9007199254740993.5',
  },
};
const freshness = {
  observedAt: '2026-11-05T00:00:00.000Z',
  respondedAt: '2026-11-05T00:00:00.010Z',
  consistency: 'PAGE_SNAPSHOT',
  quantityBasis: 'LEDGER_VERIFIED_BALANCE',
};
const page = (items: unknown[] = [unit], nextCursor: string | null = null) => ({
  items,
  nextCursor,
  freshness,
});
const flush = async () => {
  for (let i = 0; i < 12; i++) await Promise.resolve();
};
const deferred = () => {
  let resolve!: (value: unknown) => void;
  const promise = new Promise<unknown>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

async function harness() {
  const root = new Element('section');
  const calls: { path: string; body: Record<string, unknown>; signal: AbortSignal }[] = [];
  const state = {
    allowed: true,
    reply: { data: page() } as unknown,
    failure: undefined as Error | undefined,
  };
  const context = createContext({
    document: {
      createElement(tag: string) {
        return tag === 'select'
          ? new Select(tag)
          : tag === 'input'
            ? new Input(tag)
            : new Element(tag);
      },
    },
    HTMLSelectElement: Select,
    TextEncoder,
    AbortController,
    root,
    canUse: () => state.allowed,
    api: async (path: string, body: Record<string, unknown>, signal: AbortSignal) => {
      calls.push({ path, body, signal });
      if (state.failure) throw state.failure;
      return await state.reply;
    },
  });
  const source = await readFile(
    new URL('../../src/operator/inventory.js', import.meta.url),
    'utf8',
  );
  new Script(
    source.replace(/^export /gmu, '') +
      '\nglobalThis.inventory = createInventory({root,api,canUse});',
  ).runInContext(context);
  const run = <T = unknown>(s: string): T => new Script(s).runInContext(context) as T;
  const element = (id: string) => {
    const value = root.querySelector('#' + id);
    assert.ok(value, 'Expected ' + id);
    return value;
  };
  return { root, calls, state, run, element };
}

void test('actual Inventory component discovers without UUID, renders exact quantities and paginates', async () => {
  const h = await harness();
  h.state.reply = { data: page([unit], 'opaque-next') };
  h.run('inventory.show()');
  await flush();
  assert.equal(h.calls[0]!.path, '/inventory/v1/units/query');
  assert.equal(h.calls[0]!.body.limit, 25);
  assert.equal(Object.keys(h.calls[0]!.body.filters as object).length, 0);
  assert.match(h.root.textContent, /۹٬۰۰۷٬۱۹۹٬۲۵۴٬۷۴۰٬۹۹۳٫۵/u);
  assert.match(h.root.textContent, /رزرو نشده به معنی مجوز/u);
  assert.match(h.root.textContent, /هر صفحه مشاهدهٔ مستقل/u);
  h.state.reply = { data: page([]) };
  h.element('inventory-next').dispatch('click');
  await flush();
  assert.equal(h.calls[1]!.body.cursor, 'opaque-next');
  assert.match(h.root.textContent, /صفحهٔ ۲/u);
  assert.match(h.root.textContent, /مورد قابل مشاهده‌ای/u);
  h.state.reply = { data: page() };
  h.element('inventory-previous').dispatch('click');
  await flush();
  assert.equal(h.calls[2]!.body.cursor, undefined);
});

void test('actual component validates filters, keeps exact business text and never renders it as HTML', async () => {
  const h = await harness();
  h.run('inventory.show()');
  await flush();
  const control = h.element('inventory-filter-unitId');
  control.value = 'invalid';
  control.dispatch('input');
  h.element('inventory-filters').dispatch('submit');
  await flush();
  assert.equal(h.calls.length, 1);
  assert.equal(control.attributes.get('aria-invalid'), 'true');
  assert.equal(focused, control);
  control.value = '';
  control.dispatch('input');
  const code = h.element('inventory-filter-internalCode');
  code.value = ' <img src=x onerror=1> ';
  code.dispatch('input');
  h.state.reply = { data: page([{ ...unit, internalCode: code.value }]) };
  h.element('inventory-filters').dispatch('submit');
  await flush();
  assert.equal((h.calls[1]!.body.filters as Record<string, string>).internalCode, code.value);
  assert.ok(
    h.root
      .all()
      .some((e) => e.tagName === 'bdi' && e.textContent === code.value && e.dir === 'auto'),
  );
});

void test('actual component Unit/Lot/back/refresh displays source kg separate from current and finalized WIP', async () => {
  const h = await harness();
  h.run('inventory.show()');
  await flush();
  h.state.reply = {
    data: {
      unit: {
        ...unit,
        source: {
          family: 'PRODUCTION',
          productBatchId: lotId,
          disposition: 'WIP',
          initialKg: '9999999999999999',
          weightBasis: 'PRODUCTION_POSTED_OUTPUT',
        },
      },
      freshness,
    },
  };
  h.element('inventory-unit-' + unitId).dispatch('click');
  await flush();
  assert.equal(h.calls[1]!.path, '/inventory/v1/units/detail');
  assert.match(h.root.textContent, /طبقه اولیه خروجی تولید \(وضعیت جاری نیست\)/u);
  assert.match(h.root.textContent, /آزاد/u);
  assert.match(h.root.textContent, /کار در جریان اولیه/u);
  assert.match(h.root.textContent, /۹٬۹۹۹٬۹۹۹٬۹۹۹٬۹۹۹٬۹۹۹/u);
  h.state.reply = {
    data: page([
      unit,
      {
        ...unit,
        unitId: sourceId,
        state: 'CONSUMED',
        stockClass: 'HISTORICAL',
        quantities: { onHandKg: '0', reservedKg: '0', unreservedKg: '0' },
      },
    ]),
  };
  h.element('inventory-open-lot').dispatch('click');
  await flush();
  assert.equal(h.calls[2]!.body.lotId, lotId);
  assert.match(h.root.textContent, /سابقه؛ بدون موجودی جاری/u);
  assert.match(h.root.textContent, /این نما مجموع وزن لات نیست/u);
  h.element('inventory-refresh').dispatch('click');
  await flush();
  assert.equal(h.calls[3]!.body.cursor, undefined);
});

void test('refresh and re-entry reconcile unsubmitted drafts with the applied query', async () => {
  const h = await harness();
  h.run('inventory.show()');
  await flush();
  const applied = h.element('inventory-filter-internalCode');
  applied.value = 'applied-code';
  applied.dispatch('input');
  h.element('inventory-filters').dispatch('submit');
  await flush();
  const draft = h.element('inventory-filter-internalCode');
  draft.value = 'unsubmitted-code';
  draft.dispatch('input');
  const kind = h.element('inventory-filter-kind');
  kind.value = 'unsubmitted-kind';
  kind.dispatch('input');
  h.element('inventory-refresh').dispatch('click');
  await flush();
  assert.deepEqual(
    { ...(h.calls.at(-1)!.body.filters as object) },
    { internalCode: 'applied-code' },
  );
  assert.equal(h.element('inventory-filter-internalCode').value, 'applied-code');
  assert.equal(h.element('inventory-filter-kind').value, '');
  const again = h.element('inventory-filter-internalCode');
  again.value = 'another-unsubmitted-code';
  again.dispatch('input');
  h.run('inventory.hide(); inventory.show()');
  await flush();
  assert.deepEqual(
    { ...(h.calls.at(-1)!.body.filters as object) },
    { internalCode: 'applied-code' },
  );
  assert.equal(h.element('inventory-filter-internalCode').value, 'applied-code');
});

void test('actual component suppresses old filter/page responses and aborts them without trusting abort', async () => {
  const h = await harness();
  const old = deferred();
  h.state.reply = old.promise;
  h.run('inventory.show()');
  await flush();
  const oldSignal = h.calls[0]!.signal;
  const code = h.element('inventory-filter-internalCode');
  code.value = 'new-filter';
  code.dispatch('input');
  assert.equal(oldSignal.aborted, true);
  h.state.reply = { data: page([{ ...unit, internalCode: 'new-private-stock' }]) };
  h.element('inventory-filters').dispatch('submit');
  await flush();
  old.resolve({ data: page([{ ...unit, internalCode: 'old-private-stock' }]) });
  await flush();
  assert.match(h.root.textContent, /new-private-stock/u);
  assert.doesNotMatch(h.root.textContent, /old-private-stock/u);
});

void test('actual component clears filters/cursors/private rows on ownership loss and rejects delayed render', async () => {
  const h = await harness();
  h.run('inventory.show()');
  await flush();
  const old = deferred();
  h.state.reply = old.promise;
  h.element('inventory-refresh').dispatch('click');
  await flush();
  h.state.allowed = false;
  h.run('inventory.clear()');
  old.resolve({ data: page([{ ...unit, internalCode: 'private-old-actor' }]) });
  await flush();
  assert.equal(h.root.textContent, '');
  assert.equal(h.calls.at(-1)!.signal.aborted, true);
  h.state.allowed = true;
  h.state.reply = { data: page() };
  h.run('inventory.show()');
  await flush();
  assert.equal(Object.keys(h.calls.at(-1)!.body.filters as object).length, 0);
  assert.equal(h.calls.at(-1)!.body.cursor, undefined);
});

void test('actual component cursor restart and read-limit errors never claim uncertain writes', async () => {
  const h = await harness();
  h.state.failure = Object.assign(new Error('read failure'), {
    status: 400,
    outcome: { error: 'invalid-cursor' },
  });
  h.run('inventory.show()');
  await flush();
  assert.match(h.root.textContent, /اعتبار صفحه پایان یافته/u);
  h.state.failure = undefined;
  h.element('inventory-retry').dispatch('click');
  await flush();
  assert.equal(h.calls.at(-1)!.body.cursor, undefined);
  h.state.failure = Object.assign(new Error('read failure'), {
    status: 422,
    outcome: { error: 'query-limit' },
  });
  h.element('inventory-refresh').dispatch('click');
  await flush();
  assert.match(h.root.textContent, /فیلتر این مشکل را حل نمی‌کند/u);
  assert.doesNotMatch(h.root.textContent, /نتیجهٔ عملیات ثبت ممکن است هنوز نامعلوم/u);
});
