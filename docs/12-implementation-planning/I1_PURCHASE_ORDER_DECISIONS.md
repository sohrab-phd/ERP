---
id: PLAN-I1-DECISIONS-001
title: I1 detailed design decisions risks reviews and Owner acceptance checklist
phase: 12-implementation-planning
status: in_review
version: 0.3.0
owners: [chief-solution-architect, delivery-lead, security-architect]
depends_on: [APR-036, SRC-006, PLAN-I1-REFERENCE-001, APR-035, APR-034, PLAN-I1-DOMAIN-001, PLAN-I1-API-001, PLAN-I1-DATABASE-001, PLAN-I1-SECURITY-001, PLAN-I1-ACCEPTANCE-001]
last_reviewed: 2026-10-21
approval: null
supersedes: null
---

# I1 decisions and risk log — DRAFT / PROPOSED / NOT AUTHORIZED FOR IMPLEMENTATION

[APR-034](../00-governance/approved-baselines/APR-034-i1-detailed-design.md)
authorizes this documentation design, not technical acceptance or implementation.
The six-file package starts with the [domain model and source/companion map](I1_PURCHASE_ORDER_DOMAIN_DESIGN.md).
All proposed technical decisions below require Owner acceptance; no new APPROVED
ADR, executable contract, permission, migration, test or product gate is published.
Current preparation baseline is local a84e20e12c7cd0b301e329d0ed97f300029b9aba,
push unverified. SRC-006/APR-036 now resolve R1 Option A business equivalence only.
[The finite identity specification](I1_PURCHASE_ORDER_REFERENCE_IDENTITY.md) supersedes
the exact-only PO branch; [the Owner checklist](I1_PURCHASE_ORDER_OWNER_ACCEPTANCE_CHECKLIST.md)
collects all14technical choices/conditions, none accepted yet. Catalogue exactness,
other technical limits and implementation authority are not approved by R1.

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

PROPOSED: every precise schema/API/validation/equality/horizon/lock choice below.
OPEN LATER: I2 unit/document namespaces, receipt cardinality, field19, changed-W1
source, B06 exceptions, consignment precision/evidence, sensitive reads and technical
material mapping. No I2 detailed contract, DDL, operation or stock admission is
finalized here. All eleven accepted capabilities remain separate regression duties.

## Complete proposed technical decision checklist

Each row is **PROPOSED — OWNER ACCEPTANCE REQUIRED**. A recommendation is selected
for this coherent design package, not promoted to approved policy. Owner review may
accept or revise the whole set before a separate implementation authorization.

