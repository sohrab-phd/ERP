---
id: SM-CATALOGUE-001
title: State Machine Catalogue
phase: 03-state-machines-invariants
status: approved
version: 0.3.0
owners: [chief-solution-architect, domain-leads]
depends_on: [GOV-STATES-001, SM-INV-001, DOM-ACTORS-001, APR-004, APR-005]
last_reviewed: 2026-09-06
approval: APR-005
supersedes: null
---

# State Machine Catalogue

Proposed lifecycle structure for Phase 03. Seeds come from GOV-STATES-001 and
Phase 02 concepts that had no SM-* yet. These are **not** executable machines.
Guards that need a team answer stay open.

Actor IDs are roles from DOM-ACTORS-001. Temporary roster names are not
actors and cannot authorize a transition.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Convention

Each machine lists: write owner, happy path, branches, command/actor sketch,
invariants, and open guards. Per-transition command, actor, guard, effect,
event, and rejection rows live in
[TRANSITION_TABLES.md](TRANSITION_TABLES.md). Those rows do not invent
OQ-owned values.

Rejection default: if a guard fails, the source state is unchanged and the
command is rejected with a reason. Posted states use reversal, not delete
(INV-005).

## SM-INQUIRY

- Concept: TERM-002 / ENT-INQUIRY
- Write owner: `BC-SALES`
- Happy path: `OPEN → QUOTED → CONVERTED`
- Branches: `CANCELLED`, `EXPIRED`
- Commands / actors: ACT-SALES records and converts; ACT-CUST is never A/R
- Invariants: INV-013, INV-020
- Open guards: portal request channel (OQ-010)

## SM-QUOTATION

- Concept: TERM-020 / ENT-QUOTATION
- Write owner: `BC-SALES`
- Happy path: `DRAFT → ISSUED → ACCEPTED`
- Branches: `REJECTED`, `EXPIRED`, `SUPERSEDED`
- Commands / actors: ACT-SALES
- Invariants: INV-014
- Open guards: snapshot contents are proposed (ASM-012), not a signed matrix

## SM-FULFILLMENT-ASSESSMENT

- Concept: TERM-004 / ENT-FULFILLMENT-ASSESSMENT
- Write owner: `BC-SALES`
- Happy path: `DRAFT → RECORDED`
- Outcomes on the recorded fact: `STOCK`, `PURCHASE`, `MAKE`, `NOT_FEASIBLE`
- Commands / actors: ACT-SALES; Inventory availability is a read, not a write
- Invariants: INV-003, INV-013
- Open guards: none numeric; `NOT_FEASIBLE` must create SM-UNFULFILLED-DEMAND

## SM-SALES-ORDER

- Seed: GOV-STATES-001
- Write owner: `BC-SALES`
- Happy path: `DRAFT → SUBMITTED → CONFIRMED → PARTIALLY_FULFILLED → FULFILLED → CLOSED`
- MAKE-only extra state: `IN_PRODUCTION` between `CONFIRMED` and fulfillment. STOCK and PURCHASE paths do not require it.
- Branches: `ON_HOLD`, `CANCEL_PENDING → CANCELLED`
- Commands / actors: ACT-SALES; hold/cancel after confirm requires SalesOrderChange, not regression to Draft
- Invariants: INV-013, INV-014
- Open guards: partial-fulfillment limits (OQ-006); closure = delivery, payment, or both (OQ-007); reservation interaction (OQ-008)

## SM-UNFULFILLED-DEMAND

- Concept: TERM-005 / ENT-UNFULFILLED-DEMAND
- Write owner: `BC-SALES`
- Happy path: `RECORDED → REVIEWED → CLOSED`
- Branches: `REOPENED_AS_INQUIRY`
- Commands / actors: ACT-SALES
- Invariants: INV-013
- Open guards: none numeric; must not require a Sales Order

## SM-PURCHASE-ORDER

- Seed: GOV-STATES-001
- Write owner: `BC-PROCUREMENT`
- Happy path: `DRAFT → SUBMITTED → APPROVED → SENT → PARTIALLY_RECEIVED → RECEIVED → CLOSED`
- Branches: `ON_HOLD`, `CANCELLED`
- Commands / actors: ACT-PROC
- Invariants: INV-018
- Open guards: commercial approval person is workshop-owned (OQ-019)

## SM-GOODS-RECEIPT

- Seed: GOV-STATES-001
- Write owner: `BC-PROCUREMENT` for orchestration; Inventory Posting Service for stock
- Happy path: `DRAFT → RECEIVED → QC_HOLD → POSTED`
- Branches: posted cancellation by reversal only
- Commands / actors: ACT-PROC orchestrates; ACT-QC may command hold; ACT-IPS posts
- Invariants: INV-001, INV-010, INV-017, INV-018
- Open guards: inbound QC plan (OQ-005); opening-stock cutover (OQ-015)

## SM-RESERVATION

- Concept: TERM-009 / ENT-RESERVATION
- Write owner: `BC-INVENTORY`
- Happy path: `REQUESTED → ACTIVE → CONSUMED`
- Branches: `RELEASED`, `EXPIRED`
- Commands / actors: ACT-SALES commands; ACT-IPS / Inventory writes
- Invariants: INV-002, INV-003
- Open guards: expiry, priority, one-Coil-to-many-orders (OQ-008)

## SM-INVENTORY-UNIT

