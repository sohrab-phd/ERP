---
id: DOM-INBOUND-TRACE-001
title: Accepted purchase and receiving requirement traceability
phase: 12-implementation-planning
status: accepted
version: 0.2.0
owners: [business-process-owner, delivery-lead]
depends_on: [SRC-004, DOM-INBOUND-REQ-001, DOM-INBOUND-FIELDS-001, DOM-INBOUND-RECON-001]
last_reviewed: 2026-10-20
approval: APR-032
supersedes: null
---

# Requirements trace — all factory fields and confirmed workflow rules

Step 1 is accepted as requirements input by [APR-032](../00-governance/approved-baselines/APR-032-inbound-gap-analysis.md).
All trace rows remain unchanged. The [Step 2 implementation matrix](../12-implementation-planning/PURCHASE_RECEIVING_COVERAGE_MATRIX.md)
adds verified code/gap/decision/test mapping; it does not approve runtime changes.

Source is the Owner message recorded as [SRC-004](../00-governance/team-answers/FACTORY_PURCHASE_RECEIVING_2026-10-20.md).
[Baseline rule IDs](PURCHASE_RECEIVING_REQUIREMENTS_BASELINE.md) and
[field IDs](PURCHASE_RECEIVING_FIELD_REGISTER.md) are stable accepted requirement
identifiers; they are not runtime contracts, approved invariants or fabricated
TEST IDs. This matrix provides later acceptance/test intent only, not executed
tests. [C/Q references](PURCHASE_RECEIVING_RECONCILIATION.md) identify unresolved
architecture and policy; no requirement disappears merely because it is blocked.

## Every factory field

All field rows also trace to REQ-INBOUND-017. Requiredness and actor are repeated
here for mechanical cross-checking against the source and dictionary.

