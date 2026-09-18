---
id: SM-SIDE-001
title: Cross-State Side-Effect Matrix
phase: 03-state-machines-invariants
status: approved
version: 0.3.0
owners: [chief-solution-architect, domain-leads]
depends_on: [SM-CATALOGUE-001, DOM-OWN-001, APR-004, APR-005]
last_reviewed: 2026-09-16
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
| SM-FULFILLMENT-ASSESSMENT recorded STOCK | Reservation request to Inventory | Ledger, Balance | one `ACTIVE` per unit (OQ-008 recorded) |
| SM-FULFILLMENT-ASSESSMENT recorded PURCHASE | purchase-need to Procurement | Ledger, Balance | none |
| SM-FULFILLMENT-ASSESSMENT recorded MAKE | production-need to Production | Ledger, Balance | OQ-003 |
| SM-FULFILLMENT-ASSESSMENT recorded NOT_FEASIBLE | start SM-UNFULFILLED-DEMAND | Sales Order (not required) | none |
| SM-SALES-ORDER confirmed | Reservation / PO / Production only as already assessed | Ledger, Balance | one `ACTIVE` per unit (OQ-008 recorded) |
| SM-SALES-ORDER fulfilled on STOCK or PURCHASE | none for Production | Production Order | OQ-006 |
| SM-MATERIAL-ALLOCATION issued | Inventory issue posting | Production writing Ledger | OQ-003 |
| SM-INVENTORY-UNIT issued from allocation | Inventory issue from AVAILABLE, not from Reservation | Reservation required | OQ-003 |
| SM-PRODUCTION-OPERATION completed | Nested IPS consume/output/residual identity or scrap qty inside the same transaction; optional QC request | Ledger by Production table write; later independent leftover post | OQ-003 names, OQ-006 number, OQ-009 cutoff number |
| SM-SALES-ORDER closed | may `ReleaseReservation` for remaining ACTIVE rows; none for Ledger qty | Invoice / Payment rows; auto-close from shipment `DELIVERED` | OQ-007 recorded: payment and shipment `DELIVERED` are not close effects |
| SM-UNFULFILLED-DEMAND recorded | Reporting projection; may cover an SO remainder | treating Unfulfilled as overdue; requiring a Sales Order FK | none |
| SM-PURCHASE-ORDER sent / received | GoodsReceipt orchestration may start | Ledger, Balance | none |
| SM-GOODS-RECEIPT received | Inbound QC request to Quality | Ledger, Balance | OQ-005 |
| SM-GOODS-RECEIPT posted | Inventory Posting Service creates Lot / Unit | PurchaseOrder commercial fields | OQ-015, OQ-017 |
| SM-RESERVATION active | Availability projection; occupies the unit’s single `ACTIVE` slot | Sales Order rows; a second `ACTIVE` on the same unit | uniqueness recorded (OQ-008) |
| SM-QUALITY-INSPECTION hold / quarantine / reject / Released | Inventory hold/release/reject command | Ledger, Balance, Unit quantity | OQ-005 |
| SM-PRODUCTION-ORDER released | Allocation in Production; issue command to Inventory | Ledger, Balance | OQ-003 |
| SM-PRODUCTION-ORDER resumed | none for stock | silent skip of pause | none |
| SM-PRODUCTION-ORDER operation complete | Same nested INV-006 bundle as the operation; order `CompleteOperationPartial` writes PO state only | Ledger by Production table write; stock post on the order command | OQ-003 names, OQ-006 number, OQ-009 cutoff number |
| SM-RESIDUAL fact recorded | Nested `CreateResidualUnit` inside `CompleteProductionOperation` when leftover is reusable | Production writing Unit identity; second residual qty after completion | OQ-009 cutoff number |
| SM-SCRAP fact recorded | Nested `PostScrapMovement` for production leftover, or Quality/abort scrap with a new key | Quality writing stock; second scrap qty for the same leftover | OQ-009 when leftover classification |
| SM-PACKAGE packed | Optional Inventory pack-state command | Inventory writing Package | OQ-004 |
| SM-SHIPMENT dispatched | Inventory definitive stock exit | Ledger/Balance by Shipping | OQ-006 |
| SM-SHIPMENT delivered | Finance-Lite receivable facts | Sales writing Invoice; auto-close of Sales Order | OQ-012. Delivery does not close the SO (OQ-007). |
| SM-INVOICE issued | none for stock | External legal GL | OQ-012 |
| SM-PAYMENT allocated | Invoice open-balance reduction | Payment exceeding invoice or payment value | OQ-012 |

Genealogy Link is never written as source truth. Rebuild from the
source-fact catalogue in
[GENEALOGY_PROJECTION.md](../04-database-architecture/GENEALOGY_PROJECTION.md)
(Lot origin, Consumption, Output, Residual, Scrap, Package, Shipment,
Rework) (INV-019, FIND-G-014). Do not rebuild Genealogy from Ledger
rows alone.
