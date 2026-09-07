---
id: PHASE-12
title: Implementation Planning
phase: 12-implementation-planning
status: in_review
version: 0.2.0
owners: [chief-solution-architect, delivery-lead]
depends_on: [PHASE-11, APR-013, VAL-P12-HANDOFF-001, ASM-025]
last_reviewed: 2026-09-07
approval: null
supersedes: null
---

# Phase 12 — Implementation Planning

## Gate

Gate status: `ACTIVE_IN_REVIEW`

Lifecycle: `in_review`

Approval: `null`

Phase 11 is approved as APR-013. Structure drafting is authorized.
Proposed ASM-025 would leave unanswered `OQ-*`, a `TEST-*` catalogue,
named people, and the unlock file open. This phase does not create
application source. Phase 12 approval, when it arrives, is **not** an
implementation unlock.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Purpose

Translate the approved architecture into sequenced, reviewable **planning
labels** without reopening design decisions and without starting coding.

## Planned artifacts

- [x] [Implementation readiness checklist](IMPLEMENTATION_READINESS.md)
- [x] [Roadmap and vertical slices](ROADMAP_AND_SLICES.md)
- [x] [Work items linked to approved IDs](WORK_ITEMS.md)
- [x] [Authorized spike kinds and acceptance labels](SPIKES_AND_ACCEPTANCE.md)
- [x] [Cutover, training, rollout, and support labels](CUTOVER_TRAINING_ROLLOUT.md)
- [x] [Implementation-authorization record (labels only)](AUTHORIZATION_RECORD.md)
- [ ] `TEST-*` catalogue / named roster / unlock file — **not** in this draft
- [ ] Self-check, independent review, reconciliation, gate checklist

## Entry criteria

- [x] Phase 11 is approved (APR-013).
- [ ] Phase 11 Git checkpoint — pending APR-013 marker (CHK-0012).

## How this phase works while answers are still arriving

Name slices, work-item kinds, and later unlock required fields. Do not
invent an unlock file. Do not create application folders. Do not mint
`TEST-*` IDs. “Ok, Continue” is not approval.

## Exit criteria

- Every planning item references an approved design baseline **or**
  the missing workshop/`TEST-*`/unlock piece is an explicit open
  extension (proposed ASM-025).
- Scope, ordering, dependencies, evidence kinds, rollback labels, and
  role-owners are explicit; named people stay OQ-019.
- The user explicitly approves Phase 12, including ASM-025.
- Implementation remains locked until a later human unlock.

`IMPLEMENTATION_AUTHORIZED` remains `false`.
