---
id: PLAN-P4B-CAPABILITIES-001
title: P4b Sales existing capabilities and gap matrix
phase: 12-implementation-planning
status: in_review
version: 0.2.0
owners: [delivery-lead, sales-domain-owner, chief-solution-architect]
depends_on: [APR-049, APR-022, APR-025, TOOL-UIUX-001, PLAN-IMPLEMENTATION-BACKLOG-001]
last_reviewed: 2026-11-08
approval: null
---

# P4b Sales discovery evidence

**Current authority:** [APR-050](../00-governance/approved-baselines/APR-050-p4b-sales-ui-implementation-authorization.md) approves D1 B, D2 A, D3 A, D4 A, D5 A and conditional D6 A / D7 A. The proposal and OPEN wording below records the historical design baseline. Bounded implementation is now authorized; [current delivery evidence](P4B_IMPLEMENTATION_STATUS.md) records reality. Numeric performance and final acceptance remain Owner decisions.

**HISTORICAL DESIGN PROPOSAL — superseded only within APR-050 bounds**

The actual Owner directive of 2026-11-07 authorizes discovery, design, independent
reviews and one local documentation-only commit. Starting branch `main`, HEAD
`506dd000e87c331527445e8212656cfc2aefc756`, working tree clean. The tooling commit
is present; its verifier confirms version 2.15.0, source revision
`b7d5353e0130feb8c5574ef1251f8a1db1873ccb`, 75 files and 3,674,887 bytes.
P4a product revision `6c0fbbbed05eeb81ccf7564b2bbd7cfc7caebf10` remains accepted
under [APR-049](../00-governance/approved-baselines/APR-049-p4a-owner-acceptance.md).
No implementation authorization follows from this package.

Companion documents: [workflow/contracts](P4B_SALES_UI_WORKFLOW_AND_CONTRACT_DESIGN.md),
[OPEN decisions](P4B_IMPLEMENTATION_AUTHORIZATION_DECISIONS.md), and
[review/readiness](P4B_DESIGN_REVIEW_AND_READINESS.md).

## Evidence and classification

Source inspection, not a matching table/type name, establishes implementation.
Accepted records establish acceptance; tests cited here are inspected source and
historical evidence, not newly executed test results. Local Graphify was used for
navigation to SalesOrder/SalesService; source remains authority.

| Evidence | What it establishes |
| --- | --- |
| [APR-022](../00-governance/approved-baselines/APR-022-sales-demand-scope.md), [ADR-0017](../00-governance/adrs/ADR-0017-sales-demand-confirmation.md), [Sales delivery](SLICE_STOCK_DEMAND_IMPLEMENTATION_STATUS.md), [review](SLICE_STOCK_DEMAND_REVIEW.md) | Accepted nonmonetary customer-scoped demand, STOCK assessment and confirmation. [APR-023](../00-governance/approved-baselines/APR-023-reservation-increment-scope.md) records Owner confirmation of accepted/pushed Sales commit `280aa8b4918e05cf091daff4b7b06306b6f7ebc6`. |
| [APR-025](../00-governance/approved-baselines/APR-025-production-scope.md), [MAKE delivery](SLICE_MAKE_IMPLEMENTATION_STATUS.md), [APR-026](../00-governance/approved-baselines/APR-026-genealogy-trace-scope.md) | Accepted MAKE assessment extension and private production-release Sales transition; Owner confirmed MAKE revision `e5997f506c753bc73426128a88558d9c633e7f88`. |
| [Sales contracts](../../apps/backend/src/modules/sales/contracts.ts), [service](../../apps/backend/src/modules/sales/sales-service.ts), [store](../../apps/backend/src/infrastructure/postgresql/sales-store.ts) | Actual six commands, field limits, state guards, scoped persistence and UUID point reads. Inspect `contracts`, `parseSalesOrderInput`, `parseStockSelections`, `recordStock`, `recordMake`, `confirm`, `getOrder`, `getAssessment`. |
| [Sales HTTP](../../apps/backend/src/transport/sales-http.ts), [composition](../../apps/backend/src/composition-root.ts) | Six-command bearer surface, two point queries, resource/replay policy, command-only Inventory admission; `salesQuery` removes `binding` and `orderBinding`. |
| [0007](../../database/migrations/0007_sales_demand.sql), [0013](../../database/migrations/0013_sales_make.sql) | Customer references, immutable order/assessment snapshots, checked transitions and MAKE references. Schema existence alone does not establish a public read. |
| [Customer isolation](../06-security-rbac-audit/CUSTOMER_ISOLATION.md), [RBAC](../06-security-rbac-audit/ROLE_PERMISSION_MATRIX.md), [Identity](../../apps/backend/src/modules/identity/service.ts), [authorization](../../apps/backend/src/modules/identity/authorization.ts) | Current personal exact-customer grants; organizational invoice-evidence exception is separate. No wildcard Sales permission. |
| [Sales unit tests](../../apps/backend/tests/unit/sales.test.ts), [PostgreSQL tests](../../apps/backend/tests/integration/sales.test.ts), [HTTP tests](../../apps/backend/tests/integration/sales-http.test.ts) | Executable coverage for lifecycle, scoped reads/replay, revocation, stock drift, races, rollback and lost COMMIT recovery; not a fresh P4b run. |
| [P1](P1_IMPLEMENTATION_STATUS.md), [P2](P2_IMPLEMENTATION_STATUS.md), [P4a](P4A_IMPLEMENTATION_STATUS.md), [operator source](../../apps/backend/src/operator/app.ts) | Accepted native Persian operator shell and recovery/session patterns, not an existing Sales frontend. |

