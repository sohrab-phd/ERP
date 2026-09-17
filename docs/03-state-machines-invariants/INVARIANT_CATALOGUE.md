---
id: SM-INV-001
title: Canonical Invariant Catalogue
phase: 03-state-machines-invariants
status: approved
version: 0.2.0
owners: [chief-solution-architect, domain-leads]
depends_on: [DOM-MVP-RULES-001, DOM-P03-HANDOFF-001, APR-004, APR-005]
last_reviewed: 2026-09-16
approval: APR-005
supersedes: null
---

# Canonical Invariant Catalogue

Proposed `INV-*` rows promoted from Phase 02 `BR-*`. They are not owner-signed
policy. Temporary identities cannot approve them. A row that depends on an
unanswered OQ keeps an explicit open guard. No number, person, or cutoff is
invented here.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Promotion table

| INV | From | Statement | Open guard |
| --- | --- | --- | --- |
| INV-001 | BR-001 | Every stock change has exactly one authorized posting path and immutable evidence. | Posting mechanism remains OQ-017 |
| INV-002 | BR-002 | On-hand, reserved, and available quantities cannot become negative. Active reservations cannot exceed free stock under concurrency. A single Inventory Unit may have at most one reservation in state `ACTIVE` (OQ-008). `REQUESTED`, `RELEASED`, `CONSUMED`, and `EXPIRED` reservations do not occupy that slot. | Future temporary-hold TTL only (OQ-008 residual) |
| INV-003 | BR-003 | Availability is on-hand minus reservations and quality hold. Reservation, Allocation, and Consumption are distinct. | none |
| INV-004 | BR-004 | One Inventory Unit has one active physical location and cannot be simultaneously issued, shipped, quarantined, or consumed incompatibly. | ASM-005 unconfirmed |
| INV-005 | BR-005 | Posted operational and financial records are not physically deleted. Corrections use reversal with reason, actor, authority, and audit. | Cutover authority remains OQ-015 |
| INV-006 | BR-006 | Operation completion atomically records Consumption, Output/WIP, Residual, Scrap, process loss, genealogy source facts, and inventory postings. Residual identity (`CreateResidualUnit`) and scrap quantity (`PostScrapMovement`) are nested in that transaction, not later independent posts. | Routing step names remain OQ-003; posting boundary is `CompleteProductionOperation` (recorded OQ-003). Residual cutoff **numbers** remain OQ-009. |
| INV-007 | BR-007 | Mass balance holds within approved tolerance: consumed = good output + WIP + residual + scrap + approved process loss. | Tolerance number remains OQ-006 |
| INV-008 | BR-008 | A usable residual receives a new Inventory Unit identity linked to its parent; the parent is closed or split. | Minimum usable threshold remains OQ-009 |
| INV-009 | BR-009 | Genealogy source facts are immutable and support supplier-to-customer and customer-to-source tracing, including merge, split, rework, and defective-lot impact. | Tracking granularity remains OQ-004 |
| INV-010 | BR-010 | Material or product cannot become available or shippable while required QC is pending, quarantined, or rejected. Product Batch must be Released before shipment. | Plans, limits, and named releasers remain OQ-005 |
| INV-011 | BR-011 | Shipment content belongs to the authorized customer/order and references permitted Package or Product Batch form. Shipment without demand requires explicit authority. | Over-delivery limit remains OQ-006; named exceptional-shipment person remains OQ-019; QC releasers remain OQ-005 |
| INV-012 | BR-012 | Issued invoices are immutable; void/credit/reversal preserves history. Payment allocations cannot exceed payment value or invoice open balance. | Legal-accounting boundary remains OQ-012 |
| INV-013 | BR-013 | Unfulfilled demand is not overdue demand and may exist without a Sales Order. | none as the distinction; SO close uses Unfulfilled Demand for remainder (OQ-007 recorded) |
| INV-014 | BR-014 | Historical commercial and specification values are snapshotted. Later master-data changes do not rewrite posted history. | none as a rule; retention numbers remain OQ-016 |
| INV-015 | BR-015 | Authorization is enforced on the backend. Sensitive adjustments use separation of duties. Customer isolation applies to reads, exports, notifications, and documents. | Portal actions remain OQ-010 |
| INV-016 | BR-016 | Retryable commands and external submissions are idempotent. A retry must not duplicate receipt, posting, shipment, payment, or completion. | none |
| INV-017 | BR-017 | Quality and Shipping request inventory lifecycle changes. They do not write stock tables. | none |
| INV-018 | BR-018 | Procurement orchestrates inbound commercial/receipt flow. Inventory owns physical stock posting. | none |
| INV-019 | BR-019 | Genealogy Link is a query projection, not independently editable truth. | none |
| INV-020 | BR-020 | Customer Portal ordering is out of this MVP until OQ-010 is decided. | OQ-010 remains `treating` |

## Application rule

A transition in [STATE_MACHINE_CATALOGUE.md](STATE_MACHINE_CATALOGUE.md) may
cite these IDs. If the cited invariant has an open guard, the transition guard
must stay open on the same OQ. Do not replace an open guard with a guessed
value.

## Canonical reservation uniqueness (OQ-008 / FIND-G-005)

Identity of an **active** reservation is the pair:

- `ENT-RESERVATION` row in state `ACTIVE`
- `ENT-INVENTORY-UNIT` it claims (Coil is a kind of Inventory Unit)

A single Inventory Unit may have **at most one** reservation in `ACTIVE`.
`REQUESTED`, `RELEASED`, `CONSUMED`, and `EXPIRED` do not occupy that slot.
Historical rows may exist; uniqueness is the live `ACTIVE` slot only.

Partial quantity does **not** create a second slot. If Coil X has 1,000 kg
and Sales Order A holds an `ACTIVE` reservation for 400 kg, Sales Order B
must not `ACTIVE`-reserve 200 kg on the same unit. Remaining kg stays part
of that unit until release, consume, or `CreateResidualUnit` (OQ-008
under-consumption). No silent split across Sales Orders.

Reservation is not Consumption. Allocation is not Reservation. Consumption
posts only through `ACT-IPS` as a Ledger event.

## Canonical Sales Order close remainder (OQ-007 / INV-013)

`FULFILLED → CLOSED` requires remaining valid demand already zero within
OQ-006. Shipment `DELIVERED` is not a close prerequisite. Unfulfilled
Demand remains distinct from overdue, delayed, awaiting-supply,
quotation-rejected, and cancelled. `CloseSalesOrder` from
`PARTIALLY_FULFILLED` requires an authorized TERM-005 Unfulfilled Demand
covering remaining qty. Payment and invoice status are not this invariant.
