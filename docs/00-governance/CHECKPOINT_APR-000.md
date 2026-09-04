---
id: GOV-CHECKPOINT-APR-000
title: APR-000 Checkpoint Procedure
phase: 00-governance
status: superseded
version: 0.1.1
owners: [project-sponsor, chief-solution-architect]
depends_on: [APR-000, GOV-GATES-001]
last_reviewed: 2026-09-04
approval: APR-000
supersedes: null
---

# APR-000 Checkpoint Procedure

> Superseded by [CHECKPOINT_APR-001.md](CHECKPOINT_APR-001.md). Do not use this
> historical APR-000 procedure to generate a checkpoint marker.

The user explicitly approved Phase 00 at
`2026-09-04T14:50:09.3534142+03:30`. Implementation remains unauthorized.

## Human checkpoint preparation

1. Restore `.cursor/hooks.json` by renaming `.cursor/hooks.disabled`.
2. Fully close and reopen Cursor.
3. In a project terminal, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .cursor/hooks/generate-phase-checkpoint-marker.ps1
```

The script fails closed unless the index is empty, the approved manifest is
present, active hooks are restored, and every checkpoint path is a regular,
non-deleted file. It creates the Git-ignored protected marker with exact
raw-file SHA-256 values, clean-filtered Git blob IDs, modes, and commands.

## Authorized commands

After the marker is created and while it is unexpired, the agent may run only:

```text
git add -A
git commit -m "docs: approve phase 00 governance foundation"
```

The hook revalidates the complete changed set before staging and the complete
staged set, Git modes, and blob IDs before commit.

## Post-checkpoint

The human removes `.cursor/PHASE_CHECKPOINT_APPROVAL.json`. A separately approved
follow-up documentation checkpoint records the resulting commit and activates
Phase 01. Neither checkpoint authorizes implementation.
