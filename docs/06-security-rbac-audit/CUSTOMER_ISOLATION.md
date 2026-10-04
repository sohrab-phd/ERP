---
id: SEC-ISO-001
title: Customer Isolation Policy
phase: 06-security-rbac-audit
status: in_review
version: 0.3.0
owners: [security-architect]
depends_on: [SEC-RBAC-001, APP-QRY-001, APP-ENV-001, APR-007, APR-008]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Customer Isolation Policy

APR-008 remains historical structure approval. This live OQ/source reconciliation
is delegated technical work, not human baseline approval.

How INV-015 applies to reads, exports, files, events, and reports.
This is not a multi-tenant product choice. OQ-013 records one legal entity and
principal site; another site requires architecture reopen. OQ-010 records
visibility-only portal MVP, with the approved document whitelist still unresolved.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Isolation key

Every query, export, file, `EventNotice`, and `LiveNotice` that
carries commercial or stock content must present a customer isolation
key. A missing key is `GUARD_INVARIANT`, not an implicit “all
customers.”

Internal roles (ACT-SALES, ACT-WH, ACT-FIN, ACT-SEC) still operate
inside that key. They do not receive an unscoped dump unless a later
explicit `SEC-*` exception is approved. No such exception is written
here.

## Surfaces that must isolate

| Surface | Rule |
| --- | --- |
| GetInquiry / GetQuotation / GetSalesOrder | Customer A never sees customer B |
| GetShipment / GetPackage / GetInvoice / GetPayment | Same |
| GetAvailability when scoped to a demand | Demand’s customer only |
| GetLedger / GetUnit when the unit is allocated or reserved | Owning demand's customer; unallocated mill stock is not a customer document and uses recorded single-site organizational scope (OQ-013) |
| TraceForward / TraceBackward | Same customer constraint as the starting fact |
| Exports and printed documents | Same key as the source query |
| `EventNotice` / `LiveNotice` | Subscriber may receive only events for allowed customers |
| Genealogy rebuild | Rebuild does not widen visibility |

## Surfaces that must not exist in MVP

- Portal order write (INV-020)
- Unscoped “all customers” search for ACT-CUST
- Cross-customer recommendation or availability leak through a portal

MVP portal visibility uses Sales-owned authorized read queries with the same
customer isolation key; it is not a new write owner. Exact allowed document list
must be frozen before the portal slice. An unlisted document is denied, not an
implicit all-document grant. No portal ordering/request write is added.

## Site scope

OQ-013 answered one legal entity and one principal site. The configured trusted
organizational scope applies to mill stock and list queries; no second tenant or
site role is invented. A future site expansion reopens architecture explicitly.

## Files and attachments

A file attached to a document inherits that document’s customer key.
A worker that copies or prints the file (`EventNotice` consumer) does
not drop the key.

## Must not decide here

- Row-level-security product or ORM filter package (OQ-018)
- Portal hostname or public URL
- Encryption-at-rest product
