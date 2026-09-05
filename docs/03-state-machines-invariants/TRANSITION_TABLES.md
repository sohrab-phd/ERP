---
id: SM-TRANS-001
title: Transition Tables
phase: 03-state-machines-invariants
status: approved
version: 0.3.0
owners: [chief-solution-architect, domain-leads]
depends_on: [SM-CATALOGUE-001, SM-INV-001, SM-SIDE-001, APR-004, APR-005]
last_reviewed: 2026-09-06
approval: APR-005
supersedes: null
---

# Transition Tables

Per-transition structure for every machine in
[STATE_MACHINE_CATALOGUE.md](STATE_MACHINE_CATALOGUE.md). These rows are
proposed. They are not executable and not owner-signed.

Rejection default: source state unchanged; command rejected with a reason
([EVENT_AND_REJECTION.md](EVENT_AND_REJECTION.md)). Posted states correct by
reversal, not delete (INV-005). Temporary roster names cannot be the Actor.
`ACT-IPS` is mechanical only. Requirement links are `INV-*` and `REQ-OBJ-*`.
Detailed `REQ-*` and `TEST-*` IDs are not invented (FIND-021, FIND-028).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

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
| CONFIRMED or IN_PRODUCTION | PARTIALLY_FULFILLED | RecordPartialFulfillment | ACT-SALES | `open: OQ-006`; STOCK/PURCHASE stay CONFIRMED; MAKE may be IN_PRODUCTION | Sales writes Order | SalesOrderPartiallyFulfilled |
| CONFIRMED or IN_PRODUCTION or PARTIALLY_FULFILLED | FULFILLED | RecordFullFulfillment | ACT-SALES | `open: OQ-006` remaining quantity; IN_PRODUCTION is not required for STOCK/PURCHASE | Sales writes Order | SalesOrderFulfilled |
| FULFILLED | CLOSED | CloseSalesOrder | ACT-SALES | `open: OQ-007` delivery, payment, or both | Sales writes Order; must not write Invoice | SalesOrderClosed |
| CONFIRMED+ | ON_HOLD | HoldSalesOrder | ACT-SALES | SalesOrderChange, not return to Draft | Sales writes Order; may command Reservation release | SalesOrderHeld |
| ON_HOLD | prior live state | ReleaseSalesOrderHold | ACT-SALES | change record exists | Sales writes Order | SalesOrderHoldReleased |
| CONFIRMED+ | CANCEL_PENDING | RequestSalesOrderCancel | ACT-SALES | posted effects reverse, not delete (INV-005) | Sales writes Order | SalesOrderCancelRequested |
| CANCEL_PENDING | CANCELLED | ConfirmSalesOrderCancel | ACT-SALES | compensating reversals posted | Sales writes Order | SalesOrderCancelled |

## SM-UNFULFILLED-DEMAND

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | RECORDED | RecordUnfulfilledDemand | ACT-SALES | no Sales Order required (INV-013) | Sales writes Unfulfilled Demand | UnfulfilledDemandRecorded |
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
| (none) | DRAFT | DraftGoodsReceipt | ACT-PROC | authorized PO or inbound reference (INV-018) | Procurement writes GR | GoodsReceiptDrafted |
| DRAFT | RECEIVED | ReceiveGoods | ACT-PROC / ACT-WH | physical receive evidence | Procurement writes GR; commands QC if required | GoodsReceived |
| RECEIVED | QC_HOLD | HoldInboundForQc | ACT-QC | `open: OQ-005` | Quality writes inspection; commands Inventory hold; does not write stock | GoodsReceiptQcHeld |
| RECEIVED or QC_HOLD | POSTED | PostGoodsReceipt | ACT-IPS | QC not blocking (INV-010); `open: OQ-005`, `open: OQ-015` | Inventory posts Lot/Unit/Ledger; Procurement does not write quantity | GoodsReceiptPosted |
| POSTED | POSTED (reversal) | ReverseGoodsReceipt | ACT-IPS | INV-005; `open: OQ-015` | new reversing Ledger rows | GoodsReceiptReversed |

