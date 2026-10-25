---
id: IMPL-I2-TRACE-001
title: I2 original sixty requirements and twenty-two acceptance family executable trace
phase: 12-implementation-planning
status: accepted
version: 1.0.0
owners: [qa-architect, delivery-lead]
depends_on: [APR-043, APR-042, SRC-007, IMPL-I2-001, IMPL-I1-TRACE-001, DOM-INBOUND-TRACE-001, PLAN-I2-DESIGN-001]
last_reviewed: 2026-10-25
approval: APR-043 Owner backend acceptance; original I1/I2/exclusion classifications retained
supersedes: null
---

# I2 executable requirement trace — original60IDs unchanged

Companion [actual implementation/status/results](I2_IMPLEMENTATION_STATUS.md).
I1 retained means previously accepted behavior with regression obligations, not
new I2 registration/catalogue logic. GOVERNED EXCLUSION is not a claim that device
functionality exists. All other rows describe the bounded backend behavior; actual
pass/fail and independent review status follows the implementation report.
Original business evidence/requiredness/entry actor is not replaced by verification
actor. [APR-043](../00-governance/approved-baselines/APR-043-i2-backend-acceptance.md)
records Owner backend acceptance of b585fd795fb0276bc936af254c6d56fd7e3bcbe8 after
focused evidence verification. No browser workflow, UAT or production deployment
is asserted. All sixty row IDs/classifications remain unchanged: I1-retained rows
identify the accepted original capability and its regression; I2 rows identify
actual receiving behavior; combined families provide executed cross-stage backend
evidence. REQ-INBOUND-025 remains a governed device/ticket exclusion. Purchasing
visibility here is an authorized backend projection, not delivered browser UI.

Executable anchors: [service/parser/query](../../apps/backend/src/modules/procurement/receiving-service.ts),
[Procurement persistence](../../apps/backend/src/infrastructure/postgresql/receiving-store.ts),
[Inventory intake/admission](../../apps/backend/src/modules/inventory/inbound-receiving.ts),
[0018](../../database/migrations/0018_purchase_receiving.sql),
[HTTP/real PostgreSQL cases](../../apps/backend/tests/integration/receiving.test.ts),
[SQL integrity cases](../../apps/backend/tests/integration/receiving-integrity.test.ts),
[parser units](../../apps/backend/tests/unit/receiving.test.ts),
[IPS/genealogy units](../../apps/backend/tests/unit/inventory-inbound-receiving.test.ts),
[projection capacity units](../../apps/backend/tests/unit/receiving-projection.test.ts).
Original accepted [I1 sixty-ID trace](I1_IMPLEMENTATION_TRACE.md) stays historical.
Axx below means I2-Axx unless explicitly labelled I1.

