---
id: IMPL-GENEALOGY-001
title: Genealogy Projection and Trace implementation status
status: accepted
last_reviewed: 2026-10-10
---

# Genealogy Projection and Trace

Baseline: Owner-confirmed accepted/pushed SLICE-MAKE `e5997f506c753bc73426128a88558d9c633e7f88`. [APR-026](../00-governance/approved-baselines/APR-026-genealogy-trace-scope.md) records actual authorization; [plan/DoD](GENEALOGY_TRACE_PLAN.md) and [DATA-GEN-001](../04-database-architecture/GENEALOGY_PROJECTION.md) bind scope. The local delivery commit is reported after acceptance; no self-referential commit hash or new Owner business policy is invented.

## Implemented behavior and ownership

Reporting's `modules/genealogy` reconstructs a deterministic, bounded trace from published Inventory, Production and Shipping source ports. It imports no private foreign module or SQL adapter. The composition root wires these ports and supplies one PostgreSQL REPEATABLE READ READ ONLY transaction per query. Existing command transactions remain READ COMMITTED. This slice adds no migration, persistent graph/cache, dependency, background worker, stock writer or business command.

TraceForward and TraceBackward accept typed UUID roots: UNIT, LOT, RECEIPT, PACKAGE, SHIPMENT, FACT, OPERATION, ORDER, BATCH and SALES_ORDER. Edges derive from actual Lot origins, exact declared Output parent subsets, individual Residual parents, terminal Scrap facts, immutable package content and actual dispatch rows. Consumption annotates actual consumed kg; partial stock stays the original Unit. FINALIZED annotates the same WIP Unit without creating new stock or self ancestry. Association roots/reference metadata do not turn operation/order/batch siblings into material ancestors. Entry/Referral/operator declarations are association-only context events, not quantity movements.

Receipt evidence preserves Internal Code, descriptive Count, measured kg, Type and recorded standalone-Sheet Product Code. Production-derived Units do not receive fake Goods Receipt origins. The projection does not fabricate Supplier/certificate information, Coil ancestry or universal physical codes. Public references use canonical source UUIDs; existing domain queries remain the authority for commercial Order Code/display labels. Multi-parent Output edges carry the complete result kg with `RESULT_TOTAL`, never an invented measured contribution per parent; consumers must not sum it across parent edges. Deduplication retains all explicit split/merge links.

Package history and actual stock exit remain distinct. DRAFT/PACKED/ASSIGNED/UNPACKED membership is evidence, not dispatch. Only immutable dispatch rows yield shipment edges. Forward Unit impact excludes unrelated co-packaged Units/reservations/quantities; backward Shipment includes its actual contents. Shipment remains DISPATCHED, not DELIVERED. Trace neither fulfills nor closes Sales demand.

## Query interface, current authority and limits

GET `/genealogy/forward|backward/<kind>/<UUID>` uses lower-case kinds unit, lot, receipt, package, shipment, fact, operation, order, batch and sales_order. The direct composition API is `genealogyQuery(direction, root, actor)`. Every caller needs an individually authenticated, service-branded current ACT-WH, ACT-SALES or ACT-SEC with an exact selected customer grant. HTTP requires one x-customer-id UUID and Bearer session; there is no role claim, organizational fallback, request body, query options or browser Origin. ACT-CUST/OP/PLAN/SHIP/FIN and copied contexts have no trace authority. Organizational Warehouse intake alone does not broaden customer visibility; existing organizational receipt reads remain unchanged.

Customer-bearing sources are filtered by installation/authority/customer before their cardinality caps. Organizational receipt origins are exact unique installation/authority lookups through their owned table; they carry no customer column and cannot be disclosed directly. Original organizational receipt/Lot/Unit evidence is reachable only through the selected customer's Production or Shipping facts. A trace cannot expose another customer's shared-origin branch. Current authorization is checked before opening the snapshot and freshly after commit/release immediately before disclosure. Reading permission solely inside REPEATABLE READ would miss revocation; checking after release also avoids retaining a connection during the final identity checkout.

Fixed bounds are depth32, nodes256, edges1024, source rows256 per collection (257th sentinel detects overflow), source-port calls1024 and encoded response256KiB. Exhaustion raises `GUARD_INVARIANT`/HTTP422 without a partial result or false not-found. Unknown/foreign roots are absent/HTTP404; actor denial is403 or unauthenticated401, invalid body400, unsupported method405, technical failure503 with safe messages. Responses are no-store/nosniff. HTTP holds at most4 admitted reads and keeps the slot until underlying work settles even after its10-second timeout; database read deadline8seconds, statement4seconds, lock1second. No caller can raise limits.

## Acceptance proof

Pinned Windows runtime: Node24.21.0/npm11.19.0/TypeScript6.0.3/pg8.23.1/PostgreSQL18.6 UTF8. Actual PostgreSQL uses the acknowledged isolated test database, separate developer database and restricted runtime/DDL-owner roles. No Linux, external source/metadata export or dependency upgrade.

