---
id: PLAN-P4A-SOURCES-001
title: P4a verified Inventory sources and stock states
phase: 12-implementation-planning
status: draft
version: 0.1.0
owners: [inventory-domain-owner, data-architect, security-architect]
depends_on: [APR-047, APR-043, PLAN-P4A-SCOPE-001]
last_reviewed: 2026-11-05
approval: null
---

# P4a source and state matrix

**DESIGN ONLY — IMPLEMENTATION NOT AUTHORIZED.** Facts below are repository
observations at `7c5105ee7e0b6d06d3fa56e0e41ac1341d95c2a3`, whose product code is
the accepted P2 revision `f6ef316c711474775b158e8d12fea4a885f2f368`.
Recommendations require the [Owner decisions](P4A_IMPLEMENTATION_AUTHORIZATION_DECISIONS.md).
The [proposed contracts](P4A_INVENTORY_READ_CONTRACT_DESIGN.md) do not amend an
accepted API, domain rule or customer isolation policy.

## Verified identities and source coverage

Inventory Unit identity is `(installation_id, authority_scope, unit_id)` in
`inventory.unit`; `lot_id` is its authoritative Lot association, not its physical
code or material SKU. All joins below include both scope columns. A UUID alone
never supplies authorization. Inventory owns these tables and their read ports;
Procurement and Production retain their documentary/source facts.

| Source family | Actual Inventory relationship | Source owner relationship and grain | Existing read limit / P4a proposal |
| --- | --- | --- | --- |
| `LEGACY_RECEIPT` | `inventory.material_lot` joins Unit by unit_id AND lot_id; unique scoped lot, receipt, unit, material and effect identities | `receipt_id` references `procurement.goods_receipt`; only POSTED receipts have Inventory IDs. One posted receipt produces one Unit/Lot/material tuple, even if recorded count is greater than one | GetInventoryUnit/GetLot use material_lot only. Propose include this family; do not split its recorded count into invented physical Units |
| `I2_RECEIVING` | `inventory.inbound_unit_origin` joins Unit by unit_id AND lot_id; unique scoped unit, received_unit, lot, material and effect identities | `(arrival_id, received_unit_id)` references Procurement inbound_received_unit; each independently coded accepted physical unit gets distinct Unit/Lot/material/effect. Arrival may cover ORDER_LINE, ORDER_ONLY and UNLINKED, multiple orders and shared documents | P2 arrival/progress reads contain own source-to-stock IDs; they are not current-stock discovery. Include all three association kinds without joining commercial documents |
| `PRODUCTION` | `inventory.production_origin.unit_id` joins Unit, `product_batch_id = unit.lot_id`; scoped unit PK, immutable original output kg and disposition | stock_effect_id references Ledger; source_fact_id references Production source_fact; batch/operation/order/customer FK to Production product_batch. One completion creates one ProductBatch shared by its outputs AND residuals: a Lot can have multiple Units | Existing production material/origin ports require customer-scoped PLAN/OP; no organizational WH canonical detail port. All-family WH coverage is conditional on D1, not currently authorized |

Source evidence: migrations [0005](../../database/migrations/0005_inventory_posting.sql),
[0006](../../database/migrations/0006_goods_receipt.sql),
[0011](../../database/migrations/0011_inventory_production.sql),
[0012](../../database/migrations/0012_production_sources.sql),
[0018](../../database/migrations/0018_purchase_receiving.sql);
[receipt owner](../../apps/backend/src/modules/inventory/receipt.ts),
[I2 owner](../../apps/backend/src/modules/inventory/inbound-receiving.ts),
[production owner](../../apps/backend/src/modules/inventory/production.ts),
[Production completion](../../apps/backend/src/modules/production/production-service.ts).
No general Lot master, universally populated material code, physical code on
production outputs, or universal location-label mapping is established by these
sources. An unsupported/fixture-only Unit with none of these origins is outside
this proposed projection; it must not be labelled receipt stock.

## Source-to-field and disclosure matrix

Names in the first column are proposed JSON fields. `null` means the source has
no applicable value; it is not permission to infer one. The contract specifies
which fields occur on list versus detail. No `SELECT *` or source JSON passthrough.

