---
id: APR-052
title: Formal Owner P4b Sales UI software acceptance
phase: 12-implementation-planning
status: approved
version: 1.0.0
owners: [project-sponsor]
depends_on: [APR-050, APR-051, IMPL-P4B-001, IMPL-P4B-ACCEPTANCE-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-11-08
approval: Actual Owner FORMAL P4b SOFTWARE ACCEPTANCE directive issued in this chat
supersedes: null
---

# Formal P4b Owner software acceptance

The actual Project Owner issued **OWNER DIRECTIVE — FORMAL P4b SOFTWARE
ACCEPTANCE** in this chat on 2026-11-08 and explicitly accepts P4b — Sales UI
at product revision **`7f30a6f26b6e53c6152d6851f90d1f5ed844f69a`**, within the
implementation, contracts, evidence and exceptions in the final
[Owner acceptance package and evidence index](../../12-implementation-planning/P4B_OWNER_ACCEPTANCE_PACKAGE.md).
The reviewed closure documentation revision is
**`e16aab8271a9c3ec0e1b118f63245b767d1f0ca7`**. This record documents that human
decision; it does not expand the product or deployment authority.

**P4b — SOFTWARE ACCEPTED BY OWNER.**

## Verified baseline and evidence consistency

Before recording, `main` HEAD was the exact closure documentation revision above,
with a clean working tree. Both referenced commits exist on `main`. Product,
registered correctness tests, required runners, packages and all 19 migrations
are unchanged between the product revision and closure revision. Later harness
corrections remain attributed to their actual commits, not to the product commit.
The package and [APR-051](APR-051-p4b-performance-decision.md) match their committed
closure versions. Retained evidence hashes, passing log counts, complete Chromium
results and 24 preserved baseline blobs were checked; no material inconsistency
was found. APR-000–051 were unique and contiguous, and APR-052 was unused.

## Accepted functional scope

[APR-050](APR-050-p4b-sales-ui-implementation-authorization.md) and the
[implementation record](../../12-implementation-planning/P4B_IMPLEMENTATION_STATUS.md)
bound the accepted Sales UI capability:

- Exactly seven browser POST routes: personally granted customer discovery,
  order discovery/detail, assessment discovery/detail, narrow Inventory-owned
  stock candidates and a fixed adapter for the six unchanged Sales commands.
- Native Persian RTL customer/order/assessment workflows, immutable saved drafts,
  submit, explicit recorded STOCK/MAKE assessment and confirmation, with exact
  quantities, accessible feedback and encrypted uncertain-command recovery.
- Current personal exact-customer authority, isolation before pagination/enrichment,
  fresh authorization before disclosure, signed expiring cursors, bounded snapshots,
  stale-response/session protection and one unresolved write across workspaces.
- Inventory-owned minimal verified availability across eligible origins, with
  private internal codes null. A candidate is not a reservation or stock guarantee.
  ACT-IPS, accepted command validation, transaction integrity and module ownership
  remain unchanged. No new Inventory mutation, command, security-policy change,
  migration, index, framework or dependency is accepted by this documentation task.

Reservation/allocation, shipping, production execution, finance, portal/external
login, online ordering and other unsupported business operations are excluded.

## Successful verification and review

| Retained evidence | Verified result |
| --- | --- |
| Unit | 292 passed, zero failed/cancelled/skipped/todo, exit 0 |
| Complete real PostgreSQL 18.6 | 420 passed, zero failed/cancelled/skipped/todo, exit 0; all 41 registered integration files, no filter/exclusion |
| Actual Sales Chromium | 30 passed, zero failed/skipped, complete real backend/PostgreSQL run |
| Actual P1/P2/P4a Chromium regression | 25 passed, zero failed/skipped, complete real backend/PostgreSQL run |
| Absolute performance budgets | All six read operations, seven writer operations and three actual UI journeys within APR-051 limits at the documented evidence scopes |
| Independent reviews | Engineering, security, database and QA/UI required findings closed; no known required product defect or high/critical finding remains |

Full PostgreSQL log SHA-256:
`0b3249fcdc31ff8452c76fd07ab099d6437bacbebea97e6c70f9d52dd2715dbe`.
The package indexes exact execution revisions, commands, environments, receipts,
complete outputs, prior failures and reporting-only recovery. Generated raw outputs
remain retained locally and ignored by Git; tracked files alone do not contain
them. This acceptance-recording task verifies existing evidence and documents,
without repeating product tests, starting the database or running experiments.

## D7 exception and preserved limitations

**D7 OWNER-ACCEPTED WITH DOCUMENTED RELATIVE-WRITER-REGRESSION EXCEPTION.**

APR-051's normative workload is 20 authenticated internal Sales sessions with
20 normal/40 peak three-read lookup journeys per minute, staggered arrivals and
concurrent writers. Its approved absolute server/UI/writer budgets remain applicable,
including each writer's 250/400 ms p95/p99 limits. The Owner removes the relative
20% writer-p95 threshold as a blocking P4b software-acceptance criterion and
explicitly accepts the initial normal run's 34.89%–55.29% relative increases.
**The original relative criterion did not pass. The root cause remains UNKNOWN.**
Both complete runs, original relative failures, wait observations, earlier
unthrottled measurements and all raw results remain unchanged. No retrospective
PASS or causal diagnosis is created. No further investigation is required solely
because of that relative regression.

The 20-session evidence is staggered HTTP traffic, not 20 simultaneously rendered
browsers. UI timing uses the documented small warm fixture without concurrent
writers; additional operation coverage comes from retained heavier-load reads.
Synthetic writer/history assumptions, unknown operational history volumes and
cache/workstation uncertainty retain their recorded scope. These are software
acceptance limitations, not complete factory capacity or operational guarantees.
APR-047's historical UNKNOWN/nonblocking residual classification is unchanged.

## Outstanding operational gates and next boundary

- P4a's separate representative **pre-0019 migration-wide writer-overhead
  deployment/operational gate remains OPEN**. Same-schema P4b comparisons do not
  resolve it.
- Factory operational UAT, environment/security readiness, backup/restore,
  training, cutover and pilot gates remain outstanding under their existing
  governance. P3 implementation/execution is not authorized here.
- P1, P2, P4a and now P4b are accepted within their bounded software scopes.
  P4c — Reservation UI is only the next proposed roadmap capability; discovery,
  design or implementation requires separate explicit Owner authorization.

This is **software acceptance only**, not entire-ERP readiness, remote push,
deployment, production cutover or factory-pilot authorization. No product change,
database migration/index, business/security change, P3/P4c/P4d/P5 or other slice
implementation is permitted by this directive. Only this formal record and
necessary canonical documentation updates are committed locally; no push occurs.
