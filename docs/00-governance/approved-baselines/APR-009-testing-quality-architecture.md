---
id: APR-009
title: Testing and Quality Architecture Approval
phase: 07-testing-quality-architecture
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [QA-GATE-CHECKLIST-001, QA-RECON-001, ASM-020]
last_reviewed: 2026-09-06
approval: APR-009
supersedes: null
---

# APR-009 — Testing and Quality Architecture Approval

- Gate result: `APPROVED`
- Explicit approver: Project Owner (explicit approval in Cursor session)
- Approval statement: Explicit approval of the Phase 07 Testing and
  Quality Architecture **structure** design-gate package, including
  ASM-020
- Approval timestamp: `2026-09-06T23:44:00+03:30`
- Phase: `07-testing-quality-architecture`
- Scope authorized: Verification levels, INV/SEQ/SV intent maps,
  `QA-SCN-*` scenarios, kernel properties, NFR/UAT labels, and `QG-*`
  evidence kinds — all with test-runner and CI products, quantity
  oracles, fixture volumes, RPO/RTO minutes, and named testers left as
  open extensions
- Authorized next phase: `08-integration-deployment` for integration
  and deployment **structure** drafting
- Implementation authorization: none; `IMPLEMENTATION_AUTHORIZED` remains
  `false`
- Git checkpoint: completed successfully; 36 files changed
- Git commit: `29921d69e10bf6704966a08ff927d9e6ae9c0bd3`
- Git commit subject: `docs: approve phase 07 testing quality architecture`
- Supersedes approval: none

## Approval boundary

APR-009 approves the Phase 07 **structure** package as the baseline for
Phase 08 integration and deployment work. It accepts ASM-020:
test-runner and CI products, quantity oracles, fixture volumes, RPO/RTO
minutes, and named testers remain unanswered; no test code, runner
package, or CI pipeline is written.

It does **not** approve:

- Jest, Playwright, k6, Testcontainers, or GitHub Actions
- named workshop people as testers or UAT signers
- owner-signed coverage percents, UOM oracles, or RPO/RTO minutes
- ADR-0006, ADR-0007, or ADR-0008
- executable tests, CI, or implementation

OQ-001 through OQ-019 remain unanswered or `treating`.

## Approved evidence package

- `docs/00-governance/approved-baselines/APR-009-testing-quality-architecture.md` — `APR-009` — version `0.1.0`
- `docs/07-testing-quality-architecture/README.md` — `PHASE-07`
- `docs/07-testing-quality-architecture/TEST_STRATEGY.md` — `QA-STRAT-001`
- `docs/07-testing-quality-architecture/VERIFICATION_TRACE.md` — `QA-TRACE-001`
- `docs/07-testing-quality-architecture/SCENARIO_CATALOGUE.md` — `QA-SCN-001`
- `docs/07-testing-quality-architecture/PROPERTY_AND_KERNEL_INTENTS.md` — `QA-PROP-001`
- `docs/07-testing-quality-architecture/NFR_AND_UAT.md` — `QA-NFR-001`
- `docs/07-testing-quality-architecture/QUALITY_GATES.md` — `QA-GATE-001`
- `docs/07-testing-quality-architecture/SELF_CHECK.md` — `QA-SELF-CHECK-001`
- `docs/07-testing-quality-architecture/INDEPENDENT_REVIEW.md` — `QA-INDEP-REVIEW-001`
- `docs/07-testing-quality-architecture/RECONCILIATION.md` — `QA-RECON-001`
- `docs/07-testing-quality-architecture/GATE_CHECKLIST.md` — `QA-GATE-CHECKLIST-001`
- `docs/07-testing-quality-architecture/PHASE08_HANDOFF.md` — `QA-P08-HANDOFF-001`
- `docs/07-testing-quality-architecture/CHECKPOINT_APR-009.md` — `QA-CHECKPOINT-APR-009`

Phase 08 integration drafts started after this approval are **not**
approved by this gate. If they exist at marker creation they must still
be listed in the human-created checkpoint marker because the generator
binds the complete changed-file set. CHK-0007 recording files, if still
uncommitted, must also be listed.

Exact SHA-256 digests belong in the human-created checkpoint marker.

## Closed blockers and accepted ADRs

- Questions: none closed. OQ-010 and OQ-019 remain `treating`.
- Decisions: none accepted beyond existing ADR-0001.
- Findings: FIND-033 resolved in the register sense by accepting ASM-020.
- Assumptions: ASM-020 accepted at `2026-09-06T23:44:00+03:30`.

## Residual items

- OQ-001 through OQ-019 remain open or `treating`.
- ADR-0006 through ADR-0008 remain proposed.
- Test-runner and CI ADRs remain later work.
- Git checkpoint completed at `29921d69e10bf6704966a08ff927d9e6ae9c0bd3`.

## Reopen conditions

Reopen APR-009 if an approved INV/SEQ/SV intent, DATA-TX-001 bundle
rule, forbidden-write reject (`EditGenealogy`, `AdjustBalance`,
`PortalPlaceOrder`), or open-extension treatment is reversed, or if an
unanswered OQ is later shown to have been silently closed by this
approval.
