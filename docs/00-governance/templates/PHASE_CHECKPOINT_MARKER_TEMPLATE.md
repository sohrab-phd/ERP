---
id: TEMPLATE-CHECKPOINT-MARKER
title: Phase Checkpoint Marker Template
phase: 00-governance
status: approved
version: 0.3.0
owners: [project-sponsor]
depends_on: [GOV-GATES-001]
last_reviewed: 2026-09-04
approval: APR-002
supersedes: null
---

# Phase Checkpoint Marker Template

After explicit phase approval, a human—not an agent—may create the protected file
`.cursor/PHASE_CHECKPOINT_APPROVAL.json`:

```json
{
  "version": 1,
  "approvedBy": "Named approver",
  "approvedAt": "2026-09-04T13:00:00+03:30",
  "expiresAt": "2026-09-04T14:00:00+03:30",
  "phase": "00-governance",
  "approvalManifest": "docs/00-governance/approved-baselines/APR-000-governance.md",
  "approvalManifestSha256": "<64-lowercase-hex-digest>",
  "approvedArtifacts": [
    {
      "path": "docs/00-governance/approved-baselines/APR-000-governance.md",
      "sha256": "<64-lowercase-hex-digest>",
      "gitMode": "100644",
      "gitBlobOid": "<Git hash-object result after clean filters>"
    },
    {
      "path": "docs/00-governance/GATE_CHECKLIST.md",
      "sha256": "<64-lowercase-hex-digest>",
      "gitMode": "100644",
      "gitBlobOid": "<Git hash-object result after clean filters>"
    }
  ],
  "allowedGitCommands": [
    "git add -A",
    "git commit -m \"docs: approve phase 00 governance foundation\""
  ]
}
```

Requirements:

- The referenced manifest exists, records approved status, approver, gate result,
  phase, and pending checkpoint, and matches `approvalManifestSha256`.
- `approvedArtifacts` lists every changed or untracked file authorized for the
  checkpoint, including the manifest, with its raw-file SHA-256, intended Git
  mode, and clean-filtered Git blob object ID.
- Before staging, the hook requires the repository's complete changed-file set to
  equal `approvedArtifacts` and rechecks every digest.
- Before commit, the hook requires the staged-file set to equal
  `approvedArtifacts`; deletions and type changes are included.
- Every staged Git mode and blob object ID must match the approved marker, which
  detects staged-byte, line-ending normalization, type, and executable-mode changes.
- Expiration is later than approval and no more than two hours afterward.
- Commands are exact; separators, pipes, redirects, and arbitrary Git commands
  are rejected.
- Both authorization markers are ignored by Git and must never enter a checkpoint.
- The human removes the marker after the checkpoint and updates the manifest with
  the resulting commit in a separately approved follow-up checkpoint record.
