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

1. This README. Section 1 is the lock. [Section 14](#14-documentation-map) explains every document and links to it.
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
| **FACT-01** | kg is the only official stock quantity for incoming material and customer orders. Length, thickness, width, and material/type are secondary, not stock quantities. Weight measurement: 0 decimal places, 1 kg, rounding not needed. Weight↔count conversion is not required. Weight↔length may be needed; formula undefined. A measured-vs-expected weight difference must be shown; no automatic measurement tolerance is defined. That is not OQ-006. | kg↔length formula and factors; technical storage scale; scope of the 0-decimal rule; any automatic weight-difference threshold. [OQ-001](docs/00-governance/team-answers/OQ-001.md) stays `treating`. [OQ-006](docs/00-governance/team-answers/OQ-006.md) stays `answered` and unchanged. |
| **FACT-02** | Cut pieces and order scrap carry the customer **order code**; unique ID per tiny piece is not feasible | Exact order-code identity (DB id vs human-visible number vs shop code). Inventory Unit is **retained**. [OQ-004](docs/00-governance/team-answers/OQ-004.md). Glossary distinctions: [BUSINESS_GLOSSARY.md](docs/00-governance/registers/BUSINESS_GLOSSARY.md). |
| **FACT-03** | Warehouse conversion of an opened Coil into Sheets. Factory: inventory transformation in the workshop; may occur with **no** customer order and **no** Production Order; separate from customer-order production; one Coil leaves and many Sheets enter; Coil Code retained; Sheet Code = Coil Code + Sheet number; Order Code only when applicable; measured kg is stock quantity; 6 m/12 m are examples; cutting loss is Residual or Scrap by human decision; standalone incoming Sheets are not Coil-derived. Mr. Dinavand decides organizationally (title wording varies). | Posting command **not** accepted. Conflicts with nesting production residual/scrap inside `CompleteProductionOperation`. Not added to DATA-TX-001. [PROCESS_MAPS_AS_IS_TO_BE.md](docs/02-domain-business-architecture/PROCESS_MAPS_AS_IS_TO_BE.md). [OQ-009](docs/00-governance/team-answers/OQ-009.md) stays `treating`. |
| **FACT-04** | **Eleven-person organizational roster** (see [section 9](#9-factory-personnel-fact-04)) | Not RBAC. Not `ACT-*`. Not SoD. Not delegates. Operators still missing. [OQ-019](docs/00-governance/team-answers/OQ-019.md) stays `treating`. |
| **FACT-05** | 2026-09-23 preferred a station account. Clarification 2026-09-30 **supersedes** that: no shared Station account; personal operator accounts; Station is not a user; a person may work at several Stations. Ten current physical Stations are listed on OQ-003. Route is per order and may skip Stations. No separate factory Work Center. | Not RBAC. Not a fixed route. Architecture "work center" wording is not deleted; alias is open. [SESSION_AND_IDENTITY.md](docs/06-security-rbac-audit/SESSION_AND_IDENTITY.md). |
| **FACT-06** | Entry = the order reaches the defined user role or Station. Referral = assignment to the next user role or Station. System clock timestamps both. Referral time usually matches next arrival; that is not an invariant. Operators declare completion; the manager refers. | Not `StartProductionOperation` and not `CompleteProductionOperation`. No invented timestamp columns. [STATE_MACHINE_CATALOGUE.md](docs/03-state-machines-invariants/STATE_MACHINE_CATALOGUE.md). |

Factory-confirmed **requirement evidence labels** `RQ-01`–`RQ-07` (not `INV-*`,
not a minted `REQ-*` catalogue):
[MVP_SCOPE_AND_BUSINESS_RULES.md](docs/02-domain-business-architecture/MVP_SCOPE_AND_BUSINESS_RULES.md),
[REQUIREMENTS_TRACEABILITY.md](docs/00-governance/registers/REQUIREMENTS_TRACEABILITY.md).

Standing questions for the next factory/sponsor pass:
[TEAM_QUESTION_PACK.md](docs/00-governance/TEAM_QUESTION_PACK.md).

### 4.5 FACT-04 roster correction

The first recording omitted **Mr. Dinarvand — Workshop Manager**. The live
documents now list **eleven** organizational people. That correction did not
map anyone to system roles.

### 4.6 Clarification assessment

A later analysis-only pass asked which treating OQs the factory evidence could
**fully** close. Result:

```text
No additional OQ can be fully closed from the current factory evidence.
```

Highest remaining factory clarifications: FACT-03 posting boundary;
FACT-05 personal accounts; FACT-06 Entry/Referral beside the operation
lifecycle; OQ-001 kg↔length formula; OQ-003 route mechanism; OQ-005 future
Quality plans only if QC later enters scope (current MVP has no QC
department); OQ-009 how the human reusability decision is recorded;
OQ-019 role mapping, with no named delegate and no operator names. Also
still treating: OQ-011, OQ-014, OQ-015.

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
- FACT-03 warehouse Coil→Sheet is factory-described as an inventory
  transformation that may have no Production Order. It is **not** accepted
  as `CompleteProductionOperation` or as a new command. The conflict is open.
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

FACT-03: Coil Code, Sheet Code, and Customer Order Code are different.
Order Code applies only when the material is associated with an order.

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
- Current factory: no QC department, no Quality role, no QC execution.
  Future architecture still says required QC can block availability and
  shipment, and exceptional release needs two distinct people
  ([OQ-005](docs/00-governance/team-answers/OQ-005.md)). That future
  capability is not current factory operation. Quality would command
  Inventory and would not write Ledger.
  [AUTHORIZATION_SOD.md](docs/03-state-machines-invariants/AUTHORIZATION_SOD.md)
  was not rewritten.
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

Do **not** add FACT-03 coil→sheet to DATA-TX-001. The factory classifies
warehouse conversion as an inventory transformation, but that is not an
accepted transaction boundary.
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
| OQ-001 | treating | kg-only stock quantity; 0 decimal places; 1 kg; no measurement rounding; count/length/dimensions not stock quantity | kg↔length formula; technical storage scale; automatic weight-difference threshold (not OQ-006) | [OQ-001.md](docs/00-governance/team-answers/OQ-001.md) |
| OQ-002 | answered | Coil qty = kg | Ticket validation | [OQ-002.md](docs/00-governance/team-answers/OQ-002.md) |
| OQ-003 | treating | Post at `CompleteProductionOperation`; ten current Stations; per-order route; personal accounts | Entry/Referral model beside the operation lifecycle; abort command; work-center alias | [OQ-003.md](docs/00-governance/team-answers/OQ-003.md) |
| OQ-004 | answered | Hybrid grain; FACT-02 no per-piece Unit; order-code trace | Family catalogue; order-code identity | [OQ-004.md](docs/00-governance/team-answers/OQ-004.md) |
| OQ-005 | treating | Current MVP: no QC department, no Quality role, no QC execution. Future Quality gates retained | Plans and names only if Quality is later enabled. Do not invent current Quality people | [OQ-005.md](docs/00-governance/team-answers/OQ-005.md) |
| OQ-006 | answered | Partial ship; default tolerance 0 | Family/customer % | [OQ-006.md](docs/00-governance/team-answers/OQ-006.md) |
| OQ-007 | answered | Close on fulfill/cancel/unfulfilled, not payment. Deposit, cheque/note, and credit do not close the order. | Later commercial exceptions | [OQ-007.md](docs/00-governance/team-answers/OQ-007.md) |
| OQ-008 | answered | One ACTIVE per unit; no confirmed-SO TTL | Temporary-hold TTL if added | [OQ-008.md](docs/00-governance/team-answers/OQ-008.md) |
| OQ-009 | treating | Reusable = Residual and returns to the warehouse; non-reusable = Scrap; no universal cutoff; person decides; not a weight difference | How the decision is recorded; other family policy; `GUARD_OPEN_POLICY` conflict | [OQ-009.md](docs/00-governance/team-answers/OQ-009.md) |
| OQ-010 | answered | Portal visibility-only | Document list | [OQ-010.md](docs/00-governance/team-answers/OQ-010.md) |
| OQ-011 | treating | Weighbridge never writes Ledger. Final invoice weight is not a second stock writer. | Device/protocol/operator | [OQ-011.md](docs/00-governance/team-answers/OQ-011.md) |
| OQ-012 | answered | Finance-Lite ≠ legal GL. External invoice upload is not that connector. | Unnamed external system; accounting product later | [OQ-012.md](docs/00-governance/team-answers/OQ-012.md) |
| OQ-013 | answered | One entity, one site | Multi-site would reopen architecture | [OQ-013.md](docs/00-governance/team-answers/OQ-013.md) |
| OQ-014 | treating | Modest user scale | 12-month transaction counts | [OQ-014.md](docs/00-governance/team-answers/OQ-014.md) |
| OQ-015 | treating | Architecture candidate: Ledger facts via `OpeningStockImport`, not factory-confirmed | File, freeze, counter, signers, identity | [OQ-015.md](docs/00-governance/team-answers/OQ-015.md) |
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
| Mr. Ghaffari | IT and Stations/accounts. Records the customer invoice after Mr. Pour-Ebrahim issues it, and uploads that record to an unnamed external system. The older "invoice issuance" label is superseded for who issues the invoice. |
| Ms. Koushki | Government trade-system registration + receivables follow-up |
| Mr. Pour-Ebrahim | Sales Manager + order intake. Issues the customer invoice. |
| Mr. Dinavand | Workshop Manager / Production Manager |
| Ms. Bohlouli | Commercial Manager + sales/order receiving |
| Ms. Masoumi | Recording completed purchases + sending proforma invoices |
| Ms. Goodarzi / Ms. Goudarzi | Accounting Manager (one person; both spellings recorded) |
| Ms. Rangini | Accountant |
| Mr. Faraji | Chairman of the Board |
| Mr. Rouzbahani | CEO |

Production-line operators are **not** listed. About 10 operators are a
separate unnamed population. No named delegate has been identified.
There is no Quality person. Workshop Manager is **not** inferred as
`ACT-PLAN`, a Quality approver, or an RBAC role.

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
| OQ-001 | Commands that need a missing kg↔length formula, or an automatic weight-difference threshold that was not defined |
| OQ-003 | How Entry/Referral are stored, and the exact stop/cancel command. The ten station names are recorded and are not a fixed route. |
| FACT-03 | Coil→Sheet warehouse conversion must not be implemented as `CompleteProductionOperation` or a new command until the posting conflict is explicitly reconciled |
| FACT-05 | Do not introduce a shared Station account. The clarification superseded that preference. |
| OQ-005 | Do not invent current Quality personnel. QC is outside the current factory MVP. Future Quality architecture stays. |
| OQ-009 | Do not invent a residual or scrap numeric cutoff. The person decides reusability. |
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
- Start ≠ station Entry. Entry is arrival at a user role or Station.
- Complete ≠ Referral. Referral is assignment to the next user role or Station.
- A shared Station account is not factory policy. The 2026-09-23 preference is superseded.
- Station ≠ user. Station ≠ a separate Work Center in factory wording.
- Organizational title ≠ `ACT-*` permission.
- Roster ≠ SoD / sign-off assignment.
- No named delegate. Do not infer one from a title.
- Current factory QC ≠ the retained future Quality state machines.
- Weight difference ≠ Residual and ≠ Scrap.
- Reusable return to warehouse ≠ a new inventory posting command.
- Estimated amount = required weight × price per kg. It is not the final invoice.
- Final amount = actual/final weighbridge weight × applicable price per kg + cutting service fee.
- Mr. Pour-Ebrahim issues the customer invoice. Mr. Ghaffari records and uploads it. That upload is not a Legal-GL API.
- Invoice issued ≠ payment received ≠ Sales Order closed.
- Receivables follow-up ≠ payment recording, credit approval, or payment approval.
- A Finance-Lite payment command ≠ a factory-confirmed payment procedure.
- Purchase proforma ≠ customer invoice.
- Warehouse intake ≠ `PostGoodsReceipt`. Intake records the physical facts. The Inventory Posting Service posts kg.
- Count at intake ≠ a second stock ledger.
- Standalone incoming Sheet ≠ a Coil-derived Sheet.
- Current incoming QC ≠ the retained future `QC_HOLD` path.
- Normal receiving ≠ opening-stock cutover.
- `OpeningStockImport` ≠ a factory-confirmed opening process and ≠ `PostGoodsReceipt`.
- Login ≠ Station Entry. Station completion ≠ `CompleteProductionOperation`.
- Customer-order registration ≠ automatic Production Order creation.
- A weight difference ≠ process loss, Residual, or Scrap.
- `ConsumeUnitPartial` / `ConsumeUnitComplete` ≠ factory-named workflows.
- Coil → Sheet warehouse conversion ≠ `CompleteProductionOperation`.
- Delivered ≠ Sales Order closed. Invoice issued ≠ closed. Payment received ≠ closed.
- Shipment ≠ a second Inventory Ledger writer.
- A customer-order change or cancellation ≠ an automatic production reversal or a Ledger write.
- Mr. Dinavand's production stop/cancel ≠ Sales Order cancellation authority.
- A Purchase Order state machine ≠ a factory-confirmed purchasing procedure.
- Ms. Masoumi's proforma ≠ purchase approval, receiving, or a customer invoice.
- kg-first ≠ a kg↔length formula, a second stock UOM, or an automatic
  measurement-discrepancy tolerance.
- A weight difference ≠ Residual or Scrap unless a person classifies it
  under the reusability rule.
- Measurement discrepancy ≠ OQ-006 fulfillment tolerance.
- Gate 6 “ready” ≠ `IMPLEMENTATION_AUTHORIZED: true`.

---

## 14. Documentation map

Read this section to see what each document is for. Every governed Markdown
file is linked below. A link is a pointer. The file itself remains the
authority for its subject.

When two files disagree, use this order:

1. [CURRENT_PHASE.md](docs/00-governance/CURRENT_PHASE.md) for what work is allowed.
2. [OPEN_QUESTIONS.md](docs/00-governance/registers/OPEN_QUESTIONS.md) for whether a business question is answered, treating, or open.
3. [DECISIONS.md](docs/00-governance/registers/DECISIONS.md) for accepted technology and architecture decisions.
4. The live catalogue named in the later sections of this README (glossary, invariants, commands, posting).
5. Older approval and checkpoint files. They freeze a date. They do not override a later register update.

[docs/INDEX.md](docs/INDEX.md) is a shorter navigation list of the same phase files. It does not replace this map or the registers.

The same five gate files appear in almost every phase. They record that the phase was reviewed. They are not the live business rules:

| Gate file | What it records |
| --- | --- |
| `SELF_CHECK.md` | The author's own check before review |
| `INDEPENDENT_REVIEW.md` | A separate review of that phase |
| `RECONCILIATION.md` | How review comments were resolved |
| `GATE_CHECKLIST.md` | The checklist used to pass the phase |
| `CHECKPOINT_APR-*.md` | The procedure that tied the phase to its approval |

### 14.1 Governance (`docs/00-governance/`)

This folder says how the project is controlled: what phase is active, how a phase is approved, where business terms live, and which questions are still open. Start here before any other folder.

| File | What it is |
| --- | --- |
| [README.md](docs/00-governance/README.md) | Entry page for the governance phase |
| [ARCHITECTURE_CHARTER.md](docs/00-governance/ARCHITECTURE_CHARTER.md) | Why design is gated and implementation waits for a human unlock |
| [CURRENT_PHASE.md](docs/00-governance/CURRENT_PHASE.md) | Live permission. Phase 12 is approved as structure. Implementation is not authorized |
| [PHASE_GATES.md](docs/00-governance/PHASE_GATES.md) | The required path from draft to approval to checkpoint |
| [DOCUMENTATION_STANDARD.md](docs/00-governance/DOCUMENTATION_STANDARD.md) | How a document is identified, versioned, and linked |
| [SOURCE_REGISTER.md](docs/00-governance/SOURCE_REGISTER.md) | Where the original project sources came from |
| [APPROVALS.md](docs/00-governance/APPROVALS.md) | The list of `APR-*` approvals |
| [TEAM_QUESTION_PACK.md](docs/00-governance/TEAM_QUESTION_PACK.md) | Questions still to take to the factory or sponsor |
| [TEAM_ANSWER_SHEET.md](docs/00-governance/TEAM_ANSWER_SHEET.md) | How a returned answer is recorded onto an `OQ-*` row |
| [HOOK_VALIDATION.md](docs/00-governance/HOOK_VALIDATION.md) | How the architecture write-gate was checked |
| [SELF_CHECK.md](docs/00-governance/SELF_CHECK.md) | Governance self-check |
| [INDEPENDENT_REVIEW.md](docs/00-governance/INDEPENDENT_REVIEW.md) | Governance independent review |
| [RECONCILIATION.md](docs/00-governance/RECONCILIATION.md) | Governance review reconciliation |
| [GATE_CHECKLIST.md](docs/00-governance/GATE_CHECKLIST.md) | Governance gate checklist |
| [CHECKPOINT_APR-000.md](docs/00-governance/CHECKPOINT_APR-000.md) | Superseded checkpoint procedure |
| [CHECKPOINT_APR-001.md](docs/00-governance/CHECKPOINT_APR-001.md) | Superseded checkpoint procedure |
| [CHECKPOINT_APR-002.md](docs/00-governance/CHECKPOINT_APR-002.md) | Checkpoint procedure for the renewed governance approval |

**Registers** (`docs/00-governance/registers/`). These are the shared definitions. Phase documents should link here instead of inventing a second definition.

| File | What it is |
| --- | --- |
| [README.md](docs/00-governance/registers/README.md) | Index of the registers |
| [OPEN_QUESTIONS.md](docs/00-governance/registers/OPEN_QUESTIONS.md) | Live status of every `OQ-*`, plus factory evidence recorded after the original answers |
| [BUSINESS_GLOSSARY.md](docs/00-governance/registers/BUSINESS_GLOSSARY.md) | Canonical business terms. Do not redefine them in other files |
| [DECISIONS.md](docs/00-governance/registers/DECISIONS.md) | ADR-0001 through ADR-0008. Accepted means accepted. Proposed means not accepted |
| [ASSUMPTIONS.md](docs/00-governance/registers/ASSUMPTIONS.md) | Explicit assumptions. An assumption is not a factory fact |
| [RISKS.md](docs/00-governance/registers/RISKS.md) | Recorded risks |
| [REQUIREMENTS_TRACEABILITY.md](docs/00-governance/registers/REQUIREMENTS_TRACEABILITY.md) | Which requirement is covered by which design record |
| [CANONICAL_DOMAIN_MODEL.md](docs/00-governance/registers/CANONICAL_DOMAIN_MODEL.md) | Shared domain concepts used across phases |
| [CANONICAL_DATA_DICTIONARY.md](docs/00-governance/registers/CANONICAL_DATA_DICTIONARY.md) | Shared data names. Not a physical database schema |
| [STATE_TRANSITION_CATALOGUE.md](docs/00-governance/registers/STATE_TRANSITION_CATALOGUE.md) | Register view of state transitions |
| [INTEGRATION_CATALOGUE.md](docs/00-governance/registers/INTEGRATION_CATALOGUE.md) | Register view of integrations. Not a built connector |
| [STAKEHOLDERS_RACI.md](docs/00-governance/registers/STAKEHOLDERS_RACI.md) | Responsibility labels. Not a confirmed factory permission matrix |
| [REVIEW_FINDINGS.md](docs/00-governance/registers/REVIEW_FINDINGS.md) | Findings from reviews, including later gate findings |
| [SLICE_HOMES.md](docs/00-governance/registers/SLICE_HOMES.md) | Which future implementation slice owns which capability |

**Team answers** (`docs/00-governance/team-answers/`). Each file is evidence supplied for one question. The status on the matching row in [OPEN_QUESTIONS.md](docs/00-governance/registers/OPEN_QUESTIONS.md) wins if the file and the row ever differ.

| File | What it is |
| --- | --- |
| [README.md](docs/00-governance/team-answers/README.md) | How these evidence files are used |
| [OQ-001.md](docs/00-governance/team-answers/OQ-001.md) | Stock unit of measure. Kilograms are official. Formula and storage scale remain open |
| [OQ-002.md](docs/00-governance/team-answers/OQ-002.md) | Coil quantity is measured weight |
| [OQ-003.md](docs/00-governance/team-answers/OQ-003.md) | Routing, stations, Entry, Referral, and the production posting boundary |
| [OQ-004.md](docs/00-governance/team-answers/OQ-004.md) | Trace identity for coils, sheets, cut pieces, and scrap |
| [OQ-005.md](docs/00-governance/team-answers/OQ-005.md) | Quality. No current QC department. Future Quality architecture is retained |
| [OQ-006.md](docs/00-governance/team-answers/OQ-006.md) | Fulfillment tolerance. Default is zero |
| [OQ-007.md](docs/00-governance/team-answers/OQ-007.md) | Sales Order closure. Payment does not close the order |
| [OQ-008.md](docs/00-governance/team-answers/OQ-008.md) | One active reservation per inventory unit |
| [OQ-009.md](docs/00-governance/team-answers/OQ-009.md) | Residual and Scrap. Numeric cutoff remains open |
| [OQ-010.md](docs/00-governance/team-answers/OQ-010.md) | Customer portal is visibility only |
| [OQ-011.md](docs/00-governance/team-answers/OQ-011.md) | Weighbridge. It must not write the Ledger. Device identity is open |
| [OQ-012.md](docs/00-governance/team-answers/OQ-012.md) | Finance-Lite is operational. It is not a legal general ledger |
| [OQ-013.md](docs/00-governance/team-answers/OQ-013.md) | One legal entity and one principal site |
| [OQ-014.md](docs/00-governance/team-answers/OQ-014.md) | Scale estimate. Transaction volumes remain open |
| [OQ-015.md](docs/00-governance/team-answers/OQ-015.md) | Opening stock. The import path is architecture. Factory file, freeze, and signers are open |
| [OQ-016.md](docs/00-governance/team-answers/OQ-016.md) | Recovery objectives |
| [OQ-017.md](docs/00-governance/team-answers/OQ-017.md) | Application-owned database transaction for posting |
| [OQ-018.md](docs/00-governance/team-answers/OQ-018.md) | Modular monolith and PostgreSQL. Frameworks are not frozen |
| [OQ-019.md](docs/00-governance/team-answers/OQ-019.md) | Named people as an organizational roster. Not permissions. Operator names are open |

**Templates** (`docs/00-governance/templates/`). Blank forms. They are not decisions.

| File | What it is |
| --- | --- |
| [README.md](docs/00-governance/templates/README.md) | Index of the blank forms |
| [ARTIFACT_TEMPLATE.md](docs/00-governance/templates/ARTIFACT_TEMPLATE.md) | Blank document frontmatter |
| [ADR_TEMPLATE.md](docs/00-governance/templates/ADR_TEMPLATE.md) | Blank decision record |
| [OPEN_QUESTION_TEMPLATE.md](docs/00-governance/templates/OPEN_QUESTION_TEMPLATE.md) | Blank open question |
| [RISK_TEMPLATE.md](docs/00-governance/templates/RISK_TEMPLATE.md) | Blank risk |
| [REVIEW_TEMPLATE.md](docs/00-governance/templates/REVIEW_TEMPLATE.md) | Blank review |
| [RECONCILIATION_TEMPLATE.md](docs/00-governance/templates/RECONCILIATION_TEMPLATE.md) | Blank reconciliation |
| [APPROVAL_TEMPLATE.md](docs/00-governance/templates/APPROVAL_TEMPLATE.md) | Blank approval |
| [GATE_CHECKLIST_TEMPLATE.md](docs/00-governance/templates/GATE_CHECKLIST_TEMPLATE.md) | Blank gate checklist |
| [PHASE_TEMPLATE.md](docs/00-governance/templates/PHASE_TEMPLATE.md) | Blank phase document |
| [PHASE_CHECKPOINT_MARKER_TEMPLATE.md](docs/00-governance/templates/PHASE_CHECKPOINT_MARKER_TEMPLATE.md) | Blank checkpoint marker |
| [TEAM_QUESTION_PACK_TEMPLATE.md](docs/00-governance/templates/TEAM_QUESTION_PACK_TEMPLATE.md) | Blank question pack |
| [IMPLEMENTATION_UNLOCK_TEMPLATE.md](docs/00-governance/templates/IMPLEMENTATION_UNLOCK_TEMPLATE.md) | Blank unlock shape. Filling it in does not authorize implementation |

**Approvals and checkpoints** (`docs/00-governance/approved-baselines/`). Historical freeze records. [README.md](docs/00-governance/approved-baselines/README.md) explains the folder. APR-000 and APR-001 are superseded by [APR-002](docs/00-governance/approved-baselines/APR-002-governance.md).

| Approval | Checkpoint |
| --- | --- |
| [APR-000](docs/00-governance/approved-baselines/APR-000-governance.md) | superseded |
| [APR-001](docs/00-governance/approved-baselines/APR-001-governance.md) | superseded |
| [APR-002](docs/00-governance/approved-baselines/APR-002-governance.md) | [CHK-0001](docs/00-governance/approved-baselines/CHK-0001-phase-00.md) |
| [APR-003](docs/00-governance/approved-baselines/APR-003-project-assimilation.md) | [CHK-0002](docs/00-governance/approved-baselines/CHK-0002-phase-01.md) |
| [APR-004](docs/00-governance/approved-baselines/APR-004-domain-business-architecture.md) | [CHK-0003](docs/00-governance/approved-baselines/CHK-0003-phase-02.md) |
| [APR-005](docs/00-governance/approved-baselines/APR-005-state-machines-invariants.md) | [CHK-0006](docs/00-governance/approved-baselines/CHK-0006-phase-03.md) |
| [APR-006](docs/00-governance/approved-baselines/APR-006-database-architecture.md) | [CHK-0004](docs/00-governance/approved-baselines/CHK-0004-phase-04.md) |
| [APR-007](docs/00-governance/approved-baselines/APR-007-application-api-architecture.md) | [CHK-0005](docs/00-governance/approved-baselines/CHK-0005-phase-05.md) |
| [APR-008](docs/00-governance/approved-baselines/APR-008-security-rbac-audit.md) | [CHK-0007](docs/00-governance/approved-baselines/CHK-0007-phase-06.md) |
| [APR-009](docs/00-governance/approved-baselines/APR-009-testing-quality-architecture.md) | [CHK-0008](docs/00-governance/approved-baselines/CHK-0008-phase-07.md) |
| [APR-010](docs/00-governance/approved-baselines/APR-010-integration-deployment.md) | [CHK-0009](docs/00-governance/approved-baselines/CHK-0009-phase-08.md) |
| [APR-011](docs/00-governance/approved-baselines/APR-011-repository-documentation.md) | [CHK-0010](docs/00-governance/approved-baselines/CHK-0010-phase-09.md) |
| [APR-012](docs/00-governance/approved-baselines/APR-012-ai-cursor-development.md) | [CHK-0011](docs/00-governance/approved-baselines/CHK-0011-phase-10.md) |
| [APR-013](docs/00-governance/approved-baselines/APR-013-architecture-validation.md) | [CHK-0012](docs/00-governance/approved-baselines/CHK-0012-phase-11.md) |
| [APR-014](docs/00-governance/approved-baselines/APR-014-implementation-planning.md) | [CHK-0013](docs/00-governance/approved-baselines/CHK-0013-phase-12.md) |

### 14.2 Phase 01 — Assimilation (`docs/01-project-assimilation/`)

This folder records what was learned from the original sources before the design was frozen. It is background. Later factory evidence in the registers overrides an older source sentence when they conflict.

| File | What it is |
| --- | --- |
| [README.md](docs/01-project-assimilation/README.md) | Entry page for assimilation |
| [ARCHITECTURE_ASSIMILATION_REPORT.md](docs/01-project-assimilation/ARCHITECTURE_ASSIMILATION_REPORT.md) | What the source review concluded |
| [SOURCE_BIBLIOGRAPHY.md](docs/01-project-assimilation/SOURCE_BIBLIOGRAPHY.md) | The source list |
| [PROVENANCE_CLASSIFICATION.md](docs/01-project-assimilation/PROVENANCE_CLASSIFICATION.md) | How a claim is classified as source, assumption, or decision |
| [MULTI_AGENT_METHOD.md](docs/01-project-assimilation/MULTI_AGENT_METHOD.md) | How the assimilation review was done |
| [WORKSHOP_AGENDA.md](docs/01-project-assimilation/WORKSHOP_AGENDA.md) | Agenda for the factory workshop |
| [RECONCILIATION.md](docs/01-project-assimilation/RECONCILIATION.md) | Cross-source reconciliation |
| [SELF_CHECK.md](docs/01-project-assimilation/SELF_CHECK.md) | Phase self-check |
| [INDEPENDENT_REVIEW.md](docs/01-project-assimilation/INDEPENDENT_REVIEW.md) | Phase independent review |
| [GATE_CHECKLIST.md](docs/01-project-assimilation/GATE_CHECKLIST.md) | Phase gate checklist |
| [CHECKPOINT_APR-003.md](docs/01-project-assimilation/CHECKPOINT_APR-003.md) | Checkpoint procedure for this phase |

### 14.3 Phase 02 — Domain (`docs/02-domain-business-architecture/`)

This folder is the business design: what the factory does, which module owns which capability, and which rules are in the MVP. Later factory clarifications were written into the process map, the roster, and the scope file. Those clarifications are evidence. They do not unlock implementation.

| File | What it is |
| --- | --- |
| [README.md](docs/02-domain-business-architecture/README.md) | Entry page for the domain phase |
| [CAPABILITY_BOUNDED_CONTEXT_MAP.md](docs/02-domain-business-architecture/CAPABILITY_BOUNDED_CONTEXT_MAP.md) | Which capability belongs to which bounded context |
| [PROCESS_MAPS_AS_IS_TO_BE.md](docs/02-domain-business-architecture/PROCESS_MAPS_AS_IS_TO_BE.md) | As-is and to-be process maps, including later factory notes |
| [ACTOR_RESPONSIBILITY_CATALOGUE.md](docs/02-domain-business-architecture/ACTOR_RESPONSIBILITY_CATALOGUE.md) | Architecture actor labels. Not a confirmed permission assignment |
| [MODULE_OWNERSHIP_MATRIX.md](docs/02-domain-business-architecture/MODULE_OWNERSHIP_MATRIX.md) | Which module may write which data |
| [MVP_SCOPE_AND_BUSINESS_RULES.md](docs/02-domain-business-architecture/MVP_SCOPE_AND_BUSINESS_RULES.md) | MVP scope and business rules BR-001 through BR-020 |
| [WORKSHOP_ROSTER.md](docs/02-domain-business-architecture/WORKSHOP_ROSTER.md) | The 11-person organizational roster and the separate operator population |
| [WORKSHOP_COLLECTION_MAP.md](docs/02-domain-business-architecture/WORKSHOP_COLLECTION_MAP.md) | What the workshop was expected to collect |
| [PHASE03_HANDOFF.md](docs/02-domain-business-architecture/PHASE03_HANDOFF.md) | What phase 02 handed to phase 03 |
| [SELF_CHECK.md](docs/02-domain-business-architecture/SELF_CHECK.md) | Phase self-check |
| [INDEPENDENT_REVIEW.md](docs/02-domain-business-architecture/INDEPENDENT_REVIEW.md) | Phase independent review |
| [RECONCILIATION.md](docs/02-domain-business-architecture/RECONCILIATION.md) | Phase reconciliation |
| [GATE_CHECKLIST.md](docs/02-domain-business-architecture/GATE_CHECKLIST.md) | Phase gate checklist |
| [CHECKPOINT_APR-004.md](docs/02-domain-business-architecture/CHECKPOINT_APR-004.md) | Checkpoint procedure for this phase |

### 14.4 Phase 03 — State machines (`docs/03-state-machines-invariants/`)

This folder defines allowed states, transitions, and invariants. A state or command listed here is architecture. Factory evidence has not confirmed every lifecycle, especially purchasing, shipment, and quality. Do not treat an unconfirmed machine as current factory procedure.

| File | What it is |
| --- | --- |
| [README.md](docs/03-state-machines-invariants/README.md) | Entry page for states and invariants |
| [INVARIANT_CATALOGUE.md](docs/03-state-machines-invariants/INVARIANT_CATALOGUE.md) | Numbered invariants `INV-*` |
| [STATE_MACHINE_CATALOGUE.md](docs/03-state-machines-invariants/STATE_MACHINE_CATALOGUE.md) | One catalogue of the state machines |
| [TRANSITION_TABLES.md](docs/03-state-machines-invariants/TRANSITION_TABLES.md) | Allowed transitions and their commands |
| [SIDE_EFFECT_MATRIX.md](docs/03-state-machines-invariants/SIDE_EFFECT_MATRIX.md) | Which transition may cause which other effect |
| [CROSS_MACHINE_SEQUENCES.md](docs/03-state-machines-invariants/CROSS_MACHINE_SEQUENCES.md) | How machines follow one another |
| [CONCURRENCY_AND_INTERLOCK.md](docs/03-state-machines-invariants/CONCURRENCY_AND_INTERLOCK.md) | Reservation and concurrency rules |
| [EXCEPTION_CORRECTION.md](docs/03-state-machines-invariants/EXCEPTION_CORRECTION.md) | Corrections are new compensating facts |
| [EVENT_AND_REJECTION.md](docs/03-state-machines-invariants/EVENT_AND_REJECTION.md) | Events and rejection reasons |
| [AUTHORIZATION_SOD.md](docs/03-state-machines-invariants/AUTHORIZATION_SOD.md) | Separation-of-duties labels. Named people are not assigned |
| [PHASE04_HANDOFF.md](docs/03-state-machines-invariants/PHASE04_HANDOFF.md) | What phase 03 handed to phase 04 |
| [SELF_CHECK.md](docs/03-state-machines-invariants/SELF_CHECK.md) | Phase self-check |
| [INDEPENDENT_REVIEW.md](docs/03-state-machines-invariants/INDEPENDENT_REVIEW.md) | Phase independent review |
| [RECONCILIATION.md](docs/03-state-machines-invariants/RECONCILIATION.md) | Phase reconciliation |
| [GATE_CHECKLIST.md](docs/03-state-machines-invariants/GATE_CHECKLIST.md) | Phase gate checklist |
| [CHECKPOINT_APR-005.md](docs/03-state-machines-invariants/CHECKPOINT_APR-005.md) | Checkpoint procedure for this phase |

### 14.5 Phase 04 — Data (`docs/04-database-architecture/`)

This folder is the logical data design. The Inventory Ledger is stock truth. Balance and genealogy are projections. There is no physical schema and no migration in this repository.

| File | What it is |
| --- | --- |
| [README.md](docs/04-database-architecture/README.md) | Entry page for the data phase |
| [LOGICAL_MODEL.md](docs/04-database-architecture/LOGICAL_MODEL.md) | Logical entities and the attributes that stay open |
| [LOGICAL_ATTRIBUTE_CATALOGUE.md](docs/04-database-architecture/LOGICAL_ATTRIBUTE_CATALOGUE.md) | Named logical attributes. Not columns in a database |
| [POSTING_KERNEL.md](docs/04-database-architecture/POSTING_KERNEL.md) | How a stock posting is allowed to happen. `ACT-IPS` is the sole stock writer |
| [TRANSACTION_AND_IDEMPOTENCY.md](docs/04-database-architecture/TRANSACTION_AND_IDEMPOTENCY.md) | One business transaction and idempotency rules, including production completion |
| [GENEALOGY_PROJECTION.md](docs/04-database-architecture/GENEALOGY_PROJECTION.md) | Genealogy is rebuilt from source facts. It is not edited in place |
| [ENFORCEMENT_ASSIGNMENT.md](docs/04-database-architecture/ENFORCEMENT_ASSIGNMENT.md) | Which layer is expected to enforce each invariant |
| [RETENTION_MIGRATION_OPENING_STOCK.md](docs/04-database-architecture/RETENTION_MIGRATION_OPENING_STOCK.md) | Labels for retention and opening stock. Not a built migration |
| [RECONCILIATION.md](docs/04-database-architecture/RECONCILIATION.md) | Phase reconciliation. Also the name of a review file, not a stock-reconciliation algorithm |
| [PHASE05_HANDOFF.md](docs/04-database-architecture/PHASE05_HANDOFF.md) | What phase 04 handed to phase 05 |
| [SELF_CHECK.md](docs/04-database-architecture/SELF_CHECK.md) | Phase self-check |
| [INDEPENDENT_REVIEW.md](docs/04-database-architecture/INDEPENDENT_REVIEW.md) | Phase independent review |
| [GATE_CHECKLIST.md](docs/04-database-architecture/GATE_CHECKLIST.md) | Phase gate checklist |
| [CHECKPOINT_APR-006.md](docs/04-database-architecture/CHECKPOINT_APR-006.md) | Checkpoint procedure for this phase |

### 14.6 Phase 05 — Application / API (`docs/05-application-api-architecture/`)

This folder names commands and queries. A command listed here is an architecture candidate until factory evidence confirms the procedure. No API is implemented.

| File | What it is |
| --- | --- |
| [README.md](docs/05-application-api-architecture/README.md) | Entry page for the application phase |
| [COMMAND_CATALOGUE.md](docs/05-application-api-architecture/COMMAND_CATALOGUE.md) | Named commands and which of them may post stock |
| [QUERY_CATALOGUE.md](docs/05-application-api-architecture/QUERY_CATALOGUE.md) | Named queries. Queries do not post stock |
| [MODULE_DEPENDENCY_MAP.md](docs/05-application-api-architecture/MODULE_DEPENDENCY_MAP.md) | Which module may depend on which other module |
| [ORCHESTRATION.md](docs/05-application-api-architecture/ORCHESTRATION.md) | How a command coordinates modules without a second writer |
| [API_ENVELOPE.md](docs/05-application-api-architecture/API_ENVELOPE.md) | Sketch of a future request and error shape. Not an implemented API |
| [BACKGROUND_AND_REALTIME.md](docs/05-application-api-architecture/BACKGROUND_AND_REALTIME.md) | Labels for background and real-time work. No broker is accepted |
| [PHASE06_HANDOFF.md](docs/05-application-api-architecture/PHASE06_HANDOFF.md) | What phase 05 handed to phase 06 |
| [SELF_CHECK.md](docs/05-application-api-architecture/SELF_CHECK.md) | Phase self-check |
| [INDEPENDENT_REVIEW.md](docs/05-application-api-architecture/INDEPENDENT_REVIEW.md) | Phase independent review |
| [RECONCILIATION.md](docs/05-application-api-architecture/RECONCILIATION.md) | Phase reconciliation |
| [GATE_CHECKLIST.md](docs/05-application-api-architecture/GATE_CHECKLIST.md) | Phase gate checklist |
| [CHECKPOINT_APR-007.md](docs/05-application-api-architecture/CHECKPOINT_APR-007.md) | Checkpoint procedure for this phase |

### 14.7 Phase 06 — Security (`docs/06-security-rbac-audit/`)

This folder holds security labels. It is not a finished access-control system. Personal operator accounts are factory evidence. Permission matrices and named delegates are not.

| File | What it is |
| --- | --- |
| [README.md](docs/06-security-rbac-audit/README.md) | Entry page for the security phase |
| [THREAT_MODEL.md](docs/06-security-rbac-audit/THREAT_MODEL.md) | Trust boundaries |
| [ROLE_PERMISSION_MATRIX.md](docs/06-security-rbac-audit/ROLE_PERMISSION_MATRIX.md) | Permission labels. Not assigned to the factory roster |
| [CUSTOMER_ISOLATION.md](docs/06-security-rbac-audit/CUSTOMER_ISOLATION.md) | Customer data isolation labels |
| [SESSION_AND_IDENTITY.md](docs/06-security-rbac-audit/SESSION_AND_IDENTITY.md) | Personal accounts. No shared Station account. Login is not Entry |
| [AUDIT_TAXONOMY.md](docs/06-security-rbac-audit/AUDIT_TAXONOMY.md) | What kind of audit evidence is expected |
| [SECURITY_VERIFICATION.md](docs/06-security-rbac-audit/SECURITY_VERIFICATION.md) | Security checks to perform later. Not executed tests |
| [PHASE07_HANDOFF.md](docs/06-security-rbac-audit/PHASE07_HANDOFF.md) | What phase 06 handed to phase 07 |
| [SELF_CHECK.md](docs/06-security-rbac-audit/SELF_CHECK.md) | Phase self-check |
| [INDEPENDENT_REVIEW.md](docs/06-security-rbac-audit/INDEPENDENT_REVIEW.md) | Phase independent review |
| [RECONCILIATION.md](docs/06-security-rbac-audit/RECONCILIATION.md) | Phase reconciliation |
| [GATE_CHECKLIST.md](docs/06-security-rbac-audit/GATE_CHECKLIST.md) | Phase gate checklist |
| [CHECKPOINT_APR-008.md](docs/06-security-rbac-audit/CHECKPOINT_APR-008.md) | Checkpoint procedure for this phase |

### 14.8 Phase 07 — Testing architecture (`docs/07-testing-quality-architecture/`)

This folder describes how the future system should be verified. It does not contain tests, and it does not choose a test runner.

| File | What it is |
| --- | --- |
| [README.md](docs/07-testing-quality-architecture/README.md) | Entry page for verification architecture |
| [TEST_STRATEGY.md](docs/07-testing-quality-architecture/TEST_STRATEGY.md) | Levels of verification |
| [VERIFICATION_TRACE.md](docs/07-testing-quality-architecture/VERIFICATION_TRACE.md) | How a future test would trace to a requirement |
| [SCENARIO_CATALOGUE.md](docs/07-testing-quality-architecture/SCENARIO_CATALOGUE.md) | Scenario intents |
| [PROPERTY_AND_KERNEL_INTENTS.md](docs/07-testing-quality-architecture/PROPERTY_AND_KERNEL_INTENTS.md) | Property and posting-kernel intents |
| [NFR_AND_UAT.md](docs/07-testing-quality-architecture/NFR_AND_UAT.md) | Non-functional and acceptance intents |
| [QUALITY_GATES.md](docs/07-testing-quality-architecture/QUALITY_GATES.md) | Evidence expected before a later release |
| [PHASE08_HANDOFF.md](docs/07-testing-quality-architecture/PHASE08_HANDOFF.md) | What phase 07 handed to phase 08 |
| [SELF_CHECK.md](docs/07-testing-quality-architecture/SELF_CHECK.md) | Phase self-check |
| [INDEPENDENT_REVIEW.md](docs/07-testing-quality-architecture/INDEPENDENT_REVIEW.md) | Phase independent review |
| [RECONCILIATION.md](docs/07-testing-quality-architecture/RECONCILIATION.md) | Phase reconciliation |
| [GATE_CHECKLIST.md](docs/07-testing-quality-architecture/GATE_CHECKLIST.md) | Phase gate checklist |
| [CHECKPOINT_APR-009.md](docs/07-testing-quality-architecture/CHECKPOINT_APR-009.md) | Checkpoint procedure for this phase |

### 14.9 Phase 08 — Integration and deployment labels (`docs/08-integration-deployment/`)

This folder names future boundaries: adapters, backup, and deployment labels. No integration is built. Finance-Lite export is not a legal general ledger.

| File | What it is |
| --- | --- |
| [README.md](docs/08-integration-deployment/README.md) | Entry page for integration labels |
| [INTEGRATION_CATALOGUE.md](docs/08-integration-deployment/INTEGRATION_CATALOGUE.md) | Adapter names and what they must not become |
| [EXTERNAL_BOUNDARIES.md](docs/08-integration-deployment/EXTERNAL_BOUNDARIES.md) | What stays outside the MVP |
| [DEPLOYMENT_TOPOLOGY.md](docs/08-integration-deployment/DEPLOYMENT_TOPOLOGY.md) | Environment labels. Docker is not accepted |
| [OBSERVABILITY.md](docs/08-integration-deployment/OBSERVABILITY.md) | Kinds of operational signals. No product is chosen |
| [BACKUP_AND_RECOVERY.md](docs/08-integration-deployment/BACKUP_AND_RECOVERY.md) | Recovery labels, including rebuild of Balance and genealogy |
| [RUNBOOK_CATALOGUE.md](docs/08-integration-deployment/RUNBOOK_CATALOGUE.md) | Runbook names. Not operating procedures for a live system |
| [PHASE09_HANDOFF.md](docs/08-integration-deployment/PHASE09_HANDOFF.md) | What phase 08 handed to phase 09 |
| [SELF_CHECK.md](docs/08-integration-deployment/SELF_CHECK.md) | Phase self-check |
| [INDEPENDENT_REVIEW.md](docs/08-integration-deployment/INDEPENDENT_REVIEW.md) | Phase independent review |
| [RECONCILIATION.md](docs/08-integration-deployment/RECONCILIATION.md) | Phase reconciliation |
| [GATE_CHECKLIST.md](docs/08-integration-deployment/GATE_CHECKLIST.md) | Phase gate checklist |
| [CHECKPOINT_APR-010.md](docs/08-integration-deployment/CHECKPOINT_APR-010.md) | Checkpoint procedure for this phase |

### 14.10 Phase 09 — Future repository (`docs/09-repository-documentation/`)

This folder describes how a future code repository should be laid out. That layout is not created yet.

| File | What it is |
| --- | --- |
| [README.md](docs/09-repository-documentation/README.md) | Entry page for the future repository rules |
| [REPOSITORY_LAYOUT.md](docs/09-repository-documentation/REPOSITORY_LAYOUT.md) | Intended folders for a later implementation |
| [DEPENDENCY_AND_IMPORT_RULES.md](docs/09-repository-documentation/DEPENDENCY_AND_IMPORT_RULES.md) | Which future module may import which other module |
| [BRANCHING_AND_RELEASE.md](docs/09-repository-documentation/BRANCHING_AND_RELEASE.md) | Branch and release labels |
| [DOCUMENTATION_OWNERSHIP.md](docs/09-repository-documentation/DOCUMENTATION_OWNERSHIP.md) | Who owns which kind of document |
| [GENERATED_VS_AUTHORED.md](docs/09-repository-documentation/GENERATED_VS_AUTHORED.md) | Generated files must not overwrite authored architecture |
| [CONFORMANCE_CHECKS.md](docs/09-repository-documentation/CONFORMANCE_CHECKS.md) | Checks a later codebase would have to pass |
| [PHASE10_HANDOFF.md](docs/09-repository-documentation/PHASE10_HANDOFF.md) | What phase 09 handed to phase 10 |
| [SELF_CHECK.md](docs/09-repository-documentation/SELF_CHECK.md) | Phase self-check |
| [INDEPENDENT_REVIEW.md](docs/09-repository-documentation/INDEPENDENT_REVIEW.md) | Phase independent review |
| [RECONCILIATION.md](docs/09-repository-documentation/RECONCILIATION.md) | Phase reconciliation |
| [GATE_CHECKLIST.md](docs/09-repository-documentation/GATE_CHECKLIST.md) | Phase gate checklist |
| [CHECKPOINT_APR-011.md](docs/09-repository-documentation/CHECKPOINT_APR-011.md) | Checkpoint procedure for this phase |

### 14.11 Phase 10 — Cursor and agents (`docs/10-ai-cursor-development/`)

This folder limits what an AI assistant may do in this repository. Reading it does not grant permission to write application code.

| File | What it is |
| --- | --- |
| [README.md](docs/10-ai-cursor-development/README.md) | Entry page for agent rules |
| [AGENT_AUTHORITY.md](docs/10-ai-cursor-development/AGENT_AUTHORITY.md) | What an agent may and may not change |
| [RULE_AND_SKILL_CATALOGUE.md](docs/10-ai-cursor-development/RULE_AND_SKILL_CATALOGUE.md) | Catalogue of Cursor rules and skills |
| [IMPLEMENTATION_PROMPT_STANDARDS.md](docs/10-ai-cursor-development/IMPLEMENTATION_PROMPT_STANDARDS.md) | How a future implementation prompt must be bounded |
| [HUMAN_AND_INDEPENDENT_REVIEW.md](docs/10-ai-cursor-development/HUMAN_AND_INDEPENDENT_REVIEW.md) | Human review remains required |
| [TOOL_MCP_HOOK_SAFETY.md](docs/10-ai-cursor-development/TOOL_MCP_HOOK_SAFETY.md) | Tool and hook safety labels |
| [GENERATED_CODE_ACCEPTANCE.md](docs/10-ai-cursor-development/GENERATED_CODE_ACCEPTANCE.md) | Generated code is not accepted merely because it was generated |
| [PHASE11_HANDOFF.md](docs/10-ai-cursor-development/PHASE11_HANDOFF.md) | What phase 10 handed to phase 11 |
| [SELF_CHECK.md](docs/10-ai-cursor-development/SELF_CHECK.md) | Phase self-check |
| [INDEPENDENT_REVIEW.md](docs/10-ai-cursor-development/INDEPENDENT_REVIEW.md) | Phase independent review |
| [RECONCILIATION.md](docs/10-ai-cursor-development/RECONCILIATION.md) | Phase reconciliation |
| [GATE_CHECKLIST.md](docs/10-ai-cursor-development/GATE_CHECKLIST.md) | Phase gate checklist |
| [CHECKPOINT_APR-012.md](docs/10-ai-cursor-development/CHECKPOINT_APR-012.md) | Checkpoint procedure for this phase |

### 14.12 Phase 11 — Validation (`docs/11-architecture-validation/`)

This folder is the integrated architecture review. It checks whether the earlier phases fit together. It is not a license to implement.

| File | What it is |
| --- | --- |
| [README.md](docs/11-architecture-validation/README.md) | Entry page for validation |
| [INTEGRATED_REVIEW.md](docs/11-architecture-validation/INTEGRATED_REVIEW.md) | Cross-phase review |
| [TRACEABILITY_COVERAGE.md](docs/11-architecture-validation/TRACEABILITY_COVERAGE.md) | Whether requirements have a design home |
| [WALKTHROUGHS.md](docs/11-architecture-validation/WALKTHROUGHS.md) | End-to-end walkthroughs of the design |
| [CROSS_DOMAIN.md](docs/11-architecture-validation/CROSS_DOMAIN.md) | Cross-domain dependencies and contradictions |
| [RISK_OPERABILITY.md](docs/11-architecture-validation/RISK_OPERABILITY.md) | Operability and small-team feasibility |
| [CORRECTIVE_ACTIONS.md](docs/11-architecture-validation/CORRECTIVE_ACTIONS.md) | Corrections required before approval |
| [PHASE12_HANDOFF.md](docs/11-architecture-validation/PHASE12_HANDOFF.md) | What phase 11 handed to phase 12 |
| [SELF_CHECK.md](docs/11-architecture-validation/SELF_CHECK.md) | Phase self-check |
| [INDEPENDENT_REVIEW.md](docs/11-architecture-validation/INDEPENDENT_REVIEW.md) | Phase independent review |
| [RECONCILIATION.md](docs/11-architecture-validation/RECONCILIATION.md) | Phase reconciliation |
| [GATE_CHECKLIST.md](docs/11-architecture-validation/GATE_CHECKLIST.md) | Phase gate checklist |
| [CHECKPOINT_APR-013.md](docs/11-architecture-validation/CHECKPOINT_APR-013.md) | Checkpoint procedure for this phase |

### 14.13 Phase 12 — Implementation planning (`docs/12-implementation-planning/`)

This folder plans future implementation slices. Planning is not authorization. `IMPLEMENTATION_AUTHORIZED` remains false.

| File | What it is |
| --- | --- |
| [README.md](docs/12-implementation-planning/README.md) | Entry page for implementation planning |
| [IMPLEMENTATION_READINESS.md](docs/12-implementation-planning/IMPLEMENTATION_READINESS.md) | What must be true before a human may consider an unlock |
| [ROADMAP_AND_SLICES.md](docs/12-implementation-planning/ROADMAP_AND_SLICES.md) | Proposed vertical slices |
| [WORK_ITEMS.md](docs/12-implementation-planning/WORK_ITEMS.md) | Work items tied to approved identifiers |
| [SPIKES_AND_ACCEPTANCE.md](docs/12-implementation-planning/SPIKES_AND_ACCEPTANCE.md) | Spike kinds. A spike is not an unlock |
| [CUTOVER_TRAINING_ROLLOUT.md](docs/12-implementation-planning/CUTOVER_TRAINING_ROLLOUT.md) | Labels for a later cutover. Not a confirmed opening-stock procedure |
| [AUTHORIZATION_RECORD.md](docs/12-implementation-planning/AUTHORIZATION_RECORD.md) | Labels for a future authorization record. The record is not an unlock |
| [SELF_CHECK.md](docs/12-implementation-planning/SELF_CHECK.md) | Phase self-check |
| [INDEPENDENT_REVIEW.md](docs/12-implementation-planning/INDEPENDENT_REVIEW.md) | Phase independent review |
| [RECONCILIATION.md](docs/12-implementation-planning/RECONCILIATION.md) | Phase reconciliation |
| [GATE_CHECKLIST.md](docs/12-implementation-planning/GATE_CHECKLIST.md) | Phase gate checklist |
| [CHECKPOINT_APR-014.md](docs/12-implementation-planning/CHECKPOINT_APR-014.md) | Checkpoint procedure for this phase |

### 14.14 Repository root and Cursor controls

These files sit outside `docs/` and control, or explain, the repository itself.

| File | What it is |
| --- | --- |
| [README.md](README.md) | This file. Orientation, lock, factory facts, and the document map |
| [docs/INDEX.md](docs/INDEX.md) | Shorter index of the phase documents |
| [.cursor/architecture-gate.json](.cursor/architecture-gate.json) | Technical lock. `implementationAuthorized` is false. Do not edit it to unlock work |
| [.cursor/rules/00-architecture-first.mdc](.cursor/rules/00-architecture-first.mdc) | Rule that keeps work on architecture while implementation is locked |
| [.cursor/rules/01-phase-question-pack.mdc](.cursor/rules/01-phase-question-pack.mdc) | Rule for updating the question pack after a phase gate |
| [.cursor/hooks.json](.cursor/hooks.json) | Cursor hook configuration for the write gate |
| [.cursor/skills/architecture-gate-review/SKILL.md](.cursor/skills/architecture-gate-review/SKILL.md) | Skill used to review the architecture gate |

There is no `.cursor/IMPLEMENTATION_UNLOCK.json`. Its absence is intentional.

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
3. Do not invent a Coil→Sheet posting command, kg↔length formula,
   station-account security, timestamp fields, RBAC mappings, or package
   choices.
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
