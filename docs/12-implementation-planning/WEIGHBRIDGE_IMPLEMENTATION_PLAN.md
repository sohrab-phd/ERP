---
id: PLAN-WEIGHBRIDGE-IMPLEMENTATION-001
title: Conditional incoming printed-ticket implementation plan
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [chief-solution-architect, business-process-owner, security-architect]
depends_on: [APR-030, PLAN-WEIGHBRIDGE-SCOPE-001, GOV-WEIGHBRIDGE-CLARIFICATION-001, APR-021, ADR-0016]
last_reviewed: 2026-10-11
approval: Preparation authorized only; factory policy and explicit product gate approval pending
supersedes: null
---

# Conditional plan — optional incoming printed-ticket evidence

**Implementation BLOCKED / NOT AUTHORIZED.** This is a proposed contract and DoD,
not a finalized factory policy, active API contract, schema or product unlock.
[APR-030](../00-governance/approved-baselines/APR-030-weighbridge-clarification-preparation.md)
records Owner acceptance/push of review `8f9920322e295f5a18576a00a7c147f2fb0df017`
and authorizes this preparation only. All F01–F08 factory replies are pending in
the [response form](../00-governance/WEIGHBRIDGE_FACTORY_CLARIFICATION.md).

## Bounded goal, users and exclusions

Goal: the authorized personal receiver can retain traceable paper-ticket evidence
with normal incoming receipt posting, without duplicate ticket-linked intake or
a second inventory writer. Preferred initial posting/optional-evidence direction
comes from the Owner, expressly without implementation authorization. Staff duties,
backup and ticket-specific recording/read policy depend on F01/F02.

Use existing Procurement receiving, Identity/envelope, Inventory origin/IPS,
PostgreSQL audit/outcome and pinned Windows tooling. [APR-021](../00-governance/approved-baselines/APR-021-receipt-increment-scope.md)
and [ADR-0016](../00-governance/adrs/ADR-0016-manual-goods-receipt.md) already approve
normal manual ACT-WH/no-ticket intake and exact whole kg; they are not reopened.
Existing purchase/proforma records are optional independent coordination, never
a new intake prerequisite. Other module owner contracts remain unchanged.

Exclude automatic scale/device client, commercial/final-order weight, shipment
reweighing, monetary Finance-Lite, payments/accounting, ticket/stock corrections,
restoration, attachments/printing, browser UI, later ticket attachment, mandatory
PO/supplier approval, QC, opening stock, new material conversion and IPS kernel
changes. F08 checks factory fit of these limits; a conflicting need requires
rescoping and Owner approval, not silent implementation.

Preparation execution plan: formulate genuine evidence requests/options; map
pending decisions to owner contracts and operational controls; prepare conditional
design/DoD; independent engineering/security planning review; source/link/diff
validation and local documentation commit; stop for factory replies and Owner gate.

## Decision dependencies and blockers

F references are questionnaire items, not new OQs. OQ-011/OQ-019 remain treating;
broader OQ-001 conversions, OQ-016 retention and deferred device/commercial
residuals are not closed. No factory decision is supplied by the preferred option.

| Pending item | Affected contract / invariant / procedure | What must be settled before finalization |
| --- | --- | --- |
| F01 duties/backup | Trusted person attribution; operational RACI; OQ-019 | Actual ticket work/custody/escalation roles; names do not grant permissions. Actual credentials/grants are later configuration, not source constants |
| F02 ticket access | ReceiptPolicy/current Identity target/replay/read rules; INV-015 | Whether existing ACT-WH recording authority covers ticket mode; permitted reader roles/fields, especially ACT-SEC; any additional capability/checker |
| F03 real sample/weight | Payload fields/validation and receipt measuredKg; INV-001/018 | Official printed material-kg value, actual units/time/source, required/optional metadata; no arithmetic or rounding policy inferred |
| F04 identity/cardinality | Scoped evidence identity, FK/use constraints, payload binding, locking; INV-016 | Real source key, reuse/reset/reprint/reweigh rules, one/many receipt mapping, conflicts and duplicate handling. No uniqueness DDL/lock key frozen until answered |
| F05 reason/custody | Evidence fields, safe audit association, retrieval procedure | Minimum reason/reference/observation fields and paper retrieval; any genuine age rule. Reference-only boundary must be operable; no attachments added |
| F06 unavailable/disputed | Validation/admission and human procedure | Print versus connection/scale failure decisions; authority/evidence for any alternate source; no-ticket/ticket duplicate avoidance |
| F07 incorrect records | Immutable evidence and escalation; INV-005 | Acceptance of no in-system corrections, before/after-posting handling and contact. Essential software correction requires separate scope |
| F08 exclusions/timing | Initial transaction boundary, dependencies and scope | Factory fit of Owner's preferred initial/optional intake branch and excluded features; not a fresh device or financial unlock |
| Owner product approval | CURRENT_PHASE and exact product gate/unlock | Necessary answers recorded and reconciled, finalized bounded plan/criteria, explicit approval before API/SQL/runtime work |

