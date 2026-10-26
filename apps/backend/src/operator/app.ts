import {
  commandBody,
  linePayload,
  openIntent,
  pendingSlot,
  sealIntent,
  type Intent,
} from './intent.js';
import { textValue } from './display.js';

type Role = 'ACT-PROC' | 'ACT-WH';
type Kind = 'MATERIAL_TYPE' | 'QUALITY_GRADE' | 'COLOR';
interface Self {
  accountId: string;
  personId: string;
  username: string;
  expiresAt: string;
  grants: { actorRole: Role }[];
  browser: { csrf: string; recoveryKey?: string };
}
interface Option {
  optionId: string;
  catalogue: Kind;
  label: string;
}
interface Page {
  items: Record<string, unknown>[];
  nextAfterId?: string;
  snapshotAt?: string;
}
interface Order {
  orderId: string;
  orderReference: string;
  registrationDateJalali: string;
  lines: Record<string, unknown>[];
}
interface Outcome {
  status: string;
  attemptId?: string;
  replayed?: boolean;
  result?: { outcome: string; family?: string };
}
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const input = (id: string) => el<HTMLInputElement>(id).value;
const show = (id: string, visible: boolean) => {
  el(id).hidden = !visible;
};
const kinds: Kind[] = ['MATERIAL_TYPE', 'QUALITY_GRADE', 'COLOR'];
const kindNames = { MATERIAL_TYPE: 'نوع کالا', QUALITY_GRADE: 'کیفیت', COLOR: 'رنگ' };
const catalogues = new Map<Kind, Map<string, Option>>(kinds.map((k) => [k, new Map()]));
const catalogueCursors = new Map<Kind, string>();
let self: Self | undefined,
  role: Role = 'ACT-PROC',
  pending: Intent | undefined,
  lockedPending = false;
let busy = false,
  epoch = 0,
  currentOrder: Order | undefined,
  receivingCursor: string | undefined,
  receivingCount = 0,
  receivingPage = 0;
// Identity renews last_seen_at in session()/context(). Use request START, not receipt
// time: a successful authenticated response proves renewal no earlier than that.
// Pointer/keyboard activity is never evidence of server renewal.
const idleMs = 30 * 60 * 1000;
let idleUntil = 0,
  idleUntilMonotonic = 0,
  expiryTimer: ReturnType<typeof setTimeout> | undefined;
let prepared: unknown;
let loggingOut = false;
let logoutController: AbortController | undefined;
const sessionChanges = new BroadcastChannel('navard-p1-session-change');
sessionChanges.onmessage = () => {
  if (self || loggingOut) {
    logoutController?.abort();
    lock('نشست در تب دیگری تغییر کرده است. برای ادامه با حساب خود وارد شوید.');
  }
};
let orderRead = 0,
  receivingRead = 0;
