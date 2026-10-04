$ErrorActionPreference = "Stop"

function Deny {
    param([string]$Reason)

    @{
        hookSpecificOutput = @{
            hookEventName = "PreToolUse"
            permissionDecision = "deny"
            permissionDecisionReason = $Reason
        }
    } | ConvertTo-Json -Depth 5 -Compress
    exit 0
}

function Get-TargetPath {
    param([string]$Candidate, [string]$Root)

    if ([string]::IsNullOrWhiteSpace($Candidate)) { throw "Missing target path." }
    $candidatePath = $Candidate.Trim().Trim('"').Trim("'")
    if ([string]::IsNullOrWhiteSpace($candidatePath)) { throw "Missing target path." }
    $fullPath = if ([IO.Path]::IsPathRooted($candidatePath)) {
        [IO.Path]::GetFullPath($candidatePath)
    } else {
        [IO.Path]::GetFullPath((Join-Path $Root $candidatePath))
    }
    $rootPrefix = $Root.TrimEnd('\') + '\'
    if (-not $fullPath.StartsWith($rootPrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Target is outside the repository."
    }
    $relativePath = $fullPath.Substring($rootPrefix.Length).Replace('\', '/')
    if ($relativePath.Contains(':') -or $relativePath -match '(^|/)\.\.?(/|$)') {
        throw "Unsafe target path."
    }

    $current = $Root
    foreach ($part in $relativePath.Split('/')) {
        if ([string]::IsNullOrWhiteSpace($part) -or $part.EndsWith('.') -or $part.EndsWith(' ')) {
            throw "Unsafe target component."
        }
        $current = Join-Path $current $part
        $item = Get-Item -LiteralPath $current -Force -ErrorAction SilentlyContinue
        if ($null -ne $item -and ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
            throw "Reparse-point target or ancestor."
        }
    }
    return $relativePath
}

function Test-ProtectedPath {
    param([string]$RelativePath, [object[]]$Patterns)

    foreach ($rawPattern in $Patterns) {
        $pattern = "$rawPattern".Replace('\', '/')
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

function Test-LockedAllowedPath {
    param([string]$RelativePath, [object[]]$AllowedPatterns)

    foreach ($rawPattern in $AllowedPatterns) {
        $pattern = "$rawPattern".Replace('\', '/')
        if ($pattern -in @("README.md", ".gitignore", "AGENTS.md",
            ".codex/hooks.json", ".codex/hooks/architecture-write-gate.ps1",
            ".codex/hooks/test-architecture-write-gate.ps1")) {
            if ($RelativePath.Equals($pattern, [StringComparison]::OrdinalIgnoreCase)) {
                return $true
            }
        } elseif ($pattern -eq "docs/**/*.md") {
            if ($RelativePath.StartsWith("docs/", [StringComparison]::OrdinalIgnoreCase) -and
                $RelativePath.EndsWith(".md", [StringComparison]::OrdinalIgnoreCase)) {
                return $true
            }
        } elseif ($pattern -eq ".cursor/rules/**/*.mdc") {
            if ($RelativePath.StartsWith(".cursor/rules/", [StringComparison]::OrdinalIgnoreCase) -and
                $RelativePath.EndsWith(".mdc", [StringComparison]::OrdinalIgnoreCase)) {
                return $true
            }
        } elseif ($pattern -eq ".cursor/skills/**/*.md") {
            if ($RelativePath.StartsWith(".cursor/skills/", [StringComparison]::OrdinalIgnoreCase) -and
                $RelativePath.EndsWith(".md", [StringComparison]::OrdinalIgnoreCase)) {
                return $true
            }
        }
    }
    return $false
}

function Test-ExactUnlockShellCommand {
    param([string]$Command, [object[]]$AllowedCommands)

    foreach ($allowed in $AllowedCommands) {
        if ($Command.Equals("$allowed", [StringComparison]::Ordinal)) {
            return $true
        }
    }
    return $false
}

function Get-PatchTargets {
    param([string]$Patch, [string]$Root, [object[]]$ProtectedPatterns)

    if ([string]::IsNullOrWhiteSpace($Patch)) { throw "Missing patch text." }
    $lines = [regex]::Split($Patch, "\r?\n")
    $last = $lines.Length - 1
    while ($last -ge 0 -and $lines[$last] -eq "") { $last-- }
    if ($last -lt 2 -or $lines[0] -ne "*** Begin Patch" -or $lines[$last] -ne "*** End Patch") {
        throw "Malformed patch envelope."
    }
    $targets = New-Object System.Collections.Generic.List[string]
    for ($index = 1; $index -lt $last; $index++) {
        $line = $lines[$index]
        if ($line -match '^\*\*\*\s+(?:Delete File:|Move to:)') {
            throw "Delete or move directive is blocked."
        }
        if ($line -match '^\*\*\*\s+(?:Add|Update) File:\s*(.+?)\s*$') {
            $relative = Get-TargetPath $Matches[1] $Root
            if (Test-ProtectedPath $relative $ProtectedPatterns) {
                throw "Protected control path is blocked."
            }
            $targets.Add($relative)
            continue
        }
        if ($line.StartsWith("***", [StringComparison]::Ordinal) -and $line -ne "*** End of File") {
            throw "Unknown patch directive."
        }
    }
    if ($targets.Count -eq 0) { throw "Patch has no verified target." }
    return ,$targets.ToArray()
}

function Invoke-CursorPolicy {
    param([string]$ToolName, [object]$ToolInput, [string]$Root)

    $scriptPath = Join-Path $Root ".cursor\hooks\architecture-write-gate.ps1"
    if (-not (Test-Path -LiteralPath $scriptPath -PathType Leaf)) {
        throw "Protected policy evaluator is missing."
    }
    $inputJson = @{
        hook_event_name = "preToolUse"
        tool_name = $ToolName
        tool_input = $ToolInput
        workspace_roots = @($Root)
    } | ConvertTo-Json -Depth 20 -Compress

    $start = New-Object Diagnostics.ProcessStartInfo
    $start.FileName = (Join-Path $PSHOME "powershell.exe")
    $start.Arguments = '-NoProfile -ExecutionPolicy Bypass -File "' + $scriptPath + '"'
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardInput = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $start.EnvironmentVariables["CURSOR_PROJECT_DIR"] = $Root
    $process = [Diagnostics.Process]::Start($start)
    try {
        $process.StandardInput.Write($inputJson)
        $process.StandardInput.Close()
        $resultText = $process.StandardOutput.ReadToEnd()
        $errorText = $process.StandardError.ReadToEnd()
        if (-not $process.WaitForExit(20000)) {
            $process.Kill()
            throw "Protected evaluator timed out."
        }
        if ($process.ExitCode -ne 0 -or [string]::IsNullOrWhiteSpace($resultText)) {
            throw "Protected evaluator failed."
        }
        $decision = $resultText | ConvertFrom-Json
        if ("$($decision.permission)" -ne "allow") {
            throw "Protected evaluator denied the action."
        }
    } finally {
        $process.Dispose()
    }
}

try {
    $root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
    if ((Get-Item -LiteralPath $root -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) {
        throw "Repository root is a reparse point."
    }
    $gatePath = Join-Path $root ".cursor\architecture-gate.json"
    if (-not (Test-Path -LiteralPath $gatePath -PathType Leaf)) {
        throw "Canonical gate is missing."
    }
    $policy = [IO.File]::ReadAllText($gatePath) | ConvertFrom-Json
    if (
        $policy.version -ne 1 -or
        $policy.enforcement -ne "locked" -or
        $policy.unknownWriteOperation -ne "deny" -or
        $policy.deleteOrRenameWhileLocked -ne "deny" -or
        $policy.unlockMarker -ne ".cursor/IMPLEMENTATION_UNLOCK.json" -or
        $policy.checkpointMarker -ne ".cursor/PHASE_CHECKPOINT_APPROVAL.json"
    ) {
        throw "Canonical gate has unexpected control semantics."
    }
    $requiredProtected = @(
        ".cursor/architecture-gate.json",
        ".cursor/hooks.json",
        ".cursor/hooks/**",
        ".cursor/IMPLEMENTATION_UNLOCK.json",
        ".cursor/PHASE_CHECKPOINT_APPROVAL.json"
    )
    foreach ($required in $requiredProtected) {
        if (@($policy.protectedPaths) -notcontains $required) {
            throw "Canonical gate omitted a protected control."
        }
    }
    if ($policy.implementationAuthorized -ne $true) {
        if ($policy.mode -ne "architecture-only" -or $null -ne $policy.approvedBaseline) {
            throw "Locked gate state is inconsistent."
        }
        $knownLocked = @(
            "README.md", ".gitignore", "docs/**/*.md",
            ".cursor/rules/**/*.mdc", ".cursor/skills/**/*.md",
            "AGENTS.md", ".codex/hooks.json",
            ".codex/hooks/architecture-write-gate.ps1",
            ".codex/hooks/test-architecture-write-gate.ps1"
        )
        foreach ($path in @($policy.allowedWritePathsWhileLocked)) {
            if ($knownLocked -notcontains "$path") {
                throw "Unexpected locked write scope."
            }
        }
    }

    $raw = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($raw)) { throw "Empty hook input." }
    $event = $raw | ConvertFrom-Json
    if ("$($event.hook_event_name)" -ne "PreToolUse") { throw "Unexpected hook event." }
    $toolName = "$($event.tool_name)"
    if ([string]::IsNullOrWhiteSpace($toolName) -or $null -eq $event.tool_input) {
        throw "Missing tool name or input."
    }

    if ($toolName -eq "Bash" -or $toolName -eq "apply_patch") {
        if ([string]::IsNullOrWhiteSpace("$($event.cwd)")) {
            throw "Tool working directory is missing."
        }
        $sessionDirectory = [IO.Path]::GetFullPath("$($event.cwd)")
        if (-not $sessionDirectory.Equals($root, [StringComparison]::OrdinalIgnoreCase)) {
            throw "Tool session is outside the repository root."
        }
        if ($event.tool_input.workdir) {
            $requestedDirectory = [IO.Path]::GetFullPath("$($event.tool_input.workdir)")
            if (-not $requestedDirectory.Equals($root, [StringComparison]::OrdinalIgnoreCase)) {
                throw "Tool workdir differs from the repository root."
            }
        }
    }

function Test-LockedReadOnlyGovernanceCommand {
    param([string]$Command)

    if ([string]::IsNullOrWhiteSpace($Command)) {
        return $false
    }

    # No compound commands, pipelines, redirection, chaining, substitution, or multiline shell.
    if ($Command -match '[;&|><`]' -or $Command.Contains("`r") -or $Command.Contains("`n")) {
        return $false
    }

    $allowedPaths = @(
        "README.md",
        "docs/00-governance/CURRENT_PHASE.md",
        "docs/00-governance/registers/DECISIONS.md",
        "docs/00-governance/registers/OPEN_QUESTIONS.md",
        "docs/10-ai-cursor-development/AGENT_AUTHORITY.md",
        "docs/00-governance/APPROVALS.md",
        "docs/12-implementation-planning/IMPLEMENTATION_READINESS.md",
        ".codex/hooks.json",
        ".codex/hooks/architecture-write-gate.ps1",
        ".codex/hooks/test-architecture-write-gate.ps1",
        ".cursor/architecture-gate.json",
        ".cursor/hooks/architecture-write-gate.ps1"
        "docs/10-ai-cursor-development/CODEX_CONTROL_BOOTSTRAP.md",
        "docs/10-ai-cursor-development/TOOL_MCP_HOOK_SAFETY.md",
        "docs/10-ai-cursor-development/CODEX_READINESS_READ_REVIEW.md"
    )

    foreach ($path in $allowedPaths) {
        $escaped = [regex]::Escape($path)

        if (
            $Command -match ('^Get-Content\s+-LiteralPath\s+["'']?' + $escaped + '["'']?$')
        ) {
            return $true
        }
    }

    return $false
}

    if ($toolName -eq "Bash") {
        $command = "$($event.tool_input.command)"
        if ([string]::IsNullOrWhiteSpace($command)) { throw "Missing shell command." }

        if ($policy.implementationAuthorized -eq $true) {
            $unlockPath = Join-Path $root ".cursor\IMPLEMENTATION_UNLOCK.json"
            if (-not (Test-Path -LiteralPath $unlockPath -PathType Leaf)) {
                throw "Implementation unlock is missing."
            }

            $unlock = [IO.File]::ReadAllText($unlockPath) | ConvertFrom-Json
            if ($unlock.implementationAuthorized -ne $true -or
                "$($unlock.approvedBaseline)" -ne "$($policy.approvedBaseline)") {
                throw "Implementation unlock does not match the gate."
            }

            if (-not (Test-ExactUnlockShellCommand $command @($unlock.allowedShellCommands))) {
                throw "Shell command is not in the exact unlock list."
            }

            Invoke-CursorPolicy "Shell" @{ command = $command } $root
            exit 0
        }

        if (Test-LockedReadOnlyGovernanceCommand $command) {
            exit 0
        }

        Invoke-CursorPolicy "Shell" @{ command = $command } $root
        exit 0
    }

    if ($toolName -eq "apply_patch") {
        $patch = $event.tool_input.command
        if ($patch -isnot [string]) { throw "Missing decoded patch command." }
        $targets = Get-PatchTargets $patch $root @($policy.protectedPaths)
        if ($policy.implementationAuthorized -ne $true) {
            foreach ($target in $targets) {
                if (-not (Test-LockedAllowedPath $target @($policy.allowedWritePathsWhileLocked))) {
                    throw "Target is outside the canonical locked write list."
                }
            }
        }
        Invoke-CursorPolicy "ApplyPatch" @{ patch = $patch } $root
        exit 0
    }

    $readOnlyTools = @(
        "Read", "ReadFile", "Glob", "Grep", "rg", "Search",
        "SearchConversations", "WebSearch", "WebFetch",
        "Task", "Subagent", "Agent", "AskQuestion", "TodoWrite",
        "GetDynamicTools", "AwaitShell", "SwitchMode", "update_plan",
        "get_goal", "view_image", "clock__curr_time",
        "list_mcp_resources", "list_mcp_resource_templates",
        "read_mcp_resource",
        "collaborationspawn_agent"
    )
    if ($readOnlyTools -contains $toolName) { exit 0 }
    throw "Unclassified tool operation."
} catch {
    Deny "Codex governance guard denied: $($_.Exception.Message)"
}