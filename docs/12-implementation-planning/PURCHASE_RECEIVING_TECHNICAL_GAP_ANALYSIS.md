---
id: PLAN-INBOUND-GAP-001
title: Purchase and receiving Step 2 technical gap analysis
phase: 12-implementation-planning
status: in_review
version: 0.3.0
owners: [chief-solution-architect, delivery-lead]
depends_on: [APR-032, SRC-004, DOM-INBOUND-REQ-001, DOM-INBOUND-FIELDS-001, DOM-INBOUND-TRACE-001, DOM-INBOUND-RECON-001]
last_reviewed: 2026-10-20
approval: null
supersedes: null
---

# Step 2 technical gap analysis — DRAFT / NOT AUTHORIZED FOR IMPLEMENTATION

Current scope update: [APR-034](../00-governance/approved-baselines/APR-034-i1-detailed-design.md)
explicitly authorizes Step 3 detailed design of I1 only. The [six-file proposed
design package](I1_PURCHASE_ORDER_DOMAIN_DESIGN.md) cross-links this actual-code
evidence; older readiness/stop statements below are historical. No implementation,
product gate or I2 final-design authority follows. Runtime observations are unchanged.

Subsequent status: [APR-033](../00-governance/approved-baselines/APR-033-i1-policy-clarification.md)
records Owner acceptance of the v0.1 Step 2 analysis at
`b8666b76602f2d002c4cacc5e8b689fe0130fb24`; remote push is unconfirmed. Acceptance
does not approve proposed technical choices. The separate [SRC-005 policy amendment
and I1 readiness assessment](../02-domain-business-architecture/PURCHASE_RECEIVING_I1_POLICY_AMENDMENT.md)
resolves the specified B01/B07/B08 portions, requires both-role extensible catalogue
addition and adds 12 supplemental requirements. I1 is ready for explicit Step 3
authorization, with technical design required; Step 3 remains unauthorized.
The code catalogue and dated review/check evidence below describe the accepted
Step 2 snapshot, not a fresh product test or current-policy blocker list. Current
business disposition is in the updated decision register; I2 residuals stay open.

Analysis baseline: actual working repository at accepted/pushed Step 1 commit
`5399e2f74dac0cdcb633e8cadb9a51124a14d0d8`. The Owner accepts all four Step 1
documents as requirements input; [APR-032](../00-governance/approved-baselines/APR-032-inbound-gap-analysis.md)
records that actual decision and authorizes Step 2 only. Read the accepted
[workflow](../02-domain-business-architecture/PURCHASE_RECEIVING_REQUIREMENTS_BASELINE.md),
[fields](../02-domain-business-architecture/PURCHASE_RECEIVING_FIELD_REGISTER.md),
[trace](../02-domain-business-architecture/PURCHASE_RECEIVING_REQUIREMENTS_TRACE.md),
[preliminary reconciliation](../02-domain-business-architecture/PURCHASE_RECEIVING_RECONCILIATION.md)
and [SRC-004](../00-governance/team-answers/FACTORY_PURCHASE_RECEIVING_2026-10-20.md)
before comparing code. Existing architectural constraints outrank an unapproved
technical option; neither a conceptual diagram nor absent implementation proves a
factory rule. The eleven accepted backend capabilities remain intact.

Execution plan: read accepted inputs; inspect owner contracts/services/transports,
SQL, Identity/envelope/IPS and relevant test bodies; classify all 48 requirements
separately from policy/design blockers; compare atomicity/compatibility options;
independently review architecture/security and validate documentation; commit
locally and stop before Step 3. No runtime, migration, API contract, executable
permission, dependency or product gate/unlock change is part of this task.

## Deliverable map and classification

- [48-row requirements coverage matrix](PURCHASE_RECEIVING_COVERAGE_MATRIX.md):
  existing evidence, current status, concrete gap, business gate, technical dependency,
  proposed increment and future acceptance for every requirement.
- [Architecture impact assessment](PURCHASE_RECEIVING_ARCHITECTURE_IMPACT.md): owner
  boundaries, seven critical problems, atomic options, security and all-capability regressions.