| Original requirement | Implemented bounded behavior / disposition | Source / symbol | Executable family |
| --- | --- | --- | --- |
| REQ-INBOUND-001 | I1 retained | InboundService.record | A01/A22 |
| REQ-INBOUND-002 | I1 retained + actual line links | InboundService.record; ReceivingService.confirm | A03/A07/A22 |
| REQ-INBOUND-003 | I1 zero-stock retained | InboundService.record | A22 + I1 A25 |
| REQ-INBOUND-004 | Multi-arrival/multi-PO | ReceivingService.confirm/query | A01/A02/A18 |
| REQ-INBOUND-005 | I1 reference lookup + exact line verification | InboundService.query; ReceivingService.confirm | A01/A03/A07 |
| REQ-INBOUND-006 | Explicit accepted units only | ReceivingService.confirm | A01/A08/A09 |
| REQ-INBOUND-007 | Exact current/committed counts and remaining/excess | ReceivingService.query; PostgresReceivingStore.counts | A01/A08/A18 |
| REQ-INBOUND-008 | Actual confirmed attributes separate | ReceivingService.confirm/comparison | A06/A07 |
| REQ-INBOUND-009 | Immutable original/actual discrepancy and trusted actor | ReceivingService.confirm;0018 | A06/A07/A19 |
| REQ-INBOUND-010 | Partial delivery is not mismatch | comparison; exact progress | A01/A08 |
| REQ-INBOUND-011 | Independent manually assigned physical codes | parseReceivingInput;0018 code claim | A03/A04 |
| REQ-INBOUND-012 | Real optional PO/line + arrival/doc/origin references | ReceivingAssociation;0018 scoped FKs | A02/A03/A09/A20 |
| REQ-INBOUND-013 | External warehouse receipt raw reference | warehouseReceipts;0018 unique reference | A02/A05/A10 |
| REQ-INBOUND-014 | One envelope/IPS transaction/outcome/audit | ReceivingService.confirm; InventoryInboundReceivingService.receiveMany | A16/A17/A19 |
| REQ-INBOUND-015 | All relevant committed fields/progress to PROC | GetPurchaseOrderReceiving | A01/A14/A15/A21 |
| REQ-INBOUND-016 | Undelivered units never posted/displayed received | counts + explicit accepted-unit sources | A01/A09 |
| REQ-INBOUND-017 | Exact23business fields at correct stages | I1 parser + parseReceivingInput | A10 + I1 field tests |
| REQ-INBOUND-018 | Accepted per-unit declared W1 | receiveMany;typed origin;0018 exact stock predicate | A06/A16/A20 |
| REQ-INBOUND-019 | Mandatory exact shared W2 | parseReceivingInput;inbound_arrival | A02/A10/A12 |
| REQ-INBOUND-020 | Optional W3/no per-unit weight allocation | parseReceivingInput;receiveMany source W1 | A02/A06/A12 |
| REQ-INBOUND-021 | Separate technical/business identities | ReceivingAssociation;code/doc claims;I1 R1 retained | A03/A04/A05/A20 |
| REQ-INBOUND-022 | Manual authorized exceptions/no invented QC/tolerance | ReceivingService.confirm explicit acceptance flags | A08/A09/A13 |
| REQ-INBOUND-023 | Current personal roles/isolation | composition authorization;ReceivingService.current | A14/A15 |
| REQ-INBOUND-024 | Accepted capability regression | legacy duplicate conflict + original replay; root suites | A22 |
| REQ-INBOUND-025 | GOVERNED EXCLUSION: no ticket/device integration | Closed I2 payload/no device dependency | A10/A22 |
| REQ-INBOUND-F01 | I2 receiving implemented: شماره سیستم; YES; Mr. Karimi | units[].internalSystemCode | A03/A04/A10/A21 |
| REQ-INBOUND-F02 | I1 retained; visible original: شماره سفارش; YES; Ms. Masoumi | orderReference / generated R1 key | I1 retained; A01/A14/A22 |
| REQ-INBOUND-F03 | I2 receiving implemented: شماره بارنامه; YES; Mr. Karimi | waybills[].reference + unit.waybillId | A02/A05/A10 |
| REQ-INBOUND-F04 | I2 receiving implemented: شماره بارنامه حواله (برگ زرد); NO; Mr. Karimi | waybills[].yellowCopyReference? | A10/A14 |
| REQ-INBOUND-F05 | I2 receiving implemented: شماره رسید انبار; YES; Mr. Karimi | warehouseReceipts[].reference + unit.receiptId | A02/A05/A10 |
| REQ-INBOUND-F06 | I2 receiving implemented: شماره کامیون; NO; Mr. Karimi | truckNumber? | A10/A14 |
| REQ-INBOUND-F07 | I1 retained; visible original: شماره آیتم; NO; Ms. Masoumi | optional itemNumber; line UUID independent | I1 retained; A01/A14/A22 |
| REQ-INBOUND-F08 | I1 retained; visible original: نوع کالا; YES; Ms. Masoumi | materialTypeOptionId; typed MATERIAL_TYPE FK | I1 retained; A06/A07/A14 |
| REQ-INBOUND-F09 | I1 retained; visible original: عرض; YES; Ms. Masoumi | widthM / width_m_text / assertDimension; m | I1 retained; A06/A07/A14 |
| REQ-INBOUND-F10 | I1 retained; visible original: ضخامت; YES; Ms. Masoumi | thicknessMm / thickness_mm_text / assertDimension; mm | I1 retained; A06/A07/A14 |
| REQ-INBOUND-F11 | I1 retained; visible original: رنگ; NO; Ms. Masoumi | optional colorOptionId; typed COLOR FK | I1 retained; A06/A07/A14 |
| REQ-INBOUND-F12 | I1 retained; visible original: شماره رئال رنگ; NO; Ms. Masoumi | optional independent ralColorNumber | I1 retained; A06/A07/A14 |
| REQ-INBOUND-F13 | I1 retained; visible original: طول; NO; Ms. Masoumi | optional lengthM / length_m_text; m | I1 retained; A06/A07/A14 |
| REQ-INBOUND-F14 | I1 retained; visible original: کیفیت; NO; Ms. Masoumi | optional qualityGradeOptionId; typed QUALITY_GRADE FK | I1 retained; A06/A07/A14 |
| REQ-INBOUND-F15 | I1 retained; visible original: وزن; YES; Ms. Masoumi | unitWeightKg / unit_weight_kg_text; one-unit W1 | I1 retained; A06/A07/A14 |
| REQ-INBOUND-F16 | I1 retained; visible original: تعداد; YES; Ms. Masoumi | orderedUnitCount / ordered_unit_count_text | I1 retained; A01/A14/A22 |
| REQ-INBOUND-F17 | I1 retained; visible original: تاریخ ثبت سفارش; YES; Ms. Masoumi | registrationDateJalali / stored YMD/profile | I1 retained; A01/A14/A22 |
| REQ-INBOUND-F18 | I2 receiving implemented: تاریخ ورود; YES; Mr. Karimi | arrivalDateJalali | A10/A11 |
| REQ-INBOUND-F19 | I2 receiving implemented: شماره محصول; YES; Mr. Karimi | units[].productNumber | A03/A10/A13 |
| REQ-INBOUND-F20 | I2 receiving implemented: شرکت ارسال کننده (مبدا); NO; Mr. Karimi | originatingCompany? | A10/A14 |
| REQ-INBOUND-F21 | I2 receiving implemented: وزن خالص گزارش مبدأ; YES; Mr. Karimi | originNetKg | A02/A10/A12 |
| REQ-INBOUND-F22 | I2 receiving implemented: وزن خالص باسکول مقصد; NO; Mr. Karimi | destinationNetKg? | A02/A10/A12 |
| REQ-INBOUND-F23 | I2 receiving implemented: نام راننده; NO; Mr. Karimi | driverName? | A10/A14 |
| REQ-INBOUND-S01 | I1 normalized reference retained; documents exact separate | I1 sources + ReceivingService / composition /0018 as applicable | A05/A22 |
| REQ-INBOUND-S02 | Exact original/actual m/mm/m values | I1 sources + ReceivingService / composition /0018 as applicable | A06/A07 |
| REQ-INBOUND-S03 | I1 purchase date retained; separately approved arrival profile | I1 sources + ReceivingService / composition /0018 as applicable | A11/A22 |
| REQ-INBOUND-S04 | Three reusable catalogues retained | I1 sources + ReceivingService / composition /0018 as applicable | A13/A22 |
| REQ-INBOUND-S05 | PROC catalogue selection/creation retained | I1 sources + ReceivingService / composition /0018 as applicable | A13/A22 + I1 A10 |
| REQ-INBOUND-S06 | WH catalogue additions reused in receiving | I1 sources + ReceivingService / composition /0018 as applicable | A13 |
| REQ-INBOUND-S07 | Scope/current grants for both roles | I1 sources + ReceivingService / composition /0018 as applicable | A13/A15 |
| REQ-INBOUND-S08 | Immutable exact catalogue history/concurrency retained | I1 sources + ReceivingService / composition /0018 as applicable | A13/A22 + I1 A12 |
| REQ-INBOUND-S09 | WH manual unordered receipt, no original-order modification or PROC posting | I1 sources + ReceivingService / composition /0018 as applicable | A08/A09/A15 |
| REQ-INBOUND-S10 | Finite supported technical classification/no OTHER fallback | I1 sources + ReceivingService / composition /0018 as applicable | A13 |
| REQ-INBOUND-S11 | Immutable originals; separate actual/provenance | I1 sources + ReceivingService / composition /0018 as applicable | A06/A07/A19 |
| REQ-INBOUND-S12 | Complete secure PROC/WH current reads | I1 sources + ReceivingService / composition /0018 as applicable | A14/A15/A21 |

