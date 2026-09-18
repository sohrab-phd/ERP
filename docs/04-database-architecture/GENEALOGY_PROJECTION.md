---
id: DATA-GEN-001
title: Genealogy Projection Design
phase: 04-database-architecture
status: approved
version: 0.1.0
owners: [data-architect, domain-leads]
depends_on: [SM-INV-001, GOV-DATA-DICT-001, APR-005]
last_reviewed: 2026-09-18
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

Rebuild only from these authoritative facts. Entity IDs are existing
dictionary concepts, not a new schema.

| Fact | Role | Existing source entities | Write owner |
| --- | --- | --- | --- |
| Lot Origin | Supplier/certificate/receipt origin of material | ENT-MATERIAL-LOT; ENT-GOODS-RECEIPT orchestration; Inventory Unit created at post | Inventory after Goods Receipt post (`ACT-IPS` for stock identity) |
| Consumption | Input consumed by production | ENT-MATERIAL-CONSUMPTION; ENT-PRODUCTION-OPERATION; consumed ENT-INVENTORY-UNIT | Production |
| Output | Production output / WIP | ENT-PRODUCTION-OUTPUT; ENT-PRODUCTION-OPERATION; resulting ENT-INVENTORY-UNIT and/or ENT-PRODUCT-BATCH | Production |
| Residual | Child residual lineage | ENT-RESIDUAL fact; parent and child ENT-INVENTORY-UNIT | Production fact; Inventory child identity |
| Scrap | Disposition lineage | ENT-SCRAP fact; Inventory scrap movement via `ACT-IPS` | Production fact (including Quality/abort-**commanded** scrap); Inventory movement. Quality does not write stock tables (INV-017). |
| Package | Product/package relationship | ENT-PACKAGE contents refs | Shipping |
| Shipment | Package/customer shipment relationship | ENT-SHIPMENT; ENT-PACKAGE; customer/order on the shipment | Shipping |
| Rework | Rework lineage | New Production facts plus reversals of prior posted facts (`StartReworkOperation`); ENT-PRODUCTION-OPERATION | Production. No separate ENT-REWORK is minted here. |

Do not accept a user “edit genealogy” command. Projection rebuild is a
reconstruction, not a new business posting and not Event Sourcing.

## Required traces (INV-009)

- Supplier / lot → Inventory Unit → consumption → output → package →
  customer shipment
- Customer shipment → package → output → consumption → lot / supplier
- Merge, split, rework, and defective-lot impact must remain visible
  because source facts are immutable

Tracking granularity is the recorded OQ-004 hybrid grain; the first
go-live family catalogue remains configuration. Official posting
**boundary** is `CompleteProductionOperation` (OQ-003 recorded); step
**names** remain treating. Residual cutoff **numbers** stay OQ-009.

## Projection rules

- A projection row may be materialized for query speed later. If it
  disagrees with source facts, rebuild from the facts.
- Source facts remain authoritative. Editing or deleting a genealogy
  projection does not change lineage history.
- Deleting a projection row is allowed. Deleting a source fact is not
  (INV-005). Correction reverses or posts new source facts; it does not
  rewrite lineage in place.
- Reporting KPIs that summarize genealogy are also projections.
- `GenealogyRebuild` is a reconstruction worker, not `CompleteProductionOperation`,
  not `AdjustBalance`, and not a second Ledger movement.

## What this does not decide

- Graph table versus closure table versus recursive query
- Physical indexes (OQ-014 residual). Database product is PostgreSQL
  (ADR-0007 / OQ-018 recorded); packages remain residual.
- Label or barcode format (ASM-009 still unconfirmed)
- A dedicated ENT-REWORK identity (Rework remains a Production fact
  plus reversals)
