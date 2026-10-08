---
id: ADR-0018
title: Inventory-owned requested intent and atomic activation
status: accepted
last_reviewed: 2026-10-08
---

# Decision

Within actual [APR-023](../approved-baselines/APR-023-reservation-increment-scope.md) Owner scope, preserve [OQ-008](../registers/OPEN_QUESTIONS.md) and [reservation concurrency](../../03-state-machines-invariants/CONCURRENCY_AND_INTERLOCK.md): REQUESTED is not stock allocation; one ACTIVE per Unit even for a partial claim, earlier confirmation wins, no stealing or timer expiry.

Inventory owns an immutable reservation_request intent document REQUESTED→ACTIVE. Existing IPS-owned reservation is the actual quantity claim. Same UUID ties request/claim/source/effect; activation uses the existing sole posting kernel. Version1 RequestReservation targets reservation UUID, payload orderId/itemId/unitId/kg; ActivateReservation has empty payload. Positive whole kg and aggregate requested/active line demand caps remain exact. No new business numbering, cancellation or temporary-hold type.

Sales public read port supplies confirmed immutable demand and selected STOCK Units. Minimal internal earlier contender records use exact PostgreSQL timestamp + order UUID tie break. Inventory subtracts actual matching ACTIVE claim coverage; historical selection is not allocation and fully covered earlier line does not reserve all its selected Units. REQUESTED intents do not satisfy coverage. A lost priority returns generic GUARD_CONFLICT without exposing other customers. Timestamp ties use UUID only as deterministic technical tie break, never overriding earlier time.

Envelope/current Identity -> own Sales order -> request document -> full actual sorted IPS Unit/effect/reservation lock union. Confirmation uses the same Unit resource before confirming. No foreign-order lock inversion. One supplied transaction commits document ACTIVE, IPS claim, reserved Ledger delta, rebuildable Balance, Unit RESERVED, audit and durable outcome. Business savepoint rollback and technical/uncertain COMMIT semantics are unchanged. Same-key replay is durable; new-key equivalent document/state is DUP, altered binding CONFLICT. No direct Balance, Ledger or Sales writes from the reservation service.

ACT-SALES requests/activates in exact customer scope. Current organizational ACT-WH may activate a specified request through owner-derived demand/customer evidence; this action is not blanket commercial read authority. GetReservation is Sales-only with exact customer grant. Reserved Unit/Lot organizational reads are denied; foreign reserved availability is denied using the real claim's customer. No actor-scope stripping, shared account, new QC role or broad customer-list API.

## Alternatives and bounded consequences

Extending the existing quantity claim table to REQUESTED would mingle no-effect planning intent with IPS stock facts and alter accepted migration/history. A separate owner document plus constrained matching ACTIVE claim preserves existing kernel behavior with one added table/adapter. No new framework/service/dependency is introduced.

Active coverage is monotone for this bounded activation-only increment. A concurrent other-Unit activation not yet visible may cause conservative conflict; a durable rejection is recovered exactly and later evaluation uses a new key. Release/consume/cancel/expiry are excluded; their later bundle must explicitly revisit coverage synchronization and customer-read guards. Active request evidence must evolve with future terminal claims rather than pretending they are still active. Runtime has SELECT/INSERT/UPDATE request privileges, no DELETE/DDL; immutable fields and state/claim matching are DB enforced.

Priority currently scans scoped confirmed order JSON and probes earlier active coverage. Add measured indexing/query optimization only if actual factory scale warrants it; do not add caches or distributed locking. This accepted engineering mechanism supplies no new factory authority or OQ answer.

Evidence: [plan](../../12-implementation-planning/SLICE_STOCK_RESERVATION_PLAN.md), [implementation](../../12-implementation-planning/SLICE_STOCK_RESERVATION_IMPLEMENTATION_STATUS.md), [independent review](../../12-implementation-planning/SLICE_STOCK_RESERVATION_REVIEW.md). Final acceptance requires live pinned Windows PostgreSQL proof.
