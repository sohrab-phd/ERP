---
id: SM-P04-HANDOFF-001
title: Phase 03 to Phase 04 Handoff
phase: 03-state-machines-invariants
status: approved
version: 0.2.0
owners: [chief-solution-architect]
depends_on: [SM-INV-001, SM-CATALOGUE-001, SM-TRANS-001, ASM-016, APR-005]
last_reviewed: 2026-09-06
approval: APR-005
supersedes: null
---

# Phase 03 to Phase 04 Handoff

This is a Phase 03 design artifact. Phase 03 is approved as APR-005.
Phase 04 logical drafting is authorized by
[CURRENT_PHASE.md](../00-governance/CURRENT_PHASE.md). The APR-005 Git
checkpoint is still pending. This handoff does not authorize executable
schemas or implementation.

Team answers remain required before Phase 04 can freeze UOM, decimal,
posting-mechanism, or residual-cutoff physical contracts. They are not
required to begin Phase 04 *logical* drafting after that approval, if every
OQ-owned physical choice stays an explicit open extension.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Inherit from Phase 03

- Proposed invariants:
  [INVARIANT_CATALOGUE.md](INVARIANT_CATALOGUE.md)
- Lifecycle structure:
  [STATE_MACHINE_CATALOGUE.md](STATE_MACHINE_CATALOGUE.md)
- Commands, guards, effects, events:
  [TRANSITION_TABLES.md](TRANSITION_TABLES.md)
- Command map, not table-write map:
  [SIDE_EFFECT_MATRIX.md](SIDE_EFFECT_MATRIX.md)
- Correction = reversal:
  [EXCEPTION_CORRECTION.md](EXCEPTION_CORRECTION.md)
- Rejection and idempotency:
  [EVENT_AND_REJECTION.md](EVENT_AND_REJECTION.md)
- Cross-machine sequences:
  [CROSS_MACHINE_SEQUENCES.md](CROSS_MACHINE_SEQUENCES.md)
- Concurrency conflicts:
  [CONCURRENCY_AND_INTERLOCK.md](CONCURRENCY_AND_INTERLOCK.md)
- Role pairs:
  [AUTHORIZATION_SOD.md](AUTHORIZATION_SOD.md)
- Conceptual entities already in
  [CANONICAL_DATA_DICTIONARY.md](../00-governance/registers/CANONICAL_DATA_DICTIONARY.md)

## What Phase 04 may draft after Phase 03 approval, before remaining answers arrive

Draft logical structure only. Leave every OQ-owned number, named person,
cutoff, and posting mechanism as an open extension. Do not invent values.
Do not write executable schemas or migrations.

| Draft | Allowed after Phase 03 approval | Must stay open until an answer |
| --- | --- | --- |
| Logical entities and relationships from existing ENT-* | Yes, as proposed | Official routing steps (OQ-003); batch vs piece (OQ-004) |
| One write owner per authoritative field | Yes, from DOM-OWN-001 | Multi-site numbering (OQ-013) |
| Ledger/Balance conceptual posting kernel | Yes as a proposed pattern | Mechanism ADR (OQ-017); UOM/precision (OQ-001, OQ-002) |
| Idempotency key and reversal rows as logical facts | Yes (INV-005, INV-016) | Cutover RACI (OQ-015) |
| Genealogy as a rebuildable projection | Yes (INV-019) | Tracking granularity (OQ-004) |
| Quality/Shipping as command, not stock-table writers | Yes (INV-017) | Named releasers (OQ-005) |
| Physical types, indexes, and volumes | No, not until OQ-014 and UOM answers, or as explicitly open estimates | OQ-014, OQ-001, OQ-002 |
| Executable SQL, Prisma, or migrations | No | Implementation unlock |

## Must not do after this handoff

- Close or answer OQ-001 through OQ-019 without a register update
- Treat Temporary \* (temporary) identities as data stewards who can sign
- Accept ADR-0006, ADR-0007, ADR-0008, or any package
- Write executable schemas, APIs, or application code
