---
id: AI-NATIVE-AUTONOMY-001
title: Native Codex Autonomy Transition Evidence
phase: 10-ai-cursor-development
status: in_review
version: 0.1.0
owners: [chief-solution-architect]
depends_on: [ADR-0010, AI-AUTH-001, PLAN-READY-001]
last_reviewed: 2026-10-03
approval: null
supersedes: null
---

# Native Codex autonomy transition

`AUTONOMOUS PRE-IMPLEMENTATION GOVERNANCE ACTIVE` is the accepted authority
mandate. Runtime transition installation is not verified.

Master objective: Bring the ERP/MES repository to fully governed, independently
reviewed and technically frozen PRE-IMPLEMENTATION readiness without beginning
ERP implementation.

The Project Owner explicitly selected native Windows Codex sandboxing,
workspace-write confinement, supported approval/reviewer policy and native
audit/logging as the primary operational security model. Use Auto-review where
supported. Do not configure deprecated approval_policy="untrusted", Full Access,
a custom shell broker, exact read/command/tool micro-allowlists, or a parallel
Windows sandbox. Codex owns .codex operational maintenance. The earlier
[broker candidate](FINAL_AUTONOMY_TRANSITION_PATCH.md) and
[bootstrap pack](AUTONOMOUS_PRE_IMPLEMENTATION_BOOTSTRAP_PACK.md) are retired
transition designs, not current installation instructions or executable grants.
Historical evidence is preserved.

## Observed runtime and actual denial evidence

The current session's supplied runtime configuration explicitly reports:
sandbox_mode=workspace-write, approvals_reviewer=auto_review, restricted network,
workspace D:\projects\NavardKaran\Design-ERP. Its effective permission profile
separately reports .codex, .agents, .git and .aws as read-only descendants.
This is session evidence, not inspection of installed TOML/schema or CLI version.
The installed native sandbox principals, persistent user/project configuration,
repository trust state and managed-policy provenance are not independently verified.

The installed Codex hook was read in full. It still delegates to the legacy
Cursor evaluator, enumerates exact readable paths and shell commands, and
blocks unclassified native tool identifiers. The canonical gate was read in
full: implementationAuthorized=false, approvedBaseline=null.

Fresh probes were denied before execution:
- codex --version; codex doctor;
- reading .codex/config.toml and the openai-docs skill;
- official-domain web research through web.run;
- changing the Tier-1 .codex hook, even a comment;
- reading transaction/idempotency, posting-kernel and module-ownership sources.

Independent Governance/Repository consistency, Security and Tooling/Red Team
reviewers confirmed these constraints and the enforcement problem below.
Spawning reviewers succeeds; communication/reporting tools remain partly denied.
No denial was bypassed and no protected edit was applied.

## Why a hook-only literal patch is insufficient

Workspace-write permits product writes inside the writable repository.
It does not distinguish architecture from ERP implementation. A command-text
hook cannot prove the transitive effects of arbitrary scripts, tests or native
executables. Protecting an evaluator in .cursor also does not enforce its use
if its sole registration can be removed from mutable .codex.

The required minimal guard therefore needs supported independent native
enforcement or mandatory host registration outside the Codex-managed control
plane. It must protect canonical authorization, final unlock, human approval
provenance and the product write boundary, including indirect shell effects.
An instruction, lexical command filter, editable APR text, post-write rollback
or local Git checkpoint is insufficient evidence of that technical protection.

The installed runtime's support for this mechanism is currently unknowable:
the actual protected bootstrap denies both diagnostics and official research.
No supported configuration key, CLI subcommand, mandatory-hook feature, ACL
principal or host permission operation is invented here. In particular, "codex
doctor" is requested by the Owner but its existence in this installation remains
unverified. There is no honestly certified FINAL NATIVE-AUTONOMY TRANSITION PATCH.

## One consolidated external runtime prerequisite

A host administrator/Project Owner must establish the native operating boundary
in the controlling runtime, rather than grant individual repository paths:

1. Make the installed version/help/schema, effective managed/user/project
   configuration, principals, trust and policy provenance inspectable.
