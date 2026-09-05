---
id: SM-EVT-001
title: Event and Rejection Catalogue
phase: 03-state-machines-invariants
status: approved
version: 0.3.0
owners: [chief-solution-architect, domain-leads]
depends_on: [SM-TRANS-001, SM-INV-001, APR-004, APR-005]
last_reviewed: 2026-09-06
approval: APR-005
supersedes: null
---

# Event and Rejection Catalogue

Shared rules for every command in
[TRANSITION_TABLES.md](TRANSITION_TABLES.md). Event names are proposed labels
for later API/integration work. They are not accepted protocols and do not
select a broker or package (OQ-018 remains open).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

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
| `GUARD_INVARIANT` | A closed INV-* failed (negative stock, QC gate, one location) |
| `GUARD_ACTOR` | Actor is not the allowed role, or is a temporary identity |
| `GUARD_STATE` | Command is illegal in the current state |
| `GUARD_IDEMPOTENT_DUP` | The same command was already accepted (INV-016) |
| `GUARD_CONFLICT` | A concurrent command won, or the same unit/order/payment is already in an incompatible state |
| `GUARD_PORTAL_MVP` | Customer Portal ordering in MVP (INV-020) |

Do not invent a numeric failure by filling an open OQ. If the command cannot
be decided without that answer, reject with `GUARD_OPEN_POLICY` and the OQ ID
or `workshop-commercial-practice`.

## Idempotency

Every command in the transition tables must carry a caller-supplied idempotency
key. A retry with the same key:

- returns the original accepted result if the first call already posted;
- does not create a second Inquiry, GoodsReceipt posting, Shipment dispatch,
  Payment, or operation completion (INV-016).

A retry with a new key is a new command and is evaluated fresh.

Proposed key scope (logical, not a storage design):

| Command family | Key must be unique for |
| --- | --- |
| Inquiry / Quotation / Sales Order drafts | caller + document identity being created |
| `PostGoodsReceipt` / `ReverseGoodsReceipt` | physical receipt identity + direction |
| `ActivateReservation` / `ConsumeReservation` | reservation identity + command name |
| `CompleteProductionOperation` | operation identity + completion attempt |
| `DispatchShipment` | shipment identity + dispatch |
| `RecordPayment` / `AllocatePayment` / `ReversePayment` | payment identity + command name |

How weighbridge or device identity feeds the receipt key stays OQ-011.
How the key is stored stays Phase 04 / OQ-017.

Conflict behaviour is in
[CONCURRENCY_AND_INTERLOCK.md](CONCURRENCY_AND_INTERLOCK.md).
Sequences are in
[CROSS_MACHINE_SEQUENCES.md](CROSS_MACHINE_SEQUENCES.md).
Role pairs are in
[AUTHORIZATION_SOD.md](AUTHORIZATION_SOD.md).

## Event emission

Events are emitted only after the owning write and any commanded Inventory
posting succeed in the same business transaction. Proposed names are the Event
column in the transition tables. They are not an Outbox or broker decision.

Events that must never be independently editable source truth:

- Genealogy query results (INV-019)
- Balance projections
- Reporting KPIs

## Authorization

- Human Actor must be an `ACT-*` role, not a Temporary \* (temporary) name.
- `ACT-IPS` may execute stock writes and never owns business policy.
- `ACT-QC` and `ACT-SHIP` may command Inventory and must not write stock
  tables (INV-017).
- Backend authorization is required (INV-015). UI-only checks are not enough.

## Correction path

A rejected command is not a reversal. A reversal is a new accepted command
that posts compensating evidence (INV-005). See
[EXCEPTION_CORRECTION.md](EXCEPTION_CORRECTION.md).
