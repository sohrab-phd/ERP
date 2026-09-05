---
id: GOV-CURRENT-001
title: Current Phase Authorization
phase: 03-state-machines-invariants
status: in_review
version: 0.6.0
owners: [chief-solution-architect]
depends_on: [GOV-CHARTER-001, GOV-GATES-001, APR-004, ASM-015]
last_reviewed: 2026-09-06
approval: APR-004
supersedes: null
---

# Current Phase Authorization

CURRENT_PHASE: `03-state-machines-invariants`

CURRENT_GATE_STATUS: `ACTIVE_IN_REVIEW`

IMPLEMENTATION_AUTHORIZED: `false`

This Markdown value communicates project status. Technical unlock requires both
the protected `.cursor/architecture-gate.json` authorization and a valid,
human-created `.cursor/IMPLEMENTATION_UNLOCK.json` referencing an approved
baseline and exact allowed paths. Neither condition currently exists.

## Permitted work

- Draft Phase 03 state-machine and invariant Markdown from the approved
  Phase 02 baseline and
  [PHASE03_HANDOFF.md](../02-domain-business-architecture/PHASE03_HANDOFF.md).
- Leave every OQ-owned number, named approver, and cutoff as an open guard.
  Apply team answers onto the matching `OQ-*` row when they arrive.
- Record and replace `(temporary)` workshop identities as real names arrive.
- Prepare and complete the APR-004 Git checkpoint after a human creates the
  marker.
- Maintain canonical registers without silently closing open questions or
  accepting unapproved ADRs.

## Prohibited work

- Application, database, API, UI, test, integration, or deployment implementation
- Framework/package initialization or installation
- Executable database schemas and migrations
- Production infrastructure or CI configuration
- Inventing UOM, routing, QC, reservation, fulfillment, residual, or
  organization values
- Workshop execution or owner-signed business decisions using temporary
  identities
- Treating `(temporary)` roster names as transition approvers

## Gate condition

Phase 02 is approved as APR-004 at `2026-09-06T00:31:00+03:30`. The APR-004
Git checkpoint is pending. Phase 03 structure drafting is authorized so work
does not wait on team answers. Those answers remain required before Phase 03
can close numeric or named guards.

OQ-001 through OQ-019 and proposed ADR-0006 through ADR-0008 remain unresolved.
`IMPLEMENTATION_AUTHORIZED` remains `false`.
