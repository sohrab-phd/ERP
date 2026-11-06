---
id: PLAN-P4A-DECISIONS-001
title: P4a Owner decisions and implementation-readiness gate
phase: 12-implementation-planning
status: draft
version: 0.1.0
owners: [delivery-lead, chief-solution-architect, security-architect]
depends_on: [APR-047, PLAN-P4A-SCOPE-001, PLAN-P4A-READS-001, PLAN-P4A-SOURCES-001]
last_reviewed: 2026-11-05
approval: null
---

# P4a implementation authorization decision package

Current Owner decision2026-11-05: [APR-048](../00-governance/approved-baselines/APR-048-p4a-inventory-visibility-implementation-authorization.md) approves D1/D2/D4 and conditionally approves D3, and authorizes bounded implementation. This supersedes the design-task-only / OPEN / NOT AUTHORIZED statements below as historical proposal wording. The design baseline remains12e4ea8, with the exact Owner amendments in APR-048; P4a product acceptance remains pending.

**OWNER DECISION REQUIRED — NO IMPLEMENTATION AUTHORITY.** This sheet is a
technical proposal, not an approval record, signed factory decision or product
acceptance. All four decisions below remain OPEN. No new APR, grant, gate/unlock,
API/UI/schema/test/dependency or product behavior is created by these documents.

## Verified starting state and effective scope

| Fact checked2026-11-05 | Result / authority |
| --- | --- |
| Branch / starting HEAD | `main` / `7c5105ee7e0b6d06d3fa56e0e41ac1341d95c2a3`, exact expected documentation revision |
| Working tree before design | Clean, including no untracked files reported by git status --porcelain |
| Accepted P2 revision | `f6ef316c711474775b158e8d12fea4a885f2f368`, local commit exists and is direct parent of documentation HEAD |
| Approval sequence |48APR files, APR-000throughAPR-047 contiguous and unique; highest APR-047; none created in this task |
| Current recorded authority | [CURRENT_PHASE](../00-governance/CURRENT_PHASE.md) and [APR-047](../00-governance/approved-baselines/APR-047-p2-owner-acceptance-software-first-roadmap.md): bounded P2 accepted, SEC-P2-01-NAV/WF-P2-01 closed; P4a next proposed, not authorized |
| Effective additional task authority | Actual Owner P4a final-contract-design directive supplied in this chat2026-11-05: read-only source/schema analysis, design Markdown, documentation validation and one optional local documentation commit only |
| Accepted history preserved | P1/APR-045, I2/APR-043 and13bounded backend capabilities; P2 historical257trigger UNKNOWN/nonblocking remains unchanged; no new product test result inferred |
| Roadmap preserved | P4a→P4bSales→P4cReservation→P4dShipping→P5aPlanning→P5bPersonal execution→P5cTrace→remaining interfaces→P3pilot with all operational prerequisites |
| Remote/runtime state | No fetch/push/deployment or remote/hosted-CI verification. No database connection or factory-environment inspection; cached tracking and fixtures prove neither remote state nor production readiness |

Read completely: APR-047, [initial P4a proposal](P4A_INVENTORY_VISIBILITY_SCOPE_PROPOSAL.md),
[unfinished work/UI coverage](ERP_UNFINISHED_WORK_AND_UI_COVERAGE.md). Targeted
accepted IPS/receipt/MAKE/I2/Identity/query/browser/isolation contracts, owner
ports/stores, migrations0005/0006/0008–0012/0018 and relevant test fixture sources
ground the linked [source matrix](P4A_INVENTORY_SOURCE_AND_STATE_MATRIX.md) and
[contract design](P4A_INVENTORY_READ_CONTRACT_DESIGN.md). Graphify was used only
for local navigation; inspected source resolves facts, not inferred graph edges.
No broad factory rediscovery or accepted P1/P2 redesign is proposed.

Live [OQ register](../00-governance/registers/OPEN_QUESTIONS.md) remains authoritative:
OQ-001 is treating for precision applicability beyond scale measurement (technical
capacity already resolved by ADR-0015); OQ-014 is treating, fewer than100users and
about15–25concurrent are planning evidence, not transaction-volume measurements;
OQ-019 is treating for actual actor/sign-off mappings. This package closes none
of them, names no real operator and treats the load dataset as synthetic only.

## Recommended bounded outcome

