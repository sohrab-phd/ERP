---
id: DOM-ACTORS-001
title: Actor and Responsibility Catalogue
phase: 02-domain-business-architecture
status: approved
version: 0.2.1
owners: [business-process-owner]
depends_on: [GOV-RACI-001, DOM-ROSTER-001]
last_reviewed: 2026-09-06
approval: APR-004
supersedes: null
---

# Actor and Responsibility Catalogue

## Purpose

Catalogue operational actors and RACI-style responsibility against key To-Be
processes for Foolad Navardkaran ERP/MES. This catalogue **binds current people
only as Temporary \* (temporary)** identities from
[DOM-ROSTER-001](WORKSHOP_ROSTER.md). Those identities confer **no approval
authority**, do not execute the workshop, and do not close OQ-019.

Canonical governance roles remain in
[GOV-RACI-001](../00-governance/registers/STAKEHOLDERS_RACI.md). This artifact
does not replace that register.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Scope

- In scope: operational actors listed below; RACI against key processes from
  [DOM-PROCESS-001](PROCESS_MAPS_AS_IS_TO_BE.md); explicit temporary-person
  binding; portal customer as an external party; Inventory Posting Service as a
  system actor.
- Out of scope: owner-signed policy, workshop attendance facts, closing
  OQ-001–018, inventing real names, and treating temporary rows as delegates.

## Sources and dependencies

- Canonical roles: GOV-RACI-001.
- Temporary named assignments: DOM-ROSTER-001 (ASM-013, FIND-020, OQ-019
  `treating`).
- Process context: DOM-PROCESS-001, [DOM-CAP-BC-001](CAPABILITY_BOUNDED_CONTEXT_MAP.md).
- Glossary: [GOV-GLOSSARY-001](../00-governance/registers/BUSINESS_GLOSSARY.md).

## Design

### Authority constraint

Every human assignment in this catalogue is a **Temporary \* (temporary)**
placeholder authorized only so Phase 02 **design drafting** may continue. Per
ASM-013 and FIND-020:

- Temporary identities are not confirmed people.
- They are not attendance or availability facts.
- They have **no approval authority**.
- Workshop execution and owner-signed business decisions remain blocked by
  OQ-019 until real names replace the placeholders.

RACI letters below are **proposed operating-model drafts** for review. They are
not approved policy.

RACI key: **R** responsible (does the work), **A** accountable (owns the
outcome), **C** consulted, **I** informed. System actors may be **R** for
mechanical posting and never **A** for business policy.

### Actor catalogue

Glossary terms are linked on first use.

