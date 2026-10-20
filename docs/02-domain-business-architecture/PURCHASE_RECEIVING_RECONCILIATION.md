---
id: DOM-INBOUND-RECON-001
title: Preliminary purchase and receiving architecture reconciliation
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [chief-solution-architect, business-process-owner, security-architect]
depends_on: [SRC-004, DOM-INBOUND-REQ-001, DOM-INBOUND-FIELDS-001, ADR-0016, APR-027, APR-030]
last_reviewed: 2026-10-20
approval: null
supersedes: null
---

# Preliminary impacts, conflicts and genuine remaining questions

This is Step 1 analysis accompanying the [draft requirements baseline](PURCHASE_RECEIVING_REQUIREMENTS_BASELINE.md).
It is not Step 2 execution, a new ADR, physical design, API contract, migration,
permission change or unlock. [SRC-004](../00-governance/team-answers/FACTORY_PURCHASE_RECEIVING_2026-10-20.md)
is authoritative business evidence; accepted runtime/architecture remain until
explicit reconciliation and later authorization. Counts/field facts are in the
[23-field dictionary](PURCHASE_RECEIVING_FIELD_REGISTER.md), not re-decided here.

## Actual repository comparison and preliminary impact

| Ref / surface | Existing accepted evidence | New confirmed input / impact | Reconciliation boundary |
| --- | --- | --- | --- |
| C1 — purchasing | [APR-027](../00-governance/approved-baselines/APR-027-purchasing-evidence-scope.md); [CompletedPurchaseInput](../../apps/backend/src/modules/procurement/purchase-contracts.ts) has reference/supplier/date/description only, immutable completed evidence | Order registration before delivery, multiple lines/specifications/counts/W1 and outstanding progress are not implemented | Preserve completed-purchase/proforma records/behavior; do not reinterpret them as operational POs or overwrite old evidence. Future relationship/migration policy needs analysis |
| C2 — receipt grain | [receipt contracts](../../apps/backend/src/modules/procurement/contracts.ts), [receipt service](../../apps/backend/src/modules/procurement/receipt-service.ts) and [Inventory receipt owner](../../apps/backend/src/modules/inventory/receipt.ts): one receipt creates one Unit/origin/effect | Arrival may confirm several physical units and only some lines/counts; each unit needs independent origin and code | Current single-Unit receipt is not arrival completion. Determine business receipt/arrival/unit grain and atomic scope before an owner contract is approved; no new batch command is specified |
| C3 — W1 provenance | [APR-021](../00-governance/approved-baselines/APR-021-receipt-increment-scope.md)/[ADR-0016](../00-governance/adrs/ADR-0016-manual-goods-receipt.md) use whole measured kg; [composition validation](../../apps/backend/src/composition-root.ts) re-parses original receipt payload and checks effect kg/type/location/source | Accepted recorded per-unit W1 drives stock although the factory cannot independently weigh each unit at destination | Explicitly reconcile provenance/terminology and immutable origin evidence; do not relabel W2/W3 as unit measuredKg or change IPS arithmetic/ownership. Version/binding/effect validation is a later dependency design task |
| C4 — physical codes | ADR-0016 intentionally makes Internal Code nonunique; [0006 migration](../../database/migrations/0006_goods_receipt.sql) has no internal_code uniqueness and scoped unique origin receipt_id | Each incoming physical unit requires a distinct physical Internal System Code | Resolve namespace, legacy duplicates/mapping and physical-unit grain before constraints/backfill. Do not edit old migration/history or enforce guessed global uniqueness |
| C5 — references/progress | Current receipt has no PO/line/waybill/business receipt reference or line-progress relation; current Count is descriptive | Mandatory existing warehouse receipt reference; PO→many arrivals, ordered/current/cumulative/outstanding unit counts | Preserve UUID/key identities separately; new receiving progress is not Inventory Count or another stock ledger. Serialize later concurrent arrival progress without inventing over-delivery policy |
| C6 — product number | Existing `productCode` is required and scope-unique for standalone SHEET only | Field 19 is mandatory at receiving, but its meaning/level is explicitly unresolved | Do not alias it to Internal System Code, UUID, item number or existing Sheet code, or transfer Sheet uniqueness to all products |
| C7 — discrepancies | No current PO-to-actual attribute history/indicator in receipt input or origin | Persist original vs confirmed actual, line/unit/arrival/receipt/actor and visible mismatch | Clarify comparison grain and exception authority; immutable purchase history, no automatic rejection/acceptance, QC workflow, update-in-place or correction path |
| C8 — Identity/visibility | [composition policies](../../apps/backend/src/composition-root.ts): org ACT-WH posts; ACT-WH/ACT-SEC read receipts; ACT-PROC reads organizational purchasing documentary evidence | Karimi needs original PO/line/specification lookup; Masoumi needs committed PO-grouped receiving/progress/discrepancies. Neither cross-workflow read is delivered by current permissions | Organizational duties do not widen grants. Need explicit approved owner-read/scope/field contracts in both directions and current authorization; no second ACT-PROC stock poster or automatic ACT-SEC expanded data access |
| C9 — genealogy | [origin contract](../../apps/backend/src/modules/genealogy/contracts.ts) has receipt/Lot/Unit/InternalCode/count/measuredKg; [projection](../../apps/backend/src/modules/genealogy/projection.ts) labels origin kg RECEIPT_TOTAL | Every received physical unit must retain PO/line/arrival/receipt/discrepancy lineage | Extend authoritative owner facts/read boundaries only after approval; preserve source-backed rebuild and scope. Review edge grain/weight meaning, never manually edit GenealogyLink or substitute truck net |
| C10 — weights/ticket plan | Earlier [ticket plan](../12-implementation-planning/WEIGHBRIDGE_IMPLEMENTATION_PLAN.md) proposed optional ticket evidence alongside existing measured input | W2 waybill net is mandatory, W3 destination net optional, W1 accepted per-unit stock source; no separate ticket capture authorized | Old ticket-only proposal is insufficient/currently on hold. A missing W3 is not a receipt blocker or failure. No new mandatory fallback reason, scan or ticket identity becomes a 24th business field |

