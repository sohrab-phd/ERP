---
id: GOV-DECISIONS-001
title: Decision Register
phase: 00-governance
status: approved
version: 0.1.0
owners: [chief-solution-architect]
depends_on: [GOV-GATES-001]
last_reviewed: 2026-09-04
approval: APR-002
supersedes: null
---

# Decision Register

Only explicit user/business approvals or accepted ADRs are decisions. Document
recommendations remain proposals.

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

## Proposed decisions requiring future ADRs

- Modular Monolith versus alternatives
- NestJS and Node.js version
- Persistence/Inventory Posting mechanism
- Decimal representation and serialization
- Authentication/session/MFA packages
- PostgreSQL-backed worker scheduler
- Test runner and observability baseline
- Portal MVP phase and external exposure
