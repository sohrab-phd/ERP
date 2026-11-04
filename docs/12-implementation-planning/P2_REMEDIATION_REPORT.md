---
id: IMPL-P2-REMEDIATION-001
title: P2 SEC-P2-01 and WF-P2-01 bounded remediation
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [delivery-lead, security-architect]
depends_on: [APR-046, IMPL-P2-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-11-04
approval: null
---

# P2 remediation — pending independent follow-up and Owner acceptance

The actual Owner continuation directive issued in this chat on 2026-11-04
authorizes only SEC-P2-01, WF-P2-01, necessary regressions/documentation and a
local remediation commit, followed by a read-only repository inventory. It does
not accept P2 or authorize P3, another product increment, deployment or push.
[APR-046](../00-governance/approved-baselines/APR-046-p2-receiving-ui-authorization.md)
remains the original P2 authority. No new approval is fabricated here.

Verified starting state: clean `main`, HEAD
`4e608693cae9fc45d37506728909f6e2862ca13b`. Full local audit read:
`artifacts/tests/p2-independent-audit-2026-10-27.md`, verdict **FAIL — BOUNDED
REMEDIATION REQUIRED**. Both findings are medium / REQUIRED. No stock corruption
or duplicate posting was alleged by that audit. Its original evidence is retained
unchanged; this implementation session is not its independent follow-up audit.

## Bounded goal, plan and completion criteria

ACT-WH must see truthful confirmed receiving and final actual-attribute review.
Plan: reproduce the two final-state/render defects; correct only these UI paths;
verify component, real PostgreSQL and real browser behavior; review and document;
commit locally for separate independent follow-up. Then reconcile remaining work
without implementing another capability.

Invariants: canonical receiving/Inventory identities survive supplementary read
failures; truly uncertain commands retain the same encrypted immutable intent;
read-only refresh creates no business command; current authority/expiry clears
private state; omitted/null/value remain distinct; accepted I2 payloads, exact W1,
whole-consignment W2/W3 and sole IPS ownership remain unchanged.

Dependencies: accepted I2/APR-043, P1/APR-045, existing native Persian/RTL app,
browser session/transport and PostgreSQL transaction/outcome guarantees. Excludes
schema, contracts, domain commands, rounding/tolerance policy, dependency versions,
P1 O-01, deployment/UAT and later product increments.

Package criteria: demonstrate original expected-red regressions, then pass affected
unit/PG/browser and static gates; explain test limits and advisory findings; no
required internal-review finding; reviewable local diff/commit. These criteria do
not replace the independent-review/Owner-acceptance gate.

## Root causes and corrections

| Finding | Reproduction and root cause | Correction and observable boundary |
| --- | --- | --- |
| SEC-P2-01 | `dispatchPending` receives accepted HTTP200; `readArrival` exhausts canonical unit pages, then its linked-order progress query fails503/400. The single error path leaves the original pending intent and reports unknown/invalid registration despite canonical completion. | `readArrival` establishes canonical success after all arrival pages. Each supplementary progress section handles its own non-session failure with a specific incomplete/stale warning and a read-only progress refresh. Normal dispatch then clears resolved recovery/editor state. Refresh leaves canonical arrival units in place and never calls confirmation.401/403/expiry/stale continuations still propagate the existing lock/clear behavior. Canonical arrival-read failure still retains the original intent for safe replay. |
| WF-P2-01 | Flattened `actualPreview` is passed to the shared details renderer without its existing actual context, so explicit null is labeled unrecorded. | Wrap proposed values in `{ actual: actualPreview }`. Show the four omitted optional attributes as unrecorded in the preview only; null is explicitly absent and observed strings/catalogue identities remain exact. The already-frozen command payload remains unchanged; omitted keys are still omitted. |

Source: `apps/backend/src/operator/{app.ts,receiving.ts}`. The browser transport
still delegates exactly the accepted command/query names to Procurement; the
unmodified `receiving-service.ts` / PostgreSQL store and
`inventory/inbound-receiving.ts` / IPS own the atomic durable bundle. Test-only
faults operate after the actual server authorization and progress query, or lose
the response after the real command COMMIT. No product fault hook was added.

## Regression evidence and execution

All execution is Windows PowerShell with pinned Node24.21.0/npm11.19.0 and
PostgreSQL18.6. Final results and retained artifact fingerprints are recorded below
before local delivery. VM component tests are not browser E2E; HTTP/PG tests are
not browser E2E either. No historical count is credited as freshly executed.

Expected-red diagnostic on original production code: 9 selected component cases,
4 passed / 5 failed / 0 skipped. Failures establish secondary503/400/network-loss
feedback plus omitted/absent review semantics; observed values, session locks and
canonical-read recovery already passed. An initial assertion-selector issue was
corrected before that diagnostic. Final tests also include delayed refresh after
lock and incomplete second progress page.

The first expanded PG run returned14pass/1fail: the new fixture incorrectly used
leading-zero `lengthM`, which the accepted `assertDimension` rejects. This was a
test defect, corrected to `2.123456789012345678`; no domain rule was relaxed.
New-case rerun:1/1pass. TypeScript test-harness overload and typed-row lint errors
were corrected before final checks. Failed preliminary logs are not final passes.

| Final executed check | Result | Retained local artifact |
| --- | --- | --- |
| Full unit/component suite, including10new regressions | 227passed / 0failed / 0skipped | `p2-remediation-test-unit.log` |
| Eight affected real-PG suites | 110passed / 0failed / 0skipped; 334459.0884ms | `p2-remediation-pg-regression.log` |
| New PG case alone (overlaps110) | 1passed / 0failed / 0skipped | `p2-remediation-pg-new.log` |
| Actual Chromium browser journey | Executed sequence in retained receipt; real response loss/reload/replay, secondary503/400, keyboard read-only retry, restored progress, expired-session clear, PROC navigation, logout | `p2-remediation-browser-receipt.md` |
| Read-only SQL source/stock comparison | PASS: one new2100kg unit/Lot/effect, all joined identities unchanged across recovery/read refresh; only replay adds an audit | `p2-remediation-browser-stock-comparison.log` and five JSON snapshots |
| Preflight, formatting, lint, module boundaries, typecheck, build | PASS | `p2-remediation-{preflight,format-check,lint,boundaries,typecheck,build}.log` |
| npm advisory high threshold | PASS exit0;11moderate tooling findings, no high/critical | `p2-remediation-audit.log` |
| Working/staged whitespace and documentation links | PASS at delivery | `p2-remediation-docs.log`; Git checks |
| Hosted CI | NOT EXECUTED / PENDING; no push | Existing Windows workflow inspected |

Fresh distinct automated scope is **227unit + 110PG = 337**. Selected/focused
reruns are overlapping, and browser scenario steps are not added to that count.
The other unchanged integration suites were not freshly executed. This is the
locally executed applicable CI equivalent plus real database/browser checks;
`npm ci` was not rerun against the unchanged installed frozen dependency tree.
Migration checks relevant to receiving/integrity execute within the110; no SQL
migration was added. This is not a claim of a fresh full-repository PG run.

Commands used after prepending the pinned Node directory to PATH:

```powershell
npm.cmd run build
npm.cmd run preflight
npm.cmd run format:check
npm.cmd run lint
npm.cmd run boundaries
npm.cmd run typecheck
npm.cmd run test:unit
npm.cmd audit --audit-level=high --cache artifacts/tests/npm-remediation-cache
node --env-file=.env.local artifacts/tests/p1-independent-environment.mjs
node --env-file=.env.local --test --test-concurrency=1 apps/backend/dist/tests/integration/browser-http.test.js apps/backend/dist/tests/integration/p2-browser-http.test.js apps/backend/dist/tests/integration/receiving.test.js apps/backend/dist/tests/integration/receiving-integrity.test.js apps/backend/dist/tests/integration/inbound-http.test.js apps/backend/dist/tests/integration/inbound-integrity.test.js apps/backend/dist/tests/integration/inbound-recovery.test.js apps/backend/dist/tests/integration/inventory.test.js
node --env-file=.env.local artifacts/tests/p2-remediation-browser-server.mjs
node artifacts/tests/p2-remediation-compare.mjs
node --env-file=.env.local artifacts/tests/p2-remediation-expire.mjs
node artifacts/tests/p2-validate-docs.mjs
git diff --check
git diff --cached --check
```

Environment verification established loopback127.0.0.1:55438/navard_i1_test,
explicit matching ACK, distinct development DB, PG180006/UTF8 and restricted
separate runtime/DDL-owner roles, neither superuser/createdb/createrole. Existing
cluster startup needed sandbox escalation because PostgreSQL restricted-token
startup failed; the verified cluster was started successfully without changing
permissions or adding OS containment. Only acknowledged disposable fixtures were
reset/seeded. Test server was stopped; no production/factory database was accessed.

Fresh browser SQL snapshots: before1arrival/26units/26Ledger/1outcome/1audit;
committed2/27/27/2/2; original replay with progress5032/27/27/2/3; read-only400and
restored progress both2/27/27/2/3. Unit/Lot/effect identities and complete joined
rows remain identical after COMMIT. ActualW1=2100kg; originalW1=2000kg;
W2=`002100.2500`, W3=`2100.2400`. All four actual nulls have confirmed-absence
comparison states. Browser receipt distinguishes server denials from UI controls.


## Review, security and acceptance status

Internal engineering/security/test review used a fresh-context subagent that did
not author the changes. It reviewed the bounded diff and applicable skills/audit,
executed25focused component/intent cases (overlapping the full unit suite), and
probed a delayed progress response after lock. No blocking/required finding or
high/critical issue was established. That is implementation-package review,
**not the separate formal independent follow-up audit**. The reviewer did not
execute PostgreSQL or browser tests. The coordinator executed those checks.

Security boundary is unchanged: server WH authorization, Origin/CSRF/session
admission, actor-bound encrypted intent, DOM text rendering and sole IPS remain.
No SQL, public API, dependency or migration change. Read-only refresh is guarded
by the existing epoch/read sequence. Static inspection plus negative lifecycle/
HTTP tests support this assessment; factory UAT and broad accessibility audit are
not claimed.

Fresh `npm audit --audit-level=high` exits0 after explicit Owner authorization of
dependency-metadata transfer to the configured registry. It reports **11 moderate
findings, no high/critical**, through development-only ESLint/TypeScript-ESLint's
`minimatch@10.2.6`. [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)
concerns attacker-controlled glob preprocessing. `npm ls minimatch --all --offline`
and package manifests locate this in tooling; no ERP HTTP input path to that
library was found. This is a separate recorded dependency-maintenance follow-up,
not a clean advisory bill or a demonstrated P2 runtime exploit. Pins/lockfile stay
unchanged; no automatic audit fix/downgrade. The first sandbox advisory request
failed; automatic review rejected its escalation until the Owner explicitly
authorized that specific transfer, after which the check completed.

**P2 remains `in_review` / IMPLEMENTED_AWAITING_ACCEPTANCE.** Both fixes have
implementation evidence, but formal independent follow-up PASS and explicit Owner
acceptance remain mandatory. No P3 or new product work begins. Local remediation
commit is a review candidate as explicitly requested by the Owner; it does not
mean accepted/ready-to-push under the delivery workflow. Hosted CI is pending:
no push or hosted run was performed. Existing Windows CI automatically includes
the new component regressions through the unchanged `test:unit` runner; real PG
and browser evidence remain local because CI has no provisioned PG/browser job.

The commit containing this report is the remediation delivery revision; its exact
hash is reported in the delivery response and subsequent inventory. Generated
logs/screenshots/SQL snapshots remain ignored local evidence, not presumed
available on another machine. Accepted P1/I2 decisions and original audit remain
unchanged.


## Local evidence fingerprints

| Artifact | SHA256 |
| --- | --- |
| p2-independent-audit-2026-10-27.md | 54C5F68273E9B26A829744B9C68BB5FC742A116B3AD96F1ADE0B8D895A23E2F2 |
| p2-remediation-red.log | DAF6FD2F8C4EB680D246C7C91F7CBD980F9B77FFA34A7F5127DFACD67BAC7760 |
| p2-remediation-test-unit.log | 189074D5C45B1BA95579ED6CB96084A215A32FB7EACE028DAED7BB546648C95B |
| p2-remediation-pg-regression.log | 204541A8BADA5B5E4975957363D134BDD26FFCEC4A29CE2EB825994E8FC33B1A |
| p2-remediation-browser-receipt.md | 3DF76E2B86F301169B97F86701C1421374A61E5705286960A9F8B68F81B85A0C |
| p2-remediation-browser-review.jpg | AC7C7310E60C427A0AC2D03CA1FDD4F5DBD9942580A3FC45351D1A32F83EBFD1 |
| p2-remediation-browser-confirmed.jpg | 3991F0C42757870A54B5F86B9D60FA5ADA05F5ADE25A77C3150B0BAE3A994710 |
| p2-remediation-browser-progress-400.txt | 01A291CED307EFB30C3CD6E5ACDF2C21F4F22A90400FA6155C13F54C2E2FF77B |
| p2-remediation-browser-stock-comparison.log | E1AA201AF136187136B75F58184330D44D37278D8658C52D1EEC30B5818FC677 |
| p2-remediation-audit.log | 1667AABDC9B5386FD8CDF66A393EAEDB9EB4BA259589B4E7C9AFDE1CF2554FD8 |
