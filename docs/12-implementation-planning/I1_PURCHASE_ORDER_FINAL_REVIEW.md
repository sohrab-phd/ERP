---
id: PLAN-I1-FINAL-REVIEW-001
title: I1 focused final design review and conditional reconciliation
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [chief-solution-architect, data-architect, security-architect]
depends_on: [APR-035, APR-034, SRC-004, SRC-005, DOM-INBOUND-POLICY-001, PLAN-I1-DOMAIN-001, PLAN-I1-API-001, PLAN-I1-DATABASE-001, PLAN-I1-SECURITY-001, PLAN-I1-ACCEPTANCE-001, PLAN-I1-DECISIONS-001]
last_reviewed: 2026-10-21
approval: null
supersedes: null
---

# Focused final I1 review — DRAFT / PROPOSED / NOT AUTHORIZED FOR IMPLEMENTATION

The actual Owner requests verification/corrections of design commit
`16115d7655fb2b635165aec03b84760082194b45`, not formal design acceptance.
[APR-035](../00-governance/approved-baselines/APR-035-i1-final-design-review.md)
records that documentation-only authority. Remote push is unverified and none is
performed. All fourteen decisions remain PROPOSED. Eleven accepted backend
capabilities remain; no runtime, SQL migration, test, permission or product gate
changes are authorized. Stop after reviewed documentation and local commit.

Execution plan: read all six designs and source requirements; compare actual
Procurement/Identity/Inventory/envelope/PG behavior; independently review architecture,
security and DB integrity; correct all affected proposals/tests consistently;
validate unchanged facts/coverage/metadata/links/diff; commit docs and stop.

## Evidence and preserved facts

Read the six complete specifications linked from the [domain design](I1_PURCHASE_ORDER_DOMAIN_DESIGN.md),
accepted [Step1baseline](../02-domain-business-architecture/PURCHASE_RECEIVING_REQUIREMENTS_BASELINE.md)
and [23fields](../02-domain-business-architecture/PURCHASE_RECEIVING_FIELD_REGISTER.md),
Step2 [gap analysis](PURCHASE_RECEIVING_TECHNICAL_GAP_ANALYSIS.md) and
[architecture impact](PURCHASE_RECEIVING_ARCHITECTURE_IMPACT.md), SRC-004/SRC-005
and S01–S12. Their factory facts, field names/actors/requiredness are unchanged.
Relevant ADR-0011/0014/0015/0016, APR-032/033/034 and owner/dependency policies remain
binding. A new review disposition is neither an approved ADR nor an Owner decision.

Actual code re-inspected: [composition](../../apps/backend/src/composition-root.ts),
[Identity](../../apps/backend/src/modules/identity/authorization.ts),
[Identity store](../../apps/backend/src/infrastructure/postgresql/identity-store.ts),
[PurchaseService](../../apps/backend/src/modules/procurement/purchase-service.ts),
[purchase store](../../apps/backend/src/infrastructure/postgresql/purchase-store.ts),
[Kg](../../apps/backend/src/modules/inventory/quantity.ts),
[0005](../../database/migrations/0005_inventory_posting.sql),
[0006](../../database/migrations/0006_goods_receipt.sql),
[0012](../../database/migrations/0012_production_sources.sql),
[binding](../../packages/shared-kernel/src/envelope/binding.ts),
[executeCommand](../../packages/shared-kernel/src/envelope/execute.ts),
[transaction adapter](../../apps/backend/src/infrastructure/postgresql/transaction.ts),
transport/canonical JSON and existing test definitions in the acceptance plan.
This is static source review, not fresh execution of any product/PG test.

## Decision dispositions

Dispositions recommend what the Owner may accept; none records acceptance.
The selected technical contents are in the [decision checklist](I1_PURCHASE_ORDER_DECISIONS.md).

