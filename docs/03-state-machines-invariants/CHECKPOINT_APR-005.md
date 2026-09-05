---
id: SM-CHECKPOINT-APR-005
title: APR-005 Checkpoint Procedure
phase: 03-state-machines-invariants
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [APR-005, GOV-GATES-001]
last_reviewed: 2026-09-06
approval: APR-005
supersedes: null
---

# APR-005 Checkpoint Procedure

The Project Owner explicitly approved Phase 03 as APR-005 at
`2026-09-06T01:18:00+03:30`, including ASM-016. The Git checkpoint is
**pending**. This procedure does not authorize a marker invented by the
agent, staging, or a commit until the human-created marker exists.

## Intended commit

```text
docs: approve phase 03 state machines and invariants
```

Plain command the agent will submit after a valid marker exists:

```text
git commit -m "docs: approve phase 03 state machines and invariants"
```

Cursor will transform that to the fixed Co-authored-by trailer form. The
marker must store the transformed form.

## Human marker steps

1. Confirm the working tree. Phase 04 logical drafts started after this
   approval (`docs/04-database-architecture/*` beyond the prior planned
   README) are authorized work, not Phase 03 approved content. If they
   exist they must still be listed in the marker because the generator
   binds the complete changed-file set.
2. Confirm the Git index is empty.
3. From the repository root, with hooks enabled, run:

```text
.\.cursor\hooks\generate-phase-checkpoint-marker.ps1 -Phase "03-state-machines-invariants" -ApprovalManifest "docs/00-governance/approved-baselines/APR-005-state-machines-invariants.md" -CommitMessage "docs: approve phase 03 state machines and invariants"
```

4. Tell the agent the marker exists. Do not ask the agent to invent or
   edit the marker.

The generator binds SHA-256 and git blob OIDs. The agent must not create
`.cursor/PHASE_CHECKPOINT_APPROVAL.json`.

## Current state

- Gate result: `APPROVED`
- Phase 03: approved as a structure baseline
- Git checkpoint: pending
- Next phase: `04-database-architecture`; `ACTIVE_IN_REVIEW` for logical
  drafting
- Implementation authorization: none
