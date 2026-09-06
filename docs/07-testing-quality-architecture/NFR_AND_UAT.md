---
id: QA-NFR-001
title: NFR Recovery and UAT Intents
phase: 07-testing-quality-architecture
status: in_review
version: 0.1.0
owners: [qa-architect, operations-owner]
depends_on: [QA-STRAT-001, SEC-VER-001, APR-008]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# NFR, Recovery, and UAT Intents

Named later proofs for security (already in SV-*), recovery, outage,
performance, and workshop acceptance. Numbers stay open where an OQ
owns them.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Security

Use SV-001 through SV-013. Do not add JWT/MFA product tests that
invent OQ-018.

## Recovery and outage

| Intent | Statement | Open |
| --- | --- | --- |
| `QA-R-RESTORE` | A restore can rebuild Balance and Genealogy from Ledger | RPO/RTO OQ-016 |
| `QA-R-DEVICE` | Weighbridge down → human ACT-* command, not silent Ledger write | OQ-011 |
| `QA-R-WORKER` | Transport retry uses the same idempotency key | OQ-018 scheduler |
| `QA-R-CUTOVER` | Opening stock is a Ledger fact with named sign-off | OQ-015 |

Do not invent minute counts for RPO or RTO.

## Performance

ASM-002 (about 15–25 concurrent users) remains an assumption, not a
load-test target. Volume stays OQ-014. A later performance plan may
cite ASM-002 as `keep`/`replace` only after the team answers.

## UAT

| Intent | Statement | Open |
| --- | --- | --- |
| `QA-UAT-STOCK` | Workshop walks QA-SCN-STOCK with real roles | OQ-019 names |
| `QA-UAT-MAKE` | Workshop walks QA-SCN-MAKE | OQ-003, OQ-019 |
| `QA-UAT-QC` | Workshop walks hold/release | OQ-005 |
| `QA-UAT-PORTAL` | Not in MVP ordering | OQ-010 |

Temporary identities cannot sign UAT. Until OQ-019 is answered, UAT
execution stays blocked even though these intents exist.

## Must not decide here

- k6, JMeter, or a chaos product
- Backup vendor
- UAT calendar
