---
id: PLAN-I1-ACCEPTANCE-001
title: Proposed I1 detailed acceptance cases and complete requirements scope trace
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [qa-architect, delivery-lead]
depends_on: [APR-034, PLAN-I1-DOMAIN-001, PLAN-I1-API-001, PLAN-I1-DATABASE-001, PLAN-I1-SECURITY-001, DOM-INBOUND-TRACE-001, DOM-INBOUND-POLICY-001]
last_reviewed: 2026-10-20
approval: null
supersedes: null
---

# I1 acceptance design — DRAFT / PROPOSED / NO TESTS IMPLEMENTED OR EXECUTED

This is a future test specification, not test code or passing evidence. A01–A28
are local acceptance-case labels, not a new global TEST catalogue or factory UAT.
All scenarios are synthetic test intent, not real factory records. The [domain](I1_PURCHASE_ORDER_DOMAIN_DESIGN.md),
[API](I1_PURCHASE_ORDER_API_DESIGN.md), [DB/transactions](I1_PURCHASE_ORDER_DATABASE_DESIGN.md)
and [security](I1_PURCHASE_ORDER_SECURITY_DESIGN.md) define expected proposed behavior.
Owner must accept the design/limits and explicitly authorize implementation first.

## Actual evidence reused as test-design sources

Inspected definitions, not rerun results:

- [unit purchasing](../../apps/backend/tests/unit/purchase.test.ts): closed text/date
  parser, same/different UUID bindings, personal current ACT-PROC, revocation on
  document wait and caller mutation. Do not copy Gregorian-date assertions as Jalali validation.
- [purchasing integration](../../apps/backend/tests/integration/purchase.test.ts)
  and [HTTP](../../apps/backend/tests/integration/purchase-http.test.ts): scoped
  immutable facts/attribution, intentionally repeated documentary references,
  replay/rollback/audit/uncertain commit and WH/SEC/customer read denials.
- [receipt integration](../../apps/backend/tests/integration/receipt.test.ts)
  and [HTTP](../../apps/backend/tests/integration/receipt-http.test.ts): no-PO/no-ticket
  intake, descriptive count, repeated historical Internal Codes, Sheet rules,
  personal waits and default recovery fence. All remain independent behavior.
- [transaction integration](../../apps/backend/tests/integration/transaction.test.ts),
  [envelope replay/audit integration](../../apps/backend/tests/integration/replay-audit.test.ts),
  [crash/retry](../../apps/backend/tests/integration/crash-retry.test.ts),
  [Identity](../../apps/backend/tests/integration/identity.test.ts),
  [inventory](../../apps/backend/tests/integration/inventory.test.ts): real transaction,
  recovery, scoped access, locking and exact stock foundations.

Future tests use the current Node runner, frozen root scripts and Windows-only
isolated real PostgreSQL 18.6, restricted runtime role distinct from migration owner,
verified disposable test identity and current personal Identity contexts. No mocks
for constraints, savepoints, SQL races, audit or COMMIT being proved. Unit tests
may isolate pure parsing/calendar logic. No dependencies, test files or DDL created now.

## Detailed future acceptance cases

U = unit/domain parser; PG = real PostgreSQL; API = transport; SEC = authorization;
REC = durable outcome/crash/unknown-COMMIT; REG = existing behavior; DOC = source/trace.
Required assertions name exact families and surviving facts, not merely “throws”.

