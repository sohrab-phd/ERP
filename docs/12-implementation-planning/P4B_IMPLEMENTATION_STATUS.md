---
id: IMPL-P4B-001
title: P4b Sales UI implementation and verification evidence
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [delivery-lead, sales-domain-owner, security-architect]
depends_on: [APR-050, PLAN-P4B-CAPABILITIES-001, PLAN-P4B-DESIGN-001, PLAN-P4B-READINESS-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-11-08
approval: null
---

# P4b bounded implementation

Authority: actual Owner [APR-050](../00-governance/approved-baselines/APR-050-p4b-sales-ui-implementation-authorization.md).
Starting `main`: `e7e7cafab0b052b34b9fd58fa66269dd74792749`, clean. Accepted
P4a `6c0fbbbed05eeb81ccf7564b2bbd7cfc7caebf10` / APR-049 and pinned tooling
`506dd000e87c331527445e8212656cfc2aefc756` verified ancestors; skill integrity75files
passes. **AUTHORIZED FOR BOUNDED IMPLEMENTATION — NOT ACCEPTED.**

## Execution plan and Definition of Done

1. Record actual D1–D7 selections, exact baseline and bounded scope; preserve all
   accepted history and gate new indexes/numeric thresholds separately.
2. Implement bounded current-personal customer roster, Sales order/assessment
   reads, Inventory item-scoped candidate projection, signed cursors and fresh
   post-snapshot authorization. Investigate code confidentiality before disclosure.
3. Add fixed six-command browser adapter and native Persian Sales workspace,
   exact quantities, immutable review/assessment choice, encrypted recovery and
   one unresolved-write interlock across PROC/WH/Sales. Preserve existing behavior.
4. Run focused then full Windows static/unit/real PostgreSQL18.6/actual Chromium
   regressions, invariants, races and security negatives; retain complete evidence.
5. Measure explicit synthetic/representative workload tiers per operation and
   concurrent writers. Propose numeric budgets for Owner decision, no unilateral
   performance PASS; return any index proposal before migration.
6. Independent non-author engineering/security/database/QA-UI implementation
   review, fix/retest required findings; document actual evidence/limitations,
   coherent local commits and clean tree; stop for performance/acceptance decisions.

DoD: approved customer→discovery→immutable draft→submit→explicit STOCK/MAKE
assessment→confirm workflow with no allocation/production/finance expansion;
all strict DTO/isolation/read bounds and exact quantity/recovery/session invariants;
real passing correctness/security/regression/browser evidence and closed required
reviews. Final readiness requires any applicable separate Owner gates; no formal
product acceptance is self-created. P4a's pre-0019 migration-wide write-overhead
deployment/operational gate remains open and outside this slice.

## Current evidence status

Product code is implemented; final complete-suite and performance verification
are in progress. Latest unit run:292passed,0failed/skipped, exit0
(`artifacts/tests/p4b-implementation/unit-resume-final.log`). Focused PostgreSQL:
22passed,0failed/skipped, exit0 (`focused-postgresql.log`). Actual Chromium:
30Sales checks and25P4a regression checks passed,0failed/skipped, Chrome156.0.8078.81
(`p4b-chromium-results.json`, `p4a-regression/p4a-chromium-results.json`). These
initial browser receipts identify an uncommitted source tree from the design
baseline, not a later commit; final-revision verification remains pending.

Independent final source reviews found no remaining required product defect.
Earlier required idle-renewal, exact cursor-expiry, selected-customer revocation,
customer/filter/reset, pending-state and long-label/hint issues were fixed and
covered by the focused evidence. Database review identified performance harness
plan-capture and true-overlap accounting corrections; these are fixed before
measurement, with final evidence re-review pending. This is not final acceptance.

## Implemented boundary and runtime behavior

Exactly seven POST routes under `/ui-api/sales/v1/`: customers/query, orders/query,
orders/detail, assessments/query, assessments/detail, stock/query and commands.
First six are bounded readonly wrappers; commands is a fixed adapter for the six
unchanged accepted Sales commands. Sales service/contracts, legacy Sales bearer
transport and all19accepted migrations remain byte-identical to the baseline.
No dependency, framework, external font or new schema/index is introduced.

Identity admits a current personally authenticated Sales principal without an org
Sales grant; bootstrap contains only a bounded capability marker. The roster
intersects exact current personal grants and configured customer references before
labels/limit/lookahead. Readonly RR snapshots scope before paging/enrichment, then
freshly reauthorize actor/customer after release, including each returned/lookahead
roster customer. Short abortable admission/data/reauthorization transactions retain
1s lock/4s statement/8s whole deadlines. The exact limits in APR-050 are enforced.
Purpose-HMAC cursors retain original600sTTL and bind current actor/session/customer/
route/filter/parent/page/policy. No totals or cross-page frozen snapshot is claimed.

Inventory owns candidate eligibility and exact Ledger/Balance/claim/issue integrity
checks across all three origins. Reads take no Inventory writer locks and mutate
no Inventory data. Legacy and I2 internal codes accept arbitrary user text;
production has no disclosure-safe generated code. Therefore every internalCode is
null; valid exact code filters return an invariant empty eligible set without
existence lookup. The UI omits that filter and explains confidentiality. Only
unitId/internalCode/kind/AVAILABLE/availableKg are disclosed. Observation does not
reserve or guarantee stock; command-time authoritative validation remains intact.

The native Persian RTL workspace supports granted-customer/order/assessment
discovery, immutable saved drafts, all six accepted commands, explicit recorded
assessment confirmation and STOCK/MAKE workflows. Sales demand is canonical whole
ASCII kg; Inventory remains exact decimal strings, never Number. Full4096UTF8-byte
serialized command size is checked before dispatch with actionable Persian errors.
No prices, business numbers, specifications, allocation, shipping or production
actions are invented. Existing PROC/WH workspaces and encryption stay compatible.

Encrypted Sales recovery uses a separate exact-context namespace and original
idempotency key. One unresolved write interlocks PROC/WH/Sales; storage denial
prevents first dispatch. Definitive outcomes with failed storage cleanup retain a
cleanup-only retry, avoiding a second POST. Epoch/generation/customer/session
guards precede stale success/error/finalizer effects; current denials lock and
superseded denials cannot lock a new workspace. Focus/pageshow validates the exact
selected customer even if another grant keeps the bootstrap marker true.

## Performance and acceptance gates

The versioned deterministic measurement harness defines small/representative/
stress synthetic tiers, explicit skew/grant/assessment/Ledger fanout and same-schema
writer controls. Actual operational volumes have not been supplied. Final measured
raw per-operation/server/browser percentiles, plans/locks/pool waits and writer
impact remain pending. No numeric performance PASS is claimed. Budgets require
separate explicit Owner approval. New indexes require evidence and separate grant;
none is applied. P4a's pre-0019 migration-wide writer-overhead deployment/operational
gate remains unresolved. APR-047's historical residual classification is preserved.

No push, deployment, pilot, adjacent roadmap work or formal product acceptance
has occurred. The disposable18.6cluster must return to its original stopped state
after final verification. Final evidence and local revision(s) will be recorded
before handoff; this intermediate record does not declare readiness.
