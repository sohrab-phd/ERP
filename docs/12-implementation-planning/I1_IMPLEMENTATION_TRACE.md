---
id: IMPL-I1-TRACE-001
title: I1 requirements to executable code and acceptance evidence
phase: 12-implementation-planning
status: accepted
version: 0.2.0
owners: [qa-architect, delivery-lead]
depends_on: [APR-039, APR-038, IMPL-I1-001, PLAN-I1-ACCEPTANCE-001, DOM-INBOUND-TRACE-001, DOM-INBOUND-POLICY-001]
last_reviewed: 2026-10-21
approval: APR-039 formal Owner I1 backend acceptance
supersedes: null
---

# I1 implementation trace — original sixty requirement identities preserved

[APR-039](../00-governance/approved-baselines/APR-039-i1-backend-acceptance-i2-clarification.md)
records actual Owner acceptance of I1 backend commit e3462fcfc4eaebbedb0d3a323bda7e0ae72d59c4.
The focused check confirmed all60IDs and executed evidence; twelve capabilities
are Owner accepted. Every I2 DEFERRED/PARTIAL remainder below stays unimplemented.
No requirement ID, original field mapping or I1/I2 boundary is changed.

Companion to [actual delivery evidence](I1_IMPLEMENTATION_STATUS.md) and the accepted
[future acceptance baseline](I1_PURCHASE_ORDER_ACCEPTANCE_PLAN.md). No original
requirement/field/rule is renumbered or rewritten. IMPLEMENTED means its bounded I1
behavior; PARTIAL explicitly retains the rest for I2. DEFERRED means no I2 runtime
feature is delivered, even when I1 exclusions/stable identifiers are tested.
Runtime result status follows the delivery evidence, not merely the presence of code.

Code references: [service/parsers](../../apps/backend/src/modules/procurement/inbound-service.ts),
[value validators](../../apps/backend/src/modules/procurement/inbound-values.ts),
[typed contracts](../../apps/backend/src/modules/procurement/inbound-contracts.ts),
[PostgreSQL owner](../../apps/backend/src/infrastructure/postgresql/inbound-store.ts),
[0017 constraints](../../database/migrations/0017_operational_purchase_orders.sql),
[HTTP](../../apps/backend/src/transport/inbound-http.ts) and
[current composition policies](../../apps/backend/src/composition-root.ts).
Tests below use file aliases linked in the acceptance map; these are executable
case names, not a new business requirement register. See the delivery report for
actual commands/results and independent review closure.

