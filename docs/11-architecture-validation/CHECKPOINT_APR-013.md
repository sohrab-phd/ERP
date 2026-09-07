---
id: VAL-CHECKPOINT-APR-013
title: APR-013 Checkpoint Procedure
phase: 11-architecture-validation
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [APR-013, GOV-GATES-001]
last_reviewed: 2026-09-07
approval: APR-013
supersedes: null
---

# APR-013 Checkpoint Procedure

The Project Owner explicitly approved Phase 11 as APR-013 at
`2026-09-07T22:19:00+03:30`, including ASM-024. The Git checkpoint is
**not** complete until a human creates the short-lived marker and the
agent submits the exact allowed commit.

Do not invent or edit `.cursor/PHASE_CHECKPOINT_APPROVAL.json`.

## Intended commit

```text
docs: approve phase 11 architecture validation
```

After a valid marker exists and the index is empty, the agent submits
only:

```text
git add -A
git commit -m "docs: approve phase 11 architecture validation"
```

Cursor will transform that to the fixed Co-authored-by trailer form. The
marker must store the transformed form.

## Human marker steps

1. Confirm the Git index is empty (`git diff --cached --quiet`).
2. From the repository root, run:

```text
.\.cursor\hooks\generate-phase-checkpoint-marker.ps1 -Phase "11-architecture-validation" -ApprovalManifest "docs/00-governance/approved-baselines/APR-013-architecture-validation.md" -CommitMessage "docs: approve phase 11 architecture validation"
```

3. Tell the agent the marker exists. Do not ask the agent to invent the
   marker.

## Current state

- Gate result: `APPROVED` (structure baseline)
- Phase 11: complete as a structure baseline
- Git checkpoint: pending
- Next phase: `12-implementation-planning`; `ACTIVE_IN_REVIEW` for
  structure drafting
- Implementation authorization: none
