---
id: ASM-PROVENANCE-001
title: Assimilation Provenance and Claim Classification
phase: 01-project-assimilation
status: approved
version: 0.1.1
owners: [chief-solution-architect]
depends_on: [SRC-001, SRC-002, ASM-REPORT-001]
last_reviewed: 2026-09-04
approval: APR-003
supersedes: null
---

# Assimilation Provenance and Claim Classification

## Purpose and evidence boundary

This artifact classifies the major claim groups in the
[Architecture Assimilation Report](ARCHITECTURE_ASSIMILATION_REPORT.md). It
provides source-to-synthesis traceability without treating a source proposal as
an approved business or architecture decision.

SRC-001 and SRC-002 were read through read-only, in-memory DOCX XML extraction.
That extraction preserved document text but did not provide a trustworthy,
stable mapping to rendered page numbers or original paragraph identifiers.
Claim-level provenance is therefore limited to source ID and report section or
claim group. Paragraph- or page-level citations would be fabricated and are not
asserted. Direct binary-source re-extraction remains a review limitation.

## Claim classes

- **Confirmed Source Fact** — a fact about what a registered source explicitly
  states, or a project constraint confirmed by accepted authority. It does not
  mean the described business behavior has been validated unless that authority
  is identified.
- **Source Proposal** — a requirement, architecture, process, technology, or
  operating recommendation present in SRC-001 or SRC-002 but not yet approved.
- **Derived Synthesis** — a normalized or cross-source conclusion assembled by
  the assimilation work; it must remain traceable and independently validated.
- **Assumption** — an unconfirmed condition maintained in
  [ASSUMPTIONS.md](../00-governance/registers/ASSUMPTIONS.md).
- **Conflict** — incompatible or materially different source positions requiring
  an open question, finding, or decision.
- **Decision** — an accepted entry in
  [DECISIONS.md](../00-governance/registers/DECISIONS.md); recommendations are
  never classified as decisions.
- **Open Question** — unresolved information or choice maintained in
  [OPEN_QUESTIONS.md](../00-governance/registers/OPEN_QUESTIONS.md).

## Source and report mapping

### Sources and status

- Source: SRC-001, SRC-002, and the explicit backend override.
- Class: Confirmed Source Fact for source identity; Decision only for ADR-0001;
  Source Proposal for all other technology content.
- Canonical target: [SOURCE_REGISTER.md](../00-governance/SOURCE_REGISTER.md),
  [SOURCE_BIBLIOGRAPHY.md](SOURCE_BIBLIOGRAPHY.md), ADR-0001, and OQ-018.
- Validation status: source-accounted; detailed platform choices open.

### Section 1 — Project understanding and canonical flow

- Source: primarily SRC-001; SRC-002 supports completeness, traceability, and
  validation discipline.
- Class: Derived Synthesis supported by Source Proposals.
- Canonical target: REQ-OBJ-001 through REQ-OBJ-004 in
  [REQUIREMENTS_TRACEABILITY.md](../00-governance/registers/REQUIREMENTS_TRACEABILITY.md)
  and the
  [Canonical Domain Model](../00-governance/registers/CANONICAL_DOMAIN_MODEL.md).
- Validation status: assimilated proposal; business walkthrough required in
  Phase 02.

### Section 2 — Business scope

- Source: SRC-001 and SRC-002.
- Class: Source Proposal and Derived Synthesis; portal phasing is a Conflict.
- Canonical target: BC-* entries in the Canonical Domain Model, INT-007,
  FIND-001, and OQ-010.
- Validation status: proposed; Phase 02 scope is blocked by OQ-010.

### Section 3 — Architectural baseline

- Source: primarily SRC-001, with Node.js + TypeScript from the explicit
  override and evaluation/governance discipline from SRC-002.
- Class: Source Proposal except ADR-0001, which is a Decision.
- Canonical target: ADR-0001, proposed ADR-0006 through ADR-0008, OQ-017,
  OQ-018, and INT-001 through INT-004.
- Validation status: Node.js + TypeScript accepted; architecture style, data
  platform, frontend, packages, worker, observability, and deployment remain
  open evaluation baselines.

### Section 4 — Domain boundaries

- Source: SRC-001, normalized through SRC-002 responsibility separation.
- Class: Derived Synthesis supported by Source Proposals.
- Canonical target:
  [CANONICAL_DOMAIN_MODEL.md](../00-governance/registers/CANONICAL_DOMAIN_MODEL.md),
  [CANONICAL_DATA_DICTIONARY.md](../00-governance/registers/CANONICAL_DATA_DICTIONARY.md),
  and [STAKEHOLDERS_RACI.md](../00-governance/registers/STAKEHOLDERS_RACI.md).
- Validation status: proposed; bounded-context and ownership validation belongs
  to Phase 02.

### Section 5 — Critical business invariants

- Source: primarily SRC-001; SRC-002 requires explicit rules, risks, and
  verification.
