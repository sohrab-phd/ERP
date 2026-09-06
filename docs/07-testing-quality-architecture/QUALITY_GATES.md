---
id: QA-GATE-001
title: Quality Gates and Evidence
phase: 07-testing-quality-architecture
status: in_review
version: 0.1.0
owners: [qa-architect, chief-solution-architect]
depends_on: [QA-STRAT-001, QA-TRACE-001, QA-SCN-001, APR-008]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# Quality Gates and Evidence

What must be true before a later implementation unlock can even be
proposed. This is not a CI pipeline and not Phase 12.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Evidence kinds

| Kind | Acceptable | Not acceptable |
| --- | --- | --- |
| Command result | Envelope `accepted`/`rejected` with family | UI-only toast |
| Stock | Ledger row | Balance-only screenshot |
| Correction | New reversal command + `AUD-REVERSAL` | Delete or edit-in-place |
| Idempotency | Same key, same first fact identity | Silent second post |
| Isolation | Customer B payload absent | Shared “admin dump” |
| Genealogy | Rebuild from facts | EditGenealogy |

## Gates (labels, later)

| Gate | Required intents at least named | Still open at this architecture gate |
| --- | --- | --- |
| `QG-ARCH` | This Phase 07 structure set | Runner, volumes, named testers |
| `QG-IMPL-CANDIDATE` | L-COMMAND and L-BUNDLE against INV-001–020 as far as open guards allow | Implementation unlock itself |
| `QG-SECURITY` | SV-001–013 where not OQ-blocked | JWT/MFA product |
| `QG-UAT` | QA-SCN golden paths with real names | OQ-019 |
| `QG-CUTOVER` | Opening-stock Ledger facts | OQ-015 |

No gate here authorizes implementation. Phase 12 and a human
`.cursor/IMPLEMENTATION_UNLOCK.json` remain required.

## Orphan rule

If a later implementation adds a command not in APP-CMD-001, it must
gain an INV/SEC/QA-SCN intent before unlock. Do not leave it unverified.

## Must not decide here

- Coverage percent thresholds
- GitHub Actions / Azure DevOps
- Pass/fail bots
