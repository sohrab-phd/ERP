---
id: AI-TOOL-001
title: Tool MCP Hook and Safety Labels
phase: 10-ai-cursor-development
status: in_review
version: 0.2.0
owners: [chief-solution-architect]
depends_on: [AI-RULE-001, AI-AUTH-001, APR-011]
last_reviewed: 2026-09-07
approval: null
supersedes: null
---

# Tool, MCP, Hook, and Safety Labels

Which tools already exist, and what stays open. This does not install
an MCP server or weaken the write-gate.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Present controls

| Control | Safety rule |
| --- | --- |
| Architecture write-gate | Allows docs Markdown and approved Cursor rules/skills; denies application trees, manifests, Docker, CI, and protected unlock/marker files |
| Human checkpoint marker generator | Human-only; empty index; binds the complete changed-file set; expires |
| Implementation unlock file | **Must be human-created**; currently absent |
| Architecture-first + question-pack rules | Always applied; current-phase work only; do not invent `OQ-*` answers |

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

## MCP and tool extensions (open)

| Label | Meaning | Status |
| --- | --- | --- |
| `MCP-EXTRA` | Additional MCP servers (observability, Git hosting, chat, browsers beyond the architecture phase) | Open (OQ-018) |
| `TOOL-CI` | CI product hooks | Open (OQ-018) |
| `TOOL-SCAN` | Generated-code scanners | Open |
| `TOOL-SECRET` | Secret-store product (`HH-SECRET` / `CONF-SECRET`) | Open |

Installing any of those now would silently close OQ-018.

## Must not decide here

- Datadog, GitHub, Slack, or other MCP products
- A replacement for the architecture write-gate
- Browser automation as a substitute for Phase 07 `QG-*` evidence
- A secret-store or identity-provider product
