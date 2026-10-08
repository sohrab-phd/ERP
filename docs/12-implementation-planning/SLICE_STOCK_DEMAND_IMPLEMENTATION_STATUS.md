---
id: IMPL-STOCK-DEMAND-001
title: Sales demand and confirmation implementation status
status: accepted
last_reviewed: 2026-10-08
---

# SLICE-STOCK Sales demand/confirmation

Baseline: accepted/pushed receipt a7bf877a85ea9705a506695283c9d77f89a01608.
Scope [APR-022](../00-governance/approved-baselines/APR-022-sales-demand-scope.md);
engineering mechanism [ADR-0017](../00-governance/adrs/ADR-0017-sales-demand-confirmation.md);
[plan/DoD](SLICE_STOCK_DEMAND_PLAN.md). Architecture/pins are unchanged.
Local implementation commit is reported by the delivery message; this page does
not self-reference its own commit hash. Stop for Owner review/push after acceptance.

## Delivered owner and workflow

Sales owns configured customer references, immutable demand snapshots, draft/submitted/
confirmed orders and draft/recorded STOCK assessment evidence. Current individual
ACT-SALES grants are explicit per customer UUID; backend reads, commands and replay
check current access. No shared operator/person mapping or QC role is introduced.

Direct workflow:

1. Configure an existing Customer reference with the owner tool and grant the individual
   ACT-SALES customer scope via the existing Identity administration path.
2. DraftSalesOrder snapshots customer name and 1–8 items: UUID, COIL/SHEET/ANGLE/BEAM/OTHER,
   descriptive specification, positive whole demandedKg string below 10^20 and explicit
   allowPartialShipment boolean. Commercial terms remain NOT_SUPPLIED, not zero/free.
3. SubmitSalesOrder moves DRAFT -> SUBMITTED.
4. DraftFulfillmentAssessment binds existing DRAFT/SUBMITTED demand to a new assessment
   UUID. RecordFulfillmentStock selects every line once, globally unique Unit UUIDs
   (maximum16), reads current Inventory and stores exact stock evidence/time.
5. ConfirmSalesOrder requires SUBMITTED order + its own RECORDED matching assessment,
   rechecks selected availability and stores immutable server confirmation timestamp.

Matching type and sufficient kg are checked; descriptive dimensions are not an invented
product-compatibility engine. Sales selects appropriate stock. The Inventory owner port
reads organization or exact customer stock, sorted-locks Units, derives Ledger totals
and verifies Balance/active claims; only AVAILABLE stock can support this increment.
Sales never writes Ledger/Balance/reservations. A confirmation does not promise allocation:
separate orders can observe the same available stock before later reservation contention.

## Public backend contracts

All five commands use standard envelope v1, lowercase UUID-v4 key, UUID target and
empty preconditions. Target kinds: sales-order for Draft/Submit/Confirm;
fulfillment-assessment for DraftAssessment/RecordStock. Draft input is customerId/items;
Submit empty; DraftAssessment orderId; RecordStock selections [{itemId,unitIds}];
Confirm assessmentId. Stable UUIDs are not guessed business numbering. Missing/foreign
objects are nondisclosing; illegal state/state binding rejects STATE/ACTOR as applicable,
insufficient/mismatched stock rejects INVARIANT, identical new-key facts DUP,
changed bindings/selections CONFLICT. Technical integrity/connection errors are not
cached as business rejections. Accepted and rejected first outcomes are durable.

- POST /sales/commands — only the five commands above.
- GET /sales/orders/{UUID} — GetSalesOrder in current customer scope.
- GET /sales/assessments/{UUID} — GetFulfillmentAssessment in current customer scope.

One personal Bearer token and one x-customer-id UUID are required; the selector must
match an actual grant. No x-erp-role override/wildcard. At most4096-byte duplicate-safe
JSON, bounded16 active handler calls, existing request timeouts, no browser Origin,
safe errors/no-store/nosniff. Queries omit internal binding fields and foreign objects.
Same individual with grants for two customers cannot replay an accepted foreign result
by switching the selector. Revoked grants cannot use a previously cached context.

## Physical implementation and database

- apps/backend/src/modules/sales: contracts, SalesService and public index.
- infrastructure/postgresql/sales-store.ts: parameterized, installation/authority/customer
  scoped owner adapter on the supplied opaque transaction.
- inventory public availability read capability; existing post/snapshot/rebuild restrictions
  remain unchanged. Only RecordFulfillmentStock/ConfirmSalesOrder use it in composition.
- transport/sales-http.ts and existing host/composition, no new framework.
- migration0007: sales.customer, sales.sales_order, sales.fulfillment_assessment;
  scoped keys/FKs, immutable JSON snapshots, checked transitions/confirmation evidence.
