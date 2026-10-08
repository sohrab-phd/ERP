---
id: GOV-QUESTIONS-001
title: Open Questions Register
phase: 00-governance
status: in_review
version: 0.29.0
owners: [chief-solution-architect]
depends_on: [ASM-REPORT-001, ASM-014, ASM-016, ASM-025, APR-005, APR-014, CHK-0013]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Open Questions Register

APR-005 remains historical approval evidence. This 0.29.0 revision records
delegated pre-implementation blocking-scope classification, now under ADR-0012;
it does not change any recorded answer, OQ status, or factory decision and
does not claim human approval of these new bytes.

## Current residual blocking scopes (2026-10-04)

A = implementation-start blocker; B = slice-specific prerequisite;
C = UAT evidence; D = cutover/go-live prerequisite; E = safe technical defer;
F = future/outside current MVP. A classification describes when an unresolved
item is needed, not its answer or closure. Multiple classes apply when design
and later operational evidence are distinct. This classification covers all
nineteen rows and the additional residual sections recorded below. Architecture
propagation and first-slice freeze are completed after hook retirement under
ADR-0011/0013; final independent readiness is recorded in the live checklist.

The implementation-start reference is the proposed minimal SLICE-ENVELOPE:
generic envelope, caller idempotency, rejection families, audit evidence and
minimal persistence. No business command is implemented in that slice.
If its scope expands, reassess dependencies before authorization.

| Source | Unresolved item | Class / required boundary |
| --- | --- | --- |
| OQ-001 | kg/length formula and factors; applicability of measurement precision beyond measured kg; descriptive-UOM scales; technical kernel capacity resolved by ADR-0015 | B only for affected business/conversion/calculation branches; no quantities in envelope |
| OQ-001 | measured-versus-expected difference threshold | B only before any automatic acceptance/classification; display evidence must not invent a threshold |
| OQ-002 | confirmation against actual scale tickets | C; validation of the accepted kg rule |
| OQ-003 | Entry/Referral persistence beside operation lifecycle; stop/cancel semantics; versioned per-order routing; Station/work-center reconciliation | B before production/workflow; factory routing/Stations remain recorded facts |
| OQ-003 / FACT-05 / FACT-06 | attributable-command inventory; login/logout persistence and domain authorization mapping | B for identity/workflow/domain slices; C for attribution verification; no shared accounts |
| OQ-004 | product-family tracking catalogue; Order Code identity and relationship to inventory identity | B before identity/genealogy/production; C/D validate first-go-live catalogue |
| OQ-005 | future Quality plans, limits, personnel, exceptional release | F; no current-MVP Quality prerequisite |
| OQ-006 | configured non-default fulfillment tolerances | B when non-default configuration is introduced; C validate configured cases; accepted default zero remains usable |
| OQ-007 | commercial amendment/cancellation/unfulfilled-demand authorities and effects | B before affected sales/reservation/production commands; close rule remains answered |
| OQ-008 | temporary planning-hold TTL | F unless that separate reservation type is explicitly introduced |
| OQ-009 | human disposition recording; family policy beyond recorded reusability; return posting; consumption timing/partial-versus-complete conditions | B before production/residual handling; no invented numeric classifier or independent production post |
| OQ-009 / FACT-03 | historical numeric branch reconciled to human reusability; missing decision recording/authority remains | B before affected inventory/production slice; no automatic cutoff or invented recording policy |
| OQ-009 / production evidence | good output/WIP operational distinction; process-loss/mass-balance policy | B before affected production behavior; measurement difference is not a loss/disposition rule |
| OQ-010 | approved portal document list/security visibility | B before portal; C verify isolation; future request/price/order-write phases F |
| OQ-011 | make/model/location/protocol/device identity and named receiving operator | B for device integration; C/D validate device/fallback and attribution; human ticket fallback remains accepted |
| OQ-012 | unnamed external invoice-upload system, protocol, legal role and manual/automatic boundary | B before that integration; no assumed Legal-GL connector |
| OQ-012 | later accounting product/version/API | F; statutory/legal GL remains outside current MVP |
| OQ-013 | second legal entity or site | F; explicit architecture reopen, not current tenancy |
| OQ-014 | twelve-month counts/capacity; actual operator population | C for load/UAT evidence; D for capacity/sign-off; role names handled by OQ-019 |
| OQ-015 | files/materials/codes/identities/opening Residual or Scrap; candidate import/receipt boundary | B before opening-stock tooling/design; D for source files, counts, freeze, signers and reconciliation |
| OQ-016 | retention days and backup product | D; C/D restore/recovery verification; accepted RPO/RTO unchanged |
| OQ-017 | optional PostgreSQL stored functions | E/F; not a prerequisite to accepted application-owned PostgreSQL transactions |
| OQ-018 | envelope-required runtime/toolchain/package/install/test/database choices | Resolved technical prerequisite by evidenced ADR-0013 freeze; no OQ answer/status or human baseline approval changed |
| OQ-018 | frontend/authentication products, deployment topology, other slice packages | B/E as their slice requires; ADR-0008 remains proposed |
| OQ-018 | extra MCP products | E/F; none by default; available session review/research tools are not a product integration decision |
| OQ-019 | workshop/sign-off mappings, delegates, attendance, domain ACT permissions and operator names | B for affected domain authorization; C for UAT people; D for cutover signers; future Quality assignments F |
| FACT-03 | Sheet Code uniqueness and relationship to Inventory Unit; triggering Order Code on later Sheets; title wording | B before warehouse transformation/identity/genealogy; title and authority confirmation also OQ-019 |
| FACT-03 | command/atomic transaction for opened-remainder warehouse Coil-to-Sheet transformation without a new order | B before that transformation; not silently added to DATA-TX-001 |
| Commercial evidence | price ownership/version/customer pricing; tax/discount/currency/money rounding; cutting fee formula/authority; invoice numbering/timing | B before affected sales/Finance-Lite; C validate commercial examples; no invented tax/legal rule |
| Payment evidence / OQ-012 | payment recorder, invoice/order links and allocations, partial payments, cheque/promissory-note recording/settlement | B before payments; architecture states do not supply factory procedure |
| Payment evidence / OQ-012 | credit authority/limits; shipment dependency; customer-balance meaning; correction/reversal | B before affected Finance-Lite/shipment behavior; payment remains independent of SO closure |
| Payment methods | deposit percentage and settlement deadline; credit aging policy; cheque/promissory-note operational treatment | B before affected Finance-Lite behavior; no invented percentage/deadline/lifecycle; any statutory/legal-GL treatment F |
| Intake / procurement evidence | code/identity relationships; scale/feed; discrepancies/tolerance; receiving authority and mandatory purchase link | B before receipt/procurement; C/D for actual device/people; no second quantity writer |
| Shipment evidence | preparation/authorization/loading/recording/delivery actors, documents/carrier/evidence/signature, invoice timing/payment prerequisite | B before shipment; C/D for operational verification/people; no invented logistics role |
| Order-change evidence | change/cancel requests and approvals, confirmed-order editing, demand/material changes, route/reservation/allocated-or-produced effects, post-start/post-ship cancellation, customer evidence/reasons/reopen | B before affected commercial commands; no automatic stock reversal or demand discard |
| Procurement evidence | supplier identity/master-data owner/selection/approval; purchase-request/PO existence/creator/approver; proforma and supplier confirmation | B before procurement; C/D for authorized personnel |
| Procurement evidence | quantity change/cancel/return and downstream effects; price/currency/tax/payment terms; acceptance/discrepancy/partial/over/under receipt/correction | B before affected procurement/receipt commands; no invented purchase tolerance/payment workflow |
| FIND-026 referenced below | Inquiry/Quotation expiry commercial practice | B before expiry behavior; evidence stays at existing finding home |

No factory residual above requires business behavior in the frozen generic
envelope. ADR-0011 resolves generic idempotency/transaction/admission, trusted
principal/target/scope, current-access, bounds, concurrency/deadline and retention
contracts. ADR-0013 freezes the supported stack, physical scope and test strategy;
useful independent domain/testing and database/security reviews passed. Current
Class A state and the final independent verdict are controlled by
[IMPLEMENTATION_READINESS](../../12-implementation-planning/IMPLEMENTATION_READINESS.md),
not historical source-access limits. Actual domain permission/person mappings
remain B/C/D. Factory volume counts remain C/D and were not fabricated to choose
technical limits. This technical propagation does not close any treating OQ.
Each later slice must preserve GUARD_OPEN_POLICY for its unresolved inputs.

The Owner abandoned native/OS containment on 2026-10-04. Native installers,
shared-parent ACLs, anchors and malicious-agent resistance are not start
blockers. This changes planning classification only; all recorded business
answers, OQ statuses and factory evidence below remain unchanged.

Status values: `open`, `investigating`, `treating`, `answered`, `deferred`,
`superseded`. Severity and blocking scope are independent.

Team answers arrived as Markdown files under
[team-answers/](../team-answers/). They become authoritative only on the
matching `OQ-*` row below. Chat is not a second register. Residual gaps stay
`GUARD_OPEN_POLICY` until a later row update.

Recorded: `2026-09-15` from `docs/00-governance/team-answers/OQ-001.md`
through `OQ-019.md`. Implementation remains unauthorized. There is no
Phase 13.

