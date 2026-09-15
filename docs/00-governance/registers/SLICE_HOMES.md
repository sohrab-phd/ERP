---
id: GOV-SLICE-HOMES-001
title: Slice Homes for Approved Commands Adapters and Scenes
phase: 00-governance
status: in_review
version: 0.1.0
owners: [chief-solution-architect]
depends_on: [PLAN-SLICE-001, PLAN-WI-001, APP-CMD-001, APP-QRY-001, INT-CAT-001, QA-SCN-001, APR-014, CHK-0013, ASM-025]
last_reviewed: 2026-09-07
approval: null
supersedes: null
---

# Slice Homes for Approved Commands, Adapters, and Scenes

Canonical homes for already-approved IDs after CHK-0013. This register
does **not** reopen APR-014, add a Phase 13, mint `TEST-*` IDs, or
authorize implementation.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

Phase 12 named slices, `WI-*` kinds, and the six `WI-BUNDLE-*` items.
It did not list every catalogue command. Later `TASK-IMPL` still needs
a home. This file supplies that map by citing APP-CMD-001, APP-QRY-001,
INT-CAT-001, APP-BG-001, and QA-SCN-001.

No new `SLICE-*` is created. Inquiry, quotation, and fulfillment
assessment sit on `SLICE-STOCK` as the Sales commercial prefix. They
are not extra SEQ-STOCK steps and they must not write Ledger.

## Standing rules

1. Stock posts only through `ACT-IPS` on `SLICE-IPS` or as the executor
   of a named bundle on a later slice.
2. A DATA-TX-001 bundle stays on the home in the bundle table. It must
   not split across slices, hosts, or later `TASK-IMPL` items.
3. Unanswered `OQ-*` stay `GUARD_OPEN_POLICY`. This map does not invent
   the missing number, name, protocol, or product.
4. `EditGenealogy`, `AdjustBalance`, and MVP `PortalPlaceOrder` have
   **no** home that may pass.
5. Adapters and workers command. They do not post.
6. Isolation (`CONF-ISO` / SV-005 / SV-012) is a keep-rule on every
   outbound path, not a first posting kernel.
7. Architecture-affecting later diffs reopen the owning `APR-*`.

## Bundle homes (unchanged from APR-014)

| Bundle | `WI-BUNDLE-*` | Slice |
| --- | --- | --- |
| ActivateReservation + reserved state + reserved qty | `WI-BUNDLE-RESERVE` | `SLICE-STOCK` |
| DispatchShipment + stock exit | `WI-BUNDLE-DISPATCH` | `SLICE-STOCK` |
| AllocatePayment + invoice open-balance reduction | `WI-BUNDLE-PAY` | `SLICE-STOCK` |
| PostGoodsReceipt + Lot/Unit/Ledger | `WI-BUNDLE-GR` | `SLICE-PURCHASE` |
| CompleteProductionOperation + consume/output/residual/scrap | `WI-BUNDLE-COMPLETE-OP` | `SLICE-MAKE` |
| CreateResidualUnit + parent close/split | `WI-BUNDLE-RESIDUAL` | `SLICE-MAKE` |

`AllocatePartialPayment` and `AllocateFullPayment` are the same pay
bundle family. They must not become a second posting path.

## Command homes

`WI-CMD` unless a bundle row applies. Commander `ACT-*` stays on the
owning bounded context; stock executor remains `ACT-IPS`.

### `SLICE-ENVELOPE`

Envelope, idempotency, rejection families, and `AUD-CMD-*` for every
command. No Ledger write. Open: OQ-018.

### `SLICE-IPS`

Inventory posting kernel commanded by others: PostGoodsReceipt (as
executor of `WI-BUNDLE-GR`), ReverseGoodsReceipt (executor of reverse),
RequestReservation (commanded), ActivateReservation (executor of
`WI-BUNDLE-RESERVE`), ConsumeReservation, ReleaseReservation,
ExpireReservation, CreateUnitFromPosting, ReleaseUnit, QuarantineUnit,
ReserveUnit, IssueUnit, IssueUnitFromAllocation, ConsumeUnitPartial,
ConsumeUnitComplete, PackUnit, ShipUnit, ScrapUnit, ReturnUnit,
CloseUnit, CreateResidualUnit (executor of `WI-BUNDLE-RESIDUAL`),
PlaceResidualUnit, PostScrapMovement.

