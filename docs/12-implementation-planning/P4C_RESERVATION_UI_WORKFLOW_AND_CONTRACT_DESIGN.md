---
id: PLAN-P4C-DESIGN-001
title: P4c Reservation UI workflow and contract design
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [delivery-lead, inventory-domain-owner, chief-solution-architect, security-architect]
depends_on: [PLAN-P4C-CAPABILITIES-001, APR-052, ADR-0018, TOOL-UIUX-001]
last_reviewed: 2026-11-08
approval: null
---

# Proposed Reservation workspace

**DESIGN ONLY — every new surface below needs explicit implementation authority.**
The [capability matrix](P4C_RESERVATION_EXISTING_CAPABILITIES_AND_GAP_MATRIX.md)
owns source evidence. [D1–D7](P4C_IMPLEMENTATION_AUTHORIZATION_DECISIONS.md) are
OPEN with Owner approval NULL. No command or business-policy change is proposed.

## Bounded goal, users and invariants

Enable personally authorized Sales staff to find a customer's reservations,
understand confirmed STOCK demand, review original selected stock and explicitly
request/activate a reservation without mistaking intent for allocation. Warehouse
staff retain their accepted handling/activation authority; this recommended UI
adds no Warehouse reservation browsing. Production users receive no new grants or
workflow; MAKE/IN_PRODUCTION orders are ineligible and no output is auto-reserved.

Dependencies: accepted Identity/envelope/IPS/Sales/Reservation/Shipment plus
P1/P2/P4a/P4b native browser/session patterns. Preserve exact kg, one ACTIVE per
Unit, immutable confirmed demand and intent, priority, owner-only writes, atomic
audit/outcome, same-key recovery and customer isolation. Exclude cancellation,
release/reassignment, splitting, TTL, priority override, shipment actions, MAKE
allocation, money, CRM, portal writes, bulk commands and audit administration.

## Navigation and Persian RTL interaction

Keep the existing `/operator` shell and customer selector. Proposed logical
views are Reservation list, order allocation context, new request review and
reservation detail. They are in-shell views, not new server-rendered pages or a
router dependency. Entry **رزروها** appears only under current customer Sales
authority. Existing Sales order detail may offer **مشاهده رزروها** with the same
customer/order IDs; context is reauthorized on entry. No foreign-role link fetch.

| View | Layout / essential fields | Primary action |
| --- | --- | --- |
| List **رزروها** | Selected customer; state and optional exact order filter; rows: reservation ID, order/item/Unit IDs, exact kg, Persian status, relevant server time; next/Back/refresh; no global totals | **مشاهده جزئیات** per row; **انتخاب سفارش** to enter existing order discovery |
| Order **رزرو برای سفارش** | Immutable customer/order/confirmed STOCK assessment; per line description/type, demanded kg, all-intent kg, remaining request capacity; original selected stock; warning **تأیید سفارش به معنی رزرو موجودی نیست** | **انتخاب واحد موجودی** for one eligible line |
| Stock / request | Read timestamp, exact Unit ID/type/available kg, availability caveat; selection and explicit kg review; no competitor data | **بازبینی درخواست** then **ثبت درخواست رزرو** |
| Detail | Immutable IDs/kg, REQUESTED/ACTIVE/CONSUMED label, requested/activated/consumed times if present, dispatch reference if present; related same-customer order/item; receipt or recovery status separately | REQUESTED: **بازبینی فعال‌سازی** then **فعال‌سازی رزرو**; otherwise refresh/read-only |

Desktop uses semantic tables/cards aligned with existing shell. RTL reading order
is customer/context → filters → rows → action/review. UUIDs, timestamps and exact
numeric strings use isolated LTR spans (`bdi`/direction isolation); Persian prose
remains RTL. Retain Tahoma/Segoe UI/system fonts, current green/neutral semantic
tokens and native HTML controls; no external fonts/icons/CDN/framework or redesign.

