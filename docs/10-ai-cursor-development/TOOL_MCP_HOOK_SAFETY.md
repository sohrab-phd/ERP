---
id: AI-TOOL-001
title: Tool MCP Hook and Safety Labels
phase: 10-ai-cursor-development
status: in_review
version: 0.10.0
owners: [chief-solution-architect]
depends_on: [AI-RULE-001, AI-AUTH-001, APR-011, APR-012]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Tool, MCP, Hook, and Safety Labels

## Current decision (2026-10-04)

ADR-0012 and [trusted-agent governance](TRUSTED_AGENT_OPERATING_MODEL.md) control.
The Owner retired the obsolete Codex micro-governance registration: `.codex/hooks.json`
has `"PreToolUse": []`. After Codex restarted, repository search and canonical
source reads succeeded. Ordinary research, diagnostics, tests, subagents and
planning use native Codex permissions; no new hook or exact tool/read allowlist.

The implementation lock is trusted-agent governance, not adversarial OS proof.
No native installer, ACL, ProgramData, task/pipe/process or reparse attack work is
required or authorized. [Native evidence](NATIVE_AUTONOMY_TRANSITION.md) is retired
history, not a current blocker. Actual native tool denials must still be honored.

Canonical gate, human baseline/approval, final unlock and checkpoint evidence
remain human-only. Codex never synthesizes or activates them. Tool access or
readiness is not authorization. Implementation remains false/null, unlock absent.
ADR-0011/0013 govern delegated technical design, not human baseline acceptance.

APR-016 approved earlier historical tooling bytes, not this current revision.

## Present governance controls

| Control | Current obligation |
| --- | --- |
| .cursor/architecture-gate.json | Canonical authorization; implementation false, approvedBaseline null |
| Implementation unlock | Human-created, matching approved baseline and exact grant; absent |
| Human approval/checkpoint evidence | Never agent-fabricated or changed; separate human procedure |
| AGENTS.md / current phase / live registers | Trusted engineering instructions; preserve business answers and scoped technical decisions |
| Native Codex permissions | Ordinary sandbox/reviewer/audit; no claim malicious-agent containment |
| Legacy Cursor/Codex hook scripts | Historical sources; Codex micro-governance registration retired, not an ERP readiness test |

## Later human unlock (labels; file absent)

A later `.cursor/IMPLEMENTATION_UNLOCK.json` is valid only if a human
created it and it names at least:

| Field | Meaning |
| --- | --- |
| `approvedBy` | Named person (OQ-019) or Project Owner |
| `approvedAt` | Timestamp |
| `approvedBaseline` | An `APR-*` under `docs/00-governance/approved-baselines/` |
| `allowedWritePaths` | Exact paths; minimum one |
| `allowedShellCommands` | Exact commands; no `;`, `|`, or redirection |

The agent (`AG-UNLOCK`) must not invent, edit, or complete this file.
An unlock that names a path/dependency outside the human-approved exact
first-slice baseline is invalid. Proposed root package/config files may appear
in that future baseline only after technical freeze and final human approval.
They do not exist under the current lock.

## Later human checkpoint marker (labels)

A `.cursor/PHASE_CHECKPOINT_APPROVAL.json` remains human-only. Required
fields stay those already enforced: approver, times, phase, manifest,
manifest SHA-256, artifact digests/blob IDs, and exact Git commands.
The agent runs only the marked `git add` and the exact commit string.

## Safety standing rules

1. Do not invent `.cursor/PHASE_CHECKPOINT_APPROVAL.json`.
2. Do not invent `.cursor/IMPLEMENTATION_UNLOCK.json`.
3. Do not skip hooks (`--no-verify` is forbidden unless a later human
   rule explicitly says otherwise; none does).
4. Extra MCP/tool products stay OQ-018 (`MCP-EXTRA`).
5. Browser or shell tools may not create ERP application source, root/product
   package files, Dockerfiles or product CI. Confined non-product tooling is
   permitted only within its effective authorization.
6. A write-gate deny is not a prompt to work around the hook.
7. After a valid marker, the agent may run only the marked `git add`
   and the exact `allowedGitCommands` string.
8. Frozen `CHK-*` commits are not amended.
9. `git push`, `git restore`, and `git reset` are not `AG-CHK`.
10. Secrets and `.env` stay out of the tree (`CONF-SECRET` / `HH-SECRET`).

Rules requiring human markers apply to human-approved baseline checkpoints;
ordinary delegated GCP governance records follow the current APPROVALS policy.
Operational read/diagnostic/test policy maintenance is delegated only within
functioning controls, not permission to bypass a denial. Final human package
must expand external write rights to exactly the first slice as well as create
matching gate/unlock state. No technical enforcement or security PASS is claimed
from a proposed permission contract.

## MCP and tool extensions (open)

| Label | Meaning | Status |
| --- | --- | --- |
| `MCP-EXTRA` | Additional MCP servers (observability, Git hosting, chat, extra browsers) | Open (OQ-018) |
| `TOOL-CI` | CI product hooks | Open (OQ-018) |
| `TOOL-SCAN` | Generated-code scanners | Open |
| `TOOL-SECRET` | Secret-store product (`HH-SECRET` / `CONF-SECRET`) | Open |

Installing any of those now would silently close OQ-018.

## Must not decide here

- Datadog, GitHub, Slack, or other MCP products
- Agent activation of a protected Tier-0 replacement; preparing a reviewed
  replacement proposal is permitted
- Browser automation as a substitute for Phase 07 `QG-*` evidence
- A secret-store or identity-provider product
- Agent creation/activation of the final unlock; proposed exact future scopes
  are permitted planning work
