---
id: PHASE-05
title: Application and API Architecture
phase: 05-application-api-architecture
status: in_review
version: 0.2.0
owners: [solution-architect, api-architect]
depends_on: [PHASE-04, APR-006, DATA-P05-HANDOFF-001]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# Phase 05 — Application & API Architecture

## Gate

Gate status: `ACTIVE_IN_REVIEW`

Lifecycle: `in_review`

Approval: `null`

Phase 04 is approved as APR-006. Structure drafting is authorized. The
APR-005 and APR-006 Git checkpoints are pending. Framework and package
choices remain OQ-018. Node.js + TypeScript (ADR-0001) is the only
accepted technology ADR.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Purpose

Define the Node.js/TypeScript application architecture, module contracts, API
contracts, transactional orchestration, background work, and real-time behavior.

## Planned artifacts

- [x] [Command catalogue](COMMAND_CATALOGUE.md)
- [x] [Query catalogue](QUERY_CATALOGUE.md)
- [x] [Module dependency map](MODULE_DEPENDENCY_MAP.md)
- [x] [Orchestration and idempotency](ORCHESTRATION.md)
- [ ] API envelope and error-shape sketch (no OpenAPI file)
- [ ] Framework/package ADRs — **not** in this draft; OQ-018
- [ ] Worker/Outbox/real-time designs — proposed labels only; no package
- [ ] Self-check, independent review, reconciliation, gate checklist

## Entry criteria

- [x] Phase 04 is approved as APR-006.
- [ ] Phase 04 Git checkpoint — pending; does not block structure drafting.

## How this phase works while answers are still arriving

Draft command, query, and module structure first. Leave request JSON
types that need UOM, and every framework/package, as open extensions.
Do not initialize NestJS, Prisma, or any other stack. Do not write
controllers.

## Exit criteria

- Node.js framework choices are justified rather than assumed **or**
  still explicit open extensions with OQ-018.
- No module bypasses canonical ownership or transaction rules.
- API and event contracts trace to states, invariants, and authorization.
- The user explicitly approves Phase 05.

`IMPLEMENTATION_AUTHORIZED` remains `false`.
