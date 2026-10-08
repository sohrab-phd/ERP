---
id: PLAN-STOCK-RESERVATION-001
title: SLICE-STOCK reservation increment execution plan
status: accepted
last_reviewed: 2026-10-08
---

# Bounded scope and delivery plan

Authority [APR-023](../00-governance/approved-baselines/APR-023-reservation-increment-scope.md); baseline280aa8b4918e05cf091daff4b7b06306b6f7ebc6. Business goal: Sales requests a specific confirmed demand's stock, Sales/Warehouse activates the sole claim without stealing or over-reserving physical inventory. Individual users only. Dependencies: Envelope, Identity, IPS, receipt and confirmed Sales demand. Canon: [backlog](IMPLEMENTATION_BACKLOG.md), [reservation transitions](../03-state-machines-invariants/TRANSITION_TABLES.md#sm-reservation), [competition](../03-state-machines-invariants/CONCURRENCY_AND_INTERLOCK.md), [RBAC](../06-security-rbac-audit/ROLE_PERMISSION_MATRIX.md).

## Minimal contracts and design

Version1 envelope, target reservation UUID, empty preconditions. RequestReservation payload {orderId,itemId,unitId,kg}; positive whole-kg string below10^20, immutable binding; ACT-SALES exact customer grant. ActivateReservation payload{}; ACT-SALES exact customer or ACT-WH organizational current permission. No caller-supplied priority or foreign customer data. GetReservation is ACT-SALES only with its exact current customer grant; Warehouse activation does not imply commercial query access.

Inventory-owned reservation_request tracks REQUESTED→ACTIVE, immutable demand/customer/Unit/kg snapshot. Existing IPS reservation stores ACTIVE quantity claim; same UUID, activation source/effect UUID bound to request. REQUESTED posts no Ledger or Balance and can coexist with other requests. Sum requested/active kg for an order item may not exceed its confirmed demand. A partial claim still exclusively occupies that Unit's one ACTIVE slot.

Sales public read port supplies immutable confirmed order/items/recorded selected Units; Inventory never writes Sales. Sales supplies internal minimal earlier confirmed competing order/item/kg evidence from selected Units, including orders without a request. Inventory measures matching real ACTIVE claim coverage; fully covered earlier items do not block another selected free Unit. Only a generic conflict leaves the owner boundary; no competitor identity is exposed. Exact PostgreSQL timestamps retained; equal timestamps ordered by UUID solely as deterministic technical tie break. No arrival-order priority. Confirmation and activation share Unit locks. ACTIVE coverage is monotone in this increment; concurrent uncommitted coverage may yield conservative conflict, requiring a new key after the original durable rejection. Future release/consume/cancel must revisit coverage synchronization and query isolation, not assume this proof remains sufficient.

Lock order: current Identity locks from envelope, Sales order, request UUID, full sorted IPS resource-lock union. Recheck current permission and owner evidence after locks. One opaque transaction for request/claim, IPS Ledger reserved delta, Balance, Unit RESERVED, audit and durable command outcome. Savepoint business rejection removes tentative effects; technical failure aborts whole transaction; uncertain COMMIT retries same key. Same-key accepted/rejected replay; new-key identical document/state DUP, changed reuse CONFLICT, generic resource denial for foreign objects.

HTTP POST /reservations/commands and GET /reservations/{UUID}; personal Bearer, ACT-SALES requires exact customer selector; Warehouse organizational selection only for exact-target activation. The optional x-erp-role header selects ACT-WH or ACT-SALES, but a real current grant is mandatory; Sales is default and requires exactly one x-customer-id UUID. Warehouse rejects customer selectors and reservation queries. Bounded existing parser/timeouts/handler concurrency and nondisclosing errors. No browser UI or new framework.

## Definition of Done / acceptance proof

- Request with confirmed selected demand persists no quantity effect; unconfirmed/foreign/item/Unit/type/invalid kg denied.
- Same-key accepted/rejected durable replay, changed binding conflict and new-key duplicate semantics.
- Activate atomically creates one ACTIVE claim, reserved Ledger delta, matching Balance and Unit RESERVED; onHand unchanged, no negative/over-reserve.
- Earlier confirmation wins even with reversed request/activation arrival and across customers; no foreign identity disclosure. Existing ACTIVE cannot be stolen; partial kg cannot create second ACTIVE.
- Concurrent same/different principal activation and demand overclaim races serialize correctly; losers remain REQUESTED with no partial stock effects.
- Current grant revocation, illegal role, cross-customer query/replay, malformed/unknown fields and direct SQL mutable-history/deletion privileges tested.
- Real PostgreSQL rollback/audit failure and lost COMMIT retry prove atomicity; Ledger/Balance corruption fences activation.
- Unit and integration/API tests pass on pinned Windows Node24.21.0/PG18.6; format/lint/typecheck/build/module boundaries, migration install/replay/checksums and git diff --check pass.
- Independent engineering and security review; required findings closed. Canonical implementation documentation updated and coherent local commit, then stop for Owner push.

## Execution sequence

1. Domain/scope review and local Graphify impact (complete).
2. Inventory-owned request service/adapter/migration; Sales read/priority port and root/API integration.
3. Unit and isolated native PostgreSQL/API acceptance tests.
4. Independent engineering/database/API/test and security reviews, fixes/retests.
5. Documentation, final checks, local acceptance commit and report.

Excluded: shipment/consumption, release/cancellation/expiry, picking optimization, money, PO/production automation, UI, portal writes, QC, distributed infrastructure. Later factory policies remain live OQs, not guessed defaults.

All DoD scenarios pass final pinned Windows execution and independent engineering/security closure; see actual delivery/review records. Local commit follows final diff checks, then Owner review/push stop.
