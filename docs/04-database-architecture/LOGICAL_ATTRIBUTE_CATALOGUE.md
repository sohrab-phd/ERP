---
id: DATA-ATTR-001
title: Logical Attribute Catalogue
phase: 04-database-architecture
status: approved
version: 0.1.0
owners: [data-architect, domain-leads]
depends_on: [DATA-LOGICAL-001, GOV-DATA-DICT-001, SM-INV-001, APR-005]
last_reviewed: 2026-09-06
approval: APR-006
supersedes: null
---

# Logical Attribute Catalogue

Named logical attributes for each ENT-*. This is not a column list. No
type, length, decimal scale, index, or nullability-as-storage is decided.
Quantity and UOM attributes are named only; their type stays OQ-001 /
OQ-002.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Legend

- **R** — required for the concept to exist
- **S** — required when the record is posted or reversed (INV-005, INV-014)
- **C** — required on a retryable command result (INV-016)
- **O** — open extension; do not invent a value or type

Shared on every authoritative record: opaque identity, write owner,
lifecycle state from the matching SM-*, recorded-at, actor role. Shared
on every posted or reversed record: reason, authority role, link to the
prior posted identity. Shared on every retryable command result:
caller-supplied idempotency key.

Site / legal-entity discriminator is **O** on every record (OQ-013).

## Sales

| Entity | Attribute | Class | Notes |
| --- | --- | --- | --- |
| ENT-CUSTOMER | identity, display name, isolation key | R | Portal channel OQ-010 |
| ENT-INQUIRY | customer ref, demand text, state | R | Portal request path forbidden in MVP |
| ENT-INQUIRY | expiry instant | O | `workshop-commercial-practice` |
| ENT-QUOTATION | customer ref, issued snapshot, state | R / S | Snapshot frozen at issue (INV-014) |
| ENT-QUOTATION | price / UOM / currency scale | O | OQ-001 |
| ENT-QUOTATION | expiry instant | O | `workshop-commercial-practice` |
| ENT-SALES-ORDER | customer ref, commercial snapshot, state | R / S | INV-014 |
| ENT-SALES-ORDER | close predicate | O | OQ-007 |
| ENT-SALES-ORDER-ITEM | order ref, demanded qty, remaining qty | R | qty type OQ-001 |
| ENT-SALES-ORDER-ITEM | over-delivery limit | O | OQ-006 |
| ENT-FULFILLMENT-ASSESSMENT | demand ref, outcome (STOCK/PURCHASE/MAKE/NOT_FEASIBLE) | R | availability is a read |
| ENT-UNFULFILLED-DEMAND | reason, demand signal ref, state | R | Sales Order not required (INV-013) |

## Procurement and inbound

| Entity | Attribute | Class | Notes |
| --- | --- | --- | --- |
| ENT-SUPPLIER | identity, display name | R | |
| ENT-PURCHASE-ORDER | supplier ref, commercial snapshot, state | R / S | named approver OQ-019 |
| ENT-PURCHASE-ORDER | line qty | R | type OQ-001 |
| ENT-GOODS-RECEIPT | PO or inbound ref, orchestration state | R | Procurement write |
| ENT-GOODS-RECEIPT | posted ledger ref | S | Inventory write; Procurement must not store qty as truth |
| ENT-GOODS-RECEIPT | weighbridge / device identity | O | OQ-011 |
| ENT-GOODS-RECEIPT | opening-stock source keys | O | OQ-015 |

## Inventory

| Entity | Attribute | Class | Notes |
| --- | --- | --- | --- |
| ENT-MATERIAL-LOT | supplier/certificate/receipt refs | R | write owner proposed Inventory |
| ENT-INVENTORY-UNIT | lot ref, kind (including Coil), location, state | R | one active location (INV-004, ASM-005) |
| ENT-INVENTORY-UNIT | on-hand qty, reserved qty | R | type OQ-001; Coil length OQ-002 |
| ENT-INVENTORY-LEDGER | unit/lot ref, direction, qty, reason, actor role, prior-row link | R / S / C | immutable; mechanism OQ-017 |
| ENT-INVENTORY-BALANCE | unit/lot ref, on-hand, reserved, held | R | projection of Ledger; not independently editable |
| ENT-RESERVATION | demand ref, unit/lot ref, claimed qty, state | R | distinct from Allocation (INV-003) |
| ENT-RESERVATION | expiry, priority, one-Coil-to-many | O | OQ-008 |

Available qty is derived: on-hand − reserved − quality hold (INV-003).
Do not store a third independent quantity as truth.

## Production

| Entity | Attribute | Class | Notes |
| --- | --- | --- | --- |
| ENT-PRODUCTION-ORDER | demand or make-need ref, state | R | |
| ENT-MATERIAL-ALLOCATION | order/operation ref, unit/lot ref, state | R | not a Reservation |
| ENT-PRODUCTION-OPERATION | order ref, state | R | step name OQ-003 |
| ENT-MATERIAL-CONSUMPTION | operation ref, unit ref, qty | R / S | qty type OQ-001; posting point OQ-003 |
| ENT-PRODUCTION-OUTPUT | operation ref, unit or batch ref, qty | R / S | tracking grain OQ-004 |
| ENT-RESIDUAL | parent unit, fact qty, child unit ref | R / S | usable cutoff OQ-009 |
| ENT-SCRAP | origin, reason, fact qty | R / S | stock movement is a Ledger row |
| ENT-PRODUCT-BATCH | output refs, Released flag | R | grain OQ-004; release person OQ-005 |

Process-loss qty is a named consumption/output fact. Its approved
tolerance stays OQ-006 (INV-007).

## Quality, shipping, finance

| Entity | Attribute | Class | Notes |
| --- | --- | --- | --- |
| ENT-QUALITY-INSPECTION | subject ref, state, disposition | R | plans/limits/releasers OQ-005 |
| ENT-PACKAGE | shipment ref, contents refs, state | R | pack-state command only |
| ENT-SHIPMENT | customer/order or exceptional-authority flag, state | R | named person OQ-019 |
| ENT-SHIPMENT | delivered qty, over-delivery | O | OQ-006 |
| ENT-INVOICE | commercial snapshot, open balance, state | R / S | not legal GL (OQ-012) |
| ENT-PAYMENT | amount, allocations, state | R / S / C | allocations ≤ payment and ≤ open (INV-012) |
| ENT-GENEALOGY-LINK | from-fact, to-fact, hop type | projection | rebuild only; no user edit |

Invoice and Payment amounts are operational. Scale stays OQ-001 until a
finance UOM/currency rule exists. They must not be treated as the legal
books (OQ-012).

## Identifiers

- Every authoritative record has an opaque system identity.
- A human-visible business number may exist later. Numbering series,
  prefixes, and site-scoped sequences stay OQ-013.
- Do not invent a document-number format in this catalogue.
