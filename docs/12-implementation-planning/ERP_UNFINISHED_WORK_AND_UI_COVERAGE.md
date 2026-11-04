---
id: PLAN-ERP-UNFINISHED-001
title: Verified unfinished-work register and backend-to-UI coverage
phase: 12-implementation-planning
status: in_review
version: 1.0.0
owners: [delivery-lead, chief-solution-architect]
depends_on: [APR-046, APR-045, APR-043, PLAN-IMPLEMENTATION-BACKLOG-001, IMPL-P2-REMEDIATION-001]
last_reviewed: 2026-11-04
approval: null
---

# ERP unfinished work and operator UI coverage — 2026-11-04

## Verified current state and evidence limits

Read-only implementation inventory after local P2 remediation commit
`8554a1e6958cc0d9e2529f7994c9babcdd7ec6bd`, parent
`4e608693cae9fc45d37506728909f6e2862ca13b`. Verified branch `main`, clean tracked
tree before assessment documentation; local branch ahead of cached origin/main
by one remediation commit then. No remote fetch/push or hosted CI query occurred;
cached tracking is not proof of current remote state. The subsequent assessment
commit changes documentation only. No additional product implementation occurred.

**Thirteen bounded backend capabilities remain ACCEPTED.** P1 is ACCEPTED under
[APR-045](../00-governance/approved-baselines/APR-045-p1-owner-acceptance.md), exact
implementation `22b5389af4d88cff38afdac1bebad68badd06f9c`; it is a frontend
increment, not backend capability14. I2 is ACCEPTED under
[APR-043](../00-governance/approved-baselines/APR-043-i2-backend-acceptance.md), exact
implementation `b585fd795fb0276bc936af254c6d56fd7e3bcbe8`.

P2 implementation at4e60869 failed its 2026-10-27 independent audit with two
medium/REQUIRED findings. Both corrections are delivered at8554a1e with
[fresh test/browser/SQL evidence](P2_REMEDIATION_REPORT.md), but P2 remains
**IMPLEMENTED_AWAITING_ACCEPTANCE / `in_review`**. Formal independent follow-up
PASS and explicit Owner acceptance are outstanding. P3 is NOT_IMPLEMENTED and
NOT AUTHORIZED; no factory pilot, production deployment or real-data migration
is established. Highest recorded APR is046; no subsequent APR baseline found.

This inventory inspected source, command/query registration, browser and legacy
routes, migrations0001–0018, assertions, accepted delivery reports, governance,
requirements/clarifications, OQs and CI. Local Graphify0.9.79 was rebuilt at8554a1e
with network-blocked structural indexing; source resolves ambiguous graph edges.
Two read-only specialist inventory subagents cross-checked commercial/stock and
production/genealogy/foundation surfaces. This is an engineering assessment, not
a formal independent acceptance audit or a claim that every ERP behavior was run.

Freshly executed: **227unit/component and110real-PG tests, zero failed/skipped**,
actual Chromium receiving journey, static/build/import checks and advisory audit.
These prove the tested P2 regression scope; unrun domain suites retain historical
acceptance evidence. Hosted CI is PENDING/NOT_VERIFIED. No percentages are used.

Statuses below apply to the named bounded capability or gap, never an entire
vision: ACCEPTED; IMPLEMENTED_AWAITING_ACCEPTANCE; PARTIAL; NOT_IMPLEMENTED;
BLOCKED_BY_POLICY; DEFERRED; NOT_VERIFIED. A negative source search proves only
repository absence, not the absence of an externally managed factory system.

## Authority and conflict reconciliation

Priority used: applicable explicit Owner/accepted governance -> approved factory
requirements/clarifications -> executable contracts/verified behavior -> current
backlog/roadmap -> older proposals. Source code establishes what exists, not new
business authority. The current directive permits the two P2 fixes and this
assessment only. [Current phase](../00-governance/CURRENT_PHASE.md) controls the gate.

| Conflicting or historical statement | Authoritative resolution and implementation consequence |
| --- | --- |
| Older architecture/report proposes .NET, React, NestJS/Prisma, Socket.IO or infrastructure | Accepted Node.js/TypeScript modular monolith, PostgreSQL and [ADR-0013](../00-governance/adrs/ADR-0013-slice-envelope-stack.md), frozen manifests, native node:http/direct pg and P1/P2 native DOM are current. The original report itself marks .NET superseded. Missing proposed framework/ORM is not a defect or migration authorization. |
| Historical current-state assessment says there is no browser UI; P1 status has a pre-APR-046 P2-closed sentence | APR-045 accepts P1; APR-046 authorizes P2 and actual routes/assets exist. Currentphase and this snapshot supersede old time-bounded statements. P2 is implemented/in_review, not accepted. |
| Backlog/inbound-roadmap header says only APR-043 acceptance documentation is authorized | Later APR-044/045/046 and the actual2026-11-04 Owner directive apply. Only remediation and inventory are now authorized; the old header cannot authorize or prohibit a later valid bounded instruction. |
| OQ/early I2 decision text still calls B02–B09/D10 unresolved | SRC-007 plus APR-040/041/042/043 resolve the applicable I2 decisions and accept delivery. Do not reopen WH changed-W1/exception authority, multi-PO header grain, optional fields or PROC visibility. Global OQ-011/019 residuals for devices/real people remain. No blanket OQ closure is inferred. |
| APR-021-era legacy receipt says Internal Code nonunique | SRC-007-B02 and accepted I2/0018 intentionally add exact physical-code claims across new/legacy paths. New duplicate physical codes reject; immutable legacy evidence and old replay remain. No backfill or history rewrite is authorized. |
| Early prompt/question wording allows shared Station accounts, QC, several official stock quantities or numeric Scrap cutoffs | Factory C-01/C-03/C-04/C-05 and live OQs establish kg authority, personal identities, operational Stations, no QC MVP and human Residual/Scrap disposition. Accepted APR-025 completion requires exact mass balance, not invented loss/tolerance. |
| Architecture names closure, cancellation, reservation release, corrections or OpeningStockImport | A named logical home is not executable implementation or current authorization. Applicable accepted slice exclusions and unresolved branch policies control; see register below. |
| Dispatch/invoice/payment could be read as completion of all Sales | Current dispatch ends DISPATCHED; Sales close rule is fulfilled/cancelled/authorized-unfulfilled demand, independent of payment. Missing closure implementation is future scope, not an accepted shipment defect. |
| Old technical/QA/cutover pages show implementation=false or all routing/mass-balance decisions open | Those are earlier snapshots. Accepted foundation/domain APRs and bounded runtime behavior apply. Remaining stop/cancel/rework, conversion, real cutover and operation-specific questions remain open only where actually needed. |

