---
id: AI-CODEX-BOOTSTRAP-001
title: Proposed Codex Project-Control Bootstrap
phase: 10-ai-cursor-development
status: in_review
version: 0.1.0
owners: [chief-solution-architect, project-sponsor]
depends_on: [GOV-GATES-001, AI-AUTH-001, ADR-0009]
last_reviewed: 2026-10-02
approval: null
supersedes: null
---

# Proposed Codex Project-Control Bootstrap

> Historical ADR-0009 bootstrap. Its individually scoped read/tool additions
> and later operational-hook protection model are superseded as proposals by
> the Project Owner's 2026-10-03 autonomous pre-implementation mandate and the
> final native operating decision in [native transition evidence](NATIVE_AUTONOMY_TRANSITION.md).
> The later broker/bootstrap pack is also retired. Do not execute its installer.
> Historical human approval remains evidence. Current protected controls remain
> active until a valid human transition; neither document changes them. Do not
> request the obsolete incremental protected edits below.

This is a review package, not a gate change or implementation unlock.
`IMPLEMENTATION_AUTHORIZED` remains `false`. Codex must not use this document
as permission to edit protected controls or create paths that the current
gate excludes.

## Bootstrap execution update (2026-10-02)

The Project Owner explicitly accepted ADR-0009 option 2 and applied the four
numbered protected-control steps below. Codex verified the protected diff and
created the four exact bootstrap files. Direct synthetic evaluator tests pass;
final human protection of the Codex hook files is applied and verified; project/hook trust and live
interception probes remain pending. The pre-edit hashes and current-evidence
section below record the approved **before** state, not the present gate state.
ERP implementation remains locked.
## Historical pre-bootstrap evidence

- APR-016 checkpoint: `02163debe68f29800c6986015e81eea027547c60`.
- APR-017 follow-up checkpoint: `fc6b761a371f06491e4ea94df01af3fc380cb8a3`.
  Its completed marker is still human-owned and must be retired by the
  Project Owner. APR-017 explicitly needs no recursive CHK record.
- The canonical `.cursor/architecture-gate.json` has
  `implementationAuthorized: false`, `approvedBaseline: null`, and no
  implementation unlock exists.
- The locked write list excludes root `AGENTS.md` and `.codex/**`. The protected
  Cursor validator hardcodes that list. Neither a Markdown proposal nor a
  checkpoint marker changes it.
- Codex supports root `AGENTS.md` and project `PreToolUse` hooks, but the
  latter need separate human trust review. Cursor hook JSON/output cannot be
  bound to Codex unchanged. Codex hook errors and some tool paths may fail
  open; policy self-check and the execution sandbox remain necessary.

## Proposed one-time human control action

Current raw SHA-256 preconditions are:

| Protected file | SHA-256 before the human action |
| --- | --- |
| `.cursor/architecture-gate.json` | `28a77dafebb0cd609c27284a43023285aac9a6789c6e9e61389cb31ed9670b41` |
| `.cursor/hooks/architecture-write-gate.ps1` | `d02ab23bec455e82820fa4b447e03560e49c22c4be09f9d2ec1aa7c0650f6a15` |
| `.cursor/PHASE_CHECKPOINT_APPROVAL.json` | `38dbc6fa2f974644b7dbca68233fc1781d1fe83e62b2d831f6efc4efec810a6c` |

If any precondition differs, stop and review the current files. The following
four numbered steps are the sole change specification; Codex does not edit
the protected files.

1. Retire the spent `.cursor/PHASE_CHECKPOINT_APPROVAL.json`. Codex must not
   remove or edit it.
2. In protected `.cursor/architecture-gate.json`, append **only** these four
   strings to `allowedWritePathsWhileLocked`:

   ```text
   AGENTS.md
   .codex/hooks.json
   .codex/hooks/architecture-write-gate.ps1
   .codex/hooks/test-architecture-write-gate.ps1
   ```

