---
id: IMPL-MAKE-001
title: SLICE-MAKE implementation status
status: accepted
last_reviewed: 2026-10-09
---

# Customer-demand-linked production

Working baseline: Owner-confirmed accepted/pushed shipment `40630e02acb24091e306816647cfbfc2d97dda28`. [APR-025](../00-governance/approved-baselines/APR-025-production-scope.md) records actual scope and business policies; [plan/DoD](SLICE_MAKE_PLAN.md) and [ADR-0020](../00-governance/adrs/ADR-0020-atomic-routed-production.md) bind this bounded delivery. Final acceptance evidence is recorded below after execution. The resulting local commit is reported at delivery to avoid a self-referential hash; stop for Owner review/push.

## Workflow and interfaces

Sales may explicitly record a MAKE fulfillment assessment and confirm customer demand without selecting finished stock. It neither allocates nor creates Production automatically. A current customer-scoped ACT-PLAN drafts a Production Order for a confirmed MAKE Sales item, plans its actual ordered Station route, releases it and records the immutable MAKE reference in Sales. Separate commands plan kg allocation, assign eligible unreserved Units, issue material, or release unissued allocation. Issue changes identity/allocation restrictions, not Ledger quantity. Multiple intents cannot physically issue the same source to two orders.

ACT-OP starts order/operation activity and records Entry or Station completion declarations. ACT-PLAN records Referral to the next actual route operation, including after official completion while the order remains live. These events have actor/system-time evidence, but do not consume or produce stock. Released required operations cannot be silently skipped. Not every Station activity requires material movement: an all-empty completion may finish a nonposting operation.

POST /production/commands uses the existing version 1 envelope, empty preconditions, current individual Bearer session and exactly one x-customer-id UUID. No x-erp-role or browser Origin; duplicate-safe 4096-byte body, 16 active handlers, safe responses/no-store/nosniff and existing transaction timeouts. Unknown fields/contracts deny admission. GET /production/orders/{UUID}, /operations/{UUID}, /allocations/{UUID} requires current ACT-PLAN or ACT-OP for the exact customer; foreign records are absent. Internal Sales orderBinding never appears in outcomes, replay or query results.

| Commands | Target / payload | Authority / outcome |
| --- | --- | --- |
| DraftProductionOrder | production-order / {salesOrderId,itemId} | ACT-PLAN; DRAFT from confirmed MAKE demand |
| PlanProductionOrder | production-order / {route:[{id,station}]} | ACT-PLAN; DRAFT/PLANNED→PLANNED, new immutable version/fresh operation IDs |
| ReleaseProductionOrder | production-order / {} | ACT-PLAN; PLANNED→RELEASED and private Sales MAKE reference |
| StartProductionOrder | production-order / {} | ACT-OP; RELEASED→IN_PROGRESS |
| PlanMaterialAllocation | material-allocation / {productionOrderId,kg} | ACT-PLAN; PLANNED intent, distinct from Sales reservation |
| AssignMaterialAllocation | material-allocation / {unitId} | ACT-PLAN; PLANNED→ASSIGNED, eligible stock and own planned kg |
| IssueAllocatedMaterial | material-allocation / {} | ACT-PLAN commands Inventory issue; ASSIGNED→ISSUED without qty post |
| ReleaseMaterialAllocation | material-allocation / {} | ACT-PLAN; unissued PLANNED/ASSIGNED→RELEASED |
| StartProductionOperation | production-operation / {} | ACT-OP; PLANNED→IN_PROGRESS after prior required operations |
| RecordStationEntry / DeclareStationCompletion | production-operation / {} | ACT-OP; immutable ENTRY/DECLARATION, no stock/state completion |
| RecordStationReferral | production-operation / {nextOperationId} | ACT-PLAN; immutable next-route REFERRAL, no qty |
| CompleteProductionOperation | production-operation / material arrays below | ACT-OP; atomic IN_PROGRESS→COMPLETED |
| CompleteOperationPartial | production-order / {} | ACT-OP; IN_PROGRESS→PARTIALLY_COMPLETED after some but not all operations, no qty |
| CompleteProductionOrder | production-order / {} | ACT-OP or ACT-PLAN; all current route operations completed |
| CloseProductionOrder | production-order / {} | ACT-PLAN; COMPLETED→CLOSED, no automatic Sales closure |

