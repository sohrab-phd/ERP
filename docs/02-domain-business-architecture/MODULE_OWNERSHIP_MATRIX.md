---
id: DOM-OWN-001
title: Module Capability and Data-Ownership Matrix
phase: 02-domain-business-architecture
status: approved
version: 0.2.1
owners: [chief-solution-architect, data-architect]
depends_on: [GOV-DATA-DICT-001, DOM-CAP-BC-001]
last_reviewed: 2026-09-06
approval: APR-004
supersedes: null
---

# Module Capability and Data-Ownership Matrix

## Purpose

State, for each conceptual entity, exactly one write owner, who may read, and
who may command. This matrix refines
[GOV-DATA-DICT-001](../00-governance/registers/CANONICAL_DATA_DICTIONARY.md) and
[DOM-CAP-BC-001](CAPABILITY_BOUNDED_CONTEXT_MAP.md). It does not authorize
tables, columns, keys, schemas, or migrations.

`IMPLEMENTATION_AUTHORIZED` remains `false`. Node.js + TypeScript (ADR-0001) is
the only accepted technology ADR; persistence mechanism remains open (OQ-017,
OQ-018).

## Scope

- In scope: conceptual ownership for the entities listed below; one-write-owner
  rule; Quality and Shipping as inventory *commanders*, not stock writers;
  GenealogyLink as a projection.
- Out of scope: physical design, ENT-* invention beyond the dictionary,
  closing dictionary validation statuses, and portal module writes.

## Sources and dependencies

- Dictionary: GOV-DATA-DICT-001.
- Domain boundaries: [GOV-DOMAIN-001](../00-governance/registers/CANONICAL_DOMAIN_MODEL.md),
  DOM-CAP-BC-001.
- Glossary: [GOV-GLOSSARY-001](../00-governance/registers/BUSINESS_GLOSSARY.md).
- Actors: [DOM-ACTORS-001](ACTOR_RESPONSIBILITY_CATALOGUE.md).

Phase 02 promoted the previously missing conceptual IDs into GOV-GLOSSARY-001
and GOV-DATA-DICT-001 (FIND-021). Coil remains a kind of Inventory Unit, not a
separate ENT-*. Delivery confirmation remains a Shipment lifecycle fact under
TERM-017 / ENT-SHIPMENT.

## Design

### One write owner rule

Every authoritative concept has **exactly one write owner**. Other bounded
contexts interact through commands/contracts and may hold immutable references
or read projections (GOV-DOMAIN-001). Direct cross-module table writes are
forbidden (INT-001).

Split facts that the dictionary already records as dual-authority are modeled
as **two concepts**, not two writers of one table:

