---
id: SEC-AUD-001
title: Audit and Evidence Taxonomy
phase: 06-security-rbac-audit
status: in_review
version: 0.1.0
owners: [security-architect, business-control-owner]
depends_on: [SM-EVT-001, APP-ENV-001, DATA-TX-001, APR-007]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# Audit and Evidence Taxonomy

What must be retained as security and correction evidence. Retention
day-counts stay OQ-016. This is not a SIEM or logging package
(OQ-018).

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Evidence kinds

| Kind | When written | Mutable? |
| --- | --- | --- |
| `AUD-CMD-ACCEPTED` | Command accepted; includes command name, key, actor, fact identity, states | no — reversal is a new command |
| `AUD-CMD-REJECTED` | Command rejected; includes family and `open_item` if `GUARD_OPEN_POLICY` | no |
| `AUD-CMD-REPLAYED` | Same key returned the first result | no |
| `AUD-SOD` | Second human recorded on a sensitive command | no |
| `AUD-REVERSAL` | Compensating command linked to the original fact (INV-005) | no |
| `AUD-OPEN-POLICY` | Rejection because an OQ or `workshop-commercial-practice` was required | no |
| `AUD-ISOLATION-DENY` | Query or notice blocked for customer/scope | no |
| `AUD-AUTHN-FAIL` | Principal could not be bound | no — no posted fact |
| `AUD-ACTOR-TEMP` | Temporary identity attempted a command | no |

Posted commercial documents and Ledger rows remain the business
evidence. These `AUD-*` rows explain who commanded, who authorized,
and why a command was refused.

## Conflict rules

- A rejected command is not a reversal.
- A reversal is `AUD-REVERSAL` plus a new `AUD-CMD-ACCEPTED`.
- Genealogy and Balance rebuilds do not create `AUD-CMD-ACCEPTED`
  stock facts. They may record a rebuild notice that is not source
  truth.
- Finance-Lite audit is not legal-GL evidence (OQ-012).
- Opening-stock cutover evidence later requires OQ-015 names; until
  then cutover commands reject as `GUARD_OPEN_POLICY`.

## Minimum fields

| Field | Required on |
| --- | --- |
| `occurred_at` | all |
| `actor_identity` / `actor_role` | all except failed bind |
| `command` or `query` | all command/query evidence |
| `idempotency_key` | all commands |
| `family` | rejections |
| `fact_identity` | accepted writes |
| `linked_fact` | reversals |
| `customer_scope` | customer-bearing items |

How these fields are stored (table, file, log shipper) stays OQ-018.
How long they are kept stays OQ-016. ASM-012 (historical snapshots
are kept) remains an assumption, not a day count.

## Access

`ACT-SEC` may read audit evidence. Owning `ACT-*` roles may read
evidence for commands they are allowed to present, inside their
customer scope. Temporary identities cannot read or sign audit.

## Must not decide here

- Retention days, backup copies, or off-site (OQ-016)
- Log shipper, SIEM, or hash-chain product
- Legal hold procedure
