---
id: APR-028
title: Finance-Lite invoice evidence scope and Purchasing acceptance
phase: 12-implementation-planning
status: approved
version: 1.1.0
owners: [project-sponsor]
depends_on: [APR-018, APR-019, APR-027]
last_reviewed: 2026-10-10
approval: Project Owner explicit continuation and bounded invoice-evidence policy replies
supersedes: null
---

# Owner decision and invoice-evidence authority

The Owner formally accepts SLICE-PURCHASE purchasing and confirms pushed commit
`b2619790ca7f20a57978279cd7392199c331f0b3`, including its reported 170 unit and
240 actual PostgreSQL tests and closed independent engineering/security findings.
No repeat Purchasing approval is needed. This is an actual user-message record,
not a fabricated signature, fresh test run, factory UAT or production approval.

The initial Finance-Lite continuation was conditional on sufficient policy;
analysis stopped at unresolved commercial/payment inputs. The subsequent actual
Owner scope decision and supplemental clarification authorize **Invoice Evidence
First**. Keep the manufacturer's workflow simple. Record evidence of an already
issued customer invoice; do not generate invoices or calculate/settle money.

Current individually authenticated organizational ACT-SALES may record/read
invoice evidence for its authorized organization. Organizational ACT-FIN may read
only. ACT-SEC administers grants but receives no automatic document access.
Customer-scoped grants, ACT-CUST, Procurement, Production, Warehouse and unrelated
roles receive no access through their existing permissions. Role names already
exist in Identity. Personal grants are explicit/revocable; names/titles do not
confer authority. This bounded decision supersedes the earlier architectural
ACT-FIN write / ACT-SALES own-order read catalogue only for invoice evidence;
monetary invoice/payment commands remain unimplemented and policy-gated.

Minimum facts: scoped evidence UUID, supplied invoice document reference, actual
issue date, existing Sales order and matching customer, system-derived personal
issuer/recorder attribution and database recording timestamp. Validate exact
installation/organization/order/customer through Sales-owned contracts. Do not
create a duplicate Sales/Customer master. Report a material missing dependency
instead of bypassing ownership or inventing authority.

UUID and bound command key control identity/replay. No unique document-reference,
one-invoice-per-order, official numbering/sequence or unapproved timing policy.
Different genuine documents may share an order or document reference. Evidence is
immutable; atomic fact/outcome/audit, safe recovery, current authorization and
restricted database privileges remain mandatory.

Excluded: amounts/prices/tax/discount/totals, final commercial kg/weighbridge,
cutting charges, funds/deposit/cheque/note/credit/balances, allocations/settlement,
external upload evidence/integration, attachments/PDF/transmission, corrections,
UI and automatic Sales/Inventory/Production/Shipment/Procurement changes. Factory
invoice and external accounting responsibilities remain distinct. Commercial and
payment residuals stay OPEN for their future affected increments, not prerequisites
of this evidence-only scope. OQ-012 remains answered, operational Finance-Lite only.

Architecture APR-018 and standing scope-recording delegation APR-019 remain.
Reconcile [plan/DoD](../../12-implementation-planning/FINANCE_LITE_PLAN.md), contracts,
and matching canonical gate/local unlock before product writes. Execute Windows
checks, actual PostgreSQL tests and independent engineering/security review;
close required findings, document and commit locally. Stop for Owner acceptance
and push; no remote push, deployment or unrelated backlog work. Later monetary
invoicing/payment allocation needs separate business policy and Owner approval.
