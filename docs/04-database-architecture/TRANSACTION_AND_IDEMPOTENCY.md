---
id: DATA-TX-001
title: Transaction and Idempotency Design
phase: 04-database-architecture
status: in_review
version: 0.1.0
owners: [data-architect, chief-solution-architect]
depends_on: [SM-CONC-001, SM-EVT-001, APR-005]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# Transaction and Idempotency Design

Logical transaction boundaries taken from Phase 03. This does not choose
isolation levels, row locks, or a database product (OQ-017, OQ-018).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## One business transaction

These must succeed or fail together:

| Boundary | Why |
| --- | --- |
| `CompleteProductionOperation` + consume/output/residual/scrap postings | INV-006 |
| `DispatchShipment` + Inventory stock exit | INV-017, INV-011 |
| `PostGoodsReceipt` + Lot/Unit/Ledger create | INV-001, INV-018 |
| `ActivateReservation` + Unit reserved-state + Balance reserved qty | INV-002, INV-003 |
| `AllocatePayment` + Invoice open-balance reduction | INV-012 |
| `CreateResidualUnit` + parent close/split | INV-008 |

A command that fails any guard writes none of those facts
([EVENT_AND_REJECTION.md](../03-state-machines-invariants/EVENT_AND_REJECTION.md)).

## Conflicts

Use the pairs in
[CONCURRENCY_AND_INTERLOCK.md](../03-state-machines-invariants/CONCURRENCY_AND_INTERLOCK.md).
First accepted writer wins. Second is `GUARD_CONFLICT`,
`GUARD_INVARIANT`, or `GUARD_STATE`. The mechanism that serializes them
stays OQ-017.

## Idempotency

Every command carries a caller-supplied key. Proposed uniqueness scope
is in the event catalogue. Logical store:

- key
- command name
- accepted/rejected
- resulting fact identity if accepted
- first-seen timestamp

A retry with the same key returns that row. A new key is a new command.

How the key is persisted stays Phase 04 physical / OQ-017. Weighbridge
identity feeding a receipt key stays OQ-011.

## Correction

A reversal is a new accepted command with a new key and a link to the
original posted fact (INV-005). It is not an update-in-place and not a
delete.

## Must not decide here

- `SERIALIZABLE` versus row locks versus application mutex
- PostgreSQL, Prisma, or any package
- Decimal scale
- Outbox or broker
