---
id: IMPL-P4B-WORKLOAD-001
title: P4b Owner-bounded internal workload evaluation
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [delivery-lead, security-architect, data-architect, qa-lead]
depends_on: [APR-050, IMPL-P4B-001, PLAN-P4B-DECISIONS-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-11-08
approval: null
---

# Internal workload evaluation — D7 OPEN

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
   lookup journeys,280peak journeys and at least200fully overlapping STOCK/MAKE writer observations
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

## Results and Owner decision

PENDING actual execution. Existing [delivery measurements](P4B_IMPLEMENTATION_STATUS.md#performance-and-acceptance-gates)
remain retained and are not relabelled as normal factory load or discarded.
Proposed numeric budgets remain unchanged and unapproved, including the20%writer
allowance. After normal/peak and lightweight history measurements, report actual
absolute/relative results and recommend criteria for explicit final Owner approval.
No performance PASS is claimed by this plan.
