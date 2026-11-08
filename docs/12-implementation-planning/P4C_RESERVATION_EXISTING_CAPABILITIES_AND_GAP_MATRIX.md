---
id: PLAN-P4C-CAPABILITIES-001
title: P4c Reservation existing capabilities and gap matrix
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [delivery-lead, inventory-domain-owner, chief-solution-architect]
depends_on: [APR-052, APR-049, APR-047, APR-045, APR-023, APR-024, ADR-0018, GOV-CODEX-CONTEXT-001]
last_reviewed: 2026-11-08
approval: null
---

# P4c discovery evidence

The actual Owner's **OWNER AUTHORIZATION — P4c RESERVATION UI DISCOVERY &
DESIGN** directive on 2026-11-08 authorizes this documentation/design package,
independent reviews and local documentation commits only. Starting `main` HEAD:
`6ebd3eca11fced994e58a01b8fde354c1e957416`, clean. The permanent efficiency policy
is applied; no additional efficiency investigation is required.

**P4c IMPLEMENTATION NOT AUTHORIZED; UI NOT IMPLEMENTED; NOT ACCEPTED.**
Companions: [workflow/contracts](P4C_RESERVATION_UI_WORKFLOW_AND_CONTRACT_DESIGN.md),
[Owner decisions](P4C_IMPLEMENTATION_AUTHORIZATION_DECISIONS.md),
[review/readiness](P4C_DESIGN_REVIEW_AND_READINESS.md).

## Authoritative evidence

| Source / precise entry point | Established fact |
| --- | --- |
| [APR-023](../00-governance/approved-baselines/APR-023-reservation-increment-scope.md), [ADR-0018](../00-governance/adrs/ADR-0018-inventory-reservation-activation.md), [Reservation delivery](SLICE_STOCK_RESERVATION_IMPLEMENTATION_STATUS.md), [APR-024](../00-governance/approved-baselines/APR-024-shipment-increment-scope.md) | Accepted Reservation backend; APR-024 confirms accepted/pushed `807ab190d49ebb3bd4e3419e09c28de4bc656faf`. |
| [Reservation service](../../apps/backend/src/modules/inventory/reservation.ts): contracts, request, activate, validateEffect, priorityForEffect, get | Actual commands, immutable intent, current authorization, priority delegation and point read. |
| [Reservation store](../../apps/backend/src/infrastructure/postgresql/inventory-reservation-store.ts): aggregate, activeKg, activate, consume | Aggregate includes every REQUESTED/ACTIVE/CONSUMED intent; priority coverage uses matching live ACTIVE and verified CONSUMED claim evidence. |
| [Sales service](../../apps/backend/src/modules/sales/sales-service.ts): confirmedDemand, reservationDemand, reservationCompetitors; [Sales store](../../apps/backend/src/infrastructure/postgresql/sales-store.ts): reservationCompetitors | Only CONFIRMED + matching RECORDED STOCK demand, original selected Unit IDs, exact database timestamp/UUID priority. MAKE is excluded. |
| [IPS](../../apps/backend/src/modules/inventory/posting-service.ts), [Inventory store](../../apps/backend/src/infrastructure/postgresql/inventory-store.ts): lock; [shipping owner](../../apps/backend/src/modules/inventory/shipping.ts) | Sole inventory poster, real stock locks/checks, whole-Unit dispatch and atomic consumption. |
| [0005](../../database/migrations/0005_inventory_posting.sql), [0008](../../database/migrations/0008_reservation_requests.sql), [0009](../../database/migrations/0009_inventory_dispatch.sql) | One ACTIVE claim per Unit; immutable request binding and exact kg; guarded CONSUMED transition with outbound evidence. |
| [Bearer HTTP](../../apps/backend/src/transport/reservation-http.ts), [composition](../../apps/backend/src/composition-root.ts): reservationCurrent, reservationPolicies, reservationQuery | Two-command allowlist, Sales-only point read, WH activation only; public read strips binding/orderBinding. |
| [P1](P1_IMPLEMENTATION_STATUS.md), [P2](P2_IMPLEMENTATION_STATUS.md), [P4a](P4A_IMPLEMENTATION_STATUS.md), [P4b](P4B_IMPLEMENTATION_STATUS.md), [APR-052](../00-governance/approved-baselines/APR-052-p4b-owner-software-acceptance.md) | Accepted native Persian shell, session/recovery patterns and Sales discovery. P4b product `7f30a6f26b6e53c6152d6851f90d1f5ed844f69a`, closure `e16aab8271a9c3ec0e1b118f63245b767d1f0ca7`. |
| [Sales browser reads](../../apps/backend/src/modules/sales/browser-reads.ts), [Sales stock projection](../../apps/backend/src/modules/inventory/sales-discovery.ts), [browser adapter](../../apps/backend/src/transport/browser-http.ts), [operator](../../apps/backend/src/operator/app.ts) | Existing customer/order/assessment discovery and preconfirmation stock picker; no Reservation browser routes, workspace or recovery namespace. |
| [Unit](../../apps/backend/tests/unit/reservation.test.ts), [real-PG](../../apps/backend/tests/integration/reservation.test.ts), [HTTP](../../apps/backend/tests/integration/reservation-http.test.ts), [Shipment delivery](SLICE_STOCK_SHIPMENT_IMPLEMENTATION_STATUS.md) | Inspected test sources/historical accepted evidence for invariants, races, priority, revocation, rollback and lost COMMIT; no fresh product run is claimed here. |

