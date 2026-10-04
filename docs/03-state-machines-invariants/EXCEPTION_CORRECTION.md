---
id: SM-EXC-001
title: Exception and Correction Workflows
phase: 03-state-machines-invariants
status: in_review
version: 0.4.0
owners: [chief-solution-architect, domain-leads]
depends_on: [SM-CATALOGUE-001, SM-INV-001, DOM-PROCESS-001, APR-004, APR-005]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Exception and Correction Workflows

## Current evidence precedence (2026-10-04)

APR-005 remains historical structure-approval evidence; this technical revision
is made under delegated ADR-0012 authority and does not approve a new baseline.
Live OQ-009/factory evidence supersedes automatic numeric Residual/Scrap
classification: a person decides reusability; recording and authority stay open.
OQ-006 is fulfillment tolerance only. Production mass-balance/process-loss
policy remains open under production evidence/OQ-009 and must not inherit its
zero default. Missing required later-slice policy stays GUARD_OPEN_POLICY.
Quality is future-only; portal MVP is isolated visibility-only; personal
operator accounts apply. OQ answers/statuses are unchanged. Older draft/seed,
RACI and historical handoff wording cannot override these live facts.


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

STOCK and PURCHASE Sales Orders may move `CONFIRMED → PARTIALLY_FULFILLED`
or `CONFIRMED → FULFILLED` without `IN_PRODUCTION`. MAKE is the only path
that uses `IN_PRODUCTION`.

Partial fulfillment with **valid remaining demand** stays
`PARTIALLY_FULFILLED`. It does not auto-close. Closing that remainder
requires `RecordUnfulfilledDemand` (TERM-005), not silent discard
(OQ-007). Payment and invoice status do not close the Sales Order.

## Pause and resume

SM-PRODUCTION-ORDER `PAUSED` returns to the prior live state by
`ResumeProductionOrder`. Pause is not a skip and does not post stock. A QC
hold would block resume only in a future approved Quality scope (OQ-005).

## QC hold, reject, and conditional release

**Future Quality only; outside current MVP (OQ-005).** If enabled later,
SM-QUALITY-INSPECTION dispositions command Inventory. Stock stays unavailable
while required QC is pending, quarantined, or rejected (INV-010). Who may make
an exception stays OQ-005. No current-MVP exception or release actor is created.

## Residual versus scrap

Leftover material is classified **inside** `CompleteProductionOperation`
(INV-006, OQ-003). Reusable leftover uses nested `RecordResidualFact` +
`CreateResidualUnit` (INV-008). Non-reusable leftover uses nested
`RecordScrapFact` + `PostScrapMovement` (OQ-009). The attributable human
reusability decision controls the branch. Do not infer it from weight,
dimensions or a universal cutoff. Missing disposition recording/authority or
required family policy → `GUARD_OPEN_POLICY`; OQ-009 stays treating. Production writes the fact; Inventory posts identity
or scrap quantity **once**. A later independent residual or scrap post
for the same leftover kg is forbidden.

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
person stays OQ-019. This is not a Quality release (OQ-005).

## Idempotent retry

A retried receipt, posting, shipment, payment, or completion command must not
create a second posted fact (INV-016).
