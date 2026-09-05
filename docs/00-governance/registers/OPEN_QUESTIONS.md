---
id: GOV-QUESTIONS-001
title: Open Questions Register
phase: 00-governance
status: approved
version: 0.6.0
owners: [chief-solution-architect]
depends_on: [ASM-REPORT-001, ASM-014, ASM-016, APR-005]
last_reviewed: 2026-09-06
approval: APR-005
supersedes: null
---

# Open Questions Register

Status values: `open`, `investigating`, `treating`, `answered`, `deferred`,
`superseded`. Severity and blocking scope are independent. Answers become
authoritative only when promoted to the owning artifact or ADR.

APR-002 approved this register's Phase 00 seed version. APR-003 approved the
Phase 01 assimilation version. APR-004 accepted the Phase 02 blocking-scope
refinements under ASM-014. The current version is approved as APR-005. Phase 03
cites these questions as open guards under ASM-016. OQ-001 through OQ-018
remain unanswered. Temporary placeholders confer no owner authority. OQ-019
remains `treating`.

Phase 03 structure drafts cite OQ-001 through OQ-010, OQ-012, OQ-015, OQ-017,
and OQ-019 as open guards. Inquiry and Quotation expiry use
`workshop-commercial-practice` (FIND-026). No question is answered or closed.

The Project Owner takes unanswered questions to the team using
[TEAM_QUESTION_PACK.md](../TEAM_QUESTION_PACK.md). That pack is refreshed after
every phase. Answers become authoritative only in this register.

## OQ-001 — Authoritative UOM matrix

- Question: Which quantity units, conversions, precision, and rounding rules
  apply to each material and product family?
- Why: Drives balance, pricing, mass balance, and API contracts.
- Domains: MasterData, Inventory, Sales, Production
- Severity: critical
- Blocking scope: workshop-validated UOM policy, Phase 03 numeric/guard design,
  and Phase 04 physical/API contracts. Phase 02 **design drafting and
  design-gate** may complete with this question formally scoped out under
  ASM-014.
- Needed: Signed UOM/conversion matrix with examples
- Treatment: Phase 02 records the extension point and does not invent the
  signed matrix.
- Status: open

## OQ-002 — Coil quantity semantics

- Question: Is Coil inventory authoritative by measured weight only, or by
  weight plus measured/derived length?
- Why: Changes availability, posting, consumption, and tolerance rules.
- Domains: Inventory, Production
- Severity: critical
- Blocking scope: workshop-validated quantity policy, Phase 03 posting/tolerance
  design, and downstream implementation. Phase 02 **design drafting and
  design-gate** may complete with this question formally scoped out under
  ASM-014.
- Needed: Current practice, equipment accuracy, representative records
- Treatment: Phase 02 keeps Coil as an Inventory Unit kind and does not choose
  weight-only versus weight-plus-length.
- Status: open

## OQ-003 — Production routing and posting points

- Question: What are the real routing steps, measurement points, and official
  material consumption/output posting points by product line?
- Why: Defines operations, WIP, genealogy, and transaction boundaries.
- Domains: Production, Inventory
- Severity: critical
- Blocking scope: workshop-validated routing, Phase 03 official posting points,
  and downstream implementation. Phase 02 **design drafting and design-gate**
  may complete with this question formally scoped out under ASM-014.
- Needed: Validated As-Is/To-Be process maps and shop-floor posting evidence
- Treatment: Phase 02 proposes Production as operation/fact owner and leaves
  real steps and official posting points unset.
- Status: open

## OQ-004 — Tracking granularity

- Question: Which products require Batch, Bundle, or piece-level tracking?
- Why: Determines identities, labels, genealogy, and data volume.
- Domains: Production, Quality, Traceability
- Severity: critical
- Blocking scope: workshop-validated identity matrix, Phase 03 genealogy/label
  design, and Phase 04 volume design. Phase 02 **design drafting and
  design-gate** may complete with this question formally scoped out under
  ASM-014.
