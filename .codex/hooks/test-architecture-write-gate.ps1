$ErrorActionPreference = "Stop"
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
$evaluator = Join-Path $PSScriptRoot "architecture-write-gate.ps1"
$gatePath = Join-Path $root ".cursor\architecture-gate.json"
$gate = [IO.File]::ReadAllText($gatePath) | ConvertFrom-Json
if ($gate.implementationAuthorized -ne $false -or $null -ne $gate.approvedBaseline) {
    throw "Synthetic bootstrap tests require the locked canonical gate."
}
if (Test-Path -LiteralPath (Join-Path $root ".codex\architecture-gate.json")) {
    throw "Duplicate authorization source found."
}
$temporaryHookWrites = @($gate.allowedWritePathsWhileLocked) -contains ".codex/hooks.json"
$hookExpected = if ($temporaryHookWrites) { "allow" } else { "deny" }

function Invoke-Vector {
    param([string]$ToolName, [object]$ToolInput)

    $payload = @{
        hook_event_name = "PreToolUse"
        tool_name = $ToolName
        tool_input = $ToolInput
        cwd = $root
    } | ConvertTo-Json -Depth 20 -Compress
    $start = New-Object Diagnostics.ProcessStartInfo
    $start.FileName = (Join-Path $PSHOME "powershell.exe")
    $start.Arguments = '-NoProfile -ExecutionPolicy Bypass -File "' + $evaluator + '"'
    $start.UseShellExecute = $false
    $start.CreateNoWindow = $true
    $start.RedirectStandardInput = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $process = [Diagnostics.Process]::Start($start)
    try {
        $process.StandardInput.Write($payload)
        $process.StandardInput.Close()
        $stdout = $process.StandardOutput.ReadToEnd().Trim()
        $stderr = $process.StandardError.ReadToEnd()
        if (-not $process.WaitForExit(30000)) {
            $process.Kill()
            throw "Evaluator timeout."
        }
        if ($process.ExitCode -ne 0 -or -not [string]::IsNullOrWhiteSpace($stderr)) {
            throw "Evaluator process failure: $stderr"
        }
        if ([string]::IsNullOrWhiteSpace($stdout)) { return "allow" }
        $answer = $stdout | ConvertFrom-Json
        if ($answer.hookSpecificOutput.hookEventName -ne "PreToolUse" -or
            $answer.hookSpecificOutput.permissionDecision -ne "deny") {
            throw "Unexpected hook output: $stdout"
        }
        return "deny"
    } finally {
        $process.Dispose()
    }
}

function New-Patch {
    param([string]$Directive, [string]$Body = "+test")
    $newline = [Environment]::NewLine
    return "*** Begin Patch" + $newline + $Directive + $newline +
        $Body + $newline + "*** End Patch"
}