| ID | Selected PROPOSED recommendation | Alternatives considered / trade-off | Acceptance boundary |
| --- | --- | --- | --- |
| I1-D01 | Procurement owns separate immutable operational header/lines and shared inbound references; add/register/read only | Rename documentary purchase or build a new master-data module: would conflate history or add unnecessary ownership/infrastructure | Preserve completed purchase/proforma/manual receipt; no amendments/cancellation/PO-history conversion |
| I1-D02 | R1 Option A OWNER RESOLVED; preserved raw reference + versioned DB-generated STORED comparison key/profile, factory UNIQUE/locks/lookup on that key | Only boundaryU0020/ASCIIcase/three digit sets/Yeh-Kaf; no other equivalence, supplier partition or catalogue reuse | Technical generation/parity/privileges/version transition still PROPOSED; full raw binding preserved, Owner design acceptance required, not a reopened business decision |
| I1-D03 | One order freezes server line UUIDs + original array ordinal/count; identical/missing-item-number lines remain independent | Attribute/item-number keys merge valid lines; client-required line business number adds an unwanted field | IDs/ordinal are technical, never physical Internal System Code or another mandatory factory field |
| I1-D04 | Exact lexeme strings; dimension20integer/18fraction positive, positive20digit whole W1/count; distinct nonstock BigInt derived totals | W1<10^20 aligns actual per-unit Kg/0005/0006; dimension/count limits are technical proposals, not physical evidence. Product40digits/sum43digits need not fit Kg | Never send derived totals to IPS/receipt/Balance/Ledger or iterate ordered count; future I2 owner capacity checks remain necessary. Owner accepts technical grammar/capacity/positivity without measurement tolerance |
| I1-D05 | Explicit Jalali YYYY-MM-DD + stored Y/M/D, UT-JALALI-1206-1498-v1 frozen Calendar Center research profile | Range follows source coverage, not factory limits; future entries are calculated profile data, not proof of enacted future annual calendars. Borkowski/Intl are not demonstrably superior verified ERP approaches here | Owner accepts finite range or requests reviewed broader support; unsupported dates get tagged rejection, never clamp/default. Freeze/independently verify293flags and app/DB parity; reconcile any later authoritative conflict |
| I1-D06 | Three catalogue kinds, immutable exact scoped labels/UUIDs and typed same-scope FKs; exact-only duplicate prevention | Exact strings preserve terms but can leave visual/synonym duplicates; no normalization/aliasing is approved or silently performed | Owner accepts exact-only initial catalogue semantics or identifies variants requiring equivalence reconciliation; both roles all3kinds, no third-party gate or lifecycle/mapping authority |
| I1-D07 | Separate durable AddInboundCatalogueOption then RegisterOperationalPurchaseOrder; duplicate option rejected DUP then exact authorized selection query | Combined inline creation complicates role/atomic intent; accepted get-or-create needs new explicit service semantics and cannot be implemented by rejection-only constraint mapper | A successful option survives a later failed order; no partial PO/lines. Both operations recover their own original uncertain keys; no third-party approval |
| I1-D08 | Two active v1 commands and three query semantics on distinct internal purchasing routes; WH/PROC minimum original-business projection | Widening old evidence routes leaks documents; generic command/admin endpoint or unbounded order listing unnecessary | Paths/payloads/closed schemas/projections/error mapping are proposed specs only; inactive-contract replay remains existing kernel behavior |
| I1-D09 | Reuse full existing envelope binding/outcomes/audit/recovery and owner target bindings; new-key same-target DUP vs changed CONFLICT, new-target used PO reference CONFLICT | Treat business reference as key, accept new-key replay, rewrite binding or invent child command bypasses established guarantees | Principal/full intent bound, role/request ID not bound; current policy always checked; no outcome protocol or shared-kernel rewrite |
| I1-D10 | Three additive tables with typed scoped FKs, exact immediate unique guards, SELECT/INSERT grants, frozenN/boundeduniquepositions plus deferred header completeness guard | Insert-only grants/app checks alone allow append/incomplete aggregate; dynamic state/cyclic FK machinery adds complexity | One small SELECT-only integrity trigger function is proposed, not a stored command/posting kernel. Explicit design acceptance required; deferred COMMIT guard failure is technical/possibly uncertain, not mapped business rejection |
| I1-D11 | Existing key→Identity→sorted actual owner-hash resource order; fresh READ COMMITTED; bounded queries in write-mode transaction compatible with Identity row locks | Sorting only IDs or sequential mixed locking can invert order; readonly RR with FOR UPDATE fails; nested pooled snapshot can deadlock | No stock/IPS locks or extra public command calls; distinct-user race tests and correct revocation linearization required |
| I1-D12 | Stable owner order/line/catalogue identities and immutable ordered snapshot, with no I1 technical-class mapping/default or receiving state | Map every new type to OTHER or prebuild I2 schema would invent admission policy; mutable order to add receiving loses source evidence | Future supported mapping and authority before I2 stock; no B02–B09 answers or final I2 design; no foreign writer |
| I1-D13 | 60-ID scope trace, A01–A28 plus R1-T01–T12 future cases; real-PG generation/races/rollback/crash/regression | Static review is not runtime proof; R1 vectors cover all48mappings and significant variants | No test code/results now; Windows/PG evidence and independent review before capability acceptance |
| I1-D14 | Revised new text128Unicode scalars/512UTF8bytes with frozen non-mutating predicate;1–128lines;256KiBrequest/fullHTTPprojection; old4KiB unchanged; catalogue50/100 | Equal scalar budget avoids128byte Persian disadvantage. Line cap bounds work independently of ordered count/IPS; legal per-field maxima can exceed aggregate projection capacity | Owner accepts these business-facing capacities; semantic projection preflight includes referenced labels/wrapper/escaping before insertion. No truncation or universal performance evidence claimed |

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
| PO reference equivalence — OWNER RESOLVED; technical enforcement PROPOSED | SRC-006 fixes only R1-A–D. Controlled generated key/parity/raw binding/version safety still need technical acceptance. Catalogue labels retain independent exact-only proposal; no broader normalizer or silent merge |
| Numeric/text/count/horizon limits — EXPLICIT PROPOSAL | A legitimate factory value might fall outside a proposed boundary. No such input conflict is established; Owner can revise limits before accepting design. Never claim these were investigated factory tolerances |
| Calendar receipt and complete year vector — FUTURE IMPLEMENTATION OBLIGATION | Source was inspected and known examples cross-checked, not all293flags transcribed/executed. Freeze receipt/hash and independently verify profile/app/DB behavior before implementation acceptance; mismatches block that acceptance, never silently choose an oracle |
| Deferred completeness guard — DESIGN ACCEPTANCE ITEM | Small DB integrity function needed despite application-owned transactions. Owner accepts mechanism; it must have fixed search path/invoker rights/no writes, restricted privileges and direct malformed-aggregate tests. No new stored business posting kernel |
| Duplicate catalogue rejection UX — DESIGN TRADE-OFF | Concurrent operator gets DUP then uses exact lookup; no other employee/approval. Future UI may automate this read/select step, but backend design cannot claim it is implemented or retry an uncertain/rejected key as fresh success |
| Frozen original catalogue/order sources — BOUNDED SCOPE | No corrections/edit/cancel/rename workflow is delivered. Mistaken existing values remain immutable; later lifecycle policy is required. No silent operational remedy or order deletion invented |
| Existing shared DB runtime role — ARCHITECTURAL LIMIT | New-table insert/select grants do not alone prove no foreign writes because other modules use the same role. Enforce import/SQL ownership plus actual foreign-table before/after assertions; no second writer or OS containment |
| I2 compatibility — OPEN LATER | Stable scoped order/line/catalogue keys permit additive references but do not solve physical identity, grain, provenance, B06, progress or mapping. Designing I1 does not make I2 ready |
| Large body/result and Identity locks — TECHNICAL DESIGN | Dedicated parser and projection preflight, bounded line/list counts and correct current-check transaction mode; test real byte/lock/pool boundaries before acceptance |

R1 Option A is now explicitly resolved by SRC-006. No remaining I1 business-policy
blocker is identified in this bounded design; all technical implementations and
business-facing numeric/text/line/calendar/catalogue capacities still require Owner
acceptance. I2 residuals remain separate. Remote push is not assumed.

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
and [Persian Owner checklist](I1_PURCHASE_ORDER_OWNER_ACCEPTANCE_CHECKLIST.md) assess
all14choices after R1 reconciliation. Status: READY FOR FORMAL OWNER DESIGN REVIEW
AND ACCEPTANCE, with no design acceptance recorded. The [implementation scope draft](I1_PURCHASE_ORDER_IMPLEMENTATION_AUTHORIZATION_DRAFT.md)
is PROPOSED — NOT AUTHORIZED FOR EXECUTION. Separate explicit implementation
instruction and applicable gate reconciliation must precede any runtime work.
No I2 design/readiness, SQL/code/tests/permissions/enum/IPS/gate change, UI/deployment
or push. Eleven backend capabilities remain; I1 is not implemented or accepted.
