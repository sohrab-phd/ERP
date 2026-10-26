import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createContext, Script } from 'node:vm';
import { randomBytes } from 'node:crypto';
import * as intent from '../../src/operator/intent.js';
import { textValue } from '../../src/operator/display.js';

// Component tests execute the built application, not a second session/rendering
// implementation. This deliberately small DOM/clock adapter is not browser E2E.
class Element {
  children: Element[] = [];
  parent: Element | undefined;
  hidden = false;
  disabled = false;
  value = '';
  name = '';
  required = false;
  id = '';
  checked = false;
  dataset: Record<string, string> = {};
  attributes = new Map<string, string>();
  listeners = new Map<string, ((event: Interaction) => void)[]>();
  private text = '';
  constructor(readonly tagName = 'div') {}
  get textContent(): string {
    return this.text + this.children.map((child) => child.textContent).join('');
  }
  set textContent(value: string) {
    this.text = value;
    this.children = [];
  }
  get options() {
    return this.children;
  }
  append(...children: Element[]) {
    for (const child of children) {
      child.parent = this;
      this.children.push(child);
    }
  }
  replaceChildren(...children: Element[]) {
    this.text = '';
    this.children = [];
    this.append(...children);
  }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this);
  }
  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
  }
  addEventListener(type: string, listener: (event: Interaction) => void) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }
  querySelectorAll(selector: string): Element[] {
    return this.children.flatMap((child) => [
      ...(selector
        .split(',')
        .some((part) =>
          part === 'select[data-catalogue]'
            ? child.tagName === 'select' && !!child.dataset.catalogue
            : child.tagName === part,
        )
        ? [child]
        : []),
      ...child.querySelectorAll(selector),
    ]);
  }
  querySelector(selector: string) {
    return this.querySelectorAll(selector)[0];
  }
  reset() {
    for (const control of this.querySelectorAll('input,select')) control.value = '';
  }
  focus() {}
}
class Input extends Element {}
class Select extends Element {}
class Interaction {
  prevented = false;
  stopped = false;
  constructor(readonly target: Element) {}
  preventDefault() {
    this.prevented = true;
  }
  stopImmediatePropagation() {
    this.stopped = true;
  }
}

