---
id: APR-037
title: Formal Owner acceptance of I1 detailed design with mandatory conditions
phase: 12-implementation-planning
status: approved
version: 1.0.0
owners: [project-sponsor]
depends_on: [APR-036, APR-035, APR-034, SRC-004, SRC-005, SRC-006, PLAN-I1-OWNER-CHECKLIST-001]
last_reviewed: 2026-10-21
approval: Actual Owner formally accepts I1-D01 through I1-D14 as detailed design only, subject to all explicit conditions
supersedes: null
---

# Formal Owner I1 design acceptance — NO IMPLEMENTATION AUTHORIZATION

Acceptance date/source:2026-10-21 (Asia/Tehran), actual Owner message “ERP Purchase
& Receiving — Formal Owner Acceptance of I1 Detailed Design.” The Owner formally
accepts I1-D01–I1-D14 in reviewed local documentation commit
`9c0976e0519192358e8a097f7b26fe43f4b1df6e`, subject to this record's conditions.
This is an actual human decision, not an inferred approval or approval of delivered
runtime behavior. Eleven backend capabilities remain accepted; I1 is not implemented.

Remote push is not assumed. Read-only origin-reference verification attempted during
this recording failed because remote transport was unavailable; it supplies no
positive or negative proof of the reviewed commit's remote presence. No push is
performed by the agent. No historical source/requirement/migration is rewritten.

## Reviewed package and consistency check

Before recording acceptance, all ten documents below were inspected with SRC-004,
SRC-005,SRC-006, current decision register,60requirement IDs and relevant accepted
ADRs/APRs. Independent architecture/security/DB inspections found no material
design-content contradiction with the actual Owner instruction. Only lifecycle/
acceptance metadata and handoff obligations need reconciliation; no requirement,
payload/version, field requiredness, normalization, capacity or security scope is
substituted. Any later material contradiction/deviation must be reported, not hidden.

Reviewed content versions at9c0976e (acceptance recording versions preserve that
contract content and distinguish execution status):

| Document | Reviewed version | Acceptance scope |
| --- | --- | --- |
| [Domain](../../12-implementation-planning/I1_PURCHASE_ORDER_DOMAIN_DESIGN.md) | 0.3.0 | Accepted design |
| [API/commands/queries](../../12-implementation-planning/I1_PURCHASE_ORDER_API_DESIGN.md) | 0.3.0 | Accepted Markdown contract design, no executable publication |
| [PostgreSQL/transactions](../../12-implementation-planning/I1_PURCHASE_ORDER_DATABASE_DESIGN.md) | 0.3.0 | Accepted design with actual-environment and real-PG verification conditions |
| [Security](../../12-implementation-planning/I1_PURCHASE_ORDER_SECURITY_DESIGN.md) | 0.3.0 | Accepted permission design, no runtime permission change |
| [Acceptance plan](../../12-implementation-planning/I1_PURCHASE_ORDER_ACCEPTANCE_PLAN.md) | 0.3.0 | Mandatory future test obligations, no executed tests |
| [Decisions/risks](../../12-implementation-planning/I1_PURCHASE_ORDER_DECISIONS.md) | 0.3.0 | All14design decisions accepted as below |
| [R1 reference identity](../../12-implementation-planning/I1_PURCHASE_ORDER_REFERENCE_IDENTITY.md) | 0.1.0 | Accepted deterministic raw/key design |
| [Final review](../../12-implementation-planning/I1_PURCHASE_ORDER_FINAL_REVIEW.md) | 0.2.0 | Reviewed evidence/conditions, not implementation proof |
| [Owner checklist](../../12-implementation-planning/I1_PURCHASE_ORDER_OWNER_ACCEPTANCE_CHECKLIST.md) | 0.1.0 | Formal design acceptance now recorded; execution boxes stay unchecked |
| [Implementation authorization DRAFT](../../12-implementation-planning/I1_PURCHASE_ORDER_IMPLEMENTATION_AUTHORIZATION_DRAFT.md) | 0.1.0 | Handoff reviewed only; remains PROPOSED — NOT AUTHORIZED FOR EXECUTION |

## Fourteen accepted design decisions

ACCEPTED here always means design only. Future code/SQL/behavior must prove every
condition; static review or this approval cannot satisfy an executable obligation.

