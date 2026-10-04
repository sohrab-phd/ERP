---
name: erp-frontend-review
description: Review a meaningful ERP user-facing UI or customer visibility workflow for factory fit, usability, accessibility, state handling and safe API integration.
---

# ERP factory frontend review

Start from the affected [factory process](../../../docs/02-domain-business-architecture/PROCESS_MAPS_AS_IS_TO_BE.md),
[actor responsibilities](../../../docs/02-domain-business-architecture/ACTOR_RESPONSIBILITY_CATALOGUE.md)
and owning query/command contracts. Inspect actual implementation/screens when
available; no frontend framework has been selected by this skill.

1. Identify who acts, where, familiar terminology, essential information, fast
   operations and likely errors. Minimize clicks/screens/re-entry and avoid
   exposing architecture concepts or unconfirmed factory procedures.
2. Exercise relevant loading/empty/validation/error/permission/retry states,
   stale data and repeated clicks. Uncertain command completion retries the same
   bound key; do not optimistically invent committed stock or acceptance.
3. Review keyboard/navigation/focus, labels, contrast/error visibility and target
   sizes appropriate to the real device. Do not presume scanners/tablets or
   visual sophistication are requirements without factory evidence.
4. Trace API/object/customer access, safe rendering and session/CSRF where used.
   Portal MVP remains visibility-only; no prices/order entry by default. No QC MVP.
5. Inspect useful component/integration tests; reserve E2E for critical journeys.
   Return actionable severity/class/location/scenario/fix and evidence limits.
   Distinguish static UX inspection from executed accessibility/usability tests.

Apply [workflow UX/testing](../../../docs/12-implementation-planning/DEVELOPMENT_WORKFLOW.md#3-implement-a-coherent-increment);
do not choose new UI infrastructure or claim factory UAT from a code review.