## SM-RESERVATION

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | REQUESTED | RequestReservation | ACT-SALES | confirmed demand | command only | ReservationRequested |
| REQUESTED | ACTIVE | ActivateReservation | ACT-IPS | available >= claim (INV-002, INV-003); `open: OQ-008` | Inventory writes Reservation | ReservationActivated |
| ACTIVE | CONSUMED | ConsumeReservation | ACT-IPS | issue/ship path authorized | Inventory writes Reservation | ReservationConsumed |
| ACTIVE | RELEASED | ReleaseReservation | ACT-SALES command / ACT-IPS write | none numeric | Inventory writes Reservation | ReservationReleased |
| ACTIVE | EXPIRED | ExpireReservation | ACT-IPS | `open: OQ-008` | Inventory writes Reservation | ReservationExpired |

## SM-INVENTORY-UNIT

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | PENDING_QC | CreateUnitFromPosting | ACT-IPS | GoodsReceipt or output posting | Inventory writes Unit/Ledger | InventoryUnitCreated |
| PENDING_QC | AVAILABLE | ReleaseUnit | ACT-IPS commanded by ACT-QC | INV-010; `open: OQ-005` | Inventory writes Unit | InventoryUnitAvailable |
| PENDING_QC or AVAILABLE | QUARANTINED | QuarantineUnit | ACT-IPS commanded by ACT-QC | INV-017 | Inventory writes Unit | InventoryUnitQuarantined |
| AVAILABLE | RESERVED | ReserveUnit | ACT-IPS | INV-002, INV-003; `open: OQ-008` | Inventory writes Unit + Reservation | InventoryUnitReserved |
| RESERVED | ISSUED_TO_PRODUCTION | IssueUnit | ACT-IPS | Production Order released; INV-004 | Inventory writes Unit/Ledger | InventoryUnitIssued |
| AVAILABLE | ISSUED_TO_PRODUCTION | IssueUnitFromAllocation | ACT-IPS | SM-MATERIAL-ALLOCATION is ISSUED; INV-003, INV-004; `open: OQ-003` | Inventory writes Unit/Ledger | InventoryUnitIssued |
| ISSUED_TO_PRODUCTION | PARTIALLY_CONSUMED | ConsumeUnitPartial | ACT-IPS | `open: OQ-001`, `open: OQ-002`, `open: OQ-003` | Inventory writes Unit/Ledger; Production writes consumption fact | InventoryUnitPartiallyConsumed |
| ISSUED_TO_PRODUCTION or PARTIALLY_CONSUMED | CONSUMED | ConsumeUnitComplete | ACT-IPS | same open quantity guards | Inventory writes Unit/Ledger | InventoryUnitConsumed |
| AVAILABLE or RESERVED | PACKED | PackUnit | ACT-IPS commanded by ACT-SHIP | INV-017; `open: OQ-004` | Inventory writes Unit | InventoryUnitPacked |
| PACKED | SHIPPED | ShipUnit | ACT-IPS commanded by ACT-SHIP | SM-SHIPMENT dispatched; INV-011 | Inventory writes Unit/Ledger exit | InventoryUnitShipped |
| any live | SCRAPPED | ScrapUnit | ACT-IPS commanded by ACT-OP or ACT-QC | paired SM-SCRAP fact | Inventory writes Unit/Ledger | InventoryUnitScrapped |
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
| (none) | PLANNED | PlanProductionOperation | ACT-PLAN | `open: OQ-003` real step list | Production writes Operation | ProductionOperationPlanned |
| PLANNED | IN_PROGRESS | StartProductionOperation | ACT-OP | order is RELEASED or IN_PROGRESS | Production writes Operation | ProductionOperationStarted |
| IN_PROGRESS | COMPLETED | CompleteProductionOperation | ACT-OP | INV-006; `open: OQ-003`, `open: OQ-006`, `open: OQ-009` | atomic facts + Inventory postings + optional QC request | ProductionOperationCompleted |
| PLANNED | SKIPPED | SkipProductionOperation | ACT-PLAN | `open: OQ-003` whether skip is allowed | Production writes Operation; no silent stock change | ProductionOperationSkipped |
| COMPLETED | REWORK | StartReworkOperation | ACT-OP | INV-005, INV-009; `open: OQ-003` | new operation/fact; prior posted facts reverse, not edit | ProductionOperationRework |

