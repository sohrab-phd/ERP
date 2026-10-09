---
id: ADR-0019
title: Normal reserved-stock dispatch through Inventory owner ports
status: accepted
last_reviewed: 2026-10-09
---

# Decision

Within [actual Owner policy APR-024](../approved-baselines/APR-024-shipment-increment-scope.md), Shipping owns normal confirmed-order package/preparation/dispatch; Inventory owns packing and claim/intent lifecycle; IPS alone consumes reserved quantities and posts whole-Unit exit. One existing envelope PostgreSQL transaction commits states, immutable source facts, Ledger/Balance, audit and durable outcome. No new framework or distributed mechanism.

Dispatch has distinct deterministic per-Shipment/Unit RELEASE and STOCK_OUT effect identities. A private instance-local admission binds transaction, original authenticated actor, request and admitted effects before permitting customer-scoped access to organization-owned stock. Actor scope is not stripped, and direct IPS callers receive no alternate posting authority.

Retain Inventory intent ACTIVE→CONSUMED with immutable claim/Unit/order/kg and FK-bound outbound Ledger provenance. Earlier-demand coverage uses live claims plus committed consumed dispatch allocation, retaining the previous increment's monotone-coverage property after dispatch. This is not delivery or Sales fulfillment; no second fulfillment quantity ledger or automatic Sales closure.

Complete already-reserved Units only. READY and dispatch enforce remaining demand/default zero tolerance and existing per-line partial permission; physical Unit splitting is excluded. Required trace/evidence is the Owner-defined Shipment/order/Unit/kg/actor/server-time/outcome plus existing envelope/audit. Payment/invoice never gate this normal flow.

# Consequences and validation

Additive migrations0009/0010 preserve prior8 raw checksums and owner boundaries; constrained package/source history and active Unit membership prevent double packing/posting. Operational optional/deferred data stays outside the core workflow. Fresh107 unit/173 real PostgreSQL tests and final independent engineering/security review pass; see actual [delivery evidence](../../12-implementation-planning/SLICE_STOCK_SHIPMENT_IMPLEMENTATION_STATUS.md). Scope and factory policy come from the Owner; this ADR does not invent them.
