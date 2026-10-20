---
id: DOM-INBOUND-FIELDS-001
title: Accepted factory purchase and receiving 23-field dictionary
phase: 12-implementation-planning
status: accepted
version: 0.2.0
owners: [business-process-owner, data-architect]
depends_on: [SRC-004, DOM-INBOUND-REQ-001]
last_reviewed: 2026-10-20
approval: APR-032
supersedes: null
---

# Accepted 23-field business dictionary

Accepted as Step 1 requirements input under [APR-032](../00-governance/approved-baselines/APR-032-inbound-gap-analysis.md),
not approval of proposed ownership/schema choices or unresolved policy. All field
rows remain unchanged; [Step 2 coverage](../12-implementation-planning/PURCHASE_RECEIVING_COVERAGE_MATRIX.md)
records actual implementation gaps without replacing this dictionary.

Source: [SRC-004](../00-governance/team-answers/FACTORY_PURCHASE_RECEIVING_2026-10-20.md).
Every Persian label below preserves the Owner's spelling. English text is an
identified technical translation, not a replacement business term. Requiredness
and entry actor are confirmed factory facts; logical ownership levels are
**proposed conceptual placement**, not table/column definitions or approved writes.
The [baseline](PURCHASE_RECEIVING_REQUIREMENTS_BASELINE.md),
[trace matrix](PURCHASE_RECEIVING_REQUIREMENTS_TRACE.md) and
[reconciliation questions](PURCHASE_RECEIVING_RECONCILIATION.md) control interpretation.

Stage A = order registration by Ms. Masoumi; stages B–D = arrival/verification/
receipt by Mr. Karimi. “Verify” means compare applicable ordered attributes with
accepted actual evidence and preserve both, not a QC gate or automatic rejection.
Identifiers/dates/consignment evidence have no invented ordered counterpart.
Receiving confirmation and technical attribution are separate from original entry.

Common validation: require mandatory fields only at their relevant stage; optional
fields may be absent. No new format, calendar, pattern, unit for dimensions,
numeric limit, default, uniqueness namespace, RAL pattern or automatic tolerance
is supplied. Existing runtime constraints remain current behavior, not newly
approved limits for these future fields. Missing units/representation remain
questions, never an invitation to round or normalize business identities blindly.

