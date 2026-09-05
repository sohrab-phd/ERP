---
id: PHASE-04
title: Database Architecture
phase: 04-database-architecture
status: in_review
version: 0.2.0
owners: [data-architect, inventory-domain-owner]
depends_on: [PHASE-03, APR-005, SM-P04-HANDOFF-001]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# Phase 04 — Database Architecture

## Gate

Gate status: `ACTIVE_IN_REVIEW`

Lifecycle: `in_review`

Approval: `null`

Phase 03 is approved as APR-005. Logical drafting is authorized. The
APR-005 Git checkpoint is pending. Team answers remain required before
physical types, volumes, UOM, or posting mechanism can close.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Purpose

Design the canonical logical and physical data architecture, constraints,
transactions, concurrency controls, inventory kernel, and genealogy model.

## Planned artifacts

- [x] [Logical model](LOGICAL_MODEL.md) — entities and relationships
- [x] [Posting kernel and alternatives](POSTING_KERNEL.md) — proposed
      pattern; mechanism open
- [x] [Transaction and idempotency](TRANSACTION_AND_IDEMPOTENCY.md)
- [x] [Genealogy projection](GENEALOGY_PROJECTION.md)
- [ ] Logical attribute catalogue (no invented precision)
- [ ] Retention, migration, and opening-stock design
- [ ] Self-check, independent review, reconciliation, gate checklist

## Entry criteria

- [x] Phase 03 is approved as APR-005.
- [x] Inventory posting alternatives are drafted as a comparison, not an
      accepted ADR (OQ-017).
- [ ] Phase 03 Git checkpoint — pending; does not block logical drafting.

## How this phase works while answers are still arriving

Draft logical structure first. Leave every OQ-owned number, named person,
cutoff, UOM, decimal, volume, and posting mechanism as an open extension.
Do not write executable SQL, ORM models, or migrations.

## Exit criteria

- Every table and authoritative field has one write owner.
- Critical invariants have database/application enforcement assignments.
- Inventory posting and decimal/UOM decisions are approved **or** still
  explicit open extensions with owning OQs.
- The user explicitly approves Phase 04.

`IMPLEMENTATION_AUTHORIZED` remains `false`.
