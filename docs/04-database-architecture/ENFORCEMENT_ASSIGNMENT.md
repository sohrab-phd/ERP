---
id: DATA-ENF-001
title: Invariant Enforcement Assignment
phase: 04-database-architecture
status: approved
version: 0.1.0
owners: [data-architect, chief-solution-architect]
depends_on: [SM-INV-001, DATA-POST-001, DATA-TX-001, APR-005]
last_reviewed: 2026-09-06
approval: APR-006
supersedes: null
---

# Invariant Enforcement Assignment

Where each INV-* must be enforced. “Logical” means the rule is already
decided as structure. “Application” and “database” are later assignment
targets. They are not an accepted mechanism (OQ-017) and not an accepted
platform (OQ-018).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Assignment table

| INV | Logical (now) | Later application | Later database / kernel | Stays open |
| --- | --- | --- | --- | --- |
| INV-001 | One posting path; Ledger is evidence | Command must call ACT-IPS only | Unique writer of Ledger/Balance | OQ-017 how |
| INV-002 | Non-negative on-hand/reserved/available | Reject the command | Kernel must not accept a violating write | OQ-008 expiry; OQ-001 qty type |
| INV-003 | Availability formula; three distinct facts | Derive available; do not store a fourth truth | Optional check that reserved ≤ on-hand | none as a rule |
| INV-004 | One location; incompatible destinies | `GUARD_STATE` / `GUARD_CONFLICT` | Unique active location per unit if later proven | ASM-005 |
| INV-005 | No physical delete; reversal rows | New compensating command | No UPDATE-in-place of posted evidence | OQ-015 cutover authority |
| INV-006 | One business transaction at operation complete | Orchestrate the bundle | Atomic commit of facts + stock | OQ-003 posting point |
| INV-007 | Mass-balance equation | Reject close if out of tolerance | Optional check once the number exists | OQ-006 number |
| INV-008 | Child unit + parent close/split | Same transaction as residual fact | Identity uniqueness | OQ-009 cutoff |
| INV-009 | Source facts immutable | No edit-genealogy command | Projection rebuildable | OQ-004 grain |
| INV-010 | QC gate before available/shippable | `GUARD_INVARIANT` | Optional state check | OQ-005 plans/people |
| INV-011 | Authorized customer/order or exceptional flag | `GUARD_OPEN_POLICY` if person missing | none required | OQ-006, OQ-019 |
| INV-012 | Allocation ≤ payment and ≤ open balance | Reject over-allocation | Optional numeric check | OQ-012 legal export |
| INV-013 | Unfulfilled Demand without Sales Order | Do not require an order FK | none | OQ-007 close rule |
| INV-014 | Snapshot at post; later master-data does not rewrite | Copy snapshot onto the document | none | OQ-016 retention days |
| INV-015 | Backend auth; SoD pairs; customer isolation | Enforce roles; Phase 06 `SEC-*` | none as stock kernel | OQ-010, OQ-019 |
| INV-016 | Caller idempotency key | Return first result | Unique key store | OQ-011 device identity |
| INV-017 | QC/Shipping command only | Deny their stock writes | Deny their Ledger/Balance grants | none |
| INV-018 | GR split | Procurement cannot post qty | Deny Procurement Ledger grants | none |
| INV-019 | Genealogy is a projection | Deny write API | Allow drop/rebuild | none |
| INV-020 | Portal order commands rejected | `GUARD_PORTAL_MVP` | none | OQ-010 |

## Reading the later columns

- **Later application** is the Phase 05/06 command path. It is not
  NestJS or any package.
- **Later database / kernel** is whichever OQ-017 option is later
  accepted. Listing a kernel check does not accept option A, B, or C.
- An invariant with an open numeric guard cannot gain a stored constant.
  The later check is “reject if the number is required and missing.”

## Must not do with this table

- Treat a kernel check as proof that PostgreSQL is chosen
- Store a guessed tolerance, expiry, or UOM so a check can run
- Move Quality or Shipping onto Ledger grants
