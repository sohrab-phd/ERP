---
id: PHASE-12
title: Implementation Planning
phase: 12-implementation-planning
status: approved
version: 0.10.0
owners: [chief-solution-architect, delivery-lead]
depends_on: [PHASE-11, APR-013, APR-014, VAL-P12-HANDOFF-001, ASM-025]
last_reviewed: 2026-10-20
approval: APR-014
supersedes: null
---

# Phase 12 — Implementation Planning

Current task: [APR-034](../00-governance/approved-baselines/APR-034-i1-detailed-design.md),
Step 3 detailed technical DESIGN of I1 only. The [six-file package](I1_PURCHASE_ORDER_DOMAIN_DESIGN.md)
covers separate immutable operational orders/lines, both-role shared reference
catalogues, proposed API/SQL/transactions/security and 60-ID future acceptance.
All technical choices are PROPOSED / OWNER ACCEPTANCE REQUIRED. No implementation,
executable migration/contract/test/permission, enum/IPS change, I2 final design,
UI/deployment or product gate/unlock expansion. Stop for Owner design review and
separate bounded implementation authority; eleven backend capabilities remain.
Latest referenced local38cb855 has no confirmed remote push.

Previous task: [APR-033](../00-governance/approved-baselines/APR-033-i1-policy-clarification.md),
Step 2 analysis accepted at local b8666b7, push unconfirmed; focused I1 policy
documentation and readiness only. The [subsequent policy amendment](../02-domain-business-architecture/PURCHASE_RECEIVING_I1_POLICY_AMENDMENT.md)
records resolved factory-wide PO identity, units/Jalali date, shared extensible
lists and BOTH roles' add/select authority. The [updated roadmap](PURCHASE_RECEIVING_DELIVERY_ROADMAP.md)
includes both-role catalogue capability in I1. No demonstrated I1 business-policy
blocker remains for detailed design; technical choices/I2 residuals stay separate.
Step 3 remains unauthorized. No implementation, gate change or twelfth capability.

Previous authority: [APR-032](../00-governance/approved-baselines/APR-032-inbound-gap-analysis.md),
Step 1 accepted/push confirmed; Step 2 technical gap/architecture analysis only.
See the [accepted baseline and field/trace companions](../02-domain-business-architecture/PURCHASE_RECEIVING_REQUIREMENTS_BASELINE.md)
and [preliminary reconciliation](../02-domain-business-architecture/PURCHASE_RECEIVING_RECONCILIATION.md).
New factory facts require governance reconciliation; no API/SQL/runtime/grant or
product gate changes. The [Step 2 package](PURCHASE_RECEIVING_TECHNICAL_GAP_ANALYSIS.md)
contains code evidence, all 48 requirements, architecture/security/transaction impact,
OPEN decisions and a conditional roadmap. Stop before Step 3; detailed design and
implementation need new explicit authorization. Backend count remains eleven.

Earlier task authority was
[APR-030](../00-governance/approved-baselines/APR-030-weighbridge-clarification-preparation.md):
Finance-Lite invoice evidence is formally Owner-accepted/confirmed pushed as the
eleventh backend capability; Weighbridge human-ticket/fallback review is now
Owner-accepted/confirmed pushed. Final [factory clarification](../00-governance/WEIGHBRIDGE_FACTORY_CLARIFICATION.md)
and [conditional contract/DoD preparation](WEIGHBRIDGE_IMPLEMENTATION_PLAN.md) are
authorized for planning only. See the [accepted scope review](WEIGHBRIDGE_HUMAN_TICKET_SCOPE_REVIEW.md)
and [current scope](../00-governance/CURRENT_PHASE.md). No weighbridge implementation
or gate/unlock expansion is authorized. Architecture baseline
remains APR-018/e80a04b15ddf93451cc79ccf81722f564912596d. Earlier slice/gate statements
below are historical. See the
[Identity implementation record](IDENTITY_AUTHORIZATION_IMPLEMENTATION_STATUS.md).
See [IPS plan](SLICE_IPS_IMPLEMENTATION_PLAN.md),
[actual delivery](SLICE_IPS_IMPLEMENTATION_STATUS.md) and
[ADR-0015](../00-governance/adrs/ADR-0015-inventory-posting-kernel.md).
See [live readiness](IMPLEMENTATION_READINESS.md) and the frozen
[physical design](SLICE_ENVELOPE_PHYSICAL_DESIGN.md). The APR-014 structure gate
and architecture-only statements below are historical; no Phase 13 is created.

