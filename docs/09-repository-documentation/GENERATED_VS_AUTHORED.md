---
id: REPO-GEN-001
title: Generated Versus Authored Artifacts
phase: 09-repository-documentation
status: approved
version: 0.3.0
owners: [solution-architect]
depends_on: [APP-ENV-001, DATA-LOGICAL-001, APP-BG-001, APR-010, APR-011]
last_reviewed: 2026-09-07
approval: APR-011
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
| Balance rebuild | Ledger facts | `AdjustBalance` |
| Opening-stock load | Cutover command (`ADP-CUTOVER`) | Balance-only rows; OQ-015 still open |

Until an implementation unlock names exact paths, none of those files
are created. `package.json` and Dockerfiles are not generated from
architecture Markdown.

## Must not decide here

- Prisma, TypeORM, tRPC, or OpenAPI generator products
- Orval, GraphQL codegen, or similar
- Fixture volumes (OQ-014)
