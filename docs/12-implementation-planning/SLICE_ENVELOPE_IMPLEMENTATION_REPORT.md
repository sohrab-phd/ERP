---
id: IMPL-ENVELOPE-001
title: SLICE-ENVELOPE implementation and acceptance evidence
phase: 12-implementation-planning
status: accepted
version: 1.0.0
owners: [chief-solution-architect, delivery-lead]
depends_on: [APR-018, ADR-0011, ADR-0013, PLAN-ENVELOPE-PHYSICAL-001]
last_reviewed: 2026-10-04
approval: null
---

# SLICE-ENVELOPE implementation evidence

Subsequent Owner platform decision (2026-10-04): future validation is Windows-only;
Ubuntu/WSL/Linux testing is unnecessary and must not be resumed. Existing Linux
results below remain historical. Linux CI jobs are retired; automated Windows
static/unit checks remain, with mandatory PostgreSQL18.6 integration tests run
locally on Windows until Windows database CI is configured. All exact pins and
database acceptance semantics remain unchanged. The temporary Ubuntu test server
was stopped before the Owner's uninstall; committed code resides on D:.

SLICE-ENVELOPE IMPLEMENTATION: COMPLETE
Acceptance / Definition of Done: PASS
Architecture conformance: PASS
Independent implementation review: PASS
Unresolved implementation defects: NONE

Authority is the Owner's explicit current authorization recorded in
[APR-018](../00-governance/approved-baselines/APR-018-final-pre-implementation.md).
Implementation baseline: `e80a04b15ddf93451cc79ccf81722f564912596d`.
This is engineering verification of the completed slice, not invented human
post-implementation acceptance. The implementation commit containing this
report is identified by Git history; the final delivery message reports its hash.

Canonical gate implementationAuthorized=true; approvedBaseline references
APR-018; the matching local unlock is present and Git-ignored. This authorizes
only the accepted foundation. No next business slice, deployment or push.

## Delivered scope

Private npm root with apps/backend and packages/shared-kernel workspaces,
exact dependency pins and root v3 lock. Kernel owns public command/query,
trusted context, bounded parsing/canonical binding, result/rejection and
transaction/audit/outcome ports. Backend owns direct pg adapters, configuration,
allowlisted JSON logging, composition and a health-only node:http host. Empty
production command registry, denying authorization/recovery adapters: no
synthetic principal, business handler, command HTTP route, domain module or
Inventory/Balance/quantity write.

Exactly three production SQL migrations:

1. database/migrations/0001_kernel_schema.sql — kernel/schema migration ledger.
2. database/migrations/0002_audit_event.sql — append-only audit vocabulary and
   identity/decision constraints.
3. database/migrations/0003_command_outcome.sql — terminal composite scoped key,
   full binding, stable result, matching original-audit FK.

No business table or role/database/seed statement in production migrations.
Synthetic natural facts exist only in the dedicated test schema/fixtures.
Runtime login is distinct from DDL owner, lacks superuser/create-role/create-db,
and receives only schema usage and SELECT/INSERT on outcomes/audits.

One checked-out READ COMMITTED client owns lock, fresh post-lock lookup,
savepoint, original/related audit, outcome and commit. Known rejections roll
back handler and classifier effects; technical/uncertain failures are not
cached business results. Matching replay retains original stable outcome and
adds durable replay evidence. Conflicting occupied bindings never disclose the
winner. Decision time comes from the database. Bounded transaction abort first
invalidates the capability/discards the client, preventing late handler writes.
Lossy-restore fence is fail-closed until an authorized future reconciliation port.

## Actual runtime and deterministic installation

- Windows Node 24.21.0 / npm 11.19.0, exact official checksum-verified archive.
- Linux Node 24.21.0 / npm 11.19.0, exact official checksum-verified archive.
- TypeScript 6.0.3; pg 8.23.1; all remaining pins match TECHNICAL_FREEZE.
- Actual PostgreSQL 18.6, server_version_num=180006, UTF8, separate nonsuperuser
  test runtime/migration logins, actual acknowledged navard_erp_test owner.
- No upgrade from the freeze. Previously installed Node24.13/PG18.2 were not
  substituted for acceptance verification.
