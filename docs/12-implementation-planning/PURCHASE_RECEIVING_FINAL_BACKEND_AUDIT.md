---
id: AUDIT-INBOUND-001
title: Consolidated final purchase-to-receiving backend requirements audit
phase: 12-implementation-planning
status: in_review
version: 1.0.0
owners: [qa-architect, chief-solution-architect, security-architect]
depends_on: [APR-039, APR-043, SRC-004, SRC-005, SRC-006, SRC-007, DOM-INBOUND-REQ-001, DOM-INBOUND-FIELDS-001, DOM-INBOUND-POLICY-001, IMPL-I1-001, IMPL-I1-TRACE-001, IMPL-I2-001, IMPL-I2-TRACE-001, AUDIT-INBOUND-MATRIX-001]
last_reviewed: 2026-10-25
approval: null
supersedes: null
---

# ممیزی نهایی بک‌اند خرید تا دریافت انبار

**PASS — all in-scope requirements sufficiently verified.**

مجوز: دستور واقعی Owner با عنوان «ERP — FINAL END-TO-END BACKEND REQUIREMENTS
AUDIT» در2026-10-25. این یک ممیزی تجمیعی است؛ طراحی، سیاست کسب‌وکار یا پذیرش
جدید محصول نیست. سیزده قابلیت پذیرفته‌شده تحت APR-039/APR-043 حفظ می‌شوند.
مبنای کد I1 برابر `e3462fcfc4eaebbedb0d3a323bda7e0ae72d59c4` و I2 برابر
`b585fd795fb0276bc936af254c6d56fd7e3bcbe8` است. HEAD آغاز ممیزی
`ebad816fa17afe2580cfb44717238209ac175883` و working tree آغاز کار پاک بود؛
تفاوت آن با commit پیاده‌سازی در source/test/SQL/tooling/dependencies/gate صفر است.

## نتیجه هر الزام و هر فیلد

| وضعیت | تعداد از60شناسه |
| --- | --- |
| VERIFIED |59 |
| IMPLEMENTED / NOT FULLY VERIFIED |0 |
| PARTIAL |0 |
| NOT IMPLEMENTED |0 |
| OUT OF BACKEND SCOPE |1 |

[ماتریس60ردیفی شواهد](PURCHASE_RECEIVING_FINAL_BACKEND_EVIDENCE.md) شامل25قاعده،
23فیلد و12الزام تکمیلی است. برای هر ردیف معنا و مرحله، فایل/نماد واقعی، سازوکار
پایداری، assertion، عنوان دقیق آزمون و شاهد اجرای آن ثبت شده؛ ادعای trace قبلی
به‌تنهایی دلیل VERIFIED نیست. قابلیت I1، پیاده‌سازی I2 و شواهد مشترک تفکیک شدند.

هر23فیلد VERIFIED است:13الزامی/10اختیاری،12ورودی مسئول خرید/11ورودی مسئول
دریافت؛ granularities سفارش/خط/محموله/واحد مستقل حفظ شده‌اند. ماتریس23ردیفی در
همان فایل، اعتبارسنجی، persistence، بازخوانی مجاز و اصل/واقعی را جدا بررسی می‌کند.
نام اشخاص بیان وظیفه کارخانه است؛ مجوز نرم‌افزار از هویت شخصی و ACT جاری می‌آید.

REQ-INBOUND-025 الزام حاکمیتیِ بازنگری F01–F08 و عدم مجوز دستگاه/ثبت مستقل ticket
است. بازنگری تک‌به‌تک در reconciliation موجود و بررسی شد؛ شاخه دستگاه/ticket
صراحتاً خارج از بک‌اند پذیرفته‌شده است، نه قابلیت الزامیِ پیاده‌سازی‌نشده.
نمایش browser و کار فیزیکی با برچسب/کاغذ در سایر ردیف‌ها ادعا نشده‌اند؛ پشتیبانی
backend برای ثبت/ردیابی/خواندن آن‌ها بررسی شده است.

## نتیجه سناریوهای سرتاسری و تمامیت

