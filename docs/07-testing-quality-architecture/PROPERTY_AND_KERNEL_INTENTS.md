---
id: QA-PROP-001
title: Property and Kernel Intents
phase: 07-testing-quality-architecture
status: approved
version: 0.2.0
owners: [qa-architect, data-architect]
depends_on: [DATA-TX-001, DATA-GEN-001, DATA-POST-001, QA-STRAT-001, APR-008]
last_reviewed: 2026-09-06
approval: APR-009
supersedes: null
---

# Property and Kernel Intents

What must remain true across many commands, without choosing a
property-test package or proving OQ-017.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Inventory kernel

| Intent | Statement | Open |
| --- | --- | --- |
| `QA-P-LEDGER` | Every stock quantity change has a Ledger evidence row | Mechanism OQ-017 |
| `QA-P-BALANCE` | Balance rebuilds from Ledger; AdjustBalance does not exist | none |
| `QA-P-NONNEG` | On-hand, reserved, available never go negative | Expiry OQ-008 |
| `QA-P-ONELOC` | One Inventory Unit has one active location | ASM-005 |
| `QA-P-BUNDLE` | Each DATA-TX-001 bundle is atomic | Isolation level OQ-017 |
| `QA-P-IPS` | Only ACT-IPS writes Ledger/Balance/unit qty | none |

Named bundles under `QA-P-BUNDLE` (same intent, six boundaries):

- CompleteProductionOperation + consume/output/residual/scrap
- DispatchShipment + stock exit
- PostGoodsReceipt + Lot/Unit/Ledger
- ActivateReservation + reserved state + reserved qty
- AllocatePayment + invoice open-balance reduction
- CreateResidualUnit + parent close/split

Numeric equality that needs UOM or Coil scale stays
`GUARD_OPEN_POLICY` (OQ-001, OQ-002). Do not invent a decimal oracle.

## Idempotency and concurrency

| Intent | Statement |
| --- | --- |
| `QA-P-KEY` | Same idempotency key → first result; no second posted fact |
| `QA-P-NEWKEY` | New key is a new command |
| `QA-P-FIRST-WINS` | Concurrent incompatible commands: first accepted writer wins |

## Genealogy

| Intent | Statement |
| --- | --- |
| `QA-P-GEN-IMM` | Source facts are not edited in place |
| `QA-P-GEN-REBUILD` | TraceForward/TraceBackward may rebuild; EditGenealogy does not exist |
| `QA-P-GEN-SPLIT` | Residual/split creates a new unit linked to parent (INV-008); cutoff OQ-009 |

## Mass balance

`QA-P-MASS` is named: consumed = good + WIP + residual + scrap +
approved process loss **within tolerance**. The tolerance number stays
OQ-006. Until answered, a scenario that needs the number expects
`GUARD_OPEN_POLICY`.

## Must not decide here

- QuickCheck, fast-check, or Hypothesis
- PostgreSQL isolation level
- Synthetic volume (OQ-014)
