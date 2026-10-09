---
id: SM-TRANS-001
title: Transition Tables
phase: 03-state-machines-invariants
status: in_review
version: 0.6.0
owners: [chief-solution-architect, domain-leads]
depends_on: [SM-CATALOGUE-001, SM-INV-001, SM-SIDE-001, APR-004, APR-005]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Transition Tables

## Current evidence precedence (2026-10-04)

APR-005 remains historical structure-approval evidence; this technical revision
is made under delegated ADR-0012 authority and does not approve a new baseline.
Live OQ-009/factory evidence supersedes automatic numeric Residual/Scrap
classification: a person decides reusability; recording and authority stay open.
OQ-006 is fulfillment tolerance only. Production mass-balance/process-loss
policy remains open under production evidence/OQ-009 and must not inherit its
zero default. Missing required later-slice policy stays GUARD_OPEN_POLICY.
Quality is future-only; portal MVP is isolated visibility-only; personal
operator accounts apply. OQ answers/statuses are unchanged. Older draft/seed,
RACI and historical handoff wording cannot override these live facts.


Per-transition structure for every machine in
[STATE_MACHINE_CATALOGUE.md](STATE_MACHINE_CATALOGUE.md). These rows are
proposed. They are not executable and not owner-signed.

Rejection default: source state unchanged; command rejected with a reason
([EVENT_AND_REJECTION.md](EVENT_AND_REJECTION.md)). Posted states correct by
reversal, not delete (INV-005). Temporary roster names cannot be the Actor.
`ACT-IPS` is mechanical only. Requirement links are `INV-*` and `REQ-OBJ-*`.
Detailed `REQ-*` and `TEST-*` IDs are not invented (FIND-021, FIND-028).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

OQ-005 current-MVP scope overrides the proposed QC-dependent rows below:
there is no Quality role or QC execution. Rows involving `ACT-QC`,
`QC_HOLD`, `PENDING_QC`, `QUARANTINED`, or Quality `Released` are future-only.
They are not required for `CompleteProductionOperation`, `PostGoodsReceipt`,
inventory availability, or shipment. Current-MVP valid normal stock-in
uses existing `CreateUnitFromPosting` to create the Inventory Unit as
`AVAILABLE` within the `ACT-IPS` posting transaction. Normal use is
eligible after commit, subject to existing guards (INV-003). No replacement
state or approval command is introduced.

## Column key

- **Guard**: a closed rule, or `open: OQ-*` if the team answer is still required
- **Effect**: owning-BC write plus commanded BCs; never a forbidden write
- **Event**: proposed name only; not an accepted integration protocol

## SM-INQUIRY

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | OPEN | RecordInquiry | ACT-SALES | Customer exists; ACT-CUST is not A/R; portal order path forbidden (INV-020) | Sales writes Inquiry | InquiryRecorded |
| OPEN | QUOTED | IssueQuotationFromInquiry | ACT-SALES | Quotation can be issued | Sales writes Inquiry + Quotation | InquiryQuoted |
| QUOTED | CONVERTED | ConvertInquiryToOrder | ACT-SALES | Sales Order may be confirmed | Sales writes Inquiry + starts SM-SALES-ORDER | InquiryConverted |
| OPEN or QUOTED | CANCELLED | CancelInquiry | ACT-SALES | not yet CONVERTED | Sales writes Inquiry | InquiryCancelled |
| OPEN or QUOTED | EXPIRED | ExpireInquiry | ACT-SALES | `open: workshop-commercial-practice`; do not invent a number | Sales writes Inquiry | InquiryExpired |
| any | OPEN | PortalRequestInquiry | (none in MVP) | `open: OQ-010`; rejected in MVP (INV-020) | none | none |

## SM-QUOTATION

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | DRAFT | DraftQuotation | ACT-SALES | Customer and commercial snapshot fields present (INV-014) | Sales writes Quotation | QuotationDrafted |
| DRAFT | ISSUED | IssueQuotation | ACT-SALES | snapshot frozen at issue | Sales writes Quotation | QuotationIssued |
| ISSUED | ACCEPTED | AcceptQuotation | ACT-SALES | may start or update Sales Order | Sales writes Quotation | QuotationAccepted |
| ISSUED | REJECTED | RejectQuotation | ACT-SALES | none numeric | Sales writes Quotation | QuotationRejected |
| ISSUED | SUPERSEDED | SupersedeQuotation | ACT-SALES | replacement Quotation exists | Sales writes both | QuotationSuperseded |
| DRAFT or ISSUED | EXPIRED | ExpireQuotation | ACT-SALES | `open: workshop-commercial-practice`; do not invent a number | Sales writes Quotation | QuotationExpired |

