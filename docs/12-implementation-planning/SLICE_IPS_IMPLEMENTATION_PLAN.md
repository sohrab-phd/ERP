# SLICE-IPS — bounded kernel delivery

Authority: [APR-020](../00-governance/approved-baselines/APR-020-ips-scope.md).
Backlog capability 3; dependencies: accepted command envelope and Identity.
Goal: one reliable internal stock writer for the next receipt capability and later
owner workflows. Warehouse, Procurement, Sales and Production users benefit through
their eventual owning workflows; this slice adds no user-facing workflow or screen.

## Scope and design

- Preserve [DATA-POST-001](../04-database-architecture/POSTING_KERNEL.md),
  [atomic bundles](../04-database-architecture/TRANSACTION_AND_IDEMPOTENCY.md),
  accepted lifecycle states, ACT-IPS ownership and ADR-0011/0014.
- [ADR-0015](../00-governance/adrs/ADR-0015-inventory-posting-kernel.md) selects
  bounded exact kg, application-owned locking, source-effect identities and projection
  reconstruction. Factory measured weights remain whole kg; conversion/threshold
  and fractional-business applicability are not answered by a technical capacity.
- Pure module contracts, Kg and service in `apps/backend/src/modules/inventory/`;
  parameterized SQL only in `infrastructure/postgresql/inventory-store.ts`.
  Composition injects this adapter through the module port. The shared kernel has
  no dependency on inventory. Other modules use the service, not the SQL adapter.
- `post` accepts an existing command transaction and 1–128 snapshotted effects:
  stock-in, stock-out, reserve and release/consume claim. No independent commit.
  `snapshot` validates Ledger/claim/projection; authorized `rebuild` repairs only
  Balance from Ledger after validating claims. No arbitrary Balance setter.
- Mandatory owning policy authorizes the current principal, validates locked
  unit/source/customer/command eligibility and permits maintenance. Reservation
  requires an explicit locked confirmed-demand priority decision (OQ-008), otherwise
  GUARD_OPEN_POLICY. Production composition supplies deny-default policy and no
  inventory/business command registrations or HTTP posting routes.
- Migration `0005_inventory_posting.sql`: inventory Unit identities/lifecycle,
  immutable Ledger movements, Balance projection, active/terminal Reservation
  bookkeeping. Lot/demand/location references are opaque future-owner UUIDs, not
  seeded masters or fabricated receipt/order entities.
- No quantity Number conversion, rounding, second UOM stock total, QC gate or
  negative on-hand/reserved/available. One ACTIVE claim per Unit even if partial.
  Normal valid stock-in is AVAILABLE. Production/shipment stock-out is possible
  only under canonical owner command and eligible locked lifecycle; tests provide
  synthetic owner preconditions without delivering those business workflows.
- Root scripts and pinned Node24.21.0/npm11.19.0/TS6.0.3/pg8.23.1/PG18.6 remain;
  no packages, framework, worker, broker or distributed infrastructure added.

## Execution plan

1. Confirm scope, quantity policy and minimal owner ports; refresh local Graphify.
2. Implement exact quantities, service, scoped SQL/migration and ownership checks.
3. Exercise real isolated Windows PostgreSQL transactions, locking, durable replay,
   negative stock, projection rebuild, crash/uncertain retry and authorization.
4. Independent engineering/database/API, security and test review; fix required
   findings and repeat affected tests, then run final complete checks.
5. Document delivered interfaces/limits, inspect diff, commit locally and stop for
   Owner push. Next receipt slice is not begun.

## Definition of Done / acceptance

| Requirement | Required proof |
| --- | --- |
| Exact kg; capacity violations reject without rounding | BigInt unit boundaries and real PostgreSQL scale/range/nonfinite checks |
| Sole owner and no stock-update route | Import/SQL ownership checker rejects transport bypass; production host regression |
| Ledger truth; rebuildable Balance | Missing/drifted Balance denies normal use; rebuild restores it with identical Ledger/history |
| No negatives under concurrency | Competing depletion/reservation, stable multiunit locks, claim-ID reuse and partial reservation exclusion |
| Atomic accepted/rejected behavior | Unit/Ledger/Balance/claim + owner fact + original outcome/audit commit together; later-leg and audit failures roll back |
| Correct duplicate/replay behavior | Same-key accepted/rejected replay, changed binding conflict, new-key duplicate guard, production-specific CONFLICT |
| Current authority and isolation | Real Identity contexts, forged/foreign target/scope/customer/other-principal/revoked replay denial |
| Retry/crash integrity | Actual Windows child termination before/after commit and lost server-confirmed COMMIT acknowledgement |
| All implemented terminal branches | Production full/partial depletion, packed shipment exit and reserved-only claim consumption |
| Acceptance evidence | Windows full checks, zero skipped required tests, closed engineering/security findings, actual delivery record and local commit |

## Exclusions / later decisions

No Receipt/Lot master workflow, production completion, scrap/residual orchestration,
shipment, sales-order confirmation/closure, inventory UI, opening import, device,
Finance-Lite, portal, QC, conversion or automatic discrepancy tolerance. Generic
reversal/recovery workflow authorization/audit is deferred to its existing slices;
this kernel preserves source links and append-only facts. OQ-001 remains treating
for its business residuals; OQ-008's recorded earlier-confirmation priority is not
replaced by first-lock-wins. No OS containment or new governance mechanism.
