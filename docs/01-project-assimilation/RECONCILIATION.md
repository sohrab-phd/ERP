---
id: ASM-RECON-001
title: Project Assimilation Reconciliation
phase: 01-project-assimilation
status: in_review
version: 0.1.0
owners: [chief-solution-architect]
depends_on: [ASM-REPORT-001, ASM-SOURCES-001]
last_reviewed: 2026-09-02
approval: null
supersedes: null
---

# Project Assimilation Reconciliation

## Agreements

- The system is an integrated ERP-lite/MES operational platform, not generic CRUD.
- Inventory correctness and bidirectional genealogy are architectural priorities.
- Modular Monolith is the leading proposed style for the expected team/scale.
- PostgreSQL, Ledger+Balance, one Inventory writer, transactions, idempotency,
  Outbox, RBAC, audit, and controlled correction are consistent baseline concepts.
- Unfulfilled demand is distinct from overdue demand.
- Full accounting, microservices infrastructure, Kubernetes, Event Sourcing, and
  PLC telemetry are not justified for the initial baseline.
- Node.js + TypeScript supersedes the original .NET backend technology family.

## Conflicts and tensions

### FIND-001 — Customer Portal phase

The methodology treats the portal as a first-class capability and allows urgent
partial MVP inclusion. The architecture baseline defers direct portal ordering
until internal workflows and tenant security stabilize. OQ-010 remains blocking.

### FIND-002 — Technology decision maturity

NestJS, Prisma, Socket.IO, React, scheduler, testing, and observability choices
appear with inconsistent degrees of finality. ADR-0001 confirms only Node.js +
TypeScript; OQ-018 keeps the rest open.

### FIND-003 — Partial fulfillment limits

Partial shipment is expected, but over-production, over-delivery, and tolerance
limits require approved business policy through OQ-006.

### FIND-004 — Inventory Posting control

The baseline requires one posting authority and strong concurrency, but the
application-transaction versus restricted-PostgreSQL mechanism is unresolved.
OQ-017 requires an ADR and evidence.

## Canonical register promotion

- Initial terms: BUSINESS_GLOSSARY.md
- Assumptions: ASSUMPTIONS.md
- Confirmed governance decisions: DECISIONS.md
- Open issues: OQ-001 through OQ-018
- Initial risks: RISK-001 through RISK-014
- Conceptual boundaries: CANONICAL_DOMAIN_MODEL.md
- Conceptual entities: CANONICAL_DATA_DICTIONARY.md
- Proposed lifecycles: STATE_TRANSITION_CATALOGUE.md
- Known boundaries: INTEGRATION_CATALOGUE.md

## Phase 01 blockers

The assimilation report can be approved as an accurate baseline while its
questions remain open, provided those questions are explicitly carried into
Phase 02 and later gates. Approval would confirm understanding, not approve the
proposed detailed architecture.

## Gate recommendation

`BLOCKED` until Phase 00 Governance Foundation is explicitly approved and an
independent Phase 01 review is completed.