Classification vocabulary is intentionally exhaustive:

| Status | Meaning / current discovery result |
| --- | --- |
| IMPLEMENTED AND ACCEPTED | Actual code plus scoped accepted delivery/Owner evidence; rows below. |
| IMPLEMENTED BUT NOT ACCEPTED | No additional Sales capability positively identified in the inspected current source. This is not an assertion about every unrelated module. |
| DESIGNED ONLY | Architecture/catalogue operations or proposed contracts in this package with no implementing public surface. |
| PLANNED | Roadmap UI slices or future policy-dependent business branches. |
| NOT FOUND | No implementation/accepted callable contract found in targeted source, host, store and tests; a candidate name is not evidence of availability. |

## Actual data, lifecycle and invariants

Sales owns customer references, orders/items, assessments and MAKE references.
[Ownership matrix](../02-domain-business-architecture/MODULE_OWNERSHIP_MATRIX.md)
continues to control all writes. Customer provisioning is an explicit DB-owner
[configuration tool](../../tools/sales/provision-customer.mjs); application runtime
can read customer references, not maintain them. No customer CRM UI is delivered.

- Order fields: UUID, customer UUID and immutable customer-name snapshot, 1–8
  immutable items, `commercialTerms=NOT_SUPPLIED`, state, optional server
  `confirmedAt` and `confirmedAssessmentId`. Internal binding never leaves public
  transport. No human Order Code, price, currency, tax, discount, total or promised
  delivery date exists in this contract. Database `created_at` is not in the
  existing public order DTO.
- Each item has a unique UUID, type COIL/SHEET/ANGLE/BEAM/OTHER, description
  (valid nonblank text, no controls, at most 128 UTF-8 bytes), positive whole
  `demandedKg` text `[1-9][0-9]{0,19}`, and explicit `allowPartialShipment` boolean.
  There is no item-master/materialId or SKU relationship to invent. Broad type
  matching is not dimension/specification compatibility; a person selects
  suitable stock. Count/dimension-to-kg conversion is excluded.
- DRAFT → SUBMITTED → CONFIRMED is the Sales command path. Persisted DRAFT is
  immutable, not an editable shopping cart. CONFIRMED → IN_PRODUCTION occurs
  only through admitted Production release (`startMake`), not a Sales action.
  No implemented Sales cancellation, editing, hold, fulfillment or close command.
- Assessments are separately identified: DRAFT → RECORDED with mode STOCK or
  MAKE. More than one assessment can belong to an order. Draft/record allowed
  while order is DRAFT or SUBMITTED; confirm only SUBMITTED against an explicitly
  selected matching RECORDED assessment. Recorded evidence is immutable.
  Migration 0013 defaults the stored mode to STOCK even in DRAFT and the point
  store returns it; that default alone is not a recorded fulfillment choice.
- STOCK covers every line once with globally distinct maximum 16 Units, matching
  broad type, AVAILABLE state, positive exact kg and enough sum per line. Inventory
  validates Ledger, Balance and claims; record and confirmation reread under owner
  locks. MAKE needs no finished-stock selection and creates no Production Order.
