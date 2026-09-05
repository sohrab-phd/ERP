---
id: ASM-WORKSHOP-001
title: Initial Discovery and Validation Workshop Agenda
phase: 01-project-assimilation
status: approved
version: 0.1.2
owners: [business-process-owner, chief-solution-architect]
depends_on: [ASM-REPORT-001, ASM-PROVENANCE-001, GOV-RACI-001]
last_reviewed: 2026-09-04
approval: APR-003
supersedes: null
---

# Initial Discovery and Validation Workshop Agenda

## Status and purpose

This is a **planned** discovery and validation workshop. It is not a record of an
executed workshop, attendance, evidence received, answers, or decisions.

The workshop will validate the assimilation baseline, collect evidence for
Phase 02, assign named owners, expose conflicts, and prepare proposed changes to
canonical registers. Discussion does not close an OQ-* or accept an ADR; outcomes
must be supported by registered evidence and promoted to their owning artifacts.

## Required participants

- Project Sponsor and Business Process Owner
- Sales/CRM and Customer Portal owner
- Procurement and Supplier-management owner
- Inventory/Warehouse owner and Data Steward
- Production/MES owner and representative operators
- Quality owner
- Shipping/Delivery owner
- Finance-Lite and external accounting-system owner
- Security, Infrastructure/Operations, Integration, Data, QA, and Solution
  Architecture representatives
- Independent reviewer as observer where review independence permits

Named people, delegates, attendance, and approval limits will update the
[Stakeholder and RACI Register](../00-governance/registers/STAKEHOLDERS_RACI.md).

## Pre-work and evidence pack

- Read SRC-001, SRC-002, the
  [Assimilation Report](ARCHITECTURE_ASSIMILATION_REPORT.md), and
  [Provenance Classification](PROVENANCE_CLASSIFICATION.md).
- Bring current forms, spreadsheets, status lists, approval matrices, sample
  records, labels, certificates, reports, correction examples, and interface
  contracts with sensitive data redacted.
- Bring organization/site structure, role roster, transaction/data volumes,
  infrastructure/network survey, backup policy, and support model.
- Register any new evidence as a source before using it to change canonical
  facts.

## Agenda

### 1. Stakeholders, authority, and evidence

- Confirm accountable process owners, data stewards, approvers, delegates, and
  escalation paths.
- Validate the role-only RACI and evidence acceptance/sign-off process.
- Inputs: GOV-RACI-001 and the
  [Multi-Agent Method](MULTI_AGENT_METHOD.md).
- Linked records: OQ-005, OQ-013, OQ-015, OQ-016; RISK-013.
- Exit outputs: named RACI proposal, evidence inventory, attendance record,
  unresolved owner gaps, and source-registration actions.

### 2. Scope, operating model, and Customer Portal

- Walk the end-to-end inquiry-to-payment flow and identify system boundaries,
  manual steps, parallel Excel/paper dependencies, and MVP exclusions.
- Decide what Customer Portal capabilities are considered for MVP evaluation:
  visibility, requests, documents, notifications, prices, and ordering.
- Linked records: OQ-010, OQ-012, OQ-013; ASM-001, ASM-010; FIND-001;
  RISK-001, RISK-007, RISK-011.
- Exit outputs: validated capability/scope map, portal decision evidence,
  Finance-Lite boundary questions, and owner/action list.

### 3. Units, weight, dimensions, and precision

- Validate UOM by material/product family, authoritative measured versus derived
  quantities, conversions, precision, rounding, tolerance, and pricing basis.
- Review weighbridge/scales, certificates, recalculation, and representative
  records.
- Linked records: OQ-001, OQ-002, OQ-011; ASM-003; RISK-003, RISK-004.
- Exit outputs: proposed signed UOM matrix, measurement-source matrix, examples,
  unresolved tolerances, and evidence owners.

### 4. Lot, batch, unit identity, and genealogy

- Walk supplier receipt to MaterialLot, Coil/InventoryUnit, consumption, merge/
  split, ProductBatch, residual, scrap, rework, Package, Shipment, and Customer.
- Confirm tracking granularity, identifier creation, relabeling, parent-child
  links, defective-lot impact analysis, and forward/backward trace expectations.
- Linked records: OQ-003, OQ-004, OQ-009; ASM-004, ASM-005; RISK-005.
- Exit outputs: validated example genealogy, identity/granularity matrix, known
  merge/split/rework cases, and unresolved ownership or correction issues.

### 5. States, authority, corrections, and historical evidence

- Validate each proposed lifecycle, actor, guard, approval, side effect,
  rejection, cancellation, reopening, reversal, and exceptional release.
- Confirm which values are snapshotted and what evidence proves the historical
  state and every correction.
- Linked records: OQ-005 through OQ-009; ASM-006, ASM-012; FIND-003.
- Exit outputs: annotated lifecycle drafts, correction/reversal catalogue,
  authority matrix, snapshot/evidence requirements, and Phase 03 actions.

### 6. Inventory posting and concurrency

