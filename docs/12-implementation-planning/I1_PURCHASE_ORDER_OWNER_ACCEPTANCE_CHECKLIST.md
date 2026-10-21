---
id: PLAN-I1-OWNER-CHECKLIST-001
title: Recorded Owner acceptance of I1 detailed design and mandatory conditions
phase: 12-implementation-planning
status: accepted
version: 1.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [APR-038, APR-037, APR-036, SRC-006, PLAN-I1-REFERENCE-001, PLAN-I1-DECISIONS-001, PLAN-I1-ACCEPTANCE-001]
last_reviewed: 2026-10-21
approval: APR-037 accepted design; APR-038 bounded implementation authority
supersedes: null
---

# چک‌لیست پذیرش طراحی I1 — OWNER-ACCEPTED DESIGN / I1 EXECUTION UNDER APR-038

Current implementation authority: [APR-038 actual Owner instruction](../00-governance/approved-baselines/APR-038-i1-implementation-authorization.md).
See [delivered code and actual validation](I1_IMPLEMENTATION_STATUS.md) and
[60-ID executable trace](I1_IMPLEMENTATION_TRACE.md). The accepted design content
below remains normative; its earlier design-only/no-execution statements describe
the APR-037 historical stage and are superseded only for bounded I1 execution.
No I2 authority or Owner capability acceptance is inferred.


Owner در [APR-037](../00-governance/approved-baselines/APR-037-i1-detailed-design-acceptance.md)
هر چهارده تصمیم طراحی I1-D01 تا I1-D14 را در commit محلی
`9c0976e0519192358e8a097f7b26fe43f4b1df6e` رسماً پذیرفته است. این پذیرش با تمام
شروط ثبت‌شده معتبر است؛ مجوز پیاده‌سازی، فعال‌سازی قرارداد یا gate/unlock نیست.
وضعیت push این commit تأیید نشده و این سند تأیید دوبارهٔ تصمیم‌های پذیرفته‌شده را
درخواست نمی‌کند. R1 Option A در [SRC-006](../00-governance/team-answers/OWNER_R1_ORDER_REFERENCE_DECISION_2026-10-21.md)
و نگاشت کارخانه به installation نیز حل‌شده باقی می‌مانند.

ACCEPTED و ACCEPTED WITH CONDITIONS در جدول صرفاً وضعیت **طراحی** هستند. شروط
پذیرفته‌شده در [شش سند طراحی](I1_PURCHASE_ORDER_DOMAIN_DESIGN.md)،
[مشخصات R1](I1_PURCHASE_ORDER_REFERENCE_IDENTITY.md)، APR-037 و
[طرح آزمون آینده](I1_PURCHASE_ORDER_ACCEPTANCE_PLAN.md) قابل ردیابی‌اند. هیچ شرط
اجرایی با ثبت این پذیرش، انجام‌شده یا آزموده‌شده محسوب نمی‌شود.