- [Decision register](PURCHASE_RECEIVING_DECISION_REGISTER.md): Q1–Q11 reassessment,
  genuine business questions, governed policies, technical decisions and deferrals.
- [Proposed delivery roadmap](PURCHASE_RECEIVING_DELIVERY_ROADMAP.md): dependency-aware
  increments, acceptance obligations, compatibility and approval gates.

IMPLEMENTED means the exact scoped requirement is supported by inspected existing
code, not merely a similar field name. PARTIAL means relevant implementation is
present but incomplete. NOT IMPLEMENTED means the required behavior is absent.
BLOCKED BY POLICY and DESIGN REQUIRED describe separate unresolved dimensions;
the matrix keeps them in business-gate/technical-dependency columns instead of
hiding whether code exists. An absent optional field is still missing functionality.
Governance-only requirements are explicitly identified and never counted as a
new runtime feature. No percentage of implementation completeness is inferred.

## E01 Purchasing evidence

Actual sources: [purchase-contracts.ts](../../apps/backend/src/modules/procurement/purchase-contracts.ts)
(`CompletedPurchaseInput`, `PurchaseProformaInput`, `PurchaseStore`),
[purchase-service.ts](../../apps/backend/src/modules/procurement/purchase-service.ts)
(`parseCompletedPurchase`, `parsePurchaseProforma`, `PurchaseService.contracts/record/get`),
[purchase-store.ts](../../apps/backend/src/infrastructure/postgresql/purchase-store.ts)
(`PostgresPurchaseStore`), [purchase-http.ts](../../apps/backend/src/transport/purchase-http.ts)
(`createPurchaseHandler`) and [0015](../../database/migrations/0015_purchasing_evidence.sql).

Two implemented v1 commands record completed purchase evidence and already-sent
proforma evidence. Completed input is exactly purchaseDocumentReference,
supplierReference, purchaseDate and materialDescription. Proforma input is
purchaseId, proformaReference and sentDate. UUID-keyed, organization-scoped records
retain trusted issuer/subject/request/key/DB record time; no reference uniqueness,
supplier master, ordered lines/count/W1, arrival, progress, receiving or stock port.
Reads are exact UUID lookups, not seller-order lookup or grouped receiving views.
POST `/purchasing/purchases|proformas` and their UUID GET routes are documentary only.
Closed schemas reject unknown fields; existing date/text bounds are technical
constraints for these records, not newly approved factory-field formats.

Inspected test definitions: [unit purchase](../../apps/backend/tests/unit/purchase.test.ts),
“completed purchase needs no proforma and uses only its own evidence store on the
supplied transaction”; [integration purchase](../../apps/backend/tests/integration/purchase.test.ts),
“completed purchase and later optional sent-proforma retain descriptive facts and
personal attribution without foreign writes” and “matching documentary references
do not invent supplier-master or unique document-number policy”. Thus a new PO
must coexist; it cannot be obtained by renaming this evidence or matching text.

## E02 Current receipt command

Sources: [contracts.ts](../../apps/backend/src/modules/procurement/contracts.ts)
(`ReceiptInput`, singular `ReceiptRecord`/`StockIdentity`, `InventoryReceiptPort.receive`),
[receipt-service.ts](../../apps/backend/src/modules/procurement/receipt-service.ts)
(`parseReceiptInput`, `ReceiptService.contract/post/get`),
[receipt-http.ts](../../apps/backend/src/transport/receipt-http.ts)
(`createReceiptHandler`) and [receipt-store.ts](../../apps/backend/src/infrastructure/postgresql/receipt-store.ts)
(`PostgresReceiptStore.lock/find/create/changeState/finish`).

PostGoodsReceipt v1 targets one goods-receipt UUID. Required input: internalCode,
count, measuredKg, type and locationId; productCode additionally required for SHEET,
optional for other types. Count is a nonnegative whole descriptive string; measuredKg
is positive whole kg. These are existing constraints, not a full new 23-field schema.
Only this six-name allowlist is admitted, version 2 is rejected, and preconditions
are empty. No PO/line, waybill/arrival, external receipt number, actual-vs-ordered
attributes, W2/W3 or progress appears in the contract.

