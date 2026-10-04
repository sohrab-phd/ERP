---
id: VAL-WALK-001
title: End-to-End and Exceptional-Flow Walkthroughs
phase: 11-architecture-validation
status: in_review
version: 0.5.1
owners: [independent-reviewer, qa-architect]
depends_on: [QA-SCN-001, SM-SEQ-001, APP-ORCH-001, APR-012, APR-013, ASM-024]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# End-to-End and Exceptional-Flow Walkthroughs

Label walks of approved sequences. These are not executable tests and
not UAT (OQ-019). A step whose guard is an unanswered `OQ-*` is an
expected `GUARD_OPEN_POLICY` stop, not a failed walk.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

Golden paths match SM-SEQ-001 / QA-SCN-001. Dispatch is SEQ-STOCK
step 7 (`DispatchShipment` + stock exit). It is not a fifth golden
path.

QC paths in the older walks are future-only (OQ-005). Current MVP has
no Quality inspection, hold, release, or Quality actor as a prerequisite.
Valid normal stock-in makes the resulting Inventory Unit `AVAILABLE`
after the posting transaction commits, subject to existing guards
(INV-003). This is architecture reconciliation, not factory procedure.

## Happy-path walks (from Phase 03 SEQ-* / Phase 07 QA-SCN-*)

| Walk | Approved sequence | Command order (labels) | Stock writer | Open guard |
| --- | --- | --- | --- | --- |
| `WALK-STOCK` | SEQ-STOCK / QA-SCN-STOCK | Inquiry/Quotation optional → fulfillment STOCK → confirm Sales Order → `RequestReservation` / `ActivateReservation` (one `ACTIVE` per unit) → pack → `DispatchShipment` → invoice → `AllocatePayment`. `CloseSalesOrder` after `FULFILLED` (remaining demand already zero) / authorized remainder / cancelled; payment and shipment `DELIVERED` are not close guards. | `ACT-IPS` on reservation and exit | OQ-006 family %; no current-MVP QC gate |
| `WALK-PURCHASE` | SEQ-PURCHASE / QA-SCN-PURCHASE | Fulfillment PURCHASE → confirm Sales Order (purchase-need) → PO send → `ReceiveGoods` → `PostGoodsReceipt` (`ADP-WEIGHBRIDGE` may command) → resulting normal Unit `AVAILABLE` on valid commit → continue SEQ-STOCK from reservation. `HoldInboundForQc` is future-only. | `ACT-IPS` posts GR bundle; Procurement does not write quantity (INV-018) | OQ-019 (PO approve), OQ-011; OQ-005 future only. OQ-015 cutover is separate. |
| `WALK-MAKE` | SEQ-MAKE / QA-SCN-MAKE | Fulfillment MAKE → `StartOrderProduction` → release Production Order → allocation issue (`IssueUnitFromAllocation`) → `CompleteProductionOperation` bundle (nested residual identity / scrap qty) → valid normal good/reusable output Units `AVAILABLE` on commit → `PlaceResidualUnit` where applicable → SEQ-STOCK from pack. Scrap is not available. No current-MVP QC request or release. `CloseSalesOrder` independent of payment (OQ-007). | `ACT-IPS` on consume/output/residual/scrap qty; Production writes facts, not Ledger tables | OQ-003 lifecycle, OQ-009 human disposition recording; production mass-balance policy unresolved; OQ-006 fulfillment only; OQ-005 future only |
| `WALK-NOT-FEASIBLE` | SEQ-NOT-FEASIBLE / QA-SCN-NOT-FEASIBLE | `RecordFulfillmentNotFeasible` → `RecordUnfulfilledDemand` (INV-013). No Sales Order required. Not overdue. | none | — |

Each accepted command uses one idempotency key (INV-016). Bundles in
APP-ORCH-001 must not split.

## Bundle walks (DATA-TX-001 / QA-SCN-BUNDLE)

