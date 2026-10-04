---
id: PLAN-READY-001
title: Implementation Readiness Checklist
phase: 12-implementation-planning
status: in_review
version: 0.15.0
owners: [chief-solution-architect, delivery-lead]
depends_on: [ADR-0001, ADR-0006, ADR-0007, ADR-0011, ADR-0012, ADR-0013, APR-014, GOV-SLICE-HOMES-001]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Implementation Readiness Checklist

Current human decision (2026-10-04): Owner accepts this readiness and authorizes
SLICE-ENVELOPE implementation from baseline
e80a04b15ddf93451cc79ccf81722f564912596d, recorded in APR-018.
implementationAuthorized=true; approvedBaseline=
docs/00-governance/approved-baselines/APR-018-final-pre-implementation.md;
matching local final unlock present. The false/null/absent readiness snapshot
below is historical. Acceptance tests must still pass before implementation
completion; no later business slice is authorized.


PRE-IMPLEMENTATION READINESS: READY FOR HUMAN IMPLEMENTATION AUTHORIZATION
Implementation-start blockers: NONE

The final independent engineering review is PASS for the exact frozen
foundation SLICE-ENVELOPE. Readiness alone did not grant implementation; the
subsequent explicit Owner decision and current baseline are recorded in APR-018.

Historical readiness snapshot before APR-018: implementationAuthorized=false,
approvedBaseline=null, unlock absent, ERP implementation not begun. Current
authorization is true for foundation only. SLICE-ENVELOPE implementation and its
Definition of Done now pass; see the
[implementation report](SLICE_ENVELOPE_IMPLEMENTATION_REPORT.md) for 46 unit/
30 actual PostgreSQL cases on Windows and Linux, independent review and limits.
No next business slice is authorized.

## Current operating model

ADR-0012 records the Owner's trusted-agent decision. The native/OS experiment
and all its installer requests are retired; adversarial containment is outside
project objectives. The Owner emptied the obsolete Codex PreToolUse registration.
After restart on 2026-10-04, repository search, canonical-source reads, official
research and independent agents worked. No denial was bypassed, no replacement
micro-allowlist/security mechanism or administrator action was introduced.

Final implementation authorization, human baseline approval and unlock remain
human-only. Technical readiness/accepted delegated ADRs never activate the gate.
Historical APR/CHK structure approvals retain their original provenance.

## Foundation engineering prerequisites resolved

| Prerequisite | Binding evidence |
| --- | --- |
| Accepted architecture | ADR-0001/0006/0007: Node/TypeScript, Modular Monolith, PostgreSQL; module-owned writes and single ACT-IPS inventory posting |
| Generic command ambiguity | [ADR-0011](../00-governance/adrs/ADR-0011-command-idempotency.md) and [specification](COMMAND_IDEMPOTENCY_SPEC.md): full scoped UUID key, separate principal/command/target/material binding, durable accepted/rejected replay, conflicts vs owner business duplicates, no key expiry |
| Transaction/crash boundary | One client/READ COMMITTED transaction, terminal-only outcome, fresh post-lock lookup, handler savepoint rejection rollback, original audit/facts/outcome atomic; infrastructure/uncertain commit not cached rejection; same-key primary resolution; lossy restore fenced |
| Trusted identity/result access | Server-derived context and current authorization rechecked after lock; cross-principal nondisclosure; no production synthetic auth or command route. Actual provider/ACT-person mapping is a later identity/business prerequisite |
| Concrete envelope/persistence | Contract version naming, canonicalization/bounds, three-column PK, composite original-audit FK, schema/permissions, migration/checksum/locking, audit/replay taxonomy all frozen consistently |
| Supported technical choices | [ADR-0013](../00-governance/adrs/ADR-0013-slice-envelope-stack.md) and [technical freeze](TECHNICAL_FREEZE.md): primary version/support/compatibility evidence, exact pins, package scripts and deterministic install |
| Physical first scope | [Physical design](SLICE_ENVELOPE_PHYSICAL_DESIGN.md): exact future tree/ownership/import direction, local dev/test DB, error/config/logging, health-only host, migration/transaction boundaries, shell scope, DoD and acceptance |
| Canonical reconciliation | [Reconciliation evidence](CANONICAL_RECONCILIATION.md): API/data/state/audit/security/layout/QA/planning propagated, accepted business evidence preserved |
| Ordered future capability work | [Backlog](IMPLEMENTATION_BACKLOG.md): foundation, identity, Inventory, Sales/Shipping/Finance-Lite, Procurement, Production, Genealogy, integrations/visibility/reporting/UAT/cutover, accepted bundle homes intact |
| Useful independent review | [Domain/architecture/testing](REVIEW_INDEPENDENT_DOMAIN_TESTING.md), [database/idempotency/application-security red team](REVIEW_INDEPENDENT_DATABASE_SECURITY.md), [final readiness](REVIEW_FINAL_READINESS.md) |
| Repository evidence | [Validation](ENGINEERING_VALIDATION.md) and engineering manifest prepared for human baseline/checkpoint review; no human approval fabricated |

