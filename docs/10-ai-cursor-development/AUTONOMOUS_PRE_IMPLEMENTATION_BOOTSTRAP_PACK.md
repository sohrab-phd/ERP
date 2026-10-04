---
id: AI-AUTONOMY-BOOTSTRAP-001
title: Autonomous Pre-Implementation Bootstrap Pack
phase: 12-implementation-planning
status: in_review
version: 0.1.0
owners: [chief-solution-architect, project-sponsor]
depends_on: [AI-AUTH-001, ADR-0009, ADR-0010, PLAN-READY-001]
last_reviewed: 2026-10-03
approval: null
supersedes: null
---

# AUTONOMOUS PRE-IMPLEMENTATION BOOTSTRAP PACK

One consolidated protected-control transition proposal. NOT APPLIED.
Implementation remains locked: `implementationAuthorized=false`,
`approvedBaseline=null`. No implementation unlock or human marker is authored
by Codex. This pack is not an implementation authorization.

**Installation verdict: HOLD pending proof of the external confinement
mechanism and executable payload validation.** The complete protected edit
inventory and candidate replacement bytes are below. The current hook denies
the diagnostics and documentation research needed to establish supported
runtime configuration. A permission contract is not proof of enforcement.
Do not install the permissive operational shell route with a repository-wide
writable sandbox. No READY or security PASS is claimed.

## Current evidence and unavoidable boundary

The Project Owner's 2026-10-03 mandate delegates pre-implementation control-plane
administration and supersedes earlier routine approval policies. It retains
human-only implementation authorization, final unlock, approved baseline
selection where required, and human approval provenance.

Observed in this run:

- Canonical gate read: false authorization, null baseline, protected Codex
  hook files, and a docs-only ordinary write scope.
- Explicit root-qualified literal reads of fifteen governance/control files
  work; root AGENTS, unlisted architecture sources, rg discovery and ordinary
  multi-path reads are denied by the current hook.
- Subagent spawning works. Independent agents' collaboration messaging is
  denied as `collaborationsend_message`. Goal creation is denied as
  `create_goal`; the master objective is preserved in repository Markdown.
- `git status --short`, `git diff`, `git diff --check`, `git diff --stat`,
  `git ls-files` and root directory listing work.
- The allowed legacy regression command reaches PowerShell and fails because
  script execution is disabled. No machine execution policy was changed.
- The openai-docs skill read and authoritative web research were denied by
  the hook. No current official runtime documentation was successfully read.
- Existing working-tree changes predate this run. Protected gate and legacy
  hook changes are human-origin working-tree state; Codex did not alter them.
- Production Cursor enforcement contains environment-based test authority
  overrides. The candidate adapter removes that production code path.
- Current evaluator subprocess timeout is ineffective while synchronous
  stream reads block first. The candidate uses one verifier with no evaluator
  subprocess, removing that failure path.

The current human-protected hook cannot be changed by Codex. Codex must not
escape the hook through a REPL, alternate Git content read, encoded command,
or privileged execution. The one consolidated human transition covers all
protected files, external permissions, trust, provenance and rollback.

## Root of trust and operational ownership

| Layer | Owner | Authority |
| --- | --- | --- |
| External runtime permission policy and launch/trust state | Human / trusted platform | Confines every local write and process; prevents alteration/replacement of Tier 0 and product roots |
| Canonical gate, unlock and human checkpoint marker | Human | Only canonical implementation authorization and protected human evidence |
| Mandatory Codex registration and boundary verifier | Human | Fixed authorization semantics and path boundary; cannot be removed by operational tooling |
| Cursor registration and adapter | Human | Legacy binding to the same verifier; not separate authorization |
| `tools/preimplementation/**` | Codex | Operational hook implementations, exact shell policy, test/review scripts, diagnostics, fixtures and reports |
| Ordinary documentation, root instructions, legacy rules/skills | Codex | Architecture/governance administration within the implementation lock |
| ERP application, domain/API/UI, business schema/migrations | No agent write while locked | Remain absent until a final human grant |

Operational hook code is maintained in the Tier-1 tree and executed only by
the confined tool executor. The mandatory host PreToolUse hook must never
source/import/launch mutable Tier-1 code: host hook execution may occur outside
the tool sandbox. Its registration is a Tier-0 dependency, not routine
operational policy. Protect the absolute executable, parent directories,
script, registration, runtime profile and host environment. No inherited
test-mode variables can grant authority.

OS/sandbox protection must block writes, ACL/owner changes, delete, rename,
replacement, junction and hard-link escapes. Denying a patch alone does not
confine a PowerShell/.NET child process. A same-user filesystem ACL without
protected ownership and ancestor controls is insufficient.