| تصمیم | انتخاب فنی پذیرفته‌شده | وضعیت پذیرش طراحی | محدودیت قابل مشاهده برای کسب‌وکار | شرط پذیرفته‌شده / ریسک باقی‌مانده | تعهد مرحلهٔ بعد، پس از مجوز مستقل |
| --- | --- | --- | --- | --- | --- |
| I1-D01 | سفارش و ردیف و کاتالوگ در Procurement، جدا از شواهد خرید موجود؛ اصل ثبت‌شده تغییرناپذیر | ACCEPTED | اصلاح/لغو/افزودن بعدی ردیف در I1 وجود ندارد | حفظ مسیرهای قدیمی؛ چرخهٔ اصلاح آینده نیازمند سیاست جداست | پیاده‌سازی و اثبات مرز مالکیت و سازگاری در دامنهٔ مجاز آینده |
| I1-D02 | مرجع اصلی + کلید STORED تولیدشده با تابع محدود و نسخه‌دار؛ UNIQUE کارخانه بر کلید؛ lookup/locks یکسان | ACCEPTED WITH CONDITIONS | فقط چهار تبدیل R1 مجاز؛ سایر تفاوت‌ها معنی‌دار | تطابق app/DB، عدم جعل کلید، ثابت‌بودن v1 و بررسی collision برای تغییر آینده | پیش از کدنویسی آینده سازگاری محیط واقعی PG بررسی شود؛ سپس اثبات key/UNIQUE/locks/lookup و binding خام |
| I1-D03 | UUID و ترتیب ثابت برای هر ردیف، حتی مشخصات یکسان یا شماره آیتم غایب | ACCEPTED | ردیف‌ها خودکار ادغام نمی‌شوند | این UUID کد فیزیکی کالا نیست؛ انتخاب دریافت I2 جداست | اثبات پایداری شناسه، ترتیب و استقلال ردیف‌های یکسان/بدون شماره |
| I1-D04 | اعداد به صورت رشتهٔ دقیق؛ ابعاد مثبت20رقم صحیح/18اعشار، W1 و تعداد صحیح مثبت<10^20؛ مجموع جداگانه BigInt | ACCEPTED WITH CONDITIONS | خارج از ظرفیت یا قالب رد می‌شود؛ rounding نداریم | مجموع40/43رقمی هرگز Kg/stock نیست؛ حدود فنی‌اند نه اندازهٔ واقعی کارخانه | اثبات اعداد و واحدها بدون تبدیل/rounding و بدون کار یا حافظه متناسب با تعداد سفارش |
| I1-D05 | تاریخ جلالی مستقیم و پروفایل1206–1498 | ACCEPTED WITH CONDITIONS | تاریخ معنادار خارج بازه پشتیبانی نمی‌شود | بررسی مستقل293سال و app/DB قبل از پذیرش پیاده‌سازی؛ تعارض منبع آینده باید آشتی داده شود | اثبات تمام leap/month boundaryها و roundtrip بدون timezone؛ توسعهٔ بازه نیازمند بازبینی جداست |
| I1-D06 | سه کاتالوگ با برچسب دقیق و تغییرناپذیر، UUID و FK هم‌scope | ACCEPTED WITH CONDITIONS | تفاوت case/فاصله/ی‌ک/ارقام در برچسب‌ها ممکن است گزینهٔ مستقل بسازد | exact-label-only پذیرفته شده؛ R1 روی کاتالوگ اجرا نمی‌شود؛ alias/merge/rename نداریم | اثبات ایجاد/انتخاب/استفادهٔ مجدد هر سه کاتالوگ توسط هر دو نقش و حفظ تاریخچه؛ بدون گسترش enum یا OTHER خودکار |
| I1-D07 | ایجاد کاتالوگ و ثبت سفارش دو فرمان پایدار مستقل | ACCEPTED WITH CONDITIONS | گزینهٔ موفق ممکن است پس از شکست/رهاشدن سفارش بدون استفاده بماند | حذف خودکار یا انتقال مالکیت نداریم؛ بازیابی هر فرمان با هویت اصلی خودش | اثبات دوام مستقل، attribution/audit و استفادهٔ مجدد بدون rollback پنهان یا تصویب شخص ثالث |
| I1-D08 | دو فرمان ثبت سفارش/افزودن گزینه؛ سه query شماره/UUID/فهرست کاتالوگ | ACCEPTED | لیست کلی سفارش، ویرایش، دریافت و UI وجود ندارد | projection محدود؛ API خرید اسنادی موجود تغییر نمی‌کند | فعال‌سازی فقط با مجوز مستقل؛ اثبات payload/version/error/projection و سازگاری مسیرهای موجود |
| I1-D09 | envelope/binding/outcome/audit/recovery موجود، با raw payload | ACCEPTED | تغییر املای R1-equivalent با همان key تعارض است | business identity با command intent یکی نیست؛ unknown COMMIT فقط با اصل فرمان | اثبات replay و recovery با principal/scope/key/target/full raw input و audit اتمیک |
| I1-D10 | سه جدول افزایشی، FK/UNIQUE و شمارش deferred برای کامل‌بودن و منع append | ACCEPTED WITH CONDITIONS | ثبت ناقص سفارش قابل commit نیست | یک guard فقط SELECT؛ خطای deferred فنی/ممکن است uncertain باشد؛ اثبات واقعی PG لازم | بررسی سازگاری واقعی پیش از کد/migration آینده؛ سپس آزمون محدودیت‌ها، savepoint، COMMITfailure و منع append بدون تضعیف تضمین |
| I1-D11 | ترتیب key→Identity→hashهای مرتب مالک→source؛ کنترل current grants | ACCEPTED WITH CONDITIONS | انتظار/timeout ممکن است retry اصلی لازم کند | race با افراد مستقل و ترتیب hash واقعی، linearization revocation و recovery باید اثبات شود | آزمون واقعی race/wait/revocation/deadlock/timeout/crash و خطای persistence/audit با هویت‌های مستقل |
| I1-D12 | کلیدهای پایدار سفارش/ردیف برای توسعهٔ افزایشی I2، بدون stock/mapping | ACCEPTED | I1 دریافت، پیشرفت یا موجودی نمی‌سازد | B02–B09، mapping و B06 برای I2 باز می‌مانند؛ OTHER خودکار ممنوع | حفظ extension pointها؛ بدون شروع طراحی/پیاده‌سازی I2 یا استنتاج پاسخ سیاست‌های باز |
| I1-D13 | پوشش60شناسه،28سناریوی پایه و12خانوادهٔ آزمون R1 | ACCEPTED WITH CONDITIONS | این‌ها طرح آزمون‌اند، نه نتیجهٔ اجرا | تست واقعی Windows/PG، crash/race/audit و regression یازده قابلیت بعداً الزامی است | اجرای شواهد A01–A28 و R1-T01–T12 و بازبینی مستقل پس از مجوز؛ حفظ تفکیک I1/I2 و ثبت هر تغییر موجه |
| I1-D14 | متن128Unicode scalar/512UTF8byte؛1–128ردیف؛ درخواست/پاسخ262144byte؛ کاتالوگ50/100 | ACCEPTED WITH CONDITIONS | هر ترکیب حداکثری الزاماً در پاسخ جا نمی‌شود؛ پیش‌بررسی قبل از درج | scalar با نویسهٔ دیداری فرق دارد؛ برچسب‌های بلند ارجاع‌شده پاسخ را بزرگ می‌کنند؛ هیچ truncation/split خودکار | اثبات preflight دقیق HTTP پیش از درج source، خطای ظرفیت قطعی و خوانایی کامل هر سفارش commitشده |

