---
id: APR-053
title: Owner D1-D7 decisions and bounded P4c Reservation UI implementation authorization
phase: 12-implementation-planning
status: approved
version: 1.0.0
owners: [project-sponsor]
depends_on: [APR-052, APR-051, APR-049, PLAN-P4C-CAPABILITIES-001, PLAN-P4C-DESIGN-001, PLAN-P4C-DECISIONS-001, PLAN-P4C-READINESS-001, GOV-CODEX-CONTEXT-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-11-08
approval: Actual Owner P4c implementation authorization attached in this chat
---

# Actual P4c implementation authority — not software acceptance

The actual Owner attached **OWNER DIRECTIVE — P4c IMPLEMENTATION AUTHORIZATION**
in this chat, approving the four P4c design documents at exactly
`797e8c03feb3a995085e6ef17c0e1fd0c52336ed`, subject to the decisions below.
Starting `main` matched that revision with a clean tree. APR-000–052 were present
and APR-053 was unused. This records the actual human directive, not agent approval.

The [design decision sheet](../../12-implementation-planning/P4C_IMPLEMENTATION_AUTHORIZATION_DECISIONS.md)
retains historical proposal wording; the present directive governs implementation.
The [implementation plan](../../12-implementation-planning/P4C_IMPLEMENTATION_PLAN.md)
defines bounded execution and verification. **IMPLEMENTATION AUTHORIZED;
NOT IMPLEMENTED; NOT VERIFIED; OWNER SOFTWARE ACCEPTANCE PENDING.**

## Actual Owner selections

| Decision | Actual approved option and binding boundary |
| --- | --- |
| D1 | A: complete bounded native Sales Reservation discovery/detail/confirmed STOCK context; explicit single request and separately confirmed activation using unchanged RequestReservation/ActivateReservation. |
| D2 | A: exactly four narrow read contracts `/reservations/v1/query`, `/detail`, `/order-context`, `/stock/query` and fixed `/commands` adapter; exact-customer authority, strict DTOs, bounded discovery, owner ports/nondisclosure. Existing P4b customer/order/assessment discovery unchanged. |
| D3 | A: current personal exact-customer ACT-SALES only. No WH Reservation browse, no P4a exception or broader Sales grants. Accepted bearer WH activation unchanged. |
| D4 | A: new browser requests use the complete observed Unit quantity only when positive whole kg, within remaining request capacity and exact constraints. No smaller partial entry, rounding/truncation/flooring. Existing partial rows remain visible/activatable with operational warning; backend semantics unchanged. |
| D5 | A: fixed two-command browser adapter, isolated encrypted Reservation intent, persist-before-send, original-material same-key recovery and unresolved-write interlock across PROC/WH, Sales and Reservation; preserve all session/role/customer/account/CSRF/async fences; no automatic chaining. |
| D6 | A CONDITIONALLY: read-only owner projections on existing structures/indexes first; actual plans/access-path measurements. No new migration/index/schema/maintained projection/cache; insufficient paths require separate evidence and Owner decision. Migrations0001–0019 unchanged. |
| D7 | A with Owner-selected synthetic workload/absolute targets below. Targets are approved, not measured PASS. No new relative-percentage writer threshold, inherited P4b waiver or excessive experiments after required correctness/absolute checks pass. |

## D7 actual Owner workload and targets

Up to20authenticated internal sessions is a conservative synthetic ceiling,
not an observed Reservation population or20simultaneous in-flight operations.
Stagger20normal/40peak lookup journeys per minute. Include representative low-rate
request/activation plus concurrent Sales, Inventory/receiving and Dispatch writers;
one bounded history/skew scenario as needed for access-path proof.

| Measurement | Approved absolute target |
| --- | --- |
| Each new server read | p95≤2s; p99≤4s |
| Each bounded browser read/navigation journey | p95≤3s; p99≤6s |
| Each existing Reservation command through browser adapter, server boundary | p95≤2s; p99≤4s |

Define boundaries/sample counts before results. Exclude human think time and
separately initiated commands from a read journey. Require zero correctness
failures; investigate material database contention or lock-attributable read
waits. Retain same-schema writer comparisons; diagnose demonstrated correctness
or absolute-budget failures. No new relative-percentage threshold. P4b's D7
exception is not a P4c waiver. Stop measurement once required budgets/correctness
pass; do not pursue already acceptable latency for its own sake.

## Owner acknowledgement of existing irreversible limits

REQUESTED is persistent intent, not allocation. No implemented edit/cancel/
transfer/expiry; failed activation can leave blocked intent still consuming line
request capacity. Partial ACTIVE can exclude other claims on the Unit; current
Shipping requires the claim kg to match the whole current Unit kg. These limits
are acknowledged/accepted constraints of this bounded implementation, not fixed
behavior. Distinct informed confirmations before request and activation are
mandatory. Observed availability is no guarantee, REQUESTED is never ACTIVE and
partial reserved stock is not necessarily shippable. No repair/release/top-up/
split/reassignment function is authorized. Preserve these limits prominently in
the final software acceptance package and future factory UAT considerations.

## Required delivery and strict boundaries

Native Persian RTL inside existing operator shell, pinned verified UI skill and
current technologies; no new dependency/framework. Preserve owner writes,
personal/customer/session authority, exact quantities, immutable material/key,
priority/post-lock checks, atomic transaction/audit/outcome, signed scoped cursors,
read-only consistent snapshots, minimal disclosure and browser security.

Require focused unit, real PostgreSQL and actual Chromium proof against the
[design evidence matrix](../../12-implementation-planning/P4C_DESIGN_REVIEW_AND_READINESS.md),
required regressions/full acceptance, actual performance and fresh independent
engineering/security/database/QA-UX implementation reviews with all required
findings fixed. Historical design reviews do not satisfy implementation review.
Keep full evidence/failures and concise reports under the permanent efficiency
policy. No token-efficiency reinvestigation is required.

Section6 explicitly reserves protected reconciliation:

> If protected gate/unlock reconciliation is required, report the minimal proposed
> changes and obtain the required separate Owner authorization before modifying
> those controls.

Both current controls still reference APR-050/P4b. **Separate protected-control
approval is NOT YET GIVEN.** The [exact reconciliation proposal](../../12-implementation-planning/P4C_GATE_RECONCILIATION_PROPOSAL.md)
is documentation only. No product writes or protected-control changes may borrow
the obsolete P4b unlock while this mismatch remains. No hook or containment change
is proposed. This implementation grant is not a protected-control grant.

No migration/index, new business command/policy, WH browse, Production/Shipping
action, adjacent slice, push/deployment/factory pilot is authorized. P4a's
migration-wide writer-overhead deployment gate remains OPEN. APR-051's P4b
exception and APR-052 software acceptance remain unchanged.

Completion target is **P4c IMPLEMENTED AND VERIFIED — OWNER SOFTWARE ACCEPTANCE
PENDING**, with exact product/documentation commits, verification counts/evidence,
independent reviews, remaining blockers, actual absolute performance, residual
risks and Git status. Stop before formal Owner software acceptance.

## Authorization manifest fields

- Gate result: APPROVED
- Explicit approver: Actual Project Owner, attached P4c implementation directive; protected-control approval remains separately pending
- Git commit: `797e8c03feb3a995085e6ef17c0e1fd0c52336ed`

The manifest fields record approved implementation scope at the reviewed design
revision. They do not authorize materializing the proposed protected controls.
