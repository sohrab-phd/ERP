---
id: PLAN-HUMAN-PACKAGE-001
title: Consolidated final human implementation decision package
phase: 12-implementation-planning
status: in_review
version: 1.0.0
owners: [chief-solution-architect, project-sponsor]
depends_on: [ADR-0011, ADR-0012, ADR-0013, PLAN-READY-001, CONF-UNLOCK]
last_reviewed: 2026-10-04
approval: null
---

# Consolidated final human implementation decision package

Prepared for one Project Owner implementation decision after final independent
engineering review. It is a proposal, not an APR/CHK, human approval, unlock or
gate transition. No procedure below is executed by Codex. No native installer,
administrator/ACL change or replacement security mechanism is involved.

## Reviewable baseline and technical decisions

- Preserve ADR-0001/0006/0007: Node/TypeScript, Modular Monolith, PostgreSQL.
- [ADR-0011](../00-governance/adrs/ADR-0011-command-idempotency.md) is the delegated
  binding command/idempotency/transaction/audit decision, including rejected
  replay, principal/payload binding, crash/uncertainty and recovery.
- [ADR-0013](../00-governance/adrs/ADR-0013-slice-envelope-stack.md) is the delegated
  foundation stack/layout/scripts/test decision with current primary research.
- [Physical design](SLICE_ENVELOPE_PHYSICAL_DESIGN.md),
  [technical freeze](TECHNICAL_FREEZE.md), [backlog](IMPLEMENTATION_BACKLOG.md),
  [reconciliation](CANONICAL_RECONCILIATION.md), [validation](ENGINEERING_VALIDATION.md)
  and [final review](REVIEW_FINAL_READINESS.md) form the current engineering package.
- ENGINEERING_BASELINE_MANIFEST.json records exact working-file hashes against
  the existing Git HEAD. It is an agent engineering snapshot, not an approved
  baseline, receipt, immutable host anchor or authorization source.

Historical APR-014 structure/CHK-0013 and later tooling checkpoints do not approve
these current bytes. Review the manifest and current diff, then approve an actual
current baseline and governed checkpoint under APPROVALS. The existing dirty
protected/control changes are not silently staged or attributed to this program.
No push/history rewrite, no retrospective human receipt and no recursive checkpoint
recording are proposed. Human baseline metadata/commit is intentionally unfilled.

## First proposed implementation grant

SLICE-ENVELOPE only. Exact source write paths are the tree in
[physical design](SLICE_ENVELOPE_PHYSICAL_DESIGN.md#exact-future-source-tree--proposed-first-human-write-grant),
including its explicitly named generated outputs. No broad entire-repository grant.
Exact future shell strings are that document's 'Exact future shell scope'. Root
package script bodies are frozen in
[technical freeze](TECHNICAL_FREEZE.md#exact-future-root-scripts), including bounded
helper behavior and no workspace/lifecycle indirection. Approve these together,
not an npm script name with unconstrained changed body.

The grant permits a health-only host, transaction/outcome/audit foundation and
synthetic fixture tests. It does not permit business modules/posting, Ledger/
Balance, real customer commands, auth shortcuts, device/report/live/print workers,
production database provisioning/deployment or changes to .cursor/.codex/approval.
Local dev/test PostgreSQL provisioning is ordinary developer workflow documented
in the physical plan, not an OS-transition installer or production operation.

First-slice DoD and exact acceptance intents are normative in the physical design.
Tests/CI must actually pass during authorized implementation before slice acceptance;
pre-implementation design review does not replace that evidence.

## Human-only authorization procedure (not executed)

1. Accept the current technical ADR/design package and B-F residual classifications;
   approve the actual current baseline/manifest and local Git checkpoint using
   [APPROVALS](../00-governance/APPROVALS.md). Use actual human identity/timestamp,
   actual artifact hashes and actual recorded commit. Do not reuse a historical
   structure approval as approval of new package/script/migration paths.
2. Using the existing [unlock template](../00-governance/templates/IMPLEMENTATION_UNLOCK_TEMPLATE.md),
   personally create .cursor/IMPLEMENTATION_UNLOCK.json: version1,
   implementationAuthorized=true, actual approvedBy/approvedAt, approvedBaseline
   set to the actual new human-approved APR path with recorded checkpoint, and
   allowedWritePaths/allowedShellCommands copied exactly from the accepted frozen
   first-slice package. No placeholder identity/hash/baseline is valid.
3. Personally change only the canonical gate's implementationAuthorized to true
   and approvedBaseline to that exact same approved APR path. Retain canonical
   marker requirements and authority semantics; no agent activation.
4. Verify gate and human-created unlock match the reviewed baseline, exact paths,
   exact shell strings and script bodies before implementation begins. Partial or
   mismatched authorization remains locked; readiness alone never suffices.

Both conditions are required. Codex never creates/modifies the gate, unlock,
human checkpoint marker or approval evidence on the Owner's behalf. Tool access,
trusted-agent status and this package are not a second authorization mechanism.

## Stop conditions and residuals

Stop for missing/mismatched human grant, business scope expansion, altered scripts/
unreviewed dependency or schema, direct cross-owner write, fabricated principal/
approval, secrets, unexpected destructive action or missing slice-required policy.
Ordinary engineering inside an authorized slice remains autonomous.

B later slice: arithmetic, routing/disposition/mass balance, commercial/authority/
device/document specifics. C UAT: real scenarios/tickets/people/volumes. D Go-Live:
opening stock, hosting/backup retention/product and recovery rollout (recorded
RPO60min/RTO8h retained). E optional technical tooling/functions. F future QC,
portal ordering, legal GL, multisite/distributed infrastructure. Live OQ answers
and statuses remain unchanged; missing future policy remains GUARD_OPEN_POLICY.

Current state: implementationAuthorized=false; approvedBaseline=null;
final implementation unlock absent; ERP implementation has NOT begun.