Primary external sources were text-extracted locally from DOCX XML (no originals
modified, no layout assessment): architecture report7441paragraphs and prompt1589;
the available question pack282 and clarification91. Targeted passages and both
factory question/clarification texts were inspected alongside canonical SRC/OQs.
This is not a claim to have re-reviewed every paragraph of the long report.

| Original available source | Location / SHA256 |
| --- | --- |
| گزارش معماری و طراحی تفصیلی.docx | `D:/projects/NavardKaran/Docs/` — BF41115CB0B538DF164D2FFE602D044F17625BC652D03423AF3F614EB9CE306E |
| پرامپت جامع نسخه ۲ (1).docx | `D:/projects/NavardKaran/Prompts/` — 9493831D2FEEA3ED053F0664E2296277F70569277793B5E399B769B9106151C6 |
| بسته پرسش (1).docx | `D:/projects/NavardKaran/Docs/` — C1F106C35779B147020163CBA889AC95F6F1F2C815310756A00596758A1ED247; exact requested `(1)(1)` filename was not present in the named source directories; this available variant was inspected, not asserted byte-equivalent |
| بسته پرسش شفاف‌سازی شماره ۲.docx | `D:/projects/NavardKaran/Docs/` — 512E3D2B2EA078D88E0E678499B8E8DDF58518C3786FF395AE93561E7F5B9738 |

[Source register](../00-governance/SOURCE_REGISTER.md),
[SRC-004](../00-governance/team-answers/FACTORY_PURCHASE_RECEIVING_2026-10-20.md),
[SRC-005](../00-governance/team-answers/OWNER_I1_POLICY_CLARIFICATION_2026-10-20.md),
[SRC-006](../00-governance/team-answers/OWNER_R1_ORDER_REFERENCE_DECISION_2026-10-21.md)
and [SRC-007](../00-governance/team-answers/OWNER_I2_RECEIVING_DECISIONS_2026-10-24.md)
establish the later scoped facts. The [ownership matrix](../02-domain-business-architecture/MODULE_OWNERSHIP_MATRIX.md)
and [dependency rules](../09-repository-documentation/DEPENDENCY_AND_IMPORT_RULES.md)
remain binding: source owners call published owner ports; PostgreSQL is canonical;
ACT-IPS alone posts stock; Balance and genealogy are projections.

## Backend-to-UI coverage matrix

All13 rows below have ACCEPTED backend status **within their published bounded
scope**, not full module completion. API paths are legacy bearer routes unless
explicitly prefixed `/ui-api`. Existing browser page is `/` with native sections,
not a separate router/framework. The exact [browser allowlist](../../apps/backend/src/transport/browser-http.ts)
contains only identity login/logout/session, I1 orders/catalogues and I2 queries/
confirmation. Other legacy handlers reject browser Origin; a hidden button or
existing bearer API does not make another capability browser-ready.

Source/test references are repository-relative. `unit/` and `integration/` in the
coverage column mean `apps/backend/tests/unit/` and `apps/backend/tests/integration/`.
Tests listed as available are source-inspected, not newly executed unless marked.
UIs marked NOT_IMPLEMENTED need new bounded Owner authorization after the P2/P3
gates, including exact browser admission and missing essential reads if any.

