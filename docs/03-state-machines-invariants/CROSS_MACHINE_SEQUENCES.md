---
id: SM-SEQ-001
title: Cross-Machine Sequences
phase: 03-state-machines-invariants
status: approved
version: 0.1.0
owners: [chief-solution-architect, domain-leads]
depends_on: [SM-TRANS-001, SM-SIDE-001, SM-INV-001, APR-004, APR-005, ASM-016]
last_reviewed: 2026-09-16
approval: APR-005
supersedes: null
---

# Cross-Machine Sequences

End-to-end command order across machines. These are proposed sequences, not
executable workflows. A step whose guard is an unanswered OQ stops with
`GUARD_OPEN_POLICY`. No quantity, person, or cutoff is invented.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

Commands and actors are those in
[TRANSITION_TABLES.md](TRANSITION_TABLES.md). Side effects are those in
[SIDE_EFFECT_MATRIX.md](SIDE_EFFECT_MATRIX.md).

## SEQ-STOCK — sell what is already available

1. Optional: `RecordInquiry` → `IssueQuotationFromInquiry` / `IssueQuotation`.
2. `DraftFulfillmentAssessment` then `RecordFulfillmentStock` (availability
   is a read, INV-003).
3. `DraftSalesOrder` → `SubmitSalesOrder` → `ConfirmSalesOrder`. Confirm
   commands Reservation only as already assessed.
4. `RequestReservation` then `ActivateReservation`. If free stock is
   insufficient, or the unit already has an `ACTIVE` reservation:
   `GUARD_INVARIANT` (INV-002) / `GUARD_CONFLICT`. Later SO must not steal
   (OQ-008). Partial claimed qty is not a second `ACTIVE` slot on the
   same unit.
5. Unit must be `AVAILABLE` or become so after QC release. Required QC
   still pending: `GUARD_INVARIANT` (INV-010) or `GUARD_OPEN_POLICY` /
   OQ-005.
6. `DraftPackage` → `PackPackage` → `AssignPackageToShipment`.
7. `DraftShipment` → `MarkShipmentReady` → `StartLoading` →
   `DispatchShipment`. Dispatch commands ACT-IPS stock exit (INV-017).
   Over-delivery needs OQ-006.
8. `ConfirmDelivery` commands Finance-Lite facts. Sales does not write
   Invoice.
9. `DraftInvoice` → `IssueInvoice`. `RecordPayment` → `AllocatePayment`
   (INV-012).
10. `CloseSalesOrder` after `FULFILLED` (remaining valid demand already zero
    within OQ-006; shipment `DELIVERED` is not a close prerequisite), or
    after `PARTIALLY_FULFILLED` with authorized Unfulfilled Demand for
    remainder, or after `CANCELLED` (OQ-007). Payment and invoice status
    are not guards. Sales must not write Invoice rows. Delivery /
    `CloseInvoice` must not write the Sales Order.

`IN_PRODUCTION` is not used.

```mermaid
flowchart LR
  FA[Fulfillment STOCK] --> SO[Sales Order confirmed]
  SO --> RSV[Reservation active]
  RSV --> PKG[Package packed]
  PKG --> SHP[Shipment dispatched]
  SHP --> INV[Invoice issued]
  INV --> PAY[Payment allocated]
```

## SEQ-PURCHASE — buy then fulfill

1. `DraftFulfillmentAssessment` then `RecordFulfillmentPurchase`.
2. `ConfirmSalesOrder` commands a purchase-need. No Production Order.
3. `DraftPurchaseOrder` → `SubmitPurchaseOrder` → `ApprovePurchaseOrder`
   (`open: OQ-019`) → `SendPurchaseOrder`.
4. `DraftGoodsReceipt` → `ReceiveGoods`. If inbound QC is required:
   `HoldInboundForQc` then later `PostGoodsReceipt`. Plans and releasers
   stay OQ-005. Opening-stock cutover stays OQ-015.
5. ACT-IPS posts Lot/Unit. Procurement does not write quantity (INV-018).
6. After the unit is `AVAILABLE`, continue from SEQ-STOCK step 4
   (reservation if still required) through shipment and finance.
7. `ClosePurchaseOrder` is independent of `CloseSalesOrder`.

A Sales Order on the PURCHASE path may go `CONFIRMED → PARTIALLY_FULFILLED`
or `CONFIRMED → FULFILLED` without `IN_PRODUCTION`.

