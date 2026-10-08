---
id: GOV-DECISIONS-001
title: Decision Register
phase: 00-governance
status: in_review
version: 0.9.0
owners: [chief-solution-architect]
depends_on: [GOV-GATES-001, OQ-018]
last_reviewed: 2026-10-04
approval: null
supersedes: null
---

# Decision Register

Decisions must state their authority. Explicit user/business approvals and
accepted ADRs retain their recorded provenance. Under ADR-0012, delegated
technical decisions may be recorded with evidence and independent review;
they must not claim human acceptance where it has not occurred. Recommendations
without a recorded decision remain proposals.

APR-002 approved this register's Phase 00 seed version. APR-003 approves the
prior `0.3.0` version as accurate Phase 01 assimilation evidence. This `0.9.0`
revision is in review; ADR-0009 option 2 was explicitly accepted by the
Project Owner on `2026-10-02`. The protected human edits and final hook
protection were applied. Later live probes demonstrate interception for tested
operations, not complete enforcement or trust provenance. Each
ADR retains its own decision status; APR-003 did not accept ADR-0006 through
ADR-0008. OQ-018 team answers recorded `2026-09-15` accept ADR-0006 and
ADR-0007. ADR-0008 remains proposed. ADR-0011/0013 now record delegated binding
technical decisions, distinct from human acceptance of an implementation baseline.

## ADR-0001 — Backend technology family

- Status: accepted
- Decision: Backend implementation will use Node.js + TypeScript rather than
  .NET, ASP.NET Core, or C#.
- Authority: Explicit project instruction
- Consequence: Framework, DI, authentication, real-time, worker, persistence,
  decimal, testing, deployment, and observability choices require Node-compatible
  evaluation.
- Does not decide: NestJS, ORM, package versions, or detailed architecture

## ADR-0002 — Authoritative documentation language

- Status: accepted
- Decision: Architecture documents use English with canonical Persian business
  terms maintained in the Business Glossary.
- Authority: User approval on 2026-09-02

## ADR-0003 — Phase approval cadence

- Status: accepted
- Decision: Every phase stops for explicit user approval.
- Authority: User approval on 2026-09-02
- Current applicability: historical phase approvals remain intact. ADR-0012
  supersedes routine approval stops for delegated pre-implementation work;
  final implementation authorization remains human-only.

## ADR-0004 — Architecture checkpoint mechanism

- Status: accepted
- Decision: Use local Git checkpoints after each approved phase.
- Authority: User approval on 2026-09-02
- Constraint: No checkpoint is created before its phase is approved.
- Current applicability: historical human baseline checkpoints retain their
  original provenance. ADR-0012 permits ordinary delegated GCP evidence;
  a GCP does not approve an implementation baseline or impersonate APR/CHK.

## ADR-0005 — Premature implementation safeguard

- Status: accepted
- Decision: Add an always-on project rule, then prepare, test, and enable a
  documentation-only write-gating hook during Governance Foundation setup.
- Authority: User approval on 2026-09-02
- Limitation: Cursor controls are not an operating-system security boundary.
- Current applicability: ADR-0012 and the Owner's legacy-hook retirement replace
  routine micro-gating with trusted-agent compliance. No replacement hook or OS
  tamper-proofing is required; the canonical implementation lock remains binding.

## ADR-0006 — Architecture style

- Status: accepted
- Decision: Modular Monolith for the initial operational platform: one
  deployable application with bounded modules and the one-writer Inventory
  Ledger model. Kubernetes, Kafka, RabbitMQ, Redis, and service-per-domain
  deployment are not required for MVP unless a later evidence-based
  approval says otherwise.
- Authority: OQ-018 team answer recorded `2026-09-15`
- Consequence: Module ownership stays explicit; uncontrolled cross-module
  table access is rejected.
- Not decided: NestJS or any other framework, deployment units, or future
  split criteria

## ADR-0007 — PostgreSQL data platform

- Status: accepted
- Decision: PostgreSQL is the authoritative transactional data platform and
  system of record, including the Inventory Ledger.
