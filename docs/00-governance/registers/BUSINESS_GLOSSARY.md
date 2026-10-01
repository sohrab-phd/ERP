---
id: GOV-GLOSSARY-001
title: Business Glossary
phase: 00-governance
status: approved
version: 0.5.0
owners: [business-process-owner, chief-solution-architect]
depends_on: [SRC-001, SRC-002, ASM-REPORT-001, DOM-CAP-BC-001, DOM-OWN-001]
last_reviewed: 2026-10-01
approval: APR-004
supersedes: null
---

# Business Glossary

Entries are proposed until workshop-validated. The English term is canonical;
the Persian term preserves project vocabulary.

APR-002 approved this register's Phase 00 seed version. APR-003 approved the
Phase 01 assimilation version. The current version is `in_review` because Phase
02 promoted TERM-020 through TERM-025. Entries remain proposed; Phase 02 design
does not convert them into owner-signed business policy.

## TERM-001 — Customer

- Persian: مشتری
- Definition: Commercial party whose inquiry, quotation, order, shipment,
  invoice, and portal access are controlled by the system.
- Owner: Sales

## TERM-002 — Inquiry

- Persian: درخواست / استعلام
- Definition: A customer demand signal that may precede a quotation and may be
  recorded even if it never becomes a Sales Order.
- Owner: Sales

## TERM-003 — Sales Order

- Persian: سفارش فروش
- Definition: Approved commercial demand composed of Sales Order Items and
  governed by fulfillment, production, shipment, and closure states. Closure
  is independent of invoice payment (OQ-007). Shipment `DELIVERED` is not a
  close prerequisite. Factory meeting FACT-02 uses a customer **order code**
  as the shop-floor/scrap trace key; the exact relationship between that
  order code and this Sales Order identity is **unclassified** (not decided
  as database ID, human-visible number, internal business number, or a
  separate shop-floor code). The factory has not said who may amend or
  cancel this order after registration, or whether a cancelled order can
  be reopened. Mr. Dinavand's production stop/cancel decision is not this
  authority.
- Owner: Sales

## TERM-004 — Fulfillment Assessment

- Persian: ارزیابی امکان تأمین
- Definition: Recorded evaluation of whether demand can be served from stock,
  procurement, production, or not feasibly served.
- Owner: Sales

## TERM-005 — Unfulfilled Demand

- Persian: تقاضای غیرقابل‌تأمین
- Aliases: UnfulfilledDemandCase, Lost Demand
- Definition: Structured demand the business cannot serve, including reason,
  quantity, value, and recovery opportunity; distinct from overdue, delayed,
  awaiting-supply, quotation-rejected, and cancelled. May exist without a
  Sales Order; an SO remainder-close must record this fact rather than
  discard remaining demand (OQ-007, INV-013).
- Owner: Sales

## TERM-006 — Material Lot

- Persian: لات مواد
- Definition: Purchase/certificate origin grouping for received material.
- Owner: Inventory, subject to Procurement source references

## TERM-007 — Inventory Unit

- Persian: واحد موجودی
- Definition: Individually controlled physical stock identity such as Coil,
  Sheet, Product Batch, or reusable Residual. Factory meeting FACT-02
  confirms that a tiny physical cut piece does **not** require its own
  Inventory Unit where such identity has no operational value. The Inventory
  Unit concept is retained for independently controlled stock.
- Owner: Inventory

## TERM-008 — Coil

- Persian: رول / کویل
- Definition: A physical raw-material Inventory Unit within a Material Lot.
- Owner: Inventory

## TERM-009 — Reservation

- Persian: رزرو
- Definition: Sales-demand claim against available stock; distinct from
  production Allocation and actual Consumption. One Inventory Unit may have
  at most one `ACTIVE` reservation (OQ-008).
- Owner: Inventory

## TERM-010 — Material Allocation

- Persian: تخصیص مواد
- Definition: Production-side assignment of an Inventory Unit to a Production
  Order or operation.
- Owner: Production

## TERM-011 — Production Order

- Persian: دستور تولید
- Definition: Authorized plan for producing required output through controlled
  operations and material allocations.
- Owner: Production

## TERM-012 — Residual

- Persian: باقی‌مانده
- Definition: Usable material left after consumption/splitting, represented as a
  new child Inventory Unit linked to its parent. Coil → Sheet clarification
  (`2026-09-30`): reusable cutting waste of that conversion is called
  Residual. That name mapping does **not** classify the warehouse conversion
  itself as `CreateResidualUnit`. Factory Residual/Scrap clarification
  (`2026-09-30`): reusable material returns to the warehouse. That is a
  business disposition (production/workshop → Residual → warehouse), not
  a new inventory posting command.
- Owner: Production facts; Inventory identity and quantity

## TERM-013 — Scrap

