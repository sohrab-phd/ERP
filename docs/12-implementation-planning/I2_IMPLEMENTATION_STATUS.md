---
id: IMPL-I2-001
title: I2 purchase-linked multi-arrival receiving implementation and verification
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [delivery-lead, chief-solution-architect, security-architect]
depends_on: [APR-042, APR-041, APR-040, APR-039, SRC-007, PLAN-I2-DESIGN-001, IMPL-I2-TRACE-001]
last_reviewed: 2026-10-25
approval: APR-042 bounded implementation authority only; Owner backend acceptance pending
supersedes: null
---

# I2 implemented receiving backend — Owner acceptance pending

Authority: [APR-042](../00-governance/approved-baselines/APR-042-i2-implementation-authorization.md)
closes I2-CAP-01/02, formally accepts the focused design and separately authorizes
implementation. Baseline251f471a135e88084645c3a573f240a6f5770406; no remote push
is assumed. The canonical gate and ignored local unlock reference APR-042 only.
Twelve capabilities remain Owner accepted. This delivery is not a thirteenth
Owner acceptance, browser UI, factory UAT or production deployment.

## Delivered factory behavior

Current personally authenticated organizational ACT-WH submits one complete actual
arrival with its external waybills and warehouse receipts, actual physical units
and manual acceptance. Shared consignment may reference multiple immutable I1 POs;
a PO may be fulfilled over multiple arrivals. Source units are independently
identified, manually coded and labelled by the operator; ERP-generated UUIDs never
substitute for business codes, waybills or external receipt references.

The closed ConfirmPurchaseReceiving v1 payload explicitly distinguishes ORDER_LINE,
ORDER_ONLY and UNLINKED. The last two permit manually accepted unordered goods
without a fictional PO line or fulfilment credit. Accepted excess requires explicit
per-unit action; stale expected line progress conflicts rather than silently
changing a matched intent to excess. Original ordered count/specifications/W1
never change. Actual selected attributes, explicit optional-value absence versus
not recorded, field comparison and trusted warehouse acceptance are separate facts.
Partial delivery is progress, not a specification discrepancy.

One-unit accepted W1 is positive whole kg below10^20; no independent unit weighing
is asserted. Original and accepted W1 persist separately with honest
WH_ACCEPTED_DECLARED_UNIT_WEIGHT provenance. Mandatory W2 and optional W3 retain
the source decimal kg lexemes including fractional/trailing zeros, stored ONCE at
whole-consignment grain; neither is allocated, reconciled automatically or used as
unit stock. Manual changed/mismatched/excess/unordered acceptance belongs to WH,
without a second approver, QC gate or automatic tolerance.

Exactly11receiving business fields retain6mandatory/5optional, with no new
mandatory business field. Original23-field register/actor assignments/60IDs remain
unchanged. Product Number is opaque per-unit, nonunique and independent from the
old SHEET productCode. New I2 SHEET origin does not fabricate a legacy productCode.

## Executable source and published operations

| Area | Files / actual responsibility |
| --- | --- |
| Receiving contracts/service | [receiving-contracts.ts](../../apps/backend/src/modules/procurement/receiving-contracts.ts), [receiving-service.ts](../../apps/backend/src/modules/procurement/receiving-service.ts), [public exports](../../apps/backend/src/modules/procurement/index.ts): closed fields, scoped I1 originals/catalogues, comparisons, explicit acceptance, exact progress and private original-transaction admission |
| Reader admission/capacity | [receiving-projection.ts](../../apps/backend/src/modules/procurement/receiving-projection.ts): complete rendered metadata/header/row/cursor/snapshot/HTTP-wrapper preflight before source insertion and same exact byte budget during paging |
| Procurement persistence | [receiving-store.ts](../../apps/backend/src/infrastructure/postgresql/receiving-store.ts): both scope predicates, sorted signed hash locks, existing-code checks, immutable source insert, exact owner reads/counts and named deferred bundle validation |
| Inventory owner | [inbound-receiving.ts](../../apps/backend/src/modules/inventory/inbound-receiving.ts), [inventory-receiving-store.ts](../../apps/backend/src/infrastructure/postgresql/inventory-receiving-store.ts): exact persisted-source verification, finite classification, private transaction/effect admission, prelock all IDs, <=128effects/call, typed immutable origin/identity reads |
| Existing receipt integration | [receipt-service.ts](../../apps/backend/src/modules/procurement/receipt-service.ts), [receipt-store.ts](../../apps/backend/src/infrastructure/postgresql/receipt-store.ts): common code-resource ordering and understandable duplicate conflict; v1/no-PO/no-ticket/old replay unchanged |
| Composition/HTTP | [composition-root.ts](../../apps/backend/src/composition-root.ts), [receiving-http.ts](../../apps/backend/src/transport/receiving-http.ts), [host](../../apps/backend/src/transport/http-host.ts): exact command/target/current grant policies and private snapshot read admission with fresh authority after releasing snapshot |
| Genealogy | [contracts](../../apps/backend/src/modules/genealogy/contracts.ts), [projection](../../apps/backend/src/modules/genealogy/projection.ts): typed accepted-unit origin, RECEIVING_UNIT→LOT→UNIT with existing customer reachability; legacy output unchanged; shared arrival never becomes an ancestry edge |
| Database/tooling | [0018_purchase_receiving.sql](../../database/migrations/0018_purchase_receiving.sql), [migration inventory](../../tools/db/migrate.mjs), [reset roles](../../tools/db/reset-test.mjs), [fixture](../../apps/backend/tests/support/database-fixture.ts), [boundary checker](../../tools/build/check-boundaries.mjs) |