| Case | Scenario / setup | Observable future assertions | Layers |
| --- | --- | --- | --- |
| A01 | PROC registers pre-arrival full order, then minimal order with every optional omitted; use separately committed valid options | Header+all lines+one accepted outcome+original audit; lookup exact original twelve-field values; 7 mandatory/5 optional mappings; no received/progress/stock fields | U,PG,API |
| A02 | Different target/key attempts same factory reference, including another PROC person and otherwise identical facts | One immutable original; new unused UUID gets durable GUARD_CONFLICT, no overwrite/merge/history link; same strings in completed evidence remain valid independently | PG,API,REG |
| A03 | Two distinct authenticated PROC accounts concurrently register the same reference with different keys/targets at the real owner-lock barrier | Exactly one accepted PO and complete lines; loser exact GUARD_CONFLICT; both correct outcomes/audits; no scope split by supplier/role/person; unique constraint still protects when precheck path is bypassed in controlled test | PG,REC |
| A04 | Several lines, two identical specs, duplicate or missing optional itemNumber | Original array order, distinct stable line UUIDs and ordinals, no coalescing, no invented item-number uniqueness; repeated reads/replay preserve IDs | U,PG,API |
| A05 | Parameterize each missing required member, every optional omitted/provided null/blank, wrong type, wrong-kind/missing/foreign option, unknown nested property | Admitted scalar/requiredness failures GUARD_INVARIANT; invalid catalogue selection GUARD_STATE without foreign existence leakage; unknown names or structural-shape mismatch (e.g. lines not array, object for scalar) fail admission without consuming a key; no partial sources; exact Persian names/actors traceable | U,PG,API,SEC |
| A06 | Exact width/length m and thickness mm, `1.200`, tiny supported fractions, 20 integer digits, 18 fraction digits and just-outside bounds | Exact lexeme roundtrip; positive proposed limits; reject zero/negative/exponent/grouped/numeric-JSON/19th fractional digit without conversion or rounding; DB direct invalid inserts also fail | U,PG,API |
| A07 | W1 `2000`, ordered count `5`, values beyond JS safe integer and PostgreSQL bigint, and invalid fractional/zero/exponent W1/count | Per-unit W1 stays `2000`; derived arithmetic if tested is BigInt `10000`, not stock; exact 20-digit valid values survive; no count multiplication in stored W1; rejected bounds leave no source | U,PG |
| A08 | Jalali ordinary/month-end/Esfand cases, 1395-12-30 valid versus 1394-12-30 invalid, official 1403-12-30 valid and 1404-12-30 invalid; invalid months/day zero/overflow | Profile-driven validity; no Gregorian Date parser, server-today default or timezone shift; canonical Jalali string roundtrip and separate DB creation time | U,PG,API |
| A09 | Independently reviewed official year-marker receipt for the proposed full 1206–1498 profile, lower/upper bounds and unsupported years | Verify all 293 leap flags and month boundaries; application and DB predicates agree; source receipt/hash/profile frozen before implementation acceptance; reject outside range, no assumed universal algorithm horizon | U,PG,DOC |
| A10 | EACH catalogue kind × EACH current role adds and selects a missing legitimate value, including initially empty selection list | Six role/kind combinations work, no admin/other-person gate; trusted creator/role/time recorded; no PO/receipt/stock writes | PG,API,SEC |
| A11 | PROC creates then WH selects, WH creates then PROC selects; immediately use created IDs in an allowed order | Reusable within scope, exact labels returned; optional color/grade absence valid and RAL independent; no creation approval or free-text bypass | PG,API,SEC |
| A12 | Distinct people add same exact kind/label concurrently under different UUIDs/keys; repeat across different kinds/installations | One canonical same-scope option, loser durable GUARD_IDEMPOTENT_DUP; exact authorized query returns winner ID for use; other kind/scope independent; no accepted-reuse fiction or creator overwrite | PG,REC,SEC |
| A13 | Case, outer-space, Unicode-composed/decomposed, Arabic/Persian letter and ZWNJ variants; quotes/backslashes/script-looking text | Exact equality rule only; distinct accepted terms not silently merged; safe JSON output and parameterized queries, no code execution/log echo; invalid Unicode/Cc/byte overflow rejects | U,PG,API,SEC |
| A14 | Persist an order then attempt catalogue/header/line UPDATE/DELETE/TRUNCATE and later line append; inspect typed option refs | Restricted role denies mutation, original labels/snapshots stable; append blocked by position/count/FK guards; identical business lines allowed; no invented catalogue lifecycle | PG,SEC |
| A15 | Add arbitrary legitimate new business Material Type and register stock-free order with it | Existing fixed technical enum unchanged, no OTHER default/mapping column/stock eligibility; no Inventory/Production admission bypass; mapping remains I2 prerequisite | PG,API,REG |
| A16 | WH looks up exact seller reference and permitted ID, including repeated lines and special reference characters | Complete original projection and stable IDs/positions, correct m/mm/m/Jalali semantics; no binding/key/creator/documentary/stock fields, no global order listing; scoped missing and foreign result alike | PG,API,SEC |
| A17 | WH tries register, append/edit/update/cancel via I1 routes or injects PO mutation into catalogue add | DENY by role/admission/404/405 as specified; original PO unchanged. Existing WH manual receipt remains governed separately, not globally revoked by this test | API,SEC,REG |
| A18 | Customers, SEC-only, unrelated roles, customer-bound PROC/WH, foreign factory IDs and injected scope/actor fields | Forbidden before existence; no catalogue modification/read escalation; same safe not-found for permitted scoped foreign/absent IDs; no private values/SQL in errors/logs | PG,API,SEC |
| A19 | Forged/copied context; revoked role/session before admission, during key wait, before query disclosure; current-check expiry after business wait | Issued current personal capability required; no stale outcome/source disclosure. Use correct linearization: committed earlier revocation denies; held Identity locks may serialize later revocation after the operation | PG,API,SEC,REC |
| A20 | Accepted and rejected same-key replay; changed admitted scalar/array order/optional presence/valid target/principal; same person switches role for catalogue replay | Same original result/execution ID with new attempt ID; changed intent that passes admission/current policy conflicts. Unregistered v2 or unauthorized input denies before lookup, not a409binding conflict; version-binding conflict needs a controlled authorized registered alternate-version fixture. Role/request ID not binding; catalogue cross-role same-person replay allowed, WH cannot replay PROC-only registration; original attribution stable | PG,API,SEC,REC |
| A21 | Lost server-confirmed COMMIT response, connection failure around COMMIT and Windows process crash at controlled points for both commands | Original-key primary recovery resolves one complete original outcome or safe retry; no fresh key/ID/lookup substitution; no duplicate option/order/line or original decision audit/outcome. Subsequent replay/conflict attempt audits remain required by the existing envelope; recovery fence respected | PG,API,REC |
| A22 | Inject business rejection after header, after Nth line, after catalogue reference checks | All tentative order/line writes roll back; exactly original durable rejection+audit if envelope accepts that rejection; previously accepted separately created option remains reusable | PG,REC |
| A23 | Technical insert/outcome/audit failure, direct malformed aggregate triggering deferred completeness at COMMIT | Whole technical bundle absent, no partial order/lines or false cached rejection. Deferred COMMIT error follows current technical/possibly uncertain adapter semantics and same-key recovery, never handler-time 23505 business mapping | PG,REC |
| A24 | Opposing owner-resource order inputs, same hash-key collision fixture, session expiry/waits, timeout/deadlock, exact known UNIQUE mapping and unknown constraint | Actual sorted hash acquisition avoids owner inversion; collisions only serialize; fresh scoped postwait reads; only mapped surviving-fact 23505 becomes specified DUP/CONFLICT; unknown errors remain technical; no nested public command or pooled snapshot | PG,REC,SEC |
| A25 | Snapshot authoritative foreign tables before/after successful and rejected I1 commands; run relevant accepted capability suites | No Inventory Unit/Lot/Ledger/Balance, Goods Receipt confirmation, reservation, Sales, Production, Shipping, Finance/invoice/payment source effects. Existing documentary, manual intake, stock, genealogy and Identity/recovery behavior preserved | PG,REG |
| A26 | 4096-byte versus larger multi-line order, 262144-byte boundary, length mismatch/slow/encoded/duplicate-key bodies, escaping and full response limit | New reader admits bounded large orders without changing old limits; invalid/bounds fail safely, no key consumed on unbindable input; valid semantic overlimit rejects before source insert; complete reads never truncate; 1–128 lines and 1–100-option pages enforced | API,PG,SEC |
| A27 | Fresh migration/replay, existing checksum preservation, restricted runtime vs owner, invalid numeric/Jalali/scope/kind/direct FK rows | Additive tables/indexes/guard only; exact constraints and no unwanted grants; old sources/records untouched; valid and invalid inputs exercise real PG, not mocked constraints | PG,REG |
| A28 | Catalogue add succeeds then registration fails; catalogue add is uncertain; exact duplicate rejection then selection | Durable option survives failed order, zero order/lines; uncertain add resolved with original key before dependent work; completed DUP followed by exact scoped read uses existing option without retrying a rejected key | PG,API,REC |

