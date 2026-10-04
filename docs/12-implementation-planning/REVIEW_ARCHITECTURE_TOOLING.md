---
id: PLAN-REVIEW-ARCH-TOOL-001
title: Architecture tooling testing and physical-slice review
phase: 12-implementation-planning
status: reviewed
version: 0.2.0
owners: [architecture-reviewer]
depends_on: [PLAN-TECH-001, PLAN-ENVELOPE-PHYSICAL-001, ADR-0013, REPO-LAY-001, REPO-DEP-001, QA-STRAT-001]
last_reviewed: 2026-10-04
approval: null
---

# Architecture, tooling and testability review

Independent task perspective relative to the parent coordinating governance.
Reviewer researched and authored the revised technical/physical proposal, so
this is an architecture-source review and self-check of its repair, not an
independent final approval of those same authored bytes. Parent assigns final
readiness/red-team review separately. No product tests run or implementation
authorization implied.

## Sources actually read

AGENTS, README, CURRENT_PHASE, live DECISIONS/OPEN_QUESTIONS;
REPO-LAY-001, REPO-DEP-001, APP-MOD-001, DOM-OWN-001, GOV-SLICE-HOMES-001,
APP-ENV-001, SEC-ID-001, SEC-AUD-001, QA-STRAT-001, QA-GATE-001,
DEP-TOPO-001 and DEP-OBS-001; new command-idempotency specification and both
first-slice planning documents. Earlier review access limitations are historical:
repository reads/search and official research now work after hook retirement/
restart. Ordinary network sandbox blocked shell HTTP initially; read-only npm
metadata research succeeded through supported Auto-review escalation. No
package install/product file/OS changes.

Official sources and exact pin evidence are linked in TECHNICAL_FREEZE.md.
No latest/tag text alone claimed runtime compatibility: Node/npm bundled pins,
PG support, TS-ESLint peer matrix and publisher versions were inspected.

## Findings and disposition

| Classification | Finding | Disposition |
| --- | --- | --- |
| Documentation inconsistency / potential blocker | Old physical tuple omitted installation identity and key was text; advisory proposal differed from generic claim proposal | Replaced with full installation/scope/UUID v4 PK; principal separately bound; terminal-only transaction advisory lock + separate post-lock SELECT |
| Documentation inconsistency / potential blocker | Old audit FK cycle/candidate fields could diverge from ADR-0011 | Audit first then outcome composite FK full identity/decision; no reverse FK; role/customer fields and explicit attempt taxonomy extension |
| Technical blocker before freeze | Current supported pins had not been verified | Verified Node24.21.0/npm11.19.0/PG18.6/pg8.23.1 and exact TS/types/lint/format; TS6.0.3 selected because current TS-ESLint does not support TS7 |
| Architecture concern | "shared kernel" might take Identity/Audit business ownership | Logical mod-identity-audit persistence realized by backend adapter; kernel owns ports/contracts only; no domain SQL |
| Documentation inconsistency | Existing logical path labels could be mistaken for mandatory physical folders | REPO-LAY-001 explicitly defers apps/packages; ADR-0013 resolves this later technical choice, preserves module direction |
| Scope concern | Adapter homes in SLICE-ENVELOPE could imply print/live/report implementation | Exact first grant excludes them, workers and business routes; homes remain capability mapping |
| Testing concern | Empty test-discovery success or mock DB could masquerade as transaction proof | Fixed compiled inventories fail missing/zero cases; actual PG with independent connections and controlled crash fixtures |
| Security concern | Fixture principal/command reachable in production | Production composition empty business registry, health-only; no test synthetic imports or client role authority |
| Determinism concern | packageManager does not itself enforce npm | Explicit preflight check, exact Node/npm, root lock and npm ci; no lifecycle indirection |
| Non-blocker | Identity product/framework for business HTTP not chosen now | Before later identity/routes; foundation tests trusted ports, no custom production auth |
| Future/deferred | Hosting, HA, device protocol, catalogues, backup day counts, UAT/cutover people/data | Existing later slice/UAT/Go-Live/future classifications retained; not foundation blockers |
| Future/deferred | Quality/portal ordering/legal GL/multi-site | No current MVP dependency, role or implementation |

## Architecture conclusions

Foundation respects accepted Modular Monolith, PostgreSQL transactional truth,
one application-owned connection/transaction, typed owner ports and no second
inventory writer. Inventory Ledger vs rebuildable Balance, Production bundles,
fact-source Genealogy, sales closure and reservations are untouched: no domain
tables/commands are in this grant. Personal-account identity required, Station
not user; no MVP QC or portal write. Quantity precision remains owning later
decision, no invented operational input.

Direct pg is selected for explicit SQL/lock/savepoint control, not popularity.
Node built-in health/test avoids foundation framework/runner infrastructure.
Typed TS lint/strict compile/import boundary checks plus actual PG tests give
professional verification without introducing distributed machinery.

## Evidence limits and implementation acceptance

git diff --check passed after document updates. This is document/research/static
design evidence only. Actual package install/compile/test/SQL migration/CI proof
must occur within the eventual human implementation grant and is part of DoD,
not pre-implementation product work.

No unresolved architecture/tooling choice requires another design cycle for
the bounded foundation. Remaining independent reviewer findings, if any, must
be resolved before the parent declares readiness. This document does not declare
the whole repository ready or fabricate human acceptance.
