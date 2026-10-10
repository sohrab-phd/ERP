---
id: APP-QRY-001
title: Application Query Catalogue
phase: 05-application-api-architecture
status: approved
version: 0.2.0
owners: [solution-architect, api-architect]
depends_on: [APP-CMD-001, DATA-GEN-001, APR-006, APR-007]
last_reviewed: 2026-10-10
approval: APR-007
supersedes: null
---

# Application Query Catalogue

Read models. Queries do not write Ledger, Balance, or posted documents.
Customer isolation applies (INV-015). Portal visibility is a Sales-owned
read (OQ-010 recorded). Portal ordering remains rejected in MVP.

Implementation authority follows [current bounded scope](../00-governance/CURRENT_PHASE.md) and the canonical gate/unlock; the earlier locked snapshot is historical.

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
| TraceForward / TraceBackward | Genealogy projection | rebuild from DATA-GEN-001 source facts if stale (INV-019, FIND-G-014); not from Ledger/Balance |

## Must not exist as writes

- EditGenealogy
- AdjustBalance
- PortalPlaceOrder (MVP)

## Open

- Decimal display scale (OQ-001 residual; official stock UOM is kg)
- Pagination and volume (OQ-014)
- Query transport and cache package (OQ-018 residual)

## Delivered Genealogy trace contract

[APR-026](../00-governance/approved-baselines/APR-026-genealogy-trace-scope.md) and the [actual implementation](../12-implementation-planning/GENEALOGY_TRACE_IMPLEMENTATION_STATUS.md) bind TraceForward/TraceBackward. GET `/genealogy/forward|backward/<kind>/<UUID>` accepts lower-case kinds unit, lot, receipt, package, shipment, fact, operation, order, batch and sales_order. One exact x-customer-id UUID plus an individual Bearer session is required; current ACT-WH, ACT-SALES or ACT-SEC must have that exact customer grant. Organizational receipt authority alone and ACT-CUST do not grant commercial trace.

All owner reads share one bounded read-only REPEATABLE READ snapshot; authority is checked freshly before/after it, with the final check after release. Unknown/foreign roots yield no trace (HTTP404); unsupported/revoked access is denied. Fixed bounds: depth32, nodes256, edges1024, source rows256 per collection, source-port calls1024 and encoded result256KiB. Overflow raises GUARD_INVARIANT (HTTP422) without a partial graph. Technical errors return sanitized503. No request body, query options, browser Origin or caller role header. Results are no-store/nosniff.

Typed nodes, recorded intake metadata, fact-keyed material edges, exact kg meanings and nonpropagating association references describe committed sources only. Multi-parent output kg is the result total, not an invented contribution per parent. No source/stock/audit/outcome mutation or EditGenealogy. Trace is not a generic source dump or portal endpoint. General pagination/cache choices in the open list remain for other queries and later evidenced scale requirements.