Device make/model/protocol, calibration/interface and later commercial workflow
remain prerequisites for their deferred branches, not universal manual-intake
blockers. Genuine source-ticket identity remains required for this manual design.
If unavailable, obtain an explicit safe factory reconciliation strategy and review
its limits; do not substitute generated IDs or claim physical deduplication.

## Proposed command/query contract — conditional, not active

Prefer **PostGoodsReceipt v2** as a versioned extension on the existing receiving
endpoint `/receipts/post`, with the same goods-receipt target, transaction and
intake semantics. This is an engineering proposal requiring final API review and
Owner gate approval; v1 remains unchanged and supported. No independent
PostWeighbridgeTicket or second intake executor is proposed.

| Part | Proposed design | Pending dependency |
| --- | --- | --- |
| Envelope | Existing scoped receipt UUID, stable command key and immutable request binding; bind contract version and all supplied ticket fields to original principal/intent | Final payload shape after F03/F04/F05 |
| Intake payload | Preserve internalCode/count/measuredKg/type/locationId/productCode and their existing validation; measuredKg remains the one stock quantity passed to InventoryReceiptPort | F03 maps actual paper value to measuredKg without altering whole-kg policy |
| Optional `ticketEvidence` | Proposed nested evidence object; absence retains no-ticket intake. If present, require the complete approved field set, never a partial guessed ticket | F02–F06; object/field names/types/bounds finalized from actual examples |
| Evidence candidates | Genuine issuing-source/reference, actual measurement-time representation, fallback reason and retrievable paper reference; include other observed fields only if approved | F03/F04/F05; no fabricated identifier, required gross/tare/vehicle fields or timezone default |
| Attribution | Derive recorder issuer/subject/role from current trusted Identity and record time from PostgreSQL; observation time separately from the paper if required | F01 defines human responsibilities; recording a claim does not authenticate an instrument |
| Source binding/use | Keep actual source identity distinct from receipt UUID/Internal Code/Unit identity. Bind supplied evidence immutably; apply approved reuse/cardinality semantics to multiple command keys | F04 decides normalisation, namespace and accepted/duplicate/conflicting/reprint outcomes |
| Read result | Owner query exposes approved evidence fields with current organization/object authorization, omitting internal binding/lock keys; no-ticket result distinguishable without fabricated evidence | F02/F05; prefer GetGoodsReceipt enrichment only if the same readers are approved, otherwise a narrow owner query whose route/version is finalized later |
| Errors | Existing safe guard/error taxonomy for invalid fields, current authority, conflicting bound intent and approved duplicates. Missing required runtime policy stays denied; no paper/customer data in errors/logs | F04/F06 determine exact business outcomes; rejected commands do not post partial facts |

No-ticket v1 behavior must not gain a mandatory ticket/source/reason. No-ticket v2
compatibility is proposed, not a new stock path. A changed version or omitted ticket
under the same occupied key is a changed intent, not permission for another post.
Different keys using the same receipt UUID retain existing duplicate/conflict rules.
Source reuse with a fresh key is not envelope replay and must not disclose another
principal's original outcome. Approved duplicate/conflict responses remain subject
to current command/object authorization and nondisclosing errors. [F02/F04]
The new contract must not send ticket fields through Inventory's strict ReceiptInput
or change origin/stock schemas; Procurement strips evidence from the existing
Inventory owner-port input and owns its persistence in the same transaction.
Stripping that argument alone is insufficient: the current
[composition effect policy](../../apps/backend/src/composition-root.ts) parses the
original request payload again with parseReceiptInput, while the
[receipt handler](../../apps/backend/src/modules/procurement/receipt-service.ts)
admits version 1 only. After approval, adapt the trusted owner/composition boundary
to explicitly validate each supported version and derive the same validated core
ReceiptInput for both receive and effect checks. Preserve the original full bound
request/version/principal; do not manufacture a stripped execution context, ignore
unknown fields or broaden IPS acceptance. Command/version admission, source fact,
effect kg/type/location and no-customer stock checks require final API/boundary
review and regression proof. This is a planned dependency adaptation, not an IPS
kernel change or permission to edit that boundary now.

