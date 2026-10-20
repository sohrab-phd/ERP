---
id: SRC-005
title: Subsequent Owner I1 purchase and material reference policy clarification
phase: 12-implementation-planning
status: recorded
version: 1.0.0
owners: [project-sponsor, business-process-owner]
depends_on: [GOV-SOURCES-001, SRC-004]
last_reviewed: 2026-10-20
approval: Actual Owner clarification; confirmed business policy only, no detailed design or implementation authorization
supersedes: null
---

# SRC-005 — Subsequent Owner clarification, not earlier factory-visit evidence

Provenance: actual Owner message on 2026-10-20, “ERP Purchase & Receiving — Step 2
Acceptance and Final I1 Business Policy Update.” This is a subsequent decision
record. It does not alter [SRC-004](FACTORY_PURCHASE_RECEIVING_2026-10-20.md) or imply
that these answers were collected during that earlier investigation. No sample
document, signature, numerical precision rule or implementation approval is invented.

## 1. Acceptance and task limit

The Owner formally accepts Step 2 analysis and its five documents at local commit
`b8666b76602f2d002c4cacc5e8b689fe0130fb24`. Push is **not confirmed**. Acceptance
covers analysis/documentation, not proposed technical choices, APIs, migrations,
runtime behavior or product gates. Eleven accepted backend capabilities remain.
The authorized task is focused policy documentation and I1 readiness assessment
only; stop before Step 3. No remote push or runtime/control changes.

## 2. B01 purchase-order-specific decision

Seller-provided purchase order number is unique across the entire factory,
regardless of supplier, within the appropriate ERP installation/factory boundary.
Preserve the exact supplied reference; Karimi looks up by it. Duplicate registration
must not overwrite or merge an order. Different waybills/arrivals may refer to the
same PO. UUID, idempotency key, waybill and warehouse receipt references remain
distinct. No supplier master/additional mandatory field is needed. Existing completed-
purchase documentary evidence is unchanged. Only the PO business portion of B01
is OWNER RESOLVED; other identity namespaces are not answered.

## 3. B07 units, date and weights

- عرض — width: meter (m), mandatory. ضخامت — thickness: millimeter (mm), mandatory.
  طول — length: meter (m), optional. No implicit conversion, rounding, tolerance
  or approved precision follows; technical representation is separate analysis.
- تاریخ ثبت سفارش — the date entered by Masoumi is Solar Hijri / Jalali. Preserve
  business-date meaning separately from trusted DB timestamps; avoid conversion
  shifts. Future tests include Jalali validity and leap-year boundaries. Gregorian/
  ISO internal storage can be analyzed but is not an approved final contract.
  Receiving-stage dates are not automatically governed by this clarification.
- W1 remains mandatory weight of one physical unit, initially entered by Masoumi;
  ordered count is physical units on a line. Accepted W1 supplies each confirmed
  unit's stock kg without independent destination weighing of each unit. W2 remains
  mandatory origin waybill net for one consignment, W3 optional destination consignment
  net. No W2/W3 distribution/substitution for W1; PO registration has no stock effect;
  IPS remains the sole inventory posting authority. Do not reopen these definitions.

## 4. Required shared extensible reference lists

نوع کالا (Material / Product Type), کیفیت (Quality / Grade) and رنگ (Color) use
predefined reusable selection lists. An authorized operator must be able to add
a missing legitimate value and use it during the work without another employee
or mandatory third-party approval. This is required functionality. Type remains
mandatory; quality/color remain optional. شماره رئال رنگ (RAL) stays separate and
optional, without mandatory dependencies. The original register stays 23 fields;
catalogue metadata/technical IDs are not new mandatory user-entered factory fields.

Both organizational ACT-PROC and ACT-WH may read/select relevant common values,
add missing values and reuse newly added values within the authorized business
scope. Masoumi does so while ordering; Karimi while describing verified actual
goods. Preserve original ordered and actual received specifications separately
when different. Reusable lists are not uncontrolled free-text substitutes.

Analyze safe identity, accidental duplicates, concurrent equivalent additions,
trusted creation attribution, historical values and organization isolation using
existing owners. Exact normalization, technical IDs, equivalence/uniqueness rules
and storage contracts remain design choices; do not silently merge distinct terms.

## 5. Authority and material classification boundaries

Organizational ACT-PROC may register/read operational orders and lines and add/select
the three lists. ACT-WH may look up orders by seller number, read original receiving
specifications and add/select the same lists. Both use individual authentication
and explicit current organizational grants, never personal-name checks. This core
I1 business authorization is OWNER RESOLVED, not implemented permission changes.

Catalogue addition grants no original PO editing, receipt confirmation, acceptance
of exceptional/unordered goods, stock posting or correction authority. ACT-WH cannot
rewrite Masoumi's original order; ACT-PROC gains no receiving/IPS authority. Later
I2 progress/discrepancy reads and actual receiving contracts remain separately
approved work. Do not widen completed-purchase/proforma reads, infer broad ACT-SEC
access, or give customers/unrelated roles catalogue modification. Preserve current
revocation, durable command, audit, trusted actor and installation/organization isolation.

An extensible business Material Type does not automatically change Inventory's
technical enum or bypass Inventory/Production/Sales/Genealogy rules. Analyze their
separation and required mapping explicitly; genuinely new technical classes need
separate reconciliation, not silent admission. No mapping rule is supplied here.

## 6. Three cases and remaining scope

A: purchasing may create/use a missing legitimate reference value on an ordered
line. B: receiving may create/use a missing reference value for the actual goods,
preserving original/actual discrepancy evidence. C: unordered physical goods may
be described with a newly added value, but this does not add a PO line, deem them
ordered, authorize acceptance/excess/stock or bypass verification. Acceptance,
holding, rejection and escalation remain unresolved B06 policy.

Do not reopen resolved PO uniqueness, dimension units, registration calendar,
W1/count meanings or core role/addition duties. Analyze numeric representation,
technical-class mapping, catalogue identity/duplicates, repeated-line selection
without optional item number, and any genuine I1 validation gap separately.
Do not expand I2-only questions into I1 or ask the factory to choose tables, APIs,
indexes, normalization algorithms or transaction lock orders.

The Owner permits reviewed/checked local documentation commits only. No application
code, SQL, executable contracts/permissions, enum/catalogue implementation, IPS/
receipt behavior, historical record or gate/unlock edits. No UAT, production
acceptance or new backend capability. See [APR-033](../approved-baselines/APR-033-i1-policy-clarification.md)
and the [policy amendment/readiness assessment](../../02-domain-business-architecture/PURCHASE_RECEIVING_I1_POLICY_AMENDMENT.md).
