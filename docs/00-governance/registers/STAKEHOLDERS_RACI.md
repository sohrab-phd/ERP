---
id: GOV-RACI-001
title: Stakeholder and RACI Register
phase: 00-governance
status: approved
version: 0.2.1
owners: [project-sponsor, chief-solution-architect]
depends_on: [GOV-CHARTER-001, OQ-019, ASM-013]
last_reviewed: 2026-09-06
approval: APR-004
supersedes: null
---

# Stakeholder and RACI Register

APR-002 approved the role-only seed. Phase 02 now records **temporary** named
placeholders authorized by the Project Owner so design may continue. They are
not confirmed people. The authoritative temporary roster is
[WORKSHOP_ROSTER.md](../../02-domain-business-architecture/WORKSHOP_ROSTER.md).

## Governance roles

- Project Sponsor — accountable for project scope and phase approval
- Chief Solution Architect — responsible for coordination, consistency, ADRs,
  traceability, and gate preparation
- Business Process Owner — accountable for cross-functional operating model
- Domain Process Owners — accountable for Sales, Procurement, Inventory,
  Production, Quality, Shipping, and Finance-Lite policy
- Data Architect — responsible for canonical data and integrity architecture
- Security Architect — responsible for identity, authorization, isolation, audit,
  and threat controls
- QA Architect — responsible for verification architecture and evidence
- Integration Architect — responsible for external boundaries and contracts
- Operations Owner — accountable for deployment, recovery, monitoring, and support
- Independent Reviewer — responsible for adversarial review; not artifact author
- Data Steward — responsible for master-data quality and canonical terminology

## Provisional responsibility rules

- Business policy: Domain Process Owner accountable; architect facilitates.
- Cross-domain conflict: Chief Solution Architect responsible; affected owners
  consulted; sponsor decides unresolved scope/trade-off issues.
- Architecture decision: Owning architect responsible; Chief Solution Architect
  accountable; specialists consulted; sponsor approves business/cost impacts.
- Phase gate: Chief Solution Architect prepares; independent reviewer verifies;
  user/project sponsor explicitly approves.
- Application implementation authorization: Project sponsor and Chief Solution
  Architect jointly accountable after all required owner sign-offs.

## Temporary named assignments

All workshop roles currently map to Temporary \* (temporary) identities in
[WORKSHOP_ROSTER.md](../../02-domain-business-architecture/WORKSHOP_ROSTER.md).
These assignments do not confer real approval authority. Workshop execution and
owner-signed decisions remain blocked by OQ-019 until real names replace them.

## Open action

Replace every `(temporary)` roster row with a real full name, delegate or
`none`, attendance/availability, and approval scope. OQ-019 stays open.
