---
id: DATA-CUTOVER-001
title: Retention, Migration, and Opening Stock
phase: 04-database-architecture
status: approved
version: 0.1.0
owners: [data-architect, inventory-domain-owner]
depends_on: [SM-INV-001, APR-005]
last_reviewed: 2026-09-06
approval: APR-006
supersedes: null
---

# Retention, Migration, and Opening Stock

Logical cutover and retention rules. Named people, freeze procedures,
source-system lists, RPO/RTO, and retention days stay unanswered
(OQ-015, OQ-016). No migration script or opening-balance spreadsheet is
authorized here.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Opening stock (OQ-015)

The system cannot become stock truth until an opening Ledger posting
exists for every live Inventory Unit that will be used after go-live
(INV-001, RISK-002).

Required logical facts when cutover runs — values not invented:

| Fact | Writer | Open |
| --- | --- | --- |
| Freeze instant | recorded on the cutover command | who freezes stays OQ-015 / OQ-019 |
| Source identity of each opening unit | Inventory | source list stays OQ-015 |
| Opening Ledger row (direction = opening) | ACT-IPS | qty type OQ-001, OQ-002 |
| Matching Balance projection | ACT-IPS | rebuilt from Ledger |
| Discrepancy record if count ≠ source | Inventory / Quality as commanded | workflow stays OQ-015 |
| Sign-off role | audit on the command | named person OQ-019 |

Until those answers exist, an opening-stock command that needs a named
sign-off or a freeze procedure is `GUARD_OPEN_POLICY` / OQ-015.

Opening stock is a posted Ledger fact. It is corrected by reversal, not
by editing the opening row (INV-005).

Excel or a prior list may be a **source**. It must not remain a second
stock writer after posting (RISK-001).

## Historical commercial cutover

Inquiry, Quotation, Sales Order, Purchase Order, Invoice, and Payment
may be opened as snapshots (INV-014) or left out of MVP if the workshop
says they start empty. That choice is not invented here. If they are
loaded, they use the same reversal rule and the same SoD on correction.

Legal accounting history stays in the external books (OQ-012, ASM-010).
This system must not import a legal GL as if it owned it.

## Genealogy at cutover

If live units have known parent lots, record Lot and Unit facts, then
rebuild Genealogy Link. Do not load a standalone genealogy spreadsheet
as truth (INV-019, RISK-005). Unknown parents are allowed; the
projection then starts at the opening unit.

## Retention (OQ-016)

INV-014 and ASM-012 require that posted snapshots and correction
evidence are kept. How many days, whether an off-site copy exists, RPO,
and RTO stay OQ-016.

Until that answer:

- Do not delete posted Ledger, Invoice, Payment, consumption, output,
  residual, scrap, or shipment facts.
- A projection (Balance, Genealogy Link, KPI) may be dropped and rebuilt.
- Backup and recovery numbers in any source document remain proposals,
  not commitments.

## What this does not authorize

- A cutover RACI using Temporary \* `(temporary)` names
- A retention day count
- An ETL package, CSV schema, or migration runner
- Treating opening stock as a Balance-only write without Ledger
