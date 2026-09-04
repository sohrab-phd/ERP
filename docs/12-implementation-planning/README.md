---
id: PHASE-12
title: Implementation Planning
phase: 12-implementation-planning
status: planned
version: 0.1.0
owners: [chief-solution-architect, delivery-lead]
depends_on: [PHASE-11]
last_reviewed: 2026-09-02
approval: null
supersedes: null
---

# Phase 12 — Implementation Planning

## Purpose

Translate the fully approved architecture into sequenced, reviewable work
without reopening design decisions during coding.

## Planned artifacts

- Implementation readiness checklist
- Dependency-ordered roadmap and vertical slices
- Work items linked to requirements, decisions, invariants, and tests
- Authorized technical spikes and acceptance criteria
- Migration, cutover, training, rollout, and support plans
- Final implementation authorization record

## Entry criteria

- Integrated Architecture Validation is approved.

## Exit criteria

- Every implementation item references an approved design baseline.
- Scope, ordering, dependencies, evidence, rollback, and owners are explicit.
- No blocking question or ADR remains in authorized scope.
- The user explicitly signs the implementation authorization.

Until this gate is approved, `IMPLEMENTATION_AUTHORIZED` remains `false`.
