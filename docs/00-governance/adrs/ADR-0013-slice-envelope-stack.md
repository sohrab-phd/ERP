---
id: ADR-0013
title: SLICE-ENVELOPE stack and physical baseline
phase: 12-implementation-planning
status: accepted
version: 0.1.0
owners: [chief-solution-architect]
depends_on: [ADR-0001, ADR-0006, ADR-0007, ADR-0011, ADR-0012, REPO-LAY-001, REPO-DEP-001]
last_reviewed: 2026-10-04
approval: null
---

# ADR-0013 — SLICE-ENVELOPE technical stack

Accepted as a delegated technical engineering decision under the Project Owner's
2026-10-04 trusted-agent mandate (ADR-0012). This is not human baseline approval,
an APR/CHK, or implementation authorization. Gate false, baseline null, unlock
absent. Independent review records identify remaining findings before readiness.

## Problem

Accepted Node.js/TypeScript, Modular Monolith and PostgreSQL specify the platform,
but earlier phases deliberately deferred framework/packages/folders/test runner.
The first bounded foundation must have a reproducible professional design
without inventory posting or another architecture cycle.

## Decision

Use Node24.21.0 LTS, its bundled npm11.19.0 native workspaces, TypeScript6.0.3 strict
ESM/NodeNext, PostgreSQL18.6, direct pg8.23.1 parameterized SQL. Exact type/lint/
format pins and primary-source links in [TECHNICAL_FREEZE.md](../../12-implementation-planning/TECHNICAL_FREEZE.md).
TypeScript7.0.2 exists, but current TS-ESLint8.71.0 supports <6.1; choose6.0.3
for a supported single compiler/linter integration, not experimental mixing.

node:http composition hosts health only. Command/query execution is in-process
and transport independent, tested with synthetic handlers that never register
in production. Do not add a backend framework merely to expose health. Identity/
real business HTTP transport can justify a framework later without changing
kernel/transaction ports.

Native npm workspaces private root; apps/backend host and packages/shared-kernel
public contract. One deployment, no Nx/Turborepo/Redis/broker/Docker prerequisite.
Map logical REPO-LAY-001 labels to physical tree; preserve module ownership and
dependency rules. Shared kernel uses stdlib/types/ports, no pg/HTTP/domain import.
Only backend PG adapter owns foundation outcome/audit SQL.

Ordered authored SQL with small explicit pg migration runner: checksum ledger,
session advisory lock, per-file transaction+metadata; no ORM generator or stored
posting orchestration. Runtime DML role cannot migrate, delete outcomes/audit or
create databases/roles. No domain seed. Actual SQL is created only after unlock.

Stable node:test on compiled JS, strict TypeScript, ESLint typed rules, Prettier,
dependency-direction check, real isolated PostgreSQL integration tests with
known synthetic facts/concurrency/connection-cut fixtures. No SQLite/mock proof
of PG transaction correctness, invented coverage target or TEST-* catalogue.

Typed explicit bounded admission/canonical JSON validation; structured redacted
JSON logs; no extra validation/logger infrastructure in foundation. Commands
receive current trusted execution context; no client identity/role shortcut.
No auth-provider/session/password implementation yet.

ADR-0011 determines UUID scoped-key/principal/command/target/material bindings,
terminal outcomes, advisory-lock serialization, accepted/rejected replay,
savepoint/audit/COMMIT uncertainty and recovery fences. One PG client per command,
application-owned READ COMMITTED transaction; business slices add owner locks
and constraints without cross-owner persistence writes.

[Physical design](../../12-implementation-planning/SLICE_ENVELOPE_PHYSICAL_DESIGN.md)
is the exact tree, schema, script/command/write scope, local developer workflow,
CI minimum, acceptance intents and DoD. First authorization must cite matching
reviewed bytes and paths. This ADR creates none of these product artifacts.

## Alternatives and consequences

- NestJS/DI and ORM add lifecycle/abstraction surface before business routes;
  direct ports/SQL are easier to inspect against transaction bundles. They are
  not permanently forbidden, but later adoption needs demonstrated value.
- pnpm/Nx/Turborepo are not necessary for two workspaces; npm bundled version
  avoids a second bootstrap tool and supplies one deterministic root lock.
- Jest/Vitest/TS runtime transpilers duplicate built-in runner/compiler concerns.
  Browser testing remains later UI slice.
- Native PostgreSQL locks/constraints and durable outcome/audit avoid distributed
  cache/lease consistency. No external effect means no first-slice outbox.
- Initial exact version pins improve reproducibility; reviewed supported security
  updates remain necessary. Unsupported/known-vulnerable pins are not preserved.
- Custom boundary validators are small domain-specific parsers with explicit
  edge-case acceptance tests, not an open-ended validation framework.
- Local PostgreSQL installation/ordinary credentials are developer environment
  prerequisites; production hosting, backup retention/vendor, UAT/go-live inputs
  are not foundation design blockers.

## Reconciliation and change triggers

REPO-LAY-001 declares its paths labels and apps/packages undecided; this ADR makes
the physical selection rather than contradicting an accepted folder. Prior
"must not decide here" statements apply to those historical phase artifacts;
this authorized ADR supplies the later decision. APP-MOD-001 owner rules,
REPO-DEP-001 ports, SEC-ID-001 personal accounts, SEC-AUD-001 AUD-* taxonomy,
QA-STRAT-001 evidence levels and DEP-TOPO-001 deployment deferrals remain.

Reopen for major/tool API change, HTTP/business exposure, new persistence writer,
framework/ORM, external side effect, changed admission/idempotency contract,
new module/dependency direction or widened first grant. Patch pin updates with
compatibility/security evidence require documented review, not human implementation
approval unless grant conditions require it.

No factory rule, OQ answer/status, human approval or implementation state changes.
