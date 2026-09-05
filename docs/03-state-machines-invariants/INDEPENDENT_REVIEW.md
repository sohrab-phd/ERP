---
id: SM-INDEP-REVIEW-001
title: State Machines and Invariants Independent Review
phase: 03-state-machines-invariants
status: approved
version: 0.2.0
owners: [independent-reviewer]
depends_on: [SM-SELF-CHECK-001]
last_reviewed: 2026-09-06
approval: APR-005
supersedes: null
---

# State Machines and Invariants Independent Review

## Independence

- Reviewer: Independent architecture reviewer
- Review date: 2026-09-06
- Artifacts reviewed: Phase 03 design set (invariants, machines, transitions,
  side effects, exceptions, events), self-check, Phase 02 handoff, and the
  Phase 03 register updates (states, findings, assumptions, questions,
  traceability).
- Independence limit: The same agent session authored the Phase 03 drafts.
  This is a distinct adversarial pass. It did not treat temporary roster
  identities as reviewers or approvers.
- Method: Read-only consistency review of the design-gate package after the
  FIND-024 through FIND-028 corrections.

## Verdict

`READY_FOR_RECONCILIATION`

No unresolved in-scope Critical or High design-gate defect remains after
FIND-024. FIND-025 and FIND-027 are resolved. FIND-026 and FIND-028 are
accepted Medium residuals. This verdict is not human approval.

## Evidence checked

- Sources: APR-004, DOM-P03-HANDOFF-001, DOM-OWN-001, DOM-ACTORS-001,
  DOM-PROCESS-001, DOM-MVP-RULES-001, GOV-STATES-001, ASM-014, ASM-016.
- Requirements/traceability: REQ-OBJ-001 through REQ-OBJ-004 now cite
  proposed INV-* and machines; REQ-* and TEST-* IDs were not invented.
- Cross-domain consistency: one write owner; Quality/Shipping command-only
  for stock; Goods Receipt split; Genealogy Link as projection; portal
  ordering rejected in MVP; Inventory Posting Service mechanical only.
- Failure/exception scenarios: unfulfilled demand, partial fulfillment,
  QC hold/reject/conditional, residual versus scrap, rework, cancellation,
  reversal, pause/resume, shipment without demand, and idempotent retry
  without invented numeric limits or named approvers.

## Satisfied criteria

- Planned Phase 03 design artifacts exist and remain `in_review`.
- Handoff-required machines exist. Extra machines (Fulfillment Assessment,
  Material Allocation, Production Operation) match Phase 02 concepts.
- Temporary identities are not transition Actors and have no approval
  authority.
- OQ-001 through OQ-018 are unanswered. OQ-010 and OQ-019 are `treating`,
  not closed.
- Every numeric or named policy the tables need is an explicit open guard
  or `workshop-commercial-practice`.
- Node.js + TypeScript remains the only accepted technology ADR.
- `IMPLEMENTATION_AUTHORIZED` remains false. Phase 04 remains `planned`.

## Findings

### FIND-024 — Sales Order and issue paths implied production on every fulfillment

- Severity: high
- Status: verified resolved
- Closure evidence: CONFIRMED may fulfill without IN_PRODUCTION;
  AVAILABLE may issue after Allocation.

### FIND-025 — Shipment-without-demand was bound to OQ-005

- Severity: medium
- Status: verified resolved
- Closure evidence: INV-011 + OQ-019; OQ-005 remains QC.

### FIND-026 — Inquiry and Quotation expiry have no owning OQ

- Severity: medium
- Status: accepted
- Required correction now: none. Do not invent a day count or OQ-020 in
  this gate.

### FIND-027 — Production Order PAUSED had no resume transition

- Severity: medium
- Status: verified resolved
- Closure evidence: ResumeProductionOrder to prior live state.

### FIND-028 — Phase 03 seed required REQ-* and TEST-* on every transition

- Severity: medium
- Status: accepted
- Required correction now: none. Do not mint REQ-* or TEST-* IDs.

## Uncertainty and limits

- No shop-floor walkthrough, signed UOM matrix, QC authority, residual
  cutoff, or real named workshop participants exist.
- Open guards mean the machines are not executable policy. A future
  implementer who fills a number without the matching `OQ-*` answer is
  violating this package, not completing it.
- This reviewer cannot certify business policy that temporary identities
  cannot sign.
- Binary source re-extraction was not repeated; Phase 01 provenance limits
  still apply.
- Residual for the human gate: approving Phase 03 accepts ASM-016.
  Rejecting ASM-016 returns this gate to `BLOCKED`.

## Required next action

Reconcile FIND-024 through FIND-028 and present the package for explicit
human approval. Do not start Phase 04. Do not execute the workshop. Do not
implement software.