| Requirement / factory no. | Original Persian name | English technical meaning | Required | Entry actor | Entry stage | Proposed logical level | Evidence-supported validation | Verification / mismatch treatment | Genuine ambiguity |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REQ-INBOUND-F01 / 1 | شماره سیستم | Internal System Code / physical-unit traceability code | YES | Mr. Karimi | B–D receiving | Physical unit | Distinct independently traceable code for each physical unit; physically associated with it | Identity, not an ordered specification; retain unit/order/line/arrival/receipt links | Namespace, reuse/issuance and legacy duplicates; distinct from existing nonunique Internal Code |
| REQ-INBOUND-F02 / 2 | شماره سفارش | Seller-provided purchase order number | YES | Ms. Masoumi | A purchase registration | Order | Supplied by seller; factory requires uniqueness, namespace unresolved; used for receiving lookup | Match waybill reference to original order; preserve original reference | System/seller/site/time namespace and ambiguous lookup resolution |
| REQ-INBOUND-F03 / 3 | شماره بارنامه | Waybill number | YES | Mr. Karimi | B–D receiving | Arrival/waybill | Identify the arriving consignment; same order number may occur on different waybills | Arrival evidence, not an ordered attribute; repeated PO number is not a duplicate waybill | Waybill namespace/reuse and shared-document relationships |
| REQ-INBOUND-F04 / 4 | شماره بارنامه حواله (برگ زرد) | Yellow-copy waybill/reference | NO | Mr. Karimi | B–D receiving | Arrival/waybill, provisional | Retain supplied yellow-copy reference if present; not a mandatory second document | No ordered comparison established | Exact relationship to primary waybill and receipt |
| REQ-INBOUND-F05 / 5 | شماره رسید انبار | Warehouse receipt reference | YES | Mr. Karimi | B–D receiving | Goods receipt | Enter from an already existing document; ERP must not assume business-number generation | Receipt evidence distinct from technical UUID/key | Uniqueness scope and one/many arrival/document relationship |
| REQ-INBOUND-F06 / 6 | شماره کامیون | Truck number | NO | Mr. Karimi | B–D receiving | Arrival/waybill | Retain supplied truck number if present | Arrival evidence; no ordered truck value established | Identifier meaning/format and vehicle data handling |
| REQ-INBOUND-F07 / 7 | شماره آیتم | Item number | NO | Ms. Masoumi | A purchase registration | Order line | Optional original line reference; must not be mandatory just to identify a technical line | Line matching/reference; no silent rewrite of purchase reference | Seller numbering/namespace and treatment of absent/ambiguous item labels |
| REQ-INBOUND-F08 / 8 | نوع کالا | Material / product type | YES | Ms. Masoumi | A purchase registration | Order line; confirmed actual on physical unit | Record ordered type and actual verified type separately if different | YES — preserve original and accepted actual plus discrepancy | Factory terms to existing COIL/SHEET/ANGLE/BEAM/OTHER mapping; no extra enum invented |
| REQ-INBOUND-F09 / 9 | عرض | Width | YES | Ms. Masoumi | A purchase registration | Order line; confirmed actual on physical unit | Mandatory ordered width; retain received value when different | YES — persistent original/actual comparison | Unit/precision/representation and actual-evidence method; no mm default |
| REQ-INBOUND-F10 / 10 | ضخامت | Thickness | YES | Ms. Masoumi | A purchase registration | Order line; confirmed actual on physical unit | Mandatory ordered thickness; retain received value when different | YES — persistent original/actual comparison | Unit/precision/representation; no limit or rounding rule |
| REQ-INBOUND-F11 / 11 | رنگ | Color | NO | Ms. Masoumi | A purchase registration | Order line; actual physical-unit evidence where applicable | Preserve optional ordered color and any confirmed mismatch | YES where supplied/applicable; absence is not an invented rejection | Value catalogue and evidence when original is absent |
| REQ-INBOUND-F12 / 12 | شماره رئال رنگ | RAL color number | NO | Ms. Masoumi | A purchase registration | Order line; actual physical-unit evidence where applicable | Preserve optional RAL reference; no fixed-digit or color-dependency rule supplied | YES where supplied/applicable; retain both values | Format/catalogue and comparison when no original RAL exists |
| REQ-INBOUND-F13 / 13 | طول | Length | NO | Ms. Masoumi | A purchase registration | Order line; actual physical-unit evidence where applicable | Optional descriptive length, not a second stock quantity | YES where supplied/applicable | Unit/precision/representation; no weight conversion inferred |
| REQ-INBOUND-F14 / 14 | کیفیت | Quality / grade | NO | Ms. Masoumi | A purchase registration | Order line; actual physical-unit evidence where applicable | Optional material quality/grade descriptor | YES where supplied/applicable; no QC approval workflow | Grade meaning/catalogue; must not become an MVP QC gate |
| REQ-INBOUND-F15 / 15 | وزن | Weight per individual physical unit (W1) | YES | Ms. Masoumi | A purchase registration | Order line per-unit specification; separately accepted weight on each physical unit | Weight of ONE unit, not line total; accepted per-unit W1 supplies confirmed unit stock kg; exact whole-kg policy retained | YES — preserve ordered W1 and differing confirmed W1; no destination per-unit weighing assumed | Source/authority for changed W1 without unit weighing; measured-kg provenance conflict |
| REQ-INBOUND-F16 / 16 | تعداد | Number of physical units ordered on this item line | YES | Ms. Masoumi | A purchase registration | Order line | Count ordered physical units; track current/cumulative received and outstanding separately | Compare delivery progress, not overwrite ordered count; partial receipt alone is not mismatch | Over-delivery/rejection/remainder changes; no new numeric bounds or second stock ledger |
| REQ-INBOUND-F17 / 17 | تاریخ ثبت سفارش | Purchase order registration date | YES | Ms. Masoumi | A purchase registration | Order | Actual purchase registration date; distinct from arrival and DB recording time | Historical order evidence; not replaced during verification | Calendar/representation; no future-date or chronology restriction invented |
| REQ-INBOUND-F18 / 18 | تاریخ ورود | Actual truck/consignment arrival date | YES | Mr. Karimi | B–D receiving | Arrival/waybill | Actual arrival date for this consignment | Arrival evidence, not a replacement for order registration date | Calendar/time representation; not automatically system receipt-posting time |
| REQ-INBOUND-F19 / 19 | شماره محصول | Product number | YES | Mr. Karimi | B–D receiving | OPEN — physical unit, line/product or other level to be resolved | Mandatory at receiving; preserve its separate identity | No original counterpart/uniqueness established; comparison mapping unresolved | Actual factory meaning/cardinality; must not assume existing Sheet-only productCode or Internal System Code |
| REQ-INBOUND-F20 / 20 | شرکت ارسال کننده (مبدا) | Originating/sending company | NO | Mr. Karimi | B–D receiving | Arrival/waybill, provisional | Record sending company if provided | Source evidence; not automatically the seller or supplier master | Sender/seller relationship and representation |
| REQ-INBOUND-F21 / 21 | وزن خالص گزارش مبدأ | Origin-reported net consignment weight (W2) | YES | Mr. Karimi | B–D receiving | Arrival/waybill | From driver's waybill; net of THIS consignment, not total PO; separate from W1 | Aggregate evidence; no allocation to units or automatic difference acceptance/rejection | Source representation/precision and missing/disputed mandatory evidence procedure |
| REQ-INBOUND-F22 / 22 | وزن خالص باسکول مقصد | Destination weighbridge net consignment weight (W3) | NO | Mr. Karimi | B–D receiving | Arrival/waybill | Optional net of full arriving consignment; no per-unit destination weight or allocation | Aggregate comparison only; cannot replace W1 or trigger automatic effects | Representation and optional observation provenance; device/ticket details remain deferred |
| REQ-INBOUND-F23 / 23 | نام راننده | Driver name | NO | Mr. Karimi | B–D receiving | Arrival/waybill | Retain driver's name if provided; no mandatory identity-document field | Arrival evidence; no ordered-driver comparison | Data visibility/handling/retention; no extra personal fields inferred |

## Reconciliation totals and non-fields

| Entry actor | Mandatory field numbers | Optional field numbers | Total |
| --- | --- | --- | --- |
| Ms. Masoumi | 2, 8, 9, 10, 15, 16, 17 (7) | 7, 11, 12, 13, 14 (5) | 12 |
| Mr. Karimi | 1, 3, 5, 18, 19, 21 (6) | 4, 6, 20, 22, 23 (5) | 11 |
| All | 13 mandatory | 10 optional | 23 |

Technical UUIDs, idempotency keys, trusted actor/database timestamps, existing
location context, mismatch markers and derived receipt-progress totals are system
linkage/control data, not extra entries in the 23-field factory register. The
existing completed-purchase supplier/description fields must not be silently
added as new mandatory fields here. Field 16 progress counts do not create a
parallel inventory count ledger; authoritative stock quantity remains exact kg.
