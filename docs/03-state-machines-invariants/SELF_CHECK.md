---
id: SM-SELF-CHECK-001
title: State Machines and Invariants Self-Check
phase: 03-state-machines-invariants
status: approved
version: 0.2.0
owners: [chief-solution-architect]
depends_on: [PHASE-03, SM-INV-001, SM-CATALOGUE-001, SM-TRANS-001, SM-SIDE-001, SM-EXC-001, SM-EVT-001]
last_reviewed: 2026-09-06
approval: APR-005
supersedes: null
---

# State Machines and Invariants Self-Check

## Scope and method

This self-check covers the Phase 03 design set, proposed `INV-*` promotions,
open-guard treatment under ASM-016, and gate status. It is not an independent
review or approval.

Two documentation-only audits were completed:

1. **Structure and exit-criteria audit** — inspected the Phase 03 contract,
   planned artifacts, BR-to-INV promotion, machine coverage versus the Phase
   02 handoff, and the “unambiguous or explicit open guard” exit rule.
2. **Cross-artifact consistency audit** — compared write owners, actors,
   forbidden writes, side effects, exception paths, rejection families, and
   OQ citations across the six design artifacts and the affected registers.

No application code, schema, package, API, UI, or deployment work was
performed. Temporary identities were not treated as transition approvers.

## Criterion results

### Planned artifacts and entry residue — PASS

- Invariant catalogue, state-machine catalogue, transition tables, side-effect
  matrix, exception/correction workflows, and event/rejection catalogue exist
  and are `in_review`.
- Phase 02 remains approved through APR-004 / CHK-0003.
- Phase 02 handoff required machines are present: Inquiry, Quotation,
  Unfulfilled Demand, Reservation, Residual, Scrap, Package, Payment, plus
  the eight GOV-STATES-001 seeds and Fulfillment Assessment, Material
  Allocation, and Production Operation.
- Team answers are not required to draft. They remain required before a
  numeric or named guard can close.

### Invariant promotion — PASS

- BR-001 through BR-020 map to INV-001 through INV-020 as proposed rows.
- Rows that need an unanswered OQ keep an explicit open guard.
- No UOM, Coil quantity, routing step, QC limit, tolerance, closure rule,
  reservation expiry, residual cutoff, or named person is invented.
- INV-017 through INV-020 restated approved Phase 02 ownership and MVP
  deferral without changing them.

### Lifecycle coverage versus Phase 02 — PASS AFTER CORRECTION

- Happy path, unfulfilled demand, partial fulfillment, QC hold/reject,
  residual versus scrap, rework, cancellation, reversal, shipment without
  demand, and idempotent retry are present.
- FIND-024 corrected STOCK/PURCHASE fulfillment without `IN_PRODUCTION` and
  MAKE issue from AVAILABLE after Allocation.
- FIND-027 added Production Order resume from `PAUSED`.
- FIND-023 remains accepted: Dispatch and Delivery stay SM-SHIPMENT states.
- Genealogy Link is never a writable machine (INV-019).

### Open guards and rejection — PASS AFTER CORRECTION

- Commands that need an unanswered OQ reject as `GUARD_OPEN_POLICY`.
- FIND-025 moved shipment-without-demand named person from OQ-005 to
  OQ-019. QC releasers stay OQ-005.
- FIND-026 accepted Inquiry/Quotation expiry as
  `workshop-commercial-practice` without inventing OQ-020 or a day count.
- FIND-028 accepted that transitions link `INV-*` and `REQ-OBJ-*`, not
  invented `REQ-*` or `TEST-*` IDs.
- ASM-016 records that this design-gate may complete with those guards
  still open. That is a design-gate exception, not an answer.

### Actors, ownership, and authority — PASS

- Every Actor is an `ACT-*` role from DOM-ACTORS-001.
- Temporary roster names cannot be the Actor and have no approval authority.
- `ACT-IPS` is mechanical only. `ACT-QC` and `ACT-SHIP` command Inventory
  and do not write stock tables. `ACT-CUST` is never A/R. Portal order
  commands are rejected in MVP (INV-020).
- Procurement orchestrates Goods Receipt; Inventory posts stock (INV-018).

### Traceability and technology maturity — PASS

- REQ-OBJ-001 through REQ-OBJ-004 now cite Phase 03 INV-* and machines.
- REQ-OBJ-005 remains the confirmed Node.js + TypeScript objective.
- Node.js + TypeScript (ADR-0001) remains the only accepted technology ADR.
- Event names are proposed labels. They do not select a broker or package
  (OQ-018).
- OQ-017 remains the posting-mechanism question.

### Gate and implementation boundary — PASS

- Phase 03 remains `in_review`. No artifact claims Phase 03 approval.
- `IMPLEMENTATION_AUTHORIZED` remains false.
- No application code, package manifest, executable schema/migration,
  API/UI, test implementation, integration implementation, deployment
  implementation, staging, commit, or checkpoint marker was created by this
  self-check.
- Phase 04 remains `planned`.

## Corrections completed

- STOCK/PURCHASE Sales Order fulfillment without `IN_PRODUCTION`.
- Inventory Unit issue from AVAILABLE after Material Allocation.
- Production Order resume from `PAUSED`.
- Shipment-without-demand authority rebound to OQ-019.
- Inquiry/Quotation expiry marked `workshop-commercial-practice`.
- Added ASM-016 and FIND-024 through FIND-028.
- Linked Phase 03 evidence on REQ-OBJ-001 through REQ-OBJ-004.

## Remaining work

- Independent review, reconciliation, and human approval of this
  design-gate, including explicit accept or reject of ASM-016.
- Workshop answers before any numeric or named guard can close.
- Replacement of every `(temporary)` roster row before workshop execution
  (OQ-019).
- Phase 04 after Phase 03 approval and checkpoint. Do not start Phase 04
  before that.

## Result

`READY_FOR_HUMAN_APPROVAL`

This result is a self-check recommendation. It does not constitute approval,
workshop validation, or checkpoint completion. Temporary identities cannot
approve this gate.

## Post-review approval disposition

The Project Owner accepted ASM-016 at `2026-09-06T01:13:00+03:30` and
explicitly approved Phase 03 as `APR-005` at
`2026-09-06T01:18:00+03:30`. OQ-001 through OQ-019 remain open or
`treating`. The Git checkpoint later existed at
`bef6b6464baaf62ac8d3db9f9b7fa835ad04ec6c` (CHK-0006). Phase 04 logical
drafting is authorized. Implementation remains unauthorized.
