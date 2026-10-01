---
id: SM-CATALOGUE-001
title: State Machine Catalogue
phase: 03-state-machines-invariants
status: approved
version: 0.6.0
owners: [chief-solution-architect, domain-leads]
depends_on: [GOV-STATES-001, SM-INV-001, DOM-ACTORS-001, APR-004, APR-005]
last_reviewed: 2026-10-01
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

The QC paths below are future/deferred architecture (OQ-005). The
current MVP has no QC department, Quality role, inspection, hold, or
Quality release gate. A proposed QC state must not be read as a mandatory
current-MVP transition. Under INV-003, valid normal stock-in creates the
resulting Inventory Unit as `AVAILABLE` in the posting transaction;
normal use begins after commit, subject to existing guards. This is an
architecture reconciliation, not a factory-stated procedure.

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
- Branches: `ON_HOLD`, `CANCEL_PENDING → CANCELLED` (`CANCELLED` may then `CLOSED`)
- Closure (OQ-007): `FULFILLED → CLOSED` when remaining valid demand is already zero within OQ-006 (that is what `FULFILLED` means). Shipment `DELIVERED` is not a close guard. `PARTIALLY_FULFILLED → CLOSED` only with authorized Unfulfilled Demand for remainder; `CANCELLED → CLOSED` after confirm-cancel. Payment and invoice status are not guards.
- Commands / actors: ACT-SALES; hold/cancel after confirm requires SalesOrderChange, not regression to Draft
- Invariants: INV-013, INV-014
- Open guards: family over-delivery %/kg (OQ-006 configuration; default 0 answered)
- Factory commercial evidence (`2026-09-30`) does not add a state. Payment
  and invoice status remain outside closure. Estimated and final amounts
  are commercial facts, not this lifecycle.
- Factory evidence does not name who amends or cancels a customer order.
  `CANCEL_PENDING`, `CANCELLED`, hold, and `SalesOrderChange` stay
  architecture candidates. Mr. Dinavand's production stop/cancel decision
  is not this machine. No new transition is added. A cancelled order
  reopening is not factory-confirmed. `REOPENED_AS_INQUIRY` on unfulfilled
  demand stays an architecture branch.

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
- Factory evidence (`2026-09-30`) does not confirm this lifecycle. Ms.
  Masoumi registers purchases and sends proformas. She is not a confirmed
  approver, receiver, or inventory poster. These states stay architecture
  candidates. They are not deleted. No current QC hold is required on
  intake.

## SM-GOODS-RECEIPT

- Seed: GOV-STATES-001
- Write owner: `BC-PROCUREMENT` for orchestration; Inventory Posting Service for stock
- Current-MVP path: `DRAFT → RECEIVED → POSTED`; no QC approval gate
- Future Quality branch: `RECEIVED → QC_HOLD → POSTED` only if QC is later enabled
- Branches: posted cancellation by reversal only
- Commands / actors: ACT-PROC orchestrates; ACT-QC may command hold; ACT-IPS posts
- Invariants: INV-001, INV-010, INV-017, INV-018
- Open guards: inbound QC plan (OQ-005) only for future Quality. Opening-stock cutover (OQ-015) is separate from normal Goods Receipt.
- Factory intake (`2026-09-30`): one station; Internal Code, Count,
  Weight, Type; kg is stock quantity; Count is descriptive. Current
  factory does not require Quality approval on intake. The `QC_HOLD`
  step and `ACT-QC` hold remain future capability and are not deleted.
  Posting actor remains `ACT-IPS` via `PostGoodsReceipt`. No second path.
  Opening stock remains OQ-015, not this receipt. `ApprovePurchaseOrder`
  on the purchase machine stays an unnamed architecture command (OQ-019),
  not a factory-confirmed approver.

## SM-RESERVATION

- Concept: TERM-009 / ENT-RESERVATION
- Write owner: `BC-INVENTORY`
- Happy path: `REQUESTED → ACTIVE → CONSUMED`
- Branches: `RELEASED`, `EXPIRED` (EXPIRED is orphan/stale sweep only; not a confirmed-SO timer)
- Commands / actors: ACT-SALES commands; ACT-IPS / Inventory writes
- Invariants: INV-002, INV-003; **one Inventory Unit → at most one ACTIVE reservation** (OQ-008)
- Open guards: TTL only if a later temporary planning-hold type is added (OQ-008 residual)