| Field requirement | No. | Persian label | Required | Entry actor | Workflow rule link | Later verification intent / unresolved dependency |
| --- | --- | --- | --- | --- | --- | --- |
| REQ-INBOUND-F01 | 1 | شماره سیستم | YES | Mr. Karimi | REQ-INBOUND-011, REQ-INBOUND-012, REQ-INBOUND-021 | Distinguish each physical unit and retain origin; C4/Q1/Q3 |
| REQ-INBOUND-F02 | 2 | شماره سفارش | YES | Ms. Masoumi | REQ-INBOUND-001, REQ-INBOUND-004, REQ-INBOUND-005, REQ-INBOUND-021 | Seller reference lookup across arrivals, approved namespace; Q1 |
| REQ-INBOUND-F03 | 3 | شماره بارنامه | YES | Mr. Karimi | REQ-INBOUND-004, REQ-INBOUND-012 | Separate arrivals with same PO do not duplicate; Q1/Q3 |
| REQ-INBOUND-F04 | 4 | شماره بارنامه حواله (برگ زرد) | NO | Mr. Karimi | REQ-INBOUND-012 | Optional yellow-copy reference preserves relation; Q3 |
| REQ-INBOUND-F05 | 5 | شماره رسید انبار | YES | Mr. Karimi | REQ-INBOUND-013, REQ-INBOUND-021 | Accept existing business document, never substitute UUID/generation; Q1/Q3 |
| REQ-INBOUND-F06 | 6 | شماره کامیون | NO | Mr. Karimi | REQ-INBOUND-004, REQ-INBOUND-012 | Optional arrival context only; Q6/Q7 |
| REQ-INBOUND-F07 | 7 | شماره آیتم | NO | Ms. Masoumi | REQ-INBOUND-002, REQ-INBOUND-005, REQ-INBOUND-021 | Optional business number does not lose line binding; Q6 |
| REQ-INBOUND-F08 | 8 | نوع کالا | YES | Ms. Masoumi | REQ-INBOUND-002, REQ-INBOUND-008, REQ-INBOUND-009 | Ordered/actual material type preserved; Q5/Q6 |
| REQ-INBOUND-F09 | 9 | عرض | YES | Ms. Masoumi | REQ-INBOUND-002, REQ-INBOUND-008, REQ-INBOUND-009 | Width comparison in approved units, no default; Q6 |
| REQ-INBOUND-F10 | 10 | ضخامت | YES | Ms. Masoumi | REQ-INBOUND-002, REQ-INBOUND-008, REQ-INBOUND-009 | Thickness comparison without invented tolerance; Q6 |
| REQ-INBOUND-F11 | 11 | رنگ | NO | Ms. Masoumi | REQ-INBOUND-002, REQ-INBOUND-008, REQ-INBOUND-009 | Optional color/original/actual evidence; Q5/Q6 |
| REQ-INBOUND-F12 | 12 | شماره رئال رنگ | NO | Ms. Masoumi | REQ-INBOUND-002, REQ-INBOUND-008, REQ-INBOUND-009 | Optional RAL with no invented pattern/dependency; Q6 |
| REQ-INBOUND-F13 | 13 | طول | NO | Ms. Masoumi | REQ-INBOUND-002, REQ-INBOUND-008, REQ-INBOUND-009 | Optional length not stock quantity; Q6 |
| REQ-INBOUND-F14 | 14 | کیفیت | NO | Ms. Masoumi | REQ-INBOUND-002, REQ-INBOUND-009, REQ-INBOUND-022 | Grade descriptor does not activate QC; Q6 |
| REQ-INBOUND-F15 | 15 | وزن | YES | Ms. Masoumi | REQ-INBOUND-002, REQ-INBOUND-008, REQ-INBOUND-018 | One-unit W1, original/accepted separate, stock basis; C3/Q4 |
| REQ-INBOUND-F16 | 16 | تعداد | YES | Ms. Masoumi | REQ-INBOUND-002, REQ-INBOUND-006, REQ-INBOUND-007, REQ-INBOUND-010 | Ordered vs per-arrival/cumulative/outstanding counts, partial not mismatch; Q5 |
| REQ-INBOUND-F17 | 17 | تاریخ ثبت سفارش | YES | Ms. Masoumi | REQ-INBOUND-001 | Registration date independent from arrival/posting; Q6 |
| REQ-INBOUND-F18 | 18 | تاریخ ورود | YES | Mr. Karimi | REQ-INBOUND-004, REQ-INBOUND-012 | Actual arrival date per consignment; Q6 |
| REQ-INBOUND-F19 | 19 | شماره محصول | YES | Mr. Karimi | REQ-INBOUND-021 | Separate product meaning/cardinality, no silent Sheet-code alias; C6/Q2 |
| REQ-INBOUND-F20 | 20 | شرکت ارسال کننده (مبدا) | NO | Mr. Karimi | REQ-INBOUND-012 | Optional originating company not assumed seller; Q6 |
| REQ-INBOUND-F21 | 21 | وزن خالص گزارش مبدأ | YES | Mr. Karimi | REQ-INBOUND-019, REQ-INBOUND-020 | Driver-waybill net for this consignment, never whole PO or unit allocation; Q6/Q8 |
| REQ-INBOUND-F22 | 22 | وزن خالص باسکول مقصد | NO | Mr. Karimi | REQ-INBOUND-020, REQ-INBOUND-022 | Optional destination full-consignment net; absence valid, no allocation/tolerance; Q6 |
| REQ-INBOUND-F23 | 23 | نام راننده | NO | Mr. Karimi | REQ-INBOUND-012, REQ-INBOUND-023 | Optional driver evidence with scoped visibility; Q7 |

## Every confirmed workflow rule