const idle = 30 * 60 * 1000;
const initial = Date.parse('2026-10-26T00:00:00Z');
const order = {
  orderId: '11111111-1111-4111-8111-111111111111',
  orderReference: 'private original',
  registrationDateJalali: '1403-12-30',
  lines: [],
};
function person(name = 'A', role = 'ACT-PROC') {
  return {
    accountId: 'account-' + name,
    personId: 'person-' + name,
    username: name,
    expiresAt: new Date(initial + 8 * 60 * 60 * 1000).toISOString(),
    grants: [{ actorRole: role }],
    browser: { csrf: 'csrf-' + name, recoveryKey: randomBytes(32).toString('base64url') },
  };
}
interface Page {
  items: Record<string, unknown>[];
  snapshotAt?: string;
  nextAfterId?: string;
}
async function harness() {
  const elements = new Map<string, Element>();
  const element = (id: string) => {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id)!;
  };
  element('receiving-view').value = 'LINES';
  element('login-form').append(new Element('button'));
  const document = new Element();
  const window = new Element();
  const storage = new Map<string, string>();
  let wall = initial;
  let monotonic = 0;
  let sequence = 0;
  const timers = new Map<number, { at: number; callback: () => void; repeat?: number }>();
  const requests: { path: string; body: unknown }[] = [];
  const pages: Page[] = [];
  const state = {
    actor: person(),
    status: 200,
    dropCommand: false,
    hold: undefined as undefined | Promise<Response>,
    original: { ...order, lines: [] as Record<string, unknown>[] },
  };
  const context = createContext({
    ...intent,
    textValue,
    document: Object.assign(document, {
      visibilityState: 'visible',
      getElementById: element,
      createElement: (tag: string) =>
        tag === 'select' ? new Select(tag) : tag === 'input' ? new Input(tag) : new Element(tag),
      querySelectorAll: (selector: string) =>
        [...elements.values()].flatMap((root) => root.querySelectorAll(selector)),
    }),
    window,
    HTMLInputElement: Input,
    HTMLSelectElement: Select,
    BroadcastChannel: class {
      postMessage() {}
    },
    Date: class extends Date {
      static override now() {
        return wall;
      }
    },
    performance: { now: () => monotonic },
    setTimeout: (callback: () => void, delay: number) => {
      timers.set(++sequence, { at: monotonic + delay, callback });
      return sequence;
    },
    clearTimeout: (id: number) => timers.delete(id),
    // Retained only so the same regressions can run against the original source.
    setInterval: (callback: () => void, delay: number) => {
      timers.set(++sequence, { at: monotonic + delay, callback, repeat: delay });
      return sequence;
    },
    sessionStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
    AbortController,
    crypto,
    TextEncoder,
    fetch: async (path: string, options: { body?: string }) => {
      requests.push({ path, body: options.body ? JSON.parse(options.body) : undefined });
      if (state.hold) return state.hold;
      if (state.status !== 200) return new Response('{}', { status: state.status });
      if (path.endsWith('/identity/session')) return Response.json(state.actor);
      if (path.endsWith('/inbound-catalogues/query')) return Response.json({ data: { items: [] } });
      if (path.endsWith('/receiving/orders/query'))
        return Response.json({ data: pages.shift() ?? { items: [] } });
      if (path.endsWith('/operational-orders') || path.endsWith('/receiving/confirm')) {
        if (state.dropCommand) throw new Error('controlled response loss');
        return Response.json({ status: 'completed', result: { outcome: 'accepted' } });
      }
      if (path.endsWith('/receiving/arrivals/query'))
        return Response.json({ data: { arrival: { arrivalId: 'canonical' }, items: [] } });
      return Response.json({ data: state.original });
    },
  });
  // Only static module linkage and auto-start are supplied by the test adapter.
  // All application functions and event registrations remain the actual code.
  const editorSource = await readFile(
    new URL('../../src/operator/receiving.js', import.meta.url),
    'utf8',
  );
  new Script(
    'globalThis.createReceiving = (() => {' +
      editorSource
        .replace(/^import[^\n]+\n/gmu, '')
        .replace('export function createReceiving', 'function createReceiving') +
      '\n;return createReceiving;})();',
  ).runInContext(context);
  const source = await readFile(
    process.env.P1_OPERATOR_APP_SOURCE ?? new URL('../../src/operator/app.js', import.meta.url),
    'utf8',
  );
  new Script(
    source
      .replace(/^import[\s\S]*?from ['"][^'"]+['"];\r?\n/gmu, '')
      .replace(/^export \{\};?\r?\n/gmu, '')
      .replace('action(bootstrap)();', ''),
    { filename: 'actual-operator-app.js' },
  ).runInContext(context);
  const run = <T = unknown>(expression: string): T =>
    new Script(expression).runInContext(context) as T;
  await run<Promise<void>>('bootstrap()');
  return {
    run,
    element,
    storage,
    requests,
    pages,
    state,
    async advance(ms: number, runTimers = true, wallDelta = ms) {
      wall += wallDelta;
      monotonic += ms;
      if (runTimers) {
        for (const [id, timer] of [...timers]) {
          if (timer.at > monotonic) continue;
          timers.delete(id);
          if (timer.repeat) timers.set(id, { ...timer, at: monotonic + timer.repeat });
          timer.callback();
        }
        await Promise.resolve();
      }
    },
    emit(type: string, surface: 'window' | 'document' = 'document') {
      const event = new Interaction(new Element());
      for (const listener of (surface === 'window' ? window : document).listeners.get(type) ?? []) {
        listener(event);
        if (event.stopped) break;
      }
      return event;
    },
    async login() {
      // Exercise the registered production login handler, including its epoch and
      // deadline reset, rather than assigning session state from the adapter.
      const form = element('login-form');
      const button = form.querySelector('button')!;
      for (const listener of form.listeners.get('submit') ?? []) listener(new Interaction(form));
      for (let attempt = 0; button.disabled && attempt < 250; attempt++)
        await new Promise((resolve) => setTimeout(resolve, 1));
      assert.equal(button.disabled, false, 'login handler must settle');
    },
  };
}

