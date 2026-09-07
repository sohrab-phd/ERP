---
id: INT-CHECKPOINT-APR-010
title: APR-010 Checkpoint Procedure
phase: 08-integration-deployment
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [APR-010, GOV-GATES-001]
last_reviewed: 2026-09-07
approval: APR-010
supersedes: null
---

# APR-010 Checkpoint Procedure

The Project Owner explicitly approved Phase 08 as APR-010 at
`2026-09-07T01:28:00+03:30`, including ASM-021. The Git checkpoint is
**not** complete until a human creates the short-lived marker and the
agent submits the exact allowed commit.

Do not invent or edit `.cursor/PHASE_CHECKPOINT_APPROVAL.json`.

## Intended commit

```text
docs: approve phase 08 integration deployment
```

After a valid marker exists and the index is empty, the agent submits
only:

```text
git add -A
git commit -m "docs: approve phase 08 integration deployment"
```

Cursor will transform that to the fixed Co-authored-by trailer form. The
marker must store the transformed form.

## Human marker steps

1. Confirm the Git index is empty (`git diff --cached --quiet`).
2. From the repository root, run:

```text
.\.cursor\hooks\generate-phase-checkpoint-marker.ps1 -Phase "08-integration-deployment" -ApprovalManifest "docs/00-governance/approved-baselines/APR-010-integration-deployment.md" -CommitMessage "docs: approve phase 08 integration deployment"
```

3. Tell the agent the marker exists. Do not ask the agent to invent the
   marker.

## Current state

- Gate result: `APPROVED` (structure baseline)
- Phase 08: complete as a structure baseline
- Git checkpoint: pending
- Next phase: `09-repository-documentation`; `ACTIVE_IN_REVIEW` for
  structure drafting
- Implementation authorization: none

Do not run this generator for Phase 07. CHK-0008 is already complete.
