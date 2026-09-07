---
id: GOV-ASSUMPTIONS-001
title: Assumption Register
phase: 00-governance
status: in_review
version: 0.12.0
owners: [chief-solution-architect]
depends_on: [SRC-001, ASM-REPORT-001]
last_reviewed: 2026-09-07
approval: APR-011
supersedes: null
---

# Assumption Register

Every assumption requires an owner, validation method, and affected artifacts.
None of these entries is a confirmed business decision.

APR-002 approved this register's Phase 00 seed version. APR-003 approved the
Phase 01 version as assimilation evidence. APR-004 accepted ASM-014 for the
Phase 02 design-gate. The current version is `in_review` because Phase 10 added ASM-023.
APR-011 accepted ASM-022. APR-010 accepted ASM-021. Individual assumptions retain their recorded
validation status; artifact approval does not confirm shop-floor facts.

## ASM-001 — Single legal entity and principal site

- Status: open
- Owner: Project sponsor
- Validation: organization/site workshop
- Affects: numbering, tenancy, warehouse, reporting, deployment
- Related question: OQ-013

## ASM-002 — Modest user scale

- Status: open
- Statement: 15–25 concurrent and fewer than 100 total users
- Owner: Project sponsor
- Validation: named user/role and growth forecast
- Affects: deployment, performance, licensing

## ASM-003 — Weight is the primary inventory measure

- Status: open
- Owner: Inventory process owner
- Validation: UOM matrix and representative records
- Affects: inventory, pricing, production, API contracts
- Related questions: OQ-001, OQ-002

## ASM-004 — Batch-level finished-product tracking is normal

- Status: open
- Owner: Production and Quality owners
- Validation: product/customer/regulatory matrix
- Affects: identity, labels, genealogy, data volume
- Related question: OQ-004

## ASM-005 — One active physical location per Coil

- Status: open
- Owner: Warehouse owner
- Validation: physical-process walkthrough
- Affects: Inventory Unit lifecycle and transfer rules

## ASM-006 — Posted operational records are retained

- Status: proposed
- Statement: Posted inventory, production, shipment, and finance records are
  corrected by reversal rather than physical deletion.
- Owner: Business control owners
- Validation: legal/audit policy approval

## ASM-007 — Factory LAN is generally available

- Status: open
- Owner: Infrastructure owner
- Validation: production-point network survey
- Affects: offline behavior, scanning, retries
- Related question: OQ-011

## ASM-008 — Production events are human-frequency

- Status: open
- Owner: Production owner
- Validation: operation/event sampling
- Affects: real-time and telemetry scope

## ASM-009 — Standard/manual barcode printing is acceptable initially

- Status: open
- Owner: Warehouse and Production owners
- Validation: label workflow trial
- Affects: MVP equipment and UX

## ASM-010 — External accounting remains legal authority

- Status: open
- Owner: Finance owner
- Validation: accounting-system and legal-scope confirmation
- Related question: OQ-012

## ASM-011 — Small-team maintainability is required

- Status: proposed
- Owner: Project sponsor
- Validation: delivery/support team plan
- Affects: Modular Monolith, deployment, tooling, operational complexity

## ASM-012 — Historical snapshots and correction evidence are retained

- Status: proposed
- Statement: Commercial, specification, quantity, status, and approval values
  required to interpret a posted historical document are snapshotted, and every
  later correction preserves the prior value, reason, actor, authority,
  timestamp, and linked reversal/correction evidence.
- Owner: Business control owners and Data Steward
- Validation: representative document/correction walkthrough, legal/audit
  retention policy, and authority matrix
- Affects: Sales, Procurement, Inventory, Production, Quality, Shipping,
  FinanceLite, Audit, traceability, retention
- Related questions: OQ-005, OQ-006, OQ-007, OQ-015, OQ-016

## ASM-013 — Temporary workshop roster may unblock Phase 02 design

- Status: proposed
- Statement: The Project Owner authorized filling all Phase 02 workshop roles
  with clearly flagged `(temporary)` placeholders so domain and business
  architecture drafting may continue without waiting for real names. Temporary
  identities confer no approval authority, do not execute the workshop, and do
  not close OQ-019.
- Owner: Project sponsor
- Validation: replace every temporary roster row with a real named assignment
- Affects: Phase 02 entry, workshop execution, RACI, owner-signed decisions
- Related question: OQ-019
- Related finding: FIND-020

## ASM-014 — Phase 02 design-gate may complete with critical questions scoped out

- Status: proposed
- Statement: Phase 02 design drafting and the Phase 02 design-gate may complete
  while OQ-001 through OQ-006, OQ-008, OQ-010, and OQ-013 remain unanswered,
  provided each is formally scoped to workshop validation and its true
  downstream blocking phase, and no numeric UOM, routing, QC, reservation,
  fulfillment, organization, or portal policy is invented as if decided.
