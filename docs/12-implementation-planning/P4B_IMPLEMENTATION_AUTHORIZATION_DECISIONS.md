---
id: PLAN-P4B-DECISIONS-001
title: P4b OPEN Owner implementation authorization decisions
phase: 12-implementation-planning
status: draft
version: 0.1.0
owners: [delivery-lead, chief-solution-architect, security-architect]
depends_on: [PLAN-P4B-CAPABILITIES-001, PLAN-P4B-DESIGN-001, APR-049, TOOL-UIUX-001]
last_reviewed: 2026-11-07
approval: null
---

# P4b Owner decision sheet

**Current Owner decision:** [APR-050](../00-governance/approved-baselines/APR-050-p4b-sales-ui-implementation-authorization.md)
approves D1 B, D2 A, D3 A, D4 A, D5 A and conditionally D6 A / D7 A against this
sheet's exact design baseline `e7e7cafab0b052b34b9fd58fa66269dd74792749`.
Bounded implementation is authorized, not accepted. New index migrations and
numeric performance thresholds still require the separate decisions specified
in APR-050. The OPEN/NULL and design-only statements below are retained historical
proposal text, superseded only by the actual Owner selections and added controls.

**DESIGN PROPOSAL — IMPLEMENTATION NOT AUTHORIZED**

All choices below remain **OPEN** with **Owner approval: NULL**. Recommendations
are technical proposals, not policy decisions or an implementation grant. The
actual Owner has authorized only discovery/design, specialist reviews and one
local documentation commit from `506dd000e87c331527445e8212656cfc2aefc756`.
No APR or gate/unlock is created by this package. Established P4a design precedent
uses a proposal sheet before a separately numbered implementation authorization.
[Capability evidence](P4B_SALES_EXISTING_CAPABILITIES_AND_GAP_MATRIX.md),
[contract/UI proposal](P4B_SALES_UI_WORKFLOW_AND_CONTRACT_DESIGN.md), and
[review/readiness](P4B_DESIGN_REVIEW_AND_READINESS.md) are part of the review boundary.

## D1 — Exact functional increment

**Question:** Which coherent Sales UI increment should a later bounded directive authorize?

| Option | Effect |
| --- | --- |
| A — Read-only | Authorized customer/order/assessment discovery and point details; no command forms. Useful first increment, no operational demand entry. |
| B — Recommended operational demand | A plus all six existing Sales commands, immutable draft entry, submit, explicit STOCK/MAKE assessment and confirmation. STOCK selection depends on D4. No new business operations. |
| C — Reduced MAKE-only commands | A plus draft/submit/assessment/MAKE/confirm, explicitly omitting STOCK recording if D4 deferred. Must clearly disclose reduced scope and retain STOCK historical readback. |

**Recommendation:** B, conditional on D2–D7 and separate explicit implementation
authorization. It matches the roadmap's Sales/fulfillment assessment intent while
reusing accepted domain commands. A is the minimum viable alternative, not a
hidden substitution if B cannot meet its gates. Scope excludes editing saved drafts,
cancel/hold/close, pricing, reservation/dispatch/production actions and finance.
Security implication: browser access and durable recovery need bounded transport
extensions even though domain commands already exist. Business implication:
confirmation is demand evidence, never guaranteed allocation. Dependencies: D2,
D3, D4 for STOCK, D5–D7. **Status: OPEN. Owner approval: NULL.**

## D2 — Actor scope, customer discovery and browser admission

**Question:** May P4b expose the narrow existing personal exact-customer ACT-SALES
grants and current configured customer labels in the browser?

Options: A — recommended exact-customer grant intersection, one selected customer
per request and the proposed bounded ListSalesCustomers read; B — known-customer
UUID input only, still exact current grants, with acknowledged discovery limitation;
C — organizational/all-customer Sales access, a materially new authority requiring
separate policy design (not included in the recommended package).

**Recommendation:** A. Source already supports customer-granted Sales; browser
session currently drops those grants. Proposed extension changes projection and
transport, not Identity's grant policy. Disclose customerId/displayName only for
current granted configured references in the trusted installation/authority tuple. No broad
directory/name search/CRM, no org Sales invoice-evidence permission reuse. Keep
PROC/WH multi-role choices separate and preserve Host/Origin/CSRF/cookie controls.
Bootstrap adds only a bounded Sales-capability marker; the paged roster authenticates
the personal session without requiring an organizational Sales context and freshly
checks every returned/lookahead customer's exact grant before disclosure.
Effect: authorizes the design of a roster query, Sales session/recovery projection
and closed Sales routes only if selected in a future directive. Dependencies:
Identity/Sales owner reads and D1; actual person/grant setup remains real Owner
input under OQ-019. **Status: OPEN. Owner approval: NULL.**

## D3 — Order and assessment discovery / business identity

**Question:** Is customer-scoped exact-filter UUID-ordered browsing sufficient,
or must a human Order Code/search policy be established first?

Options: A — recommended DiscoverSalesOrders with exact orderId/state/itemType,
ListSalesOrderAssessments by parent, UUID keysets and no external order code;
B — exact known UUID point reads only (fails convenient no-UUID discovery goal);
C — establish human business numbering, dates and free-text search in separate
design before implementing those features.

**Recommendation:** A. It enables discovery without inventing numbering or
promoting database created_at to a business date. Display full technical identity
and explicit nonchronological ordering; do not imply latest assessment. Keep all
assessments visible/paged and confirmation bound to explicit selected assessment.
Security: scope before item predicate/limit/lookahead, no global counts, signed
context-bound cursor, snapshot/fresh reauthorization. Effect: new bounded Sales
read ports/DTOs and two browser detail wrappers, no business schema fields.
Dependencies: D2, D6/D7. **Status: OPEN. Owner approval: NULL.**

