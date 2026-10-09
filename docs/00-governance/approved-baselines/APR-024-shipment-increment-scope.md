---
id: APR-024
title: SLICE-STOCK shipment increment scope
status: approved
approval: Project Owner explicit pushed reservation commit confirmation and shipment continuation
last_reviewed: 2026-10-09
---

# Shipment increment authority

Owner confirms accepted reservation commit807ab190d49ebb3bd4e3419e09c28de4bc656faf was pushed and explicitly instructs SLICE-STOCK shipment increment. This records actual implementation-scope authority, also covered by APR-019 standing backlog delegation. The subsequent explicit Owner shipment-policy confirmation dated2026-10-09 resolves normal dispatch authority/evidence/prerequisites as recorded below.

Working baseline is that accepted reservation commit; architecture APR-018/e80a04b15ddf93451cc79ccf81722f564912596d remains unchanged. Shipping owns Package, Shipment and dispatch evidence; Inventory owns Unit/claim lifecycle and ACT-IPS alone posts stock exit; Sales owns demand/fulfillment. Preserve one atomic PostgreSQL owner-port bundle with audit and durable command outcome.

The [bounded execution plan](../../12-implementation-planning/SLICE_STOCK_SHIPMENT_PLAN.md) records the remaining business prerequisites. Normal shipment policy is now explicitly supplied by the Owner, not inferred from scope permission; unresolved delivery/exception policies remain excluded. No exceptional shipment without demand, physical Unit splitting, new QC, money/finance implementation, new production/procurement workflow, browser UI or portal ordering is authorized here.

Stop after accepted documented local commit for Owner review/push; never push or rewrite history. An actual business-policy blocker is escalated with evidence, without another tooling/governance transition.

## Owner business decision (2026-10-09)

Individually authenticated ACT-SHIP may prepare, record, load and finalize normal shipment, without second approval or hard-coded employee. Only complete Inventory Units already reserved for a confirmed Sales Order; no physical split, ownership override or exceptional shipment. Partial order dispatch is permitted only by the existing line rules, using whole reserved Units.

Payment and invoice issuance are not dispatch prerequisites. Invoice/payment/customer balance/cheque/promissory-note/credit state cannot gate this flow. Shipment, invoice, payment, customer delivery and Sales closure remain distinct.

Required durable evidence: Shipment identity; actual Sales Order reference (use existing order identity, do not invent the unresolved external Order Code mapping); Unit identities; authoritative stock kg; authenticated actor; system timestamp; posting outcome; existing idempotency and audit evidence. No mandatory carrier, driver, vehicle, customer signature, proof of delivery, transport-document/invoice/payment reference. Delivery confirmation and carrier workflows deferred.

All stock exit through IPS with exact reservation ownership, immutable Ledger, rebuildable Balance, nonnegative kg, authorization and one atomic transaction with audit/durable outcome. Dispatch must not discard remaining valid demand, close Sales or equate SHIPPED with DELIVERED.