| Decision | Review disposition | Result / condition |
| --- | --- | --- |
| I1-D01 | RECOMMEND ACCEPTANCE AS PROPOSED | Separate Procurement-owned immutable operational facts; old documentary/receipt paths unchanged |
| I1-D02 | OWNER BUSINESS DECISION REQUIRED | Current factory-to-installation mapping is valid; exact-text comparison cannot settle variant identity. R1 below blocks unconditional identity acceptance |
| I1-D03 | RECOMMEND ACCEPTANCE AS PROPOSED | Stable line UUID+ordinal/count preserves repeated/unnumbered lines |
| I1-D04 | RECOMMEND ACCEPTANCE WITH DOCUMENTED CONDITIONS | Corrected nonstock derived-total boundary; accept technical grammar/positive dimension/count and numeric capacities below |
| I1-D05 | RECOMMEND ACCEPTANCE WITH DOCUMENTED CONDITIONS | Accept finite1206–1498 profile, unsupported-date behavior and future complete293year proof; no enacted-future-calendar claim |
| I1-D06 | RECOMMEND ACCEPTANCE WITH DOCUMENTED CONDITIONS | Exact-only catalogue duplicates preserve terms but leave variants; Owner explicitly accepts this bounded semantics or supplies equivalence cases |
| I1-D07 | RECOMMEND ACCEPTANCE WITH DOCUMENTED CONDITIONS | Separate durable creation remains reusable/possibly unused after later failure; no automatic cleanup or third-party gate |
| I1-D08 | RECOMMEND ACCEPTANCE AS PROPOSED | Two commands/three queries sufficient; corrected validation/projection details apply, no new command/module |
| I1-D09 | RECOMMEND ACCEPTANCE AS PROPOSED | Existing full binding, current replay authority, outcome/audit and original-key recovery retained |
| I1-D10 | RECOMMEND ACCEPTANCE WITH DOCUMENTED CONDITIONS | Sound normalized frozenN closure; accept one SELECT-only deferred header integrity guard and prove real-PG failure/rollback cases |
| I1-D11 | RECOMMEND ACCEPTANCE WITH DOCUMENTED CONDITIONS | Actual signed owner-hash order, current Identity linearization, distinct-person race/timeout proof; no new stock locks |
| I1-D12 | RECOMMEND ACCEPTANCE AS PROPOSED | Stable I1 references only; mapping, per-unit stock admission and all unresolved I2 policies stay separate |
| I1-D13 | RECOMMEND ACCEPTANCE WITH DOCUMENTED CONDITIONS | Revised A01–A28 cover identity gate, exact capacities, full response budget and deferred events; tests remain future obligations |
| I1-D14 | RECOMMEND ACCEPTANCE WITH DOCUMENTED CONDITIONS | Revised128scalar/512byte text; independent128line/256KiB/page budgets; Owner accepts business-facing ceilings, performance still unproved |

No unresolved technical defect requires a new module/command or I2 design.
Corrections are complete as proposals; R1 and the stated acceptance conditions
prevent claiming unconditional implementation readiness.

## R1 — factory scope resolved, identifier equivalence still open

ADR-0014 configures one single-site authority as the installation UUID, and actual
composition passes config.installationId for both Identity boundaries. Organization
authority is an authorization scope, not a new physical factory identifier. Within
this current topology installation-wide UNIQUE covers the entire factory. Supplier,
role, person and command keys must never partition PO identity. Multiple authorities
or deployments for one real factory would need explicit future topology reconciliation;
the current design does not promise distributed uniqueness across cloned installations.

Source preservation and comparison are independent. Proposed C-collated exact
UNIQUE and identical owner lock/lookup comparison prevent same-byte duplicates,
including concurrent different-key/target/person attempts; they do not prove that
`PO-12` versus ` PO-12`, case variants, `12` versus `۱۲`, `ی` versus `ي`, `ک`
versus `ك`, or composed/decomposed Unicode represent different business orders.
No approved rule decides which variants may be ignored. Exact lookup cannot return
two equal strings, but can miss or select a separate variant of one real order.

**Owner business question:** in seller PO references, are those variant forms
distinct identifiers, or can any denote the same order? Recommended safe initial
choice is exact identity only if that is operationally acceptable and explicitly
confirmed. Otherwise identify the meaningful equivalent cases; technical design
will retain the raw source and specify a separate comparison key consistently for
UNIQUE/locks/lookup. Do not ask the factory to choose an algorithm or silently trim,
normalize, substitute letters/digits, merge histories or introduce supplier keys.
This does not reopen confirmed factory-wide uniqueness. It resolves how to enforce it.

Queries still authorize before existence checks, scope all reads, return the same
foreign/absent not-found and disclose only original order specifications. No fuzzy
cross-scope disambiguation, creator/error leakage or expansion of documentary reads.
Replay and unknown-COMMIT recovery retain original command identity regardless of
any later comparison policy; business-number lookup is never outcome recovery.

## Final proposed numeric representation and capacity

| Value | Proposed representation and bound | Evidence / practical consequence |
| --- | --- | --- |
| Width m / thickness mm / optional length m | Exact lexeme text: integer part0or1–20digits without leading zeros, optional dot+1–18digits, positive and<10^20, <=39ASCIIcharacters | Bounded lossless representation, not proven factory dimension range/precision; Owner accepts. No unit conversion, rounding or tolerance |
| W1 kg | Positive ASCII integer string1..10^20−1 | Fits existing Kg/receipt per-unit numeric capacity. This alone does not approve W1 provenance/stock admission |
| Ordered physical-unit count | Positive ASCII integer string1..10^20−1 | Existing descriptive-count capacity is a technical precedent only; positivity and maximum remain proposed PO limits |
| Derived line/order totals | Separate Procurement BigInt type; line product<=40digits, sum of128lines<=43digits; not a public I1 field | Never Kg, Ledger/Balance/effect or receipt measuredKg. No count-proportional enumeration/allocation. Larger combined mass is not automatically invalid |