| Method / route | Command/query v1 | Authorization |
| --- | --- | --- |
| POST /purchasing/receiving/confirm | ConfirmPurchaseReceiving; inbound-arrival UUID target | Current organizational ACT-WH only |
| POST /purchasing/receiving/arrivals/query | GetReceivingArrival; arrivalId, optional afterId/limit | Current organizational ACT-WH only |
| POST /purchasing/receiving/orders/query | GetPurchaseOrderReceiving; orderId, view=LINES or RECEIVED_UNITS, optional afterId/limit | Current organizational ACT-PROC or ACT-WH |

Query items expose all relevant original/actual fields, external documents, product/
system codes, W1 and shared W2/W3, driver/truck/sender, approval and Inventory links.
PROC selected-order filtering precedes enrichment; sibling PO IDs/units and UNLINKED
cargo are not returned. Shared header weights are clearly consignment evidence,
not PO totals. No SEC/customer/unrelated permission is introduced. Organizational
scope follows existing installation=authority grants, not hardcoded employee names
or a new per-employee order ACL. Existing documentary purchase reads stay separate.

## PostgreSQL integrity, compatibility and exactly-once stock

0018 is additive: Procurement inbound_arrival, inbound_waybill,
inbound_warehouse_receipt, inbound_received_unit, inbound_physical_code_claim;
Inventory inbound_unit_origin. Existing migrations0001–0017 are unchanged.
External code/document uniqueness is exact C equality within installation, NOT
PO R1 normalization. Restricted fixed-search-path trigger derives code claims;
runtime cannot insert/update/delete claims directly or execute the definer helper.
Historical unclaimed codes are checked without seed/backfill; exact historical
receipt/origin code-mirror inconsistencies fail migration explicitly without
rewriting or leaking raw identifiers. Existing historical duplicates are never
silently merged; affected new admissions conflict.

Legacy DRAFT→RECEIVED→POSTED remains the normal source transition; a posted source
cannot later be detached or its stock identity rewritten. New sources/claims/
origins are immutable. Composite scoped FKs, frozen complete array counts/ordinals,
source→origin→Unit/Lot→Ledger identity and exact W1/JSON effect/create/scope/actor/
request binding are enforced. Named deferred checks are forced before handler
success; deferred/COMMIT faults remain technical whole-transaction aborts.

Envelope identity/Identity locks precede sorted complete Procurement resources;
Inventory then verifies the already-inserted uncommitted exact sources, prelocks
ALL generated Unit/effect IDs and invokes sole IPS in chunks<=128 within the SAME
original PostgreSQL transaction. No partial/chunk COMMIT, hidden subcommand, alternate
Ledger/Balance writer, IPS arithmetic change or false256-unit limit exists.
Later stock/origin/constraint/audit/outcome failure rolls back all earlier work.
Original command/target/raw payload/preconditions/array bind durable replay; changed
payload conflicts. Unknown COMMIT recovery reuses original identity on primary.
Read-only repeatable snapshots use private per-transaction actor admission bracketed
by fresh trusted Identity checks outside the snapshot; no FOR UPDATE in read-only
transactions or self-deadlock on a held pool connection.

