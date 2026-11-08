---
id: APR-051
title: Owner P4b normative workload and absolute budgets with relative-writer exception
phase: 12-implementation-planning
status: approved
version: 1.0.0
owners: [project-sponsor]
depends_on: [APR-050, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-11-08
approval: Actual Owner OWNER DECISION — Close P4b Performance Review and Proceed in this chat
---

# P4b performance decision — not formal product acceptance

The actual Owner reviewed the evidence at repository revision
`387af4b6ac2aa4486b4c8e495c2ed72eaab02212` and explicitly issued
**OWNER DECISION — Close P4b Performance Review and Proceed** in this chat.
APR-000–050 were verified unique and contiguous; APR-051 was unused. This record
captures that human decision without altering any earlier approval or raw result.

## Binding decisions

1. Approve the normative internal P4b workload: 20 authenticated Sales sessions,
   20 normal and 40 peak three-read lookup journeys/minute, using the documented
   staggered arrivals and concurrent Sales/Inventory writers. The approximate
   20-person ceiling is for the entire internal ERP, not measured Sales concurrency.
2. Approve the previously proposed absolute p95/p99 budgets below. Verify them
   from existing evidence; identify any missing evidence or exceeded limit explicitly.
3. Remove the relative 20% writer-p95 regression requirement as a **blocking P4b
   acceptance criterion**. The Owner accepts the documented residual risk of the
   initial normal run's 34.89%–55.29% relative increases. This changes the criterion;
   it does **not** make the original relative requirement pass.
4. Subject to the absolute-evidence check, record D7 as
   **OWNER-ACCEPTED WITH DOCUMENTED RELATIVE-WRITER-REGRESSION EXCEPTION**.
   Retain both complete runs, all measurements and unresolved root-cause uncertainty.
   Do not run further experiments solely to investigate that relative regression.
5. Finalize documentation, evidence index, independent review closure and the
   Owner acceptance package. Preserve all correctness, security, authorization,
   isolation and transaction-integrity requirements. Do not repeat successful tests
   without a concrete correctness/evidence-integrity reason.

| Approved surface | p95 / p99 milliseconds |
| --- | --- |
| Server customer roster | 100 / 200 |
| Server order and assessment reads | 125 / 250 |
| Server stock candidates | 150 / 300 |
| Actual UI refresh and assessment/stock journey | 100 / 200 |
| Actual UI order lookup/detail/assessment journey | 200 / 400 |
| Each Sales and Inventory writer operation | 250 / 400 |

## Evidence, scope and retained risk

[Both paced runs and the history check](../../12-implementation-planning/P4B_INTERNAL_WORKLOAD_VERIFICATION.md)
retain their original values, source revisions, receipts and limitations.
[The final acceptance package](../../12-implementation-planning/P4B_OWNER_ACCEPTANCE_PACKAGE.md)
records the absolute-budget comparison and evidence coverage. Earlier unthrottled
202.61%–463.42% writer increases remain historical measurements at their original
load, not results for the newly approved normative workload. The original normal
relative criterion remains unmet; the diagnostic repeat does not erase it.
No causal explanation is proven. Unknown operational history/writer volumes,
warm-cache sampling and non-concurrent Chromium timing limits remain recorded.

This decision is **not formal P4b product acceptance**. P4b remains NOT ACCEPTED
pending a separate explicit Owner decision on the exact product revision.
No product/code/policy/security relaxation, migration/index, push, deployment,
factory pilot, portal/external API, P3/P4c/P4d/P5 or other roadmap work is authorized.
P4a's separate pre-0019 migration-wide writer-overhead deployment/operational gate
remains **OPEN**. APR-047's historical residual classification remains unchanged.
