# SLICE-PURCHASE receipt increment — bounded delivery plan

Starting accepted/pushed baseline: 2b98d2c06beb5ae6fc3756a826695b9999abfedf.
Authority: [APR-021](../00-governance/approved-baselines/APR-021-receipt-increment-scope.md).
Dependencies: accepted command envelope, personal Identity/Authorization and IPS.
Goal: individual Warehouse staff record manual physical intake and read its stock evidence.

## Scope and Owner-confirmed policy

Owner confirmation in the current task (2026-10-07) resolves normal manual receiving:
ACT-WH alone may post; Procurement orchestrates evidence, never writes stock.
No hardcoded person, shared account, mandatory PO, ticket, supplier approval,
QC gate, tolerance, expected-quantity policy, loss/Residual/Scrap classification,
opening stock, device feed, return/correction or transformation is introduced.

Required intake: Internal Code, descriptive Count, positive whole measured kg,
and Type. Internal Code is nonunique and distinct from Unit UUID/idempotency key.
Standalone incoming Sheet also requires its accepted unique product code;
no Coil ancestor is fabricated. Count is never stock arithmetic. Location UUID
records the Unit's placement; location-master management is not this increment.
Optional product code on other types implies no global uniqueness.

## Minimal design

- PostGoodsReceipt v1 targets a stable client-allocated goods-receipt document
  UUID, retained with the command key across retries. This is not an invented
  external ticket or a proof of universal physical duplicate detection.
- Procurement owns Goods Receipt; one atomic command records DRAFT, RECEIVED and
  POSTED, composing predecessors without extra manual screens. Owner confirmation
  removes a mandatory PO/inbound-reference prerequisite for normal manual intake.
- Inventory owns receipt-origin Lot/material identities. InventoryReceiptService
  allocates Lot/Unit/material/effect UUIDs and calls the existing IPS STOCK_IN.
  Only IPS writes Unit/Ledger/Balance; no cross-module SQL or separate commit.
- Same key and binding replay accepted or rejected outcome. A different key for
  the same receipt UUID rejects DUP for matching intake, CONFLICT for changed
  intake. Different receipt UUIDs cannot be guessed duplicates from Internal Code
  or matching descriptive fields. Stable real device references remain later OQ-011.
- Canonical whole-kg/count strings prevent coercion or rounding. SHEET product
  codes are scope-unique. Scoped absent-receipt and Sheet-code locks precede IPS
  locks; fresh reads determine the winner under concurrency.
- Receipt, Lot, Unit, Ledger, Balance, command outcome and audit share one envelope
  transaction. A business rejection rolls the bundle back to the handler savepoint;
  infrastructure failure aborts; uncertain COMMIT resolves by the same bound key.
- Current personal WH authority is checked before and within the transaction.
  Org-scoped WH/SEC read policies expose GetGoodsReceipt/GetInventoryUnit/GetLot;
  stock totals validate against Ledger. No portal/customer or direct Balance route.
- A default-off COMMAND_ADMISSION_RECONCILED operator flag preserves the accepted
  recovery fence. Enable only on the original or reconciled primary; disable before
  lossy restore. A missing restored outcome never establishes nonexecution.
- Frozen direct pg/SQL/Windows node:test and existing dependencies/scripts remain.
  Deliver authenticated backend APIs. Browser UI/location masters are later
  integration work; this increment does not claim an operational UI was delivered.

## Definition of Done / execution

1. Implement the bounded receipt bundle and authenticated receipt/Unit/Lot reads.
2. Test real PostgreSQL personal authority, exact quantities, nonunique Internal
   Code, Sheet identity, same-key accepted/rejected replay, changed binding,
   different-key receipt duplicates, concurrent winners, resource isolation,
   savepoint/mid-bundle/audit rollback and uncertain retry.
3. Independent engineering/database/API/security/test review; close required findings.
4. Format, lint, boundaries, typecheck, build, unit/integration, JSON/reference and
   git diff --check pass; dependencies remain pinned.
5. Document delivered behavior/limits, commit locally after acceptance, report to
   Owner and stop for review/push. No next major slice or remote push.