One Warehouse Inventory capability: personal organizational ACT-WH discovery,
exact bounded filters, current-stock pages, canonical Unit detail, associated
Units of a Lot and read-only refresh in the existing Persian RTL browser shell.
No UUID prerequisite for initial list/code search. Exact current kg, source
identity and per-page observation are visible; source initial weight is separate.
Nothing reserves, issues, adjusts, dispatches or promises stock.

| Decision dimension | Exact recommendation FOR PROPOSAL, subject to human decisions |
| --- | --- |
| Initial actor | Current personal organizational ACT-WH only, trusted installation=authority, no customer-bound/temporary/shared admission; no additional PROC/SEC/SALES/Customer browser authority |
| Source families | LEGACY_RECEIPT + I2_RECEIVING (ORDER_LINE/ORDER_ONLY/UNLINKED) + PRODUCTION (FINAL/WIP/RESIDUAL), all through Inventory-owned origin projections. Production and allocated/reserved coverage conditional D1; no pre-existing all-family authorization claimed |
| Current discovery states | AVAILABLE, RESERVED, PACKED, ISSUED_TO_PRODUCTION, PARTIALLY_CONSUMED; default all5, optional one exact state |
| Historical navigation | Unit/Lot can show CONSUMED and SHIPPED with zero kg and HISTORICAL label. No terminal-state general discovery or invented SCRAPPED/RETURNED/CLOSED semantics |
| New reads | DiscoverInventoryUnits v1, GetInventoryUnitDetail v1, ListInventoryLotUnits v1; exactly3browser POST routes under `/ui-api/inventory/v1/` (below). Existing legacy routes unchanged |
| Fields | Unit/Lot ID, stored kind/location/state, stockClass/origin, actual internalCode/productCode/productNumber/materialId or null, exact onHand/reserved/unreserved kg; detail adds ONLY family-specific source identity/initial kg/provenance and recorded count or I2 catalogue ID/profile or original production disposition |
| Filters | Exact unitId, lotId, materialId, internalCode, kind, locationId, state, origin, ANDed. No fuzzy/free-text, product-number/code search, guessed labels or customer input |
| Pagination | Scoped unit_id ASC UUID keyset, limit25default/max50, limit+1authorized lookahead; HMAC cursor <=2048chars bound to query/filters/page size/Lot/principal/session/scope/policy revision;10minute ORIGINAL TTL. Per-page RR snapshot, no cross-page snapshot guarantee |
| Resource bounds |8KiB body/depth4, <=51Units, <=10000Ledger rows and4Inventory data statements/request,128KiB complete response;16active reads/process;1s lock/4s statement/8s full handler deadlines,15s client timeout. All proposed, unbenchmarked |
| Query/index change | New nonlocking Inventory reader; no IPS.snapshot per row. Six proposed indexes only, separate D3 approval, no new table/column/data migration/writer |
| Freshness | observedAt/respondedAt, PAGE_SNAPSHOT, LEDGER_VERIFIED_BALANCE; Ledger sums=Balance=claim checked per page; no stale cache fallback or rebuild |

Exact proposed routes (all browser-only POST reads):

- `/ui-api/inventory/v1/units/query`
- `/ui-api/inventory/v1/units/detail`
- `/ui-api/inventory/v1/lots/units/query`

Refresh repeats these reads; there is no mutation or separate refresh endpoint.
The contract document owns exact input/output/error/cursor definitions and the
source matrix owns every field's authoritative origin; this summary grants no
additional fields. Lot means authoritative Unit association, including a shared
production ProductBatch, not a fabricated universal Lot master or stock aggregate.

## Required Owner decisions — all OPEN

### D1 — Customer isolation and all-origin stock disclosure

**Existing verified fact:** customer-allocated/reserved content requires its
owning customer isolation key. Organizational WH may read unallocated intake;
existing legacy snapshot admission is AVAILABLE/empty customerScope only. All
production outputs carry a customerScope; reservation/production issue can leave
an original receipt Unit's customer_scope empty while binding a customer. WH
activation or whole-arrival read authority does not grant unrestricted discovery.

