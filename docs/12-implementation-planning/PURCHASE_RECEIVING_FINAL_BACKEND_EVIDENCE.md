---
id: AUDIT-INBOUND-MATRIX-001
title: Sixty individual backend requirement proofs including twenty-three factory field lifecycles
phase: 12-implementation-planning
status: in_review
version: 1.0.0
owners: [qa-architect, chief-solution-architect, security-architect]
depends_on: [APR-039, APR-043, SRC-004, SRC-005, SRC-006, SRC-007, DOM-INBOUND-REQ-001, DOM-INBOUND-FIELDS-001, DOM-INBOUND-POLICY-001, IMPL-I1-001, IMPL-I2-001]
last_reviewed: 2026-10-25
approval: null
supersedes: null
---

# ماتریس شواهد فردی 60 الزام بک‌اند

همراه [گزارش ممیزی نهایی](PURCHASE_RECEIVING_FINAL_BACKEND_AUDIT.md).
مبنای کد بدون تغییر: I1=`e3462fcfc4eaebbedb0d3a323bda7e0ae72d59c4`،
I2=`b585fd795fb0276bc936af254c6d56fd7e3bcbe8`؛ baseline ممیزی=`ebad816`.
هر ردیف زیر نتیجه خواندن کد و assertion است، نه کپی وضعیت trace قبلی.
معنای اولیه از [25 قاعده](../02-domain-business-architecture/PURCHASE_RECEIVING_REQUIREMENTS_BASELINE.md) ،
[23 فیلد](../02-domain-business-architecture/PURCHASE_RECEIVING_FIELD_REGISTER.md) و
[S01–S12](../02-domain-business-architecture/PURCHASE_RECEIVING_I1_POLICY_AMENDMENT.md)
با روشن‌سازی‌های بعدی SRC-005/006/007 و طراحی پذیرفته‌شده تفسیر شده است.
به‌ویژه unordered استثنای مصوبِ لینک nullable است، نه مجوز ساختن خط سفارش جعلی.

## کلید فایل/نماد و قرارداد دیتابیس

این کلیدها مسیر دقیق هر ردیف را کوتاه می‌کنند؛ شماره خط در متن است، نه URL ساختگی.

| کلید | فایل واقعی / نماد بررسی‌شده |
| --- | --- |
| C1 | Procurement: [inbound-service.ts](../../apps/backend/src/modules/procurement/inbound-service.ts) ، `parseOperationalOrder`66 ، `InboundService.record`222 ، `query`346 ، `current`174 ؛ parse catalogue و selection typed |
| C2 | Procurement: [inbound-values.ts](../../apps/backend/src/modules/procurement/inbound-values.ts) ، `normalizeOrderReference`، `assertInboundText`، `assertDimension`، `assertUnitInteger`، `parseJalaliDate`، `derivedOrderLineWeightKg` |
| C3 | PostgreSQL owner: [inbound-store.ts](../../apps/backend/src/infrastructure/postgresql/inbound-store.ts) ، `PostgresInboundStore.order`69 ، `orderByReference`124 ، `listOptions`156 ، `insertOption`171 ، `insertOrder`183 |
| C4 | Procurement: [receiving-service.ts](../../apps/backend/src/modules/procurement/receiving-service.ts) ، `parseReceivingInput`108 ، `comparison`219 ، `ReceivingService.current`265 ، `confirm`375 ، `query`586 |
| C5 | PostgreSQL owner: [receiving-store.ts](../../apps/backend/src/infrastructure/postgresql/receiving-store.ts) ، `headerSql`20 ، `PostgresReceivingStore.lock/duplicate/counts/insert/source/units/complete`؛ selected-order SQL قبل از enrichment |
| C6 | Inventory: [inbound-receiving.ts](../../apps/backend/src/modules/inventory/inbound-receiving.ts) ، `resolveInboundMaterialType`، `sourceSnapshot`، `InventoryInboundReceivingService.receiveMany`196 ، private admission و `validateEffect` |
| C7 | Inventory owner: [inventory-receiving-store.ts](../../apps/backend/src/infrastructure/postgresql/inventory-receiving-store.ts) ، `identities`، `create`45 ، `traceSources`78 |
| C8 | [composition-root.ts](../../apps/backend/src/composition-root.ts) ، `compose/inboundPolicies/inboundQuery/receivingQuery`، current trusted Identity ، role policies ، private snapshot admission ؛ [Identity service](../../apps/backend/src/modules/identity/service.ts) |
| C9 | Transport: [inbound-http.ts](../../apps/backend/src/transport/inbound-http.ts) و [receiving-http.ts](../../apps/backend/src/transport/receiving-http.ts) ، closed route/body ، personal session ، selected role ، bounded input/output |
| C10 | Inventory: [posting-service.ts](../../apps/backend/src/modules/inventory/posting-service.ts) ، `InventoryPostingService.post`246 ؛ sole posting و≤128effects/invocation |
| C11 | Shared kernel: [execute.ts](../../packages/shared-kernel/src/envelope/execute.ts) ، `executeCommand`، savepoint382 ، audit424 ، outcome432 ، COMMIT433 ؛ [transaction.ts](../../apps/backend/src/infrastructure/postgresql/transaction.ts) ، `PostgresTransactions.begin` و context→همان client |
| C12 | Legacy: [receipt-service.ts](../../apps/backend/src/modules/procurement/receipt-service.ts) ، `ReceiptService.post/contract`؛ [receipt-store.ts](../../apps/backend/src/infrastructure/postgresql/receipt-store.ts) ، common physical-code resource و mapper |
| C13 | Genealogy: [projection.ts](../../apps/backend/src/modules/genealogy/projection.ts) ، `GenealogyProjection`، customer reachability و typed source ؛ C7.traceSources برای Unit/Lot/receiving-unit |
| D17 | [0017_operational_purchase_orders.sql](../../database/migrations/0017_operational_purchase_orders.sql): `operational_purchase_order`، `operational_purchase_order_line`، `inbound_catalogue_option`؛ generated R1 key ، `i1_po_reference_uq`، typed scoped catalogue FKs ، frozen position/count و `i1_po_complete_ck`، محدودیت‌های immutable/INSERT+SELECT |
| D18 | [0018_purchase_receiving.sql](../../database/migrations/0018_purchase_receiving.sql): `inbound_arrival/waybill/warehouse_receipt/received_unit/physical_code_claim` در Procurement و `inbound_unit_origin` در Inventory ؛ `i2_received_*_fk`، `i2_received_association_ck`، exact code/document uniqueness ، immutable triggers ، `i2_received_actual_guard` و complete source/origin/claim triggers |

Pnnn یعنی عنوان دقیق آزمون و فایل آن در کاتالوگ انتهای همین سند و خط nnn از لاگ
موفق `artifacts/tests/i2-integration-final.log`. Unn همین رابطه را برای لاگ
`artifacts/tests/i2-unit-final.log` دارد. هر P/U ارجاع‌شده واقعاً با✔اجرا شده است.
شماره خط به‌تنهایی اثبات نیست: بدنه assertion های آن مورد نیز بررسی شده است.
SM01 اجرای تازه محدود با HTTP/PG واقعی است که receipt اجرای آن در انتها آمده؛
هیچ‌کدام planned test نیستند. نتیجه 59VERIFIED و 1OUT OF BACKEND SCOPE است.

## 25 قاعده workflow

