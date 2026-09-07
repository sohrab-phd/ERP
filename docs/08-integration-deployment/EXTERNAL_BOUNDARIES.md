---
id: INT-EXT-001
title: External System Boundaries
phase: 08-integration-deployment
status: approved
version: 0.3.0
owners: [integration-architect, security-architect]
depends_on: [INT-CAT-001, SEC-THREAT-001, SEC-ID-001, APR-009, APR-010]
last_reviewed: 2026-09-07
approval: APR-010
supersedes: null
---

# External System Boundaries

Trust boundaries already named in Phase 06, restated as integration
edges. This does not choose a device, GL product, identity provider, or
portal stack.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Edges

| Edge | This system | External | Open |
| --- | --- | --- | --- |
| `TB-BACKEND` | Command evaluation, idempotency store, Inventory Posting | Browser / shop-floor UI / later portal | Transport OQ-018 |
| `TB-STOCK` | Ledger, Balance, unit quantity writes by `ACT-IPS` | Quality, Shipping, Sales, Procurement, every `ADP-*` | Mechanism OQ-017 |
| `TB-CUSTOMER` | Sales-owned documents | Customer channel | OQ-010 |
| `TB-SITE` | One legal-entity / site | Another site | OQ-013 |
| `TB-DEVICE` | Goods Receipt / print command | Weighbridge / printer | OQ-011 |
| `TB-GL` | Finance-Lite Invoice/Payment | Legal accounting | OQ-012 |
| `TB-AUDIT` | Accepted/rejected command evidence | Editable operational documents | Retention OQ-016 |
| `TB-IDENTITY` | `actor_identity` bind then `ACT-*` authorize | Later directory / identity provider | OQ-018, OQ-019 |

A weighbridge ticket is evidence for a human or adapter **command**. It
is not a Ledger row (THR-010). A legal-accounting export is a copy of
Finance-Lite facts; ASM-010 still holds. A UI check is not a trust
boundary (INV-015).

`TB-IDENTITY` does not accept Keycloak, JWT, or MFA as decided. Until
those products are chosen, session bind remains the Phase 06 labels.

## Portal

`ADP-PORTAL` may not place an order in MVP (`GUARD_PORTAL_MVP`).
Visibility or request, if later allowed, is a Sales-owned read or
command path. Isolation still applies (THR-005, THR-006, THR-011).

## Live notice

`ADP-LIVE` sits on `TB-BACKEND` outbound. It must not become stock
truth and must not carry another customer’s payload (THR-011).

## Future equipment

PLC, CMMS, and APS stay catalogue entries. ASM-008 says production
events are human-frequency. This draft does not add a telemetry posting
path.

## Must not decide here

- Device make/model or certificate
- Chart of accounts mapping
- A second factory site topology
- Identity-provider or session product