No arbitrary test-count target: cases are often parameterized, and implementation
may split them into meaningful tests. Timing/race proof uses deterministic barriers
at actual key/business locks and separate verified accounts; no sleep-based race
claims. Worker/crash children are bounded and cleaned up under Windows. Restore
only verified disposable DB fixtures; never reset production or run as DDL owner
for normal behavioral assertions.

## All original workflow requirements — scope trace (25)

FULL I1 means planned business outcome in this scope, PART means an I1 prerequisite/
guard or subset only, I2 means not delivered by I1, GOV means exclusion/source
discipline. These are **future coverage classifications**, not implementation status.

| Requirement | I1/I2 scope and concrete obligation | Proposed cases |
| --- | --- | --- |
| REQ-INBOUND-001 | FULL I1 operational pre-arrival registration/date | A01,A08,A09 |
| REQ-INBOUND-002 | FULL I1 ordered distinct lines/specs/count/W1 | A01,A04–A07,A10,A11 |
| REQ-INBOUND-003 | FULL I1 zero stock effect | A07,A25 |
| REQ-INBOUND-004 | I2 arrivals/waybills; I1 reference schema must permit future many-arrival links | A02; design compatibility only |
| REQ-INBOUND-005 | PART I1 number lookup/original lines; actual arrival/physical verification I2 | A16,A18 |
| REQ-INBOUND-006 | I2 physical-unit confirmation/remainder | A25 exclusion only |
| REQ-INBOUND-007 | I2 prior/current/cumulative/outstanding progress | A25 exclusion only |
| REQ-INBOUND-008 | PART immutable ordered snapshot prerequisite; actual acceptance/verification I2 | A04,A14,A17 |
| REQ-INBOUND-009 | PART original evidence preservation; actual discrepancy source/indicator I2 | A14,A17 |
| REQ-INBOUND-010 | I2 distinction of partial progress/mismatch | No I1 receiving or mismatch claim |
| REQ-INBOUND-011 | I2 physical Internal System Code; line UUID is not that code | A25 exclusion only |
| REQ-INBOUND-012 | PART stable order/line owner references only; physical-unit/arrival/receipt lineage I2 | A04,A14; design compatibility |
| REQ-INBOUND-013 | I2 existing warehouse receipt reference | A05/A25 reject I1 invented receipt fields |
| REQ-INBOUND-014 | PART envelope/owner atomicity reused; multi-unit stock confirmation I2 | A20–A24,A28 |
| REQ-INBOUND-015 | I2 committed receiving/progress/discrepancy view | No such fields returned in A16 |
| REQ-INBOUND-016 | PART original orders never labelled received; full receiving view I2 | A01,A16,A25 |
| REQ-INBOUND-017 | PART exact 12 I1 fields, original23 mapping preserved; other11 I2 | A01,A05,DOC field comparison |
| REQ-INBOUND-018 | PART ordered per-unit W1 exact; confirmed W1 provenance/stock I2 | A07,A15,A25 |
| REQ-INBOUND-019 | I2 mandatory consignment W2 | A05/A25 exclusion |
| REQ-INBOUND-020 | I2 optional W3 and aggregate separation; no I1 aggregate/stock substitution | A05,A25 |
| REQ-INBOUND-021 | PART I1 PO/line/catalogue/UUID/key separation; other identities I2 | A02,A04,A12,A20 |
| REQ-INBOUND-022 | PART no fabricated QC/tolerance/B06/financial effects; future exception policy I2 | A05,A15,A17,A25 |
| REQ-INBOUND-023 | PART personal current grants for I1 surfaces; unrelated later permissions not delivered | A10,A18–A20 |
| REQ-INBOUND-024 | I1 regression obligation for eleven accepted capabilities | A02,A15,A17,A25,A27 |
| REQ-INBOUND-025 | GOV old F reassessment/residuals preserved; no device/ticket feature | DOC,A05,A25 |

