---
id: ADR-0017
title: Customer-scoped non-monetary Sales demand and STOCK confirmation
status: accepted
version: 1.0.0
owners: [chief-solution-architect, data-architect]
last_reviewed: 2026-10-08
approval: null
---

# ADR-0017 — Sales demand and STOCK confirmation

Engineering decision within [APR-022](../approved-baselines/APR-022-sales-demand-scope.md)
and the accepted backlog's demand/confirmation increment. Preserves ADR-0011,
0014, 0015 and 0016. This is not a new factory-policy answer or MVP expansion.

## Decision and canonical basis

The canonical direct DraftSalesOrder -> SubmitSalesOrder -> ConfirmSalesOrder
path has no mandatory quotation prerequisite. Confirmation requires a RECORDED
FulfillmentAssessment; RecordFulfillmentStock reads availability. INV-014 requires
historical commercial/specification snapshots; factory evidence leaves price,
tax, currency and monetary rounding undefined. Deliver the non-monetary direct
path with immutable existing-customer and item/specification/kg snapshots.
Commercial terms are NOT_SUPPLIED, never fabricated zero/free prices. Monetary
quotation/invoice branches remain unimplemented before their relevant policy.

Sales owns scoped Customer references, Sales Order and FulfillmentAssessment.
UUIDs are technical identities, not a guessed factory Order Code. The explicit
DB-owner configuration tool provisions Customer references with owner/time evidence;
application runtime has only SELECT on those references. Customer maintenance UI,
public CRM commands and actual customer/individual grant inputs remain separate.
Use current personal ACT-SALES with explicit customer UUID grants; no organizational
wildcard, named-person assumption, ACT-CUST write or hardcoded assignment.

Order items store positive whole kg as exact strings below 10^20, material type,
bounded description and explicit partial-shipment preference. No conversion from
count/dimensions and no new material catalogue/pricing rules. Demand description
is recorded evidence: matching broad intake type does not automatically prove
all dimensions/specification compatibility; Sales selects suitable existing Units.
Snapshot values do not follow later customer-master edits.

Each STOCK assessment selects each line exactly once, with globally distinct Units
(maximum 16). Inventory's public read port retains the branded caller, scopes to
organization or exact customer stock, locks sorted Unit identities, checks Ledger,
Balance and active claims and returns exact AVAILABLE kg. Sales sums without Number
coercion and requires enough observed kg per line. No Inventory writes occur.

Confirm only SUBMITTED demand against its own recorded, immutable, matching
assessment. Re-read current selected availability before confirmation and record
an immutable database clock timestamp/assessment reference. This is demand evidence,
not guaranteed allocation. Multiple confirmed orders may observe the same stock;
accepted priority/contention belongs to the separate future reservation increment.
No REQUESTED/ACTIVE reservation, PO, Production Order or shipment is created.

## Atomicity, persistence and disclosure

Five version-1 commands use the existing durable envelope. Same-key accepted and
rejected outcomes replay under current principal/resource/customer permission.
New-key identical document/transition repetitions are DUP; changed document binding
or recorded selection is CONFLICT. Hidden foreign UUID collisions map only named
owner PK constraints to generic durable ACTOR rejection after savepoint recovery.
Each accepted result includes customerId so switching a legitimately granted
customer selector still cannot disclose another customer's original result.

One PostgreSQL client/transaction: envelope key -> current Identity account/session
-> order -> assessment -> sorted Inventory Unit locks -> Sales facts/state, original
audit and durable outcome. Business rejection rolls handler work back to savepoint;
technical failure aborts the complete bundle. Uncertain COMMIT resolves by same key
on original/reconciled primary. Default-off admission fence remains unchanged.

Migration0007 supplies scoped PK/FKs, recorded-assessment binding and database
transition/immutability checks. Order snapshot/confirmation and recorded assessment
cannot be rewritten. Runtime cannot edit configured customers, delete Sales facts
or alter audit. Existing migrations, dependencies and root script bodies are unchanged.
The migration content guard now lexes comments/quotes/dollar function bodies so
PL/pgSQL BEGIN is legal while external transaction control and aliases are rejected
before any client query. Raw checksums and per-file SQL/ledger atomicity remain.

## Consequences and boundaries

The existing Node host exposes bounded personal-session Sales command/order/assessment
routes. No frontend/browser workflow, amount-bearing quotation, reservation/shipment,
PURCHASE/MAKE/NOT_FEASIBLE orchestration, cancel/change/expiry, Finance-Lite, portal
writes or QC is delivered. No distributed infrastructure or new dependency.

Proof and actual contracts: [implementation record](../../12-implementation-planning/SLICE_STOCK_DEMAND_IMPLEMENTATION_STATUS.md)
and [review closure](../../12-implementation-planning/SLICE_STOCK_DEMAND_REVIEW.md).