**Recommended decision:** explicitly approve a narrowly amended Inventory-only
organizational WH disclosure rule for this exact whitelist across all3origins and
five current/two detail-terminal states in the trusted installation, including
allocated/reserved and production customer stock. Internal isolation keys remain
in storage and enforcement; no customer ID/name, demand/order/reservation/operation,
Ledger/audit or commercial document disclosure follows. No source-document owner
port is broadened. Authorize the new Inventory read port under this exact exception.
This is a proposed policy change requiring actual human authority, not a reading
of existing policy that already permits it.
Any future grant must explicitly cover the corresponding canonical isolation/RBAC/
query-contract documentation amendments; this design task makes no such amendment.

**Alternative for an explicit narrower Owner decision:** organizational AVAILABLE
unallocated legacy/I2 only, excluding active claims/issues and production. The UI
must clearly say it covers unallocated intake stock; all-family coverage remains
deferred. This cannot be silently substituted for the requested desired outcome.
If the Owner requires current customer-key isolation without the proposed exception,
design a separately authorized customer-selection/grant journey later; inventing
organizational all-customer grants or a browser customer selector is outside this
package. D1 unresolved blocks all-family implementation.

### D2 — Integer-kg instruction versus accepted exact production quantities

**Existing verified fact:** legacy measured intake and I2 per-unit W1 are positive
whole kg. General accepted MAKE/IPS supports up to18decimal places; only actual
Coil-to-Sheet measured paths are whole kg. Non-Coil fractional completion is
explicitly accepted in source tests. Current origin and original receipt remainders
can therefore be fractional. This is existing behavior, not a proposed new feature.

**Recommended decision:** clarify that P4a preserves all integer kg exactly and
also displays accepted fractional Inventory kg as exact canonical strings without
rounding, Number conversion or fabricated precision. Approve the ExactKg contract
and Persian string formatting in the design. Do not change accepted business
posting precision or use W2/W3. If the Owner requires exclusively integer kg for
ALL current stock, stop P4a implementation pending separate domain-policy impact
work; an integer-only filter, hidden fractional records or technical-error label
for legitimate fractions is not an acceptable workaround. D2 remains OPEN; this
design does not override the directive's integer-kg requirement.

### D3 — Explicit index-only migration authority

**Existing verified fact:** scoped Unit/Ledger/Balance/claim/origin keys exist,
but Unit Lot/state/kind/location discovery and Inventory exact-code indexes do not
cover the proposed access paths. There is no representative EXPLAIN/benchmark in
this task and no proven assertion that current indexes meet the thresholds.

**Recommended decision:** separately include ONE additive index-only migration in
future P4a scope for the six exact proposed keys in the contract design: Unit
scope+lot+unit, scope+state+unit, scope+kind+unit, scope+location+unit; legacy origin
scope+internal_code(C)+unit and I2 origin scope+internal_system_code(C)+unit. No
rewrite of0001–0018, data backfill, new table/column/constraint, enum or writer.
Retain only indexes justified by real isolated read plans; do not silently add
different/combined keys if measurements identify another need. If migration is
not approved, approve an explicitly smaller measured filter/performance scope
after evidence, or keep implementation blocked; no undocumented table-scan fallback
or authorization inferred from tooling access. No migration is executed now.

### D4 — Exact bounded implementation, verification and acceptance grant

**Recommended decision after D1/D2 resolution:** approve the three v1reads, exact
whitelist/filter/state/cursor/freshness/error/browser/UI definitions and query bounds
in this package, D3's chosen migration scope, and one coherent implementation
increment with internal engineering stages. Include necessary product and test
changes under the frozen Windows stack plus measured performance validation.
Explicitly retain separate independent engineering/security/database/QA review,
remediation, exact-revision Owner acceptance and no remote push/deployment/pilot.
No stage is automatic authority for optional features or a later backlog slice.

Proposed initial performance acceptance: declared synthetic100000Units/all origins/
states/customer and installation distractors; >=200requests,10readers+2writers,
warm p95<=1s/p99<=2s, <=8s handler, no Inventory writer-lock acquisition/contention
from reads and <=10%writer-p95 regression vs same-load baseline. Exact filters,
negative/late-cursor cases and ledger overflow must be measured, not assumed.
These values are engineering recommendations for Owner acceptance, not observed
factory volume, an answered OQ-014 or existing benchmark results.

## Implementation stages and evidence needed for acceptance

Recommend one bounded increment, using these internal stages without new scope
documents for each stage:

1. Inventory secure read projection/API plus explicitly approved indexes: decided
   policy before pagination/enrichment, Ledger/Balance/claim/issue integrity,
   deterministic opaque cursors, strict shapes/bounds and legacy compatibility.
