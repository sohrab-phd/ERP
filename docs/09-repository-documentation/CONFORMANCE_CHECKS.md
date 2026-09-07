---
id: REPO-CONF-001
title: Architecture Conformance Check Labels
phase: 09-repository-documentation
status: approved
version: 0.3.0
owners: [qa-architect, solution-architect]
depends_on: [QA-GATE-001, REPO-DEP-001, APR-010, APR-011]
last_reviewed: 2026-09-07
approval: APR-011
supersedes: null
---

# Architecture Conformance-Check Labels

What a later automated check may look for. This is not CI and not a
linter product (OQ-018). It inherits `QG-*` from Phase 07.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Check kinds

| ID | Later proof | Open |
| --- | --- | --- |
| `CONF-IMPORT` | Forbidden imports in REPO-DEP-001 do not exist | Linter product |
| `CONF-CMD` | Only catalogue commands are callable | Framework |
| `CONF-IPS` | Only `mod-inventory-posting` writes Ledger | ORM product |
| `CONF-ADP` | Adapters submit commands; no table writes | Adapter host |
| `CONF-BUNDLE` | DATA-TX-001 bundles are not split | Transaction library (OQ-017) |
| `CONF-FORBID` | `EditGenealogy`, `AdjustBalance`, `PortalPlaceOrder` are not callable | — |
| `CONF-ISO` | Exports and live notices isolate customers (SV-012) | — |
| `CONF-SECRET` | Secrets and `.env` are not in the tree (`HH-SECRET`) | Secret store |
| `CONF-UNLOCK` | Application paths exist only under a valid unlock | Implementation unlock |
| `QG-ARCH` | Design artifacts still match the approved baseline | — |

A failing unanswered OQ is `GUARD_OPEN_POLICY`, not a red CI that
invents the missing number.

## Must not decide here

- GitHub Actions, GitLab CI, or Jenkins
- ESLint, dependency-cruiser, or ArchUnit-TS as decided
- Coverage percents