- tools/sales/provision-customer.mjs: explicit compatible DB-owner configuration only;
  acknowledged installation/authority/customer UUIDs and bounded protected stdin JSON
  {"displayName":"..."}. Existing conflicting configuration is refused, not overwritten.
  Owner/time provenance is stored; individual grants remain a separate administration action.

Build first, set INSTALLATION_ID/MIGRATION_DATABASE_URL without printing secrets, then
invoke node tools/sales/provision-customer.mjs --installation-ack <UUID> --authority-scope
<UUID> --customer-id <UUID> with the JSON on protected stdin. It uses no network except
the configured PostgreSQL connection; no seeded factory/customer names or source export.
Application runtime needs USAGE sales; SELECT sales.customer; SELECT/INSERT/UPDATE
sales.sales_order and sales.fulfillment_assessment, no DELETE/DDL/customer write.
Kernel/Identity/Inventory/Procurement grants remain the accepted existing model.

## Transaction and retry evidence

Envelope key/current Identity account/session -> order -> assessment -> sorted Units.
READ COMMITTED fresh reads after owner lock, one client through all effects/audit/outcome.
DUP/CONFLICT do not mutate old facts; business rejection restores handler savepoint;
technical/audit failure rolls whole transaction back. Same-key retry recovers confirmed
committed results after response loss. Ledger/Balance drift prevents confirmation evidence.
Audit families remain AUD-CMD-ACCEPTED/REJECTED/REPLAYED. No auto-reservation/stock posting.

## Validation (2026-10-08)

Focused fresh real Windows PostgreSQL18.6/API run:25 tests PASS, zero failures/skips.
Includes23 Sales tests and2 composed-host/customer-tool tests: actual state progression,
customer snapshots and scope, multi-line/multi-Unit summation, two confirmed demands
observing the same unreserved stock, current grant revoke, different-person owner-state
and same-key races, stale/reserved/foreign/insufficient stock, Balance corruption,
durable accepted/rejected replay and binding conflicts, foreign UUID collisions,
audit rollback, lost COMMIT response and raw SQL immutability/least privileges.

Full frozen npm run verify PASS: preflight Node24.21.0/npm11.19.0,
formatting, lint, import/SQL owner boundaries, TypeScript6.0.3 build and91 unit
plus118 real PostgreSQL integration tests; zero failures/skips. Explicit npm run
build PASS. Final affected lexer regression suite2/2 PASS after CR/alias fixes;
format/lint checks PASS. Registry metadata-only npm audit reports0 known vulnerabilities.
Original package versions/15 root script bodies and migrations0001–0006 are unchanged.
The native test runtime was restored from checksum-verified cached assets after
TEMP support files disappeared; final proof used ignored workspace-isolated runtime,
PostgreSQL180006/UTF8 and separate restricted runtime/DDL-owner roles/databases.
No source/documents were exported; no operating-system ACL/service/containment changes.
Independent engineering/security findings and closure: [review](SLICE_STOCK_DEMAND_REVIEW.md).
No historical/mock proof is substituted for required PostgreSQL execution.

## Limits and next increment

No amount-bearing quotation, inquiry conversion, public CRM/customer management,
reservation/activation, shipment, order change/cancel/hold/expiry, PO/production creation,
NOT_FEASIBLE/Unfulfilled Demand, Finance-Lite, portal writes, QC, UI or deployment.
Customer roster, grants and human Order Code remain actual later/operator inputs;
commercial prices/tax/currency/rounding remain before affected monetary behavior.
Current policy does not authorize a tolerance, shipment authority or inventory conversion.
Next accepted backlog increment is reservation; do not begin it before Owner review/push.
Windows database CI remains an operational automation follow-up; required DB proof here
is real local isolated testing, not mocks/skips. TLS/browser/deployment requirements are
addressed at their actual hosting/UI/integration stage.

### Final repository evidence

Staged documentation consistency:12 changed Markdown pages,842 local references and
13 JSON files PASS. Canonical business/OQ register text remains unchanged; gate/local
unlock match APR-022, original architecture baseline remains APR-018 and no temporary
runtime, secret, database or graph artifact is staged. git diff --check PASS.

Local-only Graphify0.9.79 refresh:410 tracked files,3625 nodes,6552 edges; SalesService
and InventoryPostingService navigation finds composition and test links.14 files have
no extracted symbols; source remains authority. Import/SQL ownership check:77 TS files PASS.
New migration raw staged/workspace LF bytes match SHA-256
78207c5da6d36397c3ef113fb45055e086a2253ed1b06ba958cc105b510f3c59.
Prior6 migrations and all15 root script bodies/package pins match the accepted baseline.
