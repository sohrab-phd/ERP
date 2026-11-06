---
id: IMPL-P4A-001
title: P4a Warehouse Inventory visibility implementation and evidence
phase: 12-implementation-planning
status: in_review
version: 0.2.0
owners: [delivery-lead, inventory-domain-owner, security-architect]
depends_on: [APR-048, PLAN-P4A-READS-001, PLAN-P4A-SOURCES-001, IMPL-P4A-UI-SPEC-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-11-07
approval: null
---

# P4a Warehouse Inventory visibility — delivery evidence

**P4a IMPLEMENTED — FORMAL OWNER ACCEPTANCE PENDING**
[APR-048](../00-governance/approved-baselines/APR-048-p4a-inventory-visibility-implementation-authorization.md)
records D1/D2/D4 approval and conditional D3 index authority in governance commit
`0e90d9068ae7dae3a70e715f7e56b8a5f581ee28`. The approved design baseline on `main`
is `12e4ea8b60aed301b86bb15985da4a3423968789`. APR-047 records P2 acceptance at
`f6ef316c711474775b158e8d12fea4a885f2f368`. This record covers P4a implementation
and local verification. Formal acceptance remains an Owner decision.

## Bounded goal, workflow and execution plan

Personal organizational ACT-WH discovers stock without knowing UUIDs, filters and
pages current Units, inspects canonical Unit/source and Lot-associated Units,
refreshes read-only and returns safely within the existing Persian RTL P1/P2 shell.
Ledger truth/verified Balance, exact kg, active-link/lifecycle rules, sole IPS
posting and source ownership remain binding. Existing Identity/Inventory/receipt/
I2/reservation/MAKE/shipping and browser transport are dependencies, not new writers.

Internal plan under one grant: (1) record authority and preserve baseline/unrelated
work; (2) secure Inventory owner reads and measured justified indexes; (3) native
WH UI with mandatory skill; (4) frozen Windows static/unit/real-PG/Chromium/
performance/regression proof; (5) independent engineering/security/database/QA
review, required fixes and retest; (6) canonical evidence, explicit staging and a
local delivery commit. Owner acceptance is the next gate.

## Implemented read responsibility and public contracts

| Area | Source / responsibility |
| --- | --- |
| Inventory public read owner | [discovery.ts](../../apps/backend/src/modules/inventory/discovery.ts), [public exports](../../apps/backend/src/modules/inventory/index.ts): strict scalar input/whitelist, exact Ledger sums/Balance/claim/issue/state integrity, source-family projection, canonical quantities and signed cursors |
| Inventory persistence | [inventory-discovery-store.ts](../../apps/backend/src/infrastructure/postgresql/inventory-discovery-store.ts): scoped SELECT-only candidates/origins, bounded Ledger batch and active-link/Balance batch, three Inventory data statements, no N+1 locks |
| Composition and connection lifetime | [composition-root.ts](../../apps/backend/src/composition-root.ts), [transaction.ts](../../apps/backend/src/infrastructure/postgresql/transaction.ts): privately admitted genuine actor/read snapshot, bounded checkout/abort/late-client cleanup, current authority after snapshot release including failed reads |
| Closed browser reads | [inventory-http.ts](../../apps/backend/src/transport/inventory-http.ts), [browser-http.ts](../../apps/backend/src/transport/browser-http.ts): only three browser POST routes, existing cookie/CSRF/Origin/Host guards, bounds/sanitized errors; no generic bearer forwarding |
| Native interface | [inventory.ts](../../apps/backend/src/operator/inventory.ts), [app.ts](../../apps/backend/src/operator/app.ts), [index.html](../../apps/backend/src/operator/index.html), [styles.css](../../apps/backend/src/operator/styles.css): WH navigation/list/eight exact filters/pages/Unit/Lot/refresh/back, exact Persian strings and session/view-owned continuations |

| Query v1 | Exact browser-only POST route |
| --- | --- |
| DiscoverInventoryUnits | /ui-api/inventory/v1/units/query |
| GetInventoryUnitDetail | /ui-api/inventory/v1/units/detail |
| ListInventoryLotUnits | /ui-api/inventory/v1/lots/units/query |

The approved [read design](P4A_INVENTORY_READ_CONTRACT_DESIGN.md) remains the exact
shape/error/bounds contract and [source/state matrix](P4A_INVENTORY_SOURCE_AND_STATE_MATRIX.md)
owns each field's authoritative mapping. No command envelope, durable command
outcome, stock write, repair or rebuild follows from a read. Legacy keyed WH/SEC
routes retain their accepted contracts; Sales availability and I2/Production
documentary ports are unchanged.

All three origins and their actual semantics are distinct: legacy receipt count/
measured total, I2 independent accepted physical-unit W1 (all three association
kinds), Production FINAL/WIP/RESIDUAL and shared ProductBatch/Lot. Five current
states are supported; Unit/Lot additionally shows zero-stock CONSUMED/SHIPPED as
historical. Enum-only SCRAPPED/RETURNED/CLOSED are unavailable. Immutable original
WIP disposition is not a claim that a subsequently finalized Unit is still issued.
No W2/W3 or count-derived weight is allocated to physical Units.

Quantities are canonical exact decimal strings, including integers beyond2^53 and
up to18fractional places without Number/rounding. Unreserved is onHand minus
reserved, never permission to sell, dispatch or consume. Origin initial weight
and issue initial quantity are separate from current Ledger stock/remainders.

## Privacy, consistency and resource behavior

Only personal current organizational WH in trusted installation=authority receives
the D1 Inventory-only exception for customer/allocated stock. No customer ID/key,
commercial/demand/reservation ownership, production orders/operations/personnel,
raw Ledger/audit/outcome or secret fields. Customer relationships remain internally
stored and checked. SQL scope precedes paging/lookahead/enrichment; no denied-row
counts or anchors. Missing/foreign/unsupported/denied Unit/Lot uses the same404.
Current session/account/grant revalidation follows snapshot connection release.

Descriptive-field source review found physical/operator code and independent
product-identifier semantics plus recorded material-kind text; no accepted source
rule requires customer identity or commercial linkage in those approved fields.
The projection does not fetch customer/document names or join those owners. No
real factory/customer dataset was inspected or certified free of arbitrary text;
a demonstrated future semantic conflict must follow APR-048's explicit stop/Owner
rule, not silent redaction or normalization of approved codes.

One RR READ ONLY snapshot covers the committed before-or-after bundle. Candidates
come from lifecycle/source membership, never a Balance-positivity filter that
could hide corruption. All returned and lookahead candidates reconcile Ledger,
Balance and exact active claim/issue rules. Missing/corrupt evidence fails the
entire page, never repairs or drops a row after paging. No FOR UPDATE/advisory
Inventory writer locks. Independent pages have independent freshness and may
omit newly matching/inserted UUIDs behind the anchor until refresh.

Default25/max50, <=51candidates, <=10000Ledger rows and <=4Inventory statements
(currently3), body8KiB/depth4, response128KiB,16active handlers. Cursor HMAC binds
query/filter/page size/Lot/principal/session/scope/policy and expires600s after
ORIGINAL issuance. Read lock1s/statement4s/full-handler8s/browser15s limits apply.
Transport cancellation starts at7.8s, reserving200ms inside the8s budget for
sanitized error serialization; composition retains its8s backstop. A hot Unit
whose history exceeds10000rows fails422 explicitly; narrower filters cannot
solve that single-Unit overflow. No partial/truncated success or stale fallback.

## Native Persian UI and mandatory skill

[Small UI specification](P4A_UI_DESIGN_SPEC.md) records complete installed
ui-ux-pro-max/SKILL.md and applicable supporting-reference/search use. Current
P1/P2 green/light/Tahoma/Segoe16px native shell is preserved. Generated marketing
patterns, external fonts/framework/dependency/export/sort/cache suggestions were
not adopted. Exact source/quantity fields, semantic controls/table, labels and
keyboard focus, isolated UUID/code text, responsive dense rows and complete
loading/empty/validation/cursor/error/session/freshness states are implemented.
Actual Chromium verified the native journey, focus, text rendering, RTL at 375px,
200% zoom, contrast and reduced motion.

Session epochs and Inventory request/view generations own every asynchronous
continuation; abort alone does not grant rendering rights. Logout/actor/role/
session loss clears private Inventory rows/filters/cursors. No Inventory data in
browser storage/URLs; existing encrypted P1/P2 pending-intent recovery is retained.

## Executed verification and independent review

| Evidence | Result |
| --- | --- |
| Runtime | Restored existing ignored Node24.21.0/npm11.19.0 and PG18.6 cluster at127.0.0.1:55438; actual navard_i1_test, distinct restricted runtime/DDL-owner, separate dev DB/ACK and UTF8 verified; no cluster initialized/replaced or18.2service substituted |
| Unit/component | Final frozen runner passed 271/271 with zero failures, cancellations or skips. Independent focused backend/UI run passed 19/19 |
| PostgreSQL | 398 distinct cases passed across the full frozen run and the focused rerun. The full run passed all 366 unchanged cases and failed one P4a fixture assertion, also counted against its parent. The corrected 32-case P4a suite passed with exit 0 and zero skips or cancellations. Final server deadline 7,806.21 ms, client 7,812.34 ms |
| Chromium | Chrome 156.0.8078.81 against the final composed app and PostgreSQL 18.6 passed 22/22 with zero failures, skips or console errors. The fixture exited normally. Covered native RTL at 375 px and 200% zoom, exact Persian quantities, focus, all filters, session/race protections, actual cross-origin and Host/CSRF denial, and P1/P2 same-key recovery. The 34 sampled contrast ratios had a 7.20:1 minimum |
| Performance/indexes | Revised PostgreSQL 18.6 run passed all measured gates with 100,000 Units, 4,604 warm reads overlapping both writers and 400 writer samples per variant. Retained 0019 exact-five index migration passed all four migration tests, including populated 0018 upgrade |
| Static | Frozen runtime/package preflight, full Prettier, ESLint, ownership boundaries across 187 files, TypeScript and operator asset build passed. Earlier authored test typing and formatting corrections are reflected in the final source |
| Independent review | Non-author engineering, security, database and QA review examined the implementation and actual evidence. The medium Refresh/re-entry filter mismatch and the required admission fixture update were corrected and retested. The independent focused run passed 19/19. The review examined the final PG and Chromium logs, D3 plans, measured concurrency and migration. No high, critical or required finding remains open |

The pinned `npm run verify` invocation recorded preflight, format, lint, ownership,
typecheck and 271 unit cases before running all 398 real-PG cases. It exited 1 after
396 passes because the admission fixture still intercepted the previous Identity
method. The stale assertion and its parent are the two failures counted in
`p4a-verify-final-third.log`. Only that fixture changed. The full affected file,
run using `node --env-file=.env.local --test apps/backend/dist/tests/integration/inventory-discovery.test.js`,
passed all 32 cases in `p4a-inventory-pg-final.log`, including admission at 16/17,
revocation, resource limits, intact WIP finalization and concurrent paging. The
366 unaffected cases and corrected 32 provide 398 distinct passing cases across
two invocations. The focused migration log is `p4a-migration-final.log`.

The final `node tools/test/p4a-chromium.mjs` evidence is in
`p4a-chromium-final-verified.log` and `p4a-chromium-results.json`. The first final
launch in the restricted shell failed before test execution because the Chromium
GPU process was denied. The approved Windows retry kept Chromium's browser sandbox
enabled. Startup failure and earlier harness corrections remain in the local logs.
The final pinned preflight, format, lint, boundaries, typecheck, unit and build
output is in `p4a-static-unit-final.log`.

### Owner readiness audit corrections

The readiness audit of `d10983a92f898e09c76c92b4698f0ffa7db20bb2` reproduced a
superseded Inventory 403 locking the active workspace and a Back loop when an
operator reopened the same Lot from one of its Units. The first audit browser run
reproduced the 403 failure against that revision. The corrected shell ignores
responses from invalidated Inventory requests before applying session or idle
timer effects. Current denials still lock the workspace. Reopening the same Lot
restores focus to the Unit without replacing the original detail and list path.
Independent review reproduced both defects and verified the fixes.

The audit browser suite exercises those two paths and a delayed response across
same-account cookie and CSRF rotation. The PostgreSQL snapshot test now covers
reservation, packing, issue, consumption and dispatch with real owner commands
committing during a paused read. Continuation tests check changes in filter
membership and quantities ahead of an existing cursor. The Ledger test covers the
exact 10,000-row success boundary and the 10,001-row rejection. The suite inventory
and case count remain the same. The audit uses a separate full-suite output and
environment record for the corrected commit under `artifacts/tests/p4a-acceptance-*`.

The correction affects frontend navigation and response ownership, plus test
coverage. The measured server, SQL, writer and index code is the same, so the
existing benchmark remains the performance evidence for the corrected revision.

### Scale benchmarks and candidate evidence

The disposable PostgreSQL18.6 dataset contained100000Units and277025Ledger rows,
including99993legacy,3I2,4production Units, all seven supported states, two customer
scopes and19997installation/authority distractors. Visible non-hot histories were
1–99 rows and one historical Unit had10002Ledger rows. This is explicitly a
legacy-heavy synthetic workload; it supplies no measured factory distribution.
Fixture setup retained production triggers. The first one-transaction bulk seed
hit PostgreSQL53200 at the existing per-code advisory lock trigger. Batching500
receipts per fixture transaction resolved setup without altering cluster settings
or product behavior. The failed attempt remains in the local evidence.

The first measured no-index run held ten readers and two writers in the same
composed application pool. All623measured Inventory reads overlapped both writers.
Warm server p95 was135.03ms, p99 216.74ms and max291.31ms. Writer p95 was141.49ms
against94.59ms under the legacy-read comparator, a **49.58% regression** that
failed the10% gate. Across291mixed lock samples with both sides active, observers
saw zero Inventory reader writer-lock acquisitions or attributable writer blockers.
PostgreSQL shared-buffer-cold default server observations were236.04/250.17ms;
OS filesystem cache was uncontrolled. The no-index result is retained as failed.

| Approved candidate | First actual EXPLAIN ANALYZE execution evidence |
| --- | --- |
| Scoped Unit/Lot/Unit | Lot lookup16.890→0.110ms, shared hits1701→10 |
| Scoped Unit/state/Unit | RESERVED10.534→0.133ms, shared hits1705→14; negative AND29.089→0.059ms |
| Scoped Unit/kind/Unit | Negative kind10.610→0.059ms, shared hits1695→3 |
| Scoped Unit/location/Unit | Negative location10.348→0.066ms, shared hits1695→3 |
| Scoped legacy C code/Unit | Legacy code20.793→0.237ms, shared hits2575→15; negative13.702→0.110ms |
| Scoped I2 C code/Unit | Candidate unused in all18plans on the declared legacy-heavy fixture |

The first isolated writer-cost series was affected by post-cold/seed warmup drift.
The next run used warmed controls before and after each index measurement. It
tested the first five candidates together and omitted the I2 code candidate.
The 822 measured Inventory reads overlapped both writers, and all 100 measured
writes overlapped ten readers. Server p95 was 67.46 ms, p99 was 73.22 ms and max
was 81.76 ms. No writer lock or attributable writer blocker was observed across
173 mixed samples with both workloads active. Writer p95 was 117.21 ms versus
105.97 ms under the legacy-read comparator, a **10.61% regression** that failed
the 10% gate. The separate isolated writer comparison measured 25.06 ms with
five indexes against 20.92 ms without them. Its short paired samples showed
variation, so a single candidate's lower p95 is insufficient to claim a writer
improvement.

Independent review identified a duplicate session and grant load in the Inventory
HTTP handler. The handler now derives actor and cursor binding from the same
Identity session load. Both fresh composition authority checks and the transport's
error-path check still apply. The revised benchmark used the same workloads and
targets and raised the minimum to 1,000 reads and 100 writes per writer in each A/B
round. Both earlier measured failures remain in the evidence.

The revised run exited 0 on Windows 10 build 19045, Intel Core i3-10100F with eight
logical CPUs and 15.90 GiB RAM. The frozen runtime was Node 24.21.0 and PostgreSQL
18.6 x86-64, with the same composed pool of 10 connections, 5-second checkout
budget and 16 Inventory handler slots. A/B/B/A alternates accepted keyed Unit reads
against Inventory page/filter reads under the same five indexes, two personal
receipt-command writers and 10 distinct personal Warehouse readers. The legacy
read returns one Unit and the Inventory read can return a page. This comparison
isolates the read-load change at the selected index configuration.

| Measure | Revised actual result |
| --- | --- |
| Warm Inventory server latency (p95 / p99 / max) | 42.89 / 55.36 / 79.21 ms across 4,604 requests. All overlapped both writer workers |
| Writer p95 | 100.78 ms with legacy reads, 103.00 ms with Inventory reads, **+2.21%**. All 400 measured writes in each variant overlapped all 10 readers |
| Writer p95 by round (A/B/B/A) | 87.21 / 118.07 / 93.52 / 103.49 ms. Pooled p95 includes all 400 in-window writer samples per variant |
| Lock samples | 767 mixed samples with active read and write transactions. Zero observed Inventory writer locks or attributable writer blockers. The real-PG suite separately exercises overlapping stock writes |
| Cold / warm default server read | Verified PostgreSQL shared-buffer restart yielded 231.68 ms without indexes and 210.28 ms with five indexes. Four warm observations per phase gave p95 10.98 / 7.59 ms. OS filesystem cache was uncontrolled |
| Hot history | 10,002 Ledger rows yielded 422 with no partial result |
| Isolated D3 writer cost | 40 measured writes at p95 16.97 ms with five indexes, against 80 pooled no-index samples at 23.08 ms. The separate no-index controls were 12.57 and 23.64 ms p95. The previous isolated comparison measured 25.06 vs 20.92 ms. This variation leaves the upgrade-wide writer delta unquantified |

The final isolated p95 ratios versus pooled no-index writer brackets were 1.096
(Lot), 0.590 (state), 0.945 (kind), 1.410 (location), 1.167 (legacy code) and 1.083
(I2 code). Each index phase had 40 measured writes and 10 warmups and each pooled
comparison used 80 control writes. The measured writer is the legacy receipt
command, which does not update the I2 origin index. Candidate costs and controls
varied between runs. No individual or combined writer improvement is inferred.

[Migration 0019](../../database/migrations/0019_inventory_visibility_indexes.sql)
retains five tested B-tree keys for scoped Unit Lot, state, kind and location and
the exact legacy `C`-collated code. In the revised combined plans, candidate
statement shared hits fell 1702→10 for Lot, 2575→15 for legacy code, 1696→3 for
negative kind and location, 1706→14 for state and 1696→4 for negative AND. Dense
positive filters and late-page cases did not all gain equally. The I2 code index
was unused across all 18 measured cases on this legacy-heavy fixture and was
omitted. The frozen migrator applies only the five index statements in one
checksum-bound transaction. Migrations 0001–0018 retain their original bytes.
Ordinary `CREATE INDEX` takes a table lock that can block writes during migration.

Run the benchmark with pinned `node --env-file=.env.local tools/test/p4a-performance.mjs`
and `P4A_PERF_COLD=1` on the exclusive verified disposable cluster. Set
`P4A_RETAIN_INDEXES=p4a_unit_lot,p4a_unit_state,p4a_unit_kind,p4a_unit_location,p4a_legacy_code`
to reproduce the tested selection explicitly. The archived
`p4a-performance-20261106120310434.json` contains timings, all 18 before/after and
per-candidate plans, raw overlapping samples, writer controls and lock counts.
Its SHA-256 is `a197f84320562076a29ac3240051a151cfbfe6317429b76cdeb60e0c7c71a0fc`.
The original no-index and first combined failures are retained in
`p4a-performance-20261106065715875.json` and `p4a-performance-20261106070121126.json`.

Evidence files under `artifacts/tests/p4a-*` are local and ignored by Git. The
verification scope is the isolated Windows test environment with synthetic data.

## Exclusions and repository boundary

No stock posting/adjustment/rebuild, reservation/release/expiry, shipping/production/
Sales/Finance workflow, extra-role/customer/portal access, customer selection/admin,
history/analytics/export, QC/returns/scrapping/new masters, hardware/framework/
dependencies, provisioning/UAT/pilot/deployment, P4b–P5, push or history rewrite.
P3 operational prerequisites and P2 historical257UNKNOWN residual remain intact.

Pre-existing AGENTS.md modification, `.agents/skills/ui-ux-pro-max/` and
`skills-lock.json` are fingerprinted in ignored
`artifacts/tests/p4a-preserved-installation.json`, preserved and excluded from P4a
staging and commits. The commit containing this delivery record is the local P4a
implementation handoff under APR-048.
