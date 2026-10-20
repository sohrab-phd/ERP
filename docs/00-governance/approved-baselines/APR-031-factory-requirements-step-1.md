---
id: APR-031
title: Factory purchase and receiving Step 1 documentation authority
phase: 12-implementation-planning
status: approved
version: 1.0.0
owners: [project-sponsor]
depends_on: [APR-018, APR-019, APR-030, SRC-004]
last_reviewed: 2026-10-20
approval: Actual Owner message authorizes Step 1 requirements documentation and analysis only
supersedes: null
---

# Actual Owner instruction — requirements baseline only

The Owner's 2026-10-20 message provides authoritative confirmed business findings
from on-site factory investigation, recorded as [SRC-004](../team-answers/FACTORY_PURCHASE_RECEIVING_2026-10-20.md).
It authorizes **Step 1: Authoritative Business Requirements Baseline** documentation
and analysis only: process, exact 23 fields/Persian terms, weights, identity,
relationships, numbered traceable requirements, preliminary architecture impacts,
genuine unresolved questions and independent documentation review/checks.

The new facts include pre-arrival seller PO registration, multiple lines/arrivals/
waybills, actual-unit confirmation, preserved ordered/actual discrepancies, unique
physical-unit traceability and purchasing-side receiving visibility. W1 accepted
per-unit weight is stock basis without independent destination unit weighing;
W2 mandatory waybill consignment net and W3 optional destination consignment net
remain separate and must not be allocated to units or replace W1.

These are authoritative business inputs, not blanket approval to override existing
architecture, grant permissions or modify runtime. The [derived baseline](../../02-domain-business-architecture/PURCHASE_RECEIVING_REQUIREMENTS_BASELINE.md)
is **draft / in review**, not approved by successful documentation or agent review.
Existing measured-kg/Internal Code/receipt-grain policies require explicit
reconciliation; preserve accepted behavior and no-ticket/potentially no-PO intake.
Earlier F01–F08/ticket plans must be reassessed individually, not all closed.

The Owner expressly prohibits code, migrations, APIs/API contracts, runtime
permissions and product gate changes. No technical gate/unlock is modified.
Record current scope and actual evidence only; APR-018 architecture and accepted
business capabilities remain. No direct device integration, separate ticket
capture, QC prerequisite or automatic financial/weight-difference rule is granted.

The Owner permits a coherent local documentation commit after applicable review
and checks. Never push remotely or invent factory UAT/production acceptance. No
push/acceptance confirmation is supplied for prior local preparation/translation
commits. Eleven backend capabilities remain accepted; this documentation is not
a twelfth. **Stop after Step 1** for Owner review. Step 2 gap analysis and all
implementation require a subsequent explicit authorization.
