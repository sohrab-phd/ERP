---
id: AI-CHECKPOINT-APR-012
title: APR-012 Checkpoint Procedure
phase: 10-ai-cursor-development
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [APR-012, GOV-GATES-001]
last_reviewed: 2026-09-07
approval: APR-012
supersedes: null
---

# APR-012 Checkpoint Procedure

The Project Owner explicitly approved Phase 10 as APR-012 at
`2026-09-07T21:52:00+03:30`, including ASM-023. The Git checkpoint is
**not** complete until a human creates the short-lived marker and the
agent submits the exact allowed commit.

Do not invent or edit `.cursor/PHASE_CHECKPOINT_APPROVAL.json`.

## Intended commit

```text
docs: approve phase 10 ai cursor development
```

After a valid marker exists and the index is empty, the agent submits
only:

```text
git add -A
git commit -m "docs: approve phase 10 ai cursor development"
```

Cursor will transform that to the fixed Co-authored-by trailer form. The
marker must store the transformed form.

## Human marker steps

1. Confirm the Git index is empty (`git diff --cached --quiet`).
2. From the repository root, run:

```text
.\.cursor\hooks\generate-phase-checkpoint-marker.ps1 -Phase "10-ai-cursor-development" -ApprovalManifest "docs/00-governance/approved-baselines/APR-012-ai-cursor-development.md" -CommitMessage "docs: approve phase 10 ai cursor development"
```

3. Tell the agent the marker exists. Do not ask the agent to invent the
   marker.

## Current state

- Gate result: `APPROVED` (structure baseline)
- Phase 10: complete as a structure baseline
- Git checkpoint: pending
- Next phase: `11-architecture-validation`; `ACTIVE_IN_REVIEW` for
  structure drafting
- Implementation authorization: none

Do not run this generator for Phase 09. CHK-0010 is already complete.
