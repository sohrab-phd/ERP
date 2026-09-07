---
id: AI-RULE-001
title: Rule and Skill Catalogue
phase: 10-ai-cursor-development
status: approved
version: 0.4.0
owners: [chief-solution-architect]
depends_on: [AI-AUTH-001, APR-011, APR-012]
last_reviewed: 2026-09-07
approval: APR-012
supersedes: null
---

# Rule and Skill Catalogue

Existing Cursor controls that already encode the architecture-first
gate. Extra skills or MCP remain OQ-018 (`MCP-EXTRA`). This catalogue
does not replace the write-gate and does not authorize implementation.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Present now (do not expand as products)

| Path | Role |
| --- | --- |
| `.cursor/architecture-gate.json` | Protected policy: architecture-only lock; checkpoint and unlock field labels |
| `.cursor/rules/00-architecture-first.mdc` | Implementation lock; current-phase work only; Node.js + TypeScript is the only accepted tech ADR |
| `.cursor/rules/01-phase-question-pack.mdc` | After each gate, publish unanswered `OQ-*`; do not invent answers; continue authorized work |
| `.cursor/hooks/architecture-write-gate.ps1` | Write/shell gate: docs Markdown and approved Cursor controls only; checkpoint Git only after a valid human marker |
| `.cursor/hooks/generate-phase-checkpoint-marker.ps1` | Human-only checkpoint marker; empty Git index required |

These five paths are the Phase 10 **present** control set. They are
labels of what already operates. They are not an implementation unlock
and not a second write-gate product.

## Control kinds (labels)

| Kind | Meaning | Open |
| --- | --- | --- |
| `RULE-GATE` | Protected architecture-gate policy file | Replacement product forbidden |
| `RULE-ARCH` | Always-applied architecture-first rule | — |
| `RULE-QPACK` | Always-applied question-pack rule | — |
| `HOOK-WRITE` | Architecture write-gate | Replacement product forbidden |
| `HOOK-MARKER` | Human checkpoint-marker generator | Agent must not invent the JSON |
| `SKILL-IMPL` | Later implementation skill after unlock | Unlock paths; frameworks OQ-018 |
| `SKILL-TEST` | Later test skill | Runner OQ-018; no `TEST-*` IDs |
| `MCP-EXTRA` | Additional MCP servers | Product OQ-018 |

Do not add application-coding skills that imply NestJS, Prisma, Jest,
Playwright, Docker, or a package manager as decided.

## Standing catalogue rules

1. New `.cursor/rules/` files may encode an **already approved** gate.
   They may not silently close an `OQ-*` or accept an ADR.
2. New `.cursor/skills/` files wait on implementation unlock except
   architecture-documentation skills that stay inside `docs/`.
3. Extra MCP installs are `MCP-EXTRA` and stay unanswered.
4. Browser, shell, and IDE tools used during architecture work may not
   create application source, `package.json`, Dockerfiles, or CI.
5. The write-gate remaining closed on a blocked command is success, not
   a defect to bypass.
6. Agents must not invent or edit the protected policy file, the
   checkpoint marker, or the implementation unlock.

## Must not decide here

- Extra MCP vendors (Datadog, GitHub, Slack, or others)
- A second write-gate product
- Cursor Cloud / background-agent products as the implementation host
- Named skill maintainers (OQ-019)
