---
id: PLAN-ENVELOPE-PHYSICAL-001
title: SLICE-ENVELOPE Physical Design
phase: 12-implementation-planning
status: in_review
version: 0.2.0
owners: [chief-solution-architect, delivery-lead]
depends_on: [ADR-0011, ADR-0013, PLAN-TECH-001, REPO-LAY-001, REPO-DEP-001, GOV-SLICE-HOMES-001, SEC-AUD-001]
last_reviewed: 2026-10-04
approval: null
---

# SLICE-ENVELOPE physical design

Frozen delegated technical specification, not human baseline/implementation
approval. implementationAuthorized=false; approvedBaseline=null; unlock absent.
No tree/manifests/source/migrations/CI are created by this Markdown.

Current accepted REPO-LAY-001 uses logical labels explicitly, not required
physical folder names. ADR-0013 chooses apps/packages and maps host-backend to
apps/backend, kern-command to packages/shared-kernel, Identity/Audit persistence
adapter to backend infrastructure. APP-MOD-001/DOM-OWN-001/REPO-DEP-001 remain
normative. COMMAND_IDEMPOTENCY_SPEC controls bindings/results/audits/locking.

SLICE-ENVELOPE is foundational. No business command, Ledger/Balance/quantity,
factory identity, real auth provider, report/live/print/worker exists here.
One deployable backend; no services/distributed infrastructure.

## Exact future source tree / proposed first human write grant

Paths below are exact future artifacts, plus explicitly named generated output.
No product file is authorized now.

```text
Design-ERP/
  package.json
  package-lock.json
  .node-version
  .npmrc
  .gitignore
  .env.example
  tsconfig.json
  tsconfig.base.json
  eslint.config.mjs
  .prettierrc.json
  .github/workflows/verify.yml
  apps/backend/
    package.json
    tsconfig.json
    src/main.ts
    src/composition-root.ts
    src/config.ts
    src/transport/http-host.ts
    src/transport/http-errors.ts
    src/infrastructure/postgresql/pool.ts
    src/infrastructure/postgresql/transaction.ts
    src/infrastructure/postgresql/outcome-store.ts
    src/infrastructure/postgresql/audit-store.ts
    src/infrastructure/logging/json-logger.ts
    tests/unit/config.test.ts
    tests/unit/http-host.test.ts
    tests/unit/logger.test.ts
    tests/integration/transaction.test.ts
    tests/integration/outcome-concurrency.test.ts
    tests/integration/replay-audit.test.ts
    tests/integration/crash-retry.test.ts
    tests/integration/migration.test.ts
    tests/integration/permissions.test.ts
    tests/support/database-fixture.ts
    tests/support/synthetic-command.ts
    tests/support/crash-child.ts
  packages/shared-kernel/
    package.json
    tsconfig.json
    src/index.ts
    src/envelope/command.ts
    src/envelope/query.ts
    src/envelope/result.ts
    src/envelope/admission.ts
    src/envelope/binding.ts
    src/envelope/canonical-json.ts
    src/envelope/execute.ts
    src/envelope/guards.ts
    src/envelope/ports.ts
    src/security/execution-context.ts
    src/audit/audit-event.ts
    tests/unit/binding.test.ts
    tests/unit/canonical-json.test.ts
    tests/unit/execute.test.ts
    tests/unit/admission.test.ts
  database/migrations/
    0001_kernel_schema.sql
    0002_audit_event.sql
    0003_command_outcome.sql
  tools/build/preflight.mjs
  tools/build/clean.mjs
  tools/build/check-boundaries.mjs
  tools/test/run-unit.mjs
  tools/test/run-integration.mjs
  tools/db/migrate.mjs
  tools/db/reset-test.mjs
```