## D4 — Demand-scoped stock disclosure and selection

**Question:** May Sales discover minimal candidate Units for an authorized order
item, rather than supply known Unit UUIDs to the existing STOCK command?

Options: A — recommended Inventory-owned DiscoverSalesStockForItem as specified;
B — known-UUID STOCK selection only, no candidate discovery, acknowledged operator
burden and need for independently authorized Unit information;
C — defer STOCK entry and choose D1 A or C; broad Warehouse browsing is not an option.

**Recommendation:** A, as a new narrowly approved Sales read, not inherited P4a
authority. Exact personal customer/order/item, organization or same-customer stock,
all three existing origins only where authoritative lifecycle permits, matching
broad type, AVAILABLE positive verified kg, no active claim/production issue.
Whitelist: unitId, internalCode or null, kind, AVAILABLE state, exact availableKg.
Exact optional unitId/internalCode filters; no Lot/source/location/customer owner,
commercial/competitor/production details, reserved or historical stock browsing.
No automatic specification matching, physical splitting or stock promise.

Security implication: explicit disclosure policy and new nonlocking Inventory
read capability are necessary. Existing command availability admits only
RecordFulfillmentStock/ConfirmSalesOrder and cannot become a list by assertion.
Existing WH exception stays WH-only. Effect: additional read contract and
real-PostgreSQL invariant/performance proof, no Inventory mutations or role-wide
visibility. Dependencies: D1 B, D2/D3, D6/D7. **Status: OPEN. Owner approval: NULL.**

## D5 — Related object/status boundary

**Question:** Should P4b include reservation/shipping/production status discovery
or drill-through beyond Sales-owned order and assessment facts?

Options: A — recommended defer related projections/actions to P4c/P4d/P5;
B — design a separate explicitly whitelisted owner-port status projection with
new field/isolation policy before inclusion; C — exact existing related-object
links only after independently checking each role contract (no implied Sales grant).

**Recommendation:** A. Existing reservation commands/status are accepted backend
behavior but P4c UI is separate; Shipping/Production reads require different
actors and no Sales-safe by-order aggregation was found. Show only Sales state,
confirmedAssessment and own assessment navigation. Explain absent UI as unavailable
in this slice, never zero reservations/shipping or delivery/closure. Effect:
no adjacent slice work or cross-owner status joins. Dependencies: D1 boundary;
future decisions require actual owner contracts and new design. **Status: OPEN.
Owner approval: NULL.**

## D6 — Read/index and operational bounds

**Question:** May a future bounded implementation add owner read adapters and,
only if actual evidence requires, an explicitly reviewed index-only migration?

Options: A — recommended reads first, indexes conditional on measured exact SQL
plans and writer comparison, with candidate definitions returned for review;
B — no migration, prove acceptable current access path or return a blocker;
C — broader schema/read-model/business-code changes, requiring separate design.

**Recommendation:** A; do not preapprove an index by name or rely on Inventory
0019. Preserve immutable snapshots, owner transactions and all existing migration
bytes. Proposed 8 KiB read/128 KiB response/page50/deadline bounds are engineering
starting limits, not evidence of throughput. Existing command 4 KiB admission stays;
UI must account for UTF-8 and full envelope. A changed limit requires explicit
review, not an invisible fix. Security: bounded current-grant/customer/page/source
access and no private row/count leaks. Effect: no DDL until separately justified
within actual future directive; no new dependency/cache/table. Dependencies:
D1–D4 exact selected scope and D7 workload. **Status: OPEN. Owner approval: NULL.**

## D7 — Workload and measurable performance acceptance

**Question:** What representative workload and response/writer-impact budgets
should govern the selected P4b implementation before acceptance?

Options: A — recommended bounded workload-discovery/measurement gate, then explicit
Owner approval of numeric p95/p99 and writer regression budgets before acceptance;
B — Owner supplies measured twelve-month volumes/concurrency and numeric budgets
now; C — copied P4a thresholds (not recommended; different contracts/writers).

**Recommendation:** A. Needed inputs: per-customer order/assessment counts and
skew, grant cardinality, state/item/type distribution, Stock selection and Ledger
fanout, repeated page/filter/detail journeys, peak users and actual Sales/Inventory
writer mix. OQ-014's fewer-than-100 users/about15–25 concurrent planning evidence
does not determine transaction rate or history. Start with explicitly synthetic
small/representative/stress tiers, distinguish warm/cold/cache control, repeated
seeded runs and concurrent intervals; return proposed numeric budgets for Owner
decision. Do not treat unquantified performance as PASS or leave it to silent
implementation discretion. Correctness/security/no Inventory row-lock reads remain
mandatory independent of latency. Compare index changes with/without those indexes,
plus same-schema reader-overlap controls, without confusing the two.

Effect: workload and thresholds remain an explicit gate, not authorization for an
expensive benchmark in this design task. Dependencies: D1–D6, genuine operational
inputs and real verified disposable PostgreSQL 18.6. P4a's migration-wide writer
overhead remains a separate deployment/operational acceptance gate; P4b does not
resolve it. **Status: OPEN. Owner approval: NULL.**

## Owner response and stop boundary

For implementation, the Owner must record chosen options/amendments for D1–D7,
the precise permitted routes/projections/actors, any conditional index procedure
and performance decision gate, then issue a separate bounded implementation
directive against the committed design revision. Deviation requires a returned
decision, not assumed approval. Until then no product endpoints, components,
commands, policies, tests, schema, migrations or gate/unlock changes are authorized.
P4b is not implemented, accepted or deployment-ready. No P3, P4c/P4d/P5, push,
deployment or pilot authority is created. Existing APR records are unchanged.
