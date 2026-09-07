---
id: VAL-INT-001
title: Independent Integrated Review
phase: 11-architecture-validation
status: in_review
version: 0.1.0
owners: [independent-reviewer]
depends_on: [APR-012, ASM-024]
last_reviewed: 2026-09-07
approval: null
supersedes: null
---

# Independent Integrated Review

A Phase 11 **structure** pass across Phases 02–10. This is not Phase 11
gate approval, not a named reviewer (OQ-019), and not application
proof.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Method

Read-only consistency across approved baselines APR-004 through
APR-012. Same-session authorship is an independence limit. No code,
unlock, or extra MCP was generated to “verify” the design.

## Integrated claims that hold as structure

1. One stock writer: Inventory Posting / `ACT-IPS` writes Ledger.
   Quality, Shipping, Sales, Procurement, Production, and adapters
   command; they do not write stock tables.
2. Balance and Genealogy are rebuildable projections. `EditGenealogy`
   and `AdjustBalance` are forbidden (`CONF-FORBID`).
3. DATA-TX-001 bundles are unsplittable on commands, adapters, and
   later `TASK-IMPL`.
4. UI is not a trust boundary (INV-015). Worker identity is not the
   commander (SV-009).
5. Customer isolation applies to exports, events, live notices, and
   reports (SV-012 / `CONF-ISO`).
6. MVP portal order write is rejected (INV-020). Finance-Lite is not
   legal GL (ASM-010).
7. Agents draft; humans approve. Checkpoint markers and unlock files
   are human-only. `REV-AGENT` cannot approve architecture.
8. Node.js + TypeScript remains the only accepted technology ADR.

## Open guards (not defects of this pass)

Unanswered OQ-001 through OQ-019 remain `GUARD_OPEN_POLICY` on the
commands that need them. FIND-028 forbids minting `TEST-*`. Named
people stay OQ-019. Products stay OQ-018.

## Verdict of this pass

No in-scope Critical/High **structure contradiction** was found among
the approved baselines. FIND-037 remains `treating` until the Project
Owner accepts or rejects ASM-024 at the Phase 11 gate.

## Must not decide here

- Closing any `OQ-*`
- A named independent reviewer product
- Application code as evidence
