# Foolad Navardkaran ERP/MES Architecture

This repository is the design authority for the Foolad Navardkaran integrated
sales, procurement, inventory, production, quality, delivery, finance-lite,
traceability, and monitoring system.

## Current status

- Completed phase: `12-implementation-planning` (structure; checkpoint pending)
- Current phase: `12-implementation-planning`
- Gate status: `APPROVED`
- Phase 00 approval: `APR-002`; checkpoint completed at
  `540a606ef32a3cb17f7e886dff3c4dcde82ca4b1`
- Phase 01 approval: `APR-003`; checkpoint completed at
  `91273e9e30ead2f19203fab2f82d5f23911ee0aa`
- Phase 02 approval: `APR-004`; checkpoint completed at
  `ec3c210a83a0d8f163bbbb6fadc1e4a28b8bf8db`
- Phase 03 approval: `APR-005`; checkpoint completed at
  `bef6b6464baaf62ac8d3db9f9b7fa835ad04ec6c`
- Phase 04 approval: `APR-006` at `2026-09-06T19:42:00+03:30`, including
  ASM-017; checkpoint completed at
  `87f9f10442d58fbd224dce09f46c862eb8707e8f`
- Phase 05 approval: `APR-007` at `2026-09-06T20:31:00+03:30`, including
  ASM-018; checkpoint completed at
  `00b30a3064027fd0584c35c5f479b04d087614a6`
- Phase 06 approval: `APR-008` at `2026-09-06T22:59:00+03:30`, including
  ASM-019; checkpoint completed at
  `167353573840ef22d23049b864636d7383c61911`
- Phase 07 approval: `APR-009` at `2026-09-06T23:44:00+03:30`, including
  ASM-020; checkpoint completed at
  `29921d69e10bf6704966a08ff927d9e6ae9c0bd3`
- Phase 08 approval: `APR-010` at `2026-09-07T01:28:00+03:30`, including
  ASM-021; checkpoint completed at
  `751035d2359abb5bd99a1b8a254715b2a5c937ae`
- Phase 09 approval: `APR-011` at `2026-09-07T21:17:00+03:30`, including
  ASM-022; checkpoint completed at
  `81aef0e7bc217cf5172b1f64edf13848b6242bb2`
- Phase 10 approval: `APR-012` at `2026-09-07T21:52:00+03:30`, including
  ASM-023; checkpoint completed at
  `1d581c4357a784f3170bd42349a47c1b38bde1e6`
- Phase 11 approval: `APR-013` at `2026-09-07T22:19:00+03:30`, including
  ASM-024; checkpoint completed at
  `57062e96c91b6eff52f233aaf3a0df65a81e9da4`
- Phase 12 approval: `APR-014` at `2026-09-07T23:16:00+03:30`, including
  ASM-025; Git checkpoint pending. Team answers expected in a
  few days. OQ-019 still blocks workshop execution
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
- `02-domain-business-architecture`: **approved; checkpoint completed**
- `03-state-machines-invariants`: **approved; checkpoint completed**
- `04-database-architecture`: **approved (logical); checkpoint completed**
- `05-application-api-architecture`: **approved (structure); checkpoint completed**
- `06-security-rbac-audit`: **approved (structure); checkpoint completed**
- `07-testing-quality-architecture`: **approved (structure); checkpoint completed**
- `08-integration-deployment`: **approved (structure); checkpoint completed**
- `09-repository-documentation`: **approved (structure); checkpoint completed**
- `10-ai-cursor-development`: **approved (structure); checkpoint completed**
- `11-architecture-validation`: **approved (structure); checkpoint completed**
- `12-implementation-planning`: **approved (structure); checkpoint pending**

Each phase follows:

`draft → self-check → independent review → reconciliation → explicit approval → checkpoint`

No phase may begin detailed work before its entry criteria are met. Material
changes to approved architecture reopen affected downstream artifacts.

Phase 12 is approved as APR-014, including ASM-025. There is no Phase
13. Phase 12 approval is not an implementation unlock. Temporary workshop
identities cannot sign decisions. Implementation remains unauthorized.
