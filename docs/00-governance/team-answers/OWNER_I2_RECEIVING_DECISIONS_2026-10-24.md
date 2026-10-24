---
id: SRC-007
title: Subsequent authoritative Owner I2 receiving business decisions
phase: 12-implementation-planning
status: recorded
version: 1.0.0
owners: [project-sponsor, business-process-owner]
depends_on: [GOV-SOURCES-001, SRC-004, SRC-005, SRC-006, APR-039]
last_reviewed: 2026-10-24
approval: Actual Owner message ERP I2 Owner Decisions and Bounded Implementation Design; business answers only
supersedes: null
---

# SRC-007 — New Owner answers, not earlier factory-visit evidence

Provenance: actual Owner instruction **ERP — I2 Owner Decisions and Bounded
Implementation Design**, recorded2026-10-24, after accepted I1/APR-039. The Owner
answers all ten rows of [the I2 questionnaire](../../12-implementation-planning/I2_BUSINESS_DECISIONS_FA.md).
These answers supersede corresponding unanswered business portions only. They do
not retroactively change SRC-004–006, original25rules,23fields or S01–S12.
Twelve backend capabilities remain Owner accepted; I2 is not implemented/accepted.

| Decision / source anchor | Authoritative answer and exact boundary |
| --- | --- |
| SRC-007-B02 | Karimi manually assigns each individually received physical unit's Internal System Code and physically labels it for future production traceability. Codes must be unique; Owner states historical physical codes are also unique. Reject duplicate codes understandably. ERP does not generate this business code. Reconcile legacy nonunique technical behavior with safe historical and cross-path/concurrent protection, without rewriting history or breaking standalone receiving. |
| SRC-007-B03 | Product number is separately stored per physical unit; preserve entered value. No additional operational processing or global uniqueness. It is not purchase item number, Internal System Code or SHEET productCode. |
| SRC-007-B01 | Waybill numbers and external warehouse receipt numbers are unique separate business identifiers. Preserve externally supplied receipt numbers; do not generate them or automatically apply PO R1 equivalence. |
| SRC-007-B04 | One truck/waybill may carry several POs. One warehouse receipt number cannot span separate arrival events. A PO may span many arrivals. Use one shared physical arrival/consignment with scoped associations; W2/W3 are whole-consignment evidence, not separate per-PO measurements or unit allocations. |
| SRC-007-B05 | Karimi personally may approve accepted per-unit W1 differing from original order; Masoumi approval is not required. Preserve original and actual accepted W1, trusted approving actor and provenance. No original I1 overwrite, tolerance or automatic adjustment. |
| SRC-007-B06 | Karimi has final manual receiving-acceptance authority for mismatched, excess and originally unordered goods. Record actual observations, original/actual differences, explicit acceptance, trusted actor and provenance. No automatic acceptance. Preserve no-PO standalone receiving; do not invent/amend a PO to accommodate unexpected goods. All stock remains IPS-owned. |
| SRC-007-B07 | Arrival/receiving date is Jalali. W2 and W3 are kg; preserve the precision actually supplied by documents. W2 mandatory, W3 optional. Reuse I1 calendar handling only where compatible. W2/W3 are not constrained by W1's whole-integer rule, never rounded or allocated to unit W1. |
| SRC-007-B08 | After committed receiving and stock update, current authorized organizational ACT-PROC can see ALL recorded purchasing and receiving fields for relevant authorized orders, including driver fields. No automatic SEC/unrelated access. Shared multi-PO projections must not disclose unrelated PO/unit cargo. |
| SRC-007-B09 | Karimi verifies/corrects actual received information, completes arrival fields and confirms receiving. Missing optional fields do not block inventory; mandatory values must be valid at confirmation. This is not modification of I1 originals or approval of an incomplete-mandatory draft workflow. Isolate only a concrete missing-mandatory residual if it actually blocks a design branch. |
| SRC-007-D10 | No separate business material-classification workflow is required. Business Material Type identifies category; actual factory types are limited and known. Reconcile with supported Inventory kinds without a new approval role/master-data platform/automatic OTHER. Report a precise unsupported legitimate type and minimal safe resolution. No concrete factory type list or new technical enum values are supplied in this message. |

## Authorization and reconciliation boundary

Authorized now: record source/decision dispositions, one focused code-informed I2
design, bounded implementation-authorization DRAFT, focused architecture/database/
security review, documentation checks and optional local documentation commit.
No source/test implementation, executable migration/contract/permission, gate/unlock
change, I2 execution or push. Proposed mechanisms/capacities below are not accepted
technical decisions merely because these business answers are authoritative.

Preserve twelve accepted capabilities, original I1 facts, independent physical
units and accepted W1, shared W2/W3, partial progress, current personal grants,
atomic owner transactions, durable replay/audit and source-backed genealogy.
No QC, financial effects, device integration, UI, post-post corrections or automatic
order closure. Do not repeat Step1/2 or I1 design reviews.

Historical-code data verification, exact identifier comparison, additive origin
contracts, precise capacities and safe projections are implementation/design
obligations, not a reason to ask these ten answered questions again. Minimum
custody/after-post operational procedures not explicitly answered remain deferred
operating details, not a fabricated prerequisite or draft-state requirement for
valid, complete, manually confirmed matched receiving.
