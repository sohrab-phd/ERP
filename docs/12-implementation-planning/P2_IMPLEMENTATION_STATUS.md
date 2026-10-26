---
id: IMPL-P2-001
title: P2 Persian Warehouse receiving browser implementation status
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [delivery-lead, chief-solution-architect]
depends_on: [APR-046, APR-045, APR-043, IMPL-P1-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-10-26
approval: null
---

# P2 Warehouse receiving UI — in review

Authority: actual Owner [APR-046](../00-governance/approved-baselines/APR-046-p2-receiving-ui-authorization.md).
Starting `main`: `1dfaccb4b73c1d3367e34c9f8d0d1a571a740770`, tracked tree clean.
P1 remains accepted under APR-045 at `22b5389af4d88cff38afdac1bebad68badd06f9c`;
I2 remains accepted under APR-043. This is a UI/integration increment, not another
backend capability or ERP completion percentage. **P2 is not Owner-accepted.**

## Bounded goal, plan and Definition of Done

ACT-WH must look up canonical original orders, enter one complete actual arrival,
verify independent physical units against selected lines, explicitly review and
confirm, then read canonical receiving/Inventory identities and outstanding order
progress. ACT-PROC retains purchasing and scoped receiving-read permissions only.

Reuse the P1 native HTML/CSS/TypeScript app, current Identity/CSRF/cookies and
actor-bound encrypted immutable intent. Add one local receiving editor, two exact
browser routes, a named installation placement setting and focused tests. No
service/schema/policy change, new framework, new business command or stock logic.

DoD: all11fields; exact values and immutable originals; explicit physical-unit
acceptance; partial/subsequent and supported shared multi-order arrivals; secure
WH-only dispatch; uncertain same-key replay without duplicate IPS effects; canonical
complete readback with individual page timestamps; meaningful unit, real-PG and
real-browser evidence; static checks, self-review, documented limitations and a
local commit ready for separate fresh-context independent engineering/security review.

## Delivered operator journey and contracts

The existing `/` application adds **ثبت دریافت انبار** for current ACT-WH only.
Original order lookup uses reference or UUID, retrieves all LINES progress pages,
and preserves server line IDs, catalogue IDs and exact values. Each unit explicitly
selects its order/line (or accepted ORDER_ONLY/UNLINKED association), waybill and
business receipt. Actual attributes start blank; a deliberate per-unit verification
button may copy the reviewed original. Optional actual attributes preserve the
three contract states: unrecorded omission, explicitly confirmed absent `null`, or
an exact value. Explicit acceptance flags start unchecked; the server determines
the accepted discrepancy/overage rules. Partial delivery itself is not a mismatch.

One final review freezes the complete envelope, target/doc/unit UUIDs, key,
payload and exact linked-line progress preconditions. The operator explicitly
confirms before the existing `ConfirmPurchaseReceiving` version1 runs. There is
no separately persisted arrival draft, distributed transaction or new command.
Several orders/documents/units may share one atomic arrival; subsequent deliveries
use new arrival documents against the same original order. No128-unit arrival cap
is invented: the existing request bound applies; IPS chunks remain backend-owned.

Accepted results trigger `GetReceivingArrival` to exhaustion, one shared header,
independent page timestamps and per-unit canonical original/actual/comparison,
actors, documents and Inventory `{unitId,lotId,materialId,effectId}`. Related LINES
progress is also read to exhaustion. Warehouse UUID arrival lookup reuses that
same query. Results are server readback, not optimistic form echoes. Page sequences
are not one atomic snapshot. Existing P1 LINES/RECEIVED_UNITS rendering is preserved.

## Eleven warehouse business fields

Source: [accepted field register](../02-domain-business-architecture/PURCHASE_RECEIVING_FIELD_REGISTER.md)
and `apps/backend/src/modules/procurement/receiving-contracts.ts`. No mismatch found.

| Field | Requiredness / familiar label | Accepted command location / UI |
| --- | --- | --- |
| F01 | Required — شماره سیستم | `units[].internalSystemCode`; independent manual physical-unit code |
| F03 | Required — شماره بارنامه | `waybills[].reference`; shared document selected per unit |
| F05 | Required — شماره رسید انبار | `warehouseReceipts[].reference`; business reference, separate from hidden UUID |
| F18 | Required — تاریخ ورود | `arrivalDateJalali`; actual Jalali YYYY-MM-DD, no Gregorian conversion |
| F19 | Required — شماره محصول | `units[].productNumber`; independent from F01 and legacy SHEET code |
| F21 | Required — وزن خالص گزارش مبدأ | `originNetKg`; exact W2 whole consignment, selected weight-source waybill |
| F04 | Optional — شماره بارنامه حواله (برگ زرد) | `waybills[].yellowCopyReference`; omitted when blank |
| F06 | Optional — شماره کامیون | `truckNumber`; omitted when blank |
| F20 | Optional — شرکت ارسال کننده (مبدا) | `originatingCompany`; omitted when blank |
| F22 | Optional — وزن خالص باسکول مقصد | `destinationNetKg`; exact optional W3 whole consignment |
| F23 | Optional — نام راننده | `driverName`; omitted when blank, no identity-document collection |

Per-unit W1/dimensions/catalogue identity/association/acceptance and configured
location are accepted I2 control/verification data, not invented factory field
requirements. No decimal/count/date conversion through floating-point arithmetic;
technical positions and array lengths alone use JavaScript numbers.

## Ownership, security and recovery

Only `/ui-api/purchasing/receiving/confirm` and
`/ui-api/purchasing/receiving/arrivals/query` join the exact browser allowlist.
The existing receiving handler enforces ACT-WH/current server grants on both;
PROC keeps only order-scoped reads. Origin/Host, Fetch Metadata, CSRF, HttpOnly/
SameSite/Secure cookies, no-store/CSP, resource limits and legacy bearer behavior
are preserved. `/operator/receiving.js` is one explicit static asset, not arbitrary
file serving. User data uses DOM text nodes. No server authorization policy changes.

The existing encrypted tab intent slot now admits only the exact receiving path
with ACT-WH. Persistence precedes first dispatch; uncertain failure retains the
same frozen envelope. Expiry/logout clears editor DOM/caches/review and decrypted
state while retaining ciphertext. The original actor can recover/replay after
reauthentication; another actor cannot decrypt or dispatch it. Accepted receiving
readback failure retains recovery until authoritative replay/readback succeeds;
definitive400/422 rejection releases the frozen review for correction.409/503 are
not unconditional fresh-command instructions. Existing P1 O-01 is unchanged/deferred.

The accepted I2 transaction owns receiving source, sole IPS stock effects,
Inventory origins, outcome and audit. W1 alone posts each confirmed physical
unit; W2/W3 are stored once as whole-consignment evidence, never allocated,
summed into stock or posted by the browser. Original I1/I2 and Inventory services,
SQL ownership, migrations and command/outcome policies are unchanged.

## Development prerequisites and limits

Use [README startup](../../README.md#p2-warehouse-receiving-browser-workflow--in-review),
pinned Windows Node24.21.0/npm11.19.0 and existing personal accounts/grants.
`BROWSER_RECEIVING_LOCATION_ID` and `BROWSER_RECEIVING_LOCATION_LABEL` must identify
the actual installation receiving location. Both are optional together; invalid
or partial configuration fails startup, missing configuration disables entry.
Only authenticated WH receives the setting. There is no location master/FK/API:
this is named workstation placement configuration, not proof of a database master.
No arbitrary UUID or fake factory label is generated. Existing Inventory resolver
must support the chosen material type; unknown labels remain rejected, no fallback
mapping. Synthetic placement/accounts in tests are explicitly test-only.

No draft persistence beyond an encrypted **dispatched unresolved** intent; an
unsubmitted form may be cleared by lock/logout/role switch. Recovery needs retained
tab ciphertext and stable installation secret. Browser local clocks protect display
relative to their observed relationship; server session validity is authoritative.
No receiving edits/reversals, broad search, new policy, QC/Finance, devices, printing,
factory UAT, production TLS/deployment or P3 is included. O-01 remains nonblocking
and is not automatically a P2 prerequisite. APR-045/N-01 history is unchanged.

## Execution evidence and handoff

Verification is recorded below after execution; planned checks are not claimed as
passes. Detailed test logs/receipts under ignored local `artifacts/tests/p2-*` are
not committed or assumed remotely available. Historical P1/I2 evidence remains
historical and is not added to fresh test totals.

## Executed verification — 2026-10-26

Pinned Windows commands, from repository root (pinned Node directory prepended to PATH):

```powershell
npm.cmd run preflight
npm.cmd run format:check
npm.cmd run lint
npm.cmd run boundaries
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test:unit
node --test apps/backend/dist/tests/unit/operator-lifecycle.test.js
node --env-file=.env.local artifacts/tests/p1-independent-environment.mjs
node --env-file=.env.local --test --test-concurrency=1 apps/backend/dist/tests/integration/identity.test.js apps/backend/dist/tests/integration/inbound.test.js apps/backend/dist/tests/integration/inbound-http.test.js apps/backend/dist/tests/integration/browser-http.test.js apps/backend/dist/tests/integration/p2-browser-http.test.js apps/backend/dist/tests/integration/inbound-recovery.test.js apps/backend/dist/tests/integration/receiving.test.js apps/backend/dist/tests/integration/receiving-integrity.test.js
node --env-file=.env.local --test --test-concurrency=1 apps/backend/dist/tests/integration/p2-browser-http.test.js
node --env-file=.env.local apps/backend/dist/tests/support/browser-server.js --controlled-clock
node --env-file=.env.local artifacts/tests/p2-browser-stock.mjs before
node --env-file=.env.local artifacts/tests/p2-browser-stock.mjs committed
node --env-file=.env.local artifacts/tests/p2-browser-stock.mjs replayed
node --env-file=.env.local artifacts/tests/p2-browser-stock.mjs final
node artifacts/tests/p2-validate-docs.mjs
git diff --check
```

- Final static/build checks pass. **217/217 unit**, including12lifecycle cases
  (9prior R-01/RV/R-02 plus3P2);5new P2 unit cases total include configuration and
  receiving-path recovery. Tests execute actual compiled application/editor in a
  VM DOM/time adapter; these are component tests, not browser E2E.
- **113/113 real PostgreSQL cases**, no failures/skips, across the eight named
  related suites. Includes6new P2 browser-HTTP cases; final6/6rerun overlaps those
  113, not six additional cases. Final audit-rollback assertions additionally
  check zero command outcomes/audits. The existing full357-case historical P1
  suite was not rerun. Server/domain/SQL policy is unchanged; relevant Identity,
  I1, browser, receiving, owner-lock revocation/expiry, crash, concurrency and
  Inventory rollback coverage was executed.
- Exact disposable environment verified: PostgreSQL18.6, UTF8, loopback55438,
  `navard_i1_test`, explicit test ACK, distinct development database and separate
  restricted runtime/DDL owner accounts, neither superuser/createdb/createrole.
- **14 real-browser scenario checks within one sequential session**, recorded in
  `artifacts/tests/p2-browser-receipt.md`: Warehouse login/roles, native requiredness,
 25line lookup, all11fields,2physical units on2lines with actual/original mismatch,
  explicit review with no stock yet, post-COMMIT response loss, simulated idle lock,
  cross-account isolation, same-actor login/reload/replay, canonical IDs/progress,
  second arrival with all5optional warehouse values omitted, UUID arrival lookup,
  Procurement visibility/pagination and actual server-expiry lock.
- Readonly PG snapshots prove first arrival adds exactly2units/ledger effects,
  replay preserves the same unit/lot/effect IDs and counts, and second arrival adds
  one unit. New stock is2100+2000+2000=6100kg from W1. Header W2 strings remain
  `06000.12500` and `002000.00100`; optional W3 `6000.1200` is absent on arrival2.
  Original first-line width1.200/weight2000 remains immutable versus actual1.250/2100.
  First line ends25accepted/5remaining. Receipt snapshots persist evidence;
  fixture data is disposable and subsequent tests reset it.
- Browser PROC LINES20+5 and RECEIVED_UNITS20+7 retain distinct timestamps,
 3shared arrival headers and no sibling/unlinked cargo/documents. Real screenshots
  were saved and visually inspected. No OS-sleep/8hour wall-clock wait is claimed;
  client accelerated time is separate from real server expiration/real PG time.
- Chronology: broad PG run preceded final display-only refinements; final6PG,
  unit/static and browser checks cover affected boundaries. Final native-grid
  original/actual columns and unit legend renumbering were additionally checked
  in a second real-browser session and saved as `p2-browser-final-review.txt/png`;
  no receiving command was sent there (fixture stayed26received). Actual compiled
  DOM add3/remove-middle/add and all final unit/static checks pass. No additional
  stock replay is claimed for that display check. Source fingerprints identify
  final delivery and the receipt explicitly distinguishes the two browser sessions.
Logs, screenshots, raw readonly stock snapshots and the fingerprint manifest are
**ignored/local only**, not committed or presumed available on another machine.
Historical P1 audits/FAIL reports, APR-043/APR-045 and accepted business documents
remain untouched. Distinct automated scope is217unit+113PG; component/focused
reruns and browser scenario checks are not added to that count.

## Self-review, scope and handoff

Self-review of the complete diff checked exact admission, current server roles,
post-async expiry/epoch guards, encrypted immutable receiving replay, original/
actual and optional states, W1/W2/W3, related-order isolation, timestamps, loading/
errors and dependencies. Corrections during development made document references
explicit in review, attached source-page times to selected original/progress rows,
and prevented duplicate visible unit ordinals after middle deletion. Expected
fixture/adapter/format/type issues were corrected; only successful final results
are reported above. No outstanding P2 BLOCKER/REQUIRED defect was found by this
self-review. This is not the separate fresh-context independent review or Owner acceptance.

Production changes: one local native receiving editor; existing app/HTML/CSS and
intent integration; paired placement config/authenticated WH projection; exact
browser routes/static asset. Tests/support/runner and narrowly relevant governance/
navigation/startup docs are the remaining changes. No dependencies, migration,
Identity policy, Procurement/I2/Inventory service, domain contract or SQL adapter
changes. P1 order completion branch/O-01 is unchanged. Existing R-01/RV/R-02 tests
remain passing. Local P2 commit is identified by Git history containing this page;
its parent is the exact starting baseline. Full hash is retained in the local
delivery report and user handoff, avoiding a circular self-hash in the commit.

| P2 review-readiness criterion | Status | Evidence |
| --- | --- | --- |
| WH personal login/navigation; PROC/SEC/CUST denial | PASS | P2 HTTP roles, Identity/browser suites, B01/B08 |
| Reference/UUID order lookup; canonical lines/progress | PASS | Existing I1 HTTP/lookup, editor component and B03/B13 |
| Eleven fields,6required/5optional, correct doc/unit scopes | PASS | Field trace, P2 HTTP exact/omitted fields, B02/B04/B11 |
| Actual arrival Jalali and exact decimals; F01 distinct from F19 | PASS | P2 HTTP/VM, raw PG snapshots, B04/B11 |
| Independent units, original/actual verification and explicit acceptance | PASS | P2 VM frozen review, I2 mismatch cases, B04/B05 |
| No stock before confirmation; sole IPS; W1 only; no W2/W3 allocation | PASS | B05/PG snapshots, I2/P2 rollback and stock assertions |
| Partial and subsequent arrivals, authoritative cumulative/remaining | PASS | P2/I2 partial tests, B11/B13 |
| Supported shared multi-order/documents and unlinked associations | PASS | Existing I2 multi-waybill cases, new P2 scoped arrival test, editor source |
| Immutable intent, duplicate prevention, response-loss/reload recovery | PASS | P2 VM/crypto/HTTP, B06/B09 and unchanged Inventory identities |
| Cross-account isolation; expiry/revocation and local sensitive clearing | PASS | Identity/I2 lock tests, all9prior lifecycle regressions, B07/B08/B14 |
| Origin/Host/CSRF/cookies/CSP/no-store/bounds/legacy compatibility | PASS | Existing8browser HTTP plus new P2 admission cases, unchanged controls |
| Canonical confirmed arrival and stock/actor/document traceability | PASS | P2 HTTP and B09/B10/B12/raw PG snapshots |
| Pagination exhaustion, separate page times, no sibling/unlinked leak | PASS | P2 scoped cursor test, R-02 regressions, B03/B13 |
| Named real-placement config prerequisite; no fabricated factory master | PASS | Paired-config unit case, WH-only session projection, missing-config UI |
| Persian/RTL, native controls, focus/review and safe DOM rendering | PASS | Source review, compiled editor, visually inspected real browser |
|400/401/403/404/409/422/503 semantics and uncertainty | PASS | HTTP/unit failure cases, P2 durable conflict/rejection/replay, B06/B14 |
| P1 behavior/business/module ownership preserved; no schema/dependency | PASS |217unit/113PG, Git diff, package/schema/service paths unchanged |
| Static/build/doc/link checks and local reviewable commit | PASS | Final logs, local Git delivery; no push/deployment |
| Separate fresh-context independent P2 engineering/security review | NOT VERIFIED | Next gate; self-review does not replace it |
| Explicit P2 Owner acceptance | NOT VERIFIED | Not requested/issued; P2 remains in_review |

P3, factory UAT, actual production placement provisioning, TLS/exposure/deployment,
opening balances, device/Finance/QC work remain excluded. Next action is a separate
fresh-context P2 independent audit, then explicit Owner decision. No P3 is started.

## Retained evidence SHA256

| Local artifact | SHA256 |
| --- | --- |
| artifacts/tests/p2-environment.log | B8A1760820643FB8F6CEA5734D29EA39D5EE08728418426B866101C90A7B1D88 |
| artifacts/tests/p2-preflight.log | 911DB367EFBD799F70EA272C8DDCA4FBCF4C3F00349DC2A60E1AED2F9E05B366 |
| artifacts/tests/p2-format-check.log | 27D7C47A550BF6D5DEE36EC6166EEBD95F3A1EB8FC4D880E1044C72EE49B8D52 |
| artifacts/tests/p2-lint.log | 006AF35967711E665FB9C8BB7FB35779E472273188C6C107277A6353E6274F7F |
| artifacts/tests/p2-boundaries.log | 2F87E55C179B8795FD982C6F48C0CCDEE010E6950E2FC9B7500464AEFBA73DD0 |
| artifacts/tests/p2-typecheck.log | 715B821F77544B0B09923284CA7074EB7C4FA426A6EF3F945EC107D121A6B24B |
| artifacts/tests/p2-build.log | 0A2A1867AC358DE596D6F90DBF86E8CE455F4C1323AFB1432011D5CF578A0E81 |
| artifacts/tests/p2-test-unit.log | C7FA396B2AB223E8DD3045D82B8CAF6DE5C73AA1E3D143DDC3E28E363720B88E |
| artifacts/tests/p2-lifecycle-final.log | A330F45B3CC17133D80564BC5D419CE3A3813B9679E21CCF20319419ABAB0F62 |
| artifacts/tests/p2-pg-regression.log | 54CD3ABF3F23E877A64623D7944BE7FBAB3A57E279DDD56A7EE2F1D3A43167FA |
| artifacts/tests/p2-http-final.log | BEB129BCC90603CEF5DAE89E5A32BB71CC177BD69C9A4CF75E010352769E8571 |
| artifacts/tests/p2-browser-receipt.md | B2FC3ABB826C078A9740144E3252AEAB9019B0C83ACBBEA1C8E824B21D93DF21 |
| artifacts/tests/p2-browser-canonical.png | 75824EE6F23536534D4ED065CF53F28B039DBFF96126C2D928DF71F5C7E1BCBF |
| artifacts/tests/p2-browser-stock-before.json | D9860CCE99320AA4241F2A37AB2A7A8F2E70EBB51D28B38464E9C47FBF15DA6F |
| artifacts/tests/p2-browser-stock-committed.json | D3EED977287DA2B8D9A9D52A370C66A15B6722C5DEE1EEBEAAC4FF76C637A340 |
| artifacts/tests/p2-browser-stock-replayed.json | 9DD497EF029010B1301215DC4B1C827D6C1D9C70CF0C2BD5541690D0827802C5 |
| artifacts/tests/p2-browser-stock-final.json | E0CF48CD69EB67D0579F0A6040463F03B252A2F9DCDC55DC021FEDD0CD134A98 |
| artifacts/tests/p2-browser-page-metadata.json | 2CC0402D1386F26EF5D1543424DFFD4D4C29C6FE1407ED8197D173013F877221 |
| artifacts/tests/p2-docs.log | D882B16DF60718D6C3D52D404E32DAF64ADDC86BED7C89ECCA0A4096482FCDCA |
| artifacts/tests/p2-source-hashes.json | E5E3FFE1A59A5B7EA5552335F403A899B014DBB187DA35A9F5F43944C477A262 |
| artifacts/tests/p2-browser-final-review.png | 57A24D32B31789FC4BB7BFFCAA777CA120FECAEE478071485E35425C59911D96 |