$vectors = @(
    @{ Name = "documentation"; Tool = "apply_patch"; Input = @{ command = (New-Patch "*** Add File: docs/bootstrap-check.md") }; Expect = "allow" },
    @{ Name = "root instructions"; Tool = "apply_patch"; Input = @{ command = (New-Patch "*** Add File: AGENTS.md") }; Expect = "allow" },
    @{ Name = "hook definition"; Tool = "apply_patch"; Input = @{ command = (New-Patch "*** Update File: .codex/hooks.json") }; Expect = $hookExpected },
    @{ Name = "hook evaluator"; Tool = "apply_patch"; Input = @{ command = (New-Patch "*** Update File: .codex/hooks/architecture-write-gate.ps1") }; Expect = $hookExpected },
    @{ Name = "hook test helper"; Tool = "apply_patch"; Input = @{ command = (New-Patch "*** Update File: .codex/hooks/test-architecture-write-gate.ps1") }; Expect = $hookExpected },
    @{ Name = "unrelated codex path"; Tool = "apply_patch"; Input = @{ command = (New-Patch "*** Add File: .codex/other.json") }; Expect = "deny" },
    @{ Name = "implementation path"; Tool = "apply_patch"; Input = @{ command = (New-Patch "*** Add File: src/index.ts") }; Expect = "deny" },
    @{ Name = "canonical gate"; Tool = "apply_patch"; Input = @{ command = (New-Patch "*** Update File: .cursor/architecture-gate.json") }; Expect = "deny" },
    @{ Name = "implementation unlock"; Tool = "apply_patch"; Input = @{ command = (New-Patch "*** Add File: .cursor/IMPLEMENTATION_UNLOCK.json") }; Expect = "deny" },
    @{ Name = "checkpoint marker"; Tool = "apply_patch"; Input = @{ command = (New-Patch "*** Add File: .cursor/PHASE_CHECKPOINT_APPROVAL.json") }; Expect = "deny" },
    @{ Name = "legacy protected hook"; Tool = "apply_patch"; Input = @{ command = (New-Patch "*** Update File: .cursor/hooks/architecture-write-gate.ps1") }; Expect = "deny" },
    @{ Name = "delete directive"; Tool = "apply_patch"; Input = @{ command = (New-Patch "*** Delete File: docs/obsolete.md" "") }; Expect = "deny" },
    @{ Name = "move directive"; Tool = "apply_patch"; Input = @{ command = (New-Patch "*** Update File: docs/a.md" ("@@"+[Environment]::NewLine+" context"+[Environment]::NewLine+"*** Move to: docs/b.md")) }; Expect = "deny" },
    @{ Name = "mixed decoded delete"; Tool = "apply_patch"; Input = @{ command = (New-Patch "*** Update File: docs/a.md" ("@@"+[Environment]::NewLine+" context"+[Environment]::NewLine+"*** Delete File: docs/b.md")) }; Expect = "deny" },
    @{ Name = "unknown patch directive"; Tool = "apply_patch"; Input = @{ command = (New-Patch "*** Rename File: docs/a.md") }; Expect = "deny" },
    @{ Name = "delete tool"; Tool = "DeleteFile"; Input = @{ path = "docs/a.md" }; Expect = "deny" },
    @{ Name = "unknown write tool"; Tool = "UnknownWriteTool"; Input = @{ path = "docs/a.md" }; Expect = "deny" },
    @{ Name = "other patch workdir"; Tool = "apply_patch"; Input = @{ command = (New-Patch "*** Add File: docs/a.md"); workdir = "C:\Windows" }; Expect = "deny" },
    @{ Name = "other shell workdir"; Tool = "Bash"; Input = @{ command = "git status"; workdir = "C:\Windows" }; Expect = "deny" },    @{ Name = "read-only shell"; Tool = "Bash"; Input = @{ command = "git status" }; Expect = "allow" },
    @{ Name = "arbitrary shell"; Tool = "Bash"; Input = @{ command = "npm install" }; Expect = "deny" },
    @{ Name = "compound shell"; Tool = "Bash"; Input = @{ command = "git status; npm install" }; Expect = "deny" }
)

$passed = 0
foreach ($vector in $vectors) {
    $actual = Invoke-Vector $vector.Tool $vector.Input
    if ($actual -ne $vector.Expect) {
        throw "$($vector.Name): expected $($vector.Expect), got $actual"
    }
    $passed++
}
$tokens = $null
$parseErrors = $null
$ast = [Management.Automation.Language.Parser]::ParseFile($evaluator, [ref]$tokens, [ref]$parseErrors)
if ($parseErrors.Count -ne 0) { throw "Evaluator parse error." }
$function = $ast.Find({ param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq "Test-LockedAllowedPath" }, $true)
if ($null -eq $function) { throw "Canonical allowlist function is missing." }
. ([scriptblock]::Create($function.Extent.Text))
if ((Test-LockedAllowedPath ".codex/hooks.json" @($gate.allowedWritePathsWhileLocked)) -ne $temporaryHookWrites) {
    throw "Canonical gate hook-path status was misread."
}
$passed++
if (Test-LockedAllowedPath ".codex/hooks.json" @("README.md")) {
    throw "Removed canonical gate path remained writable."
}
$passed++
$shellFunction = $ast.Find({ param($node) $node -is [Management.Automation.Language.FunctionDefinitionAst] -and $node.Name -eq "Test-ExactUnlockShellCommand" }, $true)
if ($null -eq $shellFunction) { throw "Exact unlock shell function is missing." }
. ([scriptblock]::Create($shellFunction.Extent.Text))
if (-not (Test-ExactUnlockShellCommand "npm run typecheck" @("npm run typecheck"))) {
    throw "Exact unlocked shell command was rejected."
}
$passed++
if (Test-ExactUnlockShellCommand "npm run typecheck; npm install" @("npm run typecheck")) {
    throw "Broadened unlocked shell command was accepted."
}
$passed++
"PASS: $passed direct synthetic hook vectors; canonical gate is the only authorization file."