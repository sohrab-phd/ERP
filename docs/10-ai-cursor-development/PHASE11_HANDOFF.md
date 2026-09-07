---
id: AI-P11-HANDOFF-001
title: Phase 10 to Phase 11 Handoff
phase: 10-ai-cursor-development
status: approved
version: 0.4.0
owners: [chief-solution-architect]
depends_on: [AI-AUTH-001, ASM-023, APR-012]
last_reviewed: 2026-09-07
approval: APR-012
supersedes: null
---

# Phase 10 to Phase 11 Handoff

This is a Phase 10 design artifact. Phase 10 is approved as APR-012.
Phase 11 structure drafting is authorized by
[CURRENT_PHASE.md](../00-governance/CURRENT_PHASE.md). The APR-012 Git
checkpoint is pending. This handoff does not authorize implementation
or an unlock file.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Inherit from Phase 10

- Agent authority:
  [AGENT_AUTHORITY.md](AGENT_AUTHORITY.md)
- Rule catalogue:
  [RULE_AND_SKILL_CATALOGUE.md](RULE_AND_SKILL_CATALOGUE.md)
- Prompt standards:
  [IMPLEMENTATION_PROMPT_STANDARDS.md](IMPLEMENTATION_PROMPT_STANDARDS.md)
- Review kinds:
  [HUMAN_AND_INDEPENDENT_REVIEW.md](HUMAN_AND_INDEPENDENT_REVIEW.md)
- Tool/safety labels:
  [TOOL_MCP_HOOK_SAFETY.md](TOOL_MCP_HOOK_SAFETY.md)
- Acceptance labels:
  [GENERATED_CODE_ACCEPTANCE.md](GENERATED_CODE_ACCEPTANCE.md)

## What Phase 11 may draft after Phase 10 approval

| Draft | Allowed after Phase 10 approval | Must stay open |
| --- | --- | --- |
| Integrated contradiction review | Yes | Closing OQ rows without answers |
| Traceability coverage report | Yes | `TEST-*` catalogue (FIND-028) |
| End-to-end walkthroughs as labels | Yes | Named UAT people (OQ-019) |
| Risk, operability, security, small-team review | Yes | Extra MCP/runtime products |
| Application code to “prove” the design | No | Implementation unlock |
| An unlock file or checkpoint marker invented by an agent | No | Human-only files |

## Must not do after this handoff

- Close or answer OQ-001 through OQ-019 without a register update
- Accept ADR-0006 through ADR-0008 or any package
- Create application source or an unlock file
- Start Phase 12 before explicit Phase 11 approval
- Treat `REV-AGENT` as Phase 11 independent review
- Treat “Ok, Continue” as Phase 11 approval
