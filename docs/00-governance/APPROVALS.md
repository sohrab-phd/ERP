---
id: GOV-APPROVALS-001
title: Approval and Checkpoint Register
phase: 00-governance
status: approved
version: 0.4.3
owners: [project-sponsor, chief-solution-architect]
depends_on: [GOV-GATES-001]
last_reviewed: 2026-09-04
approval: APR-002
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
approved baseline, and the baseline checkpoint is complete. Cleanup of the
protected checkpoint marker remains a human action.

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
- Follow-up Git checkpoint: approved and pending; no staging or commit claimed
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
follow-up checkpoint remains pending.
