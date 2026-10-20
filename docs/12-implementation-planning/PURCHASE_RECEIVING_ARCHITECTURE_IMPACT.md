---
id: PLAN-INBOUND-ARCH-001
title: Purchase and receiving Step 2 architecture impact assessment
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [chief-solution-architect, security-architect]
depends_on: [APR-032, PLAN-INBOUND-GAP-001, DOM-INBOUND-RECON-001, ADR-0015, ADR-0016]
last_reviewed: 2026-10-20
approval: null
supersedes: null
---

# Architecture impact — DRAFT / PROPOSED / NOT AUTHORIZED

Use the exact paths/symbols and inspected tests in the [E01–E09 evidence catalogue](PURCHASE_RECEIVING_TECHNICAL_GAP_ANALYSIS.md).
This assessment proposes responsibility boundaries and compares options; it does
not publish a new command/query contract, select API versions, define tables or
amend accepted ADRs. [Business B01–B10 and design D01–D08](PURCHASE_RECEIVING_DECISION_REGISTER.md)
remain independently tracked. The [coverage matrix](PURCHASE_RECEIVING_COVERAGE_MATRIX.md)
is the requirements-level inventory of gaps.

## Responsibility and dependency boundaries

| Owner / existing boundary | Existing implementation | Proposed extension and restriction |
| --- | --- | --- |
| Procurement | PurchaseService documentary records; ReceiptService receiving coordination and receipt persistence | Own operational PO/lines, arrival/document evidence, ordered/actual confirmation and progress/discrepancy sources. Coexist with completed-purchase/proforma evidence; no reinterpretation or automatic link. Coordinate receiving on an admitted transaction; no Procurement stock writes. |
| Inventory / IPS | InventoryReceiptService creates one origin; InventoryPostingService posts effects; Material Lot owner source | Extend an owner port for independent per-unit origin/effects under agreed receiving grain. Inventory owns Unit/Lot/source persistence; ACT-IPS alone owns Ledger/Balance posting and exact stock validation. No second writer or direct Procurement SQL into Inventory. |
| Identity / envelope | Trusted personal context, current grants, command binding, outcome and atomic audit | Admit any later approved new/versioned behavior explicitly. Retain current execute/replay disclosure, target/full-payload binding, same-key recovery, no copied contexts or role-header authority. |
| Genealogy | Owner-source projections from material origin, production, dispatch | Extend source-backed origin metadata/edge semantics compatibly when new stock is introduced. Never manually edit genealogy or expose an entire multi-order arrival through one reachable unit. |
| Purchasing visibility | Existing ACT-PROC documentary UUID reads only | Minimal Procurement-owned committed progress view and WH operational-order lookup, subject to B08. Read owner facts through ports; no new writable reporting truth or generic access to completed documents, all stock or PII. |
| Sales, Shipping, Production, Finance-Lite | Published stock/reservation/dispatch/production/invoice owner contracts | No behavior change proposed. New intake must produce compatible stock/source facts; neither W2/W3 nor PO progress creates demand, shipment, invoice or money. |

Published [ownership](../02-domain-business-architecture/MODULE_OWNERSHIP_MATRIX.md)
and [dependency directions](../09-repository-documentation/DEPENDENCY_AND_IMPORT_RULES.md)
continue to bind. Prefer existing owners and explicit narrow ports; there is no
evidence requiring a new module, service, queue, cache or dependency.

## 1. Purchase order and source identity

The current completed-purchase UUID and purchaseDocumentReference identify
documentary evidence, not an operational seller PO. Tests deliberately permit
repeated references. An operational PO needs its own identity, ordered lines and
approved scoped seller reference lookup. B01 must settle whether the namespace is
organization-wide or needs seller/year/other real context. Do not silently add a
24th mandatory business field to achieve a guessed composite key. Lookup must
never choose the first of several matches or expose other organizations while
disambiguating. A technical UUID can bind subsequent commands but cannot replace
the operator's seller-number workflow.

Existing completed-purchase/proforma records should PROPOSED coexist unchanged.
Linking by equal strings or converting their purchaseDate into registration date
would manufacture history. Historical links/backfill can remain excluded (B10),
while compatible storage/read ownership is D07. Do not rewrite migration 0015.

