---
id: APR-006
title: Database Architecture Approval
phase: 04-database-architecture
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [DATA-GATE-CHECKLIST-001, DATA-RECON-001, ASM-017]
last_reviewed: 2026-09-06
approval: APR-006
supersedes: null
---

# APR-006 — Database Architecture Approval

- Gate result: `APPROVED`
- Explicit approver: Project Owner (explicit approval in Cursor session)
- Approval statement: Explicit approval of the Phase 04 Database
  Architecture **logical** design-gate package, including ASM-017
- Approval timestamp: `2026-09-06T19:42:00+03:30`
- Phase: `04-database-architecture`
- Scope authorized: Logical entities, relationships, named attributes
  without types, Ledger/Balance posting pattern with OQ-017 unselected,
  transaction/idempotency boundaries, genealogy as projection, opening-stock
  as a Ledger fact, and INV-* enforcement assignments
- Authorized next phase: `05-application-api-architecture` for **structure**
  drafting
- Implementation authorization: none; `IMPLEMENTATION_AUTHORIZED` remains
  `false`
- Git checkpoint: completed successfully; 29 files changed
- Git commit: `87f9f10442d58fbd224dce09f46c862eb8707e8f`
- Git commit subject: `docs: approve phase 04 database architecture`
- Supersedes approval: none

## Approval boundary

APR-006 approves the Phase 04 **logical** package as the baseline for
Phase 05 application/API structure work. It accepts ASM-017: UOM, Coil
quantity, volumes, opening-stock RACI, retention numbers, and posting
mechanism remain unanswered; no executable schema is written.

It does **not** approve:

- physical types, indexes, volumes, or migrations
- owner-signed UOM, Coil quantity, or cutover RACI
- ADR-0006, ADR-0007, ADR-0008, or any framework/package/database product
- an OQ-017 posting-mechanism decision
- APIs, application code, or implementation

OQ-001 through OQ-019 remain unanswered or `treating`.

## Approved evidence package

- `docs/00-governance/approved-baselines/APR-006-database-architecture.md` — `APR-006` — version `0.1.0`
- `docs/04-database-architecture/README.md` — `PHASE-04`
- `docs/04-database-architecture/LOGICAL_MODEL.md` — `DATA-LOGICAL-001`
- `docs/04-database-architecture/LOGICAL_ATTRIBUTE_CATALOGUE.md` — `DATA-ATTR-001`
- `docs/04-database-architecture/POSTING_KERNEL.md` — `DATA-POST-001`
- `docs/04-database-architecture/TRANSACTION_AND_IDEMPOTENCY.md` — `DATA-TX-001`
- `docs/04-database-architecture/GENEALOGY_PROJECTION.md` — `DATA-GEN-001`
- `docs/04-database-architecture/RETENTION_MIGRATION_OPENING_STOCK.md` — `DATA-CUTOVER-001`
- `docs/04-database-architecture/ENFORCEMENT_ASSIGNMENT.md` — `DATA-ENF-001`
- `docs/04-database-architecture/SELF_CHECK.md` — `DATA-SELF-CHECK-001`
- `docs/04-database-architecture/INDEPENDENT_REVIEW.md` — `DATA-INDEP-REVIEW-001`
- `docs/04-database-architecture/RECONCILIATION.md` — `DATA-RECON-001`
- `docs/04-database-architecture/GATE_CHECKLIST.md` — `DATA-GATE-CHECKLIST-001`
- `docs/04-database-architecture/PHASE05_HANDOFF.md` — `DATA-P05-HANDOFF-001`
- `docs/04-database-architecture/CHECKPOINT_APR-006.md` — `DATA-CHECKPOINT-APR-006`

Phase 03 approved content (APR-005) and Phase 05 structure drafts started
after this approval are **not** approved by this gate. If they exist at
marker creation they must still be listed because the generator binds the
complete changed-file set. APR-005 remains approved. Its Git freeze
already existed at `bef6b6464baaf62ac8d3db9f9b7fa835ad04ec6c` (CHK-0006).

Exact SHA-256 digests belong in the human-created checkpoint marker.

## Closed blockers and accepted ADRs

- Questions: none closed. OQ-010 and OQ-019 remain `treating`.
- Decisions: none accepted beyond existing ADR-0001.
- Findings: FIND-029 resolved in the register sense by accepting ASM-017.
- Assumptions: ASM-017 accepted at `2026-09-06T19:42:00+03:30`.

## Residual items

- OQ-001 through OQ-019 remain open or `treating`.
- ADR-0006 through ADR-0008 remain proposed.
- Physical schema and the OQ-017 ADR remain later work.
- Git checkpoint for APR-006 completed at
  `87f9f10442d58fbd224dce09f46c862eb8707e8f`. The APR-005 freeze already
  existed at `bef6b6464baaf62ac8d3db9f9b7fa835ad04ec6c`; CHK-0006 records
  it.

## Reopen conditions

Reopen APR-006 if an approved logical write owner, Ledger-as-evidence
rule, Genealogy-as-projection rule, or open-extension treatment is
reversed, or if an unanswered OQ is later shown to have been silently
closed by this approval.
