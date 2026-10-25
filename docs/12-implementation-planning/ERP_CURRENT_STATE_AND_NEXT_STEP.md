---
id: PLAN-ERP-CURRENT-ASSESSMENT-001
title: ERP current state and next development recommendation
phase: 12-implementation-planning
status: in_review
version: 1.0.0
owners: [delivery-lead, chief-solution-architect]
depends_on: [APR-039, APR-043, PLAN-IMPLEMENTATION-BACKLOG-001, AUDIT-INBOUND-001]
last_reviewed: 2026-10-25
approval: null
---

# ارزیابی وضعیت واقعی ERP و پیشنهاد گام بعد

## Part 1 — خلاصه مدیریتی

**پایهٔ تراکنشی ERP و ۱۳ قابلیت محدود بک‌اند پیاده‌سازی و رسماً پذیرفته شده‌اند؛ محصول هنوز ابزار قابل‌استفادهٔ روزمره برای کارکنان کارخانه نیست.** هیچ برنامهٔ frontend، صفحهٔ عملیاتی، فرم فارسی/RTL یا آزمون مرورگر در مخزن وجود ندارد. خرید تا دریافت از نظر بک‌اند کامل و ممیزی‌شده است، ولی اپراتور خرید و انبار هنوز نمی‌توانند آن را با یک رابط کاربری محصول اجرا کنند. فروش، رزرو، ارسال، تولید، ردیابی و ثبت شواهد اسناد نیز بک‌اند دارند؛ این به معنی تکمیل تمام شاخه‌های این حوزه‌ها نیست.

برای کل پروژه **درصد قابل‌دفاع وجود ندارد**: مخرج مصوب و وزن یکسانی برای قابلیت، رابط کاربری، بازیابی، UAT و استقرار تعریف نشده است. «۱۳ قابلیت پذیرفته‌شده» و «۵۹ الزام تأییدشده از ۶۰ شناسهٔ خرید/دریافت، به‌علاوه یک مورد خارج از دامنهٔ بک‌اند» معیارهای محدود خود هستند؛ هیچ‌یک درصد پیشرفت کل ERP نیستند. سه قابلیت اول عمدتاً زیرساخت‌اند و چند قابلیت متعلق به یک ماژول‌اند.

**پیشنهاد اصلی:** «رابط عملیاتی فارسی خرید — ورود امن، ثبت و بازیابی سفارش، کاتالوگ‌های مشترک و مشاهدهٔ دریافت». این یک برش عمودی کوچک روی I1 و خواندن I2 است؛ همراه با رفع کنترل‌شدهٔ مانع واقعی اتصال مرورگر. پس از آن، رابط ثبت و تأیید دریافت ACT-WH تکمیل می‌شود تا نخستین گردش کار کامل کارخانه قابل آزمایش شود. افزودن Finance پولی، دستگاه باسکول یا طراحی مجدد معماری مقدم بر این کار نیست.

مبنای بررسی، `main` در `540ce050ca3ceb07820093267f47c9efbaf55872`، working tree پاک در آغاز و کد/SQL/قراردادهای فعلی است. هیچ application/test/SQL/gate تغییر نکرد و هیچ محصولی اجرا یا مستقر نشد. دستور Owner فقط ارزیابی و مستندسازی را مجاز می‌کند؛ پیشنهاد بعدی **NOT AUTHORIZED** است.

### معنی شواهد و وضعیت‌ها

- **VERIFIED BY CODE**: مسیر اجرایی/ثبت قرارداد/مالک داده در source فعلی بررسی شده است؛ معادل اجرای تازه نیست.
- **VERIFIED BY EXECUTED TEST EVIDENCE**: لاگ یا گزارش اجرای واقعی موجود بررسی شده؛ خواندن assertion به‌تنهایی شاهد اجرا نیست و فقط رفتارِ آزموده‌شده را روشن می‌کند. در این ارزیابی suite محصول دوباره اجرا نشده است.
- **FORMALLY OWNER-ACCEPTED**: دستور واقعی Owner در مرجع پذیرش ثبت شده؛ نه استنباط از `status: accepted` مهندسی.
- **DOCUMENTED BUT NOT IMPLEMENTED**: طراحی یا نیاز وجود دارد اما عملیات محصول متناظر یافت نشد.
- **NOT VERIFIED / UNKNOWN**: شاهد کافی برای وضعیت واقعی محیط/عملیات وجود ندارد.

وضعیت‌های جدول دقیقاً از طبقه‌بندی درخواستی استفاده می‌کنند. **ACCEPTED AND VERIFIED فقط دامنهٔ محدود ردیف را پوشش می‌دهد.** هیچ‌یک از ۱۳ ردیف UI، factory UAT یا production acceptance ندارد. قابلیت مستقلِ تکمیل‌شده و منتظر پذیرش Owner در HEAD یافت نشد؛ بنابراین به‌کاربردن **IMPLEMENTED, AWAITING OWNER ACCEPTANCE** برای I1/I2 نادرست است.

## Part 2 — موجودی قابلیت‌ها

### ۲.۱ سیزده قابلیت بک‌اند پذیرفته‌شده

برای هر ردیف، کد و وضعیت تحویل [S01–S13] در بخش ۹، مرجع پذیرش انسانی و شاهد آزمون جدا آمده‌اند. اعداد `unit / PG` نتایج تاریخی کل suite در زمان همان تحویل‌اند، نه آزمون‌های مختص ردیف و نه اعدادی قابل جمع. رگرسیون نهایی I2 شامل قابلیت‌های قبلی است.

