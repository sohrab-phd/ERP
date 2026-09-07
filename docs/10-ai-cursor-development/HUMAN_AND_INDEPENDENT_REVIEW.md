---
id: AI-REVIEW-001
title: Human and Independent Agent Review
phase: 10-ai-cursor-development
status: in_review
version: 0.2.0
owners: [independent-reviewer]
depends_on: [REPO-BR-001, AI-AUTH-001, APR-011]
last_reviewed: 2026-09-07
approval: null
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
identities cannot review, merge, or sign.

## What each kind may produce

| Kind | May produce | Must not produce |
| --- | --- | --- |
| `REV-AGENT` | Findings, questions, draft diffs inside authorized paths | An `APR-*`, a closed `OQ-*`, an unlock, a checkpoint marker |
| `REV-INDEP` | Adversarial verdict and findings | Gate approval |
| `REV-HUMAN` | Gate result, checkpoint marker, later unlock | Silent closure of an unanswered `OQ-*` |

Same-session adversarial review is an independence **limit**, not a
substitute for a later named independent reviewer (OQ-019) or for
Phase 11.

## Architecture-affecting diffs

A later application diff that changes an approved `INV-*`, `ADP-*`,
command catalogue, `CONF-*` rule, or write-owner is a **reopen** of
the owning `APR-*`, not a merge on `BR-IMPL`.

Generated OpenAPI, SQL, or DTOs that disagree with authored catalogues
are rejected (`REPO-GEN-001`), not merged.

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
