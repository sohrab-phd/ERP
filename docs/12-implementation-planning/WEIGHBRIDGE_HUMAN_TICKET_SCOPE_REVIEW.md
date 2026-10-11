---
id: PLAN-WEIGHBRIDGE-SCOPE-001
title: Weighbridge human ticket and fallback scope review
phase: 12-implementation-planning
status: accepted
version: 0.2.0
owners: [chief-solution-architect, business-process-owner, integration-architect]
depends_on: [APR-029, APR-030, APR-021, ADR-0016, GOV-QUESTIONS-001, PLAN-IMPLEMENTATION-BACKLOG-001]
last_reviewed: 2026-10-11
approval: APR-030 Owner acceptance of delivered review; candidate implementation approval pending
supersedes: null
---

# Weighbridge — Human Ticket / Fallback Scope Review

Owner formally accepted the delivered review and confirmed push of
`8f9920322e295f5a18576a00a7c147f2fb0df017` on 2026-10-11; see
[APR-030](../00-governance/approved-baselines/APR-030-weighbridge-clarification-preparation.md).
No repeat acceptance is required. The Owner now prefers the optional initial
atomic intake-ticket direction while withholding implementation approval.
Current follow-up is the [factory response form](../00-governance/WEIGHBRIDGE_FACTORY_CLARIFICATION.md)
and [conditional implementation plan](WEIGHBRIDGE_IMPLEMENTATION_PLAN.md); the
original questions/validation below are the accepted review's historical evidence.
No actual factory replies have been supplied by that preferred direction.

Review result: **planning complete; implementation BLOCKED and NOT AUTHORIZED**.
The printed-ticket fallback and existing manual receiving authority are accepted.
Ticket content, identity/reuse, physical mapping and unavailable-ticket procedure
are insufficiently defined for new ticket behavior. OQ-011/OQ-019 remain treating;
no factory answer is inferred. This task adds no runtime code, API contract,
database migration, permission or gate/unlock expansion.

## Authority, business goal and review boundary

[APR-029](../00-governance/approved-baselines/APR-029-weighbridge-scope-review.md)
records the actual Owner acceptance/push confirmation for Finance-Lite commit
`67e3346dc93584123885cefb228c960f8940a7f6`, the eleventh accepted backend capability,
and this planning-only task. The goal is attributable, traceable weighing evidence
for factory intake during unavailable direct integration, without duplicate stock
or confusion with shipment/commercial kg. Users are the authorized receiving
person and permitted receipt readers; actual ticket handling/backup people need
factory confirmation. Mr. Karimi is confirmed for intake and final order weight
as organizational work, not automatically as a system grantee or ticket issuer.

Execution plan used: inspect live sources and current owner contracts; reconcile
fallback/authorization and weighings; define candidate, risks, questions and test
intent; independently review and check documentation; commit locally and stop
for Owner/factory decisions. This page is the bounded review, not an approved
physical design or a newly delivered backend capability.

## Confirmed requirements and source precedence

