---
id: QA-TRACE-001
title: Verification Trace
phase: 07-testing-quality-architecture
status: in_review
version: 0.4.0
owners: [qa-architect, requirements-owner]
depends_on: [GOV-TRACE-001, SM-INV-001, SEC-VER-001, APR-008]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Verification Trace

Current delegated reconciliation retains APR-009 as historical structure approval,
not approval of these revised bytes. Foundation acceptance tests are planned in
[physical design](../12-implementation-planning/SLICE_ENVELOPE_PHYSICAL_DESIGN.md).

How Phase 07 attaches verification **intents** to existing IDs. This
does not mint a detailed `REQ-*` or `TEST-*` catalogue (FIND-021,
FIND-028). Canonical objective rows stay in
[REQUIREMENTS_TRACEABILITY.md](../00-governance/registers/REQUIREMENTS_TRACEABILITY.md).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Invariants → intent

| Invariant | Primary level | Intent | Open |
| --- | --- | --- | --- |
| INV-001 | L-BUNDLE, L-PROPERTY | One posting path; immutable Ledger row | OQ-017 application-owned transaction answered; optional functions deferred |
| INV-002 | L-COMMAND, L-PROPERTY | No negative on-hand/reserved/available; one `ACTIVE` reservation per Inventory Unit; confirmed-SO has no expiry | OQ-008 answered |
| INV-003 | L-COMMAND | Availability = on-hand − reserved; lifecycle eligibility separately guarded; Quality hold only in future approved QC | none as a rule |
| INV-004 | L-COMMAND | One unit, one location; incompatible states reject | ASM-005 |
| INV-005 | L-COMMAND | Reversal is a new accepted command | OQ-015 authority |
| INV-006 | L-BUNDLE | Operation complete posts consume/output/residual/scrap together | OQ-003 |
| INV-007 | L-PROPERTY | Production mass-balance and displayed measured difference; no inferred process-loss policy | Production policy before SLICE-MAKE; OQ-006 is fulfillment only |
| INV-008 | L-BUNDLE | Residual gets a new unit; parent closed/split | OQ-009 |
| INV-009 | L-PROPERTY | Genealogy facts immutable; traces both ways | OQ-004 hybrid grain answered; dependent catalogue later |
| INV-010 (**future only**) | L-COMMAND | If future Quality is enabled, QC pending blocks available/ship; no current-MVP gate | OQ-005 future residual |
| INV-011 | L-SEQUENCE | Shipment belongs to authorized demand | OQ-006, OQ-019 |
| INV-012 | L-BUNDLE | Payment allocation cannot exceed open balance | OQ-012 excludes legal GL; external integration residual later |
| INV-013 | L-COMMAND | Unfulfilled demand is not overdue; remainder-close uses that fact | none for OQ-007 close rule |
| INV-014 | L-COMMAND | Posted snapshots do not rewrite | OQ-016 days |
| INV-015 | L-SECURITY | Backend auth, SoD, customer isolation | OQ-010, OQ-019 |
| INV-016 | L-COMMAND, L-PROPERTY | Same key does not double-post | none |
| INV-017 | L-COMMAND | Shipping commands; future QC may command; ACT-IPS writes | OQ-005 future only for QC |
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
| SV-003 | `QA-SCN-QC-COMMAND` (QC portion future only) | OQ-005 future scope; none as a write-owner rule |
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
| SEQ-STOCK | `QA-SCN-STOCK` | OQ-006 |
| SEQ-PURCHASE | `QA-SCN-PURCHASE` | OQ-019; OQ-005 future-only QC |
| SEQ-MAKE | `QA-SCN-MAKE` | OQ-003/009 production residual; OQ-006 fulfillment-only default/configuration |
| SEQ-NOT-FEASIBLE | `QA-SCN-NOT-FEASIBLE` | none as a path |
| SEQ-REVERSE | `QA-SCN-REVERSE` | OQ-015, OQ-017 |

## Bundles (DATA-TX-001)

Each unsplittable bundle is `L-BUNDLE`. `QA-SCN-BUNDLE` is the shared
split-failure intent. OQ-017 selects application-owned PostgreSQL transactions; named business locking details freeze before each dependent slice.

| Bundle | Invariant |
| --- | --- |
| CompleteProductionOperation + consume/output/residual/scrap (nested residual identity) | INV-006 |
| DispatchShipment + stock exit | INV-011, INV-017 |
| PostGoodsReceipt + Lot/Unit/Ledger | INV-001, INV-018 |
| ActivateReservation + reserved state + reserved qty | INV-002, INV-003; one `ACTIVE` per unit |
| AllocatePayment + invoice open-balance reduction | INV-012 |
| CreateResidualUnit + parent close/split (nested in complete-op) | INV-008 / INV-006 |

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
| REQ-OBJ-004 | INV-005, INV-011–016; QA-SCN-REVERSE; QA-SCN-SOD*; INV-010 / QA-SCN-QC-HOLD future only |
| REQ-OBJ-005 | QG-ARCH only; ADR-0001; runner/CI stay OQ-018 |

## Must not do here

- Close FIND-021 by minting a fake `REQ-*` tree
- Write automated tests
- Claim coverage percentages