```mermaid
flowchart LR
  FA[Fulfillment PURCHASE] --> SO[Sales Order confirmed]
  SO --> PO[Purchase Order sent]
  PO --> GR[Goods Receipt posted]
  GR --> RSV[Reservation or ship]
  RSV --> SHP[Shipment dispatched]
```

## SEQ-MAKE — produce then fulfill

1. `DraftFulfillmentAssessment` then `RecordFulfillmentMake`.
2. `ConfirmSalesOrder` then `StartOrderProduction` (`CONFIRMED →
   IN_PRODUCTION`).
3. `DraftProductionOrder` → `PlanProductionOrder` →
   `ReleaseProductionOrder` (`open: OQ-003`).
4. `PlanMaterialAllocation` → `AssignMaterialAllocation` →
   `IssueAllocatedMaterial`. Reservation is not required (INV-003).
5. `IssueUnitFromAllocation` moves the unit `AVAILABLE →
   ISSUED_TO_PRODUCTION`.
6. `StartProductionOperation` → `CompleteProductionOperation`. This is
   the exclusive production posting boundary (OQ-003, INV-006). In **one**
   business transaction: consumption, good output/WIP, leftover
   classification (reusable residual **or** scrap for each leftover kg),
   process loss, genealogy source facts, and Inventory Ledger postings
   via `ACT-IPS`. Nested names (`RecordResidualFact`,
   `CreateResidualUnit`, `ConvertResidualToScrap`, `RecordScrapFact`,
   `PostScrapMovement`, `ConsumeUnitPartial` / `ConsumeUnitComplete`,
   `ScrapUnit` when the parent destiny is `SCRAPPED`) run inside this
   transaction. They are not later independent inventory postings.
   Official step **names** stay OQ-003 treating. Mass-balance tolerance
   stays OQ-006. Residual cutoff **numbers** stay OQ-009 treating;
   missing cutoff when classification requires it → `GUARD_OPEN_POLICY`.
7. After the child residual unit exists (if any): `PlaceResidualUnit`
   and output QC as required (OQ-005) before the unit may become
   shippable (INV-010). Placement and QC must not post residual or scrap
   quantity again.
8. Continue from SEQ-STOCK step 6 through shipment and finance.
9. `CloseProductionOrder` does not write Invoice. `CloseSalesOrder`
   follows OQ-007 and is independent of payment.
10. Superseded reading: a sequential residual/scrap posting **after**
    `CompleteProductionOperation` for the same leftover kg is forbidden
    (FIND-G-001, FIND-G-002).

```mermaid
flowchart LR
  FA[Fulfillment MAKE] --> SO[Sales Order IN_PRODUCTION]
  SO --> PR[Production Order released]
  PR --> AL[Allocation issued]
  AL --> OP[Operation completed]
  OP --> QC[QC if required]
  QC --> SHP[Shipment dispatched]
```

## SEQ-NOT-FEASIBLE — demand without an order

1. `DraftFulfillmentAssessment` then `RecordFulfillmentNotFeasible`.
2. `RecordUnfulfilledDemand` is mandatory (INV-013). A Sales Order is not.
3. `ReviewUnfulfilledDemand` → `CloseUnfulfilledDemand`, or
   `ReopenAsInquiry` (new Inquiry, not an edit of history).
4. Do not treat this as overdue demand. Overdue is an Invoice state
   (INV-013).

## SEQ-REVERSE — posted correction

A rejected command is not this sequence. After a posted write:

1. Issue a new compensating command (`ReverseGoodsReceipt`,
   `ReturnUnit`, `ReversePayment`, `VoidInvoice`,
   `ConfirmSalesOrderCancel` after reversals).
2. The original posted row stays. The new row carries reason, actor
   role, authority, timestamp, and a link to the original (INV-005,
   INV-014).
3. Named cutover authority stays OQ-015. Posting mechanism stays
   OQ-017.

## Shared stops

| If this is still unanswered | Sequence stops at |
| --- | --- |
| OQ-005 | inbound or output QC hold/release/post |
| OQ-006 | partial/over fulfillment, mass-balance close, over-delivery |
| OQ-009 | residual versus scrap |
| OQ-003 | production release, operation complete, allocation issue |
| OQ-019 | Purchase Order approve; shipment without demand |
| OQ-010 | any portal order command |
| `workshop-commercial-practice` | Inquiry or Quotation expire |
