---
id: QA-SELF-CHECK-001
title: Testing and Quality Architecture Self-Check
phase: 07-testing-quality-architecture
status: approved
version: 0.2.0
owners: [chief-solution-architect]
depends_on: [PHASE-07, QA-STRAT-001, QA-TRACE-001, QA-SCN-001, QA-PROP-001, QA-NFR-001, QA-GATE-001]
last_reviewed: 2026-09-06
approval: APR-009
supersedes: null
---

# Testing and Quality Architecture Self-Check

## Scope and method

This self-check covers the Phase 07 **structure** design set, open
runner/oracle/named-tester extensions under proposed ASM-020, and gate
status. It is not an independent review or approval.

Three documentation-only audits were completed:

1. **Structure and exit-criteria audit** — inspected the Phase 07
   contract, planned structure artifacts, and the “runner, CI, and
   identity-product packages remain OQ-018” exit rule.
2. **Cross-artifact consistency audit** — compared INV-001–020 intents,
   `QA-SCN-*` golden paths, property intents, SV-001–013, and evidence
   kinds against APR-005, APR-007, APR-008, FIND-021, and FIND-028.
3. **Post-presentation deepening** — SEQ-REVERSE, DATA-TX-001 bundles,
   remaining SM-SOD-001 pairs, SV-to-scenario map, REQ-OBJ intent
   links, and forbidden-write reject scenarios.

No application code, test runner, fixture library, CI pipeline, or
package was written. Temporary identities were not treated as testers
who sign evidence.

## Criterion results

### Planned structure artifacts — PASS AFTER CORRECTION

- Test strategy, verification trace, scenario catalogue, property
  intents, NFR/UAT intents, and quality-gate labels exist and are
  `in_review`.
- Runner/CI package ADRs are explicitly **not** in this draft (OQ-018).
- Phase 06 remains approved as APR-008 / CHK-0007.
- `QA-SCN-SOD-GR` was added so ReverseGoodsReceipt SoD (SV-013) is a
  named scenario, not only a security-intent row.
- SEQ-REVERSE, `QA-SCN-BUNDLE`, SV-001/003/008/009/011/012 scenarios,
  and REQ-OBJ intent links were added after the first self-check.
  FIND-028 still holds: no `TEST-*` catalogue.

### Invariants have an intent or an open extension — PASS

- INV-001 through INV-020 each map to a primary level and an intent.
- Where a number or named person is required, the Open column cites the
  owning `OQ-*` rather than inventing a pass.
- FIND-028 is honoured: no `TEST-*` catalogue was minted.

### Scenarios and properties — PASS

- Golden paths `QA-SCN-STOCK`, `QA-SCN-PURCHASE`, `QA-SCN-MAKE`,
  `QA-SCN-NOT-FEASIBLE`, and `QA-SCN-REVERSE` rest on SEQ-* without
  claiming closed numeric guards.
- Remaining SoD pairs without a dedicated passing scenario are recorded
  as `GUARD_OPEN_POLICY` until OQ-003 / OQ-005 / OQ-019.
- Forbidden MVP passes remain named as reject scenarios:
  PortalPlaceOrder, EditGenealogy, AdjustBalance, Quality/Shipping
  writing Ledger.
- Kernel properties still name Ledger evidence, Balance rebuild,
  idempotency, and genealogy rebuild-only. Decimal oracles stay
  OQ-001 / OQ-002.

### Environments, recovery, UAT — PASS AS OPEN EXTENSION

- `ENV-*` and `QG-*` are labels. Docker, GitHub Actions, Jest,
  Playwright, k6, and coverage percents are not chosen.
- RPO/RTO minutes stay OQ-016. Named UAT people stay OQ-019.
- FIND-033 records that this structure gate cannot freeze those items.

### Implementation lock — PASS

- `IMPLEMENTATION_AUTHORIZED` remains `false`.
- No test code or CI is claimed.

## Residual

- ASM-020 is accepted by APR-009. It is not owner-signed test policy.
- OQ-001 through OQ-019 remain unanswered or `treating`.

## Result

`READY_FOR_INDEPENDENT_REVIEW`
