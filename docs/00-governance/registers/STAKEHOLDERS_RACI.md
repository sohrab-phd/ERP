---
id: GOV-RACI-001
title: Stakeholder and RACI Register
phase: 00-governance
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [GOV-CHARTER-001]
last_reviewed: 2026-09-04
approval: APR-002
supersedes: null
---

# Stakeholder and RACI Register

Named people are not yet supplied. Role assignments are provisional and must be
confirmed during Phase 02.

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

## Open action

Replace role-only ownership with named people, delegates, availability, and
approval authority before Phase 02 exits.
