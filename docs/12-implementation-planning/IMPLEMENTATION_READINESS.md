---
id: PLAN-READY-001
title: Implementation Readiness Checklist
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [chief-solution-architect, delivery-lead]
depends_on: [APR-013, ASM-025, CONF-UNLOCK]
last_reviewed: 2026-09-07
approval: null
supersedes: null
---

# Implementation Readiness Checklist

Labels for what must be true before a later human unlock. This is not
the unlock and not a `TEST-*` catalogue.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Already true as approved structure

- [x] Phases 01–11 approved as structure (APR-003 through APR-013).
- [x] One Ledger writer (`ACT-IPS` / `mod-inventory-posting`).
- [x] DATA-TX-001 bundles named and unsplittable.
- [x] Forbidden writes: `EditGenealogy`, `AdjustBalance`, MVP
      `PortalPlaceOrder`.
- [x] `AG-UNLOCK` never; checkpoint markers human-only.
- [x] Node.js + TypeScript is the only accepted technology ADR.

## Still required later (open extensions)

| Ready item | Wait on |
| --- | --- |
| Phase 11 Git freeze | APR-013 marker / CHK-0012 |
| Named people on SoD, UAT, cutover sign-off | OQ-019 |
| UOM, Coil qty, routing, tracking, QC, tolerances, reservation | OQ-001–006, OQ-008 |
| Sales Order close; residual cutoff | OQ-007, OQ-009 |
| Portal MVP action set | OQ-010 |
| Weighbridge protocol; legal GL product | OQ-011, OQ-012 |
| Org/site; volumes; posting mechanism | OQ-013, OQ-014, OQ-017 |
| Opening-stock cutover RACI; RPO/RTO | OQ-015, OQ-016 |
| Package, runner, hosting, extra MCP | OQ-018 |
| Human `.cursor/IMPLEMENTATION_UNLOCK.json` with exact paths | Project Owner after this gate |
| `BR-IMPL` | Exists only after a valid unlock |

A command that still needs an unanswered OQ remains
`GUARD_OPEN_POLICY`. Readiness does not guess the answer.

## Must not decide here

- Unlock paths or shell commands
- A `TEST-*` ID
- A package or hosting product
