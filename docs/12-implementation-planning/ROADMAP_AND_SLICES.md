---
id: PLAN-SLICE-001
title: Roadmap and Vertical Slices
phase: 12-implementation-planning
status: approved
version: 0.3.0
owners: [chief-solution-architect, delivery-lead]
depends_on: [SM-SEQ-001, APP-ORCH-001, REPO-LAY-001, APR-013, APR-014, ASM-025]
last_reviewed: 2026-09-07
approval: APR-014
supersedes: null
---

# Roadmap and Vertical Slices

Named slices for later unlock work. This is not a calendar, staffing
plan, or application tree. Later folders stay labels from REPO-LAY-001;
they are not created now.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Standing slice rules

1. A slice that posts stock uses `ACT-IPS` / `mod-inventory-posting`
   only.
2. A DATA-TX-001 bundle must not split across slices, hosts, PRs, or
   `TASK-IMPL` items.
3. Open guards stay `GUARD_OPEN_POLICY`. The slice records the `OQ-*`;
   it does not invent the number or name.
4. Do not start with portal write, `EditGenealogy`, `AdjustBalance`,
   or a Balance-only API.
5. `host-adapter` and `host-worker` command; they do not post.
   `ui-operator` is not a trust boundary (INV-015).
6. A later slice that is architecture-affecting (write owner, bundle
   boundary, isolation, SoD, forbidden write) reopens the owning
   `APR-*`. It is not a local merge.

## Dependency order (labels, not dates)

`SLICE-ENVELOPE` before `SLICE-IPS`. Stock, purchase, and make slices
after `SLICE-IPS`. Reverse after at least one posting slice exists.
Restore and cutover stay last and guarded. Isolation (`CONF-ISO` /
SV-012) is a keep-rule on every outbound slice, not a first posting
kernel.

## Slice order (labels)

| Slice | Walks / commands | Host / module labels | Must not | Open |
| --- | --- | --- | --- | --- |
| `SLICE-ENVELOPE` | Command/query envelope, idempotency key, rejection families, `AUD-CMD-*` | `kern-command`, `host-backend`, `mod-identity-audit` | Write Ledger; choose NestJS/Prisma | OQ-018 |
| `SLICE-IPS` | Inventory Posting kernel commanded by others | `mod-inventory-posting` | Second writer; Balance-only API | OQ-017, OQ-001 |
| `SLICE-STOCK` | SEQ-STOCK: `ActivateReservation` bundle → pack → `DispatchShipment` bundle → invoice → `AllocatePayment` bundle | `mod-sales`, `mod-shipping`, `mod-finance-lite`, commands IPS | Guess CloseSalesOrder; split any named bundle | OQ-007, OQ-006, OQ-008 |
| `SLICE-PURCHASE` | SEQ-PURCHASE: PO → `PostGoodsReceipt` bundle; `ADP-WEIGHBRIDGE` commander | `mod-procurement`, `host-adapter`, IPS posts | Device writes quantity | OQ-011, OQ-005, OQ-019 |
| `SLICE-MAKE` | SEQ-MAKE: allocation issue → `CompleteProductionOperation` bundle → `CreateResidualUnit` bundle | `mod-production`, `mod-quality` commands IPS | Guess routing or residual cutoff; split either bundle | OQ-003, OQ-009, OQ-006 |
| `SLICE-REVERSE` | SEQ-REVERSE compensating commands; SV-013 on ReverseGoodsReceipt | owning BC commands; IPS on stock reverse | Device replay; `REV-AGENT` waiving SoD | OQ-015, OQ-019 |
| `SLICE-RESTORE` | Restore rebuilds Balance/Genealogy from Ledger | `host-worker` rebuild kinds | `AdjustBalance` / `EditGenealogy` | OQ-016 |
| `SLICE-CUTOVER` | `ADP-CUTOVER` / `OpeningStockImport` | `host-adapter` | Bypass OQ-015; post Balance-only | OQ-015, OQ-019 |

`SLICE-NOT-FEASIBLE` rides inside `SLICE-STOCK` as `RecordUnfulfilledDemand`
(INV-013). It is not a separate posting kernel.

`ADP-PORTAL` order write is not a slice in MVP (INV-020). No
`mod-portal` write path.

## Bundles that must stay inside one slice item

| Bundle | Home slice |
| --- | --- |
| ActivateReservation + reserved state + reserved qty | `SLICE-STOCK` |
| DispatchShipment + stock exit | `SLICE-STOCK` |
| AllocatePayment + invoice open-balance reduction | `SLICE-STOCK` |
| PostGoodsReceipt + Lot/Unit/Ledger | `SLICE-PURCHASE` |
| CompleteProductionOperation + consume/output/residual/scrap | `SLICE-MAKE` |
| CreateResidualUnit + parent close/split | `SLICE-MAKE` |

A slice may contain more than one bundle. Each bundle remains one
business transaction (mechanism stays OQ-017).

## Must not decide here

- Dates, velocity, or headcount
- Package-manager, `apps/` vs `src/`, or CI product
- Named slice owners (OQ-019)
