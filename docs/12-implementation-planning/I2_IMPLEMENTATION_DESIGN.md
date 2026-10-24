---
id: PLAN-I2-DESIGN-001
title: Bounded I2 multi-PO multi-unit receiving implementation design and acceptance
phase: 12-implementation-planning
status: accepted
version: 1.0.0
owners: [chief-solution-architect, data-architect, security-architect, delivery-lead]
depends_on: [APR-042, APR-041, APR-040, APR-039, SRC-007, SRC-004, SRC-005, SRC-006, IMPL-I1-001, IMPL-I1-TRACE-001, DOM-INBOUND-FIELDS-001, PLAN-INBOUND-DECISIONS-001, ADR-0016]
last_reviewed: 2026-10-25
approval: APR-042 formal Owner design acceptance and separate implementation authority
supersedes: null
---

# I2 focused design — OWNER ACCEPTED under APR-042

[APR-042](../00-governance/approved-baselines/APR-042-i2-implementation-authorization.md)
explicitly accepts I2-CAP-01/02 and the complete focused design, and separately
authorizes bounded implementation from251f471a135e88084645c3a573f240a6f5770406.
No repeated general design or factory-policy question. Earlier conditional approval
in APR-041 is historical; all ten SRC-007 decisions remain resolved. This design
is not runtime test proof. [Actual implementation/verification](I2_IMPLEMENTATION_STATUS.md)
and [60-ID trace](I2_IMPLEMENTATION_TRACE.md) govern delivery evidence. Twelve
capabilities remain Owner accepted; I2 backend acceptance, UAT/deployment and push
are not implied by design approval.

## 1. Existing seams and exact proposed reconciliation

| Actual code / invariant | Smallest proposed I2 change |
| --- | --- |
| [ReceiptService.post](../../apps/backend/src/modules/procurement/receipt-service.ts) and [0006](../../database/migrations/0006_goods_receipt.sql): one legacy receipt/Unit, descriptive nonunique internalCode; no required PO/ticket | Preserve v1 payload, target, no-PO eligibility, replay and source meaning. Add only common physical-code protection to new admissions, as required by SRC-007-B02. Previously permitted NEW duplicate-code intake is deliberately superseded; historical facts and existing replay remain valid. |
| [InventoryReceiptService.receive](../../apps/backend/src/modules/inventory/receipt.ts) hardcodes PostGoodsReceipt/measuredKg; material_lot has a unique receipt FK | Add sibling Inventory-owned receiveMany and new typed origin table; never synthesize child PostGoodsReceipt commands, fake legacy receipt rows or relabel old measuredKg. |
| [Composition IPS policy](../../apps/backend/src/composition-root.ts) validates the entire original legacy receipt payload | Add an exact new-command admission/effect-validation branch, patterned on [InventoryProductionService](../../apps/backend/src/modules/inventory/production.ts). Keep the same original actor/request/target/transaction; do not strip or replace payload. |
| [IPS](../../apps/backend/src/modules/inventory/posting-service.ts) allows128effects/call; [Kg](../../apps/backend/src/modules/inventory/quantity.ts) exact capacity below10^20 | One STOCK_IN per explicitly accepted unit at W1. Prelock the entire actual batch, then sequential chunks<=128 inside ONE transaction. No IPS arithmetic rewrite or separate commit per chunk. |
| [I1 sources](../../apps/backend/src/modules/procurement/inbound-contracts.ts) immutable SELECT/INSERT, technical line IDs | Owner read ports load originals; sorted line advisory locks and fresh aggregate counts protect progress. No UPDATE privilege or FOR UPDATE on immutable I1 rows. |
| [Genealogy sources/projection](../../apps/backend/src/modules/genealogy/contracts.ts), [projection](../../apps/backend/src/modules/genealogy/projection.ts) customer-reachable, legacy measured origin | Add discriminated immutable unit-origin input, preserving legacy serialization. Procurement supplies full operational provenance separately; shared arrival is not an ancestry edge or a way to enumerate sibling cargo. |

## 2. Domain, identity and immutable source model

One confirmed `InboundArrival` represents one real physical arrival/consignment,
not one PO. It owns the arrival date, truck/sender/driver, ONE whole-consignment W2
and optional W3. `waybills[]` names its actual unique waybill documents; one or more
may be represented without copying the physical arrival. `warehouseReceipts[]`
names distinct externally issued receipt documents for this arrival. A receipt
reference can never be reused for another arrival. Every `ReceivedPhysicalUnit`
selects one waybill and one warehouse receipt within that arrival. A document must
be used by at least one accepted unit; unused/rejected-only paperwork is outside
this confirmed-receiving command. No automatic weight addition across waybills.