2. Replace the obsolete protected bootstrap routing with normal native
   workspace-write and supported Auto-review handling for all Tier-1 work;
   remove .codex from project human-only protection.
3. Establish a supported independent Tier-0 effect boundary which remains
   effective when all Codex-managed hooks/configuration are changed or absent.
   Product write protection must follow the accepted slice/physical plan.
   Preserve false/null gate, absent final unlock and existing human evidence.
4. Verify normal reads/research/review coordination/diagnostics/governance tests,
   Tier-1 changes, and independent denial of authorization/product mutations.
   Preserve native audit evidence outside mutable project approval text.
   Restart only if required to load the verified runtime change.

This is one consolidated external runtime repair requirement. It is not another
read-path/tool permission list, final implementation approval, or a claim that
unspecified host changes are a ready-to-apply literal patch. No routine technical
decision is being returned to the Owner. Installed host capability and effective
independent protection are the missing facts; Codex can finish all remaining
Tier-1 configuration once they are accessible.

## Transition acceptance evidence

Verify native restrictions independently of editable .codex, using disposable
nonbusiness probe fixtures before claiming enforcement. Check canonical gate,
unlock and approval-evidence aliases; rename/deletion; ancestor replacement;
direct and indirect shell/script writes; reparse/hard-link/alternate-path
attempts; child agents; host failure/timeout behavior; changed hook registration;
package-script indirection; writes to product manifests, source, migrations,
tests and generated product artifacts. Never create a real unlock or alter the
actual gate to test denial. Synthetic authorization inputs must be confined to
tests and unavailable as production environment overrides.

Retire the legacy production ARCHITECTURE_GATE_TEST_* authorization overrides.
Editable approval-shaped Markdown is not independent human provenance.
Native logs and immutable human receipt must identify the actual installed
registration/enforcement, relevant version/configuration and test results.
A fixed file location alone does not prove protected registration or effective
tool interception.

## Autonomous continuation after verified transition

Reconcile full live sources and preserve OQ answers/statuses. Complete generic
idempotency and transaction/audit/crash semantics, material ADRs, current official
Node/TypeScript/tool research, minimal SLICE-ENVELOPE technical freeze, exact
physical tree/owners/config/tests/persistence/migrations, future writes/shell
commands/package scripts, governed checkpoints and independent red-team repair.
No product files, packages, migrations or application tests are created now.

Required roles: Governance; Architecture; Idempotency; Security; Tooling;
Repository consistency; Red Team; Final independent readiness reviewer.
Review and repair until stable. Current source-only reviews do not constitute
native enforcement tests or final readiness approval.

The independent final reviewer confirmed the external-runtime prerequisite.
Architecture and Idempotency reviewers produced material draft corrections;
these were incorporated in ADR-0011. A fresh independent conceptual recheck
found those issues resolved and no new material contradiction; acceptance,
live-source reconciliation, physical/technical freeze and PostgreSQL tests
remain pending. Fresh gate/evaluator/registration text readbacks were unchanged
and git diff --check passed. No commit, push or protected edit was performed.

Current readiness remains NOT READY. Implementation-start blockers remain
listed in IMPLEMENTATION_READINESS.md. The final human implementation package
comes only after their closure and independent verification; Codex never
executes its gate/unlock/approval transition.

# RETIRED — native-autonomy experiment abandoned (2026-10-04)

The Project Owner terminated this experiment. Its adversarial OS-containment
objective exceeded the ERP development workflow's needs. This file is an
in-place historical archive, not an installer or an approval request.

Do not run any command or payload from this file. The historical transition
request is withdrawn. All former READY instructions, commands and digests
below are historical and withdrawn. Historical evidence is retained for provenance only. No installer, ACL change, task or host control
is installed, repaired or authorized by this retirement.

Codex is a trusted engineering agent. implementationAuthorized=false;
approvedBaseline=null; final unlock absent. Complete ERP pre-implementation
design and useful independent reviews, then stop for explicit human implementation
authorization. Native containment is not an implementation-start prerequisite.

---
