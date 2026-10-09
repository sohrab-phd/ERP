---
id: IMPL-STOCK-SHIPMENT-001
title: SLICE-STOCK shipment implementation status
status: accepted
last_reviewed: 2026-10-09
---

# Normal reserved-stock shipment

Accepted/pushed baseline807ab190d49ebb3bd4e3419e09c28de4bc656faf; [actual Owner policy/scope](../00-governance/approved-baselines/APR-024-shipment-increment-scope.md), [plan/DoD](SLICE_STOCK_SHIPMENT_PLAN.md), [ADR-0019](../00-governance/adrs/ADR-0019-normal-stock-dispatch.md). Engineering acceptance follows the executed checks and independent closure below. The resulting local implementation commit is reported at delivery, avoiding a self-referential commit hash. Stop for Owner review/push.

## Implemented workflow and interfaces

Personal ACT-SHIP requires an exact current customer grant. POST /shipping/commands uses the version1 envelope and empty preconditions; Bearer plus exactly one x-customer-id UUID, no x-erp-role/browser Origin. Existing4096-byte bounded duplicate-safe input,16 active handlers, safe errors/timeouts/no-store/nosniff apply. Unknown catalogue fields fail admission (HTTP400 invariant/403 actor), durable business rejection422, conflict409, uncertain/technical503. Caller may retry an uncertain command only with the exact same bound key.

| Command | Target | Payload | State/result |
| --- | --- | --- | --- |
| DraftPackage | package UUID | {orderId,reservationIds} | DRAFT immutable complete claimed Units;1–32 distinct reservation IDs |
| PackPackage | package UUID | {} | DRAFT→PACKED; Inventory RESERVED→PACKED, no quantity effect |
| UnpackPackage | package UUID | {} | PACKED→UNPACKED; Inventory PACKED→RESERVED, same ACTIVE claim; assigned/dispatched package cannot unpack |
| DraftShipment | shipment UUID | {orderId} | DRAFT for one confirmed order/customer |
| AssignPackageToShipment | package UUID | {shipmentId} | PACKED→ASSIGNED_TO_SHIPMENT for matching DRAFT shipment; PackageAssigned event |
| MarkShipmentReady | shipment UUID | {} | DRAFT→READY after contents and remaining-demand/partial-line checks |
| StartLoading | shipment UUID | {} | READY→LOADING, no stock post |
| DispatchShipment | shipment UUID | {} | LOADING→DISPATCHED with the whole atomic IPS bundle |

GET /shipping/packages/{UUID} and /shipping/shipments/{UUID} use current customer-scoped ACT-SHIP; foreign objects return no record, no bindings/orderBinding exposed. Shipment contents derive from assigned packages; immutable dispatch entries persist on posting. Each shipment permits1–32 packages and at most32 distinct full Units. Multiple DRAFT package intents may refer to a claim, but only one PACKED/assigned package owns its Unit. UNPACKED is retained evidence; repacking uses a new document, not history mutation.

All Units must be ACTIVE-reserved to that confirmed order/item/customer with claim kg equal to complete Ledger onHand and reserved totals, matching Balance. A partially claimed larger Unit cannot be split or silently enlarged for dispatch. Sum previously dispatched plus proposed kg cannot exceed demand; a line without partial permission must meet its remaining valid amount exactly before READY and again at dispatch. Invalid READY remains DRAFT so missing complete Units can be attached. Zero tolerance; no business override, automatic expiration or stealing.

## Atomic ownership, evidence and replay

Shipping owns Package/Shipment/source dispatch facts. Inventory owns packing state and intent/claim consumption; IPS alone appends the reserved decrease and stock exit, projects Balance and sets SHIPPED with zero remaining onHand. Separate stable effect IDs bind Shipment/Unit/consumption-versus-exit, not a new command key. The original branded actor/request/transaction/member effect must match private instance-local dispatch admission; direct IPS calls cannot use this visibility exception.

Lock hierarchy: authenticated Identity resources; confirmed Sales order; full sorted Shipping documents; sorted reservation intents; complete numerically sorted IPS Unit/claim/effect union and Unit row locks. Post-lock owner/permission checks use fresh READ COMMITTED snapshots. Same PostgreSQL client/transaction covers all states, source facts, both Ledger effects, projections, original audit and durable outcome. Envelope savepoint removes tentative business work on rejection; technical failures abort the entire bundle. Lost COMMIT reply resolves by same-key outcome on the primary.

Accepted and rejected first outcomes replay immutably; key command/target/material/principal binding remains foundation-defined. New-key identical existing document/transition returns DUP, changed identity binding CONFLICT; current customer/action authorization precedes disclosure. Binding snapshots never leave accepted public data or query replies.

Inventory reservation_request now retains ACTIVE→CONSUMED with dispatch ID, server timestamp and FK-bound immutable RELEASE/STOCK_OUT Ledger evidence matching claim/Unit/order/kg. Earlier confirmed demand coverage counts matching ACTIVE claims plus verified CONSUMED outbound allocation; dispatch cannot resurrect already covered demand. Aggregate intent still includes consumed quantities, preventing over-requesting the same line. This is outbound allocation evidence, not a second fulfillment ledger. Sales remains CONFIRMED; delivery and Sales fulfillment/closure commands are not implemented here.

