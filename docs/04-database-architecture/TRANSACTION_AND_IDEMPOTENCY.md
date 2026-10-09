---
id: DATA-TX-001
title: Transaction and Idempotency Design
phase: 04-database-architecture
status: in_review
version: 0.4.0
owners: [data-architect, chief-solution-architect]
depends_on: [SM-CONC-001, SM-EVT-001, APR-005]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Transaction and Idempotency Design

APR-006 retains the historical structure approval; this reconciled revision is
delegated technical work under ADR-0011/0012, not human baseline approval.

Logical transaction boundaries taken from Phase 03. Database product is
PostgreSQL (ADR-0007). Posting **style** is the recorded OQ-017
application-owned PostgreSQL transaction. ADR-0011 freezes READ COMMITTED,
transaction-scoped advisory key locks and terminal outcomes for the generic
envelope. Domain resource locking/indexes are frozen in their later slices;
stored functions remain optional later ADR + spike, not a prerequisite.

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
5. No process-loss fact or balancing adjustment is authorized in bounded MVP completion (APR-025).
6. Genealogy **source** facts for those transformations (INV-009). Genealogy
   Link rows are not written as source truth (INV-019).
7. Inventory Ledger rows via `ACT-IPS`: negative full actual consumed input, positive newly produced final/WIP and reusable Residual. Classified Scrap is already included in consumed input; its immutable source fact explains the net stock loss. No second Scrap subtraction (ADR-0020).
8. Nested `CreateResidualUnit` when leftover is reusable (INV-008): child
   Inventory Unit identity, parent close/split, residual Ledger on-hand
   **once**. Valid normal child Unit is `AVAILABLE` when the transaction
   commits (INV-003); no separate release or placement post is required.
9. Nested unit-state primitives: `ConsumeUnitPartial` / `ConsumeUnitComplete`
   for the issued parent; `ScrapUnit` only when that unit’s destiny is
   `SCRAPPED`.
10. APR-025 exact mass balance: actual consumed kg = final output + NEW WIP + Residual + Scrap. Exclude unconsumed source and existing WIP. Zero unexplained imbalance; no rounding, process-loss/default adjustment or OQ-006 tolerance. Residual/Scrap requires an actual authenticated individual explicitly granted production-management disposition authority, rechecked after locks. No numeric classifier, manager-name assertion or second-human chain. Unrelated OQ-009 branches remain open.
11. QC request only as a future/deferred extension if Quality is later
    enabled. Current-MVP completion has no QC request or approval
    dependency. Future Quality does not write stock (INV-017).

Valid normal good/reusable output Units created in this same transaction
are `AVAILABLE` for permitted inventory use after commit (INV-003). This
does not classify all WIP as saleable or make Scrap available.

### What this command does not do later

- It does not post residual quantity again after commit.
- It does not post scrap quantity again after commit.
- `PlaceResidualUnit` may run **after** the child unit exists for
  location handling where applicable; its QC branch is future only. It is not required
  for current-MVP availability and must not create a second residual
  Ledger quantity.
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
| `PostScrapMovement` | Logical Scrap quantity accounting; for this completion the full input consumption stock-out includes it exactly once, with classified source evidence (ADR-0020). No additional movement. | A later independently authorized NEW Scrap/abort capability requires its own contract; absent from this increment. |
| `ScrapUnit` | Unit destiny `SCRAPPED`; not a second quantity post | Only with a paired scrap fact; never a second qty for the same leftover |
| `ConsumeUnitPartial` / `ConsumeUnitComplete` | Parent unit destiny inside this bundle | Independent production consume is rejected (`GUARD_INVARIANT` INV-006) |

OQ-003: consumption, good output, residual, and scrap are not independent
inventory postings.

## Conflicts

Use the pairs in
[CONCURRENCY_AND_INTERLOCK.md](../03-state-machines-invariants/CONCURRENCY_AND_INTERLOCK.md).
First accepted writer wins. Second is `GUARD_CONFLICT`,
`GUARD_INVARIANT`, or `GUARD_STATE`. Domain resource locks/unique constraints
are specified before their owning slice. The ADR-0011 key lock prevents duplicate
command execution; it does not resolve different-key domain races or commercial
priority by itself.

## Idempotency

ADR-0011 and [COMMAND_IDEMPOTENCY_SPEC](../12-implementation-planning/COMMAND_IDEMPOTENCY_SPEC.md)
bind generic outcomes: full installation/authority/key uniqueness; immutable
principal/command/version/typed target/precondition/material binding; accepted AND
rejected replay; mismatch GUARD_CONFLICT; different-key duplicates only under
owning guard rules. Weighbridge receipt natural identity remains OQ-011.

One checked-out PostgreSQL client at READ COMMITTED takes transaction-scoped
advisory key lock, then a separate fresh-snapshot SELECT. No committed claim or
PENDING row. Owner facts, complete terminal outcome and original audit commit
atomically. Savepoint before handler work removes tentative facts on recognized
business rejection before rejection/audit commit. Infrastructure errors abort the
whole transaction; terminal delivery follows confirmed commit. Replay audit is
separate from immutable original execution but commits before replay delivery.

Unknown COMMIT resolves by SAME bound key against the primary, never new key or
lagging replica. No automatic key expiry/reuse. Restore command admission stays
disabled if acknowledged history may be lost until recovery reconciliation;
consistent restored rows alone do not prove no acknowledged command was lost.

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

- Domain-specific resource-lock SQL and unique indexes (before that slice)
- Prisma or any package
- Decimal scale
- Outbox or broker

## Effective bounded MVP production policy — 2026-10-09

[APR-025](../00-governance/approved-baselines/APR-025-production-scope.md#owner-production-decision--2026-10-09) supersedes only earlier missing production consumption/result/mass-balance/disposition branches. CompleteProductionOperation supports full/partial actual kg; original unconsumed material retains restrictions. Exact consumed = final + new WIP + Residual + Scrap, zero unexplained imbalance, no process loss/rounding. Existing WIP is not double-counted. WIP is not saleable; final readiness follows approved per-order route. Required leftover classification is the actual authenticated, explicitly permitted manager decision, without a new role/second approval chain; none is required for no leftovers. Current atomic owner/IPS/source-fact/audit/idempotency boundary is unchanged; unrelated OQ branches remain open.
