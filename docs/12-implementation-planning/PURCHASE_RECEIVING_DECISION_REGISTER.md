---
id: PLAN-INBOUND-DECISIONS-001
title: Purchase and receiving Step 2 policy and design register
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [business-process-owner, chief-solution-architect, security-architect]
depends_on: [APR-032, SRC-004, DOM-INBOUND-RECON-001, PLAN-INBOUND-GAP-001]
last_reviewed: 2026-10-20
approval: null
supersedes: null
---

# Policy and design register — DRAFT / decisions OPEN

Companion to the [code evidence](PURCHASE_RECEIVING_TECHNICAL_GAP_ANALYSIS.md),
[architecture assessment](PURCHASE_RECEIVING_ARCHITECTURE_IMPACT.md) and
[48-row matrix](PURCHASE_RECEIVING_COVERAGE_MATRIX.md). The accepted
[Step 1 Q1–Q11](../02-domain-business-architecture/PURCHASE_RECEIVING_RECONCILIATION.md)
are historical inputs, not eleven unanswered factory questions. The classifications
below separate confirmed facts, governed constraints, business decisions, technical
choices and safe deferrals. All recommendations are PROPOSED, never approved answers.
No decision here changes a grant, contract, invariant, gate or OQ status.

## Q1–Q11 disposition

| Step 1 question | Answered / governed already | Genuine business residual | Technical or deferred residual |
| --- | --- | --- | --- |
| Q1 identity | Seller PO reference unique in a still-unresolved namespace; each physical unit distinguishable; references differ from UUIDs/keys | B01 namespaces/reuse, B02 issuance/legacy reconciliation, B04 document cardinality | D01 lookup, source identity and constraints after semantics; do not ask again whether units need codes |
| Q2 product | Field 19 mandatory, entered by Karimi; not automatically Sheet productCode | B03 meaning, grain and repetitions | D02 placement after answer |
| Q3 cardinality | PO has many lines and many arrivals; each arrival may confirm only a subset; each received unit independently identified | B04 multi-order trucks, receipt documents and packaging unit | D02 grouping and D04 atomicity; number of API calls is not a factory question |
| Q4 W1 | Accepted recorded per-unit W1 is stock basis; no independent destination unit weighing; whole-kg stock and IPS remain governed | B05 evidence/authority for a changed accepted W1 | D03 provenance/version/effect reconciliation; no question about allocating W2/W3 |
| Q5 exceptions | Original and actual must persist; partial delivery alone is not mismatch | B06 acceptance/escalation of wrong or excess material, nonaccepted goods | Exception branches may be excluded only by explicit bounded policy with an operational route; no default reject-all/accept-all |
| Q6 representation | All 23 requiredness/actor assignments fixed; W1 is per-unit; W2/W3 per-consignment | B07 dimension units, value/date/aggregate-weight representation and ambiguous line matching | D05 exact storage, comparison and transport bounds after semantics |
| Q7 access | Masoumi registers and sees committed progress; Karimi looks up/verifies/confirms; personal current organizational ACT grants, no hardcoded names | B08 exact new role/field/scope exposure, backups, ACT-SEC extension | D06 narrow owner queries and authorization; actual personal account provisioning later configuration/UAT |
| Q8 evidence/errors | W2 mandatory from waybill; W3 optional; no weighing tolerance or automatic reconciliation | B09 missing/disputed mandatory evidence, unknown PO and minimum custody/escalation | Attachment/retention enhancements deferred; cannot silently route exceptions through existing no-PO intake |
| Q9 coexistence | Eleven accepted capabilities, immutable evidence and no-PO/no-ticket receiving preserved | B02 mixed-path identity safety; B10 only if documentary linking/backfill is included | D07 compatible coexistence required; historical conversion/linking safely deferred without reinterpreting old records |
| Q10 later lifecycle | No automatic closure, returns, correction or monetary effect authorized | Policy required before any such branch is proposed | DEFERRED, outside I1/I2; minimum already-posted error escalation remains B09 |
| Q11 implementation | Sole IPS, same transaction outcome/audit, current authorization, durable replay and recovery already governed | Business grain/evidence answers B01–B09 feed design | D01–D08 are technical design work after reconciliation; do not ask factory to design locks or APIs |

## Business decisions requiring Owner/factory answers

These are the concise questions for the next decision round. Obtain sanitized real
waybill/warehouse-document examples for B03/B04/B07/B09; no identifiers, document
layouts or measured fields are fabricated. Do not collect production customer or
driver data in this repository. “Before I2” means before finalizing that affected
design/implementation, not that Step 2 documentation is blocked.

