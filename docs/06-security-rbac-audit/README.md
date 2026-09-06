---
id: PHASE-06
title: Security RBAC and Audit
phase: 06-security-rbac-audit
status: in_review
version: 0.2.0
owners: [security-architect, business-control-owner]
depends_on: [PHASE-05, APR-007, APP-P06-HANDOFF-001]
last_reviewed: 2026-09-06
approval: null
supersedes: null
---

# Phase 06 — Security, RBAC & Audit

## Gate

Gate status: `ACTIVE_IN_REVIEW`

Lifecycle: `in_review`

Approval: `null`

Phase 05 is approved as APR-007. Structure drafting is authorized. The
APR-007 Git checkpoint is pending. Auth packages, MFA products, and
identity providers remain OQ-018. Named people remain OQ-019.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Purpose

Define identity, authentication, authorization, customer isolation, separation
of duties, audit evidence, security events, and data-protection controls.

## Planned artifacts

- [x] [Threat model and trust boundaries](THREAT_MODEL.md)
- [x] [Role, permission, and scope matrix](ROLE_PERMISSION_MATRIX.md)
- [x] [Customer isolation policy](CUSTOMER_ISOLATION.md)
- [x] [Session and identity policy labels](SESSION_AND_IDENTITY.md)
- [x] [Audit and evidence taxonomy](AUDIT_TAXONOMY.md)
- [x] [Security verification catalogue](SECURITY_VERIFICATION.md)
- [ ] Auth/session/MFA package ADRs — **not** in this draft; OQ-018
- [ ] Self-check, independent review, reconciliation, gate checklist

## Entry criteria

- [x] Phase 05 application **structure** is approved as APR-007.
- [ ] Phase 05 Git checkpoint — pending; does not block structure drafting.

## How this phase works while answers are still arriving

Draft role-to-command rules, isolation, and audit types first. Leave
named people, auth packages, portal exposure, site tenancy, and
retention days as open extensions. Do not choose JWT, Keycloak, or any
other identity product.

## Exit criteria

- Every sensitive command has an explicit authorization rule.
- Tenant/customer isolation covers APIs, exports, files, events, and reports.
- Audit types and correction evidence are non-conflicting.
- Auth packages remain explicit open extensions with OQ-018 **or** an
  accepted later ADR.
- The user explicitly approves Phase 06.

`IMPLEMENTATION_AUTHORIZED` remains `false`.