## Accepted limits and remaining operational exclusions

- New receiving text:128Unicode scalars AND512UTF8bytes, raw preserved, never truncate;
  existing legacy v1 input remains128bytes. Arrival Jalali profile1206–1498, explicit
  unsupported-date error outside, no clamping/current-date substitution.
- Existing envelope256KiB raw/canonical/result,10000entries,depth32,64KiB/string;
  W2/W3 unsigned plain ASCII decimal kg strings preserve precision without rounding.
  No independent arrival unit/document count limit. One physical arrival is never
  silently split to bypass the envelope or transaction.
- Reader admission16active/5s input, pages default50/max100, complete response256KiB.
  Preinsert complete-item retrievability includes actual escaped trusted text and
  bounded DB timestamp/UUID metadata. No accepted value is silently truncated.
- Small explicit Inventory-owned known-term resolver supports COIL/SHEET/ANGLE/BEAM
  and recorded Persian names; unknown options are rejected with affected option UUID
  and unit ordinal, never mapped to OTHER. No new classification approval workflow.
  Real deployment catalogue bindings and historical integrity still require normal
  rollout verification; synthetic test fixtures are not production-data evidence.
- No original PO amendment/closure/backfill, posted correction/return, nonaccepted
  custody or incomplete-mandatory draft, UI, QC, device integration, financial effect,
  factory UAT or deployment. The new typed genealogy source is internally supported;
  existing public unit/lot trace entry points retain their transport/authority scope.

## Executed verification and independent review

Final canonical integration verification PASSED on2026-10-25. Engineering
verification and required independent review are complete; separate Owner backend
acceptance is pending. Earlier focused runs are not substituted for this result.
See [sixty-ID and22-family code/test trace](I2_IMPLEMENTATION_TRACE.md).

Windows commands use the pinned Node24.21.0/npm11.19.0 directory on PATH. Database
commands load the ignored `.env.local` through Node's `--env-file=.env.local`;
no credentials are reproduced here. Real PostgreSQL18.6/UTF8 uses the acknowledged
disposable test database, distinct restricted migration/runtime roles and a separate
development database. No production database or factory data was used.

| Executed command / surface | Actual result / retained local evidence |
| --- | --- |
| `npm run preflight` | PASS, exact pinned runtime/package baseline |
| `npm run format:check` | PASS, all matched files formatted |
| `npm run lint` | PASS, zero warnings admitted |
| `npm run boundaries` | PASS,164source files, sole stock writer/owner checks retained |
| `npm run build` | PASS, including final post-suite build |
| `npm run test:unit` |198passed,0failed/0skipped; `artifacts/tests/i2-unit-final.log` |
| Real PG integrity file, compiled `receiving-integrity.test.js` |9passed,0failed/0skipped after actual reset/migration; `artifacts/tests/i2-integrity-final.log` |
| Focused additional receiving cases and strengthened257case |7passed,0failed/0skipped; `artifacts/tests/i2-additional-final.log` |
| Affected compiled legacy receipt/reservation/genealogy cases |45passed,0failed/0skipped; `artifacts/tests/i2-legacy-regression-final.log` |
| `node --env-file=.env.local tools/test/run-integration.mjs` |349distinct tests passed,0failed/0cancelled/0skipped; exit0;1315661.7445ms; `artifacts/tests/i2-integration-final.log` |

Focused runs overlap the canonical suite; they must not be added to its distinct
test total. The earlier interrupted diagnostic run is not a passing suite result.
Build/static review is not PostgreSQL transaction proof. Planned scenarios are not
counted as executed tests. The final regression includes the newly added race and
complete-pagination assertions and the aligned legacy fixture codes.

The exact complete-run executable was
`artifacts/tests/i1-environment/node/node-v24.21.0-win-x64/node.exe` followed by
`--env-file=.env.local tools/test/run-integration.mjs`. It includes all current
integration files in the canonical runner, all22I2families and existing accepted
capability regressions. In particular, the executed5ordered/3received2000kg case
asserts3independent Units,6000kg and2outstanding, unchanged originals and shared
consignment evidence. Real129/257unit cases prove multiple IPS invocations in one
transaction; a later-chunk failure rolls all earlier effects back. Actual observed
code/document lock races, revocation, audit failure, killed-process retry and
lost-COMMIT-response recovery passed, not merely static review.

