---
id: PHASE-08
title: Integration and Deployment Architecture
phase: 08-integration-deployment
status: in_review
version: 0.2.0
owners: [integration-architect, operations-owner]
depends_on: [PHASE-07, APR-009, QA-P08-HANDOFF-001, ASM-021]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# Phase 08 — Integration & Deployment Architecture

## Gate

Gate status: `ACTIVE_IN_REVIEW`

Lifecycle: `in_review`

Approval: `null`

Phase 07 is approved as APR-009. Structure drafting is authorized.
Proposed ASM-021 would leave weighbridge protocol, legal accounting
product, hosting/Docker, observability product, backup vendor, RPO/RTO
minutes, and named operators open.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Purpose

Define internal/external integration contracts, deployment topology,
observability, backup/recovery, network behavior, operations, and future
extension boundaries — as **labels**, not products.

## Planned artifacts

- [x] [Integration catalogue and adapter contracts](INTEGRATION_CATALOGUE.md)
- [x] [External system boundaries](EXTERNAL_BOUNDARIES.md)
- [x] [Deployment topology and environment labels](DEPLOYMENT_TOPOLOGY.md)
- [x] [Observability kinds](OBSERVABILITY.md)
- [x] [Backup, restore, and recovery labels](BACKUP_AND_RECOVERY.md)
- [x] [Operational runbook catalogue](RUNBOOK_CATALOGUE.md)
- [ ] Hosting/Docker/CI product ADRs — **not** in this draft; OQ-018
- [ ] Self-check, independent review, reconciliation, gate checklist

## Entry criteria

- [x] Phases 05–07 are approved (APR-007 through APR-009).
- [ ] Phase 07 Git checkpoint — pending; does not block structure drafting.

## How this phase works while answers are still arriving

Name adapters, environments, signals, and runbooks. Do not choose a
protocol, cloud, container runtime, or recovery minute-count. Adapters
submit core commands; they never write Ledger, Balance, or unit
quantity.

## Exit criteria

- Integration ownership, retries, idempotency, and failure handling are
  explicit **or** an open extension.
- Deployment NFRs are named as labels; RPO/RTO stay OQ-016.
- Recovery procedures are named; accountable named operators stay
  OQ-019.
- The user explicitly approves Phase 08.

`IMPLEMENTATION_AUTHORIZED` remains `false`.