| # / نام مصوب و هدف | پذیرش انسانی؛ commit پیاده‌سازی/مبنای نهایی | رفتار، مرز API/command و persistence واقعی | شاهد اجرا؛ وابستگی و محدودیت پذیرفته‌شده |
| --- | --- | --- | --- |
| 1. SLICE-ENVELOPE foundation؛ اجرای امن و تکرارپذیر فرمان | تأیید foundation در [S02] و سوابق پذیرفته‌شدهٔ [APR-020][A20]؛ `0f722de`؛ baseline معماری APR-018/`e80a04b` | `executeCommand`، registry بسته، outcome/replay، savepoint و audit اتمی؛ `kernel.command_outcome/audit_event/schema_migrations`، 0001–0003؛ health HTTP [C01] | 46 / 30 [S01]؛ زیربنای همه؛ fixture آزمون، قابلیت کسب‌وکار عمومی نیست. گزارش اولیه دارای اجرای تاریخی پیش از تصمیم Windows-only است؛ به اجرای فعلی نسبت داده نمی‌شود. |
| 2. Identity and authorization؛ هویت شخصی و grants جاری | [APR-020][A20] پذیرش `e977b64` را ثبت می‌کند؛ مجوز پیاده‌سازی APR-019 | `IdentityService/IdentityAuthorization`، login/session/logout، account/grant/revoke/password؛ `identity.account/role_grant/session/security_event`، 0004 و توسعهٔ disposition در 0014 [C02] | 51 / 50 [S02]؛ وابسته به envelope/PG؛ بدون UI/SSO/password-recovery؛ تنظیم کاربران واقعی جداست. |
| 3. SLICE-IPS؛ تنها نویسندهٔ موجودی exact kg | [APR-021][A21] پذیرش `2b98d2c` | `InventoryPostingService.post/availability/snapshot/rebuild`، owner ports داخلی؛ `inventory.unit/ledger/balance/reservation`، 0005 [C03] | 57 / 73 [S03]؛ Identity/envelope؛ بدون API عمومی تغییر stock؛ Balance از Ledger مشتق می‌شود؛ ابزار عملیاتی restore کامل نیست. |
| 4. SLICE-PURCHASE receipt increment؛ ورود دستی مستقل | [APR-022][A22] پذیرش `a7bf877` | `PostGoodsReceipt`، دریافت/خواندن receipt و inventory unit؛ `procurement.goods_receipt` و `inventory.material_lot`، 0006؛ ReceiptService→InventoryReceiptService→IPS [C04] | 68 / 93 [S04]؛ IPS/Identity؛ PO/ticket اجباری نیست؛ duplicate-code guard جدید I2 عمداً اعمال می‌شود. |
| 5. Sales stock-demand increment؛ تقاضا و تشخیص تأمین | [APR-023][A23] پذیرش `280aa8b` | Draft/Submit/ConfirmSalesOrder، DraftFulfillmentAssessment، RecordFulfillmentStock؛ MAKE بعداً با تولید اضافه شده؛ `sales.customer/sales_order/fulfillment_assessment/make_reference`، 0007/0013 [C05] | 91 / 118 [S05]؛ Identity و read port موجودی؛ تأیید فروش رزرو نیست؛ inquiry/quotation پولی و fulfillment/closure نهایی تحویل نشده‌اند. |
| 6. Reservation increment؛ درخواست و تخصیص موجودی | [APR-024][A24] پذیرش `807ab19` | RequestReservation/ActivateReservation/GetReservation؛ `inventory.reservation_request`، 0008؛ claim/Ledger با IPS؛ CONSUMED و شواهد مصرف در 0009 [C06] | 98 / 147 [S06]؛ تقاضای تأییدشده و IPS؛ اولویت تقاضای زودتر؛ لغو/آزادسازی مستقل/TTL عمومی تحویل نشده؛ consumption در dispatch اکنون موجود است. |
| 7. Shipment increment؛ بسته‌بندی و خروج کالای رزروشده | [APR-025][A25] پذیرش `40630e0` | Draft/Pack/Unpack/AssignPackage، Draft/Ready/Loading/DispatchShipment؛ `shipping.package/package_content/shipment/dispatch`، 0009–0010؛ Inventory.dispatch→IPS [C07] | 107 / 173 [S07]؛ Sales+reservation؛ واحد کامل؛ پایان فعلی DISPATCHED است، نه اثبات تحویل مشتری یا بسته‌شدن Sales. |
| 8. SLICE-MAKE؛ تولید مسیرمند و تراز جرم | [APR-026][A26] پذیرش نهایی `e5997f5`؛ implementation `9dd5cbb` | ProductionOrder/route/operation/allocation؛ CompleteProductionOperation با consumption/output/residual/scrap/WIP/final؛ `production.*`، `inventory.production_issue/production_origin`، `sales.make_reference`؛ 0011–0014 [C08] | 134 / 203 [S08]؛ Sales MAKE+IPS+مجوز disposition؛ تراز دقیق بدون تلورانس اختراعی؛ QC/rework/شاخه‌های حل‌نشدهٔ stop/cancel خارج از تحویل. |
| 9. Genealogy Projection and Trace؛ ردیابی مبتنی بر منبع | [APR-027][A27] پذیرش `601e52a` | `GenealogyProjection.trace` و TraceForward/TraceBackward؛ read-only snapshot از منابع دریافت، تولید و shipping؛ جدول مستقل genealogy/cache ایجاد نشده [C09] | 159 / 216 [S09]؛ منابع واقعی producerها و customer scope؛ I2 منبع RECEIVING_UNIT اضافه کرده؛ graph خارجی Graphify این قابلیت نیست. |
| 10. SLICE-PURCHASE purchasing increment؛ شواهد خرید انجام‌شده/پیش‌فاکتور ارسال‌شده | [APR-028][A28] و follow-up در [S10]؛ `b261979` | RecordCompletedPurchase/RecordPurchaseProformaSent و خواندن مجاز؛ `procurement.completed_purchase/purchase_proforma_sent`، 0015 [C10] | 170 / 240 [S10]؛ Identity/envelope؛ ثبت شاهد سند، نه ارسال پیام، تأیید تأمین‌کننده، مبلغ یا ثبت stock؛ از I1 مستقل است. |
| 11. Finance-Lite — Invoice Evidence First؛ شاهد فاکتور صادرشده | [APR-029][A29]؛ `67e3346` | RecordIssuedInvoiceEvidence/GetIssuedInvoiceEvidence؛ `finance.invoice_evidence`، 0016؛ Sales owner port تطبیق order/customer؛ ACT-SALES ثبت و ACT-FIN خواندن [C11] | 177 / 260 [S11]؛ Sales+Identity؛ قیمت، مالیات، صدور قانونی، پرداخت و تخصیص تسویه وجود ندارد؛ کل Finance-Lite کامل نیست. |
| 12. I1 — Operational Purchase Orders؛ اصل سفارش و کاتالوگ مشترک | [APR-039][A39]؛ `e3462fc` | RegisterOperationalPurchaseOrder/AddInboundCatalogueOption؛ lookup با شماره یا ID و فهرست catalogue؛ سه جدول `procurement.inbound_catalogue_option/operational_purchase_order/operational_purchase_order_line`، 0017 [C12] | 184 unit؛ 306 PG متمایز: full305+focused5 با4هم‌پوشانی [S12]؛ Identity/envelope؛ اصل ثابت، 128خط، تاریخ جلالی/مقادیر exact؛ بدون stock و بدون فهرست عمومی سفارش‌ها. |
| 13. I2 — Purchase-Linked Warehouse Receiving؛ ورود واقعی و پیشرفت خرید | [APR-043][A43]؛ `b585fd7` | ConfirmPurchaseReceiving/GetReceivingArrival/GetPurchaseOrderReceiving؛ پنج جدول `procurement.inbound_*` و `inventory.inbound_unit_origin`، 0018؛ ReceivingService→InventoryInboundReceivingService→IPS [C13] | 198 / 349 [S13] و SM01 تاریخی ممیزی [AUD]؛ I1+IPS+Identity؛ تغییر اصل/اصلاح پس از تأیید/دستگاه/UI خارج؛ W1 هر واحد و W2/W3 محموله جدا. |

**وضعیت تمام ۱۳ ردیف: ACCEPTED AND VERIFIED** با سه شاهد متفاوت کد، اجرای تاریخی و پذیرش انسانی. frontend تمام ردیف‌ها: **وجود ندارد**. کار باقی‌ماندهٔ مشترک، UI موردنیاز نقش‌ها، اتصال مرورگر، UAT و بهره‌برداری است؛ محدودیت هر ردیف نباید به‌اشتباه نقص در دامنهٔ پذیرفته‌شده تعبیر شود.

### ۲.۲ پوشش کل دامنه و بخش‌های ناتمام

این جدول ردیف‌های دامنه‌ای را تکمیل می‌کند؛ اعدادش مخرج درصد پیشرفت نیستند. scope از [backlog][B]، [roadmap][R]، [command catalogue][CMD] و تصمیم‌های جدیدتر به دست آمده، نه از فهرست عمومی ماژول‌های ERP.

| قابلیت/هدف | وضعیت فعلی | آنچه واقعاً هست / آنچه نیست؛ باقی‌مانده و وابستگی |
| --- | --- | --- |
| خرید عملیاتی و دریافت معمول بک‌اند | ACCEPTED AND VERIFIED | I1/I2 و receipt مستقل، جدول و API و آزمون بالا؛ frontend ندارد. |
| ادارهٔ هویت به‌عنوان تجربهٔ کاربر | PARTIALLY IMPLEMENTED | Identity API و provisioning موجود؛ صفحهٔ ورود/مدیریت حساب و رفتار shared terminal وجود ندارد؛ پایهٔ UI به آن وابسته است. |
| تجربهٔ اپراتور خرید/انبار | REQUIREMENTS DEFINED, NOT DESIGNED | 23فیلد و رفتارهای مصوب مشخص؛ طراحی جزئی صفحه/تعامل و source frontend وجود ندارد. نیازی به دور تازهٔ تحلیل کسب‌وکار I1/I2 نیست؛ طراحی محدود همراه پیاده‌سازی UI انجام می‌شود. |
| موجودی و stock visibility عملیاتی | PARTIALLY IMPLEMENTED | IPS، GetInventoryUnit و availability موجود؛ مرور/جست‌وجوی عملیاتی موجودی و صفحهٔ اپراتور نیست؛ stock mutation عمومی نباید اضافه شود. |
| فروش از inquiry تا fulfillment/closure | PARTIALLY IMPLEMENTED | demand STOCK/MAKE تأییدشده اجرا می‌شود؛ inquiry/quotation، not-feasible/unfulfilled و close/hold/cancel در کاتالوگ مفهومی‌اند؛ state فعلی Sales فقط DRAFT/SUBMITTED/CONFIRMED/IN_PRODUCTION است. سیاست‌های وابسته و producer تحویل/fulfillment باید پیش از شاخهٔ مربوط روشن باشند [C05][CMD]. |
| رزرو کامل در چرخهٔ عمر سفارش | PARTIALLY IMPLEMENTED | request/activate/dispatch-consume موجود؛ cancellation/release مستقل و اثر تغییر سفارش کامل نیست؛ به Sales policy و bundle مالک وابسته است. |
| ارسال تا تحویل و انعکاس در Sales | PARTIALLY IMPLEMENTED | dispatch پذیرفته‌شده؛ proof/record delivery و fulfillment/closure محصول نیست؛ بر [S07] و قرارداد Sales متکی است، نه حدس از enumهای معماری. |
| تولید و باقیمانده در دامنهٔ APR-025 | ACCEPTED AND VERIFIED | تولید مسیرمند و تصمیم انسانی disposition موجود؛ UI و UAT لازم؛ شاخه‌های stop/cancel/rework حل‌نشده، قابلیت پذیرفته‌شده محسوب نمی‌شوند [S08]. |
| ردیابی منبع‌محور | ACCEPTED AND VERIFIED | trace دوطرفه API موجود؛ صفحهٔ قابل‌فهم ردیابی/گزارش نیست؛ کاربر داخلی مجاز ACT-WH/SALES/SEC فقط trace محدودهٔ مشتری انتخاب‌شده را می‌بیند؛ ACT-CUST مجاز نیست و portal مشتری وجود ندارد [S09]. |
| شواهد اسناد خرید و فاکتور فروش | ACCEPTED AND VERIFIED | ثبت/خواندن بدون مبلغ؛ UI لازم؛ اسناد تجاری کامل یا ارسال بیرونی نیست [S10][S11]. |
| Finance-Lite پولی، payment و allocation | REQUIREMENTS DEFINED, NOT DESIGNED | module فعلی فقط invoice_evidence؛ schema/command پرداخت و open-balance نیست. سیاست مبلغ/ارز/مالیات/تخصیص/اصلاحِ باقی‌مانده نیازمند تصمیم واقعی است؛ فعلاً deferred [backlog، §9][B][S11]. |
| گزارش عملیاتی/جست‌وجوی audit | PARTIALLY IMPLEMENTED | domain reads، trace، progress دریافت و audit durable موجود؛ report adapter، جست‌وجوی عمومی audit و UI گزارش محصول نیست؛ گزارش‌ها با producer و مجوز خواندن تحویل شوند [backlog، §11][B]. |
| portal مشاهدهٔ مشتری | DESIGNED, NOT IMPLEMENTED | قرارداد customer isolation و ACT-CUST هست؛ برنامهٔ portal نیست؛ قالب اسناد و دسترسی از OQ-010/تصمیم‌های مصوب، نه نمایش همهٔ داده‌ها [backlog، §11][B]. |
| print/live notices و export مجاز | DESIGNED, NOT IMPLEMENTED | ADP-PRINT/ADP-LIVE/ADP-REPORT/ADP-GL-EXPORT برچسب‌های معماری‌اند؛ executable adapter یافت نشد. بدون نیاز عملیاتی مشخص، پیش‌نیاز UI خرید نیستند [B][R]. |
| SLICE-REVERSE، اصلاح پس از تأیید | DESIGNED, NOT IMPLEMENTED | command عمومی معکوس‌سازی receipt وجود ندارد؛ وجود originalLedgerId در kernel اثبات گردش اصلاح نیست. سیاست، source compensation و SoD لازم؛ صراحتاً خارج از I1/I2 و گام بعد [backlog، §12][B]. |
| SLICE-RESTORE و بازیابی عملیاتی | PARTIALLY IMPLEMENTED | IPS.rebuild، trace از source و recovery admission fence موجود؛ اجرای restore کامل، orchestration و drill با RPO/RTO اثبات نشده؛ جدول genealogy تازه/worker مستقل را ضرورت فرض نکنید [C03][DR]. |
| SLICE-CUTOVER / OpeningStockImport | DESIGNED, NOT IMPLEMENTED | فقط قواعد و runbook labels؛ source فایل/کد/sign-off/freeze OQ-015/019 و command مالک لازم؛ تست reset جای import موجودی اول دوره نیست [CUT][backlog، §13][B]. |
| runtime محلی، migrations و CI | PARTIALLY IMPLEMENTED | backend executable، runner migration و Windows CI موجود؛ release/deploy، backup و نظارت عملیاتی آماده نیستند؛ محیط production خارجی UNKNOWN [OPS]. |
| factory UAT، آموزش و rollout | NOT STARTED | برنامه/labels موجود؛ شاهد اجرای UAT یا تأیید production در repository یافت نشد. منظور وضعیت شواهد پروژه است، نه ادعای اطلاع از کار خارج مخزن [CUT]. |
| دستگاه باسکول / ثبت مستقل ticket | OUT OF APPROVED SCOPE | خارج از بک‌اند پذیرفته‌شده و مرحلهٔ بعد؛ مسیر آیندهٔ مشروط در backlog هست، پروتکل و اختیارات مربوط جداست. W2/W3 فعلی را «باسکول پیاده‌سازی‌شده» حساب نکنید [AUD][backlog، §10][B]. |
| QC، portal ordering، legal GL، چند سایت | OUT OF APPROVED SCOPE | طبق MVP/تعویق‌های موجود؛ مانع آغاز UI یا دلیل افزودن ماژول جدید نیستند [R][B]. |