Durable dispatch evidence includes Shipment/order reference, Unit/claim/item/kg, original authenticated issuer/person subject, server timestamp and ACCEPTED posting outcome. Current order UUID is the existing order reference; unresolved external Order Code mapping is not fabricated. AUD-CMD-ACCEPTED/REJECTED/REPLAYED semantics remain unchanged. No invoice/payment/balance/credit/cheque gate, named employee, QC, carrier/driver/vehicle/signature/transport number or proof-of-delivery requirement.

## Files and persistence

- Shipping modules/shipping/{contracts,shipping-service,index}; shipping-store adapter; shipping-http transport, composition wiring.
- Inventory shipping.ts owner port, narrow IPS effect visibility and consumed intent/coverage adapter.
- Sales confirmed shipping-demand read port includes existing partial-line permission, no shipping write access to Sales tables.
- New0009_inventory_dispatch.sql extends consumed-intent evidence;0010_stock_shipment.sql owns shipping.package/package_content/shipment/dispatch, immutable bindings/state guards, active content uniqueness and dispatch history. Prior8 migration bytes are unchanged.
- Runtime USAGE shipping; SELECT/INSERT/UPDATE package/package_content/shipment; SELECT/INSERT dispatch; no history DELETE/TRUNCATE/DDL. Isolated test grants/reset and frozen migration inventory include these objects. Root test runners require new tests; no dependency/version or package-script change.

## Validation and reviews

Fresh pinned Windows npm run verify PASS:107 unit +173 real PostgreSQL integration tests, zero failures/cancellations/skips. Nine new Shipping units and26 new PG/API scenarios; full earlier-slice regression retained. Format, ESLint zero warnings, module/SQL ownership95 TypeScript files, typecheck/emitted build, separate npm run build and runtime preflight PASS. Node24.21.0/npm11.19.0/TypeScript6.0.3/direct pg8.23.1/PostgreSQL18.6 (180006)/UTF8; isolated disposable test DB distinct from dev, separate restricted non-super/non-createDB/non-createRole runtime and DDL owner.

Actual PG proof includes complete-Unit dispatch/evidence, partial-line/remaining-demand guard before READY and again at posting, active package uniqueness, assignment/dispatch races, three deterministic real resource-contention barriers versus reservation activation, current-role/customer/IDOR and forged-context denial, direct IPS bypass denial, accepted/rejected replay, valid conflicting key reuse, consumed demand coverage, audit failure and uncertain COMMIT retry. Five failure windows at claim-release Ledger, stock-out Ledger, intent consumption, Shipment transition and dispatch evidence each roll back facts/states/projections/audit/outcome and admit the original same-key retry. Immutable SQL evidence, runtime history/DDL denial, migration install/replay/dry-run/checksum/concurrent-run/failure-window proof all pass.

The first full PG run exposed an existing Inventory test assuming chronological UUID order when millisecond audit timestamps tie. Corrected the test to prove exactly one accepted/rejected/replayed family with the original execution/key binding; no audit production change. Fresh full verification passed after this correction. A paused local PG process was restarted before the final run; no production data or OS service/ACL was changed.

Prior8 raw migration bytes unchanged;15 package.json script definitions, dependency manifests/lock and tool pins unchanged. New raw UTF8/LF SHA-256:

- 0009_inventory_dispatch.sql: 2402474a45f82817181dab62738d338c16728a9e5e3f50ec47cb837c4cc4507a
- 0010_stock_shipment.sql: b185d5d1c291c2ed102f28e29591217e2134ed698191da89b13313eccc56e754

[Independent engineering/domain/database/API/test and security closure](SLICE_STOCK_SHIPMENT_REVIEW.md): PASS for final source, no required/blocking or known high/critical findings; reviewers did not author implementation or claim live DB execution. Root executed PG proof separately. Fresh npm audit metadata upload was denied by automatic tool review and was not retried/bypassed. Unchanged dependencies retain the actual2026-10-08 audit of118 entries/zero known vulnerabilities as historical evidence only, not a fresh shipment advisory check.

Offline local Graphify0.9.79 refreshed441 tracked files/3922nodes/7678edges; dependency query maps DispatchShipment/Inventory owner/IPS/tests. Source remains authority; graph/runtime/test/credential/unlock artifacts remain ignored and uncommitted. Repository local-reference/JSON, gate/unlock APR-024, working/staged diff and raw migration-byte checks pass; no remote push, Linux, dependency upgrade, native containment or next slice.

Executed: npm run format; npm run verify; npm run build; npm run db:test:reset against the acknowledged isolated test DB; targeted node --test --test-concurrency=1 Shipping/HTTP/boundary files during correction; local graph build/query; Git/reference/JSON/pin/hash checks. Final full verification is the acceptance run. The current host exposes personal Identity plus receipt, Sales-demand/reservation and normal Shipping APIs; no frontend is delivered.

Deferred: physical splitting, exceptional shipment, customer delivery/fulfillment recording, Sales closure/cancellation, returns/corrections, carrier/transport metadata, financial workflows and frontend UI. Next backlog capability is SLICE-MAKE production/genealogy source facts, subject to its actual business prerequisites; it is not started by this shipment delivery.