2. Native Warehouse integration: existing cookies/CSRF/host/CSP/no-store guards,
   RTL list/filters/Unit/Lot/refresh, keyboard/focus and exact quantity rendering;
   session epoch plus same-actor view generations and P1/P2 recovery preservation.
3. Full Windows unit/component, real restricted-role PostgreSQL, actual Chromium
   and performance/regression verification. The detailed
   [test matrix](P4A_INVENTORY_READ_CONTRACT_DESIGN.md#verification-and-acceptance-design)
   includes each origin/state, exact and fractional decision boundaries,
   Ledger/Balance agreement, isolation, concurrent stock changes, cursor attacks,
   expiry/revocation/actor replacement, query limits and proof of no Inventory
   effects from reads. No mocks for transactional/locking/performance proof.
4. Independent engineering, security, database and QA review with source/evidence,
   fix every blocker/required improvement, retest and re-review corrections.
5. Document delivered behavior/limits/actual evidence, final diff and whitespace
   checks, coherent local revision, then explicit Owner acceptance of exact product
   revision. Hosted CI evidence distinct from local results; no factory acceptance
   implied. Stop for Owner push/separate next-slice direction.

Acceptance requires every approved source/state/field and screen/state to work;
no hidden customer/commercial information; accurate per-read freshness and exact kg;
no per-row writer locks or partial corrupt pages; demonstrated bounded and usable
queries; passing relevant P1/P2 and Inventory/Identity regressions; no required
review item or known high/critical defect; all evidence available and no required
check skipped. Unavailable tests/plans block acceptance. Documentation presence
does not deliver software or increase the accepted backend count.

## Privacy and operational exclusions

No customer/commercial IDs/documents, unrestricted raw Ledger/audit/outcomes,
secrets/tokens, driver/vehicle/supplier detail or arbitrary source enrichment.
WH seeing allowed stock does not gain customer-scoped Sales/production/trace
navigation. Authorization is server-side before paging/counts/enrichment and
freshly rechecked after releasing snapshot; private unauthorized/not-found objects
have identical404; hidden rows never contribute totals or cursor anchors. Browser
state clears on expiry/replacement/revocation and old async results cannot return.

No Inventory mutation, repair/rebuild, reservation/release/TTL, shipment/production/
Sales/accounting action, general history/export, QC, portal ordering, devices,
opening stock/corrections, new role/shared identity, dependency/framework/platform,
native containment, new factory master data/provisioning, P3pilot/UAT/deployment,
P4b/P5work, push or history rewrite. P3's operational gates remain unchanged.

## Design-task validation receipt

This section records only work actually completed for the documentation task;
future product tests above are PLANNED. Independent review by a separate
non-author agent covered engineering, security, database and QA design using the
relevant project review skills: **PASS, no remaining blocking/required design
finding**. One medium REQUIRED improvement was fixed and re-reviewed: explicit
state/quantity/ACTIVE-claim/ACTIVE-issue checks, whole-unit PACKED integrity and
original-issued versus current-remainder semantics, with proposed corruption
tests. The exact IssueAllocatedMaterial command name was also corrected. This
review assessed source/design consistency, not executable behavior or human
policy/implementation acceptance. D1–D4 remain OPEN.

Documentation validation covers all5changed Markdown files, local link targets,
metadata dependency resolution/new-ID uniqueness, UTF-8 replacement characters,
unchanged APR-000throughAPR-047 sequence and diff scope. Initial validation found
zero link/dependency/encoding errors; final counts/checks are retained in ignored
`artifacts/tests/p4a-design-validation.log`. Product/test/schema/dependency/tooling/
governance tracked paths remain unchanged. Final working/staged Git whitespace
and diff checks accompany the documentation-only commit; its hash/clean-tree
result is reported at handoff rather than embedded circularly here.

No SQL/EXPLAIN, PostgreSQL, Chromium, application test or hosted CI was executed
for this package. No performance benchmark, factory UAT, production readiness or
product implementation acceptance is inferred from this review or commit.

Recommended next explicit Owner action: resolve D1 and D2, decide D3, then issue
a bounded implementation grant for D4 with those exact outcomes and exclusions.
Do not start coding, a pilot or another slice from this proposal.

**P4a DESIGN READY FOR OWNER DECISION — IMPLEMENTATION NOT AUTHORIZED**