The route supports 1–16 steps selected from the ten recorded Station names; it is not a fixed ten-step route. Completion arrays are required and bounded: inputs[{unitId,kg}], outputs[{unitId,kg,kind,locationId,sourceUnitIds}], residuals[{unitId,kg,kind,locationId,sourceUnitId}], scraps[{kg,sourceUnitId}], finalizeUnitIds[]. Up to 32 inputs and32 derived output/Residual Units; finalization and source links also bounded 32, within the 4096-byte envelope. New result Unit IDs are caller-provided UUIDs checked for disjointness/uniqueness; real ProductBatch IDs and source-fact/effect identities are server-generated. Material kg is positive exact decimal text; canonical fact/batch normalization preserves original request fingerprint.

## Quantity, authorization and owner boundaries

Full/partial actual input consumption occurs only at completion. Cumulative consumption (previous plus new) cannot exceed the own issued allocation; new consumption cannot exceed current remaining Ledger quantity. Original unconsumed material stays on the same PARTIALLY_CONSUMED Unit with active issue restriction; it is neither generated Residual nor saleable stock. WIP output becomes ISSUED_TO_PRODUCTION for the same order/customer; final output and authorized reusable Residual enter AVAILABLE after commit, without auto-reserve/ship. At the last required operation intact existing own WIP may finalize without another quantity post. Consumed/finalized WIP cannot be finalized twice.

Exact consumed = new final + new WIP + Residual + Scrap; exclude unconsumed source/existing WIP. No operational rounding, process-loss/default balancing, unexplained tolerance or borrowed OQ-006 fulfillment tolerance. Coil-to-Sheet observed quantities follow the recorded whole-kg rule; no universal precision policy is invented. Bounded exact lineage-capacity proof rejects aggregate overclaim of a shared parent subset while permitting actual merges/splits.

Scrap is counted once within actual consumed input, with immutable classified source evidence; no available Scrap Unit or second stock-out. Residual has its own generated Unit/source link and positive stock-in once. Managerial disposition must be genuinely attributable to the completing individual with explicitly granted same-account/customer productionDisposition on ACT-PLAN plus ACT-OP completion capability. Default false; ACT-SEC manages the optional flag through existing grants/security audit. Revocation is effective for admission/replay and is rechecked after Inventory lock waits. No manager-name/checkbox/claimed actor, hard-coded employee, new role or second-person chain.

Production imports public owner interfaces only; Inventory alone owns issue/origin/Unit/lifecycle and IPS Ledger/Balance. Sales alone owns MAKE assessment/order/reference. Instance-private admissions bind exact actor, transaction, full request and batch/release; direct IPS or Sales startMake calls outside the active owner execution deny even for a current user. Ledger remains truth; Balance must agree, nonnegative and rebuildable.
## Persistence and recovery

Four additive SQL migrations preserve the accepted 0001–0010 raw checksums:

| Migration | Owner and material changes |
| --- | --- |
| 0011_inventory_production.sql | Inventory production issue/origin history, active-source issue uniqueness, immutable origin bindings and valid Unit transitions |
| 0012_production_sources.sql | Production orders, operations, allocations, immutable versioned route snapshots, ProductBatch and source facts; scoped FKs, explicit required/non-null JSON bindings and legal initial/lifecycle states |
| 0013_sales_make.sql | Sales MAKE assessment/reference and demand lifecycle, preserving existing STOCK reservation/shipment behavior |
| 0014_identity_production_disposition.sql | Explicit ACT-PLAN disposition flag, default false; no new organizational role |

Host-owned PostgreSQL adapters compose module public ports on the same transaction/client. The runtime role has narrowly granted DML and no DDL/ownership authority. Immutable route/source/batch/origin history is enforced in PostgreSQL, including against permitted runtime SQL; database reset is limited to the acknowledged isolated test database. No fixture business users or factory catalogues are seeded into production.

Completion locks current demand/Production state and sorted Inventory resources, then verifies actual allocation, current stock/lifecycle, route, exact mass balance and current permissions. One commit contains source facts/batch, completed state, Unit/issue/origin changes, IPS effects/Balance, AUD-CMD-ACCEPTED and durable accepted outcome. Business guards use the existing rejected-outcome/audit contract; technical failures roll back all tentative effects and do not become durable business rejections. The same bound key recovers uncertain or lost-confirmed-COMMIT results; a new key cannot complete the same operation again. Replay uses current access and AUD-CMD-REPLAYED without repeating original effects.