- Authority: OQ-018 team answer recorded `2026-09-15` (OQ-017 uses explicit
  PostgreSQL transactions and locks as the posting style)
- Consequence: Exact decimal, constraints, locks, and rebuilds run against
  PostgreSQL. ORM must not become a second stock writer.
- Not decided: physical schema, ORM product, PostgreSQL version, hosting,
  HA, backup vendor, or stored-function posting (functions need a later
  ADR plus spike)

## ADR-0008 — MVP deployment topology

- Status: proposed
- Candidate: a controlled single-host topology using Ubuntu, Docker Compose,
  Nginx, API, durable Worker, web UI, and the selected data platform
- Rationale to evaluate: modest-scale and small-team assumptions with bounded
  operational complexity
- Alternatives required: evidence-based topology comparison against capacity,
  security, recovery, support, and availability requirements
- Open dependencies: ASM-002, ASM-007, ASM-011, OQ-014 residual counts,
  OQ-016 retention product, OQ-018 (explicitly did not freeze Docker)
- Not decided: container images, network layout, host count, cloud/on-premises
  location, HA, CI/CD, secrets, backup implementation, or deployment tooling

## Decisions deferred to dependent capabilities

- A backend framework for real business HTTP routes if needed; ADR-0013 chooses
  node:http health-only for foundation and freezes its supported Node version
- ORM evaluation only if later evidence warrants replacing ADR-0013 direct pg SQL
- Decimal TypeScript representation (PostgreSQL `NUMERIC` intended)
- Authentication/session/MFA packages
- Frontend architecture and framework (React/Socket.IO remain candidates)
- Durable worker scheduler
- Advanced browser/load tooling and production observability; ADR-0013 already
  fixes the foundation runner, real-PostgreSQL tests and structured logging
- MVP portal document list and later order-write phase (OQ-010 answered
  visibility-only; order write still deferred)
- ADR-0008 Docker/Nginx topology

## ADR-0009 — Codex project-control bootstrap (historical)

Historical accepted temporary-bootstrap decision. ADR-0012 supersedes its
incremental policy and native-enforcement prerequisite. Existing protected
controls are historical. The Owner retired the Codex PreToolUse registration;
after restart on 2026-10-04 repository search and canonical reads succeeded.
No new hook, installer or OS-enforcement prerequisite is introduced.

- Status: accepted as a temporary governance bootstrap; initial human
  protected edits and final hook protection are applied and verified. Trust and
  live verification remain pending.
- Context: Codex is the active agent, but the locked gate and Cursor validator
  previously excluded root `AGENTS.md` and `.codex` project-hook paths;
  the hook files are now protected; root `AGENTS.md` remains allowed. The Cursor
  hook does not intercept Codex tool calls.
- Options: (1) human-authored protected Codex files from the outset;
  (2) a temporary, exact-path governance bootstrap followed by human protection
  and hook trust; (3) policy self-check only.
- Decision: option 2, limited to the four exact paths in
  [CODEX_CONTROL_BOOTSTRAP.md](../../10-ai-cursor-development/CODEX_CONTROL_BOOTSTRAP.md).
- Criteria: one canonical gate, no ERP implementation permission, no agent
  write to marker/unlock/gate, testable Codex hook behavior, and final human
  protection/trust of hook definitions.
- Consequences and risks: the temporary Codex files were agent-editable
  during bootstrap while implementation remained locked; Codex
  hook interception is unverified until the final definition is trusted and
  tested. Hook coverage is not an OS security boundary.
- Reopen/change condition: any broader path, implementation authorization,
  duplicate authorization state, or unreviewed hook behavior needs a new review.
- Rollback: if bootstrap validation fails, the Project Owner removes the
  temporary paths from the protected gate/validator; the false implementation
  lock and absent unlock remain unchanged.
- Affected artifacts: canonical gate, protected Cursor validator/tests,
  root `AGENTS.md`, `.codex/hooks.json`, Codex hook script/tests, and agent
  authority/readiness documentation.
