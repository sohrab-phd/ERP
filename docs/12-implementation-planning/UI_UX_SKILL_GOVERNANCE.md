---
id: TOOL-UIUX-001
title: UI UX Pro Max provenance, security and reproducible local workflow
phase: 12-implementation-planning
status: accepted
version: 1.0.0
owners: [delivery-lead, security-architect]
depends_on: [APR-049, AI-RULE-001, PLAN-DEV-WORKFLOW-001]
last_reviewed: 2026-11-07
approval: Explicit Owner UI/UX Skill Governance and Reproducibility directive in this chat
---

# Reviewed UI/UX development skill

The Owner authorized tooling and governance maintenance from acceptance-record
commit `297eaea614bc891966626115f77e8bb33b263257` on `main`. P4a remains accepted
at `6c0fbbbed05eeb81ccf7564b2bbd7cfc7caebf10` under APR-049. This work resolves
the local skill reproducibility gate for future frontend work. P4b discovery,
design and implementation still require their separate Owner directive.

## Provenance and license

The reviewed source is the public, non-fork repository owned by NextLevelBuilder.
The installed 74-file payload matches its complete `.claude/skills/ui-ux-pro-max`
subtree at commit `b7d5353e0130feb8c5574ef1251f8a1db1873ccb` after CRLF-to-LF
comparison. The pinned root `skill.json` declares version `2.15.0` and MIT licensing.
All original installed files use Windows CRLF. Their original bytes are retained.
[Pinned source](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/tree/b7d5353e0130feb8c5574ef1251f8a1db1873ccb/.claude/skills/ui-ux-pro-max).

The original local `skills-lock.json` folder hash was
`3bf6ba3aead8c890cb3cb43480b8588a9dc292465204795b10a66b62504ad1d2`, and it matches
the installed bytes using the inspected skills CLI hashing algorithm. A locally
cached skills CLI version 1.7.6 and the project lock shape are consistent with a
skills CLI installation. The exact historical installer command and fetched Git
revision were not retained. The present pin establishes the matching reviewed
source snapshot without claiming an unrecorded installation history.

MIT permits use, modification and redistribution with its copyright and permission
notice retained. The missing root upstream notice is now included verbatim as
[LICENSE](../../.agents/skills/ui-ux-pro-max/LICENSE). The vendored package has 75
files, the 74 existing source files plus that license. Font and icon catalogs are
metadata and recommendations. Their existing upstream provenance/license metadata
is retained. The package includes no font binaries or icon image assets.
[Pinned upstream license](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/b7d5353e0130feb8c5574ef1251f8a1db1873ccb/LICENSE).

## Reproducibility decision

The reviewed copy is vendored at
[.agents/skills/ui-ux-pro-max](../../.agents/skills/ui-ux-pro-max/SKILL.md).
This adds approximately 3.7 MB of source and data and provides offline discovery,
search and design-system generation from tracked contents. A pinned external
installer would reduce repository size but require upstream access and an
additional installer trust chain on a new workstation. Vendoring fits this
project's offline review workflow. No automatic installation or update is used.

[skills-lock.json](../../skills-lock.json) records the upstream revision and
version, installation path, original hash, MIT license and SHA-256 of every file.
Its combined hash covers each relative path followed by raw bytes in the pinned
Node runtime's `localeCompare` order, matching the inspected CLI algorithm. The
added license changes that combined hash intentionally. The existing source bytes
are unchanged. The lock's added metadata is project-owned and is verified locally.
An external skills CLI is not needed to restore or verify this copy.

The scoped [Git attributes](../../.gitattributes) preserve vendor bytes through
checkout and archive, including CRLF. The existing upstream trailing spaces in
`scripts/design_system.py` have a file-specific whitespace exception. Other
vendor files retain normal whitespace checks with CRLF recognized. Authored
project files retain their existing rules. Per-file hashes guard the vendor copy.

## Security and instruction boundaries

Independent static review inspected all 74 original UTF-8 text files. It found no
binaries, caches, symlinks, NUL bytes or focused credential/private-key signatures.
The five runtime/validation modules use Python standard-library and sibling
imports. They contain no network client, process launch, dynamic evaluation or
package installer. Ordinary search reads only the bundled data and prints the
query and recommendations. `COLORTERM` is the only runtime environment lookup.
Queries must contain generic design terms rather than private ERP data.

`--persist` writes Markdown to the explicitly selected output directory. Existing
master files are skipped unless `--force` is supplied. Slugged project/page names
and atomic file publication constrain the normal persistence workflow. Use a
reviewed workspace output path. `--force` requires explicit approval for the actual
overwrite. Search output can suggest external fonts, CDN URLs, framework examples
and unpinned package commands. The search code does not execute these examples.
Their presence grants no permission to install or integrate them.