The default unreconciled production recovery admission fence remains active in normal composition. Explicit recovery acknowledgement follows the existing foundation procedure; it is not removed to make tests pass. Tests separately prove both denial under that default and successful authorized work under the reconciled test composition.

## Acceptance proof map

Tests exercise actual PostgreSQL 18.6 on Windows with separate disposable test/developer databases and restricted owner/runtime roles. Required scenarios live in the existing backend test directories:

| Test source | Observable proof |
| --- | --- |
| unit/inventory-production.test.ts, unit/production.test.ts, unit/sales.test.ts | Bounded contracts, owner admissions, exact arithmetic, route/state and material rules |
| integration/production.test.ts | Full/partial consumption, original remainder, WIP/final output, classified Residual/Scrap, no-leftover completion, durable accepted/rejected replay and new-key conflict, actual Coil-to-Sheet precision, normalized facts, route revision and nonposting activity |
| integration/production-allocation.test.ts | 70 kg authorized allocation against a physically issued 110 kg Unit; reject 71 and cumulative extra consumption, restrict original remainder/WIP from STOCK selection, accept own WIP processing |
| integration/production-concurrency.test.ts | Same/different key and principal races, overlapping source issue, reservation/shipment competition, post-lock disposition revocation, intact WIP finalization and aggregate lineage capacity; deterministic database blocking graph before competing release |
| integration/production-integrity.test.ts | Required/missing/null bindings, invalid initial states, scoped FKs, immutable routes/facts/batches, runtime privilege and history enforcement |
| integration/production-recovery.test.ts | Nine injected real database failure points, dropped confirmed COMMIT reply, actual known Windows child crashes at handler/audit/outcome/commit windows, all-or-none bundle, same-key recovery, default recovery fence |
| integration/production-security.test.ts, integration/identity.test.ts | Genuine current account/session/grants, copied/fabricated context denial, private owner bypass denial, foreign-customer access/replay, current managerial revocation, HTTP IDOR/role/Origin/size/duplicate-field rejection, internal Sales binding minimization and disposition grant administration |

No dependency or lockfile changes. No external source or metadata audit was performed or claimed; mandatory security evidence is local independent source review plus executed negative PostgreSQL/HTTP tests. Browser, file-upload and outbound-service risks are inapplicable to this backend-only slice, which introduces none of those surfaces.

## Implemented limits and deferred work

Material `kind` is bounded descriptive metadata, not an authorization or automatic classifier. No accepted fixed catalogue or mandatory output-kind-to-Sales-type equality is invented; OQ-004 catalogue population remains a later operational input. Server-derived disposition, immutable route and Unit lifecycle determine stock eligibility. A descriptive label cannot grant Quality approval, Scrap availability, managerial authority or fulfillment.

Original partially consumed material remains physically restricted; closing an order does not automatically return it to saleable stock or label it Residual. Runtime route skip/reorder, post-post correction/rework/abort and standalone warehouse opened-Coil conversion remain outside this bounded increment and subject to their actual remaining policy. OQ-003/OQ-009 remain treating for these unrelated branches. There is no automatic Sales closure, output reservation/shipment, scheduling, QC, finance, logistics or browser UI.

Genealogy source facts and parent/result identities are implemented and reconstructable. Genealogy Link projection, trace queries and visualization are not delivered here. The subsequent approved backlog capability consumes these sources; no next major slice starts before Owner review/push of this delivery.

## Independent review and required-finding closure

Local specialist agents reviewed bounded surfaces independently of their own authored work:

| Reviewer | Independent review scope / conclusion |
| --- | --- |
| shipment_engineering_review | Inventory production/IPS and owning adapter, root Production persistence/lineage/composition/HTTP, concurrency/recovery/security proof; PASS. Excludes its authored Sales/Production service, initial SQL lifecycle guards, reset/count helpers and tests. |
| shipment_final_engineering | Root SQL required bindings/ProductBatch persistence, Identity disposition, HTTP/composition, grants/boundaries and lineage capacity; PASS. Excludes authored Inventory extension and Sales/Production fixes/units. Independently executed 512 capacity-oracle cases plus residual rerouting, PASS. |
| shipment_security_review | Local source/domain/API security review and negative-test evidence: private owner admissions, current scoped identity, disposition revocation, injection/validation, resource bounds, IDOR and response minimization; PASS. Excludes authored Identity code and security tests, independently reviewed by the other reviewers. No external transmission. |

