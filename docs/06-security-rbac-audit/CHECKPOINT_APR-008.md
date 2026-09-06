---
id: SEC-CHECKPOINT-APR-008
title: APR-008 Checkpoint Procedure
phase: 06-security-rbac-audit
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [APR-008, GOV-GATES-001]
last_reviewed: 2026-09-06
approval: APR-008
supersedes: null
---

# APR-008 Checkpoint Procedure

The Project Owner explicitly approved Phase 06 as APR-008 at
`2026-09-06T22:59:00+03:30`, including ASM-019. The Git checkpoint is
**pending**. This procedure does not authorize a marker invented by the
agent, staging, or a commit until the human-created marker exists.

## Intended commit

```text
docs: approve phase 06 security rbac audit
```

Plain command the agent will submit after a valid marker exists:

```text
git commit -m "docs: approve phase 06 security rbac audit"
```

Cursor will transform that to the fixed Co-authored-by trailer form. The
marker must store the transformed form.

## Human marker steps

1. Confirm the working tree. Phase 07 verification drafts started after
   this approval are authorized work, not Phase 06 approved content. If
   they exist they must still be listed in the marker because the
   generator binds the complete changed-file set. CHK-0005 and CHK-0006
   recording files must also be listed if still uncommitted.
2. Confirm the Git index is empty. If `git status` shows **Changes to
   be committed**, run `git restore --staged .` in this PowerShell
   window first. Do not use `git reset --hard`.
3. From the repository root, with hooks enabled, run:

```text
.\.cursor\hooks\generate-phase-checkpoint-marker.ps1 -Phase "06-security-rbac-audit" -ApprovalManifest "docs/00-governance/approved-baselines/APR-008-security-rbac-audit.md" -CommitMessage "docs: approve phase 06 security rbac audit"
```

4. Tell the agent the marker exists. Do not ask the agent to invent or
   edit the marker.

The generator binds SHA-256 and git blob OIDs. The agent must not create
`.cursor/PHASE_CHECKPOINT_APPROVAL.json`.

## Current state

- Gate result: `APPROVED` (structure baseline)
- Phase 06: complete as a structure baseline
- Git checkpoint: pending
- Next phase: `07-testing-quality-architecture`; `ACTIVE_IN_REVIEW` for
  structure drafting
- Implementation authorization: none