| ID / state | Exact question and scenario | Affected operation / invariant; timing | Preferred option, rationale, alternatives and risk |
| --- | --- | --- | --- |
| B01 OPEN | When two sellers use PO number `N`, or a counter/year restarts, what namespace makes a seller PO unique? Within what scopes may waybill and existing warehouse receipt references repeat or cover several records? These are hypothetical scenarios, not actual identifiers. | Unambiguous PO lookup and document/source deduplication; PO part before I1, arrival/document part before I2 | Preserve exact supplied reference plus technical identity and approved namespace; ambiguous lookup must require disambiguation, never select first. Organization-wide uniqueness is simpler only if factory confirms it. A seller-based namespace may need seller context not present among the 23 fields: approve its source rather than silently add a mandatory field. |
| B02 OPEN | Who issues/physically associates unit codes, within what namespace may they repeat or be reused, and how are already-received units with repeated legacy codes distinguished? During coexistence, how will an operator recognize an already-posted unit across old and new receipt paths? | Physical-unit identity, double-post prevention and legacy compatibility; before I2 identity constraints/rollout | Keep legacy records immutable, introduce approved scoped identity for new confirmations and an explicit legacy reconciliation/rollout procedure. A mapping may be necessary; global uniqueness/backfill is not selected. UUID or command key alone cannot prove that two confirmations concern different physical goods. |
| B03 OPEN | What does `شماره محصول` identify on a real document/physical item: product class, seller product, individual unit or something else? At which level is it recorded and may several units/lines share it? Is there an actual relationship to existing Sheet productCode? | Mandatory F19 ownership and validation; before I2 model finalization | Keep concept distinct until example-backed meaning is confirmed. Reusing Sheet uniqueness without evidence could reject valid coils or conflate identities. |
| B04 OPEN | Can one truck/waybill contain several POs? Can one existing warehouse receipt document cover several arrivals or only part of one arrival? What is one physical unit for each relevant material/packaging form? | W2/W3 recorded once at true consignment grain, receipt relationships, unit origins and transaction group; before I2 | Model known PO→many arrivals and line→many units, retain each document identity separately. Select confirmation group only after these relationships are known; do not duplicate full-truck W2 on each PO slice or infer one receipt per truck. |
| B05 OPEN / ARCHITECTURE RECONCILIATION | If accepted W1 differs from the ordered value while units cannot be weighed individually, which evidence establishes the replacement W1 and who may accept it? For unchanged W1, confirm the operational evidence reference/custody under B09 without re-asking its stock-basis rule. | Trusted new origin provenance; reconciliation with ADR-0016 measuredKg and effect validation; before I2 | Preserve ordered W1 and accepted W1 with source/actor, explicitly authorize the new provenance meaning. No reinterpretation of immutable historical measured origins. If changed-W1 cases are deferred, explicitly approve that limitation and escalation; W2/W3 allocation is never an alternative. |
| B06 OPEN | In an order for five units, what may Karimi accept if six arrive or one has different specifications? What is recorded for rejected/held goods and who resolves the exception before stock posting? | Ordered progress, discrepancy acceptance and no posting of nonaccepted material; before affected I2 branches | Approve an ordinary matched/within-order bounded branch plus a documented escalation for exceptions if full policy is unavailable. This requires Owner agreement; do not silently reject all mismatches, accept extras, clamp outstanding to zero or introduce QC. |
| B07 OPEN | What units and source precision represent width/thickness/length; what are material/grade/color/RAL meanings; which date/calendar representation is used; what source precision/unit applies to W2/W3? How does Karimi distinguish lines when optional item number is absent or specifications repeat? | Exact validation/comparison and reliable order-line selection; line fields before I1, receiving/aggregate details before I2 | Retain explicit source semantics and technical line identity. Choose encoding only afterward; no invented RAL patterns, conversion, rounding, dimensional tolerance or date defaults. Sanitized examples can settle representation efficiently. |
| B08 OPEN | Approve the minimum fields/scopes for organizational ACT-PROC operational-order registration and committed PO receiving visibility, and ACT-WH order/specification lookup. Which new arrival/driver/truck/discrepancy fields may ACT-SEC view? Which personal backup accounts carry which current grants? | Required new commands/owner queries and sensitive-field isolation; I1 lookup/registration before I1, receiving/SEC fields before I2 | Keep ACT-WH as receiving operator, ACT-PROC as purchasing operator, grant narrow owner projections. Preserve existing WH/SEC base receipt reads; default proposed new views to necessary fields, with driver/truck exposure separately justified. Broad documentary/stock access is not necessary. Provision individuals later; no name checks. |
| B09 OPEN | What must the operator do for missing/disputed waybill W2, unavailable accepted W1, or unknown/ambiguous PO; who retains and retrieves the waybill/existing receipt evidence; and who handles an already-posted error while correction is unavailable? | Operability and mandatory evidence; before I2 acceptance/rollout | Require a named operational escalation/custody procedure and clear pending outcome handling. Missing optional W3 remains valid. Do not invent a fallback reason, ticket ID, attachment mandate, tolerance, bypass or compensating stock operation. Detailed digital attachment/retention features can be deferred once minimum custody is agreed. |
| B10 OPEN IF INCLUDED / otherwise DEFERRED | Is explicit linkage of operational POs to old completed-purchase/proforma evidence or historical no-PO receipts required in the initial workflow, and what real document relationship supports it? | Only historical association/backfill, not ordinary new PO registration; safe to defer from I1/I2 if excluded explicitly | Coexist as distinct immutable concepts initially; do not infer matching from similar references/dates/descriptions. Any future link needs approved cardinality, provenance and read scope, without automatic financial or stock effects. |