- Windows lock generation then npm ci passed: 116 installed,119 audited,
  reported 0 vulnerabilities. Isolated Linux npm ci from the existing cache
  independently installed the same lock:116 installed,119 audited,0 vulnerabilities.
  Dependency lifecycle scripts remain disabled; private workspaces have no scripts.
- The PG18.6 EDB Windows archive was unavailable and Docker's storage was
  read-only. A checksum-verified official PostgreSQL18.6 source was built in
  the existing Ubuntu developer environment, installed in the ordinary user's
  local directory, and served on loopback port55432 solely for tests.
  Build options without ICU/readline/zlib do not change the tested SQL/UTF8
  contract. No existing Windows PG service, ACL, native governance installer,
  shared ancestor or host enforcement mechanism was changed.

Official archive SHA-256 evidence:

| Archive | SHA-256 |
| --- | --- |
| node-v24.21.0-win-x64.zip | 158f7685b44de51f6c0df1d153526cbcd3e1bc739a8dfc607721cef75de9e541 |
| node-v24.21.0-linux-x64.tar.xz | fd8e59d5a511510f6a298afb548f18c7d2b1be404d8b4a27d94fbe49f56cb2d6 |
| postgresql-18.6.tar.gz | 983ee554ec53dbeb9b70797bef9fcf4e67e117e7e48ca1463cc80b3ff8e8ff3f |

