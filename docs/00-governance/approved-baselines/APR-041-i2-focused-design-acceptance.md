---
id: APR-041
title: Owner I2 focused architecture acceptance and open admission conditions
phase: 12-implementation-planning
status: approved
version: 1.0.0
owners: [project-sponsor]
depends_on: [APR-040, APR-039, SRC-007, PLAN-I2-DESIGN-001, PLAN-I2-AUTH-DRAFT-001]
last_reviewed: 2026-10-24
approval: Actual Owner ERP I2 Focused Design Acceptance instruction, qualified by its explicit capacity-conflict condition
supersedes: null
---

# I2 focused design acceptance — bounded record, not implementation authority

## Actual authority and precise acceptance scope

Owner instruction received2026-10-24 reviewed local design commit
`b33c7b7a4e5acb3862f5da7c1ab56371279a529a`, confirms all ten
[SRC-007 business decisions](../team-answers/OWNER_I2_RECEIVING_DECISIONS_2026-10-24.md)
and accepts the proposed architecture subject to fourteen mandatory boundaries.
It expressly says not to silently approve operationally restrictive new limits,
and requires reporting any material conflict and minimum correction.

This record accepts the selected architecture within those boundaries. It does
**not** certify unconditional acceptance of every proposed capacity. The focused
check found one unsupported count ceiling, removed below, and two new admission
conditions still requiring narrow Owner acceptance/revision. `status: approved`
means this actual bounded Owner instruction is recorded, not that open limits
have been approved by an agent. No new general architecture study is required.
Neither source007 nor APR-040 is rewritten or retrospectively reattributed.

## Selected architecture and security boundaries

- One shared physical arrival/consignment with actual unique waybills and external
  warehouse receipts; real multi-PO associations and multiple arrivals per PO.
  External references are preserved, never ERP-generated; exact independent
  factory-installation namespaces, no inherited PO R1 normalization.
- Each accepted unit has its manually assigned factory-unique system code and
  independent opaque/nonunique Product Number. Shared old/new code claims plus
  authoritative historical checks protect new admissions without historical
  rewrite; legacy standalone command/replay semantics remain compatible.
- Immutable I1 originals; separately recorded actual attributes, discrepancies,
  trusted WH approval and accepted per-unit W1. Explicit ORDER_LINE/ORDER_ONLY/
  UNLINKED associations support manual changed/mismatched/excess/unordered goods
  without fake PO lines or automatic acceptance. No additional approver.
- Mandatory W2 and optional W3 are exact document-precision kg evidence once per
  shared consignment, never allocated to units or substituted for W1. Arrival dates
  are Jalali. Exactly11receiving fields remain6mandatory/5optional; optional absence
  never blocks confirmation. No incomplete-mandatory draft is introduced.
- ACT-WH confirms; current organizational ACT-PROC sees every relevant committed
  purchasing/receiving field including driver. Selected-order projections exclude
  sibling POs/units and unlinked cargo. No SEC/customer/unrelated widening; preserve
  current personal grants, wait-time revocation, replay disclosure and trusted actor.
- Procurement source evidence, Inventory-owned typed unit origins, sole IPS stock,
  durable outcome and audit are one transaction. Whole actual ID set is prelocked;
  IPS calls contain at most128effects, all chunks share one COMMIT. Existing twelve
  accepted capabilities, manual receiving and immutable historical origins remain.
- Known business material categories resolve through the small Inventory technical
  profile. No automatic OTHER, enum widening or business classification workflow.
  R-MAT remains conditional only for a specific actual unsupported/ambiguous option.
  New accepted-W1/Sheet origin and source-backed genealogy remain owner-controlled;
  shared arrival never becomes a cross-order ancestry/disclosure path.

## Focused findings, minimum corrections and limits

| ID / disposition | Exact impact and smallest action |
| --- | --- |
| I2-LIMIT-01 CORRECTED | Independent256-unit/256-document arrival caps lacked factory evidence and could refuse a valid257-unit physical arrival. Remove those caps; reuse existing envelope budgets and <=128IPS calls in ONE transaction. No source/stock splitting or IPS kernel expansion. |
| I2-CAP-01 OPEN — Owner capacity decision | New receiving text at128Unicode scalars AND512UTF8bytes could reject a legitimate129-scalar Product Number/document/company value. I1 approval does not cover these receiving fields. Accept this INITIAL I2 capacity explicitly, or specify the needed larger input capacity. No silent truncation or legacy v1 widening. |
| I2-CAP-02 OPEN — Owner calendar coverage decision | The proven Jalali method covers1206–1498. An otherwise valid outside-profile arrival date would be unsupported. Accept this INITIAL receiving coverage explicitly, or identify the required outside-profile year for a narrowly verified method extension. No request to reconfirm Jalali as the business calendar. |

Existing infrastructure boundaries remain explicit:256KiB raw/canonical/result,
10000JSON entries, depth32,64KiB/string, reader5s/16active; query pages default50/
max100 within256KiB and complete-item retrievability preflight. These do not promise
unbounded receiving. A real physical arrival exceeding the envelope is a specific
transport incompatibility to report, never a reason to invent multiple arrivals or
silently split commits. No such actual arrival is asserted to have been measured.

W1 remains exact positive whole kg below10^20; dimensions preserve accepted exact
m/mm semantics. W2/W3 preserve the supplied decimal lexeme without fractional
precision reduction, up to the existing string budget; proposed unsigned ASCII
plain-decimal transport grammar never rounds or allocates weights. New text/date
capacities above stay explicitly unapproved. Catalogue identity stays exact-label
I1 semantics. Original23field names/requiredness and60requirement IDs are unchanged.

## Required future PostgreSQL and security verification

During separately authorized implementation: prove fresh/additive migration with
isolated migration/runtime roles, cross-path/historical code races and restricted
helper permissions, unique documents, complete shared multi-PO/unit sources,
source-to-origin/Unit/Lot/Ledger consistency and deferred/savepoint/COMMIT failure.
Prove valid257+unit requests within existing budgets, globally ordered locks,
<=128effect calls, later-chunk/audit failure rolling back ALL prior stock/sources/
claims/progress, current authority during waits, exactly-once replay and original-
identity unknown-COMMIT recovery. Prove full selected-order fields and no sibling
cargo/PII leak. Execute I2-A01–A22 and twelve-capability regressions then, not now.
Verify actual historical consistency and real catalogue bindings; invent no rewrite.

## Handoff and stop

The [updated design](../../12-implementation-planning/I2_IMPLEMENTATION_DESIGN.md)
and [implementation authorization DRAFT](../../12-implementation-planning/I2_IMPLEMENTATION_AUTHORIZATION_DRAFT.md)
retain I2-CAP-01/02 as the only identified open business-facing admission approvals.
All ten SRC-007 business answers stay closed; normal/exceptional workflow design
is not reopened. Unconditional design sign-off awaits those narrow capacity
choices; execution always needs a separate explicit Owner implementation instruction.

No runtime code, SQL migration, test implementation/execution, executable API or
permission, product gate/unlock change, I2 coding, UI, UAT, deployment or push.
No accepted thirteenth capability: the count remains TWELVE. A coherent local
documentation commit is permitted after focused independent review/link/diff checks.

## Recording validation (static only)

Focused independent architecture and security/governance review: PASS; no required
remaining documentation findings. Remove the unsupported count ceiling and keep
the two capacity decisions explicitly OPEN, rather than fabricating acceptance.
Metadata/local links/fragments, exact11field6/5mapping,22future case families,
original60IDs and historical-source/migration preservation checks pass. The final
diff is Markdown-only and whitespace checks pass. No runtime/PostgreSQL tests run.
