import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { resolve } from 'node:path';
import { createServer } from 'node:net';
import { performance } from 'node:perf_hooks';
import { setTimeout as delay } from 'node:timers/promises';
const salesPassword = 'synthetic sales individual password';

// Actual Chromium + the composed native app + the guarded real PostgreSQL fixture.
// No browser automation dependency or production-side test hook is installed.
const root = process.cwd();
const output = resolve('artifacts/tests/p4b-implementation');
mkdirSync(output, { recursive: true });
const results = [];
const consoleErrors = [];
let uiPerformance;
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
  const originalFetch=window.fetch.bind(window);let held;
  window.__p4bChecks={log:[],arm(stage,path){if(held)throw Error('Prior gate active');let release;const promise=new Promise(r=>release=r);held={stage,path,reached:false,promise,release};},
  reached(){return !!held?.reached;},release(fail=false){const h=held;held=undefined;if(!h)throw Error('No gate');h.release(fail);}};
  async function gate(stage,path){if(!held||held.reached||held.stage!==stage||!path.endsWith(held.path))return;held.reached=true;if(await held.promise)throw TypeError('Deliberate loss after real response');}
  window.fetch=async(input,init)=>{const path=typeof input==='string'?input:input.url;const response=await originalFetch(input,init);const json=response.json.bind(response);
  response.json=async()=>{const value=await json();if(path.includes('/sales/v1/')||path.includes('/purchasing/inbound-catalogues'))window.__p4bChecks.log.push({path,status:response.status,input:init?.body?JSON.parse(init.body):null,value});await gate('json',path);return value;};await gate('headers',path);return response;};
})();`;
async function clickElement(expression) {
  const point = await cdp.evaluate(
    `(() => {const e=${expression};if(!e||e.disabled||e.getClientRects().length===0)throw Error('Missing/disabled visible control');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`,
  );
  for (const type of ['mousePressed', 'mouseReleased'])
    await cdp.call('Input.dispatchMouseEvent', { type, button: 'left', clickCount: 1, ...point });
}
const click = (selector) => clickElement(`document.querySelector(${JSON.stringify(selector)})`);
const clickText = (text, scope = '#sales-panel') =>
  clickElement(
    `[...document.querySelectorAll(${JSON.stringify(scope + ' button')})].find(e=>e.textContent.trim()===${JSON.stringify(text)})`,
  );
async function value(selector, text, event = 'input') {
  await cdp.evaluate(
    `(() => {const e=document.querySelector(${JSON.stringify(selector)});if(!e||e.disabled)throw Error('Missing/disabled field');e.value=${JSON.stringify(text)};e.dispatchEvent(new Event(${JSON.stringify(event)},{bubbles:true}));})()`,
  );
}
const text = () => cdp.evaluate("document.querySelector('#sales-panel').textContent");
const last = (path) =>
  cdp.evaluate(`window.__p4bChecks.log.filter(x=>x.path.endsWith(${JSON.stringify(path)})).at(-1)`);
const logs = () => cdp.evaluate('window.__p4bChecks.log');
const readCount = (suffix) =>
  cdp.evaluate(
    `window.__p4bChecks.log.filter(row=>row.path.endsWith(${JSON.stringify(suffix)})).length`,
  );
const visible = (selector) =>
  cdp.evaluate(`!!document.querySelector(${JSON.stringify(selector)})?.getClientRects().length`);
async function waitFor(selector) {
  await until(() => visible(selector), 'Expected visible control: ' + selector, 20000);
}
async function settled() {
  await until(
    () =>
      cdp.evaluate(
        "!document.getElementById('sales-panel').hidden&&!!document.getElementById('sales-status')&&!document.getElementById('sales-status').textContent.includes('در حال')",
      ),
    'Sales view did not settle',
    20000,
  );
}
async function role(which) {
  await value('#role', which, 'change');
  await until(
    () => cdp.evaluate(`document.getElementById('role').value===${JSON.stringify(which)}`),
    'Role selection failed',
  );
  if (which === 'ACT-SALES') {
    await waitFor('.sales-customers');
    await settled();
  }
}
async function choose(id) {
  if (await visible('#sales-change-customer')) {
    await click('#sales-change-customer');
    await waitFor('.sales-customers');
  }
  for (let page = 0; page < 6; page++) {
    const found = await cdp.evaluate(
      `[...document.querySelectorAll('.sales-customers li')].some(e=>e.textContent.includes(${JSON.stringify(id)}))`,
    );
    if (found) {
      await clickElement(
        `[...document.querySelectorAll('.sales-customers li')].find(e=>e.textContent.includes(${JSON.stringify(id)})).querySelector('button')`,
      );
      await waitFor('#sales-order-id');
      await settled();
      return;
    }
    if (!(await visible('#sales-next-page'))) break;
    await click('#sales-next-page');
    await settled();
  }
  throw Error('Authorized customer not found across pages');
}
async function order(id) {
  if (!(await visible('#sales-order-id'))) {
    if (await visible('#sales-back')) await click('#sales-back');
    else await click('#show-sales');
    await waitFor('#sales-order-id');
  }
  await value('#sales-order-id', id);
  await clickText('جست‌وجو');
  await until(async () => {
    const r = await last('/orders/query');
    return r?.input.filters?.orderId === id && r.status === 200;
  }, 'Exact order lookup did not finish');
  await until(
    () =>
      cdp.evaluate(
        `!![...document.querySelectorAll('.sales-table tbody tr')].find(e=>e.textContent.includes(${JSON.stringify(id)}))`,
      ),
    'Order row missing',
  );
  await clickElement(
    `[...document.querySelectorAll('.sales-table tbody tr')].find(e=>e.textContent.includes(${JSON.stringify(id)})).querySelector('button')`,
  );
  await waitFor('#sales-new-assessment');
  await settled();
}
async function confirm() {
  await waitFor('#sales-confirm-action');
  await click('#sales-confirm-action');
}
async function newAssessment() {
  await click('#sales-new-assessment');
  await confirm();
  await waitFor('#sales-record-make');
  await settled();
  return (await last('/assessments/detail')).value.data.id;
}
async function login() {
  await waitFor('#login-panel');
  await value('#username', 'sales.first');
  await value('#password', salesPassword);
  await click('#login-form button[type=submit]');
  await until(
    () => cdp.evaluate("!document.getElementById('workspace').hidden"),
    'Personal login failed',
  );
  await role('ACT-SALES');
}
async function logout() {
  await click('#logout');
  await until(
    () =>
      cdp.evaluate(
        "!document.getElementById('login-panel').hidden&&!document.getElementById('login-fields').disabled",
      ),
    'Logout did not settle',
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
async function direct(path, input, customer, extra = {}) {
  return cdp.evaluate(
    `(async()=>{const r=await fetch('/ui-api/identity/session',{headers:{'x-erp-browser':'1'}});const self=await r.json();const response=await fetch(${JSON.stringify('/ui-api/sales/v1/' + path)},{method:'POST',headers:{'x-erp-browser':'1','x-erp-csrf':self.browser.csrf,'content-type':'application/json',${customer ? "'x-customer-id':" + JSON.stringify(customer) + ',' : ''}...${JSON.stringify(extra)}},body:${JSON.stringify(JSON.stringify(input))}});return{status:response.status,body:await response.json()};})()`,
  );
}
async function draft(type, kg, description = 'تقاضای کاربر آزمون') {
  await click('#sales-new-order');
  await waitFor('#sales-lines');
  await value('#sales-lines select[id$="-type"]', type);
  await value('#sales-lines input[id$="-description"]', description);
  await value('#sales-lines input[id$="-kg"]', kg);
  await value('#sales-lines select[id$="-partial"]', 'true');
  await clickText('بازبینی پیش از ثبت');
  await confirm();
  await waitFor('#sales-submit-order');
  await settled();
  return (await last('/orders/detail')).value.data.id;
}
async function submit() {
  await click('#sales-submit-order');
  await confirm();
  await until(async () => {
    const r = await last('/orders/detail');
    return r?.value.data.state === 'SUBMITTED';
  }, 'Submit readback missing');
  await waitFor('#sales-new-assessment');
}
async function selectAssessment() {
  await click('#sales-select-assessment');
  await waitFor('#sales-confirm-order');
  await click('#sales-confirm-order');
  await confirm();
  await until(async () => {
    const r = await last('/orders/detail');
    return r?.value.data.state === 'CONFIRMED';
  }, 'Confirmation readback missing');
  await settled();
}
async function key(name, code, modifiers = 0) {
  for (const type of ['keyDown', 'keyUp'])
    await cdp.call('Input.dispatchKeyEvent', {
      type,
      key: name,
      windowsVirtualKeyCode: code,
      nativeVirtualKeyCode: code,
      modifiers,
    });
}

let exitCode = 0,
  version,
  dataset;
try {
  assert.equal(process.platform, 'win32');
  assert.equal(process.versions.node, '24.21.0');
  ready = await new Promise((resolveReady, reject) => {
    fixture = spawn(
      process.execPath,
      ['--env-file=.env.local', 'apps/backend/dist/tests/support/p4b-browser-fixture.js'],
      { cwd: root, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] },
    );
    const timer = setTimeout(() => reject(Error('Fixture startup deadline')), 120000);
    createInterface({ input: fixture.stdout }).on('line', (line) => {
      try {
        const item = JSON.parse(line);
        if (item.ready) {
          clearTimeout(timer);
          resolveReady(item);
        } else if (item.id) {
          const w = controls.get(item.id);
          if (w) {
            clearTimeout(w.timer);
            controls.delete(item.id);
            item.error ? w.reject(Error(item.error)) : w.resolve(item.result);
          }
        } else fixtureLines.push(line);
      } catch {
        fixtureLines.push(line);
      }
    });
    fixture.stderr.on('data', (data) => fixtureLines.push(String(data)));
    fixture.once('exit', (code) => {
      clearTimeout(timer);
      if (code) reject(Error('Fixture exited ' + code));
    });
  });
  dataset = await control('stats');
  const chromePath = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  ].find(existsSync);
  assert.ok(chromePath);
  const debugPort = await port();
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
      '--user-data-dir=' + resolve(output, 'p4b-chromium-profile-' + Date.now()),
      'about:blank',
    ],
    { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] },
  );
  chrome.stderr.on('data', (data) => chromeLines.push(String(data)));
  await until(
    async () => {
      try {
        version = await (await fetch(`http://127.0.0.1:${debugPort}/json/version`)).json();
        return !!version.webSocketDebuggerUrl;
      } catch {
        return false;
      }
    },
    'Chromium debugger unavailable',
    30000,
  );
  const tabs = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
  cdp = await DevTools.connect(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  cdp.on('Runtime.exceptionThrown', (e) => consoleErrors.push(e.exceptionDetails.text));
  cdp.on('Page.javascriptDialogOpening', () => {
    void cdp.call('Page.handleJavaScriptDialog', { accept: true });
  });
  for (const method of ['Runtime.enable', 'Page.enable', 'Network.enable']) await cdp.call(method);
  await cdp.call('Page.addScriptToEvaluateOnNewDocument', { source: hook });
  await cdp.call('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1050,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await cdp.call('Page.navigate', { url: ready.origin });

  await check(
    'personal multi-role Sales login, bounded roster and no-UUID customer discovery',
    async () => {
      await login();
      assert.equal(
        await cdp.evaluate('document.documentElement.lang+":"+document.documentElement.dir'),
        'fa:rtl',
      );
      const roster = await last('/customers/query');
      assert.equal(roster.value.data.items.length, 25);
      assert.ok(roster.value.data.nextCursor);
      assert.equal(
        await cdp.evaluate('document.querySelectorAll(".sales-customers li").length'),
        25,
      );
      await choose(ready.refs.customerA);
      assert.equal((await last('/orders/query')).input.filters.orderId, undefined);
    },
  );
  await check(
    'order pages and exact state/type/UUID filters use authorized server results',
    async () => {
      await value('#sales-page-size', '10', 'change');
      await settled();
      const first = (await last('/orders/query')).value.data.items.map((r) => r.orderId);
      assert.equal(first.length, 10);
      await click('#sales-next-page');
      await settled();
      const next = (await last('/orders/query')).value.data.items.map((r) => r.orderId);
      assert.ok(next.every((id) => !first.includes(id)));
      await order(ready.refs.seedOrder);
      assert.match(await text(), /پیش‌نویس ثبت‌شده/u);
      assert.ok(!(await text()).includes('حذف سفارش'));
    },
  );
  await check(
    'exact large whole demand, copyable canonical values and NOT_SUPPLIED warnings',
    async () => {
      await order(ready.refs.bigOrder);
      assert.match(await text(), /۹[٬,]?۰۰۷/u);
      assert.ok(
        await cdp.evaluate(
          "[...document.querySelectorAll('#sales-panel [data-canonical]')].some(e=>e.dataset.canonical==='9007199254740993')||document.getElementById('sales-panel').textContent.includes('9007199254740993')",
        ),
      );
      assert.match(await text(), /شرایط مالی ارائه نشده است/u);
      assert.match(await text(), /رزرو یا تضمین/u);
    },
  );
  await check(
    'multiple assessments page independently and DRAFT default STOCK is not recorded evidence',
    async () => {
      await order(ready.refs.multiOrder);
      const page = await last('/assessments/query');
      assert.equal(page.value.data.items.length, 10);
      assert.ok(page.value.data.nextCursor);
      const first = page.value.data.items[0].assessmentId;
      await clickElement(
        `[...document.querySelectorAll('.sales-table tbody tr')].find(e=>e.textContent.includes(${JSON.stringify(first)})).querySelector('button')`,
      );
      await waitFor('#sales-record-make');
      await settled();
      assert.match(await text(), /روش تأمین هنوز ثبت نشده است/u);
      assert.ok(!(await visible('#sales-select-assessment')));
      await click('#sales-back');
      await waitFor('#sales-new-assessment');
      assert.equal(
        await cdp.evaluate("document.getElementById('sales-title').textContent"),
        'جزئیات سفارش',
      );
    },
  );
  await check(
    'customer switch clears former customer exact order filter and private state',
    async () => {
      await order(ready.refs.seedOrder);
      await click('#sales-back');
      await waitFor('#sales-order-id');
      assert.equal(
        await cdp.evaluate("document.getElementById('sales-order-id').value"),
        ready.refs.seedOrder,
      );
      await choose(ready.refs.customerB);
      assert.equal(await cdp.evaluate("document.getElementById('sales-order-id').value"), '');
      assert.deepEqual((await last('/orders/query')).input.filters, {});
      assert.ok(!(await text()).includes(ready.refs.seedOrder));
      await choose(ready.refs.customerA);
    },
  );
  await check(
    'linked Persian form errors, hint retention, keyboard focus and invalid fractional demand',
    async () => {
      await click('#sales-new-order');
      await waitFor('#sales-lines');
      await clickText('بازبینی پیش از ثبت');
      assert.equal(
        await cdp.evaluate("document.activeElement.classList.contains('sales-error-summary')"),
        true,
      );
      await clickElement("document.querySelector('.sales-error-summary a')");
      assert.equal(await cdp.evaluate("document.activeElement.id.endsWith('-type')"), true);
      await value('#sales-lines select[id$="-type"]', 'COIL');
      await value('#sales-lines input[id$="-description"]', 'تقاضای صحیح');
      await value('#sales-lines input[id$="-kg"]', '1.5');
      await value('#sales-lines select[id$="-partial"]', 'false');
      const before = (await logs()).filter((r) => r.path.endsWith('/commands')).length;
      await clickText('بازبینی پیش از ثبت');
      assert.equal((await logs()).filter((r) => r.path.endsWith('/commands')).length, before);
      assert.ok(
        await cdp.evaluate(
          "document.querySelector('#sales-lines input[id$=\"-kg\"]').getAttribute('aria-describedby').includes('-kg-hint')",
        ),
      );
      await click('#sales-back');
      await waitFor('#sales-order-id');
    },
  );
  await check(
    'complete immutable draft to STOCK assessment and explicit matching confirmation',
    async () => {
      const id = await draft('SHEET', '70');
      await submit();
      const assessmentId = await newAssessment();
      await value('#sales-stock-unit', ready.refs.fraction);
      await clickText('جست‌وجوی واحدها');
      await until(async () => {
        const r = await last('/stock/query');
        return r?.input.filters.unitId === ready.refs.fraction;
      }, 'Fraction candidate missing');
      await until(
        () =>
          cdp.evaluate(
            "[...document.querySelectorAll('#sales-stock-picker button')].some(e=>e.textContent==='انتخاب برای این قلم')",
          ),
        'Candidate row missing',
      );
      assert.match(await text(), /۷۰[٫.]۵/u);
      assert.ok(!(await text()).includes('PRIVATE-'));
      await clickText('انتخاب برای این قلم');
      await clickText('ثبت ارزیابی STOCK');
      await confirm();
      await waitFor('#sales-select-assessment');
      assert.equal((await last('/assessments/detail')).value.data.id, assessmentId);
      await selectAssessment();
      assert.equal((await last('/orders/detail')).value.data.id, id);
      assert.equal((await last('/orders/detail')).value.data.confirmedAssessmentId, assessmentId);
      assert.ok(!(await visible('#sales-submit-order')));
    },
  );
  await check(
    'complete immutable draft to MAKE assessment and confirmation without production creation',
    async () => {
      await click('#sales-back');
      await waitFor('#sales-order-id');
      const before = await control('stats');
      await draft('BEAM', '9007199254740993');
      await submit();
      await newAssessment();
      await click('#sales-record-make');
      await confirm();
      await waitFor('#sales-select-assessment');
      assert.equal((await last('/assessments/detail')).value.data.mode, 'MAKE');
      assert.match(await text(), /تولید را شروع نمی‌کند/u);
      await selectAssessment();
      const after = await control('stats');
      assert.equal(after.reservations, before.reservations);
      assert.equal(after.ledger, before.ledger);
    },
  );

  await check(
    'discarded local STOCK selections do not revive when reopening the same assessment',
    async () => {
      await choose(ready.refs.customerA);
      await order(ready.refs.multiOrder);
      const id = (await last('/assessments/query')).value.data.items[0].assessmentId;
      await clickElement(
        `[...document.querySelectorAll('.sales-table tbody tr')].find(e=>e.textContent.includes(${JSON.stringify(id)})).querySelector('button')`,
      );
      await waitFor('#sales-stock-picker');
      await until(
        () =>
          cdp.evaluate(
            "[...document.querySelectorAll('#sales-stock-picker button')].some(e=>e.textContent==='انتخاب برای این قلم')",
          ),
        'Stock not loaded',
      );
      await clickText('انتخاب برای این قلم');
      assert.ok(
        await cdp.evaluate(
          "[...document.querySelectorAll('#sales-stock-picker button')].some(e=>e.textContent==='حذف از انتخاب محلی')",
        ),
      );
      await click('#sales-back');
      await waitFor('#sales-new-assessment');
      await clickElement(
        `[...document.querySelectorAll('.sales-table tbody tr')].find(e=>e.textContent.includes(${JSON.stringify(id)})).querySelector('button')`,
      );
      await waitFor('#sales-stock-picker');
      await settled();
      assert.equal(
        await cdp.evaluate(
          "[...document.querySelectorAll('#sales-stock-picker button')].filter(e=>e.textContent==='حذف از انتخاب محلی').length",
        ),
        0,
      );
    },
  );
  await check('assessment refresh resets an expired stock traversal to page one', async () => {
    await until(() => visible('#sales-next-page'), 'Stock next page missing');
    await click('#sales-next-page');
    await until(
      async () => !!(await last('/stock/query'))?.input.cursor,
      'Stock next-page response missing',
    );
    assert.ok((await last('/stock/query')).input.cursor);
    await control('cursor-expire');
    await click('#sales-refresh');
    await until(async () => {
      const response = await last('/stock/query');
      return response?.status === 200 && response.input.cursor === undefined;
    }, 'Refreshed stock first-page response missing');
    assert.equal((await last('/stock/query')).status, 200);
    assert.equal((await last('/stock/query')).input.cursor, undefined);
    await control('cursor-reset');
  });
  await check(
    'read-only navigation during accepted write releases old view writing state',
    async () => {
      await choose(ready.refs.customerA);
      await order(ready.refs.seedOrder);
      await click('#sales-new-assessment');
      await cdp.evaluate("window.__p4bChecks.arm('json','/sales/v1/commands')");
      await confirm();
      await until(
        () => cdp.evaluate('window.__p4bChecks.reached()'),
        'Real committed reply gate not reached',
      );
      await click('#sales-change-customer');
      await waitFor('.sales-customers');
      await cdp.evaluate('window.__p4bChecks.release()');
      await until(
        () => cdp.evaluate("!sessionStorage.getItem('navard-p4b-sales-pending-v1')"),
        'Exact accepted recovery not resolved',
      );
      await choose(ready.refs.customerA);
      assert.equal(
        await cdp.evaluate("document.getElementById('sales-new-order').disabled"),
        false,
      );
    },
  );
  await check(
    'browser complete-envelope cap rejects oversize before any command dispatch',
    async () => {
      const before = (await logs()).filter((r) => r.path.endsWith('/commands')).length;
      const rejected = await cdp.evaluate(
        `(async()=>{const m=await import('/operator/sales.js');try{m.salesCommandBody('DraftSalesOrder',crypto.randomUUID(),{customerId:${JSON.stringify(ready.refs.customerA)},description:'ب'.repeat(4096)});return false;}catch(e){return e.message.includes('۴۰۹۶');}})()`,
      );
      assert.equal(rejected, true);
      assert.equal((await logs()).filter((r) => r.path.endsWith('/commands')).length, before);
    },
  );
  await check(
    'storage denial prevents the first Sales command without plaintext persistence',
    async () => {
      await click('#sales-new-order');
      await waitFor('#sales-lines');
      await value('#sales-lines select[id$="-type"]', 'COIL');
      await value('#sales-lines input[id$="-description"]', 'ذخیره امن');
      await value('#sales-lines input[id$="-kg"]', '5');
      await value('#sales-lines select[id$="-partial"]', 'true');
      await clickText('بازبینی پیش از ثبت');
      const before = await control('stats');
      await cdp.evaluate(
        "window.__p4bSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('Denied','SecurityError')}",
      );
      try {
        await confirm();
        await until(
          () =>
            cdp.evaluate(
              "document.getElementById('message').textContent.includes('هیچ درخواست تازه‌ای ارسال نشد')",
            ),
          'Secure storage error missing',
        );
        assert.equal((await control('stats')).orders, before.orders);
        assert.equal(
          await cdp.evaluate("sessionStorage.getItem('navard-p4b-sales-pending-v1')"),
          null,
        );
      } finally {
        await cdp.evaluate(
          'Storage.prototype.setItem=window.__p4bSetItem;delete window.__p4bSetItem',
        );
      }
      await click('#sales-back');
      await click('#sales-back');
      await waitFor('#sales-order-id');
    },
  );
  let p1Cipher;
  await check(
    'accepted command with storage-cleanup denial stays definitive and retries cleanup without another write',
    async () => {
      await cdp.evaluate(
        "window.__p4bRemove=Storage.prototype.removeItem;Storage.prototype.removeItem=function(k){if(k==='navard-p4b-sales-pending-v1')throw new DOMException('Denied','SecurityError');return window.__p4bRemove.call(this,k)}",
      );
      try {
        await draft('COIL', '3', 'پاک‌کردن پیگیری قطعی');
        assert.equal(
          await cdp.evaluate("!!sessionStorage.getItem('navard-p4b-sales-pending-v1')"),
          true,
        );
        assert.ok(
          await cdp.evaluate(
            "document.getElementById('recovery-note').textContent.includes('نتیجهٔ عملیات قطعی است')",
          ),
        );
      } finally {
        await cdp.evaluate(
          'Storage.prototype.removeItem=window.__p4bRemove;delete window.__p4bRemove',
        );
      }
      const before = (await logs()).filter((r) => r.path.endsWith('/commands')).length;
      await click('#recover');
      await until(
        () => cdp.evaluate("!sessionStorage.getItem('navard-p4b-sales-pending-v1')"),
        'Terminal recovery cleanup did not resolve',
      );
      assert.equal((await logs()).filter((r) => r.path.endsWith('/commands')).length, before);
      await settled();
    },
  );
  await check(
    'uncertain PROC write blocks new Sales intent and replays exactly under original role',
    async () => {
      await role('ACT-PROC');
      await click('#show-catalogues');
      await value('#catalogue-kind', 'MATERIAL_TYPE', 'change');
      await value('#catalogue-label', 'P4B-CHROMIUM-' + Date.now());
      await cdp.evaluate("window.__p4bChecks.arm('json','/purchasing/inbound-catalogues')");
      await click('#catalogue-form button[type=submit]');
      await until(
        () => cdp.evaluate('window.__p4bChecks.reached()'),
        'Real PROC commit not reached',
      );
      await cdp.evaluate('window.__p4bChecks.release(true)');
      await until(
        () =>
          cdp.evaluate(
            "!document.getElementById('role').disabled&&!!sessionStorage.getItem('navard-p1-pending-v1')",
          ),
        'PROC uncertain state missing',
      );
      p1Cipher = await cdp.evaluate("sessionStorage.getItem('navard-p1-pending-v1')");
      await role('ACT-SALES');
      await choose(ready.refs.customerA);
      assert.equal(await cdp.evaluate("document.getElementById('sales-new-order').disabled"), true);
      assert.equal(await cdp.evaluate("sessionStorage.getItem('navard-p1-pending-v1')"), p1Cipher);
      await role('ACT-PROC');
      await click('#recover');
      await until(
        () => cdp.evaluate("!sessionStorage.getItem('navard-p1-pending-v1')"),
        'PROC replay did not resolve',
      );
      await role('ACT-SALES');
      await choose(ready.refs.customerA);
    },
  );
  await check(
    'uncertain Sales reply preserves exact key/target/body and blocks PROC/WH writes',
    async () => {
      await click('#sales-new-order');
      await waitFor('#sales-lines');
      await value('#sales-lines select[id$="-type"]', 'COIL');
      await value('#sales-lines input[id$="-description"]', 'پیگیری همان ثبت');
      await value('#sales-lines input[id$="-kg"]', '5');
      await value('#sales-lines select[id$="-partial"]', 'true');
      await clickText('بازبینی پیش از ثبت');
      await cdp.evaluate("window.__p4bChecks.arm('json','/sales/v1/commands')");
      await confirm();
      await until(() => cdp.evaluate('window.__p4bChecks.reached()'), 'Sales commit not reached');
      const first = (await last('/commands')).input;
      await cdp.evaluate('window.__p4bChecks.release(true)');
      await until(
        () =>
          cdp.evaluate(
            "!document.getElementById('role').disabled&&!!sessionStorage.getItem('navard-p4b-sales-pending-v1')",
          ),
        'Sales unknown outcome missing',
      );
      const cipher = await cdp.evaluate("sessionStorage.getItem('navard-p4b-sales-pending-v1')");
      assert.ok(!cipher.includes(first.target.id));
      await role('ACT-PROC');
      assert.equal(
        await cdp.evaluate(
          "document.getElementById('order-fields').disabled&&document.getElementById('catalogue-fields').disabled",
        ),
        true,
      );
      assert.equal(
        await cdp.evaluate("sessionStorage.getItem('navard-p4b-sales-pending-v1')"),
        cipher,
      );
      await role('ACT-WH');
      assert.equal(await cdp.evaluate("document.getElementById('order-fields').disabled"), true);
      await role('ACT-SALES');
      await choose(ready.refs.customerA);
      await click('#recover');
      await until(
        () => cdp.evaluate("!sessionStorage.getItem('navard-p4b-sales-pending-v1')"),
        'Sales same-key replay did not resolve',
      );
      assert.deepEqual((await last('/commands')).input, first);
    },
  );
  await check(
    'multiple pre-existing encrypted namespaces fail closed until each exact authorized replay resolves',
    async () => {
      await choose(ready.refs.customerA);
      await order(ready.refs.seedOrder);
      await click('#sales-new-assessment');
      await cdp.evaluate("window.__p4bChecks.arm('json','/sales/v1/commands')");
      await confirm();
      await until(
        () => cdp.evaluate('window.__p4bChecks.reached()'),
        'Assessment commit not reached',
      );
      await cdp.evaluate('window.__p4bChecks.release(true)');
      await until(
        () => cdp.evaluate("!document.getElementById('role').disabled"),
        'Uncertain write still busy',
      );
      const salesCipher = await cdp.evaluate(
        "sessionStorage.getItem('navard-p4b-sales-pending-v1')",
      );
      assert.ok(salesCipher);
      assert.ok(p1Cipher);
      await cdp.evaluate(
        `sessionStorage.setItem('navard-p1-pending-v1',${JSON.stringify(p1Cipher)})`,
      );
      await cdp.call('Page.reload');
      await until(
        () => cdp.evaluate("!document.getElementById('workspace').hidden"),
        'Reload failed',
      );
      await role('ACT-SALES');
      await choose(ready.refs.customerA);
      assert.equal(await cdp.evaluate("document.getElementById('sales-new-order').disabled"), true);
      assert.equal(await cdp.evaluate("sessionStorage.getItem('navard-p1-pending-v1')"), p1Cipher);
      await click('#recover');
      await until(
        () => cdp.evaluate("!sessionStorage.getItem('navard-p4b-sales-pending-v1')"),
        'Sales record not resolved',
      );
      await role('ACT-PROC');
      assert.equal(await cdp.evaluate("document.getElementById('order-fields').disabled"), true);
      await click('#recover');
      await until(
        () => cdp.evaluate("!sessionStorage.getItem('navard-p1-pending-v1')"),
        'Legacy record not resolved',
      );
      await role('ACT-SALES');
      await choose(ready.refs.customerA);
      assert.equal(
        await cdp.evaluate("document.getElementById('sales-new-order').disabled"),
        false,
      );
    },
  );
  await check(
    'cross-customer object IDs, absent selectors and role overrides deny without data disclosure',
    async () => {
      const foreign = await direct(
        'orders/detail',
        { orderId: ready.refs.foreignOrder },
        ready.refs.customerA,
      );
      assert.equal(foreign.status, 404);
      assert.equal(JSON.stringify(foreign.body).includes(ready.refs.customerB), false);
      assert.equal((await direct('orders/query', {})).status, 403);
      assert.equal((await direct('customers/query', {}, ready.refs.customerA)).status, 400);
      assert.equal(
        (await direct('orders/query', {}, ready.refs.customerA, { 'x-erp-role': 'ACT-WH' })).status,
        403,
      );
    },
  );
  await check(
    'cursor tampering and cross-customer replay are rejected in the actual browser transport',
    async () => {
      const page = await direct('orders/query', { limit: 10 }, ready.refs.customerA);
      assert.equal(page.status, 200);
      const cursor = page.body.data.nextCursor;
      assert.ok(cursor);
      assert.equal(
        (await direct('orders/query', { limit: 10, cursor: cursor + 'x' }, ready.refs.customerA))
          .status,
        400,
      );
      assert.equal(
        (await direct('orders/query', { limit: 10, cursor }, ready.refs.customerB)).status,
        400,
      );
    },
  );
  await check('confidential internal-code filters are not an existence oracle', async () => {
    const id = (
      await direct('orders/detail', { orderId: ready.refs.seedOrder }, ready.refs.customerA)
    ).body.data.items[0].id;
    const a = await direct(
      'stock/query',
      {
        orderId: ready.refs.seedOrder,
        itemId: id,
        filters: { internalCode: 'PRIVATE-CUSTOMER-CONTRACT' },
      },
      ready.refs.customerA,
    );
    const b = await direct(
      'stock/query',
      { orderId: ready.refs.seedOrder, itemId: id, filters: { internalCode: 'definitely-absent' } },
      ready.refs.customerA,
    );
    assert.equal(a.status, 200);
    assert.deepEqual(a.body.data, b.body.data);
    assert.deepEqual(a.body.data.items, []);
  });
  await check('CSRF and unsupported browser route admission remain closed', async () => {
    assert.equal(
      (await direct('orders/query', {}, ready.refs.customerA, { 'x-erp-csrf': 'wrong' })).status,
      403,
    );
    assert.equal((await direct('arbitrary', {}, ready.refs.customerA)).status, 404);
  });
  await check(
    'superseded actual403 cannot lock a newer authorized customer workspace',
    async () => {
      await choose(ready.refs.customerA);
      await control('revoke-a');
      await cdp.evaluate("window.__p4bChecks.arm('headers','/sales/v1/orders/query')");
      await click('#sales-refresh');
      await until(
        () => cdp.evaluate('window.__p4bChecks.reached()'),
        'Actual denied response gate missing',
      );
      await click('#sales-change-customer');
      await waitFor('.sales-customers');
      await choose(ready.refs.customerB);
      await cdp.evaluate('window.__p4bChecks.release()');
      await delay(100);
      assert.equal(await cdp.evaluate("document.getElementById('workspace').hidden"), false);
      assert.ok((await text()).includes(ready.refs.customerB));
      assert.ok(!(await text()).includes(ready.refs.customerA));
      await control('restore-a');
    },
  );
  await check(
    'current selected customer revocation locks on focus even while other Sales grants survive',
    async () => {
      await choose(ready.refs.customerA);
      await control('revoke-a');
      await cdp.evaluate("window.dispatchEvent(new Event('focus'))");
      await until(
        () =>
          cdp.evaluate(
            "!document.getElementById('login-panel').hidden&&document.getElementById('workspace').hidden",
          ),
        'Current customer grant revocation left private workspace visible',
      );
      assert.ok(!(await cdp.evaluate('document.body.innerText')).includes('A'.repeat(128)));
      await control('restore-a');
      await login();
      await choose(ready.refs.customerA);
    },
  );
  await check(
    'same-account cookie rotation drops old replies and clears private state',
    async () => {
      await cdp.evaluate("window.__p4bChecks.arm('json','/sales/v1/orders/query')");
      await click('#sales-refresh');
      await until(() => cdp.evaluate('window.__p4bChecks.reached()'), 'Delayed query missing');
      await cdp.evaluate(
        `fetch('/ui-api/identity/login',{method:'POST',headers:{'x-erp-browser':'1','content-type':'application/json'},body:JSON.stringify({username:'sales.first',password:${JSON.stringify(salesPassword)}})}).then(r=>r.json())`,
      );
      await cdp.evaluate("window.dispatchEvent(new Event('focus'))");
      await until(() => visible('.sales-customers'), 'Rotated cookie did not clear selected data');
      await cdp.evaluate('window.__p4bChecks.release()');
      await delay(100);
      assert.ok(!(await text()).includes(ready.refs.seedOrder));
      await choose(ready.refs.customerA);
    },
  );
  await check(
    'desktop contrast and semantic native controls are measured in real Chromium',
    async () => {
      const ratios = await cdp.evaluate(
        `(()=>{const lum=s=>{const c=s.match(/[0-9.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return .2126*c[0]+.7152*c[1]+.0722*c[2]};return [...document.querySelectorAll('#sales-panel h2,#sales-panel label,#sales-panel button:not(:disabled)')].map(e=>{const s=getComputedStyle(e);let p=e,b=s.backgroundColor;while(b==='rgba(0, 0, 0, 0)'&&p.parentElement){p=p.parentElement;b=getComputedStyle(p).backgroundColor}const a=lum(s.color),z=lum(b);return {tag:e.tagName,ratio:(Math.max(a,z)+.05)/(Math.min(a,z)+.05),height:e.getBoundingClientRect().height};});})()`,
      );
      assert.ok(ratios.every((r) => r.ratio >= 4.5));
      assert.ok(ratios.filter((r) => r.tag === 'BUTTON').every((r) => r.height >= 44));
      writeFileSync(resolve(output, 'p4b-contrast.json'), JSON.stringify(ratios, null, 2));
      assert.ok(
        await cdp.evaluate(
          "[...document.querySelectorAll('#sales-panel table')].every(t=>t.querySelector('caption')&&t.querySelector('th[scope=col]'))",
        ),
      );
      await cdp.evaluate("document.getElementById('sales-new-order').focus()");
      await key('Tab', 9);
      assert.equal(await cdp.evaluate('document.activeElement===document.body'), false);
    },
  );
  await check('375px RTL long-name reflow and reduced-motion remain operable', async () => {
    await cdp.call('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
    await cdp.call('Emulation.setDeviceMetricsOverride', {
      width: 375,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    assert.ok((await text()).includes('A'.repeat(128)));
    assert.ok(await cdp.evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
    assert.ok(await visible('#sales-new-order'));
    await screenshot('p4b-sales-mobile.png');
  });
  await check(
    '200% and400% Chromium layout zoom preserve long descriptions, controls and horizontal reflow',
    async () => {
      await cdp.call('Emulation.setDeviceMetricsOverride', {
        width: 1440,
        height: 1050,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await order(ready.refs.bigOrder);
      for (const zoom of [2, 4]) {
        await cdp.evaluate(`document.documentElement.style.zoom=${zoom}`);
        assert.ok(await cdp.evaluate('document.documentElement.scrollWidth<=innerWidth+1'));
        assert.ok(await visible('#sales-back'));
        assert.ok((await text()).includes('B'.repeat(128)));
      }
      await screenshot('p4b-sales-400percent.png');
      await cdp.evaluate("document.documentElement.style.zoom='1'");
    },
  );
  await check(
    'local idle expiry synchronously clears private data before a new interaction',
    async () => {
      await cdp.evaluate(
        "window.__p4bNow=Date.now;Date.now=()=>window.__p4bNow()+31*60*1000;document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true}))",
      );
      assert.equal(await cdp.evaluate("document.getElementById('workspace').hidden"), true);
      await cdp.evaluate('Date.now=window.__p4bNow;delete window.__p4bNow');
      await login();
      await choose(ready.refs.customerA);
    },
  );
  await check('server-expired session takes precedence over materialized Sales data', async () => {
    await control('expire');
    await click('#sales-refresh');
    await until(
      () =>
        cdp.evaluate(
          "document.getElementById('workspace').hidden&&!document.getElementById('login-panel').hidden",
        ),
      'Expired server session did not lock',
    );
    await login();
    await choose(ready.refs.customerA);
  });
  if (process.env.P4B_UI_PERF_SAMPLES) {
    const count = Number(process.env.P4B_UI_PERF_SAMPLES);
    assert.ok(Number.isSafeInteger(count) && count >= 200 && count <= 1000);
    await choose(ready.refs.customerA);
    await value('#sales-page-size', '25', 'change');
    await settled();
    await order(ready.refs.multiOrder);
    const assessmentId = (await last('/assessments/query')).value.data.items.find(
      (row) => row.state === 'DRAFT',
    ).assessmentId;
    await click('#sales-back');
    await waitFor('#sales-order-id');
    await clickText('پاک‌کردن فیلترها');
    await settled();
    const samples = [],
      before = await control('stats'),
      startUtc = new Date().toISOString();
    for (let i = 0; i < count; i++) {
      const reads = await readCount('/orders/query');
      let start = performance.now();
      await click('#sales-refresh');
      await until(
        async () => (await readCount('/orders/query')) > reads,
        'Measured order refresh missing',
      );
      await settled();
      samples.push({
        operation: 'order-first-page-refresh',
        iteration: i,
        durationMs: performance.now() - start,
      });
      start = performance.now();
      await order(ready.refs.multiOrder);
      await waitFor('#sales-new-assessment');
      await settled();
      samples.push({
        operation: 'exact-order-lookup-detail-and-assessments',
        iteration: i,
        durationMs: performance.now() - start,
      });
      const stockReads = await readCount('/stock/query');
      start = performance.now();
      await clickElement(
        `[...document.querySelectorAll('.sales-table tbody tr')].find(e=>e.textContent.includes(${JSON.stringify(assessmentId)})).querySelector('button')`,
      );
      await waitFor('#sales-stock-picker');
      await until(
        async () => (await readCount('/stock/query')) > stockReads,
        'Measured stock candidates missing',
      );
      await until(
        () =>
          cdp.evaluate(
            "document.querySelectorAll('#sales-stock-picker .sales-table tbody tr').length>0",
          ),
        'Measured stock render missing',
      );
      samples.push({
        operation: 'assessment-detail-and-stock-candidates',
        iteration: i,
        durationMs: performance.now() - start,
      });
      await click('#sales-back');
      await waitFor('#sales-new-assessment');
      await click('#sales-back');
      await waitFor('#sales-order-id');
      await clickText('پاک‌کردن فیلترها');
      await settled();
    }
    assert.deepEqual(
      await control('stats'),
      before,
      'Read-only UI measurement changed business facts/outcomes',
    );
    const summary = Object.fromEntries(
      [...new Set(samples.map((s) => s.operation))].map((operation) => {
        const values = samples
          .filter((s) => s.operation === operation)
          .map((s) => s.durationMs)
          .sort((a, b) => a - b);
        const percentile = (p) => values[Math.ceil(p * values.length) - 1];
        return [
          operation,
          {
            count: values.length,
            p50: percentile(0.5),
            p95: percentile(0.95),
            p99: percentile(0.99),
            max: values.at(-1),
          },
        ];
      }),
    );
    uiPerformance = {
      status: 'MEASURED_OWNER_BUDGETS_PENDING',
      actualChromium: true,
      version: version.Browser,
      revision: process.env.P4B_REVISION ?? null,
      startUtc,
      completedUtc: new Date().toISOString(),
      dataset: before,
      methodology:
        '200+ repeated read-only warm journeys on the explicit functional synthetic dataset; real CDP clicks through native UI and real backend/PostgreSQL. Includes automation/CDP and up-to40ms polling overhead. No cold-cache claim, no concurrent writers; larger data/concurrent writers measured separately by backend harness.',
      summary,
      samples,
    };
    writeFileSync(
      resolve(output, 'p4b-ui-performance.json'),
      JSON.stringify(uiPerformance, null, 2),
    );
    console.log('Actual Chromium UI latency measurements complete; Owner budgets pending');
  }
  await check(
    'Sales UI commands and all reads leave Inventory Ledger, Balance, claims and Unit state unchanged',
    async () => {
      assert.equal(await control('snapshot'), ready.initialStock);
      assert.ok(
        (await control('stats')).outcomes > dataset.outcomes,
        'Accepted Sales commands must retain durable outcomes',
      );
      await logout();
      assert.equal(await cdp.evaluate("document.getElementById('sales-panel').textContent"), '');
    },
  );

  writeFileSync(
    resolve(output, 'p4b-chromium-version.json'),
    JSON.stringify(
      {
        browser: version.Browser,
        protocol: version['Protocol-Version'],
        node: process.versions.node,
        platform: process.platform,
      },
      null,
      2,
    ),
  );
} catch (error) {
  exitCode = 1;
  console.error('Chromium verification failed: ' + error.message);
  if (cdp)
    try {
      await screenshot('p4b-chromium-failure.png');
      writeFileSync(
        resolve(output, 'p4b-chromium-failure-dom.txt'),
        await cdp.evaluate('document.body.innerText'),
      );
    } catch {
      /* retain primary */
    }
} finally {
  if (cdp)
    try {
      await cdp.call('Browser.close');
    } catch {
      /* close races reply */
    }
  if (chrome)
    try {
      await waitExit(chrome, 10000);
    } catch {
      chrome.kill();
    }
  if (fixture)
    try {
      if (fixture.exitCode === null && fixture.signalCode === null) {
        await control('stop');
        fixture.stdin.end();
      }
      assert.equal(await waitExit(fixture, 15000), 0);
    } catch (error) {
      console.error('Fixture shutdown failed: ' + error.message);
      fixture.kill();
      exitCode = 1;
    }
  writeFileSync(resolve(output, 'p4b-chromium-fixture.log'), fixtureLines.join('\n'));
  writeFileSync(resolve(output, 'p4b-chromium-browser.log'), chromeLines.join('\n'));
  const summary = {
    actualChromium: true,
    composedBackend: true,
    realPostgreSQL: true,
    revision: process.env.P4B_REVISION ?? null,
    dataset,
    version: version?.Browser,
    measurementScope:
      'Single functional-journey wall durations, not a repeated performance percentile benchmark',
    passed: results.filter((r) => r.status === 'PASS').length,
    failed: results.filter((r) => r.status === 'FAIL').length,
    skipped: 0,
    complete: exitCode === 0,
    checks: results,
    consoleErrors,
    ...(uiPerformance ? { uiPerformance: uiPerformance.summary } : {}),
  };
  writeFileSync(resolve(output, 'p4b-chromium-results.json'), JSON.stringify(summary, null, 2));
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
