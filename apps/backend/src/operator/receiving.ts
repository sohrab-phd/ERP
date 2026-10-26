import { commandBody } from './intent.js';

type Row = Record<string, unknown>;
interface Option {
  optionId: string;
  catalogue: string;
  label: string;
}
interface Page {
  items: Row[];
  nextAfterId?: string;
  snapshotAt?: string;
}
interface Order {
  orderId: string;
  orderReference: string;
  lines: Row[];
}
interface Dependencies {
  root: HTMLElement;
  location?: { id: string; label: string };
  api<T>(path: string, body?: object): Promise<T>;
  catalogues(): Option[];
  submit(body: string): Promise<void>;
  render(value: Row): HTMLElement;
  message(text: string): void;
  failure(error: unknown): void;
}
const make = <K extends keyof HTMLElementTagNameMap>(tag: K, text?: string) => {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  return element;
};
const names = {
  materialTypeOptionId: 'نوع کالا',
  widthM: 'عرض (متر)',
  thicknessMm: 'ضخامت (میلی‌متر)',
  unitWeightKg: 'وزن واقعی هر واحد (کیلوگرم، W1)',
  colorOptionId: 'رنگ',
  qualityGradeOptionId: 'کیفیت',
  ralColorNumber: 'شماره رئال رنگ',
  lengthM: 'طول (متر)',
};
const kinds: Record<string, string> = {
  materialTypeOptionId: 'MATERIAL_TYPE',
  colorOptionId: 'COLOR',
  qualityGradeOptionId: 'QUALITY_GRADE',
};
const optional = ['colorOptionId', 'qualityGradeOptionId', 'ralColorNumber', 'lengthM'];
const decimal = '(0|[1-9][0-9]{0,19})(\\.[0-9]{1,18})?';

