---
id: ASM-CHECKPOINT-APR-003
title: APR-003 Checkpoint Procedure
phase: 01-project-assimilation
status: approved
version: 0.2.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [APR-003, GOV-GATES-001]
last_reviewed: 2026-09-04
approval: APR-003
supersedes: null
---

# APR-003 Checkpoint Procedure

The Project Owner explicitly approved Phase 01 as APR-003 at
`2026-09-04T20:38:00+03:30`. This procedure records future human-controlled
checkpoint steps only. No marker, staging, commit, checkpoint, or commit hash
exists or is claimed.

## Protected generator readiness

The protected maintenance update is complete. The marker generator now defaults
to Phase `01-project-assimilation`, APR-003, and the intended commit subject. It
also accepts validated phase/manifest parameters for future approved phases, so
future checkpoints do not require hard-coded control edits.

The PowerShell parser and architecture-gate regression suite validate the
updated control before marker creation.

## Human checkpoint steps

1. Verify the working tree and index state and confirm the finalized changed
   files exactly match the APR-003 approval scope.
2. Verify all governed Markdown frontmatter, links, gate states, and carried
   downstream items.
3. Confirm Phase 02 is still inactive and
   `IMPLEMENTATION_AUTHORIZED` remains `false`.
4. Restore active hooks, fully reopen Cursor, and have a human run the validated
   marker generator with its APR-003 defaults.
5. Verify the short-lived Git-ignored marker binds the finalized APR-003
   manifest digest, complete changed-file set, raw-file SHA-256 values,
   clean-filtered Git blob IDs, Git modes, and exact permitted commands.
6. Only after the marker passes all checks, provide separate authorization for
   the exact checkpoint commands.
7. After a successful commit, remove the expired marker and record the resulting
   commit through the separately governed checkpoint-recording process.

## Intended checkpoint command

The exact intended commit subject is:

```text
docs: approve phase 01 project assimilation
```

The corresponding plain command is intended to be:

```text
git commit -m "docs: approve phase 01 project assimilation"
```

These lines document intent; they do not currently authorize staging or commit.
The protected marker must contain the exact transformed command required by the
active hooks before any checkpoint attempt.

## Current state

- Gate result: `APPROVED`
- Phase: `01-project-assimilation`
- Git checkpoint: pending
- Git commit: pending
- Phase 02: inactive
- Implementation authorization: none