| Proposed field | Authoritative source / owner | Legacy | I2 | Production | Proposed WH disclosure |
| --- | --- | --- | --- | --- | --- |
| unitId, lotId | Inventory unit.unit_id / lot_id | Stored IDs | Stored IDs | lotId is ProductBatch ID | Yes, in scope |
| kind | Inventory unit.kind | Receipt type | Frozen technical type | Bounded descriptive kind, NOT a fixed material classification | Exact stored string; never infer a type from spelling |
| locationId | Inventory unit.location_id | Original receipt location initially | Configured receiving location initially | Explicit output location; issuing a Unit does not automatically move its location | Yes; no guessed station/location map or label |
| state | Inventory unit.state | Current lifecycle | Current lifecycle | Current lifecycle | Raw enum plus proposed Persian presentation below |
| onHandKg, reservedKg | Sum Ledger on_hand_delta / reserved_delta, verified against Balance and active claim | Current totals, not measuredKg | Current totals, not original/accepted W1 | Current totals, not production origin kg | Exact strings only; D2 applies |
| unreservedKg | Inventory arithmetic onHand minus reserved | Same | Same | Same | Arithmetic free quantity; not a sellable/dispatchable promise |
| internalCode | Inventory material_lot.internal_code / inbound_unit_origin.internal_system_code | Recorded code, legacy historical duplicates possible | Exact physical system code | null | Yes; exact case/Unicode, no R1 normalization |
| productCode | Inventory material_lot.product_code | SHEET requires legacy product code; other types optional | null (I2 Product Number is different) | null | Yes when actually present |
| productNumber | Inventory inbound_unit_origin.product_number | null | Opaque, nonunique per-unit recorded value | null | Yes; not a productCode alias |
| materialId | Inventory material_lot / inbound_unit_origin.material_id | Generated stock identity, unique per tuple | Generated stock identity, unique per physical unit | null | Yes; NOT a common material/SKU/classification ID |
| materialTypeOptionId | Inventory inbound_unit_origin.material_type_option_id | null | I1 selected catalogue identity frozen into origin | null | Detail only; label omitted unless separately published by owner |
| source.family | Exactly one admitted Inventory origin | LEGACY_RECEIPT | I2_RECEIVING | PRODUCTION | Yes; conflicting multiple origins fail closed |
| source.receiptId | Inventory material_lot.receipt_id | Original receipt ID | n/a | n/a | Legacy detail only, not whole receipt/outcome |
| source.receivedUnitId, source.arrivalId | Inventory inbound_unit_origin | n/a | Accepted source Unit and arrival IDs | n/a | I2 detail only; no automatic sibling enrichment |
| source.productBatchId, source.disposition | Inventory production_origin | n/a | n/a | Batch ID and immutable FINAL/WIP/RESIDUAL origin disposition | Conditional D1; current Unit state overrides any inference of current readiness from original disposition |
| source.initialKg | Inventory immutable origin measured_kg / accepted_unit_weight_kg_text / kg | Original measured receipt total | Accepted W1 for one physical Unit | Original posted output kg | Detail only; clearly separate from current stock |
| source.weightBasis | Origin-specific provenance; proposed presentation tags for legacy/production | LEGACY_RECEIPT_MEASURED_TOTAL | Existing WH_ACCEPTED_DECLARED_UNIT_WEIGHT | PRODUCTION_POSTED_OUTPUT | Do not imply independent per-piece measurement |
| source.recordedCount | Inventory material_lot.count | Original recorded count string | n/a | n/a | Legacy detail only; not a second stock quantity |
| source.classificationProfile | Inventory inbound_unit_origin.classification_profile | n/a | FACTORY_MATERIAL_V1 | n/a | I2 detail only; no universal production classifier |
| stockClass | Derived current Unit state and exact onHandKg | Current or historical as below | Same | Same | CURRENT or HISTORICAL; contradiction fails, not silently reclassified |
| freshness | Read transaction observation timestamps and consistency result | Per read | Per read | Per read | New metadata; never claim a business last-updated timestamp |

Excluded even where stored: customer_scope/customer_id, Sales/demand/order IDs,
reservation IDs, production order/operation/source-fact/effect IDs, Ledger rows,
actor/person/request/key/binding fields, unrestricted audit/outcome records,
Procurement `actual`/`original`/`comparison`/`acceptance` JSON, vehicle/driver/supplier
details, purchase/proforma/invoice documents and secrets. These are not needed for
the bounded stock task. A separate existing source screen retains its own full
authorization; an Inventory link grants no extra source permission.