Generated future scope: apps/backend/dist/**, packages/shared-kernel/dist/**,
each .tsbuildinfo, root node_modules/**, artifacts/tests/**. Ignored, not committed
source or baseline authority. .gitignore changes only these outputs and .env.local/
secret exclusion. .cursor/.codex/gate/unlock/approval evidence excluded from
product grant; governance docs follow delegated authority, not authorization edits.

## Workspace/package/build contract

Private root name @navard/erp, workspaces ["apps/backend","packages/shared-kernel"].
Private ESM @navard/shared-kernel exports only "." to dist/src/index.js plus
dist/src/index.d.ts. Private ESM @navard/backend is composition/adapter owner;
internal dependency @navard/shared-kernel "0.1.0" equals workspace version and
npm workspace symlink. Root dev dependencies pinned in TECHNICAL_FREEZE; backend
runtime dependency pg 8.23.1. No workspace scripts or nested lockfiles.
Root TS solution references kernel and backend. Each rootDir ".", outDir "dist",
composite/declaration true, tsBuildInfoFile ".tsbuildinfo", includes src/tests;
backend references kernel. ESM import filenames use .js suffix after TS build.
No bundler, runtime transpiler or deep source imports.

| Owner | Ownership / dependencies |
| --- | --- |
| shared-kernel (kern-command) | Envelope/admission/binding/result/execution ports; Node stdlib only, no pg/http/backend/domain |
| backend composition (host-backend) | Config, trusted ports, explicitly registered commands, health transport; kernel public exports + its adapters |
| backend PG adapter (Identity/Audit persistence) | kernel outcome/audit/transaction SQL only; pg+kernel; no domain tables |
| test harness | Synthetic handlers/facts; public ports; no registration from production composition |
| future mod-* packages | One write owner from DOM-OWN-001; public command/query ports only, no cross-owner SQL |

Future modules map: mod-sales/procurement/inventory-posting/production/shipping/
finance-lite/identity-audit/reporting/integration/master-data under packages/.
Quality remains future/outside MVP; no mod-portal write owner. They are not
created by first grant. Sales/Procurement/Production/Shipping command ACT-IPS;
never import/write its Ledger/Balance/quantity internals. Reporting reads published
facts, genealogy projection rebuilt from all source facts, not Ledger alone.
All DATA-TX-001 bundles stay one transaction across owner ports.

Boundary checker covers actual imports including reexports/dynamic literal imports;
nonliteral imports rejected, explicit export surface, no cycles/cross-relative
imports. Runtime pg client stays behind opaque transaction context. Handlers
cannot commit/rollback/use pool. Later owner adapters may share the same
connection via typed ports without cross-owner persistence access.

## Host and envelope

Composition validates config, creates pool/persistence/logger/trusted-context
ports, empty production business registry, health host. GET /health/live is
process status; GET /health/ready bounded DB connectivity only. No POST /commands,
public synthetic handlers or test principal shortcut; other routes safe 404/405.
Command/query service in-process ports are acceptance-tested with fixture contexts.
Next identity capability provides real auth before business routes.

Request contract extends APP-ENV-001: catalogue command + positive contract_version,
UUID v4 idempotency_key, typed target, command payload/material preconditions,
separate request/correlation metadata. Principal issuer/subject, current ACT-role,
customer/site authority scope derive exclusively from trusted context.
The envelope field is exactly `contract_version`; persistence column
`command_version` stores that same value. It is not a second request field or
an independently mutable version. Typed in-process properties preserve this
one-to-one contract mapping.
Client actor_role/actor_identity values cannot authorize. Temporary identity
rejects GUARD_ACTOR. Future retry workers preserve commander and key.
Queries are scope-filtered read-only snapshots; no outcome or business fact write.

Stable result follows APP-ENV-001: outcome accepted/rejected, command/key,
accepted fact_identity/source_state/target_state/event as owner defines;
rejected family/open_item/message. Save stable result without replayed/request
correlation wrapper. Replay sets replayed=true around original accepted/rejected
result. Same occupied binding mismatch returns nondisclosing GUARD_CONFLICT.
Admission failure and retryable/uncertain infrastructure status are separate
execution results, not durable business rejection. No HTTP status catalogue is
needed before business transport routes; health uses 200/503 and 404/405 errors.

## Database objects and constraints

Production schema kernel only. Migration role owns DDL; runtime role USAGE,
SELECT/INSERT outcome/audit, no UPDATE/DELETE/TRUNCATE/CREATE/role/database rights.
Audit access via RBAC application read port, not customer direct DB access.
Migrations run a distinct login; application is not owner/superuser. These are
normal application privileges, no OS containment.

| Object | Exact physical contract |
| --- | --- |
| kernel.schema_migrations | version text PK, sha256 char(64) NOT NULL, applied_at timestamptz NOT NULL; migration role only |
| kernel.audit_event | event_id uuid PK; execution_id uuid NULL; event_kind text NOT NULL; installation_id uuid NOT NULL; authority_scope_id uuid NULL only failed binding; idempotency_key uuid NULL only unbound admission; principal_issuer/subject text nullable together only failed bind; actor_role text nullable only unbound role; command text nullable only invalid/unbound envelope; command_version integer nullable only unbound version; request_id uuid NOT NULL; occurred_at timestamptz NOT NULL; family/open_item/fact_identity/source_state/target_state/customer_scope text nullable by event; safe_details jsonb NOT NULL default{} |
| kernel.command_outcome | installation_id uuid, authority_scope_id uuid, idempotency_key uuid composite PK; execution_id uuid UNIQUE NOT NULL; principal_issuer/subject text NOT NULL; command text NOT NULL; command_version integer NOT NULL; target_kind text NOT NULL; target_id text NOT NULL; canonicalization_version integer NOT NULL; canonical_bytes bytea NOT NULL; payload_sha256 char(64) NOT NULL; result_schema_version integer NOT NULL; outcome_kind text NOT NULL CHECK ACCEPTED/REJECTED; family text nullable; open_item text nullable; result jsonb NOT NULL; decision_audit_kind text NOT NULL; first_request_id uuid NOT NULL; completed_at timestamptz NOT NULL; original_audit_id uuid UNIQUE NOT NULL FK audit_event(event_id) |

UUID key validates lowercase RFC4122v4 at admission; PostgreSQL CHECK uses
canonical text version4/variant bits. Installation/scope/execution/audit UUID
must be nonnil. Length/JSON/canonical size constraints mirror spec: body and
canonical/result 256 KiB, principal issuer/subject 256 UTF-8 bytes, command 128,
target kind 64, target ID 256, positive int32 versions, lowercase SHA-256 hex.
Canonical_bytes size/hash validated by adapter before INSERT; DB enforces length
and lexical checks. No pgcrypto extension needed. Accepted family NULL; rejected
family required from closed guard enum; open_item
required for GUARD_OPEN_POLICY and absent otherwise; saved result.outcome/command/
key/family match columns (result values lower-case; database outcome kind upper-case).
No UPDATE path, PENDING/claim row/lease/reaper.

Audit original decision events AUD-CMD-ACCEPTED/AUD-CMD-REJECTED require execution,
full key, principal and actor-role fields nonnull. Partial UNIQUE(execution_id)
WHERE event_kind IN ('AUD-CMD-ACCEPTED','AUD-CMD-REJECTED') yields one original.
Audit has UNIQUE(event_id,execution_id,installation_id,authority_scope_id,
idempotency_key,principal_issuer,principal_subject,event_kind). Outcome stores
decision_audit_kind CHECK matched to outcome_kind, and its composite FOREIGN KEY
(original_audit_id,execution_id,installation_id,authority_scope_id,idempotency_key,
principal_issuer,principal_subject,decision_audit_kind) references that full audit
identity. Nonnull outcome fields guarantee MATCH SIMPLE cannot skip the check.
No reverse audit-to-outcome FK or cyclic insert dependency.
Replay uses AUD-CMD-REPLAYED with original execution, a new event/request ID.
AUD-CMD-CONFLICT is a safe occupied-key attempt; no replacement original.
AUD-CMD-ADMISSION-DENIED handles generic unbound admission; AUD-AUTHN-FAIL may
have no bound principal. ADR-0011 explicitly extends SEC-AUD-001 with these two
attempt kinds; all original taxonomy kinds remain. Role/customer scope stored
as taxonomy requires. Identity/key/command nullable fields occur only for unbound
failed admission; optional event-specific fact/state/scope fields follow taxonomy.
No raw payload/result/credential in audit safe_details; role changes are current
authorization, not a second key namespace or a mutable principal binding.

PK principal is deliberately excluded: different principal on same installation/
scope/key is conflict, not another successful namespace. No per-process memory
dedup or automatic deletion. Lifetime retention/no key reuse; privacy-minimized
nonsecret canonical bytes/results only. Later retention change requires ADR.

## Transaction/concurrency/crash algorithm

One checked-out pg client, READ COMMITTED BEGIN, SET LOCAL bounds.
Trusted admission/current access before locking/disclosure.
Compute two signed int32 advisory lock words from the first 8 bytes of SHA-256 of
versioned length-prefixed installation/scope/key. pg_advisory_xact_lock(a,b).
Hash collision only serializes; full tuple/binding determines identity.
Separate SQL SELECT after lock gets fresh snapshot after a waiter commits.
Existing exact binding -> original terminal replay after access recheck and
durable replay audit; mismatch -> safe conflict attempt audit no original change.
Absent -> SAVEPOINT before handler; evaluate once. Known deterministic business
rejection rolls back handler effects to savepoint, saves rejected outcome/audit;
accepted facts, original audit and outcome all commit together. Technical PG errors
40P01/40001/timeouts/connectivity/unknown COMMIT never stored as business rejection.
No accept before COMMIT. Audit failure prevents first result commit; replay
audit failure returns technical result, preserves original. Unique PK is last defense;
unexpected collision rolls back before resolver, not overwrite.
Uncertain retry uses the same bound key against the primary, never a new key or
guess about freshness. After lossy restore an absent row does not prove no execution;
admission fence and reconciliation
per spec, no exactly-once claim across unreconciled lost history. No external effects.

## Migrations and local database workflow

Fixed future SQL order 0001 schema/ledger, 0002 audit, 0003 outcome (FK target exists).
Runner bootstraps kernel.schema_migrations in a transaction under constant
session advisory migration lock with reserved pair (1312903757,1); command locks
use their versioned key-derived namespace. 0001 CREATE SCHEMA IF NOT EXISTS avoids duplicate
ledger definition. One checked-out client; inspect the exact ordered .sql inventory,
UTF-8 bytes SHA-256; duplicate/missing/changed applied file fails. Apply each file+ledger
INSERT in one transaction. No explicit transaction control/nontransactional SQL,
seeds, role/password/database creation or down migration. Runner has no implicit URL.
--dry-run reports planned versions without DDL (if ledger absent report all pending).
Finally release session lock/client; lost connection releases it automatically.
Migration failure rolls back that file; earlier commits retained; restart checksums verified.

Ordinary local PostgreSQL 18.6 on 127.0.0.1:5432; developer/DBA provisions navard_erp_dev
and navard_erp_test, runtime/migration roles per environment; secrets session env or
ignored env file, no credential in commands/docs. Environment provisioning is normal
developer workflow, not authorized system installer. No Docker prerequisite.
Runtime first migration permissions explicit; future tables never owned by runtime.

Test reset requires NODE_ENV=test, exact name ACK, _test suffix, separate URL,
expected identity/role/server major 18 and database != configured runtime database.
It drops/recreates only kernel/envelope_test schemas in dedicated test DB then
migrates; role cannot alter databases/roles. Test DDL owner credential separate
from runtime permissions negative-test credential. Integration fixture synthetic
facts in envelope_test only, never production migration. Tests reset in serial;
concurrency cases use explicit multiple clients/barriers, not accidental test parallelism.
Known test child termination/connection cuts only; no service/unrelated process kill.

## First-slice acceptance / Definition of Done

These are traceable acceptance intents, not invented TEST-* catalogue IDs.
Each must be executable and pass after human authorization.

| Intent | Required proof |
| --- | --- |
| Determinism/boundaries | Pinned install/lock/typecheck/build/lint/format/boundaries pass, no deep/cyclic or cross-owner imports |
| First accept | One synthetic fact + terminal accepted + original AUD-CMD-ACCEPTED atomically |
| First reject | Rejected handler writes rolled back, one terminal reject+AUD-CMD-REJECTED, unchanged replay |
| Replay | Accepted/rejected stable bytes/result no new facts; replay metadata/new durable AUD-CMD-REPLAYED |
| Binding conflicts | Each changed command/version/target/precondition/material/principal conflicts; canonical equivalent matches, current access nondisclosure |
| Scope | Full installation/scope key PK isolation, principal not PK; UUID/bound limits enforced |
| Parallel | Matching/mismatching contenders one winner; predecessor rollback lets waiter evaluate; hash collision no false replay |
| Business duplicate | Synthetic owner explicit natural constraint different-key DUP; CompleteProductionOperation new-key CONFLICT preserved; generic SQL errors not mapped |
| Transaction errors | Savepoint known reject; deadlock/serialization/timeouts technical whole abort; no durable cached technical error |
| Audit | Audit failure atomic rollback; replay audit failure technical; taxonomy identity/role/scope/open item safe/no payload leak |
| Crash/uncertain | Cuts before handler/after facts/before save/audit/before commit no partial facts; post-commit lost response same key recovers; unknown COMMIT no false accept |
| Recovery | Lossy restore scenario fences requests until reconciliation; no absent-row automatic reexecution claim |
| Parsing/redaction | Duplicate JSON names/unpaired surrogate/depth/size/unknown credentials invalid; no unsafe SQL/stacks/secrets/cross-customer logs |
| Migrations | Concurrent runners serialized; checksum drift/missing applied fail; partial-file SQL+ledger rollback; dry run no DDL |
| Permissions/reset | Runtime DDL/UPDATE/DELETE forbidden; unacknowledged/non-test/wrong role reset refused before SQL mutation |
| Host | Health only, no synthetic/production auth shortcut, bounded DB probe/shutdown |
| Retention | No expiry/key reuse/purge; result version compatibility/version old replay maintained |
| Catalogue/scope | No Inventory/Balance/business modules or adapter/worker created; accepted QA-SCN-IDEMPOTENT/AUDIT/ISOLATION trace |

DoD: every intent above mapped to concrete test, complete CI successful with actual
PG, migration fresh/second run/checksum failure tested, dependency/secret review,
README developer workflow truthful, no skipped acceptance proof, no business scope
creep. No product test currently exists or is claimed passed by this plan.

## Exact future shell scope

Run repository root only after matching human gate/unlock/baseline. Root script
bodies exactly TECHNICAL_FREEZE.md. These are future forms, not run now.

```text
node --version
npm --version
npm install --package-lock-only --ignore-scripts
npm ci
npm run preflight
npm run clean
npm run typecheck
npm run build
npm run lint
npm run boundaries
npm run format:check
npm run format
npm run test:unit
npm run migrate -- --dry-run
npm run migrate
npm run db:test:reset
npm run test:integration
npm run verify
npm run start
git status --short
git diff --check
git diff
```

Initial lock generation only approved exact versions; subsequent npm ci. Local dev/test
migrate only, no production credentials/role/database provisioning/deploy/publish/
remote push/history rewrite. Environment secrets provisioned separately normal
developer workflow; never placed in exact command line. Supply-chain action pins resolved
at authorized CI creation without new architecture round.

Stop for absent/mismatching human grant, business scope expansion, unreviewed version/
script/dependency/schema changes, direct cross-owner write, fake principal/approval,
secret exposure, unexpected destructive operation or required unanswered business policy.
Ordinary authorized diagnosis stays autonomous; it never grants implementation.

