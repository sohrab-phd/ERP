---
id: PLAN-P4C-IMPLEMENTATION-001
title: Bounded P4c implementation and verification plan
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [delivery-lead, chief-solution-architect, security-architect]
depends_on: [APR-053, PLAN-P4C-DESIGN-001, PLAN-P4C-READINESS-001, PLAN-P4C-GATE-001]
last_reviewed: 2026-11-08
approval: null
---

# P4c authorized execution plan

Authority is [APR-053](../00-governance/approved-baselines/APR-053-p4c-reservation-ui-implementation-authorization.md),
against approved design `797e8c03feb3a995085e6ef17c0e1fd0c52336ed`.
Goal/users/invariants/exclusions remain in the
[workflow](P4C_RESERVATION_UI_WORKFLOW_AND_CONTRACT_DESIGN.md). D1–D5 A, D6 A
conditional and D7 A with actual numeric targets are approved. Product work
awaits the separately required [protected reconciliation](P4C_GATE_RECONCILIATION_PROPOSAL.md).
No product or protected-control file has been changed. This plan is not delivery
or a claim of passing implementation tests.

## Bounded work sequence and Definition of Done

1. Record actual Owner decisions and prepare/review exact protected reconciliation;
   obtain its separately required human approval before product writes.
2. Implement Inventory-owned list/detail/context/selected-stock read service and
   persistence, narrow Sales confirmed-demand read port and one read-only snapshot.
   Reuse accepted Identity context and Inventory evidence verifier. Measure actual
   SQL paths first; no index/schema/cache or speculative infrastructure.
3. Add closed cookie browser adapter/cursors and static asset entries; preserve
   bearer routes, existing P4b roster/order/assessment reads and current commands.
   Logical `/reservations/v1/...` contracts mount under the existing `/ui-api`
   browser prefix, as existing Sales contracts do; no unprefixed cookie alias or
   generic proxy. Four reads plus fixed `/commands` only.
4. Implement native Persian RTL operator views and exact whole-Unit selection,
   immutable-request review/confirmation and separate activation confirmation.
   Preserve partial legacy visibility/warnings, persistent-blocked-intent guidance,
   minimal lifecycle audit visibility and read-only related Sales navigation.
5. Implement isolated encrypted Reservation pending intent and extend every
   all-workspace write/interlock/recovery check; retain original material/key,
   persist-before-send and session/customer/role/account/CSRF/generation fences.
6. Run focused meaningful unit, isolated real PostgreSQL18.6 and actual Chromium
   proof, relevant regressions and required root acceptance checks on frozen
   Windows Node24.21.0/npm11.19.0. The ignored fixed-mode Windows verification
   launcher specified in the gate proposal records repeatable per-task environment
   setup and checks; inspect it before execution, no general command dispatch.
   Use existing isolated roles/databases and retained
   exact runtime; no production reset, cluster recreation, Linux/WSL or dependency
   install/upgrade. Preserve full logs/failures, concise counts and real evidence.
7. Execute the bounded D7 workload below and retain SQL plans/same-schema writer
   comparisons; diagnose actual correctness/absolute failures or material waits.
   D6 insufficient paths go to Owner with evidence; no index/migration application.
8. Fresh independent engineering/API, security, database and QA/UX implementation
   reviews of actual final code/tests/evidence; fix/retest all required findings.
   Document delivered limits/remaining risks and acceptance package, final
   git diff --check/scope review, coherent local product and documentation commits.
   Target IMPLEMENTED AND VERIFIED — OWNER SOFTWARE ACCEPTANCE PENDING; stop there.

DoD is the complete approved
[evidence matrix](P4C_DESIGN_REVIEW_AND_READINESS.md), including actual negative
authorization, exact/partial/oversized/ineligible stock, all-intent capacity,
original selections, request/activation distinction, blocked/legacy partial
intents, priority/concurrency/dispatch integrity, lost COMMIT/replay, encrypted
recovery across workspaces, rotation races, RTL/keyboard/reflow/accessibility,
bounded performance and required regressions. No design review substitutes for
implementation review; no known required/high/critical defect at verification.

