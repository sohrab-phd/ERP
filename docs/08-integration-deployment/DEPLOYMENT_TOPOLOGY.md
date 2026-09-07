---
id: DEP-TOPO-001
title: Deployment Topology and Environment Labels
phase: 08-integration-deployment
status: approved
version: 0.3.0
owners: [operations-owner, solution-architect]
depends_on: [QA-STRAT-001, APP-BG-001, ASM-001, ASM-002, APR-009, APR-010]
last_reviewed: 2026-09-07
approval: APR-010
supersedes: null
---

# Deployment Topology and Environment Labels

Where later processes run, without choosing Docker, a cloud, or a host
OS (OQ-018, ADR-0008). Environment names reuse Phase 07 `ENV-*`.
Network zoning and host hardening are **labels** (Phase 06 deferred
them here). They are not a firewall or hardening product.

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
| `ACT-IPS` posting | Stock writes inside DATA-TX-001 bundles | Run inside Quality/Shipping modules or adapter hosts |
| Worker | `CommandRetry`, `GenealogyRebuild`, `BalanceRebuild`, sweeps | Second stock writer (THR-009) |
| Adapter host | Map and submit commands (`ADP-*`) | Direct table writes; split a DATA-TX-001 bundle |

In-process versus separate worker stays ADR-0008. This topology does
not pick a process manager.

## Network zones (labels)

Factory LAN availability stays ASM-007. These zones name trust, not
VLANs or a vendor.

| Zone | Contains | Trust |
| --- | --- | --- |
| `ZONE-UI` | Browser and shop-floor UI | Untrusted; `SharedTerminal` still requires per-command `actor_identity` |
| `ZONE-BACKEND` | Command/query evaluation, idempotency | Inside `TB-BACKEND` |
| `ZONE-DEVICE` | Weighbridge / printer | Commander only; not a Ledger writer |
| `ZONE-WORKER` | Retry and rebuild kinds | Commands; not a second stock writer |
| `ZONE-EXPORT` | GL export, reports, live notices | Isolated payloads only |

Device credentials, rotation, and zoning are later controls. Port
numbers, TLS product, and VPN product stay open.

## Host hardening (labels)

| Label | Statement | Open |
| --- | --- | --- |
| `HH-LEAST` | Adapter and UI hosts cannot write Ledger except by submitting a command | Hosting product |
| `HH-SECRET` | Device and session secrets do not appear in `OBS-*` or exports | Secret store product |
| `HH-PATCH` | Later OS/runtime patching is required | Patch tool |
| `HH-NO-UI-TRUST` | A UI-claimed role is not authorization (SV-001) | — |

## Must not decide here

- Docker Compose, Kubernetes, or a VM vendor
- On-prem versus cloud
- Port numbers or TLS product
- Firewall, VPN, or EDR product