/** One arrival editor. Server remains authoritative for comparisons, progress and IPS effects. */
export function createReceiving(deps: Dependencies) {
  let generation = 0,
    blocked = false,
    reviewed: string | undefined;
  let fields: HTMLFieldSetElement | undefined, review: HTMLElement | undefined;
  let confirm: HTMLButtonElement | undefined;
  let reset: HTMLButtonElement | undefined;
  const orders = new Map<string, Order>();
  const progress = new Map<string, { orderId: string; lineId: string; count: string }>();
  const units: {
    id: string;
    root: HTMLElement;
    controls: Map<string, HTMLInputElement | HTMLSelectElement>;
  }[] = [];
  const waybills: { id: string; reference: HTMLInputElement; yellow: HTMLInputElement }[] = [];
  const receipts: { id: string; reference: HTMLInputElement }[] = [];
  const catalogueSelects = new Map<HTMLSelectElement, string>();
  const unitOrderSelects: HTMLSelectElement[] = [];
  const docSelects = new Map<HTMLSelectElement, 'waybill' | 'receipt'>();
  let header: Record<string, HTMLInputElement> = {},
    weightSource: HTMLSelectElement;
  let unitList: HTMLElement, waybillList: HTMLElement, receiptList: HTMLElement;
  const handle = (work: () => Promise<void>) => () => {
    void work().catch((error: unknown) => {
      // The application request wrapper handles lock/expiry; never restore a cleared editor.
      if (fields) deps.failure(error);
    });
  };
  function label(parent: HTMLElement, text: string, control: HTMLElement) {
    const wrapper = make('label', text);
    wrapper.append(control);
    parent.append(wrapper);
    return control;
  }
  function input(
    parent: HTMLElement,
    text: string,
    id: string,
    required = false,
    pattern?: string,
  ) {
    const control = make('input');
    control.id = id;
    control.name = id;
    control.required = required;
    control.dir = 'auto';
    control.maxLength = 256;
    if (pattern) {
      control.pattern = pattern;
      control.dir = 'ltr';
    }
    label(parent, text, control);
    return control;
  }
  function select(parent: HTMLElement, text: string, id: string) {
    const control = make('select');
    control.id = id;
    label(parent, text, control);
    return control;
  }
  function button(parent: HTMLElement, text: string, work: () => void) {
    const b = make('button', text);
    b.type = 'button';
    b.addEventListener('click', work);
    parent.append(b);
    return b;
  }
  function options(
    control: HTMLSelectElement,
    values: { id: string; label: string }[],
    empty: string,
  ) {
    const selected = control.value;
    const first = make('option', empty);
    first.value = '';
    control.replaceChildren(first);
    for (const value of values) {
      const o = make('option', value.label);
      o.value = value.id;
      control.append(o);
    }
    control.value = selected;
  }
  function refreshCatalogues() {
    for (const [control, kind] of catalogueSelects)
      options(
        control,
        deps
          .catalogues()
          .filter((o) => o.catalogue === kind)
          .map((o) => ({ id: o.optionId, label: o.label })),
        'انتخاب کنید',
      );
  }
  function refreshDocuments() {
    for (const [control, kind] of docSelects) {
      const docs = kind === 'waybill' ? waybills : receipts;
      options(
        control,
        docs.map((doc, index) => ({
          id: doc.id,
          label: `${index + 1} · ${doc.reference.value || 'شماره را وارد کنید'}`,
        })),
        'سند را انتخاب کنید',
      );
      if (!control.value && docs.length === 1) control.value = docs[0]!.id;
    }
  }
  function addWaybill() {
    const id = crypto.randomUUID(),
      box = make('fieldset');
    box.append(make('legend', `بارنامهٔ ${waybills.length + 1}`));
    const reference = input(box, 'شماره بارنامه (الزامی)', `waybill-${id}`, true);
    const yellow = input(box, 'شماره بارنامه حواله (برگ زرد، اختیاری)', `yellow-${id}`);
    reference.addEventListener('input', refreshDocuments);
    waybills.push({ id, reference, yellow });
    waybillList.append(box);
    refreshDocuments();
  }
  function addReceipt() {
    const id = crypto.randomUUID(),
      box = make('fieldset');
    box.append(make('legend', `رسید انبار ${receipts.length + 1}`));
    const reference = input(box, 'شماره رسید انبار (الزامی)', `receipt-${id}`, true);
    reference.addEventListener('input', refreshDocuments);
    receipts.push({ id, reference });
    receiptList.append(box);
    refreshDocuments();
  }
  function refreshOrders() {
    for (const control of unitOrderSelects)
      options(
        control,
        [...orders.values()].map((o) => ({ id: o.orderId, label: o.orderReference })),
        'سفارش را انتخاب کنید',
      );
  }
  function addUnit() {
    const id = crypto.randomUUID(),
      root = make('fieldset'),
      controls = new Map<string, HTMLInputElement | HTMLSelectElement>();
    root.append(make('legend', `واحد فیزیکی ${units.length + 1}`));
    const grid = make('div');
    grid.className = 'grid';
    root.append(grid);
    controls.set(
      'internalSystemCode',
      input(grid, 'شماره سیستم (الزامی، مستقل برای هر واحد)', `system-${id}`, true),
    );
    controls.set('productNumber', input(grid, 'شماره محصول (الزامی)', `product-${id}`, true));
    const association = select(grid, 'ارتباط واحد با سفارش', `association-${id}`);
    for (const [value, text] of [
      ['ORDER_LINE', 'خط سفارش'],
      ['ORDER_ONLY', 'فقط سفارش؛ بدون خط'],
      ['UNLINKED', 'بدون ارتباط با سفارش'],
    ]) {
      const o = make('option', text);
      o.value = value!;
      association.append(o);
    }
    controls.set('kind', association);
    const order = select(grid, 'سفارش این واحد', `unit-order-${id}`);
    controls.set('orderId', order);
    order.required = true;
    unitOrderSelects.push(order);
    const line = select(grid, 'خط سفارش این واحد', `unit-line-${id}`);
    controls.set('lineId', line);
    line.required = true;
    const original = make('div');
    original.className = 'original-actual';
    root.append(original);
    function showOriginal() {
      const source = orders.get(order.value)?.lines.find((l) => l.lineId === line.value);
      original.replaceChildren(make('h4', 'اصل سفارش و پیشرفت قبلی (فقط خواندنی)'));
      if (source) original.append(deps.render(source));
      else original.append(make('p', 'برای این ارتباط، مشخصات اصل خط ارائه نشده است.'));
    }
    function updateLines() {
      options(
        line,
        (orders.get(order.value)?.lines ?? []).map((l) => ({
          id: String(l.lineId),
          label: `خط ${String(l.position)} · آیتم ${typeof l.itemNumber === 'string' ? l.itemNumber : 'ثبت نشده'}`,
        })),
        'خط را انتخاب کنید',
      );
      showOriginal();
    }
    order.addEventListener('change', updateLines);
    line.addEventListener('change', showOriginal);
    association.addEventListener('change', () => {
      order.disabled = association.value === 'UNLINKED';
      order.required = !order.disabled;
      line.disabled = association.value !== 'ORDER_LINE';
      line.required = !line.disabled;
      if (order.disabled) order.value = '';
      if (line.disabled) line.value = '';
      showOriginal();
    });
    for (const [name, text] of Object.entries(names)) {
      let control: HTMLInputElement | HTMLSelectElement;
      const opt = optional.includes(name);
      if (kinds[name]) {
        control = select(grid, `${text}${opt ? ' (اختیاری)' : ' واقعی (الزامی)'}`, `${name}-${id}`);
        catalogueSelects.set(control, kinds[name]);
        control.required = !opt;
      } else
        control = input(
          grid,
          `${text}${opt ? ' (اختیاری)' : ' (الزامی)'}`,
          `${name}-${id}`,
          !opt,
          name === 'unitWeightKg'
            ? '[1-9][0-9]{0,19}'
            : ['widthM', 'thicknessMm', 'lengthM'].includes(name)
              ? decimal
              : undefined,
        );
      controls.set(name, control);
      if (opt) {
        const state = select(grid, `وضعیت ${text}`, `state-${name}-${id}`);
        for (const [value, text] of [
          ['NOT_RECORDED', 'ثبت نشده'],
          ['VALUE', 'مقدار بررسی و ثبت شد'],
          ['ABSENT', 'نبود مقدار بررسی و تأیید شد'],
        ]) {
          const o = make('option', text);
          o.value = value!;
          state.append(o);
        }
        controls.set(`${name}State`, state);
        control.disabled = true;
        state.addEventListener('change', () => {
          control.disabled = state.value !== 'VALUE';
          control.required = !control.disabled;
        });
      }
    }
    button(root, 'مشخصات همین واحد مطابق اصل بررسی شد؛ درج مقادیر', () => {
      const source = orders.get(order.value)?.lines.find((l) => l.lineId === line.value);
      if (!source) {
        deps.message('ابتدا خط اصل سفارش را انتخاب کنید.');
        return;
      }
      for (const name of Object.keys(names)) {
        const sourceName =
          name === 'materialTypeOptionId'
            ? 'materialType'
            : name === 'colorOptionId'
              ? 'color'
              : name === 'qualityGradeOptionId'
                ? 'qualityGrade'
                : name;
        const value = source[sourceName];
        const exact = value && typeof value === 'object' ? String((value as Row).optionId) : value;
        const control = controls.get(name)!;
        if (exact !== undefined && exact !== null) {
          const state = controls.get(`${name}State`);
          if (state) {
            state.value = 'VALUE';
            control.disabled = false;
            control.required = true;
          }
          if (typeof exact === 'string') control.value = exact;
        }
      }
    });
    const waybill = select(grid, 'بارنامهٔ این واحد', `unit-waybill-${id}`);
    waybill.required = true;
    docSelects.set(waybill, 'waybill');
    controls.set('waybillId', waybill);
    const receipt = select(grid, 'رسید انبار این واحد', `unit-receipt-${id}`);
    receipt.required = true;
    docSelects.set(receipt, 'receipt');
    controls.set('receiptId', receipt);
    controls.set(
      'weightEvidenceReference',
      input(grid, 'مرجع شاهد وزن W1 (اختیاری)', `weight-evidence-${id}`),
    );
    root.append(
      make(
        'p',
        'فقط موارد بررسی‌شده را تأیید کنید؛ سرور مغایرت و مقدار مازاد را تعیین می‌کند. تحویل جزئی به‌خودی‌خود مغایرت مشخصات نیست.',
      ),
    );
    for (const [name, text] of Object.entries({
      confirmed: 'دریافت فیزیکی این واحد و مقادیر واقعی را تأیید می‌کنم (الزامی)',
      changedW1: 'وزن متفاوت W1 بررسی و پذیرفته شد',
      specificationMismatch: 'مغایرت مشخصات بررسی و پذیرفته شد',
      excess: 'مازاد بر سفارش بررسی و پذیرفته شد',
      unordered: 'کالای بدون خط سفارش بررسی و پذیرفته شد',
    })) {
      const check = input(root, text, `accept-${name}-${id}`, name === 'confirmed');
      check.type = 'checkbox';
      controls.set(name, check);
    }
    button(root, 'حذف این واحد پیش از تأیید', () => {
      const index = units.findIndex((u) => u.id === id);
      if (index >= 0) units.splice(index, 1);
      root.remove();
      for (const [position, unit] of units.entries())
        unit.root.querySelector('legend')!.textContent = `واحد فیزیکی ${position + 1}`;
      for (const c of controls.values())
        if (c instanceof HTMLSelectElement) {
          catalogueSelects.delete(c);
          docSelects.delete(c);
        }
      const selectIndex = unitOrderSelects.indexOf(order);
      if (selectIndex >= 0) unitOrderSelects.splice(selectIndex, 1);
    });
    units.push({ id, root, controls });
    unitList.append(root);
    refreshOrders();
    refreshCatalogues();
    refreshDocuments();
    showOriginal();
  }
  function payload() {
    if (!deps.location || !units.length)
      throw new Error('حداقل یک واحد فیزیکی و محل دریافت پیکربندی‌شده لازم است.');
    const linked = new Map<string, Row>();
    const values = units.map((unit) => {
      const value = (name: string) => unit.controls.get(name)!.value;
      const kind = value('kind'),
        association: Row = { kind };
      if (kind !== 'UNLINKED') association.orderId = value('orderId');
      if (kind === 'ORDER_LINE') {
        association.lineId = value('lineId');
        const p = progress.get(`${String(association.orderId)}/${String(association.lineId)}`);
        if (!p) throw new Error('اصل خط و پیشرفت آن را دوباره بازیابی کنید.');
        linked.set(`${p.orderId}/${p.lineId}`, {
          orderId: p.orderId,
          lineId: p.lineId,
          expectedAcceptedUnitCount: p.count,
        });
      }
      const actual: Row = {};
      for (const name of Object.keys(names)) {
        const state = unit.controls.get(`${name}State`)?.value;
        if (state === 'NOT_RECORDED') continue;
        actual[name] = state === 'ABSENT' ? null : value(name);
      }
      const acceptance: Row = {};
      for (const name of ['confirmed', 'changedW1', 'specificationMismatch', 'excess', 'unordered'])
        if ((unit.controls.get(name) as HTMLInputElement).checked) acceptance[name] = true;
      return {
        receivedUnitId: unit.id,
        internalSystemCode: value('internalSystemCode'),
        productNumber: value('productNumber'),
        association,
        actual,
        acceptance,
        waybillId: value('waybillId'),
        receiptId: value('receiptId'),
        locationId: deps.location!.id,
        ...(value('weightEvidenceReference')
          ? { weightEvidenceReference: value('weightEvidenceReference') }
          : {}),
      };
    });
    return {
      payload: {
        ...Object.fromEntries(
          Object.entries(header)
            .filter(([, c]) => c.value !== '')
            .map(([key, c]) => [key, c.value]),
        ),
        weightSourceWaybillId: weightSource.value,
        waybills: waybills.map((d) => ({
          waybillId: d.id,
          reference: d.reference.value,
          ...(d.yellow.value ? { yellowCopyReference: d.yellow.value } : {}),
        })),
        warehouseReceipts: receipts.map((d) => ({ receiptId: d.id, reference: d.reference.value })),
        units: values,
      },
      preconditions: { lineProgress: [...linked.values()] },
    };
  }
  function clear() {
    generation++;
    reviewed = undefined;
    fields = undefined;
    review = undefined;
    confirm = undefined;
    reset = undefined;
    orders.clear();
    progress.clear();
    units.length = waybills.length = receipts.length = unitOrderSelects.length = 0;
    catalogueSelects.clear();
    docSelects.clear();
    header = {};
    deps.root.replaceChildren();
  }
  function setBlocked(value: boolean) {
    blocked = value;
    if (fields) fields.disabled = blocked || reviewed !== undefined;
    if (confirm) confirm.disabled = blocked;
    if (reset) reset.disabled = blocked;
  }
  function show() {
    if (fields || deps.root.children.length) return;
    deps.root.append(make('h2', 'ثبت و تأیید دریافت انبار'));
    if (!deps.location) {
      deps.root.append(
        make(
          'p',
          'محل دریافت این ایستگاه پیکربندی نشده است. از مسئول نصب بخواهید نام و شناسهٔ محل واقعی را تنظیم کند؛ ثبت دریافت فعال نیست.',
        ),
      );
      return;
    }
    deps.root.append(
      make(
        'p',
        `محل دریافت همهٔ واحدهای این ورود: ${deps.location.label}. اگر محل واقعی متفاوت است، تأیید نکنید.`,
      ),
    );
    reset = button(deps.root, 'پاک کردن فرمِ ارسال‌نشده', () => {
      if (blocked) return;
      clear();
      show();
    });
    deps.root.append(
      make(
        'p',
        'هر ورود یک تأیید اتمی دارد و ممکن است شامل چند سفارش باشد. وزن W2/W3 متعلق به کل محموله است؛ موجودی فقط با W1 هر واحد تأییدشده ثبت می‌شود.',
      ),
    );
    const lookup = make('form');
    lookup.method = 'post';
    const lookupFields = make('fieldset');
    lookup.append(lookupFields);
    lookupFields.append(make('legend', 'اصل سفارش و پیشرفت قبلی'));
    const lookupKind = select(lookupFields, 'روش بازیابی برای دریافت', 'receive-lookup-kind');
    for (const [value, text] of [
      ['reference', 'شماره سفارش'],
      ['id', 'شناسهٔ سفارش'],
    ]) {
      const o = make('option', text);
      o.value = value!;
      lookupKind.append(o);
    }
    const reference = input(
      lookupFields,
      'شماره یا شناسهٔ سفارش برای دریافت',
      'receive-lookup',
      true,
    );
    const load = make('button', 'افزودن / تازه‌سازی اصل سفارش');
    load.type = 'submit';
    lookupFields.append(load);
    const loaded = make('div');
    lookupFields.append(loaded);
    deps.root.append(lookup);
    lookup.addEventListener('submit', (event) => {
      event.preventDefault();
      if (blocked || reviewed) return;
      const turn = generation;
      load.disabled = true;
      const requested = reference.value;
      void (async () => {
        const result = await deps.api<{ data: Order }>(
          lookupKind.value === 'id'
            ? '/purchasing/operational-orders/' + requested
            : '/purchasing/operational-orders/lookup',
          lookupKind.value === 'id' ? undefined : { orderReference: requested },
        );
        const lines: Row[] = [];
        let cursor: string | undefined;
        const pages: HTMLElement[] = [];
        do {
          const p = await deps.api<{ data: Page }>('/purchasing/receiving/orders/query', {
            orderId: result.data.orderId,
            view: 'LINES',
            limit: 20,
            ...(cursor ? { afterId: cursor } : {}),
          });
          if (turn !== generation) return;
          lines.push(...p.data.items.map((line) => ({ ...line, snapshotAt: p.data.snapshotAt })));
          pages.push(
            make(
              'p',
              `اصل ${result.data.orderReference} · زمان صفحه: ${p.data.snapshotAt ?? 'ارائه نشده است'}`,
            ),
          );
          cursor = p.data.nextAfterId;
        } while (cursor);
        if (turn !== generation) return;
        lines.sort((a, b) => (a.position as number) - (b.position as number));
        orders.set(result.data.orderId, { ...result.data, lines });
        for (const line of lines)
          progress.set(`${result.data.orderId}/${String(line.lineId)}`, {
            orderId: result.data.orderId,
            lineId: String(line.lineId),
            count: String(line.acceptedUnitCount),
          });
        loaded.replaceChildren(
          ...pages,
          make(
            'p',
            `سفارش‌های آماده: ${[...orders.values()].map((o) => o.orderReference).join('، ')}`,
          ),
        );
        const canonical = make('details');
        canonical.append(
          make('summary', 'اصل سفارش و خطوط دریافت‌شده از سرور'),
          deps.render({ orderId: result.data.orderId, orderReference: result.data.orderReference }),
          ...lines.map((line) => deps.render(line)),
        );
        loaded.append(canonical);
        refreshOrders();
        deps.message('اصل سفارش و تمام صفحات پیشرفت دریافت شد؛ خط هر واحد را انتخاب کنید.');
      })()
        .catch((error: unknown) => {
          if (turn === generation) deps.failure(error);
        })
        .finally(() => {
          if (turn === generation) load.disabled = false;
        });
    });
    const form = make('form');
    form.method = 'post';
    fields = make('fieldset');
    fields.append(make('legend', 'اطلاعات همین ورود و واحدهای حاضر'));
    const grid = make('div');
    grid.className = 'grid';
    fields.append(grid);
    for (const [name, text, required, pattern] of [
      ['arrivalDateJalali', 'تاریخ ورود (جلالی، الزامی)', true, '[0-9]{4}-[0-9]{2}-[0-9]{2}'],
      ['originNetKg', 'وزن خالص گزارش مبدأ (W2، کیلوگرم، الزامی)', true, '[0-9]+(\\.[0-9]+)?'],
      [
        'destinationNetKg',
        'وزن خالص باسکول مقصد (W3، کیلوگرم، اختیاری)',
        false,
        '[0-9]+(\\.[0-9]+)?',
      ],
      ['truckNumber', 'شماره کامیون (اختیاری)', false, undefined],
      ['originatingCompany', 'شرکت ارسال کننده (مبدا، اختیاری)', false, undefined],
      ['driverName', 'نام راننده (اختیاری)', false, undefined],
    ] as const)
      header[name] = input(grid, text, `receive-${name}`, required, pattern);
    header.originNetKg!.maxLength = header.destinationNetKg!.maxLength = 65536;
    fields.append(
      make(
        'p',
        'تاریخ YYYY-MM-DD با رقم لاتین، جلالی ۱۲۰۶ تا ۱۴۹۸؛ وزن‌ها با رقم لاتین و ممیز نقطه عیناً نگهداری می‌شوند.',
      ),
    );
    waybillList = make('div');
    receiptList = make('div');
    fields.append(waybillList);
    button(fields, 'افزودن بارنامه به همین ورود', addWaybill);
    fields.append(receiptList);
    button(fields, 'افزودن رسید انبار به همین ورود', addReceipt);
    weightSource = select(fields, 'بارنامهٔ مرجع وزن کل محموله', 'receive-weight-source');
    weightSource.required = true;
    docSelects.set(weightSource, 'waybill');
    unitList = make('div');
    fields.append(unitList);
    button(fields, 'افزودن واحد فیزیکی', addUnit);
    const reviewButton = make('button', 'بازبینی دریافت پیش از تأیید');
    reviewButton.type = 'submit';
    fields.append(reviewButton);
    form.append(fields);
    deps.root.append(form);
    review = make('div');
    review.hidden = true;
    deps.root.append(review);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (blocked || reviewed) return;
      try {
        const intent = payload(),
          command = JSON.parse(
            commandBody('ConfirmPurchaseReceiving', 'inbound-arrival', intent.payload),
          ) as Row;
        command.preconditions = intent.preconditions;
        const body = JSON.stringify(command);
        if (new TextEncoder().encode(body).length > 256 * 1024)
          throw new Error('اندازهٔ اطلاعات از سقف درخواست بیشتر است؛ پیش از ارسال بررسی کنید.');
        reviewed = body;
        fields!.disabled = true;
        review!.replaceChildren(
          make('h3', 'بازبینی نهایی — این تأیید اثر موجودی دارد'),
          make(
            'p',
            `محل: ${deps.location!.label} · ${units.length} واحد فیزیکی مستقل. اصل سفارش تغییر نمی‌کند. برای اصلاح، پیش از تأیید به فرم برگردید.`,
          ),
        );
        const {
          units: enteredUnits,
          waybills: enteredWaybills,
          warehouseReceipts: enteredReceipts,
          ...arrivalHeader
        } = intent.payload;
        review!.append(
          deps.render(arrivalHeader),
          make('h4', 'بارنامه‌های همین ورود'),
          ...enteredWaybills.map((doc) => deps.render(doc)),
          make('h4', 'رسیدهای انبار همین ورود'),
          ...enteredReceipts.map((doc) => deps.render(doc)),
        );
        const compare = make('div');
        for (const unit of units) {
          const orderId = unit.controls.get('orderId')!.value,
            lineId = unit.controls.get('lineId')!.value;
          const original = orders.get(orderId)?.lines.find((l) => l.lineId === lineId);
          const pair = make('section');
          const entered = enteredUnits.find((u) => u.receivedUnitId === unit.id)!;
          const actualPreview = { ...entered.actual };
          for (const name of Object.keys(kinds)) {
            const option = deps.catalogues().find((o) => o.optionId === actualPreview[name]);
            if (option) actualPreview[name] = { optionId: option.optionId, label: option.label };
          }
          pair.append(
            make('h4', `شماره سیستم: ${unit.controls.get('internalSystemCode')!.value}`),
            deps.render({
              internalSystemCode: entered.internalSystemCode,
              productNumber: entered.productNumber,
              acceptance: entered.acceptance,
              weightEvidenceReference: entered.weightEvidenceReference,
              waybill: enteredWaybills.find((doc) => doc.waybillId === entered.waybillId),
              warehouseReceipt: enteredReceipts.find((doc) => doc.receiptId === entered.receiptId),
            }),
          );
          const specifications = make('div');
          specifications.className = 'grid';
          const ordered = make('div'),
            actual = make('div');
          ordered.append(
            make('h4', `اصل سفارش: ${orders.get(orderId)?.orderReference ?? 'بدون ارتباط'}`),
            original ? deps.render(original) : make('p', 'ارتباط بدون خط سفارش'),
          );
          actual.append(make('h4', 'مقادیر واقعی پیشنهادی'), deps.render(actualPreview));
          specifications.append(ordered, actual);
          pair.append(specifications);
          compare.append(pair);
        }
        review!.append(compare);
        confirm = button(
          review!,
          'تأیید نهایی دریافت و ثبت موجودی',
          handle(async () => {
            if (blocked || !reviewed) return;
            const frozen = reviewed;
            await deps.submit(frozen);
          }),
        );
        confirm.id = 'confirm-receiving';
        button(review!, 'بازگشت به فرم دریافت', () => {
          if (blocked) return;
          reviewed = undefined;
          review!.hidden = true;
          fields!.disabled = false;
        });
        review!.hidden = false;
        confirm.focus();
      } catch (error) {
        deps.message(error instanceof Error ? error.message : 'اطلاعات دریافت معتبر نیست.');
      }
    });
    addWaybill();
    addReceipt();
    addUnit();
    setBlocked(blocked);
  }
  function reject() {
    reviewed = undefined;
    if (review) review.hidden = true;
    setBlocked(blocked);
  }
  return { clear, setBlocked, refreshCatalogues, show, reject };
}