Command idempotency, document identity and physical source identity solve different
problems. Same admitted key replays one outcome; a new key/UUID can still describe
the same truck or material. B01/B02/B04 must supply genuine identity/reuse semantics
before database source constraints can prevent that case. A repeated PO number on
two distinct waybills is explicitly valid, not duplicate receiving.

## 2. Multi-arrival progress and physical-unit grain

Known conceptual relationships: PO→many lines; PO→many arrivals over time;
line→many independently received physical units across arrivals; each accepted
unit→its PO/line, consignment/waybill, receipt and internal code. Unknown: a truck
containing multiple POs, existing receipt-document coverage, packaging unit and
product-number grain (B03/B04). These uncertainties prevent final table/command
cardinality. A receiving transaction, external warehouse document and current
technical receipt UUID need not be the same business object.

Current ReceiptService plus InventoryReceiptService makes exactly one Unit and
one material_lot per technical receipt. Count is descriptive and may be zero or
greater than one without creating more Units. Migration 0006 has scoped unique
receipt_id, unit_id, material_id and effect_id. The confirmed factory needs each
received physical unit separately identifiable; setting count to three on one
existing origin cannot satisfy that requirement. Do not infer that all historical
count>1 receipts can be split into real independently known units.

Proposed progress is ordered count, current confirmation count, previous committed
count, cumulative confirmed count and outstanding per line. Derivation from
committed confirmation facts is preferable initially to an independently mutable
counter. If a counter is needed, it must be transactionally derived/updated with
the same facts and protected against lost updates. Neither model is another stock
ledger. Do not sum descriptive historical count or aggregate W2/W3 to infer units.
Concurrent arrivals need locked/revalidated line progress under the approved
exception policy; merely querying a sum before posting races. Replays must not
add progress twice. No clamp, automatic order closure or universal over-delivery
rejection is chosen (B06).

## 3. Internal System Code and legacy identity

ADR-0016, migration 0006 and receipt tests intentionally allow duplicate
internalCode values across receipts. Factory distinct-unit codes conflict with
that policy at the physical identity level. Inventory Unit UUID already separates
technical stock, but cannot make a repeated physical label independently useful.
Sheet productCode has a different scoped uniqueness rule and is not a substitute.

Options after B02: a new scoped business-code identity associated with Inventory
Units; or a Procurement confirmation identity mapped through the Inventory owner
port. The owner of the authoritative association and the cross-path admission
rule must be explicit; duplicating independently writable code registries is unsafe.
Both options need approved namespace, normalization/reuse, legacy duplicates and
physical association procedures before choosing validation/index constraints.
Do not add a global unique index or relabel old records. An additive mapping can
retain legacy evidence, but is not automatically approved backfill.

Mixed old/new receiving is a special rollout risk: maintaining the accepted v1
API while only checking new-path uniqueness does not prevent double posting the
same physical unit through v1 and the new workflow. B02 needs an explicit
reconciliation/admission or operational rollout policy. Do not claim universal
physical deduplication from a new table, or silently disable no-PO/no-ticket intake.

## 4. W1 provenance and exact stock

Current PostGoodsReceipt v1 admits whole positive measuredKg, records immutable
measured origin, and composition-root effect validation reparses the **original
full admitted request payload**. Source fact, target, type, location and kg must
match. Factory W1 instead comes from recorded/accepted per-unit evidence, with no
independent destination weighing. B05 plus an explicit dependency/ADR reconciliation
must establish accepted W1 provenance and changed-W1 authority before D03.

Preserve original ordered W1 and accepted actual W1 separately, with receiving
actor and evidence link under approved policy. Post each accepted unit at that
unit's W1; the receipt total is a sum of those posted unit quantities. W2 is a
mandatory waybill consignment net and W3 optional destination consignment net.
Store/trace them at their true aggregate grain, including multi-PO consignments
if confirmed. They neither replace W1 nor distribute a difference among units.
No equality, tolerance, rounding, reject, Scrap or financial effect is defined.

IPS arithmetic need not change. `Kg` supports exact scaled decimal capacity for
technical use; the existing receipt owner parser/schema enforce whole kg. Broader
technical capacity does not authorize fractional factory stock precision. A future
admission must preserve approved whole-unit W1 stock rules without narrowing or
rewriting the shared IPS scalar. W2/W3 representation is independently B07.

Simply adding fields to v1 or stripping fields before calling the old port fails:
closed schemas reject them, and effect validation sees the original full payload.
Do not fabricate a legacy child command, alter an admitted target or copy Identity
context to reuse a validator. Later design must explicitly admit compatible owner
effects and immutable origin provenance while retaining complete request binding.
Historical measured facts retain their original meaning.

