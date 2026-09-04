---
id: GOV-CHARTER-001
title: Architecture Charter
phase: 00-governance
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [ASM-REPORT-001]
last_reviewed: 2026-09-04
approval: APR-002
supersedes: null
---

# Architecture Charter

## Mission

Fully engineer, validate, and approve the Foolad Navardkaran ERP/MES architecture
before application implementation begins.

## Governing principles

1. Architecture precedes implementation.
2. Business invariants and data integrity take priority over coding speed.
3. No AI agent may silently resolve a material ambiguity.
4. Confirmed facts, assumptions, proposals, decisions, risks, and questions are
   distinct record types.
5. Important concepts have one canonical definition and one write owner.
6. Approved decisions remain traceable to requirements, controls, and tests.
7. Every phase is independently reviewed, reconciled, and explicitly approved.
8. Material changes reopen affected downstream artifacts.
9. The design must remain operable and maintainable by the expected team.
10. Complexity requires current evidence, not hypothetical future need.

## Authority

- The project sponsor approves scope, priority, funding-sensitive trade-offs, and
  phase gates.
- Business process owners approve operational rules and responsibilities.
- The Chief Solution Architect coordinates artifacts, dependencies, conflicts,
  ADRs, and completeness.
- Domain specialists propose and review within their scope.
- The independent reviewer challenges the integrated design.
- AI agents analyze and draft; they do not grant approval or invent business
  policy.

## Current technology constraint

The backend must use Node.js + TypeScript. Frameworks and libraries, including
NestJS, remain subject to evidence-based ADRs. Legacy .NET, ASP.NET Core, C#, and
SignalR references are comparative or migration inputs, not implementation
authorization.

## Prohibited before final authorization

- Application source code or scaffolding
- Database migrations or executable schema
- API endpoint or UI implementation
- Package installation or package manifests
- CI/CD, Docker, or deployment implementation
- Production-oriented technical spikes not separately authorized
- Any implementation commit

Architecture documentation, project-local architecture controls, and explicitly
approved disposable evidence experiments are not application implementation.
Any experiment must have scope, disposal criteria, and an ADR question.
