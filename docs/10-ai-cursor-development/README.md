---
id: PHASE-10
title: AI and Cursor Development Architecture
phase: 10-ai-cursor-development
status: in_review
version: 0.3.0
owners: [chief-solution-architect, development-lead]
depends_on: [PHASE-09, APR-011, REPO-P10-HANDOFF-001, ASM-023]
last_reviewed: 2026-09-07
approval: null
supersedes: null
---

# Phase 10 — AI/Cursor Development Architecture

## Gate

Gate status: `READY_FOR_HUMAN_APPROVAL`

Lifecycle: `in_review`

Approval: `null`

Phase 09 is approved as APR-011. This package is a **structure** gate,
including proposed ASM-023 (extra MCP/tool products and named agent
approvers remain open).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

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
- [ ] Extra MCP/tool product ADRs — **not** in this draft; OQ-018
- [x] [Self-check](SELF_CHECK.md)
- [x] [Independent review](INDEPENDENT_REVIEW.md)
- [x] [Reconciliation](RECONCILIATION.md)
- [x] [Gate checklist](GATE_CHECKLIST.md)
- [x] [Phase 11 handoff](PHASE11_HANDOFF.md)

## Entry criteria

- [x] Phase 09 is approved (APR-011).
- [ ] Phase 09 Git checkpoint — pending APR-011 marker (CHK-0010).
      Completing CHK-0010 is parallel work, not a content blocker for
      this structure package.

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
- The user explicitly approves Phase 10.

`IMPLEMENTATION_AUTHORIZED` remains `false`.