One call composes DRAFT→RECEIVED→POSTED, calls one Inventory receive port and stores
singular Lot/Unit/material/effect UUIDs. Internal Code is required nonunique evidence.
Scoped receipt UUID reuse yields matching DUP or changed CONFLICT under owner lock;
full same-key replay belongs to E05. No PO/ticket is required. A descriptive count
of 2 still creates ONE Inventory Unit; it does not identify two physical coils.

Inspected [unit receipt](../../apps/backend/tests/unit/receipt.test.ts): “receipt
intake contract rejects unknown or future fields and invalid UTF8 metadata” tests
purchaseOrderId/ticketId/expectedKg rejection, and unsupported version tests deny v2.
[Integration receipt](../../apps/backend/tests/integration/receipt.test.ts):
“manual factory intake creates one atomic received/posted origin and exact available
kg without a ticket or purchase order”; “Internal Code is descriptive and can be
reused for distinct receipt identities”; “fractional, zero, negative, exponent and
unsafe representations reject; descriptive count never converts stock”. These
positive/negative tests prove why adding scalar fields cannot deliver the new grain.

## E03 Inventory origin and schema grain

Sources: [InventoryReceiptService.receive](../../apps/backend/src/modules/inventory/receipt.ts),
[PostgresInventoryReceiptStore](../../apps/backend/src/infrastructure/postgresql/inventory-receipt-store.ts)
and [0006_goods_receipt.sql](../../database/migrations/0006_goods_receipt.sql).
Inventory allocates one Lot/Unit/material/effect UUID, posts one STOCK_IN and writes
one immutable material_lot origin through its owner adapter on the caller transaction.
The origin adapter has no Ledger/Balance write capability. Schema 0006 has scoped
unique receipt_id, unit_id, material_id and effect_id on material_lot, and no unique
internal_code. It also enforces Sheet productCode partial uniqueness, which is
neither universal physical-code uniqueness nor factory Product Number semantics.

Origin includes current intake evidence but no PO/line/arrival/waybill/discrepancy
or W1 source designation. [Integration receipt](../../apps/backend/tests/integration/receipt.test.ts)
tests standalone-Sheet identity/ancestry and concurrent Sheet-code reuse; these
must survive. Legacy count/weight cannot be split into guessed historical physical
units. No raw old migration, original measuredKg or immutable Ledger may be rewritten.

## E04 IPS arithmetic and locks

Sources: [posting contracts](../../apps/backend/src/modules/inventory/contracts.ts),
[InventoryPostingService.post/sourceQuantities](../../apps/backend/src/modules/inventory/posting-service.ts),
[Kg](../../apps/backend/src/modules/inventory/quantity.ts),
[PostgresInventoryStore.lock](../../apps/backend/src/infrastructure/postgresql/inventory-store.ts)
and [0005](../../database/migrations/0005_inventory_posting.sql).
IPS accepts an existing opaque transaction and 1–128 effects, snapshots inputs,
rejects repeated effect identities, locks all Unit/effect/claim resources in sorted
actual bigint-key order, rechecks authority, validates owner effects, and updates
immutable Ledger, rebuildable Balance and lifecycle/claims together. Sorted row
locks/fresh READ COMMITTED reads and exact Ledger/Balance checks are reusable.

Important precision distinction: general Kg/IPS supports exact scaled BigInt
arithmetic with up to 18 fractional places; [ADR-0015](../00-governance/adrs/ADR-0015-inventory-posting-kernel.md)
explicitly calls that technical capacity, not factory measurement precision.
Whole-kg receiving is enforced by E02/E03 and its owner policy/schema. Preserve
whole-kg W1 admission without reducing/changing the IPS arithmetic type or rounding
W2/W3 evidence. Current 128 effects is a technical batch bound, not an approved
factory unit/line limit; payload/result/time limits can be tighter.

