---
id: PLAN-FINANCE-LITE-001
title: Finance-Lite invoice evidence plan and Definition of Done
phase: 12-implementation-planning
status: accepted
version: 0.2.0
owners: [delivery-lead, chief-solution-architect]
depends_on: [APR-028, PLAN-IMPLEMENTATION-BACKLOG-001, INV-012, INV-014, INV-015, INV-016]
last_reviewed: 2026-10-10
approval: APR-028 bounded Owner scope; engineering DoD accepted with independent review
supersedes: null
---

# Finance-Lite — Invoice Evidence First

Authority: [actual Owner decision APR-028](../00-governance/approved-baselines/APR-028-finance-lite-continuation.md).
Starting accepted/pushed HEAD: `b2619790ca7f20a57978279cd7392199c331f0b3`.
The initial planning stop was resolved by the Owner's explicit documentary fields,
access policy and deferral of commercial/payment branches. Do not infer any answer
to [live commercial/payment residuals](../00-governance/registers/OPEN_QUESTIONS.md#sales-invoice-and-payment-factory-evidence-2026-09-30).

## Goal, users, dependencies and exclusions

Record immutable evidence of a customer invoice already issued by the Sales
workflow. Mr. Pour-Ebrahim prepares/issues the customer invoice; Mr. Ghaffari
registers a corresponding document in a separate accounting system. This internal
backend records only the former evidence with trusted attribution; explicit
personal software grants remain separate from those organizational names.

Finance-Lite owns the evidence under [SLICE-STOCK](../00-governance/registers/SLICE_HOMES.md).
Sales owns customer/order references. Identity owns personal accounts and grants;
the accepted envelope owns durable replay and atomic audit/outcomes. PostgreSQL
18.6 is canonical. ACT-SALES and ACT-FIN already exist in Identity's vocabulary.
No inventory port or stock effect is required; ACT-IPS remains sole poster.

Excluded: money, final commercial weight, cutting fees, payment/allocation,
credit/cheque/note lifecycle, numbering rules, external upload evidence/API,
files/PDF/sending, corrections, UI, portal access, business state changes and new
dependencies. Finance-Lite is operational, not legal GL (OQ-012). Payment/invoice
evidence never closes Sales Orders or becomes a shipment prerequisite.

## Minimal design and contracts

- `RecordIssuedInvoiceEvidence` v1, target `invoice-evidence` UUID; closed payload
  `invoiceDocumentReference`, `issueDate`, `salesOrderId`, `customerId`; empty
  preconditions. Reference is nonempty valid Unicode without controls, <=128
  UTF-8 bytes; issueDate is a real YYYY-MM-DD date in 0001-9999, with no guessed
  shipment/future-date rule. Sales/customer IDs use canonical UUIDs.
- `GetIssuedInvoiceEvidence` through keyed internal GET. Return only identity,
  approved documentary fields, trusted principal issuer/subject and DB recordedAt.
  No internal binding, secret/session data or financial state.
- Current organizational ACT-SALES writes/reads; current organizational ACT-FIN
  reads only. Reject temporary/customer-scoped grants and all unrelated roles.
  Identity rechecks the real personal grant before admission, after locks, replay
  disclosure and queries. Installation/authority come from trusted session
  context, never payload overrides. Every document retains owning customer ID.
- Sales owner validates explicit order/customer in the same transaction using
  its existing scoped SalesStore reference lookup and order-to-customer FK.
  Expose only a minimal owner reference result, not order commercial internals.
  No required order state was approved: do not invent confirmed/delivered gates.
  Finance-Lite never imports Sales store/table internals or changes Sales state.
- Add `finance.invoice_evidence`, scoped PK `(installation_id,authority_scope,
  evidence_id)`, documentary facts, immutable binding, personal issuer/subject,
  ACT-SALES, request/key and DB clock timestamp. Scoped FK ties order/customer to
  existing Sales unique key; no reference uniqueness or one-invoice-per-order.
  Runtime SELECT/INSERT only. No financial invoice state machine is introduced.
- Advisory identity lock serializes first insert; current authority and a fresh
  lookup follow waits. New key/same UUID rejects DUP or CONFLICT; same bound key
  replays the accepted/rejected outcome. Fact/outcome/audit commit atomically.
  Unknown/mismatched/foreign Sales links reject safely without revealing records.
- POST `/finance/invoice-evidence` accepts only the matching command; GET
  `/finance/invoice-evidence/{uuid}` reads through owner policy. Existing bearer,
  bounded body, concurrency cap, safe error, Origin and timeout conventions apply.
  ACT role selector selects a granted role; it never grants authority.

## Execution plan and Definition of Done

1. Record Owner decision, reconcile scope/contracts/security/gate/unlock; verify
   Sales dependency through owner contracts before implementation.
2. Implement the evidence record, owner validation, command/query/transport and
   migration through established conventions; no unrelated refactoring.
3. Run pinned Windows checks and actual isolated PostgreSQL proof below.
4. Independent API/database/test/engineering and security review; fix required
   findings, retest, update actual implementation documentation and final diff.
5. After engineering DoD acceptance commit locally and stop for Owner acceptance/push.

Observable acceptance:

- Exactly approved facts recorded/read; server personal attribution/time, matched
  existing order/customer in the same organization, no cross-owner mutation.
  Repeated document references and multiple genuine evidence IDs per order work.
- Strict calendar/text/UUID/unknown-field validation; no actor/org/money/status
  mass assignment. Missing/mismatched/foreign order/customer rejected without leak.
- Personal organization ACT-SALES write/read, ACT-FIN read only; ACT-SEC/unrelated/
  portal/customer grants denied. Current revocation enforced after lock waits,
  replay and reads; foreign installation/organization facts are unavailable.
- Accepted AND rejected durable replay; changed target/payload/principal conflicts
  within a scoped key namespace, foreign-scope isolation, new-key UUID duplicate/
  conflict, concurrent different people converge
  on one evidence record. Uncertain commit/response-loss retry resolves one fact.
- Real PostgreSQL proves atomic rollback for handler/audit/outcome failure,
  constraints/FKs, exact scope, runtime UPDATE/DELETE denial and migration restart/
  checksum behavior with distinct restricted runtime and owner roles.
- Frozen root preflight/format/lint/boundaries/typecheck/unit/integration checks
  pass with no required test skipped; independent engineering/security required
  findings close and no high/critical issue remains. Actual behavior/limits are
  documented; final working/staged diff checks pass before the coherent local commit.

## Policy and progress boundary

The [command catalogue](../05-application-api-architecture/COMMAND_CATALOGUE.md),
[RBAC](../06-security-rbac-audit/ROLE_PERMISSION_MATRIX.md),
[customer isolation](../06-security-rbac-audit/CUSTOMER_ISOLATION.md) and
[ownership matrix](../02-domain-business-architecture/MODULE_OWNERSHIP_MATRIX.md)
record this bounded evidence exception. It does not authorize the architectural
invoice/payment lifecycle commands. Commercial pricing/currency/rounding,
weighbridge/fee/numbering, recording/allocation/balance/correction/credit and
external-system questions remain open for later approved increments.

Before this delivery, ten accepted capabilities are recorded in the
[Purchasing progress report](SLICE_PURCHASE_IMPLEMENTATION_STATUS.md#overall-committed-capability-progress).
The [implementation status](FINANCE_LITE_IMPLEMENTATION_STATUS.md) records the
completed DoD, actual 177 unit/260 PostgreSQL test proof, independent reviews and
eleventh delivered increment. Owner acceptance/push remain the next human gate.