- Needed: Product/customer/regulatory matrix
- Treatment: Phase 02 keeps Product Batch and Inventory Unit as proposed
  identities and does not choose batch versus bundle versus piece as policy.
- Status: open

## OQ-005 — Quality plans and release authority

- Question: Which incoming, in-process, and final checks, limits, samples, and
  approval roles are mandatory?
- Why: Availability and shipment gates depend on these rules.
- Domains: Quality, Inventory, Shipping, Security
- Severity: critical
- Blocking scope: workshop-validated QC authority, Phase 03 release/hold
  guards, and downstream implementation. Phase 02 **design drafting and
  design-gate** may complete with this question formally scoped out under
  ASM-014.
- Needed: QC forms, standards, exceptions, and signed authority matrix
- Treatment: Phase 02 records that Quality commands Inventory and that Product
  Batch must be Released before shipment; it does not name approvers or limits.
- Status: open

## OQ-006 — Fulfillment tolerances

- Question: Which partial-shipment, over-production, and over-delivery tolerances
  are allowed?
- Why: Controls order, production, reservation, and shipment behavior.
- Domains: Sales, Production, Shipping
- Severity: high
- Blocking scope: workshop-validated commercial policy and Phase 03
  fulfillment/shipment guards. Phase 02 **design drafting and design-gate** may
  complete with this question formally scoped out under ASM-014.
- Needed: Approved commercial policy
- Treatment: Phase 02 records that partial fulfillment exists and does not
  invent numeric over-production or over-delivery limits.
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
- Blocking scope: workshop-validated reservation policy and Phase 03
  availability/concurrency guards. Phase 02 **design drafting and design-gate**
  may complete with this question formally scoped out under ASM-014.
- Needed: Operational policy and conflict examples
- Treatment: Phase 02 distinguishes Reservation from Allocation and
  Consumption and does not invent expiry, priority, or one-Coil-to-many-orders
  rules.
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
- Blocking scope: portal capability decision, customer-channel
  security/API/internet design, and any later portal implementation. Phase 02
  **design drafting and design-gate** may complete with Customer Portal
  **ordering formally deferred from MVP**.
- Needed: Sponsor decision, pilot users, price/document/request policy
- Treatment: DOM-MVP-RULES-001 and DOM-CAP-BC-001 formally defer ordering from
  MVP. Visibility and request remain optional deferred. FIND-001 remains open.
  This treatment does not answer whether a later portal is included.
- Status: treating

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
- Blocking scope: workshop-validated organization model and later
  tenancy/numbering/deployment design. Phase 02 **design drafting and
  design-gate** may complete under ASM-001 / ASM-014 with the single-site
  assumption remaining unconfirmed.
- Needed: Approved organization/site model
- Treatment: Phase 02 continues under the unconfirmed single-entity /
  principal-site assumption and does not invent a multi-site model.
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

## OQ-019 — Named Phase 02 workshop participants

- Question: Which named people will fill every participant role required by the
  Phase 02 discovery and validation workshop?
- Why: Evidence ownership, attendance, and approval authority must be verified
  against real people before workshop execution and owner-signed decisions.
- Domains: Governance, Stakeholder Management, Phase 02
- Severity: high
- Blocking scope: workshop execution, owner-signed business decisions, and
  go-live sign-off. Phase 02 **design drafting** is permitted under ASM-013.
- Classification: entry-evidence and owner-assignment dependency; not a business
  or architecture decision
- Treatment: The Project Owner authorized temporary placeholders flagged
  `(temporary)` in
  [WORKSHOP_ROSTER.md](../../02-domain-business-architecture/WORKSHOP_ROSTER.md)
  so architecture design can continue. FIND-020 records this exception.
- Needed: Replace every temporary row with a real full name, delegate or
  explicit `none`, attendance/availability confirmation, and approval scope.
- Status: treating