- Persian: ضایعات
- Definition: Material disposition recorded with quantity, reason, origin, and
  genealogy impact. Factory meeting FACT-02 requires order scrap to carry the
  relevant customer order code. That association does not by itself make scrap
  an Inventory Unit. Coil → Sheet clarification (`2026-09-30`): non-reusable
  cutting waste of that conversion is called Scrap. Order scrap stays
  traceable by Order Code. An earlier mention of Scrap Code or a unique
  part identifier is historical and is not a requirement to code every
  tiny scrap piece. No disposal or accounting workflow is defined here.
- Owner: Production facts; Inventory posting where applicable

## TERM-014 — Product Batch

- Persian: بچ محصول
- Definition: Batch-level production output that may become finished inventory,
  and enter packaging/shipment. A Quality release is a future capability,
  not a current-MVP prerequisite.
- Owner: Production

## TERM-015 — Genealogy

- Persian: شجره مواد / ردیابی
- Definition: Bidirectional relationships among source materials, consumption,
  outputs, residuals, scrap, rework, packages, shipments, and customers.
- Owner: Production source facts; reporting projection

## TERM-016 — Released

- Persian: آزادشده / تأییدشده کیفی
- Definition: Quality disposition permitting inventory availability or shipment
  according to the applicable quality plan. Current factory evidence
  (`2026-09-30`): there is no QC department, and QC is outside the current
  MVP. This term remains future Quality capability. It is not a current
  factory operation and does not create a Quality role.
- Owner: Quality

## TERM-017 — Shipment

- Persian: محموله / ارسال
- Definition: Controlled delivery grouping whose dispatch causes definitive
  stock exit and whose items belong to the authorized demand/customer.
  Factory evidence (`2026-09-30`) does not name who prepares, authorizes,
  loads, records, or confirms delivery. This term stays an architecture
  concept. It is not a factory logistics role, and dispatch is not a
  Sales Order close.
- Owner: Shipping

## TERM-018 — Finance-Lite

- Persian: مالی سبک / مالی عملیاتی
- Definition: Operational invoices, payments, allocations, and balances that do
  not replace the external legal accounting system. Factory evidence
  (`2026-09-30`): an unrelated external upload of an invoice record is not
  this legal-accounting boundary and is not an integration contract.
- Owner: FinanceLite

## TERM-019 — Goods Receipt

- Persian: رسید کالا / رسید مواد
- Aliases: GoodsReceipt, MaterialReceipt
- Definition: Controlled record of goods physically received against a
  purchasing or other authorized inbound reference, before or with coordinated
  quality and Inventory posting. Factory intake (`2026-09-30`): one station
  with Mr. Karimi records Internal Code, Count, Weight, and Type for Coil,
  Sheet, angle, beam, and similar materials. Count is descriptive. Weight
  in kg is the stock quantity. Current factory intake does not require
  Quality approval. The quality coordination in this definition remains
  future capability. Posting stays `PostGoodsReceipt` through the Inventory
  Posting Service. Procurement does not write quantity. This intake is not
  opening-stock cutover. `OpeningStockImport` remains an architecture
  candidate under OQ-015 and is not this Goods Receipt.
- Owner: Procurement orchestration; Inventory posting and resulting stock

## TERM-020 — Quotation

- Persian: پیش‌فاکتور / پیشنهاد قیمت
- Aliases: Quote
- Definition: Sales-owned commercial offer that may precede a Sales Order and
  whose values are snapshotted when later converted or referenced. A purchase
  proforma sent by Ms. Masoumi is not this customer quotation and is not the
  customer invoice.
- Owner: Sales

## TERM-021 — Supplier

- Persian: تأمین‌کننده
- Aliases: Vendor
- Definition: Procurement party that supplies material or services under a
  Purchase Order and whose certificate or lot references may be held immutably
  by Inventory and Quality. The factory has not named a supplier code,
  supplier approval, or this Purchase Order link. Those remain architecture.
  Current intake does not require a Quality role.
- Owner: Procurement

## TERM-022 — Purchase Order

- Persian: سفارش خرید
- Aliases: PurchaseOrder, PO
- Definition: Procurement-owned purchasing commitment against which Goods
  Receipt commercial orchestration may occur. Architecture candidate. The
  factory has not confirmed a Purchase Order procedure. Ms. Masoumi
  registers purchases and sends proformas. That duty is not this lifecycle
  and is not purchase approval.
- Owner: Procurement

## TERM-023 — Package

- Persian: بسته / بسته‌بندی
- Definition: Shipping-owned packing grouping that may contain released Product
  Batch under a future Quality scope, or permitted Inventory Unit form
  before Shipment dispatch. Quality release is not required in the current MVP.
- Owner: Shipping

## TERM-024 — Payment

- Persian: پرداخت
- Definition: Finance-Lite operational receipt of customer funds and its
  allocation against operational Invoice open balance; not a legal-ledger
  posting. Factory payment methods (`2026-09-30`): deposit with remainder
  after delivery; cheque or promissory note; known-customer credit. No
  credit limit, aging rule, or extra document type is defined. Payment
  does not close the Sales Order. The factory has not named who records
  a payment, a required link from payment to invoice, a partial-payment
  procedure, cheque or promissory-note settlement, a customer-balance
  meaning, or a payment reversal. Allocation against an invoice remains
  architecture. It is not a factory-confirmed procedure.
