---
id: ADR-0014
title: Local personal identity and transactional authorization
status: accepted
version: 1.0.0
owners: [chief-solution-architect, security-architect]
last_reviewed: 2026-10-07
approval: null
---

# ADR-0014 — Local identity and authorization

Technical decision under the Owner's explicit [APR-019](../approved-baselines/APR-019-identity-authorization.md)
scope. It selects mechanisms; it invents no people, business authority, OQ answers
or human acceptance evidence. Modular Monolith, PostgreSQL and exact pins remain.

## Decision

Use existing Node HTTP/crypto rather than a new identity provider, framework or
JWT subsystem. Personal UUID is unique within installation; immutable principal
is `local:<installation UUID>` plus person UUID. Exact lower-case ASCII usernames
3–64 characters do not confer permission. Shared terminals require individual
accounts; login is not Station Entry.

Native async scrypt uses N=131072/r=8/p=1, random 16-byte salt, 32-byte key, fixed
versioned encoding and timing-safe comparison. Passwords need 15 Unicode code
points and at most 128 UTF-8 bytes; no normalization, truncation or invented
rotation/MFA. Two simultaneous KDF operations with no queue bound memory/CPU.
Unknown names receive fixed-cost dummy verification and generic failure.
HTTP failed-login limits: five per exact name per 60 seconds, 60 process-wide
per 60 seconds, bounded expiring hashed-name map and monotonic clock. Generic
503/Retry-After cooldown; successful login clears that name's failures. No
permanent account lockout. Gateway request throttling supplements this at deployment.

Random 256-bit opaque bearer sessions store only SHA-256 digest. PostgreSQL clock
enforces 8-hour absolute and 30-minute idle expiry; authenticated use refreshes
idle time without extending absolute lifetime. Logout, disable, administrative
revocation and password change invalidate sessions. Password change requires
current credential and revokes all old sessions. No cookies, browser storage,
CORS, JWT, UI or recovery product is added. Production binds literal loopback
behind a TLS terminator. Never expose credentials/tokens over an unprotected
network or trust forwarded headers as proof of TLS. Origin requests are refused
for this backend-only interface.

Initial single-site authority UUID is configured installation UUID, not a new
tenant/site model. Grants bind account, exact human role, authority and customer.
ACT-CUST requires a customer. Customer-bound ACT-SEC may support future explicit
audit-read policy but cannot administer; organizational ACT-SEC alone can.
ACT-IPS is a service writer, never a human grant; QC is not MVP. Initial owner
provisioning is explicit, separate from startup; no users/grants are seeded.
Last active organizational security administrator cannot be removed.

Identity accepts only private server-issued immutable contexts. Matching copied
or caller-frozen claims confer no authority. Each command/version requires
allowed roles plus owning-module target and result-disclosure predicates;
missing policy denies. Predicates receive the existing opaque transaction for
owner-resource checks. Initial admission uses one fresh SQL snapshot. After key
locking, account then session locks remain in the same outcome/audit transaction.
Grant changes, disable and revocation lock that account, serializing until commit.
Earlier committed revocation denies; later revocation waits and affects the next
attempt. Distinct-person helper is identity evidence only; unresolved OQ-019
business approval assignments remain GUARD_OPEN_POLICY.

## Persistence, audit and interface boundary

Migration 0004 owns identity.account, role_grant, session and security_event.
Composite identities/foreign keys isolate installations. Account/session/grant
writes and append-only security events commit atomically. Grant events include
role, authority, customer and enable/revoke flag. Events store no password/hash,
token, failed username, SQL or connection string. No automatic evidence TTL.

Authentication/session/security-administration procedures are not admitted
Phase-05 business commands. Their explicit HTTP contracts use bounded JSON and
atomic transactions, but **no durable envelope replay or idempotency key**.
Do not blindly retry uncertain write responses. ACT-SEC targeted account lookup
reconciles create-response loss; grant setting is desired-state administration.
Validate current grants/session state before retrying. Lost login response may
leave an inaccessible session until expiry/revocation; login anew. After uncertain
password change try the new credential, then old if necessary. Lost logout/revoke
is reconciled through session validity; repeat denial is expected. Initial
provisioning rerun refuses once an administrator exists. All admitted catalogue
business commands retain ADR-0011 durable accepted/rejected outcomes, bound-key
conflicts and atomic AUD-CMD-* semantics. Production registers no business or
fixture command/policy here.

## Consequences and evidence

No new package, service, queue or infrastructure. PostgreSQL is canonical session
state; failure budgets are local defensive controls, reset on process restart,
not business state. TLS/gateway connection limits remain deployment prerequisites.
Real people/ACT assignments, OQ-019 delegates, UAT roster, MFA/recovery, retention
and portal UI remain later inputs/features. See [delivered behavior and evidence](../../12-implementation-planning/IDENTITY_AUTHORIZATION_IMPLEMENTATION_STATUS.md).

Primary sources verified 2026-10-07: [Node crypto](https://nodejs.org/docs/latest-v24.x/api/crypto.html),
[OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html),
[OWASP authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html),
[session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).
