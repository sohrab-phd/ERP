---
id: APP-P06-HANDOFF-001
title: Phase 05 to Phase 06 Handoff
phase: 05-application-api-architecture
status: approved
version: 0.2.0
owners: [chief-solution-architect]
depends_on: [APP-CMD-001, APP-ENV-001, SM-SOD-001, ASM-018, APR-007]
last_reviewed: 2026-09-06
approval: APR-007
supersedes: null
---

# Phase 05 to Phase 06 Handoff

This is a Phase 05 design artifact. Phase 05 is approved as APR-007.
Phase 06 structure drafting is authorized by
[CURRENT_PHASE.md](../00-governance/CURRENT_PHASE.md). The APR-007 Git
checkpoint is complete at `00b30a3064027fd0584c35c5f479b04d087614a6`.
This handoff does not authorize application code or any package.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Inherit from Phase 05

- Named commands and write owners:
  [COMMAND_CATALOGUE.md](COMMAND_CATALOGUE.md)
- Read models and forbidden writes:
  [QUERY_CATALOGUE.md](QUERY_CATALOGUE.md)
- Module command direction:
  [MODULE_DEPENDENCY_MAP.md](MODULE_DEPENDENCY_MAP.md)
- One-transaction bundles and idempotency:
  [ORCHESTRATION.md](ORCHESTRATION.md)
- Logical envelope and rejection families:
  [API_ENVELOPE.md](API_ENVELOPE.md)
- Worker and live-notice labels:
  [BACKGROUND_AND_REALTIME.md](BACKGROUND_AND_REALTIME.md)
- Role pairs already recorded in
  [AUTHORIZATION_SOD.md](../03-state-machines-invariants/AUTHORIZATION_SOD.md)

## What Phase 06 may draft after Phase 05 approval

| Draft | Allowed after Phase 05 approval | Must stay open |
| --- | --- | --- |
| Threat model against these commands | Yes | Auth package (OQ-018) |
| Permission matrix on `ACT-*` and command names | Yes | Real people (OQ-019) |
| Customer isolation on queries and events | Yes (INV-015) | Portal exposure (OQ-010) |
| SoD on the sensitive pairs already listed | Yes | Named second person (OQ-019, OQ-005) |
| Audit event types for accepted/rejected commands | Yes | Retention days (OQ-016) |
| Session, MFA, or identity-provider product | No | OQ-018 |
| Application code or security middleware | No | Implementation unlock |

## Must not do after this handoff

- Close or answer OQ-001 through OQ-019 without a register update
- Accept ADR-0006, ADR-0007, ADR-0008, or any package
- Treat temporary identities as security approvers
- Write application code, OpenAPI files, or framework initialization
