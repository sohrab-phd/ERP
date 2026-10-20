---
id: PLAN-INBOUND-COVERAGE-001
title: Purchase and receiving Step 2 requirements implementation coverage
phase: 12-implementation-planning
status: in_review
version: 0.2.0
owners: [delivery-lead, chief-solution-architect]
depends_on: [APR-032, DOM-INBOUND-TRACE-001, PLAN-INBOUND-GAP-001, PLAN-INBOUND-DECISIONS-001]
last_reviewed: 2026-10-20
approval: null
supersedes: null
---

# Exact 48-requirement gap matrix — DRAFT

Step 2 v0.1 analysis is Owner accepted under [APR-033](../00-governance/approved-baselines/APR-033-i1-policy-clarification.md);
commit `b8666b76602f2d002c4cacc5e8b689fe0130fb24` push is unconfirmed. The 48 primary
rows below remain the accepted code-analysis snapshot. Their B references now
resolve through the current decision register: PO-specific B01, specified B07
units/Jalali/lists and core B08 duties are OWNER RESOLVED. No runtime status changes.
The [policy amendment](../02-domain-business-architecture/PURCHASE_RECEIVING_I1_POLICY_AMENDMENT.md)
adds REQ-INBOUND-S01–S12, including both-role catalogue creation/selection, as a
separate trace rather than rewriting the original 25 rules or 23 fields.

Requirement meanings come from the accepted [25 workflow rules](../02-domain-business-architecture/PURCHASE_RECEIVING_REQUIREMENTS_BASELINE.md)
and [23-field dictionary](../02-domain-business-architecture/PURCHASE_RECEIVING_FIELD_REGISTER.md).
This table does not replace them. Each of the 48 IDs has one primary row here.
Evidence references E01–E09 link to exact repository paths, relevant symbols and
inspected test definitions in the [code catalogue](PURCHASE_RECEIVING_TECHNICAL_GAP_ANALYSIS.md).
No absent feature is marked implemented because documentation proposed it.

Current-code status is separate from **BLOCKED BY POLICY** (B references) and
**DESIGN REQUIRED** (D references) in the next columns. A dash means no additional
business decision for that requirement, not permission to implement. All D items
remain DESIGN REQUIRED; cited B gates have the current resolved/OPEN breakdown in the
[decision register](PURCHASE_RECEIVING_DECISION_REGISTER.md). Proposed I1/I2 refer
to the [roadmap](PURCHASE_RECEIVING_DELIVERY_ROADMAP.md), not authorized work.

Future test categories: U = parser/domain unit; PG = real PostgreSQL persistence,
constraints, rollback/concurrency; API = transport/closed schema; SEC = scope,
current grants and disclosure; REC = durable replay/uncertain outcome/crash;
TRACE = authoritative genealogy/lineage; REG = accepted-capability regression;
DOC = governance/source consistency. These are obligations, not executed tests.

## Workflow requirements — 25 rows