Sole IPS, exact whole kg, nonnegative stock, immutable Ledger, rebuildable Balance,
atomic outcome/audit and current personal authorization are preserved architectural
policies, not conflicts. The W1 semantic issue is provenance, not permission to
abandon exact stock arithmetic. RQ-03/OQ-004 hybrid grain is not silently replaced
with universal production-piece serialisation: this evidence concerns incoming
ordered physical units. Define their physical-to-Inventory grain before broader
trace changes. Accepted Sales/reservation/shipment/production/Finance functionality
and no-ticket/potentially no-PO intake remain intact.

## Reassessment of earlier F01–F08

These references belong to the old questionnaire, not newly closed OQs. Authoritative
new facts answer parts; separate ticket/device questions may be deferred rather
than made prerequisites of the broader receiving requirements.

| Old question | Current classification | Confirmed now / still unresolved |
| --- | --- | --- |
| F01 duties | PARTLY ANSWERED / REFRAMED | Masoumi orders/registers and views receiving; Karimi verifies/confirms/records receiving. Do not re-ask those duties. Backup, custody and exception escalation remain open; separate ticket issuer belongs to deferred ticket work |
| F02 access | PARTLY ANSWERED / REFRAMED | Personal current ACT grants and normal ACT-WH receiving preserved; Masoumi receiving visibility is required. Exact capability/read fields/scope, individual backup account grants and ACT-SEC access need approved reconciliation |
| F03 printed values | WEIGHT MEANING ANSWERED; REPRESENTATION/PROVENANCE OPEN | W1 per-unit stock, W2 mandatory waybill consignment net, W3 optional destination consignment net; no per-unit scale weighing/allocation. Do not ask which aggregate supplies unit stock. Source formats and changed W1 evidence still matter |
| F04 identity/use | PARTLY ANSWERED / REFRAMED | PO→many arrivals/waybills, distinct unit codes and external receipt reference confirmed. Namespaces/reuse, product-number meaning and exact receipt relationships remain open; separate ticket keys deferred |
| F05 reason/custody | REFRAMED / PARTLY DEFERRED | Waybill supplies W2 and existing receipt supplies field 5. Custody/retrieval still needs operating policy; ordinary receiving is not automatically a device-down fallback requiring a new reason |
| F06 unavailable/disputed | REFRAMED / OPEN EXCEPT OPTIONAL W3 | Missing W3 is allowed; no automatic tolerance/rejection. Missing/disputed mandatory waybill W2, missing PO/accepted W1 and source conflicts need decisions; existing no-ticket path is not an invented override |
| F07 errors | PARTLY ANSWERED / OPEN REMEDIATION | Pre-post actual-vs-order discrepancy recording/preservation is confirmed. Exception/rejection and already-posted correction authority/procedure remain open and unimplemented |
| F08 old scope | INSUFFICIENT / ON HOLD FOR REASSESSMENT | Operational PO/line/multi-arrival/unit workflow is now required input; initial one-ticket increment is not its substitute. No automatic device/separate ticket capture, commercial weight, UI, correction or runtime work is authorized now |

## Genuine remaining decisions

Q references below are local analysis items, not new OQ identifiers or answers.
“Before” means before the affected future design/implementation; none prevents
faithful Step 1 documentation. No approval to start that future work is implied.

