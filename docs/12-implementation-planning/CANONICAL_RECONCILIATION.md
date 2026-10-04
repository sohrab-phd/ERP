---
id: PLAN-CANONICAL-RECON-001
title: Current ERP engineering reconciliation
phase: 12-implementation-planning
status: in_review
version: 1.0.0
owners: [chief-solution-architect]
depends_on: [ADR-0011, ADR-0012, ADR-0013, PLAN-READY-001]
last_reviewed: 2026-10-04
approval: null
---

# Current ERP engineering reconciliation

This records actual post-hook-retirement engineering. Earlier restricted reviews
are historical, not evidence for current PASS. Delegated technical decisions do
not approve a human implementation baseline. The gate remains false/null and
unlock absent. No product implementation, dependency installation or OS change.

## Source coverage and precedence

Live CURRENT_PHASE, DECISIONS, OPEN_QUESTIONS and recorded factory evidence control.
Historical APR/CHK manifests and earlier phase self-checks/reviews/handoffs record
their dates; they do not reopen answered OQs or select packages for the present.
Current normative contracts have been reconciled by the reviewers below.

| Corpus | Actual engineering coverage |
| --- | --- |
| Governance/canonical registers | README, current phase, charter, decisions/OQ/approvals, domain/data/transition/traceability/slice registers; human approval vs delegated decision kept separate |
| Domain/process/state | Capability/ownership/actors/process/MVP rules, invariants, state and transition catalogues, side effects, concurrency, corrections, sequences and accepted factory facts |
| Database | Posting kernel, transaction/idempotency, logical/attribute/enforcement models, genealogy, retention/opening-stock and recovery contracts |
| Application/security | Command/query catalogues, API/orchestration/module dependencies, background contracts, threats, identity/RBAC/customer isolation, audit and verification |
| QA/integration/repository | Test levels/scenarios/property/trace/NFR/gates; integration/observability/recovery; logical layout/import ownership/conformance; source vs generated artifacts |
| Planning | Roadmap, work items, slice homes, cutover/spike intents; definitive command/stack/physical/backlog and independent readiness package |

Detailed source inventories and review bounds are recorded in
[independent domain/testing](REVIEW_INDEPENDENT_DOMAIN_TESTING.md),
[independent database/security](REVIEW_INDEPENDENT_DATABASE_SECURITY.md),
[database author reconciliation](REVIEW_DATABASE_IDEMPOTENCY_SECURITY.md),
[domain author reconciliation](REVIEW_DOMAIN_BACKLOG.md), and
[stack author reconciliation](REVIEW_ARCHITECTURE_TOOLING.md).
Author self-checks are not counted as independent review.

## Inconsistencies repaired

| Finding | Resolution / authority |
| --- | --- |
| Generic key namespaces included command/principal, accepted-only replay, transport retry called DUP | ADR-0011 binds full scoped key separately to principal/intent; accepted AND rejected terminal replay; mismatches CONFLICT; only owner-mapped different-key natural fact duplicates use DUP |
| Orchestration stored outcome after business commit/event delivery | Facts/original audit/outcome commit together; no external effect before confirmed COMMIT; no product outbox needed in foundation |
| Unique-claim candidate versus terminal advisory-lock candidate | Definitive mandatory three-UUID PK, terminal-only outcome, transaction advisory lock and separate fresh READ COMMITTED lookup, no claim/lease row |
| Rejection could leave tentative effects or cache deadlock/timeout | Handler savepoint rollback; recognized semantic rejection alone durable; infrastructure errors abort whole transaction |
| Crash retry conflated with lossy backup/PITR | Same-key primary resolution for ordinary uncertainty; acknowledged data-loss recovery requires admission fence/reconciliation; absent restored row is not nonexecution proof |
| Production mass balance borrowed OQ-006 fulfillment tolerance | Corrected domain/state/DB/QA/trace/planning; production policy still unresolved before MAKE; no invented number or production loss classification |
| Numeric Residual/Scrap cutoff contradicted human reusability evidence | Human decision governs, old numeric branch marked historical/non-executable; missing decision recording/authority remains later guard, no OQ closed |
| Known Stations/quantity/site/portal rules still labeled unanswered | Distinguished ten recorded Stations from routing storage/lifecycle; measured kg from arithmetic scale; accepted single site/entity and portal visibility from later identity/document inputs |
| Backlog assigned goods receipt to STOCK | Restored canonical PURCHASE home for WI-BUNDLE-GR; all six atomic bundle homes preserved |
| Package/layout deferrals and inaccessible-source claims | ADR-0013 maps logical labels to exact physical tree, verifies supported version compatibility; actual current source reads replace earlier access limits |
| Physical command_version field differed from canonical envelope | Exactly contract_version in envelope, explicit one-to-one command_version persistence mapping |
| QA repeated answered OQ-017, reservation TTL, QC and RPO/RTO as current gaps | Corrected answered application-owned transaction/no confirmed-SO expiry/no current QC; preserve recorded RPO≤60min/RTO≤8h and actual later retention/recovery inputs |

## Accepted facts preserved

Modular Monolith/PostgreSQL; module-owned persistence; ACT-IPS sole quantity writer;
Ledger truth and rebuildable Balance with no negative inventory. Production bundle
and nested residual identity/scrap posting remain unsplit. Genealogy uses all source
families, not Ledger alone. Reservations are not allocations/consumption; one ACTIVE
per unit, no steal/confirmed-order expiry. Sales closes by remaining valid demand,
cancelled or authorized unfulfilled remainder, not payment/invoice/delivery alone.
kg only authoritative quantity; factory measured resolution is not a new universal
minimum or arithmetic rule. Human Residual/Scrap classification, Finance-Lite scope,
weighbridge responsibility, visibility-only portal, no current QC remain intact.

Questions closed or recorded business answers changed by this program: NONE.
OQ-001/003/005/009/011/014/015/019 remain treating as recorded. Future B-F inputs
do not become Class A for a foundation with no business commands. Technical
reconciliation of a documented historical conflict is not an invented business answer.

## Evidence limits

Current proof is source/design/research/repository review. Product unit/integration/
crash/CI tests are precisely planned and execute after human authorization. No
runtime correctness, live application-security proof or human baseline approval is
fabricated. Final independent review and validation evidence control readiness.