Open: OQ-017, OQ-001, OQ-002. Must not: second writer; Balance-only API.

### `SLICE-STOCK` — Sales commercial prefix (not SEQ-STOCK steps)

RecordInquiry, IssueQuotationFromInquiry, ConvertInquiryToOrder,
CancelInquiry, ExpireInquiry, DraftQuotation, IssueQuotation,
AcceptQuotation, RejectQuotation, SupersedeQuotation, ExpireQuotation,
DraftFulfillmentAssessment, RecordFulfillmentStock,
RecordFulfillmentPurchase, RecordFulfillmentMake,
RecordFulfillmentNotFeasible, RecordUnfulfilledDemand,
ReviewUnfulfilledDemand, CloseUnfulfilledDemand, ReopenAsInquiry,
DraftSalesOrder, SubmitSalesOrder, ConfirmSalesOrder,
StartOrderProduction, RecordPartialFulfillment, RecordFullFulfillment,
HoldSalesOrder, ReleaseSalesOrderHold, RequestSalesOrderCancel,
ConfirmSalesOrderCancel.

`CloseSalesOrder` stays `GUARD_OPEN_POLICY` until OQ-007. Sales must
not write Invoice, Ledger, or Balance.

`PortalRequestInquiry` and `PortalPlaceOrder` reject
(`GUARD_PORTAL_MVP`). No home that may pass in MVP.

`SLICE-NOT-FEASIBLE` remains `RecordUnfulfilledDemand` on this slice
(INV-013). It is not a separate posting kernel.

### `SLICE-STOCK` — SEQ-STOCK (reservation through payment)

`ActivateReservation` as `WI-BUNDLE-RESERVE`. Shipping pack/load:
DraftPackage, PackPackage, AssignPackageToShipment, UnpackPackage,
DraftShipment, MarkShipmentReady, StartLoading. `DispatchShipment` as
`WI-BUNDLE-DISPATCH`. RecordPartialDelivery, ConfirmDelivery,
CloseShipment. Finance-Lite: DraftInvoice, IssueInvoice,
AllocatePartialPayment, AllocateFullPayment, AllocatePayment
(`WI-BUNDLE-PAY`), CloseInvoice, MarkInvoiceOverdue, RecordPayment,
LeavePaymentUnallocated, ClosePayment.

Open: OQ-007, OQ-006, OQ-008. Exceptional shipment-without-demand
person: OQ-019. Over-delivery: OQ-006.

### `SLICE-PURCHASE`

DraftPurchaseOrder, SubmitPurchaseOrder, ApprovePurchaseOrder
(`GUARD_OPEN_POLICY` until OQ-019), SendPurchaseOrder,
RecordPartialReceipt, RecordFullReceipt, ClosePurchaseOrder,
HoldPurchaseOrder, CancelPurchaseOrder, DraftGoodsReceipt,
ReceiveGoods. `PostGoodsReceipt` as `WI-BUNDLE-GR`. Inbound QC
commanders: PlanInspection, StartInspection, CompleteInspection,
AcceptInspection, ConditionallyRelease, QuarantineFromInspection,
RejectInspection, HoldInboundForQc (Quality commands; IPS posts).

Procurement must not post quantity (INV-018). Open: OQ-011, OQ-005,
OQ-019.

### `SLICE-MAKE`

PlanMaterialAllocation, AssignMaterialAllocation, IssueAllocatedMaterial
(IPS posts), ReleaseMaterialAllocation, PlanProductionOperation,
StartProductionOperation, `CompleteProductionOperation` as
`WI-BUNDLE-COMPLETE-OP`, SkipProductionOperation, StartReworkOperation,
DraftProductionOrder, PlanProductionOrder, ReleaseProductionOrder,
StartProductionOrder, CompleteOperationPartial, CompleteProductionOrder,
CloseProductionOrder, PauseProductionOrder, ResumeProductionOrder,
HoldProductionOrder, CancelProductionOrder, AbortProductionOrder
(routing still OQ-003), RecordResidualFact, ConvertResidualToScrap,
RecordScrapFact, `CreateResidualUnit` as `WI-BUNDLE-RESIDUAL`.
In-process QC commanders use the same Quality commands as purchase;
they still do not write stock.

Open: OQ-003, OQ-009, OQ-006. Production must not write Ledger.

### `SLICE-REVERSE`

