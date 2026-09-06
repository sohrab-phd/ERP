---
id: QA-SCN-001
title: Scenario Catalogue
phase: 07-testing-quality-architecture
status: in_review
version: 0.1.0
owners: [qa-architect, domain-leads]
depends_on: [SM-SEQ-001, SM-EXC-001, QA-STRAT-001, APR-008]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# Scenario Catalogue

Named golden-path and exception scenarios. They are the Phase 03
sequences plus rejection and correction cases. They are not executable
scripts and not a `TEST-*` ID set.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Golden paths (from SM-SEQ-001)

| ID | Sequence | Stops open |
| --- | --- | --- |
| `QA-SCN-STOCK` | SEQ-STOCK sell available stock through invoice/payment | CloseSalesOrder OQ-007; over-delivery OQ-006 |
| `QA-SCN-PURCHASE` | SEQ-PURCHASE buy then fulfill | ApprovePurchaseOrder OQ-019; inbound QC OQ-005 |
| `QA-SCN-MAKE` | SEQ-MAKE allocate, produce, residual/scrap, then ship | Routing OQ-003; residual cutoff OQ-009; mass balance OQ-006 |
| `QA-SCN-NOT-FEASIBLE` | SEQ-NOT-FEASIBLE demand without an order | none as a path; not overdue |

A step whose guard is an unanswered OQ is an expected
`GUARD_OPEN_POLICY` outcome, not a failed scenario.

## Exception and rejection scenarios

| ID | What must be shown | Traces to |
| --- | --- | --- |
| `QA-SCN-REJECT-OPEN` | Command needing an unanswered OQ rejects; no posted fact | THR-012, INV-016 |
| `QA-SCN-REJECT-ACTOR` | Temporary identity → `GUARD_ACTOR` | SEC-002 |
| `QA-SCN-REJECT-PORTAL` | PortalPlaceOrder → `GUARD_PORTAL_MVP` | INV-020 |
| `QA-SCN-CONFLICT` | Second concurrent writer on the same unit/order → `GUARD_CONFLICT` or `GUARD_STATE` | SM-CONC-001 |
| `QA-SCN-IDEMPOTENT` | Retry same key returns first result; no second GR/dispatch/payment/completion | INV-016 |
| `QA-SCN-REVERSE` | ReverseGoodsReceipt / ReversePayment is a new command with a new key | INV-005 |
| `QA-SCN-SOD` | VoidInvoice without a second distinct identity rejects | SV-007 |
| `QA-SCN-ISOLATION` | Customer A query does not return customer B | SV-005 |
| `QA-SCN-QC-HOLD` | Required QC pending blocks ship/available | INV-010 |
| `QA-SCN-SHIP-NO-DEMAND` | DraftShipment without order needs exceptional authority; named person open | INV-011, OQ-019 |
| `QA-SCN-UNFULFILLED` | STOCK/PURCHASE/MAKE not feasible records Unfulfilled Demand; not overdue | INV-013 |
| `QA-SCN-PAUSE-RESUME` | Production Order PAUSED then ResumeProductionOrder | FIND-027 |

## Must not exist as scenarios that pass in MVP

- Portal customer places an order
- EditGenealogy
- AdjustBalance
- Quality or Shipping writes Ledger

## Must not decide here

- Step-count SLAs
- Fixture data volumes (OQ-014)
- Named UAT actors (OQ-019)
