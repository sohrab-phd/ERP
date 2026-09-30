---
id: DOM-MVP-RULES-001
title: MVP Scope and Business-Rule Catalogue
phase: 02-domain-business-architecture
status: approved
version: 0.2.7
owners: [business-process-owner, chief-solution-architect]
depends_on: [ASM-REPORT-001, DOM-CAP-BC-001, DOM-PROCESS-001, DOM-OWN-001, ASM-014]
last_reviewed: 2026-09-30
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
  Receipt orchestration (TERM-019). Factory intake evidence does not add a
  Procurement Manager or a purchase-approval person.
- Inventory: Material Lot, Inventory Unit / Coil, locations, Ledger, Balance,
  Reservation, transfer, adjustment, quality-hold coordination, one-writer
  posting. Incoming quantity remains `PostGoodsReceipt`. Count at intake is
  not a second ledger. Current factory intake does not require Quality
  approval; quality-hold coordination stays future capability.
- Production/MES: Production Order, operations, allocation, issue/consumption,
  output, residual, scrap, mass-balance posting, genealogy source facts.
  Registering a customer order does not automatically create a Production
  Order. Entry and Referral are not Start or Complete. A Station
  completion does not post. No Production Planner is added.
- Quality: incoming/in-process/final inspection, hold/quarantine, accept /
  reject / conditional release, shipment-release gate. **Future capability.**
  Factory clarification (`2026-09-30`): there is no QC department, QC is
  outside the current factory MVP, and there is no Quality role or
  Quality personnel. This line is not deleted. It is not current factory
  operation and does not authorize a QC workflow. OQ-005 stays treating.
  BR-010 is not rewritten.
- Shipping: packaging, picking/loading, dispatch, partial delivery, delivery
  confirmation, stock-exit request to Inventory.
- Finance-Lite: operational Invoice, Payment, allocation, customer balance.
  Factory evidence (`2026-09-30`) adds the commercial estimate, the final
  amount, three payment methods, and an unnamed external invoice upload.
  It does not make Finance-Lite a legal general ledger and does not add
  a Legal-GL connector.
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

## Recorded later (OQ-007 / OQ-008)

These are **not** still-open closure/reservation policy:

- OQ-007: a Sales Order may `CLOSED` when fulfilled, cancelled, or an
  authorized Unfulfilled Demand covers remaining demand. Payment is not a
  prerequisite. Unfulfilled versus overdue remains TERM-005 / BR-013.
- OQ-008: one Inventory Unit → one `ACTIVE` reservation. Confirmed-SO
  reservations do not timer-expire. Partial claimed qty is not a second
  slot on the same unit.

## Open items that still bind MVP design

These stay open. MVP architecture must leave explicit extension points rather
than inventing values.

- OQ-001 UOM/conversion/precision matrix
- OQ-002 Coil weight versus length semantics
- OQ-003 production routing and tracking granularity
- OQ-004 finished-product identity (batch vs unit)
- OQ-005 quality-plan and exceptional-release authority
- OQ-006 over-production / over-delivery tolerances
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
| BR-002 | On-hand, reserved, and available quantities cannot become negative; active reservations cannot exceed free stock under concurrency; at most one `ACTIVE` reservation per Inventory Unit. | BC-INVENTORY | OQ-008 recorded uniqueness; residual TTL only |
| BR-003 | Availability is on-hand minus reservations and quality hold. Reservation, Allocation, and Consumption are distinct. | BC-INVENTORY, BC-PRODUCTION | TERM-009, TERM-010 |
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
| BR-013 | Unfulfilled demand is not overdue demand and may exist without a Sales Order; both remain separately reportable. Remainder-close of a Sales Order uses this record (OQ-007). | BC-SALES | OQ-007 recorded, TERM-005 |
| BR-014 | Historical commercial and specification values are snapshotted; later master-data changes do not rewrite posted history. | cross-cutting | ASM-012 |
| BR-015 | Authorization is enforced on the backend. Sensitive adjustments use separation of duties. Customer isolation applies to reads, exports, notifications, and documents. | BC-IDENTITY | FIND-001 / OQ-010 |
| BR-016 | Retryable commands and external submissions are idempotent; a retry must not duplicate receipt, posting, shipment, payment, or completion. | cross-cutting | INT catalogue |
| BR-017 | Quality and Shipping request inventory lifecycle changes; they do not write stock tables. | BC-QUALITY, BC-SHIPPING, BC-INVENTORY | DOM-OWN-001 |
| BR-018 | Procurement orchestrates inbound commercial/receipt flow; Inventory owns physical stock posting. | BC-PROCUREMENT, BC-INVENTORY | TERM-019 |
| BR-019 | Genealogy Link is a query projection, not independently editable truth. Rebuild from DATA-GEN-001 source facts, not Ledger rows alone (FIND-G-014). | BC-REPORTING | TERM-025, TERM-015 |
| BR-020 | Customer Portal MVP is visibility-only. Ordering is out of this MVP (OQ-010 recorded). | BC-SALES | OQ-010, INV-020 |