- [Residual](../00-governance/registers/BUSINESS_GLOSSARY.md#term-012--residual)
  (TERM-012) **fact** vs resulting Inventory Unit identity/quantity.
- [Scrap](../00-governance/registers/BUSINESS_GLOSSARY.md#term-013--scrap)
  (TERM-013) **fact** vs associated stock movement.
- [Goods Receipt](../00-governance/registers/BUSINESS_GLOSSARY.md#term-019--goods-receipt)
  (TERM-019) **commercial orchestration** vs Inventory posting.

Quality and Shipping **request** inventory lifecycle changes. They **do not
write** Ledger, Balance, or Inventory Unit stock tables.

### Command vs write

- **Write owner**: the only context allowed to persist authoritative mutation.
- **May-command**: may issue an authorized application/domain command that the
  write owner (or Inventory Posting Service) executes.
- **May-read**: may read canonical state or a governed projection; not a write
  path.

Inventory Posting Service is the proposed unique writer of Ledger, Balance, and
stock-movement effects (mechanism open: OQ-017).

### Ownership matrix

First-use glossary links appear in the Concept column.

| Concept | Dictionary / term | Write owner | May-read | May-command | Must not write |
| --- | --- | --- | --- | --- | --- |
| [Customer](../00-governance/registers/BUSINESS_GLOSSARY.md#term-001--customer) | ENT-CUSTOMER / TERM-001 | `BC-SALES` | Procurement, Shipping, Finance-Lite, Quality, Reporting, Identity (isolation), optional deferred portal read if OQ-010 later allows visibility | Identity (principal linkage); Integration adapters mapped to Sales commands | Portal module, Inventory, Production |
| [Inquiry](../00-governance/registers/BUSINESS_GLOSSARY.md#term-002--inquiry) | ENT-INQUIRY / TERM-002 | `BC-SALES` | Reporting, optional deferred portal visibility | optional deferred portal *request* into Sales if OQ-010 later allows; not MVP ordering | All other BCs |
| [Quotation](../00-governance/registers/BUSINESS_GLOSSARY.md#term-020--quotation) | ENT-QUOTATION / TERM-020 | `BC-SALES` | Reporting; Finance-Lite commercial snapshot consumers | none outside Sales | Inventory, Portal as writer |
| [Sales Order](../00-governance/registers/BUSINESS_GLOSSARY.md#term-003--sales-order) / Item | ENT-SALES-ORDER, ENT-SALES-ORDER-ITEM / TERM-003 | `BC-SALES` | Inventory, Production, Shipping, Finance-Lite, Quality, Reporting, Audit | Inventory (reservation), Procurement (purchase need), Production (make need), Shipping (authorized demand reference) | Inventory stock tables; Portal ordering (deferred from MVP pending OQ-010) |
| [Fulfillment Assessment](../00-governance/registers/BUSINESS_GLOSSARY.md#term-004--fulfillment-assessment) | ENT-FULFILLMENT-ASSESSMENT / TERM-004 | `BC-SALES` | Procurement, Production, Inventory, Reporting | Inventory availability read is not a write; resulting reservation/PO/production are separate commands | Inventory, Procurement, Production records |
| [Unfulfilled Demand](../00-governance/registers/BUSINESS_GLOSSARY.md#term-005--unfulfilled-demand) | ENT-UNFULFILLED-DEMAND / TERM-005 | `BC-SALES` | Reporting | none required for stock | Sales Order must not be required; Inventory must not infer lost demand |
| [Supplier](../00-governance/registers/BUSINESS_GLOSSARY.md#term-021--supplier) | ENT-SUPPLIER / TERM-021 | `BC-PROCUREMENT` | Inventory (certificate/lot reference), Quality, Reporting | none for stock | Inventory, Sales |
| [Purchase Order](../00-governance/registers/BUSINESS_GLOSSARY.md#term-022--purchase-order) | ENT-PURCHASE-ORDER / TERM-022 | `BC-PROCUREMENT` | Inventory, Quality, Sales, Reporting | Inventory posting of receipt when GoodsReceipt reaches posting | Ledger/Balance |
| GoodsReceipt (commercial orchestration) | ENT-GOODS-RECEIPT / TERM-019 orchestration side | `BC-PROCUREMENT` | Warehouse, Quality, Inventory, Audit | `BC-INVENTORY` / Inventory Posting Service to post lot/unit stock; `BC-QUALITY` inbound inspection | Ledger, Balance, Inventory Unit quantity |
| [Material Lot](../00-governance/registers/BUSINESS_GLOSSARY.md#term-006--material-lot) | ENT-MATERIAL-LOT / TERM-006 | `BC-INVENTORY` **proposed**; dictionary still requires Phase 02 confirmation | Procurement (immutable source refs), Quality, Production, Reporting | Procurement may command lot creation as a *result of* posting, not by writing the lot | Procurement must not persist stock identity as a second owner |
| Inventory Unit / [Coil](../00-governance/registers/BUSINESS_GLOSSARY.md#term-008--coil) | ENT-INVENTORY-UNIT / TERM-007, TERM-008 | `BC-INVENTORY` | Sales, Production, Quality, Shipping, Warehouse, Reporting | Production (issue/consume/residual unit), Quality (hold/release), Shipping (pack/ship exit), Sales (reservation claim) | Quality, Shipping, Sales, Procurement, Production **tables** |
| Ledger | ENT-INVENTORY-LEDGER | Inventory Posting Service | Inventory, Audit, Reporting, owning requesters of their own movements | All stock-effect commands from Sales, Procurement, Production, Quality, Shipping, Warehouse, cutover (OQ-015) | Any BC other than Inventory Posting Service |
| Balance | ENT-INVENTORY-BALANCE | Inventory Posting Service | Sales, Production, Shipping, Quality, Reporting | none directly — Balance is a projection of Ledger under the proposed pattern | Any BC other than Inventory Posting Service; Reporting must not adjust Balance |
| [Reservation](../00-governance/registers/BUSINESS_GLOSSARY.md#term-009--reservation) | ENT-RESERVATION / TERM-009 | `BC-INVENTORY` | Sales, Production, Reporting | Sales (claim/release), Production (must not confuse with TERM-010 Allocation) | Sales writing reservation rows; Production writing reservation as allocation |
| [Material Allocation](../00-governance/registers/BUSINESS_GLOSSARY.md#term-010--material-allocation) | ENT-MATERIAL-ALLOCATION / TERM-010 | `BC-PRODUCTION` | Inventory, Quality, Reporting | Inventory issue of the allocated unit | Inventory writing allocation as Reservation; Sales writing allocation |
| [Production Order](../00-governance/registers/BUSINESS_GLOSSARY.md#term-011--production-order) | ENT-PRODUCTION-ORDER / TERM-011 | `BC-PRODUCTION` | Sales, Inventory, Quality, Reporting | Inventory issue/return; Quality in-process/final inspection | Inventory stock tables |
| Production Operation | ENT-PRODUCTION-OPERATION; open pending OQ-003 | `BC-PRODUCTION` | Inventory, Quality, Reporting | Inventory posting at official posting points (unvalidated) | Inventory, Quality |
| Consumption | ENT-MATERIAL-CONSUMPTION | `BC-PRODUCTION` | Inventory, Quality, Reporting, Genealogy projection | Inventory Posting Service for stock decrement | Inventory writing the transformation fact |
| Output | ENT-PRODUCTION-OUTPUT | `BC-PRODUCTION` | Inventory, Quality, Shipping, Reporting | Inventory Posting Service for stock increment / WIP | Inventory writing the transformation fact |
| Residual fact | ENT-RESIDUAL / TERM-012; open pending OQ-009 | `BC-PRODUCTION` (fact) | Inventory, Quality, Reporting | Inventory Posting Service to create child unit and close/split parent | Production writing Ledger/Balance |
| Residual resulting unit | TERM-012 inventory side | `BC-INVENTORY` | Production, Quality, Sales, Reporting | Production residual-completion command | Production writing unit identity as a second owner |
| Scrap fact | ENT-SCRAP / TERM-013 | `BC-PRODUCTION` (creation/disposition fact) | Inventory, Quality, Reporting | Inventory Posting Service where scrap changes inventory | Production writing Ledger/Balance |
| Scrap stock movement | ENT-SCRAP inventory side | Inventory Posting Service | Production, Audit, Reporting | Production/Quality scrap or reject commands | Quality writing stock tables |
| [Product Batch](../00-governance/registers/BUSINESS_GLOSSARY.md#term-014--product-batch) | ENT-PRODUCT-BATCH / TERM-014; open pending OQ-004 | `BC-PRODUCTION` | Quality, Shipping, Inventory, Reporting | Quality release; Shipping pack/ship | Shipping writing batch identity |
| QualityInspection | ENT-QUALITY-INSPECTION; open pending OQ-005 | `BC-QUALITY` | Inventory, Production, Shipping, Procurement, Reporting | Inventory hold/quarantine/release; Shipping shipment-gate | Ledger, Balance, Inventory Unit quantity |
| [Package](../00-governance/registers/BUSINESS_GLOSSARY.md#term-023--package) | ENT-PACKAGE / TERM-023 | `BC-SHIPPING` | Inventory, Quality, Sales, Reporting | Inventory pack-state posting if required by later Phase 03 | Inventory writing Package as shipment workflow |
| [Shipment](../00-governance/registers/BUSINESS_GLOSSARY.md#term-017--shipment) | ENT-SHIPMENT / TERM-017 | `BC-SHIPPING` | Sales, Inventory, Finance-Lite, Quality, Reporting | Inventory Posting Service for definitive stock exit on dispatch | Ledger/Balance; Sales writing shipment rows |
| Invoice | ENT-INVOICE; legal boundary pending OQ-012 | `BC-FINANCE-LITE` ([Finance-Lite](../00-governance/registers/BUSINESS_GLOSSARY.md#term-018--finance-lite), TERM-018) | Sales, Shipping, Reporting, Integration (export candidate) | none for stock | External accounting tables (out of this system); Sales writing invoices |
| [Payment](../00-governance/registers/BUSINESS_GLOSSARY.md#term-024--payment) | ENT-PAYMENT / TERM-024 | `BC-FINANCE-LITE` | Sales, Reporting | none for stock | Inventory, legal GL |
| [Genealogy Link](../00-governance/registers/BUSINESS_GLOSSARY.md#term-025--genealogy-link) | ENT-GENEALOGY-LINK / TERM-025 **projection** | **none as independent truth** — `BC-REPORTING` may materialize a rebuildable projection | Sales, Quality, Shipping, Procurement, Audit (authorized) | none — must not be edited as source | Any module writing GenealogyLink without rebuilding from Consumption, Output, Residual, Scrap, Package, Shipment facts |

### Quality and Shipping versus stock tables

Normative restatement of ASM-REPORT-001 section 4:

- `BC-QUALITY` owns inspection evidence and disposition. On hold, quarantine,
  reject, or [Released](../00-governance/registers/BUSINESS_GLOSSARY.md#term-016--released)
  (TERM-016), it **commands** `BC-INVENTORY`. It does not write Ledger, Balance,
  or Inventory Unit stock columns.
- `BC-SHIPPING` owns Package, Shipment, dispatch, and delivery. On dispatch it
  **commands** definitive stock exit. It does not write stock tables.

### Portal and GenealogyLink

- No confirmed portal write owner. Customer Portal **ordering is formally
  deferred from MVP** pending OQ-010. Visibility/request remain optional
  deferred and, if later allowed, command `BC-SALES` rather than writing Sales
  entities from a portal module (FIND-001 remains open).
- Genealogy source facts stay with Production (and related receiving/shipping
  facts as recorded). GenealogyLink is a query projection and must be
  rebuildable to avoid RISK-005.

### Material Lot confirmation flag

ENT-MATERIAL-LOT validation status is now "Phase 02 design proposes Inventory
write ownership; workshop confirmation still required". This matrix **proposes**
that ownership consistent with DOM-CAP-BC-001. Workshop evidence may keep or
replace the proposal. It does not close the dictionary status.

## Alternatives and consequences

Allowing Quality or Shipping to write stock would create a second inventory
kernel and break reconciliation. Allowing Reporting to write GenealogyLink as
truth would diverge from source facts (RISK-005). Inventing ENT-* IDs here
would fork GOV-DATA-DICT-001.

## Traceability

- Requirements: REQ-OBJ-002, REQ-OBJ-003.
- Rules/invariants: one write owner; Ledger/Balance only via Inventory Posting
  Service; Quality/Shipping command-only for stock.
- Risks: RISK-003, RISK-005, RISK-006.
- Verification: dictionary status updates belong in GOV-DATA-DICT-001 after
  workshop; not in this draft.

## Open items

- Questions: OQ-001, OQ-002, OQ-003, OQ-004, OQ-005, OQ-008, OQ-009, OQ-010,
  OQ-012, OQ-015, OQ-017 remain open among others. OQ-001 through OQ-018 are
  not closed by this matrix. OQ-010 and OQ-019 remain `treating`.
- Assumptions: ASM-003, ASM-004, ASM-005, ASM-006, ASM-010, ASM-012, ASM-014
  unconfirmed.

## Review evidence

- Self-check: [SELF_CHECK.md](SELF_CHECK.md)
- Independent review: [INDEPENDENT_REVIEW.md](INDEPENDENT_REVIEW.md)
- Reconciliation: [RECONCILIATION.md](RECONCILIATION.md)
