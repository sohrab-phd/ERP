---
id: GOV-FINDINGS-001
title: Review Findings Register
phase: 00-governance
status: approved
version: 0.7.0
owners: [independent-reviewer, chief-solution-architect]
depends_on: [GOV-GATES-001]
last_reviewed: 2026-09-04
approval: APR-002
supersedes: null
---

# Review Findings Register

Findings are append-only and may be `open`, `accepted`, `resolved`, `rejected`,
or `superseded`. Resolution requires evidence and affected-artifact references.

## FIND-001 — Portal phase conflict

- Severity: critical
- Status: open
- Finding: Source documents disagree on whether Customer Portal capability is
  excluded from MVP or may be partially included.
- Affected artifacts: Phase 02 scope, Phase 05 API, Phase 06 security, Phase 08 deployment
- Related question: OQ-010

## FIND-002 — Proposed technologies may be mistaken for approved decisions

- Severity: high
- Status: treating
- Finding: NestJS, Prisma, Socket.IO, React, job scheduling, test runner, and
  observability references have different maturity across source sections.
- Treatment: ADR-0001 decides only Node.js + TypeScript; OQ-018 keeps detailed
  platform choices open.

## FIND-003 — Partial fulfillment policies lack numeric limits

- Severity: high
- Status: open
- Finding: Partial shipment/fulfillment is expected, but over-production and
  over-delivery tolerances remain unapproved.
- Related question: OQ-006

## FIND-004 — Inventory Posting architecture is unresolved

- Severity: critical
- Status: open
- Finding: Application-orchestrated transactions versus restricted PostgreSQL
  posting require evidence and an ADR.
- Related question: OQ-017

## FIND-005 — Governance safeguards are not OS-level controls

- Severity: medium
- Status: accepted
- Finding: Cursor rules/hooks can constrain covered agent actions but cannot
  prevent all manual or editor-assisted changes.
- Treatment: Document limitation; rely on explicit gates, review, Git history,
  and future CI/branch protection for broader enforcement.

## FIND-006 — Implementation authorization source

- Severity: critical
- Status: resolved
- Finding: Editable narrative status initially controlled technical unlock.
- Resolution: Hook authorization now requires protected Cursor policy plus a
  matching, validated implementation unlock marker.
- Evidence: HOOK_VALIDATION.md version 0.2.0

## FIND-007 — Unlock marker and post-unlock scope

- Severity: critical
- Status: resolved
- Finding: File-write scope is validated, but post-unlock Shell scope, unknown
  tools, and approval-manifest authenticity require stronger enforcement.
- Resolution: Exact authorized Shell commands are enforced; unknown tools are
  denied; MCP resource downloads are classified as writes; approved-manifest
  semantics, filename IDs, and checkpoint phases are cross-validated.
- Evidence: HOOK_VALIDATION.md version 0.4.0

## FIND-008 — Shell prefix bypass

- Severity: high
- Status: resolved
- Finding: Prefix matching allowed compound/redirection suffixes.
- Resolution: Whole-command patterns reject separators, pipes, redirects, extra
  options, and arbitrary commands while locked.
- Evidence: Expanded hook test suite

## FIND-009 — Pre-approval checkpoint bypass

- Severity: high
- Status: resolved
- Finding: Git staging/commit relied on agent-editable Markdown approval text.
- Resolution: Git staging/commit requires a protected, unexpired, human-created
  phase-checkpoint marker with exact approved commands and manifest reference.
- Evidence: HOOK_VALIDATION.md version 0.4.0

## FIND-010 — Missing Phase 00 gate evidence

- Severity: high
- Status: resolved
- Finding: Templates existed without instantiated Phase 00 review artifacts.
- Resolution: SELF_CHECK.md, INDEPENDENT_REVIEW.md, RECONCILIATION.md, and
  GATE_CHECKLIST.md now form the exact review package.

## FIND-011 — Hook configuration disabled during maintenance

- Severity: critical
- Status: resolved
- Finding: The first follow-up review found `.cursor/hooks.json` absent while its
  configuration remained in `.cursor/hooks.disabled`.
- Resolution: Maintenance configuration was removed, `.cursor/hooks.json` was
  restored, and a live `git status --short` read succeeded afterward.
- Evidence: HOOK_VALIDATION.md version 0.5.0

## FIND-012 — Checkpoint approval was not bound to immutable content

- Severity: high
- Status: resolved
- Finding: The checkpoint marker referenced editable Markdown and authorized
  `git add -A` without binding the complete changed-file set to approved content.
- Review history: Follow-up review 2 reopened this finding because staged
  deletions/type changes and staged bytes were not fully validated.
- Resolution: Marker validation requires raw SHA-256, clean-filtered Git blob
  object ID, and intended Git mode for every artifact. The hook compares complete
  changed/staged path sets, then staged blob IDs and modes. Both authorization
  markers are Git-ignored.
- Evidence: HOOK_VALIDATION.md version 0.6.0

## FIND-013 — Approved protected controls could not enter the checkpoint

- Severity: high
- Status: resolved
- Finding: The first APR-000 `git add -A` attempt failed closed because
  checkpoint authorization reused the agent-write protected-path rule and
  rejected hash-bound gate controls such as `.cursor/hooks.json`.
- Resolution: Agent writes to controls remain prohibited while the active hook
  is enabled. Separately, a valid human-created checkpoint marker may include
  protected control files when their raw SHA-256, Git blob ID, and mode match.
  Authorization marker files remain categorically excluded.
- Evidence: HOOK_VALIDATION.md version 0.8.1; 64-case suite
- Independent verification: completed; no Critical or High blocker remains.
- Approval disposition: corrected Phase 00 renewed under `APR-001`; checkpoint
  pending, implementation unauthorized, and Phase 01 inactive.

## FIND-014 — Cursor commit trailer absent from exact authorization

- Severity: high
- Status: resolved
- Finding: The APR-001 commit attempt failed closed because Cursor adds the
  fixed `Co-authored-by: Cursor <cursoragent@cursor.com>` trailer before hook
  evaluation, while the marker authorized only the unmodified command.
- Resolution: Validation accepts only the plain command or that exact fixed
  Cursor trailer form. The agent submits plain `git commit -m ...`; Cursor
  transforms it before hook evaluation, and the generator stores that transformed
  form in the marker. Arbitrary trailers remain denied.
- Evidence: HOOK_VALIDATION.md version 0.10.0; 66-case suite
- Independent verification: narrow review completed with verdict
  `READY_FOR_RENEWED_HUMAN_APPROVAL`; no Critical or High blocker remains.
- Approval disposition: APR-001 remains historical approved, but its uncommitted
  checkpoint is superseded by APR-002 and no APR-001 commit exists. Final
  renewed explicit approval is recorded as APR-002 at
  `2026-09-04T16:15:30.3016652+03:30`; the APR-002 checkpoint is pending, no
  staging or commit is claimed, implementation remains unauthorized, and
  Phase 01 remains inactive.

## Downstream suspect policy

When an approved upstream artifact changes materially, add a finding identifying
all potentially affected downstream artifacts. Clear `suspect` only after
documented impact review.
