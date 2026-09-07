---
id: PLAN-SPIKE-001
title: Authorized Spike Kinds and Acceptance Labels
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [chief-solution-architect]
depends_on: [APR-013, ASM-025, OQ-017]
last_reviewed: 2026-09-07
approval: null
supersedes: null
---

# Authorized Spike Kinds and Acceptance Labels

Evidence-spike **kinds** that a later unlock might name. None of these
spikes is authorized to run now. None chooses a package.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Spike kinds (labels)

| Kind | Question | Allowed later evidence | Must not |
| --- | --- | --- | --- |
| `SPIKE-POSTING` | OQ-017 posting style | Compare transaction vs restricted function vs hybrid against INV-001–004, DATA-TX-001 | Pick Prisma/Postgres as decided; write production data |
| `SPIKE-DECIMAL` | RISK-004 exact decimal | Show why JS Number is unsafe for weight/money | Freeze a library |
| `SPIKE-IDEM` | INV-016 key store | Same key returns first result | Invent a broker |
| `SPIKE-RESTORE` | RISK-010 / OQ-016 | Restore then rebuild Balance/Genealogy from Ledger | `AdjustBalance` |

A spike that needs an unanswered named person, device protocol, or
product rejects as `GUARD_OPEN_POLICY`. It does not invent the missing
input.

## Acceptance labels (not tests)

Keep/reject still maps to `CONF-IPS`, `CONF-ADP`, `CONF-BUNDLE`,
`CONF-FORBID`, `CONF-ISO`, `CONF-UNLOCK`, `CONF-SECRET`,
`CONF-IMPORT`, and `CONF-CMD`. Generated OpenAPI/SQL that disagrees
with authored catalogues is rejected (`REPO-GEN-001`).

## Must not decide here

- Running a spike in this repository now
- ADR-0006 through ADR-0008
- Jest, Playwright, or a CI product