## Conditional persistence, transactions and consistency

Propose immutable Procurement-owned evidence linked by scoped FK to its receipt;
no separate weighbridge BC/table writer. Evidence stores only the approved minimum
fields plus trusted recorder/database recording time. A one-evidence/one-receipt
constraint is a candidate only if F04 confirms that physical mapping. If tickets
span multiple Units/receipts, re-scope the mapping/atomicity before final design;
do not coerce the whole ticket kg into each receipt or invent allocation arithmetic.
Do not create a global ticket-number index or destructive historical backfill.

Final migration/table/constraint names, exact data types/bounds, natural-key index
and lock strategy remain pending F03–F05. Use authored additive SQL, scoped exact
references, runtime append-only/least privilege and preserved prior migration bytes.
No issued/voided ticket lifecycle, edit/delete/reversal or new retention interval.

Envelope key and Identity account/session locks remain first; existing receipt/
Sheet-code and sorted IPS resource lock ordering remains authoritative. Finalize
the position/order of source-evidence locks without inversions, using approved F04
identity; prove distinct-user source races against real PostgreSQL. Fresh reads
after owner waits and current permissions apply to execution and disclosure.

Ticket evidence, receipt DRAFT -> RECEIVED -> POSTED, Lot/Unit origin, sole IPS
STOCK_IN/Ledger/Balance, durable outcome and original audit must commit or abort
together through the same opaque transaction. Evidence insert/audit failure cannot
leave posted stock. Safe generic audit associates the accepted fact with the
evidence through its owner record; no raw ticket payload or credentials in logs.
Replay/conflict audit and current disclosure preserve existing envelope rules.
Timeout/unknown COMMIT uses the original key/receipt on the reconciled primary;
no new-key re-entry, silent repost, automatic restore or off-primary absence proof.

**Guarantee limit:** source dedup can protect submitted ticket-linked commands
under the approved identity rules. Ordinary no-ticket intake contains no source
ticket to match. This design cannot prove all physical-load uniqueness or prevent
an unseen paper being entered through no-ticket receiving. F04/F06 must define and
acknowledge the operating procedure; neither global blocking of no-ticket intake
nor an invented paper identity is an acceptable technical shortcut.

## Conditional authorization and operational flow

Prefer ordinary personal organizational ACT-WH to command the ticket branch if
F02 confirms it; no additional grant, checker or named-person hardcoding is assumed.
Current installation/organization checks apply before and within the transaction,
after relevant waits, and on replay/read. Ticket readers remain denied until their
explicit policy is reconciled, even when existing receipt reading is allowed.
Customer-scoped receiving, copied/forged contexts and unrelated roles remain denied.
ACT-SEC administration alone creates no ticket permission. No customer/commercial
grant is inferred from Warehouse authority.

Proposed flow: receiver obtains approved usable paper, identifies exact source/
receipt relationship, transcribes approved fields and material kg, retains original
receipt/key through uncertainty, and invokes the existing receipt transaction.
Paper location/reason and missing/disputed/incorrect ticket handling follow F05–F07.
No automatic acceptable-difference, process-loss, Residual/Scrap, shipment-weight,
price, invoice or settlement effect. If factory decisions require out-of-scope
calculation/correction/attachment, stop and revise scope before implementation.

## Conditional Definition of Done and acceptance/test strategy

All conditions below are **proposed / unexecuted**. Factory dependencies in brackets
must be resolved; passing technical tests cannot supply their answers.

1. Actual ticket evidence and necessary F01–F08 answers are recorded with provenance,
   Owner-confirmed policy reconciled with live OQs/contracts, plan/criteria finalized,
   and matching exact product gate/unlock explicitly Owner-approved. No broad OQ closure.
