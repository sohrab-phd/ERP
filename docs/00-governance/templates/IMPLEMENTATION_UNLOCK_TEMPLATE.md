---
id: TEMPLATE-IMPLEMENTATION-UNLOCK
title: Implementation Unlock Template
phase: 00-governance
status: approved
version: 0.1.0
owners: [project-sponsor, chief-solution-architect]
depends_on: [PHASE-12]
last_reviewed: 2026-09-04
approval: APR-002
supersedes: null
---

# Implementation Unlock Template

This file documents the future human-created
`.cursor/IMPLEMENTATION_UNLOCK.json`. It must not be created before Phase 12.

```json
{
  "version": 1,
  "implementationAuthorized": true,
  "approvedBy": "Named approver",
  "approvedAt": "YYYY-MM-DDTHH:MM:SS+03:30",
  "approvedBaseline": "docs/00-governance/approved-baselines/APR-NNN-final-architecture.md",
  "allowedWritePaths": [
    "apps/api/**",
    "package.json"
  ],
  "allowedShellCommands": [
    "npm install"
  ]
}
```

The protected policy must independently set `implementationAuthorized` and
reference the same approved baseline. The baseline must be an approved manifest
with a recorded Git commit. Missing, malformed, mismatched, broad-wildcard, or
outside-project scopes remain locked.

File edits are limited to listed exact paths or `directory/**` prefixes. Shell
commands require exact string matches and a separate user approval at execution.
