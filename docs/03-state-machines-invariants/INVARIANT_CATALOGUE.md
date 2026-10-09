---
id: SM-INV-001
title: Canonical Invariant Catalogue
phase: 03-state-machines-invariants
status: in_review
version: 0.5.0
owners: [chief-solution-architect, domain-leads]
depends_on: [DOM-MVP-RULES-001, DOM-P03-HANDOFF-001, APR-004, APR-005]
last_reviewed: 2026-10-09
approval: null
supersedes: null
---

# Canonical Invariant Catalogue

## Current evidence precedence (2026-10-09)

APR-025 actual Owner production decision (2026-10-09) resolves bounded full/partial consumption only at CompleteProductionOperation, approved-route WIP/final meanings, zero unexplained mass imbalance and authenticated managerial Residual/Scrap disposition. No numeric classifier, process-loss adjustment or OQ-006 tolerance. Runtime route skip/reorder, post-post correction/rework and standalone warehouse conversion remain deferred prerequisites. QC stays outside MVP. Earlier factory evidence is retained; only the answered OQ-003/OQ-009 branches are resolved, both remain treating overall. Invariants and historical structure approvals do not grant implementation authority.


Proposed `INV-*` rows promoted from Phase 02 `BR-*`. They are not owner-signed
policy. Temporary identities cannot approve them. A row that depends on an
unanswered OQ keeps an explicit open guard. No number, person, or cutoff is
invented here.

Implementation authorization and bounded scope are recorded in [CURRENT_PHASE.md](../00-governance/CURRENT_PHASE.md) and the canonical gate; this catalogue grants no authority.

OQ-005 scope: the factory has no QC department or Quality role, and QC
execution is outside the current MVP. Quality-dependent clauses below
are retained for future capability only. They do not impose a current
inspection, hold, release, availability, or shipment prerequisite.

## Promotion table