At 375px and 200%/400% zoom, rows become readable labelled groups with all essential
fields/semantics retained, wrapping long IDs, no body overflow or hover-only
disclosure. Keyboard navigation follows visual order; visible focus must not be
hidden by banners. Labels, fieldset/legend, table captions/headers, error summary
links and inline aria-describedby errors are required. Focus destination heading
on navigation and restore origin on Back. At least 44 CSS-pixel design hit areas,
measured 4.5:1 normal-text contrast and 3:1 meaningful controls; statuses use text
as well as color. Loading/result changes use a polite status; blocking errors
use alert without repeated focus theft. Respect reduced motion and text scaling.

Mandatory [UI skill](../../.agents/skills/ui-ux-pro-max/SKILL.md) read completely,
with quick-reference accessibility/interaction/forms/navigation/data guidance and
pro-rules scope notice. Read-only verifier passed 75 files/3,674,887 bytes at
reviewed `b7d5353e0130feb8c5574ef1251f8a1db1873ccb`. Offline generic searches matched
Minimalism & Swiss Style (`rtl_level=full`) and Focusable Error Summary. The initial
dashboard generation used general fallback reasoning; one narrower inventory/stock
management retry matched the Inventory & Stock Management product/reasoning and
Flat Design. Both suggested showcase/marketing sections or external typography;
those do not fit the ERP and are rejected. Existing shell controls this design.
No assets persisted and no dependency/catalog refresh. Actual P4c browser verification remains future
implementation evidence, not a claim of this document review.

## Command sequence and partial availability

1. Select an authorized customer, discover an order with existing P4b reads, then
   load Reservation order-context. Only exact CONFIRMED + RECORDED STOCK is
   requestable; MAKE, DRAFT, SUBMITTED and IN_PRODUCTION show no create action.
2. Select one line and one original selected Unit. Show remaining *request
   capacity*, not unfulfilled/shippable demand: demandedKg minus every persisted
   REQUESTED/ACTIVE/CONSUMED intent. UI cannot sum only the currently loaded page.
3. Recommended D4 A offers the whole observed Unit only if its exact available kg
   is positive whole kg, within remaining request capacity and <10^20. No decimal
   rounding, flooring or Number conversion. A Unit larger than capacity, fractional
   Unit kg, or free kg <1 has no eligible whole-Unit action; explain the limit and
   allow another originally selected Unit. No generic replacement-stock picker.
4. Show review with full customer/order/item/Unit IDs, whole exact kg, immutable
   request warning and **درخواست، موجودی را تخصیص نمی‌دهد**. Request is one command,
   new UUID target/new key once. It may still succeed after observed stock changes:
   backend request does not guard current availability. Do not advertise guaranteed
   activation or silently add a new command precondition.
5. After definitive request receipt, show REQUESTED **درخواست‌شده؛ تخصیص نیافته**.
   Activation is a separate explicit review/command, never automatic. Show current
   request kg and generic advisory stock observation. Backend activation alone
   decides current availability/priority and commits ACTIVE **فعال؛ تخصیص‌یافته**.
6. Guard conflict/state/insufficient availability: refresh authorized evidence;
   display **فعال‌سازی انجام نشد؛ درخواست ذخیره‌شده باقی است** for a definitive
   rejected activation of a REQUESTED row. No competing order/customer, queue rank
   or promised wait time. Existing intent may be permanently blocked. There is no
   cancel, edit, transfer, top-up or repair button. Escalation means existing
   operational support, not a promise that support has an implemented repair API.
7. Each Unit requires its own request and activation receipt. Show completed and
   remaining work separately; a later failure does not roll back earlier success.
   No multi-Unit batch atomicity, background queue or automatic chained submit.

