---
id: GOV-APPROVALS-001
title: Approval and Checkpoint Register
phase: 00-governance
status: approved
version: 0.5.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [GOV-GATES-001]
last_reviewed: 2026-09-06
approval: APR-004
supersedes: null
---

# Approval and Checkpoint Register

This is an append-only index. An AI recommendation, completed draft, or Git
commit does not constitute human approval.

### APR-000 — Governance Foundation Gate

- Phase: `00-governance`
- Status: `superseded-by-APR-001`
- Approval manifest: [APR-000-governance.md](approved-baselines/APR-000-governance.md)
- Review package: `GATE_CHECKLIST.md`
- Supporting evidence: `SELF_CHECK.md`, `INDEPENDENT_REVIEW.md`,
  `RECONCILIATION.md`, `HOOK_VALIDATION.md`
- Approver: Project Owner (explicit approval in Cursor session)
- Approval timestamp: `2026-09-04T14:50:09.3534142+03:30`
- Git checkpoint: pending
- Next phase: `01-project-assimilation` after the approved checkpoint
- Implementation authorization: none

The checkpoint attempt made no staged change or commit. FIND-013 corrected the
protected-control checkpoint classification and caused APR-000 to be superseded.

### APR-001 — Corrected Governance Foundation Gate

- Phase: `00-governance`
- Status: `superseded-by-APR-002`; checkpoint not committed
- Approval manifest: [APR-001-governance.md](approved-baselines/APR-001-governance.md)
- Review package: `GATE_CHECKLIST.md`
- Supporting evidence: `SELF_CHECK.md`, `INDEPENDENT_REVIEW.md`,
  `RECONCILIATION.md`, `HOOK_VALIDATION.md`
- Approver: Project Owner (explicit approval in Cursor session)
- Approval timestamp: `2026-09-04T15:43:04.8536190+03:30`
- Git checkpoint: staging succeeded; commit failed closed; index subsequently
  cleared with user authorization
- Git commit: none
- Next phase: `01-project-assimilation`, inactive pending renewed approval and a
  completed approved checkpoint
- Implementation authorization: none; `IMPLEMENTATION_AUTHORIZED` remains `false`

The commit failed closed because Cursor's exact fixed co-author trailer was
absent from the marker's command. FIND-014 is resolved and independently
verified; all 66 tests pass. APR-001 remains the historical approval record, but
its uncommitted checkpoint is superseded by APR-002. No APR-001 commit exists.

### APR-002 — Renewed Corrected Governance Foundation Gate

- Phase: `00-governance`
- Status: `approved`; checkpoint completed
- Approval manifest: [APR-002-governance.md](approved-baselines/APR-002-governance.md)
- Checkpoint record: [CHK-0001-phase-00.md](approved-baselines/CHK-0001-phase-00.md)
- Review package: `GATE_CHECKLIST.md`
- Supporting evidence: `SELF_CHECK.md`, `INDEPENDENT_REVIEW.md`,
  `RECONCILIATION.md`, `HOOK_VALIDATION.md`
- Approver: Project Owner (explicit approval in Cursor session)
- Approval timestamp: `2026-09-04T16:15:30.3016652+03:30`
- Git checkpoint: completed; 69 files
- Git commit: `540a606ef32a3cb17f7e886dff3c4dcde82ca4b1`
- Next phase: `01-project-assimilation`; active in review
- Implementation authorization: none; `IMPLEMENTATION_AUTHORIZED` remains `false`

FIND-006 through FIND-014 were resolved and independently verified for the
approved baseline, and the baseline checkpoint is complete. The human confirmed
deletion of `.cursor/PHASE_CHECKPOINT_APPROVAL.json`; no checkpoint marker
exists.

### Post-checkpoint correction — FIND-015

- Scope: checkpoint-manifest state validation and its documentation evidence
- Status: resolved, independently verified, and explicitly approved
- Review verdict: `READY_FOR_CORRECTION_APPROVAL`
- Validation: 72 tests pass, including direct implementation-baseline
  paired/unpaired backtick cases
- Approver: Project Owner (explicit approval in Cursor session)
- Approval timestamp: `2026-09-04T16:49:32.2914786+03:30`
- Baseline effect: none; APR-002 remains approved and committed at
  `540a606ef32a3cb17f7e886dff3c4dcde82ca4b1`
- Phase effect: none; Phase 01 remains `ACTIVE_IN_REVIEW`
- Implementation authorization: none; `IMPLEMENTATION_AUTHORIZED` remains `false`
- Follow-up Git checkpoint: completed at
  `25e89c2765575652aa9473922c3a09df7cc87eaf`
- Follow-up commit subject: `docs: record phase 00 checkpoint`
- Approval manifest: none; this follow-up does not create APR-003

The completed-manifest correction received separate user approval as a
post-checkpoint control/documentation follow-up, not as a replacement Phase 00
baseline. It accepts
exactly one pending checkpoint with no valid hash commit, or exactly one
completed checkpoint paired with exactly one valid 40–64 hexadecimal commit.
Mixed, duplicate, missing, and unpaired forms fail closed. The first predicate
revision's mixed-state edge was caught during independent review.

## Recording policy

For a new phase baseline approval, complete the checkpoint sequence:

1. create an approval manifest from the template;
2. record exact artifact paths, versions, and SHA-256 content digests;
3. record accepted residual risks and non-blocking questions;
4. update `CURRENT_PHASE.md`;
5. have a human create the Git-ignored checkpoint marker containing the manifest
   digest, complete changed-file set, and exact commands; the agent submits plain
   `git commit -m ...`, Cursor transforms it to its exact fixed co-author-trailer
   form before hook evaluation, and the marker stores that transformed form;