## All original field requirements — scope trace (23)

| Requirement | Field / I1 scope | Proposed cases |
| --- | --- | --- |
| REQ-INBOUND-F01 | شماره سیستم — I2, not line UUID | A25 exclusion |
| REQ-INBOUND-F02 | شماره سفارش — I1 mandatory exact factory reference | A01–A03,A16 |
| REQ-INBOUND-F03 | شماره بارنامه — I2 | A05,A25 exclusion |
| REQ-INBOUND-F04 | شماره بارنامه حواله (برگ زرد) — I2 | A05,A25 exclusion |
| REQ-INBOUND-F05 | شماره رسید انبار — I2 | A05,A25 exclusion |
| REQ-INBOUND-F06 | شماره کامیون — I2 | A05,A25 exclusion |
| REQ-INBOUND-F07 | شماره آیتم — I1 optional, repeated/absent permitted | A04,A05 |
| REQ-INBOUND-F08 | نوع کالا — I1 mandatory MATERIAL_TYPE selection; actual I2 | A01,A05,A10–A15 |
| REQ-INBOUND-F09 | عرض — I1 mandatory m; actual I2 | A05,A06 |
| REQ-INBOUND-F10 | ضخامت — I1 mandatory mm; actual I2 | A05,A06 |
| REQ-INBOUND-F11 | رنگ — I1 optional COLOR selection; actual I2 | A05,A10–A14 |
| REQ-INBOUND-F12 | شماره رئال رنگ — I1 optional independent text | A01,A05,A11,A13 |
| REQ-INBOUND-F13 | طول — I1 optional m; actual I2 | A05,A06 |
| REQ-INBOUND-F14 | کیفیت — I1 optional QUALITY_GRADE selection; no QC | A05,A10–A14 |
| REQ-INBOUND-F15 | وزن — I1 mandatory per-unit W1; accepted received source I2 | A07,A15,A25 |
| REQ-INBOUND-F16 | تعداد — I1 mandatory ordered unit count; progress I2 | A04,A07 |
| REQ-INBOUND-F17 | تاریخ ثبت سفارش — I1 mandatory Jalali | A08,A09 |
| REQ-INBOUND-F18 | تاریخ ورود — I2, calendar not automatically Jalali | A05,A25 exclusion |
| REQ-INBOUND-F19 | شماره محصول — I2 meaning unresolved, no I1 alias | A05,A15,A25 exclusion |
| REQ-INBOUND-F20 | شرکت ارسال کننده (مبدا) — I2 | A05,A25 exclusion |
| REQ-INBOUND-F21 | وزن خالص گزارش مبدأ — I2 | A05,A25 exclusion |
| REQ-INBOUND-F22 | وزن خالص باسکول مقصد — I2 | A05,A25 exclusion |
| REQ-INBOUND-F23 | نام راننده — I2 sensitive field | A05,A18,A25 exclusion |