| INV | From | Statement | Open guard |
| --- | --- | --- | --- |
| INV-001 | BR-001 | Every stock change has exactly one authorized posting path and immutable evidence. | OQ-017 answered: application-owned PostgreSQL transaction; optional stored functions require a later ADR |
| INV-002 | BR-002 | On-hand, reserved, and available quantities cannot become negative. Active reservations cannot exceed free stock under concurrency. A single Inventory Unit may have at most one reservation in state `ACTIVE` (OQ-008). `REQUESTED`, `RELEASED`, `CONSUMED`, and `EXPIRED` reservations do not occupy that slot. | Future temporary-hold TTL only (OQ-008 residual) |
| INV-003 | BR-003 | Availability quantity is on-hand minus reservations; Inventory Unit lifecycle eligibility is distinct from Ledger quantity. In the current MVP, valid normal stock-in creates or increases stock whose resulting Unit is `AVAILABLE` within the posting transaction, visible for permitted normal use after commit, without Quality release. Existing quantity, identity, location, authorization, reservation, and destiny guards still apply. Production new WIP is the explicit exception: it remains `ISSUED_TO_PRODUCTION` and unavailable to sale/shipment until valid final required route completion under APR-025. A Quality hold applies only in a later approved QC scope. Reservation, Allocation, and Consumption are distinct. | OQ-005 future only; no new current-MVP approval gate |
| INV-004 | BR-004 | One Inventory Unit has one active physical location and cannot be simultaneously issued, shipped, quarantined, or consumed incompatibly. | ASM-005 unconfirmed |
| INV-005 | BR-005 | Posted operational and financial records are not physically deleted. Corrections use reversal with reason, actor, authority, and audit. | Cutover authority remains OQ-015 |
| INV-006 | BR-006 | Operation completion atomically records actual Consumption, new Output/WIP, authorized Residual/Scrap, genealogy source facts and inventory postings; no process-loss adjustment in this MVP. Residual identity (`CreateResidualUnit`) and scrap quantity (`PostScrapMovement`) are nested in that transaction, not later independent posts. | Ten Stations and variable per-order routes are recorded; immutable route storage/version/release is implemented by ADR-0020; runtime skip/reorder and correction branches remain OQ-003; posting boundary is `CompleteProductionOperation` (recorded OQ-003). APR-025 supplies authenticated managerial disposition; no numeric classifier. |
| INV-007 | BR-007 | Bounded MVP exact consumed kg = final + new WIP + Residual + Scrap. Exclude unconsumed source and existing WIP; no rounding or unexplained loss. | APR-025 zero unexplained imbalance; OQ-006 fulfillment tolerance is unrelated. No automatic classifier or balancing adjustment. |
| INV-008 | BR-008 | A usable residual receives a new Inventory Unit identity linked to its parent; the parent is closed or split. | APR-025 authenticated management disposition; no universal threshold or automatic classification from measurements; standalone warehouse conversion remains outside this completion. |
| INV-009 | BR-009 | Genealogy source facts are immutable and support supplier-to-customer and customer-to-source tracing, including merge, split, rework, and defective-lot impact. | OQ-004 hybrid grain answered; dependent material/order-code catalogue and physical mapping remain later inputs |
| INV-010 | BR-010 | **Future Quality scope only:** if QC is later required, pending, quarantined, or rejected disposition blocks availability or shipment and Product Batch requires Quality release. This does not apply in the current MVP. | Future plans, limits, and named releasers remain OQ-005; no current-MVP QC guard |
| INV-011 | BR-011 | Shipment content belongs to the authorized customer/order and references permitted Package or Product Batch form. Shipment without demand requires explicit authority. | OQ-006 answered: default 0, explicit family configuration for any nondefault limit; named exceptional-shipment person remains OQ-019; QC releasers OQ-005 only in future QC scope |
| INV-012 | BR-012 | Issued invoices are immutable; void/credit/reversal preserves history. Payment allocations cannot exceed payment value or invoice open balance. | OQ-012 answered: Finance-Lite excludes legal GL; external upload/integration details are later inputs |
| INV-013 | BR-013 | Unfulfilled demand is not overdue demand and may exist without a Sales Order. | none as the distinction; SO close uses Unfulfilled Demand for remainder (OQ-007 recorded) |
| INV-014 | BR-014 | Historical commercial and specification values are snapshotted. Later master-data changes do not rewrite posted history. | none as a rule; retention numbers remain OQ-016 |
| INV-015 | BR-015 | Authorization is enforced on the backend. Sensitive adjustments use separation of duties. Customer isolation applies to reads, exports, notifications, and documents. | OQ-010 answered visibility-only; document list and customer identity mapping are later inputs |
| INV-016 | BR-016 | Retryable commands and external submissions are idempotent. A retry must not duplicate receipt, posting, shipment, payment, or completion. | none |
| INV-017 | BR-017 | Shipping requests inventory lifecycle changes; future Quality may also command Inventory if separately enabled. Neither writes stock tables. | OQ-005 future only for Quality |
| INV-018 | BR-018 | Procurement orchestrates inbound commercial/receipt flow. Inventory owns physical stock posting. | none |
| INV-019 | BR-019 | Genealogy Link is a query projection, not independently editable truth. Rebuild from DATA-GEN-001 source facts, not Ledger rows alone (FIND-G-014). | none |
| INV-020 | BR-020 | Customer Portal MVP is visibility-only. Ordering (`PortalPlaceOrder`) is out of this MVP (OQ-010 recorded). | none as ordering; exact portal document list remains OQ-010 residual |

## Application rule

The current-MVP stock-in availability clause in INV-003 is an architecture
reconciliation required by the absence of a QC gate, not a quoted factory
procedure. It covers valid `PostGoodsReceipt` stock-in, valid good/reusable
output and residual stock-in within `CompleteProductionOperation`, and any
future accepted Coil → Sheet or Opening Stock posting boundary once validly
committed. It does not accept either unresolved posting boundary, make Scrap
available, or make WIP automatically saleable. Ledger remains quantity truth;
`AVAILABLE` expresses lifecycle eligibility only.

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

## Effective bounded MVP production policy — 2026-10-09

[APR-025](../00-governance/approved-baselines/APR-025-production-scope.md#owner-production-decision--2026-10-09) supersedes only earlier missing production consumption/result/mass-balance/disposition branches. CompleteProductionOperation supports full/partial actual kg; original unconsumed material retains restrictions. Exact consumed = final + new WIP + Residual + Scrap, zero unexplained imbalance, no process loss/rounding. Existing WIP is not double-counted. WIP is not saleable; final readiness follows approved per-order route. Required leftover classification is the actual authenticated, explicitly permitted manager decision, without a new role/second approval chain; none is required for no leftovers. Current atomic owner/IPS/source-fact/audit/idempotency boundary is unchanged; unrelated OQ branches remain open.
