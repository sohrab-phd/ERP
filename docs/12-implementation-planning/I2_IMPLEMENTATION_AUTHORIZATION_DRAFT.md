---
id: PLAN-I2-AUTH-DRAFT-001
title: Bounded I2 backend implementation authorization draft
phase: 12-implementation-planning
status: proposed
version: 0.2.0
owners: [project-sponsor, delivery-lead]
depends_on: [APR-041, APR-040, APR-039, SRC-007, PLAN-I2-DESIGN-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-10-24
approval: null
supersedes: null
---

# PROPOSED — NOT AUTHORIZED FOR EXECUTION

This is a draft for a FUTURE separate explicit Owner implementation instruction.
[APR-041](../00-governance/approved-baselines/APR-041-i2-focused-design-acceptance.md)
records bounded architecture acceptance and OPEN I2-CAP-01/02; it does not approve
all capacities or unlock execution. [Focused design](I2_IMPLEMENTATION_DESIGN.md)
removes the unsupported256-unit/document cap. No checkboxes, API, permission or
product gate/unlock are activated by this document.

## Proposed future bounded authority

Implement one coherent receiving capability: current personal organizational
ACT-WH manually confirms complete shared physical arrivals, unique external
waybills/warehouse receipts, multiple independent physical units and real optional
PO/line associations. Preserve all11receiving fields, original/actual evidence,
manual changed-W1/mismatch/excess/unordered acceptance, partial progress, exact
shared W2/W3 and independent unit W1. ACT-PROC reads ALL relevant committed fields,
including driver, without sibling/unrelated cargo disclosure. Preserve twelve
accepted capabilities and original I1 facts.

### Exact repository/module scope to authorize later

- Procurement: new bounded receiving contracts/service/store/HTTP in existing
  module, public exports and I1 owner read ports only as needed; no I1 amendments,
  registration/catalogue redesign or documentary-purchase access widening.
- Legacy receipt service/store: only shared code-resource acquisition/duplicate
  rejection compatibility required by SRC-007-B02. Existing v1 shape/no-PO/no-ticket,
  accepted replay and source semantics stay. New duplicate admissions intentionally
  reject; do not claim the old nonunique policy is still current for new receipts.
- Inventory: sibling receiveMany/admission/new origin and owner reads/resolver,
  exact original-command validation; normal Unit/Ledger/Balance remain sole IPS.
  IPS numeric arithmetic/negative-stock/state invariants unchanged; no business
  type fallback or unauthorized enum/category extension.
- Composition/transport: ConfirmPurchaseReceiving v1 and exactly two scoped new
  queries GetReceivingArrival/GetPurchaseOrderReceiving; explicit roles/targets/
  disclosure, bounded readers and preserved trusted context. No unrelated route.
- Genealogy: typed source-backed accepted-unit W1 origin, existing reachability,
  no old measured-origin reinterpretation, sibling cargo traversal or PII leak.
- Next available additive migration (currently0018), owner tables/FKs/identity
  guard/immutable sources/completeness and minimal runtime grants. Necessary
  migration inventory, role/reset fixtures, ownership checks and root test runners.
  Do not rewrite0001–0017 or historical data. SQL helper permissions/owner boundaries
  follow the reviewed design; no generic database orchestration or second writer.
- Relevant unit/HTTP/real-PG/concurrency/recovery/regression tests and canonical
  implementation/requirement evidence. No new framework/dependency without a
  demonstrated separately reviewed need.

## Preconditions of a real authorization

1. Record explicit acceptance/revision of ONLY the two open I2 admission proposals:
   I2-CAP-01 (new128scalar/512byte receiving text) and I2-CAP-02 (receiving Jalali
   profile1206–1498). APR-041 already records the selected architecture, exact
   identifiers, W1/Sheet/genealogy sources, authority and code guard; do not repeat
   general design approval. Obtain separate bounded implementation authority.
2. Verify the actual catalogue/profile bindings using already known factory
   categories. R-MAT is conditional: report a specific ambiguous/unsupported real
   option before that material's stock admission, or explicitly bound that branch.
   No reconfirmation of known categories, global classification approval or invented
   mapping is required; no actual unsupported type is asserted by this draft.
3. Reconcile any accepted architecture/dependency records for cross-path code
   uniqueness and the distinct accepted-W1/new Sheet origin. Record actual Owner
   implementation authority and only then the exact I2 gate/unlock scope. Preserve
   the I1 baseline; never self-approve a proposed design or weaken gate enforcement.

Historical code/source consistency is an actual-data verification condition during
authorized migration/rollout. Report real contradictions without guessing a merge,
changing codes or treating the Owner's history statement as an executed scan.
No production reset/backfill or deployment is implied by test authorization.

## Required implementation verification and delivery

- Exact11field/6mandatory/5optional mapping, immutable originals and per-unit
  provenance, all proposed I2-A01–A22 cases linked to original requirements/source007.
- REAL pinned Windows PostgreSQL with separate acknowledged test/dev DBs and
  migration/runtime roles: fresh/additive/checksum/restart migration, strict FKs,
  code/doc races across old/new paths, direct SQL guard/privileges, completeness,
  atomic multi-PO/IPS chunks, line-progress conflicts, rollback and audit failures.
  No independent256unit/document ceiling. Include257+units that fit existing
  envelope budgets, <=128effects/call, full-set prelocks and late-chunk rollback
  of the entire arrival in ONE original transaction/COMMIT.
- Genuine unknown-COMMIT/crash recovery with original bound intent, same-key
  accepted/rejected replay and changed payload/preconditions conflict; current
  grant revocation while waiting and before disclosure, forged/foreign contexts.
- ACT-PROC all-field visibility incl driver/W2/W3 on selected order, WH arrival,
  no SEC/customer/new unrelated reads, no sibling cargo disclosure; source-backed
  genealogy and legacy/I1/Inventory/Sales/reservation/shipping/production/Finance
  regressions. Valid admitted facts must remain fully retrievable across pages.
- Root preflight/build/unit/integration/security/format/lint/boundary checks,
  independent engineering/database/security/test review, required findings fixed
  and affected checks rerun. Do not label unexecuted tests PASS.
- Update actual implementation status/limits/trace, command/query/permission
  documentation and reviewed final diff. Create coherent local implementation
  commit only after required validation/review closure; report actual commands,
  counts, deviations/blockers, commit, clean tree and verified push status.

Stop for separate Owner backend acceptance; I2 is not an accepted thirteenth
capability until the Owner says so. No push, next increment, UI, factory UAT or
production acceptance/deployment.

## Explicit exclusions

No incomplete-mandatory drafts or nonaccepted custody subsystem, original PO
amendment/cancellation/automatic closure, historical backfill, post-post correction,
returns, financial effects, QC, device/ticket integration, browser UI or new
material-master/classification approval workflow. No splitting a physical arrival
into separate commits to bypass atomicity/capacity and no direct Procurement stock
writes. Only actual future Owner authority can execute this bounded scope.
