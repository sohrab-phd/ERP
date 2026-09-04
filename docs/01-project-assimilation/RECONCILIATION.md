---
id: ASM-RECON-001
title: Project Assimilation Reconciliation
phase: 01-project-assimilation
status: approved
version: 0.2.3
owners: [chief-solution-architect]
depends_on: [ASM-REPORT-001, ASM-SOURCES-001, ASM-PROVENANCE-001, ASM-METHOD-001, ASM-WORKSHOP-001, ASM-SELF-CHECK-001, ASM-INDEPENDENT-REVIEW-001]
last_reviewed: 2026-09-04
approval: APR-003
supersedes: null
---

# Project Assimilation Reconciliation

## Agreements

- The system is an integrated ERP-lite/MES operational platform, not generic CRUD.
- Inventory correctness and bidirectional genealogy are architectural priorities.
- Modular Monolith is the leading proposed style for the expected team/scale.
- PostgreSQL, Ledger+Balance, and Outbox are consistent proposed/evaluation
  baselines. One Inventory writer, transactions, idempotency, RBAC, audit, and
  controlled correction are integrity/control requirements whose detailed
  designs remain open.
- Unfulfilled demand is distinct from overdue demand.
- Full accounting, microservices infrastructure, Kubernetes, Event Sourcing, and
  PLC telemetry are not justified for the initial baseline.
- Node.js + TypeScript supersedes the original .NET backend technology family.

## Conflicts and tensions

### FIND-001 — Customer Portal phase

The methodology treats the portal as a first-class capability and allows urgent
partial MVP inclusion. The architecture baseline defers direct portal ordering
until internal workflows and tenant security stabilize. OQ-010 remains open and
blocks Phase 02 scope definition; it does not block accurate completion and
review of the Phase 01 assimilation.

### FIND-002 — Technology decision maturity

NestJS, Prisma, Socket.IO, React, scheduler, testing, and observability choices
appear with inconsistent degrees of finality. ADR-0001 confirms only Node.js +
TypeScript. The maturity-label defect is resolved by explicit proposed/evaluation
wording and ADR candidates, while OQ-018 keeps every actual selection open.

### FIND-003 — Partial fulfillment limits

Partial shipment is expected, but over-production, over-delivery, and tolerance
limits require approved business policy through OQ-006.

### FIND-004 — Inventory Posting control

The baseline requires one posting authority and strong concurrency, but the
application-transaction versus restricted-PostgreSQL mechanism is unresolved.
OQ-017 requires an ADR and evidence.

## Canonical register promotion

- Initial terms:
  [BUSINESS_GLOSSARY.md](../00-governance/registers/BUSINESS_GLOSSARY.md)
- Assumptions:
  [ASSUMPTIONS.md](../00-governance/registers/ASSUMPTIONS.md)
- Confirmed and proposed decisions:
  [DECISIONS.md](../00-governance/registers/DECISIONS.md)
- Open issues: OQ-001 through OQ-018 in
  [OPEN_QUESTIONS.md](../00-governance/registers/OPEN_QUESTIONS.md)
- Initial risks: RISK-001 through RISK-014 in
  [RISKS.md](../00-governance/registers/RISKS.md)
- Objective-to-evidence chain: REQ-OBJ-001 through REQ-OBJ-005 in
  [REQUIREMENTS_TRACEABILITY.md](../00-governance/registers/REQUIREMENTS_TRACEABILITY.md)
- Conceptual boundaries:
  [CANONICAL_DOMAIN_MODEL.md](../00-governance/registers/CANONICAL_DOMAIN_MODEL.md)
- Conceptual entities:
  [CANONICAL_DATA_DICTIONARY.md](../00-governance/registers/CANONICAL_DATA_DICTIONARY.md)
- Proposed lifecycles:
  [STATE_TRANSITION_CATALOGUE.md](../00-governance/registers/STATE_TRANSITION_CATALOGUE.md)
- Known boundaries:
  [INTEGRATION_CATALOGUE.md](../00-governance/registers/INTEGRATION_CATALOGUE.md)
- Provisional owners:
  [STAKEHOLDERS_RACI.md](../00-governance/registers/STAKEHOLDERS_RACI.md)
- Findings and treatments:
  [REVIEW_FINDINGS.md](../00-governance/registers/REVIEW_FINDINGS.md)

## Phase 01 evidence chain

- Source accounting:
  [SOURCE_BIBLIOGRAPHY.md](SOURCE_BIBLIOGRAPHY.md)
