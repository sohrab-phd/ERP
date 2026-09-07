---
id: GOV-TRACE-001
title: Requirements Traceability Matrix
phase: 00-governance
status: approved
version: 0.7.0
owners: [requirements-owner, qa-architect]
depends_on: [SRC-001, SRC-002, DOM-MVP-RULES-001, SM-INV-001, APR-005]
last_reviewed: 2026-09-07
approval: APR-005
supersedes: null
---

# Requirements Traceability Matrix

## Required trace chain

`Objective → Requirement → Business Rule/Invariant → Process/State → Domain/Data/API/Security Control → Verification → Risk/ADR`

Traceability is bidirectional. No mandatory requirement, invariant, interface, or
test may remain orphaned at implementation authorization.

APR-002 approved this register's Phase 00 seed version. APR-003 approved the
Phase 01 objective and evidence traceability. APR-004 approved Phase 02
design-artifact evidence. The current version is approved as APR-005 because Phase 03
promoted BR-001 through BR-020 to proposed `INV-*` and linked state machines.
Objectives remain proposed where recorded. FIND-021 and FIND-028 record that
a false-precision REQ-* or TEST-* catalogue is not minted before workshop
evidence and Phase 07.

## Initial objectives

### REQ-OBJ-001 — Unified operational truth

- Source: SRC-001
- Scope: Sales through delivery and finance-lite
- Current design: ASM-REPORT-001
- Phase 01 evidence:
  [Assimilation Report sections 1–4](../../01-project-assimilation/ARCHITECTURE_ASSIMILATION_REPORT.md),
  [Provenance Classification](../../01-project-assimilation/PROVENANCE_CLASSIFICATION.md),
  and
  [Workshop Agenda sections 2–4](../../01-project-assimilation/WORKSHOP_AGENDA.md)
- Risks: RISK-001, RISK-002, RISK-013
- Phase 02 design evidence:
  [Capability map](../../02-domain-business-architecture/CAPABILITY_BOUNDED_CONTEXT_MAP.md),
  [process maps](../../02-domain-business-architecture/PROCESS_MAPS_AS_IS_TO_BE.md),
  [ownership matrix](../../02-domain-business-architecture/MODULE_OWNERSHIP_MATRIX.md),
  and
  [MVP scope and business rules](../../02-domain-business-architecture/MVP_SCOPE_AND_BUSINESS_RULES.md)
  BR-013, BR-014, BR-018, BR-020
- Phase 03 design evidence:
  [Invariant catalogue](../../03-state-machines-invariants/INVARIANT_CATALOGUE.md)
  INV-013, INV-014, INV-018, INV-020;
  [state machine catalogue](../../03-state-machines-invariants/STATE_MACHINE_CATALOGUE.md);
  [transition tables](../../03-state-machines-invariants/TRANSITION_TABLES.md)
- Phase 07 verification intents (structure, not tests):
  [VERIFICATION_TRACE.md](../../07-testing-quality-architecture/VERIFICATION_TRACE.md)
  QA-SCN-STOCK, QA-SCN-PURCHASE, QA-SCN-MAKE, QA-SCN-NOT-FEASIBLE
- Phase 08 integration intents (structure, not products):
  `ADP-REPORT` / `ADP-LIVE` isolation; `TB-STOCK`; adapters command only
- Phase 09 repository intents (structure, not products):
  `mod-reporting` read-only; `CONF-ISO`
- Phase 10 agent intents (structure, not products):
  `AG-ARCH` cannot invent a second catalogue; `CONF-ISO` remains a keep
  rule for later generated exports
- Status: proposed; detailed REQ-* decomposition remains workshop-owned

### REQ-OBJ-002 — Correct inventory under concurrency

- Source: SRC-001
- Domains: Inventory, Sales, Production
- Phase 01 evidence:
  [Assimilation Report sections 5 and 7](../../01-project-assimilation/ARCHITECTURE_ASSIMILATION_REPORT.md),
  [Provenance Classification](../../01-project-assimilation/PROVENANCE_CLASSIFICATION.md),
  and
  [Workshop Agenda sections 3 and 6](../../01-project-assimilation/WORKSHOP_AGENDA.md)
