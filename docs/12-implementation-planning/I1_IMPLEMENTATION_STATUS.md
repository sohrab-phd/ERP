---
id: IMPL-I1-001
title: I1 operational purchase orders catalogues and warehouse lookup implementation evidence
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [delivery-lead, chief-solution-architect, security-architect]
depends_on: [APR-038, APR-037, PLAN-I1-ACCEPTANCE-001, PLAN-I1-REFERENCE-001, PLAN-I1-CALENDAR-RECEIPT-001]
last_reviewed: 2026-10-21
approval: APR-038 bounded implementation authority; Owner capability acceptance pending
supersedes: null
---

# I1 backend implementation and delivery evidence

Verification status: ENGINEERING VERIFIED; required findings closed; ready for
separate Owner capability acceptance. Authority is the
actual Owner [APR-038 implementation instruction](../00-governance/approved-baselines/APR-038-i1-implementation-authorization.md),
from local b47d0eb1d0a36032b311c628818846501cc4248d, following accepted I1-D01–D14
in [APR-037](../00-governance/approved-baselines/APR-037-i1-detailed-design-acceptance.md).
No push or remote presence is inferred. Eleven capabilities remain Owner accepted;
I1 engineering delivery is not a twelfth Owner-accepted capability, UAT or deployment.

## Implemented factory workflow and boundaries

