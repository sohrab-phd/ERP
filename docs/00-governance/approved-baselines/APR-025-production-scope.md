---
id: APR-025
title: SLICE-MAKE production scope
status: approved
approval: Project Owner explicit accepted pushed shipment confirmation and SLICE-MAKE continuation
last_reviewed: 2026-10-09
---

# Production implementation authority

The Project Owner explicitly confirms commit `40630e02acb24091e306816647cfbfc2d97dda28` accepted/pushed and instructs autonomous continuation with `SLICE-MAKE`, preserving production, inventory and genealogy invariants. This is the actual scope authority, also within APR-019 standing approved-backlog delegation. No agent-generated signature or business answer is implied.

Working implementation baseline: that accepted shipment commit. Architecture baseline APR-018 / `e80a04b15ddf93451cc79ccf81722f564912596d` remains unchanged. Gate/local ignored unlock reference this scope record. Production owns its lifecycle and source facts; Inventory Posting Service remains the sole stock writer; Sales demand and all other owner boundaries remain intact.

Follow the [bounded execution plan and DoD](../../12-implementation-planning/SLICE_MAKE_PLAN.md). The Owner production decision below resolves the bounded consumption, result, mass-balance and disposition prerequisites of OQ-003/OQ-009. Unrelated branches remain open. The settled ACT-PLAN/ACT-OP permissions and user assignment configuration are not reopened. Scope permission is not evidence of a manager's reuse decision or an approval of invented mass-balance tolerance.

No QC, unrelated workflows, speculative features, warehouse FACT-03/C-07 conversion, new infrastructure, remote push or history rewrite. After full tests, independent engineering/security reviews, documentation and accepted local commit, stop for Owner review/push before the next major slice.

## Owner production decision — 2026-10-09

Owner explicitly unblocks bounded SLICE-MAKE. Consumption occurs only in CompleteProductionOperation; full or partial actual kg is supported. Unconsumed quantity remains on the original Unit under its physical/allocation/reservation restrictions, never automatically Residual/Scrap or saleable. Entry/Referral/Station declarations/login do not post; not every Station activity moves stock; Sales registration does not automatically start/create production.

WIP requires more processing on the immutable approved per-order route and is not saleable/shippable. Final output has completed its required route processing and enters only its valid lifecycle after authorized completion, without automatic reservation/shipment. No fixed ten-step route. Preserve source/result lineage.

First bounded MVP mass balance has ZERO tolerance for unexplained imbalance: consumed input kg = final output kg + NEW WIP kg + Residual kg + Scrap kg. Exclude unconsumed source and existing WIP; exact accepted arithmetic, no rounding, borrowed OQ-006 tolerance, process loss or balancing adjustment. Reject unbalanced posting; measured/expected difference remains evidence, never automatic disposition. Changes require actual factory evidence and Owner decision.

Residual is reusable, Scrap non-reusable; no numeric classifier. Required dispositions are made by an authenticated individual with explicit production-management disposition authority, recording classification/kg/source/operation/actor/system time and applicable order relation. No hard-coded employee/new organizational role, manager-name/checkbox/actor-ID assertion or second-person chain. No leftover means no meaningless manager classification. Unconsumed original material is distinct. The smallest explicit permission distinction may extend existing grants.

All applicable completion state, immutable Consumption/Output/Residual/Scrap source facts, Unit transitions, sole IPS Ledger/Balance, audit and durable outcome commit atomically through public owner ports. No fake receipt origins or Coil ancestry. Genealogy projection is later. QC, standalone opened-Coil remainder warehouse conversion, scheduling optimization, browser UI and unsupported correction/rework stay excluded.

This resolves ONLY the affected consumption/WIP/mass-balance/authenticated-disposition branches of OQ-003/OQ-009. Unrelated routing skip/reorder, post-post correction, coding and warehouse-conversion questions remain open; both OQs remain treating overall.