| Requirement ID | Bounded implementation / status | Actual code symbols or constraint | Acceptance evidence / I2 remaining |
| --- | --- | --- | --- |
| REQ-INBOUND-001 | IMPLEMENTED: pre-arrival original order registration | InboundService.record / parseOperationalOrder | A01,A08,A09; no arrival prerequisite |
| REQ-INBOUND-002 | IMPLEMENTED: multiple independently identified ordered lines/specifications/count/W1 | OperationalOrderInput, InboundLineInput; independent UUID/ordinal | A01,A04–A07,A10,A11 |
| REQ-INBOUND-003 | IMPLEMENTED: purchase registration has zero stock effect | InboundService has no stock port; foreign-source snapshot | A07,A25 |
| REQ-INBOUND-004 | DEFERRED: multi-arrival/waybill execution | Stable operational order/line UUIDs only | A02 compatibility/exclusion; arrivals I2 |
| REQ-INBOUND-005 | PARTIAL: WH number lookup and original ordered specifications | InboundService.query / orderByReference | A16,A18; physical verification I2 |
| REQ-INBOUND-006 | DEFERRED: actual received-unit confirmation | Closed I1 operation surface | A25 exclusion; I2 |
| REQ-INBOUND-007 | DEFERRED: previous/current/outstanding receiving progress | No I1 receiving state or projection | A25 exclusion; I2 |
| REQ-INBOUND-008 | PARTIAL: immutable ordered evidence retained | Header/line original source; immutable catalogue references | A04,A14,A17; actual verification I2 |
| REQ-INBOUND-009 | PARTIAL: original facts cannot be destructively replaced | Insert/select grants; frozen N and typed FKs | A14,A17; discrepancy evidence I2 |
| REQ-INBOUND-010 | DEFERRED: partial delivery versus mismatch | No receiving/discrepancy status invented | I2 policy/model |
| REQ-INBOUND-011 | DEFERRED: physical-unit Internal System Code | Line UUID explicitly technical, not physical code | A25 exclusion; B02/I2 |
| REQ-INBOUND-012 | PARTIAL: stable original order/line references | i1_line_order_identity_uq and immutable UUID/ordinal | A04,A14; physical-unit/arrival/origin links I2 |
| REQ-INBOUND-013 | DEFERRED: externally supplied warehouse receipt reference | No I1 receipt document field or generator | A05,A25; I2 |
| REQ-INBOUND-014 | PARTIAL: atomic I1 command/outcome/audit and durable recovery | Existing executeCommand + one owner transaction + deferred N | A20–A24; multi-unit receiving I2 |
| REQ-INBOUND-015 | DEFERRED: purchasing committed receiving visibility | Only original order/catalogue queries | A16,A25; I2 |
| REQ-INBOUND-016 | PARTIAL: originals are never labelled received | Minimum original-business projection only | A01,A16,A25; receiving view I2 |
| REQ-INBOUND-017 | PARTIAL: exact12purchasing fields implemented, other11deferred | parseOperationalOrder / original field mapping | A01,A05; original23dictionary unchanged |
| REQ-INBOUND-018 | PARTIAL: ordered one-unit W1 exact and mandatory | assertUnitInteger / unit_weight_kg_text | A07,A15,A25; accepted received W1 provenance/stock I2 |
| REQ-INBOUND-019 | DEFERRED: consignment W2 | No I1 aggregate receiving-weight field | A05,A25; I2 |
| REQ-INBOUND-020 | DEFERRED: optional consignment W3 | No allocation/substitution or I1 weighing effect | A05,A25; I2 |
| REQ-INBOUND-021 | PARTIAL: business reference/key/UUID/line identity separation | raw R1 key, independent line UUIDs and command binding | A02,A04,A12,A20; physical/document identities I2 |
| REQ-INBOUND-022 | PARTIAL: no fabricated QC/tolerance/exception/financial behavior | Closed owner contracts/no foreign effect | A05,A15,A17,A25; B06/I2 |
| REQ-INBOUND-023 | PARTIAL: trusted current personal I1 authority | IdentityAuthorization and InboundService.current | A10,A18–A20; unrelated receiving grants deferred |
| REQ-INBOUND-024 | IMPLEMENTED I1 regression obligation; old capabilities preserved | New owner-only adapters/routes plus full existing suites | A02,A15,A17,A25,A27; eleven prior preserved, I1 twelfth accepted |
| REQ-INBOUND-025 | GOVERNED: earlier weighbridge questionnaire residuals retained | No ticket/device/I2 implementation | A05,A25; OQ-011/OQ-019 not blanket closed |
| REQ-INBOUND-F01 | DEFERRED I2: شماره سیستم; YES; Mr. Karimi original receiving entry | No I1 payload alias or source field | A05/A25 closed-scope exclusion; no claim of field implementation |
| REQ-INBOUND-F02 | IMPLEMENTED: شماره سفارش; YES; Ms. Masoumi original purchasing entry | orderReference / generated R1 key | A01–A03,A16,R1-T01–T12; receiving actual values remain I2 where applicable |
| REQ-INBOUND-F03 | DEFERRED I2: شماره بارنامه; YES; Mr. Karimi original receiving entry | No I1 payload alias or source field | A05/A25 closed-scope exclusion; no claim of field implementation |
| REQ-INBOUND-F04 | DEFERRED I2: شماره بارنامه حواله (برگ زرد); NO; Mr. Karimi original receiving entry | No I1 payload alias or source field | A05/A25 closed-scope exclusion; no claim of field implementation |
| REQ-INBOUND-F05 | DEFERRED I2: شماره رسید انبار; YES; Mr. Karimi original receiving entry | No I1 payload alias or source field | A05/A25 closed-scope exclusion; no claim of field implementation |
| REQ-INBOUND-F06 | DEFERRED I2: شماره کامیون; NO; Mr. Karimi original receiving entry | No I1 payload alias or source field | A05/A25 closed-scope exclusion; no claim of field implementation |
| REQ-INBOUND-F07 | IMPLEMENTED: شماره آیتم; NO; Ms. Masoumi original purchasing entry | optional itemNumber; line UUID independent | A04,A05; receiving actual values remain I2 where applicable |
| REQ-INBOUND-F08 | IMPLEMENTED: نوع کالا; YES; Ms. Masoumi original purchasing entry | materialTypeOptionId; typed MATERIAL_TYPE FK | A01,A05,A10–A15; receiving actual values remain I2 where applicable |
| REQ-INBOUND-F09 | IMPLEMENTED: عرض; YES; Ms. Masoumi original purchasing entry | widthM / width_m_text / assertDimension; m | A05,A06; receiving actual values remain I2 where applicable |
| REQ-INBOUND-F10 | IMPLEMENTED: ضخامت; YES; Ms. Masoumi original purchasing entry | thicknessMm / thickness_mm_text / assertDimension; mm | A05,A06; receiving actual values remain I2 where applicable |
| REQ-INBOUND-F11 | IMPLEMENTED: رنگ; NO; Ms. Masoumi original purchasing entry | optional colorOptionId; typed COLOR FK | A05,A10–A14; receiving actual values remain I2 where applicable |
| REQ-INBOUND-F12 | IMPLEMENTED: شماره رئال رنگ; NO; Ms. Masoumi original purchasing entry | optional independent ralColorNumber | A01,A05,A11,A13; receiving actual values remain I2 where applicable |
| REQ-INBOUND-F13 | IMPLEMENTED: طول; NO; Ms. Masoumi original purchasing entry | optional lengthM / length_m_text; m | A05,A06; receiving actual values remain I2 where applicable |
| REQ-INBOUND-F14 | IMPLEMENTED: کیفیت; NO; Ms. Masoumi original purchasing entry | optional qualityGradeOptionId; typed QUALITY_GRADE FK | A05,A10–A14; receiving actual values remain I2 where applicable |
| REQ-INBOUND-F15 | IMPLEMENTED: وزن; YES; Ms. Masoumi original purchasing entry | unitWeightKg / unit_weight_kg_text; one-unit W1 | A07,A15,A25; receiving actual values remain I2 where applicable |
| REQ-INBOUND-F16 | IMPLEMENTED: تعداد; YES; Ms. Masoumi original purchasing entry | orderedUnitCount / ordered_unit_count_text | A04,A07; receiving actual values remain I2 where applicable |
| REQ-INBOUND-F17 | IMPLEMENTED: تاریخ ثبت سفارش; YES; Ms. Masoumi original purchasing entry | registrationDateJalali / stored YMD/profile | A08,A09; receiving actual values remain I2 where applicable |
| REQ-INBOUND-F18 | DEFERRED I2: تاریخ ورود; YES; Mr. Karimi original receiving entry | No I1 payload alias or source field | A05/A25 closed-scope exclusion; no claim of field implementation |
| REQ-INBOUND-F19 | DEFERRED I2: شماره محصول; YES; Mr. Karimi original receiving entry | No I1 payload alias or source field | A05/A25 closed-scope exclusion; no claim of field implementation |
| REQ-INBOUND-F20 | DEFERRED I2: شرکت ارسال کننده (مبدا); NO; Mr. Karimi original receiving entry | No I1 payload alias or source field | A05/A25 closed-scope exclusion; no claim of field implementation |
| REQ-INBOUND-F21 | DEFERRED I2: وزن خالص گزارش مبدأ; YES; Mr. Karimi original receiving entry | No I1 payload alias or source field | A05/A25 closed-scope exclusion; no claim of field implementation |
| REQ-INBOUND-F22 | DEFERRED I2: وزن خالص باسکول مقصد; NO; Mr. Karimi original receiving entry | No I1 payload alias or source field | A05/A25 closed-scope exclusion; no claim of field implementation |
| REQ-INBOUND-F23 | DEFERRED I2: نام راننده; NO; Mr. Karimi original receiving entry | No I1 payload alias or source field | A05/A25 closed-scope exclusion; no claim of field implementation |
| REQ-INBOUND-S01 | IMPLEMENTED I1: factory-wide normalized PO identity, raw retained | normalizeOrderReference / generated STORED / i1_po_reference_uq | A02,A03,A16,A20,R1-T01–T12; multiple arrivals I2 |
| REQ-INBOUND-S02 | IMPLEMENTED I1: m/mm/m exact ordered values | assertDimension / exact text fields and fixed units projection | A05,A06; actual receipt verification I2 |
| REQ-INBOUND-S03 | IMPLEMENTED I1: explicit finite Jalali registration date | parseJalaliDate / i1_po_jalali_ck / calendar receipt | A08,A09; receiving date not inferred |
| REQ-INBOUND-S04 | IMPLEMENTED I1: three shared extensible reusable lists | catalogueKinds / option UUID selection / typed scoped FKs | A05,A10,A11; original requiredness/RAL unchanged |
| REQ-INBOUND-S05 | IMPLEMENTED: PROC creates/selects missing options | AddInboundCatalogueOption + list/exact selection | A10,A11,A28 |
| REQ-INBOUND-S06 | IMPLEMENTED: WH common catalogue creation/selection | Same independently durable command and query policy | A10,A11,A17; receiving integration I2 |
| REQ-INBOUND-S07 | IMPLEMENTED I1: scoped both-role reuse/isolation | Trusted both-scope SQL and current explicit role policies | A11,A12,A18 |
| REQ-INBOUND-S08 | IMPLEMENTED: exact catalogue identity/concurrency/trusted attribution | i1_option_label_uq; private creator metadata; full bound outcome/audit | A10,A12,A13,A19–A24 |
| REQ-INBOUND-S09 | IMPLEMENTED I1 authority separation; B06 deferred | WH cannot register/edit PO; PROC has no new receipt/stock permission | A15,A17,A18,A25; unexpected goods acceptance I2 |
| REQ-INBOUND-S10 | IMPLEMENTED I1 business/technical material separation | No stock enum/mapping/OTHER fallback or Inventory port | A15,A25; mapping policy before I2 stock |
| REQ-INBOUND-S11 | IMPLEMENTED original immutable order/catalogue history | No update/delete/lifecycle; frozen complete line set | A04,A14,A17; actual discrepancy evidence I2 |
| REQ-INBOUND-S12 | IMPLEMENTED core current PROC/WH registration/read policy | Explicit command/version/target/result policies and narrow queries | A10,A16–A20; I2 sensitive reads separate |

