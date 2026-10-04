---
id: SM-EVT-001
title: Event and Rejection Catalogue
phase: 03-state-machines-invariants
status: in_review
version: 0.5.0
owners: [chief-solution-architect, domain-leads]
depends_on: [SM-TRANS-001, SM-INV-001, APR-004, APR-005]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Event and Rejection Catalogue

APR-005 retains the historical structure approval. This revision reconciles
generic semantics under delegated ADR-0011/0012 authority, not human baseline approval.

Shared rules for every command in
[TRANSITION_TABLES.md](TRANSITION_TABLES.md). Event names are proposed labels
for later API/integration work. They are not accepted protocols and do not
select a broker or package (OQ-018 packages remain residual; Modular
Monolith and PostgreSQL are accepted).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

Current MVP has no QC execution or Quality actor (OQ-005). References
below to QC guards or `ACT-QC` apply only to a separately approved future
Quality scope.

## Rejection

If any guard fails:

1. The source state does not change.
2. The command is rejected with a stable reason code and a human-readable
   message.
3. No Ledger, Balance, or posted commercial document is written.
4. The rejection is auditable.

Common reason families (proposed):

| Family | When |
| --- | --- |
| `GUARD_OPEN_POLICY` | The guard is an unanswered OQ or recorded `workshop-commercial-practice`, and the command needs that value |
| `GUARD_INVARIANT` | A closed INV-* failed (negative stock, one location, independent production consume/leftover post); a QC gate applies only in a future Quality scope |
| `GUARD_ACTOR` | Actor is not the allowed role, or is a temporary identity |
| `GUARD_STATE` | Command is illegal in the current state |
| `GUARD_IDEMPOTENT_DUP` | A different key attempts an already recorded matching business fact, and the owning command explicitly maps that duplicate; never accepted same-key replay |
| `GUARD_CONFLICT` | Occupied scoped key has different bound intent/principal, a concurrent command won, or unit/order/payment is incompatible; command-specific duplicate guards remain authoritative |
| `GUARD_PORTAL_MVP` | Customer Portal ordering in MVP (INV-020) |

Do not invent a numeric failure by filling an open OQ. If the command cannot
be decided without that answer, reject with `GUARD_OPEN_POLICY` and the OQ ID
or `workshop-commercial-practice`.

## Idempotency

Every command carries a caller UUID v4 key. ADR-0011 fixes the generic namespace
to installation + trusted organizational authority scope + key. Principal,
command/version, typed target, preconditions and canonical material payload bind
the row; they do not create separate key namespaces. Matching accepted AND
rejected retries return their original terminal outcome without execution or
guard reevaluation. Changed binding is nondisclosing GUARD_CONFLICT. Current
authorization and result visibility are checked on every replay.

A different key is fresh intent, subject to the domain's independent uniqueness
and state guards. Production completion on the same operation under a new key
remains GUARD_CONFLICT; nested primitives share its outer transaction/key.
Independent production consume/leftover posting remains GUARD_INVARIANT INV-006.
Receipt/device natural identity remains OQ-011; it is not the generic key itself.

Accepted/rejected outcome, original audit and accepted domain facts commit in
one PostgreSQL transaction. Technical failure/unknown commit is not a terminal
business rejection. Full contract, bounds and crash semantics:
[COMMAND_IDEMPOTENCY_SPEC](../12-implementation-planning/COMMAND_IDEMPOTENCY_SPEC.md).

Conflict behaviour is in
[CONCURRENCY_AND_INTERLOCK.md](CONCURRENCY_AND_INTERLOCK.md).
Sequences are in
[CROSS_MACHINE_SEQUENCES.md](CROSS_MACHINE_SEQUENCES.md).
Role pairs are in
[AUTHORIZATION_SOD.md](AUTHORIZATION_SOD.md).

## Event emission

Owner source facts and any commanded Inventory posting, terminal outcome and
original audit succeed in the same business transaction. External event notices
are emitted only after confirmed COMMIT, never while those writes are tentative.
The transition Event column provides proposed notice labels, not a durable
delivery guarantee. Reliable delivery later needs an atomic outbox/inbox decision;
no Outbox or broker is introduced by the first slice.

Events that must never be independently editable source truth:

- Genealogy query results (INV-019)
- Balance projections
- Reporting KPIs

## Authorization

- Human Actor must be an `ACT-*` role, not a Temporary \* (temporary) name.
- `ACT-IPS` may execute stock writes and never owns business policy.
- `ACT-SHIP` may command Inventory and must not write stock tables.
  `ACT-QC` is a future-only actor and has no current-MVP user or delegate
  (INV-017).
- Backend authorization is required (INV-015). UI-only checks are not enough.

## Correction path

A rejected command is not a reversal. A reversal is a new accepted command
that posts compensating evidence (INV-005). See
[EXCEPTION_CORRECTION.md](EXCEPTION_CORRECTION.md).