See [receipt plan](SLICE_PURCHASE_RECEIPT_PLAN.md), [actual receipt delivery](SLICE_PURCHASE_RECEIPT_IMPLEMENTATION_STATUS.md), [review closure](SLICE_PURCHASE_RECEIPT_REVIEW.md) and [ADR-0016](../00-governance/adrs/ADR-0016-manual-goods-receipt.md).

## Gate

Gate status: `APPROVED`

Lifecycle: `approved`

Approval: `APR-014` at `2026-09-07T23:16:00+03:30`, including ASM-025
(structure baseline)

Git checkpoint: completed at `a6b893095af7c9d14f342371fb6e4ef9c6d833df`
(CHK-0013). See [CHECKPOINT_APR-014.md](CHECKPOINT_APR-014.md).

There is no Phase 13. Team answers remain open. Phase 12 approval is
**not** an implementation unlock. `IMPLEMENTATION_AUTHORIZED` remains
`false`.

## Purpose

Translate the approved architecture into sequenced, reviewable **planning
labels** without reopening design decisions and without starting coding.

## Planned artifacts

- [x] [Implementation readiness checklist](IMPLEMENTATION_READINESS.md)
- [x] [Capability development workflow and skill routing](DEVELOPMENT_WORKFLOW.md)
- [x] [Authorized SLICE-ENVELOPE implementation evidence](SLICE_ENVELOPE_IMPLEMENTATION_REPORT.md)
- [x] [Authorized Identity technical decision](../00-governance/adrs/ADR-0014-local-identity-authorization.md)
- [x] [Identity implementation and acceptance evidence](IDENTITY_AUTHORIZATION_IMPLEMENTATION_STATUS.md)
- [x] [Roadmap and vertical slices](ROADMAP_AND_SLICES.md)
- [x] [Work items linked to approved IDs](WORK_ITEMS.md)
- [x] [Authorized spike kinds and acceptance labels](SPIKES_AND_ACCEPTANCE.md)
- [x] [Cutover, training, rollout, and support labels](CUTOVER_TRAINING_ROLLOUT.md)
- [x] [Implementation-authorization record (labels only)](AUTHORIZATION_RECORD.md)
- [ ] `TEST-*` catalogue / named roster / unlock file — **not** in this baseline
- [x] [Self-check](SELF_CHECK.md)
- [x] [Independent review](INDEPENDENT_REVIEW.md)
- [x] [Reconciliation](RECONCILIATION.md)
- [x] [Gate checklist](GATE_CHECKLIST.md)
- [x] [APR-014 checkpoint procedure](CHECKPOINT_APR-014.md)

## Entry criteria

- [x] Phase 11 is approved (APR-013).
- [x] Phase 11 Git checkpoint — completed at
  `57062e96c91b6eff52f233aaf3a0df65a81e9da4` (CHK-0012).

## How this phase works while answers are still arriving

Name slices, work-item kinds, and later unlock required fields. Do not
invent an unlock file. Do not create application folders. Do not mint
`TEST-*` IDs. “Ok, Continue” is not approval.

## Exit criteria

- Every planning item references an approved design baseline **or**
  the missing workshop/`TEST-*`/unlock piece is an explicit open
  extension (ASM-025 accepted).
- Scope, ordering, dependencies, evidence kinds, rollback labels, and
  role-owners are explicit; named people stay OQ-019.
- The user explicitly approved Phase 12 as APR-014.
- Implementation remains locked until a later human unlock.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

Current purchasing increment: [plan/DoD](SLICE_PURCHASE_PLAN.md), [actual delivery and evidence](SLICE_PURCHASE_IMPLEMENTATION_STATUS.md), [Owner scope](../00-governance/approved-baselines/APR-027-purchasing-evidence-scope.md). Candidate PO approval/lifecycle stays deferred; no stock or financial effect.
