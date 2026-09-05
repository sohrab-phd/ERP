---
id: DOM-CHECKPOINT-APR-004
title: APR-004 Checkpoint Procedure
phase: 02-domain-business-architecture
status: approved
version: 0.2.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [APR-004, GOV-GATES-001]
last_reviewed: 2026-09-06
approval: APR-004
supersedes: null
---

# APR-004 Checkpoint Procedure

The Project Owner explicitly approved Phase 02 as APR-004 at
`2026-09-06T00:31:00+03:30`. The human-controlled checkpoint completed
successfully. This procedure now preserves that history. It does not authorize
another marker, staging action, or commit.

## Intended commit

```text
docs: approve phase 02 domain business architecture
```

Plain command the agent will submit after a valid marker exists:

```text
git commit -m "docs: approve phase 02 domain business architecture"
```

Cursor will transform that to the fixed Co-authored-by trailer form. The marker
must store the transformed form.

## Human marker steps

1. Confirm the working tree. Phase 03 initial drafts started after this
   approval (`docs/03-state-machines-invariants/*` except the prior planned
   README) are authorized work, not Phase 02 approved content. If they exist
   they must still be listed in the marker because the generator binds the
   complete changed-file set.
2. Confirm the Git index is empty.
3. From the repository root, with hooks enabled, run:

```text
.\.cursor\hooks\generate-phase-checkpoint-marker.ps1 -Phase "02-domain-business-architecture" -ApprovalManifest "docs/00-governance/approved-baselines/APR-004-domain-business-architecture.md" -CommitMessage "docs: approve phase 02 domain business architecture"
```

4. Tell the agent the marker exists. Do not ask the agent to invent or edit
   the marker.

The generator binds SHA-256 and git blob OIDs. The agent must not create
`.cursor/PHASE_CHECKPOINT_APPROVAL.json`.

## Current state

- Gate result: `APPROVED`
- Phase 02: complete as a design baseline
- Git checkpoint: completed successfully; 47 files changed
- Git commit: `ec3c210a83a0d8f163bbbb6fadc1e4a28b8bf8db`
- Git commit subject: `docs: approve phase 02 domain business architecture`
- Checkpoint record:
  [CHK-0003](../00-governance/approved-baselines/CHK-0003-phase-02.md)
- Checkpoint marker: still present; delete
  `.cursor/PHASE_CHECKPOINT_APPROVAL.json`
- Next phase: `03-state-machines-invariants`; `ACTIVE_IN_REVIEW`
- Implementation authorization: none

This recording update enters a later explicitly approved checkpoint. It does
not require or authorize an immediate recursive checkpoint.
