---
id: GOV-SOURCES-001
title: Source Register
phase: 00-governance
status: in_review
version: 0.4.0
owners: [chief-solution-architect]
depends_on: []
last_reviewed: 2026-10-21
approval: APR-002 historical structure; subsequent Owner sources recorded under APR-033 and APR-036
supersedes: null
---

# Source Register

## SRC-006 — Subsequent Owner R1 Option A approval

- Recorded source: [Owner R1 decision](team-answers/OWNER_R1_ORDER_REFERENCE_DECISION_2026-10-21.md),
  actual subsequent Owner message after review of locala84e20e; no push assumed.
- Authority: R1 PO-only equivalence/raw-preservation policy, not full I1technical
  acceptance, catalogue equivalence, implementation or product gate change.
- Scope: [APR-036](approved-baselines/APR-036-r1-design-acceptance-preparation.md)
  authorizes documentation reconciliation, acceptance checklist and future scope
  draft only. Original sources/factory fields/requirements remain unchanged.


## SRC-001 — Architecture and Detailed Design Report

- Title: `گزارش معماری و طراحی تفصیلی.docx`
- Location: `D:/projects/NavardKaran/Docs/گزارش معماری و طراحی تفصیلی.docx`
- Authority: Primary architectural baseline
- Read status: Complete
- Interpretation: Proposed baseline subject to unresolved questions and gate review
- Notes: Legacy .NET references are superseded by the explicit Node.js +
  TypeScript backend constraint.

## SRC-002 — Comprehensive Prompt Version 2

- Title: `پرامپت جامع نسخه ۲ (1).docx`
- Location: `D:/projects/NavardKaran/Prompts/پرامپت جامع نسخه ۲ (1).docx`
- Authority: Primary architecture-analysis and orchestration methodology
- Read status: Complete
- Interpretation: Defines specialist responsibilities, required artifacts,
  validation, risk, and decision governance.

## SRC-003 — Architecture Assimilation Report

- Title: Architecture Assimilation Report
- Location:
  `../01-project-assimilation/ARCHITECTURE_ASSIMILATION_REPORT.md`
- Authority: Derived synthesis; not a substitute for SRC-001 or SRC-002
- Status: Awaiting Phase 01 approval

## SRC-004 — Owner-confirmed purchase and receiving investigation

- Origin: actual Owner message dated 2026-10-20; confirmed on-site investigation
  findings, not an agent-fabricated interview or attendance record.
- Recorded source: [factory workflow and exact 23 fields](team-answers/FACTORY_PURCHASE_RECEIVING_2026-10-20.md).
- Authority: authoritative business input for this workflow; does not override
  architecture or authorize runtime/API/SQL/grant/gate changes.
- Derived Step 1 requirements (subsequently accepted under APR-032): [requirements baseline](../02-domain-business-architecture/PURCHASE_RECEIVING_REQUIREMENTS_BASELINE.md),
  [field dictionary](../02-domain-business-architecture/PURCHASE_RECEIVING_FIELD_REGISTER.md),
  [trace](../02-domain-business-architecture/PURCHASE_RECEIVING_REQUIREMENTS_TRACE.md),
  [preliminary reconciliation](../02-domain-business-architecture/PURCHASE_RECEIVING_RECONCILIATION.md).
- Missing evidence: no actual purchase/waybill/receipt/scale document attached;
  investigation date, formats and unresolved policies are not invented.
- Original authority [APR-031](approved-baselines/APR-031-factory-requirements-step-1.md)
  permitted Step 1 documentation only. Later actual acceptances are recorded in
  APR-032/APR-033; this source entry does not close residual OQs or rewrite SRC-004.

## SRC-005 — Subsequent I1 Owner policy clarification

- Origin: actual subsequent Owner acceptance/policy message on 2026-10-20, recorded
  separately from the earlier factory investigation; SRC-004 remains unchanged.
- Recorded source: [Owner I1 clarification](team-answers/OWNER_I1_POLICY_CLARIFICATION_2026-10-20.md).
- Authority: confirmed business policy, scoped to factory-wide PO uniqueness,
  m/mm/m dimensions, Jalali registration date, required shared extensible lists,
  both-role addition/selection and core I1 register/read/lookup. Remaining I2
  questions and unchosen technical representations/equivalence/mapping stay separate.
- [APR-033](approved-baselines/APR-033-i1-policy-clarification.md) records acceptance
  of Step 2 local commit b8666b7, push unconfirmed; no Step 3 or implementation grant.
- [Policy amendment and supplemental trace](../02-domain-business-architecture/PURCHASE_RECEIVING_I1_POLICY_AMENDMENT.md)
  adds REQ-INBOUND-S01–S12 without changing the original 23 fields or 25 rules.
  No real sample records, technical enum/mapping decision or normalization rule supplied.

## Provenance rules

- External source documents remain unchanged and are referenced, not copied.
- Derived artifacts identify source IDs and separate quoted facts from inference.
- Future interviews, forms, sample records, equipment specifications, and workshop
  minutes receive new source IDs before their evidence is promoted.
