---
id: PLAN-DEV-WORKFLOW-001
title: ERP capability development workflow
phase: 12-implementation-planning
status: accepted
version: 1.1.0
owners: [delivery-lead, chief-solution-architect]
depends_on: [ADR-0006, ADR-0007, PLAN-IMPLEMENTATION-BACKLOG-001, GOV-CURRENT-001]
last_reviewed: 2026-10-07
approval: null
---

# ERP development workflow

Effective under the Project Owner's development-operating-model instruction,
recorded 2026-10-05. This is the working engineering process, not a new approval
committee or permission to invent business rules. Use current
[authorization/scope](../00-governance/CURRENT_PHASE.md), the accepted
[backlog](IMPLEMENTATION_BACKLOG.md) and relevant canonical sources.
Factory usefulness, correctness and maintainability decide the approach.

## Scope and proportionality

Meaningful behavior changes follow the lifecycle below. A small fix can keep its
plan, review and evidence in the task/commit; a major capability uses a short
execution plan and updates its canonical implementation page. Documentation-only
changes need source/link/diff review, not unrelated product tests. Do not restart
accepted work for cosmetic conformity. Only require evidence relevant to the
changed surface; an unavailable required check is BLOCKED, never PASS.

Deliver foundation -> core domain capability -> integration -> UI workflow ->
validation/review -> commit, following actual dependencies. Within a module:
core -> required operational features -> validation -> optional enhancements.
Do not build all modules horizontally or design distant options upfront.

## 1. Scope

Identify the business goal, actual factory users and operating location, relevant
workflow, accepted requirements/invariants, dependencies and explicit exclusions.
Write a concise Definition of Done with observable acceptance scenarios. Cite
existing command/slice/invariant identifiers; do not mint a vanity test catalogue.
Read the live OQs relevant to this behavior. Resolve genuinely required business
inputs or keep the affected optional branch unavailable/guarded; never guess.

## 2. Minimal design

Describe the owner, public command/query/API contracts, state transitions,
persistence/constraints, transaction boundaries, authorization, errors, audit
and test intent. Include UI behavior only where there is a user-facing surface.
Use existing interfaces before introducing abstractions. Material architecture
changes need a recorded ADR with evidence and appropriate authority; routine
implementation choices stay in the plan. Do not reopen accepted factory rules.

Before adding a library/framework/service/queue/cache/generic subsystem ask:
what current documented factory requirement needs it, what simpler option works,
what maintenance burden results, and whether expected scale justifies the cost.
Speculative benefit is insufficient; unnecessary complexity is a review defect.

## 3. Implement a coherent increment

Deliver the smallest useful capability across its required layers. Validate the
core workflow before secondary reporting, conveniences or analytics. Every
table/state has one writer; other modules use the owner's public ports.
Preserve the [ownership matrix](../02-domain-business-architecture/MODULE_OWNERSHIP_MATRIX.md),
[dependency rules](../09-repository-documentation/DEPENDENCY_AND_IMPORT_RULES.md)
and accepted atomic bundles. ACT-IPS is the sole inventory poster; never edit
Balance directly. Ledger truth, kg/no-negative stock, production atomicity,
genealogy sources and sales closure/reservation semantics remain binding.
PostgreSQL transactions precede any unnecessary distributed mechanism.

For UX, establish who acts, where, essential information, time-critical tasks,
likely errors and familiar factory terminology. Minimize screens/clicks/duplicate
entry; show clear loading, empty, validation, rejection and retry states. Preserve
keyboard/accessibility behavior and data scope. Do not expose internal architecture
or pretend a timed-out command failed before resolving the same idempotency key.

## 4. Test relevant behavior

Use [test strategy](../07-testing-quality-architecture/TEST_STRATEGY.md) and the
changed capability's acceptance criteria. Choose unit, integration, API/contract,
RBAC, validation/error and regression tests by risk. Add PostgreSQL transaction,
migration, constraint, race/deadlock and crash/retry tests where persistence needs
them; do not mock the database behavior being proved. Use frontend component
tests when useful and E2E only for critical cross-module journeys. Prefer failure
and invariant proof over coverage/test-count targets.