## SM-INVENTORY-UNIT

- Seed: GOV-STATES-001
- Write owner: `BC-INVENTORY`
- Current-MVP normal stock-in path: `(none) → AVAILABLE` in the valid `ACT-IPS` posting transaction. No separate release command is required. Ledger establishes stock quantity; this state establishes lifecycle eligibility after commit, subject to existing reservation, location, quantity, and destiny guards (INV-001–004).
- Historical/future Quality path: `PENDING_QC → AVAILABLE → RESERVED → ISSUED_TO_PRODUCTION → PARTIALLY_CONSUMED|CONSUMED`. `PENDING_QC` and Quality release are not current-MVP prerequisites.
- MAKE path without Reservation: `AVAILABLE → ISSUED_TO_PRODUCTION` after SM-MATERIAL-ALLOCATION is `ISSUED` (INV-003)
- Additional: `PACKED`, `SHIPPED`, `RETURNED`, `SCRAPPED`, `CLOSED`; `QUARANTINED` is future Quality only
- Commands / actors: ACT-IPS writes stock; ACT-QC / ACT-SHIP / ACT-OP command only
- Invariants: INV-001 through INV-004, INV-017
- Open guards: UOM (OQ-001); Coil weight vs length (OQ-002); official issue point (OQ-003); future QC only (OQ-005)

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
- Commands / actors: ACT-PLAN plans; ACT-OP records; ACT-IPS posts stock effects. `ACT-OP` is an architecture actor. It is not a named operator, not a Station identity, and not the operator's station-completion declaration.
- Invariants: INV-006, INV-007, INV-009
- Open guards: real step list as a versioned mechanism (OQ-003). Posting
  boundary is `CompleteProductionOperation` (recorded OQ-003).
- Factory clarification (`2026-09-30`): Station is physical and, in factory
  wording, the Production Step. No separate Work Center in factory
  terminology. Ten current station names are recorded on OQ-003. They are
  not a fixed route. Entry and Referral are workflow events and are **not**
  this machine's Start or Complete commands. No shared Station account.
  Personal operator identity is required for attributable activity. Do not
  add timestamp columns here. Stop/cancel remains the existing abort
  branches; the factory names the Production Manager as the business
  decider and does not replace those transitions.
- Operator login and logout are recorded and are not this machine's
  Start. A Station completion declaration informs the Production Manager
  and is not this machine's Complete, and it does not post stock. No
  Production Planner role is added.
- The factory has not named nested consume primitives and has not defined
  process loss or a good-output versus WIP workflow. Those remain
  architecture facts inside this completion. Not every Station consumes
  a unit. Residual versus Scrap stays a human decision. No cutoff was
  added.

## SM-PRODUCTION-ORDER

- Seed: GOV-STATES-001
- Write owner: `BC-PRODUCTION`
- Happy path: `DRAFT → PLANNED → RELEASED → IN_PROGRESS → PARTIALLY_COMPLETED|COMPLETED → CLOSED`
- Branches: `PAUSED`, `ON_HOLD`, `CANCELLED`, `ABORTED`
- `PAUSED` returns to the prior live state by resume; it is not a silent skip
- Commands / actors: ACT-PLAN plans/releases; ACT-OP records execution; ACT-IPS posts stock effects
- Invariants: INV-006, INV-007, INV-009
- Open guards: routing step names (OQ-003); residual cutoff numbers (OQ-009); QC gates (OQ-005) only in a future Quality scope

## SM-RESIDUAL

- Concept: TERM-012 / ENT-RESIDUAL
- Write owner: Production fact; Inventory resulting unit
- Current reusable path: `FACT_RECORDED → UNIT_CREATED`; valid nested residual stock-in makes the resulting child Inventory Unit `AVAILABLE` when `CompleteProductionOperation` commits. Scrap does not become `AVAILABLE`.
- Historical/future placement/QC branch: `UNIT_CREATED → AVAILABLE_OR_QUARANTINE`; it is not a current-MVP availability prerequisite, and its quarantine branch is future Quality only.
- Branches: `BELOW_THRESHOLD_TO_SCRAP`
- Commands / actors: ACT-OP records residual fact nested in
  `CompleteProductionOperation`; ACT-IPS creates child unit in the same
  transaction
