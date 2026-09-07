---
id: REPO-GEN-001
title: Generated Versus Authored Artifacts
phase: 09-repository-documentation
status: in_review
version: 0.1.0
owners: [solution-architect]
depends_on: [APP-ENV-001, DATA-LOGICAL-001, APR-010]
last_reviewed: 2026-09-07
approval: null
supersedes: null
---

# Generated Versus Authored Artifacts

What later code may generate, and what stays human-authored. No
generator runs in this phase.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Authored (human / architecture)

- All `docs/` architecture Markdown
- Canonical registers and ADRs
- Command and query catalogues as design
- Cursor rules that encode approved gates

## Generated later (after implementation unlock)

| Kind | May be generated from | Must not become source truth |
| --- | --- | --- |
| Typed command DTOs | APP-CMD-001 / envelope labels | A second command catalogue |
| SQL/ORM artifacts | Phase 04 logical model + later ADR | Ledger rewrite rules |
| OpenAPI files | Query/command envelope | Isolation policy |
| Genealogy projection rebuild | Ledger facts | `EditGenealogy` |

Until an implementation unlock names exact paths, none of those files
are created.

## Must not decide here

- Prisma, TypeORM, tRPC, or OpenAPI generator products
- Orval, GraphQL codegen, or similar
