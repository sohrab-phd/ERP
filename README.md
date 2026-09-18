# Foolad Navardkaran ERP/MES Architecture

This repository is the **design authority** for the Foolad Navardkaran
(شرکت فولاد نوردکاران) integrated ERP/MES: sales, procurement, inventory,
production, quality, delivery, Finance-Lite, genealogy/traceability, and
operational monitoring.

It is a **Modular Monolith** on **Node.js + TypeScript** with **PostgreSQL**
as the transactional system of record. Application implementation has **not**
been authorized.

```text
IMPLEMENTATION_AUTHORIZED: false
```

`READY FOR HUMAN IMPLEMENTATION AUTHORIZATION` (Gate 6) is **not**
authorization. No `.cursor/IMPLEMENTATION_UNLOCK.json` exists. No application
source, packages, migrations, or deployment implementation should exist yet.

Authoritative work authorization:
[CURRENT_PHASE.md](docs/00-governance/CURRENT_PHASE.md).

---

## 1. Project overview

**Purpose.** Fully engineer, validate, and approve the architecture before any
application implementation, so factory stock, production posting, sales
fulfillment, quality, shipment, and traceability stay internally consistent.

**Factory context.** A steel rolling operation (Foolad Navardkaran) whose
primary stock identity is the Coil / Inventory Unit, with kilogram as the
authoritative stock unit of measure.

**Architectural approach.** One deployable Modular Monolith (ADR-0006) with
bounded modules, one write owner per concept, and a single Inventory Posting
Service (`ACT-IPS` / `mod-inventory-posting`) for all stock quantity writes.
PostgreSQL (ADR-0007) holds Ledger and other transactional facts. Kafka,
RabbitMQ, Kubernetes, Event Sourcing, and a time-series database are **not**
required for MVP.

**Current development stage.** Architecture phases 00–12 are approved as
**structure**. Reconciliation Gates 1–5 are complete. Gate 6 found the design
ready for a **separate human** implementation-authorization decision.
Implementation remains locked.

---

## 2. Current project status

| Item | State |
| --- | --- |
| Architecture phases 00–12 | Approved as structure (APR-002 through APR-014) |
| Gates 1–5 (architecture consistency) | Completed |
| Gate 6 (implementation-readiness) | Completed |
| Gate 6 result | `READY FOR HUMAN IMPLEMENTATION AUTHORIZATION` |
| `IMPLEMENTATION_AUTHORIZED` | **`false`** |
| `.cursor/architecture-gate.json` | `"implementationAuthorized": false`; `"approvedBaseline": null` |
| `.cursor/IMPLEMENTATION_UNLOCK.json` | **Absent** (must be human-created; agents must never create it) |
| Application implementation | **Not authorized** |
| Next authorized step | Explicit **human** implementation authorization against a current approved baseline |

**Ready for authorization ≠ authorized.** Gate 6 allows a human to decide
whether to unlock. This README does not unlock implementation. Phase 12
approval (APR-014 / CHK-0013) is not an unlock.

CURRENT_PHASE: `12-implementation-planning`. There is no Phase 13.

---

## 3. Governance / gate history

Architecture phases followed:

`draft → self-check → independent review → reconciliation → explicit approval → checkpoint`

After Phase 12, six **reconciliation gates** aligned the live corpus. Those
gates are architecture/governance reviews, not implementation unlocks. Each
left `IMPLEMENTATION_AUTHORIZED: false`.

### Gate 1 — Inventory / production integrity

- **Result:** PASS WITH OPEN ITEM
- **Purpose:** Inventory truth, production posting atomicity, residual/scrap
  composition, genealogy rebuild source (FIND-G-001 / G-002 / G-014 / G-015)
