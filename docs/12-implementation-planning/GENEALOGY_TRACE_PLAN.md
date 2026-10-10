---
id: PLAN-GENEALOGY-001
title: Genealogy Projection and Trace execution plan
status: accepted
last_reviewed: 2026-10-10
---

# Goal and bounded scope

[APR-026](../00-governance/approved-baselines/APR-026-genealogy-trace-scope.md) records Owner authorization from accepted/pushed SLICE-MAKE e5997f506c753bc73426128a88558d9c633e7f88. Implement backlog section7 and DATA-GEN-001 bidirectional material trace for Warehouse, Sales and security/audit users. Existing inventory/receipt, Production and Shipping owners supply immutable facts and published read snapshots; Genealogy is Reporting's read projection, not an independent business writer.

## Minimal design

- Live reconstructed query projection, not a materialized cache/table, graph database, worker or new migration. Each query is reconstructed from current source facts in one bounded REPEATABLE READ READ ONLY snapshot. Existing write transactions stay READ COMMITTED.
- Pure bounded graph walk in modules/genealogy, source DTOs and narrow read methods published by existing owners, SQL only in their owning adapters, composition wiring and GET-only HTTP transport. No cross-module private imports.
- TraceForward/TraceBackward typed UUID roots: Unit, Lot, Receipt, Package, Shipment, Fact, Operation, Production Order, ProductBatch and Sales Order. Context associations do not imply material ancestry. Existing Entry/Referral/operator declaration facts appear only as typed association-root context events, never material ancestry. No EditGenealogy or source/stock mutation.
- Exact declared Output sourceUnitIds and Residual sourceUnitId yield direct material links. Scrap is terminal classified evidence. Consumption annotates actual consumed kg; partial original Unit identity persists. FINALIZED annotates the same WIP identity, never a second Unit/kg or ancestry edge. Multi-parent output kg is the result total, not an invented parent contribution weight.
- Actual immutable package content and dispatch evidence remain distinct from draft/assigned/unpacked states. Only real dispatch links indicate shipment posting; no DELIVERED inference. Order/operation/batch references are associations, not paths causing Cartesian sibling ancestry. No fabricated supplier or Coil origin for standalone Sheet.
- Require current individually authenticated ACT-WH, ACT-SALES or ACT-SEC with exact selected customer grant. Organizational intake permission alone does not imply commercial-customer trace permission; existing organizational receipt queries remain unchanged. Check current branded Identity before opening snapshot and freshly after releasing it, immediately before disclosure; no stale snapshot authorization or additional pool checkout while holding the snapshot. Filter customer-bearing sources by installation/authority/customer before bounds. Original organizational receipt roots are unique exact installation/authority lookups; disclose their evidence only after selected-customer Production/Shipping reachability and owning Unit visibility are verified.
- Deterministic typed identities and fact-keyed edges; deduplicate cycles/diamonds without losing split/merge relationships. Fixed bounds: depth32, nodes256, edges1024, source rows256 per collection with limit+1 overflow detection, source-port calls1024, encoded response256KiB. Overflow explicitly rejects, never silently complete or false not-found. Exact root lookup, not a global capped source prefix.
- GET /genealogy/forward|backward/<typed-kind>/<UUID>, one exact customer selector and current session, no browser Origin/role claim/body/query options. Safe errors, no-store/nosniff, bounded concurrency/timeouts. Unknown or foreign root returns no trace without foreign metadata.

## Definition of Done

- Full forward/backward receipt/lot/Unit, Production split/merge/WIP/final/Residual/Scrap and actual package/shipment relations; exact quantities, no Cartesian or fake origin, no new business workflow.
- Real PostgreSQL proof of source reconstruction, scoped shared-origin branching, immutable sources unchanged, zero Ledger/Balance/audit/outcome/source writes from trace, default write and read snapshot modes, read-only write denial, deterministic concurrent owner commit all-old/all-new, fresh post-snapshot revocation and connection release.
- Genuine current permitted roles, copied/foreign/revoked/unsupported actor and malformed HTTP denial; no internal bindings, unrelated customer facts or broad source dump. Limits, source overflow and missing roots handled explicitly.
- Unit tests for graph directions, exact source subsets, partial original identity, FINALIZED no duplicate quantity, Scrap terminal, package state versus dispatch, typed IDs/dedup/cycles and bounds. Relevant previous-slice regressions pass on pinned Windows Node24.21.0/npm11.19.0/TypeScript6.0.3/pg8.23.1/PostgreSQL18.6.
- Independent engineering/database/API/test and local security reviews, required findings fixed, actual delivery docs and canonical source reconciliation, JSON/reference checks, git diff --check, coherent local commit; stop for Owner review/push.

## Exclusions

Materialized/externally editable projection, scheduled rebuild/restore worker (SLICE-RESTORE), supplier catalogue and certificate capture not present in source facts, rework/correction producers without approved contracts, browser visualization/UI, QC, new stock/production/shipment behavior, queues/graph services, speculative codes or per-parent measured weights. No dependency/version upgrades.

## Execution result

Engineering acceptance complete on 2026-10-10; [actual delivery/evidence](GENEALOGY_TRACE_IMPLEMENTATION_STATUS.md) records159 unit and216 real PostgreSQL tests, independent engineering/security review and required-finding closure. No dependency/migration change or new business workflow. The accepted local commit is reported to the Owner; stop before next major slice for review/push.
