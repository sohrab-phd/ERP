---
id: GOV-QUESTIONS-001
title: Open Questions Register
phase: 00-governance
status: approved
version: 0.2.2
owners: [chief-solution-architect]
depends_on: [ASM-REPORT-001]
last_reviewed: 2026-09-04
approval: APR-003
supersedes: null
---

# Open Questions Register

Status values: `open`, `investigating`, `answered`, `deferred`, `superseded`.
Severity and blocking scope are independent. Answers become authoritative only
when promoted to the owning artifact or ADR.

APR-002 approved this register's Phase 00 seed version. APR-003 approves the
current version as accurate Phase 01 assimilation evidence. OQ-001 through
OQ-018 retain their recorded statuses and downstream blocking scopes; artifact
approval does not answer or close them.

## OQ-001 — Authoritative UOM matrix

- Question: Which quantity units, conversions, precision, and rounding rules
  apply to each material and product family?
- Why: Drives balance, pricing, mass balance, and API contracts.
- Domains: MasterData, Inventory, Sales, Production
- Severity: critical
- Blocking scope: Phase 02 and downstream
- Needed: Signed UOM/conversion matrix with examples
- Status: open

## OQ-002 — Coil quantity semantics

- Question: Is Coil inventory authoritative by measured weight only, or by
  weight plus measured/derived length?
- Why: Changes availability, posting, consumption, and tolerance rules.
- Domains: Inventory, Production
- Severity: critical
- Blocking scope: Phase 02 and downstream
- Needed: Current practice, equipment accuracy, representative records
- Status: open

## OQ-003 — Production routing and posting points

- Question: What are the real routing steps, measurement points, and official
  material consumption/output posting points by product line?
- Why: Defines operations, WIP, genealogy, and transaction boundaries.
- Domains: Production, Inventory
- Severity: critical
- Blocking scope: Phase 02 and downstream
- Needed: Validated As-Is/To-Be process maps
- Status: open

## OQ-004 — Tracking granularity

- Question: Which products require Batch, Bundle, or piece-level tracking?
- Why: Determines identities, labels, genealogy, and data volume.
- Domains: Production, Quality, Traceability
- Severity: critical
- Blocking scope: Phase 02 and downstream
- Needed: Product/customer/regulatory matrix
- Status: open

## OQ-005 — Quality plans and release authority

- Question: Which incoming, in-process, and final checks, limits, samples, and
  approval roles are mandatory?
- Why: Availability and shipment gates depend on these rules.
- Domains: Quality, Inventory, Shipping, Security
- Severity: critical
- Blocking scope: Phase 02 and downstream
- Needed: QC forms, standards, exceptions, and signed authority matrix
- Status: open

## OQ-006 — Fulfillment tolerances

- Question: Which partial-shipment, over-production, and over-delivery tolerances
  are allowed?
- Why: Controls order, production, reservation, and shipment behavior.
- Domains: Sales, Production, Shipping
- Severity: high
- Blocking scope: Phase 02 and Phase 03
- Needed: Approved commercial policy
- Status: open

## OQ-007 — Sales Order closure rule

- Question: Does closure require delivery, payment, or both?
- Why: Sales and Finance lifecycles otherwise conflict.
- Domains: Sales, FinanceLite
- Severity: high
- Blocking scope: Phase 03
- Needed: Approved sales/finance policy
- Status: open

## OQ-008 — Reservation policy

- Question: What are reservation expiry, priority, release-after-under-consumption,
  and one-Coil-to-many-orders rules?
- Why: Affects fairness, concurrency, stock availability, and dead stock.
- Domains: Sales, Inventory, Production
- Severity: high
- Blocking scope: Phase 02 and Phase 03
- Needed: Operational policy and conflict examples
- Status: open

## OQ-009 — Reusable residual threshold

- Question: Which minimum dimensions/weight distinguish reusable residual from scrap?
- Why: Split, identity, mass balance, and disposition need a deterministic rule.
- Domains: Production, Inventory, Quality
- Severity: high
- Blocking scope: Phase 03 and Phase 04
- Needed: Shop-floor thresholds by material
- Status: open

