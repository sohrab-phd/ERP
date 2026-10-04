---
name: erp-api-review
description: Review changed ERP HTTP APIs, command/query contracts or transport adapters for validation, authorization, binding, errors and compatibility.
---

# ERP API and envelope review

Read the owning [command catalogue](../../../docs/05-application-api-architecture/COMMAND_CATALOGUE.md),
[query catalogue](../../../docs/05-application-api-architecture/QUERY_CATALOGUE.md),
[envelope](../../../docs/05-application-api-architecture/API_ENVELOPE.md) and
[idempotency specification](../../../docs/12-implementation-planning/COMMAND_IDEMPOTENCY_SPEC.md)
only for affected contracts.

1. Identify caller, owner, input/output schema, object/scope access, transitions,
   stable result and explicit compatibility/version decisions.
2. Trace bounded parsing/unknown fields/material validation and server-derived
   identity. Check current RBAC, IDOR/customer isolation, safe error/rejection
   semantics and immutable/query-only boundaries.
3. For commands verify principal/command/target/material binding, accepted AND
   rejected durable replay, conflicting reuse, post-lock current authorization,
   audit atomicity and same-key uncertain retry. Metadata is not new key scope.
4. Check transport does not bypass owner commands or leak SQL/secrets/foreign
   results. Test contract changes, negative access, invalid inputs and compatibility;
   no synthetic production auth, speculative routes or new framework.
5. Return blocking/required/nonblocking/deferred findings with location, scenario,
   impact, concrete correction and regression proof. Use existing contracts rather
   than redesigning settled business rules.

Follow [engineering review](../../../docs/12-implementation-planning/DEVELOPMENT_WORKFLOW.md#5-independent-engineering-review-and-fix).
