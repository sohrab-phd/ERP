---
id: SM-CONC-001
title: Concurrency and Interlock Catalogue
phase: 03-state-machines-invariants
status: approved
version: 0.1.0
owners: [chief-solution-architect, domain-leads]
depends_on: [SM-INV-001, SM-TRANS-001, SM-EVT-001, APR-004, APR-005, ASM-016]
last_reviewed: 2026-09-17
approval: APR-005
supersedes: null
---

# Concurrency and Interlock Catalogue

Which commands cannot both succeed against the same unit, reservation, order,
or payment. This is a conflict catalogue, not a lock-algorithm design.
Posting mechanism remains OQ-017. Confirmed-SO reservation uniqueness and
no-steal are recorded (OQ-008). No isolation level or package is chosen.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Rule

If two accepted writes would violate INV-002, INV-003, INV-004, INV-006,
INV-012, or INV-016:

1. At most one write is accepted.
2. The other is rejected. The source state of the rejected command does
   not change.
3. The rejection is auditable.
4. A retry with the **same** idempotency key returns the first result
   (INV-016). A retry with a **new** key is evaluated fresh and may lose.

How the first writer is chosen technically stays OQ-017. Do not treat
repetition of “Ledger + Balance” as an accepted ADR.

Proposed extra rejection family: `GUARD_CONFLICT` — a concurrent command
won, or the unit is already in an incompatible state.

## Unit interlocks (INV-004)

One Inventory Unit has one active physical location and cannot be in two
incompatible destinies at once.

| First accepted | Second against the same unit | Reject the second as |
| --- | --- | --- |
| `ActivateReservation` | `ActivateReservation` on the same unit while another reservation is `ACTIVE`, or that would exceed free stock | `GUARD_INVARIANT` INV-002 or `GUARD_CONFLICT`; later SO must not steal (OQ-008) |
| `ActivateReservation` | `QuarantineUnit` / `HoldInboundForQc` | `GUARD_CONFLICT` or `GUARD_STATE` |
| `QuarantineUnit` | `ReserveUnit` / `PackUnit` / `ShipUnit` | `GUARD_INVARIANT` INV-010 |
| `ReserveUnit` | `IssueUnitFromAllocation` | `GUARD_CONFLICT` — Reservation and Allocation are distinct; one destiny |
| `IssueUnit` or `IssueUnitFromAllocation` | `PackUnit` / `ShipUnit` | `GUARD_STATE` |
| `PackUnit` | `IssueUnit` | `GUARD_STATE` |
| `DispatchShipment` (unit `SHIPPED`) | `PackUnit` / `UnpackPackage` | `GUARD_STATE` |
| `ConsumeUnitComplete` nested in completion | any further consume/issue of that consumed qty | `GUARD_STATE` |
| Independent `ConsumeUnitComplete` | — | `GUARD_INVARIANT` INV-006 |
| `ScrapUnit` | any further stock destiny | `GUARD_STATE` |
| `PostScrapMovement` for a scrap fact already posted | second scrap qty | `GUARD_IDEMPOTENT_DUP` / `GUARD_INVARIANT` |

`IssueUnitFromAllocation` is allowed from `AVAILABLE` only. It must not
run on a unit that is already `RESERVED` for a different demand.

## Reservation versus allocation (INV-003)

Reservation, Allocation, and Consumption are three facts.

- STOCK path: Reservation may exist; Allocation must not be required.
- MAKE path: Allocation may issue an AVAILABLE unit; Reservation is not
  required.
- The same unit must not be `ACTIVE` reserved for order A and `ISSUED`
  allocated to order B.
- Consumption posts only through ACT-IPS, **inside** operation
  completion (INV-006 / OQ-003). Independent `ConsumeUnitPartial` /
  `ConsumeUnitComplete` is `GUARD_INVARIANT`.

### One-active-reservation concurrency (OQ-008 / FIND-G-005)

Logical enforcement (not SQL):

1. The Inventory Unit is the protected resource for `ActivateReservation`
   (same business transaction as reserved-state + reserved qty, DATA-TX-001).
2. The invariant checked: no other `ENT-RESERVATION` for that unit is
   `ACTIVE` (INV-002); claimed qty ≤ available (INV-002, INV-003).
3. An existing `ACTIVE` reservation is never stolen or silently split.
   The later Sales Order is rejected; it does not displace the holder.
