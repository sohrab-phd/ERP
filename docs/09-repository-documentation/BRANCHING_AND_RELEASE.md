---
id: REPO-BR-001
title: Branching Review and Release Labels
phase: 09-repository-documentation
status: approved
version: 0.3.0
owners: [development-lead]
depends_on: [GOV-GATES-001, APR-010, APR-011]
last_reviewed: 2026-09-07
approval: APR-011
supersedes: null
---

# Branching, Review, and Release Labels

How later change is controlled. This does not choose GitHub, GitLab,
or a branching-product name.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Branch kinds (labels)

| Label | Purpose | Open |
| --- | --- | --- |
| `BR-ARCH` | Architecture Markdown (this repository now) | Hosting product |
| `BR-IMPL` | Later application work after implementation unlock | Unlock file |
| `BR-FIX` | Later defect against an approved baseline | Reopen rules |

A later implementation branch may not silently change an approved
`INV-*`, `ADP-*`, or command catalogue. That is a reopen of the owning
approval. Frozen checkpoint commits (`CHK-*`) are not amended.

`BR-IMPL` does not exist while `IMPLEMENTATION_AUTHORIZED` is false.

## Review kinds (labels)

| Label | Meaning |
| --- | --- |
| `REV-HUMAN` | Project Owner or named reviewer (OQ-019) |
| `REV-INDEP` | Independent architecture pass (Phase 11 style) |
| `REV-AGENT` | Later AI agent; cannot approve architecture (Phase 10) |

Temporary workshop identities cannot merge or approve.

## Release kinds (labels)

| Label | Meaning | Open |
| --- | --- | --- |
| `REL-ARCH` | Approved phase checkpoint (CHK-*) | — |
| `REL-APP` | Later application version | Version scheme, registry |

No application release exists while `IMPLEMENTATION_AUTHORIZED` is
false.

## Must not decide here

- GitHub Flow versus GitLab Flow versus trunk-based product names
- Protected-branch vendor settings
- SemVer versus calendar versioning for the app
