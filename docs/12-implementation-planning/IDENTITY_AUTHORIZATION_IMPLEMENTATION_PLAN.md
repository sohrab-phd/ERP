# Identity and authorization — bounded delivery plan

Authority: [APR-019](../00-governance/approved-baselines/APR-019-identity-authorization.md).
Backlog: capability 2; owner mod-identity-audit; dependency accepted SLICE-ENVELOPE.
Factory goal: personal attributable access on personal/shared terminals, explicit
scope/role checks, revocation and security administration. Login is not Station Entry.

## Minimal technical design

- Existing Node24.21/TypeScript6.0.3/pg/npm/node:test pins remain unchanged.
- Native asynchronous scrypt N=131072,r=8,p=1, random16-byte salt,32-byte key;
  fixed validated format, timing-safe comparison, bounded concurrent KDF work.
  Minimum15 Unicode code points, maximum128 UTF8 bytes; no silent truncation,
  invented password rotation/MFA or shared passwords. Technical security choice,
  not a new factory rule. See [Node crypto](https://nodejs.org/docs/latest-v24.x/api/crypto.html)
  and [OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
- Local opaque random256-bit bearer sessions; only SHA256 token digest persisted.
  Database clock,8-hour absolute and30-minute idle expiry, logout/revocation.
  Bearer Authorization only; no cookies/local-storage convention, CORS, browser UI,
  JWT/distributed infrastructure. TLS is required by the consuming deployment.
- identity schema account, role_grant, session, security_event tables in one SQL
  migration. UUID person identity is required and unique within installation;
  account names never determine permissions. No real identities/default grants seeded.
- Account/session/grant writes and security audit commit on one existing transaction
  capability; revocation/administration serialize against account/session checks.
  Runtime DML only on Identity-owned tables; append-only event INSERT, no audit UPDATE/DELETE.
- ACT-SEC explicitly controls account/grant administration. Initial security steward
  requires an explicit owner-operated provisioning tool, not an automatic default.
  The tool accepts password on stdin and checks database owner/installation acknowledgement.
- Public module contracts/pure password and authorization logic under
  apps/backend/src/modules/identity/. Direct pg is confined to
  infrastructure/postgresql/identity-store.ts. Composition calls public module ports;
  no identity import into shared-kernel and no foreign business table write.
- HTTP login/logout/self session plus ACT-SEC account/grant/revocation routes;
  bounded duplicate-aware JSON, exact fields, safe generic errors, no credentials
  in logs/audit and no arbitrary business-command HTTP route.
- Existing envelope authorization adapter rechecks current session, role/scope and
  explicit owning-command target/result policy at execution/replay. No registered
  policy means deny; a granted role alone does not expose arbitrary objects.
  Existing SoD helper requires distinct authenticated non-temporary humans;
  unresolved approval authority remains GUARD_OPEN_POLICY, never guessed.
- Security review added bounded HTTP failed-login cooldown/global budget, without
  permanent lockout or new infrastructure. Engineering review added safe targeted
  ACT-SEC account lookup to reconcile lost creation responses. Lifecycle/admin
  procedures remain explicitly atomic non-replay operations, distinct from
  admitted business commands; ADR-0014 defines the boundary and retry handling.

## Physical scope

New Identity module files (index/contracts/password/service/authorization),
PostgreSQL identity-store adapter, transport/identity-http.ts,
0004_identity_authorization.sql, tools/identity/provision-admin.mjs and Identity
unit/integration tests. Update composition, host optional route dispatch, config,
.env.example, migration/reset inventory, relevant test fixtures and module checker.
Use root frozen scripts; no dependency manifest changes, no next business module.

## Definition of Done / acceptance

Personal login/logout and attribution, database expiry/revocation, disabled-account
denial, explicit role/scope administration, no implicit admin/QC/service-human role,
cross-account/site/customer negatives, safe credential parsing/hashing/logging,
target/result-policy checks and fresh replay access. Real PostgreSQL proves
uniqueness, concurrent revocation/login, audit/write rollback, runtime privileges,
session/grant administration and envelope replay binding. No mock substitutes.
Health/foundation46-unit and30-integration regression requirements remain.
Build/typecheck/format/lint/boundaries and diff check must pass. Independent engineering,
DB/API/test and security findings are closed before documentation and local commit.

Out of scope: business posting, station lifecycle, password recovery/email/MFA,
frontend/portal workflows, future Quality, live user population, guessed ACT/delegate
assignments, hosting/TLS deployment, migration of real people and next slice.
OQ-019 blocks affected business permission policies; empty/unknown policy denies.
Population is UAT/Go-Live input, not a reason to invent names or block this mechanism.
