---
id: APP-BG-001
title: Background Work and Real-Time Labels
phase: 05-application-api-architecture
status: approved
version: 0.2.0
owners: [solution-architect]
depends_on: [APP-ORCH-001, APP-ENV-001, DATA-TX-001, APR-006, APR-007]
last_reviewed: 2026-09-06
approval: APR-007
supersedes: null
---

# Background Work and Real-Time Labels

Named kinds of after-commit work. These are labels, not packages. They
do not accept an Outbox, broker, scheduler, or Socket.IO (OQ-018). They
do not choose the OQ-017 posting mechanism.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Standing rules

1. A worker is never a second stock writer. `ACT-IPS` remains the only
   executor of Ledger, Balance, and unit quantity writes (INV-017,
   INV-018).
2. Retry of a failed *transport* uses the same `idempotency_key`
   (INV-016). A new key is a new command.
3. Events are emitted only after the owning business transaction
   succeeds ([ORCHESTRATION.md](ORCHESTRATION.md)).
4. Quality and Shipping may enqueue a *command* to Inventory. They may
   not enqueue a direct table write.

## Proposed work kinds

| Kind | What it may do | What it must not do |
| --- | --- | --- |
| `CommandRetry` | Re-present the same command and key after transport failure | Create a second Goods Receipt, dispatch, payment, or operation completion |
| `EventNotice` | Tell a subscriber that an accepted event exists | Become source truth for stock or genealogy |
| `GenealogyRebuild` | Rebuild the projection when stale (INV-019) | Accept `EditGenealogy` |
| `BalanceRebuild` | Recompute Balance from Ledger | Accept `AdjustBalance` |
| `ReservationExpirySweep` | Propose `ExpireReservation` when policy exists | Invent expiry hours (OQ-008) |
| `InquiryQuotationExpirySweep` | Propose expire commands under `workshop-commercial-practice` | Invent a day count (FIND-026) |
| `OpeningStockImport` | Later cutover loader of Ledger facts | Bypass OQ-015 RACI or post Balance-only rows |

Sweeps that need an unanswered policy reject the proposed command as
`GUARD_OPEN_POLICY`. They do not invent the missing number.

## Outbox (label only)

`Outbox` here means: “the accepted command and its event are durable
before a subscriber is told.” It is not a library, table DDL, or
broker product. Whether that durability is the same database
transaction, a later ADR, or another mechanism stays OQ-017 and
OQ-018.

## Real-time (label only)

`LiveNotice` means a human screen may refresh after an `EventNotice`.
It is not Socket.IO, SSE, polling, or a frontend framework. A live
notice must not write stock and must not bypass customer isolation
(INV-015). Portal live ordering remains rejected in MVP (INV-020).

## Weighbridge and devices

Device identity feeding a `PostGoodsReceipt` key stays OQ-011. A
device adapter is a commander of Inventory, not a Ledger writer.

## Must not decide here

- NestJS queues, Bull, Temporal, or any scheduler package
- Kafka, RabbitMQ, Redis, or Socket.IO
- Separate worker process versus in-process (ADR-0008 remains proposed)
- Durable outbox table physical design
