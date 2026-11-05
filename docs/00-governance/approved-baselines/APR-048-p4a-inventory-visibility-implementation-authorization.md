---
id: APR-048
title: Owner D1-D4 decisions and bounded P4a Inventory visibility implementation authorization
phase: 12-implementation-planning
status: approved
version: 1.0.0
owners: [project-sponsor]
depends_on: [APR-047, PLAN-P4A-READS-001, PLAN-P4A-SOURCES-001, PLAN-P4A-DECISIONS-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-11-05
approval: Actual Owner P4a formal D1-D4 decisions and implementation authorization directive attached in this chat
---

# Actual P4a implementation authority — not product acceptance

Source: actual Project Owner **OWNER DIRECTIVE — P4a INVENTORY VISIBILITY — Formal
D1–D4 Decisions, Implementation Authorization, Verification and Independent Review**,
attached in this chat2026-11-05. This records the human decision, not an agent
approval or product acceptance. Verified APR-000throughAPR-047 are unique and
contiguous; APR-048 is the next identifier.

Verified baseline: `main`, `12e4ea8b60aed301b86bb15985da4a3423968789`, the reported
design revision; parents `7c5105ee7e0b6d06d3fa56e0e41ac1341d95c2a3` then accepted P2
`f6ef316c711474775b158e8d12fea4a885f2f368` under [APR-047](APR-047-p2-owner-acceptance-software-first-roadmap.md).
Three design files are present and unchanged. P1/I2/thirteen backend acceptances
and P2 historical257UNKNOWN/nonblocking residual remain intact.
Pre-existing modified AGENTS.md, untracked `.agents/skills/ui-ux-pro-max/` and
`skills-lock.json` must be preserved and excluded from P4a staging/commits.

## Approved design and exact Owner decisions

The [read contracts](../../12-implementation-planning/P4A_INVENTORY_READ_CONTRACT_DESIGN.md),
[source/state matrix](../../12-implementation-planning/P4A_INVENTORY_SOURCE_AND_STATE_MATRIX.md)
and [decision package](../../12-implementation-planning/P4A_IMPLEMENTATION_AUTHORIZATION_DECISIONS.md)
at12e4ea8 are approved, amended only by the actual directive:

- **D1 APPROVED:** personal current organizational ACT-WH only, trusted installation
  and authority; Inventory-only whitelist across LEGACY_RECEIPT, I2_RECEIVING
  (ORDER_LINE/ORDER_ONLY/UNLINKED), PRODUCTION (FINAL/WIP/RESIDUAL), including
  allocated/reserved/packed/issued stock. Five current states AVAILABLE, RESERVED,
  PACKED, ISSUED_TO_PRODUCTION, PARTIALLY_CONSUMED; canonical Unit/Lot additionally
  zero-stock historical CONSUMED/SHIPPED. Keep customer isolation keys/relationships
  in storage/enforcement. No customer identity/scope, demand/reservation ownership,
  Sales/Procurement commercial documents, Production orders/operations/personnel/
  sources, Ledger/audit/outcomes/secrets or additional roles/shared/customer selector.
  Scope in SQL before filters/pagination/lookahead/aggregation/enrichment; same404
  for absent/denied/foreign/unsupported roots; fresh session/account/grant after
  snapshot connection release and before disclosure. Header only selects a verified
  grant. Review descriptive-field semantics; a genuine whitelist/non-disclosure
  conflict stops the affected part for Owner resolution, never silent redaction.
  Update canonical RBAC/isolation/query documentation for this exact exception.
- **D2 APPROVED:** canonical ExactKg decimal strings preserving all integer and
  legitimate fractional digits, including >2^53, without Number/rounding/truncation.
  Exact unreserved=onHand-reserved is not permission to sell/dispatch/consume.
  Source initial kg separate; preserve W1 per-Unit, W2/W3 consignment-only, no
  allocation; Persian string-safe grouping/digits. No posting/production precision
  or domain-wide quantity-policy migration.
- **D3 CONDITIONALLY APPROVED:** at most ONE additive index-only migration, only
  six exact candidates from the design: Unit scope+lot+unit, scope+state+unit,
  scope+kind+unit, scope+location+unit; legacy scope+internal_code(C)+unit; I2
  scope+internal_system_code(C)+unit. Retain only evidence-justified indexes after
  disposable-PG plans/filter/AND/negative/late-page/read and writer-cost measurements.
  Existing0001–0018 unchanged; no table/column/constraint/enum/backfill/writer changes.
  Other index/schema or materially different query strategy returns to Owner;
  no unbounded-scan/performance substitution.
- **D4 APPROVED:** exactly browser-only POST `/ui-api/inventory/v1/units/query`,
  `/ui-api/inventory/v1/units/detail`, `/ui-api/inventory/v1/lots/units/query`.
  Exact approved inputs/recursive whitelist/nulls/eight filters/errors/cursors/
  snapshots/freshness/security/quantity/resource semantics. Refresh reissues a read.
  Legacy keyed routes unchanged, no generic proxy or repurposed Sales availability,
  receiving readback or Production documentary ports.

## Mandatory bounds, interface and evidence

Short Inventory-owned REPEATABLE READ READ ONLY snapshot across Unit/origin/Ledger/
Balance/claim/issue; Ledger truth, verified Balance and exact lifecycle/active-link
table. Original issue kg differs from current remainder. No per-row IPS snapshot,
FOR UPDATE/advisory writer locks, repair/rebuild/stock side effects.

Default25/max50; original cursor TTL600s; body8KiB/depth4; response128KiB;
<=51candidates, <=10000Ledger rows, <=4Inventory data statements;16active reads;
lock1s/statement4s/full handler8s/browser15s. No partial/truncated success. A single
hot Unit exceeding10000Ledger rows fails explicitly; narrower filters cannot solve
its history overflow. MAC never authorizes; each page independently reauthorizes
and has its own snapshot. Sanitized logs contain no codes/cursors/private rows.

Use mandatory installed ui-ux-pro-max with accepted native P1/P2 shell, no generated
landing-page/framework/font/dependency/sorting/export/cache adoption. WH navigation
→list→filters/pages→Unit→Lot→refresh/back; Persian RTL, clear exact state/quantity/
provenance/freshness, dense accessible tables, keyboard/focus/mixed-direction IDs,
all loading/empty/validation/cursor/unavailable/session states. Session epochs AND
Inventory view/request generations; abort alone insufficient. Preserve P1/P2
pending recovery, clear private state on actor/role/session loss, no Inventory
rows/filters/cursors/tokens in storage or URLs. Skill cannot override ERP authority.

Require frozen Windows static/unit/component/regression, real isolated PG all3origins/
7states, scope/role negatives, exact quantities/links/corruption, concurrent writers,
post-release revocation/resource/no-read-mutation proof; actual composed Chromium
full Persian journey/keyboard/fault/CSRF/Host/XSS/session/actor/delayed responses and
P1/P2 recovery. No mocked substitute; local evidence distinct from hosted CI.

Performance: synthetic100000Units/all families/states/isolation distractors/skewed
histories/hot Unit overflow; safe EXPLAIN(ANALYZE,BUFFERS), cold/warm/exact/AND/
negative/late-page/pool/index/write-cost evidence. >=200requests after warmup,
10readers+2writers, warm p95<=1s/p99<=2s, handler<=8s, no read Inventory writer locks
or attributable writer waits, writer p95 regression<=10% against comparable baseline.
Record hardware/version/distribution/method/sample counts/results; never invent
PASS or silently relax thresholds. Broader remediation returns to Owner.

Independent non-author engineering/security/database/QA-UI reviewers inspect code,
contracts and actual evidence, rank findings, close blockers/required/high/critical
defects, retest and confirm fixes. No unavailable proof counted as PASS.

## Sequence, exclusions and handoff

Record authority and baseline first, then owner reads/justified indexes, native
WH UI, full verification, independent review/remediation, canonical delivered-
behavior/evidence documentation and coherent explicit-path local commits. Minimal
canonical gate/local scope reconciliation records this grant; no OS containment or
hook revival. No further preliminary approval needed inside this exact scope.

No Inventory writes/adjust/rebuild, reservation/release/expiry, shipping/dispatch/
production execution, Sales/Finance, extra-role/customer/portal access, customer
selector/admin, analytics/general history/export, QC/returns/scrapping/new masters,
hardware/framework/dependency/platform, factory provisioning/UAT/pilot/deployment,
P4b–P5, remote push or history rewrite. Preserve P3 operational prerequisites.

P4a is AUTHORIZED FOR BOUNDED IMPLEMENTATION, NOT ACCEPTED. No new Owner product
acceptance record. Final implemented/independently verified status requires all
proof/reviews; otherwise report precise blocker/remediation. Stop for explicit
Owner acceptance of exact product revision and Owner push.
