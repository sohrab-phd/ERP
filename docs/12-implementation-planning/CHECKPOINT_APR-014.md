---
id: PLAN-CHECKPOINT-APR-014
title: APR-014 Checkpoint Procedure
phase: 12-implementation-planning
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [APR-014, GOV-GATES-001]
last_reviewed: 2026-09-07
approval: APR-014
supersedes: null
---

# APR-014 Checkpoint Procedure

The Project Owner explicitly approved Phase 12 as APR-014 at
`2026-09-07T23:16:00+03:30`, including ASM-025. The Git checkpoint is
**not** complete until a human creates the short-lived marker and the
agent submits the exact allowed commit.

Do not invent or edit `.cursor/PHASE_CHECKPOINT_APPROVAL.json`.

## Intended commit

```text
docs: approve phase 12 implementation planning
```

After a valid marker exists and the index is empty, the agent submits
only:

```text
git add -A
git commit -m "docs: approve phase 12 implementation planning"
```

Cursor will transform that to the fixed Co-authored-by trailer form. The
marker must store the transformed form.

## Human marker steps

1. Confirm the Git index is empty (`git diff --cached --quiet`).
2. From the repository root, run:

```text
.\.cursor\hooks\generate-phase-checkpoint-marker.ps1 -Phase "12-implementation-planning" -ApprovalManifest "docs/00-governance/approved-baselines/APR-014-implementation-planning.md" -CommitMessage "docs: approve phase 12 implementation planning"
```

3. Tell the agent the marker exists. Do not ask the agent to invent the
   marker.

## Current state

- Gate result: `APPROVED` (structure baseline)
- Phase 12: complete as a structure baseline
- Git checkpoint: pending
- Next phase: none; there is no Phase 13
- Implementation authorization: none; a later human unlock is still
  required
