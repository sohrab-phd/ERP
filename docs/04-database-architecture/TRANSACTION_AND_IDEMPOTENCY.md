---
id: DATA-TX-001
title: Transaction and Idempotency Design
phase: 04-database-architecture
status: approved
version: 0.1.0
owners: [data-architect, chief-solution-architect]
depends_on: [SM-CONC-001, SM-EVT-001, APR-005]
last_reviewed: 2026-09-18
approval: APR-006
supersedes: null
---

# Transaction and Idempotency Design

Logical transaction boundaries taken from Phase 03. Database product is
PostgreSQL (ADR-0007). Posting **style** is the recorded OQ-017
application-owned PostgreSQL transaction. Physical isolation/lock/index
syntax and stored functions remain residual (later ADR + spike).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

Recorded OQ-003 / OQ-009 / INV-006 / INV-008 composition was reconciled
`2026-09-16` (FIND-G-001, FIND-G-002, FIND-G-015). Residual identity is
nested inside `CompleteProductionOperation`. It is not a second Ledger
quantity post.

## One business transaction

These must succeed or fail together:

| Boundary | Why |
| --- | --- |
| `CompleteProductionOperation` + consume/output/residual/scrap postings, including nested residual identity (INV-008) | INV-006 |
| `DispatchShipment` + Inventory stock exit | INV-017, INV-011 |
| `PostGoodsReceipt` + Lot/Unit/Ledger create | INV-001, INV-018 |
| `ActivateReservation` + Unit reserved-state + Balance reserved qty | INV-002, INV-003; at most one `ACTIVE` reservation per Inventory Unit (OQ-008) |
| `AllocatePayment` + Invoice open-balance reduction | INV-012 |
| Quality- or abort-commanded scrap that is **not** leftover of a completed operation: `RecordScrapFact` + `PostScrapMovement` (+ `ScrapUnit` when the unit destiny is `SCRAPPED`) | INV-001, INV-017 |

`CreateResidualUnit` + parent close/split remains INV-008. For production
leftover it is a **nested sub-bundle** of `CompleteProductionOperation`,
not a later independently committable transaction. A sequential commit
after completion is forbidden.

A command that fails any guard writes none of those facts
([EVENT_AND_REJECTION.md](../03-state-machines-invariants/EVENT_AND_REJECTION.md)).

## Canonical production completion contract (INV-006)

This is the exclusive composition. Precedence: recorded OQ-003
architectural invariant over sequential SEQ-MAKE wording that listed
residual after completion.

| Aspect | Rule |
| --- | --- |
| Business command | `CompleteProductionOperation` (commander `ACT-OP`) |
| Stock executor | `ACT-IPS` only. Production does not write Ledger or Balance. |
| Transaction boundary | One business transaction. Nested IPS primitives below are not separately committable. |
| Idempotency | Caller `idempotency_key` on `CompleteProductionOperation`. Same key → first result (INV-016). A **new** key for the same Production Operation is rejected (`GUARD_CONFLICT` / INV-016). No duplicate consume, output, residual, scrap, or Ledger rows. |
| Correction | New compensating command with a new key and a link to the original posted fact (INV-005). No delete or in-place edit of Ledger or genealogy source facts. |

### Facts that belong in that one transaction

1. Production Operation state `IN_PROGRESS → COMPLETED`.
2. Material Consumption fact(s) — Production write.
3. Good output / WIP fact(s) — Production write.
4. Exactly one leftover classification for each leftover quantity:
   reusable residual **or** scrap, not both for the same kg.
5. Process-loss fact if the routing records approved process loss.
6. Genealogy **source** facts for those transformations (INV-009). Genealogy
   Link rows are not written as source truth (INV-019).
7. Inventory Ledger rows via `ACT-IPS` for consume, good output, residual
   on-hand (when reusable), and scrap quantity (when non-reusable).
8. Nested `CreateResidualUnit` when leftover is reusable (INV-008): child
   Inventory Unit identity, parent close/split, residual Ledger on-hand
   **once**.
9. Nested unit-state primitives: `ConsumeUnitPartial` / `ConsumeUnitComplete`
   for the issued parent; `ScrapUnit` only when that unit’s destiny is
   `SCRAPPED`.
10. Mass balance (INV-007): consumed = good output + WIP + residual + scrap
    + approved process loss, within the OQ-006 tolerance. Missing tolerance
    when the close needs a number → `GUARD_OPEN_POLICY`. Family residual
    cutoff numbers remain OQ-009 treating; missing cutoff when
    classification requires it → `GUARD_OPEN_POLICY`.
11. Optional QC request. Quality does not write stock (INV-017).

### What this command does not do later

- It does not post residual quantity again after commit.
- It does not post scrap quantity again after commit.
- `PlaceResidualUnit` may run **after** the child unit exists (QC /
  location). It must not create a second residual Ledger quantity.
- `CompleteOperationPartial` moves the Production **Order** to
  `PARTIALLY_COMPLETED` after at least one operation completed through
  this contract. It does not post stock.

### Nested versus independent names

| Name | In this transaction | Independent caller |
| --- | --- | --- |
| `RecordResidualFact` | Production leftover fact | Reject (`GUARD_INVARIANT` INV-006) for leftover already in this bundle |
| `CreateResidualUnit` | Residual identity + parent close/split + residual Ledger once | Same reject for that leftover |
| `ConvertResidualToScrap` | Classification branch when leftover fails reuse policy | Same leftover must not be posted twice |
| `RecordScrapFact` | Production leftover scrap fact | Allowed later only for a **new** scrap (Quality reject, abort compensation) with a new key |
| `PostScrapMovement` | Authoritative scrap **quantity** Ledger post (OQ-009) | Same as `RecordScrapFact` |
| `ScrapUnit` | Unit destiny `SCRAPPED`; not a second quantity post | Only with a paired scrap fact; never a second qty for the same leftover |
| `ConsumeUnitPartial` / `ConsumeUnitComplete` | Parent unit destiny inside this bundle | Independent production consume is rejected (`GUARD_INVARIANT` INV-006) |

OQ-003: consumption, good output, residual, and scrap are not independent
inventory postings.

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

## Projection rebuilds are not business commands

`BalanceRebuild` and `GenealogyRebuild` reconstruct projections after
restore or staleness. They:

- do not consume a business-command `idempotency_key` as if they were
  `CompleteProductionOperation`, `PostGoodsReceipt`, or `DispatchShipment`;
- must not create Ledger movements, residual quantity, scrap quantity,
  or new consumption/output facts;
- must not replay a completed production operation as a new posting.

`Ledger → Balance`. Canonical genealogy source facts → Genealogy Link.
A successful database restore already contains the source facts; rebuild
does not require a second operational posting.

## Must not decide here

- Physical `SERIALIZABLE` versus row-lock SQL syntax
- Prisma or any package
- Decimal scale
- Outbox or broker
