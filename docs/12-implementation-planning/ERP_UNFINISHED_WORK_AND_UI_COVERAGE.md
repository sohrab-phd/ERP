---
id: PLAN-ERP-UNFINISHED-001
title: Verified unfinished-work register and backend-to-UI coverage
phase: 12-implementation-planning
status: in_review
version: 1.2.1
owners: [delivery-lead, chief-solution-architect]
depends_on: [TOOL-UIUX-001, APR-049, APR-048, APR-047, APR-046, APR-045, APR-043, PLAN-IMPLEMENTATION-BACKLOG-001, IMPL-P2-REMEDIATION-001]
last_reviewed: 2026-11-07
approval: null
---

# ERP unfinished work and operator UI coverage — current alignment 2026-11-07

## Current P4a acceptance and next workstream — 2026-11-07

[APR-049](../00-governance/approved-baselines/APR-049-p4a-owner-acceptance.md)
formally accepts P4a Warehouse Inventory Visibility at
`6c0fbbbed05eeb81ccf7564b2bbd7cfc7caebf10`. P1, P2 and P4a are accepted software
interfaces. P4a passed 271 unit tests, a clean complete 398-case PostgreSQL run and
25 actual Chromium checks, with all required independent findings closed.
[Accepted P4a delivery](P4A_IMPLEMENTATION_STATUS.md).
Earlier P4a PROPOSED/NOT AUTHORIZED/NOT IMPLEMENTED statements below are historical
planning snapshots, superseded for this bounded increment. The roadmap table and
Inventory coverage below now reflect acceptance.

P4b Sales UI is the next PROPOSED workstream. Separate Owner direction is required
for discovery, design and implementation. The
[reviewed skill configuration](UI_UX_SKILL_GOVERNANCE.md) addresses reproducibility
for the next frontend stage. Representative full migration-wide write overhead
must still be measured before deployment or operational performance acceptance.
APR-049 retains both acceptance-time limitations. The P2 historical residual retains
its APR-047 classification. Factory pilot and deployment retain separate gates.

## Prior P2 acceptance and software-first priority — 2026-11-05 (historical)

[APR-047](../00-governance/approved-baselines/APR-047-p2-owner-acceptance-software-first-roadmap.md)
formally accepts bounded P2 at `f6ef316c711474775b158e8d12fea4a885f2f368` after
final independent PASS WITH NON-BLOCKING OBSERVATIONS. SEC-P2-01-NAV/WF-P2-01 are
CLOSED and required independent review SATISFIED. Historical257trigger UNKNOWN
is retained as an explicitly accepted nonblocking residual: reproduced fixture
leak corrected, complete111/111PG/isolated257normal exits, unchanged assertions/
workload, no current reproducible Inventory integrity defect. No hosted-CI success,
UAT or production readiness follows. P1/I2 and thirteen backend acceptances stand.

The Owner now prioritizes software interfaces before the factory pilot:
P4aInventory next proposed → P4bSales → P4cReservation → P4dShipping → P5aPlanning →
P5bPersonal execution → P5cTrace → remaining role-specific interfaces → P3 after
its unchanged prerequisites. [P4a proposal](P4A_INVENTORY_VISIBILITY_SCOPE_PROPOSAL.md)
is PROPOSED / NOT AUTHORIZED / NOT IMPLEMENTED. P3 remains pending/NOT AUTHORIZED/
NOT COMPLETED/NOT ACCEPTED. This updates planning only; current task authorizes
documentation/proposal/validation and one local governance commit, no implementation,
pilot, push or deployment. The roadmap/register below reflect this priority;
historical execution counts retain their original provenance.

## Earlier inventory snapshot and evidence limits — 2026-11-04 (historical)

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
business authority. APR-047 now accepts P2 and reorders planning; current authority
is documentation/proposal only. [Current phase](../00-governance/CURRENT_PHASE.md)
controls scope. Earlier remediation/inventory authority is historical.

