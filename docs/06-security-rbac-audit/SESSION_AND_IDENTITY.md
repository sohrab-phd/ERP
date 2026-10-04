---
id: SEC-ID-001
title: Session and Identity Policy Labels
phase: 06-security-rbac-audit
status: in_review
version: 0.3.0
owners: [security-architect]
depends_on: [SEC-RBAC-001, SEC-THREAT-001, APR-007, APR-008]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Session and Identity Policy Labels

APR-008 remains historical structure approval; generic issuer/principal/replay
rules are a delegated ADR-0011/0012 revision, not human baseline approval.

Required identity properties for a Phase 05 command. These are labels,
not a session library, password product, MFA vendor, or equipment
protocol (OQ-018, OQ-011).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Identity record (logical)

A backend-authenticated principal must resolve to:

| Field | Rule |
| --- | --- |
| `actor_identity` | Stable person or service identity; not a display name |
| `actor_role` | Exactly one current `ACT-*` for the command |
| `temporary` | If true → `GUARD_ACTOR` |
| `customer_scope` | Required on customer-bearing commands and queries |
| `site_scope` | One recorded legal entity/principal site (OQ-013); trusted scope, no invented second site |
| `device_identity` | Optional commander for weighbridge/printer; OQ-011 |

UI cookies, local storage, or a hidden form field are not this record.

## Session (label only)

`Session` means: the backend can re-bind `actor_identity` on every
command without trusting the client’s claimed role. Idle time, absolute
lifetime, rotation, and store product stay OQ-018.

A replay of the same `idempotency_key` does not require a new session.
It still requires a currently authenticated principal.

ADR-0011 binds trusted immutable issuer+subject to the installation/authority/key
outcome; principal is not another uniqueness namespace. Another principal's
same-key attempt is nondisclosing conflict, never independent execution. Current
command/target/customer/result authorization is evaluated again after key-lock
wait before execution/disclosure. That is the authorization decision point;
revocation committed earlier denies, later revocation applies to subsequent
attempts. Creating a resource once does not grant perpetual replay disclosure.
Body identity/role/scope is not authority; test identity adapters are not included
in production composition. Identity provider/session product and real ACT
assignments remain later slice decisions.

## Password and MFA (labels only)

| Label | Meaning | Open |
| --- | --- | --- |
| `PasswordPolicy` | A human principal is not a shared shop password | Strength and expiry days not invented |
| `SecondFactor` | Sensitive SoD commands may later require a second factor | Product and who must enroll stay OQ-018 / OQ-019 |
| `SharedTerminal` | Shop-floor terminal may be shared; the operator identity is still required per command | Device join protocol OQ-011 |

Do not select bcrypt, Argon2, TOTP, WebAuthn, Keycloak, Auth.js, or
any other package here.

## Equipment identity

A weighbridge or barcode printer is a commander. It may supply a
device identity into the Goods Receipt bound request/receipt natural identity
(OQ-011). It
must not write Ledger. When the device is down, the fallback is a
human `ACT-*` command with a new documented reason, not a silent
bypass.

## Service principals

`ACT-IPS` is a system actor, not a logged-in human. A later worker
that retries a command uses the original commander’s identity and the
same idempotency key. The worker process identity is not a substitute
second human for SoD.

## Must not decide here

- JWT, session cookie, or reverse-proxy auth
- Directory or identity-provider product
- MFA mandate list
- Password length or rotation days

## Earlier station-account preference is superseded (`2026-09-30`)

The 2026-09-23 text below preferred a station account. The later factory
clarification **supersedes** that preference:

- There is no shared Station account.
- Each operator has a personal account.
- Attributable activity uses that personal identity.
- Station is not a user. One person may work at more than one Station.
- A shared **terminal** may still exist. The account used on it is personal.
- `ACT-*` permissions are not changed.
- Operator login and logout are recorded. That is factory evidence. It
  does not choose a session product, and it does not make login the same
  event as Station Entry. Mr. Ghaffari's account responsibility is not a
  super-admin permission.
- QC, SoD, reversal, and cutover are not remapped onto a station account,
  because that account does not exist in the factory evidence.

## Historical factory preference (FACT-05, `2026-09-23`) — superseded

The live rules in the sections above were not rewritten by the 2026-09-23
note. `actor_identity` remains a stable person or service identity.
`SharedTerminal` still allows a shared device and still requires operator
identity per command. `PasswordPolicy` still says a human principal is not
a shared shop password.

The 2026-09-23 meeting preferred ordinary execution on the account
associated with the station. That preference conflicted with per-command
human identity. The 2026-09-30 clarification removes the conflict on this
point: personal accounts are required. Do not implement shared station
passwords.
