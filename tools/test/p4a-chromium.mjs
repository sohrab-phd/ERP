import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { resolve } from 'node:path';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { browserTestPassword } from '../../apps/backend/dist/tests/support/browser-harness.js';

// Actual Chromium + the composed native app + the guarded real PostgreSQL fixture.
// No browser automation dependency or production-side test hook is installed.
const root = process.cwd();
const output = resolve('artifacts/tests');
mkdirSync(output, { recursive: true });
const results = [];
const consoleErrors = [];
let fixture, chrome, cdp, ready;
let commandId = 0;
const controls = new Map();
const fixtureLines = [];
const chromeLines = [];

function waitExit(child, timeout = 10000) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve(child.exitCode);
  return new Promise((resolveExit, reject) => {
    const onExit = (code) => {
      clearTimeout(timer);
      resolveExit(code);
    };
    const timer = setTimeout(() => {
      child.off('exit', onExit);
      reject(new Error('Known child did not terminate'));
    }, timeout);
    child.once('exit', onExit);
  });
}
async function port() {
  const server = createServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const value = server.address().port;
  await new Promise((r) => server.close(r));
  return value;
}
async function until(work, message, timeout = 15000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    if (await work()) return;
    await delay(40);
  }
  throw new Error(message);
}
class DevTools {
  constructor(socket) {
    this.socket = socket;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.closed = false;
    socket.addEventListener('message', ({ data }) => {
      const value = JSON.parse(String(data));
      if (value.id) {
        const item = this.pending.get(value.id);
        if (!item) return;
        this.pending.delete(value.id);
        clearTimeout(item.timer);
        if (value.error) item.reject(new Error('DevTools: ' + value.error.message));
        else item.resolve(value.result);
      } else for (const listener of this.listeners.get(value.method) ?? []) listener(value.params);
    });
    socket.addEventListener('close', () => {
      this.closed = true;
      for (const item of this.pending.values()) {
        clearTimeout(item.timer);
        item.reject(new Error('Chromium debugger closed'));
      }
      this.pending.clear();
    });
  }
  static async connect(url) {
    const socket = new globalThis.WebSocket(url);
    await new Promise((r, reject) => {
      socket.addEventListener('open', r, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });
    return new DevTools(socket);
  }
  on(method, fn) {
    const items = this.listeners.get(method) ?? [];
    items.push(fn);
    this.listeners.set(method, items);
  }
  call(method, params = {}) {
    if (this.closed) return Promise.reject(new Error('Chromium debugger is closed'));
    const id = ++this.id;
    return new Promise((resolveCall, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('DevTools deadline: ' + method));
      }, 20000);
      this.pending.set(id, { resolve: resolveCall, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const value = await this.call('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (value.exceptionDetails)
      throw new Error(value.exceptionDetails.exception?.description ?? value.exceptionDetails.text);
    return value.result.value;
  }
}
async function control(command) {
  const id = ++commandId;
  const reply = new Promise((r, reject) => {
    const timer = setTimeout(() => {
      controls.delete(id);
      reject(new Error('Fixture control deadline: ' + command));
    }, 15000);
    controls.set(id, { resolve: r, reject, timer });
  });
  fixture.stdin.write(JSON.stringify({ id, command }) + '\n');
  return reply;
}
const hook = `(() => {
  const originalFetch = window.fetch.bind(window);
  let held;
  window.__p4aChecks = {
    log: [],
    arm(stage, path) {
      if (held) throw new Error('A prior browser gate is still active');
      let release;
      held = { stage, path, reached: false, promise: new Promise(r => release = r), release };
    },
    reached() { return !!held?.reached; },
    release(fail = false) { const h = held; held = undefined; if (!h) throw new Error('No browser gate'); h.release(fail); },
  };
  async function gate(stage, path) {
    if (!held || held.reached || held.stage !== stage || !path.endsWith(held.path)) return;
    held.reached = true;
    if (await held.promise) throw new TypeError('Deliberate committed-response loss');
  }
  window.fetch = async (input, init) => {
    const path = typeof input === 'string' ? input : input.url;
    const response = await originalFetch(input, init);
    const originalJson = response.json.bind(response);
    response.json = async () => {
      const value = await originalJson();
      if (path.includes('/inventory/v1/')) window.__p4aChecks.log.push({ path, status: response.status,
        input: init?.body ? JSON.parse(init.body) : null, value });
      await gate('json', path);
      return value;
    };
    await gate('headers', path);
    return response;
  };
})();`;
const ui = {
  text: () => cdp.evaluate("document.getElementById('inventory-panel').textContent"),
  ids: () =>
    cdp.evaluate(
      "[...document.querySelectorAll('.inventory-table tbody tr button[id^=inventory-unit-]')].map(e=>e.id.slice('inventory-unit-'.length))",
    ),
  last: () => cdp.evaluate('window.__p4aChecks.log.at(-1)'),
};
async function click(selector) {
  const point = await cdp.evaluate(
    `(() => { const e=document.querySelector(${JSON.stringify(selector)}); if(!e||e.disabled)throw new Error('Missing or disabled control'); e.scrollIntoView({block:'center'}); const r=e.getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`,
  );
  await cdp.call('Input.dispatchMouseEvent', {
    type: 'mousePressed',
    button: 'left',
    clickCount: 1,
    ...point,
  });
  await cdp.call('Input.dispatchMouseEvent', {
    type: 'mouseReleased',
    button: 'left',
    clickCount: 1,
    ...point,
  });
}
async function key(name, code, modifiers = 0) {
  await cdp.call('Input.dispatchKeyEvent', {
    type: 'keyDown',
    key: name,
    windowsVirtualKeyCode: code,
    nativeVirtualKeyCode: code,
    modifiers,
  });
  await cdp.call('Input.dispatchKeyEvent', {
    type: 'keyUp',
    key: name,
    windowsVirtualKeyCode: code,
    nativeVirtualKeyCode: code,
    modifiers,
  });
}
async function value(id, text, event = 'input') {
  await cdp.evaluate(
    `(() => { const e=document.getElementById(${JSON.stringify(id)}); e.value=${JSON.stringify(text)}; e.dispatchEvent(new Event(${JSON.stringify(event)},{bubbles:true})); })()`,
  );
}
async function settled() {
  await until(
    () =>
      cdp.evaluate(
        "document.getElementById('inventory-panel').getAttribute('aria-busy')==='false'",
      ),
    'Inventory request did not settle',
  );
}
async function list() {
  await click('#show-inventory');
  await settled();
}
async function filter(filters = {}) {
  await cdp.evaluate(
    `(() => { const f=${JSON.stringify(filters)}; for(const e of document.querySelectorAll('#inventory-filters [name]')){e.value=f[e.name]??'';e.dispatchEvent(new Event('input',{bubbles:true}));} document.getElementById('inventory-filters').requestSubmit(); })()`,
  );
  await settled();
}
async function detail(unitId) {
  await filter({ unitId });
  assert.deepEqual(await ui.ids(), [unitId]);
  await click('#inventory-unit-' + unitId);
  await settled();
}
async function login(username = 'receipt.act-wh') {
  await until(
    () => cdp.evaluate("!document.getElementById('login-panel').hidden"),
    'Login panel missing',
  );
  await value('username', username);
  await value('password', browserTestPassword);
  await click('#login-form button[type=submit]');
  await until(
    () => cdp.evaluate("!document.getElementById('workspace').hidden"),
    'Authenticated workspace missing',
  );
  if (username === 'receipt.act-wh') {
    await value('role', 'ACT-WH', 'change');
    await until(
      () => cdp.evaluate("!document.getElementById('show-inventory').hidden"),
      'Warehouse Inventory navigation not admitted',
    );
  }
}
async function logout() {
  await click('#logout');
  await until(
    () =>
      cdp.evaluate(
        "!document.getElementById('login-panel').hidden&&!document.getElementById('login-fields').disabled",
      ),
    'Logout did not return to enabled login',
  );
}
async function check(name, work) {
  const start = Date.now();
  try {
    await work();
    results.push({ name, status: 'PASS', durationMs: Date.now() - start });
    console.log('PASS ' + name);
  } catch (error) {
    results.push({ name, status: 'FAIL', durationMs: Date.now() - start, error: error.message });
    throw error;
  }
}
async function screenshot(name) {
  const shot = await cdp.call('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: false,
  });
  writeFileSync(resolve(output, name), Buffer.from(shot.data, 'base64'));
}
async function direct(route, body, options = {}) {
  return cdp.evaluate(`(async () => {
    const session=await fetch('/ui-api/identity/session',{headers:{'x-erp-browser':'1'}});const self=await session.json();
    const response=await fetch(${JSON.stringify('/ui-api' + route)},{method:${JSON.stringify(options.method ?? 'POST')},${options.noCookie ? "credentials:'omit'," : ''}headers:{'x-erp-browser':'1','x-erp-role':${JSON.stringify(options.role ?? 'ACT-WH')},${options.noCsrf ? '' : "'x-erp-csrf':self.browser.csrf,"}${options.bearer ? "authorization:'Bearer chromium-admission-probe'," : ''}'content-type':'application/json'},${options.method === 'GET' ? '' : 'body:' + JSON.stringify(JSON.stringify(body))}});
    return {status:response.status,body:await response.json(),cache:response.headers.get('cache-control')};
  })()`);
}

let exitCode = 0;
try {
  assert.equal(process.versions.node, '24.21.0', 'Use the frozen test runtime');
  const readyPromise = new Promise((resolveReady, reject) => {
    fixture = spawn(
      process.execPath,
      ['--env-file=.env.local', 'apps/backend/dist/tests/support/inventory-browser-server.js'],
      {
        cwd: root,
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );
    const timer = setTimeout(
      () => reject(new Error('Real browser fixture startup deadline')),
      90000,
    );
    createInterface({ input: fixture.stdout }).on('line', (line) => {
      try {
        const item = JSON.parse(line);
        if (item.ready) {
          clearTimeout(timer);
          resolveReady(item);
        } else if (item.id) {
          const waiter = controls.get(item.id);
          if (waiter) {
            clearTimeout(waiter.timer);
            controls.delete(item.id);
            if (item.error) waiter.reject(new Error(item.error));
            else waiter.resolve(item.result);
          }
        } else fixtureLines.push(line);
      } catch {
        fixtureLines.push(line);
      }
    });
    fixture.stderr.on('data', (data) => fixtureLines.push(String(data)));
    fixture.once('exit', (code) => {
      clearTimeout(timer);
      if (code) reject(new Error('Fixture exited before ready: ' + code));
    });
  });
  ready = await readyPromise;
  const chromePath = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].find(existsSync);
  assert.ok(chromePath, 'Installed Chromium browser required');
  const debugPort = await port();
  const profile = resolve(output, 'p4a-chromium-profile-' + Date.now());
  chrome = spawn(
    chromePath,
    [
      '--headless=new',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-sync',
      '--disable-extensions',
      '--window-size=1440,1050',
      '--remote-debugging-address=127.0.0.1',
      '--remote-debugging-port=' + debugPort,
      '--user-data-dir=' + profile,
      'about:blank',
    ],
    { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] },
  );
  chrome.stderr.on('data', (data) => chromeLines.push(String(data)));
  let version;
  await until(
    async () => {
      try {
        version = await (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json();
        return !!version.webSocketDebuggerUrl;
      } catch {
        return false;
      }
    },
    'Actual Chromium debugger not available',
    30000,
  );
  const tabs = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
  cdp = await DevTools.connect(tabs.find((tab) => tab.type === 'page').webSocketDebuggerUrl);
  cdp.on('Runtime.exceptionThrown', (event) => consoleErrors.push(event.exceptionDetails.text));
  await cdp.call('Runtime.enable');
  await cdp.call('Page.enable');
  await cdp.call('Network.enable');
  await cdp.call('Page.addScriptToEvaluateOnNewDocument', { source: hook });
  await cdp.call('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1050,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp.call('Page.navigate', { url: ready.origin });
  await check('personal Warehouse login and default discovery require no UUID', async () => {
    await login();
    await list();
    assert.equal((await ui.ids()).length, 25);
    assert.deepEqual((await ui.last()).input.filters, {});
    assert.equal(
      await cdp.evaluate("document.documentElement.lang+':'+document.documentElement.dir"),
      'fa:rtl',
    );
    assert.match(await ui.text(), /هر صفحه مشاهدهٔ مستقل/u);
    assert.match(await ui.text(), /رزرو نشده به معنی مجوز/u);
  });
  await check(
    'forward/back pagination and selectable page sizes retain stable UUID order',
    async () => {
      const first = await ui.ids();
      await click('#inventory-next');
      await settled();
      const next = await ui.ids();
      assert.equal(next.length, 25);
      assert.ok(next.every((id) => !first.includes(id)));
      await click('#inventory-previous');
      await settled();
      assert.deepEqual(await ui.ids(), first);
      await value('inventory-page-size', '50', 'change');
      await settled();
      assert.equal((await ui.ids()).length, 50);
      await value('inventory-page-size', '10', 'change');
      await settled();
      assert.equal((await ui.ids()).length, 10);
    },
  );
  await check('all five current-state and three origin labels use real stock rows', async () => {
    for (const [state, label] of Object.entries({
      AVAILABLE: 'آزاد',
      RESERVED: 'رزروشده',
      PACKED: 'بسته‌بندی‌شده',
      ISSUED_TO_PRODUCTION: 'تحویل تولید',
      PARTIALLY_CONSUMED: 'بخشی مصرف‌شده',
    })) {
      await filter({ state });
      assert.ok((await ui.ids()).length);
      assert.match(await ui.text(), new RegExp(label, 'u'));
      assert.ok((await ui.last()).value.data.items.every((row) => row.state === state));
    }
    for (const origin of ['LEGACY_RECEIPT', 'I2_RECEIVING', 'PRODUCTION']) {
      await filter({ origin });
      assert.ok((await ui.ids()).length);
      assert.ok((await ui.last()).value.data.items.every((row) => row.origin === origin));
    }
  });
  await check('eight exact filters and their AND intersection do not normalize codes', async () => {
    const f = {
      unitId: ready.refs.free.unitId,
      lotId: ready.refs.free.lotId,
      materialId: ready.refs.free.materialId,
      internalCode: ready.refs.free.code,
      kind: 'COIL',
      locationId: ready.refs.free.locationId,
      state: 'AVAILABLE',
      origin: 'LEGACY_RECEIPT',
    };
    for (const [name, value] of Object.entries(f)) {
      await filter({ [name]: value });
      if (['kind', 'state', 'origin'].includes(name)) {
        const items = (await ui.last()).value.data.items;
        assert.ok(items.length > 0, name);
        assert.ok(
          items.every((row) => row[name] === value),
          name,
        );
      } else assert.ok((await ui.ids()).includes(ready.refs.free.unitId), name);
    }
    await filter(f);
    assert.deepEqual(await ui.ids(), [ready.refs.free.unitId]);
    await filter({ internalCode: ready.refs.free.code.trim() });
    assert.equal((await ui.ids()).length, 0);
    assert.match(await ui.text(), /مورد قابل مشاهده‌ای/u);
  });
  await check(
    'refresh and re-entry never label applied rows with an unsubmitted code/kind',
    async () => {
      await filter({ internalCode: ready.refs.free.code });
      await value('inventory-filter-internalCode', 'unsubmitted-code');
      await value('inventory-filter-kind', 'unsubmitted-kind');
      await click('#inventory-refresh');
      await settled();
      assert.equal(
        await cdp.evaluate("document.getElementById('inventory-filter-internalCode').value"),
        ready.refs.free.code,
      );
      assert.equal(
        await cdp.evaluate("document.getElementById('inventory-filter-kind').value"),
        '',
      );
      assert.deepEqual(await ui.ids(), [ready.refs.free.unitId]);
      await value('inventory-filter-internalCode', 'another-draft');
      await click('#show-lookup');
      await list();
      assert.equal(
        await cdp.evaluate("document.getElementById('inventory-filter-internalCode').value"),
        ready.refs.free.code,
      );
      assert.deepEqual(await ui.ids(), [ready.refs.free.unitId]);
    },
  );
  await check(
    'Unit source weight, exact large/fractional Persian kg and multi-Unit Lot are usable',
    async () => {
      await detail(ready.refs.big.unitId);
      assert.match(await ui.text(), /۹٬۰۰۷٬۱۹۹٬۲۵۴٬۷۴۰٬۹۹۳/u);
      assert.match(await ui.text(), /وزن اولیه منبع/u);
      assert.match(await ui.text(), /تعداد اولیه/u);
      await list();
      await detail(ready.refs.fraction.unitId);
      assert.match(await ui.text(), /۷۰٫۵/u);
      assert.match(await ui.text(), /وزن خروجی ثبت‌شدهٔ تولید/u);
      await list();
      await detail(ready.refs.wip.unitId);
      assert.match(await ui.text(), /کار در جریان اولیه/u);
      await click('#inventory-open-lot');
      await settled();
      assert.equal((await ui.ids()).length, 2);
      assert.match(await ui.text(), /این نما مجموع وزن لات نیست/u);
      await click('#inventory-back');
      await settled();
      assert.match(await ui.text(), /جزئیات واحد/u);
      await click('#inventory-back');
      await settled();
      assert.equal(
        await cdp.evaluate('document.activeElement.id'),
        'inventory-unit-' + ready.refs.wip.unitId,
      );
    },
  );
  await check(
    'recorded text is rendered as text, identifiers isolated, no Inventory storage or URL state',
    async () => {
      await filter({ unitId: ready.refs.xss.unitId });
      assert.match(await ui.text(), /<img src=x onerror=window.p4aXss=true>/u);
      assert.equal(
        await cdp.evaluate(
          "!!document.querySelector('#inventory-panel img')||window.p4aXss===true",
        ),
        false,
      );
      const state = await cdp.evaluate(
        `({local:[...Object.keys(localStorage)],session:[...Object.keys(sessionStorage)],url:location.href,bdi:[...document.querySelectorAll('#inventory-panel bdi')].map(e=>e.dir)})`,
      );
      assert.deepEqual(state.local, []);
      assert.deepEqual(state.session, []);
      assert.equal(state.url, ready.origin + '/');
      assert.ok(state.bdi.every((direction) => direction === 'ltr' || direction === 'auto'));
    },
  );
  await check(
    'keyboard submit, field errors, semantic tables and visible focus work in Chromium',
    async () => {
      await filter();
      await cdp.evaluate("document.getElementById('inventory-filter-internalCode').focus()");
      await key('Tab', 9);
      assert.equal(await cdp.evaluate('document.activeElement.id'), 'inventory-filter-kind');
      await value('inventory-filter-unitId', 'bad-uuid');
      await click('#inventory-search');
      assert.equal(await cdp.evaluate('document.activeElement.id'), 'inventory-filter-unitId');
      assert.equal(
        await cdp.evaluate("document.activeElement.getAttribute('aria-invalid')"),
        'true',
      );
      await filter({ internalCode: ready.refs.free.code });
      await cdp.evaluate("document.getElementById('inventory-filter-internalCode').focus()");
      await key('Enter', 13);
      await settled();
      assert.deepEqual(await ui.ids(), [ready.refs.free.unitId]);
      const ax = await cdp.call('Accessibility.getFullAXTree');
      assert.ok(ax.nodes.some((n) => n.role?.value === 'table'));
      await cdp.evaluate("document.getElementById('inventory-refresh').focus()");
      const focus = await cdp.evaluate(
        '({style:getComputedStyle(document.activeElement).outlineStyle,width:parseFloat(getComputedStyle(document.activeElement).outlineWidth),visible:document.activeElement.getBoundingClientRect().top>=0})',
      );
      assert.notEqual(focus.style, 'none');
      assert.ok(focus.width >= 2);
      assert.equal(focus.visible, true);
    },
  );
  await check(
    'read loading and transport failure recover without uncertain-write wording',
    async () => {
      await cdp.evaluate("window.__p4aChecks.arm('headers','/inventory/v1/units/query')");
      await click('#inventory-refresh');
      await until(
        () => cdp.evaluate('window.__p4aChecks.reached()'),
        'Read headers gate not reached',
      );
      assert.equal(
        await cdp.evaluate("document.getElementById('inventory-panel').getAttribute('aria-busy')"),
        'true',
      );
      assert.equal(
        await cdp.evaluate("document.getElementById('inventory-refresh').disabled"),
        true,
      );
      await cdp.evaluate('window.__p4aChecks.release(true)');
      await settled();
      assert.match(await ui.text(), /اطلاعات تازه دریافت نشد/u);
      assert.doesNotMatch(await ui.text(), /ممکن است هنوز نامعلوم/u);
      await click('#inventory-retry');
      await settled();
      assert.ok((await ui.ids()).length);
    },
  );
  await check('old headers and parsed JSON cannot overwrite a new filter or page', async () => {
    for (const stage of ['headers', 'json']) {
      await filter();
      await cdp.evaluate(
        `window.__p4aChecks.arm(${JSON.stringify(stage)},'/inventory/v1/units/query')`,
      );
      await click('#inventory-refresh');
      await until(() => cdp.evaluate('window.__p4aChecks.reached()'), 'Old read gate missing');
      await value('inventory-filter-internalCode', ready.refs.free.code);
      await click('#inventory-search');
      await settled();
      assert.deepEqual(await ui.ids(), [ready.refs.free.unitId]);
      await cdp.evaluate('window.__p4aChecks.release()');
      await delay(150);
      assert.deepEqual(await ui.ids(), [ready.refs.free.unitId]);
      assert.equal(await cdp.evaluate('document.activeElement.id'), 'inventory-title');
    }
  });
  await check('a superseded Inventory denial cannot lock a newer authorized view', async () => {
    await filter();
    await control('revoke');
    try {
      await cdp.evaluate("window.__p4aChecks.arm('json','/inventory/v1/units/query')");
      await click('#inventory-refresh');
      await until(() => cdp.evaluate('window.__p4aChecks.reached()'), 'Old denial gate missing');
      assert.equal((await ui.last()).status, 403);
    } finally {
      await control('restore');
    }
    await filter({ unitId: ready.refs.free.unitId });
    assert.equal((await ui.last()).status, 200);
    assert.deepEqual(await ui.ids(), [ready.refs.free.unitId]);
    await cdp.evaluate('window.__p4aChecks.release(); new Promise(r => setTimeout(r, 0))');
    assert.equal(await cdp.evaluate("document.getElementById('workspace').hidden"), false);
    assert.deepEqual(await ui.ids(), [ready.refs.free.unitId]);
    assert.equal(await cdp.evaluate('document.activeElement.id'), 'inventory-title');
  });
  await check('reopening the same Lot from a member retains its original Back path', async () => {
    const original = ready.refs.wip.unitId;
    await detail(original);
    await click('#inventory-open-lot');
    await settled();
    const member = (await ui.ids()).find((id) => id !== original);
    assert.ok(member);
    await click('#inventory-unit-' + member);
    await settled();
    assert.equal((await ui.last()).value.data.unit.unitId, member);
    await click('#inventory-open-lot');
    await settled();
    assert.equal(await cdp.evaluate('document.activeElement.id'), 'inventory-unit-' + member);
    await click('#inventory-back');
    await settled();
    assert.equal((await ui.last()).value.data.unit.unitId, original);
    await click('#inventory-back');
    await settled();
    assert.deepEqual(await ui.ids(), [original]);
    assert.equal(await cdp.evaluate('document.activeElement.id'), 'inventory-unit-' + original);
  });
  await check(
    'desktop contrast, responsive RTL, reduced motion and zoom remain usable',
    async () => {
      await filter();
      await screenshot('p4a-inventory-desktop.png');
      const pairs = await cdp.evaluate(`(() => {
      const contrast=(a,b)=>{const lum=s=>{const c=s.match(/[0-9.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2]};const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
      return [...document.querySelectorAll('#inventory-panel h2,#inventory-panel th,#inventory-panel label,#inventory-panel button:not(:disabled)')].map(e=>{const s=getComputedStyle(e);let p=e,b=s.backgroundColor;while(b==='rgba(0, 0, 0, 0)'&&p.parentElement){p=p.parentElement;b=getComputedStyle(p).backgroundColor;}return {element:e.tagName,ratio:contrast(s.color,b)}});
    })()`);
      assert.ok(
        pairs.every((pair) => pair.ratio >= 4.5),
        JSON.stringify(pairs),
      );
      await cdp.call('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
      });
      await cdp.call('Emulation.setDeviceMetricsOverride', {
        width: 375,
        height: 950,
        deviceScaleFactor: 1,
        mobile: true,
      });
      await cdp.evaluate('window.scrollTo(0,0)');
      await screenshot('p4a-inventory-mobile.png');
      assert.equal(
        await cdp.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),
        true,
      );
      await cdp.call('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 1050,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await cdp.evaluate("document.documentElement.style.fontSize='200%'");
      assert.equal(
        await cdp.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'),
        true,
      );
      await cdp.evaluate("document.documentElement.style.fontSize=''");
      writeFileSync(resolve(output, 'p4a-contrast.json'), JSON.stringify(pairs, null, 2));
    },
  );
  await check(
    'read-only browser journeys have no Inventory, source, outcome or audit effects',
    async () => {
      assert.equal(await control('snapshot'), ready.initialSnapshot);
    },
  );
  await check('a real expired cursor offers explicit restart at page one', async () => {
    await filter();
    await control('cursor-expire');
    await click('#inventory-next');
    await settled();
    assert.match(await ui.text(), /اعتبار صفحه پایان یافته/u);
    await click('#inventory-retry');
    await settled();
    assert.match(await ui.text(), /صفحهٔ ۱/u);
  });
  await check(
    'current-to-historical refresh and multi-Unit Lot preserve zero stock and provenance',
    async () => {
      await detail(ready.refs.wip.unitId);
      await control('consume-wip');
      await click('#inventory-refresh');
      await settled();
      assert.match(await ui.text(), /مصرف‌شده/u);
      assert.match(await ui.text(), /سابقه؛ بدون موجودی جاری/u);
      assert.deepEqual((await ui.last()).value.data.unit.quantities, {
        onHandKg: '0',
        reservedKg: '0',
        unreservedKg: '0',
      });
      assert.match(await ui.text(), /کار در جریان اولیه/u);
      await click('#inventory-open-lot');
      await settled();
      assert.equal((await ui.ids()).length, 2);
      assert.ok((await ui.last()).value.data.items.some((row) => row.stockClass === 'HISTORICAL'));
      await list();
      await detail(ready.refs.free.unitId);
      await control('ship-free');
      await click('#inventory-refresh');
      await settled();
      assert.match(await ui.text(), /ارسال‌شده/u);
      assert.deepEqual((await ui.last()).value.data.unit.quantities, {
        onHandKg: '0',
        reservedKg: '0',
        unreservedKg: '0',
      });
      await click('#inventory-open-lot');
      await settled();
      assert.equal((await ui.ids()).length, 1);
    },
  );
  await check(
    'native browser method, CSRF, cookie and denied-role admission keep sanitized errors',
    async () => {
      assert.deepEqual(await direct('/inventory/v1/units/query', {}, { method: 'GET' }), {
        status: 405,
        body: { error: 'method-not-allowed' },
        cache: 'no-store',
      });
      assert.equal((await direct('/inventory/v1/units/query', {}, { noCsrf: true })).status, 403);
      assert.equal((await direct('/inventory/v1/units/query', {}, { bearer: true })).status, 403);
      assert.equal((await direct('/inventory/v1/units/query', {}, { noCookie: true })).status, 401);
      for (const role of ['ACT-PROC', 'ACT-SEC', 'ACT-SALES', 'ACT-CUST', 'ACT-PLAN', 'ACT-OP'])
        assert.equal((await direct('/inventory/v1/units/query', {}, { role })).status, 403);
      const absent = await direct('/inventory/v1/units/detail', {
        unitId: '11111111-1111-4111-8111-111111111111',
      });
      assert.deepEqual(absent.body, { error: 'not-found' });
      assert.equal(absent.status, 404);
    },
  );
  await check(
    'actual Chromium foreign Origin and Host admission are denied without source disclosure',
    async () => {
      await cdp.call('Page.navigate', { url: ready.foreignOrigin });
      await until(
        () => cdp.evaluate("document.title==='Foreign origin fixture'"),
        'Foreign loopback origin missing',
      );
      const denied = await cdp.evaluate(`(async () => {
          try {
            await fetch(${JSON.stringify(ready.origin + '/ui-api/inventory/v1/units/query')}, {method:'POST', credentials:'include',
              headers:{'x-erp-browser':'1','x-erp-role':'ACT-WH','content-type':'application/json'},body:'{}'});
            return false;
          } catch { return true; }
        })()`);
      assert.equal(denied, true);
      assert.deepEqual(await control('foreign-responses'), [{ method: 'OPTIONS', status: 403 }]);
      const foreignHost = ready.origin.replace('127.0.0.1', 'localhost');
      const documentStatuses = [];
      cdp.on('Network.responseReceived', (event) => {
        if (event.type === 'Document' && event.response.url.startsWith(foreignHost))
          documentStatuses.push(event.response.status);
      });
      await cdp.call('Page.navigate', { url: foreignHost });
      await until(
        () => cdp.evaluate("document.body.innerText.includes('forbidden')"),
        'Foreign Host rejection missing',
      );
      assert.ok(documentStatuses.includes(403));
      await cdp.call('Page.navigate', { url: ready.origin });
      await until(
        () => cdp.evaluate("!document.getElementById('workspace').hidden"),
        'Same-origin session did not bootstrap after negative Host',
      );
      await value('role', 'ACT-WH', 'change');
      await list();
    },
  );
  await check(
    'P1 command recovery survives Inventory navigation and resolves the same pending intent',
    async () => {
      // The preceding test deliberately shipped the previously selected Unit.
      // Begin this independent recovery scenario with the unfiltered current view.
      await list();
      await filter();
      await click('#show-catalogues');
      await value('catalogue-kind', 'COLOR', 'change');
      await value('catalogue-label', 'P4A-BROWSER-RECOVERY');
      await cdp.evaluate("window.__p4aChecks.arm('headers','/purchasing/inbound-catalogues')");
      await click('#catalogue-form button[type=submit]');
      await until(
        () => cdp.evaluate('window.__p4aChecks.reached()'),
        'P1 command response gate missing',
      );
      const before = await cdp.evaluate("sessionStorage.getItem('navard-p1-pending-v1')");
      assert.ok(before);
      await list();
      assert.equal(await cdp.evaluate("sessionStorage.getItem('navard-p1-pending-v1')"), before);
      assert.equal(await cdp.evaluate("document.getElementById('recovery').hidden"), false);
      await cdp.evaluate('window.__p4aChecks.release(true)');
      await until(
        () => cdp.evaluate("!document.getElementById('recover').disabled"),
        'P1 recovery did not remain available',
      );
      await click('#recover');
      await until(
        () => cdp.evaluate("sessionStorage.getItem('navard-p1-pending-v1')===null"),
        'P1 same-key recovery did not resolve',
      );
      await click('#show-receive');
      assert.equal(await cdp.evaluate("document.getElementById('receiving-panel').hidden"), false);
      await list();
      assert.ok((await ui.ids()).length);
    },
  );
  await check(
    'P2 canonical readback recovery survives Inventory navigation without duplicate stock',
    async () => {
      await click('#show-receive');
      const code = 'P4A-I2-BROWSER-RECOVERY';
      const field = (prefix) =>
        cdp.evaluate(
          `document.querySelector('#receiving-panel [id^='+${JSON.stringify(JSON.stringify(prefix))}+']').id`,
        );
      await value('receive-arrivalDateJalali', '1405-08-14');
      await value('receive-originNetKg', '13');
      await value(await field('waybill-'), 'P4A-BROWSER-WAYBILL');
      await value(await field('receipt-'), 'P4A-BROWSER-RECEIPT');
      await value(await field('system-'), code);
      await value(await field('product-'), 'P4A-BROWSER-PRODUCT');
      await value(await field('association-'), 'UNLINKED', 'change');
      const material = await field('materialTypeOptionId-');
      const coil = await cdp.evaluate(
        `Array.from(document.getElementById(${JSON.stringify(material)}).options).find(option=>option.textContent==='COIL').value`,
      );
      await value(material, coil, 'change');
      await value(await field('widthM-'), '1.25');
      await value(await field('thicknessMm-'), '1');
      await value(await field('unitWeightKg-'), '13');
      await click('#' + (await field('accept-confirmed-')));
      await click('#' + (await field('accept-unordered-')));
      await click('#receiving-panel form:last-of-type button[type=submit]');
      await until(
        () => cdp.evaluate("!!document.getElementById('confirm-receiving')"),
        'P2 review was not reachable',
      );
      await cdp.evaluate("window.__p4aChecks.arm('json','/purchasing/receiving/arrivals/query')");
      await click('#confirm-receiving');
      await until(
        () => cdp.evaluate('window.__p4aChecks.reached()'),
        'P2 canonical readback gate missing',
      );
      const intent = await cdp.evaluate("sessionStorage.getItem('navard-p1-pending-v1')");
      assert.ok(intent);
      await list();
      await filter({ internalCode: code });
      const before = (await ui.last()).value.data.items;
      assert.equal(before.length, 1);
      assert.equal(before[0].quantities.onHandKg, '13');
      await cdp.evaluate('window.__p4aChecks.release()');
      await until(
        () => cdp.evaluate("!document.getElementById('recover').disabled"),
        'P2 recovery was not available after navigation',
      );
      assert.ok(
        (await cdp.evaluate("sessionStorage.getItem('navard-p1-pending-v1')")) === intent,
        'P2 intent ownership changed',
      );
      assert.equal(await cdp.evaluate("document.getElementById('inventory-panel').hidden"), false);
      await click('#recover');
      await until(
        () => cdp.evaluate("sessionStorage.getItem('navard-p1-pending-v1')===null"),
        'P2 same-key canonical recovery did not resolve',
      );
      await list();
      await filter({ internalCode: code });
      const after = (await ui.last()).value.data.items;
      assert.deepEqual(after, before);
    },
  );
  await check(
    'role replacement clears private rows and suppresses a parsed old response',
    async () => {
      await filter({ origin: 'PRODUCTION' });
      await cdp.evaluate("window.__p4aChecks.arm('json','/inventory/v1/units/query')");
      await click('#inventory-refresh');
      await until(() => cdp.evaluate('window.__p4aChecks.reached()'), 'Role race gate missing');
      await value('role', 'ACT-PROC', 'change');
      assert.equal(await ui.text(), '');
      await cdp.evaluate('window.__p4aChecks.release()');
      await delay(150);
      assert.equal(await ui.text(), '');
      assert.equal(await cdp.evaluate("document.getElementById('show-inventory').hidden"), true);
      await value('role', 'ACT-WH', 'change');
      await list();
      assert.deepEqual((await ui.last()).input.filters, {});
    },
  );
  await check(
    'logout and a different personal actor cannot resurrect the prior actor response',
    async () => {
      await cdp.evaluate("window.__p4aChecks.arm('json','/inventory/v1/units/query')");
      await click('#inventory-refresh');
      await until(() => cdp.evaluate('window.__p4aChecks.reached()'), 'Actor race gate missing');
      await logout();
      assert.equal(await ui.text(), '');
      await login('receipt.act-proc');
      await cdp.evaluate('window.__p4aChecks.release()');
      await delay(150);
      assert.equal(await ui.text(), '');
      assert.equal(await cdp.evaluate("document.getElementById('show-inventory').hidden"), true);
      await logout();
      await login();
      await list();
      assert.deepEqual((await ui.last()).input.filters, {});
    },
  );
  await check(
    'same-account session replacement discards a delayed Inventory response',
    async () => {
      await filter({ origin: 'PRODUCTION' });
      await cdp.evaluate("window.__p4aChecks.arm('json','/inventory/v1/units/query')");
      await click('#inventory-refresh');
      await until(() => cdp.evaluate('window.__p4aChecks.reached()'), 'Session race gate missing');
      const replacement = await cdp.evaluate(`(async () => {
      const headers = {'x-erp-browser':'1'};
      const current = async () => (await fetch('/ui-api/identity/session', {headers})).json();
      const before = await current();
      const login = await fetch('/ui-api/identity/login', {method:'POST',
        headers:{...headers,'content-type':'application/json'},
        body:JSON.stringify({username:'receipt.act-wh',password:${JSON.stringify(browserTestPassword)}})});
      const after = await current();
      return {status:login.status,sameActor:before.accountId===after.accountId&&before.personId===after.personId,
        rotated:before.browser.csrf!==after.browser.csrf};
    })()`);
      assert.deepEqual(replacement, { status: 200, sameActor: true, rotated: true });
      await cdp.evaluate("window.dispatchEvent(new Event('focus'))");
      await until(
        () =>
          cdp.evaluate(
            "!document.getElementById('workspace').hidden&&!document.getElementById('show-inventory').hidden&&!document.getElementById('inventory-panel').textContent",
          ),
        'Same-account rotation did not clear the previous Inventory view',
      );
      await list();
      assert.deepEqual((await ui.last()).input.filters, {});
      const current = await ui.ids();
      assert.ok(current.length);
      await cdp.evaluate('window.__p4aChecks.release(); new Promise(r => setTimeout(r, 0))');
      assert.deepEqual(await ui.ids(), current);
      assert.equal(await cdp.evaluate('document.activeElement.id'), 'inventory-title');
    },
  );
  await check(
    'real grant revocation and session expiry clear rows and require fresh admission',
    async () => {
      await control('revoke');
      await click('#inventory-refresh');
      await until(
        () => cdp.evaluate("!document.getElementById('login-panel').hidden"),
        'Revocation did not lock the app',
      );
      assert.equal(await ui.text(), '');
      await control('restore');
      await login();
      await list();
      await control('expire');
      await click('#inventory-refresh');
      await until(
        () => cdp.evaluate("!document.getElementById('login-panel').hidden"),
        'Session expiry did not lock the app',
      );
      assert.equal(await ui.text(), '');
      await login();
      await list();
    },
  );
  await check(
    'reload obtains fresh authorized data and retains no private filter/cursor state',
    async () => {
      await filter({ origin: 'PRODUCTION' });
      await cdp.call('Page.reload');
      await until(
        () => cdp.evaluate("!document.getElementById('workspace').hidden"),
        'Reload did not bootstrap the real session',
      );
      await value('role', 'ACT-WH', 'change');
      await list();
      assert.deepEqual((await ui.last()).input.filters, {});
      assert.equal(await cdp.evaluate('location.search+location.hash'), '');
      assert.deepEqual(await cdp.evaluate('Object.keys(localStorage)'), []);
      assert.deepEqual(await cdp.evaluate('Object.keys(sessionStorage)'), []);
      await screenshot('p4a-inventory-final.png');
    },
  );
  writeFileSync(
    resolve(output, 'p4a-chromium-version.json'),
    JSON.stringify(
      {
        browser: version.Browser,
        protocol: version['Protocol-Version'],
        platform: process.platform,
        node: process.versions.node,
      },
      null,
      2,
    ),
  );
} catch (error) {
  exitCode = 1;
  console.error('Chromium verification failed: ' + error.message);
  if (cdp) {
    try {
      await screenshot('p4a-chromium-failure.png');
      writeFileSync(
        resolve(output, 'p4a-chromium-failure-dom.txt'),
        await cdp.evaluate('document.body.innerText'),
      );
    } catch {
      /* preserve primary failure */
    }
  }
} finally {
  if (cdp) {
    try {
      await cdp.call('Browser.close');
    } catch {
      /* closing debugger can race reply */
    }
  }
  if (chrome) {
    try {
      await waitExit(chrome, 10000);
    } catch {
      chrome.kill();
    }
  }
  if (fixture) {
    try {
      if (fixture.exitCode === null && fixture.signalCode === null) {
        await control('stop');
        fixture.stdin.end();
      }
      assert.equal(await waitExit(fixture, 15000), 0, 'Fixture did not exit cleanly');
    } catch (error) {
      console.error('Fixture shutdown failed: ' + error.message);
      fixture.kill();
      exitCode = 1;
    }
  }
  writeFileSync(resolve(output, 'p4a-chromium-fixture.log'), fixtureLines.join('\n'));
  writeFileSync(resolve(output, 'p4a-chromium-browser.log'), chromeLines.join('\n'));
  const summary = {
    actualChromium: true,
    composedBackend: true,
    realPostgreSQL: true,
    passed: results.filter((r) => r.status === 'PASS').length,
    failed: results.filter((r) => r.status === 'FAIL').length,
    skipped: 0,
    complete: exitCode === 0,
    checks: results,
    consoleErrors,
  };
  writeFileSync(resolve(output, 'p4a-chromium-results.json'), JSON.stringify(summary, null, 2));
  console.log(
    JSON.stringify({
      passed: summary.passed,
      failed: summary.failed,
      skipped: 0,
      complete: summary.complete,
    }),
  );
  process.exitCode = exitCode;
}
