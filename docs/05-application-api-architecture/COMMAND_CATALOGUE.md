---
id: APP-CMD-001
title: Application Command Catalogue
phase: 05-application-api-architecture
status: in_review
version: 0.1.0
owners: [solution-architect, api-architect]
depends_on: [SM-TRANS-001, SM-EVT-001, APR-006]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# Application Command Catalogue

Proposed operations from
[TRANSITION_TABLES.md](../03-state-machines-invariants/TRANSITION_TABLES.md).
These are command names, write owners, and rejection families. They are
not HTTP paths, not OpenAPI, and not a framework choice (OQ-018).

Every command requires a caller-supplied idempotency key and a backend
`ACT-*` role (INV-015, INV-016). Quantity fields stay `open: OQ-001` /
`OQ-002`. Portal order commands are rejected in MVP (INV-020).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Shared contract

| Field | Rule |
| --- | --- |
| idempotency_key | required; same key returns the first result |
| actor_role | `ACT-*`; Temporary \* `(temporary)` → `GUARD_ACTOR` |
| open policy | unanswered OQ needed by the command → `GUARD_OPEN_POLICY` |

Transport (REST, RPC, queue) is not chosen.

## Sales (`BC-SALES`)

RecordInquiry, IssueQuotationFromInquiry, ConvertInquiryToOrder,
CancelInquiry, ExpireInquiry, PortalRequestInquiry (**reject**,
`GUARD_PORTAL_MVP`), DraftQuotation, IssueQuotation, AcceptQuotation,
RejectQuotation, SupersedeQuotation, ExpireQuotation,
DraftFulfillmentAssessment, RecordFulfillmentStock,
RecordFulfillmentPurchase, RecordFulfillmentMake,
RecordFulfillmentNotFeasible, RecordUnfulfilledDemand,
ReviewUnfulfilledDemand, CloseUnfulfilledDemand, ReopenAsInquiry,
DraftSalesOrder, SubmitSalesOrder, ConfirmSalesOrder,
StartOrderProduction, RecordPartialFulfillment, RecordFullFulfillment,
CloseSalesOrder (`open: OQ-007`), HoldSalesOrder,
ReleaseSalesOrderHold, RequestSalesOrderCancel,
ConfirmSalesOrderCancel.

Sales must not write Invoice, Ledger, or Balance.

## Procurement (`BC-PROCUREMENT`)

DraftPurchaseOrder, SubmitPurchaseOrder, ApprovePurchaseOrder
(`open: OQ-019`), SendPurchaseOrder, RecordPartialReceipt,
RecordFullReceipt, ClosePurchaseOrder, HoldPurchaseOrder,
CancelPurchaseOrder, DraftGoodsReceipt, ReceiveGoods.

Procurement must not post quantity (INV-018).

## Inventory / ACT-IPS

PostGoodsReceipt, ReverseGoodsReceipt, RequestReservation (commanded),
ActivateReservation, ConsumeReservation, ReleaseReservation,
ExpireReservation, CreateUnitFromPosting, ReleaseUnit, QuarantineUnit,
ReserveUnit, IssueUnit, IssueUnitFromAllocation, ConsumeUnitPartial,
ConsumeUnitComplete, PackUnit, ShipUnit, ScrapUnit, ReturnUnit,
CloseUnit, CreateResidualUnit, PlaceResidualUnit, PostScrapMovement.

Quantity consume/complete stays `open: OQ-001`, `OQ-002`, `OQ-003`.

## Production (`BC-PRODUCTION`)

PlanMaterialAllocation, AssignMaterialAllocation,
IssueAllocatedMaterial (ACT-IPS posts), ReleaseMaterialAllocation,
PlanProductionOperation, StartProductionOperation,
CompleteProductionOperation (INV-006 atomic), SkipProductionOperation,
StartReworkOperation, DraftProductionOrder, PlanProductionOrder,
ReleaseProductionOrder, StartProductionOrder, CompleteOperationPartial,
CompleteProductionOrder, CloseProductionOrder, PauseProductionOrder,
ResumeProductionOrder, HoldProductionOrder, CancelProductionOrder,
AbortProductionOrder, RecordResidualFact, ConvertResidualToScrap,
RecordScrapFact.

Production must not write Ledger.

## Quality, Shipping, Finance-Lite

Quality: PlanInspection, StartInspection, CompleteInspection,
AcceptInspection, ConditionallyRelease, QuarantineFromInspection,
RejectInspection, HoldInboundForQc. Commands Inventory; no stock write
(INV-017). Limits/people `open: OQ-005`.

Shipping: DraftPackage, PackPackage, AssignPackageToShipment,
UnpackPackage, DraftShipment, MarkShipmentReady, StartLoading,
DispatchShipment, RecordPartialDelivery, ConfirmDelivery,
CloseShipment. Exceptional shipment person `open: OQ-019`. Over-delivery
`open: OQ-006`.

Finance-Lite: DraftInvoice, IssueInvoice, AllocatePartialPayment,
AllocateFullPayment, CloseInvoice, MarkInvoiceOverdue,
RequestInvoiceVoid, VoidInvoice, RecordPayment, AllocatePayment,
LeavePaymentUnallocated, ClosePayment, ReversePayment. Not legal GL
(OQ-012).

## Events

Proposed event names remain the Event column in the transition tables.
They are emitted only after the owning write and any commanded Inventory
posting succeed. They are not a broker or Outbox decision (OQ-018).