| شناسه | معنای دقیق جاری / مرحله | ماژول، فایل/نماد | entity / invariant دیتابیس | آزمون اجراشده و assertion مرتبط | وضعیت | محدودیت یا edge بررسی‌نشده |
| --- | --- | --- | --- | --- | --- | --- |
| REQ-INBOUND-001 | مسئول خرید پس از سفارش فروشنده، مرجع PO و تاریخ را پیش از لزوم ورود ثبت کند؛ I1 | C1.parseOperationalOrder/record ، C8 PROC policy | D17 header+lines ، actor/timestamp و تاریخ مستقل | P45/P74: ثبت بدون receipt ، raw/date دقیق؛ SM01 ثبت و lookup WH قبل از دریافت | VERIFIED | خود سفارش‌دادن به فروشنده عمل انسانی است؛ browser ادعا نشده |
| REQ-INBOUND-002 | یک PO چند خط مستقل با مشخصات، W1 و تعداد واحدهای سفارش داشته باشد؛ I1 | C1.record.map UUID/position ، C3.insertOrder | D17 line PK ، position unique ، declared count/FK/deferred completeness | P74 سه خط همسان/بدون شماره، سه UUID و ordinal1..3 ؛ P52 header ناقص رد؛ P76 required ها | VERIFIED | حد 128 خط/بودجه projection مصوب حفظ شده؛ ادغام خطوط وجود ندارد |
| REQ-INBOUND-003 | ثبت PO به‌تنهایی موجودی را افزایش ندهد؛ I1 | C1.record فقط C3 ؛ فاقد Inventory port | فقط D17 writes ؛ هیچ Unit/Lot/Ledger/Balance/GR effect | P45 SQL مجموع تمام side effect ها صفر؛ P44 موجودی واقعی قبلی byte-equivalent ؛ SM01 Unit صفر پیش از دریافت | VERIFIED | مجموع وزن سفارش فقط محاسبه exact Procurement است |
| REQ-INBOUND-004 | یک PO در چند ورود و بارنامه برسد؛ یک محموله مشترک چند PO نیز مجاز است؛ I2 | C4.confirm ، C5.insert/counts | D18 scoped per-unit order/line FKs ؛ header محدود به یک PO نیست | P222 دو arrival/4Unit/8000kg/1remaining ؛ P223 یک waybill/header با دو PO | VERIFIED | بستن خودکار سفارش خارج از دامنه است |
| REQ-INBOUND-005 | WH با مرجع PO اصل خطوط را بازیابی و واحد دریافتی را نسبت به خط واقعی بررسی کند؛ هر دو | C1.query→C2.R1→C3.orderByReference ؛ C4.confirm.originals.order/line lookup | D17 generated key ؛ D18 i2_received_line_fk | P45 equivalent reference→همان اصل؛ P221 اصل 2000/5 ؛ SM01 lookup کامل WH و اصل بدون تغییر | VERIFIED | بازرسی فیزیکی وظیفه انسانی است؛ پشتیبانی ثبت آن بررسی شد |
| REQ-INBOUND-006 | فقط واحدهای فیزیکی واقعاً پذیرفته‌شده این ورود ثبت شوند؛ I2 | C4.parse/confirm.units→sources ؛ C6.receiveMany | D18 تعداد source کامل برابر origin و stock | P221 دقیقاً3Unit/6000kg/2remaining ؛ SM01 سه کد و سه stock identity | VERIFIED | از ordered count هویت یا work/memory تولید نمی‌شود |
| REQ-INBOUND-007 | تعداد سفارش، دریافت این ورود، دریافت قبلی/تجمعی و باقی‌مانده قابل تفکیک بمانند؛ I2 | C4.batchCounts/lineProgress/query ، C5.counts/units | اصل count در D17 ؛ sources و arrival membership در D18 immutable | P221 3/2 ؛ P222 ورود 3 سپس 1 با expected prior3→cumulative4/remaining1 ؛ P231 stale intent رد؛ P225 excess جدا | VERIFIED | سهم هر ورود/خط از unit rows قابل تفکیک است؛ excess با remaining صفر و excess جدا، اصل بدون تغییر |
| REQ-INBOUND-008 | مقدار واقعی پذیرفته‌شده بر physical inventory حاکم و اصل سفارش محفوظ باشد؛ I2 | C4.actual/comparison→C6 sources/effects | D18 actual/original JSONB و accepted W1 ، origin linked to stock | P224 stock2100 و اصل 2000 ؛ P226 actual COIL/SHEET و Inventory kind ؛ SM01 dimensions/color/grade واقعی جدا | VERIFIED | dimensions مالکیت Procurement دارند و با origin به stock متصل‌اند؛ writer دوم نیست |
| REQ-INBOUND-009 | اصل/واقعی، discrepancy ، خط/واحد، ورود/رسید و گیرنده معتبر قابل ردیابی بمانند؛ I2 | C4.comparison/explicit flags ؛ C5.insert/units | D18 scoped FKs ، actor/request ، immutable source/actual guard | P224 actor واقعی و changed W1 ؛ P226 حالات SAME/CHANGED/CONFIRMED_ABSENT/NOT_RECORDED ؛ SM01 DB/read دقیق | VERIFIED | اصلاح پس از تأیید پیاده‌سازی نشده و مصوبِ دامنه نیست |
| REQ-INBOUND-010 | تحویل جزئی یا عدم تحویل به‌تنهایی specification mismatch نباشد؛ I2 | C4.comparison فقط attributes ؛ excess مجزا | source facts و progress از یکدیگر جدا | P221 دریافت 3 از 5 با confirmed:true بدون mismatchflag موفق؛ P222 ادامه دریافت عادی | VERIFIED | partial delivery نه rejection است نه اجازه حذف remainder |
| REQ-INBOUND-011 | هر واحد فیزیکی کد دستی متمایز و ردیابی مستقل داشته باشد؛ I2 | C4.parse code sets ؛ C6 فقط technicalUUID تولید می‌کند؛ C7.origin | D18 i2_code_claim_pk ، source/origin unique | P221 سه code و سه Ledger source ؛ P229/P233/P218 duplicate/history ؛ SM01 exactcode و سه stockUUID | VERIFIED | چسباندن فیزیکی برچسب فعالیت انسانی/UAT است، نه feature چاپ برچسب |
| REQ-INBOUND-012 | واحد matched به PO/خط/ورود/بارنامه/رسید متصل بماند؛ لینک unordered طبق مصوبه صادقانه nullable است؛ I2 | C4 ReceivingAssociation/confirm ، C5.units ، C7.create/C13.GenealogyProjection | D18 i2_received_waybill/receipt/order/line_fk و association_ck | P221 typed Unit/Lot/source ؛ U57 source-backed isolation ؛ P223 order projection ؛ P225 ORDER_ONLY/UNLINKED بدون خط جعلی؛ SM01 تمام document/origin IDs | VERIFIED | استثنای unordered طبق SRC-007-B06 است؛ الزام به PO جعلی ایجاد نمی‌کند |
| REQ-INBOUND-013 | شماره رسید انبار از سند موجود بیرونی وارد شود؛ ERP آن را نسازد؛ I2 | C4.warehouseReceipts input ، C5.insert | D18 external reference مستقل از receiptUUID ، i2_receipt_reference_uq | P229 duplicate ؛ P235 race ؛ SM01 reference خام SQL/PROC برابر ورودی | VERIFIED | صدور سند کاغذی بیرون سیستم است |
| REQ-INBOUND-014 | فقط واحدهای تأییدشده با sole IPS و source/stock/audit/outcome اتمی و exactly-once ثبت شوند؛ I2 و kernel | C4.confirm→C6.receiveMany→C10.post ؛ C11.executeCommand/transaction | D18 i2_arrival_complete_ck/i2_origin_complete_ck و inventory.i2_receiving_stock_matches ؛ kernel outcome/audit درهمان TX | P236/P237 واقعی 129/257 ؛ U54 batches[128,128,1]؛ P238 خطای Ledger129→همه صفر؛ P239/P240/P253/P254 recovery | VERIFIED | سقف 128per invocation ؛ فقط envelope/resource بودجه مصوب، نه سقف document256 |
| REQ-INBOUND-015 | PROC پس از commit اصل، دریافت، باقی‌مانده، اسناد، مغایرت و intake را برای PO مجاز ببیند؛ هر دو | C4.query ، C5.units/counts/headerSql ، C7.identities | WHERE scoped order_id قبل از enrichment ، source+stock committed | P223 driver/W2/yellow و عدم sibling ؛ P226 تمام اختیاری‌ها؛ P237 تمام 257unit paged ؛ SM01 هر 23 فیلد | VERIFIED | backend projection کامل؛ browser UI خارج از این پذیرش |
| REQ-INBOUND-016 | واحدهای سفارش‌داده‌شده ولی تحویل‌نشده به‌صورت received یا stock ظاهر نشوند؛ هر دو | C1 بدون stock ؛ C4 فقط explicitunits و progress جدا | D17 ordered intent ، D18 committed accepted sources | P45 stock صفر هنگام order ؛ P221 3received/2outstanding ؛ P253 source غیر commit پس از kill صفر | VERIFIED | نمایش تصویری browser ادعا نمی‌شود |
| REQ-INBOUND-017 | دقیقاً 23 فیلد با 13 الزامی/10 اختیاری و 12 ورودی خرید/11 ورودی دریافت در مرحله درست حفظ شوند؛ هر دو | C1.parseOperationalOrder ؛ C4.parseReceivingInput ؛ C2 validators | D17 header/line و D18 header/document/unit nullable/NOTNULL | P76 هفت خرید required ؛ P227 ششدریافت required و optional absent ؛ U119 ؛ SM01 چرخههر 23 | VERIFIED | UUID/location/source pointer/metadata فیلد تجاری اضافه نیستند |
| REQ-INBOUND-018 | W1 وزن یک واحد و مبنای stock پذیرفته‌شده باشد؛ اصل و changed W1 مستقل بمانند؛ هر دو | C2.assertUnitInteger ؛ C4.changedW1 ؛ C6 kg=acceptedUnitWeightKg | D17 unit_weight ؛ D18 actual/original/accepted weight+origin/stock predicate | P221 3×2000 ؛ P224 accepted2100/ordered2000 با actorWH ؛ P228 tinyW2 stock2000 را عوض نمی‌کند؛ P216 forgedkg رد | VERIFIED | provenance اعلام/تأیید WH است؛ اندازه‌گیری مستقل هر واحد ادعا نشده |
| REQ-INBOUND-019 | W2 اجباری، از بارنامه و متعلق به کل همین محموله باشد؛ I2 | C4.decimal/weightSourceWaybillId ؛ C5.header | D18 origin_net_kg_text فقط arrival و i2_arrival_weight_waybill_fk | P227 نبود W2 رد؛ P223 یک header برایدو PO ؛ P228 lexeme کسری باصفرهایخام؛ SM01 W2 با stock متفاوت حفظ شد | VERIFIED | صحت رونویسی سند فیزیکی با انسان است؛ allocation ندارد |
| REQ-INBOUND-020 | W3 اختیاری و متعلق به کل محموله باشد؛ W2/W3 سهم‌بندی یا جایگزین W1 نشوند؛ I2 | C4 optionaldecimal ؛ C6effect فقط W1 | D18 nullable destination_net_kg_text در header ، بدون stock relation عددی | P227 نبود W3 معتبر؛ P223 grain مشترک؛ P228 precision/zeroes بدون تغییر stock ؛ U119 ؛ SM01 | VERIFIED | device/ticket ، وزن تجاری و tolerance خودکار خارج‌اند |
| REQ-INBOUND-021 | هویت‌های تجاری و فنی مستقل و namespace های مصوب رعایت شوند؛ هر دو | C2.R1 فقط PO ؛ C4rawdocument/code ؛ C5duplicate ؛ C12sharedcode lock | D17 factoryPOkey ؛ D18 claimPK و waybill/receipt uniques جدا؛ product nonunique | P75 R1rawbinding ؛ P229 اسنادمستقل و nonR1 ؛ P233 crosspath ؛ P246 product مشترک برایدو SHEET مستقل | VERIFIED | exact code/document equality و factory=installation طبق مصوبه |
| REQ-INBOUND-022 | سیاست استثنا/QC/tolerance/remediation اختراع نشود؛ اختیار دستی مصوب WH اجرا شود؛ I2 | C4 derivedflags+explicittrue و honestassociation ؛ C6finite type | D18 association_ck/actualguard/immutable sources | P224 نبود changedflag رد؛ P225 excess/unordered صریح واصل‌ثابت؛ P244 ناشناخته→ردنه OTHER | VERIFIED | custody/rejected goods ، return و post-confirmation correction خارج‌اند |
| REQ-INBOUND-023 | مجوز شخصی ACT جاری، دامنه سازمانی و تفکیک عملیات/خواندن رعایت شود؛ هر دو | C8 Identity/currentrole/privateadmission ؛ C1/C4.current ؛ C9 | scopedWHERE/FK و trustedactor/commandbinding | P80 forged/revoked ؛ P242 PROC/SEC/CUST confirmationdeny ؛ P243 foreignscope ؛ P249 revocation هنگام wait ؛ SM01negative reads | VERIFIED | نام معصومی/کریمی securitypredicate نیست |
| REQ-INBOUND-024 | قابلیت‌های پذیرفته‌شده و legacy بدون PO/ticket با تغییر مصوب duplicate guard حفظ شوند؛ هر دو | C12v1 و commoncodeguard ؛ C1/C3 مستقل از completedpurchase ؛ canonicalrunner | D18 historical check بدون backfill ،freezePOSTED و mirrorFK ؛0001–0017 دست‌نخورده | P194 standalone intake ؛ P44 seeded stock/evidence unchanged ؛ P245 legacyfactunchanged ؛ P218/P219/P220 history ؛ suite349 تمام regressionfiles | VERIFIED | duplicate جدید در legacy عمداًطبق SRC-007/APR043 رد می‌شود؛ replay قدیمی حفظ |
| REQ-INBOUND-025 | بازنگری F01–F08 و عدم مجوز device یا ثبت مستقل ticket ؛ الزام حاکمیتی و exclusion | [reconciliation](../02-domain-business-architecture/PURCHASE_RECEIVING_RECONCILIATION.md) بخش F01–F08 ؛ C4closedpayload فاقد device | هیچ device/ticket entity دردامنهپذیرفته‌شدهنیست | بازنگری فردی سند بررسی شد؛ دستگاه عمداً feature لازم برایآزموناجرایی نیست؛ W3 دستی در 020 بررسیشده | OUT OF BACKEND SCOPE | شاخه runtime دستگاه/ticket صریحاًexcluded ؛ governance بازنگری انجام‌شده، نه missingfeature |

