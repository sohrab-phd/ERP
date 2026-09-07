---
id: VAL-CORR-001
title: Corrective Action and Reapproval Record
phase: 11-architecture-validation
status: in_review
version: 0.1.0
owners: [chief-solution-architect]
depends_on: [VAL-INT-001, VAL-XDOM-001, ASM-024]
last_reviewed: 2026-09-07
approval: null
supersedes: null
---

# Corrective-Action and Reapproval Record

What this structure pass requires to be changed now, versus what stays
an open extension.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## In-scope corrective actions

None. No approved baseline is marked `suspect` by this pass. No
reapproval of APR-004 through APR-012 is required to continue Phase 11
**structure** work.

## Deferred actions (not this gate)

| ID | Action | Wait on |
| --- | --- | --- |
| `CA-OQ` | Record team answers on matching `OQ-*` rows | Project Owner / workshop |
| `CA-TEST` | Later verification items after a runner ADR | OQ-018; FIND-028 |
| `CA-UAT` | Named UAT roster | OQ-019 |
| `CA-UNLOCK` | Human implementation unlock with exact paths | Phase 12 + final authorization |
| `CA-REOPEN` | Reopen an `APR-*` if a later answer contradicts it | Material answer |

## Reapproval rule

A later answer that reverses an approved write-owner, bundle,
forbidden-write, isolation, or agent-authority rule reopens the owning
approval. It does not silently patch code or Markdown.

## Must not decide here

- Closing FIND-037 without ASM-024 accept/reject
- Inventing a correction that guesses UOM, names, or products