W2's source points to the declared waybill evidence establishing the net for the
ENTIRE physical consignment; W3's optional observation belongs to the same whole
consignment. If supplied papers contain only partial weights and no valid whole-
consignment W2, mandatory data is not complete: do not invent a sum, draft, fallback
or post stock. This does not block ordinary complete-document receiving design.

Unit association is explicit, not inferred from similar attributes:

- `ORDER_LINE`: real orderId+stable lineId, including repeated/unnumbered I1 lines.
- `ORDER_ONLY`: an actual declared relationship to a real order but no ordered
  line, with explicit unordered acceptance. It creates no fictional I1 line and
  changes no line's received count; the order view labels it unordered.
- `UNLINKED`: accepted unexpected/no-PO goods, with no fabricated order reference.
  WH sees it through arrival reads; it is not disclosed as a selected PO's unit.

Each accepted physical unit gets its entered system code, opaque entered product
number, actual attributes/W1, explicit manual acceptance, own source UUID/ordinal
and one Inventory Unit/Lot/material/effect. UUIDs are technical, never business
codes. Units are supplied explicitly; never enumerate an ordered unit count.

An arrival is created once atomically with its complete accepted-unit/document
arrays. No persisted incomplete-mandatory draft, incremental append, amend,
cancel or post-post correction operation. Karimi can verify/correct ACTUAL input
before confirming; no original order is modified. Goods not manually accepted
are not members of the confirmed array and never post; no QC/hold/rejection
subsystem is introduced. Recording nonaccepted custody/observations is not claimed
as an implemented workflow by this bounded design.

### Business identities and comparison

Selected technical namespace (APR-041): factory=installation, independent exact-text
uniqueness for system code, waybill and external receipt. Preserve raw text; use
C/byte-stable equality. No trimming, case folding, digit/Yeh/Kaf mapping, fuzzy
matching or silent Unicode normalization. PO lookup alone retains approved R1.
Same spelling in different identifier kinds is allowed; technical UUID/key remain
separate. These exact comparison namespaces are selected by APR-041; the separate text
capacity is accepted by APR-042 as I2-CAP-01, not a repeated business uniqueness question.

## 3. Exact field/provenance contract

The [original23field register](../02-domain-business-architecture/PURCHASE_RECEIVING_FIELD_REGISTER.md)
is unchanged. Below are exactly the11receiving fields:6mandatory/5optional, entered
by Karimi/current individual ACT-WH at CONFIRMATION. Technical IDs, location context,
verification/acceptance metadata and source references are not extra factory fields.

| Original ID / Persian name | Required | Proposed input / ownership | Validation and provenance |
| --- | --- | --- | --- |
| F01 شماره سیستم | YES | units[].internalSystemCode / physical unit | Manually supplied/physically labelled; cross-path exact uniqueness; never generated |
| F03 شماره بارنامه | YES | waybills[].reference; unit.waybillId / document | External unique reference; each unit selects its actual same-arrival document |
| F04 شماره بارنامه حواله (برگ زرد) | NO | waybills[].yellowCopyReference | Preserve supplied opaque optional reference; no invented format/uniqueness |
| F05 شماره رسید انبار | YES | warehouseReceipts[].reference; unit.receiptId | Enter existing external document number; unique, one arrival, not ERP-generated |
| F06 شماره کامیون | NO | arrival.truckNumber | Preserve opaque supplied truck identifier; no plate schema assumed |
| F18 تاریخ ورود | YES | arrival.arrivalDateJalali | Explicit Jalali YYYY-MM-DD; proposed reuse of validated1206–1498YMD/profile, no timezone/date substitution |
| F19 شماره محصول | YES | units[].productNumber | Per-unit preserved opaque text; not unique, item number, system code or SHEET productCode |
| F20 شرکت ارسال کننده (مبدا) | NO | arrival.originatingCompany | Preserve text, no supplier master or seller-equality assumption |
| F21 وزن خالص گزارش مبدأ | YES | arrival.originNetKg / W2 | Raw exact decimal kg from waybill evidence for the full consignment; recorded once |
| F22 وزن خالص باسکول مقصد | NO | arrival.destinationNetKg / W3 | Raw exact decimal kg for same full consignment; absence valid; no device/ticket prerequisite |
| F23 نام راننده | NO | arrival.driverName | Preserve supplied optional text; not excluded from authorized PROC view |

I2-CAP-01 OWNER ACCEPTED under APR-042: NEW receiving identifiers/ordinary text
use at most128Unicode scalars AND512UTF8bytes, with raw preservation and blank/Cc
validation. Explicit capacity rejection, never truncation. These are initial
technical limits, not permanent factory maxima. Existing legacy v1 retains its
128UTF8byte input limit; no implicit widening or reinterpretation.
W2/W3 use plain unsigned ASCII decimal strings `[0-9]+([.][0-9]+)?`, including
source leading/trailing zeros, maximum the shared envelope's65536byte string
capacity. No numeric typmod, Number, Kg, conversion, arithmetic or fixed fractional
precision applies. Zero is retained as document evidence with explicit manual
confirmation, not an automatic stock/tolerance decision; signed/exponent/locale-
separator inputs are invalid under this proposed transport grammar. Unsupported
representation/capacity is an explicit error, never rounding. These are technical
admission proposals, not factory measurement maxima or a new rejection tolerance.

