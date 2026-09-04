---
id: ASM-METHOD-001
title: Multi-Agent Architecture Analysis Method
phase: 01-project-assimilation
status: approved
version: 0.1.1
owners: [chief-solution-architect]
depends_on: [SRC-002, GOV-RACI-001, GOV-DOC-STD-001]
last_reviewed: 2026-09-04
approval: APR-003
supersedes: null
---

# Multi-Agent Architecture Analysis Method

## Authority and interpretation

This artifact preserves the conceptual and responsibility model of SRC-002 for
architecture work in this repository. The source establishes specialist
analysis, orchestration, shared knowledge, explicit handoffs, synchronized
outputs, validation, and review.

Exact source role labels are not reliably recoverable as stable identifiers from
the DOCX extraction. The roles below are therefore a **derived responsibility
normalization** of SRC-002, aligned with the canonical
[Stakeholder and RACI Register](../00-governance/registers/STAKEHOLDERS_RACI.md).
They do not create business owners, assign named people, or make business
decisions.

## Orchestrator

The Chief Solution Architect acts as architecture orchestrator and is
responsible for:

- decomposing work into bounded specialist assignments;
- providing each specialist the same applicable sources, canonical records,
  constraints, and required output contract;
- preventing parallel authors from creating competing definitions;
- sequencing dependencies and declaring handoff readiness;
- routing conflicts to OQ-*, ASM-*, RISK-*, FIND-*, or ADR-* records;
- assembling outputs without changing specialist evidence silently;
- initiating self-check, independent review, reconciliation, and gate
  preparation; and
- stopping work when evidence, ownership, or authority is insufficient.

The orchestrator coordinates; it does not substitute architecture synthesis for
business approval or independent review.

## Normalized specialist responsibilities

### Business and domain analysis

- Scope: stakeholders, objectives, business capabilities, process flows,
  terminology, policies, ownership, and acceptance evidence.
- Boundary: may identify rules and questions but may not invent missing policy.
- Primary outputs: REQ-*, TERM-*, BC-*, process evidence, OQ-*, ASM-*, and
  RISK-* candidates.

### Data, inventory, and traceability analysis

- Scope: conceptual identity, quantity semantics, ownership, inventory posting,
  correction evidence, mass balance, and bidirectional genealogy.
- Boundary: conceptual architecture only until later phase authorization; no
  schema, migration, or executable posting design.
- Primary outputs: ENT-* concepts, proposed INV-* candidates, ownership
  conflicts, OQ-001 through OQ-004, OQ-009, OQ-015, and OQ-017 evidence.

### Application and integration analysis

- Scope: module contracts, API boundaries, worker responsibilities, external
  systems, idempotency, notification semantics, and platform evaluation.
- Boundary: candidates remain proposals unless accepted by ADR; no package,
  API, integration, or deployment implementation.
- Primary outputs: INT-*, ADR candidates, OQ-010 through OQ-012, OQ-017, and
  OQ-018 evidence.

### Security and audit analysis

- Scope: identity, backend authorization, segregation of duties, customer
  isolation, audit categories, evidence retention, and threat-sensitive
  boundaries.
- Boundary: identifies controls and validation needs without assigning
  unconfirmed approval authority.
- Primary outputs: SEC-* candidates, audit evidence requirements, risks, and
  owner questions.

### Quality and verification analysis

- Scope: requirement coverage, quality gates, testability, state/invariant
  verification, review criteria, and evidence sufficiency.
- Boundary: does not self-certify authoring work as independent review.
- Primary outputs: TEST-* candidates, traceability gaps, self-check results, and
  review inputs.

### Operations and non-functional analysis

- Scope: capacity, reliability, recovery, observability, support, network
  assumptions, and deployment-topology evaluation.
- Boundary: proposed service levels and topology are not commitments or
  implementation authorization.
- Primary outputs: NFR-* candidates, ASM-002, ASM-007, OQ-014, OQ-016, OQ-018,
  risks, and ADR candidates.

### Independent reviewer