Inventory can supply this whitelist from its own persisted origins. Do not call
Procurement's write-admitted `source()` outside its original confirmation
transaction, or manufacture a customer-scoped Production context to reuse its
existing material/origin reads. A new narrow Inventory read port is required.
Source-document enrichment is excluded; any later enrichment must use a published
owner port, the same bounded snapshot and explicit object authority before calls.

## Verified weights and quantity authority

Ledger is truth, Balance is a rebuildable projection. The existing
[IPS checks](../../apps/backend/src/modules/inventory/posting-service.ts)
compare scoped Ledger sums, Balance and the unique ACTIVE reservation claim;
`0 <= reserved <= onHand`, claim kg equals reserved, RESERVED requires a claim,
AVAILABLE cannot carry one. New reads must retain these checks without acquiring
the writer's locks or repairing data. Never skip a bad authorized row to make a
page look complete. [Inventory store](../../apps/backend/src/infrastructure/postgresql/inventory-store.ts)
shows the indexed totals, projection and actual advisory/row locks.

The arithmetic quantity often called available is `onHand - reserved` (INV-003).
The accepted demand-specific `availability()` additionally returns zero unless
state is AVAILABLE; a partially reserved Unit can have arithmetic free kg yet be
ineligible for another demand. P4a names the arithmetic field `unreservedKg` and
does not publish a demand-eligibility field or reuse that Sales port.

| Evidence | Verified meaning | Forbidden interpretation |
| --- | --- | --- |
| Legacy measuredKg | Whole-kg measured total for the recorded receipt Unit; count is descriptive | Dividing by count to invent physical Unit weights |
| I2 W1 | Positive whole-kg accepted declared weight per independent physical Unit; original and actual W1 remain separate | Calling it a measured weight or replacing current onHand with W1 |
| I2 W2/W3 | Decimal source lexemes once at whole arrival/consignment, W2 mandatory/W3 optional | Allocating across Units/Lots/POs, or using them as stock; they are absent from P4a responses |
| Production kg | Exact posted output/consumption/Residual/Scrap arithmetic; only good outputs/Residual create stock Units | Scrap source evidence becoming SCRAPPED/available stock, or WIP being sellable |

**D2 is a genuine unresolved contract conflict.**
[Kg](../../apps/backend/src/modules/inventory/quantity.ts), schema0005/0011 and
[accepted MAKE](SLICE_MAKE_IMPLEMENTATION_STATUS.md) support exact positive decimal
kg up to18 fractional places and magnitude below10^20. Production service
`kg`/`exactKg` and completion apply whole-kg measurement only to actual
Coil-to-Sheet paths. [Existing unit test](../../apps/backend/tests/unit/production.test.ts)
accepts non-Coil `70.50` normalized to `70.5`; this was source-inspected, not run.
Therefore production outputs AND remaining receipt/I2 stock after general
production consumption need not remain integer kg. The directive's integer-only
all-origin expectation cannot be asserted from accepted code. Preserve every
integer kg exactly; never round, coerce to Number, exclude fractional stock or
call it corruption. Proposed exact-decimal display requires explicit Owner
resolution, not silent alteration of that requirement. A domain-wide whole-kg
change would be separate work outside P4a.

## Actual states, transitions and proposed presentation

The TypeScript/schema enum has ten values. Only seven have accepted paths in the
inspected implementation. This distinction prevents inventing QC, returns or
correction workflows from enum vocabulary.

