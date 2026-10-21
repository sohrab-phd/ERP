---
id: PLAN-INBOUND-ROADMAP-001
title: Purchase and receiving proposed incremental delivery and Definition of Done
phase: 12-implementation-planning
status: in_review
version: 0.4.0
owners: [delivery-lead, chief-solution-architect, business-process-owner]
depends_on: [APR-032, APR-033, SRC-005, DOM-INBOUND-POLICY-001, PLAN-INBOUND-GAP-001, PLAN-INBOUND-ARCH-001, PLAN-INBOUND-DECISIONS-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-10-21
approval: null
supersedes: null
---

# Delivery strategy — PROPOSED / NOT AUTHORIZED

Current [focused final review](I1_PURCHASE_ORDER_FINAL_REVIEW.md), authorized by
APR-035, records corrected proposals and fourteen review dispositions. R1 reference
equivalence remains an Owner business decision before unconditional design acceptance;
factory-wide scope is already resolved. Numeric/calendar/catalogue/resource limits
remain conditional. Earlier no-missing-policy assessments below are historical and
qualified by R1. This roadmap authorizes no implementation, gate change or I2 design.

Earlier design step: [APR-034](../00-governance/approved-baselines/APR-034-i1-detailed-design.md)
authorizes I1 detailed design only. Its [domain/API/DB/security/test/risk package](I1_PURCHASE_ORDER_DOMAIN_DESIGN.md)
is DRAFT / PROPOSED and concretizes this roadmap without authorizing implementation
or final I2 design. The [fourteen technical choices](I1_PURCHASE_ORDER_DECISIONS.md)
and [60-ID acceptance scope trace](I1_PURCHASE_ORDER_ACCEPTANCE_PLAN.md) await Owner
review; no runtime behavior, gate or backend capability changes.

Step 2 v0.1 analysis at `b8666b76602f2d002c4cacc5e8b689fe0130fb24` is Owner
accepted; push unconfirmed. Subsequent [APR-033](../00-governance/approved-baselines/APR-033-i1-policy-clarification.md)
confirms B01 PO, specified B07 units/Jalali/reference lists and B08 core operations.
These business requirements are settled. The [12 supplemental requirements and
readiness analysis](../02-domain-business-architecture/PURCHASE_RECEIVING_I1_POLICY_AMENDMENT.md)
update this roadmap; proposed technical delivery choices remain unapproved.

This is Step 2 analysis, not Step 3 detailed design or a published command/schema.
The [48-row coverage matrix](PURCHASE_RECEIVING_COVERAGE_MATRIX.md) binds every
requirement to the proposed increments and future test obligations. Read the
[architecture](PURCHASE_RECEIVING_ARCHITECTURE_IMPACT.md), [code evidence](PURCHASE_RECEIVING_TECHNICAL_GAP_ANALYSIS.md)
and [OPEN decision register](PURCHASE_RECEIVING_DECISION_REGISTER.md) before any
later scope decision. No completion percentage or new implemented capability is claimed.

## Dependency-aware sequence and approval gates

1. Use resolved I1 business policies without re-asking them. I1 registration,
   lookup and both-role catalogue add/select have no demonstrated outstanding
   business-policy blocker in that earlier assessment; final-review R1 now qualifies
   reference equivalence. Keep technical representation/identity/class separation
   as DESIGN REQUIRED. Resolve only I2 business residuals before their affected
   design/stock scope; B10 linking can be explicitly deferred.
2. Explicit Owner Step 3 authorization is now recorded in APR-034 for I1 only.
   Its detailed contracts/data/transaction/lock/read and acceptance specifications
   are proposed for Owner review; affected I2 decisions/contracts remain separate.
3. Owner explicitly approves a bounded implementation scope and applicable product
   gate/unlock. Step 2 acceptance alone will not grant implementation authority.
4. Deliver I1, then I2 as separate coherent backend increments with relevant tests,
   independent engineering/security review, closure of required findings and local
   documentation commits under [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md).
   Stop for Owner acceptance/push at each applicable delivery boundary; never push.
5. Factory UAT, user-facing UI and production cutover remain separately authorized
   work. Backend acceptance does not claim that the factory's profile workflow is
   already deployed or usable through a browser.

The recommendation groups arrival evidence, multi-unit confirmation, stock,
lineage and minimum purchasing progress visibility into I2. Separating those into
independently shipped stock increments risks accepted inventory without the
required trace or misleading delivery progress. Internal implementation tasks can
follow that order, but these required behaviors must pass one coherent I2 DoD.

## I1 — Operational purchase registration, shared references and receiving lookup

Business outcome: Masoumi can register a pre-arrival seller order with distinct
ordered lines/specifications/count and one-unit W1; Karimi can retrieve the original
order/lines by the factory-wide seller number. Both ACT-PROC and ACT-WH can read/select
and add missing legitimate Material Type, Quality/Grade and Color options in the
same relevant reusable lists within authorized scope, then select newly added values.
No different employee or administrator approval is required. No stock or received
progress is created. Operational orders remain distinct from completed-purchase
and sent-proforma evidence. WH catalogue capability is included in I1 even though
its actual receiving-command use belongs to I2.

Dependencies/gates: existing Identity, command envelope, atomic audit and Procurement
owner. OWNER RESOLVED: B01 factory-wide PO uniqueness regardless of supplier,
B07 width m/thickness mm/optional length m, Jalali registration date and shared
extensible lists, B08 PROC register/read and WH lookup/original specs plus both-role
addition/selection. DESIGN REQUIRED: exact numeric/date representation, catalogue
identity/duplicate admission, distinct repeated lines, historical value preservation
and separation from technical material class. No I1 requirement to finalize I2
mapping, F19, truck grain, exceptions or device protocols. B10 historical links
remain excluded unless approved. Step 3 design is now authorized; its technical
contracts remain proposed, and implementation still requires separate authorization.

Likely affected later: Procurement owner contracts/service/store/transport and additive
persistence, composition policy/admission and owner boundary checks. Shared reference
selection/addition can PROPOSED remain within Procurement's existing inbound ownership;
no separate master-data platform is justified. Existing completed
purchase/proforma v1 inputs, routes, tables and authorization stay compatible. No
Procurement Inventory write dependency; no supplier master or approval lifecycle is
introduced by assuming seller context. A narrower registered-order immutable source
is preferred initially; any edit/amendment lifecycle needs separate policy, not
destructive changes to historical evidence.

Security/transaction requirements: trusted personal ACT-PROC registration/read and scoped
ACT-WH number lookup/original-specification read under resolved B08; both roles
can add/select all three catalogues with current organizational grants. Addition
does not grant PO edit, receipt/exception acceptance, stock, correction or technical-
mapping administration. Preserve one atomic order+line+outcome+audit bundle; bound full input,
current grants, safe ambiguous/not-found behavior, no cross-org or documentary-read
widening. Duplicate PO registration preserves the original without overwrite/merge,
including distinct users and suppliers within the same factory boundary. Catalogue
creation must retain trusted creator, atomic outcome/audit, scoped reuse and race-safe
duplicate behavior under the future explicit identity design. Whether creation and
order registration are separate durable operations or one atomic intent is a future
design comparison: either must permit add/select/continue without third-party approval,
with no misleading partial order result. Unknown COMMIT uses the original bound key,
not fresh IDs; no duplicate policy or API shape is selected here.

Conditional I1 Definition of Done:

- All 12 Masoumi fields have their accepted requiredness (7 mandatory, 5 optional),
  exact Persian terms/technical translations and approved semantics. Multiple distinct
  lines survive even without optional item numbers. W1 is per unit, not total line kg.
- Enforce exact supplied PO reference factory-wide regardless of supplier within
  the correct trusted installation/factory mapping. Duplicate order attempts cannot
  overwrite/merge, while distinct waybills may later reference the same order.
  No supplier-master dependency, extra mandatory field or documentary-reference change.
- Width m and thickness mm are mandatory, length m optional; preserve units/exact
  accepted values without automatic conversion, rounding, tolerance or assumed precision.
  Jalali registration dates pass valid/invalid and leap-year boundary cases and exact
  roundtrip without timezone/conversion shifts. DB timestamps remain independent;
  Gregorian internal storage is not an approved contract, nor is F18's calendar resolved.
- For EACH of the three lists, BOTH roles pass add/select/reuse tests under current
  personal organizational grants: PROC creates then WH selects; WH creates then PROC
  selects; each can add/use during its workflow without another employee's approval.
  Type remains mandatory, quality/color optional, separate RAL optional. No arbitrary
  free-text substitute, new mandatory catalogue ID/metadata entry or admin-only gate.
- Future explicit catalogue identity rules pass exact/equivalent-input race, repeated
  request, changed-payload conflict and unknown-outcome tests without silent merging
  distinct factory terms, cross-list conflation or cross-organization reuse/leakage.
  Preserve trusted creation attribution/audit and historical selected label meaning.
- Business Material Type addition creates no technical enum entry or implicit OTHER
  mapping. Legitimate I1 order/catalogue use is stock-free and need not await I2 mapping;
  supported mapping/authority must be reconciled before I2 effects. Catalogue addition
  never modifies original ordered specifications or accepts unordered goods (B06).
- Pre-arrival registration and WH lookup satisfy REQ-INBOUND-001/002/003 and the
  order-lookup part of 005, with no Unit/Lot/Ledger/Balance or financial writes.
- Real PostgreSQL proves order/line/outcome/audit atomicity, scoped uniqueness,
  distinct-user races and same-key/different-payload/recovery semantics.
- Parser/API and security tests prove stage-aware mandatory/optional fields, approved
  representations, closed schemas, current personal grants, organization isolation,
  revocation/replay disclosure and narrowly permitted lookup fields.
- Negative tests deny catalogue modification to customers/unrelated roles, WH order
  edits through lookup/add, PROC receiving/stock and inferred broad ACT-SEC access.
  Scoped IDs/lookups cannot cross installation/organization boundaries; catalogue
  addition never widens completed-purchase/proforma documentary access.
- Existing documentary purchase/proforma reads/writes/replay/attribution remain unchanged;
  relevant existing tests run, final owner/dependency rules and documentation reviewed.
- Independent engineering/security reviews close required findings; final diff/checks,
  local commit and explicit Owner review stop. No API-to-browser workflow claim.

Exclusions: receiving/stock, arrivals/waybills/discrepancy capture, received projections,
historical conversion/linking, amendments/cancellation/closure, supplier approval,
Finance, QC, UI and device/ticket work. Catalogue edit/delete/merge/reclassification
or technical mapping administration is not authorized by addition. I1 alone does
not deliver the full factory process. Cases A/B/C and REQ-INBOUND-S01–S12 supplement
the original 48-requirement trace without changing the 23-field register.

## I2 — Coherent purchase-linked multi-unit receiving and committed visibility

Business outcome: Karimi verifies the units actually arriving, retains original
versus confirmed attributes and discrepancy evidence, records arrival/waybill/existing
warehouse reference plus receiving fields, and posts each accepted unit through IPS.
Masoumi can then query committed receipts, units, outstanding and discrepancies by
the original PO. New origins carry minimum authoritative lineage immediately.

Dependencies/gates: accepted I1 operational order/lookup; all B01–B09 residuals
affecting receiving answered or an explicit ordinary-case/exception limitation
approved; ADR/dependency reconciliation for W1 and physical identity; approved
business cardinality, F19 meaning, mixed old/new identity rollout and narrow
receiving/SEC read scope. D01–D10 applicable detailed design and tests finalized under later
authority. B08 core roles/list addition and specified B07 I1 semantics are already
resolved, not prerequisites to re-ask. I2-only fields/mapping/source/exception
residuals remain open. B10 linking/backfill and full correction remain excluded by default as a
proposal, not an approved policy.

Likely affected later: Procurement arrival/confirmation/discrepancy/progress owner
sources and queries; Inventory receipt-origin owner port and composition effect
admission; additive persistence and scoped constraints; source-backed Genealogy
contracts/projections; Identity policies and transport admission only as approved.
IPS kernel arithmetic/ownership and downstream business contracts need no rewrite.
The safest proposed transaction is architecture option A (or compatible owner-port
option B if chosen after B04), not looping public commands or client partial commits.

Security/transaction requirements: ACT-WH remains receiver; ACT-PROC receives no
stock-write authority. Capture trusted actor and DB recording time, retain entered
dates separately. Serialize physical source/progress and all applicable owner/code
locks in a compatible order before IPS; commit selected units, actuals/discrepancies,
origins, stock, progress, outcome and audit together. Return only coherent committed
owner projections to approved roles. No automatic ACT-SEC new-data grant or customer
arrival/PII exposure.

Conditional I2 Definition of Done and acceptance strategy:

- All 11 Karimi fields have accepted requiredness (6 mandatory, 5 optional), proper
  business grain, approved source representation and scoped visibility. F19 remains
  distinct from Sheet productCode unless an explicit supported relationship is approved.
- One PO receives multiple arrivals/waybills. A 5-unit line confirmed as 3 then 2
  yields independently coded Units with correct current/prior/cumulative/outstanding
  counts. This scenario is illustrative, not a source identifier or exception rule.
- Stock is sum of accepted unit W1 (e.g. first 3 × 2000 kg = 6000 kg). W2 is mandatory
  for its true consignment; absent W3 is valid. Different W2/W3 never allocate stock,
  imply tolerance/rejection, replace W1, alter shipment/commercial weight or produce money.
- Original order evidence remains immutable; confirmed actual attributes/discrepancy
  marker/source/actor/line/unit/arrival/receipt links persist. Ordinary partial receiving
  is not mismatch. Only the explicitly approved exception branches may post goods.
- WH can add/select the shared catalogue values for actual specifications, including
  describing unordered goods, without editing the original order or authorizing
  their acceptance/stock. Explicit supported technical-class mapping and its authority
  precede posting; no implicit OTHER, enum expansion or catalogue-creation bypass.
- Each received physical unit has its own approved scoped physical code and Inventory
  identity. Real PostgreSQL proves duplicate source/code admission and legacy/mixed-path
  scenarios under the approved rollout policy; no claim of physical deduplication
  based solely on command/effect UUIDs or idempotency keys.
- Each Unit traces source PO/line/arrival/waybill/external receipt/code and actual/
  discrepancy facts through owner sources and Genealogy. Existing measured origins,
  customer-reachability filtering and unrelated-unit/driver confidentiality survive.
- Real PostgreSQL tests cover concurrent arrivals to the same lines, distinct receivers,
  opposing resource orders, duplicate physical confirmations, replay with new/same keys,
  later-unit/source/IPS/progress/audit failure rollback, timeout/deadlock retry, grant
  revocation while waiting, unknown COMMIT and process crash/recovery. No mocked test
  substitutes for transaction/constraint/race evidence; group capacity cannot silently
  split a promised atomic result.
- Committed progress query is coherent with origin/stock, grouped by original PO, and
  never displays ordered-only or uncommitted material as received. SEC/API tests cover
  narrow WH lookup, PROC receiving read, base SEC receipt compatibility and explicitly
  authorized new fields, denial to customers/unrelated roles, org boundaries and PII.
- Regress existing no-PO/no-ticket v1 receiving (including descriptive count, Sheet rules,
  repeated historical codes and original source meaning), purchase/proforma evidence,
  exact stock, reservations/Sales, shipment, production/mass balance, genealogy, Identity,
  invoice evidence and envelope recovery/audit. Use relevant existing test definitions in
  E01–E08 plus new integration obligations; do not rewrite old migrations or facts.
- Appropriate additive migration/roles/constraints and boundary/static checks pass only
  when later authorized. Windows/root pinned scripts and isolated real PostgreSQL are
  required for runtime validation; scope errors and unknown-outcome behavior are documented.
- Operational custody/escalation for missing/disputed required evidence, nonaccepted
  goods and already-posted errors is approved and documented; in-system corrections
  remain excluded. Independent engineering/security review and required fixes, exact
  requirements coverage, docs, final diff/checks and local commit complete the slice.

Exclusions: direct device integration/protocol guesses, separate ticket capture or scans,
automatic commercial reconciliation, payments/settlement, mandatory PO retrofit to old
intake, automatic order closure, returns/corrections, QC approval, browser UI and
production deployment. Basic required backend receiving visibility is included; enhanced
reporting/profile UI requires its own subsequent authorization and usability/UAT work.

## Current Step 2 completion boundary

Step 2 DoD is code-grounded 48-row analysis, responsibility/atomicity/security and
all-capability impact assessment, Q1–Q11 disposition, conditional increments, independent
architecture/security review and documentation/source/link/diff checks. It requires
no runtime test execution for Markdown-only edits and approves no runtime behavior.
The accompanying technical-gap report records actual reviews/checks and limitations.

Step 2 is accepted as analysis; remote push remains unconfirmed. APR-034 authorizes
I1 detailed design, now in the linked proposed package. Final review identifies
R1 reference equivalence before unconditional design acceptance; all selected
technical limits/equality/calendar/transaction choices require Owner acceptance.
The next action is Owner decision/conditional design review, then
separate bounded implementation authorization if desired. I2 still requires its
scoped decisions and is not made ready by I1 design. No implementation is authorized.
