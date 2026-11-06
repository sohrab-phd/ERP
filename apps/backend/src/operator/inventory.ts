type Origin = 'LEGACY_RECEIPT' | 'I2_RECEIVING' | 'PRODUCTION';
type State =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'PACKED'
  | 'ISSUED_TO_PRODUCTION'
  | 'PARTIALLY_CONSUMED'
  | 'CONSUMED'
  | 'SHIPPED';
interface UnitSummary {
  unitId: string;
  lotId: string;
  kind: string;
  locationId: string;
  state: State;
  stockClass: 'CURRENT' | 'HISTORICAL';
  origin: Origin;
  internalCode: string | null;
  productCode: string | null;
  productNumber: string | null;
  materialId: string | null;
  quantities: { onHandKg: string; reservedKg: string; unreservedKg: string };
}
interface UnitDetail extends UnitSummary {
  source: Record<string, string>;
}
interface Freshness {
  observedAt: string;
  respondedAt: string;
  consistency: 'PAGE_SNAPSHOT';
  quantityBasis: 'LEDGER_VERIFIED_BALANCE';
}
interface Page {
  items: UnitSummary[];
  nextCursor: string | null;
  freshness: Freshness;
}
interface Dependencies {
  root: HTMLElement;
  api<T>(path: string, body: object, signal: AbortSignal): Promise<T>;
  canUse(): boolean;
  location?: { id: string; label: string };
}
export const inventoryStates: Readonly<Record<State, string>> = {
  AVAILABLE: 'آزاد',
  RESERVED: 'رزروشده',
  PACKED: 'بسته‌بندی‌شده',
  ISSUED_TO_PRODUCTION: 'تحویل تولید',
  PARTIALLY_CONSUMED: 'بخشی مصرف‌شده',
  CONSUMED: 'مصرف‌شده',
  SHIPPED: 'ارسال‌شده',
};
const origins: Record<Origin, string> = {
  LEGACY_RECEIPT: 'رسید قدیمی',
  I2_RECEIVING: 'دریافت انبار',
  PRODUCTION: 'تولید',
};
const filterNames = {
  internalCode: 'کد داخلی',
  kind: 'نوع ثبت‌شده',
  state: 'وضعیت',
  origin: 'منشأ',
  locationId: 'شناسه محل',
  unitId: 'شناسه واحد',
  lotId: 'شناسه لات',
  materialId: 'شناسه ماده',
} as const;
type Filter = keyof typeof filterNames;
type Filters = Partial<Record<Filter, string>>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const currentStates = Object.keys(inventoryStates).slice(0, 5) as State[];
const digits: Record<string, string> = {
  '0': '۰',
  '1': '۱',
  '2': '۲',
  '3': '۳',
  '4': '۴',
  '5': '۵',
  '6': '۶',
  '7': '۷',
  '8': '۸',
  '9': '۹',
};
const persianDigits = (value: string) => value.replace(/[0-9]/gu, (digit) => digits[digit]!);

/** Exact strings only: no numeric conversion, rounding or invented precision. */
export function formatInventoryKg(value: string): string {
  if (
    typeof value !== 'string' ||
    !/^(?:0|[1-9][0-9]{0,19})(?:\.[0-9]{0,17}[1-9])?$/u.test(value) ||
    value.endsWith('\n')
  )
    throw new Error('Invalid exact Inventory quantity');
  const [whole, fraction] = value.split('.');
  const grouped = whole!.replace(/\B(?=(?:[0-9]{3})+(?![0-9]))/gu, '٬');
  return persianDigits(grouped + (fraction === undefined ? '' : '٫' + fraction));
}