6. create a new Git checkpoint without rewriting prior checkpoints;
7. record the resulting commit through a separately approved follow-up checkpoint.

Material post-approval changes require impact analysis and either a patch record
or a superseding approval.

The approved FIND-015 follow-up is a patch record against the unchanged APR-002
baseline. It does not create a new approval manifest or APR-003; its separate
follow-up checkpoint completed at
`25e89c2765575652aa9473922c3a09df7cc87eaf`.

The Phase 01 documentation created after that follow-up is now approved by
APR-003 and will enter its pending Phase 01 checkpoint. It does not require
another Phase 00 recording follow-up, preventing an infinite self-referential
checkpoint chain.

### APR-003 — Project Assimilation Gate

- Phase: `01-project-assimilation`
- Status: `approved`; checkpoint completed
- Approval manifest:
  [APR-003-project-assimilation.md](approved-baselines/APR-003-project-assimilation.md)
- Checkpoint record:
  [CHK-0002-phase-01.md](approved-baselines/CHK-0002-phase-01.md)
- Checkpoint procedure:
  [CHECKPOINT_APR-003.md](../01-project-assimilation/CHECKPOINT_APR-003.md)
- Review package:
  [GATE_CHECKLIST.md](../01-project-assimilation/GATE_CHECKLIST.md)
- Supporting evidence:
  [SELF_CHECK.md](../01-project-assimilation/SELF_CHECK.md),
  [INDEPENDENT_REVIEW.md](../01-project-assimilation/INDEPENDENT_REVIEW.md),
  [RECONCILIATION.md](../01-project-assimilation/RECONCILIATION.md),
  [ARCHITECTURE_ASSIMILATION_REPORT.md](../01-project-assimilation/ARCHITECTURE_ASSIMILATION_REPORT.md),
  [SOURCE_BIBLIOGRAPHY.md](../01-project-assimilation/SOURCE_BIBLIOGRAPHY.md),
  [PROVENANCE_CLASSIFICATION.md](../01-project-assimilation/PROVENANCE_CLASSIFICATION.md),
  [MULTI_AGENT_METHOD.md](../01-project-assimilation/MULTI_AGENT_METHOD.md), and
  [WORKSHOP_AGENDA.md](../01-project-assimilation/WORKSHOP_AGENDA.md)
- Approver: Project Owner (explicit approval in Cursor session)
- Approval timestamp: `2026-09-04T20:38:00+03:30`
- Approval scope: accurate assimilation, methodology, provenance, and
  planned-workshop readiness; no detailed design or technology approval
- Open downstream items: OQ-001 through OQ-018, proposed ADR-0006 through
  ADR-0008, FIND-001, FIND-003, FIND-004, named workshop participants,
  delegates, approval limits, and new Phase 02 evidence
- Git checkpoint: completed successfully; 34 files changed
- Git commit: `91273e9e30ead2f19203fab2f82d5f23911ee0aa`
- Git commit subject: `docs: approve phase 01 project assimilation`
- Checkpoint marker: removed; no checkpoint marker remains
- Next phase: `02-domain-business-architecture`; `ENTRY_BLOCKED` by OQ-019
  pending named assignments for every required workshop participant role
- Implementation authorization: none; `IMPLEMENTATION_AUTHORIZED` remains
  `false`

Phase 01 is complete. OQ-001 through OQ-018 and proposed ADR-0006 through
ADR-0008 carry forward unchanged; OQ-019 records the missing named-participant
entry dependency and is not a business decision. The checkpoint-recording edits
made after the commit enter a later explicitly approved checkpoint and do not
trigger an immediate recursive checkpoint.

### APR-004 — Domain and Business Architecture Gate

- Phase: `02-domain-business-architecture`
- Status: `approved`; Git checkpoint pending
- Approval manifest:
  [APR-004-domain-business-architecture.md](approved-baselines/APR-004-domain-business-architecture.md)
- Checkpoint procedure:
  [CHECKPOINT_APR-004.md](../02-domain-business-architecture/CHECKPOINT_APR-004.md)
- Review package:
  [GATE_CHECKLIST.md](../02-domain-business-architecture/GATE_CHECKLIST.md)
- Supporting evidence:
  [SELF_CHECK.md](../02-domain-business-architecture/SELF_CHECK.md),
  [INDEPENDENT_REVIEW.md](../02-domain-business-architecture/INDEPENDENT_REVIEW.md),
  [RECONCILIATION.md](../02-domain-business-architecture/RECONCILIATION.md)
- Approver: Project Owner (explicit approval in Cursor session)
- Approval timestamp: `2026-09-06T00:31:00+03:30`
- Approval scope: Phase 02 design package and ASM-014; no owner-signed
  workshop policy, no technology ADRs beyond ADR-0001, no implementation
- Open downstream items: OQ-001 through OQ-019, proposed ADR-0006 through
  ADR-0008, FIND-001, FIND-003, FIND-004, FIND-020 residual, FIND-023
- Git checkpoint: pending
- Next phase: `03-state-machines-invariants`; `ACTIVE_IN_REVIEW` for
  structure drafting with open guards
- Implementation authorization: none; `IMPLEMENTATION_AUTHORIZED` remains
  `false`

Approving Phase 02 accepts ASM-014. Temporary identities still have no
approval authority. Team answers expected in a few days will update the
matching `OQ-*` rows when they arrive.