## Executable case map

B=[behavior/security/concurrency/real lost-COMMIT](../../apps/backend/tests/integration/inbound.test.ts);
D=[direct PostgreSQL integrity](../../apps/backend/tests/integration/inbound-integrity.test.ts);
H=[composed real HTTP](../../apps/backend/tests/integration/inbound-http.test.ts);
R=[real key/owner waits, revocation, deadlock and Windows crashes](../../apps/backend/tests/integration/inbound-recovery.test.ts);
X=[version binding, actual hash ordering/collision, pagination and foreign snapshots](../../apps/backend/tests/integration/inbound-additional.test.ts);
V=[independent calendar/exact values/R1 units](../../apps/backend/tests/unit/inbound-values.test.ts).
The [existing migration suite](../../apps/backend/tests/integration/migration.test.ts),
[SQL guard cases](../../tools/test/migration-guard.test.mjs) and all existing accepted-
capability suites are included by the root runners. No PostgreSQL invariant is
replaced by a mock; deliberate fault seams retain actual transactions/SQL/constraints.

| Accepted case family | Executable evidence | Material assertion |
| --- | --- | --- |
| A01 | B,H | Full/minimal pre-arrival original fields, committed full lines, zero stock |
| A02 | B,D,H,X | Factory comparison uniqueness; old documentary same reference remains separate |
| A03 | B,D | Separate verified people rendezvous at real owner lock; one winner and exact conflict |
| A04 | B,H,D | Stable distinct UUIDs/ordinals for repeated/unnumbered lines |
| A05 | B,H,D | Stage-required/optional/wrong types/unknown closed shapes and typed missing/foreign/kind errors |
| A06 | V,B,D | Exact m/mm/m source lexemes, positive20/18bounds, malformed/direct-DB rejection |
| A07 | V,B,D | Huge W1/count and exact nonstock derived totals; no unit-count enumeration |
| A08 | V,B,D,H | Valid/invalid Jalali, direct YMD/profile roundtrip, separate DB time |
| A09 | V,D; calendar receipt | Independent293flags/107016valid days and full app/DB profile parity |
| A10 | B,H | Both roles × all3kinds add/select, trusted creator/time |
| A11 | B,H | Immediate cross-role reuse and optional fields/RAL independence |
| A12 | B,D | Distinct-person exact-label race, one winner/DUP, kind/scope independence |
| A13 | V,B,D,H | Exact catalogue variants/injection-safe JSON, frozen exhaustive text parity |
| A14 | D,B | Runtime mutation denial, typed references, deferred complete aggregate and append denial |
| A15 | B,H,X | Arbitrary legitimate business type, no technical enum/default/foreign effect |
| A16 | B,H | Authorized reference/UUID original complete projection; significant variants absent |
| A17 | B,H,D | WH read-only original order, closed mutation/append/injected authority |
| A18 | B,H,D | Generic customer/SEC/foreign/forged denial, private fields excluded |
| A19 | B,H,R | Current tracked personal context; real key/owner waits, expiry and revocation linearization |
| A20 | B,H,X | Accepted/rejected replay, principal/raw/array/optional/version binding, unregistered-v2 denial, same-person cross-role catalogue replay |
| A21 | B,R | Genuine dropped confirmed COMMIT replies for both commands;10real Windows crash checkpoints across both commands; original-key recovery |
| A22 | B,D | Business rejection after tentative order/lines, savepoint rollback, previously committed option retained |
| A23 | B,D,R | Audit/outcome/SQL/deferred failure/late line rollback and complete source bundle |
| A24 | R,X | Actual signed-hash ordering/opposed arrays/controlled distinct-resource collision, real timeout/deadlock, known23505postsavepoint mapping and unknown technical error |
| A25 | B,H,X; existing suites | Authoritative foreign-source preservation and independent old receipt/documentary/eleven-capability regressions |
| A26 | V,H,X,B | Actual reader16/5s/byte limits, scalar/UTF8 bounds,128/129lines, pre-insert full-response rejection, successful50/100/cursor pages |
| A27 | D; migration/guard suites | Fresh/replay/checksum/additive schema, restricted roles, exact numeric/date/text/source constraints |
| A28 | B,H,R | Separate durable option survives failed order; duplicate selection and uncertain original-command recovery |