## D7 measurement protocol fixed before reporting

These are engineering sample/rate choices within actual Owner20/40journey targets;
they are synthetic inputs, not factory observations. Confirm fixture/runtime and
timer instrumentation before sampling; record any necessary protocol correction
before reporting its results. No unapproved relative-percentage threshold.

| Measurement | Boundary / sample definition |
| --- | --- |
| Server reads | Monotonic time from admitted request entering the fixed read adapter to response completion, including auth/pool/SQL/serialization; report each of the four routes separately. |
| Browser read/navigation journey | Explicit navigation/read gesture to stable authorized rendered target (including necessary dependent reads); exclude human think time, fixture setup and separately confirmed request/activation. Retain constituent read samples and each declared journey class separately. |
| Reservation command | Adapter admission through definitive response, including transaction/audit/outcome, excluding human confirmation/readback/fixture provisioning. Report Request and Activate separately; retain timeout/uncertainty/correctness outcomes rather than drop them. |
| Quantiles | Retain raw per-operation samples/counts/units; nearest-rank p95/p99. With small command samples, p99 is observed maximum and has limited tail confidence; no population-SLA claim. Report all errors/deadlines/locks and writer counts, not only successful latency. |

Proposed bounded run:20authenticated synthetic sessions, staggered starts every3s
normal/every1.5s peak. Five measured minutes normal =100lookup journeys; five
minutes peak =200journeys. Each lookup visits list → confirmed order-context →
selected stock → reservation detail on verified synthetic fixtures, reporting
each view and complete lookup separately. Sessions reuse their own exact-customer
context; these are staggered starts, not asserted20simultaneous requests. Include
a short declared unmeasured warmup and do not mix warmup/fixture work into counts.

Same-schema baseline writers without Reservation reads for five minutes, then
normal/peak overlap windows. Each window schedules2Request,2Activate,2Sales,
2receiving and1Dispatch operation/minute (engineering low-rate assumptions),
using independent prebuilt valid intents/Units and explicit test confirmations.
Thus baseline and each overlap window target10samples per Reservation command,
10Sales/10receiving and5Dispatch operations. Report per-window command/writer
quantiles; also retain20combined overlap samples per Reservation command without
concealing individual-window failures. Command and writer fixture setup is outside
timed windows. Browser confirmation tests remain distinct from workload pacing;
the application itself never chains request and activation.

One bounded skew/history access-path scenario uses a separately described
synthetic20,000-request history (distributed across at least10customers, with one
customer/order skew), parameterized query plans and30additional lookup journeys
at the normal pace; report independently, not pooled with the normative profile.
Only seed valid existing facts/constraints in a verified disposable database;
history that would violate per-line demand caps requires more valid orders/items,
not bypassed constraints. Record final actual cardinalities and plan row/buffer
counts, including selected16-Unit and all-intent aggregate bounds.

Approved targets: each read/Reservation command server p95≤2s/p99≤4s;
each bounded browser read/navigation journey p95≤3s/p99≤6s. Zero correctness
failures. Capture same-schema writers before/during reads and lock/pool waits;
investigate material contention/read waits, without adding a relative percentage
threshold or treating P4b's exception as a P4c waiver. Stop once relevant evidence
and approved budgets pass. No extra experiment merely to reduce acceptable latency.

## Evidence and current stop

Future evidence is local under `artifacts/tests/p4c-implementation/`, with full
test/workload logs, exact commands/revisions/runtime, raw samples, plans and
independent review records. Final tracked delivery/acceptance docs will index
actual results and explain local-artifact availability. No execution counts are
invented here. Owner-acknowledged irreversible/partial limitations belong prominently
in final acceptance package and UAT considerations.

Current stop: separate protected-control approval pending; authorized governance,
plan and proposal preparation complete. P4a's migration-wide writer deployment
gate remains OPEN; APR-051/052 and prior acceptance unchanged. No product tests,
P4c performance, software acceptance, push/deployment/pilot or next slice is claimed.
