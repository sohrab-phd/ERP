---
id: VAL-INT-001
title: Independent Integrated Review
phase: 11-architecture-validation
status: approved
version: 0.3.0
owners: [independent-reviewer]
depends_on: [APR-012, APR-013, ASM-024, SM-INV-001, APP-ORCH-001, SEC-VER-001]
last_reviewed: 2026-09-07
approval: APR-013
supersedes: null
---

# Independent Integrated Review

A Phase 11 **structure** pass across Phases 02–10. Phase 11 is
approved as APR-013. This is not a named reviewer (OQ-019) and not
application proof. `REV-AGENT` cannot stand in for the Project Owner.

`IMPLEMENTATION_AUTHORIZED` remains `false`.

## Method

Read-only consistency across approved baselines APR-004 through
APR-012, plus the Phase 11 walkthrough and coverage drafts. Same-session
authorship is an independence limit. No code, unlock, or extra MCP was
generated to “verify” the design.

This pass is the integrated content review. The phase-gate
[INDEPENDENT_REVIEW.md](INDEPENDENT_REVIEW.md) then judges whether this
package is ready for the Project Owner.

## Cross-baseline checks

| Claim | Where it must stay true | Result |
| --- | --- | --- |
| One Ledger writer | INV-001/017/018; `ACT-IPS`; APP-MOD-001 Inventory Posting; `CONF-IPS`; adapters command; `TASK-IMPL` | Holds as structure |
| Balance and Genealogy are projections | DATA-GEN-001; INV-019; `CONF-FORBID`; restore rebuild; no `EditGenealogy` / `AdjustBalance` | Holds as structure |
| DATA-TX-001 unsplittable | APP-ORCH-001; adapter catalogue; `CONF-BUNDLE`; `QA-SCN-BUNDLE`; `TASK-IMPL` | Holds as structure |
| UI is not a trust boundary | INV-015; SV-001; `ui-operator` | Holds as structure |
| Worker is not commander | SV-009; `host-worker`; adapter-run identity | Holds as structure |
| Customer isolation | SV-005 / SV-012; `CONF-ISO`; `ADP-LIVE` / `ADP-REPORT` / `ADP-GL-EXPORT` | Holds as structure |
| MVP portal order write rejected | INV-020; `ADP-PORTAL`; `CONF-FORBID` | Holds as structure |
| Finance-Lite is not legal GL | ASM-010; OQ-012; `ADP-GL-EXPORT` | Holds as structure |
| Open guards reject, they do not guess | ASM-016; SV-010; `QA-SCN-REJECT-OPEN` | Holds as structure |
| Agents draft; humans approve | `AG-ARCH` / `AG-UNLOCK` never; `REV-AGENT` cannot approve; marker and unlock human-only | Holds as structure |
| Only accepted tech ADR | ADR-0001 Node.js + TypeScript | Holds as structure |
| Sales cancel/hold is not a closed SoD pair | APR-008 residual | Holds as an explicit non-pair, not a silent SoD |
| `AbortProductionOrder` routing/authority | cites OQ-003 as `GUARD_OPEN_POLICY` | Holds as open guard |
| Inquiry/Quotation expiry | `workshop-commercial-practice` (FIND-026), not a new OQ | Holds as registered practice, not a freeze |
| `kern-command` / shared kernel | not a library product; OQ-018 | Holds as label |
| `BR-IMPL` | does not exist until unlock | Holds as absence |

## Draft correction found in this phase

An earlier Phase 11 walk table treated dispatch as a fifth happy path
(`WALK-DELIVER`) and described SEQ-STOCK as “issue / receipt”. That
disagreed with SM-SEQ-001. The walkthroughs now map 1:1 to SEQ-STOCK /
PURCHASE / MAKE / NOT-FEASIBLE, with dispatch as SEQ-STOCK step 7 and
issue/receipt on SEQ-MAKE / SEQ-PURCHASE. No approved baseline was
suspect. See [CORRECTIVE_ACTIONS.md](CORRECTIVE_ACTIONS.md).

## Open guards (not defects of this pass)

Unanswered OQ-001 through OQ-019 remain `GUARD_OPEN_POLICY` on the
commands that need them. FIND-028 forbids minting `TEST-*`. Named
people stay OQ-019. Products stay OQ-018.

## Verdict of this pass

No in-scope Critical/High **structure contradiction** was found among
the approved baselines. FIND-037 is `resolved` by APR-013 / ASM-024.

## Must not decide here

- Closing any `OQ-*`
- A named independent reviewer product
- Application code as evidence
- Starting Phase 12
