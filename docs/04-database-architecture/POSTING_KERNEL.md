---
id: DATA-POST-001
title: Inventory Posting Kernel and Alternatives
phase: 04-database-architecture
status: in_review
version: 0.1.0
owners: [data-architect, inventory-domain-owner]
depends_on: [SM-INV-001, SM-CONC-001, APR-005]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# Inventory Posting Kernel and Alternatives

Proposed pattern for stock truth. This is not an accepted ADR. OQ-017
remains open. No database product, package, or SQL is chosen (OQ-018).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Required properties (already approved as invariants)

- One authorized posting path and immutable evidence (INV-001)
- On-hand, reserved, and available cannot go negative; active
  reservations cannot exceed free stock under concurrency (INV-002)
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

How those facts are stored — application transaction, restricted
database functions, or hybrid — stays OQ-017.

## Alternatives for OQ-017 (comparison only)

| Option | Sketch | Strength | Risk |
| --- | --- | --- | --- |
| A. Application-orchestrated transaction | Node.js service writes Ledger and Balance in one application transaction | Fits a small team; easier to test in process | A bypassing writer can corrupt stock if the database is open |
| B. Restricted database functions | Only SECURITY/permission-limited functions may write Ledger/Balance | Stronger kernel if the database product is later PostgreSQL | Product not accepted (OQ-018); can hide business rules in SQL |
| C. Hybrid | Application orchestrates; database enforces non-negative and unique keys | Combines reviewability with kernel checks | Still needs a product ADR and an evidence spike |

No option is accepted. Repeating “Ledger + Balance” does not accept
option A, B, or C.

## What a later ADR must prove

- INV-002 holds when two `ActivateReservation` commands race
- INV-006 holds: operation completion and stock effects commit together
  or not at all
- INV-016 holds: same idempotency key does not create a second posted
  fact
- Quality and Shipping cannot write Ledger or Balance
- A rejected command writes no Ledger row

That proof is a separately authorized evidence spike, not this draft.

## Open extensions

- Decimal and UOM on Ledger quantities: OQ-001, OQ-002
- Device/weighbridge identity feeding the receipt key: OQ-011
- Opening-stock posting authority: OQ-015
- Database product: OQ-018
