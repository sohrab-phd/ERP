---
id: PLAN-IMPLEMENTATION-BACKLOG-001
title: Implementation Capability Backlog
phase: 12-implementation-planning
status: in_review
version: 0.15.0
owners: [chief-solution-architect]
depends_on: [APR-040, APR-039, APR-038, APR-037, ADR-0001, ADR-0006, ADR-0007, ADR-0011, GOV-QUESTIONS-001, GOV-SLICE-HOMES-001]
last_reviewed: 2026-10-24
approval: null
supersedes: null
---

# Implementation capability backlog

Current [APR-040](../00-governance/approved-baselines/APR-040-i2-business-decisions-design-scope.md)
records [SRC-007 answers](../00-governance/team-answers/OWNER_I2_RECEIVING_DECISIONS_2026-10-24.md)
to all ten I2 questions. The business portions are answered; do not repeat them.
[One focused I2 design/test package](I2_IMPLEMENTATION_DESIGN.md) covers shared
multi-PO arrivals/documents, accepted physical units, code protection across old/new
paths, actual/original provenance, sole IPS, progress and full authorized PROC reads.
[Execution DRAFT](I2_IMPLEMENTATION_AUTHORIZATION_DRAFT.md) remains PROPOSED — NOT
AUTHORIZED FOR EXECUTION. Current scope is documentation only; no code/SQL/test/
permission/gate/unlock change or push. Twelve accepted capabilities remain.

R-MAT is only a conditional compatibility check for a specific real ambiguous/
unsupported catalogue option; known factory categories are not re-questioned and
ordinary supported receiving is not blocked. Historical code/source checks are
future data verification, not an unanswered uniqueness policy.
Technical design/capacities await Owner acceptance and separate implementation authority.

## Earlier scope/status (historical; current task is APR-040 design only)


[APR-039 formal Owner acceptance](../00-governance/approved-baselines/APR-039-i1-backend-acceptance-i2-clarification.md)
accepts I1 implementation e3462fcfc4eaebbedb0d3a323bda7e0ae72d59c4 after the focused
read-only evidence check. Twelve capabilities are now Owner accepted; I2 is absent.
[Existing delivery results](I1_IMPLEMENTATION_STATUS.md) and [60-ID trace](I1_IMPLEMENTATION_TRACE.md)
remain the accepted evidence, not a fresh full test execution. No I1 design is reopened.

The next task is only [unresolved I2 business decisions in Persian](I2_BUSINESS_DECISIONS_FA.md):
B02/B03, non-PO B01/B04, changed-W1 B05, exceptions B06, receiving-only B07/B08,
minimum evidence/escalation B09 and business meaning/authority for D10 material
classification. Confirmed facts stay settled. Answers feed a bounded I2 design
and separate implementation approval; no I2 design/code/migration/permission or
gate expansion is authorized now. B10 historical linking remains excluded; no push.

## Earlier delivery status (historical; current acceptance is APR-039)


[APR-038](../00-governance/approved-baselines/APR-038-i1-implementation-authorization.md)
is the actual bounded Owner implementation authority after accepted APR-037 design.
I1 original order/line registration, exact shared catalogues for both PROC/WH and
original-order queries are implemented. [Delivery evidence](I1_IMPLEMENTATION_STATUS.md)
and [60-ID code/test trace](I1_IMPLEMENTATION_TRACE.md) provide actual verification.
No I2 functionality or policy closure, stock writer or new Owner-accepted capability
is implied. The next work requires Owner review and separate I2 scope/policy authority;
no push is authorized. Earlier design-only statuses below are historical.

## Earlier status (historical; effective I1 authority is APR-038)


Current task [APR-037](../00-governance/approved-baselines/APR-037-i1-detailed-design-acceptance.md):
formal Owner acceptance of all14I1 detailed-design decisions with explicit conditions.
R1 Option A CLOSED; exact values/Jalali/catalogues/identity/integrity/capacities are
accepted design. [Implementation DRAFT](I1_PURCHASE_ORDER_IMPLEMENTATION_AUTHORIZATION_DRAFT.md)
is ready for separate bounded Owner authorization; execution and gate/unlock remain
NOT AUTHORIZED/UNCHANGED. No new backend capability or product tests are claimed;
eleven accepted capabilities remain. Actual PG compatibility precedes future code,
and mandatory real-PG/security/concurrency/recovery/regression proof remains future.
No push; prior reviewed commit's remote presence is unverified.

## Earlier task history

APR-036 recorded R1 Option A and prepared the design-acceptance package only;
its pending-design-approval state is superseded by APR-037, not its execution stop.

