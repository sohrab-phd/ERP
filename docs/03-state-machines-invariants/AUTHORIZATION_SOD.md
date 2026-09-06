---
id: SM-SOD-001
title: Authorization and Separation of Duties
phase: 03-state-machines-invariants
status: approved
version: 0.1.0
owners: [chief-solution-architect, domain-leads]
depends_on: [SM-INV-001, SM-EVT-001, DOM-ACTORS-001, APR-004, APR-005, ASM-016]
last_reviewed: 2026-09-06
approval: APR-005
supersedes: null
---

# Authorization and Separation of Duties

How INV-015 applies to Phase 03 commands. This is a role-pair catalogue, not
an RBAC implementation and not Phase 06. Named people remain OQ-019.
Quality releasers remain OQ-005. Portal actions remain OQ-010.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Standing rules

- The Actor on a transition is an `ACT-*` role from
  [ACTOR_RESPONSIBILITY_CATALOGUE.md](../02-domain-business-architecture/ACTOR_RESPONSIBILITY_CATALOGUE.md).
- A Temporary \* `(temporary)` identity is never the Actor
  (`GUARD_ACTOR`).
- Authorization is enforced on the backend. A UI-only check is not
  enough (INV-015).
- `ACT-IPS` may execute stock writes and never owns business policy.
- `ACT-QC` and `ACT-SHIP` may command Inventory and must not write
  stock tables (INV-017).
- `ACT-CUST` is never A or R. Portal ordering is rejected in this MVP
  (`GUARD_PORTAL_MVP`, INV-020).

## Sensitive adjustments — two distinct human roles

INV-015 requires separation of duties on sensitive adjustments. The
second role is another `ACT-*`, not a named person. Until real names
exist, the *rule* is recorded and the *person* stays OQ-019.

| Sensitive command | First role | Second distinct role required | Open |
| --- | --- | --- | --- |
| `ReverseGoodsReceipt` | ACT-IPS executes; a human commands | A different human role than the one who commanded the original post | OQ-015, OQ-019 |
| `ReturnUnit` after `SHIPPED` | ACT-IPS executes; ACT-SHIP or ACT-WH commands | A different human role than the dispatcher | OQ-019 |
| `VoidInvoice` | ACT-FIN | A second ACT-FIN session or ACT-SEC recorded as authority; not the same actor identity as `IssueInvoice` | OQ-019 |
| `ReversePayment` | ACT-FIN | Same SoD as void: not the same actor identity as `RecordPayment` | OQ-019 |
| `AbortProductionOrder` / post-post cancel | ACT-PLAN | Residual/scrap facts already recorded; stock reversals via ACT-IPS | OQ-003 |
| `ConditionallyRelease` | ACT-QC | Named exception person stays OQ-005 | OQ-005 |
| `DraftShipment` without customer/order | ACT-SHIP | Exceptional authority recorded; named person OQ-019, not OQ-005 | OQ-019 |
| `ApprovePurchaseOrder` | ACT-PROC | Named approver OQ-019 | OQ-019 |

If the second role or named person is required and unanswered, reject
with `GUARD_OPEN_POLICY` and the OQ. Do not let `ACT-IPS` stand in as
the second human.

## Commands that one role may complete alone

These still need a valid `ACT-*` and backend authorization. They do not
by themselves require a second human.

- Draft / submit of Inquiry, Quotation, Sales Order, Purchase Order,
  Production Order, Package, Shipment, Invoice (pre-post).
- `RecordFulfillment*` and `RecordUnfulfilledDemand`.
- `StartProductionOperation` and shop-floor fact recording by ACT-OP
  (policy is not signed by the operator).
- `ActivateReservation` / `ConsumeReservation` as ACT-IPS execution of
  an already authorized demand.

## Isolation

- Customer isolation applies to reads, exports, notifications, and
  documents (INV-015).
- A user acting for customer A must not receive customer B’s Inquiry,
  Quotation, Order, Shipment, or Invoice content.
- Portal visibility, if later allowed, is still a Sales-owned read
  contract (OQ-010). It is not a write path.

## What this does not decide

- Package names, JWT, session store, or identity provider (OQ-018)
- The real named people (OQ-019)
- QC exception names and limits (OQ-005)
- Phase 06 control IDs — now drafted as `SEC-001`–`SEC-007` in
  [ROLE_PERMISSION_MATRIX.md](../06-security-rbac-audit/ROLE_PERMISSION_MATRIX.md);
  not approved until the Phase 06 gate
