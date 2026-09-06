---
id: APP-CHECKPOINT-APR-007
title: APR-007 Checkpoint Procedure
phase: 05-application-api-architecture
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [APR-007, GOV-GATES-001]
last_reviewed: 2026-09-06
approval: APR-007
supersedes: null
---

# APR-007 Checkpoint Procedure

The Project Owner explicitly approved Phase 05 as APR-007 at
`2026-09-06T20:31:00+03:30`, including ASM-018. The Git checkpoint is
**pending**. This procedure does not authorize a marker invented by the
agent, staging, or a commit until the human-created marker exists.

## Intended commit

```text
docs: approve phase 05 application api architecture
```

Plain command the agent will submit after a valid marker exists:

```text
git commit -m "docs: approve phase 05 application api architecture"
```

Cursor will transform that to the fixed Co-authored-by trailer form. The
marker must store the transformed form.

## Human marker steps

1. Confirm the working tree. Phase 06 security drafts started after this
   approval are authorized work, not Phase 05 approved content. If they
   exist they must still be listed in the marker because the generator
   binds the complete changed-file set. CHK-0004 recording files and any
   still-uncommitted APR-005 files must also be listed.
2. Confirm the Git index is empty.
3. From the repository root, with hooks enabled, run:

```text
.\.cursor\hooks\generate-phase-checkpoint-marker.ps1 -Phase "05-application-api-architecture" -ApprovalManifest "docs/00-governance/approved-baselines/APR-007-application-api-architecture.md" -CommitMessage "docs: approve phase 05 application api architecture"
```

4. Tell the agent the marker exists. Do not ask the agent to invent or
   edit the marker.

The generator binds SHA-256 and git blob OIDs. The agent must not create
`.cursor/PHASE_CHECKPOINT_APPROVAL.json`.

## Current state

- Gate result: `APPROVED` (structure baseline)
- Phase 05: complete as a structure baseline
- Git checkpoint: pending
- Next phase: `06-security-rbac-audit`; `ACTIVE_IN_REVIEW` for structure
  drafting
- Implementation authorization: none
