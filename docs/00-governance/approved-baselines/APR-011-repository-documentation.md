---
id: APR-011
title: Repository and Documentation Architecture Approval
phase: 09-repository-documentation
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [REPO-GATE-CHECKLIST-001, REPO-RECON-001, ASM-022]
last_reviewed: 2026-09-07
approval: APR-011
supersedes: null
---

# APR-011 — Repository and Documentation Architecture Approval

- Gate result: `APPROVED`
- Explicit approver: Project Owner (explicit approval in Cursor session)
- Approval statement: Explicit approval of the Phase 09 Repository and
  Documentation Architecture **structure** design-gate package, including
  ASM-022
- Approval timestamp: `2026-09-07T21:17:00+03:30`
- Phase: `09-repository-documentation`
- Scope authorized: Future repository layout labels, import rules,
  branching/review/release labels, documentation ownership, generated-
  versus-authored policy, and `CONF-*` conformance kinds — all with
  package manager, Git hosting product, CI product, and named
  maintainers left as open extensions
- Authorized next phase: `10-ai-cursor-development` for agent
  **structure** drafting
- Implementation authorization: none; `IMPLEMENTATION_AUTHORIZED` remains
  `false`
- Git checkpoint: pending
- Git commit: pending
- Git commit subject: `docs: approve phase 09 repository documentation`
- Supersedes approval: none

## Approval boundary

APR-011 approves the Phase 09 **structure** package as the baseline for
Phase 10 AI/Cursor work. It accepts ASM-022: package manager (npm/pnpm),
Git hosting product, CI product, and named documentation maintainers
remain unanswered; no `package.json`, `tsconfig`, application folder, or
CI workflow is written.

It does **not** approve:

- npm, pnpm, yarn, Nx, or Turborepo
- GitHub, GitLab, or another hosting product
- GitHub Actions or another CI product
- named maintainers
- ADR-0006, ADR-0007, or ADR-0008
- application source folders, lockfiles, or implementation

OQ-001 through OQ-019 remain unanswered or `treating`.

## Approved evidence package

- `docs/00-governance/approved-baselines/APR-011-repository-documentation.md` — `APR-011` — version `0.1.0`
- `docs/09-repository-documentation/README.md` — `PHASE-09`
- `docs/09-repository-documentation/REPOSITORY_LAYOUT.md` — `REPO-LAY-001`
- `docs/09-repository-documentation/DEPENDENCY_AND_IMPORT_RULES.md` — `REPO-DEP-001`
- `docs/09-repository-documentation/BRANCHING_AND_RELEASE.md` — `REPO-BR-001`
- `docs/09-repository-documentation/DOCUMENTATION_OWNERSHIP.md` — `REPO-DOC-001`
- `docs/09-repository-documentation/GENERATED_VS_AUTHORED.md` — `REPO-GEN-001`
- `docs/09-repository-documentation/CONFORMANCE_CHECKS.md` — `REPO-CONF-001`
- `docs/09-repository-documentation/SELF_CHECK.md` — `REPO-SELF-CHECK-001`
- `docs/09-repository-documentation/INDEPENDENT_REVIEW.md` — `REPO-INDEP-REVIEW-001`
- `docs/09-repository-documentation/RECONCILIATION.md` — `REPO-RECON-001`
- `docs/09-repository-documentation/GATE_CHECKLIST.md` — `REPO-GATE-CHECKLIST-001`
- `docs/09-repository-documentation/PHASE10_HANDOFF.md` — `REPO-P10-HANDOFF-001`
- `docs/09-repository-documentation/CHECKPOINT_APR-011.md` — `REPO-CHECKPOINT-APR-011`

Phase 10 agent drafts started after this approval are **not** approved
by this gate. If they exist at marker creation they must still be listed
in the human-created checkpoint marker because the generator binds the
complete changed-file set. CHK-0009 recording files, if still
uncommitted, must also be listed.

Exact SHA-256 digests belong in the human-created checkpoint marker.

## Closed blockers and accepted ADRs

- Questions: none closed. OQ-010 and OQ-019 remain `treating`.
- Decisions: none accepted beyond existing ADR-0001.
- Findings: FIND-035 resolved in the register sense by accepting ASM-022.
- Assumptions: ASM-022 accepted at `2026-09-07T21:17:00+03:30`.

## Residual items

- OQ-001 through OQ-019 remain open or `treating`.
- ADR-0006 through ADR-0008 remain proposed.
- Package-manager, Git-hosting, and CI ADRs remain later work.
- Git checkpoint pending.

## Reopen conditions

Reopen APR-011 if an approved module-boundary mapping, Inventory-Posting-
only Ledger write, DATA-TX-001 unsplittable import rule, forbidden-write
`CONF-FORBID`, `BR-IMPL`-waits-on-unlock rule, or open-extension
treatment is reversed, or if an unanswered OQ is later shown to have
been silently closed by this approval.
