---
id: VAL-TRACE-001
title: Requirements and Traceability Coverage
phase: 11-architecture-validation
status: in_review
version: 0.1.0
owners: [requirements-owner, qa-architect]
depends_on: [GOV-TRACE-001, APR-012, ASM-024]
last_reviewed: 2026-09-07
approval: null
supersedes: null
---

# Requirements and Traceability Coverage

Coverage of REQ-OBJ rows as **structure**, not as a `TEST-*` catalogue
(FIND-021 / FIND-028).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Objective coverage

| Objective | Design chain present | Still open |
| --- | --- | --- |
| REQ-OBJ-001 Unified operational truth | Capabilities, INV-013/014/018/020, reporting isolation, `mod-reporting` read-only | Workshop REQ-* decomposition; OQ-010 portal |
| REQ-OBJ-002 Correct inventory | INV-001–004, INV-016–017, `CONF-IPS` / `CONF-BUNDLE`, adapters command | OQ-001, OQ-002, OQ-008, OQ-017 |
| REQ-OBJ-003 Bidirectional genealogy | INV-006–009, INV-019, rebuild-only, `CONF-FORBID` | OQ-003, OQ-004, OQ-009 |
| REQ-OBJ-004 Controlled lifecycles | INV-005, INV-010–016, SoD intents, `GUARD_OPEN_POLICY` | OQ-005, OQ-006, OQ-007 |
| REQ-OBJ-005 Maintainable Node.js/TypeScript | ADR-0001; `ZONE-*` / `mod-*` / `AG-*` labels | OQ-018 products; OQ-019 names |

Mandatory implementation-authorization links remain **future**. Phase 11
does not mint missing workshop REQ-* or TEST-* IDs.

## Coverage rule

An objective is **structure-covered** when it has capability, invariant,
command/query, security, verification-intent, adapter/repo, and agent
labels. It is **not workshop-closed** while related `OQ-*` are open.

## Must not decide here

- A `TEST-*` ID catalogue
- Numeric UOM or tolerance oracles
- Named UAT evidence owners