Actual unit attributes reuse the12purchasing meanings where applicable: selected
Material Type, required exact width m/thickness mm, optional color/RAL/length m/
quality, accepted positive whole W1<10^20. W1 for an unlinked unit is explicitly
entered/accepted by WH; no order is invented. Product number is always independent.
For linked units the original order/line is loaded and frozen by reference; the
request cannot supply an authoritative replacement ordered snapshot.

Each optional actual attribute supports omitted=not recorded, explicit null=
confirmed absent, value=observed value. Missing optional data never blocks stock
and never falsely means verified equality. Required actual values cannot be null.
Persist original/actual comparison states `SAME`, `CHANGED`, `CONFIRMED_ABSENT`,
`NOT_RECORDED`; original absence versus new actual value is explicit. Dimensions
compare mathematically with exact decimal arithmetic without rounding, while both
lexemes remain preserved. Catalogue IDs/labels and opaque text compare exactly;
R1 is not applied. Persistent discrepancy JSON names affected fields, original
line/unit, actual values and approval; partial delivery is progress, not mismatch.

Changed W1 provenance is honestly `WH_ACCEPTED_DECLARED_UNIT_WEIGHT`, trusted actor
and DB recording time, original I1 line/W1 when present, and explicit approval.
Available supporting reference text may be recorded but no additional supplier/
Masoumi approval or fabricated document requirement is imposed. W2/W3 never become
per-unit measurement evidence. No existing measuredKg origin is reinterpreted.

## 4. Minimal proposed command and queries

One new command: **ConfirmPurchaseReceiving v1**, target
`inbound-arrival/{arrivalId}`; current personal organizational ACT-WH only.
The name includes purchase receiving but explicitly permits ORDER_ONLY/UNLINKED
members under SRC-007-B06. Existing PostGoodsReceipt v1 stays separately available.

- Existing six-member envelope; full original payload/array order/optional presence
  is bound. Closed payload: arrivalDateJalali, optional truckNumber/originatingCompany/
  driverName, originNetKg, optional destinationNetKg, weightSourceWaybillId,
  waybills[{waybillId,reference,yellowCopyReference?}],
  warehouseReceipts[{receiptId,reference}], units[{receivedUnitId,waybillId,
  receiptId,internalSystemCode,productNumber, association, actual,
  acceptance, weightEvidenceReference?, locationId}]. Technical UUIDs are allocated
  before first attempt and retained on recovery; new stock IDs are allocated by
  Inventory within the transaction. locationId reuses existing placement context.
- association is a closed ORDER_LINE/ORDER_ONLY/UNLINKED shape, not an optional
  item-number match. acceptance.confirmed=true is explicit per unit; changedW1,
  specificationMismatch, excess and unordered flags must acknowledge the actual
  derived conditions where present. They never grant unrelated authority. Actor/
  approvedAt/profile/classification/comparison keys/stock IDs are server-derived.
- `preconditions.lineProgress[]` contains exactly each linked lineId/orderId and
  expectedAcceptedUnitCount read from the owner projection. After locks, stale
  counts reject GUARD_CONFLICT; a previously matched intent never silently becomes
  an excess acceptance. A fresh intentional submission needs a new key; first
  resolve any uncertain original command using its original key/input.
- Re-read originals, exact catalogue selections, material support and progress;
  derive unit comparisons. WH may manually accept all authorized mismatches,
  changed W1, excess or unordered goods with the relevant explicit flags. No
  automatic acceptance, extra approver, PO rewrite, count clamping or invented QC.

Minimal accepted outcome: arrivalId, acceptedUnitCount, state=CONFIRMED, event=
PurchaseReceivingConfirmed. No complete cargo/driver/header in durable response or
ordinary logs. Generic guard errors identify the submitted field/ordinal safely:
duplicate physical code/document is understandable without returning the old
record/actor/other cargo. Existing status families remain200accepted/replay,
422durable business rejection,409changed binding,401/403identity/admission,
404scoped missing and503technical/uncertain. Only named immediate constraints map
after savepoint rollback with current authority; unknown/deferred/commit faults
are technical, never a fabricated durable accepted/rejected result.

Two new owner queries, v1, no new generic module:

