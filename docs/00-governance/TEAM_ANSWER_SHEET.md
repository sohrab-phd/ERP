---
id: GOV-QANS-001
title: Team Answer Sheet
phase: 00-governance
status: approved
version: 0.2.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [GOV-QPACK-001, GOV-QUESTIONS-001, ASM-015]
last_reviewed: 2026-09-15
approval: APR-005
supersedes: null
---

# Team Answer Sheet

This sheet does **not** close questions. Canonical answers live on the
matching `OQ-*` row in [OPEN_QUESTIONS.md](registers/OPEN_QUESTIONS.md).
Source files are in [team-answers/](team-answers/).

As of: `2026-09-15`. Use the blanks only for **residuals**.

## Recorded + residual

### OQ-019

Recorded: role/RACI list. Residual: names.

```
Role | Full name | Delegate or none | Attendance | Approval scope
Project Sponsor |  |  |  |
Project Manager / Product Owner |  |  |  |
Operations / Factory Representative |  |  |  |
Inventory / Warehouse Manager |  |  |  |
Production Representative |  |  |  |
Sales / Commercial Representative |  |  |  |
Procurement Representative |  |  |  |
Quality Manager / QC Supervisor |  |  |  |
Finance Representative |  |  |  |
IT / Infrastructure Representative |  |  |  |
Security / IAM Representative |  |  |  |
ERP Architecture / Technical Lead |  |  |  |
```

### OQ-010

- Recorded: MVP visibility only; no order write.
- Still unknown: exact customer-facing document list.

### OQ-013

- Recorded: one legal entity, one principal site.
- Still unknown: none for first go-live.

### OQ-001

- Recorded: kg official stock UOM.
- Still unknown: decimal scale, rounding, conversion factors.

### OQ-002

- Recorded: Coil quantity = measured weight in kg.
- Still unknown: ticket confirmation (validation only).

### OQ-003

- Recorded: official post at `CompleteProductionOperation`.
- Still unknown: step names; abort role title.

### OQ-004

- Recorded: hybrid tracking policy.
- Still unknown: first-go-live product-family catalogue.

### OQ-005

- Recorded: QC hold/release rules and role kinds.
- Still unknown: Quality Plans, limits, named people.

### OQ-006

- Recorded: partial shipment allowed; default tolerance 0.
- Still unknown: exact %/kg by family.

### OQ-008

- Recorded: one Coil one reservation; no timer on confirmed SO.
- Still unknown: none unless a temporary-hold type is added.

### OQ-007

- Recorded: close SO on fulfilled, cancelled, or authorized unfulfilled remainder; not payment.
- Still unknown: commercial exceptions if any later.

### OQ-009

- Recorded: residual vs scrap reuse policy.
- Still unknown: min weight/dimensions by family.

### OQ-014

- Recorded: modest-scale user planning.
- Still unknown: monthly transaction counts.

### OQ-017

- Recorded: app-owned PostgreSQL transaction posting.
- Still unknown: none unless a later functions ADR is proposed.

### OQ-018

- Recorded: Modular Monolith + PostgreSQL; constraints listed.
- Still unknown: NestJS/Prisma/React/Docker/auth/test packages.

### OQ-011

- Recorded: device never writes Ledger; human ticket fallback.
- Still unknown: make/model/protocol/id/named operator.

### OQ-012

- Recorded: Finance-Lite not legal GL; no Legal-GL in MVP.
- Still unknown: product/API for a later phase.

### OQ-015

- Recorded: Ledger-fact cutover procedure.
- Still unknown: source files, freeze time, named signers.

### OQ-016

- Recorded: RPO 60 min, RTO 8 h, daily + off-site backup.
- Still unknown: retention days; backup product.

## Assumptions after recording

| ID | Status after 2026-09-15 |
| --- | --- |
| ASM-001 | keep (OQ-013) |
| ASM-002 | keep as planning (OQ-014) |
| ASM-003 | keep (OQ-001/002) |
| ASM-004 | replaced (OQ-004 hybrid) |
| ASM-005 | still open |
| ASM-006 | still proposed |
| ASM-007 | still open |
| ASM-008 | still open |
| ASM-009 | still open |
| ASM-010 | keep (OQ-012) |
| ASM-011 | keep (OQ-018) |
| ASM-012 | still proposed |
