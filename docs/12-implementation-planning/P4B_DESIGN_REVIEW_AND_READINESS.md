---
id: PLAN-P4B-READINESS-001
title: P4b discovery and design review and readiness
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [delivery-lead, security-architect, data-architect, qa-lead]
depends_on: [PLAN-P4B-CAPABILITIES-001, PLAN-P4B-DESIGN-001, PLAN-P4B-DECISIONS-001, APR-049, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-11-07
approval: null
---

# P4b design review and readiness

**Current authority:** [APR-050](../00-governance/approved-baselines/APR-050-p4b-sales-ui-implementation-authorization.md) approves D1 B, D2 A, D3 A, D4 A, D5 A and conditional D6 A / D7 A. The proposal and OPEN wording below records the historical design baseline. Bounded implementation is now authorized; [current delivery evidence](P4B_IMPLEMENTATION_STATUS.md) records reality. Numeric performance and final acceptance remain Owner decisions.

**HISTORICAL DESIGN PROPOSAL — superseded only within APR-050 bounds**

This package documents the actual Owner discovery/design-only grant, not a new
product acceptance. Baseline `main` at `506dd000e87c331527445e8212656cfc2aefc756`,
clean at start. P4a remains accepted at
`6c0fbbbed05eeb81ccf7564b2bbd7cfc7caebf10` / APR-049. The pinned skill prerequisite
is resolved by the baseline tooling commit. No existing APR is revised or new
APR invented. [Current phase](../00-governance/CURRENT_PHASE.md) records the new
limited authority, with no executable gate/unlock change.

## Task execution and design Definition of Done

1. Verify baseline/governance, accepted Sales/Identity/Inventory/MAKE and P1/P2/P4a.
2. Inspect actual services, transport, stores, migrations and test source; classify
   reality separately from architecture, proposed contracts and planned UI slices.
3. Produce capability matrix, bounded contract/RTL interaction design and OPEN
   Owner decisions, grounded in native shell and mandatory skill guidance.
4. Obtain independent engineering/security/database/QA-UI source reviews; correct
   design defects, preserve policy choices as OPEN and obtain re-review.
5. Validate source/local links/metadata/decision statuses/document consistency,
   whitespace and docs-only staged scope; make one local commit, report hash/clean
   state and stop for explicit Owner decisions and implementation directive.

Design DoD does not include runtime P4b tests: no P4b product exists. Design-ready
means Owner-reviewable with no unresolved required design defect. It does not
mean policy-approved, implemented, accepted, tested in Chromium or operationally ready.

## Independent review register

Independent specialists inspected actual source before review of the written
package; they did not author these documents or product changes. Discovery
findings already incorporated include six rather than five commands, immutable
saved drafts, missing browser Sales grants/transport, no standalone Sales stock
read, multiple assessments, separate org invoice exception and precise kg limits.

| Reviewer | Source inspection / design review scope | Current outcome |
| --- | --- | --- |
| Engineering — p4b_engineering | erp-api-review / actual Sales service/contracts/store/transport/composition, APR-022/025 and accepted delivery/test evidence | CLEAR after targeted re-review; no required finding remains |
| Security — p4b_security | erp-security-review / Identity branded contexts, current grants/replay, browser admission, Sales and Inventory gates, isolation policy | CLEAR after targeted re-review; SEC-P4B-DESIGN-01 CLOSED |
| Database — p4b_database | erp-database-review / actual Sales/Inventory SQL, numeric constraints, owner locks/transaction/replay/MAKE, reservation/shipping | CLEAR after targeted re-review; DB-P4B-01/02 CLOSED |
| QA / UI — p4b_qa_ui | erp-test-review, erp-frontend-review, pinned ui-ux-pro-max / Sales test source plus native operator/intent/Inventory lifecycle | CLEAR after targeted re-review; QA-P4B-01 CLOSED — VERIFIED |

All reviews and re-reviews were source/document inspections on 2026-11-07, not
runtime test executions. These were design clarifications, not newly discovered
accepted-product defects. Genuine Owner policies in D1–D7 are not review defects
and cannot be approved by specialists.

| Finding / class | Evidence and correction | Re-review disposition |
| --- | --- | --- |
| Engineering scope ambiguity / REQUIRED | Workflow allowed known-UUID STOCK then implied all deferred discovery required MAKE/read-only. Explicit D1 B+D4 A, D1 B+D4 B and D4 C→D1 A/C combinations now match decision options. | Independent engineering CLEAR; closed |
| SEC-P4B-DESIGN-01 / medium, REQUIRED | Roster has no selected customer; org-context admission and any-grant reauthorization would be wrong. Specify authenticated session + bounded Identity grant intersection, bootstrap marker only and fresh every-returned/lookahead grant checks; whole-page fail on revocation. D2/tests updated. | Independent security CLEAR; closed |
| DB-P4B-01 / low, REQUIRED | Future P4c UI was conflated with existing allocation backend. Allocation authority now explicitly accepted Reservation commands, outside P4b. | Independent database CLEAR; closed |
| DB-P4B-02 / low, REQUIRED | Installation and authority were written as universally equal. D2 now uses trusted installation/authority tuple, preserving separately scoped identities. | Independent database CLEAR; closed |
| QA-P4B-01 / medium, REQUIRED | Separate recovery namespaces could imply two unresolved writers. A tab-wide PROC/WH/Sales interlock now blocks every new write, preserves ciphertext and fails closed for multiple existing records; actual future Chromium tests cover both role directions. | Independent QA/UI CLEAR; closed — verified |
| Engineering lexical bound / nonblocking clarification | Exact stock code filter now explicitly follows Inventory's 128-code-point/512-byte/control/Unicode validation and exact equality without normalization. | Incorporated and independently checked |
| Final source cross-check / accuracy clarification | Migration0013 and sales-store return default STOCK on DRAFT point reads. Proposed summary omits DRAFT mode; UI states method not yet recorded regardless of stored default, without changing existing point DTO or business state. | Independent engineering and database source re-review CLEAR; closed |

No blocking or required design finding remains. Implementation/security/database/
QA acceptance still needs fresh review of the future actual implementation.

## Future implementation acceptance criteria

All criteria are **PROPOSED / NOT EXECUTED FOR P4b** and become applicable only to
the Owner-selected scope. No copied P4a count or latency is a P4b result.

| Area | Required future proof and observable outcome |
| --- | --- |
| Contracts / unit tests | Exact allowlisted routes/fields; no unknown/duplicate JSON; UTF-8 command-size boundary; all six unchanged command envelopes if D1 B; exact whole demand strings, >2^53 values, forbidden decimals/grouping/digits/control/extra fields, 1/8/9-line boundaries, explicit partial choice. String-based display preserves exact fractional Stock digits. No monetary zero substitution. |
| Sales lifecycle | Real DRAFT→SUBMITTED→CONFIRMED; DRAFT immutable save; assessment allowed DRAFT/SUBMITTED order, repeated assessments independently listed; STOCK/MAKE recording immutable; explicit own assessment confirmation; no direct Sales IN_PRODUCTION action. STATE/DUP/CONFLICT cases; MAKE creates no Production; confirmation no reservation. |
| Real PostgreSQL | Verified Windows PostgreSQL 18.6 disposable environment, separate restricted runtime/DDL owner roles and safeguards; complete required root integration invocation at exact final revision with exit0 and no required failures/skips, retained complete command/env/output/counts. Do not replace actual invariants with mocks. Restore initially stopped cluster afterward. |
| Transactions / concurrency | Preserve Sales lock order/current grants/one transaction audit+outcome; two orders observing same unreserved stock; Record/Confirm vs reservation/issue/dispatch races; same-key competition, new-key binding conflicts, rejected replay, audit/statement failure rollback and lost COMMIT response. Do not call timeout failure or issue new-key retry. Existing SQL immutability and privileges pass. |
| Customer / actor isolation | Same person legitimately granted A+B switches selector, forged/ungranted customer, duplicated/missing headers, org-only Sales, ACT-CUST, WH+Sales role confusion, temporary actor, foreign installation/authority, disabled account/revoked session/grant and actor replacement. No resource/count/filter/lookup/label/lookahead/enrichment leakage before paging or error disclosure. |
| Roster-specific isolation | Customer-granted Sales without any org Sales grant can load only its authorized configured roster. Bootstrap returns no unbounded Sales IDs/names/grants. Revoke one returned/lookahead customer's grant while another remains valid: whole page/cursor must not disclose revoked membership. Authenticate roster without inventing an org context. |
| Pagination / snapshots | Boundary pages/empty/limit+1 under authorized scope, sparse customer/state/type sets, malformed/tampered/expired/wrong-account/session/customer/query/page-size/parent/policy cursors, original TTL not renewed, stable UUID ordering, multiple assessments, per-page timestamps not frozen traversal. Revoke during snapshot and after release; fresh reauthorization denies materialized result/private error. |
| Inventory candidate (only D4 A) | All permitted origins and org/same-customer scope; deny foreign-customer/unsupported/claimed/issued/non-AVAILABLE candidates without leak; exact fractional kg and broad-type matching; Ledger≠Balance/claims/issue disagreements fail closed; no unauthorized rows in lookahead. Reads acquire no Inventory writer locks, never mutate Ledger/Balance/claims/Unit/assessment. Actual command recheck handles stale page and insufficient/mismatched selection. |
| Browser security | Actual cookie-only same-origin allowlist; exact/unique Host/Origin/selector/CSRF, same-origin fetch metadata, reject bearer/proxy/role override/cookie ambiguity. CSP/no-store/no-referrer/frame denial preserved; strings render as text; no credentials/plaintext pending payload persisted or logged. Current grants gate every request/replay. |
| Chromium critical journeys | Real running backend and real PostgreSQL: customer selection/no UUID list, state/type/exact filters/full paging, detail/line/assessment navigation, immutable draft→submit→STOCK/MAKE→confirm where approved, current grant denial, stock change rejection, empty/error/cursor restart, duplicate-submit prevention and exact canonical readback. Record actual checks/versions/receipts, not screenshot-only or mocked calls. |
| Chromium lifecycle races | Delay success/error/finalizer; change customer/role/logout/account/session/expiry/page/nav and prove no stale data or recovery revival. Superseded403 cannot lock newer workspace; current403 does lock. Same-account CSRF/cookie rotation invalidates old replies. Back navigation cannot self-loop. Same-key encrypted unknown retry, storage denial before first dispatch, definitive rejected recovery, accepted write with failed supplementary read, read-only navigation retains pending intent, dirty-form choice, refresh/reentry/multitab replacement; old PROC/WH pending namespace remains intact. |
| Cross-role command interlock | Actual Chromium PROC/WH unresolved intent→Sales and Sales unresolved intent→PROC/WH: all new writes blocked, original ciphertext preserved, only exact-context same-key recovery or informed close allowed. Role/customer switches cannot overwrite or create a second unresolved intent; multiple existing records fail closed while each is resolved. Read-only navigation retains interlock. |
| Persian RTL / accessibility | 375px, tablet/desktop and landscape, 200%/400% zoom, exact big/decimal strings and long Persian/Latin identifiers, RTL reading/bidi isolation, no essential clipped content/body overflow; keyboard-only form/table/navigation/confirmation, named controls, linked errors/focus summary, unobscured focus, state text and measured contrast, reduced motion, screen-reader semantics. Validate actual browser, not inferred skill compliance. |
| P1/P2/P4a regression | Preserve current authentication/session/customerless PROC/WH projection, original purchasing/register/catalogue/receiving/Inventory flows and immutable recovery. Run existing appropriate unit and complete PG suites plus actual accepted browser critical/race journeys. APR-047 historical257trigger remains UNKNOWN/nonblocking as recorded; any new failure needs fresh diagnostics, never automatic historical classification. |
| Performance / migration | D7 workload and numeric budgets must be resolved before acceptance. Real DB SQL plans, representative and skewed data, read/writer overlap and no lock-attributable waits; new indexes require retained access-path and with/without-index write cost evidence, no changed accepted migration bytes. Preserve bounded page/source/cardinality failure without misleading partial results. |
| Independent closure | Fresh engineering/security/database/QA-UI review of actual final implementation and evidence, fix/retest all required findings, no known high/critical defect, record limitations honestly; explicit Owner software acceptance separately. No design review is substituted for implementation review. |

### Performance methodology and prerequisites still unquantified

No Sales transaction volumes, customer/grant skew or numeric response/writer
budget is established by this task. OQ-014 planning population is not throughput.
Use Owner-selected operations: customer roster, first/next/filter/detail/assessment
pages, and stock candidate selection if included; measure each separately rather
than a blended latency hiding a slow critical query. Record dataset generator,
seed, actual rows/customer and assessment fanout, source Ledger fanout, page
distribution, cache/restart conditions, hardware/runtime/DB settings, exact revision,
raw samples and intervals with real writer overlap. Report server and end-to-end
browser latency separately, throughput, p50/p95/p99, timeouts/rejections, pool waits,
query plans/buffers and attributable locks/writer waits. Repeat runs to expose
variance. Do not label uncontrolled filesystem cache fully cold.

Read-only/no-writer-lock correctness is mandatory; performance acceptance remains
unquantified until D7 workload/budgets receive Owner decision. Compare same-schema
reader overlap to isolate read impact, and pre/post proposed index schema to
assess index write cost; these answer different questions. New expensive benchmarks
are not run in discovery. APR-049's 2.21% same-index comparison and outstanding
pre-0019 migration-wide writer-cost deployment gate retain their original meaning.

## Design risks and residual decisions

- D1–D7 all OPEN / Owner approval NULL. New browser/roster/order/assessment/stock
  reads are absent today. Policy/disclosure and scope choices require Owner input.
- Customer grant configuration and actual Sales personnel remain real inputs,
  not named employees inferred from factory evidence. Roster scalable grant access
  needs proof; missing configured customer reference cannot become an editable CRM.
- UUID browsing is deliberately nonchronological; human Order Code remains absent.
  Persisted drafts and recorded assessments cannot edit. Surface those constraints
  clearly or return a scope decision rather than inventing new commands.
- Broad type and sufficient kg are not dimension compatibility or allocation.
  MAKE selection is not production release; Shipping does not close Sales.
- Existing legacy Sales query checks in-transaction; proposed browser fresh
  post-release disclosure authorization must be implemented/tested later.
- No new functional/runtime/PG/Chromium/performance PASS is claimed for P4b.
  Existing P4a unit271/PG398/Chromium25 are accepted historical evidence only.
- No product code, tests, dependency, migration, policy, gate/unlock or existing
  APR edits are authorized here; no push/deploy/pilot/P3/adjacent UI work.

## Documentation validation and completion

Independent engineering, security, database and QA/UI design closure is complete.
Final local link/metadata/OPEN-decision/whitespace and docs-only scope checks are
recorded with the delivery evidence; no product test result is substituted.
Documentation validation passed 10 Markdown files, 840 local references,
5 anchors and 125 metadata dependencies, with no missing target, duplicate ID or
metadata error. APR-000 through APR-049 remain contiguous and unchanged. All seven
decision sections retain OPEN / Owner approval NULL. The pinned skill verifier
passes; no skill payload/lock/AGENTS change is part of this documentation task.
Local receipts are `artifacts/tests/p4b-design/documentation-validation.json`
and the final Git scope receipt, both ignored. Windows-only source/document checks
and local Graphify refresh are the applicable validation; no database was started
and no P4b browser or performance test was run.
The local delivery message will report the documentation-only commit hash;
this document does not attempt to contain its own commit hash.
After the completed design commit, stop for explicit Owner decisions and a
separate bounded implementation directive. P4b remains not implemented/not accepted.