| # / accepted backend and authority | Current executable boundary / owner source | UI status, existing browser routes, role | Missing journey / dependencies | Test source available / next priority |
| --- | --- | --- | --- | --- |
| 1 / Command envelope foundation; APR-018, acceptance carried by APR-020 | `executeCommand/executeQuery`, durable bound outcomes/replay, current access, audit+business transaction; shared-kernel `src/envelope/{execute,query}.ts`, PostgreSQL transaction/outcome/audit adapters;0001–0003. Recovery admission fenced by default. | ACCEPTED, indirectly used by P1/P2. Generic factory command screen is not required. Native `/health/live`, `/health/ready` are operational probes, not business UI. | No approved missing generic UI; restore/admission operating procedure is E03. Dependencies: PG/Identity and owner services. | Shared-kernel unit execute/binding/admission; integration transaction/outcome-concurrency/replay-audit/crash-retry/migration/permissions. Preserve as foundation. |
| 2 / Identity and authorization; APR-019; acceptance APR-020 | `modules/identity/{service,contracts,authorization,password}.ts`; `identity-http.ts`: login/session/logout/password, account create/query, grants, disable/revoke;0004, disposition flag0014. | PARTIAL UI: ACCEPTED personal login/logout/session at `/` through `/ui-api/identity/{login,logout,session}`. All personal roles authenticate; current app supports PROC/WH navigation. ACT-SEC admin UI and authenticated self-service password-change UI NOT_IMPLEMENTED (no admin-reset contract); native `/identity/{accounts,account-query,grants,disable,revoke,password}` are not browser-admitted. | Role-appropriate account/grant/password administration and real personnel mapping; preserve last-steward/current-session safeguards. No shared Station identity or SSO/password-recovery invention. | unit/integration identity; browser-http/operator-lifecycle/config. Login regression freshly covered by unit/PG/browser; full Identity PG not rerun. Admin UI later, genuine factory need determines priority. |
| 3 / IPS Inventory kernel; APR-020; acceptance APR-021 | `modules/inventory/{posting-service,contracts,quantity}.ts`, inventory-store.ts; internal `post` STOCK_IN/STOCK_OUT/RESERVE/RELEASE, availability/snapshot and restricted rebuild;0005. Ledger truth, Balance projection, ACT-IPS sole executor. | No general stock-writer UI is required or allowed. Operator stock view NOT_IMPLEMENTED. Canonical per-receiving Inventory IDs are visible in P2; these are not a general availability browser. | WH keyed unit/Lot reads come from row4; Sales availability exists through owner port/assessment. General browse/search/eligible Unit discovery and direct SALES stock-read authorization are separate read gaps, not accepted kernel defects. | unit inventory-quantity/boundaries/availability/production; integration inventory freshly executed within110. Proposed P4a, narrowly authorize needed read surface first. |
| 4 / Legacy manual receipt and keyed inventory visibility; APR-021; acceptance APR-022 | `PostGoodsReceipt` v1; receipt-service.ts, Inventory receipt.ts and receipt-http.ts; POST `/receipts/post`, GET `/receipts/{id}`, `/inventory/units/{id}`, `/inventory/lots/{id}` -> GetGoodsReceipt/GetInventoryUnit/GetLot;0006. No mandatory PO/ticket; later0018 duplicate-code guard intentional. | NOT_IMPLEMENTED browser UI/routes. Personal org ACT-WH posts; current org WH/SEC reads subject to allocation/customer protection. P2 supports accepted I2 UNLINKED intake, but does not expose this distinct legacy contract. | First establish actual need for legacy form versus I2; standalone keyed stock/Lot lookup useful for investigation. Inventory+Identity/source-code policy dependencies; no location-master/search API assumed. | unit receipt; integration receipt/receipt-http; later receiving/receiving-integrity compatibility freshly covered. Prioritize stock view in P4a; duplicate intake UI only if real need and separately authorized. |
| 5 / Sales demand/fulfillment assessment; APR-022, MAKE extension APR-025; acceptance APR-023 | `sales-service.ts`, sales/contracts.ts, sales-http.ts. Six commands: DraftSalesOrder, SubmitSalesOrder, DraftFulfillmentAssessment, RecordFulfillmentStock, RecordFulfillmentMake, ConfirmSalesOrder. POST `/sales/commands`; GET `/sales/{orders,assessments}/{id}`;0007/0013. | NOT_IMPLEMENTED UI and no browser routes. Exact customer-scoped ACT-SALES. Confirming is not reserving; MAKE intent does not auto-start production. | Draft→submit→assess STOCK/MAKE→confirm with customer and eligible Unit selection/readback. `tools/sales/provision-customer.mjs` exists, but no general customer/order/discovery browser. Obtain essential read scope if needed. | unit sales (including accepted MAKE extension); integration sales/sales-http plus production cross-owner tests. Unit freshly executed; Sales PG source/historical evidence only. P4b. |
| 6 / Reservation request/activation; APR-023; acceptance APR-024 | `inventory/reservation.ts`, inventory-reservation-store.ts, reservation-http.ts. RequestReservation `{orderId,itemId,unitId,kg}`, ActivateReservation `{}`; POST `/reservations/commands`; GET `/reservations/{id}`;0008/0009. REQUESTED has no stock effect; activation calls IPS, dispatch consumes. | NOT_IMPLEMENTED UI/browser routes. Customer ACT-SALES request/activate/read; org ACT-WH may activate exact target without commercial-query grant. | Explicit stock reservation with readable current state and competition; requires confirmed STOCK demand/selection and Inventory. WH query/discovery need must not be bypassed by broader Sales access. General release/TTL is excluded. | unit reservation; integration reservation/reservation-http and shipping boundaries. Available historical PG tests prove priority/no-steal/replay. P4c, after usable demand/stock context. |
| 7 / Reserved-stock packaging/shipping; APR-024; acceptance APR-025 | shipping-service/contracts, Inventory shipping.ts, shipping-http.ts. DraftPackage, PackPackage, UnpackPackage, AssignPackageToShipment; DraftShipment, MarkShipmentReady, StartLoading, DispatchShipment. POST `/shipping/commands`; keyed GET `/shipping/{packages,shipments}/{id}`;0009–0010. | NOT_IMPLEMENTED UI/browser routes. Exact customer ACT-SHIP. Whole ACTIVE-reserved Units; dispatch atomically consumes reservation and posts stock exit. DISPATCHED is not delivery proof or Sales closure. | Reservation→package→shipment prepare/load/dispatch/canonical recovery. Customer/demand/reservation object discovery may need scoped reads; no financial prerequisite invented. | unit shipping; integration shipping/shipping-http/shipping-boundaries, races/real failure windows/replay. Unit freshly run, Shipping PG not rerun for P2. P4d (split packaging and dispatch if needed). |
| 8 / Production MAKE, allocations, station work and atomic completion; APR-025; acceptance APR-026 | production-service/contracts/lineage, Inventory production.ts and owner stores;0011–0014. POST `/production/commands`; GET `/production/{orders,operations,allocations}/{id}`. Commands enumerated below. | NOT_IMPLEMENTED UI/browser routes. Customer ACT-PLAN planning/allocation/referral; ACT-OP personal execution; CompleteProductionOrder supports OP/PLAN. Completion leftovers require same-account/customer explicit PLAN productionDisposition. | PLAN route/release/material-allocation assignment→personal OP execution/completion→manager referral/readback. Exact customer grants and work discovery; routes use Station enum names plus operation UUIDs, with1–16steps among ten Station names. No personnel-assignment command/field or shared station identity exists. Normal exact mass-balance policy is already resolved. | unit production/inventory-production; integration production/allocation/concurrency/recovery/security/integrity. Unit freshly executed; full Production PG remains historical. P5a then P5b. |
| 9 / Genealogy projection/trace; APR-026; acceptance APR-027 | genealogy/contracts/projection; genealogy-http.ts; owner ports supply one REPEATABLE READ READ ONLY source snapshot. GET `/genealogy/{forward\|backward}/{root}/{id}` for unit/lot/receipt/package/shipment/fact/operation/order/batch/sales_order. No genealogy truth table/migration. | NOT_IMPLEMENTED UI/browser routes. Exact customer ACT-WH/SALES/SEC; not general organizational/customer-portal authority. P2 receiving IDs are not a trace journey. | Source-backed forward/backward navigation, limits and exact customer isolation alongside material/order journey. I2 RECEIVING_UNIT is internal source support; existing public unit/Lot roots remain intentional. No missing public receiving_unit route defect established. | unit genealogy/genealogy-http; integration genealogy/genealogy-security/transaction; receiving source tests freshly within110. Live projection needs no materialized-cache rebuild UI. P5c. |
| 10 / Completed-purchase/sent-proforma evidence; APR-027; acceptance APR-028 | purchase-service/purchase-contracts.ts, purchase-http.ts; RecordCompletedPurchase / RecordPurchaseProformaSent; POST `/purchasing/{purchases,proformas}`, matching keyed GET;0015. Immutable existing document/sent-evidence references, not message delivery or stock. | NOT_IMPLEMENTED UI/browser routes. Org ACT-PROC. P1 operational PO register is a different capability. | One documentary record then optional linked sent-proforma/readback. No supplier master, approval workflow, amounts or mandatory receiving linkage. Identity/envelope only. | unit purchase; integration purchase/purchase-http, immutable SQL/current-role/rollback/recovery. Only unit freshly run here. Smaller later PROC evidence increment. |
| 11 / Issued-invoice documentary evidence; APR-028; acceptance APR-029 | invoice-evidence-service/contracts.ts, invoice-evidence-http.ts; RecordIssuedInvoiceEvidence/GetIssuedInvoiceEvidence; POST `/finance/invoice-evidence`, keyed GET;0016. Existing order/customer checked through Sales port. | NOT_IMPLEMENTED UI/browser routes. Org ACT-SALES writes/reads, ACT-FIN reads; customer grants/SEC do not gain automatic access. No amount/payment lifecycle exists. | Issued-reference/date/order/customer entry and permitted FIN readback; existing order/customer discovery must remain safe. No PDFs/transmission or final invoice creation implied. | unit invoice-evidence; integration invoice-evidence/invoice-evidence-http. Unit freshly run, PG historical/source-inspected. Later role-specific evidence UI. |
| 12 / I1 operational PO and shared catalogues; APR-038; acceptance APR-039 | inbound-service/contracts/values, inbound-http.ts; RegisterOperationalPurchaseOrder, AddInboundCatalogueOption; GetOperationalPurchaseOrder/reference lookup/catalogue exactLabel/pages;0017. Immutable original1–128lines, exact numbers/Jalali and independent add/select. | ACCEPTED P1 at `/`: register-panel, catalogue-panel, lookup-panel. `/ui-api/purchasing/operational-orders` (+lookup/keyed GET), `/ui-api/purchasing/inbound-catalogues` (+query). PROC registers; org PROC/WH read/add catalogues. | No approved gap established. Known reference/UUID lookup is accepted; missing general PO search is not a P1 defect. O-01 remains excluded optional follow-up. | unit inbound-values/browser-intent/display/operator-lifecycle/config; integration inbound variants/browser-http. Relevant unit and browser-http/inbound-http/integrity/recovery freshly executed; P1 accepted review evidence otherwise historical. Preserve. |
| 13 / I2 purchase-linked receiving/progress; APR-042; acceptance APR-043 | receiving-service/contracts.ts, receiving-store.ts, Inventory inbound-receiving.ts/store; ConfirmPurchaseReceiving/GetReceivingArrival/GetPurchaseOrderReceiving;0018. Shared arrival/documents with distinct physical units, source claims, actual-vs-original and single atomic owner/IPS/outcome/audit bundle. | UI IMPLEMENTED_AWAITING_ACCEPTANCE P2; `/` receiving-panel/arrival-panel, P1 scoped views. `/ui-api/purchasing/receiving/{confirm,arrivals/query,orders/query}`. Org WH confirms/whole-arrival reads; PROC/WH order-scoped progress. | No new backend gap established. P2 two fixed semantic findings still require independent follow-up+Owner acceptance. Real receiving configuration/UAT is E, not fabricated factory readiness. | unit receiving/projection/inventory-inbound-receiving/lifecycle; integration receiving/receiving-integrity/p2-browser-http plus related suites:110fresh real-PG passes; real browser evidence in package. Highest priority: gate0, then authorized P3. |

