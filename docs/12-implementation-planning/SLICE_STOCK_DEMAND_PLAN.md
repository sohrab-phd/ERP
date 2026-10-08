---
id: PLAN-STOCK-DEMAND-001
title: SLICE-STOCK Sales demand and confirmation execution plan
status: accepted
last_reviewed: 2026-10-08
---

# Bounded Sales demand/confirmation increment

Baseline a7bf877a85ea9705a506695283c9d77f89a01608; authority [APR-022](../00-governance/approved-baselines/APR-022-sales-demand-scope.md).
Backlog capability 5 is delivered demand/confirmation -> reservation -> shipment.
This increment serves individually authenticated Sales staff registering factory
customer demand against warehouse stock. It depends on Identity, envelope, IPS
and accepted manual receipt; it does not replace any inventory writer.

## Binding scope and minimal contracts

Canonical direct order path is DraftSalesOrder -> SubmitSalesOrder -> ConfirmSalesOrder
([transition table](../03-state-machines-invariants/TRANSITION_TABLES.md)); no mandatory
quotation is specified for this path. DraftFulfillmentAssessment -> RecordFulfillmentStock
must precede confirmation. Assessment reads availability; confirmation creates no
REQUESTED/ACTIVE reservation, PO or Production Order. No person is hardcoded.

Sales owns configured Customer references, immutable order/customer/specification
snapshots and assessment evidence. Technical UUIDs are identities, not guessed factory
Order Codes. Existing customers are provisioned explicitly by the DB owner; operational
CRM/customer editing is not delivered. ACT-SALES has explicit per-customer UUID scope
in existing grants. The HTTP customer selector supplies no authority. Each command,
read and replay checks current individual grant and resource customer identity.

Five version-1 commands, target sales-order or fulfillment-assessment UUID:

- DraftSalesOrder: customerId and 1–8 items (item UUID, intake material type, bounded
  descriptive specification, positive whole-kg demandedKg string, explicit
  allowPartialShipment boolean). No count-to-kg conversion or price input.
- SubmitSalesOrder: empty payload, DRAFT -> SUBMITTED; no line editing shortcut.
- DraftFulfillmentAssessment: orderId, existing DRAFT or SUBMITTED order; new assessment UUID.
- RecordFulfillmentStock: selections of item UUID -> existing Unit UUIDs, each item
  once, globally unique Units, maximum 16 Units. Current Ledger-backed AVAILABLE
  kg must cover each item, matching material type. Store observed evidence/time.
- ConfirmSalesOrder: assessmentId; matching RECORDED STOCK assessment and current
  stock availability, SUBMITTED -> CONFIRMED with immutable server confirmation time.

All commands use the accepted durable envelope key/principal/payload/target binding,
empty preconditions and locked state guards. Same-key accepted/rejected outcomes replay;
new-key already-applied transitions reject DUP, conflicting document bindings CONFLICT.
Stock selection cannot validate unrecorded dimensions: descriptions are evidence, not an
invented automatic product-compatibility rule. Sales must select appropriate existing
Units. Current whole-kg operational precision is retained without adding money or UOM rules.

INV-014 is honored by the immutable customer/demand/specification snapshot. Monetary
terms are explicitly NOT_SUPPLIED, never zero/free. Pricing/tax/currency/rounding decisions
remain before monetary quotation/invoice behavior, not a blocker to this non-monetary
increment. Independent source review confirms this distinction.

## Persistence, boundaries and errors

SQL migration 0007_sales_demand.sql adds Sales-owned customer, sales_order and
fulfillment_assessment records. Runtime reads configured customers and writes only
orders/assessments. Owner port reads Inventory with sorted Unit locks and compares
Ledger totals, active claims and Balance projection. Only organization stock or matching
customer stock is visible; no Ledger/Balance/reservation mutation occurs.

Envelope transaction: identity current account/session -> Sales order -> assessment ->
sorted Inventory Unit locks -> state/evidence + durable outcome + audit, one client.
Business rejection rolls handler savepoint back before durable rejection/audit; technical
failure rolls whole bundle back. No monetary totals, live-master rewriting, customer
wildcards or guessed cross-customer grants. Confirmation records evidence, not allocation:
multiple orders may observe the same stock, and later reservation contention remains
separate under accepted priority rules. Queries disclose only the current customer scope.

HTTP /sales/commands accepts only these five commands and at most 4096-byte duplicate-safe
JSON, personal Bearer session and one required x-customer-id UUID. GET order/assessment
queries are scoped, bounded and safe-error; browser Origin is rejected as in current host.
No new dependencies, framework, frontend or scripts hidden behind changed root bodies.

## Exclusions

Inquiry/quotation conversion, monetary terms, reservation, shipment, order changes/cancel/
hold/expiry, PURCHASE/MAKE/NOT_FEASIBLE orchestration, Unfulfilled Demand, Finance-Lite,
Production, portal writes, QC, public customer management and UI framework. The next
increment is reservation; all later policy dependencies keep their live OQ classification.

## Delivery and Definition of Done

1. Implement bounded Sales owner, migration/adapters, Inventory read port and root/HTTP wiring.
2. Prove schema/transition/snapshot correctness, customer existence/isolation, no inventory
   effects, stock evidence, durable rejection/replay/conflict and post-lock current grant.
3. Real Windows PostgreSQL18.6: separate individuals for races, conflicting submissions,
   assessment/order binding, stale/unavailable stock, Ledger/projection corruption,
   rollback/audit failure and uncertain retry; migration restartability and least privileges.
4. Root frozen format/lint/boundaries/typecheck/build/unit/integration checks, dependency
   audit, local Graphify refresh and document/reference/JSON/diff validation.
5. Independent engineering/database/domain/test and security/API review; fix all required
   findings, document actual implementation/limits, coherent local commit, stop for Owner push.

No acceptance while required tests fail or evidence is unavailable. Test DBs are isolated;
no Linux/WSL, production reset, push, historical rewrite or native containment.