## SM-PRODUCTION-ORDER

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | DRAFT | DraftProductionOrder | ACT-PLAN | demand or make-need reference | Production writes PO | ProductionOrderDrafted |
| DRAFT | PLANNED | PlanProductionOrder | ACT-PLAN | allocation distinct from Reservation (INV-003) | Production writes PO + Allocation | ProductionOrderPlanned |
| PLANNED | RELEASED | ReleaseProductionOrder | ACT-PLAN | `open: OQ-003` | Production writes PO; commands issue | ProductionOrderReleased |
| RELEASED | IN_PROGRESS | StartProductionOrder | ACT-OP | issued material or allowed start | Production writes PO | ProductionOrderInProgress |
| IN_PROGRESS | PARTIALLY_COMPLETED | CompleteOperationPartial | ACT-OP | INV-006; `open: OQ-003`, `open: OQ-006`, `open: OQ-009` | Production facts + Inventory postings + QC request | ProductionOperationCompleted |
| IN_PROGRESS or PARTIALLY_COMPLETED | COMPLETED | CompleteProductionOrder | ACT-OP / ACT-PLAN | remaining operations done; mass balance `open: OQ-006` | Production writes PO | ProductionOrderCompleted |
| COMPLETED | CLOSED | CloseProductionOrder | ACT-PLAN | none for stock | Production writes PO | ProductionOrderClosed |
| live | PAUSED | PauseProductionOrder | ACT-PLAN / ACT-OP | none numeric | Production writes PO | ProductionOrderPaused |
| PAUSED | prior live state | ResumeProductionOrder | ACT-PLAN / ACT-OP | change record exists; a QC hold must not still block | Production writes PO | ProductionOrderResumed |
| live | ON_HOLD | HoldProductionOrder | ACT-PLAN or ACT-QC command | QC may command hold | Production writes PO; may command Inventory | ProductionOrderHeld |
| pre-post | CANCELLED | CancelProductionOrder | ACT-PLAN | posted issues reverse first | Production writes PO | ProductionOrderCancelled |
| live | ABORTED | AbortProductionOrder | ACT-PLAN | residual/scrap facts required | Production writes PO | ProductionOrderAborted |

## SM-RESIDUAL

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | FACT_RECORDED | RecordResidualFact | ACT-OP | parent Unit known | Production writes residual fact | ResidualFactRecorded |
| FACT_RECORDED | UNIT_CREATED | CreateResidualUnit | ACT-IPS | INV-008; `open: OQ-009` usable | Inventory creates child Unit; parent closed/split | ResidualUnitCreated |
| FACT_RECORDED | BELOW_THRESHOLD_TO_SCRAP | ConvertResidualToScrap | ACT-OP / ACT-IPS | `open: OQ-009` | start SM-SCRAP instead | ResidualBelowThreshold |
| UNIT_CREATED | AVAILABLE_OR_QUARANTINE | PlaceResidualUnit | ACT-IPS | QC if required (INV-010) | Inventory writes child Unit | ResidualUnitPlaced |

## SM-SCRAP

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | FACT_RECORDED | RecordScrapFact | ACT-OP or ACT-QC | quantity, reason, origin | Production or Quality writes scrap fact, not stock | ScrapFactRecorded |
| FACT_RECORDED | STOCK_POSTED | PostScrapMovement | ACT-IPS | INV-001, INV-017 | Inventory posts Ledger | ScrapStockPosted |
| STOCK_POSTED | CLOSED | CloseScrap | ACT-OP / ACT-QC | none numeric | owning fact closed | ScrapClosed |

## SM-QUALITY-INSPECTION

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | PLANNED | PlanInspection | ACT-QC | `open: OQ-005` plan | Quality writes inspection | QualityInspectionPlanned |
| PLANNED | IN_PROGRESS | StartInspection | ACT-QC | none numeric | Quality writes inspection | QualityInspectionStarted |
| IN_PROGRESS | COMPLETED | CompleteInspection | ACT-QC | evidence recorded | Quality writes inspection | QualityInspectionCompleted |
| COMPLETED | ACCEPTED | AcceptInspection | ACT-QC | `open: OQ-005` | Quality writes disposition; commands Inventory release | QualityAccepted |
| COMPLETED | CONDITIONAL | ConditionallyRelease | ACT-QC | `open: OQ-005` named exception | Quality writes disposition; commands Inventory | QualityConditional |
| COMPLETED | QUARANTINED | QuarantineFromInspection | ACT-QC | INV-017 | commands Inventory quarantine | QualityQuarantined |
| COMPLETED | REJECTED | RejectInspection | ACT-QC | INV-010 | commands reject/scrap path; no shipment | QualityRejected |

