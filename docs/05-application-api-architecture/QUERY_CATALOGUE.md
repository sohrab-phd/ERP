---
id: APP-QRY-001
title: Application Query Catalogue
phase: 05-application-api-architecture
status: approved
version: 0.2.0
owners: [solution-architect, api-architect]
depends_on: [APP-CMD-001, DATA-GEN-001, APR-006, APR-007]
last_reviewed: 2026-09-06
approval: APR-007
supersedes: null
---

# Application Query Catalogue

Read models. Queries do not write Ledger, Balance, or posted documents.
Customer isolation applies (INV-015). Portal visibility, if later
allowed, is still a Sales-owned read (OQ-010).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Queries that may be named now

| Query | Owner of the source | Notes |
| --- | --- | --- |
| GetCustomer / ListCustomers | Sales | isolation key required |
| GetInquiry / GetQuotation / GetSalesOrder | Sales | snapshot as posted |
| GetFulfillmentAssessment | Sales | |
| GetUnfulfilledDemand | Sales | not overdue |
| GetAvailability | Inventory (Balance + holds + reservations) | derived; INV-003 |
| GetReservation | Inventory | |
| GetPurchaseOrder / GetGoodsReceipt | Procurement | qty truth is Ledger after post |
| GetInventoryUnit / GetLot / GetLedger / GetBalance | Inventory | Balance must reconcile to Ledger |
| GetProductionOrder / GetOperation / GetAllocation | Production | |
| GetInspection | Quality | |
| GetPackage / GetShipment | Shipping | |
| GetInvoice / GetPayment | Finance-Lite | not legal GL |
| TraceForward / TraceBackward | Genealogy projection | rebuild if stale (INV-019) |

## Must not exist as writes

- EditGenealogy
- AdjustBalance
- PortalPlaceOrder (MVP)

## Open

- Decimal display scale (OQ-001, OQ-002)
- Pagination and volume (OQ-014)
- Site-scoped lists (OQ-013)
- Query transport and cache package (OQ-018)
