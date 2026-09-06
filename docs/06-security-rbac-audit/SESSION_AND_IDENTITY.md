---
id: SEC-ID-001
title: Session and Identity Policy Labels
phase: 06-security-rbac-audit
status: approved
version: 0.2.0
owners: [security-architect]
depends_on: [SEC-RBAC-001, SEC-THREAT-001, APR-007, APR-008]
last_reviewed: 2026-09-06
approval: APR-008
supersedes: null
---

# Session and Identity Policy Labels

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
| `site_scope` | Open until OQ-013 |
| `device_identity` | Optional commander for weighbridge/printer; OQ-011 |

UI cookies, local storage, or a hidden form field are not this record.

## Session (label only)

`Session` means: the backend can re-bind `actor_identity` on every
command without trusting the client’s claimed role. Idle time, absolute
lifetime, rotation, and store product stay OQ-018.

A replay of the same `idempotency_key` does not require a new session.
It still requires a currently authenticated principal.

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
device identity into the Goods Receipt idempotency key (OQ-011). It
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