B01/B02 identity, B03 product meaning, B04 grain, B05 provenance, B06 exception
boundary, B07 representations, B08 access and B09 minimum operations are genuine
remaining blockers for the affected future scope. Not all block I1. B10 does not
block ordinary coexistence; the cross-path physical-duplicate risk in B02 does.
Recommendations do not answer these questions on behalf of the factory.

## Technical choices — DESIGN REQUIRED, not factory questions

| ID | Design work after business reconciliation | Governed constraints / deliverable needed before implementation |
| --- | --- | --- |
| D01 | Scoped PO lookup, business identity constraints, legacy mapping and physical-source duplicate admission | B01/B02; owner-only writes; fail ambiguous lookup; UUID/key/source identity remain separate; new additive evolution only |
| D02 | PO line, consignment/waybill, receipt-document, confirmation group and per-unit relationships; F19 placement | B03/B04; no DDL or command shape frozen here; preserve independent units and one true aggregate-weight grain |
| D03 | New W1 provenance and immutable origin contract; explicit version/admission/effect validation | B05; reconcile ADR-0016/origin and current full-payload validation; never strip admitted payload or rewrite target/context to bypass validation |
| D04 | One transaction confirmation, progress consistency, lock/resource order, limits and recovery | Reuse envelope, opaque transaction and IPS batch; precollect owner/Sheet/source locks before IPS; consider 128-effect capacity without silent partial commits; no client-side transaction choreography |
| D05 | Exact typed field snapshots, original/actual comparison, discrepancy marker and safe text/date/quantity validation | B06/B07; mandatory at proper stage, original immutable, absence distinct from mismatch, no floating-point/automatic aggregate allocation |
| D06 | Minimal owner-query projections, role/field scopes, snapshot consistency, transport and replay disclosure | B08; current personal authority before/after waits and before disclosure; org isolation, no PII/customer trace widening or caller-supplied actor |
| D07 | Compatible new receiving admission and old v1 receipts/purchase evidence, owner ports and genealogy source extension | B02/B10 exclusions; retain old contracts and source meaning, no fake child command, no backfill or new cross-owner table writes |
| D08 | Additive migration/constraint/backfill strategy where authorized, boundary checks and relevant test plan | Approved design first; runtime/DDL roles, owner imports/SQL rules, real PostgreSQL races/rollback/recovery; no migrations changed in Step 2 |

## Deferred work and gate

Automatic device protocols/hardware, separate printed-ticket capture/identity,
commercial/final-order weighing, attachments, browser UI, enhanced reporting,
order amendments/cancellation/closure, returns and financial/corrective effects
remain DEFERRED / NOT AUTHORIZED. OQ-011/OQ-019 and residuals remain open/treating;
F01–F08 partial answers are in the accepted Step 1 reconciliation and are not
blanket closure. No tolerance, invoice amount or settlement rule is introduced.

Step 2 is reviewable without these answers. Final Step 3 design is **not ready for
unqualified finalization**: the affected business answers and architecture
reconciliation must be supplied, and the Owner must explicitly authorize Step 3.
Later implementation additionally needs finalized plan/criteria and explicit
bounded product approval and applicable gate/unlock reconciliation. No tool or
successful documentation review provides that authority.