Graphify navigated ReservationService and dependencies locally; actual sources
control conclusions. Architecture [command](../05-application-api-architecture/COMMAND_CATALOGUE.md)
and [query](../05-application-api-architecture/QUERY_CATALOGUE.md) names are not
evidence of implemented endpoints.

## Actual behavior and critical limits

Inventory owns reservation requests and claims; Sales owns confirmed demand;
Shipping owns dispatch; ACT-IPS alone posts Ledger/Balance/Unit effects. Follow
the [ownership matrix](../02-domain-business-architecture/MODULE_OWNERSHIP_MATRIX.md).

- RequestReservation v1 targets a new reservation UUID; payload is exactly
  `{orderId,itemId,unitId,kg}`, preconditions `{}`. Customer derives from current
  personal ACT-SALES context. `kg` is positive whole ASCII text matching
  `[1-9][0-9]{0,19}`, less than 10^20. Fractional Inventory kg does not relax this.
- The order must remain CONFIRMED with its matching recorded STOCK assessment.
  The Unit must be one originally selected for that item, match broad type and
  be organizational or same-customer stock. No arbitrary same-type substitution.
  Confirmation and recorded selection create neither a reservation nor a promise.
- Request checks demand binding and aggregate cap, **not current free stock,
  AVAILABLE state or priority**. REQUESTED changes no inventory quantity/state.
  Concurrent intent admission is serialized; all persisted intents, including
  CONSUMED, count toward the line's requested-kg cap.
- ActivateReservation v1 targets that request with empty payload/preconditions.
  Exact-customer Sales or personal organizational WH may act. Under the existing
  locks/current authorization, IPS rechecks demand, availability, claim and
  priority and commits REQUESTED → ACTIVE with claim/Ledger/Balance/Unit RESERVED,
  audit and durable outcome in one transaction. onHand is unchanged.
- At most one ACTIVE claim per Unit, even for a partial kg request. Remaining kg
  does not admit a second claim. Earlier confirmed demand wins; database
  `(confirmed_at,order_id)` ordering preserves microseconds. Real ACTIVE plus
  verified CONSUMED coverage satisfies earlier demand; REQUESTED does not. Never
  compute priority from browser timestamps or disclose competing customers.
- Shipping's accepted owner bundle can transition ACTIVE → CONSUMED. It requires
  the reservation kg to match the whole current Unit kg. Partial reservation is
  supported but may be unshippable. P4c must not invent splitting/top-up/release.
- Requests cannot be edited, canceled, reassigned or expired by an implemented
  command. A failed activation leaves REQUESTED and consumes request capacity;
  a partial ACTIVE claim may strand a Unit. A new key, new target or another Unit
  is no repair for that intent. This is an existing bounded capability limit,
  requiring visible prevention/guidance, not an automatically authorized extension.

## Capability and gap matrix

IMPLEMENTED AND ACCEPTED means code plus scoped acceptance evidence above.
PROPOSED means this package only; NOT FOUND means absent from targeted owner,
composition, transport and UI inspection. No additional unaccepted Reservation
capability was positively identified; this is not a repository-wide certification.

