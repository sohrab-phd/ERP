---
id: DATA-CHECKPOINT-APR-006
title: APR-006 Checkpoint Procedure
phase: 04-database-architecture
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [APR-006, GOV-GATES-001]
last_reviewed: 2026-09-06
approval: APR-006
supersedes: null
---

# APR-006 Checkpoint Procedure

The Project Owner explicitly approved Phase 04 as APR-006 at
`2026-09-06T19:42:00+03:30`, including ASM-017. The human-controlled
checkpoint completed successfully. This procedure now preserves that
history. It does not authorize another marker, staging action, or commit.

## Intended commit

```text
docs: approve phase 04 database architecture
```

Plain command the agent will submit after a valid marker exists:

```text
git commit -m "docs: approve phase 04 database architecture"
```

Cursor will transform that to the fixed Co-authored-by trailer form. The
marker must store the transformed form.

## Human marker steps

1. Confirm the working tree. Uncommitted Phase 03 (APR-005) files and
   Phase 05 structure drafts started after this approval are not Phase 04
   approved content. If they exist they must still be listed in the
   marker because the generator binds the complete changed-file set.
2. Confirm the Git index is empty.
3. From the repository root, with hooks enabled, run:

```text
.\.cursor\hooks\generate-phase-checkpoint-marker.ps1 -Phase "04-database-architecture" -ApprovalManifest "docs/00-governance/approved-baselines/APR-006-database-architecture.md" -CommitMessage "docs: approve phase 04 database architecture"
```

4. Tell the agent the marker exists. Do not ask the agent to invent or
   edit the marker.

The generator binds SHA-256 and git blob OIDs. The agent must not create
`.cursor/PHASE_CHECKPOINT_APPROVAL.json`.

## Current state

- Gate result: `APPROVED` (logical baseline)
- Phase 04: complete as a logical baseline
- Git checkpoint: completed successfully; 29 files changed
- Git commit: `87f9f10442d58fbd224dce09f46c862eb8707e8f`
- Git commit subject: `docs: approve phase 04 database architecture`
- Checkpoint record:
  [CHK-0004](../00-governance/approved-baselines/CHK-0004-phase-04.md)
- Checkpoint marker: still present; delete
  `.cursor/PHASE_CHECKPOINT_APPROVAL.json`
- Next phase: `05-application-api-architecture`; `ACTIVE_IN_REVIEW`
- Implementation authorization: none

This recording update enters a later explicitly approved checkpoint. It
does not require or authorize an immediate recursive checkpoint.
