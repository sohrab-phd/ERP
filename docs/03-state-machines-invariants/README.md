---
id: PHASE-03
title: State Machines and Business Invariants
phase: 03-state-machines-invariants
status: in_review
version: 0.3.0
owners: [chief-solution-architect, domain-leads]
depends_on: [PHASE-02, APR-004, DOM-P03-HANDOFF-001]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# Phase 03 — State Machines & Business Invariants

## Gate

Gate status: `ACTIVE_IN_REVIEW`

Lifecycle: `in_review`

Approval: `null`

Phase 02 is approved as APR-004. Structure drafting is authorized. Team
answers are expected in a few days and are **not** required to draft. They
**are** required before numeric or named guards can close.

The APR-004 Git checkpoint is pending. `IMPLEMENTATION_AUTHORIZED` remains
`false`.

## Purpose

Define executable business invariants and complete lifecycle models before data
or API contracts are finalized.

## Planned artifacts

- [x] [Invariant catalogue](INVARIANT_CATALOGUE.md) — proposed `INV-*`
- [x] [State machine catalogue](STATE_MACHINE_CATALOGUE.md) — structure
- [x] [Cross-state side-effect matrix](SIDE_EFFECT_MATRIX.md)
- [x] [Exception and correction workflows](EXCEPTION_CORRECTION.md)
- [ ] Transition-level actor, event, and rejection tables for every machine
- [ ] Self-check, independent review, reconciliation, gate checklist

## Entry criteria

- [x] Phase 02 is approved as APR-004.
- [x] Phase 02 handoff exists.
- [ ] Phase 02 Git checkpoint completed — pending; does not block drafting.
- [ ] Team answers are **not** required to enter. They are required before
      numeric/named guards can be closed.

## How this phase works while answers are still arriving

Draft structure first. Leave OQ-owned numbers, named approvers, and cutoffs
as open guards. Apply each returned answer onto the matching transition or
invariant. Do not invent values.

## Exit criteria

- Inventory, production, quality, shipment, finance, and audit rules agree.
- Every transition is traceable to requirements and responsible roles.
- Mass balance, genealogy, reversal, and concurrency behavior are unambiguous
  **or** each remaining number is still an explicit open guard with an owning
  OQ.
- The user explicitly approves Phase 03.

`IMPLEMENTATION_AUTHORIZED` remains `false`.
