---
id: VAL-WALK-001
title: End-to-End and Exceptional-Flow Walkthroughs
phase: 11-architecture-validation
status: in_review
version: 0.1.0
owners: [independent-reviewer, qa-architect]
depends_on: [QA-SCN-001, APP-ORCH-001, APR-012, ASM-024]
last_reviewed: 2026-09-07
approval: null
supersedes: null
---

# End-to-End and Exceptional-Flow Walkthroughs

Label walks of approved sequences. These are not executable tests and
not UAT (OQ-019).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Happy-path walks (from Phase 07 SEQ-*)

| Walk | Commands / adapters | Stock writer | Open guard |
| --- | --- | --- | --- |
| `WALK-STOCK` (SEQ-STOCK) | reservation / issue / receipt commands | `ACT-IPS` | OQ-001, OQ-006, OQ-007 |
| `WALK-PURCHASE` (SEQ-PURCHASE) | PO → `PostGoodsReceipt` via `ADP-WEIGHBRIDGE` commander | `ACT-IPS` posts GR bundle | OQ-011, OQ-019, OQ-005 |
| `WALK-MAKE` (SEQ-MAKE) | `CompleteProductionOperation` bundle | `ACT-IPS` on consume/output | OQ-003, OQ-009, OQ-006 |
| `WALK-DELIVER` | `DispatchShipment` + stock exit | `ACT-IPS` | OQ-006, INV-011 |
| `WALK-NOT-FEASIBLE` | infeasible allocation rejected; no posted fact | none | — |

Each walk uses one idempotency key per accepted command (INV-016).
Bundles in APP-ORCH-001 must not split.

## Exception walks

| Walk | Rule | Open |
| --- | --- | --- |
| `WALK-REVERSE` (SEQ-REVERSE) | Reversal is a new command; SV-013 on ReverseGoodsReceipt | OQ-015, OQ-017, OQ-019 |
| `WALK-QC-HOLD` | Stock not available/shippable while required QC is open | OQ-005 |
| `WALK-REJECT-GENEALOGY` | No `EditGenealogy`; rebuild from Ledger | — |
| `WALK-PORTAL` | `PortalPlaceOrder` rejected in MVP | OQ-010 |
| `WALK-CUTOVER` | `ADP-CUTOVER` stays `GUARD_OPEN_POLICY` | OQ-015, OQ-019 |
| `WALK-RESTORE` | Restore rebuilds Balance/Genealogy from Ledger | OQ-016 |

## Must not decide here

- Named UAT actors
- Fixture volumes (OQ-014)
- A runner or CI product
