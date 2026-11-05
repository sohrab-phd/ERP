---
id: PLAN-P4A-SCOPE-001
title: P4a Inventory Visibility and Discovery scope proposal
phase: 12-implementation-planning
status: draft
version: 0.2.0
owners: [delivery-lead, security-architect]
depends_on: [APR-047, APR-043, APR-045, IMPL-P2-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-11-05
approval: null
---

# P4a Inventory Visibility and Discovery — scope proposal

**PROPOSED / NOT AUTHORIZED / NOT IMPLEMENTED.**

Design follow-up2026-11-05: the actual Owner's subsequent design-only directive
permits the bounded [read-contract design](P4A_INVENTORY_READ_CONTRACT_DESIGN.md),
[source/state matrix](P4A_INVENTORY_SOURCE_AND_STATE_MATRIX.md) and
[implementation authorization decisions](P4A_IMPLEMENTATION_AUTHORIZATION_DECISIONS.md).
They refine the initial proposal below, without authorizing implementation or
creating an approval record. Source verification identifies two hard Owner
decisions: limited WH disclosure of allocated/customer production stock, and the
integer-kg expectation versus accepted general-production exact decimal kg.
The all-origin/five-current-state recommendation is conditional; no legacy-only
substitution, fractional-stock omission or new customer permission is approved.
The detailed package now specifies exact routes/fields/cursors/bounds and explicit
index-only migration proposals; its decisions supersede the initial design
questions below only as proposals, never as accepted contracts.

[APR-047](../00-governance/approved-baselines/APR-047-p2-owner-acceptance-software-first-roadmap.md)
accepts P2 and puts P4a next in software-first planning. It authorizes this concise
proposal only. Missing read contracts and UI implementation require a separate
explicit bounded Owner grant; no code/API/schema/permission change is made here.

## Business goal and accepted starting point

Warehouse personnel need to discover authorized stock and inspect a physical
Unit/Lot with exact quantities and trustworthy freshness, without already knowing
every UUID. Recommend a Warehouse-first native Persian RTL journey: bounded search/
filters → paged Unit results → canonical Unit/Lot detail → read-only refresh.
Sales discovery is a separate permission decision, not implicit in a Warehouse UI.

| Existing accepted capability | Actual boundary at accepted P2 revision |
| --- | --- |
| IPS owner reads | Internal `InventoryPostingService.snapshot/availability`; exact onHand/reserved/available kg with Ledger/Balance integrity checks. They acquire Unit locks; not a ready-made paginated browse API. |
| Keyed legacy receipt stock | `GET /inventory/units/{uuid}` → GetInventoryUnit and `/inventory/lots/{uuid}` → GetLot in [receipt-http.ts](../../apps/backend/src/transport/receipt-http.ts). Personal current organizational ACT-WH/ACT-SEC only, not direct SALES/PROC/Customer access. |
| Legacy read coverage | [receipt.ts](../../apps/backend/src/modules/inventory/receipt.ts) details/lot use [inventory-receipt-store.ts](../../apps/backend/src/infrastructure/postgresql/inventory-receipt-store.ts) byUnit/byLot over `inventory.material_lot`. Current snapshot policy admits organizational AVAILABLE stock. These are not all-origin/all-state Inventory reads. |
| Other stock origins | Accepted I2 uses [inventory-receiving-store.ts](../../apps/backend/src/infrastructure/postgresql/inventory-receiving-store.ts) and `inventory.inbound_unit_origin`; production has separate origin records. P2 arrival reads expose its own identities, not general stock discovery. |
| Sales availability | Internal demand/customer-scoped owner port for accepted RecordFulfillmentStock/ConfirmSalesOrder, 1–16supplied unique Unit UUIDs; current customer/stock authority in [composition-root.ts](../../apps/backend/src/composition-root.ts) and [posting-service.ts](../../apps/backend/src/modules/inventory/posting-service.ts). No public Sales discovery/list API and no stock promise/allocation from a read. |
| Native browser admission | [browser-http.ts](../../apps/backend/src/transport/browser-http.ts) admits only current Identity/I1/I2 operations. [browser-session.ts](../../apps/backend/src/transport/browser-session.ts) projects PROC/WH browser grants. Inventory browse/routes and SEC/SALES browser roles do not exist. RBAC query labels alone are not implemented transport contracts. |

Sources were inspected read-only for this proposal; no new runtime tests are
claimed. Thirteen accepted backend capabilities and P1/P2 acceptance are preserved.

## Proposed bounded read scope — requires Owner authorization

Inventory should own a bounded read projection; reuse published owner ports for
source enrichment. Preserve legacy keyed contracts rather than silently changing
their meaning. Propose explicitly new paginated discovery and canonical detail
contracts covering **only Owner-approved source families, stock states and roles**.
Query names/routes/versions and field whitelist remain design proposals, not
accepted APIs. Initial recommendation is organizational WH visibility; decide
legacy/I2/production coverage explicitly so accepted P2 stock is not accidentally
omitted by relying on legacy material_lot alone.

Results should contain authorized Unit/Lot/material IDs, supported physical code/
type/location/state, exact kg strings and page snapshot/as-of metadata. Distinguish
legacy measured evidence from accepted per-unit W1 and whole-consignment W2/W3;
never invent a common weight or allocate header evidence. Link source detail only
through its existing owner-authorized query. Exclude unrelated cargo, customer/
commercial documents, actor secrets, raw outcomes and unrestricted audit/Ledger data.

Propose exact identifier/code lookup plus a small agreed indexed filter set
(material/type, location, permitted state and Lot ID where justified). No global
free-text search/export or guessed fuzzy normalization. Define finite input/page/
response bounds, stable deterministic cursor order, tie-breaking and malformed/
foreign cursor behavior before implementation. Filter by trusted installation/
authority/customer policy **before** results, enrichment, counts and pagination;
unauthorized records must not leak through totals or existence differences.
Each page reports its own freshness; no cross-page atomic snapshot is implied.

Authenticate personal current identity and recheck authorization at disclosure,
including expiry/revocation during query waits. Preserve same-origin cookie/CSRF,
no-store, safe DOM rendering and clear private state on session/actor changes.
Do not infer direct SALES/SEC browser access from backend labels. If Sales needs
stock selection, separately approve an exact demand/customer-scoped discovery
contract and disclosure policy; no unrestricted organizational stock access.

Use read-only database operations and a bounded consistent read strategy, preserving
Ledger truth/Balance integrity. Do not call locking single-Unit snapshots for every
browse row without evaluating contention/query cost. Review indexed access paths,
scan/response bounds, lock behavior and a measured query budget against a verified
representative disposable dataset. Any necessary index/schema change is outside
this proposal and must be explicitly included in later Owner authorization.

## Verification and acceptance gates

- Unit/component: exact filters/cursors/quantity strings, field whitelist, native
  Persian RTL/mixed-direction IDs, keyboard/focus, loading/empty/failed/stale states,
  page exhaustion/deduplication and stale/session/actor continuation suppression.
- Real Windows PostgreSQL with verified disposable roles/DB: each approved stock
  origin/state, Ledger/Balance quantity agreement, customer/site isolation before
  paging/counts/enrichment, expiry/revocation, concurrent posting/reservation between
  reads, stable pages/freshness and measured query/lock/resource bounds. No mocks
  for database consistency/performance claims.
- Actual Chromium with real composed backend/PG: authorized discovery/detail/
  pagination/refresh/reload; denied roles and expired/replaced sessions; transport
  loss; no stale private rendering and no Inventory effect from reads. Preserve
  accepted P1/P2 recovery and receiving regressions with proportionate checks.
- Independent engineering/security/database/test review closes required findings;
  document actual limits/results and obtain separate Owner acceptance of the exact
  implementation revision. Hosted CI/local evidence remain distinct. No pilot,
  push/deployment or next-slice work follows automatically.

## Required Owner decisions before implementation

1. Approve bounded P4a UI scope and **explicit missing read-contract authority**,
   including source families, states, fields, filter/cursor/performance bounds and
   whether an index/schema change is necessary and authorized.
2. Confirm initial permitted personal roles. Recommended first slice is ACT-WH;
   decide any SEC browser admission separately. No new PROC/Customer access.
3. Decide whether SALES discovery belongs in P4a or later P4b, and approve its
   exact demand/customer boundary and browser admission if included.
4. Approve the bounded design/DoD and independent acceptance path with the required
   unit, PostgreSQL and actual Chromium evidence.

Exclusions: Inventory writes/adjustments/rebuild, reservation/stock promises,
shipping/production commands, new masters, unrestricted Ledger/audit/export,
framework/dependency changes, factory provisioning/UAT/pilot/deployment and push.
P4a remains awaiting separate Owner authorization; current task ends with the
acceptance/roadmap documentation commit.
