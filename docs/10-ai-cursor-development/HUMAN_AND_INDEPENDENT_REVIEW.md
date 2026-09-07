---
id: AI-REVIEW-001
title: Human and Independent Agent Review
phase: 10-ai-cursor-development
status: approved
version: 0.4.0
owners: [independent-reviewer]
depends_on: [REPO-BR-001, AI-AUTH-001, APR-011, APR-012]
last_reviewed: 2026-09-07
approval: APR-012
supersedes: null
---

# Human and Independent Review

How later agent output is reviewed. Named reviewers stay OQ-019.
Review-bot products stay open.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Review kinds (from REPO-BR-001)

| Kind | May approve architecture? | May merge application code later? |
| --- | --- | --- |
| `REV-HUMAN` | Yes, if the Project Owner or a named person (OQ-019) | Yes, after unlock and review |
| `REV-INDEP` | No; produces a verdict only | No |
| `REV-AGENT` | No | No |

An agent cannot approve its own architecture change. Temporary
identities cannot review, merge, or sign. SoD pairs (including
SV-013 ReverseGoodsReceipt) cannot be “reviewed away” by `REV-AGENT`.

## What each kind may produce

| Kind | May produce | Must not produce |
| --- | --- | --- |
| `REV-AGENT` | Findings, questions, draft diffs inside authorized paths | An `APR-*`, a closed `OQ-*`, an unlock, a checkpoint marker |
| `REV-INDEP` | Adversarial verdict and findings | Gate approval |
| `REV-HUMAN` | Gate result, checkpoint marker, later unlock | Silent closure of an unanswered `OQ-*` |

Same-session adversarial review is an independence **limit**, not a
substitute for a later named independent reviewer (OQ-019) or for
Phase 11.

## Architecture-affecting versus local (labels)

A later application diff is a **reopen** of the owning `APR-*`, not a
merge on `BR-IMPL`, when it changes any of:

- an approved `INV-*` or state machine
- an `ADP-*` commander/write rule
- a command/query catalogue ID
- a `CONF-*` keep/reject rule
- a write owner (`ACT-IPS` vs commander)
- a DATA-TX-001 bundle boundary
- customer isolation (SV-012) or SoD (SV-013)

A later diff may stay local (still needs `REV-HUMAN` after unlock)
only if it stays inside named unlock paths and does not change those
rules. Generated OpenAPI, SQL, or DTOs that disagree with authored
catalogues are rejected (`REPO-GEN-001`), not merged.

## Standing review rules

1. Every phase still requires self-check, independent review,
   reconciliation, explicit human approval, and checkpoint.
2. A question pack is not approval and is not an implementation unlock.
3. “Ok, Continue” is not phase approval.
4. Chat answers become authoritative only on the matching `OQ-*` row.
5. Phase 11 is the integrated independent review. This phase does not
   start it.

## Must not decide here

- Named reviewers
- A review-bot product
- Coverage percents that replace `QG-*` evidence kinds