2. Existing v1/no-ticket receipt tests pass unchanged in behavior; optional ticket
   mode follows final schema without mandatory PO/Finance/QC. Existing base receipt
   read fields/authority remain compatible; ticket fields use only approved readers.
   A v2/fresh-key attempt cannot attach evidence to an already-posted v1 receipt.
   [F02/F03/F08]
3. Unit/HTTP tests cover exact allowlists, nested-object bounds, paper-to-material-kg
   mapping, approved source/time/reason fields and safe invalid/error cases; no
   Number coercion/rounding or guessed age/tolerance. [F03/F05/F06]
4. Real PostgreSQL proves receipt/evidence FK and approved source-use constraints,
   valid reuse/reprint cases, conflicting source reuse and distinct-person same-source
   races without duplicate ticket-linked stock. Receipt/source identities and tested
   guarantee limits are documented; no-ticket misuse procedure is acknowledged. [F04/F06]
5. Trusted recorder/time, current recording/read/replay authority, revocation after
   waits, forged-principal/mass-assignment and cross-organization/customer/unrelated-role
   denials pass, including the agreed ACT-SEC field policy. [F01/F02]
6. Real database failure windows at evidence, receipt/origin, stock and audit/outcome
   roll back the whole bundle; accepted/rejected same-key replay and unknown-COMMIT
   retry produce no extra facts. Existing recovery admission fence remains intact.
7. Migration install/replay/failure/constraint and restricted runtime privilege proof
   pass on the acknowledged isolated Windows PostgreSQL environment. Prior migration
   bytes, dependencies, pins/root scripts and sole IPS ownership remain preserved.
8. Evidence history is immutable; reference-only custody/retrieval, unusable/disputed
   paper and pre/post-error escalation match recorded decisions. No correction bypass
   or unseen-paper duplicate guarantee is claimed. [F05/F06/F07]
9. Relevant accepted Inventory/receiving/Identity and module-boundary regressions
   pass; Sales/Shipment/Production/Purchasing/Finance behavior and their contracts
   gain no ticket-triggered effect or prerequisite. Both receipt-version parsers
   and composition effect validation enforce the admitted core kg/type/location/
   source fact without losing full request binding or weakening IPS guards.
10. Independent engineering/API/database/test/security review, required fixes,
    canonical implementation docs, final checks including git diff --check and
    coherent local commit complete. Stop for Owner push; no remote push.

Use existing frozen Windows root scripts and real isolated PostgreSQL for persistence,
locks/concurrency/audit/crash behavior. Never mock the database property under test.
No device test, scan/upload/browser E2E or dependency upgrade is part of this slice.
Factory validates real worked examples/fallback and custody/escalation at separately
authorized UAT; production deployment/cutover remain separate approval gates.

## Current preparation evidence and next action

This task changes documentation only, not command registrations, APIs, migrations,
runtime permissions or gate/unlock. Independent engineering and proportionate
security planning review: PASS for all eleven Markdown changes against Owner
authority, receiving/factory sources, current receipt contracts/composition and
security baselines. One required plan clarification was closed: versioned owner/
composition validation must derive the same core intake without losing full
request binding or weakening effect guards. No blocking/required or known high/
critical planning findings remain. This is static documentation/control review,
not implementation security acceptance or factory policy approval.

Windows source/link/scope checks: PASS, eleven Markdown-only files, 529 local
references resolve, metadata present and every F01–F08 question mapped; current
implementation authorization remains false. Working/staged git diff --check and
final staged source/scope review PASS. Offline Graphify 0.9.79 refresh: 508 tracked
files / 4592 nodes / 9984 edges, network blocked; query locates this plan and source
links. Graph output stays ignored. The local documentation SHA is reported in
the completion message. Application/database tests are
not rerun; no runtime/device probe, advisory audit, network research or new
product test result is claimed. All implementation test obligations remain pending.

Next: return the [factory answers and genuine sanitized examples](../00-governance/WEIGHBRIDGE_FACTORY_CLARIFICATION.md),
reconcile choices and finalize this plan; then request explicit Owner product
gate/unlock approval for the exact bounded implementation. Pending answers are
not timeouts that can be resolved by a default. Backend accepted capability count
remains eleven; this preparation is not a twelfth capability. Finance-Lite remains
partial and the remaining weighbridge/device, visibility/reporting/UI, financial,
correction/restoration, factory UAT and cutover backlog remains tracked.
