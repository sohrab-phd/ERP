$ErrorActionPreference = "Stop"

$hook = Join-Path $PSScriptRoot "architecture-write-gate.ps1"
$failures = New-Object System.Collections.Generic.List[string]
$passed = 0

function Invoke-GateCase {
    param(
        [string]$Name,
        [string]$Json,
        [string]$ExpectedPermission
    )

    try {
        $raw = $Json | & powershell -NoProfile -ExecutionPolicy Bypass -File $hook
        $result = $raw | ConvertFrom-Json
        if ($result.permission -ne $ExpectedPermission) {
            $script:failures.Add("$Name expected $ExpectedPermission but received $($result.permission)")
            return
        }
        $script:passed++
    } catch {
        $script:failures.Add("$Name failed: $($_.Exception.Message)")
    }
}

function Set-TestAuthorization {
    param(
        [string]$PolicyAuthorized,
        [string]$UnlockJson = "",
        [string]$ApprovedBaseline = "docs/00-governance/approved-baselines/APR-999-test.md",
        [string]$BaselineExists = "true",
        [string]$BaselineContent = ""
    )

    $env:ARCHITECTURE_GATE_TEST_MODE = "1"
    $env:ARCHITECTURE_GATE_TEST_POLICY_AUTHORIZED = $PolicyAuthorized
    $env:ARCHITECTURE_GATE_TEST_APPROVED_BASELINE = $ApprovedBaseline
    $env:ARCHITECTURE_GATE_TEST_BASELINE_EXISTS = $BaselineExists
    if ($BaselineContent) {
        $env:ARCHITECTURE_GATE_TEST_BASELINE_CONTENT = $BaselineContent
    } else {
        Remove-Item Env:ARCHITECTURE_GATE_TEST_BASELINE_CONTENT -ErrorAction SilentlyContinue
    }
    if ($UnlockJson) {
        $env:ARCHITECTURE_GATE_TEST_UNLOCK_JSON = $UnlockJson
    } else {
        Remove-Item Env:ARCHITECTURE_GATE_TEST_UNLOCK_JSON -ErrorAction SilentlyContinue
    }
}

function Clear-TestAuthorization {
    foreach ($name in @(
        "ARCHITECTURE_GATE_TEST_MODE",
        "ARCHITECTURE_GATE_TEST_POLICY_AUTHORIZED",
        "ARCHITECTURE_GATE_TEST_APPROVED_BASELINE",
        "ARCHITECTURE_GATE_TEST_BASELINE_EXISTS",
        "ARCHITECTURE_GATE_TEST_BASELINE_CONTENT",
        "ARCHITECTURE_GATE_TEST_UNLOCK_JSON",
        "ARCHITECTURE_GATE_TEST_CHECKPOINT_JSON",
        "ARCHITECTURE_GATE_TEST_CHECKPOINT_MANIFEST_EXISTS",
        "ARCHITECTURE_GATE_TEST_CHECKPOINT_MANIFEST_CONTENT"
    )) {
        Remove-Item "Env:$name" -ErrorAction SilentlyContinue
    }
}

function Set-TestCheckpoint {
    param(
        [string]$MarkerJson,
        [string]$ManifestContent,
        [string]$ManifestExists = "true"
    )

    $env:ARCHITECTURE_GATE_TEST_MODE = "1"
    $env:ARCHITECTURE_GATE_TEST_CHECKPOINT_JSON = $MarkerJson
    $env:ARCHITECTURE_GATE_TEST_CHECKPOINT_MANIFEST_EXISTS = $ManifestExists
    $env:ARCHITECTURE_GATE_TEST_CHECKPOINT_MANIFEST_CONTENT = $ManifestContent
}

Invoke-GateCase "read allowed" @'
{"hook_event_name":"preToolUse","workspace_roots":["D:\\projects\\NavardKaran\\Design-ERP"],"tool_name":"ReadFile","tool_input":{"path":"docs/INDEX.md"},"cwd":"D:\\projects\\NavardKaran\\Design-ERP"}
'@ "allow"

