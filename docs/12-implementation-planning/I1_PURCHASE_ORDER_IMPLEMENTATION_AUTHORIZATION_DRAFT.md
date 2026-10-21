---
id: PLAN-I1-AUTH-DRAFT-001
title: Proposed bounded future I1 implementation authorization draft
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [project-sponsor, delivery-lead, chief-solution-architect]
depends_on: [APR-036, PLAN-I1-OWNER-CHECKLIST-001, PLAN-I1-REFERENCE-001, PLAN-I1-ACCEPTANCE-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-10-21
approval: null
supersedes: null
---

# PROPOSED — NOT AUTHORIZED FOR EXECUTION

این متن پیش‌نویسِ دستور آینده است؛ مجوز اجرا، پذیرش طراحی یا unlock نیست. فقط پس
از پذیرش صریح طراحی توسط Owner، دستور مستقل و محدود پیاده‌سازی و ثبت تطبیق gate/
unlock طبق حاکمیت، می‌توان آن دامنهٔ واقعاً تأییدشده را اجرا کرد. این سند خودکار
فعال نمی‌شود؛ هیچ موافقت انسانی، امضا یا دستوری از سکوت استنتاج نمی‌شود.

## Proposed business outcome and requirement boundary

Deliver only I1 pre-arrival operational orders and shared inbound catalogue backend:
personal org ACT-PROC registers complete original orders/lines without stock;
PROC/WH retrieve original order/specifications by approved-equivalent seller reference
or technical ID; both roles add/read/select Material Type, Quality/Grade and Color.
Exactly12purchasing fields/7mandatory5optional, with original23register unchanged.

Business authority: SRC-004/SRC-005 and approved SRC-006 R1-A–D. Use the
[60-ID I1/I2 scope matrix and R1 trace](I1_PURCHASE_ORDER_ACCEPTANCE_PLAN.md); do not
claim all60requirements delivered. R1 approves only PO comparison, never catalogue
label normalization, extra permissions or I2 receiving policy.

## Proposed implementation surface after actual authorization

| Surface | Bounded future changes |
| --- | --- |
| Procurement domain/owner contracts | Operational immutable PO/header/line and catalogue add/select services/types under existing module, original raw bindings, stable server lineUUIDs; separate from completed-purchase/proforma |
| Command/query/transport/composition | RegisterOperationalPurchaseOrder v1 PROC; AddInboundCatalogueOption v1 PROC/WH; GetOperationalPurchaseOrderByReference, GetOperationalPurchaseOrder, ListInboundCatalogueOptions; closed scoped policies and distinct bounded routes as designed |
| PostgreSQL adapters/migration | Three new Procurement tables, typed scoped FKs/indexes/UNIQUE, frozen R1 pure helper+STORED comparison key/profile, raw text, exact numeric/Jalali checks and deferred line-completeness guard; next additive migration number verified then, currently expected0017after0016 |
| Runtime/test role setup | Only required SELECT/INSERT on new sources and EXECUTE on frozen pure R1 helper/integrity invocation as needed; no DDL/UPDATE/DELETE or foreign owner expansion |
| Boundary tooling and tests | Extend existing SQL/import ownership checks and isolated DB role setup only as new owner sources require; add meaningful unit/API/security/real-PG tests within current root scripts |
| Documentation/governance | Final implemented behavior/limits/test evidence, source trace, independent review closure, actual authorization/gate reconciliation and local delivery commit; no fabricated Owner acceptance |

Likely affected existing areas: apps/backend/src/modules/procurement,
infrastructure/postgresql, transport and composition-root; corresponding backend
tests; database/migrations additive file; tools/build/check-boundaries.mjs and
tools/db/reset-test.mjs for necessary owner/role coverage. This is not a live allowlist
or permission to edit those paths now. No new module/framework/dependency is needed;
frozen Node/npm/PG/package pins and root scripts remain. A necessary scope change
must be reported rather than silently widening authorization.

## Security, transactions and compatibility obligations

Use individually authenticated current org grants, trusted Identity-issued contexts,
scope isolation and revocation. WH cannot register/edit original orders; PROC gains
no receiving/IPS authority. Neither SEC/customer/unrelated roles gain new reads or
catalogue writes. Preserve existing documentary APIs/read permissions and no-PO/
no-ticket manual receiving. No personal-name checks or mandatory third-party
catalogue approval. Material Type business labels do not widen technical enums or
default to OTHER; B06 unordered-goods acceptance remains I2 policy.

Reuse one opaque PostgreSQL transaction and full original envelope binding/outcome/
atomic audit; stable owner locks use R1 comparison key while raw payload remains
bound. Header+all lines commit together. Catalogue creation is separately durable.
Same-key changed raw conflicts even if R1-equivalent. Prove generated-key authority,
DB/app parity, immutable source history, normalized duplicate races, current grants
after waits, safe query projection, known23505mapping and technical failure behavior.
Unknown COMMIT always uses original principal/scope/key/target/full raw payload,
with existing recovery fence. No second inventory writer, child command fabrication
or replacement idempotency/authorization mechanism.

## Required future verification and Definition of Done

Implement the planned A01–A28 and R1-T01–R1-T12 evidence at appropriate layers:
pure unit numeric/Jalali/normalizer parsing; actual HTTP admission/projections;
restricted-role real PostgreSQL constraints/generation/privileges/transaction
rollback/concurrency/savepoints/audit/recovery/crash and negative authorization.
No mocks for the database behavior being proved. Independently verify all293year
profile flags and app/DB parity; prove all48R1mappings and unapproved variants.
Check all12fields, exact numeric limits, no ordered-count-driven allocation, full
response preflight and catalogue identity separation. No relevant failure or skip
may be represented as accepted behavior.

Use Windows-only isolated disposable PostgreSQL18.6 and current root scripts:
preflight, format:check, lint, boundaries, typecheck, test:unit, test:integration
(verify aggregates these). Safe migration fresh/replay/checksum and role tests use
verified test databases/roles, never a production reset. Do not execute any now.

Run applicable regression suites for all eleven accepted capabilities: envelope,
Identity, IPS, legacy Goods Receipt/origin, Sales, reservations, dispatch/shipping,
production/mass balance, genealogy, purchase/proforma and issued-invoice evidence.
Assert authoritative foreign tables have zero new effects from both successful
and rejected I1commands; absence of a port counter alone is insufficient.
Independent engineering/architecture, security/API, database and acceptance-test
reviews are mandatory; resolve required findings and re-review corrections.

## Exclusions and final stop

Exclude I2 arrivals/waybills, actual verification/discrepancies, physical Internal
System Codes, receiving progress/views, W2/W3, receipt confirmation, mapping/new
Inventory classes and stock. Also exclude PO amendments/cancellation, catalogue
rename/delete/merge/deactivate, supplier master, automatic legacy links/backfill,
device/ticket integration, QC, UI, monetary Finance, corrections/restoration and
production deployment/UAT. No existing migration/history or IPS behavior rewrite.

Future completion report must distinguish implemented behavior from proposed/I2
work, report exact tests/failures/reviews/limits/local SHA, update canonical docs
and trace, and stop for Owner formal capability acceptance/push. No agent pushes.
I1 becomes a twelfth capability only after separately delivered, verified and
formally accepted implementation; this draft changes no capability count.

Owner design acceptance: **NOT RECORDED**.
Owner bounded implementation authorization: **NOT RECORDED**.
Product gate/unlock activation by this document: **NONE**.
