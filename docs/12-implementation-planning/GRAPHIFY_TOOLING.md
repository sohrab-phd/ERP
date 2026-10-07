# Graphify local navigation tooling

Installed/reviewed 2026-10-07 under the Owner's explicit developer-tool mandate.
This changes no ERP business behavior, dependency pins or implementation scope.

## Reviewed release and installation

- Official source: https://github.com/Graphify-Labs/graphify, tag `v0.9.79`,
  commit `f765dcb3415d60fcfce390868da49e77894f2dc2`.
- Official PyPI package: https://pypi.org/project/graphifyy/ (`graphifyy`, double y).
- Reviewed wheel SHA-256:
  `51969b5ab321e369120d2d87ca1f42a169002a82bb2dad1dd7c03ee3b8773c65`.
  PyPI artifact hashes checked; release installation, entrypoint, extraction and
  Markdown source files compared byte-for-byte with the upstream tag.
- `uv tool install graphifyy==0.9.79 --no-build --no-python-downloads --default-index https://pypi.org/simple`;
  subsequently `uv tool install "graphifyy[sql]==0.9.79"` with the same safety flags
  enabled the local `tree-sitter-sql` parser (0.3.11). Python 3.13 isolated uv tool
  environment; 31 wheel packages. No ERP Python/Node manifest changed.
- Ran the required `graphify install --project --platform codex` from this root.
  It installed `.codex/skills/graphify/` and also appended AGENTS instructions and
  registered a no-op hook. Those two additions were restored before adaptation.
- The installed Codex entrypoint now points to the concise native-discovery
  [project skill](../../.agents/skills/graphify/SKILL.md). Upstream reference
  sidecars, version stamp and license notices remain under `.codex/skills/graphify/`.
  One optional-navigation AGENTS link keeps that file at 33 lines. Existing
  workflow, six ERP skills and `.codex/hooks.json` are unchanged.

## Privacy and operating behavior

Use the project skill's Windows PowerShell commands. Its build helper calls
Graphify's deterministic structural extract/build/cluster/JSON export APIs;
it does not run semantic document extraction or a model backend. It includes
tracked TypeScript/JavaScript, SQL, Markdown and JSON only. Markdown coverage is
headings, frontmatter, local links and code mentions, not semantic interpretation.
It excludes authority/unlock folders, local secrets, generated files and skill
resources. Gitignored/untracked files are not indexed. Rebuild after committing
new source files to include them; source hashes and HEAD are recorded locally.

The helper rejects DNS/connect/send network audit events. Negative DNS and
connection probes both failed with the intended local-indexing error. No ERP
source or documents were sent to external services for indexing. Network use
was official GitHub/PyPI metadata and package downloads only; no privileged
install operations, OS configuration changes or repository-data export found.

Upstream supports optional remote AI document/media processing, Google document
fetching, database exports, hosted services and external URL ingestion; none are
configured or invoked here. HTML export loads a CDN script, so no HTML is generated.
Queries/path/explain traverse local JSON; examples disable optional query logging
with `GRAPHIFY_QUERY_LOG_DISABLE=1`. No Git hooks, MCP service, watch process,
always-on interception or automatic upgrade is installed/enabled.

`graphify-out/` (graph, extraction cache, source hashes, interpreter/root pointers,
summary) is ignored. `.graphifyignore` also excludes local generated/authority
folders. Commit skill/configuration/helper/receipt files, never generated data.

## Verification and limits

- Initial offline build: 343 files, 2,981 nodes, 4,424 edges; 2,591 document,
  227 implementation-code and 7 SQL nodes.
- Code/document queries, document-heading explanation, `kernel.command_outcome`
  table explanation and the directed `composition-root.ts -> PostgresTransactions`
  import path succeeded. SQL audit/outcome relationships are navigable.
- Six files emitted no symbols; paths/inferred imports can be incomplete or
  misleading. Broad queries truncate to their token budget. Inspect the original
  files for conclusions; graph edges are evidence for navigation, not business truth
  or a substitute for the module-boundary checker.
- Both skill frontmatters validated. Independent safety review: PASS, required
  local-only/Windows/no-hook mitigations applied. No blocking findings remained.
- Frozen Windows Node 24.21.0/npm 11.19.0: preflight, formatting, lint, module
  boundaries (38 files), TypeScript build and all 46 unit tests passed; zero skips.
  The machine's older default Node was rejected correctly, then the retained
  checksum-verified Windows runtime was used. No Linux/WSL validation performed.
- Persistence/transaction behavior and product source are unchanged; PostgreSQL
  integration tests were not rerun for this tooling-only change. Existing slice
  acceptance evidence remains in [the implementation report](SLICE_ENVELOPE_IMPLEMENTATION_REPORT.md).
- `git diff --check` passed; generated graph ignored; no remote push performed.

Upgrade explicitly only after repeating source/package/network review. Never
follow upstream Bash, implicit upgrade or external semantic-indexing examples
in preference to the project skill policy. Accepted ADRs/domain sources/code
remain authoritative; Graphify cannot authorize implementation or close OQs.