- Owner: Project sponsor and Chief Solution Architect
- Validation: Phase 02 approved as APR-004 at `2026-09-06T00:31:00+03:30`.
  Later workshop evidence is still required before owner-signed policy.
- Affects: Phase 02 exit, Phase 03 invariants, workshop, portal roadmap
- Related questions: OQ-001, OQ-002, OQ-003, OQ-004, OQ-005, OQ-006, OQ-008,
  OQ-010, OQ-013
- Related finding: FIND-022

## ASM-015 — Team question pack after every phase

- Status: proposed
- Statement: After every phase gate package, unanswered questions are grouped
  by related/owning phase, published in
  [TEAM_QUESTION_PACK.md](../TEAM_QUESTION_PACK.md), and asked of the Project
  Owner. Authorized architecture work continues while answers are pending.
  A returned answer becomes authoritative only when recorded on the matching
  `OQ-*` row. The pack does not approve a phase or authorize implementation.
- Owner: Project sponsor and Chief Solution Architect
- Validation: each later phase repeats the pack; answers update GOV-QUESTIONS-001
- Affects: every phase gate, workshop planning, CURRENT_PHASE permitted work
- Related questions: OQ-001 through OQ-019

## ASM-016 — Phase 03 design-gate may complete with open guards

- Status: proposed
- Statement: Phase 03 structure drafting and the Phase 03 design-gate may
  complete while OQ-owned numbers, named people, and cutoffs remain
  unanswered, provided each such value stays an explicit open guard on the
  matching `OQ-*` or `workshop-commercial-practice`, and any command that
  needs that value is rejected as `GUARD_OPEN_POLICY`. No number, person, or
  cutoff is invented as if decided.
- Owner: Project sponsor and Chief Solution Architect
- Validation: Project Owner accepted ASM-016 at `2026-09-06T01:13:00+03:30`
  and approved Phase 03 as APR-005 at `2026-09-06T01:18:00+03:30`. This
  does **not** close any `OQ-*` or authorize implementation. Later workshop
  evidence is still required before owner-signed numeric or named policy.
- Affects: Phase 03 exit, Phase 04 contracts, workshop, implementation lock
- Related questions: OQ-001 through OQ-010, OQ-012, OQ-015, OQ-017, OQ-019
- Related findings: FIND-024, FIND-025, FIND-026, FIND-028

## ASM-017 — Phase 04 logical design-gate may complete with open physical extensions

- Status: proposed
- Statement: Phase 04 logical drafting and a Phase 04 **logical**
  design-gate may complete while UOM, Coil quantity, volumes, opening-stock
  RACI, retention numbers, and posting mechanism remain unanswered,
  provided each stays an explicit open extension and no executable schema,
  SQL, ORM model, or migration is written. No physical type, index, or
  volume is invented as if decided.
- Owner: Project sponsor and Chief Solution Architect
- Validation: Project Owner accepted ASM-017 and approved Phase 04 as
  APR-006 at `2026-09-06T19:42:00+03:30`. This does **not** close any
  `OQ-*`, choose a database product, or authorize implementation. Later
  answers are still required before physical contracts or an OQ-017 ADR
- Affects: Phase 04 exit, Phase 05 APIs, implementation lock
- Related questions: OQ-001, OQ-002, OQ-013, OQ-014, OQ-015, OQ-016,
  OQ-017, OQ-018
- Related finding: FIND-029

## ASM-018 — Phase 05 structure design-gate may complete with open platform extensions

- Status: accepted
- Statement: Phase 05 structure drafting and a Phase 05 **structure**
  design-gate may complete while transport, OpenAPI, framework, ORM,
  outbox/broker, real-time library, UOM JSON types, and ADR-0006 through
  ADR-0008 remain unanswered, provided each stays an explicit open
  extension and no controller, OpenAPI file, package manifest, or
  worker process is written. No HTTP contract or package is invented
  as if decided.
- Owner: Project sponsor and Chief Solution Architect
- Validation: Project Owner accepted ASM-018 and approved Phase 05 as
  APR-007 at `2026-09-06T20:31:00+03:30`. This does **not** close any
  `OQ-*`, accept a framework, or authorize implementation. Later
  answers are still required before typed API contracts or platform ADRs
- Affects: Phase 05 exit, Phase 06 security contracts, implementation lock
- Related questions: OQ-001, OQ-002, OQ-010, OQ-013, OQ-014, OQ-017,
  OQ-018, OQ-019
- Related finding: FIND-030

## ASM-019 — Phase 06 structure design-gate may complete with open identity extensions

- Status: accepted
- Statement: Phase 06 structure drafting and a Phase 06 **structure**
  design-gate may complete while named people, auth/session/MFA
  products, portal exposure, site tenancy, weighbridge identity, and
  retention days remain unanswered, provided each stays an explicit
  open extension and no identity middleware, JWT, Keycloak, or other
  security package is written. No password day-count or MFA mandate is
  invented as if decided.