Inspected [integration inventory](../../apps/backend/tests/integration/inventory.test.ts):
“exact kg posting persists tiny fractions without floating-point loss”; “multiunit
reverse input order uses stable locks and persists exactly both accepted batches”;
“a rejected later posting leg rolls back earlier unit, fact and reservation changes
atomically”; “Ledger stays immutable while missing and drifted Balance can be
reconstructed without new history”. Batch capacity does not make E02 multiunit.

## E05 Envelope, transaction, recovery and audit

Sources: [binding.ts](../../packages/shared-kernel/src/envelope/binding.ts)
(`outcomeKey`, `bindCommand`, `sameBinding`),
[execute.ts](../../packages/shared-kernel/src/envelope/execute.ts) (`executeCommand`, handler savepoint),
[PostgresTransactions/transactionClient](../../apps/backend/src/infrastructure/postgresql/transaction.ts),
[outcome-store.ts](../../apps/backend/src/infrastructure/postgresql/outcome-store.ts)
and [audit-store.ts](../../apps/backend/src/infrastructure/postgresql/audit-store.ts).
Key scope is installation/authority/key; immutable issuer/subject, command/version,
target, complete canonical payload/preconditions bind intent. Original accepted
and rejected outcomes replay only after current execution/disclosure authority.
Handler savepoint removes tentative business effects before durable rejection;
technical/deadlock/audit failures abort the whole transaction. Unknown COMMIT is
uncertain, resolved on primary with the same bound key, never fresh source IDs.

Inspected [receipt integration](../../apps/backend/tests/integration/receipt.test.ts)
tests same-key changed reuse, new-key receipt DUP/CONFLICT, distinct-user receipt
races, rejection/technical/audit rollback, revocation during lock wait and
“lost server-confirmed COMMIT response replays the committed receipt without
duplicating its stock origin”. [Transaction tests](../../apps/backend/tests/integration/transaction.test.ts)
exercise READ COMMITTED/savepoints, read-only REPEATABLE READ, timeout/deadlock/
serialization aborts and context invalidation. [Receipt HTTP](../../apps/backend/tests/integration/receipt-http.test.ts)
checks the default recovery admission fence. None of these mechanisms discovers
the same physical unit supplied again under fresh receipt/effect/source IDs.

## E06 Identity, authority and current read surfaces

Sources: [IdentityAuthorization.canExecute/canReplay](../../apps/backend/src/modules/identity/authorization.ts),
[IdentityService](../../apps/backend/src/modules/identity/service.ts),
[composition-root.ts](../../apps/backend/src/composition-root.ts)
(`org`, `current`, `canRead`, `canPost`, purchasePolicies, query/purchaseQuery),
[purchase HTTP](../../apps/backend/src/transport/purchase-http.ts) and
[receipt HTTP](../../apps/backend/src/transport/receipt-http.ts).
Current personal organizational ACT-PROC records/reads completed-purchase/proforma
evidence. ACT-WH posts legacy receipt; ACT-WH/ACT-SEC read receipt/Unit/Lot. Customer
scope, forged/copied context, stale grants and arbitrary role selectors confer no
permission. Queries are installation/authority scoped, not restricted to the creator.
ACT-SEC administration is not automatic purchasing/documentary access.

[Purchase HTTP integration](../../apps/backend/tests/integration/purchase-http.test.ts)
explicitly denies WH/SEC/CUST documentary reads; [receipt HTTP integration](../../apps/backend/tests/integration/receipt-http.test.ts)
denies ACT-PROC receipt/stock reads and permits the approved SEC base reads. No
operational PO endpoint/query exists. Masoumi cannot register required operational
lines or read PO-grouped progress; Karimi cannot retrieve operational PO specs.
New narrow owner reads require an explicit policy, not a changed role header.

## E07 Genealogy source facts and isolation

