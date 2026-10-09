---
id: PLAN-MAKE-001
title: SLICE-MAKE bounded execution plan
status: accepted
last_reviewed: 2026-10-09
---

# SLICE-MAKE execution plan

Authority: [APR-025](../00-governance/approved-baselines/APR-025-production-scope.md), Owner-confirmed accepted/pushed shipment baseline `40630e02acb24091e306816647cfbfc2d97dda28`. The architecture baseline APR-018 is unchanged. Production is authorized; the business answers below are not supplied by implementation permission. This plan defines scope/DoD; implemented behavior and executed engineering acceptance are recorded in the linked implementation status. It does not invent Owner approval of the delivery.

## Goal, users and dependencies

Deliver customer-demand-linked production: an individually authenticated planner defines the order-specific Station route and allocation; individually authenticated operators record operation activity; an authorized completion commits consumption and results once. Production/Workshop Manager reusability decisions remain attributable to the real deciding individual. ACT-PLAN/ACT-OP command permissions already exist; actual named-person assignment is configuration, not a new blocker or hard-coded employee.

Depends on accepted Envelope, Identity/RBAC, IPS, intake and Sales demand. Allocation is not Sales reservation. Production owns orders, routes, operations, allocation, Consumption, Output, Residual and Scrap source facts. Inventory owns Unit identities/lifecycle and its sole Posting Service owns Ledger/Balance. Sales owns demand and MAKE fulfillment references. Genealogy projection is the next capability, not the source truth written here.

## Binding sources and exclusions

