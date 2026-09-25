---
id: GOV-QPACK-001
title: Team Question Pack
phase: 00-governance
status: approved
version: 0.5.0
owners: [chief-solution-architect, project-sponsor]
depends_on: [GOV-QUESTIONS-001, ASM-015]
last_reviewed: 2026-09-23
approval: APR-014
supersedes: null
---

# Team Question Pack

This is the standing handoff the Project Owner takes to the team. Canonical
status stays in [OPEN_QUESTIONS.md](registers/OPEN_QUESTIONS.md). This pack
does not approve a phase or authorize implementation.

As of: `2026-09-23` after recording factory-site meeting evidence FACT-01
through FACT-06. Gates 1–6 remain valid. Gate 6 remains ready for a
**separate human** implementation authorization decision. CHK-0013 remains
`a6b893095af7c9d14f342371fb6e4ef9c6d833df`. There is no Phase 13. Factory
findings do **not** authorize implementation and do not create an unlock
file.

**Answered:** OQ-002, OQ-004, OQ-006, OQ-007, OQ-008, OQ-010, OQ-012,
OQ-013, OQ-016, OQ-017, OQ-018.

**Still treating (residuals only):** OQ-019, OQ-001, OQ-003, OQ-005,
OQ-009, OQ-011, OQ-014, OQ-015.

**Factory evidence recorded, not closed:** FACT-01 confirms kg-first
(OQ-001 still treating for scale/rounding/factors/tolerance). FACT-02
confirms hybrid grain and order-code traceability (order-code identity
still unclassified). FACT-04 is a personnel roster only (OQ-019 still
treating). FACT-03 and FACT-05 are open clarification items; a future
dedicated OQ may be required for each. FACT-06 needs a mapping decision
onto existing Production Operation start/complete events.

ADR-0006 and ADR-0007 are accepted. ADR-0008, NestJS, Prisma, Docker, and
extra MCP are not. `IMPLEMENTATION_AUTHORIZED` remains `false`.

## Standing process

1. When a residual arrives, record it on the matching `OQ-*` row. Do not
   invent the rest.
2. Continue only the work authorized by
   [CURRENT_PHASE.md](CURRENT_PHASE.md).
3. A question pack is not an unlock.

## Still needed

### OQ-019 — Role mapping, delegates, operators, sign-off

- Ask: Map each factory-listed person (or state `none`) onto the
  workshop/sign-off roles in [OQ-019.md](team-answers/OQ-019.md). For each
  assignment: delegate or `none`, attendance, approval/sign-off scope.
  Supply production-line operator names when ready. Do **not** treat the
  FACT-04 roster as an `ACT-*` or SoD matrix.
- Why: Eleven organizational names exist; workshop roles, delegates,
  operators, and authority are still missing. Temporary roster rows still
  have no authority.

### OQ-001 — Decimal scale, rounding, conversion factors, tolerance

- Ask: Decimal places and rounding per UOM, plus material-specific
  kg↔length/piece formulas with one ticket example. Numeric tolerance if
  any (otherwise OQ-006 default 0 remains).
- Why: FACT-01 confirmed kg is primary for incoming coils/sheets and
  customer orders; the numerical policy is still missing.

### OQ-003 — Routing catalogue, abort role, station model, enter/forward mapping

- Ask: Versioned step list by product line; which steps are skippable;
  exact abort role name after stock has posted; exact station/work-center
  names if they differ from routing steps.
- Why: FACT-05 confirmed stations and Production Manager routing exist;
  the catalogue is still missing.
- Also ask (FACT-06): do existing `StartProductionOperation` /
  `ProductionOperationStarted` and `CompleteProductionOperation` /
  `ProductionOperationCompleted` already represent “enter station” and
  “forward to next”? If not, what additional **events** (not invented
  columns) are required?

### FACT-05 — Station identity vs human actor identity (no dedicated OQ yet)

- Ask the ten identity/security questions recorded under FACT-05 in
  [OPEN_QUESTIONS.md](registers/OPEN_QUESTIONS.md).
- Why: ordinary station execution is a confirmed factory preference; the
  live SharedTerminal rule still requires per-command operator identity.
  This is an unresolved conflict. A future dedicated OQ may be required.

### OQ-005 — Quality Plans and named approvers

- Ask: Incoming/in-process/final checks, limits/samples if known, and the
  people for the Quality roles (via OQ-019). Confirm that station
  identity is **not** used for two-person exceptional QC release unless
  a later identity decision explicitly allows it.
- Why: Hold/release rules are recorded; missing plans still guard.

### OQ-009 — Residual cutoff numbers

- Ask: Min weight and/or dimensions by material family, with one keep and
  one scrap example.
- Why: Residual vs scrap policy is recorded; the cutoff is not.

### FACT-03 — Opened-coil leftover → warehouse sheets (no dedicated OQ yet)

- Ask the twelve classification questions recorded under FACT-03 in
  [OPEN_QUESTIONS.md](registers/OPEN_QUESTIONS.md).
- Why: the business process is confirmed; domain, posting boundary,
  resulting identity, authoritative quantity, cutting loss, commander,
  allowed lengths, and coil-code vs order-code are not classified. A
  future dedicated OQ may be required. Do not nest this into
  `CompleteProductionOperation` until that classification exists.

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

OQ-002 weight-authoritative Coil (FACT-01 reinforces); OQ-004 hybrid
tracking and no unique ID per tiny cut piece (FACT-02 confirms); order
code as practical trace key for cut pieces and order scrap (FACT-02;
exact order-code identity still open); OQ-006 default tolerance 0;
OQ-007 close SO on fulfillment not payment; OQ-008 one Coil one
reservation and no timer on confirmed SO; OQ-010 visibility-only portal;
OQ-012 Finance-Lite not legal GL; OQ-013 one entity one site; OQ-016
RPO 60 / RTO 8; OQ-017 app-owned PostgreSQL transaction posting; OQ-018
Modular Monolith + PostgreSQL, packages not frozen; FACT-04 eleven-person
organizational roster (not a role mapping).

## Work that continues

- Apply residuals onto the matching `OQ-*` row.
- Do **not** map FACT-04 people onto workshop/`ACT-*` rows until the
  sponsor supplies that mapping.
- Maintain registers. Do not write application source. Do not create an
  unlock file. Do not start Phase 13.
- `IMPLEMENTATION_AUTHORIZED` remains `false`.
