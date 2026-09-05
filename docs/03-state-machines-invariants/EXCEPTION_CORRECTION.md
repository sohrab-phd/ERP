---
id: SM-EXC-001
title: Exception and Correction Workflows
phase: 03-state-machines-invariants
status: in_review
version: 0.1.0
owners: [chief-solution-architect, domain-leads]
depends_on: [SM-CATALOGUE-001, SM-INV-001, DOM-PROCESS-001, APR-004]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# Exception and Correction Workflows

Named exceptions from Phase 02 process maps, stated as lifecycle behavior.
Numeric policy and named approvers remain open.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Unfulfilled demand without a Sales Order

If Fulfillment Assessment finds no feasible stock, purchase, or make path,
record SM-UNFULFILLED-DEMAND. Do not require SM-SALES-ORDER. Do not treat this
as overdue demand (INV-013).

## Partial fulfillment

SM-SALES-ORDER may be `PARTIALLY_FULFILLED`. SM-SHIPMENT may be
`PARTIALLY_DELIVERED`. Allowed over-production and over-delivery amounts stay
OQ-006. Do not invent percents.

## QC hold, reject, and conditional release

SM-QUALITY-INSPECTION dispositions command Inventory. Stock stays unavailable
while required QC is pending, quarantined, or rejected (INV-010). Who may make
an exception stays OQ-005.

## Residual versus scrap

Leftover material becomes SM-RESIDUAL only if it is usable. The cutoff stays
OQ-009. Below that cutoff, use SM-SCRAP. Production writes the fact; Inventory
writes the resulting unit or stock movement.

## Rework

Rework is a Production fact with genealogy impact. It is not a silent edit of
prior consumption or output. Posted records reverse; they are not deleted
(INV-005). Detailed rework routing stays OQ-003.

## Cancellation

Pre-post cancel is a branch on the owning machine. After posting, cancel is a
reversal to a new compensating record. Sales Order post-confirm change uses
SalesOrderChange, not return to Draft.

## Reversal correction

Every posted inventory, operational, or finance correction carries reason,
actor role, authority, timestamp, and linked reversal evidence (INV-005,
INV-014). Named cutover authority stays OQ-015. Inventory posting mechanism
stays OQ-017.

## Shipment without demand

SM-SHIPMENT may not reach `READY` or `DISPATCHED` without an authorized
customer/order unless explicit authority is recorded (INV-011). The named
approver is not invented here.

## Idempotent retry

A retried receipt, posting, shipment, payment, or completion command must not
create a second posted fact (INV-016).
