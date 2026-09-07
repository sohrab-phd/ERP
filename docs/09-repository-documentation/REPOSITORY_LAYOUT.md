---
id: REPO-LAY-001
title: Future Repository Layout
phase: 09-repository-documentation
status: approved
version: 0.3.0
owners: [solution-architect]
depends_on: [APP-MOD-001, GOV-DOMAIN-001, DEP-TOPO-001, APR-010, APR-011]
last_reviewed: 2026-09-07
approval: APR-011
supersedes: null
---

# Future Repository Layout

Logical later paths that match APP-MOD-001. These names are **labels**.
The folders are not created in this phase.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Already present (architecture authority)

| Path | Role |
| --- | --- |
| `docs/` | Approved architecture Markdown |
| `.cursor/` | Cursor controls; not application source |

## Later application tree (not created now)

| Label | Maps to | Must not |
| --- | --- | --- |
| `mod-sales` | BC-SALES | Write Ledger/Balance |
| `mod-procurement` | BC-PROCUREMENT | Write Ledger/Balance |
| `mod-inventory-posting` | Inventory Posting / `ACT-IPS` | Depend on Sales internals |
| `mod-production` | BC-PRODUCTION | Write Ledger/Balance tables |
| `mod-quality` | BC-QUALITY | Write Ledger/Balance |
| `mod-shipping` | BC-SHIPPING | Write Ledger/Balance |
| `mod-finance-lite` | BC-FINANCE-LITE | Become legal GL |
| `mod-identity-audit` | BC-IDENTITY / BC-AUDIT | Write stock tables |
| `mod-reporting` | BC-REPORTING | Write source facts |
| `mod-integration` | BC-INTEGRATION / `ADP-*` | Write orders, inspections, Ledger |
| `mod-master-data` | BC-MASTER-DATA | Invent UOM (OQ-001) |
| `kern-command` | Shared command/idempotency/rejection kernel | Become a chosen library |
| `host-backend` | Command/query backend; `ZONE-BACKEND` | Trust `ZONE-UI` |
| `host-worker` | APP-BG-001 kinds; `ZONE-WORKER` | Second stock writer |
| `host-adapter` | Adapter host; `ZONE-DEVICE` / `ZONE-EXPORT` | Direct table writes; split DATA-TX-001 |
| `ui-operator` | Shop-floor / office UI; `ZONE-UI` | Authorize by UI-claimed role |
| `test-later` | Later verification tree | Choose Jest/Playwright (OQ-018) |

`BC-PORTAL` remains deferred (OQ-010). No `mod-portal` write path in
MVP. `ADP-CUTOVER` later lives under `host-adapter` and still rejects
until OQ-015.

Physical folder product (`apps/` vs `packages/` vs one `src/`) stays
OQ-018 / ADR-0006. This layout does not pick a monorepo tool.

## Must not exist in this repository now

- `src/`, `apps/`, `packages/` application trees
- `package.json`, `tsconfig.json`, lockfiles
- Dockerfiles, compose files, CI workflows
- `.env` files or device secrets (`HH-SECRET`)

## Must not decide here

- Creating any of the folders above
- npm workspaces, Nx, Turborepo, or pnpm
- Separate deployable services versus one process (ADR-0006)
