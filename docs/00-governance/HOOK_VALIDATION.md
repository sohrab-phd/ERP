---
id: GOV-HOOK-VALIDATION-001
title: Architecture Write-Gate Validation
phase: 00-governance
status: approved
version: 0.11.1
owners: [chief-solution-architect]
depends_on: [ADR-0005, GOV-CURRENT-001]
last_reviewed: 2026-09-04
approval: APR-002
supersedes: null
---

# Architecture Write-Gate Validation

## Scope

Validate that covered Cursor agent actions permit architecture documentation and
approved repository inspection while implementation remains locked.

## Evidence

- Suite: `72` permission and temporary-repository integration cases passed.
- Live Cursor `preToolUse` and `beforeShellExecution` events parsed successfully.
- Live read-only `git status --short` completed successfully.
- This governed Markdown update passed through the active fail-closed hook.
- Cursor's UTF-8 BOM as decoded by Windows PowerShell is handled before JSON parsing.
- Policy enforcement is `locked`.
- `IMPLEMENTATION_AUTHORIZED` remains `false`.

## Synthetic cases

- Allowed while locked: reads, architecture Markdown, root README, exact read-only
  Git commands, and the exact hook test command.
- Denied: TypeScript source, package manifest, SQL, deployment YAML, outside-root
  paths, traversal, deletes, protected controls, pre-approval Git staging/commit,
  package commands, arbitrary/compound/redirected shell commands, malformed
  input, and missing event metadata.
- Unlock tests deny absent, malformed, mismatched, policy-disagreed, and
  unsafe-wildcard markers.
- A valid synthetic unlock requires matching policy/baseline/identity/timestamp
  evidence and an authoritative approved manifest with a Git commit.
- Post-unlock writes permit only exact listed files or directory-prefix scopes.
- Post-unlock Shell permits only exact marker-listed commands and returns `ask`
  at `beforeShellExecution`; unlisted commands remain denied.
- Unknown tool types remain denied until explicitly classified.
- MCP resource reads are allowed without a download target. Resource downloads
  are treated as writes and validated against the locked or approved path scope.
- Git staging/commit remains denied until a valid, unexpired, human-created
  checkpoint marker references an approved manifest and exact Git commands.
- Approval-manifest filename IDs must match frontmatter IDs, and checkpoint
  manifests must declare the marker's exact phase.
- Checkpoint-manifest state is mutually exclusive: authorization accepts exactly
  one pending checkpoint with no valid hash commit, or exactly one completed
  checkpoint paired with exactly one 40–64 hexadecimal commit. Mixed, duplicate,
  missing, and unpaired forms fail closed.
- Checkpoint markers bind the manifest and complete approved artifact set to
  raw-file SHA-256 digests plus clean-filtered Git blob object IDs and modes.
  Changed files are checked before staging; staged paths, blob IDs, and modes are
  checked before commit, including deletions and type changes.
- Authorization markers are Git-ignored; `git check-ignore` confirms both paths.
- Integration cases use a temporary Git repository to verify extra-deletion
  rejection, exact changed/staged-set acceptance, and staged-byte tamper rejection.
- The first APR-000 staging attempt failed closed because checkpoint validation
  rejected approved protected controls. FIND-013 corrected the classification:
  controls remain agent-write protected, but a human marker may checkpoint their
  exact approved identities. Authorization markers remain excluded.
- FIND-013 was independently verified, and renewed approval is recorded as
  `APR-001`. The checkpoint remains pending.
- The APR-001 commit attempt failed closed because Cursor's fixed co-author
  trailer was not represented in the exact command allowlist. FIND-014 permits
  only the plain command or that exact trailer form; arbitrary trailers remain
  denied.
- The agent submits plain `git commit -m ...`; Cursor transforms it to
  `git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>" -m ...`
  before hook evaluation. The marker generator stores that transformed form.
- The user-authorized index clear after the failed commit left no staged content,
  and no commit exists.
- The existing APR-001 marker contains the old plain commit form and is stale;
  it was neither regenerated nor treated as current authorization during this
  reconciliation.
- The narrow independent FIND-014 review returned
  `READY_FOR_RENEWED_HUMAN_APPROVAL` with no Critical or High blocker.
- Final renewed explicit approval is recorded as APR-002 at
  `2026-09-04T16:15:30.3016652+03:30`; its checkpoint completed at
  `540a606ef32a3cb17f7e886dff3c4dcde82ca4b1`.
- The first post-checkpoint follow-up staging attempt failed closed because
  checkpoint authorization accepted only pending manifests. No staging or
  follow-up commit resulted.
- FIND-015 corrects that constraint while preserving fail-closed behavior. The
  first predicate revision's mixed-state edge was caught by independent review;
  the final predicate enforces the two exact, mutually exclusive states above.
- Implementation-baseline commit validation accepts only hashes with paired or
  absent backticks. Direct paired/unpaired implementation cases are included in
  the 72 passing tests.
- The narrow FIND-015 independent review returned
  `READY_FOR_CORRECTION_APPROVAL` with no blocker.
- The Project Owner gave explicit approval in the Cursor session for the
  FIND-015 post-checkpoint correction and its follow-up checkpoint at
  `2026-09-04T16:49:32.2914786+03:30`.

## Limitations

- This controls covered Cursor agent hook events, not manual editor changes,
  external operating-system writes, or every editor completion mechanism.
- Git/branch protection and CI conformance checks will be designed in later phases.
- Hook recovery requires a human to rename/disable `hooks.json` and fully restart
  Cursor if fail-closed behavior prevents maintenance.
- `.cursor/hooks.disabled` is the current maintenance state. Restoration and
  checkpoint generation are deferred to the human checkpoint procedure.

## Result

`CORRECTION_APPROVED_CHECKPOINT_PENDING`

The 72-case suite passed. FIND-015 is resolved, independently verified, and
explicitly approved by `Project Owner (explicit approval in Cursor session)` at
`2026-09-04T16:49:32.2914786+03:30`. Its follow-up checkpoint is pending; no
follow-up staging or commit is claimed. APR-002 remains the approved Phase 00
baseline, and its checkpoint remains completed at
`540a606ef32a3cb17f7e886dff3c4dcde82ca4b1`. Phase 01 remains
`ACTIVE_IN_REVIEW`. No APR-003 is created, and implementation remains
unauthorized.