## SM-FULFILLMENT-ASSESSMENT

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | DRAFT | DraftFulfillmentAssessment | ACT-SALES | Inquiry or Sales Order demand exists | Sales writes assessment | FulfillmentAssessmentDrafted |
| DRAFT | RECORDED | RecordFulfillmentStock | ACT-SALES | availability is a read (INV-003) | Sales writes STOCK outcome; may command Reservation | FulfillmentStockRecorded |
| DRAFT | RECORDED | RecordFulfillmentPurchase | ACT-SALES | purchase path selected | Sales writes PURCHASE; commands Procurement | FulfillmentPurchaseRecorded |
| DRAFT | RECORDED | RecordFulfillmentMake | ACT-SALES | make path selected | Sales writes MAKE; commands Production | FulfillmentMakeRecorded |
| DRAFT | RECORDED | RecordFulfillmentNotFeasible | ACT-SALES | no stock, purchase, or make path | Sales writes NOT_FEASIBLE; must start SM-UNFULFILLED-DEMAND (INV-013) | FulfillmentNotFeasible |

## SM-SALES-ORDER

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | DRAFT | DraftSalesOrder | ACT-SALES | Customer; commercial snapshot (INV-014) | Sales writes Order | SalesOrderDrafted |
| DRAFT | SUBMITTED | SubmitSalesOrder | ACT-SALES | items exist | Sales writes Order | SalesOrderSubmitted |
| SUBMITTED | CONFIRMED | ConfirmSalesOrder | ACT-SALES | Fulfillment Assessment recorded | Sales writes Order; commands Reservation / PO / Production as assessed | SalesOrderConfirmed |
| CONFIRMED | IN_PRODUCTION | StartOrderProduction | ACT-PLAN / ACT-SALES | production path selected | Sales writes Order; Production may release | SalesOrderInProduction |
| CONFIRMED or IN_PRODUCTION | PARTIALLY_FULFILLED | RecordPartialFulfillment | ACT-SALES | Line permits partial shipment; OQ-006 default tolerance 0 or explicit configured limit; STOCK/PURCHASE stay CONFIRMED; MAKE may be IN_PRODUCTION | Sales writes Order | SalesOrderPartiallyFulfilled |
| CONFIRMED or IN_PRODUCTION or PARTIALLY_FULFILLED | FULFILLED | RecordFullFulfillment | ACT-SALES | remaining demand is zero within OQ-006 tolerance (default 0); IN_PRODUCTION is not required for STOCK/PURCHASE | Sales writes Order | SalesOrderFulfilled |
| FULFILLED | CLOSED | CloseSalesOrder | ACT-SALES | Remaining valid demand is zero within OQ-006 tolerance (default 0). Shipment `DELIVERED` is **not** an independent close prerequisite. Payment and invoice status are **not** guards. | Sales writes Order + closure reason/qty snapshot; must not write Invoice or Payment; may command `ReleaseReservation` if any ACTIVE reservation remains | SalesOrderClosed |
| PARTIALLY_FULFILLED | CLOSED | CloseSalesOrder | ACT-SALES | Remaining demand is covered by an authorized `RecordUnfulfilledDemand` fact (TERM-005 / INV-013). Outstanding **valid** remaining demand forbids close (OQ-007). Payment/invoice are not guards. | Sales writes Order + closure reason/fulfilled and unfulfilled qtys; must not write Invoice; commands `ReleaseReservation` for remaining ACTIVE reservations on this order | SalesOrderClosed |
| CANCELLED | CLOSED | CloseSalesOrder | ACT-SALES | Order already `CANCELLED` via `ConfirmSalesOrderCancel`. Payment/invoice are not guards. | Sales writes closure reason/qty snapshot only; no new stock post | SalesOrderClosed |
| CONFIRMED+ | ON_HOLD | HoldSalesOrder | ACT-SALES | SalesOrderChange, not return to Draft | Sales writes Order; may command Reservation release | SalesOrderHeld |
| ON_HOLD | prior live state | ReleaseSalesOrderHold | ACT-SALES | change record exists | Sales writes Order | SalesOrderHoldReleased |
| CONFIRMED+ | CANCEL_PENDING | RequestSalesOrderCancel | ACT-SALES | posted effects reverse, not delete (INV-005) | Sales writes Order | SalesOrderCancelRequested |
| CANCEL_PENDING | CANCELLED | ConfirmSalesOrderCancel | ACT-SALES | compensating reversals posted | Sales writes Order; commands `ReleaseReservation` for remaining ACTIVE reservations | SalesOrderCancelled |