Source URLs: [Node distribution](https://nodejs.org/dist/v24.21.0/),
[PostgreSQL source](https://ftp.postgresql.org/pub/source/v18.6/).

## Executed commands and results

At repository root using the exact pinned Windows runtime:

```text
npm install --package-lock-only --ignore-scripts
npm ci
npm run format
npm run clean
npm run build
npm run db:test:reset
npm run migrate -- --dry-run
npm run verify
```

verify executes the frozen preflight,format:check,lint,boundaries,typecheck,
test:unit,test:integration bodies. Every step passed with 46 unit and30 real
PostgreSQL integration cases:0failed,0skipped,0cancelled. Seven compiled unit
files and six integration files are mandatory; no skipped DB substitute.

Linux ran the same exact npm run verify against actual PG18.6: all checks,
46unit/30integration PASS,0skipped. A separate ignored product-only snapshot
also passed fresh npm ci,clean/build/preflight/format/lint/boundaries/unit with
the repository's actual ignore/LF policies. No parallel database fixture runs
were used; explicit multiple-client/process barriers exercise concurrency.

At the implementation commit the pinned workflow expressed Windows/Linux
unit/static jobs and PG18.6 integration; those commands passed locally, not
on remote GitHub. The later Owner platform decision removed Linux jobs.
Current CI is Windows install/static/typecheck-build/unit and a reliable
dependency advisory check; PG18.6 integration remains mandatory locally on
Windows until database CI is provisioned. No remote run or fresh native-Windows
database execution is claimed by this operating-model update.

Repository consistency also passes:286 Markdown artifacts,1591 local references
with no missing targets,14 non-generated JSON documents,262 unique artifact IDs,
ADR0011/0013 standalone records plus canonical inline ADR0012, all15 frozen
package script bodies,64 authorized physical artifacts, unchanged live OQ
answers/statuses, and matching canonical gate/APR-018/local unlock/baseline.
Working-tree and staged git diff --check are required before the local commit.

Additional generated local probes: actual production composition live/ready200,
POST /commands404 and orderly shutdown; one allowed import graph plus six
rejected deep-import/cross-relative/dynamic/cycle/kernel-pg/host-pg graphs.
The AST boundary check covers38 TypeScript files and public exports.

## Acceptance trace

All physical-design intents map to executable tests below. Paths are relative
to repository root; shared-kernel tests are in packages/shared-kernel/tests/unit,
backend unit/integration tests in apps/backend/tests. These are descriptive
test names, not a newly minted business TEST-* catalogue.

| Frozen intent | Executed proof | Result |
| --- | --- | --- |
| Determinism/boundaries | Exact preflight/install/lock, clean build/typecheck/lint/format; import graph and rejection probes | PASS Windows/Linux |
| First accept | execute.test / replay-audit.test first accept: one synthetic fact, outcome and original audit | PASS |
| First reject | execute.test / transaction.test savepoint rollback, durable reject and replay | PASS |
| Replay | replay-audit.test accepted/rejected first outcomes; stable binding/result; one replay audit/no handler | PASS |
| Binding conflicts | binding.test and replay-audit.test every command/version/target/material/precondition/principal dimension; exact canonical bytes even forced equal hash | PASS |
| Scope | binding.test / outcome-concurrency.test full installation/authority scope key isolation; principal excluded from PK | PASS |
| Parallel | outcome-concurrency.test matching/mismatching contenders, predecessor abort/fresh lookup, forced lock collision | PASS real PG |
| Business duplicate | Synthetic named natural-constraint mapper, new-key duplicate versus owner conflict; mapper-write rollback regression | PASS |
| Transaction errors | transaction.test real deadlock/serialization/COMMIT serialization, separate lock/statement/application deadlines and checked-out socket loss | PASS |
| Audit | replay-audit.test atomic first/replay/related audit failure; original composite identity and taxonomy constraints; DB clock equality | PASS |
| Crash/uncertain | crash-retry.test six precommit process cuts, actual lost COMMIT acknowledgment proxy, same-key primary recovery and unavailable primary | PASS real processes/PG |
| Recovery | execute.test / replay-audit.test unreconciled lossy-restore admission fence; no absent-row automatic reexecution | PASS |
| Parsing/redaction | canonical-json/admission/binding unit files, config/logger/http unit files; duplicate names/UTF8/scalars/depth/size/credentials | PASS |
| Migrations | migration.test concurrent runners, fresh/second run, dry-run no DDL, precise drift/inventory rejection, PG22012 partial-file and ledger rollback | PASS |
| Permissions/reset | permissions.test runtime mutation/DDL denied, complete result/original identity constraints, wrong ACK/database/mode/owner refused | PASS |
| Host | http-host.test routes/body/failure/timeouts/owned socket regression; actual PG production-composition smoke and shutdown | PASS |
| Retention | No purge/TTL/key recycling; open-policy/lifetime/retired readable-contract and result reader version tests | PASS |
| Catalogue/scope | Only frozen64 source/config artifacts including LF correction, no business module; public ports/test-only fixtures, dependency review | PASS |

All audit families remain available. First GUARD_OPEN_POLICY rejection writes
AUD-CMD-REJECTED plus related AUD-OPEN-POLICY in the same transaction; retry
writes only AUD-CMD-REPLAYED. AUD-SOD/AUD-REVERSAL are retained vocabulary,
not implemented business workflows.

## Corrections and independent review

Independent read-only reviewer /root/baseline_review reviewed kernel, PostgreSQL,
security, tooling, scope and final executed evidence. Final verdict:
Independent SLICE-ENVELOPE implementation review PASS; unresolved blockers NONE.
Runtime results were executed by root and explicitly reported as local evidence,
not invented reviewer executions or a remote CI result.

Valid findings repaired before completion:

- Rejection classifier could retain its own tentative writes: unconditional
  final savepoint rollback; unit and real PG regression pass.
- Checked-out health connection error could crash the process: owned listener,
  idempotent discard/release; readiness503/liveness200 regression pass.
- Required audit vocabulary/related open-policy evidence omitted: complete
  taxonomy, original uniqueness preserved, related atomicity/replay tests pass.
- Child migration test incorrectly escaped JS and equal timeout bounds made
  tests ambiguous: safe JS literal serialization and precise expected error
  assertions, separate lock/statement bounds and finally cleanup.
- Boundary checker path classification used an ancestor substring: owner-relative
  paths now enforce the persistence exception; negative fixtures pass.
- Tooling acquired pools/clients outside cleanup or lacked owned error listeners:
  acquisition inside try/finally and scoped listeners, without an extra mechanism.

The only physical-tree addition is product-only .gitattributes, recorded in
the design/local grant because Windows autocrlf otherwise changes raw SQL
checksums and formatter behavior. This preserves, rather than normalizes away,
the binding raw checksum. All root package script bodies and dependency versions
match the freeze. No other architecture redesign or scope expansion.

## Limits and follow-up

Remote workflow invocation awaits separately authorized push; local CI-equivalent
checks passed. No production deployment/identity provider/business routes or
operations are claimed. Actual authentication/ACT mapping, domain guards,
external devices, UAT/cutover and other live residuals remain prerequisites of
their dependent later capability slices. A separate Owner decision is required
before any next business slice. No unresolved defect in this authorized foundation.
