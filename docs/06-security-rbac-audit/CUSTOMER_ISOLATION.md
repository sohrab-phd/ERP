---
id: SEC-ISO-001
title: Customer Isolation Policy
phase: 06-security-rbac-audit
status: in_review
version: 0.4.0
owners: [security-architect]
depends_on: [SEC-RBAC-001, APP-QRY-001, APP-ENV-001, APR-007, APR-008]
last_reviewed: 2026-10-10
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

Implementation authority follows [current scope](../00-governance/CURRENT_PHASE.md)
and the canonical gate/unlock; the earlier locked snapshot is superseded by
the Owner's bounded implementation authorization. Isolation remains mandatory.

## Isolation key

Every query, export, file, `EventNotice`, and `LiveNotice` carrying commercial
or customer-allocated/reserved stock content must present the owning customer
isolation key. A missing key is `GUARD_INVARIANT`, never implicit all-customers
access. Internal roles remain constrained to their permitted customer resources.

Unallocated mill intake is not a customer document: authorized ACT-WH stock
and ACT-SEC audit reads use the recorded installation/single-site authority
scope (OQ-013). This is a narrow organizational-stock rule, not an exception
allowing a customer-wide dump or cross-customer access. Customer actors cannot
use these internal receipt/stock routes. Allocating stock later must apply the
owning demand's customer rule; current manual intake has no customer allocation.

Owner [APR-027](../00-governance/approved-baselines/APR-027-purchasing-evidence-scope.md)
separately authorizes organizational purchasing documentary evidence. Completed
purchase and optional linked sent-proforma records have no customer/order/stock
allocation fields. Current individual ACT-PROC without customer scope may access
only the exact installation/authority records. Customer-bound ACT-PROC, ACT-CUST
and other roles cannot use these internal routes. Descriptive supplier references
do not grant access to supplier master data or associated customer documents.

## Surfaces that must isolate

Owner [APR-028](../00-governance/approved-baselines/APR-028-finance-lite-continuation.md)
authorizes keyed customer-invoice documentary evidence under current personal
organizational ACT-SALES (record/read) or ACT-FIN (read only). Every fact retains
mandatory Sales order and owning customer ID, validated in the exact trusted
installation/authority. This explicit organization-wide evidence permission
does not widen existing Sales customer-scoped workflows or monetary Invoice/
Payment permissions. Customer-scoped grants, ACT-CUST, ACT-SEC without an approved
document role and unrelated roles are denied. No all-customer browse/search,
portal, export or financial state is introduced.

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