## SM-PACKAGE

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | DRAFT | DraftPackage | ACT-SHIP | released contents or `open: OQ-004` | Shipping writes Package | PackageDrafted |
| DRAFT | PACKED | PackPackage | ACT-SHIP | INV-010, INV-011 | Shipping writes Package; may command Inventory pack-state | PackagePacked |
| PACKED | ASSIGNED_TO_SHIPMENT | AssignPackageToShipment | ACT-SHIP | Shipment draft exists | Shipping writes Package + Shipment | PackageAssigned |
| PACKED | UNPACKED | UnpackPackage | ACT-SHIP | not yet dispatched | Shipping writes Package; reverse pack-state if posted | PackageUnpacked |

## SM-SHIPMENT

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | DRAFT | DraftShipment | ACT-SHIP | authorized customer/order or INV-011 exceptional authority; named person `open: OQ-019`; not OQ-005 | Shipping writes Shipment | ShipmentDrafted |
| DRAFT | READY | MarkShipmentReady | ACT-SHIP | contents Released; `open: OQ-006` | Shipping writes Shipment | ShipmentReady |
| READY | LOADING | StartLoading | ACT-SHIP | none numeric | Shipping writes Shipment | ShipmentLoading |
| LOADING | DISPATCHED | DispatchShipment | ACT-SHIP | commands ACT-IPS stock exit (INV-017) | Shipping writes Shipment; Inventory posts exit | ShipmentDispatched |
| DISPATCHED | PARTIALLY_DELIVERED | RecordPartialDelivery | ACT-SHIP | `open: OQ-006` | Shipping writes Shipment | ShipmentPartiallyDelivered |
| DISPATCHED or PARTIALLY_DELIVERED | DELIVERED | ConfirmDelivery | ACT-SHIP | remaining qty `open: OQ-006` | Shipping writes Shipment; commands Finance-Lite facts | ShipmentDelivered |
| DELIVERED | CLOSED | CloseShipment | ACT-SHIP | none for stock | Shipping writes Shipment | ShipmentClosed |

## SM-INVOICE

| From | To | Command | Actor | Guard | Effect | Event |
| --- | --- | --- | --- | --- | --- | --- |
| (none) | DRAFT | DraftInvoice | ACT-FIN | delivery or commercial facts | Finance-Lite writes Invoice | InvoiceDrafted |
| DRAFT | ISSUED | IssueInvoice | ACT-FIN | INV-012, INV-014 | Finance-Lite writes Invoice; not legal GL | InvoiceIssued |
| ISSUED | PARTIALLY_PAID | AllocatePartialPayment | ACT-FIN | allocation ≤ open balance (INV-012) | Finance-Lite writes Invoice + Payment | InvoicePartiallyPaid |
| ISSUED or PARTIALLY_PAID | PAID | AllocateFullPayment | ACT-FIN | open balance zero | Finance-Lite writes Invoice | InvoicePaid |
| PAID | CLOSED | CloseInvoice | ACT-FIN | `open: OQ-007` if this closes the Sales Order | Finance-Lite writes Invoice | InvoiceClosed |
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

- Exact decimal precision and rounding (OQ-001, OQ-002)
- Official shop-floor posting step names (OQ-003)
- Batch vs piece identity on every output (OQ-004)
- Named QC releasers and numeric limits (OQ-005)
- Percent or weight tolerances (OQ-006)
- Closure = delivery and/or payment (OQ-007)
- Reservation expiry hours and preemption (OQ-008)
- Residual cutoff dimensions (OQ-009)
- Named workshop approvers and exceptional-shipment person (OQ-019)
- Inquiry and Quotation expiry day counts (`workshop-commercial-practice`)