| Walk | Must stay one transaction | Must not |
| --- | --- | --- |
| `WALK-BUNDLE-COMPLETE-OP` | `CompleteProductionOperation` + consume/output/residual/scrap postings (nested residual identity) | Posted subset; second leftover qty; independent production consume |
| `WALK-BUNDLE-DISPATCH` | `DispatchShipment` + stock exit (INV-017) | Shipping writes Ledger |
| `WALK-BUNDLE-GR` | `PostGoodsReceipt` + Lot/Unit/Ledger | Weighbridge or Procurement writes quantity |
| `WALK-BUNDLE-RESERVE` | `ActivateReservation` + reserved state + reserved qty | Balance-only reserved qty |
| `WALK-BUNDLE-PAY` | `AllocatePayment` + invoice open-balance reduction | Finance-Lite as legal GL |
| `WALK-BUNDLE-RESIDUAL` | Nested `CreateResidualUnit` + parent close/split **inside** complete-op | Later residual commit; automatic cutoff instead of human reusability decision (OQ-009) |

How the bundle is committed stays OQ-017.

## Exception walks

| Walk | Approved scenario | Rule | Open |
| --- | --- | --- | --- |
| `WALK-REVERSE` | SEQ-REVERSE / QA-SCN-REVERSE | New compensating command; original posted row stays (INV-005) | OQ-015, OQ-017, OQ-019 |
| `WALK-SOD-GR` | QA-SCN-SOD-GR | `ReverseGoodsReceipt` needs a different human than the original post (SV-013) | OQ-015, OQ-019 |
| `WALK-SOD-FIN` | QA-SCN-SOD | VoidInvoice / ReversePayment needs a second distinct identity (SV-007) | OQ-019 |
| `WALK-QC-HOLD` (**future only**) | QA-SCN-QC-HOLD | If Quality is later enabled, stock is not available/shippable while required QC is open (INV-010). No current-MVP gate. | OQ-005 future residual |
| `WALK-REJECT-OPEN` | QA-SCN-REJECT-OPEN | Command needing an unanswered OQ rejects; no posted fact | matching `OQ-*` |
| `WALK-REJECT-GENEALOGY` | QA-SCN-REJECT-GENEALOGY | No `EditGenealogy`; rebuild from DATA-GEN-001 source facts (INV-019, FIND-G-014) | — |
| `WALK-REJECT-ADJUST` | QA-SCN-REJECT-ADJUST | No `AdjustBalance` | — |
| `WALK-PORTAL` | QA-SCN-REJECT-PORTAL | `PortalPlaceOrder` / `ADP-PORTAL` order write rejected in MVP (INV-020) | OQ-010 |
| `WALK-WORKER` | QA-SCN-WORKER | Transport retry uses the same key; worker is not the commander (SV-009) | OQ-018 transport |
| `WALK-UI-LEDGER` | QA-SCN-UI-LEDGER | UI-claimed `ACT-SALES` cannot write Ledger (SV-001, INV-015) | — |
| `WALK-ISOLATION` | QA-SCN-ISOLATION / QA-SCN-EVENT-ISO | Customer A must not see customer B on query, export, or `ADP-LIVE` (SV-005 / SV-012) | — |
| `WALK-IDEMPOTENT` | QA-SCN-IDEMPOTENT | Same key returns first result; no second GR/dispatch/payment/completion | — |
| `WALK-SHIP-NO-DEMAND` | QA-SCN-SHIP-NO-DEMAND | DraftShipment without order needs exceptional authority (INV-011) | OQ-019 |
| `WALK-PAUSE-RESUME` | QA-SCN-PAUSE-RESUME | Production Order PAUSED then `ResumeProductionOrder` | FIND-027 |
| `WALK-CUTOVER` | ADP-CUTOVER | Opening-stock loader stays `GUARD_OPEN_POLICY` | OQ-015, OQ-019 |
| `WALK-RESTORE` | DR-RESTORE | Restore: `BalanceRebuild` from Ledger; `GenealogyRebuild` from DATA-GEN-001 source facts; never `AdjustBalance` / `EditGenealogy` | OQ-016 |

Sales cancel/hold is **not** walked as a closed SoD pair. That remains
the Phase 06 baseline.

## Must not decide here

- Named UAT actors (OQ-019)
- Fixture volumes (OQ-014)
- A runner or CI product (OQ-018)
- Numeric UOM, tolerance, residual, or routing oracles
