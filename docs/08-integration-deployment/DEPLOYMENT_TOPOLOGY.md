---
id: DEP-TOPO-001
title: Deployment Topology and Environment Labels
phase: 08-integration-deployment
status: in_review
version: 0.1.0
owners: [operations-owner, solution-architect]
depends_on: [QA-STRAT-001, ASM-001, ASM-002, APR-009]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# Deployment Topology and Environment Labels

Where later processes run, without choosing Docker, a cloud, or a host
OS (OQ-018, ADR-0008). Environment names reuse Phase 07 `ENV-*`.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Environments

| Label | Purpose | Open |
| --- | --- | --- |
| `ENV-DEV` | Architects and later implementers | Hosting |
| `ENV-TEST` | Repeatable command/sequence evidence | Volume OQ-014 |
| `ENV-UAT` | Later workshop | Named people OQ-019 |
| `ENV-CUTOVER` | Opening-stock rehearsal | OQ-015 |
| `ENV-PROD` | Later live factory LAN | ASM-007 unconfirmed |

One legal entity and one principal site remain ASM-001. A second site
is not drawn.

## Process kinds (labels)

| Kind | May run | Must not |
| --- | --- | --- |
| Command/query backend | Evaluate `ACT-*`, idempotency, guards | Trust the UI |
| `ACT-IPS` posting | Stock writes inside DATA-TX-001 bundles | Run inside Quality/Shipping modules |
| Worker | `CommandRetry`, rebuilds, sweeps | Second stock writer |
| Adapter host | Map and submit commands | Direct table writes |

In-process versus separate worker stays ADR-0008. This topology does
not pick a process manager.

## Network (labels)

Factory LAN availability stays ASM-007. Device credentials, rotation,
and zoning are named as **later controls**, not a firewall product.

## Must not decide here

- Docker Compose, Kubernetes, or a VM vendor
- On-prem versus cloud
- Port numbers or TLS product