| Ref | Question / decision | Why it matters / blocked operation | Kind and timing |
| --- | --- | --- | --- |
| Q1 | What are uniqueness/reuse namespaces for seller PO reference, physical Internal System Code, waybill and existing warehouse receipt reference? How are legacy duplicate Internal Codes mapped and physically distinguished? What is the code issuance/association practice? | Unambiguous PO lookup, unit trace, duplicate intake and safe legacy evolution; uniqueness itself for PO/physical units is already confirmed, not re-asked | Business identity/legacy policy BEFORE lookup/identity constraints or migration; exact keys/index mechanisms are later technical choices |
| Q2 | What does field 19 Product number identify and at what grain; can the same value appear on several physical units/lines? What links, if any, to current Sheet productCode? | Avoid wrong identity/uniqueness and misplaced mandatory field | Business meaning BEFORE product/unit design; no alias presumed |
| Q3 | Can a truck/waybill contain several orders? How does the existing warehouse receipt document reference relate to arrivals, waybills and multiple units? What constitutes one physical unit for each material/packaging form? | Receipt/arrival grain, preserving each code/W1 and avoiding duplicated whole-consignment evidence | Business cardinality/grain BEFORE affected model. Atomic transaction grouping/port/version choices are technical follow-up, not factory facts |
| Q4 | When a confirmed per-unit W1 differs from the order and units cannot be weighed separately, what actual evidence supports it and who authorizes that revision/exception? | Trusted stock provenance and explicit reconciliation with measured-kg origin policy; W1 as stock basis is already answered | Business evidence/exception authority + architecture reconciliation BEFORE revised unit-stock workflow |
| Q5 | How are over-delivery, wrong goods/specification and rejected/held units handled; when may Karimi accept a mismatch versus escalate it? How is not-accepted material distinguished without posting it? | Confirmed receiving progress, exception acceptance and discrepancy visibility; no default clamp, loss or QC gate | Business policy BEFORE implementing affected exception paths; may defer such paths only under an explicitly approved bounded limitation, not silent reject-all/accept-all |
| Q6 | What units/representations apply to width/thickness/length and grade/RAL/type values? What calendar/date and W2/W3 source precision/representation must be retained? How are ambiguous/absent item references matched to a line? | Exact field validation/comparison and line binding without fabricated limits, defaults, rounding or equivalence | Business data semantics BEFORE those validations; canonical storage/encoding is technical after evidence. Requiredness/actor/stock whole kg are not reopened |
| Q7 | How are the confirmed Masoumi/Karimi duties mapped to explicit current grants, which order/line/specification fields are exposed for Karimi's lookup, which PO-linked receipt/discrepancy/driver fields may each role read, and what may ACT-SEC see? Who are backups? | Both required read directions need scoped owner contracts and personal attribution without a second stock writer, role-name inference or data leak; the need for lookup/visibility is already confirmed | Business authorization/scope decision BEFORE granting new reads/commands; actual account provisioning later configuration/UAT |
| Q8 | How should unknown/ambiguous PO lookup, missing/disputed mandatory W2 or unavailable accepted W1 be handled? Who retains/retrieves waybill/receipt evidence and handles errors before/after posting? | Operable receiving/evidence and safe escalation; cannot turn optional W3 into a prerequisite or silently use old no-PO/no-ticket receiving as a bypass | Business procedure BEFORE normal/exception branch acceptance; detailed retention duration and attachments may remain separately deferred if minimum custody is settled |
| Q9 | How do the new pre-arrival operational orders relate to existing immutable completed-purchase/proforma evidence and existing no-PO receipts? Is historical linking/backfill needed? | Preserve eleven accepted capabilities and avoid silently redefining completed documents or forcing new references on old intake | Business historical linkage policy BEFORE integration/migration; actual coexistence/version/port design is technical. No-PO/no-ticket removal requires separate approval |
| Q10 | If order amendments/cancellation, remaining-quantity closure, returns or post-post correction become necessary, what authority and compensating procedure applies? | Cannot silently rewrite ordered/discrepancy history or treat remainder as received/closed | Deferred business branch; not a prerequisite of documenting current facts. Resolve before that branch; no correction implementation or invented operational workaround now |
| Q11 | What owner ports, receipt confirmation atomic grain, concurrency/lock order, progress projection and replay binding can preserve the approved bundle while supporting the agreed business cardinality? | Concurrent arrivals must not double-count/post; unknown COMMIT cannot be resolved with new IDs | Technical architecture choice AFTER business cardinality/provenance is reconciled, BEFORE implementation; no answer chosen in Step 1 |

Exact shape/format bounds, schemas, API versions, query routes and UI design are
future technical choices under approved policy, not reasons to ask the factory
for architecture. A policy change for W1/Internal Code and new receiving visibility
requires an explicit dependency/architecture decision and later Owner approval.
Safe Step 2 input is this identified conflict/question set, not a frozen design.

## Review/acceptance boundary

No real production/customer/driver data, credentials, document uploads or network
connections are introduced. Security analysis is proportional: personal current
authority, scoped new purchasing reads, sensitive arrival fields, immutable
original/actual history, source identity, atomic progress/stock/audit and recovery
are future design risks. Documentation review does not certify their implementation.
UAT, production acceptance, expanded ACT grants and technical gate changes remain absent.
