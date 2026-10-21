---
id: APR-038
title: Explicit Owner authorization to implement bounded I1 backend
phase: 12-implementation-planning
status: approved
version: 1.0.0
owners: [project-sponsor]
depends_on: [APR-037, PLAN-I1-DOMAIN-001, PLAN-I1-API-001, PLAN-I1-DATABASE-001, PLAN-I1-SECURITY-001, PLAN-I1-ACCEPTANCE-001, PLAN-I1-REFERENCE-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-10-21
approval: Actual Owner message ERP FINAL OWNER AUTHORIZATION TO IMPLEMENT I1
supersedes: null
---

# I1 implementation authorization

Source: actual Owner instruction on2026-10-21, explicitly “START IMPLEMENTATION
NOW”, from local baseline b47d0eb1d0a36032b311c628818846501cc4248d. No remote push
is assumed or permitted. APR-037 accepts all fourteen design decisions/conditions;
this subsequent instruction supplies bounded implementation authority, not delivered
capability acceptance. Eleven backend capabilities remain Owner accepted.

Implement the accepted Procurement-owned immutable operational PO and independent
lines, RegisterOperationalPurchaseOrder v1, AddInboundCatalogueOption v1 and the
three accepted PO-reference/PO-ID/catalogue queries. Both current personal org
ACT-PROC/ACT-WH may add/read/reuse all three exact-label catalogues; PROC alone
registers orders, WH cannot modify them. Preserve all reviewed payloads/projections,
raw R1 binding, generated-key uniqueness, exact quantities, Jalali profile,
capacity/readability, current grants, transaction/recovery/audit and old APIs.

## Bounded repository and environment scope

New I1 files in apps/backend/src/modules/procurement, its public index exports,
new PostgreSQL inbound owner adapter, new inbound HTTP adapter, composition-root
and host dispatch wiring only. One additive0017 migration after inventory verification,
including accepted pure helper/STORED key and deferred completeness guard. Necessary
migration inventory/SQL guard, owner-boundary tooling, isolated test-role setup,
unit/integration/security/recovery fixtures and root test-runner entries are in scope.
No historical migration, shared envelope/Identity replacement, dependency upgrade,
Inventory enum/IPS or unrelated module rewrite. Documentation and applicable gate/
ignored local unlock are reconciled strictly to this actual instruction.

Before version-dependent implementation, verify actual supported PostgreSQL and
accepted helper/generation/permissions/schema assumptions. Existing system versions
are not silently substituted for the pins. Isolated workspace-local checksum-verified
approved Windows runtimes and a separate disposable PostgreSQL cluster may be used
without changing the existing service or any production database. Credentials and
generated artifacts remain ignored; restricted runtime and migration roles remain
separate. Genuine incompatibility is reported before substitution, ordinary engineering
issues are solved within this accepted design.

## Required execution and stop

Execute A01–A28 and R1-T01–T12 at appropriate unit/API/real-PG layers, preserving
all60IDs and the I1/I2 distinction. Prove all293calendar flags, exact app/DB key/date/
number parity, duplicate races, deferred completeness, rollback/savepoints/audit,
current grants/revocation, original-key unknown-COMMIT recovery and zero foreign
effects. Run frozen build/static/boundary and relevant eleven-capability regressions.
Independent engineering/security/database/test reviews and required finding closure
precede a coherent local implementation commit and Persian evidence report. No
unexecuted proof is PASS; essential environment blockers must be reported accurately.

No I2 arrivals/waybills/receiving/unit codes/discrepancies/progress/W2/W3/stock/
technical mapping/exception acceptance, PO lifecycle/backfill, catalogue lifecycle,
browser UI, QC, device integration, monetary Finance, UAT or production deployment.
No second stock writer, remote push or automatic capability acceptance. Stop after
I1 delivery for Owner review; I1 becomes an accepted twelfth capability only through
a later explicit Owner acceptance of verified implementation.
