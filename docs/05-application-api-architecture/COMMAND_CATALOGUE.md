---
id: APP-CMD-001
title: Application Command Catalogue
phase: 05-application-api-architecture
status: approved
version: 0.2.0
owners: [solution-architect, api-architect]
depends_on: [SM-TRANS-001, SM-EVT-001, APR-006, APR-007]
last_reviewed: 2026-09-16
approval: APR-007
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

Transport (REST, RPC, queue) is not chosen. Logical request and result
fields are in [API_ENVELOPE.md](API_ENVELOPE.md).

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
CloseSalesOrder,
HoldSalesOrder,
ReleaseSalesOrderHold, RequestSalesOrderCancel,
ConfirmSalesOrderCancel.

Sales must not write Invoice, Ledger, or Balance.

### CloseSalesOrder (OQ-007 / FIND-G-003)

From-states only: `FULFILLED`, `PARTIALLY_FULFILLED`, `CANCELLED`.

| From | Required condition | Must exist | Must not |
| --- | --- | --- | --- |
| `FULFILLED` | Remaining valid demand is zero within OQ-006 (order already `FULFILLED`). Shipment `DELIVERED` is not a close prerequisite. | Closure reason + qty snapshot | Payment or invoice as a guard; close because shipment is `DELIVERED` |
| `PARTIALLY_FULFILLED` | Remaining demand is authorized TERM-005 Unfulfilled Demand, not still-valid open demand | `RecordUnfulfilledDemand` covering remainder | Silent discard of remainder; close because a shipment is `DELIVERED` |
| `CANCELLED` | `ConfirmSalesOrderCancel` already completed | Closure reason + qty snapshot | Payment as a guard |

Unresolved valid remaining demand → `GUARD_INVARIANT`. `CloseInvoice` /
`AllocatePayment` must not write the Sales Order. Delivery is a
fulfillment fact; it does not itself close the order.

### ActivateReservation uniqueness (OQ-008 / FIND-G-005)

`ActivateReservation` is `WI-BUNDLE-RESERVE` with unit reserved-state and
reserved qty. One Inventory Unit → at most one `ACTIVE` reservation.
Partial claimed qty does not permit a second `ACTIVE` row on the same
unit. Later SO must not steal an existing `ACTIVE`. If two confirmed SOs
compete for the same unit, the earlier `ConfirmSalesOrder` timestamp is
the OQ-008 commercial winner of `ACTIVE`. `REQUESTED` does not occupy
that slot. `ConfirmSalesOrder` does not itself create `REQUESTED`. Same
idempotency key returns the first result. Confirmed-SO reservations do
not timer-expire.

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
ReserveUnit, IssueUnit, IssueUnitFromAllocation, ConsumeUnitPartial
(nested IPS primitive), ConsumeUnitComplete (nested IPS primitive),
PackUnit, ShipUnit, ScrapUnit (unit destiny; not a scrap-qty post),
ReturnUnit, CloseUnit, CreateResidualUnit (nested residual identity),
PlaceResidualUnit (placement/QC; no second residual qty),
PostScrapMovement (authoritative scrap **quantity** Ledger post).

Quantity consume/complete stays `open: OQ-001`, `OQ-002`. Production
consume is not an independent posting point (OQ-003 / INV-006).

## Production (`BC-PRODUCTION`)

PlanMaterialAllocation, AssignMaterialAllocation,
IssueAllocatedMaterial (ACT-IPS posts), ReleaseMaterialAllocation,
PlanProductionOperation, StartProductionOperation,
CompleteProductionOperation (INV-006 exclusive atomic posting
boundary), SkipProductionOperation,
StartReworkOperation, DraftProductionOrder, PlanProductionOrder,
ReleaseProductionOrder, StartProductionOrder, CompleteOperationPartial
(order state only; no Ledger),
CompleteProductionOrder, CloseProductionOrder, PauseProductionOrder,
ResumeProductionOrder, HoldProductionOrder, CancelProductionOrder,
AbortProductionOrder, RecordResidualFact (nested leftover fact),
ConvertResidualToScrap (nested classification),
RecordScrapFact (nested leftover **or** later Quality/abort scrap).

Production must not write Ledger.

## Production posting composition (FIND-G-001 / FIND-G-002 / FIND-G-015)

Canonical contract:
[TRANSACTION_AND_IDEMPOTENCY.md](../04-database-architecture/TRANSACTION_AND_IDEMPOTENCY.md).

| Command | Status | Purpose | May post Ledger? | Independently callable? | Relation to `CompleteProductionOperation` |
| --- | --- | --- | --- | --- | --- |
| `CompleteProductionOperation` | Business command | Exclusive production posting boundary | Via nested `ACT-IPS` only | Yes (the operator command) | — |
| `CreateResidualUnit` | Nested IPS command | Residual **identity**, parent close/split, residual on-hand once (OQ-009, INV-008) | Yes, once, for the child unit | No for leftover of this operation | Nested inside the bundle when leftover is reusable |
| `RecordResidualFact` | Nested Production fact | Residual domain fact, not stock tables | No | No for that leftover | Nested |
| `PostScrapMovement` | Authoritative scrap qty command (OQ-009) | Scrap **quantity** Ledger | Yes, once per scrap fact | Not for leftover already in the bundle. Yes for a **new** Quality/abort scrap with a new key | Nested for production leftover |
| `ScrapUnit` | Unit state transition | Destiny `SCRAPPED`; paired scrap fact required | No second qty; Ledger qty is `PostScrapMovement` | Only with paired scrap fact; never a second qty | Nested when parent destiny is `SCRAPPED` |
| `RecordScrapFact` | Domain fact | Scrap fact, not stock tables | No | Same split as `PostScrapMovement` | Nested for production leftover |
| `ConsumeUnitPartial` | Nested IPS primitive | Parent unit partial consume state | Yes, as the consume side of this bundle | **No** (INV-006) | Nested only |
| `ConsumeUnitComplete` | Nested IPS primitive | Parent unit fully consumed | Yes, as the consume side of this bundle | **No** (INV-006) | Nested only |
| `ConvertResidualToScrap` | Nested classification | Leftover fails reuse policy → scrap path | No; scrap qty is `PostScrapMovement` | No for that leftover | Nested branch |
| `PlaceResidualUnit` | Follow-on placement | Child unit location / QC hold | No residual qty | Yes, after the child exists | After the bundle; not a posting |
| `CompleteOperationPartial` | Order lifecycle | Production Order `PARTIALLY_COMPLETED` | No | Yes, after at least one operation completed via the bundle | Must not post stock |

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