Required fixes are closed: actual source kind controls applicable whole-kg checks, fact normalization preserves original fingerprints, private release/completion admissions prevent owner bypass, responses omit internal Sales bindings, allocation tests prove cumulative authorized kg independently of physical issue, and SQL missing/null identities cannot bypass legal-state constraints. Real lock-wait graphs prove the reservation/shipment races reach contention before release. Canonical Scrap wording now counts it once within full actual input consumption. Security review corrected cumulative-consumption documentation; no known critical/high or required finding remains.

The first full regression run exposed two stale assertions, not accepted defects: foreign replay expected the wrong denial-audit total, and an old receipt test expected the now-authorized Production command to be absent. Corrected assertions and the new allocation/recovery-fence probes passed the targeted 13-test PostgreSQL run. Final clean full-suite evidence is required below before acceptance; earlier failed runs are not reported as successful verification.

## Final executed acceptance — 2026-10-09

Windows pinned Node24.21.0/npm11.19.0/TypeScript6.0.3/pg8.23.1/PostgreSQL18.6. Commands actually executed: npm run db:test:reset; npm run format; npm run lint; npm run build; targeted node --test --test-concurrency=1; final npm run verify; local Graphify structural refresh/query; tracked JSON/local-reference/accepted-migration-byte checks; git diff --check and final diff review.

Final clean npm run verify: PASS. Runtime/package preflight, formatting, lint, module boundaries (113 source files), typecheck/build: PASS. Unit tests: 134 passed, zero failures/skips/cancellations. Real PostgreSQL integration tests: 203 passed, zero failures/skips/cancellations, including 26 Production scenarios and four Identity disposition regressions. The targeted correction run separately recorded 13/13 passing before this full run. Logs remain local ignored artifacts/tests/make-accepted-verify.log and make-corrected-targeted.log; they are not repository content or external audit submissions.

Independent engineering/database/API/test and local security review: PASS, all required findings closed with authored exclusions above. The independent lineage oracle passed 512 cases plus residual rerouting. No unresolved implementation defect or known high/critical security finding. Owner decisions are recorded by APR-025; ADR-0020 is accepted under delegated engineering authority within that policy, not a fabricated Owner signature.

Local Graphify0.9.79 structural impact refresh: 467 tracked files, 4228 nodes, 8776 edges; no network/source export, generated data ignored. Thirteen tracked JSON files parse; changed-document file references resolve; all ten prior migration bytes remain unchanged. Frozen dependencies/lockfile unchanged. Four additive migrations and actual restricted runtime/owner database tests pass. Canonical gate remains Owner-authorized true with APR-025 and matching local ignored unlock; architecture APR-018 remains unchanged.

Definition of Done: satisfied for the entire bounded full/partial, WIP/final, allocation/activity and authorized leftover workflow. Documentation reflects actual code, including residual restrictions and excluded future work. Create one coherent local delivery commit after final repository checks, report its hash, and stop for Owner review/push; no remote push or next major slice is authorized by this acceptance record.

## Committed progress at delivery

Implementation order: SLICE-ENVELOPE; Identity and authorization; SLICE-IPS; SLICE-PURCHASE receipt increment; SLICE-STOCK Sales demand increment; SLICE-STOCK reservation increment; SLICE-STOCK shipment increment; SLICE-MAKE. The eighth entry counts only with the resulting accepted local delivery commit, whose hash is reported to the Owner and recoverable from Git history.

Actual backend capability: personal identity/current scoped authorization; command/audit/idempotency foundation; sole IPS and receipt/stock reads; confirmed STOCK demand, reservation and whole-Unit shipment; customer-linked routed Production allocation/activity and atomic material completion with immutable reconstructable source facts. No browser UI or full Genealogy projection is claimed.

Next approved capability is Genealogy projection and trace, depending on these existing receipt, production and shipment source facts. Wait for Owner acceptance/push before starting it. Remaining major areas include purchasing coordination where its policy is supported, Finance-Lite, Weighbridge, visibility-only Portal/reporting, approved correction/restore/cutover and UI/cross-module integration/UAT. No artificial completion percentage.