Sources: [GenealogyReceiptOrigin](../../apps/backend/src/modules/genealogy/contracts.ts),
[origin traceSources](../../apps/backend/src/infrastructure/postgresql/inventory-receipt-store.ts),
[GenealogyProjection](../../apps/backend/src/modules/genealogy/projection.ts) and
[genealogy composition](../../apps/backend/src/composition-root.ts).
Current origin traverses receipt/Lot/Unit/material/effect with Internal Code,
count/measuredKg/type/location/productCode; no PO/line/arrival or discrepancy.
Origin edges use RECEIPT_TOTAL, currently valid for the existing receipt grain.
Trace reconstructs owner facts under read snapshot/current customer authority;
genealogy is not an editable source or a license to expose sibling customers.

Inspected [genealogy integration](../../apps/backend/tests/integration/genealogy.test.ts):
standalone incoming Sheets trace through actual package dispatch and split/merge
avoids fabricated parent kg. [Security tests](../../apps/backend/tests/integration/genealogy-security.test.ts):
“shared origin exposes only the selected customer branch before row bounds, even
with 257 foreign facts”, coherent old/new snapshots and post-snapshot revocation.
New incoming Unit origins must work through these ports without disclosing the
whole truck's other POs/units, driver or business documents to a customer trace.

## E08 Downstream owners and regression evidence

Inspected [Sales contracts](../../apps/backend/src/modules/sales/contracts.ts),
[Shipping contracts](../../apps/backend/src/modules/shipping/contracts.ts),
[Production contracts](../../apps/backend/src/modules/production/contracts.ts) and
[invoice evidence contracts](../../apps/backend/src/modules/finance/contracts.ts).
Sales stock demand and reservations bind existing Units; Shipping uses reserved
whole-Unit kg; Production consumes/outputs exact source kg and preserves lineage;
Finance-Lite records invoice reference/date/order/customer only. Arrival totals,
receiving mismatch and PO progress create no new side effect in those owners.

Relevant existing acceptance definitions: [sales](../../apps/backend/tests/integration/sales.test.ts),
[reservations](../../apps/backend/tests/integration/reservation.test.ts),
[shipping](../../apps/backend/tests/integration/shipping.test.ts),
[shipping boundaries](../../apps/backend/tests/integration/shipping-boundaries.test.ts),
[production concurrency](../../apps/backend/tests/integration/production-concurrency.test.ts),
[production integrity](../../apps/backend/tests/integration/production-integrity.test.ts),
[invoice evidence](../../apps/backend/tests/integration/invoice-evidence.test.ts) and
[identity](../../apps/backend/tests/integration/identity.test.ts).
The [architecture assessment](PURCHASE_RECEIVING_ARCHITECTURE_IMPACT.md) maps specific
regression risks and new obligations; existence of these tests is not fresh pass evidence.

## E09 Architectural, gate and static boundary evidence

Read accepted [ownership](../02-domain-business-architecture/MODULE_OWNERSHIP_MATRIX.md),
[dependency rules](../09-repository-documentation/DEPENDENCY_AND_IMPORT_RULES.md),
[invariants](../03-state-machines-invariants/INVARIANT_CATALOGUE.md),
[ADR-0011](../00-governance/adrs/ADR-0011-command-idempotency.md),
[ADR-0014](../00-governance/adrs/ADR-0014-local-identity-authorization.md),
[ADR-0016](../00-governance/adrs/ADR-0016-manual-goods-receipt.md),
[APR-027](../00-governance/approved-baselines/APR-027-purchasing-evidence-scope.md),
[technical freeze](TECHNICAL_FREEZE.md) and the relevant historical
[ticket plan](WEIGHBRIDGE_IMPLEMENTATION_PLAN.md)/[F form](../00-governance/WEIGHBRIDGE_FACTORY_CLARIFICATION.md).
[check-boundaries.mjs](../../tools/build/check-boundaries.mjs) contains explicit
Inventory/origin/receipt/purchase/Finance/other owner SQL/import checks: new approved
sources must later extend them, not bypass them. No check/script/dependency changes now.

Read-only inspection of [.cursor/architecture-gate.json](../../.cursor/architecture-gate.json)
shows the existing product baseline APR-028, not this workflow. Its existing true
implementationAuthorized flag is NOT authority for Step 2 product writes. The
actual Owner task expressly prohibits them. Exact allowed paths/commands and a
matching approved gate/unlock would be future requirements only after policy,
Step 3 and explicit implementation authorization. No control/ignored unlock was edited.

