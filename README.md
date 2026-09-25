# Foolad Navardkaran ERP/MES — Architecture Repository

This repository is the **design authority** for an integrated ERP/MES for
Foolad Navardkaran (شرکت فولاد نوردکاران): sales, procurement, inventory,
production, quality, shipping, Finance-Lite, genealogy/traceability, and
operational monitoring.

If you opened this repository expecting application source, you are in the
right place at the wrong stage. **There is no implemented application yet.**
What exists is a gated architecture, a set of canonical registers, and Cursor
controls that **forbid** writing application code until a human unlock exists.

```text
IMPLEMENTATION_AUTHORIZED: false
CURRENT_PHASE: 12-implementation-planning
NO_IMPLEMENTATION_UNLOCK: true
```

Authoritative work permission:
[docs/00-governance/CURRENT_PHASE.md](docs/00-governance/CURRENT_PHASE.md).

Full document index:
[docs/INDEX.md](docs/INDEX.md).

---

## 1. What this repository is (and is not)

| This repository **is** | This repository **is not** |
| --- | --- |
| The architecture and governance baseline for the ERP/MES | A running NestJS / React / Prisma application |
| Markdown design artefacts under `docs/` | A place to invent factory numbers, role mappings, or package choices |
| Cursor lock files under `.cursor/` that keep implementation locked | An implementation unlock |
| A Modular Monolith design on Node.js + TypeScript + PostgreSQL | A microservices, Kafka, Kubernetes, or Event Sourcing design |

**Runtime technology that is accepted**

- Node.js + TypeScript — [ADR-0001](docs/00-governance/registers/DECISIONS.md)
- Modular Monolith — [ADR-0006](docs/00-governance/registers/DECISIONS.md)
- PostgreSQL as transactional system of record, including Inventory Ledger —
  [ADR-0007](docs/00-governance/registers/DECISIONS.md)

**Not accepted unless a later ADR says so:** NestJS, Prisma, React, Socket.IO,
JWT, Keycloak, Jest, Playwright, Docker Compose / Nginx ([ADR-0008 remains
proposed](docs/00-governance/registers/DECISIONS.md)), npm/pnpm, extra MCP.
.NET / C# / ASP.NET are superseded.

**Not required for MVP:** Kafka, RabbitMQ, Kubernetes, Event Sourcing, a
time-series database, a service-per-domain mesh.

---

## 2. How a new developer should read this project

Read in this order. Do **not** start coding.

1. This README (orientation and current lock).
2. [CURRENT_PHASE.md](docs/00-governance/CURRENT_PHASE.md) — what you may
   change.
3. [ARCHITECTURE_CHARTER.md](docs/00-governance/ARCHITECTURE_CHARTER.md) —
   why the work is gated.
4. [OPEN_QUESTIONS.md](docs/00-governance/registers/OPEN_QUESTIONS.md) — live
   OQ status, including factory-meeting evidence.
5. [DECISIONS.md](docs/00-governance/registers/DECISIONS.md) — ADR status.
6. [TEAM_QUESTION_PACK.md](docs/00-governance/TEAM_QUESTION_PACK.md) — what
   still needs a factory/sponsor answer.
7. [BUSINESS_GLOSSARY.md](docs/00-governance/registers/BUSINESS_GLOSSARY.md)
   and [CANONICAL_DOMAIN_MODEL.md](docs/00-governance/registers/CANONICAL_DOMAIN_MODEL.md).
8. Domain and process:
   [CAPABILITY_BOUNDED_CONTEXT_MAP.md](docs/02-domain-business-architecture/CAPABILITY_BOUNDED_CONTEXT_MAP.md),
   [PROCESS_MAPS_AS_IS_TO_BE.md](docs/02-domain-business-architecture/PROCESS_MAPS_AS_IS_TO_BE.md),
   [MVP_SCOPE_AND_BUSINESS_RULES.md](docs/02-domain-business-architecture/MVP_SCOPE_AND_BUSINESS_RULES.md).
9. Invariants and state:
   [INVARIANT_CATALOGUE.md](docs/03-state-machines-invariants/INVARIANT_CATALOGUE.md),
   [STATE_MACHINE_CATALOGUE.md](docs/03-state-machines-invariants/STATE_MACHINE_CATALOGUE.md),
   [TRANSITION_TABLES.md](docs/03-state-machines-invariants/TRANSITION_TABLES.md).
10. Data and posting:
    [LOGICAL_MODEL.md](docs/04-database-architecture/LOGICAL_MODEL.md),
    [TRANSACTION_AND_IDEMPOTENCY.md](docs/04-database-architecture/TRANSACTION_AND_IDEMPOTENCY.md),
    [GENEALOGY_PROJECTION.md](docs/04-database-architecture/GENEALOGY_PROJECTION.md).
11. Commands and modules:
    [COMMAND_CATALOGUE.md](docs/05-application-api-architecture/COMMAND_CATALOGUE.md),
    [MODULE_DEPENDENCY_MAP.md](docs/05-application-api-architecture/MODULE_DEPENDENCY_MAP.md).
12. Implementation *plan* (not permission):
    [IMPLEMENTATION_READINESS.md](docs/12-implementation-planning/IMPLEMENTATION_READINESS.md),
    [ROADMAP_AND_SLICES.md](docs/12-implementation-planning/ROADMAP_AND_SLICES.md),
    [AUTHORIZATION_RECORD.md](docs/12-implementation-planning/AUTHORIZATION_RECORD.md).

Chat, this README, and older APR/CHK freeze text are **not** a second register.
When they disagree, the live files in step 2–5 win.

---

## 3. Where we are now

The project completed **architecture phases 00–12** as **structure**, then six
**reconciliation gates**, then recorded **factory-site business evidence**, then
ran a **clarification-assessment** that concluded **no additional OQ can be
fully closed** from that evidence.

| Item | State |
| --- | --- |
| Architecture phases 00–12 | Approved as structure ([APR-002](docs/00-governance/approved-baselines/APR-002-governance.md) through [APR-014](docs/00-governance/approved-baselines/APR-014-implementation-planning.md)) |
| Gates 1–5 (architecture consistency) | Completed |
| Gate 6 (implementation-readiness) | Completed |
| Gate 6 result | `READY FOR HUMAN IMPLEMENTATION AUTHORIZATION` |
| `IMPLEMENTATION_AUTHORIZED` | **`false`** |
| [architecture-gate.json](.cursor/architecture-gate.json) | `"implementationAuthorized": false`; `"approvedBaseline": null` |
| `.cursor/IMPLEMENTATION_UNLOCK.json` | **Absent** (human-only; agents must never create it) |
| Application source / packages / migrations | **Must not exist yet** |
| Factory meeting FACT-01–FACT-06 | Recorded as business evidence (`2026-09-23`) |
| FACT-04 roster | **11 people**, including Mr. Dinavand — Workshop Manager |
| Clarification assessment | No additional OQ fully closable from current factory evidence |
| Next authorized step | Explicit **human** implementation authorization against a **current** approved baseline — **or** further factory answers onto matching `OQ-*` rows |

**Ready for authorization is not authorized.** Gate 6 allows a human to decide
whether to unlock. Phase 12 approval ([CHK-0013](docs/00-governance/approved-baselines/CHK-0013-phase-12.md)
at `a6b893095af7c9d14f342371fb6e4ef9c6d833df`, `2026-09-07`) is a **structure
freeze**, not the complete live baseline and not an unlock.

There is no Phase 13.

---

## 4. How we got here (timeline)

The work was never “write the app, then document it.” It was: **assimilate
sources → design → freeze each phase → record team answers → reconcile
contradictions → record factory facts → keep implementation locked.**