- [Backlog section 6](IMPLEMENTATION_BACKLOG.md#6-slice-make--production-and-genealogy-source-facts) and [SLICE homes](../00-governance/registers/SLICE_HOMES.md).
- [Current factory evidence](../00-governance/registers/OPEN_QUESTIONS.md#production-facts-and-the-posting-boundary-factory-evidence-2026-09-30), OQ-003/OQ-009 and the per-order routing clarification take precedence over historical shared-Station-account and numeric residual-cutoff proposals.
- [DATA-TX-001](../04-database-architecture/TRANSACTION_AND_IDEMPOTENCY.md), [state transitions](../03-state-machines-invariants/TRANSITION_TABLES.md), [module ownership](../02-domain-business-architecture/MODULE_OWNERSHIP_MATRIX.md) and [Genealogy source/projection contract](../04-database-architecture/GENEALOGY_PROJECTION.md).

Ten recorded Stations are the available factory vocabulary, not a mandatory ten-step sequence. Entry/Referral and an operator's Station completion declaration are separate from official Start/Complete and cannot post stock by themselves. Sales registration cannot automatically create/start production.

Exclude QC, new business roles, shared accounts, process-loss defaults, numeric reuse classification, warehouse conversion of an already opened Coil remainder into Sheets (FACT-03/C-07), scheduling optimization, speculative routing engines, barcode/physical-code schemes, genealogy projection/UI, finance, procurement and browser UI. Post-post correction/rework/abort requires its accepted compensation policy; do not invent it. No new dependencies or infrastructure.

## Owner production decision — 2026-10-09

Owner explicitly unblocks bounded SLICE-MAKE. Consumption occurs only in CompleteProductionOperation; full or partial actual kg is supported. Unconsumed quantity remains on the original Unit under its physical/allocation/reservation restrictions, never automatically Residual/Scrap or saleable. Entry/Referral/Station declarations/login do not post; not every Station activity moves stock; Sales registration does not automatically start/create production.

WIP requires more processing on the immutable approved per-order route and is not saleable/shippable. Final output has completed its required route processing and enters only its valid lifecycle after authorized completion, without automatic reservation/shipment. No fixed ten-step route. Preserve source/result lineage.

First bounded MVP mass balance has ZERO tolerance for unexplained imbalance: consumed input kg = final output kg + NEW WIP kg + Residual kg + Scrap kg. Exclude unconsumed source and existing WIP; exact accepted arithmetic, no rounding, borrowed OQ-006 tolerance, process loss or balancing adjustment. Reject unbalanced posting; measured/expected difference remains evidence, never automatic disposition. Changes require actual factory evidence and Owner decision.

Residual is reusable, Scrap non-reusable; no numeric classifier. Required dispositions are made by an authenticated individual with explicit production-management disposition authority, recording classification/kg/source/operation/actor/system time and applicable order relation. No hard-coded employee/new organizational role, manager-name/checkbox/actor-ID assertion or second-person chain. No leftover means no meaningless manager classification. Unconsumed original material is distinct. The smallest explicit permission distinction may extend existing grants.

All applicable completion state, immutable Consumption/Output/Residual/Scrap source facts, Unit transitions, sole IPS Ledger/Balance, audit and durable outcome commit atomically through public owner ports. No fake receipt origins or Coil ancestry. Genealogy projection is later. QC, standalone opened-Coil remainder warehouse conversion, scheduling optimization, browser UI and unsupported correction/rework stay excluded.

This resolves ONLY the affected consumption/WIP/mass-balance/authenticated-disposition branches of OQ-003/OQ-009. Unrelated routing skip/reorder, post-post correction, coding and warehouse-conversion questions remain open; both OQs remain treating overall.

## Binding minimal technical design

1. **Route:** store an immutable per-order route snapshot/version. Draft revisions create new snapshots; release pins one. Preserve Station identities/order and actual actor/time for Entry, Referral and completion declarations. The approved route can omit unused Stations before release. Omission is not permission to skip an already released required operation. Runtime skip/reorder and post-post compensation require their affected policy. Pause/cancel are deferred from this first bounded workflow; this is not a claim that every pause requires a new Owner decision.
2. **Production model:** bounded `production` module with public contracts/index and service, owning PostgreSQL adapter, HTTP adapter composed only by the host. Tables for order, route snapshot/steps, operation, allocation and immutable Consumption/Output/Residual/Scrap facts. Source facts link operation, order, parent Unit and derived Unit identities, actor/time and original command identity. Do not fabricate Coil ancestry or tiny-piece Units. Internal UUIDs are not a claimed physical Order Code/Sheet Code scheme.
3. **Owner ports:** Sales supplies customer-scoped confirmed demand and records MAKE selection/start references. Inventory supplies availability, serialized issue/lifecycle and completion posting through its public owner port. Production cannot import private adapters or write stock SQL. Derived output identities must use actual Consumption/Output lineage, not fake procurement receipt origins. No client-supplied trusted posting capability.
4. **Locks:** one transaction/client; deterministic order across affected Sales demand, Production order/operation/allocation and sorted Inventory resource IDs. Recheck current authorization, route/state, source ownership, remaining demand/material and kg after locks. Domain uniqueness/resource locking supplements the envelope key lock; a different key must not double-consume a Unit or complete an operation twice.
5. **Atomic completion:** Production operation state and all Consumption/Output/Residual/Scrap source facts, Inventory Unit changes, nested IPS Ledger effects, Balance projection, original audit and durable outcome commit together. Reusable child stock becomes AVAILABLE only on a valid commit. Scrap is not available; placement/scrap destiny is not a second quantity post. Result classification and remaining-parent behavior follow the Owner decision above.
6. **Command binding:** retain ADR-0011 principal/command/target/material/precondition binding and durable accepted/rejected replay. Same key replays the first result. DATA-TX-001 explicitly makes a new key completing the same operation GUARD_CONFLICT. Unknown required policy is GUARD_OPEN_POLICY; a database/network failure is not a durable business rejection. After uncertain COMMIT retry the same key. New compensating facts preserve original source/audit history.
7. **Persistence/security:** additive SQL migrations, strict constraints and non-superuser runtime grants; immutable source facts and Ledger. Preserve the ten accepted migration byte checksums. Current principal/customer access enforced at command and query boundaries and after lock waits. Measured kg remains authoritative with exact accepted numeric representation; count/dimensions are descriptive. Apply the recorded 0-decimal/1-kg factory measurement rule where that workflow applies; the IPS numeric capacity does not invent physical precision. Do not silently generalize that workflow restriction to still-undefined production branches or turn this applicability check into a new precision-policy question. Bounded payloads, parameterized SQL, safe errors/logs and explicit owner permissions; no secrets or external review uploads.

### Intended physical scope

Extend `apps/backend/src/modules/production/{index,contracts,production-service}.ts`; host-owned `infrastructure/postgresql/production-store.ts`, `inventory-production-store.ts` and `transport/production-http.ts`. Existing Inventory and Sales public contracts/services/adapters may receive the narrowly required owner ports; composition-root and boundary checks must enforce those ports.

Add migrations `0011_inventory_production.sql`, `0012_production_sources.sql`, `0013_sales_make.sql` and `0014_identity_production_disposition.sql` only once the answered contract is reflected in constraints. Tests live in existing backend unit/integration directories as `production*.test.ts`, with `support/production-harness.ts` and `support/production-crash.ts`. No new workspace or framework. Existing root scripts and exact Node24.21.0/npm11.19.0/TypeScript6.0.3/pg8.23.1/PostgreSQL18.6 pins remain unchanged.

## Required acceptance evidence / Definition of Done

- One real authorized factory workflow reaches a correct posted result; not an all-rejected demonstration. Per-order route reproducible; no implicit skip; individual attribution and Entry/Referral separated from posting.
- Correct current ACT-PLAN/ACT-OP authorization and customer/resource isolation; revoked/foreign actor denied without disclosure; no forged manager decision, bypass of owner ports or direct stock writes.
- Allocation distinct from reservation; issued/consumed material cannot be reserved/shipped/issued again. Inventory remains nonnegative, kg exact, immutable Ledger agrees with rebuildable Balance.
- Every case in the final Owner-approved first workflow conserves quantities: test the included full/partial consumption, output/WIP and leftover branches. The Owner approves the complete full/partial, WIP/final and applicable leftover branches; none may be silently narrowed. For included leftovers prove one classification, residual lineage/availability and scrap nonavailability. No fake receipt/Coil ancestry, second residual/scrap quantity or automatic loss.
- Native Windows real PostgreSQL tests for concurrent issue/reservation/shipment, simultaneous completion with same/different keys/principals, overlapping inputs, lifecycle conflicts, uniqueness and lock ordering.
- Durable accepted/rejected replay, changed payload/target/principal conflict, new-key repeated completion conflict, failure after every tentative owner write, audit failure and lost-response/crash/uncertain-COMMIT retry prove the complete bundle commits once or none.
- Additive migration install/replay/checksum/constraints/runtime-privilege tests and old accepted receipt/reservation/shipment regressions. Source-lineage tests support the later independent genealogy rebuild; no claim that a projection already exists.
- Relevant root preflight, format, lint, boundaries, typecheck/build, unit and real PostgreSQL integration checks pass without unjustified skips. Independent engineering/database/API/test and security review required findings closed; actual delivery documentation updated; final diff/git diff --check reviewed; coherent local commit; stop for Owner review/push.

## Previous preparation evidence (historical)

Source and local Graphify impact assessment completed at the accepted shipment baseline (441 files, 3922 nodes, 7678 edges; offline, structural). No product edits, dependency changes, production migrations or database changes made. Technical plan and scope record are prepared. At that historical preparation point implementation awaited actual business answers. APR-025 now supplies them; delivered code/evidence is recorded in SLICE_MAKE_IMPLEMENTATION_STATUS.md. Prior slices remain intact.

Preparation validation: pinned Windows runtime/dependency preflight PASS; 13 tracked JSON files parse; 9 local references in the new documents resolve; all 10 accepted migration bytes match HEAD; no product changes; gate/local unlock and APR-025 baseline agree; git diff --check PASS. These are preparation checks, not production acceptance tests.

Independent read-only preparation review by shipment_final_engineering: PASS after required conditional-DoD/leftover-scope corrections and measurement/deferred-command clarifications. No required planning findings remain. No database or external-network actions were used for this review. SLICE-MAKE engineering/security acceptance and production tests are pending actual implementation; no new local delivery commit is ready.

## Current execution

Owner prerequisites supplied; implement the complete approved full/partial, WIP/final and authorized leftover workflow. No silent narrowing. Existing-WIP finalization may change lifecycle without being newly produced kg or a second quantity post; only the final required route completion permits it. An explicitly disposition-authorized completing individual can record their own decision in the atomic completion; no separate approval chain.

Current implementation and executed acceptance evidence: [SLICE_MAKE_IMPLEMENTATION_STATUS.md](SLICE_MAKE_IMPLEMENTATION_STATUS.md). This plan is the bounded design/DoD, not a duplicate implementation report.