D4 B would additionally allow explicit smaller whole-kg input after separate Owner
selection, within observed availability/capacity for UI guidance only. Review must
warn **رزرو بخشی از وزن، کل واحد را از رزرو دیگر خارج می‌کند؛ ارسال فعلی فقط برای
کل واحد پشتیبانی می‌شود**. Require explicit acknowledgement before creating this
immutable partial intent. Existing partial REQUESTED/ACTIVE rows always remain
visible even under D4 A; their ordinary supported activation remains available
with this warning, never hidden as corrupt or silently increased to full kg.

Stock unavailable/empty means no eligible observed original selection, not no
factory stock. No eligible whole Unit means blocked request entry under D4 A,
not permission to change assessment/confirmed order or release existing claims.
Historical allocation observations and proposed selections are never committed
allocation. Partial reservation is independent of `allowPartialShipment`.

## Existing commands reused unchanged

| Command v1 | Target / payload / preconditions | Authority / result |
| --- | --- | --- |
| RequestReservation | `reservation:newUUID`; `{orderId,itemId,unitId,kg}`; `{}` | Current personal Sales exact customer; durable REQUESTED receipt or guard rejection |
| ActivateReservation | `reservation:existingUUID`; `{}`; `{}` | Recommended browser: same current Sales customer; durable ACTIVE receipt or rejection. Existing bearer WH action unchanged |

Preserve accepted [envelope](../05-application-api-architecture/API_ENVELOPE.md)
and [idempotency](COMMAND_IDEMPOTENCY_SPEC.md), full-material binding, post-lock
authorization, atomic savepoint rollback and durable accepted/rejected replay.
Same-key replay does not reevaluate a recorded rejection. After a definitive
activation rejection, a later explicit reevaluation can use a new key with the
same existing target and empty payload; it cannot change the request binding.
New-key equivalent Request is DUP, altered binding CONFLICT; neither is a repair.

## Proposed exact browser routes and read contracts

Exactly five proposed POST routes under `/reservations/v1/`, cookie-only closed
allowlist. New reads are permissions/disclosures for Owner D2, even when backed
by an existing table. Do not broaden the seven P4b routes or ordinary bearer APIs.
All five require one exact selected-customer header; no caller role, person,
installation, authority, customer payload or wildcard. Reuse P4b customer roster
and Sales detail unchanged. No new customer-list endpoint or grant table.

| Route / owner | Strict JSON input | Explicit response data |
| --- | --- | --- |
| `/query` / Inventory | `{filters?:{orderId?,state?},limit?,cursor?}` | `{items:[{reservationId,orderId,itemId,unitId,kg,state,requestedAt,activatedAt?,consumedAt?}],nextCursor?,observedAt,respondedAt}`; state REQUESTED/ACTIVE/CONSUMED; selected customer implicit |
| `/detail` / Inventory | `{reservationId}` | `{data:{reservationId,customerId,orderId,itemId,unitId,kg,state,confirmedAt,requestedAt,activatedAt?,consumedAt?,dispatchId?},observedAt,respondedAt}`; absent times/refs omitted, never fabricated |
| `/order-context` / Sales + Inventory owner ports | `{orderId}` | `{data:{orderId,customerId,confirmedAssessmentId,confirmedAt,items:[{itemId,type,description,demandedKg,allowPartialShipment,selectedUnitIds,requestedTotalKg,remainingRequestKg}]},observedAt,respondedAt}`; only matching CONFIRMED STOCK; totals use all intents in same snapshot |
| `/stock/query` / Inventory, admitted order/item | `{orderId,itemId}` | `{items:[{unitId,kind,internalCode:null,availability:"AVAILABLE",availableKg}|{unitId,internalCode:null,availability:"UNAVAILABLE"}],observedAt,respondedAt}`; bounded original selected IDs only, unavailable has no quantity/kind/reason enrichment |
| `/commands` / fixed adapter | Exact existing v1 envelope above | Existing execution status, accepted/rejected receipt and stable guard families; no additional command or payload |

