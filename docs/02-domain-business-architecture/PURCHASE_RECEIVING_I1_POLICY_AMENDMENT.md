---
id: DOM-INBOUND-POLICY-001
title: Confirmed I1 Owner policy amendment and readiness assessment
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [business-process-owner, chief-solution-architect, security-architect]
depends_on: [APR-033, SRC-005, DOM-INBOUND-REQ-001, DOM-INBOUND-FIELDS-001, DOM-INBOUND-TRACE-001]
last_reviewed: 2026-10-20
approval: APR-033 confirms business policies only; technical analysis and readiness are not approved design
supersedes: null
---

# Confirmed policy amendment and I1 readiness — documentation only

Business facts below are **OWNER CONFIRMED** by subsequent [SRC-005](../00-governance/team-answers/OWNER_I1_POLICY_CLARIFICATION_2026-10-20.md)
and [APR-033](../00-governance/approved-baselines/APR-033-i1-policy-clarification.md).
Technical analysis/options remain **DESIGN REQUIRED / NOT AUTHORIZED**. Step 2 at
`b8666b76602f2d002c4cacc5e8b689fe0130fb24` is Owner accepted as analysis only;
push is unconfirmed. This amendment is not an earlier factory-visit answer, runtime
contract, implementation or Step 3 authorization.

Execution plan: preserve accepted source/register/IDs; record new source and actual
acceptance; reconcile B01/B07/B08 and supplementary trace; update I1 obligations;
assess remaining readiness separately from I2; independently review, validate
documentation and commit locally. No runtime changes or new backend capability.

## Confirmed policy and supplemental trace

The accepted [25 rules](PURCHASE_RECEIVING_REQUIREMENTS_BASELINE.md),
[23 fields](PURCHASE_RECEIVING_FIELD_REGISTER.md) and [original trace](PURCHASE_RECEIVING_REQUIREMENTS_TRACE.md)
remain unchanged. Their historical OPEN cells reflect the earlier source; this
dated amendment controls the clarified portions. The 12 S requirements supplement
the original 48; they are neither new factory fields nor renumbered workflow rules.
Catalogue option identity/actor/timestamps are technical control data, not extra
mandatory fields entered on a purchase line.

| Supplemental ID | Confirmed requirement | Source | Existing requirement / decision | Delivery boundary | Future acceptance obligation |
| --- | --- | --- | --- | --- | --- |
| REQ-INBOUND-S01 | Preserve exact seller PO reference; unique factory-wide regardless of supplier in the correct installation/factory boundary; duplicate registration cannot overwrite/merge | SRC-005 §2 | 001/005/021, F02; B01 PO RESOLVED | I1 | Factory-wide same-reference duplicate across suppliers rejected safely; concurrency/replay outcomes preserve original, lookup by reference, repeated PO on different arrivals allowed; existing documentary references unchanged |
| REQ-INBOUND-S02 | Width m mandatory; thickness mm mandatory; length m optional; no implicit conversion/rounding/tolerance/precision | SRC-005 §3 | 002/008/017, F09/F10/F13; B07 units RESOLVED | I1 ordered; I2 actual | Requiredness/units preserved exactly; optional length absent valid; exact representation/comparison tests after design without invented precision |
| REQ-INBOUND-S03 | Registration business date is Jalali, independent of DB timestamps; receiving dates unaffected | SRC-005 §3 | 001/017, F17; B07 registration calendar RESOLVED | I1 | Jalali valid/invalid dates and leap-year boundaries, exact roundtrip/no conversion or timezone date shifts, business date separate from recording time; no automatic rule for F18 |
| REQ-INBOUND-S04 | Material Type, Quality/Grade and Color are shared reusable extensible selection lists; type required, quality/color optional, separate optional RAL | SRC-005 §4 | 002/008/009/017, F08/F11/F12/F14; B07 lists RESOLVED | I1 shared core; I2 actual selection | Existing option selection, list-backed new option instead of arbitrary text substitution; all three lists, no RAL dependency; original 23-field totals unchanged |
| REQ-INBOUND-S05 | ACT-PROC can add a missing legitimate value in any of the three lists, select it and continue ordering without another employee's approval | SRC-005 §4–5 | 002/023, F08/F11/F14; B08 core RESOLVED | I1 | Personally granted PROC add/select/use for each list; successful creation available for reuse; no admin-only or third-party approval gate |
| REQ-INBOUND-S06 | ACT-WH can add/select from the same three lists for actual receiving specifications without another employee's approval | SRC-005 §4–6 | 005/008/009/023, F08/F11/F14; B08 core RESOLVED | I1 catalogue capability; I2 receiving use | Personally granted WH can create/read/select each list even before receipt UI/contracts exist; I2 actual values preserve ordered differences; not PROC/admin-only |
| REQ-INBOUND-S07 | Added values are reusable by both authorized roles in their authorized business scope; organization/installation data and permissions stay isolated | SRC-005 §4–5 | 015/023; B07/B08 core RESOLVED | I1 shared core | PROC-created option visible to authorized WH and vice versa within scope; no foreign-organization option references, modification or existence leakage; customer/unrelated roles denied modification |
| REQ-INBOUND-S08 | Analyze safe duplicate/concurrent creation and trusted creation audit while preserving distinct factory terms; no silently invented equivalence or merging | SRC-005 §4–5 | 014/023; B07 identity DESIGN REQUIRED | I1 | After an explicit identity design, same/equivalent-input races and durable retries behave consistently, trusted creator and audit atomic; no cross-list conflation or silent term merge |
| REQ-INBOUND-S09 | Catalogue addition alone grants no PO edit, receipt confirmation, unordered/excess acceptance, stock posting or correction | SRC-005 §5–6 | 003/008/009/022/023/024; B06 OPEN | I1 authority separation; I2 exception gate | WH cannot rewrite original PO via lookup/add; PROC gains no receiving/stock; describing unordered goods does not add a PO line or authorize posting; B06 remains a separate decision |
| REQ-INBOUND-S10 | Business Material Type is extensible; addition cannot widen technical inventory enum or bypass downstream constraints; mapping/new technical class needs explicit reconciliation | SRC-005 §5 | 008/012/018/024, F08; technical mapping DESIGN REQUIRED | I1 separation; I2 mapping before stock | New option does not alter COIL/SHEET/ANGLE/BEAM/OTHER or default to OTHER; I1 no stock, I2 supported mapping required before effects, no unsupported class admitted |
| REQ-INBOUND-S11 | Preserve historical ordered values and separate accepted actual values/discrepancy evidence when different | SRC-005 §4/6 | 008/009/012, F08/F11/F14; B06 remains OPEN | I1 order history; I2 actual facts | Stable historical label/value meaning despite catalogue evolution; original not overwritten, actual/source/actor links retained; partial delivery distinct from mismatch |
| REQ-INBOUND-S12 | PROC registers/reads operational PO/lines; WH looks up seller reference and reads original needed specifications; current personal grants, audit/revocation and documentary-access boundaries remain | SRC-005 §5 | 001/005/015/023/024; B08 core RESOLVED | I1; I2 reads separately approved | Object/action scoped roles, org isolation and revoked-grant/replay tests; neither customer/unrelated modification nor broad SEC/documentary access inferred; no hardcoded names |