| Conflicting or historical statement | Authoritative resolution and implementation consequence |
| --- | --- |
| Older architecture/report proposes .NET, React, NestJS/Prisma, Socket.IO or infrastructure | Accepted Node.js/TypeScript modular monolith, PostgreSQL and [ADR-0013](../00-governance/adrs/ADR-0013-slice-envelope-stack.md), frozen manifests, native node:http/direct pg and P1/P2 native DOM are current. The original report itself marks .NET superseded. Missing proposed framework/ORM is not a defect or migration authorization. |
| Historical current-state assessment says there is no browser UI; P1 status has a pre-APR-046 P2-closed sentence | APR-045 accepts P1; APR-046 authorizes P2 and actual routes/assets exist. Currentphase and this snapshot supersede old time-bounded statements. APR-047 now accepts P2 at f6ef316; earlier in_review wording is historical. |
| Backlog/inbound-roadmap header says only APR-043 acceptance documentation is authorized | Later APR-044/045/046 and the actual2026-11-04 Owner directive apply. APR-047 now permits acceptance/roadmap documentation and P4a proposal only; prior headers confer no product authority. |
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
contains identity login/logout/session, I1 orders/catalogues, I2 queries/
confirmation and the three P4a Inventory reads. Other legacy handlers reject
browser Origin. A hidden button or
existing bearer API does not make another capability browser-ready.

Source/test references are repository-relative. `unit/` and `integration/` in the
coverage column mean `apps/backend/tests/unit/` and `apps/backend/tests/integration/`.
Tests listed as available are source-inspected, not newly executed unless marked.
UIs marked NOT_IMPLEMENTED need new bounded Owner authorization under APR-047's
software-first order, including exact browser admission and missing essential reads.
P3 operational gates still apply before a factory pilot. P4b awaits its own directive.

