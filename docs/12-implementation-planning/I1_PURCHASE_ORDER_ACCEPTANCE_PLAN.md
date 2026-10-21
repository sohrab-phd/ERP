---
id: PLAN-I1-ACCEPTANCE-001
title: Accepted I1 detailed acceptance cases and complete requirements scope trace
phase: 12-implementation-planning
status: accepted
version: 1.0.0
owners: [qa-architect, delivery-lead]
depends_on: [APR-037, APR-036, SRC-006, PLAN-I1-REFERENCE-001, APR-035, APR-034, PLAN-I1-DOMAIN-001, PLAN-I1-API-001, PLAN-I1-DATABASE-001, PLAN-I1-SECURITY-001, DOM-INBOUND-TRACE-001, DOM-INBOUND-POLICY-001]
last_reviewed: 2026-10-21
approval: APR-037 design acceptance only; implementation remains unauthorized
supersedes: null
---

# I1 acceptance design — OWNER-ACCEPTED DESIGN / NOT AUTHORIZED FOR IMPLEMENTATION

Formal Owner design acceptance:2026-10-21, [APR-037](../00-governance/approved-baselines/APR-037-i1-detailed-design-acceptance.md),
reviewed content at9c0976e0519192358e8a097f7b26fe43f4b1df6e. The design below is
accepted with its recorded conditions; no code/SQL/API/permission/test execution
or product unlock is authorized. Future environment/parity/calendar/transaction/
security/regression verification remains mandatory, not completed evidence.