```text
Sources (SRC-001 / SRC-002)
    → Phase 00 governance
    → Phases 01–12 architecture (each: draft → self-check → independent
      review → reconciliation → APR → CHK Git freeze)
    → Team answers OQ-001–OQ-019 (2026-09-15)
    → Reconciliation Gates 1–5
    → Gate 6 implementation-readiness (locked)
    → Factory meeting FACT-01–FACT-06 (2026-09-23)
    → FACT-04 roster correction (11 people)
    → Clarification assessment (no extra OQ closed)
    → still IMPLEMENTATION_AUTHORIZED: false
```

### 4.1 Architecture phases 00–12 (structure)

Every phase used the same cadence, defined in
[PHASE_GATES.md](docs/00-governance/PHASE_GATES.md) and
[DOCUMENTATION_STANDARD.md](docs/00-governance/DOCUMENTATION_STANDARD.md):

`draft → self-check → independent review → reconciliation → explicit human
approval (APR-*) → Git checkpoint (CHK-*)`

| Phase | What it produced | Approval | Checkpoint |
| --- | --- | --- | --- |
| `00-governance` | Charter, registers, templates, write-gate | [APR-002](docs/00-governance/approved-baselines/APR-002-governance.md) | [CHK-0001](docs/00-governance/approved-baselines/CHK-0001-phase-00.md) `540a606…` |
| `01-project-assimilation` | Sources, workshop agenda, assimilation report | [APR-003](docs/00-governance/approved-baselines/APR-003-project-assimilation.md) | [CHK-0002](docs/00-governance/approved-baselines/CHK-0002-phase-01.md) `91273e9…` |
| `02-domain-business-architecture` | Capabilities, processes, actors, MVP rules | [APR-004](docs/00-governance/approved-baselines/APR-004-domain-business-architecture.md) | [CHK-0003](docs/00-governance/approved-baselines/CHK-0003-phase-02.md) `ec3c210…` |
| `03-state-machines-invariants` | INV-*, SM-*, transitions, SoD | [APR-005](docs/00-governance/approved-baselines/APR-005-state-machines-invariants.md) | [CHK-0006](docs/00-governance/approved-baselines/CHK-0006-phase-03.md) `bef6b64…` |
| `04-database-architecture` | Logical model, Ledger, genealogy projection | [APR-006](docs/00-governance/approved-baselines/APR-006-database-architecture.md) | [CHK-0004](docs/00-governance/approved-baselines/CHK-0004-phase-04.md) `87f9f10…` |
| `05-application-api-architecture` | Commands, queries, orchestration | [APR-007](docs/00-governance/approved-baselines/APR-007-application-api-architecture.md) | [CHK-0005](docs/00-governance/approved-baselines/CHK-0005-phase-05.md) `00b30a3…` |
| `06-security-rbac-audit` | Identity, RBAC labels, audit taxonomy | [APR-008](docs/00-governance/approved-baselines/APR-008-security-rbac-audit.md) | [CHK-0007](docs/00-governance/approved-baselines/CHK-0007-phase-06.md) `1673535…` |
| `07-testing-quality-architecture` | Verification *intents* (not a `TEST-*` catalogue) | [APR-009](docs/00-governance/approved-baselines/APR-009-testing-quality-architecture.md) | [CHK-0008](docs/00-governance/approved-baselines/CHK-0008-phase-07.md) `29921d6…` |
| `08-integration-deployment` | Adapters, recovery labels, topology **labels** | [APR-010](docs/00-governance/approved-baselines/APR-010-integration-deployment.md) | [CHK-0009](docs/00-governance/approved-baselines/CHK-0009-phase-08.md) `751035d…` |
| `09-repository-documentation` | Future layout, import rules, conformance labels | [APR-011](docs/00-governance/approved-baselines/APR-011-repository-documentation.md) | [CHK-0010](docs/00-governance/approved-baselines/CHK-0010-phase-09.md) `81aef0e…` |
| `10-ai-cursor-development` | Agent authority, unlock rules | [APR-012](docs/00-governance/approved-baselines/APR-012-ai-cursor-development.md) | [CHK-0011](docs/00-governance/approved-baselines/CHK-0011-phase-10.md) `1d581c4…` |
| `11-architecture-validation` | Integrated review, walkthroughs, coverage | [APR-013](docs/00-governance/approved-baselines/APR-013-architecture-validation.md) | [CHK-0012](docs/00-governance/approved-baselines/CHK-0012-phase-11.md) `57062e9…` |
| `12-implementation-planning` | Slices, readiness, unlock **labels** | [APR-014](docs/00-governance/approved-baselines/APR-014-implementation-planning.md) | [CHK-0013](docs/00-governance/approved-baselines/CHK-0013-phase-12.md) `a6b8930…` |

Approval register:
[APPROVALS.md](docs/00-governance/APPROVALS.md).
Baseline folder:
[approved-baselines/](docs/00-governance/approved-baselines/).

Those CHK files are **historical freezes**. Several still say “OQs unanswered”
or “only ADR-0001.” That was true **on the freeze date**. Live status is
[OPEN_QUESTIONS.md](docs/00-governance/registers/OPEN_QUESTIONS.md) and
[DECISIONS.md](docs/00-governance/registers/DECISIONS.md).

### 4.2 Team answers (`2026-09-15`)

The Project Owner supplied Markdown answers
[OQ-001.md](docs/00-governance/team-answers/OQ-001.md) through
[OQ-019.md](docs/00-governance/team-answers/OQ-019.md). They become
authoritative only on the matching row in
[OPEN_QUESTIONS.md](docs/00-governance/registers/OPEN_QUESTIONS.md).
Index of answer files:
[team-answers/README.md](docs/00-governance/team-answers/README.md).