- Invariants: INV-008, INV-006
- Open guards: threshold numbers (OQ-009). Independent residual qty after
  completion is forbidden.
- Coil → Sheet clarification (`2026-09-30`): reusable cutting waste of that
  conversion is called Residual. Factory warehouse conversion is described
  as an inventory transformation that may have **no** Production Order.
  This machine is **not** silently extended to that conversion. Conflict
  with `CompleteProductionOperation` nesting remains open. See FACT-03 in
  OPEN_QUESTIONS.md.
- Factory Residual/Scrap clarification (`2026-09-30`): reusable waste is
  Residual and returns to the warehouse as a business disposition.
  Non-reusable waste is Scrap. A person decides. The system must not
  classify from weight or dimensions. No universal numeric cutoff is
  supplied. The `BELOW_THRESHOLD_TO_SCRAP` branch is **not** deleted.
  It conflicts with "no universal cutoff" and stays an open OQ-009
  conflict. No new posting command is added. A weight difference is not
  this machine.

## SM-SCRAP

- Concept: TERM-013 / ENT-SCRAP
- Write owner: Production fact; Inventory Posting Service for stock movement
- Happy path: `FACT_RECORDED → STOCK_POSTED → CLOSED`
- Commands / actors: ACT-OP nested leftover, or ACT-QC/abort new scrap;
  ACT-IPS `PostScrapMovement` posts quantity once
- Invariants: INV-001, INV-009, INV-017
- Open guards: residual cutoff numbers when the source is leftover (OQ-009).
  Coil → Sheet clarification: non-reusable cutting waste of that conversion
  is called Scrap. That name mapping does not add a new scrap command.

## SM-QUALITY-INSPECTION

- Seed: GOV-STATES-001
- Write owner: `BC-QUALITY`
- Happy path: `PLANNED → IN_PROGRESS → COMPLETED → ACCEPTED|REJECTED|CONDITIONAL|QUARANTINED`
- Commands / actors: ACT-QC; ACT-IPS posts hold/release when commanded
- Invariants: INV-010, INV-017
- Open guards: plans, limits, samples, named releasers (OQ-005)
- Current factory (`2026-09-30`): there is no QC department. QC is outside
  the current MVP. There is no Quality role and no Quality personnel.
  This machine is retained as **future** Quality capability. It is not
  current factory operation. Transitions are not deleted and not
  implemented. Do not invent a current QC workflow.

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
- Factory evidence (`2026-09-30`) does not name a shipper, loader, carrier,
  or delivery confirmer. This machine is not deleted. `DELIVERED` is not
  Sales Order closure. Stock exit stays `ACT-IPS`. No shipment screen
  writes the Ledger. No shipping role is added.
- Current-MVP shipment readiness does not require Quality release (OQ-005).

## SM-INVOICE

- Seed: GOV-STATES-001
- Write owner: `BC-FINANCE-LITE`
- Happy path: `DRAFT → ISSUED → PARTIALLY_PAID → PAID → CLOSED`
- Branches: `OVERDUE`, `VOID_PENDING → VOIDED`
- Commands / actors: ACT-FIN
- Invariants: INV-012, INV-014
- Open guards: legal books (OQ-012). Sales Order closure is not an invoice guard (OQ-007).
- Factory evidence: Mr. Pour-Ebrahim issues the customer invoice;
  Mr. Ghaffari records it and uploads the record to an unnamed external
  system. That handoff does not add a state and does not make the upload
  a Legal-GL write. `ACT-FIN` ownership is unchanged. No RBAC mapping.

## SM-PAYMENT

- Concept: TERM-024 / ENT-PAYMENT
- Write owner: `BC-FINANCE-LITE`
- Happy path: `RECEIVED → ALLOCATED → CLOSED`
- Branches: `UNALLOCATED`, `REVERSED`
- Commands / actors: ACT-FIN
- Invariants: INV-012, INV-016
- Open guards: legal-accounting export (OQ-012)
- Factory payment methods, not new states: deposit with remainder after
  delivery; cheque or promissory note; known-customer credit. No credit
  limit or aging rule. Allocation is unchanged. Payment does not close
  the Sales Order.