3. In protected `.cursor/hooks/architecture-write-gate.ps1`, make
   `Test-AllowedArchitecturePath` return true for precisely those four paths.
   Keep `Test-ProtectedPath` and all existing gate/marker/unlock protections.
   Parse decoded `apply_patch` text to deny every `*** Delete File:` and
   `*** Move to:` directive; the current raw-JSON line check can miss escaped
   newlines in a mixed patch.

   Insert this condition before that function's final `return $false`:

   ```powershell
   if ($RelativePath -ieq "AGENTS.md" -or
       $RelativePath -ieq ".codex/hooks.json" -or
       $RelativePath -ieq ".codex/hooks/architecture-write-gate.ps1" -or
       $RelativePath -ieq ".codex/hooks/test-architecture-write-gate.ps1") {
       return $true
   }
   ```

   Replace the existing early condition, preserving its
   `Emit-Permission` body:

   ```powershell
   if ($toolName -match '(?i)(delete|remove)' -or "$rawInput" -match '(?m)^\*\*\*\s+Delete File:') {
   ```

   with:

   ```powershell
   if ($toolName -match '(?i)(delete|remove)') {
   ```

   Then insert the following condition between the closing `}` of the
   `$patchText = if ($toolInput -is [string]) { ... }` assignment and the
   existing `foreach ($match in [regex]::Matches($patchText, ...))` loop:

   ```powershell
   if ($patchText -match '(?m)^\*\*\*\s+(?:Delete File:|Move to:)') {
       Emit-Permission deny "Delete/rename operations are blocked during architecture-only work." "Preserve history and use supersession records."
   }
   ```

   The decoded patch check must run before paths are accepted. Do not remove
   the existing general delete-tool denial.

4. Leave `mode: architecture-only`, `enforcement: locked`,
   `implementationAuthorized: false`, `approvedBaseline: null`, and all
   unlock/checkpoint requirements unchanged. Do not add a wildcard for
   `.codex/**`, application paths, package files, schema, or migrations.
   Replace the existing JSON note claiming Cursor-only coverage with exactly:

   ```json
   "This architecture-only policy is canonical; Codex tool interception is unverified until a project hook is installed, trusted, and tested."
   ```

This is a **temporary governance bootstrap**, not verified Codex enforcement.
It allows Codex to create and test only the four named instruction/hook files
while implementation is locked. Before any such write, verify that new
`.codex` and `.codex/hooks` paths are ordinary directories, not Windows
junctions or symlinks; the current path normalizer is lexical. The Project
Owner must later remove the three
temporary `.codex` write allowances, protect `.codex/hooks.json` and the
entire `.codex/hooks/**` tree in the canonical gate and Cursor validator,
and trust the exact hook definition through Codex `/hooks`. Independently
verify the script and test-helper file hashes; trusting a hook definition does
not prove its invoked script bytes are immutable. This later protection is a
separate human action. No ERP work may start during the bootstrap.

## Proposed root instruction content

After the protected change, Codex may create a concise root `AGENTS.md`
stating: the canonical gate and a valid human-created unlock are both required
for implementation; agents never edit the gate, checkpoint marker, or unlock;
the live OQ register controls question status; factory rules must not be
fabricated; module ownership and transaction bundles remain binding; ACT-IPS
alone writes stock quantity; Ledger is truth and Balance is a projection;
direct Balance edits and negative stock are forbidden; a denial or missing
authorization stops the action. The file should link to the governing docs
instead of copying them.

## Proposed Codex hook behavior

Use a synchronous project `PreToolUse` hook with Codex's documented input
(`tool_name`, `tool_input`) and supported deny output. Read the canonical
`.cursor/architecture-gate.json`; do not create another authorization file.
For shell, deny unclassified/unauthorized commands. For writes, normalize all
target paths, deny marker/unlock/gate and other protected paths, deny unknown
write tools and delete/move operations, and apply the locked allowlist.
Treat malformed input as deny. The legacy Cursor hook must be hardened before
its decision logic is reused; its `{permission: ...}` response is not Codex
output. The later evaluator must reject unknown patch directives and check
Windows reparse/symlink ancestors, which the current lexical path check does
not resolve. Do not use unsupported `ask` decisions or claim complete
interception.

## Verification before final protection

- Parser and direct JSON-vector tests for the Cursor and Codex evaluators.
- During bootstrap, parser and direct JSON-vector tests are development
  evidence only. After the Project Owner protects the final hook paths and
  trusts the exact definition, run harmless live Codex denial/allow probes;
  confirm the hook source/hash through `/hooks` and separately recheck script
  hashes.
- Protected marker/unlock/gate denial, unknown shell denial, allowed
  governance operation, escaped mixed-patch delete/move denial, and no
  implementation writes while the gate is false.
- `git diff --check`, exact changed-file manifest, independent security review,
  and a fresh human checkpoint marker before Git staging/commit.

## Stop conditions

Stop the affected action if the protected change is not made exactly, a deny
probe is bypassed, an unknown tool cannot be classified, or any file outside
the approved governance scope changes. An untrusted hook is expected during
bootstrap; continue only governance preparation, and block any
implementation-readiness claim until final protection/trust/live verification.
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