An individually authenticated, currently granted organizational ACT-PROC registers
a pre-arrival seller order and its complete original line array atomically. The
raw seller reference and entered Jalali date remain original evidence. Every line
has its own server UUID and ordinal even when specifications/item numbers repeat
or item number is absent. The [twelve-field contract](I1_PURCHASE_ORDER_DOMAIN_DESIGN.md#exact-twelve-field-contract)
retains exactly7required/5optional purchasing fields, m/mm/m dimensions, one-unit
W1 and ordered physical-unit count. No supplier master or additional mandatory
factory field is introduced.

Both ACT-PROC and ACT-WH read/add/select reusable Material Type, Quality/Grade and
Color. Catalogue creation is independently durable: an unused successful option
survives a later failed order; exact duplicate rejection is resolved by authorized
exact selection, not accepted get-or-create or recycling a rejected key. Labels
are exact and immutable; visual variants may be separate. R1 never normalizes
catalogues. Business Material Type has no technical Inventory class/OTHER mapping.

Both roles retrieve the original complete order by approved-equivalent seller
reference or technical ID. WH has no original-order write operation. Reads exclude
creator/request/key/binding/comparison-key/private documentary/stock/arrival fields.
SEC/customer/unrelated/customer-bound/temporary/forged contexts gain no access.
Current personal grants, revocation and trusted Identity context identity remain
mandatory before/after waits and before disclosure. No employee name is a guard.

I1 creates no Inventory Unit, Material Lot, Goods Receipt, Ledger/Balance,
reservation, Sales, production, shipping or financial effect. Existing completed-
purchase/proforma evidence and no-PO/no-ticket manual intake remain independent.
Stable order/line identities permit later additive I2 links but do not deliver
receiving, discrepancy capture, physical codes, progress or stock admission.

## Executable source and HTTP surface

| Area | Actual files and responsibility |
| --- | --- |
| Domain/contracts | [inbound-contracts.ts](../../apps/backend/src/modules/procurement/inbound-contracts.ts), [inbound-service.ts](../../apps/backend/src/modules/procurement/inbound-service.ts), [public exports](../../apps/backend/src/modules/procurement/index.ts): closed commands/queries, full originals, authority, independent lines, scoped catalogue selection, source duplicate semantics and pre-insert full projection |
| Exact values | [inbound-values.ts](../../apps/backend/src/modules/procurement/inbound-values.ts): frozen explicit R1 transform, exact string numeric/text validation, finite Jalali profile and separate BigInt Procurement total |
| Persistence | [inbound-store.ts](../../apps/backend/src/infrastructure/postgresql/inbound-store.ts): opaque existing transaction, both scope predicates, typed immutable joins, signed hash ordering, parameterized inserts and generated-key parity |
| Composition/transport | [composition-root.ts](../../apps/backend/src/composition-root.ts), [inbound-http.ts](../../apps/backend/src/transport/inbound-http.ts), [host dispatch](../../apps/backend/src/transport/http-host.ts): exact v1 contracts/current policies, distinct bounded routes; old purchasing routes/readers unchanged |
| Database | [0017_operational_purchase_orders.sql](../../database/migrations/0017_operational_purchase_orders.sql): three additive Procurement sources, indexes/checks/FKs/uniqueness, frozen pure helper and deferred completeness |
| Tooling | [migration inventory](../../tools/db/migrate.mjs), [SQL lexical guard](../../tools/db/sql-guard.mjs), [restricted reset](../../tools/db/reset-test.mjs), [fixture](../../apps/backend/tests/support/database-fixture.ts), [owner boundaries](../../tools/build/check-boundaries.mjs), [unit](../../tools/test/run-unit.mjs)/[integration](../../tools/test/run-integration.mjs) runners |

| Method / route | Operation / version | Current organization roles |
| --- | --- | --- |
| POST /purchasing/operational-orders | RegisterOperationalPurchaseOrder v1; operational-purchase-order UUID target | ACT-PROC |
| POST /purchasing/inbound-catalogues | AddInboundCatalogueOption v1; inbound-catalogue-option UUID target | ACT-PROC / ACT-WH |
| POST /purchasing/operational-orders/lookup | GetOperationalPurchaseOrderByReference v1; raw orderReference body | ACT-PROC / ACT-WH |
| GET /purchasing/operational-orders/{orderId} | GetOperationalPurchaseOrder v1; no body/scope override | ACT-PROC / ACT-WH |
| POST /purchasing/inbound-catalogues/query | ListInboundCatalogueOptions v1; exactLabel or UUID cursor/page | ACT-PROC / ACT-WH |

Each route requires exactly one x-erp-role and one personal bearer session, no
Origin/encoded body/transfer encoding. Command envelopes retain the existing six
members and empty preconditions. Successful command results are minimal IDs/count;
the three queries return authorized business projections. Existing safe protocol
semantics remain:200accepted/replay,422durable business rejection,409changed-bound
intent,403admission/role denial,401session denial,404scoped absent/foreign and503
technical/retryable/uncertain. No raw input/SQL/foreign fact is echoed in errors.

## Database identity, atomicity and recovery

The factory is the configured installation; authority_scope=installation_id is
checked on all three new tables. operational_purchase_order preserves order_reference;
order_reference_key is GENERATED ALWAYS STORED from a restricted, fixed-search-path,
IMMUTABLE STRICT PARALLEL SAFE SECURITY INVOKER v1 helper. The unique installation/
key constraint is authoritative, not a precheck. Only boundary U+0020, ASCII A–Z,
the two approved digit sets and specified Arabic Yeh/Kaf change in the comparison
working copy. Raw source, internal spaces/zeros/punctuation/NBSP/zero-width/other
Unicode stay unchanged/significant. App derivation, locks, DB generation and lookup
agree; caller-supplied keys/profile fields fail closed.

The immutable header freezes N. Child scoped parent-count FK, positions1..N and
unique positions plus a deferred SELECT-only header completeness trigger require
exactly all declared independent lines at COMMIT. Insert/select-only runtime rights
prevent source mutation; the complete bounded positions prevent later append.
Catalogue references are typed same-scope FKs. No historical migration is edited.

Reuse existing kernel key lock → Identity rows → complete signed sorted owner hash
set → source constraints, current checks, handler savepoint, durable outcome and
atomic audit. Distinct command keys with an equivalent seller number conflict;
same-key changed raw payload conflicts even when R1-equivalent. Only named immediate
23505 cases are mapped after savepoint rollback and surviving scoped winner checks.
Unknown constraints/deadlocks/timeouts/audit or persistence errors remain technical.
Deferred COMMIT failures use the existing conservative uncertain handling and
original-key recovery, never a fabricated durable rejection or a weakened guard.
Unknown COMMIT resolves using the original principal/scope/key/target/full payload.

## Accepted capacities and verified environment

- Positive exact dimensions:20integer/18fraction digits; source trailing zeros
  retained; width/length m, thickness mm. Positive whole W1/count<10^20. No float,
  implicit rounding/conversion or work proportional to ordered count.40/43digit
  derived totals remain Procurement evidence, never Inventory Kg or posting input.
- Explicit Jalali YYYY-MM-DD, direct validated Y/M/D/profile,1206–1498. Business
  date is separate from trusted recording time; unsupported profile gets its fixed
  tag, no server-today/clamp/timezone conversion. [Calendar receipt](I1_JALALI_PROFILE_SOURCE_RECEIPT.md)
  records independent full293year/71leap source verification and107016valid-day proof.
- 1–128lines; applicable text128Unicode scalars AND512UTF8bytes; no truncation.
  Order body2..262144bytes/5s/16active; old and other POST readers remain4096bytes.
  Full authorized HTTP data projection<=262144bytes is serialized/preflighted before
  source insertion, including IDs/labels/escaping/unit/calendar metadata. Every
  committed order remains fully readable. Catalogue pages default50/max100.

Installed defaults initially differed (Node24.13.0/npm11.6.2, PostgreSQL18.2).
Exact pinned Windows Node24.21.0/npm11.19.0 and PostgreSQL18.6 archives were downloaded
into ignored test artifacts and checksum-verified, without changing the existing
service. Node ZIP SHA256158f7685b44de51f6c0df1d153526cbcd3e1bc739a8dfc607721cef75de9e541;
PostgreSQL ZIP SHA256e2246ba91d22345bc3d017586c09ede52d9df180b1eeb480f050445f1cad84e2.
Sources: [Node release](https://nodejs.org/en/blog/release/v24.21.0),
[EDB checksum confirmation](https://github.com/EnterpriseDB/edb-installers/issues/746).
An isolated loopback55438cluster was initialized with dedicated test/dev databases,
separate restricted migration/runtime roles and ignored .env.local credentials.
Actual pre-implementation probe established server_version_num180006/UTF8, C equality,
accepted helper properties/privileges, STORED raw/key behavior and equivalent23505;
the compatibility schema/role/data were rolled back. Production was not probed.

## Validation and independent review

Executed on Windows with Node24.21.0/npm11.19.0 and isolated real PostgreSQL18.6:

| Actual check / command | Final result |
| --- | --- |
| `npm run preflight` | PASS; exact frozen runtime/package baseline |
| `npm run build` (`tsc -b --pretty false`) | PASS; production and test TypeScript |
| `npm run format:check` | PASS; all matched files |
| `npm run lint` | PASS; zero warnings |
| `npm run boundaries` | PASS;151source files, owner/import graph |
| `npm run test:unit` |184PASS,0failed/cancelled/skipped; includes7new value/calendar cases and SQL guard regressions |
| `npm run test:integration` |305PASS,0failed/cancelled/skipped;1284189.7712ms; all260previous cases plus45I1 cases |
| `node --env-file=.env.local --test --test-concurrency=1 apps/backend/dist/tests/integration/inbound-additional.test.js` |5PASS,0failed/cancelled/skipped;14260.5521ms; four earlier proof cases plus the final added nonempty-source preservation case |
| Earlier focused HTTP/additional correction run |9PASS,0failed/skipped;30030.3827ms; subsequently included in full/final proof |
| Documentation metadata/links/trace/source checks |26changed/new Markdown pages;1326local targets and35local fragments resolve;60unique IDs,28base/12R1 families;23historical source/register/migration files unchanged |
| Local Graphify refresh |PASS;0.9.79, network blocked,557tracked files/5007nodes/11257edges; ignored local output only |
| Working and staged `git diff --check` |PASS; no credential/generated/dependency/historical-migration changes staged |

The final five-case run followed the full suite because its last test was added
while the full suite was already executing its compiled four-case predecessor.
No production code changed between those runs. This is305full-suite plus5focused
executions, not a claim that a306-case full command was run. Across them,306distinct
integration cases are verified, including all260prior capability cases and46new I1
cases. The final source runner includes all five additional cases for future runs.
Local ignored evidence: artifacts/tests/i1-full-integration.log,
i1-final-additional.log, i1-final-unit.log and i1-http-additional.log.

Real PostgreSQL evidence covers authoritative generated identity and exact app/DB
parity, independently authenticated equivalent-reference/catalogue races, all293
Jalali year flags, deferred completeness/COMMIT failures/savepoint rollback,
restricted runtime permissions, both-role security/cross-scope/current authority,
revocation during actual key/owner waits, real deadlock/timeout handling, ten actual
Windows child-process crash windows, and genuinely dropped confirmed-COMMIT replies
for both commands. Recovery reuses the original actor/key/target/bound raw payload.
No mocking substitutes for the SQL/transaction/constraint behavior being asserted.

Independent engineering/security/database/test review was performed by a reviewer
who did not author the implementation. Its final static assessment is PASS; no open
required finding or known high/critical defect. The reviewer also inspected the final305/5/184log summaries. Static review does
not itself prove runtime results; the parent executed the checks above. Findings and closure:

| Finding | Class | Correction and executable evidence |
| --- | --- | --- |
| I1-REV-01 |MEDIUM required improvement |Admitted-v2 binding, raw array order and optional-presence proof; final additional test1 PASS |
| I1-REV-02 |MEDIUM required improvement |Actual signed-hash order/opposed arrays and controlled distinct-resource collision; final additional tests3/4 PASS |
| I1-REV-03 |MEDIUM required improvement |101durable options, both-role default50/max100 stable pagination and exact selection; final additional test2 PASS |
| I1-REV-04 |LOW conformance correction |Explicit pg_catalog helper qualification, final0017 freshly reapplied before full305PASS |
| I1-REV-05 |LOW required documentation accuracy |Checklist/current-phase corrected from historical unapproved execution state to actual APR-038; independent re-review PASS |

The reviewer also checked the fifth nonempty-source regression and exact60-ID
field/actor mapping. All26foreign source tables are byte-equivalent across accepted
and rejected I1 commands after real manual stock/completed-purchase/proforma setup.
Existing procurement documentary and operational orders can share seller text
without being automatically linked or reinterpreted. The final boundary check also
caught a unit test's private import, corrected to the existing public Procurement
index; build/unit/boundaries and final format/lint subsequently PASS.

No dependency/lockfile change or new framework was introduced. A fresh dependency
advisory audit was not run; no new advisory-clean claim is made. Browser-only upload,
SSRF and UI rendering are outside this backend surface, not implicitly certified.

The environment file is never printed or committed. Root commands run with the
workspace-local pinned Node/npm first on PATH; DB commands load ignored .env.local.
Real tests use the acknowledged isolated navard_i1_test and a distinct dev DB,
verified owner/runtime identities, no superuser/CREATEDB/CREATEROLE runtime grants.
Local test artifacts/logs are ignored, not published customer or credential data.

One necessary tooling correction lets the migration lexical guard track balanced
CASE…END expressions without admitting standalone transaction END/BEGIN/COMMIT.
Regression guard tests exercise this; SQL functions/transaction ownership and old
migration checksums remain unchanged. This is an engineering adjustment within
APR-038, not an accepted-business-rule redesign or shared-kernel rewrite.

## Requirement coverage, exclusions and next action

The [60-ID implementation trace](I1_IMPLEMENTATION_TRACE.md) preserves every25workflow,
23field and12supplemental ID, distinguishing I1 delivery/guards from deferred I2.
It maps all A01–A28 and R1-T01–T12 families to executable cases; test names/case
families are not a new factory requirement register. Source004–006 and original
Step1/23field/S01–S12 evidence remain unchanged.

I2 B02unit codes/legacy identity,B03product number,B04document grain,B05changed-W1
provenance,B06wrong/excess/unordered acceptance,B07receiving representation,
B08sensitive receiving reads,B09custody/evidence/escalation stay OPEN at their
affected scope. Technical material mapping precedes later stock admission; B10
historical links remain deferred. No receiving/progress/physical units/W2/W3,
PO amendment/cancel/backfill, catalogue rename/delete/merge, UI, QC, devices,
settlement/corrections, factory UAT or deployment. No blanket OQ-011/OQ-019 closure.

Stop after verified local I1 commit for Owner review. Do not push or start I2.
Formal I1 capability acceptance remains the Owner's separate decision.
