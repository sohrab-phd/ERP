---
id: AI-PROMPT-001
title: Implementation Prompt Standards
phase: 10-ai-cursor-development
status: approved
version: 0.4.0
owners: [development-lead]
depends_on: [REPO-LAY-001, REPO-CONF-001, APP-ORCH-001, AI-AUTH-001, APR-011, APR-012]
last_reviewed: 2026-09-07
approval: APR-012
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
4. The commander `ACT-*` and, for stock, executor `ACT-IPS`
5. The `CONF-*` checks that must still pass
6. Every related open `OQ-*` as `GUARD_OPEN_POLICY` if unanswered
7. The exact unlock paths
8. Whether the diff is architecture-affecting (reopen) or not
9. The DATA-TX-001 bundle, if any, that must stay unsplittable

A prompt that omits any of those is incomplete. The agent must stop
and escalate, not invent the missing ID.

`TASK-IMPL` stays inside one write-owning module unless the task **is**
one of the named bundles below.

## Unsplittable bundles (from APP-ORCH-001)

A later prompt that implements any of these must keep the whole bundle
in one business transaction (mechanism stays OQ-017):

| Bundle | Must not split |
| --- | --- |
| CompleteProductionOperation + consume/output/residual/scrap | INV-006 |
| DispatchShipment + stock exit | INV-011, INV-017 |
| PostGoodsReceipt + Lot/Unit/Ledger | INV-001, INV-018 |
| ActivateReservation + reserved state + reserved qty | INV-002, INV-003 |
| AllocatePayment + invoice open-balance reduction | INV-012 |
| CreateResidualUnit + parent close/split | INV-008 |

Adapters (`ADP-*`) submit the owning command. They do not post the
bundle themselves (`CONF-ADP`).

## Forbidden prompt outcomes

- Closing an `OQ-*` without a register update
- Introducing `EditGenealogy`, `AdjustBalance`, or MVP `PortalPlaceOrder`
- Writing Ledger outside `mod-inventory-posting`
- Splitting a DATA-TX-001 bundle
- Creating paths outside a valid implementation unlock
- Choosing npm, NestJS, Prisma, Jest, Playwright, Docker, or Keycloak
  as if decided
- Minting `TEST-*` IDs or new `ACT-*` roles
- Naming people
- Generating `package.json`, Dockerfiles, or CI from architecture
  Markdown
- Treating generated OpenAPI or SQL as source truth over `docs/`
- Authorizing by a UI-claimed role (INV-015)
- Treating worker process identity as the commander (SV-009)
- Skipping SV-013 on ReverseGoodsReceipt
- Implementing `ADP-CUTOVER` as a passing path while OQ-015 is open
  (`GUARD_OPEN_POLICY`)

## Later prompt skeleton (label, not a vendor template)

```text
Baseline: APR-… / CHK-…
Unlock paths: …
Modules: mod-… / host-…
Commander ACT-*: … ; stock executor: ACT-IPS
Commands/queries: …
Bundle (or none): …
CONF that must pass: CONF-IPS, CONF-ADP, CONF-BUNDLE, CONF-FORBID,
  CONF-ISO, CONF-UNLOCK, CONF-IMPORT, CONF-CMD
Open OQ (GUARD_OPEN_POLICY): …
Architecture-affecting: yes/no
Must not: EditGenealogy, AdjustBalance, PortalPlaceOrder, split bundle,
  UI-trusted role, worker-as-commander
```

## Must not decide here

- Prompt-vendor product
- Token or context-window product
- A stored prompt library product