- Authority: Explicit Project Owner approval on `2026-10-02` of option 2. The
  protected edits are direct human actions; Codex creation of the four named
  bootstrap files followed verification of those edits; final human
  protection is applied and verified; trust remains pending. ERP implementation
  not authorized; the canonical gate remains `implementationAuthorized: false` and
  `approvedBaseline: null`, and the implementation unlock remains absent.
  Approval of this ADR alone does not change the protected gate or permit
  creation of paths outside its current locked write allowlist.

## ADR-0010 — Native-autonomy operating experiment (superseded)

- Status: superseded by ADR-0012 on 2026-10-04.
- Historical authority: explicit Owner native-autonomy instructions 2026-10-03.
- Disposition: retain failed-preflight and independent-review evidence; the
  experiment is abandoned because adversarial OS-containment exceeded the ERP
  workflow's needs. All installer requests are withdrawn. Do not repair/install
  its ACL, ProgramData, task/pipe/kernel or reparse mechanisms.
- Historical effect: no ERP implementation authorization or installed-state
  success is asserted here.

## ADR-0012 — Trusted-agent ERP pre-implementation governance

- Status: accepted operating decision.
- Authority: explicit Project Owner instruction dated 2026-10-04 terminating
  native/OS transition work and returning to conventional trusted-agent engineering.
- Decision: Codex obeys repository governance and Owner instructions; the lock
  is a governance obligation. Malicious-agent OS tamper resistance is outside
  project objectives and is not an implementation-start prerequisite.
- Delegated work: relevant source review, idempotency/transaction/audit contract,
  SLICE-ENVELOPE technical/physical freeze, developer/CI/test plan, capability
  backlog and independent useful engineering reviews.
- Human-only: implementation authorization, final unlock and human baseline
  approval. No gate/unlock/approval evidence is synthesized by the agent. Tool
  or repository trust is never implementation authorization.
- Preserve: ADR-0001/0006/0007, module-owned writes and single-writer inventory,
  atomic posting bundles and all factory/OQ answers and statuses.
- Retire: native installer/anchor/ACL/task/pipe/kernel work and its readiness
  blockers. No OS ACL changes or administrator action.
- Evidence: [trusted-agent model](../../10-ai-cursor-development/TRUSTED_AGENT_OPERATING_MODEL.md).
- State: implementationAuthorized=false; approvedBaseline=null; unlock absent.

## ADR-0011 — Generic durable command outcomes and replay

- Status: accepted delegated technical decision; not human baseline approval.
- Decision record: [ADR-0011](../adrs/ADR-0011-command-idempotency.md).
- Binding specification: [command idempotency](../../12-implementation-planning/COMMAND_IDEMPOTENCY_SPEC.md); earlier IDEMPOTENCY_DESIGN_DRAFT is superseded historical candidate evidence.
- Scope: bound command/target/payload/principal/scope, accepted/rejected replay,
  key conflicts, distinct-key business duplicates, audit, transaction atomicity,
  crash/uncertain retry and recovery. No factory answers or guard semantics are
  silently replaced. Full scoped UUID key, principal bound separately, accepted
  and rejected durable replay, fresh post-lock READ COMMITTED lookup, terminal-only
  outcome plus atomic original audit, known-rejection savepoint, technical errors
  and unknown COMMIT distinguished, no expiry/reuse, lossy-restore admission fence.
- Evidence: canonical DB/API/state/identity/audit sources reviewed and reconciled;
  useful independent design reviews in the current readiness package. Product
  acceptance tests execute only after human implementation authorization.
- Authority: ADR-0012 delegated engineering decisions. No human approval evidence,
  final baseline or implementation authorization is manufactured.

## ADR-0013 — Foundation-only SLICE-ENVELOPE technical and physical stack

