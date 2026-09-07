---
id: PLAN-AUTH-001
title: Implementation Authorization Record Labels
phase: 12-implementation-planning
status: approved
version: 0.3.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [TEMPLATE-IMPLEMENTATION-UNLOCK, AI-TOOL-001, APR-013, APR-014, ASM-025]
last_reviewed: 2026-09-07
approval: APR-014
supersedes: null
---

# Implementation Authorization Record (labels only)

What a later human unlock must contain. The file
`.cursor/IMPLEMENTATION_UNLOCK.json` remains **absent**. `AG-UNLOCK`
never invents or edits it.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

Phase 12 approval is **not** this unlock.

## Required fields (labels; file not created)

From AI-TOOL-001 and the unlock template:

| Field | Meaning |
| --- | --- |
| `approvedBy` | Named person (OQ-019) or Project Owner |
| `approvedAt` | Timestamp |
| `approvedBaseline` | An `APR-*` under `docs/00-governance/approved-baselines/` with a recorded Git commit |
| `allowedWritePaths` | Exact paths or `directory/**`; minimum one; no broad outside-project wildcards |
| `allowedShellCommands` | Exact commands; no `;`, `|`, or redirection |

The protected architecture-gate policy must independently set
`implementationAuthorized` and cite the same baseline.

## Invalid unlock (labels)

An unlock is invalid, and agents must not follow it, when it:

- names `package.json`, Docker, CI, or a path outside the approved
  baseline unless a later approval explicitly adds it
- omits `approvedBaseline` or cites a manifest without a recorded Git
  commit
- uses `;`, `|`, or redirection in `allowedShellCommands`
- is invented or edited by an agent (`AG-UNLOCK` never)

`AG-IMPL` stays blocked until a valid human unlock exists. `BR-IMPL`
does not exist before that.

## What this record must restate

- `ACT-IPS` is the only stock writer
- DATA-TX-001 bundles stay unsplittable
- `CONF-FORBID` for `EditGenealogy`, `AdjustBalance`, MVP
  `PortalPlaceOrder`
- Open `OQ-*` remain `GUARD_OPEN_POLICY`
- Architecture-affecting diffs reopen the owning `APR-*`
- Frozen `CHK-*` commits are not amended
- `BR-IMPL` exists only after the unlock is valid

## After Phase 12

There is no Phase 13 in this programme. After an approved Phase 12
freeze, implementation still waits on the human unlock above. Planning
labels are not application source.

## Must not decide here

- Creating the unlock file
- Naming allowed paths
- Setting `IMPLEMENTATION_AUTHORIZED` to `true`
