---
id: DEP-OBS-001
title: Observability Kinds
phase: 08-integration-deployment
status: in_review
version: 0.1.0
owners: [operations-owner, qa-architect]
depends_on: [SEC-AUD-001, APP-ENV-001, APR-009]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# Observability Kinds

What operators may later see, without choosing a logging, metrics, or
tracing product (OQ-018).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Signal kinds

| Kind | Meaning | Must not |
| --- | --- | --- |
| `OBS-AUDIT` | `AUD-CMD-*` accepted/rejected evidence | Replace Ledger as stock truth |
| `OBS-HEALTH` | Process up/down for backend, worker, adapter | Bypass isolation |
| `OBS-METRIC` | Counts of accepted/rejected commands | Invent SLA numbers |
| `OBS-TRACE` | Correlation of one idempotency key across retry | Store another customer’s payload |
| `OBS-ALERT` | Named conditions for later runbooks | Page a temporary identity |

Customer isolation applies to every exported log line and live notice
(SV-012).

## Alert conditions (labels)

- Repeated `GUARD_CONFLICT` on one unit
- Adapter transport failures that exhaust same-key retry
- Weighbridge down (human fallback, QA-R-DEVICE)
- Restore needed (QA-R-RESTORE)

Thresholds and tools stay open. ASM-002 concurrent-user counts are not
a load-test target.

## Must not decide here

- Prometheus, Grafana, ELK, OpenTelemetry, or Sentry
- Pager vendor
- Retention days for logs (OQ-016)
