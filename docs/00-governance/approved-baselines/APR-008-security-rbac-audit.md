---
id: APR-008
title: Security RBAC and Audit Approval
phase: 06-security-rbac-audit
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [SEC-GATE-CHECKLIST-001, SEC-RECON-001, ASM-019]
last_reviewed: 2026-09-06
approval: APR-008
supersedes: null
---

# APR-008 — Security, RBAC and Audit Approval

- Gate result: `APPROVED`
- Explicit approver: Project Owner (explicit approval in Cursor session)
- Approval statement: Explicit approval of the Phase 06 Security, RBAC
  and Audit **structure** design-gate package, including ASM-019
- Approval timestamp: `2026-09-06T22:59:00+03:30`
- Phase: `06-security-rbac-audit`
- Scope authorized: Trust boundaries, `ACT-*` permission matrix, customer
  isolation, session/identity labels, audit kinds, and later verification
  intents — all with named people, auth/session/MFA products, portal
  exposure, site tenancy, weighbridge identity, and retention days left
  as open extensions
- Authorized next phase: `07-testing-quality-architecture` for
  verification **structure** drafting
- Implementation authorization: none; `IMPLEMENTATION_AUTHORIZED` remains
  `false`
- Git checkpoint: completed successfully; 52 files changed
- Git commit: `167353573840ef22d23049b864636d7383c61911`
- Git commit subject: `docs: approve phase 06 security rbac audit`
- Supersedes approval: none

## Approval boundary

APR-008 approves the Phase 06 **structure** package as the baseline for
Phase 07 verification work. It accepts ASM-019: named people,
auth/session/MFA products, portal exposure, site tenancy, weighbridge
identity, and retention days remain unanswered; no identity middleware,
JWT, Keycloak, or other security package is written.

It does **not** approve:

- JWT, session store, identity provider, or MFA product
- named workshop people as security approvers
- owner-signed password days or MFA mandates
- ADR-0006, ADR-0007, or ADR-0008
- executable middleware, test code, or implementation

OQ-001 through OQ-019 remain unanswered or `treating`.

## Approved evidence package

- `docs/00-governance/approved-baselines/APR-008-security-rbac-audit.md` — `APR-008` — version `0.1.0`
- `docs/06-security-rbac-audit/README.md` — `PHASE-06`
- `docs/06-security-rbac-audit/THREAT_MODEL.md` — `SEC-THREAT-001`
- `docs/06-security-rbac-audit/ROLE_PERMISSION_MATRIX.md` — `SEC-RBAC-001`
- `docs/06-security-rbac-audit/CUSTOMER_ISOLATION.md` — `SEC-ISO-001`
- `docs/06-security-rbac-audit/SESSION_AND_IDENTITY.md` — `SEC-ID-001`
- `docs/06-security-rbac-audit/AUDIT_TAXONOMY.md` — `SEC-AUD-001`
- `docs/06-security-rbac-audit/SECURITY_VERIFICATION.md` — `SEC-VER-001`
- `docs/06-security-rbac-audit/SELF_CHECK.md` — `SEC-SELF-CHECK-001`
- `docs/06-security-rbac-audit/INDEPENDENT_REVIEW.md` — `SEC-INDEP-REVIEW-001`
- `docs/06-security-rbac-audit/RECONCILIATION.md` — `SEC-RECON-001`
- `docs/06-security-rbac-audit/GATE_CHECKLIST.md` — `SEC-GATE-CHECKLIST-001`
- `docs/06-security-rbac-audit/PHASE07_HANDOFF.md` — `SEC-P07-HANDOFF-001`
- `docs/06-security-rbac-audit/CHECKPOINT_APR-008.md` — `SEC-CHECKPOINT-APR-008`

Phase 07 verification drafts started after this approval are **not**
approved by this gate. If they exist at marker creation they must still
be listed in the human-created checkpoint marker because the generator
binds the complete changed-file set. CHK-0005 and CHK-0006 recording
files, if still uncommitted, must also be listed.

Exact SHA-256 digests belong in the human-created checkpoint marker.

## Closed blockers and accepted ADRs

- Questions: none closed. OQ-010 and OQ-019 remain `treating`.
- Decisions: none accepted beyond existing ADR-0001.
- Findings: FIND-032 resolved in the register sense by accepting ASM-019.
- Assumptions: ASM-019 accepted at `2026-09-06T22:59:00+03:30`.

## Residual items

- OQ-001 through OQ-019 remain open or `treating`.
- ADR-0006 through ADR-0008 remain proposed.
- Identity-product ADRs remain later work.
- Git checkpoint completed at `167353573840ef22d23049b864636d7383c61911`.

## Reopen conditions

Reopen APR-008 if an approved SoD pair, isolation-key rule, Quality/
Shipping command-only stock rule, or open-extension treatment is
reversed, or if an unanswered OQ is later shown to have been silently
closed by this approval.