async function receivingEditorHarness() {
  const h = await harness();
  h.run('lock("switch")');
  h.state.actor = person('warehouse', 'ACT-WH');
  Object.assign(h.state.actor.browser, {
    receivingLocation: { id: order.orderId, label: 'محل آزمون' },
  });
  await h.run<Promise<void>>('session()');
  const material = '22222222-2222-4222-8222-222222222222',
    lineId = '33333333-3333-4333-8333-333333333333';
  h.state.original = {
    ...order,
    lines: [
      {
        lineId,
        position: 1,
        materialType: { optionId: material, label: 'COIL' },
        widthM: '99999999999999999999.123456789012345678',
        thicknessMm: '0.35',
        unitWeightKg: '99999999999999999999',
        orderedUnitCount: '5',
      },
    ],
  };
  h.run(
    `catalogues.get('MATERIAL_TYPE').set('${material}',{optionId:'${material}',catalogue:'MATERIAL_TYPE',label:'COIL'});navigate('receiving-panel')`,
  );
  const root = h.element('receiving-panel');
  const control = (prefix: string) =>
    root.querySelectorAll('input,select').find((c) => c.id.startsWith(prefix))!;
  // Native selects choose their first option; this minimal DOM adapter does not.
  for (const prefix of [
    'state-colorOptionId',
    'state-qualityGradeOptionId',
    'state-ralColorNumber',
    'state-lengthM',
  ])
    control(prefix).value = 'NOT_RECORDED';
  control('association-').value = 'ORDER_LINE';
  const emit = (element: Element, event: string) => {
    for (const listener of element.listeners.get(event) ?? []) listener(new Interaction(element));
  };
  const settle = async () => {
    for (let i = 0; i < 30; i++) await new Promise((resolve) => setTimeout(resolve, 1));
  };
  control('receive-lookup').value = order.orderReference;
  h.pages.push({
    items: [{ ...h.state.original.lines[0], acceptedUnitCount: '0', remainingUnitCount: '5' }],
    snapshotAt: 'page-one',
  });
  emit(root.querySelectorAll('form')[0]!, 'submit');
  await settle();
  control('unit-order').value = order.orderId;
  emit(control('unit-order'), 'change');
  control('unit-line').value = lineId;
  emit(control('unit-line'), 'change');
  const button = (text: string) =>
    root.querySelectorAll('button').find((b) => b.textContent === text)!;
  emit(button('مشخصات همین واحد مطابق اصل بررسی شد؛ درج مقادیر'), 'click');
  control('system-').value = 'private-P2-system';
  control('product-').value = 'distinct-product';
  control('waybill-').value = 'private-waybill';
  control('receipt-').value = 'receipt-business-reference';
  control('receive-arrivalDateJalali').value = '1403-12-30';
  control('receive-originNetKg').value = '09007199254740993.12500';
  control('accept-confirmed').checked = true;
  const prepare = () => emit(root.querySelectorAll('form')[1]!, 'submit');
  return { ...h, root, control, button, emit, settle, prepare };
}

void test('P2 complete receiving review freezes exact intent; repeated clicks, local lock and same-actor replay preserve it', async () => {
  const h = await receivingEditorHarness();
  const physicalUnit = h.root
    .querySelectorAll('fieldset')
    .find((field) => field.children[0]?.textContent.startsWith('واحد فیزیکی'))!;
  assert.match(
    physicalUnit.textContent,
    /page-one/u,
    'selected original/progress retains its own query-page timestamp',
  );
  h.prepare();
  const actor = h.state.actor;
  assert.equal(h.button('تأیید نهایی دریافت و ثبت موجودی').disabled, false);
  h.control('system-').value = 'changed-after-review';
  h.state.dropCommand = true;
  h.emit(h.button('تأیید نهایی دریافت و ثبت موجودی'), 'click');
  h.emit(h.button('تأیید نهایی دریافت و ثبت موجودی'), 'click');
  await h.settle();
  const submissions = () => h.requests.filter((r) => r.path.endsWith('/receiving/confirm'));
  assert.equal(submissions().length, 1);
  const encrypted = h.storage.get(intent.pendingSlot)!;
  assert.ok(encrypted && !encrypted.includes('private-waybill'));
  const pending = await intent.openIntent(encrypted, actor.browser.recoveryKey);
  const command = JSON.parse(pending.body) as {
    payload: {
      units: Record<string, unknown>[];
      originNetKg: string;
      arrivalDateJalali: string;
      destinationNetKg?: string;
    };
    preconditions: { lineProgress: unknown[] };
  };
  assert.equal(command.payload.units[0]!.internalSystemCode, 'private-P2-system');
  assert.equal(command.payload.originNetKg, '09007199254740993.12500');
  assert.equal(command.payload.arrivalDateJalali, '1403-12-30');
  assert.equal(Object.hasOwn(command.payload, 'destinationNetKg'), false);
  const actual = command.payload.units[0]!.actual as Record<string, unknown>;
  assert.equal(actual.widthM, '99999999999999999999.123456789012345678');
  assert.equal(actual.unitWeightKg, '99999999999999999999');
  assert.equal(Object.hasOwn(actual, 'colorOptionId'), false);
  assert.equal(command.preconditions.lineProgress.length, 1);
  await h.advance(idle);
  assert.equal(h.element('receiving-panel').textContent, '');
  assert.equal(h.run('self'), undefined);
  assert.equal(h.run('pending'), undefined);
  assert.equal(h.storage.get(intent.pendingSlot), encrypted);
  h.state.actor = person('other', 'ACT-WH');
  await h.run<Promise<void>>('session()');
  await h.run<Promise<void>>('dispatchPending()');
  assert.equal(submissions().length, 1);
  assert.equal(h.run('lockedPending'), true);
  h.run('lock("original")');
  h.state.actor = actor;
  await h.run<Promise<void>>('session()');
  assert.equal(h.run('pending.body'), pending.body);
  h.state.dropCommand = false;
  await h.run<Promise<void>>('dispatchPending()');
  assert.equal(submissions().length, 2);
  assert.deepEqual(submissions()[0]!.body, submissions()[1]!.body);
  assert.equal(h.storage.has(intent.pendingSlot), false);
});

