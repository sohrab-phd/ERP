# Identity and authorization — implementation record

Recorded 2026-10-07. Current scope is expressly authorized by [APR-019](../00-governance/approved-baselines/APR-019-identity-authorization.md).
Architecture baseline remains APR-018/e80a04b15ddf93451cc79ccf81722f564912596d;
accepted envelope commit is 0f722def8fb0296f60f3a444839bfac939c768f7.
Starting HEAD: ff7d9169613b8463c6df930b6433ebdedfe67a20.
The earlier implementation-entry authorization blocker is resolved by the
Owner's explicit grant and scope-recording delegation. Gate/local ignored unlock
match APR-019 and current Identity scope; no next major slice is started.

Delivery status: ACCEPTED — Definition of Done satisfied; local commit follows
final diff review. This report belongs to that coherent delivery commit; its hash
is returned to the Owner and available in local Git history. No remote push.
Binding technical decision: [ADR-0014](../00-governance/adrs/ADR-0014-local-identity-authorization.md).
Bounded [delivery plan](IDENTITY_AUTHORIZATION_IMPLEMENTATION_PLAN.md) and
[backlog capability 2](IMPLEMENTATION_BACKLOG.md) define factory objective/DoD.

## Delivered responsibility and physical ownership

Personal, attributable access on individual/shared factory terminals. Login is
not Station Entry. Stable person UUID, unique per installation, is principal
subject; exact local issuer includes installation UUID. No organizational title,
username, client role claim or shared terminal grants permission.

- Backend public module: apps/backend/src/modules/identity/{index,contracts,password,service,authorization}.ts.
- Owned PG adapter: infrastructure/postgresql/identity-store.ts; pure module never imports pg, transport or another module's internals.
- HTTP adapter: transport/identity-http.ts composed through composition-root.ts.
- SQL migration: database/migrations/0004_identity_authorization.sql. Earlier migration contents/checksums unchanged.
- Explicit initial provisioning: tools/identity/provision-admin.mjs; never startup/seed/CI production enrollment.
- Unit and real PG tests: backend/tests/unit/identity.test.ts and integration/identity.test.ts, plus configuration and migration regressions.
- Small kernel extension: immutable issued-context identity preserved; authorization ports receive the opaque current transaction after key lock and for replay. No Identity import into shared kernel.
- Import checker enforces module purity/public-index access and existing kernel/pg ownership.

Original exact Node24.21.0/npm11.19.0/TypeScript6.0.3/pg8.23.1 pins and workspaces
remain unchanged. No new dependency, framework, ORM, distributed infrastructure,
UI or business module.

## Account, role and session behavior

Native fixed-cost asynchronous scrypt N131072/r8/p1, salt16/key32, max192MiB,
strict versioned hash encoding and timing-safe comparison. Password minimum15
Unicode code points, maximum128 UTF8 bytes; malformed Unicode and silent
truncation rejected. Two simultaneous KDF operations, no queue; unknown account
names use the same dummy KDF. Hashes/credentials never enter API/error/log/audit.

Human roles: ACT-SEC, ACT-SALES, ACT-PROC, ACT-WH, ACT-PLAN, ACT-OP,
ACT-SHIP, ACT-FIN, ACT-CUST. No QC or
human ACT-IPS grant. The initial single-site authority scope is INSTALLATION_ID;
customer grants bind exact scope, ACT-CUST always requires customer. Scoped
ACT-SEC cannot administer. Organizational ACT-SEC controls personal account
creation, grants, disable and revocation; removal of the last active steward
fails atomically. No real users, person-to-ACT mappings or default permissions
are seeded. Unresolved OQ-019 business authority remains unavailable.

Random32-byte opaque bearer sessions persist SHA256 digest only. Database clock
enforces8-hour absolute/30-minute idle expiry. Session validation refreshes idle
time, never absolute lifetime. Logout, disable, explicit revocation and successful
password change remove access; change requires current password and revokes all
old sessions. No cookie auth, CORS, JWT/browser storage or recovery feature.

HTTP failures are budgeted: five failed checks per exact name/60sec and60 failed
checks per process/60sec. Hashed-name map is bounded1024/expiring; monotonic clock,
success clears name count, no permanent lockout. Cooldown returns503 and
Retry-After60. Two already admitted KDFs can finish concurrently; no unbounded
queue. Budget resets at process restart, so production gateway connection/request
throttling supplements it. Production HOST accepts literal127.0.0.1/::1 only;
TLS terminator is required before factory-network exposure. Forwarded headers
are not trusted. Origin requests are refused until a separately designed UI.