const arrivals = new Set<string>();
class Stale extends Error {}
class RecoveryStorageError extends Error {}
class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly outcome?: Outcome,
  ) {
    super('Request failed');
  }
}
function message(text: string, kind = '') {
  el('message').textContent = text;
  el('message').dataset.kind = kind;
}
function node<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) {
  const n = document.createElement(tag);
  if (text !== undefined) n.textContent = text;
  return n;
}
function clearBusiness() {
  orderRead++;
  receivingRead++;
  el('order-result').replaceChildren();
  el('receiving-result').replaceChildren();
  show('receiving', false);
  currentOrder = undefined;
  receivingCursor = undefined;
  receivingCount = 0;
  receivingPage = 0;
  arrivals.clear();
}
function lock(text: string) {
  epoch++;
  clearTimeout(expiryTimer);
  idleUntil = idleUntilMonotonic = 0;
  self = undefined;
  pending = undefined;
  prepared = undefined;
  busy = false;
  clearBusiness();
  el<HTMLFormElement>('order-form').reset();
  el('lines').replaceChildren();
  for (const cache of catalogues.values()) cache.clear();
  catalogueCursors.clear();
  el('catalogue-options').replaceChildren();
  el<HTMLFormElement>('catalogue-form').reset();
  el<HTMLFormElement>('lookup-form').reset();
  el('recovery-reference').textContent = '';
  el('receiving-status').textContent = '';
  show('workspace', false);
  show('login-panel', true);
  show('logout', false);
  show('order-confirm', false);
  show('discard-confirm', false);
  show('retry-session', false);
  navigate('lookup-panel');
  el('identity').textContent = 'ورود با حساب شخصی';
  message(text, 'error');
}
function checkLocalExpiry(): boolean {
  if (
    self &&
    (Date.now() >= idleUntil ||
      performance.now() >= idleUntilMonotonic ||
      Date.now() >= Date.parse(self.expiresAt))
  ) {
    lock('نشست پایان یافته است. برای ادامه و پیگیری عملیات با همان حساب وارد شوید.');
    return true;
  }
  return false;
}
function armExpiry() {
  clearTimeout(expiryTimer);
  if (!self || checkLocalExpiry()) return;
  expiryTimer = setTimeout(
    () => {
      if (!checkLocalExpiry()) armExpiry();
    },
    Math.max(
      0,
      Math.min(
        idleUntil - Date.now(),
        idleUntilMonotonic - performance.now(),
        Date.parse(self.expiresAt) - Date.now(),
      ),
    ),
  );
}
async function api<T>(path: string, body?: string | object, selectedRole: Role = role): Promise<T> {
  if (checkLocalExpiry()) throw new Stale();
  const generation = epoch;
  const startedAt = Date.now(),
    startedMonotonic = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('/ui-api' + path, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'x-erp-browser': '1',
        'x-erp-role': selectedRole,
        ...(self ? { 'x-erp-csrf': self.browser.csrf } : {}),
        ...(body === undefined ? {} : { 'content-type': 'application/json; charset=utf-8' }),
      },
      ...(body === undefined
        ? {}
        : { body: typeof body === 'string' ? body : JSON.stringify(body) }),
    });
    if (generation !== epoch || checkLocalExpiry()) throw new Stale();
    const value = (await response.json()) as T;
    if (generation !== epoch || checkLocalExpiry()) throw new Stale();
    if (!response.ok) {
      if ((response.status === 401 || response.status === 403) && path !== '/identity/login') {
        lock(
          response.status === 401
            ? 'نشست پایان یافته است. برای ادامه و پیگیری عملیات با همان حساب وارد شوید.'
            : 'مجوز عملیات معتبر نیست. اطلاعات پنهان شد؛ دسترسی خود را با ورود مجدد بررسی کنید.',
        );
        throw new Stale();
      }
      throw new ApiError(response.status, value as Outcome);
    }
    if (path !== '/identity/login') {
      idleUntil = Math.max(idleUntil, startedAt + idleMs);
      idleUntilMonotonic = Math.max(idleUntilMonotonic, startedMonotonic + idleMs);
      armExpiry();
    }
    return value;
  } finally {
    clearTimeout(timer);
  }
}
function errorText(error: unknown): string {
  if (error instanceof RecoveryStorageError)
    return 'مرورگر نتوانست پیگیری امن را ذخیره یا باز کند. هیچ درخواست تازه‌ای ارسال نشد؛ تنظیمات ذخیره‌سازی این تب را بررسی کنید.';
  if (!(error instanceof ApiError))
    return 'پاسخ قطعی دریافت نشد. ارتباط را بررسی کنید؛ نتیجهٔ عملیات ثبت ممکن است هنوز نامعلوم باشد.';
  if (error.status === 401)
    return 'نام کاربری یا گذرواژه معتبر نیست؛ ممکن است نشست نیز پایان یافته باشد.';
  if (error.status === 403) return 'اجازهٔ انجام این عملیات را ندارید.';
  if (error.status === 404) return 'سفارش موردنظر یافت نشد.';
  if (error.status === 409)
    return 'هویت این درخواست با اطلاعات قبلی تعارض دارد. نتیجه را با شماره یا شناسه بررسی کنید.';
  if (error.status === 422)
    return error.outcome?.result?.family === 'GUARD_CONFLICT'
      ? 'شماره یا مشخصات با ثبت قبلی تعارض دارد؛ اصل سفارش را بازیابی کنید.'
      : error.outcome?.result?.family === 'GUARD_IDEMPOTENT_DUP'
        ? 'این مورد قبلاً ثبت شده است؛ گزینه یا سفارش موجود را بازیابی کنید.'
        : 'داده پذیرفته نشد. قالب تاریخ جلالی، مقادیر مثبت، انتخاب کاتالوگ و طول فیلدها را بررسی کنید.';
  if (error.status === 400)
    return 'قالب درخواست یا داده معتبر نیست. فیلدها و اندازهٔ سفارش را بررسی کنید.';
  if (error.status === 503)
    return pending
      ? 'سرویس پاسخ قطعی نداده است. ثبت را ناموفق فرض نکنید؛ از پیگیری همان درخواست استفاده کنید.'
      : 'سرویس در دسترس نیست؛ ورود یا بازیابی اطلاعات کامل نشد.';
  return 'پاسخ مورد انتظار دریافت نشد؛ وضعیت را بررسی کنید.';
}
function action(work: () => Promise<void>) {
  return () => {
    void work().catch((e) => {
      if (!(e instanceof Stale)) {
        const correlation =
          e instanceof ApiError && /^[0-9a-f-]{36}$/u.test(e.outcome?.attemptId ?? '')
            ? ` کد پیگیری: ${e.outcome!.attemptId}`
            : '';
        message(errorText(e) + correlation, 'error');
      }
    });
  };
}
function on(id: string, event: string, work: () => Promise<void>) {
  el(id).addEventListener(event, (e) => {
    e.preventDefault();
    action(work)();
  });
}
// Keep native keyboard/form validation, with Persian feedback independent of browser locale.
document.addEventListener(
  'invalid',
  (event) => {
    const control = event.target;
    if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement) {
      control.setCustomValidity(
        control.validity.valueMissing
          ? 'لطفاً این فیلد را تکمیل کنید.'
          : control.validity.patternMismatch
            ? 'قالب مقدار را مطابق راهنمای فیلد وارد کنید.'
            : 'لطفاً مقدار معتبر وارد کنید.',
      );
    }
  },
  true,
);
for (const event of ['input', 'change'])
  document.addEventListener(event, (e) => {
    const control = e.target;
    if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement)
      control.setCustomValidity('');
  });
