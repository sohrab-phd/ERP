---
id: GOV-STATES-001
title: Status and State Transition Catalogue
phase: 00-governance
status: approved
version: 0.3.0
owners: [domain-leads, chief-solution-architect]
depends_on: [ASM-REPORT-001, GOV-DOMAIN-001, SM-CATALOGUE-001, APR-005]
last_reviewed: 2026-09-06
approval: APR-005
supersedes: null
---

# Status and State Transition Catalogue

APR-002 approved the Phase 00 seed. The current version is approved as
APR-005 because Phase 03 added the remaining conceptual machines. Detailed transitions, guards,
actors, effects, events, and rejections live in
[STATE_MACHINE_CATALOGUE.md](../../03-state-machines-invariants/STATE_MACHINE_CATALOGUE.md)
and
[TRANSITION_TABLES.md](../../03-state-machines-invariants/TRANSITION_TABLES.md).
This register keeps the short seed list only.

These are not executable machines. Open OQ guards remain unanswered.

## Seed paths

- `SM-INQUIRY`: `OPEN → QUOTED → CONVERTED` (branches: CANCELLED, EXPIRED)
- `SM-QUOTATION`: `DRAFT → ISSUED → ACCEPTED` (REJECTED, EXPIRED, SUPERSEDED)
- `SM-FULFILLMENT-ASSESSMENT`: `DRAFT → RECORDED` (STOCK / PURCHASE / MAKE /
  NOT_FEASIBLE)
- `SM-SALES-ORDER`: `DRAFT → SUBMITTED → CONFIRMED → PARTIALLY_FULFILLED → FULFILLED → CLOSED` (`IN_PRODUCTION` only on MAKE; ON_HOLD, CANCEL_PENDING → CANCELLED)
- `SM-UNFULFILLED-DEMAND`: `RECORDED → REVIEWED → CLOSED` (REOPENED_AS_INQUIRY)
- `SM-PURCHASE-ORDER`: `DRAFT → SUBMITTED → APPROVED → SENT → PARTIALLY_RECEIVED → RECEIVED → CLOSED` (ON_HOLD, CANCELLED)
- `SM-GOODS-RECEIPT`: `DRAFT → RECEIVED → QC_HOLD → POSTED` (posted cancel = reversal)
- `SM-RESERVATION`: `REQUESTED → ACTIVE → CONSUMED` (RELEASED, EXPIRED)
- `SM-INVENTORY-UNIT`: `PENDING_QC → AVAILABLE → RESERVED → ISSUED_TO_PRODUCTION → PARTIALLY_CONSUMED|CONSUMED` (MAKE may issue from AVAILABLE after Allocation; QUARANTINED, PACKED, SHIPPED, RETURNED, SCRAPPED, CLOSED)
- `SM-MATERIAL-ALLOCATION`: `PLANNED → ASSIGNED → ISSUED` (RELEASED)
- `SM-PRODUCTION-ORDER`: `DRAFT → PLANNED → RELEASED → IN_PROGRESS → PARTIALLY_COMPLETED|COMPLETED → CLOSED` (PAUSED resumes to prior live; ON_HOLD, CANCELLED, ABORTED)
- `SM-PRODUCTION-OPERATION`: `PLANNED → IN_PROGRESS → COMPLETED` (SKIPPED, REWORK)
- `SM-RESIDUAL`: `FACT_RECORDED → UNIT_CREATED → AVAILABLE_OR_QUARANTINE` (BELOW_THRESHOLD_TO_SCRAP)
- `SM-SCRAP`: `FACT_RECORDED → STOCK_POSTED → CLOSED`
- `SM-QUALITY-INSPECTION`: `PLANNED → IN_PROGRESS → COMPLETED → ACCEPTED|REJECTED|CONDITIONAL|QUARANTINED`
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
