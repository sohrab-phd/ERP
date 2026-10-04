---
id: GOV-STATES-001
title: Status and State Transition Catalogue
phase: 00-governance
status: in_review
version: 0.6.0
owners: [domain-leads, chief-solution-architect]
depends_on: [ASM-REPORT-001, GOV-DOMAIN-001, SM-CATALOGUE-001, APR-005]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Status and State Transition Catalogue

## Current evidence precedence (2026-10-04)

APR-005 remains historical structure-approval evidence; this technical revision
is made under delegated ADR-0012 authority and does not approve a new baseline.
Live OQ-009/factory evidence supersedes automatic numeric Residual/Scrap
classification: a person decides reusability; recording and authority stay open.
OQ-006 is fulfillment tolerance only. Production mass-balance/process-loss
policy remains open under production evidence/OQ-009 and must not inherit its
zero default. Missing required later-slice policy stays GUARD_OPEN_POLICY.
Quality is future-only; portal MVP is isolated visibility-only; personal
operator accounts apply. OQ answers/statuses are unchanged. Older draft/seed,
RACI and historical handoff wording cannot override these live facts.


APR-002 approved the Phase 00 seed. APR-005 approved the historical structure after Phase 03 added the remaining
conceptual machines. This current technical reconciliation is not human-approved. Detailed transitions, guards,
actors, effects, events, and rejections live in
[STATE_MACHINE_CATALOGUE.md](../../03-state-machines-invariants/STATE_MACHINE_CATALOGUE.md)
and
[TRANSITION_TABLES.md](../../03-state-machines-invariants/TRANSITION_TABLES.md).
This register keeps the short seed list only.

These are not executable machines. Open OQ guards remain unanswered.
QC paths below are future-only under OQ-005. They are not mandatory
current-MVP paths. For valid normal stock-in, `ACT-IPS` creates the
resulting Inventory Unit as `AVAILABLE` in the posting transaction;
normal use may begin after commit, subject to existing guards (INV-003).
This is current-MVP architecture reconciliation, not a factory quote.

## Seed paths

- `SM-INQUIRY`: `OPEN → QUOTED → CONVERTED` (branches: CANCELLED, EXPIRED)
- `SM-QUOTATION`: `DRAFT → ISSUED → ACCEPTED` (REJECTED, EXPIRED, SUPERSEDED)
- `SM-FULFILLMENT-ASSESSMENT`: `DRAFT → RECORDED` (STOCK / PURCHASE / MAKE /
  NOT_FEASIBLE)
- `SM-SALES-ORDER`: `DRAFT → SUBMITTED → CONFIRMED → PARTIALLY_FULFILLED → FULFILLED → CLOSED` (`IN_PRODUCTION` only on MAKE; ON_HOLD; CANCEL_PENDING → CANCELLED → optional CLOSED). Close also from `PARTIALLY_FULFILLED` with authorized Unfulfilled Demand. `FULFILLED` means remaining valid demand is already zero within OQ-006. Payment and shipment `DELIVERED` are not close guards (OQ-007).
- `SM-UNFULFILLED-DEMAND`: `RECORDED → REVIEWED → CLOSED` (REOPENED_AS_INQUIRY)
- `SM-PURCHASE-ORDER`: `DRAFT → SUBMITTED → APPROVED → SENT → PARTIALLY_RECEIVED → RECEIVED → CLOSED` (ON_HOLD, CANCELLED)
- `SM-GOODS-RECEIPT`: current `DRAFT → RECEIVED → POSTED`; `QC_HOLD` is a future Quality branch (posted cancel = reversal)
- `SM-RESERVATION`: `REQUESTED → ACTIVE → CONSUMED` (RELEASED, EXPIRED). At most one `ACTIVE` per Inventory Unit (OQ-008). EXPIRED is orphan sweep only.
- `SM-INVENTORY-UNIT`: current normal stock-in `(none) → AVAILABLE` on valid committed `ACT-IPS` posting; historical/future Quality path `PENDING_QC → AVAILABLE` is not a current-MVP prerequisite. From `AVAILABLE`: `RESERVED → ISSUED_TO_PRODUCTION → PARTIALLY_CONSUMED|CONSUMED` (MAKE may issue after Allocation; `QUARANTINED` future only; PACKED, SHIPPED, RETURNED, SCRAPPED, CLOSED retained)
- `SM-MATERIAL-ALLOCATION`: `PLANNED → ASSIGNED → ISSUED` (RELEASED)
- `SM-PRODUCTION-ORDER`: `DRAFT → PLANNED → RELEASED → IN_PROGRESS → PARTIALLY_COMPLETED|COMPLETED → CLOSED` (PAUSED resumes to prior live; ON_HOLD, CANCELLED, ABORTED)
- `SM-PRODUCTION-OPERATION`: `PLANNED → IN_PROGRESS → COMPLETED` (SKIPPED, REWORK)
- `SM-RESIDUAL`: current reusable path `FACT_RECORDED → UNIT_CREATED` with resulting Inventory Unit `AVAILABLE` on valid commit; `UNIT_CREATED → AVAILABLE_OR_QUARANTINE` is a historical/future placement/QC branch, not a current availability gate (`BELOW_THRESHOLD_TO_SCRAP` is a historical superseded numeric-branch proposal, not executable current MVP; human disposition recording/authority remains OQ-009)
- `SM-SCRAP`: `FACT_RECORDED → STOCK_POSTED → CLOSED`
- `SM-QUALITY-INSPECTION` (**future only**): `PLANNED → IN_PROGRESS → COMPLETED → ACCEPTED|REJECTED|CONDITIONAL|QUARANTINED`
- `SM-PACKAGE`: `DRAFT → PACKED → ASSIGNED_TO_SHIPMENT` (UNPACKED)
- `SM-SHIPMENT`: `DRAFT → READY → LOADING → DISPATCHED → PARTIALLY_DELIVERED|DELIVERED → CLOSED`
- `SM-INVOICE`: `DRAFT → ISSUED → PARTIALLY_PAID → PAID → CLOSED` (OVERDUE, VOID_PENDING → VOIDED)
- `SM-PAYMENT`: `RECEIVED → ALLOCATED → CLOSED` (UNALLOCATED, REVERSED)

## Phase 03 completion requirement

Each transition must specify source state, target state, command, actor,
authorization, guard, transaction effects, emitted events, rejected behavior,
idempotency, correction path, and linked invariants. Phase 03 drafts those
fields with open OQ guards. It links `INV-*` and `REQ-OBJ-*`. Detailed
`REQ-*` and `TEST-*` IDs are later-phase work (FIND-028). It does not invent
numeric policy.
