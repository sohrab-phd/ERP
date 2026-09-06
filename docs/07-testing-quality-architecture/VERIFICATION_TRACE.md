---
id: QA-TRACE-001
title: Verification Trace
phase: 07-testing-quality-architecture
status: approved
version: 0.2.0
owners: [qa-architect, requirements-owner]
depends_on: [GOV-TRACE-001, SM-INV-001, SEC-VER-001, APR-008]
last_reviewed: 2026-09-06
approval: APR-009
supersedes: null
---

# Verification Trace

How Phase 07 attaches verification **intents** to existing IDs. This
does not mint a detailed `REQ-*` or `TEST-*` catalogue (FIND-021,
FIND-028). Canonical objective rows stay in
[REQUIREMENTS_TRACEABILITY.md](../00-governance/registers/REQUIREMENTS_TRACEABILITY.md).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Invariants → intent

| Invariant | Primary level | Intent | Open |
| --- | --- | --- | --- |
| INV-001 | L-BUNDLE, L-PROPERTY | One posting path; immutable Ledger row | OQ-017 |
| INV-002 | L-COMMAND, L-PROPERTY | No negative on-hand/reserved/available | OQ-008 expiry |
| INV-003 | L-COMMAND | Availability = on-hand − reserved − hold | none as a rule |
| INV-004 | L-COMMAND | One unit, one location; incompatible states reject | ASM-005 |
| INV-005 | L-COMMAND | Reversal is a new accepted command | OQ-015 authority |
| INV-006 | L-BUNDLE | Operation complete posts consume/output/residual/scrap together | OQ-003 |
| INV-007 | L-PROPERTY | Mass-balance within tolerance | OQ-006 |
| INV-008 | L-BUNDLE | Residual gets a new unit; parent closed/split | OQ-009 |
| INV-009 | L-PROPERTY | Genealogy facts immutable; traces both ways | OQ-004 |
| INV-010 | L-COMMAND | QC pending blocks available/ship | OQ-005 |
| INV-011 | L-SEQUENCE | Shipment belongs to authorized demand | OQ-006, OQ-019 |
| INV-012 | L-BUNDLE | Payment allocation cannot exceed open balance | OQ-012 |
| INV-013 | L-COMMAND | Unfulfilled demand is not overdue | OQ-007 |
| INV-014 | L-COMMAND | Posted snapshots do not rewrite | OQ-016 days |
| INV-015 | L-SECURITY | Backend auth, SoD, customer isolation | OQ-010, OQ-019 |
| INV-016 | L-COMMAND, L-PROPERTY | Same key does not double-post | none |
| INV-017 | L-COMMAND | QC/Shipping command; ACT-IPS writes | none |
| INV-018 | L-COMMAND | Procurement orchestrates; Inventory posts | none |
| INV-019 | L-PROPERTY | Genealogy is rebuild-only; no EditGenealogy | none |
| INV-020 | L-SECURITY | PortalPlaceOrder rejected in MVP | OQ-010 |

## Security intents

SV-001 through SV-013 in
[SECURITY_VERIFICATION.md](../06-security-rbac-audit/SECURITY_VERIFICATION.md)
map to `L-SECURITY`. They stay untested-as-closed where the table says
an OQ remains. Named scenarios (where one exists) are in
[SCENARIO_CATALOGUE.md](SCENARIO_CATALOGUE.md).