Production's current16commands are `DraftProductionOrder`, `PlanProductionOrder`,
`ReleaseProductionOrder`, `StartProductionOrder`, `CompleteOperationPartial`,
`CompleteProductionOrder`, `CloseProductionOrder`; `PlanMaterialAllocation`,
`AssignMaterialAllocation`, `IssueAllocatedMaterial`, `ReleaseMaterialAllocation`;
`StartProductionOperation`, `CompleteProductionOperation`, `RecordStationEntry`,
`RecordStationReferral`, `DeclareStationCompletion`. Entry/declaration/referral
are separate source events, not quantity posts. Allocation release is only the
accepted unissued branch; general reservation release/production abort is not
implied. Completion inputs/outputs/residuals/scraps/finalizeUnitIds preserve exact
mass balance and original remainder restrictions.

The exact contracts/roles must be reread when scoping a future UI: a current
ACT-WH ability to activate a reservation is not a grant to query all customer
commercial state; current Sales availability port is not a public browse API.
No general stock/customer/order/work-queue list route was identified in the
inspected transports. A usable discovery gap must be specified and authorized,
not hidden behind an arbitrary UUID form or solved with an unauthorized endpoint.

Production order GET reveals route operation UUIDs and Station enum names, so a
known order can drive keyed operation reads. No planning/operator queue,
per-order allocation listing, personnel assignment or source-event/report history
HTTP contract was found. Internal store `operations/allocations/facts` methods
are not published read endpoints. Identity account-query is exact username lookup,
not a personnel/grant roster. These are concrete scoping gaps, not permission to
add a list/assignment backend. `CompleteProductionOperation` always needs ACT-OP;
leftovers additionally require the same account/customer's ACT-PLAN disposition
flag. ACT-PLAN alone can complete the order, not the material operation. Password
change is the authenticated person's current-password flow, not an SEC reset.

