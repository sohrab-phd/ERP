---
id: ADR-0016
title: Atomic manual Goods Receipt and inventory origin
status: accepted
version: 1.0.0
owners: [chief-solution-architect, data-architect]
last_reviewed: 2026-10-08
approval: null
---

# ADR-0016 — Atomic manual Goods Receipt

Engineering mechanism in actual Owner scope/policy
[APR-021](../approved-baselines/APR-021-receipt-increment-scope.md).
Preserves ADR-0011/0014/0015, Modular Monolith, direct PostgreSQL and the sole IPS
writer. This technical decision creates no additional product authorization.

## Decision

Expose PostGoodsReceipt v1 to current individually authenticated ACT-WH only.
Procurement owns the receipt lifecycle/evidence; Inventory owns origin/stock
identities. Compose DRAFT -> RECEIVED -> POSTED within the admitted envelope
transaction. A mandatory purchasing record or invented external ticket is not
required by the Owner's normal manual receiving policy. No Procurement quantity
writer, named-user hardcoding, QC, discrepancy tolerance or reversal is introduced.

A stable receipt document UUID is allocated before the first attempt and retained
with the lowercase UUID-v4 command key across uncertainty. It is distinct from
Internal Code, Lot, material identity and Unit UUID. Internal Code is required
nonunique evidence. Under its scoped absent-object advisory lock, matching
receipt UUID with a new key rejects GUARD_IDEMPOTENT_DUP; changed intake rejects
GUARD_CONFLICT. Same bound key replays original accepted/rejected outcome through
the envelope. Matching descriptive fields across distinct document UUIDs do not
prove a physical duplicate; actual future device/source identifiers need their
accepted integration specification. This preserves OQ-011 rather than inventing
an external identifier or universal deduplication policy.

Canonical whole measured kg is positive and below 10^20; Count is a nonnegative
whole descriptive string within the same technical bound. No Number coercion,
conversion or numeric typmod rounding. Existing IPS exact-kg capacity remains.
Type is COIL/SHEET/ANGLE/BEAM/OTHER; optional product code for other types implies
no universal uniqueness. The existing standalone-Sheet identity requirement is
scope-unique, distinct from Internal Code; no Coil ancestry is fabricated.
Location UUID is Unit placement metadata, not a new location-master workflow.

Allocate Lot/Unit/material/effect UUIDs inside the Inventory owner port. Call
IPS STOCK_IN once, then persist Inventory material_lot origin. Receipt, origin,
Unit, Ledger, Balance, durable outcome and original command audit commit or abort
together. The owner port receives the same opaque transaction, never a pool or
commit capability. Procurement adapter never writes Inventory; Inventory origin
adapter never writes stock tables. Runtime cannot update/delete Ledger or origin.

After preliminary nonlocking current-authority admission, transaction lock order
 is envelope key, Identity account/session, receipt document,
Sheet product code when applicable, then IPS's sorted Unit/effect locks. Each
command has one receipt and one intake stock effect. After owner-lock waits use
fresh READ COMMITTED reads. Distinct Warehouse accounts in concurrent tests ensure
Identity row locking does not substitute for receipt/product-code race proof.
Technical lock/connection failure aborts without a cached business rejection;
unknown COMMIT remains uncertain and resolves by the same key on primary.

Scoped GetGoodsReceipt/GetInventoryUnit/GetLot read current org Warehouse/security
permissions. Inventory validates Ledger against Balance/claims under IPS locks;
on-hand/reserved/available are exact strings. Receipt measured kg is retained
intake evidence, not a second current stock truth. No customer/portal/all-customer
route, direct Balance edit or HTTP projection rebuild is introduced.

Production command admission remains default-off. Set the explicit validated
COMMAND_ADMISSION_RECONCILED flag only for the original or operator-reconciled
primary. Disable before lossy restore/recovery and keep traffic fenced until
acknowledged/uncertain history is reconciled. Absence from restored storage is
never proof of nonexecution. This minimal operator activation is not a complete
backup/recovery automation product; that later backlog remains unchanged.

## Consequences and proof

One authenticated manual command produces attributable stock without PO/QC
bureaucracy. Backend routes are delivered; factory UI, location masters, optional
purchasing reference contract, device ingestion, discrepancy/returns/corrections
and opening stock remain outside this increment.

Migration0006 adds scoped receipt/origin tables, exact whole-numeric checks,
Sheet partial uniqueness and receipt/Unit-Lot FKs. Existing migrations/pins/root
script bodies are preserved. Real PostgreSQL tests exercise outcome replay,
conflicting reuse, distinct-user races, origin/ledger/projection linkage,
rollback, audit failure, revoked authority and server-confirmed COMMIT reply loss.
See [actual delivery](../../12-implementation-planning/SLICE_PURCHASE_RECEIPT_IMPLEMENTATION_STATUS.md)
for executed evidence and independent findings.
