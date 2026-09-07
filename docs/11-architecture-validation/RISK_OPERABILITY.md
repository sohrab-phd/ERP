---
id: VAL-RISK-001
title: Risk Operability Security and Small-Team Feasibility
phase: 11-architecture-validation
status: approved
version: 0.3.0
owners: [chief-solution-architect, operations-owner]
depends_on: [GOV-RISKS-001, APR-012, APR-013, ASM-024]
last_reviewed: 2026-09-07
approval: APR-013
supersedes: null
---

# Risk, Operability, Security, and Small-Team Feasibility

A Phase 11 **structure** restatement of residual risk. Minute counts,
named operators, and products stay open.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Residual risk classes

| Register risk | Structure treatment | Still open |
| --- | --- | --- |
| RISK-001 competing Excel truth | One write owner; INV-013/014 operational facts | Workshop adoption (OQ-019) |
| RISK-002 opening inventory | `ADP-CUTOVER` commands Ledger; `GUARD_OPEN_POLICY` until OQ-015 | OQ-015, OQ-019 |
| RISK-003 concurrency | INV-002/016; QA-SCN-CONFLICT; one `ACT-IPS` writer | OQ-017 mechanism |
| RISK-004 decimal precision | Exact-decimal ADR still proposed | OQ-001, OQ-018 |
| RISK-005 genealogy divergence | Rebuild-only; forbidden edits; atomic CompleteProductionOperation | OQ-003, OQ-004, OQ-009 |
| RISK-006 boundary erosion | `mod-*` / `CONF-IMPORT`; no cross-module table writes | OQ-018 layout product |
| RISK-007 premature portal | INV-020 / `ADP-PORTAL` reject order write | OQ-010 |
| RISK-008 customer leakage | SV-005 / SV-012 / `CONF-ISO` | Named isolation testers OQ-019 |
| RISK-009 non-durable worker | Same-key retry; worker not commander; no broker chosen | OQ-018 |
| RISK-010 backups cannot restore | Restore rebuilds Balance/Genealogy from Ledger | OQ-016 RPO/RTO |
| RISK-011 Finance-Lite expansion | ASM-010; export only | OQ-012 |
| RISK-012 small-team / single host | Labels over products; ASM-011 | OQ-018, OQ-019 |
| RISK-013 missing data ownership | Temporary identities have no authority; RACI stays workshop | OQ-019 |
| RISK-014 premature implementation | Architecture-first lock; `AG-IMPL` waits on unlock | Unlock still absent |

## Operability

Runbooks, `ZONE-*`, `HH-*`, and `ENV-*` remain labels. No Docker,
firewall, or secret-store product is chosen. Named operators stay
OQ-019. Device-down fallback is a human `ACT-*` command, not a guessed
protocol.

## Security

`ACT-*` matrix and `SV-001`–`SV-013` remain the baseline. Session and
identity packages stay OQ-018. Temporary identities have no approval
authority. SoD for ReverseGoodsReceipt (SV-013) cannot be waived by
`REV-AGENT`.

## Small-team feasibility

The design stays one Node.js + TypeScript system with module labels,
not a guessed microservices mesh (ADR-0006 open). Agent implementation
later stays path-scoped under a human unlock. Existing Cursor controls
(architecture-gate policy, two rules, write-gate, marker generator)
are the present set; `MCP-EXTRA` stays OQ-018.

A small team cannot operate named UAT, extra MCP products, or a
hosting mesh that this gate would have to invent. Those stay open
rather than being frozen as fake completeness.

## Must not decide here

- RPO/RTO minutes
- Headcount
- A hosting or identity-provider product
- Accepting RISK-014 as closed while implementation remains locked
