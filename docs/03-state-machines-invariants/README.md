---
id: PHASE-03
title: State Machines and Business Invariants
phase: 03-state-machines-invariants
status: planned
version: 0.1.0
owners: [chief-solution-architect, domain-leads]
depends_on: [PHASE-02]
last_reviewed: 2026-09-02
approval: null
supersedes: null
---

# Phase 03 — State Machines & Business Invariants

## Purpose

Define executable business invariants and complete lifecycle models before data
or API contracts are finalized.

## Planned artifacts

- Canonical invariant catalogue
- Per-aggregate state machines
- Transition guards, actors, effects, events, and rejection behavior
- Exception and correction workflows
- Cross-state side-effect matrix

## Entry criteria

- Phase 02 is approved.

## Exit criteria

- Inventory, production, quality, shipment, finance, and audit rules agree.
- Every transition is traceable to requirements and responsible roles.
- Mass balance, genealogy, reversal, and concurrency behavior are unambiguous.
- The user explicitly approves Phase 03.