### Canonical Sales Order closure (OQ-007 / FIND-G-003)

`CloseSalesOrder` is **not** `GUARD_OPEN_POLICY` for the missing rule.

| From | Required condition | Next | Required facts | Inventory effect | Payment / invoice |
| --- | --- | --- | --- | --- | --- |
| `FULFILLED` | Remaining valid demand is zero within OQ-006 (order already `FULFILLED`). Shipment `DELIVERED` is not a close prerequisite. | `CLOSED` | Closure reason + qty snapshot | May `ReleaseReservation` if any ACTIVE remains | **Not** a guard. Unpaid invoice may remain open. |
| `PARTIALLY_FULFILLED` | Remainder is **not** still valid open demand. Remainder must be an authorized TERM-005 Unfulfilled Demand (`RecordUnfulfilledDemand` at least `RECORDED`, linked to this order's remaining qty). | `CLOSED` | Unfulfilled Demand fact + closure reason + fulfilled/unfulfilled qtys | `ReleaseReservation` for remaining ACTIVE reservations on this order | **Not** a guard. |
| `CANCELLED` | Full-order cancel already completed | `CLOSED` | Cancel reversals already posted; closure reason/qty snapshot | None new (release already on confirm-cancel) | **Not** a guard. |

Forbidden closes:

- `PARTIALLY_FULFILLED` (or `CONFIRMED` / `IN_PRODUCTION`) while remaining demand is still a valid commitment → `GUARD_INVARIANT` (OQ-007).
- Close because an invoice is `PAID` → forbidden. `CloseInvoice` / `AllocatePayment` must not write the Sales Order.
- Close because a shipment is `DELIVERED` alone → forbidden. Delivery is a fulfillment **fact**, not a close guard. Sales records `RecordFullFulfillment` / `RecordPartialFulfillment` from remaining-demand truth, then `CloseSalesOrder` if the close predicate holds.
- Collapse Unfulfilled Demand into overdue, delayed, awaiting-supply, or quotation-rejected. Those are different records:
  - **Unfulfilled / lost demand:** TERM-005 / SM-UNFULFILLED-DEMAND
  - **Overdue:** Invoice `OVERDUE` (INV-013)
  - **Awaiting supply:** SO stays `CONFIRMED` / `IN_PRODUCTION` / `PARTIALLY_FULFILLED` on PURCHASE or MAKE
  - **Delayed:** not an SO state
  - **Rejected:** SM-QUOTATION `REJECTED`
  - **Cancelled:** SM-SALES-ORDER `CANCELLED` (then optional `CLOSED`)

Shipment completion does not by itself close the Sales Order.

## SM-UNFULFILLED-DEMAND

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | RECORDED | RecordUnfulfilledDemand | ACT-SALES | no Sales Order required (INV-013); **may** reference a Sales Order remainder when used for OQ-007 close | Sales writes Unfulfilled Demand | UnfulfilledDemandRecorded |
| RECORDED | REVIEWED | ReviewUnfulfilledDemand | ACT-SALES | reason present | Sales writes record | UnfulfilledDemandReviewed |
| REVIEWED | CLOSED | CloseUnfulfilledDemand | ACT-SALES | none numeric | Sales writes record | UnfulfilledDemandClosed |
| REVIEWED or CLOSED | REOPENED_AS_INQUIRY | ReopenAsInquiry | ACT-SALES | new Inquiry, not an edit of history | Sales writes Inquiry | UnfulfilledDemandReopened |

## SM-PURCHASE-ORDER

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | DRAFT | DraftPurchaseOrder | ACT-PROC | Supplier exists | Procurement writes PO | PurchaseOrderDrafted |
| DRAFT | SUBMITTED | SubmitPurchaseOrder | ACT-PROC | lines exist | Procurement writes PO | PurchaseOrderSubmitted |
| SUBMITTED | APPROVED | ApprovePurchaseOrder | ACT-PROC | `open: OQ-019` named approver | Procurement writes PO | PurchaseOrderApproved |
| APPROVED | SENT | SendPurchaseOrder | ACT-PROC | none numeric | Procurement writes PO | PurchaseOrderSent |
| SENT | PARTIALLY_RECEIVED | RecordPartialReceipt | ACT-PROC | GoodsReceipt orchestration started | Procurement writes PO; does not post stock | PurchaseOrderPartiallyReceived |
| PARTIALLY_RECEIVED or SENT | RECEIVED | RecordFullReceipt | ACT-PROC | remaining qty; stock still via Inventory | Procurement writes PO | PurchaseOrderReceived |
| RECEIVED | CLOSED | ClosePurchaseOrder | ACT-PROC | none for stock | Procurement writes PO | PurchaseOrderClosed |
| live | ON_HOLD | HoldPurchaseOrder | ACT-PROC | not posted stock | Procurement writes PO | PurchaseOrderHeld |
| live pre-post | CANCELLED | CancelPurchaseOrder | ACT-PROC | posted receipts reverse first | Procurement writes PO | PurchaseOrderCancelled |

## SM-GOODS-RECEIPT

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | DRAFT | DraftGoodsReceipt | ACT-PROC; individual ACT-WH for internally composed normal manual intake | authorized purchasing reference where applicable; APR-021 manual intake requires no mandatory PO/ticket | Procurement writes GR | GoodsReceiptDrafted |
| DRAFT | RECEIVED | ReceiveGoods | ACT-PROC / ACT-WH | physical receive evidence | Procurement writes GR; no current-MVP QC request | GoodsReceived |
| RECEIVED | QC_HOLD | HoldInboundForQc | ACT-QC | **Future Quality only**; `open: OQ-005` | Quality writes inspection; commands Inventory hold; does not write stock | GoodsReceiptQcHeld |
| RECEIVED (or future `QC_HOLD`) | POSTED | PostGoodsReceipt | ACT-IPS | Accepted command guards pass; no current-MVP QC approval; future QC may apply INV-010 only if later enabled. OQ-015 opening stock is separate. | Inventory posts Lot/Unit/Ledger; valid normal resulting Unit is `AVAILABLE` on commit (INV-003). Procurement does not write quantity. | GoodsReceiptPosted |
| POSTED | POSTED (reversal) | ReverseGoodsReceipt | ACT-IPS | INV-005; normal receipt reversal is separate from OQ-015 opening-stock correction | new reversing Ledger rows | GoodsReceiptReversed |

APR-021 normal manual increment exposes one PostGoodsReceipt action by a current
individual ACT-WH commander; ACT-IPS executes quantity effects. The action
records DRAFT -> RECEIVED -> POSTED within its atomic bundle, without extra user
steps, Procurement posting authority, mandatory PO/ticket or a QC gate.

## SM-RESERVATION

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | REQUESTED | RequestReservation | ACT-SALES | confirmed demand | command only | ReservationRequested |
| REQUESTED | ACTIVE | ActivateReservation | ACT-IPS | available >= claim (INV-002, INV-003); unit has **no** other ACTIVE reservation; later SO must not steal an existing ACTIVE; if two confirmed SOs compete for this unit, earlier `ConfirmSalesOrder` timestamp is the OQ-008 commercial winner. `REQUESTED` does not occupy the unique ACTIVE slot. `ConfirmSalesOrder` does not itself create REQUESTED (`RequestReservation` is a distinct command). | Inventory writes Reservation + unit reserved-state + reserved qty (DATA-TX-001) | ReservationActivated |
| ACTIVE | CONSUMED | ConsumeReservation | ACT-IPS | issue/ship path authorized. Reservation is not Consumption (INV-003); Ledger consume/exit is a separate IPS post | Inventory writes Reservation | ReservationConsumed |
| ACTIVE | RELEASED | ReleaseReservation | ACT-SALES command / ACT-IPS write | none numeric | Inventory writes Reservation; unit returns to `AVAILABLE` when no other destiny (INV-004); reserved qty released | ReservationReleased |
| ACTIVE | EXPIRED | ExpireReservation | ACT-IPS | Confirmed-SO reservations: **not** timer expiry (OQ-008). Allowed only for orphan/stale rows whose owning commitment no longer exists (`ReservationExpirySweep`). | Inventory writes Reservation; unit eligibility same as release | ReservationExpired |

## SM-INVENTORY-UNIT

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | AVAILABLE | CreateUnitFromPosting | ACT-IPS | **Current-MVP normal stock-in**; valid authorized posting, kg quantity, identity, location, idempotency, concurrency, and no-negative guards pass (INV-001–004, INV-016). No QC release. | Inventory writes Unit and Ledger within the accepted stock-in transaction; lifecycle eligibility begins after commit, while Ledger remains quantity truth. | InventoryUnitCreated |
| (none) | PENDING_QC | CreateUnitFromPosting | ACT-IPS | **Future Quality path only**; GoodsReceipt or output posting if a later approved QC scope requires it. | Inventory writes Unit/Ledger | InventoryUnitCreated |
| PENDING_QC | AVAILABLE | ReleaseUnit | ACT-IPS commanded by ACT-QC | **Future Quality only**; INV-010; `open: OQ-005` | Inventory writes Unit | InventoryUnitAvailable |
| PENDING_QC or AVAILABLE | QUARANTINED | QuarantineUnit | ACT-IPS commanded by ACT-QC | **Future Quality only**; INV-017 | Inventory writes Unit | InventoryUnitQuarantined |
| AVAILABLE | RESERVED | ReserveUnit | ACT-IPS | Nested in `ActivateReservation` bundle; INV-002, INV-003; one ACTIVE reservation per unit (OQ-008) | Inventory writes Unit reserved-state | InventoryUnitReserved |
| RESERVED | ISSUED_TO_PRODUCTION | IssueUnit | ACT-IPS | Production Order released; INV-004 | Inventory writes Unit/Ledger | InventoryUnitIssued |
| AVAILABLE | ISSUED_TO_PRODUCTION | IssueUnitFromAllocation | ACT-IPS | SM-MATERIAL-ALLOCATION is ISSUED; INV-003, INV-004; `open: OQ-003` | Inventory writes Unit/Ledger | InventoryUnitIssued |
| ISSUED_TO_PRODUCTION | PARTIALLY_CONSUMED | ConsumeUnitPartial | ACT-IPS nested inside `CompleteProductionOperation` | INV-006; independent call `GUARD_INVARIANT`; `open: OQ-001` arithmetic policy; OQ-002 measured kg answered | Inventory writes Unit/Ledger consume side of the completion bundle; Production writes consumption fact | InventoryUnitPartiallyConsumed |
| ISSUED_TO_PRODUCTION or PARTIALLY_CONSUMED | CONSUMED | ConsumeUnitComplete | ACT-IPS nested inside `CompleteProductionOperation` | same; independent production consume forbidden | Inventory writes Unit/Ledger consume side of the completion bundle | InventoryUnitConsumed |
| AVAILABLE or RESERVED | PACKED | PackUnit | ACT-IPS commanded by ACT-SHIP | INV-017; `open: OQ-004` | Inventory writes Unit | InventoryUnitPacked |
| PACKED | SHIPPED | ShipUnit | ACT-IPS commanded by ACT-SHIP | SM-SHIPMENT dispatched; INV-011 | Inventory writes Unit/Ledger exit | InventoryUnitShipped |
| any live | SCRAPPED | ScrapUnit | ACT-IPS commanded by ACT-OP or ACT-QC | paired SM-SCRAP fact; scrap **quantity** is `PostScrapMovement` only (OQ-009) | Inventory writes Unit destiny `SCRAPPED`; does not post a second scrap qty | InventoryUnitScrapped |
| SHIPPED | RETURNED | ReturnUnit | ACT-IPS | reversal, not delete (INV-005) | Inventory writes Unit/Ledger | InventoryUnitReturned |
| terminal | CLOSED | CloseUnit | ACT-IPS | no remaining quantity | Inventory writes Unit | InventoryUnitClosed |

## SM-MATERIAL-ALLOCATION

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | PLANNED | PlanMaterialAllocation | ACT-PLAN | distinct from Reservation (INV-003) | Production writes Allocation | MaterialAllocationPlanned |
| PLANNED | ASSIGNED | AssignMaterialAllocation | ACT-PLAN | Unit or Lot identified | Production writes Allocation | MaterialAllocationAssigned |
| ASSIGNED | ISSUED | IssueAllocatedMaterial | ACT-IPS | Production Order released; `open: OQ-003` | Inventory posts issue; Production does not write Ledger | MaterialAllocationIssued |
| PLANNED or ASSIGNED | RELEASED | ReleaseMaterialAllocation | ACT-PLAN | not yet issued, or issued then reversed | Production writes Allocation | MaterialAllocationReleased |

## SM-PRODUCTION-OPERATION

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | PLANNED | PlanProductionOperation | ACT-PLAN | `open: OQ-003` routing storage/version/lifecycle; ten Stations recorded | Production writes Operation | ProductionOperationPlanned |
| PLANNED | IN_PROGRESS | StartProductionOperation | ACT-OP | order is RELEASED or IN_PROGRESS | Production writes Operation | ProductionOperationStarted |
| IN_PROGRESS | COMPLETED | CompleteProductionOperation | ACT-OP | INV-006 exclusive posting boundary; routing storage/version/lifecycle `open: OQ-003` (ten Stations already recorded); production mass-balance policy and human disposition recording/authority `open: OQ-009` (OQ-006 is fulfillment tolerance, not mass balance); no current-MVP QC guard | One transaction: consume/output/leftover residual **or** scrap, process loss, genealogy source facts, nested IPS identity/qty posts. Valid normal good/reusable output Units are `AVAILABLE` on commit; Scrap is not. QC request is deferred to a future Quality scope only. See DATA-TX-001. | ProductionOperationCompleted |
| PLANNED | SKIPPED | SkipProductionOperation | ACT-PLAN | Factory per-order route may skip Stations; operation skip lifecycle/authority remains OQ-003/OQ-019, no inventory post implied | Production writes Operation; no silent stock change | ProductionOperationSkipped |
| COMPLETED | REWORK | StartReworkOperation | ACT-OP | INV-005, INV-009; `open: OQ-003` | new operation/fact; prior posted facts reverse, not edit | ProductionOperationRework |

## SM-PRODUCTION-ORDER

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | DRAFT | DraftProductionOrder | ACT-PLAN | demand or make-need reference | Production writes PO | ProductionOrderDrafted |
| DRAFT | PLANNED | PlanProductionOrder | ACT-PLAN | allocation distinct from Reservation (INV-003) | Production writes PO + Allocation | ProductionOrderPlanned |
| PLANNED | RELEASED | ReleaseProductionOrder | ACT-PLAN | `open: OQ-003` | Production writes PO; commands issue | ProductionOrderReleased |
| RELEASED | IN_PROGRESS | StartProductionOrder | ACT-OP | issued material or allowed start | Production writes PO | ProductionOrderInProgress |
| IN_PROGRESS | PARTIALLY_COMPLETED | CompleteOperationPartial | ACT-OP | At least one operation `COMPLETED` via `CompleteProductionOperation`; remaining operations exist | Production writes PO state only; **no** Ledger, residual, or scrap post | ProductionOrderPartiallyCompleted |
| IN_PROGRESS or PARTIALLY_COMPLETED | COMPLETED | CompleteProductionOrder | ACT-OP / ACT-PLAN | remaining operations done; mass-balance policy open under production evidence/OQ-009, separate from OQ-006 | Production writes PO | ProductionOrderCompleted |
| COMPLETED | CLOSED | CloseProductionOrder | ACT-PLAN | none for stock | Production writes PO | ProductionOrderClosed |
| live | PAUSED | PauseProductionOrder | ACT-PLAN / ACT-OP | none numeric | Production writes PO | ProductionOrderPaused |
| PAUSED | prior live state | ResumeProductionOrder | ACT-PLAN / ACT-OP | change record exists; QC hold applies only in future Quality scope | Production writes PO | ProductionOrderResumed |
| live | ON_HOLD | HoldProductionOrder | ACT-PLAN or future ACT-QC command | QC may command hold only in future Quality scope | Production writes PO; may command Inventory | ProductionOrderHeld |
| pre-post | CANCELLED | CancelProductionOrder | ACT-PLAN | posted issues reverse first | Production writes PO | ProductionOrderCancelled |
| live | ABORTED | AbortProductionOrder | ACT-PLAN | residual/scrap facts required | Production writes PO | ProductionOrderAborted |

## SM-RESIDUAL

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | FACT_RECORDED | RecordResidualFact | ACT-OP nested inside `CompleteProductionOperation` | parent Unit known; leftover of this operation is not independently postable (INV-006) | Production writes residual fact, not Ledger | ResidualFactRecorded |
| FACT_RECORDED | UNIT_CREATED | CreateResidualUnit | ACT-IPS nested inside `CompleteProductionOperation` | INV-008; `open: OQ-009` usable; not a second qty post after completion | Inventory creates child Unit as `AVAILABLE` for current-MVP normal use on valid commit; parent closed/split; residual on-hand Ledger **once** | ResidualUnitCreated |
| FACT_RECORDED | BELOW_THRESHOLD_TO_SCRAP (**historical superseded proposal only**) | ConvertResidualToScrap (historical numeric-branch mapping only) | no current-MVP executable actor mapping | Forbidden as automatic threshold classification; OQ-009 human disposition/authority remains required | No current transition or write; non-reusable leftover uses existing nested RecordScrapFact/PostScrapMovement under human disposition | ResidualBelowThreshold (historical, not emitted) |
| UNIT_CREATED | AVAILABLE_OR_QUARANTINE | PlaceResidualUnit | ACT-IPS | Historical/future placement/QC branch; not required to make a valid current-MVP child Unit `AVAILABLE`. Quarantine applies only in future Quality scope (INV-010). | Follow-on placement where applicable may change location without a second quantity post; no current-MVP release effect | ResidualUnitPlaced |

## SM-SCRAP

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | FACT_RECORDED | RecordScrapFact | ACT-OP; ACT-QC future only | quantity, reason, origin; production leftover nested in `CompleteProductionOperation` | Production writes scrap fact; future Quality may do so only if enabled. Neither writes stock. | ScrapFactRecorded |
| FACT_RECORDED | STOCK_POSTED | PostScrapMovement | ACT-IPS | INV-001, INV-017; OQ-009 authoritative scrap **qty**; one Ledger row per scrap fact | Inventory posts scrap quantity once | ScrapStockPosted |
| STOCK_POSTED | CLOSED | CloseScrap | ACT-OP; ACT-QC future only | none numeric | owning fact closed | ScrapClosed |

## SM-QUALITY-INSPECTION — future/deferred, outside current MVP

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | PLANNED | PlanInspection | ACT-QC | `open: OQ-005` plan | Quality writes inspection | QualityInspectionPlanned |
| PLANNED | IN_PROGRESS | StartInspection | ACT-QC | none numeric | Quality writes inspection | QualityInspectionStarted |
| IN_PROGRESS | COMPLETED | CompleteInspection | ACT-QC | evidence recorded | Quality writes inspection | QualityInspectionCompleted |
| COMPLETED | ACCEPTED | AcceptInspection | ACT-QC | `open: OQ-005` | Quality writes disposition; commands Inventory release | QualityAccepted |
| COMPLETED | CONDITIONAL | ConditionallyRelease | ACT-QC | `open: OQ-005` named exception | Quality writes disposition; commands Inventory | QualityConditional |
| COMPLETED | QUARANTINED | QuarantineFromInspection | ACT-QC | INV-017 | commands Inventory quarantine | QualityQuarantined |
| COMPLETED | REJECTED | RejectInspection | ACT-QC | INV-010 | commands reject/scrap path; no shipment | QualityRejected |

Normal MVP shipment increment under APR-024 (2026-10-09) implements preparation through dispatch only. Contents are complete already-reserved Units for confirmed demand; no split or exceptional shipment, customer delivery, carrier workflow or second approval. This bounded policy does not enable every architectural branch below. Required evidence is Shipment/order/Unit/kg/personal actor/system time/outcome with envelope audit/idempotency. Dispatch is not Sales fulfillment or closure.

## SM-PACKAGE

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | DRAFT | DraftPackage | ACT-SHIP | permitted contents; `open: OQ-004`. Quality release only in future QC scope | Shipping writes Package | PackageDrafted |
| DRAFT | PACKED | PackPackage | ACT-SHIP | INV-011; INV-010 only in future QC scope | Shipping writes Package; may command Inventory pack-state | PackagePacked |
| PACKED | ASSIGNED_TO_SHIPMENT | AssignPackageToShipment | ACT-SHIP | Shipment draft exists | Shipping writes Package + Shipment | PackageAssigned |
| PACKED | UNPACKED | UnpackPackage | ACT-SHIP | not yet dispatched | Shipping writes Package; reverse pack-state if posted | PackageUnpacked |

## SM-SHIPMENT

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | DRAFT | DraftShipment | ACT-SHIP | authorized customer/order or INV-011 exceptional authority; named person `open: OQ-019`; not OQ-005 | Shipping writes Shipment | ShipmentDrafted |
| DRAFT | READY | MarkShipmentReady | ACT-SHIP | authorized contents and OQ-006 fulfillment tolerance default 0 or explicit configuration; normal shipment authority/procedure answered APR-024: individual ACT-SHIP, complete reserved Units, no payment/invoice gate; exception/delivery policies remain deferred; Quality `Released` only in future QC scope, not current MVP | Shipping writes Shipment | ShipmentReady |
| READY | LOADING | StartLoading | ACT-SHIP | none numeric | Shipping writes Shipment | ShipmentLoading |
| LOADING | DISPATCHED | DispatchShipment | ACT-SHIP | commands ACT-IPS stock exit (INV-017) | Shipping writes Shipment; Inventory posts exit | ShipmentDispatched |
| DISPATCHED | PARTIALLY_DELIVERED | RecordPartialDelivery | ACT-SHIP | OQ-006 partial fulfillment permission/default 0 where applicable; actual delivery attribution/procedure remains later policy | Shipping writes Shipment | ShipmentPartiallyDelivered |
| DISPATCHED or PARTIALLY_DELIVERED | DELIVERED | ConfirmDelivery | ACT-SHIP | remaining fulfillment qty within OQ-006 default 0 or explicit configuration; delivery confirmation procedure/authority remains later policy | Shipping writes Shipment; commands Finance-Lite facts | ShipmentDelivered |
| DELIVERED | CLOSED | CloseShipment | ACT-SHIP | none for stock | Shipping writes Shipment | ShipmentClosed |

## SM-INVOICE

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | DRAFT | DraftInvoice | ACT-FIN | delivery or commercial facts | Finance-Lite writes Invoice | InvoiceDrafted |
| DRAFT | ISSUED | IssueInvoice | ACT-FIN | INV-012, INV-014 | Finance-Lite writes Invoice; not legal GL | InvoiceIssued |
| ISSUED | PARTIALLY_PAID | AllocatePartialPayment | ACT-FIN | allocation ≤ open balance (INV-012) | Finance-Lite writes Invoice + Payment | InvoicePartiallyPaid |
| ISSUED or PARTIALLY_PAID | PAID | AllocateFullPayment | ACT-FIN | open balance zero | Finance-Lite writes Invoice | InvoicePaid |
| PAID | CLOSED | CloseInvoice | ACT-FIN | Invoice lifecycle only (OQ-007). Must **not** close the Sales Order. | Finance-Lite writes Invoice | InvoiceClosed |
| ISSUED+ | OVERDUE | MarkInvoiceOverdue | ACT-FIN | overdue ≠ unfulfilled (INV-013) | Finance-Lite writes Invoice | InvoiceOverdue |
| ISSUED+ | VOID_PENDING | RequestInvoiceVoid | ACT-FIN | INV-005 | Finance-Lite writes Invoice | InvoiceVoidRequested |
| VOID_PENDING | VOIDED | VoidInvoice | ACT-FIN | reversing credit/void preserves history | Finance-Lite writes Invoice | InvoiceVoided |

## SM-PAYMENT

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | RECEIVED | RecordPayment | ACT-FIN | amount > 0; INV-016 | Finance-Lite writes Payment | PaymentReceived |
| RECEIVED | ALLOCATED | AllocatePayment | ACT-FIN | sum of allocations ≤ payment and ≤ invoice open (INV-012) | Finance-Lite writes Payment + Invoice | PaymentAllocated |
| RECEIVED | UNALLOCATED | LeavePaymentUnallocated | ACT-FIN | none numeric | Finance-Lite writes Payment | PaymentUnallocated |
| ALLOCATED | CLOSED | ClosePayment | ACT-FIN | none for stock | Finance-Lite writes Payment | PaymentClosed |
| RECEIVED or ALLOCATED | REVERSED | ReversePayment | ACT-FIN | INV-005, INV-016 | reversing Payment rows | PaymentReversed |

## Still not filled on purpose

- Technical arithmetic/persistence scale (OQ-001); OQ-002 measured kg answered
- Routing storage/version/lifecycle (OQ-003); ten physical Stations are recorded. Posting **boundary** is `CompleteProductionOperation` (recorded).
- Dependent catalogue/order identity mapping (OQ-004 hybrid grain is answered)
- Named QC releasers and numeric limits (OQ-005)
- Percent or weight tolerances (OQ-006)
- Family %/kg over-delivery (OQ-006 configuration; default 0 is answered)
- Future temporary-hold reservation TTL (OQ-008 residual only)
- Human reusability disposition recording and authority; no automatic cutoff (OQ-009)
- Required production mass-balance/process-loss policy (OQ-009 production evidence), distinct from fulfillment tolerance
- Named workshop approvers and exceptional-shipment person (OQ-019)
- Inquiry and Quotation expiry day counts (`workshop-commercial-practice`)
