---
id: APR-049
title: Formal Owner P4a Warehouse Inventory Visibility acceptance
phase: 12-implementation-planning
status: approved
version: 1.0.0
owners: [project-sponsor]
depends_on: [APR-048, APR-047, IMPL-P4A-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-11-07
approval: Actual Owner FORMAL P4a ACCEPTANCE directive issued in this chat
supersedes: null
---

# Formal P4a Owner acceptance

The Project Owner issued **OWNER DIRECTIVE — FORMAL P4a ACCEPTANCE** in this
chat on 2026-11-07 and explicitly accepted P4a Warehouse Inventory Visibility at
`6c0fbbbed05eeb81ccf7564b2bbd7cfc7caebf10`, subject to its recorded scope,
evidence, limitations and exclusions. This record documents that human decision.

**P4a is formally ACCEPTED for its delivered software capability.**

Before recording, `main` and HEAD matched the exact accepted commit. Its parent
was `d10983a92f898e09c76c92b4698f0ffa7db20bb2`. The original modified `AGENTS.md`,
untracked `.agents/skills/ui-ux-pro-max/` and untracked `skills-lock.json` were the
only working-tree changes. All 76 preserved installation fingerprints matched.
The APR files from APR-000 through APR-048 were unique and contiguous, and
APR-049 was unused. The approval register now also links the existing APR-048.

## Accepted scope

The accepted [implementation record](../../12-implementation-planning/P4A_IMPLEMENTATION_STATUS.md)
delivers the D1–D4 decisions authorized by
[APR-048](APR-048-p4a-inventory-visibility-implementation-authorization.md).

- Current personal organizational ACT-WH may read the approved Inventory
  projection across legacy receipt, I2 receiving and production origins. Five
  current states and two supported zero-stock historical states are covered.
- Exact integer and fractional kilogram strings, verified Ledger/Balance and
  claim/issue consistency, authorized pagination, signed cursors, per-page
  snapshots and current authorization before disclosure define the read boundary.
- The three approved browser POST contracts are DiscoverInventoryUnits,
  GetInventoryUnitDetail and ListInventoryLotUnits. The native Persian RTL
  interface supports discovery, exact filters, Unit/Lot inspection and refresh.
- Migration 0019 retains the five measured indexes for scoped Unit Lot, state,
  kind and location, and the exact legacy code. ACT-IPS remains the stock writer.

The accepted interface fixes both final browser defects. A superseded Inventory
denial cannot lock a newer view, and reopening the same Lot from a member Unit
preserves the original Back path and focus. Independent re-review confirmed both
fixes and the same-account session replacement scenario. All required engineering,
API, security, database and QA findings are closed.

## Verified acceptance evidence

The final readiness audit reported **P4a FINAL ACCEPTANCE AUDIT PASSED — READY FOR
EXPLICIT OWNER ACCEPTANCE** for the exact accepted revision in this chat.
This documentation task verified the retained output and receipt hashes.

| Evidence | Verified result |
| --- | --- |
| Unit/component | 271 passed, zero failed, cancelled or skipped |
| Complete PostgreSQL invocation | 398 passed, zero failed, cancelled, skipped or todo, exit 0, all 39 tracked integration files |
| Actual Chromium | 25 passed, zero failed, skipped or console errors, complete normal run against the composed app and real PostgreSQL |
| Migration | Four migration cases included in the full PostgreSQL run, including populated 0018 upgrade, exact indexes, retry and checksum safety |
| Independent review | Required findings closed on the accepted correction and its executed evidence |
| Benchmark | 100,000 synthetic Units, 4,604 warm reads overlapping both writers, server p95 42.89 ms and p99 55.36 ms |
| Concurrent writer impact | Writer p95 100.78 to 103.00 ms, a 2.21% increase against the documented same-index baseline |
| Observed read locking | Zero Inventory writer locks or attributable writer waits across 767 observer samples with both workloads active |

The full PostgreSQL receipt names the accepted revision and committed fixture
blob `20f36f1b89fc1dca61845a024943a3852f0efe94`. It verifies Windows, Node 24.21.0,
npm 11.19.0 and PostgreSQL 18.6 at `127.0.0.1:55438`, database `navard_i1_test`,
UTF8 and separate restricted runtime/migration roles. It records the original
stopped state and the verified stopped state after the completed test run.

| Retained local artifact under artifacts/tests | SHA-256 |
| --- | --- |
| p4a-acceptance-clean-full-pg.log | e7377a154bf9307f9a23dcabea38c1355a441e8568852c5ae570b7e0e8ba3946 |
| p4a-acceptance-clean-full-pg-environment.json | 73831b96d90aff3e8e2975a4d1af4488e78930bf37fd4924e5e740e8173218d2 |
| p4a-acceptance-corrected-static-unit.log | 0deafb5c69425b006c9f3925c2e5fe3252a202ded8e1edb0fa816c560cad95eb |
| p4a-acceptance-final-chromium-results.json | 675b84fb5c295e85bcfba58376ebd22dec088bdcccfba7f42c185a21856ee3fb |
| p4a-acceptance-final-chromium.log | aca8dfee71ca263a1bf87398432d32bcbf39d61ac14dc831c58b6a65de8b6ac9 |
| p4a-performance-20261106120310434.json | a197f84320562076a29ac3240051a151cfbfe6317429b76cdeb60e0c7c71a0fc |

These artifacts remain local and ignored by Git. Prior setup failures, failed
writer-gate measurements and the earlier stale-fixture run remain historical
evidence. The later single full PostgreSQL invocation resolves the P4a full-run
discrepancy. This acceptance-recording task executes documentation checks only.

## Nonblocking software-acceptance limitations and future gates

**Index write overhead.** The 2.21% writer-p95 increase compares legacy and P4a read
loads under the same five-index configuration. The two writers execute receipt
commands. The benchmark uses synthetic data with a legacy-heavy distribution,
and isolated index-cost controls varied. Complete migration-wide write overhead
against the pre-0019 schema remains unquantified. A separate representative
measurement is required before factory deployment or operational performance
acceptance. The existing ordinary CREATE INDEX migration can block writes while
it runs. PostgreSQL shared buffers were cold after verified restarts, while the
OS filesystem cache was uncontrolled.

**UI/UX skill reproducibility.** The installed `ui-ux-pro-max` package, modified
`AGENTS.md` and `skills-lock.json` were available for local implementation and
remain outside the accepted implementation commit. Tracked project files alone
cannot reproduce that skill configuration. A separately reviewed tooling and
governance change must resolve this before the next frontend implementation stage.
The installation and its working-tree changes are preserved outside this commit.

The historical P2 257-Unit residual retains the UNKNOWN triggering-exception and
nonblocking classification accepted in
[APR-047](APR-047-p2-owner-acceptance-software-first-roadmap.md#explicit-nonblocking-historical257-residual).
The current 257-Unit case passed in the clean full run. A new failure would need
its own retained diagnostics and assessment.

## Current phase and next proposed workstream

P1, P2 and P4a are accepted within their bounded software scopes. Thirteen
previously accepted backend capabilities keep their recorded scopes. P4a adds
Warehouse read/UI coverage and does not count as another backend module.

**P4b — Sales UI is the next PROPOSED workstream and awaits separate Owner
authorization for discovery, design and implementation.** P4a's ACT-WH projection
does not grant Sales access. Required Sales/customer/stock reads and the precise
workflow must be assessed under that future directive. The skill reproducibility
gate applies before any subsequent frontend implementation.

The Owner permits governance/status/roadmap Markdown, documentation validation
and one coherent local documentation-only acceptance commit in this task.
Software acceptance supplies no factory deployment, operational UAT, pilot,
remote push or later-slice implementation authority. P3 retains its software,
environment, security, restore, training, support and operational approval gates.
The next action after local recording is to await a separate P4b directive.

## Recording validation

Independent documentation review verified the exact accepted revision, all six
artifact fingerprints, limitations, future gates, prior residual and next-scope
boundary. Its required historical Chromium-reference correction was applied and
re-reviewed. No required documentation finding remains.

Documentation validation passed for 15 Markdown files, 865 local links, 8 anchors
and 152 metadata dependencies. APR-000 through APR-049 are unique and contiguous,
and every APR record has a register link. The local receipt is
`artifacts/tests/p4a-owner-acceptance-validation.json`. Explicit-path staging,
Git whitespace checks and final diff review precede the local acceptance commit.
