---
id: DATA-GEN-001
title: Genealogy Projection Design
phase: 04-database-architecture
status: approved
version: 0.1.0
owners: [data-architect, domain-leads]
depends_on: [SM-INV-001, GOV-DATA-DICT-001, APR-005]
last_reviewed: 2026-09-16
approval: APR-006
supersedes: null
---

# Genealogy Projection Design

Genealogy Link (TERM-025 / ENT-GENEALOGY-LINK) is a rebuildable query
projection (INV-019). It is not independently editable source truth.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Rebuild source (FIND-G-014)

**Canonical rebuild inputs are the source-fact table below**, not Ledger
rows alone.

- **BalanceRebuild** always uses Inventory Ledger (INV-001).
- **GenealogyRebuild** uses the writable source facts in this document
  (INV-009, INV-019). Those include Production consumption/output/
  residual/scrap facts and Shipping package/shipment facts. Ledger does
  not carry customer/order package edges required for INV-009 traces.
- Opening-stock cutover (OQ-015) runs GenealogyRebuild after opening
  Ledger/Lot/Unit facts exist. At that moment those inventory-origin
  facts are the available genealogy inputs. OQ-015 does not replace this
  catalogue for live operations after consumption, output, pack, or ship.

Recovery labels that say “rebuild Genealogy from Ledger” mean: restore
durable posted facts, then run `GenealogyRebuild` from this catalogue.
They must not be read as Ledger-only genealogy.

## Source facts (writable)

Rebuild only from these authoritative facts:

| Fact | Write owner |
| --- | --- |
| Material Lot origin (supplier / certificate / receipt) | Inventory after Goods Receipt post |
| Material Consumption | Production |
| Production Output | Production |
| Residual parent → child unit | Production fact; Inventory child identity |
| Scrap | Production or Quality fact; Inventory movement |
| Package contents | Shipping |
| Shipment contents and customer/order | Shipping |
| Rework (new facts; prior posted facts reversed, not edited) | Production |

Do not accept a user “edit genealogy” command.

## Required traces (INV-009)

- Supplier / lot → Inventory Unit → consumption → output → package →
  customer shipment
- Customer shipment → package → output → consumption → lot / supplier
- Merge, split, rework, and defective-lot impact must remain visible
  because source facts are immutable

Tracking granularity (batch vs bundle vs piece) stays OQ-004. Official
posting points stay OQ-003. Residual cutoff stays OQ-009.

## Projection rules

- A projection row may be materialized for query speed later. If it
  disagrees with source facts, rebuild from the facts.
- Deleting a projection row is allowed. Deleting a source fact is not
  (INV-005).
- Reporting KPIs that summarize genealogy are also projections.

## What this does not decide

- Graph table versus closure table versus recursive query
- Database product (OQ-018)
- Volume-driven indexes (OQ-014)
- Label or barcode format (ASM-009 still unconfirmed)