[AGENTS.md](../../AGENTS.md) requires the complete skill and applicable supporting
references for UI/UX work. Owner authorization, accepted architecture/contracts,
RBAC, customer isolation, security and database integrity control every decision.
Keep the native Persian RTL industrial ERP shell and established visual language.
Design-system output is advisory. Frameworks, dependencies, external fonts/services
and replacement design systems need explicit approval. Validate actual interfaces
in a browser under the relevant capability's scope.

## Windows workflow from a clean checkout

Prerequisites are the project's frozen Node 24.21.0 runtime and an existing
Python interpreter. Direct runtime checks use Python 3.12.12 in isolated mode with
site packages, environment imports and bytecode writes disabled. The skill has no
third-party Python dependencies. This repository does not vendor interpreters.

Run the read-only package verifier first. It checks exact inventory and content
hashes, discovery instructions, required supporting files and the license, and
rejects linked directories or files.

```powershell
node tools/skills/verify-ui-ux-pro-max.mjs
$skill = (Resolve-Path '.agents/skills/ui-ux-pro-max/scripts').Path
$python = 'C:\path\to\reviewed\python.exe'
$launcher = 'import runpy,sys; entry=sys.argv.pop(1); sys.path.insert(0,entry.rsplit("/",1)[0]); runpy.run_path(entry,run_name="__main__")'
$search = (Join-Path $skill 'search.py').Replace('\','/')
& $python -I -B -S -X utf8 -c $launcher $search 'error summary validation' --domain ux --json
& $python -I -B -S -X utf8 -c $launcher $search 'minimal flat interface' --domain style --rtl=full --json
& $python -I -B -S -X utf8 -c $launcher $search 'warehouse inventory table' --design-system --json
```

Resolve `$python` to an already reviewed Windows interpreter. Upstream examples
using `CLAUDE_PLUGIN_ROOT` refer to the original plugin layout. Use the resolved
repository path above. The ERP uses native HTML/CSS/TypeScript, so do not infer a
Tailwind or framework stack from the skill's available stack names. Persist only
when the authorized task needs an artifact, with an explicit `--output-dir`.

## Validation and independent review

The package was reviewed before executing its code. Verification covers a clean
staged Git snapshot extracted into an isolated directory, package hashes, generic
search, RTL search, non-persisting design-system generation, data validation and
the self-contained upstream tests. Tampered content and extra files must fail the
read-only verifier. Clean reproduction uses tracked contents and existing runtimes
without upstream access, package installation or ERP environment files.

The staged Git tree was exported as an archive into an isolated clean directory.
The copy passed exact inventory/hash verification, rejected tampered content and
an unexpected file, and remained unchanged after execution. Search returned the
Focusable Error Summary rule for the targeted UX query. The style query returned
Minimalism & Swiss Style with full RTL support. Design-system generation returned
advisory output with no persistence. Data validation passed all 12 domain files,
22 stack files and `ui-reasoning.csv`. All 150 tests in the ten self-contained
upstream modules passed with zero failures, errors or skips.

Four installed upstream test modules depend on uninstalled repository-level
catalog maintenance/evaluation scripts. They are `test_catalog_refresh.py`,
`test_catalog_summary_line_endings.py`, `test_relevance_evaluator.py` and
`test_skill_script_paths.py`. They remain byte-for-byte source copies outside
the self-contained test run. Full upstream repository test discovery is not claimed.

The test parent used `-I -B -S -X utf8`. Three modules launch the copied search
script through subprocesses. Those children use a scrubbed environment with
private TEMP/TMP, no PYTHONPATH, UTF-8, user-site disabled and bytecode disabled.
They retain normal system-site startup and do not inherit the parent's isolation
flags. This is a temporary validation setup with no persistent hooks or OS changes.

The local receipt and complete test output are
`artifacts/tests/ui-ux-pro-max-review/validation.json` and
`artifacts/tests/ui-ux-pro-max-review/self-contained-tests.log`. The receipt also
records the exported Git tree and runtime versions. Independent source review
verified provenance, licensing, the lock/verifier and project compatibility.
Final independent re-review inspected the receipt and complete test log and found
no blocking or required findings. It confirmed that the tested and final staged
runtime, lock, AGENTS and Git attributes match exactly. Documentation validation
passed 8 Markdown files, 631 local links, 5 anchors and 107 metadata dependencies.
The original APR-000 through APR-049 sequence is unchanged.

## Updates and remaining gates

An update is a separate reviewed tooling change. Obtain an explicit commit from
the same upstream, inspect the changed source and license, compare the payload,
refresh the lock deliberately and rerun clean-copy checks. Never follow a moving
branch or run `npx skills update` as an automatic project setup step. Content hashes
detect drift and do not replace review of a deliberately changed lock or source.

Existing APR acceptance records retain their historical facts. This tooling record
documents the Owner-authorized resolution of the reproducibility limitation.
It creates no product acceptance or P4b authorization. APR-049's representative
migration-wide write-overhead measurement remains required before deployment or
operational performance acceptance.