- Owner: Project sponsor and Chief Solution Architect
- Validation: Project Owner accepted ASM-019 and approved Phase 06 as
  APR-008 at `2026-09-06T22:59:00+03:30`. This does **not** close any
  `OQ-*`, accept an identity product, or authorize implementation. Later
  answers are still required before named-person SoD or platform auth ADRs
- Affects: Phase 06 exit, Phase 07 verification, implementation lock
- Related questions: OQ-005, OQ-010, OQ-011, OQ-013, OQ-015, OQ-016,
  OQ-018, OQ-019
- Related finding: FIND-032

## ASM-020 — Phase 07 structure design-gate may complete with open runner, oracle, and named-tester extensions

- Status: accepted
- Statement: Phase 07 structure drafting and a Phase 07 **structure**
  design-gate may complete while test-runner and CI products, quantity
  oracles, fixture volumes, RPO/RTO minutes, and named testers remain
  unanswered, provided each stays an explicit open extension and no
  test code, runner package, or CI pipeline is written. No coverage
  percent, Jest/Playwright choice, or UAT roster is invented as if
  decided.
- Owner: Project sponsor and Chief Solution Architect
- Validation: Project Owner accepted ASM-020 and approved Phase 07 as
  APR-009 at `2026-09-06T23:44:00+03:30`. This does **not** close any
  `OQ-*`, accept a runner, or authorize implementation. Later
  answers are still required before executable tests or a test-runner ADR
- Affects: Phase 07 exit, Phase 08 integration/deployment, implementation lock
- Related questions: OQ-001, OQ-002, OQ-014, OQ-016, OQ-018, OQ-019
- Related finding: FIND-033

## ASM-021 — Phase 08 structure design-gate may complete with open integration and deployment products

- Status: accepted
- Statement: Phase 08 structure drafting and a Phase 08 **structure**
  design-gate may complete while weighbridge protocol and device key,
  legal accounting product, hosting/Docker, observability product,
  backup vendor, RPO/RTO minutes, and named operators remain
  unanswered, provided each stays an explicit open extension and no
  adapter code, Dockerfile, CI, or deployment manifest is written. No
  protocol, cloud, or recovery minute-count is invented as if decided.
- Owner: Project sponsor and Chief Solution Architect
- Validation: Project Owner accepted ASM-021 and approved Phase 08 as
  APR-010 at `2026-09-07T01:28:00+03:30`. This does **not** close any
  `OQ-*`, accept a deployment product, or authorize implementation. Later
  answers are still required before adapter ADRs or a hosting ADR
- Affects: Phase 08 exit, Phase 09 repository, implementation lock
- Related questions: OQ-010, OQ-011, OQ-012, OQ-013, OQ-014, OQ-015,
  OQ-016, OQ-018, OQ-019
- Related finding: FIND-034

## ASM-022 — Phase 09 structure design-gate may complete with open repository products

- Status: accepted
- Statement: Phase 09 structure drafting and a Phase 09 **structure**
  design-gate may complete while package manager (npm/pnpm), Git hosting
  product, CI product, and named documentation maintainers remain
  unanswered, provided each stays an explicit open extension and no
  `package.json`, `tsconfig`, application folder, or CI workflow is
  written. No monorepo tool or branch-hosting product is invented as if
  decided.
- Owner: Project sponsor and Chief Solution Architect
- Validation: Project Owner accepted ASM-022 and approved Phase 09 as
  APR-011 at `2026-09-07T21:17:00+03:30`. This does **not** close any
  `OQ-*`, accept a package manager, or authorize implementation. Later
  answers are still required before a repository-tool ADR
- Affects: Phase 09 exit, Phase 10 AI/Cursor, implementation lock
- Related questions: OQ-018, OQ-019
- Related finding: FIND-035

## ASM-023 — Phase 10 structure design-gate may complete with open agent-tool products

- Status: in_review
- Statement: Phase 10 structure drafting and a Phase 10 **structure**
  design-gate may complete while extra MCP/tool products and named
  agent approvers remain unanswered, provided each stays an explicit
  open extension and no application source, unlock file, or package
  manifest is written. No extra MCP server or agent-runtime product is
  invented as if decided. Existing architecture-first Cursor controls
  remain labels, not an implementation unlock.
- Owner: Project sponsor and Chief Solution Architect
- Validation: pending Project Owner accept/reject at the Phase 10
  structure gate. This does **not** close any `OQ-*`, accept an MCP
  product, or authorize implementation.
- Affects: Phase 10 exit, Phase 11 validation, implementation lock
- Related questions: OQ-018, OQ-019
- Related finding: FIND-036