## Explicit HTTP contract

All Identity responses use JSON, no-store and nosniff. POST uses exact JSON object
fields, Content-Length2..4096 and application/json; duplicate JSON names,
unknown fields, invalid UTF8, chunked bodies and malformed auth are refused.
Bodies have a5-second read deadline and handler capacity16; headers8KiB.
Bearer header must be unique and canonical; request body never selects the
authenticated/executing principal, installation or authority. Authorized account
creation supplies the new person's ID, and explicit grant administration supplies
the target role/customer; these fields never change the administrator's authority.

| Method/path | Required body | Access/result |
| --- | --- | --- |
| POST /identity/login | username,password | Public credentials; token/expiresAt, generic401 on failure |
| GET /identity/session | no body | Current bearer; own accountId/personId/username/expiry/grants only |
| POST /identity/logout | {} | Current bearer; revoke itself |
| POST /identity/accounts | username,personId,password | Organizational ACT-SEC;201 accountId |
| POST /identity/account-query | username | Organizational ACT-SEC; targeted safe account fields or null, never hash |
| POST /identity/grants | accountId,actorRole,enabled; optional customerScope | Organizational ACT-SEC; explicit desired grant state |
| POST /identity/disable | accountId | Organizational ACT-SEC; disable and revoke all target sessions |
| POST /identity/revoke | accountId | Organizational ACT-SEC; revoke all target sessions |
| POST /identity/password | currentPassword,newPassword | Current bearer/current credential; change and revoke old sessions |

Errors:400 invalid contract,401 unbound/expired credential,403 forbidden,409
identity uniqueness/last-steward conflict,503 technical/KDF capacity/cooldown.
Unknown route404, wrong method405. No arbitrary business-command endpoint,
fixture identities or handlers in production. Health behavior stays intact.

These are authentication/session/security-administration procedures, **not
admitted Phase-05 business commands**. They have atomic security writes/audits
but no idempotency key or durable envelope replay. On lost response, reconcile
before another write: ACT-SEC account-query recovers account-create identity;
session self-query checks revocation; explicit grant desired state can be
confirmed through that person's authenticated session. Uncertain password change
requires testing new then old credential; successful change invalidates sessions.
Lost login token is not recoverable; login anew and expire/revoke orphan session.
Repeating successful logout can return401. Initial provision rerun refuses.
Every admitted catalogue business command still obeys ADR-0011 with unchanged
AUD-CMD-ACCEPTED, AUD-CMD-REJECTED, AUD-CMD-REPLAYED and guard contracts.

## Transactions, concurrency and audit

Private WeakMap-issued immutable contexts defeat copies/forged claims.
Explicit command/version role plus owner target/result-disclosure policy is
required; missing policy denies. Customer scope is never a role-only shortcut.
After key locking, authorization uses the same opaque transaction and locks
account before session; admin grant/disable/revoke also locks the account.
Revocation committed earlier denies execution/replay. Later revocation waits for
outcome/audit commit, then affects subsequent attempts. Target predicates receive
that transaction for owner-resource locking. No nested independent business TX.

Admin operations take one installation advisory lock before account/session
locks, serialize last-steward preservation, and use DB uniqueness for personal
identity. Account/password/grant/session writes and security_event inserts share
one transaction; audit insertion failure rolls all tentative writes back.
Security events: LOGIN_ACCEPTED, LOGIN_DENIED, LOGOUT, SESSION_REVOKED,
ACCOUNT_CREATED, ACCOUNT_DISABLED, GRANT_CHANGED, PASSWORD_CHANGED.
Safe person attribution, timestamp and grant role/authority/customer/enabled
details only; failed authentication invents no actor. Runtime history immutable.
Existing foundation uncertain-COMMIT/crash/idempotency tests remain required;
these administration procedures reconcile uncertainty rather than promise replay.

## Database roles and explicit initial provisioning

