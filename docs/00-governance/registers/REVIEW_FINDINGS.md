---
id: GOV-FINDINGS-001
title: Review Findings Register
phase: 00-governance
status: in_review
version: 0.18.0
owners: [independent-reviewer, chief-solution-architect]
depends_on: [GOV-GATES-001]
last_reviewed: 2026-09-07
approval: APR-011
supersedes: null
---

# Review Findings Register

Findings are append-only and may be `open`, `accepted`, `resolved`, `rejected`,
or `superseded`. Resolution requires evidence and affected-artifact references.

APR-002 approved this register's Phase 00 seed version. APR-003 approved the
Phase 01 review evidence. APR-004 approved FIND-020 through FIND-023. The
current version is approved as APR-005 because Phase 03 added FIND-024 through
FIND-028. Every finding retains its recorded status and downstream effect;
artifact approval does not close open findings or their linked questions.

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
  before workshop or later Phase 04 need. Phase 03 used SM-SHIPMENT states
  (`DISPATCHED`, `PARTIALLY_DELIVERED`, `DELIVERED`) and did not mint those
  entities.

## FIND-024 — Sales Order and issue paths implied production on every fulfillment

- Severity: high
- Gate: Phase 03
- Status: resolved
- Finding: The first Phase 03 drafts listed Sales Order happy path as always
  passing `IN_PRODUCTION`, and Inventory Unit issue as only `RESERVED →
  ISSUED_TO_PRODUCTION`. Phase 02 already has STOCK and PURCHASE fulfillment
  and Material Allocation distinct from Reservation (INV-003).
- Resolution: STOCK/PURCHASE may fulfill from `CONFIRMED` without
  `IN_PRODUCTION`. MAKE may issue an AVAILABLE unit after
  SM-MATERIAL-ALLOCATION is `ISSUED`.
- Evidence: SM-CATALOGUE-001 v0.3.0; SM-TRANS-001 v0.3.0; SM-SIDE-001 v0.3.0;
  SM-EXC-001 v0.2.0.

## FIND-025 — Shipment-without-demand was bound to OQ-005

- Severity: medium
- Gate: Phase 03
- Status: resolved
- Finding: DraftShipment used `open: OQ-005` for exceptional shipment
  authority. OQ-005 is Quality plans and releasers, not commercial shipment
  without demand.
- Resolution: INV-011 remains the rule. The named person is OQ-019. QC
  releasers stay OQ-005. No person is invented.
- Evidence: SM-INV-001 v0.2.0; SM-TRANS-001 v0.3.0; SM-EXC-001 v0.2.0.

## FIND-026 — Inquiry and Quotation expiry have no owning OQ

- Severity: medium
- Gate: Phase 03
- Status: accepted
- Finding: ExpireInquiry and ExpireQuotation need a day count the registers
  do not own. Inventing OQ-020 would expand the team pack without workshop
  evidence that expiry is a signed policy.
- Treatment: Both commands stay `open: workshop-commercial-practice`.
  `GUARD_OPEN_POLICY` may cite that token. No day count is invented. This is
  not a Phase 03 design-gate blocker under ASM-016.
- Owner: Sales owner; workshop commercial practice
- Required correction now: none.

## FIND-027 — Production Order PAUSED had no resume transition

- Severity: medium
- Gate: Phase 03
- Status: resolved
- Finding: SM-PRODUCTION-ORDER listed `PAUSED` with no return path.
- Resolution: `ResumeProductionOrder` returns to the prior live state. A QC
  hold still blocks resume. Pause does not post stock.
- Evidence: SM-CATALOGUE-001 v0.3.0; SM-TRANS-001 v0.3.0.

## FIND-028 — Phase 03 seed required REQ-* and TEST-* on every transition

- Severity: medium
- Gate: Phase 03
- Status: accepted
- Finding: GOV-STATES-001 still says each transition must link requirements
  and tests. FIND-021 forbids a false-precision REQ-* catalogue before
  workshop evidence. TEST-* belongs to Phase 07.
- Treatment: Phase 03 transitions link `INV-*` and `REQ-OBJ-*`. Detailed
  `REQ-*` and `TEST-*` IDs are not minted. The seed completion sentence is
  a later-phase obligation, not a silent close of FIND-021.
- Owner: Requirements owner and QA architect
- Required correction now: none.

## FIND-029 — Phase 04 physical contract vs logical design-gate

- Severity: high
- Gate: Phase 04
- Status: resolved
- Finding: The Phase 04 contract includes physical schema, types, indexes,
  volumes, and an inventory-posting ADR. Those cannot be written without
  OQ-001, OQ-002, OQ-014, OQ-017, and OQ-018. Stopping all architecture
  work until those answers arrive would halt Phase 04. Writing guessed
  types would silently close the questions.
- Treatment: ASM-017 records that a **logical** design-gate may complete
  with those items as explicit open extensions. No executable schema is
  written. Idempotency acceptance is a command store, not a new ENT-*.