## Exact protected transition inventory

All four replacements must be reviewed and installed together:

1. `.cursor/architecture-gate.json`: retain false/null; add only non-product
   tooling scope, GCP delegation and human-only future baseline/unlock digest
   bindings. No root write wildcard and no business module scope.
2. `.codex/hooks/architecture-write-gate.ps1`: mandatory verifier below.
3. `.codex/hooks.json`: protected absolute Windows invocation below.
4. `.cursor/hooks/architecture-write-gate.ps1`: adapter below.

Preserve `.cursor/hooks.json` and its existing bindings. Both legacy event
names are handled by the adapter. Existing marker-generation and historical
test scripts remain protected but are removed from production authorization
logic. New tests live in Tier 1; the old synthetic helper's assertions do not
validate the new model.

If the spent APR-017 human marker still exists, the human installer backs it
up and retires only that marker. A different marker or unexpected unlock stops
the transition. Codex never performs this retirement.

The fifth protected action is the external runtime profile transition below.
The sixth is human trust of the fixed mandatory registration and verified
source. These are parts of this single bootstrap, not future read-path,
command, identifier or operational-hook approval requests.

## External runtime permission contract

The supplied environment currently declares a repository-wide writable root,
while separately protecting .codex and .git. Repository hook changes cannot
remove that runtime grant. Replace it through the platform's **supported
external permission mechanism** with the following exact effective rights.

This is a machine-readable contract, **not an asserted Codex configuration
schema**. No documented runtime mechanism for applying these granular rights
has yet been verified in this session. Resolving that support question is a
bootstrap blocker. If the platform cannot enforce it, use an independently
confined agent execution principal/OS boundary with equivalent rights before
activating Tier-1 script execution. Do not claim an equivalent boundary from
hook trust or an unverified ACL recipe.

[Historical code/configuration excerpt removed after retirement; no execution action remains.]

Read-only repository-root access must also prevent creation of new root
application directories and package files. Granting directory writes to
`tools/preimplementation` must not grant writes to its parent `tools`.
Readable protected files are not replaceable. Granting `.git` writes must not
grant worktree writes. Preserve platform-controlled tool/skill reads and
sandbox temporary storage. Any subprocess/tool that is outside this profile
is denied rather than granted unrestricted execution.

Writes inside allowed documentation/tooling directories remain governed
semantically: no disguised ERP implementation, fake approval or invented
business rule is permitted there. A filesystem control cannot identify every
possible program by business intent. Independent content review is required.

Writable .git is operational authority, not an immutable audit archive.
Configuration/hooks/refs can be altered by a confined process; the verifier
never invokes Git from its trusted host context. No push, rewrite, reset,
restore, clean, rebase or bypass is authorized. Record checkpoint receipts and
human bootstrap receipts outside the agent-writable tree. Do not claim local
Git alone is tamper-resistant.

## Current-source and replacement hash preconditions

Hashes below normalize CRLF to LF and terminal line endings to one LF. This
accounts for Get-Content's line-ending transport; they are not falsely labelled
raw file digests. The human installer independently captures **raw** before
hashes/bytes in protected external receipts and writes exact UTF-8 LF bytes.

| File | Current normalized SHA-256 | Candidate normalized SHA-256 |
| --- | --- | --- |
| `.cursor/architecture-gate.json` | `11045d62c88bc1454b7b7f2133dfa152043858024d2eb0a723955c168d5e2f83` | `6b50fdbe05f742a1bdc630396b04e6dfd456e75344dea9020b74e8d755748477` |
| `.codex/hooks/architecture-write-gate.ps1` | `cb4deb3f00326e07208e7d2d643bf5760c4712a95d464eb7b0e1eb999f74d14a` | `f46a266a8d4b70d1c11f75e6ce708ecb712bcb4fd99ae433356294dbaa864f3f` |
| `.codex/hooks.json` | `7fed200b96ca78c3127df6fc22494e3fd3afc1001995b5819b610bfef4b47f80` | `290be3d9fdc27cef8d94a19100b4fc193ef8b88cac165128514243d547b07fad` |
| `.cursor/hooks/architecture-write-gate.ps1` | `067c58adfdcbffd50b157c866136725a43eeee28e8716f7af0897def2e6e3db5` | `781f555960a8fe5771339928c18c4ea23519223921b7cd5bbc32b43c7a3fbbbb` |

Any source mismatch stops installation before protected files are written.
Do not reuse the earlier bootstrap document's stale raw hash preconditions.

## Candidate replacement payloads