| Requirement | Source / baseline evidence | Later acceptance intent | Impact/question reference |
| --- | --- | --- | --- |
| REQ-INBOUND-001 | SRC-004 process 1; Owner §1 A | Register seller PO/date before arrival | C1/Q1 |
| REQ-INBOUND-002 | SRC-004 process 1 and fields 7–17; Owner §1 A/§2 | Multiple distinct lines/specs/count/W1 retained | C1/Q6 |
| REQ-INBOUND-003 | SRC-004 process 1; Owner §1 A | Order registration has zero stock effect | C1/C3 |
| REQ-INBOUND-004 | SRC-004 process 2; Owner §1 B/§6 | Same PO across different truck arrivals/waybills | C2/C5/Q3 |
| REQ-INBOUND-005 | SRC-004 process 2; Owner §1 B | Waybill PO lookup shows original line/spec evidence | C1/C8/Q1/Q8 |
| REQ-INBOUND-006 | SRC-004 process 2/6; Owner §1 B/D/§6 | Only actually received units confirmed; remainder unposted | C2/C5/Q5 |
| REQ-INBOUND-007 | SRC-004 process 2/6; Owner §6 | Current/prior/cumulative/outstanding retained without replay double count | C5/Q5/Q11 |
| REQ-INBOUND-008 | SRC-004 process 3; Owner §1 C/§7 | Confirmed actual physical attributes govern accepted inventory record | C3/C7/Q4/Q5 |
| REQ-INBOUND-009 | SRC-004 process 3; Owner §7 | Immutable original/actual history, actor/links, persistent indicator | C7/Q5/Q11 |
| REQ-INBOUND-010 | SRC-004 process 3; Owner §1 C/§7 | Partial delivery alone does not flag specification mismatch | C5/C7 |
| REQ-INBOUND-011 | SRC-004 process 4; Owner §4 | Identical coils still have independently distinct physical codes | C4/Q1/Q3 |
| REQ-INBOUND-012 | SRC-004 process 4/6; Owner §1 D/§4 | Trace each unit to PO/line/arrival/waybill/receipt | C2/C9/Q3 |
| REQ-INBOUND-013 | SRC-004 process 5; Owner §5 | Existing receipt reference distinct from generated UUID/key | C5/Q1/Q3 |
| REQ-INBOUND-014 | SRC-004 process 6; Owner §1 D/§3 | Accepted receipt/units/stock/audit/outcome remain atomic through IPS | C2/C3/Q11 |
| REQ-INBOUND-015 | SRC-004 process 6; Owner §1 E | Masoumi sees committed per-PO receipts/progress/discrepancies | C8/Q7 |
| REQ-INBOUND-016 | SRC-004 process 6; Owner §1 E | No ordered-only units shown as received; no existing UI claimed | C8 |
| REQ-INBOUND-017 | SRC-004 exact 23-field register; Owner §2 | All 23 rows/requiredness/actors/stages preserved, no extra business field | Dictionary counts |
| REQ-INBOUND-018 | SRC-004 W1; Owner §2.1/§3 | Accepted per-unit stock weight without destination unit weighing | C3/Q4 |
| REQ-INBOUND-019 | SRC-004 W2; Owner §3 | W2 mandatory per-waybill consignment net | C10/Q6/Q8 |
| REQ-INBOUND-020 | SRC-004 W2/W3; Owner §3 | W3 optional; aggregates independent, no per-unit distribution/replacement | C3/C10 |
| REQ-INBOUND-021 | SRC-004 process 4/5; Owner §4–5 | Business/technical identities remain distinct; no guessed namespaces | C4/C5/C6/Q1/Q2 |
| REQ-INBOUND-022 | SRC-004 process 3 and weights; Owner §1 C/§3/§6–7 | No fabricated tolerance/extras/rejection/QC/remediation effect | C7/Q5/Q10 |
| REQ-INBOUND-023 | SRC-004 field totals/authority; Owner §2/§8 | Personal current grants; no name hardcoding or inferred privileges | C8/Q7 |
| REQ-INBOUND-024 | SRC-004 authority limits; Owner §8 | Accepted purchasing/intake, no-ticket/no-PO paths preserved | C1/C5/Q9 |
| REQ-INBOUND-025 | SRC-004 authority limits; Owner §8 | Individual F01–F08 reassessment, no device/ticket implementation | C10/F reassessment |

Coverage target for this documentation step: 23 field requirements + 25 workflow
requirements, each sourced and mapped. Later test cases must reference these IDs
after the relevant policy/architecture is reconciled and implementation authorized.
No trace row means functionality or tests already exist.
