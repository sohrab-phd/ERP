---
id: APR-005
title: State Machines and Invariants Approval
phase: 03-state-machines-invariants
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [SM-GATE-CHECKLIST-001, SM-RECON-001, ASM-016]
last_reviewed: 2026-09-06
approval: APR-005
supersedes: null
---

# APR-005 — State Machines and Invariants Approval

- Gate result: `APPROVED`
- Explicit approver: Project Owner (explicit approval in Cursor session)
- Approval statement: Explicit approval of the Phase 03 State Machines and
  Invariants design-gate package, including ASM-016
- Approval timestamp: `2026-09-06T01:18:00+03:30`
- Phase: `03-state-machines-invariants`
- Scope authorized: Proposed INV-001 through INV-020, lifecycle machines,
  transition tables, side-effect map, exception/correction paths, event and
  rejection rules, cross-machine sequences, concurrency interlocks, and
  role-pair SoD — all with unanswered OQ-owned values left as open guards
- Authorized next phase: `04-database-architecture` for **logical** drafting
- Implementation authorization: none; `IMPLEMENTATION_AUTHORIZED` remains
  `false`
- Git checkpoint: completed at `bef6b6464baaf62ac8d3db9f9b7fa835ad04ec6c`
- Supersedes approval: none

## Approval boundary

APR-005 approves the Phase 03 **structure** package as the baseline for
Phase 04 logical data work. It accepts ASM-016: OQ-owned numbers, named
people, and cutoffs remain unanswered; commands that need those values
reject as `GUARD_OPEN_POLICY`.

It does **not** approve:

- owner-signed numeric UOM, Coil quantity, routing, QC, tolerance,
  reservation, residual, or Sales Order closure rules
- named workshop people or temporary identities as approvers
- Inquiry/Quotation expiry day counts
- ADR-0006, ADR-0007, ADR-0008, or any framework/package/database product
- executable schemas, migrations, APIs, or implementation
- Phase 04 physical types, indexes, or volumes

OQ-001 through OQ-019 remain unanswered or `treating`. Team answers will
be recorded on those rows when they arrive.

## Approved evidence package

- `docs/00-governance/approved-baselines/APR-005-state-machines-invariants.md` — `APR-005` — version `0.1.0`
- `docs/03-state-machines-invariants/README.md` — `PHASE-03`
- `docs/03-state-machines-invariants/INVARIANT_CATALOGUE.md` — `SM-INV-001`
- `docs/03-state-machines-invariants/STATE_MACHINE_CATALOGUE.md` — `SM-CATALOGUE-001`
- `docs/03-state-machines-invariants/TRANSITION_TABLES.md` — `SM-TRANS-001`
- `docs/03-state-machines-invariants/SIDE_EFFECT_MATRIX.md` — `SM-SIDE-001`
- `docs/03-state-machines-invariants/EXCEPTION_CORRECTION.md` — `SM-EXC-001`
- `docs/03-state-machines-invariants/EVENT_AND_REJECTION.md` — `SM-EVT-001`
- `docs/03-state-machines-invariants/CROSS_MACHINE_SEQUENCES.md` — `SM-SEQ-001`
- `docs/03-state-machines-invariants/CONCURRENCY_AND_INTERLOCK.md` — `SM-CONC-001`
- `docs/03-state-machines-invariants/AUTHORIZATION_SOD.md` — `SM-SOD-001`
- `docs/03-state-machines-invariants/SELF_CHECK.md` — `SM-SELF-CHECK-001`
- `docs/03-state-machines-invariants/INDEPENDENT_REVIEW.md` — `SM-INDEP-REVIEW-001`
- `docs/03-state-machines-invariants/RECONCILIATION.md` — `SM-RECON-001`
- `docs/03-state-machines-invariants/GATE_CHECKLIST.md` — `SM-GATE-CHECKLIST-001`
- `docs/03-state-machines-invariants/PHASE04_HANDOFF.md` — `SM-P04-HANDOFF-001`
- `docs/03-state-machines-invariants/CHECKPOINT_APR-005.md` — `SM-CHECKPOINT-APR-005`
- `docs/00-governance/registers/STATE_TRANSITION_CATALOGUE.md` — `GOV-STATES-001`
- `docs/00-governance/registers/OPEN_QUESTIONS.md` — `GOV-QUESTIONS-001`
- `docs/00-governance/registers/ASSUMPTIONS.md` — `GOV-ASSUMPTIONS-001`
- `docs/00-governance/registers/REVIEW_FINDINGS.md` — `GOV-FINDINGS-001`
- `docs/00-governance/registers/REQUIREMENTS_TRACEABILITY.md` — `GOV-TRACE-001`
- `docs/00-governance/TEAM_QUESTION_PACK.md` — `GOV-QPACK-001`
- `docs/00-governance/TEAM_ANSWER_SHEET.md` — `GOV-QANS-001`
- `docs/00-governance/CURRENT_PHASE.md` — `GOV-CURRENT-001`
- `docs/00-governance/APPROVALS.md` — `GOV-APPROVALS-001`
- `docs/00-governance/approved-baselines/README.md` — `GOV-BASELINES-001`
- `docs/INDEX.md` — `GOV-INDEX-001`

Phase 04 logical drafts started after this approval are **not** approved
by this gate. If they exist at marker creation they must still be listed
in the human-created checkpoint marker because the generator binds the
complete changed-file set.

Exact SHA-256 digests belong in the human-created checkpoint marker.

## Closed blockers and accepted ADRs

- Questions: none closed. OQ-010 and OQ-019 remain `treating`.
- Decisions: none accepted beyond existing ADR-0001.
- Findings: FIND-024, FIND-025, and FIND-027 resolved; FIND-026 and
  FIND-028 accepted; FIND-023 residual unchanged.
- Assumptions: ASM-016 accepted at `2026-09-06T01:13:00+03:30` and
  included in this approval.

## Residual items

- OQ-001 through OQ-019 remain open or `treating`.
- ADR-0006 through ADR-0008 remain proposed.
- Temporary workshop identities confer no approval authority.
- Phase 04 may draft logical structure with open extensions; it may not
  invent numeric policy or write executable schemas.
- Git checkpoint completed at `bef6b6464baaf62ac8d3db9f9b7fa835ad04ec6c`
  (CHK-0006, late register recording). Do not create a second Phase 03
  freeze.

## Reopen conditions

Reopen APR-005 if an approved invariant, write-owner rule, Quality/Shipping
command-only stock rule, Genealogy-as-projection rule, or open-guard
treatment is reversed, or if an unanswered OQ is later shown to have been
silently closed by this approval.