| Decision | Owner status | Accepted bounded design and condition |
| --- | --- | --- |
| I1-D01 | ACCEPTED | Procurement owns immutable original operational orders/lines; completed-purchase/proforma/manual receiving unchanged. No amendments/cancellations/backfill |
| I1-D02 | ACCEPTED WITH CONDITIONS | Installation=factory; raw reference retained, deterministic generated STORED key via restricted immutable helper; UNIQUE(installation_id,key), key-based owner locks/authorized lookup. Exact R1 semantics and pre-implementation environment verification below |
| I1-D03 | ACCEPTED | Independent stable lineUUID+ordinal; identical/unnumbered lines never merge |
| I1-D04 | ACCEPTED WITH CONDITIONS | Exact-string positive dimensions20integer/18fraction; m/mm/m. W1 positive wholekg<10^20, count positive integer<10^20; exact derived Procurement totals never Kg/receipt/Ledger/Balance. No count-proportional work/memory/identities, float/rounding/conversion |
| I1-D05 | ACCEPTED WITH CONDITIONS | Explicit Jalali YYYY-MM-DD/direct YMD/profile,1206–1498; DB timestamps separate. Unsupported outside-profile date, no clamp/default. Full profile/leap/app-DB/roundtrip verification mandatory; extension separately reviewed |
| I1-D06 | ACCEPTED WITH CONDITIONS | Three shared scoped Procurement catalogues, UUID/immutable exact labels. Visual variants may remain separate. No PO normalizer/fuzzymerge/historyrewrite/delete. Both current personal PROC/WH add/use. No technical enum widening/OTHER default |
| I1-D07 | ACCEPTED WITH CONDITIONS | Independent durable catalogue creation; unused successful option may remain after failed/abandoned order. No automatic deletion/reversal; separate auth/binding/replay/recovery/audit |
| I1-D08 | ACCEPTED | RegisterOperationalPurchaseOrder/AddInboundCatalogueOption v1 and three reviewed query shapes; exact payload/projection/role/error/version design preserved. Documentary routes compatible |
| I1-D09 | ACCEPTED | Existing trusted envelope/full original binding/outcome/replay/atomic audit/unknownCOMMIT recovery. Same-key changed raw conflicts even if R1-equivalent; original identity/key/input required |
| I1-D10 | ACCEPTED WITH CONDITIONS | Additive order/header,line,catalogue tables and deferred completeness guard; exactly declared complete independent lines, no partial commit/later unauthorized append. Real-PG constraints/savepoints/COMMITfailure/rollback/races/ownership proof; no old migration rewrite or weakened guarantee |
| I1-D11 | ACCEPTED WITH CONDITIONS | Reviewed locks/transactions/current authorization/revocation linearization/recovery. Real distinct-person equivalent-reference races, wait revocation, errors/deadlocks/timeouts/replay/uncertainCOMMIT/audit/persistence failures must be demonstrated |
| I1-D12 | ACCEPTED | Stable references for future arrivals/waybills/partial receiving/units/discrepancies/trace/progress. No I2 implementation/design or invented B02–B09 policy; zero stock from order registration |
| I1-D13 | ACCEPTED WITH CONDITIONS | 25workflow+23field+12supplemental IDs; retain I1/I2 distinction. A01–A28 and R1-T01–T12 mandatory future coverage; justified updates recorded/reviewed. Real-PG/security/concurrency/recovery/eleven-capability regressions later, no test-execution claim now |
| I1-D14 | ACCEPTED WITH CONDITIONS | Max128lines; applicable text128Unicode scalars AND512UTF8bytes; request/body and full authorized response each256KiB; catalogue default50/max100. Reviewed reader/time/concurrency bounds retained. No truncation/silent splitting; prove all committed orders fully readable, deterministic capacity failure before business-source persistence |

These numeric/date/text/line/byte/page capacities are accepted initial technical
admission boundaries, not permanent factory physical/operational maxima. No new
factory field or change to the original12I1fields/7mandatory5optional is introduced.

## Exact R1 closure and security boundaries

R1 Option A remains CLOSED/OWNER RESOLVED. From a working copy only: remove maximal
boundary U+0020; map ASCII U+0041–005A to U+0061–007A; map Persian U+06F0–06F9 and
Arabic-Indic U+0660–0669 to ASCII0–9; map U+064A→U+06CC and U+0643→U+06A9.
Preserve raw source and all other scalars/order. Internal spaces/zeros/punctuation/
separators/NBSP/zero-width/unapproved Unicode stay significant. No other equivalence,
locale/Unicode folding or supplier partition. App validation, DB generation/UNIQUE,
owner locks/source validation and lookup must agree exactly. Full raw envelope/owner
intent binding never becomes normalized command equivalence. No key can be forged.

Both individually authenticated organizational ACT-PROC and ACT-WH may create/select/
reuse all3catalogues under current explicit grants. PROC registers/reads POs with
no stock posting; WH reads original specs with no PO mutation. Legacy manual
receiving remains separately governed. No implicit ACT-SEC/customer/unrelated access,
hardcoded employee names, scope leakage, stale grant/replay disclosure or untrusted
actor attribution. Catalogue identity is exact-only and independent of R1.

