---
id: DEP-DR-001
title: Backup Restore and Recovery Labels
phase: 08-integration-deployment
status: approved
version: 0.3.0
owners: [operations-owner]
depends_on: [QA-NFR-001, DATA-CUTOVER-001, APP-BG-001, APR-009, APR-010]
last_reviewed: 2026-09-07
approval: APR-010
supersedes: null
---

# Backup, Restore, and Recovery Labels

Named recovery procedures. Minute counts stay OQ-016. Opening-stock
RACI stays OQ-015.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Procedures (labels)

| ID | Statement | Open |
| --- | --- | --- |
| `DR-BACKUP` | Durable copy of posted facts and audit | Retention days, off-site (OQ-016) |
| `DR-RESTORE` | Restore then rebuild Balance and Genealogy from Ledger | RPO/RTO minutes (OQ-016) |
| `DR-ROLLBACK` | Compensating commands, not delete-in-place | INV-005 |
| `DR-CUTOVER` | Opening stock is a Ledger fact with named sign-off (`ADP-CUTOVER`) | OQ-015, OQ-019 |
| `DR-DEVICE` | Weighbridge down → human command | OQ-011 |
| `DR-WORKER` | Transport retry uses the same key; worker is not a second stock writer | Scheduler OQ-018 |

A restore that only reloads Balance is not acceptable (QA-P-BALANCE).
A restore that accepts `EditGenealogy` is not acceptable (INV-019).
After `DR-RESTORE`, `BalanceRebuild` and `GenealogyRebuild` run as
worker kinds, not as `AdjustBalance` or `EditGenealogy`.

## Map from Phase 07 recovery intents

| Intent | Procedure |
| --- | --- |
| `QA-R-RESTORE` | `DR-RESTORE` |
| `QA-R-DEVICE` | `DR-DEVICE` |
| `QA-R-WORKER` | `DR-WORKER` / `RB-RETRY` |
| `QA-R-CUTOVER` | `DR-CUTOVER` |

Until OQ-015 is answered, `DR-CUTOVER` / `ADP-CUTOVER` reject as
`GUARD_OPEN_POLICY`.

## What is source truth after restore

Posted commercial documents, Ledger rows, and `AUD-CMD-*`. Balance and
Genealogy Link are rebuilt.

## Must not decide here

- Backup vendor or snapshot product
- RPO/RTO numbers
- Who signs cutover (OQ-019)