These are review artifacts, not active controls. Native PowerShell parse and
execution validation remains pending; the installer parses before writing.
Read payload text once, validate it, and install those validated bytes.

<!-- BOOTSTRAP-PAYLOAD:.cursor/architecture-gate.json -->
[Historical code/configuration excerpt removed after retirement; no execution action remains.]

<!-- BOOTSTRAP-PAYLOAD:.codex/hooks/architecture-write-gate.ps1 -->
[Historical code/configuration excerpt removed after retirement; no execution action remains.]

<!-- BOOTSTRAP-PAYLOAD:.codex/hooks.json -->
[Historical code/configuration excerpt removed after retirement; no execution action remains.]

<!-- BOOTSTRAP-PAYLOAD:.cursor/hooks/architecture-write-gate.ps1 -->
[Historical code/configuration excerpt removed after retirement; no execution action remains.]

## One consolidated human application sequence

Do not begin this sequence while installation HOLD remains unresolved.

1. Verify the supported external confinement mechanism against the contract;
   apply it with Codex idle, including trusted host/ancestor protections.
   Keep the human administrative session outside agent control. No credentials
   are written to repository or chat.
2. In that same human session, extract the installer below into human-controlled
   temporary storage and run it using the absolute Windows PowerShell executable
   with `-NoProfile -ExecutionPolicy Bypass -File <installer>`. Bypass is
   process-local; do not change the machine execution policy.
3. Inspect the protected external receipt. No implementation authority changes.
   Trust/reload the fixed mandatory hook definition using the supported Codex
   hooks interface. Check its source and raw hash against the installed receipt.
   Registration trust does not establish script-byte or runtime confinement.
4. Restart the repository session under the confined profile. Codex performs
   the complete acceptance suite below and all independent review loops.
   Operational scripts, exact commands and collaboration lifecycle support
   require no further protected edits.
5. Retain human raw-byte backup/receipts. Include the bootstrap control changes
   in a human local checkpoint or an explicitly human-approved control-artifact
   manifest. Ordinary Codex GCP commits may not silently approve/stage preexisting
   protected human changes.

There is no proposed command for modifying an undocumented platform
configuration file. The exact support/UI/CLI steps for step 1 and trust step 3
are still unverified and must be established before installation approval.
This is the remaining genuine human/runtime boundary, not a request for
another individual repository read allowance.

## Human-only installer candidate

Codex does not run this code. It writes protected files and retires a spent
human marker only when deliberately executed by the human as part of the pack.
It grants no OS/runtime permission to the agent and does not claim installation
alone establishes autonomy.

[Historical code/configuration excerpt removed after retirement; no execution action remains.]

## Complete autonomous post-bootstrap work scope

Codex creates `tools/preimplementation/operations.json` with version 1 and an
array of exact shell command strings. It maintains the fixed dispatcher
`tools/preimplementation/governance.ps1`, diagnostic/test/review helpers and
all needed exact command entries. The immutable verifier admits one literal
command AST only; no chaining, pipeline, redirection, interpolation or shell
substitution. Mutable script contents remain confined externally.

The first runner invocation is fixed:
`powershell.exe -NoProfile -ExecutionPolicy Bypass -File "tools/preimplementation/governance.ps1"`.
Pin/verify executable resolution through the runtime; the host verifier itself
uses an absolute Windows executable. Deterministic temporary installs and
runtime version research are non-product tooling, not first-slice implementation.

All six collaboration lifecycle tools are classified together; punctuation
normalization handles their observed hook identifiers. Goal creation/update,
pure discovery and web research are admitted. Repository reads/search cover the
whole repository rather than individually approved documents. Arbitrary REPL
and external mutation tools remain outside the required workflow. Shell
polling accepts only empty input or Ctrl-C while locked; interactive injection
and reuse after an authorization change are denied.

Supported skill/reference reads outside the repository must use pure read
tools, or exact externally confined diagnostic commands added to the Tier-1
policy; the operational workflow must not require a new protected edit for a
skill path. The candidate direct Get-Content route currently bounds targets to
the repository, so external-reference commands should use a distinct exact
tooling runner entry rather than weakening Tier 0.

Codex records material technical decisions under delegated technical authority.
Required human material ADR approvals remain proposed and go into the final
consolidated implementation authorization package. No human approval is forged.

Autonomous ordinary governance checkpoints use `GCP-*` evidence with exact
artifact paths, raw SHA-256 and Git blob IDs, parent/commit, tests, review limits
and declared author. They are agent records, not APR/CHK human approvals.
Protected control changes are excluded unless covered by the human bootstrap
receipt and exact approved changed-file manifest. Existing human checkpoint
markers remain human-only; GCP does not create or relax their authority.

