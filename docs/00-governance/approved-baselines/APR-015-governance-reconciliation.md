---
id: APR-015
title: Reconciled Governance Baseline Approval
phase: 12-implementation-planning
status: approved
version: 0.1.1
owners: [project-sponsor, chief-solution-architect]
depends_on: [GOV-GATES-001, GOV-QUESTIONS-001, APR-014, CHK-0013]
last_reviewed: 2026-10-02
approval: APR-015
supersedes: null
---

# APR-015 — Reconciled Governance Baseline Approval

- Gate result: `APPROVED`
- Explicit approver: Project Owner (explicit approval in Cursor session)
- Approval statement: The Project Owner approved the reconciled governance state at content-basis commit `ecbe67b00bfe077a44e54e20961ed1f941bfed70` for a new, forward governance checkpoint. That existing commit is evidence, not the governed checkpoint.
- Approval timestamp: `2026-10-02T01:24:50.9165371+03:30`
- Phase: `12-implementation-planning`
- Scope authorized: Governance checkpoint preparation for the reconciled documentation state at the content-basis commit; no business-rule change or implementation work.
- Authorized next phase: none; there is no Phase 13
- Implementation authorization: none; `IMPLEMENTATION_AUTHORIZED` remains `false`
- Git checkpoint: completed successfully; 1 file changed
- Git commit: `bb2fb692481ec4d8154cbca8cd694c033883eb05`
- Supersedes approval: none

The timestamp above records this explicit approval during checkpoint preparation; it is not a claim about the exact message-delivery time.

## Approved scope and evidence

The approved content basis is the repository state at `ecbe67b00bfe077a44e54e20961ed1f941bfed70`, a direct descendant of the earlier Phase 12 structure freeze. It is not retroactively designated as an APR-015 checkpoint. The subsequent marker-authorized commit containing this manifest is the governed checkpoint at `bb2fb692481ec4d8154cbca8cd694c033883eb05`. This resulting hash is recorded in this separately authorized post-commit follow-up and CHK-0014.

The live [OPEN_QUESTIONS.md](../registers/OPEN_QUESTIONS.md), [DECISIONS.md](../registers/DECISIONS.md), [MVP_SCOPE_AND_BUSINESS_RULES.md](../../02-domain-business-architecture/MVP_SCOPE_AND_BUSINESS_RULES.md), [INVARIANT_CATALOGUE.md](../../03-state-machines-invariants/INVARIANT_CATALOGUE.md), [POSTING_KERNEL.md](../../04-database-architecture/POSTING_KERNEL.md), and [IMPLEMENTATION_READINESS.md](../../12-implementation-planning/IMPLEMENTATION_READINESS.md) carry the current status and design. The content basis includes recorded factory evidence on Coil → Sheet C-07, kg stock quantity, Stations and personal operator accounts, Entry and Referral, receiving, Residual/Scrap, organizational roles, Sales/invoice/payment, Production/genealogy, Shipment/Sales Order closure, and Procurement, Finance-Lite, and Opening Stock gaps. It also includes the current-MVP `AVAILABLE` stock-in rule and excludes QC execution and a Quality role from the current MVP. This manifest does not redefine those rules.

## Approved artifacts

- `docs/00-governance/approved-baselines/APR-015-governance-reconciliation.md` — `APR-015` — version `0.1.0` — the only artifact newly committed in the checkpoint.

The already committed documentation at `ecbe67b00bfe077a44e54e20961ed1f941bfed70` is the approved content basis, not a changed-file set to restage. The human-created protected checkpoint marker bound the then-finalized manifest with its raw-file SHA-256 digest, clean-filtered Git blob ID, Git mode, and exact permitted commands. No self-referential or placeholder digest was recorded here.

## Closed blockers and accepted ADRs

- Questions: none newly closed by APR-015. Live statuses remain on their matching `OQ-*` rows.
- Decisions: no new ADR accepted. ADR-0001, ADR-0006, and ADR-0007 remain accepted; ADR-0008 remains proposed.
- Findings: no new finding closed by this approval record.

## Residual items

- OQ-001, OQ-003, OQ-009, OQ-011, OQ-015, and OQ-019 remain `treating`; OQ-005 remains `treating` for future Quality detail only. OQ-006 remains `answered` with its recorded default and open configuration distinctions.
- Coil → Sheet posting, production consumption/output/WIP/process-loss detail, Sales amendment, Procurement workflow, Shipment workflow, Finance-Lite payment/credit detail, and Opening Stock inputs remain unresolved where the live register says so. This checkpoint does not waive them.
- The checkpoint is completed. The post-commit recording is a forward governance update; it does not amend the frozen commit.
- No implementation slice, package installation, repository layout, write path, shell command, or unlock is authorized. `.cursor/IMPLEMENTATION_UNLOCK.json` remains absent; `.cursor/architecture-gate.json` remains unauthorized.

## Reopen conditions

Reopen this approval if the approved content basis differs from the cited commit, its reconciled business or architecture meaning changes materially, an open question is silently closed, a protected-marker artifact digest does not match the prepared file, or the existing content-basis commit is incorrectly represented as the governed checkpoint. A later implementation decision requires its own human authorization and does not follow from APR-015.

## Post-checkpoint audit note

The checkpoint commit has `Co-authored-by: Cursor <cursoragent@cursor.com>` although Codex performed the checkpoint action during the agent-tool transition. This is an audit-attribution discrepancy, not a truthful Codex identity. The committed governance content remains accepted; Git history is unchanged. Future Codex actions must not use Cursor identity. CHK-0014 records the discrepancy forward.