| # / accepted backend and authority | Current executable boundary / owner source | UI status, existing browser routes, role | Missing journey / dependencies | Test source available / next priority |
| --- | --- | --- | --- | --- |
| 1 / Command envelope foundation; APR-018, acceptance carried by APR-020 | `executeCommand/executeQuery`, durable bound outcomes/replay, current access, audit+business transaction; shared-kernel `src/envelope/{execute,query}.ts`, PostgreSQL transaction/outcome/audit adapters;0001–0003. Recovery admission fenced by default. | ACCEPTED, indirectly used by P1/P2. Generic factory command screen is not required. Native `/health/live`, `/health/ready` are operational probes, not business UI. | No approved missing generic UI; restore/admission operating procedure is E03. Dependencies: PG/Identity and owner services. | Shared-kernel unit execute/binding/admission; integration transaction/outcome-concurrency/replay-audit/crash-retry/migration/permissions. Preserve as foundation. |
| 2 / Identity and authorization; APR-019; acceptance APR-020 | `modules/identity/{service,contracts,authorization,password}.ts`; `identity-http.ts`: login/session/logout/password, account create/query, grants, disable/revoke;0004, disposition flag0014. | PARTIAL UI: ACCEPTED personal login/logout/session at `/` through `/ui-api/identity/{login,logout,session}`. All personal roles authenticate; current app supports PROC/WH navigation. ACT-SEC admin UI and authenticated self-service password-change UI NOT_IMPLEMENTED (no admin-reset contract); native `/identity/{accounts,account-query,grants,disable,revoke,password}` are not browser-admitted. | Role-appropriate account/grant/password administration and real personnel mapping; preserve last-steward/current-session safeguards. No shared Station identity or SSO/password-recovery invention. | unit/integration identity; browser-http/operator-lifecycle/config. Login regression freshly covered by unit/PG/browser; full Identity PG not rerun. Admin UI later, genuine factory need determines priority. |
| 3 / IPS Inventory kernel; APR-020; acceptance APR-021 | `modules/inventory/{posting-service,contracts,quantity}.ts`, inventory-store.ts; internal `post` STOCK_IN/STOCK_OUT/RESERVE/RELEASE, availability/snapshot and restricted rebuild;0005. Ledger truth, Balance projection, ACT-IPS sole executor. | P4a Warehouse Inventory read/UI ACCEPTED under APR-049 at 6c0fbbbed05eeb81ccf7564b2bbd7cfc7caebf10. Discovery, Unit/Lot, exact kg and native RTL cover all approved origins/states through three closed browser reads. | Warehouse-only projection. Sales stock eligibility/customer reads need separate P4b scope. Complete migration-wide write overhead and skill reproducibility retain their future gates. | Accepted P4a evidence includes 271 unit, 398 complete real-PG and 25 Chromium checks. No added backend capability count or stock-writing UI. |
| 4 / Legacy manual receipt and keyed inventory visibility; APR-021; acceptance APR-022 | `PostGoodsReceipt` v1; receipt-service.ts, Inventory receipt.ts and receipt-http.ts; POST `/receipts/post`, GET `/receipts/{id}`, `/inventory/units/{id}`, `/inventory/lots/{id}` -> GetGoodsReceipt/GetInventoryUnit/GetLot;0006. No mandatory PO/ticket; later0018 duplicate-code guard intentional. | NOT_IMPLEMENTED browser UI/routes. Personal org ACT-WH posts; current org WH/SEC keyed stock reads cover legacy material_lot and organizational AVAILABLE state only, not all I2/production stock. P2 supports accepted I2 UNLINKED intake, but does not expose this distinct legacy contract. | First establish actual need for legacy form versus I2; standalone keyed stock/Lot lookup useful for investigation. Inventory+Identity/source-code policy dependencies; no location-master/search API assumed. | unit receipt; integration receipt/receipt-http; later receiving/receiving-integrity compatibility freshly covered. Prioritize stock view in P4a; duplicate intake UI only if real need and separately authorized. |
| 5 / Sales demand/fulfillment assessment; APR-022, MAKE extension APR-025; acceptance APR-023 | `sales-service.ts`, sales/contracts.ts, sales-http.ts. Six commands: DraftSalesOrder, SubmitSalesOrder, DraftFulfillmentAssessment, RecordFulfillmentStock, RecordFulfillmentMake, ConfirmSalesOrder. POST `/sales/commands`; GET `/sales/{orders,assessments}/{id}`;0007/0013. | NOT_IMPLEMENTED UI and no browser routes. Exact customer-scoped ACT-SALES. Confirming is not reserving; MAKE intent does not auto-start production. | Draft→submit→assess STOCK/MAKE→confirm with customer and eligible Unit selection/readback. `tools/sales/provision-customer.mjs` exists, but no general customer/order/discovery browser. Obtain essential read scope if needed. | unit sales (including accepted MAKE extension); integration sales/sales-http plus production cross-owner tests. Unit freshly executed; Sales PG source/historical evidence only. P4b. |
| 6 / Reservation request/activation; APR-023; acceptance APR-024 | `inventory/reservation.ts`, inventory-reservation-store.ts, reservation-http.ts. RequestReservation `{orderId,itemId,unitId,kg}`, ActivateReservation `{}`; POST `/reservations/commands`; GET `/reservations/{id}`;0008/0009. REQUESTED has no stock effect; activation calls IPS, dispatch consumes. | NOT_IMPLEMENTED UI/browser routes. Customer ACT-SALES request/activate/read; org ACT-WH may activate exact target without commercial-query grant. | Explicit stock reservation with readable current state and competition; requires confirmed STOCK demand/selection and Inventory. WH query/discovery need must not be bypassed by broader Sales access. General release/TTL is excluded. | unit reservation; integration reservation/reservation-http and shipping boundaries. Available historical PG tests prove priority/no-steal/replay. P4c, after usable demand/stock context. |
| 7 / Reserved-stock packaging/shipping; APR-024; acceptance APR-025 | shipping-service/contracts, Inventory shipping.ts, shipping-http.ts. DraftPackage, PackPackage, UnpackPackage, AssignPackageToShipment; DraftShipment, MarkShipmentReady, StartLoading, DispatchShipment. POST `/shipping/commands`; keyed GET `/shipping/{packages,shipments}/{id}`;0009–0010. | NOT_IMPLEMENTED UI/browser routes. Exact customer ACT-SHIP. Whole ACTIVE-reserved Units; dispatch atomically consumes reservation and posts stock exit. DISPATCHED is not delivery proof or Sales closure. | Reservation→package→shipment prepare/load/dispatch/canonical recovery. Customer/demand/reservation object discovery may need scoped reads; no financial prerequisite invented. | unit shipping; integration shipping/shipping-http/shipping-boundaries, races/real failure windows/replay. Unit freshly run, Shipping PG not rerun for P2. P4d (split packaging and dispatch if needed). |
| 8 / Production MAKE, allocations, station work and atomic completion; APR-025; acceptance APR-026 | production-service/contracts/lineage, Inventory production.ts and owner stores;0011–0014. POST `/production/commands`; GET `/production/{orders,operations,allocations}/{id}`. Commands enumerated below. | NOT_IMPLEMENTED UI/browser routes. Customer ACT-PLAN planning/allocation/referral; ACT-OP personal execution; CompleteProductionOrder supports OP/PLAN. Completion leftovers require same-account/customer explicit PLAN productionDisposition. | PLAN route/release/material-allocation assignment→personal OP execution/completion→manager referral/readback. Exact customer grants and work discovery; routes use Station enum names plus operation UUIDs, with1–16steps among ten Station names. No personnel-assignment command/field or shared station identity exists. Normal exact mass-balance policy is already resolved. | unit production/inventory-production; integration production/allocation/concurrency/recovery/security/integrity. Unit freshly executed; full Production PG remains historical. P5a then P5b. |
| 9 / Genealogy projection/trace; APR-026; acceptance APR-027 | genealogy/contracts/projection; genealogy-http.ts; owner ports supply one REPEATABLE READ READ ONLY source snapshot. GET `/genealogy/{forward\|backward}/{root}/{id}` for unit/lot/receipt/package/shipment/fact/operation/order/batch/sales_order. No genealogy truth table/migration. | NOT_IMPLEMENTED UI/browser routes. Exact customer ACT-WH/SALES/SEC; not general organizational/customer-portal authority. P2 receiving IDs are not a trace journey. | Source-backed forward/backward navigation, limits and exact customer isolation alongside material/order journey. I2 RECEIVING_UNIT is internal source support; existing public unit/Lot roots remain intentional. No missing public receiving_unit route defect established. | unit genealogy/genealogy-http; integration genealogy/genealogy-security/transaction; receiving source tests freshly within110. Live projection needs no materialized-cache rebuild UI. P5c. |
| 10 / Completed-purchase/sent-proforma evidence; APR-027; acceptance APR-028 | purchase-service/purchase-contracts.ts, purchase-http.ts; RecordCompletedPurchase / RecordPurchaseProformaSent; POST `/purchasing/{purchases,proformas}`, matching keyed GET;0015. Immutable existing document/sent-evidence references, not message delivery or stock. | NOT_IMPLEMENTED UI/browser routes. Org ACT-PROC. P1 operational PO register is a different capability. | One documentary record then optional linked sent-proforma/readback. No supplier master, approval workflow, amounts or mandatory receiving linkage. Identity/envelope only. | unit purchase; integration purchase/purchase-http, immutable SQL/current-role/rollback/recovery. Only unit freshly run here. Smaller later PROC evidence increment. |
| 11 / Issued-invoice documentary evidence; APR-028; acceptance APR-029 | invoice-evidence-service/contracts.ts, invoice-evidence-http.ts; RecordIssuedInvoiceEvidence/GetIssuedInvoiceEvidence; POST `/finance/invoice-evidence`, keyed GET;0016. Existing order/customer checked through Sales port. | NOT_IMPLEMENTED UI/browser routes. Org ACT-SALES writes/reads, ACT-FIN reads; customer grants/SEC do not gain automatic access. No amount/payment lifecycle exists. | Issued-reference/date/order/customer entry and permitted FIN readback; existing order/customer discovery must remain safe. No PDFs/transmission or final invoice creation implied. | unit invoice-evidence; integration invoice-evidence/invoice-evidence-http. Unit freshly run, PG historical/source-inspected. Later role-specific evidence UI. |
| 12 / I1 operational PO and shared catalogues; APR-038; acceptance APR-039 | inbound-service/contracts/values, inbound-http.ts; RegisterOperationalPurchaseOrder, AddInboundCatalogueOption; GetOperationalPurchaseOrder/reference lookup/catalogue exactLabel/pages;0017. Immutable original1–128lines, exact numbers/Jalali and independent add/select. | ACCEPTED P1 at `/`: register-panel, catalogue-panel, lookup-panel. `/ui-api/purchasing/operational-orders` (+lookup/keyed GET), `/ui-api/purchasing/inbound-catalogues` (+query). PROC registers; org PROC/WH read/add catalogues. | No approved gap established. Known reference/UUID lookup is accepted; missing general PO search is not a P1 defect. O-01 remains excluded optional follow-up. | unit inbound-values/browser-intent/display/operator-lifecycle/config; integration inbound variants/browser-http. Relevant unit and browser-http/inbound-http/integrity/recovery freshly executed; P1 accepted review evidence otherwise historical. Preserve. |
| 13 / I2 purchase-linked receiving/progress; APR-042; acceptance APR-043 | receiving-service/contracts.ts, receiving-store.ts, Inventory inbound-receiving.ts/store; ConfirmPurchaseReceiving/GetReceivingArrival/GetPurchaseOrderReceiving;0018. Shared arrival/documents with distinct physical units, source claims, actual-vs-original and one atomic owner/IPS/outcome/audit bundle. | P2 UI ACCEPTED under APR-047 at f6ef316c711474775b158e8d12fea4a885f2f368; `/` receiving/arrival panels and P1 scoped views; `/ui-api/purchasing/receiving/{confirm,arrivals/query,orders/query}`. Org WH confirms/whole-arrival reads; PROC/WH scoped progress. | Required independent review satisfied; SEC-P2-01-NAV/WF-P2-01 closed; historical257trigger UNKNOWN/nonblocking. Real configuration/UAT remains E, not factory readiness. | Final independent252unit/111PG plus isolated257 and3Chromium races/SQL; older110counts historical. Preserve accepted P2 scope. P4a is accepted under APR-049, P4b is next proposed and P3 retains its operational gates. |

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
| A01 / A+D / P2 confirmed outcome | SEC-P2-01-NAV CLOSED by final independent review of f6ef316; P2 ACCEPTED under APR-047. | No remaining P2 lifecycle correction required; immutable uncertainty recovery preserved. | Original medium REQUIRED defect closed; no current blocking finding established. | Preserve evidence and exact accepted revision; no implementation authorized now. |
| A02 / A+D / P2 optional actual review | WF-P2-01 CLOSED; all four omitted/null/value meanings preserved in components, actual Chromium and SQL. P2 ACCEPTED under APR-047. | No remaining review-display correction required. | Original medium REQUIRED defect closed. | Preserve original audit/remediation and final independent evidence; no feature grant. |
| A03 / A / canonical status navigation | Historical conflicts listed above; runtime unaffected. Assessment/backlog current addenda reconcile PARTIAL documentation. | Earlier source snapshots remain historical; consumers must follow current authority and bounded source. | Low maintenance/authorization confusion. | Documentation reconciliation allowed in this assessment; no old OQ/business approvals rewritten. |
| B00 / B / approved missing backend | No demonstrated unimplemented backend requirement with still-applicable implementation authority found after accepted-slice/contract comparison. | Broad original-vision tasks belong to F or C; evidence of a concrete accepted omission would reopen A. | NOT_VERIFIED beyond inspected evidence; no fabricated blocker. | No automatic backend work authorized. |
| C01 / C / Inventory visibility and Sales demand | P4a Warehouse read/UI ACCEPTED under APR-049. Sales UI remains NOT_IMPLEMENTED. | P4b needs an authorized Sales order/assessment workflow and any required customer/eligible stock reads. P4a WH projection does not grant SALES access. | Sales remains a major interface gap. Warehouse discovery is delivered. | P4b is next PROPOSED, awaiting separate discovery/design/implementation authority and the tooling reproducibility gate before frontend implementation. |
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
| E05 / E / controlled UAT/training | P3 roadmap; NOT_IMPLEMENTED/NOT AUTHORIZED, sign-off NOT_VERIFIED. | Real PROC→WH→PROC tasks, discrepancy/optional/retry instruction, physical labeling, incident handling, support/stop responsibility and actual user sign-off. | High adoption/rollout prerequisite. | P3 after necessary software interfaces and all infrastructure/UAT/operational prerequisites; separate bounded authority. No factory rollout here. |
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

