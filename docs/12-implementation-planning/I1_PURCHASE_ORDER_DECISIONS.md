---
id: PLAN-I1-DECISIONS-001
title: I1 detailed design decisions risks reviews and Owner acceptance checklist
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [chief-solution-architect, delivery-lead, security-architect]
depends_on: [APR-034, PLAN-I1-DOMAIN-001, PLAN-I1-API-001, PLAN-I1-DATABASE-001, PLAN-I1-SECURITY-001, PLAN-I1-ACCEPTANCE-001]
last_reviewed: 2026-10-20
approval: null
supersedes: null
---

# I1 decisions and risk log — DRAFT / PROPOSED / NOT AUTHORIZED FOR IMPLEMENTATION

[APR-034](../00-governance/approved-baselines/APR-034-i1-detailed-design.md)
authorizes this documentation design, not technical acceptance or implementation.
The six-file package starts with the [domain model and source/companion map](I1_PURCHASE_ORDER_DOMAIN_DESIGN.md).
All proposed technical decisions below require Owner acceptance; no new APPROVED
ADR, executable contract, permission, migration, test or product gate is published.
The latest referenced local baseline is 38cb855; push is unverified, not assumed.

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
| I1-D02 | Trusted installation=factory and authority=installation mapping; UNIQUE(installation, exact C-collated orderReference), source text preserved | Supplier/person/date partition violates factory-wide identity; case/Unicode/space normalization invents equivalence. Exact comparison can leave formatting duplicates | Owner accepts exact equality and current topology; broader equivalence or new authority topology requires explicit reconciliation |
| I1-D03 | One order freezes server line UUIDs + original array ordinal/count; identical/missing-item-number lines remain independent | Attribute/item-number keys merge valid lines; client-required line business number adds an unwanted field | IDs/ordinal are technical, never physical Internal System Code or another mandatory factory field |
| I1-D04 | Dedicated exact numeric lexeme strings; dimension20integer/18fraction digits, positive dimensions/count; W1 positive20digit whole kg, count20digit integer | Binary floats or bigint lose allowed values; declared numeric scale can round; unbounded decimals lack a resource contract | Numeric magnitude/scale/positivity/count choices are technical proposals, not confirmed factory measurement limits; reject rather than round |
| I1-D05 | Explicit Jalali YYYY-MM-DD + stored Y/M/D and UT-JALALI-1206-1498-v1 frozen official leap profile; no Gregorian storage/default | Gregorian DATE/JS Date can change semantics; unconstrained Intl has runtime-version/range issues; Borkowski-based algorithm is a viable alternative but not selected for this finite civil profile | Owner accepts supported1206–1498 horizon/ASCII contract; implementation must freeze/independently verify293official year flags and app/DB parity; no new library or runtime calendar network call |
| I1-D06 | Three catalogue kinds, immutable exact scoped labels and UUIDs; typed same-scope FK selections and historical immutable joins | Free text loses shared identity; mutable labels rewrite history; normalization/aliasing beyond exact strings would need business equivalence | Both roles all3 kinds, no admin gate; no edit/delete/merge/deactivate or automatic seed terms; exact comparison risk explicit |
| I1-D07 | Separate durable AddInboundCatalogueOption then RegisterOperationalPurchaseOrder; duplicate option rejected DUP then exact authorized selection query | Combined inline creation complicates role/atomic intent; accepted get-or-create needs new explicit service semantics and cannot be implemented by rejection-only constraint mapper | A successful option survives a later failed order; no partial PO/lines. Both operations recover their own original uncertain keys; no third-party approval |
| I1-D08 | Two active v1 commands and three query semantics on distinct internal purchasing routes; WH/PROC minimum original-business projection | Widening old evidence routes leaks documents; generic command/admin endpoint or unbounded order listing unnecessary | Paths/payloads/closed schemas/projections/error mapping are proposed specs only; inactive-contract replay remains existing kernel behavior |
| I1-D09 | Reuse full existing envelope binding/outcomes/audit/recovery and owner target bindings; new-key same-target DUP vs changed CONFLICT, new-target used PO reference CONFLICT | Treat business reference as key, accept new-key replay, rewrite binding or invent child command bypasses established guarantees | Principal/full intent bound, role/request ID not bound; current policy always checked; no outcome protocol or shared-kernel rewrite |
| I1-D10 | Three additive tables with typed scoped FKs, exact immediate unique guards, SELECT/INSERT grants, frozenN/boundeduniquepositions plus deferred header completeness guard | Insert-only grants/app checks alone allow append/incomplete aggregate; dynamic state/cyclic FK machinery adds complexity | One small SELECT-only integrity trigger function is proposed, not a stored command/posting kernel. Explicit design acceptance required; deferred COMMIT guard failure is technical/possibly uncertain, not mapped business rejection |
| I1-D11 | Existing key→Identity→sorted actual owner-hash resource order; fresh READ COMMITTED; bounded queries in write-mode transaction compatible with Identity row locks | Sorting only IDs or sequential mixed locking can invert order; readonly RR with FOR UPDATE fails; nested pooled snapshot can deadlock | No stock/IPS locks or extra public command calls; distinct-user race tests and correct revocation linearization required |
| I1-D12 | Stable owner order/line/catalogue identities and immutable ordered snapshot, with no I1 technical-class mapping/default or receiving state | Map every new type to OTHER or prebuild I2 schema would invent admission policy; mutable order to add receiving loses source evidence | Future supported mapping and authority before I2 stock; no B02–B09 answers or final I2 design; no foreign writer |
| I1-D13 | 60-ID scope trace and A01–A28 concrete future acceptance cases; real PG races/rollback/crash and all relevant regression suites | Static parser tests/mock counters cannot prove transactions, no new coverage-percentage/test-count target | No test code/results now; runtime implementation acceptance requires actual Windows/PG proof and independent review |
| I1-D14 | Text128UTF8bytes, 1–128 order lines, new bounded256KiB order transport reader with full-projection preflight; old4KiB limits unchanged; catalogue pages default50/max100 | Silently raising global Identity parser or truncating reads changes accepted behavior; unbounded input/read is unsafe | Limits are resource proposals, not source business formats/quantities; Owner acceptance required; all legal accepted orders must remain fully readable |

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
| Exact-only reference/label equality — EXPLICIT PROPOSAL | Source-format variants may remain distinct. Preserve terms and warn in design review; no silent normalization/merge. Owner acceptance of I1-D02/D06 precedes implementation; actual requested broader equivalence becomes a separate narrow policy question |
| Numeric/text/count/horizon limits — EXPLICIT PROPOSAL | A legitimate factory value might fall outside a proposed boundary. No such input conflict is established; Owner can revise limits before accepting design. Never claim these were investigated factory tolerances |
| Calendar receipt and complete year vector — FUTURE IMPLEMENTATION OBLIGATION | Source was inspected and known examples cross-checked, not all293flags transcribed/executed. Freeze receipt/hash and independently verify profile/app/DB behavior before implementation acceptance; mismatches block that acceptance, never silently choose an oracle |
| Deferred completeness guard — DESIGN ACCEPTANCE ITEM | Small DB integrity function needed despite application-owned transactions. Owner accepts mechanism; it must have fixed search path/invoker rights/no writes, restricted privileges and direct malformed-aggregate tests. No new stored business posting kernel |
| Duplicate catalogue rejection UX — DESIGN TRADE-OFF | Concurrent operator gets DUP then uses exact lookup; no other employee/approval. Future UI may automate this read/select step, but backend design cannot claim it is implemented or retry an uncertain/rejected key as fresh success |
| Frozen original catalogue/order sources — BOUNDED SCOPE | No corrections/edit/cancel/rename workflow is delivered. Mistaken existing values remain immutable; later lifecycle policy is required. No silent operational remedy or order deletion invented |
| Existing shared DB runtime role — ARCHITECTURAL LIMIT | New-table insert/select grants do not alone prove no foreign writes because other modules use the same role. Enforce import/SQL ownership plus actual foreign-table before/after assertions; no second writer or OS containment |
| I2 compatibility — OPEN LATER | Stable scoped order/line/catalogue keys permit additive references but do not solve physical identity, grain, provenance, B06, progress or mapping. Designing I1 does not make I2 ready |
| Large body/result and Identity locks — TECHNICAL DESIGN | Dedicated parser and projection preflight, bounded line/list counts and correct current-check transaction mode; test real byte/lock/pool boundaries before acceptance |

No demonstrated missing I1 business policy prevents this bounded design proposal.
Remaining decisions for this step are acceptance/revision of its technical choices,
not a request to reopen the confirmed factory facts. Any actual excluded business
input or equivalence conflict must be surfaced before implementation approval.
I2 residuals stay open at their dependent stage. No assumption of remote push.

## Independent review and validation record

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

## Readiness and mandatory stop

The package is **READY FOR OWNER DESIGN REVIEW**, with all selected technical
decisions still PROPOSED. If accepted, the next gate is a separate bounded I1
implementation authorization and applicable product gate/unlock reconciliation.
This design task supplies neither. No I2 detailed design, product code, executable
SQL/contracts/permissions/tests, enum/IPS change, UI/deployment or push. The project
remains at eleven accepted backend capabilities; I1 is not implemented or accepted
as a delivered capability by Step 3.
