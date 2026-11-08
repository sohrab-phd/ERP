---
id: PLAN-P4C-GATE-001
title: Proposed bounded APR-053 gate and local unlock reconciliation
phase: 12-implementation-planning
status: draft
version: 0.1.0
owners: [chief-solution-architect, security-architect]
depends_on: [APR-053, PLAN-P4C-DESIGN-001]
last_reviewed: 2026-11-08
approval: null
---

# Protected-control proposal — not applied

The actual Owner's implementation directive §6, quoted in [APR-053](../00-governance/approved-baselines/APR-053-p4c-reservation-ui-implementation-authorization.md),
requires separate approval for this reconciliation. Current canonical gate and
ignored local marker both reference APR-050/P4b. Product writes remain blocked
under the effective scope until this exact proposal is separately authorized.

## Proposed changes to exactly two controls

1. In `.cursor/architecture-gate.json`, replace only `approvedBaseline`:

```diff
-  "approvedBaseline": "docs/00-governance/approved-baselines/APR-050-p4b-sales-ui-implementation-authorization.md",
+  "approvedBaseline": "docs/00-governance/approved-baselines/APR-053-p4c-reservation-ui-implementation-authorization.md",
```

2. Replace local ignored `.cursor/IMPLEMENTATION_UNLOCK.json` with the proposed
   complete marker below, **only after actual separate approval**. Its approval
   provenance describes that prospective reply, not a reply already received.
   Date is the P4c implementation directive date; retain the actual reconciliation
   reply/date in APR-053 when given. Narrow the obsolete P4b path list to these
   explicit P4c implementation and relevant regression/test/documentation paths.
   Replace nonfunctional prefix-like shell entries with the finite exact commands
   below: existing hooks compare full strings, not prefixes. No hook is changed.
   The marker remains ignored/local.

```json
{
  "version": 1,
  "implementationAuthorized": true,
  "approvedBy": "Project Owner P4c implementation directive and separate bounded APR-053 gate reconciliation approval in this chat",
  "approvedAt": "2026-11-08",
  "approvalSource": "Owner explicitly authorized the bounded APR-053 gate reconciliation proposed in P4C_GATE_RECONCILIATION_PROPOSAL.md",
  "approvedBaseline": "docs/00-governance/approved-baselines/APR-053-p4c-reservation-ui-implementation-authorization.md",
  "standingScopeDelegation": "Bounded P4c only under APR-053; no migration/index, formal software acceptance, deployment, push or adjacent-slice authority",
  "scope": "Four exact-customer Sales Reservation reads and fixed two-command browser adapter; native RTL whole-Unit request and separate activation; encrypted recovery/interlock; required tests, measured approved absolute targets, independent reviews, documentation and local commits. Existing business commands/WH bearer authority unchanged.",
  "allowedWritePaths": [
    "apps/backend/src/modules/inventory/reservation-reads.ts",
    "apps/backend/src/modules/inventory/index.ts",
    "apps/backend/src/modules/sales/sales-service.ts",
    "apps/backend/src/modules/sales/contracts.ts",
    "apps/backend/src/modules/sales/index.ts",
    "apps/backend/src/infrastructure/postgresql/inventory-reservation-read-store.ts",
    "apps/backend/src/infrastructure/postgresql/inventory-discovery-store.ts",
    "apps/backend/src/infrastructure/postgresql/sales-store.ts",
    "apps/backend/src/composition-root.ts",
    "apps/backend/src/transport/reservation-browser-http.ts",
    "apps/backend/src/transport/reservation-cursors.ts",
    "apps/backend/src/transport/browser-http.ts",
    "apps/backend/src/operator/reservation.ts",
    "apps/backend/src/operator/reservation-intent.ts",
    "apps/backend/src/operator/app.ts",
    "apps/backend/src/operator/sales.ts",
    "apps/backend/src/operator/display.ts",
    "apps/backend/src/operator/index.html",
    "apps/backend/src/operator/styles.css",
    "apps/backend/tests/**",
    "tools/test/run-unit.mjs",
    "tools/test/run-integration.mjs",
    "tools/test/p4c-chromium.mjs",
    "tools/test/p4c-performance.mjs",
    "tools/build/check-boundaries.mjs",
    "docs/00-governance/CURRENT_PHASE.md",
    "docs/00-governance/APPROVALS.md",
    "docs/00-governance/approved-baselines/APR-053-p4c-reservation-ui-implementation-authorization.md",
    "docs/INDEX.md",
    "docs/12-implementation-planning/P4C_RESERVATION_EXISTING_CAPABILITIES_AND_GAP_MATRIX.md",
    "docs/12-implementation-planning/P4C_RESERVATION_UI_WORKFLOW_AND_CONTRACT_DESIGN.md",
    "docs/12-implementation-planning/P4C_IMPLEMENTATION_AUTHORIZATION_DECISIONS.md",
    "docs/12-implementation-planning/P4C_DESIGN_REVIEW_AND_READINESS.md",
    "docs/12-implementation-planning/P4C_IMPLEMENTATION_PLAN.md",
    "docs/12-implementation-planning/P4C_GATE_RECONCILIATION_PROPOSAL.md",
    "docs/12-implementation-planning/P4C_IMPLEMENTATION_STATUS.md",
    "docs/12-implementation-planning/P4C_OWNER_ACCEPTANCE_PACKAGE.md",
    "docs/12-implementation-planning/IMPLEMENTATION_BACKLOG.md",
    "docs/12-implementation-planning/ERP_CURRENT_STATE_AND_NEXT_STEP.md",
    "docs/12-implementation-planning/ERP_UNFINISHED_WORK_AND_UI_COVERAGE.md",
    "artifacts/tests/p4c-implementation/**",
    "artifacts/tests/p4c-authorization/**"
  ],
  "allowedShellCommands": [
    "git status --short",
    "git status --short --branch",
    "git diff",
    "git diff --check",
    "git diff --stat",
    "git diff --name-only",
    "git diff --cached",
    "git diff --cached --check",
    "git diff --cached --stat",
    "git diff --cached --name-only",
    "git log -1 --format=%H",
    "git show --stat --oneline HEAD",
    "git add -- apps/backend/src apps/backend/tests tools/test tools/build/check-boundaries.mjs",
    "git add -- docs",
    "git commit -m \"feat(p4c): deliver Sales Reservation workspace\"",
    "git commit -m \"docs(p4c): record verified delivery and acceptance evidence\"",
    "npm run preflight",
    "npm run build",
    "npm run format:check",
    "npm run lint",
    "npm run boundaries",
    "npm run typecheck",
    "npm run test:unit",
    "npm run test:integration",
    "npm run verify",
    "node tools/skills/verify-ui-ux-pro-max.mjs",
    "node tools/test/p4c-chromium.mjs",
    "node tools/test/p4c-performance.mjs",
    "powershell -NoProfile -File artifacts/tests/p4c-implementation/run-windows-verification.ps1 -Mode Environment",
    "powershell -NoProfile -File artifacts/tests/p4c-implementation/run-windows-verification.ps1 -Mode Focused",
    "powershell -NoProfile -File artifacts/tests/p4c-implementation/run-windows-verification.ps1 -Mode Regression",
    "powershell -NoProfile -File artifacts/tests/p4c-implementation/run-windows-verification.ps1 -Mode Acceptance",
    "powershell -NoProfile -File artifacts/tests/p4c-implementation/run-windows-verification.ps1 -Mode Chromium",
    "powershell -NoProfile -File artifacts/tests/p4c-implementation/run-windows-verification.ps1 -Mode Performance"
  ]
}
```