| State / proposed Persian label | Actual accepted entry/exit | Stock meaning / proposed P4a use |
| --- | --- | --- |
| AVAILABLE / «آزاد» | Normal receipt/I2 stock-in; FINAL/RESIDUAL production output; intact WIP finalized by owner. Reserve → RESERVED; issue → ISSUED_TO_PRODUCTION | Positive current stock, not necessarily organizational or demand-eligible; list/detail |
| RESERVED / «رزروشده» | ActivateReservation creates positive claim (may be partial kg) and state; whole-unit pack → PACKED | Positive current stock, part/all reserved; no new claim or release action; list/detail conditional D1 |
| PACKED / «بسته‌بندی‌شده» | PackPackage changes RESERVED→PACKED; UnpackPackage returns RESERVED; dispatch consumes claim and whole stock→SHIPPED | Positive current stock committed to shipping; list/detail conditional D1 |
| ISSUED_TO_PRODUCTION / «تحویل تولید» | IssueAllocatedMaterial to production; new WIP output. Partial consumption→PARTIALLY_CONSUMED; full→CONSUMED; intact WIP finalize→AVAILABLE | Positive current material/WIP, not Warehouse free stock; list/detail conditional D1 |
| PARTIALLY_CONSUMED / «بخشی مصرف‌شده» | Production STOCK_OUT leaves a positive original remainder; further consumption can reach CONSUMED | Positive restricted original remainder, not automatically reusable Residual or AVAILABLE; list/detail conditional D1 |
| CONSUMED / «مصرف‌شده» | Full production consumption makes onHand/reserved zero and closes active issue | Historical zero-stock identity; canonical Unit/Lot navigation only, excluded from current discovery |
| SHIPPED / «ارسال‌شده» | Atomic dispatch consumes reservation and onHand to zero | Historical zero-stock identity; canonical Unit/Lot navigation only; not customer delivery or Sales closure |
| SCRAPPED / «اسقاط‌شده» | Enum exists; no accepted inspected normal stock transition | Excluded; actual production scrap is source evidence without normal stock Unit |
| RETURNED / «برگشتی» | Enum exists; no accepted return workflow | Excluded; no return read semantics inferred |
| CLOSED / «بسته‌شده» | Enum exists; no accepted Unit close path | Excluded; do not confuse with Production/Sales document closure |

Transition evidence: [posting-service](../../apps/backend/src/modules/inventory/posting-service.ts),
[reservation](../../apps/backend/src/modules/inventory/reservation.ts),
[shipping Inventory port](../../apps/backend/src/modules/inventory/shipping.ts),
[production Inventory port](../../apps/backend/src/modules/inventory/production.ts)
and migrations0009–0012. No public general reservation-release/expiry workflow is
asserted merely because the internal IPS RELEASE effect exists.

Recommend the five reachable positive-stock states as the smallest useful
**all-work-in-progress current-stock** set. A one-state AVAILABLE view would miss
stock physically in production/packing and must be labelled narrower. Terminal
Unit/Lot detail permits exactly CONSUMED/SHIPPED with zero totals; no general
historical discovery, movement history or terminal-state filter is proposed.
For all-origin scope, list defaults to these five states; state filtering can
select one of the five. `stockClass` is CURRENT for positive totals in those five,
HISTORICAL for zero CONSUMED/SHIPPED. Unsupported states are unavailable/404 under
the bounded contract, not translated to a supported state.

## Authorization gap that cannot be inferred away

[CUSTOMER_ISOLATION](../06-security-rbac-audit/CUSTOMER_ISOLATION.md) requires the
owning customer key for allocated/reserved stock. Organizational WH intake reads
are a narrow unallocated-stock exception.
[Composition](../../apps/backend/src/composition-root.ts) currently authorizes
legacy snapshot maintenance only for organizational AVAILABLE Units with empty
customerScope. Production outputs carry customerScope. Reservation activation and
production issue can leave Unit.customer_scope empty while creating customer-bound
claims/issues: empty scope alone cannot prove unallocated stock. Existing ACT-WH
reservation activation or receiving-arrival authority does not grant all-customer
Inventory discovery or Production documentary access.

Recommended all-family design is **conditional**, requiring D1: an explicit
Inventory-only WH disclosure exception for the exact whitelist across customer
allocations within the trusted installation, while excluding customer/commercial
fields and all source documents. Internal customer keys remain available for
enforcement/consistency, never removed from stored facts. This is a proposed
policy amendment, not an existing rule. Without it, safe existing-policy scope is
AVAILABLE organizational unallocated legacy/I2 only (anti-join active reservation
and production issue); production and other current states remain blocked.
That narrower option needs an explicit Owner scope decision and honest UI label.
No implementation may automatically choose either option.

## Inspected verification sources, not executed results

Fixtures/read assertions inspected: [receipt harness](../../apps/backend/tests/support/receipt-harness.ts),
[production harness](../../apps/backend/tests/support/production-harness.ts),
[receipt integration](../../apps/backend/tests/integration/receipt.test.ts),
[receiving integration](../../apps/backend/tests/integration/receiving.test.ts),
[production unit](../../apps/backend/tests/unit/production.test.ts), and
[production integration](../../apps/backend/tests/integration/production.test.ts).
Their accepted historical results do not prove these proposed reads. The
[new verification matrix](P4A_INVENTORY_READ_CONTRACT_DESIGN.md#verification-and-acceptance-design)
requires actual PostgreSQL/Chromium evidence after authorization. No database,
product test or browser execution is claimed in this design task.