- Inventory supports exact decimal strings up to 18 fractional places and magnitude
  below 10^20; SQL uses `numeric` plus scale/range checks, not a rounding typmod.
  This does not make Sales demand fractional. Confirmation neither reserves nor
  guarantees allocation. Multiple orders may confirm against the same stock.

## Traceable candidate workflow matrix

All proposed inclusions below are conditional on the [decision sheet](P4B_IMPLEMENTATION_AUTHORIZATION_DECISIONS.md).
The request/response abbreviations resolve to the exact designs in the companion.

| Workflow / purpose | Actor / isolation | Existing contract / source of truth | Request → response | Actions / error and recovery | Actual status / gap | Proposed P4b boundary |
| --- | --- | --- | --- | --- | --- | --- |
| Choose customer without UUID knowledge | Personal ACT-SALES, exact current grant in trusted installation/authority | Identity grants plus Sales-configured Customer; no current combined query | Proposed bounded granted-customer page → ID/current displayName | Select one customer; revoke/absence clears view, no unrestricted name search | Grant model IMPLEMENTED AND ACCEPTED; browser roster NOT FOUND | Include narrow roster under D2; no CRM/grant administration |
| View/find orders without UUID | Same single selected customer, SQL scope before pagination | Sales owner store; only exact GetSalesOrder exists | Proposed state/type filters + cursor → bounded summaries | Open/refresh; empty has no global counts, invalid cursor restarts | Point read IMPLEMENTED AND ACCEPTED; discovery NOT FOUND | Include D3 list; no invented business code, fuzzy search or totals |
| View exact order/items | Same selected customer; foreign/missing indistinguishable | GetSalesOrder / sales_order snapshot | UUID → existing public order fields | Read-only; refresh on stale state; hidden/missing generic unavailable | IMPLEMENTED AND ACCEPTED on bearer; browser wrapper NOT FOUND | Include wrapper with fresh disclosure check; existing snapshot truth retained |
| Draft an order | Same; payload customer must equal selected grant | DraftSalesOrder v1 / immutable Sales snapshot | customerId + items → durable order ID/state | Local edit before save only; same-key unknown retry, new-key DUP/CONFLICT | IMPLEMENTED AND ACCEPTED; browser command transport/recovery absent | Recommended D1 operational option; label save as immutable |
| Submit draft | Same exact customer/order | SubmitSalesOrder v1 | existing target + {} → SUBMITTED | Only DRAFT; STATE/DUP read canonical state; no optimistic transition | IMPLEMENTED AND ACCEPTED | Recommended operational option |
| Discover/view assessments | Same selected customer/order | GetFulfillmentAssessment only / immutable assessment facts | Proposed by-order page; exact UUID detail → state/mode/evidence/time | Explicit choice, no assumed latest/singleton; foreign errors nondisclosing | Point read IMPLEMENTED AND ACCEPTED; by-order discovery NOT FOUND | Include D3 listing and wrapper |
| Record STOCK assessment | Same; organization or same-customer eligible stock only | DraftFulfillmentAssessment + RecordFulfillmentStock / Sales evidence + Inventory owner read | orderId then line/Unit selections → RECORDED/observedAt | Every line once, ≤16 Units; refresh/choose new assessment after immutable failure/success | Commands IMPLEMENTED AND ACCEPTED; preselection discovery NOT FOUND | Conditional D4 narrow Sales stock projection; no WH endpoint reuse |
| Record MAKE assessment | Same customer/order | DraftFulfillmentAssessment + RecordFulfillmentMake | orderId then {} → RECORDED MAKE | Explicit mode; no auto production; recorded cannot switch mode | IMPLEMENTED AND ACCEPTED in MAKE extension | Recommended operational option; no P5 implementation |
| Confirm demand | Same customer/order and its selected assessment | ConfirmSalesOrder v1 / Sales plus fresh Inventory evidence for STOCK | assessmentId → CONFIRMED/server time | SUBMITTED only; stock change rejects; same-key replay for uncertainty | IMPLEMENTED AND ACCEPTED | Recommended operational option; allocation warning always visible |
| Edit/delete/cancel/hold/close existing order | No new actor assumption | Broader [command catalogue](../05-application-api-architecture/COMMAND_CATALOGUE.md) is architecture, not active service | No current accepted command | No buttons or generic update endpoint; local discard never cancels saved order | Cancel/hold/change/closure DESIGNED ONLY; callable implementation NOT FOUND | Exclude; separate policy/slice |
| View stock or allocation totals | No broad Sales inventory authority | Command-only InventorySalesPort, no generic browse; P4a ACT-WH exception separate | Proposed item-scoped candidate page only | Observed eligible kg, never promise sale/reservation; drift fails closed | Internal port IMPLEMENTED AND ACCEPTED; public Sales stock browse NOT FOUND | D4 narrow candidate selection only; exclude broad quantities/dashboard |
| Reservation request/activation/status | Exact Sales customer, or separate accepted WH activation | [Accepted reservation](SLICE_STOCK_RESERVATION_IMPLEMENTATION_STATUS.md), Inventory owner, GET by reservation UUID | Existing request/activation/point data | REQUESTED is no allocation; ACTIVE claim exclusive; no steal/TTL | Backend IMPLEMENTED AND ACCEPTED; P4c UI PLANNED; by-order status query NOT FOUND | Exclude mutations and aggregates; D5 records deferral |
| Shipping/package status/actions | ACT-SHIP customer scope, not implied Sales permission | [Accepted shipping](SLICE_STOCK_SHIPMENT_IMPLEMENTATION_STATUS.md), Shipping/IPS | ACT-SHIP point reads and commands, no Sales status aggregate | Dispatch consumes reservation/posts exit, not delivery/closure | Backend IMPLEMENTED AND ACCEPTED; P4d UI PLANNED; Sales-safe aggregate NOT FOUND | Exclude; no unauthorized link fetching Shipping |
| Production progress / related navigation | ACT-PLAN/OP scope governs owner queries | [Accepted MAKE](SLICE_MAKE_IMPLEMENTATION_STATUS.md), Production owner | Sales state IN_PRODUCTION only; no public Sales production reference list | Show recorded Sales state without claiming completion; owner actions separate | Backend IMPLEMENTED AND ACCEPTED; P5 UI PLANNED | Exclude production drill-through/progress; only order↔assessment links |
| Pricing/quotation/inquiry/unfulfilled demand/finance/customer maintenance | Separate commercial policy and authority | Architecture catalogue/factory evidence; some documentary finance evidence accepted in separate scope | No amounts/pricing fields in accepted Sales order | NOT_SUPPLIED must not render as zero/free/paid | Broader Sales workflows DESIGNED ONLY / PLANNED; relevant UI NOT FOUND | Exclude monetary workflow and CRM, including APR-028 organizational exception |