## 23 فیلد کارخانه: چرخه validation → persistence → authorized readback

خرید=خانم معصومی با ACT-PROC جاری؛ دریافت=آقای کریمی با ACT-WH جاری. اصل attribution
خرید با تأیید actual توسط WH عوض نمی‌شود. `L` یعنی متن raw غیر blank با 128scalar/
512byte و منع کنترل‌های مصوب؛ `N` یعنی decimal مثبت exact با 20 رقم صحیح/18 اعشار؛
`K` یعنی integer مثبت<10^20 ؛ `J` یعنی Jalali YYYY-MM-DD باپروفایل 1206–1498 ؛
`A` یعنی decimal ASCII بدونگرد کردن باحفظصفر/precision سند برای W2/W3. optional
در زمان غیاب معتبر است، نه مجوز مقدار malformed. این ظرفیت‌ها قبلاً مصوب‌اند.

بازخوانی تمام فیلدهای خرید از C1.query/C3.order برای PROC/WH و در دریافت از C4.query
در header اصل یا original خط انجام می‌شود. فیلدهای دریافت از C5.headerSql/units برای
PROC فقطدر PO مرتبط، و arrival کامل فقط WH خوانده می‌شوند. SM01 exact readback همه 23 را
پس از commit اثبات می‌کند. قیود و negative tests زیر افزون بر آن‌اند، نه جایگزین.