| Query / proposed POST route | Roles | Complete bounded projection |
| --- | --- | --- |
| GetReceivingArrival / purchasing/receiving/arrivals/query | Organizational ACT-WH | Exact arrivalId; shared header, selected document/unit pages, all recorded actual/original/approval/source/Inventory links |
| GetPurchaseOrderReceiving / purchasing/receiving/orders/query | Organizational ACT-PROC / ACT-WH | Real orderId root; LINES or RECEIVED_UNITS view, original purchasing fields, accepted/current/cumulative/outstanding/excess and every recorded linked/attributed receiving field |

No new SEC/customer/unrelated grants; WH read/add catalogues remains accepted I1.
No new per-order employee ACL is invented: authorize the exact installation/
authority and current org grant, then constrain projection to the selected order.
PROC gets shared header including driver/truck/sender/W2/W3 and the actual selected
unit's waybill/yellow-copy/receipt/product/system code/attributes/approvals. It does
not receive sibling PO IDs/references/units, unrelated UNLINKED goods, global cargo
counts, private binding or entire stored outcomes. ORDER_ONLY units explicitly
attributed to this real order are visible but not line fulfilment. Header weights
are labelled shared-consignment evidence, never recomputed as a selected-PO sum.

Queries paginate by immutable ordinal/source IDs in one bounded read snapshot per
page; exact counts/progress and selected page derive coherently. Recheck current
Identity after the snapshot before disclosure using the established read pattern.
Cross-page activity may change totals; report page snapshot/as-of metadata rather
than claiming one long-lived snapshot. Full field content is retrievable across
pages, no silent omitted driver/optional values or truncated business strings.

## 5. Proposed additive PostgreSQL model and code safety

All new tables carry installation_id, authority_scope, explicit composite source
keys/FKs, trusted issuer/subject/role/request/key/time and immutable source binding
where appropriate. New business rows require authority_scope=installation_id.
Technical UUIDs never replace externally entered references.

| Proposed table / writer | Keys, relationships and integrity |
| --- | --- |
| procurement.inbound_arrival | PK(scope,arrival_id), frozen document/unit counts, shared date/profile/W2/W3/source-waybill/truck/sender/driver; INSERT/SELECT only |
| procurement.inbound_waybill | PK(scope,waybill_id), FK same arrival, UNIQUE(installation_id,reference COLLATE C), unique arrival ordinal; optional yellow-copy reference |
| procurement.inbound_warehouse_receipt | PK(scope,receipt_id), FK same arrival, UNIQUE(installation_id,reference COLLATE C); one receipt cannot span arrivals; many same-arrival receipts permitted |
| procurement.inbound_received_unit | PK(scope,received_unit_id), unique arrival ordinal, same-arrival composite FKs to waybill/receipt; optional real I1 order/line composite FKs; actual values, provenance, comparison JSON, manual approval, expected progress; no UPDATE/DELETE |
| procurement.inbound_physical_code_claim | UNIQUE(installation_id,raw_code COLLATE C); exactly one legacy_receipt_id or received_unit_id source, scoped source FK and unique source identity; append-only technical identity guard, no historical seed/backfill |
| inventory.inbound_unit_origin | PK(scope,unit_id), scoped unique Lot/material/effect/source-unit IDs; FK actual new Procurement source and Inventory Unit/Lot; accepted_unit_weight_kg, weight_basis, technical category/profile and location. Inventory owner only; never Ledger/Balance writes here |

Discrepancies and association evidence live in the immutable unit fact; no generic
discrepancy workflow/table is necessary. PO associations derive from source units;
do not maintain a second mutable PO inventory/count ledger. Index linked order/
line/arrival/source keysets and legacy (installation_id,internal_code COLLATE C).
Freeze N/unit/document ordinals with scoped FKs/unique positions and deferred
completeness guards, including one Inventory origin/stock link per accepted unit.
Force the named new bundle checks before handler acceptance (SET CONSTRAINTS on
those named constraints), then return to the envelope. COMMIT-time failures still
roll back the whole bundle and follow original-key uncertainty recovery.

Exact stock-link predicate: Inventory publishes a narrow read-only database
integrity predicate used by the deferred source/origin guards. For EVERY source
unit it requires exactly one same-scope inbound origin, real Inventory Unit/Lot,
material/effect identity and Ledger row with source_fact_id=receivedUnitId and
the exact effect/unit IDs; Ledger binding denotes STOCK_IN, on_hand_delta equals
accepted W1 exactly, reserved_delta=0, command/version and trusted actor agree.
Origin/raw code/accepted W1/location/business Material Type reference must match
the immutable received source, and origin technical kind/location/Lot must match
the created Unit. The scoped effect FK targets existing Ledger effect uniqueness;
uniques plus the predicate reject a missing, reused, forged or mismatched effect.
The predicate only SELECTs through the explicitly published relational dependency;
Procurement application SQL never reads/writes stock. It checks initial source
creation, not future on-hand balance or downstream Unit state, which may legitimately
change. Named checks run before accepted outcome/audit; real PostgreSQL direct-
insertion tests must prove these links, not merely application happy paths.

