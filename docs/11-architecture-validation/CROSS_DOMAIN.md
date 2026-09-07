---
id: VAL-XDOM-001
title: Cross-Domain Contradiction and Dependency Analysis
phase: 11-architecture-validation
status: in_review
version: 0.1.0
owners: [chief-solution-architect]
depends_on: [VAL-INT-001, APR-012, ASM-024]
last_reviewed: 2026-09-07
approval: null
supersedes: null
---

# Cross-Domain Contradiction and Dependency Analysis

Where approved phases must stay aligned. Tensions that are registered
open questions are gaps, not silent contradictions.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Dependencies that must remain true

| Upstream | Downstream must not |
| --- | --- |
| INV-001 / `ACT-IPS` | A second Ledger writer in adapters, workers, or UI |
| DATA-TX-001 / APP-ORCH-001 | Split bundles in `mod-*`, `host-adapter`, or `TASK-IMPL` |
| INV-019 / DATA-GEN-001 | Treat Genealogy as source; expose `EditGenealogy` |
| INV-015 / SV-012 | Trust UI-claimed role or leak customer data on `ADP-LIVE` |
| ASM-010 | Make Finance-Lite legal GL |
| INV-020 / OQ-010 | MVP `PortalPlaceOrder` |
| APR-012 / `AG-UNLOCK` | Agent-invented unlock or checkpoint marker |
| ASM-016 | Guess numeric/named guards; must reject as `GUARD_OPEN_POLICY` |

## Checked tensions (not closed)

| Tension | Status |
| --- | --- |
| Workshop policy vs continuing design | Open by ASM-014 through ASM-024 |
| One site (ASM-001) vs later multi-site | OQ-013; not a second-site map |
| Human-frequency production (ASM-008) vs PLC | PLC remains future catalogue |
| Structure gates vs product freeze | OQ-018; no package claimed |

## Contradictions found

None in-scope among approved baselines. FIND-037 records the remaining
structure-vs-answer tension for this gate.

## Must not decide here

- Closing an `OQ-*` to “remove” a tension
- A new bounded context or write owner