void test('P2 explicit absent actual values survive review and definitive rejection releases only the frozen review', async () => {
  const h = await receivingEditorHarness();
  h.emit(h.button('افزودن واحد فیزیکی'), 'click');
  h.emit(h.button('افزودن واحد فیزیکی'), 'click');
  const second = h.root
    .querySelectorAll('fieldset')
    .find((field) => field.children[0]?.textContent === 'واحد فیزیکی 2')!;
  h.emit(
    second
      .querySelectorAll('button')
      .find((button) => button.textContent === 'حذف این واحد پیش از تأیید')!,
    'click',
  );
  h.emit(h.button('افزودن واحد فیزیکی'), 'click');
  const physical = h.root
    .querySelectorAll('fieldset')
    .filter((field) => field.children[0]?.textContent.startsWith('واحد فیزیکی'));
  assert.deepEqual(
    physical.map((field) => field.children[0]!.textContent),
    ['واحد فیزیکی 1', 'واحد فیزیکی 2', 'واحد فیزیکی 3'],
  );
  for (const added of physical.slice(1))
    h.emit(
      added
        .querySelectorAll('button')
        .find((button) => button.textContent === 'حذف این واحد پیش از تأیید')!,
      'click',
    );
  h.control('state-colorOptionId').value = 'ABSENT';
  h.prepare();
  h.state.status = 422;
  h.emit(h.button('تأیید نهایی دریافت و ثبت موجودی'), 'click');
  await h.settle();
  const sent = h.requests.find((r) => r.path.endsWith('/receiving/confirm'))!.body as {
    payload: { units: { actual: Record<string, unknown> }[] };
  };
  assert.equal(sent.payload.units[0]!.actual.colorOptionId, null);
  assert.equal(h.run('pending'), undefined);
  assert.equal(h.storage.has(intent.pendingSlot), false);
  assert.equal(h.control('system-').value, 'private-P2-system');
  h.state.status = 200;
  h.prepare();
  assert.equal(h.button('تأیید نهایی دریافت و ثبت موجودی').disabled, false);
});

void test('P2 missing installation placement cannot open an entry form; PROC navigation cannot open receiving editor', async () => {
  const h = await harness();
  h.run('navigate("receiving-panel")');
  assert.equal(h.element('receiving-panel').hidden, true);
  assert.equal(h.element('show-receive').hidden, true);
  h.run('lock("switch")');
  h.state.actor = person('warehouse', 'ACT-WH');
  await h.run<Promise<void>>('session()');
  h.run('navigate("receiving-panel")');
  assert.match(h.element('receiving-panel').textContent, /پیکربندی نشده/u);
  assert.equal(h.element('receiving-panel').querySelectorAll('form').length, 0);
});

