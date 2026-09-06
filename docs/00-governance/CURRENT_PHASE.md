---
id: GOV-CURRENT-001
title: Current Phase Authorization
phase: 08-integration-deployment
status: in_review
version: 0.18.0
owners: [chief-solution-architect]
depends_on: [GOV-CHARTER-001, GOV-GATES-001, APR-009, ASM-015, ASM-016, ASM-017, ASM-018, ASM-019, ASM-020]
last_reviewed: 2026-09-06
approval: APR-009
supersedes: null
---

# Current Phase Authorization

CURRENT_PHASE: `08-integration-deployment`

CURRENT_GATE_STATUS: `ACTIVE_IN_REVIEW`

IMPLEMENTATION_AUTHORIZED: `false`

This Markdown value communicates project status. Technical unlock requires both
the protected `.cursor/architecture-gate.json` authorization and a valid,
human-created `.cursor/IMPLEMENTATION_UNLOCK.json` referencing an approved
baseline and exact allowed paths. Neither condition currently exists.

## Permitted work

- Draft Phase 08 integration and deployment **structure** Markdown from
  APR-009 and
  [PHASE08_HANDOFF.md](../07-testing-quality-architecture/PHASE08_HANDOFF.md).
- Leave every OQ-owned protocol, product, hosting choice, RPO/RTO
  minute, named operator, and runner as an open extension.
- Apply team answers onto the matching `OQ-*` row when they arrive.
- Record and replace `(temporary)` workshop identities as real names arrive.
- The APR-009 Git checkpoint is pending a human-created marker. Do not
  invent or edit `.cursor/PHASE_CHECKPOINT_APPROVAL.json`.
- Maintain canonical registers without silently closing open questions or
  accepting unapproved ADRs.

## Prohibited work

- Application, database, API, UI, test, integration, or deployment implementation
- Framework/package initialization or installation
- Executable controllers, OpenAPI files, SQL, ORM models, migrations,
  test runners, CI, Dockerfiles, or deployment manifests
- Accepting ADR-0006, ADR-0007, ADR-0008, NestJS, Prisma, Socket.IO,
  JWT, Keycloak, Jest, Playwright, Docker, or any other package as if
  decided
- Inventing UOM, routing, QC, reservation, fulfillment, residual,
  organization, weighbridge protocol, accounting product, or retention
  values
- Workshop execution or owner-signed business decisions using temporary
  identities
- Inventing or editing `.cursor/PHASE_CHECKPOINT_APPROVAL.json`
- Starting Phase 09 before explicit Phase 08 approval

## Gate condition

Phase 07 is approved as APR-009 at `2026-09-06T23:44:00+03:30`, including
ASM-020. The APR-009 Git checkpoint is pending. Phase 08 structure
drafting is authorized. Team answers remain required before named
people, auth packages, typed HTTP contracts, a test-runner ADR, or
deployment products can close.

OQ-001 through OQ-019 and proposed ADR-0006 through ADR-0008 remain unresolved.
`IMPLEMENTATION_AUTHORIZED` remains `false`.
