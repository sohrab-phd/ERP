---
id: AI-AUTH-001
title: Agent Authority and Escalation
phase: 10-ai-cursor-development
status: approved
version: 0.4.0
owners: [chief-solution-architect]
depends_on: [REPO-BR-001, REPO-CONF-001, APP-ORCH-001, APR-011, APR-012]
last_reviewed: 2026-09-07
approval: APR-012
supersedes: null
---

# Agent Authority and Escalation

What an AI agent may do in this repository. Named approvers stay
OQ-019. Extra MCP/runtime products stay OQ-018. This does not
authorize implementation.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Authority kinds (labels)

| Kind | Agent may | Agent must not |
| --- | --- | --- |
| `AG-ARCH` | Draft architecture Markdown and register rows in the current authorized phase | Approve a gate; close an `OQ-*`; invent an accepted ADR; treat chat as a decision |
| `AG-CHK` | After a valid human marker, run only the marked `git add` / `git commit` | Invent or edit `.cursor/PHASE_CHECKPOINT_APPROVAL.json`; amend a frozen `CHK-*`; `git push`; `git restore`; `git reset` |
| `AG-IMPL` | Later, only under a valid implementation unlock and the exact named paths | Create `package.json`, app folders, or any path outside the unlock |
| `AG-UNLOCK` | Never | Invent or edit `.cursor/IMPLEMENTATION_UNLOCK.json` |

Temporary workshop identities have no approval authority. `REV-AGENT`
cannot substitute for `REV-HUMAN`. “Ok, Continue” is not a gate.

## Mapping to approved Phase 09 labels

| Agent kind | Branch kind | Review kind | Conformance |
| --- | --- | --- | --- |
| `AG-ARCH` | `BR-ARCH` | `REV-INDEP` then `REV-HUMAN` | `QG-ARCH` |
| `AG-CHK` | `BR-ARCH` freeze | `REV-HUMAN` marker | Marker exact-match |
| `AG-IMPL` | `BR-IMPL` (does not exist now) | `REV-HUMAN` for architecture-affecting diffs | `CONF-UNLOCK` plus `CONF-IPS` / `CONF-ADP` / `CONF-BUNDLE` / `CONF-FORBID` / `CONF-ISO` / `CONF-IMPORT` / `CONF-CMD` |
| `AG-UNLOCK` | none | `REV-HUMAN` only | Unlock file is human-created and currently absent |

`BR-IMPL` does not exist while `IMPLEMENTATION_AUTHORIZED` is false.
`AG-IMPL` is therefore blocked until a later human unlock names exact
paths.

## Later host scope (labels; folders not created)

When `AG-IMPL` exists, a task is still bound to one write owner unless
it is a named DATA-TX-001 bundle:

| Later host / module | Agent may | Agent must not |
| --- | --- | --- |
| `mod-inventory-posting` | Execute `ACT-IPS` stock writes commanded by others | Invent a second posting API |
| `mod-integration` / `host-adapter` | Submit catalogue commands (`ADP-*`) | Write Ledger, orders, inspections; split a bundle |
| `host-worker` | Retry the same `idempotency_key` (INV-016) | Become a second stock writer (SV-009) |
| `ui-operator` | Call the command/query envelope | Authorize by a UI-claimed role (INV-015) |
| `mod-finance-lite` | Export facts | Become legal GL (ASM-010) |
| `mod-portal` | none in MVP | `PortalPlaceOrder` (INV-020) |

## Standing prohibitions (now and later)

An agent must reject, not guess, when asked to:

1. Close or answer an `OQ-*` without a matching register update from
   the Project Owner.
2. Accept ADR-0006, ADR-0007, ADR-0008, or any package as decided.
3. Introduce `EditGenealogy`, `AdjustBalance`, or MVP `PortalPlaceOrder`.
4. Write Ledger, Balance, or unit quantity outside
   `mod-inventory-posting` / `ACT-IPS`.
5. Split a DATA-TX-001 bundle across modules, hosts, or adapters.
6. Mint a `TEST-*` catalogue (FIND-021 / FIND-028) or a new `ACT-*`
   role.
7. Name a real person (OQ-019) or freeze an extra MCP product
   (`MCP-EXTRA` / OQ-018).
8. Work around a write-gate denial.
9. Skip SoD on `ReverseGoodsReceipt` (SV-013) or treat a worker
   identity as the commander.
10. Restore Balance or Genealogy except as a Ledger rebuild.

Unanswered policy needed to proceed is `GUARD_OPEN_POLICY`.

## Escalation

| Event | Escalates to |
| --- | --- |
| Phase gate | `REV-HUMAN` (Project Owner) |
| Structure review | `REV-INDEP` then `REV-HUMAN` |
| Material architecture change | Reopen the owning `APR-*` |
| Unanswered policy needed to proceed | `GUARD_OPEN_POLICY`; do not guess |
| Write-gate or marker denial | `REV-HUMAN`; do not invent a marker |
| Missing implementation unlock | Remain on `AG-ARCH`; do not start `AG-IMPL` |
| SoD or isolation conflict | `REV-HUMAN`; do not weaken SV-* |

## Must not decide here

- Named agent operators or named human approvers
- A vendor agent-runtime product
- Extra MCP servers
- An implementation unlock path list
