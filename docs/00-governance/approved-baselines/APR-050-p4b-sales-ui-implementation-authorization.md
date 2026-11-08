---
id: APR-050
title: Owner D1-D7 decisions and bounded P4b Sales UI implementation authorization
phase: 12-implementation-planning
status: approved
version: 1.0.0
owners: [project-sponsor]
depends_on: [APR-049, PLAN-P4B-CAPABILITIES-001, PLAN-P4B-DESIGN-001, PLAN-P4B-DECISIONS-001, PLAN-P4B-READINESS-001, TOOL-UIUX-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-11-07
approval: Actual Owner FORMAL P4b SALES UI IMPLEMENTATION AUTHORIZATION attached in this chat
---

# Actual P4b implementation authority — not product acceptance

The actual Project Owner attached **OWNER DIRECTIVE — FORMAL P4b SALES UI
IMPLEMENTATION AUTHORIZATION** in this chat, selecting the decisions below.
This records that human grant, not agent approval. Before product work, `main`
and HEAD matched approved design `e7e7cafab0b052b34b9fd58fa66269dd74792749`;
the working tree was clean. Tooling commit
`506dd000e87c331527445e8212656cfc2aefc756` and accepted P4a product
`6c0fbbbed05eeb81ccf7564b2bbd7cfc7caebf10` are ancestors. APR-000–049 were
verified unique/contiguous and APR-050 unused. No previous APR is altered.

The four design documents at that exact revision are approved subject to this
directive: [capability matrix](../../12-implementation-planning/P4B_SALES_EXISTING_CAPABILITIES_AND_GAP_MATRIX.md),
[workflow/contracts](../../12-implementation-planning/P4B_SALES_UI_WORKFLOW_AND_CONTRACT_DESIGN.md),
[decision sheet](../../12-implementation-planning/P4B_IMPLEMENTATION_AUTHORIZATION_DECISIONS.md)
and [review/readiness](../../12-implementation-planning/P4B_DESIGN_REVIEW_AND_READINESS.md).
Design-time OPEN and NOT AUTHORIZED text remains historical proposal wording;
this record controls the present bounded grant. No formal P4b acceptance exists.

## Actual approved decisions

The Owner subsequently explicitly answered **"Authorize the bounded APR-050 gate
reconciliation"** to the exact question about updating
`.cursor/architecture-gate.json` and local `.cursor/IMPLEMENTATION_UNLOCK.json`
to APR-050's bounded P4b paths, excluding all migrations. This permits only that
reconciliation; hooks, OS controls and services remain unchanged.

| Decision | Owner selection / binding boundary |
| --- | --- |
| D1 | B APPROVED: operational native Sales demand UI, all six existing commands unchanged: DraftSalesOrder, SubmitSalesOrder, DraftFulfillmentAssessment, RecordFulfillmentStock, RecordFulfillmentMake, ConfirmSalesOrder. |
| D2 | A APPROVED: current personally authenticated exact-customer ACT-SALES grants intersect configured Sales references in trusted installation/authority. No org Sales prerequisite/wildcard or invoice-evidence/WH exception reuse. |
| D3 | A APPROVED: bounded customer-scoped order and assessment discovery, exact filters and technical UUID identity, no guessed chronology/number/business dates. Explicit assessment choice; DRAFT default STOCK is not recorded evidence. |
| D4 | A APPROVED: Inventory-owned authorized order/item candidate read, org or same-customer AVAILABLE positive exact verified kg, no disqualifying claim/reservation/issue, all three supported origins only where lifecycle permits. Minimal whitelist and additional code-disclosure safeguard below. |
| D5 | A APPROVED: related reservation/shipping/production projections/actions deferred; only Sales-owned order/assessment states/evidence here. Absence of a projection is not zero related activity. |
| D6 | A CONDITIONALLY APPROVED: bounded owner reads now. No automatic new migration. New index requires precise query/SQL/EXPLAIN BUFFERS/rows/read benefit/write-overhead with-and-without-index/deployment-rollback evidence, independent DB/security review, then separate Owner approval before migration. |
| D7 | A CONDITIONALLY APPROVED: workload discovery and measurement now; numeric per-operation p95/p99 and writer-regression budgets require separate explicit Owner approval before performance acceptance. No unilateral PASS threshold. |

## Exact product and disclosure boundary

Exactly seven browser-only POST routes under `/ui-api/sales/v1/`:
`customers/query`, `orders/query`, `orders/detail`, `assessments/query`,
`assessments/detail`, `stock/query`, `commands`. First six read only; final route
is a fixed adapter for the existing six commands. No generic proxy, alternate
route, unrestricted cookie-to-bearer bridge or changed accepted bearer behavior.
Strict duplicate-safe JSON, unknown-field rejection and exact DTO/filter whitelist
follow the approved design. All but roster require exactly one x-customer-id;
roster rejects a selector. No caller role/identity override.

Roster authenticates the personal session without fabricating an org context.
Bootstrap exposes only a bounded Sales-capability marker, not customer/grant arrays.
Scope precedes labels, predicates, limits and lookahead. After releasing the
snapshot, freshly validate the session and every returned/lookahead customer grant;
any revoked member rejects the whole page with no label/membership/cursor leak.
Other Sales reads likewise freshly reauthorize actor/customer after snapshot
release, including before object-derived errors. Revocation/expiry takes precedence.
Preserve exact Host/Origin/CSRF/cookie/same-origin protections and role separation.

Stock whitelist: unitId, internalCode:string|null, kind, state:AVAILABLE,
availableKg. No owner/customer key, Lot, location, origin/commercial/competitor/
production details, reservation totals or WH-wide inventory. Before code exposure,
inspect generation/provenance across origins. If confidentiality safety cannot
be established, return null. The code filter must only match disclosure-safe
eligible records, or be disabled pending specific Owner decision; never become
an existence oracle. Record evidence and negative tests. No assumption that a
WH-visible code is Sales-safe. Stock discovery uses bounded set-based parameterized
Inventory reads, no per-row locking availability, writer locks, writes, silent
zero, stale cache or Balance reconstruction. Preserve existing command-time locks
and fresh Ledger/Balance/claim/issue validation. Candidates are not allocation.

## Bounds, invariants and browser safety

Read-only short REPEATABLE READ snapshots; page default25, allowed10/25/50,
UUID-ascending keyset, purpose HMAC cursor original600s TTL/max2048 ASCII chars
bound to actor/session/installation/authority/customer/route/filters/parent/limit/
policy. No totals, chronological order or frozen traversal claim. Read8KiB/depth4,
response128KiB, maximum51 authorized rows,16active reads/process, lock1s,
statement4s/whole8s/browser15s, ≤4ordinary Sales data statements excluding
transaction/Identity checks, ≤4Inventory data statements and ≤10000Ledger rows/page.
These are starting caps, not performance guarantees; an essential over-cap case
returns for bounded Owner decision, not relaxed or truncated silently.

Existing command4096 UTF-8 bytes/depth rules remain. Check complete serialized
envelope before dispatch; explain excess in Persian, never truncate/increase cap.
Persisted drafts and recorded assessments immutable; explicit matching RECORDED
assessment to confirm SUBMITTED order. IN_PRODUCTION only via accepted release.
Whole canonical ASCII Sales demand and exact fractional Inventory strings remain
distinct, including >2^53; no Number kg, floating point or rounding. No invented
pricing, currency, tax, business numbering, promised date, SKU or specification engine.
Confirmation does not reserve/guarantee/ship; MAKE does not start Production;
only accepted Reservation commands allocate. Existing concurrency/transactions/
idempotency/domain commands and authority remain unchanged.

Use pinned verified ui-ux-pro-max and the native Persian RTL HTML/CSS/TypeScript
shell, existing typography/layout, PROC/WH workspaces and recovery namespaces.
No framework/font/dependency/design-system replacement. Accessible exact/copyable
quantities/UUIDs, immutable warnings, selected assessments, linked errors/focus,
responsive/zoom/keyboard and explicit financial-NOT_SUPPLIED/stock-not-guaranteed
messages follow design. Bind every continuation to installation/authority/account/
person/role/customer/session epoch (including same-account CSRF rotation) and
request generation before stale success/error/finalizer/lock/idle side effects.
Current denials lock; superseded denials cannot lock a newer valid workspace.

At most one unresolved write per tab across PROC/WH/Sales. Preserve exact command,
target/payload/key/actor/customer and original encrypted ciphertext; no migration
or overwrite on role/customer switches, no tokens/plaintext persistence or queue.
Secure-storage failure prevents first dispatch. Multiple old records fail closed
for all new writes until authorized exact-context resolution or informed close.
Close is not cancellation. Read-only navigation may continue under interlock.

## Evidence gates, exclusions and handoff

Require new scoped unit/contract and complete real PostgreSQL18.6 tests at final
product revision, existing restricted runtime/DDL roles and disposable safeguards;
no18.2service substitution, cluster recreation/destruction. Record command/env/
counts/exit/full output and restore initially stopped cluster. Exercise A/B/org/
WH-Sales/selector/parent/cursor/session/roster-lookahead revocation, stock integrity,
reservation/issue/dispatch races, same-key/lost COMMIT and cross-role recovery.
Actual Chromium uses real backend+PG: full STOCK/MAKE journeys, exact kg, stale
responses/denials/rotation/storage, both interlock directions, keyboard/focus/RTL/
mobile/200–400%zoom/contrast. Run P1/P2/P4a regressions; old evidence is not new
verification and new failures cannot be disguised as APR-047 historical residual.

Performance tiers must state actual inputs versus synthetic assumptions, seed,
dataset/revision/environment/cache/concurrent intervals and raw samples. Separately
measure roster/orders/detail/assessments/stock/browser and Sales/Inventory writers,
p50/p95/p99/throughput/timeouts/pool/plans/locks and writer impact. Distinguish
same-schema reader impact from any index write cost. Submit measured workload,
proposed per-operation numeric budgets/writer allowance/tradeoffs for Owner decision.
P4a migration-wide writer-overhead deployment/operational gate remains open.

Independent engineering/security/database/QA-UI implementation reviewers inspect
actual code/tests/runtime/logs; design review is no substitute. Fix/retest all
required/blocking/high/critical findings. Coherent local implementation commits
are authorized, with delivered behavior/limits/evidence documented. No accepted
APR/history/migration bytes, business commands/RBAC/bearer policy changes without
separate authority. No P3/P4c/P4d/P5, pricing/finance/CRM, cancel/edit/hold/close,
business number, export/print/notification/portal, remote push/deployment/pilot.
P4b remains NOT ACCEPTED. Stop for actual performance/acceptance decisions; never
self-create formal product acceptance or silently clear a conditional gate.
