---
id: SRC-004
title: Owner-confirmed factory purchase and receiving investigation
phase: 12-implementation-planning
status: recorded
version: 1.0.0
owners: [project-sponsor, business-process-owner]
depends_on: [GOV-SOURCES-001]
last_reviewed: 2026-10-20
approval: Owner-provided authoritative business input only; no architecture or implementation approval
supersedes: null
---

# SRC-004 — Factory purchase and receiving evidence

Provenance: the Owner's actual 2026-10-20 task message, “ERP Factory Workflow —
Step 1: Authoritative Business Requirements Baseline,” supplies confirmed findings
from an on-site investigation. This is the recording date, not an invented visit
date, attendance record or signature. No real ticket/waybill/purchase document was
attached to that message. The facts below are authoritative business input; the
[derived baseline](../../02-domain-business-architecture/PURCHASE_RECEIVING_REQUIREMENTS_BASELINE.md)
is a draft for Owner review, not a new architecture baseline or product unlock.

## Confirmed process

1. Ms. Masoumi orders raw materials, obtains the seller's purchase order number,
   then registers the order, registration date and multiple item lines/specifications,
   ordered physical-unit count and weight per individual unit. Registration does
   not mean arrival and must not increase inventory. The order number is unique
   as a business requirement; the system namespace remains to be reconciled.
2. One purchase order can arrive on multiple trucks at separate times, with
   different waybills retaining the original order number. The driver supplies
   the waybill; Mr. Karimi reads its order number, enters it and retrieves the
   original order/lines/specifications. He checks the actual goods and confirms
   only units physically received on that arrival. Undelivered units remain outstanding.
3. He can record actual received attributes that differ from the ordered values.
   Accepted/confirmed actual values govern the physical inventory record. Preserve
   ordered values and persistent mismatch evidence, affected line/unit/arrival/
   receipt links, trusted receiver and clear discrepancy indication. Partial
   delivery alone is not a specification discrepancy. Over-delivery, rejection,
   exceptional acceptance and remediation rules are not supplied.
4. Each physical unit has a distinct, physically associated Internal System Code.
   Received units retain order, line, arrival/waybill and receipt associations.
   Code namespace and legacy effects need investigation before uniqueness DDL.
   Order/item/waybill/receipt/unit/product references, UUIDs and command keys differ.
5. Mr. Karimi records the warehouse receipt reference from an already existing
   document; ERP must not assume it generates that business reference. Its
   uniqueness and relationship to arrivals remain unresolved.
6. Only physically received and confirmed units increase inventory, exclusively
   through IPS with existing atomicity, idempotency, current authorization and audit.
   No undelivered remainder posts. Ms. Masoumi must see ordered/received/outstanding
   units, each arrival/receipt, discrepancies and confirmed intake grouped by order
   number after successful receiving/stock posting. No browser UI is asserted.

## Exact factory field register

Original numbering and Persian names are retained verbatim. Requiredness applies
at the relevant stage. No extra metadata is counted as a factory-provided field.

| No. | Original Persian field | English meaning | Required | Entered by |
| --- | --- | --- | --- | --- |
| 1 | شماره سیستم | Internal System Code / physical-unit traceability code | YES | Mr. Karimi |
| 2 | شماره سفارش | Seller-provided purchase order number | YES | Ms. Masoumi |
| 3 | شماره بارنامه | Waybill number | YES | Mr. Karimi |
| 4 | شماره بارنامه حواله (برگ زرد) | Yellow-copy waybill/reference | NO | Mr. Karimi |
| 5 | شماره رسید انبار | Warehouse receipt reference | YES | Mr. Karimi |
| 6 | شماره کامیون | Truck number | NO | Mr. Karimi |
| 7 | شماره آیتم | Item number | NO | Ms. Masoumi |
| 8 | نوع کالا | Material / product type | YES | Ms. Masoumi |
| 9 | عرض | Width | YES | Ms. Masoumi |
| 10 | ضخامت | Thickness | YES | Ms. Masoumi |
| 11 | رنگ | Color | NO | Ms. Masoumi |
| 12 | شماره رئال رنگ | RAL color number | NO | Ms. Masoumi |
| 13 | طول | Length | NO | Ms. Masoumi |
| 14 | کیفیت | Quality / grade | NO | Ms. Masoumi |
| 15 | وزن | Weight per individual physical unit | YES | Ms. Masoumi |
| 16 | تعداد | Number of physical units ordered on this item line | YES | Ms. Masoumi |
| 17 | تاریخ ثبت سفارش | Purchase order registration date | YES | Ms. Masoumi |
| 18 | تاریخ ورود | Actual truck/consignment arrival date | YES | Mr. Karimi |
| 19 | شماره محصول | Product number | YES | Mr. Karimi |
| 20 | شرکت ارسال کننده (مبدا) | Originating/sending company | NO | Mr. Karimi |
| 21 | وزن خالص گزارش مبدأ | Origin-reported net consignment weight | YES | Mr. Karimi |
| 22 | وزن خالص باسکول مقصد | Destination weighbridge net consignment weight | NO | Mr. Karimi |
| 23 | نام راننده | Driver name | NO | Mr. Karimi |

Totals: 23 fields, 13 mandatory/10 optional; Ms. Masoumi 12 (7/5), Mr. Karimi
11 (6/5). Names establish real factory duties, not hardcoded software privileges.
Accounts must remain personal with explicit current ACT grants.

## Three weight concepts

- W1 / field 15: mandatory ordered per-physical-unit weight, recorded by Ms. Masoumi.
  The factory cannot independently weigh each unit on truck arrival. Accepted
  per-unit weight is the basis for stock of that confirmed unit. Preserve original
  and separately confirmed actual values when discrepancies are identified;
  do not replace historical purchase evidence. Source/authority for any changed
  W1 must be reconciled; no destination-unit measurement is implied.
- W2 / field 21: mandatory net weight of the particular truck/waybill's entire
  consignment, taken from the driver's waybill and entered by Mr. Karimi. It is
  not total weight of a purchase order spread over several trucks.
- W3 / field 22: optional destination weighbridge net weight of the full arriving
  consignment, entered by Mr. Karimi. No per-unit destination weighing, automatic
  distribution to units or replacement of W1 is allowed. No automatic tolerance,
  rounding, reconciliation or rejection follows from aggregate weight differences.

Illustrative arithmetic only, not a factory record: 5 ordered units at 2,000 kg
per unit imply 10,000 kg ordered line weight. If 3 units are physically confirmed
at that accepted W1, stock increases by 6,000 kg for those units; 2 remain
outstanding. No W2/W3 distribution is involved. No fictitious document identifiers
or real customer/driver data are introduced by this example.

## Authority limits

Exact whole-kg and sole IPS ownership remain accepted architecture. The new W1
provenance and distinct physical code conflict with earlier measured-kg/nonunique
Internal Code wording and must be explicitly reconciled, never silently redefined.
Preserve accepted functionality, existing no-ticket and potentially no-PO receiving;
this source does not remove those paths or authorize a mandatory global PO rule.
Existing purchasing evidence is not the operational PO/line/partial-receipt workflow.

The earlier F01–F08 questionnaire and printed-ticket proposal require individual
reassessment; not all questions are closed. Direct device integration and separate
weighbridge ticket capture remain unauthorized. This task permits requirements
documentation/analysis only: no code, API contracts, migrations, role changes or
product gate/unlock changes. Stop for Owner review before Step 2. No factory UAT,
production approval, remote push or acceptance/push of earlier unconfirmed commits
is asserted by this source.
