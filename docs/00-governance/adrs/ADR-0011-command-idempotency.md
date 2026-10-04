---
id: ADR-0011
title: Bound durable command outcomes and atomic replay
phase: 12-implementation-planning
status: accepted
version: 1.0.0
owners: [chief-solution-architect]
depends_on: [ADR-0006, ADR-0007, ADR-0012, DATA-TX-001, SM-INV-001]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# ADR-0011 — Bound durable command outcomes and atomic replay

## Status and authority

Accepted technical decision under the Project Owner's 2026-10-04 delegated
trusted-agent pre-implementation mandate (ADR-0012). This is not a human-approved
implementation baseline, APR/CHK evidence, final unlock or authorization to code.
The canonical gate remains false/null and final unlock absent.

## Context and evidence

INV-016 requires no duplicate receipt, shipment, payment or completion.
OQ-017 accepts application-owned PostgreSQL transactions/locks; ADR-0006/0007
accept Modular Monolith/PostgreSQL. Old generic documents disagreed: per-command
key scope versus principal namespace, accepted-only replay versus rejected
replay, DUP meaning transport replay, and orchestration storing outcome after
business commit/event emission. That creates changed-intent replay and crash gaps.

Reviewed the current module ownership, logical data/attributes, posting/transaction,
API/command/orchestration, state guards/interlocks, identity/RBAC/isolation/audit,
testing/property and backup/recovery contracts after obsolete hook retirement.
Live factory evidence controls quantities/disposition; no OQ is closed here.
Foundation can be implemented without a real domain posting or auth product.

## Alternatives

| Option | Assessment |
| --- | --- |
| In-memory/process cache | Rejected: restart/concurrent hosts lose first decision, no atomic durable evidence |
| Key namespace includes command/principal | Rejected: same scoped key reused with changed intent/actor may execute again |
| Unique inserted PENDING claim finalized before commit | Viable but extra incomplete-row/deferred constraint lifecycle unnecessary for foundation |
| PostgreSQL transaction-scoped advisory key lock, terminal-only row and unique key | Selected: simple single-transaction terminal persistence; fresh post-wait statement gives correct READ COMMITTED visibility |
| Redis/distributed locks/lease reaper | Rejected for foundation: another authority/coordination/crash mechanism without project need |

## Decision

Use [COMMAND_IDEMPOTENCY_SPEC](../../12-implementation-planning/COMMAND_IDEMPOTENCY_SPEC.md)
as binding generic contract; [concurrency decision](../../12-implementation-planning/SLICE_ENVELOPE_CONCURRENCY_DECISION.md)
and [physical design](../../12-implementation-planning/SLICE_ENVELOPE_PHYSICAL_DESIGN.md)
map it to concrete persistence and tests.

- Unique installation UUID + trusted organizational scope UUID + caller UUID v4.
  Principal issuer/subject, command/contract, typed target, preconditions and
  canonical material bytes+SHA bind immutable intent, not separate namespaces.
- Matching accepted AND rejected outcomes replay without handler/guard execution.
  Current authorization/result visibility applies; another principal/binding
  yields nondisclosing GUARD_CONFLICT preserving original.
- Different-key business fact duplication follows the owner catalogue.
  GUARD_IDEMPOTENT_DUP never replaces successful replay; new-key Production
  completion duplicate remains its canonical GUARD_CONFLICT.
- One pg client/READ COMMITTED transaction; bounded two-int32 advisory key lock,
  separate post-lock SELECT, stable-ordered domain locks/unique constraints,
  savepoint before handler effects, complete terminal outcome and original audit.
  No committed PENDING/lease and no runtime UPDATE/DELETE of outcomes.
- Owner facts, original decision audit and outcome commit atomically.
  Recognized rejection rolls tentative facts to savepoint then commits rejection/
  audit. Infrastructure failures abort whole transaction; unknown commit resolves
  same binding/key against primary, never new key/replica absence/auto compensation.
- Matching replay and mismatch attempts have separately durable audits, committed
  before response, without recreating original acceptance or business effects.
- Canonical JSON version/limits and old readers are frozen in the specification.
  Unknown/secret/unbindable input fails admission without consuming a key.
- No automatic outcome/binding TTL or recycled keys; retain installation lifetime.
  Later archive/privacy requires versioned ADR preserving delayed retry safety.
- Restore with possible lost acknowledged history disables command admission
  until reconciled. At-most-once is within authoritative retained history, not an
  exactly-once-delivery or zero-RPO promise across data loss.
- No irreversible external effect before commit. Reliable later external delivery
  requires an atomic outbox/inbox ADR, not ad-hoc after-commit fire-and-forget.

## Consequences and change conditions

Benefits: deterministic accepted/rejected replay, nondisclosure, atomic audit and
fact evidence, real PostgreSQL race/crash testability and minimal infrastructure.
Costs: outcome growth, retained readers, advisory locking discipline, strict input
canonicalizer/limits and permission decision-point tests. Key locks do not enforce
different-key domain uniqueness or decide commercial reservation priority.

Change requires coordinated ADR/spec/schema/tests migration; retained outcomes
cannot be reinterpreted or deleted to release keys. Handler composition and lock
ordering are enforced at each later slice. Production recovery/retention products,
real RBAC people, domain decimal scale, devices and factory workflows remain B/C/D
or deferred, not invented prerequisites to foundation.

## Verification and traceability

Observed source findings/resolutions:
[REVIEW_DATABASE_IDEMPOTENCY_SECURITY](../../12-implementation-planning/REVIEW_DATABASE_IDEMPOTENCY_SECURITY.md).
Future executable unit/integration/crash acceptance cases are in the specification
and physical design. No application tests are claimed executed before human
implementation authorization. Final independent readiness review is separate.

Questions closed: none. Generic technical ambiguity resolved; OQ-011 natural
receipt identity, OQ-016 retention operations and actual later-slice business
residuals remain live. Existing APR/CHK snapshots are historical approval evidence.
