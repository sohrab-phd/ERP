---
id: PLAN-SLICE-001
title: Roadmap and Vertical Slices
phase: 12-implementation-planning
status: in_review
version: 0.5.0
owners: [chief-solution-architect, delivery-lead]
depends_on: [SM-SEQ-001, APP-ORCH-001, REPO-LAY-001, APR-013, APR-014, ASM-025]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Roadmap and Vertical Slices

APR-014 approved the historical structure. The delegated technical foundation
is now specified by ADR-0011/0013 and
[physical design](SLICE_ENVELOPE_PHYSICAL_DESIGN.md). These are technical decisions,
not human approval of an implementation baseline. No package or source exists.
[Capability backlog](IMPLEMENTATION_BACKLOG.md) refines the ordering while retaining
all named bundle homes below. A logical home does not authorize all its capabilities
in the first foundation implementation grant.

Named slices for later unlock work. This is not a calendar, staffing
plan, or application tree. Later folders stay labels from REPO-LAY-001;
they are not created now.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

OQ-005 records the current-MVP exclusion of QC execution. Its remaining
plans, limits, and people are future-only inputs, not guards on the current
purchase or make slices. No current slice requires `mod-quality`.

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
| `SLICE-ENVELOPE` | Command/query envelope, bound durable accepted/rejected outcomes, rejection families, `AUD-CMD-*` | `kern-command`, `host-backend`, `mod-identity-audit` | Write Ledger or business posting; production synthetic/auth shortcut | Technical stack ADR-0013 and contract ADR-0011; identity product belongs to its later slice |
| `SLICE-IPS` | Inventory Posting kernel commanded by others | `mod-inventory-posting` | Second writer; Balance-only API | OQ-001 residual; OQ-017 functions later ADR |
| `SLICE-STOCK` | SEQ-STOCK: `ActivateReservation` bundle → pack → `DispatchShipment` bundle → invoice → `AllocatePayment` bundle; `CloseSalesOrder` per OQ-007 | `mod-sales`, `mod-shipping`, `mod-finance-lite`, commands IPS | Steal an `ACTIVE` reservation; split any named bundle; close SO because invoice is paid | OQ-006 |
| `SLICE-PURCHASE` | SEQ-PURCHASE: PO → `PostGoodsReceipt` bundle; `ADP-WEIGHBRIDGE` commander | `mod-procurement`, `host-adapter`, IPS posts; no current Quality dependency | Device writes quantity | OQ-011, OQ-019; OQ-005 future Quality only, not a current guard |
| `SLICE-MAKE` | SEQ-MAKE: allocation issue → `CompleteProductionOperation` bundle (nested residual identity / scrap qty) | `mod-production` commands IPS; `mod-quality` deferred outside MVP | Guess routing or automatically classify reusability; split the complete-op bundle or post leftover after commit | OQ-003 lifecycle; OQ-009 human disposition recording/authority and production policy; OQ-006 fulfillment only; OQ-005 future Quality only |
| `SLICE-REVERSE` | SEQ-REVERSE compensating commands; SV-013 on ReverseGoodsReceipt | owning BC commands; IPS on stock reverse | Device replay; `REV-AGENT` waiving SoD | OQ-015, OQ-019 |
| `SLICE-RESTORE` | Restore: `BalanceRebuild` from Ledger; `GenealogyRebuild` from DATA-GEN-001 source facts | `host-worker` rebuild kinds | `AdjustBalance` / `EditGenealogy`; Ledger-only genealogy | OQ-016 residual retention/product. RPO/RTO recorded. |
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
| CompleteProductionOperation + consume/output/residual/scrap (nested residual identity) | `SLICE-MAKE` |
| CreateResidualUnit + parent close/split (nested in complete-op; not a later commit) | `SLICE-MAKE` |

A slice may contain more than one bundle. Each bundle remains one
business transaction (mechanism stays OQ-017). Residual identity for
production leftover must not become a second commit after
`CompleteProductionOperation`.

Command, adapter, query, worker, and scene homes that are not a named
bundle are in
[SLICE_HOMES.md](../00-governance/registers/SLICE_HOMES.md). That
register does not add a slice and does not authorize implementation.

## Must not decide here

- Dates, velocity, or headcount
- Package-manager, `apps/` vs `src/`, or CI product
- Named slice owners (OQ-019)