## Mandatory verification and implementation handoff conditions

1. **BEFORE future I1 implementation:** verify the actual intended/supported PG
   version, UTF8/C semantics, STORED generation, immutable helper behavior/properties,
   permissions and schema ownership/conventions against this design. Repository
   expectation PG18.6 is not evidence of the connected/deployed environment. If
   incompatible, report and reconcile before coding/migration; never silently replace
   the accepted mechanism. This prerequisite is not executed by this documentation task.
2. **BEFORE future implementation acceptance:** prove exact R1/raw roundtrip/app-DB
   parity/authoritative identity and full line integrity against real PG, including
   restricted roles, migration fresh/replay/checksums, races/rollback/deferred failures.
3. Independently verify all293calendar year flags/month/leap boundaries, app/DB parity
   and lossless timezone-free date roundtrip; outside-profile errors are explicit.
4. Prove exact numeric/no-rounding/unit behavior and safe nonstock derived totals;
   no allocation/work proportional to ordered count and zero foreign stock effects.
5. Demonstrate both-role catalogue creation/reuse/separate durability and exact-label
   identity, source history, current authorization/isolation/negative access.
6. Preserve and prove original command binding/replay/audit/recovery under all
   wait/failure/crash/unknownCOMMIT paths, never fresh-key outcome substitution.
7. Implement and execute A01–A28/R1-T01–T12 and relevant regressions; test design is
   not execution. Prove committed orders fully retrievable under exact HTTP budget.
8. Preserve all11accepted capabilities/module ownership; independent engineering/
   security reviews with required findings closed, current evidence/docs/trace and
   explicit reporting of every accepted-design deviation. No best-effort downgrade.
9. Backend acceptance never implies browser UI, factory UAT or production deployment.

The [handoff DRAFT](../../12-implementation-planning/I1_PURCHASE_ORDER_IMPLEMENTATION_AUTHORIZATION_DRAFT.md)
must reference this accepted baseline/conditions and remain ineffective. Only a
separate explicit bounded Owner implementation instruction, followed by applicable
gate/unlock reconciliation, permits execution. Neither is supplied by this approval.

## Exclusions, unresolved I2 and stop

No code, executable migration/API/security/test, command/query activation, Inventory/
IPS, gate/unlock, I2 implementation/detailed design or push. I2 B02unit identity/
legacy coexistence,B03product meaning,B04document/receipt grain,B05changedW1provenance,
B06wrong/excess/unordered acceptance,B07receiving representation,B08sensitive reads,
B09evidence/custody/escalation remain OPEN for their later scope; B10historical links
deferred. No OQ-011/OQ-019 blanket closure. No amendments/cancellation/backfill,
catalogue lifecycle, devices/tickets, QC, monetary Finance, UI/UAT/cutover expansion.

Stop after recording design acceptance, static review/checks and local documentation
commit. Implementation authorization remains NOT RECORDED; product gate/unlock
UNCHANGED; accepted backend capability count ELEVEN.

## Recording validation and independent review

Documentation-only recording checks on2026-10-21 PASS:20changed Markdown files,
181metadata dependency references,1247local links/anchors,60unique requirement IDs,
exact12I1fields/7mandatory5optional matching the unchanged23-field actor register,
14accepted decision rows,28base acceptance scenarios and12R1families. Nine original
source/requirements/coverage documents are unchanged against the reviewed baseline.
Only the design-acceptance checkbox is checked; implementation and gate boxes stay
unchecked. Final diff review confirms no executable or gate/unlock file changed.

| Independent recording review | Result | Evidence boundary |
| --- | --- | --- |
| Architecture/security governance | PASS; no blocking or required findings | Accepted status/conditions, R1 versus catalogue identity, both-role narrow authority/current grants/replay disclosure, all60IDs/12fields/28+12future cases, no self-authorized runtime/gate or capability acceptance; static documentation/source inspection only |
| Database/governance | PASS; no material contradiction or blocker | Accepted generated-key/deferred-integrity/lock/recovery design retained; intended actual PG prerequisite before future code and all real-PG/calendar/parity proof still outstanding; no DB probe/test |

The metadata/index empty-dependency and optional grammar cleanups were resolved.
Git diff --check passes. Final staged scope/diff checks and local offline Graphify
refresh precede the local documentation commit; graph output is ignored/local.
No application/unit/PostgreSQL tests were run for this documentation task. Static
review does not satisfy future implementation, factory UAT or production acceptance.
