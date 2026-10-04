---
id: PLAN-TECH-001
title: SLICE-ENVELOPE Technical Freeze
phase: 12-implementation-planning
status: in_review
version: 0.2.0
owners: [chief-solution-architect, delivery-lead]
depends_on: [ADR-0001, ADR-0006, ADR-0007, ADR-0011, ADR-0013, REPO-LAY-001, REPO-DEP-001, QA-STRAT-001]
last_reviewed: 2026-10-04
approval: null
---

# SLICE-ENVELOPE technical freeze

Binding delegated technical choices under ADR-0012/ADR-0013, not human approval
of the implementation baseline. No product files or dependencies are created.
implementationAuthorized=false; approvedBaseline=null; final unlock absent.

SLICE-ENVELOPE remains the first prerequisite in GOV-SLICE-HOMES-001: trusted
admission/command/query contracts, durable outcomes, transaction/audit storage,
backend composition. No business posting, domain tables, customer routes, print,
report/live adapter or worker. Their logical homes do not expand this first grant.

## Canonical reconciliation

Read current REPO-LAY-001, REPO-DEP-001, APP-MOD-001, DOM-OWN-001,
APP-ENV-001, SEC-ID-001, SEC-AUD-001, QA-STRAT-001, QA-GATE-001,
DEP-TOPO-001, DEP-OBS-001 and GOV-SLICE-HOMES-001 after hook retirement/restart.
Their earlier folder/package/runner deferrals did not choose products.
ADR-0013 resolves these delegated technical choices without changing module
ownership, single ACT-IPS posting, atomic bundles or factory/OQ evidence.
The physical plan maps logical labels into one deployable backend and packages.

## Exact version baseline, researched 2026-10-04

Official release pages/versioned manifests, compatibility documentation and
read-only publisher npm metadata were inspected. Nothing was installed.

