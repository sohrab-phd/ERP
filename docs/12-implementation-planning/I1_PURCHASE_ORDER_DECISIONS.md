---
id: PLAN-I1-DECISIONS-001
title: I1 detailed design decisions risks reviews and Owner acceptance checklist
phase: 12-implementation-planning
status: accepted
version: 1.1.0
owners: [chief-solution-architect, delivery-lead, security-architect]
depends_on: [APR-038, APR-037, APR-036, SRC-006, PLAN-I1-REFERENCE-001, APR-035, APR-034, PLAN-I1-DOMAIN-001, PLAN-I1-API-001, PLAN-I1-DATABASE-001, PLAN-I1-SECURITY-001, PLAN-I1-ACCEPTANCE-001]
last_reviewed: 2026-10-21
approval: APR-037 accepted design; APR-038 bounded implementation authority
supersedes: null
---

# I1 decisions and risk log — OWNER-ACCEPTED DESIGN / I1 EXECUTION UNDER APR-038

Current implementation authority: [APR-038 actual Owner instruction](../00-governance/approved-baselines/APR-038-i1-implementation-authorization.md).
See [delivered code and actual validation](I1_IMPLEMENTATION_STATUS.md) and
[60-ID executable trace](I1_IMPLEMENTATION_TRACE.md). The accepted design content
below remains normative; its earlier design-only/no-execution statements describe
the APR-037 historical stage and are superseded only for bounded I1 execution.
No I2 authority or Owner capability acceptance is inferred.


[APR-037](../00-governance/approved-baselines/APR-037-i1-detailed-design-acceptance.md)
records the actual Owner's formal acceptance of I1-D01–I1-D14 at reviewed local
commit `9c0976e0519192358e8a097f7b26fe43f4b1df6e`, with all stated conditions.
Remote push is unverified. The [domain model and source/companion map](I1_PURCHASE_ORDER_DOMAIN_DESIGN.md)
and [Owner checklist](I1_PURCHASE_ORDER_OWNER_ACCEPTANCE_CHECKLIST.md) describe the
accepted design; no executable contract, permission, migration, test or product
gate is published. [The finite identity specification](I1_PURCHASE_ORDER_REFERENCE_IDENTITY.md)
preserves SRC-006 R1 Option A. Catalogue identity, capacities and mechanisms below
are accepted design boundaries, while their future implementation proof remains
mandatory. Implementation authorization is NOT RECORDED; the handoff stays a DRAFT.

## Evidence precedence and design boundary

FACT: [SRC-004](../00-governance/team-answers/FACTORY_PURCHASE_RECEIVING_2026-10-20.md),
[SRC-005](../00-governance/team-answers/OWNER_I1_POLICY_CLARIFICATION_2026-10-20.md),
[APR-032](../00-governance/approved-baselines/APR-032-inbound-gap-analysis.md),
[APR-033](../00-governance/approved-baselines/APR-033-i1-policy-clarification.md)
and the [12 supplemental policies](../02-domain-business-architecture/PURCHASE_RECEIVING_I1_POLICY_AMENDMENT.md).
No reopening of factory-wide PO identity, m/mm/m, Jalali registration date,
per-unit W1/count, shared-list requirements or both-role add/select authority.

ARCH: Modular Monolith/one owner, current single-factory Identity mapping,
exact stock/sole IPS, immutable source history, full bound durable outcomes and
atomic audit. Actual code, SQL/test definitions and canonical architecture were
compared, including ADR-0011/0014/0015/0016, module/dependency/invariant catalogues,
current scope and pinned development workflow. Conceptual diagrams were not treated
as implemented functionality. Historical gates do not unlock I1.

ACCEPTED DESIGN: the bounded schema/API/validation/equality/horizon/lock choices
below, subject to APR-037's conditions. No runtime behavior is delivered or verified
by design acceptance. Before any future implementation, verify the actual intended
PG environment, UTF8/C semantics, STORED generation, helper privileges and schema
ownership; report/reconcile incompatibility rather than substituting a mechanism.
OPEN LATER: I2 unit/document namespaces, receipt cardinality, field19, changed-W1
source, B06 exceptions, consignment precision/evidence, sensitive reads and technical
material mapping. No I2 detailed contract, DDL, operation or stock admission is
finalized here. All eleven accepted capabilities remain separate regression duties.

## Complete accepted technical decision checklist

The actual Owner accepted every row through APR-037. I1-D01/D03/D08/D09/D12 are
ACCEPTED; the other nine are ACCEPTED WITH CONDITIONS. These are design statuses,
not implemented capability acceptance or authority to begin code/SQL/test changes.
All future verification and compatibility duties remain binding.