- **Outcomes:**
  - Inventory Ledger is the stock-movement source of truth.
  - Inventory Balance is a rebuildable projection of Ledger (`Ledger → Balance`).
  - `ACT-IPS` is the sole stock writer. No direct Balance edits. No negative
    inventory.
  - `CompleteProductionOperation` is the exclusive production posting boundary.
  - Consumption, good output/WIP, reusable residual **or** scrap, residual
    identity, scrap quantity, genealogy source facts, Ledger posts, validations,
    and optional QC request belong in **one** business transaction.
  - Nested primitives (`ConsumeUnitPartial` / `ConsumeUnitComplete`,
    `CreateResidualUnit`, `PostScrapMovement`, `ScrapUnit` as destiny) are
    **not** independent production posting flows.
  - Residual quantity posts once; `PlaceResidualUnit` does not post a second
    residual quantity.
  - Scrap quantity posts once via `PostScrapMovement`; `ScrapUnit` does not
    create a second quantity post.
  - Genealogy rebuilds from canonical source facts, not Ledger rows alone.
- **Residuals:** routing step names (OQ-003); residual/scrap cutoff numbers
  (OQ-009); UOM scale (OQ-001).
- **Implementation:** locked.

### Gate 2 — Sales closure / reservation invariants

- **Result:** Accepted after a correction pass (FIND-G-003 / FIND-G-005)
- **Purpose:** Sales Order close contract and reservation uniqueness
- **Outcomes:**
  - `FULFILLED → CLOSED` when remaining valid demand is already zero within
    OQ-006 tolerance (default 0). `FULFILLED` is remaining-demand truth, not
    “delivered”.
  - `PARTIALLY_FULFILLED → CLOSED` only when authorized TERM-005 Unfulfilled
    Demand (`RecordUnfulfilledDemand`) covers remaining demand. Valid remaining
    demand is not silently discarded.
  - `CANCELLED → CLOSED` after confirm-cancel.
  - Payment and invoice lifecycle do **not** close the Sales Order.
  - Shipment `DELIVERED` is a fulfillment **fact**, not an independent close
    trigger.
  - At most one `ACTIVE` reservation per Inventory Unit. `REQUESTED` does not
    occupy that slot. An `ACTIVE` reservation cannot be stolen.
  - Concurrent `ActivateReservation`: at most one succeeds; same idempotency
    key returns the first result.
  - Earlier `ConfirmSalesOrder` timestamp is the OQ-008 commercial winner of
    `ACTIVE` when two confirmed SOs compete.
  - `ConfirmSalesOrder` does **not** itself create `REQUESTED`.
    `RequestReservation` and `ActivateReservation` remain distinct.
  - Confirmed-SO reservations have no invented TTL.
    `ReservationExpirySweep` is orphan/stale cleanup only.
  - Reservation ≠ allocation ≠ consumption.
- **Residuals:** family/customer tolerance % (OQ-006 configuration); later
  temporary-hold TTL only if that type is added.
- **Implementation:** locked.

### Gate 3 — OQ propagation / ADR governance consistency

- **Result:** PASS WITH OPEN ITEM
- **Purpose:** Propagate recorded OQ/ADR status through live documents without
  inventing rules
- **Outcomes:**
  - ADR-0001, ADR-0006, ADR-0007 **accepted**.
  - ADR-0008 remains **proposed**.
  - Answered OQs are not live blockers. Treating residuals remain treating.
  - Historical APR/CHK files that still say “OQs unanswered” or “only ADR-0001”
    are freeze evidence, not current policy.
- **Residuals:** treating OQs listed in section 5; packages not frozen.
- **Implementation:** locked.

### Gate 4 — Genealogy / recovery / cross-domain consistency

- **Result:** PASS WITH OPEN ITEM
- **Purpose:** FIND-G-014 genealogy rebuild, recovery vs posting, ownership
- **Outcomes:**
  - Canonical genealogy source facts: Lot Origin, Consumption, Output,
    Residual, Scrap, Package, Shipment, Rework.
  - `ENT-GENEALOGY-LINK` / TERM-025 is a rebuildable projection. No
    `EditGenealogy`. No `ENT-REWORK` was invented (Rework remains Production
    facts plus reversals).
  - `Ledger → Balance` and `DATA-GEN-001 source facts → Genealogy` are
    **separate** recovery paths. Rebuild is reconstruction, not a new business
    posting and not Event Sourcing.
  - Forward and backward traces are defined where corresponding facts exist.
  - Cross-module persistence writes are forbidden. Named commands orchestrate.
  - Correction = new compensating command + link to the original (INV-005).