- Scope: adversarial completeness, consistency, provenance, maturity labeling,
  terminology, ownership, traceability, and gate compliance.
- Boundary: independent from artifact authorship; does not approve a phase or
  silently repair findings.
- Primary outputs: FIND-* entries, severity, evidence, and a bounded verdict.

## Common knowledge base

Every assignment uses the same governed baseline:

- [Source Register](../00-governance/SOURCE_REGISTER.md) and
  [Source Bibliography](SOURCE_BIBLIOGRAPHY.md);
- [Provenance Classification](PROVENANCE_CLASSIFICATION.md);
- [Architecture Assimilation Report](ARCHITECTURE_ASSIMILATION_REPORT.md);
- [canonical registers](../00-governance/registers/README.md), including terms,
  assumptions, questions, risks, decisions, traceability, domain/data/state/
  integration models, stakeholders, and findings;
- [Current Phase Authorization](../00-governance/CURRENT_PHASE.md); and
- the applicable phase README and approved upstream baseline.

Specialist outputs reference stable IDs and canonical owners. They do not copy
and mutate normative definitions in private summaries.

## Assignment and handoff contract

Each assignment must state:

- bounded question and excluded scope;
- source IDs and applicable approved decisions;
- canonical artifacts and IDs that may be affected;
- required output and validation criterion;
- unresolved assumptions, conflicts, risks, and questions;
- dependencies and intended recipient; and
- explicit statement that implementation is unauthorized.

A handoff is ready only when evidence is linked, claim maturity is labeled,
canonical terminology is used, affected IDs are identified, and unresolved
matters are recorded rather than guessed. The recipient checks the handoff
against current canonical records before using it.

## Synchronization and integration

- The orchestrator sequences work by dependency and records cross-specialist
  impacts.
- Specialists synchronize through canonical records, not direct competing edits
  to the same fact.
- A discovered disagreement creates or updates a FIND-* and OQ-* or ADR
  candidate before synthesis proceeds.
- Derived synthesis cites source and specialist inputs and remains distinguishable
  from source fact, assumption, conflict, and decision.
- Downstream artifacts become suspect when an upstream canonical fact changes;
  they are cleared only after recorded impact review.
- Workshop outcomes update registered evidence and canonical records; workshop
  notes alone are not decisions.

## Review and reconciliation loop

1. Authors complete bounded outputs and perform a criterion-based self-check.
2. An independent reviewer examines source coverage, provenance, consistency,
   traceability, ownership, maturity labels, and gate compliance.
3. Findings are entered in the canonical Review Findings Register.
4. Authors correct in-scope defects or explicitly carry downstream questions.
5. Reconciliation records agreements, unresolved conflicts, disposition,
   evidence, and readiness.
6. The loop repeats when any critical or high in-scope blocker remains.
7. A phase proceeds only after explicit approval and checkpoint requirements are
   satisfied.

Self-check is not independent review, reconciliation is not approval, and a
recommendation is not authorization.

## Stop and escalation rules

Stop the affected work and escalate when:

- source evidence is missing, contradictory, or cannot support the asserted
  granularity;
- a material business policy, owner, unit, state, correction, or acceptance rule
  is unknown;
- two specialists or sources define competing canonical concepts;
- a technology candidate is being treated as accepted without an ADR;
- security, inventory correctness, genealogy, or audit evidence would depend on
  an unvalidated assumption;
- a requested action exceeds the current phase or write authorization;
- independent-review separation cannot be maintained; or
- a critical/high finding remains unresolved within the phase's ownership.

Escalation targets the accountable role in the Stakeholder/RACI Register and
records an OQ-*, ASM-*, RISK-*, FIND-*, or ADR candidate as appropriate.

## No implementation authority

This method authorizes analysis and architecture documentation only. It does not
authorize application code, packages, schemas, migrations, APIs, UI, tests,
integrations, deployment, staging, commits, checkpoints, markers, or changes to
Cursor controls.

APR-003 approves this responsibility, handoff, synchronization, and validation
method for architecture work. The APR-003 checkpoint and commit remain pending,
and the method does not activate Phase 02 or implementation.