- Open questions: OQ-001, OQ-002, OQ-008, OQ-017
- Risks: RISK-003, RISK-004
- Phase 02 design evidence:
  [Ownership matrix](../../02-domain-business-architecture/MODULE_OWNERSHIP_MATRIX.md)
  and
  [MVP business rules](../../02-domain-business-architecture/MVP_SCOPE_AND_BUSINESS_RULES.md)
  BR-001 through BR-004, BR-017
- Phase 03 design evidence:
  INV-001 through INV-004, INV-017;
  SM-RESERVATION, SM-INVENTORY-UNIT, SM-MATERIAL-ALLOCATION;
  [side-effect matrix](../../03-state-machines-invariants/SIDE_EFFECT_MATRIX.md)
- Phase 07 verification intents (structure, not tests):
  INV-001–004, INV-016–017; QA-P-NONNEG; QA-SCN-CONFLICT; QA-SCN-BUNDLE
- Phase 08 integration intents (structure, not products):
  unsplittable DATA-TX-001 on adapter paths; `ADP-WEIGHBRIDGE` commander
  only; `DR-RESTORE` rebuilds Balance from Ledger
- Phase 09 repository intents (structure, not products):
  `CONF-IPS`; `CONF-BUNDLE`; no Balance-only API
- Phase 10 agent intents (structure, not products):
  `TASK-IMPL` forbids Ledger writes outside Inventory Posting and
  must not split DATA-TX-001 bundles; `CONF-IPS` / `CONF-BUNDLE` are
  keep/reject rules
- Status: proposed; numeric UOM, Coil, and reservation guards remain open

### REQ-OBJ-003 — Bidirectional material genealogy

- Business/architecture content source: SRC-001
- Methodological/validation support: SRC-002
- Domains: Procurement, Inventory, Production, Quality, Shipping
- Phase 01 evidence:
  [Assimilation Report sections 1 and 5](../../01-project-assimilation/ARCHITECTURE_ASSIMILATION_REPORT.md),
  [Provenance Classification](../../01-project-assimilation/PROVENANCE_CLASSIFICATION.md),
  and
  [Workshop Agenda section 4](../../01-project-assimilation/WORKSHOP_AGENDA.md)
- Open questions: OQ-003, OQ-004, OQ-009
- Risk: RISK-005
- Phase 02 design evidence:
  [Process maps](../../02-domain-business-architecture/PROCESS_MAPS_AS_IS_TO_BE.md)
  and
  [MVP business rules](../../02-domain-business-architecture/MVP_SCOPE_AND_BUSINESS_RULES.md)
  BR-006 through BR-009, BR-019
- Phase 03 design evidence:
  INV-006 through INV-009, INV-019;
  SM-PRODUCTION-ORDER, SM-PRODUCTION-OPERATION, SM-RESIDUAL, SM-SCRAP
- Phase 07 verification intents (structure, not tests):
  QA-SCN-MAKE; QA-P-GEN-*; QA-SCN-REJECT-GENEALOGY
- Phase 08 integration intents (structure, not products):
  `GenealogyRebuild` after restore; no adapter exposes `EditGenealogy`
- Phase 09 repository intents (structure, not products):
  `CONF-FORBID` (`EditGenealogy`); rebuild is generated from Ledger
- Phase 10 agent intents (structure, not products):
  prompts and acceptance reject `EditGenealogy`; generated genealogy
  stays a Ledger rebuild
- Status: proposed; official posting points, tracking, and residual cutoff
  remain open

### REQ-OBJ-004 — Controlled and auditable business lifecycles

- Business/architecture content source: SRC-001
- Methodological/validation support: SRC-002
- Domains: All transactional domains
- Phase 01 evidence:
  [Assimilation Report sections 5–7](../../01-project-assimilation/ARCHITECTURE_ASSIMILATION_REPORT.md),
  [Multi-Agent Method](../../01-project-assimilation/MULTI_AGENT_METHOD.md),
  and
  [Workshop Agenda sections 5, 7, and 8](../../01-project-assimilation/WORKSHOP_AGENDA.md)