`[B §n]` در متن جدول یعنی بخش n از backlog [B]؛ نام‌های منطقی معماری همیشه واحد deployable یا command اجرایی نیستند.

## Part 3 — معماری و یکپارچگی واقعی

### ۳.۱ برنامه، داده و تراکنش

**VERIFIED BY CODE:** [package.json][PKG] فقط دو workspace دارد: `apps/backend` و `packages/shared-kernel`. [main.ts][MAIN] تنظیمات را می‌خواند و [compose][COMPOSE] یک `node:http` backend را با `pg` مستقیم می‌سازد. stack ثبت‌شده Node24.21.0، npm11.19.0، TypeScript6.0.3 و pg8.23.1 است؛ کنترل سازگاری PG دقیقاً180006 و UTF8 را می‌خواهد. این‌ها نسخهٔ repository هستند، نه ادعای آخرین نسخهٔ بازار. NestJS/React/ORM یا سرویس مستقل worker در برنامهٔ فعلی وجود ندارد.

ماژول‌های کد: Identity، Inventory، Procurement، Sales، Shipping، Production، Finance و Genealogy. هر ماژول قراردادهای public/index و port مالک خود را دارد؛ `infrastructure/postgresql` SQL adapterها را نگه می‌دارد. shared-kernel شامل context، command registry، admission، canonical JSON/binding، execute/outcome، guards و audit است؛ منطق کسب‌وکار را مالک نمی‌شود. [boundary checker][BOUND] وابستگی و مالکیت را کنترل می‌کند. معماری Modular Monolith مصوب با مسئلهٔ مادیِ نیازمند تعویض مواجه نشده است.

۱۸ migration مرتب در `database/migrations` وجود دارد؛ schemaهای `kernel/identity/inventory/procurement/sales/shipping/production/finance` مالک داده‌اند. `GenealogyProjection` از source ports می‌خواند، نه از جدول genealogy مستقل. `PostgresTransactions` یک client/transaction واقعی را بین owner ports عبور می‌دهد. audit، outcome و آثار bundle با هم commit می‌شوند. Ledger حقیقت موجودی است؛ Balance قابل بازسازی و `ACT-IPS` تنها poster است. UI نباید هیچ‌کدام را دور بزند.

جریان‌های موجود و محدودیت تعامل آن‌ها:

```text
هویت شخصی و grant جاری → command envelope → owner service → PostgreSQL transaction
I1 سفارش/کاتالوگ → I2 اصل و واقعیت دریافت → Inventory owner → IPS → Ledger/Balance
دریافت مستقل قدیمی ──────────────────────→ Inventory owner → IPS
Sales demand → reservation → package/shipment → dispatch → IPS
Sales MAKE → Production/route/allocation → CompleteProductionOperation → IPS
receiving/production/shipment source facts → Genealogy read projection
Sales order/customer → Invoice evidence (بدون بستن Sales و بدون تسویه)
```

اتصال اخیر از PO به receiving و stock واقعی است، ولی این زنجیره‌ها اثبات یک سفر مرورگری دریافت→فروش→تولید→ارسال در کارخانه نیستند. خط فروش پس از dispatch خودکار CLOSED نمی‌شود؛ این محدودیت صریح کد و [S07] است.

### ۳.۲ هویت، frontend و مانع اتصال مرورگر

**VERIFIED BY CODE:** Identity از حساب شخصی، scrypt، opaque bearer token با digest ذخیره‌شده، انقضای absolute/idle، logout/revoke و grants سمت سرور استفاده می‌کند. role header فقط انتخاب نقش است؛ `identity.context/isCurrent` مرجع مجوز است. ACT-SEC مجوز خودکار خواندن همهٔ خرید/دریافت ندارد. customer isolation در read/write/replay اعمال می‌شود. ابزارهای provisioning ادمین و customer وجود دارند؛ roster واقعی و اختیار اشخاص از وجود ابزار استنباط نمی‌شود [C02][IDHTTP][COMPOSE].

**هیچ frontend معناداری وجود ندارد:** نه workspace، نه HTML/CSS/TSX/Vue/Svelte صفحهٔ محصول، نه routing/session UI، navigation نقش‌محور، فرم/feedback، فارسی/RTL یا test مرورگر. [HTTP host][HOST] تنها health و API routeها را dispatch می‌کند و static page نمی‌سرویس‌دهد. قابلیت ذخیرهٔ Unicode و Jalali بک‌اند معادل رابط فارسی نیست.

**مانع یکپارچگی قطعی:** `createIdentityHandler`، `createInboundHandler` و `createReceivingHandler` درخواست دارای Origin را رد می‌کنند [IDHTTP][I1HTTP][I2HTTP]. در نتیجه اتصال معمول POST مرورگر حتی با same-origin hosting، بدون تغییر محدود transport کار نمی‌کند. این کنترل عمدیِ دورهٔ backend-only است، نه نقض پذیرش I1/I2. حذف کورکورانهٔ Origin یا wildcard CORS توصیه نمی‌شود؛ نخستین UI باید origin/session/CSRF boundary را برای routeهای لازم مشخص، پیاده و با مرورگر واقعی آزمایش کند. مجوز نقش/stock/discrepancy سمت سرور می‌ماند.

### ۳.۳ کفایت قراردادها برای کاربران کارخانه