بستهٔ پذیرش ظرفیت به زبان عملی: هر سفارش حداکثر128ردیف دارد؛ هر متن تا128کدپوینت
و512بایت است، نه128بایتِ نامتوازن برای فارسی. طول خام پیش از normalization سنجیده
می‌شود. درخواست و پاسخ کامل هرکدام سقف256KiB دارند؛ مشخصات و برچسب‌های بازیابی‌شده
در پاسخ حساب می‌شوند. تعداد واحدهای یک ردیف با تعداد ردیف یا اثر IPS یکی نیست.
حدود20/18 و تقویم محدود، مرزهای پذیرش فنی پذیرفته‌شده‌اند؛ دلیل بر بررسی بیشینه‌های واقعی
کارخانه نیستند. گزینهٔ تازه مستقل می‌ماند؛ خطای سفارش آن را حذف نمی‌کند.

شرط مقدماتی APR-037: **پیش از شروع هر پیاده‌سازی آینده** باید نسخهٔ واقعی و مورد
پشتیبانی PostgreSQL، UTF8/C، STORED generation، رفتار/properties تابع immutable،
EXECUTE محدود و ownership/conventions schema با این طرح تطبیق داده شوند. انتظار
PG18.6 در repository شاهد نسخهٔ محیط متصل یا مستقر نیست. ناسازگاری باید پیش از
کدنویسی/migration گزارش و آشتی داده شود؛ جایگزینی خاموش یا کاهش تضمین مجاز نیست.
این بررسی محیط یا هیچ آزمون application/PostgreSQL در این کار مستندسازی اجرا نشده است.

پذیرش طراحی، شروط اجرای آینده را حذف نمی‌کند: آزمون واقعی DB برای parity/uniqueness/
aggregate integrity/recovery، اعتبارسنجی مستقل تقویم، مجوزهای جاری و isolation،
صفر اثر خارجی و regression یازده قابلیت، بازبینی مستقل مهندسی/امنیت و رفع یافته‌های
الزامی همچنان لازم‌اند. هر انحراف از طراحی پذیرفته‌شده باید گزارش و بازبینی شود.

## وضعیت پذیرش و اقدام بعدی

- [x] Owner طراحی فنی I1-D01–I1-D14 را با شروط فوق در APR-037 صریحاً پذیرفته است.
- [x] Separate bounded Owner implementation authority is recorded in APR-038.
- [x] Canonical gate/local unlock reconciled strictly for APR-038 I1 scope.

APR-037 records actual Owner design acceptance; APR-038 is the subsequent explicit
bounded implementation instruction and authority for the scoped gate/unlock update.
No accepted design decision is reopened. The historical [handoff draft](I1_PURCHASE_ORDER_IMPLEMENTATION_AUTHORIZATION_DRAFT.md)
remains PROPOSED, not the source of execution authority. See [actual delivery and
verification](I1_IMPLEMENTATION_STATUS.md). The next boundary is separate Owner
capability acceptance, with no I2, UI, factory UAT or production authority inferred.
Eleven backend capabilities remain Owner accepted. No remote push is authorized.
