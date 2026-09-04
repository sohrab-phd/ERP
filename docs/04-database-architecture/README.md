---
id: PHASE-04
title: Database Architecture
phase: 04-database-architecture
status: planned
version: 0.1.0
owners: [data-architect, inventory-domain-owner]
depends_on: [PHASE-03]
last_reviewed: 2026-09-02
approval: null
supersedes: null
---

# Phase 04 — Database Architecture

## Purpose

Design the canonical logical and physical data architecture, constraints,
transactions, concurrency controls, inventory kernel, and genealogy model.

## Planned artifacts

- Canonical data dictionary and entity catalogue
- Logical ERD and physical schema specification
- Inventory Ledger/Balance posting design
- Transaction, lock, idempotency, and correction design
- Genealogy projection and reconciliation design
- Data retention, migration, and opening-stock design

## Entry criteria

- Phase 03 is approved.
- Inventory posting alternatives are ready for an ADR.

## Exit criteria

- Every table and authoritative field has one write owner.
- Critical invariants have database/application enforcement assignments.
- Inventory posting and decimal/UOM decisions are approved.
- The user explicitly approves Phase 04.