| نقش / کار واقعی | قرارداد موجود و کفایت | کار UI / محدودیت مشخص |
| --- | --- | --- |
| ACT-PROC ثبت سفارش چندخطی | RegisterOperationalPurchaseOrder؛ 12فیلد خرید،7الزامی/5اختیاری، UUID/ordinal مستقل،128خط [C12] | فرم فارسی چندخطی؛ ثبت یک‌بارهٔ اصل؛ numeric string و Jalali حفظ شوند؛ تبدیل مخفی به float/Gregorian ممنوع. |
| PROC و WH انتخاب/افزودن نوع/کیفیت/رنگ | AddInboundCatalogueOption و ListInboundCatalogueOptions، exactLabel و pagination [C12] | add/select برای هر دو نقش؛ duplicate به انتخاب مجاز منجر شود؛ کاتالوگ جدید موفق با خطای بعدی سفارش حذف نمی‌شود. |
| مشاهدهٔ سفارش ثبت‌شده و اصل آن | lookup با reference یا GetOperationalPurchaseOrder با ID [I1HTTP] | lookup شناخته‌شده کافی است؛ **فهرست/جست‌وجوی عمومی همهٔ سفارش‌ها وجود ندارد**. نبود آن نقص ممیزی I1 نیست؛ برای گام اول endpoint جدید لازم نیست. |
| PROC مشاهدهٔ دریافت و مغایرت‌ها | GetPurchaseOrderReceiving، view=LINES/RECEIVED_UNITS، afterId/limit [C13] | تمام صفحات و همهٔ فیلدهای مجاز؛ اصل/واقعی/actor/progress جدا؛ فقط بار مرتبط با سفارش، نه ورود مشترک کامل. |
| WH lookup و مشاهدهٔ مشخصات اصل | همان I1 readها با ACT-WH [C12] | lookup قبل از فرم دریافت؛ بدون حق تغییر اصل سفارش. |
| WH ورود مشترک، بارنامه‌ها و واحدهای متعدد | ConfirmPurchaseReceiving: arrival/waybills/warehouseReceipts/units، ORDER_LINE/ORDER_ONLY/UNLINKED [C13] | فرم header مشترک و rows واحد واقعی؛ Internal System Code دستی، productNumber و اسناد خارجی مستقل؛ UUID فنی در UI مدیریت شود. |
| WH مقدار واقعی/مغایرت/پذیرش صریح | actual و acceptance؛ expected progress در preconditions؛ سرور نوع مغایرت/اضافه‌تحویل/تغییرW1 را کنترل می‌کند [C13] | نمایش اصل کنار واقعی و اقدام صریح؛ prechecked acceptance یا تبدیل خودکار mismatch به مجاز ممنوع؛ stale progress باید بازخوانی شود. |
| WH افزودن catalogue و ثبت stock | catalogue add موجود؛ Inventory.resolveInboundMaterialType طبقه‌بندی finite دارد [C13] | هر label تازه لزوماً نوع فنی پشتیبانی‌شده نیست؛ خطای همان option/unit باید قابل‌فهم باشد. افزودن OTHER یا صفحهٔ mapping جدید مجاز نیست. |
| WH تأیید و پیگیری نتیجه | ConfirmPurchaseReceiving، GetReceivingArrival و same-key replay [I2HTTP] | تأیید نهایی/خطا/عدم قطعیت جدا؛ timeout شکست قطعی نیست؛ تا حل نتیجه همان intent/key حفظ شود؛ بازیابی read/retry باید آموزش داده شود. |
| نمایش W1/W2/W3 و همهٔ23فیلد | backend/readback مصوب و SM01 موجود [AUD] | W1 هر واحد مبنای stock؛ W2/W3 وزن سند کل محموله؛ جمع‌زدن تکراری header به ازای هر row/PO یا تخصیص خودکار به واحد ممنوع. |

بک‌اند به‌لحاظ قواعد این گردش کار کفایت دارد؛ شکاف اصلی browser transport و UI است. ظرفیت256KiB و صفحات محدود باید در UI رعایت شود؛ سقف128 مربوط به هر invocation IPS است، نه کل arrival. `locationId` و شناسه‌های فنی در contract موجودند اما مدیریت مکان‌ها/نام‌گذاری محل در UI تحویل نشده؛ برای دریافت باید از پیکربندی واقعی محل استفاده شود، نه ساخت UUID دلخواه یا افزودن فیلد کسب‌وکار اجباری به23فیلد. این نیاز راه‌اندازی/طراحی محدود دریافت است، نه بازگشایی قوانین I2.

دیگر صفحات لازم به‌ترتیب کاربرد: موجودی و رزرو برای WH/SALES؛ تقاضا و تأمین برای SALES؛ بسته/بارگیری/dispatch برای SHIP؛ مسیر/تخصیص/operation و disposition مجاز برای PLAN/OP؛ trace؛ ثبت/خواندن purchase/proforma/invoice evidence؛ مدیریت کاربران برای SEC. هر UI تنها routeهای مربوط و error/replay/isolation همان قابلیت را فعال کند؛ ساخت dashboard عمومی مقدم نیست.

### ۳.۴ runtime، CI و عملیات

| موضوع | شاهد موجود | خلأ یا مرز اثبات |
| --- | --- | --- |
| تنظیمات و secrets | [config][CONFIG] اعتبارسنجی env و INSTALLATION_ID؛ `.env.example` placeholder؛ جدایی runtime/DDL owner در tooling؛ secret در گزارش خوانده/کپی نشده | سامانهٔ مدیریت/چرخش secrets واقعی و configuration production بررسی نشده؛ UNKNOWN. |
| شبکه و session | production HOST فقط loopback و نیاز TLS terminator؛ bounded body/header/timeout/login throttling [CONFIG][IDHTTP] | asset عملیاتی TLS/gateway/process supervisor در tracked repository یافت نشد؛ نبود استقرار بیرون مخزن اثبات نشده. |
| migration | [migrate.mjs][MIG]، inventory ثابت0001–0018، checksum، advisory lock، transaction هر migration | applied state دیتابیس زنده در این ارزیابی خوانده نشده؛ ترتیب فایل‌ها صحیح است، نه اثبات نصب محیط کارخانه. |
| logging/health | JSON allowlist logger، health live/ready و audit durable [LOG][HOST] | composition از logger برای host start/stop استفاده می‌کند؛ pipeline metrics/alerts/retention/اپراتور مسئول اثبات نشده؛ logger به‌تنهایی monitoring کامل نیست. |
| build/CI | [Windows verify.yml][CI]: npm ci، preflight، advisory audit، format/lint/boundaries، tsc build و unit | DB integration CI و release/deploy job ندارد؛ اجراهای PG واقعی محلی وجود دارند. آخرین وضعیت CI روی GitHub UNKNOWN. |
| backup/recovery | recovery admission fence و IPS.rebuild موجود؛ [DR] سیاست RPO≤60دقیقه/RTO≤8ساعت، daily/offsite/restore test | backup/restore اجرایی و drill اثبات‌شده یافت نشد؛ daily backup به‌تنهایی RPO60دقیقه را ثابت نمی‌کند. retention/tool residual باز است؛ پیش‌نیاز rollout است. |
| initialization/cutover | provision-admin و provision-customer؛ source-origin/schema guardها | این‌ها OpeningStockImport نیستند؛ موجودی آغازین/تطبیق/sign-off و بررسی تاریخچهٔ0018 قبل rollout لازم است [CUT][S13]. |

## Part 4 — کارهای باقی‌مانده

### A. بک‌اند واقعاً ناتمام

1. ادامهٔ Sales/Shipping تا fulfillment و closure و unfulfilled demand مصوب؛ producer/contractهای فعلی به CONFIRMED/IN_PRODUCTION و DISPATCHED محدودند. inquiry/quotation و amendment/cancel/hold فقط در شاخهٔ دارای سیاست روشن پیاده شوند؛ نام command در سند، مجوز اجرا یا پاسخ کارخانه نیست [CMD][backlog، §5][B].
2. lifecycle باقیماندهٔ رزرو و تولید فقط همراه اثر مالک و قواعد همان شاخه؛ API دلخواه release یا تغییر مستقیم موجودی قابل قبول نیست. تبدیل انباری باقیماندهٔ Coil بازشده به Sheet در FACT-03/C-07 با CompleteProductionOperation یکی نیست و در [S08] خارج از تحویل باقی مانده؛ بدون پاسخ شاخهٔ مربوط نباید پیاده شود.
3. اصلاح جبرانی/source-linked و ادارهٔ restore/cutover مطابق خانه‌های موجود؛ در گام UI بعدی نیستند. روش رسیدگی به خطای پس از تأیید پیش از rollout باید مشخص باشد؛ این به معنی الزام فوری به ساخت ماژول اصلاح نیست.
4. Finance پولی/payment/allocation آینده و مشروط به تصمیم‌های باز؛ برای استفاده از خرید/دریافت یا normal dispatch شرط تازهٔ مالی ایجاد نمی‌شود [S11][A24].

### B. frontend و تجربهٔ کاربری

نبود UI، مانع فوری ارزش عملیاتی است. ابتدا سفر واقعی خرید، سپس دریافت؛ فارسی/RTL، keyboard، focus/error، validation دقیق، خواندن همهٔ صفحات، شخص/نقش جاری و رفتار shared terminal جزء تحویل‌اند. حفظ مقدار خام و انتخاب کاتالوگ مهم‌تر از افزودن design system یا chart است. نمایش/چاپ برچسب را با ثبت دستی کد یکی ندانید؛ printer integration فقط با نیاز و مجوز خود.

### C. integration