4. OQ-008 conflict resolution (authoritative): if two confirmed Sales
   Orders compete for the same Inventory Unit, the reservation belongs
   to the earlier `ConfirmSalesOrder` timestamp. That rule assigns who
   may hold `ACTIVE`. It is **not** a second uniqueness slot on
   `REQUESTED`. `ConfirmSalesOrder` commands reservation only as already
   assessed; `RequestReservation` is a distinct command (guard: confirmed
   demand) and is not an automatic confirm side-effect. If the later
   order cannot be fulfilled from another available unit, record
   Unfulfilled Demand / Must-Buy-or-Make (existing feasibility path).
5. Two simultaneous `ActivateReservation` commands: at most one is
   accepted. The loser is `GUARD_CONFLICT` or `GUARD_INVARIANT`. The
   loser's source state does not change.
6. Same idempotency key returns the first result (INV-016). A new key is
   a fresh evaluation and may lose.
7. `ReleaseReservation`, `ConsumeReservation`, or allowed
   `ExpireReservation` (orphan sweep only) frees the `ACTIVE` slot. The
   unit returns to `AVAILABLE` when it has no other destiny, and may be
   reserved again. Confirmed-SO reservations do not expire by timer.

Partial qty on one `ACTIVE` reservation is allowed. A second `ACTIVE`
row on the same unit is not.

## Operation completion (INV-006, INV-007)

`CompleteProductionOperation` and the stock effects it commands
(consume, output, residual **or** scrap leftover, process loss) are one
business transaction. Nested `CreateResidualUnit` is identity + parent
close/split inside that transaction, not a later commit. Nested
`PostScrapMovement` is the only scrap **quantity** post for that leftover.

| Split that is forbidden | Why |
| --- | --- |
| Accept consumption without output/WIP/residual/scrap/loss facts | INV-006 |
| Accept the Production Operation `COMPLETED` while Inventory posting failed | INV-006, INV-001 |
| Accept a second `CompleteProductionOperation` with a new key for the same operation | INV-016 |
| Independent `ConsumeUnitPartial` / `ConsumeUnitComplete` | INV-006 / OQ-003 |
| Residual qty posted at completion **and** again via later `CreateResidualUnit` | INV-001, FIND-G-001 |
| Scrap qty posted at completion **and** again via later `PostScrapMovement` / `ScrapUnit` | INV-001, FIND-G-002 |
| Close the Production Order while mass balance needs a number you do not have | `GUARD_OPEN_POLICY` / OQ-006 |

Official posting-step **names** stay OQ-003. Do not invent the shop-floor
moment. Residual cutoff **numbers** stay OQ-009.

## Goods receipt and opening stock

- Two `PostGoodsReceipt` commands with the **same** key: one posted
  fact (INV-016).
- Two `PostGoodsReceipt` commands with **different** keys for the same
  physical receipt: the second must fail `GUARD_IDEMPOTENT_DUP` or
  `GUARD_CONFLICT` once identity of the receipt is established. How
  weighbridge identity is established stays OQ-011.
- Opening-stock posting authority stays OQ-015.

Procurement never posts quantity (INV-018).

## Shipment and finance

- `DispatchShipment` and a later `UnpackPackage` on a dispatched
  package: reject unpack (`GUARD_STATE`).
- `AllocatePayment` that would exceed payment value or invoice open
  balance: `GUARD_INVARIANT` INV-012.
- `VoidInvoice` and `AllocatePayment` against the same issued invoice:
  at most one succeeds; the other is `GUARD_STATE` or `GUARD_CONFLICT`.
- Sales Order close and Invoice close are independent machines (OQ-007).
  Neither writes the other machine’s rows. Payment does not close the
  Sales Order. `CloseInvoice` must not close the Sales Order.

## Quality

- A unit required to stay in QC cannot become `AVAILABLE` or shippable
  (INV-010).
- Quality commands hold/release; ACT-IPS writes the unit (INV-017).
- Named releasers and limits stay OQ-005. Conditional release without
  that answer is `GUARD_OPEN_POLICY`.

## What this does not decide

- Database isolation level, row locks, or application mutexes (OQ-017)
- Decimal precision and rounding races (OQ-001, OQ-002)
- Reservation TTL, except a later temporary planning-hold type (OQ-008 residual)
- A broker, outbox, or job scheduler (OQ-018)
