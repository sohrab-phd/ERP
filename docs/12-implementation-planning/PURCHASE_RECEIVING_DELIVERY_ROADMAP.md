---
id: PLAN-INBOUND-ROADMAP-001
title: Purchase and receiving proposed incremental delivery and Definition of Done
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [delivery-lead, chief-solution-architect, business-process-owner]
depends_on: [APR-032, PLAN-INBOUND-GAP-001, PLAN-INBOUND-ARCH-001, PLAN-INBOUND-DECISIONS-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-10-20
approval: null
supersedes: null
---

# Delivery strategy — PROPOSED / NOT AUTHORIZED

This is Step 2 analysis, not Step 3 detailed design or a published command/schema.
The [48-row coverage matrix](PURCHASE_RECEIVING_COVERAGE_MATRIX.md) binds every
requirement to the proposed increments and future test obligations. Read the
[architecture](PURCHASE_RECEIVING_ARCHITECTURE_IMPACT.md), [code evidence](PURCHASE_RECEIVING_TECHNICAL_GAP_ANALYSIS.md)
and [OPEN decision register](PURCHASE_RECEIVING_DECISION_REGISTER.md) before any
later scope decision. No completion percentage or new implemented capability is claimed.

## Dependency-aware sequence and approval gates

1. Owner/factory answers the actual business residuals B01–B09 used by the proposed
   scope; explicitly defer B10 historical linking if unnecessary. Reconcile W1,
   physical identity, receipt grain and narrow read scopes through governance.
2. **Only after explicit Owner Step 3 authorization**, prepare affected detailed
   owner contracts, version/admission, data/transaction/lock/read design and final
   acceptance criteria. Required business decisions must precede their finalization.
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

## I1 — Operational purchase registration and receiving lookup

Business outcome: Masoumi can register a pre-arrival seller order with distinct
ordered lines/specifications/count and one-unit W1; Karimi can retrieve the original
order/lines by the approved unambiguous seller-number workflow. No stock or received
progress is created. This is an operational concept separate from completed-purchase
and sent-proforma evidence.

Dependencies/gates: existing Identity, command envelope, atomic audit and Procurement
owner; B01 PO namespace, B07 order-field semantics/line selection/date representation,
B08 operational commands and WH lookup field scope. No need to solve device protocols,
F19 or truck receipt grain to register an ordinary order, but later linking must remain
possible. B10 historical links excluded unless specifically approved. All details are
conditional on those answers and explicit implementation approval.

Likely affected later: Procurement owner contracts/service/store/transport and additive
persistence, composition policy/admission and owner boundary checks. Existing completed
purchase/proforma v1 inputs, routes, tables and authorization stay compatible. No
Procurement Inventory write dependency; no supplier master or approval lifecycle is
introduced by assuming seller context. A narrower registered-order immutable source
is preferred initially; any edit/amendment lifecycle needs separate policy, not
destructive changes to historical evidence.

Security/transaction requirements: trusted personal ACT-PROC registration and scoped
ACT-WH lookup after B08; one atomic order+line+outcome+audit bundle; bound full input,
current grants, safe ambiguous/not-found behavior, no cross-org or documentary-read
widening. Concurrent identical seller references resolve according to approved identity;
unknown COMMIT uses same-key recovery, not a second order.

Conditional I1 Definition of Done:

- All 12 Masoumi fields have their accepted requiredness (7 mandatory, 5 optional),
  exact Persian terms/technical translations and approved semantics. Multiple distinct
  lines survive even without optional item numbers. W1 is per unit, not total line kg.
- Pre-arrival registration and WH lookup satisfy REQ-INBOUND-001/002/003 and the
  order-lookup part of 005, with no Unit/Lot/Ledger/Balance or financial writes.
- Real PostgreSQL proves order/line/outcome/audit atomicity, scoped uniqueness,
  distinct-user races and same-key/different-payload/recovery semantics.
- Parser/API and security tests prove stage-aware mandatory/optional fields, approved
  representations, closed schemas, current personal grants, organization isolation,
  revocation/replay disclosure and narrowly permitted lookup fields.
- Existing documentary purchase/proforma reads/writes/replay/attribution remain unchanged;
  relevant existing tests run, final owner/dependency rules and documentation reviewed.
- Independent engineering/security reviews close required findings; final diff/checks,
  local commit and explicit Owner review stop. No API-to-browser workflow claim.

Exclusions: receiving/stock, arrivals/waybills/discrepancy capture, received projections,
historical conversion/linking, amendments/cancellation/closure, supplier approval,
Finance, QC, UI and device/ticket work. I1 alone does not deliver the full factory process.

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
receiving/SEC read scope. D01–D08 detailed design and tests finalized under later
authority. B10 linking/backfill and full correction remain excluded by default as a
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

The next useful action is the concise B01–B09 decision round, then an explicit
Owner instruction for Step 3. This roadmap remains DRAFT / PROPOSED; successful
Step 2 delivery is neither a product unlock nor permission to start detailed design.