UUID fields use existing canonical UUID validation. `limit` is 10/25/50, default25;
state is exact enum. Unknown/duplicate JSON keys, duplicate selectors, body on
unsupported route/method, encodings and unbounded fields reject. No fuzzy/code
search, free-text reason or export. Detail uses explicit whitelist, never raw
object spread. No binding/orderBinding, grant/principal keys, stock owner/customer,
Lot/source/location, competing demand, generic audit/result or internal code leaks.
Unavailable rows are derived from already authorized confirmed selected IDs;
missing, foreign, nonavailable, issued or claimed stock are indistinguishable.
Available means verified observed stock evidence, not priority or activation
guarantee. Active claim ownership is not disclosed by a failed candidate lookup.

### Trust, snapshots and bounded resource use

- Identity issues a trusted session principal and exact customer context using
  the accepted personal/session mechanism. Each new read requires an explicit
  Reservation-specific admission. Sales owner gets a narrow confirmed-demand
  read port for this operation; current canReserve command allowlists do not
  already admit these new read names. Do not impersonate GetReservation or
  activate/request context to bypass policy, and do not reuse command locking
  availability as a browse API.
- Scope installation/authority/customer and parent order/item before filters,
  pagination, aggregates and enrichment. New Inventory owner read ports consume
  confirmed selected IDs from Sales in the caller's one read-only consistent
  snapshot (REPEATABLE READ), no command locks or writes. For stock-availability
  projections verify Ledger/Balance, claims and production issue/source evidence
  through existing owner verification; reservation history reads use their owning
  lifecycle facts without reconstructing present stock for each historical row;
  inconsistent or over-cap evidence fails the complete read with 503. Unavailable
  selected rows stay minimal; no partially verified page.
- Reads reauthorize current session/person/exact customer after snapshot closure,
  before sending private payload or private error. Roster remains P4b with its
  existing every-returned/lookahead-customer fresh checks. New list/detail reads
  never turn absent/foreign reservation/order into an existence oracle: generic
  404 for resource absence/foreign scope, current session/grant failures 401/403.
  Existing bearer error behavior is unchanged.
- `/query` orders by reservation UUID ascending with SQL customer scope first;
  signed cursor binds version, route, installation/authority, person/account,
  current session, selected customer, normalized filters, limit, last ID and
  issued time. Max2048 cursor bytes, fixed five-minute lifetime, no refresh of
  expiry across pages. No totals/lookahead disclosure or cross-customer reuse.
  This is technical traversal order, not priority/time order. Different pages
  are different snapshots; refresh starts page one. Invalid/expired cursors
  produce `invalid-cursor`, preserve filters and offer restart.
- Selected Units total ≤16 from accepted STOCK evidence; order ≤8 items. Return
  all that item's original selected IDs, without stock pagination or broad scans.
  Per-line all-intent totals use SQL exact numeric text, never page sums. Negative
  or incompatible totals fail closed rather than being clamped into availability.
  Inventory decimal strings remain exact; browser sums/comparisons use accepted
  string/scaled-integer methods. No JS Number for kg or timestamps for priority.
- Proposed caps mirror accepted adapter bounds: reads ≤8KiB/depth4, command
  envelope ≤4KiB, ≤16 active handler requests, read DB statement timeout4s and
  overall deadline7.8s, command deadline30s. Candidate Ledger evidence capped at
  10,000 rows and all additional enrichment bounded to the ≤16 selection. These
  are engineering proposals for D7 verification, not measured P4c performance.
  Cancellation must stop underlying SQL/release the read client; no fake timeout
  via response-only race. Capped resource/quantity reconstruction fails 503.

### Browser/session and transaction uncertainty

Preserve exact/unique Host, same-origin Origin/fetch metadata, CSRF, JSON framing,
cookie-only admission, CSP/no-store/no-referrer/frame denial, secure cookie policy,
text-only rendering, and bearer rejection. No cookie-to-arbitrary-bearer proxy.

