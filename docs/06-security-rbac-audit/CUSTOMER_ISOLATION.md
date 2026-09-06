---
id: SEC-ISO-001
title: Customer Isolation Policy
phase: 06-security-rbac-audit
status: approved
version: 0.2.0
owners: [security-architect]
depends_on: [SEC-RBAC-001, APP-QRY-001, APP-ENV-001, APR-007, APR-008]
last_reviewed: 2026-09-06
approval: APR-008
supersedes: null
---

# Customer Isolation Policy

How INV-015 applies to reads, exports, files, events, and reports.
This is not a multi-tenant product choice. Site/legal-entity split
stays OQ-013. Portal exposure stays OQ-010.

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
| GetLedger / GetUnit when the unit is allocated or reserved | Owning demand’s customer; unallocated mill stock is not a customer document and uses site scope when OQ-013 is answered |
| TraceForward / TraceBackward | Same customer constraint as the starting fact |
| Exports and printed documents | Same key as the source query |
| `EventNotice` / `LiveNotice` | Subscriber may receive only events for allowed customers |
| Genealogy rebuild | Rebuild does not widen visibility |

## Surfaces that must not exist in MVP

- Portal order write (INV-020)
- Unscoped “all customers” search for ACT-CUST
- Cross-customer recommendation or availability leak through a portal

If a later portal read is allowed (OQ-010), it remains a Sales-owned
query with the same isolation key. It is not a new write owner.

## Site scope

ASM-001 (one legal entity, one principal site) is unconfirmed. Until
OQ-013 is answered, site is an open extension on list queries. Do not
invent a second tenant model.

## Files and attachments

A file attached to a document inherits that document’s customer key.
A worker that copies or prints the file (`EventNotice` consumer) does
not drop the key.

## Must not decide here

- Row-level-security product or ORM filter package (OQ-018)
- Portal hostname or public URL
- Encryption-at-rest product
