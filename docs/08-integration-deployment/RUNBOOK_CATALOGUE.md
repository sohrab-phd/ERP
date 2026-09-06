---
id: DEP-RUN-001
title: Operational Runbook Catalogue
phase: 08-integration-deployment
status: in_review
version: 0.1.0
owners: [operations-owner]
depends_on: [DEP-OBS-001, DEP-DR-001, APR-009]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# Operational Runbook Catalogue

Named later operator procedures. Temporary identities cannot sign them
(OQ-019).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Runbooks (labels)

| ID | When | Must obey |
| --- | --- | --- |
| `RB-RETRY` | Transport failed | Same idempotency key |
| `RB-DEVICE-DOWN` | Weighbridge unavailable | Human `ACT-*` command; no silent Ledger |
| `RB-RESTORE` | Data loss or host loss | DR-RESTORE; rebuild projections |
| `RB-CUTOVER` | Go-live opening stock | OQ-015; Ledger facts only |
| `RB-ISOLATION` | Suspected customer leak | Stop the export; do not dump all customers |
| `RB-SOD` | Sensitive reverse/void | Second distinct identity; else `GUARD_OPEN_POLICY` |
| `RB-OPEN-POLICY` | Command needs an unanswered OQ | Reject; do not guess the number |

## Ownership

Runbook **roles** are `ACT-*`. Named people stay OQ-019. A later
operations owner cannot be a temporary workshop identity.

## Must not decide here

- On-call roster
- Shift calendar
- ChatOps product
