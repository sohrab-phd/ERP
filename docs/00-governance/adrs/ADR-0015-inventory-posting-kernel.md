---
id: ADR-0015
title: Exact kg and application-owned inventory posting kernel
status: accepted
version: 1.0.0
owners: [chief-solution-architect, data-architect]
last_reviewed: 2026-10-07
approval: null
---

# ADR-0015 — Inventory posting kernel

Technical decision in explicit [APR-020](../approved-baselines/APR-020-ips-scope.md)
scope. Accepted Modular Monolith/PostgreSQL, OQ-017 application-owned transactions,
ACT-IPS sole writer, Ledger truth and ADR-0011/0014 remain unchanged. This decision
selects engineering mechanisms; it does not manufacture factory policy or human
approval, close OQs or authorize an additional slice.

## Decision

Use kg strings and private BigInt values scaled by 10^18. Absolute capacity is
less than 10^20 kg with at most 18 fractional places; input and arithmetic reject
overflow/over-scale without rounding, exponent, coercion or floating-point stock
calculation. Canonical output removes trailing zeros. This generous bounded
technical representation is not a physical precision or a conversion formula:
factory scale measurements remain whole kg, one-kg increments without rounding.
Future receipt validates that measurement rule; fractional-business applicability
and OQ-001 conversion/threshold residuals stay open for branches using them.

Persist unconstrained PostgreSQL NUMERIC with explicit finite range/scale checks,
rather than NUMERIC(p,s) that can silently round input before a CHECK. Direct pg
keeps numeric text exact; no global numeric parser, ORM or decimal dependency.
PostgreSQL documents [exact numeric and typmod coercion](https://www.postgresql.org/docs/18/datatype-numeric.html).

One InventoryPostingService accepts the admitted owner request, server-derived
actor and existing opaque transaction. Inventory module logic is pure; its single
SQL adapter uses transactionClient capability, never owns a pool/commit. Effects
and context metadata snapshot before await; immutable branded Identity is retained.
Composition and import/SQL ownership checks confine adapter wiring; owning modules
use public service ports. Runtime permissions append/read Ledger and change only
owned Unit/Balance/Reservation; never UPDATE/DELETE Ledger or own DDL. Projection
DML permissions support its writer, not an independent business Balance API.

Lock scoped Unit, effect and reservation identities, including absent objects,
using transaction advisory locks sorted by actual bigint key; then lock existing
Unit rows FOR UPDATE in UUID order. Fresh READ COMMITTED reads under those locks
compare Ledger totals, active claim and Balance, validate proposed effect/state
and write the fact plus projection/lifecycle/claim on the caller transaction.
PostgreSQL describes [transaction locks and deadlock ordering](https://www.postgresql.org/docs/18/explicit-locking.html).
Owner orchestration should submit one complete batch for its atomic bundle;
arbitrarily separate differently ordered batches can still deadlock and must
abort technically without cached rejection, preserving existing envelope rules.

Every owner allocates stable business fact UUID and per-leg effect UUID.
Effect UUID is unique within installation/authority, independent of retry key.
Stored canonical semantic intent binds owner command/version, fact/effect/Unit,
normalized kg, lifecycle, original movement, reservation/demand and creation
metadata. Same-key accepted/rejected attempts replay the original envelope result;
new-key equivalent effect rejects GUARD_IDEMPOTENT_DUP, changed effect binding
rejects GUARD_CONFLICT. CompleteProductionOperation new-key duplicates always
GUARD_CONFLICT per DATA-TX-001. Owning receipt defines its real natural identity;
a new random fact/effect for a retry is not a valid substitute.

Ledger stores scoped deltas, original-link, ACT-IPS executor and actual caller,
command/key/request provenance. Available kg is on-hand minus reserved. Active
claim must equal Ledger reserved total, be positive and uniquely occupy its Unit.
Reservation release/consumption removes reserved only, never physical stock.
OQ-008 confirmed-order priority is a mandatory owning policy checked under locks;
missing policy returns GUARD_OPEN_POLICY, no invented first-lock-wins business rule.

Ledger/projection disagreement is technical incompatibility; no stock mutation
uses a stale Balance. Authorized rebuild derives valid totals from immutable
Ledger and existing active claims, changes Balance only and appends no movement.
Missing/corrupt claims are not silently reconstructed as guessed demand policy.
Future rebuild command owns its maintenance audit; this slice only exposes an
internal port, not a maintenance HTTP workflow.

Stock-in creates AVAILABLE without QC. Production decreases require
CompleteProductionOperation and issued/partially consumed lifecycle, final state
matching remaining kg; shipment decreases require DispatchShipment and PACKED,
SHIPPED at zero. Owner policies remain responsible for domain eligibility, mass
balance, demand and authorization; no implementation of those bundles is claimed.
Correction retains original facts and optional scoped same-Unit original links;
accepted reversal approval/SoD is implemented only in the later REVERSE slice.

Original accepted audit/outcome and all effects share the command transaction.
Known business rejection rolls back handler savepoint and persists rejection plus
audit; technical error aborts entirely. Crash before commit persists nothing;
after commit or uncertain acknowledgement, identical-key primary retry resolves
the existing outcome. IPS has no internal retry, expiry or duplicate audit family.
AUD-CMD-ACCEPTED/REJECTED/REPLAYED remain the envelope's canonical audit families.

## Consequences and evidence

No new dependencies/infrastructure, cross-owner table edits, product stock route,
QC or business workflow. Exact pins and Windows-only real PostgreSQL remain.
See [delivery plan/DoD](../../12-implementation-planning/SLICE_IPS_IMPLEMENTATION_PLAN.md)
and [actual acceptance record](../../12-implementation-planning/SLICE_IPS_IMPLEMENTATION_STATUS.md).
