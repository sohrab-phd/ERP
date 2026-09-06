---
id: SEC-VER-001
title: Security Verification Catalogue
phase: 06-security-rbac-audit
status: in_review
version: 0.1.0
owners: [security-architect, qa-architect]
depends_on: [SEC-THREAT-001, SEC-RBAC-001, SEC-ISO-001, SEC-ID-001, SEC-AUD-001, APR-007]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# Security Verification Catalogue

What a later Phase 07 test or Phase 11 validation must be able to
show. These are acceptance intents, not test code and not a runner
package (OQ-018).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Must be demonstrable later

| ID | Intent | Traces to |
| --- | --- | --- |
| `SV-001` | A caller who only claims `ACT-SALES` in the UI cannot write Ledger | INV-015, INV-017, THR-001 |
| `SV-002` | Temporary identity is rejected as `GUARD_ACTOR` | SEC-002, THR-002 |
| `SV-003` | `ACT-QC` / `ACT-SHIP` command hold or dispatch; stock row writer is `ACT-IPS` | INV-017, THR-003 |
| `SV-004` | Same idempotency key does not post twice | INV-016, THR-004 |
| `SV-005` | Customer A query cannot return customer B payload | INV-015, THR-005 |
| `SV-006` | `PortalPlaceOrder` is rejected in MVP | INV-020, THR-006 |
| `SV-007` | VoidInvoice / ReversePayment without a second distinct identity is rejected | SEC-006, THR-007 |
| `SV-008` | `EditGenealogy` and `AdjustBalance` are not callable | INV-019, THR-008 |
| `SV-009` | A worker retry is not a second stock writer | APP-BG-001, THR-009 |
| `SV-010` | Command that needs an unanswered OQ returns `GUARD_OPEN_POLICY` | ASM-016, THR-012 |
| `SV-011` | Accepted and rejected commands both leave audit evidence | SEC-AUD-001 |
| `SV-012` | Event notice does not leak another customer | THR-011, SEC-ISO-001 |

## Must stay untested-as-closed until answered

| Intent | Why it stays open |
| --- | --- |
| Named SoD person present | OQ-019 |
| QC conditional-release named person | OQ-005 |
| Portal authenticated customer read | OQ-010 |
| Site-scoped isolation | OQ-013 |
| Weighbridge device key | OQ-011 |
| Retention duration | OQ-016 |
| Password/MFA product behavior | OQ-018 |

Do not write a test that invents those answers.

## Out of scope here

- Test runner, fixtures, or CI (Phase 07)
- Penetration-test vendor
- Implementation of the controls
