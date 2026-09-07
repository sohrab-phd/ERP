---
id: VAL-WALK-001
title: End-to-End and Exceptional-Flow Walkthroughs
phase: 11-architecture-validation
status: approved
version: 0.3.0
owners: [independent-reviewer, qa-architect]
depends_on: [QA-SCN-001, SM-SEQ-001, APP-ORCH-001, APR-012, APR-013, ASM-024]
last_reviewed: 2026-09-07
approval: APR-013
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

## Happy-path walks (from Phase 03 SEQ-* / Phase 07 QA-SCN-*)

| Walk | Approved sequence | Command order (labels) | Stock writer | Open guard |
| --- | --- | --- | --- | --- |
| `WALK-STOCK` | SEQ-STOCK / QA-SCN-STOCK | Inquiry/Quotation optional → fulfillment STOCK → confirm Sales Order → `RequestReservation` / `ActivateReservation` → pack → `DispatchShipment` → invoice → `AllocatePayment`. `CloseSalesOrder` stays open. | `ACT-IPS` on reservation and exit | OQ-007, OQ-006; reservation OQ-008; QC OQ-005 |
| `WALK-PURCHASE` | SEQ-PURCHASE / QA-SCN-PURCHASE | Fulfillment PURCHASE → confirm Sales Order (purchase-need) → PO send → `ReceiveGoods` / optional `HoldInboundForQc` → `PostGoodsReceipt` (`ADP-WEIGHBRIDGE` may command) → continue SEQ-STOCK from reservation | `ACT-IPS` posts GR bundle; Procurement does not write quantity (INV-018) | OQ-019 (PO approve), OQ-005, OQ-011, OQ-015 |
| `WALK-MAKE` | SEQ-MAKE / QA-SCN-MAKE | Fulfillment MAKE → `StartOrderProduction` → release Production Order → allocation issue (`IssueUnitFromAllocation`) → `CompleteProductionOperation` bundle → residual/scrap → QC if required → SEQ-STOCK from pack | `ACT-IPS` on consume/output; Production writes facts, not Ledger tables | OQ-003, OQ-009, OQ-006, OQ-005, OQ-007 |
| `WALK-NOT-FEASIBLE` | SEQ-NOT-FEASIBLE / QA-SCN-NOT-FEASIBLE | `RecordFulfillmentNotFeasible` → `RecordUnfulfilledDemand` (INV-013). No Sales Order required. Not overdue. | none | — |

Each accepted command uses one idempotency key (INV-016). Bundles in
APP-ORCH-001 must not split.

## Bundle walks (DATA-TX-001 / QA-SCN-BUNDLE)

| Walk | Must stay one transaction | Must not |
| --- | --- | --- |
| `WALK-BUNDLE-COMPLETE-OP` | `CompleteProductionOperation` + consume/output/residual/scrap postings | Posted subset; second stock writer |
| `WALK-BUNDLE-DISPATCH` | `DispatchShipment` + stock exit (INV-017) | Shipping writes Ledger |
| `WALK-BUNDLE-GR` | `PostGoodsReceipt` + Lot/Unit/Ledger | Weighbridge or Procurement writes quantity |
| `WALK-BUNDLE-RESERVE` | `ActivateReservation` + reserved state + reserved qty | Balance-only reserved qty |
| `WALK-BUNDLE-PAY` | `AllocatePayment` + invoice open-balance reduction | Finance-Lite as legal GL |
| `WALK-BUNDLE-RESIDUAL` | `CreateResidualUnit` + parent close/split | Guessed residual cutoff (OQ-009) |

How the bundle is committed stays OQ-017.

## Exception walks

| Walk | Approved scenario | Rule | Open |
| --- | --- | --- | --- |
| `WALK-REVERSE` | SEQ-REVERSE / QA-SCN-REVERSE | New compensating command; original posted row stays (INV-005) | OQ-015, OQ-017, OQ-019 |
| `WALK-SOD-GR` | QA-SCN-SOD-GR | `ReverseGoodsReceipt` needs a different human than the original post (SV-013) | OQ-015, OQ-019 |
| `WALK-SOD-FIN` | QA-SCN-SOD | VoidInvoice / ReversePayment needs a second distinct identity (SV-007) | OQ-019 |
| `WALK-QC-HOLD` | QA-SCN-QC-HOLD | Stock not available/shippable while required QC is open (INV-010) | OQ-005 |
| `WALK-REJECT-OPEN` | QA-SCN-REJECT-OPEN | Command needing an unanswered OQ rejects; no posted fact | matching `OQ-*` |
| `WALK-REJECT-GENEALOGY` | QA-SCN-REJECT-GENEALOGY | No `EditGenealogy`; rebuild from Ledger (INV-019) | — |
| `WALK-REJECT-ADJUST` | QA-SCN-REJECT-ADJUST | No `AdjustBalance` | — |
| `WALK-PORTAL` | QA-SCN-REJECT-PORTAL | `PortalPlaceOrder` / `ADP-PORTAL` order write rejected in MVP (INV-020) | OQ-010 |
| `WALK-WORKER` | QA-SCN-WORKER | Transport retry uses the same key; worker is not the commander (SV-009) | OQ-018 transport |
| `WALK-UI-LEDGER` | QA-SCN-UI-LEDGER | UI-claimed `ACT-SALES` cannot write Ledger (SV-001, INV-015) | — |
| `WALK-ISOLATION` | QA-SCN-ISOLATION / QA-SCN-EVENT-ISO | Customer A must not see customer B on query, export, or `ADP-LIVE` (SV-005 / SV-012) | — |
| `WALK-IDEMPOTENT` | QA-SCN-IDEMPOTENT | Same key returns first result; no second GR/dispatch/payment/completion | — |
| `WALK-SHIP-NO-DEMAND` | QA-SCN-SHIP-NO-DEMAND | DraftShipment without order needs exceptional authority (INV-011) | OQ-019 |
| `WALK-PAUSE-RESUME` | QA-SCN-PAUSE-RESUME | Production Order PAUSED then `ResumeProductionOrder` | FIND-027 |
| `WALK-CUTOVER` | ADP-CUTOVER | Opening-stock loader stays `GUARD_OPEN_POLICY` | OQ-015, OQ-019 |
| `WALK-RESTORE` | DR-RESTORE | Restore rebuilds Balance/Genealogy from Ledger; never `AdjustBalance` / `EditGenealogy` | OQ-016 |

Sales cancel/hold is **not** walked as a closed SoD pair. That remains
the Phase 06 baseline.

## Must not decide here

- Named UAT actors (OQ-019)
- Fixture volumes (OQ-014)
- A runner or CI product (OQ-018)
- Numeric UOM, tolerance, residual, or routing oracles