Direct source/acceptance navigation for the matrix:

| Rows | Owner implementation / transport | Canonical bounded delivery record |
| --- | --- | --- |
| 1 | [Command execution](../../packages/shared-kernel/src/envelope/execute.ts), [composition](../../apps/backend/src/composition-root.ts) | [Envelope report](SLICE_ENVELOPE_IMPLEMENTATION_REPORT.md) |
| 2 | [Identity service](../../apps/backend/src/modules/identity/service.ts), [Identity HTTP](../../apps/backend/src/transport/identity-http.ts) | [Identity status](IDENTITY_AUTHORIZATION_IMPLEMENTATION_STATUS.md) |
| 3 | [Posting service](../../apps/backend/src/modules/inventory/posting-service.ts) | [IPS status](SLICE_IPS_IMPLEMENTATION_STATUS.md) |
| 4 | [Receipt service](../../apps/backend/src/modules/procurement/receipt-service.ts), [receipt HTTP](../../apps/backend/src/transport/receipt-http.ts) | [Receipt status](SLICE_PURCHASE_RECEIPT_IMPLEMENTATION_STATUS.md) |
| 5 | [Sales service](../../apps/backend/src/modules/sales/sales-service.ts), [Sales HTTP](../../apps/backend/src/transport/sales-http.ts) | [Demand status](SLICE_STOCK_DEMAND_IMPLEMENTATION_STATUS.md) |
| 6 | [Reservation owner](../../apps/backend/src/modules/inventory/reservation.ts), [reservation HTTP](../../apps/backend/src/transport/reservation-http.ts) | [Reservation status](SLICE_STOCK_RESERVATION_IMPLEMENTATION_STATUS.md) |
| 7 | [Shipping service](../../apps/backend/src/modules/shipping/shipping-service.ts), [shipping HTTP](../../apps/backend/src/transport/shipping-http.ts) | [Shipment status](SLICE_STOCK_SHIPMENT_IMPLEMENTATION_STATUS.md) |
| 8 | [Production service](../../apps/backend/src/modules/production/production-service.ts), [production HTTP](../../apps/backend/src/transport/production-http.ts) | [MAKE status](SLICE_MAKE_IMPLEMENTATION_STATUS.md) |
| 9 | [Trace projection](../../apps/backend/src/modules/genealogy/projection.ts), [genealogy HTTP](../../apps/backend/src/transport/genealogy-http.ts) | [Trace status](GENEALOGY_TRACE_IMPLEMENTATION_STATUS.md) |
| 10 | [Purchase evidence service](../../apps/backend/src/modules/procurement/purchase-service.ts), [purchase HTTP](../../apps/backend/src/transport/purchase-http.ts) | [Purchasing evidence status](SLICE_PURCHASE_IMPLEMENTATION_STATUS.md) |
| 11 | [Invoice evidence service](../../apps/backend/src/modules/finance/invoice-evidence-service.ts), [invoice evidence HTTP](../../apps/backend/src/transport/invoice-evidence-http.ts) | [Finance-Lite status](FINANCE_LITE_IMPLEMENTATION_STATUS.md) |
| 12 | [I1 service](../../apps/backend/src/modules/procurement/inbound-service.ts), [inbound HTTP](../../apps/backend/src/transport/inbound-http.ts) | [I1 status](I1_IMPLEMENTATION_STATUS.md), [accepted P1 UI](P1_IMPLEMENTATION_STATUS.md) |
| 13 | [I2 service](../../apps/backend/src/modules/procurement/receiving-service.ts), [receiving HTTP](../../apps/backend/src/transport/receiving-http.ts) | [I2 status](I2_IMPLEMENTATION_STATUS.md), [P2 status](P2_IMPLEMENTATION_STATUS.md) |

Actual [unit test sources](../../apps/backend/tests/unit),
[integration test sources](../../apps/backend/tests/integration) and
[migrations](../../database/migrations) retain the named file-level evidence.

## Prioritized unfinished-work register

Categories: **A** defective/incomplete approved work; **B** explicitly authorized
missing backend; **C** accepted backend without operator UI; **D** partial UI;
**E** operational/deployment prerequisites; **F** deferred/conditional/unapproved.
Severity describes impact if used/rolled out, not an assertion of an active breach.
Existing checks in this assessment established no additional high/critical product
defect. Read-only inventory cannot certify that none exists elsewhere.

