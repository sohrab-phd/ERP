---
id: QA-STRAT-001
title: Test Strategy and Levels
phase: 07-testing-quality-architecture
status: approved
version: 0.2.0
owners: [qa-architect]
depends_on: [SEC-P07-HANDOFF-001, APP-CMD-001, SM-SEQ-001, APR-008]
last_reviewed: 2026-09-06
approval: APR-009
supersedes: null
---

# Test Strategy and Levels

Where a later implementation must prove architecture, without choosing
a runner, fixture library, or CI product (OQ-018). FIND-028 still
forbids a false-precision `TEST-*` ID catalogue. Intents cite `INV-*`,
`SEQ-*`, `SV-*`, and `QA-SCN-*`.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Standing rules

1. A verification that needs an unanswered OQ is recorded as
   `GUARD_OPEN_POLICY` expected, not as a guessed pass.
2. Temporary identities cannot be testers who sign evidence (OQ-019).
3. Quantity asserts that need UOM or Coil rules stay open (OQ-001,
   OQ-002).
4. A worker or UI test must not become a second stock writer.
5. Every command in APP-CMD-001 inherits `L-COMMAND`: backend `ACT-*`,
   idempotency key, and `GUARD_OPEN_POLICY` when an unanswered OQ is
   required. That standing rule is not a `TEST-*` row per command.

## Levels (labels)

| Level | Proves | Does not choose |
| --- | --- | --- |
| `L-COMMAND` | One command: guards, idempotency key, rejection family, no illegal write | Jest, Vitest |
| `L-BUNDLE` | One DATA-TX-001 bundle succeeds or fails together | Transaction library |
| `L-SEQUENCE` | A `QA-SCN-*` / `SEQ-*` path | Playwright, Cypress |
| `L-PROPERTY` | Ledger vs Balance, genealogy rebuild, no double post | Property-test package |
| `L-SECURITY` | SV-001 through SV-013 | Auth test harness |
| `L-RECOVERY` | Restore/rebuild labels; no invented RPO minutes | Chaos tool |
| `L-UAT` | Workshop acceptance later | Named UAT people (OQ-019) |

## Authoritative evidence

Posted commercial documents, Ledger rows, `AUD-CMD-*` rows, and the
first idempotency result are evidence. UI screenshots, Balance alone,
and Genealogy Link alone are not source truth.

## Environments (labels)

| Label | Meaning | Open |
| --- | --- | --- |
| `ENV-DEV` | Architects and later implementers | Hosting (OQ-018, ADR-0008) |
| `ENV-TEST` | Repeatable command/sequence evidence | Data volume (OQ-014) |
| `ENV-UAT` | Later workshop | Named attendees (OQ-019) |
| `ENV-CUTOVER` | Opening-stock rehearsal | OQ-015 |

Docker, cloud, or a specific OS is not chosen.

## Must not decide here

- Jest, Playwright, k6, Testcontainers, or GitHub Actions
- Decimal test oracles that invent scale
- Named tester roster