void test('R-01 foreground idle lock clears sensitive roots/DOM but preserves actor-bound encrypted immutable recovery', async () => {
  const h = await harness();
  const original = h.state.actor;
  h.state.dropCommand = true;
  const body = intent.commandBody(
    'RegisterOperationalPurchaseOrder',
    'operational-purchase-order',
    {
      orderReference: 'private pending',
      registrationDateJalali: '1403-12-30',
      lines: [],
    },
  );
  await assert.rejects(
    h.run<Promise<void>>(`startCommand('/purchasing/operational-orders', ${JSON.stringify(body)})`),
  );
  const ciphertext = h.storage.get(intent.pendingSlot)!;
  assert.ok(ciphertext && !ciphertext.includes('private pending'));
  h.element('order-result').textContent = 'private original';
  h.element('receiving-result').textContent = 'private receiving';
  h.run('currentOrder = {orderReference:"private original"}; prepared = {private: true}');
  const requestCount = h.requests.length;
  await h.advance(idle - 1);
  assert.equal(h.run('!!self'), true);
  h.emit('pointerdown');
  h.emit('keydown');
  await h.advance(1);
  assert.equal(h.run('self'), undefined);
  assert.equal(h.run('pending'), undefined);
  assert.equal(h.run('prepared'), undefined);
  assert.equal(h.run('currentOrder'), undefined);
  assert.equal(h.element('workspace').hidden, true);
  for (const id of ['order-result', 'receiving-result', 'recovery-reference'])
    assert.equal(h.element(id).textContent, '');
  assert.equal(
    h.requests.length,
    requestCount,
    'passive timers/input do not renew server sessions',
  );
  assert.equal(h.storage.get(intent.pendingSlot), ciphertext);

  h.state.actor = person('B', 'ACT-WH');
  await h.run<Promise<void>>('session()');
  assert.equal(h.run('pending'), undefined);
  assert.equal(h.run('lockedPending'), true);
  assert.equal(h.element('recover').disabled, true);
  const beforeRetry = h.requests.length;
  await h.run<Promise<void>>('dispatchPending()');
  await h.run<Promise<void>>(
    `startCommand('/purchasing/operational-orders', ${JSON.stringify(body)})`,
  );
  assert.equal(h.requests.length, beforeRetry, 'wrong actor cannot retry or overwrite ciphertext');
  assert.equal(h.storage.get(intent.pendingSlot), ciphertext);

  h.run('lock("switch")');
  h.state.actor = original;
  await h.run<Promise<void>>('session()');
  assert.equal(h.run('pending.body'), body);
  h.state.dropCommand = false;
  await h.run<Promise<void>>('dispatchPending()');
  const submissions = h.requests.filter((request) => request.path.endsWith('/operational-orders'));
  assert.equal(submissions.length, 2);
  assert.deepEqual(submissions[0]!.body, submissions[1]!.body);
  assert.equal(h.storage.has(intent.pendingSlot), false);
});

void test('R-01 only successful authenticated request-start evidence renews local idle validity', async () => {
  const h = await harness();
  await h.advance(idle - 1000);
  await h.run<Promise<void>>('loadCatalogue("COLOR")');
  await h.advance(1000);
  assert.equal(h.run('!!self'), true, 'the obsolete original timer cannot lock an active session');
  await h.advance(idle - 1001);
  assert.equal(h.run('!!self'), true);
  await h.advance(1);
  assert.equal(h.run('self'), undefined);
});

void test('R-01 response latency is deducted from the local budget and uncertain responses do not renew it', async () => {
  const h = await harness();
  await h.advance(1000);
  let release!: (value: Response) => void;
  h.state.hold = new Promise<Response>((resolve) => {
    release = resolve;
  });
  const reading = h.run<Promise<void>>('loadCatalogue("COLOR")');
  await h.advance(10000);
  release(Response.json({ data: { items: [] } }));
  await reading;
  h.state.hold = undefined;
  await h.advance(idle - 10001);
  assert.equal(h.run('!!self'), true);
  await h.advance(1);
  assert.equal(h.run('self'), undefined, 'receipt time must not extend the deadline');

  const uncertain = await harness();
  await uncertain.advance(idle - 1000);
  uncertain.state.status = 503;
  await assert.rejects(uncertain.run<Promise<void>>('loadCatalogue("COLOR")'));
  await uncertain.advance(1000);
  assert.equal(uncertain.run('self'), undefined, 'an uncertain response is not renewal proof');
});

