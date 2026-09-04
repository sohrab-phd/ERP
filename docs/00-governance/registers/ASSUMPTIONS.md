---
id: GOV-ASSUMPTIONS-001
title: Assumption Register
phase: 00-governance
status: approved
version: 0.2.2
owners: [chief-solution-architect]
depends_on: [SRC-001, ASM-REPORT-001]
last_reviewed: 2026-09-04
approval: APR-003
supersedes: null
---

# Assumption Register

Every assumption requires an owner, validation method, and affected artifacts.
None of these entries is a confirmed business decision.

APR-002 approved this register's Phase 00 seed version. APR-003 approves the
current version as accurate Phase 01 assimilation evidence. Individual
assumptions retain their recorded validation status; this artifact approval does
not confirm them as business facts.

## ASM-001 — Single legal entity and principal site

- Status: open
- Owner: Project sponsor
- Validation: organization/site workshop
- Affects: numbering, tenancy, warehouse, reporting, deployment
- Related question: OQ-013

## ASM-002 — Modest user scale

- Status: open
- Statement: 15–25 concurrent and fewer than 100 total users
- Owner: Project sponsor
- Validation: named user/role and growth forecast
- Affects: deployment, performance, licensing

## ASM-003 — Weight is the primary inventory measure

- Status: open
- Owner: Inventory process owner
- Validation: UOM matrix and representative records
- Affects: inventory, pricing, production, API contracts
- Related questions: OQ-001, OQ-002

## ASM-004 — Batch-level finished-product tracking is normal

- Status: open
- Owner: Production and Quality owners
- Validation: product/customer/regulatory matrix
- Affects: identity, labels, genealogy, data volume
- Related question: OQ-004

## ASM-005 — One active physical location per Coil

- Status: open
- Owner: Warehouse owner
- Validation: physical-process walkthrough
- Affects: Inventory Unit lifecycle and transfer rules

## ASM-006 — Posted operational records are retained

- Status: proposed
- Statement: Posted inventory, production, shipment, and finance records are
  corrected by reversal rather than physical deletion.
- Owner: Business control owners
- Validation: legal/audit policy approval

## ASM-007 — Factory LAN is generally available

- Status: open
- Owner: Infrastructure owner
- Validation: production-point network survey
- Affects: offline behavior, scanning, retries
- Related question: OQ-011

## ASM-008 — Production events are human-frequency

- Status: open
- Owner: Production owner
- Validation: operation/event sampling
- Affects: real-time and telemetry scope

## ASM-009 — Standard/manual barcode printing is acceptable initially

- Status: open
- Owner: Warehouse and Production owners
- Validation: label workflow trial
- Affects: MVP equipment and UX

## ASM-010 — External accounting remains legal authority

- Status: open
- Owner: Finance owner
- Validation: accounting-system and legal-scope confirmation
- Related question: OQ-012

## ASM-011 — Small-team maintainability is required

- Status: proposed
- Owner: Project sponsor
- Validation: delivery/support team plan
- Affects: Modular Monolith, deployment, tooling, operational complexity

## ASM-012 — Historical snapshots and correction evidence are retained

- Status: proposed
- Statement: Commercial, specification, quantity, status, and approval values
  required to interpret a posted historical document are snapshotted, and every
  later correction preserves the prior value, reason, actor, authority,
  timestamp, and linked reversal/correction evidence.
- Owner: Business control owners and Data Steward
- Validation: representative document/correction walkthrough, legal/audit
  retention policy, and authority matrix
- Affects: Sales, Procurement, Inventory, Production, Quality, Shipping,
  FinanceLite, Audit, traceability, retention
- Related questions: OQ-005, OQ-006, OQ-007, OQ-015, OQ-016