Factory-site meeting evidence recorded `2026-09-23` as FACT-01 through
FACT-06 (see [Factory meeting evidence](#factory-meeting-evidence-2026-09-23)).
These are confirmed business facts. They do not authorize implementation,
do not close treating residuals they do not actually answer, do not accept
ADR-0008, and do not create an implementation unlock.

Factory clarification C-07 refines FACT-03: a Customer Order is involved
in initial Coil opening/use; later conversion of its opened remainder
needs no new Customer Order. FACT-03's posting boundary stays open.

## Snapshot after recording

| ID | Status | What is now locked | Still unknown |
| --- | --- | --- | --- |
| OQ-001 | treating | kg is the only official stock quantity; count, length, dimensions, thickness, width, and material/type are not stock quantities; factory weight measurement is 0 decimal places, 1 kg, rounding not needed; weight↔count conversion is not required; a measured-vs-expected weight difference must be shown; Sheet count and individual length stay as attributes; technical kernel capacity resolved by ADR-0015 without changing these factory answers | kg↔length formula and factors; whether 0 decimals applies beyond scale measurement; any automatic threshold for a weight difference |
| OQ-002 | answered | Coil quantity = measured weight in kg; factory 2026-09-23 reinforces this | Shop-floor ticket confirmation (validation, not a new choice) |
| OQ-003 | treating | Post at `CompleteProductionOperation`; no universal hard-coded route; clarification 2026-09-30: ten current physical Stations, Station = Production Step, no separate factory Work Center, route is per order and may skip Stations, Entry and Referral are workflow events with system timestamps and are not Start/Complete | How Entry/Referral sit beside the Production Operation lifecycle; exact abort/cancel command; whether architecture "work center" is unused or aliased; versioned routing mechanism |
| OQ-004 | answered | Unit-level Coil; hybrid finished-product rule; factory 2026-09-23 confirms no unique ID per tiny cut piece; order code is the practical trace key for cut pieces and order scrap | First-go-live product-family catalogue; exact order-code identity; relationship of order code to inventory identity |
| OQ-005 | treating (future residual; no current-MVP QC blocker) | Current factory MVP: no QC department, no Quality role or personnel, no QC execution or mandatory QC gate. Future Quality gates, two-person exceptional release, and inspection lifecycle are retained as deferred architecture | Future plans, limits, and named people only if Quality is later enabled. Not current-MVP inputs |
| OQ-006 | answered | Partial shipment allowed; default tolerance 0; configurable | Exact %/kg by family/customer |
| OQ-007 | answered | Close Sales Order on fulfilled/cancelled/unfulfilled demand, not payment. Factory payment methods do not change this. | Who may amend or cancel a customer order, and what happens to reservation, production, or already-produced material. The close rule itself is not reopened. |
| OQ-008 | answered | One Coil, one active reservation; confirmed SO has no timer expiry | Temporary-hold TTL if that type is added later |
| OQ-009 | treating | Reusable waste = Residual and returns to the warehouse as a business disposition; non-reusable waste = Scrap; no universal numeric cutoff; the system must not classify from weight or dimensions; Production/Workshop Manager decides reusability; order scrap stays traceable by Order Code | Family policy beyond that statement; how the human decision is recorded; conflict with `GUARD_OPEN_POLICY`; posting command not changed |
| OQ-010 | answered | MVP portal = visibility only; no order write | Exact document list; later price/request/order phases |
| OQ-011 | treating | Weighbridge never writes Ledger; human ticket fallback; final invoice weight is commercial evidence, not a second stock writer | Make/model, protocol, device id, named operator |
| OQ-012 | answered | Finance-Lite is not legal GL; no Legal-GL integration in MVP. Factory external invoice upload is not that connector. | External-system identity and any later accounting product/API |
| OQ-013 | answered | One legal entity, one principal site | Future multi-site would reopen architecture |
| OQ-014 | treating | Modest scale: &lt;100 users, ~15–25 concurrent; about 10 production operators is a current workforce estimate only | 12-month transaction counts; operator names |
| OQ-015 | treating | Architecture baseline only: opening Ledger facts would use the same Ledger, not a second stock truth. `OpeningStockImport` is that candidate and is not factory-confirmed. | Source file, material list, counter, preparer, signer, freeze time, source code, opening identity, residual and scrap at opening, and whether opening stock is a Goods Receipt |
| OQ-016 | answered | RPO 60 min, RTO 8 h, daily backup, off-site copy | Retention days; backup product |
| OQ-017 | answered | App-owned bundle in a PostgreSQL transaction + locks | PG functions only after a later ADR + spike |
| OQ-018 | answered | Modular Monolith + PostgreSQL; Node.js + TypeScript | NestJS, Prisma, React, Docker, auth package, extra MCP |
| OQ-019 | treating | 11-person organizational roster; no named delegate identified; no Quality person; operator population is separate and unnamed | Workshop/sign-off mapping, approval mechanics, operator names, `ACT-*`. Do not invent a delegate |

Inquiry/Quotation expiry remains FIND-026 (`workshop-commercial-practice`),
not a new `OQ-*`. Extra MCP remains “none by default” under OQ-018.

---

## OQ-001 — Authoritative UOM matrix

- Answer owner: Data Steward / Inventory / Sales / Production
- Severity: critical
- Status: treating
- Source: [OQ-001.md](../team-answers/OQ-001.md)
- Recorded: `2026-09-15`

### Recorded answer

Kilogram is the authoritative stock UOM for Coil and other raw Inventory
Units. Ledger postings use kg. Length, piece, and bundle may be stored as
secondary/commercial quantities and must not form a second stock truth.
Conversions must be explicit and material-specific. Exact decimal
arithmetic is required; JavaScript `Number` is not authoritative for
weight or money. PostgreSQL `NUMERIC` and a TypeScript decimal type are
the intended representations.

Factory meeting FACT-01 (`2026-09-23`) **confirms** this kg-first policy
for incoming raw materials such as coils and sheets **and** for customer
orders. Length, thickness, and material/type characteristics are
secondary criteria.

Coil → Sheet clarification (`2026-09-30`) adds measurement evidence for
that process, not a full UOM matrix:

- Only measured weight in kilograms is the official stock quantity.
- Count, length, and dimensions are descriptive/operational attributes.
  They are not a second stock-ledger quantity.
- Weight is recorded with zero decimal places. The smallest scale
  measurement is 1 kg. Rounding is not needed for that measurement.
- Conversion between weight and length **may** be needed. The formula and
  factors are **not** defined.
- Conversion between weight and count is **not** required. Do not derive
  stock quantity from count, and do not invent an average or fixed piece
  weight.
- Width is a secondary criterion, with length, thickness, and
  material/type. None of those is an authoritative stock quantity.
- There is one stock quantity in the Ledger: measured kg. Count, metres,
  and dimensions are not parallel stock ledgers. Balance remains a
  projection of Ledger. This does not change that architecture.
- Sheet count and each Sheet's length must still be recorded. 6 m and
  12 m are examples, not an allowed-length list. Dimensions must be
  representable and are not stock quantity.
- When expected or calculated weight differs from measured weight, the
  difference must be shown or reported. The factory has **not** defined a
  tolerance that automatically marks that difference acceptable,
  unacceptable, process loss, Residual, or Scrap.
- That missing measurement threshold is **not** OQ-006. OQ-006 remains
  the fulfillment under/over-delivery and over-production rule (default
  0). It is also **not** the Residual/Scrap reusability decision.
- Customer-order demand quantity stays kg. Secondary order
  characteristics are not extra demand quantities.
- Quantity wording, now stated with the commercial formulas. This is not
  a sales-workflow redesign and not a new stock unit. Estimated amount =
  required weight × price per kg. Final amount = actual/final weighbridge
  weight × applicable price per kg + cutting service fee. Price-list
  ownership, tax, discount, currency, and the cutting-service fee formula
  are not defined. Weighbridge device and protocol stay OQ-011. The
  weighbridge does not write the Inventory Ledger.

Factory measurement precision (0 decimal places, 1 kg, rounding not
needed) is not a decision to store 0.1 kg, 0.01 kg, or 0.001 kg, and it
is not a full technical persistence or arithmetic-scale design. The
existing exact-decimal / PostgreSQL `NUMERIC` direction is unchanged.

Technical subdecision (2026-10-07):
[ADR-0015](../adrs/ADR-0015-inventory-posting-kernel.md) resolves kernel
storage/arithmetic capacity: exact kg strings/BigInt scale 18, absolute magnitude
less than 10^20, unconstrained NUMERIC with checks, rejection without rounding.
This is engineering capacity, not permission for fractional scale measurements
or an answer to business conversion/precision applicability. OQ-001 remains treating.

### Still unknown

Material-specific kg↔length conversion formula and factors. No density,
grade factor, or thickness/width equation is recorded. Technical
persistence and arithmetic capacity is resolved by ADR-0015; business
applicability beyond the factory measurement statement remains open.
Whether zero decimal places applies to every stored kg value
or only to scale measurement. Any automatic threshold for a
measured-vs-expected weight difference. Scales for non-kg descriptive
UOMs. Commands that need a missing conversion factor remain
`GUARD_OPEN_POLICY`. OQ-001 remains `treating`.

### Promoted to

ASM-003 kept (weight-first). RISK-004 treatment confirmed. No signed
conversion matrix yet.

---

## OQ-002 — Coil quantity semantics

- Answer owner: Inventory / Warehouse / Production
- Severity: critical
- Status: answered
- Source: [OQ-002.md](../team-answers/OQ-002.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

**A — Weight is authoritative.** A Coil’s inventory quantity is measured
weight in kg. Length may be measured or calculated and must not change
availability or Ledger. Reservation, issue, consumption, residual, scrap,
balance, and mass-balance use weight. A Coil without length remains valid.

Example recorded in the source file: Coil C-00125 at 12,480.500 kg.

Factory meeting FACT-01 (`2026-09-23`) reinforces this answered kg-based
Coil quantity. No status change.

### Still unknown

Confirmation against actual scale tickets (validation of this decision,
not an open choice).

### Promoted to

ASM-003 kept. OQ-001 residual still covers scale/rounding.

---

## OQ-003 — Production routing and posting points

- Answer owner: Production / MES
- Severity: critical
- Status: treating
- Source: [OQ-003.md](../team-answers/OQ-003.md)
- Recorded: `2026-09-15`

### Recorded answer

No universal hard-coded route. Official consume/output/residual/scrap post
together at `CompleteProductionOperation` as one business transaction.
Skip only when the approved routing version marks the step optional.
Abort before posted inventory facts follows normal production
authorization; after posted facts, abort needs a production-supervisor /
production-manager role and compensating commands. Routing is versioned
per product family.

Factory meeting (`2026-09-23`) said stations would exist, the Production
Manager would define routing in advance, and the system would send the
order sequentially. That wording is historical.

Clarification (`2026-09-30`) takes precedence where it is more specific:

- A Station is a real physical station and, in factory wording, the
  Production Step. There is no separate Work Center in factory terminology.
- Current stations, not a permanent catalogue and not a mandatory sequence:
  1. Heavy roll opener
  2. Light roll opener — hot sheet
  3. Light roll opener — cold & galvanized
  4. 6 m guillotine
  5. 3 m guillotine
  6. 2 m guillotine
  7. 1 m guillotine
  8. Angle/shear station (قیچی نبشی‌بر)
  9. Punch
  10. Plasma cutting
- The production path is not fixed. Mr. Dinavand (Workshop Manager /
  Production Manager; title wording varies) defines the route per order.
  Some stations may be skipped. Do not assume all ten in order.
- Entry is when the order reaches the defined user role or Station.
  Referral is assignment of the order to the next user role or Station.
  That user role is an organizational routing target. It is not a system
  account, not an `ACT-*` permission, and not a Station identity.
  The system clock timestamps both. In normal circumstances referral time
  usually matches arrival at the next stage. That is an observation, not
  an invariant that the timestamps are always identical.
- Operators declare completion of their Station work on a **personal**
  account. The Production Manager is informed. Mr. Dinavand then refers
  the order to the next stage. That declaration is not an approval
  workflow and is not `CompleteProductionOperation`.
- Operator login and logout are recorded. Login is not Entry, not machine
  start, and not a permanent assignment to that Station. No session
  product, timeout, or permission is defined. Mr. Ghaffari's IT and
  Stations/accounts responsibility is not a super-admin permission.
- Assignment does not change merely because the shift changes. No shift
  schedule or Shift Manager is defined.
- A Station completion does not by itself post inventory. Quantity posting
  stays at `CompleteProductionOperation`. There is no second production
  posting path and no Station-screen write to the Ledger.
- No Production Planner, Scheduler, Dispatcher, Production Controller,
  Station Manager, or QC role is created.
- The Production Manager decides when production should stop or cancel.
  That is responsibility evidence. It does not add a state transition.
  The live pre-post / post-post abort split is unchanged.
- Entry is not `StartProductionOperation`. Referral and operator
  completion are not `CompleteProductionOperation`. The posting boundary
  is unchanged.
- No shared Station account. Personal operator accounts only. An operator
  may use those credentials at different Stations and is not permanently
  bound to one Station. Station is not a user.
- About 10 operators. Names are not supplied. This is not a fixed user
  count.
- One incoming-material intake Station, associated with Mr. Karimi.
  Materials include Coil, Sheet, angle, beam, and similar. Record Internal
  Code, Count, Weight, and Type. Count is an intake attribute. Weight in
  kg remains the stock quantity.
- After sales registration, Mr. Dinavand receives the order and defines
  the route. That handoff is not automatic Production Order creation and
  not automatic `StartProductionOperation`.

The architecture routing note that a version may include a work center or
machine is not deleted. For this factory, Station is the step and there is
no separate Work Center. Whether that architecture attribute is unused,
the same thing as Station, or a later abstraction is open.

### Still unknown

How Entry and Referral are recorded beside the Production Operation
lifecycle. The exact stop/cancel command, and the pre-post versus
post-post split, which the factory did not redefine. Whether "work center"
in the architecture text is retired or aliased to Station. A versioned
routing mechanism beyond "the manager sets the route per order and some
steps may be skipped." How a recorded login or logout is stored. Operator
completion has no defined approval semantics. OQ-003 remains `treating`.
Posting stays at `CompleteProductionOperation`. Registering a customer
order does not automatically create a Production Order and does not
invoke `StartProductionOperation`.

### Promoted to

FIND-G-001 / FIND-G-002 / FIND-G-015: leftover residual identity and scrap
quantity, and production consume primitives, are nested inside
`CompleteProductionOperation`. They are not later independent inventory
postings. Canonical contract: DATA-TX-001.

---

## OQ-004 — Tracking granularity

- Answer owner: Production / Quality / Data Steward
- Severity: critical
- Status: answered
- Source: [OQ-004.md](../team-answers/OQ-004.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

Raw Coils: unit-level `InventoryUnit`, with Material Lot as origin
context. Finished product: unit-level when independently handled;
batch-level when homogeneous. Packages/pallets: unit-level when
independently moved. Scrap: quantity on the operation by default.
Reusable residual: its own Inventory Unit. Genealogy stays
Lot → Unit → Operation → Batch → Finished unit → Package → Shipment.

Factory meeting FACT-02 (`2026-09-23`) **confirms** the hybrid principle:
because sheets are cut into small pieces, assigning a unique identifier
to every physical small piece is not feasible. Cut pieces belonging to an
order carry the order-specific code; scrap associated with that order
also carries that order code. This is a confirmed business traceability
requirement. It does **not** create a unique Inventory Unit per tiny
physical piece and does **not** remove TERM-007 Inventory Unit.

Preserve three distinct concepts; do not collapse them:

1. Customer Order / Order Code
2. Material Lot / Inventory Unit identity
3. Physical small piece

The exact relationship between "order code" and Sales Order identity is
**not** decided. Do not invent whether the order code is a database ID,
a human-visible Sales Order number, an internal business number, or a
separate shop-floor code.

### Still unknown

The first-go-live product-family tracking catalogue (application of this
rule, not a new grain). Exact order-code identity. Exact relationship
between order code and inventory identity.

### Promoted to

ASM-004 replaced: batch is not always enough for finished goods.

---

## OQ-005 — Quality plans and release authority

- Answer owner: future Quality owner, if that capability is later authorized (names via OQ-019)
- Severity: critical
- Status: treating
- Source: [OQ-005.md](../team-answers/OQ-005.md)
- Recorded: `2026-09-15`

### Recorded answer — future Quality architecture, not current MVP

Required incoming QC blocks Available. Required in-process/final QC
blocks Ship-Eligible. Quality decides; Inventory applies state.
Conditional Release is an explicit auditable command. Exceptional
release needs an authorized Quality role **and** a second distinct
person. Shipping/ordinary Inventory must not override a hold.

Recommended roles: QC Inspector; Quality Engineer / QC Supervisor;
Quality Manager (conditional/exceptional); Second Authorized Approver.

Factory meeting FACT-05 (`2026-09-23`) does **not** change this QC
decision. There is no shared Station account, so a station account is
not a Quality identity. OQ-005 is not closed and is not reopened.

### Current factory vs future Quality (`2026-09-30`)

The factory clarification states that there is **no Quality Control
department** and that **QC is outside the current MVP**.

This current-MVP scope decision is answered factory evidence. No
`QualityInspection`, Quality approval, QC request, `QC_HOLD`,
`PENDING_QC`, `QUARANTINED`, or Quality `Released` state is a mandatory
current-MVP step for production completion, Goods Receipt, inventory
availability, or shipment. Existing state paths and guards that imply
otherwise are future-only architecture and require later reconciliation
if Quality is brought into scope. Do not invent a replacement approver or status.

Current factory / current MVP:

- no QC department
- no QC execution
- no Quality role
- no Quality personnel
- no Quality approval actor
- no existing employee is assigned a Quality title

The recommended roles above (QC Inspector, Quality Engineer / QC
Supervisor, Quality Manager, Second Authorized Approver) and the
Quality Manager / QC Supervisor workshop role are **historical
architecture recommendations**. They are **not applicable to the
current MVP**. They are not deleted. They are not filled by mapping
another named employee.

Future architecture:

- Quality gates, `SM-QUALITY-INSPECTION`, TERM-016, and the recorded
  hold/release rules stay in the architecture as future capability.
- They are not current factory operations.
- No future QC implementation is specified here.

A questionnaire mention of Quality approval is superseded for the
current MVP by this clarification. Mr. Dinavand's separate "final
approval" wording is recorded on OQ-019. It is not a substitute Quality
role.

### Still unknown

If Quality is later brought into scope: Quality Plans,
checks, limits, sample sizes, and named people. Missing plan/limit →
`GUARD_OPEN_POLICY` for that future capability only. Those inputs are
not current-MVP blockers. OQ-005 remains `treating` for future detail;
the current-MVP exclusion is answered evidence.

Incoming warehouse intake (`2026-09-30`) does not require a current
Quality approval. The incoming-QC block above is future architecture.
It is not current factory execution and is not deleted.

---

## OQ-006 — Fulfillment tolerances

- Answer owner: Sales / Production / Shipping
- Severity: high
- Status: answered
- Source: [OQ-006.md](../team-answers/OQ-006.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

Partial shipment is allowed when the order line allows it. Under-delivery,
over-delivery, and over-production default to **zero** unless an explicit
percentage or absolute tolerance exists on the line/policy. Ordered qty
stays immutable. Outside-tolerance needs an authorized, auditable
exception — not a silent UI bypass.

### Still unknown

Exact %/kg by product, customer, or order type (configuration under this
rule).

Measurement discrepancy is a different subject. The factory requires a
measured-vs-expected weight difference to be shown, and has not defined an
automatic acceptance threshold for it. That absence does **not** change
this fulfillment rule. OQ-006 stays `answered`. BR-007 mass-balance
tolerance is also not that undefined measurement threshold. Estimated
amount versus final invoice amount is also not this fulfillment rule.

### Promoted to

FIND-003 resolved.

---

## OQ-007 — Sales Order closure rule

- Answer owner: Sales / Finance-Lite
- Severity: high
- Status: answered
- Source: [OQ-007.md](../team-answers/OQ-007.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

Close the Sales Order when remaining valid demand is zero within the
already-recorded OQ-006 tolerance (order is `FULFILLED`), **or** remaining
demand is cancelled / authorized Unfulfilled. Shipment `DELIVERED` is a
fulfillment fact, not an independent close prerequisite. Payment does
not close the Sales Order. An unpaid invoice may remain open after SO
close. Sales must not write payment state to close an order.

`CloseSalesOrder` is no longer `GUARD_OPEN_POLICY` for the missing rule.
It still rejects if unresolved demand remains.

Factory commercial evidence (`2026-09-30`) does **not** change this rule.
Deposit plus later settlement, cheque or promissory note, and known-customer
credit are payment methods only. Invoice issued, payment received, and
Sales Order closed stay separate. Payment does not close the Sales Order.
The factory has not said that any payment method is required before
shipment. Who records a payment is not part of this close rule.

The factory has **not** said who may amend or cancel a customer order,
whether a confirmed order may be edited, how a quantity change is
recorded, what happens to a reservation or to material already produced,
whether customer confirmation or a reason code is required, or whether a
cancelled order can be reopened. Those points stay open. They do **not**
reopen this close rule. Mr. Dinavand's production stop/cancel decision is
not Sales Order cancellation authority.

### Promoted to

FIND-G-003 resolved. Canonical close paths:
[TRANSITION_TABLES.md](../../03-state-machines-invariants/TRANSITION_TABLES.md).

---

## OQ-008 — Reservation policy

- Answer owner: Inventory / Sales / Production
- Severity: high
- Status: answered
- Source: [OQ-008.md](../team-answers/OQ-008.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

One Inventory Unit, one active reservation. Earlier confirmed Sales Order
wins; the later order does not steal the Coil. Under-consumption releases
remainder to Available or `CreateResidualUnit`. Confirmed-order
reservations do **not** auto-expire on a 24h/72h timer. They end on
fulfillment, explicit release, cancel, Unfulfilled, or authorized
exception. `ReservationExpirySweep` is cleanup for orphans/stale rows,
not a TTL on confirmed SO reservations.

### Still unknown

TTL only if a later temporary planning-hold reservation type is added.

### Promoted to

FIND-G-005 resolved. Canonical uniqueness:
[CONCURRENCY_AND_INTERLOCK.md](../../03-state-machines-invariants/CONCURRENCY_AND_INTERLOCK.md)
INV-002.

---

## OQ-009 — Reusable residual threshold

- Answer owner: Production / Inventory / Quality
- Severity: high
- Status: treating
- Source: [OQ-009.md](../team-answers/OQ-009.md)
- Recorded: `2026-09-15`

### Recorded answer

Residual vs scrap is a family-specific reuse policy. Residual = issuable
independent Inventory Unit with genealogy. Scrap = non-reusable
disposition via `PostScrapMovement`. No universal 50 kg / 200 mm.
`CreateResidualUnit` is the residual command.

Factory clarification (`2026-09-30`) states the factory's Residual/Scrap
terminology. It was first recorded against Coil → Sheet cutting loss and
is the same mapping here. It does not add a third category.

- Reusable waste = Residual.
- Non-reusable waste = Scrap.
- There is **no** universal minimum weight or dimension cutoff. Do not
  invent Residual if weight or length is at least X, or Scrap if it is
  below X.
- The system must not infer reusability from weight, dimensions, length,
  or any other numeric measurement.
- The Production/Workshop Manager decides from the input/output difference
  and from whether the remaining material is reusable.
- Mr. Dinavand is the identified person. Title wording is Workshop Manager
  / Production Manager. This is organizational evidence, not an `ACT-*`,
  SoD, delegate, or approval-matrix rule.
- Reusable material **returns to the warehouse**. Business disposition:
  production/workshop → Residual → warehouse. That is not a new inventory
  posting command and does not change `CompleteProductionOperation` or
  the Inventory Posting Service.
- Non-reusable material is Scrap. No scrap disposal process, accounting
  treatment, or external waste workflow is defined.
- Scrap from a customer order stays traceable by **Order Code**. Order
  Code, material/inventory identity, and the physical small piece stay
  separate. No unique identifier is required for every tiny scrap piece.
- An earlier questionnaire mention of Scrap Code / unique part identifier
  is historical source evidence. It is not a universal coding requirement.
  It is not deleted.
- A measured-vs-expected weight difference must be shown. That difference
  is not automatically Residual and not automatically Scrap. It is also
  not the mass-balance rule. No new mass-balance formula is defined.

This does **not** close OQ-009. It does **not** move `CreateResidualUnit`
or `PostScrapMovement` out of their recorded production-completion nesting,
and it does **not** make the warehouse conversion itself those commands.

Conflict left open: live OQ-009 / INV text still treats a missing numeric
threshold as `GUARD_OPEN_POLICY`, and `SM-RESIDUAL` still has a
below-threshold branch. Factory evidence says there is no universal
numeric cutoff and a person decides reusability. That guard and that
branch are **not** rewritten here.

### Still unknown

Whether any material family still has a numeric keep/scrap policy outside
this statement. How a human reusability decision is recorded without
inventing a command. Physical warehouse posting of the return. When
material becomes consumed. The business condition for partial versus
complete consumption. The factory does not define a separate process-loss
category or a production mass-balance percentage. Good output versus WIP
is an architecture distinction, not a factory workflow. OQ-009 remains
`treating`.

### Promoted to

FIND-G-001 / FIND-G-002: `CreateResidualUnit` is residual **identity**
nested in `CompleteProductionOperation`. `PostScrapMovement` is scrap
**quantity**, nested for production leftover. Cutoff numbers remain treating.

---

## OQ-010 — Customer Portal phase

- Answer owner: Sponsor / Sales
- Severity: critical
- Status: answered
- Source: [OQ-010.md](../team-answers/OQ-010.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

MVP portal = **visibility only**. Authenticated customers may see order,
fulfillment, shipment, and authorized invoice/documents under isolation.
No `PortalPlaceOrder`, no customer-created orders/reservations, no second
Sales write path. Prices are not shown by default. Internal genealogy is
not dumped to customers. Later phases may add request, prices, order, and
safe trace views after internal purchase-to-delivery is proven.

### Still unknown

Exact customer-facing document list and commercial/security approval of
that list.

### Promoted to

FIND-001 resolved. INV-020 / `GUARD_PORTAL_MVP` remain for order write.
`ADP-PORTAL` may do isolated reads.

---

## OQ-011 — Weighbridge integration

- Answer owner: Integration / Inventory (device facts)
- Severity: high
- Status: treating
- Source: [OQ-011.md](../team-answers/OQ-011.md)
- Recorded: `2026-09-15`

### Recorded answer

Weighbridge never writes Ledger. Path: device → adapter →
`PostGoodsReceipt` / `WI-BUNDLE-GR`. Duplicate detection uses a stable
device ticket/transaction id when the device supplies one. Until
make/model/protocol exist, auto-integration stays `GUARD_OPEN_POLICY` /
`SPIKE-DEVICE`. First-go-live fallback: human posts from the printed
ticket using the **same** Goods Receipt command.

### Still unknown

Make, model, location, protocol, stable device id, named GR operator.
Mr. Karimi's final order weight, used in the customer invoice, is
commercial measurement evidence. It does not make the weighbridge a
Ledger writer and does not add a second inventory posting path.
Incoming-material weight is also not assumed to come from a named
device. No scale, protocol, or automatic integration is defined for
intake.

---

## OQ-012 — Legal accounting integration

- Answer owner: Finance / external accounting owner
- Severity: high
- Status: answered
- Source: [OQ-012.md](../team-answers/OQ-012.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

MVP Finance-Lite is operational invoices/payments/allocations only, not
statutory GL, CoA, tax, or legal statements. No Legal-GL connector in
MVP. Do not invent a product or protocol. Keep an export/sync boundary
for a later adapter. Inventory/Sales/Shipping/Production must not depend
on Legal GL.

### Still unknown

Product, version, API/file when a later phase actually integrates.
Factory evidence that Mr. Ghaffari uploads an invoice record to an
unrelated external system does **not** name that system, protocol, or
legal role, and it is not an automatic API. It is not the Legal-GL
connector. A known-customer credit arrangement is also recorded and does
not define a credit limit, aging rule, credit-approval authority, or
accounting treatment. Who records a customer payment, and what a
customer balance means operationally, are not defined by this answer.
The architecture phrase "customer credit-related operational controls" is
not expanded by this evidence.

### Promoted to

ASM-010 kept (external accounting remains legal authority; MVP does not
implement that system).

---

## OQ-013 — Organization and site model

- Answer owner: Project Sponsor
- Severity: high
- Status: answered
- Source: [OQ-013.md](../team-answers/OQ-013.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

First go-live: **one legal entity, one principal factory site**. Multiple
warehouses/areas on that site are allowed and are not extra companies or
sites. Customer isolation is not multi-company tenancy. A second company
or site is an explicit reopen (numbering, tenancy, authorization,
accounting, reporting, deployment).

### Promoted to

ASM-001 kept / confirmed for first go-live.

---

## OQ-014 — Data and transaction volumes

- Answer owner: Operations / Sponsor
- Severity: medium
- Status: treating
- Source: [OQ-014.md](../team-answers/OQ-014.md)
- Recorded: `2026-09-15`

### Recorded answer

Modest-scale planning: fewer than 100 users, about 15–25 concurrent,
single site, PostgreSQL, Modular Monolith. Do not freeze indexes, storage,
or hardware from invented million-row months. Monthly GR, Coil, order
lines, operations, ledger rows, and shipments remain TBD.

### Still unknown

The 12-month counts (system / Excel / signed estimate). About 10
production operators is a current workforce estimate only. It does not
freeze user cardinality and does not supply operator names.

### Promoted to

ASM-002 kept as planning baseline, not a measured limit.

---

## OQ-015 — Opening-stock cutover

- Answer owner: Inventory / Sponsor / Security (names via OQ-019)
- Severity: critical
- Status: treating
- Source: [OQ-015.md](../team-answers/OQ-015.md)
- Recorded: `2026-09-15`

### Recorded answer

The procedure below is an **architecture baseline**. The factory has not
confirmed it. It is not deleted.

Opening stock, in that baseline, comes from a controlled physical count,
optional cutover worksheet, and reconciliation. Excel is a cutover input,
not live truth. Procedure: freeze → count → discrepancy list →
investigation → named sign-off → `ADP-CUTOVER` / `OpeningStockImport` as
Ledger facts → BalanceRebuild and GenealogyRebuild. No Balance-only row.
No `AdjustBalance`. `ADP-CUTOVER` stays `GUARD_OPEN_POLICY` until source
files, freeze time, and named signers exist. `OpeningStockImport` is not
a second inventory writer and is not `PostGoodsReceipt`. `ACT-IPS` remains
the sole stock writer. The factory has not confirmed that command.

### Still unknown

The factory has not specified an opening-stock file, which materials it
includes, who counts or prepares it, who signs it, a freeze date/time,
whether it is entered before or after go-live, a source document or
source code, required Coil Code, Sheet Code, or Internal Code, whether
opening stock contains standalone or Coil-derived Sheets, how existing
Residual or Scrap is represented, or a special posting event. kg remains
the official stock quantity for the Ledger. That general rule does not
describe an opening-stock file. Count, length, and dimensions stay
descriptive and are not confirmed as opening-file fields. Normal incoming
receiving is not this cutover. No QC signer is created. OQ-015 stays
`treating`.

### Promoted to

FIND-G-014: After opening Ledger/Lot/Unit facts, run `BalanceRebuild`
from Ledger and `GenealogyRebuild` from the DATA-GEN-001 source-fact
catalogue (opening-origin facts at cutover). OQ-015 does not make Ledger
the sole live genealogy input after consumption, output, pack, or ship.

---

## OQ-016 — Recovery objectives and retention

- Answer owner: Management / operations
- Severity: high
- Status: answered
- Source: [OQ-016.md](../team-answers/OQ-016.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

RPO ≤ 60 minutes. RTO ≤ 8 hours. Daily PostgreSQL backups, off-site copy,
protected storage, completion monitoring, periodic restore tests including
Ledger/Balance/Genealogy checks. Restore the database; do not rebuild
truth from UI caches. Retention days stay configurable (legal). This does
not require Kubernetes, Redis, or multi-region. ADR-0008 (Docker topology)
is **not** accepted by this row.

### Still unknown

Retention days and backup product/vendor.

---

## OQ-017 — Inventory Posting mechanism

- Answer owner: Architecture (team-accepted)
- Severity: critical
- Status: answered
- Source: [OQ-017.md](../team-answers/OQ-017.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

Application/domain owns the business command. Each posting runs in an
explicit PostgreSQL transaction: lock → validate → write Ledger facts →
commit. PostgreSQL enforces FKs, uniques, checks, isolation, row locks.
Stored functions are **not** the default posting kernel; they need a later
ADR plus spike. Balance/Genealogy stay projections. Retryable commands
must be idempotent. ORM must not be a second stock writer.

### Promoted to

FIND-004 resolved. Depends on accepted ADR-0007 (PostgreSQL) via OQ-018.

---

## OQ-018 — Architecture and Node.js platform ADR set

- Answer owner: Sponsor constraints + architecture direction
- Severity: critical
- Status: answered
- Source: [OQ-018.md](../team-answers/OQ-018.md)
- Recorded: `2026-09-15`
- Closed by/date: Project Owner team-answer file `2026-09-15`

### Recorded answer

**Constraints:** small-team maintainability; Windows for development;
Linux production; no Windows Server production dependency; on-premises
capable; no required cloud vendor; no Kubernetes/Kafka/RabbitMQ/Redis /
service-per-domain unless a later evidence-based approval.

**Accept ADR-0006 direction:** Modular Monolith, one deployable, bounded
modules, one Ledger writer.

**Accept ADR-0007 direction:** PostgreSQL is the transactional system of
record.

**Keep:** Node.js + TypeScript (ADR-0001). Do not reintroduce .NET.

**Do not freeze:** NestJS, Prisma (may be evaluated; must not be the
posting kernel), React, Socket.IO, auth packages, test runner, Docker
Compose/Nginx topology (ADR-0008 stays proposed). Extra MCP: **none**
unless a named server has purpose, security boundary, and owner.

### Promoted to

ADR-0006 accepted. ADR-0007 accepted. ADR-0008 remains proposed.
FIND-002 remains resolved (packages still not defaults).

---

## OQ-019 — Named workshop and sign-off participants

- Answer owner: **Project Sponsor must supply names**
- Severity: high
- Status: treating
- Source: [OQ-019.md](../team-answers/OQ-019.md)
- Recorded: `2026-09-15`

### Recorded answer

Role/RACI baseline accepted. Required roles: Project Sponsor; Project
Manager / Product Owner; Operations / Factory; Inventory / Warehouse
Manager; Production; Sales / Commercial; Procurement; Quality Manager /
QC Supervisor; Finance; IT / Infrastructure; Security / IAM; ERP
Architecture / Technical Lead. SoD: operator is not sole approver of
that transaction; cutover and exceptional QC need independent
authorization. Chat is not organizational sign-off.

Factory meeting FACT-04 (`2026-09-23`) **partially** supplies names as
an eleven-person organizational personnel roster only. Production-line
operators are **not** included. These people are **not** mapped to
workshop/sign-off roles, `ACT-*` capabilities, SoD authority, approval
authority, or delegates. This does not resolve OQ-019.

Recorded roster (organizational facts; not RBAC):

1. Mr. Karimi — Warehousekeeper
2. Mr. Ghaffari — Invoice issuance/registration + IT responsibility
3. Ms. Koushki — Government trade-system registration + receivables follow-up
4. Mr. Pour-Ebrahim — Sales Manager + order receiving
5. Mr. Dinavand (آقای دیناروند) — Workshop Manager
6. Ms. Bohlouli — Commercial Manager + sales/order receiving
7. Ms. Masoumi — Recording completed purchases + sending proforma invoices
8. Ms. Goodarzi / Ms. Goudarzi — Accounting Manager (one person; both
   spellings appear in successive evidence statements)
9. Ms. Rangini — Accountant
10. Mr. Faraji — Chairman of the Board
11. Mr. Rouzbahani — CEO

### Still unknown

Mapping of the listed personnel to workshop/sign-off roles. Delegate or
`none` for each assignment. Attendance. Approval/sign-off scope.
Production-line operators. System-role / `ACT-*` mapping. Temporary
workshop roster names still have **no** authority. Workshop execution,
SV-013 second person, PO approve, and cutover sign-off stay blocked until
those mappings exist.

Architecture will not invent names, delegates, or authorities. OQ-019
remains `treating`.

Clarification (`2026-09-30`), organizational only, not RBAC:

- The roster count stays **11**. It is not reverted to 10.
- No named delegate has been identified. Do not infer one from titles or
  hierarchy. Delegate mapping stays open.
- The approximately 10 operators are a separate population. They are not
  the 11-person roster. Names are not supplied.
- Mr. Dinavand (Workshop Manager / Production Manager; both titles kept)
  also decides Coil → Sheet reusability context, Residual versus Scrap,
  production stop/cancel, routing, and referral to the next stage. The
  questionnaire also names him for final approval. That is business
  evidence. It is not an approval workflow, an authorization hierarchy,
  or a Quality role.
- Mr. Karimi's roster title is Warehousekeeper. Questionnaire wording
  also says Warehouse Manager. Those titles are not merged. He is
  associated with incoming-material intake (Internal Code, Count, Weight,
  Type) and with final order weight.
- Mr. Ghaffari: IT and Stations/accounts. Not a super-admin permission.
  Earlier roster wording said "invoice issuance/registration." That
  issuance wording is superseded for the customer invoice: he does not
  issue it. He creates the corresponding record and uploads that record
  to an unrelated external system after Mr. Pour-Ebrahim gives him the
  invoice. The external system is not named. This is not an API and not
  legal accounting.
- Mr. Pour-Ebrahim: Sales Manager and order intake. Not extra approval
  authority from the title. He registers the customer order from available
  warehouse stock and calculates the estimated cost (required weight ×
  price per kg). He issues the customer invoice from final/actual order
  weight × applicable price per kg, plus the cutting service fee, and
  gives that invoice to Mr. Ghaffari. Sales and invoice workflows are not
  redesigned as commands here.
- Mr. Karimi calculates the final order weight used in that invoice.
  That weight is not a second stock quantity.
- Mr. Dinavand receives the order and defines the production route when
  production is required. That is not automatic Production Order creation.
- Ms. Koushki: trade-system registration and receivables follow-up. Not
  payment approval.
- Ms. Bohlouli: Commercial Manager; sales and order intake. Not customer
  invoice issuance.
- Ms. Masoumi: purchase registration and sending proformas. A purchase
  proforma is not the customer invoice, the customer order, or a payment
  document.
- Ms. Goodarzi / Ms. Goudarzi: Accounting Manager. One roster slot. Not
  invoice approval.
- Ms. Rangini: Accountant. No added duty.
- Mr. Faraji: Board Chairman / Chairman of the Board. Not payment approval.
- Mr. Rouzbahani: CEO. Not payment approval.
- No additional duties are inferred from these titles.
- There is no Quality person on this roster. The historical Quality
  Manager / QC Supervisor role is not applicable to the current MVP and
  is not filled from this list.

---

## Consistency after recording

| Check | Result |
| --- | --- |
| OQ-017 vs OQ-018 | Posting style uses PostgreSQL transactions because ADR-0007 is now accepted. Functions still later. |
| OQ-010 vs INV-020 | Visibility allowed; order write still forbidden. |
| OQ-019 | Roles listed; factory personnel roster recorded as organizational facts only; workshop/sign-off mapping, delegates, operators, and `ACT-*` assignment still treating. |
| OQ-001 vs OQ-002 | kg is the only stock quantity. Factory measurement: 0 decimals, 1 kg, no measurement rounding. Weight↔count conversion is not required. Weight↔length formula still open. A weight difference must be shown; no automatic measurement tolerance. That tolerance is not OQ-006. |
| OQ-008 vs sweep | Confirmed SO has no invented TTL. |
| OQ-012 vs ASM-010 | Legal books stay outside MVP; product unnamed on purpose. |
| ADR-0008 | Not accepted. OQ-016 numbers are not a Docker freeze. |
| NestJS / Prisma / React | Candidates only. |
| FACT-03 vs `CompleteProductionOperation` | C-07: a Customer Order is involved in initial Coil opening/use; an already opened Coil remainder may later become warehouse Sheets without a new Customer Order or Production Order for that remainder transformation. The posting boundary is open. Live production posting is unchanged. Not added to DATA-TX-001. No new command. |
| FACT-05 vs SEC-ID-001 | 2026-09-23 preferred station accounts. Clarification 2026-09-30 supersedes that: no shared Station account; personal operator accounts only. `SharedTerminal` may still be a shared device; the account is personal. `ACT-*` permissions unchanged. |
| Current factory QC vs architecture Quality | Factory: no QC department; QC is outside the current MVP; no Quality role or personnel. Quality state machines, TERM-016, BR-010, and recommended Quality roles stay as future capability. They are not current factory operations and are not deleted. OQ-005 stays treating. |
| Residual cutoff vs `GUARD_OPEN_POLICY` | Factory: reusable = Residual and returns to the warehouse; non-reusable = Scrap; a person decides; no universal numeric cutoff; do not classify from measurements. Live missing-threshold guard and the below-threshold residual branch are not rewritten. OQ-009 stays treating. |
| Scrap Code vs Order Code | An earlier questionnaire mention of Scrap Code / unique part identifier is historical. Order Code is the practical key for order scrap and tiny pieces. Unique coding of every tiny scrap piece is not required. OQ-004 stays answered. |
| Who issues the customer invoice | Earlier roster label gave Mr. Ghaffari "invoice issuance/registration." Clarification: Mr. Pour-Ebrahim issues the customer invoice and gives it to Mr. Ghaffari. Mr. Ghaffari creates the corresponding record and uploads it to an unrelated external system. The earlier issuance label is superseded for that step and is not deleted. |
| External invoice upload vs Legal GL | The upload is not a named system, not an API, and not the Legal-GL connector. Finance-Lite remains operational Invoice/Payment/allocation. OQ-012 stays answered. |
| Final invoice weight vs Ledger | Mr. Karimi's final order weight feeds the commercial amount. Weighbridge still must not write the Inventory Ledger. OQ-011 stays treating. |
| Purchase proforma vs customer invoice | Ms. Masoumi sends purchase proformas. That is not the customer invoice issued by Mr. Pour-Ebrahim. |
| Incoming QC vs current intake | `SM-GOODS-RECEIPT` still has `QC_HOLD`, and older text says required incoming QC can block Available. Current factory: no QC department and no Quality approval on intake. That path is future capability and is not deleted. Current intake does not invent a Quality person. |
| Intake count vs stock quantity | Intake records Count. Official stock quantity remains measured kg. Count is not a second Ledger. Weight↔count conversion is not required. |
| Warehouse intake vs `PostGoodsReceipt` | One intake station with Mr. Karimi records Internal Code, Count, Weight, and Type. Quantity posting stays `PostGoodsReceipt` with Lot, Inventory Unit, and Ledger. Procurement does not write quantity. No second receiving path. |
| Normal receipt vs opening stock | Incoming receiving is not OQ-015 cutover. `OpeningStockImport` stays an architecture candidate. It is not `PostGoodsReceipt` and is not a factory-confirmed opening process. Files, freeze, and signers stay open. |
| Per-order route vs versioned family route | Architecture text still says routing is versioned per product family and a step is skipped only when that version marks it optional. Factory evidence says Mr. Dinavand sets the route per order and may skip Stations. The storage mechanism is not rewritten. OQ-003 stays treating. |
| Sequential system send | The 2026-09-23 note that the system sends the order sequentially is historical. The later evidence does not confirm automatic next-station selection. |
| Station completion vs posting | Operator completion and Referral are not `CompleteProductionOperation`. A Station screen does not write the Ledger. Not every Station consumes a separate Inventory Unit. |
| Process loss vs measurement difference | Architecture may record an optional process-loss fact inside `CompleteProductionOperation` when a routing records it. The factory has not defined process loss or a percentage. A weight difference is not process loss, Residual, or Scrap. BR-007 is not rewritten. |
| Nested consume primitives | `ConsumeUnitPartial` and `ConsumeUnitComplete` remain nested architecture primitives. The factory has not named them and has not stated when consumption occurs. |
| Shipment/delivery vs Sales Order closure | Factory evidence does not define a logistics process. `DELIVERED`, invoice issued, and payment received are not close guards (OQ-007). "Settlement after delivery" is a payment method, not a delivery workflow and not closure. |
| Implementation | Still unauthorized. No unlock file. |

---

## Factory meeting evidence (`2026-09-23`)

Source: factory-site meeting. Classification of each fact is recorded
below. Chat discussion is not a second register. These facts do **not**
authorize implementation.

| Fact | Classification | Existing OQ home | Status effect |
| --- | --- | --- | --- |
| FACT-01 | Confirmed factory fact; existing kg-first decision confirmed | OQ-001 treating; OQ-002 answered (reinforced only) | OQ-001 not fully answered |
| FACT-02 | Confirmed business traceability requirement; hybrid grain confirmed | OQ-004 answered (catalogue and order-code identity still unknown) | No unique Inventory Unit per tiny piece; Inventory Unit model retained |
| FACT-03 | Factory business evidence for Coil→Sheet, refined by C-07 | Recorded here and on OQ-001 / OQ-009 / process map. **A future dedicated OQ may still be required** for the posting-boundary conflict | Initial opening requires a Customer Order; opened-remainder conversion does not need a new one. Factory classification recorded. Live `CompleteProductionOperation` / DATA-TX-001 **not** changed |
| FACT-04 | Organizational personnel facts only | OQ-019 treating (partial names) | Not RBAC; not `ACT-*`; not SoD |
| FACT-05 | 2026-09-23 station preference, superseded on identity by 2026-09-30 clarification | OQ-003 | No shared Station account. Personal accounts. Station is not a user. |
| FACT-06 | Entry and Referral defined 2026-09-30 | OQ-003 | Not equal to Start or `CompleteProductionOperation`. No invented timestamp columns. |

### FACT-03 — Coil → Sheet (factory evidence through C-07)

Sources: factory meeting `2026-09-23`, plus clarification evidence
`2026-09-30` (task statement of `بسته پرسش (1).docx` and
`بسته پرسش شفاف‌سازی شماره ۲.docx`; those files are not in this
repository), and factory clarification C-07 supplied for this reconciliation.
This is factory evidence. It does not authorize
implementation and does not create a command, entity, or DATA-TX-001 row.

#### What the factory stated

**Business name.** "Conversion of Coil to Sheet for warehouse."

**Where.** The workshop.

**Who decides.** Production/Workshop Manager. The identified person is
Mr. Dinavand. Source wording varies: Workshop Manager and Production
Manager. That title variation needs confirmation. It is not an `ACT-*`,
SoD, delegate, or approval-matrix assignment. OQ-019 stays `treating`.

**Initial opening/use (C-07).** A Customer Order must be involved when a Coil is
initially opened/used for Coil → Sheet processing. This does not establish
whether that demand is technically represented by a Production Order. It
does not permit speculative opening of an intact Coil without demand.

**After that order (C-07).** If opened Coil material remains after the
order, that remainder may be converted to Sheets without another/new
Customer Order. An opened Coil cannot be re-rolled; the remainder may
stay temporarily on the roll-opening machine and ultimately becomes
Sheets. The factory specifies no time limit or automatic schedule.

**Two contexts. Do not collapse them.**

- Context A — warehouse conversion: remainder from a Coil already opened
  for a Customer Order becomes Sheets **without a new Customer Order** and
  **without a Production Order for this remainder transformation**. The
  factory calls this an **inventory transformation**, separate from
  customer-order production. Resulting Sheets can be directly saleable
  and/or allocatable warehouse inventory. They are not assumed to be
  allocated immediately. This does not authorize opening an intact Coil
  speculatively without a Customer Order.
- Context B — customer-order-related production: the initial Coil
  opening/use has a Customer Order involved. Material associated with that order
  keeps the Order Code. This is not the same workflow as Context A.

**Inventory effect (Context A).** One Coil leaves inventory. Multiple
Sheets enter inventory. The relationship Source Coil → resulting Sheets
is retained. This is not only an aggregate quantity change. Traceability
must support Sheet → original Coil and Coil → all resulting Sheets.
Source-Coil identity is not destroyed when a Sheet becomes independent
inventory.

**Identifiers. Do not merge them.**

| Identifier | Factory meaning |
| --- | --- |
| Coil Code | Source Coil |
| Sheet Code | Resulting Sheet. Factory-described format: Coil Code + Sheet number. Global uniqueness of that string is **not** confirmed by the factory. |
| Customer Order Code | Customer order, **when applicable**. Not the same as Coil Code or Sheet Code. |

Order-code traceability for tiny cut pieces (FACT-02) does not remove
Coil Code or Sheet Code from this transformation.

**Attributes to preserve on a Coil-derived Sheet:** original Coil Code;
Sheet Code; Order Code when applicable; Sheet count; total weight;
individual Sheet length; dimensions; cutting date.

**Lengths.** 6 m and 12 m are examples of common market lengths, not a
fixed allowed-length catalogue. Each resulting Sheet's actual length must
be recordable.

**Stock quantity.** Only measured weight in kilograms is the official
stock quantity. Count, length, and dimensions are descriptive. They must
not become a second stock-ledger quantity.

**Measurement precision (this evidence).** Weight: zero decimal places;
smallest scale measurement 1 kg; rounding is not needed. This does not
close OQ-001. Weight↔length conversion may be needed; formula/factors are
undefined. Weight↔count conversion is not required.

**Cutting loss.** May occur. It can be unusable or reusable. The system
must not decide which automatically.

- Reusable waste = Residual.
- Non-reusable waste = Scrap.
- No universal minimum weight or dimension cutoff.
- The Production/Workshop Manager decides from reusability.

**Standalone incoming Sheet.** A Sheet that enters the factory and is
**not** the result of Coil → Sheet conversion receives a new unique
product code. Do not fabricate a Coil Code when there is no source Coil.
Do not force that case into Coil-derived genealogy.

#### What this evidence does not change

- `CompleteProductionOperation` remains the recorded posting boundary for
  **production** consume/output/residual/scrap.
- DATA-TX-001 is not extended.
- No new command or entity is created.
- `CreateResidualUnit` is not redefined as this warehouse conversion.

#### Conflict left open (do not silently overwrite)

Live architecture nests production residual identity and production scrap
quantity inside `CompleteProductionOperation`. Factory evidence says
warehouse Coil → Sheet is an inventory transformation that may occur with
**no** Production Order or new Customer Order for an **already opened
remainder**, and is separate from customer-order production. C-07 requires
Customer Order involvement for initial Coil opening/use. Both positions
are recorded. The posting boundary for Context A is **not** decided.

A second open conflict: a missing numeric residual threshold is still
`GUARD_OPEN_POLICY` in the live OQ-009 treatment, while this factory
evidence says this conversion has no universal numeric cutoff and a
person decides. The guard text is not rewritten here.

#### Still unresolved after this evidence

- kg↔length formula and factors
- whether the factory Sheet Code is globally unique
- whether each Sheet Code is the Inventory Unit business identity or an
  additional attribute on an Inventory Unit (TERM-007 already allows Sheet
  as a kind of Inventory Unit; schema is not decided)
- whether the original triggering Customer Order Code remains associated
  with later warehouse Sheets beyond the recorded "Order Code when applicable"
- the command/transaction that posts "one Coil leaves, many Sheets enter"
- persistence/arithmetic scale beyond the measurement statement
- canonical title string for Mr. Dinavand
- family residual policy outside this conversion

### FACT-05 — stations and identity (clarified 2026-09-30)

**Historical (`2026-09-23`).** The first recording said ordinary execution
should use the account associated with the station because operators
change. That shared-station-account preference is **superseded**. It is
kept only so the earlier wording is not deleted.

**Clarification (takes precedence).** There is no shared Station account.
Every operator has a personal account. Activities that require attribution
use that personal identity. Station is not a user. A person may work at
more than one Station and is not permanently assigned to one. The
questionnaire also says operator assignment does not change with shift.
No shift schedule, shift ownership, or shared shift account is defined.
About 10 operators exist; their names are a later OQ-019 input, not ten
user records created here.

Mr. Ghaffari is responsible for IT and for Stations/accounts. That is
organizational evidence, not a super-admin role.

`SharedTerminal` still means a device may be shared. The account on that
device is personal. `PasswordPolicy` still says a human principal is not a
shared shop password. `ACT-*` permissions are not changed.

Answered from this clarification: no shared Station account; personal
identity for attributable activity; Station and user are different.

Still open: the full list of commands that require attribution; QC, SoD,
reversal, and cutover still follow their existing named-human rules and
are not remapped here.

### FACT-06 — Entry and Referral (clarified 2026-09-30)

**Historical.** The first recording required visibility of when an order
enters a station and when it is forwarded, and left the meaning open.

**Clarification.**

- Entry: the order reaches the defined user role or Station. Record the
  system-clock time. Entry is not defined as machine start, login, first
  material movement, or `StartProductionOperation`.
- Referral: the order is assigned to the next user role or Station.
  Record the system-clock time. Operators declare completion. The manager
  (Mr. Dinavand) refers the work onward. Referral is not
  `CompleteProductionOperation`.
- In normal circumstances, referral time from the previous stage usually
  corresponds to arrival at the next stage. That is not a rule that the
  two timestamps are always identical.
- No timezone or clock-synchronization requirement is added.
- No columns named `started_at`, `completed_at`, `queued_at`,
  `acknowledged_at`, or `accepted_at` are created.

The Production Operation lifecycle is not redefined. How Entry and
Referral are stored beside it remains open.

## Sales, invoice, and payment (factory evidence `2026-09-30`)

Commercial evidence only. It does not authorize implementation, does not
add commands, and does not change `SM-SALES-ORDER`, `SM-INVOICE`, or
`SM-PAYMENT`.

### Customer order

- Mr. Pour-Ebrahim (Sales Manager) registers the customer order from
  available warehouse stock. The title is not extra approval authority.
- Demand quantity is weight in kilograms. Length, thickness, dimensions,
  and type stay descriptive. They are not parallel stock ledgers.
- Estimated amount = required weight × price per kg. This is an estimate,
  not a final accounting rule.
- When production is required, Mr. Dinavand receives the order and defines
  the route. That is not automatic Production Order creation and not
  `StartProductionOperation`.
- Mr. Karimi calculates the final order weight.

### Final amount

Final amount = actual/final weighbridge weight × applicable price per kg
+ cutting service fee.

Mr. Pour-Ebrahim issues the customer invoice from that final order weight
cost plus the cutting service fee.

An earlier quantity note said the final amount uses weighbridge weight
plus a cutting service fee. That shorter wording is kept only as history.
The explicit factory formula is the multiplication above.

Not defined: price-list ownership, price versions, customer-specific
prices, tax, discount, currency, money rounding, the cutting-service fee
formula, who sets that fee, invoice numbering, and invoice timing versus
shipment.

### Invoice handoff

1. Mr. Pour-Ebrahim issues the customer invoice.
2. He gives it to Mr. Ghaffari.
3. Mr. Ghaffari creates the corresponding record.
4. Mr. Ghaffari uploads that record to an unrelated external system.

Mr. Ghaffari does not issue the customer invoice. Accounting does not
issue it. This is not a two-person approval. The external system identity,
protocol, legal role, and whether the upload is manual or automatic are
open. It is not a Legal-GL integration.

Ms. Masoumi's purchase proformas are not this customer invoice.

### Payment methods

1. Deposit, with the remainder settled after delivery. No deposit
   percentage and no settlement deadline are defined.
2. A financial document: cheque or promissory note. No other document
   types are added. No accounting treatment is defined.
3. An established credit arrangement for a known customer. No credit
   limit, approval hierarchy, or aging policy is defined.

Invoice issued, payment received, and Sales Order closed are separate.
Payment does not close the Sales Order (OQ-007, unchanged).

Customer Portal remains visibility-only. No `PortalPlaceOrder`.

Finance-Lite still owns operational Invoice, Payment, and Payment
Allocation. It is not legal GL. The invoice lifecycle
`DRAFT → ISSUED → PARTIALLY_PAID → PAID → CLOSED` is not replaced.
Payment allocation is not redesigned. Those states and allocation
commands remain architecture. The factory has not confirmed them as a
payment procedure.

### What the factory has not specified about customer payment

- Who records a customer payment. Ms. Koushki follows up receivables.
  That follow-up is not payment recording and not payment approval.
  Mr. Ghaffari's invoice record is not a payment record.
- Whether a payment must be linked to one invoice, whether one payment
  may cover several invoices or orders, and whether partial invoice
  payment is a factory procedure. `PARTIALLY_PAID` stays an architecture
  state.
- How a cheque or promissory note is recorded or settled. No cheque
  lifecycle and no promissory-note lifecycle are defined.
- A credit-approval authority or a credit limit for known-customer
  credit. None is defined.
- Whether payment timing affects shipment. No payment method is recorded
  as mandatory before shipment.
- An operational meaning for customer balance, and a procedure for
  payment correction or reversal.

Payment timing does not close the Sales Order. OQ-007 stays answered.
OQ-012 stays answered. No tax, currency, bank, or legal-accounting rule
is added. No new `OQ-*` is opened.

## Incoming material and receiving (factory evidence `2026-09-30`)

Physical intake evidence. It does not authorize implementation, does not
add a posting command, and does not close OQ-001, OQ-005, OQ-009, OQ-011,
OQ-015, or OQ-019.

### Intake

There is one intake station, associated with the warehouse function and
with Mr. Karimi. His roster title is Warehousekeeper. Questionnaire
wording also says Warehouse Manager. Those are one person, not two
titles collapsed into a new job.

Materials include Coil, Sheet, angle, beam, and other incoming types.
No production transformation is defined here for angle or beam.

Recorded at intake:

- Internal Code
- Count
- Weight
- Type

No other intake field is added.

### Quantity

Official stock quantity is measured kilograms. Count is recorded and is
descriptive. It is not a second inventory quantity ledger. Length and
dimensions stay descriptive where already established. Weight↔count
conversion is not required. No weight-per-piece rule is defined.

### Identities

Keep these separate. Do not assume one code structure for every material:

- Internal Code
- supplier or manufacturer identifiers, where they exist
- material identity
- Inventory Unit identity
- Coil Code or Sheet Code, where applicable
- Customer Order Code, only when the material is already tied to an order

A standalone incoming Sheet is not Coil-derived. Do not fabricate a Coil
Code or a Coil parent for it. It has its own material identity. Coil→Sheet
trace applies only when a Sheet is produced from a Coil. Those Sheets
keep the original Coil trace. Sheet Code stays distinct. Quantity remains kg.

An incoming Coil may enter as an inventory unit. Later conversion follows
the already recorded Coil→Sheet evidence. It is not this intake posting.

Lot origin is a source fact. An Inventory Unit links to that origin.
Genealogy Link is a rebuildable projection and is not manually edited.
Goods Receipt is not the whole genealogy model. Do not give every Sheet
a Coil ancestor.

### Ownership boundary

- Procurement document types such as a purchase request or a Purchase
  Order are **architecture candidates**. The factory has not named a
  Purchase Order lifecycle, a supplier code, or a mandatory link from
  intake to a purchase record. What the factory has said is narrower:
  Ms. Masoumi registers purchases and sends purchase proformas. A purchase
  proforma is not a customer invoice, not supplier approval, and not the
  inventory post. No Procurement Manager, purchase-approval hierarchy, or
  supplier-selection authority is confirmed. `ApprovePurchaseOrder`
  remains an architecture command whose person is OQ-019, not a
  factory-confirmed approver.
- Warehouse intake records that material arrived and records the physical
  facts above. That is Mr. Karimi's organizational responsibility. It is
  not an `ACT-*` permission.
- Inventory quantity changes only through the Inventory Posting Service.
  The command remains `PostGoodsReceipt`. The bundle remains
  PostGoodsReceipt + Lot + Inventory Unit + Inventory Ledger.
  Procurement orchestrates. Inventory posts the quantity. There is no
  second receiving path, no Procurement write to the Ledger, no warehouse
  screen write to the Ledger, no weighbridge write to the Ledger, and no
  generic inventory-update command.

### What this evidence does not do

- It does not require current incoming QC. Older incoming-QC text stays
  as future capability.
- It does not name a scale, protocol, or automatic weight feed. OQ-011
  stays treating.
- It does not define a receiving discrepancy policy or a receiving
  tolerance.
- It does not define supplier invoice or supplier-document flow beyond
  the purchase proforma already recorded.
- It does not close opening-stock cutover. OQ-015 stays treating.
- It does not change OQ-009 residual/scrap rules.

## Customer order to station referral (factory evidence `2026-09-30`)

Operational meaning only. No new command. No equivalence is created
between factory words and existing commands.

### Order and handoff

- Mr. Pour-Ebrahim registers the customer order from available warehouse
  stock. Demand quantity is kilograms. Estimated amount = required weight
  × applicable price per kg. Price ownership, versions, tax, discount,
  and currency stay undefined.
- That registration does not automatically create a Production Order and
  does not invoke `StartProductionOperation`.
- When production is required, Mr. Dinavand receives the order and defines
  the route for that order. The route is not a fixed global sequence.
  Different orders may use different Stations. Some Stations may be
  skipped. No Production Planner, Scheduler, Dispatcher, or Production
  Controller is identified.

### Stations

The ten current physical Stations remain those listed on OQ-003. Station
is the physical location and, in factory wording, the Production Step.
No separate Work Center is confirmed. No station was added.

### Entry and Referral

- Entry: the order reaches the defined user role or Station. The system
  clock records that time. Entry is not machine start, operator login,
  first material movement, `StartProductionOperation`, or completion.
- Referral: the order is assigned to the next user role or Station. The
  system clock records that time. In normal circumstances this is close
  to arrival at the next stage. The two times are not required to be the
  same event. Mr. Dinavand performs the referral. Referral is not
  production completion, inventory posting, shipment, or
  `CompleteProductionOperation`.

### Operators

- Personal accounts only. No shared Station account. Login and logout are
  recorded. Login is not Entry and does not bind the person to that
  Station.
- An operator may work at more than one Station. Assignment does not
  change merely because the shift changes. About 10 operators; names not
  supplied.
- The operator declares completion of the Station work. The Production
  Manager is informed and refers the order onward. That declaration has
  no invented approval semantics.
- Mr. Ghaffari's Stations/accounts responsibility is not a super-admin
  permission.

### Posting and stop

- Not every Station completion posts inventory. The posting boundary
  remains `CompleteProductionOperation`. No Station screen writes the
  Ledger.
- The Production Manager decides whether production should stop or be
  cancelled. No cancellation code, reason list, or new state was added.
  The existing pre-post and post-post abort split is unchanged.

### Commercial handoff already recorded

Mr. Karimi calculates the final order weight. Final amount = actual/final
weighbridge weight × applicable price per kg + cutting service fee. The
weighbridge does not write the Ledger. Mr. Pour-Ebrahim issues the
invoice and gives it to Mr. Ghaffari, who records it and uploads the
record to an unnamed external system. Payment does not close the Sales
Order. QC remains outside the current MVP.

OQ-003 and OQ-019 stay treating. OQ-006 is not this workflow.

## Production facts and the posting boundary (factory evidence `2026-09-30`)

This records factory meaning beside the accepted architecture. It does
not change `CompleteProductionOperation`, DATA-TX-001, INV-006, INV-007,
or the genealogy source-fact list. No new command is added.

### What the factory supports

- A customer order is registered from warehouse stock. When production is
  required, Mr. Dinavand sets an order-specific route. Operators work at
  Stations and declare completion. He is informed and refers the next
  stage.
- Material used in that production, the resulting output, reusable
  leftover, and non-reusable leftover stay distinguishable.
- Reusable leftover is Residual and returns to the warehouse. Non-reusable
  leftover is Scrap. Mr. Dinavand decides from reusability. The system
  must not classify from weight, dimensions, quantity, percentage, or a
  universal cutoff. There is no third waste category.
- Where the material or scrap belongs to a customer order, the Customer
  Order Code is the practical order-level trace key. Tiny pieces do not
  each receive a physical-part code. That code does not replace Inventory
  Unit identity. Standalone warehouse stock need not carry an Order Code.
- After a Coil has initially been opened/used for a Customer Order, its remainder
  can become warehouse Sheets without a new Customer Order or a Production
  Order for that remainder transformation. Those Sheets keep the Coil trace.
  That conversion is not automatically customer-order production and is not
  automatically `CompleteProductionOperation`.
- A measured weight difference must be shown. It is not automatically
  Residual, Scrap, or process loss.

### What the factory does not say

- It does not say when material becomes consumed.
- It does not say that every Station consumes a separate Inventory Unit.
- It does not say that every Station completion creates an inventory
  movement.
- It does not name `ConsumeUnitPartial` or `ConsumeUnitComplete`, and it
  does not give the condition for partial versus complete consumption.
- It does not define good output as a workflow distinct from WIP. That
  split remains an architecture concept inside the accepted completion
  bundle. No output grade, yield category, or Quality release is added.
  QC stays outside the current MVP.
- It does not define process loss, a process-loss percentage, or a
  production mass-balance percentage. OQ-006 fulfillment tolerance is not
  that missing percentage. BR-007 is not rewritten.
- It does not define a scrap numbering scheme. Older Scrap Code / unique
  part identifier wording stays historical.

### Architecture that stays

Inside customer-order production, where the accepted operation applies,
consumption, good output/WIP, Residual, and Scrap quantity are posted
once inside `CompleteProductionOperation` through `ACT-IPS`.
`ConsumeUnitPartial` and `ConsumeUnitComplete` stay nested primitives,
not user-facing workflows. `CreateResidualUnit` stays the nested residual
identity post. `PlaceResidualUnit` is not a second quantity post.
`PostScrapMovement` is the nested scrap quantity post. `ScrapUnit` destiny
`SCRAPPED` is not a second quantity post. No production screen writes the
Ledger.

Genealogy source facts stay Lot Origin, Consumption, Output, Residual,
Scrap, Package, Shipment, and Rework. Genealogy Link is a rebuildable
projection, not editable truth, and not a Ledger-only rebuild. No
`EditGenealogy` command is added. Not every material has a Coil ancestor.

Corrections remain new compensating facts. kg remains the only official
stock quantity. Count, length, and dimensions stay descriptive.

OQ-001, OQ-003, and OQ-009 stay treating. OQ-006 stays answered.

## Shipment, delivery, and fulfillment (factory evidence `2026-09-30`)

The factory documents do not define a logistics process. This section
records that gap. It does not add a command, a shipping role, or a change
to OQ-006, OQ-007, or OQ-008.

### What is supported

- Customer demand and official stock quantity stay kilograms. Count,
  length, and dimensions stay descriptive. There is no second fulfillment
  ledger and no piece-fulfillment quantity.
- Final commercial quantity uses the final weighbridge weight already
  recorded. That weight is not a Ledger write. No shipment tolerance is
  defined.
- Where parts belong to a customer order, the Customer Order Code remains
  the practical order-level trace, including through package and shipment
  source facts already in the genealogy catalogue. It does not replace
  Inventory Unit, Coil Code, Sheet Code, or Shipment identity. Not every
  shipment line is one physical piece.
- Payment method 1 is a deposit with the remainder settled after delivery.
  That phrase does not define who delivers, how delivery is confirmed, or
  that delivery closes the Sales Order.
- Mr. Karimi, Mr. Pour-Ebrahim, Mr. Ghaffari, and Mr. Dinavand are not
  given shipment, loading, carrier, or delivery authority by this evidence.

### What stays architecture, not a factory procedure

- Inventory remains stock truth. Balance is a projection. Stock exit, if
  a shipment is later posted, still goes through the Inventory Posting
  Service. A shipment screen does not write the Ledger or edit Balance.
  The existing dispatch command is architecture. The factory has not
  confirmed it, and no second writer is added.
- Reservation stays distinct from shipment. One Inventory Unit, one active
  reservation. A confirmed reservation does not expire on a timer. A later
  order does not steal it. Reservation is not delivery. No picking
  algorithm or automatic allocation strategy is added.
- `ConfirmSalesOrder` does not automatically create a shipment.
- Partial shipment remains the answered OQ-006 rule when a line allows it,
  default tolerance 0. The factory has not described who prepares, splits,
  or records that shipment.
- Sales Order closure stays: remaining valid demand zero within that
  tolerance, or cancelled, or authorized unfulfilled remainder. Shipment
  `DELIVERED`, invoice issued, and payment received are not close guards.
  Delivered is not Closed. Invoice paid is not Closed. Invoice issued is
  not Closed. Shipment created is not Closed.
- Who may authorize an unfulfilled remainder, and any cancellation reason
  codes, stay open. A shipment does not discard remaining valid demand.

### Left open

Who prepares a shipment, who authorizes it, who loads it, who records it,
who confirms delivery, which document goes with it, carrier responsibility,
the delivery evidence, customer signature, invoice timing versus shipment,
and payment before shipment. No Shipping Manager, Logistics Manager,
Dispatcher, Driver, or Delivery Officer is created. The temporary Shipping
owner row is not a factory person. OQ-007 and OQ-008 stay answered.
OQ-019 stays treating.

## Customer-order change and cancellation (factory evidence `2026-09-30`)

The factory documents do not define a customer-order amendment or
cancellation procedure. This section records that gap. It does not add a
command, a role, or a change to the OQ-007 close rule.

### Supported

- Mr. Pour-Ebrahim registers the customer order. That registration is not
  evidence that he may amend or cancel it afterward.
- Mr. Dinavand may decide that **production** should stop or be cancelled.
  That is a production responsibility already recorded. It is not Sales
  Order cancellation authority, not an automatic production reversal, and
  not an instruction to change the route because the customer order
  changed.
- A Sales Order may still close when remaining valid demand is zero within
  OQ-006 (default 0), or when the remainder is cancelled or authorized as
  unfulfilled. Valid demand is not discarded because a shipment occurred.
  Payment and invoice status are not close guards.

### Not specified by the factory — left open

- Who may request, approve, record, or execute a customer-order change or
  cancellation.
- Whether a confirmed order may be edited.
- Whether a quantity increase or decrease modifies existing demand or
  creates a new commercial fact.
- Changes to material or product requirements.
- What an order change does to the production route. Changing an order
  does not automatically start, cancel, reverse, or modify production.
- What happens to an active reservation after cancellation. No automatic
  release rule is added. The accepted reservation rules are unchanged.
- What happens to material already allocated or already produced.
- Cancellation after production has started, after partial fulfillment, or
  after shipment.
- Whether customer confirmation, a reason code, a timestamp beyond the
  existing audit rule, or other evidence is required.
- Whether a cancelled order can be reopened.

### Architecture candidates, not factory procedures

`RequestSalesOrderCancel`, `ConfirmSalesOrderCancel`, `HoldSalesOrder`,
`SalesOrderChange`, `RecordUnfulfilledDemand`, and `ReopenAsInquiry`
remain architecture commands. Cancel and hold states on the Sales Order
machine remain architecture. They are not deleted. The factory has not
confirmed who uses them. They do not write the Ledger. A Sales Order
screen is not a second inventory writer. Genealogy is not edited;
corrections stay compensating facts.

These stay distinct: a customer-requested change, a commercial amendment,
a reservation change, a production stop/cancel, an inventory correction,
and Sales Order closure.

OQ-007 stays **answered** for the close rule. The amendment and
cancellation procedure stays open on that residual and on OQ-019. No new
`OQ-*` is minted. No delegate and no approval chain is created.

## Procurement and purchasing (factory evidence `2026-09-30`)

Factory facts only. Purchase Order states and commands stay architecture
candidates. No new `OQ-*` is minted. OQ-001, OQ-005, OQ-011, OQ-012, and
OQ-015 are not reopened.

### Supported

- Ms. Masoumi registers purchases and sends proformas. That is not
  customer invoicing, supplier selection, purchase approval, payment
  approval, receiving, acceptance or rejection, or an inventory post.
- Mr. Karimi is associated with the one intake station. Materials include
  Coil, Sheet, angle, beam, and similar types. Intake records Internal
  Code, Count, Weight, and Type. Official stock quantity is measured kg,
  0 decimal places, smallest step 1 kg, no measurement rounding. Count is
  descriptive. Weight↔count conversion is not required.
- A standalone incoming Sheet has no fabricated Coil parent. Lot origin
  is a source fact where the material is received. Genealogy Link stays a
  projection. No new genealogy source fact is added.
- There is no QC department. Incoming material does not require a current
  Quality approval.
- Mr. Ghaffari's customer-invoice record and external upload are not
  procurement duties.

### Architecture, not a factory procedure

Procurement may orchestrate a purchasing-side record. Inventory posts
quantity only through `PostGoodsReceipt` plus Lot, Inventory Unit, and
Ledger. `ACT-IPS` is the sole stock writer. A procurement screen and a
warehouse screen do not write the Ledger. Balance is a projection.

`SM-PURCHASE-ORDER` and the purchase commands, including
`ApprovePurchaseOrder`, `SendPurchaseOrder`, partial and full receipt,
hold, and cancel, are architecture candidates. The factory has not
confirmed that lifecycle.

### Left open

Supplier master-data ownership, supplier identity or code, supplier
selection and approval, purchase-request authority, whether a Purchase
Order exists as a factory document, who creates or approves it, the
proforma lifecycle beyond "Masoumi sends proformas," supplier
confirmation, quantity changes, purchase cancellation and its effect on
supplier records, receiving, inventory, payment, or demand, purchase
return, price, currency, tax, and payment terms, incoming acceptance,
discrepancy handling when physical weight differs from a purchase
quantity, receiving authority beyond Karimi's intake recording, partial
receipt, over-receipt, under-receipt, and receipt cancellation or
correction. No procurement tolerance and no procurement payment workflow
are defined. No mandatory link from an intake record to a purchase
record is defined.

## Normal manual receiving — Owner confirmation 2026-10-07

[APR-021](../approved-baselines/APR-021-receipt-increment-scope.md) records
actual Owner clarification for the bounded receipt increment: individual ACT-WH
may post normal manual Goods Receipt, through Inventory/IPS only. ACT-PROC is
not a second stock-posting authority. No mandatory PO, invented external ticket,
global Internal Code uniqueness or duplicate identity is supplied. Retain the
receipt document UUID and existing bound command key across retry. Intake facts
remain Internal Code, descriptive Count, whole measured kg and Type; no fake
Coil parent for standalone Sheet. No QC or receiving discrepancy/tolerance,
return/correction policy is introduced. This supersedes the earlier open
normal-manual-receiving authority sentence only. Actual named grants remain
Go-Live/configuration, and other procurement/device/OQ-011 residuals stay open.
