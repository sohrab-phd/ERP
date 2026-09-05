---
id: SM-RECON-001
title: State Machines and Invariants Reconciliation
phase: 03-state-machines-invariants
status: approved
version: 0.2.0
owners: [chief-solution-architect]
depends_on: [SM-SELF-CHECK-001, SM-INDEP-REVIEW-001]
last_reviewed: 2026-09-06
approval: APR-005
supersedes: null
---

# Reconciliation — Phase 03 State Machines and Invariants

## Inputs

- Draft artifacts: SM-INV-001, SM-CATALOGUE-001, SM-TRANS-001, SM-SIDE-001,
  SM-EXC-001, SM-EVT-001
- Independent review: [INDEPENDENT_REVIEW.md](INDEPENDENT_REVIEW.md)
- Workshop/source evidence: none executed; APR-004, the Phase 02 handoff,
  and ASM-016 remain the only inputs

## Agreements

- BR-001 through BR-020 are proposed as INV-001 through INV-020.
- Every transition has command, actor role, guard, effect, and event.
- Failed guards leave the source state unchanged and emit no posted write.
- Quality and Shipping command Inventory; they do not write stock tables.
- Procurement orchestrates Goods Receipt; Inventory posts stock.
- Genealogy Link is a rebuildable projection.
- Portal ordering commands are rejected in this MVP.
- Temporary workshop identities have no approval authority and are not
  transition Actors.
- OQ-001 through OQ-018 remain unanswered. OQ-010 and OQ-019 remain
  `treating`.

## Conflicts

### FIND-024 — Production implied on every fulfillment

Competing drafts: Sales Order happy path always showed `IN_PRODUCTION`;
Phase 02 already has STOCK and PURCHASE. Resolution: STOCK/PURCHASE fulfill
from `CONFIRMED`; MAKE uses `IN_PRODUCTION` and may issue from AVAILABLE
after Allocation. Owner: Chief Solution Architect; verified in v0.3.0
tables.

### FIND-025 — Exceptional shipment bound to QC

Competing IDs: OQ-005 versus commercial exception. Resolution: INV-011 plus
OQ-019 for the named person; OQ-005 stays Quality. Owner: Shipping / Sales.

### FIND-026 — Commercial expiry without an OQ

Competing needs: every open number should have an OQ; inventing OQ-020
expands the team pack without evidence. Resolution: accepted as
`workshop-commercial-practice`. Owner: Sales owner.

### FIND-028 — REQ-* / TEST-* on every transition

Competing needs: GOV-STATES-001 completion text versus FIND-021. Resolution:
accepted. Phase 03 links INV-* and REQ-OBJ-*. Owner: Requirements owner and
QA architect.

### FIND-022 residual / ASM-016

Competing needs: Phase 03 exit wants unambiguous mass-balance, genealogy,
reversal, and concurrency **or** explicit open guards. The numbers cannot
be answered without workshop evidence. Resolution: ASM-016. This is a
design-gate exception, not an answer. Owner: Project Sponsor must accept or
reject ASM-016 at approval.

## Register updates

- Invariants: INV-001 through INV-020 proposed in SM-INV-001 v0.2.0
- States: GOV-STATES-001 v0.3.0 `in_review`
- Assumptions: ASM-016 added; assumptions `in_review` v0.6.0
- Questions: Phase 03 open-guard citation recorded; register `in_review`
  v0.6.0; no OQ answered
- Decisions: none accepted beyond existing ADR-0001
- Risks: no new RISK-*; RISK-001, RISK-003, RISK-005, RISK-006 remain open
- Findings: FIND-024 and FIND-027 resolved; FIND-025 resolved; FIND-026 and
  FIND-028 accepted; FIND-023 residual updated
- Traceability: REQ-OBJ-001 through REQ-OBJ-004 gained Phase 03 evidence;
  register `in_review` v0.4.0

## Downstream impact

- Artifacts confirmed for this design-gate: the six Phase 03 drafts, the
  Phase 04 handoff, and the register versions above.
- Artifacts marked suspect: none. Phase 04 remains `planned` and must not
  start.
- Gates requiring reopen: none. Phase 01 and Phase 02 stay approved.

## Remaining blockers

- In-scope design-gate blocker: none if the human accepts ASM-016.
- Explicitly deferred / out-of-scope items: every OQ-owned number, named
  person, and cutoff; Inquiry/Quotation expiry day counts; workshop
  execution (OQ-019); implementation (no unlock).

## Gate recommendation

`READY_FOR_HUMAN_APPROVAL`

This recommendation does not approve Phase 03, does not start Phase 04,
does not execute the workshop, and does not authorize implementation.