| SV | Primary scenario or standing intent | Open |
| --- | --- | --- |
| SV-001 | `QA-SCN-UI-LEDGER` | none as a rule |
| SV-002 | `QA-SCN-REJECT-ACTOR` | none |
| SV-003 | `QA-SCN-QC-COMMAND` | none as a write-owner rule |
| SV-004 | `QA-SCN-IDEMPOTENT` | none |
| SV-005 | `QA-SCN-ISOLATION` | OQ-010 portal read |
| SV-006 | `QA-SCN-REJECT-PORTAL` | OQ-010 |
| SV-007 | `QA-SCN-SOD` | OQ-019 |
| SV-013 | `QA-SCN-SOD-GR` | OQ-015, OQ-019 |
| SV-008 | `QA-SCN-REJECT-GENEALOGY`, `QA-SCN-REJECT-ADJUST` | none |
| SV-009 | `QA-SCN-WORKER` | OQ-018 scheduler product |
| SV-010 | `QA-SCN-REJECT-OPEN` | owning OQ of the command |
| SV-011 | `QA-SCN-AUDIT` | OQ-016 retention days |
| SV-012 | `QA-SCN-EVENT-ISO` | OQ-010 portal channel |

## Sequences

| Sequence | Scenario | Open stops stay on the SEQ row |
| --- | --- | --- |
| SEQ-STOCK | `QA-SCN-STOCK` | OQ-007, OQ-006 |
| SEQ-PURCHASE | `QA-SCN-PURCHASE` | OQ-019, OQ-005 |
| SEQ-MAKE | `QA-SCN-MAKE` | OQ-003, OQ-009, OQ-006 |
| SEQ-NOT-FEASIBLE | `QA-SCN-NOT-FEASIBLE` | none as a path |
| SEQ-REVERSE | `QA-SCN-REVERSE` | OQ-015, OQ-017 |

## Bundles (DATA-TX-001)

Each unsplittable bundle is `L-BUNDLE`. `QA-SCN-BUNDLE` is the shared
split-failure intent. Mechanism stays OQ-017.

| Bundle | Invariant |
| --- | --- |
| CompleteProductionOperation + consume/output/residual/scrap | INV-006 |
| DispatchShipment + stock exit | INV-011, INV-017 |
| PostGoodsReceipt + Lot/Unit/Ledger | INV-001, INV-018 |
| ActivateReservation + reserved state + reserved qty | INV-002, INV-003 |
| AllocatePayment + invoice open-balance reduction | INV-012 |
| CreateResidualUnit + parent close/split | INV-008 |

## SM-SOD-001 pairs without a dedicated passing scenario

These still have a verification intent. Until the named second person
exists they expect `GUARD_OPEN_POLICY`, not a guessed pass.

| Sensitive command | Intent | Open |
| --- | --- | --- |
| ReturnUnit after SHIPPED | `L-SECURITY` on SEQ-REVERSE | OQ-019 |
| AbortProductionOrder | `L-COMMAND` | OQ-003 |
| ConditionallyRelease | `L-COMMAND` | OQ-005 |
| ApprovePurchaseOrder | stop on `QA-SCN-PURCHASE` | OQ-019 |
| DraftShipment without demand | `QA-SCN-SHIP-NO-DEMAND` | OQ-019 |

## Objectives

REQ-OBJ rows remain `proposed`. Phase 07 links each objective to the
intents above. It does not invent missing workshop requirements. Canonical
rows stay in
[REQUIREMENTS_TRACEABILITY.md](../00-governance/registers/REQUIREMENTS_TRACEABILITY.md).

| Objective | Verification intents |
| --- | --- |
| REQ-OBJ-001 | QA-SCN-STOCK / PURCHASE / MAKE / NOT-FEASIBLE; INV-013, INV-014, INV-018, INV-020 |
| REQ-OBJ-002 | INV-001–004, INV-016–017; QA-P-NONNEG; QA-SCN-CONFLICT; QA-SCN-BUNDLE |
| REQ-OBJ-003 | INV-006–009, INV-019; QA-P-GEN-*; QA-SCN-MAKE; QA-SCN-REJECT-GENEALOGY |
| REQ-OBJ-004 | INV-005, INV-010–016; QA-SCN-REVERSE; QA-SCN-QC-HOLD; QA-SCN-SOD* |
| REQ-OBJ-005 | QG-ARCH only; ADR-0001; runner/CI stay OQ-018 |

## Must not do here

- Close FIND-021 by minting a fake `REQ-*` tree
- Write automated tests
- Claim coverage percentages