void test('R-01 delayed timers, resumed lifecycle and attempted UI actions enforce expiry before dispatch', async () => {
  for (const [type, surface] of [
    ['focus', 'window'],
    ['pageshow', 'window'],
    ['visibilitychange', 'document'],
    ['pointerdown', 'document'],
    ['keydown', 'document'],
    ['click', 'document'],
    ['submit', 'document'],
    ['change', 'document'],
  ] as const) {
    const h = await harness();
    await h.advance(idle, false);
    const before = h.requests.length;
    h.emit(type, surface);
    await Promise.resolve();
    assert.equal(h.run('self'), undefined, type);
    assert.equal(h.requests.length, before, type + ' must not send a renewal request after expiry');
  }
});

void test('R-01 in-flight late replies, server denial, absolute expiry and backward wall-clock do not restore expired state', async () => {
  const h = await harness();
  let release!: (value: Response) => void;
  h.state.hold = new Promise<Response>((resolve) => {
    release = resolve;
  });
  const reading = h.run<Promise<void>>('readOrder("/purchasing/operational-orders/id")');
  await h.advance(idle, false);
  release(Response.json({ data: order }));
  await assert.rejects(reading);
  assert.equal(h.run('self'), undefined);
  assert.equal(h.element('order-result').textContent, '');
  for (const status of [401, 403]) {
    const denied = await harness();
    denied.state.status = status;
    await assert.rejects(denied.run<Promise<void>>('loadCatalogue("COLOR")'));
    assert.equal(denied.run('self'), undefined);
  }
  const absolute = await harness();
  absolute.run(`self.expiresAt = new Date(Date.now()+1000).toISOString(); armExpiry()`);
  await absolute.advance(1000);
  assert.equal(absolute.run('self'), undefined);
  const rollback = await harness();
  await rollback.advance(idle, true, -1000);
  assert.equal(rollback.run('self'), undefined, 'monotonic deadline survives backward wall time');
});

void test('RV-01 full changed-grant revalidation rejects delayed expired decryption and preserves original recovery', async () => {
  const h = await harness();
  h.state.dropCommand = true;
  const body = intent.commandBody(
    'RegisterOperationalPurchaseOrder',
    'operational-purchase-order',
    {
      orderReference: 'private delayed recovery',
      registrationDateJalali: '1403-12-30',
      lines: [],
    },
  );
  await assert.rejects(
    h.run<Promise<void>>(`startCommand('/purchasing/operational-orders', ${JSON.stringify(body)})`),
  );
  const ciphertext = h.storage.get(intent.pendingSlot)!;
  h.state.actor.grants.push({ actorRole: 'ACT-WH' });
  // Keep real decryption, but control when its continuation may return to the app.
  h.run(`const originalOpen = openIntent; let releaseOpen;
    openIntent = async (...args) => {
      const result = await originalOpen(...args);
      await new Promise(resolve => { releaseOpen = resolve });
      return result;
    }`);
  const revalidating = h.run<Promise<void>>('revalidate()');
  for (let attempt = 0; !h.run('typeof releaseOpen === "function"') && attempt < 250; attempt++)
    await new Promise((resolve) => setTimeout(resolve, 1));
  assert.equal(h.run('typeof releaseOpen'), 'function', 'changed grants must reach recovery');
  const beforeRelease = h.requests.length;
  await h.advance(idle + 1, false);
  h.run('releaseOpen()');
  await assert.rejects(revalidating, 'the complete production caller must reject expired recovery');
  assert.equal(h.run('checking'), false);
  for (const root of ['self', 'pending', 'prepared', 'currentOrder'])
    assert.equal(h.run(root), undefined, root);
  assert.equal(h.element('workspace').hidden, true);
  for (const id of ['order-result', 'receiving-result', 'recovery-reference'])
    assert.equal(h.element(id).textContent, '');
  assert.equal(h.requests.length, beforeRelease, 'expired continuation dispatches no new command');
  assert.equal(h.storage.get(intent.pendingSlot), ciphertext);

  h.run('openIntent = originalOpen');
  h.state.actor.browser.csrf = 'new-login-A';
  h.state.actor.expiresAt = new Date(
    h.run<number>('Date.now()') + 8 * 60 * 60 * 1000,
  ).toISOString();
  await h.login();
  assert.equal(h.run('self.browser.csrf'), 'new-login-A');
  assert.equal(h.run('pending.body'), body);
  assert.equal(h.storage.get(intent.pendingSlot), ciphertext);
  h.state.dropCommand = false;
  await h.run<Promise<void>>('dispatchPending()');
  const submissions = h.requests.filter((request) => request.path.endsWith('/operational-orders'));
  assert.equal(submissions.length, 2);
  assert.deepEqual(submissions[0]!.body, submissions[1]!.body);
  assert.equal(h.storage.has(intent.pendingSlot), false);
});

