---
id: PLAN-WI-001
title: Work Items Linked to Approved IDs
phase: 12-implementation-planning
status: approved
version: 0.3.0
owners: [delivery-lead]
depends_on: [PLAN-SLICE-001, AI-PROMPT-001, APR-013, APR-014, ASM-025]
last_reviewed: 2026-09-07
approval: APR-014
supersedes: null
---

# Work Items Linked to Approved IDs

Work-item **kinds** for later `TASK-IMPL`. These are not tickets in a
tracker and not `TEST-*` IDs. `TASK-IMPL` does not exist while
`IMPLEMENTATION_AUTHORIZED` is false.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Required citations on every later `TASK-IMPL`

From APR-012 / AI-PROMPT-001, a later implementation task must cite:

1. The owning `APR-*` / `CHK-*`
2. Command or query IDs
3. `mod-*` / `host-*` write owner
4. Commander `ACT-*` and, for stock, executor `ACT-IPS`
5. `CONF-*` keep/reject rules
6. Open `OQ-*` as `GUARD_OPEN_POLICY`
7. Unlock paths (only after a valid human unlock)
8. Whether the diff is architecture-affecting (reopen) or local
9. Named DATA-TX-001 bundle, if any

A prompt that omits any of those stops. It does not invent the missing
ID.

## Work-item kinds (labels)

| Kind | Maps to | Must reject |
| --- | --- | --- |
| `WI-CMD` | One catalogue command inside one `mod-*` | Split bundle; UI-claimed role |
| `WI-QRY` | One catalogue query | Isolation leak (SV-005 / SV-012) |
| `WI-ADP` | One `ADP-*` commander on `host-adapter` | Adapter table write |
| `WI-BUNDLE` | One DATA-TX-001 bundle (table below) | Partial post; cross-host split |
| `WI-WORKER` | Same-key retry on `host-worker` | Worker as commander (SV-009) |
| `WI-REBUILD` | `BalanceRebuild` / `GenealogyRebuild` | `AdjustBalance` / `EditGenealogy` |
| `WI-CONF` | Import/`CONF-*` check | Guessed UOM constant |
| `WI-DOC` | Architecture Markdown in the authorized phase | Closing an `OQ-*` |

## Named `WI-BUNDLE` items

| Item | Bundle | Slice |
| --- | --- | --- |
| `WI-BUNDLE-RESERVE` | ActivateReservation + reserved state + reserved qty | `SLICE-STOCK` |
| `WI-BUNDLE-DISPATCH` | DispatchShipment + stock exit | `SLICE-STOCK` |
| `WI-BUNDLE-PAY` | AllocatePayment + invoice open-balance reduction | `SLICE-STOCK` |
| `WI-BUNDLE-GR` | PostGoodsReceipt + Lot/Unit/Ledger | `SLICE-PURCHASE` |
| `WI-BUNDLE-COMPLETE-OP` | CompleteProductionOperation + consume/output/residual/scrap | `SLICE-MAKE` |
| `WI-BUNDLE-RESIDUAL` | CreateResidualUnit + parent close/split | `SLICE-MAKE` |

Forbidden as work items that pass in MVP: `PortalPlaceOrder`,
`EditGenealogy`, `AdjustBalance`, Quality/Shipping writing Ledger.

A `WI-*` is not a `TEST-*`. Verification stays `QA-SCN-*` / `SV-*`
intents until a runner ADR (OQ-018, FIND-028).

## Must not decide here

- Jira/Linear/GitHub Issues as a product
- Story points
- Named assignees
