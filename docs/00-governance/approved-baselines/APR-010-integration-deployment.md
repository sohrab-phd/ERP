---
id: APR-010
title: Integration and Deployment Architecture Approval
phase: 08-integration-deployment
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [INT-GATE-CHECKLIST-001, INT-RECON-001, ASM-021]
last_reviewed: 2026-09-07
approval: APR-010
supersedes: null
---

# APR-010 — Integration and Deployment Architecture Approval

- Gate result: `APPROVED`
- Explicit approver: Project Owner (explicit approval in Cursor session)
- Approval statement: Explicit approval of the Phase 08 Integration and
  Deployment Architecture **structure** design-gate package, including
  ASM-021
- Approval timestamp: `2026-09-07T01:28:00+03:30`
- Phase: `08-integration-deployment`
- Scope authorized: Adapter catalogue, remaining trust edges, environment
  and process labels, `ZONE-*` / `HH-*` labels, observability kinds,
  recovery labels, and runbooks — all with weighbridge protocol, legal
  accounting product, hosting/Docker, observability product, backup
  vendor, identity provider, RPO/RTO minutes, and named operators left
  as open extensions
- Authorized next phase: `09-repository-documentation` for repository
  **structure** drafting
- Implementation authorization: none; `IMPLEMENTATION_AUTHORIZED` remains
  `false`
- Git checkpoint: completed successfully; 37 files changed
- Git commit: `751035d2359abb5bd99a1b8a254715b2a5c937ae`
- Git commit subject: `docs: approve phase 08 integration deployment`
- Supersedes approval: none

## Approval boundary

APR-010 approves the Phase 08 **structure** package as the baseline for
Phase 09 repository work. It accepts ASM-021: weighbridge protocol and
device key, legal accounting product, hosting/Docker, observability
product, backup vendor, RPO/RTO minutes, and named operators remain
unanswered; no adapter code, Dockerfile, CI, or deployment manifest is
written.

It does **not** approve:

- Modbus, REST, file-drop, OPC-UA, Kafka, or an ESB product
- a named accounting vendor or legal GL mapping
- Docker, Kubernetes, cloud, firewall, or observability products
- RPO/RTO minutes or named operators
- ADR-0006, ADR-0007, or ADR-0008
- adapter processes, deployment files, or implementation

OQ-001 through OQ-019 remain unanswered or `treating`.

## Approved evidence package

- `docs/00-governance/approved-baselines/APR-010-integration-deployment.md` — `APR-010` — version `0.1.0`
- `docs/08-integration-deployment/README.md` — `PHASE-08`
- `docs/08-integration-deployment/INTEGRATION_CATALOGUE.md` — `INT-CAT-001`
- `docs/08-integration-deployment/EXTERNAL_BOUNDARIES.md` — `INT-EXT-001`
- `docs/08-integration-deployment/DEPLOYMENT_TOPOLOGY.md` — `DEP-TOPO-001`
- `docs/08-integration-deployment/OBSERVABILITY.md` — `DEP-OBS-001`
- `docs/08-integration-deployment/BACKUP_AND_RECOVERY.md` — `DEP-DR-001`
- `docs/08-integration-deployment/RUNBOOK_CATALOGUE.md` — `DEP-RUN-001`
- `docs/08-integration-deployment/SELF_CHECK.md` — `INT-SELF-CHECK-001`
- `docs/08-integration-deployment/INDEPENDENT_REVIEW.md` — `INT-INDEP-REVIEW-001`
- `docs/08-integration-deployment/RECONCILIATION.md` — `INT-RECON-001`
- `docs/08-integration-deployment/GATE_CHECKLIST.md` — `INT-GATE-CHECKLIST-001`
- `docs/08-integration-deployment/PHASE09_HANDOFF.md` — `INT-P09-HANDOFF-001`
- `docs/08-integration-deployment/CHECKPOINT_APR-010.md` — `INT-CHECKPOINT-APR-010`

Phase 09 repository drafts started after this approval are **not**
approved by this gate. If they exist at marker creation they must still
be listed in the human-created checkpoint marker because the generator
binds the complete changed-file set. CHK-0008 recording files, if still
uncommitted, must also be listed.

Exact SHA-256 digests belong in the human-created checkpoint marker.

## Closed blockers and accepted ADRs

- Questions: none closed. OQ-010 and OQ-019 remain `treating`.
- Decisions: none accepted beyond existing ADR-0001.
- Findings: FIND-034 resolved in the register sense by accepting ASM-021.
- Assumptions: ASM-021 accepted at `2026-09-07T01:28:00+03:30`.

## Residual items

- OQ-001 through OQ-019 remain open or `treating`.
- ADR-0006 through ADR-0008 remain proposed.
- Hosting, adapter-protocol, and identity-product ADRs remain later work.
- Git checkpoint completed at `751035d2359abb5bd99a1b8a254715b2a5c937ae`.

## Reopen conditions

Reopen APR-010 if an approved adapter-is-commander rule, DATA-TX-001
unsplittable bundle on adapter paths, forbidden-write reject
(`EditGenealogy`, `AdjustBalance`, `PortalPlaceOrder`, device Ledger
write), restore-rebuilds-from-Ledger rule, or open-extension treatment
is reversed, or if an unanswered OQ is later shown to have been silently
closed by this approval.
