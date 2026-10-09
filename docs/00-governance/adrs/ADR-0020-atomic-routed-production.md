---
id: ADR-0020
title: Atomic routed production and classified material accounting
status: accepted
date: 2026-10-09
owners: [chief-solution-architect]
decision_authority: delegated engineering within APR-025 Owner policy
---

# Atomic routed production and classified material accounting

The [actual Owner decision](../approved-baselines/APR-025-production-scope.md) supplies bounded full/partial consumption, route-based WIP/final results, zero unexplained mass imbalance and authenticated Residual/Scrap disposition. This ADR selects the physical mechanism; it introduces no factory policy or new MVP scope.

## Decision

Production owns customer-demand-linked orders, versioned routes, operations, material allocations, real ProductBatch identities and immutable source facts. Sales supplies confirmed MAKE demand and records its released Production reference through a private instance/transaction/actor/request admission. Merely confirming Sales demand does not start Production. Revision replaces an unreleased route with fresh operation IDs and retains immutable historical snapshots; release pins it. Runtime skip/reorder/rework is unavailable.

Inventory's public production port serializes issue and completion; Production cannot write its private tables. Issue records physical allocation and Unit lifecycle, without quantity movement. The original source remains issued/restricted when only partly consumed. Own WIP remains issued and unavailable to Sales/shipment until the approved final route operation. Finalization of intact existing own WIP changes lifecycle only, with a FINALIZED source fact and no second quantity post.

At CompleteProductionOperation, IPS posts negative **full actual consumed input** and positive newly created final/WIP/Residual. Consumed input exactly equals these results plus classified Scrap. Consequently Scrap is already contained once in the consumed-input stock-out. Its immutable source fact explains the net stock loss; adding another negative Scrap movement would double-subtract. Canonical PostScrapMovement denotes this nested accounting responsibility for the completed operation, not a separately exposed command or additional row. A later NEW Scrap/abort/correction capability needs its own approved contract. Scrap creates no saleable Unit. There is no process loss or automatic balancing.

A real ProductBatch UUID identifies each operation's generated result batch and is distinct from its Unit UUIDs, receipt Material Lots and source facts. Production-derived origins bind customer/order/operation/batch/Unit/source fact/IPS effect, with deferred FKs and immutable history. Original Coil ancestry is never manufactured for standalone Sheets.

Exact bounded arithmetic validates overall balance and the feasible capacity of declared input-to-output lineage, deducting source-specific dispositions before sharing parent capacities. It validates possible exact accounting; it does not invent or persist measured per-parent contribution weights. The recorded whole-kg Coil-to-Sheet measurement restriction is checked against actual source kind; storage's 18-decimal capacity does not invent broader physical precision.

A leftover-completing individual needs current ACT-OP plus explicit same-account/customer ACT-PLAN productionDisposition permission, default false. No named person, role invention, caller approval field or second-person chain. Recheck current grants after locks and before completion. No leftover requires no meaningless classification.

One PostgreSQL transaction commits Production state/source/batch, Inventory identity/issue/lifecycle, IPS Ledger/Balance, audit and durable accepted/rejected envelope outcome. Locks order Sales demand, Production order and sorted Inventory resources; different-key domain guards prevent a second completion. Technical failure rolls back all tentative owner work; uncertain COMMIT requires the same bound key. Entry/Referral/declarations never post quantity. Public responses omit internal Sales bindings.

## Consequences and evidence

No new dependencies, broker, distributed transaction, event sourcing or browser workflow. Original ten migration bytes and frozen stack remain unchanged; four additive migrations implement these owner constraints. Unrelated OQ-003/OQ-009 branches stay open. Genealogy projection is subsequent, reconstructing these immutable sources.

Executed acceptance and review evidence belongs in [SLICE_MAKE_IMPLEMENTATION_STATUS](../../12-implementation-planning/SLICE_MAKE_IMPLEMENTATION_STATUS.md). This engineering ADR does not fabricate Owner approval or authorize the next slice.