## OQ-010 — Customer Portal phase

- Question: Is the portal fully deferred or partially included in MVP, and what
  may customers see or submit?
- Why: Sources conflict; scope changes security, API, internet, and test design.
- Domains: Portal, Sales, Security, Roadmap
- Severity: critical
- Blocking scope: Phase 02
- Needed: Sponsor decision, pilot users, price/document/request policy
- Status: open

## OQ-011 — Weighbridge integration

- Question: Which device, protocol, transaction identifier, and manual fallback
  are available?
- Why: Determines trusted weight capture and duplicate protection.
- Domains: Integration, Procurement, Inventory
- Severity: high
- Blocking scope: Integration implementation area
- Needed: Equipment/network specification and samples
- Status: open

## OQ-012 — Legal accounting integration

- Question: Which accounting system is authoritative and what APIs/files exist?
- Why: Defines Finance-Lite boundary and reconciliation.
- Domains: FinanceLite, Integration
- Severity: high
- Blocking scope: Phase 08
- Needed: Product/version, contracts, samples, and owners
- Status: open

## OQ-013 — Organization and site model

- Question: Are single legal-entity and single-site assumptions valid for the
  planning horizon?
- Why: Affects numbering, tenancy, warehouses, reporting, and deployment.
- Domains: Enterprise Architecture, MasterData
- Severity: high
- Blocking scope: Phase 02 and downstream
- Needed: Approved organization/site model
- Status: open

## OQ-014 — Data and transaction volumes

- Question: What are monthly and peak receipts, units, order lines, operations,
  ledger entries, and shipments?
- Why: Validates capacity, indexes, retention, and deployment.
- Domains: Data, NFR
- Severity: medium
- Blocking scope: Phase 04 physical design
- Needed: At least 12 months of statistics or defensible estimates
- Status: open

## OQ-015 — Opening-stock cutover

- Question: What are the source, count/freeze procedure, discrepancy workflow,
  and sign-off RACI?
- Why: The system cannot become stock truth without controlled opening balance.
- Domains: Migration, Inventory, Governance
- Severity: critical
- Blocking scope: go-live
- Needed: Source inventory, process, evidence, and accountable owners
- Status: open

## OQ-016 — Recovery objectives and retention

- Question: What RPO, RTO, backup retention, and off-site policy are approved?
- Why: Current figures are proposals rather than business commitments.
- Domains: Reliability, Security
- Severity: high
- Blocking scope: deployment
- Needed: Management/legal approval
- Status: open

## OQ-017 — Inventory Posting mechanism

- Question: Should authoritative posting use application transaction orchestration,
  restricted PostgreSQL functions, or a justified hybrid?
- Why: This is the central stock-integrity and concurrency control.
- Domains: Database, Inventory, Backend
- Severity: critical
- Blocking scope: Phase 04 and implementation
- Needed: Option analysis and separately authorized evidence spike
- Status: open

## OQ-018 — Architecture and Node.js platform ADR set

- Question: Which architecture style; PostgreSQL/data-platform role; Node.js
  runtime and backend framework; frontend architecture/framework; authentication
  and authorization packages; persistence approach; durable scheduler; exact
  decimal and serialization; validation/OpenAPI; testing; observability; and MVP
  deployment topology satisfy approved requirements, and what maturity/evidence
  is required before each baseline can be accepted?
- Why: Source references have asymmetric maturity. These choices define module,
  data, implementation, verification, deployment, and operational contracts and
  must not become defaults through repetition.
- Domains: Architecture, Data, Application, Frontend, Security, Worker, API, QA,
  Operations, Deployment
- Severity: critical
- Blocking scope: Phase 05 and implementation areas
- Needed: Evidence-based ADRs and comparison criteria for proposed ADR-0006
  through ADR-0008 plus later detailed platform ADRs; no popularity-based
  defaults
- Status: open