| شناسه | نام فارسی / معنای دقیق | actor / required / grain / مرحله | input validation | persistence واقعی | readback و اصل/actual | assertion اجراشده | وضعیت / محدودیت |
| --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-INBOUND-F01 | شماره سیستم — کد دستی و مستقل ردیابی هر واحد | دریافت؛ YES ؛ physicalunit ؛ I2 | C4parse ،L ،واحد/کدداخل batch بدونتکرار؛ C5duplicatehistory | D18 received_unit.internal_system_code ،i2_code_claim_pk و common legacy/new lock | C5units/C7origin ؛raw عیناً،businesscode≠stockUUID ؛ orderedcounterpart ندارد | P221/P229/P233/P218 ؛ SM01 سه code خام/سه Unit | VERIFIED ؛ نصب فیزیکی برچسب انسانی، تولیدکد ERP ندارد |
| REQ-INBOUND-F02 | شماره سفارش — مرجع فروشنده با یکتایی در کارخانه | خرید؛ YES ؛ POheader ؛ I1 | C1+C2L/R1 فقط comparison ،کلیدخالیرد | D17 order_reference خام،generated order_reference_key ،i1_po_reference_uq | C3referenceLookup همان R1 ،خامدرتاریخچه/PROC برمی‌گردد؛بدون overwrite | P45/P50/P51/P75/P79 ؛ SM01rawreference | VERIFIED ؛suppliernamespace ندارد،محدودبه installation مصوب |
| REQ-INBOUND-F03 | شماره بارنامه — مرجع خارجی waybill | دریافت؛ YES ؛ waybill در arrival مشترک؛ I2 | C4L/duplicate/membercheck ؛نه R1 | D18 inbound_waybill.reference ،i2_waybill_reference_uq و samearrivalFK | C5units.waybill.reference ؛ هروحدسندخودش،اصل ordered ندارد | P223/P229/P234 ؛ SM01SQL/PROCexactraw | VERIFIED ؛ صدورسندبیرون ERP |
| REQ-INBOUND-F04 | شماره بارنامه حواله (برگ زرد) — مرجع yellow copy | دریافت؛ NO ؛ waybill ؛ I2 | C4optionalL ؛ absent مجاز | D18 waybill.yellow_copy_reference nullable | C5waybillprojection ؛ absentomitted ،rawpresent حفظ؛ordered ندارد | U119/P223/P227 ؛ SM01exactyellow | VERIFIED ؛شماره/وابستگی/یکتاییاضافیندارد |
| REQ-INBOUND-F05 | شماره رسید انبار — شماره سند موجود خارج از ERP | دریافت؛ YES ؛ receipt بهیک arrival ؛ I2 | C4L/duplicate/membercheck | D18 warehouse_receipt.reference ،i2_receipt_reference_uq/parentFK | C5warehouseReceipt.reference ؛خامونه UUID ؛ordered ندارد | P229/P235 ؛ SM01SQL/PROCexactraw | VERIFIED ؛businessnumber تولید نمی‌شود |
| REQ-INBOUND-F06 | شماره کامیون — شناسه واردشده کامیون این ورود | دریافت؛ NO ؛ arrival ؛ I2 | C4optionalL | D18 inbound_arrival.truck_number nullable | C5headertruckNumber برای PROC مرتبط/WH ؛ordered ندارد | U119/P227 ؛ SM01SQL/PROC/WHexact | VERIFIED ؛ خلأ assertion قدیمیبا SM01 بسته؛vehiclemaster ندارد |
| REQ-INBOUND-F07 | شماره آیتم — شماره تجاری اختیاری خط، نه شناسه فنی | خرید؛ NO ؛ orderline ؛ I1 | C1optionalL ؛بدوناجباربرای identity | D17 line.item_number nullable ؛lineUUID/ordinal مستقل | C3originalquery ،C5original.itemNumber/LINEs ؛بدون rewrite | P74/P76/P226 ؛ SM01 مقدارحاضرعینورودی readback | VERIFIED ؛ خلأ assertionexactread قبلیبا SM01 بسته؛خطوطهمسان merge نمیشوند |
| REQ-INBOUND-F08 | نوع کالا — انتخاب Material Type از فهرست مشترک | خرید؛ YES ؛ originalLine/actualUnit ؛ هر دو | C1UUID/typedscopedselection ؛C4actualUUID ؛C6supportedtechnicaltype | D17 material_type_option_id/i1_line_material_fk ؛ D18 actual.materialType/technical_type | اصل catalogueimmutable ؛actual جداومقایسه؛نوع business≠enumexpansion | P77/P78/P226/P244 ؛ SM01typeoriginal/actual | VERIFIED ؛unsupportedexplicitreject ،نه OTHER |
| REQ-INBOUND-F09 | عرض — مقدار بر حسب متر | خرید؛ YES ؛ originalLine/actualUnit ؛ هر دو | C2N ؛C4actualN ؛بدون conversion | D17 width_m_text CHECK ؛ D18 actual.widthM/original/comparison | C3/C5rawlexeme+unitm ؛ mathematicallySAME ممکن،اصلخامثابت | U42/P57/P74/P224 ؛ SM01 عرضاصل 1.200/واقعی 1.250 | VERIFIED ؛precision مصوب،no rounding |
| REQ-INBOUND-F10 | ضخامت — مقدار بر حسب میلی‌متر | خرید؛ YES ؛ originalLine/actualUnit ؛ هر دو | C2N ؛C4actualN | D17 thickness_mm_text CHECK ؛ D18 actual.thicknessMm | readmetadata mm ؛raworiginal/actual جدا | P57/P76/P226 ؛ SM01 اصل 0.350/واقعی 0.400 | VERIFIED ؛ تغییرواحدخودکارندارد |
| REQ-INBOUND-F11 | رنگ — انتخاب اختیاری از فهرست Color | خرید؛ NO ؛ originalLine/actualUnit ؛ هر دو | C1optionaltypedUUID ؛C4actualomitted/null/selection مجزا | D17 color_option_id/i1_line_color_fk ؛ D18 actual.color JSONB | اصل labelimmutable ؛actualselected/CONFIRMED_ABSENT/NOT_RECORDED جدا | P74/P78/P226 ؛ SM01 قرمزاصل/آبیواقعی exact | VERIFIED ؛ optional به mandatory تبدیلنشده |
| REQ-INBOUND-F12 | شماره رئال رنگ — مرجع RAL اختیاری و مستقل | خرید؛ NO ؛ originalLine/actualUnit ؛ هر دو | C1optionalL ؛C4actualnullableL ؛بدون mandatorycolor | D17 ral_color_number nullable ؛D18 actual.ralColorNumber | اصل/واقعیونبود صریحجدا،قالب RAL اختراعنشده | P76/P226 ؛ SM01RAL-3000/RAL-9005exact | VERIFIED ؛ وابستگیاجباری RAL ندارد |
| REQ-INBOUND-F13 | طول — مقدار اختیاری بر حسب متر، نه واحد موجودی دوم | خرید؛ NO ؛ originalLine/actualUnit ؛ هر دو | C2optionalN ؛C4actualnull/omitted مجزا | D17 length_m_text nullableCHECK ؛D18 actual.lengthM | C3/C5exactstring ؛مقایسهعددبدون تغییراصل | U42/P57/P226 ؛ SM01 اصل 2.000/واقعی 3.000 | VERIFIED ؛ وزن‌سازیازطولندارد |
| REQ-INBOUND-F14 | کیفیت — انتخاب اختیاری Quality/Grade ، نه مرحله QC | خرید؛ NO ؛ originalLine/actualUnit ؛ هر دو | C1optionaltypedUUID ؛C4scopedactualselection | D17 quality_grade_option_id/i1_line_quality_fk ؛D18 actual.qualityGrade | immutableoriginallabel و actual/status جدا | P45/P78/P226 ؛ SM01grade الف/ب exact | VERIFIED ؛ descriptor است،نه QCapproval |
| REQ-INBOUND-F15 | وزن — W1 یک واحد فیزیکی، نه مجموع خط | خرید؛ YES ؛ originalLine/acceptedUnit ؛ هر دو | C2K ؛C4actualK و changedW1true درصورتتفاوت | D17 unit_weight_kg_text ؛D18 original/actual/accepted_unit_weight_kg_text ؛C7origin→C10kg | اصل/accepted وزنومرجع/actor جدا؛هیچ W2/W3 جایگزیننمیشود | U43/P224/P228/P221 ؛ SM01 سه 2000→6000 | VERIFIED ؛ declaredacceptedprovenance ،نه weighing مستقل |
| REQ-INBOUND-F16 | تعداد — تعداد واحد فیزیکی سفارش‌داده‌شده در خط | خرید؛ YES ؛ orderline ؛ I1+I2progress | C2K ؛بدون allocation متناسب count | D17 ordered_unit_count_text immutable ؛D18 sourcerows برای accepted | C3ordered ؛C4LINESaccepted/remaining/excess جدا | U43/P74/P221/P222/P231 ؛ SM01ordered5/received3/rem2 | VERIFIED ؛ موجودیفقط kg ،countsstockledger دومنیست |
| REQ-INBOUND-F17 | تاریخ ثبت سفارش — تاریخ تجاری جلالی سفارش | خرید؛ YES ؛ POheader ؛ I1 | C2J ؛outsideprofileexpliciterror | D17 registration_jy/jm/jd ،calendar_profile/i1_po_jalali_ck ؛recorded_at جدا | C3roundtripYYYY-MM-DD/calendarjalali ؛نه servertoday | U37/U38/P56/P45 ؛ SM01 اصل 1403-12-30 | VERIFIED ؛دامنه 1206–1498 مصوب،timezoneconvert ندارد |
| REQ-INBOUND-F18 | تاریخ ورود — تاریخ واقعی ورود محموله با تقویم جلالی | دریافت؛ YES ؛ arrival ؛ I2 | C4date→C2J ؛I2_DATE_OUTSIDE_PROFILE | D18 arrival_jy/jm/jd ،i2_arrival_jalali_ck ،recorded_at جدا | C5headerreconstructYYYY-MM-DD/profile ؛ordereddate عوضنمیشود | P227/P228/U124 ؛ SM01SQLYMD/PROC/WH1404-01-02 | VERIFIED ؛دامنهجلالیمصوب،نهاجبارهم‌تاریخیبا PO |
| REQ-INBOUND-F19 | شماره محصول — مقدار توصیفی مستقل هر واحد، بدون یکتایی | دریافت؛ YES ؛ unit ؛ I2 | C4L ؛نه unique/productCodealias | D18 received_unit.product_number NOTNULL ،بدون unique ؛C7origin | C5productNumber جدااز code/item/UUID | P246 دو SHEET محصولمشترک؛ SM01 سه unit با product مشترک exact | VERIFIED ؛پردازشاضافی/uniqueness اختراعنشده |
| REQ-INBOUND-F20 | شرکت ارسال کننده (مبدا) — فرستنده، نه لزوماً فروشنده | دریافت؛ NO ؛ arrival ؛ I2 | C4optionalL | D18 inbound_arrival.originating_company nullable | C5headeroriginatingCompany برای PROC مرتبط/WH ؛orderedcounterpart ندارد | U119/P227 ؛ SM01exactSQL/PROC/WH | VERIFIED ؛ خلأ assertion قبلیبا SM01 بسته،suppliermaster ندارد |
| REQ-INBOUND-F21 | وزن خالص گزارش مبدأ — W2 کل محموله از بارنامه | دریافت؛ YES ؛ sharedarrival ؛ I2 | C4A و sourcewaybillmembership ؛mandatory | D18 origin_net_kg_text و weightSourceWaybillFK ؛یک header | C5exactlexeme با leading/trailingzero ؛sourceunitkg از W1 | P223/P227/P228 ؛ SM01W2=06500.12500 با stock6000 | VERIFIED ؛ precisionpreserved ،نه totalPO یا allocation |
| REQ-INBOUND-F22 | وزن خالص باسکول مقصد — W3 اختیاری کل محموله | دریافت؛ NO ؛ sharedarrival ؛ I2 | C4optionalA ؛wholeintegerW1rule رویآننیست | D18 destination_net_kg_text nullable | C5rawprecision ،absent مجاز؛هیچ stockweightoverride | U119/P227/P228/P223 ؛ SM01W3=6500.1200exact | VERIFIED ؛device/ticketcapture خارج،نهفیلدباسکولاجباری |
| REQ-INBOUND-F23 | نام راننده — نام واردشده راننده این ورود | دریافت؛ NO ؛ sharedarrival ؛ I2 | C4optionalL ؛C9safeJSON | D18 inbound_arrival.driver_name nullable | C5headerdriverName ؛PROC مرتبطبافیلترقبل join دسترسی،نه SEC/CUST | P223/P242/P243 ؛ SM01driverexact+SECdeny | VERIFIED ؛ فیلدهویتیرانندهاضافهنشده،optionalabsence مجاز |