Origin/session bridge، serving/build asset محدود، حفظ idempotency در تجربهٔ مرورگر و تبدیل خطاهای401/403/404/409/422/503 به اقدام قابل‌فهم لازم‌اند. role navigation صرفاً راهنمای UI است. endpointهای موجود برای برش پیشنهادی کافی‌اند؛ اگر بعداً جست‌وجوی بدون شماره برای کار واقعی لازم شد، gap همان read query با scope/pagination بررسی شود، نه API عمومی جدید از روی سلیقه.

### D. آزمون و کیفیت

شاهد PG موجود را تکرار بی‌دلیل نمی‌کنیم. UI نیازمند unit/DOM مناسب، browser E2E واقعی، session/origin/CSRF/XSS، دسترسی خلاف نقش/مشتری، RTL/keyboard، numeric/Jalali، pagination و عدم قطعیت/retry است. تغییر transport آزمون منفی Origin قبلی را هدفمند تطبیق می‌دهد؛ تغییر نکردن قواعد backend با رگرسیون مرتبط اثبات شود. migration/crash/atomicity فقط اگر رفتار مربوط تغییر کند یا ناسازگاری پیدا شود دوباره بررسی می‌شود. پیش از release، advisory evidence تازه لازم است؛ گزارش قدیمی «صفر آسیب‌پذیری» را وضعیت امنیت امروز ننامید.

### E. deployment و عملیات

انتخاب/پیکربندی محدود محیط هدف، TLS و اجرای پایدار، secrets/roles، نصب migration و کنترل0018 روی دادهٔ قبلی، backup/restore/offsite و آزمایش RPO/RTO، logging/alerts و runbook retry/restore لازم‌اند. DB CI می‌تواند با محیط جدا اضافه شود؛ نبود آن دلیل بی‌اعتبارکردن آزمون محلی پذیرفته‌شده نیست. هیچ Docker/queue/service یا ابزار monitoring خاصی توصیهٔ پیش‌فرض نیست.

### F. پذیرش کارخانه

کاربران واقعی و grants، محل‌ها/کاتالوگ اولیهٔ معتبر، نمونهٔ اسناد و مقادیر واقعی، اجرای PROC→WH→PROC توسط خود کاربران، برچسب‌گذاری فیزیکی، خطای اپراتوری و آموزش/retry باید در UAT اثبات شوند. OQ-014 حجم، OQ-015 موجودی اول دوره/sign-off و OQ-019 افراد مربوط در زمان نیاز حل می‌شوند. این ورودی‌ها مانع ساخت UI با fixture آزمایشی نیستند؛ پیش از استفادهٔ واقعی نیاز دارند. هیچ UAT/production approval از پذیرش بک‌اند استنتاج نمی‌شود.

### G. deferred و optional

QC، دستگاه باسکول، ثبت مستقل ticket، legal GL، portal ordering و چندسایت بیرون MVP/دامنهٔ فعلی‌اند. Finance پولی، post-confirmation corrections و external export مسیرهای مشروط بعدی‌اند؛ به مانع آغاز UI تبدیل نمی‌شوند. جست‌وجوی گسترده، live notifications و dashboard تنها با نیاز عملیاتی روشن اولویت می‌گیرند. supplier master، approval hierarchy و تحمل خودکار مغایرت از این ارزیابی ایجاد نمی‌شوند.

## Part 5 — مسیر بحرانی

**کوتاه‌ترین مسیر امن:** مجوز محدود Owner → browser boundary و UI خرید روی I1/خواندن I2 → UI تأیید دریافت → UAT دو نقش → آمادگی محیط/بازیابی و دادهٔ آغازین مرتبط → rollout محدود مجاز. تکمیل تمام Finance یا portal پیش‌نیاز این مسیر نیست.

| وابستگی | اثر بر ترتیب |
| --- | --- |
| Identity+envelope+I1+I2+IPS پذیرفته‌شده | پیش‌نیازهای بک‌اند نخستین UI حاضرند؛ نیاز به معماری/ممیزی عمومی تازه نیست. |
| Origin/session/asset serving | مانع واقعی اجرای browser؛ در همان برش نخست رفع می‌شود، نه یک پروژهٔ زیرساخت جدا. |
| UI خرید/کاتالوگ/lookup و قرارداد خطا/retry | reusable foundation کوچک برای فرم WH؛ جلو انداختن دریافت بدون این بخش تکرار کار می‌آورد. |
| UI WH، دادهٔ واقعی محل و طبقه‌بندی قابل‌پشتیبانی | شرط آزمون کامل دریافت؛ مجهول‌های پیکربندی از policy پذیرفته‌شده جدا می‌مانند. |
| TLS/backup/restore و cutover مرتبط | می‌توان پس از تثبیت مسیر UI موازی با سایر صفحات آماده کرد؛ شرط production است، نه شرط شروع UI. |
| Sales fulfillment/closure | برای پایان واقعی گردش فروش لازم؛ مانع خرید تا دریافت نیست و به payment وابستگی اختراعی ندارد. |
| سیاست‌های deferred | فقط شاخهٔ خود را متوقف می‌کنند؛ OQ باز عمومی، توقف سراسری پروژه ایجاد نمی‌کند. |

ریسک فوری یکپارچگی، فعال‌کردن مرورگر بدون کنترل origin/session و ایجاد retry با key تازه بعد از timeout است. ریسک rollout، دادهٔ افتتاحیه/restore بدون تطبیق outcome و Ledger است. هیچ شاهدی برای نیاز به بازنویسی معماری، microservice یا queue مشاهده نشد.

## Part 6 — نقشهٔ ادامهٔ اولویت‌بندی‌شده

این ترتیب پیشنهاد تحویل است؛ نام incrementها عنوان کاری‌اند و SLICE/مجوز تازه نمی‌سازند. زمان یا درصد ساختگی ارائه نمی‌شود. هر increment meaningful پس از tests/review/acceptance/document/local commit برای Owner push متوقف می‌شود.

| اولویت / increment | نتیجه و deliverable اصلی | وابستگی | Definition of Done و مرز پذیرش |
| --- | --- | --- | --- |
| P1 — رابط عملیاتی فارسی خرید | ورود/session امن، ثبت I1، add/select catalogue برای PROC/WH، lookup اصل، نمایش پیشرفت/مغایرت I2 برای سفارش | پایهٔ۱۳قابلیت؛ مجوز محدود Owner؛ حل transport در خود برش | معیارهای بخش۷؛ E2E واقعی با نقش‌ها/خطا/retry؛ پذیرش تحویل UI محدود، نه receiving write یا production. |
| P2 — رابط تأیید دریافت انبار | arrival مشترک، چندبارنامه/receipt/واحد، اصل/واقعی، کد دستی، acceptance صریح، تأیید اتمی و بازخوانی | P1 و پیکربندی محل/نوع معتبر؛ I2 موجود | PROC سفارش را ثبت کند، WH بخشی/چندورودی/استثنا را آگاهانه بپذیرد، PROC همهٔ مجازها را ببیند؛ no duplicate stock و no sibling leak؛ browser+PG evidence، آمادهٔ UAT خرید/دریافت. |
| P3 — اولین پایلوت کنترل‌شدهٔ خرید/دریافت | UAT واقعی دو نقش، اصلاح UX لازم، آموزش، runtime/TLS و backup/restore، کنترل تاریخچه/catalogue و دادهٔ آغازین موردنیاز | P1/P2؛ محیط/افراد/دادهٔ واقعی؛ افتتاحیه فقط با روش مصوب | sign-off واقعی کارخانه، restore drill و retry/reconciliation، امکان توقف/پشتیبانی؛ مجوز rollout جدا. فقط دامنهٔ این پایلوت پذیرفته شود. |
| P4 — قابل‌استفاده‌کردن stock→Sales→reservation→dispatch | UI موجودی/تقاضا/رزرو/بسته/ارسال؛ سپس fulfillment/unfulfilled/closure در برش مالک با سیاست روشن؛ شواهد invoice | UI/session مشترک و backendهای5–7/11؛ دادهٔ مشتری؛ policy فقط برای شاخهٔ واقعاً افزوده | journey قابل اجرا و مقدار/claim/وضعیت قابل تطبیق؛ API/PG/security و E2E؛ بستن سفارش تابع قواعد Sales، نه پرداخت/فاکتور؛ پذیرش هر برش جدا و کوچک. |
| P5 — تولید، ردیابی و اسناد عملیاتی | صفحات PLAN/OP، route/allocation/completion/disposition، trace و شواهد خرید/فاکتور و گزارش محدود موردنیاز | UI پایه، backend8–11، grants و routing واقعی؛ می‌تواند نسبت به تکمیل شاخه‌های اختیاری P4 مستقل پیش برود | سناریوی واقعی WIP/final/residual/scrap با تراز و lineage، نقش‌ها و گزارش منبع‌پذیر؛ UAT افراد همان حوزه. |
| P6 — تکمیل rollout دامنهٔ ERP | recovery/cutover وسیع‌تر، اصلاحات موردنیاز با policy مصوب، آموزش/حجم/امنیت و انتشار؛ تکمیل نواقص ضروری scope انتخاب‌شده | سفرهای عملیاتی بالا، OQهای واقعاً وابسته و دادهٔ افتتاحیه | rehearsal و تطبیق stock/source/outcome، RPO/RTO، sign-off و readiness واقعی؛ engineering acceptance جای go-live approval نیست. |
| Later / مشروط | Finance پولی/تسویه، portal read-only و exportهای مصوب؛ دستگاه و دیگر deferredها صرفاً با scope مستقل | policy/data/interfaceهای هر مورد | تصمیم و آزمون متناسب همان شاخه؛ هیچ‌کدام به‌صورت خودکار شرط P1/P2 نیست. |

