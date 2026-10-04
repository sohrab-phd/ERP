---
name: erp-database-review
description: Review ERP SQL migrations, persistence, PostgreSQL transactions, constraints, locking and concurrency for data integrity and safe evolution.
---

# ERP PostgreSQL review

Read relevant [posting rules](../../../docs/04-database-architecture/POSTING_KERNEL.md),
[ownership](../../../docs/02-domain-business-architecture/MODULE_OWNERSHIP_MATRIX.md),
[idempotency contract](../../../docs/12-implementation-planning/COMMAND_IDEMPOTENCY_SPEC.md)
and the task's actual migrations/adapters.

1. Map tables to write owners, source facts versus projections, keys/FKs/checks,
   numeric representations, least-privilege runtime versus migration roles.
   ACT-IPS alone changes stock; kg/no-negative stock and production bundles hold.
2. Trace one client/transaction across locks, checks, facts, audit and outcomes.
   Review lock order, fresh snapshots, uniqueness races, savepoints, deadlocks,
   retries and ambiguous COMMIT; distinguish business rejection from technical abort.
3. Review migration order/raw checksums/atomicity/restartability, constraints and
   indexes justified by actual access paths. No guessed scale, business seeds,
   direct Balance editing, destructive reset of an unverified database or new ORM.
4. Inspect actual PostgreSQL acceptance proof for relevant rejection, concurrency,
   rollback/crash and privilege behavior. Never substitute mocked SQL or a silently
   different version. All local execution is Windows-only and isolated test data.
5. Report evidence-backed integrity risks with acceptance class, severity, exact
   location, correction and regression intent. Record deferred operational inputs
   at their real dependent slice; do not treat them all as implementation blockers.

Use [workflow acceptance](../../../docs/12-implementation-planning/DEVELOPMENT_WORKFLOW.md#7-acceptance).
