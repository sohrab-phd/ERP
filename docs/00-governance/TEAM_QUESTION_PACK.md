---
id: GOV-QPACK-001
title: Team Question Pack
phase: 00-governance
status: approved
version: 0.4.0
owners: [chief-solution-architect, project-sponsor]
depends_on: [GOV-QUESTIONS-001, ASM-015]
last_reviewed: 2026-09-15
approval: APR-014
supersedes: null
---

# Team Question Pack

This is the standing handoff the Project Owner takes to the team. Canonical
status stays in [OPEN_QUESTIONS.md](registers/OPEN_QUESTIONS.md). This pack
does not approve a phase or authorize implementation.

As of: `2026-09-15` after recording team-answer files
`docs/00-governance/team-answers/OQ-001.md` through `OQ-019.md`.
CHK-0013 remains `a6b893095af7c9d14f342371fb6e4ef9c6d833df`. There is no
Phase 13. Phase 12 approval is not an implementation unlock.

**Answered:** OQ-002, OQ-004, OQ-006, OQ-007, OQ-008, OQ-010, OQ-012,
OQ-013, OQ-016, OQ-017, OQ-018.

**Still treating (residuals only):** OQ-019, OQ-001, OQ-003, OQ-005,
OQ-009, OQ-011, OQ-014, OQ-015.

ADR-0006 and ADR-0007 are accepted. ADR-0008, NestJS, Prisma, Docker, and
extra MCP are not. `IMPLEMENTATION_AUTHORIZED` remains `false`.

## Standing process

1. When a residual arrives, record it on the matching `OQ-*` row. Do not
   invent the rest.
2. Continue only the work authorized by
   [CURRENT_PHASE.md](CURRENT_PHASE.md).
3. A question pack is not an unlock.

## Still needed

### OQ-019 — Real names

- Ask: Full name, delegate or `none`, attendance, approval scope for each
  role in [OQ-019.md](team-answers/OQ-019.md).
- Why: Temporary names cannot sign, attend as authority, or satisfy SoD.

### OQ-001 — Decimal scale, rounding, conversion factors

- Ask: Decimal places and rounding per UOM, plus material-specific
  kg↔length/piece formulas with one ticket example.
- Why: kg is already official; commands that need a missing scale still
  reject as `GUARD_OPEN_POLICY`.

### OQ-003 — Routing step catalogue and abort role title

- Ask: Versioned step list by product line; which steps are skippable;
  exact abort role name after stock has posted.
- Why: Official posting point is already `CompleteProductionOperation`.

### OQ-005 — Quality Plans and named approvers

- Ask: Incoming/in-process/final checks, limits/samples if known, and the
  people for the Quality roles (via OQ-019).
- Why: Hold/release rules are recorded; missing plans still guard.

### OQ-009 — Residual cutoff numbers

- Ask: Min weight and/or dimensions by material family, with one keep and
  one scrap example.
- Why: Residual vs scrap policy is recorded; the cutoff is not.

### OQ-011 — Weighbridge device

- Ask: Make/model/location, protocol or “ticket only”, duplicate id,
  named Goods Receipt operator.
- Why: Trust rule and human fallback are recorded; auto-path stays
  `SPIKE-DEVICE` until the device exists.

### OQ-014 — Monthly volumes

- Ask: Typical and peak monthly GR, Coils, order lines, operations,
  ledger rows, shipments, with source (system / Excel / signed guess).
- Why: Modest-scale user counts are recorded; transaction counts are not.

### OQ-015 — Cutover files and signers

- Ask: Opening-stock source files, freeze date/time, discrepancy steps,
  named sign-off people (via OQ-019).
- Why: Ledger-fact import procedure is recorded; `ADP-CUTOVER` stays
  `GUARD_OPEN_POLICY` until those inputs exist.

## Already recorded (do not re-ask as if blank)

OQ-002 weight-authoritative Coil; OQ-004 hybrid tracking; OQ-006 default
tolerance 0; OQ-007 close SO on fulfillment not payment; OQ-008 one Coil
one reservation and no timer on confirmed SO; OQ-010 visibility-only
portal; OQ-012 Finance-Lite not legal GL; OQ-013 one entity one site;
OQ-016 RPO 60 / RTO 8; OQ-017 app-owned PostgreSQL transaction posting;
OQ-018 Modular Monolith + PostgreSQL, packages not frozen.

## Work that continues

- Apply residuals onto the matching `OQ-*` row.
- Replace `(temporary)` roster names when OQ-019 names arrive.
- Maintain registers. Do not write application source. Do not create an
  unlock file. Do not start Phase 13.
- `IMPLEMENTATION_AUTHORIZED` remains `false`.