function permissions() {
  return new Set(self?.grants.map((g) => g.actorRole) ?? []);
}
function updateControls() {
  const blocked = busy || !!pending || lockedPending || prepared !== undefined;
  el<HTMLFieldSetElement>('order-fields').disabled = blocked;
  el<HTMLFieldSetElement>('catalogue-fields').disabled = blocked;
  el<HTMLButtonElement>('recover').disabled = busy || !pending || !permissions().has(pending.role);
  el<HTMLButtonElement>('role').disabled = busy || prepared !== undefined;
  show('show-register', permissions().has('ACT-PROC') && role === 'ACT-PROC');
  show('recovery', !!pending || lockedPending);
  el('recovery-note').textContent = lockedPending
    ? 'یک پیگیری رمز‌شده در این تب وجود دارد که این حساب اجازهٔ بازکردن آن را ندارد. با حساب اصلی وارد شوید یا پس از بررسی نتیجه، پیگیری را صریحاً ببندید. می‌توانید برای کار مستقل تب تازه باز کنید.'
    : 'نتیجهٔ عملیات تا دریافت پاسخ قطعی نامعلوم است. اطلاعات آن ثابت مانده است. پیگیری، همان درخواست را تکرار می‌کند و سفارش تازه‌ای نمی‌سازد.';
  const command = pending
    ? (JSON.parse(pending.body) as {
        target: { id: string };
        payload: { orderReference?: string; label?: string };
      })
    : undefined;
  el('recovery-reference').textContent = command
    ? `${command.payload.orderReference ?? command.payload.label ?? ''} · ${command.target.id}`
    : '';
}
async function restorePending() {
  pending = undefined;
  lockedPending = false;
  let saved: string | null;
  try {
    saved = sessionStorage.getItem(pendingSlot);
  } catch {
    lockedPending = true;
    updateControls();
    throw new RecoveryStorageError();
  }
  if (!saved) return;
  const actor = self;
  const generation = epoch;
  try {
    if (!actor?.browser.recoveryKey) throw new Error('No current purchasing grant');
    const intent = await openIntent(saved, actor.browser.recoveryKey);
    if (generation !== epoch || actor !== self) throw new Stale();
    if (intent.accountId !== actor.accountId || intent.personId !== actor.personId)
      throw new Error('Different actor');
    pending = intent;
  } catch (e) {
    if (e instanceof Stale) throw e;
    lockedPending = true;
  }
}
async function session() {
  const value = await api<Self>('/identity/session');
  const confirmedUntil = idleUntil,
    confirmedMonotonic = idleUntilMonotonic;
  const changed =
    self &&
    (self.accountId !== value.accountId ||
      self.personId !== value.personId ||
      self.browser.csrf !== value.browser.csrf ||
      JSON.stringify(self.grants) !== JSON.stringify(value.grants));
  // An unchanged refresh must not replace an actor while its intent is being encrypted,
  // or restore a stale ciphertext over a command that just reached a terminal outcome.
  if (self && !changed) return;
  if (changed) {
    lock('نشست یا مجوز تغییر کرده است.');
  }
  idleUntil = confirmedUntil;
  idleUntilMonotonic = confirmedMonotonic;
  self = value;
  if (checkLocalExpiry()) throw new Stale();
  armExpiry();
  const roles = [...permissions()];
  el('role').replaceChildren(
    ...roles.map((r) => {
      const o = node('option', r === 'ACT-PROC' ? 'خرید' : 'انبار');
      o.value = r;
      return o;
    }),
  );
  if (!roles.includes(role)) role = roles[0] ?? 'ACT-PROC';
  el<HTMLSelectElement>('role').value = role;
  el('identity').textContent =
    `${value.username} · ${roles.map((r) => (r === 'ACT-PROC' ? 'خرید' : 'انبار')).join(' / ') || 'بدون مجوز خرید و انبار'}`;
  show('login-panel', false);
  show('logout', true);
  show('workspace', false);
  if (!roles.length) {
    clearBusiness();
    message('این حساب مجوز خرید یا انبار ندارد. از مسئول دسترسی پیگیری کنید.', 'error');
    return;
  }
  try {
    await restorePending();
  } finally {
    show('workspace', !!self && permissions().size > 0);
  }
  if (!el('lines').children.length) addLine();
  updateControls();
}
function navigate(panel: string, userNavigation = false) {
  if (userNavigation) {
    orderRead++;
    receivingRead++;
    el<HTMLButtonElement>('more-receiving').disabled = false;
    el<HTMLButtonElement>('refresh-receiving').disabled = false;
    el<HTMLSelectElement>('receiving-view').disabled = false;
    if (el('receiving-status').textContent === 'در حال دریافت صفحه…')
      el('receiving-status').textContent =
        'نمایش صفحه کامل نشد؛ برای ادامه، دریافت‌ها را تازه‌سازی کنید.';
  }
  if (prepared !== undefined && panel !== 'register-panel') {
    prepared = undefined;
    show('order-confirm', false);
    updateControls();
  }
  for (const id of ['register-panel', 'lookup-panel', 'catalogue-panel']) show(id, id === panel);
  if (panel === 'register-panel' && role !== 'ACT-PROC') show(panel, false);
}
const fieldDefinitions = [
  ['itemNumber', 'شماره آیتم (اختیاری)', 'text'],
  ['materialTypeOptionId', 'نوع کالا', 'MATERIAL_TYPE'],
  ['widthM', 'عرض (متر)', 'decimal'],
  ['thicknessMm', 'ضخامت (میلی‌متر)', 'decimal'],
  ['colorOptionId', 'رنگ (اختیاری)', 'COLOR'],
  ['ralColorNumber', 'شماره رئال رنگ (اختیاری)', 'text'],
  ['lengthM', 'طول (متر، اختیاری)', 'decimal'],
  ['qualityGradeOptionId', 'کیفیت (اختیاری)', 'QUALITY_GRADE'],
  ['unitWeightKg', 'وزن هر واحد (کیلوگرم، W1)', 'integer'],
  ['orderedUnitCount', 'تعداد واحد سفارش', 'integer'],
] as const;
function refreshSelects() {
  document.querySelectorAll<HTMLSelectElement>('select[data-catalogue]').forEach((select) => {
    const selected = select.value;
    const kind = select.dataset.catalogue as Kind;
    const options = [...catalogues.get(kind)!.values()];
    select.replaceChildren(node('option', select.required ? 'انتخاب کنید' : 'ثبت نشده (اختیاری)'));
    select.options[0]!.value = '';
    for (const option of options) {
      const o = node('option', option.label);
      o.value = option.optionId;
      select.append(o);
    }
    select.value = selected;
  });
}
function addLine() {
  if (el('lines').children.length >= 128) {
    message('حداکثر ۱۲۸ خط در هر سفارش پذیرفته می‌شود.', 'error');
    return;
  }
  const fieldset = node('fieldset');
  const legend = node('legend');
  fieldset.append(legend);
  const grid = node('div');
  grid.className = 'grid';
  fieldset.append(grid);
  for (const [name, label, type] of fieldDefinitions) {
    const l = node('label', label);
    const control = kinds.includes(type as Kind) ? node('select') : node('input');
    control.name = name;
    control.required = ![
      'itemNumber',
      'colorOptionId',
      'ralColorNumber',
      'lengthM',
      'qualityGradeOptionId',
    ].includes(name);
    if (control instanceof HTMLSelectElement) control.dataset.catalogue = type;
    else {
      control.type = 'text';
      control.dir = type === 'text' ? 'auto' : 'ltr';
      control.maxLength = type === 'integer' ? 20 : type === 'decimal' ? 39 : 256;
      if (type !== 'text') {
        control.inputMode = type === 'integer' ? 'numeric' : 'decimal';
        control.pattern =
          type === 'integer' ? '[1-9][0-9]{0,19}' : '(0|[1-9][0-9]{0,19})(\\.[0-9]{1,18})?';
      }
    }
    l.append(control);
    grid.append(l);
  }
  const remove = node('button', 'حذف این خط پیش از ثبت');
  remove.type = 'button';
  remove.className = 'secondary';
  remove.addEventListener('click', () => {
    if (el('lines').children.length <= 1) {
      message('سفارش باید دست‌کم یک خط داشته باشد.', 'error');
      return;
    }
    fieldset.remove();
    numberLines();
  });
  fieldset.append(remove);
  el('lines').append(fieldset);
  numberLines();
  refreshSelects();
}
function numberLines() {
  [...el('lines').children].forEach((f, i) => {
    f.querySelector('legend')!.textContent = `خط ${i + 1}`;
  });
}
async function loadCatalogue(kind: Kind, more = false) {
  const page = await api<{ data: { items: Option[]; nextAfterId?: string } }>(
    '/purchasing/inbound-catalogues/query',
    {
      catalogue: kind,
      limit: 100,
      ...(more && catalogueCursors.get(kind) ? { afterId: catalogueCursors.get(kind) } : {}),
    },
  );
  for (const option of page.data.items) catalogues.get(kind)!.set(option.optionId, option);
  if (page.data.nextAfterId) catalogueCursors.set(kind, page.data.nextAfterId);
  else catalogueCursors.delete(kind);
  refreshSelects();
  renderCatalogues();
}
function renderCatalogues() {
  el('catalogue-options').replaceChildren();
  for (const kind of kinds) {
    const section = node('section');
    section.append(node('h3', kindNames[kind]));
    const label = node('label', 'گزینه‌های بارگذاری‌شده؛ انتخاب در خط سفارش انجام می‌شود');
    const select = node('select');
    select.dataset.catalogue = kind;
    select.setAttribute('aria-label', `گزینه‌های ${kindNames[kind]}`);
    label.append(select);
    section.append(label);
    if (!catalogues.get(kind)!.size) section.append(node('p', 'گزینه‌ای در این صفحه موجود نیست.'));
    if (catalogueCursors.has(kind)) {
      const button = node('button', `صفحهٔ بعد ${kindNames[kind]}`);
      button.type = 'button';
      button.addEventListener(
        'click',
        action(async () => {
          button.disabled = true;
          try {
            await loadCatalogue(kind, true);
          } finally {
            button.disabled = false;
          }
        }),
      );
      section.append(button);
    }
    el('catalogue-options').append(section);
  }
  refreshSelects();
}
const labels: Record<string, string> = {
  orderId: 'شناسهٔ سفارش',
  orderReference: 'شماره سفارش',
  registrationDateJalali: 'تاریخ ثبت سفارش (جلالی)',
  lineId: 'شناسهٔ خط',
  position: 'ردیف اصلی',
  itemNumber: 'شماره آیتم',
  materialType: 'نوع کالا',
  widthM: 'عرض (متر)',
  thicknessMm: 'ضخامت (میلی‌متر)',
  color: 'رنگ',
  ralColorNumber: 'شماره رئال رنگ',
  lengthM: 'طول (متر)',
  qualityGrade: 'کیفیت',
  unitWeightKg: 'وزن هر واحد (کیلوگرم، W1)',
  orderedUnitCount: 'تعداد سفارش',
  acceptedUnitCount: 'تعداد دریافت‌شده',
  remainingUnitCount: 'تعداد مانده',
  excessUnitCount: 'تعداد مازاد',
  variance: 'اختلاف تعداد (دریافت منهای سفارش)',
  arrivalId: 'شناسهٔ ورود محموله',
  arrivalDateJalali: 'تاریخ ورود (جلالی)',
  originNetKg: 'وزن خالص گزارش مبدأ؛ کل محموله (کیلوگرم، W2)',
  destinationNetKg: 'وزن خالص باسکول مقصد؛ کل محموله (کیلوگرم، W3)',
  weightSourceWaybillId: 'شناسهٔ بارنامهٔ مرجع وزن محموله',
  truckNumber: 'شماره کامیون',
  originatingCompany: 'شرکت ارسال کننده (مبدا)',
  driverName: 'نام راننده',
  recordedAt: 'زمان ثبت سرور',
  receivingActor: 'ثبت‌کنندهٔ دریافت',
  issuer: 'مرجع هویت',
  subject: 'شناسهٔ شخص',
  role: 'نقش',
  receivedUnitId: 'شناسهٔ واحد دریافت‌شده',
  internalSystemCode: 'شماره سیستم',
  productNumber: 'شماره محصول',
  association: 'ارتباط با سفارش',
  kind: 'نوع ارتباط',
  actual: 'مشخصات واقعی دریافت',
  original: 'مشخصات اصل سفارش',
  comparison: 'مقایسه و مغایرت',
  acceptance: 'پذیرش صریح انبار',
  confirmed: 'تأیید دریافت',
  changedW1: 'پذیرش وزن متفاوت',
  specificationMismatch: 'پذیرش مغایرت مشخصات',
  excess: 'پذیرش مازاد',
  unordered: 'پذیرش کالای سفارش‌داده‌نشده',
  locationId: 'شناسهٔ محل',
  weightEvidenceReference: 'مرجع شاهد وزن',
  waybill: 'بارنامه',
  waybillId: 'شناسهٔ بارنامه',
  reference: 'شماره سند',
  yellowCopyReference: 'شماره بارنامه حواله (برگ زرد)',
  warehouseReceipt: 'رسید انبار',
  receiptId: 'شناسهٔ رسید انبار',
  inventory: 'شناسه‌های ثبت موجودی',
  unitId: 'شناسهٔ موجودی واحد',
  lotId: 'شناسهٔ محمولهٔ موجودی',
  materialId: 'شناسهٔ مواد',
  effectId: 'شناسهٔ اثر موجودی',
  optionId: 'شناسهٔ گزینه',
  label: 'عنوان',
  differences: 'تفاوت‌ها',
  ordered: 'سفارش',
  received: 'دریافت',
  status: 'وضعیت',
  state: 'وضعیت مقایسه',
  weightProvenance: 'منشأ وزن',
  calendar: 'تقویم',
  calendarProfile: 'مبنای تقویم',
};
function details(
  data: Record<string, unknown>,
  exclude: string[] = [],
  actual = false,
): HTMLElement {
  const dl = node('dl');
  for (const [name, value] of Object.entries(data)) {
    if (exclude.includes(name)) continue;
    dl.append(node('dt', labels[name] ?? name));
    const dd = node('dd');
    if (value && typeof value === 'object' && !Array.isArray(value))
      dd.append(details(value as Record<string, unknown>, [], name === 'actual'));
    else if (Array.isArray(value)) dd.textContent = value.map((v) => textValue(v, name)).join('، ');
    else {
      dd.textContent = textValue(value, name, actual || name === 'actual');
      dd.dir = 'auto';
    }
    dl.append(dd);
  }
  return dl;
}
function table(rows: Record<string, unknown>[], columns: string[]) {
  const wrap = node('div');
  wrap.className = 'scroll';
  wrap.tabIndex = 0;
  wrap.setAttribute('aria-label', 'جدول؛ برای دیدن تمام ستون‌ها پیمایش کنید');
  const t = node('table');
  const head = node('tr');
  for (const c of columns) {
    const th = node('th', labels[c] ?? c);
    th.scope = 'col';
    head.append(th);
  }
  const thead = node('thead');
  thead.append(head);
  t.append(thead);
  const body = node('tbody');
  for (const row of rows) {
    const tr = node('tr');
    for (const c of columns) {
      const td = node('td', textValue(row[c], c));
      td.dir = 'auto';
      if (
        ['widthM', 'thicknessMm', 'lengthM', 'unitWeightKg', 'orderedUnitCount', 'lineId'].includes(
          c,
        )
      )
        td.className = 'exact';
      tr.append(td);
    }
    body.append(tr);
  }
  t.append(body);
  wrap.append(t);
  return wrap;
}
const originalColumns = [
  'position',
  'lineId',
  'itemNumber',
  'materialType',
  'widthM',
  'thicknessMm',
  'color',
  'ralColorNumber',
  'lengthM',
  'qualityGrade',
  'unitWeightKg',
  'orderedUnitCount',
];
async function readOrder(path: string, body?: object) {
  message('در حال بازیابی اصل ثبت‌شده…');
  clearBusiness();
  const read = orderRead;
  const result = await api<{ data: Order }>(path, body);
  if (read !== orderRead) throw new Stale();
  currentOrder = result.data;
  const root = el('order-result');
  root.append(
    node('h3', 'اصل ثبت‌شدهٔ سفارش (فقط خواندنی)'),
    details({
      orderId: result.data.orderId,
      orderReference: result.data.orderReference,
      registrationDateJalali: result.data.registrationDateJalali,
    }),
    table(result.data.lines, originalColumns),
  );
  show('receiving', true);
  navigate('lookup-panel');
  message('اصل سفارش از سرور بازیابی شد.', 'success');
  await loadReceiving(false);
}
async function loadReceiving(more: boolean) {
  if (!currentOrder) return;
  const read = ++receivingRead;
  const button = el<HTMLButtonElement>('more-receiving');
  const refresh = el<HTMLButtonElement>('refresh-receiving');
  button.disabled = true;
  refresh.disabled = true;
  el<HTMLSelectElement>('receiving-view').disabled = true;
  if (!more) {
    receivingCursor = undefined;
    receivingCount = 0;
    receivingPage = 0;
    arrivals.clear();
    el('receiving-result').replaceChildren();
  }
  el('receiving-status').textContent = 'در حال دریافت صفحه…';
  try {
    const view = input('receiving-view');
    const page = await api<{ data: Page }>('/purchasing/receiving/orders/query', {
      orderId: currentOrder.orderId,
      view,
      limit: 20,
      ...(more && receivingCursor ? { afterId: receivingCursor } : {}),
    });
    if (read !== receivingRead) throw new Stale();
    const section = node('section');
    receivingPage++;
    section.append(
      node(
        'h4',
        `${view === 'LINES' ? 'خطوط و ماندهٔ سفارش' : 'واحدهای دریافت‌شده و مغایرت‌ها'} · صفحهٔ ${receivingPage} · زمان این صفحه: ${page.data.snapshotAt ?? 'از سرور ارائه نشده است'}`,
      ),
    );
    if (view === 'LINES')
      section.append(
        table(page.data.items, [
          ...originalColumns,
          'acceptedUnitCount',
          'remainingUnitCount',
          'excessUnitCount',
          'variance',
        ]),
      );
    else
      for (const row of page.data.items) {
        const header = row.arrival as Record<string, unknown>;
        if (!arrivals.has(String(header.arrivalId))) {
          arrivals.add(String(header.arrivalId));
          const arrival = node('details');
          arrival.append(
            node('summary', `اطلاعات مشترک کل محموله · ${textValue(header.arrivalDateJalali)}`),
            details(header),
          );
          section.append(arrival);
        }
        const unit = node('details');
        unit.append(
          node(
            'summary',
            `شماره سیستم: ${textValue(row.internalSystemCode)} · شماره محصول: ${textValue(row.productNumber)}`,
          ),
          details(row, ['arrival']),
        );
        section.append(unit);
      }
    el('receiving-result').append(section);
    receivingCount += page.data.items.length;
    receivingCursor = page.data.nextAfterId;
    show('more-receiving', !!receivingCursor);
    el('receiving-status').textContent = receivingCount
      ? `${receivingCount} مورد نمایش داده شد. ${receivingCursor ? 'صفحهٔ بعد موجود است.' : 'پایان نتایج.'} هر صفحه وضعیت زمان بازیابی خود را دارد.`
      : 'دریافتی برای این سفارش ثبت نشده است.';
  } catch (error) {
    if (read === receivingRead)
      el('receiving-status').textContent =
        'دریافت صفحه کامل نشد. برای ادامه دوباره همین صفحه را بگیرید.';
    throw error;
  } finally {
    if (read === receivingRead) {
      button.disabled = false;
      refresh.disabled = false;
      el<HTMLSelectElement>('receiving-view').disabled = false;
    }
  }
}
async function dispatchPending() {
  const intent = pending,
    actor = self;
  if (
    !intent ||
    !actor ||
    intent.accountId !== actor.accountId ||
    intent.personId !== actor.personId ||
    !permissions().has(intent.role)
  )
    return;
  const generation = epoch;
  busy = true;
  updateControls();
  message('در حال ثبت یا پیگیری همان درخواست…');
  try {
    const result = await api<Outcome>(intent.path, intent.body, intent.role);
    if (result.status !== 'completed' || result.result?.outcome !== 'accepted')
      throw new ApiError(503);
    const command = JSON.parse(intent.body) as {
      target: { id: string };
      payload: { catalogue: Kind; label: string };
    };
    if (intent.path === '/purchasing/operational-orders') {
      await readOrder('/purchasing/operational-orders/' + command.target.id);
      el<HTMLFormElement>('order-form').reset();
      el('lines').replaceChildren();
      addLine();
    } else {
      // Canonical exact-label lookup, not a local optimistic option or get-or-create.
      const options = await api<{ data: { items: Option[] } }>(
        '/purchasing/inbound-catalogues/query',
        { catalogue: command.payload.catalogue, exactLabel: command.payload.label },
        intent.role,
      );
      for (const option of options.data.items)
        catalogues.get(option.catalogue)!.set(option.optionId, option);
      refreshSelects();
      renderCatalogues();
      message('گزینه مستقل از سفارش ثبت و از سرور بازیابی شد.', 'success');
    }
    sessionStorage.removeItem(pendingSlot);
    pending = undefined;
    lockedPending = false;
  } catch (error) {
    if (error instanceof ApiError && [400, 422].includes(error.status)) {
      const command = JSON.parse(intent.body) as { payload: { catalogue: Kind; label: string } };
      if (
        intent.path === '/purchasing/inbound-catalogues' &&
        error.status === 422 &&
        error.outcome?.result?.family === 'GUARD_IDEMPOTENT_DUP'
      ) {
        const selected = await api<{ data: { items: Option[] } }>(
          '/purchasing/inbound-catalogues/query',
          { catalogue: command.payload.catalogue, exactLabel: command.payload.label },
          intent.role,
        );
        for (const option of selected.data.items)
          catalogues.get(option.catalogue)!.set(option.optionId, option);
        refreshSelects();
        renderCatalogues();
        message('عنوان دقیق قبلاً ثبت شده است؛ گزینهٔ موجود برای انتخاب بارگذاری شد.', 'success');
      } else message(errorText(error), 'error');
      sessionStorage.removeItem(pendingSlot);
      pending = undefined;
    } else throw error;
  } finally {
    if (generation === epoch) {
      busy = false;
      updateControls();
    }
  }
}
async function startCommand(path: string, body: string) {
  if (busy || pending || lockedPending || !self?.browser.recoveryKey) return;
  const actor = self,
    generation = epoch;
  busy = true;
  updateControls();
  try {
    const intent: Intent = Object.freeze({
      accountId: actor.accountId,
      personId: actor.personId,
      role,
      path,
      body,
    });
    const encrypted = await sealIntent(intent, actor.browser.recoveryKey!);
    if (generation !== epoch || self !== actor) throw new Stale();
    // Storage denial/quota failure must prevent the very first dispatch.
    sessionStorage.setItem(pendingSlot, encrypted);
    pending = intent;
  } catch (error) {
    if (generation === epoch) {
      busy = false;
      updateControls();
    }
    if (error instanceof Stale) throw error;
    throw new RecoveryStorageError();
  }
  await dispatchPending();
}
on('login-form', 'submit', async () => {
  if (loggingOut) return;
  const button = el<HTMLFormElement>('login-form').querySelector('button')!;
  button.disabled = true;
  message('در حال ورود…');
  try {
    await api('/identity/login', { username: input('username'), password: input('password') });
    sessionChanges.postMessage('changed');
    el<HTMLInputElement>('password').value = '';
    epoch++;
    message('');
    await session();
    if (permissions().size) await Promise.all(kinds.map((k) => loadCatalogue(k)));
  } finally {
    el<HTMLInputElement>('password').value = '';
    button.disabled = false;
  }
});
on('logout', 'click', async () => {
  loggingOut = true;
  const csrf = self?.browser.csrf;
  lock('در حال خروج؛ اطلاعات این صفحه پاک شد…');
  sessionChanges.postMessage('changed');
  el<HTMLFieldSetElement>('login-fields').disabled = true;
  const generation = epoch;
  const controller = new AbortController();
  logoutController = controller;
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch('/ui-api/identity/logout', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'x-erp-browser': '1',
        'x-erp-csrf': csrf ?? '',
        'content-type': 'application/json',
      },
      body: '{}',
    });
    if (generation !== epoch) return;
    if (response.ok || response.status === 401)
      message('خروج انجام شد. پیگیری رمز‌شدهٔ حل‌نشده فقط برای همان حساب باقی می‌ماند.', 'success');
    else throw new ApiError(response.status);
  } catch {
    if (generation === epoch)
      message(
        'خروج سرور تأیید نشد. پیش از ترک رایانه دوباره وارد شوید و خروج امن را تکرار کنید.',
        'error',
      );
  } finally {
    clearTimeout(timer);
    loggingOut = false;
    logoutController = undefined;
    el<HTMLFieldSetElement>('login-fields').disabled = false;
  }
});
for (const [id, panel] of [
  ['show-register', 'register-panel'],
  ['show-lookup', 'lookup-panel'],
  ['show-catalogues', 'catalogue-panel'],
] as const)
  el(id).addEventListener('click', () => navigate(panel, true));