First scope remains SLICE-ENVELOPE. No evidence supports changing to a business
posting prerequisite. It creates future command foundation infrastructure with
synthetic test facts only; production composition exposes health and no fixture
command/auth shortcut. No Ledger/Balance/Inventory/business module, real customer
route, device, report/live/print adapter or worker is part of this first grant.

## Preserved accepted business rules

ACT-IPS alone writes stock quantity; Inventory Ledger is movement truth and
Balance rebuilds from Ledger. No negative inventory/direct Balance editing.
Production completion is the exclusive atomic posting bundle with nested
consumption/output/reusable Residual or Scrap and genealogy source facts.
Genealogy rebuilds all canonical source-fact families, not Ledger alone.
Reservations are distinct from allocation/consumption, at most one ACTIVE per
unit, no confirmed-SO expiry/steal. Sales closure follows remaining valid demand,
cancelled or authorized unfulfilled remainder; payment/invoice/DELIVERED alone
do not close it. kg is authoritative; whole-kg measured resolution is not a new
universal minimum quantity or settled arithmetic scale. Human reusability decides
Residual/Scrap, no automatic numeric cutoff. Production mass-balance policy is
not OQ-006 fulfillment tolerance. Finance-Lite excludes legal GL, weighbridge
supplies evidence/commands and never Ledger writes, portal MVP visibility only,
QC remains future. OQ answers/statuses and recorded factory facts are unchanged.

## Deferred non-blockers

| Classification | Remaining input / dependent scope |
| --- | --- |
| B — slice-specific later decision | Domain arithmetic/scale and conversion factors; order/material identity mapping; routing storage/version/lifecycle and production mass-balance/disposition recording; business ACT/SoD/authority; pricing/commercial/shipment/procurement gaps; device/external invoice-upload adapters; portal document whitelist |
| C — UAT input | Real tickets/workflows, people/attribution, volume/performance samples and configured domain cases |
| D — Go-Live input | Opening files/signers/freeze/reconciliation; hosting/operations sign-off; backup product/day retention/recovery-fence rollout proof. Recorded RPO ≤60 minutes/RTO ≤8 hours remain accepted, not reopened |
| E — technical defer | Optional PostgreSQL functions, advanced property/load/UI tooling or infrastructure not required by foundation |
| F — future/outside MVP | QC, portal ordering, legal GL, additional site/entity, distributed infrastructure and advanced equipment |

These do not block a nonbusiness foundation. Before an affected later command,
missing required policy remains GUARD_OPEN_POLICY; no new factory answer or OQ
closure is manufactured. Live OPEN_QUESTIONS remains authoritative.

## First-slice Definition of Done and proof limits

After human authorization: pinned clean install/build/typecheck/lint/format/import
checks; all physical acceptance intents executable and passing against real PG;
atomic accepted/rejected outcome tests, binding/isolation, lock races/rollback,
savepoints/audit, crash/uncertain/restore fence, migration checksum/permissions and
safe reset; no skipped tests or business scope creep; truthful developer workflow
and minimum CI evidence. See exact DoD and scripts in physical/technical freeze.

Current verification is documentation/design research, source reconciliation,
independent review and repository hygiene. No product code, package, migration,
CI workflow, database provisioning or executable product test is created/run.
Runtime correctness must be proved during authorized implementation; future test
execution is DoD, not a reason to start coding before authorization.

## Consolidated human decision

[Human authorization package](HUMAN_AUTHORIZATION_PACKAGE.md) contains the final
technical ADR/design scope, baseline/manifest/checkpoint preparation, exact future
path/shell/script references, stop conditions, residuals and human gate/unlock
procedure. Historical approved baseline is not relabeled current-human-approved.
Approve an actual current baseline/checkpoint and create matching authorization
only by explicit Owner action. Codex does not execute that procedure.

No new phase, native installer, OS ACL change or routine technical permission
request is part of this package.