- **Residuals:** Lot write-owner workshop confirmation; physical genealogy
  query strategy; treating OQs as in section 5.
- **Implementation:** locked.

### Gate 5 — Final architecture consistency

- **Result:** PASS WITH OPEN RESIDUALS
- **Purpose:** Repository-wide coherence after Gates 1–4
- **Outcomes:** Architecture is globally coherent: Modular Monolith →
  module-owned boundaries → PostgreSQL → named commands → application-owned
  transactions → `ACT-IPS` → Ledger truth → rebuildable Balance. Domain
  ownership, inventory integrity, production atomicity, sales/reservation,
  genealogy, recovery, Finance-Lite, portal visibility-only, QC SoD,
  weighbridge-as-commander, PostgreSQL transaction model, and the
  implementation lock all hold. **No substantive live architecture
  contradiction** was identified.
- **Residuals:** treating/Go-Live/implementation items in sections 5 and 12.
- **Implementation:** locked.

### Gate 6 — Implementation-transition / readiness

- **Result:** `READY FOR HUMAN IMPLEMENTATION AUTHORIZATION`
- **Purpose:** Define what must be true before a human may authorize
  implementation. **Did not authorize implementation.**
- **Outcomes:**
  - Live architecture baseline is identifiable (registers + Gate 1–5 live
    catalogues). CHK-0013 is **not** the complete current baseline.
  - Implementation-critical decisions are listed in section 4.
  - Write paths, DATA-TX-001 bundles, proposed slice sequence, and slice
    governance are recorded (sections 7–10).
  - Human unlock mechanism is defined and unused (section 11).
  - No architecture-level blockers. Treating residuals are bounded and must
    stay `GUARD_OPEN_POLICY` where a command needs a missing number/name.
- **Residuals:** human unlock still absent; packages/ADR-0008 not accepted;
  treating OQs; no post-Gate-5 APR created (this README does not create one).
- **Implementation:** locked.

---

## 4. Accepted architecture baseline

Live authority is the current registers and reconciled catalogues, not older
freeze wording that disagrees with them.

### Technology / architecture

| Topic | Status |
| --- | --- |
| Node.js + TypeScript | **Accepted** (ADR-0001). .NET / C# / ASP.NET are superseded. |
| Modular Monolith | **Accepted** (ADR-0006) |
| PostgreSQL, including Inventory Ledger | **Accepted** (ADR-0007) |
| Application-owned PostgreSQL transaction (lock → validate → write Ledger → commit) | **Accepted** style (OQ-017) |
| Stored functions as posting kernel | **Not** default; later ADR + spike only |
| Docker Compose / Nginx topology (ADR-0008) | **Proposed** |
| NestJS, Prisma, React, Socket.IO, JWT, Keycloak, Jest, Playwright, Docker, npm/pnpm, extra MCP | **Not accepted** unless a later ADR says so |
| Kafka, RabbitMQ, Kubernetes, Event Sourcing, time-series DB, microservices mesh | **Not required** for MVP |

### Inventory

- Ledger = immutable stock-movement evidence (source of truth).
- Balance = rebuildable projection of Ledger. No `AdjustBalance`.
- `ACT-IPS` / `mod-inventory-posting` = sole writer of Ledger, Balance, and
  unit quantity.
- On-hand, reserved, and available cannot go negative.
- Official stock UOM is **kg**. Coil quantity is measured weight in kg
  (OQ-002 answered). Decimal scale, rounding, and conversion factors remain
  **OQ-001 treating**.

### Production

- `CompleteProductionOperation` is the atomic completion / posting boundary
  (OQ-003 recorded invariant; step **names** still treating).
- One business transaction: consumption, good output/WIP, leftover
  classification (reusable residual **or** scrap per leftover kg), process
  loss, genealogy source facts, IPS Ledger posts, nested identity/qty
  primitives, mass balance (INV-007) within OQ-006, optional QC request.
- Idempotency: caller key on `CompleteProductionOperation`. Same key → first
  result. A new key for the same completed operation is rejected.
- Independent production consume is `GUARD_INVARIANT` (INV-006).

### Sales / reservation

