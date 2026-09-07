---
id: AI-PROMPT-001
title: Implementation Prompt Standards
phase: 10-ai-cursor-development
status: in_review
version: 0.2.0
owners: [development-lead]
depends_on: [REPO-LAY-001, REPO-CONF-001, AI-AUTH-001, APR-011]
last_reviewed: 2026-09-07
approval: null
supersedes: null
---

# Implementation Prompt Standards

What a later implementation prompt must contain. No prompt in this
phase creates application source. Prompt-vendor and token-window
products stay open.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Task kinds (labels)

| Kind | When | Agent kind |
| --- | --- | --- |
| `TASK-ARCH` | Current authorized architecture phase | `AG-ARCH` |
| `TASK-CHK` | After a valid human checkpoint marker | `AG-CHK` |
| `TASK-IMPL` | After a valid implementation unlock | `AG-IMPL` |
| `TASK-TEST` | After unlock and a test-runner ADR | `SKILL-TEST` |

`TASK-IMPL` and `TASK-TEST` do not exist while
`IMPLEMENTATION_AUTHORIZED` is false.

## Required citations (later `TASK-IMPL`)

Every later implementation task must name:

1. The approved baseline (`APR-*` / `CHK-*`)
2. The command or query catalogue IDs it may touch
3. The `mod-*` / `host-*` labels in scope
4. The `CONF-*` checks that must still pass
5. Every related open `OQ-*` as `GUARD_OPEN_POLICY` if unanswered
6. The exact unlock paths
7. Whether the diff is architecture-affecting (reopen) or not

A prompt that omits any of those is incomplete. The agent must stop
and escalate, not invent the missing ID.

## Forbidden prompt outcomes

- Closing an `OQ-*` without a register update
- Introducing `EditGenealogy`, `AdjustBalance`, or MVP `PortalPlaceOrder`
- Writing Ledger outside `mod-inventory-posting`
- Splitting a DATA-TX-001 bundle
- Creating paths outside a valid implementation unlock
- Choosing npm, NestJS, Prisma, Jest, Playwright, Docker, or Keycloak
  as if decided
- Minting `TEST-*` IDs
- Naming people
- Generating `package.json`, Dockerfiles, or CI from architecture
  Markdown
- Treating generated OpenAPI or SQL as source truth over `docs/`

## Later prompt skeleton (label, not a vendor template)

```text
Baseline: APR-… / CHK-…
Unlock paths: …
Modules: mod-… / host-…
Commands/queries: …
CONF that must pass: CONF-IPS, CONF-ADP, CONF-BUNDLE, CONF-FORBID,
  CONF-ISO, CONF-UNLOCK
Open OQ (GUARD_OPEN_POLICY): …
Architecture-affecting: yes/no
Must not: EditGenealogy, AdjustBalance, PortalPlaceOrder, split bundle
```

## Must not decide here

- Prompt-vendor product
- Token or context-window product
- A stored prompt library product
