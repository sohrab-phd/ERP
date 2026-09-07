---
id: VAL-TRACE-001
title: Requirements and Traceability Coverage
phase: 11-architecture-validation
status: approved
version: 0.3.0
owners: [requirements-owner, qa-architect]
depends_on: [GOV-TRACE-001, APR-012, APR-013, ASM-024, QA-SCN-001]
last_reviewed: 2026-09-07
approval: APR-013
supersedes: null
---

# Requirements and Traceability Coverage

Coverage of REQ-OBJ rows as **structure**, not as a `TEST-*` catalogue
(FIND-021 / FIND-028). Canonical rows remain in
[REQUIREMENTS_TRACEABILITY.md](../00-governance/registers/REQUIREMENTS_TRACEABILITY.md).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## What “mandatory link” means at this gate

GOV-TRACE-001 says Phase 11 rejects an in-scope row with a missing
mandatory link, and that no invariant, interface, or test may remain
orphaned at **implementation authorization**.

This structure gate reports:

- **Structure-covered:** capability, invariant, command/query,
  security intent (`SV-*` / `ACT-*`), verification intent
  (`QA-SCN-*` / `QA-P-*` / `QG-*`), adapter/repo/agent keep-reject
  labels.
- **Not workshop-closed:** related `OQ-*` still open.
- **Not implementation-ready:** no `TEST-*` IDs, named UAT roster, or
  unlock paths. Those remain future and are explicit open extensions
  under accepted ASM-024.

A missing `TEST-*` or workshop REQ-* is therefore an open extension,
not an in-scope structure hole.

## Objective coverage

| Objective | Structure chain present | Still open |
| --- | --- | --- |
| REQ-OBJ-001 Unified operational truth | Capabilities; INV-013/014/018/020; QA-SCN-STOCK/PURCHASE/MAKE/NOT-FEASIBLE; `ADP-REPORT` / `ADP-LIVE` isolation; `mod-reporting` read-only; `CONF-ISO` | Workshop REQ-* decomposition; OQ-010 portal |
| REQ-OBJ-002 Correct inventory | INV-001–004, INV-016–017; QA-P-NONNEG; QA-SCN-CONFLICT; QA-SCN-BUNDLE; `CONF-IPS` / `CONF-BUNDLE`; `ADP-WEIGHBRIDGE` commander; restore rebuilds Balance | OQ-001, OQ-002, OQ-008, OQ-017 |
| REQ-OBJ-003 Bidirectional genealogy | INV-006–009, INV-019; QA-SCN-MAKE; QA-SCN-REJECT-GENEALOGY; `GenealogyRebuild`; `CONF-FORBID`; prompts reject `EditGenealogy` | OQ-003, OQ-004, OQ-009 |
| REQ-OBJ-004 Controlled lifecycles | INV-005, INV-010–016; QA-SCN-REVERSE/QC-HOLD/SOD/SOD-GR; `OBS-AUDIT`; `ADP-CUTOVER` `GUARD_OPEN_POLICY`; `REV-AGENT` cannot approve | OQ-005, OQ-006, OQ-007, OQ-015, OQ-019 |
| REQ-OBJ-005 Maintainable Node.js/TypeScript | ADR-0001; `ZONE-*` / `mod-*` / `AG-*` / `QG-ARCH`; existing Cursor controls | OQ-018 products; OQ-019 names |

## Invariant intent map (INV-001–020)

Every approved invariant has at least one verification **intent**
(`QA-SCN-*`, `QA-P-*`, or `SV-*`) and a later keep/reject label
(`CONF-*` or `TASK-IMPL`). None is minted as `TEST-*`.

| INV | Later intent labels | Open if numeric/named |
| --- | --- | --- |
| INV-001–004 stock/reservation | QA-P-NONNEG, QA-SCN-CONFLICT, QA-SCN-BUNDLE | OQ-001, OQ-002, OQ-008 |
| INV-005 reversal not delete | QA-SCN-REVERSE | OQ-015, OQ-017 |
| INV-006–009 production/genealogy | QA-SCN-MAKE, QA-P-GEN-*, QA-SCN-REJECT-GENEALOGY | OQ-003, OQ-006, OQ-009 |
| INV-010 QC hold | QA-SCN-QC-HOLD | OQ-005 |
| INV-011 shipment needs demand | QA-SCN-SHIP-NO-DEMAND | OQ-019 |
| INV-012 payment allocation | WALK-BUNDLE-PAY | — |
| INV-013 unfulfilled ≠ overdue | QA-SCN-UNFULFILLED / WALK-NOT-FEASIBLE | — |
| INV-014 correction evidence | QA-SCN-REVERSE, SV-011 | — |
| INV-015 UI not trust | SV-001, QA-SCN-UI-LEDGER, QA-SCN-ISOLATION | — |
| INV-016 idempotency | QA-SCN-IDEMPOTENT, SV-004 | — |
| INV-017 commanders vs IPS | SV-003, QA-SCN-QC-COMMAND | — |
| INV-018 Procurement does not write qty | WALK-PURCHASE / WALK-BUNDLE-GR | OQ-011 |
| INV-019 genealogy rebuild-only | QA-SCN-REJECT-GENEALOGY | — |
| INV-020 portal MVP | QA-SCN-REJECT-PORTAL, SV-006 | OQ-010 |

## Coverage rule

An objective is **structure-covered** when the chain above exists. It
is **not workshop-closed** while related `OQ-*` are open. It is **not
implementation-authorized** until a later human unlock cites a frozen
baseline.

## Must not decide here

- A `TEST-*` ID catalogue
- Numeric UOM or tolerance oracles
- Named UAT evidence owners
- Closing FIND-021 / FIND-028