| ID / category / capability | Requirement and actual status/evidence | Missing behavior and dependency | Severity / operational impact | Next action / authorization / can implementation proceed now? |
| --- | --- | --- | --- | --- |
| A01 / A+D / P2 confirmed outcome | Audit SEC-P2-01; code/app regressions and337fresh automated cases linked above. Corrected, IMPLEMENTED_AWAITING_ACCEPTANCE. | Independent follow-up PASS and Owner acceptance, not more product scope. | Medium REQUIRED in original audit; contradictory receiving outcome was release-blocking. | Review8554a1e against exact finding. Existing authority allowed correction only; no new increment now. |
| A02 / A+D / P2 optional actual review | Audit WF-P2-01; preview wrapper plus all four omitted/null/value assertions and actual browser/PG null comparison. Corrected, IMPLEMENTED_AWAITING_ACCEPTANCE. | Same independent/Owner gate. | Medium REQUIRED; wrong final-review evidence meaning was release-blocking. | Re-review final display and payload semantics. No self-closure as independently passed. |
| A03 / A / canonical status navigation | Historical conflicts listed above; runtime unaffected. Assessment/backlog current addenda reconcile PARTIAL documentation. | Earlier source snapshots remain historical; consumers must follow current authority and bounded source. | Low maintenance/authorization confusion. | Documentation reconciliation allowed in this assessment; no old OQ/business approvals rewritten. |
| B00 / B / approved missing backend | No demonstrated unimplemented backend requirement with still-applicable implementation authority found after accepted-slice/contract comparison. | Broad original-vision tasks belong to F or C; evidence of a concrete accepted omission would reopen A. | NOT_VERIFIED beyond inspected evidence; no fabricated blocker. | No automatic backend work authorized. |
| C01 / C / Inventory visibility and Sales demand | Accepted IPS/receipt/Sales backends, matrix rows3–5. UI NOT_IMPLEMENTED. | Role-appropriate stock/unit/lot lookup and demand/assessment journey; usable stock/customer/order discovery may need bounded read authorization. | High operational gap for broader ERP use; blocks factory selling from this UI. | Proposed P4a/P4b after P2/P3, separate UI/read scope. No. |
| C02 / C / Reservation to dispatch | Accepted reservation/shipping, rows6–7. UI NOT_IMPLEMENTED. | Explicit request/activation, whole-unit packaging, shipment ready/loading/dispatch and canonical recovery; available-unit/customer/order context. | High operational gap; no browser fulfillment journey. | P4c/P4d, separate bounded grants. Sales confirmation must not reserve; dispatch must not close Sales. No. |
| C03 / C / Production planning and personal execution | Accepted MAKE, row8. UI NOT_IMPLEMENTED. | PLAN per-order route/material-allocation assignment and personal OP Entry/Start/Complete/report interfaces; Referral is PLAN. Planning/operator queues and personnel assignment are not accepted public contracts; new required reads/assignment need bounded authorization. | High operational gap; accepted production cannot be used by ordinary operators here. | P5a/P5b; explicit scope and essential read review. No. |
| C04 / C / Source-linked trace | Accepted Genealogy, row9. UI NOT_IMPLEMENTED. | Authorized forward/backward navigation retaining source labels and explicit bounded-limit failures, paired with material/order journeys. | Medium; trace API exists but no usable browser investigation. | P5c or attach bounded trace view to P4/P5 after authorization. No. |
| C05 / C / Purchasing and invoice documentary evidence | Accepted rows10–11, UI NOT_IMPLEMENTED. | PROC completed-purchase/proforma references and SALES issued-invoice/FIN readback, without money/payment or outbound transmission. | Medium; records require nonbrowser API use. | Smaller role-specific evidence increments after core material workflows. No. |
| C06 / C / Identity administration and legacy standalone receipt | Accepted rows2/4, UI PARTIAL (Identity login only) / NOT_IMPLEMENTED (legacy receipt). | SEC operator/grant/disposition administration and self-service password change; legacy receipt demand must be established separately from I2 UNLINKED support. | Medium administration gap; extra legacy form may have low priority. | Scoped admin UI later; do not duplicate I2 just because a bearer endpoint exists. No. |
| D01 / D / accepted P1 optional follow-up | P1 O-01 retained by APR-045/P1 status; ACCEPTED scope with deferred/nonblocking readback/recovery observation. | Optional P1 refinement explicitly excluded from APR-046 and current remediation. | Nonblocking for accepted P1; not a new P2 prerequisite. | Preserve as deferred; fresh bounded authority needed. No. |
| E01 / E / real users and receiving configuration | Config validates browser origin/secret and named receiving location; test fixtures work. Real configuration NOT_VERIFIED. | Personal PROC/WH accounts/current grants, real installation/place IDs and labels, finite supported material-name mapping and actual forms. OQ-019/SRC-007-D10. | High before real use: identity/location/material mistakes. | Owner/factory supplies/verifies inputs in separately authorized P3. No real provisioning in this task. |
| E02 / E / production runtime and TLS | `config.ts` enforces production loopback/TLS-origin; secure headers/cookies exist. Production reverse-proxy/service assets absent in tracked tooling; live environment NOT_VERIFIED. | TLS termination, supervised process, secrets lifecycle, least-privilege runtime/DDL roles, target migration/0018 historical preflight. | High rollout prerequisite; local loopback evidence is not deployment readiness. | Bounded runtime plan/test after Owner authorization; no new platform by default. No deployment now. |
| E03 / E / backup/restore and admission reconciliation | [Backup/recovery](../08-integration-deployment/BACKUP_AND_RECOVERY.md), OQ-016: RPO≤60min/RTO≤8h, daily/offsite; admission fence and IPS rebuild exist. Backup/drill implementation not found; live setup NOT_VERIFIED. | Verified posted facts/outcomes/audit restore, offsite copy, measured RPO/RTO, retained-history reconciliation, retention/tool choice. Daily copy alone does not prove60min RPO. | High data-loss/retry risk before rollout. | Owner authorizes real environment/drill; preserve COMMAND_ADMISSION_RECONCILED=false until actual reconciliation. No. |
| E04 / E / opening stock and cutover | OQ-015/019 and [cutover plan](CUTOVER_TRAINING_ROLLOUT.md); OpeningStockImport NOT_IMPLEMENTED/BLOCKED_BY_POLICY. | Source/material/counters/freeze/identity/residual/scrap rules, preparer/signer, receipt-vs-opening policy; decide whether pilot data scope needs it. | High if historical stock is introduced without approved reconciliation. | Precise factory answers and separate import scope; no direct Balance or ad-hoc receipt backfill. No. |
| E05 / E / controlled UAT/training | P3 roadmap; NOT_IMPLEMENTED/NOT AUTHORIZED, sign-off NOT_VERIFIED. | Real PROC→WH→PROC tasks, discrepancy/optional/retry instruction, physical labeling, incident handling, support/stop responsibility and actual user sign-off. | High adoption/rollout prerequisite. | P2 follow-up+acceptance, then bounded P3 authorization. No factory rollout here. |
| E06 / E / monitoring and operating runbooks | Structured redacted logger, health/ready and durable audit exist. `OBSERVABILITY.md` has signal labels; live alerts/retention/support NOT_VERIFIED. | Named failure/recovery responses, log rotation/retention and useful alerts; realistic OQ-014 load evidence. | Medium operational support gap; no claim to full monitoring. | Add only justified runbook/config under P3 scope; no dashboard/platform by default. No. |
| E07 / E / CI DB/browser automation | Windows CI unit/static/audit exists; integration runner includes new test automatically. PG/browser hosted jobs NOT_IMPLEMENTED; hosted run NOT_VERIFIED. | Isolated Windows PG roles/db and browser provisioning before automation. Current manual/local gates remain mandatory. | Medium regression-detection/assurance gap, not a failed local PG test. | Separate narrowly bounded CI scope if prioritized; no Linux/WSL jobs or skip-based green. No infrastructure changes now. |
| E08 / E / dependency advisory maintenance | Fresh audit high-threshold PASS,11moderate dev-chain findings via minimatch10.2.6; details in remediation report. PARTIAL security maintenance. | Reviewed pin-compatible resolution and static/unit regression; no ERP runtime input path found. | Moderate tooling availability risk, nonblocking for this P2 fix; not11distinct runtime exploits. | Separate bounded dependency review/approval; no npm audit fix --force, downgrade or automatic upgrade. No dependency change under current grant. |
| F01 / F / Sales fulfillment/unfulfilled/closure | Accepted Sales demand ends CONFIRMED/MAKE linkage; shipment DISPATCHED. Close rule answered OQ-007, command implementation NOT_IMPLEMENTED. | Explicit remaining-valid-demand/fulfillment producer, authorized unfulfilled handling, cancellations/amendment effects, invariant-safe reservation/production coordination. | Material future workflow gap; does not invalidate accepted stock-demand/dispatch bounds. | Propose separate owner slice; exact branch decisions then authorize. No. |
| F02 / F / reservation extensions | Request/activation and dispatch consumption exist; general release/cancel/expiry/temporary holds NOT_IMPLEMENTED/DEFERRED. OQ-007/008. | Authority, effect on packaging/production/demand, separate temporary TTL only if introduced. | High if guessed; no timer for confirmed SO may be invented. | Branch-specific design and Owner authorization. No. |
| F03 / F / production stop/cancel/rework and warehouse remainder conversion | MAKE excludes these branches; C-07 warehouse conversion is a separate business fact, BLOCKED_BY_POLICY/NOT_IMPLEMENTED. | Stop/abort compensation/authority and source identities; standalone opened-Coil remainder-to-Sheet transaction, inputs/outputs, usable stock and source lineage. | High if folded into completion or direct stock edits. | Preserve accepted completion; resolve precise C-07/OQ-003/009 transaction then separately authorize. No. |
| F04 / F / corrections, returns and reversals | Logical SLICE-REVERSE homes, no implemented corrective owner workflow; BLOCKED_BY_POLICY/NOT_IMPLEMENTED. | Source-linked compensating facts/SoD, consumed/reserved/produced/dispatch interactions, prior-confirmation operator-error procedure. | High before permitting real mistakes to be corrected; not license to edit history. | Establish safe operational escalation in P3; new correction module only after bounded policy/scope. No. |
| F05 / F / monetary Finance/payment | Invoice evidence exists; amounts, currency/tax/cutting/price policy, payments/allocation/credit NOT_IMPLEMENTED/BLOCKED_BY_POLICY. | OQ-012/019, actual payment recorder, exact money/correction rules and Sales owner ports. | Significant future commercial gap; not a stock/dispatch prerequisite. | Separate policy/scope; no guessed payer/approver or payment-dependent Sales close. No. |
| F06 / F / customer portal | Visibility-only policy answered; allowlisted documents/security visibility unresolved OQ-010, browser portal NOT_IMPLEMENTED/BLOCKED_BY_POLICY. | Actual audience/doc whitelist/customer mapping; existing scoped API is not portal acceptance. Ordering/prices/write DEFERRED outside MVP. | High disclosure risk if generalized. | Confirm whitelist and separately authorize read-only UI only. No portal ordering. |
| F07 / F / devices, external systems and optional platforms | Weighbridge/printer/protocol/external upload/live dashboards not delivered; DEFERRED/BLOCKED_BY_POLICY by path. | OQ-011 device identity/protocol, real printing need, unnamed external invoice system/permission, operational demand. | Depends on actual branch; manual business entry remains usable. | Do not make hardware or a queue/framework a prerequisite to the accepted UI. Separate scope only. No. |
| F08 / F / QC, legal GL, multi-site and speculative breadth | Explicit current-MVP exclusions, DEFERRED. | New business/architecture approval if ever enabled. | No current defect. | Keep excluded; no QC actors/gates, GL connector or portal writes fabricated. No. |

