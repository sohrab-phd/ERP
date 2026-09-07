---
id: INT-SELF-CHECK-001
title: Integration and Deployment Self-Check
phase: 08-integration-deployment
status: approved
version: 0.3.0
owners: [chief-solution-architect]
depends_on: [PHASE-08, INT-CAT-001, INT-EXT-001, DEP-TOPO-001, DEP-OBS-001, DEP-DR-001, DEP-RUN-001, APR-010]
last_reviewed: 2026-09-07
approval: APR-010
supersedes: null
---

# Integration and Deployment Self-Check

## Scope and method

This self-check covers the Phase 08 **structure** design set, open
integration/deployment-product extensions under proposed ASM-021, and
gate status. It is not an independent review or approval.

Three documentation-only audits were completed:

1. **Structure and exit-criteria audit** — inspected the Phase 08
   contract and the “hosting/Docker/CI stay OQ-018” exit rule.
2. **Cross-artifact consistency audit** — compared adapters, trust
   edges, `ENV-*`, recovery labels, and runbooks against APR-007
   APP-BG-001, APR-008 TB-*, APR-009 QA-R-*, INV-015–018, and INV-020.
3. **Post-presentation deepening** — DATA-TX-001 unsplittable bundles,
   APP-BG work kinds, remaining TB-* edges including `TB-IDENTITY` and
   `TB-STOCK`, `ADP-LIVE` / `ADP-CUTOVER`, network-zone and host-hardening
   labels, QA-R to DR/RB map, and SV implications for adapters.

No adapter code, Dockerfile, CI, or deployment manifest was written.
Temporary identities were not treated as operators.

## Criterion results

### Planned structure artifacts — PASS AFTER CORRECTION

- Integration catalogue, external boundaries, topology labels,
  observability kinds, recovery labels, and runbooks exist and are
  `in_review`.
- Hosting/Docker/CI product ADRs are explicitly **not** in this draft
  (OQ-018).
- Phase 07 remains approved as APR-009 / CHK-0008.
- Phase 06’s deferred network zoning and host hardening are now zone
  and `HH-*` labels, not a firewall product.

### Adapters command; they do not post — PASS

- Every `ADP-*` submits a core command or an isolated read/export.
- Weighbridge and printers do not write Ledger.
- Finance-Lite export is not legal GL (ASM-010, OQ-012).
- Portal order write remains rejected in MVP (INV-020).
- PLC/CMMS/APS stay future catalogue entries (ASM-008).
- Adapters must not split DATA-TX-001 bundles.
- `ADP-CUTOVER` stays `GUARD_OPEN_POLICY` until OQ-015 / OQ-019.
- `ADP-LIVE` inherits SV-012 isolation.

### Topology, observability, recovery — PASS AS OPEN EXTENSION

- `ENV-*` reuse Phase 07 labels. Docker and cloud are not chosen.
- `ZONE-*` and `HH-*` are labels. Firewall, VPN, and secret-store
  products stay open.
- RPO/RTO minutes stay OQ-016. Named operators stay OQ-019.
- Restore rebuilds Balance and Genealogy from Ledger; it does not
  accept `EditGenealogy` or `AdjustBalance`.
- QA-R-RESTORE / DEVICE / WORKER / CUTOVER map to named DR/RB labels.
- FIND-034 records that this structure gate cannot freeze products or
  minute counts.

### Implementation lock — PASS

- `IMPLEMENTATION_AUTHORIZED` remains `false`.
- No Dockerfile, compose file, or adapter process is claimed.

## Residual

- ASM-021 is accepted by APR-010. It is not owner-signed operations policy.
- OQ-001 through OQ-019 remain unanswered or `treating`.

## Result

`READY_FOR_INDEPENDENT_REVIEW`
