---
id: APR-043
title: Formal Owner acceptance of I2 purchase-linked receiving backend
phase: 12-implementation-planning
status: approved
version: 1.0.0
owners: [project-sponsor]
depends_on: [APR-042, APR-041, APR-039, SRC-007, IMPL-I2-001, IMPL-I2-TRACE-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-10-25
approval: Actual Owner Formal Owner Acceptance of I2 Backend Implementation instruction; focused evidence condition satisfied
supersedes: null
---

# Formal I2 backend acceptance

Source: actual Owner instruction **ERP — Formal Owner Acceptance of I2 Backend
Implementation**, recorded2026-10-25. Owner accepts the completed I2 capability
conditional only on focused evidence consistency. The checks below satisfy that
condition; no material contradiction or required implementation defect was found.
This records actual human acceptance, not an agent-created approval.

Accepted implementation: `b585fd795fb0276bc936af254c6d56fd7e3bcbe8`,
`feat(procurement): deliver atomic purchase-linked receiving` (52files).
**I2 is the thirteenth Owner-accepted backend capability.** The twelve capabilities
already accepted through APR-039 remain accepted. This is backend acceptance only,
not the entire ERP, browser UI, factory UAT, deployment or production cutover.

## Accepted operations and ownership

| Operation / version | Current personal organizational authority |
| --- | --- |
| ConfirmPurchaseReceiving v1 | ACT-WH |
| GetReceivingArrival v1 | ACT-WH |
| GetPurchaseOrderReceiving v1 | ACT-PROC / ACT-WH |

Procurement owns shared arrival/waybill/warehouse-receipt evidence, actual unit
sources, explicit acceptance/discrepancies, progress and physical-code claims.
Inventory owns intake/origin creation through its published owner port; ACT-IPS
alone posts Ledger/Balance. Accepted additive [0018](../../../database/migrations/0018_purchase_receiving.sql)
creates five Procurement tables and Inventory inbound_unit_origin. Historical
migrations, I1 original orders and old receipt evidence are not rewritten.

One PO may span arrivals; one physical arrival/waybill may include multiple POs.
Each accepted physical unit has a manually assigned unique business code and its
own stock identity, product number and accepted W1. Original ordered attributes
and W1 remain immutable; actual attributes, discrepancies, explicit WH acceptance
and trusted actor/provenance remain separate. All eleven receiving fields retain
six mandatory/five optional designations; optional absence does not block receipt.
W2/W3 are exact whole-consignment document evidence, never allocated or substituted
for unit W1. WH may manually accept changed/mismatched/excess/unordered goods;
no fictional PO line, automatic exception acceptance or OTHER fallback is admitted.

Sources, units, all IPS invocations, lineage, outcome and audit share one original
PostgreSQL transaction and final COMMIT. The128effect limit is per IPS invocation,
not per arrival. Cross-path legacy/new code guards and independent document
uniqueness preserve accepted identity policy without historical backfill.
PROC reads all committed fields relevant to its scoped order, including driver,
without sibling/unlinked cargo. Current grants, revocation, isolation and replay
disclosure remain binding; no new SEC/customer or unrelated-role permission.

## Focused evidence verification

- Exact commit and52file scope inspected: receiving source/adapters/HTTP,
  Inventory/Genealogy owner extensions, additive0018, relevant tests/tooling and
  bounded governance. Initial tree clean. No new implementation was undertaken.
- Actual command/query symbols, composition authority, shared source ownership,
  per-unit/consignment weight distinction and cross-path constraints agree with
  the [accepted design](../../12-implementation-planning/I2_IMPLEMENTATION_DESIGN.md)
  and [implementation status](../../12-implementation-planning/I2_IMPLEMENTATION_STATUS.md).
- Actual `receiving.test.ts` assertions and successful canonical log entries were
  inspected: original5units at2000kg, received3, exactly3Inventory Units/3Ledger
  effects/6000kg,2outstanding, original row still2000/5. This is not inferred from
  a passing-test count alone.
- Real129/257unit cases assert all sources/origins/Units/Ledger/stock and one
  durable outcome;257case reads every distinct unit through bounded PROC pages.
  Actual Inventory code slices by128 on the same context; unit test proves
  batches[128,128,1]. The real129th Ledger-insertion fault asserts zero persisted
  arrival/source/origin/Unit/Ledger/kg/code-claim effects, then original-key retry
  succeeds. No independent batch transaction/partial COMMIT is introduced.
- Existing ignored logs inspected, not rerun: **198/198unit** and **349/349real
  PostgreSQL18.6 integration**; zero failures/cancellations/skips. The complete
  canonical run includes I1 and other accepted regressions and all22I2families.
  Focused9/7/45runs overlap it and are not added to349.
- Recorded executed integration command: pinned Node24.21.0 executable
  `artifacts/tests/i1-environment/node/node-v24.21.0-win-x64/node.exe` with
  `--env-file=.env.local tools/test/run-integration.mjs`.
  Unit command: `npm run test:unit` with pinned PATH. Delivery also records PASS
  for build/preflight/lint/format/boundaries and documentation/diff checks.
- Required findings I2-SEC-01/I2-ENG-01, I2-ENG-02, I2-SEC-DB-01/02/03 and required
  race/pagination test gaps are closed in the delivered review table with targeted
  executable evidence. Independent engineering/database/security reviews PASS.
  Historical static review is not falsely represented as a fresh runtime audit.

| Retained local evidence | SHA256 |
| --- | --- |
| artifacts/tests/i2-unit-final.log | A252867B47ABE428325F4070223907A58346654294E073B08681CCAC13F65FD3 |
| artifacts/tests/i2-integration-final.log | 1D3F0971D9AE8DAE2A82BBD46A855F6C476448566F87E7FDA62B6590C6C5A70C |

Hashes match the delivered receipts. Logs stay ignored; no secrets are copied.
No application/PostgreSQL test suite was executed during this acceptance task.

## Requirements, limits and remaining product boundary

The [sixty-ID trace](../../12-implementation-planning/I2_IMPLEMENTATION_TRACE.md)
contains exactly25workflow,23field and12supplemental IDs, without renumbering.
I1-retained behavior remains distinct from I2 implementation and cross-stage
executed evidence. Its22family mapping resolves to successful real test cases.
REQ-INBOUND-025 is a governed device/ticket exclusion, not implemented device
functionality. Backend projections satisfy the relevant visibility contract;
browser workflow, factory UAT and deployment are not implied by that status.

Accepted existing text/calendar/request/response/page capacities remain unchanged;
no new operating maximum is approved here. Unsupported technical material types
are explicitly rejected; actual deployment catalogue/history checks still precede
any separately authorized rollout. No new business policy, original-order edit,
post-confirmation correction/return, QC, Finance or weighing-device integration.

## Current task scope and stop

Only necessary acceptance/governance/status/traceability Markdown changes and a
local documentation commit are authorized. No runtime, tests, SQL, executable
permissions, historical records, gate or unlock changes. No remote push or remote
presence assumption. A clean local delivery does not establish remote publication.

The next appropriate activity is **one consolidated end-to-end backend requirements
audit of the purchase-to-receiving workflow**, using accepted I1/I2 code and executed
evidence. This instruction identifies that activity but does NOT execute or
authorize it; no repeated implementation, general design or gap-analysis phase.
Stop after acceptance documentation and report for separate Owner direction.

## Acceptance-record validation

Independent focused evidence and architecture/security governance review: PASS,
no required finding or material contradiction. The reviewer checked actual source
and assertions, retained log receipts, backend-only scope and next-audit stop.
All60requirement rows and22family rows are unchanged from the accepted delivery.
Ten changed Markdown files,1095local links and118metadata dependencies validate;
the receiving register still has11fields with6mandatory/5optional. Historical
sources/migrations are unchanged and working/staged diff checks pass. No runtime,
SQL, application tests, permissions or gate/unlock changes belong to this task.
Final local governance commit/tree status is reported after recording; no push.