| Item | Exact initial pin | Primary source |
| --- | --- | --- |
| Node.js | 24.21.0 LTS | [2026-09-08 release](https://nodejs.org/en/blog/release/v24.21.0), [support schedule](https://nodejs.org/en/about/previous-releases): support through April 2028 |
| npm | 11.19.0 bundled | [Node versioned npm manifest](https://raw.githubusercontent.com/nodejs/node/v24.21.0/deps/npm/package.json) |
| TypeScript | 6.0.3 | [Microsoft versioned manifest](https://raw.githubusercontent.com/microsoft/TypeScript/v6.0.3/package.json), [6.0 notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html) |
| PostgreSQL | 18.6 | [Supported versions](https://www.postgresql.org/support/versioning/), [18.6 notes](https://www.postgresql.org/docs/18/release-18-6.html); major supported until 2030-11-14 |
| pg | 8.23.1 | [Versioned maintainer manifest](https://raw.githubusercontent.com/brianc/node-postgres/pg@8.23.1/packages/pg/package.json); Node >=16 |
| @types/pg | 8.23.1 | [Publisher metadata](https://registry.npmjs.org/@types%2fpg/8.23.1) |
| @types/node | 24.19.1 | [Publisher metadata](https://registry.npmjs.org/@types%2fnode/24.19.1); Node24 API family, TS minimum5.6 |
| ESLint | 10.12.0 | [Maintainer release](https://github.com/eslint/eslint/releases/tag/v10.12.0); Node24 supported |
| @eslint/js | 10.0.1 | [Publisher metadata](https://registry.npmjs.org/@eslint%2fjs/10.0.1); peer ESLint^10 |
| typescript-eslint | 8.71.0 | [Release](https://github.com/typescript-eslint/typescript-eslint/releases/tag/v8.71.0), [supported dependencies](https://typescript-eslint.io/users/dependency-versions/) |
| Prettier | 3.9.9 | [Release](https://github.com/prettier/prettier/releases/tag/3.9.9); Node>=14 |

Publisher latest TypeScript is [7.0.2](https://registry.npmjs.org/typescript/latest).
Selected typescript-eslint supports >=4.8.4 <6.1.0; choose6.0.3 for a supported
single compiler/linter API family. TS7 is not called unstable. Reconsider when
lint tooling supports it, not by silently adding two compilers.

ESM type:module; NodeNext module/resolution, ES2022 target, explicit rootDir/outDir,
strict/noUncheckedIndexedAccess/exactOptionalPropertyTypes/casing.
No baseUrl/deprecated flags/direct-runtime TS/transpiler.

Pin Node in .node-version and exact engines; npm in packageManager plus preflight
check because packageManager alone does not enforce npm. Exact direct dependency
literals, save-exact=true, engine-strict=true, ignore-scripts=true; one root
package-lock.json; npm ci after reviewed initial lock generation. No nested locks
or floating latest. Patch/security updates are reviewed technical changes;
major/API changes reopen ADR-0013. Do not retain known vulnerable pins.

## Engineering choices

| Concern | Decision and rationale |
| --- | --- |
| Workspaces | Native npm, private root; two packages need no Nx/Turborepo |
| Backend framework | node:http health-only host; in-process envelope transport-neutral; no framework dependency needed. Later real API may justify framework ADR |
| PostgreSQL access | Direct parameterized pg SQL; one checked-out client per transaction, [same-client requirement](https://node-postgres.com/features/transactions); no ORM hiding boundaries |
| Migrations | Authored ordered SQL and small pg runner; transaction+checksum ledger, no ORM generator |
| Validation | Explicit typed bounded admission parser; duplicate-name-aware JSON parsing; no new validator dependency |
| Logging | Bounded allowlisted structured JSON stdout/stderr; operational logs separate from durable AUD-* |
| Testing | Stable [node:test](https://nodejs.org/docs/latest-v24.x/api/test.html) and node:assert/strict on compiled JS; no Jest/Vitest/transpiler |
| Integration DB | Dedicated real PG18.6; SQLite/mocks cannot prove locks/savepoints/commit |
| Lint/format | ESLint flat config, typed TS recommended rules; Prettier independently |
| Deployment | Ordinary local Node and PostgreSQL; Docker/hosting/HA ADR-0008 remain deferred |

No Redis/broker/distributed transaction/outbox without external effects.
No first-slice device/email/report effect. Preserve PG NUMERIC/bigint as strings;
no JS Number coercion or guessed business UOM scale (OQ-001).

## Configuration and operating bounds

Composition root validates env once; kernel never reads process.env.
No implicit dotenv; explicit local --env-file optional, tracked .env.example
placeholders only, .env.local ignored.

| Variable | Frozen contract |
| --- | --- |
| NODE_ENV | required development/test/production |
| HOST / PORT | default127.0.0.1:3000; validated explicit override |
| DATABASE_URL | required least-privilege runtime URL, never logged |
| MIGRATION_DATABASE_URL | runner-only distinct DDL-owner role |
| TEST_DATABASE_URL / TEST_DATABASE_ACK | separate disposable _test database; exact name ACK plus NODE_ENV=test; no runtime fallback |
| INSTALLATION_ID | stable UUID installation, not regenerated after restart/restore |
| LOG_LEVEL | debug/info/warn/error; no redaction bypass |
| principal/authority scope | trusted execution-context port, never client/env role spoofing |

Initial pool10/connecttimeout5s, command locktimeout5s/statement15s/deadline30s.
SET LOCAL SQL limits; cancellation rolls back and bad connection destroyed.
No hidden retries. Exact binding/admission/retention from COMMAND_IDEMPOTENCY_SPEC.
HTTP health maxheaders8KiB/headerstimeout5s/request10s/keepalive5s; reject body,
safe404/405, readiness DBprobe2s. Gracefulshutdown10s closes listener/pool/work.
No business HTTP routes or synthetic auth registration in production.

Logger: UTC timestamp, level, fixed event, request/correlation/execution IDs,
catalogue command, guard/technicalcode, duration. Never raw payload/result,
credentials, connectionURL/cookies/authheaders/personnames/cross-customerdata.
No custom auth/session/TLS/SQL driver or DI infrastructure in first slice.

## Exact future root scripts

Documentation only; execute product commands only after human unlock.
Workspace manifests private ESM with exports and no scripts/lifecycle indirection.

| Script | Body |
| --- | --- |
| preflight | node tools/build/preflight.mjs |
| clean | node tools/build/clean.mjs |
| typecheck | tsc -b --pretty false |
| build | tsc -b --pretty false |
| lint | eslint apps packages tools eslint.config.mjs --max-warnings 0 |
| boundaries | node tools/build/check-boundaries.mjs |
| format:check | prettier --check apps packages tools package.json tsconfig.base.json tsconfig.json eslint.config.mjs .prettierrc.json .github/workflows/verify.yml |
| format | prettier --write apps packages tools package.json tsconfig.base.json tsconfig.json eslint.config.mjs .prettierrc.json .github/workflows/verify.yml |
| test:unit | node tools/test/run-unit.mjs |
| test:integration | node tools/test/run-integration.mjs |
| test | npm run test:unit |
| migrate | node tools/db/migrate.mjs |
| db:test:reset | node tools/db/reset-test.mjs |
| start | node apps/backend/dist/src/main.js |
| verify | npm run preflight && npm run format:check && npm run lint && npm run boundaries && npm run typecheck && npm run test:unit && npm run test:integration |

No npm pre/postinstall/prepare hooks, npx downloads or recursive script dispatch.
tsc project references build kernel then backend and compiled tests.
Test runners assert fixed compiled test list exists then spawn process.execPath
--test --test-concurrency=1 with explicit files; propagate exit, fail zero-tests.
No shell-glob dependency. Integration runner first checks disposable DB identity.
Boundary checker uses installed TS API for actual static/export/dynamic-literal
imports; rejects nonliteral imports, deep/cross-relative dependencies, cycles,
kernel importing pg/http/backend/domain. No regexp-only import proof.
clean only explicit dist/.tsbuildinfo; reset only kernel/envelope_test schemas
within acknowledged dedicated DB. SQL files authored/reviewed/checksummed;
Prettier no SQL plugin. Do not format existing historical docs wholesale.

## Local workflow and CI

After authorization, ordinary developer/DBA provisioning creates separate
dev/test databases and runtime/migration roles (no automated OS installer).
Set URL/INSTALLATION_ID; initial npm install --package-lock-only --ignore-scripts,
review lock, npm ci, preflight, build, migrate localdev, unit, acknowledged
testreset/migrate, integration, verify, start. No factory seed/operator accounts.

Minimum future CI: GitHub Actions verify.yml, repository automation only, not
production topology. Pin Node/npm and PG18.6; reviewed immutable action SHAs
resolved from publisher commits at authorized file creation. Clean npm ci,
full verify with actual PG, retain exactversions/testoutput/migrationchecksums.
Windows+Linux compilation/unit, realPGintegration at least one supportedplatform.
No publish/deploy/productioncredentials, inventedcoveragepercent/loadtargets.
CI supplychain hash lookup is implementation verification, not another designcycle.

Accepted QA levels/intents remain, no TEST-* catalogue. Product tests execute
after authorization; no claim nonexistent tests currently passed.

## Deferred non-blockers

Identity provider/RBAC live people before identity/business routes, not health-only
foundation. Frontend/adapters/workers, factory scale, deviceprotocol, catalogues,
UAT data/rosters, hosting, backup retention/vendor and cutoverfiles remain B/C/D/E/F.

