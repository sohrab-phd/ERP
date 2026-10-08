---
id: APR-023
title: SLICE-STOCK reservation increment scope
status: approved
approval: Project Owner explicit pushed Sales commit confirmation and reservation continuation
last_reviewed: 2026-10-08
---

# Reservation increment authority

Owner confirms accepted commit280aa8b4918e05cf091daff4b7b06306b6f7ebc6 was pushed and explicitly instructs SLICE-STOCK reservation increment. This is actual scope authority, additionally covered by APR-019 standing backlog delegation.

Working baseline is that Sales demand/confirmation commit; architecture APR-018/e80a04b15ddf93451cc79ccf81722f564912596d remains unchanged. Scope: individual ACT-SALES RequestReservation, ACT-SALES or organizational ACT-WH ActivateReservation, scoped GetReservation; Inventory owns requested evidence and IPS alone writes active stock claims, Ledger, Balance and Unit state. Earlier confirmed selected demand has priority; no active stealing or TTL.

No shipment, consumption, release/cancellation/expiry, monetary behavior, procurement/production orchestration, QC, portal write or UI. No business answer is inferred. See [bounded plan](../../12-implementation-planning/SLICE_STOCK_RESERVATION_PLAN.md). Stop after accepted local commit for Owner review/push; never push or rewrite history.