- Sales owns Sales Order lifecycle. Finance-Lite does not.
- Close paths: FULFILLED (remaining valid demand already zero within OQ-006);
  PARTIALLY_FULFILLED only with authorized Unfulfilled Demand; CANCELLED.
- Payment is not a close prerequisite. `DELIVERED` does not itself close the SO.
- One Inventory Unit → at most one `ACTIVE` reservation; no steal; earlier
  confirm timestamp wins ACTIVE competition; `ConfirmSalesOrder` does not
  create `REQUESTED`; no confirmed-SO TTL.
- Reservation ≠ Material Allocation ≠ Consumption.

### Genealogy

Eight canonical source-fact families (DATA-GEN-001 / FIND-G-014):

1. Lot Origin
2. Consumption
3. Output
4. Residual
5. Scrap
6. Package
7. Shipment
8. Rework

Genealogy Link is a **projection**, rebuildable, not independently editable
truth. No `EditGenealogy`. No `ENT-REWORK` was invented.

### Recovery

OQ-016 **answered** objectives: RPO ≤ 60 minutes; RTO ≤ 8 hours; daily
backup; offsite copy; restore testing. Retention days and backup **product**
remain residual.

After restore of durable posted facts:

- `BalanceRebuild`: Ledger → Balance
- `GenealogyRebuild`: DATA-GEN-001 source facts → Genealogy projection

Rebuilds do **not** create Ledger movements, residual/scrap quantity, or a
replay of `CompleteProductionOperation`.

### Finance-Lite

Operational invoices, payments, allocations, and operational balances only.
**Not** a legal general ledger. Does not own or close Sales Orders.

### Portal

Customer Portal MVP is **visibility-only** (OQ-010). `PortalPlaceOrder` is
forbidden (`GUARD_PORTAL_MVP` / INV-020). Exact portal document list remains
residual.

### QC

QC can block availability and shipment where required (OQ-005). Exceptional
release requires two distinct authorized people. Quality **commands**
Inventory; it does not write Ledger. Quality Plans, limits, and named
releasers remain treating.

### Weighbridge

Adapter/commander (`ADP-WEIGHBRIDGE`) only. Never an independent Ledger
writer. Human ticket fallback is the recorded path. Make/model/protocol
remain OQ-011 treating.

### Cross-module ownership

Exactly one write owner per authoritative concept. Direct cross-module table
writes are forbidden. Other modules **command** the owner (or `ACT-IPS` for
stock). Adapters and workers command; they do not post.

### Scope

One legal entity, one principal site (OQ-013). Future multi-site would reopen
architecture.

---

## 5. Open / treating / deferred decisions (OQ-001–OQ-019)

Canonical rows:
[OPEN_QUESTIONS.md](docs/00-governance/registers/OPEN_QUESTIONS.md).
Team answers:
[team-answers/](docs/00-governance/team-answers/).
Recorded `2026-09-15`. Chat is not a second register.

