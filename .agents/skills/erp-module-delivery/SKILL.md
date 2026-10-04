---
name: erp-module-delivery
description: Deliver a meaningful ERP module or capability slice using the accepted backlog, bounded design, evidence-based acceptance, documentation and local commit readiness.
---

# ERP module delivery

Read the [delivery workflow](../../../docs/12-implementation-planning/DEVELOPMENT_WORKFLOW.md)
and the task's relevant backlog/owner/contract sources, not the whole corpus.

1. Confirm effective scope and canonical authorization; identify actual factory
   users, workflow, accepted invariants, dependencies, exclusions and DoD.
2. Keep a short task plan. Choose the simplest current design; implement the
   core coherent increment before optional features. Preserve owner ports and
   PostgreSQL atomic bundles. Unanswered business policy is not a technical default.
3. Run relevant Windows tests/checks. Use actual PostgreSQL for persistence,
   transaction/concurrency/crash proof; report unavailable evidence honestly.
4. Arrange independent engineering and surface-appropriate security review;
   load database/API/frontend/test skills only when their surfaces change.
   Classify findings and fix blockers/required improvements, then retest.
5. Accept only against the DoD; update the owning implementation page with actual
   behavior, public interfaces, invariants, permissions, limits and deferred items.
6. Review working/staged diff and checks, commit coherent accepted work locally,
   report the workflow's completion fields and hash; never push automatically.

For already-accepted code, repair only demonstrated gaps. This skill does not
expand an unlock, choose factory answers, authorize deployment or install tools.
