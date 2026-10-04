---
name: erp-security-review
description: Review security of a changed ERP backend, API, frontend or business slice before acceptance; rank actionable threats appropriate to the actual surface.
---

# ERP security review

Read [security workflow](../../../docs/12-implementation-planning/DEVELOPMENT_WORKFLOW.md#6-security-review)
and relevant [threat model](../../../docs/06-security-rbac-audit/THREAT_MODEL.md),
[RBAC](../../../docs/06-security-rbac-audit/ROLE_PERMISSION_MATRIX.md) and
[isolation](../../../docs/06-security-rbac-audit/CUSTOMER_ISOLATION.md).

1. Map changed entry points, trusted principal/scope, sensitive data, write owners,
   persistence, browser/files/outbound paths and realistic attacker capabilities.
2. Trace authorization at object/action level and retries; examine parameterized
   SQL, command/path handling, validation/mass assignment, safe errors/logs,
   credentials and least-privilege DB use. Apply browser/file/SSRF checks only to
   real changed surfaces and explain exclusions.
3. Review transaction/race/audit integrity and proportionate resource bounds.
   For changed dependencies or release advisories, use an available reliable audit;
   record its metadata/network behavior, scope and failures. Never auto-upgrade.
4. Require negative/regression evidence for exploitable behavior. Return severity,
   acceptance class, location, reproducible scenario, impact, fix and needed test.
   Fix required findings and re-review; no known high/critical defect at acceptance.

Use relevant OWASP references from the workflow without claiming certification.
Distinguish static review, executed probes and missing evidence. Do not build OS
containment or heavyweight security infrastructure. This review grants no access
or human approval; exercise only authorized development/test targets.
