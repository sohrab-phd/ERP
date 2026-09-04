---
id: GOV-INTEGRATIONS-001
title: Integration Catalogue
phase: 00-governance
status: approved
version: 0.1.0
owners: [integration-architect]
depends_on: [ASM-REPORT-001, GOV-DOMAIN-001]
last_reviewed: 2026-09-04
approval: APR-002
supersedes: null
---

# Integration Catalogue

These entries define known boundaries, not final protocols or implementation.

## INT-001 — Internal module contracts

- Type: synchronous application/domain commands and read contracts
- Authority: Proposed baseline
- Constraint: No direct cross-module table write
- Detailed phase: 05

## INT-002 — Transactional Outbox

- Type: internal asynchronous delivery boundary
- Authority: Proposed baseline
- Constraint: Message persisted with business transaction; consumers idempotent
- Detailed phase: 05

## INT-003 — Real-time notifications

- Type: Socket.IO candidate replacing SignalR concept
- Authority: Proposed, not final package decision
- Constraint: Minimal authorized post-commit payload; REST remains canonical
- Detailed phase: 05

## INT-004 — Reporting platform

- Type: read-only reporting views
- Candidates: Metabase, Power BI, internal reporting
- Constraint: No write access to transactional truth
- Detailed phase: 08

## INT-005 — Weighbridge

- Type: future equipment integration
- Status: blocked by OQ-011
- Constraint: Reliable transaction identity, calibration, manual fallback
- Detailed phase: 08

## INT-006 — Legal accounting system

- Type: future financial export/API and reconciliation
- Status: blocked by OQ-012
- Constraint: External system remains legal authority unless explicitly changed
- Detailed phase: 08

## INT-007 — Customer Portal

- Type: external customer channel
- Status: product capability; phase blocked by OQ-010
- Constraint: Backend customer isolation and controlled internet exposure
- Detailed phases: 02, 05, 06, 08

## INT-008 — Barcode and industrial printing

- Type: operator/equipment boundary
- Status: standard/manual printing assumed for initial scope
- Detailed phase: 08

## INT-009 — PLC and telemetry

- Type: future production equipment
- Status: excluded from MVP baseline
- Constraint: Do not introduce time-series/event infrastructure without evidence
- Detailed phase: future/08

## INT-010 — CMMS and APS

- Type: future maintenance/planning systems
- Status: future extension boundary
- Detailed phase: 08

## Adapter rule

External adapters validate and map input into authorized core commands. They never
write core transactional tables directly.
