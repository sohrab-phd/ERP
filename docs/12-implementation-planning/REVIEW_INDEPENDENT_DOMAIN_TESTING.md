---
id: PLAN-REVIEW-DOMAIN-TESTING-001
title: Independent domain, architecture-boundary and testing review
phase: 12-implementation-planning
status: accepted
version: 0.2.0
owners: [independent-domain-testing-reviewer]
depends_on: [PLAN-IMPLEMENTATION-BACKLOG-001, PLAN-ENVELOPE-PHYSICAL-001, PLAN-TECH-001, QA-TRACE-001, GOV-QUESTIONS-001]
last_reviewed: 2026-10-04
approval: null
---

# Independent domain and testing review

This independent review reads actual repository sources after retirement of the
legacy Codex hook. It is engineering review evidence, not human baseline approval,
execution of product tests, or implementation authorization. Scope: business-rule
preservation, module/slice boundaries, first-slice testability and acceptance
coverage. Database/security implementation correctness has separate reviewers.

## Sources inspected

README relevant architecture/status sections, complete CURRENT_PHASE and live
DECISIONS, OPEN_QUESTIONS status snapshot/residual table and relevant OQ/factory
evidence sections (no claim to review every historical paragraph); team answers
OQ-004, OQ-006 through OQ-010, OQ-012 and OQ-016; MVP_SCOPE_AND_BUSINESS_RULES,
PROCESS_MAPS_AS_IS_TO_BE, MODULE_OWNERSHIP_MATRIX; INVARIANT_CATALOGUE,
TRANSITION_TABLES, STATE_MACHINE_CATALOGUE relevant lifecycle sections,
CONCURRENCY_AND_INTERLOCK, SIDE_EFFECT_MATRIX; POSTING_KERNEL,
GENEALOGY_PROJECTION; MODULE_DEPENDENCY_MAP, DEPENDENCY_AND_IMPORT_RULES,
CUSTOMER_ISOLATION; SLICE_HOMES, ROADMAP_AND_SLICES, IMPLEMENTATION_BACKLOG;
TEST_STRATEGY, SCENARIO_CATALOGUE, PROPERTY_AND_KERNEL_INTENTS,
VERIFICATION_TRACE, NFR_AND_UAT, QUALITY_GATES; COMMAND_IDEMPOTENCY_SPEC v1.0.0,
TECHNICAL_FREEZE and SLICE_ENVELOPE_PHYSICAL_DESIGN v0.2.0.

## Engineering conclusions

- Modular Monolith and PostgreSQL remain intact; one backend composition and
  shared-kernel ports introduce no distributed infrastructure or domain writer.
  Public owner contracts share one transaction; sharing a connection does not
  authorize cross-owner persistence writes.
- ACT-IPS alone writes stock quantity/Ledger/Balance. Ledger is movement truth;
  Balance reconstructs from Ledger. kg is the sole stock quantity; Count, length,
  dimensions and commercial final weight do not become independent stock ledgers.
  Measured 1 kg resolution does not invent a universal persistence/arithmetic scale.
- Production completion contains consumption/output/residual/scrap and nested
  IPS effects atomically. Residual child identity and Scrap destiny cannot repost
  their quantities. Human reusability replaces automatic cutoff classification.
  Production mass-balance/process-loss policy is separate from OQ-006 fulfillment.
- Genealogy reconstructs from owner source facts, not Ledger alone. Standalone
  Sheet material receives no fabricated Coil ancestor; Order Code does not replace
  Inventory Unit identity or require an ID for every tiny piece.
- Sales closure preserves the answered fulfilled/cancelled/authorized-unfulfilled
  rule. Payment, invoice issuance and shipment DELIVERED alone are not closure
  guards. One ACTIVE reservation per Unit, no stealing and no confirmed-SO TTL
  remain. Requested reservations do not consume the ACTIVE slot.
- Finance-Lite is operational invoice/payment/allocation, not legal GL. The
  weighbridge commands owners and never writes Ledger. Portal MVP is scoped
  visibility only. QC is outside current MVP and creates no first-slice prerequisite.
