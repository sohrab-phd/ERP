---
id: DATA-LOGICAL-001
title: Logical Data Model
phase: 04-database-architecture
status: in_review
version: 0.1.0
owners: [data-architect, domain-leads]
depends_on: [GOV-DATA-DICT-001, DOM-OWN-001, APR-005]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# Logical Data Model

Conceptual entities and relationships already in
[CANONICAL_DATA_DICTIONARY.md](../00-governance/registers/CANONICAL_DATA_DICTIONARY.md)
and
[MODULE_OWNERSHIP_MATRIX.md](../02-domain-business-architecture/MODULE_OWNERSHIP_MATRIX.md).
This is not a physical schema. No table, column type, key algorithm, or
migration is authorized.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Rules

- Exactly one write owner per authoritative concept (DOM-OWN-001).
- Quality and Shipping command Inventory; they do not own stock quantities
  (INV-017).
- Genealogy Link is a projection, not an independently editable entity
  (INV-019).
- Coil is a kind of Inventory Unit, not a separate entity.
- ShipmentItem, Dispatch, and Delivery remain Shipment lifecycle facts
  (FIND-023). Do not mint those ENT-* IDs here.
- Quantity, UOM, precision, and rounding stay open (OQ-001, OQ-002).
- Official routing steps stay open (OQ-003).
- Tracking granularity stays open (OQ-004).

## Write-owner groups

| Write owner | Entities |
| --- | --- |
| Sales | Customer, Inquiry, Quotation, Sales Order, Sales Order Item, Fulfillment Assessment, Unfulfilled Demand |
| Procurement | Supplier, Purchase Order, Goods Receipt (orchestration) |
| Inventory / ACT-IPS | Material Lot, Inventory Unit, Inventory Ledger, Inventory Balance, Reservation; Goods Receipt stock posting; Residual resulting unit; Scrap stock movement |
| Production | Production Order, Material Allocation, Production Operation, Material Consumption, Production Output, Residual fact, Scrap fact, Product Batch |
| Quality | Quality Inspection |
| Shipping | Package, Shipment |
| Finance-Lite | Invoice, Payment |
| none as truth | Genealogy Link (rebuildable projection) |

## Relationships

```mermaid
erDiagram
  CUSTOMER ||--o{ INQUIRY : raises
  CUSTOMER ||--o{ QUOTATION : offered
  CUSTOMER ||--o{ SALES_ORDER : orders
  INQUIRY ||--o| QUOTATION : may_become
  QUOTATION ||--o| SALES_ORDER : may_become
  SALES_ORDER ||--|{ SALES_ORDER_ITEM : contains
  SALES_ORDER ||--o{ FULFILLMENT_ASSESSMENT : assessed_by
  FULFILLMENT_ASSESSMENT ||--o| UNFULFILLED_DEMAND : when_not_feasible
  SALES_ORDER ||--o{ RESERVATION : claims
  SALES_ORDER ||--o{ PURCHASE_ORDER : may_drive
  SALES_ORDER ||--o{ PRODUCTION_ORDER : may_drive
  SUPPLIER ||--o{ PURCHASE_ORDER : supplies
  PURCHASE_ORDER ||--o{ GOODS_RECEIPT : received_as
  GOODS_RECEIPT ||--o{ MATERIAL_LOT : posts
  MATERIAL_LOT ||--o{ INVENTORY_UNIT : contains
  INVENTORY_LEDGER ||--o{ INVENTORY_BALANCE : projects
  INVENTORY_UNIT ||--o{ RESERVATION : reserved_as
  PRODUCTION_ORDER ||--o{ MATERIAL_ALLOCATION : allocates
  PRODUCTION_ORDER ||--|{ PRODUCTION_OPERATION : executes
  MATERIAL_ALLOCATION ||--o| INVENTORY_UNIT : issues
  PRODUCTION_OPERATION ||--o{ MATERIAL_CONSUMPTION : consumes
  PRODUCTION_OPERATION ||--o{ PRODUCTION_OUTPUT : produces
  PRODUCTION_OPERATION ||--o{ RESIDUAL : leftover
  PRODUCTION_OPERATION ||--o{ SCRAP : loss
  PRODUCTION_OUTPUT ||--o| PRODUCT_BATCH : batches
  QUALITY_INSPECTION }o--|| INVENTORY_UNIT : inspects
  PACKAGE ||--o{ INVENTORY_UNIT : packs
  SHIPMENT ||--o{ PACKAGE : carries
  SHIPMENT }o--o| SALES_ORDER : fulfills
  INVOICE }o--o| SALES_ORDER : bills
  PAYMENT }o--o{ INVOICE : allocates
```

## Attributes that may be named now

Identity, write owner, lifecycle state (from the matching SM-*),
commercial snapshot fields already required by INV-014, reason/actor
role/authority/timestamp on reversals (INV-005), and caller idempotency
key (INV-016).

## Attributes that stay open

| Attribute family | Why open |
| --- | --- |
| Quantity type, UOM, decimals, rounding | OQ-001, OQ-002 |
| Official operation step name and posting point | OQ-003 |
| Batch vs bundle vs piece identity | OQ-004 |
| QC plan, limit, sample, named releaser | OQ-005 |
| Tolerance percents and over-delivery limits | OQ-006 |
| Sales Order close predicate | OQ-007 |
| Reservation expiry and preemption | OQ-008 |
| Residual cutoff | OQ-009 |
| Site / legal-entity discriminator | OQ-013 |
| Physical types, indexes, volumes | OQ-014 |
| Opening-stock source keys | OQ-015 |
| Retention days | OQ-016 |
| Ledger storage mechanism | OQ-017 |

Do not invent a column type to stand in for those answers.
