---
id: APR-046
title: Bounded Owner P2 warehouse receiving browser implementation authorization
phase: 12-implementation-planning
status: approved
version: 1.0.0
owners: [project-sponsor]
depends_on: [APR-043, APR-045, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-10-26
approval: Actual Owner CODEX IMPLEMENTATION DIRECTIVE — P2 issued in this chat attachment
---

# Actual P2 implementation authority

Source: Project Owner's **CODEX IMPLEMENTATION DIRECTIVE — P2 — Persian
Operational Warehouse Receiving and Confirmation UI**, explicitly issued in this
chat on2026-10-26. This records that directive, not an agent approval or acceptance.
Verified starting baseline: clean `main`, `1dfaccb4b73c1d3367e34c9f8d0d1a571a740770`.
[APR-045](APR-045-p1-owner-acceptance.md) and [APR-043](APR-043-i2-backend-acceptance.md)
remain the accepted P1 and I2 scopes, unchanged.

Authorized P2 only: extend the existing native Persian/RTL operator application
for Warehouse order lookup, actual shared arrival/documents, independently verified
physical units, explicit review/confirmation using accepted I2, canonical receiving/
Inventory-effect readback, narrowly required secure browser admission, focused
Windows tests including real PostgreSQL/browser evidence, review/correction,
directly relevant documentation and local delivery commit. Minimal corresponding
gate/local unlock reconciliation is explicitly authorized.

Reuse the single atomic `ConfirmPurchaseReceiving`, `GetReceivingArrival` and
order-scoped `GetPurchaseOrderReceiving`; server contracts and sole IPS posting
remain authoritative. No new arrival-draft operation, business policy, schema,
Inventory logic, framework/dependency, broad search or master-data module.
Named receiving placement is installation configuration, not generated factory data.

Excluded: deferred P1 O-01, production/TLS/deployment/external exposure, factory
UAT/opening balances, QC/Finance/devices, P3 and later increments, push/history
rewrite. P2 must remain **in_review**, pending separate fresh-context independent
engineering/security review and explicit Owner acceptance. Stop after local delivery.

Plan, actual evidence and remaining limitations belong to
[P2 implementation status](../../12-implementation-planning/P2_IMPLEMENTATION_STATUS.md).
