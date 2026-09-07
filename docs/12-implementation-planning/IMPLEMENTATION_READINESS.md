---
id: PLAN-READY-001
title: Implementation Readiness Checklist
phase: 12-implementation-planning
status: approved
version: 0.3.0
owners: [chief-solution-architect, delivery-lead]
depends_on: [APR-013, APR-014, CHK-0012, ASM-025, CONF-UNLOCK]
last_reviewed: 2026-09-07
approval: APR-014
supersedes: null
---

# Implementation Readiness Checklist

Labels for what must be true before a later human unlock. This is not
the unlock and not a `TEST-*` catalogue.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Already true as approved structure

- [x] Phases 01–11 approved as structure (APR-003 through APR-013).
- [x] Phase 11 Git freeze CHK-0012
      `57062e96c91b6eff52f233aaf3a0df65a81e9da4`.
- [x] One Ledger writer (`ACT-IPS` / `mod-inventory-posting`).
- [x] DATA-TX-001 six bundles named and unsplittable.
- [x] Forbidden writes: `EditGenealogy`, `AdjustBalance`, MVP
      `PortalPlaceOrder`.
- [x] `AG-UNLOCK` never; checkpoint markers human-only.
- [x] Node.js + TypeScript is the only accepted technology ADR.
- [x] Keep/reject kinds exist: `CONF-IPS`, `CONF-ADP`, `CONF-BUNDLE`,
      `CONF-FORBID`, `CONF-ISO`, `CONF-UNLOCK`, `CONF-SECRET`,
      `CONF-IMPORT`, `CONF-CMD`.

## Still required later (open extensions)

| Ready item | Wait on |
| --- | --- |
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

Phase 12 approval does **not** tick the unlock or `BR-IMPL` rows.

A command that still needs an unanswered OQ remains
`GUARD_OPEN_POLICY`. Readiness does not guess the answer.

## Must not decide here

- Unlock paths or shell commands
- A `TEST-*` ID
- A package or hosting product
