---
id: INT-EXT-001
title: External System Boundaries
phase: 08-integration-deployment
status: in_review
version: 0.1.0
owners: [integration-architect, security-architect]
depends_on: [INT-CAT-001, SEC-THREAT-001, APR-009]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# External System Boundaries

Trust boundaries already named in Phase 06, restated as integration
edges. This does not choose a device, GL product, or portal stack.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Edges

| Edge | This system | External | Open |
| --- | --- | --- | --- |
| `TB-DEVICE` | Goods Receipt command | Weighbridge / printer | OQ-011 |
| `TB-GL` | Finance-Lite Invoice/Payment | Legal accounting | OQ-012 |
| `TB-CUSTOMER` | Sales-owned documents | Customer channel | OQ-010 |
| `TB-SITE` | One legal-entity / site | Another site | OQ-013 |
| `TB-BACKEND` | Command evaluation | Browser / shop-floor UI | Transport OQ-018 |

A weighbridge ticket is evidence for a human or adapter **command**. It
is not a Ledger row. A legal-accounting export is a copy of
Finance-Lite facts; ASM-010 still holds.

## Portal

`ADP-PORTAL` may not place an order in MVP (`GUARD_PORTAL_MVP`).
Visibility or request, if later allowed, is a Sales-owned read or
command path. Isolation still applies.

## Future equipment

PLC, CMMS, and APS stay catalogue entries. ASM-008 says production
events are human-frequency. This draft does not add a telemetry posting
path.

## Must not decide here

- Device make/model or certificate
- Chart of accounts mapping
- A second factory site topology