Compensating **new** commands with **new** keys: ReverseGoodsReceipt
(SV-013 second distinct human), ReversePayment, ReturnUnit,
RequestInvoiceVoid, VoidInvoice (SV-007). Original posted rows stay.
Open: OQ-015 authority, OQ-017 mechanism, OQ-019 names. Must not:
device replay; `REV-AGENT` waiving SoD.

### `SLICE-RESTORE`

`BalanceRebuild` and `GenealogyRebuild` only. Must not:
`AdjustBalance`, `EditGenealogy`. Open: OQ-016.

### `SLICE-CUTOVER`

`OpeningStockImport` commanded by `ADP-CUTOVER`. Until OQ-015 and
OQ-019 are answered, reject as `GUARD_OPEN_POLICY`. Must not: post
Balance-only; `AdjustBalance`.

## Forbidden — no passing home

| Name | Rejection |
| --- | --- |
| EditGenealogy | SV-008 / INV-019 |
| AdjustBalance | SV-008 |
| PortalPlaceOrder | `GUARD_PORTAL_MVP` / INV-020 |
| PortalRequestInquiry as an order write | `GUARD_PORTAL_MVP` |
| Quality or Shipping writing Ledger | INV-017 |
| Adapter or worker writing Ledger | TB-STOCK |
| `ADP-PLC` / `ADP-CMMS` / `ADP-APS` in MVP | later catalogue |

## Query homes (`WI-QRY`)

Queries do not write. Isolation is required. They are not a posting
kernel. Transport and cache package stay OQ-018.

| Query | Source owner | Slice to read with |
| --- | --- | --- |
| GetCustomer / ListCustomers | Sales | `SLICE-STOCK` |
| GetInquiry / GetQuotation / GetSalesOrder | Sales | `SLICE-STOCK` |
| GetFulfillmentAssessment / GetUnfulfilledDemand | Sales | `SLICE-STOCK` |
| GetAvailability / GetReservation | Inventory | `SLICE-IPS` / `SLICE-STOCK` |
| GetPurchaseOrder / GetGoodsReceipt | Procurement | `SLICE-PURCHASE` |
| GetInventoryUnit / GetLot / GetLedger / GetBalance | Inventory | `SLICE-IPS` |
| GetProductionOrder / GetOperation / GetAllocation | Production | `SLICE-MAKE` |
| GetInspection | Quality | `SLICE-PURCHASE` or `SLICE-MAKE` |
| GetPackage / GetShipment | Shipping | `SLICE-STOCK` |
| GetInvoice / GetPayment | Finance-Lite | `SLICE-STOCK` |
| TraceForward / TraceBackward | Genealogy projection | `SLICE-RESTORE` if stale; else owning walk |

## Adapter homes (`WI-ADP`)

| Adapter | Slice | May | Must not |
| --- | --- | --- | --- |
| `ADP-WEIGHBRIDGE` | `SLICE-PURCHASE` | Command `PostGoodsReceipt` | Write Ledger; split GR; invent OQ-011 key |
| `ADP-PRINT` | `SLICE-ENVELOPE` | Print an already posted identity | Print unposted identity; invent barcode product |
| `ADP-GL-EXPORT` | `SLICE-STOCK` | Export Invoice/Payment facts | Become legal GL (OQ-012) |
| `ADP-PORTAL` | `SLICE-STOCK` reads | Isolated status/document read (OQ-010 visibility-only) | `PortalPlaceOrder`; customer-created demand |
| `ADP-REPORT` | `SLICE-ENVELOPE` | Isolated read/export | Dump all customers |
| `ADP-LIVE` | `SLICE-ENVELOPE` | Isolated `EventNotice` / `LiveNotice` | Write stock; leak another customer |
| `ADP-CUTOVER` | `SLICE-CUTOVER` | Command opening Ledger facts | Pass while OQ-015/OQ-019 open; Balance-only |
| `ADP-PLC` / `ADP-CMMS` / `ADP-APS` | none in MVP | — | Silent stock write; ConfirmSalesOrder |

## Worker homes (`WI-WORKER` / `WI-REBUILD`)