| سناریو | assertion واقعی بررسی‌شده / نتیجه |
| --- | --- |
| ثبت سفارش پیش از ورود | ACT-PROC، خطوط همسان و بدون itemNumber باUUID/ordinal مستقل،7فیلد الزامی، lookup بدون حق تغییر برای WH؛ SQL نبود Unit/Lot/Ledger/Balance/Receipt/Production/Finance effect را assert می‌کند؛ P45/P74/P76/P44 موفق |
| دریافت عادی جزئی | P221 مستقیماً3source/3origin/3Unit/3Ledger و6000kg، accepted=3/remaining=2 و اصل2000kg/5 را assert می‌کند؛ سه کد دستی و سه source_fact_id مستقل؛ SM01 همین نتیجه را همراه تمام23فیلد دوباره در PG واقعی اثبات کرد |
| چند ورود / چند PO | P222 دو ورود،4واحد/8000kg و1باقی‌مانده؛ P223 یک header/waybill مشترک باW2/W3 دقیق، projection هر PO فقط اقلام خودش و driver را دارد؛ header وزن یک بار ذخیره می‌شود |
| مغایرت و استثنا | P224/P225/P226 مقدار اصل و واقعی، actor و اقدام صریح WH برای changed W1/mismatch/excess/ORDER_ONLY/UNLINKED را بررسی می‌کنند؛ هیچ PO line جعلی یا تغییر اصل؛ P244 رد نوع پشتیبانی‌نشده بدون OTHER |
| چند فراخوانی IPS | کد receiveMany با context اصلی در گام128فراخوانی می‌کند؛ U54 دقیقاً[128,128,1] را assert می‌کند. P236/P237 در PG واقعی129/257Unit و stock کامل، یک outcome و در257تمام صفحات را بررسی می‌کنند؛ سقف128برای invocation است |
| خطای فراخوانی بعدی | P238 trigger واقعی را قبل از Ledger insert129 فعال می‌کند؛ پاسخ503 و صفر arrival/source/origin/Unit/Ledger/kg/code-claim، سپس retry اصلی موفق؛ commit جزئی ممکن نشده است |
| audit / replay / crash / recovery | P239 خطای واقعی audit و rollback؛ P240 full-payload binding/replay؛ P253 kill واقعی پردازش پیش از commit؛ P254 قطع پاسخ پس از COMMIT تأییدشده و بازیابی همان ورودی بدون stock تکراری |
| امنیت / رقابت / سابقه | P229–P235 رقابت کد و اسناد و guard مسیر قدیمی/جدید؛ P241–P243 denial نقش/هویت جعلی/scope؛ P248/P249 انقضا/لغو هنگام lock wait؛ P212–P220 قیود، privileges، اصل ثابت و تاریخچه؛ همه اجرا شده‌اند |

P/U و عنوان/فایل دقیق هر شاهد در کاتالوگ ماتریس تعریف شده‌اند. خواندن source و
assertion نشان می‌دهد `ReceivingService.confirm → Inventory.receiveMany → IPS`
به همراه اصل دریافت، origin، audit و outcome یک PostgreSQL transaction دارد؛
Procurement نویسنده دوم stock نیست. 0017/0018 قیود scoped identity، immutable
source و complete source-to-stock bundle را اعمال می‌کنند. Genealogy از source
واقعی Unit/Lot/receiving-unit می‌آید و وزنِ اعلامی پذیرفته‌شده را «اندازه‌گیری مستقل»
جا نمی‌زند. legacy بدون PO/ticket حفظ شده؛ رد duplicate جدید تغییر عمدیِ مصوب است.

## اعتبار اجرای آزمون‌ها و اجرای محدود این ممیزی

لاگ‌های قبلی خوانده و SHA256 آن‌ها با گزارش commit پذیرفته‌شده تطبیق داده شد:
**198/198unit و349/349PostgreSQL18.6**، بدون failed/cancelled/skipped. مجموعه349
تمام فایل‌های canonical runner و22خانواده I2 را دارد؛ focused runهای9/7/45داخل آن
هم‌پوشان‌اند و به شمار اضافه نشده‌اند. پوشش I1 و قابلیت‌های قبلی نیز در همین
اجرای رگرسیون وجود دارد. هیچ اجرای جدیدِ کامل unit/integration ادعا نمی‌شود.

فرمان‌های تاریخی با Node24.21.0/npm11.19.0 عبارت‌اند از `npm run test:unit` و
`node --env-file=.env.local tools/test/run-integration.mjs`؛ executable ثابت و
محیط18.6 در [گزارش I2](I2_IMPLEMENTATION_STATUS.md) و تفکیک اجرای اولیه I1 در
[گزارش I1](I1_IMPLEMENTATION_STATUS.md) ثبت شده است. receipts تطبیق‌داده‌شده:

| لاگ تاریخی | نتیجه | SHA256 |
| --- | --- | --- |
| artifacts/tests/i2-unit-final.log |198PASS/0fail/0skip | A252867B47ABE428325F4070223907A58346654294E073B08681CCAC13F65FD3 |
| artifacts/tests/i2-integration-final.log |349PASS/0fail/0skip | 1D3F0971D9AE8DAE2A82BBD46A855F6C476448566F87E7FDA62B6590C6C5A70C |

در بازبینی assertionها، اثبات دقیق readback مقدار حاضر itemNumber، truckNumber و
originatingCompany و چند فیلد سند/تاریخ به اندازه کدشان صریح نبود. این خلأ محدود
شواهد با **یک SM01 واقعی و تازه** بسته شد: ثبت12فیلد کامل I1، دریافت11فیلد کامل
I2 و3واحد، مقایسه دقیق DB و HTTP مجاز PROC/WH، اصل/واقعی، کد/محصول، تاریخ، W2/W3،
مقادیر اختیاری، actor و موجودی؛ direct arrival برای PROC و read برای SEC رد شد.
این probe یک شاهد اضافی ممیزی است، نه ادعای suite350تایی یا تغییر آزمون canonical.

