---
id: APR-012
title: AI and Cursor Development Architecture Approval
phase: 10-ai-cursor-development
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [AI-GATE-CHECKLIST-001, AI-RECON-001, ASM-023]
last_reviewed: 2026-09-07
approval: APR-012
supersedes: null
---

# APR-012 — AI and Cursor Development Architecture Approval

- Gate result: `APPROVED`
- Explicit approver: Project Owner (explicit approval in Cursor session)
- Approval statement: Explicit approval of the Phase 10 AI/Cursor
  Development Architecture **structure** design-gate package, including
  ASM-023
- Approval timestamp: `2026-09-07T21:52:00+03:30`
- Phase: `10-ai-cursor-development`
- Scope authorized: Agent authority kinds, existing Cursor control
  catalogue, implementation-prompt standards, review kinds, tool/MCP/
  hook safety labels, and generated-code acceptance labels — all with
  extra MCP/tool products and named agent approvers left as open
  extensions
- Authorized next phase: `11-architecture-validation` for integrated
  review **structure** drafting
- Implementation authorization: none; `IMPLEMENTATION_AUTHORIZED` remains
  `false`
- Git checkpoint: pending
- Git commit: pending
- Git commit subject: `docs: approve phase 10 ai cursor development`
- Supersedes approval: none

## Approval boundary

APR-012 approves the Phase 10 **structure** package as the baseline for
Phase 11 validation work. It accepts ASM-023: extra MCP/tool products
and named agent approvers remain unanswered; no application source,
unlock file, extra MCP install, or package manifest is written.
Existing architecture-first Cursor controls remain labels, not an
implementation unlock.

It does **not** approve:

- extra MCP servers or a vendor agent-runtime product
- named agent operators or named human approvers
- an implementation unlock file or unlock path list
- ADR-0006, ADR-0007, or ADR-0008
- application source folders, lockfiles, or implementation
- starting Phase 11 application proof

OQ-001 through OQ-019 remain unanswered or `treating`.

## Approved evidence package

- `docs/00-governance/approved-baselines/APR-012-ai-cursor-development.md` — `APR-012` — version `0.1.0`
- `docs/10-ai-cursor-development/README.md` — `PHASE-10`
- `docs/10-ai-cursor-development/AGENT_AUTHORITY.md` — `AI-AUTH-001`
- `docs/10-ai-cursor-development/RULE_AND_SKILL_CATALOGUE.md` — `AI-RULE-001`
- `docs/10-ai-cursor-development/IMPLEMENTATION_PROMPT_STANDARDS.md` — `AI-PROMPT-001`
- `docs/10-ai-cursor-development/HUMAN_AND_INDEPENDENT_REVIEW.md` — `AI-REVIEW-001`
- `docs/10-ai-cursor-development/TOOL_MCP_HOOK_SAFETY.md` — `AI-TOOL-001`
- `docs/10-ai-cursor-development/GENERATED_CODE_ACCEPTANCE.md` — `AI-ACCEPT-001`
- `docs/10-ai-cursor-development/SELF_CHECK.md` — `AI-SELF-CHECK-001`
- `docs/10-ai-cursor-development/INDEPENDENT_REVIEW.md` — `AI-INDEP-REVIEW-001`
- `docs/10-ai-cursor-development/RECONCILIATION.md` — `AI-RECON-001`
- `docs/10-ai-cursor-development/GATE_CHECKLIST.md` — `AI-GATE-CHECKLIST-001`
- `docs/10-ai-cursor-development/PHASE11_HANDOFF.md` — `AI-P11-HANDOFF-001`
- `docs/10-ai-cursor-development/CHECKPOINT_APR-012.md` — `AI-CHECKPOINT-APR-012`

Phase 11 validation drafts started after this approval are **not**
approved by this gate. If they exist at marker creation they must still
be listed in the human-created checkpoint marker because the generator
binds the complete changed-file set. CHK-0010 recording files, if still
uncommitted, must also be listed.

Exact SHA-256 digests belong in the human-created checkpoint marker.

## Closed blockers and accepted ADRs

- Questions: none closed. OQ-010 and OQ-019 remain `treating`.
- Decisions: none accepted beyond existing ADR-0001.
- Findings: FIND-036 resolved in the register sense by accepting ASM-023.
- Assumptions: ASM-023 accepted at `2026-09-07T21:52:00+03:30`.

## Residual items

- OQ-001 through OQ-019 remain open or `treating`.
- ADR-0006 through ADR-0008 remain proposed.
- Extra-MCP and named-approver ADRs remain later work.
- Git checkpoint pending.

## Reopen conditions

Reopen APR-012 if an approved `AG-UNLOCK`-never rule, human-only
checkpoint/unlock treatment, `REV-AGENT`-cannot-approve rule,
DATA-TX-001 unsplittable `TASK-IMPL` rule, or open-extension treatment
is reversed, or if an unanswered OQ is later shown to have been
silently closed by this approval.