| Tests | Material proof |
| --- | --- |
| unit/genealogy.test.ts | Exact directions/parents, split/merge, WIP/final/partial/Residual/Scrap, typed collisions/cycles/diamonds, deterministic order, all bounds, package history/dispatch, same-package isolation and late reachable Unit joining visited package |
| unit/genealogy-http.test.ts | Exact bounded transport, authorization delegation, safe errors, four retained admissions/timeouts |
| integration/genealogy.test.ts | Real posted receipt/production/shipment reconstruction; standalone Sheets; original remainder/finalization; exact parent subsets; association/origin roots; no fabricated origins; source overflow after scoped lookup; exact source/stock/audit/outcome rows unchanged |
| integration/genealogy-security.test.ts | Genuine exact customer grants, foreign/copied/revoked/unsupported access, safe HTTP negatives, shared-origin customer filtering, concurrent posting coherent old/new snapshot, fresh revocation after snapshot release and original SQL still exercised |
| integration/transaction.test.ts | Read snapshot server-enforced REPEATABLE READ READ ONLY, prohibited DML, coherent snapshot despite concurrent commit, unchanged default write mode and technical abort/capability cleanup |
| Previous accepted slice regressions | Envelope replay/crash/audit, Identity, IPS, receipt, Sales, reservation, shipment and production behavior preserved |

Final pinned `npm run verify`: PASS on 2026-10-10 — 159 unit tests and 216 real PostgreSQL integration tests, zero failures/cancellations/skips. All six new genealogy security tests and six material-trace integration tests ran successfully, plus the read-only transaction test and every preceding slice regression. Preflight, formatting, ESLint, unchanged module boundary checker (121 files), emitted build/typecheck and migration guard pass. The standalone pinned `npm run build` also passes. Required checks: root preflight/format/lint/boundaries/typecheck/build/unit/integration, exact migration/lockfile preservation, JSON/local-reference consistency, local Graphify refresh/navigation and git diff --check. Executed repository checks: 13 JSON files parsed, 1822 local Markdown references resolved with zero missing targets, all14 migration files and4 dependency/manifests unchanged byte-for-byte, gate/local unlock match APR-026, working/staged diff checks pass. Graphify0.9.79 refreshed locally with network blocked; targeted query identified projection, composition, transaction and owner source interfaces. Generated graph and logs remain ignored/local. No test is waived or counted from documentation alone.

## Independent engineering/security review

Cross-review excludes each agent's authored behavior: owner-port reviewer reviews projection/HTTP/composition/tests; projection reviewer reviews owner SQL/HTTP/read transaction/composition and root PostgreSQL assertions; HTTP/snapshot reviewer reviews owner readers and projection, while its own tests/transport/read mode are reviewed by the other agents and root. Reviews use the project database/API/test/security skills and actual accepted source contracts. All reviewers conclude PASS with no outstanding blocking/required or known high/critical findings. These are independent static reviews; all runtime acceptance evidence comes from the root's pinned final run, not an agent's unpinned shell.

| Independent reviewer | Non-authored review surface / result |
| --- | --- |
| genealogy_owner_ports | Projection, transport/composition, unit/integration/security tests, documentation and native HTTP fixture: PASS |
| genealogy_projection | Owner SQL including final receipt-reader correction, HTTP/read transaction/composition, root and HTTP-agent PostgreSQL assertions: PASS |
| genealogy_http_snapshot | Owner ports, projection, customer/privacy/snapshot boundaries; identified both initial projection defects subsequently closed by regressions: PASS after corrections/cross-review |


Required findings corrected with regressions: shared-package Unit-forward evidence leak; independent package/shipment row caps; late reachable Unit entering an already visited package; exact zero-mutation fingerprints covering package/shipment state; overflow fixture using a valid operation lifecycle; receipt reader staying inside its SQL owner with composed customer reachability. Nonmaterial context events are preserved only for typed association roots. An existing Windows HTTP unit fixture was repaired to use native HTTP rather than Fetch's forbidden-port list; product HTTP behavior is unchanged.

Mandatory security review is local source review plus executed negative PostgreSQL/HTTP tests. No external/advisory metadata audit was performed or claimed; dependencies and lockfile are unchanged. Browser UI/XSS/CSRF, file uploads, outbound requests/SSRF and new credential storage are inapplicable to this backend-only read capability. Existing Identity/session/RBAC, SQL parameterization, customer isolation, minimized disclosure and resource/transaction bounds are assessed.

## Limits and next work

This is the ninth capability in the delivery sequence: a read projection, not the full ERP, browser genealogy visualization, Supplier/certificate capture or new Production rework/correction producer. A separate reconstruction/restore worker remains SLICE-RESTORE. No generalized graph database, queue, Event Sourcing, QC or analytics infrastructure. Above-limit traces explicitly reject; scale evidence can justify a later bounded pagination design. No Order Code/employee/catalogue policy is invented and no unrelated OQ is closed.

After acceptance/local commit stop for Owner review/push. The next approved backlog area is SLICE-PURCHASE purchasing coordination, using receipt/Identity foundations and only its actual answered supplier/purchasing policies. Naming it does not implement it or invent missing approval/discrepancy/financial rules.