- Identify official posting points for receipt, transfer, reservation, issue,
  consumption, output, residual, scrap, adjustment, packing, and shipment.
- Validate one-writer ownership, Ledger+Balance reconciliation, idempotency,
  negative-stock prevention, concurrent reservation, and correction behavior.
- Compare application transaction orchestration, restricted PostgreSQL
  functions, and a justified hybrid without selecting an option prematurely.
- Linked records: OQ-003, OQ-008, OQ-015, OQ-017; FIND-004; RISK-002,
  RISK-003.
- Exit outputs: posting-event map, concurrency scenarios, reconciliation and
  cutover evidence needs, and ADR evaluation criteria.

### 7. Quality plans and release gates

- Confirm incoming, in-process, final, and exceptional quality workflows,
  measurements, limits, sampling, nonconformance, quarantine, disposition,
  release, rework, and shipment authority.
- Linked records: OQ-004, OQ-005, OQ-009; RISK-005, RISK-008.
- Exit outputs: quality-plan evidence list, disposition/authority matrix,
  inventory-state effects, and unresolved product/customer/regulatory rules.

### 8. Security, customer isolation, and audit

- Validate users, roles, warehouse/line/object scope, segregation of duties,
  customer isolation, remote access, MFA needs, sensitive adjustments, exports,
  notifications, and document access.
- Distinguish Technical Audit, Business Event, Status History, Inventory Ledger,
  and Security Log retention and access.
- Linked records: OQ-005, OQ-010, OQ-015, OQ-016; RISK-007, RISK-008,
  RISK-013.
- Exit outputs: role/scope matrix, sensitive-action list, isolation scenarios,
  evidence/retention requirements, and Phase 06 questions.

### 9. Integrations and failure handling

- Validate weighbridge, barcode/printing, legal accounting, reporting, portal,
  equipment, PLC/telemetry, CMMS, and APS boundaries.
- Collect protocol, identity, retry, duplicate, timeout, outage, manual fallback,
  reconciliation, and ownership evidence.
- Linked records: INT-001 through INT-010; OQ-010 through OQ-012; ASM-007
  through ASM-010; RISK-009, RISK-011.
- Exit outputs: prioritized integration inventory, contract/sample requests,
  source-of-truth and fallback matrix, and Phase 08 actions.

### 10. Non-functional requirements and operating constraints

- Measure user/transaction/data volume, peak concurrency, latency expectations,
  availability, network conditions, recovery, retention, support hours,
  maintenance windows, growth, observability, and restore evidence.
- Validate whether single-site, modest-scale, human-frequency, and LAN
  assumptions hold.
- Linked records: OQ-013, OQ-014, OQ-016; ASM-001, ASM-002, ASM-007,
  ASM-008, ASM-011; RISK-010, RISK-012.
- Exit outputs: measurable NFR candidates, approved evidence owners, capacity
  inputs, recovery decision request, and unresolved constraints.

### 11. Node.js and platform ADR candidates

- Confirm ADR-0001 as the only accepted technology constraint.
- Define evidence and comparison criteria for proposed ADR-0006
  (architecture style), ADR-0007 (PostgreSQL data platform), ADR-0008 (MVP
  deployment topology), and later framework, frontend, persistence, scheduler,
  decimal, validation/OpenAPI, testing, security-package, and observability
  decisions.
- Linked records: OQ-017, OQ-018; FIND-002, FIND-016; RISK-003, RISK-004,
  RISK-006, RISK-009, RISK-012.
- Exit outputs: ADR evaluation backlog, evidence owners, acceptance criteria,
  and explicit list of still-unapproved technology choices.

### 12. Decisions, questions, risks, owners, and exit review

- Review every proposed answer against source evidence and accountable owner.
- Create or update OQ-*, ASM-*, RISK-*, FIND-*, and ADR candidates; do not
  convert discussion into decisions.
- Confirm dependencies and blocking scopes, especially OQ-001 through OQ-005,
  OQ-010, OQ-013, OQ-017, and OQ-018.
- Exit outputs: action register with owner and due evidence, proposed canonical
  updates, conflict list, Phase 02 scope recommendation, and workshop
  reconciliation package.

## Workshop exit package

The planned package is complete only when it contains:

- attendance and named responsibility updates;
- registered evidence IDs and evidence-gap actions;
- validated scope/capability and representative process flows;
- proposed UOM, genealogy, state/correction, posting, quality, security,
  integration, and NFR updates;
- explicit decisions requested, OQs carried, assumptions validated/rejected,
  risks changed, and ADR evaluations opened;
- owner and acceptance evidence for every action; and
- an orchestrator reconciliation plus independent review input.

APR-003 approves this agenda as ready for the planned discovery and validation
workshop; it does not claim that the workshop occurred or approve any expected
answer. The workshop does not authorize Phase 02, implementation, or any
technology selection. Independent review, reconciliation, and explicit Phase 01
approval are complete; CHK-0002 records the completed checkpoint. Phase 02 is
next but remains `ENTRY_BLOCKED` by OQ-019 until every required participant role
has a named assignment.
