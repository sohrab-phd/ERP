---
id: GOV-RISKS-001
title: Risk Register
phase: 00-governance
status: approved
version: 0.1.0
owners: [chief-solution-architect, project-sponsor]
depends_on: [ASM-REPORT-001]
last_reviewed: 2026-09-04
approval: APR-002
supersedes: null
---

# Risk Register

These are initial architecture risks. Probability, impact, owner, treatment, and
residual acceptance must be validated by the owning phase.

## RISK-001 — Competing Excel source of truth

- Cause: User resistance or incomplete process adoption
- Impact: Stock, fulfillment, and traceability divergence
- Initial treatment: Process ownership, pilot, cutover freeze, reconciliation
- Owner: Project sponsor
- Status: open

## RISK-002 — Incorrect opening inventory

- Cause: Incomplete count, coding, or sign-off
- Impact: System is invalid as stock authority from day one
- Initial treatment: Controlled count/freeze, discrepancy workflow, formal sign-off
- Owner: Inventory process owner
- Status: open

## RISK-003 — Inventory concurrency failure

- Cause: Convenience ORM usage without correct locks and posting authority
- Impact: Negative stock, double reservation, irreconcilable balances
- Initial treatment: OQ-017 ADR, adversarial review, concurrency evidence
- Owner: Data architect
- Status: open

## RISK-004 — Decimal precision loss

- Cause: JavaScript Number used for authoritative weight or money
- Impact: Quantity, balance, mass, and finance corruption
- Initial treatment: Exact-decimal ADR and string/decimal contracts
- Owner: Application and Data architects
- Status: open

## RISK-005 — Genealogy divergence

- Cause: Source facts and projection updated separately or corrected in place
- Impact: Incorrect recall, customer trace, or material history
- Initial treatment: Atomic completion, immutable facts, rebuild/reconciliation
- Owner: Production and Data architects
- Status: open

## RISK-006 — Modular Monolith boundary erosion

- Cause: Cross-module repositories or direct table access
- Impact: Big Ball of Mud and unsafe ownership
- Initial treatment: Contracts, database privileges, architecture checks
- Owner: Solution architect
- Status: open

## RISK-007 — Premature portal exposure

- Cause: Portal scope chosen before internal stability and tenant controls
- Impact: Data leakage, dual workflows, support burden
- Initial treatment: Close OQ-010; prove customer isolation first
- Owner: Project sponsor and Security architect
- Status: open

## RISK-008 — Customer or commercial data leakage

- Cause: UI-only authorization or incomplete object/tenant checks
- Impact: Commercial, legal, and trust damage
- Initial treatment: Backend policies and isolation/security verification
- Owner: Security architect
- Status: open

## RISK-009 — Non-durable Worker/Outbox

- Cause: Inappropriate Node scheduler or unobservable retries
- Impact: Missed notifications and stuck integrations
- Initial treatment: Durable scheduler ADR, leases, retries, idempotency, alerts
- Owner: Application architect
- Status: open

## RISK-010 — Backups cannot restore

- Cause: Backup success assumed without recovery evidence
- Impact: Extended outage or unrecoverable data loss
- Initial treatment: Automated restore drills and approved RPO/RTO
- Owner: Operations owner
- Status: open

## RISK-011 — Finance-Lite scope expansion

- Cause: Legal accounting boundary remains vague
- Impact: Delay, compliance gaps, duplicate finance truth
- Initial treatment: Explicit scope and external authority contract
- Owner: Finance owner
- Status: open

## RISK-012 — Operational skill and single-server limitations

- Cause: Linux/PostgreSQL skill gap and accepted absence of HA
- Impact: Longer incidents and recovery
- Initial treatment: Training, runbooks, UPS/spare host, restore drills
- Owner: Operations owner
- Status: open

## RISK-013 — Missing data ownership

- Cause: No accountable steward/RACI for codes and processes
- Impact: Invalid master data and unenforced policies
- Initial treatment: RACI, glossary ownership, validation and exception queues
- Owner: Project sponsor
- Status: open

## RISK-014 — Premature implementation

- Cause: Coding begins before UOM, routing, QC, states, and ADRs are approved
- Impact: Architecture is invented in code and requires expensive reversal
- Initial treatment: Phase gates, Cursor rule/hook, implementation authorization
- Owner: Chief Solution Architect
- Status: treating