Actual Kg is BigInt scaled by10^18 with scaled magnitude<10^38. Actual PostgreSQL
stock uses unconstrained numeric plus magnitude<10^20 and scale<=18 CHECKs, not
unlimited domain capacity or declared NUMERIC(38,18). Receipt0006 narrows to whole
kg. Decimal text avoids driver formatting/coercion and declared-scale rounding;
grammar and guarded exact numeric checks reject unsupported input first. `1.2`
and `1.200` retain distinct source/binding strings while their magnitudes agree.
Reject signs, leading zeros, comma/slash separators, exponent, Persian numeric
digits, NaN/Infinity, whitespace and numeric JSON; never normalize them secretly.
Only bounded operands reach BigInt; JSON output stays strings. Future I2 validates
each actual Unit/effect and group arithmetic through Inventory owners, never posts
the entire order product. No arbitrary smaller physical operating limit is invented.

## Calendar recommendation and accept/revise choice

Retain explicit Jalali ASCII YYYY-MM-DD and direct Y/M/D plus profile storage,
separate from DB timestamptz. Profile1206–1498 follows the published range of the
[University of Tehran Calendar Center research table](https://calendar.ut.ac.ir/documents/2139738/7092644/Kabise%2BShamsi%2B1206-1498.pdf/fbc45bf4-df46-c298-381c-2bff2c57f0e0?t=1719740029743),
not an Owner-supplied earliest/latest order date. The source states calculations/
research results; future years are profile predictions, not already enacted annual
civil calendars. Its star/double-star marks identify leap years; the
[annual1404calendar](https://calendar.ut.ac.ir/documents/2139738/7092644/Calendar-1404.pdf/4321b7e0-d043-78ca-49f5-fbfc911e7901?t=1729620775906)
supports the current1403-12-30 boundary. Only source/known-boundary inspection is
claimed now; all293flags/app/DB parity must be independently verified before use.

This covers current registration and many historical dates, but actual earliest
factory records are unknown. Outside-range otherwise meaningful dates receive
GUARD_INVARIANT with fixed message tag I1_DATE_OUTSIDE_PROFILE and supported range;
they are unsupported, not asserted non-Jalali dates. No default/clamp/timezone shift.
Owner choice: accept the finite I1 horizon, or request validated wider coverage
before implementation. No unapproved chronology/future-date restriction.

Alternatives considered: [Borkowski's published algorithm](https://www.astro.uni.torun.pl/~kb/Papers/EMP/PersianC-EMP.htm)
has a broader calculated horizon and model assumptions; [Jalaali maintainers](https://github.com/jalaali/jalaali-js)
document a later divergence from Intl. Neither the full algorithm nor ICU/Intl is
already an accepted ERP Jalali validator. Substituting one does not prove civil
correctness or app/DB parity; dependencies/new validation would need review. The
small finite reviewed profile is preferable for bounded I1, conditional on range
acceptance and future full source-vector proof. If later authoritative annual data
conflicts, reconcile before affected use without rewriting historical date meaning.

## Catalogue and transaction conclusion

Retain exact immutable labels per installation/kind, UUID selection and same-scope
typed FKs. This prevents exact duplicates, not synonyms/visually equivalent terms.
Owner acceptance must explicitly include this limitation, or identify equivalence
cases for reconciliation. Preserve raw values; do not normalize/merge/delete.
Both current personal PROC/WH grants can add/read/select all3kinds with unchanged
scope/current checks/trusted creator and atomic audit. No name checks/admin gate.

Separate durable Add then Register is appropriate: each command has one clear
outcome/audit/recovery identity. Concurrent exact additions yield one option and
one durable DUP; authorized exact read selects the winner. A rejected key never
turns into accepted reuse. Unknown COMMIT is resolved with the original bound key
before dependent ordering. A successfully added nonempty option can remain unused
after failure/abandonment; both roles may reuse it, its creator remains original,
and no automatic cleanup/deletion is promised. Future UI should distinguish these
two outcomes; no UI is implemented. No third-party approval is introduced.

Business Material Type remains stock-free/selectable without Inventory mapping;
no OTHER default or enum change. Mapping/admission and B06 unexpected-goods policy
stay I2 concerns. Adding a descriptive option neither appends an original PO line
nor accepts/posts the physical goods. Repeated original lines remain independent.

## PostgreSQL integrity and resource conclusions

The normalized three-table model is retained. Frozen parentN, matching count FK,
unique positions1..N and one deferred header count=N guarantee complete initial
lines and prevent append under SELECT/INSERT-only runtime rights. Ordinary FK and
atomic statements alone cannot assert minimum children or immutable membership.
The [DB specification](I1_PURCHASE_ORDER_DATABASE_DESIGN.md#exact-values-immutability-and-aggregate-closure)
now details proof, direct malformed cases, savepoint-event rollback, concurrency
and simpler alternatives. No recursive writes/global closure lock/new posting
kernel; one SELECT-only invoker-rights indexed scoped count. Deferred COMMIT failure
is outside23505business mapping and remains technical/possibly uncertain under the
actual adapter; original-key recovery, not a false durable rejection. Real-PG
tests are mandatory later. Existing key→Identity→sorted actual owner hashes→source
ordering and current revocation linearization remain; no Inventory locks/writes.

| Proposed ceiling | Independent rationale / Owner-visible consequence |
| --- | --- |
| New text128Unicode scalars AND512UTF8bytes | Replaces128byte-only draft;128ordinary Persian letters can fit instead of roughly64. Supplementary characters count once, combining marks/ZWNJ separately; not a visual-character guarantee. No real longest-label examples supplied, so Owner capacity acceptance required |
| 1–128lines | Bounded source inserts/at most384typed option references and full order reads; no work proportional to ordered count. Independent workload cap, not IPS128effects, physical units or measured factory maximum.129lines reject; no automatic split |
| Request262144bytes,5s reader,16active | Reuse kernel byte ceiling/current transport concurrency; at most4MiB raw order bodies in16readers, plus additional bounded parser/binding/response buffers. Not total process-memory/performance proof; old4096byte routes unchanged |
| Full authorized HTTP projection262144bytes | Measure exact serialized data wrapper, labels, IDs, escaping and fixed metadata before insert. Large referenced labels can exceed this with an otherwise valid request; tagged semantic rejection, no truncation. Every committed order remains fully readable |
| Catalogue default50/max100 | Bounded reusable selection within existing small response budget; exact read zero/one. No total count/unbounded export or fixed multi-page snapshot promise |

Text validation uses the API's frozen explicit blank/Cc codepoint predicate, not
locale btrim approximations. Counts are decoded scalars plus UTF8 bytes; raw JSON
escapes still count toward transport. App/DB parity and PG index-key capacity are
future acceptance duties. These are initial capacity recommendations with bounded
failure behavior, not permanent business maxima or a substitute for real Windows
PG load/transaction evidence. Owner may revise capacities before acceptance.

## Findings, review record and readiness

Required findings: F1 exact identity overclaim corrected and R1 remains OPEN;
F2 missing derived-total handoff corrected; F3 unsupported resource rationale and
Persian byte disadvantage corrected; F4 unspecified blank/control DB parity corrected.
Calendar claims/range consequences and completeness proof/savepoint cases were
also clarified. F5 exact-response preflight ordering was corrected: allocate/freeze
line IDs/positions in memory, serialize the complete projection, check its budget,
then insert sources. Rejected allocation leaves no persistent source. No code or
previously confirmed factory fact is changed.

| Independent reviewer / scope | Final result | Finding disposition |
| --- | --- | --- |
| i1_architecture — architecture, quantities, identity, resource budgets and final governance | PASS after corrections | F1/F2/F3 corrected and reverified; R1 remains an Owner decision, not fabricated closure |
| i1_security — security/API, both roles, Unicode, replay/disclosure and response budget | PASS after corrections | F4/F5 corrected and reverified; no required technical security/API finding remains |
| i1_database_final — actual stock capacity, closure proof, constraints, locks, savepoints/recovery | PASS after corrections | DB-R1/F2 closed; D10/D11 remain conditional on mechanism acceptance and future real-PG proof |

Windows documentation checks PASS:16changed Markdown files only;705local links/
anchors resolve; metadata/IDs/new dependencies resolve;60unique requirement rows
(25workflow+23field+12supplemental),28future cases and14decision dispositions.
All12I1fields match the original Persian names/actor with7mandatory/5optional.
The four accepted Step1files, SRC-004/SRC-005, the full original field register,
S01–S12amendment and original48coverage matrix are unchanged. Working diff check
passes; final staged scope/diff checks and local network-blocked Graphify refresh
precede commit. No application/unit/PostgreSQL test was executed in this task.
Static review is not implementation acceptance, factory UAT or deployment.

Status: READY FOR CONDITIONAL OWNER DESIGN REVIEW; NOT READY FOR UNCONDITIONAL
DESIGN ACCEPTANCE while R1 is unanswered. Owner can accept/revise the listed numeric,
calendar, catalogue and resource conditions together with that decision. If it
requires broader identity equivalence, corresponding technical correction/re-review
must precede acceptance. I1 implementation requires a separate bounded instruction
and applicable gate reconciliation. No I2 design readiness or new capability follows.
