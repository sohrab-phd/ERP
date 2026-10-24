---
id: APR-042
title: Final I2 design acceptance and immediate bounded implementation authority
phase: 12-implementation-planning
status: approved
version: 1.0.0
owners: [project-sponsor]
depends_on: [APR-041, APR-040, APR-039, SRC-007, PLAN-I2-DESIGN-001, PLAN-I2-AUTH-DRAFT-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-10-24
approval: Actual Owner FINAL OWNER APPROVAL AND IMMEDIATE I2 IMPLEMENTATION AUTHORIZATION instruction
supersedes: null
---

# I2 final design acceptance and implementation authority

Actual Owner instruction2026-10-24, reviewed local251f471a135e88084645c3a573f240a6f5770406:
I2-CAP-01 ACCEPTED (new receiving text128Unicode scalars AND512UTF8bytes),
I2-CAP-02 ACCEPTED (validated Jalali arrival1206–1498; outside-profile explicit
unsupported error, never clamp/substitute). These close APR-041's two conditions.
The focused I2 design and all its documented conditions are formally accepted.
This instruction separately authorizes immediate runtime/migration/test implementation;
do not stop after governance or reopen confirmed decisions. Twelve accepted backend
capabilities remain; I2 implementation needs separate later Owner backend acceptance.

## Exact bounded implementation scope

Implement ConfirmPurchaseReceiving v1 and GetReceivingArrival/GetPurchaseOrderReceiving:
shared physical arrivals/documents across POs, multiple arrivals per PO, explicit
individually coded physical units, preserved per-unit Product Number, immutable
ordered and separately accepted actual attributes/discrepancies, explicit current
WH acceptance of changed W1/mismatched/excess/unordered goods. All11receiving fields
retain6mandatory/5optional; W2/W3 exact shared-consignment kg, W1 separate perunit.
PROC gets every relevant committed field including driver, never unrelated cargo.
Preserve personal current grants, isolation, no SEC/customer escalation.

Additive0018 only, six reviewed owner tables, cross-path/historical exact-code
protection, owner Inventory intake/origins and source-backed genealogy. Existing
I1/doc evidence/manual receipt remain compatible; no history rewrites or OTHER
fallback. IPS alone writes stock; all units/chunks/source/outcome/audit one supplied
transaction and one COMMIT.128effects is per invocation, no256arrival ceiling.
Existing request/response/resource budgets and retrievability preflight remain.

Permitted paths: receiving contracts/service/owner adapter/HTTP; minimal Inventory
receiveMany/origin and Genealogy extensions, composition/host wiring; legacy receipt
code protection;0018 and migration inventory/guards; isolated database fixtures,
new receiving unit/HTTP/real-PG/security/concurrency/recovery tests and relevant
regressions/boundary checks; canonical delivery documentation. Reuse existing
modules/dependencies. No unrelated refactor or shared-kernel security weakening.
Reconcile canonical gate/local ignored unlock only to these real authorized paths.

## Required proof and stop

Execute I2-A01–A22 including5ordered/3received at2000kg =>3Units/6000kg/2outstanding;
real PostgreSQL uniqueness/races/deferred integrity/rollback/audit/revocation/replay/
unknown-COMMIT and multiIPS>128/valid257+withinbudgets. Build/static/unit/integration,
independent actual implementation engineering/database/security review and required
finding closure precede local delivery commit. Report any genuine unsupported type
or actual legacy contradiction precisely; ordinary engineering is not a policy gate.
No unexecuted test is PASS. Preserve all twelve accepted capabilities.

No browser UI, QC, financial effects, device integration, automatic order closure,
historical backfill, correction/return, production deployment or next increment.
No remote push. Stop after working implementation, actual checks/reviews and local
commit for separate Owner backend acceptance; do not self-declare capability13.
