---
id: APR-017
title: APR-016 Checkpoint Recording Follow-up Approval
phase: 12-implementation-planning
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [GOV-GATES-001, APR-016]
last_reviewed: 2026-10-02
approval: APR-017
supersedes: null
---

# APR-017 — APR-016 Checkpoint Recording Follow-up Approval

- Gate result: `APPROVED`
- Explicit approver: Project Owner (current Codex request authorizing the
  separately required forward CHK recording)
- Approval statement: The Project Owner's current instruction explicitly
  authorized completing the separately required forward CHK recording for
  APR-016 if repository governance permits. This manifest records that narrow
  authorization against the five factual files below; the human checkpoint
  marker remains a separate required action.
- Approval timestamp: `2026-10-02T02:38:41.7295091+03:30`
- Phase: `12-implementation-planning`
- Scope authorized: forward documentation of APR-016 commit
  `02163debe68f29800c6986015e81eea027547c60` only
- Authorized next phase: none; there is no Phase 13
- Implementation authorization: none; `IMPLEMENTATION_AUTHORIZED` remains
  `false`
- Git checkpoint: pending
- Git commit: pending
- Supersedes approval: none

The timestamp records this approval during the current work, not an exact
message-delivery time. This is a recording follow-up, not approval of Codex
technical enforcement, idempotency semantics, first-slice tools, business
rules, or ERP implementation.

## Approved artifacts

- `docs/00-governance/APPROVALS.md` — `GOV-APPROVALS-001` version `0.12.1`
- `docs/00-governance/approved-baselines/APR-016-codex-tooling-migration.md`
  — `APR-016` version `0.1.1`, factual post-checkpoint update
- `docs/00-governance/approved-baselines/APR-017-apr-016-checkpoint-recording.md`
  — `APR-017` version `0.1.0`, this manifest
- `docs/00-governance/approved-baselines/CHK-0015-apr-016.md` — `CHK-0015`
  version `0.1.0`, forward checkpoint record
- `docs/00-governance/approved-baselines/README.md` — `GOV-BASELINES-001`
  version `0.3.2`

The human-created marker must bind exactly these five changed files with raw
SHA-256 hashes, clean-filtered Git blob IDs, modes, and the exact Git
commands. This manifest does not contain a self-referential digest. The
Project Owner must remove or replace the old APR-016 marker; Codex must not
edit either protected marker.

## Recorded checkpoint evidence

APR-016 was committed at `02163debe68f29800c6986015e81eea027547c60`,
with parent `bb2fb692481ec4d8154cbca8cd694c033883eb05`, exactly 16
files changed, and subject `governance: checkpoint Codex tooling migration`.
The commit used the configured Git author and no Cursor co-author trailer.
CHK-0014 and APR-015 remain historical forward records and are not edited in
this follow-up.

## Closed blockers and residuals

- Questions: none closed; OPEN_QUESTIONS remains authoritative.
- Decisions: none accepted; ADR-0008 remains proposed.
- Codex project instructions and technical hook interception remain absent or
  unverified and block implementation authorization.
- Generic idempotency, first-slice technology/layout, and exact future
  implementation scope remain to be decided through later governance.
- The follow-up checkpoint requires a new human-created marker. The APR-016
  marker cannot authorize it.
- `.cursor/IMPLEMENTATION_UNLOCK.json` remains absent; the canonical
  architecture gate remains unauthorized.

## Reopen conditions

Reopen this approval if the APR-016 commit evidence is wrong, any file outside
the five-file set is included, the marker digests do not match, an ERP or ADR
decision is introduced through this record, or implementation authority is
claimed. The later recording checkpoint needs no recursive CHK record.
