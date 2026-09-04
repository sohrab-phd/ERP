---
id: GOV-DECISIONS-001
title: Decision Register
phase: 00-governance
status: approved
version: 0.2.2
owners: [chief-solution-architect]
depends_on: [GOV-GATES-001]
last_reviewed: 2026-09-04
approval: APR-003
supersedes: null
---

# Decision Register

Only explicit user/business approvals or accepted ADRs are decisions. Document
recommendations remain proposals.

APR-002 approved this register's Phase 00 seed version. APR-003 approves the
current version as accurate Phase 01 assimilation evidence. Each ADR retains its
own decision status; APR-003 does not accept proposed ADR-0006 through ADR-0008
or any detailed technology selection.

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

- Status: proposed
- Candidate: Modular Monolith for the initial operational platform
- Rationale to evaluate: small-team maintainability, one-writer ownership,
  transactional consistency, and avoiding unjustified distributed operations
- Alternatives required: structured monolith variants and any evidence-backed
  distributed alternative
- Open dependency: OQ-018
- Not decided: module boundaries, framework, deployment units, or future split
  criteria

## ADR-0007 — PostgreSQL data platform

- Status: proposed
- Candidate: PostgreSQL as the authoritative transactional data platform
- Rationale to evaluate: transaction integrity, concurrency control, exact
  decimals, constraints, recursive genealogy queries, and operational maturity
- Alternatives required: evidence-based data-platform comparison against
  approved integrity, recovery, skill, and operating requirements
- Open dependencies: OQ-014, OQ-016, OQ-017, OQ-018
- Not decided: physical schema, ORM, posting mechanism, hosting, HA, backup
  topology, or version

## ADR-0008 — MVP deployment topology

- Status: proposed
- Candidate: a controlled single-host topology using Ubuntu, Docker Compose,
  Nginx, API, durable Worker, web UI, and the selected data platform
- Rationale to evaluate: modest-scale and small-team assumptions with bounded
  operational complexity
- Alternatives required: evidence-based topology comparison against capacity,
  security, recovery, support, and availability requirements
- Open dependencies: ASM-002, ASM-007, ASM-011, OQ-014, OQ-016, OQ-018
- Not decided: container images, network layout, host count, cloud/on-premises
  location, HA, CI/CD, secrets, backup implementation, or deployment tooling

## Proposed decisions requiring future ADRs

- NestJS and Node.js version
- Persistence/Inventory Posting mechanism
- Decimal representation and serialization
- Authentication/session/MFA packages
- Frontend architecture and framework
- Durable worker scheduler
- Test runner, test infrastructure, and observability baseline
- Portal MVP phase and external exposure
