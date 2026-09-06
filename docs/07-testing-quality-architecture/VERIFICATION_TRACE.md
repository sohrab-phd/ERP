---
id: QA-TRACE-001
title: Verification Trace
phase: 07-testing-quality-architecture
status: in_review
version: 0.1.0
owners: [qa-architect, requirements-owner]
depends_on: [GOV-TRACE-001, SM-INV-001, SEC-VER-001, APR-008]
last_reviewed: 2026-09-06
approval: null
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
an OQ remains.

## Objectives

REQ-OBJ rows remain `proposed`. Phase 07 adds a verification column by
linking each objective to the INV/SEQ/SV intents above. It does not
invent missing workshop requirements.

## Must not do here

- Close FIND-021 by minting a fake `REQ-*` tree
- Write automated tests
- Claim coverage percentages
