---
id: APR-019
title: Identity and authorization scope and backlog progression delegation
status: approved
version: 1.0.0
owners: [project-sponsor]
last_reviewed: 2026-10-07
approval: Project Owner explicit Codex user message
---

# Identity and authorization scope

Authority is the Project Owner's 2026-10-07 message in this task:

> The next authorized implementation scope is: Identity and authorization

The same message explicitly directs Codex to update canonical scope/unlock records.
This is its transcription, not a fabricated signature or agent approval.
Approved architecture baseline remains APR-018 commit
`e80a04b15ddf93451cc79ccf81722f564912596d`; starting implementation HEAD is
`ff7d9169613b8463c6df930b6433ebdedfe67a20`. No history is rewritten.

Identity is backlog capability 2, owned by mod-identity-audit. It includes personal
accounts, login/logout, revocable sessions, explicit role/customer/site checks,
security administration and audit evidence. No shared station identity, implicit
super-admin, QC, business posting, deployment or remote push is authorized.
Technical choices and bounded paths are in the Identity implementation plan.
Unanswered factory mappings remain unavailable; OQ answers are not changed.

Standing delegation: after a backlog slice passes DoD, tests, independent engineering
and security review, documentation and local commit, Codex may record the next
already-approved backlog slice without another scope authorization. It cannot
invent major modules, expand MVP/deferred features, bypass architecture/review,
guess business policy, push/rewrite history or run multiple major slices without
a documented prerequisite. New business/product decisions still require the Owner.

Current instruction requires stopping after this accepted local commit, before
starting the next major slice, so the Owner can push. This delegation does not
authorize a remote push or removal of that stop.