| ID | Accepted design | Alternatives considered / trade-off | Owner status and continuing condition |
| --- | --- | --- | --- |
| I1-D01 | Procurement owns separate immutable operational header/lines and shared inbound references; add/register/read only | Rename documentary purchase or build a new master-data module: would conflate history or add unnecessary ownership/infrastructure | ACCEPTED. Preserve completed purchase/proforma/manual receipt; no amendments/cancellation/PO-history conversion |
| I1-D02 | R1 Option A OWNER RESOLVED; preserved raw reference + versioned DB-generated STORED comparison key/profile, factory UNIQUE/locks/lookup on that key | Only boundaryU0020/ASCIIcase/three digit sets/Yeh-Kaf; no other equivalence, supplier partition or catalogue reuse | ACCEPTED WITH CONDITIONS. Verify intended PG environment before implementation; prove generation/parity/privileges/version safety later. Full raw binding preserved; no reopened R1 decision |
| I1-D03 | One order freezes server line UUIDs + original array ordinal/count; identical/missing-item-number lines remain independent | Attribute/item-number keys merge valid lines; client-required line business number adds an unwanted field | ACCEPTED. IDs/ordinal are technical, never physical Internal System Code or another mandatory factory field |
| I1-D04 | Exact lexeme strings; dimension20integer/18fraction positive, positive20digit whole W1/count; distinct nonstock BigInt derived totals | W1<10^20 aligns actual per-unit Kg/0005/0006; dimension/count limits are accepted initial technical boundaries, not physical evidence. Product40digits/sum43digits need not fit Kg | ACCEPTED WITH CONDITIONS. Prove exact grammar/capacity/positivity without measurement tolerance; never send derived totals to IPS/receipt/Balance/Ledger or iterate ordered count. Future I2 owner capacity checks remain necessary |
| I1-D05 | Explicit Jalali YYYY-MM-DD + stored Y/M/D, UT-JALALI-1206-1498-v1 frozen Calendar Center research profile | Range follows source coverage, not factory limits; future entries are calculated profile data, not proof of enacted future annual calendars. Borkowski/Intl are not demonstrably superior verified ERP approaches here | ACCEPTED WITH CONDITIONS. Finite range accepted; unsupported dates get tagged rejection, never clamp/default. Freeze/independently verify293flags and app/DB parity; reconcile later authoritative conflicts; extension requires separate review |
| I1-D06 | Three catalogue kinds, immutable exact scoped labels/UUIDs and typed same-scope FKs; exact-only duplicate prevention | Exact strings preserve terms but can leave visual/synonym duplicates; no normalization/aliasing is approved or silently performed | ACCEPTED WITH CONDITIONS. Exact-only semantics accepted, including distinct visual variants; both roles all3kinds, no third-party gate or lifecycle/mapping authority; prove history/isolation/concurrency |
| I1-D07 | Separate durable AddInboundCatalogueOption then RegisterOperationalPurchaseOrder; duplicate option rejected DUP then exact authorized selection query | Combined inline creation complicates role/atomic intent; accepted get-or-create needs new explicit service semantics and cannot be implemented by rejection-only constraint mapper | ACCEPTED WITH CONDITIONS. A successful option survives a later failed order; no partial PO/lines or automatic cleanup. Prove each operation's own authority/binding/audit/original-key recovery; no third-party approval |
| I1-D08 | Two active v1 commands and three query semantics on distinct internal purchasing routes; WH/PROC minimum original-business projection | Widening old evidence routes leaks documents; generic command/admin endpoint or unbounded order listing unnecessary | ACCEPTED. Paths/payloads/closed schemas/projections/error mapping are accepted Markdown design, not executable publication; inactive-contract replay remains existing kernel behavior |
| I1-D09 | Reuse full existing envelope binding/outcomes/audit/recovery and owner target bindings; new-key same-target DUP vs changed CONFLICT, new-target used PO reference CONFLICT | Treat business reference as key, accept new-key replay, rewrite binding or invent child command bypasses established guarantees | ACCEPTED. Principal/full raw intent bound, role/request ID not bound; current policy always checked; no outcome protocol/shared-kernel rewrite or normalized spelling substituted in recovery |
| I1-D10 | Three additive tables with typed scoped FKs, exact immediate unique guards, SELECT/INSERT grants, frozenN/boundeduniquepositions plus deferred header completeness guard | Insert-only grants/app checks alone allow append/incomplete aggregate; dynamic state/cyclic FK machinery adds complexity | ACCEPTED WITH CONDITIONS. One small SELECT-only integrity guard, not a stored command/posting kernel. Real-PG completeness/append/savepoint/rollback/race proof required; deferred COMMIT failure stays technical/possibly uncertain, not mapped business rejection |
| I1-D11 | Existing key→Identity→sorted actual owner-hash resource order; fresh READ COMMITTED; bounded queries in write-mode transaction compatible with Identity row locks | Sorting only IDs or sequential mixed locking can invert order; readonly RR with FOR UPDATE fails; nested pooled snapshot can deadlock | ACCEPTED WITH CONDITIONS. No stock/IPS locks or extra public command calls; distinct-user races, revocation after waits, failures/timeouts/deadlocks/replay/unknown-COMMIT/audit proof remain required |
| I1-D12 | Stable owner order/line/catalogue identities and immutable ordered snapshot, with no I1 technical-class mapping/default or receiving state | Map every new type to OTHER or prebuild I2 schema would invent admission policy; mutable order to add receiving loses source evidence | ACCEPTED. Future supported mapping and authority before I2 stock; no B02–B09 answers or final I2 design; no foreign writer |
| I1-D13 | 60-ID scope trace, A01–A28 plus R1-T01–T12 future cases; real-PG generation/races/rollback/crash/regression | Static review is not runtime proof; R1 vectors cover all48mappings and significant variants | ACCEPTED WITH CONDITIONS. No test code/results now; Windows/PG evidence and independent review before capability acceptance; justify and review any later test-plan update |
| I1-D14 | Revised new text128Unicode scalars/512UTF8bytes with frozen non-mutating predicate;1–128lines;256KiBrequest/fullHTTPprojection; old4KiB unchanged; catalogue50/100 | Equal scalar budget avoids128byte Persian disadvantage. Line cap bounds work independently of ordered count/IPS; legal per-field maxima can exceed aggregate projection capacity | ACCEPTED WITH CONDITIONS. Accepted initial capacities; prove exact full-response preflight with labels/wrapper/escaping before business-source insertion, every committed order fully readable, no truncation/silent split. No universal performance evidence claimed |