P3 recovery مرتبط را تا P6 عقب نمی‌اندازد. P4/P5 مجموعهٔ محصولی‌اند و در اجرا به همان برش‌های مالک تقسیم می‌شوند؛ یک mega-commit یا چرخهٔ افقی ساخت همهٔ صفحات پیشنهاد نشده است. ترتیب نسبی‌شان پس از بازخورد نخستین UAT می‌تواند بر اساس نیاز واقعی کارخانه تغییر کند، بدون بازطراحی معماری.

## Part 7 — گام فوری پیشنهادی و محدودهٔ دقیق

**نام:** رابط عملیاتی فارسی خرید — ورود امن، ثبت و بازیابی سفارش، کاتالوگ‌های مشترک و مشاهدهٔ دریافت.

**هدف:** ACT-PROC بدون ابزار توسعه، سفارش واقعی چندخطی را ثبت و بازیابی کند و دریافت‌های ثبت‌شدهٔ مرتبط را ببیند؛ ACT-WH بتواند اصل سفارش را lookup و catalogue را add/select کند. هنوز ثبت دریافت از مرورگر در این برش نیست. خانهٔ منطقی `ui-operator` و producerهای I1/I2 موجود در معماری حفظ می‌شوند؛ module کسب‌وکار یا framework تازه پیشنهاد نمی‌شود.

**چرا اول:** هم مسئلهٔ ملموس خرید را حل می‌کند و هم مرز مشترک مرورگر، اعداد، تاریخ، catalogue، نقش و retry لازم برای فرم پرریسک دریافت را با دامنهٔ کوچک‌تر تثبیت می‌کند. backend ثبت/خواندن سفارش stock ندارد؛ receiving-write در P2 از همین پایه استفاده می‌کند. صرف ساخت skeleton/frontend foundation بدون workflow خروجی کافی نیست.

**پیش‌نیازهای حاضر:** پذیرش I1/I2 و ممیزی PASS؛ Identity و session/grants؛ envelope/replay؛ قراردادهای lookup/catalogue/progress؛ SQL نصب‌پذیر و test fixtures واقعی. **کمبود واقعی:** UI/asset serving، browser-safe admission/session lifecycle و آزمون مرورگر. قانون کسب‌وکار تازه‌ای برای این دامنه لازم تشخیص داده نشد. انتخاب فنی محدود transport/session در طرح اجرای همان increment انجام می‌شود؛ نیازمند مرحلهٔ عمومی تحلیل مجدد نیست.

### محدودهٔ implementation پیشنهادی

1. یک رابط کوچک فارسی/RTL با امکانات موجود TypeScript/مرورگر و بدون framework/dependency جدید: login/logout، نمایش session و نقش‌های واقعاً مجاز، وضعیت expiry/revocation و بازگشت امن به login.
2. فعال‌سازی محدود browser برای login/session/logout و I1 routes و خواندن order-progress I2؛ origin مجاز مشخص و آزمون منفی cross-origin/CSRF، حفظ legacy callers مجاز، response security و منع افشای token. اگر تغییر روش session لازم شد، سازگاری bearer فعلی و regression صریح لازم است؛ دورزدن کنترل با strip کردن بی‌قید Origin مجاز نیست.
3. فرم تمام12فیلد خرید، چندخطی، exact units/digits/Jalali طبق profile پذیرفته‌شده؛ Material Type/Quality/Color مشترک با add/select هر دو نقش. optional به mandatory تبدیل نشود؛ تاریخ‌نگار پیچیده یا normalization جدید لازم نیست.
4. ثبت با UUID/key پایدار، نمایش نتیجه و lookup مجدد با شمارهٔ سفارش یا ID؛ read-only اصل برای WH. عمومی‌سازی فهرست همهٔ سفارش‌ها و endpoint جدید جزو این برش نیست.
5. نمایش تمام صفحات LINES/RECEIVED_UNITS سفارش با تمام فیلدهای مجاز، مقدار اصل/واقعی، دریافت/باقی‌مانده و مغایرت/actor؛ وزن‌های محموله از مجموع PO متمایز بماند. برای آزمون این صفحه، receiving موجود از fixture/API داده تولید می‌کند؛ UI تأیید دریافت تحویل‌شده ادعا نمی‌شود.
6. mapping قابل‌فهم خطا، loading/empty/disabled/retry، focus/keyboard و محافظت از intent در قطع پاسخ؛ runtime docs و evidence در canonical page مناسب همان تحویل، نه بستهٔ بزرگ اسناد جدید.

**خارج از دامنه:** receiving-write، ویرایش/لغو سفارش ثبت‌شده، stock logic در browser، تغییر policy/RBAC، افزایش اختیارات ACT-SEC/مشتری، تغییر schema یا قواعد I1/I2، full order-list/search، دستگاه/چاپگر، Finance/QC، supplier master، dashboard عمومی، deployment و پذیرش production. حفظ قواعد پذیرفته‌شده با تغییر محدود transport منافاتی ندارد؛ authorizing آن تغییر باید در دستور اجرای آینده صریح باشد.

### معیارهای پذیرش و آزمون لازم

| معیار قابل مشاهده | اثبات لازم |
| --- | --- |
| login معتبر و navigation نقش‌محور؛ WH نتواند PO ثبت کند؛ grant revoked/expired واقعاً دسترسی را قطع کند | browser E2E روی backend واقعی؛ API negative/Identity regression؛ پنهان‌کردن دکمه به‌تنهایی کافی نیست. |
| ثبت/بازیابی تمام12فیلد، optional absence، خطوط همسان، عدد بزرگ/decimal exact و جلالی boundary | unit/DOM برای تبدیل/نمایش و E2E+PG readback؛ بدون Number rounding، بدون تغییر source reference/catalogue identity. |
| add/select هر سه catalogue توسط PROC و WH؛ duplicate قابل بازیابی | API/PG موجود + E2E race/error؛ استفاده از exact selection، نه get-or-create اختراعی. |
| PROC تمام داده‌های مجاز receiving را با pagination ببیند و sibling/unlinked cargo افشا نشود | E2E سفارش مشترک/بیش از یک صفحه، API isolation regression، دادهٔ واقعی fixture I2. |
| double-click/قطع پاسخ/503 باعث PO تکراری یا key جدید برای همان intent نامعلوم نشود | fault-injection transport و PG outcome/readback؛ re-authentication همان شخص و بازیابی intent پس از interruption آزموده شود؛ token در URL/log/ذخیرهٔ ناامن قرار نگیرد. |
| صفحهٔ فارسی/RTL با keyboard، label/focus/error/empty/loading قابل‌کار باشد | مرور عملی در مرورگر واقعی و سناریوی نمایندهٔ کاربر؛ خطا از ورودی/اسکریپت به HTML خام تبدیل نشود. |
| origin مجاز کار کند، origin نامجاز/هویت جعلی و payload نامعتبر رد شوند | آزمون browser و HTTP، CSRF/XSS/session/resource limits؛ امنیت مستقل و رگرسیون transport متأثر. |
| scope، داده و رفتار پذیرفته‌شده حفظ شود | static/build/lint/boundaries، tests مرتبط Windows، بازبینی مستقل engineering/security، diff و `git diff --check`، local commit؛ نقص required/high/critical باز نماند. |

**تحویل موردانتظار:** UI اجرایی محدود، اتصال امن و تست‌شده، شواهد E2E/PG مرتبط، review و مستند رفتار/محدودیت، local commit قابل بررسی. این acceptance محدود UI است؛ UAT کامل خرید→دریافت و rollout همچنان P2/P3 هستند.

**آیا تصمیم Owner دیگری لازم است؟** پاسخ کسب‌وکار تازه برای I1/I2 لازم نیست؛ **مجوز صریح اجرای همین increment لازم است** چون درخواست حاضر آن را منع کرده. نام کاربران، محل/محیط و دادهٔ واقعی قبل UAT/rollout ارائه می‌شود. topology production و Finance/device policy مانع کدنویسی این برش نیستند. هم‌ترازی gate/unlock فقط پس از مجوز واقعی و در دامنهٔ همان increment انجام شود؛ مقدار true قدیمی APR-042 مجوز UI نیست.

**پیش‌نویس دستور بعدی — NOT AUTHORIZED تا تأیید Owner:**

> «increment رابط عملیاتی فارسی خرید را طبق بخش۷ این گزارش اجرا کن: ورود/session امن، ثبت و lookup سفارش I1، کاتالوگ مشترک PROC/WH و نمایش order-scoped دریافت I2، همراه با تغییر محدود browser transport و آزمون مرورگر واقعی. قواعد/مهاجرت‌ها/اختیارات کسب‌وکار پذیرفته‌شده حفظ شوند؛ framework، schema، receiving-write، deployment و push اضافه نشود. scope/gate فقط مطابق این مجوز محدود ثبت شود؛ tests و review مستقل و مستندسازی/local commit انجام و برای Owner push متوقف شو.»

