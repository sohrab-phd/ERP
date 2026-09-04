---
id: GOV-STATES-001
title: Status and State Transition Catalogue
phase: 00-governance
status: approved
version: 0.1.0
owners: [domain-leads, chief-solution-architect]
depends_on: [ASM-REPORT-001, GOV-DOMAIN-001]
last_reviewed: 2026-09-04
approval: APR-002
supersedes: null
---

# Status and State Transition Catalogue

These assimilation-level lifecycles are proposed inputs to Phase 03. They are not
approved executable state machines until guards, actors, effects, events,
rejections, and corrections are validated.

## SM-SALES-ORDER

`DRAFT → SUBMITTED → CONFIRMED → IN_PRODUCTION → PARTIALLY_FULFILLED → FULFILLED → CLOSED`

Branches: `ON_HOLD`, `CANCEL_PENDING → CANCELLED`

Open dependencies: OQ-006, OQ-007, OQ-008

## SM-PURCHASE-ORDER

`DRAFT → SUBMITTED → APPROVED → SENT → PARTIALLY_RECEIVED → RECEIVED → CLOSED`

Branches: `ON_HOLD`, `CANCELLED`

## SM-GOODS-RECEIPT

`DRAFT → RECEIVED → QC_HOLD → POSTED`

Posted cancellation requires reversal rather than direct regression.

## SM-PRODUCTION-ORDER

`DRAFT → PLANNED → RELEASED → IN_PROGRESS → PARTIALLY_COMPLETED|COMPLETED → CLOSED`

Branches: `PAUSED`, `ON_HOLD`, `CANCELLED`, `ABORTED`

Open dependencies: OQ-003, OQ-005, OQ-009

## SM-INVENTORY-UNIT

`PENDING_QC → AVAILABLE → RESERVED → ISSUED_TO_PRODUCTION → PARTIALLY_CONSUMED|CONSUMED`

Additional states: `QUARANTINED`, `PACKED`, `SHIPPED`, `RETURNED`, `SCRAPPED`,
`CLOSED`

Open dependencies: OQ-001, OQ-002, OQ-005, OQ-008

## SM-QUALITY-INSPECTION

`PLANNED → IN_PROGRESS → COMPLETED → ACCEPTED|REJECTED|CONDITIONAL|QUARANTINED`

Open dependency: OQ-005

## SM-SHIPMENT

`DRAFT → READY → LOADING → DISPATCHED → PARTIALLY_DELIVERED|DELIVERED → CLOSED`

Open dependency: OQ-006

## SM-INVOICE

`DRAFT → ISSUED → PARTIALLY_PAID → PAID → CLOSED`

Branches: `OVERDUE`, `VOID_PENDING → VOIDED`

Open dependencies: OQ-007, OQ-012

## Phase 03 completion requirement

Each transition must specify source state, target state, command, actor,
authorization, guard, transaction effects, emitted events, rejected behavior,
idempotency, correction path, and linked requirements/invariants/tests.
