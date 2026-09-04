---
id: GOV-TRACE-001
title: Requirements Traceability Matrix
phase: 00-governance
status: approved
version: 0.1.0
owners: [requirements-owner, qa-architect]
depends_on: [SRC-001, SRC-002]
last_reviewed: 2026-09-04
approval: APR-002
supersedes: null
---

# Requirements Traceability Matrix

## Required trace chain

`Objective → Requirement → Business Rule/Invariant → Process/State → Domain/Data/API/Security Control → Verification → Risk/ADR`

Traceability is bidirectional. No mandatory requirement, invariant, interface, or
test may remain orphaned at implementation authorization.

## Initial objectives

### REQ-OBJ-001 — Unified operational truth

- Source: SRC-001
- Scope: Sales through delivery and finance-lite
- Current design: ASM-REPORT-001
- Risks: RISK-001, RISK-002, RISK-013
- Status: proposed; detailed decomposition belongs to Phase 02

### REQ-OBJ-002 — Correct inventory under concurrency

- Source: SRC-001
- Domains: Inventory, Sales, Production
- Open questions: OQ-001, OQ-002, OQ-008, OQ-017
- Risks: RISK-003, RISK-004
- Status: proposed; invariants belong to Phase 03

### REQ-OBJ-003 — Bidirectional material genealogy

- Source: SRC-001, SRC-002
- Domains: Procurement, Inventory, Production, Quality, Shipping
- Open questions: OQ-003, OQ-004, OQ-009
- Risk: RISK-005
- Status: proposed

### REQ-OBJ-004 — Controlled and auditable business lifecycles

- Source: SRC-001, SRC-002
- Domains: All transactional domains
- Open questions: OQ-005, OQ-006, OQ-007
- Risks: RISK-006, RISK-008
- Status: proposed

### REQ-OBJ-005 — Maintainable Node.js/TypeScript platform

- Source: Explicit technology override
- Decision: ADR-0001
- Open question: OQ-018
- Risks: RISK-004, RISK-009, RISK-012
- Status: confirmed objective; solution undecided

## Coverage policy

Phase 02 assigns requirement IDs. Phases 03–08 extend each row with canonical
rules, states, entities, interfaces, controls, and tests. Phase 11 rejects any
in-scope row with a missing mandatory link.