Windows-only development/validation is the Owner's policy. No Linux/Ubuntu/WSL
setup or testing. Keep exact pins from [technical freeze](TECHNICAL_FREEZE.md).
Real PostgreSQL18.6 tests require distinct restricted runtime and DDL-owner roles,
the acknowledged disposable test DB, separate dev DB, UTF8 and reset safeguards.
Never reset production or silently substitute a different database/version.
See [developer workflow](../../README.md#foundation-developer-workflow).

Record actual commands, versions, result and any unavailable check. Historical
evidence is not a fresh run. Changed behavior requires its relevant proof;
unchanged accepted database behavior need not be rerun for a Markdown edit.

## 5. Independent engineering review and fix

After implementation/testing, use an independent reviewer who did not author
the changed behavior; a suitable subagent can review a bounded diff and relevant
sources. It may cover engineering and security together. If independent review
is unavailable, record the limitation and keep acceptance open rather than
calling self-review independent.

Review domain correctness, owners/imports, SQL/transactions, public contracts,
maintainability, security, error/observability behavior, appropriate factory-scale
performance risks, tests and unnecessary complexity. Findings carry evidence,
impact, location and an actionable correction; classify each:

| Class | Acceptance effect |
| --- | --- |
| Blocking defect | Fix and retest before acceptance |
| Required improvement | Fix and verify before acceptance |
| Non-blocking improvement | Record impact and follow-up without inventing a blocker |
| Future/deferred | Record dependency/trigger and keep out of current scope |

Resolve required findings and re-review changed behavior. Repeat until no
required finding remains; a clean review is not proof that unrun tests passed.

## 6. Security review

Security is mandatory and proportional to the actual changed surface. Use
[threat model](../06-security-rbac-audit/THREAT_MODEL.md),
[RBAC](../06-security-rbac-audit/ROLE_PERMISSION_MATRIX.md),
[isolation](../06-security-rbac-audit/CUSTOMER_ISOLATION.md) and
[audit taxonomy](../06-security-rbac-audit/AUDIT_TAXONOMY.md).
Use relevant [OWASP ASVS](https://owasp.org/projects/asvs) requirements and
[OWASP cheat sheets](https://cheatsheetseries.owasp.org/IndexTopTen.html);
cite versioned ASVS IDs only when actually assessed, never claim certification.

| Changed surface | Required risk checks where applicable |
| --- | --- |
| Identity/object access | Authentication, current RBAC/scope, privilege escalation, IDOR/BOLA; server-derived principal, deny by default |
| Command/persistence | SQL/command injection, mass assignment, validation, same-key binding, races, transaction integrity and audit tampering |
| Browser/API | XSS, session/CSRF, safe errors, CORS, authorization on every exposed object/action |
| Files/outbound requests | Unsafe path/content handling, upload/download isolation, SSRF, destination/size/type limits |
| Data/config/logs | Least-privilege DB access, credential handling, customer/secret exposure, immutable evidence and redacted operational logging |
| Resources/dependencies | Relevant DoS bounds, pool/timeout limits, proportional performance, reliable vulnerability audit and reviewed provenance |

Mark truly inapplicable risks with a reason. Rank findings critical/high/medium/low
with reachability and impact; also classify acceptance effect above. No known
critical/high finding may remain at acceptance. Review material medium findings
explicitly; severity alone does not excuse a required correction.
Add regression/negative tests for exploitable behavior. No heavyweight security
platform or malicious-agent OS containment is part of this process.

Use a dependency audit when lock/dependencies change or a release needs refreshed
advisory evidence. npm audit sends dependency metadata to the configured registry,
not source; record tool/advisory scope and availability. Do not run automatic
audit fix or upgrade pins blindly. An audit outage is unavailable evidence, not
a clean result. [npm audit documentation](https://docs.npmjs.com/cli/v11/commands/npm-audit/)
defines its report/threshold behavior.

## 7. Acceptance

ACCEPTED requires intended functionality, relevant passing tests, closed review
blockers/required improvements, addressed security findings, valid ownership,
up-to-date implementation reality and the slice DoD. No known critical/high
defect. Explain non-blocking/deferred items and their triggers. Otherwise BLOCKED
with the precise unresolved requirement; do not dilute the DoD for convenience.

## 8. Document the implementation

Update the existing canonical module/implementation page with responsibility,
delivered workflows, public commands/APIs, important tables/constraints,
invariants, authorization, dependencies/decisions, limitations and deferrals.
Keep contracts/domain truth in their owning documents and link to them; do not
copy the architecture into every report. Finalize documentation before the
commit; document real behavior rather than aspirations or fabricated acceptance.

## 9. Final checks and local commit

Review final source/lock/migration/diff scope, relevant checks and
git diff --check (working and staged). Check no credentials, generated artifacts,
unintended dependency/schema changes or unrelated work are included. Commit the
accepted coherent capability with a professional message. Never rewrite/push
history remotely without explicit authorization. Report the local hash as ready
for the Owner to push; this does not itself send a message to another service.

```text
MODULE/Slice: <name>
STATUS: ACCEPTED
TESTS: <actual test summary>
REVIEW: PASS | findings
SECURITY: PASS | findings
DOCUMENTATION: UPDATED
COMMIT: <accepted local implementation commit hash>
READY TO PUSH: YES

IMPLEMENTED SO FAR:
1. <first accepted module/slice> — <short delivered responsibility>
2. <next accepted module/slice> — <short delivered responsibility>

CURRENT PROJECT STATE:
- <actual implemented capability>
- <actual implemented capability or important unfinished business area>

NEXT IMPLEMENTATION:
<next approved backlog slice> — <purpose and major completed dependency, if relevant>

REMAINING MAJOR AREAS:
<short high-level list of major areas not yet implemented>
```

READY TO PUSH is YES only after DoD acceptance and a successful local commit.
Use engineering ACCEPTED accurately; do not invent human UAT/release approval.

After every accepted major module/slice, include this concise overall ERP progress
summary in the same completion report. Derive it from actual committed code,
acceptance/test/review records and the approved backlog, not documentation existence
or inferred plans. List completed major capabilities in implementation order;
distinguish foundations/infrastructure from business modules where useful. Do not
count tooling/process updates as delivered business capabilities or count blocked,
unfinished or uncommitted implementation as complete.

CURRENT PROJECT STATE has 2–5 short bullets describing what the implemented ERP
can do, including material limits. NEXT IMPLEMENTATION names the next approved
backlog slice and its purpose/dependency; naming it is not starting it. REMAINING
MAJOR AREAS is a short high-level list, not a reproduced backlog. Refresh the
summary after each accepted slice; do not manufacture percentage-complete figures
without a meaningful approved metric.

For blocked work retain STATUS: BLOCKED, actual findings/unavailable evidence,
COMMIT: NOT READY and READY TO PUSH: NO; do not present it as accepted progress.
After the full accepted-delivery report with READY TO PUSH: YES, stop before the
next major slice so the Project Owner can push the local commit. Scope-recording
delegation does not waive this stop, testing/review gates or the no-push rule.

## Lightweight automation and skill selection

Current Windows CI runs pinned install/preflight, format, lint, import boundaries,
tsc -b (typecheck plus emitted build), unit tests and npm audit --audit-level=high.
Real Windows PG integration/
migration acceptance remains mandatory locally; database CI is not yet provisioned.
Add Windows database CI when its isolated environment exists, and reliable
dependency/security checks for the changed/release surface. Missing DB automation
must stay visible, not be replaced by skipped/mocked database tests. Do not
introduce Docker, deployment topology or a platform before hosting needs justify it.

Use only relevant project skills from .agents/skills:

| Skill | Load when |
| --- | --- |
| erp-module-delivery | Delivering a meaningful capability/module |
| erp-security-review | Reviewing acceptance of a changed application/security surface |
| erp-database-review | SQL/migrations/persistence/transactions/concurrency change |
| erp-api-review | Command/query/API contracts or adapters change |
| erp-frontend-review | Meaningful factory UI/customer visibility workflow changes |
| erp-test-review | Reviewing a meaningful slice's acceptance evidence |

These are local instruction files with links to canonical sources; no helper
scripts, install hooks, new dependencies or source export. Before any third-party
skill, inspect source/executables/dependencies/network/data reads or export and
installation scope. Reject opaque/unneeded/overprivileged behavior. Graphify is
installed and accepted: use the [project-local offline graph policy](../../.agents/skills/graphify/SKILL.md)
and [tooling receipt](GRAPHIFY_TOOLING.md) for targeted navigation; source remains
authoritative and indexing never exports ERP contents.
New skill folders can be discovered by a fresh task/session; current tasks can
read the exact SKILL.md directly, without an installation/bootstrap procedure.

## Apply immediately without restarting accepted work

SLICE-ENVELOPE's report already records design, actual tests, independent review,
atomicity/security corrections, documentation and local commit0f722def8fb0296f60f3a444839bfac939c768f7.
The Windows-only policy is recorded in9a5876f. Preserve historical runtime
evidence. This operating-model change reviews sources/links/skills/CI; it does not
rerun unchanged database tests or claim a native Windows18.6 database was tested.

Next backlog dependency is Identity/authorization before business access. Prepare
its bounded scope from SESSION_AND_IDENTITY/RBAC/current-context contracts and
required OQ019 mappings; real provider/person/ACT decisions need their actual
evidence. Current canonical recorded product grant is foundation-only. The Owner's
continuation direction must be reconciled with a matching bounded scope before
new product writes; this workflow never self-creates an expanded unlock or invents
principals. Advance independent planning/review while preserving that boundary.

## Adoption evidence (2026-10-05)

Independent engineering/security review: PASS for this operating-model change;
no required findings remain. Forward-use scenario: an API/DB change with unavailable
Windows PG proof remains BLOCKED, while bounded planning/static review can proceed.
No mock/historical test substitution or premature commit readiness was accepted.
Six skills pass the standard creator validator; filesystem contains only six
SKILL.md instructions and all20 canonical references resolve. AGENTS is32lines.
Repository links:287 Markdown pages/1605 local references, zero missing targets.
Windows CI YAML formatting passes; current registry audit reports0known
vulnerabilities across118 dependency entries. This is advisory evidence, not a
security guarantee. Gate/unlock/product/versions/migrations remain unchanged.
No Linux, database reset/retest, third-party skill installation or remote push
was used for this adoption. The local commit contains this evidence and the
final delivery message records its hash; this is engineering acceptance, not
fabricated human UAT/release approval.
