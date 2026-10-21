---
id: PLAN-INBOUND-DECISIONS-001
title: Purchase and receiving Step 2 policy and design register
phase: 12-implementation-planning
status: in_review
version: 0.8.0
owners: [business-process-owner, chief-solution-architect, security-architect]
depends_on: [APR-039, APR-038, APR-037, APR-032, APR-033, APR-034, SRC-004, SRC-005, DOM-INBOUND-POLICY-001, DOM-INBOUND-RECON-001, PLAN-INBOUND-GAP-001, PLAN-I1-DECISIONS-001]
last_reviewed: 2026-10-21
approval: null
supersedes: null
---

# Policy and design register — resolved business portions and OPEN residuals

[APR-039 formal Owner acceptance](../00-governance/approved-baselines/APR-039-i1-backend-acceptance-i2-clarification.md)
accepts I1 implementation e3462fcfc4eaebbedb0d3a323bda7e0ae72d59c4 after the focused
read-only evidence check. Twelve capabilities are now Owner accepted; I2 is absent.
[Existing delivery results](I1_IMPLEMENTATION_STATUS.md) and [60-ID trace](I1_IMPLEMENTATION_TRACE.md)
remain the accepted evidence, not a fresh full test execution. No I1 design is reopened.

The next task is only [unresolved I2 business decisions in Persian](I2_BUSINESS_DECISIONS_FA.md):
B02/B03, non-PO B01/B04, changed-W1 B05, exceptions B06, receiving-only B07/B08,
minimum evidence/escalation B09 and business meaning/authority for D10 material
classification. Confirmed facts stay settled. Answers feed a bounded I2 design
and separate implementation approval; no I2 design/code/migration/permission or
gate expansion is authorized now. B10 historical linking remains excluded; no push.

## Earlier delivery status (historical; current acceptance is APR-039)


[APR-038](../00-governance/approved-baselines/APR-038-i1-implementation-authorization.md)
is the actual bounded Owner implementation authority after accepted APR-037 design.
I1 original order/line registration, exact shared catalogues for both PROC/WH and
original-order queries are implemented. [Delivery evidence](I1_IMPLEMENTATION_STATUS.md)
and [60-ID code/test trace](I1_IMPLEMENTATION_TRACE.md) provide actual verification.
No I2 functionality or policy closure, stock writer or new Owner-accepted capability
is implied. The next work requires Owner review and separate I2 scope/policy authority;
no push is authorized. Earlier design-only statuses below are historical.

## Earlier status (historical; effective I1 authority is APR-038)


Current [APR-037 Owner design acceptance](../00-governance/approved-baselines/APR-037-i1-detailed-design-acceptance.md)
accepts all fourteen [I1 technical decisions](I1_PURCHASE_ORDER_DECISIONS.md) with
explicit conditions. SRC-006 R1 Option A is CLOSED: preserved raw PO reference and
finite generated comparison key for whole-installation uniqueness/locks/lookup.
B01 PO/B07 specified I1/B08 core business policies stay resolved. I1 numeric/date/
exact-catalogue/line/resource and PostgreSQL designs are now OWNER ACCEPTED DESIGN,
not pending business questions or proof of implementation. The [checklist](I1_PURCHASE_ORDER_OWNER_ACCEPTANCE_CHECKLIST.md)
records approval; the [handoff DRAFT](I1_PURCHASE_ORDER_IMPLEMENTATION_AUTHORIZATION_DRAFT.md)
remains ineffective. Actual PG environment compatibility precedes future code;
all executable verification remains outstanding under separate implementation authority.
No I2/OQ residual is closed; no grant, contract, gate or source implementation changes.

## Earlier final-review assessment (historical a84e20e)