- Seed: GOV-STATES-001
- Write owner: `BC-INVENTORY`
- Happy path: `PENDING_QC → AVAILABLE → RESERVED → ISSUED_TO_PRODUCTION → PARTIALLY_CONSUMED|CONSUMED`
- MAKE path without Reservation: `AVAILABLE → ISSUED_TO_PRODUCTION` after SM-MATERIAL-ALLOCATION is `ISSUED` (INV-003)
- Additional: `QUARANTINED`, `PACKED`, `SHIPPED`, `RETURNED`, `SCRAPPED`, `CLOSED`
- Commands / actors: ACT-IPS writes stock; ACT-QC / ACT-SHIP / ACT-OP command only
- Invariants: INV-001 through INV-004, INV-017
- Open guards: UOM (OQ-001); Coil weight vs length (OQ-002); official issue point (OQ-003); QC (OQ-005); reservation (OQ-008)

## SM-MATERIAL-ALLOCATION

- Concept: TERM-010 / ENT-MATERIAL-ALLOCATION
- Write owner: `BC-PRODUCTION`
- Happy path: `PLANNED → ASSIGNED → ISSUED`
- Branches: `RELEASED`
- Commands / actors: ACT-PLAN assigns; ACT-IPS posts the issue
- Invariants: INV-003
- Open guards: official issue posting point (OQ-003)

## SM-PRODUCTION-OPERATION

- Concept: ENT-PRODUCTION-OPERATION
- Write owner: `BC-PRODUCTION`
- Happy path: `PLANNED → IN_PROGRESS → COMPLETED`
- Branches: `SKIPPED`, `REWORK`
- Commands / actors: ACT-PLAN plans; ACT-OP records; ACT-IPS posts stock effects
- Invariants: INV-006, INV-007, INV-009
- Open guards: real step list and official posting points (OQ-003)

## SM-PRODUCTION-ORDER

- Seed: GOV-STATES-001
- Write owner: `BC-PRODUCTION`
- Happy path: `DRAFT → PLANNED → RELEASED → IN_PROGRESS → PARTIALLY_COMPLETED|COMPLETED → CLOSED`
- Branches: `PAUSED`, `ON_HOLD`, `CANCELLED`, `ABORTED`
- `PAUSED` returns to the prior live state by resume; it is not a silent skip
- Commands / actors: ACT-PLAN plans/releases; ACT-OP records execution; ACT-IPS posts stock effects
- Invariants: INV-006, INV-007, INV-009
- Open guards: official posting points (OQ-003); QC gates (OQ-005); residual cutoff (OQ-009)

## SM-RESIDUAL

- Concept: TERM-012 / ENT-RESIDUAL
- Write owner: Production fact; Inventory resulting unit
- Happy path: `FACT_RECORDED → UNIT_CREATED → AVAILABLE_OR_QUARANTINE`
- Branches: `BELOW_THRESHOLD_TO_SCRAP`
- Commands / actors: ACT-OP records fact; ACT-IPS creates child unit
- Invariants: INV-008
- Open guards: threshold (OQ-009)

## SM-SCRAP

- Concept: TERM-013 / ENT-SCRAP
- Write owner: Production fact; Inventory Posting Service for stock movement
- Happy path: `FACT_RECORDED → STOCK_POSTED → CLOSED`
- Commands / actors: ACT-OP or ACT-QC command; ACT-IPS posts
- Invariants: INV-001, INV-009, INV-017
- Open guards: none numeric beyond residual cutoff when the source is leftover (OQ-009)

## SM-QUALITY-INSPECTION

- Seed: GOV-STATES-001
- Write owner: `BC-QUALITY`
- Happy path: `PLANNED → IN_PROGRESS → COMPLETED → ACCEPTED|REJECTED|CONDITIONAL|QUARANTINED`
- Commands / actors: ACT-QC; ACT-IPS posts hold/release when commanded
- Invariants: INV-010, INV-017
- Open guards: plans, limits, samples, named releasers (OQ-005)

## SM-PACKAGE

- Concept: TERM-023 / ENT-PACKAGE
- Write owner: `BC-SHIPPING`
- Happy path: `DRAFT → PACKED → ASSIGNED_TO_SHIPMENT`
- Branches: `UNPACKED`
- Commands / actors: ACT-SHIP; stock pack-state via ACT-IPS if later required
- Invariants: INV-011, INV-017
- Open guards: permitted contents vs tracking granularity (OQ-004)

## SM-SHIPMENT

- Seed: GOV-STATES-001
- Write owner: `BC-SHIPPING`
- Happy path: `DRAFT → READY → LOADING → DISPATCHED → PARTIALLY_DELIVERED|DELIVERED → CLOSED`
- Commands / actors: ACT-SHIP; ACT-IPS posts definitive stock exit on dispatch
- Invariants: INV-011, INV-017
- Open guards: partial/over-delivery (OQ-006); shipment-without-demand named person (OQ-019)

## SM-INVOICE

- Seed: GOV-STATES-001
- Write owner: `BC-FINANCE-LITE`
- Happy path: `DRAFT → ISSUED → PARTIALLY_PAID → PAID → CLOSED`
- Branches: `OVERDUE`, `VOID_PENDING → VOIDED`
- Commands / actors: ACT-FIN
- Invariants: INV-012, INV-014
- Open guards: Sales Order closure vs payment (OQ-007); legal books (OQ-012)

## SM-PAYMENT

- Concept: TERM-024 / ENT-PAYMENT
- Write owner: `BC-FINANCE-LITE`
- Happy path: `RECEIVED → ALLOCATED → CLOSED`
- Branches: `UNALLOCATED`, `REVERSED`
- Commands / actors: ACT-FIN
- Invariants: INV-012, INV-016
- Open guards: legal-accounting export (OQ-012)
