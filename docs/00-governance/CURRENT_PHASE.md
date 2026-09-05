---
id: GOV-CURRENT-001
title: Current Phase Authorization
phase: 04-database-architecture
status: in_review
version: 0.9.0
owners: [chief-solution-architect]
depends_on: [GOV-CHARTER-001, GOV-GATES-001, APR-005, ASM-015, ASM-016]
last_reviewed: 2026-09-06
approval: APR-005
supersedes: null
---

# Current Phase Authorization

CURRENT_PHASE: `04-database-architecture`

CURRENT_GATE_STATUS: `ACTIVE_IN_REVIEW`

IMPLEMENTATION_AUTHORIZED: `false`

This Markdown value communicates project status. Technical unlock requires both
the protected `.cursor/architecture-gate.json` authorization and a valid,
human-created `.cursor/IMPLEMENTATION_UNLOCK.json` referencing an approved
baseline and exact allowed paths. Neither condition currently exists.

## Permitted work

- Draft Phase 04 **logical** Markdown from the approved Phase 03 baseline
  and
  [PHASE04_HANDOFF.md](../03-state-machines-invariants/PHASE04_HANDOFF.md).
- Leave every OQ-owned number, named person, cutoff, UOM, decimal,
  volume, and posting mechanism as an open extension.
- Apply team answers onto the matching `OQ-*` row when they arrive.
- Record and replace `(temporary)` workshop identities as real names arrive.
- Complete the APR-005 Git checkpoint only after a human-created marker
  exists.
- Maintain canonical registers without silently closing open questions or
  accepting unapproved ADRs.

## Prohibited work

- Application, database, API, UI, test, integration, or deployment implementation
- Framework/package initialization or installation
- Executable database schemas, SQL files, ORM models, or migrations
- Physical types, indexes, and volumes stated as decided
- Inventing UOM, routing, QC, reservation, fulfillment, residual, or
  organization values
- Accepting ADR-0006, ADR-0007, ADR-0008, or any package
- Workshop execution or owner-signed business decisions using temporary
  identities
- Treating `(temporary)` roster names as data stewards who can sign
- Inventing or editing `.cursor/PHASE_CHECKPOINT_APPROVAL.json`

## Gate condition

Phase 03 is approved as APR-005 at `2026-09-06T01:18:00+03:30`, including
ASM-016. The APR-005 Git checkpoint is **pending**. Phase 04 logical
drafting is authorized. Team answers remain required before physical
contracts or numeric guards can close.

OQ-001 through OQ-019 and proposed ADR-0006 through ADR-0008 remain unresolved.
`IMPLEMENTATION_AUTHORIZED` remains `false`.