Migration owner owns the database/schemas; runtime is distinct, non-superuser,
non-createdb/non-createrole/non-replication. Migration grants none automatically.
Owner grants only USAGE on kernel/identity, SELECT/INSERT on kernel.audit_event,
kernel.command_outcome and identity.security_event; SELECT/INSERT/UPDATE on
identity.account/session; SELECT/INSERT/DELETE on identity.role_grant. Runtime
has no schema CREATE or audit/outcome UPDATE/DELETE. Use quoted actual role names
when provisioning deployment roles; no fixed factory credentials are in source.

After npm run build and owner migrations, an authorized operator may explicitly
run the initial-person tool, with protected password stdin, these exact arguments:

```text
node tools/identity/provision-admin.mjs --installation-ack <INSTALLATION_ID> --person-id <real-person-UUID> --username <personal-username>
```

INSTALLATION_ID environment must exactly match acknowledgment; MIGRATION_DATABASE_URL
must connect as actual compatible UTF8 PostgreSQL18.6 database owner. The tool
rejects TTY/argument credentials, invalid inputs, an existing steward and owner
mismatch; same transaction writes person account, organizational ACT-SEC grant
and security audit. No live person is provisioned by this delivery. Real-person
identity proofing is an operator responsibility, not guessed by the tool.

## Validation, review and remaining limits

Windows-only native PostgreSQL18.6 server180006/UTF8, isolated TEMP cluster on
127.0.0.1:55436; separate test owner/runtime and separate development database.
Existing18.2 service untouched. Official source checksum verified and built with
native MSVC19.44/Meson1.9.2/Ninja1.13 after EDB regional403; no WSL/Linux/Docker.
Local test build omits optional TLS/ICU/JIT/compression; no production build claim.
Credential-free local runtime receipt is ignored artifacts/tests/identity-pg/runtime-receipt.json;
passwords/environment bootstrap remain TEMP-only.

Executed with exact pinned runtime and isolated native PostgreSQL:

- npm run format, npm run typecheck, npm run lint and npm run boundaries: PASS.
- npm run verify: PASS; preflight/format/lint/boundaries/typecheck plus51 unit
  and50 real PostgreSQL integration tests, zero failed/cancelled/skipped.
  Includes20 Identity integration tests and all30 foundation integration regressions.
- npm run build: PASS. npm audit --audit-level=high: zero vulnerabilities;
  advisory check used official npm registry, no ERP code/doc upload.
- git diff --check and staged diff check: PASS. Changed-document relative links
  and13 tracked JSON files parse; gate/local unlock scope/baseline match APR-019.
- Graphify0.9.79 local structural refresh:359 tracked files,3146 nodes,4882 edges;
  IdentityService/authorization/store/SQL/document navigation query verified.
  Graph output remains ignored/local, network blocked during index construction;
  extractor omissions do not replace source/import-boundary checks.
DoD includes real account/session uniqueness, expiry/revocation, least privilege,
customer/site/person isolation, noQC/IPS grants, SoD evidence, audit rollback,
last-admin races, login-disable/authority-revoke barriers, command authorization
lock held until audit/outcome commit, current durable replay, HTTP parsing/
capacity, failed-login recovery, production composition and initial-owner tool.

Independent engineering/DB/API review required current-doc reconciliation,
explicit non-replay admin contract, runtime grants and provisioning proof.
Independent security review required failed-login throttling. All corrections
are implemented, tested and independently re-reviewed:

| Independent perspective | Reviewer | Final result |
| --- | --- | --- |
| Engineering/database/API | identity_engineering_review (not a module author) | PASS; four required contract/doc/provisioning findings closed |
| Security | identity_security_review (not a module author) | PASS; throttling finding closed; no high/critical or required finding remains |
| Test/API/readiness | identity_acceptance_review (not a test author) | PASS; real-PG proof/DoD checked; final execution counts reviewed |

Reviewers inspected source/tests/credential-free runtime evidence independently;
root executed the complete suite serially, avoiding test-schema races. Optional
additional password-change audit-insert-failure regression is non-blocking:
existing write/audit rollback tests and the same transaction implementation cover
the invariant; no known defect or failing required acceptance test remains.

Deferred/non-blocking: real roster/ACT assignments, OQ-019 affected business
policy, recovery/MFA, station/device identity, customer-business reads/portal UI,
session cleanup/retention OQ-016, deployment TLS/gateway/hosting and enrollment.
No inventory, Sales, Production, genealogy, Finance-Lite, weighbridge or portal
business posting is implemented. Next major slice is not begun and no push made.
