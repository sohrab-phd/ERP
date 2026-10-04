---
id: AI-AUTH-001
title: Agent Authority and Escalation
phase: 10-ai-cursor-development
status: in_review
version: 0.9.0
owners: [chief-solution-architect]
depends_on: [REPO-BR-001, REPO-CONF-001, APP-ORCH-001, APR-011, APR-012]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Agent Authority and Escalation

## Current trusted-agent pre-implementation mandate

The Owner's 2026-10-04 decision terminates the native OS-containment experiment.
[Trusted-agent operating model](TRUSTED_AGENT_OPERATING_MODEL.md) and ADR-0012
supersede ADR-0010's host-enforcement prerequisite and all native installer
requests. Codex is a trusted engineering agent obliged to obey governance;
malicious-agent OS tamper resistance is no longer an objective.

Codex may complete ERP architecture/planning, record delegated technical
idempotency/tooling/physical decisions and perform useful independent domain,
architecture, database, application-security, tooling and readiness reviews.
Preserve business evidence and live OQ status. Do not turn future slice/UAT/
Go-Live inputs into foundation-start blockers.

Human-only: final implementation authorization, gate/unlock, human baseline
approval and approval provenance. No tool or repository trust grants them.
Never self-authorize, fabricate Owner approval or create the final unlock.
No ERP application, business migration, packages or deployment is implemented
while the canonical gate is false and approvedBaseline null.

Archive obsolete native evidence/proposals without OS ACL changes or installer
execution. Actual legacy denials stop affected operations; document access and
review limits without reviving the experiment or bypassing a denial. The Owner
retired the Codex PreToolUse registration; after restart on 2026-10-04 repository
search and source reads resumed. No new native transition is required.

Ordinary delegated GCP evidence is distinct from human APR/CHK approval.
Do not stage unrelated dirty protected changes, push or rewrite history.
Required final baseline approval remains for the consolidated human package.
Persist the current objective in AGENTS.md and the operating-model document.

What an AI agent may do in this repository. Named approvers stay
OQ-019. Extra MCP/runtime products stay OQ-018. This does not
authorize implementation.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

Codex is the current AI development agent. The `.cursor/` control paths remain
canonical legacy physical paths; their names do not make Cursor the active
agent. The rules below apply within the current delegated mandate and effective
controls; no text below activates a protected gate change.
Cursor's hook registration does not demonstrate interception of Codex tools.
Codex must check current phase, gate, scope and required human approval before
an implementation or human-only action and stop on a mismatch. Hook installation
or adversarial containment is not a prerequisite; this is trusted-agent policy
compliance. Codex must never use a Cursor identity or
co-author trailer. Future checkpoints use the configured Git author plus
GCP evidence for ordinary delegated work, and APR/CHK plus human marker evidence
for human-approved baseline checkpoints.

## Authority kinds (labels)

| Kind | Agent may | Agent must not |
| --- | --- | --- |
| `AG-ARCH` | Administer ordinary architecture/governance/planning; record delegated technical decisions and explicit human instructions | Authorize implementation; invent business OQ closure or human approval |
| `AG-GCP` | Prepare exact manifests and local ordinary governance checkpoints after functioning controls | Represent a GCP as APR/CHK human approval; stage unapproved protected changes; push or rewrite history |
| `AG-CHK` | After a valid human marker, run only the marked `git add` / `git commit` | Invent or edit `.cursor/PHASE_CHECKPOINT_APPROVAL.json`; use a false agent identity; amend a frozen `CHK-*`; `git push`; `git restore`; `git reset` |
| `AG-IMPL` | Later, only under a valid implementation unlock and the exact named paths | Create `package.json`, app folders, or any path outside the unlock |
| `AG-UNLOCK` | Never | Invent or edit `.cursor/IMPLEMENTATION_UNLOCK.json` |

Temporary workshop identities have no approval authority. `REV-AGENT`
cannot substitute for `REV-HUMAN`. “Ok, Continue” is not a gate.

## Mapping to approved Phase 09 labels

| Agent kind | Branch kind | Review kind | Conformance |
| --- | --- | --- | --- |
| `AG-ARCH` | `BR-ARCH` | Independent review; consolidate required human material decisions | `QG-ARCH` |
| `AG-GCP` | `BR-ARCH` ordinary checkpoint | Independent review with declared agent provenance | Exact ordinary artifact manifest; never human baseline approval |
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
2. Treat ADR-0008 or an unselected package as already accepted. Delegated
   technical choices require evidence and an explicit recorded decision;
   required human material ADR approvals remain proposed for the final package.
   ADR-0001, ADR-0006 and ADR-0007 are already accepted.
3. Introduce `EditGenealogy`, `AdjustBalance`, or MVP `PortalPlaceOrder`.
4. Write Ledger, Balance, or unit quantity outside
   `mod-inventory-posting` / `ACT-IPS`.
5. Split a DATA-TX-001 bundle across modules, hosts, or adapters.
6. Mint a `TEST-*` catalogue (FIND-021 / FIND-028) or a new `ACT-*`
   role.
7. Name a real person (OQ-019) or freeze an extra MCP product
   (`MCP-EXTRA` / OQ-018).
8. Bypass an actual protected denial or self-authorize implementation. Complete
   permitted engineering and record access limits; do not revive a native installer.
9. Skip SoD on `ReverseGoodsReceipt` (SV-013) or treat a worker
   identity as the commander.
10. Restore Balance except as a Ledger rebuild, or restore Genealogy
    except as a DATA-GEN-001 source-fact rebuild (FIND-G-014). Do not
    treat Ledger rows as the only genealogy input.

Unanswered policy needed to proceed is `GUARD_OPEN_POLICY`.

## Escalation

| Event | Escalates to |
| --- | --- |
| Final implementation authorization / required human baseline | `REV-HUMAN` (Project Owner) |
| Routine structure review | `REV-INDEP`; repair autonomously within scope |
| Material architecture change | Impact analysis and ADR; consolidate required human approval in the final package |
| Unanswered policy needed to proceed | `GUARD_OPEN_POLICY`; do not guess |
| Operational denial | Stop affected action, complete unaffected work and record access limits; no native transition |
| Human marker denial | Do not invent a marker; defer unavoidable human checkpoint action to consolidated package |
| Missing implementation unlock | Remain on `AG-ARCH`; do not start `AG-IMPL` |
| SoD or isolation conflict | `REV-HUMAN`; do not weaken SV-* |

## Must not decide here

- Named agent operators or named human approvers
- A vendor agent-runtime product
- Extra MCP servers
- Creating/activating a valid final implementation unlock; proposed exact future
  path/command lists are permitted planning work