## Part 8 — ریسک‌ها، اختلاف مستندات و مجهول‌ها

### Git و مبنای قابل تکرار

- **VERIFIED BY CODE / Git:** branch `main`، HEAD آغاز و پایان بررسی محصول `540ce050ca3ceb07820093267f47c9efbaf55872`؛ commit ممیزی موجود است؛ تاریخچهٔ I1 `e3462fc`→پذیرش `4abdfac` و I2 `b585fd7`→پذیرش `ebad816`→ممیزی `540ce05` در ancestors قرار دارد. مبنای نهایی تولید `e5997f5` یک اصلاح مستند شاهد پس از commit اجرای `9dd5cbb` است؛ دو قابلیت جدا محسوب نمی‌شوند.
- working tree آغاز پاک بود. `git rev-list --left-right --count HEAD...origin/main` در شروع `0 0` و `git log '@{upstream}..HEAD'` خالی بود؛ **نسبت به remote-tracking محلی commit عقب‌افتاده‌ای وجود نداشت**. این مقدار پس از local commit همین گزارش یک commit ahead می‌شود.
- تلاش نخست `git ls-remote --heads origin main` در محیط محدود با خطای اتصال HTTPS ناموفق بود؛ تکرار مجازِ فقط‌خواندنی با دسترسی شبکه موفق شد و `refs/heads/main` روی سرور دقیقاً `540ce050ca3ceb07820093267f47c9efbaf55872` بود. بنابراین **همگامی baseline ممیزی/پذیرش با remote در زمان این بررسی تأیید شد**؛ آخرین نتیجهٔ CI همچنان UNKNOWN است. هیچ fetch/push/reset/rebase یا تغییر remote انجام نشد. commit مستندات همین ارزیابی پس از این baseline محلی باقی می‌ماند.
- diff مسیرهای application/packages/database/tools/manifest/lock بین `b585fd7` و HEAD آغاز صفر است؛ ممیزی/پذیرش کد دیگری را پنهانی جایگزین نکرده‌اند. inventory migration0001–0018 با runner هم‌خوان است؛ applied state محیط واقعی UNKNOWN.
- [canonical gate][GATE] هنوز به APR-042 اشاره دارد؛ پذیرش APR-043 و دستور ارزیابی هیچ grant UI تازه‌ای ایجاد نمی‌کنند. این گزارش gate/unlock یا CURRENT_PHASE را تغییر نمی‌دهد. نیاز به reset/merge/rewrite پیش از گام بعد مشاهده نشد؛ Owner باید گزارش را بررسی و مجوز محدود را جداگانه صادر کند. push commit مستندات این ارزیابی به Owner واگذار می‌شود.

### اختلاف‌های مهمِ سند و واقعیت

| ادعا/محل قدیمی | واقعیت مقدم و اثر عملی |
| --- | --- |
| CURRENT_PHASE، backlog و انتهای I2 status هنوز ممیزی end-to-end را «گام بعد» می‌گویند | [AUD] و HEAD540ce05 نشان می‌دهند انجام و PASS شده؛ تکرار ممیزی توصیه نمی‌شود. فقط اختلاف ثبت شد، authorization بازنویسی نشد. |
| ابتدای implementation-planning/README هنوز APR-036 و11قابلیت/عدم پذیرش کامل را نشان می‌دهد؛ OPEN_QUESTIONS ابتدای I2 را باز معرفی می‌کند | APR-039/040/041/042/043 و کد0017/0018 مقدم‌اند؛ این متن‌ها برای scope حل‌شدهٔ I1/I2 مبنای توقف تازه نیستند. OQهای نامرتبط خودبه‌خود بسته نشده‌اند. |
| backlog تاریخی Internal Code را nonunique، یا purchasing را فاقد PO lifecycle معرفی می‌کند | ثبت operational PO اکنون موجود و code guard جدید I2 مصوب است؛ سند قدیمی مجوز پذیرش duplicate جدید نیست. lifecycle approval/supplier/payment همچنان تحویل نشده. |
| گزارش‌های تحویل قدیمی بعضاً «Owner acceptance pending» یا «consume رزرو وجود ندارد» دارند | پذیرش‌های بعدی و dispatch-consume کد فعلی مقدم‌اند؛ جدول۱۳قابلیت از زنجیرهٔ پذیرش بازسازی شد، نه عنوان status اولیه. |
| runbookها worker/rebuild/cutover و برخی stateها را نام می‌برند | نام منطقی اثبات executable command نیست؛ در مقابل IPS.rebuild و trace زنده واقعاً وجود دارند و «هیچ بازیابی/ردیابی پیاده نشده» نیز غلط است. |
| CUTOVER_TRAINING_ROLLOUT مقدمه RPO/RTO را باز می‌گوید | [DR] و backlog مقادیر60دقیقه/8ساعت را ثبت کرده‌اند؛ ابزار/retention/اثبات عملی هنوز باز است، نه خود این دو هدف. |

### ریسک‌ها و مجهول‌های مؤثر

1. **مرورگر:** Origin rejection قطعی؛ نحوهٔ session storage/serving فعلاً تحویل نشده. باید در P1 حل و آزمایش شود؛ نه با اعتماد به role UI.
2. **بازیابی و خطای انسانی:** crash retry اثبات‌شده با restore دارای data loss یکی نیست. تا outcome/history تطبیق نشده command admission باز نشود. اصلاح post-confirmation در I2 خارج از scope است؛ رویهٔ عملیِ رسیدگی به اشتباه قبل rollout لازم است.
3. **دادهٔ محیط:** اسامی/grants، مکان‌ها، کاتالوگ‌های واقعی و سازگاری history0018 در production بررسی نشده؛ از test fixtures یا پذیرش کد نتیجهٔ مثبت برای آن‌ها نگیرید. type تازهٔ catalogue ممکن است برای stock هنوز unsupported باشد.
4. **ظرفیت/امنیت محیط:** ظرفیت‌های code/test مشخص‌اند، ولی حجم واقعی کارخانه، TLS، offsite backup و RPO/RTO drill اثبات نشده؛ پیش‌نیاز rollout. advisory قدیمی جای بررسی انتشار تازه نیست.
5. **دسترسی شواهد:** raw test logs ignored/local هستند؛ summaries و SHA256 در Git ثبت شده‌اند. انتقال به ماشین تازه نیازمند حفظ امن همین شواهد یا بازاجرای متناسب است؛ log محلی را artifact عمومی/remote فرض نکنید.
6. **حد ارزیابی:** این مرور current-state و code-grounded است، نه penetration test، تکرار ممیزی I1/I2 یا ادعای اجرای تمام مسیرهای محصول. محیط زندهٔ کارخانه بررسی نشده است. بازبینی مستقل گزارش با بازبینی تاریخی محصول یکسان نیست.

## Part 9 — منابع و ثبت شواهد

### شواهد اجرایی بررسی‌شده در این ارزیابی

SHA256 لاگ‌های retained دوباره محاسبه و با ممیزی/پذیرش تطبیق شد؛ summary پایان آن‌ها خوانده شد. همه historical هستند؛ **هیچ unit/PG/browser test تازه در این assessment اجرا نشده است**.

| artifact محلی ignored | نتیجهٔ تاریخی | SHA256 تطبیق‌داده‌شده |
| --- | --- | --- |
| artifacts/tests/i2-unit-final.log | 198pass؛0fail/skip/cancel | A252867B47ABE428325F4070223907A58346654294E073B08681CCAC13F65FD3 |
| artifacts/tests/i2-integration-final.log | 349pass؛0fail/skip/cancel؛ تمام regressionهای قبلی | 1D3F0971D9AE8DAE2A82BBD46A855F6C476448566F87E7FDA62B6590C6C5A70C |
| artifacts/tests/purchase-receiving-audit-smoke.log | SM01؛23فیلد؛3Unit/6000kg/2باقی‌مانده؛scope denial | CB32BCCAEBA946966BB181C5B341C4C1B68699F36BBB5E88276970AEA15844DA |

نتیجهٔ [ممیزی][AUD] PASS و ماتریس [۶۰شناسه][MATRIX] شامل59VERIFIED/1OUT OF BACKEND SCOPE و23فیلد VERIFIED است. REQ-INBOUND-025 بازنگری حاکمیتی F01–F08 و عدم مجوز device/ticket مستقل است؛ کار backend جاافتاده محسوب نمی‌شود. این ارزیابی آن ممیزی را دوباره انجام نداده و آن را به UAT گسترش نمی‌دهد.