$misdecodedBom = (-join @([char]0x2229, [char]0x2557, [char]0x2510))
Invoke-GateCase "misdecoded UTF-8 BOM allowed" ($misdecodedBom + @'
{"hook_event_name":"preToolUse","workspace_roots":["/D:/projects/NavardKaran/Design-ERP"],"tool_name":"Read","tool_input":{"file_path":"docs/INDEX.md"}}
'@) "allow"

Invoke-GateCase "architecture markdown allowed" @'
{"hook_event_name":"preToolUse","tool_name":"ApplyPatch","tool_input":"*** Begin Patch\n*** Add File: docs/02-domain-business-architecture/example.md\n+example\n*** End Patch"}
'@ "allow"

Invoke-GateCase "root readme allowed" @'
{"hook_event_name":"preToolUse","tool_name":"Write","tool_input":{"path":"README.md","content":"example"}}
'@ "allow"

Invoke-GateCase "MCP resource read without download allowed" @'
{"hook_event_name":"preToolUse","tool_name":"FetchMcpResource","tool_input":{"server":"example","uri":"resource://example"}}
'@ "allow"

Invoke-GateCase "MCP resource documentation download allowed" @'
{"hook_event_name":"preToolUse","tool_name":"FetchMcpResource","tool_input":{"server":"example","uri":"resource://example","downloadPath":"docs/evidence/resource.md"}}
'@ "allow"

Invoke-GateCase "MCP resource implementation download denied" @'
{"hook_event_name":"preToolUse","tool_name":"FetchMcpResource","tool_input":{"server":"example","uri":"resource://example","downloadPath":"src/generated.ts"}}
'@ "deny"

Invoke-GateCase "MCP resource whitespace download denied" @'
{"hook_event_name":"preToolUse","tool_name":"FetchMcpResource","tool_input":{"server":"example","uri":"resource://example","downloadPath":" "}}
'@ "deny"

Invoke-GateCase "source code denied" @'
{"hook_event_name":"preToolUse","tool_name":"Write","tool_input":{"path":"src/probe.ts","content":"export {}"}}
'@ "deny"

Invoke-GateCase "package manifest denied" @'
{"hook_event_name":"preToolUse","tool_name":"Write","tool_input":{"path":"package.json","content":"{}"}}
'@ "deny"

Invoke-GateCase "sql denied" @'
{"hook_event_name":"preToolUse","tool_name":"Write","tool_input":{"path":"database/schema.sql","content":"select 1"}}
'@ "deny"

Invoke-GateCase "deployment yaml denied" @'
{"hook_event_name":"preToolUse","tool_name":"Write","tool_input":{"path":"compose.yaml","content":"services: {}"}}
'@ "deny"

Invoke-GateCase "outside project denied" @'
{"hook_event_name":"preToolUse","tool_name":"Write","tool_input":{"path":"D:/outside-project/probe.md","content":"example"}}
'@ "deny"

Invoke-GateCase "traversal denied" @'
{"hook_event_name":"preToolUse","tool_name":"Write","tool_input":{"path":"../outside.md","content":"example"}}
'@ "deny"

Invoke-GateCase "delete denied" @'
{"hook_event_name":"preToolUse","tool_name":"Delete","tool_input":{"path":"docs/INDEX.md"}}
'@ "deny"

Invoke-GateCase "protected policy denied" @'
{"hook_event_name":"preToolUse","tool_name":"Write","tool_input":{"path":".cursor/architecture-gate.json","content":"{}"}}
'@ "deny"

Invoke-GateCase "read-only git allowed" @'
{"hook_event_name":"beforeShellExecution","workspace_roots":["D:\\projects\\NavardKaran\\Design-ERP"],"command":"git status --short","cwd":"D:\\projects\\NavardKaran\\Design-ERP","sandbox":false}
'@ "allow"

Invoke-GateCase "pre-approval git commit denied" @'
{"hook_event_name":"beforeShellExecution","command":"git commit -m architecture-checkpoint"}
'@ "deny"

Invoke-GateCase "pre-approval git add denied" @'
{"hook_event_name":"beforeShellExecution","command":"git add -A"}
'@ "deny"

Invoke-GateCase "pre-tool shell read-only allowed" @'
{"hook_event_name":"preToolUse","tool_name":"Shell","tool_input":{"command":"git status --short","working_directory":"D:\\projects\\NavardKaran\\Design-ERP"},"cwd":"D:\\projects\\NavardKaran\\Design-ERP"}
'@ "allow"

Invoke-GateCase "pre-tool shell mutation denied" @'
{"hook_event_name":"preToolUse","tool_name":"Shell","tool_input":{"command":"npm install","working_directory":"D:\\projects\\NavardKaran\\Design-ERP"},"cwd":"D:\\projects\\NavardKaran\\Design-ERP"}
'@ "deny"

Invoke-GateCase "package command denied" @'
{"hook_event_name":"beforeShellExecution","command":"npm install"}
'@ "deny"

Invoke-GateCase "arbitrary shell denied" @'
{"hook_event_name":"beforeShellExecution","command":"python generate.py"}
'@ "deny"

Invoke-GateCase "compound git command denied" @'
{"hook_event_name":"beforeShellExecution","command":"git status --short; npm install"}
'@ "deny"

Invoke-GateCase "redirected git command denied" @'
{"hook_event_name":"beforeShellExecution","command":"git diff > generated.patch"}
'@ "deny"

Invoke-GateCase "piped git command denied" @'
{"hook_event_name":"beforeShellExecution","command":"git status | Out-File status.txt"}
'@ "deny"

Invoke-GateCase "compound PowerShell command denied" @'
{"hook_event_name":"beforeShellExecution","command":"Get-ChildItem; New-Item src/probe.ts"}
'@ "deny"

Invoke-GateCase "malformed input denied" "not-json" "deny"

Invoke-GateCase "missing event denied" @'
{"tool_name":"ReadFile","tool_input":{"path":"docs/INDEX.md"}}
'@ "deny"

Invoke-GateCase "unknown tool denied" @'
{"hook_event_name":"preToolUse","tool_name":"GenerateFile","tool_input":{"file_path":"docs/generated.md"}}
'@ "deny"

$approvedBaselineContent = @'
---
id: APR-999
status: approved
---

# Test approved baseline

- Gate result: `APPROVED`
- Explicit approver: Architecture Owner
- Git commit: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
'@

$validUnlock = @'
{"version":1,"implementationAuthorized":true,"approvedBy":"Architecture Owner","approvedAt":"2026-09-04T13:00:00+03:30","approvedBaseline":"docs/00-governance/approved-baselines/APR-999-test.md","allowedWritePaths":["apps/api/**","package.json"],"allowedShellCommands":["npm install"]}
'@

Set-TestAuthorization "false" $validUnlock -BaselineContent $approvedBaselineContent
Invoke-GateCase "marker cannot override locked policy" @'
{"hook_event_name":"preToolUse","tool_name":"Write","tool_input":{"file_path":"apps/api/src/main.ts","content":"example"}}
'@ "deny"

Set-TestAuthorization "true"
Invoke-GateCase "authorized policy without marker remains locked" @'
{"hook_event_name":"preToolUse","tool_name":"Write","tool_input":{"file_path":"apps/api/src/main.ts","content":"example"}}
'@ "deny"

Set-TestAuthorization "true" "not-json" -BaselineContent $approvedBaselineContent
Invoke-GateCase "malformed marker remains locked" @'
{"hook_event_name":"preToolUse","tool_name":"Write","tool_input":{"file_path":"apps/api/src/main.ts","content":"example"}}
'@ "deny"

$mismatchedUnlock = $validUnlock.Replace("APR-999-test.md", "APR-998-other.md")
Set-TestAuthorization "true" $mismatchedUnlock -BaselineContent $approvedBaselineContent
Invoke-GateCase "mismatched baseline remains locked" @'
{"hook_event_name":"preToolUse","tool_name":"Write","tool_input":{"file_path":"apps/api/src/main.ts","content":"example"}}
'@ "deny"

$futureUnlock = $validUnlock.Replace(
    "2026-09-04T13:00:00+03:30",
    ([DateTimeOffset]::Now.AddHours(1).ToString("o"))
)
Set-TestAuthorization "true" $futureUnlock -BaselineContent $approvedBaselineContent
Invoke-GateCase "future-dated unlock remains locked" @'
{"hook_event_name":"preToolUse","tool_name":"Write","tool_input":{"file_path":"apps/api/src/main.ts","content":"example"}}
'@ "deny"

Set-TestAuthorization "true" $validUnlock -BaselineContent "not an approved manifest"
Invoke-GateCase "non-authoritative baseline remains locked" @'
{"hook_event_name":"preToolUse","tool_name":"Write","tool_input":{"file_path":"apps/api/src/main.ts","content":"example"}}
'@ "deny"

Set-TestAuthorization "true" $validUnlock -BaselineContent ($approvedBaselineContent.Replace("id: APR-999", "id: APR-998"))
Invoke-GateCase "baseline filename ID mismatch remains locked" @'
{"hook_event_name":"preToolUse","tool_name":"Write","tool_input":{"file_path":"apps/api/src/main.ts","content":"example"}}
'@ "deny"

$unsafeUnlock = $validUnlock.Replace('["apps/api/**","package.json"]', '["**"]')
Set-TestAuthorization "true" $unsafeUnlock -BaselineContent $approvedBaselineContent
Invoke-GateCase "unsafe wildcard marker remains locked" @'
{"hook_event_name":"preToolUse","tool_name":"Write","tool_input":{"file_path":"apps/api/src/main.ts","content":"example"}}
'@ "deny"

Set-TestAuthorization "true" $validUnlock -BaselineContent $approvedBaselineContent
Invoke-GateCase "valid marker allows scoped API write" @'
{"hook_event_name":"preToolUse","tool_name":"Write","tool_input":{"file_path":"apps/api/src/main.ts","content":"example"}}
'@ "allow"

Invoke-GateCase "valid marker allows exact package manifest" @'
{"hook_event_name":"preToolUse","tool_name":"Write","tool_input":{"file_path":"package.json","content":"{}"}}
'@ "allow"

Invoke-GateCase "valid marker denies unlisted application path" @'
{"hook_event_name":"preToolUse","tool_name":"Write","tool_input":{"file_path":"apps/web/src/main.tsx","content":"example"}}
'@ "deny"

Invoke-GateCase "valid marker allows scoped MCP resource download" @'
{"hook_event_name":"preToolUse","tool_name":"FetchMcpResource","tool_input":{"server":"example","uri":"resource://example","downloadPath":"apps/api/generated/schema.json"}}
'@ "allow"

Invoke-GateCase "valid marker denies unlisted MCP resource download" @'
{"hook_event_name":"preToolUse","tool_name":"FetchMcpResource","tool_input":{"server":"example","uri":"resource://example","downloadPath":"apps/web/generated/schema.json"}}
'@ "deny"

Invoke-GateCase "valid marker still denies unknown tool" @'
{"hook_event_name":"preToolUse","tool_name":"FutureMutatingTool","tool_input":{"path":"apps/api/src/main.ts"}}
'@ "deny"

Invoke-GateCase "authorized shell requires user approval" @'
{"hook_event_name":"beforeShellExecution","command":"npm install"}
'@ "ask"

Invoke-GateCase "unlisted authorized shell command denied" @'
{"hook_event_name":"beforeShellExecution","command":"npm run build"}
'@ "deny"

Clear-TestAuthorization

$checkpointManifest = @'
---
id: APR-000
status: approved
---

# Governance approval

- Gate result: `APPROVED`
- Explicit approver: Architecture Owner
- Phase: `00-governance`
- Git checkpoint: pending
'@

$checkpointManifestBytes = [Text.Encoding]::UTF8.GetBytes($checkpointManifest)
$checkpointHashAlgorithm = [Security.Cryptography.SHA256]::Create()
try {
    $checkpointManifestSha256 = (
        [BitConverter]::ToString($checkpointHashAlgorithm.ComputeHash($checkpointManifestBytes))
    ).Replace("-", "").ToLowerInvariant()
} finally {
    $checkpointHashAlgorithm.Dispose()
}

$checkpointApprovedAt = [DateTimeOffset]::Now
$checkpointExpiresAt = $checkpointApprovedAt.AddHours(1)
$validCheckpoint = @{
    version = 1
    approvedBy = "Architecture Owner"
    approvedAt = $checkpointApprovedAt.ToString("o")
    expiresAt = $checkpointExpiresAt.ToString("o")
    phase = "00-governance"
    approvalManifest = "docs/00-governance/approved-baselines/APR-000-governance.md"
    approvalManifestSha256 = $checkpointManifestSha256
    approvedArtifacts = @(
        @{
            path = "docs/00-governance/approved-baselines/APR-000-governance.md"
            sha256 = $checkpointManifestSha256
            gitMode = "100644"
            gitBlobOid = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        }
    )
    allowedGitCommands = @(
        "git add -A",
        'git commit -m "docs: approve phase 00 governance foundation"'
    )
} | ConvertTo-Json -Compress -Depth 5

Set-TestCheckpoint "not-json" $checkpointManifest
Invoke-GateCase "malformed checkpoint marker denied" @'
{"hook_event_name":"beforeShellExecution","command":"git add -A"}
'@ "deny"

Set-TestCheckpoint $validCheckpoint "not an approved manifest"
Invoke-GateCase "invalid checkpoint manifest denied" @'
{"hook_event_name":"beforeShellExecution","command":"git add -A"}
'@ "deny"

$digestMismatchCheckpoint = $validCheckpoint.Replace($checkpointManifestSha256, ("0" * 64))
Set-TestCheckpoint $digestMismatchCheckpoint $checkpointManifest
Invoke-GateCase "checkpoint manifest digest mismatch denied" @'
{"hook_event_name":"beforeShellExecution","command":"git add -A"}
'@ "deny"

$artifactMismatchObject = $validCheckpoint | ConvertFrom-Json
$artifactMismatchObject.approvedArtifacts[0].sha256 = "1" * 64
$artifactMismatchCheckpoint = $artifactMismatchObject | ConvertTo-Json -Compress -Depth 5
Set-TestCheckpoint $artifactMismatchCheckpoint $checkpointManifest
Invoke-GateCase "checkpoint artifact hash mismatch denied" @'
{"hook_event_name":"beforeShellExecution","command":"git add -A"}
'@ "deny"

$modeMismatchObject = $validCheckpoint | ConvertFrom-Json
$modeMismatchObject.approvedArtifacts[0].gitMode = "120000"
$modeMismatchCheckpoint = $modeMismatchObject | ConvertTo-Json -Compress -Depth 5
Set-TestCheckpoint $modeMismatchCheckpoint $checkpointManifest
Invoke-GateCase "checkpoint unsafe git mode denied" @'
{"hook_event_name":"beforeShellExecution","command":"git add -A"}
'@ "deny"

$blobMismatchObject = $validCheckpoint | ConvertFrom-Json
$blobMismatchObject.approvedArtifacts[0].gitBlobOid = "not-a-git-object"
$blobMismatchCheckpoint = $blobMismatchObject | ConvertTo-Json -Compress -Depth 5
Set-TestCheckpoint $blobMismatchCheckpoint $checkpointManifest
Invoke-GateCase "checkpoint malformed Git blob ID denied" @'
{"hook_event_name":"beforeShellExecution","command":"git add -A"}
'@ "deny"

Set-TestCheckpoint $validCheckpoint ($checkpointManifest.Replace('Phase: `00-governance`', 'Phase: `01-project-assimilation`'))
Invoke-GateCase "checkpoint phase mismatch denied" @'
{"hook_event_name":"beforeShellExecution","command":"git add -A"}
'@ "deny"

$futureCheckpointObject = $validCheckpoint | ConvertFrom-Json
$futureCheckpointObject.approvedAt = [DateTimeOffset]::Now.AddHours(1).ToString("o")
$futureCheckpointObject.expiresAt = [DateTimeOffset]::Now.AddHours(2).ToString("o")
$futureCheckpoint = $futureCheckpointObject | ConvertTo-Json -Compress -Depth 5
Set-TestCheckpoint $futureCheckpoint $checkpointManifest
Invoke-GateCase "future-dated checkpoint denied" @'
{"hook_event_name":"beforeShellExecution","command":"git add -A"}
'@ "deny"

$expiredCheckpointObject = $validCheckpoint | ConvertFrom-Json
$expiredCheckpointObject.approvedAt = [DateTimeOffset]::Now.AddHours(-2).ToString("o")
$expiredCheckpointObject.expiresAt = [DateTimeOffset]::Now.AddHours(-1).ToString("o")
$expiredCheckpoint = $expiredCheckpointObject | ConvertTo-Json -Compress -Depth 5
Set-TestCheckpoint $expiredCheckpoint $checkpointManifest
Invoke-GateCase "expired checkpoint denied" @'
{"hook_event_name":"beforeShellExecution","command":"git add -A"}
'@ "deny"

$unsafeCheckpointObject = $validCheckpoint | ConvertFrom-Json
$unsafeCheckpointObject.allowedGitCommands = @("git add -A; git commit -m `"unsafe`"")
$unsafeCheckpoint = $unsafeCheckpointObject | ConvertTo-Json -Compress -Depth 5
Set-TestCheckpoint $unsafeCheckpoint $checkpointManifest
Invoke-GateCase "unsafe checkpoint command denied" @'
{"hook_event_name":"beforeShellExecution","command":"git add -A; git commit -m \"unsafe\""}
'@ "deny"

$protectedControlPath = ".cursor/architecture-gate.json"
$protectedControlHash = (
    Get-FileHash (Join-Path (Join-Path $PSScriptRoot "..\..") $protectedControlPath) -Algorithm SHA256
).Hash.ToLowerInvariant()
$protectedControlBlob = "$(
    & git -C (Join-Path $PSScriptRoot "..\..") hash-object --path="$protectedControlPath" -- "$protectedControlPath"
)".Trim()
$protectedCheckpointObject = $validCheckpoint | ConvertFrom-Json
$protectedCheckpointObject.approvedArtifacts += [pscustomobject]@{
    path = $protectedControlPath
    sha256 = $protectedControlHash
    gitMode = "100644"
    gitBlobOid = $protectedControlBlob
}
$protectedCheckpoint = $protectedCheckpointObject | ConvertTo-Json -Compress -Depth 5
Set-TestCheckpoint $protectedCheckpoint $checkpointManifest
Invoke-GateCase "human marker permits digest-bound protected control checkpoint" @'
{"hook_event_name":"beforeShellExecution","command":"git add -A"}
'@ "allow"

Set-TestCheckpoint $validCheckpoint $checkpointManifest
Invoke-GateCase "protected checkpoint marker allows exact git add" @'
{"hook_event_name":"beforeShellExecution","command":"git add -A"}
'@ "allow"

Invoke-GateCase "protected checkpoint marker allows exact commit" @'
{"hook_event_name":"beforeShellExecution","command":"git commit -m \"docs: approve phase 00 governance foundation\""}
'@ "allow"

Invoke-GateCase "protected checkpoint marker denies different commit" @'
{"hook_event_name":"beforeShellExecution","command":"git commit -m \"different message\""}
'@ "deny"

$cursorCommitObject = $validCheckpoint | ConvertFrom-Json
$cursorCommitObject.allowedGitCommands = @(
    "git add -A",
    'git commit --trailer "Co-authored-by: Cursor <cursoragent@cursor.com>" -m "docs: approve phase 00 governance foundation"'
)
$cursorCommitCheckpoint = $cursorCommitObject | ConvertTo-Json -Compress -Depth 5
Set-TestCheckpoint $cursorCommitCheckpoint $checkpointManifest
Invoke-GateCase "protected checkpoint permits exact Cursor commit trailer" @'
{"hook_event_name":"beforeShellExecution","command":"git commit --trailer \"Co-authored-by: Cursor <cursoragent@cursor.com>\" -m \"docs: approve phase 00 governance foundation\""}
'@ "allow"

Invoke-GateCase "protected checkpoint denies arbitrary commit trailer" @'
{"hook_event_name":"beforeShellExecution","command":"git commit --trailer \"Reviewed-by: Someone <other@example.com>\" -m \"docs: approve phase 00 governance foundation\""}
'@ "deny"

Clear-TestAuthorization

$originalProjectDir = $env:CURSOR_PROJECT_DIR
$integrationRoot = Join-Path ([IO.Path]::GetTempPath()) ("architecture-gate-" + [guid]::NewGuid().ToString("N"))
try {
    [IO.Directory]::CreateDirectory((Join-Path $integrationRoot ".cursor\hooks")) | Out-Null
    [IO.Directory]::CreateDirectory((Join-Path $integrationRoot "docs\00-governance\approved-baselines")) | Out-Null
    [IO.Directory]::CreateDirectory((Join-Path $integrationRoot "docs\00-governance")) | Out-Null
    [IO.File]::Copy($hook, (Join-Path $integrationRoot ".cursor\hooks\architecture-write-gate.ps1"))

    $utf8NoBom = New-Object Text.UTF8Encoding($false)
    $integrationPolicy = @'
{"version":1,"implementationAuthorized":false,"approvedBaseline":null,"unlockMarker":".cursor/IMPLEMENTATION_UNLOCK.json","checkpointMarker":".cursor/PHASE_CHECKPOINT_APPROVAL.json"}
'@
    [IO.File]::WriteAllText((Join-Path $integrationRoot ".cursor\architecture-gate.json"), $integrationPolicy, $utf8NoBom)
    [IO.File]::WriteAllText(
        (Join-Path $integrationRoot ".gitignore"),
        ".cursor/IMPLEMENTATION_UNLOCK.json`n.cursor/PHASE_CHECKPOINT_APPROVAL.json`n",
        $utf8NoBom
    )

    $integrationManifestPath = "docs/00-governance/approved-baselines/APR-000-integration.md"
    $integrationArtifactPath = "docs/00-governance/GATE_CHECKLIST.md"
    $integrationManifestOld = $checkpointManifest.Replace("# Governance approval", "# Old governance approval")
    $integrationArtifactOld = "old gate evidence"
    $integrationObsoletePath = "docs/00-governance/OBSOLETE.md"
    [IO.File]::WriteAllText((Join-Path $integrationRoot $integrationManifestPath), $integrationManifestOld, $utf8NoBom)
    [IO.File]::WriteAllText((Join-Path $integrationRoot $integrationArtifactPath), $integrationArtifactOld, $utf8NoBom)
    [IO.File]::WriteAllText((Join-Path $integrationRoot $integrationObsoletePath), "preserve", $utf8NoBom)

    & git -C $integrationRoot init --quiet
    & git -C $integrationRoot config user.email "gate-test@example.invalid"
    & git -C $integrationRoot config user.name "Gate Test"
    & git -C $integrationRoot add -A
    & git -C $integrationRoot commit --quiet -m "test: initial gate state"
    if ($LASTEXITCODE -ne 0) { throw "Unable to initialize checkpoint integration repository." }

    $integrationArtifact = "approved gate evidence"
    [IO.File]::WriteAllText((Join-Path $integrationRoot $integrationManifestPath), $checkpointManifest, $utf8NoBom)
    [IO.File]::WriteAllText((Join-Path $integrationRoot $integrationArtifactPath), $integrationArtifact, $utf8NoBom)
    [IO.File]::Delete((Join-Path $integrationRoot $integrationObsoletePath))

    $integrationManifestSha = (Get-FileHash (Join-Path $integrationRoot $integrationManifestPath) -Algorithm SHA256).Hash.ToLowerInvariant()
    $integrationArtifactSha = (Get-FileHash (Join-Path $integrationRoot $integrationArtifactPath) -Algorithm SHA256).Hash.ToLowerInvariant()
    $integrationManifestBlob = "$(& git -C $integrationRoot hash-object --path="$integrationManifestPath" -- "$integrationManifestPath")".Trim()
    $integrationArtifactBlob = "$(& git -C $integrationRoot hash-object --path="$integrationArtifactPath" -- "$integrationArtifactPath")".Trim()
    $integrationApprovedAt = [DateTimeOffset]::Now
    $integrationMarker = @{
        version = 1
        approvedBy = "Architecture Owner"
        approvedAt = $integrationApprovedAt.ToString("o")
        expiresAt = $integrationApprovedAt.AddHours(1).ToString("o")
        phase = "00-governance"
        approvalManifest = $integrationManifestPath
        approvalManifestSha256 = $integrationManifestSha
        approvedArtifacts = @(
            @{ path = $integrationManifestPath; sha256 = $integrationManifestSha; gitMode = "100644"; gitBlobOid = $integrationManifestBlob },
            @{ path = $integrationArtifactPath; sha256 = $integrationArtifactSha; gitMode = "100644"; gitBlobOid = $integrationArtifactBlob }
        )
        allowedGitCommands = @(
            "git add -A",
            'git commit -m "docs: integration checkpoint"'
        )
    } | ConvertTo-Json -Compress -Depth 5
    [IO.File]::WriteAllText(
        (Join-Path $integrationRoot ".cursor\PHASE_CHECKPOINT_APPROVAL.json"),
        $integrationMarker,
        $utf8NoBom
    )

    $env:CURSOR_PROJECT_DIR = $integrationRoot
    Invoke-GateCase "integration extra deletion blocks git add" @'
{"hook_event_name":"beforeShellExecution","command":"git add -A"}
'@ "deny"

    [IO.File]::WriteAllText((Join-Path $integrationRoot $integrationObsoletePath), "preserve", $utf8NoBom)
    Invoke-GateCase "integration exact changed set allows git add" @'
{"hook_event_name":"beforeShellExecution","command":"git add -A"}
'@ "allow"

    & git -C $integrationRoot add -A
    Invoke-GateCase "integration exact staged bytes allow commit" @'
{"hook_event_name":"beforeShellExecution","command":"git commit -m \"docs: integration checkpoint\""}
'@ "allow"

    [IO.File]::WriteAllText((Join-Path $integrationRoot $integrationArtifactPath), "tampered staged evidence", $utf8NoBom)
    & git -C $integrationRoot add -- $integrationArtifactPath
    [IO.File]::WriteAllText((Join-Path $integrationRoot $integrationArtifactPath), $integrationArtifact, $utf8NoBom)
    Invoke-GateCase "integration staged byte mismatch blocks commit" @'
{"hook_event_name":"beforeShellExecution","command":"git commit -m \"docs: integration checkpoint\""}
'@ "deny"
} catch {
    $failures.Add("checkpoint repository integration failed: $($_.Exception.Message)")
} finally {
    if ($null -eq $originalProjectDir) {
        Remove-Item Env:CURSOR_PROJECT_DIR -ErrorAction SilentlyContinue
    } else {
        $env:CURSOR_PROJECT_DIR = $originalProjectDir
    }
    if (Test-Path $integrationRoot) {
        Remove-Item $integrationRoot -Recurse -Force
    }
}

if ($failures.Count -gt 0) {
    foreach ($failure in $failures) {
        Write-Output "FAIL: $failure"
    }
    throw "$($failures.Count) architecture gate test(s) failed; $passed passed."
}

Write-Output "PASS: $passed architecture gate tests passed."
Clear-TestAuthorization
