---
id: PLAN-P4B-DESIGN-001
title: P4b Sales UI workflow and contract proposal
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [delivery-lead, frontend-engineer, security-architect, data-architect]
depends_on: [PLAN-P4B-CAPABILITIES-001, APR-049, TOOL-UIUX-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-11-07
approval: null
---

# Sales UI workflow and contract design

**DESIGN PROPOSAL — IMPLEMENTATION NOT AUTHORIZED**

The [capability matrix](P4B_SALES_EXISTING_CAPABILITIES_AND_GAP_MATRIX.md) owns
current-source evidence. Every extension below is proposed, conditional on the
[OPEN decisions](P4B_IMPLEMENTATION_AUTHORIZATION_DECISIONS.md). No route, grant,
component, query, command or migration is implemented by this document.

## Bounded goal, users and scope alternatives

Help a personally authenticated Sales user find an authorized customer's demand,
understand its immutable lines/evidence, and, if D1 authorizes the operational
option, draft → submit → explicitly record STOCK or MAKE assessment → confirm.
Use the accepted native Persian HTML/CSS/TypeScript operator application.
Keep current Sales ownership, personal exact-customer grants and existing commands.

Minimum alternative is read-only customer/order/assessment discovery and details.
Recommended operational alternative adds the six existing commands and, only if
D4 approved, a minimal item-scoped stock candidate picker. A UUID-only STOCK
fallback is possible if the Owner deliberately accepts its usability limitation;
never secretly substitute it for discovery. D1 B + D4 A means operational STOCK/MAKE
with the candidate picker; D1 B + D4 B means operational STOCK/MAKE with known-UUID
entry. Only D4 C defers all STOCK entry and requires D1 A (read-only) or C
(explicit MAKE-only commands). No partial option is silently activated.

Exclude reservation mutations/status aggregates, shipping/production navigation,
monetary fields, finance evidence, CRM, business-number generation, editing saved
orders, cancel/hold/close, export/print, notifications, portal, stock mutation and
all P4c/P4d/P5/P3 implementation. The confirmed Sales state is not allocation,
shipment, delivery, invoice, payment, fulfillment or closure.

## Existing command contracts to reuse unchanged

All commands version 1, standard envelope, lowercase UUID-v4 idempotency key,
UUID target, exact payload and empty preconditions. Current trusted actor supplies
installation/account/person/role/customer context; never payload identity overrides.
[Service contracts and parsers](../../apps/backend/src/modules/sales/sales-service.ts)
remain authoritative; [durable envelope](COMMAND_IDEMPOTENCY_SPEC.md) remains binding.

| Command | Target kind / target | Exact payload | Guard / canonical result |
| --- | --- | --- | --- |
| DraftSalesOrder | sales-order / new UUID | `{customerId,items:[{id,type,description,demandedKg,allowPartialShipment}]}` | 1–8 unique lines, exact selected customer; immutable customer/item snapshot, DRAFT |
| SubmitSalesOrder | sales-order / existing UUID | `{}` | DRAFT → SUBMITTED; no automatic assessment |
| DraftFulfillmentAssessment | fulfillment-assessment / new UUID | `{orderId}` | Own DRAFT or SUBMITTED order → new DRAFT assessment |
| RecordFulfillmentStock | fulfillment-assessment / existing UUID | `{selections:[{itemId,unitIds}]}` | Each demand line exactly once, ≤16 distinct Units overall; owner verifies sufficient matching AVAILABLE kg → RECORDED STOCK |
| RecordFulfillmentMake | fulfillment-assessment / existing UUID | `{}` | Own DRAFT assessment/order DRAFT or SUBMITTED → RECORDED MAKE; no stock/production creation |
| ConfirmSalesOrder | sales-order / existing UUID | `{assessmentId}` | Own SUBMITTED plus matching immutable RECORDED assessment → CONFIRMED; STOCK availability reread; MAKE no finished stock selection |

Demand strings are positive whole kg below 10^20, not decimal input. Description
is at most 128 UTF-8 bytes, valid nonblank Unicode without controls; preserve its
original value. Type is COIL/SHEET/ANGLE/BEAM/OTHER; partial-shipment preference
is an explicit boolean, not default inferred from quantity. Client UUID generation
is technical identity, never a human Order Code. Server checks all invariants.

## Proposed browser contracts and DTOs

Exactly six POST read routes and one POST command route are proposed under
`/ui-api/sales/v1/`. These names do not extend the accepted legacy bearer routes.
Each route is explicitly allowlisted, strict duplicate-safe JSON with unknown
fields rejected. No arbitrary URL forwarding, GET customer query strings or new
framework. New reads are nonmutating owner queries, not durable commands.

All read success bodies: `{data:..., observation:{snapshotAt,respondedAt,
consistency:"PAGE_SNAPSHOT"}}`. UTC server ISO timestamps represent database
observation and response, not a business order date. Detail reads are also one
snapshot. Every list returns `{items,nextCursor}`; no total/global count.

Shared pagination proposal: limit default 25, allowed 10/25/50, UUID ascending
keyset; typed exact filters AND together. `nextCursor` is opaque, original TTL
10 minutes, at most 2048 ASCII characters. HMAC with separate Sales/version purpose
binds installation, authority, account/person/session, ACT-SALES, selected customer
(or roster purpose), normalized validated filters, route/parent identity, page
size, last UUID and policy revision. Never accept caller ownership or a raw
afterId as authority. Reject malformed/tampered/wrong-context/expired cursors;
reauthorize every page. No cross-page frozen dataset or chronology claim. Changing
filters/customer/role/page size starts a new traversal. UUID sort deliberately
avoids inventing a business reference or rounding SQL timestamps into cursor keys.

| Route / proposed operation | Input body (optional fields marked ?) | Data whitelist / owner |
| --- | --- | --- |
| `/customers/query` / ListSalesCustomers | `{limit?,cursor?}`; no customer header | Current personally granted configured customer references in trusted installation/authority: `{customerId,displayName}` only. Sales owner reads current Customer; Identity grants restrict before order/limit/lookahead. No full directory, search, person roster or grant administration. |
| `/orders/query` / DiscoverSalesOrders | `{filters?:{orderId?,state?,itemType?},limit?,cursor?}` | For one selected customer: `{orderId,customerId,customerName,state,itemCount,confirmedAt?,confirmedAssessmentId?}`. Sales snapshot name may differ from current roster label. No bindings, sums or hidden timestamps. `itemType` means at least one matching immutable item, not all. |
| `/orders/detail` / GetSalesOrder browser wrapper | `{orderId}` | Existing public order fields: `{id,customerId,customerName,items,commercialTerms,state,confirmedAt?,confirmedAssessmentId?}`; item fields exactly existing contract. No binding or private MAKE reference. |
| `/assessments/query` / ListSalesOrderAssessments | `{orderId,limit?,cursor?}` | Authorize own parent first. `{assessmentId,orderId,customerId,state,mode?,observedAt?}` by assessment UUID; no singleton/latest assumption. Proposed summary omits mode/time for DRAFT; existing SQL point reads may return default STOCK mode even on DRAFT, which is not recorded evidence. RECORDED absent mode uses service's existing STOCK fallback. |
| `/assessments/detail` / GetFulfillmentAssessment browser wrapper | `{assessmentId}` | Existing public `{id,orderId,customerId,state,mode?,selections?,stock?,observedAt?}`; stock rows `{unitId,kind,state,availableKg}` are recorded historical evidence, not current availability. No binding/orderBinding. |
| `/stock/query` / DiscoverSalesStockForItem (D4 conditional) | `{orderId,itemId,filters?:{unitId?,internalCode?},limit?,cursor?}` | Inventory-owned minimal projection `{unitId,internalCode:null|string,kind,state:"AVAILABLE",availableKg}`; exact decimal text. Parent order/item must exist in selected customer and DRAFT/SUBMITTED, type derives from item. No customer owner key, Lot/source/commercial document, reserved/allocated quantities, location, competitor or production data. |
| `/commands` / fixed existing-command adapter (D1 conditional) | Existing six-command v1 envelope | Existing durable execution result, status and nondisclosing rejection semantics. No new business command, payload fields or precondition rules. |

For every route except customers/query, exactly one `x-customer-id` UUID header
is required and checked against a current exact grant. The roster accepts no
customer selector; payload customer on DraftSalesOrder must match the header.
Reject duplicate selectors, x-erp-role, caller installation/authority/account
overrides and mixed selector sources. Preserve existing PROC/WH bootstrap grants;
add only a bounded `hasCustomerSales` capability marker computed by a current-grant
EXISTS query, not an unbounded Sales grant/customer-ID/name array. Obtain Sales
customer choices exclusively through paged roster reads. This grants no new role.
Roster permission is the bounded intersection of
current exact Sales grants and configured Sales references, not organizational
Sales access. A missing configured reference yields no selectable entry.

### Read authorization, snapshots and safety bounds

Use Identity-issued branded contexts, parameterized owner SQL and transaction
snapshot. Scope by trusted installation/authority/customer before filters, LIMIT,
lookahead, item predicates or enrichment. Authorize parent before child reads;
never fetch private records into memory then trim a broad result. Roster restricts
using current authorized customer identities before customer labels are read.
Do not trust an initial list/customer session response as continuing permission.

Roster admission authenticates the personal session/account without asking for
an organizational ACT-SALES context: ordinary `Identity.context(token,'ACT-SALES')`
without a customer requires an org grant and is not this design. Propose a bounded
Identity-owned current customer-grant read tied to the authenticated session,
intersected through Sales owner reads before labels/pagination. No fabricated
unscoped execution context or require-any-org-role shortcut. After releasing
the roster snapshot, freshly verify every returned customer's exact grant and
every lookahead/customer membership used to build its cursor. If any such grant
was revoked, fail/restart the entire page with a nondisclosing error; session plus
another surviving Sales grant is insufficient. Never disclose the revoked label
or next-page membership. This is an explicit D2 read-contract gap.

Proposed per-page read-only REPEATABLE READ data transaction: one captured server
snapshot, bounded owner statements, no row/advisory Inventory writer locks or
SKIP LOCKED/dirty/stale fallback. Release snapshot then freshly validate the
session/account/person/current customer grant before writing any successful body
or object-derived error. Expired/revoked authority takes precedence over a
materialized result or private diagnostic. Existing legacy `salesQuery` lacks
this post-release check; reuse its semantics, not a claim it already satisfies
this new browser requirement. Preserve legacy behavior unless separately authorized.

Proposed starting resource caps, subject to D6/D7 verification: read body 8 KiB,
depth 4; result maximum 50 plus one authorized lookahead; serialized response
128 KiB; 16 active Sales reads/process; 1-second lock, 4-second statement and
8-second whole-read deadlines, 15-second browser timeout. Cursor and response
limits are admission bounds, not measured performance claims. SQL data statements
at most four for ordinary Sales reads (excluding transaction/Identity checks);
stock at most four Inventory data statements and at most 10,000 source Ledger
rows/page, with whole-page bounded failure for hot/corrupt sources. Roster grant
enumeration must be bounded in SQL/owner query, not an unbounded session-array
scan declared scalable; future implementation must show a bounded current-grant
access path. No counts or partial integrity results escape on budget exhaustion.
Existing command 4096-byte/depth limits remain unchanged; a proposed UI must
check full UTF-8 envelope bytes, since 8 maximal lines/16 Units may approach it.
An over-budget envelope stays unsent with actionable reduction guidance; any
proposal to raise the accepted command body limit requires separate review.

### Inventory candidate semantics — explicit D4 proposal

Eligible candidate scope is organizational stock or stock keyed to the same
selected customer, in trusted installation/authority, matching the existing
order item's broad type. Cover legacy receipt, I2 receiving and production origins
only where the authoritative Inventory scope and lifecycle permit. Only AVAILABLE
positive kg with no active reservation or production issue and consistent
Ledger/Balance/claims can appear. Source rows/state/ownership checks remain
Inventory-owned. Do not use APR-048's Warehouse exception, clone its customer-blind
query or call the lock-taking command `availability` once per row.

This is a new proposed Sales disclosure, including internalCode as a selection
aid; it needs Owner approval even where command-time stock access is already
accepted. Unit IDs/code/type/eligible kg only, no other customer's identity or
reserved stock, general inventory list, Lot navigation or origin detail.
Proposed exact internalCode input reuses the accepted Inventory discovery lexical
rules: valid Unicode, nonblank, no C0/C1/DEL controls, at most 128 code points and
512 UTF-8 bytes, exact stored equality with no trim/case/digit normalization.
UUID fields use the existing validUuid/36-character canonical transport rule;
Sales state/type filters accept only the existing enums. See
[Inventory parser](../../apps/backend/src/modules/inventory/discovery.ts).
Scope/eligibility precedes keyset lookahead. Validate exact whole/fractional stock
through existing invariant semantics; drift/claim/issue disagreement is unavailable,
never silent zero or rebuilt Balance. A short page is not evidence of total stock.
`availableKg` is current observed eligible kg, not a promise, split authorization
or automatic specification match. Source may change after a page: record/confirm
still use existing sorted owner locks and fresh checks. Two orders can see the
same candidate; only the accepted Reservation commands allocate, outside P4b and
through the separate future P4c UI. No read writes Ledger, Balance, claims,
assessment facts, unit state or audit business-command outcomes.

### Error and retry contract

Browser admission failures: 400 invalid bounded shape/selector, 401 invalid session,
403 forbidden current actor/CSRF/Host/Origin, 404 missing/foreign/denied/unsupported
resource after valid scoped admission; no existence distinctions. Invalid or
expired cursor is generic 400 `invalid-cursor`, reset traversal. Budget/integrity/
database unavailability is 503 `unavailable`, no partial data, counts, SQL names
or corruption details. Auth revocation wins before private error disclosure.
Server diagnostics are redacted, contain no customer data/credential/payload dump.

Commands preserve completed accepted 200 / durable rejected 422, envelope binding
conflict 409, admission denied 403, technical/uncertain 503 semantics from
[Sales HTTP](../../apps/backend/src/transport/sales-http.ts). Guard families
STATE/INVARIANT/ACTOR/DUP/CONFLICT map to Persian actionable text without displaying
internal English messages. A definitive rejection is terminal for that key;
editing requires a genuinely new reviewed intent/key, not retrying a cached
rejection and expecting a different decision. DUP does not prove that this intent
succeeded: fetch authorized canonical facts, compare binding-relevant public data
and never overwrite. A lost response/unknown technical outcome freezes exactly
the same envelope and key until resolved. Read refresh is safe; it is not proof
that an uncertain write failed.

Existing `commandBody()` generates a new target UUID as well as a new key; it
cannot be reused unchanged for Submit/Record/Confirm. A later implementation must
construct those envelopes with the exact existing order/assessment target, while
only Draft commands generate new document identities. A fresh key belongs to a
deliberately new action; uncertainty always reuses both original key and target.

## Persian RTL interaction specification

### Existing design system and mandatory skill application

Read full pinned [skill](../../.agents/skills/ui-ux-pro-max/SKILL.md),
[quick reference](../../.agents/skills/ui-ux-pro-max/references/quick-reference.md)
and [pro rules](../../.agents/skills/ui-ux-pro-max/references/pro-rules.md), under
the [reviewed local workflow](UI_UX_SKILL_GOVERNANCE.md). Package verification
passed before local isolated searches. Queries contained generic design terms.

Design-system query `industrial sales order dashboard`, then one narrower
`enterprise ERP dashboard` retry, both returned General / Hero + Features + CTA.
That landing-page pattern is unsuitable; no verified ERP-specific design-system
pattern was found. Use the accepted shell as the explicit fallback, not generated
fonts/palette/framework examples. `minimal flat interface --domain style --rtl=full`
returned Minimalism & Swiss Style (full RTL), suitable only as consistency guidance.
`error summary validation --domain ux` returned Focusable Error Summary;
`focus not obscured --domain ux` returned enhanced and minimum variants. Aim for
fully visible focus; do not mislabel enhanced AAA guidance as AA certification.
No stack match is claimed: native HTML/CSS/TypeScript is not html-tailwind.
Mobile-native pro-rule units/platform behaviors do not replace desktop-web semantics.
Local raw query receipts are under ignored `artifacts/tests/p4b-design/skill-*.json`.

Reuse [shell CSS](../../apps/backend/src/operator/styles.css): Tahoma/Segoe UI,
16px body, 1.8 line height, dark-green header `#123e35`, green primary `#176349`,
white bordered sections, existing light surfaces, 8px radii, 44px control height,
visible amber focus, 4/8px spacing rhythm. No font fetch, framework, icon package,
new design system, dark-theme expansion or P1/P2 redesign. Verify actual contrast
of new states, not assume existing colors prove it. Semantic HTML and text labels,
textContent rendering and safe isolation continue; no dynamic innerHTML.

### Navigation and wireframes

After session bootstrap, role selector offers only current personally granted
roles. Selecting **فروش** reveals **مشتری** and Sales navigation. Organizational
ACT-SALES alone offers no order access. With WH+Sales, each selected role remains
separate: WH stock results cannot become Sales candidates or share filter caches.
Current customer remains visible above every Sales panel and confirmation.

```text
Desktop RTL (logical order starts at right)
Header: ERP title | current personal identity | selected role | secure logout
Sales context: مشتری [authorized label + isolated UUID] [تغییر مشتری]
Nav: سفارش‌ها | ثبت تقاضای جدید (only operational option)
Orders: heading + current customer + page observation
Filters: وضعیت [all/current enum]  نوع کالا [all/exact]  شناسه سفارش [advanced]
Actions: جست‌وجو  پاک‌کردن فیلترها  تازه‌سازی
Table: شناسه سفارش | مشتری ثبت‌شده | وضعیت | تعداد اقلام | زمان تأیید | مشاهده
Footer: per-page as-of warning | صفحه بعد (no total or guessed last page)
Detail: سفارش → اقلام → ارزیابی‌های تأمین → explicitly selected assessment
Action area: one state-appropriate primary action; unsupported actions absent
```

Order UUID is displayed as **شناسه سفارش** with full copyable value; shortening
visually must leave full keyboard-accessible disclosure. Do not call it **کد سفارش**
or imply chronological numbering. List default has no UUID prerequisite; state
labels: DRAFT **پیش‌نویس ثبت‌شده**, SUBMITTED **ارسال‌شده برای تأیید**,
CONFIRMED **تأییدشده؛ بدون تضمین تخصیص**, IN_PRODUCTION **در تولید**.
Assessment labels DRAFT **ارزیابی ثبت‌نشده نهایی**, RECORDED **ارزیابی ثبت‌شده**;
STOCK **از موجودی مشاهده‌شده**, MAKE **نیاز به تولید**. These are display labels,
not new lifecycle semantics. NOT_SUPPLIED is **شرایط مالی ارائه نشده است**.
For a DRAFT assessment, render **روش تأمین هنوز ثبت نشده است** regardless of
the SQL default mode returned by an existing point read; do not show a completed
STOCK decision until state RECORDED. Detail DTO otherwise preserves existing
public fields; this is a UI interpretation rule, not a mutation/default change.

Order detail shows immutable customer snapshot versus current selected-customer
label explicitly, all lines in original order, exact demanded kg, broad type,
full description and partial-shipment preference. No prices/zero totals/calendar
input. Server instants show consistent Persian localized date/time with explicit
timezone, and accessible exact UTC value; do not invent a Jalali business date or
convert a server instant into an order registration date. Future locale formatting
must preserve instant and be tested around day/offset boundaries.

### Forms and state-dependent actions

1. New local draft: customer fixed to current context; 1–8 line fieldsets, type,
   description, **وزن تقاضا (کیلوگرم کامل)**, explicit **ارسال جزئی مجاز است؟**
   yes/no choice. Add/remove local rows with labelled controls and stable line
   IDs. Accept canonical ASCII whole kg as current command requires; show a clear
   Persian hint, reject Persian/Arabic digits/grouping/decimal without silently
   changing input. Display saved quantities with exact string-based Persian
   digits/grouping, retain accessible/copyable canonical lexeme. No Number coercion.
2. Review before **ثبت پیش‌نویس غیرقابل‌ویرایش**: customer/items/partial preference,
   warning that saved drafts cannot edit/cancel, separate Back to local edit.
   Save only DraftSalesOrder. Success fetches canonical detail; do not auto-submit.
3. DRAFT order: **ارسال برای تأیید**; assessment may be created in DRAFT or
   SUBMITTED as backend allows, but UI explains confirmation needs submission.
   No persisted edit/delete/cancel action. Local discard has no server effect.
4. Assessment: create new UUID bound to order; choose STOCK or MAKE before recording.
   STOCK picker groups lines, reveals immutable item description/type/demand,
   paged exact-code/UUID candidates, ≤16 total unique Units and no duplicate across
   lines. Preserve selections across candidate pages by Unit identity; refreshed
   observations are marked, not treated as committed. Do not derive kg from count
   or promise suitability. Show line membership and exact observed kg, no client
   fulfillment/allocatable calculation as authority. Server remains final validator.
5. Record preview lists explicit mode and selected Units; **ثبت ارزیابی** invokes
   existing Record command. Recorded rows show their historical observedAt and
   stock, separated from newly refreshed candidates. Changing selection/mode needs
   another assessment identity, not rewriting history. MAKE says **این اقدام تولید
   را شروع نمی‌کند**; do not require picking stock for MAKE.
6. SUBMITTED + explicitly selected matching RECORDED assessment: **تأیید تقاضا**
   opens review showing customer, all lines, mode/time/IDs, STOCK freshness and
   **تأیید تقاضا به معنی رزرو یا تضمین موجودی نیست**. Confirm only on deliberate
   final action. Stock state change rejects safely; preserve historical assessment,
   offer refresh/new assessment, never silently change its Units or retry new key.
7. CONFIRMED / IN_PRODUCTION: read-only Sales state/evidence; no manufacture,
   reserve, dispatch, delivery or close button. Link only to authorized order and
   assessment panels. Deferred related module status is **در این مرحله ارائه نمی‌شود**,
   not zero reservations/shipments or no production.

### Loading, accessibility, responsive and recovery behavior

Visible labels, native forms/buttons/selects/fieldset/legend, semantic table caption,
column scopes, sequential headings and skip link. Tab follows logical RTL reading
order; Enter submits only the active form, no accidental confirmation. Failed form
focuses linked error summary and retains inline errors via aria-describedby.
Navigation focuses destination heading; Back restores originating control where
available. Polite status for loading/results, alert for rejection; never announce
unbounded result counts or move focus on every field blur. Status text accompanies
color, decorative icons hidden, all meaningful controls named. Keyboard focus
fully visible around sticky content. Web controls target 44px design hit area;
actual WCAG target/focus/contrast/reflow verification belongs to later Chromium work.

Desktop table fits essential columns; long UUID/descriptions wrap or expand.
At 375px and 200%/400% zoom use labelled stacked rows retaining table semantics
and reading order, no hidden essential field or body-level horizontal overflow.
No hover-only action, drag dependency, unnecessary motion, or inaccessible nested
scrolling. Respect reduced motion. Preserve visible full text and exact quantities.

First load **در حال دریافت…**, no results **سفارشی در محدوده و فیلتر فعلی یافت نشد**,
no Sales customer **مشتری مجاز و پیکربندی‌شده‌ای برای این حساب در دسترس نیست**.
No empty state offers grant/customer creation. Empty stock says eligible observed
candidates absent, not factory has no stock. Failed read clears/marks stale data
and offers read retry; never leaves old customer's rows beneath a new header.
Every page retains its own snapshot timestamp; appended pages are not one snapshot.
Refresh begins page one; invalid/expired cursor offers restart, preserving filters.

Every asynchronous continuation captures installation, account/person, selected
role/customer, session epoch and request generation. Abort alone is insufficient:
ignore late success, late error, finalizers and supplementary reads unless all
match. On customer/role/logout/expiry/account replacement, synchronously clear
private rows/forms/selections/errors, advance generation, cancel requests and
require fresh authorization; do not let old responses revive data or unlock new work.
Reuse accepted focus/visibility/pageshow/local expiry/broadcast patterns; extend
them deliberately, because current shell types only PROC/WH.

Session epoch includes cookie/CSRF rotation even for the same account/person.
Check ownership before handling an old 401/403 or running global lock/finalizer
effects: a superseded denial must not clear the newer workspace; a current denial
must lock immediately. Keep a bounded navigation stack so Back from a related
assessment/order cannot loop to itself. Read-only navigation never discards an
unresolved command. A dirty local form prompts **ادامه ویرایش** or **کنارگذاشتن
تغییرات محلی** before leaving/changing customer; there is no automatic server
autosave. Revocation/logout/actor replacement clear private local fields
immediately and do not offer a way to keep showing unauthorized business data.

Pending commands use an explicitly versioned Sales recovery record, bound to
installation/account/person/ACT-SALES/customer/command/target/full serialized
payload/key. Proposed recovery contains one unresolved intent per tab, encrypted
before dispatch with a server-derived encryption-only key. No tokens, plaintext
business payload in storage, queue or automatic cross-customer retry. Existing
PROC/WH recovery namespace/data must remain intact. If storage fails, do not send.
An unresolved PROC/WH or Sales intent blocks every newly created write intent
across all roles in that tab, not just commands in its own storage namespace.
Before dispatch/recovery, consult both existing P1 and proposed Sales pending
records under one tab-wide ownership rule; preserve the original ciphertext and
never overwrite or migrate it just because a role/customer changed. If multiple
pre-existing pending records are encountered, fail closed for all new writes and
offer only context-authorized resolution/informed close of each exact record.
No second unresolved writer or automatic replay across roles. Read-only navigation
may proceed under current authorization while maintaining this write interlock.
Customer change
requires resolving same intent or an explicit informed close-recovery action;
closing recovery is not cancellation. Ciphertext may remain for the same
authorized actor, but is never shown/replayed in another customer context.
On same-customer reentry, current grants and exact intent binding precede recovery.
Accepted command result terminates this exact intent before supplementary reads;
failed readback offers read retry without pretending the write failed. Definitive
rejection likewise resolves the intent; genuine uncertainty retains it. Server
replay remains under current resource/customer authorization after revocation.

## Database, performance and acceptance implications

Sales reads belong to Sales; Inventory candidate verification belongs to Inventory.
No cross-owner table writes or generic cross-module join endpoint. New read stores
can use parameterized set-based owner SQL without a framework or cache. Existing
PKs are installation/authority/UUID; customer-filtered keyset access may need new
indexes, but no DDL shape is preapproved. SQL JSON item filtering must remain
bounded/tested; avoid speculative GIN or materialized projection. UUID sort is
stable but not chronological and has no total. Explicitly measure sparse customer
scopes and assessed/unassessed multiplicity to avoid broad scans/N+1 behavior.

Future index decisions need per-candidate EXPLAIN/BUFFERS, rows read/returned,
representative concurrent writers and with/without-index comparison. P4a's five
Inventory indexes and accepted latency do not establish Sales performance or
complete migration-wide write cost. D7 requires workload evidence and Owner
threshold decisions before implementation acceptance; [readiness](P4B_DESIGN_REVIEW_AND_READINESS.md)
defines future verification. No runtime or benchmark PASS is claimed here.