## 12 الزام تکمیلی

| شناسه | معنای دقیق جاری / مرحله | source / DB | assertion و شاهد اجرا | وضعیت | محدودیت/edge |
| --- | --- | --- | --- | --- | --- |
| REQ-INBOUND-S01 | حفظ مرجع خام فروشنده و یکتایی در کل کارخانه؛ duplicate نه ادغام شود نه اصل را بازنویسی کند؛ I1 | C2R1 ،C3lookup/lock ،D17generatedkey+i1_po_reference_uq | P50/P51 app/DB parity/forgery ؛P75 equivalentvsrawbinding ؛P79 onewinner ؛SM01rawroundtrip | VERIFIED | factory=installation مصوب،supplier شرطنیست |
| REQ-INBOUND-S02 | عرض متر، ضخامت میلی‌متر، طول اختیاری متر؛ بدون تبدیل یا گرد کردن ضمنی؛ هر دو | C2N ،C3rawsource ،C4comparison ،D17text/D18actual | U42 exactbounds ؛P57 SQLlexeme ؛P226 2.000/2.0SAME اصل ثابت؛SM01rawunits | VERIFIED | comparison عددیبه‌معنایتغییر raw نیست |
| REQ-INBOUND-S03 | تاریخ ثبت سفارش جلالی و جدا از زمان ثبت دیتابیس؛ I1 | C2J ،C3YMDread ،D17calendar/check | U37 کل 293 سال/همهروزها؛U38 bounds/noTZ ؛P56 DBparity ؛P45/SM01roundtrip | VERIFIED | arrival جلالیازمصوبه SRC007 جدا،نهتعمیمبدونمجوز |
| REQ-INBOUND-S04 | سه فهرست مشترک توسعه‌پذیر؛ نوع الزامی، رنگ و کیفیت اختیاری و RAL مستقل؛ هر دو | C1typedselection ،C4actual ،D17catalogue/typedFK | P76 requiredness ؛P77 wrongkind/foreignreject ؛P78 alllists ؛P226 actual اختیاری | VERIFIED | canonicalreferenceUUID است،free-text جای selection نمیشود |
| REQ-INBOUND-S05 | ACT-PROC بتواند در هر سه فهرست گزینه بسازد، انتخاب و استفاده کند؛ بدون تأیید کارمند دیگر؛ I1 | C1record/current ،C8policy ،C3insertOption ؛D17labelunique | P78 PROC×3 و otherrolereuse ؛P45 HTTP ثبتباگزینهتازه؛SM01PROCMaterial/color/grade | VERIFIED | creation دستوراستاندارددوامدارمستقلاست |
| REQ-INBOUND-S06 | ACT-WH نیز در همان سه فهرست گزینه بسازد و برای actual استفاده کند؛ هر دو | C1cataloguepolicy ،C4selectactual ،D17typedoptions/D18actual | P78 WH×3 ؛P226 WHCOLOR/GRADE/SHEET ساختهو actual معتبر؛P244 ؛SM01 | VERIFIED | مجوز catalogue بهتنهایی POedit/stock نیست |
| REQ-INBOUND-S07 | گزینه‌ها بین هر دو نقش در دامنه مجاز قابل استفاده و دامنه‌های سازمانی جدا باشند؛ هر دو | C1/C8current ،C3scopeWHERE ،D17scopedFK | P78 sameUUIDotherrole ؛P80 foreign/SEC/CUST/revokeddeny ؛P77 foreignselection ؛P243 | VERIFIED | organizationboundary مصوب؛ACL براساسنامکارمندنیست |
| REQ-INBOUND-S08 | duplicate و رقابت با هویت exact-label ، عامل معتبر، audit و حفظ معنای تاریخی کنترل شوند؛ I1 | C1kind+labelownerlock ،C3evidence ،D17i1_option_label_uq/immutability | P78 visualvariantsdistinct/creator ؛P79 realraceoneoption ؛P55 mutationdeny ؛P81/P84 independentdurability/recovery | VERIFIED | شباهتدیداری exactidentity نیست؛merge/delete مصوبنیست |
| REQ-INBOUND-S09 | ساخت گزینه به‌تنهایی حق تغییر PO ، تأیید دریافت، پذیرش استثنا، stock یا correction ندهد؛ هر دو | C1 فاقد stockport ،C8role/actionseparation ؛C4B06 مستقل | P45 stock/foreign0 ؛P44 existingfactsunchanged ؛P242 PROCconfirmationdeny ؛P225 اصل ثابت | VERIFIED | authority دریافت WH از SRC007 است،نهاز cataloguecommand |
| REQ-INBOUND-S10 | نوع تجاری قابل توسعه، enum فنی Inventory را گسترش ندهد و به OTHER نگاشت خودکار نشود؛ هر دو | C1businessselection ،C6finiteResolver قبل stock ؛D17option/D18technicaltype | P244 newunsupportedoption→reject/Units0 ؛U56 OTHER/newtermsreject ؛P226 supportedCOIL/SHEET | VERIFIED | نوعواقعاًunsupportedexplicitreject/rolloutcheck ،نه approvalsystem جدید |
| REQ-INBOUND-S11 | اصل سفارش و مقدار واقعی پذیرفته‌شده با discrepancy مستقل حفظ شوند؛ هر دو | C3readimmutable ،D17privileges ،C4comparison ،D18immutableJSON/actor | P55 sourceeditdeny ؛P224 W1 ؛P226 تمام originaloptional/actualstates ؛SM01 اصلقبل/بعدبرابر | VERIFIED | actualNOT_RECORDED از absent جدا؛postconfirmcorrectionexcluded |
| REQ-INBOUND-S12 | PROC ثبت و خواندن سفارش، WH lookup اصل؛ current personal grants و خواندن scoped حفظ شوند؛ هر دو | C1/C8policy ،C3ownerquery ،C4query/C5selectedorder | P45 bothrolelookup ؛P46 closedHTTP/documentary ؛P80 forged/revoked ؛P223 siblingdeny ؛P249 waitrevoke ؛SM01 | VERIFIED | documentaryread هاگسترشنیافتند؛UI/UAT خارج |

