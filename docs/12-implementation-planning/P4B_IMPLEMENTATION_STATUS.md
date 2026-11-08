---
id: IMPL-P4B-001
title: P4b Sales UI implementation and verification evidence
phase: 12-implementation-planning
status: in_review
version: 0.5.0
owners: [delivery-lead, sales-domain-owner, security-architect]
depends_on: [APR-051, APR-050, PLAN-P4B-CAPABILITIES-001, PLAN-P4B-DESIGN-001, PLAN-P4B-READINESS-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-11-08
approval: null
---

# P4b bounded implementation

Authority: actual Owner [APR-050](../00-governance/approved-baselines/APR-050-p4b-sales-ui-implementation-authorization.md).
Starting `main`: `e7e7cafab0b052b34b9fd58fa66269dd74792749`, clean. Accepted
P4a `6c0fbbbed05eeb81ccf7564b2bbd7cfc7caebf10` / APR-049 and pinned tooling
`506dd000e87c331527445e8212656cfc2aefc756` verified ancestors; skill integrity75files
passes. **AUTHORIZED FOR BOUNDED IMPLEMENTATION — NOT ACCEPTED.**

Current D7 follow-up: the Owner supplied an approximately20employee internal-user
ceiling and provisional20Sales-user test profile at1normal/2peak lookups per user
per minute. The [bounded internal-workload evaluation](P4B_INTERNAL_WORKLOAD_VERIFICATION.md)
completed normal/peak, one history check and one diagnostic repeat. The first
normal run exceeds the proposed20%writer allowance for five Sales operations;
the repeat does not reproduce it. Both remain evidence. The subsequent actual
Owner decision [APR-051](../00-governance/approved-baselines/APR-051-p4b-performance-decision.md) approves the workload/absolute budgets and removes the
relative20%rule as a blocking criterion, accepting its residual risk. D7 is
**OWNER-ACCEPTED WITH DOCUMENTED RELATIVE-WRITER-REGRESSION EXCEPTION**.
[Final Owner acceptance package and evidence index](P4B_OWNER_ACCEPTANCE_PACKAGE.md).
The original relative rule is unmet; formal P4b product acceptance remains PENDING.
Earlier unthrottled measurements below remain retained, with their original scope.

## Execution plan and Definition of Done

1. Record actual D1–D7 selections, exact baseline and bounded scope; preserve all
   accepted history and gate new indexes/numeric thresholds separately.
2. Implement bounded current-personal customer roster, Sales order/assessment
   reads, Inventory item-scoped candidate projection, signed cursors and fresh
   post-snapshot authorization. Investigate code confidentiality before disclosure.
3. Add fixed six-command browser adapter and native Persian Sales workspace,
   exact quantities, immutable review/assessment choice, encrypted recovery and
   one unresolved-write interlock across PROC/WH/Sales. Preserve existing behavior.
4. Run focused then full Windows static/unit/real PostgreSQL18.6/actual Chromium
   regressions, invariants, races and security negatives; retain complete evidence.
5. Measure explicit synthetic/representative workload tiers per operation and
   concurrent writers. Propose numeric budgets for Owner decision, no unilateral
   performance PASS; return any index proposal before migration.
6. Independent non-author engineering/security/database/QA-UI implementation
   review, fix/retest required findings; document actual evidence/limitations,
   coherent local commits and clean tree; stop for performance/acceptance decisions.

DoD: approved customer→discovery→immutable draft→submit→explicit STOCK/MAKE
assessment→confirm workflow with no allocation/production/finance expansion;
all strict DTO/isolation/read bounds and exact quantity/recovery/session invariants;
real passing correctness/security/regression/browser evidence and closed required
reviews. Final readiness requires any applicable separate Owner gates; no formal
product acceptance is self-created. P4a's pre-0019 migration-wide write-overhead
deployment/operational gate remains open and outside this slice.

## Current evidence status

Product code is implemented at `7f30a6f26b6e53c6152d6851f90d1f5ed844f69a`.
Standalone measurement corrections are committed at
`c437df8049a86be77fa421b5df16f678895e8a37` and
`e4747e7646d411da6fff580b0389ff3e570b3f26`, followed by reporting-only fix
`6db1854318e4ffe72190ee81baad75f833e9fe84`. Owner-bounded workload and diagnostic
tooling follow at `9cac8e6e1d372ddfd54cc9260d7daf37fd9067ba` and
`bfd942fc382db8aed129d8936aea34c73b874c0b`. There is no product, registered test,
required runner, package or migration difference from7f30a6f in these revisions.
Latest unit run:292passed,0failed/skipped, exit0
at e4747e7 (`artifacts/tests/p4b-implementation/unit-committed-final.log` and its
receipt). Focused PostgreSQL:
22passed,0failed/skipped, exit0 (`focused-postgresql.log`). The complete root
PostgreSQL invocation at7f30a6f passed420/420,0failed/cancelled/skipped/todo, exit0,
all41registered integration files with no name filter/exclusion. Raw complete
output: `full-postgresql-final-01.log`; exact command/environment/count/hash receipt:
`full-postgresql-final-01-receipt.json`. Duration1383660ms; SHA-256
`0b3249fcdc31ff8452c76fd07ab099d6437bacbebea97e6c70f9d52dd2715dbe`.

Fresh actual Chromium atc437df8:30Sales checks and25P4a regression checks passed,
0failed/skipped, exit0, Chrome156.0.8078.81. Receipts/results:
`chromium-final-06-receipt.json`, `p4b-chromium-results.json`,
`p4a-regression-final-receipt.json`, `p4a-regression-final/p4a-chromium-results.json`.
The earlier precommit receipts remain historical. Attempt05 failed during sandboxed
GPU startup before any check; its logs/incomplete receipt remain separate. Approved
process-level retry06 passed with no browser/OS setting or assertion relaxation.
Earlier attempts01–03 and their fixture/harness corrections remain retained separately;
none is presented as final passing evidence.

Windows command (nodeRoot is the existing pinned24.21.0 directory, PATH prepended):

```powershell
& "$nodeRoot/node.exe" --env-file=.env.local "$nodeRoot/node_modules/npm/bin/npm-cli.js" run test:integration
```

Environment is test-only, npm11.19.0, PostgreSQL18.6/UTF8 at127.0.0.1:55438,
`navard_i1_test`, distinct restricted `navard_i1_test_runtime` and
`navard_i1_test_migration`, separate development DB and explicit disposable ACK.
Credentials are omitted. `environment-final.json` verifies actual server/identity;
the guard rejects version/role/database mismatches. No18.2service substitution or
cluster recreation occurred. Build/lint/format/boundaries/preflight passed.

Independent final engineering/security and QA/UI source/runtime reviews found no
remaining required product defect and verified the full log hash and fresh browser
receipts. Database source and final measured-evidence review are clear.
Earlier required idle-renewal, exact cursor-expiry, selected-customer revocation,
customer/filter/reset, pending-state and long-label/hint issues were fixed and
covered by the focused evidence. Database review identified performance harness
plan-capture and true-overlap accounting corrections; these are fixed before
measurement, with final source and measured-evidence re-review completed. This is
not final acceptance.

## Implemented boundary and runtime behavior

Exactly seven POST routes under `/ui-api/sales/v1/`: customers/query, orders/query,
orders/detail, assessments/query, assessments/detail, stock/query and commands.
First six are bounded readonly wrappers; commands is a fixed adapter for the six
unchanged accepted Sales commands. Sales service/contracts, legacy Sales bearer
transport and all19accepted migrations remain byte-identical to the baseline.
No dependency, framework, external font or new schema/index is introduced.

Identity admits a current personally authenticated Sales principal without an org
Sales grant; bootstrap contains only a bounded capability marker. The roster
intersects exact current personal grants and configured customer references before
labels/limit/lookahead. Readonly RR snapshots scope before paging/enrichment, then
freshly reauthorize actor/customer after release, including each returned/lookahead
roster customer. Short abortable admission/data/reauthorization transactions retain
1s lock/4s statement/8s whole deadlines. The exact limits in APR-050 are enforced.
Purpose-HMAC cursors retain original600sTTL and bind current actor/session/customer/
route/filter/parent/page/policy. No totals or cross-page frozen snapshot is claimed.

Inventory owns candidate eligibility and exact Ledger/Balance/claim/issue integrity
checks across all three origins. Reads take no Inventory writer locks and mutate
no Inventory data. Legacy and I2 internal codes accept arbitrary user text;
production has no disclosure-safe generated code. Therefore every internalCode is
null; valid exact code filters return an invariant empty eligible set without
existence lookup. The UI omits that filter and explains confidentiality. Only
unitId/internalCode/kind/AVAILABLE/availableKg are disclosed. Observation does not
reserve or guarantee stock; command-time authoritative validation remains intact.

Provenance: legacy free-text admission in
[receipt-service.ts](../../apps/backend/src/modules/procurement/receipt-service.ts),
I2 declared text in
[receiving-service.ts](../../apps/backend/src/modules/procurement/receiving-service.ts)
and production source shape in
[Inventory discovery store](../../apps/backend/src/infrastructure/postgresql/inventory-discovery-store.ts).
Negative code-oracle/whitelist/integrity cases live in
[stock unit tests](../../apps/backend/tests/unit/inventory-sales-discovery.test.ts)
and [real PostgreSQL stock tests](../../apps/backend/tests/integration/inventory-sales-discovery.test.ts).

The native Persian RTL workspace supports granted-customer/order/assessment
discovery, immutable saved drafts, all six accepted commands, explicit recorded
assessment confirmation and STOCK/MAKE workflows. Sales demand is canonical whole
ASCII kg; Inventory remains exact decimal strings, never Number. Full4096UTF8-byte
serialized command size is checked before dispatch with actionable Persian errors.
No prices, business numbers, specifications, allocation, shipping or production
actions are invented. Existing PROC/WH workspaces and encryption stay compatible.

Encrypted Sales recovery uses a separate exact-context namespace and original
idempotency key. One unresolved write interlocks PROC/WH/Sales; storage denial
prevents first dispatch. Definitive outcomes with failed storage cleanup retain a
cleanup-only retry, avoiding a second POST. Epoch/generation/customer/session
guards precede stale success/error/finalizer effects; current denials lock and
superseded denials cannot lock a new workspace. Focus/pageshow validates the exact
selected customer even if another grant keeps the bootstrap marker true.

## Performance and acceptance gates

**CURRENT: absolute budgets verified; D7 Owner accepted with documented exception
under APR-051.** The measurements below and their historical proposed/OPEN labels
precede that decision; no original measurement or failed relative result is
relabelled successful. See the acceptance package for the current budget check.
All data is synthetic.
Generator: [p4b-performance.mjs](../../tools/test/p4b-performance.mjs), fixed
distribution seed `p4b-deterministic-distribution-v1`; accepted-command fixtures
use freshly generated identities, not a bit-identical database image. Environment:
Windows10.0.19045, pinned Node24.21.0/PostgreSQL18.6, Intel i3-10100F,8logical CPUs,
17072508928bytes RAM. ANALYZE/initial observations warm caches; no restart or cold
cache claim; OS cache/background workstation activity is uncontrolled.

Initial actual counts below include accepted-command fixture examples. Writers
grow the datasets; every phase retains exact starting/ending counts, rather than
pretending the initial sizes remain constant.

| Synthetic tier | Customers / exact grants per reader | Initial orders / assessments | Initial Units / Ledger rows | End orders / Units | Reads wholly overlapping both writers |
| --- | --- | --- | --- | --- | --- |
| small | 9 / 4 | 201 / 300 | 206 / 439 | 1402 / 7034 | 30130 |
| representative (engineering label, not factory evidence) | 65 / 32 | 10001 / 14060 | 10006 / 26713 | 11202 / 16991 | 29735 |
| stress | 257 / 128 | 50001 / 90060 | 25006 / 66737 | 51202 / 31901 | 30164 |

60% order skew to the exercised customer, mixed accepted states/item types,
multiple independent assessments including a60-assessment parent, all three actual
Inventory origin examples and synthetic Ledger fanout1/3/11/99 are explicit.
Each operation has200warm serial samples and roughly5000concurrent samples/tier.
Ten distinct personal reader sessions run round-robin without think time; two
distinct writers run all six accepted Sales commands and PostGoodsReceipt. This
is an unthrottled closed-loop load scenario, not an asserted human click rate.

Before/overlap/after controls use the same schema/indexes, observer and co-writer
pressure. Both writers continue until both minima finish; readers continue through
400Sales cycles and at least2000Inventory writes. Comparisons use complete samples
inside both baseline-writer intervals or the active reader interval. Per tier:
399/400fully overlapping samples per common Sales operation,200each STOCK/MAKE,
2395/2413/2401Inventory writes; bracket baselines contain400–800Sales samples per
operation and4429/4568/4490Inventory samples. Raw startup/drain samples remain.

Worst concurrent percentile across the three tiers, milliseconds; these are maxima
of each tier's empirical percentile, not blended percentiles:

| Operation | Server p95 / p99 | HTTP client p95 / p99 | Proposed server p95 / p99 — OPEN |
| --- | --- | --- | --- |
| Customer roster | 71.70 / 107.84 | 77.04 / 116.15 | 100 / 200 |
| Order discovery | 83.73 / 125.84 | 89.56 / 134.61 | 125 / 250 |
| Order detail | 89.39 / 138.46 | 96.23 / 146.93 | 125 / 250 |
| Assessment discovery | 85.31 / 128.83 | 91.10 / 134.78 | 125 / 250 |
| Assessment detail | 82.62 / 127.01 | 88.18 / 134.46 | 125 / 250 |
| Stock candidates | 92.55 / 139.45 | 98.16 / 147.11 | 150 / 300 |

Per-case status counts/percentiles are retained, including exact/negative/next/
filter/origin/code-safe-empty variants. Worst individual-case server p95/p99 is
97.04/153.17ms. Mixed-read throughput is about192/159/162completed reads/second;
per-operation contributions are retained separately. No request failures/timeouts
were observed. Pool acquisition p95/p99 across all measured acquisitions is
2.41/3.39,2.92/4.50,2.90/4.37ms; maxima41.54/177.66/131.93ms. These include new
connections; the queued flag is an observation, not an invented pure wait metric.

Each tier retains39/40/40EXPLAIN ANALYZE/BUFFERS plans, including actual Inventory
candidate/links/Ledger queries. No new index is proposed or applied. There are
90029reads wholly inside both writer workloads. Same-runtime-role polling recorded
36953read-transaction samples and61676visible writer rows during overlap, zero
missing requested writer PIDs, zero observed Inventory writer locks and zero
observed attributable writer lock waits. Polling targets10ms plus query time;
it cannot prove no transient blocking occurred between observations.

| Writer operation | Worst overlapping p95 / p99 ms | Largest same-schema writer-p95 increase |
| --- | --- | --- |
| DraftSalesOrder | 104.50 / 173.91 | 438.16% |
| SubmitSalesOrder | 112.98 / 165.24 | 438.59% |
| DraftFulfillmentAssessment | 113.80 / 182.01 | 463.42% |
| RecordFulfillmentStock | 191.81 / 270.31 | 452.42% |
| RecordFulfillmentMake | 128.71 / 228.33 | 424.58% |
| ConfirmSalesOrder | 160.38 / 219.42 | 416.70% |
| PostGoodsReceipt | 113.20 / 163.94 | 423.10% |

Writer-p95 increases across all operations/tiers range202.61–463.42%. Absence of
observed locks does not erase this material latency impact. No causal CPU/WAL/
pool diagnosis is claimed from polling alone. Controls use unchanged indexes;
this is reader-load impact, not migration-wide index overhead.

Actual Chrome156 additionally measured600warm UI journeys,200each, small functional
dataset35orders/17assessments/18Ledger rows, no writers:

| Actual UI journey | p95 / p99 ms | Proposed p95 / p99 — OPEN |
| --- | --- | --- |
| First-page refresh | 63.08 / 63.75 | 100 / 200 |
| Exact order lookup, detail and assessments | 126.71 / 130.28 | 200 / 400 |
| Assessment detail and stock candidates | 64.10 / 68.14 | 100 / 200 |

These timings include real CDP interaction, rendering and up to40ms polling
overhead. They are not bare app-only latency or large-dataset/browser-with-writers
evidence. Raw UI percentiles were independently recomputed; business facts stayed
unchanged during measurement. See `p4b-ui-performance.json`.

### Evidence provenance and reporting corrections

All paths below are under `artifacts/tests/p4b-implementation/` and retained locally;
source generators/fixtures are tracked. `performance-owner-summary.json` points to
raw per-tier measurements. Original exploratory run01 atc437df8 added monitoring
only in overlap and had too few writer tail samples; it is retained as exploratory
combined load, not isolated reader overhead or final passing measurement.

Corrected small workload02 at e4747e7 completed all three phases and minimum-count
assertions, then its reporter exceeded JavaScript's argument limit summarizing
229176pool samples. Original `performance-final-02-small-raw.json`, failure and
**exit1 are preserved**. Reporting-only reducer fix6db1854 preserves the mathematics
and workload. `recover-small-report.mjs`/`small-recovery.log` independently verify
all129source paths (original harness against its exact Git revision), complete
intervals/plans/finite samples and read/writer percentiles, then recover only the
missing pool summary. `performance-small-recovered.json` records input SHA-256
`739b4016b2de06b7ac32b09433b092286fb8328469a8df1e5351833673d2d8ab`, recovery-tool hash,
original failed status and exit1. It does not claim the original invocation passed.

Representative and stress ran separately with corrected harness6db1854, both
**exit0**, complete source-stability checks and zero request failures. Exact
commands/environments/times are in `performance-final-03-*-receipt.json`; immutable
raw reports are `performance-final-03-representative.json` and
`performance-final-03-stress.json`. A full rerun of completed small workload was
unnecessary; independent database review confirmed reporting-only recovery sound.

```powershell
$env:P4B_PERF_RUN='1'; $env:P4B_PERF_SAMPLES='200'
$env:P4B_PERF_TIER='representative' # then stress; omit to reproduce all three
& "$nodeRoot/node.exe" --env-file=.env.local tools/test/p4b-performance.mjs
& "$nodeRoot/node.exe" artifacts/tests/p4b-implementation/recover-small-report.mjs
```

### Historical required Owner decisions — formerly OPEN, before APR-051

The table budgets are proposals with headroom above the measured operation/case
tails; stock receives more allowance for bounded Ledger/source verification.
UI proposals reflect the measured multi-request journeys and interaction overhead,
not copied P4a server numbers. Require explicit Owner approval before using them.

Propose writer p95/p99 absolute caps250/400ms **and a20%writer-p95 regression
allowance at an Owner-agreed representative peak workload**. The relative number
is an explicit policy tradeoff proposal to protect transactional writers, not a
measured factory SLA. Current unthrottled10-reader measurements **do not meet20%**;
do not infer performance acceptance from their absolute latency or zero observed
locks. The Owner must decide the normative workload and allowance, or separately
authorize bounded investigation/remediation. No additional product change is
self-authorized by this report.

Actual customer/order/grant/fanout volumes and peak human request rates remain
unknown. Load measurements cover default25/next10 pages; functional50-page-size
coverage is not a50-row performance guarantee. Extending approved budgets to
maximum-size or large/concurrent browser journeys needs an agreed measurement
scope. Synthetic local engineering evidence is not operational UAT/capacity proof.

No numeric performance PASS is claimed. New indexes require evidence and separate
Owner grant. P4a's pre-0019 migration-wide writer-overhead deployment/operational
gate remains unresolved. APR-047's historical residual classification is preserved.

## Owner-requested workload and budget review

Actual Owner response on2026-11-08: **"Review workload and budgets first
(Recommended)"**. This is a review-first direction; numeric/workload approval
remains NULL. No new benchmark, product change or database restart is required
to interpret the existing evidence.

The measured10-reader closed loop completes roughly159–192Sales reads/second,
about15.9–19.2requests/second per active reader. Each reader immediately starts
another request. It measures sustained load from10concurrent readers on this workstation. The
number of people alone does not define an operator workload: native refresh
uses one Sales read; order lookup→detail→assessment list uses three; assessment
detail→stock uses two. Think time, task mix, focus revalidation and write bursts
must be included in an agreed peak profile.

For workload planning, aggregate read RPS is the sum of
`users × journeys/user/minute × reads/journey ÷ 60` across journey types.
Arithmetic illustration only:10users performing two three-read lookups/minute
generate1read/second. This is not a claimed factory rate. No source establishes
actual peak Sales users, journey rates or normal per-customer volumes. Do not
substitute the organizational personnel roster for active Sales-user evidence.

The proposed read budgets have roughly40–62%p95 headroom over measured concurrent
operation tails, with larger p99 allowances. UI budgets have roughly56–59%p95
headroom on the measured small warm fixture. These are useful engineering
proposals for the declared scenarios; they do not establish factory response
targets,50-row load behavior or large/concurrent browser guarantees.

The absolute writer proposal250/400ms has about30%p95/48%p99 headroom over the
worst measured writer tails. Its separate20%relative allowance is unmet. Approving
only absolute caps would accept a materially different tradeoff, permitting the
observed several-fold p95 increase; this requires an explicit Owner policy choice.
Retain both proposals as OPEN and do not call the current writer result acceptable.

Warm EXPLAIN execution times are no greater than2ms in the retained plans. Runtime polling
contains ClientRead/nonwaiting samples and some WAL/I/O observations, without
attributable Inventory lock waits. These observations do not isolate the latency
cause or justify an index. Do not bypass reauthorization, idle renewal, exact
Inventory verification or transaction bounds to reduce the reported numbers.

At the review-first snapshot, the recommended next decision sequence was to obtain peak users and journey rates/mix plus
typical/maximum customer order and assessment volumes; agree normal-peak and stress
profiles separately; then review numeric read/UI/writer budgets against those
profiles. If the existing unthrottled profile is selected as normative with20%
writer allowance, performance acceptance remains blocked by measured evidence.
Any additional measurement or remediation needs its separately bounded Owner
direction. No P4c, product optimization, index or factory pilot is started.

### Subsequent Owner internal-workload clarification

The actual Owner subsequently supplied an approximately20employee internal ERP
ceiling and authorized a conservative20Sales-user evaluation: one lookup/user/minute
normally and two at peak. These rates are Owner engineering assumptions, not
measured factory usage. Customer-order and per-order assessment volumes remain
UNKNOWN. The [bounded workload record](P4B_INTERNAL_WORKLOAD_VERIFICATION.md)
supersedes the earlier missing-planning-input statements for those supplied values;
it preserves original evidence and keeps numeric D7 acceptance OPEN. Only the
specified normal/peak evaluation and one lightweight synthetic history-growth
check are authorized. No portal, external login/API, new business capability,
threshold waiver or index implementation follows.

## Independent review closure

Non-author engineering/security, database and QA/UI reviewers inspected actual
source/contracts and retained runtime evidence; design review was not substituted.
Required product findings are closed: idle renewal and bounded admission; exact
cursor expiry; selected-customer revocation with another grant surviving; customer/
filter/stock traversal resets; discard/state-finalizer handling; wrapping and
linked hints. Actual browser regression covers P1/P2 recovery and session races.
Database measurement findings (plan capture, true overlap, observer visibility,
matched controls, sufficient writer tails) were corrected and re-reviewed.
Final database measured-evidence review independently recomputed raw read/writer
distributions, verified source/recovery hashes and all required plan methods,
confirmed identical46index definitions across tiers and closed required findings.
No known high/critical or required product defect remains. APR-051 closes the
Owner performance decision with an explicit relative-regression exception, without
claiming that engineering resolved the uncertain cause or the former criterion
passed. Independent closure review recomputed retained absolute percentiles and
verified source manifests; no new DB/browser/performance execution was needed.
Formal product acceptance remains with the Owner.

No push, deployment, pilot, adjacent roadmap work or formal product acceptance
has occurred. After verification, the exact disposable18.6cluster returned to its
original stopped state: stop exit0, pg_ctl status3/no server, pg_isready2/no response
at127.0.0.1:55438. `cluster-final-state.json` records exact paths/version/time;
unrelated services and production settings were untouched.
The later Owner-bounded evaluations likewise restored that original stopped state;
`internal20-cluster-final-state.json` records their final verification.

**P4b CLOSURE COMPLETE — READY FOR EXPLICIT OWNER SOFTWARE ACCEPTANCE.**
D7 is Owner accepted with the documented relative-writer-regression exception;
formal product acceptance remains PENDING. This is not factory deployment
readiness, remote push authority or permission to start the next slice.
