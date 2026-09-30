---
id: DOM-ROSTER-001
title: Phase 02 Workshop Named Participant Roster
phase: 02-domain-business-architecture
status: approved
version: 0.2.9
owners: [project-sponsor, chief-solution-architect]
depends_on: [OQ-019, ASM-013, ASM-WORKSHOP-001, GOV-RACI-001]
last_reviewed: 2026-09-30
approval: APR-004
supersedes: null
---

# Phase 02 Workshop Named Participant Roster

## Purpose

Collect the named people required by
[WORKSHOP_AGENDA.md](../01-project-assimilation/WORKSHOP_AGENDA.md). The Project
Owner authorized **temporary** placeholders on 2026-09-04 so Phase 02 design may
continue. Every assignment below is flagged `(temporary)` and is **not** a
confirmed person, delegate, attendance fact, or approval authority.

Real names must replace these placeholders before workshop execution and before
any owner-signed business decision. OQ-019 remains open.

## Required fields for every role

- Full name, including the `(temporary)` flag until a real person is named
- Delegate, or explicit `none`
- Attendance/availability confirmation (`yes` / `no` / date)
- Approval scope or limit

One person may cover multiple roles only when each assignment and its authority
are stated explicitly.

## Roster

| Role | Full name | Delegate or `none` | Attendance / availability | Approval scope or limit |
| --- | --- | --- | --- | --- |
| Project Sponsor | Temporary Project Sponsor (temporary) | none (temporary) | assumed available for planned workshop (temporary) | phase and scope approval (temporary) |
| Business Process Owner | Temporary Business Process Owner (temporary) | none (temporary) | assumed available for planned workshop (temporary) | cross-functional operating-model confirmation (temporary) |
| Sales/CRM and Customer Portal owner | Temporary Sales and Portal Owner (temporary) | none (temporary) | assumed available for planned workshop (temporary) | Sales/CRM and portal-scope evidence (temporary) |
| Procurement and Supplier-management owner | Temporary Procurement Owner (temporary) | none (temporary) | assumed available for planned workshop (temporary) | purchasing and inbound commercial evidence (temporary) |
| Inventory/Warehouse owner | Temporary Inventory Owner (temporary) | none (temporary) | assumed available for planned workshop (temporary) | stock, location, and warehouse evidence (temporary) |
| Data Steward | Temporary Data Steward (temporary) | none (temporary) | assumed available for planned workshop (temporary) | terminology and master-data quality evidence (temporary) |
| Production/MES owner | Temporary Production Owner (temporary) | none (temporary) | assumed available for planned workshop (temporary) | routing, operations, and MES evidence (temporary) |
| Representative operator or operators | Temporary Production Operator (temporary) | none (temporary) | assumed available for planned workshop (temporary) | shop-floor practice evidence only; no policy approval (temporary) |
| Quality owner | Temporary Quality Owner (temporary) | none (temporary) | assumed available for planned workshop (temporary) | inspection, hold, and release evidence (temporary) |
| Shipping/Delivery owner | Temporary Shipping Owner (temporary) | none (temporary) | assumed available for planned workshop (temporary) | packing, dispatch, and delivery evidence (temporary) |
| Finance-Lite owner | Temporary Finance-Lite Owner (temporary) | none (temporary) | assumed available for planned workshop (temporary) | operational invoice/payment boundary evidence (temporary) |
| External accounting-system owner | Temporary External Accounting Owner (temporary) | none (temporary) | assumed available for planned workshop (temporary) | legal-accounting interface evidence (temporary) |
| Security representative | Temporary Security Representative (temporary) | none (temporary) | assumed available for planned workshop (temporary) | identity, RBAC, and isolation evidence (temporary) |
| Infrastructure/Operations representative | Temporary Infrastructure Representative (temporary) | none (temporary) | assumed available for planned workshop (temporary) | network, recovery, and operations evidence (temporary) |
| Integration representative | Temporary Integration Representative (temporary) | none (temporary) | assumed available for planned workshop (temporary) | adapter and contract evidence (temporary) |
| Data Architecture representative | Temporary Data Architecture Representative (temporary) | none (temporary) | assumed available for planned workshop (temporary) | canonical data and integrity evidence (temporary) |
| QA representative | Temporary QA Representative (temporary) | none (temporary) | assumed available for planned workshop (temporary) | verification-evidence review (temporary) |
| Solution Architecture representative | Temporary Solution Architecture Representative (temporary) | none (temporary) | assumed available for planned workshop (temporary) | architecture consistency and ADR preparation (temporary) |
| Independent Reviewer observer | Temporary Independent Reviewer (temporary) | none (temporary) | assumed available as observer where independence permits (temporary) | review observation only; no artifact authorship (temporary) |