| Workflow | Existing capability | Missing UI / contract | Proposed bounded P4c |
| --- | --- | --- | --- |
| Select authorized customer | P4b bounded personally granted configured-customer roster, accepted | No Reservation entry | Reuse roster unchanged; one selected customer, no org Sales fallback |
| Find orders and confirmed STOCK evidence | P4b order/assessment list/detail accepted; Inventory internal demand port accepted | Reservation-ready order context absent | Reuse order discovery; propose narrow order-context read for exact CONFIRMED STOCK demand and request-capacity totals |
| Find reservations | Sales-only exact UUID GetReservation accepted | Customer/order discovery NOT FOUND | New Inventory-owned bounded list, exact order/state filters |
| Inspect reservation | Point DTO includes immutable IDs/kg and requested/activated/consumed/dispatch evidence as present | Cookie browser wrapper NOT FOUND | Explicit whitelist/detail and same-customer related navigation; no raw audit stream |
| Select stock | Confirmed original selection enforced on commands; P4b picker is DRAFT/SUBMITTED only | Confirmed-selection availability projection NOT FOUND | New exact order/item read restricted to original ≤16 selected Units; no general stock browse |
| Create request | RequestReservation accepted, partial whole-kg supported | Review form/browser adapter/recovery absent | One immutable request per explicit submit; no batch, autosave or automatic activation |
| Activate | Existing Sales and WH command policies accepted | Browser action absent; WH read authority absent | Recommend Sales-only workspace; explicit separate activation after request receipt; WH workflow deferred |
| Conflicts/partial availability | Authoritative guards and priority accepted | Human guidance absent | Advisory observations, whole-Unit default (D4), durable reject/new-attempt distinction, persistent blocked-request explanation |
| Recover uncertainty | Envelope durable accepted/rejected replay accepted | Reservation encrypted intent/interlock absent | New isolated namespace, exact same-key recovery, tab-wide all-workspace write interlock |
| Audit visibility | Atomic audit/outcome and lifecycle timestamps accepted internally | General browser audit/history NOT FOUND | Show bounded lifecycle evidence and own terminal command receipt; no actor directory/raw audit/outcome query |
| Consume/dispatch | Shipping backend accepted | P4d UI planned | Display CONSUMED/dispatch reference only; no command or unauthorized Shipping fetch |
| Amend/release/cancel/reassign/expiry/steal | Wider catalogue/business policy only; callable Reservation commands NOT FOUND | Requires policy and backend design | Excluded, including fixing partial/blocked intents by a new mutation |
| MAKE output/production, portal, money | Separate modules/roadmap | No Reservation authority implied | Excluded; no automatic allocation of produced stock |

## Dependencies and unresolved policy

The [process map](../02-domain-business-architecture/PROCESS_MAPS_AS_IS_TO_BE.md)
and [actors](../02-domain-business-architecture/ACTOR_RESPONSIBILITY_CATALOGUE.md)
support Sales demand and Warehouse handling. Personal authorization and exact
customer boundaries in [RBAC](../06-security-rbac-audit/ROLE_PERMISSION_MATRIX.md)
and [isolation](../06-security-rbac-audit/CUSTOMER_ISOLATION.md) remain binding.
P4a's Warehouse cross-organization inventory read exception is not a Reservation
read grant. Existing WH activation is action-specific, not commercial discovery.

[Live OQs](../00-governance/registers/OPEN_QUESTIONS.md): OQ-008 is answered for
one active Unit, earlier confirmation and no confirmed-order timer expiry;
temporary-hold TTL remains future. OQ-007 amendment/cancellation effects remain
unresolved for those excluded commands. OQ-001 external order-code mapping and
OQ-019 real employee/grant inputs are not fabricated. UUIDs remain exact technical
identities; no new numbering or personnel assignment is proposed.

No schema, endpoint, permission, migration or index is implemented by this package.
P4a's migration-wide writer-overhead deployment gate stays **OPEN**. P4b D7 stays
**OWNER-ACCEPTED WITH DOCUMENTED RELATIVE-WRITER-REGRESSION EXCEPTION**; original
failure and UNKNOWN cause remain, with no further relative-only investigation.