## Acceptance suite and stop conditions

Run the suite in isolated non-product fixtures first, then harmless live
probes through the actual tools. Never toggle the real gate, create the real
unlock, or write to a human marker for a denial test.

| Required test | Expected |
| --- | --- |
| Full repository literal reads, UTF-8 reads, searches and skill research | Allowed |
| All collaboration lifecycle operations; child inheritance | Allowed, same lock |
| Governance Markdown, Tier-1 policy/code/tests, safe diagnostics | Allowed |
| Process-local governance regression runner and meaningful tests | Allowed |
| Unknown tool, encoded/compound shell, pipeline, redirect, substitution | Denied |
| Gate/unlock/marker/mandatory registration/verifier patch | Denied before action |
| Direct native/.NET write access to Tier 0 through a confined subprocess | OS/runtime denied |
| Root directory/package/business-code/migration creation | Denied |
| Protected parent replacement, junction/symlink, ADS/reserved names, hard-link writes | Denied |
| Test-mode environment variables pretending authorization | Cannot authorize |
| Duplicate/case-colliding/wrong-type/malformed authority JSON | Denied |
| Mutable APR/GCP text pretending human implementation approval | Cannot authorize |
| Missing/hung/broken/untrusted mandatory hook | Cannot bypass external boundary |
| Escalated/unsandboxed command and alternate code-execution tool | Denied |
| Mutable package script changed after final human hash binding | Denied |
| Pending/historical business OQ silently closed | Governance check fails |
| Governance commit misrepresented as human baseline approval | Governance check fails |

Read-access `File.Open` probes may request write access to existing protected
files without writing bytes, in the confined executor; permission must be
denied independently of hook parsing. Controlled creation probes use disposable
non-product names and isolated fixtures, with documented cleanup. Confirm that
all supported local tool executors share the same external confinement.
Hook fail-open behavior must not be mistaken for an implementation grant.

If any protected target is writable or a subprocess escapes confinement, stop
operational execution, preserve evidence and keep implementation locked.
If the runtime cannot provide the boundary, this pack remains HOLD and the
repository cannot be READY. Do not issue a misleading bootstrap PASS.

## Rollback

A human stops Codex and restores the four raw-byte backups from the protected
receipt directory to their exact original targets. Restore the prior supported
runtime permission profile and prior trusted registration in the same session.
Preserve the receipt and spent-marker archive; do not reactivate an expired
marker. Confirm false/null and absent unlock before resuming. Do not use Git
reset/restore, history rewriting or a fabricated checkpoint marker.

## Review verdict and remaining work

Final safe-work verification (2026-10-03): the fresh documentation reviewer
identified two README contradictions; both were repaired and independently
verified. No further material contradiction was found in that targeted review.
All four installed protected sources still match their pre-work normalized
hashes. In-memory extraction verified each candidate payload digest against its
installer pin. Tracked `git diff --check` passes. These checks do not validate
new-file bytes, native PowerShell execution or runtime confinement. A supported
shell selection retry did not resolve the legacy test execution-policy failure.

Governance, security and tooling reviewers independently inspected the current
allowed sources. A fresh independent final reviewer assessed the proposed
architecture and rejected an installation/READY claim without supported
external confinement and payload/live validation. That verdict is retained.

Repairs incorporated in candidate payloads: immutable registration/verifier;
shared Cursor adapter; no production environment test override; no evaluator
subprocess deadlock; complete collaboration classification; exact mutable
operational policy; future human-bound baseline/unlock digests; duplicate JSON
field denial; exact future paths; frozen command artifact hashes.

Still pending: supported external profile application/protection proof,
host-environment hardening confirmation, executable payload tests, live bypass
tests and an independent payload review. No successful regression suite or
red-team PASS is claimed. These limitations are bootstrap blockers, not business
OQ answers.

After verified bootstrap, continue the recorded master objective through
Architecture, Idempotency, Security, Tooling, Governance, Repository Consistency,
Red-Team and fresh Final Independent Reviewer roles. Resolve generic accepted
and rejected replay, principal/scope isolation, durable rejection and crash
windows before freezing SLICE-ENVELOPE, tooling, layout, future writes, commands
and package scripts. Reclassify every residual A-F without invented closure.
Prepare the final human authorization package only after all A blockers clear.

Final authorization also changes the **external** write profile to the exact
first-slice paths; gate/unlock bytes alone do not make read-only application
roots writable. That belongs in H3, not routine bootstrap maintenance.

`PRE-IMPLEMENTATION READINESS: NOT READY — BOOTSTRAP BOUNDARY PENDING`

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