## Factory-provided organizational personnel (`2026-09-23`)

Factory meeting FACT-04. These are **personnel / organizational facts only**.
They are **not** replacements of the `(temporary)` workshop-role rows above.
They are **not** mapped to system roles, `ACT-*` capabilities, SoD authority,
approval authority, or delegates. Production-line operators are **not**
included.

| Person | Current organizational responsibility |
| --- | --- |
| Mr. Karimi | Warehousekeeper |
| Mr. Ghaffari | Invoice issuance/registration + IT responsibility |
| Ms. Koushki | Government trade-system registration + receivables follow-up |
| Mr. Pour-Ebrahim | Sales Manager + order receiving |
| Mr. Dinavand (آقای دیناروند) | Workshop Manager |
| Ms. Bohlouli | Commercial Manager + sales/order receiving |
| Ms. Masoumi | Recording completed purchases + sending proforma invoices |
| Ms. Goodarzi / Ms. Goudarzi | Accounting Manager. One person. Both spellings appear in successive evidence statements. |
| Ms. Rangini | Accountant |
| Mr. Faraji | Chairman of the Board |
| Mr. Rouzbahani | CEO |

This partially supplies OQ-019 names and does **not** resolve OQ-019.

Coil → Sheet clarification (`2026-09-30`) also describes Mr. Dinavand as
the Production/Workshop Manager who decides warehouse Coil → Sheet
conversion. Source wording varies between Workshop Manager and Production
Manager. That variation is terminology to confirm. It is not a second
person, not an `ACT-*` assignment, and not SoD or approval authority.

Station and flow clarification (`2026-09-30`), still not RBAC:

- Mr. Dinavand defines the per-order production route, receives the order
  after sales registration, refers work to the next stage, and decides
  when production should stop or cancel.
- Mr. Ghaffari's IT responsibility also covers Stations/accounts. That is
  not a super-admin permission.
- Mr. Karimi is associated with the single incoming-material intake
  Station (Coil, Sheet, angle, beam, and similar). Intake attributes are
  Internal Code, Count, Weight, and Type. He calculates final order
  weight. Source wording also says Warehouse Manager. Do not collapse that
  with Warehousekeeper until the title is confirmed.
- Mr. Pour-Ebrahim registers the customer order from available warehouse
  stock and calculates the estimated cost. Final-invoice wording that uses
  total order weight plus a cutting service fee is not a sales redesign.
- About 10 operators should be named later. Their names are not here.
  There is no shared Station account. An operator is not permanently bound
  to one Station. Those operators are not the 11-person roster.

Residual, Scrap, and QC clarification (`2026-09-30`), still not RBAC:

- No named delegate has been identified. Do not infer one. The
  `(temporary)` delegate cells above are not factory delegates.
- Mr. Dinavand also decides Residual versus Scrap from reusability, and
  the questionnaire names him for final approval. Final approval is not
  an approval workflow and not a Quality role.
- Reusable material returns to the warehouse. Non-reusable material is
  Scrap. No numeric cutoff is defined.
- There is no QC department and no Quality person. The `(temporary)`
  Quality owner row is a historical placeholder. It is not applicable to
  the current MVP. Do not fill it with an invented name or by mapping
  another employee. The row is not deleted.
