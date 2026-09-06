---
id: QA-P08-HANDOFF-001
title: Phase 07 to Phase 08 Handoff
phase: 07-testing-quality-architecture
status: approved
version: 0.2.0
owners: [chief-solution-architect]
depends_on: [QA-GATE-001, QA-NFR-001, ASM-020, APR-009]
last_reviewed: 2026-09-06
approval: APR-009
supersedes: null
---

# Phase 07 to Phase 08 Handoff

This is a Phase 07 design artifact. Phase 07 is approved as APR-009.
Phase 08 structure drafting is authorized by
[CURRENT_PHASE.md](../00-governance/CURRENT_PHASE.md). The APR-009 Git
checkpoint is still pending. This handoff does not authorize adapters,
deployment files, or any package.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Inherit from Phase 07

- Levels and standing rules:
  [TEST_STRATEGY.md](TEST_STRATEGY.md)
- Invariant and security intent map:
  [VERIFICATION_TRACE.md](VERIFICATION_TRACE.md)
- Named golden-path and rejection scenarios:
  [SCENARIO_CATALOGUE.md](SCENARIO_CATALOGUE.md)
- Kernel properties:
  [PROPERTY_AND_KERNEL_INTENTS.md](PROPERTY_AND_KERNEL_INTENTS.md)
- Recovery and UAT labels:
  [NFR_AND_UAT.md](NFR_AND_UAT.md)
- Later evidence kinds and `QG-*` labels:
  [QUALITY_GATES.md](QUALITY_GATES.md)

## What Phase 08 may draft after Phase 07 approval

| Draft | Allowed after Phase 07 approval | Must stay open |
| --- | --- | --- |
| Integration catalogue as named adapters/labels | Yes | Product/protocol (OQ-011, OQ-012, OQ-018) |
| Weighbridge / accounting / portal boundaries | Yes | Device key, legal GL product, portal MVP (OQ-010) |
| Environment topology labels | Yes | Hosting/Docker (OQ-018, ADR-0008) |
| Logging/metrics/alerting kinds | Yes | Observability product |
| Backup/restore procedure labels | Yes | RPO/RTO minutes (OQ-016) |
| Deployment manifests, Docker, CI | No | Implementation unlock |
| Choosing NestJS, PostgreSQL, or a runner | No | OQ-018 |

## Must not do after this handoff

- Close or answer OQ-001 through OQ-019 without a register update
- Accept ADR-0006, ADR-0007, ADR-0008, or any package
- Treat temporary identities as operations approvers
- Write application code, deployment files, or framework initialization
