---
id: IMPL-P2-NAV-REMEDIATION-001
title: P2 final bounded navigation lifecycle remediation
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [delivery-lead, security-architect]
depends_on: [APR-046, APR-045, APR-043, IMPL-P2-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-11-05
approval: null
---

# P2 final bounded remediation — pending separate closure review

Implementation began2026-11-04; final browser/database verification resumed
2026-11-05 after the paused test processes and browser session had ended. Earlier
partial browser captures are retained separately; they are not credited as a
completed browser run.

The actual Owner directive authorizes only SEC-P2-01-NAV, necessary regressions
and harness adjustments, investigation of the unexplained257-unit PostgreSQL
failure/hang, related documentation and local commit. Verified starting state:
clean `main`, `35ceb2d434e71004daaac6113907b8247fa6dabe`. I2/APR-043 and P1/APR-045
remain accepted. P2/APR-046 remains **in_review**. This implementation/internal
review does not constitute formal independent closure or Owner acceptance.

The complete independent follow-up
`artifacts/tests/p2-independent-remediation-followup-2026-11-04.md` and original
`artifacts/tests/p2-independent-audit-2026-10-27.md` are preserved unchanged.
Earlier [remediation evidence](P2_REMEDIATION_REPORT.md) is historical, not the
current closure verdict. No backend contract, schema, Inventory writer, stock
rule, dependency, CI platform, P3/P4/P5, deployment or push is part of this work.

## Goal, plan and invariants

ACT-WH must retain truthful canonical receiving success across ordinary
navigation while optional order progress is pending. Reproduce before production
edits; resolve only the exact intent when all canonical arrival pages complete;
verify navigation/session/ownership races, real persistence and Chromium; diagnose
the PG failure without assuming flakiness; internally review, document and commit.
Stop for separate independent review and Owner decision.

Canonical success must not depend on progress. Before canonical evidence, the
original actor-bound encrypted immutable replay intent remains recoverable.
After canonical evidence, that intent is terminally resolved. Session invalidation
still clears private state. An older continuation cannot clear a newer intent,
editor or busy state. Progress refresh issues no confirmation. Exact Unit/Lot/
material/effect/outcome/audit identities, kg quantities, W1/W2/W3, optional actual
omission/null/value meanings and sole IPS ownership are preserved.

## Source changes and expected-red evidence

`apps/backend/src/operator/app.ts`: `readArrival` invokes a synchronous completion
callback only after canonical pagination exhausts under its existing epoch/read
guards. Receiving dispatch additionally checks exact intent identity, actor
identity, epoch, current grant and local expiry. It removes encrypted recovery,
clears only that editor, and releases busy before supplementary progress awaits.
Receiving dispatch returns separately; its terminal flag prevents old finally
cleanup from changing newer work. Pre-canonical failures retain replay intent.

Progress errors from an invalidated read/epoch become `Stale`; current errors
retain existing incomplete-progress warnings and read-only retry. Existing
401/403 locking is retained. Internal review reproduced a second stale-feedback
path through the real recovery button after response loss; its late transport
error otherwise claimed an unknown outcome despite canonical success.

`apps/backend/tests/unit/operator-lifecycle.test.ts`: executes actual compiled
app/editor using the existing VM component adapter. Held promises control
completion order; these are component tests, not browser E2E. Tests cover first
submission and immutable recovery replay, delayed200/503/transport navigation,
expiry/actor/session replacement, unresolved canonical state, newer intent/busy
ownership, progress pagination, canonical401/403 and existing SEC/WF/P1 cases.
The two previous supplementary401/403 storage assertions now require ciphertext
absent because canonical success already resolved it; added canonical401/403
cases require ciphertext retained. Security/private-state assertions remain.

Before production edits, three NAV tests failed against `35ceb2d` implementation:
0passed/3failed/0cancelled/0skipped, final TAP aggregate retained in
`artifacts/tests/p2-nav-expected-red.log`. Each reached canonical success, held
progress, enabled navigation and released the stale response before demonstrating
retained unknown recovery. The later internal-review replay regression failed
1passed/2failed/0cancelled/0skipped before the localized stale-error correction:
`p2-nav-replay-expected-red.log`. A first-submit control probe passed because the
cleared editor already suppresses its old callback; it is retained as
`p2-nav-review-probe.log`, not described as expected-red evidence.

## PostgreSQL investigation

The original failed257-unit run lacks final aggregate/assertion details; its
2675ms duration contrasts with the passing isolated diagnostic and normal larger
transaction duration. Timing alone does not establish cause. Detailed new
diagnosis and complete TAP/handle evidence are retained in
`artifacts/tests/p2-nav-pg-diagnosis.md`. A controlled fresh four-suite run completed
58passed/0failed/0cancelled/0skipped, including257units; that passing rerun is
not a root-cause resolution.

The source exposes a separate fixture defect: `receiving.test.ts` starts its
server and seeds catalogues inside `setup`, while caller cleanup begins only
after setup returns. A deliberately injected error after a successful material
response reproduced a failed setup plus live listening-server handle and missing
aggregate, even with no active PostgreSQL sessions. The bounded diagnostic
watchdog is external evidence collection, not a raised business/test timeout.
The original failure trigger remains unestablished unless subsequent evidence
explicitly identifies it; fixture leak proof alone does not explain that trigger.

`apps/backend/tests/integration/receiving.test.ts` now owns cleanup if setup fails
before returning its app. Normal cleanup rethrows the identical setup error;
cleanup failure preserves both errors in `AggregateError`. The added real-PG
regression completes a genuine material request, injects a sentinel response
handling failure, requires the original error, a closed listening socket and zero
composed-app database connections. Original257-unit workload and assertions are
unchanged. Root runners and CI configuration are unchanged; existing suite
registration includes these regressions.

The setup-failure probe originally hung with a listening server. Repeating the
same deliberately failing input after repair gives a complete0pass/1fail TAP
aggregate and normal exit1. Failure remains visible; cleanup restores diagnostic
completion. The first new closed-server probe failed because fetch reused a
closed keep-alive socket and returned ECONNRESET. Its replacement opens a fresh
TCP socket and requires exact ECONNREFUSED; timeouts do not pass. A preliminary
typed-Request lint error was also corrected without disabling the rule. Original
failed logs are preserved. No passing rerun is substituted for a diagnosis.

## Lifecycle verification map

| Required scenario | Observable regression evidence |
| --- | --- |
| Canonical success, progress200 | Two-page progress success, canonical intent/ciphertext absent; first-submit and replay NAV200 |
| Canonical success, progress503/400/transport loss | Retained SEC-P2-01 loops require confirmed canonical units, incomplete warning, read-only refresh and no further confirmation |
| Navigation during held200/503/transport loss | Six NAV cases, first submit and real recovery button: held response, enabled ordinary lookup, unchanged feedback, hidden recovery, no late data |
| Reload after canonical success | Actual Chromium canonical UUID readback and read-only SQL comparisons; real browser HTTP/security suite |
| Canonical read fails or second page incomplete | Same intent object/ciphertext retained; no supplementary query before exhaustion; exact-body safe replay |
| Lost response after COMMIT | Retained immutable encrypted replay component and real-PG browser tests; Chromium recovery scenario |
| Expiry, actor or session replacement during progress | Nine held200/503/transport cases require unchanged new identity/feedback, no private resurrection and resolved ciphertext absent |
| Expiry, actor or session replacement before canonical success | Three held canonical cases retain the original ciphertext and never clear current pending intent |
| Canonical401/403 versus supplementary401/403 | Paired negative tests retain unresolved ciphertext only before canonical success; both clear private state |
| Newer intent exists | Older progress cannot clear newer sealed intent/ciphertext/busy; replaced-intent canonical callback cannot resolve that replacement |
| Multiple pages | Successful complete progress; failed partial progress and safe retry; stale held second progress page; incomplete canonical second page |
| WF-P2-01 and P1 | Existing three-state tests for all four actual attributes and P1 lifecycle/security/regression tests retained |

Detailed browser observations are recorded separately from component/HTTP tests.

## Fresh final verification and delivery

Final source-matched checks and completed browser execution:

| Check actually executed locally | Result | Artifact under `artifacts/tests/` |
| --- | --- | --- |
| Full unit/component suite |252passed,0failed/cancelled/skipped; final aggregate56320.7701ms | `p2-nav-unit-final.log` |
| Eight affected real-PG suites |111passed,0failed/cancelled/skipped; final TAP aggregate325287.9132ms; normal exit0, watchdog not expired | `p2-nav-pg-final-eight.tap.log` and `.stderr.log` |
|257-unit case within that run | PASS11279.8731ms; unchanged257workload, one atomic outcome,257unique units/effects and complete bounded pagination | Same final-eight TAP |
|257-unit isolated after full suite |1passed,0failed/cancelled/skipped; final TAP aggregate19833.233ms, normal exit0, watchdog not expired; overlaps111 | `p2-nav-pg-final-257.tap.log` and `.stderr.log` |
| Actual Chromium NAV races | Three completed scenarios200/503/transport loss;503uses real lost-COMMIT-response/reload/immutable replay; next editor and reload/readback verified for each | `p2-nav-browser-closure-review.md`, DOM and screenshots |
| Read-only SQL comparisons | PASS:3new unique Units/Lots/effects,6000kg,4HTTPconfirmations including1replay; navigation/read/reload adds no effects | `p2-nav-browser-closure-stock-comparison.log` and JSON snapshots |
| Preflight, build, format, lint, boundaries, typecheck | PASS, pinned Windows Node24.21.0/npm11.19.0 | `p2-nav-{preflight,build,format-check,lint,boundaries,typecheck}.log` |
| Dependency advisory check | Exit0 at high threshold;10moderate tooling findings,0high/critical | `p2-nav-audit.log` |
| Engineering/security/test review | Required stale replay-feedback and cleanup-error preservation findings corrected; no further required source finding established | `p2-nav-internal-review.md` and before/after probes |

Distinct final automated scope is252unit +111PG =363. Selected red/control/
diagnostic/rerun cases overlap and are not added to this count; browser journey
steps are not fabricated as automated test-case counts. The other unchanged
integration suites were not freshly run. These are applicable local verification
checks plus real PG/Chromium evidence, not a hosted-CI result. `npm ci` was not
repeated against the unchanged frozen dependency tree. Existing Windows CI and
root test runners remain unchanged; hosted CI is **NOT EXECUTED / PENDING**.
No remote push or hosted run is authorized. The authorized fresh npm advisory
check exited0 at the high threshold and reported10moderate development-tool
findings, no high/critical. The earlier11-finding snapshot is retained unchanged;
the manifest/lockfile and installed pinned baseline were not upgraded. These
remain separate maintenance observations. The first sandboxed registry request
failed; its log is retained separately from the successful authorized request.
Real PostgreSQL fixtures use only verified disposable
`127.0.0.1:55438/navard_i1_test`, matching disposal ACK, separate restricted runtime
and DDL-owner roles, distinct development database and PG18.6/UTF8.
Final read-only PostgreSQL activity was empty; browser fixtures and the isolated
cluster were stopped normally after verification. Source/audit fingerprints,
completed aggregate counts and local document links are checked by
`p2-nav-validate-delivery.mjs`; `p2-nav-delivery-manifest.json` retains artifact
SHA256 values. Local whitespace/staged checks and the delivered diff accompany
the commit. No generated evidence is substituted for original failed artifacts.

No factory users/data, UAT, production readiness or acceptance is claimed.

## Browser and Inventory evidence

The completed browser receipt is `p2-nav-browser-closure-review.md`. Earlier
partial captures with other prefixes are preserved and excluded from completed
results. The root engineer executed actual Chromium, independently of the VM
component adapter, against the real composed backend and verified disposable PG.
Test-only progress faults occur after real authorization/query; lost confirmation
response occurs after realCOMMIT. No stock write or command result is mocked.

Baseline had1arrival/26units/26receivingLedger/1outcome/1audit. Three new receipts
end at4/29/29/4/5, with one replay audit accounting for the extra audit. Full joined
canonical rows and Inventory IDs remain identical before/after navigation, replay
and reload. Each W1 is2000kg; W2 remains exact`002000.2500`. Optional omission/null
is preserved both in review and canonical comparisons. The SQL comparison script's
first key-mapping assertion incorrectly used payload option-ID keys against
canonical `color`/`qualityGrade` objects; its failed diagnostic is retained, then
corrected to accepted read-model keys with comparison-state assertions. No data or
product rule changed to obtain the pass.

## Internal review and current readiness

The focused implementation-team review found and closed two required items:
late errors through the real recovery button could overwrite current feedback;
cleanup failure could hide the original setup failure. Their focused expected-red
and corrected evidence, final source hashes and review limits are retained. This
is internal review only, not the formal independent acceptance audit.

**NOT READY — BLOCKING EVIDENCE REMAINS.** SEC-P2-01-NAV has the bounded correction
and passing current regression/browser evidence. WF-P2-01 remains verified closed.
No new blocking Inventory/security regression was established. The reproduced
fixture listening-server leak is corrected and its failure now reports/exits,
but the historical257-unit failure's original triggering exception remains
unestablished. Full/isolated passing reruns cannot recover missing historical
assertion details or prove that cause; this package does not claim full closure.

Deliver the focused local commit containing this report for separate review.
Recommended Owner action: review the NAV correction and retained PG diagnosis in
a focused independent closure review, keeping the historical257evidence issue
explicitly open until sufficiently explained or bounded by that separate review.
P2 stays`in_review`; no Owner acceptance, push, deployment, P3 or P4/P5 follows
from this implementation package. Commit identity and clean-tree evidence are
reported in the delivery receipt/final response, avoiding a circular in-file hash.

## Exact changed-file scope

| File | Purpose |
| --- | --- |
| `apps/backend/src/operator/app.ts` | Exact canonical terminal-resolution callback, stale progress classification and ownership-safe finalization |
| `apps/backend/tests/unit/operator-lifecycle.test.ts` |25new lifecycle/pagination regressions plus paired correction of post-canonical ciphertext expectations |
| `apps/backend/tests/integration/receiving.test.ts` | Setup-owned cleanup/error preservation and one real-PG fixture-resource regression |
| `docs/00-governance/CURRENT_PHASE.md` | Record actual bounded Owner authority and preserve review gate |
| `docs/00-governance/APPROVALS.md` | Record follow-up scope without creating acceptance or another APR |
| `docs/12-implementation-planning/P2_IMPLEMENTATION_STATUS.md` | Current lifecycle behavior and review/evidence status |
| `docs/12-implementation-planning/ERP_CURRENT_STATE_AND_NEXT_STEP.md` | Point current assessment to this package; retain earlier counts as historical |
| `docs/12-implementation-planning/P2_NAV_REMEDIATION_REPORT.md` | Scope, corrections, test evidence, diagnosis and delivery limitations |
| `docs/INDEX.md` | Discoverable current package and earlier evidence |

Ignored diagnostic scripts/logs/DOM/screenshots/SQL snapshots are retained under
`artifacts/tests/p2-nav-*`; they are review evidence rather than additional product
source. The delivered Git diff identifies every tracked change. No old independent
audit is edited, and no tests, assertions or required workloads are removed.