- Shorter labels in this evidence for Ms. Koushki, Ms. Bohlouli,
  Ms. Masoumi, Ms. Rangini, Mr. Faraji, and Mr. Rouzbahani do not add
  duties beyond the table.

Sales, invoice, and payment clarification (`2026-09-30`), still not RBAC:

- The table cell "Invoice issuance/registration" for Mr. Ghaffari is the
  earlier roster label. It is superseded for who issues the customer
  invoice. Mr. Pour-Ebrahim issues that invoice and gives it to
  Mr. Ghaffari. Mr. Ghaffari creates the corresponding record and uploads
  it to an unrelated external system. The cell is not deleted.
- Estimated amount = required weight × price per kg. Final amount =
  actual/final weighbridge weight × applicable price per kg + cutting
  service fee. Mr. Karimi calculates the final order weight.
- Mr. Dinavand receives the order and defines the route when production
  is required.
- Payment methods: deposit with remainder after delivery; cheque or
  promissory note; known-customer credit. No approval hierarchy.
- Ms. Masoumi's proformas are purchase proformas, not customer invoices.
- Ms. Koushki's receivables follow-up is not payment approval.
- Accounting Manager, Accountant, Board Chairman, and CEO are not given
  invoice or payment approval by this evidence.

Incoming material (`2026-09-30`), still not RBAC:

- One intake station. Mr. Karimi records Internal Code, Count, Weight,
  and Type. Count is not a stock ledger. This is not `PostGoodsReceipt`
  authority and not a second inventory writer.
- Ms. Masoumi's purchase registration and proformas are purchasing
  documents, not the stock post and not customer invoices.
- No purchase-approval person, Procurement Manager, or delegate is
  identified. The temporary Procurement owner row is not a factory person.
  A Purchase Order lifecycle is an architecture candidate, not her
  confirmed duty.

Order-to-station flow (`2026-09-30`), still not RBAC:

- When production is required, Mr. Dinavand receives the order and sets
  the route. Operators declare Station completion; he is informed and
  refers the next stage. He may decide stop or cancel. No planner,
  scheduler, dispatcher, station manager, or shift manager is named.
- Operator login and logout are recorded on personal accounts. About 10
  operator names are still missing. Mr. Ghaffari's account responsibility
  is not a super-admin permission.

Shipment and delivery (`2026-09-30`), still not RBAC:

- The factory has not named who prepares, authorizes, loads, records, or
  confirms a shipment. Karimi, Pour-Ebrahim, Ghaffari, and Dinavand are
  not given that authority. No Shipping Manager or driver is created.
- The temporary Shipping owner row is not a factory person. "Settlement
  after delivery" is a payment method, not a delivery workflow.

Customer-order change and cancellation (`2026-09-30`), still not RBAC:

- The factory has not said who may amend or cancel a customer order.
  Mr. Pour-Ebrahim's registration duty is not that authority.
  Mr. Dinavand's production stop/cancel decision is not that authority.
- No reason code, customer confirmation, or reopen rule is defined.
  No delegate is created.

## Status

- Assigned named workshop roles: `19` of `19`, all `(temporary)`
- Confirmed real people mapped onto workshop/sign-off roles: `0` of `19`
- Factory-provided organizational personnel (FACT-04): `11` people listed;
  not mapped to the role table; production-line operators not included
- OQ-019: `treating` under ASM-013; partial name input only
- Phase 02 gate: `ACTIVE_IN_REVIEW` for design; workshop execution remains blocked
- Implementation authorized: `false`

## Replacement rule

A real assignment replaces a row only when it supplies a legal full name, a
delegate or explicit `none`, attendance/availability, and approval scope, and
drops the `(temporary)` flag. Partial replacement is allowed row by row.

## Traceability

- Open question: OQ-019
- Assumption: ASM-013
- Finding: FIND-020
- Canonical roles: [STAKEHOLDERS_RACI.md](../00-governance/registers/STAKEHOLDERS_RACI.md)
- Workshop agenda: [WORKSHOP_AGENDA.md](../01-project-assimilation/WORKSHOP_AGENDA.md)
