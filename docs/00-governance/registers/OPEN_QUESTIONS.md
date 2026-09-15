---
id: GOV-QUESTIONS-001
title: Open Questions Register
phase: 00-governance
status: approved
version: 0.8.0
owners: [chief-solution-architect]
depends_on: [ASM-REPORT-001, ASM-014, ASM-016, ASM-025, APR-005, APR-014, CHK-0013]
last_reviewed: 2026-09-15
approval: APR-005
supersedes: null
---

# Open Questions Register

Status values: `open`, `investigating`, `treating`, `answered`, `deferred`,
`superseded`. Severity and blocking scope are independent.

Team answers arrived as Markdown files under
[team-answers/](../team-answers/). They become authoritative only on the
matching `OQ-*` row below. Chat is not a second register. Residual gaps stay
`GUARD_OPEN_POLICY` until a later row update.

Recorded: `2026-09-15` from `docs/00-governance/team-answers/OQ-001.md`
through `OQ-019.md`. Implementation remains unauthorized. There is no
Phase 13.

## Snapshot after recording

| ID | Status | What is now locked | Still unknown |
| --- | --- | --- | --- |
| OQ-001 | treating | kg is official stock UOM; one stock truth | Decimal scale, rounding, material conversion factors |
| OQ-002 | answered | Coil quantity = measured weight in kg | Shop-floor ticket confirmation (validation, not a new choice) |
| OQ-003 | treating | Official post at `CompleteProductionOperation` | Named routing steps; abort role name |
| OQ-004 | answered | Unit-level Coil; hybrid finished-product rule | First-go-live product-family catalogue |
| OQ-005 | treating | QC can block available and ship; exceptional release needs two people | Quality Plans, limits, named approvers |
| OQ-006 | answered | Partial shipment allowed; default tolerance 0; configurable | Exact %/kg by family/customer |
| OQ-007 | answered | Close Sales Order on fulfilled/cancelled/unfulfilled demand, not payment | Commercial exceptions if any later |
| OQ-008 | answered | One Coil, one active reservation; confirmed SO has no timer expiry | Temporary-hold TTL if that type is added later |
| OQ-009 | treating | Residual vs scrap is a reuse policy, not a global kg | Family min weight/dimensions |
| OQ-010 | answered | MVP portal = visibility only; no order write | Exact document list; later price/request/order phases |
| OQ-011 | treating | Weighbridge never writes Ledger; human ticket fallback | Make/model, protocol, device id, named operator |
| OQ-012 | answered | Finance-Lite is not legal GL; no Legal-GL integration in MVP | Accounting product/API when a later phase needs it |
| OQ-013 | answered | One legal entity, one principal site | Future multi-site would reopen architecture |
| OQ-014 | treating | Modest scale: &lt;100 users, ~15–25 concurrent | 12-month transaction counts |
| OQ-015 | treating | Opening stock = Ledger facts via `OpeningStockImport` | Source files, freeze time, named signers |
| OQ-016 | answered | RPO 60 min, RTO 8 h, daily backup, off-site copy | Retention days; backup product |
| OQ-017 | answered | App-owned bundle in a PostgreSQL transaction + locks | PG functions only after a later ADR + spike |
| OQ-018 | answered | Modular Monolith + PostgreSQL; Node.js + TypeScript | NestJS, Prisma, React, Docker, auth package, extra MCP |
| OQ-019 | treating | Role/RACI list accepted | Real names, delegates, approval scope |

Inquiry/Quotation expiry remains FIND-026 (`workshop-commercial-practice`),
not a new `OQ-*`. Extra MCP remains “none by default” under OQ-018.

---

## OQ-001 — Authoritative UOM matrix

- Answer owner: Data Steward / Inventory / Sales / Production
- Severity: critical
- Status: treating
- Source: [OQ-001.md](../team-answers/OQ-001.md)
- Recorded: `2026-09-15`

### Recorded answer

Kilogram is the authoritative stock UOM for Coil and other raw Inventory
Units. Ledger postings use kg. Length, piece, and bundle may be stored as
secondary/commercial quantities and must not form a second stock truth.
Conversions must be explicit and material-specific. Exact decimal
arithmetic is required; JavaScript `Number` is not authoritative for
weight or money. PostgreSQL `NUMERIC` and a TypeScript decimal type are
the intended representations.

### Still unknown

Decimal scale, rounding rule, and material-specific conversion factors.
Commands that need those numbers remain `GUARD_OPEN_POLICY`.

### Promoted to

ASM-003 kept (weight-first). RISK-004 treatment confirmed. No signed
conversion matrix yet.

---

## OQ-002 — Coil quantity semantics