This is a future test specification, not test code or passing evidence. A01–A28
are local acceptance-case labels, not a new global TEST catalogue or factory UAT.
All scenarios are synthetic test intent, not real factory records. The [domain](I1_PURCHASE_ORDER_DOMAIN_DESIGN.md),
[API](I1_PURCHASE_ORDER_API_DESIGN.md), [DB/transactions](I1_PURCHASE_ORDER_DATABASE_DESIGN.md)
and [security](I1_PURCHASE_ORDER_SECURITY_DESIGN.md) define expected accepted behavior.
APR-037 formally accepts this mandatory future test baseline; separate bounded
implementation authorization is still required before code/tests are implemented.
R1 Option A is now Owner-approved in SRC-006. The [identity specification](I1_PURCHASE_ORDER_REFERENCE_IDENTITY.md)
controls registration/lookup and raw-binding obligations. R1-T01–T12 below extend
A01–A28 without renumbering any factory requirement or claiming executed tests.

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
| A02 | Different target/key attempts same R1 comparison key, including approved raw variants, including another PROC person and otherwise identical facts | One immutable original; new unused UUID gets durable GUARD_CONFLICT, no overwrite/merge/history link; same strings in completed evidence remain valid independently | PG,API,REG |
| A03 | Two distinct authenticated PROC accounts concurrently register R1-equivalent raw references with different keys/targets at the real owner-lock barrier | Exactly one accepted PO and complete lines; loser exact GUARD_CONFLICT; both correct outcomes/audits; no scope split by supplier/role/person; unique constraint still protects when precheck path is bypassed in controlled test | PG,REC |
| A04 | Several lines, two identical specs, duplicate or missing optional itemNumber | Original array order, distinct stable line UUIDs and ordinals, no coalescing, no invented item-number uniqueness; repeated reads/replay preserve IDs | U,PG,API |
| A05 | Parameterize each missing required member, every optional omitted/provided null/blank, wrong type, wrong-kind/missing/foreign option, unknown nested property | Admitted scalar/requiredness failures GUARD_INVARIANT; invalid catalogue selection GUARD_STATE without foreign existence leakage; unknown names or structural-shape mismatch (e.g. lines not array, object for scalar) fail admission without consuming a key; no partial sources; exact Persian names/actors traceable | U,PG,API,SEC |
| A06 | Exact width/length m and thickness mm, `1.200`, tiny supported fractions, 20 integer digits, 18 fraction digits and just-outside bounds | Exact lexeme roundtrip; positive accepted limits; reject zero/negative/exponent/grouped/numeric-JSON/19th fractional digit without conversion or rounding; DB direct invalid inserts also fail | U,PG,API |
| A07 | W1 `2000`, count `5`, values beyond JS safe integer/PGbigint, max20digit operands and invalid fractions/zero/exponent; W1 `10000000000000000000` × count `10` | W1 stays per-unit; exact distinct derived-total BigInt, up to40digits per line/43 per128line sum, never cast into Kg/measuredKg/Ledger/Balance. Product>=10^20 remains nonstock evidence, no invented total-mass rejection; future I2 per-unit/group owner capacity checks remain separate. No allocation/loops proportional to ordered count; rejected bounds leave no source | U,PG,REG |
| A08 | Jalali ordinary/month-end/Esfand cases, 1395-12-30 valid versus 1394-12-30 invalid, official 1403-12-30 valid and 1404-12-30 invalid; invalid months/day zero/overflow | Profile-driven validity; no Gregorian Date parser, server-today default or timezone shift; canonical Jalali string roundtrip and separate DB creation time | U,PG,API |
| A09 | Independently reviewed Calendar Center research year-marker receipt for full1206–1498 profile, bounds and meaningful1205/1499dates | Verify all293flags/month boundaries, app/DB parity and frozen receipt/hash before acceptance; outside-profile tagged GUARD_INVARIANT is unsupported capacity, not a false-calendar claim. No clamp/today default/implicit expansion; future annual-source conflict requires reconciliation before affected use | U,PG,DOC |
| A10 | EACH catalogue kind × EACH current role adds and selects a missing legitimate value, including initially empty selection list | Six role/kind combinations work, no admin/other-person gate; trusted creator/role/time recorded; no PO/receipt/stock writes | PG,API,SEC |
| A11 | PROC creates then WH selects, WH creates then PROC selects; immediately use created IDs in an allowed order | Reusable within scope, exact labels returned; optional color/grade absence valid and RAL independent; no creation approval or free-text bypass | PG,API,SEC |
| A12 | Distinct people add same exact kind/label concurrently under different UUIDs/keys; repeat across different kinds/installations | One canonical same-scope option, loser durable GUARD_IDEMPOTENT_DUP; exact authorized query returns winner ID for use; other kind/scope independent; no accepted-reuse fiction or creator overwrite | PG,REC,SEC |
| A13 | Case, outer-space, composed/decomposed, Arabic/Persian letters/digits, ZWNJ; quotes/backslashes/script text; explicit blank/control codepoints | Catalogue exact branch remains separate; PO R1-A–D positive/negative vectors are now approved policy, with no extra transformations. No catalogue normalization or semantic synonym dedup. Exact decoded raw/escaped JSON text has same identity; safe JSON/parameterized SQL, no log echo. API/DB explicit blank/Cc predicate parity including NBSP/FEFF, combining sequences/supplementary scalars; no btrim approximation | U,PG,API,SEC |
| A14 | Persist an order then attempt catalogue/header/line UPDATE/DELETE/TRUNCATE and later line append; inspect typed option refs | Restricted role denies mutation, original labels/snapshots stable; append blocked by position/count/FK guards; identical business lines allowed; no invented catalogue lifecycle | PG,SEC |
| A15 | Add arbitrary legitimate new business Material Type and register stock-free order with it | Existing fixed technical enum unchanged, no OTHER default/mapping column/stock eligibility; no Inventory/Production admission bypass; mapping remains I2 prerequisite | PG,API,REG |
| A16 | WH looks up raw seller reference, approved equivalent variants and permitted ID, including repeated lines and special reference characters | Complete original raw-reference projection and stable IDs/positions, same order UUID for approved variants, correct m/mm/m/Jalali semantics; no binding/key/creator/documentary/stock fields, no global order listing; scoped missing and foreign result alike | PG,API,SEC |
| A17 | WH tries register, append/edit/update/cancel via I1 routes or injects PO mutation into catalogue add | DENY by role/admission/404/405 as specified; original PO unchanged. Existing WH manual receipt remains governed separately, not globally revoked by this test | API,SEC,REG |
| A18 | Customers, SEC-only, unrelated roles, customer-bound PROC/WH, foreign factory IDs and injected scope/actor fields | Forbidden before existence; no catalogue modification/read escalation; same safe not-found for permitted scoped foreign/absent IDs; no private values/SQL in errors/logs | PG,API,SEC |
| A19 | Forged/copied context; revoked role/session before admission, during key wait, before query disclosure; current-check expiry after business wait | Issued current personal capability required; no stale outcome/source disclosure. Use correct linearization: committed earlier revocation denies; held Identity locks may serialize later revocation after the operation | PG,API,SEC,REC |
| A20 | Accepted and rejected same-key replay; changed admitted scalar/array order/optional presence/valid target/principal; same person switches role for catalogue replay | Same original result/execution ID with new attempt ID; changed intent that passes admission/current policy conflicts. Unregistered v2 or unauthorized input denies before lookup, not a409binding conflict; version-binding conflict needs a controlled authorized registered alternate-version fixture. Role/request ID not binding; catalogue cross-role same-person replay allowed, WH cannot replay PROC-only registration; original attribution stable | PG,API,SEC,REC |
| A21 | Lost server-confirmed COMMIT response, connection failure around COMMIT and Windows process crash at controlled points for both commands | Original-key primary recovery resolves one complete original outcome or safe retry; no fresh key/ID/lookup substitution; no duplicate option/order/line or original decision audit/outcome. Subsequent replay/conflict attempt audits remain required by the existing envelope; recovery fence respected | PG,API,REC |
| A22 | Inject business rejection after header, after Nth line, after catalogue reference checks | All tentative order/line writes roll back; exactly original durable rejection+audit if envelope accepts that rejection; previously accepted separately created option remains reusable | PG,REC |
| A23 | Technical insert/outcome/audit failure; header-only/too-few/gapped/excess aggregates; valid identical lines; savepoint rollback after Nth line/header; independent concurrent orders | Completeness checks own complete rows once per header; invalid aggregate cannot commit and later append fails. Rolled-back header trigger events do not survive handler savepoint; no recursive writes/global closure lock. Whole technical bundle absent, no false cached rejection. Deferred COMMIT error remains technical/possibly uncertain with original-key recovery, never handler23505 mapping; independent orders both complete | PG,REC |
| A24 | Opposing owner-resource order inputs, same hash-key collision fixture, session expiry/waits, timeout/deadlock, exact known UNIQUE mapping and unknown constraint | Actual sorted hash acquisition avoids owner inversion; collisions only serialize; fresh scoped postwait reads; only mapped surviving-fact 23505 becomes specified DUP/CONFLICT; unknown errors remain technical; no nested public command or pooled snapshot | PG,REC,SEC |
| A25 | Snapshot authoritative foreign tables before/after successful and rejected I1 commands; run relevant accepted capability suites | No Inventory Unit/Lot/Ledger/Balance, Goods Receipt confirmation, reservation, Sales, Production, Shipping, Finance/invoice/payment source effects. Existing documentary, manual intake, stock, genealogy and Identity/recovery behavior preserved | PG,REG |
| A26 | Old4096byte vs new262144byte reader, mismatch/slow/encoding/duplicates;128/129ASCII or Persian scalars,128supplementary scalars=512bytes, combining marks/escaped JSON;128/129lines; short option IDs referencing long labels | Decoded128scalar+512byte limits, not UTF16/graphemes; no old-route limit changes. Byte counts include actual raw body. Individually legal fields/request/line count can exceed aggregate serialized HTTP data projection: include wrapper/escaping/IDs/unit/calendar metadata, reject before insert with fixed projection-limit message tag; never truncate/drop/split. General catalogue pages1–100 and default50 remain bounded; exact-label resolution returns zero/one | API,PG,SEC |
| A27 | Fresh migration/replay, existing checksum preservation, restricted runtime vs owner, invalid numeric/Jalali/scope/kind/direct FK rows | Additive tables/indexes/guard only; exact constraints and no unwanted grants; old sources/records untouched; valid and invalid inputs exercise real PG, not mocked constraints | PG,REG |
| A28 | Catalogue add succeeds then registration fails; catalogue add is uncertain; exact duplicate rejection then selection | Durable option survives failed order, zero order/lines; uncertain add resolved with original key before dependent work; completed DUP followed by exact scoped read uses existing option without retrying a rejected key | PG,API,REC |

