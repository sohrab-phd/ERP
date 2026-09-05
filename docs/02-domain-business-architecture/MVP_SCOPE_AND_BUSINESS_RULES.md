---
id: DOM-MVP-RULES-001
title: MVP Scope and Business-Rule Catalogue
phase: 02-domain-business-architecture
status: approved
version: 0.2.1
owners: [business-process-owner, chief-solution-architect]
depends_on: [ASM-REPORT-001, DOM-CAP-BC-001, DOM-PROCESS-001, DOM-OWN-001, ASM-014]
last_reviewed: 2026-09-06
approval: APR-004
supersedes: null
---

# MVP Scope and Business-Rule Catalogue

## Purpose

State the proposed MVP capability boundary and the business rules the system
must respect, without converting open questions into silent decisions. This
catalogue is Phase 02 draft evidence. It is not workshop output, not owner
sign-off, and not implementation authorization.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Scope classification

| Class | Meaning |
| --- | --- |
| In MVP | Required for a real purchase-to-delivery cycle without parallel Excel |
| Deferred | Explicitly out of this MVP; remains registered |
| Open | Required for MVP completeness but not yet specified; owning OQ remains |

## In MVP — proposed

- Identity, roles, sessions, and backend authorization for factory users.
- Master data sufficient to run one material/product family end to end, even
  while the signed UOM matrix remains OQ-001.
- Sales: Customer, Inquiry, Quotation, Sales Order / items, Fulfillment
  Assessment, promised dates, confirmation/change/cancellation, Unfulfilled
  Demand as a distinct outcome (TERM-005).
- Procurement: Supplier, Purchase Order, shortage-driven purchasing, Goods
  Receipt orchestration (TERM-019).
- Inventory: Material Lot, Inventory Unit / Coil, locations, Ledger, Balance,
  Reservation, transfer, adjustment, quality-hold coordination, one-writer
  posting.
- Production/MES: Production Order, operations, allocation, issue/consumption,
  output, residual, scrap, mass-balance posting, genealogy source facts.
- Quality: incoming/in-process/final inspection, hold/quarantine, accept /
  reject / conditional release, shipment-release gate.
- Shipping: packaging, picking/loading, dispatch, partial delivery, delivery
  confirmation, stock-exit request to Inventory.
- Finance-Lite: operational Invoice, Payment, allocation, customer balance.
- Reporting: operational stock, fulfillment, production, quality, lost demand,
  OTIF, and bidirectional genealogy queries.
- Audit: immutable business, status, and security evidence.
- Integration: adapter boundary and Outbox *pattern* as a proposal only.

## Deferred from this MVP — proposed

- Customer Portal **ordering** and any customer-facing commercial write path
  until OQ-010 / FIND-001 is decided. Visibility/request/document features may
  be evaluated later; they are not in the current MVP cut.
- Full legal accounting, taxation, and general ledger (ASM-010, OQ-012).
- Microservices, Kubernetes, Event Sourcing, Kafka/RabbitMQ without a driver,
  Redis as stock truth, PLC telemetry, offline-first inventory, time-series
  infrastructure.
- Automatic high availability.

## Open items that still bind MVP design

These stay open. MVP architecture must leave explicit extension points rather
than inventing values.

- OQ-001 UOM/conversion/precision matrix
- OQ-002 Coil weight versus length semantics
- OQ-003 production routing and tracking granularity
- OQ-004 finished-product identity (batch vs unit)
- OQ-005 quality-plan and exceptional-release authority
- OQ-006 over-production / over-delivery tolerances
- OQ-007 Sales Order closure: delivery, payment, or both. Unfulfilled versus
  overdue demand remains a distinct TERM-005 / BR-013 rule, not this question.
- OQ-008 reservation expiry and preemption
- OQ-009 residual usability threshold
- OQ-010 portal phase (`treating`; ordering formally deferred from MVP; does
  not block the internal purchase-to-delivery cycle)
- OQ-011 equipment/weighbridge integration
- OQ-012 finance-lite versus legal accounting interface
- OQ-013 legal entity / site / tenancy
- OQ-014 volume and cutover
- OQ-015 correction/reversal authority matrix
- OQ-016 backup, recovery, support
- OQ-017 Inventory Posting mechanism
- OQ-018 architecture style, data platform, frontend, packages, deployment
- OQ-019 real named workshop participants (workshop execution still blocked)

## Proposed business-rule catalogue

Rules below are **source-proposal / derived synthesis**. They become normative
BR-* / INV-* records in Phase 03 only after workshop evidence. Temporary roster
identities cannot approve them.