/** Exact-code equality is preserved; validation must never normalize business text. */
export function inventoryFilterError(key: Filter, value: string): string | undefined {
  if (value === '') return undefined;
  if (key.endsWith('Id'))
    return uuid.test(value) ? undefined : 'شناسه باید UUID معتبر با رقم لاتین و حروف کوچک باشد.';
  if (key === 'state')
    return currentStates.includes(value as State) ? undefined : 'وضعیت انتخاب‌شده معتبر نیست.';
  if (key === 'origin')
    return Object.hasOwn(origins, value) ? undefined : 'منشأ انتخاب‌شده معتبر نیست.';
  if (/\p{Cc}|[\ud800-\udfff]/u.test(value)) return 'نویسهٔ کنترلی یا نامعتبر مجاز نیست.';
  if (key === 'internalCode') {
    if (!value.trim()) return 'کد داخلی نمی‌تواند فقط فاصله باشد.';
    if ([...value].length > 128 || new TextEncoder().encode(value).length > 512)
      return 'کد داخلی حداکثر ۱۲۸ نویسه و ۵۱۲ بایت است.';
  } else if (new TextEncoder().encode(value).length > 128)
    return 'نوع ثبت‌شده حداکثر ۱۲۸ بایت است.';
  return undefined;
}

const make = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  return element;
};
function isolated(value: string, direction = 'auto') {
  const valueNode = make('bdi', value);
  valueNode.dir = direction;
  valueNode.className = 'inventory-exact';
  return valueNode;
}
function button(text: string, work: () => void, id?: string) {
  const control = make('button', text);
  control.type = 'button';
  if (id) control.id = id;
  control.addEventListener('click', work);
  return control;
}

