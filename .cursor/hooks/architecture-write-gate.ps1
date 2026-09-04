$ErrorActionPreference = "Stop"

function Emit-Permission {
    param(
        [ValidateSet("allow", "deny", "ask")]
        [string]$Permission,
        [string]$UserMessage = "",
        [string]$AgentMessage = ""
    )

    $result = @{ permission = $Permission }
    if ($UserMessage) { $result.user_message = $UserMessage }
    if ($AgentMessage) { $result.agent_message = $AgentMessage }
    $result | ConvertTo-Json -Compress
    exit 0
}

function Normalize-ProjectPath {
    param([string]$Candidate, [string]$Root)

    if ([string]::IsNullOrWhiteSpace($Candidate)) { return $null }
    $candidatePath = $Candidate.Trim().Trim('"').Trim("'")
    $fullPath = if ([IO.Path]::IsPathRooted($candidatePath)) {
        [IO.Path]::GetFullPath($candidatePath)
    } else {
        [IO.Path]::GetFullPath((Join-Path $Root $candidatePath))
    }

    $rootPrefix = $Root.TrimEnd('\') + '\'
    if (-not $fullPath.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)) {
        return $null
    }

    return $fullPath.Substring($rootPrefix.Length).Replace('\', '/')
}

function Get-StringSha256 {
    param([string]$Value)

    $algorithm = [Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [Text.Encoding]::UTF8.GetBytes($Value)
        return ([BitConverter]::ToString($algorithm.ComputeHash($bytes))).Replace("-", "").ToLowerInvariant()
    } finally {
        $algorithm.Dispose()
    }
}

function Test-ProtectedPath {
    param([string]$RelativePath)

    return (
        $RelativePath -ieq ".cursor/architecture-gate.json" -or
        $RelativePath -ieq ".cursor/hooks.json" -or
        $RelativePath -ieq ".cursor/IMPLEMENTATION_UNLOCK.json" -or
        $RelativePath -ieq ".cursor/PHASE_CHECKPOINT_APPROVAL.json" -or
        $RelativePath.StartsWith(".cursor/hooks/", [StringComparison]::OrdinalIgnoreCase)
    )
}

function Test-AllowedArchitecturePath {
    param([string]$RelativePath)

    if ($RelativePath -ieq "README.md" -or $RelativePath -ieq ".gitignore") {
        return $true
    }
    if (
        $RelativePath.StartsWith("docs/", [StringComparison]::OrdinalIgnoreCase) -and
        $RelativePath.EndsWith(".md", [StringComparison]::OrdinalIgnoreCase)
    ) {
        return $true
    }
    if (
        $RelativePath.StartsWith(".cursor/rules/", [StringComparison]::OrdinalIgnoreCase) -and
        $RelativePath.EndsWith(".mdc", [StringComparison]::OrdinalIgnoreCase)
    ) {
        return $true
    }
    if (
        $RelativePath.StartsWith(".cursor/skills/", [StringComparison]::OrdinalIgnoreCase) -and
        $RelativePath.EndsWith(".md", [StringComparison]::OrdinalIgnoreCase)
    ) {
        return $true
    }
    return $false
}

function Test-ReadOnlyShellCommand {
    param([string]$Command)

    $trimmed = $Command.Trim()
    if ($trimmed -eq '& ".cursor/hooks/test-architecture-write-gate.ps1"') {
        return $true
    }
    if ($trimmed -match '[;|><\r\n]') { return $false }

    return (
        $trimmed -match '^git status(?: --short)?$' -or
        $trimmed -match '^git diff(?: --check| --stat)?$' -or
        $trimmed -match '^git log(?: --oneline)?$' -or
        $trimmed -eq 'git rev-parse --is-inside-work-tree' -or
        $trimmed -eq 'git ls-files' -or
        $trimmed -match '^Get-ChildItem(?: -Force)?$'
    )
}

function Get-CheckpointAuthorization {
    param([string]$Root, [object]$Policy)

    $testMode = $env:ARCHITECTURE_GATE_TEST_MODE -eq "1"
    try {
        if ($testMode -and $env:ARCHITECTURE_GATE_TEST_CHECKPOINT_JSON) {
            $marker = $env:ARCHITECTURE_GATE_TEST_CHECKPOINT_JSON | ConvertFrom-Json
        } else {
            $markerPath = Join-Path $Root "$($Policy.checkpointMarker)"
            if (-not (Test-Path $markerPath)) {
                return [pscustomobject]@{ Authorized = $false; AllowedCommands = @() }
            }
            $marker = [IO.File]::ReadAllText($markerPath) | ConvertFrom-Json
        }
    } catch {
        return [pscustomobject]@{ Authorized = $false; AllowedCommands = @() }
    }

    $approvedAt = [DateTimeOffset]::MinValue
    $expiresAt = [DateTimeOffset]::MinValue
    $approvedAtValid = [DateTimeOffset]::TryParse("$($marker.approvedAt)", [ref]$approvedAt)
    $expiresAtValid = [DateTimeOffset]::TryParse("$($marker.expiresAt)", [ref]$expiresAt)
    $allowedCommands = @($marker.allowedGitCommands)
    $approvedArtifacts = @($marker.approvedArtifacts)
    if (
        $marker.version -ne 1 -or
        [string]::IsNullOrWhiteSpace("$($marker.approvedBy)") -or
        [string]::IsNullOrWhiteSpace("$($marker.phase)") -or
        [string]::IsNullOrWhiteSpace("$($marker.approvalManifest)") -or
        "$($marker.approvalManifestSha256)" -notmatch '^[0-9a-fA-F]{64}$' -or
        -not $approvedAtValid -or
        -not $expiresAtValid -or
        $approvedAt -gt [DateTimeOffset]::Now -or
        $expiresAt -le $approvedAt -or
        $expiresAt -gt $approvedAt.AddHours(2) -or
        $expiresAt -le [DateTimeOffset]::Now -or
        $allowedCommands.Count -lt 1 -or
        $approvedArtifacts.Count -lt 1
    ) {
        return [pscustomobject]@{ Authorized = $false; AllowedCommands = @() }
    }

    $manifestRelative = Normalize-ProjectPath "$($marker.approvalManifest)" $Root
    $manifestPath = if ($manifestRelative) { Join-Path $Root $manifestRelative } else { "" }
    $manifestExists = if ($testMode -and $env:ARCHITECTURE_GATE_TEST_CHECKPOINT_MANIFEST_EXISTS) {
        $env:ARCHITECTURE_GATE_TEST_CHECKPOINT_MANIFEST_EXISTS -eq "true"
    } else {
        $manifestRelative -and (Test-Path $manifestPath)
    }
    if (
        -not $manifestRelative -or
        $manifestRelative -notmatch '^docs/00-governance/approved-baselines/APR-[0-9]{3,}-.+\.md$' -or
        -not $manifestExists
    ) {
        return [pscustomobject]@{ Authorized = $false; AllowedCommands = @() }
    }

    $manifestContent = if ($testMode -and $env:ARCHITECTURE_GATE_TEST_CHECKPOINT_MANIFEST_CONTENT) {
        $env:ARCHITECTURE_GATE_TEST_CHECKPOINT_MANIFEST_CONTENT
    } else {
        [IO.File]::ReadAllText($manifestPath)
    }
    $manifestFileName = [IO.Path]::GetFileName($manifestRelative)
    $manifestIdMatch = [regex]::Match($manifestFileName, '^(APR-[0-9]{3,})-')
    $expectedManifestId = if ($manifestIdMatch.Success) { $manifestIdMatch.Groups[1].Value } else { "" }
    $escapedPhase = [regex]::Escape("$($marker.phase)")
    $phasePattern = "(?m)^-\s*Phase:\s*\x60?$escapedPhase\x60?\s*$"
    $manifestSha256 = if ($testMode -and $env:ARCHITECTURE_GATE_TEST_CHECKPOINT_MANIFEST_CONTENT) {
        Get-StringSha256 $manifestContent
    } else {
        (Get-FileHash -LiteralPath $manifestPath -Algorithm SHA256).Hash.ToLowerInvariant()
    }
    $pendingCheckpointCount = [regex]::Matches(
        $manifestContent,
        '(?m)^-\s*Git checkpoint:\s*pending\s*$'
    ).Count
    $completedCheckpointCount = [regex]::Matches(
        $manifestContent,
        '(?m)^-\s*Git checkpoint:\s*completed\s*$'
    ).Count
    $validCommitCount = [regex]::Matches(
        $manifestContent,
        '(?m)^-\s*Git commit:\s*(?:[0-9a-fA-F]{40,64}|`[0-9a-fA-F]{40,64}`)\s*$'
    ).Count
    $checkpointStateValid = (
        (
            $pendingCheckpointCount -eq 1 -and
            $completedCheckpointCount -eq 0 -and
            $validCommitCount -eq 0
        ) -or
        (
            $pendingCheckpointCount -eq 0 -and
            $completedCheckpointCount -eq 1 -and
            $validCommitCount -eq 1
        )
    )
    if (
        [string]::IsNullOrWhiteSpace($expectedManifestId) -or
        $manifestContent -notmatch "(?m)^id:\s*$([regex]::Escape($expectedManifestId))\s*$" -or
        $manifestContent -notmatch '(?m)^status:\s*approved\s*$' -or
        $manifestContent -notmatch '(?m)^-\s*Gate result:\s*`?APPROVED`?\s*$' -or
        $manifestContent -notmatch '(?m)^-\s*Explicit approver:\s*(?!pending\s*$).+\s*$' -or
        $manifestContent -notmatch $phasePattern -or
        -not $checkpointStateValid -or
        $manifestSha256 -ne "$($marker.approvalManifestSha256)".ToLowerInvariant()
    ) {
        return [pscustomobject]@{ Authorized = $false; AllowedCommands = @() }
    }

    $validatedArtifacts = @()
    $artifactPaths = @{}
    foreach ($artifact in $approvedArtifacts) {
        $relativePath = Normalize-ProjectPath "$($artifact.path)" $Root
        $expectedSha256 = "$($artifact.sha256)".ToLowerInvariant()
        $gitMode = "$($artifact.gitMode)"
        $expectedGitBlobOid = "$($artifact.gitBlobOid)".ToLowerInvariant()
        if (
            -not $relativePath -or
            $relativePath -ieq ".cursor/IMPLEMENTATION_UNLOCK.json" -or
            $relativePath -ieq ".cursor/PHASE_CHECKPOINT_APPROVAL.json" -or
            $expectedSha256 -notmatch '^[0-9a-f]{64}$' -or
            $gitMode -notmatch '^100(644|755)$' -or
            $expectedGitBlobOid -notmatch '^([0-9a-f]{40}|[0-9a-f]{64})$' -or
            $artifactPaths.ContainsKey($relativePath.ToLowerInvariant())
        ) {
            return [pscustomobject]@{ Authorized = $false; AllowedCommands = @() }
        }

        $actualSha256 = if ($relativePath.Equals($manifestRelative, [StringComparison]::OrdinalIgnoreCase)) {
            $manifestSha256
        } else {
            $artifactPath = Join-Path $Root $relativePath
            if (-not (Test-Path $artifactPath -PathType Leaf)) {
                return [pscustomobject]@{ Authorized = $false; AllowedCommands = @() }
            }
            (Get-FileHash -LiteralPath $artifactPath -Algorithm SHA256).Hash.ToLowerInvariant()
        }
        if ($actualSha256 -ne $expectedSha256) {
            return [pscustomobject]@{ Authorized = $false; AllowedCommands = @() }
        }
        if (-not ($testMode -and $relativePath.Equals($manifestRelative, [StringComparison]::OrdinalIgnoreCase))) {
            $actualGitBlobOid = "$(& git -C $Root hash-object --path="$relativePath" -- "$relativePath")".Trim().ToLowerInvariant()
            if ($LASTEXITCODE -ne 0 -or $actualGitBlobOid -ne $expectedGitBlobOid) {
                return [pscustomobject]@{ Authorized = $false; AllowedCommands = @() }
            }
        }

        $artifactPaths[$relativePath.ToLowerInvariant()] = $true
        $validatedArtifacts += [pscustomobject]@{
            Path = $relativePath
            Sha256 = $expectedSha256
            GitMode = $gitMode
            GitBlobOid = $expectedGitBlobOid
        }
    }
    if (-not $artifactPaths.ContainsKey($manifestRelative.ToLowerInvariant())) {
        return [pscustomobject]@{ Authorized = $false; AllowedCommands = @() }
    }

    foreach ($command in $allowedCommands) {
        $trimmed = "$command".Trim()
        $validAdd = $trimmed -in @('git add -A', 'git add --all')
        $validCommit = $trimmed -match '^git commit(?: --trailer "Co-authored-by: Cursor <cursoragent@cursor\.com>")? -m "[A-Za-z0-9 .:_-]{1,120}"$'
        if (-not $validAdd -and -not $validCommit) {
            return [pscustomobject]@{ Authorized = $false; AllowedCommands = @() }
        }
    }

    return [pscustomobject]@{
        Authorized = $true
        AllowedCommands = $allowedCommands
        ApprovedArtifacts = $validatedArtifacts
    }
}

function Test-CheckpointShellCommand {
    param(
        [string]$Command,
        [object]$CheckpointAuthorization,
        [string]$Root
    )

    if (-not $CheckpointAuthorization.Authorized) { return $false }
    $trimmed = $Command.Trim()
    foreach ($allowed in $CheckpointAuthorization.AllowedCommands) {
        if ($trimmed.Equals("$allowed".Trim(), [StringComparison]::Ordinal)) {
            if ($env:ARCHITECTURE_GATE_TEST_MODE -eq "1") { return $true }

            $expectedArtifacts = @($CheckpointAuthorization.ApprovedArtifacts)
            $expected = @($expectedArtifacts.Path | Sort-Object)
            $actual = if ($trimmed -match '^git add ') {
                @(& git -C $Root -c core.quotePath=false status --porcelain=v1 --untracked-files=all |
                    ForEach-Object {
                        if ($_.Length -lt 4 -or $_.Substring(3) -match ' -> ') { return "__INVALID__" }
                        $_.Substring(3).Replace('\', '/')
                    } | Sort-Object)
            } else {
                @(& git -C $Root -c core.quotePath=false diff --cached --name-only |
                    ForEach-Object { "$_".Replace('\', '/') } | Sort-Object)
            }
            if ($LASTEXITCODE -ne 0 -or $actual.Count -ne $expected.Count) { return $false }
            for ($index = 0; $index -lt $expected.Count; $index++) {
                if (-not $actual[$index].Equals($expected[$index], [StringComparison]::OrdinalIgnoreCase)) {
                    return $false
                }
            }
            if ($trimmed -match '^git commit ') {
                foreach ($artifact in $expectedArtifacts) {
                    $stageLine = @(& git -C $Root -c core.quotePath=false ls-files --stage -- "$($artifact.Path)")
                    if ($LASTEXITCODE -ne 0 -or $stageLine.Count -ne 1) { return $false }
                    $stageMatch = [regex]::Match("$($stageLine[0])", '^([0-9]{6})\s+([0-9a-fA-F]+)\s+0\t')
                    if (
                        -not $stageMatch.Success -or
                        $stageMatch.Groups[1].Value -ne "$($artifact.GitMode)" -or
                        $stageMatch.Groups[2].Value.ToLowerInvariant() -ne "$($artifact.GitBlobOid)"
                    ) {
                        return $false
                    }
                }
            }
            return $true
        }
    }
    return $false
}

function Test-AuthorizedPath {
    param([string]$RelativePath, [object[]]$AllowedPatterns)

    foreach ($rawPattern in $AllowedPatterns) {
        $pattern = "$rawPattern".Replace('\', '/').Trim()
        if ($pattern.EndsWith('/**', [StringComparison]::Ordinal)) {
            $prefix = $pattern.Substring(0, $pattern.Length - 2)
            if ($RelativePath.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) {
                return $true
            }
        } elseif ($RelativePath.Equals($pattern, [StringComparison]::OrdinalIgnoreCase)) {
            return $true
        }
    }
    return $false
}

function Test-KnownReadOnlyTool {
    param([string]$ToolName)

    return $ToolName -match '^(Read|ReadFile|Glob|Grep|rg|Search|SearchConversations|WebSearch|WebFetch|Task|Subagent|AskQuestion|TodoWrite|GetDynamicTools|AwaitShell|SwitchMode)$'
}

function Test-ExactAuthorizedShellCommand {
    param([string]$Command, [object[]]$AllowedCommands)

    $trimmed = $Command.Trim()
    if ($trimmed -match '[;|><\r\n]') { return $false }
    foreach ($allowed in $AllowedCommands) {
        if ($trimmed.Equals("$allowed".Trim(), [StringComparison]::Ordinal)) {
            return $true
        }
    }
    return $false
}

function Get-ImplementationAuthorization {
    param([string]$Root, [object]$Policy)

    $policyAuthorized = $Policy.implementationAuthorized -eq $true
    $approvedBaseline = "$($Policy.approvedBaseline)"
    $unlock = $null
    $testMode = $env:ARCHITECTURE_GATE_TEST_MODE -eq "1"

    if ($testMode -and $env:ARCHITECTURE_GATE_TEST_POLICY_AUTHORIZED) {
        $policyAuthorized = $env:ARCHITECTURE_GATE_TEST_POLICY_AUTHORIZED -eq "true"
        $approvedBaseline = "$($env:ARCHITECTURE_GATE_TEST_APPROVED_BASELINE)"
    }

    if (-not $policyAuthorized) {
        return [pscustomobject]@{ Authorized = $false; AllowedPaths = @(); Reason = "Policy is locked." }
    }

    try {
        if ($testMode -and $env:ARCHITECTURE_GATE_TEST_UNLOCK_JSON) {
            $unlock = $env:ARCHITECTURE_GATE_TEST_UNLOCK_JSON | ConvertFrom-Json
        } else {
            $unlockPath = Join-Path $Root "$($Policy.unlockMarker)"
            if (-not (Test-Path $unlockPath)) {
                return [pscustomobject]@{ Authorized = $false; AllowedPaths = @(); Reason = "Unlock marker is missing." }
            }
            $unlock = [IO.File]::ReadAllText($unlockPath) | ConvertFrom-Json
        }
    } catch {
        return [pscustomobject]@{ Authorized = $false; AllowedPaths = @(); Reason = "Unlock marker is malformed." }
    }

    $allowedPaths = @($unlock.allowedWritePaths)
    $allowedShellCommands = @($unlock.allowedShellCommands)
    $parsedDate = [DateTimeOffset]::MinValue
    $dateValid = [DateTimeOffset]::TryParse("$($unlock.approvedAt)", [ref]$parsedDate)
    if (
        $unlock.version -ne 1 -or
        $unlock.implementationAuthorized -ne $true -or
        [string]::IsNullOrWhiteSpace("$($unlock.approvedBy)") -or
        -not $dateValid -or
        $parsedDate -gt [DateTimeOffset]::Now -or
        [string]::IsNullOrWhiteSpace("$($unlock.approvedBaseline)") -or
        $allowedPaths.Count -lt 1 -or
        -not ($unlock.PSObject.Properties.Name -contains "allowedShellCommands") -or
        "$($unlock.approvedBaseline)" -ne $approvedBaseline
    ) {
        return [pscustomobject]@{ Authorized = $false; AllowedPaths = @(); Reason = "Unlock marker fields do not match policy." }
    }

    $baselineRelative = Normalize-ProjectPath "$($unlock.approvedBaseline)" $Root
    $baselinePath = if ($baselineRelative) { Join-Path $Root $baselineRelative } else { "" }
    $baselineExists = if ($testMode -and $env:ARCHITECTURE_GATE_TEST_BASELINE_EXISTS) {
        $env:ARCHITECTURE_GATE_TEST_BASELINE_EXISTS -eq "true"
    } else {
        $baselineRelative -and (Test-Path $baselinePath)
    }
    if (
        -not $baselineRelative -or
        -not $baselineRelative.StartsWith("docs/00-governance/approved-baselines/", [StringComparison]::OrdinalIgnoreCase) -or
        -not $baselineRelative.EndsWith(".md", [StringComparison]::OrdinalIgnoreCase) -or
        -not $baselineExists
    ) {
        return [pscustomobject]@{ Authorized = $false; AllowedPaths = @(); Reason = "Approved baseline is invalid or missing." }
    }

    $baselineContent = if ($testMode -and $env:ARCHITECTURE_GATE_TEST_BASELINE_CONTENT) {
        $env:ARCHITECTURE_GATE_TEST_BASELINE_CONTENT
    } else {
        [IO.File]::ReadAllText($baselinePath)
    }
    $baselineFileName = [IO.Path]::GetFileName($baselineRelative)
    $baselineIdMatch = [regex]::Match($baselineFileName, '^(APR-[0-9]{3,})-')
    $expectedBaselineId = if ($baselineIdMatch.Success) { $baselineIdMatch.Groups[1].Value } else { "" }
    if (
        $baselineRelative -notmatch '^docs/00-governance/approved-baselines/APR-[0-9]{3,}-.+\.md$' -or
        [string]::IsNullOrWhiteSpace($expectedBaselineId) -or
        $baselineContent -notmatch "(?m)^id:\s*$([regex]::Escape($expectedBaselineId))\s*$" -or
        $baselineContent -notmatch '(?m)^status:\s*approved\s*$' -or
        $baselineContent -notmatch '(?m)^-\s*Gate result:\s*`?APPROVED`?\s*$' -or
        $baselineContent -notmatch '(?m)^-\s*Explicit approver:\s*(?!pending\s*$).+\s*$' -or
        $baselineContent -notmatch '(?m)^-\s*Git commit:\s*(?:[0-9a-fA-F]{40,64}|`[0-9a-fA-F]{40,64}`)\s*$'
    ) {
        return [pscustomobject]@{ Authorized = $false; AllowedPaths = @(); Reason = "Approved baseline manifest is not authoritative." }
    }

    foreach ($rawPattern in $allowedPaths) {
        $pattern = "$rawPattern".Replace('\', '/').Trim()
        if (
            [string]::IsNullOrWhiteSpace($pattern) -or
            [IO.Path]::IsPathRooted($pattern) -or
            $pattern -match '(^|/)\.\.(/|$)' -or
            $pattern -in @(".", "*", "**", "/") -or
            ($pattern.Contains("*") -and -not $pattern.EndsWith("/**", [StringComparison]::Ordinal)) -or
            $pattern.StartsWith(".cursor/", [StringComparison]::OrdinalIgnoreCase)
        ) {
            return [pscustomobject]@{ Authorized = $false; AllowedPaths = @(); Reason = "Unlock path scope is unsafe." }
        }
    }

    foreach ($rawCommand in $allowedShellCommands) {
        $allowedCommand = "$rawCommand".Trim()
        if ([string]::IsNullOrWhiteSpace($allowedCommand) -or $allowedCommand -match '[;|><\r\n]') {
            return [pscustomobject]@{ Authorized = $false; AllowedPaths = @(); Reason = "Unlock shell scope is unsafe." }
        }
    }

    return [pscustomobject]@{
        Authorized = $true
        AllowedPaths = $allowedPaths
        AllowedShellCommands = $allowedShellCommands
        Reason = "Validated."
    }
}

try {
    $rawInput = [Console]::In.ReadToEnd()
    $rawInput = $rawInput.TrimStart([char]0xFEFF)
    $jsonStart = $rawInput.IndexOf('{')
    if ($jsonStart -gt 0 -and $jsonStart -le 3) {
        $rawInput = $rawInput.Substring($jsonStart)
    }
    if ([string]::IsNullOrWhiteSpace($rawInput)) {
        Emit-Permission deny "Architecture gate received empty input." "Deny malformed hook input while implementation is locked."
    }

    $event = $rawInput | ConvertFrom-Json
    $rootCandidate = if ($env:CURSOR_PROJECT_DIR) {
        $env:CURSOR_PROJECT_DIR
    } elseif ($event.workspace_roots -and $event.workspace_roots.Count -gt 0) {
        $event.workspace_roots[0]
    } else {
        Join-Path $PSScriptRoot "..\.."
    }
    if ("$rootCandidate" -match '^/[A-Za-z]:/') {
        $rootCandidate = "$rootCandidate".Substring(1)
    }
    $root = [IO.Path]::GetFullPath($rootCandidate)
    $policyPath = Join-Path $root ".cursor\architecture-gate.json"
    if (-not (Test-Path $policyPath)) {
        Emit-Permission deny "Architecture policy is missing." "Implementation remains locked."
    }
    $policy = [IO.File]::ReadAllText($policyPath) | ConvertFrom-Json
    $authorization = Get-ImplementationAuthorization $root $policy
    $checkpointAuthorization = Get-CheckpointAuthorization $root $policy

    $eventName = "$($event.hook_event_name)"
    if ([string]::IsNullOrWhiteSpace($eventName)) {
        Emit-Permission deny "Architecture gate received an unknown event." "Deny hook input without hook_event_name."
    }

    if ($eventName -eq "beforeShellExecution") {
        $command = "$($event.command)"
        if ([string]::IsNullOrWhiteSpace($command)) {
            Emit-Permission deny "Shell command blocked: command text was unavailable." "Use dedicated read-only tools during architecture-only work."
        }

        if ($authorization.Authorized) {
            if (Test-ReadOnlyShellCommand $command) {
                Emit-Permission allow
            }
            if (Test-ExactAuthorizedShellCommand $command $authorization.AllowedShellCommands) {
                Emit-Permission ask "This exact shell command is in the approved implementation scope." "Confirm the authorized implementation action."
            }
            Emit-Permission deny "Shell command is outside the approved implementation scope." "Add the exact command through a new human-approved unlock marker."
        }

        if (
            (Test-ReadOnlyShellCommand $command) -or
            (Test-CheckpointShellCommand $command $checkpointAuthorization $root)
        ) {
            Emit-Permission allow
        }
        Emit-Permission deny "Shell command blocked by the architecture-only gate." "Use dedicated read-only tools or architecture Markdown edits; do not generate implementation artifacts."
    }

    if ($eventName -ne "preToolUse") {
        Emit-Permission deny "Unsupported hook event blocked." "Register this script only for preToolUse and beforeShellExecution."
    }

    $toolName = "$($event.tool_name)"
    $toolInput = $event.tool_input
    if ([string]::IsNullOrWhiteSpace($toolName) -or $null -eq $toolInput) {
        Emit-Permission deny "Tool action blocked: tool_name or tool_input was unavailable." "Deny malformed preToolUse input."
    }

    if ($toolName -eq "Shell") {
        $command = "$($toolInput.command)"
        if ([string]::IsNullOrWhiteSpace($command)) {
            Emit-Permission deny "Shell command blocked: command text was unavailable." "Use dedicated read-only tools during architecture-only work."
        }
        if ($authorization.Authorized) {
            if (
                (Test-ReadOnlyShellCommand $command) -or
                (Test-ExactAuthorizedShellCommand $command $authorization.AllowedShellCommands)
            ) {
                Emit-Permission allow
            }
            Emit-Permission deny "Shell command is outside the approved implementation scope." "Add the exact command through a new human-approved unlock marker."
        }
        if (
            (Test-ReadOnlyShellCommand $command) -or
            (Test-CheckpointShellCommand $command $checkpointAuthorization $root)
        ) {
            Emit-Permission allow
        }
        Emit-Permission deny "Shell command blocked by the architecture-only gate." "Use dedicated read-only tools or architecture Markdown edits; do not generate implementation artifacts."
    }

    if (Test-KnownReadOnlyTool $toolName) {
        Emit-Permission allow
    }

    if (
        $toolName -eq "CallDynamicTool" -and
        "$($toolInput.namespace)" -eq "cursor" -and
        "$($toolInput.toolName)" -match '^(CreateGoal|UpdateGoal)$'
    ) {
        Emit-Permission allow
    }

    if (
        $toolName -eq "FetchMcpResource" -and
        -not ($toolInput.PSObject.Properties.Name -contains "downloadPath")
    ) {
        Emit-Permission allow
    }

    $writeTool = (
        $toolName -match '(?i)(applypatch|write|edit|delete|remove|notebook)' -or
        $toolName -eq "FetchMcpResource"
    )
    if (-not $writeTool) {
        Emit-Permission deny "Unknown tool blocked by the architecture gate: $toolName" "Register and review the tool classification before use."
    }

    if ($toolName -match '(?i)(delete|remove)' -or "$rawInput" -match '(?m)^\*\*\*\s+Delete File:') {
        Emit-Permission deny "Delete/rename operations are blocked during architecture-only work." "Preserve history and use supersession records."
    }

    $candidatePaths = New-Object System.Collections.Generic.List[string]
    foreach ($propertyName in @("path", "file_path", "filePath", "target_file", "targetFile", "target_notebook", "downloadPath")) {
        $value = if ($toolInput -is [string]) { $null } else { $toolInput.$propertyName }
        if ($value) { $candidatePaths.Add("$value") }
    }

    $patchText = if ($toolInput -is [string]) {
        "$toolInput"
    } elseif ($toolInput.patch) {
        "$($toolInput.patch)"
    } else {
        $rawInput
    }
    foreach ($match in [regex]::Matches($patchText, '(?m)^\*\*\*\s+(?:Add|Update) File:\s*(.+?)\s*$')) {
        $candidatePaths.Add($match.Groups[1].Value)
    }

    if ($candidatePaths.Count -eq 0) {
        Emit-Permission deny "Write blocked: target path could not be verified." "Provide a single allowlisted architecture-document path."
    }

    foreach ($candidate in $candidatePaths) {
        $relativePath = Normalize-ProjectPath $candidate $root
        if ($null -eq $relativePath) {
            Emit-Permission deny "Write outside the project or through traversal was blocked." "Keep architecture artifacts inside the project allowlist."
        }
        if (Test-ProtectedPath $relativePath) {
            Emit-Permission deny "Architecture gate controls are protected after activation." "A human must disable or change the gate controls."
        }
        if ($authorization.Authorized) {
            if (-not (Test-AuthorizedPath $relativePath $authorization.AllowedPaths)) {
                Emit-Permission deny "Write is outside the approved implementation scope: $relativePath" "Use only paths listed in the validated implementation unlock marker."
            }
        } elseif (-not (Test-AllowedArchitecturePath $relativePath)) {
            Emit-Permission deny "Non-document implementation write blocked: $relativePath" "Implementation remains unauthorized; update architecture Markdown or register a question/ADR."
        }
    }

    Emit-Permission allow
} catch {
    Emit-Permission deny "Architecture gate failed closed." "Malformed or unsupported hook input was denied."
}