| ID | Rule | Owner BC | Related |
| --- | --- | --- | --- |
| BR-001 | Every stock change has exactly one authorized posting path and immutable evidence. | BC-INVENTORY | OQ-017 |
| BR-002 | On-hand, reserved, and available quantities cannot become negative; active reservations cannot exceed free stock under concurrency. | BC-INVENTORY | OQ-008 |
| BR-003 | Availability is on-hand minus reservations and quality hold. Reservation, Allocation, and Consumption are distinct. | BC-INVENTORY, BC-PRODUCTION | TERM-009, TERM-010 |
| BR-004 | One Inventory Unit has one active physical location and cannot be simultaneously issued, shipped, quarantined, or consumed incompatibly. | BC-INVENTORY | ASM-005 |
| BR-005 | Posted operational and financial records are not physically deleted; corrections use reversal with reason, actor, authority, and audit. | cross-cutting | ASM-006, ASM-012, OQ-015 |
| BR-006 | Operation completion atomically records Consumption, Output/WIP, Residual, Scrap, process loss, genealogy, and inventory postings. | BC-PRODUCTION | OQ-003 |
| BR-007 | Mass balance holds within approved tolerance: consumed weight equals good output plus WIP plus residual plus scrap plus approved process loss. | BC-PRODUCTION | OQ-006 |
| BR-008 | A usable residual receives a new Inventory Unit identity linked to its parent; the parent is closed or split. Minimum usable threshold is OQ-009. | BC-PRODUCTION, BC-INVENTORY | OQ-009 |
| BR-009 | Genealogy source facts are immutable and support supplier-to-customer and customer-to-source tracing, including merge, split, rework, and defective-lot impact. | BC-PRODUCTION, BC-REPORTING | TERM-015 |
| BR-010 | Material/product cannot become available or shippable while required QC is pending, quarantined, or rejected. Product Batch must be Released before shipment. | BC-QUALITY, BC-SHIPPING | OQ-005, TERM-016 |
| BR-011 | Shipment content belongs to the authorized customer/order and references permitted Package or Product Batch form. Shipment without demand requires explicit authority. | BC-SHIPPING | OQ-006 |
| BR-012 | Issued invoices are immutable; void/credit/reversal preserves history. Payment allocations cannot exceed payment value or invoice open balance. | BC-FINANCE-LITE | OQ-012 |
| BR-013 | Unfulfilled demand is not overdue demand and may exist without a Sales Order; both remain separately reportable. | BC-SALES | OQ-007, TERM-005 |
| BR-014 | Historical commercial and specification values are snapshotted; later master-data changes do not rewrite posted history. | cross-cutting | ASM-012 |
| BR-015 | Authorization is enforced on the backend. Sensitive adjustments use separation of duties. Customer isolation applies to reads, exports, notifications, and documents. | BC-IDENTITY | FIND-001 / OQ-010 |
| BR-016 | Retryable commands and external submissions are idempotent; a retry must not duplicate receipt, posting, shipment, payment, or completion. | cross-cutting | INT catalogue |
| BR-017 | Quality and Shipping request inventory lifecycle changes; they do not write stock tables. | BC-QUALITY, BC-SHIPPING, BC-INVENTORY | DOM-OWN-001 |
| BR-018 | Procurement orchestrates inbound commercial/receipt flow; Inventory owns physical stock posting. | BC-PROCUREMENT, BC-INVENTORY | TERM-019 |
| BR-019 | Genealogy Link is a query projection, not independently editable truth. | BC-REPORTING | TERM-025, TERM-015 |
| BR-020 | Customer Portal ordering is out of this MVP until OQ-010 is decided. | BC-SALES | FIND-001 |

## Success criterion for this MVP

A real purchase-to-delivery cycle can run without parallel Excel, and balances,
audit trail, and genealogy reconcile. Numeric UOM, routing, QC, reservation, and
fulfillment limits remain workshop-owned and are not invented here.

## Formal scoping for the Phase 02 design-gate

Under ASM-014, the following remain unanswered and are formally scoped out of
this design-gate. They still block workshop-validated policy and their true
downstream phases.

| Question | Design-gate treatment |
| --- | --- |
| OQ-001, OQ-002 | Extension points only; no signed UOM or Coil quantity rule |
| OQ-003, OQ-004 | Production owns facts; routing and tracking granularity unset |
| OQ-005 | Quality commands Inventory; no named approvers or limits |
| OQ-006, OQ-008 | Partial fulfillment and Reservation exist; no numeric or expiry policy |
| OQ-010 | Ordering formally deferred from MVP; visibility/request optional deferred |
| OQ-013 | Single-site assumption remains unconfirmed |

OQ-007, OQ-009, and OQ-011 through OQ-018 were already downstream of this
design-gate. OQ-019 remains `treating` and still blocks workshop execution.

## Traceability

- Capabilities: [CAPABILITY_BOUNDED_CONTEXT_MAP.md](CAPABILITY_BOUNDED_CONTEXT_MAP.md)
- Processes: [PROCESS_MAPS_AS_IS_TO_BE.md](PROCESS_MAPS_AS_IS_TO_BE.md)
- Ownership: [MODULE_OWNERSHIP_MATRIX.md](MODULE_OWNERSHIP_MATRIX.md)
- Actors: [ACTOR_RESPONSIBILITY_CATALOGUE.md](ACTOR_RESPONSIBILITY_CATALOGUE.md)
- Objectives: [REQUIREMENTS_TRACEABILITY.md](../00-governance/registers/REQUIREMENTS_TRACEABILITY.md)

## Review evidence

- Self-check: [SELF_CHECK.md](SELF_CHECK.md)
- Independent review: [INDEPENDENT_REVIEW.md](INDEPENDENT_REVIEW.md)
- Reconciliation: [RECONCILIATION.md](RECONCILIATION.md)
