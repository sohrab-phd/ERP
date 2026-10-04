---
id: PLAN-REVIEW-DOMAIN-001
title: Independent Domain and Backlog Review
phase: 12-implementation-planning
status: in_review
version: 0.2.0
owners: [chief-solution-architect]
last_reviewed: 2026-10-04
approval: null
---

# Independent domain and backlog review

Result: **domain/business and backlog reconciliation PASS for foundation-only
SLICE-ENVELOPE after the corrections below**. No domain business answer blocks
that non-business foundation. This is independent engineering evidence under
ADR-0012, not human approval, implementation authorization or runtime tests.
It does not approve all later business slices with unresolved policy.

## Sources reviewed

Direct repository access is restored after Owner hook retirement and restart;
the prior source-limited review is superseded by this report. Reviewed:
README/CURRENT_PHASE/DECISIONS/live OPEN_QUESTIONS including FACT-01–FACT-06,
C-07 and 2026-09-30 commercial/intake/production/shipment/change/procurement
evidence; MVP_SCOPE_AND_BUSINESS_RULES; CAPABILITY_BOUNDED_CONTEXT_MAP;
PROCESS_MAPS_AS_IS_TO_BE; ACTOR_RESPONSIBILITY_CATALOGUE;
MODULE_OWNERSHIP_MATRIX; INVARIANT_CATALOGUE; STATE_MACHINE_CATALOGUE;
TRANSITION_TABLES; CROSS_MACHINE_SEQUENCES; CONCURRENCY_AND_INTERLOCK;
SIDE_EFFECT_MATRIX; EXCEPTION_CORRECTION; POSTING_KERNEL;
GENEALOGY_PROJECTION; COMMAND_CATALOGUE; MODULE_DEPENDENCY_MAP;
ORCHESTRATION; CUSTOMER_ISOLATION; ROADMAP_AND_SLICES; WORK_ITEMS;
SLICE_HOMES; IMPLEMENTATION_BACKLOG. Canonical evidence, not technology
popularity or hypothetical adversarial OS containment, controls findings.

## Findings and disposition

| Finding | Classification | Disposition |
| --- | --- | --- |
| Backlog called intake/receipt SLICE-STOCK although WI-BUNDLE-GR is PURCHASE | Documentation inconsistency, repaired | Renamed receipt increment to SLICE-PURCHASE and added full canonical-home/bundle table. All accepted homes and indivisible bundles retained. |
| Backlog called SalesOrderChange a catalogue command though APP-CMD-001 enumerates change-record concept only | Documentation inconsistency, repaired | Distinguish existing change-record concept from enumerated command; no new command minted. |
| INV-007/BR-007, transitions and side effects applied OQ-006 zero/family fulfillment tolerance to production mass balance | Documentation inconsistency, repaired | Production mass-balance/process-loss policy references existing production residual/evidence on OQ-009. OQ-006 remains fulfilled/partial/over-delivery default zero; no production percentage inferred. |
| INV-008/state residual branch demanded numeric usability cutoff despite human reusability evidence | Documentation inconsistency, repaired | Human decision governs; numeric BELOW_THRESHOLD_TO_SCRAP proposal explicitly historical/non-executable. Missing disposition recording/authority still rejects. No new event/state/command and no business answer closed. |
| Actor/capability/MVP text still treated portal visibility as optional pending OQ-010 and current QC release as required | Documentation inconsistency, repaired | Current portal read-only Sales-owned visibility; no request/order write; QC labels/RACI future-only. No current Quality gate or role added. |
| Recovery phrasing assumed all acknowledged outcomes survive permitted-RPO restore | Documentation inconsistency, repaired | Backlog states lossy-restore admission fence/reconciliation; absent outcome is not proof command did not execute. |
| Technical decimal persistence/arithmetic/conversion beyond measured kg | Later-slice B | No quantities in envelope; resolve before IPS quantity/conversion behavior. Measured 1 kg is resolution, not universal minimum permissible stock. |
| Human disposition recording/authority, per-order route/Entry/Referral mechanism, production loss/mass-balance policy | Later-slice B | Preserve GUARD_OPEN_POLICY before affected MAKE behavior; no fabricated cutoff/loss or automatic station posting. |
| Already-opened Coil remainder warehouse transformation command/identity/bundle | Later-slice B | C-07 evidence retained, transaction undecided; cannot fold into customer-production completion or opening stock. |
| Actual roles/delegates, shipping/commercial/payment/PO policies and document list | Later-slice B; actual UAT people C, cutover signers D | Organizational roster is not ACT permissions. Permit no affected behavior on guessed authority. |
| Opening stock/files/freeze/signers, backup product/retention, actual capacity/load | B for import design, C/D operational evidence | Not foundation-start blockers; accepted RPO≤60 min/RTO≤8 h remain. |
| QC, legal GL, multisite, portal request/prices/order write | Future F | Outside current MVP; no mandatory dependency. Optional functions/infrastructure E/F only on later evidence. |

