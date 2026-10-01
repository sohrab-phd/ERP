---
id: APR-016
title: Codex Tooling Governance Migration Approval
phase: 12-implementation-planning
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [GOV-GATES-001, AI-AUTH-001, APR-015, CHK-0014]
last_reviewed: 2026-10-02
approval: APR-016
supersedes: null
---

# APR-016 — Codex Tooling Governance Migration Approval

- Gate result: `APPROVED`
- Explicit approver: Project Owner (explicit tooling-migration approval in the current Codex request)
- Approval statement: The Project Owner authorized the minimum forward governance/tooling reconciliation from Cursor to Codex, the APR-015/CHK-0014 post-commit record, and no ERP implementation.
- Approval timestamp: `2026-10-02T02:01:27.5965207+03:30`
- Phase: `12-implementation-planning`
- Scope authorized: Agent-authority documentation, truthful future Git attribution, legacy checkpoint-generator and validator alignment, and forward checkpoint evidence. No Codex technical interception is claimed without verification.
- Authorized next phase: none; there is no Phase 13
- Implementation authorization: none; `IMPLEMENTATION_AUTHORIZED` remains `false`
- Git checkpoint: pending
- Git commit: pending
- Supersedes approval: none

The timestamp records this approval during the migration work, not an exact
message-delivery time. This approval records the current request; it is not an
agent-granted implementation authorization.

## Approved scope and evidence

The actual APR-015 checkpoint is
`bb2fb692481ec4d8154cbca8cd694c033883eb05`, with parent/content basis
`ecbe67b00bfe077a44e54e20961ed1f941bfed70`. CHK-0014 records its
Cursor co-author trailer as an audit-attribution discrepancy without changing
that commit. Future Codex checkpoints use the configured Git author and the
human marker plus APR/CHK records as audit evidence. The canonical gate and
human-only marker/unlock remain at their `.cursor/` paths.

The Cursor hook does not intercept Codex merely because its script remains in
the repository. No Codex project hook or AGENTS.md binding is installed in
this checkpoint scope. Codex technical write/shell enforcement remains
unverified and is an implementation-authorization blocker. Codex must follow
the documented policy self-check for authorized governance work.

## Approved artifacts

The approved changed-file set is:

- `.cursor/hooks/architecture-write-gate.ps1` — future command validation
- `.cursor/hooks/generate-phase-checkpoint-marker.ps1` — truthful plain commit command
- `.cursor/hooks/test-architecture-write-gate.ps1` — governance validation cases
- `README.md` — current agent and lock orientation
- `docs/00-governance/APPROVALS.md` — `GOV-APPROVALS-001` version `0.12.0`
- `docs/00-governance/PHASE_GATES.md` — `GOV-GATES-001` version `0.4.0`
- `docs/00-governance/approved-baselines/APR-015-governance-reconciliation.md` — `APR-015` version `0.1.1`, forward recording
- `docs/00-governance/approved-baselines/APR-016-codex-tooling-migration.md` — `APR-016` version `0.1.0`, this manifest
- `docs/00-governance/approved-baselines/CHK-0014-apr-015.md` — `CHK-0014` version `0.1.0`
- `docs/00-governance/approved-baselines/README.md` — `GOV-BASELINES-001` version `0.3.1`
- `docs/00-governance/templates/PHASE_CHECKPOINT_MARKER_TEMPLATE.md` — `TEMPLATE-CHECKPOINT-MARKER` version `0.4.0`
- `docs/10-ai-cursor-development/AGENT_AUTHORITY.md` — `AI-AUTH-001` version `0.5.0`
- `docs/10-ai-cursor-development/README.md` — `PHASE-10` version `0.5.1`
- `docs/10-ai-cursor-development/RULE_AND_SKILL_CATALOGUE.md` — `AI-RULE-001` version `0.5.0`
- `docs/10-ai-cursor-development/TOOL_MCP_HOOK_SAFETY.md` — `AI-TOOL-001` version `0.5.0`
- `docs/12-implementation-planning/IMPLEMENTATION_READINESS.md` — `PLAN-READY-001` version `0.6.0`

The required human-created checkpoint marker must bind this complete
changed-file set, including this manifest, with exact raw SHA-256 digests,
Git blob IDs, modes, and permitted commands. This manifest does not contain
a self-referential digest.

## Closed blockers and accepted ADRs

- Questions: none closed. The matching OPEN_QUESTIONS rows remain authoritative.
- Decisions: none accepted. ADR-0008 remains proposed.
- Findings: no Codex technical-enforcement finding is claimed closed.

## Residual items

- Codex repository instructions and technical write/shell interception are not
  installed, trusted, and verified under the present gate allowlist.
- The current human checkpoint marker is for the completed APR-015 commit and
  cannot authorize this changed-file set. A new human marker is required before
  staging or committing this migration.
- Existing ERP OQs and domain workflow gaps remain as recorded in the live
  register. This tooling approval changes no business rule.
- `.cursor/IMPLEMENTATION_UNLOCK.json` remains absent, and
  `.cursor/architecture-gate.json` remains unauthorized with one canonical
  implementation-authorization state.

## Reopen conditions

Reopen this approval if a Codex hook binding or project instruction path is
added, the canonical gate or marker path changes, technical enforcement is
claimed without verification, a future agent identity is fabricated, the
changed-file set differs from the human marker, or an ERP/OQ/ADR decision is
changed through this tooling record.
