---
id: IMPL-P1-001
title: P1 Persian operational purchasing UI implementation and evidence
phase: 12-implementation-planning
status: in_review
version: 1.0.0
owners: [delivery-lead, chief-solution-architect, security-architect]
depends_on: [APR-044, APR-039, APR-043, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-10-25
approval: null
---

# P1 implementation status

Authority: [actual P1 directive](../00-governance/approved-baselines/APR-044-p1-purchasing-ui-authorization.md).
Baseline clean main c302a20a582be48e9203f88a32df9d31aa3ecbcf. Implementation
complete for review handoff; no Owner acceptance, deployment or remote push.

## Bounded execution plan and Definition of Done

Users: factory desktop Procurement (register/read) and Warehouse (catalogues/read).
Goal: Identity -> Persian purchasing UI -> canonical I1 originals -> scoped I2
receiving visibility. Dependencies are the accepted thirteen backend capabilities.
No business policy, domain/schema, owner-port or Inventory posting changes.

1. Record actual authority in CURRENT_PHASE/APPROVALS and narrowly align existing
   canonical gate/local unlock. Preserve historical approvals.
2. Add a closed same-origin browser adapter and exact static asset allowlist in
   backend transport; configure explicit origin/secret; retain existing bearer
   routes and the single Identity login limiter. HttpOnly cookie, session-bound
   CSRF and current server grants protect browser operations.
3. Add small native HTML/CSS/TypeScript operator files under backend src/operator;
   copy only public static assets during the existing root build. Implement all
   twelve fields, catalogue pagination/add/select, immutable readback, reference/ID
   lookup and both paginated receiving views without client domain calculations.
4. Freeze unresolved command identity/payload and bind recovery to the trusted
   actor. Never report a timeout as failure or persist bearer credentials.
5. Extend focused Windows node:test/real PostgreSQL transport and recovery proof;
   execute representative real browser journeys on the running real backend.
   Run existing regressions and static checks, review/fix and document evidence.
6. Commit the bounded reviewable result locally. Leave separate fresh-context
   engineering/security review and explicit Owner acceptance open; do not start P2.

DoD: working Persian/RTL journey; current role enforcement and session lifecycle;
exact 12-field/optional/Jalali/canonical readback; shared exact-label catalogues;
complete scoped receiving pagination; actor-bound immutable retry; executable
security/PG/browser evidence and relevant passing regressions; no required defect;
honest review/acceptance status, documented operation and local commit.

Likely files: config/composition/http-host and three affected handlers; new narrow
browser transport/session helper; src/operator assets/logic; build asset copier;
focused integration/unit/support tests and runner registrations; README, this page,
APR-044, APPROVALS, CURRENT_PHASE and existing gate/local unlock. No migration,
lockfile, runtime package or module business service change is planned.

## Delivered behavior and architectural impact

One native TypeScript/semantic HTML/CSS UI lives in `apps/backend/src/operator`.
The existing build emits the three browser modules and copies only HTML/CSS into
dist. The existing Node host serves exactly `/`, `/operator/app.js`,
`/operator/intent.js`, `/operator/display.js` and `/operator/styles.css`. There is no frontend server,
package, framework, CDN, font download, generic form engine or offline queue.

Personal server-authorized grants select Procurement or Warehouse navigation.
PROC registers 1–128 original lines; both roles add/select the three shared exact
catalogues, retrieve the immutable original by reference or UUID, and read all
pages of LINES/RECEIVED_UNITS. The form preserves the seven mandatory and five
optional fields defined by [I1](I1_IMPLEMENTATION_STATUS.md); omission is absence,
numeric lexemes remain strings, Jalali remains YYYY-MM-DD, and canonical readback
provides server line identities and original ordering. No client stock arithmetic
or new Jalali/business validator duplicates the owner service.

Catalogue additions are independent durable commands. Exact duplicate rejection
is followed by authorized exact-label selection. Catalogue cursors load subsequent
options without discarding existing selections. Receiving pages use `afterId`
and `limit=20`; next-page controls remain available to exhaustion. Original data,
actual values, comparison states, manual acceptance, actors/documents and stock
identities are read-only. A shared arrival header is displayed once across loaded
pages; W2/W3 are labelled whole-consignment evidence, never summed/allocated to PO
lines. Each page retains its own server snapshot time, not a fictional cross-page
snapshot or aggregate total. Refresh restarts the selected view.

Only transport/configuration/composition and UI change. Existing Procurement owner
commands/queries, current Identity grants, PostgreSQL transactions/outcomes/audit,
Inventory ports and sole IPS remain authoritative. No module service, migration,
database permission, historical original or package lock is changed. Existing
non-browser callers retain their bearer routes and historical Origin rejection.

## Browser security and recovery contract

`BROWSER_ORIGIN` and a canonical random base64url `BROWSER_SESSION_SECRET` explicitly
enable the closed `/ui-api` adapter. It admits only login/session/logout, I1 routes
and `/purchasing/receiving/orders/query`; it cannot dispatch receiving-write,
arrival-wide reads, account administration or arbitrary commands. Host must match
the configured origin. Browser admission requires same-origin Fetch Metadata and
the custom application header; POST also requires exactly the trusted Origin.
Optional GET Origin must also match. There is no CORS/preflight allowance.

Opaque session tokens travel only in HttpOnly/SameSite=Strict/Path=/ cookies.
HTTPS uses `__Host-navard-session; Secure`, without Domain; HTTP is accepted only
for development/test loopback with a distinct development cookie name. The same
Identity handler and limiter serve both browser and legacy admission. Mixed bearer
authentication, duplicate session cookies and duplicate security headers fail
closed. A private per-request admission marker permits cookie extraction only on
the browser allowlist; legacy handlers never authenticate a cookie.

Authenticated session bootstrap returns current P1 organizational grants and an
HMAC session-bound CSRF value. All subsequent browser API calls, including reads,
must present that session's value. A rotated cookie cannot authorize a stale tab's
request. Recovery decryption material is returned only with current P1 grants and
is derived separately from origin/installation/account/person. Neither it nor the
bearer/password is persisted. Identity retains expiration/revocation/current-grant
checks and audit; passive polling stops when the operator is inactive.

One unresolved complete envelope is encrypted using native AES-GCM with random
96-bit IV and version-bound AAD in tab sessionStorage BEFORE the first dispatch.
Double clicks are synchronously blocked. Reload or same-account reauthentication
decrypts the exact original envelope and retries its original key; changed payloads
never receive that key. Another account sees only a generic locked notice and
cannot decrypt, overwrite or retry it. Successful/logout screens hide all sensitive
data; unresolved ciphertext deliberately survives logout for the original actor.
Closing recovery requires a separate explicit warning/confirmation and never
cancels a committed order. Secret rotation or lost tab storage requires manual
reference/UUID lookup; no automatic replacement command is generated.

401/403 clear sensitive UI and require reauthentication; definitive400/422 free
the form,409 retains recovery for investigation,404 clears stale lookup results,
and503/network/timeout retains unresolved intent without claiming failure. Safe
attempt IDs are shown for correlation. Late responses are ignored after session,
role or navigation changes. Cross-tab login/logout signals clear other tabs;
login stays disabled during logout, and logout fetches are aborted on page exit
or another tab's session change. Initial connection failure has an explicit retry.

All user text enters textContent/native controls. CSP disallows inline/eval and
third-party assets; responses use no-store, nosniff, frame denial, no-referrer,
restricted browser permissions and same-origin opener policy; HTTPS adds HSTS.
Same-origin resource policy also prevents embedding browser assets across origins.
Forms use POST even if script submission fails. Only five public assets are
mapped; source maps, TypeScript, environment/config files and arbitrary paths are
not served. These controls follow the assessed [OWASP CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
and [session](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
guidance, without a certification or production-TLS claim.

## Executed verification and evidence

Windows PowerShell, pinned Node24.21.0/npm11.19.0 and real PostgreSQL18.6/UTF8.
The existing fixture verifies distinct restricted runtime/DDL roles, acknowledged
disposable test database and separate dev database before clearing test fixtures.
No destructive check used production data. Pre-existing pinned binaries were
reused. `pg_ctl start` encountered Windows restricted-token error87; the same
isolated server started using native `Start-Process -WindowStyle Hidden`, without
installation, ACL changes, elevation or version substitution.

Commands below use the pinned Windows Node directory prepended to PATH. Logs are
ignored local evidence; no real credentials/customer data are included.

| Actual command | Result / retained evidence |
| --- | --- |
| `npm.cmd run build` | PASS; `artifacts/tests/p1-build.log` |
| `node --env-file=.env.local --test --test-concurrency=1 apps/backend/dist/tests/unit/browser-intent.test.js apps/backend/dist/tests/unit/browser-display.test.js apps/backend/dist/tests/unit/config.test.js apps/backend/dist/tests/integration/browser-http.test.js` | 16 PASS,0 failures/cancellations/skips; `artifacts/tests/p1-focused-final.log` |
| `node --env-file=.env.local artifacts/tests/i1-environment/node/node-v24.21.0-win-x64/node_modules/npm/bin/npm-cli.js run verify` | PASS: all root checks,202unit/357real-PG,0failures/skips; `artifacts/tests/p1-verify.log`; PG duration1556261ms |
| `npm.cmd run test:unit` | After the literal-rendering regression:203PASS,0failures/skips; `artifacts/tests/p1-unit-final.log` |
| `npm.cmd run preflight`, `npm.cmd run format:check`, `npm.cmd run lint`, `npm.cmd run boundaries`, `npm.cmd run typecheck` | Final source checks PASS; `artifacts/tests/p1-{preflight,format-check,lint,boundaries,typecheck}.log`;175files in ownership graph |
| `node artifacts/tests/p1-validate-docs.mjs`, `git diff --check`, `git diff --cached --check` | PASS;5canonical files/659local links, no missing targets; working/staged whitespace checks |

The full357-case PG run completed before the last narrowly scoped display/header
refinements. The final focused16 repeats all eight new real-PG cases on the final
transport, plus eight unit/config cases. Those cases overlap the full suites;
**203unit and357distinct real-PG cases**, never an inflated sum. Final build and
source checks were repeated after refinements. The browser capacity/visual pass
used that final build. Local Graphify refresh stayed offline:598tracked files,
5453nodes/12536edges; source remains authoritative.

| Ignored local evidence | SHA256 |
| --- | --- |
| `artifacts/tests/p1-verify.log` | `0AD2A46F4E23D2695D3AD34D06D6534DD4CB01018E872AA43C3BE788C5403959` |
| `artifacts/tests/p1-unit-final.log` | `6164A72444C5C7DFE537CE393FA89080AC2A8F626E6F60340ACE510403CC865F` |
| `artifacts/tests/p1-focused-final.log` | `7197034C832D25C1157A286DDFDC5204C8DFB31264726B521C3F70DD3903814C` |
| `artifacts/tests/p1-browser-receipt.md` | `5ED6CD1FB952DF3553D1D1C1BAF7487303148ACA181F2CBC32C86DD1CDC68498` |
| `artifacts/tests/p1-browser-workflow.png` | `2179165A5871A135402ED1E19380F78A53DEF3B3654EA726AC61C580CC779AA6` |

These artifacts stay local/ignored; another machine needs safe retention or a
fresh run. They are not claimed as pushed artifacts or remote CI evidence.

The focused tests exercise real HTTP/PG canonical all12-field/large lexeme and
optional omission, stable lines, leap rejection, current roles/grants/expiration,
exact duplicate catalogue races and independent persistence, actual post-COMMIT
response loss with same-actor replay, multi-order/sibling/unlinked isolation across
both receiving views, malformed bounds and raw duplicate headers, mixed legacy/
browser login limits, HTTPS cookie attributes and legacy compatibility. Crypto
unit tests prove ciphertext roundtrip, wrong-key/tamper rejection and fresh IVs.

Actual browser execution used Codex's in-app browser via CUA, connected to the
real composed backend at loopback3110 with the real disposable PostgreSQL DB.
It was NOT DOM-only, mocked HTTP or a new installed test dependency. The test-only
`browser-server.ts`/harness seeds solely through accepted commands and exposes
fault/expiry/grant controls through local stdin, never a product HTTP backdoor.
The browser server is stopped before integration resets and at delivery.

Observed browser proof (retained tool transcript and local screenshots/receipt):

- PROC login/logout; WH registration navigation absent; SEC and Customer receive
  no purchasing workspace. Keyboard Enter submits lookup; focus and RTL layout
  were inspected visually. This is engineering browser evidence, not factory UAT.
- All12 original fields with two independent lines; all optional omissions on the
  second line; maximum20/18-digit decimal,20-digit W1/count and Jalali1403-12-30
  returned canonically. XSS-like catalogue text rendered as text with zero img
  nodes and no JavaScript dialog. Invalid1404-12-30 receives422 and unlocks form.
- PROC/WH each add all three catalogues; exact duplicate resolves to the existing
  option. WH retrieves the original with keyboard submission;404 clears old data.
- Real25-line/24-unit selected-order fixture traversed both complete views over
  two pages. Exactly one shared header card, no sibling/unlinked markers, separate
  original/actual W1 and whole-consignment W2/W3. Empty received-unit state exercised.
- Double-click plus deliberate post-COMMIT response loss retained one immutable
  target through reload, a different account, server expiration and same-actor
  reauthentication/replay. Database counts remained3orders/28lines/26received,
  i.e. exactly one new two-line PO over the two-order fixture.
- Genuine503 admission fence retained the same request/target and correlation;
  lifting the fence recovered it once (3orders/27lines/26received over the reset
  fixture). Initial session503 retry, held logout response/login blocking,
  PROC-to-WH current-grant navigation and cross-tab clearing were executed after
  correction. Full-page screenshot capture was unavailable; viewport captures
  succeeded. The initial database-offline run and corrected expiration fixture
  failure are superseded by the retained passing runs, not presented as passes.
- Final build: real128-line registration,128canonical independent UUIDs, raw
  referenceSAME and item labelsACT-WH/constructor preserved, UUID lookup and all
  seven LINES pages to128rows with no next cursor. Database3orders/154lines/
  26received proves no extra receiving write. The102-option Color catalogue was
  traversed to exhaustion over two pages, preserving the already selected آبی.
  Native required-field validation was observed in Persian; final exact-ID/number
  no-wrap layout was visually checked. Browser receipt records18executed scenarios
  in `artifacts/tests/p1-browser-receipt.md`; final workflow screenshot is
  `artifacts/tests/p1-browser-workflow.png`.

## Review, limitations and acceptance handoff

Self-review corrected stale response/page races, optional/exact rendering,
confirmation locking, inactive session polling, explicit secure-storage failure,
safe POST fallback and prototype-key text lookup. Independent read-only reviews
`p1_design_review` (engineering/security/API/frontend) and `p1_transport_tests`
(tests/API/security) found four required UI issues: grant-change navigation,
unchanged refresh versus encryption/restoration, unavailable bootstrap recovery,
and logout/login race. All were corrected; test assertions and focused assurance
were strengthened. Final reviewer closure/evidence is recorded before commit.
Both reviewers re-read the final source and retained203unit/16focused/357PG logs;
engineering/API/frontend/security/test review is PASS, no required finding remains.
Reviewers did not author changes or independently execute the browser/DB scenarios.

Limits: no deployment/TLS-terminator/certificate test, real factory UAT or Owner
acceptance. Existing accepted text/date/request/response capacities remain; no new
business limit. Pending recovery depends on retained tab storage and stable server
secret; no general cross-device/offline recovery queue exists. Catalogues remain
exact-only and add/select-only. Each receiving page is a fresh scoped snapshot;
concurrent new receiving may require refresh. No schema, policy, receiving-write,
stock, Finance, supplier master, broad order search or P2 work was introduced.

Separate fresh-context independent engineering/security review and explicit Owner
acceptance remain the next gate. Local commit is authorized for review by APR-044;
it is not Owner acceptance or permission to push/deploy. Thirteen backend
capabilities remain accepted; P1 is a UI increment submitted for review, not a
fourteenth accepted backend capability or a percentage of overall ERP completion.

## P1 acceptance checklist

PASS means the bounded engineering evidence described above; it never implies
factory/production approval. This checklist is finalized before local delivery.

| Criterion from the Owner directive | Status | Evidence / boundary |
| --- | --- | --- |
| Actual baseline/clean initial tree and bounded Owner authority recorded | PASS | c302a20; APR-044; minimal gate alignment |
| Real browser login/session/logout, trusted server roles and permitted navigation | PASS | Executed PROC/WH/SEC/Customer scenarios; HTTP/PG assertions |
| Expiration, revocation, authorization loss and safe shared-workstation navigation | PASS | Real expiry/grant-change/cross-tab browser checks; server session revocation test |
| Explicit trusted origin; disallowed/null/sibling origins and forged role denial | PASS | Focused real HTTP/PG tests; unchanged legacy Origin negatives |
| Correct cookie/CSRF/cache/CSP/XSS/assets/bounds and retained bearer compatibility | PASS | Focused HTTP tests, HTTPS cookie unit, literal-text browser checks; no production TLS claim |
| Persian/RTL semantic controls, keyboard, visible focus and clear states | PASS | Actual screenshots, Enter lookup, invalid/leap/empty/loading/503/404 states |
| All12 purchasing fields,7mandatory/5optional, exact values/Jalali/catalogue identity | PASS | Actual two-line canonical browser readback and explicit real-PG assertions |
| Multi-line order supports accepted128-line limit | PASS | Actual128-line browser registration/readback/UUID uniqueness;129th line refused |
| Both roles add/select all three shared catalogues; exact duplicates/concurrency | PASS | Browser and real-PG races; canonical exact-label duplicate selection |
| Catalogue cursor traversal to exhaustion preserves selections | PASS |102real Color options over two browser pages; existing آبی selection preserved |
| Independently successful catalogue addition survives failed order | PASS | Real-PG assertions and explicit independent UI success |
| Reference and UUID lookup return immutable canonical originals; WH cannot register | PASS | Browser reference/WH checks and actual ID/role HTTP tests |
| Both order-scoped receiving views retrieve all pages and authorized evidence | PASS | Actual25line/24unit browser traversal and focused paginated real-PG test |
| Multi-order/sibling/unlinked isolation; whole-arrival W2/W3 never allocated | PASS | Real shared fixture, one header card, no unrelated identifiers, no UI sums |
| Stable full intent/key for double-click/lost response/503/reload/reauthentication | PASS | Actual committed-response loss and503 browser recovery plus real-PG replay assertions |
| Another actor cannot decrypt/retry/overwrite unresolved original intent | PASS | Actual different-account browser notice and disabled recovery; crypto/stale-CSRF tests |
| Meaningful401/403/404/409/422/503 handling without sensitive diagnostics | PASS | Browser/API tests and safe correlation handling; no unconditional changed-key retry |
| Relevant Identity/I1/I2/kernel/transport regression and root static checks | PASS |203unit,357distinct real-PG,16overlapping focused; all final static checks pass |
| Self-review, independent internal review and required-finding correction | PASS | Two independent read-only reviewers, all required findings closed; final evidence follow-up retained |
| No business/schema/framework/dependency/receiving-write/scope expansion | PASS | Final source diff and ownership checks; no package lock/migration/module-service change |
| Canonical startup/behavior/limitations/evidence and coherent local Git delivery | PASS | Validated docs and reviewed30-file slice; actual commit/hash/tree reported separately after recording |
| Separate fresh-context engineering/security review and explicit Owner acceptance | NOT VERIFIED | Required next action; not manufactured by this implementation report |

## Git delivery and next action

The final response supplies the actual local P1 commit hash, file count, final
working-tree status and retained evidence hashes after recording. No push,
deployment, release, history rewrite, fetch/rebase/reset or P2 work is authorized.
Next action: separate fresh-context engineering/security review of the local P1
diff and executable evidence, then explicit Owner acceptance. Future receiving UI
depends on that acceptance and a new bounded instruction; it has not begun.
