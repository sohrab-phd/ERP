---
id: GOV-FINDINGS-001
title: Review Findings Register
phase: 00-governance
status: approved
version: 0.11.1
owners: [independent-reviewer, chief-solution-architect]
depends_on: [GOV-GATES-001]
last_reviewed: 2026-09-06
approval: APR-004
supersedes: null
---

# Review Findings Register

Findings are append-only and may be `open`, `accepted`, `resolved`, `rejected`,
or `superseded`. Resolution requires evidence and affected-artifact references.

APR-002 approved this register's Phase 00 seed version. APR-003 approves the
current version as accurate Phase 01 review evidence. Every finding retains its
recorded status and downstream effect; artifact approval does not close open
findings or their linked questions.

## FIND-001 — Portal phase conflict

- Severity: critical
- Status: open
- Finding: Source documents disagree on whether Customer Portal capability is
  excluded from MVP or may be partially included.
- Affected artifacts: Phase 02 scope, Phase 05 API, Phase 06 security, Phase 08 deployment
- Related question: OQ-010

## FIND-002 — Proposed technologies may be mistaken for approved decisions

- Severity: high
- Status: resolved
- Finding: NestJS, Prisma, Socket.IO, React, job scheduling, test runner, and
  observability references have different maturity across source sections.
- Treatment: ADR-0001 decides only Node.js + TypeScript; OQ-018 keeps detailed
  platform choices open. The assimilation report now labels detailed technology
  references as proposed/evaluation baselines.

## FIND-003 — Partial fulfillment policies lack numeric limits

- Severity: high
- Status: open
- Finding: Partial shipment/fulfillment is expected, but over-production and
  over-delivery tolerances remain unapproved.
- Related question: OQ-006

## FIND-004 — Inventory Posting architecture is unresolved

- Severity: critical
- Status: open
- Finding: Application-orchestrated transactions versus restricted PostgreSQL
  posting require evidence and an ADR.
- Related question: OQ-017

## FIND-005 — Governance safeguards are not OS-level controls

- Severity: medium
- Status: accepted
- Finding: Cursor rules/hooks can constrain covered agent actions but cannot
  prevent all manual or editor-assisted changes.
- Treatment: Document limitation; rely on explicit gates, review, Git history,
  and future CI/branch protection for broader enforcement.

## FIND-006 — Implementation authorization source

- Severity: critical
- Status: resolved
- Finding: Editable narrative status initially controlled technical unlock.
- Resolution: Hook authorization now requires protected Cursor policy plus a
  matching, validated implementation unlock marker.
- Evidence: HOOK_VALIDATION.md version 0.2.0

## FIND-007 — Unlock marker and post-unlock scope

- Severity: critical
- Status: resolved
- Finding: File-write scope is validated, but post-unlock Shell scope, unknown
  tools, and approval-manifest authenticity require stronger enforcement.
- Resolution: Exact authorized Shell commands are enforced; unknown tools are
  denied; MCP resource downloads are classified as writes; approved-manifest
  semantics, filename IDs, and checkpoint phases are cross-validated.
- Evidence: HOOK_VALIDATION.md version 0.4.0

## FIND-008 — Shell prefix bypass

- Severity: high
- Status: resolved
- Finding: Prefix matching allowed compound/redirection suffixes.
- Resolution: Whole-command patterns reject separators, pipes, redirects, extra
  options, and arbitrary commands while locked.
- Evidence: Expanded hook test suite

## FIND-009 — Pre-approval checkpoint bypass

- Severity: high
- Status: resolved
- Finding: Git staging/commit relied on agent-editable Markdown approval text.
- Resolution: Git staging/commit requires a protected, unexpired, human-created
  phase-checkpoint marker with exact approved commands and manifest reference.
- Evidence: HOOK_VALIDATION.md version 0.4.0

## FIND-010 — Missing Phase 00 gate evidence

- Severity: high
- Status: resolved
- Finding: Templates existed without instantiated Phase 00 review artifacts.
- Resolution: SELF_CHECK.md, INDEPENDENT_REVIEW.md, RECONCILIATION.md, and
  GATE_CHECKLIST.md now form the exact review package.

## FIND-011 — Hook configuration disabled during maintenance

- Severity: critical
- Status: resolved
- Finding: The first follow-up review found `.cursor/hooks.json` absent while its
  configuration remained in `.cursor/hooks.disabled`.
