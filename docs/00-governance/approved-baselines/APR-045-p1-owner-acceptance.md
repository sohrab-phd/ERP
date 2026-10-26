---
id: APR-045
title: Formal Owner acceptance of P1 Persian operational purchasing UI
phase: 12-implementation-planning
status: approved
version: 1.0.0
owners: [project-sponsor]
depends_on: [APR-044, APR-039, APR-043, IMPL-P1-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-10-26
approval: Actual Owner CODEX DIRECTIVE — FORMAL OWNER ACCEPTANCE OF P1 issued in this chat
supersedes: null
---

# Formal P1 Owner acceptance

Source: actual Project Owner **CODEX DIRECTIVE — FORMAL OWNER ACCEPTANCE OF P1**,
issued2026-10-26 in this chat. This records that human decision, not an agent-issued
approval, fabricated signature, meeting or factory sign-off.

**Decision status: ACCEPTED. P1 — ACCEPTED FOR ITS APPROVED ENGINEERING AND
FUNCTIONAL SCOPE.**

Exact accepted implementation: `22b5389af4d88cff38afdac1bebad68badd06f9c`, direct
parent `e5b6e4141d00f82ef12752f27b24951ae739b563`. Acceptance attaches to that
reviewed revision, not future code. At recording, `main` matched it and the tracked
tree was clean. Original authority remains [APR-044](APR-044-p1-purchasing-ui-authorization.md);
bounded Owner remediation follow-ups are recorded in
[P1 status](../../12-implementation-planning/P1_IMPLEMENTATION_STATUS.md).

## Accepted functionality and ownership

- Personal browser login/session/logout; Persian/RTL operator controls with current
  server-authorized organizational Procurement/Warehouse grants.
- I1 purchase registration with all12accepted fields and1–128independent lines;
  exact decimal/integer/Jalali preservation, immutable original reference/UUID lookup
  and canonical readback. Shared Material Type, Quality and Color add/select.
- Read-only order-scoped I2 LINES/RECEIVED_UNITS, complete authorized pagination,
  each page's own snapshot timestamp, original/actual distinction, shared-header
  deduplication and whole-consignment W2/W3 without allocation or sibling leakage.
- Trusted Origin/Host, secure cookie/session/CSRF handling, current grants and legacy
  bearer compatibility; correct local idle/absolute expiry including delayed recovery
  continuation and nonrenewable monotonic absolute cap.
- Actor-bound encrypted unresolved-command recovery, ciphertext retention across
  lock, immutable original command identity/payload and safe idempotent replay after
  uncertain/post-COMMIT response loss.
- Existing I1/I2 contracts, modular-monolith ownership, PostgreSQL atomic outcomes/
  audit and exclusive IPS Inventory posting remain authoritative.

P1 is a frontend/operational integration increment. The thirteen accepted backend
capabilities retain their prior scopes. P1 is not a fourteenth backend module;
no overall ERP completion percentage is implied.

## Independent closure and evidence provenance

Final review: `artifacts/tests/p1-final-closure-review-2026-10-26.md`, dated2026-10-26,
targets the exact accepted commit and concludes **PASS WITH NON-BLOCKING
OBSERVATIONS — P1 READY FOR OWNER ACCEPTANCE**. Review SHA256:
`C0449B1064B1B38609DAD7BB9A721501979D90DCEA460958CA60815C6AE055BA`.

RV-01 and RV-02 are CLOSED — VERIFIED. Earlier receiving R-02 is CLOSED — VERIFIED,
no regression. No BLOCKER/REQUIRED finding remains. Fresh reviewers checked actual
source/caller/test provenance and independently executed the delayed-decrypt and
original-eight-hour rollback regressions plus genuine-parent expected-red comparison.
Coordinator authorship and separate unit/PG/browser execution are distinguished
by the review. This Owner directive is the subsequent formal acceptance decision.

Review-time execution:212/212unit including9lifecycle/2RVcases;16/16focused including
8real PostgreSQL and8overlapping unit/config cases. Distinct successful automated
scope is212unit+8PG=220, not the sum of every rerun. Baseline0pass/2expectedfail is
diagnostic, not a final implementation failure. Build/static and representative
real-browser preservation checks passed. Historical357PG/18browser evidence remains
historical, not fresh acceptance execution. **No application/PG tests are rerun
to record this Owner decision.**

| Retained local evidence | SHA256 |
| --- | --- |
| artifacts/tests/p1-final-closure-unit.log |36273C41C3578D54538015855CDB67718C4129379749ED9CDC3E1FC2AAA73A2E |
| artifacts/tests/p1-final-closure-focused.log |F30A7A5126B72559C57F4004A46DDF6F178E428C944EF6235520B5053A4A1155 |
| artifacts/tests/p1-final-closure-regression-all.log |08D8E5F6F87B62810B86134FAB00FD0839B87F146A793E6854096A58C323F773 |
| artifacts/tests/p1-final-closure-regression-green.log |DB76D7CA84FF1681FDACD88B262C2882B605E61B2D24EA21129DED0331F207EB |
| artifacts/tests/p1-final-closure-regression-red.log |0BE33BA074930CD9F7ECD4A8DB66374FD79546C5D38147FB801D139DC6BF5E43 |
| artifacts/tests/p1-final-closure-evidence-hashes.json |2EE6F906FCB3CA6685B5CE268155824F730D1BB3B0F62A29AE3210CC647D1952 |

Detailed logs/receipts are ignored/local, not committed or assumed remotely
available. This tracked record preserves the accepted revision, closure conclusions
and key provenance even if those artifacts are absent elsewhere. Historical FAIL
reports/remediations remain unchanged: `artifacts/tests/p1-independent-audit-2026-10-26.md`
and `artifacts/tests/p1-independent-remediation-review-2026-10-26.md` record the
earlier required findings before correction and final independent closure.

## Deferred observations and non-acceptance boundaries

O-01 remains deferred/nonblocking: confirmed registration may appear unresolved if
its following receiving read fails. No implementation is authorized here and it is
not automatically a P2 prerequisite. N-01 is historical ignored-report wording:
actual app delta25added/2removed,27changed, not27added/2removed. No source correction,
corrective commit or new engineering audit is required for that wording.

Clock guarantees are relative to the document's first observed wall/monotonic
relationship; browser clocks are not universally trusted across OS sleep/process
restart. Controlled-time tests are not real8hour waits or native crypto scheduling
claims. Server validity remains authoritative. Recovery needs retained tab
ciphertext and stable server configuration.

Not approved: production deployment/external exposure or production TLS/reverse
proxy; factory UAT; migration/opening balances; receiving-write/Warehouse confirmation
UI; new Inventory rules; supplier master/Finance/QC/general reporting; unrestricted
order search; new roles/business rules; P2/P3/later implementation. The complete
ERP is not declared production-ready.

## Authority closure and next step

The completed P1 implementation gate and ignored local unlock are closed with
implementationAuthorized=false. Only this acceptance documentation/governance
validation and one local commit are authorized now. **P2 = NOT AUTHORIZED.**
[Current phase](../CURRENT_PHASE.md) and the
[current-state addendum](../../12-implementation-planning/ERP_CURRENT_STATE_AND_NEXT_STEP.md)
identify P2 receiving-confirmation UI as the proposed next increment over accepted
I2 contracts and original factory requirements. It needs a separate explicit Owner
directive. No further P1 engineering audit is necessary on the reviewed revision
unless new concrete evidence emerges. Stop after local recording; no push.
