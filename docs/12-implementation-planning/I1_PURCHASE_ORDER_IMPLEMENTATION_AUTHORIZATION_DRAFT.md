---
id: PLAN-I1-AUTH-DRAFT-001
title: Proposed future I1 implementation handoff from Owner-accepted design
phase: 12-implementation-planning
status: in_review
version: 0.2.0
owners: [project-sponsor, delivery-lead, chief-solution-architect]
depends_on: [APR-037, APR-036, PLAN-I1-OWNER-CHECKLIST-001, PLAN-I1-REFERENCE-001, PLAN-I1-ACCEPTANCE-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-10-21
approval: null
supersedes: null
---

# PROPOSED — NOT AUTHORIZED FOR EXECUTION

این متن handoff طراحی پذیرفته‌شده برای یک دستور احتمالی آینده است؛ مجوز اجرا یا
unlock نیست. Owner در [APR-037](../00-governance/approved-baselines/APR-037-i1-detailed-design-acceptance.md)
هر چهارده تصمیم I1 را در commit محلی `9c0976e0519192358e8a097f7b26fe43f4b1df6e`
با تمام شروط ثبت‌شده پذیرفته است؛ تأیید دوبارهٔ همان تصمیم‌ها لازم نیست. وضعیت push
تأیید نشده است. فقط دستور مستقل و محدود پیاده‌سازی و ثبت تطبیق gate/unlock طبق
حاکمیت می‌تواند دامنهٔ واقعی آینده را مجاز کند. این سند خودکار فعال نمی‌شود و
هیچ موافقت یا دستور اجرایی از پذیرش طراحی یا سکوت استنتاج نمی‌شود.

## Proposed business outcome and requirement boundary

Deliver only I1 pre-arrival operational orders and shared inbound catalogue backend:
personal org ACT-PROC registers complete original orders/lines without stock;
PROC/WH retrieve original order/specifications by approved-equivalent seller reference
or technical ID; both roles add/read/select Material Type, Quality/Grade and Color.
Exactly12purchasing fields/7mandatory5optional, with original23register unchanged.

Business authority: SRC-004/SRC-005 and approved SRC-006 R1-A–D. The complete
I1-D01–I1-D14 design at the reviewed commit is accepted under APR-037, including
all documented conditions; the [recorded checklist](I1_PURCHASE_ORDER_OWNER_ACCEPTANCE_CHECKLIST.md)
does not request that acceptance again. Use the
[60-ID I1/I2 scope matrix and R1 trace](I1_PURCHASE_ORDER_ACCEPTANCE_PLAN.md); do not
claim all60requirements delivered. R1 approves only PO comparison, never catalogue
label normalization, extra permissions or I2 receiving policy.

## Mandatory prerequisite before any future implementation

After a separate bounded Owner implementation instruction and applicable gate
reconciliation, **before writing future I1 code or an executable migration**, verify
the actual intended/supported PostgreSQL version and environment against the
accepted mechanism: UTF8 encoding, deterministic C equality, STORED generated
columns, the frozen immutable helper's behavior/properties, restricted EXECUTE,
schema ownership and repository conventions. The PG18.6 repository pin is not
proof of a connected/deployed server version. Record actual compatibility evidence;
if incompatible, report and reconcile before coding rather than silently changing
generation, equality, permissions or aggregate integrity. This prerequisite does
not authorize probing any environment now and has not been performed in this task.

The accepted reference transform remains exactly PO-REF-R1-A-v1: boundary U+0020
only; ASCII A–Z case; Persian/Arabic-Indic digits to ASCII; U+064A→U+06CC and
U+0643→U+06A9. Preserve raw reference and every other scalar; never apply it to
catalogue labels. Follow the complete [identity design](I1_PURCHASE_ORDER_REFERENCE_IDENTITY.md),
including future version/collision reconciliation and app/DB parity obligations.

## Proposed implementation surface after actual authorization

| Surface | Bounded future changes |
| --- | --- |
| Procurement domain/owner contracts | Operational immutable PO/header/line and catalogue add/select services/types under existing module, original raw bindings, stable server lineUUIDs; separate from completed-purchase/proforma |
| Command/query/transport/composition | RegisterOperationalPurchaseOrder v1 PROC; AddInboundCatalogueOption v1 PROC/WH; GetOperationalPurchaseOrderByReference, GetOperationalPurchaseOrder, ListInboundCatalogueOptions; closed scoped policies and distinct bounded routes as designed |
| PostgreSQL adapters/migration | Three new Procurement tables, typed scoped FKs/indexes/UNIQUE, frozen R1 pure helper+STORED comparison key/profile, raw text, exact numeric/Jalali checks and deferred line-completeness guard; next additive migration number verified then, currently expected0017after0016 |
| Runtime/test role setup | Only required SELECT/INSERT on new sources and EXECUTE on frozen pure R1 helper/integrity invocation as needed; no DDL/UPDATE/DELETE or foreign owner expansion |
| Boundary tooling and tests | Extend existing SQL/import ownership checks and isolated DB role setup only as new owner sources require; add meaningful unit/API/security/real-PG tests within current root scripts |
| Documentation/governance | Final implemented behavior/limits/test evidence, source trace, independent review closure, actual authorization/gate reconciliation and local delivery commit; no fabricated Owner acceptance |

The proposed repository scope is explicit below; the future Owner instruction
must authorize the actual bounded changes. These paths are not a live allowlist:

| Repository area | Proposed future responsibility and limit |
| --- | --- |
| apps/backend/src/modules/procurement/ | New I1 owner services/types and add/register/read contracts; preserve existing documentary and receipt semantics |
| apps/backend/src/infrastructure/postgresql/ | New Procurement adapters using the opaque shared transaction, accepted scoped source tables and integrity rules; no foreign-module SQL writes |
| apps/backend/src/transport/ and apps/backend/src/composition-root.ts | Distinct closed I1 routes/admission and exact current-grant policies; retain old routes and their4096byte limits |
| database/migrations/ | One next additive I1 migration only after number/environment verification; no historical migration edits or backfill |
| tools/db/reset-test.mjs and tools/build/check-boundaries.mjs | Necessary isolated restricted-role grants and owner-source boundary coverage only; no production reset or wider owner privileges |
| apps/backend/tests/unit/, apps/backend/tests/integration/ and apps/backend/tests/support/ | Meaningful I1 domain/API/security/real-PG fixtures and regression evidence under current Windows root scripts |
| docs/ | Actual authorization/acceptance evidence and implementation documentation/traceability after the respective work is authorized and performed |

Reuse shared-kernel envelope/canonicalization/recovery and existing Identity
authority; no replacement kernel/auth mechanism, material enum change or unrelated
module rewrite is in this proposed scope. No new module/framework/dependency is
needed; frozen Node/npm/PG/package pins and root scripts remain. A necessary
accepted-design or scope deviation must be reported and reviewed before proceeding;
never silently broaden the future authorization or weaken the accepted guarantee.

## Security, transactions and compatibility obligations

Use individually authenticated current org grants, trusted Identity-issued contexts,
scope isolation and revocation. WH cannot register/edit original orders; PROC gains
no receiving/IPS authority. Neither SEC/customer/unrelated roles gain new reads or
catalogue writes. Preserve existing documentary APIs/read permissions and no-PO/
no-ticket manual receiving. No personal-name checks or mandatory third-party
catalogue approval. Material Type business labels do not widen technical enums or
default to OTHER; B06 unordered-goods acceptance remains I2 policy.
Both PROC and WH may read/add/select all three exact-label catalogues and reuse an
accepted option. PROC registers/reads operational orders; both permitted roles
receive only the accepted original-business projection. Catalogue addition is not
PO amendment, technical-class administration, exceptional-goods acceptance or stock
authority. Recheck current grants after waits and before replay/query disclosure;
never expose binding, keys, creator/foreign scope or private source values.

Reuse one opaque PostgreSQL transaction and full original envelope binding/outcome/
atomic audit; stable owner locks use R1 comparison key while raw payload remains
bound. Header+all lines commit together. Catalogue creation is separately durable.
Same-key changed raw conflicts even if R1-equivalent. Prove generated-key authority,
DB/app parity, immutable source history, normalized duplicate races, current grants
after waits, safe query projection, known23505mapping and technical failure behavior.
Unknown COMMIT always uses original principal/scope/key/target/full raw payload,
with existing recovery fence. No second inventory writer, child command fabrication
or replacement idempotency/authorization mechanism.

Preserve frozen line count/independent UUIDs/ordinals, typed scoped FKs and deferred
completeness semantics. A technical deferred COMMIT failure is not a mapped durable
business rejection; uncertain outcomes use original-key primary recovery. Prove
named immediate23505 mappings only after savepoint recovery and authorized winner
verification; unknown errors remain technical, without false accepted reuse.

Apply the accepted initial technical capacities: 1–128lines; each applicable raw
text1–128Unicode scalars AND<=512UTF8bytes; exact positive dimension20integer/
18fraction strings in m/mm/m; positive whole W1/count<10^20; explicit Jalali
1206–1498 profile. Preserve decoded raw lexemes; no float, rounding, conversion,
calendar default or timezone shift. Derived40/43digit Procurement totals never
become Inventory Kg or effects, and ordered count never drives allocation/work.

Request and full authorized HTTP response each have a262144byte budget, with the
reviewed reader/time/concurrency and catalogue default50/max100 limits. Before any
order or line source insertion, freeze the server line IDs/positions in memory,
serialize the full authorized HTTP data wrapper including referenced labels, IDs,
escaping and unit/calendar metadata, and preflight that exact byte count. Excess
is a deterministic durable capacity rejection with the reviewed safe message tag;
no source persists, and there is no truncation, silent splitting or field omission. Every committed
order must be fully retrievable. These are accepted initial admission boundaries,
not asserted permanent factory operating maxima.

## Required future verification and Definition of Done

After actual implementation authorization, implement and execute the mandatory
A01–A28 and R1-T01–R1-T12 evidence at appropriate layers, linked to all60original
and supplemental IDs with their I1/I2 scope retained:
pure unit numeric/Jalali/normalizer parsing; actual HTTP admission/projections;
restricted-role real PostgreSQL constraints/generation/privileges/transaction
rollback/concurrency/savepoints/audit/recovery/crash and negative authorization.
No mocks for the database behavior being proved. Independently verify all293year
profile flags and app/DB parity; prove all48R1mappings and unapproved variants.
Check all12fields, exact numeric limits, no ordered-count-driven allocation, full
response preflight and catalogue identity separation. No relevant failure or skip
may be represented as accepted behavior.
Freeze the calendar source receipt/checksum and verify month/leap boundaries and
lossless date roundtrip independently. Outside-profile dates get the accepted
explicit error, never clamping/default. A later authoritative conflict or profile
extension requires reconciliation; no quiet historical reinterpretation. Verify
fresh/replayed migration checksums, generated-key/helper permissions/ownership,
app/DB numeric/text/date/key parity, aggregate closure and immutable sources against
actual PostgreSQL before implementation acceptance.

Use Windows-only verified isolated disposable PostgreSQL compatible with the
accepted mechanism and supported pinned target, after the prerequisite environment
check. Current root scripts:
preflight, format:check, lint, boundaries, typecheck, test:unit, test:integration
(verify currently aggregates these). Safe migration fresh/replay/checksum and role tests use
verified test databases/roles, never a production reset. Do not execute any now.
Use distinct authenticated people and deterministic lock barriers for equivalent-PO
and exact-catalogue races, rollback winners, lock waits/revocation/expiry,
deadlocks/timeouts, failed persistence/audit/outcome, process crash and genuinely
unknown COMMIT. No sleep-only proof or mocked replacement of database invariants.

Run applicable regression suites for all eleven accepted capabilities: envelope,
Identity, IPS, legacy Goods Receipt/origin, Sales, reservations, dispatch/shipping,
production/mass balance, genealogy, purchase/proforma and issued-invoice evidence.
Assert authoritative foreign tables have zero new effects from both successful
and rejected I1commands; absence of a port counter alone is insufficient.
Independent engineering/architecture, security/API, database and acceptance-test
reviews are mandatory; resolve required findings and re-review corrections.
Accepted design conditions remain unexecuted obligations in this documentation
task. Report each result, unavailable proof, failure and design deviation accurately;
design acceptance alone never satisfies implementation DoD, UI, factory UAT or
production acceptance.

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

Owner design acceptance: **RECORDED — APR-037; I1-D01–I1-D14 WITH ALL CONDITIONS**.
Owner bounded implementation authorization: **NOT RECORDED**.
Product gate/unlock activation by this document: **NONE**.
