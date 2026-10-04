---
id: PLAN-IDEMPOTENCY-HISTORICAL-001
title: Superseded generic idempotency draft disposition
phase: 12-implementation-planning
status: superseded
version: 0.2.0
owners: [chief-solution-architect]
depends_on: [ADR-0011, PLAN-COMMAND-IDEMPOTENCY-001]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Historical idempotency draft — superseded

The earlier 2026-10-03 design was a candidate prepared with incomplete source
access. After hook retirement, current API/data/guard/audit/identity sources were
read and reconciled. Its principal-in-key namespace, unverified key limits and
provisional claim-row mechanism are withdrawn; they are not live alternatives.

The binding delegated technical ADR is
[ADR-0011](../00-governance/adrs/ADR-0011-command-idempotency.md).
The complete current contract is
[COMMAND_IDEMPOTENCY_SPEC](COMMAND_IDEMPOTENCY_SPEC.md), with one installation/
organizational-scope/key namespace, separately bound principal/intent, accepted
and rejected durable replay and terminal-only transaction-scoped advisory locking.
[Concurrency decision](SLICE_ENVELOPE_CONCURRENCY_DECISION.md) and
[physical design](SLICE_ENVELOPE_PHYSICAL_DESIGN.md) agree with that contract.

Historical text remains recoverable in Git history/diff as drafting evidence,
without contradictory active instructions. No factory answer or OQ status changes.
Accepted technical decision is not human implementation baseline approval.
ERP implementation remains locked; no product code, migration or unlock is created.
