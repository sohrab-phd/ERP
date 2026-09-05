---
id: GOV-GLOSSARY-001
title: Business Glossary
phase: 00-governance
status: approved
version: 0.3.1
owners: [business-process-owner, chief-solution-architect]
depends_on: [SRC-001, SRC-002, ASM-REPORT-001, DOM-CAP-BC-001, DOM-OWN-001]
last_reviewed: 2026-09-06
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
  governed by fulfillment, production, shipment, and closure states.
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
  quantity, value, and recovery opportunity; distinct from overdue demand.
- Owner: Sales

## TERM-006 — Material Lot

- Persian: لات مواد
- Definition: Purchase/certificate origin grouping for received material.
- Owner: Inventory, subject to Procurement source references

## TERM-007 — Inventory Unit

- Persian: واحد موجودی
- Definition: Individually controlled physical stock identity such as Coil,
  Sheet, Product Batch, or reusable Residual.
- Owner: Inventory

## TERM-008 — Coil

- Persian: رول / کویل
- Definition: A physical raw-material Inventory Unit within a Material Lot.
- Owner: Inventory

## TERM-009 — Reservation

- Persian: رزرو
- Definition: Sales-demand claim against available stock; distinct from
  production Allocation and actual Consumption.
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
  new child Inventory Unit linked to its parent.
- Owner: Production facts; Inventory identity and quantity

## TERM-013 — Scrap

- Persian: ضایعات
- Definition: Material disposition recorded with quantity, reason, origin, and
  genealogy impact.
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
  reconstructable from Consumption, Output, Residual, Scrap, Package, and
  Shipment source facts.
- Owner: none as independent truth; Reporting may materialize the projection