فرمان واقعی SM01 با Node ثابت24.21.0:
`artifacts/tests/i1-environment/node/node-v24.21.0-win-x64/node.exe --env-file=.env.local artifacts/tests/purchase-receiving-audit-smoke.mjs`.
نتیجه:1سناریو موفق/0شکست؛ لاگ ignored در
`artifacts/tests/purchase-receiving-audit-smoke.log`، هش
`CB32BCCAEBA946966BB181C5B341C4C1B68699F36BBB5E88276970AEA15844DA`.
probe از helperهای compiled موجود و HTTP واقعی استفاده کرد، نه mock؛ fixture
نسخه180006/UTF8، ACK دیتابیس آزمایشی، دو نقش محدود مجزا و جدایی dev را پیش از
reset تأیید کرد. سرویس آزمایشی قبلی روی loopback55438 خاموش بود؛ همان cluster
محلی با پنجره مخفی راه‌اندازی شد. خطای اولیه اتصال، شکست assertion کسب‌وکار نبود.
هیچ production data یا connection استفاده نشد؛ فایل probe/log داخل artifact ignored
ماند و هیچ source/test/migration مخزن تغییر نکرد.

`npm run preflight`، `npm run build`، `npm run format:check`، `npm run lint` و
`npm run boundaries` با PATH ثابت دوباره در همین ممیزی موفق شدند؛ boundary شامل
164فایل است. خروجی‌های ignored در `artifacts/tests/inbound-audit-*.log` نگهداری شدند.
این‌ها بررسی‌های فعلی‌اند؛ نتایج198/349 بالا شواهد اجرای قبلیِ کد بدون تغییرند.

## یافته‌ها، محدودیت و توقف

نقص قابل‌بازتولید BLOCKER/MAJOR/MINOR یا evidence gap باز در محدوده یافت نشد؛
فهرست مستقل یافته‌ها لازم نیست. کمبود assertion فوق با probe بسته شد، نه با
ترمیم پنهانی پیاده‌سازی. بازبینی مستقل requirement-to-code/test، دیتابیس/IPS و
امنیت انجام شد؛ هیچ یافته الزامی باز نماند. یافته‌های قبلی I1-REV-01–05 و
I2-SEC/ENG/SEC-DB در گزارش‌های موجود بسته‌اند؛ ممیزی وجود اصلاح و assertionهای
متناظر را بررسی کرد و آن‌ها را با برنامه آزمون اشتباه نگرفت.

محدودیت‌های مصوب باقی‌اند: I1حداکثر128خط، متن128Unicode scalar و512UTF8byte،
بودجه256KiB و pagination محدود، ابعاد exact20/18، W1/count مثبت کمتر از10^20،
پروفایل جلالی1206–1498 و رد نوع فنی پشتیبانی‌نشده. این‌ها نقص تازه یا سیاست
اختراعی نیستند. صحت مشاهده فیزیکی، رونویسی کاغذ و نصب برچسب وظیفه انسانی است؛
آزمون backend جای factory UAT یا صحت داده واقعی rollout را نمی‌گیرد.

workflow خرید تا دریافت **در محدوده بک‌اند audit-verified** است. هیچ UI، اتصال
دستگاه، تسویه مالی، QC، اصلاح/بازگشت پس از تأیید، بازنویسی تاریخچه، استقرار یا
پذیرش کل ERP ادعا نمی‌شود. هیچ increment یا طراحی جدید آغاز نشده و gate/unlock
تغییر نکرده است. فقط همین گزارش و ماتریس شواهد قابل commit محلی‌اند؛ بدون push.

## کنترل نهایی خود مستندات ممیزی

بازبینی مستقل بخش I1/فیلدها/S و بخش IPS/security، verdict و بسته‌شدن خلأ SM01 را
تأیید کرد. چند ارجاع کاتالوگ در پیش‌نویس کامل نبود؛ پیش از تحویل اصلاح و مستقل
دوباره بررسی شد. همه67عنوان منتخب، دقیقاً با source testcase و خط موفق لاگ تطبیق
دارند:58مورد PG و9مورد unit، افزون بر یک SM01؛ این انتخاب نماینده، شمار suite
جدید نیست. هر60شناسه یک بار در جدول تعریف شده، هر23نام فارسی دقیقاً مطابق register
است و تفکیک13/10 و12/11 درست است. بررسی94لینک محلی و metadata، چهار هش شواهد،
حفظ منابع/migrationهای تاریخی و working/staged diff موفق است. تغییرات قابل commit
فقط دو فایل Markdown هستند؛ commit و working-tree نهایی جداگانه گزارش می‌شود.
