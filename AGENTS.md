# Repository instructions for Codex

## Current operating decision (2026-10-04)

`AUTONOMOUS PRE-IMPLEMENTATION GOVERNANCE ACTIVE` describes delegated authority.
Master objective: Bring the ERP/MES repository to fully governed, independently
reviewed and technically frozen PRE-IMPLEMENTATION readiness without beginning
ERP implementation.

Use normal Codex workspace-write and supported approval review. Codex is a
trusted engineering agent. The native/OS containment experiment is retired;
its historical evidence is not an operating prerequisite. Do not revive its
installers, ACL, ProgramData, task, pipe, process or reparse attack mechanisms.
The Owner retired the legacy PreToolUse registration in `.codex/hooks.json`;
after restart, repository search was verified on 2026-10-04. No replacement
micro-allowlist is required. Honor any actual native tool denial without bypass.
See docs/10-ai-cursor-development/TRUSTED_AGENT_OPERATING_MODEL.md.

After the live readiness document reaches READY FOR HUMAN IMPLEMENTATION
AUTHORIZATION, preserve that reviewed package and stop for the final Owner
decision. No package, source, migration, CI or business implementation may start
without the valid human gate/unlock/baseline. Do not invent new OS or future-slice
readiness blockers or silently change the frozen design.

## Master objective and current Project Owner authority

The Project Owner's 2026-10-03 autonomous PRE-IMPLEMENTATION mandate supersedes
bootstrap-era routine path/tool/read/research/diagnostic/subagent approvals.
Codex administers all remaining pre-implementation governance, architecture,
technical planning, Tier-1 hooks/configuration, tooling, tests and independent
reviews. Repair legitimate Tier-1 failures autonomously within effective
technical permissions. Do not request individual file/tool allowances.

Continue until PRE-IMPLEMENTATION READINESS is READY FOR HUMAN IMPLEMENTATION
AUTHORIZATION, with no implementation-start blockers and no ERP implementation
started. Persist progress, review evidence and unresolved work in governance
documents. Use independent Governance, Architecture, Idempotency, Security,
Tooling, Repository consistency, Red Team and final readiness reviewers.

Human-only: implementation authorization, final unlock, human approval evidence
and approval of the final implementation baseline. Never manufacture approval
or change implementationAuthorized to true. Tier-1 maintenance is delegated.
The implementation lock is a governance obligation, not proof of OS containment.
Final implementation authorization is a separate human operation after readiness.

This is the Foolad Navardkaran ERP/MES architecture repository. ERP implementation is locked. Read [README.md](README.md), [CURRENT_PHASE.md](docs/00-governance/CURRENT_PHASE.md), and the live [decision](docs/00-governance/registers/DECISIONS.md) and [question](docs/00-governance/registers/OPEN_QUESTIONS.md) registers before changing the design.

- `.cursor/architecture-gate.json` is the single canonical implementation authorization source. ERP implementation requires **both** its top-level `implementationAuthorized=true` with an approved baseline **and** a matching valid, human-created `.cursor/IMPLEMENTATION_UNLOCK.json`. Neither exists now. Stop when a path, command, or task exceeds the exact grant.
- Agents never create, modify, synthesize, or self-authorize the gate, implementation unlock, or human-created `.cursor/PHASE_CHECKPOINT_APPROVAL.json`. A proposal, chat answer, phase approval, or checkpoint is not an unlock. Follow [agent authority](docs/10-ai-cursor-development/AGENT_AUTHORITY.md) and [approval/checkpoint procedures](docs/00-governance/APPROVALS.md).
- Do not invent factory rules or close an unresolved OQ. The live question register controls status; team answers are evidence. Keep historical approvals distinct from current rules.
- Preserve the Modular Monolith module owners and transaction bundles. Do not make cross-module persistence writes. `ACT-IPS` alone writes inventory quantity; Inventory Ledger is movement truth, Balance is a rebuildable projection. Never edit Balance directly or allow negative inventory. See [module ownership](docs/02-domain-business-architecture/MODULE_OWNERSHIP_MATRIX.md) and [posting architecture](docs/04-database-architecture/POSTING_KERNEL.md).
- The `.cursor/` hook is legacy Cursor tooling. The Codex micro-governance registration is retired; no technical interception or malicious-agent containment is claimed. A native tool denial or missing implementation authorization stops the affected action.
# Current Project Owner decision (2026-10-04): trusted-agent engineering

This section supersedes historical native-autonomy instructions retained in archives.
The OS/native-containment experiment is abandoned. Do not repair/install its
installers, harden shared ancestors, build ProgramData enforcement anchors,
scheduled-task/pipe/kernel provenance or reparse attack infrastructure, or ask
the Owner to execute a native transition. Preserve historical evidence only.

Master objective: complete professional ERP PRE-IMPLEMENTATION engineering:
reconcile live registers and accepted architecture, decide generic durable
command idempotency, freeze foundation-only SLICE-ENVELOPE technical/physical
design and acceptance tests, build the ordered ERP capability backlog, and
perform independent domain, architecture, database, application-security and
readiness reviews. Do not create product code, packages, migrations or CI yet.

Codex is a trusted engineering agent that must obey governance. The canonical
gate remains implementationAuthorized=false and approvedBaseline=null. Never
self-authorize implementation, forge human approval, create the final unlock,
or treat repository trust/tool access as authorization. OS tamper-resistance
against a malicious agent is no longer a project objective or readiness blocker.
Keep Modular Monolith, PostgreSQL, ACT-IPS sole inventory writer, atomic
posting bundles and live OQ answers/statuses. Technical drafting/freezes use
delegated authority; do not label them human-approved baselines.

The obsolete legacy hook registration is now empty and repository search works
after restart. Honor any actual native denials; do not bypass them or restart
the native-containment project. Record review evidence honestly.
See docs/10-ai-cursor-development/TRUSTED_AGENT_OPERATING_MODEL.md.

---