Earlier [APR-035 final review](../00-governance/approved-baselines/APR-035-i1-final-design-review.md)
qualifies the prior no-missing-I1-policy assessment: [R1](I1_PURCHASE_ORDER_FINAL_REVIEW.md#r1--owner-approved-option-a)
requires Owner decision on reference variants. B01 factory-wide namespace remains
resolved; source preservation does not establish business equivalence. No silent
normalizer or supplier partition. I1-D01–D14 have review dispositions, not acceptance.
Numeric/calendar/catalogue/resource conditions remain explicit proposals and I2
residuals remain at their prior scope. No implementation or gate authority follows.

Original design authority [APR-034](../00-governance/approved-baselines/APR-034-i1-detailed-design.md)
explicitly authorizes Step 3 I1 design only. The [six-file detailed proposal](I1_PURCHASE_ORDER_DOMAIN_DESIGN.md)
now addresses I1 portions of D01/D02/D05/D06/D08/D09/D10 and relevant envelope/
compatibility boundaries through [I1-D01–I1-D14](I1_PURCHASE_ORDER_DECISIONS.md).
Their state is **DESIGN PROPOSED — OWNER ACCEPTANCE REQUIRED**, not approved
contracts or implemented/resolved runtime work. I2 portions of D01–D10 and B02–B09
remain open at their actual dependent scope. No source/field requirement is changed.

Step 2 v0.1 analysis at `b8666b76602f2d002c4cacc5e8b689fe0130fb24` is formally
Owner accepted; push is unconfirmed. [APR-033](../00-governance/approved-baselines/APR-033-i1-policy-clarification.md)
and subsequent [SRC-005](../00-governance/team-answers/OWNER_I1_POLICY_CLARIFICATION_2026-10-20.md)
resolve the scoped B01/B07/B08 business portions below and mandate catalogue
addition by both roles. The [12-requirement policy amendment/readiness assessment](../02-domain-business-architecture/PURCHASE_RECEIVING_I1_POLICY_AMENDMENT.md)
controls those clarified portions without rewriting SRC-004 or the original 48
requirements. Technical recommendations remain PROPOSED / DESIGN REQUIRED.

Companion to the [code evidence](PURCHASE_RECEIVING_TECHNICAL_GAP_ANALYSIS.md),
[architecture assessment](PURCHASE_RECEIVING_ARCHITECTURE_IMPACT.md) and
[48-row matrix](PURCHASE_RECEIVING_COVERAGE_MATRIX.md). The accepted
[Step 1 Q1–Q11](../02-domain-business-architecture/PURCHASE_RECEIVING_RECONCILIATION.md)
are historical inputs, not eleven unanswered factory questions. The classifications
below separate confirmed facts, governed constraints, business decisions, technical
choices and safe deferrals. Owner-confirmed policies are not recommendations;
remaining recommendations are PROPOSED, never approved answers.
No decision here changes a grant, contract, invariant, gate or OQ status.

## Q1–Q11 disposition (Step2 assessment; accepted I1 runtime supersedes its I1 design waits)

| Step 1 question | Answered / governed already | Genuine business residual | Technical or deferred residual |
| --- | --- | --- | --- |
| Q1 identity | B01 PO portion OWNER RESOLVED: exact seller reference factory-wide regardless of supplier; no overwrite/merge; each physical unit distinguishable, separate references/UUIDs/keys | B01 non-PO namespaces/reuse, B02 issuance/legacy reconciliation, B04 document cardinality remain I2 residuals | D01 enforces known PO policy in correct factory boundary; no supplier master; source identity/constraints for other documents after answers |
| Q2 product | Field 19 mandatory, entered by Karimi; not automatically Sheet productCode | B03 meaning, grain and repetitions | D02 placement after answer |
| Q3 cardinality | PO has many lines and many arrivals; each arrival may confirm only a subset; each received unit independently identified | B04 multi-order trucks, receipt documents and packaging unit | D02 grouping and D04 atomicity; number of API calls is not a factory question |
| Q4 W1 | Accepted recorded per-unit W1 is stock basis; no independent destination unit weighing; whole-kg stock and IPS remain governed | B05 evidence/authority for a changed accepted W1 | D03 provenance/version/effect reconciliation; no question about allocating W2/W3 |
| Q5 exceptions | Original and actual must persist; partial delivery alone is not mismatch | B06 acceptance/escalation of wrong or excess material, nonaccepted goods | Exception branches may be excluded only by explicit bounded policy with an operational route; no default reject-all/accept-all |
| Q6 representation | Original 23 fields unchanged; W1 per-unit/W2-W3 consignment; width m/thickness mm/optional length m, Jalali registration date and three extensible reference lists now OWNER RESOLVED | B07 receiving-stage calendar/aggregate representation and actual line-matching context remain scoped I2; no open I1 unit/calendar/list policy | D05 exact number/date storage/validation and repeated-line identity; D09 catalogue duplicate/concurrency/history; D10 technical class separation/mapping |
| Q7 access | B08 core OWNER RESOLVED: PROC register/read operational PO, WH number lookup/original specs; both add/select all three catalogues with current personal org grants | I2 sensitive arrival/driver/truck/discrepancy/SEC exposure remains OPEN; no broad documentary access | D06 action/object scopes and revocation; D09 both-role creation; personal provisioning later configuration/UAT, not new I1 policy |
| Q8 evidence/errors | W2 mandatory from waybill; W3 optional; no weighing tolerance or automatic reconciliation | B09 missing/disputed mandatory evidence, unknown PO and minimum custody/escalation | Attachment/retention enhancements deferred; cannot silently route exceptions through existing no-PO intake |
| Q9 coexistence | Eleven accepted capabilities, immutable evidence and no-PO/no-ticket receiving preserved | B02 mixed-path identity safety; B10 only if documentary linking/backfill is included | D07 compatible coexistence required; historical conversion/linking safely deferred without reinterpreting old records |
| Q10 later lifecycle | No automatic closure, returns, correction or monetary effect authorized | Policy required before any such branch is proposed | DEFERRED, outside I1/I2; minimum already-posted error escalation remains B09 |
| Q11 implementation | Sole IPS, same transaction outcome/audit, current authorization, durable replay and recovery already governed | Resolved I1 policy feeds its technical design; remaining I2 grain/evidence answers feed their affected design | D01–D10 are technical work; I1 D05/D06/D09 and D10 separation do not require reopening resolved policy or waiting for I2; do not ask factory to design locks/APIs |

## Business disposition and remaining Owner/factory answers

Resolved portions below must not be asked again. Remaining I2 questions are for
their later decision round. Obtain sanitized real waybill/warehouse-document
examples for the unresolved B03/B04/B07/B09 portions; no identifiers, document
layouts or measured fields are fabricated. Do not collect production customer or
driver data in this repository. “Before I2” means before finalizing that affected
design/implementation, not that Step 2 documentation is blocked.

| ID / state | Exact question and scenario | Affected operation / invariant; timing | Preferred option, rationale, alternatives and risk |
| --- | --- | --- | --- |
| B01 PO: OWNER RESOLVED; non-PO: OPEN | Confirmed by SRC-005: exact seller PO reference unique across the entire factory regardless of supplier; duplicate registration never overwrites/merges. Multiple arrivals/waybills may reference it. No further PO-namespace/supplier question. Remaining: waybill/existing receipt reference reuse/cardinality only. | I1 business blocker removed; D01 must enforce the whole trusted installation/factory boundary rather than person/supplier or an accidentally narrower authority. Non-PO document decisions belong before I2. | Preserve source text and separate UUID/key identities. No extra mandatory field or supplier master. Current completed-purchase documentary references/records unchanged. I1 R1/generated-key uniqueness is implemented and Owner accepted under APR-039; only non-PO equivalence/identity remains undecided. |
| B02 OPEN | Who issues/physically associates unit codes, within what namespace may they repeat or be reused, and how are already-received units with repeated legacy codes distinguished? During coexistence, how will an operator recognize an already-posted unit across old and new receipt paths? | Physical-unit identity, double-post prevention and legacy compatibility; before I2 identity constraints/rollout | Keep legacy records immutable, introduce approved scoped identity for new confirmations and an explicit legacy reconciliation/rollout procedure. A mapping may be necessary; global uniqueness/backfill is not selected. UUID or command key alone cannot prove that two confirmations concern different physical goods. |
| B03 OPEN | What does `شماره محصول` identify on a real document/physical item: product class, seller product, individual unit or something else? At which level is it recorded and may several units/lines share it? Is there an actual relationship to existing Sheet productCode? | Mandatory F19 ownership and validation; before I2 model finalization | Keep concept distinct until example-backed meaning is confirmed. Reusing Sheet uniqueness without evidence could reject valid coils or conflate identities. |
| B04 OPEN | Can one truck/waybill contain several POs? Can one existing warehouse receipt document cover several arrivals or only part of one arrival? What is one physical unit for each relevant material/packaging form? | W2/W3 recorded once at true consignment grain, receipt relationships, unit origins and transaction group; before I2 | Model known PO→many arrivals and line→many units, retain each document identity separately. Select confirmation group only after these relationships are known; do not duplicate full-truck W2 on each PO slice or infer one receipt per truck. |
| B05 OPEN / ARCHITECTURE RECONCILIATION | If accepted W1 differs from the ordered value while units cannot be weighed individually, which evidence establishes the replacement W1 and who may accept it? For unchanged W1, confirm the operational evidence reference/custody under B09 without re-asking its stock-basis rule. | Trusted new origin provenance; reconciliation with ADR-0016 measuredKg and effect validation; before I2 | Preserve ordered W1 and accepted W1 with source/actor, explicitly authorize the new provenance meaning. No reinterpretation of immutable historical measured origins. If changed-W1 cases are deferred, explicitly approve that limitation and escalation; W2/W3 allocation is never an alternative. |
| B06 OPEN | In an order for five units, what may Karimi accept if six arrive or one has different specifications? What is recorded for rejected/held goods and who resolves the exception before stock posting? | Ordered progress, discrepancy acceptance and no posting of nonaccepted material; before affected I2 branches | Approve an ordinary matched/within-order bounded branch plus a documented escalation for exceptions if full policy is unavailable. This requires Owner agreement; do not silently reject all mismatches, accept extras, clamp outstanding to zero or introduce QC. |
| B07 I1 policy/design/implementation: OWNER ACCEPTED APR-039; I2 residuals: OPEN | Width m/thickness mm mandatory; length m optional. Registration date Jalali only. W1/count/W2/W3 meanings remain confirmed. Shared extensible Material Type/Quality/Color lists are REQUIRED, with current field requiredness and separate optional RAL. No re-questioning these facts. | I1 exact numeric representation, finite Jalali YMD/profile, exact-label catalogue identity/concurrency and distinct line identities are already implemented and Owner accepted under APR-037/APR-039. Only I2 receiving-date policy, W2/W3 source representation and actual-line matching context remain where applicable. | Preserve accepted I1 exact values and direct Jalali YMD/profile without reopening its storage or identity choices. Further date/weight representation analysis applies only to I2 receiving after its business answers. No float/rounding/tolerance, silent merge, automatic technical class, mandatory item number/RAL dependency or extra factory field. |
| B08 I1 core: OWNER ACCEPTED APR-039; I2 sensitive reads: OPEN | PROC may register/read operational orders/lines; WH may number-lookup/read original needed specs. BOTH ACT-PROC and ACT-WH may add/select Material Type, Quality and Color without another employee/administrator approval. Later I2 progress and actual receiving contracts remain separate. | I1 executable authorization is implemented and Owner accepted under APR-039. Remaining I2 arrival/driver/truck/discrepancy field disclosure and ACT-SEC extension require scoped decisions/design. | Preserve personal current org grants, isolation, attribution/revocation/replay/audit. No WH PO edits, PROC stock authority, customer/unrelated catalogue modification or widened completed-purchase/proforma reads. Catalogue-add authority is not mapping administration, receipt confirmation or B06 acceptance. Backups are individually provisioned later. |
| B09 OPEN | What must the operator do for missing/disputed waybill W2, unavailable accepted W1, or unknown/ambiguous PO; who retains and retrieves the waybill/existing receipt evidence; and who handles an already-posted error while correction is unavailable? | Operability and mandatory evidence; before I2 acceptance/rollout | Require a named operational escalation/custody procedure and clear pending outcome handling. Missing optional W3 remains valid. Do not invent a fallback reason, ticket ID, attachment mandate, tolerance, bypass or compensating stock operation. Detailed digital attachment/retention features can be deferred once minimum custody is agreed. |
| B10 OPEN IF INCLUDED / otherwise DEFERRED | Is explicit linkage of operational POs to old completed-purchase/proforma evidence or historical no-PO receipts required in the initial workflow, and what real document relationship supports it? | Only historical association/backfill, not ordinary new PO registration; safe to defer from I1/I2 if excluded explicitly | Coexist as distinct immutable concepts initially; do not infer matching from similar references/dates/descriptions. Any future link needs approved cardinality, provenance and read scope, without automatic financial or stock effects. |

B01 PO, B07 specified I1 policies and B08 core operations are resolved, not OPEN.
Earlier policy-update assessment (qualified by final-review R1): no demonstrated
I1 business blocker remained for registration, lookup and both-role
catalogue add/select. [Readiness analysis](../02-domain-business-architecture/PURCHASE_RECEIVING_I1_POLICY_AMENDMENT.md#i1-readiness-assessment--analysis-not-design-authorization)
separates remaining technical work from policy. Other B01 namespaces, B02–B06,
B07 receiving residuals, B08 I2 disclosure and B09 remain blockers only for affected
I2 scope. B10 historical linking may be deferred; mixed-path physical identity B02
must be resolved before affected new stock, not before stock-free I1.

## Technical choices — historical Step2 categories; I1 implemented/accepted, I2 remains open

The D01–D10 identifiers below are the Step 2 technical work categories, distinct
from I1-D01–I1-D14. Their original descriptions are retained for traceability:
I1 portions are specified/accepted in APR-037 and implemented/Owner accepted in
APR-039; only affected I2 portions remain outstanding. Older statements that I1 precision,
calendar or catalogue equality is unselected are historical, superseded only by
that accepted I1 baseline; no I2 mapping or receiving policy is inferred.

| ID | Design work after business reconciliation | Governed constraints / deliverable needed before implementation |
| --- | --- | --- |
| D01 | Enforce resolved factory-wide PO reference uniqueness/lookup with exact source preservation; other identity constraints/legacy mapping later | B01 PO resolved, no supplier partition; trusted whole-factory scope; other B01/B02 before I2; UUID/key/source identity separate; additive evolution only |
| D02 | PO line, consignment/waybill, receipt-document, confirmation group and per-unit relationships; F19 placement | B03/B04; no DDL or command shape frozen here; preserve independent units and one true aggregate-weight grain |
| D03 | New W1 provenance and immutable origin contract; explicit version/admission/effect validation | B05; reconcile ADR-0016/origin and current full-payload validation; never strip admitted payload or rewrite target/context to bypass validation |
| D04 | One transaction confirmation, progress consistency, lock/resource order, limits and recovery | Reuse envelope, opaque transaction and IPS batch; precollect owner/Sheet/source locks before IPS; consider 128-effect capacity without silent partial commits; no client-side transaction choreography |
| D05 | Exact m/mm/m number representation, Jalali registration date validation/storage, repeated-line identity; I2 actual/discrepancy design later | B07 resolved I1 semantics; no precision/rounding assumptions, Gregorian contract not preapproved; Jalali leap/roundtrip tests; B06/I2 representation separate |
| D06 | Implement resolved I1 role/action scopes and later I2 field projections; snapshot/replay disclosure | B08 I1 core resolved including both-role catalogue creation; current personal authority/waits/disclosure, org isolation; I2 sensitive scope OPEN; no wider PII/customer/documentary access |
| D07 | Compatible new receiving admission and old v1 receipts/purchase evidence, owner ports and genealogy source extension | B02/B10 exclusions; retain old contracts and source meaning, no fake child command, no backfill or new cross-owner table writes |
| D08 | Additive migration/constraint/backfill strategy where authorized, boundary checks and relevant test plan | Approved design first; runtime/DDL roles, owner imports/SQL rules, real PostgreSQL races/rollback/recovery; no migrations changed in Step 2 |
| D09 | Shared reference selection/addition, identity/duplicate races, trusted creation and historical selection preservation in existing owner | Both roles authorized; exact normalization/IDs/storage not chosen; no silent business equivalence/merge; no large master-data subsystem, edit/delete/merge authority or new factory fields inferred |
| D10 | Separate extensible business Material Type from fixed technical classes; explicit supported mapping before I2 stock | I1 may register legitimate unmapped business value without stock; no automatic OTHER/enum change; mapping meaning/ownership/assignment authority unresolved for I2 and not implied by catalogue addition |

## Deferred work and earlier gate assessment (historical; APR-039 controls current scope)

Automatic device protocols/hardware, separate printed-ticket capture/identity,
commercial/final-order weighing, attachments, browser UI, enhanced reporting,
order amendments/cancellation/closure, returns and financial/corrective effects
remain DEFERRED / NOT AUTHORIZED. OQ-011/OQ-019 and residuals remain open/treating;
F01–F08 partial answers are in the accepted Step 1 reconciliation and are not
blanket closure. No tolerance, invoice amount or settlement rule is introduced.

Step 2 analysis is Owner accepted; push unconfirmed. Step 3 I1 detailed design is
now explicitly authorized by APR-034 and documented as PROPOSED. APR-035 final review
identified R1 as a narrow business decision, now resolved by SRC-006. Technical
design acceptance remains pending; no remaining I1 business-policy blocker is identified. The broader I2 design cannot be finalized without its
scoped residuals/reconciliation. I1 requires Owner review/acceptance of technical
choices and separate bounded implementation authorization; implementation remains
NOT AUTHORIZED. No new approved ADR, contract or gate is published.
Later implementation additionally needs finalized plan/criteria and explicit
bounded product approval and applicable gate/unlock reconciliation. No tool or
successful documentation review provides that authority.