- Owner: FinanceLite

## TERM-025 — Genealogy Link

- Persian: پیوند شجره / لینک ردیابی
- Aliases: GenealogyLink
- Definition: Rebuildable query projection of Genealogy (TERM-015)
  relationships. It is not independently editable truth and must be
  reconstructable from Lot origin, Consumption, Output, Residual, Scrap,
  Package, Shipment, and Rework source facts (DATA-GEN-001, FIND-G-014).
  Ledger rows alone are not a sufficient rebuild source.
- Owner: none as independent truth; Reporting may materialize the projection

## Traceability identity distinctions (factory meeting `2026-09-23`)

These concepts are preserved separately. Do not collapse them. No new
`TERM-*` identifier is minted here.

| Concept | Meaning in this recording | Factory evidence |
| --- | --- | --- |
| Customer Order / Order Code | Commercial/order trace key. Used on cut pieces and order scrap, and on Coil-derived Sheets **when** an order applies | FACT-02. Coil→Sheet clarification: not the same as Coil Code or Sheet Code. Exact identity vs TERM-003 remains unclassified. |
| Coil Code | Source Coil identity | Retained on every Coil-derived Sheet. Not fabricated for a standalone incoming Sheet. |
| Sheet Code | Resulting Sheet identity. Factory format: Coil Code + Sheet number | Global uniqueness of that string is not confirmed by the factory. Not the same as Order Code. |
| Material Lot / Inventory Unit identity | Independently controlled stock (TERM-006 / TERM-007), including Coil and Sheet | FACT-02 does not remove this model. Whether Sheet Code **is** the Inventory Unit business identity is not decided. |
| Physical small piece | A cut physical fragment that may share an order code without being an Inventory Unit | FACT-02. This does not remove Coil Code or Sheet Code. Not a universal unique scrap-piece code. |
| Standalone incoming Sheet | A Sheet that enters the factory and is not Coil-derived | New unique product code. No invented Coil Code. Not Coil-derived genealogy. |
| Station | A real physical station. In factory wording it is also the Production Step. There is no separate Work Center in factory terminology. | Ten current names are on OQ-003. Not a fixed route. Not a user. |
| Operator account | A personal account. No shared Station account. | A person may work at more than one Station. About 10 operators; names are OQ-019. |
| Organizational role | A factory duty, such as Production Manager or IT responsibility for Stations/accounts. | Not a system account, not an `ACT-*` permission, and not a Station. Mr. Dinavand's routing is not account administration. Mr. Ghaffari's Stations/accounts duty is not a super-admin permission. |
| Entry | The order reaches the defined user role or Station. System-clock time. That user role is an organizational routing target. | Not `StartProductionOperation`. Not login. Not a system account. |
| Referral | Assignment of the order to the next user role or Station. System-clock time. Mr. Dinavand refers. | Not `CompleteProductionOperation`. Usually close to next arrival; not the same event. |
| Operator login / logout | Recorded personal-account events. | Not Entry. Not a Station binding. Not a permission. |

Coil Code, Sheet Code, and Customer Order Code stay separate. Count, individual
length, dimensions, measured weight, and cutting date are attributes. Only
measured kg is official stock quantity for the Coil → Sheet evidence.

## Measurement semantics (factory evidence `2026-09-30`)

These are separate. Do not collapse them. No new `TERM-*` is minted.

| Concept | Role |
| --- | --- |
| Stock quantity | Measured weight in kg only. One Ledger quantity. Balance is a projection. |
| Sheet count | Physical attribute. Recorded. Not stock quantity. |
| Length | Physical attribute, including each Sheet's length. Not stock quantity. 6 m and 12 m are examples. |
| Dimensions | Physical/product information. Not stock quantity. No fixed width, thickness, or tolerance is defined. |
| Thickness, width, material/type | Secondary criteria. Not quantity measures. |
| Weight difference | Expected or calculated weight versus measured weight must be shown or reported. No automatic accept/reject threshold is defined. |
| Fulfillment tolerance | OQ-006. Not the weight-difference threshold. |
| Residual / Scrap | Reusability decision by the Production/Workshop Manager. Not an automatic result of a weight difference. No universal numeric cutoff. Reusable returns to the warehouse. Non-reusable is Scrap. |
| Process loss | An optional architecture fact inside `CompleteProductionOperation` when a routing records it. The factory has not defined this category or a percentage. A weight difference is not process loss. |
| Estimated amount | Required weight × price per kg. An estimate, not the final invoice. |
| Final amount | Actual/final weighbridge weight × applicable price per kg + cutting service fee. |
| Customer invoice | Issued by Mr. Pour-Ebrahim and given to Mr. Ghaffari, who records it and uploads the record to an unnamed external system. |
| Purchase proforma | Ms. Masoumi. Not the customer invoice. |