- Status: accepted delegated technical decision; not human baseline approval.
- Decision record: [ADR-0013](../adrs/ADR-0013-slice-envelope-stack.md).
- Decision: supported pinned Node.js/TypeScript, npm workspaces and one root lock,
  health-only node:http host, direct parameterized pg SQL, authored SQL migrations,
  compiled node:test with real isolated PostgreSQL, ESLint/Prettier and bounded
  structured logging. No framework, ORM, broker, extra deployable or business route.
- Freeze: [technical choices and scripts](../../12-implementation-planning/TECHNICAL_FREEZE.md)
  and [physical tree, persistence, acceptance and DoD](../../12-implementation-planning/SLICE_ENVELOPE_PHYSICAL_DESIGN.md).
- Evidence: current primary support/release/compatibility/publisher metadata;
  canonical layout/import/module/QA contracts reconciled. Logical module homes
  remain intact; physical mapping does not add business capability to first scope.
- Authority: Owner's delegated trusted-agent engineering mandate under ADR-0012.
- Deferred: actual identity provider, domain decimal/arithmetic policy, frontend,
  devices, workers, deployment ADR-0008, backup product/retention and UAT/cutover
  inputs. These do not block the exact nonbusiness foundation.

## ADR-0014 — Local personal identity and transactional authorization

- Status: accepted technical choice within Owner-authorized APR-019 Identity scope.
- [Decision](../adrs/ADR-0014-local-identity-authorization.md): native scrypt,
  PostgreSQL digest-only sessions and scoped human grants, private immutable
  contexts, current target/result policies, account/session locks in command TX,
  append-only atomic security events and explicit owner-only initial provisioning.
- Exact original Node/TypeScript/npm/pg pins remain; no new dependencies/provider,
  QC, station lifecycle, business posting, frontend or infrastructure.
- Real names/ACT assignments and OQ-019 approval policy are not inferred or closed.
  [Implementation evidence](../../12-implementation-planning/IDENTITY_AUTHORIZATION_IMPLEMENTATION_STATUS.md).

## ADR-0015 — Exact kg and application-owned inventory posting kernel

- Status: accepted technical mechanism within explicit Owner APR-020 scope.
- [Decision](../adrs/ADR-0015-inventory-posting-kernel.md): exact bounded BigInt kg,
  nonrounding checked NUMERIC, one supplied transaction, globally ordered scoped
  Unit/effect/claim locks, immutable Ledger provenance and reconstructible Balance.
- Source-effect identity supplements envelope keys; fresh-key production duplicate
  is CONFLICT, other mapped equivalent facts DUP. Current owning policies are
  mandatory; no stock HTTP route, QC, business bundle or second writer introduced.
- OQ-001 technical capacity subdecision is resolved; its factory/business residuals
  and all other OQ statuses remain unchanged. Evidence: [IPS delivery](../../12-implementation-planning/SLICE_IPS_IMPLEMENTATION_STATUS.md).

## ADR-0016 — Atomic manual Goods Receipt

Accepted engineering decision in actual APR-021 Owner scope/policy:
[ADR-0016](../adrs/ADR-0016-manual-goods-receipt.md). WH-only personal manual
admission; receipt document/key identity distinct from nonunique Internal Code;
Procurement lifecycle and Inventory origin through sole IPS in one envelope
transaction; whole kg, scoped Sheet code, authenticated stock reads and default
recovery admission fence. No new business policy/PO/QC/ticket is inferred.

## ADR-0017 — Non-monetary Sales demand and STOCK confirmation

Accepted engineering mechanism within APR-022 backlog progression:
[ADR-0017](../adrs/ADR-0017-sales-demand-confirmation.md). Customer-scoped personal
ACT-SALES, immutable demand/specification snapshot with NOT_SUPPLIED monetary terms,
recorded Ledger-backed STOCK evidence and confirmation without allocation/reservation.
Sales owns its records; Inventory remains sole quantity owner. One envelope transaction
preserves state/audit/outcome and current replay disclosure. No commercial policy is
invented. [Actual delivery](../../12-implementation-planning/SLICE_STOCK_DEMAND_IMPLEMENTATION_STATUS.md).