- Residual: The Project Owner accepted ASM-017 by approving Phase 04 as
  APR-006. Physical design and the OQ-017 ADR remain later work.
- Evidence: DATA-LOGICAL-001; DATA-ATTR-001; DATA-POST-001; DATA-ENF-001;
  DATA-CUTOVER-001.

## FIND-030 — Phase 05 structure vs transport/package freeze

- Severity: high
- Gate: Phase 05
- Status: resolved
- Finding: The Phase 05 contract includes API contracts, background
  work, and real-time behavior. Those cannot be frozen as HTTP, OpenAPI,
  NestJS, Prisma, Outbox, or Socket.IO without OQ-018 (and UOM types
  without OQ-001 / OQ-002). Stopping all architecture work until those
  answers arrive would halt Phase 05. Writing guessed packages would
  silently close the questions.
- Treatment: ASM-018 records that a **structure** design-gate may
  complete with those items as explicit open extensions. No controller,
  OpenAPI file, or package is written.
- Residual: The Project Owner accepted ASM-018 by approving Phase 05 as
  APR-007. Platform ADRs remain later work.
- Evidence: APP-CMD-001; APP-QRY-001; APP-MOD-001; APP-ORCH-001;
  APP-ENV-001; APP-BG-001.

## FIND-031 — Phase 03 Git freeze existed while the register said pending

- Severity: medium
- Gate: Phase 03 register hygiene
- Status: resolved
- Finding: APR-005 was approved at `2026-09-06T01:18:00+03:30`. Git
  already contained `bef6b6464baaf62ac8d3db9f9b7fa835ad04ec6c`
  (`docs:approve phase 03 state machine invariants`,
  `2026-09-06T01:27:49+03:30`). Later dashboards, APR residuals, and
  `README.md` still said the Phase 03 Git checkpoint was pending.
  CHK-0004 and CHK-0005 were assigned before this freeze was recorded.
- Treatment: CHK-0006 records that existing commit. No second Phase 03
  checkpoint commit is created. The APR-005 marker generator must not be
  run again.
- Residual: CHK IDs remain in assignment order, not Git order.
- Evidence: `bef6b6464baaf62ac8d3db9f9b7fa835ad04ec6c`; CHK-0006;
  APR-005.

## FIND-032 — Phase 06 structure vs identity-product freeze

- Severity: high
- Gate: Phase 06
- Status: resolved
- Finding: The Phase 06 contract includes identity, session, MFA, and
  named SoD people. Those cannot be frozen as JWT, Keycloak, or named
  holders without OQ-018 and OQ-019. Stopping all architecture work
  until those answers arrive would halt Phase 06. Writing guessed
  packages or names would silently close the questions.
- Treatment: ASM-019 records that a **structure** design-gate may
  complete with those items as explicit open extensions. No identity
  middleware or package is written.
- Residual: The Project Owner accepted ASM-019 by approving Phase 06 as
  APR-008. Identity-product ADRs remain later work.
- Evidence: SEC-THREAT-001; SEC-RBAC-001; SEC-ISO-001; SEC-ID-001;
  SEC-AUD-001; SEC-VER-001.

## FIND-033 — Phase 07 structure vs runner/oracle/named-tester freeze

- Severity: high
- Gate: Phase 07
- Status: resolved
- Finding: The Phase 07 contract includes verification strategy,
  environments, UAT, and quality gates. Those cannot be frozen as Jest,
  Playwright, k6, GitHub Actions, a decimal oracle, volume targets,
  RPO/RTO minutes, or named testers without OQ-018, OQ-001 / OQ-002,
  OQ-014, OQ-016, and OQ-019. Stopping all architecture work until those
  answers arrive would halt Phase 07. Writing guessed packages, numbers,
  or names would silently close the questions.
- Treatment: ASM-020 records that a **structure** design-gate may
  complete with those items as explicit open extensions. No test code,
  runner, or CI is written.
- Residual: The Project Owner accepted ASM-020 by approving Phase 07 as
  APR-009. Test-runner ADRs remain later work.
- Evidence: QA-STRAT-001; QA-TRACE-001; QA-SCN-001; QA-PROP-001;
  QA-NFR-001; QA-GATE-001.

## FIND-034 — Phase 08 structure vs integration/deployment-product freeze

- Severity: high
- Gate: Phase 08
- Status: resolved
- Finding: The Phase 08 contract includes adapters, topology,
  observability, backup/recovery, and runbooks. Those cannot be frozen
  as a weighbridge protocol, accounting product, Docker, cloud,
  observability stack, backup vendor, or RPO/RTO minutes without
  OQ-011, OQ-012, OQ-016, and OQ-018. Stopping all architecture work
  until those answers arrive would halt Phase 08. Writing guessed
  products or minutes would silently close the questions.
- Treatment: ASM-021 records that a **structure** design-gate may
  complete with those items as explicit open extensions. No adapter
  code, Dockerfile, or deployment manifest is written.