- Resolution: Maintenance configuration was removed, `.cursor/hooks.json` was
  restored, and a live `git status --short` read succeeded afterward.
- Evidence: HOOK_VALIDATION.md version 0.5.0

## FIND-012 — Checkpoint approval was not bound to immutable content

- Severity: high
- Status: resolved
- Finding: The checkpoint marker referenced editable Markdown and authorized
  `git add -A` without binding the complete changed-file set to approved content.
- Review history: Follow-up review 2 reopened this finding because staged
  deletions/type changes and staged bytes were not fully validated.
- Resolution: Marker validation requires raw SHA-256, clean-filtered Git blob
  object ID, and intended Git mode for every artifact. The hook compares complete
  changed/staged path sets, then staged blob IDs and modes. Both authorization
  markers are Git-ignored.
- Evidence: HOOK_VALIDATION.md version 0.6.0

## FIND-013 — Approved protected controls could not enter the checkpoint

- Severity: high
- Status: resolved
- Finding: The first APR-000 `git add -A` attempt failed closed because
  checkpoint authorization reused the agent-write protected-path rule and
  rejected hash-bound gate controls such as `.cursor/hooks.json`.
- Resolution: Agent writes to controls remain prohibited while the active hook
  is enabled. Separately, a valid human-created checkpoint marker may include
  protected control files when their raw SHA-256, Git blob ID, and mode match.
  Authorization marker files remain categorically excluded.
- Evidence: HOOK_VALIDATION.md version 0.8.1; 64-case suite
- Independent verification: completed; no Critical or High blocker remains.
- Approval disposition: corrected Phase 00 renewed under `APR-001`; checkpoint
  pending, implementation unauthorized, and Phase 01 inactive.

## FIND-014 — Cursor commit trailer absent from exact authorization

- Severity: high
- Status: resolved
- Finding: The APR-001 commit attempt failed closed because Cursor adds the
  fixed `Co-authored-by: Cursor <cursoragent@cursor.com>` trailer before hook
  evaluation, while the marker authorized only the unmodified command.
- Resolution: Validation accepts only the plain command or that exact fixed
  Cursor trailer form. The agent submits plain `git commit -m ...`; Cursor
  transforms it before hook evaluation, and the generator stores that transformed
  form in the marker. Arbitrary trailers remain denied.
- Evidence: HOOK_VALIDATION.md version 0.10.0; 66-case suite
- Independent verification: narrow review completed with verdict
  `READY_FOR_RENEWED_HUMAN_APPROVAL`; no Critical or High blocker remains.
- Approval disposition: APR-001 remains historical approved, but its uncommitted
  checkpoint is superseded by APR-002 and no APR-001 commit exists. Final
  renewed explicit approval is recorded as APR-002 at
  `2026-09-04T16:15:30.3016652+03:30`; the APR-002 checkpoint is pending, no
  staging or commit is claimed, implementation remains unauthorized, and
  Phase 01 remains inactive.

## FIND-015 — Completed checkpoint follow-up authorization

- Severity: high
- Status: resolved
- Finding: Completed checkpoint manifests could not initially authorize the
  separate documentation follow-up that records their completed commit.
- Review history: The first predicate revision admitted a mixed pending/completed
  state; independent review caught that edge before correction approval.
- Resolution: Checkpoint authorization now accepts exactly one of two mutually
  exclusive forms: one pending checkpoint and no valid hash commit, or one
  completed checkpoint paired with exactly one 40–64 hexadecimal commit. Mixed,
  duplicate, missing, and unpaired forms fail closed.
- Implementation-baseline validation accepts commit hashes with either paired
  backticks or no backticks and rejects unpaired backticks.
- Evidence: HOOK_VALIDATION.md version 0.11.0; 72-case suite, including direct
  implementation-baseline paired/unpaired cases.
- Independent verification: `READY_FOR_CORRECTION_APPROVAL`; no blocker remains.
- Approval disposition: `Project Owner (explicit approval in Cursor session)`
  approved the FIND-015 post-checkpoint correction and its follow-up checkpoint
  at `2026-09-04T16:49:32.2914786+03:30`.
- Follow-up checkpoint: completed at
  `25e89c2765575652aa9473922c3a09df7cc87eaf` with subject
  `docs: record phase 00 checkpoint`.
