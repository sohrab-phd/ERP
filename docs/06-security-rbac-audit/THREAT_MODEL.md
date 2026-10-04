---
id: SEC-THREAT-001
title: Threat Model and Trust Boundaries
phase: 06-security-rbac-audit
status: in_review
version: 0.3.0
owners: [security-architect]
depends_on: [APP-CMD-001, APP-MOD-001, APR-007, APR-008]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Threat Model and Trust Boundaries

APR-008 retains historical structure approval. Current source/ADR-0011
reconciliation is delegated technical work, not human baseline approval.

Threats against the approved Phase 05 command and query structure.
This does not choose a firewall, identity provider, or package
(OQ-018). Named attackers or named owners stay OQ-019.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Trust boundaries

| Boundary | Inside | Outside | Open |
| --- | --- | --- | --- |
| `TB-BACKEND` | Command/query evaluation, idempotency store, Inventory Posting | Browser, shop-floor UI, any later portal | Transport (OQ-018) |
| `TB-STOCK` | Ledger, Balance, unit quantity writes by `ACT-IPS` | Quality, Shipping, Sales, Procurement modules | Mechanism (OQ-017) |
| `TB-CUSTOMER` | One customer’s Inquiry, Quotation, Order, Shipment, Invoice | Another customer’s documents | Portal (OQ-010) |
| `TB-SITE` | Recorded single legal entity / principal site organizational scope | Future additional site | OQ-013 answered; expansion requires architecture reopen |
| `TB-DEVICE` | Weighbridge or printer as a commander | Inventory tables | OQ-011 |
| `TB-GL` | Finance-Lite Invoice/Payment | Legal accounting system outside MVP | OQ-012 answered; no current Legal-GL connector |
| `TB-AUDIT` | Accepted/rejected command evidence | Editable operational documents | Retention days (OQ-016) |

A UI check is not a trust boundary (INV-015).

## Threats that Phase 06 must name now

| ID | Threat | Control direction | Must not invent |
| --- | --- | --- | --- |
| `THR-001` | Caller spoofs an `ACT-*` role | Backend authenticates identity, then authorizes role | JWT/OIDC product (OQ-018) |
| `THR-002` | Temporary workshop name is treated as an actor | `GUARD_ACTOR` | Real names (OQ-019) |
| `THR-003` | Quality or Shipping writes Ledger | Command-only; `ACT-IPS` executes | Posting package (OQ-017) |
| `THR-004` | Same key posted twice / changed principal or intent / new key used to hide duplicate fact | ADR-0011 durable bound accepted/rejected outcomes and nondisclosing conflicts; owner uniqueness for different keys | Factory natural identity/permission answers |
| `THR-005` | Customer A reads customer B | Isolation on every query, export, event, file | Portal product (OQ-010) |
| `THR-006` | `PortalPlaceOrder` in MVP | `GUARD_PORTAL_MVP` (INV-020) | Later portal decision |
| `THR-007` | One human both issues and voids Invoice/Payment, or reverses their own Goods Receipt | SoD second role required | Named second person (OQ-019) |
| `THR-008` | `EditGenealogy` or `AdjustBalance` | Commands do not exist | None |
| `THR-009` | Worker becomes a second stock writer | Background kinds command, they do not post | Scheduler package (OQ-018) |
| `THR-010` | Device posts stock without a Goods Receipt command | Device is a commander only | Weighbridge identity (OQ-011) |
| `THR-011` | Live notice leaks another customer’s event | Isolation on `EventNotice` / `LiveNotice` | Socket.IO (OQ-018) |
| `THR-012` | Sensitive command proceeds while an OQ is unanswered | `GUARD_OPEN_POLICY` | Guessed numeric policy |

## Assets

Authoritative assets are posted commercial documents, Ledger rows,
Inventory Unit identity, and the audit of accepted/rejected commands.
Balance, Genealogy Link, and KPIs are projections and are not
independently writable.

## Out of scope for this draft

- Penetration-test procedures (Phase 07)
- Network zoning and host hardening (Phase 08)
- Identity-provider product comparison
