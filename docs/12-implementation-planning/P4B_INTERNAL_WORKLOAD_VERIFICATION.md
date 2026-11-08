---
id: IMPL-P4B-WORKLOAD-001
title: P4b Owner-bounded internal workload evaluation
phase: 12-implementation-planning
status: in_review
version: 0.3.0
owners: [delivery-lead, security-architect, data-architect, qa-lead]
depends_on: [APR-051, APR-050, IMPL-P4B-001, PLAN-P4B-DECISIONS-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-11-08
approval: null
---

# Internal workload evaluation — Owner decision recorded

**Current decision:** [APR-051](../00-governance/approved-baselines/APR-051-p4b-performance-decision.md) approves the documented normative workload and
absolute budgets, removes the relative20%rule as a blocking P4b criterion and
accepts its residual risk. Absolute verification is in the
[acceptance package](P4B_OWNER_ACCEPTANCE_PACKAGE.md). D7 is
**OWNER-ACCEPTED WITH DOCUMENTED RELATIVE-WRITER-REGRESSION EXCEPTION**.
Formal product acceptance remains PENDING. All measurement values and historical
OPEN/proposal wording below retain their original meaning; they are not altered
to imply that the original relative criterion passed. No further performance
experiment solely for that regression is authorized.

The actual Owner supplied a factory-specific constraint in this chat: the entire
internal ERP is expected to serve approximately20factory employees. This is a
total internal-user ceiling, not observed Sales-only concurrency. For this bounded
P4b evaluation the Owner directs a conservative ceiling of20Sales users, assuming
all internal employees perform Sales work, with1order lookup/user/minute normally
and2at peak (20/40lookups per minute). Lookup rates are Owner engineering planning
assumptions, not measured factory statistics. Typical/maximum orders per customer
and assessments per order remain **UNKNOWN**.

This clarification authorizes simple, reproducible performance evaluation and
continued investigation of the previously measured202.61–463.42%writer-p95
increase. It does not approve numeric acceptance criteria or waive the writer
regression requirement. [APR-050](../00-governance/approved-baselines/APR-050-p4b-sales-ui-implementation-authorization.md)
remains the bounded product authority. D7 performance acceptance stays **OPEN**.

## Execution plan and boundaries

1. Extend the existing tracked measurement harness with a small paced internal
   profile; preserve legacy raw evidence and unchanged product code/schema/indexes.
2. Use20personal Sales sessions, with concurrent Sales and Inventory writers drawn
   from those same20people, not additional external users. A writer's needed WH
   grant exists only in the acknowledged disposable fixture.
3. Model each lookup as the native three-read journey: exact order query, order
   detail, assessment list. Stagger the20users at60second normal and30second peak
   intervals. Target20/40journeys per minute, equivalent to1/2Sales reads/second
   across the group. Record actual counts, scheduling lag, in-flight activity and
   errors. Twenty active sessions do not mean20simultaneous HTTP requests.
4. Use identical schema, writer actors/pace and runtime-role observer in bracketing
   controls and normal/peak phases. Report each actual Sales command separately,
   absolute latency, sample counts and writer-p95 change; no blending STOCK/MAKE.
5. Keep conservative writer traffic explicit: one five-command Sales cycle/second,
   alternating STOCK/MAKE, and one Inventory receipt/second. These are synthetic
   background-load assumptions, not measured factory writer rates. Maintain the
   same pace in all controls/comparisons; never tune it to obtain a PASS.
6. Planned windows: approximately200seconds before/after controls,600seconds normal
   and420seconds peak, with minor startup/drain allowance. This obtains200normal
   lookup journeys,280peak journeys and at least200complete STOCK/MAKE writer observations
   per comparison. Tail counts and exact intervals must be verified, not assumed.
7. Use synthetic base history of64customers/10000orders/assessment mix (32exact
   grants per reader), retaining a60-assessment parent and all three Inventory
   origin examples. Physical Inventory scale stays small for this Sales-history
   evaluation. Record actual initial and phase-growth counts.
8. Add one lightweight read/EXPLAIN-only comparison at synthetic256customers/
   50000orders with32grants per reader and unchanged physical Inventory scale.
   This checks obvious history degradation; it does not assert factory maximum
   volumes or simulate online customers. Existing warm-operation sampling is reused.
9. Independently review actual raw results/provenance, matched baselines, bounds,
   isolation and findings; restore the verified PostgreSQL18.6cluster to its original
   stopped state. Commit only bounded tooling/documentation changes locally.

No application endpoint/component/command/authorization-policy/schema/migration,
framework or dependency change is authorized by this evaluation. No portal,
external login, online order submission, thousands of concurrent customers,
P4c/P3/pilot/deployment/push or formal P4b acceptance. Future customer/order growth
motivates the history check only; it grants no customer-portal architecture work.

Paced writer comparisons cover the declared normal/peak workload window, including
the requested gaps between user journeys. Each writer sample must be wholly within
that window. This does not claim every writer sample overlaps an individual SQL
read transaction. The fixed concurrent background writer schedules and actual
read/transaction observations are retained separately.

## Initial paced results — normal then peak

Harness revision `9cac8e6e1d372ddfd54cc9260d7daf37fd9067ba` changes tooling/docs
only; product and required correctness tests remain identical to7f30a6f. Windows,
pinned Node24.21.0/PostgreSQL18.6 and guarded restricted disposable roles are unchanged.
Both paced and history invocations completed **exit0**. This means measurements
completed; numeric performance acceptance remains OPEN.

Raw reports/commands/times/source hashes are under
`artifacts/tests/p4b-implementation/`: `internal20-paced-01.json` and its
`-receipt.json`, `internal20-history-01.json` and its receipt. Derived tables are
`internal20-owner-summary.json`; source/recomputed metrics were independently checked.

Twenty actual personal HTTP sessions completed200normal journeys (10/person) and
280peak journeys (14/person), each three sequential successful reads:600/840calls.
Actual rates were20.00/40.00lookups/minute; zero journey/request/writer failures.
Maximum simultaneous journey count was1, with staggered scheduling; this is not
evidence of20simultaneous HTTP requests or20Chromium instances. Existing actual
Chromium correctness evidence remains separate. Scheduling-lag p99 was14.16/14.11ms,
max14.77/14.21ms. Raw lateness was retained, including normal Sales-writer max214.64ms.

Full HTTP lookup journey normal p50/p95/p99 was41.35/65.12/97.04ms (max537.06ms);
peak54.46/73.69/80.81ms (max94.93ms). Native DOM/render timing is not included.
Per-operation server p95/p99:

| Read | Normal ms | Peak ms |
| --- | --- | --- |
| Order discovery | 23.04 / 55.36 | 38.80 / 41.83 |
| Order detail | 18.22 / 23.29 | 19.04 / 24.82 |
| Assessment discovery | 19.76 / 22.85 | 15.65 / 18.58 |

Matching before/after controls use the same actors, pace, observer, schema and
indexes. Common-command bracket samples404; STOCK/MAKE202each. Normal samples600
per common command and300per mode; peak420/210. No operation is blended or excluded.

| Writer | Bracket baseline p95 / p99 ms | Normal p95 / p99 ms | Normal p95 change | Peak p95 / p99 ms | Peak p95 change |
| --- | --- | --- | --- | --- | --- |
| DraftSalesOrder | 42.17 / 46.37 | 44.71 / 202.33 | +6.02% | 41.69 / 44.19 | -1.15% |
| SubmitSalesOrder | 18.20 / 20.70 | 24.56 / 108.47 | **+34.89%** | 19.81 / 25.11 | +8.81% |
| DraftFulfillmentAssessment | 15.14 / 17.58 | 22.12 / 97.79 | **+46.08%** | 14.89 / 20.83 | -1.67% |
| RecordFulfillmentStock | 25.22 / 26.82 | 37.84 / 47.40 | **+50.05%** | 24.81 / 34.56 | -1.61% |
| RecordFulfillmentMake | 17.02 / 20.80 | 26.43 / 95.84 | **+55.29%** | 17.80 / 27.32 | +4.60% |
| ConfirmSalesOrder | 21.72 / 30.56 | 33.02 / 55.13 | **+52.01%** | 21.00 / 29.90 | -3.31% |
| PostGoodsReceipt | 47.82 / 50.13 | 50.95 / 140.58 | +6.56% | 46.93 / 53.14 | -1.85% |

**Normal fails the proposed20%allowance for five Sales operations.** Peak's better
result does not waive normal findings. No threshold is raised to obtain a PASS.
Low absolute latency does not silently replace the relative requirement.

## Lightweight synthetic history check

Actual base65customers/10001orders/14060assessments grew to257/50001/90060 in the
read-only comparison; both use206Units and643Sales grants (32per measured person
plus fixture grants). The growth check has one warm observer,20prepared accounts,
1222first/warm read samples,40plans and no measured writer traffic.

| Operation | Base warm p95 / p99 ms | Larger-history warm p95 / p99 ms |
| --- | --- | --- |
| Customer roster | 9.69 / 11.77 | 10.15 / 11.44 |
| Order discovery | 14.58 / 16.42 | 10.00 / 12.03 |
| Order detail | 11.83 / 13.82 | 10.48 / 11.38 |
| Assessment discovery | 11.14 / 11.89 | 9.57 / 10.87 |
| Assessment detail | 9.69 / 10.53 | 8.60 / 9.07 |
| Stock candidates | 15.48 / 18.13 | 12.00 / 12.75 |

All40plans per dataset include the eight required owner-store methods. Maximum
warm EXPLAIN execution1.436ms base/0.714ms larger history;46index definitions
remain identical. No obvious warm-query degradation was observed at these declared
synthetic sizes. Faster observations do not prove history growth improves latency;
cache/workstation variation is uncontrolled. This is not a maximum-volume or
production-capacity guarantee and motivates no new index.

## Investigation and bounded diagnostic repeat

The paced run observed zero Inventory writer locks and17attributable writer-wait
poll observations, all normal. They form one observation cluster at535378.10–
535802.55ms of the process timeline (sampled span424.45ms), during person0's lookup
near normal+300seconds. A writer PID waits on transactionid blocked by a read PID
across multiple reads/writer commands. These are not17proven distinct waits or
proof of one continuously held wait. Shared-person Identity admission/renewal
contention is plausible from source; the recorded data does not identify the
exact locked relation or prove the cause of the broader latency tail.

For the five failing operations,89–100%of samples above1.2times baseline p95 fall
roughly180–360seconds into normal. Sales medians remain below bracket baseline;
this is an uneven tail effect, not a demonstrated uniform throughput shift.
The entire official dataset is retained; no slow interval is removed.

The existing test-server log `postgres-internal20.log` records a2898-buffer
checkpoint at17:08:20–17:12:50(local+03:30), overlapping the initial normal window
and its slow interval; the preceding control largely precedes it. Later peak
also overlaps1782/1913-buffer checkpoints while performing better. This supports
a possible setup/background-I/O confound, not a causal diagnosis. Checkpoint
write duration includes intentionally spread work, not a continuous269-second
stall. Original wall-clock alignment from monotonic samples is approximate,
because a paired clock anchor was not captured; minute-scale overlap is robust.
No checkpoint/WAL/configuration setting is changed or disabled to improve results.

Under the Owner's continuing-investigation direction, one bounded diagnostic repeat
keeps the same20people, rates, writers, windows, data assumptions, controls and
thresholds and runs peak before normal. Phase ordering is an engineering test
choice, not a new Owner numeric approval. It records per-phase Node CPU/memory and minimal timer/PG
lock/activity diagnostics without SQL text, parameters or tokens. Expanded observer
detail applies equally to all controls/phases. It also changes monitoring cost
from the first run, so cross-run differences cannot isolate phase-order causality
alone. No framework, product optimization, schema/config/index change is introduced.
Both runs are retained without selecting the best.

## Counterbalanced diagnostic results

Revision `bfd942fc382db8aed129d8936aea34c73b874c0b`; raw
`internal20-paced-02-diagnostic.json`, exact command/environment/exit/times in its
`-receipt.json`, derived `internal20-diagnostic-summary.json`. Invocation **exit0**;
phase order is control→peak→normal→control. Twenty people again completed280peak
and200normal journeys,14/10per person, three successful reads each; zero request/
writer failures. Rates remain40/20lookups/minute, with no threshold change.
The report's `sourceDirty=true` reflects documentation work only: all129source
hashes and the combined manifest match the recorded revision; measured source
paths have no working-tree difference.

| Writer | Repeat bracket p95 / p99 ms | Repeat normal p95 / p99 ms | Normal p95 change | Repeat peak p95 / p99 ms | Peak p95 change |
| --- | --- | --- | --- | --- | --- |
| DraftSalesOrder | 45.06 / 48.01 | 44.72 / 46.52 | -0.77% | 45.00 / 46.63 | -0.14% |
| SubmitSalesOrder | 19.38 / 22.38 | 18.84 / 23.36 | -2.80% | 18.86 / 23.64 | -2.69% |
| DraftFulfillmentAssessment | 15.04 / 18.87 | 14.31 / 19.75 | -4.85% | 14.73 / 18.54 | -2.09% |
| RecordFulfillmentStock | 26.52 / 31.45 | 25.13 / 29.54 | -5.24% | 25.65 / 29.51 | -3.27% |
| RecordFulfillmentMake | 17.77 / 19.71 | 16.57 / 17.66 | -6.75% | 17.13 / 17.94 | -3.61% |
| ConfirmSalesOrder | 23.90 / 27.91 | 20.81 / 25.52 | -12.93% | 21.89 / 26.63 | -8.43% |
| PostGoodsReceipt | 50.80 / 53.82 | 50.14 / 52.11 | -1.30% | 50.18 / 53.30 | -1.22% |

Writer cohorts retain404common/202mode baseline samples,600/300normal and420/210peak.
HTTP lookup journey p95/p99 is52.36/67.62ms normal and78.84/86.36ms peak; maxima
70.63/87.01ms. Maximum simultaneous journeys remains1. All current read, cohort,
pacing and source assertions passed. No measured product change explains the
different run results.

Zero sampled attributable waits or read-owned Inventory writer locks in10643active
PID polls; no SQL text/parameters/tokens in diagnostics. Active-poll wake drift p99
is at most1.53ms, max12.82ms. Node CPU averages5.06%of one core before,6.07%peak,
5.23%normal,5.31%after. These describe this instrumented Node process, not
PostgreSQL or whole-machine CPU. Retained memory includes accumulating evidence;
no product memory-leak or throughput-ceiling diagnosis follows.

The repeat did not reproduce the first normal-profile exceedances. It does not
erase them. Different phase order plus expanded monitoring and uncontrolled
workstation/cache/checkpoint activity prevents isolated causal attribution. The
evidence does not consistently establish the proposed20%allowance across both runs.
No automatic third run, product change, database tuning or threshold relaxation
is performed.

## Historical review, limits and proposed criteria — before APR-051

Independent non-author database and QA reviewers recomputed raw journey/cohort
counts, per-command percentiles/regressions, pace and provenance for both paced
runs and the history check. No hidden request/writer failure or required harness
correctness defect remains. The original normal-load finding and repeatability
question remain open performance evidence, not a closed acceptance item.

Retain the existing proposals for explicit Owner review, in milliseconds:

| Surface | Proposed p95 / p99 |
| --- | --- |
| Server customer roster | 100 / 200 |
| Server order and assessment reads | 125 / 250 |
| Server stock candidates | 150 / 300 |
| Actual UI refresh and assessment/stock journey | 100 / 200 |
| Actual UI order lookup/detail/assessment journey | 200 / 400 |
| Each writer, absolute | 250 / 400 |
| Each writer, relative | ≤20%p95 increase against matched same-schema controls |

UI proposals still refer to the earlier actual Chromium evidence; these20-user
runs measure HTTP journeys, not concurrent DOM/render behavior. No criteria are
approved and no failed relative result is waived by its low absolute latency.
Orders/customer, assessments/order and true factory writer rates remain UNKNOWN;
the latter is an explicit conservative synthetic load. No maximum50-row or
synchronized20-request burst guarantee is claimed (the accepted read admission
cap remains16active reads/process). No portal or external-user scenario is tested.

Before unqualified performance acceptance, resolve the initial normal-tail
repeatability question under an agreed evaluation precondition. A possible narrow
follow-up is to settle initial bulk-seed flushing before controls, using a bounded
wait for a natural checkpoint starting after recorded setup completion and its
matching completion, with a paired clock anchor. Keep all later natural checkpoints
inside the measured workload; no forced checkpoint, privilege/configuration change,
slow-interval exclusion or best-run selection. This is a proposed next step requiring
separate bounded Owner direction, not work started by this report. No index is
justified by the retained warm plans. P4a's pre-0019 migration-wide writer-cost
deployment/operational gate remains open and separate.

## Historical Owner decision OPEN — superseded by APR-051

Existing [delivery measurements](P4B_IMPLEMENTATION_STATUS.md#performance-and-acceptance-gates)
remain retained with their original scope. Proposed numeric budgets remain
unchanged and unapproved, including the20%writer allowance. The initial normal
workload does not satisfy it. The Owner must approve final criteria; no performance
PASS, formal product acceptance, remote push or deployment is created by this record.

After all evaluations, the verified PostgreSQL18.6cluster returned to its original
stopped state: stop0, pg_ctl status3/no server, readiness2/no response on55438.
`internal20-cluster-initial-state.json` and `internal20-cluster-final-state.json`
record actual paths/version/times. No unrelated service or production setting
changed. Product code, accepted commands/bearer contracts, all19migrations and
pinned UI/UX configuration remain unchanged throughout this follow-up.

## Final D7 closure

The Owner explicitly judges further relative-regression investigation unjustified
for this internal operational scale. The earlier suggested follow-up is not a
remaining prerequisite and will not run. Both raw runs, complete samples, receipts,
17initial wait-poll observations and uncertain root cause are preserved unchanged.
Independent closure evidence review recomputed all operation/writer/UI percentile
budgets and verified source manifests without new experiments. No required
absolute operation is missing or over budget within the documented evidence scopes.
Only the relative blocking criterion changes; correctness/security/isolation,
transaction integrity, P4a deployment gates and formal acceptance boundaries do not.