| OQ | Subject | Status | Accepted / answered portion | Unresolved portion | Implementation impact |
| --- | --- | --- | --- | --- | --- |
| OQ-001 | UOM scale / rounding / conversion | treating | kg is official stock UOM; one stock truth | Decimal scale, rounding, material conversion factors | Commands that need a missing scale → `GUARD_OPEN_POLICY` |
| OQ-002 | Coil quantity | answered | Coil qty = measured weight in kg | Shop-floor ticket confirmation (validation) | Do not use length as stock truth |
| OQ-003 | Routing / posting points | treating | Official post at `CompleteProductionOperation` | Named routing steps; abort role name | Kernel can post at complete-op; named routing / abort-after-post waits |
| OQ-004 | Tracking grain | answered | Unit-level Coil; hybrid finished-product rule | First-go-live family catalogue | Configuration, not a new architecture |
| OQ-005 | QC plans / release | treating | QC can block available/ship; exceptional release is two-person | Quality Plans, limits, named approvers | Hold/release mechanics allowed; named exceptional release → `GUARD_OPEN_POLICY` |
| OQ-006 | Tolerance | answered | Partial shipment allowed; default 0; configurable | Exact %/kg by family/customer | Family over-delivery waits on configuration |
| OQ-007 | Sales Order close | answered | Close on fulfilled / cancelled / authorized unfulfilled remainder; not payment | Later commercial exceptions if any | Must not close on invoice paid or DELIVERED alone |
| OQ-008 | Reservation | answered | One unit, one ACTIVE; no steal; no confirmed-SO timer | Temporary-hold TTL only if that type is added | Uniqueness is required; do not invent TTL |
| OQ-009 | Residual vs scrap | treating | Reuse policy; nested identity/qty composition recorded | Family min weight/dimensions | Classification that needs a cutoff → `GUARD_OPEN_POLICY` |
| OQ-010 | Customer Portal | answered | MVP visibility-only; no order write | Exact document list; later order phases | `PortalPlaceOrder` rejected; visibility reads allowed |
| OQ-011 | Weighbridge | treating | Never writes Ledger; human ticket fallback | Make/model, protocol, device id, named operator | Auto-device path waits; adapter must not write Ledger |
| OQ-012 | Finance-Lite | answered | Not legal GL; no Legal-GL integration in MVP | Accounting product/API in a later phase | Do not expand to full GL |
| OQ-013 | Legal entity / site | answered | One legal entity, one principal site | Future multi-site would reopen architecture | No multi-site MVP schema required |
| OQ-014 | Volume | treating | Modest scale: &lt;100 users, ~15–25 concurrent | 12-month transaction counts | Physical indexes/capacity wait; logical model does not |
| OQ-015 | Opening stock | treating | Opening stock = Ledger facts via `OpeningStockImport` | Source files, freeze time, named signers | `SLICE-CUTOVER` / `ADP-CUTOVER` blocked (`GUARD_OPEN_POLICY`) |
| OQ-016 | Recovery / retention | answered | RPO 60 min, RTO 8 h, daily backup, off-site copy | Retention days; backup product | Objectives required; vendor/days later |
| OQ-017 | Posting mechanism | answered | App-owned PostgreSQL TX + locks | PG functions only after later ADR + spike | Do not freeze SQL/functions as the kernel |
| OQ-018 | Architecture / platform | answered | Modular Monolith + PostgreSQL; Node.js + TypeScript | NestJS, Prisma, React, Docker, auth, extra MCP | First code slice needs an explicit package ADR if packages are introduced |
| OQ-019 | Real names | treating | Role/RACI list accepted | Real names, delegates, approval scope | Named UAT/cutover/SoD people wait; temporary names cannot sign |

Inquiry/Quotation expiry remains FIND-026 (`workshop-commercial-practice`), not
a new `OQ-*`. Extra MCP remains “none by default” under OQ-018.

Treating items are **Go-Live / business inputs** or implementation follow-ups.
They are not silently closable. They do **not** all block every slice.

---

## 6. ADR status

Canonical register:
[DECISIONS.md](docs/00-governance/registers/DECISIONS.md).

