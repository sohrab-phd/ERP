---
id: PLAN-P4C-READINESS-001
title: P4c discovery and design review and readiness
phase: 12-implementation-planning
status: in_review
version: 0.2.0
owners: [delivery-lead, chief-solution-architect, security-architect]
depends_on: [PLAN-P4C-CAPABILITIES-001, PLAN-P4C-DESIGN-001, PLAN-P4C-DECISIONS-001, PLAN-DEV-WORKFLOW-001, GOV-CODEX-CONTEXT-001]
last_reviewed: 2026-11-08
approval: null
---

# P4c design review and readiness

**Current authority:** [APR-053](../00-governance/approved-baselines/APR-053-p4c-reservation-ui-implementation-authorization.md)
records actual bounded implementation approval against `797e8c03feb3a995085e6ef17c0e1fd0c52336ed`.
The design review/validation below is historical at that revision, not fresh
implementation evidence. Separate protected reconciliation is pending; product
implementation/verification have not begun. The [execution plan](P4C_IMPLEMENTATION_PLAN.md)
and [unapplied reconciliation proposal](P4C_GATE_RECONCILIATION_PROPOSAL.md) govern
next work. Target is IMPLEMENTED AND VERIFIED — OWNER SOFTWARE ACCEPTANCE PENDING.

Documentation/design only under the actual 2026-11-08 Owner authorization, from
clean `main` `6ebd3eca11fced994e58a01b8fde354c1e957416`. No product code,
endpoints, migrations/indexes, protected configuration or business-policy changes.
No deployment/pilot, remote push or subsequent-slice work. Readiness here means
a reviewable design proposal; it is not software acceptance or implementation
authority. D1–D7 remain OPEN / Owner selection NULL.

## Task execution and design Definition of Done

1. Verify bounded authority/accepted baselines and retrieve relevant evidence
   using index, local Graphify and targeted source inspection.
2. Classify actual Reservation/IPS/Sales/Shipment behavior versus UI/read gaps.
3. Specify native Persian RTL workflow, exact proposed contracts, trust/data
   boundaries, partial/conflict/uncertainty behavior and explicit Owner choices.
4. Obtain independent engineering/API, security, database and QA/UX design review;
   fix required findings and obtain re-review without weakening analysis.
5. Validate documentation sources/links/metadata, OPEN decisions and docs-only
   diff; run git diff --check; create coherent local documentation commit and stop.

Design DoD requires traceable supported lifecycle/actions, actual capability
limits, permission gaps, owner/transaction boundaries, future meaningful proof,
all required design findings closed and no fabricated human decision. Owner
choices and future implementation evidence may remain open explicitly.

## Independent review register

Three independent source reviewers did not author the package. Combined
engineering/API and QA/UX review is proportionate and retains each discipline's
scope. They used applicable project review skills and inspected real sources,
not only the author's conclusions. All reviewed the four written drafts after
source discovery, on 2026-11-08; no reviewer edited or authored this package.

| Reviewer | Independent source and proposed-design scope | Outcome |
| --- | --- | --- |
| engineering_qa_review — engineering/API | Reservation/Sales contracts, owner boundaries, HTTP, envelope/idempotency, capability claims | PASS; no blocking/required finding |
| security_review — security | Identity/current grants, customer isolation, browser/session/recovery, disclosure and negative-test design | PASS; no blocking/required finding |
| database_review — PostgreSQL | Actual migrations/stores, lock order/priority/claim uniqueness/consumed coverage, read plans and writer implications | PASS; no blocking/required finding |
| engineering_qa_review — QA/UX | Test sources, actual versus planned proof, native Persian RTL workflow, mandatory UI skill/hash verification, blocked/partial/uncertain cases | PASS; no blocking/required finding |

Database nonblocking clarification incorporated: current-stock Ledger/Balance
reconstruction applies to availability projections, not each historical
reservation-list row. Existing owner lifecycle facts back reservation history.
All required design findings: **NONE OUTSTANDING**. Static source/design review
does not establish future implementation correctness or factory UAT.

## Required future implementation evidence

All below is **PLANNED**, not executed P4c results. Accepted test records are
historical; inspected executable tests are source evidence only. Design-only
work needs documentation/source validation, not unrelated product suite reruns.

