---
id: APR-007
title: Application and API Architecture Approval
phase: 05-application-api-architecture
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [APP-GATE-CHECKLIST-001, APP-RECON-001, ASM-018]
last_reviewed: 2026-09-06
approval: APR-007
supersedes: null
---

# APR-007 — Application and API Architecture Approval

- Gate result: `APPROVED`
- Explicit approver: Project Owner (explicit approval in Cursor session)
- Approval statement: Explicit approval of the Phase 05 Application and
  API Architecture **structure** design-gate package, including ASM-018
- Approval timestamp: `2026-09-06T20:31:00+03:30`
- Phase: `05-application-api-architecture`
- Scope authorized: Named commands and queries, module command
  direction, one-transaction bundles, logical envelope and rejection
  families, and worker/live-notice labels — all with transport,
  OpenAPI, framework, ORM, broker, and UOM JSON types left as open
  extensions
- Authorized next phase: `06-security-rbac-audit` for identity, RBAC,
  isolation, and audit **structure** drafting
- Implementation authorization: none; `IMPLEMENTATION_AUTHORIZED` remains
  `false`
- Git checkpoint: pending
- Supersedes approval: none

## Approval boundary

APR-007 approves the Phase 05 **structure** package as the baseline for
Phase 06 security work. It accepts ASM-018: transport, OpenAPI,
framework, ORM, outbox/broker, real-time library, UOM JSON types, and
ADR-0006 through ADR-0008 remain unanswered; no controller, OpenAPI
file, package manifest, or worker process is written.

It does **not** approve:

- HTTP paths, status codes, or an OpenAPI file
- NestJS, Prisma, Socket.IO, Outbox-as-a-product, or any other package
- ADR-0006, ADR-0007, or ADR-0008
- owner-signed UOM, Coil quantity, site tenancy, or named people
- executable controllers, workers, or implementation

OQ-001 through OQ-019 remain unanswered or `treating`.

## Approved evidence package

- `docs/00-governance/approved-baselines/APR-007-application-api-architecture.md` — `APR-007` — version `0.1.0`
- `docs/05-application-api-architecture/README.md` — `PHASE-05`
- `docs/05-application-api-architecture/COMMAND_CATALOGUE.md` — `APP-CMD-001`
- `docs/05-application-api-architecture/QUERY_CATALOGUE.md` — `APP-QRY-001`
- `docs/05-application-api-architecture/MODULE_DEPENDENCY_MAP.md` — `APP-MOD-001`
- `docs/05-application-api-architecture/ORCHESTRATION.md` — `APP-ORCH-001`
- `docs/05-application-api-architecture/API_ENVELOPE.md` — `APP-ENV-001`
- `docs/05-application-api-architecture/BACKGROUND_AND_REALTIME.md` — `APP-BG-001`
- `docs/05-application-api-architecture/SELF_CHECK.md` — `APP-SELF-CHECK-001`
- `docs/05-application-api-architecture/INDEPENDENT_REVIEW.md` — `APP-INDEP-REVIEW-001`
- `docs/05-application-api-architecture/RECONCILIATION.md` — `APP-RECON-001`
- `docs/05-application-api-architecture/GATE_CHECKLIST.md` — `APP-GATE-CHECKLIST-001`
- `docs/05-application-api-architecture/PHASE06_HANDOFF.md` — `APP-P06-HANDOFF-001`
- `docs/05-application-api-architecture/CHECKPOINT_APR-007.md` — `APP-CHECKPOINT-APR-007`

Phase 06 security drafts started after this approval are **not**
approved by this gate. If they exist at marker creation they must still
be listed in the human-created checkpoint marker because the generator
binds the complete changed-file set. CHK-0004 recording edits and the
still-pending APR-005 checkpoint files, if still uncommitted, must also
be listed.

Exact SHA-256 digests belong in the human-created checkpoint marker.

## Closed blockers and accepted ADRs

- Questions: none closed. OQ-010 and OQ-019 remain `treating`.
- Decisions: none accepted beyond existing ADR-0001.
- Findings: FIND-030 resolved in the register sense by accepting ASM-018.
- Assumptions: ASM-018 accepted at `2026-09-06T20:31:00+03:30`.

## Residual items

- OQ-001 through OQ-019 remain open or `treating`.
- ADR-0006 through ADR-0008 remain proposed.
- Typed API contracts and platform ADRs remain later work.
- Git checkpoint is pending a human-created marker.
- APR-005 still has no dedicated Git checkpoint.

## Reopen conditions

Reopen APR-007 if an approved write-owner rule, one-transaction bundle,
forbidden write (`EditGenealogy`, `AdjustBalance`, `PortalPlaceOrder`),
or open-extension treatment is reversed, or if an unanswered OQ is
later shown to have been silently closed by this approval.
