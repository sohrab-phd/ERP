---
id: APR-034
title: Owner authorization of I1 detailed technical design only
phase: 12-implementation-planning
status: approved
version: 1.0.0
owners: [project-sponsor]
depends_on: [APR-032, APR-033, SRC-004, SRC-005, DOM-INBOUND-POLICY-001]
last_reviewed: 2026-10-20
approval: Actual Owner message explicitly authorizes Step 3 detailed technical design of I1 only
supersedes: null
---

# Actual Owner instruction — I1 detailed design, no implementation

The Owner explicitly authorizes **STEP 3 — DETAILED TECHNICAL DESIGN OF I1** after
reviewing the policy/readiness report, referencing latest local documentation commit
`38cb85558e7dbc2c02d06fc91f6b99b08e8d925f`. Remote status is not confirmed; no push
may be assumed or performed. This does not invent formal acceptance/push of that
commit or approve any subsequent technical recommendation. Step 2 analysis at
b8666b7 remains formally accepted under APR-033; eleven backend capabilities remain.

Authorized scope: code-informed detailed PROPOSED domain/data model, exact twelve
Masoumi fields, factory-wide PO identity, numeric/Jalali representation, shared
three-catalogue add/select by both organizational ACT-PROC/ACT-WH, command/query
and PostgreSQL/transaction design, security matrix, future I2 compatibility boundaries,
requirements-linked acceptance design and decision/risk log. Read mandatory source/
analysis/code/tests, independently review engineering/security, fix required findings,
run relevant documentation checks and optionally commit docs locally. See the
[six-file I1 design package](../../12-implementation-planning/I1_PURCHASE_ORDER_DOMAIN_DESIGN.md).

Confirmed business policies remain sourced in unchanged SRC-004/SRC-005 and the
I1 amendment. All new technical schema/API/constraint/equality/validation/algorithm/
resource choices must remain DRAFT / PROPOSED / NOT AUTHORIZED FOR IMPLEMENTATION.
Do not publish a new approved technical ADR or actual contract. No extra mandatory
factory field, supplier master, name authorization, catalogue-only admin gate,
technical enum widening, B06 acceptance or second inventory writer is permitted.

The actual instruction prohibits application code, executable migration creation
or execution, executable API/domain-contract or runtime-permission changes, test
implementation, gate/unlock changes, I2 implementation/final detailed design,
browser UI and deployment. No old records/migrations or accepted business behavior
may be reinterpreted. I1 must create no stock/receipt/production/shipping/finance
effect. No application/PG test run or UAT/production acceptance is implied.

**Stop after producing and independently reviewing I1 detailed design.** The
Owner must review/accept proposed technical decisions and issue a separate bounded
implementation authorization before runtime work or product gate expansion.
Successful documentation or an agent review does not self-authorize that next step.
Never push or rewrite remote history.
