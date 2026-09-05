# Foolad Navardkaran ERP/MES Architecture

This repository is the design authority for the Foolad Navardkaran integrated
sales, procurement, inventory, production, quality, delivery, finance-lite,
traceability, and monitoring system.

## Current status

- Completed phase: `02-domain-business-architecture` (design approved; Git
  checkpoint pending)
- Current phase: `03-state-machines-invariants`
- Gate status: `ACTIVE_IN_REVIEW`
- Phase 00 approval: `APR-002`; checkpoint completed at
  `540a606ef32a3cb17f7e886dff3c4dcde82ca4b1`
- Phase 01 approval: `APR-003`; checkpoint completed at
  `91273e9e30ead2f19203fab2f82d5f23911ee0aa`
- Phase 02 approval: `APR-004` at `2026-09-06T00:31:00+03:30`; Git
  checkpoint pending. Team answers expected in a few days. OQ-019 still
  blocks workshop execution
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

- `00-governance`: **approved; checkpoint completed**
- `01-project-assimilation`: **approved; checkpoint completed; phase complete**
- `02-domain-business-architecture`: **approved; checkpoint pending**
- `03-state-machines-invariants`: **in_review; structure drafting**
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

Phase 02 is approved as APR-004. Phase 03 may draft structure with open
guards. Temporary workshop identities cannot sign decisions. Implementation
remains unauthorized. The APR-004 Git checkpoint is pending a human-created
marker.