- Baseline checkpoint:
  `540a606ef32a3cb17f7e886dff3c4dcde82ca4b1`.
- Current state: Phase 01 remains `ACTIVE_IN_REVIEW`, implementation remains
  unauthorized, no APR-003 is created, and no checkpoint marker exists after
  human-confirmed deletion.
- Checkpoint-chain treatment: these current Phase 01 working-state updates enter
  the eventual Phase 01 checkpoint rather than create another Phase 00
  recording follow-up.

## FIND-016 — Technology maturity asymmetry

- Severity: high
- Status: resolved
- Finding: Modular Monolith, PostgreSQL, Ledger+Balance, Outbox, Docker Compose,
  Nginx, Ubuntu, frontend, scheduler, testing, observability, and detailed
  package references were stated with unequal maturity, allowing proposals to be
  mistaken for accepted decisions.
- Resolution: The Architecture Assimilation Report now labels all such choices
  as proposed/evaluation baselines except accepted ADR-0001 (Node.js +
  TypeScript). Proposed ADR-0006, ADR-0007, and ADR-0008 expose architecture
  style, data platform, and MVP deployment topology as explicit candidates.
  OQ-018 now covers the remaining architecture and platform decision set.
- Evidence: ASM-REPORT-001 version 0.2.0; GOV-DECISIONS-001 version 0.2.0;
  GOV-QUESTIONS-001 version 0.2.0; ASM-PROVENANCE-001
- Residual state: wording/maturity defect resolved; every candidate decision
  remains open until its evidence-based ADR is accepted under OQ-018.

## FIND-017 — Phase 01 register lifecycle falsely attributed to APR-002

- Severity: high
- Gate: Phase 01
- Status: resolved
- Finding: Seven canonical registers materially expanded during Phase 01 still
  marked their current versions `approved` with `approval: APR-002`. APR-002
  approved the Phase 00 seed baseline, not the later Phase 01 additions.
- Resolution: ASSUMPTIONS, BUSINESS_GLOSSARY, CANONICAL_DATA_DICTIONARY,
  DECISIONS, OPEN_QUESTIONS, REQUIREMENTS_TRACEABILITY, and REVIEW_FINDINGS now
  mark their current versions `in_review` with `approval: null` and preserve
  APR-002 as historical seed provenance in their bodies.
- Evidence: GOV-ASSUMPTIONS-001 version 0.2.1; GOV-GLOSSARY-001 version 0.2.1;
  GOV-DATA-DICT-001 version 0.2.1; GOV-DECISIONS-001 version 0.2.1;
  GOV-QUESTIONS-001 version 0.2.1; GOV-TRACE-001 version 0.2.1; and
  GOV-FINDINGS-001 version 0.9.1.
- Follow-up: A fresh independent review must verify the correction before the
  Phase 01 gate can advance.
- Approval disposition: The follow-up review verified this correction, and
  APR-003 subsequently approved current versions 0.2.2 of the six affected
  registers and version 0.9.2 of this register while preserving APR-002 seed
  provenance.

## FIND-018 — Objective source roles were stated symmetrically

- Severity: medium
- Gate: Phase 01
- Status: resolved
- Finding: REQ-OBJ-003 and REQ-OBJ-004 listed SRC-001 and SRC-002 as equal
  sources, obscuring that SRC-001 supplies business/architecture content while
  SRC-002 supplies methodology and validation support.
- Resolution: Both objective rows now state the asymmetric source roles while
  retaining their complete Phase 01 evidence and downstream trace chain.
- Evidence: GOV-TRACE-001 version 0.2.1 and ASM-PROVENANCE-001.

## FIND-019 — Glossary evidence map and first-use links were incomplete

- Severity: medium
- Gate: Phase 01
- Status: resolved
- Finding: The assimilation report's canonical evidence map omitted the
  Business Glossary, and first authoritative uses of key canonical concepts did
  not link to their TERM entries.
- Resolution: The evidence map now links GOV-GLOSSARY-001, and first
  authoritative uses of Goods Receipt, Inventory Unit, Coil, Unfulfilled
  Demand, and Genealogy link to TERM-019, TERM-007, TERM-008, TERM-005, and
  TERM-015 respectively without repeated overlinking.