فایل‌های آزمون اجرایی مرتبط: [inventory.test.ts](../../apps/backend/tests/integration/inventory.test.ts)، [identity.test.ts](../../apps/backend/tests/integration/identity.test.ts)، [replay-audit.test.ts](../../apps/backend/tests/integration/replay-audit.test.ts)، [migration.test.ts](../../apps/backend/tests/integration/migration.test.ts)، [sales.test.ts](../../apps/backend/tests/integration/sales.test.ts)، [reservation.test.ts](../../apps/backend/tests/integration/reservation.test.ts)، [shipping.test.ts](../../apps/backend/tests/integration/shipping.test.ts)، [production.test.ts](../../apps/backend/tests/integration/production.test.ts)، [genealogy-security.test.ts](../../apps/backend/tests/integration/genealogy-security.test.ts)، [purchase.test.ts](../../apps/backend/tests/integration/purchase.test.ts)، [invoice-evidence.test.ts](../../apps/backend/tests/integration/invoice-evidence.test.ts)، [inbound-http.test.ts](../../apps/backend/tests/integration/inbound-http.test.ts)، [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts) و [receiving-integrity.test.ts](../../apps/backend/tests/integration/receiving-integrity.test.ts). وجود این فایل‌ها با اجرای آن‌ها تفاوت دارد؛ provenance اجرا در جدول بالا و گزارش‌های S ثبت است.

### راهنمای مراجع کد و گزارش‌ها

- نیازهای کارخانه: [baseline خرید/دریافت](../02-domain-business-architecture/PURCHASE_RECEIVING_REQUIREMENTS_BASELINE.md)، [23فیلد](../02-domain-business-architecture/PURCHASE_RECEIVING_FIELD_REGISTER.md)، [سیاست تکمیلی I1](../02-domain-business-architecture/PURCHASE_RECEIVING_I1_POLICY_AMENDMENT.md)، [تصمیم‌های I2 / APR-040](../00-governance/approved-baselines/APR-040-i2-business-decisions-design-scope.md) و [شرایط نهایی APR-042](../00-governance/approved-baselines/APR-042-i2-implementation-authorization.md).
- کنترل وضعیت و حدود کار: [CURRENT_PHASE](../00-governance/CURRENT_PHASE.md)، [OPEN_QUESTIONS](../00-governance/registers/OPEN_QUESTIONS.md)، [workflow توسعه](DEVELOPMENT_WORKFLOW.md) و [مالکیت ماژول‌ها](../02-domain-business-architecture/MODULE_OWNERSHIP_MATRIX.md). اختلاف‌های تاریخی این منابع در بخش۸ تفسیر شده‌اند؛ این گزارش آن‌ها را تغییر نمی‌دهد.
- قراردادهای جزئی: [I1 fields/queries](../../apps/backend/src/modules/procurement/inbound-contracts.ts)، [I2 fields/queries](../../apps/backend/src/modules/procurement/receiving-contracts.ts)، [مقادیر exact و جلالی](../../apps/backend/src/modules/procurement/inbound-values.ts)، [طبقه‌بندی نوع و Inventory owner I2](../../apps/backend/src/modules/inventory/inbound-receiving.ts)، [Sales states](../../apps/backend/src/modules/sales/contracts.ts).
- S01–S13: گزارش تحویل و آزمون هر قابلیت؛ Axx: سند دستور/پذیرش Owner، جدا از engineering acceptance.
- C01–C13: source اجرایی اصلی همان قابلیت؛ adapterهای SQL در [infrastructure/postgresql](../../apps/backend/src/infrastructure/postgresql) و schema در [migrations](../../database/migrations) قابل پیگیری‌اند.
- navigation از Graphify محلی/offline موجود استفاده کرد؛ هیچ محتوای ERP برای indexing خارجی ارسال نشد؛ source و Git مرجع‌اند.

### کنترل تحویل همین گزارش

بازبینی مستقل بخش۱۳قابلیت/معماری/بک‌اند و بخشUI/عملیات/محدودهٔ پیشنهادی انجام شد. دو اصلاح لازم، تفکیک assertion از شاهد اجرا و تصریح عدم دسترسی ACT-CUST به trace داخلی، اعمال و دوباره تأیید شدند؛ یافتهٔ الزامی باز در این بازبینی مستند باقی نماند. این PASS، پذیرش Owner برای گزارش/implementation یا آزمون امنیت runtime نیست.

کنترل ساختار۹بخش،89ارجاع محلی گزارش و ساختار جدول‌ها بدون خطا بود؛17commit مورد استناد ancestor HEAD هستند. diff محصول نسبت به I2 پذیرفته‌شده صفر است. تحویل فقط همین گزارش و یک لینک در `docs/INDEX.md` است؛ source/test/SQL/gate دست‌نخورده‌اند. کنترل whitespace/diff پیش از commit انجام می‌شود؛ hash commit مستندات و cleanliness نهایی در پاسخ تحویل گزارش می‌شوند. هیچ push یا شروع increment بعدی مجاز/انجام‌شده نیست.

[S01]: SLICE_ENVELOPE_IMPLEMENTATION_REPORT.md
[S02]: IDENTITY_AUTHORIZATION_IMPLEMENTATION_STATUS.md
[S03]: SLICE_IPS_IMPLEMENTATION_STATUS.md
[S04]: SLICE_PURCHASE_RECEIPT_IMPLEMENTATION_STATUS.md
[S05]: SLICE_STOCK_DEMAND_IMPLEMENTATION_STATUS.md
[S06]: SLICE_STOCK_RESERVATION_IMPLEMENTATION_STATUS.md
[S07]: SLICE_STOCK_SHIPMENT_IMPLEMENTATION_STATUS.md
[S08]: SLICE_MAKE_IMPLEMENTATION_STATUS.md
[S09]: GENEALOGY_TRACE_IMPLEMENTATION_STATUS.md
[S10]: SLICE_PURCHASE_IMPLEMENTATION_STATUS.md
[S11]: FINANCE_LITE_IMPLEMENTATION_STATUS.md
[S12]: I1_IMPLEMENTATION_STATUS.md
[S13]: I2_IMPLEMENTATION_STATUS.md
[A20]: ../00-governance/approved-baselines/APR-020-ips-scope.md
[A21]: ../00-governance/approved-baselines/APR-021-receipt-increment-scope.md
[A22]: ../00-governance/approved-baselines/APR-022-sales-demand-scope.md
[A23]: ../00-governance/approved-baselines/APR-023-reservation-increment-scope.md
[A24]: ../00-governance/approved-baselines/APR-024-shipment-increment-scope.md
[A25]: ../00-governance/approved-baselines/APR-025-production-scope.md
[A26]: ../00-governance/approved-baselines/APR-026-genealogy-trace-scope.md
[A27]: ../00-governance/approved-baselines/APR-027-purchasing-evidence-scope.md
[A28]: ../00-governance/approved-baselines/APR-028-finance-lite-continuation.md
[A29]: ../00-governance/approved-baselines/APR-029-weighbridge-scope-review.md
[A39]: ../00-governance/approved-baselines/APR-039-i1-backend-acceptance-i2-clarification.md
[A43]: ../00-governance/approved-baselines/APR-043-i2-backend-acceptance.md
[C01]: ../../packages/shared-kernel/src/envelope/execute.ts
[C02]: ../../apps/backend/src/modules/identity/service.ts
[C03]: ../../apps/backend/src/modules/inventory/posting-service.ts
[C04]: ../../apps/backend/src/modules/procurement/receipt-service.ts
[C05]: ../../apps/backend/src/modules/sales/sales-service.ts
[C06]: ../../apps/backend/src/modules/inventory/reservation.ts
[C07]: ../../apps/backend/src/modules/shipping/shipping-service.ts
[C08]: ../../apps/backend/src/modules/production/production-service.ts
[C09]: ../../apps/backend/src/modules/genealogy/projection.ts
[C10]: ../../apps/backend/src/modules/procurement/purchase-service.ts
[C11]: ../../apps/backend/src/modules/finance/invoice-evidence-service.ts
[C12]: ../../apps/backend/src/modules/procurement/inbound-service.ts
[C13]: ../../apps/backend/src/modules/procurement/receiving-service.ts
[PKG]: ../../package.json
[MAIN]: ../../apps/backend/src/main.ts
[COMPOSE]: ../../apps/backend/src/composition-root.ts
[CONFIG]: ../../apps/backend/src/config.ts
[HOST]: ../../apps/backend/src/transport/http-host.ts
[IDHTTP]: ../../apps/backend/src/transport/identity-http.ts
[I1HTTP]: ../../apps/backend/src/transport/inbound-http.ts
[I2HTTP]: ../../apps/backend/src/transport/receiving-http.ts
[LOG]: ../../apps/backend/src/infrastructure/logging/json-logger.ts
[BOUND]: ../../tools/build/check-boundaries.mjs
[MIG]: ../../tools/db/migrate.mjs
[CI]: ../../.github/workflows/verify.yml
[GATE]: ../../.cursor/architecture-gate.json
[B]: IMPLEMENTATION_BACKLOG.md
[R]: ROADMAP_AND_SLICES.md
[CMD]: ../05-application-api-architecture/COMMAND_CATALOGUE.md
[DR]: ../08-integration-deployment/BACKUP_AND_RECOVERY.md
[OPS]: ../08-integration-deployment/DEPLOYMENT_TOPOLOGY.md
[CUT]: CUTOVER_TRAINING_ROLLOUT.md
[AUD]: PURCHASE_RECEIVING_FINAL_BACKEND_AUDIT.md
[MATRIX]: PURCHASE_RECEIVING_FINAL_BACKEND_EVIDENCE.md