## Software-first roadmap — Owner priority 2026-11-05

APR-047 sets the planning order. APR-049 records P4a acceptance on 2026-11-07.
P1, P2 and P4a are accepted. P4b and later rows require separate bounded Owner
discovery/design/implementation and read-contract authority, independent review
and acceptance. Each interface preserves native Persian RTL,
personal current identity, safe exact values, page/failure/stale/session states
and owner boundaries. Backend acceptance is not UI completion. This table replaces
the earlier pilot-first planning sequence; no operational pilot gate is removed.

| Order / bounded increment | Status and dependencies | Bounded outcome / verification gate |
| --- | --- | --- |
| 1 — P1 Purchasing UI | ACCEPTED, APR-045 | Preserve personal secure purchasing, catalogues and scoped receiving reads; original exclusions remain. |
| 2 — P2 Warehouse Receiving UI | ACCEPTED, APR-047, exact f6ef316c711474775b158e8d12fea4a885f2f368 | Independent NAV/WF closure satisfied; original257trigger retained UNKNOWN/nonblocking; no UAT/deployment inference. |
| 3 — P4a Inventory visibility and discovery UI | ACCEPTED under APR-049 at 6c0fbbbed05eeb81ccf7564b2bbd7cfc7caebf10 | [Accepted Warehouse read/UI and evidence](P4A_IMPLEMENTATION_STATUS.md), all D1–D4 boundaries and five approved indexes. Retain APR-049 acceptance-time limitations. TOOL-UIUX-001 resolves skill reproducibility, while migration-wide performance measurement remains a future gate. |
| 4 — P4b Sales order and fulfillment-assessment UI | NEXT PROPOSED / NOT AUTHORIZED / NOT_IMPLEMENTED; separate discovery/design/implementation directive required | Intended Sales workflow remains draft→submit→STOCK/MAKE assessment→confirm, subject to future scope review. Resolve required demand/customer/stock reads and verify the reviewed skill configuration before frontend implementation. Confirmation does not reserve stock. |
| 5 — P4c Reservation UI | NOT AUTHORIZED / NOT_IMPLEMENTED; confirmed STOCK demand and stock context | Explicit request/activation/readback; competition/one-ACTIVE/no-steal and partial kg rules; no release/TTL expansion. PG concurrency/rollback/replay and browser uncertainty. |
| 6 — P4d Shipping and dispatch UI | NOT AUTHORIZED / NOT_IMPLEMENTED; active reservation and customer context | Package/pack/unpack/assignment→shipment prepare/ready/load/dispatch/readback; whole Units. No customer-delivery or Sales-close claim. Atomic exit+reservation-consumption/replay/security and actual browser. |
| 7 — P5a Production planning and managerial workflow UI | NOT AUTHORIZED / NOT_IMPLEMENTED; MAKE demand, route vocabulary, personal PLAN grants and explicit required reads | Order/route/release/material allocation and managerial referral; Stations use enum names and operations UUIDs. Personnel assignment/queues are missing contracts if needed, not assumed grants. PG/browser/current-role review. |
| 8 — P5b Personal operator execution UI | NOT AUTHORIZED / NOT_IMPLEMENTED; P5a and accepted personal/disposition permissions | OP Entry/start/report/operation completion, PLAN Referral separate. Exact mass balance, immutable lineage, personal authorization; no abort/rework/conversion expansion. Atomic PG/replay and Chromium. |
| 9 — P5c Production genealogy and traceability UI | NOT AUTHORIZED / NOT_IMPLEMENTED; accepted source-backed trace and authorized relevant sources | Bounded forward/backward navigation, exact customer/source isolation and explicit limit failures. Read-consistency/role negatives and browser navigation. |
| 10 — Remaining role-specific interfaces | NOT AUTHORIZED / NOT_IMPLEMENTED or PARTIAL as matrix records; actual gaps prioritized separately | Personal administration, purchasing/proforma and invoice evidence, other approved gaps. One bounded owner/role journey at a time; no monetary/identity-policy expansion or UI completion inferred from backend acceptance. |
| 11 — P3 Controlled factory pilot | PENDING / NOT AUTHORIZED / NOT COMPLETED / NOT ACCEPTED; necessary software interfaces validated first | Retain participant/data/environment plan; personal accounts/grants and real material/location configuration; TLS/runtime/security, backups/restore/admission reconciliation, monitoring/support/stop procedures, UAT/training/sign-off and opening-stock/cutover policy where applicable. Separate explicit pilot/production authority; real measured operational evidence, not engineering-test substitution. |

Policy-dependent future backend branches (Sales closure/unfulfilled, reservation
extensions, corrections/conversion, monetary Finance, devices and others) keep
their separate design/Owner gates. The software-first priority does not authorize
them or relax the E-category rollout prerequisites. No push/deployment is granted.

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

P2 acceptance is now recorded by APR-047 after the final independent closure
review; the historical337-case remediation results above remain historical. The
latest independent252unit/111PG, isolated257 and three Chromium/SQL evidence are
recorded in APR-047 and P2 status. No product tests run for this documentation task.
Broader C/E/F work is proposed, not current implementation authority.

Assessment validation: read-only commercial and production specialists checked
the matrix against actual accepted contracts and supplied the scope/role/read-gap
corrections incorporated above. No remaining material discrepancy was reported in
their assigned areas. The coordinator checked current authority, source precedence,
original-document variants and operations/CI evidence. This is internal assessment
review, not the formal P2 follow-up. Focused local-link/frontmatter and final
working/staged whitespace checks pass; exact counts are retained in
`artifacts/tests/erp-inventory-docs.log`. No product tests were rerun merely for
this documentation-only assessment; the fresh P2 results retain their exact scope.
