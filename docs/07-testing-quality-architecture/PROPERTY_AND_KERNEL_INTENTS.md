---
id: QA-PROP-001
title: Property and Kernel Intents
phase: 07-testing-quality-architecture
status: in_review
version: 0.3.0
owners: [qa-architect, data-architect]
depends_on: [DATA-TX-001, DATA-GEN-001, DATA-POST-001, QA-STRAT-001, APR-008]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Property and Kernel Intents

APR-009 approved the historical structure. This delegated technical reconciliation
preserves its business invariants and is not a human-approved replacement baseline.
Current foundation acceptance is detailed in SLICE_ENVELOPE_PHYSICAL_DESIGN.md
under Phase 12; no product tests or test-ID catalogue are created here.

What must remain true across many commands, without choosing a
property-test package or proving OQ-017.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Inventory kernel

| Intent | Statement | Open |
| --- | --- | --- |
| `QA-P-LEDGER` | Every stock quantity change has a Ledger evidence row | OQ-017 answered application-owned PostgreSQL transaction; functions deferred |
| `QA-P-BALANCE` | Balance rebuilds from Ledger; AdjustBalance does not exist | none |
| `QA-P-NONNEG` | On-hand, reserved, available never go negative; at most one `ACTIVE` reservation per Inventory Unit | OQ-008 answered; confirmed-SO reservation has no invented expiry |
| `QA-P-ONELOC` | One Inventory Unit has one active location | ASM-005 |
| `QA-P-BUNDLE` | Each DATA-TX-001 bundle is atomic | Named future business bundle isolation/locks before owning slice; ADR-0011 fixes foundation isolation |
| `QA-P-IPS` | Only ACT-IPS writes Ledger/Balance/unit qty | none |

Named bundles under `QA-P-BUNDLE` (same intent, six boundaries):

- CompleteProductionOperation + consume/output/residual/scrap (nested residual identity)
- DispatchShipment + stock exit
- PostGoodsReceipt + Lot/Unit/Ledger
- ActivateReservation + reserved state + reserved qty
- AllocatePayment + invoice open-balance reduction
- CreateResidualUnit + parent close/split (nested in complete-op for production leftover)

Numeric equality that needs UOM or Coil scale stays
`GUARD_OPEN_POLICY` (OQ-001, OQ-002). Do not invent a decimal oracle.

## Idempotency and concurrency

| Intent | Statement |
| --- | --- |
| `QA-P-KEY` | Same scoped key and immutable request binding → original accepted or rejected outcome; no second posted fact; mismatch GUARD_CONFLICT |
| `QA-P-NEWKEY` | New key is an independent submission, subject to natural business uniqueness; it does not permit a second copy of a business fact |
| `QA-P-FIRST-WINS` | Concurrent incompatible commands: first accepted writer wins |

## Genealogy

| Intent | Statement |
| --- | --- |
| `QA-P-GEN-IMM` | Source facts are not edited in place |
| `QA-P-GEN-REBUILD` | TraceForward/TraceBackward may rebuild from DATA-GEN-001 source facts; EditGenealogy does not exist |
| `QA-P-GEN-SPLIT` | Reusable Residual/split creates a new unit linked to parent (INV-008); disposition is the recorded human reusability decision, not an automatic numeric cutoff (OQ-009 residual recording policy) |

## Mass balance

`QA-P-MASS` is named: consumed = good + WIP + residual + scrap +
approved process loss within the applicable production policy. The factory has
not supplied a process-loss/mass-balance tolerance. OQ-006 is Sales fulfillment
tolerance and must never supply this number. A measured weight difference is
shown, not automatically classified as process loss, Residual or Scrap. A later
production command needing missing policy expects `GUARD_OPEN_POLICY`; this is
a SLICE-MAKE prerequisite, not a foundation-start blocker.

## Must not decide here

- QuickCheck, fast-check, or Hypothesis
- PostgreSQL isolation level
- Synthetic volume (OQ-014)
