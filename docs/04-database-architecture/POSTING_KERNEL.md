---
id: DATA-POST-001
title: Inventory Posting Kernel and Alternatives
phase: 04-database-architecture
status: approved
version: 0.1.0
owners: [data-architect, inventory-domain-owner]
depends_on: [SM-INV-001, SM-CONC-001, APR-005]
last_reviewed: 2026-09-16
approval: APR-006
supersedes: null
---

# Inventory Posting Kernel and Alternatives

Proposed comparison of posting styles. OQ-017 is **answered**: the
application owns the business command; each posting runs in an explicit
PostgreSQL transaction (lock → validate → write Ledger facts → commit).
PostgreSQL is the data platform (ADR-0007). Stored functions are **not**
the default kernel; they need a later ADR plus spike. No SQL, index
syntax, ORM, or package is frozen here (OQ-018 residual).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Required properties (already approved as invariants)

- One authorized posting path and immutable evidence (INV-001)
- On-hand, reserved, and available cannot go negative; active
  reservations cannot exceed free stock under concurrency; at most one
  `ACTIVE` reservation per Inventory Unit (INV-002)
- Availability = on-hand − reservations − quality hold (INV-003)
- One unit, one active location, no incompatible destinies (INV-004)
- Correction = new reversing evidence, not delete (INV-005)
- Quality/Shipping command; ACT-IPS writes stock (INV-017)
- Procurement orchestrates receipt; Inventory posts quantity (INV-018)
- Retry must not duplicate a posted fact (INV-016)

## Proposed logical facts

| Fact | Writer | Role |
| --- | --- | --- |
| Inventory Ledger row | ACT-IPS | Immutable movement evidence |
| Inventory Balance projection | ACT-IPS | Current quantity; must reconcile to Ledger |
| Inventory Unit state/quantity | ACT-IPS | Lifecycle identity |
| Reservation row | Inventory | Demand claim; not a Ledger substitute |

A Balance row is never independently editable source truth. If Ledger and
Balance disagree, Ledger wins and Balance is rebuilt.

## Production leftover posting (FIND-G-001 / FIND-G-002)

Exclusive composition lives in
[TRANSACTION_AND_IDEMPOTENCY.md](TRANSACTION_AND_IDEMPOTENCY.md).
`CompleteProductionOperation` is the only production posting boundary
(OQ-003). Residual on-hand and scrap quantity each post **once** via
`ACT-IPS` inside that transaction. `CreateResidualUnit` creates identity
and parent close/split; it is not a second residual quantity. Scrap
quantity is `PostScrapMovement` only; `ScrapUnit` is unit destiny.

How those facts are stored at runtime is the recorded OQ-017 style
(application-owned PostgreSQL transaction + locks). Restricted database
functions remain a later ADR + spike, not the default kernel.

## Alternatives for OQ-017 (comparison only)

| Option | Sketch | Strength | Risk |
| --- | --- | --- | --- |
| A. Application-orchestrated transaction | Node.js service writes Ledger and Balance in one application transaction | Fits a small team; easier to test in process | A bypassing writer can corrupt stock if the database is open |
| B. Restricted database functions | Only permission-limited functions may write Ledger/Balance | Stronger kernel if later proven | Not the default (OQ-017). Needs a later ADR + spike. Must not hide business rules in SQL |
| C. Hybrid | Application orchestrates; database enforces non-negative and unique keys | Combines reviewability with kernel checks | Compatible with recorded OQ-017; unique/`ACTIVE` checks stay logical until physical design |

Recorded OQ-017 selects option A as the default posting **style**
(application-owned PostgreSQL transaction). Options B and C are not
silently accepted. Physical SQL, indexes, and stored functions stay
later work. Repeating “Ledger + Balance” does not freeze syntax.

## What a later ADR must prove

- INV-002 holds when two `ActivateReservation` commands race, including
  the one-`ACTIVE`-per-unit slot
- INV-006 holds: operation completion and stock effects commit together
  or not at all
- INV-016 holds: same idempotency key does not create a second posted
  fact
- Quality and Shipping cannot write Ledger or Balance
- A rejected command writes no Ledger row

That proof is a separately authorized evidence spike, not this draft.

## Open extensions

- Decimal scale, rounding, conversion factors: OQ-001 residual. Coil qty
  UOM is recorded kg (OQ-002).
- Device/weighbridge identity feeding the receipt key: OQ-011 residual
- Opening-stock posting authority: OQ-015 residual
- Packages, ORM product, PostgreSQL version: OQ-018 residual. Database
  product is PostgreSQL (ADR-0007).
