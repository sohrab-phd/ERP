param(
    [string]$ApprovedBy = "Project Owner (explicit approval in Cursor session)",
    [string]$CommitMessage = "docs: approve phase 00 governance foundation"
)

$ErrorActionPreference = "Stop"
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\.."))
$manifestRelative = "docs/00-governance/approved-baselines/APR-002-governance.md"
$manifestPath = Join-Path $root $manifestRelative
$markerPath = Join-Path $root ".cursor\PHASE_CHECKPOINT_APPROVAL.json"

if ([string]::IsNullOrWhiteSpace($ApprovedBy)) {
    throw "ApprovedBy must identify the human approver."
}
if ($CommitMessage -notmatch '^[A-Za-z0-9 .:_-]{1,120}$') {
    throw "CommitMessage contains unsupported characters or length."
}
if (-not (Test-Path (Join-Path $root ".cursor\hooks.json") -PathType Leaf)) {
    throw "Restore .cursor/hooks.json before generating the checkpoint marker."
}
if (Test-Path (Join-Path $root ".cursor\hooks.disabled")) {
    throw "Remove the maintenance copy before generating the checkpoint marker."
}
if (-not (Test-Path $manifestPath -PathType Leaf)) {
    throw "APR-002 approval manifest is missing."
}

& git -C $root diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    throw "The Git index must be empty before checkpoint authorization."
}

$changedPaths = @(
    & git -C $root -c core.quotePath=false status --porcelain=v1 --untracked-files=all |
        ForEach-Object {
            if ($_.Length -lt 4 -or $_.Substring(3) -match ' -> ') {
                throw "Rename or unparseable Git status entry is not supported: $_"
            }
            if ($_.Substring(0, 2) -match 'D') {
                throw "Deleted files require separate reconciliation: $_"
            }
            $_.Substring(3).Replace('\', '/')
        } |
        Where-Object {
            $_ -notin @(
                ".cursor/IMPLEMENTATION_UNLOCK.json",
                ".cursor/PHASE_CHECKPOINT_APPROVAL.json"
            )
        } |
        Sort-Object -Unique
)

if ($changedPaths.Count -eq 0) {
    throw "No checkpoint content was found."
}
if ($manifestRelative -notin $changedPaths) {
    throw "The APR-002 manifest is not part of the checkpoint content."
}

$approvedArtifacts = foreach ($relativePath in $changedPaths) {
    $fullPath = Join-Path $root $relativePath
    if (-not (Test-Path $fullPath -PathType Leaf)) {
        throw "Checkpoint entry is not a regular file: $relativePath"
    }
    $blobOid = "$(& git -C $root hash-object --path="$relativePath" -- "$relativePath")".Trim()
    if ($LASTEXITCODE -ne 0 -or $blobOid -notmatch '^([0-9a-f]{40}|[0-9a-f]{64})$') {
        throw "Unable to calculate Git blob identity: $relativePath"
    }
    @{
        path = $relativePath
        sha256 = (Get-FileHash -LiteralPath $fullPath -Algorithm SHA256).Hash.ToLowerInvariant()
        gitMode = "100644"
        gitBlobOid = $blobOid
    }
}

$approvedAt = [DateTimeOffset]::Now
$marker = [ordered]@{
    version = 1
    approvedBy = $ApprovedBy
    approvedAt = $approvedAt.ToString("o")
    expiresAt = $approvedAt.AddHours(1).ToString("o")
    phase = "00-governance"
    approvalManifest = $manifestRelative
    approvalManifestSha256 = (
        Get-FileHash -LiteralPath $manifestPath -Algorithm SHA256
    ).Hash.ToLowerInvariant()
    approvedArtifacts = @($approvedArtifacts)
    allowedGitCommands = @(
        "git add -A",
        "git commit --trailer `"Co-authored-by: Cursor <cursoragent@cursor.com>`" -m `"$CommitMessage`""
    )
}

$json = $marker | ConvertTo-Json -Depth 6
[IO.File]::WriteAllText($markerPath, $json, (New-Object Text.UTF8Encoding($false)))
Write-Output "Created protected checkpoint marker for $($approvedArtifacts.Count) exact files."
Write-Output "Expires at $($marker.expiresAt)."