/** Read-only view ownership is separate from the shell's session epoch and write recovery. */
export function createInventory(deps: Dependencies) {
  let generation = 0;
  let controller: AbortController | undefined;
  let active = false;
  let view: 'list' | 'detail' | 'lot' = 'list';
  let draft: Filters = {};
  let applied: Filters = {};
  let limit = 25;
  let pageIndex = 0;
  let cursors: (string | undefined)[] = [undefined];
  let nextCursor: string | null = null;
  let unitId = '';
  let detailReturn: 'list' | 'lot' = 'list';
  let lotId = '';
  let lotPageIndex = 0;
  let lotCursors: (string | undefined)[] = [undefined];
  let lotReturnUnit = '';
  let lotReturnFrom: 'list' | 'lot' = 'list';
  let status: HTMLElement | undefined;
  let result: HTMLElement | undefined;
  let controls: HTMLButtonElement[] = [];
  let lastFailed: (() => void) | undefined;
  const owns = (value: number) => active && generation === value && deps.canUse();

  function invalidate() {
    generation++;
    controller?.abort();
    controller = undefined;
  }
  function focus(target: HTMLElement) {
    target.focus();
  }
  function heading(text: string) {
    const title = make('h2', text);
    title.id = 'inventory-title';
    title.tabIndex = -1;
    return title;
  }
  function frame(title: string, back?: () => void) {
    invalidate();
    controls = [];
    lastFailed = undefined;
    const h = heading(title);
    const actions = make('div');
    actions.className = 'actions inventory-toolbar';
    if (back) actions.append(button('بازگشت', back, 'inventory-back'));
    const refresh = button(
      'تازه‌سازی',
      () => {
        if (view === 'list') {
          pageIndex = 0;
          cursors = [undefined];
          void loadList();
        } else if (view === 'lot') {
          lotPageIndex = 0;
          lotCursors = [undefined];
          void loadLot();
        } else void loadDetail();
      },
      'inventory-refresh',
    );
    controls.push(refresh);
    actions.append(refresh);
    status = make('p');
    status.id = 'inventory-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    result = make('div');
    result.id = 'inventory-result';
    deps.root.replaceChildren(h, actions, status, result);
    focus(h);
    return h;
  }
  function loading() {
    if (status) status.textContent = 'در حال دریافت اطلاعات…';
    deps.root.setAttribute('aria-busy', 'true');
    for (const control of controls) control.disabled = true;
  }
  function fresh(value: Freshness) {
    if (!result) return;
    const container = make('div');
    container.className = 'inventory-observation';
    const at = new Date(value.observedAt);
    if (!Number.isFinite(at.getTime())) throw new Error('Invalid observation');
    container.append(
      make(
        'p',
        'زمان مشاهده این صفحه: ' +
          new Intl.DateTimeFormat('fa-IR', {
            dateStyle: 'medium',
            timeStyle: 'medium',
          }).format(at),
      ),
      make('p', 'ممکن است موجودی پس از این زمان تغییر کرده باشد. هر صفحه مشاهدهٔ مستقل دارد.'),
      make('p', 'رزرو نشده به معنی مجوز فروش، ارسال یا مصرف نیست.'),
    );
    result.append(container);
  }
  function failure(error: unknown, retry: () => void) {
    if (!status || !result) return;
    const e = error as { status?: number; outcome?: { error?: string } };
    status.setAttribute('role', 'alert');
    status.className = 'inventory-error';
    status.textContent =
      e.status === 404
        ? 'این مورد در دسترس نیست.'
        : e.status === 400 && e.outcome?.error === 'invalid-cursor'
          ? 'اعتبار صفحه پایان یافته است؛ جست‌وجو را از ابتدا اجرا کنید.'
          : e.status === 400
            ? 'فیلتر معتبر نیست؛ قالب و طول مقادیر را بررسی کنید.'
            : e.status === 422
              ? 'خواندن از حد مجاز عبور کرد. برای فهرست، فیلتر دقیق‌تری انتخاب کنید. اگر یک واحد از حد سابقه عبور کرده باشد، فیلتر این مشکل را حل نمی‌کند؛ با پشتیبانی پیگیری کنید.'
              : 'اطلاعات تازه دریافت نشد. ارتباط را بررسی کنید و دوباره تلاش کنید.';
    lastFailed = retry;
    result.replaceChildren();
    const restart = button(
      e.status === 400 && e.outcome?.error === 'invalid-cursor'
        ? 'شروع از صفحهٔ اول'
        : 'تلاش دوباره',
      () => {
        if (e.outcome?.error === 'invalid-cursor') {
          pageIndex = lotPageIndex = 0;
          cursors = lotCursors = [undefined];
        }
        lastFailed?.();
      },
      'inventory-retry',
    );
    result.append(restart);
  }
  async function request<T>(
    path: string,
    body: object,
    complete: (data: T) => void,
    retry: () => void,
    focusTarget?: () => HTMLElement | undefined,
  ) {
    const owner = generation;
    controller = new AbortController();
    loading();
    try {
      const response = await deps.api<{ data: T }>(path, body, controller.signal);
      if (!owns(owner)) return;
      complete(response.data);
      if (!owns(owner)) return;
      if (status && !status.textContent) status.textContent = 'اطلاعات این صفحه دریافت شد.';
      const target = focusTarget?.();
      if (target) focus(target);
    } catch (error) {
      if (owns(owner)) failure(error, retry);
    } finally {
      if (owns(owner)) {
        deps.root.setAttribute('aria-busy', 'false');
        for (const control of controls) control.disabled = false;
      }
    }
  }
  function location(id: string) {
    return deps.location?.id === id ? deps.location.label : id;
  }
  function cell(row: HTMLTableRowElement, label: string, value: HTMLElement | string) {
    const td = make('td');
    td.dataset.label = label;
    if (typeof value === 'string') td.textContent = value;
    else td.append(value);
    row.append(td);
  }
  function rowIdentifiers(unit: UnitSummary) {
    const extra = make('details');
    extra.append(make('summary', 'شناسه‌ها و مشخصات ثبت‌شده'));
    const fields = make('dl');
    detailField(fields, 'شناسه واحد', unit.unitId, true);
    detailField(fields, 'شناسه لات', unit.lotId, true);
    detailField(fields, 'شناسه ماده', unit.materialId, true);
    detailField(fields, 'کد محصول (رسید قدیمی)', unit.productCode);
    detailField(fields, 'شماره محصول (دریافت انبار)', unit.productNumber);
    extra.append(fields);
    return extra;
  }
  function table(items: UnitSummary[], from: 'list' | 'lot') {
    if (!result) return;
    if (!items.length) {
      result.append(make('p', 'مورد قابل مشاهده‌ای با این فیلترها پیدا نشد.'));
      return;
    }
    const tableNode = make('table');
    tableNode.className = 'inventory-table';
    tableNode.append(
      make('caption', from === 'list' ? 'واحدهای موجودی فعلی این صفحه' : 'واحدهای مرتبط با لات'),
    );
    const head = make('thead'),
      header = make('tr'),
      body = make('tbody');
    for (const label of [
      'کد داخلی',
      'نوع ثبت‌شده',
      'وضعیت',
      'محل',
      'موجودی (کیلوگرم)',
      'رزروشده (کیلوگرم)',
      'رزرو نشده (کیلوگرم)',
      'منشأ',
      'مشاهده',
    ]) {
      const th = make('th', label);
      th.scope = 'col';
      header.append(th);
    }
    head.append(header);
    for (const unit of items) {
      const row = make('tr');
      cell(row, 'کد داخلی', unit.internalCode === null ? 'ثبت نشده' : isolated(unit.internalCode));
      cell(row, 'نوع ثبت‌شده', isolated(unit.kind));
      const state = make('span', inventoryStates[unit.state]);
      state.className = 'inventory-state';
      state.dataset.stockClass = unit.stockClass;
      if (unit.stockClass === 'HISTORICAL')
        state.append(make('span', ' · سابقه؛ بدون موجودی جاری'));
      cell(row, 'وضعیت', state);
      cell(
        row,
        'محل',
        isolated(location(unit.locationId), deps.location?.id === unit.locationId ? 'auto' : 'ltr'),
      );
      cell(row, 'موجودی (کیلوگرم)', isolated(formatInventoryKg(unit.quantities.onHandKg), 'ltr'));
      cell(
        row,
        'رزروشده (کیلوگرم)',
        isolated(formatInventoryKg(unit.quantities.reservedKg), 'ltr'),
      );
      cell(
        row,
        'رزرو نشده (کیلوگرم)',
        isolated(formatInventoryKg(unit.quantities.unreservedKg), 'ltr'),
      );
      cell(row, 'منشأ', origins[unit.origin]);
      const actions = make('div');
      const inspect = button(
        'جزئیات واحد',
        () => openUnit(unit.unitId, from),
        'inventory-unit-' + unit.unitId,
      );
      inspect.setAttribute('aria-label', 'جزئیات واحد ' + (unit.internalCode ?? unit.unitId));
      actions.append(inspect, rowIdentifiers(unit));
      cell(row, 'مشاهده', actions);
      body.append(row);
    }
    tableNode.append(head, body);
    result.append(tableNode);
  }
  function paging(isLot: boolean) {
    if (!result) return;
    const navigation = make('nav');
    navigation.setAttribute('aria-label', 'صفحه‌بندی موجودی');
    const index = isLot ? lotPageIndex : pageIndex;
    const previous = button(
      'قبلی',
      () => {
        if (isLot) {
          lotPageIndex--;
          void loadLot();
        } else {
          pageIndex--;
          void loadList();
        }
      },
      'inventory-previous',
    );
    previous.hidden = index === 0;
    const next = button(
      'بعدی',
      () => {
        if (!nextCursor) return;
        if (isLot) {
          lotCursors[++lotPageIndex] = nextCursor;
          void loadLot();
        } else {
          cursors[++pageIndex] = nextCursor;
          void loadList();
        }
      },
      'inventory-next',
    );
    next.hidden = nextCursor === null;
    controls.push(previous, next);
    navigation.append(previous, make('span', 'صفحهٔ ' + persianDigits(String(index + 1))), next);
    result.append(navigation);
  }
  function filters() {
    const form = make('form');
    form.id = 'inventory-filters';
    form.noValidate = true;
    const fields = make('fieldset');
    fields.append(make('legend', 'جست‌وجو و فیلتر دقیق موجودی'));
    const grid = make('div');
    grid.className = 'grid inventory-filter-grid';
    const advanced = make('details');
    advanced.append(make('summary', 'شناسه‌های پیشرفته (اختیاری)'));
    const advancedGrid = make('div');
    advancedGrid.className = 'grid';
    advanced.append(advancedGrid);
    const fieldControls = new Map<Filter, HTMLInputElement | HTMLSelectElement>();
    const fieldErrors = new Map<Filter, HTMLElement>();
    for (const key of Object.keys(filterNames) as Filter[]) {
      const wrapper = make('div'),
        label = make('label', filterNames[key]);
      const control = key === 'state' || key === 'origin' ? make('select') : make('input');
      control.id = 'inventory-filter-' + key;
      control.name = key;
      control.dir = key.endsWith('Id') ? 'ltr' : 'auto';
      if (control instanceof HTMLSelectElement) {
        const all = make('option', 'همه');
        all.value = '';
        control.append(all);
        const options: Record<string, string> =
          key === 'state'
            ? Object.fromEntries(currentStates.map((s) => [s, inventoryStates[s]]))
            : origins;
        for (const [value, text] of Object.entries(options)) {
          const option = make('option', text);
          option.value = value;
          control.append(option);
        }
      } else {
        control.maxLength = key.endsWith('Id') ? 36 : key === 'internalCode' ? 256 : 128;
        control.autocomplete = 'off';
      }
      control.value = draft[key] ?? '';
      const error = make('p');
      error.id = control.id + '-error';
      error.className = 'inventory-field-error';
      control.setAttribute('aria-describedby', error.id);
      control.addEventListener('input', () => {
        draft[key] = control.value;
        control.removeAttribute('aria-invalid');
        error.textContent = '';
        invalidate();
        if (result) result.replaceChildren();
        if (status) status.textContent = 'فیلترها تغییر کردند؛ جست‌وجو را اجرا کنید.';
        deps.root.setAttribute('aria-busy', 'false');
        for (const c of controls) c.disabled = false;
      });
      label.htmlFor = control.id;
      wrapper.append(label, control, error);
      (['unitId', 'lotId', 'materialId'].includes(key) ? advancedGrid : grid).append(wrapper);
      fieldControls.set(key, control);
      fieldErrors.set(key, error);
    }
    const help = make(
      'p',
      'کد و نوع عیناً مقایسه می‌شوند؛ فاصله، حروف و رقم‌ها تغییر نمی‌کنند. شناسه برای شروع لازم نیست.',
    );
    const summary = make('div');
    summary.id = 'inventory-filter-errors';
    summary.tabIndex = -1;
    summary.setAttribute('role', 'alert');
    const search = make('button', 'جست‌وجو');
    search.type = 'submit';
    search.id = 'inventory-search';
    const clear = button(
      'پاک‌کردن فیلترها',
      () => {
        draft = {};
        applied = {};
        pageIndex = 0;
        cursors = [undefined];
        void loadList();
      },
      'inventory-clear-filters',
    );
    clear.className = 'secondary';
    const sizeLabel = make('label', 'اندازه صفحه'),
      size = make('select');
    size.id = 'inventory-page-size';
    for (const value of [10, 25, 50]) {
      const option = make('option', persianDigits(String(value)));
      option.value = String(value);
      size.append(option);
    }
    size.value = String(limit);
    size.addEventListener('change', () => {
      limit = size.value === '10' ? 10 : size.value === '50' ? 50 : 25;
      applyDraft();
    });
    sizeLabel.append(size);
    const actions = make('div');
    actions.className = 'actions';
    actions.append(search, clear, sizeLabel);
    function applyDraft() {
      const errors: { key: Filter; text: string }[] = [];
      for (const [key, control] of fieldControls) {
        draft[key] = control.value;
        const text = inventoryFilterError(key, control.value);
        fieldErrors.get(key)!.textContent = text ?? '';
        if (text) {
          control.setAttribute('aria-invalid', 'true');
          errors.push({ key, text });
        } else control.removeAttribute('aria-invalid');
      }
      summary.replaceChildren();
      if (errors.length) {
        summary.append(make('p', 'فیلترها را اصلاح کنید:'));
        for (const error of errors) {
          const link = button(filterNames[error.key] + ': ' + error.text, () =>
            focus(fieldControls.get(error.key)!),
          );
          link.className = 'secondary';
          summary.append(link);
          if (['unitId', 'lotId', 'materialId'].includes(error.key)) advanced.open = true;
        }
        focus(errors.length === 1 ? fieldControls.get(errors[0]!.key)! : summary);
        return;
      }
      applied = Object.fromEntries(Object.entries(draft).filter(([, value]) => value !== ''));
      cursors = [undefined];
      pageIndex = 0;
      void loadList();
    }
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      applyDraft();
    });
    fields.append(grid, advanced, help, summary, actions);
    form.append(fields);
    deps.root.insertBefore(form, status!);
  }
  async function loadList(restoreUnit?: string) {
    if (!active || !deps.canUse()) return;
    // Refresh, paging and re-entry read the applied query. Restore its controls
    // before rendering so an unsubmitted draft cannot describe different rows.
    draft = { ...applied };
    view = 'list';
    const title = frame('موجودی فعلی');
    filters();
    const cursor = cursors[pageIndex];
    await request<Page>(
      '/inventory/v1/units/query',
      {
        filters: { ...applied },
        limit,
        ...(cursor ? { cursor } : {}),
      },
      (page) => {
        result!.replaceChildren();
        nextCursor = page.nextCursor;
        fresh(page.freshness);
        table(page.items, 'list');
        paging(false);
        status!.textContent = page.items.length
          ? 'اطلاعات این صفحه دریافت شد.'
          : 'مورد قابل مشاهده‌ای با این فیلترها پیدا نشد.';
      },
      () => void loadList(),
      () =>
        restoreUnit
          ? (deps.root.querySelector<HTMLElement>('#inventory-unit-' + restoreUnit) ?? title)
          : title,
    );
  }
  function detailField(list: HTMLElement, label: string, value: string | null, technical = false) {
    const dt = make('dt', label),
      dd = make('dd');
    if (value === null) dd.textContent = 'برای این منشأ موجود نیست';
    else dd.append(isolated(value, technical ? 'ltr' : 'auto'));
    list.append(dt, dd);
  }
  function openUnit(id: string, from: 'list' | 'lot') {
    unitId = id;
    detailReturn = from;
    void loadDetail();
  }
  async function loadDetail() {
    if (!active || !deps.canUse()) return;
    view = 'detail';
    const title = frame('جزئیات واحد', () => {
      if (detailReturn === 'lot') void loadLot(unitId);
      else void loadList(unitId);
    });
    await request<{ unit: UnitDetail; freshness: Freshness }>(
      '/inventory/v1/units/detail',
      { unitId },
      (data) => {
        const unit = data.unit;
        result!.replaceChildren();
        fresh(data.freshness);
        result!.append(make('h3', 'موجودی جاری و وضعیت واحد'));
        const list = make('dl');
        detailField(list, 'شناسه واحد', unit.unitId, true);
        detailField(list, 'کد داخلی', unit.internalCode);
        detailField(list, 'نوع ثبت‌شده', unit.kind);
        detailField(list, 'وضعیت', inventoryStates[unit.state]);
        detailField(
          list,
          'طبقه موجودی',
          unit.stockClass === 'HISTORICAL' ? 'سابقه؛ بدون موجودی جاری' : 'موجودی جاری',
        );
        detailField(list, 'محل', location(unit.locationId));
        detailField(list, 'موجودی (کیلوگرم)', formatInventoryKg(unit.quantities.onHandKg));
        detailField(list, 'رزروشده (کیلوگرم)', formatInventoryKg(unit.quantities.reservedKg));
        detailField(list, 'رزرو نشده (کیلوگرم)', formatInventoryKg(unit.quantities.unreservedKg));
        detailField(list, 'شناسه لات', unit.lotId, true);
        detailField(list, 'شناسه ماده', unit.materialId, true);
        detailField(list, 'کد محصول (رسید قدیمی)', unit.productCode);
        detailField(list, 'شماره محصول (دریافت انبار)', unit.productNumber);
        result!.append(
          list,
          button(
            'واحدهای مرتبط با لات',
            () => {
              lotId = unit.lotId;
              lotPageIndex = 0;
              lotCursors = [undefined];
              lotReturnUnit = unit.unitId;
              lotReturnFrom = detailReturn;
              void loadLot();
            },
            'inventory-open-lot',
          ),
          make('h3', 'منشأ و وزن اولیه؛ جدا از موجودی جاری'),
        );
        const source = make('dl');
        detailField(source, 'منشأ', origins[unit.origin]);
        detailField(source, 'وزن اولیه منبع (کیلوگرم)', formatInventoryKg(unit.source.initialKg!));
        if (unit.origin === 'LEGACY_RECEIPT') {
          detailField(
            source,
            'مبنای وزن اولیه',
            'وزن اندازه‌گیری‌شدهٔ کل واحد رسید؛ وزن هر قطعه نیست',
          );
          detailField(
            source,
            'تعداد اولیه ثبت‌شده (موجودی نیست)',
            formatInventoryKg(unit.source.recordedCount!),
          );
          detailField(source, 'شناسه رسید اولیه', unit.source.receiptId!, true);
        } else if (unit.origin === 'I2_RECEIVING') {
          detailField(
            source,
            'مبنای وزن اولیه',
            'وزن اعلام‌شدهٔ هر واحد، پذیرفته‌شده توسط انبار (W1)',
          );
          detailField(source, 'شناسه واحد دریافت', unit.source.receivedUnitId!, true);
          detailField(source, 'شناسه ورود', unit.source.arrivalId!, true);
          detailField(source, 'شناسه نوع کالای اولیه', unit.source.materialTypeOptionId!, true);
          detailField(source, 'پروفایل طبقه‌بندی اولیه', unit.source.classificationProfile!, true);
        } else {
          detailField(source, 'مبنای وزن اولیه', 'وزن خروجی ثبت‌شدهٔ تولید');
          detailField(source, 'شناسه بچ تولید', unit.source.productBatchId!, true);
          detailField(
            source,
            'طبقه اولیه خروجی تولید (وضعیت جاری نیست)',
            (
              {
                FINAL: 'خروجی نهایی',
                WIP: 'کار در جریان اولیه',
                RESIDUAL: 'باقیمانده قابل استفاده',
              } as Record<string, string>
            )[unit.source.disposition!]!,
          );
        }
        result!.append(source);
        status!.textContent = 'جزئیات واحد دریافت شد.';
      },
      () => void loadDetail(),
      () => title,
    );
  }
  async function loadLot(restoreUnit?: string) {
    if (!active || !deps.canUse()) return;
    view = 'lot';
    const title = frame('واحدهای مرتبط با لات', () => openUnit(lotReturnUnit, lotReturnFrom));
    const id = make('p', 'شناسه لات: ');
    id.append(isolated(lotId, 'ltr'));
    result!.append(id);
    const cursor = lotCursors[lotPageIndex];
    await request<Page>(
      '/inventory/v1/lots/units/query',
      {
        lotId,
        limit,
        ...(cursor ? { cursor } : {}),
      },
      (page) => {
        result!.replaceChildren(id);
        nextCursor = page.nextCursor;
        fresh(page.freshness);
        table(page.items, 'lot');
        paging(true);
        status!.textContent = 'واحدهای مرتبط با لات دریافت شدند؛ این نما مجموع وزن لات نیست.';
      },
      () => void loadLot(),
      () =>
        restoreUnit
          ? (deps.root.querySelector<HTMLElement>('#inventory-unit-' + restoreUnit) ?? title)
          : title,
    );
  }
  return {
    show() {
      if (!deps.canUse()) return;
      active = true;
      void loadList();
    },
    hide() {
      active = false;
      invalidate();
    },
    clear() {
      active = false;
      invalidate();
      draft = {};
      applied = {};
      limit = 25;
      pageIndex = lotPageIndex = 0;
      cursors = [undefined];
      lotCursors = [undefined];
      nextCursor = null;
      unitId = lotId = lotReturnUnit = '';
      detailReturn = lotReturnFrom = 'list';
      controls = [];
      status = result = undefined;
      lastFailed = undefined;
      deps.root.replaceChildren();
      deps.root.setAttribute('aria-busy', 'false');
    },
  };
}
