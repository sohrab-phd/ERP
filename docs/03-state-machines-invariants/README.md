---
id: PHASE-03
title: State Machines and Business Invariants
phase: 03-state-machines-invariants
status: approved
version: 0.7.0
owners: [chief-solution-architect, domain-leads]
depends_on: [PHASE-02, APR-004, APR-005, DOM-P03-HANDOFF-001, ASM-016]
last_reviewed: 2026-09-06
approval: APR-005
supersedes: null
---

# Phase 03 — State Machines & Business Invariants

## Gate

Gate status: `APPROVED`

Lifecycle: `approved`

Approval: `APR-005` at `2026-09-06T01:18:00+03:30`, including ASM-016

Git checkpoint: pending. See [CHECKPOINT_APR-005.md](CHECKPOINT_APR-005.md).

Phase 04 is authorized for **logical** drafting. Team answers remain open.
`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Purpose

Define executable business invariants and complete lifecycle models before data
or API contracts are finalized.

## Planned artifacts

- [x] [Invariant catalogue](INVARIANT_CATALOGUE.md) — proposed `INV-*`
- [x] [State machine catalogue](STATE_MACHINE_CATALOGUE.md)
- [x] [Cross-state side-effect matrix](SIDE_EFFECT_MATRIX.md)
- [x] [Exception and correction workflows](EXCEPTION_CORRECTION.md)
- [x] [Transition tables](TRANSITION_TABLES.md)
- [x] [Event and rejection catalogue](EVENT_AND_REJECTION.md)
- [x] [Self-check](SELF_CHECK.md)
- [x] [Independent review](INDEPENDENT_REVIEW.md)
- [x] [Reconciliation](RECONCILIATION.md)
- [x] [Gate checklist](GATE_CHECKLIST.md)
- [x] Standing team question pack:
  [TEAM_QUESTION_PACK.md](../00-governance/TEAM_QUESTION_PACK.md)
- [x] [Phase 04 handoff](PHASE04_HANDOFF.md)
- [x] [Cross-machine sequences](CROSS_MACHINE_SEQUENCES.md)
- [x] [Concurrency and interlock](CONCURRENCY_AND_INTERLOCK.md)
- [x] [Authorization and separation of duties](AUTHORIZATION_SOD.md)
- [x] [APR-005 checkpoint procedure](CHECKPOINT_APR-005.md)

## Entry criteria

- [x] Phase 02 is approved as APR-004.
- [x] Phase 02 handoff exists.
- [x] Phase 02 Git checkpoint completed (CHK-0003).
- [ ] Team answers are **not** required to enter. They are required before
      numeric/named guards can be closed.

## How this phase works while answers are still arriving

Draft structure first. Leave OQ-owned numbers, named approvers, and cutoffs
as open guards. Apply each returned answer onto the matching transition or
invariant. Do not invent values.

## Exit criteria

- [x] Inventory, production, quality, shipment, finance, and audit rules agree
      **or** each remaining number is an explicit open guard with an owning
      OQ or `workshop-commercial-practice` (ASM-016).
- [x] Every transition is traceable to proposed invariants, actor roles, and
      REQ-OBJ-* objectives.
- [x] The user explicitly approved Phase 03 as APR-005.

`IMPLEMENTATION_AUTHORIZED` remains `false`.