Earlier task: [APR-035](../00-governance/approved-baselines/APR-035-i1-final-design-review.md),
focused final documentation review/corrections only. [Final dispositions](I1_PURCHASE_ORDER_FINAL_REVIEW.md)
leave reference-equivalence R1 OPEN for Owner decision; factory scope is resolved.
Numeric/UTF8/calendar/PG/resource recommendations are conditional, not accepted.
No new capability/gate or I2 readiness. Stop for Owner review; no remote push.

Earlier task: [APR-034](../00-governance/approved-baselines/APR-034-i1-detailed-design.md),
Step 3 detailed DESIGN of I1 only. [Six proposed specifications](I1_PURCHASE_ORDER_DOMAIN_DESIGN.md)
cover operational orders/lines, shared catalogue add/select by both roles,
factory-wide reference identity, exact values/Jalali, scoped reads, PostgreSQL
atomicity/recovery and 60-ID future acceptance. No executable code/contracts/SQL/
permissions/tests, new capability or gate change. Stop for Owner technical design
acceptance and separate bounded implementation authorization. I2 remains separately
blocked by its actual policy/design dependencies; no push status is assumed.

Previous task: [APR-033](../00-governance/approved-baselines/APR-033-i1-policy-clarification.md),
Step 2 analysis accepted at local b8666b7; push unconfirmed. Focused documentation
and I1 readiness only. [SRC-005 / policy amendment](../02-domain-business-architecture/PURCHASE_RECEIVING_I1_POLICY_AMENDMENT.md)
resolves the specified B01/B07/B08 business portions and adds 12 supplemental
requirements: I1 includes operational orders/lines/lookup PLUS shared extensible
Material Type/Quality/Color add/select by BOTH ACT-PROC and ACT-WH. No third-party
approval or extra register field; catalogue addition is distinct from PO editing,
B06 acceptance and stock. Technical-class separation, exact representation and
catalogue identity/races remain design work, mapping before I2 stock.
I1 is ready for explicit Owner Step 3 authorization with no demonstrated business
blocker; Step 3 and implementation remain unauthorized. No runtime/grant/enum/gate
change or additional backend capability. All I2-only residuals remain scoped open.

Previous task authority: [APR-032](../00-governance/approved-baselines/APR-032-inbound-gap-analysis.md),
Step 1 accepted/push confirmed; Step 2 code-informed gaps and architecture analysis only.
[Accepted baseline/23 fields/trace](../02-domain-business-architecture/PURCHASE_RECEIVING_REQUIREMENTS_BASELINE.md)
and [preliminary reconciliation/F01–F08 reassessment](../02-domain-business-architecture/PURCHASE_RECEIVING_RECONCILIATION.md)
record new confirmed PO/line/multi-arrival/unit/discrepancy/visibility facts and
explicit architecture conflicts. The earlier optional ticket plan is on hold for
reassessment and is not the new workflow's implementation scope. The
[Step 2 package](PURCHASE_RECEIVING_TECHNICAL_GAP_ANALYSIS.md) maps all 48 requirements,
open business/design dependencies and two PROPOSED backend increments: operational
PO/lines/lookup, then coherent receiving/stock/lineage/progress/visibility.
Stop for Owner review before Step 3; no API/SQL/runtime/grant/dependency/product gate
change or new implementation backlog authorization is created. Later visibility/UI,
corrections/restoration, device integration, UAT and production cutover remain tracked.

