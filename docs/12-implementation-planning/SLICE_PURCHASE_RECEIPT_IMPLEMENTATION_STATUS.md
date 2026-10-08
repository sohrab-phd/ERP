# SLICE-PURCHASE receipt increment — actual implementation

Delivery date: 2026-10-08. Status: ACCEPTED. Definition of Done passes; no blocking or required finding remains.
Authority/policy: [APR-021](../00-governance/approved-baselines/APR-021-receipt-increment-scope.md).
Starting accepted/pushed implementation baseline:
2b98d2c06beb5ae6fc3756a826695b9999abfedf. Architecture baseline remains
APR-018/e80a04b15ddf93451cc79ccf81722f564912596d. Technical mechanism:
[ADR-0016](../00-governance/adrs/ADR-0016-manual-goods-receipt.md).

## Implemented capability and owners

One current individually authenticated ACT-WH user posts manual factory intake.
Procurement records Goods Receipt and composes DRAFT -> RECEIVED -> POSTED on
the caller's envelope transaction. InventoryReceiptService owns the Lot origin,
allocates distinct Lot/Unit/material/effect UUIDs and calls the existing IPS once.
Only IPS changes Unit/Ledger/Balance; Procurement cannot write their SQL tables.
Successful stock-in makes the Unit AVAILABLE with exact measured kg and zero
reserved kg. Receipt, Lot, Unit, Ledger, Balance, outcome and audit are atomic.

Required payload fields: internalCode (nonempty safe text <=128 UTF-8 bytes),
count (canonical nonnegative whole-number string), measuredKg (canonical positive
whole-kg string), type (COIL/SHEET/ANGLE/BEAM/OTHER), locationId (placement UUID).
Numeric capacity is below 10^20 without rounding or Number coercion. Count is
never a stock quantity. Standalone SHEET additionally requires its scoped unique
productCode; for other types an optional product code is descriptive. Internal
Code is nonunique, distinct from product/material identity and Inventory Unit UUID.
No supplier/PO/ticket, expected weight, customer/actor, Coil parent, Qty override
or QC field is accepted by this bounded contract.

The stable goods-receipt target UUID identifies a recorded receipt document,
not a universally identified physical delivery. Keep it and the original command
key across retries. Same key/binding replays the first accepted/rejected outcome;
changed binding/principal reuse returns nondisclosing conflict. New key for an
existing receipt document gives DUP for equal intake, CONFLICT for changed intake.
Different document IDs are not guessed duplicates from Internal Code/Count/Weight.
Actual future stable device/source evidence belongs to its later specification.

## Public backend contract

| Route/use case | Delivered contract |
| --- | --- |
| POST /receipts/post | Complete PostGoodsReceipt v1 command envelope; target kind goods-receipt, stable UUID; empty preconditions; personal Bearer session and current ACT-WH |
| GET /receipts/{uuid} | GetGoodsReceipt in current installation/authority; original intake and POSTED stock IDs; excludes internal binding |
| GET /inventory/units/{uuid} | GetInventoryUnit origin plus Ledger-validated exact onHand/reserved/available strings |
| GET /inventory/lots/{uuid} | GetLot origin and same stock evidence; no fabricated genealogy |

Reads require current org-scoped ACT-WH or ACT-SEC. Optional x-erp-role selects
one of those existing grants; it never grants authority. Customer, Procurement,
forged or revoked contexts cannot use these stock/receipt routes. There is no
all-customer dump, arbitrary business command, direct Balance edit, stock-out,
reservation, opening-stock or projection-rebuild HTTP route.

The inherited individual session/auth APIs remain unchanged. No cookie auth;
Origin-bearing requests are denied. Production binds loopback behind the existing
TLS-terminator requirement. Request body <=4096 bytes, duplicate-safe bounded
JSON, exact Bearer framing, at most16 active receipt operations and inherited
server/transaction deadlines. No unbounded work queue, credentials/body logging
or SQL-error disclosure.

HTTP200 accepted/replayed acceptance; HTTP422 durable business rejection/replay;
HTTP409 occupied-key conflict; HTTP403 denied authority/admission; HTTP401 invalid
session; HTTP400 malformed transport; HTTP503 technical uncertainty/unavailability.
A technical response is not a durable rejection: retain the same bound key and
receipt document. Responses include the existing envelope result/replay/execution
metadata. Get reads return {data}; missing scoped object returns404.

## Persistence, locks and failure behavior

Migration0006 adds procurement.goods_receipt and inventory.material_lot, with
scoped keys, whole-NUMERIC checks, Sheet partial unique product code and
receipt/Unit-Lot linkage. Receipt carries actual principal, role, request/key and
DB creation time. Origin stores immutable receipt/material/Unit linkage and
original intake, with no Coil parent. Runtime receives receipt lifecycle DML and
origin SELECT/INSERT; no origin/Ledger UPDATE/DELETE or migration ownership.
Existing migration raw checksums and exact dependency/root script pins remain.