| Source | Confirmed requirement / limit |
| --- | --- |
| [APR-010 integration baseline](../00-governance/approved-baselines/APR-010-integration-deployment.md), [integration catalogue](../08-integration-deployment/INTEGRATION_CATALOGUE.md) | Structure/trust boundaries accepted; device protocol, identity and physical integration remain open. Adapter commands owners, never their tables. |
| [OQ-011 factory answer](../00-governance/team-answers/OQ-011.md), [live OQ-011](../00-governance/registers/OPEN_QUESTIONS.md#oq-011--weighbridge-integration) | First-go-live fallback is a human using the printed weighbridge ticket and the same PostGoodsReceipt / WI-BUNDLE-GR. Future automatic evidence needs a real stable source identifier/dedup strategy; no fake key. |
| [APR-021 receiving policy](../00-governance/approved-baselines/APR-021-receipt-increment-scope.md), [ADR-0016](../00-governance/adrs/ADR-0016-manual-goods-receipt.md) | Normal manual intake is individually authenticated ACT-WH, no mandatory PO or ticket/reference. Internal Code is required nonunique description. Receipt UUID and command key control document/retry identity. This later bounded policy does not implement printed-ticket capture or decide physical-ticket uniqueness. |
| [OQ-001 measurement evidence](../00-governance/team-answers/OQ-001.md), [OQ-002](../00-governance/team-answers/OQ-002.md) | Measured kg is official stock quantity; count/dimensions/length are secondary. Later factory evidence records 1 kg/zero decimals/no rounding. Earlier fractional examples do not authorize rounding a new device value. Broader conversions remain open. |
| [Factory process evidence](../02-domain-business-architecture/PROCESS_MAPS_AS_IS_TO_BE.md#incoming-material-2026-09-30), [OQ-019 personnel clarification](../00-governance/team-answers/OQ-019.md) | One intake station associated with Mr. Karimi; intake Internal Code/Count/Weight/Type. He also calculates final order weight. Ms. Masoumi records purchases/proformas, not receiving. No named shipment authority or delegate is supplied. |
| [Ownership matrix](../02-domain-business-architecture/MODULE_OWNERSHIP_MATRIX.md), [dependency rules](../09-repository-documentation/DEPENDENCY_AND_IMPORT_RULES.md), [invariants](../03-state-machines-invariants/INVARIANT_CATALOGUE.md) | Procurement owns receipt evidence/orchestration; Inventory owns stock identities and IPS alone posts. Ledger truth, Balance rebuildable, no negative stock, immutable history, authorized atomic bundles and customer isolation remain binding. |
| [Identity/session policy](../06-security-rbac-audit/SESSION_AND_IDENTITY.md#equipment-identity), [RBAC](../06-security-rbac-audit/ROLE_PERMISSION_MATRIX.md), [audit taxonomy](../06-security-rbac-audit/AUDIT_TAXONOMY.md) | Personal current grants, server-derived attribution, independent read authorization; device-down human command has a documented reason. Actor/device identities are distinct. No permission follows from a title. |
| [Finance-Lite scope](../00-governance/approved-baselines/APR-028-finance-lite-continuation.md), [accepted delivery](FINANCE_LITE_IMPLEMENTATION_STATUS.md) | Documentary invoice reference/date/order/customer only. Final commercial kg, price/amount, payment/settlement and external accounting are excluded. |

Live Owner decisions and later factory clarification control their bounded scope.
Historical architecture proposals/RACI placeholders and graph edges cannot close
OQs or broaden approval. APR-021 resolves normal manual ACT-WH authority; asking
for its reapproval would be incorrect. OQ-011's exact named ticket operator remains
an operational assignment/evidence gap, not proof that ordinary receiving is denied.

## Operators, ownership and authorization boundaries

| Actor / owner | Existing confirmed boundary | Ticket-specific gap |
| --- | --- | --- |
| Personal organization-scoped ACT-WH | PostGoodsReceipt and receipt reads with current grant; rejects customer-scoped receiving grants | Name/backup for physical ticket work; whether ordinary receiving grant suffices for the new ticket branch |
| Organization-scoped ACT-SEC | Existing receipt read/audit and grant administration | Ticket-content access must be explicitly reconciled, not inherited merely from security administration |
| ACT-PROC / Ms. Masoumi | Documentary purchasing/proforma only; Procurement is the receipt module owner | No second receiving poster or automatic ticket grant |
| Mr. Karimi | Organizational intake and final-order-weight responsibilities | Actual account/grants, ticket issuance/transcription/custody and commercial recording authority are not supplied by the title |
| ACT-SHIP, ACT-OP/ACT-PLAN | Existing scoped shipment/production commands | No receiving ticket privilege or ticket-triggered dispatch/production effect |
| ACT-SALES / ACT-FIN | Invoice evidence permissions fixed by APR-028 | No ticket or commercial-weight permission follows from invoice evidence |
| Device / adapter | Future evidence commander only | No device identity/authentication implementation is confirmed; no shared human login or worker substitution |
| ACT-CUST / unrelated roles | No receiving path | No ticket visibility, customer exports or portal grant is proposed |

Source: current [receipt transport](../../apps/backend/src/transport/receipt-http.ts),
[composition policies](../../apps/backend/src/composition-root.ts),
[Identity authorization](../../apps/backend/src/modules/identity/authorization.ts).
Installation/organization isolation and current authority apply to execution,
waits, retries and reads. Read scope is a decision distinct from posting authority.
No new role, named-user hardcoding, delegate or second-human approval is inferred.

## Human-ticket and fallback workflow

Accepted conceptual flow: printed measurement evidence -> authorized personal
receiving command -> Procurement receipt -> Inventory owner port -> sole IPS stock
post. The receipt, Lot/Unit origin, Ledger/Balance, outcome and audit remain one
PostgreSQL transaction. Direct database intake or a second fallback kernel is forbidden.

Current normal manual receiving already works without a mandatory ticket. It does
not persist a weighbridge ticket number, measurement time, gross/tare, source
identity or fallback reason. Those are rejected as unexpected v1 payload fields.
Do not place a ticket number in Internal Code to pretend ticket capture exists.

For the candidate, a person would transcribe an approved usable print, identify
its source and receipt relationship, record the approved evidence/reason, then
invoke the same business transaction. Whether evidence is attached at initial
posting or can later link to a posted receipt needs approval; recommend initial
atomic attachment for the first slice. A timeout is resolved by the original key
and receipt UUID on the reconciled primary. It is not permission to re-enter with
fresh IDs. The UUID does not establish that two different documents represent two
different physical loads.

Three operational conditions must be distinguished:

| Condition | Policy now |
| --- | --- |
| Device connection unavailable, valid printed ticket available | Human fallback principle accepted; ticket recording/identity details still open |
| Scale/printer also unavailable, print missing/unreadable, or measurement disputed | Printed-ticket policy supplies no substitute measurement authority; factory must decide hold/reweigh/alternate evidence. Existing normal manual intake remains unchanged, but is not an approved invented-ticket fallback |
| Earlier automatic attempt has uncertain outcome, human fallback proposed | Resolve earlier identity/outcome before another post. Future manual/automatic duplicate coordination requires an approved common source identity; fresh human keys do not prove nonexecution |

No fixed reason list, maximum age, recalculation, reprint/void/reweigh handling,
discrepancy threshold or corrected-ticket procedure is assumed.

## Data, evidence sources and system dependencies

| Data | Current contract / status | Decision needed for ticket branch |
| --- | --- | --- |
| Receipt UUID; lowercase UUID-v4 command key | Allocate before first attempt; retain across uncertainty; distinct from Lot/Unit/Internal Code/ticket | Preserve existing durable binding; define relationship to real source evidence |
| Internal Code, Count, measuredKg, Type | Required current intake fields; count descriptive; kg positive canonical whole string below 10^20; supported types COIL/SHEET/ANGLE/BEAM/OTHER | Confirm which ticket observation supplies the material kg; no conversion/rounding inferred |
| locationId; productCode | Required location UUID; Sheet requires product code, optional for other types; existing constraints retained | No new location master or universal ticket/material-code equivalence |
| Physical ticket reference and issuing source | Printed ticket source accepted in principle; no fields currently delivered | Format, issuer identity, uniqueness scope, resets/reprints and exact duplicate semantics |
| Measurement date/time, source unit, net/gross/tare, vehicle/load identity | No ticket schema or samples confirm mandatory fields | Supply actual sample and identify required/optional fields and which are evidence only; do not automatically subtract tare |
| Receipt-to-ticket mapping | Current command is one receipt/one stock intake effect, not a truck-load splitter | Determine whether one ticket covers multiple Units/receipts or multiple tickets cover one intake; allocation/reconciliation is not invented |
| Recorder identity, DB recording time, fallback reason | Personal attribution/audit are existing infrastructure; equipment policy requires documented reason | Preserve system-derived recorder/time; define ticket reason representation and actual measurement time separately |
| Original paper custody / scan / reprint | No confirmed retention or attachment policy | Approve paper-reference-only boundary/custodian; scan/file ingest remains deferred unless separately authorized |

Evidence sources are physical printed tickets and the documented factory answers;
no real ticket sample, device manual, payload, certificate or protocol is recorded
in the relevant canonical sources reviewed. Request sanitized examples, not
customer data or credentials in source/review artifacts. No universal calibration
interval or technical validity guarantee follows from human transcription.
Attribution establishes who transcribed the observation; it does not authenticate
the instrument or make a manually entered number a verified device reading.

Technical inspection: [ReceiptInput and owner port](../../apps/backend/src/modules/procurement/contracts.ts),
[receipt validation/service](../../apps/backend/src/modules/procurement/receipt-service.ts),
[Inventory receipt port](../../apps/backend/src/modules/inventory/receipt.ts).
The existing v1 strict allowlist contains no ticket metadata. A future additive
versioned receipt contract/evidence persistence under Procurement needs a reviewed
dependency contract; preserve v1 normal manual behavior. Contract version, schema,
field bounds, lock order and migration are deliberately not frozen before policy.

| Weight concept / dependency | Authority and candidate impact |
| --- | --- |
| Physical observation | Ticket documents a measurement at a time/source; not a mutable stock balance |
| Official receipt/stock kg | Only the accepted PostGoodsReceipt intake measuredKg feeds IPS; current Ledger remains quantity truth thereafter |
| Shipment kg | [ShippingEntry.kg](../../apps/backend/src/modules/shipping/contracts.ts) comes from reserved whole Units/claims; dispatch consumes those exact values. Ticket net weight cannot overwrite content, demand coverage or stock exit |
| Production kg | [Production contracts](../../apps/backend/src/modules/production/contracts.ts) and APR-025 enforce actual consumption/output/WIP/residual/scrap exact mass balance; ticket discrepancies are not balancing effects |
| Customer-order/commercial invoice kg | Mr. Karimi's final weight is commercial evidence; aggregation/order/shipment linking, authority and workflow are unresolved. [Sales contracts](../../apps/backend/src/modules/sales/contracts.ts) are scoped demand, with commercialTerms NOT_SUPPLIED |
| Finance-Lite | [InvoiceEvidenceInput](../../apps/backend/src/modules/finance/contracts.ts) has reference/date/order/customer only. No ticket input, amount computation, payment or settlement side effect |

There is no confirmed equality rule between these measurements. OQ-006 fulfillment
tolerance does not define weighing tolerance. Any later commercial integration
must use the commercial owner's approved contract and must remain separate from
stock posting; it is excluded from the first candidate.

## Confirmed versus unresolved device assumptions

Confirmed: weighing is evidence; integration is optional at first go-live; human
print fallback converges on Goods Receipt; future external replay must not duplicate
stock and needs a genuine stable identifier or approved device-specific strategy.

OPEN: make/model/location, device/source identifiers, serial/network/file/API
interface, message format/units/precision/timezone, authentication, connectivity,
calibration evidence, ticket counter/reset/reprint behavior and stable transaction
identity. No Modbus, REST, RS-232, OPC-UA, file drop, polling, queue or service
principal is selected. Automatic work remains GUARD_OPEN_POLICY / SPIKE-DEVICE.
Protocol/hardware detail is a blocker for automation, not inherently for a bounded
manual branch once its source-ticket facts and policy are approved.

## Security, consistency, audit and operational risks

These are planning risks, not demonstrated regressions in accepted code.

| Risk | Required constraint / decision / proof before delivery |
| --- | --- |
| Same physical ticket posted twice with distinct receipt UUIDs/keys | Approved source identity/use policy plus real PostgreSQL same-ticket races; ordinary envelope replay alone is insufficient |
| Reused counters, reprints or multiple intakes falsely treated as duplicates | Actual samples/reuse scope; no global ticket-number uniqueness or assumed one-ticket/one-Unit rule |
| Human identity spoofing, stale grants or unauthorized evidence reads | Trusted personal context, deny-by-default object scope/current revocation, read policy including ACT-SEC; no body role/device claim as authority |
| Forged, mistyped, stale or ambiguous measurement | Confirm source/required fields/measurement kg, reject unapproved representations without rounding; agree unavailable/disputed-ticket handling; no arbitrary age/tolerance |
| Evidence survives failed posting, or stock survives failed evidence/audit | Same opaque PostgreSQL transaction through owner ports; rollback/crash/audit-failure proof; no attachment after commit unless separately designed/approved |
| Ticket discrepancy silently changes shipment, production or finance | No cross-module effects beyond existing receipt path; regression checks prove all other owners unchanged |
| Commercial/customer data, vehicle/person identifiers or unsafe strings leak | Minimum bounded fields, parameterized persistence, safe errors/logs and scoped query output; no scan/upload/outbound path or new dependencies in candidate |
| Missing paper, uncertain previous outcome or recovery loses dedup facts | Factory custody/fallback decision; retain receipt/key/source references; primary-only uncertainty resolution and existing admission reconciliation; no automatic restoration behavior |

Immutable recorded evidence and append-only audit are the recommended first-slice
design. Corrections remain a separate approved compensating workflow; do not
silently edit, delete, overwrite, void or reverse a ticket/receipt. The factory must
decide whether that limitation is operable before approving the first slice.

## Recommended bounded candidate and acceptance criteria

Candidate: **manual printed-ticket evidence for normal incoming Goods Receipt**,
owned by Procurement and atomically associated with its existing receipt posting.
Recommend optional evidence on normal intake so APR-021 remains intact, explicit
approved ticket mode/source/reason, immutable evidence and a scoped owner read.
This is a proposal; ticket cardinality, identity, fields, reader grants and timing
must be answered first. If factory tickets require multi-Unit distribution, revise
the bounded plan rather than forcing them into the current single-intake command.

Dependencies: accepted Identity/envelope, Procurement receiving, Inventory origin/
IPS ports and PostgreSQL audit/outcome. Existing purchasing evidence is not a
mandatory receipt dependency. No new weighbridge bounded context, background
worker, device client, generic evidence framework or infrastructure is justified.

Excluded: commercial/final-order evidence, shipment reweighing/reconciliation,
automatic integration, gross-minus-tare calculation, tolerances, corrections/
returns/restoration, monetary Finance-Lite/payment/accounting, browser UI,
attachments/printing, PO mandates, QC, opening stock and new stock kernel behavior.

Proposed DoD, conditional on approved policy and bounded implementation authority:

1. Approved fields/source identity/cardinality and permission/read rules are
   reflected in a versioned owner contract; old v1/no-ticket receiving remains valid.
2. A permitted personal receiver records a genuine approved ticket with trusted
   recorder/database time and fallback reason; source observation stays distinct
   from record time. Existing stock kg/Unit/Lot semantics are preserved.
3. Evidence, receipt/origin/stock, outcome and audit commit or abort together;
   evidence/audit failure produces no partial facts or extra posting.
4. Same-key replay/changed-payload conflict, revoked/foreign-principal replay,
   receipt reuse, and approved physical-source duplicates/reprints are handled
   exactly as the approved policy says, including concurrent distinct receivers.
5. Missing/disputed print and uncertain earlier attempts follow the approved
   operational decision, with no invented measurement, fresh-key bypass or side effect.
6. Exact installation/organization reads/writes reject customer/unrelated scopes;
   roles/forged identities cannot broaden grants. No new Sales/Shipping/Production/
   Purchasing/Finance-Lite state or financial effect is introduced.
7. Pinned Windows checks, real isolated PostgreSQL migration/constraint/race/
   rollback/uncertain-commit tests, independent engineering/security reviews and
   canonical documentation pass; all required findings closed before local commit.
   Factory UAT and production approval remain separate.

Test strategy: unit/HTTP contract tests for allowlists, fields, kg and safe errors;
real Windows PostgreSQL tests for scoped evidence/receipt constraints, raw prior
migration preservation, runtime append-only/least privilege, same-key and source-key
races, reprint/source collisions, rollback at each write window and audit failure,
COMMIT reply loss/retry and revocation. Extend existing intake/owner-boundary tests,
and run relevant accepted regression suites. No mocks for database invariants,
no real-device success claim without protocol/equipment, no browser E2E in this
backend-only candidate. Factory validates sanitized worked intake/ticket examples
and a device-down drill when UAT is separately authorized.

## Exact Owner/factory clarification questions

Questions below are residuals of OQ-011/OQ-019 and measurement/operational policy,
not new OQ identifiers. Answers must be recorded as actual decisions. Do not
reapprove ACT-WH normal manual intake or reopen accepted 1 kg semantics.

| Question | Decision requested | Gate relevance |
| --- | --- | --- |
| 1. First scope | Approve or revise the proposed intake-only, optional printed-ticket evidence at initial PostGoodsReceipt posting, preserving normal no-ticket intake and excluding commercial/shipment/device branches? Is later linking to an already-posted receipt actually required? | Bounded scope/timing approval required |
| 2. People and access | Who issues/reads/transcribes/retains the intake print, and who is the backup? Is Mr. Karimi the actual ticket-entry operator? Should existing personal organizational ACT-WH suffice for ticket recording, and may existing ACT-WH/ACT-SEC receipt readers see all approved ticket fields, or is a narrower grant needed? | Ticket authority/read policy required; actual account grants remain configuration/UAT data |
| 3. Ticket and material kg | Provide a sanitized real intake ticket and worked example: which printed value is the official material kg (net, gross, other), which unit/time/source fields exist, and which must be recorded? Are gross/tare merely retained, or is any calculation required? Can that source supply the already accepted whole-kg intake without rounding? | Required evidence/mapping; broader arithmetic needs separate approval |
| 4. Identity and reuse | What issuing scale/site/source and ticket/transaction reference identifies one physical weighing? Can the number restart/repeat, is a reprint the same evidence, and are reweighs new evidence? Can one ticket cover multiple Units/receipts, or multiple tickets one receipt? Give examples and define duplicate/conflicting reuse rules and how a later automatic submission identifies the same manual evidence. | Blocks safe source dedup/cardinality; no assumed global uniqueness |
| 5. Reason and custody | Which minimum fallback reason and measurement date/time/source must be kept; who keeps the original paper and how is it found from the receipt? Is reference-only recording sufficient, with scans deferred? Is a measurement-age validity rule actually required; if so supply it rather than an invented cutoff? | Minimum evidence/reason/custody required; retention duration remains OQ-016 |
| 6. No usable print | When the scale/printer is down, print unreadable/missing, or weight disputed, should this ticket branch stop for reweighing, or is a specific alternate measurement source authorized? Who decides and what evidence/reason is required? | No substitute fallback until answered |
| 7. Incorrect/reweighed tickets | Is an immutable first slice with no ticket edit/void/reversal acceptable? What should the operator do before posting a wrong print, and whom should they contact if already posted? If in-system correction is essential for first use, supply separate correction authority/linking policy and approve revised scope. | Confirm operational viability; no correction feature authorized |
| 8. Later device and commercial branches | For future automation supply make/model/location, manual/interface/protocol, real source/transaction identity and calibration evidence. For future commercial weighing separately identify measurement/recorder/read authority, owning document, order/customer/shipment links and any aggregation. Keep both branches deferred now? | Not a blocker to intake-only manual scope if explicitly deferred; required before those branches |

Recommended next action: Owner/factory answers questions 1–7 for the chosen
manual scope and confirms the question 8 deferrals. Then reconcile a concrete
bounded implementation plan/DoD and obtain explicit scope approval with matching
product gate/unlock before any weighbridge code. No implementation starts from
this review, and no repeat Finance-Lite acceptance is needed.

## Review, validation and progress evidence

Documentation-only validation/review evidence is finalized before the local commit.
Independent engineering and proportionate security planning review: PASS against
the complete documentation diff, factory answers, approved receiving/shipment/
invoice scopes, current owner contracts, RBAC/isolation and threat model, using
the project security-review skill. No blocking or required findings, or known
high/critical planning findings. Two low wording/metadata suggestions were applied:
plan finalization follows policy decisions while code follows scope approval;
CURRENT_PHASE explicitly depends on APR-029. These are documentation/control
reviews, not implementation security acceptance or factory policy approval.
Windows source/link/scope checks: PASS for all nine changed Markdown documents,
498 local references and new report anchors; metadata present. Working and staged
git diff --check PASS, staged source/diff review PASS. No application, migration,
dependency or gate/unlock change is included. Offline Graphify 0.9.79 refreshed
505 tracked files / 4573 nodes / 9940 edges with network blocked; query locates
this review and its source links. Graph output remains ignored; source is authority.
The local documentation SHA is reported in the completion message.
No product or database tests are rerun for these Markdown changes; the accepted
177 unit/260 PostgreSQL Finance-Lite results are historical evidence confirmed
by the Owner, not this task's executed tests. No remote verification/push, runtime
mutation, network research, dependency change, Linux tooling or device probe occurs.

Accepted backend count remains **eleven**; [committed capabilities](FINANCE_LITE_IMPLEMENTATION_STATUS.md#overall-committed-capability-progress)
include foundations, IPS/intake, Sales/reservation/shipment, production/genealogy,
purchasing and invoice evidence. This review adds no twelfth capability.
Finance-Lite is partial; monetary/payment/accounting/correction work remains
deferred. Remaining areas include weighbridge integration, visibility/reporting/UI,
corrections/restoration, factory UAT and production cutover. No percentage is inferred.