Historical planning direction: [APR-030](../00-governance/approved-baselines/APR-030-weighbridge-clarification-preparation.md),
Owner acceptance/confirmed push of scope review `8f9920322e295f5a18576a00a7c147f2fb0df017`.
Eleven backend capabilities remain accepted, including Finance-Lite invoice-evidence
`67e3346dc93584123885cefb228c960f8940a7f6`; see [committed progress](FINANCE_LITE_IMPLEMENTATION_STATUS.md#overall-committed-capability-progress).
Finance-Lite remains partial. That earlier task (§10) was final factory clarification and
conditional implementation preparation only: [response form](../00-governance/WEIGHBRIDGE_FACTORY_CLARIFICATION.md),
[plan/contract/DoD](WEIGHBRIDGE_IMPLEMENTATION_PLAN.md). Optional initial atomic ticket
evidence is preferred, not product-authorized. Factory decisions and explicit Owner
product gate/unlock approval remain required before implementation. No unlock
expansion; UAT/deployment and monetary/payment/accounting/correction branches remain separate.

Historical foundation status: the Owner authorized implementation in APR-018 from baseline
e80a04b15ddf93451cc79ccf81722f564912596d. The recorded canonical grant covers
SLICE-ENVELOPE, now accepted; historical false/pending statements below are
the original planning snapshot. Continue dependency-aware scope/design/review
under [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md), reconcile each next
bounded product grant with current authorization and resolve only inputs used
by that behavior. Windows-only validation is effective; no factory answer or
OQ status changes here.

This is an ordered engineering plan under the Project Owner's trusted-agent
decision of 2026-10-04. It does not authorize implementation, approve a baseline,
close an OQ, or require OS adversarial containment. Native-autonomy installers,
parent ACL hardening and ProgramData enforcement are outside this backlog.
The historical readiness grant was `implementationAuthorized=false`; current bounded implementation authority is recorded above and in CURRENT_PHASE. Backlog prose does not self-authorize a new scope.

SLICE-ENVELOPE remains the first slice. Foundation setup is part of that slice,
not a separate business implementation. Its non-business fixture exercises the
command envelope before production identity, inventory, sales or finance exist.
The accepted Modular Monolith, Node.js/TypeScript and PostgreSQL baseline stays.
No broker, distributed transaction or event-sourcing infrastructure is required.

This document elaborates the sequence summarized in the repository README. The
existing ROADMAP_AND_SLICES, SLICE_HOMES, command catalogue and module ownership
remain the homes for canonical identifiers. Capability headings without a
`SLICE-*` identifier are backlog groupings, not new command or slice identifiers.
Every implementation work item must cite its existing canonical home before
authorization. A listed architecture command is not factory-confirmed procedure.

## Canonical homes and bounded delivery order

The accepted [roadmap](ROADMAP_AND_SLICES.md),
[home register](../00-governance/registers/SLICE_HOMES.md) and
[work-item kinds](WORK_ITEMS.md) control identifiers. The capability order below
is a dependency plan, not renumbered slices. After envelope and identity/IPS,
receipt may precede stock fulfillment to supply inventory; a verified fixture
may instead exercise STOCK before real purchasing. No mandatory PO is invented.
Later details remain bounded plans until their affected policy is available.

| Capability/increment | Existing home | Required ownership/bundle |
| --- | --- | --- |
| Generic envelope and initial audit/test host | SLICE-ENVELOPE | kern-command, host-backend, mod-identity-audit; no Ledger |
| Sole stock kernel and inventory reads | SLICE-IPS | mod-inventory-posting / ACT-IPS |
| Receipt/intake and optional later PO lifecycle | SLICE-PURCHASE | WI-BUNDLE-GR = PostGoodsReceipt + Lot/Unit/Ledger; Procurement orchestrates, IPS posts |
| Sales inquiry/quotation/demand/unfulfilled | SLICE-STOCK commercial prefix | mod-sales; no stock/finance-table writes |
| Reservation / shipment / Finance-Lite | SLICE-STOCK | WI-BUNDLE-RESERVE, WI-BUNDLE-DISPATCH, WI-BUNDLE-PAY remain indivisible |
| Production/allocation/leftover identity | SLICE-MAKE | WI-BUNDLE-COMPLETE-OP contains WI-BUNDLE-RESIDUAL, never a later commit |
| Human receipt ticket / device adapter | SLICE-PURCHASE | ADP-WEIGHBRIDGE commands same WI-BUNDLE-GR |
| Visibility portal / finance export | SLICE-STOCK reads | ADP-PORTAL / ADP-GL-EXPORT; no order-write or statutory GL |
| Reporting/events/print shared foundation | SLICE-ENVELOPE infrastructure home | ADP-REPORT/ADP-LIVE/ADP-PRINT labels do not expand the exact first-slice scope |
| Source-linked reversal | SLICE-REVERSE | New compensation command/new key; original facts retained; SV-013 distinct human on GR reversal |
| Balance / Genealogy reconstruction | SLICE-RESTORE | Ledger versus DATA-GEN-001 source facts are separate rebuild inputs |
| Opening facts | SLICE-CUTOVER | ADP-CUTOVER/OpeningStockImport remain guarded; not PostGoodsReceipt |

Identity is shared mod-identity-audit infrastructure, not a new SLICE identifier.
Queries travel with the owning producer as SLICE_HOMES specifies. Genealogy
projection work reads producer facts; GenealogyRebuild retains its RESTORE home.
A host label is not a separate deployable service. All TASK-IMPL citations
required by WORK_ITEMS must be prepared only after final human authorization.

## Entry and exit rules

A = true implementation-start requirement; B = prerequisite for the affected
later slice; C = UAT evidence; D = cutover/go-live prerequisite; E = safe technical
defer; F = future/outside current MVP. These are timing classifications, not
question answers. The live OPEN_QUESTIONS register controls recorded status.

Before SLICE-ENVELOPE, complete generic durable idempotency and transaction/audit
semantics, its technical freeze, physical design, acceptance-test specification
and relevant independent engineering review. Final human baseline/scope
authorization follows. Factory role mappings, commercial procedures, production
disposition, device protocols and opening-stock source files are B/C/D for their
affected slices; they do not prevent this generic foundation. Abandoned OS
enforcement is not an A prerequisite.

For each later slice: authorize its bounded scope, resolve only B inputs used by
that behavior, preserve `GUARD_OPEN_POLICY` for missing policy, and demonstrate
its acceptance tests before broadening scope. A missing optional branch must
remain inaccessible/rejected; do not implement an invented default. Synthetic
integration fixtures are test evidence, not factory decisions or cutover stock.

All writes use the owning module's public command/port. Orchestrators pass one
application-owned PostgreSQL transaction context across the accepted bundle;
they never write another module's tables. Read projections cannot become write
paths. Every command slice inherits the frozen envelope, current authorization,
durable replay, audit, concurrency and compensating-correction contracts.

## 1. SLICE-ENVELOPE — deterministic foundation and command execution

- **Objective/dependencies:** establish the backend host, frozen package/runtime
  setup, PostgreSQL transaction adapter and generic command/query envelope after
  final human authorization. No business slice is required.
- **Use cases:** non-business test command fixture; accepted and rejected first
  outcomes; identical retry; mismatched command, target, material payload,
  principal or scope; uncertain retry; authenticated query fixture. The fixture
  is not a new factory command and is never enabled as a production business API.
- **Invariants/persistence:** ADR-0011 owns bound request identity, durable outcome
  and audit replay semantics. One accepted transaction contains its fixture fact,
  durable outcome and command audit; rejection cannot commit business effects.
  No Ledger, Balance, reservation, shipment, invoice or production tables.
- **Tests:** crash-before/after commit, lost response, concurrent duplicate,
  distinct-key duplicate fixture fact, key-reuse conflicts, current-access denial,
  cross-principal nondisclosure, durable rejection, audit count and atomicity;
  clean deterministic install, typecheck/build and real PostgreSQL integration.
- **Acceptance:** frozen first-slice spec and all acceptance cases pass from a
  clean checkout; uncertain retry resolves by the same bound key; no duplicate
  fixture fact; no stock/business write path exists. Test-only principal fixture
  cannot authenticate production requests.
- **Out of scope/residuals:** actual login product/person mappings (B), quantities,
  prices, public domain commands, frontend, distributed workers, deployment and
  factory UAT data (C/D). Detailed choices belong to the technical/physical freeze.

## 2. Identity and authorization capability

- **Objective/dependencies:** replace fixture-only request context with the
  selected production identity/session boundary and explicit permission checks;
  depends on envelope and its trusted-principal/scope contract.
- **Use cases:** personal-account login/logout, session validation, revocation,
  module-command access and customer-scoped reads. Canonical command/query names
  are taken from security/application homes; no new `ACT-*` mapping is inferred.
- **Invariants/persistence:** identity owns accounts/session evidence; audit owns
  attribution evidence. Personal accounts only; no shared Station account.
  Login is not Station Entry. Organizational title is not command permission.
  Current access is checked on replay before revealing the stored result.
- **Tests:** revocation, unauthorized command, same-user/different-scope isolation,
  another-principal key conflict without outcome disclosure, personal attribution,
  session expiry and audit redaction. No credentials or secrets in routine logs.
- **Acceptance:** every externally reachable command/query has an explicit policy
  and attributable principal; fixture route disabled; no implicit super-admin.
- **Out of scope/residuals:** OQ-019 domain mappings/delegates (B) must precede
  affected domain permissions; actual operator population is C/D. Future Quality
  roles are F. Authentication product choice is a technical B for this slice.

## 3. SLICE-IPS — inventory posting kernel

- **Objective/dependencies:** enforce stock invariants through the sole writer;
  depends on envelope, domain authorization and the frozen decimal design.
- **Use cases:** implement only canonical IPS ports required by the next bounded
  receipt/reservation flow. Nested `ConsumeUnitPartial`, `ConsumeUnitComplete`,
  `CreateResidualUnit` and `PostScrapMovement` are not standalone user workflows.
- **Invariants/persistence:** `ACT-IPS` owns unit quantity, immutable Ledger and
  rebuildable Balance. kg is the only stock quantity; never negative inventory;
  no direct Balance edit; exact decimal arithmetic; correction adds compensating
  facts linked to originals. Module-owned constraints and locks enforce the rule.
- **Tests:** concurrent depletion, duplicate business fact with a different key,
  rollback across Ledger/Unit/Balance, precision boundaries, projection rebuild
  and bypass-import checks. Rebuild changes no stock facts or audit meaning.
- **Acceptance:** no application/UI/adapter can post via another writer; a failed
  posting leaves quantity and evidence unchanged; owner constraints survive races.
- **Out of scope/residuals:** OQ-001 technical quantity/arithmetic scale is B here;
  conversion factors and automatic weight-difference classification remain B only
  for branches needing them. No production completion, opening stock or warehouse
  Coil-to-Sheet transformation is introduced by this kernel slice.

## 4. SLICE-PURCHASE receipt increment — intake and stock visibility

- **Objective/dependencies:** receive and inspect accepted inventory facts through
  IPS; depends on posting kernel and appropriate identity/authorization.
- **Use cases:** canonical `PostGoodsReceipt` orchestration and inventory reads.
  Intake records Internal Code, Count, Weight and Type. Count is descriptive.
  Receipt does not assume a mandatory Purchase Order. A physical intake screen
  does not write the Ledger itself.
- **Invariants/persistence:** accepted receipt bundle is PostGoodsReceipt + Lot +
  Inventory Unit + Ledger in one PostgreSQL transaction; inventory writes remain
  IPS-owned. Procurement orchestration calls owners. Standalone incoming Sheets
  have no fabricated Coil parent. Normal stock-in yields AVAILABLE under current
  guards after commit; current MVP has no mandatory incoming Quality gate.
- **Tests:** duplicate receipt, partial failure, unauthorized receipt, measured-kg
  handling, standalone-Sheet trace, unit/lot linkage, balance reconstruction and
  rejection when a required receiving policy is missing.
- **Acceptance:** physical receipt evidence and its single stock fact reconcile;
  queries agree with committed Ledger truth; accepted receipt never double-posts.
- **Owner-confirmed normal manual policy:** APR-021 permits personal ACT-WH only,
  no mandatory PO/ticket; Internal Code is nonunique. Stable receipt document UUID
  plus bound command key covers replay; no guessed cross-document deduplication.
- **Out of scope/residuals:** device identity/discrepancy/returns policy is later B;
  OQ-011 automatic scale integration is B for that path, with accepted human
  ticket fallback. OQ-015 opening-stock tooling/cutover is separate B/D. No
  invented procurement tolerance or warehouse transformation command.

## 5. SLICE-STOCK — Sales, reservation and shipment capability

- **Objective/dependencies:** support demand, reservation and stock dispatch with
  explicit domain boundaries; depends on envelope, identity and usable inventory.
  Deliver small increments: demand/confirmation, reservation, then shipment.
- **Use cases:** `ConfirmSalesOrder`, `RequestReservation`, `ActivateReservation`,
  `DispatchShipment`, `CloseSalesOrder`. Amendment/cancel commands such as
  `RequestSalesOrderCancel`, `ConfirmSalesOrderCancel`,
  `RecordUnfulfilledDemand` and `ReopenAsInquiry` remain architecture candidates
  until the affected factory procedure/authority is established. `SalesOrderChange`
  is a required change-record concept in state documentation, not a separately
  enumerated command in APP-CMD-001; do not mint it as a new catalogue command.
- **Invariants/persistence:** Sales owns demand/lifecycle; reservation owner calls
  IPS for reserved state/quantity inside the accepted ActivateReservation bundle.
  Shipping orchestrates DispatchShipment + stock exit atomically through IPS.
  One ACTIVE reservation per Unit; REQUESTED occupies no active slot; no stealing
  or confirmed-SO TTL. Earlier confirmation wins active competition. Reservation,
  allocation, consumption and shipment remain distinct.
- **Tests:** simultaneous reservation, no-steal, dispatch rollback/replay,
  partial fulfillment with default zero tolerance, retained valid remainder,
  cancellation authorization and payment-independent closure. Payment, invoice
  issue and DELIVERED alone must not close the Sales Order.
- **Acceptance:** fulfillment/cancellation/authorized-unfulfilled closure follows
  the accepted rule; shipment posts stock once; Sales writes no finance or stock
  tables; branches with missing authority reject under `GUARD_OPEN_POLICY`.
- **Out of scope/residuals:** prices/tax/currency/rounding (B for commercial
  amounts), normal complete-reserved-Unit shipment policy answered APR-024 (no financial prerequisite); exceptional/delivery procedures deferred, change/cancel
  effects (B), nondefault OQ-006 tolerance (B when introduced), FIND-026 expiry (B
  before expiry). Frontend product and customer ordering portal are not implied.

## 6. SLICE-MAKE — production and genealogy source facts

- **Objective/dependencies:** model the accepted per-order operation lifecycle
  and atomic production completion; depends on inventory and relevant Sales
  demand/identity. Implement only operations whose policy is sufficiently known.
- **Use cases:** `StartProductionOperation`, `CompleteProductionOperation` and
  canonical pre/post-post correction/abort commands only after their home and
  factory stop/cancel semantics are resolved. Entry/Referral are separate events,
  not aliases for Start/Complete; they do not automatically post stock.
- **Invariants/persistence:** Production owns lifecycle and route; owners persist
  consumption/output/Residual/Scrap source facts through their ports in DATA-TX-001.
  Completion consumes/posts output and leftover once through IPS. Residual is a
  human reusability disposition; no numeric cutoff. `PlaceResidualUnit` is not
  a second quantity post; `ScrapUnit` destiny is not another scrap quantity post.
- **Tests:** simultaneous completion, rejection after partial work, lost response,
  consume/output/residual/scrap atomicity, per-order route versions, skipped
  Stations, personal attribution and compensating correction lineage.
- **Acceptance:** one authorized completion commits its entire bundle or none;
  Station screens cannot write Ledger; source-fact links preserve distinct Coil,
  Sheet, Inventory Unit and Order identities; no fabricated per-tiny-piece Unit.
- **Out of scope/residuals:** OQ-003 lifecycle/routing model (B), OQ-009 disposition
  record and consumption semantics (B), output/WIP/process-loss policy (B for
  affected behavior), OQ-004 identity catalogue (B/C/D). Warehouse opened-Coil
  remainder to Sheet conversion remains a separate unresolved FACT-03/C-07
  transaction; it cannot be folded into completion. Current QC stays F.

## 7. Genealogy projection and trace capability

- **Objective/dependencies:** expose reproducible material/order trace; depends on
  the source-fact-producing slices required by each trace, not on Ledger alone.
- **Use cases:** canonical genealogy reads and `GenealogyRebuild`; no
  `EditGenealogy`. Add package/shipment/rework traces only when their source-fact
  producer exists and its workflow is resolved.
- **Invariants/persistence:** projection owner reconstructs Genealogy Link from
  Lot Origin, Consumption, Output, Residual, Scrap, Package, Shipment and Rework
  source-fact families. Source owners retain truth. No direct foreign-table write
  and no universal fabricated Coil ancestor. Order Code is practical order-level
  trace for associated pieces/scrap, not a substitute for Inventory Unit identity.
- **Tests/acceptance:** rebuild after restore matches source facts; correction
  links preserved; duplicate facts not multiplied; standalone Sheet remains
  Coil-independent; authorized customer trace cannot expose another customer.
- **Out of scope/residuals:** new rework entity/workflow, universal part serials,
  editable genealogy, automatic business correction; identity gaps are B.

## 8. SLICE-PURCHASE purchasing increment — procurement where applicable

Owner [APR-027](../00-governance/approved-baselines/APR-027-purchasing-evidence-scope.md)
authorizes the bounded completed-purchase and optional sent-proforma recording
increment. See [actual implementation/evidence](SLICE_PURCHASE_IMPLEMENTATION_STATUS.md).
Organization-scoped ACT-PROC recording fields/authority are answered for this
increment; the candidate PO lifecycle and other residual branches below remain
unconfirmed. No stock/financial effect or supplier master/approval is introduced.

- **Objective/dependencies:** add only confirmed purchasing coordination around
  established intake; depends on receipt, authorization and supplier/policy inputs.
  Its position can precede production if purchasing evidence becomes available.
  Stock receipt must not wait for an invented mandatory Purchase Order workflow.
- **Use cases:** purchases/proformas recorded as factory evidence; canonical
  `ApprovePurchaseOrder` and `SendPurchaseOrder` are architecture candidates,
  not confirmed factory approval roles or lifecycle. Implement candidates only
  after the corresponding B procedure is answered.
- **Invariants/persistence:** Procurement owns purchasing records and orchestrates
  owners for receipt; only IPS writes kg. Proforma is not customer invoice,
  supplier approval, payment approval or inventory post.
- **Tests/acceptance:** approved lifecycle cases, unauthorized approval, duplicate
  receipt orchestration, partial/cancel/correction effects and no foreign table
  writes; accepted procurement records reconcile without a second receiving path.
- **Out of scope/residuals:** supplier master ownership, selection/approval,
  mandatory purchase link, discrepancy/quantity/cancel/return effects and financial
  terms are B. No inferred Procurement Manager or purchasing tolerance.

## 9. Finance-Lite capability

- **Objective/dependencies:** record agreed commercial evidence and payment
  allocation without becoming legal GL; depends on Sales, envelope and identity.
- **Use cases:** canonical invoice/payment recording and `AllocatePayment` only
  after required commercial/payment policies are resolved. Recorded invoice
  issue, record and external-upload responsibilities remain distinct.
- **Invariants/persistence:** Finance-Lite owns invoice/payment/open-balance facts;
  AllocatePayment + invoice open-balance is one accepted transaction. It never
  writes Sales lifecycle or stock. Invoice/payment states do not close orders.
  Exact money arithmetic; corrections add linked compensating facts.
- **Tests/acceptance:** concurrent allocations, duplicate allocation, rollback,
  over/partial allocation according to confirmed policy, customer isolation and
  money precision; allocation balances reconcile and order state is untouched.
- **Out of scope/residuals:** price ownership/version, cutting fee, tax/currency,
  invoice numbering/timing, payment recorder/link/allocation/correction/credit
  policy, deposit/deadline and cheque/note handling are B. No invented values.
  Legal GL/accounting connector is F; unnamed external upload is separate B.

## 10. Weighbridge adapter and human fallback

- **Latest evidence (2026-10-20):** SRC-004 and the [Step 1 baseline](../02-domain-business-architecture/PURCHASE_RECEIVING_REQUIREMENTS_BASELINE.md)
  show broader operational purchasing/receiving dependencies; W1 accepted per-unit
  stock, W2 mandatory waybill consignment and W3 optional destination consignment
  cannot be reduced to an optional printed-ticket extension. [Reassessment](../02-domain-business-architecture/PURCHASE_RECEIVING_RECONCILIATION.md)
  is documentation only. Device/separate ticket capture and all implementation
  remain unauthorized; Step 2 waits for Owner review. Historical bullets below
  describe the earlier conditional scope, not approved current implementation.
- **Current authority/status (2026-10-11):** scope review accepted/pushed by Owner;
  APR-030 authorizes [factory clarification](../00-governance/WEIGHBRIDGE_FACTORY_CLARIFICATION.md)
  and [conditional contract/DoD preparation](WEIGHBRIDGE_IMPLEMENTATION_PLAN.md) only.
  Candidate implementation BLOCKED / NOT AUTHORIZED. Owner prefers optional initial
  atomic Procurement-owned ticket evidence with ordinary receiving unchanged.
  Factory policy remains pending; no twelfth backend capability delivered.
- **Objective/dependencies:** attach attributed weight evidence to accepted
  receiving/commercial flows; depends on the consuming domain command and
  integration authorization. Device work can proceed independently when known.
- **Use cases:** human ticket entry/fallback and later `ADP-WEIGHBRIDGE` adapter
  invoking accepted commands. No direct adapter database posting command.
- **Invariants/persistence:** evidence is owned by the receiving/commercial owner;
  adapter is a commander, never Ledger writer. Final commercial weight is not a
  second stock truth. Measured/expected difference is shown, not automatically
  acceptable, process loss, Residual or Scrap.
- **Tests/acceptance:** repeated/reordered tickets, unavailable device, attribution,
  stale/invalid evidence and authorized fallback according to approved rules;
  envelope retry identity is not physical-ticket identity. Source identity/reuse
  scope and receipt cardinality must be approved before source dedup tests can pass.
- **Out of scope/residuals:** device/model/protocol/location/identity block the
  automatic path, not inherently a human-only branch. Existing APR-021 personal
  ACT-WH normal manual intake is approved without mandatory ticket; exact physical
  ticket operator/custodian, fields, source identity/cardinality, ticket read policy,
  linkage timing and unusable-print handling remain open for this candidate.
  Actual ticket validation is required before delivery/UAT. Automatic difference
  thresholds need separate policy if requested. No fallback elimination, assumed
  protocol, commercial effects, correction/restoration or UI in the first candidate.

## 11. Portal visibility and reporting/audit capability

- **Objective/dependencies:** provide scoped, read-only customer/operational views;
  depends on identity and the relevant committed domain/projection sources.
- **Use cases:** canonical query catalogue reads, approved portal documents,
  trace/report/audit searches. Reporting can be delivered incrementally alongside
  each producer; first envelope audit is not deferred until this stage.
- **Invariants/persistence:** customer/object scope enforced before reads; portal
  never places orders or posts stock; reports do not reinterpret invoice/payment
  as Sales closure. Read projections are reconstructible and not authoritative
  commands. Audit access and logging redact credentials and restricted payloads.
- **Tests/acceptance:** cross-customer access, direct-object-reference denial,
  revoked access, query side effects, audit linkage/replay and report-to-source
  reconciliation; approved views contain only committed permitted facts.
- **Out of scope/residuals:** OQ-010 document list is B; user isolation/UAT C.
  Prices and portal requests/order writes are F; prices are not shown by default
  and internal genealogy is not dumped to customers. No new analytics warehouse is needed for MVP.

## 12. SLICE-REVERSE / SLICE-RESTORE — correction and recovery

- **Objective/dependencies:** exercise source-linked corrections and recoverable
  projections; depends on the domain facts and policies being corrected. Add
  domain correction tests with their producer; this stage integrates recovery.
- **Use cases:** only canonical compensating commands, `BalanceRebuild` and
  `GenealogyRebuild`; no direct Ledger, Balance or genealogy editing.
- **Invariants/persistence:** source owners create compensating facts; Inventory
  posts through IPS. Ledger-to-Balance and source-facts-to-Genealogy rebuilds are
  separate reconstruction paths. Durable outcome/audit/fact state is restored consistently. Because accepted
  recovery allows an RPO window, restore can lose acknowledged outcomes:
  command admission stays fenced until history is reconciled under the envelope
  recovery contract; absence after lossy restore does not justify reposting.
- **Tests/acceptance:** correction chain, repeated correction, interrupted rebuild,
  database restore then rebuild/retry, permissions and audit continuity. Recovery
  meets accepted RPO 60 minutes/RTO 8 hours with daily backup/off-site copy at
  release evidence time; no rebuild manufactures new stock facts.
- **Out of scope/residuals:** affected correction policies are B; backup product,
  retention and live recovery proof are C/D under OQ-016. No Event Sourcing or
  automatic reversal merely because an order changed.

## 13. Integration, UAT, SLICE-CUTOVER and rollout

- **Objective/dependencies:** verify end-to-end operational behavior and migrate
  confirmed opening facts after usable authorized slices exist; go-live approval
  is separate from permission to begin the first implementation slice.
- **Use cases:** intake-to-stock-to-reservation/production-to-shipment and
  commercial allocation journeys; customer visibility; confirmed external upload;
  candidate `OpeningStockImport` only after OQ-015/OQ-019 procedure is resolved.
- **Invariants/persistence:** existing owners and Ledger remain the only truth;
  import uses bounded owner commands and reconcileable source identity. Import
  cannot create a second stock ledger or be assumed identical to PostGoodsReceipt.
  One entity/site remains current scope.
- **Tests/acceptance:** migration dry run, duplicate source retry, opening balance
  reconciliation, signed source totals, business UAT, actual volume/load/security
  checks, restore/fallback drills, operator training and rollback/reconciliation
  runbooks. Cutover proceeds only with confirmed owners, freeze and sign-off.
- **Out of scope/residuals:** OQ-014 real volumes (C/D), OQ-015 source files/codes/
  signers/freeze (B/D), OQ-019 named UAT/cutover people (C/D), OQ-016 retention/
  backup tooling (D), ADR-0008 deployment topology (B before deployment). Future
  Quality, multi-site/legal GL and optional stored-function posting are E/F.

## Canonical reconciliation and review evidence

Reviewed directly on 2026-10-04 after hook retirement: ROADMAP_AND_SLICES,
WORK_ITEMS, SLICE_HOMES, module ownership/dependency map, command catalogue,
invariant/state/transition/side-effect/concurrency catalogues, production posting
kernel and genealogy projection, MVP rules, actor responsibility and customer
isolation, together with README, CURRENT_PHASE, live DECISIONS and complete
OPEN_QUESTIONS factory evidence. [Independent domain review](REVIEW_DOMAIN_BACKLOG.md)
records corrections and B-F residuals. Receipt's earlier erroneous STOCK home
is repaired to PURCHASE; no accepted home or atomic bundle is relocated.

This freezes the ordered capability backlog and its invariant/ownership boundary
under delegated technical authority, not a human-approved implementation baseline
or detailed distant-slice design. Exact first-slice scope and acceptance contract
remain in TECHNICAL_FREEZE and SLICE_ENVELOPE_PHYSICAL_DESIGN; the backlog cannot
expand them. Real factory policy/principal mappings remain B/C/D; Quality and
portal requests/order writes remain F. Production human disposition and separate
mass-balance-policy residuals are explicit, not closed by architectural prose.
No OQ answer/status, gate, approval evidence, unlock or product file was changed.

Current Owner production policy update (2026-10-09): the bounded SLICE-MAKE consumption, WIP/final, exact mass-balance and authenticated managerial disposition prerequisites above are resolved by the actual [Owner decision](../00-governance/approved-baselines/APR-025-production-scope.md). Implementation resumes; earlier pending preparation text is historical. OQ-003/OQ-009 stay treating for unrelated branches.