- Class: Source Proposal and Derived Synthesis.
- Canonical target: future BR-* and INV-* entries, ASM-006, ASM-012, OQ-001
  through OQ-009, OQ-015, and OQ-017.
- Validation status: assimilation evidence only; normative invariant promotion
  belongs to Phase 03.

### Section 6 — Critical state machines

- Source: SRC-001.
- Class: Source Proposal.
- Canonical target:
  [STATE_TRANSITION_CATALOGUE.md](../00-governance/registers/STATE_TRANSITION_CATALOGUE.md).
- Validation status: proposed; guards, actors, effects, evidence, and correction
  paths remain unvalidated.

### Section 7 — Data ownership

- Source: SRC-001, normalized using SRC-002 responsibility boundaries.
- Class: Derived Synthesis supported by Source Proposals.
- Canonical target: Canonical Domain Model, Canonical Data Dictionary, and
  Stakeholders/RACI.
- Validation status: proposed; named ownership and cross-domain handoffs require
  Phase 02 validation.

### Section 8 — Integration boundaries

- Source: SRC-001.
- Class: Source Proposal.
- Canonical target:
  [INTEGRATION_CATALOGUE.md](../00-governance/registers/INTEGRATION_CATALOGUE.md),
  OQ-010 through OQ-012, OQ-017, and OQ-018.
- Validation status: known boundaries recorded; contracts and implementation
  mechanisms remain open.

### Section 9 — Non-functional requirements

- Source: primarily SRC-001; SRC-002 supplies validation and review discipline.
- Class: Source Proposal; user scale, network, recovery, and operating conditions
  include Assumptions.
- Canonical target: REQ-OBJ-005, ASM-002, ASM-007 through ASM-011, OQ-014,
  OQ-016, OQ-018, and related risks.
- Validation status: proposed negotiation baselines; measurements and owner
  approval required.

### Section 10 — Node.js migration impact

- Source: explicit backend override, with comparative mechanisms derived from
  SRC-001 and evaluation discipline from SRC-002.
- Class: Decision for Node.js + TypeScript only; Derived Synthesis and Source
  Proposal for all mappings and packages.
- Canonical target: ADR-0001, proposed ADR-0006 through ADR-0008, OQ-017,
  OQ-018, FIND-002, and FIND-016.
- Validation status: technology family accepted; every detailed selection remains
  open.

### Section 11 — Supported assumptions

- Source: SRC-001 and synthesis conditions identified during assimilation.
- Class: Assumption, except technology recommendations that remain Source
  Proposals.
- Canonical target:
  [ASSUMPTIONS.md](../00-governance/registers/ASSUMPTIONS.md), ASM-001 through
  ASM-012.
- Validation status: open or proposed exactly as recorded in the canonical
  register.

### Section 12 — Open questions

- Source: SRC-001 and SRC-002, normalized during assimilation.
- Class: Open Question and Derived Synthesis.
- Canonical target:
  [OPEN_QUESTIONS.md](../00-governance/registers/OPEN_QUESTIONS.md).
- Validation status: carried to owning phases; no open item is silently closed.

### Section 13 — Architectural risks

- Source: SRC-001 and SRC-002, normalized during assimilation.
- Class: Source Proposal and Derived Synthesis.
- Canonical target: [RISKS.md](../00-governance/registers/RISKS.md).
- Validation status: initial risks recorded; probability, impact, treatment,
  ownership, and residual acceptance require owning-phase validation.

### Section 14 — Explicit Phase 02 deferrals

- Source: gaps identified by cross-source assimilation and the completeness
  method from SRC-002.
- Class: Derived Synthesis and Open Question.
- Canonical target: OQ-001 through OQ-018, ASM-001 through ASM-012,
  [WORKSHOP_AGENDA.md](WORKSHOP_AGENDA.md), and the Phase 02 entry gate.
- Validation status: explicitly deferred; no detailed entity, term, process,
  policy, state, evidence, or measurable requirement is treated as complete.

### Section 15 — Architecture readiness assessment

- Source: cross-source assimilation and governance criteria from SRC-002.
- Class: Derived Synthesis.
- Canonical target: this Phase 01 evidence set,
  [RECONCILIATION.md](RECONCILIATION.md), and
  [SELF_CHECK.md](SELF_CHECK.md).
- Validation status: candidate Phase 01 review conclusion only; it requires
  independent review, reconciliation, explicit approval, and a checkpoint before
  Phase 02 can begin.

## Promotion rule

Workshop or review evidence must receive a registered source ID before it changes
canonical facts. Assumptions close only in the Assumption Register, questions
close only in the Open Questions Register, and architecture choices become
decisions only through accepted ADR entries. This classification grants no
implementation authority.

APR-003 approves this classification as the Phase 01 provenance method and
record. It does not promote any Source Proposal, Derived Synthesis, Assumption,
Conflict, Open Question, or proposed ADR into an accepted design decision.
OQ-001 through OQ-018 and proposed ADR-0006 through ADR-0008 carry forward.
The checkpoint and commit remain pending, and Phase 02 remains inactive.
