---
id: PHASE-04
title: Database Architecture
phase: 04-database-architecture
status: approved
version: 0.4.0
owners: [data-architect, inventory-domain-owner]
depends_on: [PHASE-03, APR-005, APR-006, SM-P04-HANDOFF-001, ASM-017]
last_reviewed: 2026-09-06
approval: APR-006
supersedes: null
---

# Phase 04 — Database Architecture

## Gate

Gate status: `APPROVED`

Lifecycle: `approved`

Approval: `APR-006` at `2026-09-06T19:42:00+03:30`, including ASM-017
(logical baseline)

Git checkpoint: pending. See [CHECKPOINT_APR-006.md](CHECKPOINT_APR-006.md).
The APR-005 checkpoint is also still pending.

Phase 05 is authorized for **structure** drafting. Team answers remain
open. `IMPLEMENTATION_AUTHORIZED` remains `false`.

## Purpose

Design the canonical logical and physical data architecture, constraints,
transactions, concurrency controls, inventory kernel, and genealogy model.

## Planned artifacts

- [x] [Logical model](LOGICAL_MODEL.md) — entities and relationships
- [x] [Posting kernel and alternatives](POSTING_KERNEL.md) — proposed
      pattern; mechanism open
- [x] [Transaction and idempotency](TRANSACTION_AND_IDEMPOTENCY.md)
- [x] [Genealogy projection](GENEALOGY_PROJECTION.md)
- [x] [Logical attribute catalogue](LOGICAL_ATTRIBUTE_CATALOGUE.md)
- [x] [Retention, migration, and opening stock](RETENTION_MIGRATION_OPENING_STOCK.md)
- [x] [Invariant enforcement assignment](ENFORCEMENT_ASSIGNMENT.md)
- [x] [Self-check](SELF_CHECK.md)
- [x] [Independent review](INDEPENDENT_REVIEW.md)
- [x] [Reconciliation](RECONCILIATION.md)
- [x] [Gate checklist](GATE_CHECKLIST.md)
- [x] [Phase 05 handoff](PHASE05_HANDOFF.md)
- [x] [APR-006 checkpoint procedure](CHECKPOINT_APR-006.md)

Physical schema, indexes, and volumes remain later work under ASM-017.

## Entry criteria

- [x] Phase 03 is approved as APR-005.
- [x] Inventory posting alternatives are drafted as a comparison, not an
      accepted ADR (OQ-017).
- [ ] Phase 03 Git checkpoint — pending.

## Exit criteria

- [x] Every authoritative field has one write owner (logical).
- [x] Critical invariants have enforcement assignments (mechanism open).
- [x] Inventory posting and decimal/UOM decisions stay explicit open
      extensions with owning OQs (ASM-017).
- [x] The user explicitly approved Phase 04 as APR-006.

`IMPLEMENTATION_AUTHORIZED` remains `false`.