| Requirement | Required factory behavior | Verified existing code evidence | Current implementation status | Concrete missing behavior / conflict | Business gate (BLOCKED BY POLICY where cited) | Technical dependency (DESIGN REQUIRED) | Proposed increment | Future test / acceptance obligation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-INBOUND-001 | Pre-arrival seller PO/date registration | [E01](PURCHASE_RECEIVING_TECHNICAL_GAP_ANALYSIS.md#e01-purchasing-evidence), PurchaseService.record records completed evidence only | NOT IMPLEMENTED | No operational order or registration-date semantics; purchaseDate is not equivalent | B01, B07, B08 | D01, D05, D06, D07 | I1 | U/API/PG/SEC: register before arrival, exact identity/date and no completed-document conversion |
| REQ-INBOUND-002 | Multiple ordered lines/specifications/count/per-unit W1 | E01 PurchaseStore/CompletedPurchaseInput; [E02](PURCHASE_RECEIVING_TECHNICAL_GAP_ANALYSIS.md#e02-current-receipt-command) ReceiptInput | NOT IMPLEMENTED | Description and receipt count/kg are not ordered item lines | B07 | D02, D05 | I1 | U/API/PG: distinct repeated-spec lines, optional item number, all order fields, per-unit rather than total weight |
| REQ-INBOUND-003 | Order registration never increases stock | E01 PurchaseService has no stock port; [E04](PURCHASE_RECEIVING_TECHNICAL_GAP_ANALYSIS.md#e04-ips-arithmetic-and-locks) IPS is stock owner | PARTIAL | Documentary purchase already has zero foreign writes; absent operational command must preserve this boundary | — | D07, D08 | I1 | PG/REG: new PO creates zero Unit/Lot/Ledger/Balance effects; existing evidence unchanged |
| REQ-INBOUND-004 | Many trucks/waybills per PO, repeated original PO reference valid | E01 no operational arrivals; E02 ReceiptService.post singular receipt | NOT IMPLEMENTED | No PO/arrival/waybill relationship; PO number must not deduplicate distinct arrivals | B01, B04 | D01, D02 | I2 | PG/API: two arrivals/waybills on same PO, correct independent evidence; duplicate source scenarios under approved identity |
| REQ-INBOUND-005 | Karimi looks up order from waybill PO number and sees ordered specs | E01 createPurchaseHandler only documentary UUID reads; [E06](PURCHASE_RECEIVING_TECHNICAL_GAP_ANALYSIS.md#e06-identity-authority-and-current-read-surfaces) current policies | NOT IMPLEMENTED | No reference lookup, ordered lines or WH operational-order read | B01, B07, B08, B09 | D01, D06 | I1 lookup; I2 arrival linkage | API/SEC/PG: correct scoped lookup, no first-match ambiguity, permitted original fields, unknown reference behavior |
| REQ-INBOUND-006 | Confirm only units physically received now; remainder unposted | E02 ReceiptService.post; [E03](PURCHASE_RECEIVING_TECHNICAL_GAP_ANALYSIS.md#e03-inventory-origin-and-schema-grain) InventoryReceiptService.receive | PARTIAL | Manual intake posts one asserted unit; no ordered unit selection, multi-unit confirmation or remainder | B02, B04, B06 | D02, D04, D07 | I2 | PG/REG: confirm 3 of 5 units, exactly 3 independent stock units; remaining 2 have no stock |
| REQ-INBOUND-007 | Separate prior/current/cumulative/outstanding counts | E01 no progress; E02 descriptive count; E05 envelope outcome replay | NOT IMPLEMENTED | Durable receipt replay exists but no line progress/source relation | B04, B06 | D02, D04, D06 | I2 | PG/REC: concurrent arrivals and replay count once, coherent outstanding; no clamp/automatic closure |
| REQ-INBOUND-008 | Verify ordered attributes; accepted actual governs unit record | E02 parseReceiptInput accepts actual type/kg only | PARTIAL | No ordered snapshot comparison or actual confirmed attribute set | B05, B06, B07 | D03, D05 | I2 | U/PG: preserve original/actual, correct unit W1/type, approved exception route only |
| REQ-INBOUND-009 | Persistent discrepancy marker, original/actual, actor and links | E02 PostgresReceiptStore.create / migration 0006 persist trusted actor; E03 origin; E01 immutable documentary evidence | PARTIAL | Attribution/immutability foundations exist, no discrepancy source or ordered/actual links | B06, B07 | D02, D05, D06 | I2 | PG/SEC/TRACE: mismatch persists after restart, trusted actor, full trace and no destructive order update |
| REQ-INBOUND-010 | Partial delivery is not specification mismatch | E01/E02 no comparison/progress | NOT IMPLEMENTED | Need independently derived progress and specification comparison | B06 only for exceptional branches | D04, D05 | I2 | U/PG: ordinary partial delivery shows outstanding without discrepancy; real mismatch visible separately |
| REQ-INBOUND-011 | Distinct physical Internal System Code for every received unit | E02 internalCode; E03 migration 0006 and repeated-code receipt test | PARTIAL | Current Internal Code intentionally nonunique, one Unit even if count>1 | B02, B04 | D01, D02, D07 | I2 | PG/TRACE/REG: distinct identical coils, namespace/reuse/legacy cases, no duplicate physical confirmation across admitted paths |
| REQ-INBOUND-012 | Each unit traces PO/line/arrival/waybill/receipt | E03 material_lot; [E07](PURCHASE_RECEIVING_TECHNICAL_GAP_ANALYSIS.md#e07-genealogy-source-facts-and-isolation) GenealogyReceiptOrigin/originEdges | PARTIAL | Existing receipt→Unit/Lot trace lacks PO/line/arrival and discrepancy sources | B02, B03, B04 | D02, D07 | I2 | PG/TRACE/SEC: authoritative per-unit lineage; shared-truck unrelated order/PII hidden from customer trace |
| REQ-INBOUND-013 | Existing external warehouse receipt reference, not generated UUID/key | E02 ReceiptRecord uses technical receipt target; no input business reference | NOT IMPLEMENTED | Mandatory external reference absent; no approved reference namespace/cardinality | B01, B04 | D01, D02 | I2 | API/PG: operator-supplied document retained, not substituted/generated; repeated references under approved scope |
| REQ-INBOUND-014 | Confirmed receipt/units/stock/audit/outcome atomic through IPS | E02/E03 single-unit bundle; E04 IPS batch; [E05](PURCHASE_RECEIVING_TECHNICAL_GAP_ANALYSIS.md#e05-envelope-transaction-recovery-and-audit) executeCommand | PARTIAL | No atomic receiving group, purchase progress or multiple unit-origin admission | B02, B04, B05, B06 | D03, D04, D07, D08 | I2 | PG/REC/SEC: later-leg/audit failure rollback, races/revocation/deadlocks, unknown COMMIT, no partial group or duplicate progress |
| REQ-INBOUND-015 | Masoumi sees committed receipts/units/progress/discrepancies grouped by PO | E01 PurchaseService.get; E06 receipt reads WH/SEC only | NOT IMPLEMENTED | No operational progress query or PROC receiving projection; no UI exists | B08 | D04, D06 | I2 | PG/API/SEC: post-commit coherent grouped results, original PO grouping, role/field scope and no uncommitted facts |
| REQ-INBOUND-016 | Never display ordered-only material as received | E01 completed evidence has no progress view | NOT IMPLEMENTED | No future receiving visibility projection yet | — | D04, D06 | I2 | PG/API: ordered-only/no-receipt and partially received cases, previous/current not double-added; no browser completion claim |
| REQ-INBOUND-017 | Exact 23 fields, actors, requiredness at proper stages | E01 four documentary fields; E02 six-field receiving input | PARTIAL | Partial lexical analogues do not implement field register; most fields absent and semantic gaps remain | B01–B09 as applicable to individual field rows | D01–D07 | I1 order fields; I2 receiving fields | U/API/DOC/SEC: all 23 mappings, 13 mandatory/10 optional, M12/K11, stage-aware validation and no invented field |
| REQ-INBOUND-018 | Accepted W1 per physical unit drives stock without destination unit weighing | E02 measuredKg; E03 measured immutable origin; E04 effect validation | PARTIAL | Whole per-Unit kg exists but measured-origin provenance conflicts with new recorded/accepted W1 | B05 | D03, D05, D07 | I1 ordered W1; I2 stock | U/PG/REG: 3 accepted units × 2000 kg = 6000 stock, original/accepted separate; no historical relabeling |
| REQ-INBOUND-019 | Mandatory W2 from this arrival's waybill, whole consignment net | E02 parseReceiptInput rejects noncontract fields | NOT IMPLEMENTED | No W2/source/consignment grain; measuredKg is not W2 | B04, B07, B09 | D02, D05 | I2 | U/API/PG: W2 required at receiving, separate per arrival, never total of multi-truck PO |
| REQ-INBOUND-020 | W3 optional full-consignment net; W2/W3 never allocate/replace W1 | E02/E04 no aggregate input or allocation, but no W2/W3 support | NOT IMPLEMENTED | Absence of aggregate fields is not implementation; record independent optional W3 and prohibit stock derivation | B04, B07 | D02, D03, D05 | I2 | U/API/PG: W3 absent valid; differing aggregates produce no per-unit allocation, stock override or automatic tolerance effect |
| REQ-INBOUND-021 | Business and technical identities distinct, no guessed scopes | E01 documentary UUID/ref; E02 receipt UUID/key/code/Sheet code; E03 origin | PARTIAL | Distinctions exist for current subset; PO/line/waybill/receipt ref/F19 and physical namespace absent | B01, B02, B03, B04 | D01, D02, D07 | I1/I2 | U/PG/TRACE: no alias F19→Sheet code; UUID/key not business document/physical identity; legacy-safe constraints |
| REQ-INBOUND-022 | No fabricated tolerance, extras, rejection, QC or remediation effects | E02 closed input; E04 authorized owning effects only | PARTIAL | Existing narrow commands exclude speculative inputs; new workflow has no approved exception policy or validations | B05, B06, B09 | D03, D05 | I1/I2 constraints | U/API/PG/REG: no implicit acceptance, reject-all, allocation, QC or monetary/corrective posting; approved exception boundary only |
| REQ-INBOUND-023 | Personal current ACT grants, no hardcoded factory names | E05 executeCommand; E06 IdentityAuthorization / current composition policies | IMPLEMENTED | Exact guard is implemented for existing commands/reads; new operational capabilities and field scopes remain absent | B08 for new authority only | D06 for new surfaces | Reuse in I1/I2 | SEC/PG/REC: personal attribution, forged/name/role header denial, revoke during wait/replay/read, org/customer isolation |
| REQ-INBOUND-024 | Preserve accepted purchase and no-PO/no-ticket manual receiving | E01 current immutable purchases; E02/E03 v1 intake; E08 regression tests | IMPLEMENTED | Compatibility requirement is verified for current baseline only; future extension not delivered; cross-path identity must be reconciled | B02; B10 if historical linking included | D07, D08 | I1/I2 regression | REG/API/PG: existing schemas/results/roles/SHEET rules and old source meaning unchanged; no automatic historical conversion |
| REQ-INBOUND-025 | Reassess F01–F08 individually; no device/ticket implementation | Accepted Step 1 reconciliation F table; E02 closed receipt; E09 current gate/owners | IMPLEMENTED (governance only) | Reassessment already documented/accepted; no new runtime feature claimed; residuals remain open | B01–B09 reframed residuals; deferred device/ticket work | D07 maintain boundary | Step 2 DOC; I1/I2 exclusion | DOC/API/REG: retain residual statuses and no device assumption, separate ticket API or gate expansion |

## Factory fields — 23 rows

Actor/requiredness below exactly repeat the accepted register. M = Ms. Masoumi,
purchase registration; K = Mr. Karimi, receiving. This table focuses on implementation
gaps; logical ownership and ambiguities remain in the accepted dictionary and
the architecture/decision companions. No value format is newly approved here.

| Requirement | Required field / actor / requiredness / meaning | Verified existing code evidence | Current implementation status | Concrete missing behavior / conflict | Business gate (BLOCKED BY POLICY where cited) | Technical dependency (DESIGN REQUIRED) | Proposed increment | Future test / acceptance obligation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-INBOUND-F01 | شماره سیستم — K / YES / individual physical-unit code | E02 ReceiptInput.internalCode; E03 material_lot/internal_code repeated-code test | PARTIAL | Current descriptive nonunique code cannot enforce physical distinctness | B02, B04 | D01, D02, D07 | I2 | PG/TRACE/REG: per-unit distinctness, legacy and mixed-path duplicate prevention under approved scope |
| REQ-INBOUND-F02 | شماره سفارش — M / YES / seller PO reference | E01 CompletedPurchaseInput.purchaseDocumentReference is documentary only | NOT IMPLEMENTED | No operational seller-order identity/lookup; lexical analogue not same meaning | B01 | D01, D07 | I1 | API/PG/SEC: approved namespace, ambiguous lookup, no forced conversion of documentary references |
| REQ-INBOUND-F03 | شماره بارنامه — K / YES / waybill number | E02 ReceiptInput has no waybill | NOT IMPLEMENTED | No arrival document evidence/source identity | B01, B04 | D01, D02 | I2 | API/PG: mandatory per relevant arrival, same PO on different waybills valid, duplicate/reuse cases |
| REQ-INBOUND-F04 | شماره بارنامه حواله (برگ زرد) — K / NO / yellow-copy reference | E02 no corresponding input/store field | NOT IMPLEMENTED | Optional evidence and relationship absent | B04, B07 | D02, D05 | I2 | U/API/PG: absence accepted; exact supplied reference and document relation preserved |
| REQ-INBOUND-F05 | شماره رسید انبار — K / YES / existing warehouse receipt reference | E02 technical target UUID only | NOT IMPLEMENTED | External mandatory reference absent, not generated by ERP | B01, B04 | D01, D02 | I2 | API/PG: stage required, external source, distinct UUID/key and approved reuse/cardinality |
| REQ-INBOUND-F06 | شماره کامیون — K / NO / truck number | E02 no corresponding input | NOT IMPLEMENTED | Optional arrival metadata and read scope absent | B07, B08 | D02, D05, D06 | I2 | API/PG/SEC: optional value retained, allowed roles only, safe text/log handling |
| REQ-INBOUND-F07 | شماره آیتم — M / NO / item number | E01 no item lines | NOT IMPLEMENTED | No business item number or independent line identity | B07 | D01, D02, D05 | I1 | U/API/PG: absent/repeated business number does not collapse distinct ordered lines |
| REQ-INBOUND-F08 | نوع کالا — M / YES / material-product type | E02 ReceiptInput.type is actual intake enum only | PARTIAL | No ordered type or actual-vs-order comparison; enum not automatically factory taxonomy | B06, B07 | D05, D07 | I1/I2 | U/API/PG: approved type mapping, original/actual independent, no widening downstream type assumptions |
| REQ-INBOUND-F09 | عرض — M / YES / width | E01/E02 no corresponding field | NOT IMPLEMENTED | Ordered/actual dimensional evidence and units absent | B07 | D05 | I1/I2 verification | U/API/PG: required order width, approved units, comparison retains original/actual |
| REQ-INBOUND-F10 | ضخامت — M / YES / thickness | E01/E02 no corresponding field | NOT IMPLEMENTED | Ordered/actual thickness semantics absent | B07 | D05 | I1/I2 verification | U/API/PG: approved representation, no rounding/tolerance/default, mismatch evidence |
| REQ-INBOUND-F11 | رنگ — M / NO / color | E01/E02 no corresponding field | NOT IMPLEMENTED | Optional ordered/actual color evidence absent | B07 | D05 | I1/I2 verification | U/API/PG: absent/present handling, original/actual independent and visible mismatch |
| REQ-INBOUND-F12 | شماره رئال رنگ — M / NO / RAL color number | E01/E02 no corresponding field | NOT IMPLEMENTED | No RAL evidence, approved pattern or dependency | B07 | D05 | I1/I2 verification | U/API/PG: preserve exact term/value, optional, no invented RAL pattern or color dependency |
| REQ-INBOUND-F13 | طول — M / NO / length | E01/E02 no corresponding field | NOT IMPLEMENTED | Optional ordered/actual length, units and absence semantics absent | B07 | D05 | I1/I2 verification | U/API/PG: approved units, optional original/actual, no stock-UOM substitution |
| REQ-INBOUND-F14 | کیفیت — M / NO / quality-grade descriptor | E01/E02 no corresponding field | NOT IMPLEMENTED | No ordered/actual grade; not a QC approval field | B06, B07 | D05 | I1/I2 verification | U/API/PG: optional grade retained/compared, no new QC prerequisite |
| REQ-INBOUND-F15 | وزن — M / YES / weight of ONE physical unit (W1) | E02 measuredKg; E03 measured origin; E04 owning effect check | PARTIAL | No ordered W1, confirmed actual provenance or separate comparison | B05 | D03, D05, D07 | I1/I2 | U/PG/TRACE: per-unit not line total, whole W1 stock, changed source under policy, no W2/W3 substitution |
| REQ-INBOUND-F16 | تعداد — M / YES / ordered physical-unit count per line | E02 count descriptive, one InventoryReceiptService.receive call | PARTIAL | Current count is not ordered quantity, unit creation count or receiving progress | B06, B07 | D02, D04, D05 | I1/I2 | U/PG/REC: ordered/prior/current/cumulative/outstanding separate, no count×measuredKg on old receipts |
| REQ-INBOUND-F17 | تاریخ ثبت سفارش — M / YES / order registration date | E01 purchaseDate belongs to completed-purchase evidence | NOT IMPLEMENTED | No operational registration date; DB record timestamp not substitute | B07 | D05, D07 | I1 | U/API/PG: approved business date separate from completion/arrival/DB recording time |
| REQ-INBOUND-F18 | تاریخ ورود — K / YES / actual arrival date | E02 migration 0006 has DB created_at; ReceiptRecord exposes no entered arrival date | NOT IMPLEMENTED | No actual arrival date at consignment grain; DB creation time is not a substitute | B04, B07 | D02, D05 | I2 | U/API/PG: relevant stage required, distinct for arrivals and from posting/record time |
| REQ-INBOUND-F19 | شماره محصول — K / YES / product number (meaning OPEN) | E02 productCode optional for non-SHEET, required and scope-unique for SHEET | NOT IMPLEMENTED | No verified equivalence; meaning/grain/reuse must be settled | B03 | D02, D05 | I2 | U/API/PG/TRACE: approved meaning/cardinality, no alias to Sheet/internal/item/UUID |
| REQ-INBOUND-F20 | شرکت ارسال کننده (مبدا) — K / NO / sending company | E01 supplierReference is not confirmed equivalent | NOT IMPLEMENTED | Arrival origin-company context absent; not assumed seller | B04, B07, B08 | D02, D05, D06 | I2 | API/PG/SEC: optional actual source, no inferred seller-master dependency or unsafe disclosure |
| REQ-INBOUND-F21 | وزن خالص گزارش مبدأ — K / YES / origin-reported consignment net (W2) | E02 no aggregate source input; measuredKg not equivalent | NOT IMPLEMENTED | Mandatory waybill net absent; no receipt/consignment relation | B04, B07, B09 | D02, D05 | I2 | U/API/PG: per truck/waybill source, mandatory, source dispute route; never PO total or allocated stock |
| REQ-INBOUND-F22 | وزن خالص باسکول مقصد — K / NO / destination consignment net (W3) | E02 no destination aggregate input or device port | NOT IMPLEMENTED | Optional aggregate field absent; no protocol evidence implied | B04, B07 | D02, D05 | I2 | U/API/PG: absence valid, full consignment, no unit allocation/tolerance/device prerequisite |
| REQ-INBOUND-F23 | نام راننده — K / NO / driver name | E02 no driver input | NOT IMPLEMENTED | Optional arrival PII persistence/read rules absent | B08 | D02, D05, D06 | I2 | API/PG/SEC: optional source text, safe rendering/logging, explicit field scope, no customer genealogy leak |

The three IMPLEMENTED workflow rows have narrow meanings: existing personal
authorization guard (023), current compatibility baseline (024), and already
accepted governance reassessment only (025). They do **not** establish operational
PO/receiving functionality. Every new operational surface remains absent or
partial and gated. No field requirement is fully implemented with its complete
factory semantics. Source test definitions were read; no runtime/DB tests were
executed for this matrix.
