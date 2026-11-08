---
id: IMPL-P4B-ACCEPTANCE-001
title: P4b final evidence and Owner acceptance package
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [delivery-lead, security-architect, data-architect, qa-lead]
depends_on: [APR-051, APR-050, IMPL-P4B-001, IMPL-P4B-WORKLOAD-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-11-08
approval: null
---

# P4b ready for explicit Owner software acceptance

**P4b is NOT formally accepted.** This package requests a separate Owner decision.
[APR-051](../00-governance/approved-baselines/APR-051-p4b-performance-decision.md)
records approved workload/absolute budgets and the relative-writer exception.
D7: **OWNER-ACCEPTED WITH DOCUMENTED RELATIVE-WRITER-REGRESSION EXCEPTION**.
This is a changed acceptance criterion, not a PASS against the former 20% rule.

## Exact proposed product and scope

Proposed product revision: **`7f30a6f26b6e53c6152d6851f90d1f5ed844f69a`** on `main`.
Closure starts at clean repository revision
`387af4b6ac2aa4486b4c8e495c2ed72eaab02212`. Subsequent standalone harness corrections
and documentation commits do not change product, registered correctness tests,
required runners, packages or any of the 19 migrations. The final handoff reports
the documentation commit separately; it does not attribute later tooling to 7f30a6f.

The [canonical delivery record](P4B_IMPLEMENTATION_STATUS.md) defines the delivered
seven fixed Sales browser routes, exact personally granted customer discovery,
order/assessment reads, narrow Inventory-owned candidates, six unchanged Sales
commands and native Persian RTL workflow/recovery. Customer isolation, fresh
authorization, signed cursors, exact kg, bounded transactions, immutable evidence,
idempotent uncertain recovery and cross-role write interlock remain binding.
There is no new Inventory mutation, business operation, migration, index or dependency.

## Absolute-budget verification from retained measurements

Values are empirical p95/p99 in milliseconds, not worst single-request maxima.
Each read row below is the maximum of the three existing unthrottled tier
percentiles, not a blended percentile. Those heavier-load runs provide coverage
for roster/assessment-detail/stock not exercised by the paced three-read lookup.
Every required read operation is covered; per-case tails are retained separately
(componentwise worst individual-case server p95/p99 97.04/153.17 ms, from
different cases, each below its applicable limit).

| Server read | Retained p95 / p99 | Approved budget | Result |
| --- | --- | --- | --- |
| Customer roster | 71.70 / 107.84 | 100 / 200 | Within |
| Order discovery | 83.73 / 125.84 | 125 / 250 | Within |
| Order detail | 89.39 / 138.46 | 125 / 250 | Within |
| Assessment discovery | 85.31 / 128.83 | 125 / 250 | Within |
| Assessment detail | 82.62 / 127.01 | 125 / 250 | Within |
| Stock candidates | 92.55 / 139.45 | 150 / 300 | Within |

Both normative paced runs completed 200 normal and 280 peak journeys, 10/14 per
person; 600/840 successful HTTP reads, actual 20/40 journeys/minute and zero
request/writer failures. Writers are drawn from the same 20 people. Writer pace
(one five-command Sales cycle and one receipt/second) is synthetic, not measured
factory usage. The retained per-command table covers all six Sales commands plus
Inventory receipts without blending STOCK/MAKE. Across the four normal/peak
windows, the highest writer p95 is 50.95 ms and highest p99 is 202.33 ms; each
operation is within its approved 250/400 ms absolute budget. Even the earlier
unthrottled per-operation tails remain below those absolute limits (largest
p95/p99 191.81/270.31 ms). This does not assert the old relative rule passed.

Worst percentiles per operation across retained overlapping writer cohorts
(componentwise maxima, not a combined percentile):

| Writer | Retained p95 / p99 ms | Approved budget | Result |
| --- | --- | --- | --- |
| DraftSalesOrder | 104.50 / 202.33 | 250 / 400 | Within |
| SubmitSalesOrder | 112.98 / 165.24 | 250 / 400 | Within |
| DraftFulfillmentAssessment | 113.80 / 182.01 | 250 / 400 | Within |
| RecordFulfillmentStock | 191.81 / 270.31 | 250 / 400 | Within |
| RecordFulfillmentMake | 128.71 / 228.33 | 250 / 400 | Within |
| ConfirmSalesOrder | 160.38 / 219.42 | 250 / 400 | Within |
| PostGoodsReceipt | 113.20 / 163.94 | 250 / 400 | Within |

| Actual Chromium journey, 200 samples each | p95 / p99 | Approved budget | Result |
| --- | --- | --- | --- |
| First-page refresh | 63.08 / 63.75 | 100 / 200 | Within |
| Exact lookup/detail/assessment list | 126.71 / 130.28 | 200 / 400 | Within |
| Assessment detail/stock | 64.10 / 68.14 | 100 / 200 | Within |

UI evidence uses actual Chrome and PostgreSQL on the documented small warm fixture,
without concurrent writers; it is not 20 concurrent DOM sessions. Paced evidence
uses 20 authenticated HTTP sessions with staggered arrivals (maximum one journey
in flight), not a synchronized 20-request burst. No maximum-page, cold-cache,
large/concurrent browser or factory deployment guarantee is claimed. No measured
required operation exceeds its absolute percentile budget; no required operation
is absent from retained evidence at these documented scopes.

The one synthetic history check reached 50,001 orders/90,060 assessments, with
40 plans per dataset and 46 unchanged index definitions. No obvious warm-query
degradation or need for a new index was found; maximum operational history remains
UNKNOWN. There are no new experiments, DB restarts or product changes for closure.

## Evidence index and provenance

All generated artifacts below are retained locally under
`artifacts/tests/p4b-implementation/` (ignored, not embedded in the Git commit).
Tracked generators and source revisions make the methods reproducible; Git alone
does not contain the complete raw outputs. Receipts contain actual invocation,
environment, times, exit codes and hashes, with credentials omitted.

| Gate | Actual result and retained evidence |
| --- | --- |
| Unit | 292 passed, zero failed/skipped, exit 0; `unit-committed-final.log` and receipt, execution at e4747e7 |
| Complete real PostgreSQL 18.6 | 420 passed, zero failed/cancelled/skipped/todo, exit 0; all 41 registered files, no filter/exclusion; `full-postgresql-final-01.log` and receipt, execution at product 7f30a6f |
| Actual Sales Chromium | 30 passed, zero failed/skipped; `chromium-final-06.log`, receipt and `p4b-chromium-results.json`, execution at c437df8 |
| Actual P1/P2/P4a Chromium regression | 25 passed, zero failed/skipped; `p4a-regression-final.log`, receipt and nested results, execution at c437df8 |
| Actual UI timing | `p4b-ui-performance.json`, 600 raw samples, Chrome 156.0.8078.81 |
| Complete operation/case/load coverage | `performance-owner-summary.json`; `performance-small-recovered.json`; `performance-final-03-representative.json`; `performance-final-03-stress.json`; original receipts/logs and small recovery evidence |
| Normative run 1 | `internal20-paced-01.json`, log/receipt, revision 9cac8e6; 20/40 journeys/minute |
| Normative diagnostic repeat | `internal20-paced-02-diagnostic.json`, log/receipt, revision bfd942f; counterbalanced phase order and expanded observer |
| History, waits and both summaries | `internal20-history-01.json`, log/receipt; `internal20-owner-summary.json`; `internal20-wait-correlation.json`; `internal20-diagnostic-summary.json` |
| Preservation / DB cleanup | `internal20-final-handoff.json`; `preserved-baseline-blobs.json`; `internal20-cluster-final-state.json` |

Complete PostgreSQL log SHA-256:
`0b3249fcdc31ff8452c76fd07ab099d6437bacbebea97e6c70f9d52dd2715dbe`.
Small workload's original exit 1 reporting overflow and offline reporting-only
recovery remain explicit; the original invocation is not relabelled successful.
All raw performance results and receipts retain their original pending-status
fields as historical facts. APR-051 and this package carry the later decision.

## Review closure and residuals

Independent non-author engineering/security, database and QA/UI implementation
reviews inspected actual source, tests and runtime evidence. Required idle-renewal,
admission, cursor-expiry, revocation, UI state/reset/accessibility and recovery
findings were fixed and verified. Required measurement/provenance/cohort findings
were corrected and re-reviewed. No known high/critical or required product defect
remains. [Detailed review closure](P4B_IMPLEMENTATION_STATUS.md#independent-review-closure).

For this closure, a separate non-author database/test evidence reviewer recomputed
nearest-rank percentiles from six retained raw performance reports and all 600 UI
samples. All six manifest digests and 129 source hashes per report verified against
current or exact recorded Git sources. All seven writer operations and concurrent
read cases fit their absolute limits; intentional missing-order 404 cases remain
separate from failures. No new execution or artifact modification was needed.

A separate non-author engineering/security governance review checked this closure
diff, actual Owner authority, APR sequencing, links, revision attribution and
preserved boundaries. Its final recheck closed the current-status wording
corrections; no required governance or evidence-attribution finding remains.
Metadata/dependency/link/anchor validation and Git whitespace checks pass.

The first paced normal run's five relative increases (34.89%–55.29%) and 17
attributable wait-poll observations in one sampled cluster remain recorded. The
repeat observed no such waits and no relative exceedance; neither erases the first.
No causal checkpoint/Identity diagnosis is proven. The Owner now accepts this
relative-regression residual risk; it no longer blocks P4b acceptance. No security
or business correctness control is relaxed. Do not reopen that investigation solely
for the historical relative exceedances.

P4a's representative pre-0019 migration-wide writer-overhead deployment/operational
gate remains **OPEN**, distinct from same-schema reader-load measurements.
APR-047's historical UNKNOWN/nonblocking residual retains its classification.
Factory UAT, deployment, backup/restore, training and pilot are not approved here.
Unknown actual writer/history volumes and the stated sampling scopes are retained
limitations, not silently claimed production capacity.

## Requested Owner action and boundary

Review and explicitly accept or return the exact product revision above within
APR-050 scope, APR-051's performance criterion and these recorded limitations.
**Formal P4b Owner acceptance: PENDING; approval: NULL.** No acceptance APR has
been fabricated. No push, deployment, pilot or P3/P4c/P4d/P5 work occurs; P4c is
only a later proposed roadmap slice requiring separate authorization.
