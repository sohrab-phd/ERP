---
id: APP-CMD-001
title: Application Command Catalogue
phase: 05-application-api-architecture
status: approved
version: 0.5.0
owners: [solution-architect, api-architect]
depends_on: [SM-TRANS-001, SM-EVT-001, APR-006, APR-007]
last_reviewed: 2026-10-10
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

Implementation authority follows [current bounded scope](../00-governance/CURRENT_PHASE.md) and the canonical gate/unlock; the earlier locked snapshot is historical.

Quality commands listed below are future/deferred architecture under
OQ-005. They are not current-MVP commands or dependencies. No current
Goods Receipt, production completion, availability, or shipment command
requires a Quality approver or inspection.
For current-MVP normal stock-in, `CreateUnitFromPosting` sets the
resulting Inventory Unit to `AVAILABLE` within the valid `ACT-IPS`
posting transaction (INV-003); no separate `ReleaseUnit` call is needed.
This is architecture reconciliation, not a factory-named procedure.

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

The factory has not confirmed who may request or confirm a Sales Order
cancel, or who may change quantity or material after registration. These
commands stay architecture candidates. They are not deleted. They do not
write the Ledger. Production stop/cancel by Mr. Dinavand is not one of
these commands. No reopen-of-a-cancelled-order command is added.

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

Factory intake (`2026-09-30`) does not add a command. `PostGoodsReceipt`
remains the only receiving quantity post. `ApprovePurchaseOrder` stays
open on OQ-019. It is not a factory-confirmed approval chain. No
`UpdateInventory` command is added. Current intake does not call a
Quality command.

The purchase commands above, including draft, submit, approve, send,
partial receipt, full receipt, hold, and cancel, are architecture
candidates. The factory has not confirmed a Purchase Order lifecycle,
supplier approval, or a procurement payment. They are not deleted.
Ms. Masoumi's purchase registration and proforma sending are not these
commands.

[APR-027](../00-governance/approved-baselines/APR-027-purchasing-evidence-scope.md)
authorizes two documentary v1 commands, separate from the candidate PO machine:
RecordCompletedPurchase (target purchase-record) and RecordPurchaseProformaSent
(target purchase-proforma). The former records document/supplier references,
purchase date and material description; the optional latter records purchase UUID,
proforma reference and sent date. Individual current organization-scoped ACT-PROC
only; immutable evidence plus outcome/audit, no stock/payment/transmission effect.
Same-key replay and UUID binding apply. [Actual contracts and limits](../12-implementation-planning/SLICE_PURCHASE_IMPLEMENTATION_STATUS.md)
describe this increment; no candidate ApprovePurchaseOrder/SendPurchaseOrder is activated.

## Inventory / ACT-IPS

PostGoodsReceipt, ReverseGoodsReceipt, RequestReservation (commanded),
ActivateReservation, ConsumeReservation, ReleaseReservation,
ExpireReservation, CreateUnitFromPosting, ReleaseUnit, QuarantineUnit,
ReserveUnit, IssueUnit, IssueUnitFromAllocation, ConsumeUnitPartial
(nested IPS primitive), ConsumeUnitComplete (nested IPS primitive),
PackUnit, ShipUnit, ScrapUnit (unit destiny; not a scrap-qty post),
ReturnUnit, CloseUnit, CreateResidualUnit (nested residual identity),
PlaceResidualUnit (follow-on placement where applicable; future QC only; no second residual qty),
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

Factory order flow (`2026-09-30`) does not add a command. Entry, Referral,
login, logout, and an operator's completion declaration are not
`StartProductionOperation` or `CompleteProductionOperation`. A Station
completion does not post quantity.

The factory has not named those nested consume primitives and has not
defined when consumption occurs. No user-facing consume workflow is added.

## Production posting composition (FIND-G-001 / FIND-G-002 / FIND-G-015)

Canonical contract:
[TRANSACTION_AND_IDEMPOTENCY.md](../04-database-architecture/TRANSACTION_AND_IDEMPOTENCY.md).