- Residual: The Project Owner accepted ASM-021 by approving Phase 08 as
  APR-010. Hosting and adapter-protocol ADRs remain later work.
- Evidence: INT-CAT-001; INT-EXT-001; DEP-TOPO-001; DEP-OBS-001;
  DEP-DR-001; DEP-RUN-001.

## FIND-035 — Phase 09 structure vs package-manager and CI freeze

- Severity: high
- Gate: Phase 09
- Status: resolved
- Finding: The Phase 09 contract includes repository layout, dependency
  rules, branching, documentation ownership, and conformance checks.
  Those cannot be frozen as npm/pnpm, GitHub/GitLab, GitHub Actions, or
  named maintainers without OQ-018 and OQ-019. Stopping all architecture
  work until those answers arrive would halt Phase 09. Writing guessed
  tools or names would silently close the questions.
- Treatment: ASM-022 records that a **structure** design-gate may
  complete with those items as explicit open extensions. No
  `package.json`, application folder, or CI workflow is written.
- Residual: The Project Owner accepted ASM-022 by approving Phase 09 as
  APR-011. Package-manager and CI ADRs remain later work.
- Evidence: REPO-LAY-001; REPO-DEP-001; REPO-BR-001; REPO-DOC-001;
  REPO-GEN-001; REPO-CONF-001.

## FIND-036 — Phase 10 structure vs agent-tool and named-approver freeze

- Severity: high
- Gate: Phase 10
- Status: resolved
- Finding: The Phase 10 contract includes agent authority, rules,
  prompts, review, tools/MCP/hooks, and generated-code acceptance.
  Those cannot be frozen as extra MCP products or named agent
  approvers without OQ-018 and OQ-019. Stopping all architecture work
  until those answers arrive would halt Phase 10. Writing guessed tools
  or names would silently close the questions.
- Treatment: ASM-023 records that a **structure** design-gate may
  complete with those items as explicit open extensions. No application
  source, unlock file, or extra MCP install is written.
- Residual: The Project Owner accepted ASM-023 by approving Phase 10 as
  APR-012. Extra-MCP and named-approver ADRs remain later work.
- Evidence: AI-AUTH-001; AI-RULE-001; AI-PROMPT-001; AI-REVIEW-001;
  AI-TOOL-001; AI-ACCEPT-001.

## FIND-037 — Phase 11 structure vs closing open questions and proving by code

- Severity: high
- Gate: Phase 11
- Status: resolved
- Finding: The Phase 11 contract includes integrated review,
  traceability coverage, walkthroughs, contradiction analysis, and
  risk/operability review. Those cannot freeze unanswered workshop
  policy, mint a `TEST-*` catalogue, name UAT people, or write
  application code to prove the design. Stopping all architecture work
  until those answers arrive would halt Phase 11. Inventing answers or
  tests would silently close the questions.
- Treatment: ASM-024 records that a **structure** design-gate may
  complete with those items as explicit open extensions. No application
  source, unlock file, or `TEST-*` catalogue is written.
- Residual: The Project Owner accepted ASM-024 by approving Phase 11 as
  APR-013. `TEST-*`, named UAT, extra MCP, and unlock remain later work.
- Evidence: VAL-INT-001; VAL-TRACE-001; VAL-WALK-001; VAL-XDOM-001;
  VAL-RISK-001; VAL-CORR-001; VAL-SELF-CHECK-001; VAL-INDEP-REVIEW-001;
  VAL-RECON-001; VAL-GATE-CHECKLIST-001.

## FIND-038 — Phase 12 planning vs unlock, tests, and application source

- Severity: high
- Gate: Phase 12
- Status: treating
- Finding: The Phase 12 contract includes a readiness checklist,
  roadmap/slices, work items, spikes, cutover/training plans, and a
  final implementation-authorization record. Those cannot freeze
  unanswered workshop policy, mint a `TEST-*` catalogue, name people,
  create `.cursor/IMPLEMENTATION_UNLOCK.json`, or write application
  source. Stopping all planning until those answers arrive would halt
  Phase 12. Inventing unlock paths, tests, or packages would silently
  close the questions and the implementation lock.
- Treatment: ASM-025 records that a **structure** planning-gate may
  complete with those items as explicit open extensions. No application
  source, unlock file, or `TEST-*` catalogue is written. Phase 12
  approval is not an implementation unlock.
- Residual: The Project Owner must accept or reject ASM-025 at the
  Phase 12 gate. Rejecting ASM-025 returns that gate to `BLOCKED`.
- Evidence: PLAN-READY-001; PLAN-SLICE-001; PLAN-WI-001; PLAN-SPIKE-001;
  PLAN-CUTOVER-001; PLAN-AUTH-001.

## Downstream suspect policy

When an approved upstream artifact changes materially, add a finding identifying
all potentially affected downstream artifacts. Clear `suspect` only after
documented impact review.
