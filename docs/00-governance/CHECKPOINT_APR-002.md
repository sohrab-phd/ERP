---
id: GOV-CHECKPOINT-APR-002
title: APR-002 Checkpoint Procedure
phase: 00-governance
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [APR-002, GOV-GATES-001]
last_reviewed: 2026-09-04
approval: APR-002
supersedes: GOV-CHECKPOINT-APR-001
---

# APR-002 Checkpoint Procedure

The user gave final renewed explicit approval of corrected Phase 00 at
`2026-09-04T16:15:30.3016652+03:30`. The APR-002 checkpoint is pending.
No staging or commit is claimed. Implementation remains unauthorized and
Phase 01 remains inactive.

`.cursor/hooks.disabled` remains the maintenance state. This record does not
restore hooks, create or modify the protected marker, stage files, or commit.
The existing marker is stale and must be left untouched until a human
deliberately regenerates it through this procedure.

## Human checkpoint preparation

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

## Authorized commands

After human marker generation and while the marker is unexpired, the agent
submits these plain commands:

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

The human removes `.cursor/PHASE_CHECKPOINT_APPROVAL.json` afterward. A
separately approved follow-up documentation checkpoint records the resulting
commit and activates Phase 01. Neither checkpoint authorizes implementation.
