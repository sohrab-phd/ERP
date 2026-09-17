---
id: PLAN-READY-001
title: Implementation Readiness Checklist
phase: 12-implementation-planning
status: approved
version: 0.3.0
owners: [chief-solution-architect, delivery-lead]
depends_on: [APR-013, APR-014, CHK-0012, CHK-0013, ASM-025, CONF-UNLOCK]
last_reviewed: 2026-09-07
approval: APR-014
supersedes: null
---

# Implementation Readiness Checklist

Labels for what must be true before a later human unlock. This is not
the unlock and not a `TEST-*` catalogue.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Already true as approved structure

- [x] Phases 01–12 approved as structure (APR-003 through APR-014).
- [x] Phase 11 Git freeze CHK-0012
      `57062e96c91b6eff52f233aaf3a0df65a81e9da4`.
- [x] Phase 12 Git freeze CHK-0013
      `a6b893095af7c9d14f342371fb6e4ef9c6d833df`.
- [x] One Ledger writer (`ACT-IPS` / `mod-inventory-posting`).
- [x] DATA-TX-001 six bundles named and unsplittable.
- [x] Forbidden writes: `EditGenealogy`, `AdjustBalance`, MVP
      `PortalPlaceOrder`.
- [x] `AG-UNLOCK` never; checkpoint markers human-only.
- [x] Node.js + TypeScript (ADR-0001), Modular Monolith (ADR-0006), and
      PostgreSQL (ADR-0007) are accepted. ADR-0008 remains proposed.
- [x] Keep/reject kinds exist: `CONF-IPS`, `CONF-ADP`, `CONF-BUNDLE`,
      `CONF-FORBID`, `CONF-ISO`, `CONF-UNLOCK`, `CONF-SECRET`,
      `CONF-IMPORT`, `CONF-CMD`.

## Still required later (open extensions)

| Ready item | Wait on |
| --- | --- |
| Named people on SoD, UAT, cutover sign-off | OQ-019 residual |
| UOM decimal scale / rounding / conversion factors; QC plans/names; routing step names | OQ-001, OQ-003, OQ-005 residuals. OQ-002 coil kg and OQ-006 default 0 are recorded. |
| Residual cutoff numbers | OQ-009 residual |
| Portal document list (visibility-only MVP is recorded) | OQ-010 residual |
| Weighbridge make/model/protocol | OQ-011 residual. OQ-012: no Legal-GL in MVP. |
| Monthly volume counts | OQ-014 residual. OQ-013 one entity/site is recorded. |
| Opening-stock source files and named signers | OQ-015 residual |
| Backup product and retention days | OQ-016 residual. RPO 60 min / RTO 8 h / daily / offsite are recorded. |
| PostgreSQL functions ADR + spike; ORM/package choices | OQ-017 residual (functions); OQ-018 residual (packages). Posting style and PostgreSQL are recorded. |
| Human `.cursor/IMPLEMENTATION_UNLOCK.json` with exact paths | Project Owner after this gate |
| `BR-IMPL` | Exists only after a valid unlock |

Phase 12 approval does **not** tick the unlock or `BR-IMPL` rows.

A command that still needs an unanswered OQ remains
`GUARD_OPEN_POLICY`. Readiness does not guess the answer.

## Must not decide here

- Unlock paths or shell commands
- A `TEST-*` ID
- A package or hosting product
