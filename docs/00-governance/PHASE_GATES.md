---
id: GOV-GATES-001
title: Phase Gate Policy
phase: 00-governance
status: approved
version: 0.3.1
owners: [chief-solution-architect, project-sponsor]
depends_on: [GOV-CHARTER-001, ASM-015]
last_reviewed: 2026-09-06
approval: APR-004
supersedes: null
---

# Phase Gate Policy

APR-002 approved the seed loop. The current version is `in_review` because the
Project Owner made the team question-pack handoff a standing rule (ASM-015).

## Standard phase loop

1. **Enter** — prior phase approved; scope, inputs, owners, reviewers, and
   blockers recorded.
2. **Draft** — create only the artifacts promised by the phase contract.
3. **Self-check** — check completeness, terminology, traceability, links, and
   cross-artifact consistency.
4. **Independent review** — use a reviewer who did not author the artifact.
5. **Reconcile** — resolve findings and update canonical registers.
6. **Gate review** — present exact artifacts, residual risks, and blockers.
7. **Team question pack** — publish every unanswered `OQ-*` grouped by
   related/owning phase in
   [TEAM_QUESTION_PACK.md](TEAM_QUESTION_PACK.md) and ask the Project Owner.
   Continue authorized work while answers are pending. Do not invent answers.
   A question pack is not phase approval.
8. **Explicit approval** — the user approves or rejects the phase.
9. **Freeze** — record an approval manifest with exact artifact hashes; a human
   creates the short-lived, Git-ignored protected checkpoint marker binding that
   manifest and the complete changed-file set to SHA-256 digests; create only the
   authorized local Git checkpoint.
10. **Advance** — authorize only the next phase.

## Gate results

- `APPROVED`: exit criteria satisfied and no in-scope blocker remains.
- `REJECTED`: correction is required before another gate review.
- `DEFERRED`: capability is explicitly removed from the current authorized scope;
  its questions and risks remain registered.

Conditional approval cannot conceal an in-scope blocker.

## Artifact lifecycle

`planned → draft → in_review → rework → approved → superseded|retired`

An approved artifact changed materially returns to `rework`. Dependent artifacts
become `suspect` in the review register until impact analysis confirms or updates
them. `suspect` is a review flag, not a replacement lifecycle status.

## Blocking classification

Severity and blocking scope are separate:

- Severity: `critical`, `high`, `medium`, `low`
- Blocking scope: `global`, `phase`, `artifact`, `implementation-area`,
  `deployment`, `go-live`, `none`

Critical issues threaten stock truth, genealogy, security, legal/financial
evidence, or fundamental scope. High issues materially affect cross-domain
behavior or acceptance.

## Decision policy

Material technical or architectural alternatives require an ADR. ADR lifecycle:

`proposed → evaluating → accepted|rejected → superseded`

An ADR records context, evidence, options, criteria, decision, consequences,
risks, rollback/change conditions, and affected artifacts.

## Reopening approved work

Reopen affected gates when a change modifies scope, canonical terminology,
business invariant, state behavior, ownership, data contract, security policy,
NFR, interface, acceptance criterion, or accepted ADR. Editorial corrections may
use a patch version without reopening if meaning and traceability do not change.

## Implementation authorization

Implementation requires all phases approved, all critical in-scope questions and
ADRs closed, traceability complete, independent Critical/High findings resolved,
and an explicit authorization referencing an exact frozen baseline.

The implementation unlock validates both protected policy and a human-created
marker. File writes are limited to listed paths; Shell commands are exact,
separately approval-gated entries. Unknown tools remain denied until classified.

Phase checkpoint authorization independently validates the approval-manifest
digest and every approved artifact digest. Before staging, changed files must
exactly equal the marker's approved artifact set; before commit, staged files
must exactly equal it. Authorization markers are Git-ignored.
