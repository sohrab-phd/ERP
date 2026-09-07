---
id: PLAN-WI-001
title: Work Items Linked to Approved IDs
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [delivery-lead]
depends_on: [PLAN-SLICE-001, AI-PROMPT-001, APR-013, ASM-025]
last_reviewed: 2026-09-07
approval: null
supersedes: null
---

# Work Items Linked to Approved IDs

Work-item **kinds** for later `TASK-IMPL`. These are not tickets in a
tracker and not `TEST-*` IDs.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Required citations on every later `TASK-IMPL`

From APR-012 / AI-PROMPT-001, a later implementation task must cite:

1. The owning `APR-*` / `CHK-*`
2. Command or query IDs
3. `mod-*` write owner
4. `ACT-*` role
5. `CONF-*` keep/reject rules
6. Open `OQ-*` as `GUARD_OPEN_POLICY`
7. Unlock paths (only after a valid human unlock)
8. Named DATA-TX-001 bundle, if any

## Work-item kinds (labels)

| Kind | Maps to | Must reject |
| --- | --- | --- |
| `WI-CMD` | One catalogue command | Split bundle; UI-claimed role |
| `WI-QRY` | One catalogue query | Isolation leak (SV-005) |
| `WI-ADP` | One `ADP-*` commander | Adapter table write |
| `WI-BUNDLE` | One DATA-TX-001 bundle | Partial post |
| `WI-REBUILD` | `BalanceRebuild` / `GenealogyRebuild` | `AdjustBalance` / `EditGenealogy` |
| `WI-CONF` | Import/`CONF-*` check | Guessed UOM constant |
| `WI-DOC` | Architecture Markdown in the authorized phase | Closing an `OQ-*` |

A `WI-*` is not a `TEST-*`. Verification stays `QA-SCN-*` / `SV-*`
intents until a runner ADR (OQ-018, FIND-028).

## Must not decide here

- Jira/Linear/GitHub Issues as a product
- Story points
- Named assignees