void test('RV-02 absolute monotonic cap survives rollback, grants and concurrent renewal; genuine login resets it', async () => {
  const h = await harness();
  h.state.dropCommand = true;
  const body = intent.commandBody(
    'RegisterOperationalPurchaseOrder',
    'operational-purchase-order',
    {
      orderReference: 'private absolute recovery',
      registrationDateJalali: '1403-12-30',
      lines: [],
    },
  );
  await assert.rejects(
    h.run<Promise<void>>(`startCommand('/purchasing/operational-orders', ${JSON.stringify(body)})`),
  );
  const ciphertext = h.storage.get(intent.pendingSlot)!;
  // Every success is before the original eight-hour server absolute deadline.
  for (let i = 0; i < 23; i++) {
    await h.advance(20 * 60 * 1000);
    await h.run<Promise<void>>('loadCatalogue("COLOR")');
  }
  h.element('order-result').textContent = 'private absolute original';
  h.element('receiving-result').textContent = 'private absolute receiving';
  await h.advance(0, false, -60 * 60 * 1000);
  h.state.actor.grants.push({ actorRole: 'ACT-WH' });
  await h.run<Promise<void>>('revalidate()');
  let releaseOlder!: (value: Response) => void;
  h.state.hold = new Promise<Response>((resolve) => {
    releaseOlder = resolve;
  });
  const older = h.run<Promise<void>>('session()');
  await h.advance(1000);
  let releaseNewer!: (value: Response) => void;
  h.state.hold = new Promise<Response>((resolve) => {
    releaseNewer = resolve;
  });
  const newer = h.run<Promise<void>>('session()');
  releaseNewer(Response.json(h.state.actor));
  await newer;
  releaseOlder(Response.json(h.state.actor));
  await older;
  h.element('order-result').textContent = 'private absolute original';
  h.element('receiving-result').textContent = 'private absolute receiving';
  let releaseObsolete!: (value: Response) => void;
  h.state.hold = new Promise<Response>((resolve) => {
    releaseObsolete = resolve;
  });
  const obsoleteSession = JSON.parse(JSON.stringify(h.state.actor)) as typeof h.state.actor;
  // The server's successful response exists before expiry; only delivery is late.
  const obsoleteResponse = Response.json(obsoleteSession);
  const obsoleteReading = h.run<Promise<void>>('session()');
  const beforeExpiry = h.requests.length;
  await h.advance(20 * 60 * 1000 - 1000 + 1);
  assert.equal(h.run('!!self'), false, 'rollback must not postpone the original eight-hour cap');
  assert.equal(h.run('pending'), undefined);
  assert.equal(h.run('!!self?.browser.recoveryKey'), false);
  assert.equal(h.element('workspace').hidden, true);
  for (const id of ['order-result', 'receiving-result', 'recovery-reference'])
    assert.equal(h.element(id).textContent, '');
  assert.equal(h.storage.get(intent.pendingSlot), ciphertext);
  assert.equal(h.requests.length, beforeExpiry, 'no server success is fabricated after expiry');

  h.state.hold = undefined;
  await h.advance(0, false, 60 * 60 * 1000); // Align the new-session clock pair again.
  h.state.actor.browser.csrf = 'new-login-after-absolute';
  h.state.actor.expiresAt = new Date(
    h.run<number>('Date.now()') + 8 * 60 * 60 * 1000,
  ).toISOString();
  await h.login();
  assert.equal(h.run('self.browser.csrf'), 'new-login-after-absolute');
  assert.equal(h.run('pending.body'), body);
  assert.equal(h.storage.get(intent.pendingSlot), ciphertext);
  const newCap = h.run<number>('absoluteUntilMonotonic');
  assert.ok(newCap > 8 * 60 * 60 * 1000, 'genuine new login must discard the obsolete cap');
  releaseObsolete(obsoleteResponse);
  await assert.rejects(obsoleteReading, 'old-session response cannot mutate the new session');
  assert.equal(h.run('absoluteUntilMonotonic'), newCap);
  await h.advance(1000);
  assert.equal(h.run('!!self'), true);
  assert.equal(h.run('checkLocalExpiry()'), false);
});

