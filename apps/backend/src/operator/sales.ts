export const salesTypes = ['COIL', 'SHEET', 'ANGLE', 'BEAM', 'OTHER'] as const;
type SalesType = (typeof salesTypes)[number];
type State = 'DRAFT' | 'SUBMITTED' | 'CONFIRMED' | 'IN_PRODUCTION';
type Command =
  | 'DraftSalesOrder'
  | 'SubmitSalesOrder'
  | 'DraftFulfillmentAssessment'
  | 'RecordFulfillmentStock'
  | 'RecordFulfillmentMake'
  | 'ConfirmSalesOrder';
interface Customer {
  customerId: string;
  displayName: string;
}
interface Item {
  id: string;
  type: SalesType;
  description: string;
  demandedKg: string;
  allowPartialShipment: boolean;
}
interface Order {
  id: string;
  customerId: string;
  customerName: string;
  state: State;
  items: Item[];
  commercialTerms: 'NOT_SUPPLIED';
  confirmedAt?: string;
  confirmedAssessmentId?: string;
}
interface OrderSummary {
  orderId: string;
  customerId: string;
  customerName: string;
  state: State;
  itemCount: number;
  confirmedAt?: string;
}
interface AssessmentSummary {
  assessmentId: string;
  orderId: string;
  state: 'DRAFT' | 'RECORDED';
  mode?: 'STOCK' | 'MAKE';
  observedAt?: string;
}
interface Candidate {
  unitId: string;
  internalCode: string | null;
  kind: string;
  state: string;
  availableKg: string;
}
interface Assessment {
  id: string;
  orderId: string;
  customerId: string;
  state: 'DRAFT' | 'RECORDED';
  mode?: 'STOCK' | 'MAKE';
  observedAt?: string;
  selections?: { itemId: string; unitIds: string[] }[];
  stock?: Omit<Candidate, 'internalCode'>[];
}
interface Reply<T> {
  data: T;
  observation: { snapshotAt: string; respondedAt: string; consistency: 'PAGE_SNAPSHOT' };
}
interface Page<T> {
  items: T[];
  nextCursor?: string | null;
}
export interface SalesDependencies {
  root: HTMLElement;
  api<T>(
    path: string,
    body: object,
    customerId: string | undefined,
    signal: AbortSignal,
  ): Promise<T>;
  canUse(): boolean;
  writeBlocked(): boolean;
  command(body: string, customerId: string): Promise<'accepted' | 'rejected' | 'uncertain'>;
  customerChanged(customerId?: string): boolean | void;
}
export interface SalesDraftLine {
  id: string;
  type: string;
  description: string;
  demandedKg: string;
  allowPartialShipment: string;
}
export interface SalesFieldIssue {
  field: string;
  message: string;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const states: Record<State, string> = {
  DRAFT: 'پیش‌نویس ثبت‌شده',
  SUBMITTED: 'ارسال‌شده برای تأیید',
  CONFIRMED: 'تأییدشده؛ بدون تضمین تخصیص',
  IN_PRODUCTION: 'در تولید',
};
const kinds: Record<SalesType, string> = {
  COIL: 'کلاف',
  SHEET: 'ورق',
  ANGLE: 'نبشی',
  BEAM: 'تیرآهن',
  OTHER: 'سایر',
};
const persian = (text: string) =>
  text.replace(/[0-9]/gu, (value) => '۰۱۲۳۴۵۶۷۸۹'[value.charCodeAt(0) - 48]!);

/** Locale presentation only: every canonical fractional digit and large integer survives. */
export function formatSalesKg(value: string): string {
  if (!/^(?:0|[1-9][0-9]{0,19})(?:\.[0-9]{1,18})?$/u.test(value) || value.endsWith('\n'))
    throw new Error('Invalid exact quantity');
  const [whole, fraction] = value.split('.');
  return persian(
    whole!.replace(/\B(?=(?:[0-9]{3})+(?![0-9]))/gu, '٬') +
      (fraction === undefined ? '' : '٫' + fraction),
  );
}

/** Mirrors accepted lexical admission only; the server owns all business validation. */
export function salesDraftIssues(lines: readonly SalesDraftLine[]): SalesFieldIssue[] {
  const issues: SalesFieldIssue[] = [];
  if (!lines.length || lines.length > 8)
    issues.push({ field: 'sales-lines', message: 'تقاضا باید از ۱ تا ۸ قلم داشته باشد.' });
  const ids = new Set<string>();
  for (const line of lines) {
    const prefix = 'sales-line-' + line.id;
    if (!uuid.test(line.id) || ids.has(line.id))
      issues.push({
        field: 'sales-lines',
        message: 'شناسه اقلام تکراری یا نامعتبر است؛ فرم را دوباره باز کنید.',
      });
    ids.add(line.id);
    if (!salesTypes.includes(line.type as SalesType))
      issues.push({ field: prefix + '-type', message: 'نوع کالا را انتخاب کنید.' });
    if (
      !line.description.trim() ||
      /\p{Cc}|[\ud800-\udfff]/u.test(line.description) ||
      new TextEncoder().encode(line.description).length > 128
    )
      issues.push({
        field: prefix + '-description',
        message: 'شرح باید بدون نویسه کنترلی و حداکثر ۱۲۸ بایت باشد.',
      });
    if (!/^[1-9][0-9]{0,19}$/u.test(line.demandedKg) || line.demandedKg.endsWith('\n'))
      issues.push({
        field: prefix + '-kg',
        message:
          'وزن تقاضا باید عدد صحیح مثبت با رقم لاتین، بدون جداکننده و کمتر از ۱۰ به توان ۲۰ باشد.',
      });
    if (!['true', 'false'].includes(line.allowPartialShipment))
      issues.push({
        field: prefix + '-partial',
        message: 'مجاز بودن ارسال جزئی را صریحاً انتخاب کنید.',
      });
  }
  return issues;
}

export function salesCommandBody(
  command: Command,
  target: string,
  payload: object,
  key = crypto.randomUUID(),
): string {
  if (
    !uuid.test(target) ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(key)
  )
    throw new Error('Invalid Sales command identity');
  const assessment = [
    'DraftFulfillmentAssessment',
    'RecordFulfillmentStock',
    'RecordFulfillmentMake',
  ].includes(command);
  const body = JSON.stringify({
    command,
    contract_version: 1,
    idempotency_key: key,
    target: { kind: assessment ? 'fulfillment-assessment' : 'sales-order', id: target },
    payload,
    preconditions: {},
  });
  if (new TextEncoder().encode(body).length > 4096)
    throw new Error(
      'اندازه کامل درخواست از ۴۰۹۶ بایت بیشتر است. شرح یا تعداد اقلام/واحدها را بازبینی کنید؛ هیچ اطلاعاتی ارسال یا کوتاه نشده است.',
    );
  return body;
}

const make = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  return element;
};
function isolate(value: string, direction = 'ltr') {
  const node = make('bdi', value);
  node.dir = direction;
  node.className = 'sales-exact';
  node.dataset.canonical = value;
  return node;
}
function quantity(value: string) {
  const cell = make('span', formatSalesKg(value));
  const canonical = make('details');
  canonical.append(make('summary', 'مقدار دقیق برای کپی'), isolate(value));
  cell.append(canonical);
  return cell;
}
function instant(value?: string) {
  if (!value) return make('span', 'ثبت نشده');
  const date = new Date(value);
  const time = make(
    'time',
    new Intl.DateTimeFormat('fa-IR', {
      dateStyle: 'medium',
      timeStyle: 'medium',
      timeZone: 'Asia/Tehran',
    }).format(date) + ' (تهران)',
  );
  time.dateTime = value;
  const exact = make('details');
  exact.append(make('summary', 'زمان دقیق UTC'), isolate(value));
  const group = make('span');
  group.append(time, exact);
  return group;
}
class StaleSales extends Error {}

