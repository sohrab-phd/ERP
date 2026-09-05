---
id: SM-SIDE-001
title: Cross-State Side-Effect Matrix
phase: 03-state-machines-invariants
status: approved
version: 0.3.0
owners: [chief-solution-architect, domain-leads]
depends_on: [SM-CATALOGUE-001, DOM-OWN-001, APR-004, APR-005]
last_reviewed: 2026-09-06
approval: APR-005
supersedes: null
---

# Cross-State Side-Effect Matrix

Which write owner is commanded when a source machine moves. This is a command
map, not a table-write map. Quality and Shipping never write stock tables
(INV-017). Numeric effects stay open where an OQ owns them.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

| Source transition | Commands | Must not write | Open guard |
| --- | --- | --- | --- |
| SM-FULFILLMENT-ASSESSMENT recorded STOCK | Reservation request to Inventory | Ledger, Balance | OQ-008 |
| SM-FULFILLMENT-ASSESSMENT recorded PURCHASE | purchase-need to Procurement | Ledger, Balance | none |
| SM-FULFILLMENT-ASSESSMENT recorded MAKE | production-need to Production | Ledger, Balance | OQ-003 |
| SM-FULFILLMENT-ASSESSMENT recorded NOT_FEASIBLE | start SM-UNFULFILLED-DEMAND | Sales Order (not required) | none |
| SM-SALES-ORDER confirmed | Reservation / PO / Production only as already assessed | Ledger, Balance | OQ-008 |
| SM-SALES-ORDER fulfilled on STOCK or PURCHASE | none for Production | Production Order | OQ-006 |
| SM-MATERIAL-ALLOCATION issued | Inventory issue posting | Production writing Ledger | OQ-003 |
| SM-INVENTORY-UNIT issued from allocation | Inventory issue from AVAILABLE, not from Reservation | Reservation required | OQ-003 |
| SM-PRODUCTION-OPERATION completed | Inventory consume/output/residual/scrap; optional QC request | Ledger by Production table write | OQ-003, OQ-006, OQ-009 |
| SM-SALES-ORDER closed | none for stock | Invoice rows | OQ-007 |
| SM-UNFULFILLED-DEMAND recorded | Reporting projection | Sales Order (not required) | none |
| SM-PURCHASE-ORDER sent / received | GoodsReceipt orchestration may start | Ledger, Balance | none |
| SM-GOODS-RECEIPT received | Inbound QC request to Quality | Ledger, Balance | OQ-005 |
| SM-GOODS-RECEIPT posted | Inventory Posting Service creates Lot / Unit | PurchaseOrder commercial fields | OQ-015, OQ-017 |
| SM-RESERVATION active | Availability projection | Sales Order rows | OQ-008 |
| SM-QUALITY-INSPECTION hold / quarantine / reject / Released | Inventory hold/release/reject command | Ledger, Balance, Unit quantity | OQ-005 |
| SM-PRODUCTION-ORDER released | Allocation in Production; issue command to Inventory | Ledger, Balance | OQ-003 |
| SM-PRODUCTION-ORDER resumed | none for stock | silent skip of pause | none |
| SM-PRODUCTION-ORDER operation complete | Inventory consume/output/residual/scrap postings; QC request | Ledger by Production table write | OQ-003, OQ-006, OQ-009 |
| SM-RESIDUAL fact recorded | Inventory creates child unit and closes/splits parent | Production writing Unit identity | OQ-009 |
| SM-SCRAP fact recorded | Inventory posts stock movement if inventory changes | Quality writing stock | OQ-009 |
| SM-PACKAGE packed | Optional Inventory pack-state command | Inventory writing Package | OQ-004 |
| SM-SHIPMENT dispatched | Inventory definitive stock exit | Ledger/Balance by Shipping | OQ-006 |
| SM-SHIPMENT delivered | Finance-Lite receivable facts | Sales writing Invoice | OQ-007, OQ-012 |
| SM-INVOICE issued | none for stock | External legal GL | OQ-012 |
| SM-PAYMENT allocated | Invoice open-balance reduction | Payment exceeding invoice or payment value | OQ-012 |

Genealogy Link is never written as source truth. Rebuild from Consumption,
Output, Residual, Scrap, Package, and Shipment facts (INV-019).
