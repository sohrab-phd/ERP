---
id: REPO-DEP-001
title: Dependency and Import Rules
phase: 09-repository-documentation
status: in_review
version: 0.1.0
owners: [solution-architect]
depends_on: [APP-MOD-001, REPO-LAY-001, APR-010]
last_reviewed: 2026-09-07
approval: null
supersedes: null
---

# Dependency and Import Rules

Allowed later import direction. This does not choose TypeScript path
aliases, a bundler, or a package manager (OQ-018).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Standing rules

1. A module may command Inventory Posting. It may not import Ledger,
   Balance, or unit-quantity writers except `mod-inventory-posting`.
2. `mod-integration` may import command types and submit commands. It
   may not import another module’s tables.
3. `mod-reporting` may read published snapshots. It may not write
   source facts.
4. `ui-operator` may call the command/query envelope. It is not a
   trust boundary (INV-015).
5. A later test tree may import modules. It may not introduce Jest or
   Playwright as decided (OQ-018).
6. An unanswered policy import (UOM tables, named actor) must compile
   as `GUARD_OPEN_POLICY` at the command layer, not as a guessed
   constant in a shared package.

## Forbidden later imports

| From | Must not import |
| --- | --- |
| Quality, Shipping, Sales, Procurement, Production | Inventory table internals |
| Adapter host | ORM models of orders, inspections, Ledger |
| Worker | A second posting API besides commands |
| Portal (if later) | `PortalPlaceOrder` in MVP |

## Must not decide here

- npm, pnpm, yarn
- NestJS modules or Nx library tags
- Barrel-file product conventions