## کاتالوگ دقیق آزمون و شاهد اجرای آن

در جدول بعد عنوان عیناً از خط موفق لاگ برداشته شده و به فایل واقعی test متصل است.
ردیف‌های P/U شمارالزام نیستند؛60 الزام فقط سه جدول بالا هستند. لاگ‌های ignored
unit/PG همان receipts پذیرفته‌شده‌اند و SHA256 آن‌ها در گزارش اجرا موجود است.

| شاهد | فایل واقعی / خط testcase | عنوان دقیق اجراشده | receipt اجرا |
| --- | --- | --- | --- |
| P44 | [inbound-additional.test.ts](../../apps/backend/tests/integration/inbound-additional.test.ts):361 | `A02/A25: existing manual stock and purchase/proforma sources remain byte-equivalent across successful and rejected I1 commands` | ✔ i2-integration-final.log:44 |
| P45 | [inbound-http.test.ts](../../apps/backend/tests/integration/inbound-http.test.ts):82 | `I1 composed HTTP: both roles create/reuse three catalogues; immutable independent order lines and equivalent authorized lookup` | ✔ i2-integration-final.log:45 |
| P46 | [inbound-http.test.ts](../../apps/backend/tests/integration/inbound-http.test.ts):223 | `I1 HTTP closes routes, bodies, role selection, query injection, revocation and documentary access` | ✔ i2-integration-final.log:46 |
| P50 | [inbound-integrity.test.ts](../../apps/backend/tests/integration/inbound-integrity.test.ts):51 | `I1 PostgreSQL finite R1 mappings agree with application without expanding equivalence` | ✔ i2-integration-final.log:50 |
| P51 | [inbound-integrity.test.ts](../../apps/backend/tests/integration/inbound-integrity.test.ts):91 | `I1 generated key preserves raw source, rejects forgery and transactionally rejects equivalent sources` | ✔ i2-integration-final.log:51 |
| P52 | [inbound-integrity.test.ts](../../apps/backend/tests/integration/inbound-integrity.test.ts):132 | `I1 deferred completeness prevents header-only and gapped commits; failed sources leave no partial aggregate` | ✔ i2-integration-final.log:52 |
| P55 | [inbound-integrity.test.ts](../../apps/backend/tests/integration/inbound-integrity.test.ts):260 | `I1 exact catalogue identity, UTF8 scalar bounds and immutable restricted privileges are enforced` | ✔ i2-integration-final.log:55 |
| P56 | [inbound-integrity.test.ts](../../apps/backend/tests/integration/inbound-integrity.test.ts):325 | `I1 actual Jalali CHECK agrees with validated application profile for every supported year` | ✔ i2-integration-final.log:56 |
| P57 | [inbound-integrity.test.ts](../../apps/backend/tests/integration/inbound-integrity.test.ts):376 | `I1 numeric CHECKs preserve exact lexemes and reject malformed input without an unsafe cast` | ✔ i2-integration-final.log:57 |
| P74 | [inbound.test.ts](../../apps/backend/tests/integration/inbound.test.ts):85 | `A01/A04/A06/A07/A15/A16: complete immutable original, identical and unnumbered lines, exact units, huge count and no foreign effects` | ✔ i2-integration-final.log:74 |
| P75 | [inbound.test.ts](../../apps/backend/tests/integration/inbound.test.ts):151 | `A02/A20/R1-T01..T06/T09/T11: only finite approved PO equivalence; raw payload remains bound` | ✔ i2-integration-final.log:75 |
| P76 | [inbound.test.ts](../../apps/backend/tests/integration/inbound.test.ts):216 | `A05: all seven required fields and optional null/blank/wrong types reject durably without partial orders` | ✔ i2-integration-final.log:76 |
| P77 | [inbound.test.ts](../../apps/backend/tests/integration/inbound.test.ts):281 | `A05/A18: missing, wrong-kind and foreign catalogue selection share a safe state rejection` | ✔ i2-integration-final.log:77 |
| P78 | [inbound.test.ts](../../apps/backend/tests/integration/inbound.test.ts):295 | `A10/A11/A13/A28/R1-T12: both roles all three kinds, exact labels and separately durable reusable options` | ✔ i2-integration-final.log:78 |
| P79 | [inbound.test.ts](../../apps/backend/tests/integration/inbound.test.ts):360 | `A03/A12: distinct people race equivalent POs and exact catalogue values at real owner-lock barriers` | ✔ i2-integration-final.log:79 |
| P80 | [inbound.test.ts](../../apps/backend/tests/integration/inbound.test.ts):421 | `A18/A19/A20: deny forged, copied, unrelated and revoked identities; cross-role same-person catalogue replay retains creator` | ✔ i2-integration-final.log:80 |
| P81 | [inbound.test.ts](../../apps/backend/tests/integration/inbound.test.ts):471 | `A22/A23/A28: business failure after all tentative lines rolls back only the order and retains independent catalogue outcome` | ✔ i2-integration-final.log:81 |
| P84 | [inbound.test.ts](../../apps/backend/tests/integration/inbound.test.ts):558 | `A21/A28: genuine lost catalogue COMMIT reply recovers independently before order registration` | ✔ i2-integration-final.log:84 |
| P194 | [receipt.test.ts](../../apps/backend/tests/integration/receipt.test.ts):72 | `manual factory intake creates one atomic received/posted origin and exact available kg without a ticket or purchase order` | ✔ i2-integration-final.log:194 |
| P212 | [receiving-integrity.test.ts](../../apps/backend/tests/integration/receiving-integrity.test.ts):146 | `I2 deferred source completeness rejects a source without its exact Inventory origin` | ✔ i2-integration-final.log:212 |
| P213 | [receiving-integrity.test.ts](../../apps/backend/tests/integration/receiving-integrity.test.ts):167 | `I2 complete source-to-Ledger bundle admits exact stock and preserves document precision` | ✔ i2-integration-final.log:213 |
| P214 | [receiving-integrity.test.ts](../../apps/backend/tests/integration/receiving-integrity.test.ts):198 | `I2 source-to-stock predicate rejects a real Ledger entry with wrong kilograms` | ✔ i2-integration-final.log:214 |
| P215 | [receiving-integrity.test.ts](../../apps/backend/tests/integration/receiving-integrity.test.ts):216 | `I2 runtime cannot mint, delete or alter authoritative physical-code claims` | ✔ i2-integration-final.log:215 |
| P216 | [receiving-integrity.test.ts](../../apps/backend/tests/integration/receiving-integrity.test.ts):234 | `I2 matching Ledger columns cannot conceal a forged effect weight or customer scope` | ✔ i2-integration-final.log:216 |
| P217 | [receiving-integrity.test.ts](../../apps/backend/tests/integration/receiving-integrity.test.ts):266 | `I2 immutable source and bounded original ordinal reject later append and updates` | ✔ i2-integration-final.log:217 |
| P218 | [receiving-integrity.test.ts](../../apps/backend/tests/integration/receiving-integrity.test.ts):302 | `I2 historical unclaimed legacy system code is protected without backfill` | ✔ i2-integration-final.log:218 |
| P219 | [receiving-integrity.test.ts](../../apps/backend/tests/integration/receiving-integrity.test.ts):349 | `I2 legacy lifecycle reaches POSTED once and cannot detach its claimed physical identity` | ✔ i2-integration-final.log:219 |
| P220 | [receiving-integrity.test.ts](../../apps/backend/tests/integration/receiving-integrity.test.ts):403 | `I2 migration preflight rejects historical nonexact receipt-origin mirrors without rewriting them` | ✔ i2-integration-final.log:220 |
| P221 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):257 | `I2-A01/A03/A10/A14/A20: five ordered units, three separately coded received units post exactly 6000kg and leave two outstanding` | ✔ i2-integration-final.log:221 |
| P222 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):336 | `I2-A01/A11: two arrivals increment only their actual received physical units and preserve order history` | ✔ i2-integration-final.log:222 |
| P223 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):365 | `I2-A02/A12/A14: one shared multi-PO consignment owns weights once and PROC sees driver but no unrelated PO or units` | ✔ i2-integration-final.log:223 |
| P224 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):418 | `I2-A06/A07: accepted changed W1 and actual dimensions retain immutable ordered facts and trusted approval` | ✔ i2-integration-final.log:224 |
| P225 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):449 | `I2-A08/A09: explicitly accepted excess, ORDER_ONLY and UNLINKED goods neither invent nor modify order lines` | ✔ i2-integration-final.log:225 |
| P226 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):491 | `I2-A07/A13/A14: ordered optional specifications remain immutable while actual selected, absent and not-recorded attributes are independently visible` | ✔ i2-integration-final.log:226 |
| P227 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):589 | `I2-A10: missing mandatory fields reject atomically while every absent optional receiving field remains permitted` | ✔ i2-integration-final.log:227 |
| P228 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):618 | `I2-A11/A12: finite Jalali profile and exact documented decimal kilograms are validated without whole-W1 coercion` | ✔ i2-integration-final.log:228 |
| P229 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):651 | `I2-A04/A05: duplicate code, waybill and external receipt numbers are rejected; identities do not inherit PO normalization` | ✔ i2-integration-final.log:229 |
| P230 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):686 | `I2-A04/A18: independent concurrent requests sharing a code admit exactly one source and stock effect` | ✔ i2-integration-final.log:230 |
| P231 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):712 | `I2-A08/A18: concurrent stale partial-delivery intents cannot silently become excess acceptance` | ✔ i2-integration-final.log:231 |
| P232 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):730 | `I2-A04/A18/A22: legacy/legacy confirmations contend on one physical code and cannot leave duplicate stock or orphan claims` | ✔ i2-integration-final.log:232 |
| P233 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):730 | `I2-A04/A18/A22: legacy/I2 confirmations contend on one physical code and cannot leave duplicate stock or orphan claims` | ✔ i2-integration-final.log:233 |
| P234 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):794 | `I2-A05/A18: independent receivers racing the same waybill reference commit one shared consignment only` | ✔ i2-integration-final.log:234 |
| P235 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):794 | `I2-A05/A18: independent receivers racing the same warehouseReceipt reference commit one shared consignment only` | ✔ i2-integration-final.log:235 |
| P236 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):837 | `I2-A16/A21: 129 physical units use several IPS invocations in one atomic commit without a false document cap` | ✔ i2-integration-final.log:236 |
| P237 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):837 | `I2-A16/A21: 257 physical units use several IPS invocations in one atomic commit without a false document cap` | ✔ i2-integration-final.log:237 |
| P238 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):909 | `I2-A16/A19: real late stock failure rolls back every source, claim, origin and previous IPS batch` | ✔ i2-integration-final.log:238 |
| P239 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):946 | `I2-A16/A17: audit failure rolls back stock and outcome; original identity retries successfully` | ✔ i2-integration-final.log:239 |
| P240 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):979 | `I2-A17: accepted and rejected durable replay preserve original identity and changed raw payload conflicts` | ✔ i2-integration-final.log:240 |
| P241 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):1004 | `I2-A15/A17: revoked individual cannot execute, read or disclose a prior outcome` | ✔ i2-integration-final.log:241 |
| P242 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):1026 | `I2-A15: PROC, SEC, customer and forged payload actors cannot acquire receiving confirmation authority` | ✔ i2-integration-final.log:242 |
| P243 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):1054 | `I2-A15: foreign-installation sessions cannot disclose orders or arrivals and scope fields cannot be forged` | ✔ i2-integration-final.log:243 |
| P244 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):1080 | `I2-A13: catalogue creation by WH is reusable, unsupported business types are not silently admitted as OTHER` | ✔ i2-integration-final.log:244 |
| P245 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):1102 | `I2-A04/A22: new receiving codes conflict with existing standalone codes, without changing legacy evidence` | ✔ i2-integration-final.log:245 |
| P246 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):1120 | `I2-A03/A13/A20/A22: received SHEET units share opaque product numbers without legacy productCode or fabricated Coil ancestry` | ✔ i2-integration-final.log:246 |
| P248 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):1198 | `I2-A15/A18: expiry during a verified real owner-lock wait rejects before any receiving or stock persistence` | ✔ i2-integration-final.log:248 |
| P249 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):1253 | `I2-A15/A18: grant revocation committed during an observed owner-lock wait denies the original command and its recovery` | ✔ i2-integration-final.log:249 |
| P253 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):1411 | `I2-A17: actual child-process crash after uncommitted sources leaves no partial stock and original-key recovery succeeds` | ✔ i2-integration-final.log:253 |
| P254 | [receiving.test.ts](../../apps/backend/tests/integration/receiving.test.ts):1479 | `I2-A17: unknown-COMMIT through real PostgreSQL transport is resolved by original input, with exactly-once stock` | ✔ i2-integration-final.log:254 |
| U37 | [inbound-values.test.ts](../../apps/backend/tests/unit/inbound-values.test.ts):27 | `A08/A09: all293 independently sourced Jalali year flags and every admitted day` | ✔ i2-unit-final.log:37 |
| U38 | [inbound-values.test.ts](../../apps/backend/tests/unit/inbound-values.test.ts):58 | `A08/A09: official boundaries, syntax, unsupported profile and no timezone conversion` | ✔ i2-unit-final.log:38 |
| U42 | [inbound-values.test.ts](../../apps/backend/tests/unit/inbound-values.test.ts):193 | `A06: exact dimensions retain20/18 source lexemes without rounding or unit conversion` | ✔ i2-unit-final.log:42 |
| U43 | [inbound-values.test.ts](../../apps/backend/tests/unit/inbound-values.test.ts):237 | `A07: whole W1/count limits and separate derived totals beyond stock capacity stay exact` | ✔ i2-unit-final.log:43 |
| U54 | [inventory-inbound-receiving.test.ts](../../apps/backend/tests/unit/inventory-inbound-receiving.test.ts):131 | `Inventory receiving prelocks all actual identities then invokes IPS in one original transaction across 128 boundaries` | ✔ i2-unit-final.log:54 |
| U56 | [inventory-inbound-receiving.test.ts](../../apps/backend/tests/unit/inventory-inbound-receiving.test.ts):171 | `Inventory receiving cannot substitute a receipt command or unsupported material fallback` | ✔ i2-unit-final.log:56 |
| U57 | [inventory-inbound-receiving.test.ts](../../apps/backend/tests/unit/inventory-inbound-receiving.test.ts):195 | `New receiving genealogy is source-backed with accepted W1 and cannot expose an unrelated receiving source` | ✔ i2-unit-final.log:57 |
| U119 | [receiving.test.ts](../../apps/backend/tests/unit/receiving.test.ts):43 | `I2 parsing preserves raw codes, exact decimal lexemes and all five absent optional receiving fields` | ✔ i2-unit-final.log:119 |
| U124 | [receiving.test.ts](../../apps/backend/tests/unit/receiving.test.ts):106 | `I2 uses validated finite Jalali arrival profile and rejects unsupported or invalid calendar days` | ✔ i2-unit-final.log:124 |

