---
id: VAL-RISK-001
title: Risk Operability Security and Small-Team Feasibility
phase: 11-architecture-validation
status: in_review
version: 0.1.0
owners: [chief-solution-architect, operations-owner]
depends_on: [GOV-RISKS-001, APR-012, ASM-024]
last_reviewed: 2026-09-07
approval: null
supersedes: null
---

# Risk, Operability, Security, and Small-Team Feasibility

A Phase 11 **structure** restatement of residual risk. Minute counts,
named operators, and products stay open.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Residual risk classes

| Class | Structure treatment | Still open |
| --- | --- | --- |
| Stock truth | One writer; unsplittable bundles; Ledger is evidence | OQ-001, OQ-002, OQ-017 |
| Genealogy | Rebuild-only; forbidden edits | OQ-003, OQ-004, OQ-009 |
| Isolation / SoD | SV-012, SV-013 labels; `CONF-ISO` | OQ-019 names |
| Recovery | Restore rebuilds projections; RPO/RTO not frozen | OQ-016 |
| Cutover | `ADP-CUTOVER` `GUARD_OPEN_POLICY` | OQ-015 |
| Small team (ASM-011) | Labels over products; existing Cursor controls only | OQ-018, OQ-019 |
| Agent misuse | `AG-UNLOCK` never; `REV-AGENT` cannot approve | Extra MCP OQ-018 |

## Operability

Runbooks, `ZONE-*`, `HH-*`, and `ENV-*` remain labels. No Docker,
firewall, or secret-store product is chosen. Named operators stay
OQ-019.

## Security

`ACT-*` matrix and audit kinds remain the baseline. Session/identity
packages stay OQ-018. Temporary identities have no approval authority.

## Small-team feasibility

The design stays one Node.js + TypeScript system with module labels,
not a guessed microservices mesh (ADR-0006 open). Agent implementation
later stays path-scoped under a human unlock.

## Must not decide here

- RPO/RTO minutes
- Headcount
- A hosting or identity-provider product
