---
id: APR-004
title: Domain and Business Architecture Approval
phase: 02-domain-business-architecture
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [DOM-GATE-CHECKLIST-001, DOM-RECON-001]
last_reviewed: 2026-09-06
approval: APR-004
supersedes: null
---

# APR-004 — Domain and Business Architecture Approval

- Gate result: `APPROVED`
- Explicit approver: Project Owner (explicit approval in Cursor session)
- Approval statement: Explicit approval of the Phase 02 Domain and Business
  Architecture design-gate package, including ASM-014
- Approval timestamp: `2026-09-06T00:31:00+03:30`
- Phase: `02-domain-business-architecture`
- Scope authorized: Proposed capabilities, bounded contexts, As-Is/To-Be
  process maps, actors, ownership, MVP scope, promoted terminology, formal
  deferral of Customer Portal ordering, and the standing team question-pack
  process
- Authorized next phase: `03-state-machines-invariants`
- Implementation authorization: none; `IMPLEMENTATION_AUTHORIZED` remains
  `false`
- Git checkpoint: pending
- Git commit: pending
- Supersedes approval: none

## Approval boundary

APR-004 approves the Phase 02 **design** package as the baseline for Phase 03
structure work. It accepts ASM-014: OQ-001 through OQ-006, OQ-008, OQ-010, and
OQ-013 remain unanswered and formally scoped to workshop / later phases.

It does **not** approve:

- owner-signed workshop policy or numeric UOM, routing, QC, reservation,
  fulfillment, or organization rules
- Customer Portal inclusion beyond the formal MVP-ordering deferral
- temporary roster identities as real people or approvers
- ADR-0006, ADR-0007, ADR-0008, or any framework/package/database product
- executable state machines, schemas, APIs, or implementation

OQ-001 through OQ-019 remain unanswered or `treating`. Team answers expected
in a few days will be recorded on those rows when they arrive.

## Approved evidence package

- `docs/00-governance/approved-baselines/APR-004-domain-business-architecture.md` — `APR-004` — version `0.1.0`
- `docs/02-domain-business-architecture/README.md` — `PHASE-02`
- `docs/02-domain-business-architecture/WORKSHOP_ROSTER.md` — `DOM-ROSTER-001`
- `docs/02-domain-business-architecture/CAPABILITY_BOUNDED_CONTEXT_MAP.md` — `DOM-CAP-BC-001`
- `docs/02-domain-business-architecture/PROCESS_MAPS_AS_IS_TO_BE.md` — `DOM-PROCESS-001`
- `docs/02-domain-business-architecture/ACTOR_RESPONSIBILITY_CATALOGUE.md` — `DOM-ACTORS-001`
- `docs/02-domain-business-architecture/MODULE_OWNERSHIP_MATRIX.md` — `DOM-OWN-001`
- `docs/02-domain-business-architecture/MVP_SCOPE_AND_BUSINESS_RULES.md` — `DOM-MVP-RULES-001`
- `docs/02-domain-business-architecture/SELF_CHECK.md` — `DOM-SELF-CHECK-001`
- `docs/02-domain-business-architecture/INDEPENDENT_REVIEW.md` — `DOM-INDEP-REVIEW-001`
- `docs/02-domain-business-architecture/RECONCILIATION.md` — `DOM-RECON-001`
- `docs/02-domain-business-architecture/GATE_CHECKLIST.md` — `DOM-GATE-CHECKLIST-001`
- `docs/02-domain-business-architecture/WORKSHOP_COLLECTION_MAP.md` — `DOM-QMAP-001`
- `docs/02-domain-business-architecture/PHASE03_HANDOFF.md` — `DOM-P03-HANDOFF-001`
- `docs/02-domain-business-architecture/CHECKPOINT_APR-004.md` — `DOM-CHECKPOINT-APR-004`
- `docs/00-governance/TEAM_QUESTION_PACK.md` — `GOV-QPACK-001`
- `docs/00-governance/TEAM_ANSWER_SHEET.md` — `GOV-QANS-001`
- `docs/00-governance/PHASE_GATES.md` — `GOV-GATES-001`
- `docs/00-governance/DOCUMENTATION_STANDARD.md` — `GOV-DOC-STD-001`
- `docs/00-governance/templates/README.md` — `GOV-TEMPLATES-001`
- `docs/00-governance/templates/TEAM_QUESTION_PACK_TEMPLATE.md` — `TEMPLATE-TEAM-QUESTION-PACK`
- `docs/00-governance/registers/BUSINESS_GLOSSARY.md` — `GOV-GLOSSARY-001`
- `docs/00-governance/registers/CANONICAL_DATA_DICTIONARY.md` — `GOV-DATA-DICT-001`
- `docs/00-governance/registers/CANONICAL_DOMAIN_MODEL.md` — `GOV-DOMAIN-001`
- `docs/00-governance/registers/OPEN_QUESTIONS.md` — `GOV-QUESTIONS-001`
- `docs/00-governance/registers/ASSUMPTIONS.md` — `GOV-ASSUMPTIONS-001`
- `docs/00-governance/registers/REVIEW_FINDINGS.md` — `GOV-FINDINGS-001`
- `docs/00-governance/registers/REQUIREMENTS_TRACEABILITY.md` — `GOV-TRACE-001`
- `docs/00-governance/registers/STAKEHOLDERS_RACI.md` — `GOV-RACI-001`
- `docs/00-governance/CURRENT_PHASE.md` — `GOV-CURRENT-001`
- `docs/00-governance/APPROVALS.md` — `GOV-APPROVALS-001`
- `docs/00-governance/approved-baselines/README.md` — `GOV-BASELINES-001`
- `docs/INDEX.md` — `GOV-INDEX-001`
- `README.md`
- `.cursor/rules/01-phase-question-pack.mdc`
- `docs/03-state-machines-invariants/README.md` — `PHASE-03` — Phase 03
  activation only; not a Phase 02 design artifact
- `docs/03-state-machines-invariants/INVARIANT_CATALOGUE.md` — `SM-INV-001` —
  Phase 03 draft; not approved by this gate
- `docs/03-state-machines-invariants/STATE_MACHINE_CATALOGUE.md` —
  `SM-CATALOGUE-001` — Phase 03 draft; not approved by this gate
- `docs/03-state-machines-invariants/SIDE_EFFECT_MATRIX.md` — `SM-SIDE-001` —
  Phase 03 draft; not approved by this gate
- `docs/03-state-machines-invariants/EXCEPTION_CORRECTION.md` — `SM-EXC-001` —
  Phase 03 draft; not approved by this gate

Exact SHA-256 digests belong in the human-created checkpoint marker. The
complete changed-file set at marker creation must match that marker.

## Closed blockers and accepted ADRs

- Questions: none closed. OQ-010 and OQ-019 remain `treating`.
- Decisions: none accepted beyond existing ADR-0001.
- Findings: FIND-021 resolved; FIND-022 resolved by accepting ASM-014;
  FIND-023 accepted; FIND-020 residual unchanged.

## Residual items

- OQ-001 through OQ-019 remain open or `treating`.
- ADR-0006 through ADR-0008 remain proposed.
- Temporary workshop identities confer no approval authority.
- Phase 03 may draft structure with open guards; it may not invent numeric
  policy.
- Git checkpoint and commit remain pending.

## Reopen conditions

Reopen APR-004 if approved ownership, MVP portal deferral, Goods Receipt
split, Quality/Shipping command-only stock rule, or the one-write-owner rule
is reversed, or if an unanswered OQ is later shown to have been silently
closed by this approval.