- Evidence: ASM-REPORT-001 version 0.2.1 and GOV-GLOSSARY-001 version 0.2.1.

## FIND-020 — Temporary workshop identities authorized to continue Phase 02

- Severity: high
- Gate: Phase 02 entry
- Status: accepted
- Finding: OQ-019 blocked Phase 02 entry because no real named workshop
  participants existed. Waiting for those names would halt all remaining
  architecture work.
- Treatment: The Project Owner authorized filling every required role with a
  clearly flagged `(temporary)` identity so Phase 02 design drafting may
  continue. Temporary identities confer no approval authority, do not execute
  the workshop, and do not close OQ-019.
- Evidence: DOM-ROSTER-001 version 0.2.0; ASM-013; OQ-019 status `treating`
- Residual: Real names remain required before workshop execution and
  owner-signed decisions. Phase 02 design drafting has entered under that
  residual.

## FIND-021 — Phase 02 used concepts without canonical IDs

- Severity: medium
- Gate: Phase 02
- Status: resolved
- Finding: The first Phase 02 drafts used Quotation, Supplier, PurchaseOrder,
  GoodsReceipt as an entity, Package, Payment, GenealogyLink, Inquiry as an
  entity, and Material Allocation as ownership concepts without TERM-* or
  ENT-* IDs, and the coverage policy said Phase 02 assigns requirement IDs.
- Resolution: GOV-GLOSSARY-001 version 0.3.0 adds TERM-020 through TERM-025.
  GOV-DATA-DICT-001 version 0.3.0 adds the matching conceptual entities.
  Detailed REQ-* decomposition is not invented before workshop evidence;
  REQ-OBJ-001 through REQ-OBJ-005 now link Phase 02 design artifacts and the
  proposed BR-001 through BR-020 catalogue.
- Evidence: GOV-GLOSSARY-001 v0.3.0; GOV-DATA-DICT-001 v0.3.0; GOV-TRACE-001
  v0.3.0; DOM-MVP-RULES-001.
- Residual: Workshop may keep, rename, or replace the promoted concepts.
  Canonical INV-* / detailed REQ-* rows remain Phase 03+ work.

## FIND-022 — Phase 02 design-gate vs residual OQ blocking scopes

- Severity: high
- Gate: Phase 02
- Status: resolved
- Finding: OQ-001 through OQ-006, OQ-008, OQ-010, and OQ-013 still named
  Phase 02 as a blocking scope after the drafts claimed a design-gate could
  proceed. Leaving those scopes unchanged would make an honest Phase 02 exit
  impossible without silently answering the questions.
- Resolution: ASM-014 records that the design-gate may complete when those
  questions are formally scoped out. Each listed OQ now blocks workshop-
  validated policy and its true downstream phase, not Phase 02 design
  drafting. OQ-010 is `treating` with Customer Portal ordering formally
  deferred from MVP. No question is answered or closed.
- Evidence: ASM-014; GOV-QUESTIONS-001 version 0.5.0; DOM-MVP-RULES-001.
- Residual: Workshop evidence and owner-signed policy remain required before
  numeric UOM, routing, QC, reservation, fulfillment, organization, or portal
  decisions. The Project Owner accepted ASM-014 by approving Phase 02 as
  APR-004.

## FIND-023 — Shipping lifecycle sub-concepts lack separate entity IDs

- Severity: medium
- Gate: Phase 02
- Status: accepted
- Finding: `BC-SHIPPING` lists Package, Shipment, ShipmentItem, Dispatch, and
  Delivery as write-owned concepts. Package and Shipment now have TERM/ENT
  IDs. ShipmentItem, Dispatch, and Delivery do not.
- Treatment: For this design-gate they remain Shipment lifecycle facts under
  TERM-017 / ENT-SHIPMENT. Phase 03 or Phase 04 may split them if workshop
  evidence requires separately identified records. This finding does not
  authorize those entities now.
- Evidence: DOM-CAP-BC-001; GOV-DATA-DICT-001 version 0.3.0.
- Residual: Do not invent ENT-SHIPMENT-ITEM, ENT-DISPATCH, or ENT-DELIVERY
  before workshop or Phase 03 need.

## Downstream suspect policy

When an approved upstream artifact changes materially, add a finding identifying
all potentially affected downstream artifacts. Clear `suspect` only after
documented impact review.