No arbitrary test-count target: cases are often parameterized, and implementation
may split them into meaningful tests. Timing/race proof uses deterministic barriers
at actual key/business locks and separate verified accounts; no sleep-based race
claims. Worker/crash children are bounded and cleaned up under Windows. Restore
only verified disposable DB fixtures; never reset production or run as DDL owner
for normal behavioral assertions.

## R1 Owner-approved identity obligations — future tests R1-T01–R1-T12

All are mandatory future test obligations, not executable test code or passing evidence.
Use literal/codepoint-labelled golden inputs independent of a general normalization
library. Real PG is required for generation, uniqueness, races, audit and recovery.

| Case | Setup and required observable result | Layers |
| --- | --- | --- |
| R1-T01 | Independently specified golden vectors for EACH26ASCII uppercase mappings,20digit mappings and2Yeh/Kaf mappings; already canonical scalars unchanged. DB/app maps have exactly48source/48target scalars, no deletion and deterministic/idempotent output under different locales | U,PG |
| R1-T02 | Leading/trailing one/many U+0020, ASCIIcase, Persian/Arabic-Indic digits, Arabic/Persian Yeh/Kaf separately and combined: ` PO-۱۲ `, `po-١٢`, `PO-12` share po-12; combined Yeh/Kaf/digit examples share key | U,PG,API |
| R1-T03 | `PO-012`, `PO12`, `PO/12`, `PO_12` versus `PO-12`: leading zeros, removed hyphen and punctuation/separator differences remain distinct keys/orders/lookup misses unless separately registered | U,PG,API |
| R1-T04 | Internal single/double U+0020, boundary NBSP U+00A0, narrow NBSP U+202F, ZWNJ U+200C, ZWJ U+200D and FEFF with a nonblank reference remain significant; tab/other Cc reject, never trim to an equivalent accepted key | U,PG,API |
| R1-T05 | Unmapped U+0649 Alef Maksura, nonASCIIcase, composed/decomposed accents, fullwidth digits/letters, ligatures, hyphen/minus variants remain distinct; no NFC/NFKC or fuzzy transformations | U,PG,API |
| R1-T06 | Register mixed raw reference with boundary spaces/digits/letters; both order queries return exact stored raw string, stable technicalUUID and specs. Literal/JSONescaped same scalars have equal decoded raw identity; key/profile not public input/output or extra factory field | U,PG,API |
| R1-T07 | DB-generated STORED key equals app key for all positive/negative vectors; explicit generated-key override denied; malformed raw/empty key/profile reject, valid generated insert succeeds with restricted helperEXECUTE. RETURNING or lookup drift aborts technically without accepted source; DDL/helper replacement denied | PG,SEC |
| R1-T08 | Distinct verified PROCpeople/keys/targets concurrently register equivalent raw spellings at normalized owner-lock barrier; one committed complete order/outcome/originalaudit, loser durableCONFLICT. UNIQUE protects controlled lock-bypass path. If first rolls back, second may become winner; no two sources | PG,REC |
| R1-T09 | Same full original key/input replays accepted/rejected outcome; samekey+equivalent raw spelling change conflicts409. Newkey+same target+identical ownerfactsDUP; newkey+same target+rawvariantCONFLICT; newtarget+usedR1keyCONFLICT. Original stored raw and full binding never replaced | PG,API,REC |
| R1-T10 | Lost confirmedCOMMIT response, connection loss/crash around both source and audit/outcome commit: recover original principal/scope/key/target/full raw input, not normalized spelling/newID/key or reference lookup. One complete source or safe original retry, no extra stock/financial/source effects | PG,REC,REG |
| R1-T11 | Authorized equivalent lookup returns one original; non-equivalent lookup ownorder or generic404; forged key/profile/scope/actor fields denied; revoked/forged/customer/SEC/unrelated/foreign contexts cannot discover raw/key/order. Comparison normalization never broadens role authority | PG,API,SEC |
| R1-T12 | Material Type/Quality/Color labels differing in R1-equivalent ways remain exact-only distinct options; both roles add/reuse under existing catalogue rules. Raw128scalar/512byte validation precedes normalization, so oversized input cannot become admissible by trimming. No PO/stock modification from catalogue creation | U,PG,API,SEC,REG |