All 12 supplemental requirements are **NOT IMPLEMENTED** as complete new policy
behavior. Existing authorization/envelope foundations are reusable, not catalogue
or operational-order implementation. [Original 48-row code status](../12-implementation-planning/PURCHASE_RECEIVING_COVERAGE_MATRIX.md)
is unchanged; the [updated roadmap](../12-implementation-planning/PURCHASE_RECEIVING_DELIVERY_ROADMAP.md)
adds their future test obligations. W1/W2/W3 and ordered-count meanings remain
confirmed, without conversion/allocation or a second inventory writer.

## Ordering, receiving and unordered-goods distinction

In I1 ordering, PROC selects an existing option or adds the missing legitimate
option, then uses it on the order line. WH has the same catalogue addition/selection
capability in I1; the actual I2 receiving command/workflow is still absent. Both
roles' creations must become reusable within authorized scope, with no third-party
gate or uncontrolled free-text replacement of selected reference data.

In future I2 receiving, WH can add/select a value describing verified actual
material, preserving the original order and separate discrepancy evidence. If
the physical goods were never ordered, defining their catalogue description does
not make them ordered or accepted. B06 still governs holding/rejection/escalation,
excess/unexpected goods and authority before any stock effect. No workaround or
new approval workflow is invented here.

## Minimal owner and technical-material reconciliation analysis

Existing code fixes technical receiving types in [receiptTypes](../../apps/backend/src/modules/procurement/contracts.ts)
and [Inventory ReceiptMaterialType/validation](../../apps/backend/src/modules/inventory/receipt.ts):
COIL, SHEET, ANGLE, BEAM, OTHER. These are not the new extensible business catalogue.
Adding a business label must not mutate an enum or silently map it to OTHER.

PROPOSED minimal ownership: keep shared inbound reference data in Procurement,
whose ordering/receiving responsibilities already coexist, with narrow same-owner
selection/addition capabilities for both roles. No evidence requires a separate
large master-data module, supplier master or new infrastructure. This is an impact
finding for later design, not chosen storage/API/port contracts.

I1 may preserve a legitimate business Material Type without having a finalized
stock-class mapping because I1 has no stock effect. Do not add a mandatory mapping
field to the 23-field register or require WH/PROC to administer technical classes
merely to add a term. Before I2 posts stock, explicit supported-class mapping,
its ownership/authority and validation must be reconciled. One-to-one versus
context-dependent mapping and permission to assign/revise it are not decided by
catalogue-addition authority. A genuinely new technical class requires separate
architecture/scope approval. This remains an I2 dependency, not a reason to block
legitimate I1 order entry.

