---
name: graphify
description: Navigate ERP architecture, implementation dependencies, SQL and documentation links with the local Graphify graph; use before substantial impact analysis or repeated broad repository reads.
---

# Graphify for this ERP

Use the pinned Graphify 0.9.79 isolated uv tool. This project policy overrides
upstream Bash, semantic extraction, backend selection and automatic upgrade instructions.
Windows PowerShell only; do not use WSL. Do not upload ERP content for indexing,
configure AI/API backends, export to hosted databases, or install Git/Codex hooks.
Do not upgrade implicitly. Accepted sources and code outrank inferred graph edges.

Build/rebuild from the repository root (tracked files only, no network):
```powershell
$toolRoot = (uv tool dir).Trim()
$graphifyPython = Join-Path $toolRoot 'graphifyy/Scripts/python.exe'
& $graphifyPython .agents/skills/graphify/scripts/build-local.py
```

The script includes deterministic Markdown headings, links and code mentions,
and local SQL parsing. It does not perform semantic document/media extraction.
PDF/Office/media are intentionally not indexed. It excludes local secrets,
unlocks, generated output and tooling instruction folders. Data stays in ignored
`graphify-out/`. Rebuild after relevant source/document edits, then query:
```powershell
$env:GRAPHIFY_QUERY_LOG_DISABLE = '1'
$graphifyExe = Join-Path ((uv tool dir --bin).Trim()) 'graphify.exe'
& $graphifyExe query 'executeCommand transaction' --budget 1500
& $graphifyExe explain 'executeCommand'
& $graphifyExe path 'composition-root.ts' 'PostgresTransactions'
```

Use the graph for dependency tracing, command locations, coupling, API/database
relationships and refactoring impact. Query exact labels discovered in the graph.
Inspect source when edges are ambiguous, absent or stale; absence proves nothing.
Consult only relevant canonical docs. Never use graph inference to close OQs.

The official installer payload and reference sidecars are retained at
[.codex/skills/graphify](../../../.codex/skills/graphify/SKILL.md).
They are reference material; this Windows/local policy takes precedence.
No always-on hook is needed. The receipt is
[GRAPHIFY_TOOLING.md](../../../docs/12-implementation-planning/GRAPHIFY_TOOLING.md).
