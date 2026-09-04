# Foolad Navardkaran ERP/MES Architecture

This repository is the design authority for the Foolad Navardkaran integrated
sales, procurement, inventory, production, quality, delivery, finance-lite,
traceability, and monitoring system.

## Current status

- Current phase: `00-governance`
- Gate status: `APPROVED_CHECKPOINT_PENDING`
- Phase 00 approval: `APR-002`; checkpoint pending and no commit exists
- FIND-006 through FIND-014: resolved and independently verified; 66 validation
  tests pass
- Phase 01: not active; a completed approved checkpoint is required
- Implementation authorized: **No**
- Application source code, database migrations, package setup, and deployment
  implementation are prohibited until the final architecture gate is explicitly
  approved.

See [CURRENT_PHASE.md](docs/00-governance/CURRENT_PHASE.md) for the authoritative
work authorization.

## Start here

1. [Documentation index](docs/INDEX.md)
2. [Architecture charter](docs/00-governance/ARCHITECTURE_CHARTER.md)
3. [Phase gates](docs/00-governance/PHASE_GATES.md)
4. [Open questions](docs/00-governance/registers/OPEN_QUESTIONS.md)
5. [Decision register](docs/00-governance/registers/DECISIONS.md)
6. [Project assimilation](docs/01-project-assimilation/README.md)

## Phase dashboard

- `00-governance`: **approved; checkpoint pending**
- `01-project-assimilation`: planned, not active
- `02-domain-business-architecture`: planned
- `03-state-machines-invariants`: planned
- `04-database-architecture`: planned
- `05-application-api-architecture`: planned
- `06-security-rbac-audit`: planned
- `07-testing-quality-architecture`: planned
- `08-integration-deployment`: planned
- `09-repository-documentation`: planned
- `10-ai-cursor-development`: planned
- `11-architecture-validation`: planned
- `12-implementation-planning`: planned

Each phase follows:

`draft → self-check → independent review → reconciliation → explicit approval → checkpoint`

No phase may begin detailed work before its entry criteria are met. Material
changes to approved architecture reopen affected downstream artifacts.