| Approved source obligation | Existing requirements linked, without rewriting them | Accepted cases |
| --- | --- | --- |
| SRC-006 R1-A/B/C/D finite equivalence | REQ-INBOUND-021/F02/S01 | R1-T01–T05,T08,T11 |
| Raw preservation and comparison-key/UUID separation | REQ-INBOUND-001/F02/S01; existing envelope binding invariant | R1-T06,T07,T09,T10 |
| Factory uniqueness, same-key versus business identity | REQ-INBOUND-014/021/023/S01/S12 | R1-T07–T11 |
| Catalogue exclusion, no new field/stock authority | REQ-INBOUND-003/017/024/S08/S09/S10 | R1-T12,A05,A15,A25 |

## All original workflow requirements — scope trace (25)

FULL I1 means planned business outcome in this scope, PART means an I1 prerequisite/
guard or subset only, I2 means not delivered by I1, GOV means exclusion/source
discipline. These are **future coverage classifications**, not implementation status.

| Requirement | I1/I2 scope and concrete obligation | Accepted cases |
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

| Requirement | Field / I1 scope | Accepted cases |
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

| Requirement | I1/I2 obligation | Accepted cases |
| --- | --- | --- |
| REQ-INBOUND-S01 | I1 factory-wide R1 comparison identity with raw reference preserved; many arrivals later I2 | A02,A03,A16,A20 |
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

Future acceptance requires all intended I1 behavior and applicable A01–A28 and R1-T01–R1-T12 evidence,
no relevant failures/skips, Windows real-PG transaction/race/crash proof, independent
engineering/security review with required findings closed, current documentation,
scope/metadata/link/diff checks and a coherent local commit for Owner acceptance.
No I2 requirement is marked delivered by these tests. Factory UAT, UI and production
cutover remain separate gates. Step 3 acceptance approves a design, not a capability.