for (const view of ['LINES', 'RECEIVED_UNITS']) {
  void test(`R-02 ${view} retains each page timestamp with its records, resets refresh and deduplicates shared headers`, async () => {
    const h = await harness();
    h.element('receiving-view').value = view;
    h.run(`currentOrder = ${JSON.stringify(order)}`);
    const row = (id: string) =>
      view === 'LINES'
        ? { lineId: id, position: '1', acceptedUnitCount: '1', remainingUnitCount: '2' }
        : {
            internalSystemCode: id,
            productNumber: 'product',
            arrival: {
              arrivalId: 'one-arrival',
              arrivalDateJalali: '1403-12-30',
              waybillWeightKg: '6000.125',
            },
          };
    const first = '2026-10-26T01:00:00.000Z';
    const second = '2026-10-26T01:01:00.000Z';
    h.pages.push(
      { items: [row('page-one-record')], snapshotAt: first, nextAfterId: 'cursor-one' },
      { items: [row('page-two-record')], snapshotAt: second },
    );
    await h.run<Promise<void>>('loadReceiving(false)');
    assert.ok(h.element('receiving-result').textContent.includes(first));
    await h.run<Promise<void>>('loadReceiving(true)');
    const sections = h.element('receiving-result').children;
    assert.equal(sections.length, 2);
    assert.equal(sections[0]!.tagName, 'section');
    assert.ok(sections[0]!.textContent.includes(first));
    assert.ok(sections[0]!.textContent.includes('page-one-record'));
    assert.ok(!sections[0]!.textContent.includes(second));
    assert.ok(!sections[0]!.textContent.includes('page-two-record'));
    assert.ok(sections[1]!.textContent.includes(second));
    assert.ok(sections[1]!.textContent.includes('page-two-record'));
    assert.ok(!sections[1]!.textContent.includes(first));
    assert.ok(sections[0]!.querySelector('h4')!.textContent.includes('صفحهٔ 1'));
    assert.ok(sections[1]!.querySelector('h4')!.textContent.includes('صفحهٔ 2'));
    assert.ok(!h.element('receiving-status').textContent.includes(first));
    assert.ok(!h.element('receiving-status').textContent.includes(second));
    assert.equal(h.element('more-receiving').hidden, true);
    const queries = h.requests.filter((request) =>
      request.path.endsWith('/receiving/orders/query'),
    );
    assert.deepEqual(
      queries.map((request) => request.body),
      [
        { orderId: order.orderId, view, limit: 20 },
        { orderId: order.orderId, view, limit: 20, afterId: 'cursor-one' },
      ],
    );
    if (view === 'RECEIVED_UNITS')
      assert.equal(
        h
          .element('receiving-result')
          .querySelectorAll('summary')
          .filter((summary) => summary.textContent.includes('اطلاعات مشترک کل محموله')).length,
        1,
      );
    h.pages.push({ items: [] });
    await h.run<Promise<void>>('loadReceiving(false)');
    assert.equal(h.element('receiving-result').children.length, 1);
    assert.ok(!h.element('receiving-result').textContent.includes(first));
    assert.ok(h.element('receiving-result').textContent.includes('از سرور ارائه نشده است'));
    assert.ok(h.element('receiving-result').textContent.includes('صفحهٔ 1'));
    assert.equal(h.element('more-receiving').hidden, true);
    assert.equal(h.element('receiving-status').textContent, 'دریافتی برای این سفارش ثبت نشده است.');
    h.element('receiving-view').value = view === 'LINES' ? 'RECEIVED_UNITS' : 'LINES';
    h.pages.push({ items: [], snapshotAt: second });
    await h.run<Promise<void>>('loadReceiving(false)');
    assert.equal(h.element('receiving-result').children.length, 1);
    const caption = h.element('receiving-result').querySelector('h4')!.textContent;
    assert.ok(caption.includes('صفحهٔ 1'));
    assert.ok(caption.includes(view === 'LINES' ? 'واحدهای دریافت‌شده' : 'خطوط و ماندهٔ سفارش'));
    assert.ok(caption.includes(second));
  });
}
