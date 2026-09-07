---
id: REPO-CHECKPOINT-APR-011
title: APR-011 Checkpoint Procedure
phase: 09-repository-documentation
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [APR-011, GOV-GATES-001]
last_reviewed: 2026-09-07
approval: APR-011
supersedes: null
---

# APR-011 Checkpoint Procedure

The Project Owner explicitly approved Phase 09 as APR-011 at
`2026-09-07T21:17:00+03:30`, including ASM-022. The Git checkpoint is
**not** complete until a human creates the short-lived marker and the
agent submits the exact allowed commit.

Do not invent or edit `.cursor/PHASE_CHECKPOINT_APPROVAL.json`.

## Intended commit

```text
docs: approve phase 09 repository documentation
```

After a valid marker exists and the index is empty, the agent submits
only:

```text
git add -A
git commit -m "docs: approve phase 09 repository documentation"
```

Cursor will transform that to the fixed Co-authored-by trailer form. The
marker must store the transformed form.

## Human marker steps

1. Confirm the Git index is empty (`git diff --cached --quiet`).
2. From the repository root, run:

```text
.\.cursor\hooks\generate-phase-checkpoint-marker.ps1 -Phase "09-repository-documentation" -ApprovalManifest "docs/00-governance/approved-baselines/APR-011-repository-documentation.md" -CommitMessage "docs: approve phase 09 repository documentation"
```

3. Tell the agent the marker exists. Do not ask the agent to invent the
   marker.

## Current state

- Gate result: `APPROVED` (structure baseline)
- Phase 09: complete as a structure baseline
- Git checkpoint: pending
- Next phase: `10-ai-cursor-development`; `ACTIVE_IN_REVIEW` for
  structure drafting
- Implementation authorization: none

Do not run this generator for Phase 08. CHK-0009 is already complete.