## Factory-meeting confirmed requirements (`2026-09-23`)

These `RQ-*` identifiers are **factory-meeting evidence labels**. They are
not a minted Phase 07 `REQ-*` catalogue (FIND-021 / FIND-028), not `INV-*`
promotions, not schema fields, and not implementation authorization.
Classification of the Coil → Sheet **posting command** remains open.
Identity/security design for FACT-05 remains open.

| ID | Requirement | Evidence class | Related |
| --- | --- | --- | --- |
| RQ-01 | Incoming material and customer-order quantity are primarily expressed in kg. Length, thickness, width, and material/type are secondary and are not stock quantities. Measured stock weight: 0 decimal places, smallest step 1 kg, rounding not needed for that measurement. Weight↔length may be needed; formula undefined. Weight↔count conversion is not required. A measured-vs-expected weight difference must be shown; no automatic measurement tolerance is defined. That threshold is not OQ-006. | Confirmed factory measurement evidence; OQ-001 not fully closed | OQ-001 treating; OQ-002 answered; OQ-006 unchanged; FACT-01 |
| RQ-02 | Cut pieces and order scrap must remain traceable to the relevant customer order code. | Confirmed business traceability requirement | OQ-004; FACT-02; TERM-003 note |
| RQ-03 | The system must not require unique Inventory Unit identity for every tiny physical cut piece where such identity has no operational value. The Inventory Unit model is retained for independently controlled stock. | Confirmed factory fact; hybrid grain confirmed | OQ-004; FACT-02; TERM-007 |
| RQ-04 | The system must eventually support warehouse conversion of an opened-Coil remainder into Sheets without a customer order and without a Production Order, retaining Source Coil → Sheets traceability. Factory calls this an inventory transformation, separate from customer-order production. Authoritative stock quantity is measured kg. Sheet Code format is Coil Code + Sheet number. Posting command is **not** accepted: not added to `CompleteProductionOperation` or DATA-TX-001. | Factory business-process evidence; architecture posting boundary in conflict and still open | OQ-009 treating; OQ-001 treating; FACT-03 |
| RQ-05 | The system must support production routing through the current Stations. The Production Manager defines the route per order. Some Stations may be skipped. An earlier note that the system sends one fixed sequence is historical. | Confirmed operational requirement; how the route is stored remains OQ-003 | OQ-003 treating; FACT-05 |
| RQ-06 | The system must support reporting/visibility of an order's progression from one production station/section to the next. | Confirmed operational/reporting requirement | OQ-003 treating; FACT-05; FACT-06 |
| RQ-07 | The system must retain and expose Entry and Referral times from the system clock. Those events are not `StartProductionOperation` or `CompleteProductionOperation`. Exact storage beside the operation lifecycle is still open. No timestamp columns are invented here. | Confirmed reporting/history requirement | OQ-003 treating; FACT-06; SM-PRODUCTION-OPERATION |

Station-based ordinary execution (FACT-05) uses personal operator accounts.
The 2026-09-23 shared station-account preference is superseded. It does not
replace SEC-ID-001 `actor_identity`. Login and logout are recorded and are
not Station Entry.

Factory production facts do not change BR-006 or BR-007. Process loss in
those rules is an architecture fact when a routing records it. The factory
has not defined process loss or a mass-balance percentage. A weight
difference is not that fact. `ConsumeUnitPartial` and `ConsumeUnitComplete`
stay nested. The factory has not named them.

## Success criterion for this MVP

A real purchase-to-delivery cycle can run without parallel Excel, and balances,
audit trail, and genealogy reconcile. Numeric UOM, routing, QC, and
fulfillment-limit **numbers** remain workshop-owned. Sales Order close and
reservation uniqueness are recorded (OQ-007, OQ-008).

## Formal scoping for the Phase 02 design-gate

Under ASM-014, the following remain unanswered and are formally scoped out of
this design-gate. They still block workshop-validated policy and their true
downstream phases.

| Question | Design-gate treatment |
| --- | --- |
| OQ-001, OQ-002 | Extension points only; no signed UOM or Coil quantity rule |
| OQ-003, OQ-004 | Production owns facts; routing and tracking granularity unset |
| OQ-005 | Quality commands Inventory; no named approvers or limits |
| OQ-006 | Partial fulfillment exists; default over-delivery 0; family % is configuration |
| OQ-008 | Originally scoped out of this Phase 02 gate; recorded 2026-09-15: one `ACTIVE` per Inventory Unit; no confirmed-SO timer |
| OQ-010 | Ordering formally deferred from MVP; visibility/request optional deferred |
| OQ-013 | Single-site assumption remains unconfirmed |

OQ-007 is recorded (close independent of payment). OQ-009, and OQ-011 through
OQ-018 were already downstream of this design-gate. OQ-019 remains `treating`
and still blocks workshop execution.

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