## Cross-module and architectural gaps

Browser extension is necessary even for read-only P4b: [browser adapter](../../apps/backend/src/transport/browser-http.ts)
has no Sales allowlist and [browser session](../../apps/backend/src/transport/browser-session.ts)
projects only organizational PROC/WH grants. Existing [intent](../../apps/backend/src/operator/intent.ts)
is likewise PROC/WH-only. Legacy Sales rejects Origin and expects bearer plus
exactly one `x-customer-id`. No arbitrary proxy or cookie-to-bearer workaround is
acceptable. A new bounded adapter/projection is a proposed transport change, not
an assertion that existing routes already work in a browser.

Missing customer/order/assessment discovery needs Sales-owned read ports and
bounded DTOs. Existing Sales queries authorize inside their transaction and omit
internal bindings; fresh post-snapshot authorization before browser disclosure
is additional proposed work. Candidate stock needs an Inventory-owned read
capability and an explicit disclosure decision, not the locking command availability
port repurposed for a list. [Query catalogue](../05-application-api-architecture/QUERY_CATALOGUE.md)
names alone do not supply these implementations.

Roster also needs a bounded Identity-owned authenticated-session/current-grant
projection: existing `Identity.context` without a customer requires an org grant,
which the proposed ordinary Sales roster must not require. Bootstrap should expose
only a current Sales-capability marker, not all customer grants. Per-customer
post-snapshot roster reauthorization is a new explicit requirement, not existing
Sales point-read behavior. These are D2 gaps, not new policy silently adopted here.

No migration is required by this design task. Later access-path evidence may
justify an index-only migration under D6; no schema/business-number/master-data
extension is assumed. Historical OQ-001, OQ-014 and OQ-019 remain at their recorded
statuses in the [live register](../00-governance/registers/OPEN_QUESTIONS.md).
No real employee/customer mapping, price policy, stocking promise or business
numbering is invented. P4a's migration-wide writer-cost deployment gate remains open.
