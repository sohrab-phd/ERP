---
id: PHASE-10
title: AI and Cursor Development Architecture
phase: 10-ai-cursor-development
status: approved
version: 0.5.0
owners: [chief-solution-architect, development-lead]
depends_on: [PHASE-09, APR-011, APR-012, REPO-P10-HANDOFF-001, ASM-023]
last_reviewed: 2026-09-07
approval: APR-012
supersedes: null
---

# Phase 10 — AI/Cursor Development Architecture

## Gate

Gate status: `APPROVED`

Lifecycle: `approved`

Approval: `APR-012` at `2026-09-07T21:52:00+03:30`, including ASM-023
(structure baseline)

Git checkpoint: pending. See
[CHECKPOINT_APR-012.md](CHECKPOINT_APR-012.md).

Phase 11 is authorized for **structure** drafting. Team answers remain
open. `IMPLEMENTATION_AUTHORIZED` remains `false`.

## Purpose

Define how AI agents may implement approved architecture, which
decisions require human approval, and which project rules, skills,
hooks, tools, and evidence are required — as **labels**, without
creating application source.

## Planned artifacts

- [x] [Agent authority and escalation](AGENT_AUTHORITY.md)
- [x] [Rule and skill catalogue](RULE_AND_SKILL_CATALOGUE.md)
- [x] [Implementation-prompt standards](IMPLEMENTATION_PROMPT_STANDARDS.md)
- [x] [Human and independent review](HUMAN_AND_INDEPENDENT_REVIEW.md)
- [x] [Tool, MCP, hook, and safety labels](TOOL_MCP_HOOK_SAFETY.md)
- [x] [Generated-code acceptance](GENERATED_CODE_ACCEPTANCE.md)
- [ ] Extra MCP/tool product ADRs — **not** in this baseline; OQ-018
- [x] [Self-check](SELF_CHECK.md)
- [x] [Independent review](INDEPENDENT_REVIEW.md)
- [x] [Reconciliation](RECONCILIATION.md)
- [x] [Gate checklist](GATE_CHECKLIST.md)
- [x] [Phase 11 handoff](PHASE11_HANDOFF.md)
- [x] [APR-012 checkpoint procedure](CHECKPOINT_APR-012.md)

## Entry criteria

- [x] Phase 09 is approved (APR-011).
- [x] Phase 09 Git checkpoint — completed at
  `81aef0e7bc217cf5172b1f64edf13848b6242bb2` (CHK-0010).

## How this phase works while answers are still arriving

Name agent authority, existing Cursor controls, and later prompt
standards. Do not invent an unlock file. Do not create application
folders. Do not choose extra MCP products.

## Exit criteria

- Agents cannot silently change architecture or business rules **or**
  the prohibition is an explicit label.
- Every later implementation task must reference approved design
  artifacts.
- Tooling stays the existing architecture-first controls plus open
  extensions.
- The user explicitly approved Phase 10 as APR-012.

`IMPLEMENTATION_AUTHORIZED` remains `false`.