Path permissions do not expand business scope. Shared file edits are limited to
P4c integration and required regression fixes; no other slice implementation.
Tests remain under the existing test trees, with two exact root-runner registrations
and two exact Chromium/performance runners. The persistence paths permit only
read-owner work; no direct cross-module writes or command-semantic changes.
Identity's accepted reader/context mechanism is reused, not new grants or identities.
Documentation permissions list exact Markdown paths, not a generalized `docs/**`
grant. The ignored Windows verification launcher is ordinary per-task evidence
scaffolding: fixed ValidateSet modes only, reviewed before execution, pins existing
runtime/PATH in its child process, loads existing private test configuration without
logging it, validates the existing disposable PostgreSQL18.6 identity/roles and
runs only approved root checks/focused fixtures/Chromium/performance. It restores
the existing cluster's initial stopped/running state and cleans known test children.
No arbitrary command parameter, install, hook, ACL, persistent environment or
service configuration change. It does not grant authority; it makes the existing
Windows test setup reproducible under exact command matching. No launcher exists
or is executed yet. Any needed mode/command outside this finite list requires
separate bounded reconciliation rather than a hook bypass.
No accepted migration, package/lock, environment configuration, hook, OS control
or business-policy file is included. Any additional path genuinely required must
be reported for bounded approval rather than silently broadening this marker.

## Validation and application sequence after approval

Record the actual separate human reply in APR-053, apply only the one-field gate
diff and exact local marker, parse both JSON files, verify matching APR-053 and
authoritative manifest fields, and test existing hook admission read-only without
editing hooks. The new path patterns use exact filenames or trailing `/**` only,
with no protected control in the standing implementation path list. If existing
hooks cannot admit this, report the actual failure; no hook patch/bypass or OS
containment work is authorized. Scope remains P4c only.

All protected mode/enforcement/protectedPaths/locked paths/requirements and all
hooks remain unchanged. After reconciliation, proceed autonomously with authorized
P4c work, preserving D6/D7 and the final software-acceptance stop. No migration,
push, deployment/pilot, P4d/P5 or acceptance authority follows from reconciliation.

## Preparation review and actual validation

Independent governance/security and engineering/QA plan review: PASS. Required
security finding on exact shell matching was corrected and independently
re-reviewed CLOSED: prefix-like legacy entries were replaced with finite full
commands. Documentation scope was also narrowed to exact Markdown paths.
No blocking/required preparation finding remains. These are authorization/plan
reviews, not implementation reviews or proof of delivered P4c behavior.

Actual validation:10Markdown files,660local links,two anchors,116metadata
dependencies; seven actual approved P4c decisions and preserved historical
alternatives;54contiguous APR records. Both existing pure shell predicates passed
34positive and4negative proposed-command checks each;42proposed path patterns
passed grammar/protected/migration exclusions. No full hook admission was claimed
against an applied P4c marker. Gate and ignored unlock hashes remain unchanged.
Frozen Windows Node24.21.0 was used for document checks. Receipts are local,
ignored under `artifacts/tests/p4c-authorization/` (documentation validation,
proposed-shell-scope check and protected-control hashes); no product tests or
performance measurements were run for this governance-only preparation.

The Owner can approve this exact two-control reconciliation without reopening
D1–D7 or granting migration/deployment authority. Until that separate reply,
this document remains a proposal and neither protected control is modified.
