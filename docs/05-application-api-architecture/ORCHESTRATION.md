---
id: APP-ORCH-001
title: Command Orchestration and Idempotency
phase: 05-application-api-architecture
status: in_review
version: 0.3.0
owners: [solution-architect]
depends_on: [DATA-TX-001, SM-CONC-001, APP-CMD-001, APR-006, APR-007]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Command Orchestration and Idempotency

APR-007 remains historical structure approval. This technical reconciliation
under ADR-0011/0012 is not human baseline approval.

How a Phase 05 command uses Phase 04 transaction boundaries. This does
not choose a unit-of-work library, outbox, or broker (OQ-017, OQ-018).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Orchestration rule

1. Authenticate trusted identity/role/scope and validate bounded bindable input
   and current command/resource access (INV-015).
2. Begin one READ COMMITTED transaction/client, acquire full scoped-key advisory
   lock and read outcome in a separate statement; recheck current authorization.
3. Identical accepted OR rejected outcome replays with durable attempt audit;
   changed principal/intent returns nondisclosing GUARD_CONFLICT. No handler runs.
4. For absent key, savepoint precedes handler work. Owning BCs and commanded
   Inventory participants write their own facts in the same transaction; domain
   resource locks and constraints remain necessary for different-key races.
5. Accepted owner facts, original decision audit and terminal outcome commit
   together. Recognized business rejection rolls tentative facts to savepoint,
   then commits rejection/outcome/audit. Technical errors abort the whole bundle.
6. Return terminal outcome only after confirmed COMMIT. Unknown commit resolves
   with the SAME bound key against the primary. Event notices may be emitted only
   afterwards, never before outcome storage/commit. No outbox/broker is selected.

Binding, bounds, guards, audit/crash and replay retention:
[COMMAND_IDEMPOTENCY_SPEC](../12-implementation-planning/COMMAND_IDEMPOTENCY_SPEC.md).

`ACT-IPS` executes stock writes. Quality and Shipping only reach step 4
as commanders.

## Bundles that must not be split

- CompleteProductionOperation + consume/output/residual/scrap postings
  (nested `CreateResidualUnit` / parent close/split when leftover is
  reusable; nested `PostScrapMovement` when leftover is scrap). See
  the canonical contract in
  [TRANSACTION_AND_IDEMPOTENCY.md](../04-database-architecture/TRANSACTION_AND_IDEMPOTENCY.md).
- DispatchShipment + stock exit
- PostGoodsReceipt + Lot/Unit/Ledger
- ActivateReservation + Unit reserved-state + Balance reserved qty
- AllocatePayment + Invoice open-balance reduction
- Quality- or abort-commanded scrap that is **not** leftover of a
  completed operation: `RecordScrapFact` + `PostScrapMovement`

`CreateResidualUnit` is not a later independently committable bundle
after `CompleteProductionOperation`. Splitting residual identity onto
a second commit is a split of INV-006.

OQ-017 selects application-owned PostgreSQL transactions. ADR-0011 freezes the
generic outer transaction; domain-specific locks/constraints belong to later slices.

Independent `ConsumeUnitPartial` / `ConsumeUnitComplete` for production
is rejected (`GUARD_INVARIANT` INV-006). Those names are nested IPS
unit-state primitives inside `CompleteProductionOperation` only.

## Background work

Retry of a failed *transport* uses the same idempotency key. A durable
scheduler, Outbox, or Socket.IO is **not** selected. Labels only are in
[BACKGROUND_AND_REALTIME.md](BACKGROUND_AND_REALTIME.md). If a later ADR
needs a worker, it must still obey INV-016 and must not become a second
stock writer.

`GenealogyRebuild` and `BalanceRebuild` are reconstruction workers, not
retries of `CompleteProductionOperation` or other posting commands. They
must not create duplicate Ledger movements.

## Portal

Any order-placement command is rejected with `GUARD_PORTAL_MVP`
(INV-020). OQ-010 is recorded: Customer Portal MVP is visibility-only.
