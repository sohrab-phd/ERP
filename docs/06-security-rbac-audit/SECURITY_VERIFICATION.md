---
id: SEC-VER-001
title: Security Verification Catalogue
phase: 06-security-rbac-audit
status: in_review
version: 0.4.0
owners: [security-architect, qa-architect]
depends_on: [SEC-THREAT-001, SEC-RBAC-001, SEC-ISO-001, SEC-ID-001, SEC-AUD-001, APR-007, APR-008]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Security Verification Catalogue

APR-008 retains historical structure approval. This live source/ADR-0011
reconciliation is delegated technical work, not human baseline approval.

What a later Phase 07 test or Phase 11 validation must be able to
show. These are acceptance intents, not test code and not a runner
package (OQ-018).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Must be demonstrable later

| ID | Intent | Traces to |
| --- | --- | --- |
| `SV-001` | A caller who only claims `ACT-SALES` in the UI cannot write Ledger | INV-015, INV-017, THR-001 |
| `SV-002` | Temporary identity is rejected as `GUARD_ACTOR` | SEC-002, THR-002 |
| `SV-003` | Current Shipping or future-only `ACT-QC` commands; stock row writer is `ACT-IPS`. No current-MVP QC hold. | INV-017, THR-003, OQ-005 |
| `SV-004` | Same full scoped key/binding replays accepted/rejected outcome; mismatch/principal conflict cannot execute or disclose; current access rechecked after wait | INV-016, THR-004, ADR-0011 |
| `SV-005` | Customer A query cannot return customer B payload | INV-015, THR-005 |
| `SV-006` | `PortalPlaceOrder` is rejected in MVP | INV-020, THR-006 |
| `SV-007` | VoidInvoice / ReversePayment without a second distinct identity is rejected | SEC-006, THR-007 |
| `SV-013` | ReverseGoodsReceipt without a different human than the original post is rejected | SM-SOD-001, OQ-015, OQ-019 |
| `SV-008` | `EditGenealogy` and `AdjustBalance` are not callable | INV-019, THR-008 |
| `SV-009` | A worker retry is not a second stock writer | APP-BG-001, THR-009 |
| `SV-010` | Command that needs an unanswered OQ returns `GUARD_OPEN_POLICY` | ASM-016, THR-012 |
| `SV-011` | Accepted and rejected commands both leave audit evidence | SEC-AUD-001 |
| `SV-012` | Event notice does not leak another customer | THR-011, SEC-ISO-001 |

## Must stay untested-as-closed until answered

| Intent | Why it stays open |
| --- | --- |
| Named SoD person present | OQ-019 |
| Future QC conditional-release named person; not current-MVP input | OQ-005 future residual |
| Portal exact document whitelist and identity-product implementation | OQ-010 visibility-only MVP is answered; exact list precedes portal slice |
| Future second-site isolation | OQ-013 answers one entity/site; second site requires architecture reopen |
| Weighbridge device key | OQ-011 |
| Retention duration | OQ-016 |
| Password/MFA product behavior | OQ-018 |

Do not write a test that invents those answers.

Single configured site scope and customer read isolation can be tested now as
foundation contracts with nonbusiness fixtures; they do not await a second site.
Actual portal authentication/whitelist tests occur before its slice and no
business/person/permission data is invented in SLICE-ENVELOPE.

## Out of scope here

- Test runner, fixtures, or CI (Phase 07)
- Penetration-test vendor
- Implementation of the controls
