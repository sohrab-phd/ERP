---
id: VAL-CORR-001
title: Corrective Action and Reapproval Record
phase: 11-architecture-validation
status: approved
version: 0.3.0
owners: [chief-solution-architect]
depends_on: [VAL-INT-001, VAL-XDOM-001, VAL-WALK-001, ASM-024, APR-013]
last_reviewed: 2026-09-07
approval: APR-013
supersedes: null
---

# Corrective-Action and Reapproval Record

What this structure pass requires to be changed now, versus what stays
an open extension.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## In-scope corrective actions

No approved baseline (APR-004 through APR-012) is marked `suspect`.
No reapproval of those manifests is required to present this Phase 11
structure package.

### CA-WALK-ALIGN — Phase 11 draft only

An earlier Phase 11 walk table invented `WALK-DELIVER` as a fifth
happy path and described SEQ-STOCK as reservation / issue / receipt.
That disagreed with SM-SEQ-001 and QA-SCN-001.

Correction in this package: golden paths are STOCK / PURCHASE / MAKE /
NOT-FEASIBLE; dispatch is SEQ-STOCK step 7 and `WALK-BUNDLE-DISPATCH`;
issue belongs to SEQ-MAKE; receipt belongs to SEQ-PURCHASE. Exception
walks now cite the matching `QA-SCN-*` IDs.

This did not reopen Phase 03 or Phase 07.

## Deferred actions (not this gate)

| ID | Action | Wait on |
| --- | --- | --- |
| `CA-OQ` | Record team answers on matching `OQ-*` rows | Project Owner / workshop |
| `CA-TEST` | Later verification items after a runner ADR | OQ-018; FIND-028 |
| `CA-UAT` | Named UAT roster | OQ-019 |
| `CA-UNLOCK` | Human implementation unlock with exact paths | Phase 12 + final authorization |
| `CA-REOPEN` | Reopen an `APR-*` if a later answer contradicts it | Material answer |
| `CA-SOD-SALES` | If Sales cancel/hold must become a SoD pair | New approval; not silent |

## Reapproval rule

A later answer that reverses an approved write-owner, bundle,
forbidden-write, isolation, or agent-authority rule reopens the owning
approval. It does not silently patch code or Markdown.

ASM-024 is accepted by APR-013. A later reversal of that open-extension
treatment reopens APR-013.

## Must not decide here

- Reopening FIND-037; ASM-024 is accepted by APR-013
- Inventing a correction that guesses UOM, names, or products