| Kind | Home | Must not |
| --- | --- | --- |
| `CommandRetry` | Same slice as the original command | New key; worker as commander (SV-009) |
| `EventNotice` / `LiveNotice` | `SLICE-ENVELOPE` via `ADP-LIVE` | Stock write; isolation leak |
| `GenealogyRebuild` / `BalanceRebuild` | `SLICE-RESTORE` | `EditGenealogy` / `AdjustBalance` |
| `ReservationExpirySweep` | `SLICE-STOCK` / `SLICE-IPS` | Invent a TTL on confirmed Sales Order reservations (OQ-008) |
| `InquiryQuotationExpirySweep` | `SLICE-STOCK` | Invent a day count (FIND-026) |
| `OpeningStockImport` | `SLICE-CUTOVER` | Bypass OQ-015 |

## Scene homes (intents, not `TEST-*`)

| Scene | Slice / keep-rule |
| --- | --- |
| `QA-SCN-STOCK` | `SLICE-STOCK` |
| `QA-SCN-PURCHASE` | `SLICE-PURCHASE` |
| `QA-SCN-MAKE` | `SLICE-MAKE` |
| `QA-SCN-NOT-FEASIBLE` | `SLICE-STOCK` (`RecordUnfulfilledDemand`) |
| `QA-SCN-REVERSE` | `SLICE-REVERSE` |
| `QA-SCN-BUNDLE` | Every named `WI-BUNDLE-*` |
| `QA-SCN-REJECT-OPEN` | Every slice |
| `QA-SCN-REJECT-ACTOR` | Every slice |
| `QA-SCN-REJECT-PORTAL` | No passing home |
| `QA-SCN-CONFLICT` | `SLICE-IPS` and every posting slice |
| `QA-SCN-IDEMPOTENT` | `SLICE-ENVELOPE` plus every bundle |
| `QA-SCN-SOD` / `QA-SCN-SOD-GR` | `SLICE-REVERSE` |
| `QA-SCN-ISOLATION` / `QA-SCN-EVENT-ISO` | Every outbound path |
| `QA-SCN-QC-HOLD` | `SLICE-PURCHASE` / `SLICE-MAKE` blocking ship |
| `QA-SCN-SHIP-NO-DEMAND` | `SLICE-STOCK`; person OQ-019 |
| `QA-SCN-UNFULFILLED` | `SLICE-STOCK` |
| `QA-SCN-PAUSE-RESUME` | `SLICE-MAKE` |
| `QA-SCN-REJECT-GENEALOGY` / `QA-SCN-REJECT-ADJUST` | No passing home |
| `QA-SCN-UI-LEDGER` | `SLICE-IPS` keep-rule |
| `QA-SCN-QC-COMMAND` | Quality/Shipping command; IPS posts |
| `QA-SCN-WORKER` | `WI-WORKER` on the original slice |
| `QA-SCN-AUDIT` | `SLICE-ENVELOPE` |

## Open questions that guard slices

| OQ | Guards |
| --- | --- |
| OQ-001 residual | Decimal scale/rounding/factors on quantity posts |
| OQ-002 | Answered: Coil qty is measured kg |
| OQ-003 residual | Named routing steps; abort role on `SLICE-MAKE` |
| OQ-004 | Answered: hybrid grain; catalogue is configuration |
| OQ-005 residual | Quality Plans/limits/names on `SLICE-PURCHASE` / `SLICE-MAKE` |
| OQ-006 | Answered: default tolerance 0; family % is configuration |
| OQ-007 | Answered: close SO on fulfillment, not payment |
| OQ-008 | Answered: one Coil one reservation; no confirmed-SO timer |
| OQ-009 residual | Residual cutoff numbers on `SLICE-MAKE` |
| OQ-010 | Answered: visibility-only portal; no order-write slice |
| OQ-011 residual | `ADP-WEIGHBRIDGE` auto-path / `SPIKE-DEVICE` |
| OQ-012 | Answered: no Legal-GL in MVP |
| OQ-013 | Answered: one entity, one principal site |
| OQ-014 residual | Volume/pagination evidence |
| OQ-015 residual | `SLICE-CUTOVER` until files and named signers exist |
| OQ-016 | Answered: RPO 60 / RTO 8; retention days still open |
| OQ-017 | Answered: app-owned PostgreSQL transaction |
| OQ-018 | Answered: Modular Monolith + PostgreSQL; packages later |
| OQ-019 residual | Named people on SoD, PO approve, cutover, ship-without-demand |

## Must not decide here

- Creating `.cursor/IMPLEMENTATION_UNLOCK.json`
- A `TEST-*` catalogue or named roster
- A new slice, package, or hosting product
- Inventing residual answers that this map still marks `GUARD_OPEN_POLICY`