## Analysis outcome and evidence limits

The kernel, transactions, trusted identity and legacy single-unit receipt are
reusable. Operational PO/line identity, source/cardinality, multiunit confirmation,
ordered/actual history, progress and both required read directions are missing or
conflicted. Full field storage cannot be inferred from textual analogues such as
purchaseDate, measuredKg, productCode or descriptive count. No global physical
dedup guarantee can be made while an uncorrelated legacy path accepts fresh IDs.

All runtime/test observations above are **static source inspection**. Historical
accepted implementation reports are context, not new execution. Documentation-only
source/link/coverage/diff checks and independent reviews are recorded before the
local commit. No application/database tests, UAT, production acceptance or implemented
new behavior is claimed. Step 3 is not authorized; its blocking inputs are stated
in the decision register, and no proposed choice is silently approved here.

## Review closure and documentation validation (2026-10-20)

Independent reviewers did not author or edit this package:

| Review | Result and scope | Findings / disposition |
| --- | --- | --- |
| inbound_architecture_review | PASS, actual source/test comparison, owner ports, seven critical problems, lock/transaction/recovery, W1 and all eleven regressions | Three required evidence-label corrections in coverage: actor persists through PostgresReceiptStore/0006 rather than ReceiptRecord; DB created_at is not an entered arrival date; non-SHEET productCode is optional while SHEET requiredness/uniqueness are specific. All corrected and independently reverified; no required findings remain. |
| clarification_review | PASS, security/policy plus final governance/acceptance/navigation | Narrow conditional reads, trusted context/current grants/replay, sensitive arrival and customer trace exposure, mixed-path identity and Q1–Q11 checked. Same actor pointer corrected; nonblocking suggestion to include APR-032 in CURRENT_PHASE dependency metadata applied. No required or known high/critical planning findings remain. |
| weighbridge_evidence_review | PASS, exact requirements/fields/current-code classification and corrected evidence | Reverified all three required corrections; 48 unique rows, Persian terms/actors/requiredness and unchanged Step 1 tables; no residual required findings. |

Windows PowerShell with the existing pinned Graphify Python's standard library
performed documentation checks (not product tests):

- Exactly 48 distinct primary rows: 25 workflow and 23 field requirements, each
  with nine requested analysis columns. Current classifications: 30 NOT IMPLEMENTED,
  15 PARTIAL, two IMPLEMENTED existing guards/baseline, one IMPLEMENTED governance-only.
  No field has complete factory semantics implemented. These counts are not a
  project-completion percentage or a twelfth backend capability.
- Exact 23 Persian labels and actor/requiredness mappings match the accepted
  dictionary: Masoumi 12 (7 mandatory/5 optional), Karimi 11 (6 mandatory/5 optional),
  total 13 mandatory/10 optional. All 11 Q dispositions present.
- All table rows in each of the four accepted Step 1 files compared with the
  accepted HEAD commit and are unchanged. Only acceptance metadata, banners and
  navigation changed. SRC-004 and runtime/migration/control files are unchanged.
- All 17 changed/new files are Markdown documentation. Frontmatter required keys
  and 13 newly introduced metadata dependency IDs resolve; inherited register IDs
  were not misclassified as standalone document IDs. All 710 local file links and
  heading references in the changed package resolve.
- Working and staged `git diff --check` passed; final staged/source-scope review
  contains only the 17 Markdown files. Pinned Graphify 0.9.79 local network-blocked
  refresh passed: 521 files, 4,679 nodes and 10,224 edges in ignored local output.
  Its structural graph remains navigation aid, not implementation/policy evidence.

Business blockers B01–B09, technical design D01–D08 and deferred B10/lifecycle/device
branches remain explicit. Their existence is a planning outcome, not an unclosed
documentation defect. Final detailed design cannot be finalized for the affected
scope until those business inputs are reconciled, and Step 3 still requires explicit
Owner authorization. The recommended next action is the decision round in the
register. **Stop after this Step 2 documentation delivery.**