For calendar alternatives, primary references inspected were the University of
Tehran [common/leap table](https://calendar.ut.ac.ir/documents/2139738/7092644/Kabise%2BShamsi%2B1206-1498.pdf/fbc45bf4-df46-c298-381c-2bff2c57f0e0?t=1719740029743),
the [official1404calendar](https://calendar.ut.ac.ir/documents/2139738/7092644/Calendar-1404.pdf/4321b7e0-d043-78ca-49f5-fbfc911e7901?t=1729620775906),
[Borkowski's paper](https://www.astro.uni.torun.pl/~kb/Papers/EMP/PersianC-EMP.htm)
and the [Jalaali maintainers' calendar note](https://github.com/jalaali/jalaali-js).
The latter documents algorithm/Intl divergence outside its common period; neither
that library nor a 2820/fixed-four-year cycle is adopted as a universal calendar.
No source library, calendar data fixture or dependency is installed/copied now.
[PostgreSQL18 collation](https://www.postgresql.org/docs/18/collation.html) and
[constraint documentation](https://www.postgresql.org/docs/18/ddl-constraints.html)
support the relational/equality mechanisms, not a factory semantic decision.

## Risks, assumptions and gates

| Risk / state | Impact and mitigation / owner gate |
| --- | --- |
| PO reference equivalence — OWNER RESOLVED; enforcement DESIGN ACCEPTED | SRC-006 fixes only R1-A–D. APR-037 accepts controlled generated key/parity/raw binding/version safety with mandatory environment and implementation verification. Catalogue labels retain independent accepted exact-only semantics; no broader normalizer or silent merge |
| Numeric/text/count/horizon limits — ACCEPTED INITIAL TECHNICAL BOUNDARIES | A legitimate factory value might fall outside an accepted initial boundary; no such input conflict is established. Report any necessary deviation for separate review rather than silently changing limits. Never claim these were investigated factory tolerances |
| Calendar receipt and complete year vector — FUTURE IMPLEMENTATION OBLIGATION | Source was inspected and known examples cross-checked, not all293flags transcribed/executed. Freeze receipt/hash and independently verify profile/app/DB behavior before implementation acceptance; mismatches block that acceptance, never silently choose an oracle |
| Deferred completeness guard — ACCEPTED DESIGN / FUTURE PROOF | Small DB integrity function accepted alongside application-owned transactions; fixed search path/invoker rights/no writes, restricted privileges and direct malformed-aggregate tests remain mandatory. No new stored business posting kernel |
| Duplicate catalogue rejection UX — DESIGN TRADE-OFF | Concurrent operator gets DUP then uses exact lookup; no other employee/approval. Future UI may automate this read/select step, but backend design cannot claim it is implemented or retry an uncertain/rejected key as fresh success |
| Frozen original catalogue/order sources — BOUNDED SCOPE | No corrections/edit/cancel/rename workflow is delivered. Mistaken existing values remain immutable; later lifecycle policy is required. No silent operational remedy or order deletion invented |
| Existing shared DB runtime role — ARCHITECTURAL LIMIT | New-table insert/select grants do not alone prove no foreign writes because other modules use the same role. Enforce import/SQL ownership plus actual foreign-table before/after assertions; no second writer or OS containment |
| I2 compatibility — OPEN LATER | Stable scoped order/line/catalogue keys permit additive references but do not solve physical identity, grain, provenance, B06, progress or mapping. Designing I1 does not make I2 ready |
| Large body/result and Identity locks — TECHNICAL DESIGN | Dedicated parser and projection preflight, bounded line/list counts and correct current-check transaction mode; test real byte/lock/pool boundaries before acceptance |

R1 Option A is now explicitly resolved by SRC-006. No remaining I1 business-policy
blocker is identified in this bounded design. APR-037 accepts all14design choices
and initial numeric/text/line/calendar/catalogue boundaries with their conditions;
implementation remains unauthorized and unverified. I2 residuals remain separate.
Remote push is not assumed.

## Original Step3 review and validation record (historical16115d7)

Three independent reviewers inspected the complete design package against actual
repository contracts, SQL, authorization, envelope behavior and test definitions:

| Review | Result | Evidence and limits |
| --- | --- | --- |
| Engineering/architecture | PASS after required corrections | Ownership, factory identity, exact quantities, catalogue separation, aggregate integrity, transaction/recovery and I2 extension boundaries; static inspection only |
| Security | PASS after required corrections | Both-role catalogue authority, trusted current grants, narrow projections, scope isolation, replay admission/disclosure and lock/revocation linearization; no executable security test |
| Acceptance/calendar | PASS after required corrections | All60requirement mappings, 28proposed cases, exact12I1fields and official calendar examples; no test execution or complete293year-vector validation |

Required findings closed: (1) registered-but-inactive contracts can replay an
existing outcome under current policy, whereas unregistered versions fail admission;
(2) A20 now distinguishes unregistered-version admission denial from changed
admitted intent binding conflict; (3) A21 counts one original decision/outcome,
while allowing legitimate later replay/conflict attempt audits. A05 also clarifies
pre-key structural rejection versus admitted durable scalar/requiredness rejection.
No required design-review finding remains open. Future implementation obligations
and I2 policy residuals are not represented as completed acceptance evidence.
Final independent governance/navigation review of all18changed files also passes:
APR-034 records design authority only, historical stop statements are identified,
remote push/technical approval are not fabricated, and no product gate is changed.

Documentation checks pass for 18changed Markdown files: 801local links/anchors,
20new metadata dependency references, 60unique trace rows (25workflow +23field
+12supplemental), 28proposed acceptance cases, 14proposed technical decisions,
and exactly12I1fields with7mandatory/5optional. All four original Step1documents,
SRC-004/SRC-005, original48coverage rows and S01–S12policy rows remain unchanged.
The diff is documentation-only and git diff --check passes. Final staged-diff
checks and local offline graph refresh precede the documentation commit.
No runtime/application/PostgreSQL test was run for Step3, and static review does
not establish implementation, factory UAT or production acceptance.

## Final review dispositions and mandatory stop

The [complete disposition table](I1_PURCHASE_ORDER_FINAL_REVIEW.md#decision-dispositions)
and [Persian Owner checklist](I1_PURCHASE_ORDER_OWNER_ACCEPTANCE_CHECKLIST.md) record
APR-037's acceptance of all14choices and continuing conditions. Status: OWNER-
ACCEPTED DESIGN; NOT AUTHORIZED FOR IMPLEMENTATION. The [implementation scope draft](I1_PURCHASE_ORDER_IMPLEMENTATION_AUTHORIZATION_DRAFT.md)
remains PROPOSED — NOT AUTHORIZED FOR EXECUTION. A separate explicit bounded
implementation instruction, applicable gate reconciliation and required intended-
environment verification must precede future implementation. No current verification
execution is implied by this documentation record.
No I2 design/readiness, SQL/code/tests/permissions/enum/IPS/gate change, UI/deployment
or push. Eleven backend capabilities remain; I1 is not implemented or accepted as
a delivered backend capability.
