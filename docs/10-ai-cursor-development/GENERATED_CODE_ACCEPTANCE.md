---
id: AI-ACCEPT-001
title: Generated Code Acceptance
phase: 10-ai-cursor-development
status: in_review
version: 0.2.0
owners: [qa-architect, development-lead]
depends_on: [REPO-GEN-001, REPO-CONF-001, AI-PROMPT-001, APR-011]
last_reviewed: 2026-09-07
approval: null
supersedes: null
---

# Generated-Code Acceptance

When later generated code may be kept. No generated application code
exists in this phase. Scanner products and coverage percents stay
open.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Later keep rules (labels)

Generated application code may be kept only if:

1. A valid implementation unlock named the path (`CONF-UNLOCK`)
2. It traces to an authored command/query catalogue, not a second
   catalogue (`REPO-GEN-001`)
3. `CONF-IPS`, `CONF-ADP`, `CONF-BUNDLE`, `CONF-FORBID`, and
   `CONF-ISO` still hold
4. It does not invent UOM, named people, or a package ADR
5. `REV-HUMAN` accepted any architecture-affecting diff
6. Unanswered policy compiled as `GUARD_OPEN_POLICY`, not as a guessed
   constant

Generated OpenAPI or SQL must not become source truth over `docs/`.
Genealogy and Balance rebuilds remain projections from Ledger. They
are not `EditGenealogy` or `AdjustBalance`.

## Later reject rules (labels)

Reject generated output that:

| Outcome | Violates |
| --- | --- |
| Ledger write outside Inventory Posting | `CONF-IPS` |
| Adapter or worker table write | `CONF-ADP` |
| Split DATA-TX-001 bundle | `CONF-BUNDLE` |
| Callable `EditGenealogy` / `AdjustBalance` / MVP `PortalPlaceOrder` | `CONF-FORBID` |
| Export or live notice without customer isolation | `CONF-ISO` |
| Path outside the unlock | `CONF-UNLOCK` |
| Secrets or `.env` in the tree | `CONF-SECRET` |
| `package.json`, Dockerfile, or CI generated from architecture Markdown | ASM-022 remainder; OQ-018 |
| A `TEST-*` ID catalogue | FIND-028 |

## Acceptance versus Phase 07 / Phase 09

- Phase 07 `QG-*` kinds remain evidence kinds, not a runner.
- Phase 09 `CONF-*` kinds remain the keep/reject oracles for later
  generated code.
- This phase does not add a scanner product or a coverage percent.

## Must not decide here

- Coverage percents
- A generated-code scanner product
- Prisma, OpenAPI, or Orval generators