## 5. Original and actual attributes / business documents

Proposed order lines preserve source snapshots. Accepted unit facts retain actual
confirmed attributes and link to that ordered version, line, unit, actor and
arrival/receipt. A discrepancy source records original versus accepted actual
values and an explicit visible marker. Rebuildable views may derive indicators
from those source facts; an independently editable flag is insufficient evidence.
Comparison must honor B07 units/absence semantics; no automatic fuzzy matching,
tolerance or assumption that an omitted optional value equals a mismatch.
Partial delivery is progress only. B06 decides acceptance of mismatched/excess goods;
no QC approval or automatic exception authorization is invented.

Field 19 product number has no verified implementation equivalent. Sheet productCode,
optional item number, material type, internal code and UUID are distinct. Do not
borrow Sheet-only requiredness/uniqueness. Field 5 is entered from an existing
warehouse document: a generated technical receipt ID or command key cannot replace
it. Field 7 may be absent, so technical line identity and an approved selection
method must preserve otherwise-identical lines. Store business document relationships
only after B01/B03/B04; no one-to-one receipt/waybill assumption is adopted.

## 6. Atomic receiving options and concurrency

| Option | Benefit | Limits / risk / disposition |
| --- | --- | --- |
| A: one admitted confirmation group, independent unit origins/effects and progress, one transaction | All selected accepted units, discrepancies, progress, origin, IPS stock, outcome and audit commit together | PROPOSED preferred. Group may be selected accepted subset of an arrival; not a claim that every truck must be completed atomically. B04/business grain first; new owner admission and origin design needed. |
| B: parent confirmation group with a technical receipt per unit inside the same transaction | Could preserve old 1:1 origin shape and independent Unit facts | Reasonable alternative only through explicit owner ports and approved parent/source relationships. Do not invoke public envelopes repeatedly or forge child command targets; audit/binding/rollback must cover the parent intent. |
| C: independently committed per-unit receiving | Reuses small commits | Only if factory/Owner explicitly accepts that confirmation grain and partial group completion. Cannot claim atomic arrival, progress or single outcome; not selected merely to avoid design. |
| D: one aggregate Unit and descriptive count | Minimal payload change | Does not satisfy independent physical-unit traceability or per-unit W1; unsuitable for the accepted workflow. |

The existing envelope owns key serialization, business savepoint, durable outcome
and audit; the transaction handle is opaque and shared. IPS accepts 1–128 effects,
sorts actual hashed resource keys then Unit row locks, validates owning sources and
deduplicates effect identities. That is a useful batch foundation, not an already
implemented receiving-group owner contract. A future limit must account for
per-unit effects: reject/split only under an explicitly defined group contract,
never silently commit chunks of one promised atomic confirmation.

The InventoryReceiptService single-unit convenience method takes a Sheet code
lock then posts via IPS. Repeating it for a batch can acquire a later Sheet/owner
lock after earlier IPS locks and invert concurrent acquisition order. D04 should
precollect all PO/line, arrival/source, physical-code and applicable Sheet-code
resources, acquire a consistent owner order, then use canonical IPS resource
locking and revalidate. Decide a whole-system order against existing receipt and
downstream writers; do not rely on sorting only input UUID strings. Lock-order,
distinct-user, opposing-order, timeout and database deadlock tests are required.

Within one approved transaction: validate scoped immutable order/line membership
and current authority; serialize source identity/progress; establish selected
unit facts/actuals/discrepancies/origins; call IPS with valid owner effects; record
progress sources and one outcome/audit. Any later-leg business failure rolls back
all business writes to the envelope savepoint while retaining the appropriate
durable rejection/audit. Technical/deadlock/timeout abort must not cache a false
business rejection. Unknown COMMIT is resolved on primary with the original key
and fully bound intent; new IDs/keys are not recovery. Committed read snapshots
must not expose progress without stock or stock without its source/receipt.

## 7. Authorization, visibility and information disclosure

Current policies: organization ACT-PROC records/reads documentary purchases;
organization ACT-WH posts receipts; ACT-WH/ACT-SEC read existing receipt data.
Those rules are not creator-only, and ACT-SEC's grant administration does not
grant all new business reads. ACT-CUST and unrelated roles must not acquire new
access through number lookup, errors, lists or genealogy. Names never authorize.