Canonical current revisions record delegated reconciliation with approval:null;
historical APR structure evidence remains intact. Live OQ answers/statuses and
approved-baseline manifests were not modified. Where the OQ record says an
older architectural conflict was left open, this report supplies architectural
disposition only; it does not falsely close its remaining factory questions.

## Confirmed baseline invariants

| Area | Binding rule and source |
| --- | --- |
| Architecture | ADR-0001/0006/0007: Node/TypeScript Modular Monolith, one deployable, PostgreSQL transactional truth. APP-MOD/DOM-OWN: one owner, cross-module public contracts, no foreign-table writes. |
| Stock | INV-001–004/POSTING_KERNEL: ACT-IPS sole quantity writer; immutable Ledger truth; Balance rebuildable; no negative on-hand/reserved/available; kg authoritative, count/length/dimensions descriptive. Valid normal stock-in is AVAILABLE on valid commit; not all WIP is saleable and Scrap is not normal available stock. |
| Production | INV-006/DATA-TX: completion, consumption, output/WIP, residual or scrap facts, genealogy inputs and IPS effects in one transaction. Residual identity parent close/split nested; PlaceResidualUnit/ScrapUnit cannot double-post. Entry/Referral/operator completion not Start/Complete or stock post. |
| Genealogy | DATA-GEN: Lot Origin, Consumption, Output, Residual, Scrap, Package, Shipment, Rework source facts; Link rebuildable, never edited truth or Ledger-only. Standalone Sheet has no fabricated Coil ancestor; Order Code does not replace Inventory Unit identity or require one ID per tiny piece. |
| Sales close | OQ-007/APP-CMD: remaining valid demand zero within OQ-006, cancelled, or authorized unfulfilled remainder. DELIVERED/payment/invoice alone never closes SO; payment may remain open. |
| Reservation | OQ-008/SM-CONC: one ACTIVE per Unit even for partial claimed kg; earlier confirmed SO wins competition; no stealing/confirmed-SO timer; REQUESTED does not occupy active slot. Reservation, allocation and consumption distinct. |
| Finance-Lite | BR-012/OQ-012: invoice/payment/allocation operational facts only, no statutory GL; bounded allocation and immutable history; never writes Sales lifecycle or stock. External invoice upload is unnamed, not assumed GL API. |
| Weighbridge | OQ-011: adapter commands same PostGoodsReceipt, never Ledger; human printed-ticket fallback. Final invoice weight commercial evidence, not second stock truth. |
| Portal/security | OQ-010/SEC-ISO: authenticated scoped visibility only, document allowlist later; no order/request write, prices hidden by default, no internal genealogy dump; isolation on reads/exports/events/files. |
| Factory/people | Personal operator accounts; Station is not user; 11-person organizational roster ≠ ACT/RBAC/delegates; about 10 unnamed operators distinct population. No QC in current MVP. |
| Correction/recovery | INV-005: compensating new facts, original retained, distinct GR reversal approver SV-013. Balance from Ledger, Genealogy from source facts; no AdjustBalance/EditGenealogy. |

## Foundation Definition of Done from domain perspective

SLICE-ENVELOPE has no catalogue business handlers, quantities, prices, stock
schemas, domain permissions, factory workflow, production auth product, portal
or production-posting effects. Fixtures are test-only. The future implementation
must prove accepted/rejected bound replay, conflicts/duplicate distinction,
current access/nondisclosure, transaction/audit atomicity, concurrency/crash/
uncertain retries and strict fixture exclusion. Architecture/tooling, database,
application-security and final readiness reviewers assess those exact contracts
separately; this review does not replace them or claim runtime tests occurred.

No implementation-start **domain/business** blocker remains for the exact
foundation. Later B/C/D/E/F residuals remain explicit and cannot be promoted
to a generic A blocker or silently defaulted. ERP implementation has not begun.


