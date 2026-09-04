---
id: PHASE-06
title: Security RBAC and Audit
phase: 06-security-rbac-audit
status: planned
version: 0.1.0
owners: [security-architect, business-control-owner]
depends_on: [PHASE-05]
last_reviewed: 2026-09-02
approval: null
supersedes: null
---

# Phase 06 — Security, RBAC & Audit

## Purpose

Define identity, authentication, authorization, customer isolation, separation
of duties, audit evidence, security events, and data-protection controls.

## Planned artifacts

- Threat model and trust boundaries
- Role, permission, and scope matrix
- Object-level and customer-isolation policy
- Session, password, MFA, and equipment-identity policy
- Audit/evidence taxonomy and retention rules
- Security verification catalogue

## Entry criteria

- Phase 05 application boundaries and contracts are approved.

## Exit criteria

- Every sensitive command has an explicit authorization rule.
- Tenant/customer isolation covers APIs, exports, files, events, and reports.
- Audit types and correction evidence are non-conflicting.
- The user explicitly approves Phase 06.