### SM01: probe محدود ممیزی، واقعاً اجراشده

یک سناریوی تازه با عنوان «تمام23فیلد: ثبت دقیق، DB، خواندن مجاز اصل/واقعی و3/6000/2»؛
فایل ignored `artifacts/tests/purchase-receiving-audit-smoke.mjs` و فرمان واقعی:
`artifacts/tests/i1-environment/node/node-v24.21.0-win-x64/node.exe --env-file=.env.local artifacts/tests/purchase-receiving-audit-smoke.mjs`.

- input کامل12فیلد خرید درخط40–46؛ WH original query/assertions در49–61؛
  input تمام11فیلد دریافت در64–83؛ SQL header/doc/source دقیق در87–103؛
  PROC exact field/actor/original/actual/document/stock readback در104–124؛
  3Unit/6000kg/2outstanding در125–129؛ اصل بدونتغییر وWH read/denialها در130–135.
- output `artifacts/tests/purchase-receiving-audit-smoke.log`: خطوط1–5 PASS، exit0،
  یک سناریو/صفرشکست. از HTTP واقعی وfixture موجود برایPG18.6/UTF8 ودو نقش محدود
  مجزا درDB آزمایشی ACKشده استفاده شد؛ هیچ mock persistence/authorization نبود.
- logSHA256: `CB32BCCAEBA946966BB181C5B341C4C1B68699F36BBB5E88276970AEA15844DA`؛
  probeSHA256: `EE700A1B5ADBF1F80AF90AF4AFC9BBE3874F243048646E62908ACB46477D11E9`.
- exactreadback قبلاً به‌صراحت برای برخیفیلدها assertنشدهبود؛ اکنوناین شاهد gapرا
  می‌بندد. probeبه349تست historical اضافه یا آزمونcanonical پیاده‌شده معرفی نمی‌شود.
  هیچ source/test/SQL اجرایی مخزن تغییر نکرد؛ فقط این دو سند deliverable هستند.