### Cross-path Internal System Code protection

1. Before rollout, read actual legacy goods_receipt/material_lot through their
   owners: verify codes/receipt-Unit linkage agree and list any repeated raw code
   across the factory installation, not merely one authority. Owner's historical
   uniqueness statement is evidence, not a claim that a data scan already passed.
   Contradictions are reported for the affected code/scope; no guessed merge,
   rename, historical update or backfill. Valid other codes are not redesign blockers.
2. Add a narrowly privileged fixed-SQL AFTER INSERT claim trigger to legacy
   goods_receipt and new inbound_received_unit. Derive scope/code/source from NEW,
   not caller-supplied claim fields; lock/check exact historical Procurement code
   (excluding its own newly inserted legacy row) and insert the same authoritative
   claim. Immediate UNIQUE serializes legacy/legacy, legacy/I2 and I2/I2 races.
   No historical seeding: fixed older codes are checked on each new claim.
3. PROPOSED restricted SECURITY DEFINER claim helper: fixed pg_catalog search_path,
   schema-qualified fixed Procurement SQL, no dynamic SQL/transaction control,
   PUBLIC execution revoked, runtime has no direct claim INSERT/UPDATE/DELETE or
   DDL. Trigger writes only Procurement identity evidence, never Inventory stock.
   Source/claim deferred checks prevent missing/fake/orphaned claims and require
   a legacy claim's source to reach normal POSTED before COMMIT. This narrow
   database-owned guard is the narrowly accepted dependency reconciliation, not
   general database business orchestration or implementation authority.
4. Protect legacy code/source fields from UPDATE while preserving existing valid
   state/stock-ID transitions; immutable new rows/claims cannot change code. Add
   a scoped composite source-code FK from legacy material_lot to goods_receipt,
   with supporting redundant parent unique key and an explicit COLLATE C exact-
   comparison predicate, so a direct origin insert cannot
   introduce a different unclaimed code. Validate real old consistency before
   enabling/validating this addition; never silently repair old rows. Verify actual
   database column/operator collations; the FK alone must not inherit a broader
   equality rule. The explicit exact predicate remains authoritative independently
   of locale, without rewriting existing columns. DDL installation
   must block/wait for old inserts before claiming guards are active; no ingress gap.
5. Legacy replay finds its existing durable result before NEW source insertion;
   its own claim must not turn replay into duplicate rejection. New distinct intent
   reusing old/new code rejects safely. All claim writes roll back with failed source,
   IPS, audit or outcome. Future code paths must use these same guards.

The old standalone API remains no-PO/no-ticket and source-compatible. Rejecting a
NEW duplicate physical code is the explicit SRC-007 policy change, not falsely
claimed identical historical duplicate-admission behavior. No historical migration
is edited. Propose next available additive0018 (recheck numbering when authorized),
with owner objects/FKs/guards/grants/checks in dependency order, one migration-owner
transaction and checksum ledger; no executable SQL file is created now.

## 6. IPS, concurrency, atomicity and recovery

One original transaction: existing envelope idempotency lock → Identity account/
session/current-grant locks → complete sorted Procurement source resources
(arrival UUID, external documents, all referenced PO lines, all unit codes) →
fresh validation → insert complete UNCOMMITTED Procurement header/documents/unit
facts and derived code claims → Inventory verifies exact persisted sources through
its owner port → Inventory origin/category resources if any → globally pre-acquired
sorted Unit/effect locks → IPS chunk effects → Inventory origins → force named
bundle completeness/stock-link checks → outcome/audit → COMMIT. These uncommitted
source rows are not a persisted draft and cannot be disclosed before COMMIT.
No source verification reads a future/nonexistent row: the source array is durable
only with the final bundle, but already visible on its own original transaction
before the first stock effect. Mismatch or subsequent failure rolls everything back.

Sort actual signed advisory hash keys and deduplicate before acquisition,
not just resource labels. Claim triggers use the same code key namespace/order;
legacy intake pre-acquires its complete receipt-UUID plus code resource set in
signed-key order before source insertion, then its existing Sheet/IPS locks.
No later owner-resource acquisition after IPS. Fresh READ COMMITTED rechecks after
waits, current trusted actor throughout; no widening immutable I1 grants for locks.

Inventory.receiveMany verifies all typed immutable unit sources through an admitted
Procurement owner port. Its transaction-bound private admission holds original
actor object, canonical entire original request, source UUIDs and EXACT effects.
Composition authorizes only ConfirmPurchaseReceiving v1/current WH and delegates
validateEffect to this admission. Each STOCK_IN creates its own lot/unit/material/
effect, AVAILABLE, customerScope='', correct actual category/location and kg=that
unit's accepted W1. Effect source factId=receivedUnitId. Unadmitted extra/wrong/
duplicate effect, source, W1 or target is rejected. No nested envelope or altered
context/target/payload; Inventory alone creates origin and IPS alone stock.

