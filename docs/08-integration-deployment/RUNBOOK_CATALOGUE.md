---
id: DEP-RUN-001
title: Operational Runbook Catalogue
phase: 08-integration-deployment
status: approved
version: 0.3.0
owners: [operations-owner]
depends_on: [DEP-OBS-001, DEP-DR-001, INT-CAT-001, APR-009, APR-010]
last_reviewed: 2026-09-07
approval: APR-010
supersedes: null
---

# Operational Runbook Catalogue

Named later operator procedures. Temporary identities cannot sign them
(OQ-019).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Runbooks (labels)

| ID | When | Must obey |
| --- | --- | --- |
| `RB-RETRY` | Transport failed | Same idempotency key; worker identity is not the commander (SV-009) |
| `RB-DEVICE-DOWN` | Weighbridge unavailable | Human `ACT-*` command; no silent Ledger |
| `RB-RESTORE` | Data loss or host loss | DR-RESTORE; rebuild projections; never `EditGenealogy` / `AdjustBalance` |
| `RB-CUTOVER` | Go-live opening stock | OQ-015; Ledger facts only via `ADP-CUTOVER` |
| `RB-ISOLATION` | Suspected customer leak | Stop `ADP-REPORT` / `ADP-GL-EXPORT` / `ADP-LIVE`; do not dump all customers |
| `RB-SOD` | Sensitive reverse/void | Second distinct identity; else `GUARD_OPEN_POLICY` |
| `RB-OPEN-POLICY` | Command needs an unanswered OQ | Reject; do not guess the number |
| `RB-BUNDLE` | Adapter or worker attempted a split bundle | Reject; no posted subset |
| `RB-CREDS` | Device or session secret rotation | `HH-SECRET`; unknown device key → `GUARD_OPEN_POLICY` (OQ-011) |

## Ownership

Runbook **roles** are `ACT-*`. Named people stay OQ-019. A later
operations owner cannot be a temporary workshop identity.

## Must not decide here

- On-call roster
- Shift calendar
- ChatOps product