## I1 readiness assessment — analysis, not design authorization

**READY FOR OWNER AUTHORIZATION OF STEP 3 FOR I1.** No demonstrated unresolved
I1 business-policy decision prevents beginning its detailed design. Required
technical analysis remains; this does not mean design or implementation is complete.

| Topic | Current classification | Remaining work / why it does not reopen policy |
| --- | --- | --- |
| PO uniqueness and boundary | OWNER RESOLVED business rule; DESIGN REQUIRED enforcement | Scope must encompass the whole factory in the correct trusted installation/factory mapping, not supplier, person or role. Analyze technical equality/constraint/lookup; preserve supplied text. If the mapping genuinely permits several authorities for one factory, design must not accidentally allow per-authority duplicates; no new factory namespace question is presumed. |
| Exact numbers and precision | DESIGN REQUIRED | Use lossless representations in approved m/mm/m and whole-kg W1/integer count semantics. Determine parser, numeric validity and resource bounds from evidence without float coercion, rounding or arbitrary business precision. If a proposed limit would exclude legitimate factory input, surface that concrete issue before finalizing it; no such conflict is established now. |
| Jalali date | OWNER RESOLVED; DESIGN REQUIRED validator/storage | Analyze explicit calendar semantics and a reliable validation method, month/leap boundaries and roundtrip; Gregorian conversion/storage not preapproved. No timezone/DB-clock substitution and no extension to receiving date. Do not ask factory to select a library or algorithm. |
| Catalogue identity and duplicates | DESIGN REQUIRED, no approved semantic equivalence rule | Analyze stable identity and accidental exact-duplicate handling, concurrent creation and full-intent replay. Preserve original terms; any equivalence beyond a demonstrably safe rule must not merge distinct labels. No normalization algorithm, case folding, Persian/Arabic character substitution or uniqueness constraint is selected here. If a real ambiguous equivalence case needs business adjudication, ask only that case. |
| Repeated lines without item number | Known business behavior; DESIGN REQUIRED | Keep distinct technical line identity and readable original-line context even when optional item number is absent and specifications repeat. Never coalesce lines by attributes; future acceptance proves distinction. Karimi's later unit-to-line matching presentation remains I2 design, not a new mandatory field. |
| Technical material class | DESIGN REQUIRED separation now; mapping gate before I2 stock | Allow business catalogue/order use in I1 without enum edits, automatic mapping or extra field. Do not let catalogue addition grant technical-class administration. Resolve supported mapping before affected I2 effects. |
| Catalogue history/lifecycle | DESIGN REQUIRED preservation; edit/merge/delete DEFERRED | Preserve creation attribution and historical selected values. Initial add/select-only scope is PROPOSED minimal design; modifying/deactivating/merging/deleting options or rewriting past labels is not granted. Historical snapshot/version technique is later design. |
| I1 roles and mandatory/optional fields | OWNER RESOLVED | Both roles add/select; PROC register/read, WH lookup/read original specs. Preserve original field requiredness/actors. Implementing object-level authorization, current checks, audit and stable result disclosure is later design, not missing role policy. |

I2-only B01 waybill/receipt identity residuals, B02–B06, B07 receiving representation,
B08 sensitive-field disclosure and B09 evidence/escalation remain open where applicable.
B10 historical linkage can remain deferred. None authorizes or blocks the distinct
I1 registration/catalogue/lookup scope by default. OQ-011/OQ-019 residuals stay open.

## Validation and delivery evidence

Independent engineering/readiness review (`i1_policy_review`) and security/governance
review (`i1_security_review`) both PASS. Reviewers inspected the intended 16-file
documentation package and relevant current source, without edits or runtime tests.
No blocking/required or known high/critical planning findings remain. The minor
suggestion to include D09/D10 in current complete-design cross-references was
applied; historical Step 2 snapshot references remain historical.

Windows PowerShell / existing pinned Graphify Python standard-library checks PASS:
16 changed/new files are Markdown only; 722 local links/heading references resolve;
frontmatter and nine newly introduced dependency IDs resolve. SRC-004 and all four
accepted Step 1 files are unchanged; all 48 original primary matrix rows are
unchanged. Exactly 12 unique supplemental IDs S01–S12 trace to SRC-005 and future
acceptance. All 23 original labels/actors/requiredness match: 13 mandatory/10
optional, Masoumi 12 (7/5), Karimi 11 (6/5). Working `git diff --check` passes.
Final staged diff/source-scope checks and local offline graph refresh precede
commit under the established workflow. No application or PostgreSQL tests were
run; no UAT, production acceptance or implemented catalogue/permission is claimed.

Step 3 remains **NOT AUTHORIZED**, as does implementation. The next action is
Owner review of this focused policy/readiness package and, if desired, an explicit
bounded Step 3 instruction for I1. No assumption of remote push or new capability.
