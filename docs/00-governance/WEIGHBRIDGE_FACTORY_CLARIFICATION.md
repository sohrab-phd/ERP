---
id: GOV-WEIGHBRIDGE-CLARIFICATION-001
title: Factory clarification for incoming weighbridge tickets
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [business-process-owner, project-sponsor]
depends_on: [APR-030, GOV-QUESTIONS-001, PLAN-WEIGHBRIDGE-SCOPE-001]
last_reviewed: 2026-10-11
approval: Questionnaire only; factory replies and implementation approval pending
supersedes: null
---

# Factory response form — incoming weighbridge tickets

Purpose: agree how staff record an existing paper weighing ticket with an incoming
Goods Receipt. Please answer F01–F08 in order, identify the person supplying each
answer and date, and have the Owner confirm the resulting policy. **All replies
are pending. Recommendations below are proposals, not factory decisions.** F01–F08
are checklist references for this form, not new OQ register identifiers.

## Already settled — no repeat decision requested

- Normal receiving uses a personal organizational ACT-WH account. No shared login
  or permission inferred from a person's title. No-ticket receiving stays supported.
- Official inventory is measured whole kilograms; Count and dimensions do not
  change stock. No new rounding, conversion or weighing tolerance is proposed.
- The receipt command controls intake; Procurement owns receipt evidence and IPS
  alone posts stock. No mandatory PO, supplier approval, QC or Finance dependency.
- Physical measurement, inventory kg, shipment kg and commercial invoice weight
  remain distinct. A paper ticket does not calculate money or settle an invoice.
- Mr. Karimi's intake/final-order-weight responsibilities are recorded; this does
  not establish ticket duties, backup people or new account grants.

Sources: [receiving approval](approved-baselines/APR-021-receipt-increment-scope.md),
[factory weighing policy](team-answers/OQ-011.md), [measurement clarification](team-answers/OQ-001.md),
[personnel evidence](team-answers/OQ-019.md). The Owner's
[current preferred direction](approved-baselines/APR-030-weighbridge-clarification-preparation.md)
is optional paper-ticket evidence attached during initial receiving. That direction
is accepted for preparation, not final ticket policy or implementation permission.

## Please supply genuine evidence

Provide a **sanitized real printed incoming ticket** and explain which printed
weight was entered as material kg in its receipt. Include an actual reprint,
reweigh or ticket spanning several material units only if these occur in practice.
Keep field labels, units and relevant relationships understandable; redact customer/
supplier names, contact details, personal/vehicle identifiers and credentials.
Do not create a sample ticket, identifier or measurement to answer this request.
Use the approved project evidence location/channel; do not commit sensitive papers.
If no sample is available, say so and leave the affected decisions OPEN.

## Questions requiring factory answers

| Ref | Please answer | Preferred option, reason and alternative |
| --- | --- | --- |
| F01 — duties | Who issues the paper, transcribes it into receiving, may read it and retains it? Name the primary and backup for each duty. Does Mr. Karimi actually enter these tickets? | Use explicitly assigned personal staff/accounts. A backup may perform the same approved duty with an explicit grant; a job title or shared login is not sufficient. Additional checking is possible only if the factory requires and defines it. |
| F02 — access | Is ordinary organizational ACT-WH sufficient for recording these ticket fields? May existing ACT-WH and ACT-SEC receipt readers see them all? Identify any fields/readers that must be restricted. | Reuse ACT-WH for this intake branch if confirmed, avoiding another approval step. Confirm read access separately; narrower ticket reads are the alternative if confidentiality requires them. Existing receipt access is not an automatic new ticket grant. |
| F03 — printed values | Using the real sample, identify official material-weight field, unit, measurement date/time/source and every required/optional field. Is kg printed directly, or is gross/tare calculation needed? Are there multiple weighings or conflicting readings? | Transcribe the printed whole-kg material value without calculation. Retain other fields only if needed for traceability. Gross/tare calculation or another representation requires explicit policy and revised scope; never guess or round. |
| F04 — identity and use | What source and reference distinguish one weighing? Can numbers repeat/reset? Is a reprint the same evidence and a reweigh new evidence? Can one ticket cover several receipts/Units or several tickets one receipt? What must happen on duplicate or conflicting reuse? | Use genuine source identity and approved reuse rules. The simplest candidate is one ticket used for one receipt only **if actual practice supports it**. Split/multiple-ticket use requires an agreed mapping; a receipt UUID/Internal Code is not physical-ticket identity. No global number uniqueness is assumed. |
| F05 — reason and paper | What reason must the operator record for human ticket entry/fallback? Who keeps the paper, where, and how can it be found from the receipt? Is reference-only entry sufficient? Is any actual measurement-age rule required? | Bounded text reason and a retrievable paper reference; no scans or invented reason/age list. This is simpler but depends on reliable custody. If attachments are essential, request revised scope. Retention duration is a separate existing policy question. |
| F06 — unavailable/disputed | For connection failure, scale failure, printer failure, missing/unreadable paper and disputed weight, who decides what happens and what evidence is required? Can any specifically identified alternate measurement source be used? | With a usable print, use the approved manual path; without one or with disputed weight, stop the ticket branch and escalate/reweigh. An approved alternate source is possible only with defined authority/evidence. Ordinary no-ticket receiving remains available under its existing policy; do not label it a verified-ticket fallback. |
| F07 — mistakes | Is a first increment with no ticket edit/void/reversal acceptable? What should staff do with incorrect evidence before posting, and whom must they contact after an error is posted? Is any in-system correction essential for first use? | Keep recorded history immutable and use a named escalation procedure. This cannot repair posted stock. If software correction is essential, stop and separately approve its procedure/scope; do not overwrite or repost to compensate. |
| F08 — limits | Confirm factory agreement to optional evidence at initial posting, no later attachment, and deferral of device integration, commercial/final-order weighing, corrections, attachments and UI. If any excluded function is essential, identify it and why. | Initial atomic attachment avoids stock/evidence separation and preserves no-ticket receiving. Later attachment needs separate linkage/audit design. Owner has already excluded the deferred branches; a factory request does not unlock them. |

F04 must also address this limit: ticket duplicate detection can cover only the
source evidence actually supplied to the system. It cannot identify the same
paper in an ordinary no-ticket receipt. Please describe how staff avoid entering
the same physical intake in both ways; no global physical-duplicate guarantee is
promised. Future automatic/manual coordination remains deferred with automation.

## Return and decision record

Return each reference with the actual answer, evidence reference where relevant,
answering person/date, and unresolved exceptions. Leave unanswered entries OPEN;
do not sign the recommendations as though they were factory evidence. Real account
provisioning remains configuration/UAT work after the duty/access decisions.

The [conditional plan and blocker map](../12-implementation-planning/WEIGHBRIDGE_IMPLEMENTATION_PLAN.md)
show why each answer is needed. Implementation stays blocked until necessary
answers, reconciled policy, final plan/criteria and explicit Owner product
gate/unlock approval exist. No further acceptance of Finance-Lite or the completed
scope review is requested.