After preliminary current-authority admission, lock envelope key, account/session,
absent receipt document, Sheet code
when applicable, then IPS Unit/effect locks. Fresh READ COMMITTED lookups resolve
races. A handler business rejection rolls back the complete tentative bundle to
its savepoint, then stores rejection/audit; technical failure rolls everything
back. Confirmed-but-lost COMMIT replies resolve on the same primary/key, never by
issuing a new receipt identity. On-hand/reserved are Ledger totals validated
against projection/claims; available is their exact difference. measuredKg in
receipt/origin is historical intake evidence, not independently editable stock.

COMMAND_ADMISSION_RECONCILED defaults false. An operator explicitly enables only
an original or reconciled primary. Before lossy restore/recovery disable admission
and keep traffic fenced until acknowledged/uncertain history is reconciled.
The setting is not automatic recovery proof or a new backup platform.

## Acceptance evidence

- Unit receipt contract/control-flow tests: exact fields/quantities, invalid/future
  fields, state ordering, duplicates, authority, snapshots and owner failure.
- Real PostgreSQL receipt tests: WH-only branded personal identity, Internal Code
  reuse, invalid non-UUID command keys, missing-policy durable replay, exact kg,
  accepted/rejected replay, binding conflicts, Sheet uniqueness/no Coil,
  scoped reads, real mid-bundle business/technical rollback, projection drift and
  reconstruction, audit failure, revocation while waiting and COMMIT reply loss.
- Receipt and Sheet races use two distinct Warehouse accounts/persons/sessions;
  bounded rendezvous verifies both transactions reach actual owner-lock admission.
  Identity locking cannot substitute for the tested Receipt/Sheet locks.
- Real composed HTTP tests exercise accepted/replayed commands, current reads,
  denial/revocation, role/auth/header/Origin/JSON abuse, rejected replay, safe
  output and default recovery admission fence.
- Full Windows pinned verify/build, dependency advisory audit and repository
  consistency/diff checks are recorded in the final evidence below.

Independent engineering/database/domain/API and security reviews are tracked in
[review closure](SLICE_PURCHASE_RECEIPT_REVIEW.md). Reviewers inspected code and
regression tests; live PostgreSQL execution is by the root, not falsely reported
as independent. Required findings must be closed before local commit.

## Final executed evidence — 2026-10-08

| Check | Executed result |
| --- | --- |
| Frozen Windows runtime preflight | Node24.21.0/npm11.19.0/TS6.0.3; PASS |
| Format/lint/module ownership/typecheck | PASS via npm run verify |
| Unit suite | 68/68 PASS, zero skipped; includes11 receipt contract/control-flow tests |
| Actual native Windows PostgreSQL18.6/UTF8 | 93/93 integration PASS, zero skipped; includes18 receipt +2 composed HTTP tests |
| Transaction/concurrency/crash/audit | PASS: distinct-user Receipt/Sheet races, same-key replay/new-key guards, savepoint/mid-bundle/audit rollback, revocation and confirmed COMMIT-reply loss |
| Build | npm run build PASS |
| Pinned dependency advisories | npm audit --audit-level=high, zero vulnerabilities at every reported severity; registry package metadata only, no ERP source upload or version changes |
| Canonical consistency | 22 changed Markdown pages/468 local links and13 tracked JSON files PASS; APR021 gate/local unlock match; ADR0016 registered, OQ001 remains treating |
| Exact scripts | All15 frozen root script bodies PASS; migration inventory explicitly adds0006 |
| Graph/navigation | Reviewed offline Graphify0.9.79 refresh:391files/3445nodes/5898edges; targeted query traces ReceiptService -> InventoryReceiptService -> IPS/composition/tests;12 extractor symbol omissions, not semantic evidence |
| Git whitespace/final scope | git diff --check and staged equivalent PASS; no transient graph/test data, local unlock or credentials staged |
| Independent review/security | PASS; closed required findings, static reviewers distinguished from root-executed DB evidence |

Isolated test database/owner/runtime identities and exact version are verified by
existing fixtures; development DB is distinct. Local test services are stopped
after evidence capture. No remote push or subsequent major slice is performed.
The coherent delivery commit contains this record; final Owner report gives hash.

## Limits and next work

Backend receipt and keyed stock evidence are delivered; factory browser form,
stock list/location-master UI, optional purchasing-reference contract, PO lifecycle,
supplier approval, discrepancy/over-under policy, return/correction, opening stock,
scale adapter, genealogy projection and other business posting are not delivered.
No QC, mandatory ticket/PO or Procurement posting permission was added.

Next approved capability is SLICE-STOCK, starting with the commercial demand/
confirmation increment before reservation/shipment. It depends on accepted
Identity/envelope and this usable Inventory intake foundation. No next major
slice starts before this coherent local commit is reported and Owner confirms
acceptance/push. Exact delivery commit is the commit containing this record,
avoiding a self-referential hash; the Owner report supplies its full hash.
