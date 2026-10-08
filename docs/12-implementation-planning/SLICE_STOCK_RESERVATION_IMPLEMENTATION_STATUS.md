---
id: IMPL-STOCK-RESERVATION-001
title: SLICE-STOCK reservation implementation status
status: accepted
last_reviewed: 2026-10-08
---

# Delivered reservation increment

Baseline accepted/pushed280aa8b4918e05cf091daff4b7b06306b6f7ebc6. Authority [APR-023](../00-governance/approved-baselines/APR-023-reservation-increment-scope.md); [ADR-0018](../00-governance/adrs/ADR-0018-inventory-reservation-activation.md); [plan/DoD](SLICE_STOCK_RESERVATION_PLAN.md). Implementation commit is reported in delivery, avoiding self-referential hash. Stop for Owner review/push.

## Operational behavior and contracts

An individually authenticated ACT-SALES requests reservation for a confirmed order item and one of that item's recorded selected Units. Version1 RequestReservation target reservation UUID, payload {orderId,itemId,unitId,kg}; empty preconditions. Whole positive kg below10^20, exact customer/item/type/Unit binding, aggregate requested+active kg <= confirmed item demand. Partial requests are allowed; they do not change shipment-partial policy. REQUESTED records no stock quantity/state change and does not occupy the unique ACTIVE slot.

ActivateReservation targets the existing reservation UUID, empty payload/preconditions. Current ACT-SALES exact customer or organizational ACT-WH acts. Inventory supplies a bound RESERVE effect to IPS: same request/claim/fact/effect UUID, order demand ID and exact kg. One ACTIVE per Unit even when kg remains. IPS alone appends reserved Ledger delta, reconstructs matching Balance, sets Unit RESERVED and creates the claim; onHand does not change. The intent advances ACTIVE in the same transaction/audit/outcome. Insufficient stock, an existing active claim or lost earlier-confirmed priority rejects without partial effects.

Earlier valid confirmed selected demand wins priority even if Request/Activate arrived later. Exact database microseconds precede a deterministic UUID timestamp-tie break. Actual ACTIVE coverage of an earlier line on other Units is counted; a fully covered item no longer blocks a free historical selection. REQUESTED is not coverage. Internal cross-customer candidate evidence never leaves a public API. No stealing, automatic reservation on confirmation or timer expiry.

Same-key accepted and rejected first outcomes replay. New-key identical immutable request/ACTIVE state rejects DUP; altered request identity rejects CONFLICT. Cross-principal same-key reuse conflicts; foreign missing resources are nondisclosing. Technical integrity/audit/connection errors are not cached as business rejection. Uncertain COMMIT retries the exact original key; ordinary durable business rejection requires new key for a fresh evaluation.

## HTTP and authorization

POST /reservations/commands exposes only RequestReservation/ActivateReservation. GET /reservations/{UUID} is ACT-SALES-only exact customer and omits internal binding/orderBinding. Personal Bearer token required. Default role ACT-SALES requires exactly one x-customer-id UUID matching a real grant. Optional x-erp-role may select ACT-WH for exact-target activation only, with no customer selector; unrelated roles, shared/forged contexts, revoked grants and browser Origin are denied. Warehouse action success/replay is not a commercial query grant.

Existing4096-byte duplicate-safe JSON, header/request timeouts,16 active handlers, safe nondisclosing errors and no-store/nosniff apply. Unscoped organizational Unit/Lot reads are denied once RESERVED; Sales availability of foreign reserved stock is denied using matching ACTIVE claim customer. Same customer's reserved stock may be observed as unavailable; no query promises allocation.

## Ownership and persistence

- Inventory: reservation.ts, service/public contracts; request intent adapter inventory-reservation-store.ts.
- Sales: internal confirmed-demand and minimal contender read ports, scoped Sales-store SQL; no stock table import/write.
- Composition: current Identity policies, owner port wiring and existing IPS; transport reservation-http.ts.
- Migration0008_reservation_requests.sql adds immutable request document, scoped Unit FK, matching ACTIVE claim FK/trigger and demand aggregate access index. Prior7 migrations unchanged.
- Runtime SELECT/INSERT/UPDATE inventory.reservation_request; no DELETE/DDL. Existing Ledger append-only and owner privilege separation preserved. Reset/test fixture safely acknowledge isolated test DB.

Own-order/document then complete ordered IPS resource locks; same supplied READ COMMITTED transaction/client across effects/audit/outcome. Fresh post-lock demand/permissions/priority/stock checked. Independent reviews found and closed hidden-allocation and unscoped-commercial-read gaps. See [review evidence](SLICE_STOCK_RESERVATION_REVIEW.md).

## Validation

Fresh pinned Windows npm run verify PASS:98 unit +147 real PostgreSQL integration tests, zero failures/skips. Includes7 new reservation units and29 new real PG/API scenarios. Separate npm run build, lint, format:check, import/SQL ownership84TSfiles PASS. Final migration + reservation/API32-test run PASS against exact staged/workspace LF SQL bytes after acknowledged isolated test reset, zero failures/skips. Prior7 raw migrations unchanged;15 root script bodies, package manifest/lockfile, runtime and tool pins unchanged.

New0008 raw SHA-256 bf38c738e6501fd58f1b596038bdb3c65fe02f172edac2ba60892e949882bab5 matches staged/workspace. PG180006/UTF8, distinct non-super/non-createDB/non-createRole runtime/DDL-owner roles, acknowledged disposable test DB distinct from dev. Unit/order/claim races, actual audits/outcomes, partial uniqueness, full/partial competitor coverage, exact microsecond/timestamp-tie priority, controlled confirmation-vs-activation lock wait, accepted/rejected replay, corruption fencing, audit failure, lost COMMIT recovery and current customer isolation all pass against actual PostgreSQL; no behavior was mocked away.

Independent engineering/domain/database/test and separate security/API source/document reviews PASS after required corrections; no unresolved required/blocking or known high/critical finding. Reviewers did not claim live DB execution. Registry metadata-only npm audit0 known vulnerabilities; no ERP source/documents exported. Offline Graphify0.9.79 refresh423 tracked files/3743nodes/6998edges, ReservationService maps to composition/IPS/tests. Source remains authority and graph stays ignored/local.

Repository consistency11 changed Markdown pages/854 local references/13JSON PASS; canonical OQ/business answers unchanged, gate/local ignored unlock APR-023 match actual authority. git diff --check working/staged PASS. Test/runtime/database/secret/graph artifacts not committed. No remote push, dependency upgrades, OS ACL/service changes, Linux testing or next major slice started.

Executed root scripts: npm run verify, npm run build, npm run lint, npm run format:check, npm run boundaries, npm run typecheck, npm run db:test:reset (acknowledged disposable DB), npm audit --json; final node --test --test-concurrency=1 migration/reservation/reservation-http compiled test files. Frozen install/runtime from accepted local assets reused; no dependency reinstall or production data reset.

## Limits and next scope

No release/consume/cancel/expiry, shipment, order amendment, fulfillment closure, money, PO/production automation, UI, QC or portal writes. Customer roster/grants remain configuration/Go-Live inputs. Current ACTIVE coverage is monotone: concurrent uncommitted coverage may conservatively reject; terminal claims require a later coordinated bundle/proof and state/query evolution. Factory-scale priority query optimization is measured follow-up; no speculative caching or distributed infrastructure.

Next approved backlog increment is shipment. Its dispatch actor/evidence/payment policy residuals must be checked against live canon before affected behavior; no missing factory policy is guessed. Naming it does not start it. Stop for Owner review/push.