- Claim maturity and source mapping:
  [PROVENANCE_CLASSIFICATION.md](PROVENANCE_CLASSIFICATION.md)
- Cross-source synthesis:
  [ARCHITECTURE_ASSIMILATION_REPORT.md](ARCHITECTURE_ASSIMILATION_REPORT.md)
- Responsibility, handoff, synchronization, and review method:
  [MULTI_AGENT_METHOD.md](MULTI_AGENT_METHOD.md)
- Planned—not executed—validation:
  [WORKSHOP_AGENDA.md](WORKSHOP_AGENDA.md)
- Canonical objective evidence:
  [REQUIREMENTS_TRACEABILITY.md](../00-governance/registers/REQUIREMENTS_TRACEABILITY.md)
- Provisional accountability:
  [STAKEHOLDERS_RACI.md](../00-governance/registers/STAKEHOLDERS_RACI.md)
- Review state:
  [REVIEW_FINDINGS.md](../00-governance/registers/REVIEW_FINDINGS.md)
- Independent review:
  [INDEPENDENT_REVIEW.md](INDEPENDENT_REVIEW.md)

## Phase 01 blockers

The assimilation report can be approved as an accurate baseline while its
questions remain open, provided those questions are explicitly carried into
Phase 02 and later gates. Approval would confirm understanding, not approve the
proposed detailed architecture. OQ-010 is one such carried question: it blocks
Phase 02 scope, not Phase 01 completion.

Named workshop participants, delegates, and approval limits remain a Phase 02
entry dependency and a nonblocking Phase 01 carry-forward. No participant names
are inferred or invented in this evidence set.

## Independent review reconciliation

The initial independent review verdict was `BLOCKED`. FIND-017 was accepted as
a High Phase 01 gate blocker; FIND-018 and FIND-019 were accepted as Medium
quality improvements. The following corrective actions are complete:

- FIND-017: ASSUMPTIONS, BUSINESS_GLOSSARY, CANONICAL_DATA_DICTIONARY,
  DECISIONS, OPEN_QUESTIONS, REQUIREMENTS_TRACEABILITY, and REVIEW_FINDINGS now
  identify their current versions as `in_review` with `approval: null`, use
  patch-version increments, and preserve APR-002 as historical seed provenance.
- FIND-018: REQ-OBJ-003 and REQ-OBJ-004 now distinguish SRC-001 as their
  business/architecture content source and SRC-002 as methodological/validation
  support without removing any evidence or downstream trace link.
- FIND-019: the Architecture Assimilation Report now includes the Business
  Glossary in its canonical evidence map and links the first authoritative uses
  of Goods Receipt, Inventory Unit, Coil, Unfulfilled Demand, and Genealogy to
  their TERM entries without repeated overlinking.

Affected artifacts are GOV-ASSUMPTIONS-001, GOV-GLOSSARY-001,
GOV-DATA-DICT-001, GOV-DECISIONS-001, GOV-QUESTIONS-001, GOV-TRACE-001,
GOV-FINDINGS-001, ASM-REPORT-001, ASM-INDEPENDENT-REVIEW-001,
ASM-SELF-CHECK-001, ASM-RECON-001, PHASE-01, and GOV-INDEX-001.

APR-002 remains the approval authority for the Phase 00 seed versions. It does
not approve Phase 01 additions. APR-003 approves the current expanded register
versions as accurate Phase 01 assimilation evidence while preserving APR-002
seed provenance. The follow-up independent review verified the FIND-017 through
FIND-019 corrections and found no unresolved in-scope Critical or High
assimilation defect.

## Gate result

`APPROVED_CHECKPOINT_PENDING`

Phase 00 entry criteria remain satisfied by `APR-002` and `CHK-0001`. The
Project Owner explicitly approved Phase 01 as `APR-003` at
`2026-09-04T20:38:00+03:30`; its Git checkpoint and commit remain pending.

Open FIND-001, FIND-003, and FIND-004 and their linked questions remain carried
forward. FIND-002 and FIND-016 resolve wording/maturity defects only; OQ-018
carries the actual architecture and platform decisions. This recommendation
was satisfied by APR-003, but the approval does not resolve those business or
architecture questions, accept detailed design or technologies, complete the
checkpoint, activate Phase 02, or authorize implementation. OQ-001 through
OQ-018 and proposed ADR-0006 through ADR-0008 carry forward.
