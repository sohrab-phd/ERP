---
id: GOV-GLOSSARY-001
title: Business Glossary
phase: 00-governance
status: approved
version: 0.3.2
owners: [business-process-owner, chief-solution-architect]
depends_on: [SRC-001, SRC-002, ASM-REPORT-001, DOM-CAP-BC-001, DOM-OWN-001]
last_reviewed: 2026-09-23
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
  separate shop-floor code).
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
  new child Inventory Unit linked to its parent. Factory meeting FACT-03
  (opened-coil leftover cut to warehouse sheets without a new customer order)
  is a related business process that is **not** classified as this Residual
  construct yet.
- Owner: Production facts; Inventory identity and quantity

## TERM-013 — Scrap

- Persian: ضایعات
- Definition: Material disposition recorded with quantity, reason, origin, and
  genealogy impact. Factory meeting FACT-02 requires order scrap to carry the
  relevant customer order code. That association does not by itself make scrap
  an Inventory Unit.
- Owner: Production facts; Inventory posting where applicable

## TERM-014 — Product Batch

- Persian: بچ محصول
- Definition: Batch-level production output that may become finished inventory,
  pass Quality release, and enter packaging/shipment.
- Owner: Production

## TERM-015 — Genealogy

- Persian: شجره مواد / ردیابی
- Definition: Bidirectional relationships among source materials, consumption,
  outputs, residuals, scrap, rework, packages, shipments, and customers.
- Owner: Production source facts; reporting projection

## TERM-016 — Released

- Persian: آزادشده / تأییدشده کیفی
- Definition: Quality disposition permitting inventory availability or shipment
  according to the applicable quality plan.
- Owner: Quality

## TERM-017 — Shipment

- Persian: محموله / ارسال
- Definition: Controlled delivery grouping whose dispatch causes definitive
  stock exit and whose items belong to the authorized demand/customer.
- Owner: Shipping

## TERM-018 — Finance-Lite

- Persian: مالی سبک / مالی عملیاتی
- Definition: Operational invoices, payments, allocations, and balances that do
  not replace the external legal accounting system.
- Owner: FinanceLite

## TERM-019 — Goods Receipt

- Persian: رسید کالا / رسید مواد
- Aliases: GoodsReceipt, MaterialReceipt
- Definition: Controlled record of goods physically received against a
  purchasing or other authorized inbound reference, before or with coordinated
  quality and Inventory posting.
- Owner: Procurement orchestration; Inventory posting and resulting stock

## TERM-020 — Quotation

- Persian: پیش‌فاکتور / پیشنهاد قیمت
- Aliases: Quote
- Definition: Sales-owned commercial offer that may precede a Sales Order and
  whose values are snapshotted when later converted or referenced.
- Owner: Sales

## TERM-021 — Supplier

- Persian: تأمین‌کننده
- Aliases: Vendor
- Definition: Procurement party that supplies material or services under a
  Purchase Order and whose certificate or lot references may be held immutably
  by Inventory and Quality.
- Owner: Procurement

## TERM-022 — Purchase Order

- Persian: سفارش خرید
- Aliases: PurchaseOrder, PO
- Definition: Procurement-owned purchasing commitment against which Goods
  Receipt commercial orchestration may occur.
- Owner: Procurement

## TERM-023 — Package

- Persian: بسته / بسته‌بندی
- Definition: Shipping-owned packing grouping that may contain released Product
  Batch or permitted Inventory Unit form before Shipment dispatch.
- Owner: Shipping

## TERM-024 — Payment

- Persian: پرداخت
- Definition: Finance-Lite operational receipt of customer funds and its
  allocation against operational Invoice open balance; not a legal-ledger
  posting.
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
| Customer Order / Order Code | Commercial/order trace key used on cut pieces and order scrap | FACT-02. Exact identity vs TERM-003 Sales Order is unclassified. |
| Material Lot / Inventory Unit identity | Independently controlled stock (TERM-006 / TERM-007), including Coil and Sheet | FACT-02 does not remove this model. FACT-03 resulting sheets retain the original **coil** code; that is not automatically the order code. |
| Physical small piece | A cut physical fragment that may share an order code without being an Inventory Unit | FACT-02: unique ID per tiny piece is not feasible and is not required. |

For FACT-03, original **coil** identity and original **order code** may be
separate identifiers. Their final relationship is not decided.