All explicit actual-unit/effect IDs are prelocked once before chunking<=128. Any
failure in a later chunk/origin/constraint/audit/outcome rolls back EVERY earlier
chunk and claim. No work is proportional to ordered count. Each unit balance fits
existing Kg independently; whole-arrival/PO totals stay separate Procurement exact
BigInt values, never a stock-in quantity. Existing reservations/production/shipping
consume normal Inventory Units without new financial/closure effects.

Line progress counts only committed ORDER_LINE accepted units, including explicitly
accepted excess. Original ordered count never changes. Expose acceptedCount,
orderedCount, remainingCount=max(ordered−accepted,0), excessCount=max(accepted−ordered,0)
and signed variance, all exact strings. Showing remaining zero never hides excess
or closes an order. ORDER_ONLY/UNLINKED units never fulfil an ordered line.
All lines lock before progress checks; a competing last-slot confirmation causes
stale expected count conflict, not silently changed excess intent. Owner-approved
manual excess proceeds only on a fresh explicit bound decision.

Same key/same original input replays accepted or rejected outcome with fresh
disclosure authority. Changed raw payload/preconditions/array/target under same key
conflicts, even if business references compare equal. Distinct keys competing for
codes/docs have one winner. Deadlocks/timeouts/persistence faults are technical;
unknown COMMIT is resolved on primary with original actor/key/target/payload,
never fresh IDs or inference from a restored/lagging database. No accepted result
or PROC received visibility appears before complete bundle COMMIT.

## 7. Material category and genealogy reconciliation

Business Material Type IS the factory category; do not add a business classification
screen/role/approval command. A small Inventory-owned technical resolver maps actual
known catalogue option IDs/labels to existing COIL/SHEET/ANGLE/BEAM/OTHER semantics
using a versioned finite deployment profile established from real factory names.
It is internal integration metadata, not a new mandatory user field or broad master
data system. Both roles still add/select catalogues immediately under accepted I1.
Known supported options resolve deterministically; an unmapped legitimate new type
produces a precise support incompatibility for that type before stock. No implicit
OTHER, enum widening or catalogue-addition-as-stock-permission.

**Conditional support check R-MAT, not a global business blocker:** the existing
[factory glossary](../00-governance/registers/BUSINESS_GLOSSARY.md) already identifies
Coil, Sheet, angle and beam intake (TERM-018) and Coil terminology (TERM-008).
Reuse established category meanings; do not ask the Owner to reconfirm them. The
actual I1 catalogue UUID/label bindings must be verified from the deployment's
real options against those known meanings, not fabricated from synthetic tests.
Only if a specific real option is semantically ambiguous or technically unsupported,
report THAT exact name and smallest supported choice/missing downstream contract
before admitting that material. No whole-factory reapproval, new classification
role/workflow or block on ordinary supported matched receiving. Source007 does not
name an actual unsupported category, so none is claimed discovered.

Current legacy SHEET requires a separate unique productCode, whereas field19 now
is nonunique opaque productNumber. Proposed new origin deliberately permits I2
SHEET without legacy productCode; physical identity is the unique system code and
Unit UUID. Preserve legacy SHEET CHECK/index/API unchanged. Actual code inspection
finds productCode used by legacy receipt intake/origin/genealogy display, not a
required Production/Sales input. Test downstream supported Sheet handling; never
manufacture productCode from productNumber/system code/UUID or add a seventh
mandatory receiving field. This new-path dependency design is selected within
APR-041, not permission to weaken the old Sheet path.

Inventory origin read ports return a discriminated LEGACY_MEASURED_RECEIPT or
WH_ACCEPTED_RECEIVING_UNIT fact. New provenance has acceptedUnitWeightKg/weightBasis,
source-unit and opaque arrival/document/optional PO-line links; it is not measuredKg.
Generic customer-scoped Genealogy retains existing source reachability before any
new origin disclosure and does not return new PO/driver/whole-arrival cargo fields
to SEC/SALES merely because old genealogy is readable. Detailed I2 provenance is
through authorized Procurement order/arrival projections. Extend typed intake/edge
meaning for per-unit accepted W1, preserving old origin/edge output for old data.
New-source text validation must admit the final Owner-resolved I2-CAP-01 code
capacity without truncation; legacy genealogy text guards/output stay unchanged. No shared-arrival
root enumerates co-travelling units; no document association is
a material-parent edge. New Unit→Lot→accepted source links remain reconstructible
from immutable owner facts and independently usable by later production lineage.

## 8. Proposed capacities and exclusions