| Command | Status | Purpose | May post Ledger? | Independently callable? | Relation to `CompleteProductionOperation` |
| --- | --- | --- | --- | --- | --- |
| `CompleteProductionOperation` | Business command | Exclusive production posting boundary | Via nested `ACT-IPS` only | Yes, as the architecture posting command. Not the operator's station-completion declaration. | — |
| `CreateResidualUnit` | Nested IPS command | Residual **identity**, parent close/split, residual on-hand once (OQ-009, INV-008); valid normal child Unit `AVAILABLE` on commit (INV-003) | Yes, once, for the child unit | No for leftover of this operation | Nested inside the bundle when leftover is reusable |
| `RecordResidualFact` | Nested Production fact | Residual domain fact, not stock tables | No | No for that leftover | Nested |
| `PostScrapMovement` | Logical Scrap quantity accounting (ADR-0020) | Actual consumed input stock-out already includes classified Scrap once; immutable Scrap fact explains net quantity | Via that one consume post; never a second subtraction | No separate MVP leftover command. Later NEW Scrap/abort contract is deferred | Nested accounting inside completion |
| `ScrapUnit` | Unit state transition | Destiny `SCRAPPED`; paired scrap fact required | No second qty; classified Scrap is included once in the full input stock-out (ADR-0020) | Only with paired scrap fact; never a second qty | Nested when parent destiny is `SCRAPPED` |
| `RecordScrapFact` | Domain fact | Scrap fact, not stock tables | No | Same split as `PostScrapMovement` | Nested for production leftover |
| `ConsumeUnitPartial` | Nested IPS primitive | Parent unit partial consume state | Yes, as the consume side of this bundle | **No** (INV-006) | Nested only |
| `ConsumeUnitComplete` | Nested IPS primitive | Parent unit fully consumed | Yes, as the consume side of this bundle | **No** (INV-006) | Nested only |
| `ConvertResidualToScrap` | Nested classification | Leftover fails reuse policy → scrap path | No; no extra quantity subtraction after full input stock-out (ADR-0020) | No for that leftover | Nested branch |
| `PlaceResidualUnit` | Follow-on placement where applicable; future QC branch | Child unit location; future-only QC hold | No residual qty | Yes, after the child exists; not needed for current-MVP availability | After the bundle; not a posting |
| `CompleteOperationPartial` | Order lifecycle | Production Order `PARTIALLY_COMPLETED` | No | Yes, after at least one operation completed via the bundle | Must not post stock |

## Quality, Shipping, Finance-Lite

Quality (**future only, outside current MVP**): PlanInspection, StartInspection, CompleteInspection,
AcceptInspection, ConditionallyRelease, QuarantineFromInspection,
RejectInspection, HoldInboundForQc. Commands Inventory; no stock write
(INV-017). Limits/people `open: OQ-005`.

Shipping: DraftPackage, PackPackage, AssignPackageToShipment,
UnpackPackage, DraftShipment, MarkShipmentReady, StartLoading,
DispatchShipment, RecordPartialDelivery, ConfirmDelivery,
CloseShipment. Exceptional shipment person `open: OQ-019`. Over-delivery
`open: OQ-006`.

Owner confirmation APR-024 (2026-10-09) enables normal confirmed-order
preparation/packing/loading/dispatch by individual ACT-SHIP, without second
approval or payment/invoice prerequisite. Complete already-reserved Units only;
no split, ownership override or exceptional shipment. Minimum durable evidence
is Shipment/order/Unit identity, stock kg, actor/time and posting outcome with
idempotency/audit. Delivery confirmation, carrier workflows and exceptions remain
deferred; none of these commands closes a Sales Order.
Dispatch does not write the Ledger; stock exit stays with the Inventory
Posting Service.

Finance-Lite: DraftInvoice, IssueInvoice, AllocatePartialPayment,
AllocateFullPayment, CloseInvoice, MarkInvoiceOverdue,
RequestInvoiceVoid, VoidInvoice, RecordPayment, AllocatePayment,
LeavePaymentUnallocated, ClosePayment, ReversePayment. Not legal GL
(OQ-012).

Owner APR-028 separately authorizes `RecordIssuedInvoiceEvidence` v1, target
`invoice-evidence`: documentary reference/date and existing Sales order/matching
customer only, current individual organizational ACT-SALES. Finance-Lite owns
immutable evidence; the shared envelope persists outcome/audit atomically. No
invoice generation, money, lifecycle change,
allocation or external upload. See [bounded plan](../12-implementation-planning/FINANCE_LITE_PLAN.md).

These Finance-Lite commands remain architecture. The factory has named
three customer payment methods and has not named who records a payment,
whether payment must link to an invoice, a cheque or promissory-note
settlement, a credit limit, or a reversal procedure. The commands are
not deleted and are not treated as that missing procedure. They do not
close a Sales Order and they do not write the Inventory Ledger.

## Events

Proposed event names remain the Event column in the transition tables.
They are emitted only after the owning write and any commanded Inventory
posting succeed. They are not a broker or Outbox decision (OQ-018).