| ADR | Status | Meaning |
| --- | --- | --- |
| ADR-0001 | Accepted | Node.js + TypeScript (not .NET/C#/ASP.NET) |
| ADR-0002 | Accepted | English documentation + glossary |
| ADR-0003 | Accepted | Phase approval cadence |
| ADR-0004 | Accepted | Git checkpoints after approved phases |
| ADR-0005 | Accepted | Premature-implementation safeguard |
| ADR-0006 | Accepted | Modular Monolith |
| ADR-0007 | Accepted | PostgreSQL transactional SoR, including Ledger |
| ADR-0008 | **Proposed** | Candidate Ubuntu / Docker Compose / Nginx topology |

Candidate packages and frameworks (NestJS, Prisma, React, Socket.IO, auth,
test runner, Docker) have **not** become accepted architecture merely because
they appear as candidates. Each needs its own later ADR.

---

## 7. Authoritative write paths

| Path | Owner | Notes |
| --- | --- | --- |
| Stock movement | `ACT-IPS` → Inventory Ledger | Balance is a projection of Ledger |
| Production completion | `CompleteProductionOperation` | Production facts + IPS stock posts + genealogy source facts in one TX |
| Residual identity | Nested `CreateResidualUnit` | Parent close/split; residual Ledger qty **once** |
| Scrap quantity | IPS `PostScrapMovement` | Nested leftover **or** new Quality/abort key; `ScrapUnit` is destiny only |
| Goods receipt | Procurement orchestration + IPS | Lot / Inventory Unit + Ledger |
| Reservation request | `RequestReservation` | Does not occupy the ACTIVE uniqueness slot |
| Reservation activation | Inventory `ActivateReservation` | One ACTIVE per unit; bundle with reserved-state + reserved qty |
| Shipment dispatch | Shipping command + IPS stock exit | Shipping does not write Ledger |
| Sales Order lifecycle | Sales | Confirm, fulfill, `CloseSalesOrder`; must not write Invoice/Ledger qty |
| Invoice / payment | Finance-Lite | `AllocatePayment` + invoice open-balance; does not close SO |
| QC | Quality commands IPS | Inspection owned by Quality |
| Weighbridge | `ADP-WEIGHBRIDGE` commander | Never a Ledger writer |
| Rebuilds | `BalanceRebuild` / `GenealogyRebuild` workers | Reconstruction; never stock writers |
| Opening stock | `ADP-CUTOVER` / `OpeningStockImport` | Ledger facts; **blocked** until OQ-015 / OQ-019 |

**Forbidden**

- `EditGenealogy`
- `AdjustBalance`
- `PortalPlaceOrder` (MVP)
- Direct Ledger writes by adapters, workers, UI, Quality, or Shipping
- Independent production consume posting
- Portal allocation, consumption, or financial mutation

---

## 8. Transaction boundaries

**Named unsplittable business transactions (DATA-TX-001)**

1. `CompleteProductionOperation` + consume/output/residual/scrap (nested
   residual identity)
2. `DispatchShipment` + stock exit
3. `PostGoodsReceipt` + Lot/Unit/Ledger
4. `ActivateReservation` + unit reserved-state + reserved qty
5. `AllocatePayment` + invoice open-balance reduction
6. Quality/abort scrap that is **not** leftover of that completion:
   `RecordScrapFact` + `PostScrapMovement` (+ `ScrapUnit` if destiny is
   `SCRAPPED`)

`CreateResidualUnit` for production leftover is nested inside (1), not a later
independently committable transaction.

**Intentionally not universal DATA-TX-001 bundles** (do not invent extra
boundaries)

- `CloseSalesOrder` — Sales state; may command `ReleaseReservation`; no Ledger
  qty
- `CompleteOperationPartial` — Production Order state only; no stock
- `PlaceResidualUnit` — placement / QC hold after the child exists; no second
  residual qty
- Inquiry / Quotation / SO draft-submit-confirm (`ConfirmSalesOrder` does not
  create `REQUESTED`)
- Rebuild workers
- Correction/reversal commands (new key, link to original)

Physical isolation/lock SQL remains an OQ-017 residual.

---

## 9. Implementation sequence (proposed, not authorized)

From Gate 6 / [ROADMAP_AND_SLICES.md](docs/12-implementation-planning/ROADMAP_AND_SLICES.md).
This sequence is **not** permission to execute it.

0. Human unlock
1. Runtime/package ADR for the first slice (if packages are introduced)
2. `SLICE-ENVELOPE` (command/query envelope, idempotency, `AUD-CMD-*`; no Ledger)
3. PostgreSQL foundation for Ledger / Unit / Reservation (logical model → schema)
4. `SLICE-IPS`
5. `SLICE-STOCK` (Sales, reservation, pack/dispatch, Finance-Lite)
6. `SLICE-PURCHASE` (including inbound QC commanders)
7. `SLICE-MAKE` (including in-process/final QC commanders)
8. Genealogy projection / traces
9. Portal visibility reads
10. `SLICE-REVERSE`
11. `SLICE-RESTORE`
12. `SLICE-CUTOVER` (blocked on OQ-015 / OQ-019)
13. Deploy / DR (ADR-0008 remains proposed)

Quality is not a Ledger-writer stage. Weighbridge auto-path stays inside
purchase and remains `GUARD_OPEN_POLICY` until OQ-011.

---

## 10. Slice governance

Once a human unlock exists, later implementation must:

- Work one named `SLICE-*` / `WI-*` at a time with explicit scope
- Avoid unrelated refactoring
- Reopen the owning `APR-*` / add an ADR for architecture-affecting change
- Forbid cross-module table writes (`CONF-IMPORT`)
- Keep DATA-TX-001 bundles unsplittable (`CONF-BUNDLE`)
- Post stock only through `ACT-IPS` (`CONF-IPS`)
- Require critical invariant evidence (`QA-P-*`, `QA-SCN-*`, `SV-*`; no
  minted `TEST-*` catalogue)
- Review migrations so Ledger history is not deleted and Balance is not treated
  as independent truth
- Take a Git checkpoint after an **accepted** slice; a failed slice does not
  silently continue
- Have Cursor report changed files, checks run, unresolved `OQ-*` /
  `GUARD_OPEN_POLICY`, and evidence — and not claim completion without that
- Leave treating residuals as `GUARD_OPEN_POLICY` rather than inventing values

See [SLICE_HOMES.md](docs/00-governance/registers/SLICE_HOMES.md) and
[WORK_ITEMS.md](docs/12-implementation-planning/WORK_ITEMS.md).

---

## 11. Human authorization / unlock model

Technical unlock requires **both**:

1. A **human-created** `.cursor/IMPLEMENTATION_UNLOCK.json`
2. `.cursor/architecture-gate.json` independently set to
   `"implementationAuthorized": true` with the **same** `approvedBaseline`

Required unlock fields: `approvedBy`, `approvedAt`, `approvedBaseline`,
`allowedWritePaths`, `allowedShellCommands`.

`approvedBaseline` must be an `APR-*` under
`docs/00-governance/approved-baselines/` with a recorded Git commit. The human
authorization step should bind the **live** registers and Gate 1–5 catalogues,
not CHK-0013 freeze text that still says OQs are unanswered.

`allowedShellCommands` must be exact strings (no `;`, `|`, or redirection).
An unlock that names `package.json`, Docker, or CI is invalid **unless a later
approval explicitly adds those paths**.

**Agents must never create or edit the unlock** (`AG-UNLOCK` never).

**Current state:** no unlock file; gate `implementationAuthorized` is false;
this README does not authorize implementation.

---

## 12. Current blocking / guarded items

**Global process block (intentional):** no human unlock → no application
implementation.

Treating OQs **do not** all block all work after a valid unlock. They guard
the slices that need the missing input:

| Guard | Effect |
| --- | --- |
| Human unlock | Blocks **all** application code |
| OQ-001 | Blocks commands that need missing decimal scale/rounding/factors |
| OQ-003 | Named routing catalogue and abort-after-post role wait; complete-op boundary is already recorded |
| OQ-005 | Named exceptional releasers / plans wait; QC can still block |
| OQ-006 family % | Family over-delivery waits; default 0 is recorded |
| OQ-009 | Cutoff-dependent residual/scrap classification waits |
| OQ-010 document list | Visibility-only MVP proceeds; exact document list residual |
| OQ-011 | Automatic weighbridge integration waits; human ticket fallback is defined |
| OQ-014 | Physical capacity/index sizing waits |
| OQ-015 | Opening-stock cutover blocked |
| OQ-016 residual | Backup product / retention days wait; RPO/RTO recorded |
| OQ-017 residual | Stored-function ADR waits; app-owned TX is recorded |
| OQ-018 residual | Package/framework choices wait for explicit ADRs |
| OQ-019 | Named-person UAT / cutover / some approvals wait |

---

## 13. Historical / superseded material

Older APR/CHK manifests, phase SELF_CHECK / INDEPENDENT_REVIEW files, and
superseded .NET wording remain for audit.

They are **not** current authority when they conflict with:

- [CURRENT_PHASE.md](docs/00-governance/CURRENT_PHASE.md)
- [DECISIONS.md](docs/00-governance/registers/DECISIONS.md)
- [OPEN_QUESTIONS.md](docs/00-governance/registers/OPEN_QUESTIONS.md)
- Gate 1–5 live catalogues

In particular, **CHK-0013** (`a6b893095af7c9d14f342371fb6e4ef9c6d833df`,
2026-09-07) froze Phase 12 **structure**. Team answers (2026-09-15) and
Gates 1–6 later-recorded the live OQ/ADR/reconciliation state. Do not treat
CHK-0013 as the complete current architecture baseline.

APR freeze files that say “OQ-001–019 remain unanswered” or “only ADR-0001
accepted” describe the signed gate at that time.

---

## 14. Where we are now

The ERP architecture and governance baseline has completed Gates 1–5 and the
implementation-readiness Gate 6. The project is now **READY FOR HUMAN
IMPLEMENTATION AUTHORIZATION**, but implementation is **NOT** authorized.

```text
IMPLEMENTATION_AUTHORIZED: false
NO_IMPLEMENTATION_UNLOCK_CREATED: true
```

The next governance action is explicit **human** implementation authorization
against an approved **current** baseline (live registers + Gate 1–5
catalogues), via a human-created unlock and matching architecture-gate policy.
Only after that authorization should the first implementation slice begin.

---

## Start here

1. [Documentation index](docs/INDEX.md)
2. [Current phase authorization](docs/00-governance/CURRENT_PHASE.md)
3. [Architecture charter](docs/00-governance/ARCHITECTURE_CHARTER.md)
4. [Open questions](docs/00-governance/registers/OPEN_QUESTIONS.md)
5. [Decision register](docs/00-governance/registers/DECISIONS.md)
6. [Team question pack](docs/00-governance/TEAM_QUESTION_PACK.md)
7. [Implementation readiness (not an unlock)](docs/12-implementation-planning/IMPLEMENTATION_READINESS.md)
8. [Authorization record labels](docs/12-implementation-planning/AUTHORIZATION_RECORD.md)
9. [Roadmap and slices](docs/12-implementation-planning/ROADMAP_AND_SLICES.md)

---

## Architecture phase dashboard (structure freezes)

These APR/CHK rows record **phase structure** approval. They are historical
checkpoints, not the live OQ/ADR snapshot and not an implementation unlock.

| Phase | Structure status | Approval | Checkpoint commit |
| --- | --- | --- | --- |
| `00-governance` | Approved | APR-002 | `540a606ef32a3cb17f7e886dff3c4dcde82ca4b1` |
| `01-project-assimilation` | Approved | APR-003 | `91273e9e30ead2f19203fab2f82d5f23911ee0aa` |
| `02-domain-business-architecture` | Approved | APR-004 | `ec3c210a83a0d8f163bbbb6fadc1e4a28b8bf8db` |
| `03-state-machines-invariants` | Approved | APR-005 | `bef6b6464baaf62ac8d3db9f9b7fa835ad04ec6c` |
| `04-database-architecture` | Approved (logical) | APR-006 | `87f9f10442d58fbd224dce09f46c862eb8707e8f` |
| `05-application-api-architecture` | Approved (structure) | APR-007 | `00b30a3064027fd0584c35c5f479b04d087614a6` |
| `06-security-rbac-audit` | Approved (structure) | APR-008 | `167353573840ef22d23049b864636d7383c61911` |
| `07-testing-quality-architecture` | Approved (structure) | APR-009 | `29921d69e10bf6704966a08ff927d9e6ae9c0bd3` |
| `08-integration-deployment` | Approved (structure) | APR-010 | `751035d2359abb5bd99a1b8a254715b2a5c937ae` |
| `09-repository-documentation` | Approved (structure) | APR-011 | `81aef0e7bc217cf5172b1f64edf13848b6242bb2` |
| `10-ai-cursor-development` | Approved (structure) | APR-012 | `1d581c4357a784f3170bd42349a47c1b38bde1e6` |
| `11-architecture-validation` | Approved (structure) | APR-013 | `57062e96c91b6eff52f233aaf3a0df65a81e9da4` |
| `12-implementation-planning` | Approved (structure) | APR-014 | `a6b893095af7c9d14f342371fb6e4ef9c6d833df` |

Team answers were recorded `2026-09-15`. Gates 1–6 followed. Temporary workshop
identities still cannot sign decisions (OQ-019).