PROPOSED smallest change: an explicitly approved Procurement operational-order
write/read capability for ACT-PROC; a restricted operational-order/line/specification
lookup for ACT-WH; and a PO-grouped committed receiving/progress/discrepancy view
for ACT-PROC. Receipt-owner projections may expose only needed linked facts.
No ACT-PROC stock posting, broad documentary access for WH, or broad Lot/Unit
access for PROC follows. B08 must approve exact fields, scope, ACT-SEC new-data
access and backup grants. An expanded payload on an existing WH/SEC read route
could silently widen sensitive data: preserve base reads and project new fields
explicitly. Driver name/truck details require a demonstrated purpose; logs/audits
should not echo unsafe text or full PII payloads merely for debugging.

Preserve trusted subject/issuer and DB recording time separately from entered
business dates; reject supplied actor substitutions and enforce current grants
before/after waits and on replay/query disclosure. A grant revoked during a wait
must not leak a saved result. New filtered views need coherent owner snapshots,
organization isolation, no ambiguous cross-scope existence leaks, bounded query
work and denial tests. None of these changes is implemented or authorized here.

## 8. Genealogy and regression across eleven capabilities

New per-unit origin must link authoritative PO/line, arrival/waybill, external receipt,
unit code and accepted actual/discrepancy sources from the first stock delivery.
Do not defer that minimum traceability to a later optional reporting slice.
Current origin uses one-receipt/one-Unit measuredKg and RECEIPT_TOTAL metadata;
future edge weight semantics must clearly identify unit W1 versus aggregate
consignment evidence. Historical edge meaning and standalone Sheet behavior
remain compatible. A customer entitled to one downstream unit must not see other
units/orders or arrival PII via a shared truck; extend source projection with the
existing reachability-before-bounds and snapshot protections.

| Accepted capability | Regression obligation / risk |
| --- | --- |
| Command envelope / atomic audit | Full new intent binds selected units/actuals/source/progress; same-key replay, changed payload, distinct people, unknown COMMIT and audit failure remain safe |
| Personal Identity / revocable grants | No names/forged contexts, customer escalation or stale-grant reads; existing sessions and unrelated role denials preserved |
| IPS inventory | No new writer; Unit/ledger/balance/effect identities valid, whole W1 stock, no negative stock; locked batch and no partial business commits |
| Goods Receipt / material origin | v1 no-PO/no-ticket and Sheet rules survive; no legacy splitting/relabeling; cross-path identity risk reconciled, immutable origins preserved |
| Sales demand / fulfillment | Compatible available kg and Unit scope; no PO/consignment count substituted for stock or altered fulfillment closure |
| Reservations | Existing reservation resources/consumption/availability remain correct under concurrent new intake; no Procurement reservation mutation |
| Shipment / dispatch | No automatic dispatch or shipment-weight rewrite; retain closed/reserved stock validation and source-backed dispatch lineage |
| Routed production / mass balance | New stock valid for existing type/location/unit ownership; consumption/split/merge and exact mass balance unchanged |
| Material genealogy | New origins traceable without editable edges, guessed kg or cross-customer multi-order exposure; old projections remain readable |
| Purchasing / sent proforma | Current documentary fields, refs, personal attribution, replay and ACT-PROC-only reads unchanged; no automatic operational conversion |
| Issued-invoice evidence | Sales order/customer link, ACT-SALES write / ACT-FIN read, immutable evidence unchanged; no invoice/settlement amount or PO/weight gate |

All-capability tests are future regression obligations, not tests executed for this
Markdown task. See [E08](PURCHASE_RECEIVING_TECHNICAL_GAP_ANALYSIS.md#e08-downstream-owners-and-regression-evidence)
and the [roadmap DoD](PURCHASE_RECEIVING_DELIVERY_ROADMAP.md).

## Architecture reconciliation boundary

Preserved: Modular Monolith, owner ports/directions, sole IPS, exact kg/Ledger truth,
nonnegative stock, source-backed genealogy, personal current grants and atomic
outcome/audit. Required explicit reconciliation: measured-origin W1 semantics,
nonunique Internal Code versus physical identity, one-unit receipt/origin grain,
new read scopes and business reference/cardinality policies. These are proposed
decisions, not amendments to accepted ADRs or executable contracts. No historical
migration, record, role or product gate changes in Step 2.
