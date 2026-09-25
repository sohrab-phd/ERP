---
id: SEC-ID-001
title: Session and Identity Policy Labels
phase: 06-security-rbac-audit
status: approved
version: 0.2.1
owners: [security-architect]
depends_on: [SEC-RBAC-001, SEC-THREAT-001, APR-007, APR-008]
last_reviewed: 2026-09-23
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

## Unresolved factory identity conflict (FACT-05, `2026-09-23`)

The live rules above are **unchanged**. `actor_identity` remains a stable
person or service identity. `SharedTerminal` still requires operator
identity per command. `PasswordPolicy` still says a human principal is not
a shared shop password. `ACT-*` permissions are not changed here.

Factory meeting FACT-05 is recorded as a **confirmed operational
requirement plus an unresolved identity/security design question**:

- production stations will be defined;
- ordinary production-line execution should not depend on individual
  operator accounts because operators may change;
- operators would use the account associated with their station.

This factory preference **conflicts with, and does not silently override**,
the SharedTerminal / per-command human identity rule. A later identity
decision is required. Until then, do not assume a station account satisfies
audit, SoD, QC release, reversals, or cutover.

Open questions (intentionally unanswered):

1. Can a station account be used for ordinary production commands?
2. Is a human actor identity still required per command?
3. If station identity is used, how is individual accountability preserved?
4. Which commands may use station identity?
5. Which commands must require a named human identity?
6. Are QC hold/release operations excluded?
7. Are SoD-sensitive commands excluded?
8. Are reversals excluded?
9. Are cutover/sign-off operations excluded?
10. How does the station identity relate to the existing `ACT-*` catalogue?

A future dedicated OQ may be required if this cannot remain a residual of
OQ-003. Canonical recording:
[OPEN_QUESTIONS.md](../00-governance/registers/OPEN_QUESTIONS.md).