Reuse envelope limits256KiB raw/canonical/result, depth32,10000entries,64KiB/string;
new receiving reader uses the existing bounded5s/16active pattern, no old route
limit widening. REMOVE the unsupported independent256-unit/256-document arrival
caps. Each unit selects one actual waybill and receipt; each supplied document
must be used, so document counts are bounded by the explicitly supplied units,
not an invented factory maximum. The existing serialized-body/entry budgets still
bound admitted requests; this is NOT unlimited-size arrival support.128IPS effects
is a CALL limit only: prelock all actual IDs and process every <=128-effect chunk
inside the SAME original transaction, with complete-array integrity and one COMMIT.
A valid257+unit arrival that fits the envelope must not be rejected merely by count.
Never split a physical arrival into separately committed copies to bypass capacity.
If real receiving requires an arrival beyond the existing envelope, report that
exact transport incompatibility before implementation; no business workaround or
limit expansion is authorized by this documentation.

Read pages default50/max100 and<=256KiB serialized response. The assembling query
stops before byte overflow with a stable cursor; no data truncation. Before source
insertion preflight shared header/document projection plus each largest mandatory
unit/line projection for both WH/PROC shapes: a committed record must always be
retrievable at least one complete item/page. Declared max counts do not guarantee
all maximum-size strings fit one body. Deterministic size/unsupported-calendar
errors occur before irreversible source persistence; no silent rounding/truncation.
I2-CAP-02 OWNER ACCEPTED under APR-042: Jalali1206–1498 is the initial validated
receiving coverage. A valid outside-profile arrival date receives an explicit
unsupported-date error, without clamping, current-date substitution, timezone shift
or extrapolation. Any extension requires separately verified calendar accuracy.
Both previous capacity conditions are CLOSED; no remaining capacity approval is
requested. Existing envelope/complete-item budgets remain operational boundaries,
not asserted factory maxima; no arbitrary256 cap or independently committed split.

Exclude amendments/cancellation/closure, append-after-confirmation, historical
backfill, nonaccepted custody workflow, posted correction/return, devices/ticket
integration, files/UI, QC, financial effects, UAT and deployment. Missing optional
fields never enable a guard; mandatory data must be valid before confirmation.
Custody/after-post procedures not supplied remain operating residuals only, not
extra normal-receiving approvals or invented draft functionality.

## 9. Acceptance obligations — execution evidence is in implementation status

U=unit/contract; P=REAL Windows PostgreSQL including independently authenticated
actors/isolated runtime vs migration owner; H=actual composed HTTP; R=all relevant
twelve-capability regressions. Fault seams never replace the DB behavior asserted.

