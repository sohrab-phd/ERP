---
id: GOV-CHECKPOINT-APR-002
title: APR-002 Checkpoint Procedure
phase: 00-governance
status: approved
version: 0.1.3
owners: [project-sponsor, chief-solution-architect]
depends_on: [APR-002, GOV-GATES-001]
last_reviewed: 2026-09-04
approval: APR-002
supersedes: GOV-CHECKPOINT-APR-001
---

# APR-002 Checkpoint Procedure

The user gave final renewed explicit approval of corrected Phase 00 at
`2026-09-04T16:15:30.3016652+03:30`. The APR-002 checkpoint completed at
`540a606ef32a3cb17f7e886dff3c4dcde82ca4b1`, recording 69 files with subject
`docs: approve phase 00 governance foundation`. Implementation remains
unauthorized and Phase 01 is active in review.

The completed checkpoint history is unchanged. This correction does not restore
hooks, create or modify the protected marker, stage files, or commit. Cleanup of
the protected checkpoint marker remains a human action.

`Project Owner (explicit approval in Cursor session)` approved the FIND-015
post-checkpoint correction and its follow-up checkpoint at
`2026-09-04T16:49:32.2914786+03:30`. The follow-up checkpoint is pending.

## Completed checkpoint procedure

For historical traceability, the completed checkpoint used the approved
procedure below. These are not current instructions:

1. Restore `.cursor/hooks.json` by renaming `.cursor/hooks.disabled`.
2. Fully close and reopen Cursor.
3. In a project terminal, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .cursor/hooks/generate-phase-checkpoint-marker.ps1
```

The script fails closed unless the index is empty, the APR-002 approved manifest
is present, active hooks are restored, APR-002 is in the changed paths, and every
checkpoint path is a regular, non-deleted file. It creates the Git-ignored
protected marker with exact raw-file SHA-256 values, clean-filtered Git blob IDs,
modes, and commands.

## Commands authorized for the completed checkpoint

After human marker generation and while the marker was unexpired, the agent was
authorized to submit these plain commands:

```text
git add -A
git commit -m "docs: approve phase 00 governance foundation"
```

Cursor transforms the submitted commit command before hook evaluation. The
protected marker and hook observe this exact command:

```text
git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>" -m "docs: approve phase 00 governance foundation"
```

The marker stores that exact transformed form. The hook accepts only the plain
command or that exact fixed-trailer form and denies arbitrary trailers. It
revalidates the complete changed set before `git add -A` and the complete staged
set, Git modes, and blob IDs before commit.

## Post-checkpoint

The baseline checkpoint is complete and Phase 01 is active in review. The human
removes `.cursor/PHASE_CHECKPOINT_APPROVAL.json`. The separate follow-up
documentation record is explicitly approved, and its follow-up checkpoint is
pending; no commit containing that follow-up is claimed. Neither checkpoint
authorizes implementation.

The first attempt to authorize that recording follow-up failed closed because
checkpoint validation accepted only pending manifests. FIND-015 now supports
exactly one pending checkpoint with zero valid hash commits, or exactly one
completed checkpoint paired with exactly one valid 40–64 hexadecimal commit.
Mixed, duplicate, missing, and unpaired forms fail closed. The first predicate
revision's mixed-state edge was caught by review, and all 72 tests now pass,
including direct implementation-baseline paired/unpaired backtick cases.

The narrow independent review returned `READY_FOR_CORRECTION_APPROVAL` with no
blocker. The Project Owner subsequently gave the explicit correction and
follow-up checkpoint approval recorded above. No follow-up staging or commit is
claimed, no APR-003 is created, and APR-002 remains the approved committed
Phase 00 baseline.