el('role').addEventListener('change', () => {
  epoch++;
  role = input('role') as Role;
  clearBusiness();
  navigate('lookup-panel');
  updateControls();
});
el('add-line').addEventListener('click', addLine);
on('refresh-catalogues', 'click', async () => {
  const b = el<HTMLButtonElement>('refresh-catalogues');
  b.disabled = true;
  try {
    await Promise.all(kinds.map((k) => loadCatalogue(k)));
    message('گزینه‌ها تازه شدند.');
  } finally {
    b.disabled = false;
  }
});
on('catalogue-form', 'submit', async () => {
  await startCommand(
    '/purchasing/inbound-catalogues',
    commandBody('AddInboundCatalogueOption', 'inbound-catalogue-option', {
      catalogue: input('catalogue-kind'),
      label: input('catalogue-label'),
    }),
  );
});
on('order-form', 'submit', async () => {
  if (busy || pending || lockedPending || role !== 'ACT-PROC') return;
  prepared = {
    orderReference: input('order-reference'),
    registrationDateJalali: input('order-date'),
    lines: [...el('lines').children].map((line) =>
      linePayload(
        Object.fromEntries(
          [...line.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input,select')].map(
            (c) => [c.name, c.value],
          ),
        ),
      ),
    ),
  };
  el<HTMLFieldSetElement>('order-fields').disabled = true;
  show('order-confirm', true);
  el('confirm-order').focus();
  await Promise.resolve();
});
on('confirm-order', 'click', async () => {
  if (prepared === undefined) return;
  const payload = prepared;
  prepared = undefined;
  show('order-confirm', false);
  await startCommand(
    '/purchasing/operational-orders',
    commandBody('RegisterOperationalPurchaseOrder', 'operational-purchase-order', payload),
  );
});
el('cancel-order').addEventListener('click', () => {
  prepared = undefined;
  show('order-confirm', false);
  updateControls();
});
on('recover', 'click', dispatchPending);
el('discard').addEventListener('click', () => show('discard-confirm', true));
el('cancel-discard').addEventListener('click', () => show('discard-confirm', false));
el('confirm-discard').addEventListener('click', () => {
  if (busy) return;
  sessionStorage.removeItem(pendingSlot);
  pending = undefined;
  lockedPending = false;
  show('discard-confirm', false);
  updateControls();
  message('پیگیری بسته شد؛ این کار هیچ سفارش ثبت‌شده‌ای را لغو نمی‌کند.');
});
on('lookup-form', 'submit', async () => {
  const value = input('lookup-value');
  if (input('lookup-kind') === 'id') {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(value)) {
      message('شناسه باید UUID معتبر با رقم لاتین باشد.', 'error');
      return;
    }
    await readOrder('/purchasing/operational-orders/' + value);
  } else await readOrder('/purchasing/operational-orders/lookup', { orderReference: value });
});
on('refresh-receiving', 'click', () => loadReceiving(false));
on('more-receiving', 'click', () => loadReceiving(true));
on('receiving-view', 'change', () => loadReceiving(false));
// Revalidate on workstation focus/back navigation. A rotated cookie cannot authorize stale intent.
let checking = false;
async function revalidate() {
  if (checkLocalExpiry()) return;
  if (!self || busy || checking) return;
  checking = true;
  try {
    await session();
  } finally {
    checking = false;
  }
}
window.addEventListener('focus', action(revalidate));
window.addEventListener('pageshow', action(revalidate));
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') action(revalidate)();
});
window.addEventListener('pagehide', () => {
  logoutController?.abort();
  lock('برای ادامه وارد شوید.');
});
// Capture before navigation/form handlers, including resumed tabs whose timers were
// throttled. Visibility/focus revalidation also checks expiry synchronously first.
for (const event of ['pointerdown', 'keydown', 'click', 'submit', 'change'])
  document.addEventListener(
    event,
    (e) => {
      if (checkLocalExpiry()) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
async function bootstrap() {
  const retry = el<HTMLButtonElement>('retry-session');
  retry.disabled = true;
  try {
    await session();
    if (permissions().size) await Promise.all(kinds.map((k) => loadCatalogue(k)));
    show('retry-session', false);
  } catch (e) {
    if (!(e instanceof Stale)) {
      show('retry-session', true);
      throw e;
    }
  } finally {
    retry.disabled = false;
  }
}
on('retry-session', 'click', bootstrap);
action(bootstrap)();