- Open questions: OQ-005, OQ-006, OQ-007
- Risks: RISK-006, RISK-008
- Phase 02 design evidence:
  [Actor catalogue](../../02-domain-business-architecture/ACTOR_RESPONSIBILITY_CATALOGUE.md)
  and
  [MVP business rules](../../02-domain-business-architecture/MVP_SCOPE_AND_BUSINESS_RULES.md)
  BR-005, BR-010 through BR-016
- Phase 03 design evidence:
  INV-005, INV-010 through INV-016;
  [exception workflows](../../03-state-machines-invariants/EXCEPTION_CORRECTION.md);
  [event and rejection catalogue](../../03-state-machines-invariants/EVENT_AND_REJECTION.md)
- Phase 07 verification intents (structure, not tests):
  QA-SCN-REVERSE; QA-SCN-QC-HOLD; QA-SCN-SOD; QA-SCN-SOD-GR
- Phase 08 integration intents (structure, not products):
  `OBS-AUDIT`; `RB-SOD`; `ADP-CUTOVER` stays `GUARD_OPEN_POLICY` until
  OQ-015
- Phase 09 repository intents (structure, not products):
  authored catalogues stay source truth; generated OpenAPI cannot close
  an `OQ-*`
- Phase 10 agent intents (structure, not products):
  `REV-AGENT` cannot approve architecture; unanswered policy is
  `GUARD_OPEN_POLICY`
- Status: proposed; QC, tolerance, and Sales Order closure guards remain open

### REQ-OBJ-005 — Maintainable Node.js/TypeScript platform

- Source: Explicit technology override
- Decision: ADR-0001
- Phase 01 evidence:
  [Assimilation Report sections 3, 9, and 10](../../01-project-assimilation/ARCHITECTURE_ASSIMILATION_REPORT.md),
  [Provenance Classification](../../01-project-assimilation/PROVENANCE_CLASSIFICATION.md),
  and
  [Workshop Agenda sections 10 and 11](../../01-project-assimilation/WORKSHOP_AGENDA.md)
- Open question: OQ-018
- Risks: RISK-004, RISK-009, RISK-012
- Phase 07 verification intents (structure, not tests):
  QG-ARCH only; runner/CI stay OQ-018; no package claimed
- Phase 08 integration intents (structure, not products):
  `ZONE-*` / `HH-*` labels; hosting/Docker stay OQ-018
- Phase 09 repository intents (structure, not products):
  `mod-*` / `CONF-*` labels; npm/pnpm/CI stay OQ-018
- Phase 10 agent intents (structure, not products):
  existing Cursor controls only; `MCP-EXTRA` stays OQ-018
- Status: confirmed objective; solution undecided

## Coverage policy

Phase 02 maps objectives to capabilities, ownership, processes, and proposed
BR-* rules. Phase 03 assigns proposed `INV-*` IDs and lifecycle structure. It
does not mint a false-precision REQ-* catalogue before workshop evidence
(FIND-021, FIND-028). Phase 07 adds verification **intent** links (levels,
`QA-SCN-*`, `QA-P-*`, SV map). It does not mint `TEST-*` IDs or choose a
runner. Phase 08 adds adapter, zone, and recovery **labels**. It does
not choose a protocol, Docker, or RPO/RTO. Phase 09 adds repository
layout, import, and conformance **labels**. It does not choose npm,
GitHub, or CI. Phase 10 adds agent authority, prompt, and acceptance
**labels**. It does not choose extra MCP or named approvers. Phases 04–10 extend each
row with physical data, interfaces, controls, and later tests. Phase 11
rejects any in-scope row with a missing mandatory link. Phase 07 is
approved as APR-009 (structure); these intent links are not executable
tests. Phase 08 is approved as APR-010 (structure), including ASM-021.
Phase 09 is approved as APR-011 (structure), including ASM-022.
Phase 10 is approved as APR-012 (structure), including ASM-023.
Phase 11 structure coverage is reported in
[TRACEABILITY_COVERAGE.md](../../11-architecture-validation/TRACEABILITY_COVERAGE.md).
Phase 11 is approved as APR-013, including ASM-024. CHK-0012 records
the checkpoint at `57062e96c91b6eff52f233aaf3a0df65a81e9da4`. Phase 12
is approved as APR-014, including ASM-025. The Git checkpoint is
pending. Missing `TEST-*` and workshop REQ-* stay open extensions.