| Actor ID | Actor | Kind | Write-context alignment | Temporary person binding | Approval authority |
| --- | --- | --- | --- | --- | --- |
| ACT-SALES | Sales | human role | `BC-SALES`: [Customer](../00-governance/registers/BUSINESS_GLOSSARY.md#term-001--customer) (TERM-001), [Inquiry](../00-governance/registers/BUSINESS_GLOSSARY.md#term-002--inquiry) (TERM-002), [Quotation](../00-governance/registers/BUSINESS_GLOSSARY.md#term-020--quotation) (TERM-020), [Sales Order](../00-governance/registers/BUSINESS_GLOSSARY.md#term-003--sales-order) (TERM-003), [Fulfillment Assessment](../00-governance/registers/BUSINESS_GLOSSARY.md#term-004--fulfillment-assessment) (TERM-004), [Unfulfilled Demand](../00-governance/registers/BUSINESS_GLOSSARY.md#term-005--unfulfilled-demand) (TERM-005) | Temporary Sales and Portal Owner (temporary) | **none** |
| ACT-PROC | Procurement | human role | `BC-PROCUREMENT`: [Supplier](../00-governance/registers/BUSINESS_GLOSSARY.md#term-021--supplier) (TERM-021), [Purchase Order](../00-governance/registers/BUSINESS_GLOSSARY.md#term-022--purchase-order) (TERM-022), [Goods Receipt](../00-governance/registers/BUSINESS_GLOSSARY.md#term-019--goods-receipt) (TERM-019) commercial orchestration | Temporary Procurement Owner (temporary) | **none** |
| ACT-WH | Warehouse | human role | `BC-INVENTORY` operational handling of [Material Lot](../00-governance/registers/BUSINESS_GLOSSARY.md#term-006--material-lot) (TERM-006), [Inventory Unit](../00-governance/registers/BUSINESS_GLOSSARY.md#term-007--inventory-unit) (TERM-007) / [Coil](../00-governance/registers/BUSINESS_GLOSSARY.md#term-008--coil) (TERM-008), location, [Reservation](../00-governance/registers/BUSINESS_GLOSSARY.md#term-009--reservation) (TERM-009) requests | Temporary Inventory Owner (temporary) | **none** |
| ACT-PLAN | Production planner | human role | `BC-PRODUCTION` planning of [Production Order](../00-governance/registers/BUSINESS_GLOSSARY.md#term-011--production-order) (TERM-011) and [Material Allocation](../00-governance/registers/BUSINESS_GLOSSARY.md#term-010--material-allocation) (TERM-010) | Temporary Production Owner (temporary) | **none** |
| ACT-OP | Production operator | human role | Shop-floor recording of consumption, output, [Residual](../00-governance/registers/BUSINESS_GLOSSARY.md#term-012--residual) (TERM-012), [Scrap](../00-governance/registers/BUSINESS_GLOSSARY.md#term-013--scrap) (TERM-013), rework; evidence only | Temporary Production Operator (temporary) | **none** — roster already limits this row to shop-floor practice evidence; no policy approval |
| ACT-QC | Quality | human role | `BC-QUALITY` inspection and [Released](../00-governance/registers/BUSINESS_GLOSSARY.md#term-016--released) (TERM-016) disposition; commands inventory hold/release | Temporary Quality Owner (temporary) | **none** |
| ACT-SHIP | Shipping | human role | `BC-SHIPPING` [Package](../00-governance/registers/BUSINESS_GLOSSARY.md#term-023--package) (TERM-023), [Shipment](../00-governance/registers/BUSINESS_GLOSSARY.md#term-017--shipment) (TERM-017), dispatch, delivery; commands stock exit | Temporary Shipping Owner (temporary) | **none** |
| ACT-FIN | Finance-lite | human role | `BC-FINANCE-LITE` ([Finance-Lite](../00-governance/registers/BUSINESS_GLOSSARY.md#term-018--finance-lite), TERM-018) operational Invoice, [Payment](../00-governance/registers/BUSINESS_GLOSSARY.md#term-024--payment) (TERM-024), allocation | Temporary Finance-Lite Owner (temporary) | **none** |
| ACT-SEC | Security | human role | `BC-IDENTITY` / `BC-AUDIT` identity, RBAC, isolation, evidence | Temporary Security Representative (temporary) | **none** |
| ACT-CUST | Customer as portal party | external party | Not a write owner. Any future portal channel is pending OQ-010. Ordering is formally deferred from MVP. Visibility/request remain optional deferred. | **no roster person** — not a workshop approval role | **none** |
| ACT-IPS | System / Inventory Posting Service | system actor | Sole proposed mutator of Ledger, Balance, and stock movements (OQ-017 mechanism open) | **no human** | **none** — mechanical integrity only |

Related workshop placeholders that are **not** additional operational actors in
the matrix, but remain the only current people for supporting design roles:

| Supporting design role | Temporary person binding | Approval authority |
| --- | --- | --- |
| Business Process Owner (cross-functional A on operating model, once real) | Temporary Business Process Owner (temporary) | **none** |
| Project Sponsor | Temporary Project Sponsor (temporary) | **none** |
| Data Steward | Temporary Data Steward (temporary) | **none** |
| Data Architecture representative | Temporary Data Architecture Representative (temporary) | **none** |
| Solution Architecture representative | Temporary Solution Architecture Representative (temporary) | **none** |
| External accounting-system owner | Temporary External Accounting Owner (temporary) | **none** |
| Integration representative | Temporary Integration Representative (temporary) | **none** |

Do not treat the supporting list as extra RACI columns on shop-floor processes.

### RACI against key processes

Proposed draft only. Quality and Shipping **request** inventory changes; they
are never **R** for writing stock tables. ACT-IPS is **R** for posting
execution where a stock movement is authorized.

| Process | Sales | Procurement | Warehouse | Planner | Operator | Quality | Shipping | Finance-lite | Security | Customer portal party | Inventory Posting Service |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Capture Inquiry / Quotation | A/R | I | I | C | I | I | I | I | C | I — optional deferred visibility/request only; not MVP ordering | I |
| Confirm / change / cancel Sales Order | A/R | C | C | C | I | I | C | C | C | I — same portal deferral | I |
| Fulfillment Assessment | A/R | C | C | C | I | I | I | I | I | — | I |
| Record Unfulfilled Demand without Sales Order | A/R | I | I | I | I | I | I | I | I | — | — |
| Create / send PurchaseOrder | C | A/R | C | C | I | C | I | I | C | — | I |
| GoodsReceipt commercial orchestration | I | A/R | C | I | I | C | I | I | C | — | C — awaits posting command |
| Inbound / in-process / final QC | I | C | C | C | C | A/R | C | I | C | — | R for hold/quarantine/release **posting** when commanded |
| Inventory receipt / transfer / adjustment posting | I | C | A for physical handling; C for posting request | C | C | C | C | I | C | — | R |
| Reservation against available stock | C / command | I | C | C | I | I | I | I | C | — | R |
| Plan / release Production Order | C | C | C | A/R | C | C | I | I | C | — | I |
| Execute operation, consumption, output, rework | I | I | C | C | R | C | I | I | C | — | R for stock effects |
| Residual identity and quantity | I | I | C | C | R fact | C | I | I | I | — | R for resulting unit |
| Scrap disposition and stock effect | I | I | C | C | R fact | C | I | I | C | — | R for stock movement |
| Pack / Shipment / dispatch | C | I | C | I | I | C — release gate | A/R | C | C | I — optional deferred visibility | R for definitive stock exit |
| Shipment without demand | C | I | C | I | I | C | R — may not proceed without explicit authority | I | C | — | R only after authorized command |
| Operational Invoice / Payment | C | I | I | I | I | I | C | A/R | C | I — optional deferred visibility | — |
| Identity, RBAC, customer isolation | C | C | C | C | C | C | C | C | A/R | constrained subject if portal later exists | I |
| Audit evidence completeness | C | C | C | C | C | C | C | C | A | — | R for ledger evidence |

Cells marked "—" mean no proposed participation in that process.

### Portal party rule

ACT-CUST is catalogued because a future customer channel is a known product
capability (INT-007). This catalogue **does not decide OQ-010**.

- Ordering via portal: **formally deferred from MVP** (proposed scope pending
  OQ-010).
- Visibility and request: **optional deferred**; shown as **I** where a future
  channel might notify or submit a request into Sales-owned processes.
- ACT-CUST is never **A** or **R** for core writes. Submissions, if later
  authorized, become `BC-SALES` commands.

### Inventory Posting Service rule

ACT-IPS is the proposed unique writer of Ledger, Balance, and stock movements
(ASM-REPORT-001; OQ-017 open on mechanism). Human actors authorize or request;
they do not become a second stock writer. Warehouse accountability is for
physical handling and requesting authorized postings, not for updating stock
tables directly.

## Alternatives and consequences

Assigning Quality or Shipping as stock writers would violate the one-write-owner
rule and RISK-006. Treating Temporary \* (temporary) names as approvers would
falsely close OQ-019.

## Traceability

- Requirements: REQ-OBJ-001, REQ-OBJ-004.
- Rules/invariants: one write owner; Quality/Shipping command inventory rather
  than write stock; shipment without demand needs explicit authority.
- Risks: RISK-007, RISK-008, RISK-013.
- Verification: real named RACI is a workshop exit output (ASM-WORKSHOP-001 §1),
  still blocked.

## Open items

- Questions: OQ-005 (QC and exceptional authority), OQ-007 (closure), OQ-010
  (`treating`; portal party actions), OQ-012 (finance vs legal accounting),
  OQ-015 (cutover RACI), OQ-019 (`treating`). OQ-001 through OQ-018 remain
  unanswered.
- Assumptions: ASM-013 and ASM-014 proposed; temporary roster is not validation
  of ASM-001 through ASM-012.

## Review evidence

- Self-check: [SELF_CHECK.md](SELF_CHECK.md)
- Independent review: [INDEPENDENT_REVIEW.md](INDEPENDENT_REVIEW.md)
- Reconciliation: [RECONCILIATION.md](RECONCILIATION.md)