## Twenty-two acceptance families: executable lookup

Each row names an observable assertion, not a standalone count. Combined scenario
titles can cover several families. Full-run and focused-only distinct results are
reported separately in the implementation status; do not add reruns to totals.

| Family | Observable executable assertion | Test surface |
| --- | --- | --- |
| I2-A01 | 5 ordered /3 received /6000kg /2 outstanding and later arrival | receiving.test.ts |
| I2-A02 | Shared multi-PO consignment, documents and one W2/W3 | receiving.test.ts |
| I2-A03 | Independent labelled units; new SHEET same opaque product number | receiving.test.ts |
| I2-A04 | New/new, legacy/new, legacy/legacy code races and historical claims | receiving.test.ts |
| I2-A05 | Independent exact code/document namespaces, PO R1 retained | receiving.test.ts |
| I2-A06 | WH changed accepted W1 with original W1 retained | receiving.test.ts |
| I2-A07 | Actual/original fields, optional observed/absent/not-recorded comparison | receiving.test.ts |
| I2-A08 | Manual mismatch/excess and stale progress conflict | receiving.test.ts |
| I2-A09 | ORDER_ONLY and UNLINKED without invented order lines | receiving.test.ts |
| I2-A10 | All11field6/5mapping; missing optional does not block | receiving.test.ts |
| I2-A11 | Accepted finite Jalali profile and invalid-date rejection | receiving.test.ts |
| I2-A12 | Exact consignment decimal lexemes and no per-unit allocation | receiving.test.ts |
| I2-A13 | WH catalogue reuse, supported category/no OTHER, SHEET distinction | receiving.test.ts |
| I2-A14 | PROC complete related fields including driver; no sibling disclosure | receiving.test.ts |
| I2-A15 | Role/isolation/forgery/current grants/expiry and revocation during lock wait | receiving.test.ts |
| I2-A16 | 129/257units; full-set locks, one TX and late-chunk rollback | receiving.test.ts |
| I2-A17 | Audit failure, durable replay/binding, process kill and unknown COMMIT | receiving.test.ts |
| I2-A18 | Multi-PO reverse locks, code/doc races, stale intent and timeout retry | receiving.test.ts |
| I2-A19 | Real SQL constraints/privileges/deferred/source-stock integrity | receiving-integrity.test.ts |
| I2-A20 | Typed accepted-W1 source-backed UNIT/LOT genealogy and isolation | receiving.test.ts + inventory-inbound-receiving.test.ts |
| I2-A21 | Unicode/bytes, large evidence preflight and complete keyset pagination | receiving.test.ts + receiving-projection.test.ts |
| I2-A22 | I1/legacy and all impacted accepted backend regressions | receiving.test.ts + canonical integration runner / legacy receipt.test.ts |
