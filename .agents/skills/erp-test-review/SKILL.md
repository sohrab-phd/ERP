---
name: erp-test-review
description: Review a meaningful ERP slice's automated tests and acceptance evidence for business invariants, error paths, concurrency and meaningful regression coverage.
---

# ERP test and acceptance review

Read the task DoD, relevant [test strategy](../../../docs/07-testing-quality-architecture/TEST_STRATEGY.md),
[scenario catalogue](../../../docs/07-testing-quality-architecture/SCENARIO_CATALOGUE.md)
and affected implementation/tests.

1. Map each material business/integrity/authorization requirement to observable
   proof. Look for false positives, broad reject assertions, missing setup,
   tautological mocks and tests that never reach the intended failure.
2. Inspect unit/API/component tests and actual PostgreSQL checks as appropriate:
   races, locks, isolation, savepoint rollback, audit/outcome atomicity, accepted/
   rejected replay, same-key conflicts and uncertain retries. Do not mock away
   the behavior under review or pursue arbitrary coverage/test-count goals.
3. Check fixture isolation, verified disposable DB identity, role separation,
   deterministic barriers, known child cleanup, timeout bounds and zero skipped
   required proof. Keep Windows-only execution and exact frozen tool versions.
4. Separate planned/historical/root-reported/independently executed results.
   Unavailable required tests block acceptance; documentation-only changes need
   relevant validation rather than rerunning every previously accepted module.
5. Return gaps by acceptance class with scenario, affected requirement, impact
   and minimum useful test/fix. Confirm DoD only after actual required checks,
   closed review/security findings and updated implementation documentation.

Use [acceptance and commit rules](../../../docs/12-implementation-planning/DEVELOPMENT_WORKFLOW.md#7-acceptance).