| R1 family | Executable evidence |
| --- | --- |
| R1-T01 | V,B,D,H: boundary U+0020 and ASCII case only |
| R1-T02 | V,B,D,H: Persian/Arabic-Indic digit mappings |
| R1-T03 | V,B,D: specified Yeh/Kaf mappings only |
| R1-T04 | V,B,D,H: combinations and fixed comparison identity |
| R1-T05 | V,B,D,H: leading zeros/internal spaces/punctuation/NBSP/ZW/unapproved Unicode significant |
| R1-T06 | B,D,H: exact raw reference roundtrip, typed key/profile private/forgery denied |
| R1-T07 | D plus pre-implementation actual PG probe: authoritative STORED/helper/app parity/permissions |
| R1-T08 | B,D: equivalent separate-person races/UNIQUE and rolled-back-source absence |
| R1-T09 | B,H,X: same original replay versus changed raw/target/principal/version/array intent |
| R1-T10 | B,R: real unknown COMMIT/crash and original-key source/outcome/audit recovery |
| R1-T11 | B,H,D: equivalent scoped lookup and generic absent/foreign/unauthorized results |
| R1-T12 | V,B,D,H: catalogue exact-only separation, raw limits before transform, zero foreign authority |

I2 policy/design/implementation and its future acceptance remain separate; I1 backend
acceptance is recorded in APR-039.