| Case family | Required future assertion | Layers / original requirement trace |
| --- | --- | --- |
| I2-A01 | One PO/line across several arrivals; current/cumulative/remaining correct, ordered facts unchanged | P,H; REQ-INBOUND-001–007,015–016; I1 retained |
| I2-A02 | One shared waybill/arrival carries multiple POs; W2/W3 one stored observation; several external receipts same arrival; repeated receipt across arrivals denied | P,H;004,012–013,019–021 |
| I2-A03 | Several labelled physical units, stable separate Unit/Lot/material/effect IDs and correct document/line links, identical/unnumbered ordered lines distinct | U,P;002,005–006,011–012,021 |
| I2-A04 | New/new, old/new, old/old duplicate code races; old source conflicts, direct SQL/source-code mutation/orphan-claim bypass denied; no code generation/history rewrite | P;011,014,021,024; SRC-007-B02 |
| I2-A05 | Raw exact document/code comparison, unique independent namespaces, no inherited R1; PO R1 still works | U,P,H;013,021; S01 retained |
| I2-A06 | Ordered W1 retained, different accepted W1 explicitly WH-approved with trusted provenance; no Masoumi approval; W2/W3 never stock input | U,P,H;008–009,014,018–020 |
| I2-A07 | All actual attributes compared; changed/absent/not-recorded optional states traceable; mathematical decimal equality without loss of lexemes | U,P,H;008–010,017–018; F08–15 |
| I2-A08 | Manual mismatch/excess accepted only with exact explicit action; original PO not changed; partial delivery alone not mismatch; stale last-slot intent conflicts | P,H;006–010,014,022–023 |
| I2-A09 | ORDER_ONLY/UNLINKED legitimate goods accepted with full actual mandatory data, no fake PO/line; no fulfilment count or unrelated PROC disclosure | P,H;012,014,022,024; S09 |
| I2-A10 | Exactly11receiving fields/6required/5optional; every missing optional allowed; each missing mandatory rejects atomically without draft/stock | U,P,H;017; F01,F03–06,F18–23 |
| I2-A11 | Receiving Jalali all supported leap/month/profile boundaries, app/DB parity and roundtrip; trusted time separate | U,P; F18; SRC-007-B07 |
| I2-A12 | Fractional W2/W3 lexemes/precision/zeros/source preserved, huge resource boundary explicit, no typmod rounding/tolerance/whole-W1 coercion | U,P,H;019–020; F21–22 |
| I2-A13 | Both roles create/reuse all3catalogues; exact label history retained; known category resolves, unsupported exact type no OTHER/stock; I2 Sheet productNumber opaque/nonunique independent from legacy productCode | U,P,R; S04–10; F08,F11,F14,F19 |
| I2-A14 | PROC sees ALL original/actual fields incl driver only after COMMIT; WH full arrival; other PO/units/UNLINKED/private binding not disclosed; no new per-person PO ACL | P,H;015–017,023; F01–23; S12 |
| I2-A15 | Foreign installation/authority, customer, SEC/unrelated, copied/forged actor/context and caller-approvedActor fields denied; wait-time revocation and revoked accepted/rejected replay denied | P,H;023–024; S07–08,S12 |
| I2-A16 | Persist exact uncommitted sources before first IPS effect; 129/256 and valid257+units within envelope budgets post via chunks in one transaction; source mismatch/later chunk/origin/constraint/audit/outcome failure leaves zero new stock/source/claims/progress | P;014,024; sole IPS |
| I2-A17 | Same original key replays once; changed raw input/array/order/progress/target conflicts; genuine dropped COMMIT reply and actual Windows crash checkpoints recover using original identity | P;014,021,024 |
| I2-A18 | Concurrent multi-PO arrivals with reversed line/code sets, hash collisions, lock timeout/deadlock and last-slot/excess race; no deadlock from later IPS chunks; technical failures not cached as business outcomes | P;004,006–007,014,024 |
| I2-A19 | Deferred completeness and exact persisted-source admission; direct missing/forged/wrong-kg/source/category/location/effect stock links fail; wrong scoped FKs, late append, savepoint/deferred COMMIT failure and immutable/least-privilege enforcement | P;009,012–014,024 |
| I2-A20 | Exact origin/W1/UUID/source-to-Ledger predicate and collation-independent legacy-code mirror; new production/residual genealogy; old origin unchanged; same-truck siblings/foreign branch never ancestry/disclosure | P,R;011–012,014,018,024 |
| I2-A21 | Pagination/256KiB/existing-entry limits, final Owner-resolved text/date bounds, retrievability preflight, no ordered-count expansion or post-before-size-check, sanitized errors/logs | U,P,H;015–017,023–024 |
| I2-A22 | Existing I1, legacy no-PO/no-ticket receipt incl SHEET, Inventory/reservations/Sales/shipment/production/genealogy/invoice regressions; only new duplicate admissions intentionally changed | P,R;003,024–025 |

Compact coverage interpretation (no new factory IDs): all REQ-INBOUND-001–025 are
covered above;003 remains I1 zero-stock registration and is regression-tested,
025 keeps device/ticket scope excluded. Field01,03–06,18–23 are the exact11mapping
above. F02,F07–17 remain original I1 purchasing facts exposed/compared where
applicable (A01/A03/A06/A07/A14/A22); no actor/requiredness changes. S01–03 retain
accepted I1 identity/unit/date behavior; S04–08 catalogue reuse/isolation/history,
S09–11 manual receiving authority/separation/original history, S12 current reads
are exercised in A05–A15/A22. Original [60-ID trace](I1_IMPLEMENTATION_TRACE.md)
remains the source identity map; this is a future executable plan, not test results.

## 10. Accepted design, implementation reconciliation and reviews

APR-042 closes both capacity decisions and formally accepts the selected command,
source/schema/admission/claim, exact identities, changed-W1/Sheet/genealogy contracts
and bounded role/read architecture. It separately authorizes implementation; the
historical [authorization DRAFT](I2_IMPLEMENTATION_AUTHORIZATION_DRAFT.md) is not the
actual authority. R-MAT remains conditional only for a specific real ambiguous or
unsupported option, never a new global classification approval process. Historical
source integrity/catalogue bindings require actual rollout checks, not invented
factory answers. Ordinary supported receiving is not blocked by an unrelated type.

Implementation-level precision: the IPS effect has no materialId member. Inventory
owns its distinct immutable material UUID, enforced unique at origin; the database
predicate instead proves exact source/origin/Unit/Lot/effect/W1/actor/request and
real Ledger binding, including kg/create/customer scope. This does not weaken IPS
ownership or invent an unsupported effect field. Named deferred constraints are
schema-qualified when forced because the runtime search path is not Procurement.
Repeatable-read query authority uses private per-transaction actor admission between
fresh Identity reads outside the snapshot; Identity's write-locking current check
is never called inside the read-only transaction. These implement the accepted
invariants without changing business policy or the envelope.

Prior static design findings ARCH-01/DB-01 remain closed as design corrections.
Actual implementation findings, real tests/results and review closure are recorded
only in [I2 implementation evidence](I2_IMPLEMENTATION_STATUS.md). Static approval
is never executable proof or Owner backend acceptance. No next increment or push.
