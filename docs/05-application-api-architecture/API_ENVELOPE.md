---
id: APP-ENV-001
title: API Envelope and Error-Shape Sketch
phase: 05-application-api-architecture
status: approved
version: 0.2.0
owners: [api-architect, solution-architect]
depends_on: [APP-CMD-001, APP-QRY-001, SM-EVT-001, APR-006, APR-007]
last_reviewed: 2026-09-06
approval: APR-007
supersedes: null
---

# API Envelope and Error-Shape Sketch

Logical request and result shape for Phase 05 commands and queries. This
is not an OpenAPI file, not an HTTP path list, and not a transport
choice (OQ-018). Quantity and money fields stay unnamed types
(`open: OQ-001`, `OQ-002`). Pagination stays `open: OQ-014`.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Command request (logical fields)

Every write from [COMMAND_CATALOGUE.md](COMMAND_CATALOGUE.md) carries:

| Field | Rule |
| --- | --- |
| `command` | Exact catalogue name |
| `idempotency_key` | Caller-supplied; INV-016 |
| `actor_role` | `ACT-*`; Temporary \* `(temporary)` → `GUARD_ACTOR` |
| `actor_identity` | Backend-authenticated identity; UI claim is not enough (INV-015) |
| `target` | Document, unit, or fact identity the command acts on |
| `payload` | Command-specific fields; quantity members stay `open: OQ-001` / `OQ-002` |

Transport headers versus body placement is not chosen. A queue or RPC
carrier must still present these fields to the owning module.

## Command result — accepted

| Field | Rule |
| --- | --- |
| `outcome` | `accepted` |
| `command` | Echo |
| `idempotency_key` | Echo |
| `fact_identity` | Posted document or movement identity |
| `source_state` / `target_state` | From the owning machine |
| `event` | Proposed name from the transition Event column |
| `replayed` | `true` when this is the first accepted result returned again |

No Ledger, Balance, or posted commercial document is implied by the
envelope itself. Those writes happen only inside the owning transaction
([ORCHESTRATION.md](ORCHESTRATION.md)).

## Command result — rejected

| Field | Rule |
| --- | --- |
| `outcome` | `rejected` |
| `command` | Echo |
| `idempotency_key` | Echo |
| `family` | One family from [EVENT_AND_REJECTION.md](../03-state-machines-invariants/EVENT_AND_REJECTION.md) |
| `open_item` | `OQ-*` or `workshop-commercial-practice` when family is `GUARD_OPEN_POLICY` |
| `message` | Human-readable; does not invent a numeric policy |
| `replayed` | `true` when the first result was already a rejection for this key |

Allowed families: `GUARD_OPEN_POLICY`, `GUARD_INVARIANT`,
`GUARD_ACTOR`, `GUARD_STATE`, `GUARD_IDEMPOTENT_DUP`, `GUARD_CONFLICT`,
`GUARD_PORTAL_MVP`.

A rejected command writes no posted fact. HTTP status numbers, problem+json,
and exception class names are not chosen (OQ-018).

## Query request and result

| Field | Rule |
| --- | --- |
| `query` | Exact name from [QUERY_CATALOGUE.md](QUERY_CATALOGUE.md) |
| `actor_role` / `actor_identity` | Backend-authenticated; customer isolation required (INV-015) |
| `scope` | Customer and, when answered, site (OQ-013) |
| `result` | Snapshot or projection; not a write |
| `stale_rebuild` | Allowed on genealogy reads (INV-019) |

List pages, cursors, and volume limits stay `open: OQ-014`. Decimal
display scale stays `open: OQ-001`, `OQ-002`.

## Event notice (after commit)

An event notice may be delivered to a later subscriber only after the
owning write and any commanded Inventory posting succeed. Fields:

| Field | Rule |
| --- | --- |
| `event` | Transition Event column |
| `fact_identity` | Posted identity |
| `occurred_at` | Commit time of the business transaction |
| `command` / `idempotency_key` | Trace to the accepted command |

Delivery mechanism stays
[BACKGROUND_AND_REALTIME.md](BACKGROUND_AND_REALTIME.md). Genealogy
results, Balance figures, and KPIs are not independently editable
events (INV-019).

## Must not appear

- OpenAPI, Swagger, or route tables as the contract
- `PortalPlaceOrder` success in MVP (`GUARD_PORTAL_MVP`)
- `EditGenealogy` or `AdjustBalance`
- Invented UOM JSON types
- NestJS DTO, Prisma payload, or Socket.IO packet shapes
