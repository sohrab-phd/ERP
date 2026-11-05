---
id: PLAN-P4A-READS-001
title: P4a Inventory read contracts and implementation-readiness design
phase: 12-implementation-planning
status: draft
version: 0.1.0
owners: [chief-solution-architect, inventory-domain-owner, security-architect]
depends_on: [APR-047, PLAN-P4A-SCOPE-001, PLAN-P4A-SOURCES-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-11-05
approval: null
---

# P4a Inventory discovery and canonical read design

**PROPOSED CONTRACTS — IMPLEMENTATION NOT AUTHORIZED.** The actual Owner directive
of2026-11-05 authorizes source inspection, this bounded design, validation and an
optional documentation commit only. [APR-047](../00-governance/approved-baselines/APR-047-p2-owner-acceptance-software-first-roadmap.md)
accepts P2; it does not authorize P4a. This document neither records a new approval
nor changes executable gates/unlocks. Verified facts, recommendations and required
human decisions are distinguished below and in the
[decision sheet](P4A_IMPLEMENTATION_AUTHORIZATION_DECISIONS.md).

## Goal, dependencies and stop conditions

Personal organizational Warehouse users need Persian RTL discovery → bounded
filters → paginated results → canonical Unit/Lot association → read-only refresh,
without first knowing UUIDs. Preserve Modular Monolith/Inventory read ownership,
ACT-IPS sole posting, exact kg, Ledger truth/Balance verification, no-negative stock,
accepted P1/P2 recovery, source lineage and current personal grants. Dependencies
are accepted Identity/IPS/receipt/reservation/shipping/MAKE/I2 and native P1/P2
browser transport. No new framework, dependency, master data or background projector.

The [source matrix](P4A_INVENTORY_SOURCE_AND_STATE_MATRIX.md) verifies three distinct
origins, five reachable current-stock states and two terminal states. Recommended
scope is all three origins and the five current states, **conditional on D1/D2**:
existing customer isolation does not grant organizational WH all-customer stock
visibility, and accepted general production can produce exact fractional kg.
Those are hard implementation-readiness blockers, not choices made by this design.
Do not round, omit fractional stock, fabricate customer access or silently ship an
AVAILABLE legacy-only list. Stop before implementation until the Owner resolves
them. D3 explicitly covers proposed indexes; D4 covers contracts/bounds/DoD.

Excluded: stock writes/adjustment/rebuild, reservation commands/promises, package/
dispatch/production execution, general history/export/analytics, raw Ledger/audit,
commercial/customer documents, new SALES/SEC/PROC/Customer browser authority,
provisioning/pilot/deployment, dependencies and P4b/P5 work.

## Existing contracts preserved

Legacy `GET /inventory/units/{uuid}` (GetInventoryUnit v1) and
`GET /inventory/lots/{uuid}` (GetLot v1) remain byte/meaning compatible with their
accepted organizational WH/SEC bearer contracts. They read material_lot, then
the locking IPS snapshot, whose current composition admits only organizational
AVAILABLE stock. They are not canonical all-origin reads. P2 receiving reads
remain source readback, not discovery. Sales `availability()` remains private,
customer/demand-scoped and supplied-UUID based. No legacy route is proxied into
the browser and no existing command is renamed or repurposed.

Evidence: [receipt transport](../../apps/backend/src/transport/receipt-http.ts),
[receipt owner](../../apps/backend/src/modules/inventory/receipt.ts),
[posting service](../../apps/backend/src/modules/inventory/posting-service.ts),
[composition](../../apps/backend/src/composition-root.ts),
[query catalogue](../05-application-api-architecture/QUERY_CATALOGUE.md).

## Proposed closed v1 transport contracts

All three routes are **browser-only POST reads**, using the existing `/ui-api`
prefix. POST keeps exact codes/cursors out of URL/history/access logs, matches
existing receiving-query convention and still has no command effects. No command
envelope, idempotency key, durable outcome, Inventory audit append or retry intent
is created. Native handlers call a new typed Inventory owner read port directly
after browser admission; do not internally forward to an arbitrary bearer route.

| Query/version and exact route | Exact input | Exact success envelope |
| --- | --- | --- |
| DiscoverInventoryUnits v1 — `POST /ui-api/inventory/v1/units/query` | `{filters?: Filters, limit?: integer, cursor?: string}` | `{data:{items:UnitSummary[],nextCursor:string|null,freshness:Freshness}}` |
| GetInventoryUnitDetail v1 — `POST /ui-api/inventory/v1/units/detail` | `{unitId:UUID}` | `{data:{unit:UnitDetail,freshness:Freshness}}` |
| ListInventoryLotUnits v1 — `POST /ui-api/inventory/v1/lots/units/query` | `{lotId:UUID,limit?:integer,cursor?:string}` | `{data:{lotId:UUID,items:UnitSummary[],nextCursor:string|null,freshness:Freshness}}` |

Refresh reissues the same authorized read with a NEW transaction. List refresh
keeps filters and resets cursor/page history to page1; detail refresh uses its ID;
Lot refresh resets that Lot to page1. No fourth refresh route, polling, stream,
browser cache validator or retained database snapshot. A row can become terminal
between list and detail: render fresh detail with its historical label and zero
stock. Never imply that viewing or refreshing allocates or guarantees stock.

### Validation and filter whitelist

Authenticated requests require exact JSON object shapes; reject duplicate names
at any depth, unknown members, arrays/null in place of objects, invalid Unicode,
trailing input and coercions. Maximum UTF-8 body8KiB, nesting4; at most3 root
members and8 Filters members. `Content-Type: application/json` with optional
`charset=utf-8`, no content encoding; preserve existing host framing/body read
timeouts. UUIDs use existing shared-kernel `validUuid`, canonical lowercase
representation, exactly36characters. Limit is a JSON integer1–50, default25;
limit must match the cursor's bound page size. No offset, sort, totals, arbitrary
operators, arrays/multi-select, range, wildcard, fuzzy or free-text search.

`Filters` contains any subset of these eight scalar keys, combined with AND:

| Key | Accepted value / exact predicate | Owner/limits |
| --- | --- | --- |
| unitId | UUID / Unit identity equality | Inventory scoped PK; optional advanced lookup |
| lotId | UUID / unit.lot_id equality | Inventory association, not a Lot-code lookup |
| materialId | UUID / origin material identity equality | Legacy/I2 only; production has none; no invented material master |
| internalCode | Nonblank,1–128 Unicode scalar values AND <=512UTF-8 bytes; exact C comparison | Legacy internal_code or I2 internal_system_code; legacy maximum128bytes remains its source limit. No trim/case/Persian-letter/digit/R1 normalization, no pattern expansion |
| kind | Exact nonempty stored kind, <=128UTF-8 bytes, no control characters | unit.kind; production is descriptive, receipt/I2 technical enums are not silently imposed on it |
| locationId | UUID / unit.location_id equality | No inferred site/station mapping or added location catalogue |
| state | One of AVAILABLE, RESERVED, PACKED, ISSUED_TO_PRODUCTION, PARTIALLY_CONSUMED | Omitted means all five current states; terminal/enum-only input400 |
| origin | LEGACY_RECEIPT, I2_RECEIVING or PRODUCTION | Exact Inventory-origin family, subject to Owner's D1 coverage |

For internalCode reject C0/C1 controls and invalid/whitespace-only input; preserve
otherwise exact characters including leading/trailing spaces. Render bidirectional
text in isolation; do not alter its stored semantics. Valid conflicting filters
produce an empty authorized set, never an existence diagnosis. No productCode,
productNumber or catalogue-label search in this initial contract; display those
fields where stored. No browser-supplied customer/installation/authority/role
grant/filter, database table name or SQL fragment. Lot route accepts no Filters;
it pages all seven supported states associated with that Lot, with stockClass
per row. No separate Lot aggregate/header/summed weight: one production batch
can contain several distinct Units and weights.

### Exact response whitelist

Every UnitSummary contains exactly:

```text
unitId: UUID
lotId: UUID
kind: string                         // exact <=128 UTF-8 bytes
locationId: UUID
state: supported UnitState           // five current states; also CONSUMED/SHIPPED on detail/Lot
stockClass: CURRENT | HISTORICAL
origin: LEGACY_RECEIPT | I2_RECEIVING | PRODUCTION
internalCode: string | null          // source bound <=512 UTF-8 bytes
productCode: string | null           // legacy <=128 UTF-8 bytes
productNumber: string | null         // I2 <=512 UTF-8 bytes
materialId: UUID | null
quantities: {onHandKg:ExactKg,reservedKg:ExactKg,unreservedKg:ExactKg}
```

UnitDetail contains exactly those fields plus `source`, a closed discriminated
object (family must equal origin), with exactly these per-family keys:

| family | Remaining exact source fields |
| --- | --- |
| LEGACY_RECEIPT | receiptId:UUID, initialKg:ExactKg, recordedCount:WholeString, weightBasis:`LEGACY_RECEIPT_MEASURED_TOTAL` |
| I2_RECEIVING | receivedUnitId:UUID, arrivalId:UUID, initialKg:ExactKg, materialTypeOptionId:UUID, classificationProfile:`FACTORY_MATERIAL_V1`, weightBasis:`WH_ACCEPTED_DECLARED_UNIT_WEIGHT` |
| PRODUCTION | productBatchId:UUID (=lotId), disposition:FINAL/WIP/RESIDUAL, initialKg:ExactKg, weightBasis:`PRODUCTION_POSTED_OUTPUT` |

The legacy/production weightBasis tags are proposed truthful display provenance,
not existing persisted enums or new measurements. disposition labels ORIGINAL
production classification, never current readiness; finalized WIP retains its
immutable WIP origin while current state can be AVAILABLE. Existing origin IDs
and weights are never fabricated from Ledger metadata.

`ExactKg` is a canonical nonnegative decimal STRING, magnitude<10^20, at most18
fractional places, max39ASCII characters; no exponent/sign/leading zeros except
zero, no trailing fractional zeros or decimal point. All integer quantities stay
integer strings (including values beyond Number.MAX_SAFE_INTEGER); no float or
rounding. `WholeString` is canonical nonnegative integer string up to20digits.
Source initialKg is positive. **This exact-decimal recommendation is blocked on
D2**; it is not a silent relaxation of the Owner's integer-kg instruction. All
three response quantity fields share the same precision. An integer-only design
cannot honestly cover all accepted general-production effects.

`Freshness` contains exactly:

```text
observedAt: UTC ISO8601 timestamp     // captured immediately after snapshot establishment
respondedAt: UTC ISO8601 timestamp    // after final current-authority check
consistency: PAGE_SNAPSHOT
quantityBasis: LEDGER_VERIFIED_BALANCE
```

observedAt reports the read observation, not the timestamp of the last movement
or a commit watermark; a transaction committing after snapshot establishment can
be absent even if its clock time precedes respondedAt. Timestamps are not cursor
ordering keys. No totalCount/hiddenCount/ledger revision/customer ID, raw database
snapshot or freshness claim extending to another page. JSON is UTF-8, no-store;
complete encoded envelope <=128KiB, measured before any response bytes are sent.
Overflow fails without truncated fields or partial rows.

### Authorization, non-disclosure and errors

Actor is a current individually authenticated organizational ACT-WH, not temporary
or shared, with authorityScopeId=installationId=trusted configuration and no
customer-bound browser grant. `x-erp-role: ACT-WH` selects a verified grant; it
never creates it. ACT-PROC/SEC/SALES/Customer/PLAN/OP without that current personal
organizational WH grant are denied. A person with multiple roles must explicitly
use WH. Existing PROC and P2 WH navigation/permissions remain intact.

**D1 proposed exception:** for only the exact stock whitelist above, allow WH to
see all three origins and supported current/terminal states inside that trusted
installation, including customer-owned outputs and Units allocated/reserved to a
customer. This would amend current stock-disclosure policy; it neither exposes
customer identity nor grants source-document/trace access. Do not implement it
unless explicitly approved. Existing-policy alternative requires a new bounded
Owner scope decision: only organizational AVAILABLE legacy/I2 with no active
reservation/production issue, no all-origin claim. In either case write source
facts/customer keys remain unchanged; never remove keys to simulate authority.

Apply the decided row authorization predicate in SQL BEFORE filters/page limit/
lookahead and all quantity/origin enrichment. Detail uses the same row predicate
and its supported-state set; Lot root existence is tested only among authorized
associated Units. Never fetch all customers then filter in the browser. No counts
or cursor anchors from denied rows. For an authorized role, nonexistent, foreign,
unsupported-origin/state or denied Unit/Lot give the SAME404 envelope. Do not
call a source owner to diagnose why a denied object was absent. An empty list
cannot distinguish no stock from no authorized stock.

Fresh personal session/account/grant validation occurs before the read and
again after committing/rolling back and **releasing** the RR snapshot connection,
immediately before disclosure. A snapshot's old role_grant view cannot validate
revocation. Reuse the existing receiving/genealogy composition pattern, including
the one-connection-pool release ordering. On a long/error path, final authority
failure wins over private detail/422/503 information. No locks held for final
Identity lookup. There is no claim to cancel bytes already sent before a later
revocation; the client independently hides data on detected expiry/change.

| HTTP | Exact JSON / condition | Disclosure behavior |
| --- | --- | --- |
| 200 | Success envelopes above; discovery may have empty items,nextCursor:null | No global/denied counts |
| 400 | `{error:"invalid"}` invalid JSON/filter/shape; `{error:"invalid-cursor"}` any structurally valid request with a malformed/tampered/foreign/expired/binding-mismatched cursor | Cursor variants intentionally indistinguishable; no root existence check to validate a cursor |
| 401 | `{error:"unauthenticated"}` missing/expired/revoked session | Clear private UI, prompt login |
| 403 | `{error:"forbidden"}` transport/CSRF/current role denied | Clear private UI; not an object existence signal |
| 404 | `{error:"not-found"}` absent/denied object or unknown route | Same object response regardless of existence |
| 405 | `{error:"method-not-allowed"}`, Allow: POST | Only these routes; no GET fallback |
| 413 | `{error:"too-large"}` input >8KiB | Reject before JSON parsing/query |
| 422 | `{error:"query-limit"}` response/ledger-work bound exceeded | No partial data/cursor or row-specific diagnostics |
| 503 | `{error:"unavailable"}` timeout/pool/technical failure, invalid quantities or Ledger/Balance/claim/origin inconsistency | No SQL, raw identifiers, malformed stock or writer/rebuild fallback |

Known transport admission can reject before query parsing. Unsupported fields
never generate a broader fallback query. Server logs retain only sanitized event,
request correlation, duration and bound category, not codes/cursors/body/row data.
No status or timing contract promises cryptographic timing equivalence; object
negatives follow the same bounded lookup path and no differentiated detail/count.

## Pagination, consistent reads and concrete resource plan

Order by PostgreSQL Unit UUID ascending, unique scoped unit_id as sole stable
ordering key; no mutable state/quantity/code/time ordering and no OFFSET.
Candidate SQL includes `unit_id > lastReturnedUnitId`, decided authority and exact
filters, `ORDER BY unit_id LIMIT limit+1`. At most51 authorized candidates are
materialized. Cursor anchors the last RETURNED row, not lookahead; lookahead
determines nextCursor only after authorized validation. UnitDetail uses one ID;
Lot adds authoritative lot_id equality and the seven-state set. There is no
cross-family UNION pagination with separate cursors that can lose ordering.

Cursor is a new purpose-separated HMAC-SHA256 token using existing node:crypto,
not a plain afterId accepted as authority. Format `base64url(payload).base64url(mac)`
with canonical encoding and constant-time MAC verification, total<=2048ASCII
characters. Closed payload: `{v:1,query,afterUnitId,filterDigest,limit,bindingDigest,
issuedAt,expiresAt}`. query is the exact named query; Lot ID is included in that
query's normalized filter digest. bindingDigest is a secret HMAC of browser origin,
installation/authority, account/person, exact role, current session-token digest
and an explicit disclosure-policy revision. Payload contains no raw session token,
secret, customer identity or undisclosed row. The visible afterUnitId was already
returned to this actor. A valid MAC authenticates paging position only, never
authorizes a row; query authority is always reapplied.

Bind normalized effective filters (defaults included, absent keys canonicalized),
endpoint/version and page size. issuedAt/expiresAt use server epoch seconds,
expiresAt=issuedAt+600. Every descendant page retains the ORIGINAL issue/expiry
times; reject issuedAt in future, now>=expiresAt, wrong lifetime, algorithm/version,
duplicate/unknown claims, noncanonical encodings or invalid claim types as400
invalid-cursor. Check length/allowed syntax before decode, signature before trusted
claim use, then bindings; never query an anchor to distinguish nonexistent/foreign
cursor. Logout/session replacement/key rotation makes old cursors unusable.
Changing filters, role or page size starts page1. Back uses in-memory earlier
request cursors and fetches anew; invalid/expired cursors offer restart page1.

Each request uses one short `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY`
transaction via [PostgresTransactions](../../apps/backend/src/infrastructure/postgresql/transaction.ts).
Establish snapshot and capture observedAt before candidates; all Unit/origin/
Ledger/Balance/claim/issue checks use the SAME connection and snapshot. Writer
bundles are atomic, so this sees a committed before-or-after bundle, never mixed
Balance from one commit and Ledger from another. No FOR UPDATE/SHARE/advisory lock,
per-row IPS.snapshot, writes/rebuild or long-lived cursor transaction. Ordinary
relation read locks can still contend with DDL; bounded lock_timeout applies.
No client-specific materialized list, cache, worker or new transactional writer.

Proposed Inventory owner adapter plan (not executable SQL):

1. Resolve decided row authorization and filter predicates and select <=51 Unit
   candidates with scoped left joins to the three Inventory origins and active
   claims/issues as needed. No Procurement/Production document table joins.
   Select by lifecycle/authorized source, not Balance.on_hand or the presence of
   a Balance row: missing/zero/corrupt projections must reach integrity checks,
   not silently disappear from current stock. Require exactly one recognized
   origin per candidate; check matching Unit/Lot/
   type/location identities where a source defines them. Source metadata describes
   original intake; current location remains Unit-owned.
2. Read scoped Ledger deltas for candidate IDs through inventory_ledger_unit,
   limit10001 rows total; if >10000, fail422 without aggregating an incomplete
   history. At most2 quantities per row, bounded exact numeric text. Parse with
   existing exact Kg rules and sum scaled BigInt values without applying the
   storage-capacity bound to intermediate sums in arbitrary Ledger UUID order;
   validate final magnitude/scale/nonnegative totals through Kg rules.
   This is bounded row retrieval, not an unbounded SUM disguised by output LIMIT.
3. Read candidate Balance/unique active claims and active production issues in a
   bounded batch, <=51each (production issue uniqueness enforced by its index).
   Compare Ledger=Balance, reserved=claim and the exact lifecycle table below;
   do not accept a simultaneous active claim/issue or a partially reserved PACKED
   Unit. Issue links must match scoped Unit identity, have a valid customer key
   and match Unit.customer_scope when it is nonempty. Issue.kg is the originally
   issued quantity, not current onHand after partial consumption; do not compare
   them for equality or use issue.kg as the displayed current stock.
   All integrity validation includes the lookahead row; mismatch fails the read,
   never removes a row after pagination or returns inconsistent quantities.
4. Project only allowed fields, compute unreservedKg exactly, serialize the entire
   result <=128KiB, close/release transaction, freshly reauthorize, stamp respondedAt
   and recheck final serialized size before send. No N+1 source calls.

Maximum4 Inventory data statements/request (snapshot timestamp and transaction/
Identity plumbing counted separately); no data-dependent number of statements.
The three-step read is sufficient when metadata and origin come with candidates;
a fourth bounded metadata batch is permitted, never an unbounded source fetch.
Use the same checks for detail/Lot. Source family, row eligibility and customer
policy enforcement belong to the Inventory owner, not direct cross-module SQL.
Raw Ledger is only an internal integrity input, never an HTTP response.

Exact state/quantity/active-link integrity requirements (all from the same page
snapshot; `onHand`, `reserved` below are verified Ledger totals):

| State | Quantity rule | ACTIVE reservation claim | ACTIVE production issue |
| --- | --- | --- | --- |
| AVAILABLE | onHand>0, reserved=0 | None | None |
| RESERVED | onHand>0,0<reserved<=onHand | Exactly one scoped claim, positive kg=reserved | None |
| PACKED | onHand>0,reserved=onHand | Exactly one scoped claim, kg=reserved; whole-Unit packing | None |
| ISSUED_TO_PRODUCTION / PARTIALLY_CONSUMED | onHand>0,reserved=0 | None | Exactly one scoped issue with compatible customer as above; original issue kg can exceed current remainder |
| CONSUMED / SHIPPED | onHand=0,reserved=0 | None | None |

These are read checks of accepted state/claim/whole-unit shipping/issue behavior,
not new transition rules or repair authority. Incompatibility yields sanitized503
for the whole response, including lookahead, without stock or source mutation.

Separate pages are separate snapshots. Existing Units cannot repeat within one
unchanged forward traversal because immutable UUIDs increase strictly. A new Unit
with an ID behind the cursor, or a Unit newly entering filters behind it, can be
omitted until refresh. A Unit leaving filters disappears; one entering ahead may
appear. Stock may change on a previously rendered row; Back/refresh can differ.
No stable totals or complete historical export, traversal cutoff or cross-page
snapshot guarantee. UI shows per-page observation and offers restart/refresh;
never silently deduplicate inconsistent pages into a claim of full coverage.

### Index evidence, bounds and unverified performance

Verified schema0005–0018 provides Unit PK `(installation,authority,unit)`, scoped
Unit/unit+lot uniqueness, Balance PK, inventory_ledger_unit, inventory_one_active_claim,
production_one_active_issue and unique origin lookups by Unit. Legacy/I2 have
Lot/material unique indexes; I2 physical-code claim is installation/code keyed,
but has private ownership and is not a public read projection. Legacy historical
code index in0018 is on Procurement goods_receipt, not material_lot. Production
origin has no scoped batch browse index; Unit has no `(scope,lot,unit)` or
state/kind/location browse index. A final LIMIT does NOT bound scanned rows,
filtered-out candidates, sorting or Ledger history. No EXPLAIN, representative
benchmark or lock probe was executed here: no disposable database was explicitly
verified/used by this task. Do not infer performance from the source fixtures.

Recommend D3 explicitly authorize one additive, index-only migration with:

| Proposed index target/key | Rationale / exact initial scope |
| --- | --- |
| inventory.unit `(installation_id,authority_scope,lot_id,unit_id)` | Production multi-Unit Lot keyset; common authoritative association |
| inventory.unit `(installation_id,authority_scope,state,unit_id)` | Five-current-state / single-state discovery; inspect sort/merge plan for default set |
| inventory.unit `(installation_id,authority_scope,kind,unit_id)` | Exact kind filter without a scope-wide metadata scan |
| inventory.unit `(installation_id,authority_scope,location_id,unit_id)` | Exact current-location filter |
| inventory.material_lot `(installation_id,authority_scope,(internal_code COLLATE "C"),unit_id)` | Legacy code matches; historical duplicates remain distinct Units |
| inventory.inbound_unit_origin `(installation_id,authority_scope,(internal_system_code COLLATE "C"),unit_id)` | I2 exact code-to-Unit lookup without reading private claim records |

These are concrete proposed additions, not installed/benchmarked requirements or
permission to add every combination. No new table, column, data backfill, enum,
constraint change, current migration edit or business writer. Owner may instead
authorize a narrower measured filter set; do not omit listed filters or add more
indexes silently. Review plan evidence before retaining each index in eventual
migration; any different key/set, needed combined-filter index or broader schema
change returns to explicit Owner scope. Scoped primary/unique indexes already
cover unitId/materialId lookups. Prefix index use, filter intersection and sort
cost need real plans for AND combinations and negative/selectivity cases.

Proposed bounds:16active read handlers/process, reject excess503 before pool work;
4s statement_timeout,1s lock_timeout,8s full handler deadline including acquisition,
body read/final Identity and serialization; release/cancel/discard on deadline.
An app-side deadline must bound pool acquisition too (transaction begin alone
currently waits on pool.connect). Browser timeout15s remains. At most51candidate
Units,10000Ledger rows,4Inventory statements and128KiB envelope. These are new
targets, not measured existing guarantees. Execution can still scan many invisible
or nonmatching index entries; statement/handler limits cap time, not theoretical
scan count. No truncation/partial-page success on any resource limit.

During separately authorized Windows PostgreSQL validation, use a declared synthetic
dataset with100000Units, all3origins, five current and two terminal states,
customer/installation distractors, skewed1–100Ledger rows/Unit and a10001-row hot
Unit. Capture EXPLAIN(ANALYZE,BUFFERS) on safe SELECTs, all supported exact filters,
filter combinations, late cursor and absent match cases. Include10concurrent
readers with2stock writers: warm p95 server end-to-end <=1000ms, p99<=2000ms over
>=200requests after warmup; no handler >8s, Inventory advisory/row locks or
writer waits attributable to these reads; no >10% writer p95 regression against
same-load baseline. Record hardware/data/version/pool/cold-cache observations.
These are proposed measurable acceptance thresholds pending D4, NOT benchmarks.
If volume assumptions or targets fail, report measured limits and obtain revised
bounds/index authority; never call timeout-only behavior usable performance.

## Native browser and minimum Persian workflow

[browser-session](../../apps/backend/src/transport/browser-session.ts) already
projects organizational WH/PROC grants; P4a adds only closed WH read-route and
navigation admission. It does not introduce a new role, shared account or SEC/
SALES browser login path. Preserve Host, Sec-Fetch-Site same-origin, unique
x-erp-browser, no Authorization header, exact Origin on POST, HttpOnly SameSite
Strict cookie (Secure/__Host on HTTPS), token-bound CSRF including protected reads,
no CORS, existing CSP/no-referrer/nosniff and no-store private responses.
New handler requires browserRequest admission; no synthetic context or cookie
use on legacy bearer routes. Method/body/header negatives retain the same guards.

Minimum UI is one Inventory list, one Unit detail and one Lot-associated Unit
list using the same summary presentation, inside the accepted native app shell.
No dashboard/counts, source-document inspector, new generic proxy or master editor.

| Screen/control | Exact user-visible fields/actions |
| --- | --- |
| WH navigation «موجودی انبار» | Visible/selectable only with current org WH; preserve «دریافت انبار»/P1 navigation and pending-intent recovery controls |
| List «موجودی فعلی» | Columns: «کد داخلی» (or «ثبت نشده»), «نوع ثبت‌شده», «وضعیت», «محل» (actual UUID unless exact configured receiving location label matches), «موجودی (کیلوگرم)», «رزروشده (کیلوگرم)», «رزرو نشده (کیلوگرم)», «منشأ»; row action «جزئیات واحد»; expandable IDs/product identifiers, never a manufactured code |
| Filters | Exact «کد داخلی», «نوع ثبت‌شده», «وضعیت», «منشأ», «محل» and advanced «شناسه واحد/لات/ماده»; buttons «جست‌وجو», «پاک‌کردن فیلترها». No UUID required to start: default list and exact recorded code search work; production without physical code stays identified by actual Unit/Batch UUID |
| Paging | «بعدی», «قبلی», page ordinal for this traversal only; no total pages/count. Size25default, optional10/25/50, reset traversal on change |
| Unit «جزئیات واحد» | All UnitDetail whitelist with exact source-specific labels, nullable-field «ثبت نشده/برای این منشأ موجود نیست», «شناسه لات»→Lot association, «بازگشت به فهرست», «تازه‌سازی». Source initial weight/count separate from current quantities; no customer/order/actor data |
| Lot «واحدهای مرتبط با لات» | lotId plus paged summaries including current/historical labels, detail/back/next/previous/refresh. No aggregate weight, implied one-Unit Lot or Production order navigation |
| Freshness | «زمان مشاهده این صفحه» plus localized observedAt and «تازه‌سازی»; «ممکن است موجودی پس از این زمان تغییر کرده باشد». Unreserved helper: «رزرو نشده به معنی مجوز فروش یا مصرف نیست» |

`lang=fa`, `dir=rtl`; use semantic forms/table or labelled row cards, real buttons
and links with accessible names, logical keyboard order and visible focus. Enter
submits filters; Tab/Shift-Tab operate all controls; no keyboard trap or clickable
unlabelled divs. Put focus on heading after page/detail navigation, first invalid
field after validation; Back restores source row/filter focus when it exists,
otherwise list heading. Use aria-live polite loading/result status and alert
for errors; aria-busy while loading, disable duplicate paging/refresh while its
request is active. State meaning uses text, never color alone. Product codes and
UUIDs are isolated (`bdi`/dir=ltr where appropriate), wrap long exact values without
truncating their accessible/copy value; render with textContent, never innerHTML.
Native clipboard action, if used, copies only the currently disclosed exact value.

Format quantities by string operations with Persian digits/grouping, retaining
ALL integer digits and authorized exact fractional digits without Number/Intl
numeric coercion, rounding, conversion, ratios or fabricated precision. Mixed
direction code inputs remain literal; client validation must not normalize them.
Do not add a universal material/location label using unrelated I1 catalogue names.

| Required UI state | Behavior / recovery |
| --- | --- |
| Initial/loading/page/refresh | Announce loading; remove interactive stale rows on filter/navigation, preserve only same-view prior data during refresh with explicit old observation/loading label; replace atomically on success |
| Empty / no authorized results | Same «مورد قابل مشاهده‌ای با این فیلترها پیدا نشد»; offer clear filters/refresh. No claim that hidden stock exists |
| Invalid filter | Local Persian field error and server400 mapping; retain typed filter, no automatic broad query |
| Invalid/expired cursor | «اعتبار صفحه پایان یافته است؛ جست‌وجو را از ابتدا اجرا کنید»; reset on explicit restart, no anonymous fallback |
| Missing/denied Unit/Lot | Same «این مورد در دسترس نیست»404, return to list; no origin/customer diagnosis |
| Transport503/timeout/422 | Dedicated read-only message «اطلاعات تازه دریافت نشد»; retain clearly labelled previous same-view observation if authorized, offer retry/restart.422 explains query bound and suggests narrower filter/contact support for a single hot Unit; never say a stock write is uncertain |
| Session expiry/revocation/403 | Existing lock+clear private data/filter/cursor/detail; login recovery. Do not keep private rows visible or resurrect them after re-login |
| Actor/role/session change | Clear all Inventory state/cursors/history, abort pending requests, restart discovery only under freshly admitted WH; preserve existing P1/P2 encrypted recovery ownership |
| Stale async response | Capture session epoch AND view/filter/detail/request generation; verify before/after JSON and each continuation/DOM update/focus. Abort alone is insufficient. Old list/page/detail/refresh cannot overwrite a newer view even for same actor |
| Reload | Existing secure session bootstrap, then a new read; no persisted Inventory rows/filters/cursors/tokens in local/session storage, service worker, URL or history state |

Existing [app API wrapper](../../apps/backend/src/operator/app.ts) checks session
epoch before/after JSON and clears on401/403; retain it and extend lock/clear to
Inventory plus same-actor view generations. Do not reuse command pending-intent/
same-key replay for reads. Inventory navigation must not erase uncertain P1/P2
write intents, unlock their navigation prematurely or overwrite terminal readback
in the accepted P2 navigation races.

## Verification and acceptance design

**Everything in this section is proposed future proof, not executed tests.** Use
frozen root scripts/Windows-only tools, actual isolated PostgreSQL and actual
Chromium with the composed native backend. No mock can prove SQL consistency,
lock behavior, customer isolation or browser transport. Reuse relevant fixture
patterns, not their synthetic bypasses as production authority.

| Layer / scenario | Required observable proof |
| --- | --- |
| Unit/API validation | Every allowed exact filter and AND combination, defaults, duplicate/unknown fields, Unicode/controls/exact spaces/case, unsupported state/origin, UUID/body/depth/page limits, methods and type/framing; precise400/413/405, never broader fallback |
| Unit projection/quantities | Exact recursive whitelist for all3source shapes, null semantics, recorded vs current kg, partial reservation free kg, whole values >2^53 and boundaries, proposed decimal70.5 only if D2 approved, no W2/W3/per-count allocation, no customer/actor/private binding. Original WIP with current AVAILABLE labelled correctly |
| Unit cursors | MAC, noncanonical encodings, unknown fields, all type/length bounds, endpoint/filter/size/Lot/principal/session/role/policy substitution, expired/foreign/future/tampered, original TTL across pages, key rotation; identical400 error/no anchor lookup |
| Component/UI | Persian labels/RTL/bidi/string formatting, keyboard/focus and aria states, nullable codes, no UUID needed for initial discovery, current/terminal status, source-specific detail, back/next/refresh/reload, all error/empty/loading states and no totals |
| Component races | Delay old list/page/detail/refresh before headers AND after JSON; navigate/filter/reset/role/actor switch then release old result. No old row/focus/error/cursor render. Repeat P2 canonical-result/navigation/recovery races unchanged |
| Real PostgreSQL origin/state | Create actual legacy and I2 ORDER_LINE/ORDER_ONLY/UNLINKED stock through owner commands; production FINAL/WIP/RESIDUAL/shared ProductBatch, intact WIP finalization, issued original remainder, partial/full reservation, packed, consumed/shipped. Assert all5current states across reachable families and2terminal detail/Lot states; enum-only and draft/unposted sources unavailable |
| Real PostgreSQL quantities/integrity | Independently sum Ledger deltas and compare Balance/claim/returned strings; >2^53 exact integer and permitted decimals. Isolated owner-role corruption probes for missing Balance, divergence, invalid/duplicate origin/claim/issue, simultaneous ACTIVE claim+issue, partially reserved PACKED and wrong issue customer cause sanitized503, no partial response/repair; valid partial consumption with issue.kg>onHand succeeds with current Ledger quantity. No reads mutate Unit/Ledger/Balance/origins/claims/outcomes |
| Real PostgreSQL authority | Personal org WH vs scoped WH, PROC/SEC/SALES/Customer/PLAN/OP, shared/temporary/fabricated context; installation A/B/customer A/B. Under D1 assert ONLY approved inventory fields and no source access; without D1 prove unavailable allocated/production rows, including empty customer_scope active claim/issue. Filter BEFORE page/count/lookahead/enrichment, identical negative Unit/Lot404; inject denied rows around page boundaries |
| Real PostgreSQL concurrency | Deterministic barriers during snapshot with separate command clients: reserve/pack/issue/consume/dispatch commit mid-read; page sees entire before-or-after bundle, no mixed totals. Insert UUID before/after anchor, leave/enter filters, change qty between pages: assert documented omissions/no forward duplicates and refreshed result, not cross-page snapshot |
| Real PostgreSQL expiry/resources | Revoke grant/session after snapshot, before disclosure, including one-connection pool; no stale authorization/deadlock. Pool exhaustion, DDL lock wait, statement/handler cancellation,10000/10001Ledger rows,51candidate limit, response128KiB,16/17concurrent requests, abandoned client cleanup; no partial result or retained connection |
| Real PostgreSQL performance/migration | Verified disposable PG18.6 restricted runtime vs DDL owner; measure dataset/filters/negative/late-page/load thresholds above, EXPLAIN plans, no Inventory writer locks. If D3 approved, old migration hashes unchanged, fresh/upgrade/retry paths, scoped index definitions/privileges, no source data alteration |
| Actual Chromium critical path | WH login → default all-approved-origin discovery → exact code/type/location/state filter → multiple pages → Unit → multi-Unit Lot → current/historical detail → refresh and reload. Check exact Persian quantity and focus; XSS strings render as text; authorized I2 source navigation only if retained existing action, no implicit extra enrichment |
| Actual Chromium security/failure | Denied roles, missing CSRF/foreign Origin/wrong Host/bearer/cookie misuse/method attacks; transport loss, expired cursor, session expiry/revocation, same-account new session and different-person replacement during delayed responses. No private cached/resurrected DOM/storage, no Inventory effects verified by before/after SQL |
| Regression | Relevant IPS/receipt/I2/reservation/shipping/production security/integrity and Identity suites; legacy keyed contract field/role/state compatibility; accepted P1/P2 unit/browser recovery/navigation/WF absent/null/value semantics and canonical receiving readback. Preserve historical257UNKNOWN residual; if it fails anew retain full TAP/stack/process/resource diagnostics and assess anew |

Definition of Done after separate implementation authority: D1–D4 explicitly
resolved in bounded scope, all approved source/state/field/read/browser behavior
delivered, measurable bounds/performance and no-Inventory-effects proven, relevant
root static/unit/real-PG/actual-browser checks pass without skipped required proof;
independent engineering, security, database and QA reviews close every blocker/
required improvement and high/critical defect; canonical behavior/limits/evidence
updated; final diff/working+staged whitespace reviewed; coherent local revision
submitted for Owner acceptance, no push/pilot inference. Unavailable evidence is
not PASS. Local evidence and hosted CI remain separately reported.

## Delivery stages and design-task evidence boundary

Recommend one bounded P4a increment with internal stages: (1) secure Inventory
read projection/contracts plus explicitly authorized indexes; (2) native WH
browser integration; (3) full Windows PostgreSQL/Chromium/performance/regression
proof; (4) independent engineering/security/database/QA review and fixes; (5)
exact-revision Owner acceptance. These organize one capability, not automatic
feature grants or a series of unnecessary governance documents. No stage begins
while D1/D2 or implementation authority is unresolved.

This task inspected repository sources/schema/indexes/tests and drafted Markdown.
No product code, API/UI, tests, schema/migration, dependency, runtime role/grant,
gate/unlock or factory environment was changed; no database connection/query-plan,
PostgreSQL/browser/product test or hosted CI run is credited. Documentation
validation/review and local commit outcome belong in the decision-sheet receipt.