Every async success/error/finalizer captures installation/authority/account/person,
role/customer, cookie/CSRF session epoch and request generation. Drop mismatches
before touching data, lock state or idle timer. Abort is insufficient. Customer,
role, logout, expiry or account replacement synchronously clears private
rows/forms/selections/errors, advances generation and cancels reads. Current
denial locks immediately; old denial must not lock a newer workspace. Existing
focus/visibility/pageshow/broadcast/expiry behavior extends to Reservation.
Dirty local forms offer continue/discard on ordinary navigation; revocation clears
private content immediately. Read-only navigation may continue while preserving
unknown command recovery and the write interlock.

Use proposed separate `navard-p4c-reservation-pending-v1` namespace/AES-GCM AAD;
never migrate/overwrite existing PROC/WH or Sales ciphertext. Persist encrypted
intent **before dispatch**, binding installation/authority/account/person,
ACT-SALES/customer, exact `/reservations/v1/commands`, original serialized body,
command/target/key. Encryption-only key stays in memory, no token/plaintext storage
or logging. If seal/write/readback or storage inspection fails, do not send.

Extend every tab-wide pending check and recovery load to PROC/WH, Sales **and**
Reservation. Any unresolved or unreadable record blocks all new writes in every
workspace/role; multiple records fail closed. No automatic cross-role/customer
replay or second writer. Recover only after fresh exact-context authorization,
with identical original key/target/body. 401/403, 503, timeout, disconnect or lost
COMMIT are not proof of nonexecution: retain ciphertext, hide unauthorized
details and lock new writes. Same actor/grant restoration may recover it.

Definitive accepted/rejected response resolves only the matching current intent
before supplementary readback. Readback failure means **نتیجه ثبت شد؛ دریافت
جزئیات ناموفق بود** and read retry; never resubmit the write or claim allocation
failed. A replayed accepted activation receipt proves that operation at its time,
not that the reservation is still ACTIVE; read current state separately (it may
already be CONSUMED). `GUARD_IDEMPOTENT_DUP`/state/conflict require canonical read,
not invented success. An explicit informed close of recovery only discards local
tracking, does not cancel or reverse the server operation; no automatic close on
navigation/session change. Require acknowledgement of this uncertainty.

## Persistence, architecture and performance alternatives

Extend existing native modules/adapters, with Inventory-owned projections and
Sales-owned confirmed demand read port, composed in one backend. No direct
cross-module table writes, generic query proxy, new service/cache/ORM or dependency.
Existing lifecycle timestamps plus user's command receipt provide bounded audit
visibility. General actor-history/reason/audit query needs separate policy and is
deferred; a server lifecycle time never implies who performed it.

Existing 0008 demand index supports order/item sums. Customer-wide list and
historical sums need measured SQL plans at representative and skewed cardinality.
No schema change is presumed. Alternatives: UUID-only access is simpler but fails
discovery; customer-scoped keyset reads (recommended) fit current work; a maintained
projection/cache adds consistency/writer cost without evidence and is deferred.
No migration/index may be applied/committed without separate Owner evidence and
approval. Do not change accepted migration bytes or add a request-state business
change to solve a UI gap.

Future D7 evaluation must define Reservation user/journey/write rates and retained
history with Owner input; ~20 total internal users is existing Owner context,
not proof of 20 concurrent Reservation operators. Proposed initial P4c absolute
budgets: server read p95≤2s/p99≤4s, end-to-end journey p95≤3s/p99≤6s, each existing
command server p95≤2s/p99≤4s and zero correctness errors/lock-attributable read
waits. These remain OPEN proposals; measure actual plans/caps and concurrent
request/activate/dispatch/Sales/receiving writers. No new percentage writer rule
or inherited P4b waiver. Compare same-schema writers with/without these reads;
Owner must approve numeric budgets/workload before implementation acceptance.
P4a's migration-wide pre-0019 deployment gate stays OPEN; P4b APR-051/052 D7
exception stays exactly recorded, UNKNOWN cause and no relative-only rerun.