No additional runtime defect was repaired during Phase B. Findings whose presence
or acceptance cannot be established remain NOT_VERIFIED rather than invented
approved work. Current actual defects take priority if new reproduction evidence
arises; they need bounded remediation authority at this gate.

For unimplemented F branches there is no executable successful journey/test to
credit. Existing normal-flow tests do not prove future cancellation, correction,
money or cutover behavior. A catalogue-only command may currently reject as
unknown; a proposed `GUARD_OPEN_POLICY` requirement does not imply an implemented
HTTP handler. Relevant normal-flow test sources and owner files are in the matrix;
the missing branch requires its own acceptance evidence after authorization.

## Proposed small-increment execution roadmap

This is a proposal, **not implementation authorization**. All rows stop for
separate review/acceptance/local delivery before advancing. Each UI uses Persian
RTL, mixed-direction identifiers, personal current role, accessible labels/focus/
keyboard, exact decimal strings, loading/empty/failed/stale/confirmed states,
backend authorization, safe same-key replay and explicit irreversible confirmation.
No new framework/dependency, business command or read endpoint is implied.

| Order / bounded increment | Dependencies and authorization | Acceptance criteria / deliverables | Verification strategy |
| --- | --- | --- | --- |
| 0 — P2 follow-up and Owner decision |8554a1e package; required gate, not self-acceptance | Formal independent report closes SEC-P2-01/WF-P2-01; Owner accepts corrected exact revision. Otherwise only authorized defect closure. | Reproduce both at prior/fixed revision; focused final-feedback/null-state, response-loss/replay/read-refresh, session and durable stock evidence. |
| 1 — P3 controlled Purchasing/Receiving pilot preparation and execution | P2 accepted; **new explicit P3 authority required**, real factory/Owner inputs | Bounded participant/data/environment plan; real configuration, UAT/training/stop/support record, TLS/runtime and restore proof where live use is proposed, cutover decision. No claim pilot completed from engineering tests. | Real user sign-off, exact fields/exception cases and optional semantics, retry/reconciliation, measured restore/drill; no production action without its own permission. |
| 2 — P4a stock investigation for WH/SALES | P3 gate or explicit roadmap adjustment; existing WH/SEC keyed reads and Sales assessment owner port; **NOT AUTHORIZED** | Role-scoped unit/Lot/availability lookup with trustworthy freshness and material identity. First establish if known-ID reads suffice; general listing and direct SALES stock-read authority are explicit gaps requiring a separate bounded backend-read grant. | Read authorization/isolation, empty/failure/stale states, exact quantities, browser/HTTP against real PG; no stock command. |
| 3 — P4b Sales order to fulfillment assessment | P4a, real customer references/grants, supported six commands; **NOT AUTHORIZED** | One usable draft→submit→assessment→STOCK/MAKE recording→confirm journey; MAKE option only its accepted link. No automatic reservation or closure. | Unit mapping/validation/retry; PG states/customer isolation; browser authorized+denied+expiry/network/reload. |
| 4 — P4c explicit reservation request and activation | Demand STOCK evidence+available stock; **NOT AUTHORIZED** | Owner request/activate/readback journey, visible competition/one-ACTIVE-claim/no-steal constraints (partial kg claims allowed; later shipping requires whole Units), same-key recovery. No release/TTL extension. | Real concurrent earlier-order competition, at-most-one active claim, rollback/replay and browser uncertain response. |
| 5 — P4d whole-unit package to dispatch | Active reservation and accepted Sales customer context; **NOT AUTHORIZED** | Package creation/pack/unpack/assignment then shipment prepare/ready/load/explicit dispatch/readback in a bounded journey. Split further at package acceptance if needed; no customer delivery/Sales close. | PG atomic stock exit+consumption, duplicates/concurrency; real browser load/dispatch loss/retry/current role. |
| 6 — P5a manager route and material allocation | Existing MAKE+MAKE demand, actual Station vocabulary, personal grants and known object references; **NOT AUTHORIZED** | PLAN order/immutable per-order route/release and material-allocation assignment. Stations use enum names, operations use UUIDs. Personnel assignment is absent and would need a separate contract/grant; queue/read gaps must be resolved before implementation. | Server-role negatives, route ordering/staleness, exact allocation/owner boundaries; browser/PG, no completion yet. |
| 7 — P5b personal operation execution/completion | P5a; accepted human disposition permission; **NOT AUTHORIZED** | Personal OP Entry/start/report/CompleteProductionOperation across one actual route step, with PLAN Referral separately; exact consumed=outputs+WIP+Residual+Scrap, immutable lineage and final material. Separate from abort/rework/conversion. | Unit state/serialization; PG atomic mass-balance/concurrency/audit rollback; browser response-loss and personal role/disposition negatives. |
| 8 — P5c material trace investigation | Relevant sources from accepted receiving/production/shipping; **NOT AUTHORIZED** | Bounded forward/backward trace, source evidence, explicit bounded-limit rejection and customer-scoped navigation. Can accompany an authorized material journey. | Trace source/role isolation and limits; browser empty/failed navigation; PG read consistency. |
| 9 — Role-specific evidence/admin increments | Real use prioritizes PROC documents, SALES/FIN evidence or SEC administration; **NOT AUTHORIZED** | One owner/role journey at a time. Record existing issued/sent evidence only; admin scope never becomes shared Station identity. | Exact reference/customer mapping, denial/CSRF/session/XSS/replay and canonical reload; real PG and browser. |
| Separate future backend branch | A concrete operational need, exact missing policy and explicit new grant | Sales close/unfulfilled, reservation lifecycle, conversion/corrections, Finance etc each gets its own owner design/DoD. | Invariants, real PG/concurrency/crash/security and an authorized end-to-end operator journey. |