/** Native view owns only local drafts/read generations. The shell owns durable write recovery. */
export function createSales(deps: SalesDependencies) {
  let active = false;
  let generation = 0;
  let customer: Customer | undefined;
  let order: Order | undefined;
  let assessment: Assessment | undefined;
  let selected: Assessment | undefined;
  let localLines: SalesDraftLine[] = [];
  let dirty = false;
  let writing = false;
  let currentView: 'customers' | 'orders' | 'order' | 'assessment' | 'draft' = 'customers';
  const controllers = new Set<AbortController>();
  let status: HTMLElement;
  let body: HTMLElement;
  let filters: { orderId?: string; state?: string; itemType?: string } = {};
  let pageLimit = 25;
  let orderCursor: string | undefined;
  let customerCursor: string | undefined;
  let assessmentCursor: string | undefined;
  const selections = new Map<string, Map<string, Candidate>>();
  let selectedItem = '';
  let stockCursor: string | undefined;
  let stockUnitId = '';

  const owns = (g: number) => active && g === generation && deps.canUse();
  function invalidate() {
    generation++;
    // A new view owns its local state; the shell retains the tab-wide pending
    // interlock until the exact command reaches a definitive outcome.
    writing = false;
    for (const c of controllers) c.abort();
    controllers.clear();
  }
  function note(text: string, error = false) {
    if (!active || !status) return;
    status.textContent = text;
    status.setAttribute('role', error ? 'alert' : 'status');
    status.classList.toggle('sales-error', error);
  }
  function launch(work: () => void | Promise<void>) {
    try {
      const pending = work(),
        expected = generation;
      void Promise.resolve(pending).catch((error: unknown) => {
        if (!owns(expected) || error instanceof StaleSales) return;
        const text = error instanceof Error ? error.message : '';
        note(
          text.startsWith('اندازه کامل')
            ? text
            : 'دریافت یا ثبت کامل نشد. برای اطلاعات، تازه‌سازی را بزنید؛ درخواست ثبت نامطمئن را فقط از پیگیری همان درخواست ادامه دهید.',
          true,
        );
      });
    } catch (error) {
      note(
        error instanceof Error && error.message.startsWith('اندازه کامل')
          ? error.message
          : 'ورودی را بازبینی کنید؛ هیچ ثبت جدیدی انجام نشده است.',
        true,
      );
    }
  }
  function button(text: string, work: () => void | Promise<void>, id?: string, write = false) {
    const control = make('button', text);
    control.type = 'button';
    if (id) control.id = id;
    if (write) {
      control.dataset.salesWrite = 'true';
      control.disabled = writing || deps.writeBlocked();
    }
    control.addEventListener('click', () => launch(work));
    return control;
  }
  function canLeave() {
    if (!dirty) return true;
    if (!window.confirm('تغییرات محلی هنوز ثبت نشده است. کنارگذاشتن تغییرات محلی و ادامه؟'))
      return false;
    dirty = false;
    localLines = [];
    selections.clear();
    selectedItem = stockUnitId = '';
    stockCursor = undefined;
    return true;
  }
  function frame(title: string, back?: () => void | Promise<void>, retry?: () => Promise<void>) {
    invalidate();
    const heading = make('h2', title);
    heading.tabIndex = -1;
    heading.id = 'sales-title';
    const context = make(
      'p',
      customer ? 'مشتری فعلی: ' + customer.displayName : 'ابتدا مشتری مجاز را انتخاب کنید.',
    );
    if (customer) context.append(' · ', isolate(customer.customerId));
    const nav = make('div');
    nav.className = 'actions sales-toolbar';
    if (back) nav.append(button('بازگشت', back, 'sales-back'));
    if (retry) nav.append(button('تازه‌سازی', retry, 'sales-refresh'));
    if (customer)
      nav.append(
        button(
          'تغییر مشتری',
          async () => {
            if (canLeave()) {
              customerCursor = undefined;
              await customers();
            }
          },
          'sales-change-customer',
        ),
      );
    status = make('p');
    status.id = 'sales-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    body = make('div');
    body.className = 'sales-body';
    deps.root.classList.add('sales-workspace');
    deps.root.replaceChildren(heading, context, nav, status, body);
    heading.focus();
    return generation;
  }
  async function read<T>(
    path: string,
    request: object,
    customerId: string | undefined,
    g: number,
  ): Promise<Reply<T>> {
    const controller = new AbortController();
    controllers.add(controller);
    try {
      const result = await deps.api<Reply<T>>(
        '/sales/v1/' + path,
        request,
        customerId,
        controller.signal,
      );
      if (!owns(g) || controller.signal.aborted) throw new StaleSales();
      return result;
    } catch (error) {
      if (!owns(g) || controller.signal.aborted) throw new StaleSales();
      throw error;
    } finally {
      controllers.delete(controller);
    }
  }
  function observed(reply: Reply<unknown>, target = body) {
    const observation = make('p', 'زمان مشاهده این صفحه: ');
    observation.className = 'sales-observation';
    observation.append(instant(reply.observation.snapshotAt));
    target.append(
      observation,
      make('p', 'هر صفحه مشاهده مستقلی است؛ اطلاعات ممکن است پس از نمایش تغییر کند.'),
    );
  }
  function table(headers: string[], caption: string) {
    const grid = make('table');
    grid.className = 'sales-table';
    grid.setAttribute('role', 'table');
    grid.append(make('caption', caption));
    const head = make('thead'),
      row = make('tr'),
      rows = make('tbody');
    head.setAttribute('role', 'rowgroup');
    row.setAttribute('role', 'row');
    rows.setAttribute('role', 'rowgroup');
    for (const label of headers) {
      const cell = make('th', label);
      cell.scope = 'col';
      cell.setAttribute('role', 'columnheader');
      row.append(cell);
    }
    head.append(row);
    grid.append(head, rows);
    function add(values: (string | HTMLElement)[]) {
      const tr = make('tr');
      tr.setAttribute('role', 'row');
      values.forEach((value, index) => {
        const td = make('td');
        td.setAttribute('role', 'cell');
        td.dataset.label = headers[index]!;
        td.append(value);
        tr.append(td);
      });
      rows.append(tr);
    }
    return { grid, add };
  }
  function selectControl(id: string, label: string, values: [string, string][], value = '') {
    const group = make('label', label);
    group.htmlFor = id;
    const select = make('select');
    select.id = id;
    for (const [key, text] of values) {
      const option = make('option', text);
      option.value = key;
      select.append(option);
    }
    select.value = value;
    group.append(select);
    return { group, select };
  }
  function inputControl(id: string, label: string, value = '') {
    const group = make('label', label);
    group.htmlFor = id;
    const input = make('input');
    input.id = id;
    input.value = value;
    group.append(input);
    return { group, input };
  }
  function pageSize(reload: () => Promise<void>) {
    const size = selectControl(
      'sales-page-size',
      'تعداد در هر صفحه',
      [
        ['10', '۱۰'],
        ['25', '۲۵'],
        ['50', '۵۰'],
      ],
      String(pageLimit),
    );
    size.select.addEventListener('change', () => {
      pageLimit = Number(size.select.value);
      orderCursor = customerCursor = assessmentCursor = stockCursor = undefined;
      launch(reload);
    });
    return size.group;
  }
  function paging<T>(page: Page<T>, next: (cursor: string) => Promise<void>, target = body) {
    if (page.nextCursor) {
      const cursor = page.nextCursor;
      target.append(button('صفحه بعد', () => next(cursor), 'sales-next-page'));
    }
  }
  function showIssues(issues: SalesFieldIssue[], target: HTMLElement) {
    for (const old of target.querySelectorAll('.sales-field-error,.sales-error-summary'))
      old.remove();
    for (const field of target.querySelectorAll('[aria-invalid]')) {
      field.removeAttribute('aria-invalid');
      const hints = (field.getAttribute('aria-describedby') ?? '')
        .split(/\s+/u)
        .filter((id) => id && !id.endsWith('-error'));
      if (hints.length) field.setAttribute('aria-describedby', hints.join(' '));
      else field.removeAttribute('aria-describedby');
    }
    const summary = make('div');
    summary.className = 'sales-error-summary';
    summary.tabIndex = -1;
    summary.setAttribute('role', 'alert');
    summary.append(make('h3', 'ورودی‌ها را بازبینی کنید'));
    const list = make('ul');
    for (const issue of issues) {
      const item = make('li'),
        link = make('a', issue.message);
      link.href = '#' + issue.field;
      link.addEventListener('click', (event) => {
        event.preventDefault();
        deps.root.querySelector<HTMLElement>('#' + issue.field)?.focus();
      });
      item.append(link);
      list.append(item);
      const control = deps.root.querySelector<HTMLElement>('#' + issue.field);
      if (control) {
        const inline = make('p', issue.message);
        inline.id = issue.field + '-error';
        inline.className = 'sales-field-error';
        control.setAttribute('aria-invalid', 'true');
        control.setAttribute(
          'aria-describedby',
          [control.getAttribute('aria-describedby'), inline.id].filter(Boolean).join(' '),
        );
        control.after(inline);
      }
    }
    summary.append(list);
    target.prepend(summary);
    summary.focus();
  }
  async function choose(next: Customer) {
    if (!canLeave()) return;
    invalidate();
    if (deps.customerChanged(next.customerId) === false) {
      note('ابتدا پیگیری همان درخواست ثبت را حل یا با آگاهی ببندید.', true);
      return;
    }
    customer = next;
    order = undefined;
    assessment = selected = undefined;
    filters = {};
    localLines = [];
    selectedItem = stockUnitId = '';
    selections.clear();
    orderCursor = assessmentCursor = stockCursor = undefined;
    await orders();
  }
  async function customers() {
    currentView = 'customers';
    const g = frame('انتخاب مشتری مجاز', undefined, async () => {
      customerCursor = undefined;
      await customers();
    });
    note('در حال دریافت…');
    body.append(pageSize(customers));
    const reply = await read<Page<Customer>>(
      'customers/query',
      { limit: pageLimit, ...(customerCursor ? { cursor: customerCursor } : {}) },
      undefined,
      g,
    );
    observed(reply);
    const list = make('ul');
    list.className = 'sales-customers';
    for (const item of reply.data.items) {
      const row = make('li');
      row.append(
        make('strong', item.displayName),
        isolate(item.customerId),
        button('انتخاب مشتری', () => choose(item)),
      );
      list.append(row);
    }
    body.append(list);
    paging(reply.data, async (cursor) => {
      customerCursor = cursor;
      await customers();
    });
    note(
      reply.data.items.length
        ? 'مشتری را صریحاً انتخاب کنید.'
        : 'مشتری مجاز و پیکربندی‌شده‌ای برای این حساب در دسترس نیست.',
    );
  }
  async function orders() {
    if (!customer) return customers();
    currentView = 'orders';
    const g = frame('سفارش‌های مشتری', undefined, async () => {
      orderCursor = undefined;
      await orders();
    });
    note('در حال دریافت…');
    const form = make('form');
    form.noValidate = true;
    form.className = 'sales-filters';
    const state = selectControl(
      'sales-order-state',
      'وضعیت',
      [['', 'همه وضعیت‌ها'], ...Object.entries(states)],
      filters.state,
    );
    const type = selectControl(
      'sales-order-type',
      'نوع کالا',
      [['', 'همه نوع‌ها'], ...Object.entries(kinds)],
      filters.itemType,
    );
    const exact = inputControl('sales-order-id', 'شناسه سفارش (اختیاری)', filters.orderId);
    exact.input.dir = 'ltr';
    const submit = make('button', 'جست‌وجو');
    submit.type = 'submit';
    form.append(state.group, type.group, exact.group, submit);
    for (const control of [state.select, type.select, exact.input])
      control.addEventListener('input', () => {
        invalidate();
        note('فیلتر تغییر کرد. برای مشاهده نتیجه جدید، جست‌وجو را بزنید.');
      });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (exact.input.value && !uuid.test(exact.input.value)) {
        showIssues(
          [
            {
              field: exact.input.id,
              message: 'شناسه باید UUID معتبر با رقم لاتین و حروف کوچک باشد.',
            },
          ],
          form,
        );
        return;
      }
      filters = {
        ...(state.select.value ? { state: state.select.value } : {}),
        ...(type.select.value ? { itemType: type.select.value } : {}),
        ...(exact.input.value ? { orderId: exact.input.value } : {}),
      };
      orderCursor = undefined;
      launch(orders);
    });
    form.append(
      button('پاک‌کردن فیلترها', async () => {
        filters = {};
        orderCursor = undefined;
        await orders();
      }),
    );
    body.append(form, pageSize(orders), button('ثبت تقاضای جدید', draft, 'sales-new-order', true));
    const reply = await read<Page<OrderSummary>>(
      'orders/query',
      { filters, limit: pageLimit, ...(orderCursor ? { cursor: orderCursor } : {}) },
      customer.customerId,
      g,
    );
    observed(reply);
    const rows = table(
      ['شناسه سفارش', 'مشتری ثبت‌شده', 'وضعیت', 'تعداد اقلام', 'زمان تأیید', 'مشاهده'],
      'سفارش‌های مجاز؛ ترتیب شناسه، بدون ترتیب زمانی یا تعداد کل',
    );
    for (const item of reply.data.items)
      rows.add([
        isolate(item.orderId),
        item.customerName,
        states[item.state],
        persian(String(item.itemCount)),
        instant(item.confirmedAt),
        button('مشاهده سفارش', () => openOrder(item.orderId)),
      ]);
    body.append(rows.grid);
    paging(reply.data, async (cursor) => {
      orderCursor = cursor;
      await orders();
    });
    note(
      reply.data.items.length
        ? 'صفحه سفارش‌ها دریافت شد.'
        : 'سفارشی در محدوده و فیلتر فعلی یافت نشد.',
    );
  }
  function showItems(items: readonly Item[], target = body) {
    const rows = table(
      ['شناسه قلم', 'نوع کالا', 'شرح ثبت‌شده', 'تقاضا (کیلوگرم کامل)', 'ارسال جزئی'],
      'اقلام غیرقابل‌ویرایش تقاضا',
    );
    for (const item of items)
      rows.add([
        isolate(item.id),
        kinds[item.type],
        isolate(item.description, 'auto'),
        quantity(item.demandedKg),
        item.allowPartialShipment ? 'مجاز' : 'غیرمجاز',
      ]);
    target.append(rows.grid);
  }
  function warnings(target = body) {
    const warning = make(
      'p',
      'تأیید تقاضا به معنی رزرو یا تضمین موجودی نیست. شرایط مالی ارائه نشده است؛ این به معنی مبلغ صفر نیست.',
    );
    warning.className = 'sales-warning';
    target.append(warning);
    target.append(
      make(
        'p',
        'نمایش رزرو، ارسال و پیشرفت تولید در این مرحله ارائه نمی‌شود؛ از این موضوع نبود فعالیت در آن بخش‌ها نتیجه نگیرید.',
      ),
    );
  }
  async function openOrder(id: string) {
    if (!customer || !canLeave()) return;
    if (order?.id !== id) {
      selected = undefined;
      assessmentCursor = undefined;
    }
    currentView = 'order';
    const g = frame('جزئیات سفارش', orders, async () => {
      assessmentCursor = undefined;
      await openOrder(id);
    });
    note('در حال دریافت…');
    const reply = await read<Order>('orders/detail', { orderId: id }, customer.customerId, g);
    order = reply.data;
    body.append(
      make('h3', 'شناسه سفارش'),
      isolate(order.id),
      make('p', 'مشتری ثبت‌شده: ' + order.customerName),
      make('p', 'وضعیت: ' + states[order.state]),
    );
    observed(reply);
    showItems(order.items);
    warnings();
    if (order.confirmedAt) body.append(make('p', 'زمان تأیید'), instant(order.confirmedAt));
    if (order.confirmedAssessmentId)
      body.append(
        make('p', 'ارزیابی مبنای تأیید'),
        isolate(order.confirmedAssessmentId),
        button('مشاهده ارزیابی مبنا', () => openAssessment(order!.confirmedAssessmentId!)),
      );
    const actions = make('div');
    actions.className = 'actions';
    if (order.state === 'DRAFT')
      actions.append(
        button(
          'ارسال برای تأیید',
          () =>
            confirmAction(
              'SubmitSalesOrder',
              order!.id,
              {},
              'ارسال این پیش‌نویس غیرقابل‌ویرایش برای تأیید؟',
            ),
          'sales-submit-order',
          true,
        ),
      );
    if (['DRAFT', 'SUBMITTED'].includes(order.state))
      actions.append(
        button(
          'ایجاد ارزیابی جدید',
          () =>
            confirmAction(
              'DraftFulfillmentAssessment',
              crypto.randomUUID(),
              { orderId: order!.id },
              'ایجاد ارزیابی مستقل برای این سفارش؟',
            ),
          'sales-new-assessment',
          true,
        ),
      );
    if (
      order.state === 'SUBMITTED' &&
      selected?.orderId === order.id &&
      selected.state === 'RECORDED'
    ) {
      body.append(
        make('p', 'ارزیابی صریحاً انتخاب‌شده برای تأیید:'),
        isolate(selected.id),
        make(
          'p',
          selected.mode === 'MAKE'
            ? 'نیاز به تولید؛ این اقدام تولید را شروع نمی‌کند.'
            : 'از موجودی مشاهده‌شده؛ موجودی هنگام تأیید دوباره بررسی می‌شود.',
        ),
        instant(selected.observedAt),
      );
      actions.append(
        button(
          'تأیید تقاضا',
          () =>
            confirmAction(
              'ConfirmSalesOrder',
              order!.id,
              { assessmentId: selected!.id },
              'تأیید همین تقاضا با ارزیابی انتخاب‌شده؟ این اقدام موجودی را رزرو یا تضمین نمی‌کند.',
            ),
          'sales-confirm-order',
          true,
        ),
      );
    }
    body.append(actions);
    const assessments = make('section');
    assessments.append(make('h3', 'ارزیابی‌های تأمین'));
    body.append(assessments);
    await assessmentList(id, assessments, g);
    note('اصل سفارش و شواهد آن دریافت شد.');
    updateControls();
  }
  async function assessmentList(id: string, target: HTMLElement, g: number) {
    if (!customer) return;
    const reply = await read<Page<AssessmentSummary>>(
      'assessments/query',
      { orderId: id, limit: pageLimit, ...(assessmentCursor ? { cursor: assessmentCursor } : {}) },
      customer.customerId,
      g,
    );
    observed(reply, target);
    const rows = table(
      ['شناسه ارزیابی', 'وضعیت', 'روش ثبت‌شده', 'زمان مشاهده', 'مشاهده'],
      'همه ارزیابی‌های مجاز این سفارش؛ انتخاب خودکار آخرین ارزیابی انجام نمی‌شود',
    );
    for (const item of reply.data.items)
      rows.add([
        isolate(item.assessmentId),
        item.state === 'DRAFT' ? 'ارزیابی ثبت‌نشده نهایی' : 'ارزیابی ثبت‌شده',
        item.state === 'DRAFT'
          ? 'روش تأمین هنوز ثبت نشده است'
          : item.mode === 'MAKE'
            ? 'نیاز به تولید'
            : 'از موجودی مشاهده‌شده',
        instant(item.observedAt),
        button('مشاهده ارزیابی', () => openAssessment(item.assessmentId)),
      ]);
    target.append(rows.grid);
    if (!reply.data.items.length) target.append(make('p', 'ارزیابی‌ای برای این سفارش یافت نشد.'));
    paging(
      reply.data,
      async (cursor) => {
        assessmentCursor = cursor;
        await openOrder(id);
      },
      target,
    );
  }
  async function openAssessment(id: string, preserveLocal = false) {
    if (!customer || (!preserveLocal && !canLeave())) return;
    if (assessment?.id !== id) {
      selections.clear();
      selectedItem = '';
      stockCursor = undefined;
      stockUnitId = '';
    }
    currentView = 'assessment';
    const g = frame(
      'جزئیات ارزیابی',
      () => (order ? openOrder(order.id) : orders()),
      () => {
        stockCursor = undefined;
        return openAssessment(id);
      },
    );
    note('در حال دریافت…');
    const reply = await read<Assessment>(
      'assessments/detail',
      { assessmentId: id },
      customer.customerId,
      g,
    );
    assessment = reply.data;
    if (order?.id !== assessment.orderId)
      order = (
        await read<Order>('orders/detail', { orderId: assessment.orderId }, customer.customerId, g)
      ).data;
    body.append(
      make('h3', 'شناسه ارزیابی'),
      isolate(assessment.id),
      make('p', 'شناسه سفارش'),
      isolate(assessment.orderId),
    );
    observed(reply);
    showItems(order.items);
    warnings();
    if (assessment.state === 'RECORDED') {
      body.append(
        make('p', 'ارزیابی ثبت‌شده و غیرقابل‌تغییر'),
        make(
          'p',
          assessment.mode === 'MAKE'
            ? 'نیاز به تولید؛ این اقدام تولید را شروع نمی‌کند.'
            : 'از موجودی مشاهده‌شده؛ این شواهد تاریخی است و موجودی جاری نیست.',
        ),
        instant(assessment.observedAt),
      );
      for (const selection of assessment.selections ?? []) {
        const block = make('section');
        block.append(make('h3', 'قلم ارزیابی‌شده'), isolate(selection.itemId));
        const rows = table(
          ['شناسه واحد', 'نوع ثبت‌شده', 'کیلوگرم مشاهده‌شده'],
          'شواهد تاریخی غیرقابل‌ویرایش',
        );
        for (const unitId of selection.unitIds) {
          const unit = assessment.stock?.find((item) => item.unitId === unitId);
          rows.add([
            isolate(unitId),
            unit?.kind ?? 'ثبت نشده',
            unit ? quantity(unit.availableKg) : 'ثبت نشده',
          ]);
        }
        block.append(rows.grid);
        body.append(block);
      }
      if (order.state === 'SUBMITTED')
        body.append(
          button(
            'انتخاب این ارزیابی برای تأیید',
            async () => {
              selected = assessment;
              await openOrder(assessment!.orderId);
            },
            'sales-select-assessment',
          ),
        );
    } else {
      body.append(
        make('p', 'روش تأمین هنوز ثبت نشده است. ثبت روش، شواهد را غیرقابل‌تغییر می‌کند.'),
      );
      if (['DRAFT', 'SUBMITTED'].includes(order.state)) {
        body.append(
          button(
            'ثبت ارزیابی MAKE',
            () =>
              confirmAction(
                'RecordFulfillmentMake',
                assessment!.id,
                {},
                'نیاز به تولید ثبت شود؟ این اقدام تولید را شروع نمی‌کند.',
              ),
            'sales-record-make',
            true,
          ),
        );
        await stockPicker(g);
      }
    }
    note('ارزیابی دریافت شد.');
    updateControls();
  }
  async function stockPicker(g: number) {
    if (!order || !assessment || !customer) return;
    const section = make('section');
    section.id = 'sales-stock-picker';
    section.append(
      make('h3', 'انتخاب موجودی مشاهده‌شده برای STOCK'),
      make(
        'p',
        'نوع کلی کالا به تنهایی اثبات سازگاری مشخصات نیست. مناسب بودن واحد را بازبینی کنید. این انتخاب رزرو یا تضمین موجودی نیست.',
      ),
    );
    const item = selectControl(
      'sales-stock-item',
      'قلم سفارش',
      order.items.map((row) => [row.id, kinds[row.type] + ' · ' + row.description]),
      selectedItem || order.items[0]!.id,
    );
    selectedItem = item.select.value;
    const exact = inputControl('sales-stock-unit', 'شناسه دقیق واحد (اختیاری)', stockUnitId);
    exact.input.dir = 'ltr';
    const form = make('form');
    form.noValidate = true;
    form.append(item.group, exact.group);
    const submit = make('button', 'جست‌وجوی واحدها');
    submit.type = 'submit';
    form.append(submit);
    const found = make('div'),
      picked = make('div');
    let candidateRequest = 0;
    function renderSelected() {
      picked.replaceChildren(make('h3', 'واحدهای انتخاب‌شده؛ حداکثر ۱۶ واحد متمایز'));
      for (const line of order!.items) {
        const lineBlock = make('div');
        lineBlock.append(make('strong', line.description), isolate(line.id));
        for (const row of selections.get(line.id)?.values() ?? [])
          lineBlock.append(
            isolate(row.unitId),
            quantity(row.availableKg),
            button('حذف از انتخاب محلی', () => {
              selections.get(line.id)?.delete(row.unitId);
              dirty = true;
              renderSelected();
            }),
          );
        picked.append(lineBlock);
      }
    }
    async function loadCandidates() {
      if (!customer || !order) return;
      if (exact.input.value && !uuid.test(exact.input.value)) {
        showIssues(
          [
            {
              field: exact.input.id,
              message: 'شناسه واحد باید UUID معتبر با رقم لاتین و حروف کوچک باشد.',
            },
          ],
          form,
        );
        return;
      }
      const request = ++candidateRequest;
      for (const controller of controllers) controller.abort();
      controllers.clear();
      selectedItem = item.select.value;
      stockUnitId = exact.input.value;
      found.replaceChildren(make('p', 'در حال دریافت…'));
      const requestedItem = selectedItem;
      const reply = await read<Page<Candidate>>(
        'stock/query',
        {
          orderId: order.id,
          itemId: selectedItem,
          filters: { ...(stockUnitId ? { unitId: stockUnitId } : {}) },
          limit: pageLimit,
          ...(stockCursor ? { cursor: stockCursor } : {}),
        },
        customer.customerId,
        g,
      );
      if (request !== candidateRequest) throw new StaleSales();
      found.replaceChildren();
      observed(reply, found);
      const rows = table(
        ['شناسه واحد', 'کد داخلی قابل افشا', 'نوع ثبت‌شده', 'کیلوگرم مشاهده‌شده', 'انتخاب'],
        'واحدهای واجد شرایط مشاهده‌شده؛ بدون تضمین تخصیص',
      );
      for (const row of reply.data.items) {
        const add = button('انتخاب برای این قلم', () => {
          const all = [...selections.values()].flatMap((values) => [...values.keys()]);
          if (all.includes(row.unitId)) {
            note('این واحد قبلاً برای یک قلم انتخاب شده است.', true);
            return;
          }
          if (all.length >= 16) {
            note('حداکثر ۱۶ واحد متمایز برای کل ارزیابی مجاز است.', true);
            return;
          }
          if (request !== candidateRequest || requestedItem !== item.select.value || !owns(g))
            return;
          const list = selections.get(requestedItem) ?? new Map<string, Candidate>();
          list.set(row.unitId, row);
          selections.set(requestedItem, list);
          dirty = true;
          renderSelected();
          note('انتخاب محلی تغییر کرد؛ هنوز ارزیابی ثبت نشده است.');
        });
        rows.add([
          isolate(row.unitId),
          row.internalCode === null
            ? 'برای فروش ارائه نشده است'
            : isolate(row.internalCode, 'auto'),
          row.kind,
          quantity(row.availableKg),
          add,
        ]);
      }
      found.append(rows.grid);
      if (!reply.data.items.length)
        found.append(
          make(
            'p',
            'واحد واجد شرایطی در مشاهده و فیلتر فعلی یافت نشد؛ این به معنی نبود موجودی در کارخانه نیست.',
          ),
        );
      paging(
        reply.data,
        async (cursor) => {
          stockCursor = cursor;
          await loadCandidates();
        },
        found,
      );
    }
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      stockCursor = undefined;
      launch(loadCandidates);
    });
    exact.input.addEventListener('input', () => {
      candidateRequest++;
      for (const controller of controllers) controller.abort();
      controllers.clear();
      found.replaceChildren(make('p', 'فیلتر تغییر کرد؛ جست‌وجو را دوباره بزنید.'));
    });
    item.select.addEventListener('change', () => {
      stockCursor = undefined;
      selectedItem = item.select.value;
      launch(loadCandidates);
    });
    section.append(
      make(
        'p',
        'کدهای داخلی برای فروش ارائه نمی‌شوند. واحد را از فهرست یا با شناسه دقیق انتخاب کنید.',
      ),
      form,
      found,
      picked,
      button(
        'ثبت ارزیابی STOCK',
        () => {
          if (!order || !assessment) return;
          const chosen = order.items.map((line) => ({
            itemId: line.id,
            unitIds: [...(selections.get(line.id)?.keys() ?? [])],
          }));
          if (chosen.some((line) => !line.unitIds.length)) {
            note(
              'برای هر قلم، دست‌کم یک واحد مناسب انتخاب کنید؛ جمع کافی بودن وزن را سرور بررسی می‌کند.',
              true,
            );
            return;
          }
          confirmAction(
            'RecordFulfillmentStock',
            assessment.id,
            { selections: chosen },
            'همین واحدهای انتخاب‌شده برای همه اقلام ثبت شوند؟ شواهد ثبت‌شده قابل ویرایش نیست.',
          );
        },
        'sales-record-stock',
        true,
      ),
    );
    body.append(section);
    renderSelected();
    await loadCandidates();
  }
  function newLine(): SalesDraftLine {
    return {
      id: crypto.randomUUID(),
      type: '',
      description: '',
      demandedKg: '',
      allowPartialShipment: '',
    };
  }
  function draft() {
    if (!customer || deps.writeBlocked() || !canLeave()) return;
    localLines = [newLine()];
    dirty = false;
    renderDraft();
  }
  function renderDraft() {
    if (!customer) return;
    currentView = 'draft';
    frame('ثبت تقاضای جدید', async () => {
      if (canLeave()) await orders();
    });
    body.append(
      make(
        'p',
        'این فرم فقط محلی است. پیش‌نویس ثبت‌شده قابل ویرایش یا لغو در این مرحله نیست. اطلاعات مالی ارائه نشده است.',
      ),
    );
    const form = make('form');
    form.noValidate = true;
    const lines = make('div');
    lines.id = 'sales-lines';
    lines.tabIndex = -1;
    localLines.forEach((line, index) => {
      const group = make('fieldset');
      group.append(make('legend', 'قلم ' + persian(String(index + 1))));
      const prefix = 'sales-line-' + line.id;
      const type = selectControl(
        prefix + '-type',
        'نوع کالا',
        [['', 'انتخاب کنید'], ...Object.entries(kinds)],
        line.type,
      );
      const description = inputControl(
        prefix + '-description',
        'شرح مشخصات (حداکثر ۱۲۸ بایت)',
        line.description,
      );
      const kg = inputControl(prefix + '-kg', 'وزن تقاضا (کیلوگرم کامل)', line.demandedKg);
      kg.input.dir = 'ltr';
      kg.input.inputMode = 'numeric';
      const hint = make(
        'p',
        'فقط رقم لاتین، عدد صحیح مثبت بدون جداکننده؛ مقدار اعشاری پذیرفته نمی‌شود.',
      );
      hint.id = prefix + '-kg-hint';
      kg.input.setAttribute('aria-describedby', hint.id);
      const partial = selectControl(
        prefix + '-partial',
        'ارسال جزئی مجاز است؟',
        [
          ['', 'صریحاً انتخاب کنید'],
          ['true', 'بله'],
          ['false', 'خیر'],
        ],
        line.allowPartialShipment,
      );
      for (const [control, key] of [
        [type.select, 'type'],
        [description.input, 'description'],
        [kg.input, 'demandedKg'],
        [partial.select, 'allowPartialShipment'],
      ] as const)
        control.addEventListener('input', () => {
          line[key] = control.value;
          dirty = true;
        });
      group.append(type.group, description.group, kg.group, hint, partial.group);
      if (localLines.length > 1)
        group.append(
          button('حذف قلم محلی', () => {
            localLines = localLines.filter((value) => value !== line);
            dirty = true;
            renderDraft();
          }),
        );
      lines.append(group);
    });
    const review = make('button', 'بازبینی پیش از ثبت');
    review.type = 'submit';
    form.append(
      lines,
      button('افزودن قلم', () => {
        if (localLines.length < 8) {
          localLines.push(newLine());
          dirty = true;
          renderDraft();
        }
      }),
      review,
    );
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const issues = salesDraftIssues(localLines);
      if (issues.length) {
        showIssues(issues, form);
        return;
      }
      const items = localLines.map((line) => ({
        id: line.id,
        type: line.type as SalesType,
        description: line.description,
        demandedKg: line.demandedKg,
        allowPartialShipment: line.allowPartialShipment === 'true',
      }));
      const payload = { customerId: customer!.customerId, items };
      launch(() => {
        const serialized = salesCommandBody('DraftSalesOrder', crypto.randomUUID(), payload);
        preview(serialized, 'ثبت پیش‌نویس غیرقابل‌ویرایش', () => renderDraft(), items);
      });
    });
    body.append(form);
    updateControls();
  }
  function preview(serialized: string, label: string, back: () => void, items?: readonly Item[]) {
    frame('بازبینی نهایی', back);
    if (items) showItems(items);
    else if (order) showItems(order.items);
    const input = JSON.parse(serialized) as {
      command: Command;
      target: { id: string };
      payload: { assessmentId?: string };
    };
    body.append(
      make('p', label),
      make(
        'p',
        'مشتری فعلی و شناسه مقصد را بازبینی کنید؛ این ثبت با همان درخواست قابل پیگیری است.',
      ),
      isolate(input.target.id),
    );
    warnings();
    const evidence = input.command === 'ConfirmSalesOrder' ? selected : assessment;
    if (evidence && input.command !== 'DraftSalesOrder') {
      body.append(make('p', 'شناسه ارزیابی'), isolate(evidence.id), instant(evidence.observedAt));
    }
    if (input.command === 'ConfirmSalesOrder' && evidence) {
      body.append(
        make(
          'p',
          evidence.mode === 'MAKE'
            ? 'نیاز به تولید؛ این اقدام تولید را شروع نمی‌کند.'
            : 'از موجودی مشاهده‌شده؛ هنگام تأیید دوباره بررسی می‌شود.',
        ),
      );
      for (const row of evidence.stock ?? [])
        body.append(isolate(row.unitId), quantity(row.availableKg));
    }
    if (input.command === 'RecordFulfillmentStock')
      for (const [itemId, units] of selections) {
        body.append(make('p', 'قلم انتخاب‌شده'), isolate(itemId));
        for (const unit of units.values())
          body.append(isolate(unit.unitId), quantity(unit.availableKg));
      }
    body.append(button(label, () => dispatch(serialized), 'sales-confirm-action', true));
  }
  function confirmAction(command: Command, target: string, payload: object, label: string) {
    if (!customer || writing || deps.writeBlocked()) return;
    const serialized = salesCommandBody(command, target, payload);
    const from = currentView;
    const id = assessment?.id;
    preview(serialized, label, () =>
      launch(() =>
        from === 'assessment' && id
          ? openAssessment(id, true)
          : order
            ? openOrder(order.id)
            : orders(),
      ),
    );
  }
  async function dispatch(serialized: string) {
    if (!customer || writing || deps.writeBlocked()) return;
    const g = generation,
      customerId = customer.customerId;
    writing = true;
    updateControls();
    note('در حال ثبت یا پیگیری همان درخواست…');
    try {
      const result = await deps.command(serialized, customerId);
      if (!owns(g) || customer?.customerId !== customerId) throw new StaleSales();
      if (result === 'accepted') {
        dirty = false;
        localLines = [];
        await refreshAfterCommand(serialized);
      } else if (result === 'uncertain')
        note(
          'نتیجه ثبت هنوز قطعی نیست. فقط پیگیری همان درخواست را در بخش بازیابی ادامه دهید؛ کلید جدید نسازید.',
          true,
        );
      // Definitive rejected outcomes are described by the shell's guard-specific message.
    } finally {
      if (owns(g)) {
        writing = false;
        updateControls();
      }
    }
  }
  async function refreshAfterCommand(serialized: string) {
    if (!active || !customer || !deps.canUse()) return;
    const input = JSON.parse(serialized) as {
      target: { kind: string; id: string };
      payload: { customerId?: string };
    };
    if (input.payload.customerId && input.payload.customerId !== customer.customerId) return;
    writing = false;
    dirty = false;
    try {
      if (input.target.kind === 'sales-order') await openOrder(input.target.id);
      else await openAssessment(input.target.id);
    } catch (error) {
      if (error instanceof StaleSales || !active || !deps.canUse()) return;
      note(
        'ثبت قطعی است، اما بازیابی جزئیات کامل نشد. فقط اطلاعات را تازه‌سازی کنید؛ ثبت را تکرار نکنید.',
        true,
      );
    }
  }
  function updateControls() {
    for (const control of deps.root.querySelectorAll<HTMLButtonElement>('[data-sales-write]'))
      control.disabled = writing || deps.writeBlocked();
  }
  function clear() {
    invalidate();
    active = false;
    customer = undefined;
    order = undefined;
    assessment = selected = undefined;
    localLines = [];
    dirty = writing = false;
    filters = {};
    orderCursor = customerCursor = assessmentCursor = stockCursor = undefined;
    selections.clear();
    deps.root.replaceChildren();
  }
  return {
    show() {
      active = true;
      launch(() => (customer ? orders() : customers()));
    },
    hide() {
      active = false;
      invalidate();
      deps.root.replaceChildren();
    },
    clear,
    canLeave,
    getCustomer: () => customer?.customerId,
    updateControls,
    refreshAfterCommand,
  };
}