- Receipt stays PURCHASE; reservation/dispatch/payment stay STOCK; production
  leftover identity stays nested MAKE; reversal/rebuild/cutover retain their homes.
  Broader ENVELOPE report/live/print logical homes do not expand the exact first grant.

## Findings and classification

| Finding | Classification | Required disposition |
| --- | --- | --- |
| Earlier QA and domain tables still label answered OQ-017, OQ-004, OQ-006, OQ-012 or OQ-016 as wholly open | Documentation inconsistency, not foundation blocker | Replace with actual residuals; preserve recorded answers/statuses |
| QA verification trace retains availability minus hold and current purchase QC stop | Documentation inconsistency | Hold/QC must be future-only; current availability is on-hand minus reservation with separate eligibility guards |
| Genealogy projection still refers to residual cutoff numbers and unnamed steps | Documentation inconsistency | Human disposition/recording remains open; ten Stations/per-order skipping are recorded, routing/lifecycle storage remains B |
| Production mass-balance, disposition recording, UOM arithmetic and warehouse Coil-to-Sheet transaction | Later slice-specific B | Missing required policy rejects; no new policy, automatic cutoff or completion bundle invented |
| Named UAT/cutover people, transaction volumes and opening-stock files | C/D non-blockers for foundation | Require at their operational boundary, not before health/envelope foundation |
| RPO ≤60 minutes/RTO ≤8 hours, daily backup/off-site copy | Answered recovery baseline | Retention/vendor/proof remain later C/D; lossy-restore admission fencing is explicitly planned |
| QC, portal ordering/requests, multi-site, statutory GL | Future/deferred F | No current implementation scope implied |

Findings above were sent to owning writers for repair. After their final-version
notification, this reviewer reread the repaired invariant/transition/state rows,
SLICE_HOMES, genealogy, rejection/event contract and QA trace/property/recovery
sections, complete final physical design v0.2.0 and the live ADR-0011/0013 decision
entries in DECISIONS v0.9.0. The observed repairs explicitly preserve answered
rules and name only actual residuals. Ten Stations/per-order skipping are recorded;
operation lifecycle/authority remains B. No legal GL or current QC prerequisite
was introduced. Event notices now explicitly follow confirmed COMMIT. Current
QA recovery records RPO ≤60 minutes/RTO ≤8 hours; its vendor/retention/proof remains
later. Technical stack/physical freeze status matches delegated ADR decisions.
The documentation inconsistencies identified here are resolved for the current
engineering plan. No OQ body, gate, human approval evidence, unlock, hooks or
product files are edited by this reviewer.

## First-slice testability

The current physical plan defines exact files and acceptance intents instead of
claiming nonexistent product tests passed. Tests use a real isolated PostgreSQL
database, independent clients, barriers and controlled test child processes;
no SQLite/mock claim substitutes for locks/savepoints/commit behavior.

Coverage explicitly includes accepted and rejected first outcomes/replay,
request/material/command/version/principal binding, cross-scope isolation,
concurrent winners and aborts, forced key-hash collision, distinct-key natural
duplicate facts, authorization revoked during waiting, savepoint rollback,
technical SQL failures distinct from business rejection, original/replay audit
atomicity/redaction, response loss/ambiguous commit, lossy restore, canonical JSON
and bounded admission, immutable outcome/retention readers, migration checksum
drift and serialization, least-privilege database grants, guarded destructive test
reset, clean deterministic install/build and import-boundary checks.

The production host has health only; synthetic command/principal fixtures cannot
authenticate or register production business routes. Tests can therefore prove
generic command infrastructure without inventing business rules or named people.
No first-slice testability blocker was identified in the inspected design.

## Verdict

**PASS for independent domain-rule preservation, module/slice boundary coherence
and foundation testability/acceptance design. Implementation-start blockers found
in this review: NONE.** The scoped first slice can begin after explicit human
authorization without a new business-policy or testing-architecture round.

This is a design review, not a repository-wide historical prose audit or execution
of product tests. It does not approve future business behavior whose B inputs remain
open, authenticate an actual production RBAC provider, or replace the independent
database/security/final readiness reviewers. Runtime assertions and DoD tests must
be implemented and pass after authorization; none is claimed passed now.
The directly read canonical gate remains implementationAuthorized=false and
approvedBaseline=null. ERP implementation remains locked.