If the Owner prefers engineering-only P4/P5 before real P3, the required decision
is explicit: authorize that roadmap reorder, specify the bounded UI increment and
any essential reads, and retain P3 as NOT_COMPLETED/NOT_ACCEPTED. This assessment
does not reorder it silently or start work while P2 remains in_review.

## Quality and release boundary

P2's exact changed files, commands,337fresh automated passes, actual browser and
PostgreSQL identity comparison, internal review/advisory findings and artifact
hashes are in the [remediation report](P2_REMEDIATION_REPORT.md). Expected-red and
corrected test-fixture failures are disclosed there. The local check equivalent
passed; no hosted CI success is claimed and no push is authorized. Existing
[Windows verify workflow](../../.github/workflows/verify.yml) runs pinned install,
advisories/static/typecheck/unit; [integration runner](../../tools/test/run-integration.mjs)
already discovers the affected PG test file. Local browser verification is not an
automated CI job. Future increments must preserve these distinctions.

Acceptance remains open for P2 even with passing implementation evidence. No known
unresolved required internal finding in the bounded fix is hidden; formal
follow-up and Owner acceptance are the outstanding blockers. Broader C/E/F work
is a traceable proposed backlog, not permission to expand current scope.

Assessment validation: read-only commercial and production specialists checked
the matrix against actual accepted contracts and supplied the scope/role/read-gap
corrections incorporated above. No remaining material discrepancy was reported in
their assigned areas. The coordinator checked current authority, source precedence,
original-document variants and operations/CI evidence. This is internal assessment
review, not the formal P2 follow-up. Focused local-link/frontmatter and final
working/staged whitespace checks pass; exact counts are retained in
`artifacts/tests/erp-inventory-docs.log`. No product tests were rerun merely for
this documentation-only assessment; the fresh P2 results retain their exact scope.
