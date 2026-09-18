---
id: VAL-XDOM-001
title: Cross-Domain Contradiction and Dependency Analysis
phase: 11-architecture-validation
status: approved
version: 0.3.0
owners: [chief-solution-architect]
depends_on: [VAL-INT-001, APR-012, APR-013, ASM-024]
last_reviewed: 2026-09-18
approval: APR-013
supersedes: null
---

# Cross-Domain Contradiction and Dependency Analysis

Where approved phases must stay aligned. Tensions that are registered
open questions are gaps, not silent contradictions.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Dependencies that must remain true

| Upstream | Downstream must not |
| --- | --- |
| INV-001 / `ACT-IPS` | A second Ledger writer in adapters, workers, UI, or `TASK-IMPL` |
| DATA-TX-001 / APP-ORCH-001 | Split bundles in `mod-*`, `host-adapter`, or `TASK-IMPL` |
| INV-019 / DATA-GEN-001 / FIND-G-014 | Treat Genealogy as source; expose `EditGenealogy`; rebuild Genealogy from Ledger or Balance |
| INV-015 / SV-012 | Trust UI-claimed role or leak customer data on `ADP-LIVE` |
| ASM-010 | Make Finance-Lite legal GL |
| INV-020 / OQ-010 | MVP `PortalPlaceOrder` |
| APR-012 / `AG-UNLOCK` | Agent-invented unlock or checkpoint marker |
| ASM-016 | Guess numeric/named guards; must reject as `GUARD_OPEN_POLICY` |
| APP-MOD-001 | Quality/Shipping/Sales/Procurement/Production import Ledger writers |
| SM-SOD-001 / SV-013 | Device replay of ReverseGoodsReceipt; `REV-AGENT` waiving SoD |
| REPO-GEN-001 | Generated OpenAPI/SQL closing an `OQ-*` or disagreeing with catalogues |

## Checked tensions (not closed)

| Tension | Status |
| --- | --- |
| Workshop policy vs continuing design | Open by ASM-014 through ASM-024 |
| One site (ASM-001) vs later multi-site | OQ-013; not a second-site map |
| Human-frequency production (ASM-008) vs PLC | `ADP-PLC` remains future catalogue |
| Structure gates vs product freeze | OQ-018 packages residual; ADR-0006/0007 accepted; ADR-0008 proposed |
| Sales cancel/hold vs SoD | Not a closed SoD pair (APR-008); not silently paired here |
| `AbortProductionOrder` vs routing | OQ-003 `GUARD_OPEN_POLICY` |
| Inquiry/Quotation expiry | FIND-026 `workshop-commercial-practice` |
| Weighbridge evidence vs stock write | `ADP-WEIGHBRIDGE` commands; `ACT-IPS` posts; protocol OQ-011 |
| Opening stock vs Balance/Genealogy | `ADP-CUTOVER` commands Ledger/Lot/Unit facts; `BalanceRebuild` from Ledger; `GenealogyRebuild` from DATA-GEN-001 origin facts at cutover (FIND-G-014); OQ-015 residuals |
| Shared kernel vs library | `kern-command` is not a product |
| Implementation branch | `BR-IMPL` does not exist until unlock |
| Phase 11 “mandatory links” vs no `TEST-*` | Structure intents required; `TEST-*` deferred (ASM-024) |

## Contradictions found

None in-scope among approved baselines at the Phase 11 freeze
(`2026-09-07`). FIND-037 is `resolved` by APR-013. The SEQ-STOCK walk
mislabel in an earlier Phase 11 draft was corrected in this package and
did not mark an `APR-*` suspect.

Later (`2026-09-18`, Gate 4): FIND-G-014 remains the live genealogy
rebuild rule. Live operational docs that still presented Ledger-only
genealogy rebuild, ADR-0006 as unaccepted, or OQ-010 as unanswered were
aligned. This Phase 11 freeze text is historical evidence, not current
policy for those later-recorded items.

## Must not decide here

- Closing an `OQ-*` to “remove” a tension
- A new bounded context or write owner
- Treating Sales cancel/hold as SoD without a new approval
