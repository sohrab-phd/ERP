---
id: GOV-DOC-STD-001
title: Architecture Documentation Standard
phase: 00-governance
status: approved
version: 0.2.1
owners: [chief-solution-architect]
depends_on: [GOV-GATES-001, ASM-015]
last_reviewed: 2026-09-06
approval: APR-004
supersedes: null
---

# Architecture Documentation Standard

## Language and terminology

- Authoritative prose is English.
- Project-specific Persian terms and aliases belong in
  [BUSINESS_GLOSSARY.md](registers/BUSINESS_GLOSSARY.md).
- Other artifacts use the canonical English term and link its glossary ID.
- Do not silently replace a project-specific concept with a generic one.

## Required frontmatter

Every governed Markdown artifact contains:

```yaml
---
id: UNIQUE-STABLE-ID
title: Human-readable title
phase: NN-phase-name
status: planned
version: 0.1.0
owners: [role-id]
depends_on: []
last_reviewed: YYYY-MM-DD
approval: null
supersedes: null
---
```

Approved artifacts also reference their approval record. Material edits increment
the minor or major version; editorial corrections increment the patch version.
Git history records changes, but does not replace semantic version/status data.

## Stable ID families

- `SRC-*`: source
- `REQ-*`: requirement
- `TERM-*`: glossary term
- `ASM-*`: assumption
- `OQ-*`: open question
- `RISK-*`: risk
- `ADR-*`: decision record
- `BC-*`: bounded context
- `ENT-*`: entity
- `BR-*`: business rule
- `INV-*`: invariant
- `SM-*`: state machine
- `EVT-*`: event
- `INT-*`: integration
- `SEC-*`: security control
- `NFR-*`: non-functional requirement
- `TEST-*`: verification
- `FIND-*`: review finding
- `APR-*`: approval

## Single-source-of-truth rules

- Each fact type has one canonical owning artifact.
- Summaries link to canonical IDs; they do not copy normative definitions.
- A question is closed only in the Open Questions Register.
- After each phase gate package, unanswered questions are asked through
  [TEAM_QUESTION_PACK.md](TEAM_QUESTION_PACK.md). Chat or workshop notes are
  not answers until recorded on the matching `OQ-*` row.
- A decision is authoritative only through an accepted ADR/register entry.
- State transitions and invariants are maintained in their canonical catalogues.
- Database/API/test artifacts reference canonical rules instead of redefining them.
- Workshop outcomes must update canonical records; minutes alone are not decisions.

## Links and diagrams

- Use repository-relative links.
- External source evidence outside the repository may use an explicit absolute
  source path only when it is registered in `SOURCE_REGISTER.md`.
- Use stable ID headings for cross-references.
- Mermaid source remains in Markdown unless a later phase approves another format.
- Diagrams explain relationships but do not supersede normative text.

## Review discipline

Every phase includes an independent review and reconciliation record. Accepted
artifacts may not depend on rejected decisions or unresolved in-scope blockers.
