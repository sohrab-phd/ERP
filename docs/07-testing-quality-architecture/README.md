---
id: PHASE-07
title: Testing and Quality Architecture
phase: 07-testing-quality-architecture
status: in_review
version: 0.2.0
owners: [qa-architect, domain-leads]
depends_on: [PHASE-06, APR-008, SEC-P07-HANDOFF-001]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# Phase 07 — Testing & Quality Architecture

## Gate

Gate status: `ACTIVE_IN_REVIEW`

Lifecycle: `in_review`

Approval: `null`

Phase 06 is approved as APR-008. Structure drafting is authorized. The
APR-008 Git checkpoint is pending. Test-runner, CI, and identity-product
packages remain OQ-018. Quantity oracles remain OQ-001 / OQ-002.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Purpose

Define how every requirement, invariant, state transition, security control,
failure mode, and acceptance scenario will be verified.

## Planned artifacts

- [x] [Test strategy and levels](TEST_STRATEGY.md)
- [x] [Verification trace](VERIFICATION_TRACE.md)
- [x] [Scenario catalogue](SCENARIO_CATALOGUE.md)
- [x] [Property and kernel intents](PROPERTY_AND_KERNEL_INTENTS.md)
- [x] [NFR, recovery, and UAT intents](NFR_AND_UAT.md)
- [x] [Quality gates and evidence](QUALITY_GATES.md)
- [ ] Runner/CI package ADRs — **not** in this draft; OQ-018
- [ ] Self-check, independent review, reconciliation, gate checklist

## Entry criteria

- [x] Phases 03–06 are approved (APR-005 through APR-008).
- [ ] Phase 06 Git checkpoint — pending; does not block structure drafting.

## How this phase works while answers are still arriving

Name verification intents against INV-*, SEQ-*, and SV-*. Do not mint a
false-precision `TEST-*` catalogue that invents UOM, named testers, or
a runner. Do not write test code or CI.

## Exit criteria

- No mandatory invariant lacks a verification intent **or** an explicit
  open extension.
- Test environments and evidence kinds are named as labels, not products.
- Critical failure and recovery scenarios are named; RPO/RTO stay OQ-016.
- The user explicitly approves Phase 07.

`IMPLEMENTATION_AUTHORIZED` remains `false`.
