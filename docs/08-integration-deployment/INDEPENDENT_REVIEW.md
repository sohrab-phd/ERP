---
id: INT-INDEP-REVIEW-001
title: Integration and Deployment Independent Review
phase: 08-integration-deployment
status: approved
version: 0.3.0
owners: [independent-reviewer]
depends_on: [INT-SELF-CHECK-001, APR-010]
last_reviewed: 2026-09-07
approval: APR-010
supersedes: null
---

# Integration and Deployment Independent Review

## Independence

- Reviewer: Independent architecture reviewer
- Review date: 2026-09-07
- Artifacts reviewed: Phase 08 structure set (including post-presentation
  deepening), self-check, proposed ASM-021, FIND-034, and the Phase 07
  baseline they inherit.
- Independence limit: The same agent session authored the drafts. This
  is a distinct adversarial pass.
- Method: Read-only consistency review. No adapter, Docker image, or
  CI was generated to “verify” the labels.

## Verdict

`READY_FOR_RECONCILIATION`

No unresolved in-scope Critical or High **structure** defect remains.
FIND-034 is High and `resolved` by APR-010 / ASM-021. This verdict is not
an implementation unlock.

## Evidence checked

- Adapters are commanders. `ACT-IPS` remains the only stock writer.
- Same-key retry is the only transport recovery (INV-016).
- DATA-TX-001 bundles are named as unsplittable adapter paths.
- Trust edges now restate TB-DEVICE, TB-GL, TB-CUSTOMER, TB-SITE,
  TB-BACKEND, TB-STOCK, TB-AUDIT, and TB-IDENTITY without choosing a
  protocol or product.
- `ADP-LIVE` and `ADP-CUTOVER` match APP-BG-001 `LiveNotice` and
  `OpeningStockImport`. Cutover stays `GUARD_OPEN_POLICY` until OQ-015.
- `ZONE-*` and `HH-*` cover the Phase 06 “network zoning and host
  hardening” deferral without a firewall product.
- `ENV-PROD` is a label. ASM-001 is not promoted to a second-site map.
- Recovery refuses Balance-only restore and EditGenealogy.
- QA-R-* map to DR-* / RB-*.
- Runbooks use `ACT-*` roles; named people stay OQ-019.

## Satisfied criteria

- Planned structure artifacts exist and remain `in_review`.
- Weighbridge protocol, GL product, Docker, observability stack,
  backup vendor, identity provider, and RPO/RTO minutes are not stated
  as decided.
- OQ-001 through OQ-019 remain unanswered or `treating`.
- Node.js + TypeScript remains the only accepted technology ADR.
- `IMPLEMENTATION_AUTHORIZED` remains false.

## Findings

### FIND-034 — Phase 08 structure vs integration/deployment-product freeze

- Severity: high
- Status: treating
- Residual for the human gate: the Project Owner accepted ASM-021 by
  approving Phase 08 as APR-010. Hosting and adapter-protocol ADRs
  remain later work.

## Uncertainty and limits

- No signed operator roster, device certificate, or recovery letter
  exists.
- This reviewer cannot certify Docker, a weighbridge vendor, an
  identity provider, or an accounting product that OQ-011 / OQ-012 /
  OQ-018 have not chosen.
- CHK-0008 recording files remain uncommitted.

## Required next action

The Project Owner approved Phase 08 as APR-010, including ASM-021. Phase
09 structure drafting may continue. Do not start Phase 10. Do not write
adapter code, Dockerfiles, package manifests, or test code. Do not
implement software.