Answered vs treating is summarized in [section 8](#8-open-questions-oq-001-through-oq-019).

### 4.3 Reconciliation Gates 1–6

After Phase 12, six architecture/governance reviews aligned the **live**
corpus. They did **not** unlock implementation.

#### Gate 1 — Inventory / production integrity

**Result:** PASS WITH OPEN ITEM.

- Inventory Ledger is the stock-movement source of truth.
- Inventory Balance is a rebuildable projection (`Ledger → Balance`). See
  [LOGICAL_MODEL.md](docs/04-database-architecture/LOGICAL_MODEL.md) and
  [POSTING_KERNEL.md](docs/04-database-architecture/POSTING_KERNEL.md).
- `ACT-IPS` (`mod-inventory-posting`) is the sole stock writer. No direct
  Balance edits. No negative inventory.
  [MODULE_OWNERSHIP_MATRIX.md](docs/02-domain-business-architecture/MODULE_OWNERSHIP_MATRIX.md).
- `CompleteProductionOperation` is the exclusive production posting boundary
  ([OQ-003](docs/00-governance/team-answers/OQ-003.md),
  [TRANSITION_TABLES.md](docs/03-state-machines-invariants/TRANSITION_TABLES.md)).
- Consumption, good output/WIP, reusable residual **or** scrap, residual
  identity, scrap quantity, genealogy source facts, Ledger posts, validations,
  and optional QC request belong in **one** business transaction (DATA-TX-001).
- Nested primitives (`ConsumeUnitPartial` / `ConsumeUnitComplete`,
  `CreateResidualUnit`, `PostScrapMovement`, `ScrapUnit` as destiny) are **not**
  independent production posting flows.
- Residual quantity posts once; `PlaceResidualUnit` does not post a second
  residual quantity. Scrap quantity posts once via `PostScrapMovement`.
- Genealogy rebuilds from canonical source facts, not Ledger rows alone
  (FIND-G-014).
  [GENEALOGY_PROJECTION.md](docs/04-database-architecture/GENEALOGY_PROJECTION.md).

Residuals: routing step names (OQ-003); residual/scrap cutoff numbers (OQ-009);
UOM scale (OQ-001).

#### Gate 2 — Sales closure / reservation

**Result:** Accepted after a correction pass (FIND-G-003 / FIND-G-005).

- `FULFILLED → CLOSED` when remaining valid demand is already zero within
  OQ-006 tolerance (default 0). `FULFILLED` is remaining-demand truth, not
  “delivered”.
- `PARTIALLY_FULFILLED → CLOSED` only with authorized TERM-005 Unfulfilled
  Demand. Valid remaining demand is not discarded.
  [BUSINESS_GLOSSARY.md](docs/00-governance/registers/BUSINESS_GLOSSARY.md)
  TERM-005.
- `CANCELLED → CLOSED` after confirm-cancel.
- Payment and invoice lifecycle do **not** close the Sales Order
  ([OQ-007](docs/00-governance/team-answers/OQ-007.md)).
- Shipment `DELIVERED` is a fulfillment **fact**, not an independent close
  trigger.
- At most one `ACTIVE` reservation per Inventory Unit. `REQUESTED` does not
  occupy that slot. No steal. Earlier `ConfirmSalesOrder` timestamp wins
  `ACTIVE` competition. `ConfirmSalesOrder` does not create `REQUESTED`.
  Confirmed-SO reservations have no invented TTL.
  [OQ-008](docs/00-governance/team-answers/OQ-008.md),
  [CONCURRENCY_AND_INTERLOCK.md](docs/03-state-machines-invariants/CONCURRENCY_AND_INTERLOCK.md).
- Reservation ≠ allocation ≠ consumption.

#### Gate 3 — OQ / ADR propagation

**Result:** PASS WITH OPEN ITEM.

- ADR-0001, ADR-0006, ADR-0007 **accepted**. ADR-0008 remains **proposed**.
- Answered OQs are not live architecture blockers. Treating residuals stay
  treating (`GUARD_OPEN_POLICY` where a command needs a missing number/name).
- Historical APR/CHK wording that disagrees with live registers is freeze
  evidence, not current policy.

#### Gate 4 — Genealogy / recovery / cross-domain

**Result:** PASS WITH OPEN ITEM.

- Eight genealogy source-fact families (DATA-GEN-001 / FIND-G-014): Lot Origin,
  Consumption, Output, Residual, Scrap, Package, Shipment, Rework.
- Genealogy Link (TERM-025) is a rebuildable **projection**. No `EditGenealogy`.
  No `ENT-REWORK` entity was invented.
- `Ledger → Balance` and `source facts → Genealogy` are **separate** recovery
  paths. Rebuild is reconstruction, not a new posting and not Event Sourcing.
  [BACKUP_AND_RECOVERY.md](docs/08-integration-deployment/BACKUP_AND_RECOVERY.md),
  [RETENTION_MIGRATION_OPENING_STOCK.md](docs/04-database-architecture/RETENTION_MIGRATION_OPENING_STOCK.md).
- Cross-module table writes are forbidden. Named commands orchestrate
  ([ORCHESTRATION.md](docs/05-application-api-architecture/ORCHESTRATION.md)).
- Correction = new compensating command + link to the original (INV-005)
  ([EXCEPTION_CORRECTION.md](docs/03-state-machines-invariants/EXCEPTION_CORRECTION.md)).

#### Gate 5 — Final architecture consistency

**Result:** PASS WITH OPEN RESIDUALS.

No substantive live architecture contradiction was identified. Modular Monolith
→ module-owned boundaries → PostgreSQL → named commands → application-owned
transactions → `ACT-IPS` → Ledger truth → rebuildable Balance holds together
with QC SoD, portal visibility-only, weighbridge-as-commander, and the
implementation lock.

#### Gate 6 — Implementation-readiness

**Result:** `READY FOR HUMAN IMPLEMENTATION AUTHORIZATION`.

Defined what must be true before a human may authorize implementation.
**Did not authorize implementation.** No unlock file was created. CHK-0013 is
**not** the complete current baseline (team answers and Gates 1–5 came later).

See [IMPLEMENTATION_READINESS.md](docs/12-implementation-planning/IMPLEMENTATION_READINESS.md)
and [AUTHORIZATION_RECORD.md](docs/12-implementation-planning/AUTHORIZATION_RECORD.md).

### 4.4 Factory meeting (`2026-09-23`)

A factory-site meeting produced six **confirmed business facts**. They were
recorded as evidence. They do **not** authorize implementation, do **not**
close treating residuals they do not actually answer, and do **not** accept
ADR-0008.

Canonical recording:
[OPEN_QUESTIONS.md — Factory meeting evidence](docs/00-governance/registers/OPEN_QUESTIONS.md).

| Fact | What was recorded | What was **not** decided |
| --- | --- | --- |
| **FACT-01** | kg is primary for incoming coils/sheets **and** customer orders; length/thickness/type are secondary | Decimal scale, rounding, conversion formulas, numeric tolerance. [OQ-001](docs/00-governance/team-answers/OQ-001.md) stays `treating`. [OQ-002](docs/00-governance/team-answers/OQ-002.md) stays `answered` (reinforced). |
| **FACT-02** | Cut pieces and order scrap carry the customer **order code**; unique ID per tiny piece is not feasible | Exact order-code identity (DB id vs human-visible number vs shop code). Inventory Unit is **retained**. [OQ-004](docs/00-governance/team-answers/OQ-004.md). Glossary distinctions: [BUSINESS_GLOSSARY.md](docs/00-governance/registers/BUSINESS_GLOSSARY.md). |
| **FACT-03** | Opened-coil leftover may be cut to market-length sheets (examples 6 m / 12 m) **without a new customer order**, stored in the warehouse; sheets retain **original coil** code; count/length/weight measured | Domain classification **OPEN**. Not nested into `CompleteProductionOperation` or DATA-TX-001. Not a new command. [PROCESS_MAPS_AS_IS_TO_BE.md](docs/02-domain-business-architecture/PROCESS_MAPS_AS_IS_TO_BE.md). [OQ-009](docs/00-governance/team-answers/OQ-009.md) stays `treating`. |
| **FACT-04** | **Eleven-person organizational roster** (see [section 9](#9-factory-personnel-fact-04)) | Not RBAC. Not `ACT-*`. Not SoD. Not delegates. Operators still missing. [OQ-019](docs/00-governance/team-answers/OQ-019.md) stays `treating`. |
| **FACT-05** | Stations; Production Manager defines routing; station receives work and reports completion; sequential flow | Station account vs per-command **human** `actor_identity`. Live [SESSION_AND_IDENTITY.md](docs/06-security-rbac-audit/SESSION_AND_IDENTITY.md) is **unchanged** (`SharedTerminal` still requires operator identity per command). Conflict recorded, not resolved. |
| **FACT-06** | Record and show when an order **enters** a station and is **forwarded** | Equivalence to `StartProductionOperation` / `CompleteProductionOperation` is **not** established. Do not invent `started_at` / `queued_at` fields. [STATE_MACHINE_CATALOGUE.md](docs/03-state-machines-invariants/STATE_MACHINE_CATALOGUE.md). |

Factory-confirmed **requirement evidence labels** `RQ-01`–`RQ-07` (not `INV-*`,
not a minted `REQ-*` catalogue):
[MVP_SCOPE_AND_BUSINESS_RULES.md](docs/02-domain-business-architecture/MVP_SCOPE_AND_BUSINESS_RULES.md),
[REQUIREMENTS_TRACEABILITY.md](docs/00-governance/registers/REQUIREMENTS_TRACEABILITY.md).

Standing questions for the next factory/sponsor pass:
[TEAM_QUESTION_PACK.md](docs/00-governance/TEAM_QUESTION_PACK.md).

### 4.5 FACT-04 roster correction

The first recording omitted **Mr. Dinavand — Workshop Manager**. The live
documents now list **eleven** organizational people. That correction did not
map anyone to system roles.

### 4.6 Clarification assessment

A later analysis-only pass asked which treating OQs the factory evidence could
**fully** close. Result:

```text
No additional OQ can be fully closed from the current factory evidence.
```

Highest remaining factory clarifications (in order): FACT-03 coil→sheet
classification; FACT-05 station vs human identity; FACT-06 enter/forward
semantics; OQ-001 numeric policy; OQ-003 routing catalogue; OQ-005 Quality
plans/names; OQ-009 cutoff numbers; OQ-019 role mapping. Also still treating
and untouched by the meeting: OQ-011, OQ-014, OQ-015.

No files were changed in that assessment pass.

---

## 5. Governance model a developer must obey

### 5.1 Canonical registers

Index: [registers/README.md](docs/00-governance/registers/README.md).

| Register | Role |
| --- | --- |
| [OPEN_QUESTIONS.md](docs/00-governance/registers/OPEN_QUESTIONS.md) | Live OQ status |
| [DECISIONS.md](docs/00-governance/registers/DECISIONS.md) | ADRs |
| [BUSINESS_GLOSSARY.md](docs/00-governance/registers/BUSINESS_GLOSSARY.md) | Terms (TERM-*) |
| [ASSUMPTIONS.md](docs/00-governance/registers/ASSUMPTIONS.md) | ASM-* |
| [RISKS.md](docs/00-governance/registers/RISKS.md) | RISK-* |
| [REVIEW_FINDINGS.md](docs/00-governance/registers/REVIEW_FINDINGS.md) | FIND-* |
| [REQUIREMENTS_TRACEABILITY.md](docs/00-governance/registers/REQUIREMENTS_TRACEABILITY.md) | REQ-OBJ-* / RQ-* evidence |
| [CANONICAL_DOMAIN_MODEL.md](docs/00-governance/registers/CANONICAL_DOMAIN_MODEL.md) | Domain concepts |
| [CANONICAL_DATA_DICTIONARY.md](docs/00-governance/registers/CANONICAL_DATA_DICTIONARY.md) | Data dictionary |
| [STATE_TRANSITION_CATALOGUE.md](docs/00-governance/registers/STATE_TRANSITION_CATALOGUE.md) | Seed lifecycles |
| [INTEGRATION_CATALOGUE.md](docs/00-governance/registers/INTEGRATION_CATALOGUE.md) | Integration labels |
| [STAKEHOLDERS_RACI.md](docs/00-governance/registers/STAKEHOLDERS_RACI.md) | Workshop/sign-off roles |
| [SLICE_HOMES.md](docs/00-governance/registers/SLICE_HOMES.md) | Command/query/slice homes |

Phase documents **link** to these. They must not redefine them.

### 5.2 Implementation lock

Technical unlock requires **both**:

1. A **human-created** `.cursor/IMPLEMENTATION_UNLOCK.json`
2. [architecture-gate.json](.cursor/architecture-gate.json) set to
   `"implementationAuthorized": true` with the **same** `approvedBaseline`

Required unlock fields: `approvedBy`, `approvedAt`, `approvedBaseline`,
`allowedWritePaths`, `allowedShellCommands`. Template:
[IMPLEMENTATION_UNLOCK_TEMPLATE.md](docs/00-governance/templates/IMPLEMENTATION_UNLOCK_TEMPLATE.md).
Agent rule: `AG-UNLOCK` never
([AGENT_AUTHORITY.md](docs/10-ai-cursor-development/AGENT_AUTHORITY.md)).

While locked, Cursor agents may write only:

- `README.md`, `.gitignore`, `docs/**/*.md`
- `.cursor/rules/**/*.mdc`, `.cursor/skills/**/*.md`

Protected (never agent-created/edited while locked):
`.cursor/architecture-gate.json`, `.cursor/hooks.json`, `.cursor/hooks/**`,
`.cursor/IMPLEMENTATION_UNLOCK.json`, `.cursor/PHASE_CHECKPOINT_APPROVAL.json`.

Cursor controls:

- [.cursor/architecture-gate.json](.cursor/architecture-gate.json)
- [.cursor/rules/00-architecture-first.mdc](.cursor/rules/00-architecture-first.mdc)
- [.cursor/rules/01-phase-question-pack.mdc](.cursor/rules/01-phase-question-pack.mdc)
- [.cursor/skills/architecture-gate-review/SKILL.md](.cursor/skills/architecture-gate-review/SKILL.md)
- [.cursor/hooks.json](.cursor/hooks.json)
- [HOOK_VALIDATION.md](docs/00-governance/HOOK_VALIDATION.md)
- [TOOL_MCP_HOOK_SAFETY.md](docs/10-ai-cursor-development/TOOL_MCP_HOOK_SAFETY.md)

### 5.3 Treating residuals

Commands that need a missing number, name, plan, or device must reject with
`GUARD_OPEN_POLICY` rather than inventing a value
([EVENT_AND_REJECTION.md](docs/03-state-machines-invariants/EVENT_AND_REJECTION.md)).

---

## 6. Accepted architecture baseline (live)

### Inventory

- Ledger = immutable stock-movement evidence.
- Balance = rebuildable projection. No `AdjustBalance`.
- `ACT-IPS` sole writer of Ledger, Balance, and unit quantity.
- Official stock UOM is **kg**. Coil quantity is measured weight in kg
  ([OQ-002](docs/00-governance/team-answers/OQ-002.md)). Scale/rounding/factors
  remain [OQ-001 treating](docs/00-governance/team-answers/OQ-001.md).
- [INVARIANT_CATALOGUE.md](docs/03-state-machines-invariants/INVARIANT_CATALOGUE.md)
  INV-001–INV-004, INV-017.

### Production

- `CompleteProductionOperation` is the atomic posting boundary for
  consume/output/residual/scrap of **that** operation.
- FACT-03 coil→sheet conversion is a **separate, unclassified** business
  process until the factory answers ownership/domain/posting questions.
- [OQ-003](docs/00-governance/team-answers/OQ-003.md),
  [SIDE_EFFECT_MATRIX.md](docs/03-state-machines-invariants/SIDE_EFFECT_MATRIX.md).

### Sales / reservation

- Sales owns Sales Order lifecycle. Finance-Lite does not close it.
- Close paths: FULFILLED; PARTIALLY_FULFILLED + Unfulfilled Demand; CANCELLED.
- One Inventory Unit → one `ACTIVE` reservation.
- [OQ-007](docs/00-governance/team-answers/OQ-007.md),
  [OQ-008](docs/00-governance/team-answers/OQ-008.md).

### Genealogy / identity distinctions

Preserve separately ([BUSINESS_GLOSSARY.md](docs/00-governance/registers/BUSINESS_GLOSSARY.md)):

1. Customer Order / Order Code
2. Material Lot / Inventory Unit
3. Physical small piece (need not be an Inventory Unit)

FACT-03: original **coil** code and original **order** code may be different.

### Recovery

[OQ-016](docs/00-governance/team-answers/OQ-016.md): RPO 60 min, RTO 8 h,
daily backup, off-site copy. Retention days and backup **product** residual.

After restore: `BalanceRebuild` (Ledger → Balance); `GenealogyRebuild`
(DATA-GEN-001 → projection). Rebuilds do not post stock.

### Finance-Lite, portal, QC, weighbridge, scope

- Finance-Lite is **not** legal GL ([OQ-012](docs/00-governance/team-answers/OQ-012.md)).
- Customer Portal MVP is **visibility-only**
  ([OQ-010](docs/00-governance/team-answers/OQ-010.md), INV-020). No
  `PortalPlaceOrder`.
- QC can block availability/shipment; exceptional release is two distinct
  people ([OQ-005](docs/00-governance/team-answers/OQ-005.md)). Quality
  commands Inventory; it does not write Ledger.
  [AUTHORIZATION_SOD.md](docs/03-state-machines-invariants/AUTHORIZATION_SOD.md).
  Station accounts are **not** assumed sufficient for that two-person release.
- Weighbridge is a commander only
  ([OQ-011](docs/00-governance/team-answers/OQ-011.md),
  [INTEGRATION_CATALOGUE.md](docs/08-integration-deployment/INTEGRATION_CATALOGUE.md)).
- One legal entity, one principal site
  ([OQ-013](docs/00-governance/team-answers/OQ-013.md)).

---

## 7. Authoritative write paths and transaction boundaries

### Write paths

| Path | Owner | Detail |
| --- | --- | --- |
| Stock movement | `ACT-IPS` → Ledger | [POSTING_KERNEL.md](docs/04-database-architecture/POSTING_KERNEL.md) |
| Production completion | `CompleteProductionOperation` | [COMMAND_CATALOGUE.md](docs/05-application-api-architecture/COMMAND_CATALOGUE.md) |
| Residual identity (production leftover) | Nested `CreateResidualUnit` | Not a later independent production post |
| Scrap quantity | `PostScrapMovement` | Nested leftover **or** a new Quality/abort key |
| Goods receipt | Procurement orchestration + IPS | [OQ-017](docs/00-governance/team-answers/OQ-017.md) |
| Reservation | `RequestReservation` then `ActivateReservation` | Distinct commands |
| Shipment dispatch | Shipping command + IPS stock exit | Shipping does not write Ledger |
| Sales Order | Sales | Must not write Invoice/Ledger qty |
| Invoice / payment | Finance-Lite | Does not close SO |
| QC | Quality commands IPS | [ROLE_PERMISSION_MATRIX.md](docs/06-security-rbac-audit/ROLE_PERMISSION_MATRIX.md) |
| Weighbridge | `ADP-WEIGHBRIDGE` commander | Never a Ledger writer |
| Rebuilds | `BalanceRebuild` / `GenealogyRebuild` | Reconstruction |
| Opening stock | `OpeningStockImport` | Blocked until [OQ-015](docs/00-governance/team-answers/OQ-015.md) / OQ-019 |

**Forbidden:** `EditGenealogy`, `AdjustBalance`, `PortalPlaceOrder` (MVP),
direct Ledger writes by adapters/UI/Quality/Shipping, independent production
consume posting.

### DATA-TX-001 unsplittable bundles

Recorded in
[TRANSACTION_AND_IDEMPOTENCY.md](docs/04-database-architecture/TRANSACTION_AND_IDEMPOTENCY.md):

1. `CompleteProductionOperation` + nested consume/output/residual/scrap
2. `DispatchShipment` + stock exit
3. `PostGoodsReceipt` + Lot/Unit/Ledger
4. `ActivateReservation` + reserved-state + reserved qty
5. `AllocatePayment` + invoice open-balance
6. Quality/abort scrap that is **not** leftover of that completion

Do **not** add FACT-03 coil→sheet to this list until it is classified.
`CloseSalesOrder`, `CompleteOperationPartial`, `PlaceResidualUnit`, rebuilds,
and reversals are intentionally **not** extra universal bundles.

---

## 8. Open questions (OQ-001 through OQ-019)

Canonical:
[OPEN_QUESTIONS.md](docs/00-governance/registers/OPEN_QUESTIONS.md).
Pack:
[TEAM_QUESTION_PACK.md](docs/00-governance/TEAM_QUESTION_PACK.md).
Answer sheet:
[TEAM_ANSWER_SHEET.md](docs/00-governance/TEAM_ANSWER_SHEET.md).

| OQ | Status | Locked | Still unknown | Team answer |
| --- | --- | --- | --- | --- |
| OQ-001 | treating | kg-first (FACT-01 confirms incoming **and** customer orders) | Scale, rounding, factors, numeric tolerance | [OQ-001.md](docs/00-governance/team-answers/OQ-001.md) |
| OQ-002 | answered | Coil qty = kg | Ticket validation | [OQ-002.md](docs/00-governance/team-answers/OQ-002.md) |
| OQ-003 | treating | Post at `CompleteProductionOperation`; FACT-05/06 stations + visibility | Catalogue, abort title, identity, enter/forward mapping | [OQ-003.md](docs/00-governance/team-answers/OQ-003.md) |
| OQ-004 | answered | Hybrid grain; FACT-02 no per-piece Unit; order-code trace | Family catalogue; order-code identity | [OQ-004.md](docs/00-governance/team-answers/OQ-004.md) |
| OQ-005 | treating | QC blocks; two-person exceptional release | Plans, limits, named Quality people | [OQ-005.md](docs/00-governance/team-answers/OQ-005.md) |
| OQ-006 | answered | Partial ship; default tolerance 0 | Family/customer % | [OQ-006.md](docs/00-governance/team-answers/OQ-006.md) |
| OQ-007 | answered | Close on fulfill/cancel/unfulfilled, not payment | Later commercial exceptions | [OQ-007.md](docs/00-governance/team-answers/OQ-007.md) |
| OQ-008 | answered | One ACTIVE per unit; no confirmed-SO TTL | Temporary-hold TTL if added | [OQ-008.md](docs/00-governance/team-answers/OQ-008.md) |
| OQ-009 | treating | Reuse policy; FACT-03 unclassified process recorded | Cutoff numbers; FACT-03 classification | [OQ-009.md](docs/00-governance/team-answers/OQ-009.md) |
| OQ-010 | answered | Portal visibility-only | Document list | [OQ-010.md](docs/00-governance/team-answers/OQ-010.md) |
| OQ-011 | treating | Weighbridge never writes Ledger | Device/protocol/operator | [OQ-011.md](docs/00-governance/team-answers/OQ-011.md) |
| OQ-012 | answered | Finance-Lite ≠ legal GL | Accounting product later | [OQ-012.md](docs/00-governance/team-answers/OQ-012.md) |
| OQ-013 | answered | One entity, one site | Multi-site would reopen architecture | [OQ-013.md](docs/00-governance/team-answers/OQ-013.md) |
| OQ-014 | treating | Modest user scale | 12-month transaction counts | [OQ-014.md](docs/00-governance/team-answers/OQ-014.md) |
| OQ-015 | treating | Opening stock = Ledger facts | Files, freeze, named signers | [OQ-015.md](docs/00-governance/team-answers/OQ-015.md) |
| OQ-016 | answered | RPO 60 / RTO 8 / daily / off-site | Retention days; product | [OQ-016.md](docs/00-governance/team-answers/OQ-016.md) |
| OQ-017 | answered | App-owned PostgreSQL TX | Stored functions later ADR | [OQ-017.md](docs/00-governance/team-answers/OQ-017.md) |
| OQ-018 | answered | MM + PG + Node/TS | NestJS, Prisma, React, Docker, auth, MCP | [OQ-018.md](docs/00-governance/team-answers/OQ-018.md) |
| OQ-019 | treating | Role/RACI list; 11-person roster recorded | Mapping, delegates, operators, `ACT-*` | [OQ-019.md](docs/00-governance/team-answers/OQ-019.md) |

Inquiry/Quotation expiry remains FIND-026 (`workshop-commercial-practice`), not
a new `OQ-*` ([REVIEW_FINDINGS.md](docs/00-governance/registers/REVIEW_FINDINGS.md)).

---

## 9. Factory personnel (FACT-04)

Organizational facts only. **Not** a permission matrix.

Source:
[WORKSHOP_ROSTER.md](docs/02-domain-business-architecture/WORKSHOP_ROSTER.md),
[OQ-019.md](docs/00-governance/team-answers/OQ-019.md).

The 19 workshop **role** rows in `WORKSHOP_ROSTER.md` remain `(temporary)` and
unmapped (0 of 19 confirmed role assignments).

| Person | Organizational responsibility |
| --- | --- |
| Mr. Karimi | Warehousekeeper |
| Mr. Ghaffari | Invoice issuance/registration + IT responsibility |
| Ms. Koushki | Government trade-system registration + receivables follow-up |
| Mr. Pour-Ebrahim | Sales Manager + order receiving |
| Mr. Dinavand (آقای دیناروند) | Workshop Manager |
| Ms. Bohlouli | Commercial Manager + sales/order receiving |
| Ms. Masoumi | Recording completed purchases + sending proforma invoices |
| Ms. Goodarzi | Accounting Manager |
| Ms. Rangini | Accountant |
| Mr. Faraji | Chairman of the Board |
| Mr. Rouzbahani | CEO |

Production-line operators are **not** listed. Workshop Manager is **not**
inferred as `ACT-PLAN`, station-account owner, or coil-to-sheet commander.

Actors (system roles, not these people):
[ACTOR_RESPONSIBILITY_CATALOGUE.md](docs/02-domain-business-architecture/ACTOR_RESPONSIBILITY_CATALOGUE.md).

---

## 10. Decisions (ADRs)

[DECISIONS.md](docs/00-governance/registers/DECISIONS.md).
Template: [ADR_TEMPLATE.md](docs/00-governance/templates/ADR_TEMPLATE.md).

| ADR | Status | Meaning |
| --- | --- | --- |
| ADR-0001 | Accepted | Node.js + TypeScript |
| ADR-0002 | Accepted | English documentation + glossary |
| ADR-0003 | Accepted | Phase approval cadence |
| ADR-0004 | Accepted | Git checkpoints after approved phases |
| ADR-0005 | Accepted | Premature-implementation safeguard |
| ADR-0006 | Accepted | Modular Monolith |
| ADR-0007 | Accepted | PostgreSQL transactional SoR |
| ADR-0008 | **Proposed** | Candidate Ubuntu / Docker Compose / Nginx topology |

Candidate packages appearing in planning documents are **not** accepted
architecture.

---

## 11. Proposed implementation sequence (not authorized)

From [ROADMAP_AND_SLICES.md](docs/12-implementation-planning/ROADMAP_AND_SLICES.md)
and [WORK_ITEMS.md](docs/12-implementation-planning/WORK_ITEMS.md).
Homes: [SLICE_HOMES.md](docs/00-governance/registers/SLICE_HOMES.md).
Spikes: [SPIKES_AND_ACCEPTANCE.md](docs/12-implementation-planning/SPIKES_AND_ACCEPTANCE.md).
Cutover labels: [CUTOVER_TRAINING_ROLLOUT.md](docs/12-implementation-planning/CUTOVER_TRAINING_ROLLOUT.md).

This sequence is **not** permission to execute it.

0. Human unlock
1. Runtime/package ADR if packages are introduced
2. `SLICE-ENVELOPE` (command envelope, idempotency, `AUD-CMD-*`; no Ledger)
3. PostgreSQL foundation for Ledger / Unit / Reservation
4. `SLICE-IPS`
5. `SLICE-STOCK`
6. `SLICE-PURCHASE`
7. `SLICE-MAKE`
8. Genealogy projection
9. Portal visibility reads
10. `SLICE-REVERSE`
11. `SLICE-RESTORE`
12. `SLICE-CUTOVER` (blocked on OQ-015 / OQ-019)
13. Deploy / DR (ADR-0008 proposed)

After a valid unlock, slice rules include: one `SLICE-*` at a time;
`CONF-IPS` / `CONF-BUNDLE` / `CONF-IMPORT`; leave treating residuals as
`GUARD_OPEN_POLICY`;
[CONFORMANCE_CHECKS.md](docs/09-repository-documentation/CONFORMANCE_CHECKS.md);
[GENERATED_CODE_ACCEPTANCE.md](docs/10-ai-cursor-development/GENERATED_CODE_ACCEPTANCE.md).

---

## 12. What still blocks or guards work

| Guard | Effect |
| --- | --- |
| Human unlock | Blocks **all** application code |
| OQ-001 | Commands that need missing scale/rounding/factors |
| OQ-003 | Named routing / abort-after-post / station identity / enter-forward mapping |
| FACT-03 | Coil→sheet must not be implemented as an assumed command or DATA-TX-001 row |
| FACT-05 | Station accounts must not silently replace `actor_identity` |
| OQ-005 | Named exceptional releasers / Quality Plans |
| OQ-009 | Cutoff-dependent residual/scrap classification |
| OQ-011 | Automatic weighbridge path |
| OQ-014 | Physical capacity/index sizing |
| OQ-015 / OQ-019 | Opening-stock cutover and named sign-off |
| OQ-018 / ADR-0008 | Package and deployment product choices |

---

## 13. No-inference rules (factory evidence)

Do not treat any of the following as decided:

- Station account ≠ human identity unless explicitly decided.
- Original coil code ≠ customer order code unless explicitly decided.
- Coil → sheet ≠ `CompleteProductionOperation` unless explicitly decided.
- Coil → sheet ≠ `CreateResidualUnit` unless explicitly decided.
- 6 m / 12 m ≠ approved length catalogue unless explicitly confirmed.
- Start ≠ station entry unless explicitly confirmed.
- Complete ≠ station forwarding unless explicitly confirmed.
- Organizational title ≠ `ACT-*` permission.
- Roster ≠ SoD / sign-off assignment.
- kg-first ≠ decimal / rounding / conversion / tolerance policy.
- Gate 6 “ready” ≠ `IMPLEMENTATION_AUTHORIZED: true`.

---

## 14. Documentation map

Master index: [docs/INDEX.md](docs/INDEX.md).
This section is the same corpus grouped for a new developer.

### 14.1 Governance (`docs/00-governance/`)

- Phase home: [README.md](docs/00-governance/README.md)
- [ARCHITECTURE_CHARTER.md](docs/00-governance/ARCHITECTURE_CHARTER.md)
- [CURRENT_PHASE.md](docs/00-governance/CURRENT_PHASE.md)
- [PHASE_GATES.md](docs/00-governance/PHASE_GATES.md)
- [DOCUMENTATION_STANDARD.md](docs/00-governance/DOCUMENTATION_STANDARD.md)
- [SOURCE_REGISTER.md](docs/00-governance/SOURCE_REGISTER.md)
- [APPROVALS.md](docs/00-governance/APPROVALS.md)
- [TEAM_QUESTION_PACK.md](docs/00-governance/TEAM_QUESTION_PACK.md)
- [TEAM_ANSWER_SHEET.md](docs/00-governance/TEAM_ANSWER_SHEET.md)
- [HOOK_VALIDATION.md](docs/00-governance/HOOK_VALIDATION.md)
- Phase evidence: [SELF_CHECK.md](docs/00-governance/SELF_CHECK.md),
  [INDEPENDENT_REVIEW.md](docs/00-governance/INDEPENDENT_REVIEW.md),
  [RECONCILIATION.md](docs/00-governance/RECONCILIATION.md),
  [GATE_CHECKLIST.md](docs/00-governance/GATE_CHECKLIST.md)
- Templates: [templates/README.md](docs/00-governance/templates/README.md)

### 14.2 Phase 01 — Assimilation (`docs/01-project-assimilation/`)

[README.md](docs/01-project-assimilation/README.md) ·
[ARCHITECTURE_ASSIMILATION_REPORT.md](docs/01-project-assimilation/ARCHITECTURE_ASSIMILATION_REPORT.md) ·
[SOURCE_BIBLIOGRAPHY.md](docs/01-project-assimilation/SOURCE_BIBLIOGRAPHY.md) ·
[PROVENANCE_CLASSIFICATION.md](docs/01-project-assimilation/PROVENANCE_CLASSIFICATION.md) ·
[MULTI_AGENT_METHOD.md](docs/01-project-assimilation/MULTI_AGENT_METHOD.md) ·
[WORKSHOP_AGENDA.md](docs/01-project-assimilation/WORKSHOP_AGENDA.md)

### 14.3 Phase 02 — Domain (`docs/02-domain-business-architecture/`)

[README.md](docs/02-domain-business-architecture/README.md) ·
[CAPABILITY_BOUNDED_CONTEXT_MAP.md](docs/02-domain-business-architecture/CAPABILITY_BOUNDED_CONTEXT_MAP.md) ·
[PROCESS_MAPS_AS_IS_TO_BE.md](docs/02-domain-business-architecture/PROCESS_MAPS_AS_IS_TO_BE.md)
(includes FACT-03 coil→sheet, **DOMAIN CLASSIFICATION: OPEN**) ·
[ACTOR_RESPONSIBILITY_CATALOGUE.md](docs/02-domain-business-architecture/ACTOR_RESPONSIBILITY_CATALOGUE.md) ·
[MODULE_OWNERSHIP_MATRIX.md](docs/02-domain-business-architecture/MODULE_OWNERSHIP_MATRIX.md) ·
[MVP_SCOPE_AND_BUSINESS_RULES.md](docs/02-domain-business-architecture/MVP_SCOPE_AND_BUSINESS_RULES.md)
(BR-001–BR-020 and RQ-01–RQ-07) ·
[WORKSHOP_ROSTER.md](docs/02-domain-business-architecture/WORKSHOP_ROSTER.md) ·
[WORKSHOP_COLLECTION_MAP.md](docs/02-domain-business-architecture/WORKSHOP_COLLECTION_MAP.md) ·
[PHASE03_HANDOFF.md](docs/02-domain-business-architecture/PHASE03_HANDOFF.md)

### 14.4 Phase 03 — State machines (`docs/03-state-machines-invariants/`)

[README.md](docs/03-state-machines-invariants/README.md) ·
[INVARIANT_CATALOGUE.md](docs/03-state-machines-invariants/INVARIANT_CATALOGUE.md) ·
[STATE_MACHINE_CATALOGUE.md](docs/03-state-machines-invariants/STATE_MACHINE_CATALOGUE.md) ·
[TRANSITION_TABLES.md](docs/03-state-machines-invariants/TRANSITION_TABLES.md) ·
[SIDE_EFFECT_MATRIX.md](docs/03-state-machines-invariants/SIDE_EFFECT_MATRIX.md) ·
[CROSS_MACHINE_SEQUENCES.md](docs/03-state-machines-invariants/CROSS_MACHINE_SEQUENCES.md) ·
[CONCURRENCY_AND_INTERLOCK.md](docs/03-state-machines-invariants/CONCURRENCY_AND_INTERLOCK.md) ·
[EXCEPTION_CORRECTION.md](docs/03-state-machines-invariants/EXCEPTION_CORRECTION.md) ·
[EVENT_AND_REJECTION.md](docs/03-state-machines-invariants/EVENT_AND_REJECTION.md) ·
[AUTHORIZATION_SOD.md](docs/03-state-machines-invariants/AUTHORIZATION_SOD.md) ·
[PHASE04_HANDOFF.md](docs/03-state-machines-invariants/PHASE04_HANDOFF.md)

### 14.5 Phase 04 — Data (`docs/04-database-architecture/`)

[README.md](docs/04-database-architecture/README.md) ·
[LOGICAL_MODEL.md](docs/04-database-architecture/LOGICAL_MODEL.md) ·
[LOGICAL_ATTRIBUTE_CATALOGUE.md](docs/04-database-architecture/LOGICAL_ATTRIBUTE_CATALOGUE.md) ·
[POSTING_KERNEL.md](docs/04-database-architecture/POSTING_KERNEL.md) ·
[TRANSACTION_AND_IDEMPOTENCY.md](docs/04-database-architecture/TRANSACTION_AND_IDEMPOTENCY.md) ·
[GENEALOGY_PROJECTION.md](docs/04-database-architecture/GENEALOGY_PROJECTION.md) ·
[ENFORCEMENT_ASSIGNMENT.md](docs/04-database-architecture/ENFORCEMENT_ASSIGNMENT.md) ·
[RETENTION_MIGRATION_OPENING_STOCK.md](docs/04-database-architecture/RETENTION_MIGRATION_OPENING_STOCK.md) ·
[PHASE05_HANDOFF.md](docs/04-database-architecture/PHASE05_HANDOFF.md)

Logical design only. **No physical schema, SQL, or migrations.**

### 14.6 Phase 05 — Application / API (`docs/05-application-api-architecture/`)

[README.md](docs/05-application-api-architecture/README.md) ·
[COMMAND_CATALOGUE.md](docs/05-application-api-architecture/COMMAND_CATALOGUE.md) ·
[QUERY_CATALOGUE.md](docs/05-application-api-architecture/QUERY_CATALOGUE.md) ·
[MODULE_DEPENDENCY_MAP.md](docs/05-application-api-architecture/MODULE_DEPENDENCY_MAP.md) ·
[ORCHESTRATION.md](docs/05-application-api-architecture/ORCHESTRATION.md) ·
[API_ENVELOPE.md](docs/05-application-api-architecture/API_ENVELOPE.md) ·
[BACKGROUND_AND_REALTIME.md](docs/05-application-api-architecture/BACKGROUND_AND_REALTIME.md) ·
[PHASE06_HANDOFF.md](docs/05-application-api-architecture/PHASE06_HANDOFF.md)

### 14.7 Phase 06 — Security (`docs/06-security-rbac-audit/`)

[README.md](docs/06-security-rbac-audit/README.md) ·
[THREAT_MODEL.md](docs/06-security-rbac-audit/THREAT_MODEL.md) ·
[ROLE_PERMISSION_MATRIX.md](docs/06-security-rbac-audit/ROLE_PERMISSION_MATRIX.md) ·
[CUSTOMER_ISOLATION.md](docs/06-security-rbac-audit/CUSTOMER_ISOLATION.md) ·
[SESSION_AND_IDENTITY.md](docs/06-security-rbac-audit/SESSION_AND_IDENTITY.md)
(FACT-05 unresolved conflict recorded; live identity rule unchanged) ·
[AUDIT_TAXONOMY.md](docs/06-security-rbac-audit/AUDIT_TAXONOMY.md) ·
[SECURITY_VERIFICATION.md](docs/06-security-rbac-audit/SECURITY_VERIFICATION.md) ·
[PHASE07_HANDOFF.md](docs/06-security-rbac-audit/PHASE07_HANDOFF.md)

### 14.8 Phase 07 — Testing architecture (`docs/07-testing-quality-architecture/`)

[README.md](docs/07-testing-quality-architecture/README.md) ·
[TEST_STRATEGY.md](docs/07-testing-quality-architecture/TEST_STRATEGY.md) ·
[VERIFICATION_TRACE.md](docs/07-testing-quality-architecture/VERIFICATION_TRACE.md) ·
[SCENARIO_CATALOGUE.md](docs/07-testing-quality-architecture/SCENARIO_CATALOGUE.md) ·
[PROPERTY_AND_KERNEL_INTENTS.md](docs/07-testing-quality-architecture/PROPERTY_AND_KERNEL_INTENTS.md) ·
[NFR_AND_UAT.md](docs/07-testing-quality-architecture/NFR_AND_UAT.md) ·
[QUALITY_GATES.md](docs/07-testing-quality-architecture/QUALITY_GATES.md) ·
[PHASE08_HANDOFF.md](docs/07-testing-quality-architecture/PHASE08_HANDOFF.md)

Intents only. No `TEST-*` catalogue. No chosen runner (OQ-018).

### 14.9 Phase 08 — Integration / deployment labels (`docs/08-integration-deployment/`)

[README.md](docs/08-integration-deployment/README.md) ·
[INTEGRATION_CATALOGUE.md](docs/08-integration-deployment/INTEGRATION_CATALOGUE.md) ·
[EXTERNAL_BOUNDARIES.md](docs/08-integration-deployment/EXTERNAL_BOUNDARIES.md) ·
[DEPLOYMENT_TOPOLOGY.md](docs/08-integration-deployment/DEPLOYMENT_TOPOLOGY.md) ·
[OBSERVABILITY.md](docs/08-integration-deployment/OBSERVABILITY.md) ·
[BACKUP_AND_RECOVERY.md](docs/08-integration-deployment/BACKUP_AND_RECOVERY.md) ·
[RUNBOOK_CATALOGUE.md](docs/08-integration-deployment/RUNBOOK_CATALOGUE.md) ·
[PHASE09_HANDOFF.md](docs/08-integration-deployment/PHASE09_HANDOFF.md)

### 14.10 Phase 09 — Future repository (`docs/09-repository-documentation/`)

[README.md](docs/09-repository-documentation/README.md) ·
[REPOSITORY_LAYOUT.md](docs/09-repository-documentation/REPOSITORY_LAYOUT.md) ·
[DEPENDENCY_AND_IMPORT_RULES.md](docs/09-repository-documentation/DEPENDENCY_AND_IMPORT_RULES.md) ·
[BRANCHING_AND_RELEASE.md](docs/09-repository-documentation/BRANCHING_AND_RELEASE.md) ·
[DOCUMENTATION_OWNERSHIP.md](docs/09-repository-documentation/DOCUMENTATION_OWNERSHIP.md) ·
[GENERATED_VS_AUTHORED.md](docs/09-repository-documentation/GENERATED_VS_AUTHORED.md) ·
[CONFORMANCE_CHECKS.md](docs/09-repository-documentation/CONFORMANCE_CHECKS.md) ·
[PHASE10_HANDOFF.md](docs/09-repository-documentation/PHASE10_HANDOFF.md)

### 14.11 Phase 10 — Cursor / agents (`docs/10-ai-cursor-development/`)

[README.md](docs/10-ai-cursor-development/README.md) ·
[AGENT_AUTHORITY.md](docs/10-ai-cursor-development/AGENT_AUTHORITY.md) ·
[RULE_AND_SKILL_CATALOGUE.md](docs/10-ai-cursor-development/RULE_AND_SKILL_CATALOGUE.md) ·
[IMPLEMENTATION_PROMPT_STANDARDS.md](docs/10-ai-cursor-development/IMPLEMENTATION_PROMPT_STANDARDS.md) ·
[HUMAN_AND_INDEPENDENT_REVIEW.md](docs/10-ai-cursor-development/HUMAN_AND_INDEPENDENT_REVIEW.md) ·
[TOOL_MCP_HOOK_SAFETY.md](docs/10-ai-cursor-development/TOOL_MCP_HOOK_SAFETY.md) ·
[GENERATED_CODE_ACCEPTANCE.md](docs/10-ai-cursor-development/GENERATED_CODE_ACCEPTANCE.md) ·
[PHASE11_HANDOFF.md](docs/10-ai-cursor-development/PHASE11_HANDOFF.md)

### 14.12 Phase 11 — Validation (`docs/11-architecture-validation/`)

[README.md](docs/11-architecture-validation/README.md) ·
[INTEGRATED_REVIEW.md](docs/11-architecture-validation/INTEGRATED_REVIEW.md) ·
[TRACEABILITY_COVERAGE.md](docs/11-architecture-validation/TRACEABILITY_COVERAGE.md) ·
[WALKTHROUGHS.md](docs/11-architecture-validation/WALKTHROUGHS.md) ·
[CROSS_DOMAIN.md](docs/11-architecture-validation/CROSS_DOMAIN.md) ·
[RISK_OPERABILITY.md](docs/11-architecture-validation/RISK_OPERABILITY.md) ·
[CORRECTIVE_ACTIONS.md](docs/11-architecture-validation/CORRECTIVE_ACTIONS.md) ·
[PHASE12_HANDOFF.md](docs/11-architecture-validation/PHASE12_HANDOFF.md)

### 14.13 Phase 12 — Implementation planning (`docs/12-implementation-planning/`)

[README.md](docs/12-implementation-planning/README.md) ·
[IMPLEMENTATION_READINESS.md](docs/12-implementation-planning/IMPLEMENTATION_READINESS.md) ·
[ROADMAP_AND_SLICES.md](docs/12-implementation-planning/ROADMAP_AND_SLICES.md) ·
[WORK_ITEMS.md](docs/12-implementation-planning/WORK_ITEMS.md) ·
[SPIKES_AND_ACCEPTANCE.md](docs/12-implementation-planning/SPIKES_AND_ACCEPTANCE.md) ·
[CUTOVER_TRAINING_ROLLOUT.md](docs/12-implementation-planning/CUTOVER_TRAINING_ROLLOUT.md) ·
[AUTHORIZATION_RECORD.md](docs/12-implementation-planning/AUTHORIZATION_RECORD.md)

Each phase also has `SELF_CHECK.md`, `INDEPENDENT_REVIEW.md`,
`RECONCILIATION.md` or equivalent, `GATE_CHECKLIST.md`, and `CHECKPOINT_APR-*.md`.
Those are **phase-gate evidence**, not live policy when they conflict with
registers.

---

## 15. Historical vs live

Use live files when they conflict with freeze text:

- [CURRENT_PHASE.md](docs/00-governance/CURRENT_PHASE.md)
- [OPEN_QUESTIONS.md](docs/00-governance/registers/OPEN_QUESTIONS.md)
- [DECISIONS.md](docs/00-governance/registers/DECISIONS.md)
- Gate 1–5 reconciled catalogues listed above

[CHK-0013](docs/00-governance/approved-baselines/CHK-0013-phase-12.md) froze
Phase 12 **structure** on `2026-09-07`. Team answers (`2026-09-15`), Gates 1–6,
and factory evidence (`2026-09-23`) came **after** that freeze.

Superseded governance approvals:
[APR-000](docs/00-governance/approved-baselines/APR-000-governance.md),
[APR-001](docs/00-governance/approved-baselines/APR-001-governance.md).

---

## 16. What to do next

**If you are implementing software:** stop. There is no unlock.

**If you are continuing architecture/governance:**

1. Take [TEAM_QUESTION_PACK.md](docs/00-governance/TEAM_QUESTION_PACK.md) to
   the factory/sponsor.
2. Record returned answers only on the matching `OQ-*` row. Partial answers
   are allowed. Chat is not a second register.
3. Do not invent FACT-03 classification, station-account security, timestamp
   fields, RBAC mappings, or package choices.
4. A question pack is not implementation authorization.

**If you are the human who may authorize implementation:** bind a **current**
baseline (live registers + Gate 1–5 catalogues, not CHK-0013 freeze text
alone), create `.cursor/IMPLEMENTATION_UNLOCK.json` yourself, and set
matching `architecture-gate.json` policy. Agents must not do that for you.

```text
IMPLEMENTATION_AUTHORIZED: false
NO_IMPLEMENTATION_UNLOCK_CREATED: true
APPLICATION_CODE: none
```