Retained local log SHA256: integration
`1D3F0971D9AE8DAE2A82BBD46A855F6C476448566F87E7FDA62B6590C6C5A70C`;
unit `A252867B47ABE428325F4070223907A58346654294E073B08681CCAC13F65FD3`.
Logs/runtime/database artifacts remain ignored; source and this evidence summary
belong to the coherent local delivery commit. No remote push was performed or
remote commit presence assumed.

Final documentation checks:17changed Markdown pages/1166local links,159metadata
dependencies,60distinct I2trace IDs,22family rows and11receiving fields with6/5
requiredness passed. Original source evidence/field register and migrations0001–0017
remain unchanged; shared-kernel source unchanged. Working/staged diff checks pass.
Offline Graphify0.9.79 structural rebuild indexed581tracked files without network;
it is navigation evidence, not a substitute for executable acceptance.

### Independent actual-code reviews and closed required findings

Independent engineering/database review inspected other authors' Procurement,
Inventory admission, transaction/lock and query code; independent security/static
schema review inspected actual0018 and public entry points. Both report PASS with
no remaining required code finding. Security review was static, not a claim that
the reviewer personally executed the shared database suite. The database author
executed nine actual PostgreSQL integrity cases; schema independence comes from
the separate security reviewer and root inspection, not self-review.

| Required finding / class | Implemented correction | Executable verification |
| --- | --- | --- |
| I2-SEC-01 / I2-ENG-01 MEDIUM | Exact rendered header/actor/metadata/UUID/cursor/snapshot/HTTP-wrapper preflight and same byte-page assembler; no unreadable accepted record | receiving-projection unit boundary ±1byte; actual large W2/W3 admission/read test and full257source pagination |
| I2-ENG-02 LOW | Unsupported material rejection identifies submitted catalogue option UUID and unit ordinal, never an unrelated record or OTHER fallback | unsupported-material HTTP/PG case |
| I2-SEC-DB-01 MEDIUM | Source-stock predicate proves real Ledger effect kg/type/create/customer scope/command/version/source/effect/unit binding as well as columns | forged kg/customer binding real SQL rejected |
| I2-SEC-DB-02 MEDIUM | Legacy source state/stock identity freezes once POSTED, preserving the normal DRAFT→RECEIVED→POSTED path | runtime and DDL-owner attempted unpost/effect rewrite rejected |
| I2-SEC-DB-03 MEDIUM | Read-only exact-C historical receipt/origin mirror preflight before FK activation; explicit named sanitized migration failure | actual0018 DO block accepts matching history and rejects mismatch without rewriting |
| Test review: required actual race/read proof | Two observed independent authenticated waiters for old/old, old/new, and document identity races; complete257item PROC keyset reads | seven focused PostgreSQL cases passed, also included in final root suite |
| Regression fixture alignment | Each separately constructed receipt fixture assigns a distinct external test code; explicit copied-code duplicate tests still reject. SHEET race uses different codes with same productCode, preserving the original product-identity test | receipt/reservation/genealogy45tests passed; no production code generator introduced |

The read-only snapshot issue discovered during first execution is fixed by the
private per-transaction read admission described above; fresh trusted grants still
bracket the snapshot. No Identity or shared-kernel security bypass was introduced.
All current-gate changes derive from the actual Owner instruction; ignored unlock
paths exclude unmodified I1 inputs and historical migrations. No new framework,
package version, service, outbound integration, OS containment or production reset.

## Project progress and next Owner boundary

The twelve previously Owner-accepted backend capabilities remain: command envelope/
durable audit; personal Identity/current grants; exact-kg IPS; standalone receipt/
material origin; Sales demand/fulfilment; reservations; Shipment/dispatch; routed
Production/mass balance; source-backed Genealogy; completed-purchase/sent-proforma
evidence; issued-invoice evidence; and I1 operational orders/shared catalogues/WH
lookup. I2 adds actual purchase-linked receiving and authorized committed progress;
its separate Owner backend acceptance is pending, not fabricated by this report.

The next action is Owner review of this tested local I2 delivery and Owner-managed
push. No further increment is started or implicitly authorized. Broader visibility/
reporting/browser workflows, approved corrections/restoration, deferred weighbridge
device integration, monetary Finance policies, factory UAT and production cutover
remain separately governed backlog areas; this receiving backend does not complete
those areas or the entire ERP.
