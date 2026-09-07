---
id: PLAN-CUTOVER-001
title: Cutover Training Rollout and Support Labels
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [operations-owner, delivery-lead]
depends_on: [ADP-CUTOVER, APR-013, ASM-025]
last_reviewed: 2026-09-07
approval: null
supersedes: null
---

# Cutover, Training, Rollout, and Support Labels

How go-live would be described later. Named people, freeze procedure,
and RPO/RTO stay open.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Cutover (labels)

| Label | Meaning | Open |
| --- | --- | --- |
| `CUT-COUNT` | Opening stock is a Ledger fact commanded by `ADP-CUTOVER` | OQ-015 source list |
| `CUT-FREEZE` | Count freeze and discrepancy workflow | OQ-015 |
| `CUT-SIGN` | Named sign-off | OQ-019 |
| `CUT-GUARD` | Until OQ-015 and OQ-019 are answered, `ADP-CUTOVER` rejects as `GUARD_OPEN_POLICY` | OQ-015, OQ-019 |

Do not post Balance-only opening stock. Do not `AdjustBalance`.

## Training (labels)

| Label | Meaning | Open |
| --- | --- | --- |
| `TRN-WALK` | Workshop walks QA-SCN-STOCK / PURCHASE / MAKE / REVERSE | OQ-019 names |
| `TRN-SOD` | ReverseGoodsReceipt needs a second distinct human (SV-013) | OQ-019 |
| `TRN-TEMP` | Temporary identities have no authority | — |

## Rollout and support (labels)

| Label | Meaning | Open |
| --- | --- | --- |
| `ROL-SITE` | One principal site unless OQ-013 says otherwise | OQ-013 |
| `ROL-DEVICE` | Weighbridge down → human `ACT-*` command | OQ-011 |
| `SUP-RESTORE` | Restore rebuilds projections from Ledger | OQ-016 |
| `SUP-EXCEL` | Competing Excel truth remains RISK-001 | workshop adoption |

## Must not decide here

- A cutover weekend date
- Named trainers or signers
- Hosting, Docker, or RPO/RTO minutes
