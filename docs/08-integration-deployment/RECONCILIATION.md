---
id: INT-RECON-001
title: Integration and Deployment Reconciliation
phase: 08-integration-deployment
status: approved
version: 0.3.0
owners: [chief-solution-architect]
depends_on: [INT-SELF-CHECK-001, INT-INDEP-REVIEW-001, APR-010]
last_reviewed: 2026-09-07
approval: APR-010
supersedes: null
---

# Reconciliation — Phase 08 Integration and Deployment (structure)

## Inputs

- Draft artifacts: INT-CAT-001, INT-EXT-001, DEP-TOPO-001, DEP-OBS-001,
  DEP-DR-001, DEP-RUN-001 (v0.2.0 after post-presentation deepening)
- Independent review: [INDEPENDENT_REVIEW.md](INDEPENDENT_REVIEW.md)
- Workshop/source evidence: none executed; APR-009 and proposed ASM-021
  are the inputs

## Agreements

- Adapters map, authorize, and submit core commands. They do not write
  Ledger, Balance, unit quantity, orders, inspections, shipments, or
  invoices.
- Transport retry uses the same idempotency key. Adapter-host identity
  is not the commander.
- Adapters must not split DATA-TX-001 bundles.
- Finance-Lite export is not legal GL. Portal order write stays rejected
  in MVP. Live notices isolate customers. Cutover import stays open
  until OQ-015.
- Environments, zones, hardening, signals, and runbooks are labels.
  Docker, cloud, firewall, identity provider, and observability
  products remain open.
- Restore rebuilds projections from Ledger. RPO/RTO minutes stay
  OQ-016.
- No application, adapter, or deployment code is part of this package.

## Conflicts

### FIND-034 — Structure versus integration/deployment-product freeze

Competing needs: Phase 08 exit names adapters, topology, observability,
and recovery; OQ-011, OQ-012, OQ-016, and OQ-018 still forbid accepting
a protocol, GL product, hosting stack, or minute counts. Resolution:
ASM-021 plus open extensions. This is a structure design-gate
exception, not an answer. Owner: Project Sponsor must accept or reject
ASM-021 at approval.

## Register updates

- Assumptions: ASM-021 accepted by APR-010
- Findings: FIND-034 `resolved`
- Questions: none answered
- Decisions: none accepted beyond ADR-0001
- Dictionary: no new ENT-*; no adapter or hosting package added.
  `ADP-*`, `ZONE-*`, and `HH-*` are labels only.

## Downstream impact

- Artifacts confirmed for this structure gate: the six Phase 08 drafts
  above, plus self-check, independent review, this reconciliation, the
  gate checklist, and the Phase 09 handoff.
- Artifacts marked suspect: none. Phase 09 is `ACTIVE_IN_REVIEW` for
  structure drafting.
- Gates requiring reopen: none. Phase 07 stays approved; CHK-0008 is
  complete. Phase 08 is approved as APR-010; Git checkpoint pending.

## Remaining blockers

- In-scope structure-gate blocker: none. ASM-021 is accepted.
- Explicitly deferred: weighbridge protocol, legal accounting product,
  hosting/Docker, observability product, backup vendor, identity
  provider, RPO/RTO minutes, named operators, implementation.

## Gate recommendation

`APPROVED` (structure) by the Project Owner at
`2026-09-07T01:28:00+03:30`, including ASM-021.

This record does not start Phase 10 and does not authorize
implementation.
