---
id: DATA-P05-HANDOFF-001
title: Phase 04 to Phase 05 Handoff
phase: 04-database-architecture
status: approved
version: 0.2.0
owners: [chief-solution-architect]
depends_on: [DATA-LOGICAL-001, DATA-ATTR-001, DATA-ENF-001, ASM-017, APR-006]
last_reviewed: 2026-09-06
approval: APR-006
supersedes: null
---

# Phase 04 to Phase 05 Handoff

This is a Phase 04 design artifact. Phase 04 is approved as APR-006.
Phase 05 structure drafting is authorized by
[CURRENT_PHASE.md](../00-governance/CURRENT_PHASE.md). The APR-006 Git
checkpoint is complete at `87f9f10442d58fbd224dce09f46c862eb8707e8f`.
This handoff does not authorize application code or any package.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Inherit from Phase 04

- Logical entities and relationships:
  [LOGICAL_MODEL.md](LOGICAL_MODEL.md)
- Named attributes (no types):
  [LOGICAL_ATTRIBUTE_CATALOGUE.md](LOGICAL_ATTRIBUTE_CATALOGUE.md)
- Posting kernel (mechanism open):
  [POSTING_KERNEL.md](POSTING_KERNEL.md)
- Transaction boundaries:
  [TRANSACTION_AND_IDEMPOTENCY.md](TRANSACTION_AND_IDEMPOTENCY.md)
- Enforcement assignment:
  [ENFORCEMENT_ASSIGNMENT.md](ENFORCEMENT_ASSIGNMENT.md)

## What Phase 05 may draft after Phase 04 approval

Draft application and API **structure** only. Leave every OQ-owned
number, type, and package as an open extension. Do not initialize a
framework or write production handlers.

| Draft | Allowed after Phase 04 approval | Must stay open |
| --- | --- | --- |
| Command list from SM-TRANS-001 | Yes, as proposed operations | Request JSON types that need UOM (OQ-001) |
| One write owner per command | Yes | Multi-site tenancy (OQ-013) |
| Idempotency and rejection families | Yes (INV-016, SM-EVT-001) | Broker/outbox package (OQ-018) |
| Portal order endpoints | Reject in MVP (INV-020) | Later portal (OQ-010) |
| Framework, ORM, OpenAPI stack | No | OQ-018 |
| Executable controllers or schemas | No | Implementation unlock |

## Must not do after this handoff

- Close or answer OQ-001 through OQ-019 without a register update
- Accept ADR-0006, ADR-0007, ADR-0008, or any package
- Write application code, OpenAPI files, or framework initialization