- Answer owner: Inventory / Warehouse / Production
- Severity: critical
- Status: answered
- Source: [OQ-002.md](../team-answers/OQ-002.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

**A — Weight is authoritative.** A Coil’s inventory quantity is measured
weight in kg. Length may be measured or calculated and must not change
availability or Ledger. Reservation, issue, consumption, residual, scrap,
balance, and mass-balance use weight. A Coil without length remains valid.

Example recorded in the source file: Coil C-00125 at 12,480.500 kg.

### Still unknown

Confirmation against actual scale tickets (validation of this decision,
not an open choice).

### Promoted to

ASM-003 kept. OQ-001 residual still covers scale/rounding.

---

## OQ-003 — Production routing and posting points

- Answer owner: Production / MES
- Severity: critical
- Status: treating
- Source: [OQ-003.md](../team-answers/OQ-003.md)
- Recorded: `2026-09-15`

### Recorded answer

No universal hard-coded route. Official consume/output/residual/scrap post
together at `CompleteProductionOperation` as one business transaction.
Skip only when the approved routing version marks the step optional.
Abort before posted inventory facts follows normal production
authorization; after posted facts, abort needs a production-supervisor /
production-manager role and compensating commands. Routing is versioned
per product family.

### Still unknown

First-go-live step names, work centers, and the exact abort role title.
Skip/abort that needs a missing step stays `GUARD_OPEN_POLICY`.

---

## OQ-004 — Tracking granularity

- Answer owner: Production / Quality / Data Steward
- Severity: critical
- Status: answered
- Source: [OQ-004.md](../team-answers/OQ-004.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

Raw Coils: unit-level `InventoryUnit`, with Material Lot as origin
context. Finished product: unit-level when independently handled;
batch-level when homogeneous. Packages/pallets: unit-level when
independently moved. Scrap: quantity on the operation by default.
Reusable residual: its own Inventory Unit. Genealogy stays
Lot → Unit → Operation → Batch → Finished unit → Package → Shipment.

### Still unknown

The first-go-live product-family tracking catalogue (application of this
rule, not a new grain).

### Promoted to

ASM-004 replaced: batch is not always enough for finished goods.

---

## OQ-005 — Quality plans and release authority

- Answer owner: Quality (names via OQ-019)
- Severity: critical
- Status: treating
- Source: [OQ-005.md](../team-answers/OQ-005.md)
- Recorded: `2026-09-15`

### Recorded answer

Required incoming QC blocks Available. Required in-process/final QC
blocks Ship-Eligible. Quality decides; Inventory applies state.
Conditional Release is an explicit auditable command. Exceptional
release needs an authorized Quality role **and** a second distinct
person. Shipping/ordinary Inventory must not override a hold.

Recommended roles: QC Inspector; Quality Engineer / QC Supervisor;
Quality Manager (conditional/exceptional); Second Authorized Approver.

### Still unknown

First-go-live Quality Plans, checks, limits, sample sizes, and named
people (OQ-019). Missing plan/limit → `GUARD_OPEN_POLICY`.

---

## OQ-006 — Fulfillment tolerances

- Answer owner: Sales / Production / Shipping
- Severity: high
- Status: answered
- Source: [OQ-006.md](../team-answers/OQ-006.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

Partial shipment is allowed when the order line allows it. Under-delivery,
over-delivery, and over-production default to **zero** unless an explicit
percentage or absolute tolerance exists on the line/policy. Ordered qty
stays immutable. Outside-tolerance needs an authorized, auditable
exception — not a silent UI bypass.

### Still unknown

Exact %/kg by product, customer, or order type (configuration under this
rule).

### Promoted to

FIND-003 resolved.

---

## OQ-007 — Sales Order closure rule

- Answer owner: Sales / Finance-Lite
- Severity: high
- Status: answered
- Source: [OQ-007.md](../team-answers/OQ-007.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

Close the Sales Order when all demand is delivered **or** remaining
demand is cancelled / authorized Unfulfilled. Payment does not close the
Sales Order. An unpaid invoice may remain open after SO close. Sales
must not write payment state to close an order.

`CloseSalesOrder` is no longer `GUARD_OPEN_POLICY` for the missing rule.
It still rejects if unresolved demand remains.

---

## OQ-008 — Reservation policy

- Answer owner: Inventory / Sales / Production
- Severity: high
- Status: answered
- Source: [OQ-008.md](../team-answers/OQ-008.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

One Inventory Unit, one active reservation. Earlier confirmed Sales Order
wins; the later order does not steal the Coil. Under-consumption releases
remainder to Available or `CreateResidualUnit`. Confirmed-order
reservations do **not** auto-expire on a 24h/72h timer. They end on
fulfillment, explicit release, cancel, Unfulfilled, or authorized
exception. `ReservationExpirySweep` is cleanup for orphans/stale rows,
not a TTL on confirmed SO reservations.

### Still unknown

TTL only if a later temporary planning-hold reservation type is added.

---

## OQ-009 — Reusable residual threshold

- Answer owner: Production / Inventory / Quality
- Severity: high
- Status: treating
- Source: [OQ-009.md](../team-answers/OQ-009.md)
- Recorded: `2026-09-15`

### Recorded answer

Residual vs scrap is a family-specific reuse policy. Residual = issuable
independent Inventory Unit with genealogy. Scrap = non-reusable
disposition via `PostScrapMovement`. No universal 50 kg / 200 mm.
`CreateResidualUnit` is the residual command.

### Still unknown

Minimum weight/dimensions by family. Classification that needs a missing
threshold stays `GUARD_OPEN_POLICY`.

---

## OQ-010 — Customer Portal phase

- Answer owner: Sponsor / Sales
- Severity: critical
- Status: answered
- Source: [OQ-010.md](../team-answers/OQ-010.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

MVP portal = **visibility only**. Authenticated customers may see order,
fulfillment, shipment, and authorized invoice/documents under isolation.
No `PortalPlaceOrder`, no customer-created orders/reservations, no second
Sales write path. Prices are not shown by default. Internal genealogy is
not dumped to customers. Later phases may add request, prices, order, and
safe trace views after internal purchase-to-delivery is proven.

### Still unknown

Exact customer-facing document list and commercial/security approval of
that list.

### Promoted to

FIND-001 resolved. INV-020 / `GUARD_PORTAL_MVP` remain for order write.
`ADP-PORTAL` may do isolated reads.

---

## OQ-011 — Weighbridge integration

- Answer owner: Integration / Inventory (device facts)
- Severity: high
- Status: treating
- Source: [OQ-011.md](../team-answers/OQ-011.md)
- Recorded: `2026-09-15`

### Recorded answer

Weighbridge never writes Ledger. Path: device → adapter →
`PostGoodsReceipt` / `WI-BUNDLE-GR`. Duplicate detection uses a stable
device ticket/transaction id when the device supplies one. Until
make/model/protocol exist, auto-integration stays `GUARD_OPEN_POLICY` /
`SPIKE-DEVICE`. First-go-live fallback: human posts from the printed
ticket using the **same** Goods Receipt command.

### Still unknown

Make, model, location, protocol, stable device id, named GR operator.

---

## OQ-012 — Legal accounting integration

- Answer owner: Finance / external accounting owner
- Severity: high
- Status: answered
- Source: [OQ-012.md](../team-answers/OQ-012.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

MVP Finance-Lite is operational invoices/payments/allocations only, not
statutory GL, CoA, tax, or legal statements. No Legal-GL connector in
MVP. Do not invent a product or protocol. Keep an export/sync boundary
for a later adapter. Inventory/Sales/Shipping/Production must not depend
on Legal GL.

### Still unknown

Product, version, API/file when a later phase actually integrates.

### Promoted to

ASM-010 kept (external accounting remains legal authority; MVP does not
implement that system).

---

## OQ-013 — Organization and site model

- Answer owner: Project Sponsor
- Severity: high
- Status: answered
- Source: [OQ-013.md](../team-answers/OQ-013.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

First go-live: **one legal entity, one principal factory site**. Multiple
warehouses/areas on that site are allowed and are not extra companies or
sites. Customer isolation is not multi-company tenancy. A second company
or site is an explicit reopen (numbering, tenancy, authorization,
accounting, reporting, deployment).

### Promoted to

ASM-001 kept / confirmed for first go-live.

---

## OQ-014 — Data and transaction volumes

- Answer owner: Operations / Sponsor
- Severity: medium
- Status: treating
- Source: [OQ-014.md](../team-answers/OQ-014.md)
- Recorded: `2026-09-15`

### Recorded answer

Modest-scale planning: fewer than 100 users, about 15–25 concurrent,
single site, PostgreSQL, Modular Monolith. Do not freeze indexes, storage,
or hardware from invented million-row months. Monthly GR, Coil, order
lines, operations, ledger rows, and shipments remain TBD.

### Still unknown

The 12-month counts (system / Excel / signed estimate).

### Promoted to

ASM-002 kept as planning baseline, not a measured limit.

---

## OQ-015 — Opening-stock cutover

- Answer owner: Inventory / Sponsor / Security (names via OQ-019)
- Severity: critical
- Status: treating
- Source: [OQ-015.md](../team-answers/OQ-015.md)
- Recorded: `2026-09-15`

### Recorded answer

Opening stock comes from a controlled physical count, optional cutover
worksheet, and reconciliation. Excel is a cutover input, not live truth.
Procedure: freeze → count → discrepancy list → investigation → named
sign-off → `ADP-CUTOVER` / `OpeningStockImport` as Ledger facts →
BalanceRebuild and GenealogyRebuild. No Balance-only row. No
`AdjustBalance`. `ADP-CUTOVER` stays `GUARD_OPEN_POLICY` until source
files, freeze time, and named signers exist.

### Still unknown

Source files, freeze date/time, discrepancy workflow details, named
signatories.

---

## OQ-016 — Recovery objectives and retention

- Answer owner: Management / operations
- Severity: high
- Status: answered
- Source: [OQ-016.md](../team-answers/OQ-016.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

RPO ≤ 60 minutes. RTO ≤ 8 hours. Daily PostgreSQL backups, off-site copy,
protected storage, completion monitoring, periodic restore tests including
Ledger/Balance/Genealogy checks. Restore the database; do not rebuild
truth from UI caches. Retention days stay configurable (legal). This does
not require Kubernetes, Redis, or multi-region. ADR-0008 (Docker topology)
is **not** accepted by this row.

### Still unknown

Retention days and backup product/vendor.

---

## OQ-017 — Inventory Posting mechanism

- Answer owner: Architecture (team-accepted)
- Severity: critical
- Status: answered
- Source: [OQ-017.md](../team-answers/OQ-017.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

Application/domain owns the business command. Each posting runs in an
explicit PostgreSQL transaction: lock → validate → write Ledger facts →
commit. PostgreSQL enforces FKs, uniques, checks, isolation, row locks.
Stored functions are **not** the default posting kernel; they need a later
ADR plus spike. Balance/Genealogy stay projections. Retryable commands
must be idempotent. ORM must not be a second stock writer.

### Promoted to

FIND-004 resolved. Depends on accepted ADR-0007 (PostgreSQL) via OQ-018.

---

## OQ-018 — Architecture and Node.js platform ADR set

- Answer owner: Sponsor constraints + architecture direction
- Severity: critical
- Status: answered
- Source: [OQ-018.md](../team-answers/OQ-018.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

**Constraints:** small-team maintainability; Windows for development;
Linux production; no Windows Server production dependency; on-premises
capable; no required cloud vendor; no Kubernetes/Kafka/RabbitMQ/Redis /
service-per-domain unless a later evidence-based approval.

**Accept ADR-0006 direction:** Modular Monolith, one deployable, bounded
modules, one Ledger writer.

**Accept ADR-0007 direction:** PostgreSQL is the transactional system of
record.

**Keep:** Node.js + TypeScript (ADR-0001). Do not reintroduce .NET.

**Do not freeze:** NestJS, Prisma (may be evaluated; must not be the
posting kernel), React, Socket.IO, auth packages, test runner, Docker
Compose/Nginx topology (ADR-0008 stays proposed). Extra MCP: **none**
unless a named server has purpose, security boundary, and owner.

### Promoted to

ADR-0006 accepted. ADR-0007 accepted. ADR-0008 remains proposed.
FIND-002 remains resolved (packages still not defaults).

---

## OQ-019 — Named workshop and sign-off participants

- Answer owner: **Project Sponsor must supply names**
- Severity: high
- Status: treating
- Source: [OQ-019.md](../team-answers/OQ-019.md)
- Recorded: `2026-09-15`

### Recorded answer

Role/RACI baseline accepted. Required roles: Project Sponsor; Project
Manager / Product Owner; Operations / Factory; Inventory / Warehouse
Manager; Production; Sales / Commercial; Procurement; Quality Manager /
QC Supervisor; Finance; IT / Infrastructure; Security / IAM; ERP
Architecture / Technical Lead. SoD: operator is not sole approver of
that transaction; cutover and exceptional QC need independent
authorization. Chat is not organizational sign-off.

### Still unknown

Every real full name, delegate or `none`, attendance, and approval
scope. Temporary roster names still have **no** authority. Workshop
execution, SV-013 second person, PO approve, and cutover sign-off stay
blocked until names exist.

Architecture will not invent names.

---

## Consistency after recording

| Check | Result |
| --- | --- |
| OQ-017 vs OQ-018 | Posting style uses PostgreSQL transactions because ADR-0007 is now accepted. Functions still later. |
| OQ-010 vs INV-020 | Visibility allowed; order write still forbidden. |
| OQ-019 | Roles listed; names still treating. |
| OQ-001 vs OQ-002 | kg official and weight authoritative; scale/rounding still treating on OQ-001. |
| OQ-008 vs sweep | Confirmed SO has no invented TTL. |
| OQ-012 vs ASM-010 | Legal books stay outside MVP; product unnamed on purpose. |
| ADR-0008 | Not accepted. OQ-016 numbers are not a Docker freeze. |
| NestJS / Prisma / React | Candidates only. |
| Implementation | Still unauthorized. No unlock file. |
