---
id: REPO-DOC-001
title: Documentation Ownership
phase: 09-repository-documentation
status: approved
version: 0.3.0
owners: [chief-solution-architect]
depends_on: [GOV-INDEX-001, APR-010, APR-011]
last_reviewed: 2026-09-07
approval: APR-011
supersedes: null
---

# Documentation Ownership

Who later maintains which Markdown. Named people stay OQ-019.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Surfaces

| Surface | Role owner | Named person |
| --- | --- | --- |
| `docs/00-governance/` | Chief solution architect | OQ-019 |
| `docs/01`–`docs/08` approved baselines | Owning phase architect | OQ-019 |
| `docs/09`–`docs/12` while in review | Owning phase architect | OQ-019 |
| Canonical registers | Register owner in frontmatter | OQ-019 |
| Later generated API/schema docs | Development lead | OQ-019 |
| Workshop notes | Must not replace a register row | OQ-019 |

Architecture Markdown in `docs/` remains the design authority. A later
code comment or generated OpenAPI file cannot silently close an
`OQ-*` or replace a command catalogue.

English remains the architecture language. Persian appears only in the
glossary. Temporary workshop identities cannot be documentation
approvers.

## Must not decide here

- Wiki product
- Named maintainers
- Doc-site generator (Docusaurus, MkDocs)
