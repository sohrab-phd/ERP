---
id: APP-ORCH-001
title: Command Orchestration and Idempotency
phase: 05-application-api-architecture
status: approved
version: 0.2.0
owners: [solution-architect]
depends_on: [DATA-TX-001, SM-CONC-001, APP-CMD-001, APR-006, APR-007]
last_reviewed: 2026-09-06
approval: APR-007
supersedes: null
---

# Command Orchestration and Idempotency

How a Phase 05 command uses Phase 04 transaction boundaries. This does
not choose a unit-of-work library, outbox, or broker (OQ-017, OQ-018).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Orchestration rule

1. Authenticate the `ACT-*` role on the backend (INV-015).
2. Load the idempotency key. If already accepted, return the first
   result (INV-016).
3. Evaluate guards. On failure, write no posted fact; return the
   rejection family from
   [EVENT_AND_REJECTION.md](../03-state-machines-invariants/EVENT_AND_REJECTION.md).
4. Perform the owning-BC write and any commanded Inventory posting in
   **one business transaction** when
   [TRANSACTION_AND_IDEMPOTENCY.md](../04-database-architecture/TRANSACTION_AND_IDEMPOTENCY.md)
   requires it.
5. Emit the proposed event only after that transaction succeeds.
6. Store the idempotency result.

`ACT-IPS` executes stock writes. Quality and Shipping only reach step 4
as commanders.

## Bundles that must not be split

- CompleteProductionOperation + consume/output/residual/scrap postings
- DispatchShipment + stock exit
- PostGoodsReceipt + Lot/Unit/Ledger
- ActivateReservation + Unit reserved-state + Balance reserved qty
- AllocatePayment + Invoice open-balance reduction
- CreateResidualUnit + parent close/split

How the bundle is committed stays OQ-017.

## Background work

Retry of a failed *transport* uses the same idempotency key. A durable
scheduler, Outbox, or Socket.IO is **not** selected. Labels only are in
[BACKGROUND_AND_REALTIME.md](BACKGROUND_AND_REALTIME.md). If a later ADR
needs a worker, it must still obey INV-016 and must not become a second
stock writer.

## Portal

Any order-placement command is rejected with `GUARD_PORTAL_MVP` until
OQ-010 is decided otherwise (INV-020).
