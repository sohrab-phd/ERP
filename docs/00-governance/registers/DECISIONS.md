---
id: GOV-DECISIONS-001
title: Decision Register
phase: 00-governance
status: approved
version: 0.3.0
owners: [chief-solution-architect]
depends_on: [GOV-GATES-001, OQ-018]
last_reviewed: 2026-09-15
approval: APR-003
supersedes: null
---

# Decision Register

Only explicit user/business approvals or accepted ADRs are decisions. Document
recommendations remain proposals.

APR-002 approved this register's Phase 00 seed version. APR-003 approves the
current version as accurate Phase 01 assimilation evidence. Each ADR retains its
own decision status; APR-003 did not accept ADR-0006 through ADR-0008. OQ-018 team answers
recorded `2026-09-15` accept ADR-0006 and ADR-0007. ADR-0008 and
framework/package ADRs remain proposed.

## ADR-0001 — Backend technology family

- Status: accepted
- Decision: Backend implementation will use Node.js + TypeScript rather than
  .NET, ASP.NET Core, or C#.
- Authority: Explicit project instruction
- Consequence: Framework, DI, authentication, real-time, worker, persistence,
  decimal, testing, deployment, and observability choices require Node-compatible
  evaluation.
- Does not decide: NestJS, ORM, package versions, or detailed architecture

## ADR-0002 — Authoritative documentation language

- Status: accepted
- Decision: Architecture documents use English with canonical Persian business
  terms maintained in the Business Glossary.
- Authority: User approval on 2026-09-02

## ADR-0003 — Phase approval cadence

- Status: accepted
- Decision: Every phase stops for explicit user approval.
- Authority: User approval on 2026-09-02

## ADR-0004 — Architecture checkpoint mechanism

- Status: accepted
- Decision: Use local Git checkpoints after each approved phase.
- Authority: User approval on 2026-09-02
- Constraint: No checkpoint is created before its phase is approved.

## ADR-0005 — Premature implementation safeguard

- Status: accepted
- Decision: Add an always-on project rule, then prepare, test, and enable a
  documentation-only write-gating hook during Governance Foundation setup.
- Authority: User approval on 2026-09-02
- Limitation: Cursor controls are not an operating-system security boundary.

## ADR-0006 — Architecture style

- Status: accepted
- Decision: Modular Monolith for the initial operational platform: one
  deployable application with bounded modules and the one-writer Inventory
  Ledger model. Kubernetes, Kafka, RabbitMQ, Redis, and service-per-domain
  deployment are not required for MVP unless a later evidence-based
  approval says otherwise.
- Authority: OQ-018 team answer recorded `2026-09-15`
- Consequence: Module ownership stays explicit; uncontrolled cross-module
  table access is rejected.
- Not decided: NestJS or any other framework, deployment units, or future
  split criteria

## ADR-0007 — PostgreSQL data platform

- Status: accepted
- Decision: PostgreSQL is the authoritative transactional data platform and
  system of record, including the Inventory Ledger.
- Authority: OQ-018 team answer recorded `2026-09-15` (OQ-017 uses explicit
  PostgreSQL transactions and locks as the posting style)
- Consequence: Exact decimal, constraints, locks, and rebuilds run against
  PostgreSQL. ORM must not become a second stock writer.
- Not decided: physical schema, ORM product, PostgreSQL version, hosting,
  HA, backup vendor, or stored-function posting (functions need a later
  ADR plus spike)

## ADR-0008 — MVP deployment topology

- Status: proposed
- Candidate: a controlled single-host topology using Ubuntu, Docker Compose,
  Nginx, API, durable Worker, web UI, and the selected data platform
- Rationale to evaluate: modest-scale and small-team assumptions with bounded
  operational complexity
- Alternatives required: evidence-based topology comparison against capacity,
  security, recovery, support, and availability requirements
- Open dependencies: ASM-002, ASM-007, ASM-011, OQ-014 residual counts,
  OQ-016 retention product, OQ-018 (explicitly did not freeze Docker)
- Not decided: container images, network layout, host count, cloud/on-premises
  location, HA, CI/CD, secrets, backup implementation, or deployment tooling

## Proposed decisions requiring future ADRs

- NestJS and Node.js version
- ORM / Prisma evaluation (must not be the Inventory posting kernel)
- Decimal TypeScript representation (PostgreSQL `NUMERIC` intended)
- Authentication/session/MFA packages
- Frontend architecture and framework (React/Socket.IO remain candidates)
- Durable worker scheduler
- Test runner, test infrastructure, and observability baseline
- MVP portal document list and later order-write phase (OQ-010 answered
  visibility-only; order write still deferred)
- ADR-0008 Docker/Nginx topology
