---
id: PLAN-SLICE-001
title: Roadmap and Vertical Slices
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [chief-solution-architect, delivery-lead]
depends_on: [SM-SEQ-001, APP-ORCH-001, APR-013, ASM-025]
last_reviewed: 2026-09-07
approval: null
supersedes: null
---

# Roadmap and Vertical Slices

Named slices for later unlock work. This is not a calendar, staffing
plan, or application tree.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Standing slice rules

1. A slice that posts stock uses `ACT-IPS` only.
2. A DATA-TX-001 bundle must not split across slices, hosts, or PRs.
3. Open guards stay `GUARD_OPEN_POLICY`. The slice records the `OQ-*`;
   it does not invent the number or name.
4. Do not start with portal write, `EditGenealogy`, `AdjustBalance`,
   or a Balance-only API.

## Slice order (labels)

| Slice | Walks / commands | Must not | Open |
| --- | --- | --- | --- |
| `SLICE-ENVELOPE` | Command/query envelope, idempotency key, rejection families, `AUD-CMD-*` | Write Ledger; choose NestJS/Prisma | OQ-018 |
| `SLICE-IPS` | Inventory Posting kernel commanded by others | Second writer; Balance-only API | OQ-017, OQ-001 |
| `SLICE-STOCK` | SEQ-STOCK: reservation → pack → `DispatchShipment` bundle → invoice → `AllocatePayment` | Guess CloseSalesOrder (OQ-007) | OQ-007, OQ-006, OQ-008 |
| `SLICE-PURCHASE` | SEQ-PURCHASE: PO → `PostGoodsReceipt` bundle; `ADP-WEIGHBRIDGE` commander | Device writes quantity | OQ-011, OQ-005, OQ-019 |
| `SLICE-MAKE` | SEQ-MAKE: allocation issue → `CompleteProductionOperation` bundle → residual | Guess routing or residual cutoff | OQ-003, OQ-009, OQ-006 |
| `SLICE-REVERSE` | SEQ-REVERSE compensating commands; SV-013 on ReverseGoodsReceipt | Device replay; `REV-AGENT` waiving SoD | OQ-015, OQ-019 |
| `SLICE-RESTORE` | Restore rebuilds Balance/Genealogy from Ledger | `AdjustBalance` / `EditGenealogy` | OQ-016 |
| `SLICE-CUTOVER` | `ADP-CUTOVER` / `OpeningStockImport` | Bypass OQ-015; post Balance-only | OQ-015, OQ-019 |

`SLICE-NOT-FEASIBLE` rides inside `SLICE-STOCK` as `RecordUnfulfilledDemand`
(INV-013). It is not a separate posting kernel.

`ADP-PORTAL` order write is not a slice in MVP (INV-020).

## Must not decide here

- Dates, velocity, or headcount
- Package-manager or CI product
- Named slice owners (OQ-019)
