---
id: REPO-DEP-001
title: Dependency and Import Rules
phase: 09-repository-documentation
status: approved
version: 0.4.0
owners: [solution-architect]
depends_on: [APR-042, APP-MOD-001, REPO-LAY-001, DATA-TX-001, APR-010, APR-011]
last_reviewed: 2026-10-25
approval: APR-011 historical rules; APR-042 bounded I2 owner-port reconciliation
supersedes: null
---

# Dependency and Import Rules

## Current bounded receiving dependency — APR-042

[Owner-authorized I2 implementation](../00-governance/approved-baselines/APR-042-i2-implementation-authorization.md)
uses existing Procurement, Inventory, Identity/envelope and Genealogy public ports.
Composition injects Procurement immutable source reads into the Inventory intake
owner and Inventory identity/typed-origin reads into authorized projections. No
cross-module private import, stock writer or nested command is introduced.

The [static boundary checker](../../tools/build/check-boundaries.mjs) restricts
new receiving source SQL to its Procurement adapter and new origin SQL to its
Inventory adapter; the only legacy receipt SQL exception is a SELECT-only code
conflict check in the Procurement receiving adapter. Existing Ledger/Balance/Unit
write ownership checks remain intact. Restricted source-claim trigger and read-only
Inventory stock-link predicate follow the accepted I2 design in additive0018.

Historical pre-implementation/OQ statements below are not the effective work gate;
[CURRENT_PHASE](../00-governance/CURRENT_PHASE.md) and APR-042 control authority.
This update grants no broader framework/module/dependency or later-slice authority.

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
7. DATA-TX-001 bundles must not be split across modules or hosts
   (QA-SCN-BUNDLE).
8. `host-worker` retries the same `idempotency_key`. Worker process
   identity is not the commander (SV-009).
9. No module exposes `EditGenealogy`, `AdjustBalance`, or MVP
   `PortalPlaceOrder`.

## Forbidden later imports

| From | Must not import |
| --- | --- |
| Quality, Shipping, Sales, Procurement, Production | Inventory table internals |
| Adapter host | ORM models of orders, inspections, Ledger |
| Worker | A second posting API besides commands |
| Portal (if later) | `PortalPlaceOrder` in MVP |
| Finance-Lite | Legal GL as a write owner (ASM-010) |
| Any host or UI | A Balance-only or Genealogy-edit API |

## Must not decide here

- npm, pnpm, yarn
- NestJS modules or Nx library tags
- Barrel-file product conventions
