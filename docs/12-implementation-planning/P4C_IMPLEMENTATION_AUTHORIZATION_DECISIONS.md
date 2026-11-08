---
id: PLAN-P4C-DECISIONS-001
title: P4c OPEN Owner implementation authorization decisions
phase: 12-implementation-planning
status: draft
version: 0.1.0
owners: [delivery-lead, chief-solution-architect, security-architect]
depends_on: [PLAN-P4C-CAPABILITIES-001, PLAN-P4C-DESIGN-001, APR-052]
last_reviewed: 2026-11-08
approval: null
---

# P4c Owner decision sheet

**ALL D1–D7 OPEN; Owner selections/approval NULL.** Recommendations are proposals,
not human approval. The actual 2026-11-08 authorization permits discovery/design,
reviews and documentation commits only. Implementation requires an explicit
Owner directive selecting a compatible scope against this package's committed
revision. No permission, endpoint, schema or command change is authorized here.

| Decision | Alternatives and recommendation | Required dependency / limit | Status / Owner selection |
| --- | --- | --- | --- |
| D1 — workflow scope | **A recommended:** Sales discovery/detail + explicit single request and separate activation using both existing commands. B: read-only discovery/detail/context, no mutation. C: defer P4c. | A requires D2 A, D3 A, D4 choice, D5 A and D6/D7 controls. B still requires D2 A, D3 A and read/security/performance controls; no claim of operational delivery. | OPEN / NULL |
| D2 — new narrow read disclosures | **A recommended:** exact-customer Reservation list/detail, CONFIRMED STOCK order-context with all-intent request totals, and availability of only that item's original selected Units, precisely the four proposed read routes. Reuse existing P4b customer/order/assessment reads unchanged. B: no new reads; defer workspace rather than substitute blind UUID entry. | New read permissions explicitly require Owner approval despite reusing ACT-SALES grants. No grant schema/wildcard/general Sales stock access; no codes/competitors/stock owner/raw audit. Lifecycle times + own receipt only; full audit/actor directory excluded. | OPEN / NULL |
| D3 — actor boundary | **A recommended:** personal exact-customer ACT-SALES UI only. Existing bearer WH activation remains. B: separately commission narrow WH Reservation discovery/detail design and disclosure policy. | B is an alternative future design, not specified/ready implementation here; keep its implementation blocked until scope/data/negative tests reviewed. P4a org inventory exception supplies no reservation/commercial read grant. Neither branch broadens P4b Sales grants. | OPEN / NULL |
| D4 — new request quantity UX | **A recommended:** new UI requests whole observed Unit kg only when positive whole kg within remaining request capacity. B: additionally permit smaller whole-kg requests with explicit immutable partial/unshippable warning/acknowledgement. | Both preserve backend positive whole kg and support display/ordinary activation of existing partial requests with warning. A is a UI entry restriction only, not a backend policy change. Neither can guarantee future availability, repair partial/blocked requests, split/top-up or cancel. Fractional Unit kg or insufficient line capacity may block new UI request. | OPEN / NULL |
| D5 — command browser/recovery | **A recommended for D1 A:** fixed two-command cookie adapter, separate encrypted Reservation intent namespace, all-workspace write interlock, exact same-key recovery and session/stale-response controls specified in workflow. B: no command adapter; choose D1 B/C. | Reuse accepted durable outcomes unchanged; all pending checks must include new namespace before enabling commands. No persistent plaintext/token, proxy, automatic request→activation chain or batch. New browser route is not present authority. | OPEN / NULL |
| D6 — database/access paths | **A recommended:** projection-only first; measure existing indexes/plans. If inadequate, report precise candidate index, plans, read/write costs and request separate Owner migration approval before application/commit. B: defer expensive discovery rather than accept unmet limits. | No migration or index preapproval; no changes to 0001–0019, tables/constraints/state machines. Read-only snapshots/owner ports, no command locks. Preserve P4a migration-wide OPEN deployment gate. | OPEN / NULL |
| D7 — acceptance workload/budgets | **A recommended:** approve measurement of bounded Reservation journeys with concurrent existing writers/history, then explicit Owner numeric workload/absolute-budget decision before software acceptance. Proposed budgets are in workflow; actual Reservation rates/history remain UNKNOWN. B: Owner supplies alternate bounded workload/budgets before that verification. | No invented scale, no automatic inheritance of Sales 20/40 lookups or P4b exception, no relative-only P4b investigation. D7 is not closed merely by selecting measurement work; record numeric Owner decision/evidence separately. | OPEN / NULL |

## Compatibility and excluded decisions

D1 A + D4 A is the recommended bounded operational UI. D1 A + D4 B exposes
supported partial requests with a material stranding risk; that risk needs actual
Owner selection. D1 B omits `/commands` and recovery creation (four new reads
only); it must preserve existing pending records/interlock. D2 B implies D1 C.
D3 B cannot silently expand D1 A's five-route Sales-only package. D5 B requires
D1 B/C. D6/D7 failures cannot be waived by a clean design review.

No decision in this sheet authorizes edit/release/cancel/reassign/expiry, a new
allocation policy, WH commercial browsing, production/Shipping actions, broad
audit reads, configuration/employee provisioning, a migration/index, dependency,
deployment/pilot, P3/P4d/P5 execution or a push. A repair path for immutable blocked
requests would need separately scoped business decisions/design/implementation;
it is not a hidden prerequisite delivered by this UI.

## Preserved accepted decisions

P1/P2/P4a/P4b remain accepted in their bounded scopes; [APR-052](../00-governance/approved-baselines/APR-052-p4b-owner-software-acceptance.md)
remains authoritative. P4a's pre-0019 migration-wide writer-overhead deployment
gate is **OPEN**. P4b D7 is **OWNER-ACCEPTED WITH DOCUMENTED
RELATIVE-WRITER-REGRESSION EXCEPTION**, original relative failure and root cause
UNKNOWN, with both runs retained and no further relative-only investigation.
Neither is superseded by P4c design or future Reservation measurements.

Stop after the local documentation commit. Await Owner decisions and explicit
P4c implementation authorization; no automatic continuation to any product slice.