| Area | Observable proof required if implementation authorized |
| --- | --- |
| Contracts and quantity | Exact chosen route/field allowlists, unknown/duplicate keys, method/UTF-8 limits, UUIDs/enums/cursor expiry and material binding; whole kg limits including >2^53 and <10^20, reject decimals/grouping/localized/control input rather than round; exact fractional Inventory display and comparisons. D4 A whole-unit-only creation and legacy partial visibility/activation; D4 B explicit partial acknowledgement if selected. |
| Discovery and owner reads | Real-PG scoped-before-filter/page/aggregate/enrichment, stable bounded UUID traversal, no unauthorized lookahead or cursor reuse, missing/foreign nondisclosure, whole-page failure on incompatible evidence; only confirmed STOCK original selected IDs, ≤16 Units/≤8 lines, MAKE/IN_PRODUCTION rejected, null codes/no private-filter oracle. Totals count all REQUESTED/ACTIVE/CONSUMED, not page rows. |
| Inventory truth | Existing owner verification of Ledger=Balance/claim/issue/source evidence; no Inventory command locks or mutations; AVAILABLE remains observed/advisory; unavailable selected IDs expose no reason/claim owner. Fractional or larger-than-capacity stock blocks D4 A without floor/split/substitute. Stock drift after read uses unchanged authoritative activation guards. |
| Real command behavior | Request may succeed despite zero free kg/nonavailable state; failed activation leaves immutable REQUESTED counting demand. Test two requests racing line cap, two same-Unit activations/exactly one ACTIVE, partial claim blocks own/other second claim despite leftover kg. Existing whole-Unit dispatch constraint remains; no UI split/top-up/release. Multi-Unit sequences show independently committed progress. |
| Priority/concurrency | Exact microsecond earlier confirmation/UUID tie, internal foreign-customer contenders without disclosure, fully covered earlier demand, REQUESTED not coverage, verified CONSUMED coverage; request/activate/dispatch interleavings with deterministic barriers and fresh post-lock current authority. No business rule recomputed in browser. |
| Transaction/replay | Existing atomic request/claim/Ledger/Balance/Unit/audit/outcome, business rollback, technical abort, process/crash/lost COMMIT, accepted/rejected same-key replay and conflict material reuse. Current revoke after lock/before replay; no duplicate posting after recovery. Use isolated real PostgreSQL/runtime/migration roles under frozen Windows tools; no mock substitution. |
| Browser security | Exact cookie same-origin/Host/Origin/fetch/CSRF framing, reject bearer/role/customer spoof/duplicate selector; current exact-customer permission before disclosure including post-snapshot revocation, no WH Reservation read inheritance or broad Sales grants, no raw bindings/audit/competitors; no-store/CSP/text rendering and sanitized errors/logs. |
| Session and recovery | Actual Chromium delayed success/error/finalizer across customer/role/account/session/CSRF rotations, logout/idle/focus/pageshow/broadcast; current denial locks, old denial cannot affect new workspace. Persist-before-send failure/tampered/wrong-AAD/multi-record/unreadable storage; pending Reservation blocks PROC/WH/Sales and vice versa. Same-key exact original retry, no automatic activation/replay, definitive receipt resolved before failed readback, ambiguous denial retains intent, informed close never cancellation. |
| Workflow/accessibility | Actual Chromium authorized roster→order→selected stock→request→explicit activate→detail; loading/empty/no-grant/no-eligible/revoked/blocked/cursor-restart/CONSUMED states; generic conflict and persistent-request warning; keyboard/focus/error summary/status semantics, 375px/200%/400% reflow, contrast/RTL identifiers, exact kg and reduced motion. Check Warehouse workflow regression, Sales usability and Production ineligibility/no unauthorized fetch. Static design review is not factory UAT. |
| Performance/regression | Owner-decided D7 workload/history/budgets, SQL plans and bounded timeouts/cancellation, repeated/skewed pages, same-schema readers plus real request/activation/dispatch/Sales/receiving writers; preserved P1/P2/P4a/P4b regressions and required full acceptance scripts. New index requires separate evidence/Owner authorization and migration-wide implications. Preserve both existing performance gates/exceptions. |
| Closure | Fresh independent implementation engineering/security/database/QA-UX reviews, all required findings fixed/retested, no high/critical defect, current canonical docs and final diff checks; explicit Owner software acceptance separately from engineering readiness. |

## Residual decisions and actual project state

Main design risks: immutable blocked requests can consume all request capacity;
partial reservation can be unshippable; discovery is stale and not priority proof;
new read surfaces need explicit permission; customer-wide/history query cost is
unmeasured. The [D1–D7 sheet](P4C_IMPLEMENTATION_AUTHORIZATION_DECISIONS.md) assigns
Owner choices rather than treating them as engineering approval.

P1 purchasing, P2 receiving, P4a Inventory visibility and P4b Sales UI remain
accepted. Accepted Reservation/Shipment backends exist; Reservation UI is proposed
here, Shipping UI/P5 role workflows and P3 operational validation remain later
work. No percentage of ERP completion is inferred from document counts.

Next possible implementation is bounded P4c after explicit Owner authorization;
naming it does not start it. P4a pre-0019 migration-wide writer-overhead deployment
gate remains **OPEN**. P4b D7 remains **OWNER-ACCEPTED WITH DOCUMENTED
RELATIVE-WRITER-REGRESSION EXCEPTION**, original failed relative criterion and
UNKNOWN cause retained; no further relative-only investigation.

## Documentation validation and completion

Final independent design/source reviews and targeted database/governance/security
re-reviews: PASS, no blocking/required finding. Local documentation validation
passed six Markdown files, 470 local links, two anchors and 84 metadata
dependencies (frontmatter IDs plus canonical registry heading IDs). All seven
Owner decision rows remain OPEN / NULL; APR-000 through APR-052 remain contiguous
and unchanged. Six accepted product/closure baselines were verified ancestors of
the starting revision. Diff scope is exactly the four package files plus current
phase and index discovery updates; no accepted product/migration/control changed.

The vendored skill verifier and documentation checker passed with frozen Windows
Node24.21.0. Nonpersisting offline skill queries were verified with reviewed
Python3.12.12 in isolated/no-bytecode/no-site mode. Final receipts are retained
locally (ignored) at `artifacts/tests/p4c-design/documentation-validation.json`
and `artifacts/tests/p4c-design/skill-validation.json`; they are not promised as
remote artifacts. Working/staged whitespace checks and final staged-scope review
passed before the local commit. Local Graphify refresh indexes the final
tracked documentation; the graph remains ignored and is not contract authority.

**DESIGN PACKAGE COMPLETE FOR OWNER DECISION; IMPLEMENTATION NOT AUTHORIZED.**
No fresh database/Chromium/product acceptance run, factory UAT or P4c performance
measurement is claimed. P1/P2/P4a/P4b software acceptance is unchanged. Stop after
the local documentation commit and await explicit Owner implementation authority.
