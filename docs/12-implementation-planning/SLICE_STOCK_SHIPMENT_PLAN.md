---
id: PLAN-STOCK-SHIPMENT-001
title: SLICE-STOCK shipment increment execution plan
status: accepted
last_reviewed: 2026-10-09
---

# Bounded shipment increment

Authority [APR-024](../00-governance/approved-baselines/APR-024-shipment-increment-scope.md); accepted/pushed reservation baseline807ab190d49ebb3bd4e3419e09c28de4bc656faf. Objective: record an authorized confirmed customer's stock dispatch exactly once, with traceable preparation and atomic inventory exit. Dependencies: Envelope, individual Identity/RBAC, IPS, intake, confirmed Sales demand and reservation. Implementation follows the Owner policy confirmation2026-10-09.

## Binding Owner policy

[APR-024](../00-governance/approved-baselines/APR-024-shipment-increment-scope.md) records the actual2026-10-09 business answer: individual ACT-SHIP prepares, records, loads and finalizes normal shipment without another approver, payment or invoice prerequisite. Only complete already-reserved Units for a confirmed Sales Order. Minimum Shipment/order/Unit/kg/actor/time/outcome evidence plus envelope idempotency/audit; no mandatory logistics/financial reference. No split, ownership override, exceptional shipment, carrier workflow or customer delivery confirmation. Actual person assignments are configuration. Existing Sales Order identity supplies the order reference; external Order Code mapping is not invented.

## Minimal technical design

Use complete recorded Inventory Units only; do not invent physical splitting of a partially reserved Unit. A partial order can contain whole Units only when its existing item permission allows partial shipment, with default tolerance0 and retained remaining valid demand. Eligibility must be checked before packing; incompatible partial claims remain denied rather than releasing or silently enlarging another claim. No new business ticket, QC release, picking optimization or automatic allocation.

- Shipping owns Package/Shipment lifecycle and immutable content/dispatch evidence. Preserve catalogue preparation states; transport calls owner contracts, never stock SQL. Permissions/evidence follow the binding Owner decision above.
- Inventory owns packing/unpacking Unit state and consumption of the matching reservation intent/claim. Extend its public port rather than exposing Inventory adapters to Shipping. IPS alone posts claim consumption and physical stock exit. Dispatch requires PACKED, matching customer/order/item/Unit/kg, no foreign claim and zero remaining Unit stock at SHIPPED.
- Sales owns confirmed demand and fulfillment/closure facts. Shipping uses a narrow authorized demand port and publishes immutable dispatch references for owner-derived committed outbound coverage. Sales fulfillment is recorded only at its accepted business boundary; dispatch is not fulfillment (TRANSITION_TABLES separates delivery evidence and Sales fulfillment commands). No second fulfillment quantity ledger; no automatic close from DISPATCHED/DELIVERED, payment or invoice. Cancel/unfulfilled-remainder authority is later scope.
- One transaction/client covers shipment dispatch, Inventory state/claim/intent, reserved and onHand Ledger effects, Balance, immutable outbound/demand-allocation evidence required by the owner ports, original audit and durable accepted outcome. Business rejection rolls back tentative work via the envelope savepoint; technical failure aborts everything; uncertain COMMIT retries the same key.
- Preserve branded current principal and exact customer/action authorization; no unscoped cross-customer helper or caller-supplied commander. Fresh permission and resource checks follow locks. Separate stable effect identities bind dispatch/Unit/claim to prevent double posting through a different command key.
- The current ACTIVE-only earlier-demand coverage proof is insufficient once claims are consumed: count owner-derived committed outbound allocation/dispatch evidence alongside active coverage, serialize affected order/Unit resources and recheck fresh snapshots. Never let consumption resurrect already dispatched allocation or allow a competitor to steal remaining valid demand. Existing immutable reservation history must be migrated additively to its consumed terminal state, not silently left ACTIVE or rewritten.
- Retain exact frozen Windows Node/TypeScript/npm/PostgreSQL versions and direct pg/SQL migrations. Prior8 migrations keep raw checksums. No new framework, dependency, distributed infrastructure or frontend.

## Definition of Done and required acceptance evidence

Implement the smallest normal shipping workflow and prove:

1. Confirmed authorized demand and permitted content; individually authenticated current ACT-SHIP, exact customer isolation; foreign/unconfirmed/unknown-policy actions denied without disclosure.
2. Packing/assignment/readiness/loading/dispatch state guards; no double packing/assignment, no shipped unpack, no exceptional no-demand shipment or partial physical Unit split.
3. One atomic dispatch consumes the exact reservation and posts exact kg once; immutable Ledger source facts, matching rebuildable Balance, nonnegative stock and correct terminal intent/Unit/Shipment state.
4. Committed outbound allocation plus live claims never exceed valid confirmed demand; zero-tolerance and explicit line partial permission; earlier priority remains correct after dispatch; valid remainder retained. Dispatch does not mark Sales fulfillment or close the order; delivery/payment never automatically close Sales either. Delivery evidence and Sales fulfillment commands are deferred to their accepted boundary.
5. Real PostgreSQL races: same/different keys/principals, shared Unit/claim/package, concurrent pack/unpack/dispatch/reservation activation; deterministic lock order and fresh owner checks prevent deadlocks/stealing/double exit.
6. Accepted/rejected durable replay, conflicting payload/target/principal reuse, new-key business duplicate, rollback after each tentative owner write, audit failure and lost-COMMIT recovery preserve facts/outcomes/audit atomicity.
7. Migration install/replay/hash/privilege/constraint proof; unit/API/error-path tests, current-role revocation, no direct stock writes or mutable history; pinned Windows quality gates and git diff --check.
8. Independent engineering/database/API/test and security review; all required findings fixed; actual implementation documentation updated; coherent accepted local commit, then Owner review/push stop.

## Execution sequence

1. Owner policy recording and scoped design (complete).
2. Inventory-owned packing/claim consumption with additive migration; Shipping-owned package/shipment source facts and owner-port composition/API.
3. Unit and real native Windows PostgreSQL contract, transaction/concurrency/audit/crash acceptance tests.
4. Independent engineering and security review; fix/retest required findings.
5. Document actual delivery, final checks/local commit; stop for Owner review/push.

Prior blocked-stage impact review identified and preserved the distinction between dispatch allocation and Sales fulfillment. Local Graphify graph at accepted baseline807ab is a navigation aid, not business evidence. DoD1–8 satisfied by the executed [delivery evidence](SLICE_STOCK_SHIPMENT_IMPLEMENTATION_STATUS.md) and [independent review closure](SLICE_STOCK_SHIPMENT_REVIEW.md). Local commit is reported at delivery; stop for Owner review/push.
