---
id: AI-TOOL-001
title: Tool MCP Hook and Safety Labels
phase: 10-ai-cursor-development
status: approved
version: 0.4.0
owners: [chief-solution-architect]
depends_on: [AI-RULE-001, AI-AUTH-001, APR-011, APR-012]
last_reviewed: 2026-09-07
approval: APR-012
supersedes: null
---

# Tool, MCP, Hook, and Safety Labels

Which tools already exist, and what stays open. This does not install
an MCP server or weaken the write-gate. It does not create an unlock
or checkpoint file.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Present controls

| Control | Safety rule |
| --- | --- |
| `.cursor/architecture-gate.json` | Protected policy; architecture-only; implementation locked |
| Architecture write-gate | Allows docs Markdown and approved Cursor rules/skills; denies application trees, manifests, Docker, CI, and protected unlock/marker files |
| Human checkpoint marker generator | Human-only; empty index; binds the complete changed-file set; expires |
| Implementation unlock file | **Must be human-created**; currently absent |
| Architecture-first + question-pack rules | Always applied; current-phase work only; do not invent `OQ-*` answers |

IDE session tools used for architecture work (browser snapshot, app
control) are not `MCP-EXTRA` products and may not create application
source.

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
An unlock that names `package.json`, Docker, CI, or a path outside the
approved baseline is invalid.

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
5. Browser or shell tools used in this architecture phase may not
   create application source, `package.json`, Dockerfiles, or CI.
6. A write-gate deny is not a prompt to work around the hook.
7. After a valid marker, the agent may run only the marked `git add`
   and the exact `allowedGitCommands` string.
8. Frozen `CHK-*` commits are not amended.
9. `git push`, `git restore`, and `git reset` are not `AG-CHK`.
10. Secrets and `.env` stay out of the tree (`CONF-SECRET` / `HH-SECRET`).

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
- A replacement for the architecture write-gate
- Browser automation as a substitute for Phase 07 `QG-*` evidence
- A secret-store or identity-provider product
- Unlock path lists