## All supplemental requirements — scope trace (12)

| Requirement | I1/I2 obligation | Proposed cases |
| --- | --- | --- |
| REQ-INBOUND-S01 | I1 factory-wide exact reference; many arrivals later I2 | A02,A03,A16,A20 |
| REQ-INBOUND-S02 | I1 m/mm/m ordered values; actual I2 | A05,A06 |
| REQ-INBOUND-S03 | I1 Jalali business-date profile/roundtrip | A08,A09 |
| REQ-INBOUND-S04 | I1 three reusable lists, original requiredness and RAL; actual I2 | A05,A10,A11 |
| REQ-INBOUND-S05 | I1 PROC add/select during ordering | A10,A11,A28 |
| REQ-INBOUND-S06 | I1 WH common catalogue capability; actual receipt use I2 | A10,A11,A17 |
| REQ-INBOUND-S07 | I1 both-role scoped reuse/isolation | A11,A12,A18 |
| REQ-INBOUND-S08 | I1 exact duplicate/concurrent creation, trusted attribution | A10,A12,A13,A19–A24 |
| REQ-INBOUND-S09 | I1 authority separation; B06 physical goods I2 | A15,A17,A18,A25 |
| REQ-INBOUND-S10 | I1 business/technical separation; mapping before I2 stock | A15,A25 |
| REQ-INBOUND-S11 | I1 historical order/reference preservation; actual discrepancy I2 | A04,A14,A17 |
| REQ-INBOUND-S12 | I1 core current roles/lookup; sensitive I2 views separate | A10,A16–A20 |

## Regression and Definition of Done for future implementation

Run relevant existing suites, not merely new happy paths: [Sales](../../apps/backend/tests/integration/sales.test.ts),
[reservations](../../apps/backend/tests/integration/reservation.test.ts),
[shipping](../../apps/backend/tests/integration/shipping.test.ts),
[shipping boundaries](../../apps/backend/tests/integration/shipping-boundaries.test.ts),
[production concurrency](../../apps/backend/tests/integration/production-concurrency.test.ts),
[production integrity](../../apps/backend/tests/integration/production-integrity.test.ts),
[genealogy](../../apps/backend/tests/integration/genealogy.test.ts),
[genealogy isolation](../../apps/backend/tests/integration/genealogy-security.test.ts),
[invoice evidence](../../apps/backend/tests/integration/invoice-evidence.test.ts),
plus the purchase/receipt/envelope/Identity/IPS/transaction sources above.

A25 compares authoritative foreign tables and calls existing owner reads, not only
a fake “no stock port” counter. No payment implementation is implied: verify no
financial module effects and preserve current invoice evidence. New runtime
permissions/DDL access must be tested with the actual restricted role, while owner
credentials are confined to fixture migration/setup.

Future acceptance requires all intended I1 behavior and applicable A01–A28 evidence,
no relevant failures/skips, Windows real-PG transaction/race/crash proof, independent
engineering/security review with required findings closed, current documentation,
scope/metadata/link/diff checks and a coherent local commit for Owner acceptance.
No I2 requirement is marked delivered by these tests. Factory UAT, UI and production
cutover remain separate gates. Step 3 acceptance approves a design, not a capability.
